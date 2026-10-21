'use strict';

/**
 * nav.js — A BARRA DE NAVEGAÇÃO DO SITE, definida UMA vez e desenhada num só lugar.
 *
 * O PROBLEMA QUE ISTO RESOLVE (20/10/2026). A barra era escrita em QUATRO sítios, cada um com a
 * sua lista, e as quatro divergiam:
 *
 *   1. o índice da escola (`montar-publicacao.js`)          — Sistema Lastro · Área do Professor · Bastidores
 *   2. o pacote do ciclo (`gerar-ciclo.sh`, `gerar_nav`)    — Ciclos · Aulas · Planejamento · Área do Professor
 *   3. a porta (`criar-escola.sh`, `gerar_nav_zero`)        — a básica, congelada na criação da escola
 *   4. os Bastidores (`navSistema`, `nav-html.js`)          — a do sistema
 *
 * O resultado, medido pela pesquisadora: indo da raiz para a anamnese, a barra VOLTAVA à antiga —
 * sem Ciclos, sem Aulas, sem Planejamento, e sem os Bastidores. Cada página era um retrato do dia
 * em que nasceu. Corrigir «os links» seria correr atrás de quatro construções para sempre, e a
 * quinta apareceria no dia seguinte.
 *
 * A INVERSÃO. A barra deixa de ser ESCRITA e passa a ser DESENHADA no momento de servir: o
 * `montar-publicacao.js` publica um `nav.json` com o menu da escola, e a ponte de produção
 * substitui o `<nav>` de toda página HTML que serve por aquele. Uma definição, um desenho, todas
 * as páginas — inclusive as que já estão geradas e nunca serão regeradas.
 *
 * POR QUE O MENU É DADO, E NÃO CÓDIGO. Quem sabe o que existe é a montagem (lê o disco: os
 * pacotes, os documentos, as aulas declaradas no `ciclos.json`). O Worker não tem `fs`. Um
 * `nav.json` é o contrato entre os dois: a montagem sabe, a ponte desenha.
 */

// O `require` é LITERAL de propósito: este módulo é empacotado para o Worker, e o empacotador não
// segue um caminho montado em tempo de execução — nem existe `path` no runtime do Worker. Um
// `path.join` aqui compila em Node e falha no deploy.
const { ABERTURA, FECHAMENTO } = require('../../tools/templates/nav-html.js');

/** Um href absoluto na raiz do domínio — é o que torna a MESMA barra válida em qualquer página. */
const absoluto = (href) => {
  const h = String(href == null ? '' : href).trim();
  if (!h) return '/';
  if (/^(https?:|mailto:|data:|#)/.test(h)) return h;
  return h.startsWith('/') ? h : '/' + h;
};

const esc = (t) => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * QUAL É O ITEM DA PÁGINA. Compara o CAMINHO, sem query nem âncora, e tolera as três formas do
 * mesmo endereço (`/x`, `/x/` e `/x/index.html`). Sem isto, o item «activo» acenderia na página
 * errada — e uma barra que diz que se está onde não se está é pior do que uma barra sem marca.
 */
function caminhoDe(entrada) {
  const s = String(entrada == null ? '' : entrada).trim();
  if (!s) return '/';
  const semQuery = s.split('#')[0].split('?')[0];
  // O `.html` sai: o Worker serve `/aula-01.html` e `/aula-01` como o MESMO documento (o
  // asset-first do Cloudflare resolve a extensão), e as duas formas têm de marcar o mesmo item.
  const semExtensao = semQuery.replace(/\.html$/, '');
  const comBarra = semExtensao.endsWith('/') ? semExtensao : semExtensao + '/';
  return comBarra.replace(/\/index\/$/, '/');
}

function hrefDoItem(item) {
  return caminhoDe(item && item.href);
}

/**
 * O item está a ser servido? Devolve `true`/`false` — e não a string do atributo, que era o que
 * aqui estava e produzia `class="class="ativo""` ao ser composta com a classe do próprio item.
 */
function ehAtivo(item, pedido) {
  const alvo = hrefDoItem(item);
  const aqui = caminhoDe(pedido);
  if (alvo === '/') return aqui === '/';
  return aqui === alvo || aqui.startsWith(alvo);
}

/**
 * O DESENHO. `menu` é o `nav.json`; `pedido` é o caminho que está a ser servido.
 *
 * A FORMA (marca, hamburger, contêiner) vem do `nav-html.js` — a mesma que o pacote e os
 * Bastidores já usam. O que muda aqui é só a LISTA, que passa a vir do dado.
 */
function desenhar(menu, pedido, extras) {
  if (!menu || !Array.isArray(menu.grupos) || !menu.grupos.length) return null;
  const itens = [];
  for (const grupo of menu.grupos) {
    if (!grupo) continue;
    if (grupo.tipo === 'menu' && Array.isArray(grupo.itens) && grupo.itens.length) {
      const links = grupo.itens.map((i) => {
        const classe = [i.classe || '', ehAtivo(i, pedido) ? 'ativo' : ''].filter(Boolean).join(' ');
        return '      <a' + (classe ? ' class="' + esc(classe) + '"' : '')
          + ' href="' + esc(absoluto(i.href)) + '">' + esc(i.rotulo) + '</a>';
      }).join('\n');
      itens.push('  <details class="menu">\n    <summary>' + esc(grupo.rotulo) + '</summary>\n'
        + '    <div class="submenu">\n' + links + '\n    </div>\n  </details>');
      continue;
    }
    // Um LINK de topo (o «Sistema Lastro»). O item activo é o que está a ser servido.
    itens.push('  <a' + (ehAtivo(grupo, pedido) ? ' class="ativo"' : '')
      + ' href="' + esc(absoluto(grupo.href)) + '">' + esc(grupo.rotulo) + '</a>');
  }
  /* O BLOCO QUE A PÁGINA TRAZ ANTES DO ☰ NÃO SE PERDE (21/10/2026).
   *
   * `ABERTURA` é a forma da barra — marca, ☰, contêiner —, e a LISTA entra dentro do
   * contêiner. Só que na página da Produção há uma terceira peça, entre a marca e o ☰: o
   * `s5-sessao` (o caminho «Pedagogia · Turmas») e o `s5-secoes` (o botão que abre a folha),
   * que o `sessaoNaBarra()` do `bastidores.js` entrega como `extras`. Eles nunca fizeram
   * parte da LISTA — são o estado da página, e por isso não estão no `nav.json`.
   *
   * Enquanto a barra era escrita na página, cada um punha o que quisesse. Quando ela passou a
   * ser DESENHADA ao servir, o desenho passou a ser um só — e apagou o que não conhecia: a
   * Produção servida deixou de ter as duas peças. O sintoma é o que se vê: rolar a página
   * deixou de levar o caminho para a barra, porque as peças que ele acende já não existiam no
   * HTML.
   *
   * O `extras` entra no MESMO lugar em que o `navSistema` o punha — depois da marca, antes do
   * ☰ —, e é opcional: sem ele, o resultado é byte a byte o de antes. */
  const abertura = extras
    ? ABERTURA.replace('  <button class="hamburger"', extras + '\n  <button class="hamburger"')
    : ABERTURA;
  return [abertura, itens.join('\n'), FECHAMENTO].join('\n');
}

/**
 * O QUE A PÁGINA JÁ TINHA ENTRE A MARCA E O ☰ — lido do próprio `<nav>`, sem lista de nomes.
 *
 * A alternativa era o `bastidores.js` voltar a passar o bloco à ponte. Mas a ponte serve
 * QUATRO origens (raiz, pacote, porta e Bastidores), e cada uma com o seu construtor de barra:
 * seria preciso ensinar o caminho até cada uma delas, e a quinta apareceria no dia seguinte —
 * é exactamente o problema que a barra desenhada ao servir veio resolver. O lugar do bloco é
 * uma propriedade da FORMA (entre a marca e o ☰), e é daí que ele sai.
 *
 * Devolve `''` quando não há nada — a maioria das páginas —, e aí nada muda.
 */
function extrasDaBarra(navHtml) {
  const texto = String(navHtml == null ? '' : navHtml);
  const fimDaMarca = texto.indexOf('</a>');
  const botao = texto.indexOf('<button class="hamburger"');
  if (fimDaMarca < 0 || botao < 0 || botao <= fimDaMarca) return '';
  return texto.slice(fimDaMarca + 4, botao).trim();
}

/**
 * SUBSTITUI a barra de uma página. Devolve `null` quando não há nada a fazer — sem barra na
 * página, ou sem menu —, e quem chama segue com o que tinha. É deliberado: uma ponte que
 * estragasse uma página por não conseguir desenhar a barra seria pior do que a barra velha.
 */
function aplicar(html, menu, pedido) {
  const texto = String(html == null ? '' : html);
  const original = /<nav class="topnav"[\s\S]*?<\/nav>/.exec(texto);
  if (!original) return null;
  /* O bloco da página é lido do `<nav>` que está lá antes de ser substituído. */
  const nav = desenhar(menu, pedido, extrasDaBarra(original[0]));
  if (!nav) return null;
  return texto.replace(/<nav class="topnav"[\s\S]*?<\/nav>/, () => nav);
}

module.exports = { desenhar, aplicar, absoluto, caminhoDe, ehAtivo, extrasDaBarra };
