'use strict';

/**
 * nav-html.js — o ESQUELETO da barra de navegação do sistema, em UM lugar.
 *
 * Por que existe: o markup da `.topnav` (a marca vazia, o hamburger, o contêiner
 * `.nav-links`) estava escrito à mão em dois lugares — no `gerar_nav` do
 * `tools/gerar-ciclo.sh` (pacotes gerados) e no `topnav()` do
 * `motor/servidor/bastidores.js` (páginas servidas pelo Worker). Um `<span>` novo no
 * hamburger tinha de ser lembrado nos dois, e um deles ficaria para trás em silêncio.
 *
 * O que NÃO é compartilhado, de propósito: **a lista de itens**. A do pacote é o menu
 * do ciclo (documentos, aulas, acompanhamentos) e nasce da `DOCS` — é construção; a
 * dos Bastidores é o menu do sistema (Sistema Lastro, Área do Professor, Bastidores) e
 * tem três destinos fixos. O que se compartilha é a FORMA, não o conteúdo.
 *
 * Uso:
 *   node tools/templates/nav-html.js --abertura  → as linhas de abertura (com `\n`)
 *   node tools/templates/nav-html.js --fechamento → `</div>` + botão do tema + `</nav>`
 *   node tools/templates/nav-html.js --tema       → só o botão do tema
 *   require('./nav-html.js').navSistema(...)      → a barra inteira do sistema
 */

/**
 * A MARCA NA BARRA (18/10/2026). O `<span class="marca">` existia VAZIO desde que o texto
 * «Ciclo NN · escola» saiu do menu: era um espaço reservado de 9em só para o menu não colar à
 * esquerda. Ele passa a receber a logomarca em SVG, e o `fill="currentColor"` é o que faz a
 * marca valer nas três famílias: na barra ela veste o `--sobre-marca` da família — o token que
 * significa «a cor do que fica EM CIMA da barra» — e no papel vestiria o `--marca-texto`.
 * Nenhuma família precisa de uma exportação própria da marca.
 *
 * O SVG vem como STRING de `marca-lastro.js`, e não de um arquivo lido com `fs`: este módulo é
 * usado também pelo `motor/servidor/bastidores.js`, que vai empacotado para o Worker, e lá não
 * há `fs`. E vem INLINE, e não por `<img>`, porque uma `<img>` não herda `currentColor` — a
 * marca ficaria com a cor gravada no arquivo, que é exatamente o problema que ela resolve.
 *
 * Comprimento: 3,1KB de caminhos, ~1KB comprimido no transporte. É o preço de a marca não ter
 * cor própria; a alternativa (uma cópia por família e por modo, seis arquivos de imagem)
 * pesaria mais e ficaria a envelhecer.
 */
const { SVG: MARCA } = require('./marca-lastro.js');

/** O `<span>` da marca, com o `aria-hidden` que ele já tinha: é ornamento, e o nome do sistema
 *  está dito nos links ao lado. */
const MARCA_NA_BARRA = '  <span class="marca" aria-hidden="true">' + MARCA + '</span>';

const ABERTURA = [
  '<nav class="topnav" aria-label="Navegação do ciclo">',
  MARCA_NA_BARRA,
  '  <button class="hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-links">',
  '    <span></span><span></span><span></span>',
  '  </button>',
  '  <div class="nav-links" id="nav-links">',
].join('\n');

/**
 * O BOTÃO DO TEMA **SAIU DA BARRA DAS ESCOLAS** (18/10/2026).
 *
 * Ele existia para a pessoa escolher a aparência no seu navegador. A decisão **C15** —
 * «de quem é a preferência?» — foi tomada: **é da escola**. Uma escolha que vale para
 * todos não pode ter, ao lado, um botão que a desfaça por visitante; e o controlo passou a
 * viver **na Produção**, que é onde só a escola e o professor principal entram. O modo é
 * aplicado **no servidor**, no `<html>` de cada página servida.
 *
 * A constante fica **vazia de propósito**, e não é código morto: é o lugar onde o botão
 * estava, e o comentário que diz por que saiu. Quem procurar `class="tema"` no gerador
 * encontra aqui a razão, em vez de a deduzir.
 */
const BOTAO_TEMA = '';

/** O FECHAMENTO: só o painel e a barra. O botão do tema não entra (ver acima). */
const FECHAMENTO = ['  </div>', '</nav>'].join('\n');

/** A barra do SISTEMA — os três destinos que existem em qualquer escola.
 *
 *  `extras` é markup opcional inserido logo DEPOIS do lugar da logo e ANTES do
 *  hambúrguer. Serve à S5 (o caminho «PEDAGOGIA · Turmas» sobe para a barra quando a
 *  página rola); sem `extras` o resultado é byte a byte o de antes, e é por isso que
 *  as outras páginas não mudam. O hambúrguer continua com `margin-left:auto`: o que
 *  entra antes dele ocupa o vão, e ele NÃO anda — que é a condição da S5. */
function navSistema({ atual = '', anamnese, plano, po, estudio = '/bastidores/estudio', producao = '/bastidores/producao', extras = '' } = {}) {
  const classe = (nome) => (nome === atual ? ' class="ativo"' : '');
  return [
    '<nav class="topnav" aria-label="Navegação do ciclo">',
    MARCA_NA_BARRA,
    extras ? '  ' + extras : null,
    '  <button class="hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-links">',
    '    <span></span><span></span><span></span>',
    '  </button>',
    '  <div class="nav-links" id="nav-links">',
    '<a href="/index.html">Sistema Lastro</a>',
    '<details class="menu">',
    '<summary>Área do Professor</summary>',
    '<div class="submenu">',
    '<a' + classe('anamnese') + ' href="' + anamnese + '">Anamnese do aluno</a>',
    '<a' + classe('plano') + ' href="' + plano + '">Plano de ensino</a>',
    '<a' + classe('po') + ' href="' + po + '">Plano de Observação</a>',
    '</div>',
    '</details>',
    '<details class="menu">',
    '<summary>Bastidores</summary>',
    '<div class="submenu">',
    '<a' + classe('estudio') + ' href="' + estudio + '">Estúdio de Dança</a>',
    '<a' + classe('producao') + ' href="' + producao + '">Produção</a>',
    '</div>',
    '</details>',
    FECHAMENTO,
  ].filter((linha) => linha !== null).join('\n');
}

module.exports = { ABERTURA, BOTAO_TEMA, FECHAMENTO, MARCA, MARCA_NA_BARRA, navSistema };

if (require.main === module) {
  const arg = process.argv[2];
  if (arg === '--abertura') process.stdout.write(ABERTURA + '\n');
  else if (arg === '--tema') process.stdout.write(BOTAO_TEMA + '\n');
  else if (arg === '--fechamento') process.stdout.write(FECHAMENTO + '\n');
  else {
    process.stderr.write('uso: node tools/templates/nav-html.js --abertura|--tema|--fechamento\n');
    process.exit(1);
  }
}
