'use strict';

/**
 * adaptadores/cloudflare.js — o armazenamento sobre o WORKER (ASSETS + KV).
 *
 * Implementa o contrato de `../nucleo/armazenamento.js` com os bindings do
 * Cloudflare:
 *   - `env.ASSETS`  — o conteúdo ESTÁTICO (po.json, anamnese.json, esquema),
 *                     lido por `fetch`. Read-only.
 *   - `env.PADD_KV` — os envelopes (o dado dinâmico), lido/escrito por
 *                     `get`/`put`/`list`.
 *
 * A divisão espelha o `workers/receber.js`: o ASSETS serve o que não muda, o KV
 * guarda o que a elicitação produz. O adaptador NÃO sabe o que é um PO nem uma
 * anamnese — só lê de um lado e escreve no outro, sob chaves.
 *
 * Uso (dentro de um Worker, ou num teste com `env` falso):
 *   const { criarCloudflare } = require('./adaptadores/cloudflare.js');
 *   const armazem = criarCloudflare(env);
 *   await armazem.guardar('diaghilev/fokini/01/anamnese/x', texto);
 */

function criarCloudflare(env) {
  const kv = env && env.PADD_KV;
  const assets = env && env.ASSETS;

  return {
    async ler(chave) {
      // Estático primeiro: o conteúdo vive no ASSETS. Se o ASSETS não existir
      // (ou a chave não for estática), cai no KV — o envelope.
      if (assets && typeof assets.fetch === 'function') {
        const res = await assets.fetch(new URL(chave, 'https://assets.local'));
        if (res.ok) return await res.text();
      }
      if (kv && typeof kv.get === 'function') {
        return await kv.get(chave);
      }
      return null;
    },
    async guardar(chave, valor) {
      if (!kv || typeof kv.put !== 'function') {
        throw new Error('PADD_KV ausente: não há onde guardar ' + chave);
      }
      await kv.put(chave, String(valor));
    },
    async anexar(chave, linha) {
      if (!kv || typeof kv.put !== 'function' || typeof kv.get !== 'function') {
        throw new Error('PADD_KV ausente: não há onde anexar a ' + chave);
      }
      // O KV não tem append: ler-modificar-escrever. A chave guarda o JSONL
      // inteiro, e o anexo é a concatenação. A ressalva de consistência (~60 s
      // no pior caso entre POPs; <100 ms na mesma origem, medido) vale aqui.
      const atual = (await kv.get(chave)) || '';
      await kv.put(chave, atual + String(linha));
    },
    async listar(prefixo) {
      if (!kv || typeof kv.list !== 'function') return [];
      const nomes = [];
      let cursor;
      for (let volta = 0; volta < 10; volta++) {
        const pagina = await kv.list({ prefix: prefixo, cursor });
        for (const k of (pagina && pagina.keys) || []) nomes.push(String(k.name));
        if (!pagina || pagina.list_complete || !pagina.cursor) break;
        cursor = pagina.cursor;
      }
      return nomes.sort();
    },
    async existe(chave) {
      if (!kv || typeof kv.get !== 'function') return false;
      return (await kv.get(chave)) !== null;
    },
    async apagar(chave) {
      if (!kv || typeof kv.delete !== 'function') return false;
      await kv.delete(chave);
      return true;
    },
  };
}

module.exports = { criarCloudflare };
