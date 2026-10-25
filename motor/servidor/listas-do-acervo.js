'use strict';

/**
 * listas-do-acervo.js — AS TRÊS LISTAS DA ÁREA DO PROFESSOR, servidas pela ponte (24/10/2026).
 *
 * PORQUE NÃO SÃO MONTADAS NO DEPLOY. Elas listavam **turmas** — uma linha por turma, e as três
 * páginas iguais. Mas o que a listagem tem de dizer é «a anamnese de quem, feita por quem,
 * quando», e isso não está no disco: está no ACERVO, no KV da escola, e muda a cada ato
 * registado. Uma página montada no deploy mostrava o acervo do dia do deploy, e não o de hoje.
 *
 * A PONTE JÁ SERVE A PORTA e os Bastidores por esta razão, e é o mesmo lugar: quem tem o KV e o
 * índice de envelopes é ela. O desenho da lista é o MESMO dos outros cinco — `lista-html.js` —,
 * porque a listagem é o padrão de todas; o que muda é de onde vêm os dados.
 *
 * O QUE ESTA LISTA **NÃO** INVENTA. Sem `gerado_em` no resumo do índice, a data aparece como
 * «—»; sem turma na curadoria, a caixa diz «sem turma». Uma listagem que preenche as lacunas com
 * uma suposição é pior do que uma que as mostra: a suposição parece um facto.
 */

const listas = require('../nucleo/lista-html.js');
const porta = require('../nucleo/porta.js');
const nav = require('../nucleo/nav.js');
const { criarArmazenamento } = require('./cloudflare.js');

const esc = (t) => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** `2026-10-20T14:32` → `20/10/2026`. A data que se lê numa listagem é o DIA. */
function dia(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}

/** O nome de quem fez — o do slug quando não há o nome escrito no formulário. */
function nomeDoProfessor(registo) {
  const nome = String(registo.professorNome || '').trim();
  if (nome) return nome;
  const slug = String(registo.professor || '').trim();
  if (!slug) return '';
  return slug.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

/** A turma de cada aluna, lida das curadorias vigentes. `Map<apelido, nomeDaTurma>`. */
function turmaDaAluna(curadorias) {
  const mapa = new Map();
  const vigentes = (Array.isArray(curadorias) ? curadorias : []).filter((c) => c && !c.substituidaPor);
  for (const c of vigentes) {
    const nomes = (Array.isArray(c.turmas) ? c.turmas : [c.turma]).map((x) => String(x || '').trim()).filter(Boolean);
    for (const nome of nomes) {
      for (const a of (Array.isArray(c.alunas) ? c.alunas : [])) {
        if (!mapa.has(a)) mapa.set(a, nome);
      }
    }
  }
  return mapa;
}

/**
 * As três famílias, cada uma com o seu título, o seu vazio e a sua caixa de «quando».
 *
 * A ORDEM DAS CAIXAS É A MESMA EM TODAS — de quem · quem fez · quando —, e é isso que faz a
 * identidade da listagem. O que muda é o RÓTULO e o que vai dentro do painel.
 */
const FAMILIAS = {
  anamnese: {
    titulo: 'Anamnese do aluno',
    subtitulo: 'A escuta inicial de cada aluna, antes do primeiro registro',
    padrao: /^anamnese-.*\.json$/,
    vazio: 'Ainda não há anamnese nesta escola. Ela nasce na Área do Professor, com o professor '
      + 'que a faz e a aluna que a responde.',
    singular: 'anamnese', plural: 'anamneses',
    // A PORTA DE CADA FONTE — é lá que o formulário vive. Ver `acaoDaPagina` e `acoesDaLinha`.
    porta: '/anamnese/',
    acaoDeCriar: 'Nova anamnese',
  },
  'plano-de-ensino': {
    titulo: 'Plano de ensino',
    subtitulo: 'O plano da turma, elicitado com o professor',
    padrao: /^plano-.*\.json$/,
    vazio: 'Ainda não há plano de ensino nesta escola. Ele nasce quando o professor preenche o '
      + 'plano de uma turma curada.',
    singular: 'plano', plural: 'planos',
    porta: '/plano-ensino/',
    acaoDeCriar: 'Novo plano de ensino',
    fonte: 'plano',
  },
  'plano-de-observacao': {
    titulo: 'Plano de Observação',
    subtitulo: 'O que se vai observar na turma, e com que régua',
    padrao: /^po-.*\.json$/,
    vazio: 'Ainda não há Plano de Observação nesta escola. Ele nasce quando o professor decide o '
      + 'que vai observar numa turma.',
    singular: 'plano', plural: 'planos',
    porta: '/plano-observacao/',
    acaoDeCriar: 'Novo Plano de Observação',
    fonte: 'po',
  },
};

/*
 * A PORTA DO FORMULÁRIO, A PARTIR DA LISTA (25/10/2026).
 *
 * O DEFEITO QUE ISTO CORRIGE, e que foi meu. Quando as três listas passaram a ser servidas pelo
 * acervo (24/10/2026), cada linha ficou com `acoes: []` — e ninguém notou, porque uma lista que
 * se lê bem parece uma lista que funciona. Só que as listas anteriores (montadas no deploy) eram
 * `uma linha por TURMA`, e a linha levava `?professor=<slug>&ciclo=NN` para a porta: era por ali
 * que se abria o formulário, se editava e se derivava. Ao trocar a linha de turma por linha de
 * REGISTO, o destino do formulário desapareceu com ela. Resultado medido em produção: as três
 * páginas da Área do Professor com **zero** `class="acao"`, e a única coisa que se podia fazer
 * era ler. A Área do Professor ficou sem porta.
 *
 * O QUE OS PARÂMETROS SÃO — lidos de `porta/index.html`, não inventados:
 *   · `professor` (slug) e `ciclo` — semeiam a barra de contexto;
 *   · `aluna` — semeia o sujeito da anamnese (a lista da porta filtra-o pela curadoria, e um
 *     apelido fora dela é simplesmente ignorado: degrada, não mente);
 *   · `fonte=plano|po` — diz à MESMA página qual dos dois formulários abrir;
 *   · `editar=<carimbo>` — abre a edição do registo. **É lido só em `fonte === 'plano'`**
 *     (`porta/index.html`, «O ATALHO DE EDIÇÃO»), e por isso só o plano de ensino o recebe.
 */
function consulta(params) {
  const q = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params || {})) {
    const v = String(valor == null ? '' : valor).trim();
    if (v) q.set(chave, v);
  }
  const s = q.toString();
  return s ? '?' + s : '';
}

/** O botão do topo da página — a acção de CRIAR, que é a que faltava por inteiro. */
function acaoDaPagina(chave) {
  const f = FAMILIAS[chave];
  return { rotulo: f.acaoDeCriar, href: f.porta + consulta({ fonte: f.fonte }) };
}

/**
 * As acções de UMA linha. O que se promete é o que a porta cumpre:
 *   · plano de ensino ainda livre (`solta`) — a edição abre no registo;
 *   · plano de ensino já vinculado — o servidor recusa a escrita, e o atalho de edição abriria
 *     uma tela que avisa em vez de editar. Leva-se ao formulário, com o contexto posto;
 *   · anamnese e PO — não há atalho por endereço para o registo, e um botão «Editar» que não
 *     edita é pior do que nenhum. Leva-se ao formulário com o contexto e o sujeito.
 */
function acoesDaLinha(chave, registo, estado) {
  const f = FAMILIAS[chave];
  if (chave === 'plano-de-ensino' && estado && estado.estado === 'solta') {
    return [['Editar', f.porta + consulta({ fonte: f.fonte, editar: registo.id }), '']];
  }
  const contexto = consulta({
    fonte: f.fonte,
    professor: registo.professor,
    ciclo: registo.ciclo,
    aluna: chave === 'anamnese' ? registo.aluna : '',
  });
  return [['Abrir no formulário', f.porta + contexto, 'secundario']];
}


/* ============================================================================================
 * O PAINEL DO ATO — o contexto que estava na porta, dentro da listagem (25/10/2026)
 * ============================================================================================
 *
 * O QUE ELE SUBSTITUI. A porta (`/anamnese/`, `/plano-ensino/`, `/plano-observacao/`) é uma
 * segunda página com o cabeçalho do ato, dois parágrafos de texto de desenvolvimento e — embaixo
 * — a estante «Fichas gravadas», que lista o mesmo que a listagem já lista. Criar exigia sair da
 * lista; o mesmo registo aparecia em dois lugares com duas gramáticas de botão.
 *
 * A DECISÃO (25/10/2026): o contexto vira um PAINEL dentro da listagem, e a caixinha que o abre é
 * a peça do «Turma» — `summary.trio-item`, na faixa inteira, com uma SETA em vez do «?» (para
 * baixo fechada, para cima aberta: ela não explica um valor, abre um formulário).
 *
 * A REGRA DOS BOTÕES JÁ EXISTIA, e é a da porta — não foi inventada aqui:
 *   · sem preenchimento guardado  → «Nova anamnese»
 *   · com preenchimento guardado  → «Continuar de onde parei» + «Começar de novo», e «Nova»
 *     ESCONDIDO (a porta diz porquê: «um botão desabilitado é ruído, um escondido não é nada»)
 *   · «Começar de novo»           → limpa a memória → «Nova» volta
 *   · «Ver a ficha em branco»     → sempre, fora do painel: não depende do contexto nem da senha
 *
 * A MEMÓRIA É A DA PORTA, com a mesma chave — `porta-<fonte>-<escola>-<professor>-<ciclo>-1`
 * (`chaveDaMemoria`, em `porta/index.html`). Não inclui a aluna. Ler a MESMA chave é o que faz o
 * painel dizer a verdade: se o professor começou a preencher na porta, o painel sabe-o.
 */

/** A chave do depósito local — cópia exacta de `chaveDaMemoria()` da porta. */
function chaveDaMemoria(fonte, escola, professor, ciclo) {
  const partes = ['porta', fonte || ''];
  for (const v of [escola, professor, ciclo]) {
    const t = String(v == null ? '' : v).trim();
    if (t) partes.push(t);
  }
  return partes.join('-') + '-1';
}

/**
 * O painel de UMA família, com os campos que ela pede.
 *
 * As diferenças entre as três não são de desenho: são de QUEM EXISTE no ato.
 *   · anamnese — professor, ciclo, ALUNA e senha (a escrita da anamnese é do professor);
 *   · plano de ensino — professor, ciclo, TURMA (escolhe-se) e senha (editar exige-a);
 *   · PO — professor, ciclo, TURMA (leitura, vem do plano) e senha.
 * A escola não é campo: é inscrição, e o Worker de cada escola resolve-a por `ESCOLA_SLUG`.
 */
function painelDoAto(chave, escola) {
  const f = FAMILIAS[chave];
  const ehAnamnese = chave === 'anamnese';
  const ehPlano = chave === 'plano-de-ensino';
  return `
<details class="painel-ato" id="painel-ato">
  <summary class="trio-item">
    <span class="trio-k">Contexto do ato</span>
    <span class="trio-v" data-resumo>escolher o professor, o ciclo${ehAnamnese ? ' e a aluna' : ''}</span>
    <span class="seta-do-ato" aria-hidden="true">▾</span>
  </summary>
  <div class="corpo-do-ato">
    <div class="campos-do-ato">
      <span class="campo"><label class="campo-rotulo" for="ato-professor">professor</label>
        <select id="ato-professor" data-ato="professor"><option value="">— escolher —</option></select></span>
      <span class="campo"><label class="campo-rotulo" for="ato-ciclo">ciclo</label>
        <input type="text" id="ato-ciclo" data-ato="ciclo" value="" inputmode="numeric"></span>
      ${ehAnamnese ? `<span class="campo"><label class="campo-rotulo" for="ato-aluna">aluna</label>
        <select id="ato-aluna" data-ato="aluna"><option value="">— nenhuma —</option></select></span>` : ''}
      ${ehPlano ? `<span class="campo"><label class="campo-rotulo" for="ato-turma">turma</label>
        <select id="ato-turma" data-ato="turma"><option value="">— escolher —</option></select></span>` : ''}
      ${chave === 'plano-de-observacao' ? `<span class="campo"><span class="campo-rotulo">turma observada</span>
        <span class="leitura" data-turma-leitura>—</span></span>` : ''}
      <span class="campo campo-senha"><label class="campo-rotulo" for="ato-senha">senha do professor</label>
        <input type="password" id="ato-senha" data-ato="senha" autocomplete="off">
        <span class="selo ok" data-senha-status hidden>confere</span></span>
    </div>
    <div class="acoes-do-ato">
      <button class="acao" type="button" data-acao="nova" disabled>${f.acaoDeCriar}</button>
      <button class="acao secundario pequena" type="button" data-acao="continuar" hidden>
        Continuar de onde parei</button>
      <button class="acao secundario pequena" type="button" data-acao="recomecar" hidden>
        Começar de novo</button>
    </div>
    <p class="estado-do-ato" data-estado hidden></p>
  </div>
</details>
<p class="ficha-em-branco"><a class="acao secundario pequena" href="${f.porta}api/ficha?formato=html"
  target="_blank" rel="noopener">Ver a ficha em branco</a></p>`;
}

/**
 * O JavaScript do painel — o que o põe a funcionar.
 *
 * PORQUE É UM SCRIPT SEPARADO, e não uma linha no `SCRIPT_DA_LISTA`: a lista é desenhada para oito
 * páginas, e sete delas não têm painel nenhum. `paginaDeLista` só o emite quando recebe o painel.
 *
 * O QUE ELE NÃO FAZ: não valida a senha duas vezes, não inventa o recorte das alunas e não
 * decide a regra da curadoria. Pergunta ao servidor as três coisas que a porta pergunta, nos
 * mesmos endpoints — `/api/bastidores/professores`, `/api/bastidores/alunas`,
 * `/api/bastidores/curadoria-professor` — e usa `/api/bastidores/validar-senha` para a senha.
 * Uma regra, um lugar.
 */
function scriptDoPainel(chave, escola) {
  const f = FAMILIAS[chave];
  const ehAnamnese = chave === 'anamnese';
  const ehPlano = chave === 'plano-de-ensino';
  const dados = eschave(JSON.stringify({
    fonte: chave === 'plano-de-ensino' ? 'plano' : (chave === 'plano-de-observacao' ? 'po' : 'anamnese'),
    porta: f.porta, escola: escola || '', ehAnamnese, ehPlano, criar: f.acaoDeCriar,
  }));
  return `<script>(function () {
  var CFG = ${dados};
  var painel = document.getElementById('painel-ato');
  if (!painel) return;

  function $(seletor) { return document.querySelector(seletor); }
  function campo(nome) { var e = $('[data-ato="' + nome + '"]'); return e || null; }
  function valor(nome) { var e = campo(nome); return e ? String(e.value || '').trim() : ''; }

  /* A CHAVE DA MEMÓRIA É A DA PORTA — cópia exacta de chaveDaMemoria() em porta/index.html.
   * Lê-la do mesmo sítio é o que faz este painel dizer a verdade: o que o professor começou a
   * preencher na porta aparece aqui como «continuar», e não como «nada». */
  function chaveDaMemoria() {
    var partes = ['porta', CFG.fonte];
    ['escola', 'professor', 'ciclo'].forEach(function (c) {
      var v = c === 'escola' ? CFG.escola : valor(c);
      if (v) partes.push(v);
    });
    return partes.join('-') + '-1';
  }
  /* O CONTEXTO ESCOLHIDO TEM DE SOBREVIVER AO RECARREGAMENTO (25/10/2026).
   *
   * O DEFEITO, medido: o professor escolhia professor, ciclo e aluna no painel; a página
   * recarregava (ou ele voltava noutro dia) e o painel nascia VAZIO. Pior do que o trabalho de
   * escolher outra vez: a chave da memória da porta (porta-<fonte>-<escola>-<professor>-<ciclo>-1)
   * inclui o professor e o ciclo, por isso sem eles o painel PROCURAVA A CHAVE ERRADA — e o
   * «continuar de onde parei» nunca aparecia, que é a razão de ele existir.
   *
   * A porta não tem este problema porque o contexto lhe chega pelo endereço (?professor=…).
   * Aqui o contexto é escolhido DENTRO da página, e por isso tem de ser guardado. A chave é por
   * escola e por fonte: trocar de anamnese para plano não herda a aluna do outro ato.
   *
   * A SENHA NÃO SE GUARDA. Ela é segredo, e o que se está a guardar é a escolha de quem e do quê. */
  function chaveDoContexto() {
    return 'ato-' + (CFG.escola || 'escola') + '-' + CFG.fonte + '-1';
  }
  function lerContexto() {
    try { var b = localStorage.getItem(chaveDoContexto()); return b ? JSON.parse(b) : null; }
    catch (e) { return null; }
  }
  function gravarContexto() {
    try {
      localStorage.setItem(chaveDoContexto(), JSON.stringify({
        professor: valor('professor'), ciclo: valor('ciclo'),
        aluna: valor('aluna'), turma: valor('turma'),
      }));
    } catch (e) {}
  }
  function restaurarContexto() {
    var c = lerContexto();
    if (!c) return;
    ['ciclo', 'aluna'].forEach(function (nome) {
      var e = campo(nome);
      if (e && c[nome] && nome === 'ciclo') e.value = c[nome];
    });
    /* 'professor', 'aluna' e 'turma' são 'select's: o valor só pode ser posto DEPOIS de as
     * opções chegarem do servidor — é o que 'encher' faz, e é lá que o escolhido é marcado. */
    ATOS.professor = c.professor || '';
    ATOS.aluna = c.aluna || '';
    ATOS.turma = c.turma || '';
  }

  function memoria() {
    try { var b = localStorage.getItem(chaveDaMemoria()); return b ? JSON.parse(b) : null; }
    catch (e) { return null; }
  }
  function limparMemoria() {
    try { localStorage.removeItem(chaveDaMemoria()); } catch (e) {}
  }

  var PROFESSORES = [];
  var CURADORIA_CARREGADA = false;
  var CURADORIAS = [];
  var SENHA_OK = false;
  /* O que foi escolhido antes de esta página carregar — e que os 'select' só podem receber
   * depois de as opções chegarem. */
  var ATOS = { professor: '', aluna: '', turma: '' };

  function faltam() {
    var falta = [];
    if (!valor('professor')) falta.push('professor');
    if (!valor('ciclo')) falta.push('ciclo');
    if (CFG.ehAnamnese && !valor('aluna')) falta.push('aluna');
    if (CFG.ehPlano && !valor('turma')) falta.push('turma');
    return falta;
  }
  function semCuradoria() {
    return !CFG.ehAnamnese && CURADORIA_CARREGADA && CURADORIAS.length === 0;
  }

  function pintar() {
    var mem = memoria();
    var falta = faltam();
    var trava = semCuradoria() || falta.length > 0 || !SENHA_OK;

    var nova = $('[data-acao="nova"]');
    var continuar = $('[data-acao="continuar"]');
    var recomecar = $('[data-acao="recomecar"]');
    /* OS TRÊS ESTADOS DA PORTA. «Nova» desaparece quando há o que continuar — escondido, não
     * desabilitado. E volta quando «Começar de novo» limpa a memória. */
    if (nova) {
      nova.hidden = !!mem;
      nova.disabled = trava;
      nova.title = semCuradoria() ? 'A direção ainda não atribuiu curadoria a este professor'
        : (falta.length ? 'Falta o contexto do ato: ' + falta.join(', ') : '');
    }
    if (continuar) continuar.hidden = !mem;
    if (recomecar) recomecar.hidden = !mem;

    /* O ESTADO DIZ O QUE FALTA — na porta isto é só o title do botão, e um title não se lê no
     * telemóvel. */
    var estado = $('[data-estado]');
    if (estado) {
      if (mem) {
        estado.hidden = false;
        estado.setAttribute('data-falta', 'nao');
        estado.textContent = 'Há um preenchimento interrompido: ' + (mem.respondidos || 0) + ' de '
          + (mem.total || '?') + ' respondidas'
          + (mem.quando ? ', último lançamento em ' + String(mem.quando).slice(0, 10) : '') + '.';
      } else if (semCuradoria()) {
        estado.hidden = false;
        estado.setAttribute('data-falta', 'sim');
        estado.textContent = 'A direção ainda não atribuiu curadoria a este professor — sem '
          + 'curadoria não há turma, e sem turma não há o que planejar.';
      } else if (falta.length) {
        estado.hidden = false;
        estado.setAttribute('data-falta', 'sim');
        estado.textContent = 'Falta o contexto do ato: ' + falta.join(', ') + '.';
      } else {
        estado.hidden = true;
        estado.textContent = '';
      }
    }
    var status = $('[data-senha-status]');
    if (status) status.hidden = !SENHA_OK;

    /* A CAIXINHA DIZ O CONTEXTO INTEIRO, ou o que falta. É o papel do title na porta. */
    var resumo = $('[data-resumo]');
    if (resumo) {
      var p = valor('professor');
      var nome = p;
      for (var i = 0; i < PROFESSORES.length; i += 1) {
        if (PROFESSORES[i].slug === p) { nome = PROFESSORES[i].nome; break; }
      }
      var partes = [];
      if (nome) partes.push(nome);
      if (valor('ciclo')) partes.push('ciclo ' + valor('ciclo'));
      if (CFG.ehAnamnese && valor('aluna')) partes.push(valor('aluna'));
      if (CFG.ehPlano && valor('turma')) partes.push(valor('turma'));
      resumo.textContent = partes.length ? partes.join(' · ')
        : 'escolher o professor, o ciclo' + (CFG.ehAnamnese ? ' e a aluna' : '');
      resumo.style.color = (falta.length || semCuradoria()) ? 'var(--alerta)' : '';
      painel.classList.toggle('falta', falta.length > 0 || semCuradoria());
    }

    /* COM PREENCHIMENTO INTERROMPIDO O PAINEL ABRE. As acções vivem dentro dele; fechado, a
     * notícia do preenchimento desaparecia — e é o que a porta faz, ao pôr a caixa de retomada
     * no topo. */
    if (mem) painel.open = true;
  }

  function encher(select, itens, rotulo, escolhido) {
    if (!select) return;
    var primeiro = select.firstElementChild;
    while (select.options.length > 1) select.remove(1);
    itens.forEach(function (it) {
      var o = document.createElement('option');
      o.value = it.valor;
      o.textContent = it.rotulo;
      if (it.valor === escolhido) o.selected = true;
      select.appendChild(o);
    });
    void primeiro;
  }

  function pedir(url, opcoes) {
    return fetch(url, opcoes).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        return { ok: r.ok && d.ok !== false, dados: d };
      });
    }).catch(function () { return { ok: false, dados: {} }; });
  }

  function carregarProfessores() {
    return pedir('/api/bastidores/professores').then(function (r) {
      PROFESSORES = (r.dados && r.dados.professores) || [];
      encher(campo('professor'), PROFESSORES.map(function (p) {
        return { valor: p.slug, rotulo: p.nome };
      }), 'nome', valor('professor') || ATOS.professor);
    });
  }

  function carregarAlunas() {
    if (!CFG.ehAnamnese) return Promise.resolve();
    var slug = valor('professor');
    var url = '/api/bastidores/alunas' + (slug ? '?professor=' + encodeURIComponent(slug) : '');
    return pedir(url).then(function (r) {
      var lista = (r.dados && r.dados.alunas) || [];
      var atuais = [];
      var sel = campo('aluna');
      if (sel) { for (var i = 0; i < sel.options.length; i += 1) atuais.push(sel.value); }
      encher(sel, lista.map(function (a) { return { valor: a, rotulo: a }; }), null,
        valor('aluna') || ATOS.aluna || (atuais.length ? atuais[0] : ''));
    });
  }

  function carregarTurmas() {
    if (!CFG.ehPlano) return Promise.resolve();
    return pedir('/api/bastidores/turmas').then(function (r) {
      var lista = (r.dados && (r.dados.turmas || r.dados.lista)) || [];
      encher(campo('turma'), lista.map(function (t) {
        var nome = typeof t === 'string' ? t : (t.nome || t.turma || '');
        return { valor: nome, rotulo: nome };
      }).filter(function (t) { return t.valor; }), null, valor('turma') || ATOS.turma);
    });
  }

  function carregarCuradoria() {
    var slug = valor('professor');
    if (!slug || CFG.ehAnamnese) { CURADORIAS = []; CURADORIA_CARREGADA = CFG.ehAnamnese; return Promise.resolve(); }
    return pedir('/api/bastidores/curadoria-professor?professor=' + encodeURIComponent(slug))
      .then(function (r) {
        CURADORIAS = (r.dados && Array.isArray(r.dados.curadorias)) ? r.dados.curadorias : [];
        CURADORIA_CARREGADA = true;
      });
  }

  /* A SENHA É VALIDADA NO SERVIDOR, como na porta. Aqui só se guarda o veredicto. */
  var tempoDeSenha = null;
  function validarSenha() {
    var senha = valor('senha');
    var professor = valor('professor');
    if (!senha || !professor) { SENHA_OK = false; pintar(); return; }
    pedir('/api/bastidores/validar-senha', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: senha, professor: professor }),
    }).then(function (r) {
      SENHA_OK = !!r.ok;
      pintar();
    });
  }

  /* O DESTINO — os mesmos parâmetros que a linha do cartão usa, e que a porta lê. */
  function endereco() {
    var q = [];
    if (valor('professor')) q.push('professor=' + encodeURIComponent(valor('professor')));
    if (valor('ciclo')) q.push('ciclo=' + encodeURIComponent(valor('ciclo')));
    if (CFG.ehAnamnese && valor('aluna')) q.push('aluna=' + encodeURIComponent(valor('aluna')));
    if (CFG.fonte !== 'anamnese') q.push('fonte=' + CFG.fonte);
    return CFG.porta + (q.length ? '?' + q.join('&') : '');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-acao]');
    if (!b || !b.closest('#painel-ato')) return;
    var acao = b.getAttribute('data-acao');
    if (acao === 'nova' || acao === 'continuar') {
      window.location.href = endereco();
    } else if (acao === 'recomecar') {
      /* «Começar de novo» limpa e o painel FICA ABERTO. Fechá-lo esconderia justamente o botão
       * que volta — e o pedido é literal: «desaparece o continuar, desaparece o começar de novo, e
       * fica só o nova anamnese». O professor está a olhar para ali; o estado novo aparece ali. */
      limparMemoria();
      pintar();
    }
  });

  ['professor', 'ciclo', 'aluna', 'turma'].forEach(function (nome) {
    var e = campo(nome);
    if (!e) return;
    e.addEventListener('change', function () {
      pintar();
      gravarContexto();
      if (nome === 'professor') {
        carregarAlunas().then(pintar);
        carregarCuradoria().then(pintar);
      }
    });
    e.addEventListener('input', function () { gravarContexto(); pintar(); });
  });
  var senhaEl = campo('senha');
  if (senhaEl) {
    senhaEl.addEventListener('input', function () {
      clearTimeout(tempoDeSenha);
      tempoDeSenha = setTimeout(validarSenha, 450);
    });
  }

  /* A ORDEM IMPORTA: os professores primeiro (é o que dá nome ao resumo), a curadoria e as
   * alunas depois (dependem do professor escolhido), e o pinta no fim de cada uma. */
  restaurarContexto();
  carregarProfessores().then(function () { pintar(); return carregarCuradoria(); })
    .then(function () { return carregarAlunas(); })
    .then(function () { return carregarTurmas(); })
    .then(pintar);
  pintar();
})();</script>`;
}

/** O escape de uma string para dentro de um literal de JavaScript num `<script>`. */
function eschave(texto) {
  return String(texto).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/**
 * AS LINHAS DE UMA FAMÍLIA, como o cartão da listagem as quer.
 *
 * Cada família tem o seu «de quem», e nenhuma delas o inventa:
 *   · anamnese — a ALUNA é o registo, e a turma vem da curadoria que a matriculou. Sem curadoria,
 *     «sem turma» e o selo «nova», que é derivado (deixa de o ser no dia em que entrar numa);
 *   · plano de ensino — a TURMA está no próprio registo (`turmaDoEnvelope`);
 *   · PO — a turma vem do plano de ensino que ele observa.
 */
function linhasDe(familia, registos, estados, turmasDaAluna, turmaDoPlano) {
  return registos.map((r) => {
    const estado = estados[r.id] || {};
    const quem = nomeDoProfessor(r);
    const quando = dia(r.gerado_em);
    if (familia === 'anamnese') {
      const turma = turmasDaAluna.get(r.aluna) || '';
      return {
        nome: r.aluna || 'Anamnese sem sujeito',
        selo: estado.vinculada ? 'vinculada' : (r.aluna && !turma ? 'nova' : ''),
        seloClasse: estado.vinculada ? 'vinculada' : 'livre',
        turma: turma,
        professor: quem,
        contexto: turma ? 'vinculada à turma ' + turma : 'aluna nova — sem turma',
        acoes: acoesDaLinha('anamnese', r, estado),
        caixas: [
          { rotulo: 'Turma', valor: turma || 'sem turma',
            painel: listaDePares([
              ['Turma', turma || 'sem turma'],
              ['Estado', estado.vinculada ? 'vinculada — um PO já a usa' : (estado.legado ? 'legado' : 'solta')]],
              turma
                ? 'A turma vem da curadoria, que é quem matricula a aluna.'
                : 'Aluna nova pode ser entrevistada por qualquer professor. O selo é derivado: '
                  + 'no dia em que entrar numa curadoria, deixa de o ser.') },
          { rotulo: 'Quem fez', valor: quem || '—',
            painel: listaDePares([['Professor', quem || '—'], ['Ciclo', r.ciclo || '—']]) },
          { rotulo: 'Quando', valor: quando || '—',
            painel: listaDePares([['Registada em', quando || '—'],
              ['Ajustes', estado.ajuste_de ? 'é um ajuste de ' + estado.ajuste_de : 'nenhum']],
              'A data vem do carimbo do registo: é a hora em que ele foi gravado.') },
        ],
      };
    }
    /* A TURMA DO PO VEM DO PLANO DE ENSINO QUE ELE OBSERVA (24/10/2026). O registo do PO não a
     * tem: ele referencia o plano, e é o plano que diz de que turma é. Sem esta resolução a caixa
     * «Turma» saía «—» — e um PO sem turma na listagem parece um PO solto, que é exactamente o
     * que ele não é. Medido em produção: era o único «—» que sobrava. */
    const doPlano = familia === 'plano-de-observacao'
      ? ((r.plano || []).map((id) => (turmaDoPlano || new Map()).get(id)).filter(Boolean)[0] || '')
      : '';
    const turma = r.turma || doPlano || '';
    return {
      nome: (familia === 'plano-de-ensino' ? 'Plano de ensino — ' : 'Plano de Observação — ')
        + (turma || 'turma não declarada'),
      selo: estado.estado || '',
      seloClasse: estado.estado === 'vinculada' ? 'vinculada'
        : estado.estado === 'legado' ? 'discreto' : 'livre',
      turma: turma,
      professor: quem,
      contexto: familia === 'plano-de-ensino'
        ? String(r.objetivo || '').slice(0, 120)
        : (r.plano && r.plano.length ? 'observa o plano de ensino de ' + r.plano.join(', ') : ''),
      acoes: acoesDaLinha(familia, r, estado),
      caixas: [
        { rotulo: 'Turma', valor: turma || '—',
          painel: listaDePares([
            ['Turma', turma || '—'], ['Ciclo', r.ciclo || '—'],
            ...(familia === 'plano-de-observacao'
              ? [['Sujeitos', (r.sujeitos || []).join(', ') || 'a turma inteira']] : [])]) },
        { rotulo: 'Quem fez', valor: quem || '—',
          painel: listaDePares([['Professor', quem || '—']],
            'É o professor da turma: o plano e a observação são dele sobre a turma dele.') },
        { rotulo: 'Quando', valor: quando || '—',
          painel: listaDePares([
            ['Registado em', quando || '—'],
            ...(familia === 'plano-de-ensino'
              ? [['Expira', 'não declarada — vale enquanto o ciclo correr']]
              : [['Plano de ensino', (r.plano || []).join(', ') || '—']])],
            familia === 'plano-de-ensino'
              ? 'O plano não expira por data própria: ele acompanha o período do ciclo, e o '
                + 'período está no plano do ciclo.'
              : 'O período observado é o do plano de ensino que este PO referencia.') },
      ],
    };
  });
}

/** Os pares rótulo/valor de um painel — a mesma grelha em todas as listas. */
function listaDePares(pares, nota) {
  return listas.painelDoCartao(pares, nota);
}

/**
 * A PÁGINA de uma das três listas — ou `null` quando o caminho não é de nenhuma delas.
 *
 * Recebe o que a ponte já tem: o `env` (com o KV), o menu da escola e o caminho pedido. Devolve
 * o HTML pronto a servir, com a barra já desenhada — a mesma barra de todas as páginas, porque
 * quem a desenha é o mesmo módulo.
 */
async function pagina(caminho, { env, menu, escola, curadorias }) {
  const chave = Object.keys(FAMILIAS).find((k) => caminho === '/area-do-professor/' + k + '/'
    || caminho === '/area-do-professor/' + k);
  if (!chave) return null;
  const familia = FAMILIAS[chave];
  if (!env || !env.PADD_KV) return null;
  // O MESMO armazenamento da porta (estático → KV), e não uma segunda leitura do KV: uma lista
  // que lesse por um caminho diferente do da porta mostraria registos que a porta não encontra.
  const armazenamento = criarArmazenamento(env);

  const resumos = await porta.resumosDeEnvelopes(armazenamento, familia.padrao);
  /* O ESTADO é derivado, e vem de quem o deriva — não é recalculado aqui. Duas derivações da
   * mesma regra divergiriam, e a que ficasse para trás seria a do ecrã. */
  const estados = chave === 'anamnese'
    ? await porta.estadosDasAnamneses(armazenamento)
    : chave === 'plano-de-ensino' ? await porta.estadosDosPlanos(armazenamento) : {};

  const registos = resumos
    .map(({ nome, resumo }) => Object.assign({}, resumo, { id: resumo.id || nome.replace(/\.json$/, '') }))
    .sort((a, b) => String(b.gerado_em || b.id).localeCompare(String(a.gerado_em || a.id)));

  /* O MAPA plano → turma. O PO referencia o plano de ensino, e a turma do PO é a do plano. Sai do
   * MESMO índice que já foi lido — não é uma segunda leitura. */
  let turmaDoPlano = null;
  if (chave === 'plano-de-observacao') {
    turmaDoPlano = new Map();
    for (const { resumo } of await porta.resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/)) {
      if (resumo && resumo.id && resumo.turma) turmaDoPlano.set(resumo.id, resumo.turma);
    }
  }

  const linhas = linhasDe(chave, registos, estados, turmaDaAluna(curadorias), turmaDoPlano);
  const titulo = familia.titulo;
  const pedido = caminho.endsWith('/') ? caminho : caminho + '/';

  return {
    titulo,
    html: listas.paginaDeLista({
      titulo,
      subtitulo: escola ? escola + ' · ' + (linhas.length === 1
        ? '1 ' + familia.singular : linhas.length + ' ' + familia.plural) : familia.subtitulo,
      nav: nav.desenhar(menu, pedido, { titulo }) || '',
      itens: linhas,
      vazio: familia.vazio,
      campos: ['busca', 'turma'],
      singular: familia.singular,
      plural: familia.plural,
      dica: 'pelo nome, pela turma ou pelo professor',
      /* O PAINEL DO ATO SUBSTITUI O BOTÃO DO TOPO (25/10/2026). O `acao` continua a existir em
       * `paginaDeLista` — as outras cinco listas usam-no —, mas esta página não o passa: criar
       * agora tem contexto. Um botão «Nova anamnese» no topo, ao lado de um painel que também
       * cria, seriam duas portas para o mesmo ato, e a segunda a não levar o contexto. */
      painel: painelDoAto(chave, escola),
      script: scriptDoPainel(chave, escola),
    }),
  };
}

module.exports = { pagina, FAMILIAS, turmaDaAluna, nomeDoProfessor, dia };
