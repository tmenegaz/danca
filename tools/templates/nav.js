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
