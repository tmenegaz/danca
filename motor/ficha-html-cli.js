'use strict';

/*
 * A ficha — em branco ou preenchida — vista no navegador.
 *
 * O markdown da ficha é o mesmo que o motor grava em disco, e ele é linear
 * demais para justificar uma biblioteca: negrito, itálico, títulos, tabelas,
 * citação, lista, régua e a moldura ASCII do cabeçalho. Um renderizador
 * mínimo cobre tudo isso e não acrescenta dependência a um experimento que é
 * Node puro.
 *
 * A exceção é a moldura do cabeçalho (as 14 linhas de `┌─┐ │ └─┘`, com 396
 * colunas): ela só se alinha em fonte monoespaçada, e é o único trecho que
 * continua dentro de um `<pre>`. Alinhamento de coluna é informação.
 *
 * A identidade visual é a do formulário (`index.html`) — mesmos tokens, mesma
 * serifa. A ficha é a mesma folha, vista depois da marca.
 */

/*
 * O renderizador de markdown vive em `assets/markdown.js` — uma definição só,
 * consumida por esta ficha (Node) e pela porta (navegador). Aqui ele é só
 * reexportado com o nome que o resto deste arquivo já usava.
 */
const {
  markdownParaHtml,
  paginaDaFicha,
  paginaDaFichaEmBranco,
  corpoDaFicha,
} = require('./nucleo/ficha-html.js');

// ------------------------------------------------------------- autoteste

function autoteste() {
  const casos = [];
  const conferir = (nome, obtido, esperado) => {
    casos.push({ nome, ok: obtido === esperado, obtido, esperado });
  };
  const tem = (nome, obtido, trecho) => {
    const contem = obtido.includes(trecho);
    casos.push({ nome, ok: contem, obtido, esperado: 'contém ' + JSON.stringify(trecho) });
  };
  const naoTem = (nome, obtido, trecho) => {
    const ausente = !obtido.includes(trecho);
    casos.push({ nome, ok: ausente, obtido, esperado: 'não contém ' + JSON.stringify(trecho) });
  };

  // 1. O sintoma relatado: a alternativa marcada perde o `☐` e chega com os
  //    asteriscos literais.
  const marcada = markdownParaHtml(
    '**Conhecimento prévio de balé clássico**\n' +
      '☐ Nunca fez  ☐ Até 2 anos  ☐ De 2 a 5 anos  **Mais de 5 anos**\n'
  );
  tem('negrito da alternativa marcada', marcada, '<strong>Mais de 5 anos</strong>');
  naoTem('sem asteriscos literais', marcada, '**');
  tem('linhas contíguas num só parágrafo', marcada, '☐ De 2 a 5 anos  <strong>Mais de 5 anos</strong>');
  conferir('um parágrafo só para o bloco', (marcada.match(/<p>/g) || []).length, 1);

  // 2. Itálico aninhado à direita de um negrito (as três dimensões).
  tem(
    'itálico depois do negrito',
    markdownParaHtml('**1ª posição — pés** — *de* as cinco posições\n'),
    '<strong>1ª posição — pés</strong> — <em>de</em> as cinco posições'
  );

  // 3. Itálico por fora de um negrito de uma palavra.
  tem(
    'itálico envolvendo rótulo',
    markdownParaHtml('*Dimensão:* tecnica\n'),
    '<em>Dimensão:</em> tecnica'
  );

  // 4. O escape: nada que o texto traga vira marcação.
  const comAngulo = markdownParaHtml('☐ Mantém > 5 s sem oscilação severa\n');
  tem('maior-que escapado', comAngulo, '&gt; 5 s');
  naoTem('sem tag injetada', markdownParaHtml('texto <script>alert(1)</script>\n'), '<script>');
  tem(
    'menor-que escapado',
    markdownParaHtml('texto <b>cru</b>\n'),
    '&lt;b&gt;cru&lt;/b&gt;'
  );

  // 5. A moldura continua monoespaçada — é o que preserva as 396 colunas.
  const moldura = markdownParaHtml('┌──┐\n│ a │\n└──┘\n');
  tem('moldura em pre', moldura, '<pre class="moldura">');
  tem('moldura inteira num bloco só', moldura, '┌──┐\n│ a │\n└──┘');
  conferir('uma moldura, um pre', (moldura.match(/<pre/g) || []).length, 1);

  // 6. Régua de seção.
  conferir('regua vira hr', markdownParaHtml('---\n'), '<hr>\n');
  conferir('asteriscos também', markdownParaHtml('***\n'), '<hr>\n');

  // 7. A linha de preenchimento é campo em branco, não separador.
  const preenchimento = markdownParaHtml('______________________________\n');
  tem('preenchimento preservado', preenchimento, '<p class="linha">');
  naoTem('preenchimento não é hr', preenchimento, '<hr>');

  // 8. Tabela com inline dentro da célula.
  const tabela = markdownParaHtml(
    '| Elemento | Natureza |\n|:--|:--|\n| ▸ 1ª posição — pés | *de* as cinco posições |\n'
  );
  tem('tabela aberta', tabela, '<table>');
  tem('cabeçalho em th', tabela, '<th>Elemento</th>');
  tem('inline na célula', tabela, '<td><em>de</em> as cinco posições</td>');
  conferir('o separador não vira linha', (tabela.match(/<tr>/g) || []).length, 2);

  // 9. Citação.
  const citacao = markdownParaHtml('> É o primeiro porque é fundamento.\n');
  tem('citacao em blockquote', citacao, '<blockquote><p>');
  naoTem('sem marcador cru', citacao, '> É o primeiro');

  // 10. Lista.
  const lista = markdownParaHtml('- **tecnica** — a execução\n- **artistica** — a intenção\n');
  tem('lista aberta', lista, '<ul>');
  tem('item com negrito', lista, '<li><strong>tecnica</strong> — a execução</li>');
  conferir('dois itens', (lista.match(/<li>/g) || []).length, 2);

  // 11. Código em linha.
  tem('codigo em linha', markdownParaHtml('dentro da `linhaDeBase`\n'), '<code>linhaDeBase</code>');

  // 12. O degrau dos títulos: no markdown o `#` é título; na folha, o `<h1>` é
  //     o da página.
  conferir('titulo no markdown', markdownParaHtml('# T\n'), '<h1>T</h1>\n');
  conferir('titulo na folha', markdownParaHtml('# T\n', 2), '<h2>T</h2>\n');
  tem('titulo da folha rebaixado', paginaDaFicha('# T\n', 'x'), '<h2>T</h2>');

  // 13. O id do envelope vem da URL e é escapado.
  tem('id escapado na folha', paginaDaFicha('# T\n', '<x>'), '&lt;x&gt;');
  tem('titulo da aba', paginaDaFicha('# T\n', 'id'), '<title>Ficha preenchida — id</title>');

  // 14. A folha tem a identidade do sistema.
  const folha = paginaDaFicha('# T\n', 'id');
  tem('tokens do sistema', folha, '--cream: #fbf8f3;');
  tem('tinta do sistema', folha, '--tinta: #1f1c1a;');
  tem('serifa do sistema', folha, "Georgia, 'Times New Roman', serif");

  // 15. A aba é escapada como qualquer outro dado da URL.
  tem('aba escapada', paginaDaFicha('# T\n', '<x>'), '<title>Ficha preenchida — &lt;x&gt;</title>');

  // 16. A ficha em branco é a mesma folha, sem marca e sem id.
  const emBranco = paginaDaFichaEmBranco('# T\n');
  tem('branco: titulo da folha', emBranco, '<h1>Ficha em branco</h1>');
  tem('branco: titulo da aba', emBranco, '<title>Ficha em branco — anamnese</title>');
  tem('branco: identidade do formulário', emBranco, '<main class="folha">');
  tem('branco: degrau dos títulos', emBranco, '<h2>T</h2>');
  tem('branco: aviso sem marca', emBranco, 'Nenhuma resposta foi aplicada');
  naoTem('branco: sem cabeçalho de preenchida', emBranco, 'Conferência do envelope');
  naoTem('branco: sem id', emBranco, 'undefined');

  const falhas = casos.filter((caso) => !caso.ok);
  for (const caso of casos) {
    process.stdout.write(
      (caso.ok ? 'ok   ' : 'FALHA') +
        '  ' +
        caso.nome +
        (caso.ok
          ? ''
          : '  — obtido ' +
            JSON.stringify(caso.obtido).slice(0, 240) +
            ', esperado ' +
            JSON.stringify(caso.esperado).slice(0, 240)) +
        '\n'
    );
  }
  process.stdout.write(
    '\nautoteste: ' + (casos.length - falhas.length) + ' de ' + casos.length + ' passaram\n'
  );
  return falhas.length === 0 ? 0 : 1;
}

function principal(argv) {
  if (argv.includes('--autoteste')) return autoteste();

  const posicao = argv.indexOf('--arquivo');
  if (posicao === -1 || !argv[posicao + 1]) {
    process.stderr.write(
      'uso: node porta/ficha-html.js --autoteste\n' +
      '     node porta/ficha-html.js --arquivo <ficha.md> [--branco] [--folha <id>] [--saida <arq.html>]\n'
    );
    return 2;
  }

  const caminho = argv[posicao + 1];
  const markdown = require('node:fs').readFileSync(caminho, 'utf8');
  const daFolha = argv.indexOf('--folha');
  let html;
  if (argv.includes('--branco')) html = paginaDaFichaEmBranco(markdown);
  else if (daFolha === -1) html = markdownParaHtml(markdown);
  else html = paginaDaFicha(markdown, argv[daFolha + 1]);

  const destino = argv.indexOf('--saida');
  if (destino === -1) process.stdout.write(html);
  else require('node:fs').writeFileSync(argv[destino + 1], html, 'utf8');
  return 0;
}

module.exports = { markdownParaHtml, paginaDaFicha, paginaDaFichaEmBranco, corpoDaFicha, autoteste };

if (require.main === module) {
  process.exitCode = principal(process.argv.slice(2));
}
