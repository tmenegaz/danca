// raiz.js — o ENTRY ESM do Worker RAIZ (o `danca`).
//
// O repositório é CommonJS (sem `"type": "module"`), então a raiz
// (`motor/servidor/raiz.js`) exporta `fetch` por `module.exports`. Este shim é a
// única ponte ESM→CJS que o esbuild do wrangler precisa — o mesmo padrão do
// `workers/principal.js` (a ponte de produção).

import mod from '../motor/servidor/raiz.js';

export default {
  async fetch(request, env) {
    return mod.fetch(request, env);
  },
  async scheduled(event, env, ctx) {
    return mod.scheduled(event, env, ctx);
  },
};
