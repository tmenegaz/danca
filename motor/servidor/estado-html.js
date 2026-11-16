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
  // A ESCALA DE RAIO da folha (`tools/templates/ciclo.css`). Esta página é servida
  // sozinha — quando ela aparece, o CSS pode ser exactamente o que falhou —, e por isso
  // DECLARA o que usa. Antes escrevia `8px` e `6px` à mão: o cartão e o botão da página
  // de estado eram os únicos do sistema com aqueles cantos.
  ':root{--raio-1:8px;--raio-2:12px;--raio-3:20px;}',
  '*{box-sizing:border-box}',
  'body{margin:0;padding:3rem 1.25rem;background:var(--cream);color:var(--tinta);font:17px/1.65 var(--serif)}',
  'main{max-width:34rem;margin:0 auto;background:var(--branco);border:1px solid var(--gold-borda);' +
    'border-radius:var(--raio-3);padding:1.5rem 1.75rem}',
  'h1{margin:0 0 .6rem;color:var(--burgundy);font-size:1.5rem;line-height:1.25}',
  'p{color:var(--soft);margin:.7rem 0}',
  'a{color:var(--burgundy);font-weight:700;text-decoration:none;border-bottom:1px dotted var(--gold-borda)}',
  'code{background:var(--creme-5);border-radius:3px;padding:0 4px;font-size:15px;color:var(--tinta)}',
  '.acoes{margin-top:1.4rem}',
  // O BOTÃO É O DA FOLHA (`:where(button)` no `ciclo.css`): sans de 15px, 10px/16px de
  // dentro, filete de 1px na marca e raio 2. Aqui ele era 8px/16px com raio de 6px e
  // 600 de peso — o único botão do sistema com aquelas medidas.
  '.acoes a{display:inline-block;padding:10px 16px;border:1px solid var(--burgundy);' +
    'border-radius:var(--raio-2);background:var(--branco);color:var(--burgundy);' +
    'font:500 15px/1.5 var(--ui);text-decoration:none}',
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
 *
 * `recarregar` ACRESCENTA UMA ESPERA QUE SE RESOLVE SOZINHA (16/11/2026). Ela descreveu o que via
 * enquanto uma escola recém-criada subia: «não tem nenhuma mensagem dizendo que é para aguardar, a
 * tela fica preta. E aí depois de um certo tempo carrega». A página de espera já existia — o que
 * faltava era ela **não deixar a pessoa a adivinhar**: com o `refresh`, o endereço volta a
 * perguntar de cinco em cinco segundos, e a escola aparece no instante em que o motor entra, sem
 * ninguém ter de recarregar à mão.
 *
 * O `refresh` NÃO ENTRA nas páginas de recusa (desabilitada, suspensa, 402). Uma página que se
 * recarrega sozinha sobre uma decisão — «está suspensa até regularizar» — martelaria o servidor
 * para reafirmar a mesma frase.
 */
function paginaEstado(titulo, corpo, { recarregar = 0 } = {}) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    (recarregar > 0 ? '<meta http-equiv="refresh" content="' + Math.max(3, Math.round(recarregar)) + '">' : '') +
    '<title>' + esc(titulo) + '</title>' +
    // A página de estado também é uma página: sem ícone, a aba fica com o globo do navegador.
    '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">' +
    '<style>' + CSS + '</style></head><body data-layout="documento" data-tela="estado"><main>' +
    '<h1>' + esc(titulo) + '</h1>' + corpo + '</main></body></html>';
}

/**
 * Resposta pronta: o `Content-Type` é sempre o mesmo, e o `status` varia.
 *
 * O `no-store` É DA PÁGINA, e não do pedido (16/11/2026). Sem ele, um `200` sem `Cache-Control`
 * entra na cache do navegador por heurística — e a página «está sendo implantado» continuava a
 * aparecer **depois** de o motor estar no ar, porque o navegador não voltava a perguntar. É o
 * mesmo defeito do `desabilitadaEm` a mandar no selo: uma resposta de um instante guardada como se
 * fosse um facto permanente. Uma página de estado é verdade por segundos, e diz-se com `no-store`.
 */
function respostaEstado(titulo, corpo, status, opcoes) {
  return new Response(paginaEstado(titulo, corpo, opcoes), {
    status,
    headers: {
      'Content-Type': 'text/html;charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

module.exports = { TOKENS, CSS, esc, paginaEstado, respostaEstado };
