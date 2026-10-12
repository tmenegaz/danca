// principal.js — o ENTRY ESM do Worker de PRODUÇÃO (o Worker de cada ESCOLA).
//
// O repositório é CommonJS (sem `"type": "module"`), então a ponte de produção
// (`motor/servidor/producao.js`) exporta `fetch` por `module.exports`. Este shim
// de poucas linhas é a única ponte ESM→CJS que o esbuild do wrangler precisa:
//
//   import mod from '../motor/servidor/producao.js';
//   export default { fetch: mod.fetch };
//
// O esbuild empacota o `require` dos módulos CommonJS — o MESMO motor que o
// Node usa, sem reescrever nenhuma rota.

import mod from '../motor/servidor/producao.js';

export default {
  async fetch(request, env) {
    return mod.fetch(request, env);
  },
};
