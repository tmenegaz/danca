#!/usr/bin/env node
'use strict';

/**
 * provar-painel.js — as escolas apagadas têm um destino (22/10/2026).
 *
 * O QUE FALTAVA. O expurgo grava um ELO em `escola/<slug>/indice.json` — quando, por quê, o
 * que saiu do repositório, o que ficou no KV. Versionado e correto, e **sem destino**: quem
 * quisesse ler o registo abria o JSON no GitHub. O painel dá-lhe página, e a lista dá-lhe
 * entrada no menu.
 *
 * O QUE ESTA PROVA TRAVA, e por que cada elo:
 *
 *   1. a LISTA mostra a escola apagada com as duas datas (criação e saída) e o link;
 *   2. a escola VIVA não aparece na lista — «apagada» é um facto, não um sinónimo de «existe»;
 *   3. o REGISTO abre com o motivo, os arquivos apagados e o que ficou no KV;
 *   4. um slug que não está na lista é 404, e não uma página de registo vazia;
 *   5. sem `GITHUB_TOKEN` o painel DIZ que não consegue ler — nunca uma lista vazia, que se
 *      leria como «nenhuma escola apagada»;
 *   6. o MENU tem «Escolas apagadas» e marca o item activo;
 *   7. a DATA não passa por `Date` — o ISO do índice tem microssegundos, e um `Invalid Date`
 *      sairia na cara de quem lê.
 *
 * Tudo corre em processo, com a API do GitHub substituída: nenhuma requisição sai.
 *
 *   uso: node experimentos/provar-painel.js
 */

const raiz = require('../motor/servidor/raiz.js');
const painel = require('../motor/servidor/painel-html.js');

const BASE = 'https://danca.tmenegaz77.workers.dev';
const AUTORIZACAO = 'Basic ' + Buffer.from('tmenegaz:segredo').toString('base64');

let falhas = 0;
const conferir = (nome, ok, detalhe) => {
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

const b64 = (obj) => Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj)).toString('base64');

/** O inventário de uma escola — o elo que o expurgo grava. */
function inventario({ slug, criado, expurgo }) {
  return {
    escola: slug.charAt(0).toUpperCase() + slug.slice(1),
    worker: slug,
    criado_em: criado,
    professor: { slug: 'sapo-bailarino', nome: 'Sapo Bailarino' },
    responsavel: 'Sapo Bailarino',
    ciclo: '01',
    estado: { habilitada: true },
    arquivos: [],
    expurgo: expurgo || [],
  };
}

const EXPURGO_DA_CALANGO = [{
  em: '2026-10-22T10:48:48.104Z',
  motivo: 'expurgada pela página «Sistema Lastro»',
  apagado: [
    'wrangler.calango.jsonc',
    'professores/oculos-redondo/ciclos/ciclo-01-calango.conf',
    'professores/oculos-redondo/ciclos/ciclo-01-calango.fipp',
  ],
  kv: { ok: true, apagadas: 3, restantes: 0, prefixos: ['calango/', 'bastidores/calango/'] },
}];

/**
 * A API do GitHub, de mentira. `arquivos` é o conteúdo por caminho — o que a árvore declara e
 * o que cada `contents/` devolve. Nada de rede.
 */
function githubFalso(arquivos) {
  const caminhos = Object.keys(arquivos);
  const chamadas = [];
  const f = async (url, init) => {
    const u = String(url);
    const metodo = (init && init.method) || 'GET';
    chamadas.push({ url: u, metodo });
    if (metodo === 'GET' && /\/git\/trees\//.test(u)) {
      return {
        ok: true, status: 200,
        json: async () => ({ sha: 'arvore-1', tree: caminhos.map((p) => ({ path: p, type: 'blob' })) }),
      };
    }
    if (metodo === 'GET' && /\/contents\//.test(u)) {
      const caminho = u.split('/contents/')[1].split('?')[0];
      if (!(caminho in arquivos)) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ content: b64(arquivos[caminho]) }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  return { fetch: f, chamadas };
}

const ARQUIVOS = {
  // O ÍNDICE VERSIONADO — a única leitura da lista. O acervo inteiro, já derivado.
  'indices/acervo.json': {
    versao: 2,
    escolas: [
      { slug: 'calango', nome: 'calango', professor: 'sapo-bailarino',
        criada_em: '2026-10-19T18:18:57.289485+00:00', expurgada_em: '2026-10-22T10:48:48.104Z',
        expurgada: true, expurgos: 4 },
      { slug: 'breu', nome: 'breu', professor: 'sapo-bailarino',
        criada_em: '2026-10-19T23:41:57.342597+00:00', expurgada_em: '2026-10-21T21:06:01.896Z',
        expurgada: true, expurgos: 2 },
      { slug: 'viva', nome: 'viva', professor: 'tiago-menegaz',
        criada_em: '2026-10-20T10:00:00.000000+00:00', expurgada_em: null,
        expurgada: false, expurgos: 0 },
    ],
  },
  'escola/calango/indice.json': inventario({
    slug: 'calango', criado: '2026-10-19T18:18:57.289485+00:00', expurgo: EXPURGO_DA_CALANGO,
  }),
  // A página da raiz, com o marcador — é o arquivo real do repositório.
  'index.html': require('fs').readFileSync(require('path').join(__dirname, '..', 'raiz', 'index.html'), 'utf8'),
};

/** O `ASSETS` do Worker: serve o que estiver em `ARQUIVOS`, e 404 no resto. */
function assetsFalso(arquivos) {
  const f = async (req) => {
    const u = new URL(typeof req === 'string' ? req : req.url);
    const caminho = u.pathname === '/' ? '/index.html' : u.pathname;
    const chave = caminho.replace(/^\//, '');
    if (!(chave in arquivos)) return { ok: false, status: 404, headers: new Map(), text: async () => '' };
    const corpo = String(arquivos[chave]);
    return {
      ok: true,
      status: 200,
      headers: { get: (k) => (/content-type/i.test(k) ? 'text/html' : null) },
      text: async () => corpo,
    };
  };
  return { fetch: f };
}

const ambiente = (extra) => Object.assign({
  SENHA_RAIZ: 'segredo',
  GITHUB_TOKEN: 'tok',
}, extra || {});

async function pedir(env, caminho) {
  return raiz.fetch(new Request(BASE + caminho, { headers: { Authorization: AUTORIZACAO } }), env);
}

/** Corre `fn` com a rede do GitHub substituída e o ASSETS de mentira. */
async function semRede(fn) {
  const original = globalThis.fetch;
  const { fetch, chamadas } = githubFalso(ARQUIVOS);
  globalThis.fetch = fetch;
  try {
    return await fn(chamadas);
  } finally { globalThis.fetch = original; }
}

const envComAssets = (extra) => ambiente(Object.assign({ ASSETS: assetsFalso(ARQUIVOS) }, extra || {}));

async function principais() {
  // ── 1. a página `/` é o painel: lista ali, sem clique nenhum ───────────────
  const home = await semRede(async () => {
    const r = await pedir(envComAssets(), '/');
    return { status: r.status, html: await r.text() };
  });
  conferir('a raiz responde 200', home.status === 200, home.status);
  conferir('a lista vem NA página da raiz', /Escolas do sistema/.test(home.html), null);
  conferir('…com a escola apagada', /calango/.test(home.html), null);
  conferir('…e a viva também', /viva/.test(home.html), null);
  conferir('a apagada leva ao registo', /href="\/escolas-apagadas\/calango"/.test(home.html), null);
  conferir('os DOIS botões continuam lá',
    /id="btn-apagar"/.test(home.html) && /id="btn-criar"/.test(home.html), null);
  conferir('NÃO há botão «Painel»', !/href="\/painel"/.test(home.html), null);
  conferir('o marcador foi substituído', !/id="escolas-do-sistema"/.test(home.html), null);

  // ── 2. a lista custa UMA leitura — a lentidão de antes era isto ────────────
  const custo = await semRede(async (chamadas) => {
    await pedir(envComAssets(), '/');
    return chamadas.filter((c) => /api\.github\.com/.test(c.url)).map((c) => c.url);
  });
  conferir('a lista faz UMA requisição ao GitHub', custo.length === 1, custo.length);
  conferir('…e é a do índice versionado', /indices\/acervo\.json/.test(custo[0] || ''), custo[0]);

  // ── 3. o registo abre com UMA leitura (não reconstrói o acervo) ────────────
  const registro = await semRede(async (chamadas) => {
    const r = await pedir(envComAssets(), '/escolas-apagadas/calango');
    return { status: r.status, html: await r.text(), chamadas };
  });
  conferir('o registo responde 200', registro.status === 200, registro.status);
  const doRegisto = registro.chamadas.filter((c) => /api\.github\.com/.test(c.url)).map((c) => c.url);
  conferir('o registo faz UMA requisição', doRegisto.length === 1, doRegisto.length);
  conferir('…e é a do elo da escola', /escola\/calango\/indice\.json/.test(doRegisto[0] || ''), doRegisto[0]);
  conferir('mostra o MOTIVO declarado', /expurgada pela página/.test(registro.html), null);
  conferir('lista os arquivos que saíram',
    /ciclo-01-calango\.conf/.test(registro.html), null);
  conferir('diz o que ficou no KV', /3 chave\(s\) apagada/.test(registro.html), null);
  conferir('volta à lista', /href="\/escolas-apagadas"/.test(registro.html), null);

  // ── 4. os dois expurgos acumulam (a breu teve dois) ────────────────────────
  const doisElos = painelPaginaDoisElos();
  conferir('dois elos dão dois blocos', (doisElos.match(/Expurgo de/g) || []).length === 2,
    (doisElos.match(/Expurgo de/g) || []).length);

  // ── 5. escola sem elo → 404, e com UMA leitura ─────────────────────────────
  const inexistente = await semRede(async (chamadas) => {
    const r = await pedir(envComAssets(), '/escolas-apagadas/nunca-existiu');
    return { status: r.status, chamadas };
  });
  conferir('escola sem elo responde 404', inexistente.status === 404, inexistente.status);
  conferir('…e não reconstrói o acervo',
    inexistente.chamadas.filter((c) => /acervo\.json/.test(c.url)).length === 0, null);

  // ── 6. a lista filtrada (o item do menu) ───────────────────────────────────
  const apagadas = await semRede(async () => {
    const r = await pedir(envComAssets(), '/escolas-apagadas');
    return { status: r.status, html: await r.text() };
  });
  conferir('«Escolas apagadas» responde 200', apagadas.status === 200, apagadas.status);
  conferir('…com as duas apagadas', /calango/.test(apagadas.html) && /breu/.test(apagadas.html), null);
  conferir('…e sem a viva', !/href="\/escolas-apagadas\/viva"/.test(apagadas.html), null);

  // ── 7. as rotas antigas continuam a responder ──────────────────────────────
  for (const [de, para] of [['/painel', '/'], ['/painel/escolas-apagadas', '/escolas-apagadas'],
    ['/painel/escolas-apagadas/calango', '/escolas-apagadas/calango']]) {
    const r = await pedir(envComAssets(), de);
    conferir('301 de ' + de, r.status === 301 && r.headers.get('Location') === para,
      { status: r.status, location: r.headers.get('Location') });
  }

  // ── 8. o slug não vira caminho arbitrário ──────────────────────────────────
  const travessia = await semRede(async (chamadas) => {
    await pedir(envComAssets(), '/escolas-apagadas/..%2F..%2Fetc');
    return chamadas.filter((c) => /escola\/\.\./.test(c.url)).length;
  });
  conferir('slug com travessia não lê arquivo nenhum', travessia === 0, travessia);

  // ── 9. sem token: diz, não finge ───────────────────────────────────────────
  const semToken = await pedir(envComAssets({ GITHUB_TOKEN: '' }), '/escolas-apagadas');
  const htmlSemToken = await semToken.text();
  conferir('sem GITHUB_TOKEN responde 500', semToken.status === 500, semToken.status);
  conferir('…e diz o que falta', /GITHUB_TOKEN/.test(htmlSemToken), null);
  conferir('…e NÃO diz «Nenhuma escola»', !/Nenhuma escola/.test(htmlSemToken), null);

  // ── 10. o menu: logomarca + «Escolas apagadas», e mais nada ────────────────
  const menu = apagadas.html;
  conferir('o menu tem a logomarca', /class="marca" href="\/"/.test(menu), null);
  conferir('…e «Escolas apagadas»', /href="\/escolas-apagadas"[^>]*>Escolas apagadas</.test(menu), null);
  conferir('…e o item está activo', /class="ativo" href="\/escolas-apagadas"/.test(menu), null);
  conferir('SEM «Sistema Lastro» no menu', !/<a href="\/index.html">Sistema Lastro<\/a>/.test(menu), null);
  conferir('SEM «Área do Professor»', !/Área do Professor/.test(menu), null);
  conferir('SEM «Bastidores»', !/Bastidores/.test(menu), null);
  conferir('SEM menu que abre e fecha', !/<details class="menu">/.test(menu), null);

  // ── 11. a data não passa por Date ──────────────────────────────────────────
  conferir('microssegundos no ISO não viram NaN',
    painel.dia('2026-10-19T18:18:57.289485+00:00'), '19/10/2026');
  conferir('ISO sem data devolve null, não «NaN/NaN/NaN»', painel.dia('nada') === null, painel.dia('nada'));
  conferir('a hora é do carimbo, sem converter fuso',
    painel.quando('2026-10-22T10:48:48.104Z'), '22/10/2026 às 10:48');
}

/** A página de registo com dois elos — a `breu`, que foi apagada duas vezes. */
function painelPaginaDoisElos() {
  const elo = (em, motivo) => ({ em, motivo, apagado: ['x'], kv: null });
  return painel.paginaDoRegistro({
    slug: 'breu',
    indice: { escola: 'breu', criado_em: '2026-10-19T23:41:57Z', professor: { nome: 'X' },
      expurgo: [elo('2026-10-21T18:00:00Z', 'primeira'), elo('2026-10-21T21:06:01Z', 'segunda')] },
  });
}

principais().then(() => {
  console.log('');
  if (falhas) {
    console.log(falhas + ' asserção(ões) falharam');
    process.exit(1);
  }
  console.log('TUDO CERTO — o registo do expurgo tem destino, e o menu cresce por itens');
}).catch((e) => {
  console.error('EXPLODIU:', e && e.stack ? e.stack : e);
  process.exit(1);
});
