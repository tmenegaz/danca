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

const PREFIXO = '/plano-observacao';
const PREFIXO_ASSETS = 'plano-observacao/';

async function fetch(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. A porta de elicitação, sob o prefixo. Retira-se o prefixo do caminho (a
  //    rota vê `/`, `/api/…`, `/assets/…`) e a ponte lê o conteúdo do
  //    subdiretório do ASSETS.
  if (path === PREFIXO || path.startsWith(PREFIXO + '/')) {
    const rel = path === PREFIXO ? '/' : path.slice(PREFIXO.length);
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
