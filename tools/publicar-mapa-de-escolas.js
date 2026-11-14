#!/usr/bin/env node
'use strict';

/*
 * publicar-mapa-de-escolas.js — escreve em KV o mapa `escolas/por-host`.
 *
 * POR QUE ESTE FICHEIRO EXISTE (13/11/2026). A escola de um pedido deixou de vir da `vars`
 * `ESCOLA_SLUG` do `wrangler.<escola>.jsonc` e passou a vir de um mapa em KV, lido por
 * `motor/servidor/mapa-de-escolas.js`. A `vars` continuava a existir justamente para não haver
 * um momento em que ninguém saiba de quem é o Worker — e é este script que fecha essa janela:
 * **primeiro escreve-se o mapa, só depois é que a `vars` sai da configuração.**
 *
 * DE ONDE SAI O MAPA. Das próprias configurações que o deploy usa, e não de uma segunda lista:
 *
 *   · uma config é de ESCOLA quando o `assets.directory` está debaixo de `publicacao/`;
 *   · a escola é o NOME dessa pasta (`publicacao/calango` → `calango`);
 *   · o host é `<name>.<subdomínio>.workers.dev` — o `<name>` é o nome do script, que é o
 *     subdomínio que `provisionar-escola.js` liga.
 *
 * Assim a lista de escolas nunca é escrita duas vezes: quem manda é o que o deploy vai servir.
 * Uma config sem `assets.directory` em `publicacao/` (a raiz, `danca`) não entra — a raiz não é
 * escola e não passa por esta ponte.
 *
 * O QUE ELE FAZ POR OMISSÃO: JUNTAR. Uma entrada que já esteja no mapa e não corresponda a
 * nenhuma config **fica** — é o que permite registar à mão uma escola servida por outro shard.
 *
 * O QUE ELE FAZ COM `--podar`: APAGAR O QUE NENHUMA CONFIG DECLARA (14/11/2026). A entrada que
 * sobra é a de uma escola expurgada, e o expurgo não toca no mapa — de propósito, para o mapa ter
 * **um dono só**, que é a razão de ele existir. Dono é quem o escreve; se o expurgo também
 * apagasse, seriam dois, e no dia em que um mudasse o outro não saberia.
 *
 * MEDIDO NO EXPURGO DA `batata` (14/11/2026): depois de a escola sair do Cloudflare e do
 * repositório, o mapa continuava a dizer `batata.tmenegaz77.workers.dev → batata`. Sem dono que o
 * varra, o mapa passa a afirmar uma escola que não existe — e no shard é ELE que resolve o host.
 *
 *   node tools/publicar-mapa-de-escolas.js            # junta e grava
 *   node tools/publicar-mapa-de-escolas.js --podar    # grava SÓ o que as configs declaram
 *   node tools/publicar-mapa-de-escolas.js --check    # só compara; sai 1 se divergir do que as
 *                                                     #   configs dizem (entrada a mais conta)
 *   node tools/publicar-mapa-de-escolas.js --dry-run  # mostra o que faria
 *
 * Precisa de `CLOUDFLARE_API_TOKEN`. A conta resolve-se sozinha (`/accounts`); o namespace sai das
 * configurações, porque é o mesmo de todas as escolas (`PADD_KV`).
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const CHAVE = 'escolas/por-host';
/** O sufixo dos subdomínios de escola — o mesmo de `provisionar-escola.js` e `expurgar-escola.js`. */
const SUBDOMINIO = 'tmenegaz77';

/** Lê um `.jsonc` (JSON com comentários de linha) como objeto. */
function lerJsonc(arquivo) {
  const texto = fs.readFileSync(arquivo, 'utf8')
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');
  return JSON.parse(texto);
}

/** As escolas que as configurações declaram: `{ host: slug }`. */
function escolasDasConfiguracoes() {
  const mapa = {};
  const arquivos = fs.readdirSync(RAIZ).filter((n) => /^wrangler\..*\.jsonc$/.test(n)).sort();
  for (const nome of arquivos) {
    const cfg = lerJsonc(path.join(RAIZ, nome));
    const dir = String((cfg.assets && cfg.assets.directory) || '').replace(/\\/g, '/');
    if (!dir.startsWith('publicacao/')) continue;      // a raiz não é escola
    const escola = dir.slice('publicacao/'.length).split('/')[0];
    const script = String(cfg.name || '').trim();
    if (!escola || !script) continue;
    mapa[escola + '.' + SUBDOMINIO + '.workers.dev'] = escola;
  }
  return mapa;
}

/** O namespace do `PADD_KV`, declarado nas configurações (é o mesmo em todas). */
function namespaceDasConfiguracoes() {
  const arquivos = fs.readdirSync(RAIZ).filter((n) => /^wrangler\..*\.jsonc$/.test(n)).sort();
  for (const nome of arquivos) {
    const cfg = lerJsonc(path.join(RAIZ, nome));
    for (const kv of (cfg.kv_namespaces || [])) {
      if (kv && kv.binding === 'PADD_KV' && kv.id) return String(kv.id);
    }
  }
  return null;
}

function precisaDeToken() {
  const token = String(process.env.CLOUDFLARE_API_TOKEN || '').trim();
  if (!token) {
    console.error('falta CLOUDFLARE_API_TOKEN (é o mesmo que o deploy usa)');
    process.exit(2);
  }
  return token;
}

async function pedir(token, url, init) {
  const res = await fetch(url, Object.assign({}, init, {
    headers: Object.assign({ Authorization: 'Bearer ' + token }, (init && init.headers) || {}),
  }));
  return res;
}

async function conta(token) {
  const doAmbiente = String(process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  if (doAmbiente) return doAmbiente;
  const res = await pedir(token, 'https://api.cloudflare.com/client/v4/accounts');
  if (!res.ok) throw new Error('não li as contas: HTTP ' + res.status);
  const corpo = await res.json();
  const primeira = (corpo.result || [])[0];
  if (!primeira) throw new Error('o token não vê nenhuma conta');
  return primeira.id;
}

async function lerDoKv(token, accountId, namespaceId) {
  const url = 'https://api.cloudflare.com/client/v4/accounts/' + accountId +
    '/storage/kv/namespaces/' + namespaceId + '/values/' + encodeURIComponent(CHAVE);
  const res = await pedir(token, url);
  if (res.status === 404) return {};                 // ainda não existe: é o caso de hoje
  if (!res.ok) throw new Error('não li o mapa do KV: HTTP ' + res.status);
  const texto = await res.text();
  if (!texto.trim()) return {};
  try {
    const valor = JSON.parse(texto);
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {};
  } catch (erro) {
    throw new Error('o valor em `' + CHAVE + '` não é JSON — não vou sobrescrever às cegas');
  }
}

async function gravarNoKv(token, accountId, namespaceId, mapa) {
  const url = 'https://api.cloudflare.com/client/v4/accounts/' + accountId +
    '/storage/kv/namespaces/' + namespaceId + '/values/' + encodeURIComponent(CHAVE);
  const res = await pedir(token, url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapa),
  });
  if (!res.ok) throw new Error('não gravei o mapa: HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200));
}

const mesmaCoisa = (a, b) => JSON.stringify(ordenado(a)) === JSON.stringify(ordenado(b));
function ordenado(m) {
  const saida = {};
  for (const k of Object.keys(m).sort()) saida[k] = m[k];
  return saida;
}

(async () => {
  const conferir = process.argv.includes('--check');
  const seco = process.argv.includes('--dry-run');
  /* O `--podar` é o único caminho que apaga. Sem ele, a junção mantém o que só está no KV — a
   * diferença entre «não sei de onde veio, e apago» e «não sei de onde veio, e fica» é a diferença
   * entre perder uma escola registada à mão e ter de a apagar sozinho. */
  const podar = process.argv.includes('--podar');

  const dasConfigs = escolasDasConfiguracoes();
  const nomes = Object.keys(dasConfigs);
  if (!nomes.length) {
    console.error('nenhuma escola nas configurações — nada a publicar');
    process.exit(2);
  }

  const token = precisaDeToken();
  const namespaceId = namespaceDasConfiguracoes();
  if (!namespaceId) {
    console.error('nenhuma configuração declara o `PADD_KV` — não sei onde gravar');
    process.exit(2);
  }
  const accountId = await conta(token);
  const atual = await lerDoKv(token, accountId, namespaceId);

  /* A JUNÇÃO É DO MAPA NOVO SOBRE O VELHO: o que as configs dizem tem de valer, e o que só está
   * no KV (uma escola servida por outro shard, registada à mão) fica — a não ser que se peça
   * `--podar`, e aí o mapa passa a ser EXATAMENTE o que as configurações declaram. */
  const desejado = podar ? Object.assign({}, dasConfigs) : Object.assign({}, atual, dasConfigs);

  const entrando = Object.keys(desejado).filter((h) => atual[h] !== desejado[h]);
  const saindo = Object.keys(atual).filter((h) => desejaoInexistente(dasConfigs, h));

  console.log('mapa `' + CHAVE + '`' + (podar ? '  (--podar: só o que as configs declaram)' : ''));
  console.log('  nas configurações: ' + nomes.length + ' escola(s) → ' + nomes.join(', '));
  for (const h of Object.keys(dasConfigs)) {
    console.log('    ' + (atual[h] === dasConfigs[h] ? '=' : '+') + ' ' + h + '  →  ' + dasConfigs[h]);
  }
  for (const h of saindo) {
    console.log('    ' + (podar ? '−' : '·') + ' ' + h + '  →  ' + atual[h] + '   (nenhuma config ' +
      'declara: ' + (podar ? 'SAI' : 'fica; `--podar` remove') + ')');
  }

  /* O `--check` MEDE A DIVERGÊNCIA, E UMA ENTRADA A MAIS É DIVERGÊNCIA (14/11/2026). Antes, o
   * `--check` comparava a junção — que inclui o que só está no KV —, e por isso dizia «em dia»
   * sobre um mapa que afirmava uma escola expurgada. Silêncio não é concordância. */
  if (conferir) {
    if (saindo.length) {
      console.error('  ' + saindo.length + ' entrada(s) que nenhuma configuração declara — ' +
        'corrija com `node tools/publicar-mapa-de-escolas.js --podar`');
      process.exit(1);
    }
    if (!mesmaCoisa(atual, desejado)) {
      console.error('  DIFERENTE do KV — corrija com `node tools/publicar-mapa-de-escolas.js`');
      process.exit(1);
    }
    console.log('  já está em dia.');
    process.exit(0);
  }

  if (mesmaCoisa(atual, desejado)) {
    console.log('  já está em dia.');
    process.exit(0);
  }

  if (seco) {
    console.log('  (dry-run) gravaria ' + entrando.length + ' entrada(s) nova(s)/alterada(s)' +
      (podar && saindo.length ? ' e removeria ' + saindo.length : '') + '.');
    process.exit(0);
  }

  await gravarNoKv(token, accountId, namespaceId, ordenado(desejado));
  console.log('  gravado: ' + entrando.length + ' entrada(s) nova(s)/alterada(s)' +
    (podar && saindo.length ? ' e ' + saindo.length + ' removida(s)' : '') + '.');
})().catch((erro) => { console.error(erro && erro.message ? erro.message : erro); process.exit(1); });

/** Uma entrada do KV que nenhuma config declara — mantida, e não apagada. */
function desejaoInexistente(dasConfigs, host) {
  return !Object.prototype.hasOwnProperty.call(dasConfigs, host);
}
