'use strict';

/**
 * teste-cliente.js — o PREENCHEDOR das escolas de teste, servido como script.
 *
 * Ele é um só, e vale nas duas pontas:
 *   · Produção (`data-tela="bastidores"`): preenche os formulários de Turma, Rubrica,
 *     Vocabulário e Aluna. O de Curadoria fica no painel, para não ligar aluna/turma
 *     sem alguém pedir.
 *   · Porta (`data-tela="porta"`): na anamnese, preenche a aluna escolhida; no plano,
 *     a turma escolhida. Trocar a aluna ou a turma no contexto repreenche.
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

  /* OS CAMPOS SÃO OUVIDOS ANTES DE TUDO (19/11/2026) — ver a nota grande de «O PREENCHEDOR NÃO
   * ESCREVE POR CIMA», mais abaixo. Um ouvinte registado só no fim do arranque deixaria passar
   * tudo o que fosse escrito enquanto «/api/teste» responde — e é justamente nessa janela que a
   * pessoa já está a trabalhar. */
  ouvirOsCampos();

  function texto(tag, classe, conteudo) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (conteudo != null) el.textContent = conteudo;
    return el;
  }

  function porId(id) { return document.getElementById(id); }

  /* ============================ O PREENCHEDOR NÃO ESCREVE POR CIMA (19/11/2026)
   *
   * O DEFEITO, na letra dela: «o teste que eu tenho aqui vinculado, que preenche os formulários, ele
   * está atrapalhando o preenchimento da sala. Ele não deixa eu fazer as edições, os nomes que eu
   * quero, os valores que eu quero. […] Ele não deixa eu colocar o nome da sala que eu quiser.»
   *
   * E era pior do que atrapalhar: o fixture da escola de teste traz a sala «Balé Nível 1 — Teste 3»,
   * que JÁ EXISTE no KV. O preenchedor escrevia esse nome no campo, ela corrigia-o, e o
   * «autoProducao()» voltava a escrevê-lo no carregamento seguinte — e o envio saía com o nome
   * antigo. Como o formulário estava em modo de CRIAR, o servidor respondia, com razão, «já existe
   * uma turma com este nome». O preenchedor estava a fabricar o erro que ela estava a tentar
   * corrigir.
   *
   * As três guardas, e cada uma fecha um caminho:
   *
   *   1. CAMPO SUJO NÃO SE ESCREVE. Qualquer «input»/«change» dentro do formulário marca o campo
   *      como tocado, e o preenchedor salta-o. É o que impede a correcção dela de ser desfeita;
   *   2. EM EDIÇÃO OU DERIVAÇÃO, NÃO SE PREENCHE. Já valia para a turma; passa a valer para os
   *      três (turma, régua, aluna), e não só para o «modoEditando()» da memória;
   *   3. O QUE JÁ EXISTE NÃO SE PROPÕE CRIAR. Uma sala do fixture com o nome de uma sala da
   *      escola não se preenche: criar daria 409, e corrigir é no «Editar» dela.
   *
   * O QUE O PREENCHEDOR CONTINUA A FAZER: preencher. O fixture existe para poupar digitação; o que
   * ele não pode é disputar o teclado com quem está a trabalhar. */
  var TOCADOS = {};
  var OUVINDO = false;
  function marcarTocado(id) {
    var el = porId(id);
    if (!el) return;
    TOCADOS[id] = true;
  }
  function ouvirOsCampos() {
    if (OUVINDO) return;
    OUVINDO = true;
    document.addEventListener('input', function (e) {
      var alvo = e.target;
      if (alvo && alvo.id) TOCADOS[alvo.id] = true;
    }, true);
    document.addEventListener('change', function (e) {
      var alvo = e.target;
      if (alvo && alvo.id) TOCADOS[alvo.id] = true;
    }, true);
  }
  function emEdicao() {
    try {
      if (typeof modoEditando === 'function' && modoEditando()) return true;
    } catch (err) { /* sem a função, decide-se pelo DOM, abaixo */ }
    var pares = [['tderivar', 'tturma'], ['tmodo', 'tturma'], ['prof-modo', 'pprof'], ['aluna-modo', 'aaluna']];
    for (var i = 0; i < pares.length; i++) {
      var el = porId(pares[i][0]);
      if (!el) continue;
      var v = String(el.value || '').trim();
      if (!v) continue;
      if (pares[i][0] === 'tderivar') return true;
      if (pares[i][0] === 'tmodo' && v !== 'criar') return true;
      if (pares[i][0] === 'prof-modo' && v === 'editar') return true;
      if (pares[i][0] === 'aluna-modo' && v) return true;
    }
    return false;
  }
  function preencher(id, valor) {
    var el = porId(id);
    if (!el || valor == null) return;
    if (TOCADOS[id]) return;          // ela já escreveu aqui: o valor é dela
    el.value = String(valor);
  }

  function escolher(id, valor) {
    var el = porId(id);
    if (!el || valor == null) return false;
    if (TOCADOS[id]) return true;     // a escolha dela já está feita: não se troca
    var alvo = String(valor);
    for (var i = 0; i < el.options.length; i++) {
      if (el.options[i].value === alvo) { el.value = alvo; return true; }
    }
    return false;
  }

  function limparFichas(id) {
    var el = porId(id);
    if (!el) return;
    var fichas = el.querySelectorAll('.escolhido');
    for (var i = 0; i < fichas.length; i++) {
      if (fichas[i].parentElement) fichas[i].parentElement.removeChild(fichas[i]);
    }
    if (typeof mostrarVazio === 'function') mostrarVazio(el);
  }

  function adicionarFichas(id, valores) {
    var el = porId(id);
    if (!el || typeof adicionarFicha !== 'function') return;
    var lista = Array.isArray(valores) ? valores : (valores == null ? [] : [valores]);
    for (var i = 0; i < lista.length; i++) {
      var v = String(lista[i] == null ? '' : lista[i]).trim();
      if (v) adicionarFicha(el, v);
    }
  }

  function limparStatus() {
    if (status) status.textContent = '';
  }

  function dizer(mensagem) {
    if (status) status.textContent = mensagem;
  }

  // ================= PRODUÇÃO ================================================

  function preencherTurma(t) {
    if (!t) return;
    /* A SALA QUE JÁ EXISTE NÃO SE PROPÕE CRIAR (19/11/2026) — ver a nota grande em «preencher».
     * «TURMAS» é a lista que a página já tem (as vigentes), e é a mesma que o servidor confere no
     * «POST /api/bastidores/turma». Preencher o nome de uma delas num formulário de CRIAR era
     * fabricar um 409: corrigir essa sala é no «Editar» dela, e é lá que o preenchimento não entra
     * (a guarda 2). */
    try {
      var vigentes = (typeof TURMAS !== 'undefined' && TURMAS) || [];
      for (var i = 0; i < vigentes.length; i++) {
        if (vigentes[i] && String(vigentes[i].nome || '') === String(t.nome || '')) {
          dizer('A sala «' + t.nome + '» já existe — abra-a em «Editar» para a corrigir.');
          return;
        }
      }
    } catch (err) { /* sem a lista, segue: o servidor recusa e diz porquê */ }
    preencher('tnome', t.nome || '');
    // O «programa» e as «notas» já não têm campo no formulário da turma (03/11/2026): o
    // enquadramento passou para a curadoria e a nota saiu do cadastro. As duas linhas ficavam a
    // preencher um id que já não existe — a função preencher não dá erro, mas também não faz
    // nada, e uma linha que não faz nada num preenchedor de teste lê-se como «o campo existe».
    preencher('tduracao', t.duracaoMin == null ? '' : t.duracaoMin);
    preencher('tinicio', t.periodoInicio || '');
    preencher('tfim', t.periodoFim || '');

    limparFichas('esc-niveis');
    var niveis = Array.isArray(t.niveis) && t.niveis.length
      ? t.niveis
      : String(t.nivelReferencia || '').split(',');
    adicionarFichas('esc-niveis', niveis.map(function (n) { return String(n).trim(); }).filter(Boolean));

    var dias = Array.isArray(t.dias) ? t.dias : [];
    var caixas = document.querySelectorAll('input[name="dia"]');
    for (var i = 0; i < caixas.length; i++) {
      caixas[i].checked = dias.indexOf(caixas[i].value) !== -1;
    }
    var horas = document.querySelectorAll('.hora-do-dia');
    for (var j = 0; j < horas.length; j++) {
      var d = horas[j].getAttribute('data-dia');
      horas[j].value = (t.horarios && t.horarios[d]) ? t.horarios[d] : '';
    }
    if (typeof sincronizarHoras === 'function') sincronizarHoras();
    for (var k = 0; k < horas.length; k++) {
      var dia = horas[k].getAttribute('data-dia');
      if (!horas[k].disabled && t.horarios && t.horarios[dia]) horas[k].value = t.horarios[dia];
    }
    if (typeof gravarEstado === 'function') gravarEstado();
    if (typeof aplicarTravas === 'function') aplicarTravas();
    dizer('Turma preenchida: ' + (t.nome || '(sem nome)') + '. Confira e envie manualmente.');
  }

  /* A RÉGUA DEIXOU DE SER UMA LISTA DA ESCOLA (19/11/2026) — «a régua é do professor», e o campo
   * «#rubr-nome» passou a viver no passo 2 do cadastro DELE. O preenchedor não tem o que preencher
   * aqui: escrever neste campo seria escrever a régua de uma pessoa que o fixture não conhece, e
   * «pintarEditorDaRubrica» apagaria os níveis que ela tivesse acabado de compor. A rubrica do
   * fixture fica no painel como memória do que o teste já usou — e diz isso, em vez de fingir que
   * preencheu. */
  function preencherRubrica(r) {
    if (!r) return;
    dizer('A rubrica «' + (r.nome || '(sem nome)') + '» já não se preenche aqui: a régua é do '
      + 'professor, no passo «Rubrica» do cadastro dele.');
  }

  /* O TERMO DO FIXTURE — E, QUANDO ELE JÁ EXISTE NO CATÁLOGO, O VERBETE INTEIRO (02/11/2026).
   *
   * AQUI HAVIA UM DEFEITO MEDIDO: o preenchimento chamava "modoExercicio(true)", uma função que
   * deixou de existir quando o «+» virou o passo 1 (02/11/2026). O "typeof" dava "undefined", a
   * função saía pela porta de emergência — e **nenhum termo chegava ao formulário**. A prova
   * "provar-teste" falhava com «'' !== 'Jeté'», e era isso que ela media.
   *
   * O CAMINHO NOVO SÃO DOIS, e a diferença importa:
   *
   *   1. **O termo já existe no vocabulário** — escolhe-se no passo 2 ("vbnome"), como faria uma
   *      pessoa. O "change" é disparado para a página fazer o que faz sempre: carregar o
   *      rascunho, sincronizar e congelar o passo 1 e sugerir o método. Escrever o nome no passo
   *      1 criaria um SEGUNDO termo com o mesmo nome, e o servidor recusá-lo-ia com 409.
   *   2. **O termo não está na lista** (ou a lista ainda não chegou) — escreve-se no passo 1, que
   *      é o cadastro do exercício novo. É o caminho antigo, e continua a ser o certo para um
   *      termo que ainda não existe.
   *
   * E O VERBETE DO FIXTURE ENTRA NO EDITOR, não no servidor: a música (passo 3) e as células do
   * passo 6 são postas no estado da página, que é o mesmo sítio onde o professor as escreveria.
   * Nada é enviado — a regra da casa continua: o preenchedor enche campos e não chama rota que
   * escreva.
   *
   * ATENÇÃO AO EDITAR ESTE FICHEIRO: tudo o que está entre String.raw e o fecho é um template
   * literal. Uma crase aqui dentro fecha-o, e o erro que se vê — "Unexpected identifier" a
   * apontar uma palavra portuguesa — não se parece nada com a causa. */
  function verbeteDoTermo(termo) {
    var lista = fixture.verbete || [];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i] && lista[i].termo === termo) return lista[i];
    }
    return null;
  }

  /* A MÚSICA E A DECOMPOSIÇÃO DO FIXTURE (02/11/2026).
   *
   * A ORDEM É A DA PÁGINA, e não é arbitrária: os tempos e o compasso primeiro, porque mudá-los
   * recarrega o rascunho e ZERA as células (outra música é outra decomposição). Só depois de a
   * música estar posta é que as células entram — se entrassem antes, o "input" dos tempos
   * apagava-as, e o fixture parecia vazio sem ninguém saber porquê. */
  function preencherVerbetes(registro) {
    if (!registro || !registro.musica) return false;
    var partes = String(registro.musica).split('|');
    var tempos = porId('vbtempos');
    var compasso = porId('vbcompasso');
    if (!tempos || !compasso) return false;
    if (typeof irParaPasso === 'function') irParaPasso(3);
    tempos.value = partes[0];
    compasso.value = partes[1];
    tempos.dispatchEvent(new Event('input'));
    compasso.dispatchEvent(new Event('change'));
    if (typeof CELULAS === 'undefined' || typeof pintarTabela !== 'function') {
      dizer('A página não expõe a decomposição — a música ficou preenchida e as células não.');
      return false;
    }
    CELULAS = JSON.parse(JSON.stringify(registro.celulas || {}));
    if (typeof MUSICA_EM_FOCO !== 'undefined') MUSICA_EM_FOCO = registro.musica;
    if (typeof pintarTabela === 'function') pintarTabela();
    if (typeof pintarTira === 'function') pintarTira();
    if (typeof pintarPassos === 'function') pintarPassos();
    return true;
  }

  function preencherTermo(v) {
    if (!v) return;
    var alvo = porId('vbnome');
    if (alvo && escolher('vbnome', v.termo || '')) {
      alvo.dispatchEvent(new Event('change'));
      var registro = verbeteDoTermo(v.termo);
      var comVerbeta = registro ? preencherVerbetes(registro) : false;
      if (typeof gravarEstado === 'function') gravarEstado();
      dizer('Exercício escolhido: ' + (v.termo || '(sem nome)')
        + (comVerbeta ? ' — com a música ' + registro.musica + ' e a decomposição do fixture' : '')
        + '. Confira e envie manualmente.');
      return;
    }
    if (typeof irParaPasso === 'function') irParaPasso(1);
    preencher('vnnome', v.termo || '');
    escolher('vncategoria', v.categoria || '');
    escolher('vntradicao', v.tradicao || '');
    if (typeof gravarEstado === 'function') gravarEstado();
    dizer('Exercício preenchido: ' + (v.termo || '(sem nome)') + '. Confira e envie manualmente.');
  }

  function preencherAluna(a) {
    if (!a) return;
    preencher('anome', a);
    dizer('Aluna preenchida: ' + a + '. Confira e envie manualmente.');
  }

  function preencherCuradoria(c) {
    if (!c) return;
    if (c.professor) escolher('cuprofessor', c.professor);
    escolher('cumodalidade', c.modalidade || '');
    escolher('cutradicao', c.tradicao || '');
    var achouTurma = c.turma ? escolher('cuturma', c.turma) : true;
    if (typeof refiltrarAlunas === 'function') refiltrarAlunas();
    limparFichas('esc-alunas');
    adicionarFichas('esc-alunas', c.alunas || []);
    // O REPERTÓRIO SAIU DA CURADORIA (19/10/2026): os passos da turma declaram-se na TURMA,
    // no passo «Associar», e é de lá que o plano os lê. O preenchedor não procura um campo
    // que já não existe — e o fixture pode continuar a trazê-lo sem que nada aconteça.
    dizer(achouTurma
      ? 'Curadoria preenchida. Confira e envie manualmente.'
      : 'Curadoria preenchida, mas a turma «' + c.turma + '» ainda não existe na Produção.');
  }

  function autoProducao() {
    var p = fixture.producao || {};
    if (p.turmas && p.turmas[0]) preencherTurma(p.turmas[0]);
    if (p.rubricas && p.rubricas[0]) preencherRubrica(p.rubricas[0]);
    if (p.vocabulario && p.vocabulario[0]) preencherTermo(p.vocabulario[0]);
    if (p.alunas && p.alunas[0]) preencherAluna(p.alunas[0]);
  }

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

  function painelProducao() {
    var p = fixture.producao || {};
    var corpo = document.createDocumentFragment();
    if (p.turmas && p.turmas.length) {
      corpo.appendChild(seletorDeRegistros('Turma', p.turmas.map(function (t) { return t.nome || 'turma'; }),
        function (i) { preencherTurma(p.turmas[i]); }));
    }
    if (p.rubricas && p.rubricas.length) {
      corpo.appendChild(seletorDeRegistros('Rubrica', p.rubricas.map(function (r) { return r.nome || 'rubrica'; }),
        function (i) { preencherRubrica(p.rubricas[i]); }));
    }
    if (p.vocabulario && p.vocabulario.length) {
      corpo.appendChild(seletorDeRegistros('Termo', p.vocabulario.map(function (v) { return v.termo || 'termo'; }),
        function (i) { preencherTermo(p.vocabulario[i]); }));
    }
    if (p.alunas && p.alunas.length) {
      corpo.appendChild(seletorDeRegistros('Aluna', p.alunas, function (i) { preencherAluna(p.alunas[i]); }));
    }
    if (p.curadorias && p.curadorias.length) {
      corpo.appendChild(seletorDeRegistros('Curadoria', p.curadorias.map(function (c, i) {
        return (c.turma || 'curadoria') + ' · ' + (c.alunas || []).join(', ');
      }), function (i) { preencherCuradoria(p.curadorias[i]); }));
    }
    return corpo;
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
    Object.keys(registro.respostas || {}).forEach(function (k) { RESPOSTAS.set(k, registro.respostas[k]); });
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
    Object.keys(registro.respostas || {}).forEach(function (k) { RESPOSTAS.set(k, registro.respostas[k]); });
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
    Object.keys(registro.respostas || {}).forEach(function (k) { RESPOSTAS.set(k, registro.respostas[k]); });
    Object.keys(registro.notas || {}).forEach(function (k) { NOTAS.set(k, registro.notas[k]); });
    if (registro.sujeitos) RESPOSTAS.set('sujeitos', registro.sujeitos.slice());

    // O «plano-de-ensino» só entra se a estante já chegou: é dela que sai o carimbo.
    var turma = turmaDoPlano(registro.turma);
    var carimbo = carimboDoPlanoDaTurma(turma);
    if (carimbo) {
      RESPOSTAS.set('plano-de-ensino', carimbo);
      if (typeof carregarPlanoReferenciado === 'function') carregarPlanoReferenciado();
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
    if (tela === 'bastidores') {
      /* OUVIR OS CAMPOS ANTES DE PREENCHER (19/11/2026): a partir daqui, o que ela escrever fica
       * marcado, e nenhum preenchimento posterior lhe toca. */
      ouvirOsCampos();
      montarPainel(painelProducao());
      // EM EDIÇÃO, O PREENCHIMENTO AUTOMÁTICO NÃO ENTRA: ajustarTurma é quem põe a
      // turma clicada nos três formulários, e o fixture não pode passar por cima dela.
      // O painel continua disponível para quem quiser carregar outro registro à mão.
      if (!emEdicao()) autoProducao();
      return;
    }
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
    window.__preencherTeste = { anamnese: preencherAnamnese, plano: preencherPlano, po: preencherPo,
      producao: { turma: preencherTurma, rubrica: preencherRubrica, termo: preencherTermo,
        aluna: preencherAluna, curadoria: preencherCuradoria } };
  }

  fetch('/api/teste').then(function (r) {
    return r.ok ? r.json() : null;
  }).then(function (d) {
    if (!d || !d.ok) return;
    iniciar(d);
  }).catch(function () { /* sem fixture, a página segue como sempre */ });
})();`;

module.exports = { SCRIPT };
