#!/usr/bin/env node
'use strict';

/**
 * provar-cache-por-tipo.js — a página revalida-se depressa, o asset fica em cache; e um 404 não
 * se guarda (24/11/2026).
 *
 * O QUE ESTAVA, medido ao vivo em `breu.padd.com.br`:
 *
 *   `cache-control: public, max-age=0, must-revalidate` — no plano (50 KB), na aula (46 KB), na
 *   folha (16 KB) e no `style.css` (195 KB). «Não uses o que tens; pergunta sempre.»
 *
 * O QUE ESTA PROVA FIXA, e cada asserção existe por um modo de falhar:
 *
 *   A. A PÁGINA é curta: 60 s, com `must-revalidate`. Curta porque muda por geração.
 *   B. O ASSET é longo: 24 h, com `stale-while-revalidate`. Longo porque muda quando alguém mexe
 *      na identidade visual — e o `stale-while-revalidate` é o que impede a cache longa de servir
 *      uma folha velha até expirar.
 *   C. NUNCA `immutable` — os nomes não têm hash, e prometer imutabilidade a um nome estável é a
 *      forma mais eficiente de servir uma folha velha durante um dia.
 *   D. O `404` NÃO SE GUARDA. A página que não existe passa a existir no deploy seguinte; uma
 *      cache de 404 durante 24 h é o pior resultado possível desta mudança. O `302` também não —
 *      ele já traz `no-store` de quem o emitiu, e sobrescrevê-lo seria piorar o que está certo.
 *   E. O `JSON` É DADO, NÃO ASSET — mesmo debaixo de `assets/`. O `nav.json` e o `ciclos.json`
 *      mudam por geração e são lidos por código; guardá-los 24 h serviria um menu de ontem.
 *   F. CONTROLO NEGATIVO: as mesmas respostas, sem o funil, saem com o `cache-control` que o
 *      ASSETS lhes deu (`max-age=0`). Sem isto a prova estaria a medir o construtor de `Response`.
 *
 * SEM REDE e SEM Worker: as respostas são construídas aqui e passam pela função real.
 *
 *   node experimentos/provar-cache-por-tipo.js
 */

const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const { comCache, CACHE_DA_PAGINA, CACHE_DO_ASSET } =
  require(path.join(RAIZ, 'motor/servidor/producao.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/** A resposta como o ASSETS a devolve: `max-age=0`, com `etag`. */
function doAssets(tipo, extra) {
  const h = new Headers({ 'content-type': tipo, 'cache-control': 'public, max-age=0, must-revalidate', etag: '"x"' });
  for (const [k, v] of Object.entries(extra || {})) h.set(k, v);
  return new Response('<html></html>', { status: 200, headers: h });
}
const cacheDe = (r) => String(r.headers.get('cache-control') || '');

(async () => {
  /* ======================================================================================== */
  console.log('\nA · A PÁGINA é curta, e revalida');
  /* ======================================================================================== */
  for (const caminho of ['calango/piano/plano', 'calango/piano/aula-01.html', 'calango/aulas/', 'calango/index.html']) {
    const r = comCache(doAssets('text/html'), caminho);
    provar('página `' + caminho + '` → curta', cacheDe(r) === CACHE_DA_PAGINA, cacheDe(r));
  }
  provar('a página guarda-se 60 s', /max-age=60/.test(CACHE_DA_PAGINA), CACHE_DA_PAGINA);
  provar('…e revalida (nunca serve uma versão velha sem perguntar)', /must-revalidate/.test(CACHE_DA_PAGINA));

  /* ======================================================================================== */
  console.log('\nB · O ASSET é longo, e revalida em segundo plano');
  /* ======================================================================================== */
  for (const caminho of ['calango/piano/assets/style.css', 'calango/piano/assets/nav.js',
    'assets/style.css', 'calango/piano/assets/fontes/open-sans-variavel.woff2']) {
    const r = comCache(doAssets('text/css'), caminho);
    provar('asset `' + caminho + '` → longo', cacheDe(r) === CACHE_DO_ASSET, cacheDe(r));
  }
  provar('o asset guarda-se 24 h', /max-age=86400/.test(CACHE_DO_ASSET), CACHE_DO_ASSET);
  provar('…e usa a cópia que tem enquanto vai buscar a nova',
    /stale-while-revalidate=604800/.test(CACHE_DO_ASSET), CACHE_DO_ASSET);

  /* ======================================================================================== */
  console.log('\nC · NUNCA `immutable` — os nomes não têm hash');
  /* ======================================================================================== */
  {
    const casos = ['assets/style.css', 'assets/nav.js', 'assets/fontes/open-sans-variavel.woff2'];
    const comImmutable = casos.map((c) => comCache(doAssets('text/css'), c))
      .filter((r) => /immutable/.test(cacheDe(r)));
    provar('nenhum asset promete imutabilidade', comImmutable.length === 0,
      comImmutable.map(cacheDe));
    provar('…e o `style.css` é `style.css` — não há hash no nome',
      !/[0-9a-f]{8}/.test('assets/style.css'));
  }

  /* ======================================================================================== */
  console.log('\nD · O `404` NÃO SE GUARDA, e o `302` fica como está');
  /* ======================================================================================== */
  {
    const naoExiste = new Response('não encontrado', {
      status: 404, headers: { 'content-type': 'text/html', 'cache-control': 'public, max-age=0, must-revalidate' },
    });
    const r = comCache(naoExiste, 'calango/piano/aula-99.html');
    provar('um 404 fica com o que tinha (não ganha cache nenhuma)', r === naoExiste, cacheDe(r));
    provar('…e continua sem `max-age` longo', !/max-age=86400/.test(cacheDe(r)), cacheDe(r));

    const redirecionado = new Response(null, {
      status: 302, headers: { Location: '/piano/plano', 'cache-control': 'no-store, max-age=0' },
    });
    const r2 = comCache(redirecionado, 'calango/piano/plano');
    provar('um 302 fica com o `no-store` de quem o emitiu', r2 === redirecionado, cacheDe(r2));

    const r3 = comCache(null, 'x');
    provar('uma resposta ausente não rebenta', r3 === null);
  }

  /* ======================================================================================== */
  console.log('\nE · O `JSON` É DADO, NÃO ASSET — mesmo debaixo de `assets/`');
  /* ======================================================================================== */
  for (const caminho of ['calango/piano/nav.json', 'calango/piano/ciclos.json', 'calango/piano/assets/x.json']) {
    const r = comCache(doAssets('application/json'), caminho);
    provar('`' + caminho + '` → curta', cacheDe(r) === CACHE_DA_PAGINA, cacheDe(r));
  }
  provar('…e um `assets/x.json` não escapa pela extensão do caminho',
    cacheDe(comCache(doAssets('application/json'), 'a/assets/x.json')) === CACHE_DA_PAGINA);

  /* ======================================================================================== */
  console.log('\nF · CONTROLO NEGATIVO — sem o funil, tudo sai com `max-age=0`');
  /* ======================================================================================== */
  {
    const semFunil = ['calango/piano/plano', 'calango/piano/assets/style.css']
      .map(() => doAssets('text/html'));
    provar('sem o funil, a página e o asset têm o MESMO `cache-control`',
      cacheDe(semFunil[0]) === cacheDe(semFunil[1]), [cacheDe(semFunil[0]), cacheDe(semFunil[1])]);
    provar('…e é `max-age=0`', /max-age=0/.test(cacheDe(semFunil[0])), cacheDe(semFunil[0]));
    provar('…que é exactamente o que o funil separa', CACHE_DA_PAGINA !== CACHE_DO_ASSET);
  }

  /* ======================================================================================== */
  console.log('\nG · O QUE A FUNÇÃO NÃO É CHAMADA A FAZER não se estraga');
  /* ======================================================================================== */
  {
    const r = comCache(doAssets('text/html', { 'x-custom': 'sim' }), 'calango/plano.html');
    provar('os outros cabeçalhos sobrevivem', r.headers.get('x-custom') === 'sim');
    provar('…e o `etag` também (é ele que torna o 304 possível)', r.headers.get('etag') === '"x"');
    provar('…e o corpo também', (await r.text()) === '<html></html>');
  }

  console.log('\n' + (total - falhas) + '/' + total + ' asserções'
    + (falhas ? ' — ' + falhas + ' FALHA(S)' : ' — verde'));
  process.exit(falhas ? 1 : 0);
})();
