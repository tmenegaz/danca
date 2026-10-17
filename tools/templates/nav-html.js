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

const ABERTURA = [
  '<nav class="topnav" aria-label="Navegação do ciclo">',
  '  <span class="marca" aria-hidden="true"></span>',
  '  <button class="hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-links">',
  '    <span></span><span></span><span></span>',
  '  </button>',
  '  <div class="nav-links" id="nav-links">',
].join('\n');

/**
 * O BOTÃO DO TEMA. Fica FORA do `.nav-links`: aquele painel colapsa no celular, e a
 * aparência tem de continuar alcançável com o menu fechado. O estado é publicado em
 * `aria-pressed` e o rótulo diz o que o clique FAZ.
 */
const BOTAO_TEMA =
  '<button class="tema" type="button" aria-pressed="false" ' +
  'aria-label="Ativar a aparência noturna" title="Aparência clara ou noturna">◐</button>';

/**
 * O FECHAMENTO inclui o botão do tema DEPOIS do `</div>`: o `.nav-links` colapsa no
 * celular, e a aparência tem de continuar alcançável com o menu fechado. A ordem
 * importa — o botão fica entre o painel fechado e o `</nav>`, dentro da barra.
 */
const FECHAMENTO = ['  </div>', BOTAO_TEMA, '</nav>'].join('\n');

/** A barra do SISTEMA — os três destinos que existem em qualquer escola. */
function navSistema({ atual = '', anamnese, plano, po, estudio = '/bastidores/estudio', producao = '/bastidores/producao' } = {}) {
  const classe = (nome) => (nome === atual ? ' class="ativo"' : '');
  return [
    '<nav class="topnav" aria-label="Navegação do ciclo">',
    '  <span class="marca" aria-hidden="true"></span>',
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
  ].join('\n');
}

module.exports = { ABERTURA, BOTAO_TEMA, FECHAMENTO, navSistema };

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
