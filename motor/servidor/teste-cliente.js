'use strict';

/**
 * teste-cliente.js — o PREENCHEDOR das escolas de teste, servido como script.
 *
 * Ele vale numa ponta só: a PORTA (`data-tela="porta"`). Abre a anamnese, o plano de ensino e o
 * plano de observação, e preenche o registo escolhido no contexto — trocar a aluna ou a turma
 * repreenche.
 *
 * A PRODUÇÃO SAIU DAQUI (19/11/2026). «A gente tem a solução de testes que preenche os campos dos
 * formulários lá na parte dos bastidores produção. Pode remover de lá, não vamos mais usar. Vamos
 * usar apenas no anamnese, plano de ensino e no plano de observação.» O ramo dos Bastidores — e com
 * ele os preenchimentos de Turma, Rubrica, Exercício, Aluna e Curadoria, o painel e o
 * preenchimento automático no arranque — foi apagado. Não ficou desligado por uma condição: saiu,
 * para não haver um segundo caminho que um dia voltasse a escrever por cima de quem trabalha.
 *
 * O QUE ELE NUNCA FAZ — e é a parte que importa: não chama POST/PUT/DELETE, não
 * grava no KV, não submete formulário, não dispara workflow. O único pedido que faz
 * é `GET /api/teste`, que devolve o fixture da PRÓPRIA escola.
 *
 * O painel é um `<details>` fechado, no canto, com o número do teste e os seletores
 * para os outros registros. O preenchimento do primeiro registro é automático; os
 * demais são escolhidos ali.
 */

const SCRIPT = String.raw`(function () {
  'use strict';

  var teste = Number(document.documentElement.getAttribute('data-escola-teste') || 0);
  if (!teste) return;

  var fixture = null;
  var painel = null;
  var status = null;

  function texto(tag, classe, conteudo) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (conteudo != null) el.textContent = conteudo;
    return el;
  }

  function porId(id) { return document.getElementById(id); }

  /* A ESCOLHA DE REGISTO NO PAINEL — a peça que a porta usa para trocar de aluna ou de turma
   * (19/11/2026: vivia dentro do bloco da Produção, que saiu; a porta precisa dela). */
  function seletorDeRegistros(rotulo, itens, aoEscolher) {
    var bloco = texto('p', 'teste-linha');
    var etiqueta = texto('span', 'teste-rotulo', rotulo + ' ');
    var sel = document.createElement('select');
    for (var i = 0; i < itens.length; i++) {
      var o = document.createElement('option');
      o.value = String(i);
      o.textContent = itens[i];
      sel.appendChild(o);
    }
    sel.addEventListener('change', function () {
      limparStatus();
      aoEscolher(Number(sel.value));
    });
    bloco.appendChild(etiqueta);
    bloco.appendChild(sel);
    return bloco;
  }

  function limparStatus() {
    if (status) status.textContent = '';
  }

  function dizer(mensagem) {
    if (status) status.textContent = mensagem;
  }

  /* O QUE O SISTEMA SEMEIA NÃO É DO PROFESSOR (19/11/2026).
   *
   * O mapa declara, nó a nó, quem se semeia: o 'sujeitos' do Plano de Observação é
   * '"semeado": "turma"' — ele chega pronto de turma → linha de base → alunas, e o professor não
   * o escreve. O preenchedor preenche o que o professor escreveria; escrever o semeado é a única
   * forma de o fixture entrar no dado da escola.
   *
   * E a semente do formulário não corrige isso por si: ela só age quando o campo está VAZIO (para
   * não reescrever o que está gravado), portanto um valor do fixture passava a valer como
   * resposta — e ganhava à semente.
   *
   * O QUE ISTO FECHOU, medido na 'breu': o PO gravou «Aluna A», «Aluna B» e «Aluna C» — nomes do
   * fixture, três de uma escola de teste —, e a «Aluna B» passou a ler-se «vinculada» a um Plano
   * de Observação sem nunca ter estado em elenco nenhum, ao lado de «sem turma e sem linha de
   * base». As duas frases eram verdade sobre coisas diferentes (o registo e a pessoa) e, juntas,
   * mentiam. */
  function semeadoPeloSistema(id) {
    if (typeof MAPA === 'undefined' || !MAPA || !Array.isArray(MAPA.nos)) return false;
    for (var i = 0; i < MAPA.nos.length; i++) {
      var no = MAPA.nos[i];
      if (no && no.id === id && no.semeado) return true;
    }
    return false;
  }

  // ================= PORTA — ANAMNESE =======================================

  function garantirOpcao(sel, valor) {
    if (!sel || !valor) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === valor) { sel.value = valor; return; }
    }
    var o = document.createElement('option');
    o.value = valor;
    o.textContent = valor;
    sel.appendChild(o);
    sel.value = valor;
  }

  /* A ALUNA DO FIXTURE SÓ SE FORÇA QUANDO ALGUÉM A ESCOLHE (26/10/2026).
   *
   * O DEFEITO, medido na tela e reproduzido na bancada. Este preenchimento automático corria
   * quando o MAPA ficava pronto — que é ANTES de 'carregarAlunas' pôr o '?aluna=' do ato no
   * seletor. Sem aluna escolhida, caía no primeiro registo do fixture («Aluna A») e
   * 'garantirOpcao' ESCREVIA essa aluna no seletor. O ato dizia B, o campo dizia A, a porta
   * comparava os dois para autorizar o bilhete, não batiam — e a página devolvia a pessoa à
   * lista, que então oferecia «continuar» sobre um depósito que ela nunca escreveu.
   *
   * A regra que fica: o preenchimento automático NUNCA troca a aluna. Se a aluna do ato não tem
   * registo no fixture, não se preenche nada e diz-se porquê. Trocar a aluna é gesto de quem
   * ESCOLHE um registo no painel, e só esse caminho passa 'forcar'.
   */
  function preencherAnamnese(registro, forcar) {
    if (!registro) return;
    var sel = porId('ctx-aluna');
    if (sel && forcar) garantirOpcao(sel, registro.aluna);
    RESPOSTAS.clear();
    NOTAS.clear();
    SUGERIDAS.clear();
    Object.keys(registro.respostas || {}).forEach(function (k) {
      if (semeadoPeloSistema(k)) return;
      RESPOSTAS.set(k, registro.respostas[k]);
    });
    Object.keys(registro.notas || {}).forEach(function (k) { NOTAS.set(k, registro.notas[k]); });
    /* O CONTEXTO VOLTA A SER SEMEADO DA BARRA. O 'clear()' acima levou também as respostas que
       vêm do cabeçalho ('contexto-aluna' & cia), e sem esta linha a barra e o mapa divergiam —
       o documento continua a ler o contexto dos campos, mas o roteiro dava-os por vazios. */
    if (typeof semearDoContexto === 'function') semearDoContexto();
    if (typeof atualizarBarra === 'function') atualizarBarra();
    if (typeof pintarRoteiro === 'function') pintarRoteiro();
    if (typeof marcarContextoFaltando === 'function') marcarContextoFaltando();
    if (typeof atualizarComecar === 'function') atualizarComecar();
    if (typeof salvar === 'function') salvar();
    var conducao = porId('conducao');
    if (conducao && !conducao.classList.contains('oculto') && typeof renderPergunta === 'function') {
      renderPergunta();
    }
    dizer('Anamnese preenchida com o conteúdo de teste. A aluna continua a ser '
      + (((porId('ctx-aluna') || {}).value) || registro.aluna) + '. Confira e grave manualmente.');
  }

  function anamneseDaAluna(aluna) {
    var lista = fixture.anamnese || [];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].aluna === aluna) return lista[i];
    }
    return null;
  }

  /* O PREENCHIMENTO AUTOMÁTICO E A ALUNA DO ATO (26/10/2026).
   *
   * A REGRA, e a diferença que a torna certa: o preenchedor só ESCOLHE a aluna quando ninguém a
   * escolheu antes dele. Com aluna declarada no ato ('?aluna='), ela é do ato — o preenchedor
   * espera que chegue ao seletor (a lista é assíncrona) e nunca a troca; se a aluna do ato não
   * tiver registo no fixture, não preenche nada e di-lo.
   *
   * O caso da demonstração — sem aluna no endereço — continua a ser o de sempre: o primeiro
   * registo do fixture é o que se mostra, e é o preenchedor que o escolhe.
   */
  function alunaDoAto() {
    try { return String(new URLSearchParams(location.search).get('aluna') || '').trim(); }
    catch (e) { return ''; }
  }

  function quandoAluna(pronto, tentativas) {
    var sel = porId('ctx-aluna');
    var n = tentativas || 0;
    if (sel && sel.value) return pronto();
    if (n >= 40) {
      dizer('A aluna do ato não chegou ao seletor — nada foi preenchido.');
      return;
    }
    setTimeout(function () { quandoAluna(pronto, n + 1); }, 120);
  }

  function autoAnamnese() {
    var pedida = alunaDoAto();
    var primeiro = (fixture.anamnese || [])[0];
    if (!pedida) {
      if (primeiro) preencherAnamnese(primeiro, true);
      return;
    }
    quandoAluna(function () {
      /* A ALUNA SEM REGISTO NO FIXTURE TAMBÉM É PREENCHIDA (18/11/2026). Antes dizia-se «Sem
       * anamnese de teste para X — o formulário fica como está», e ficava: quem cria a aluna com
       * o nome que quer testar — que é o ponto de testar — não tinha ferramenta nenhuma. O
       * registo que serve de conteúdo é o primeiro; a ALUNA é a do ato, e não se troca. */
      var registro = anamneseDaAluna(pedida) || primeiro;
      if (!registro) return;
      preencherAnamnese(registro, false);
    });
  }

  function painelAnamnese() {
    var corpo = document.createDocumentFragment();
    var nomes = (fixture.anamnese || []).map(function (a) { return a.aluna; });
    corpo.appendChild(seletorDeRegistros('Aluna', nomes, function (i) {
      var registro = (fixture.anamnese || [])[i];
      /* AQUI O 'forcar' É VERDADEIRO, e só aqui: escolher um registo NO PAINEL é um gesto
         explícito de quem quer aquele registo. O preenchimento automático não tem esse direito. */
      if (registro) preencherAnamnese(registro, true);
    }));
    return corpo;
  }

  // ================= PORTA — PLANO DE ENSINO ================================

  /* A TURMA DO PREENCHIMENTO É A DO SELETOR — e nunca a do fixture (18/11/2026).
   *
   * O QUE ESTAVA A ACONTECER, dito pela pesquisadora: «se eu mudo o nome no plano de ensino para a
   * turma não ser um daqueles nomes que já estão definidos pelo ambiente de teste, o plano de
   * ensino não reconhece o nome que eu coloquei». E é isso: o preenchedor exigia que a turma do
   * FIXTURE estivesse no seletor, e desistia quando não estava. Quem inventa o nome da turma — que
   * é o que se faz a testar — ficava sem ferramenta, e a mensagem culpava a curadoria.
   *
   * A REGRA QUE FICA, e ela separa duas coisas que estavam juntas: o fixture é CONTEÚDO (as
   * respostas), a IDENTIDADE (turma, aluna, professor) é do ato. O conteúdo não depende de o nome
   * casar; a identidade nunca vem do fixture. Assim o preenchimento acelera o teste sem decidir
   * por quem testa — e a turma que ela escreveu continua a ser a turma do plano.
   *
   * O que NÃO se perde da correção de 27/10/2026: o preenchedor continua a não ACRESCENTAR ao
   * seletor nenhuma turma que a curadoria não autorize. Ele agora simplesmente não mexe no
   * seletor — usa o que lá está. */
  function turmaDoPreenchimento() {
    var sel = porId('ctx-turma');
    if (!sel) return '';
    var actual = String(sel.value || '');
    if (actual) return actual;
    var opcoes = [];
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value) opcoes.push(String(sel.options[i].value));
    }
    return opcoes.length === 1 ? opcoes[0] : '';
  }

  function preencherPlano(registro) {
    if (!registro) return;
    var sel = porId('ctx-turma');
    if (!sel) { dizer('O seletor de turma ainda não abriu. Aguarde um instante.'); return; }
    var turma = turmaDoPreenchimento();
    if (!turma) {
      dizer('Escolha a turma no cabeçalho e volte a preencher: o conteúdo de teste é o mesmo '
        + 'para qualquer turma, mas a turma do plano é sua, não do fixture.');
      return;
    }
    /* A TURMA DO SELETOR NÃO SE TROCA, E O «contexto-turma» É ELA (18/11/2026).
     *
     * Aqui escrevia-se 'sel.value = registro.turma' — a troca de 01/11/2026, que resolveu um
     * defeito real (o documento ia numa turma e a variante noutra, e a geração morria com
     * «manifesto da variante não encontrado») mas pela via errada: para as duas coisas deixarem
     * de divergir, passou a MANDAR o fixture na identidade. É a mesma divergência de hoje, ao
     * contrário.
     *
     * O que impede a divergência sem trocar a identidade é a RESPOSTA ser lida do SELETOR, e não
     * do fixture: 'contexto-turma' passa a valer 'turma', que é exactamente o que a barra mostra.
     * Uma verdade, e é a de quem preenche. */
    RESPOSTAS.clear();
    NOTAS.clear();
    SUGERIDAS.clear();
    RESPOSTAS.set('contexto-turma', turma);
    Object.keys(registro.respostas || {}).forEach(function (k) {
      if (semeadoPeloSistema(k)) return;
      RESPOSTAS.set(k, registro.respostas[k]);
    });
    Object.keys(registro.notas || {}).forEach(function (k) { NOTAS.set(k, registro.notas[k]); });
    // Depois do fixture, para nenhum fixture futuro poder reintroduzir a turma dele.
    RESPOSTAS.set('contexto-turma', turma);
    if (typeof semearDoContexto === 'function') semearDoContexto();
    if (typeof atualizarBarra === 'function') atualizarBarra();
    if (typeof pintarRoteiro === 'function') pintarRoteiro();
    if (typeof marcarContextoFaltando === 'function') marcarContextoFaltando();
    if (typeof atualizarComecar === 'function') atualizarComecar();
    if (typeof salvar === 'function') salvar();
    var conducao = porId('conducao');
    if (conducao && !conducao.classList.contains('oculto') && typeof renderPergunta === 'function') {
      renderPergunta();
    }
    dizer('Plano preenchido' + (turma === registro.turma ? '' : ' para a turma «' + turma + '»')
      + ' com o conteúdo de teste. Confira e grave manualmente.');
  }

  function planoDaTurma(nome) {
    var lista = fixture.plano || [];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].turma === nome) return lista[i];
    }
    return null;
  }

  /* O CONTEÚDO NÃO DEPENDE DO NOME DA TURMA (18/11/2026).
   *
   * Antes, o plano do fixture só se usava se a turma dele estivesse no seletor; sem isso, «nada
   * foi preenchido». A turma que ela escreve nunca está no fixture — é dela —, e então a
   * ferramenta ficava muda exactamente nas escolas em que ela quer testar. Agora o registo da
   * turma escolhida tem preferência (os valores daquela turma), e qualquer outro serve de
   * conteúdo quando não há: o que é do fixture é o texto, não a identidade.
   *
   * E ESPERA PELAS OPÇÕES: o seletor nasce antes de a curadoria chegar. Sem esta espera, a
   * lista estava vazia no primeiro instante e o preenchimento corria sobre um seletor que ainda
   * ia encher. */
  function autoPlano(tentativas) {
    var sel = porId('ctx-turma');
    var lista = fixture.plano || [];
    var opcoes = [];
    if (sel) for (var k = 0; k < sel.options.length; k++) opcoes.push(sel.options[k].value);
    var restantes = typeof tentativas === 'number' ? tentativas : 12;
    if (sel && !opcoes.filter(Boolean).length && restantes > 0) {
      setTimeout(function () { autoPlano(restantes - 1); }, 150);
      return;
    }
    if (!sel || !opcoes.filter(Boolean).length) {
      dizer('O seletor de turma está vazio — a curadoria ainda não atribuiu turmas a este '
        + 'professor. Sem turma não há plano a preencher.');
      return;
    }
    var escolhida = String(sel.value || '');
    var registro = (escolhida && planoDaTurma(escolhida)) || lista[0] || null;
    if (registro) preencherPlano(registro);
  }

  function painelPlano() {
    var corpo = document.createDocumentFragment();
    var nomes = (fixture.plano || []).map(function (p) { return p.turma; });
    corpo.appendChild(seletorDeRegistros('Turma', nomes, function (i) {
      var registro = (fixture.plano || [])[i];
      if (registro) preencherPlano(registro);
    }));
    return corpo;
  }

  // ================= O PLANO DE OBSERVAÇÃO =================================

  /* O PO consome o PLANO e a ANAMNESE; o fixture não pode trazer o que só o servidor sabe.
     Duas coisas ficam de fora do JSON e são resolvidas aqui, na hora de preencher:
       · o «plano-de-ensino» é um CARIMBO (plano-AAAAMMDD-HHMM), e o fixture só conhece a
         TURMA — o carimbo é lido da estante (api/planos), casando pela turma;
       · o resto vem escrito no fixture, campo a campo, e entra em RESPOSTAS como qualquer
         resposta do professor. Nada é submetido: gravar continua a ser um clique dele. */
  /* A ESTANTE PODE TER O RECORTE DO PROFESSOR no endereço (api/planos?professor=…). A
     chave exacta deixou de ser uma só (22/10/2026); o painel procura a família, não a chave. */
  function estanteDePlanos() {
    if (typeof OPCOES === 'undefined') return [];
    var chaves = Array.from(OPCOES.keys());
    for (var i = 0; i < chaves.length; i++) {
      if (String(chaves[i]).split('?')[0] === 'api/planos') return OPCOES.get(chaves[i]) || [];
    }
    return [];
  }

  function estanteCarregada() {
    if (typeof OPCOES === 'undefined') return false;
    var chaves = Array.from(OPCOES.keys());
    for (var i = 0; i < chaves.length; i++) {
      if (String(chaves[i]).split('?')[0] === 'api/planos') return true;
    }
    if (typeof OPCOES_ERRO !== 'undefined') {
      var erros = Array.from(OPCOES_ERRO.keys());
      for (var j = 0; j < erros.length; j++) {
        if (String(erros[j]).split('?')[0] === 'api/planos') return true;
      }
    }
    return false;
  }

  function carimboDoPlanoDaTurma(turma) {
    var lista = estanteDePlanos();
    for (var i = 0; i < lista.length; i++) {
      if (lista[i] && lista[i].turma === turma) return lista[i].valor;
    }
    // Sem plano daquela turma, o mais recente da estante — melhor um plano do que nenhum.
    return lista.length ? lista[0].valor : null;
  }

  /* A TURMA DO PO É A DO PLANO QUE ELE VAI REFERENCIAR (18/11/2026).
   *
   * O carimbo do «plano-de-ensino» casa por TURMA, e a turma vinha do fixture — um nome que, numa
   * escola de teste com nomes inventados, não está na estante. O 'carimboDoPlanoDaTurma' caía
   * então no primeiro plano da estante (o mais recente), e o PO apontava para um plano que podia
   * não ser o da turma. Agora a turma resolve-se ao contrário: pelo carimbo já escolhido, senão
   * pelo da estante que tenha a turma preferida, senão o mais recente — e o carimbo sai sempre
   * dessa mesma entrada, pelo que os dois nunca divergem. */
  function turmaDoPlano(preferida) {
    var lista = estanteDePlanos();
    var carimbo = (typeof RESPOSTAS !== 'undefined' && RESPOSTAS.get)
      ? RESPOSTAS.get('plano-de-ensino') : null;
    for (var i = 0; i < lista.length; i++) {
      if (carimbo && lista[i].valor === carimbo && lista[i].turma) return lista[i].turma;
    }
    for (var j = 0; j < lista.length; j++) {
      if (lista[j].turma === preferida) return preferida;
    }
    return lista.length && lista[0].turma ? lista[0].turma : preferida;
  }

  function preencherPo(registro) {
    if (!registro) return;
    if (typeof MAPA === 'undefined' || !MAPA) {
      dizer('O formulário ainda não abriu. Aguarde um instante.');
      return;
    }
    RESPOSTAS.clear();
    NOTAS.clear();
    SUGERIDAS.clear();
    Object.keys(registro.respostas || {}).forEach(function (k) {
      if (semeadoPeloSistema(k)) return;
      RESPOSTAS.set(k, registro.respostas[k]);
    });
    Object.keys(registro.notas || {}).forEach(function (k) { NOTAS.set(k, registro.notas[k]); });
    /* OS SUJEITOS NÃO SE PREENCHEM (19/11/2026) — e a linha que aqui estava fabricava três alunas.
     *
     * «Eu criei o plano de observação e tem um erro. […] a aluna B […] está dizendo que ela está
     * sem turma e sem linha de base. […] Como é que você pode dizer que ela é uma aluna vinculada?»
     *
     * O que aconteceu: o preenchedor escrevia 'sujeitos' a partir do FIXTURE — «Aluna A», «Aluna
     * B» e «Aluna C», nomes de uma escola de teste que não existem na 'breu' —, e o PO gravou-os.
     * O 'sujeitos' é o campo que o SISTEMA semeia do elenco da turma (turma → linha de base →
     * alunas, 'semearDaTurma'), e é ele que o 'porta.vinculos' lê para dizer «vinculada».
     * Escrito por um fixture, inventa vínculo: a Aluna B passou a ler-se «ligada a um Plano de
     * Observação» sem nunca ter estado em elenco nenhum.
     *
     * A REGRA, e é a mesma das outras que este ficheiro já respeita: o preenchedor preenche o que
     * o professor escreveria. O que o sistema semeia — o elenco — não é do professor, e
     * escrevê-lo é a única forma de o fixture entrar no dado da escola. Quem o impede é
     * 'semeadoPeloSistema', no salto da cópia das respostas: nem o 'registro.sujeitos' nem o
     * 'registro.respostas.sujeitos' do fixture chegam ao formulário. */

    // O «plano-de-ensino» só entra se a estante já chegou: é dela que sai o carimbo.
    var turma = turmaDoPlano(registro.turma);
    var carimbo = carimboDoPlanoDaTurma(turma);
    if (carimbo) {
      RESPOSTAS.set('plano-de-ensino', carimbo);
      /* A SEMENTE DO ELENCO VEM DEPOIS DA ESTANTE (19/11/2026). O 'sujeitos' já não chega do
       * fixture (ver 'semeadoPeloSistema'), e quem o escreve é a semente do formulário — que lê a
       * turma do plano referenciado. 'carregarPlanoReferenciado' é assíncrono, e semear antes de
       * ele resolver daria a lista vazia («sem linha de base»), que é o contrário do que se quer
       * provar. */
      var carregou = (typeof carregarPlanoReferenciado === 'function')
        ? carregarPlanoReferenciado() : null;
      if (typeof semearDaTurma === 'function') {
        Promise.resolve(carregou).then(function () { return semearDaTurma(); }).then(function () {
          if (typeof atualizarBarra === 'function') atualizarBarra();
          if (typeof pintarRoteiro === 'function') pintarRoteiro();
          if (typeof salvar === 'function') salvar();
        }).catch(function (erro) {
          dizer('A lista de sujeitos não veio da turma: ' + (erro && erro.message ? erro.message : erro));
        });
      }
    } else {
      dizer('Não achei nenhum plano de ensino na estante deste professor. ' +
        'Preenchi os outros campos; o nó «Plano de ensino» fica por escolher.');
    }

    // A IDENTIDADE vem da BARRA, como no preenchimento manual: «professor» e «escola» são
    // nós «deContexto», e sem esta chamada ficariam vazios depois do clear.
    if (typeof semearDoContexto === 'function') semearDoContexto();

    // A DIMENSÃO OBSERVADA nasce dos BLOCOS DA AULA que o plano marca — é «doPlano», e só se
    // resolve abrindo o nó que a pede. Carrega-se aqui para o PO nascer completo, e o valor
    // dela (as dimensões) volta a semear os itens.
    if (typeof carregarDimensoesDoPlano === 'function') {
      carregarDimensoesDoPlano().then(function () {
        if (typeof atualizarBarra === 'function') atualizarBarra();
        if (typeof pintarRoteiro === 'function') pintarRoteiro();
        var c = porId('conducao');
        if (c && !c.classList.contains('oculto') && typeof renderPergunta === 'function') {
          renderPergunta();
        }
      });
    }

    if (typeof atualizarBarra === 'function') atualizarBarra();
    if (typeof pintarRoteiro === 'function') pintarRoteiro();
    if (typeof salvar === 'function') salvar();
    var conducao = porId('conducao');
    if (conducao && !conducao.classList.contains('oculto') && typeof renderPergunta === 'function') {
      renderPergunta();
    }
    dizer('Plano de Observação preenchido com o conteúdo de teste'
      + (carimbo ? ' para a turma «' + turma + '»' : '') + '. Confira e grave manualmente.');
  }

  function poDaTurma(nome) {
    var lista = fixture.po || [];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].turma === nome) return lista[i];
    }
    return null;
  }

  function primeiraTurmaComPo() {
    var lista = fixture.po || [];
    return lista.length ? lista[0] : null;
  }

  function autoPo() {
    var lista = fixture.po || [];
    var registro = primeiraTurmaComPo();
    if (!registro) return;
    // O PO não tem seletor de turma: a turma chega pelo PLANO escolhido. Se já houver um
    // plano marcado, prefere-se o PO daquela turma.
    var carimbo = typeof RESPOSTAS !== 'undefined' ? RESPOSTAS.get('plano-de-ensino') : null;
    if (carimbo && typeof OPCOES !== 'undefined') {
      var estante = estanteDePlanos();
      for (var i = 0; i < estante.length; i++) {
        if (estante[i].valor === carimbo && poDaTurma(estante[i].turma)) {
          registro = poDaTurma(estante[i].turma);
          break;
        }
      }
    }
    preencherPo(registro);
  }

  function painelPo() {
    var corpo = document.createDocumentFragment();
    var nomes = (fixture.po || []).map(function (p) { return p.turma; });
    corpo.appendChild(seletorDeRegistros('Turma', nomes, function (i) {
      var registro = (fixture.po || [])[i];
      if (registro) preencherPo(registro);
    }));
    return corpo;
  }

  // ================= O PAINEL E A PARTIDA ===================================

  function montarPainel(corpo) {
    var estilo = document.getElementById('teste-painel-estilo');
    if (!estilo) {
      estilo = document.createElement('style');
      estilo.id = 'teste-painel-estilo';
      estilo.textContent = [
        'details.teste-painel{position:fixed;right:1rem;bottom:1rem;z-index:9999;',
        'max-width:min(24rem,calc(100vw - 2rem));background:var(--fundo);color:var(--texto);',
        'border:1px solid var(--borda);border-radius:var(--raio-1);box-shadow:var(--sombra);',
        'padding:.45rem .65rem;font-family:var(--ui);font-size:.78rem;line-height:1.35}',
        'details.teste-painel summary{cursor:pointer;font-weight:600;color:var(--marca)}',
        'details.teste-painel .teste-linha{display:flex;gap:.4rem;align-items:center;margin:.3rem 0}',
        'details.teste-painel .teste-rotulo{min-width:5.6rem;color:var(--texto-suave)}',
        'details.teste-painel select{flex:1;min-width:0;font:inherit;padding:.15rem .25rem;',
        'border:1px solid var(--borda-campo);border-radius:var(--raio-1);background:var(--campo-fundo);color:var(--texto)}',
        'details.teste-painel .teste-status{margin:.35rem 0 0;color:var(--texto-suave)}',
        'details.teste-painel .teste-nota{margin:.15rem 0 .35rem;color:var(--texto-suave)}',
      ].join('');
      document.head.appendChild(estilo);
    }

    painel = document.createElement('details');
    painel.className = 'teste-painel';
    var resumo = texto('summary', null, 'Teste ' + teste + ' · dados');
    painel.appendChild(resumo);
    painel.appendChild(texto('p', 'teste-nota', 'Só preenche campos. Não envia nada.'));
    painel.appendChild(corpo);
    status = texto('p', 'teste-status', '');
    painel.appendChild(status);
    document.body.appendChild(painel);
  }

  function iniciar(dados) {
    fixture = dados && dados.fixture;
    if (!fixture) return;
    var tela = document.body.getAttribute('data-tela') || '';
    /* SÓ A PORTA (19/11/2026). O ramo dos Bastidores existiu aqui, com painel, preenchimento
     * automático e três guardas contra escrever por cima de quem trabalha — e o problema de fundo
     * era ele próprio: dois donos do mesmo teclado. Saiu inteiro, e não ficou a chave que o poderia
     * reacender. */
    if (tela !== 'porta') return;

    // A PORTA carrega o mapa em paralelo; o preenchimento espera por ele.
    function quandoMapa(pronto) {
      if (typeof MAPA !== 'undefined' && MAPA) return pronto();
      setTimeout(function () { quandoMapa(pronto); }, 120);
    }

    quandoMapa(function () {
      if (FONTE === 'anamnese') {
        montarPainel(painelAnamnese());
        autoAnamnese();
      } else if (FONTE === 'plano') {
        // O seletor de turma nasce em renderTurmaDoCabecalho, depois das listas.
        function quandoTurma(pronto) {
          if (porId('ctx-turma')) return pronto();
          setTimeout(function () { quandoTurma(pronto); }, 120);
        }
        quandoTurma(function () {
          montarPainel(painelPlano());
          autoPlano();
        });
      } else if (FONTE === 'po') {
        // O PO precisa da ESTANTE DE PLANOS (o carimbo do plano da turma) antes de
        // preencher: é o «opcoesDe» do nó «Plano de ensino», e chega de forma assíncrona.
        function quandoEstante(pronto) {
          var pronta = typeof OPCOES !== 'undefined' && estanteCarregada();
          if (pronta) return pronto();
          setTimeout(function () { quandoEstante(pronto); }, 120);
        }
        quandoEstante(function () {
          montarPainel(painelPo());
          autoPo();
        });
      }
    });

    document.addEventListener('change', function (e) {
      if (!e.target) return;
      window.__testeUltimoChange = { id: e.target.id, valor: e.target.value, fonte: FONTE };
      if (FONTE === 'anamnese' && e.target.id === 'ctx-aluna') {
        var registro = anamneseDaAluna(e.target.value);
        if (registro) preencherAnamnese(registro, false);
      }
      if (FONTE === 'plano' && e.target.id === 'ctx-turma') {
        var plano = planoDaTurma(e.target.value);
        if (plano) preencherPlano(plano);
      }
    });
    // Gancho de diagnóstico: as provas e o console podem chamar o preenchimento sem
    // depender do evento. Não é usado pela página.
    window.__preencherTeste = { anamnese: preencherAnamnese, plano: preencherPlano, po: preencherPo };
  }

  fetch('/api/teste').then(function (r) {
    return r.ok ? r.json() : null;
  }).then(function (d) {
    if (!d || !d.ok) return;
    iniciar(d);
  }).catch(function () { /* sem fixture, a página segue como sempre */ });
})();`;

module.exports = { SCRIPT };
