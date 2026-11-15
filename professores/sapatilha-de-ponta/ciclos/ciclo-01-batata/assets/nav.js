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
