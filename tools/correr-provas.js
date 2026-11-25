#!/usr/bin/env node
'use strict';

/**
 * correr-provas.js — corre as provas de `experimentos/` em paralelo, com tecto de tempo, e diz o
 * resultado numa linha (24/11/2026).
 *
 * PORQUE EXISTE. Em 24/11/2026 havia **299 provas versionadas** e nenhuma forma de as correr
 * juntas que não fosse um laço à mão: o `pre-commit` não corria nenhuma, e o CI também não. O
 * resultado foi medido nesse dia — **125 das 299 falhavam**, e ninguém sabia, porque descobri-lo
 * custava meia hora de laço manual. Uma suite que não se corre não é um portão: é um arquivo.
 *
 * O QUE ELE FAZ, e o que NÃO faz:
 *
 *   · descobre as provas **versionadas** (`git ls-files`), e não as do disco — uma prova que não
 *     está no repositório não é uma prova de ninguém, é rascunho de quem a escreveu;
 *   · corre com **paralelismo** (o número de CPUs, ou `--paralelo=N`) e **tecto por prova**
 *     (`--tecto=N` segundos, 60 por omissão): uma prova que pendura não pendura a suite;
 *   · aceita `--mudou` — os caminhos que mudaram, um por linha ou por argumento — e corre só as
 *     provas que os referenciam. É o que torna o `pre-commit` possível: 299 provas custam minutos,
 *     e um commit que toca um ficheiro não deve pagar por todas;
 *   · aceita `--listar`, que imprime esse recorte e não corre nada: é o que torna o mapa
 *      verificável por uma prova (`provar-o-mapa-das-provas`), em vez de por confiança;
 *   · **não** julga se uma prova é boa. Ele diz quantas passam; quem lê decide o que fazer com as
 *     que não passam.
 *
 * COMO SE MAPEIA «mudou» → «que prova corre». A prova cita o módulo que mede: um `require` de
 * `motor/…`, um `tools/…` chamado por caminho, uma página de `porta/`. O mapa é esse — as
 * referências literais do ficheiro da prova. Não há heurística de grafo: uma prova que mede
 * `motor/servidor/producao.js` cita-o, e é isso que a torna encontravel. Uma prova que não cita
 * nada que mudou não corre — e é por isso que o nome do ficheiro mudado também conta (o próprio
 * caminho da prova).
 *
 *   node tools/correr-provas.js                      # todas
 *   node tools/correr-provas.js --mudou <f1> <f2>    # só as afectadas
 *   node tools/correr-provas.js --paralelo=8 --tecto=90 --verboso
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const os = require('node:os');

const RAIZ = path.resolve(__dirname, '..');
const PASTA = path.join(RAIZ, 'experimentos');

function opcao(nome, omissao) {
  const arg = process.argv.find((a) => a.startsWith('--' + nome + '='));
  return arg === undefined ? omissao : arg.slice(nome.length + 3);
}

const VERBOSO = process.argv.indexOf('--verboso') !== -1;
/* `--listar` DIZ O RECORTE E NÃO CORRE NADA (25/11/2026). Existe para o recorte poder ser medido —
 * por uma prova, e por quem estiver a depurar um `--mudou` que trouxe provas a mais ou a menos.
 * Sem ele, a única forma de saber o que foi seleccionado é correr tudo e ler a lista. */
const LISTAR = process.argv.indexOf('--listar') !== -1;

/**
 * A LINHA DE BASE — `experimentos/provas-vermelhas.json` (24/11/2026).
 *
 * PORQUE ELA EXISTE, e não é tolerância com defeito. A suite tem **95 provas vermelhas** por
 * dívida de manutenção (telas que mudaram, contratos que evoluíram) — nenhuma delas apagável sem
 * esconder sinal. Sem linha de base, o `pre-commit` recusaria TODO commit que tocasse em `motor/`,
 * e um hook assim é um hook que se salta com `--no-verify` — que salta **também** a âncora da
 * cadeia. O remédio seria pior do que a doença.
 *
 * O que a linha de base faz é separar as duas perguntas que estavam juntas:
 *
 *   · «esta prova falha?» — informação, e o número entra no resumo;
 *   · «esta prova PASSAVA e agora não?» — **regressão**, e é só isso que recusa o commit.
 *
 * E ela não esconde a outra direção: uma prova da linha de base que passa **é dita**, porque um
 * baseline que só cresce esconde a regressão seguinte. Quem a vê apaga-a da lista.
 */
const CAMINHO_DA_BASE = path.join(RAIZ, 'experimentos/provas-vermelhas.json');

function lerBase() {
  const caminho = opcao('base', CAMINHO_DA_BASE);
  if (!caminho || !fs.existsSync(caminho)) return null;
  try {
    const d = JSON.parse(fs.readFileSync(caminho, 'utf8'));
    const lista = Array.isArray(d) ? d : d.falham;
    return Array.isArray(lista) ? new Set(lista) : null;
  } catch (erro) {
    console.log('correr-provas: AVISO — a linha de base não é JSON legível (' + caminho + '); '
      + 'a corrida trata todas as falhas como regressão.');
    return null;
  }
}
const PARALELO = Math.max(1, Number(opcao('paralelo', String(os.cpus().length || 4))) || 1);
const TECTO = Math.max(1, Number(opcao('tecto', '60')) || 60);

/**
 * AS PROVAS VERSIONADAS. `git ls-files` e não `fs.readdir`: o que está no disco e não no
 * repositório é rascunho (é a regra da pasta, no `.gitignore`), e corrê-lo daria um vermelho que
 * ninguém pode reproduzir num clone.
 *
 * Sem git (uma cópia sem `.git`), cai para o disco — melhor do que não correr nada.
 */
function provasVersionadas() {
  const { execFileSync } = require('node:child_process');
  try {
    const saida = execFileSync('git', ['-C', RAIZ, 'ls-files', 'experimentos/provar-*.js'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
    return saida.split('\n').filter(Boolean).map((p) => path.join(RAIZ, p));
  } catch (erro) {
    if (!fs.existsSync(PASTA)) return [];
    return fs.readdirSync(PASTA).filter((f) => /^provar-.*\.js$/.test(f)).map((f) => path.join(PASTA, f));
  }
}

/** Os caminhos que mudaram: `--mudou a b c`, ou `--mudou` a ler o stdin (o `pre-commit` usa-o). */
function caminhosQueMudaram() {
  /* TODOS OS `--mudou=` CONTAM, E NÃO SÓ O PRIMEIRO (25/11/2026). Era `find`, que devolve o
   * primeiro — e o segundo era descartado em silêncio. Medido por `provar-o-mapa-das-provas`:
   * `--mudou=a --mudou=b` dava treze provas e `--mudou=b --mudou=a` dava dezanove, para o mesmo
   * par de caminhos. Um recorte que depende da ORDEM dos argumentos é a mesma família de erro das
   * datas em calendários diferentes: não falha, responde outra coisa. */
  const comIgual = process.argv.filter((a) => a.startsWith('--mudou=')).map((a) => a.slice(8));
  if (comIgual.length) return comIgual.join(',').split(/[\s,]+/).filter(Boolean);
  const i = process.argv.indexOf('--mudou');
  if (i === -1) return null;
  const resto = process.argv.slice(i + 1).filter((a) => !a.startsWith('--'));
  if (resto.length) return resto;
  try { return fs.readFileSync(0, 'utf8').split('\n').filter(Boolean); } catch (erro) { return []; }
}

/**
 * QUE PROVA REFERENCIA QUE FICHEIRO.
 *
 * A referência é literal no texto da prova: um `require('../motor/…')`, um caminho `tools/…`, uma
 * página de `porta/`. Compara-se o **fim** do caminho mudado com o texto — e a comparação é pelo
 * nome do ficheiro, e não pelo caminho inteiro, para o `../../motor/x.js` da prova casar com
 * `motor/x.js` do git.
 *
 * E O CAMINHO TAMBÉM PODE ESTAR EM PEDAÇOS (25/11/2026). Muitas provas escrevem
 * `require(path.join(RAIZ, 'motor', 'nucleo', 'derivar-ciclo.js'))`, e nesse texto a cadeia
 * `motor/nucleo/derivar-ciclo.js` **não existe** — existe `motor', 'nucleo', 'derivar-ciclo.js'`.
 * A comparação literal não a via, e a prova ficava invisível exactamente para o módulo que ela
 * mede: `provar-notacao` não era corrida quando se mexia no `derivar-ciclo.js`, que é o ficheiro
 * que ela existe para vigiar.
 *
 * A correcção é NORMALIZAR o texto da prova antes de comparar — as aspas e as vírgulas de um
 * `path.join` passam a barra —, e não enumerar as formas de escrever um caminho. Uma lista de
 * formas apodreceria no dia em que alguém usasse `join(RAIZ, 'a' + path.sep + 'b')`; a
 * normalização vale para a forma que existir.
 */
function referencia(prova, mudados) {
  let texto;
  try { texto = fs.readFileSync(prova, 'utf8'); } catch (erro) { return false; }
  /* `'motor', 'nucleo', 'x.js'` → `motor/nucleo/x.js`. A expressão apanha as aspas e a vírgula
   * que o `path.join` põe entre os segmentos, e é indiferente ao espaço. Uma barra invertida de
   * Windows, se alguma vez aparecer, também passa a barra. */
  const normalizado = texto.replace(/['"]\s*,\s*['"]/g, '/').replace(/\\\\/g, '/');
  for (const c of mudados) {
    const rel = String(c).trim();
    if (!rel) continue;
    if (texto.indexOf(rel) !== -1) return true;
    if (normalizado !== texto && normalizado.indexOf(rel) !== -1) return true;
    // `motor/servidor/raiz.js` na prova aparece como `../motor/servidor/raiz.js` ou só `raiz.js`.
    const partes = rel.split('/');
    if (partes.length > 1 && texto.indexOf(partes.slice(1).join('/')) !== -1) return true;
    if (partes.length > 1 && normalizado.indexOf(partes.slice(1).join('/')) !== -1) return true;
  }
  return false;
}

function correr(prova) {
  return new Promise((resolve) => {
    const inicio = Date.now();
    execFile(process.execPath, [prova], {
      cwd: RAIZ, timeout: TECTO * 1000, maxBuffer: 8 * 1024 * 1024, env: process.env,
    }, (erro, stdout, stderr) => {
      const ms = Date.now() - inicio;
      const saida = String(stdout || '') + String(stderr || '');
      if (!erro) return resolve({ prova, ok: true, ms, saida });
      const tecto = erro.killed === true || erro.signal === 'SIGTERM';
      return resolve({ prova, ok: false, ms, saida, tecto, codigo: erro.code });
    });
  });
}

/** A última linha com conteúdo — é a que diz «N/N asserções» ou o erro. */
function ultimaLinha(texto) {
  const linhas = String(texto || '').split('\n').map((l) => l.trim()).filter(Boolean);
  return linhas.length ? linhas[linhas.length - 1].slice(0, 160) : '(sem saída)';
}

/** Um resumo por causa: a linha que mais se repete entre as que falharam. */
function causa(prova, saida) {
  const t = String(saida || '');
  const enoent = /ENOENT[^\n]*\n[^\n]*'([^']+)'/.exec(t) || /ENOENT[^\n]*'([^']+)'/.exec(t);
  if (enoent) return 'lê um ficheiro que não existe: ' + enoent[1];
  if (/Cannot find module '([^']+)'/.test(t)) return 'módulo ausente: ' + /Cannot find module '([^']+)'/.exec(t)[1];
  if (/spawn (\w+) ENOENT/.test(t)) return 'não há ' + /spawn (\w+) ENOENT/.exec(t)[1] + ' no PATH';
  return ultimaLinha(t);
}

(async () => {
  const todas = provasVersionadas();
  const mudados = caminhosQueMudaram();
  const alvo = mudados ? todas.filter((p) => referencia(p, mudados) || mudados.indexOf(path.relative(RAIZ, p)) !== -1) : todas;

  if (!alvo.length) {
    console.log('correr-provas: nenhuma prova afectada'
      + (mudados ? ' pelos ' + mudados.length + ' caminho(s) que mudaram' : '') + '.');
    process.exit(0);
  }
  if (!todas.length) {
    console.log('correr-provas: nenhuma prova versionada.');
    process.exit(0);
  }

  console.log('correr-provas: ' + alvo.length + ' de ' + todas.length + ' prova(s)'
    + (mudados ? ' (filtradas por ' + mudados.length + ' caminho(s))' : '')
    + ', ' + PARALELO + ' em paralelo, tecto ' + TECTO + 's');

  if (LISTAR) {
    for (const p of alvo.slice().sort((x, y) => x.localeCompare(y))) {
      console.log(path.relative(RAIZ, p));
    }
    console.log('correr-provas: ' + alvo.length + ' de ' + todas.length + ' prova(s)'
      + (mudados ? ' (filtradas por ' + mudados.length + ' caminho(s))' : '') + ' — só a lista.');
    process.exit(0);
  }

  const inicio = Date.now();
  const resultados = [];
  let proximo = 0;
  async function trabalhador() {
    for (;;) {
      const i = proximo;
      proximo += 1;
      if (i >= alvo.length) return;
      // eslint-disable-next-line no-await-in-loop
      resultados.push(await correr(alvo[i]));
    }
  }
  await Promise.all(Array.from({ length: Math.min(PARALELO, alvo.length) }, trabalhador));
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

  const falhas = resultados.filter((r) => !r.ok);
  const tectos = falhas.filter((r) => r.tecto);
  const base = lerBase();
  const nome = (r) => path.basename(r.prova, '.js');
  const conhecidas = base ? falhas.filter((r) => base.has(nome(r))) : [];
  const regressoes = base ? falhas.filter((r) => !base.has(nome(r))) : falhas;
  const saradas = base
    ? resultados.filter((r) => r.ok && base.has(nome(r)))
    : [];
  if (VERBOSO) {
    for (const r of resultados.sort((a, b) => a.prova.localeCompare(b.prova))) {
      console.log('  ' + (r.ok ? 'ok   ' : 'FALHA') + ' ' + (r.ms / 1000).toFixed(1).padStart(5) + 's  '
        + path.relative(RAIZ, r.prova));
    }
  }
  if (regressoes.length) {
    console.log('');
    for (const r of regressoes.sort((a, b) => a.prova.localeCompare(b.prova))) {
      console.log('  ✗ ' + path.basename(r.prova)
        + (r.tecto ? '  (passou o tecto de ' + TECTO + 's)' : '')
        + (base ? '  ← REGRESSÃO (não está na linha de base)' : '')
        + '\n      ' + causa(r.prova, r.saida));
    }
    console.log('');
  }
  if (conhecidas.length && VERBOSO) {
    console.log('  (já vermelhas na linha de base: ' + conhecidas.length + ')');
    for (const r of conhecidas.sort((a, b) => a.prova.localeCompare(b.prova))) {
      console.log('  · ' + path.basename(r.prova));
    }
    console.log('');
  }
  if (saradas.length) {
    console.log('  AVISO: ' + saradas.length + ' prova(s) da linha de base passam agora — '
      + 'apague-as de experimentos/provas-vermelhas.json, senão a próxima regressão delas '
      + 'passa em silêncio:');
    for (const r of saradas.sort((a, b) => a.prova.localeCompare(b.prova))) {
      console.log('    - ' + nome(r));
    }
  }

  const resumo = 'correr-provas: ' + (resultados.length - falhas.length) + '/' + resultados.length
    + ' verde(s)' + (falhas.length ? ', ' + falhas.length + ' falha(s)'
      + (tectos.length ? ' (' + tectos.length + ' por tecto)' : '')
      + (base ? ' — ' + regressoes.length + ' regressão(ões), '
        + conhecidas.length + ' já conhecida(s)' : '') : '')
    + ' — ' + segundos + 's';
  console.log(resumo);
  process.exit(regressoes.length ? 1 : 0);
})();
