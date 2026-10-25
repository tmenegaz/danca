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
 * O ÍNDICE DO GRUPO QUE ESTÁ A SER SERVIDO — e porque é que ele é preciso (23/10/2026).
 *
 * `ehAtivo()` marca o ITEM. Na barra de `details` isso chegava: o grupo abria-se e o item aceso
 * via-se lá dentro. Na COLUNA COMPACTA não chega — os grupos nascem fechados, e um item aceso
 * dentro de um grupo fechado não se vê. A marca passa a ser do GRUPO, e é ela a única coisa que
 * responde a «onde estou» sem gastar altura.
 *
 * Devolve o próprio objecto do grupo (não o índice): o desenho do `details` e o da coluna
 * precisam de o comparar por identidade, e um índice obrigaria a passar o array a quem desenha.
 */
function grupoAtual(menu, pedido) {
  const grupos = (menu && Array.isArray(menu.grupos)) ? menu.grupos : [];
  /* O DESTINO DIRECTO MANDA SOBRE O GRUPO. Um `tipo: 'link'` na coluna é um destino próprio, e
     quando um grupo tem um item que aponta para o MESMO URL (o caso em que o item de dentro do
     grupo é a acção, e a lista é a página), quem responde é o destino directo: é o mais próximo
     do que a pessoa clicou.
     Hoje não há nenhum `tipo: 'link'` na coluna — o «Aulas» do topo saiu (24/10/2026) —, e é por
     isso que `/aulas/` passa a marcar «Área do Professor», onde a lista está. A regra fica: o
     contrato do `nav.json` continua a admitir o destino directo, e sem ela o dia em que ele
     voltar marcaria o grupo errado, em silêncio. */
  const directo = grupos.find((g) => g && g.tipo !== 'menu' && ehAtivo(g, pedido));
  if (directo) return null;
  for (const grupo of grupos) {
    if (!grupo || !Array.isArray(grupo.itens)) continue;
    if (grupo.itens.some((i) => ehAtivo(i, pedido))) return grupo;
  }
  return null;
}

/** O título do documento servido, lido do `<h1>` da própria página. Ver `tituloDaPagina`. */
const TITULO_NA_BARRA = 'doc-atual';

/**
 * O DESENHO. `menu` é o `nav.json`; `pedido` é o caminho que está a ser servido.
 *
 * A FORMA (marca, hamburger, contêiner) vem do `nav-html.js` — a mesma que o pacote e os
 * Bastidores já usam. O que muda aqui é só a LISTA, que passa a vir do dado.
 *
 * DUAS FORMAS, E O MESMO DADO (23/10/2026).
 *
 *   · o menu não tem `coluna` → desenha a BARRA de sempre, `details` e submenus. É o que as
 *     escolas publicadas hoje têm, e continua a ser o que acontece a quem não pedir outra coisa.
 *     Nada muda para elas;
 *   · o menu TEM `coluna` → a lista de topo passa a ser só a `barra` (o Bastidores, na ponta
 *     direita), e os destinos de trabalho vão para um `<aside class="coluna">`. A coluna é
 *     compacta: só os títulos dos grupos, e o grupo do documento actual marcado.
 *
 * `extras` aceita as duas formas que já existiam: a string do bloco da página (a S5 da Produção)
 * e, agora, `{ extras, titulo }` — o título é o do documento, e vai para a barra.
 */
function desenhar(menu, pedido, extras) {
  if (!menu) return null;
  const bloco = (extras && typeof extras === 'object') ? (extras.extras || '') : (extras || '');
  const titulo = (extras && typeof extras === 'object') ? (extras.titulo || '') : '';

  const daFormaNova = Array.isArray(menu.coluna) && menu.coluna.length > 0;
  /* A COLUNA DESENHA-SE EM TODAS AS PÁGINAS — inclusive nos Bastidores (23/10/2026).
   *
   * Ela já foi suprimida aqui, e a razão era boa: a Produção tem a SUA coluna (a lista de
   * secções), e duas colunas lado a lado diziam duas coisas diferentes sobre onde se está.
   * Mas o remédio era pior do que o mal no TELEMONE: a lista da barra não se mostra abaixo dos
   * 1140, e quem navega é a folha — que passou a abrir só com o Bastidores. A pesquisadora
   * descreveu-o assim: «abro o hamburger de novo e só tenho bastidores; preciso de ter tudo o
   * que tinha antes de entrar em produção».
   *
   * Agora a coluna é desenhada sempre, e quem resolve o duplo no COMPUTADOR é o CSS: onde a
   * página tem a sua própria coluna (`body:has(.lateral)`), a do sistema não se mostra acima
   * dos 1140. É o mesmo HTML para as duas formas — a largura decide —, que é a regra que a
   * folha já segue desde o princípio.
   *
   * E A BARRA DOS BASTIDORES PASSA A SER A MESMA DE TODA A GENTE. Ela já vinha a ser desenhada
   * daqui — mas sem coluna, a lista que sobrava era só o grupo do Bastidores, que abaixo dos
   * 1140 se abria num acordeão. Era isso que faltava: com a coluna, o ☰ da Produção abre a
   * folha inteira, e o grupo do Bastidores entra no fim dela como último bloco.
   */
  const coluna = daFormaNova ? menu.coluna : null;
  // Sem `coluna`, o menu é o de sempre: `grupos`. Com `coluna`, a barra fica só com o que o
  // autor pôs em `barra` — e o `grupos` deixa de ser lido, para não haver duas listas vivas.
  const gruposDaBarra = daFormaNova ? (Array.isArray(menu.barra) ? menu.barra : []) : menu.grupos;
  if (!Array.isArray(gruposDaBarra) || (!gruposDaBarra.length && !coluna)) return null;

  const atualDaBarra = grupoAtual({ grupos: gruposDaBarra }, pedido);
  const itens = [];
  for (const grupo of gruposDaBarra) {
    if (!grupo) continue;
    if (grupo.tipo === 'menu' && Array.isArray(grupo.itens) && grupo.itens.length) {
      const links = grupo.itens.map((i) => {
        const classe = [i.classe || '', ehAtivo(i, pedido) ? 'ativo' : ''].filter(Boolean).join(' ');
        return '      <a' + (classe ? ' class="' + esc(classe) + '"' : '')
          + ' href="' + esc(absoluto(i.href)) + '">' + esc(i.rotulo) + '</a>';
      }).join('\n');
      // O GRUPO DA PÁGINA MARCA-SE NO PRÓPRIO `<details>` (23/10/2026). Sem isto, numa página
      // cuja lista vive dentro do grupo, o `summary` não diz nada: o `details` está fechado e o
      // único sinal fica escondido lá dentro.
      const marca = grupo === atualDaBarra ? 'atual ' : '';
      const classeDetalhes = marca ? ' class="' + marca.trim() + ' menu"' : ' class="menu"';
      itens.push('  <details' + classeDetalhes + '>\n    <summary>' + esc(grupo.rotulo) + '</summary>\n'
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
  /* O TÍTULO DO DOCUMENTO NA BARRA (23/10/2026). Ele entra no MESMO lugar do `extras` — depois
   * da marca, antes do ☰ —, e é o que responde a «em que documento estou» sem uma segunda barra.
   * Vem do `<h1>` da página (ver `tituloDaPagina`), e não do `nav.json`: o menu não sabe, nem tem
   * de saber, que documentos existem em cada pacote. Só a página sabe.
   *
   * Só entra quando há COLUNA. Na barra de hoje o título não tem onde caber: ela já leva os
   * grupos todos, e um título ao lado deles seria mais uma coisa a competir por largura. */
  /* O CAMINHO, À MODA DA PRODUÇÃO: o grupo miúdo e a página. Um título sozinho diria «Planos do
   * ciclo» sem dizer de que parte do sistema é; os dois juntos dizem «Ciclos · Planos do ciclo».
   * O `·` é do desenho (`small::after`), e não do texto — para a leitura de ecrã não colar as
   * duas palavras numa só. */
  /* A PÁGINA QUE JÁ DIZ ONDE ESTÁ NÃO GANHA UM SEGUNDO DIZER (23/10/2026). A Produção traz, na
   * própria barra, a S5 — `Produção · Painel inicial` —, que sobe e se acende quando a página
   * rola (`sessaoNaBarra()`, no `bastidores.js`). Com o caminho desenhado ao lado dela, o
   * telemóvel passaria a dizer a mesma coisa duas vezes: «Produção» à esquerda e «Produção ·
   * Painel inicial» ao centro, no instante em que se rola. O caminho é a resposta de quem NÃO
   * tem essa peça; quem tem, já respondeu. */
  const jaDizOndeEsta = /s5-sessao/.test(String(bloco));
  const caminho = (coluna && titulo && !jaDizOndeEsta) ? caminhoDaPagina(coluna, pedido, titulo) : '';
  const antesDoBotao = [bloco, caminho].filter(Boolean).join('\n  ');
  const abertura = antesDoBotao
    ? ABERTURA.replace('  <button class="hamburger"', antesDoBotao + '\n  <button class="hamburger"')
    : ABERTURA;
  let barra = [abertura, itens.join('\n'), FECHAMENTO].join('\n');
  /* A BARRA DECLARA A SUA FORMA (23/10/2026). O CSS precisa de saber se está perante o menu de
     destinos — onde a lista é só o Bastidores e ele encosta à direita — ou a barra de sempre,
     onde a lista É o menu e alinhá-la à direita deixaria um vazio depois da marca.
     A pergunta não pode ser feita com `body:has(> .coluna)`: na página onde a coluna existe mas
     está escondida pelo CSS (os Bastidores, acima dos 1140) a lista continua a ser só o
     Bastidores, e alinhá-la à direita ali é o certo. A forma é do desenho, e é o desenho que a
     declara. */
  if (daFormaNova) barra = barra.replace('<nav class="topnav"', '<nav class="topnav" data-menu="coluna"');
  return coluna ? desenharColuna(coluna, pedido, menu.barra) + barra : barra;
}

/**
 * A COLUNA — o menu de trabalho, à esquerda (23/10/2026).
 *
 * Ela é COMPACTA: mostra os títulos dos grupos e mais nada. O grupo abre no ponteiro, empurra os
 * de baixo para baixo e fecha quando o ponteiro sai — o que se ganha não é só altura (217 px
 * contra 485) é não ter de varrer onze destinos para achar um.
 *
 * O GRUPO DO DOCUMENTO ACTUAL NASCE MARCADO, e não aberto. É a decisão que faz a coluna ser
 * curta e continuar a dizer onde se está: o item aceso dentro de um grupo fechado não se vê, e
 * o `data-atual` no grupo vê-se sempre (o filete de ouro no título).
 *
 * `direto: true` é um grupo que é DESTINO e não pasta — «Aulas». Ele não tem itens: as aulas são
 * o único acervo que cresce sem parar, e enumerá-las no menu voltaria a fazer do menu um índice.
 *
 * Sem `data-aberta="sim"` a folha do celular nasce fechada, que é o que se quer: o
 * `nav.js` do cliente é quem a abre, e o CSS só a desloca.
 */
function desenharColuna(coluna, pedido, barra) {
  const atual = grupoAtual({ grupos: coluna }, pedido);

  /** Um grupo da coluna: o título-botão e os destinos por baixo. */
  const grupoHtml = (grupo) => {
    if (!grupo || !Array.isArray(grupo.itens) || !grupo.itens.length) return '';
    const chave = chaveDoGrupo(grupo);
    const marcado = grupo === atual ? ' data-atual="sim"' : '';
    const links = grupo.itens.map((i) => {
      const ativo = ehAtivo(i, pedido) ? ' aria-current="page"' : '';
      return '        <a' + ativo + ' href="' + esc(absoluto(i.href)) + '">' + esc(i.rotulo) + '</a>';
    }).join('\n');
    return '    <div class="coluna-grupo"' + marcado + '>\n'
      + '      <button type="button" class="coluna-titulo" aria-expanded="false"'
      + ' aria-controls="g-' + esc(chave) + '"><span>' + esc(grupo.rotulo) + '</span>'
      + '<span class="coluna-seta" aria-hidden="true">›</span></button>\n'
      + '      <div class="coluna-itens" id="g-' + esc(chave) + '">\n' + links + '\n      </div>\n'
      + '    </div>';
  };

  const partes = coluna.map((grupo) => {
    if (!grupo) return '';
    if (grupo.tipo !== 'menu') {
      const ativo = ehAtivo(grupo, pedido) ? ' class="coluna-direto ativo"' : ' class="coluna-direto"';
      return '    <a' + ativo + ' href="' + esc(absoluto(grupo.href)) + '">' + esc(grupo.rotulo) + '</a>';
    }
    return grupoHtml(grupo);
  }).filter(Boolean);

  /* A FOLHA CARREGA O QUE A BARRA TAMBÉM TEM (23/10/2026).
   *
   * No computador o Bastidores fica sozinho na ponta direita da barra, e está certo: a coluna é
   * o trabalho de sala, e a barra é o pouco que fica sempre à mão. Mas no telefone a lista da
   * barra NÃO SE MOSTRA — quem navega é esta folha —, e o Bastidores ficava inalcançável. A
   * pesquisadora abriu a folha no celular e disse-o: «não tem bastidores aqui, então precisa
   * ter».
   *
   * Ele entra no FIM, depois da Área do Professor, e com um filete acima: é o último item, e é
   * o único que não é trabalho de sala — é a escola a olhar-se. A ordem é a da leitura, e o
   * filete é o que diz que aquele bloco é de outra natureza sem precisar de o escrever. */
  const daBarra = (Array.isArray(barra) ? barra : []).map((grupo) => {
    if (!grupo) return '';
    const feito = grupo.tipo === 'menu'
      ? grupoHtml(grupo)
      : (() => {
        const ativo = ehAtivo(grupo, pedido) ? ' class="coluna-direto ativo"' : ' class="coluna-direto"';
        return '    <a' + ativo + ' href="' + esc(absoluto(grupo.href)) + '">' + esc(grupo.rotulo) + '</a>';
      })();
    return feito ? feito.replace('class="coluna-', 'class="coluna-fora coluna-') : '';
  }).filter(Boolean);

  const corpo = partes.concat(daBarra).join('\n');
  /* O VÉU NASCE COM A COLUNA (23/10/2026). Ele estava só nas páginas de lista, e por isso a
     raiz da escola e os Bastidores abriam a folha SEM véu — sem o escurecimento e, pior, sem o
     toque-fora que a fecha (quem fecha é o véu, no `nav.js` do cliente). Uma peça que a coluna
     precisa para funcionar tem de nascer com ela: um sítio, e não uma linha a lembrar em cada
     construtor de página.
     Ele fica FORA do `<aside>`: a coluna é `overflow-y:auto`, e um véu lá dentro rolaria com o
     conteúdo e ficaria recortado pelo canto arredondado da folha. */
  return '<aside class="coluna" id="coluna-proposta" data-aberta="nao" aria-label="Navegação do sistema">\n'
    + '  <span class="coluna-puxador" aria-hidden="true"></span>\n'
    + '  <a class="coluna-marca" href="/">Sistema Lastro</a>\n'
    + '  <nav>\n' + corpo + '\n  </nav>\n'
    + '</aside>\n'
    + '<div class="veu" aria-hidden="true"></div>\n';
}

/**
 * AS LISTAS — os destinos que já SÃO a página em que se está. Servem para o caminho não pôr um
 * degrau a apontar para si próprio, e para a trilha saber onde acaba.
 */
const LISTAS = [
  '/ciclos/planos', '/ciclos/referencias', '/aulas', '/consulta',
  '/area-do-professor/notacao',
  '/area-do-professor/anamnese', '/area-do-professor/plano-de-ensino',
  '/area-do-professor/plano-de-observacao',
];

/**
 * DE QUE LISTA VEM CADA DOCUMENTO — o «lastro» que a barra passou a mostrar (23/10/2026).
 *
 * O PROBLEMA. Na barra, o caminho dizia o grupo e o título do documento: `Ciclos ·
 * Referências Bibliográficas`. Quem abria o documento a partir da lista de referências não
 * tinha por onde voltar, e não sabia de onde tinha vindo — o `<h1>` de um documento do pacote
 * não diz a que lista pertence, e a página também não.
 *
 * A TABELA É DECLARADA, e não deduzida do `nav.json`, por uma razão de facto: o `nav.json` diz
 * quais são os DESTINOS, não que documentos cada destino produz. Quem sabe que
 * `referencias.html` sai da lista de referências é o pacote — e é esta tabela que o diz, num
 * lugar só, para as duas pontas (a montagem e a ponte) lerem o mesmo.
 *
 * As expressões casam com e sem `.html`, porque o Worker responde a `/x/referencias.html` com
 * um 307 para `/x/referencias` — a ponte vê o caminho já sem extensão.
 */
const TRILHA_DO_DOCUMENTO = [
  { re: /\/referencias(?:\.html)?$/, grupo: 'Ciclos', rotulo: 'Referências', href: '/ciclos/referencias/' },
  { re: /\/plano(?:\.html)?$/, grupo: 'Ciclos', rotulo: 'Planos', href: '/ciclos/planos/' },
  /* O GRUPO DE CADA DOCUMENTO MUDOU COM OS NOMES (24/10/2026): o «Planejamento» deixou de
     existir, a notação passou para a Área do Professor (é outra vista da mesma aula) e o
     glossário passou a «Consulta» (é a ferramenta de consulta). A tabela é a única coisa que liga
     um documento do pacote à lista de onde ele veio — e é por isso que ela tem de acompanhar o
     menu: sem isto, o caminho do documento dizia «Planejamento · Notação» numa coluna que já não
     tem esse grupo. */
  { re: /\/notacao(?:\.html)?$/, grupo: 'Área do Professor', rotulo: 'Notação', href: '/area-do-professor/notacao/' },
  { re: /\/glossario[-a-z]*(?:\.html)?$/, grupo: 'Consulta', rotulo: 'Glossário', href: '/consulta/' },
  /* O GRUPO DO DOCUMENTO É ONDE A LISTA MORA, e não o nome da lista. Com «Aulas» dentro da Área
     do Professor (24/10/2026), o caminho de uma aula diz «Área do Professor · Aulas · Aula 01» —
     três degraus que se leem de fora para dentro. Dizer «Aulas · Aulas · Aula 01» era o gaguejar
     que a regra do `repete` já cortava; agora não há o que cortar, porque os degraus diferem. */
  { re: /\/(?:aula-[0-9]+|captura-aula-[0-9]+|lancamento)(?:\.html)?$/, grupo: 'Área do Professor', rotulo: 'Aulas', href: '/aulas/' },
];

/** O caminho sem barra final e sem `.html` — a forma em que as tabelas acima são escritas. */
function enxuto(pedido) {
  return String(pedido || '/').split('?')[0].split('#')[0].replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
}

/**
 * O CAMINHO NA BARRA — «Ciclos · Referências · Referências Bibliográficas» (23/10/2026).
 *
 * TRÊS DEGRAUS, E OS DOIS PRIMEIROS SÃO CAMINHO DE VOLTA:
 *
 *   · o GRUPO (`<small>`), que não é ligação: um grupo não tem página própria — tem itens, e
 *     escolher um deles por quem lê seria adivinhar;
 *   · a LISTA de onde o documento veio, que é uma LIGAÇÃO. É o lastro: quem entrou no
 *     documento por ela sabe por onde voltar, e não precisa de usar o «atrás» do navegador;
 *   · o DOCUMENTO em que se está, a negrito.
 *
 * Na própria página de lista o degrau do meio não existe (seria uma ligação para si mesma), e o
 * caminho fica nos dois: `Ciclos · Referências`. É a mesma forma que a página já tinha — o que
 * muda é o terceiro degrau nos documentos, e o facto de o segundo poder ser clicado.
 */
function caminhoDaPagina(coluna, pedido, titulo) {
  const p = enxuto(pedido);
  const grupo = grupoAtual({ grupos: coluna }, pedido);
  // A LISTA: da tabela, quando o documento é de um pacote; senão do próprio menu.
  const daTabela = LISTAS.indexOf(p) === -1
    ? TRILHA_DO_DOCUMENTO.find((t) => t.re.test(p)) : null;
  const nomeDoGrupo = daTabela ? daTabela.grupo : (grupo ? grupo.rotulo : '');
  const volta = (daTabela && enxuto(daTabela.href) !== p)
    ? '<a href="' + esc(absoluto(daTabela.href)) + '">' + esc(daTabela.rotulo) + '</a>'
    : '';
  /* «AULAS · AULAS · AULA 01» NÃO É UM CAMINHO, É UM GAGUEJAR. Quando o grupo E a lista têm o
     mesmo nome, fica só um: o ligado, que é o que serve para voltar. Nenhuma das trilhas de hoje
     cai nisto (o «Aulas» passou para dentro da Área do Professor, 24/10/2026); a guarda fica
     porque um grupo chamado como a sua lista é um erro de dados que o desenho não deve mostrar. */
  const repete = daTabela && nomeDoGrupo === daTabela.rotulo;
  const partes = [
    (nomeDoGrupo && !repete) ? '<small>' + esc(nomeDoGrupo) + '</small>' : '',
    volta,
    '<b>' + esc(titulo) + '</b>',
  ].filter(Boolean);
  return '<span class="' + TITULO_NA_BARRA + '">' + partes.join('') + '</span>';
}

/**
 * A CHAVE DE UM GRUPO, para o `aria-controls` do título apontar para a lista certa.
 *
 * Derivada do RÓTULO e não do índice: dois grupos com o mesmo nome na mesma coluna seriam um
 * erro de dados, e é melhor que o `id` o denuncie do que o esconda. Sem acentos, sem espaços.
 */
function chaveDoGrupo(grupo) {
  const base = String((grupo && grupo.rotulo) || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base || 'grupo';
}

/**
 * O TÍTULO DO DOCUMENTO, lido do `<h1>` da página que está a ser servida.
 *
 * É a resposta barata à pergunta «em que documento estou»: o `<h1>` já existe em todas as páginas
 * do sistema, já é o título verdadeiro do documento, e não exige nem um campo novo no `nav.json`
 * nem que a montagem conheça as páginas que o ciclo vier a gerar depois.
 *
 * Devolve `''` quando não há `<h1>` — e aí a barra fica exactamente como ficaria sem título.
 */
function tituloDaPagina(html) {
  /* O `<h1>` PROCURADO É O DA PÁGINA, E NÃO O QUE ALGUÉM ESCREVEU NUM COMENTÁRIO (23/10/2026).
   *
   * O `lancamento.html` tem, dentro do `<style>`, um comentário que explica o
   * `--header-height` — e o comentário diz «punha o `<h1>` DEBAIXO da barra fixa». A busca era
   * uma expressão regular sobre o documento INTEIRO, sem distinguir marcação de estilo: ela
   * encontrava esse `<h1>` de comentário e levava tudo até ao `</h1>` verdadeiro, 1400
   * caracteres abaixo. O caminho da barra saía a dizer, em produção:
   *
   *   Aulas · DEBAIXO da barra fixa. *\/ padding: var(--header-height) 20px 40px; } h1 { color: var(--ma…
   *
   * — e foi assim que a pesquisadora o viu no celular, em texto normal, debaixo da barra.
   *
   * A correcção é o que devia ter sido desde o início: o `<style>` e o `<script>` saem antes de
   * se procurar o título. Um `<h1>` dentro deles não é um título — é texto de outro tipo, e
   * procurá-lo é o mesmo erro que ler a folha de estilo como se fosse conteúdo. */
  const semEstilo = String(html == null ? '' : html)
    .replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, ' ');
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(semEstilo);
  if (!m) return '';
  const texto = paraTexto(m[1]);
  /* O NOME, E NÃO O NOME E A SUA EXPLICAÇÃO (23/10/2026). O `<h1>` de um documento do pacote
   * costuma trazer as duas coisas separadas por travessão — «Lançamento de aula — formulário
   * eletrônico», «Plano do Ciclo 01 — batata», «Aula 01 — reconhecer o apoio e alinhar o eixo
   * vertical». A barra é um caminho, não uma ficha: nela cabe o nome, e o resto é o que a
   * página diz por extenso dois centímetros abaixo. Cortar no primeiro travessão dá o nome nos
   * quatro casos, e é a diferença entre «Lançamento de aula» e um título que não cabe no
   * telefone.
   *
   * O que fica depois do travessão NÃO se perde: está no `<h1>` da página, no título da aba e
   * no `title` do elemento na barra. */
  const nome = texto.split(/\s+[—–]\s+/)[0].trim() || texto;
  // Um título longo rouba a barra toda e é cortado de qualquer forma pelo CSS: cortar aqui é
  // dizer a verdade ao `title` do elemento, e não deixar 300 caracteres a caminho do servidor.
  return nome.length > 90 ? nome.slice(0, 89).trimEnd() + '…' : nome;
}

/** O texto de um fragmento de HTML — sem tags, com as entidades que a casa usa desfeitas. */
function paraTexto(fragmento) {
  return String(fragmento == null ? '' : fragmento)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  return texto.slice(fimDaMarca + 4, botao).trim().replace(SEM_O_CAMINHO, '').trim();
}

/**
 * O CAMINHO NÃO É UM EXTRA DA PÁGINA — é nosso, e sai do bloco antes de ele ser re-aproveitado.
 *
 * O `extrasDaBarra` lê tudo o que está entre a marca e o ☰, e a ESCOLHA de o fazer assim foi
 * certa: é o único jeito de a ponte não ter de conhecer cada construtor de barra. Mas o caminho
 * do documento (`doc-atual`) passou a morar EXACTAMENTE nesse intervalo, e por isso cada
 * passagem o lia como se fosse da página e voltava a escrevê-lo ao lado do novo. Medido na
 * `batata`: a página da notação saía com TRÊS — a montagem escrevia um, a varredura final
 * acrescentava outro, e a ponte, ao servir, um terceiro. Quem visse lia «Planejamento · Notação»
 * três vezes seguidas.
 *
 * A alternativa — mover o caminho para fora do intervalo — não existe: o intervalo é definido
 * pela posição entre a marca e o ☰, e o caminho tem de estar ali (é o lugar que a S5 da
 * Produção ocupa, e o único em que ele não empurra a lista).
 */
const SEM_O_CAMINHO = /<span class="(?:[^"]*\s)?doc-atual[^"]*"[^>]*>(?:\s*<(?:small|a|b)[^>]*>[^<]*<\/(?:small|a|b)>)*[^<]*<\/span>/g;

/**
 * SUBSTITUI a barra de uma página. Devolve `null` quando não há nada a fazer — sem barra na
 * página, ou sem menu —, e quem chama segue com o que tinha. É deliberado: uma ponte que
 * estragasse uma página por não conseguir desenhar a barra seria pior do que a barra velha.
 */
function aplicar(html, menu, pedido) {
  const texto = String(html == null ? '' : html);
  const original = /<nav class="topnav"[\s\S]*?<\/nav>/.exec(texto);
  if (!original) return null;
  /* A COLUNA JÁ DESENHADA SAI ANTES DE SE DESENHAR OUTRA (23/10/2026). O desenho devolve a
   * coluna E a barra, mas o `<nav>` é o único que se substitui — sem esta linha, cada passagem
   * deixaria a coluna antiga ao lado da nova. Acontece a sério: a montagem reescreve as páginas
   * e a ponte volta a reescrevê-las ao servir. */
  /* O VÉU VAI COM A COLUNA. Eles nascem juntos (ver `desenharColuna`) e saem juntos: sem isto,
   * cada passagem deixaria um véu órfão a mais — e três véus empilhados não são três vezes mais
   * escuros, são um `pointer-events:auto` a mais sobre a página inteira. */
  const limpo = texto.replace(/<aside class="coluna"[\s\S]*?<\/aside>\s*(?:<div class="veu"[^>]*><\/div>\s*)?/, '');
  const doLimpo = /<nav class="topnav"[\s\S]*?<\/nav>/.exec(limpo);
  if (!doLimpo) return null;
  /* O bloco da página é lido do `<nav>` que está lá antes de ser substituído. */
  const nav = desenhar(menu, pedido, {
    extras: extrasDaBarra(doLimpo[0]),
    titulo: tituloDaPagina(limpo),
  });
  if (!nav) return null;
  return limpo.replace(/<nav class="topnav"[\s\S]*?<\/nav>/, () => nav);
}

module.exports = {
  desenhar, aplicar, absoluto, caminhoDe, ehAtivo, extrasDaBarra,
  grupoAtual, tituloDaPagina, desenharColuna, chaveDoGrupo, caminhoDaPagina, TRILHA_DO_DOCUMENTO,
};
