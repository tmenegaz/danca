#!/usr/bin/env node
'use strict';

/*
 * provar-lista-do-expurgo.js — o que o expurgo apaga vem da ÁRVORE, e não do índice
 * (18/11/2026).
 *
 * A PERGUNTA QUE ORIGINOU ISTO. Ao fechar uma frente, olhei o `escola/breu/indice.json` e vi o
 * campo `arquivos` a apontar para `professores/sapo-bailarino/…` — um professor que a `breu` não
 * tem. Escrevi, num commit, que «é a lista que o expurgo lê», corrigi a lista e disse que a mesma
 * deriva existia na `batata` e no `calango`. **A afirmação era falsa**: nenhum caminho de código
 * lê esse campo. O expurgo deriva o que apaga de `escolaDosCaminhos(slug, arvore)`, e só a
 * árvore conta.
 *
 * ISTO NÃO É UM DETALHE DE DOCUMENTAÇÃO. Se eu tivesse razão, uma escola expurgada deixaria o
 * pacote para trás; se eu não tinha, o campo é um objeto morto que PARECE autoridade — e um
 * objeto morto com forma de autoridade é o que faz alguém (eu, hoje) gastar uma sessão a
 * «corrigi-lo» e a escrever um relatório errado sobre o que ele faz. A diferença entre as duas
 * leituras decide se se apaga o campo ou se o mantém; logo, mede-se.
 *
 * O QUE SE MEDE:
 *
 *   A. A DERIVAÇÃO. `escolaDosCaminhos('breu', arvore)` devolve o config, o acervo, as linhas de
 *      base e o pacote — e não devolve o perfil do professor nem o config de outra escola.
 *   B. A PROVA DECISIVA. O expurgo corre com DOIS índices diferentes — um com `arquivos` a apontar
 *      para o professor errado (o defeito que ela mandou apagar) e outro sem o campo nenhum — e a
 *      lista de remoções que ele manda ao Git é a MESMA nas duas. É isto que torna o campo inerte.
 *   C. O CAMPO SAIU. Nenhum dos índices versionados carrega `arquivos` de topo, e o gerador
 *      (`tools/criar-escola.sh`) deixou de o escrever.
 *   D. O QUE FICA NO LUGAR. O elo do expurgo continua a registar o que foi apagado (`apagado`), e
 *      é esse o registro que sobrevive — a memória não se perdeu com o campo.
 *
 * O QUE CORRE É O `apagarEscolaDoRepo` DE VERDADE, com um GitHub falso e uma árvore falsa. Nada
 * toca no ar, e nenhuma escola de ensaio existe: a prova não apaga nada.
 *
 *   node experimentos/provar-lista-do-expurgo.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const repo = require(path.join(RAIZ, 'motor/servidor/repo-escola.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* A ÁRVORE DE UMA ESCOLA VIVA, com as quatro famílias que o expurgo tem de distinguir. O perfil
 * do professor fica de fora de propósito: ele NÃO se apaga (03/11/2026), e uma prova que não o
 * pusesse na árvore não mediria a guarda. */
const ARVORE = [
  'escola/breu/indice.json',
  'escola/breu/envelopes/.indice.json',
  'escola/breu/envelopes/anamnese-20261116-2201.json',
  'escola/breu/linhas-de-base/.indice.json',
  'escola/breu/linhas-de-base/ami--20261117-1709.json',
  'professores/demi-plie/ciclos/ciclo-01.conf',
  'professores/demi-plie/ciclos/ciclo-01-breu.conf',
  'professores/demi-plie/ciclos/ciclo-01-breu.fipp',
  'professores/demi-plie/ciclos/ciclo-01-breu/index.html',
  'professores/demi-plie/ciclos/ciclo-01-breu/assets/nav.js',
  'professores/demi-plie/ciclos/ciclo-01-breu/plano-observacao/index.html',
  'professores/demi-plie/contato.json',
  'professores/demi-plie/ciclos/ciclo-01-outra-escola.conf',
  'escola/outra/indice.json',
];

/**
 * O GITHUB FALSO — o mínimo para o caminho do expurgo andar até ao fim.
 *
 * Ele GUARDA o corpo do `POST /git/trees`, que é onde as remoções aparecem (`sha: null`). É essa
 * lista que se compara entre os dois índices; sem a guardar, a prova mediria a intenção do código
 * em vez do que ele manda ao Git.
 */
function githubFalso({ indice }) {
  const capturado = { remocoes: null, indiceGravado: null };
  const falso = async (url, init) => {
    const metodo = String((init && init.method) || 'GET').toUpperCase();
    const responde = (status, corpo) => ({ ok: status >= 200 && status < 300, status, json: async () => corpo });

    if (url.indexOf('/git/ref/heads/') !== -1) return responde(200, { object: { sha: 'commit-base' } });
    if (url.indexOf('/git/commits/') !== -1 && metodo === 'GET') {
      return responde(200, { sha: 'commit-base', tree: { sha: 'arvore-base' } });
    }
    if (url.indexOf('/git/trees/') !== -1 && metodo === 'GET') {
      return responde(200, { tree: ARVORE.map((p) => ({ path: p, mode: '100644', type: 'blob', sha: 'b' })) });
    }
    if (url.indexOf('/contents/') !== -1 && metodo === 'GET') {
      /* O CONTEÚDO VEM EM BASE64, como o GitHub o devolve. O índice é o do caso que se quer medir. */
      if (!indice) return responde(404, { message: 'Not Found' });
      return responde(200, {
        content: Buffer.from(indice, 'utf8').toString('base64'),
        encoding: 'base64',
        sha: 'sha-do-indice',
      });
    }
    if (url.indexOf('/git/trees') !== -1 && metodo === 'POST') {
      const corpo = JSON.parse(String((init && init.body) || '{}'));
      capturado.remocoes = (corpo.tree || []).filter((t) => t.sha === null).map((t) => t.path);
      const gravado = (corpo.tree || []).find((t) => t.content);
      capturado.indiceGravado = gravado ? JSON.parse(gravado.content) : null;
      return responde(201, { sha: 'arvore-nova' });
    }
    if (url.indexOf('/git/commits') !== -1 && metodo === 'POST') return responde(201, { sha: 'commit-novo' });
    if (url.indexOf('/git/refs/heads/') !== -1 && metodo === 'PATCH') {
      return responde(200, { object: { sha: 'commit-novo' } });
    }
    return responde(200, {});
  };
  return { falso, capturado };
}

function indiceCom(arquivos) {
  const base = {
    escola: 'breu',
    worker: 'lastro-teste',
    criado_em: '2026-11-01T10:00:00-03:00',
    professor: { slug: 'demi-plie', nome: 'Demi Plié' },
    responsavel: 'Demi Plié',
    ciclo: '01',
    senha: { chave: 'SENHA_BREU', arquivo: 'tools/.senhas-locais' },
    estado: { habilitada: true },
    shard: 'lastro-teste',
  };
  if (arquivos !== null) base.arquivos = arquivos;
  return JSON.stringify(base, null, 2) + '\n';
}

/* O ÍNDICE ERRADO — o que ela mandou apagar. É o conteúdo real do `escola/breu/indice.json`
 * antes desta sessão: professor `sapo-bailarino`, que a `breu` nunca teve. */
const ARQUIVOS_ERRADOS = [
  { caminho: 'professores/sapo-bailarino/ciclos/ciclo-01.conf', tipo: 'manifesto base' },
  { caminho: 'professores/sapo-bailarino/ciclos/ciclo-01-breu.conf', tipo: 'manifesto variante' },
  { caminho: 'professores/sapo-bailarino/ciclos/ciclo-01-{schema,po-schema,plano-schema,aula-schema,captura-schema}.json', tipo: 'schemas' },
  { caminho: 'professores/sapo-bailarino/ciclos/ciclo-01-breu/', tipo: 'pacote zero' },
];

async function expurgarCom(indice) {
  const { falso, capturado } = githubFalso({ indice });
  const r = await repo.apagarEscolaDoRepo({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    slug: 'breu', confirmacao: 'breu', motivo: 'prova', quando: '2026-11-18T12:00:00.000Z',
    fetchImpl: falso,
  });
  return { r, capturado };
}

(async () => {
  console.log('\nA · a derivação: o que a árvore declara ser da escola');

  const daEscola = repo.escolaDosCaminhos('breu', ARVORE);
  provar('o config e o pacote entram', daEscola.arquivos.indexOf('professores/demi-plie/ciclos/ciclo-01-breu/index.html') !== -1,
    daEscola.arquivos);
  provar('…e o acervo entra', daEscola.arquivos.indexOf('escola/breu/envelopes/.indice.json') !== -1);
  provar('…e a linha de base entra', daEscola.arquivos.indexOf('escola/breu/linhas-de-base/ami--20261117-1709.json') !== -1);
  provar('…e o PERFIL do professor NÃO entra', daEscola.arquivos.indexOf('professores/demi-plie/contato.json') === -1,
    'o perfil é da pessoa, não do tenant');
  provar('…nem o manifesta de OUTRA escola', daEscola.arquivos.indexOf('professores/demi-plie/ciclos/ciclo-01-outra-escola.conf') === -1);
  provar('e o professor e o ciclo saem dos próprios caminhos',
    daEscola.professor === 'demi-plie' && daEscola.ciclo === '01', [daEscola.professor, daEscola.ciclo]);

  console.log('\nB · a prova decisiva: o índice não muda o que se apaga');

  const comErrado = await expurgarCom(indiceCom(ARQUIVOS_ERRADOS));
  provar('o expurgo com o índice ERRADO entra', comErrado.r.ok === true, comErrado.r && (comErrado.r.erro || comErrado.r.motivo));
  const semCampo = await expurgarCom(indiceCom(null));
  provar('o expurgo sem o campo nenhum entra', semCampo.r.ok === true, semCampo.r && (semCampo.r.erro || semCampo.r.motivo));

  const remocoes = comErrado.capturado.remocoes || [];
  const semCampoRemocoes = semCampo.capturado.remocoes || [];
  provar('as duas remoções são a MESMA lista — o campo não participa',
    JSON.stringify(remocoes) === JSON.stringify(semCampoRemocoes),
    { comErrado: remocoes.length, semCampo: semCampoRemocoes.length });
  provar('…e a lista não está vazia (a prova estaria a comparar dois vazios)',
    remocoes.length >= 3, remocoes.length);

  /* O CONTEÚDO DA LISTA é o que decide se o campo podia ser a autoridade: se ele fosse lido, os
   * caminhos do `sapo-bailarino` apareceriam. Não aparecem — nem os certos que ele NÃO lista. */
  provar('nenhum caminho do professor errado é apagado',
    remocoes.every((c) => c.indexOf('sapo-bailarino') === -1),
    remocoes.filter((c) => c.indexOf('sapo-bailarino') !== -1));
  provar('e o pacote da escola ESTÁ na lista, mesmo com o índice a não o citar',
    remocoes.indexOf('professores/demi-plie/ciclos/ciclo-01-breu/index.html') !== -1, remocoes);

  console.log('\nC · o campo saiu do índice, e do gerador');

  {
    const { execSync } = require('child_process');
    let versionados = [];
    try {
      versionados = execSync('git ls-files "escola/*/indice.json"', { cwd: RAIZ, encoding: 'utf8' })
        .split('\n').map((l) => l.trim()).filter(Boolean);
    } catch (erro) { versionados = []; }
    provar('há índices de escola versionados para conferir', versionados.length > 0, versionados.length);
    for (const rel of versionados) {
      const indice = JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
      provar('o índice não carrega `arquivos` de topo: ' + rel,
        !Object.prototype.hasOwnProperty.call(indice, 'arquivos'),
        Object.keys(indice));
      /* O ELO CONTINUA A TER A LISTA DELE, e é essa a que vale: `expurgo[].apagado` é o registo do
       * que saiu, escrito no instante em que saiu. */
      const elos = Array.isArray(indice.expurgo) ? indice.expurgo : [];
      if (elos.length) {
        provar('…e os elos do expurgo guardam o que foi apagado: ' + rel,
          elos.every((e) => Array.isArray(e.apagado)), elos.map((e) => Array.isArray(e.apagado)));
      }
    }

    const criador = fs.readFileSync(path.join(RAIZ, 'tools/criar-escola.sh'), 'utf8');
    /* A ASSERÇÃO É SOBRE O BLOCO QUE ESCREVE O ÍNDICE, e não sobre o ficheiro: `arquivos` aparece
     * noutros sítios do script (nas mensagens), e proibir a palavra seria proibir a prosa. */
    const bloco = criador.slice(criador.indexOf('indice = {'), criador.indexOf('with open(arq, "w"'));
    provar('o gerador deixou de escrever o campo no índice',
      bloco.length > 0 && bloco.indexOf('"arquivos"') === -1,
      bloco.length ? 'o bloco ainda o escreve' : 'o bloco não foi encontrado');
  }

  console.log('\nD · a memória não se perdeu com o campo');

  {
    /* O ELO QUE ESTE EXPURGO GRAVOU — lido do conteúdo que foi mandado ao Git, e não do objeto em
     * memória: é o ficheiro que fica. */
    const gravado = comErrado.capturado.indiceGravado;
    provar('o índice novo traz um elo de expurgo', Boolean(gravado && gravado.expurgo && gravado.expurgo.length),
      gravado && gravado.expurgo && gravado.expurgo.length);
    const elo = (gravado && gravado.expurgo ? gravado.expurgo[gravado.expurgo.length - 1] : null) || {};
    provar('…que diz o que foi apagado', Array.isArray(elo.apagado) && elo.apagado.length > 0,
      elo.apagado && elo.apagado.length);
    provar('…e a lista do elo é a mesma que foi mandada ao Git',
      JSON.stringify(elo.apagado) === JSON.stringify(remocoes),
      { elo: (elo.apagado || []).length, git: remocoes.length });
    provar('…e a escola fica declarada como não habilitada',
      gravado && gravado.estado && gravado.estado.habilitada === false,
      gravado && gravado.estado);
  }

  console.log('');
  console.log(falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
