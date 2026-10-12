'use strict';

/**
 * producao.js — a PONTE de PRODUÇÃO (o Worker `diaghilev`).
 *
 * O Worker de produção serve, na MESMA origem, três coisas:
 *   1. o pacote do ciclo (o ASSETS, asset-first);
 *   2. o lançamento da aula (POST /api/receber, na raiz — o `lancamento.html`);
 *   3. a PORTA de elicitação, sob `/plano-observacao/`.
 *
 * A porta é a MESMA do experimento — as rotas agnósticas de `rotas.js` —, mas
 * vive num SUBDIRETÓRIO do ASSETS (`plano-observacao/`): o conteúdo, o esquema,
 * o PO, o prompt, a identidade e os estáticos da porta ficam lá, e a ponte
 * `cloudflare.js` os lê com o prefixo. O PADD_KV é o MESMO (produção) — os
 * envelopes, o cofre e o lançamento caem na mesma família de chaves.
 *
 * A fronteira: este módulo só DECIDE para onde vai o pedido (porta × lançamento
 * × pacote) e retira o prefixo da porta antes de despachar. Nenhuma lógica de
 * elicitação vive aqui.
 */

const { fetch: portaFetch } = require('./cloudflare.js');
const bastidores = require('./bastidores.js');

// A PORTA vive num SÓ subdiretório do ASSETS (`plano-observacao/`), mas é servida
// sob TRÊS caminhos de URL — cada fonte da elicitação tem a sua própria URL:
//   · `/anamnese/`         → a anamnese (fonte padrão);
//   · `/plano-ensino/`     → o plano de ensino (`?fonte=plano`);
//   · `/plano-observacao/` → o PO (`?fonte=po`).
// O plano de ensino deixou de entrar pelo PO: virou rota própria, no mesmo nível
// da anamnese e do PO no menu da Área do Professor.
// O prefixo do ASSETS é o mesmo nos três: a porta lê o conteúdo de
// `plano-observacao/` — o que muda é só o caminho que o professor digita.
const PREFIXO_PO = '/plano-observacao';
const PREFIXO_ANAMNESE = '/anamnese';
const PREFIXO_PLANO = '/plano-ensino';
const PREFIXO_ASSETS = 'plano-observacao/';

function caminhoDaPorta(path, prefixo) {
  return path === prefixo ? '/' : path.slice(prefixo.length);
}

async function fetch(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 0. O FREIO da escola: a flag de habilitação. Quando `ESCOLA_HABILITADA` não
  //    é "sim", a escola está DESLIGADA — nenhuma rota serve conteúdo, qualquer
  //    caminho devolve esta página. É o "desliga" para resolver problemas
  //    diversos sem derrubar o Worker: o domínio continua no ar, mas não abre
  //    nada. A flag é uma `vars` do wrangler (não segredo): visível e auditável.
  if (env.ESCOLA_HABILITADA !== 'sim') {
    return new Response(
      '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Escola desabilitada</title>' +
      '<style>body{font:16px/1.6 Georgia, serif;color:#3a2b1f;background:#faf6ee;' +
      'max-width:34rem;margin:4rem auto;padding:0 1.25rem;}h1{font-size:1.5rem;}' +
      'p{color:#6b5b4a;}</style></head><body>' +
      '<h1>Escola desabilitada</h1>' +
      '<p>Esta escola está desabilitada para resolver problemas diversos.</p>' +
      '</body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html;charset=utf-8' } }
    );
  }

  // 0.1 O MOCK dos Bastidores (andaime): `/bastidores` e `/api/bastidores/*`
  //     vivem FORA da porta — a lista de alunas e a senha do professor que a
  //     anamnese consulta. Sem Produção real, este andaime as entrega.
  const bast = await bastidores.fetch(request, env);
  if (bast) return bast;

  // 1. A porta de elicitação, sob os dois prefixos. Retira-se o prefixo do caminho
  //    (a rota vê `/`, `/api/…`, `/assets/…`) e a ponte lê o conteúdo do
  //    subdiretório do ASSETS.
  const prefixo =
    path === PREFIXO_PO || path.startsWith(PREFIXO_PO + '/') ? PREFIXO_PO
    : path === PREFIXO_ANAMNESE || path.startsWith(PREFIXO_ANAMNESE + '/') ? PREFIXO_ANAMNESE
    : path === PREFIXO_PLANO || path.startsWith(PREFIXO_PLANO + '/') ? PREFIXO_PLANO
    : null;
  if (prefixo) {
    const rel = caminhoDaPorta(path, prefixo);
    const alvo = new Request(new URL(rel + url.search, request.url), request);
    return portaFetch(alvo, env, { prefixo: PREFIXO_ASSETS });
  }

  // 2. O lançamento do pacote (o `lancamento.html` POSTa em /api/receber), na
  //    raiz. A rota vive nas rotas agnósticas (nucleo/lancamento.js).
  if (path === '/api/receber') {
    return portaFetch(request, env, { prefixo: PREFIXO_ASSETS });
  }

  // 3. O resto → o pacote. O asset-first do Cloudflare já serviu o estático que
  //    existe; este ramo cobre o `run_worker_first` (default) devolvendo o
  //    mesmo 404 que o Worker antigo devolvia.
  if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    return env.ASSETS.fetch(request);
  }
  return new Response(JSON.stringify({ ok: false, erro: 'nao encontrado' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
  });
}

module.exports = { fetch };
