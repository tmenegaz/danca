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
  function lerModo() {
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
  aplicar(lerModo());
  var botaoTema = document.querySelector('.tema');
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

  /* Página sem navegação (o arquivo é carregado pelo template, não só pelo ciclo):
     sai sem tocar em nada, em vez de estourar mais abaixo. */
  if (!navbar) return;

  function ajustarAlturaNavbar() {
    document.documentElement.style.setProperty('--header-height', navbar.offsetHeight + 'px');
  }

  if (botao) {
    botao.addEventListener('click', function () {
      var aberto = navbar.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
      ajustarAlturaNavbar();
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
  window.addEventListener('resize', ajustarAlturaNavbar);

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
