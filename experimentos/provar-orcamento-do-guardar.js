#!/usr/bin/env node
'use strict';

/**
 * provar-orcamento-do-guardar.js — o «Guardar» do PO cabe nos 50 subpedidos do Worker.
 *
 * O QUE ACONTECEU (08/11/2026). Ela percorreu a cadeia depressa — criar a aluna, a anamnese, o
 * elenco, a turma, o plano, o PO — e o «Guardar» do PO morreu a meio com «Too many subrequests by
 * single Worker invocation». O envelope entrou (`b7b5a66f`), o `-po.md` entrou (`06bd359d`) e as
 * fontes do ciclo NÃO: o pacote ficou com o `-po.md` a apontar para `po-…-0956` e o `-dados.json` a
 * descrever `po-…-2211`, e a geração seguinte recusou-o por isso.
 *
 * O TETO É DA PLATAFORMA, E NÃO SE NEGOCEIA: 50 subpedidos por invocação no plano gratuito (o
 * `limits.subrequests` do wrangler só pode SUBIR numa conta paga; no gratuito, 50 é o máximo). O
 * que se muda é o CUSTO — e o custo do escritor era N+1 por construção: um `POST /git/blobs` por
 * arquivo, um `GET` por nome de elo para saber se colidia.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. O CUSTO. Uma gravação completa contra um repositório com as fontes reais do ciclo da
 *      `batata`: ZERO `POST /git/blobs`, UMA listagem de `historico/`, e o total abaixo do teto.
 *   B. A RECUSA. Com o orçamento curto, o escritor recusa ANTES de escrever: nada de commits, nada
 *      de arquivos, e um motivo que nomeia o número — em vez de morrer a meio e deixar o ciclo
 *      meio gravado.
 *   C. O CONTADOR. `contarSubpedidos` conta o que sai, sabe o que resta, e escreve a frase que a
 *      tela mostra.
 *
 *   node experimentos/provar-orcamento-do-guardar.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const { criarEscritorDeCiclo } = require(path.join(RAIZ, 'motor/servidor/escrever-ciclo.js'));
const { contarSubpedidos, LIMITE_PADRAO } = require(path.join(RAIZ, 'motor/servidor/subpedidos.js'));

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const ler = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8');

/* O REPOSITÓRIO FALSO serve as fontes REAIS do ciclo: o que muda com o PO é o conteúdo delas, e
 * medir contra um fixture vazio mediria o fixture. As leituras vêm do disco, as escritas ficam em
 * memória, e tudo é contado. */
function gitFalso({ teto = 0 } = {}) {
  const chamadas = [];
  const escritos = {};
  const blobs = {};
  const base = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const u = String(url);
    chamadas.push({ metodo, url: u });
    const json = (o, status) => ({
      ok: (status || 200) < 300, status: status || 200,
      json: async () => o, text: async () => JSON.stringify(o),
    });
    if (u.includes('/git/ref/heads/main')) return json({ object: { sha: 'c0' } });
    if (/\/git\/commits\/c0$/.test(u)) return json({ tree: { sha: 't0' } });
    if (u.endsWith('/git/blobs') && metodo === 'POST') {
      // A FORMA ANTIGA (um blob por arquivo) também é servida: o contraprova corre este mesmo
      // ficheiro contra o escritor de antes, e uma bancada que só conhecesse a forma nova mediria
      // a bancada em vez do escritor.
      const corpo = JSON.parse(init.body);
      const sha = 'b' + chamadas.length;
      blobs[sha] = Buffer.from(String(corpo.content), 'base64').toString('utf8');
      return json({ sha }, 201);
    }
    if (u.endsWith('/git/trees') && metodo === 'POST') {
      const corpo = JSON.parse(init.body);
      for (const t of corpo.tree || []) {
        if (t.content !== undefined) escritos[t.path] = String(t.content);
        else if (t.sha && blobs[t.sha] !== undefined) escritos[t.path] = blobs[t.sha];
      }
      return json({ sha: 't1' }, 201);
    }
    if (u.endsWith('/git/commits') && metodo === 'POST') return json({ sha: 'c1' }, 201);
    if (u.includes('/git/refs/heads/main') && metodo === 'PATCH') return json({ ok: true });
    const m = /\/contents\/([^?]+)/.exec(u);
    if (m) {
      const rel = decodeURIComponent(m[1]);
      const abs = path.join(RAIZ, rel);
      if (!fs.existsSync(abs)) return json({ message: 'Not Found' }, 404);
      if (fs.statSync(abs).isDirectory()) {
        return json(fs.readdirSync(abs).map((nome) => ({ name: nome, type: 'file' })));
      }
      return json({ sha: 'x', content: Buffer.from(fs.readFileSync(abs, 'utf8')).toString('base64') });
    }
    return json({ message: 'Not Found' }, 404);
  };
  const contado = contarSubpedidos(base, teto || LIMITE_PADRAO);
  return { fetch: contado, chamadas, escritos };
}

/* AS FONTES SÃO AS DA ESCOLA VIVA (20/11/2026). A `batata` foi expurgada e os três ficheiros que
 * esta prova lia deixaram de existir; a forma é a mesma, e é ela que o escritor consome. O que a
 * prova mede — quantos subpedidos a gravação gasta — não depende do conteúdo dos envelopes. */
const CICLO = 'professores/demi-plie/ciclos/ciclo-01-breu-rosa';
const po = JSON.parse(ler('escola/breu/envelopes/po-20261120-2052.json'));
const plano = JSON.parse(ler('escola/breu/envelopes/plano-20261120-2052.json'));
const linhaDeBase = JSON.parse(ler('escola/breu/linhas-de-base/tami--20261118-2039.json'));
const CONTEXTO = { escola: 'breu', professor: 'demi-plie', ciclo: '01', turma: 'Rosa' };

function escritor(fetch) {
  return criarEscritorDeCiclo({
    token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: fetch,
  });
}

// ============================================================================================
console.log('\nA. O CUSTO — o N+1 saiu do caminho do «Guardar»');

(async () => {
  {
    const repo = gitFalso();
    const relatorio = await escritor(repo.fetch)({ plano, po, contexto: CONTEXTO, linhaDeBase });
    const blobs = repo.chamadas.filter((c) => /\/git\/blobs$/.test(c.url));
    const listagens = repo.chamadas.filter((c) => /\/contents\/.*historico$/.test(c.url));
    const commits = repo.chamadas.filter((c) => c.metodo === 'POST' && /\/git\/commits$/.test(c.url));
    const gastos = repo.fetch.subpedidos.usados;

    provar('a gravação correu até ao fim (as fontes do ciclo ficaram escritas)',
      relatorio.ok !== false && Object.keys(repo.escritos).length >= 4,
      { ok: relatorio.ok, escritos: Object.keys(repo.escritos).length });
    provar('ZERO `POST /git/blobs` — o conteúdo viaja na entrada da árvore', blobs.length === 0,
      blobs.map((c) => c.url));
    provar('UMA listagem de `historico/`, e não uma por fonte', listagens.length <= 1,
      listagens.map((c) => c.url));
    provar('UM commit só (a razão de ser do lote continua de pé)', commits.length === 1, commits.length);
    /* O NÚMERO É O CONTRATO: com a rota (≈20 subpedidos entre leituras e o envelope) tem de sobrar
     * margem dentro dos 50. 20 é o teto declarado; medido, dá 16. */
    provar('o escritor inteiro cabe em 20 subpedidos (medido: ' + gastos + ')', gastos <= 20, gastos);
    provar('…e sobra mais de metade do teto do plano gratuito',
      repo.fetch.subpedidos.restantes >= gastos, { gastos, restantes: repo.fetch.subpedidos.restantes });
  }

  // ==========================================================================================
  console.log('\nB. A RECUSA — quando não cabe, não se começa');

  {
    const repo = gitFalso({ teto: 12 });
    const relatorio = await escritor(repo.fetch)({ plano, po, contexto: CONTEXTO, linhaDeBase });
    const escritas = repo.chamadas.filter((c) => c.metodo !== 'GET');
    const leituras = repo.chamadas.filter((c) => c.metodo === 'GET');

    provar('recusa com o motivo `orcamento`', relatorio.ok === false && relatorio.motivo === 'orcamento',
      { ok: relatorio.ok, motivo: relatorio.motivo });
    provar('…sem NENHUMA escrita (nenhum commit, nenhum arquivo)', escritas.length === 0,
      escritas.map((c) => c.metodo + ' ' + c.url));
    provar('…e sem gastar subpedido nenhum a descobrir isso', leituras.length === 0,
      leituras.map((c) => c.url));
    /* O QUE A FRASE DEVE DIZER (20/11/2026). Ela já disse «repita o gesto» — e a pesquisadora
     * perguntou por que razão a travessia parava ali: repetir o mesmo gesto com o mesmo teto dá o
     * mesmo resultado. O remédio é outro, e a frase passou a nomeá-lo: o teto (`SUBPEDIDOS` em
     * `wrangler.<escola>.jsonc`). A asserção mede os três factos que a frase tem de carregar: o
     * número do teto, a garantia de que nada ficou meio-escrito, e o sítio onde se muda. */
    provar('…e o motivo nomeia o teto e o que fazer',
      /subpedidos/i.test(String(relatorio.erro))
      && /SUBPEDIDOS|wrangler\.[a-z-]+\.jsonc/.test(String(relatorio.erro))
      && /não foi escrito/i.test(String(relatorio.erro)),
      relatorio.erro);
  }

  // ==========================================================================================
  console.log('\nC. O CONTADOR — o orçamento é um só por pedido');

  {
    let chamadas = 0;
    const f = contarSubpedidos(async () => { chamadas += 1; return { ok: true }; }, 5);
    await f('a'); await f('b');
    provar('conta o que sai', f.subpedidos.usados === 2, f.subpedidos.usados);
    provar('…e o que resta', f.subpedidos.restantes === 3, f.subpedidos.restantes);
    provar('…e `coube` responde pela estimativa', f.subpedidos.coube(3) === true && f.subpedidos.coube(4) === false,
      { tres: f.subpedidos.coube(3), quatro: f.subpedidos.coube(4) });
    provar('o teto por omissão é o do plano gratuito (50)', LIMITE_PADRAO === 50, LIMITE_PADRAO);
    provar('a frase da recusa nomeia os números', /2 dos 5/.test(f.subpedidos.motivo(9)),
      f.subpedidos.motivo(9));
    const semContador = criarEscritorDeCiclo({ token: 'x', dono: 'd', repo: 'r', ref: 'main' });
    provar('sem contador (uma bancada), nada disto bloqueia',
      typeof semContador.orcamento === 'function' && semContador.orcamento() === null,
      typeof semContador.orcamento);
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + (n - falhas) + ' de ' + n + ' asserções passaram');
    process.exit(1);
  }
  console.log('PASSOU — ' + n + ' de ' + n + ' asserções');
})();
