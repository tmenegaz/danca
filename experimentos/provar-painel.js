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

const ambiente = (extra) => Object.assign({
  SENHA_RAIZ: 'segredo',
  GITHUB_TOKEN: 'tok',
}, extra || {});

async function pedir(env, caminho) {
  return raiz.fetch(new Request(BASE + caminho, { headers: { Authorization: AUTORIZACAO } }), env);
}

/** Corre `fn` com a rede substituída. */
async function semRede(arquivos, fn) {
  const original = globalThis.fetch;
  const { fetch, chamadas } = githubFalso(arquivos);
  globalThis.fetch = fetch;
  try { return await fn(chamadas); } finally { globalThis.fetch = original; }
}

const ARQUIVOS = {
  'escola/calango/indice.json': inventario({
    slug: 'calango', criado: '2026-10-19T18:18:57.289485+00:00', expurgo: EXPURGO_DA_CALANGO,
  }),
  'escola/viva/indice.json': inventario({ slug: 'viva', criado: '2026-10-20T10:00:00.000000+00:00' }),
  // A VIVA tem o wrangler; a `calango` não — e é isso que a derivação lê como «expurgada».
  'wrangler.viva.jsonc': '{}',
  'professores/sapo-bailarino/ciclos/ciclo-01-viva.conf': 'ESCOLA="Viva"\n',
};

async function principais() {
  // ── 1. a lista ─────────────────────────────────────────────────────────────
  const lista = await semRede(ARQUIVOS, async () => {
    const r = await pedir(ambiente(), '/painel/escolas-apagadas');
    return { status: r.status, html: await r.text() };
  });
  conferir('a lista responde 200', lista.status === 200, lista.status);
  conferir('mostra a escola apagada', /Calango/.test(lista.html), null);
  conferir('…com a data de CRIAÇÃO', /19\/10\/2026/.test(lista.html), null);
  conferir('…e a data da SAÍDA', /22\/10\/2026/.test(lista.html), null);
  conferir('…e o link para o registo', /href="\/painel\/escolas-apagadas\/calango"/.test(lista.html), null);
  conferir('a escola VIVA não aparece na lista', !/>Viva</.test(lista.html), null);

  // ── 2. o registo ───────────────────────────────────────────────────────────
  const registro = await semRede(ARQUIVOS, async () => {
    const r = await pedir(ambiente(), '/painel/escolas-apagadas/calango');
    return { status: r.status, html: await r.text() };
  });
  conferir('o registo responde 200', registro.status === 200, registro.status);
  conferir('mostra o MOTIVO declarado', /expurgada pela página/.test(registro.html), null);
  conferir('lista os arquivos que saíram',
    /professores\/oculos-redondo\/ciclos\/ciclo-01-calango\.conf/.test(registro.html), null);
  conferir('diz o que ficou no KV', /3 chave\(s\) apagada/.test(registro.html), null);
  conferir('…e os prefixos limpos', /bastidores\/calango\//.test(registro.html), null);
  conferir('tem a hora do expurgo, não só o dia', /às 10:48/.test(registro.html), null);
  conferir('volta à lista', /href="\/painel\/escolas-apagadas"/.test(registro.html), null);

  // ── 3. slug que não existe → 404, e não uma página vazia ───────────────────
  const inexistente = await semRede(ARQUIVOS, async () => {
    const r = await pedir(ambiente(), '/painel/escolas-apagadas/nunca-existiu');
    return { status: r.status, html: await r.text() };
  });
  conferir('escola fora da lista responde 404', inexistente.status === 404, inexistente.status);
  conferir('…e não inventa um registo', !/Expurgo de/.test(inexistente.html), null);

  // ── 4. o slug não vira caminho arbitrário ──────────────────────────────────
  const travessia = await semRede(ARQUIVOS, async (chamadas) => {
    const r = await pedir(ambiente(), '/painel/escolas-apagadas/..%2F..%2Fetc');
    const leu = chamadas.filter((c) => /\/contents\//.test(c.url));
    return { status: r.status, leituras: leu.length };
  });
  conferir('slug com travessia não lê arquivo nenhum', travessia.leituras === 0, travessia);

  // ── 5. sem token: diz, não finge ───────────────────────────────────────────
  const semToken = await pedir(ambiente({ GITHUB_TOKEN: '' }), '/painel/escolas-apagadas');
  const htmlSemToken = await semToken.text();
  conferir('sem GITHUB_TOKEN responde 500', semToken.status === 500, semToken.status);
  conferir('…e diz o que falta', /GITHUB_TOKEN/.test(htmlSemToken), null);
  conferir('…e NÃO diz «nenhuma escola apagada»', !/Nenhuma escola apagada/.test(htmlSemToken), null);

  // ── 6. o menu ──────────────────────────────────────────────────────────────
  const menu = await semRede(ARQUIVOS, async () => {
    const r = await pedir(ambiente(), '/painel/escolas-apagadas');
    return r.text();
  });
  conferir('o menu tem o grupo «Painel»', /<summary>Painel<\/summary>/.test(menu), null);
  conferir('…com o item «Escolas apagadas»',
    /href="\/painel\/escolas-apagadas"[^>]*>Escolas apagadas</.test(menu), null);
  conferir('…e o item está marcado como activo',
    /class="ativo" href="\/painel\/escolas-apagadas"/.test(menu)
      || /href="\/painel\/escolas-apagadas" class="ativo"/.test(menu)
      || /class="ativo"[^>]*escolas-apagadas/.test(menu), null);

  // ── 7. o painel de entrada ─────────────────────────────────────────────────
  const inicio = await semRede(ARQUIVOS, async () => {
    const r = await pedir(ambiente(), '/painel');
    return { status: r.status, html: await r.text() };
  });
  conferir('a página do painel responde 200', inicio.status === 200, inicio.status);
  conferir('…e conta as escolas apagadas', /1 escola apagada/.test(inicio.html), null);
  conferir('…e leva à lista', /href="\/painel\/escolas-apagadas"/.test(inicio.html), null);

  // ── 8. a página da raiz tem a entrada do menu ──────────────────────────────
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'raiz', 'index.html'), 'utf8');
  conferir('a raiz oferece o «Painel»', /<a class="acao grande secundario" href="\/painel">Painel<\/a>/.test(html), null);

  // ── 9. a data não passa por Date ───────────────────────────────────────────
  conferir('microssegundos no ISO não viram NaN',
    painel.dia('2026-10-19T18:18:57.289485+00:00'), '19/10/2026');
  conferir('ISO sem data devolve null, não «NaN/NaN/NaN»', painel.dia('nada') === null, painel.dia('nada'));
  conferir('a hora é do carimbo, sem converter fuso',
    painel.quando('2026-10-22T10:48:48.104Z'), '22/10/2026 às 10:48');
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
