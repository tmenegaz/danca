'use strict';

/**
 * paginacao.js — o rodapé de páginas de uma lista, e o cliente que o faz andar (23/10/2026).
 *
 * PORQUE ISTO SAIU DA PRODUÇÃO. A paginação nasceu dentro do `bastidores.js`, escrita para as
 * sete listas do gabinete — e ali ficou, inline, como um bloco de `'…' + '…'` no meio de uma
 * função que monta a página inteira. Enquanto fosse o único consumidor, era só feio. Quando a
 * lista de aulas da publicação passou de 35 linhas e precisou da mesma coisa, passou a ser o
 * problema que a casa já resolveu uma vez: duas cópias do mesmo comportamento divergem na
 * primeira correcção, e a segunda cópia é sempre a que ninguém se lembra de corrigir.
 *
 * Por isso o comportamento mudou-se para o NÚCLEO, e as duas superfícies o consomem:
 *   · a Produção (`motor/servidor/bastidores.js`), que o inventou;
 *   · as páginas de lista (`motor/nucleo/lista-html.js`), que o passaram a precisar.
 *
 * SEM `fs`, como o resto do núcleo: recebe nada e devolve marcação e texto.
 *
 * A REGRA QUE FAZ O FILTRO E A PAGINAÇÃO CONVIVEREM. Um item fora do filtro não conta para a
 * paginação — senão filtrar para duas turmas mostraria «1 / 3» e duas páginas vazias. Quem
 * filtra marca `data-fora="sim"` em vez de esconder com `hidden`, e chama `paginar()`. É a
 * mesma disciplina que a Produção já usava, e é por isso que o filtro da lista pode reusá-la
 * sem inventar um segundo acordo.
 */

/** O rodapé. Nasce `hidden`: sem JavaScript ele não aparece, e a lista mostra tudo. */
function marcacao() {
  return '<div class="paginas" hidden>'
    + '<button type="button" class="paginas-ant acao secundario pequena" aria-label="Página anterior">‹</button>'
    + '<span class="paginas-info"></span>'
    + '<button type="button" class="paginas-prox acao secundario pequena" aria-label="Página seguinte">›</button>'
    + '</div>';
}

/**
 * O cliente. Uma função global (`window.paginar`) porque o filtro da lista precisa de a chamar
 * depois de recontar — e um `CustomEvent` seria mais cerimónia do que o problema pede.
 *
 * O `data-pagina` vive no ATRIBUTO do painel, e não numa variável: a página da Produção recarrega
 * a cada operação, e o que estava no DOM é o que sobrevive.
 */
const script = `function paginar() {
  var paineis = document.querySelectorAll("[data-paginar]");
  for (var p = 0; p < paineis.length; p++) {
    var painel = paineis[p];
    var ul = painel.querySelector("ul");
    var rodape = painel.querySelector(".paginas");
    if (!ul || !rodape) continue;
    var porPagina = parseInt(painel.getAttribute("data-por-pagina") || "10", 10);
    var todos = Array.prototype.slice.call(ul.children);
    var itens = todos.filter(function (x) { return x.getAttribute("data-fora") !== "sim"; });
    for (var f = 0; f < todos.length; f++) {
      if (todos[f].getAttribute("data-fora") === "sim") todos[f].hidden = true;
    }
    var paginas = Math.max(1, Math.ceil(itens.length / porPagina));
    var atual = Math.min(Math.max(1, parseInt(painel.getAttribute("data-pagina") || "1", 10)), paginas);
    painel.setAttribute("data-pagina", atual);
    for (var i = 0; i < itens.length; i++) {
      itens[i].hidden = (Math.floor(i / porPagina) + 1) !== atual;
    }
    var info = rodape.querySelector(".paginas-info");
    if (info) info.textContent = atual + " / " + paginas;
    var ant = rodape.querySelector(".paginas-ant");
    var prox = rodape.querySelector(".paginas-prox");
    if (ant) ant.disabled = atual <= 1;
    if (prox) prox.disabled = atual >= paginas;
    rodape.hidden = paginas <= 1;
  }
}
window.paginar = paginar;
document.addEventListener("click", function (e) {
  var b = e.target.closest ? e.target.closest(".paginas button") : null;
  if (!b) return;
  var painel = b.closest("[data-paginar]");
  if (!painel) return;
  /* QUAL dos dois botões — por CLASSE, não pela string do atributo. Aqui já esteve
     \`b.className === "paginas-prox"\`, e o \`className\` de um elemento é o atributo inteiro: a
     comparação era sempre falsa, os dois botões valiam -1, e a lista ficava na página 1. */
  var passos = b.classList && b.classList.contains("paginas-prox") ? 1 : -1;
  painel.setAttribute("data-pagina", parseInt(painel.getAttribute("data-pagina") || "1", 10) + passos);
  paginar();
});
paginar();`;

module.exports = { marcacao, script };
