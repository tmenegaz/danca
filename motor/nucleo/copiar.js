/**
 * copiar.js — O BOTÃO «COPIAR», NUM SÍTIO SÓ (25/11/2026).
 *
 * O DEFEITO QUE ISTO FECHA, e é a família de sempre: a mesma marcação em três páginas e a rotina
 * numa só. O `[data-copiar]` existe no nicho «Pagar» da escola (onde **funcionava**), na coluna do
 * mês a mês e na coluna da cobrança do financeiro (onde **não fazia nada**). As duas últimas
 * emitiam o botão e nenhuma página lhes dava um ouvinte: o clique não tinha quem o escutasse, e o
 * sintoma foi o que ela descreveu — «quando eu clico no botão copiar, ele não copia nada, não
 * funciona. Se eu selecionar o texto todo e aí clicar em copiar também não funciona». Não era a
 * cópia que falhava: não havia cópia nenhuma.
 *
 * PORQUE UM MÓDULO E NÃO UM `require` DE HTML: o que se parte é o TEXTO do cliente, e o texto do
 * cliente não pode ser uma função exportada — tem de ser uma string que entre no `<script>`. Esta é
 * a única forma de as três páginas usarem a MESMA rotina sem uma delas ficar para trás: quem
 * acrescentar um quarto sítio com `[data-copiar]` importa daqui, e não copia um bloco.
 *
 * O QUE A ROTINA FAZ, e o que ela aprendeu com o que já funcionava:
 *
 *   1. `navigator.clipboard.writeText` é o caminho — e é o único que funciona quando o campo é
 *      `readonly` num telemóvel. Quando ele não existe, ou a permissão é negada, a reserva é
 *      seleccionar o campo e `execCommand("copy")`: o texto fica seleccionado e, em contexto
 *      inseguro, o «Copiar» do próprio navegador ainda serve.
 *   2. O `setSelectionRange` é o que faz o `.select()` valer num `<textarea>` de telemóvel — sem
 *      ele, o Safari selecciona a primeira linha e copia meia cobrança.
 *   3. O botão diz «Copiado» por 1,6 s. É a resposta que ela elogiou («ele muda, o botão muda de
 *      copiar para copiado. Isso é bom porque deixa claro para o usuário que a ação aconteceu»), e
 *      sem ela a pessoa carrega outra vez a pensar que não funcionou.
 *   4. O RÓTULO ORIGINAL É GUARDADO UMA VEZ, no `data-rotulo`. A versão que vivia na Produção
 *      lia o `textContent` a cada clique — dois cliques rápidos e o rótulo de origem passava a ser
 *      «Copiado», e o botão ficava a dizer isso para sempre.
 *   5. O OUVINTE NÃO SE REGISTA DUAS VEZES (`window.__copiarLigado`). Duas cópias do mesmo ouvinte
 *      na mesma página dizem «Copiado» e voltam atrás duas vezes, e o resultado é o botão a
 *      piscar sem nunca mostrar nada.
 */

const SCRIPT_DO_COPIAR = (function () {
  const linhas = [
    '(function(){',
    '  if (window.__copiarLigado) return;',
    '  window.__copiarLigado = true;',
    '  document.addEventListener("click", function(e){',
    '    var b = e.target.closest ? e.target.closest("[data-copiar]") : null;',
    '    if (!b) return;',
    '    var campo = document.getElementById(b.getAttribute("data-copiar"));',
    '    if (!campo) return;',
    '    if (!b.getAttribute("data-rotulo")) b.setAttribute("data-rotulo", b.textContent);',
    '    var voltar;',
    '    var marcar = function(){',
    '      clearTimeout(voltar);',
    '      b.textContent = "Copiado";',
    '      voltar = setTimeout(function(){ b.textContent = b.getAttribute("data-rotulo"); }, 1600);',
    '    };',
    '    var pelaSeleccao = function(){',
    '      try {',
    '        campo.focus();',
    '        campo.select();',
    '        if (campo.setSelectionRange) campo.setSelectionRange(0, String(campo.value).length);',
    '      } catch (err) { /* um campo que não se deixa seleccionar não impede o resto */ }',
    '      try { document.execCommand("copy"); } catch (err) { /* o texto fica seleccionado */ }',
    '      marcar();',
    '    };',
    '    if (navigator.clipboard && navigator.clipboard.writeText) {',
    '      navigator.clipboard.writeText(campo.value).then(marcar, pelaSeleccao);',
    '    } else {',
    '      pelaSeleccao();',
    '    }',
    '  });',
    '})();',
  ];
  return linhas.join('\n');
}());

module.exports = { SCRIPT_DO_COPIAR };
