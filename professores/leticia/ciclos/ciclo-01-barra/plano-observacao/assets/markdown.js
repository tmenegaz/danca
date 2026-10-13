'use strict';

/*
 * O renderizador de Markdown do experimento — INFRAESTRUTURA, não conteúdo.
 *
 * Ele nasceu dentro do `ficha-html.js` (que o escreveu para a ficha) e passou a
 * ser consumido por DOIS lados: a ficha (Node) e a porta (navegador). Em vez de
 * uma segunda cópia, há UMA definição — esta —, e os dois a consomem. É a mesma
 * lei que tirou os construtores de vista do formulário (`tools/lib-vistas.js`):
 * uma definição só, e a cópia não existe.
 *
 * O subconjunto é deliberado: negrito, itálico, código, títulos, listas,
 * tabelas, citação, régua, a moldura ASCII e os marcadores do projeto. Não é
 * CommonMark; é o que o projeto escreve — e o que ele escreve é verificado pelo
 * autoteste do `ficha-html.js`.
 *
 * Duas convenções do projeto que este renderizador conhece:
 *
 *   «texto»   as ASPAS do projeto (tipografia portuguesa). Não são markdown —
 *             mas o conteúdo as usa como DESTAQUE de um termo, e a tela as
 *             estiliza (`.citacao`) para não ficarem soltas no meio da prosa.
 *   _texto_   a linha de PREENCHIMENTO (campo em branco) da ficha — vira
 *             `<p class="linha">`, que preserva o espaço onde se escreve.
 *
 * UMD: funciona no Node (`module.exports`) e no navegador (`window.Markdown`).
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Markdown = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const MOLDURA = /^[┌│└]/;

  const REGRAS = {
    titulo: /^(#{1,6})\s+(.*?)\s*$/,
    regua: /^ {0,3}(?:-{3,}|\*{3,})\s*$/,
    preenchimento: /^ {0,3}_{3,}\s*$/,
    citacao: /^ {0,3}>/,
    lista: /^ {0,3}[-*+]\s+/,
    tabela: /^\s*\|/,
    separador: /^\s*\|[\s:|-]+\|\s*$/,
  };

  function escapar(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /*
   * A ordem importa: o negrito sai primeiro porque 18 linhas das três dimensões
   * escrevem `*Dimensão:* tecnica` — itálico por fora, negrito de uma palavra
   * por dentro. Invertido, o `*…*` casaria com o miolo errado.
   *
   * O escape vem antes de tudo, e as tags entram depois: nada que o texto traga
   * vira marcação.
   */
  function inline(texto) {
    return escapar(texto)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // As aspas do projeto: um termo entre «» ganha a classe que a tela estiliza.
      .replace(/«([^»]+)»/g, '<span class="citacao">«$1»</span>');
  }

  function ehSeparadorDeTabela(linha) {
    return REGRAS.separador.test(linha);
  }

  function inicioDeBloco(linha) {
    return (
      !linha.trim() ||
      MOLDURA.test(linha) ||
      REGRAS.titulo.test(linha) ||
      REGRAS.regua.test(linha) ||
      REGRAS.preenchimento.test(linha) ||
      REGRAS.citacao.test(linha) ||
      REGRAS.lista.test(linha) ||
      REGRAS.tabela.test(linha)
    );
  }

  function celulas(linha) {
    const partes = linha.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
    return partes.map((celula) => inline(celula.trim()));
  }

  function tabela(linhas, inicio) {
    let i = inicio;
    const cabecalho = celulas(linhas[i]);
    i += 2;
    const corpo = [];
    while (i < linhas.length && REGRAS.tabela.test(linhas[i])) {
      corpo.push(celulas(linhas[i]));
      i += 1;
    }
    const html = ['<table>', '<thead>', '<tr>'];
    for (const celula of cabecalho) html.push('<th>' + celula + '</th>');
    html.push('</tr>', '</thead>', '<tbody>');
    for (const linha of corpo) {
      html.push('<tr>');
      for (const celula of linha) html.push('<td>' + celula + '</td>');
      html.push('</tr>');
    }
    html.push('</tbody>', '</table>');
    return { html: html.join('\n'), proximo: i };
  }

  /**
   * Markdown → HTML. `nivel` é a base dos títulos (a ficha entra em `<h2>`, e um
   * `#` do conteúdo vira `<h2>`).
   */
  function paraHtml(markdown, nivel) {
    const base = nivel || 1;
    const linhas = String(markdown == null ? '' : markdown).split('\n');
    const saida = [];
    let i = 0;

    while (i < linhas.length) {
      const linha = linhas[i];

      if (!linha.trim()) {
        i += 1;
        continue;
      }

      // A moldura é uma corrida contígua: as bordas e as linhas de conteúdo.
      if (MOLDURA.test(linha)) {
        const bloco = [];
        while (i < linhas.length && MOLDURA.test(linhas[i])) {
          bloco.push(linhas[i]);
          i += 1;
        }
        saida.push('<pre class="moldura">' + escapar(bloco.join('\n')) + '</pre>');
        continue;
      }

      const titulo = REGRAS.titulo.exec(linha);
      if (titulo) {
        const grau = Math.min(6, titulo[1].length + base - 1);
        saida.push('<h' + grau + '>' + inline(titulo[2]) + '</h' + grau + '>');
        i += 1;
        continue;
      }

      if (REGRAS.regua.test(linha)) {
        saida.push('<hr>');
        i += 1;
        continue;
      }

      // A linha de preenchimento é um campo em branco, não um separador de
      // seção: virar `<hr>` apagaria o espaço onde a aluna escreve.
      if (REGRAS.preenchimento.test(linha)) {
        saida.push('<p class="linha">' + escapar(linha.trim()) + '</p>');
        i += 1;
        continue;
      }

      if (REGRAS.tabela.test(linha) && i + 1 < linhas.length && ehSeparadorDeTabela(linhas[i + 1])) {
        const pronta = tabela(linhas, i);
        saida.push(pronta.html);
        i = pronta.proximo;
        continue;
      }

      if (REGRAS.citacao.test(linha)) {
        const bloco = [];
        while (i < linhas.length && REGRAS.citacao.test(linhas[i])) {
          bloco.push(linhas[i].replace(/^ {0,3}> ?/, ''));
          i += 1;
        }
        saida.push('<blockquote><p>' + inline(bloco.join('\n')) + '</p></blockquote>');
        continue;
      }

      if (REGRAS.lista.test(linha)) {
        const itens = [];
        while (i < linhas.length && REGRAS.lista.test(linhas[i])) {
          itens.push('<li>' + inline(linhas[i].replace(/^ {0,3}[-*+]\s+/, '')) + '</li>');
          i += 1;
        }
        saida.push('<ul>\n' + itens.join('\n') + '\n</ul>');
        continue;
      }

      /*
       * Parágrafo. As linhas contíguas ficam no mesmo `<p>` — no markdown da
       * ficha a quebra simples é a quebra visual, e o `pre-wrap` da folha a
       * preserva. É ele que mantém as caixas alinhadas em
       * `☐ Nunca fez  ☐ Até 2 anos` sem virar tabela.
       */
      const paragrafo = [];
      while (i < linhas.length && !inicioDeBloco(linhas[i])) {
        paragrafo.push(linhas[i]);
        i += 1;
      }
      saida.push('<p>' + inline(paragrafo.join('\n')) + '</p>');
    }

    return saida.join('\n') + '\n';
  }

  /**
   * O caso curto: um texto de UMA linha (a explicação de um nó, um rótulo, uma
   * nota). Devolve só o `inline` — sem `<p>` —, para entrar dentro do parágrafo
   * de quem chamou. É o que a porta usa em quase todo o conteúdo.
   */
  function paraLinha(texto) {
    return inline(texto);
  }

  return { paraHtml, paraLinha, inline, escapar };
});
