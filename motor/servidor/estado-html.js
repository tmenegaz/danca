'use strict';

/**
 * estado-html.js — as páginas de ESTADO do sistema (escola desabilitada, configuração
 * incorreta, Área do Professor fechada, implantação em andamento).
 *
 * Por que existe: estas páginas aparecem quando o resto não está disponível — e era
 * justamente aí que a identidade se perdia. Cada uma trazia o seu `<style>` com a mesma
 * paleta castanha (`#3a2b1f` / `#faf6ee` / `#6b5b4a` / `#6b2f2f`), que não é a do
 * sistema. Agora há UMA folha para as quatro, com os tokens da fonte de verdade.
 *
 * Ela é DECLARADA, e não referenciada: quando a página de estado aparece, o CSS pode
 * ser exatamente o que falhou. `tools/check-identidade.js` confere cada valor contra
 * `tools/templates/ciclo.css` — o mesmo regime do deck Marp e da ficha.
 */

const TOKENS = {
  '--tinta': '#1f1c1a',
  '--cream': '#fbf8f3',
  '--branco': '#ffffff',
  '--soft': '#5a5348',
  '--burgundy': '#6b1f2e',
  '--gold-texto': '#7a5c31',
  '--gold-borda': '#a08a58',
  '--creme-5': '#f1eae0',
};

const CSS = [
  ':root{' + Object.entries(TOKENS).map(([k, v]) => k + ':' + v + ';').join('') + '}',
  ':root{--serif:Georgia,"Times New Roman",serif;--ui:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}',
  '*{box-sizing:border-box}',
  'body{margin:0;padding:3rem 1.25rem;background:var(--cream);color:var(--tinta);font:17px/1.65 var(--serif)}',
  'main{max-width:34rem;margin:0 auto;background:var(--branco);border:1px solid var(--gold-borda);' +
    'border-radius:8px;padding:1.5rem 1.75rem}',
  'h1{margin:0 0 .6rem;color:var(--burgundy);font-size:1.5rem;line-height:1.25}',
  'p{color:var(--soft);margin:.7rem 0}',
  'a{color:var(--burgundy);font-weight:700;text-decoration:none;border-bottom:1px dotted var(--gold-borda)}',
  'code{background:var(--creme-5);border:1px solid var(--gold-borda);border-radius:3px;' +
    'padding:0 .2em;font-size:.92em}',
  '.acoes{margin-top:1.4rem}',
  '.acoes a{display:inline-block;padding:.5rem 1rem;border:1px solid var(--burgundy);' +
    'border-radius:6px;font:600 .95rem/1.2 var(--ui)}',
].join('');

function esc(valor) {
  return String(valor == null ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Monta a página. `corpo` é HTML já escapado por quem chama — é a única parte variável,
 * e ela é composta por quem conhece o dado (o `subdominio`, o `ESCOLA_SLUG`, o link).
 */
function paginaEstado(titulo, corpo) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + esc(titulo) + '</title>' +
    '<style>' + CSS + '</style></head><body data-layout="documento" data-tela="estado"><main>' +
    '<h1>' + esc(titulo) + '</h1>' + corpo + '</main></body></html>';
}

/** Resposta pronta: o `Content-Type` é sempre o mesmo, e o `status` varia. */
function respostaEstado(titulo, corpo, status) {
  return new Response(paginaEstado(titulo, corpo), {
    status,
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
}

module.exports = { TOKENS, CSS, esc, paginaEstado, respostaEstado };
