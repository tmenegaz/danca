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

  function texto(tag, classe, conteudo) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (conteudo != null) el.textContent = conteudo;
    return el;
  }

  function porId(id) { return document.getElementById(id); }

  function preencher(id, valor) {
    var el = porId(id);
    if (el && valor != null) el.value = String(valor);
  }

  function escolher(id, valor) {
    var el = porId(id);
    if (!el || valor == null) return false;
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
    preencher('tnome', t.nome || '');
    if (typeof selecionarPrograma === 'function') selecionarPrograma(t.programaReferencia || '');
    preencher('tdescricao', t.descricao || '');
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

  function preencherRubrica(r) {
    if (!r) return;
    preencher('rubr-nome', r.nome || '');
    if (typeof pintarEditorDaRubrica === 'function') pintarEditorDaRubrica(r.niveis || []);
    if (typeof gravarEstado === 'function') gravarEstado();
    dizer('Rubrica preenchida: ' + (r.nome || '(sem nome)') + '. Confira e envie manualmente.');
  }

  function preencherTermo(v) {
    if (!v) return;
    preencher('vtermo', v.termo || '');
    escolher('vcategoria', v.categoria || '');
    escolher('vtradicao', v.tradicao || '');
    if (typeof gravarEstado === 'function') gravarEstado();
    dizer('Termo preenchido: ' + (v.termo || '(sem nome)') + '. Confira e envie manualmente.');
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

  function preencherAnamnese(registro) {
    if (!registro) return;
    var sel = porId('ctx-aluna');
    if (sel) garantirOpcao(sel, registro.aluna);
    RESPOSTAS.clear();
    NOTAS.clear();
    SUGERIDAS.clear();
    Object.keys(registro.respostas || {}).forEach(function (k) { RESPOSTAS.set(k, registro.respostas[k]); });
    Object.keys(registro.notas || {}).forEach(function (k) { NOTAS.set(k, registro.notas[k]); });
    if (typeof atualizarBarra === 'function') atualizarBarra();
    if (typeof pintarRoteiro === 'function') pintarRoteiro();
    if (typeof marcarContextoFaltando === 'function') marcarContextoFaltando();
    if (typeof atualizarComecar === 'function') atualizarComecar();
    if (typeof salvar === 'function') salvar();
    var conducao = porId('conducao');
    if (conducao && !conducao.classList.contains('oculto') && typeof renderPergunta === 'function') {
      renderPergunta();
    }
    dizer('Anamnese preenchida: ' + registro.aluna + '. Confira e grave manualmente.');
  }

  function anamneseDaAluna(aluna) {
    var lista = fixture.anamnese || [];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].aluna === aluna) return lista[i];
    }
    return null;
  }

  function autoAnamnese() {
    var sel = porId('ctx-aluna');
    var escolhida = sel ? sel.value : '';
    var registro = anamneseDaAluna(escolhida) || (fixture.anamnese || [])[0];
    if (registro) preencherAnamnese(registro);
  }

  function painelAnamnese() {
    var corpo = document.createDocumentFragment();
    var nomes = (fixture.anamnese || []).map(function (a) { return a.aluna; });
    corpo.appendChild(seletorDeRegistros('Aluna', nomes, function (i) {
      var registro = (fixture.anamnese || [])[i];
      if (registro) preencherAnamnese(registro);
    }));
    return corpo;
  }

  // ================= PORTA — PLANO DE ENSINO ================================

  function turmaExisteNoPlano(nome) {
    if (typeof TURMAS_DA_ESCOLA === 'undefined' || TURMAS_DA_ESCOLA === null) return false;
    for (var i = 0; i < TURMAS_DA_ESCOLA.length; i++) {
      if (TURMAS_DA_ESCOLA[i] && TURMAS_DA_ESCOLA[i].nome === nome) return true;
    }
    return false;
  }

  function preencherPlano(registro) {
    if (!registro) return;
    var sel = porId('ctx-turma');
    if (!sel) { dizer('O seletor de turma ainda não abriu. Aguarde um instante.'); return; }
    if (typeof TURMAS_DA_ESCOLA !== 'undefined' && TURMAS_DA_ESCOLA !== null && !turmaExisteNoPlano(registro.turma)) {
      dizer('Crie a turma «' + registro.turma + '» na Produção antes de preencher o plano.');
      return;
    }
    garantirOpcao(sel, registro.turma);
    RESPOSTAS.clear();
    NOTAS.clear();
    SUGERIDAS.clear();
    RESPOSTAS.set('contexto-turma', registro.turma);
    Object.keys(registro.respostas || {}).forEach(function (k) { RESPOSTAS.set(k, registro.respostas[k]); });
    Object.keys(registro.notas || {}).forEach(function (k) { NOTAS.set(k, registro.notas[k]); });
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
    dizer('Plano preenchido para ' + registro.turma + '. Confira e grave manualmente.');
  }

  function planoDaTurma(nome) {
    var lista = fixture.plano || [];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].turma === nome) return lista[i];
    }
    return null;
  }

  function autoPlano() {
    var sel = porId('ctx-turma');
    var escolhida = sel ? sel.value : '';
    var registro = planoDaTurma(escolhida);
    if (!registro) {
      var lista = fixture.plano || [];
      for (var i = 0; i < lista.length; i++) {
        if (turmaExisteNoPlano(lista[i].turma)) { registro = lista[i]; break; }
      }
    }
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
    var carimbo = carimboDoPlanoDaTurma(registro.turma);
    if (carimbo) {
      RESPOSTAS.set('plano-de-ensino', carimbo);
      if (typeof carregarPlanoReferenciado === 'function') carregarPlanoReferenciado();
    } else {
      dizer('Não achei o plano de ensino de «' + registro.turma + '» na estante. ' +
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
    dizer('Plano de Observação preenchido para ' + registro.turma + '. Confira e grave manualmente.');
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
      montarPainel(painelProducao());
      // EM EDIÇÃO, O PREENCHIMENTO AUTOMÁTICO NÃO ENTRA: ajustarTurma é quem põe a
      // turma clicada nos três formulários, e o fixture não pode passar por cima dela.
      // O painel continua disponível para quem quiser carregar outro registro à mão.
      var editando = false;
      try { editando = typeof modoEditando === 'function' && !!modoEditando(); } catch (err) {}
      if (!editando) autoProducao();
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
        if (registro) preencherAnamnese(registro);
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
