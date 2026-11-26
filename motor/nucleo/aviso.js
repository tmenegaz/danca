'use strict';

/**
 * aviso.js — O AVISO DO GESTO, NUM SÍTIO SÓ (26/11/2026).
 *
 * O DEFEITO QUE ISTO FECHA. O «Marcar recebido» do livro dos consultores foi escrito com duas
 * escolhas que falham em silêncio: um `window.prompt` — que devolve `null` sem lançar nada quando o
 * browser o suprime, e o código fazia `return` — e um recado que escrevia no formulário de cadastro,
 * no TOPO da página, enquanto o botão estava na tabela, em baixo. Ela carregou, o browser não abriu
 * nada, e o ecrã não disse nada: «marquei como pago» e o livro não tinha o elo.
 *
 * A PEÇA JÁ EXISTIA na folha — a pilha `.avisos` com o `.aviso-do-gesto` (ok · erro · atenção, com
 * botão de fechar e prazo) —, mas só os Bastidores a sabiam emitir: a função `avisar` vivia dentro
 * do script da página de Produção. É a mesma história do `copiar.js`: uma rotina numa página, e as
 * outras a emitirem a marcação sem ninguém para a escutar.
 *
 * PORQUE É MÓDULO E NÃO UM `require` DE HTML: o que se parte é o TEXTO do cliente, e o texto do
 * cliente não pode ser uma função exportada — tem de ser uma string que entre no `<script>`.
 *
 * A PILHA ENTRA NO CASCO DO PAINEL (`pagina()`, do `painel-html.js`), e não em cada página: são
 * todas as páginas do dono que precisam de dizer «não deu», e uma página que a esquecesse seria a
 * próxima a falhar em silêncio. Uma vez por documento.
 */

/**
 * A PILHA — `role="status"` e `aria-live="polite"`.
 *
 * O `aria-live` não é decoração: um aviso que só existe visualmente não chega a quem usa leitor de
 * ecrã, e é exactamente o mesmo defeito que o aviso invisível do CSS — a mensagem existe e não é
 * recebida. `polite` porque nenhum destes avisos interrompe o que a pessoa está a fazer.
 */
const PILHA = '<div class="avisos" id="avisos" role="status" aria-live="polite"></div>';

/**
 * O SCRIPT — a função `avisar(tipo, texto)` e o botão de fechar.
 *
 * A ORDEM É A MAIS RECENTE EM CIMA (`insertBefore` no primeiro), pela mesma razão dos Bastidores: a
 * pilha tem `overflow`, e um erro que entra no fim fica escondido por baixo do «ok» anterior.
 *
 * O PRAZO É DE OITO SEGUNDOS e morre com o elemento: um aviso fechado à mão não deixa um
 * `setTimeout` a correr para apagar o que já não existe.
 *
 * E `window.__avisarLigado` impede o registo duplo — a mesma guarda do `copiar.js`, e pela mesma
 * razão: dois ouvintes na mesma página não estragam nada aqui (não há ouvinte global, cada aviso
 * nasce por chamada), mas a função é reescrita e a segunda cópia é a que fica.
 */
const SCRIPT_DO_AVISO = (function () {
  const linhas = [
    '(function(){',
    '  if (window.__avisarLigado) return;',
    '  window.__avisarLigado = true;',
    '  var TIPOS = ["ok", "erro", "atencao"];',
    '  window.avisar = function(tipo, texto){',
    '    var pilha = document.getElementById("avisos");',
    /* SEM PILHA NÃO SE INVENTA UMA: quem chamou esqueceu-se do casco, e criar um `div` solto no
     * `body` seria uma segunda forma de a pilha existir. Devolve `null`, e o chamador sabe que não
     * mostrou nada — o silêncio é explícito. */
    '    if (!pilha) return null;',
    '    var qual = TIPOS.indexOf(String(tipo || "")) === -1 ? "atencao" : String(tipo);',
    '    var el = document.createElement("div");',
    '    el.className = "aviso-do-gesto";',
    '    el.setAttribute("data-tipo", qual);',
    '    el.setAttribute("role", "alert");',
    '    var p = document.createElement("p");',
    '    p.className = "aviso-do-gesto-texto";',
    '    p.textContent = String(texto == null ? "" : texto);',
    '    var b = document.createElement("button");',
    '    b.type = "button";',
    '    b.className = "aviso-do-gesto-fechar";',
    '    b.setAttribute("aria-label", "Fechar este aviso");',
    '    b.title = "Fechar";',
    '    b.textContent = "\\u00D7";',
    '    var fechar = function(){ if (el.parentElement) el.parentElement.removeChild(el); };',
    '    b.addEventListener("click", fechar);',
    '    el.appendChild(p);',
    '    el.appendChild(b);',
    '    pilha.insertBefore(el, pilha.firstChild || null);',
    '    setTimeout(fechar, 8000);',
    '    return el;',
    '  };',
    '})();',
  ];
  return linhas.join('\n');
}());

module.exports = { PILHA, SCRIPT_DO_AVISO };
