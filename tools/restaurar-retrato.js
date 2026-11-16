#!/usr/bin/env node
'use strict';

/*
 * restaurar-retrato.js — o último retrato de uma escola volta para o repositório (16/11/2026).
 *
 * O QUE ELE FAZ. Quando uma escola é expurgada, o commit do expurgo APAGA os documentos dela; o
 * commit ANTERIOR ainda os tem todos. Este comando lê esse ponto, escolhe o que cabe na capacidade
 * contratada e escreve os ficheiros de volta em `escola/<slug>/envelopes/` — com o `.indice.json`
 * do acervo filtrado, para não haver duas versões dos mesmos resumos.
 *
 * A REGRA DA CAPACIDADE É DO NÚCLEO (`motor/nucleo/retrato.js`), e é a que ela decidiu: «avisa que
 * dados serão perdidos e pergunta se quer mesmo esse; sim, então restaura com a capacidade do que
 * está sendo contratado; não, então a pessoa escolhe outro plano. A escolha do que fica é
 * sequencial em ordem decrescente. Ou seja, recupera os mais recentes.» Aqui não se decide nada —
 * escolhe-se o ponto no tempo, pede-se a decisão ao núcleo, e escreve-se.
 *
 * ONDE ELE CORRE, e porquê aqui. No runner do `criar-escola.yml`, depois de o motor subir e antes
 * do commit do scaffold: é o único sítio com o repositório inteiro à mão (`git show` de um commit
 * arbitrário), e é o único em que a restauração entra no MESMO commit que os índices derivados —
 * regerar os índices sem os envelopes restaurados daria um acervo a mentir sobre o que existe.
 *
 * ONDE ESTÁ O RETRATO, e há duas respostas porque há duas eras. O elo do expurgo passou a guardar
 * `commit_antes` a 16/11/2026; os expurgos de antes não o têm. Para esses, o ponto encontra-se no
 * Git: o commit que APAGOU (`--diff-filter=D`) é o expurgo, e o pai dele é o retrato. Sem esta
 * segunda via, as escolas apagadas ontem não teriam retrato nenhum — e a primeira que ela quis
 * trazer de volta é uma delas.
 *
 *   node tools/restaurar-retrato.js --escola duo --professores 6 --alunos 90
 *   node tools/restaurar-retrato.js --escola duo --professores 6 --alunos 90 --seco
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const retrato = require(path.join(RAIZ, 'motor/nucleo/retrato.js'));

function argumento(nome, porOmissao) {
  const i = process.argv.indexOf('--' + nome);
  if (i === -1) return porOmissao;
  const valor = process.argv[i + 1];
  return valor === undefined ? true : valor;
}

function git(args, opcoes) {
  return execFileSync('git', args, Object.assign({ cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }, opcoes || {}));
}

/**
 * O COMMIT QUE VEIO DE FORA, e que o runner tem de ir buscar (16/11/2026).
 *
 * O `actions/checkout` faz um CLONE RASO (`fetch-depth: 1`): o commit do retrato não está lá, e um
 * `git show` sobre ele falha com «bad object». Quem sabe o commit é o Worker — que o resolveu ao
 * emitir o convite, e o passou como input —, e aqui o que se faz é buscá-lo: um `fetch --depth=1`
 * por SHA, que o GitHub serve. Sem esta linha, a restauração só funcionaria em quem tem o
 * repositório inteiro à mão — ou seja, em mim, e não no sítio onde ela corre.
 */
function garantirCommit(commit) {
  try {
    git(['cat-file', '-e', commit + '^{commit}']);
    return true;
  } catch (erro) { /* não está no clone raso — busca-se */ }
  try {
    git(['fetch', '--depth=1', 'origin', commit]);
  } catch (erro) {
    try { git(['fetch', '--depth=1', 'origin', commit], { stdio: 'pipe' }); } catch (e2) { return false; }
  }
  try {
    git(['cat-file', '-e', commit + '^{commit}']);
    return true;
  } catch (erro) { return false; }
}

/** O commit cujo estado ainda tinha a escola inteira. `null` quando não há como o saber. */
function commitDoRetrato({ escola, elo, commitPedido }) {
  /* 0. O QUE VEIO DO WORKER — o caminho próprio no runner, porque é o único que já resolveu o
   *    problema do clone raso e o do expurgo antigo. */
  if (commitPedido) {
    const sha = String(commitPedido).trim();
    if (!/^[0-9a-f]{7,40}$/i.test(sha)) return null;
    if (garantirCommit(sha)) return { commit: sha, origem: 'worker' };
  }
  /* 1. O QUE O ELO DIZ — o caminho próprio, e o único que não adivinha. */
  const expurgos = (elo && Array.isArray(elo.expurgo)) ? elo.expurgo : [];
  for (let i = expurgos.length - 1; i >= 0; i -= 1) {
    const apontado = String((expurgos[i] && expurgos[i].commit_antes) || '').trim();
    if (apontado) return { commit: apontado, origem: 'elo' };
  }
  /* 2. O QUE O GIT SABE — para os expurgos de antes de o elo guardar o campo. O último commit que
   *    APAGOU ficheiros do acervo da escola é o expurgo; o retrato é o pai dele. */
  try {
    const daPasta = git(['log', '-1', '--diff-filter=D', '--format=%H', '--',
      'escola/' + escola + '/envelopes/']).trim();
    if (daPasta) {
      const pai = git(['rev-parse', daPasta + '^']).trim();
      if (pai) return { commit: pai, origem: 'git', expurgo: daPasta };
    }
  } catch (erro) { /* sem histórico: não há retrato, e o chamador diz isso */ }
  return null;
}

/** Os nomes de ficheiro do acervo da escola naquele commit, sem o `.indice.json`. */
function ficheirosDoRetrato({ escola, commit }) {
  const pasta = 'escola/' + escola + '/envelopes/';
  let saida = '';
  try {
    saida = git(['ls-tree', '-r', '--name-only', commit, '--', pasta]);
  } catch (erro) { return []; }
  return saida.split('\n')
    .map((l) => l.trim())
    .filter((l) => l && /\.json$/.test(l) && !/\/\.indice\.json$/.test(l))
    .map((l) => ({ caminho: l, nome: l.slice(pasta.length) }))
    .filter((f) => f.nome && f.nome.indexOf('/') === -1);
}

function lerDoCommit({ commit, caminho }) {
  try { return git(['show', commit + ':' + caminho]); } catch (erro) { return null; }
}

function principal() {
  const escola = String(argumento('escola', '')).trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(escola)) {
    console.error('restaurar-retrato: informe --escola <slug> (minúsculas, dígitos e hífen)');
    process.exit(2);
  }
  const capacidade = {
    professores: Number(argumento('professores', 0)) || 0,
    alunos: Number(argumento('alunos', 0)) || 0,
  };
  const seco = argumento('seco', false) === true;

  const caminhoElo = path.join(RAIZ, 'escola', escola, 'indice.json');
  let elo = null;
  try { elo = JSON.parse(fs.readFileSync(caminhoElo, 'utf8')); } catch (erro) { elo = null; }

  const achado = commitDoRetrato({
    escola, elo, commitPedido: String(argumento('commit', '') || '').trim(),
  });
  if (!achado) {
    console.log('restaurar-retrato: a escola «' + escola + '» não tem retrato conhecido — nada a restaurar.');
    return 0;
  }

  const caminhoIndice = 'escola/' + escola + '/envelopes/.indice.json';
  const textoIndice = lerDoCommit({ commit: achado.commit, caminho: caminhoIndice });
  let indice = null;
  try { indice = textoIndice ? JSON.parse(textoIndice) : null; } catch (erro) { indice = null; }

  const escolha = retrato.escolher(indice || { versao: 4, nomes: [], resumos: {} }, capacidade);
  const ficheiros = ficheirosDoRetrato({ escola, commit: achado.commit });
  const noIndice = new Set(retrato.listaDoIndice(indice || {}).map((d) => d.nome));
  /* UM FICHEIRO QUE O ÍNDICE NÃO LISTA NÃO SE ATRIBUI A NINGUÉM — e por isso não se descarta: a
   * dúvida não destrói. Vai para o relatório, e é restaurado como está. */
  const foraDoIndice = ficheiros.filter((f) => !noIndice.has(f.nome)).map((f) => f.nome);

  console.log('restaurar-retrato: «' + escola + '», retrato em ' + achado.commit.slice(0, 8)
    + ' (' + achado.origem + (achado.expurgo ? ', expurgo ' + achado.expurgo.slice(0, 8) : '') + ')');
  console.log('  capacidade contratada: ' + capacidade.professores + ' professor(es), '
    + capacidade.alunos + ' aluna(s)');
  console.log('  documentos no retrato: ' + escolha.documentos.total
    + ' — ficam ' + escolha.documentos.mantidos + ', saem ' + escolha.documentos.descartados);
  console.log('  professores: ' + escolha.professores.total + ' → ficam '
    + escolha.professores.mantidos.length
    + (escolha.professores.descartados.length
      ? ' (saem: ' + escolha.professores.descartados.join(', ') + ')' : ''));
  console.log('  alunas: ' + escolha.alunos.total + ' → ficam ' + escolha.alunos.mantidos.length
    + (escolha.alunos.descartados.length
      ? ' (saem: ' + escolha.alunos.descartados.join(', ') + ')' : ''));
  if (foraDoIndice.length) {
    console.log('  SEM RESUMO no índice (restaurados como estão, não se sabe de quem são): '
      + foraDoIndice.join(', '));
  }
  const aviso = retrato.fraseDoAviso(escolha);
  if (aviso) console.log('  AVISO: ' + aviso);

  if (seco) {
    console.log('  (seco: nada foi escrito)');
    return 0;
  }
  if (!escolha.documentos.total && !foraDoIndice.length) {
    console.log('  o retrato não tem documentos — nada a escrever.');
    return 0;
  }

  const destino = path.join(RAIZ, 'escola', escola, 'envelopes');
  fs.mkdirSync(destino, { recursive: true });

  const manter = new Set(escolha.mantidos.concat(foraDoIndice));
  let escritos = 0;
  const falharam = [];
  for (const f of ficheiros) {
    if (!manter.has(f.nome)) continue;
    const texto = lerDoCommit({ commit: achado.commit, caminho: f.caminho });
    if (texto === null) { falharam.push(f.nome); continue; }
    fs.writeFileSync(path.join(destino, f.nome), texto);
    escritos += 1;
  }
  /* O ÍNDICE TAMBÉM VOLTA, FILTRADO. Sem ele o acervo não lista os documentos restaurados, e o
   * `gerar-indices.js` — que corre no mesmo commit — escreveria um `indices/` sem eles. */
  if (indice) {
    fs.writeFileSync(path.join(destino, '.indice.json'), retrato.indiceFiltrado(indice, escolha));
  }
  console.log('  escritos ' + escritos + ' documento(s) em escola/' + escola + '/envelopes/'
    + (indice ? ' (e o índice do acervo, filtrado)' : ' (sem índice no retrato)'));
  if (falharam.length) {
    console.log('  NÃO foi possível ler: ' + falharam.join(', '));
    return 1;
  }
  return 0;
}

process.exit(principal());
