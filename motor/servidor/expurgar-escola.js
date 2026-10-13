'use strict';

/**
 * expurgar-escola.js — o INVERSO do provisionar-escola.js: apaga uma escola do Cloudflare.
 *
 * O hook de expurgo (IDEIA-PAINEL-ESCOLA.md §17.5) apaga a escola quando ela está
 * desabilitada e o prazo passou — «deixa de existir e libera espaço». A ordem é a da
 * criação, invertida: desliga o subdomínio, apaga o script do Worker e (se a escola
 * declarar) as chaves do KV com o prefixo dela.
 *
 * O namespace KV é COMPARTILHADO entre escolas — por isso a limpeza de chaves é por
 * PREFIXO e só acontece quando a escola declara `kv` no andaime. Nunca se apaga o
 * namespace inteiro (outras escolas vivem nele).
 *
 * Fronteira: só Cloudflare REST API via `fetch` (Web Standard) — corre no Worker e no
 * Node. O token chega por parâmetro, nunca é lido daqui de dentro.
 */

// O sufixo dos subdomínios de escola (o mesmo de provisionar-escola.js).
const SUBDOMINIO = 'tmenegaz77';

/** Uma chamada Cloudflare REST simples (DELETE, sem corpo). Devolve `{ ok, status, dados }`. */
async function api(token, metodo, caminho) {
  const res = await fetch('https://api.cloudflare.com/client/v4' + caminho, {
    method: metodo,
    headers: { 'Authorization': 'Bearer ' + token },
  });
  const dados = await res.json().catch(() => ({}));
  return { ok: res.ok && dados.success === true, status: res.status, dados };
}

/** Lista os NOMES das chaves do KV com um prefixo (vazio se nada casar ou erro). */
async function listarChaves({ token, accountId, namespaceId, prefixo }) {
  const url = 'https://api.cloudflare.com/client/v4/accounts/' + accountId +
    '/storage/kv/namespaces/' + namespaceId + '/keys?prefix=' + encodeURIComponent(prefixo);
  const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok || dados.success !== true) return [];
  return (dados.result || []).map((k) => (k && k.name ? k.name : String(k))).filter(Boolean);
}

/** Apaga as chaves do KV com o prefixo da escola. Devolve `{ total, apagadas }`. */
async function apagarChavesDeEscola({ token, accountId, namespaceId, prefixo }) {
  const chaves = await listarChaves({ token, accountId, namespaceId, prefixo });
  let apagadas = 0;
  for (const chave of chaves) {
    const caminho = '/accounts/' + accountId + '/storage/kv/namespaces/' + namespaceId +
      '/values/' + encodeURIComponent(chave);
    const r = await api(token, 'DELETE', caminho);
    if (r.ok) apagadas += 1;
  }
  return { total: chaves.length, apagadas };
}

/**
 * Apaga a escola do Cloudflare: o subdomínio, o script do Worker e (se `kv` vier
 * declarado) as chaves do KV com o prefixo da escola. Devolve um relatório por etapa —
 * o hook usa para registrar o que foi apagado.
 */
async function excluirEscola({ token, accountId, slug, kv }) {
  const base = '/accounts/' + accountId + '/workers/scripts/' + slug;
  const resultado = { slug, subdominio: null, script: null, kv: null };

  resultado.subdominio = await api(token, 'DELETE', base + '/subdomain');
  resultado.script = await api(token, 'DELETE', base);
  if (kv && kv.namespaceId && kv.prefixo) {
    resultado.kv = await apagarChavesDeEscola({ token, accountId, namespaceId: kv.namespaceId, prefixo: kv.prefixo });
  }

  return resultado;
}

module.exports = { excluirEscola, apagarChavesDeEscola, listarChaves, SUBDOMINIO };
