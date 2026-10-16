'use strict';

/**
 * ficha-html.js — a ficha (em branco ou preenchida) vista no navegador.
 *
 * A parte PURA do renderizador HTML da ficha, sem CLI nem `node:fs`: o
 * markdown vira a folha com a identidade visual do formulário. Nada aqui
 * importa infraestrutura — só o `markdown.js` compartilhado (puro). O CLI
 * (`--autoteste`, `--arquivo`) fica no adaptador Node
 * (`../porta/ficha-html.js`).
 */

const Markdown = require('../../porta/assets/markdown.js');
const { escapar } = Markdown;
const markdownParaHtml = Markdown.paraHtml;

const ESTILO = `
  :root {
    --tinta: #1c1a17;
    --papel: #faf7f2;
    --borda: #ded5c8;
    --suave: #7d7365;
    --acento: #7a4b2a;
    --ok: #2f6b4f;
    --alerta: #9a5b1e;
    --erro: #a33a2c;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--papel);
    color: var(--tinta);
    font: 16px/1.6 "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  }
  .folha { max-width: 54rem; margin: 0 auto; padding: 2.5rem 1.5rem 6rem; }
  h1 { font-size: 1.6rem; margin: 0 0 .25rem; }
  h2 { font-size: 1.15rem; margin: 2rem 0 .5rem; }
  h3 { font-size: 1rem; margin: 1.5rem 0 .35rem; }
  h4 { font-size: .95rem; margin: 1.25rem 0 .3rem; }
  h5, h6 { font-size: .9rem; margin: 1rem 0 .3rem; color: var(--suave); }
  p { margin: .5rem 0; white-space: pre-wrap; }
  p.linha { color: var(--suave); margin: .35rem 0; }
  .sub { color: var(--suave); font-size: .9rem; margin: 0 0 1.5rem; }
  hr { border: 0; border-top: 1px solid var(--borda); margin: 1.75rem 0; }
  .caixa {
    border: 1px solid var(--borda);
    background: #fff;
    border-radius: 3px;
    padding: 1rem 1.15rem;
    margin: 1rem 0;
  }
  .caixa.nota { background: #fdfbf6; }
  p.aviso {
    margin: 0;
    border-left: 3px solid var(--alerta);
    padding-left: .8rem;
    color: #6d4a1c;
    font-family: system-ui, sans-serif;
    font-size: .9rem;
    line-height: 1.5;
  }
  table { border-collapse: collapse; width: 100%; font-size: .9rem; margin: .75rem 0; }
  th, td { text-align: left; border-bottom: 1px solid var(--borda); padding: .35rem .5rem; vertical-align: top; }
  ul { margin: .5rem 0; padding-left: 1.25rem; }
  li { margin: .15rem 0; }
  blockquote {
    margin: .75rem 0;
    padding: .1rem 0 .1rem .9rem;
    border-left: 3px solid var(--borda);
    color: #5a5348;
  }
  blockquote p { margin: 0; }
  /* As aspas do projeto («») destacam um termo no meio da prosa. */
  .citacao { font-style: italic; color: #5a5348; }
  code {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: .88em;
    background: #fff;
    border: 1px solid var(--borda);
    border-radius: 3px;
    padding: 0 .25rem;
  }
  pre {
    background: #fff;
    border: 1px solid var(--borda);
    border-radius: 3px;
    padding: .8rem 1rem;
    overflow-x: auto;
    font-size: .82rem;
    line-height: 1.5;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  }
  pre.moldura { font-size: .72rem; line-height: 1.3; }
  /*
   * A folha é de VISUALIZAÇÃO e de IMPRESSÃO (16/10/2026). Na tela, o rolo
   * horizontal do PRE é a saída para uma moldura larga numa janela estreita;
   * no papel não há rolo — o que passa da página é CORTADO. Como a moldura é
   * monoespaçada, o que a faz caber é o corpo da letra: no papel ela encolhe
   * até caber, em vez de sumir na margem.
   */
  @media print {
    pre { overflow: visible; }
    pre.moldura { font-size: .6rem; line-height: 1.25; }
    .folha { max-width: none; }
  }
`;

/*
 * O `<h1>` da folha é o desta página, não o do documento: o markdown entra um
 * degrau abaixo, para a ficha não abrir com dois títulos de mesmo peso.
 */
function corpoDaFicha(markdown) {
  return markdownParaHtml(markdown, 2);
}

/*
 * A folha é uma só — a mesma `<main class="folha">`, os mesmos tokens, a mesma
 * serifa. O que distingue a ficha em branco da preenchida é só o cabeçalho: a
 * em branco é a folha antes da marca, não uma segunda identidade visual.
 * `sub` entra como HTML já montado — quem chama é que escapa o que é dado.
 */
function folha(markdown, { aba, titulo, sub, aviso }) {
  return [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + escapar(aba) + '</title>',
    '<style>' + ESTILO + '</style>',
    '</head>',
    '<body>',
    '<main class="folha">',
    '<h1>' + escapar(titulo) + '</h1>',
    sub,
    '<div class="caixa nota"><p class="aviso">' + aviso + '</p></div>',
    corpoDaFicha(markdown),
    '</main>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function paginaDaFicha(markdown, id) {
  return folha(markdown, {
    aba: 'Ficha preenchida — ' + String(id),
    titulo: 'Ficha preenchida',
    sub: '<p class="sub">Conferência do envelope <strong>' + escapar(String(id)) + '</strong>.</p>',
    aviso: [
      'Ficha preenchida com as respostas gravadas.',
      'O texto é o mesmo da ficha em branco — mesmas seções, mesmas molduras —,',
      'e a marca é o que muda.',
    ].join('\n'),
  });
}

/*
 * A ficha em branco é a mesma folha sem marca: o renderizador entra sem
 * `respostas`, então nenhuma alternativa é marcada e as lacunas continuam
 * lacunas. Não há id — a versão em branco não preenche registro nenhum —, e
 * dizê-lo é mais honesto do que inventar um rótulo.
 */
function paginaDaFichaEmBranco(markdown) {
  return folha(markdown, {
    aba: 'Ficha em branco — anamnese',
    titulo: 'Ficha em branco',
    sub: '<p class="sub">Sem marca: para conferir as seções, as molduras e as lacunas.</p>',
    aviso: [
      'Nenhuma resposta foi aplicada — as lacunas continuam lacunas.',
      'A ficha preenchida é esta mesma folha depois da marca.',
    ].join('\n'),
  });
}

/*
 * A FOLHA DO PLANO (16/10/2026). Na estante, o que ficou gravado abria o ENVELOPE CRU — o
 * JSON — e isso não é do professor: ele quer o documento na mão, para ler e imprimir, sem
 * navegar formulário a formulário. Este é o MESMO gesto da ficha preenchida da anamnese, e
 * a mesma folha: um `<h1>`, a serifa, a largura de leitura.
 *
 * O texto que entra é o da fonte do ciclo (`derivar-plano-ciclo.js`), e é de propósito: o
 * que o professor imprime é o plano que a aula vai seguir — não uma segunda versão dele,
 * que poderia dizer outra coisa no dia em que o documento e a tela divergissem.
 */
function paginaDoPlano(markdown, id, meta) {
  const m = meta || {};
  return folha(markdown, {
    aba: (m.title || 'Plano de ensino') + ' — ' + String(id),
    titulo: m.title || 'Plano de ensino',
    sub: '<p class="sub">O plano inteiro, como ficou gravado — registro <strong>' +
      escapar(String(id)) + '</strong>.</p>',
    aviso: 'O plano que você preencheu, inteiro, para ler e imprimir. ' +
      'A lacuna que restar fica declarada — nenhum campo é preenchido por adivinhação.',
  });
}

module.exports = {
  markdownParaHtml,
  paginaDaFicha,
  paginaDaFichaEmBranco,
  paginaDoPlano,
  corpoDaFicha,
};
