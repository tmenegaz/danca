/* Barra fixa e menu mobile — comportamento COMPARTILHADO pelas páginas do pacote.
 *
 * Por que num arquivo só: o `lancamento.html` não passa pelo pandoc — ele é copiado
 * do template e recebe a navegação por substituição do marcador `<!-- NAV -->`.
 * Enquanto este código vivia inline dentro do `ciclo.html`, o formulário não o
 * recebia: a barra fixa (position: fixed, fora do fluxo) cobria o título, porque o
 * `body` nunca ganhava `--header-height`; e o botão hamburger não abria nada no
 * celular. O gerador copia este arquivo para `assets/nav.js` e as duas páginas o
 * carregam — um comportamento, um arquivo.
 *
 * 1) A barra é position: fixed, então sai do fluxo e cobriria o título. Em vez de
 *    um padding fixo no CSS (que não acompanha a altura real, e quebra quando a
 *    barra quebra em duas linhas), medimos a altura da barra e publicamos em
 *    --header-height, que o CSS usa no padding do body e no scroll-padding-top.
 *    Sem JavaScript, o CSS usa o fallback declarado em :root.
 * 2) Em tela pequena, o botão hamburger abre e fecha o painel de links. O estado
 *    vai para aria-expanded, para leitores de tela.
 */
(function () {
  var navbar = document.querySelector('.topnav');
  var botao = document.querySelector('.hamburger');

  /* A FOLHA EXISTE — DIZ-SE NO `<html>`, SEM `:has()` (04/11/2026).
   *
   * O LAYOUT DA COLUNA DEPENDE HOJE DE `body:has(> .coluna)`, e `:has()` não existe em todo o
   * lado: Firefox só a teve na 121 (Dez/2023), e o ESR 115 — que muitas instituições ainda
   * correm — não a tem. Num desses navegadores as três regras que fazem a página caber ao lado da
   * coluna NÃO se aplicam, e o resultado foi medido: a barra fica em `left: 0`, a coluna
   * (`z-index: 21`) cobre-lhe os primeiros 248px, e **o primeiro item do menu deixa de receber o
   * clique** — o `elementFromPoint` devolve a marca da coluna em vez do link. É o «os cliques não
   * respondem» que a pesquisadora descreveu, igual nas três telas de formulário.
   *
   * A correção não pode depender de `:has()` para existir. O JS já corre em todas estas páginas
   * (é ele que publica o `--header-height`, abre o ☰ e guarda o tema), e a coluna é marcação
   * estática: quando ela está no documento, escreve-se o atributo e o CSS tem um segundo caminho.
   * O `:has()` fica — para quem o tem, a regra vale antes deste script correr, e não há salto.
   */
  if (document.querySelector('aside.coluna')) {
    document.documentElement.setAttribute('data-tem-coluna', 'sim');
  }
  /* E O MESMO PARA A `lateral` DA PRODUÇÃO: onde ela existe, a coluna do sistema sai de cena e a
   * barra volta a `left: 0`. Sem `:has()`, essa regra também não valeria — e ficariam duas colunas
   * lado a lado, que é o defeito que a regra existe para evitar. */
  if (document.querySelector('.lateral')) {
    document.body.setAttribute('data-tem-lateral', 'sim');
  }

  /* ------------------------------------------------------------------
   * O TEMA. A escolha é EXPLÍCITA e fica no NAVEGADOR (`localStorage`), entre
   * sessões. Isto é PROVISÓRIO e declarado: a decisão C15 — de quem é a
   * preferência (escola, usuário ou navegador) — continua em aberto em
   * PLANEJAMENTO-LASTRO.md. O navegador é o caminho que NÃO exige identidade de
   * usuário, que o portão atual não tem.
   *
   * O valor aplicado é `data-modo="noturna"` no <html>; a ausência do atributo é
   * a variante clara. O CSS tem os dois conjuntos de papéis, então trocar o
   * atributo re-veste a página inteira sem tocar em componente nenhum.
   * ------------------------------------------------------------------ */
  var CHAVE_TEMA = 'ciclo-modo';
  var raizDoc = document.documentElement;
  /* A ESCOLA DECIDE (18/10/2026) — e quando ela decide, este bloco NÃO age. As páginas
     servidas pelo Worker chegam com `data-modo` e `data-modo-fonte="escola"` já no `<html>`;
     aplicar por cima a memória do navegador seria desfazer, em silêncio, a escolha da escola.
     É por isso que a leitura do `localStorage` fica subordinada a este atributo: ele é a
     FRONTEIRA entre «a escola escolheu» e «esta página não tem escola» (a raiz, que continua
     a poder pré-visualizar a aparência). */
  var decididoPelaEscola = raizDoc.hasAttribute('data-modo-fonte');
  function lerModo() {
    if (decididoPelaEscola) return raizDoc.getAttribute('data-modo') === 'noturna' ? 'noturna' : 'clara';
    try { return localStorage.getItem(CHAVE_TEMA) === 'noturna' ? 'noturna' : 'clara'; }
    catch (e) { return 'clara'; }
  }
  function pintarBotao(modo) {
    var b = document.querySelector('.tema');
    if (!b) return;
    var noturna = modo === 'noturna';
    b.setAttribute('aria-pressed', noturna ? 'true' : 'false');
    b.setAttribute('aria-label', noturna ? 'Ativar a aparência clara' : 'Ativar a aparência noturna');
    b.textContent = noturna ? '\u25D1' : '\u25D0';
  }
  function aplicar(modo) {
    if (modo === 'noturna') raizDoc.setAttribute('data-modo', 'noturna');
    else raizDoc.removeAttribute('data-modo');
    pintarBotao(modo);
  }
  if (!decididoPelaEscola) aplicar(lerModo());
  var botaoTema = decididoPelaEscola ? null : document.querySelector('.tema');
  if (botaoTema) {
    botaoTema.addEventListener('click', function () {
      var proximo = raizDoc.getAttribute('data-modo') === 'noturna' ? 'clara' : 'noturna';
      aplicar(proximo);
      try { localStorage.setItem(CHAVE_TEMA, proximo); } catch (e) { /* modo privado: só nesta aba */ }
    });
  }

  /* ------------------------------------------------------------------
   * A DOBRA DO ÍNDICE DA PÁGINA — «Nesta página» no pacote, «Roteiro» na porta.
   *
   * O bloco é uma COLUNA congelada à direita a partir de 1200px; abaixo disso ele é um
   * bloco no TOPO do texto, e num telefone isso é rolagem antes de se chegar ao
   * conteúdo. A dobra encolhe o bloco até o título e devolve a lista a quem a quiser.
   *
   * O CONTROLE É CRIADO AQUI, e não no HTML, por um motivo medido: o documento do
   * pacote é GERADO (pandoc + `ciclo.html`), e um documento já gerado — ou um pacote
   * que não se pode regerar porque o plano ainda não foi elicitado — ficaria sem o
   * controle até a geração seguinte. Criado no script, ele vale para todo documento
   * que carregue `assets/nav.js`, inclusive os que já estão no ar. E sem JavaScript
   * não há botão nenhum: o índice fica como sempre esteve, sem controle morto.
   *
   * O ESTADO VIVE NESTA SESSÃO (`sessionStorage`), como o do filtro das listas. Não é
   * preferência de usuário — é o que a pessoa acabou de fazer, e não deve surpreendê-la
   * amanhã. Em tela larga não há o que dobrar: a coluna É a navegação, e fica aberta.
   * ------------------------------------------------------------------ */
  var CHAVE_DOBRA = 'ciclo:indice';
  var largo = window.matchMedia('(min-width: 1200px)');

  function lembrarDobra(aberto) {
    try { sessionStorage.setItem(CHAVE_DOBRA, aberto ? 'aberto' : 'fechado'); } catch (e) { /* modo privado */ }
  }
  function dobraLembrada() {
    try { return sessionStorage.getItem(CHAVE_DOBRA); } catch (e) { return null; }
  }

  /** Cria o botão logo ABAIXO do título do bloco (e não ao lado, nem à direita). */
  function montarDobra(bloco, indice) {
    var titulo = bloco.querySelector('.toc-titulo');
    var lista = bloco.querySelector('ul, ol');
    if (!titulo || !lista) return null;
    if (!lista.id) lista.id = 'toc-corpo-' + indice;
    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'toc-dobra';
    botao.setAttribute('aria-controls', lista.id);
    var sinal = document.createElement('span');
    sinal.className = 'toc-dobra-sinal';
    sinal.setAttribute('aria-hidden', 'true');
    botao.appendChild(sinal);
    titulo.insertAdjacentElement('afterend', botao);
    return botao;
  }

  function pintarDobra(bloco, botao, aberto) {
    // O nome vem da `aria-label` do próprio bloco — «índice desta página» no documento,
    // «roteiro da elicitação» na porta —, e é o que o leitor de tela anuncia.
    var nome = (bloco.getAttribute('aria-label') || 'o índice').toLowerCase();
    var rotulo = (aberto ? 'Recolher ' : 'Mostrar ') + nome;
    bloco.setAttribute('data-dobra', 'sim');
    bloco.setAttribute('data-recolhido', aberto ? 'nao' : 'sim');
    botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    botao.setAttribute('aria-label', rotulo);
    botao.title = rotulo;
    var sinal = botao.querySelector('.toc-dobra-sinal');
    if (sinal) sinal.textContent = aberto ? '\u25BE' : '\u25B8';
  }

  var dobras = [];
  document.querySelectorAll('.toc-local').forEach(function (bloco, indice) {
    var botao = montarDobra(bloco, indice);
    if (!botao) return;
    dobras.push({ bloco: bloco, botao: botao });
    botao.addEventListener('click', function () {
      var aberto = bloco.getAttribute('data-recolhido') === 'sim';
      pintarDobra(bloco, botao, aberto);
      lembrarDobra(aberto);
    });
  });

  function aplicarDobras() {
    dobras.forEach(function (d) {
      pintarDobra(d.bloco, d.botao, largo.matches ? true : dobraLembrada() === 'aberto');
    });
  }
  aplicarDobras();
  if (largo.addEventListener) largo.addEventListener('change', aplicarDobras);

  /* ------------------------------------------------------------------
   * A DOBRA DE CADA SECÇÃO DO DOCUMENTO (22/11/2026).
   *
   * Palavras dela: «Como o item cinco do plano da aula, guia de observação do professor,
   * ele vai ser mais extenso, ele vai ser longo, tem que colocar um botão de colapsar e
   * expandir nele. […] Outro campo que tem que ter isso também, na verdade todos, todos
   * eles, todos eles tem que ter isso de colapsar e expandir para ficar melhor para o
   * professor.»
   *
   * O CONTROLE É CRIADO AQUI, pela mesma razão do índice: o documento é gerado, e um
   * documento já gerado — ou um pacote que não se pode regerar — ficaria sem controle até
   * a geração seguinte. Criado no script, vale para todo documento que carregue
   * `assets/nav.js`, inclusive os que já estão no ar. Sem JavaScript, o documento fica
   * inteiro aberto, como sempre esteve: não há botão morto.
   *
   * O BOTÃO MORA DENTRO DO TÍTULO. O documento da aula tem oito secções: um botão em
   * fileira própria abria oito fileiras de ar em cima do texto — o contrário do que se
   * pediu. No fim do título ele lê-se como parte dele.
   *
   * O ESTADO VIVE NESTA SESSÃO (`sessionStorage`), como o do índice e o do filtro das
   * listas: é o que a pessoa acabou de fazer. A chave é o `id` do título, que é o mesmo
   * nas sete aulas de um ciclo — recolher o guia de observação na Aula 01 é recolhê-lo na
   * Aula 02, que é o que se espera de quem está a ler a mesma secção sete vezes.
   * ------------------------------------------------------------------ */
  /* TODOS RECOLHIDOS, EXCETO O PRIMEIRO (22/11/2026).
   *
   * Palavras dela: «começa com todos eles colapsados, exceto o primeiro, tá? E aí o professor vai
   * expandindo e lendo e vendo o que que ele precisa saber a respeito das coisas.»
   *
   * A CHAVE MUDOU DE NOME porque o SIGNIFICADO mudou: `ciclo:secoes` guardava as RECOLHIDAS
   * (abrindo por omissão tudo o resto); `ciclo:secoes-abertas` guarda as ABERTAS (fechando por
   * omissão tudo o resto). Ler a chave velha com o sentido novo abriria o documento inteiro para
   * quem tem a sessão de antes — o contrário do que se pediu —, e é por isso que a chave é nova
   * em vez de reaproveitada. Uma chave é um contrato: mudar-lhe o sentido por baixo é o defeito
   * que o `--dados` do portão também evitou.
   *
   * O PRIMEIRO NÃO É «A SECÇÃO 1»: é o primeiro `<h2>` DESTE documento. Num plano é o contexto;
   * numa aula é a validação dos objetivos; no glossário é o índice de símbolos. Quem abre o
   * documento tem sempre um pedaço de texto à frente, e não um índice de títulos fechados. */
  var CHAVE_SECOES = 'ciclo:secoes-abertas';

  /* O ÍNDICE MANDA: clicar «Guia de observação» numa secção recolhida tem de a abrir. Sem
     isto, meio índice não leva a lado nenhum — o salto pára numa âncora escondida, e nada
     acontece. Vale para o `hash` do endereço (um favorito, um link colado) e para o clique. */
  function abrirSeDoAlvo(alvo) {
    if (!alvo) return;
    /* DUAS FORMAS DE ALVO, e as duas acontecem: o link do índice aponta para o TÍTULO da
       secção (que fica FORA do corpo — o corpo é o que vem depois dele) ou para uma
       subsecção (`### Corpo`, `### Técnica`), que fica DENTRO. Procurar só o `closest`
       deixava o índice sem efeito justamente no caso que importa: a secção recolhida. */
    var corpo = alvo.tagName === 'H2'
      ? document.getElementById('secao-corpo-' + alvo.id)
      : (alvo.closest ? alvo.closest('.secao-corpo') : null);
    if (!corpo) return;
    var dono = secoesPorCorpo.get(corpo);
    if (!dono) return;
    mostrarSecao(dono, true);
    /* A MEMÓRIA ACOMPANHA O GESTO. O índice abre a secção; se ela não entrar na lista, o próximo
       recarregamento volta a fechá-la — e o `guardarSecoes` gravaria uma lista que não tem o que
       está à vista. É a mesma regra do clique na seta, escrita uma vez. */
    if (abertas.indexOf(dono.chave) === -1) abertas.push(dono.chave);
    guardarSecoes();
  }
  function abrirDoEndereco() {
    if (!location.hash || location.hash.length < 2) return;
    var alvo;
    try { alvo = document.querySelector(location.hash); } catch (e) { alvo = null; }
    abrirSeDoAlvo(alvo);
  }

  /* `null` = ninguém mexeu ainda nesta sessão, e é aí que vale a regra do primeiro aberto.
     Um `[]` guardado é uma ESCOLHA — a pessoa fechou tudo, e ela manda. A diferença entre os dois
     é a diferença entre «não há memória» e «a memória diz que não há nada aberto». */
  var abertas = null;
  try {
    var guardado = JSON.parse(sessionStorage.getItem(CHAVE_SECOES) || 'null');
    if (Array.isArray(guardado)) abertas = guardado;
  } catch (e) { abertas = null; }

  function guardarSecoes() {
    try { sessionStorage.setItem(CHAVE_SECOES, JSON.stringify(abertas || [])); } catch (e) { /* modo privado */ }
  }

  var secoes = [];
  var secoesPorCorpo = new Map();

  function mostrarSecao(s, aberto) {
    var nome = (s.h2.textContent || '').replace(/\s+/g, ' ').trim();
    var rotulo = (aberto ? 'Recolher ' : 'Mostrar ') + nome;
    s.corpo.setAttribute('data-recolhido', aberto ? 'nao' : 'sim');
    s.botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    s.botao.setAttribute('aria-label', rotulo);
    s.botao.title = rotulo;
    var sinal = s.botao.querySelector('.secao-dobra-sinal');
    if (sinal) sinal.textContent = aberto ? '\u25BE' : '\u25B8';
  }

  /* A PORTA NÃO TEM ISTO. Ela é o formulário de elicitação: recolher uma secção lá é
     esconder perguntas que faltam responder, e a barra do topo já diz o que falta. */
  if (document.body && document.body.getAttribute('data-tela') !== 'porta') {
    Array.prototype.forEach.call(document.querySelectorAll('.conteudo > h2[id]'), function (h2) {
      var pai = h2.parentNode;
      if (!pai) return;
      /* O CORPO É TUDO O QUE VEM DEPOIS DO TÍTULO ATÉ AO TÍTULO SEGUINTE — tabelas, listas,
         parágrafos e os blocos `details` que a secção já tenha. Nada é interpretado: os nós
         são mudados de pai, e o conteúdo é o mesmo. */
      var corpo = document.createElement('div');
      corpo.className = 'secao-corpo';
      corpo.id = 'secao-corpo-' + h2.id;
      var irmao = h2.nextElementSibling;
      while (irmao && irmao.tagName !== 'H2') {
        var seguinte = irmao.nextElementSibling;
        /* A JANELA NÃO É CONTEÚDO DE SECÇÃO (22/11/2026) — e este `if` foi um defeito medido.
         *
         * O DIÁLOGO QUE CRIA A AULA é a última coisa do plano, e vem depois do último `<h2>`: sem
         * esta guarda ele era engolido pelo corpo da ÚLTIMA secção. Enquanto as secções nasciam
         * abertas isso não se via; quando passaram a nascer fechadas, `#criar-aula` ficou dentro de
         * uma caixa `display:none` — e o botão «Criar» do diálogo deixou de ser clicável. O
         * sintoma lido em voz alta é «o modal abriu e não responde», e a causa é a dobra.
         *
         * Um `.modal` não pertence a nenhuma secção: é uma janela por cima do documento, e fica
         * onde está. O corpo da secção continua a ser recolhido à volta dele — ele não é movido,
         * apenas não é apanhado. */
        if (irmao.classList && irmao.classList.contains('modal')) { irmao = seguinte; continue; }
        corpo.appendChild(irmao);
        irmao = seguinte;
      }
      pai.insertBefore(corpo, h2.nextSibling);
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'secao-dobra';
      botao.setAttribute('aria-controls', corpo.id);
      var sinal = document.createElement('span');
      sinal.className = 'secao-dobra-sinal';
      sinal.setAttribute('aria-hidden', 'true');
      botao.appendChild(sinal);
      h2.appendChild(botao);
      var registro = { h2: h2, corpo: corpo, botao: botao, chave: h2.id };
      secoes.push(registro);
      secoesPorCorpo.set(corpo, registro);
      botao.addEventListener('click', function () {
        /* O NOME DIZ O QUE A COISA É (22/11/2026). Aqui esteve `var aberto = corpo.getAttribute(
           'data-recolhido') === 'sim'` — verdadeiro quando a secção estava FECHADA —, e a lista
           antiga era a das recolhidas, portanto a troca de sentido passava despercebida. Com a
           lista das abertas, o mesmo nome invertido gravava a secção errada: medido, clicar na
           segunda guardava a primeira. `eraFechada` não tem como enganar. */
        var eraFechada = corpo.getAttribute('data-recolhido') === 'sim';
        mostrarSecao(registro, eraFechada);
        var i = abertas.indexOf(registro.chave);
        if (eraFechada && i === -1) abertas.push(registro.chave);
        else if (!eraFechada && i !== -1) abertas.splice(i, 1);
        guardarSecoes();
      });
    });
    /* A REGRA DO PRIMEIRO, e ela vale uma vez por documento: sem memória, abre o primeiro e mais
       nada. Com memória, a memória manda — inclusive quando diz «nenhuma». */
    if (!abertas) abertas = secoes.length ? [secoes[0].chave] : [];
    secoes.forEach(function (s) { mostrarSecao(s, abertas.indexOf(s.chave) !== -1); });
    abrirDoEndereco();
    window.addEventListener('hashchange', abrirDoEndereco);
    document.addEventListener('click', function (ev) {
      var link = ev.target && ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var id;
      try { id = document.querySelector(link.getAttribute('href')); } catch (e) { id = null; }
      abrirSeDoAlvo(id);
    });
  }

  /* Página sem navegação (o arquivo é carregado pelo template, não só pelo ciclo):
     sai sem tocar em nada, em vez de estourar mais abaixo. */
  if (!navbar) return;

  /* A ALTURA DA BARRA, PUBLICADA SÓ QUANDO MUDA (21/10/2026).
     A versão anterior escrevia a custom property em toda chamada. Escrever em
     `:root` invalida o estilo do documento inteiro, e `--header-height` alimenta o
     `padding-top` do `body`: uma escrita por evento é um refluxo por evento.
     Agora só se escreve quando o número MUDOU — o que, na prática, é uma vez. */
  var alturaPublicada = null;

  function ajustarAlturaNavbar() {
    var altura = navbar.offsetHeight + 'px';
    if (altura !== alturaPublicada) {
      alturaPublicada = altura;
      document.documentElement.style.setProperty('--header-height', altura);
    }
  }

  if (botao) {
    /* A COLUNA MUDA O QUE O ☰ ABRE (23/10/2026).
       Onde há coluna (`.coluna`), a navegação é a folha que sobe de baixo — a mesma mecânica da
       Produção. O ☰ deixa de abrir o painel da barra (que nesse modo só tem o Bastidores) e passa
       a abrir a FOLHA: a lei das duas navegações manda o hambúrguer para a navegação global, e a
       global passou a ser a coluna. Onde não há coluna, nada disto corre — o ☰ é o de sempre. */
    var coluna = document.querySelector('.coluna');
    var estreita = window.matchMedia('(max-width: 1140px)');

    function abrirFolha(sim) {
      if (!coluna) return false;
      coluna.setAttribute('data-aberta', sim ? 'sim' : 'nao');
      document.body.classList.toggle('coluna-aberta', !!sim);
      botao.setAttribute('aria-expanded', sim ? 'true' : 'false');
      botao.setAttribute('aria-label', sim ? 'Fechar menu' : 'Abrir menu');
      return true;
    }

    botao.addEventListener('click', function () {
      // A folha só existe quando a coluna não está à vista — acima de 1140 ela é a coluna fixa,
      // e o ☰ não tem o que abrir. Abaixo, é a folha.
      if (coluna && estreita.matches) {
        var aberta = coluna.getAttribute('data-aberta') === 'sim';
        abrirFolha(!aberta);
        return;
      }
      var aberto = navbar.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
      ajustarAlturaNavbar();
    });

    /* ESCOLHER FECHA A FOLHA — deixá-la aberta taparia a página que se acabou de pedir. */
    if (coluna) {
      coluna.addEventListener('click', function (e) {
        if (e.target.closest('a') && estreita.matches) abrirFolha(false);
      });
      var veu = document.querySelector('.veu');
      if (veu) veu.addEventListener('click', function () { abrirFolha(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') abrirFolha(false);
      });
    }
    /* O ACORDEÃO É DA PEÇA, E NÃO DA COLUNA (26/10/2026).
     *
     * Estava preso ao `<aside class="coluna">` — e por isso os grupos do menu dos Bastidores
     * (`.lateral`), que passaram a ser os MESMOS (`coluna-grupo`/`coluna-titulo`), abriam no
     * `:hover` e não abriam ao clique nem ao teclado: o `data-aberto` nunca era escrito.
     * Escutar no documento, e aceitar os dois donos, é o que faz a peça ser uma só — quem
     * desenha é a folha, e quem abre é este ouvinte, seja qual for o menu.
     *
     * A guarda é o `closest('.coluna, .lateral')`: fora desses dois, um `.coluna-titulo` não
     * existe — mas se um dia existir noutro sítio, não é este ouvinte que o governa. */
    document.addEventListener('click', function (e) {
      var titulo = e.target.closest && e.target.closest('.coluna-titulo');
      if (!titulo) return;
      var menu = titulo.closest('.coluna, .lateral');
      if (!menu) return;
      var grupo = titulo.closest('.coluna-grupo');
      if (!grupo) return;
      var abrir = grupo.getAttribute('data-aberto') !== 'sim';
      menu.querySelectorAll('.coluna-grupo[data-aberto="sim"]').forEach(function (g) {
        if (g !== grupo) g.setAttribute('data-aberto', 'nao');
      });
      grupo.setAttribute('data-aberto', abrir ? 'sim' : 'nao');
      titulo.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    });
    document.addEventListener('focusin', function (e) {
      var grupo = e.target.closest && e.target.closest('.coluna-grupo');
      if (!grupo) return;
      if (!grupo.closest('.coluna, .lateral')) return;
      if (grupo.getAttribute('data-aberto') !== 'sim') grupo.setAttribute('data-aberto', 'sim');
    });

    /* Ao escolher um item, o painel fecha — a navegação é do navegador, mas o
       estado não pode ficar para trás. */
    navbar.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      navbar.classList.remove('aberto');
      botao.setAttribute('aria-expanded', 'false');
      botao.setAttribute('aria-label', 'Abrir menu');
      var d = link.closest('details[open]');
      if (d) d.removeAttribute('open');
    });

    /* Clicar fora fecha o dropdown aberto e, no celular, o painel. */
    document.addEventListener('click', function (e) {
      if (!navbar.contains(e.target)) {
        navbar.classList.remove('aberto');
        botao.setAttribute('aria-expanded', 'false');
        botao.setAttribute('aria-label', 'Abrir menu');
      }
      document.querySelectorAll('.topnav details.menu[open]').forEach(function (d) {
        if (!d.contains(e.target)) d.removeAttribute('open');
      });
    });

    /* No desktop o dropdown abre por hover; no celular quem manda é o toque.
       O estado de abertura é o atributo `open` do <details>, não display: um
       <details> fechado não renderiza os filhos, então CSS não abriria nada. */
    var desktop = window.matchMedia('(min-width: 769px)');
    function ligarHover() {
      document.querySelectorAll('.topnav details.menu').forEach(function (d) {
        if (desktop.matches) {
          d.addEventListener('mouseenter', abrir);
          d.addEventListener('mouseleave', fechar);
        } else {
          d.removeEventListener('mouseenter', abrir);
          d.removeEventListener('mouseleave', fechar);
          d.removeAttribute('open');
        }
      });
    }
    function abrir() { this.setAttribute('open', ''); }
    function fechar() { this.removeAttribute('open'); }
    ligarHover();
    if (desktop.addEventListener) desktop.addEventListener('change', ligarHover);
  }

  ajustarAlturaNavbar();
  window.addEventListener('load', ajustarAlturaNavbar);

  /* O `resize` DO iOS NÃO É O `resize` DO DESKTOP (21/10/2026).
     Enquanto se rola uma página, o Safari do iPhone recolhe e volta a mostrar as
     barras do sistema — e dispara `resize` a cada quadro dessa animação. Com um
     `resize` que mexe no layout, o conteúdo anda por baixo do dedo: é a «rolagem a
     tremer» que se vê no iPhone e não no Android nem no Chrome do computador.
     A largura é o que muda o que medimos; a altura que muda sozinha é a barra do
     sistema, e não nos diz nada. Só se reage a mudança de LARGURA. */
  var larguraDaVista = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === larguraDaVista) return;
    larguraDaVista = window.innerWidth;
    ajustarAlturaNavbar();
  });

  /* Página restaurada do cache do navegador (o "voltar" no celular) traz o DOM
     como estava — inclusive com o painel aberto e o botão marcado. Zera tudo e
     garante o botão clicável, que é o estado em que a página deve começar. */
  window.addEventListener('pageshow', function () {
    document.querySelectorAll('.topnav.aberto').forEach(function (n) {
      n.classList.remove('aberto');
    });
    document.querySelectorAll('.topnav details[open]').forEach(function (d) {
      d.removeAttribute('open');
    });
    var b = document.querySelector('.hamburger');
    if (b) {
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-label', 'Abrir menu');
      b.style.pointerEvents = 'auto';
      b.style.display = '';
      b.style.visibility = '';
      b.style.opacity = '';
    }
    ajustarAlturaNavbar();
  });
})();

/* ======================================================================
 * O TÍTULO QUE FICA (21/10/2026) — «B · encolhe», a opção escolhida das
 * quatro propostas medidas em `experimentos/propostas/proposta-titulo.html`.
 *
 * Fica num segundo bloco, e NÃO lá dentro, por uma razão: o bloco de cima
 * sai cedo quando a página não tem barra (`if (!navbar) return`), e o
 * comportamento do título não depende da barra — depende de haver título.
 *
 * Por que aqui e não no HTML: o documento do pacote é GERADO (pandoc +
 * `ciclo.html`), e um pacote já gerado ficaria sem o comportamento até a
 * geração seguinte. É a MESMA excepção declarada da dobra do índice.
 *
 * O QUE ELE FAZ, e só isso:
 *   1. marca o cabeçalho como preso possível (`.titulo-fixo`) e liga o
 *      mecanismo no `<html>` (`data-titulo-fixo="sim"`);
 *   2. mede a ALTURA ENCOLHIDA e publica-a em `--titulo-preso`, que o CSS usa
 *      no `scroll-padding-top` e na coluna do índice. Medida, não estimada:
 *      no celular o título quebra em duas linhas e a altura muda;
 *   3. ao rolar, diz se está encolhido (`data-titulo-encolhido`).
 *
 * A MEDIÇÃO NÃO PISCA. Ela põe o estado encolhido, lê a altura e repõe — tudo
 * dentro do mesmo bloco de script. O navegador só pinta depois de a tarefa
 * terminar, então nada disto chega a ser visto; e o que se mede é o estado
 * real, que é o único número honesto para reservar.
 */
(function () {
  var raiz = document.documentElement;
  /* A PÁGINA PODE RECUSAR, e a recusa é explícita: `data-titulo-fixo="nao"` no `<html>`.
     Existe por um consumidor real — as bancadas de `experimentos/propostas/`, que comparam
     cinco desfechos do MESMO mecanismo e por isso trazem o seu próprio: com este bloco a
     mexer, todas as cinco ficariam presas e encolhidas, e a comparação desapareceria. */
  if (raiz.getAttribute('data-titulo-fixo') === 'nao') return;
  var cabecalho = document.querySelector('.titulo-fixo') || document.querySelector('header.doc');
  if (!cabecalho) return;
  /* A FOLHA DE CAPTURA FICA DE FORA: é folha de marcação, para usar em aula e
     imprimir. A rota é a convenção do gerador para ela (`captura-aula-NN.html`). */
  if (/\/captura-aula-[^\/]+\.html$/.test(location.pathname)) return;

  cabecalho.classList.add('titulo-fixo');
  raiz.setAttribute('data-titulo-fixo', 'sim');

  var alturaPreso = 0;

  /* A MEDIÇÃO NÃO PODE SER ANIMADA. O `h1` tem `transition: font-size`, e pôr o estado
     encolhido e ler a altura no mesmo instante devolve o tamanho A MEIO CAMINHO — 43px
     num documento onde o estado final mede 25px. O número errado não fica na tela (a
     transição segue o seu curso), mas fica em `--titulo-preso`, que é o espaço que o
     resto da folha RESERVA: daria 18px de folga a mais no celular, e o alvo da âncora
     pararia longe do topo. A transição é desligada só durante a leitura. */
  function medirEncolhido() {
    var antes = raiz.getAttribute('data-titulo-encolhido');
    var titulo = cabecalho.querySelector('h1');
    raiz.setAttribute('data-titulo-encolhido', 'sim');
    if (titulo) titulo.style.transition = 'none';
    alturaPreso = Math.ceil(cabecalho.getBoundingClientRect().height);
    if (titulo) titulo.style.transition = '';
    if (antes === null) raiz.removeAttribute('data-titulo-encolhido');
    else raiz.setAttribute('data-titulo-encolhido', antes);
    var valor = alturaPreso > 0 ? alturaPreso + 'px' : null;
    if (valor && valor !== raiz.style.getPropertyValue('--titulo-preso')) {
      raiz.style.setProperty('--titulo-preso', valor);
    }
  }

  /* O estado é da ROLAGEM, e o limiar de 8px evita que um tremor de trackpad
     faça o título piscar entre os dois tamanhos.

     NÃO SE ESCREVE O QUE JÁ LÁ ESTÁ (21/10/2026). Um `setAttribute` com o mesmo valor
     parece inofensivo, mas o atributo é lido por regras de `font-size` e de
     `display`: no Safari, marcá-lo por marcá-lo em cada quadro obriga a recalcular o
     cabeçalho em cada quadro da rolagem. Guardar o último valor escrito faz disto
     uma escrita por mudança de estado — duas por página, não duzentas. */
  var estadoPintado = null;
  function pintar() {
    var encolhido = window.scrollY > 8 ? 'sim' : 'nao';
    if (encolhido === estadoPintado) return;
    estadoPintado = encolhido;
    raiz.setAttribute('data-titulo-encolhido', encolhido);
  }

  var pedido = false;
  function aoRolar() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(function () {
      pedido = false;
      var era = raiz.getAttribute('data-titulo-encolhido');
      pintar();
      /* Mede outra vez só quando o título ACABOU de encolher: aí ele está no estado
         que se quer medir, sem forçar nada, e o número acompanha a largura nova. */
      if (raiz.getAttribute('data-titulo-encolhido') === 'sim' && era !== 'sim') medirEncolhido();
    });
  }

  /* A MEDIÇÃO DEPENDE DA LARGURA, NÃO DA ALTURA (21/10/2026).
   *
   * `medirEncolhido` escreve um atributo, LÊ a altura do cabeçalho e escreve uma custom
   * property — é a operação mais cara desta página. Ela corria em todo `resize`, e no
   * iPhone o `resize` dispara a cada quadro enquanto as barras do sistema se recolhem
   * ao rolar. O resultado media-se: 60 eventos de `resize` com a MESMA largura davam 60
   * leituras de layout e 120 escritas em `:root` — e o conteúdo andava por baixo do
   * dedo. É a tremedeira.
   *
   * O que a medição depende é da largura: é ela que decide se o título quebra em duas
   * linhas. A altura que muda sozinha é a barra do sistema, e não muda o título. */
  var larguraMedida = 0;
  function remedeirSeALarguraMudou(comPintura) {
    if (window.innerWidth !== larguraMedida) {
      larguraMedida = window.innerWidth;
      medirEncolhido();
    }
    if (comPintura) pintar();
  }

  /* ==========================================================================
     O «VOLTAR AO TOPO» SÓ EXISTE QUANDO HÁ PARA ONDE VOLTAR (25/10/2026).
     --------------------------------------------------------------------------
     O pedido: «esse botão de voltar ao topo não pode aparecer no modo celular se
     eu não tiver o scroll de rolagem ativo… senão ele fica por cima de algumas
     coisas e não dá pra ler».

     O problema era real e é de sobreposição: o `.topo` é `position: fixed` no canto
     inferior direito, e numa página curta ele pousa EM CIMA do último cartão da
     lista. Uma página de três anamneses não tem nada para rolar, e o botão tapava
     a terceira.

     A REGRA É UMA SÓ, e não depende da largura: sem rolagem possível, sem botão. Não
     é um caso de telemóvel — uma janela curta no computador tem o mesmo defeito.

     USA-SE O `hidden`, e não uma classe nova: `[hidden]` é a única regra da folha com
     `!important` (`ciclo.css`), precisamente para ganhar de qualquer peça. Um estado
     do sistema que precisa de vencer o desenho já tem o seu atributo.

     A MARGEM DE 2px não é folga: `scrollHeight` e `innerHeight` são inteiros
     arredondados de medidas fraccionárias, e sem ela um conteúdo que cabe por 0,4px
     faria o botão piscar.
     ========================================================================== */
  function atualizarTopo() {
    var botao = document.querySelector('.topo');
    if (!botao) return;
    var doc = document.documentElement;
    var altura = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0);
    var temParaOnde = altura > window.innerHeight + 2;
    /* Escrever o mesmo valor outra vez é a operação que a função `pintar` evita e
       explica: guarda-se o último estado para não tocar no DOM em cada quadro. */
    if (botao.hidden === !temParaOnde) return;
    botao.hidden = !temParaOnde;
  }
  /* Exposto porque quem muda a altura da página NÃO é só o carregamento: o filtro da
     lista esconde linhas, a paginação troca de página, e o painel do ato abre e fecha.
     Uma cópia da regra em cada um desses sítios divergiria daqui. */
  window.atualizarTopo = atualizarTopo;

  remedeirSeALarguraMudou(false);
  pintar();
  atualizarTopo();
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('load', atualizarTopo);
  window.addEventListener('resize', atualizarTopo);
  /* A altura MUDA SEM ROLAGEM e sem `resize`: um filtro que esconde linhas, uma
     página de lista que troca de conteúdo. O `ResizeObserver` no `body` vê as duas
     — e é a única forma de o botão não ficar a tapar o que acabou de aparecer. */
  if (typeof ResizeObserver === 'function' && document.body) {
    try { new ResizeObserver(atualizarTopo).observe(document.body); } catch (e) {}
  }
  window.addEventListener('resize', function () { remedeirSeALarguraMudou(true); });
  window.addEventListener('load', function () { remedeirSeALarguraMudou(true); });
  /* Página restaurada do cache do navegador: volta já rolada, com o estado de antes. */
  window.addEventListener('pageshow', function () { pintar(); });
})();

/* ======================================================================
 * A OPERAÇÃO QUE ATRAVESSA AS ABAS (11/11/2026)
 *
 * O PEDIDO, na letra dela: «se o usuário ele tá com várias abas abertas, então em uma aba ele tem
 * aqui o ajuste que ele fez no professor, na turma atribuída, ele foi lá e derivou. Aí ele tem
 * numa outra aba aberto, por exemplo, o plano do ciclo. O plano do ciclo que tem impacto direto
 * ao que ele ajustou tem que estar inabilitado enquanto estiver processando. A mesma coisa o
 * plano de observação […] e a mesma coisa os documentos que vão ser derivados a partir do plano
 * de observação.» E ainda: «precisa colocar uma etiqueta também que indique o que que está
 * acontecendo […] precisa de um nome semântico equivalente».
 *
 * PORQUE AQUI, e não em cada página. O `nav.js` é o ÚNICO script que todas as páginas carregam: a
 * Produção (Bastidores), a porta (`/plano-ensino/`, `/plano-observacao/`, `/anamnese/`) e cada
 * documento publicado do pacote. Uma regra escrita em cada uma seria seis cópias a divergir na
 * primeira correcção — e a que ficasse para trás seria justamente a que o professor tem aberta.
 *
 * COMO AS ABAS SE FALAM. Duas vias, e as duas são precisas: o `BroadcastChannel` entrega no
 * instante (é o que faz a outra aba reagir antes de o utilizador a olhar), e o `localStorage` com
 * o evento `storage` é o que sobrevive a uma aba que abre JÁ a meio da operação — a aba que nasce
 * não recebe o que foi transmitido antes de ela existir. Nenhuma das duas entrega ao próprio
 * remetente, e é isso que impede o eco.
 *
 * O QUE FICA GRAVADO. `{ aba, etiqueta, texto, em, expira }`. A `aba` é a identidade da ABA e não
 * do documento (vive no `sessionStorage`, que sobrevive à recarga): sem ela, a página recarregada
 * lia a operação que ela própria publicara e trancava-se a si mesma por dois minutos. O `expira`
 * é a rede de segurança de sempre — um véu que tranca para sempre é o pior modo de falha deste
 * sistema.
 *
 * O VÉU É A PEÇA DA FOLHA (`.veu`) e a etiqueta é o `.selo` do catálogo. O que este bloco traz é
 * o ESTADO, o TEXTO e a travessia entre abas — não um desenho novo.
 * ====================================================================== */
(function () {
  var CHAVE = 'lastro:operacao';
  var CANAL = 'lastro:operacao';
  var VALIDADE = 120000;
  var ROTULO_DE_REPOUSO = 'a processar';
  /* A PÁGINA PODE PEDIR UMA OPERAÇÃO SÓ DELA (11/11/2026) — `data-operacao="so-esta-aba"` no
   * `<html>`. Existe por um consumidor real: a bancada que compara as formas do véu. Uma bancada
   * que publicasse a operação trancaria as abas de trabalho de quem a está a abrir — e o véu que
   * ela mostra nem sequer é o que está a ser decidido. Nesta forma, a página pinta e tranca como
   * sempre, e não avisa ninguém nem escuta ninguém. */
  var SO_ESTA_ABA = document.documentElement.getAttribute('data-operacao') === 'so-esta-aba';

  var MINHA_ABA = (function () {
    try {
      var s = sessionStorage.getItem('lastro:aba');
      if (!s) {
        s = 'aba-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem('lastro:aba', s);
      }
      return s;
    } catch (e) {
      return 'aba-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }
  })();

  var veu = null, alvoEtiqueta = null, alvoTexto = null, alvoNota = null;
  var temporizador = null;
  var meu = null;      // a operação que ESTA aba publicou
  var remota = null;   // a que veio de outra aba e ainda vale
  var canal = null;

  /**
   * O VÉU, GARANTIDO NA FORMA CERTA.
   *
   * A página da Produção já traz o seu `<div id="veu"><p class="veu-texto">`; as outras não
   * trazem nada. Em vez de duas marcações (uma por sítio, a divergir), esta função NORMALIZA o
   * que encontrar: cria o véu quando falta e envolve o que já lá está num `.veu-cartao` com a
   * etiqueta e o texto. Um só construtor — e a página que já tinha o seu não perde nada.
   *
   * E REPARENTA-O PARA O `<body>`. Na Produção o véu nasce dentro do `#conteudo`, e `trancar`
   * põe `inert` no `#conteudo`: o véu ficava inerte com ele, e o texto que ele diz — que é o
   * ofício dele — deixava de ser lido por quem usa leitor de ecrã. Como filho directo do `body`,
   * é o único que fica de fora.
   */
  function garantirVeu() {
    if (veu && document.body && document.body.contains(veu)) return veu;
    if (!document.body) return null;
    veu = document.getElementById('veu');
    if (!veu) {
      veu = document.createElement('div');
      veu.id = 'veu';
      /* O VÉU DA OPERAÇÃO TEM NOME PRÓPRIO (15/11/2026) — `.veu-de-operacao`, e não `.veu`.
       * Eram duas peças com a mesma classe: esta (`display:none`, `z-index:120`) e a da folha do
       * menu (`display:block`, `z-index:55`, acesa por `body.coluna-aberta`). A regra desta vinha
       * depois na folha e apagava a da outra: medido num Chromium a 414px, a folha do ☰ abria sem
       * escurecer a página. A busca deste módulo é por `#veu`, portanto o nome da classe não
       * afecta nada aqui — só deixa de haver duas peças a responder ao mesmo nome. */
      veu.className = 'veu-de-operacao';
      veu.setAttribute('role', 'status');
      veu.setAttribute('aria-live', 'polite');
      document.body.appendChild(veu);
    } else if (veu.parentElement !== document.body) {
      document.body.appendChild(veu);
    }
    /* A CLASSE DO VÉU QUE VEIO NO HTML TAMBÉM SE CORRIGE (15/11/2026) — e esta linha é um defeito
     * de produção, não uma limpeza.
     *
     * O véu da operação nasceu com a classe `.veu`, a mesma do véu da FOLHA. Em 15/11 ele passou a
     * `.veu-de-operacao` na folha de estilo — mas a marcação de `porta/index.html` ficou como
     * estava, e esta função só escrevia a classe quando CRIAVA o elemento. Resultado, medido no
     * navegador na porta de uma escola: `<div class="veu" id="veu">` com `data-ocupado="sim"`,
     * `display:none`, `opacity:0`, `z-index:55` — casado pela regra da COLUNA, que nasce
     * transparente. O véu estava lá, cobria a janela inteira e não se via. Foi o que ela relatou:
     * «quando eu fiz a anamnese, não teve o véu» — na porta, que é onde a anamnese, o plano de
     * ensino e o plano de observação se preenchem.
     *
     * Normalizar aqui, e não só na fonte que gera os pacotes, é o que alcança as páginas JÁ
     * PUBLICADAS: o `porta/index.html` corrigido só vale para os pacotes gerados depois, e o
     * `nav.js` é copiado para dentro de cada pacote e corre em todas as páginas. Uma linha aqui
     * conserta as nove cópias no deploy seguinte, sem regerar ciclo nenhum.
     *
     * A troca é de NOME, não de peça: a coluna continua com o `.veu` dela (sem `id`), e este
     * elemento é o da operação — o `id="veu"` é o que o distingue, e é por ele que a busca acima
     * o encontra. */
    if (veu.classList && !veu.classList.contains('veu-de-operacao')) {
      veu.classList.remove('veu');
      veu.classList.add('veu-de-operacao');
    }
    var cartao = veu.querySelector('.veu-cartao');
    if (!cartao) {
      cartao = document.createElement('div');
      cartao.className = 'veu-cartao';
      while (veu.firstChild) cartao.appendChild(veu.firstChild);
      veu.appendChild(cartao);
    }
    alvoEtiqueta = cartao.querySelector('.veu-etiqueta');
    if (!alvoEtiqueta) {
      alvoEtiqueta = document.createElement('span');
      alvoEtiqueta.className = 'selo veu-etiqueta';
      alvoEtiqueta.textContent = ROTULO_DE_REPOUSO;
      cartao.insertBefore(alvoEtiqueta, cartao.firstChild);
    }
    alvoTexto = cartao.querySelector('.veu-texto');
    if (!alvoTexto) {
      alvoTexto = document.createElement('p');
      alvoTexto.className = 'veu-texto';
      cartao.appendChild(alvoTexto);
    }
    if (!alvoTexto.id) alvoTexto.id = 'veu-texto';
    alvoNota = cartao.querySelector('.veu-nota');
    if (!alvoNota) {
      alvoNota = document.createElement('p');
      alvoNota.className = 'veu-nota';
      alvoNota.textContent = 'A operação começou noutra aba desta escola. Esta página fica travada '
        + 'até ela terminar — e volta sozinha quando terminar.';
      cartao.appendChild(alvoNota);
    }
    return veu;
  }

  function trancar(sim) {
    if (!document.body) return;
    var filhos = document.body.children;
    for (var i = 0; i < filhos.length; i++) {
      if (filhos[i].id === 'veu') continue;
      filhos[i].inert = sim;
    }
  }

  /**
   * QUEM MANDA NO VÉU, POR ORDEM: a operação desta aba; senão a que veio de outra; senão nada.
   * Uma função só decide o estado — e é isso que impede o véu de mentir quando as duas coisas
   * se cruzam (duas abas a trabalhar ao mesmo tempo, ou uma a acabar enquanto a outra começa).
   */
  function aplicar() {
    if (!veu || !document.body || !document.body.contains(veu)) {
      if (!garantirVeu()) return;
    }
    var op = meu || remota;
    if (!op) {
      veu.removeAttribute('data-ocupado');
      veu.removeAttribute('data-remota');
      trancar(false);
      return;
    }
    alvoEtiqueta.textContent = String(op.etiqueta || ROTULO_DE_REPOUSO);
    alvoTexto.textContent = String(op.texto || 'a trabalhar\u2026');
    veu.setAttribute('data-ocupado', 'sim');
    if (op === remota && !meu) veu.setAttribute('data-remota', 'sim');
    else veu.removeAttribute('data-remota');
    trancar(true);
  }

  function ler() {
    if (SO_ESTA_ABA) return null;
    try {
      var bruto = localStorage.getItem(CHAVE);
      return bruto ? JSON.parse(bruto) : null;
    } catch (e) { return null; }
  }
  function escrever(op) {
    if (SO_ESTA_ABA) return;
    try {
      if (op) localStorage.setItem(CHAVE, JSON.stringify(op));
      else localStorage.removeItem(CHAVE);
    } catch (e) { /* modo privado ou cota: a via do canal continua a valer */ }
  }
  function transmitir(mensagem) {
    if (SO_ESTA_ABA) return;
    try { if (canal) canal.postMessage(mensagem); } catch (e) {}
  }

  function reagendar() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    var op = meu || remota;
    if (!op) return;
    var falta = op.expira ? Math.max(0, op.expira - Date.now()) : VALIDADE;
    /* A REDE DE SEGURANÇA: um pedido que dura mais do que a validade já não está a correr, está
       pendurado. Um véu que expira é melhor do que uma tela presa. */
    temporizador = setTimeout(function () {
      if (meu) liberar();
      else { remota = null; aplicar(); }
    }, falta);
  }

  function receber(op) {
    if (!op) return;
    if (op.fim) {
      if (op.aba === MINHA_ABA) return;
      remota = null;
      aplicar();
      reagendar();
      return;
    }
    if (op.aba === MINHA_ABA) return;                  // o eco da própria aba não conta
    if (!op.expira || op.expira <= Date.now()) return; // vencida: não tranca ninguém
    remota = op;
    aplicar();
    reagendar();
  }

  /** Ocupa ESTA aba e avisa as outras. `rotulo` é a palavra que nomeia a operação. */
  function ocupar(frase, rotulo) {
    var agora = Date.now();
    meu = {
      aba: MINHA_ABA,
      etiqueta: String(rotulo || ROTULO_DE_REPOUSO),
      texto: String(frase || 'a trabalhar\u2026'),
      em: agora,
      expira: agora + VALIDADE,
    };
    aplicar();
    escrever(meu);
    transmitir(meu);
    reagendar();
  }

  function dizer(frase) {
    if (!meu) return;
    meu.texto = String(frase || '');
    aplicar();
    escrever(meu);
    transmitir(meu);
  }

  function liberar() {
    var eraMinha = Boolean(meu);
    meu = null;
    if (eraMinha) { escrever(null); transmitir({ fim: true, aba: MINHA_ABA }); }
    /* A OUTRA ABA PODE AINDA ESTAR A TRABALHAR: terminar a minha operação não é destrancar a
       página se houver uma segunda de pé. O estado converge pela mesma função de sempre. */
    var guardada = ler();
    remota = (guardada && guardada.aba !== MINHA_ABA && guardada.expira > Date.now())
      ? guardada : null;
    aplicar();
    reagendar();
  }

  if (!SO_ESTA_ABA) window.addEventListener('storage', function (e) {
    if (e.key !== CHAVE) return;
    if (!e.newValue) { remota = null; aplicar(); reagendar(); return; }
    try { receber(JSON.parse(e.newValue)); } catch (err) {}
  });
  if (!SO_ESTA_ABA && typeof BroadcastChannel === 'function') {
    try {
      canal = new BroadcastChannel(CANAL);
      canal.onmessage = function (e) { receber(e.data); };
    } catch (e) { canal = null; }
  }

  /* A ABA QUE ABRE JÁ A MEIO DA OPERAÇÃO tem de a ver. Se a operação gravada é DESTA aba (uma
     recarga a meio do gesto), não se tranca: o documento que acabou de nascer é a autoridade, e
     volta a publicar se a cadeia continuar. Sem isto, a página recarregada lia-se a si mesma e
     ficava dois minutos a olhar para o próprio véu. */
  (function () {
    var guardada = ler();
    if (!guardada) return;
    if (guardada.aba === MINHA_ABA) { escrever(null); return; }
    if (!guardada.expira || guardada.expira <= Date.now()) { escrever(null); return; }
    receber(guardada);
  })();

  /* O VÉU FICA MONTADO DESDE O ARRANQUE, e não só quando é preciso: assim a página que já o
     trazia na marcação é normalizada ANTES de alguém o acender — e a primeira vez que se vê já
     tem a etiqueta e a nota no sítio. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { garantirVeu(); aplicar(); });
  } else {
    garantirVeu();
    aplicar();
  }

  window.LastroDaOperacao = {
    ocupar: ocupar,
    dizer: dizer,
    liberar: liberar,
    /* Só para as provas e para o diagnóstico: diz o que está de pé, sem tocar em nada. */
    estado: function () {
      return {
        aba: MINHA_ABA,
        minha: meu ? { etiqueta: meu.etiqueta, texto: meu.texto, expira: meu.expira } : null,
        remota: remota ? { etiqueta: remota.etiqueta, texto: remota.texto } : null,
        gravada: ler(),
        visivel: Boolean(veu && veu.getAttribute('data-ocupado') === 'sim'),
        remotaNaTela: Boolean(veu && veu.getAttribute('data-remota') === 'sim'),
      };
    },
  };
})();

/* ============================================================================
 * ONDE ESTOU — O GRUPO DA COLUNA QUE ESTA PÁGINA HABITA (24/11/2026)
 *
 * O QUE ACONTECEU, dito por quem viu. A coluna tem o filete de ouro no grupo do
 * documento actual (`data-atual`, que o `ciclo.css` estiliza em dois sítios). O
 * gerador escreve-o quando um ITEM do grupo aponta para a página — e isso cobre
 * `/area-do-professor/anamnese/` e as outras listas de dentro. Não cobre o resto:
 *
 *   · `/aulas/` — a lista de aulas não é item de grupo nenhum (enumerá-la no menu
 *     voltaria a fazer do menu um índice, que é a decisão de 24/10);
 *   · `/ciclos/…` — as páginas do ciclo também não estão na coluna.
 *
 * Nessas páginas a coluna não dizia nada, e o filete de ouro existia só para as
 * três listas. A pesquisadora: «marcar "Área do Professor" em /aulas/ e nas
 * páginas do ciclo». O trabalho de sala É a Área do Professor — quem abre a lista
 * de aulas está a trabalhar, e é isso que a coluna tem de dizer.
 *
 * PORQUE É AQUI, E NÃO NO GERADOR. O gerador escreve o HTML de cada página do
 * pacote, e estas páginas JÁ ESTÃO ESCRITAS — mudá-lo obrigaria a regerar o ciclo
 * de cada escola (e o `.fipp` de cada uma) para o filete aparecer. Este ficheiro
 * é copiado para dentro de cada pacote na montagem, e corre em todas as páginas:
 * uma mudança aqui chega a todas as escolas no deploy seguinte, sem tocar em
 * fonte nenhuma.
 *
 * O SERVIDOR CONTINUA A MANDAR. O que o gerador marcou não se discute: este bloco
 * só age quando NENHUM grupo está marcado — é o intervalo, não uma segunda
 * opinião. E a família de páginas é DECLARADA (não adivinhada por prefixo comum),
 * porque é uma decisão de desenho: se amanhã outra página passar a pertencer a um
 * grupo sem ser item dele, é esta lista que cresce.
 * ========================================================================== */
(function () {
  var FAMILIAS = [
    // A chave é a do painel do grupo (`aria-controls="g-<chave>"`), escrita pelo
    // gerador a partir do rótulo: «Área do Professor» → `area-do-professor`.
    { chave: 'area-do-professor', prefixos: ['/area-do-professor/', '/aulas/', '/ciclos/'] },
  ];

  var coluna = document.querySelector('.coluna') || document.querySelector('.lateral');
  if (!coluna) return;
  // O GERADOR JÁ DISSE: não há nada a acrescentar.
  if (coluna.querySelector('.coluna-grupo[data-atual="sim"]')) return;

  var caminho = location.pathname;
  for (var i = 0; i < FAMILIAS.length; i++) {
    var familia = FAMILIAS[i];
    var pertence = familia.prefixos.some(function (p) {
      return caminho === p || caminho.indexOf(p) === 0;
    });
    if (!pertence) continue;
    var grupo = coluna.querySelector('.coluna-grupo > [aria-controls="g-' + familia.chave + '"]');
    grupo = grupo ? grupo.closest('.coluna-grupo') : null;
    if (!grupo) continue;
    grupo.setAttribute('data-atual', 'sim');
    /* E O ITEM ACESO, que é a outra metade da mesma ideia: dentro do grupo, o link
       da lista que se está a ver fica com `aria-current`. No `/aulas/` não há item
       para acender; nas páginas do ciclo também não. Marcar só o grupo é o que a
       coluna pode afirmar sem inventar. */
    return;
  }
})();

/* ============================================================================
 * O RODAPÉ É UM CANAL — «FALE CONOSCO» EM TODAS AS TELAS (18/11/2026)
 *
 * O QUE ELA PEDIU, e são três pedidos numa frase: «Coloca também essa mesma
 * solução de rodapé que a gente tem nas páginas das escolas […] se eu estiver
 * nos bastidores quanto se eu estiver no sistema lastro. […] E isso vai para o
 * motor, né? Porque aí toda a escola já nasce com isso.»
 *
 * PORQUE É AQUI, E NÃO EM CADA GERADOR. Este ficheiro é o ÚNICO script que todas
 * as telas carregam — a raiz, os Bastidores, a porta do plano e do PO, e os
 * documentos publicados de cada escola —, e é copiado para dentro de cada pacote
 * na montagem. Uma linha aqui chega a todas as escolas no deploy seguinte, sem
 * regerar ciclo nenhum e sem tocar no `.fipp` de nenhuma. É a mesma razão pela
 * qual o véu da operação e o «onde estou» já vivem aqui.
 *
 * O QUE SE ACRESCENTA, E NÃO SE SUBSTITUI. As páginas do ciclo JÁ têm um
 * `<footer class="rodape">` com a identificação do ciclo; a linha do canal entra
 * DENTRO dele, como mais um parágrafo. Um segundo rodapé na mesma página seria
 * dois rodapés a dizer coisas diferentes — e o de baixo é o que ninguém lê.
 *
 * O FORMULÁRIO ENVIA, NÃO ABRE NADA (18/11/2026, segunda passagem). «O formulário
 * é para enviar direto, não vai abrir nada, ele vai enviar, igual a gente fez a
 * solução quando a secretaria cadastra um novo aluno e escolhe o professor.» O
 * `mailto:` saiu do caminho: ele abria o programa de correio de quem escreve, e
 * dependia de a pessoa o enviar por lá. Agora o `POST /api/contato` grava e
 * manda o aviso por e-mail do servidor. O clique no endereço do rodapé continua
 * a abrir o programa de correio — isso ela quis manter, e é outra coisa: ali a
 * pessoa sabe que está a escrever de próprio punho.
 *
 * O WHATSAPP DO FORMULÁRIO SAIU, O DO RODAPÉ FICOU. «Não tem o botão abrir o
 * WhatsApp» — não há API de WhatsApp nesta casa, e um botão que abre um `wa.me`
 * sem a mensagem composta promete o que não cumpre. O número continua escrito no
 * rodapé, que é onde ele é útil: quem quiser, clica e escreve por lá.
 * ========================================================================== */
(function () {
  /* UMA VEZ POR PÁGINA. O `raiz/index.html` teve o seu próprio rodapé e o seu
   * próprio modal até 18/11/2026; se uma página trouxer o canal, não se acrescenta
   * outro. A marca é o atributo, e não o id: os ids do modal são os mesmos nos dois
   * desenhos de propósito, para as provas poderem medir o que está à vista. */
  if (document.querySelector('[data-fale-conosco]')) return;

  var EMAIL = 'lastro@padd.com.br';
  /* O `wa.me` quer os dígitos com o país: 55 (Brasil) + 54 (o DDD) + o número.
   * Escrito à mão como `+55 (54) 99175-2662` o link não abre — e é por isso que o
   * endereço legível e o endereço que funciona vivem separados. */
  var WHATSAPP = '5554991752662';
  var WHATSAPP_ESCRITO = '+55 (54) 99175-2662';

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── 1. A LINHA DO RODAPÉ ───────────────────────────────────────────────── */
  var rodape = document.querySelector('footer.rodape') || document.querySelector('.rodape');
  var propria = false;
  if (!rodape) {
    rodape = document.createElement('footer');
    rodape.className = 'rodape';
    propria = true;
    /* ONDE ELE NASCE, QUANDO A PÁGINA NÃO TEM UM (18/11/2026).
     *
     * «No bastidores produção é que não ficou […] Ele está escondido, parte dele está escondido
     * atrás do menu vertical à esquerda. Então eu só consigo ler «ponto com br», WhatsApp e o
     * número do WhatsApp.»
     *
     * A CAUSA É DE SÍTIO, e não de estilo. A página de trabalho tem a coluna do menu FIXA à
     * esquerda (248px) e o conteúdo dentro de `.corpo`, que é quem reserva esse espaço no
     * `padding-left`. Um rodapé pendurado no `body` começa em x=0 — debaixo da coluna. Na raiz do
     * Sistema Lastro não há coluna, e por isso lá ele sempre se leu bem.
     *
     * A correcção é entrar onde o conteúdo está: se a página tem `.corpo`, o rodapé é o ÚLTIMO
     * filho dele, e herda o mesmo recuo que a listagem. Não se inventa margem nem número mágico —
     * quem sabe onde o conteúdo começa é o contentor do conteúdo. Nas páginas sem `.corpo` nada
     * muda: continua a ser o último elemento do `body`, como sempre foi. */
    var corpo = document.querySelector('.corpo');
    (corpo || document.body || document.documentElement).appendChild(rodape);
  }
  var linha = document.createElement('p');
  linha.setAttribute('data-fale-conosco', 'sim');
  linha.innerHTML =
    '<button class="acao secundario pequena" id="btn-fale-conosco" type="button">Fale conosco</button>'
    + ' &middot; E-mail: <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>'
    + ' &middot; WhatsApp: <a href="https://wa.me/' + WHATSAPP + '" target="_blank" rel="noopener">'
    + WHATSAPP_ESCRITO + '</a>';
  rodape.appendChild(linha);

  /* O RECADO DO ENVIO, AO LADO DO BOTÃO. O modal fecha-se depois de enviar — foi o
   * que ela pediu —, e sem esta linha o formulário desaparecia sem dizer nada a
   * quem o preencheu. `role="status"` é o que faz o leitor de ecrã anunciá-la. */
  var recado = document.createElement('p');
  recado.className = 'res ok';
  recado.setAttribute('role', 'status');
  recado.setAttribute('data-fale-recado', 'sim');
  recado.hidden = true;
  if (propria) rodape.appendChild(recado);
  else linha.parentNode.insertBefore(recado, linha.nextSibling);

  /* ── 2. A JANELA ────────────────────────────────────────────────────────── */
  var caixa = document.createElement('div');
  caixa.className = 'modal';
  caixa.id = 'modal-fale';
  caixa.hidden = true;
  caixa.innerHTML =
    '<div class="modal-fundo" data-fechar-fale></div>'
    + '<div class="modal-caixa modal-largo" role="dialog" aria-modal="true" aria-labelledby="fale-titulo">'
    + '  <div class="modal-cab">'
    + '    <h2 id="fale-titulo">Fale conosco</h2>'
    + '    <button class="modal-x" id="btn-fechar-fale" type="button" aria-label="Fechar">&times;</button>'
    + '  </div>'
    + '  <form class="form" id="form-fale" novalidate>'
    + '    <div class="etapa-campos">'
    + '      <p class="etapa-campo largo">Escreva aqui como quer falar conosco.</p>'
    + '      <p class="etapa-campo">'
    + '        <label class="campo-rotulo" for="fale-nome">Seu nome</label>'
    + '        <input id="fale-nome" autocomplete="name" placeholder="Nome e sobrenome">'
    + '      </p>'
    + '      <p class="etapa-campo">'
    + '        <label class="campo-rotulo" for="fale-escola">Nome da escola</label>'
    + '        <input id="fale-escola" autocomplete="organization" placeholder="A escola onde você trabalha">'
    + '      </p>'
    + '      <p class="etapa-campo">'
    + '        <label class="campo-rotulo" for="fale-email">Seu e-mail</label>'
    + '        <input type="email" id="fale-email" autocomplete="email" placeholder="voce@exemplo.com.br">'
    + '      </p>'
    + '      <p class="etapa-campo">'
    /* O TELEFONE NÃO É `type="tel"`: a folha desenha os campos por TIPO, e `tel`
     * nunca esteve na lista — o campo saía com o desenho cru do navegador no meio
     * de uma janela desenhada, e ela viu-o e chamou-lhe «muito feio, destoante». A
     * convenção da casa é `inputmode="tel"` num campo de texto, como no cadastro
     * da escola: teclado numérico no celular, campo da folha no ecrã. */
    + '        <label class="campo-rotulo" for="fale-telefone">Seu telefone (WhatsApp)</label>'
    + '        <input id="fale-telefone" autocomplete="off" inputmode="tel" placeholder="(51) 99999-0000">'
    + '      </p>'
    + '      <p class="etapa-campo largo">'
    + '        <label class="campo-rotulo" for="fale-mensagem">Mensagem</label>'
    + '        <textarea id="fale-mensagem" rows="4"'
    + '          placeholder="Conte o que você precisa ou autorize que um consultor entre em contato com você."></textarea>'
    + '      </p>'
    + '      <p class="etapa-campo largo res" id="fale-res"></p>'
    + '    </div>'
    + '    <div class="modal-acoes">'
    + '      <button class="acao" id="fale-enviar" type="submit">Enviar por e-mail</button>'
    + '    </div>'
    + '  </form>'
    + '</div>';
  (document.body || document.documentElement).appendChild(caixa);

  var res = document.getElementById('fale-res');
  var botaoEnviar = document.getElementById('fale-enviar');

  function valor(id) {
    var e = document.getElementById(id);
    return e ? String(e.value || '').trim() : '';
  }
  function dizer(estado, texto) {
    if (!res) return;
    res.className = 'etapa-campo largo res' + (estado ? ' ' + estado : '');
    res.textContent = texto;
    if (texto && res.scrollIntoView) res.scrollIntoView({ block: 'nearest' });
  }
  function abrir() {
    caixa.hidden = false;
    dizer('', '');
    recado.hidden = true;
    var primeiro = document.getElementById('fale-nome');
    if (primeiro) primeiro.focus();
  }
  function fechar() {
    caixa.hidden = true;
  }

  /* AS CINCO RESPOSTAS SÃO OBRIGATÓRIAS — «obrigatoriamente tem que saber os nomes, o
   * e-mail e o telefone e mensagem para poder enviar». A ordem das perguntas é a
   * ordem das mensagens, e a validação de verdade é a do servidor (a mesma regra,
   * uma vez só): aqui evita-se a viagem de ida e volta e diz-se o que falta. */
  function recolher() {
    var d = {
      nome: valor('fale-nome'),
      escola: valor('fale-escola'),
      email: valor('fale-email'),
      telefone: valor('fale-telefone'),
      mensagem: valor('fale-mensagem'),
    };
    var faltas = [
      [d.nome, 'o seu nome', 'fale-nome'],
      [d.escola, 'o nome da escola', 'fale-escola'],
      [d.email, 'o seu e-mail', 'fale-email'],
      [d.telefone, 'o seu telefone', 'fale-telefone'],
      [d.mensagem, 'a sua mensagem', 'fale-mensagem'],
    ];
    for (var i = 0; i < faltas.length; i++) {
      if (faltas[i][0]) continue;
      dizer('aviso', 'Falta ' + faltas[i][1] + ' — todos os campos são necessários para lhe respondermos.');
      var campo = document.getElementById(faltas[i][2]);
      if (campo) campo.focus();
      return null;
    }
    return d;
  }

  function enviar() {
    var d = recolher();
    if (!d) return;
    if (botaoEnviar) { botaoEnviar.disabled = true; botaoEnviar.textContent = 'A enviar…'; }
    dizer('', '');
    fetch('/api/contato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (x) { return x || {}; })
      .catch(function () { return {}; })
      .then(function (x) {
        if (botaoEnviar) { botaoEnviar.disabled = false; botaoEnviar.textContent = 'Enviar por e-mail'; }
        /* OS DOIS DESFECHOS SÃO DIFERENTES, E A TELA NÃO OS CONFUNDE: o pedido ficar
         * registado do nosso lado e o aviso sair por e-mail são coisas distintas. A
         * janela só se fecha quando AS DUAS aconteceram — fechá-la sobre um aviso que
         * não saiu seria dizer «enviado» sobre uma mensagem que ninguém recebeu. */
        if (x.ok && x.enviado) {
          fechar();
          var form = document.getElementById('form-fale');
          if (form) form.reset();
          if (recado) {
            recado.className = 'res ok';
            recado.textContent = 'Mensagem enviada. Respondemos pelo e-mail ou pelo WhatsApp que você deixou.';
            recado.hidden = false;
          }
          return;
        }
        if (x.ok) {
          dizer('aviso', 'O seu pedido ficou registado, mas o aviso por e-mail não saiu'
            + (x.dica ? ' (' + x.dica + ')' : '')
            + '. Escreva para ' + EMAIL + ' — este texto está à sua frente para copiar.');
          return;
        }
        dizer('erro', (x && x.erro) ? String(x.erro) : 'Não foi possível enviar agora. Tente de novo, ou escreva para ' + EMAIL + '.');
      });
  }

  /* A LIGAÇÃO É DELEGADA NO DOCUMENTO: em algumas páginas o rodapé é escrito DEPOIS
   * deste script (a lista de escolas da raiz é injetada), e um `getElementById` no
   * momento em que isto corre ligaria o botão a nulo — o defeito que a prova de
   * 18/11/2026 apanhou, com o botão a dizer «Fale conosco» e a não abrir nada. */
  document.addEventListener('click', function (e) {
    var alvo = e.target;
    if (!alvo || !alvo.closest) return;
    if (alvo.closest('#btn-fale-conosco')) { abrir(); return; }
    if (alvo.closest('#btn-fechar-fale') || alvo.closest('[data-fechar-fale]')) fechar();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !caixa.hidden) fechar();
  });
  var form = document.getElementById('form-fale');
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); enviar(); });
})();
