'use strict';

/**
 * lista-html.js — AS PÁGINAS DE LISTA, geradas na montagem (23/10/2026).
 *
 * PORQUE ISTO EXISTE. O menu deixou de enumerar documentos: passou a ter destinos (Ciclos,
 * Aulas, Planejamento, Área do Professor), e cada destino leva a uma página que lista o que
 * existe. Sem estas páginas, o menu novo não teria para onde apontar.
 *
 * PORQUE É UM MÓDULO DO NÚCLEO, E NÃO UM PEDAÇO DO `montar-publicacao.js`. Duas razões, e as
 * duas são de manutenção:
 *
 *   · a página é feita de PEÇAS do sistema (`.caixa`, `.selo`, `.acao`, `.trio`), e quem confere
 *     que elas existem é o `check-identidade`. Ele precisa de gerar a página para a medir — e não
 *     pode chamar `montar-publicacao.js`, que lê o disco inteiro e escreve em `publicacao/`;
 *   · o módulo não tem `fs`. Recebe os dados já lidos, e devolve uma string. É o que permite
 *     medi-lo com uma amostra pequena, como se faz com a ficha e com as páginas de estado.
 *
 * O QUE ELE **NÃO** FAZ. Não lê o disco, não decide o que existe (isso é da montagem), e não
 * desenha a barra (isso é do `nav.js`, que recebe o `nav` já pronto). A fronteira é a mesma do
 * resto do núcleo: quem sabe o que existe é quem tem `fs`; quem sabe desenhar é este.
 */

const paginacao = require('./paginacao.js');

const esc = (t) => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * AS CAIXAS DO CARTÃO — até três, e a que tiver painel abre-o.
 *
 * A ORDEM É FIXA, E É ELA QUE FAZ A IDENTIDADE (24/10/2026). Em toda a lista, a primeira caixa
 * responde «de quem é isto», a segunda «quem fez», a terceira «quando». Muda o RÓTULO — Turma ou
 * Aluna, Professor ou Quem fez, Período ou Data —, nunca o LUGAR. Quem varre as listas do sistema
 * lê-as com o mesmo gesto do olho, e é o que a listagem de «Turmas cadastradas» já fazia sem o
 * declarar.
 *
 * CADA CAIXA É UM `<button class="trio-item">`: a CAIXA INTEIRA é o alvo, e o «?» é desenho
 * (`aria-hidden`). É a peça de `tools/templates/ciclo.css`, a mesma que a Produção usa.
 *
 * UMA CAIXA SEM PAINEL NÃO LEVA «?». O «?» promete que há mais dentro; numa lista que só tem um
 * valor para mostrar, ele seria uma promessa falsa — e um alvo que não faz nada.
 */
function caixasDoCartao(caixas, id) {
  const botoes = caixas.map((c) => {
    const chave = 'p-' + escapavel(c.rotulo) + '-' + id;
    const abre = c.painel
      ? ' aria-expanded="false" aria-controls="' + chave + '"'
      : ' data-sem-painel="sim"';
    return '        <button type="button" class="trio-item" data-balao="' + esc(escapavel(c.rotulo))
      + '"' + abre + ' aria-label="ver ' + esc(c.rotulo.toLowerCase()) + ' deste registo">'
      + '<span class="trio-k">' + esc(c.rotulo) + '</span>'
      + '<span class="trio-v">' + esc(c.valor || '—') + '</span>'
      + '<span class="trio-q" aria-hidden="true">' + (c.painel ? '?' : '') + '</span></button>';
  }).join('\n');
  const paineis = caixas.filter((c) => c.painel).map((c) =>
    '      <div class="trio-painel" data-painel="' + esc(escapavel(c.rotulo))
    + '" id="p-' + escapavel(c.rotulo) + '-' + id + '" hidden>' + c.painel + '</div>').join('\n');
  return '      <div class="trio">\n' + botoes + '\n      </div>'
    + (paineis ? '\n' + paineis : '');
}

/** A chave de um `id`: sem acentos, sem espaços, sem maiúsculas. */
function escapavel(texto) {
  return String(texto || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * UM CARTÃO DA LISTA — a linha do nome, a linha de contexto, e o que houver para abrir.
 *
 * UM SÓ CARTÃO PARA TODAS AS LISTAS (24/10/2026). Havia dois: o dos planos, com três caixas, e o
 * dos documentos, mais simples. Diziam a mesma coisa com desenhos diferentes — e, com a listagem
 * a passar a ser o padrão de TODAS as listas, dois desenhos seriam duas identidades. O que muda de
 * uma lista para outra é o DADO de cada cartão, não a função que o desenha.
 *
 * TRÊS FORMAS, e o dado é que escolhe:
 *
 *   · `caixas` — o que tem detalhe dentro. Até três, na ordem fixa de `caixasDoCartao`;
 *   · `fatos` — o que NÃO tem nada para abrir: as referências, o glossário e a notação. Os mesmos
 *     factos numa linha de texto, sem caixa. Uma caixa que não abre nada é decoração, e decoração
 *     gasta altura sem dizer mais;
 *   · nenhum dos dois — o cartão fica na linha do nome, com as ações.
 *
 * A LINHA DE CONTEXTO É UMA SÓ, e não repete o que as caixas dizem: é a regra que a lista dos
 * planos já seguia, e a primeira informação a envelhecer seria sempre a repetida.
 */
function cartaoDaLista(item, indice) {
  const id = String(indice + 1);
  const busca = [item.nome, item.turma, item.professor, item.contexto].filter(Boolean)
    .join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const selo = item.selo
    ? ' <span class="selo ' + esc(item.seloClasse || 'discreto') + '">' + esc(item.selo) + '</span>'
    : '';
  const acoes = (item.acoes || []).filter(([, href]) => href)
    /* O QUARTO ELEMENTO É A EXPLICAÇÃO (`title`). Ela não é decoração: «editar» e «ajustar» são
       gestos diferentes, e a diferença — o que se apaga, o que permanece — não cabe no rótulo.
       Quem não vê o `title` (o telemóvel) perde a frase, mas não perde o gesto: o rótulo diz o
       que vai acontecer, e os dois nunca fazem a mesma coisa. */
    .map(([rotulo, href, classe, dica]) =>
      '<a class="acao ' + (classe || '') + ' pequena" href="' + esc(href) + '"'
      + (dica ? ' title="' + esc(dica) + '"' : '') + '>' + esc(rotulo) + '</a>')
    .join('');
  const fatos = (item.fatos || []).filter(Boolean).length
    ? '<div class="fatos">' + item.fatos.filter(Boolean)
      .map((f) => '<span>' + esc(f) + '</span>').join('') + '</div>'
    : '';
  const caixas = (item.caixas || []).length ? caixasDoCartao(item.caixas, id) : '';

  return '  <li class="trio-plano" data-busca="' + esc(busca) + '"'
    + ' data-prof="' + esc(item.professor || '') + '" data-turma="' + esc(item.turma || '') + '">'
    + '\n    <div class="trio-linha">'
    + '\n      <span class="trio-nome"><b>' + esc(item.nome) + '</b>' + selo + '</span>'
    + '\n      <span class="trio-acoes">' + acoes + '</span>'
    + '\n    </div>'
    + (fatos ? '\n    ' + fatos : '')
    + (item.contexto ? '\n    <div class="trio-dono">' + esc(item.contexto) + '</div>' : '')
    + (caixas ? '\n' + caixas : '')
    + '\n  </li>';
}

/**
 * UMA CAIXA DE TEXTO PARA O PAINEL — pares rótulo/valor, e uma nota opcional.
 *
 * É o corpo que os painéis partilham, e existe para a montagem não escrever marcação: quem sabe
 * como se desenha um painel é este módulo, e a Produção tinha a própria cópia desta grelha.
 */
function painelDoCartao(pares, nota) {
  const grade = '<div class="trio-grade">' + (pares || []).filter(([k]) => k)
    .map(([k, v]) => '<div><span class="trio-k">' + esc(k) + '</span><span class="trio-v">'
      + esc(v || '—') + '</span></div>').join('') + '</div>';
  return grade + (nota ? '<p class="trio-nota">' + esc(nota) + '</p>' : '');
}

/**
 * O filtro — todo no cliente, sobre a marcação já montada: nem rede, nem KV, nem cota do ar.
 *
 * ELE SERVE AS DUAS LISTAS (23/10/2026). Nasceu com três controles para os planos (busca,
 * professor, turma). A lista de aulas pediu o mesmo, e o professor não é um campo dela: uma aula
 * não tem professor no cartão — o professor está na turma, e a turma já está no filtro. Um
 * controle que só tem uma opção a repetir a mesma coisa é ruído, e ruído num filtro faz duvidar
 * do que ele esconde.
 *
 * Por isso a forma do controle é a mesma e o que muda é o que existe para filtrar: `campos` diz
 * quais dos três desenhar, e a contagem leva o rótulo do que se está a contar. `singular` e
 * `plural` existem porque «1 aulas» é o género de erro que ninguém revê.
 */
function filtro(itens, { campos = ['busca', 'professor', 'turma'], singular = 'plano', plural = 'planos',
  dica, semCaixa = false } = {}) {
  const valores = (chave) => [...new Set(itens.map((p) => p[chave]).filter(Boolean))].sort();
  const professores = valores('professor');
  const turmas = valores('turma');
  const opcoes = (lista) => lista.map((v) => `<option>${esc(v)}</option>`).join('');
  const busca = campos.indexOf('busca') !== -1
    ? `<div class="campo-filtro busca">
      <label class="campo-rotulo" for="f-busca">Procurar</label>
      <input id="f-busca" type="search" placeholder="${esc(dica || 'pelo nome, pela turma ou pelo professor')}">
    </div>` : '';
  const doProfessor = campos.indexOf('professor') !== -1 && professores.length
    ? `<div class="campo-filtro">
      <label class="campo-rotulo" for="f-prof">Professor</label>
      <select id="f-prof"><option value="">todos</option>${opcoes(professores)}</select>
    </div>` : '';
  const daTurma = campos.indexOf('turma') !== -1 && turmas.length
    ? `<div class="campo-filtro">
      <label class="campo-rotulo" for="f-turma">Turma</label>
      <select id="f-turma"><option value="">todas</option>${opcoes(turmas)}</select>
    </div>` : '';
  /* SEM CAIXA QUANDO VAI DENTRO DE UM BLOCO (25/10/2026). O bloco já é uma `.caixa`; uma segunda
     moldura por dentro seria uma caixa dentro de uma caixa — e o desenho diria duas vezes a mesma
     coisa. Fora do bloco (as outras cinco listas) a moldura continua a ser dele. */
  const moldura = semCaixa ? 'filtrar' : 'caixa filtrar';
  return `<form class="filtro" onsubmit="return false" data-singular="${esc(singular)}" data-plural="${esc(plural)}">
  <div class="${moldura}">
    ${busca}
    ${doProfessor}
    ${daTurma}
    <p class="filtro-conta" id="f-conta">${itens.length} ${itens.length === 1 ? esc(singular) : esc(plural)}</p>
  </div>
</form>`;
}

/**
 * A PÁGINA. `nav` entra pronto (o desenho é do `nav.js`); o resto é dado.
 *
 * Nenhum `<style>` aqui: a folha do sistema vem em `/assets/style.css`, e uma página que
 * redeclare o desenho das peças é exactamente o que a checagem «Forma» reprova.
 */
function paginaDeLista({ titulo, subtitulo, nav, itens = [], planos = null, vazio, aviso,
  campos, singular, plural, porPagina = 0, dica, acao = null, painel = null,
  criar = '', ficha = '', script = null }) {
  /* `acao` É O BOTÃO DO TOPO (as outras cinco listas usam-no). `criar` e `ficha` são as ACÇÕES
   * DO MENU do painel: o rótulo que a fonte dá a «criar» e o endereço que gera a folha. São
   * parâmetros diferentes porque são coisas diferentes — passar `acao` junto com `painel`
   * desenharia o botão do topo AO LADO de um menu que já cria, que é exactamente a duplicação
   * que o painel veio acabar. */
  const semNada = `<p class="aviso">${esc(vazio || 'Ainda não há nada para listar nesta escola.')}</p>`;
  /* UMA FORMA DE LISTA (24/10/2026). Havia duas — os planos, com as três caixas, e os documentos,
   * mais simples —, e a diferença era o desenho de cada cartão. Com a listagem a ser o padrão de
   * TODAS as listas, dois desenhos seriam duas identidades: o que muda de uma lista para outra é
   * o DADO de cada cartão (`caixas`, `fatos`, ou nenhum dos dois), não a função que o desenha.
   *
   * `planos` continua aceite como sinónimo de `itens`: a montagem chamava-o assim, e um nome
   * antigo a funcionar é melhor do que uma lista a sair vazia por causa do nome.
   *
   * `painel` E `script` (25/10/2026) — o bloco que vai ACIMA da lista, e o JavaScript que o põe a
   * funcionar. Existem porque a Área do Professor passou a ter o contexto do ato dentro da própria
   * listagem: um `details` com os campos, as acções de começar e o estado do preenchimento. Ficam
   * como parâmetros, e não como um segundo desenho de página, para a lista continuar a ser UMA —
   * quem não os passa recebe exactamente a página de antes. */
  const linhas = (itens && itens.length) ? itens : (planos || []);
  const cartoes = linhas.map((i, n) => (typeof i === 'string' ? i : cartaoDaLista(i, n)));
  const conta = { singular: singular || 'documento', plural: plural || 'documentos', dica };
  /* A PAGINAÇÃO SÓ EXISTE SE ALGUÉM A PEDIR (`porPagina`). Ela é a peça da Produção, e o
     rodapé nasce `hidden`: com uma página só ele não aparece, e sem JavaScript a lista mostra
     tudo. Não se pagina uma lista de dois planos para mostrar um botão desactivado. */
  const blocoFiltro = cartoes.length
    ? filtro(linhas, { campos, ...conta, semCaixa: !!painel }) : '';
  const blocoLista = cartoes.length
    ? (porPagina
      ? `<div data-paginar data-por-pagina="${Number(porPagina)}">\n`
        + '<ul class="trio-lista">\n' + cartoes.join('\n') + '\n</ul>\n'
        + paginacao.marcacao() + '\n</div>'
      : '<ul class="trio-lista">\n' + cartoes.join('\n') + '\n</ul>')
    : semNada;

  /* ==========================================================================
     O BOTÃO «AÇÕES» — A TELA GANHA-SE NO TELEMÓVEL (25/10/2026).
     --------------------------------------------------------------------------
     O pedido: «no celular… eu tenho também uma área que é de procurar, que ela não
     tá programada pra poder colapsar ou expandir… a gente vai criar um botão que se
     chama ações. E aí esse botão ações, ele vai abrir da mesma forma que abre lá em
     sessões, um menuzinho de opção… E aí a pessoa vai escolher se ela quer o
     contexto do ato… ou também se ela quer ver a ficha em branco… E também vai ter
     o procurar… Então fica tudo escondido dentro de um botão de ações e a gente
     ganha tela no modo celular.»

     O QUE ELE AGRUPA: o painel do ato (com a caixinha dele, que continua a ser um
     segundo `details`), a ficha em branco e o filtro. Três coisas que, empilhadas,
     ocupavam meia tela de 844px antes de se ver um registo.

     UM `details` NÃO É UM ACORDEÃO DE MENTIRA: é a peça que o sistema já usa para o
     menu da barra (`.topnav details.menu`), e é a mesma gramática do `painel-ato` —
     um botão que abre, e fecha. Nada de JavaScript para abrir e fechar.

     NO COMPUTADOR O MENU NÃO EXISTE. O `summary` sai de cena por CSS e o `details`
     é aberto pelo script do painel (`scriptDoPainel`); se o JavaScript falhar, o
     pior caso é o botão «Ações» à vista no computador — **degrada, não quebra**.
     A alternativa (duas marcações, uma por largura) duplicaria o painel e os seus
     `id`, que é pior de todas as maneiras.
     ========================================================================== */
  /* O MENU «AÇÕES» E OS DOIS BLOCOS (25/10/2026, terceira leitura).
   *
   * A SEGUNDA VERSÃO AINDA ESTAVA ERRADA, e a pesquisadora disse-o com precisão: «eu tenho o
   * botão ações, que ele não tá abrindo um menu igual o menu de opções… o botão de ações tá do
   * lado esquerdo. Ele tem que ficar lá do lado direito, porque ele é igual ao opções que eu te
   * mostrei que fica lá em produção».
   *
   * Então: o «Ações» passa a ser o par do «Seções ▾» da Produção — à direita da página, em
   * pílula, e a abrir uma FOLHA que sobe de baixo com véu. Dentro dela, as três acções.
   *
   * E OS DOIS ESPAÇOS SÃO MUTUAMENTE EXCLUSIVOS — nunca os dois abertos. «Ou eu tenho o
   * procurar ou eu tenho a nova anamnese.» Quem garante isso é o script (`scriptDoPainel`), nos
   * dois modos: no telemóvel escolher uma acção fecha a outra; no computador abrir um bloco
   * fecha o outro. Um só de cada vez, e a listagem sempre por baixo.
   *
   * CADA BLOCO É UMA `.caixa` — o container com as bordas que o pedido quer — e o `summary`
   * dele é o botão de colapsar: «quando eu clicar em colapsar, ele volta pra dentro do menu e
   * sai completamente da tela».
   *
   * A CAIXINHA `trio-item` DO PAINEL SAIU. Ela era o cabeçalho do `details` do painel; agora o
   * cabeçalho é o do bloco, e ter dois botões para a mesma coisa dentro do mesmo container seria
   * o segundo clique que o pedido recusa — em qualquer largura. O que fica é o que ela dizia: o
   * título («Contexto do ato») e o resumo do que já foi escolhido (`data-resumo`).
   */
  const nomeDeCriar = criar ? esc(criar) : 'Criar';
  const agrupado = painel
    ? `<div class="acoes-da-lista" id="acoes">
  <button type="button" class="acao acoes-do-menu" id="botao-acoes"
    aria-expanded="false" aria-controls="menu-de-acoes">Ações<span class="seta-do-ato" aria-hidden="true">\u25be</span></button>
  <div class="veu-do-menu" id="veu-acoes" hidden></div>
  <ul class="menu-de-acoes" id="menu-de-acoes" hidden>
    <li><button type="button" class="menu-de-acoes-item" data-abrir="ato">${nomeDeCriar}</button></li>
    <li><button type="button" class="menu-de-acoes-item" data-abrir="filtro">Procurar</button></li>
    <li><a class="menu-de-acoes-item" data-abrir="ficha" href="${ficha ? esc(ficha) : '#'}"
      target="_blank" rel="noopener">Gerar ficha</a></li>
  </ul>
  <details class="bloco-lista" id="bloco-ato" data-bloco="ato">
    <summary class="bloco-cabeca">
      <span class="bloco-titulo bloco-nome-fechado">${nomeDeCriar}</span>
      <span class="bloco-titulo bloco-nome-aberto">Contexto do ato</span>
      <span class="bloco-resumo" data-resumo></span>
      <span class="seta-do-ato" aria-hidden="true">\u25be</span>
    </summary>
    <div class="bloco-corpo">
${painel}
    </div>
  </details>
  <details class="bloco-lista" id="bloco-filtro" data-bloco="filtro">
    <summary class="bloco-cabeca">
      <span class="bloco-titulo">Procurar</span>
      <span class="seta-do-ato" aria-hidden="true">\u25be</span>
    </summary>
    <div class="bloco-corpo">
${blocoFiltro}
    </div>
  </details>
</div>`
    : (blocoFiltro ? blocoFiltro + '\n' : '');
  const lista = painel ? blocoLista : blocoFiltro + blocoLista;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · Sistema Lastro</title>
<link rel="stylesheet" href="/assets/style.css">
<script>/* Anti-flash: aplica o modo ANTES de a página pintar. */
try{if(!document.documentElement.hasAttribute('data-modo-fonte')&&localStorage.getItem('ciclo-modo')==='noturna')document.documentElement.setAttribute('data-modo','noturna');}catch(e){}</script>
</head>
<body id="top">

${nav}

<header class="doc">
  <h1>${esc(titulo)}</h1>
  ${subtitulo ? `<p class="subtitulo">${esc(subtitulo)}</p>` : ''}
  ${acao ? `<a class="acao" href="${esc(acao.href)}">${esc(acao.rotulo)}</a>` : ''}
</header>

<main>
<div class="conteudo">
${aviso ? `<div class="aviso">${aviso}</div>` : ''}
${agrupado}
${lista}
</div>
</main>

<a class="topo" href="#top" title="Voltar ao topo">&#8593;</a>

<script src="/assets/nav.js"></script>
<script>${SCRIPT_DA_LISTA}</script>
${porPagina ? '<script>' + paginacao.script + '</script>' : ''}
${script || ''}

</body>
</html>
`;
}

/**
 * O FILTRO E AS CAIXAS, no cliente.
 *
 * Delegado no documento e ligado UMA vez: a página é estática (não há troca de opção aqui), mas
 * a delegação é a mesma disciplina das bancadas — e evita o defeito que lá apareceu, de ouvinte a
 * empilhar-se sobre ouvinte e a caixa a abrir e fechar no mesmo toque.
 */
const SCRIPT_DA_LISTA = `(function () {
  var busca = document.getElementById('f-busca');
  var prof = document.getElementById('f-prof');
  var turma = document.getElementById('f-turma');
  var conta = document.getElementById('f-conta');
  var itens = [].slice.call(document.querySelectorAll('li.trio-plano'));
  if (!conta) return;

  /* O RÓTULO VEM DO FORMULÁRIO, e não de uma constante daqui: a mesma função conta planos numa
     página e aulas na outra, e «1 aulas» é o género de erro que ninguém revê. */
  var form = conta.closest('form');
  var singular = (form && form.getAttribute('data-singular')) || 'item';
  var plural = (form && form.getAttribute('data-plural')) || 'itens';

  /* FORA DO FILTRO É \`data-fora\`, NÃO \`hidden\` (23/10/2026). Quem esconde uma linha é a
     paginação, e ela conta as que ficaram; uma linha escondida pelo filtro mas contada pela
     paginação ocuparia uma página — filtrar para duas turmas mostraria «1 / 3» e duas páginas
     vazias. É o mesmo acordo que a Produção já usava. */
  function aplicar() {
    var q = busca ? (busca.value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';
    var n = 0;
    itens.forEach(function (l) {
      var ok = (!q || (l.getAttribute('data-busca') || '').indexOf(q) !== -1)
        && (!prof || !prof.value || l.getAttribute('data-prof') === prof.value)
        && (!turma || !turma.value || l.getAttribute('data-turma') === turma.value);
      if (ok) { l.removeAttribute('data-fora'); n++; }
      else { l.setAttribute('data-fora', 'sim'); l.hidden = true; }
    });
    conta.textContent = n + ' ' + (n === 1 ? singular : plural) + ' de ' + itens.length;
    /* FILTRAR MUDA A ALTURA DA PÁGINA — e por isso o «voltar ao topo» tem de ser
       reavaliado. Filtrar de 26 aulas para 2 tira o scroll, e o botão passaria a tapar
       a segunda linha. Quem sabe a regra é o nav.js (window.atualizarTopo); aqui so
       se avisa que a altura mudou. */
    if (window.atualizarTopo) window.atualizarTopo();
    /* A PÁGINA VOLTA À PRIMEIRA A CADA FILTRO: ficar na 3 depois de reduzir a lista a cinco
       linhas daria uma página vazia — e uma página vazia lê-se como «não há nada». */
    var painel = document.querySelector('[data-paginar]');
    if (painel) painel.setAttribute('data-pagina', '1');
    if (window.paginar) window.paginar();
  }
  [busca, prof, turma].filter(Boolean).forEach(function (c) {
    c.addEventListener('input', aplicar);
    c.addEventListener('change', aplicar);
  });
  aplicar();

  /* UMA CAIXA ABERTA POR CARTÃO; fecha com o mesmo toque, com Escape ou tocando fora. */
  function fechar(outro) {
    [].slice.call(document.querySelectorAll('.trio-item[aria-expanded="true"]')).forEach(function (b) {
      if (b === outro) return;
      b.setAttribute('aria-expanded', 'false');
      var painel = b.closest('li.trio-plano').querySelector('.trio-painel:not([hidden])');
      if (painel) painel.hidden = true;
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.trio-item');
    if (!b) { if (!e.target.closest('.trio-painel') && !e.target.closest('.filtro') && !e.target.closest('.paginacao')) fechar(null); return; }
    var abrir = b.getAttribute('aria-expanded') !== 'true';
    fechar(b);
    var painel = b.closest('li.trio-plano').querySelector('[data-painel="' + b.getAttribute('data-balao') + '"]');
    if (painel) painel.hidden = !abrir;
    b.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(null); });
})();`;

module.exports = {
  paginaDeLista, cartaoDaLista, caixasDoCartao, painelDoCartao, filtro, SCRIPT_DA_LISTA,
};
