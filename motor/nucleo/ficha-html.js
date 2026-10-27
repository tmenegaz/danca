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
  /*
   * A folha é servida SOZINHA: o Worker devolve este HTML sem <link>, e por isso ela
   * não pode referenciar \`tools/templates/ciclo.css\`. Ela então DECLARA os mesmos
   * valores — e \`tools/check-identidade.js\` confere cada um contra a fonte de verdade.
   * Um tom novo entra lá primeiro; aqui só se copia o que já foi medido.
   */
  :root {
    --tinta: #1f1c1a;
    --cream: #fbf8f3;
    --branco: #ffffff;
    --soft: #5a5348;
    --burgundy: #6b1f2e;
    --gold-texto: #7a5c31;
    --gold-borda: #a08a58;
    --creme-1: #fdfaf5;
    --creme-5: #f1eae0;
    --creme-6: #f7f1e7;
    --gold-escuro: #8a6a3b;
    --ok: #1d6b2f;
    --alerta: #8f5a12;
    --falha: #9b1c1c;
    /* As duas pilhas do projeto, e só duas: serifa na prosa, sans no maquinário. */
    --serif: Georgia, 'Times New Roman', serif;
    --ui: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    /* A ESCALA DE RAIO, a mesma da folha (tools/templates/ciclo.css). A ficha não
       carrega o ciclo.css — é servida sozinha —, e por isso DECLARA o que usa. Sem
       estes três valores ela escrevia 4px à mão, e o cartão da ficha saía com um
       raio que não existe em nenhum outro lugar do sistema. */
    --raio-1: 8px;
    --raio-2: 12px;
    --raio-3: 20px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--cream);
    color: var(--tinta);
    font: 17px/1.65 var(--serif);
  }
  .folha { max-width: 54rem; margin: 0 auto; padding: 2.5rem 1.5rem 6rem; }
  h1 { font-size: 1.6rem; margin: 0 0 .25rem; color: var(--burgundy); }
  h2 { font-size: 1.15rem; margin: 2rem 0 .5rem; color: var(--burgundy); }
  h3 { font-size: 1rem; margin: 1.5rem 0 .35rem; color: var(--burgundy); }
  h4 { font-size: .95rem; margin: 1.25rem 0 .3rem; color: var(--gold-texto); }
  h5, h6 { font-size: .9rem; margin: 1rem 0 .3rem; color: var(--soft); }
  p { margin: .5rem 0; white-space: pre-wrap; }
  p.linha { color: var(--soft); margin: .35rem 0; }
  .sub { color: var(--soft); font-size: .9rem; margin: 0 0 1.5rem; }
  hr { border: 0; border-top: 1px solid var(--gold-borda); margin: 1.75rem 0; }
  /* O CARTÃO É O DA FOLHA, e não um cartão parecido (18/10/2026): mesmo raio
     (--raio-3), mesmo fundo de superfície, mesma medida de dentro. Aqui ele tinha
     border-radius: 4px, um número que não existia em nenhum outro lugar — e o
     documento impresso e a tela mostravam o mesmo objeto com dois cantos. */
  .caixa {
    border: 1px solid var(--gold-borda);
    background: var(--branco);
    border-radius: var(--raio-3);
    padding: 16px 24px;
    margin: 1rem 0;
  }
  .caixa.nota { background: var(--creme-1); }
  p.aviso {
    margin: 0;
    border-left: 3px solid var(--alerta);
    padding-left: .8rem;
    color: var(--alerta);
    font-family: var(--ui);
    font-size: .9rem;
    line-height: 1.5;
  }
  table { border-collapse: collapse; width: 100%; font-size: .9rem; margin: .75rem 0; }
  th, td { text-align: left; border-bottom: 1px solid var(--gold-borda); padding: .35rem .5rem; vertical-align: top; }
  ul { margin: .5rem 0; padding-left: 1.25rem; }
  li { margin: .15rem 0; }
  blockquote {
    margin: .75rem 0;
    padding: .1rem 0 .1rem .9rem;
    border-left: 3px solid var(--gold-borda);
    color: var(--soft);
  }
  blockquote p { margin: 0; }
  /* As aspas do projeto («») destacam um termo no meio da prosa. */
  .citacao { font-style: italic; color: var(--soft); }
  /* O CÓDIGO É O DA FOLHA (18/10/2026). Ele era branco com filete de ouro; a folha
     usa o creme do código, sem filete, e o pre no creme mais fundo. O documento
     impresso lia-se como um objeto à parte do resto do sistema — e é o mesmo. */
  code {
    font-size: 15px;
    background: var(--creme-5);
    border-radius: 3px;
    padding: 0 4px;
  }
  pre {
    background: var(--creme-6);
    border: 1px solid var(--gold-escuro);
    border-radius: 6px;
    padding: 12px 16px;
    overflow-x: auto;
    font-size: .82rem;
    line-height: 1.5;
  }
  pre.moldura { font-size: .72rem; line-height: 1.3; }
  /*
   * A folha é de VISUALIZAÇÃO e de IMPRESSÃO (16/10/2026). Na tela, o rolo
   * horizontal do PRE é a saída para uma moldura larga numa janela estreita;
   * no papel não há rolo — o que passa da página é CORTADO. Como a moldura é
   * monoespaçada, o que a faz caber é o corpo da letra: no papel ela encolhe
   * até caber, em vez de sumir na margem.
   *
   * A impressão NÃO herda tema: esta folha declara sempre a paleta clara, e é
   * assim que ela sai no papel.
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
    // A ficha é aberta numa aba própria (o professor imprime ou lê). O ícone é o do
    // sistema — o mesmo de todas as superfícies, num caminho absoluto para não depender
    // de onde a ficha foi montada.
    '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">',
    '<style>' + ESTILO + '</style>',
    '</head>',
    '<body data-layout="documento" data-tela="ficha">',
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

/*
 * A FOLHA DO PLANO DE OBSERVAÇÃO (27/10/2026). Até aqui o PO não tinha folha: na estante abria
 * o envelope CRU, e a listagem não abria nada. A pesquisadora pediu os três — «ler e, se quiser,
 * até imprimir» —, e o PO é o documento em que o professor decide o que vai observar: é
 * exactamente o que se lê antes de entrar em sala.
 *
 * O texto é o do `derivarPO`, que é o MESMO que vira a fonte do ciclo (`escrever-po.js`). Não é
 * uma segunda versão do documento: é o documento, na folha.
 */
function paginaDoPO(markdown, id, meta) {
  const m = meta || {};
  return folha(markdown, {
    aba: (m.title || 'Plano de Observação') + ' — ' + String(id),
    titulo: m.title || 'Plano de Observação',
    sub: '<p class="sub">O Plano de Observação inteiro, como ficou gravado — registro <strong>' +
      escapar(String(id)) + '</strong>.</p>',
    aviso: 'O que você decidiu observar, com que régua e em que condições — para ler e imprimir. '
      + 'A lacuna que restar fica declarada: nenhum campo é preenchido por adivinhação.',
  });
}

module.exports = {
  markdownParaHtml,
  paginaDaFicha,
  paginaDaFichaEmBranco,
  paginaDoPlano,
  paginaDoPO,
  corpoDaFicha,
};
