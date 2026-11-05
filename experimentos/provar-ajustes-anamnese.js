#!/usr/bin/env node
'use strict';

/*
 * provar-ajustes-anamnese.js — a prova dos ajustes do teste de 16/10/2026.
 *
 * Roda o `<script>` REAL de `porta/index.html` (extraído na hora) num DOM mínimo, como
 * faz `provar-contexto-do-ato.js` — não há cópia da lógica aqui. Prova:
 *
 *   1. a LISTA mostra o APELIDO (o sujeito), e não só a data — sem ele, duas fichas do
 *      mesmo dia são indistinguíveis e o professor edita a errada;
 *   2. `tituloDoNo` marca o OBRIGATÓRIO com asterisco — e NÃO marca o derivado nem o
 *      opcional;
 *   3. `aplicarContextoDoEnvelope` pré-preenche a barra a partir do envelope, criando a
 *      `<option>` que o `select` exige para aceitar o valor;
 *   4. `apontarSenhaFaltando` marca o campo da senha como faltante;
 *   5. o ESTADO: o registo VIGENTE nunca sai como «substituída» (`legado`).
 *
 * A (5) é do motor (`motor/nucleo/porta.js`), não da tela — por isso roda à parte.
 *
 *   uso: node experimentos/provar-ajustes-anamnese.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.resolve(__dirname, '..');
const FONTE_HTML = path.join(RAIZ, 'porta/index.html');

let ok = 0;
const falhas = [];
function provar(nome, condicao, detalhe) {
  if (condicao) { ok += 1; console.log('  ok  ' + nome); return; }
  falhas.push(nome + (detalhe ? ' — ' + detalhe : ''));
  console.log('  FALHA ' + nome + (detalhe ? ' — ' + detalhe : ''));
}

// ------------------------------------------------------------------ DOM mínimo

function criarClasse(classes) {
  const conjunto = new Set(classes || []);
  return {
    add: (c) => conjunto.add(c),
    remove: (c) => conjunto.delete(c),
    contains: (c) => conjunto.has(c),
    toggle: (c, liga) => {
      const antes = conjunto.has(c);
      if (liga === undefined) liga = !antes;
      if (liga) conjunto.add(c); else conjunto.delete(c);
      return liga !== antes;
    },
  };
}

function criarElemento(id, tag) {
  const el = {
    id,
    tagName: String(tag).toUpperCase(),
    _valor: '',
    textContent: '',
    disabled: false,
    title: '',
    style: {},
    classList: criarClasse([]),
    opcoes: [],
    children: [],
    _pai: null,
    _focado: false,
    _rolou: false,
    _handlers: {},
    addEventListener(tipo, fn) { (el._handlers[tipo] = el._handlers[tipo] || []).push(fn); },
    appendChild(filho) { el.children.push(filho); el.opcoes.push(filho); return filho; },
    closest(sel) { return sel === '.campo' ? el._pai : null; },
    _controles: [],
    _filhos: {},
    querySelectorAll() { return el._controles; },
    // Um `querySelector` estável por seletor: devolver um elemento NOVO a cada chamada faria
    // a leitura e a escrita caírem em nós diferentes.
    querySelector(sel) {
      if (!el._filhos[sel]) el._filhos[sel] = criarElemento('q', 'div');
      return el._filhos[sel];
    },
    scrollIntoView() { el._rolou = true; },
    focus() { el._focado = true; },
  };
  Object.defineProperty(el, 'value', {
    get() { return el._valor; },
    set(v) {
      if (tag === 'select') {
        // O DOM de verdade: atribuir um valor sem `<option>` correspondente NÃO cola.
        const achou = el.opcoes.some((o) => o.value === v);
        el._valor = achou ? v : '';
        return;
      }
      el._valor = v === undefined || v === null ? '' : String(v);
    },
  });
  Object.defineProperty(el, 'options', { get() { return el.opcoes; } });
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html || ''; },
    set(h) { el._html = h; },
  });
  return el;
}

function montarDocumento() {
  const porId = new Map();
  const definir = (id, tag) => {
    const el = criarElemento(id, tag);
    const caixa = criarElemento('caixa-' + id, 'span');
    caixa.classList = criarClasse(['campo']);
    el._pai = caixa;
    porId.set(id, el);
    porId.set('caixa-' + id, caixa);
    return el;
  };
  for (const id of ['ctx-escola', 'ctx-professor', 'ctx-ciclo', 'ctx-aluna', 'senha']) {
    definir(id, id === 'ctx-professor' || id === 'ctx-aluna' ? 'select' : 'input');
  }
  for (const id of ['lista-fichas', 'filtro-fichas', 'fichas-vazio', 'senha-status', 'comecar', 'gravacao', 'gravar', 'pergunta', 'trava-senha']) {
    porId.set(id, criarElemento(id, id === 'gravar' || id === 'comecar' ? 'button' : 'div'));
  }
  // Os botões da CONDUÇÃO: vivem fora do `#pergunta`, e é fora dele que a trava os alcança.
  // O «Pular» saiu da barra (18/10/2026): a lista tem os que ficaram, e a prova de que ele
  // não voltou é a ausência dele aqui.
  for (const id of ['anterior', 'proxima', 'fechar', 'sair', 'n-resp', 'n-obrig']) {
    porId.set(id, criarElemento(id, id === 'n-resp' || id === 'n-obrig' ? 'span' : 'button'));
  }
  porId.get('filtro-fichas').value = '';
  return { porId };
}

function carregarPorta(caminho) {
  const caminhoPagina = caminho || '/anamnese/';
  const html = fs.readFileSync(FONTE_HTML, 'utf8');
  const casados = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  let js = casados.map((m) => m[1]).join('\n;\n');
  js = js.replace(/^iniciar\(\);\s*$/m, '');   // o boot faz fetch — fora do objeto
  js += `
globalThis.__porta = {
  pintarFichas, tituloDoNo, aplicarContextoDoEnvelope, apontarSenhaFaltando, seloDoEstado,
  editarAnamnese, esquecerSenha, travarFormularioSemSenha, apagarAnamnese, carregarPlanoNaConducao,
  exigeSenha, fechar,
  setFichas: (f) => { FICHAS = f; },
  setEstados: (m) => { ESTADOS.clear(); for (const par of m) ESTADOS.set(par[0], par[1]); },
  setIndice: (i) => { INDICE = i; },
  setEditando: (v) => { EDITANDO = v; },
  setDerivando: (v) => { DERIVANDO = v; },
  setMapa: (m) => { MAPA = m; },
  setSenhaValida: (v) => { SENHA_VALIDA = v; },
  setEditando: (v) => { EDITANDO = v; },
  senhaValida: () => SENHA_VALIDA,
  camposDoContexto: CAMPOS_DO_CONTEXTO,
  fonte: FONTE,
};`;

  const dom = montarDocumento();
  // A `sessionStorage` do mock GRAVA o que lhe pedem: é como se prova que a senha NÃO é
  // registrada — nenhuma escrita pode acontecer.
  const sessao = new Map();
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    URL, URLSearchParams, Date, Math, JSON, Set, Map, Array, Object, String, Number,
    Boolean, Error, Promise, RegExp, Intl, setTimeout, clearTimeout,
    Markdown: { paraLinha: (t) => String(t) },
    globalThis: null,
    location: { pathname: caminhoPagina, search: '', href: 'https://x' + caminhoPagina },
    document: {
      // Como o navegador: um id desconhecido existe (criado sob demanda). Sem isto, a prova
      // quebraria num `$('roteiro')` — e o objeto da prova é a lógica, não a lista de ids.
      getElementById: (id) => {
        if (!dom.porId.has(id)) dom.porId.set(id, criarElemento(id, 'div'));
        return dom.porId.get(id);
      },
      querySelector: (sel) => {
        const chave = 'sel:' + sel;
        if (!dom.porId.has(chave)) dom.porId.set(chave, criarElemento('sel', 'div'));
        return dom.porId.get(chave);
      },
      querySelectorAll: () => [],
      createElement: (tag) => criarElemento('novo', tag),
      addEventListener() {},
      body: criarElemento('body', 'body'),
      documentElement: criarElemento('html', 'html'),
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: {
      getItem: (k) => (sessao.has(k) ? sessao.get(k) : null),
      setItem: (k, v) => { sessao.set(k, v); },
      removeItem: (k) => { sessao.delete(k); },
    },
    fetch: async (alvo) => {
      const corpo = String(alvo).indexOf('envelope') !== -1
        ? {
            id: 'anamnese-20261016-1404',
            contexto: { escola: 'fita', professor: 'tiago-menegaz', ciclo: '01', aluna: 'Vavá' },
            respostas: { 'categoria-etaria': { valor: 'Infantil' } },
          }
        : {};
      return { ok: true, json: async () => corpo };
    },
    CSS: { escape: (s) => String(s).replace(/"/g, '\\"') },
    speechSynthesis: { cancel() {}, speak() {} },
    addEventListener() {},
    history: { back() {}, pushState() {} },
    navigator: { userAgent: 'prova' },
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  new vm.Script(js, { filename: 'porta/index.html:script' }).runInContext(sandbox);
  return { porta: sandbox.__porta, dom, sessao };
}

// ------------------------------------------------------------------- a prova

/*
 * Uma segunda montagem: a página BOOTADA por `iniciar()`, com um DOM que responde por
 * QUALQUER id (como o navegador) e um `api/mapa` mínimo. É o que permite executar o
 * caminho REAL do «Guardar» — e não uma reimplementação dele.
 */
/* `caminho` é a PÁGINA que se carrega. Ele importa: `FONTE` é derivado do
 * `location.pathname` (porta/index.html), e há regras que só valem numa das três —
 * `turmasJaUsadas` só bloqueia turma no PLANO. Uma prova que mede o plano numa página de
 * anamnese mede o caso errado, e foi o que aconteceu: doze asserções do bloco (14)
 * falhavam desde que a regra «uma turma por plano» passou a olhar para a fonte. */
function carregarPortaIniciada(caminho) {
  const pagina = caminho || '/anamnese/';
  const html = fs.readFileSync(FONTE_HTML, 'utf8');
  const casados = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  let js = casados.map((m) => m[1]).join('\n;\n');
  js = js.replace(/^iniciar\(\);\s*$/m, '');
  js += `
globalThis.__porta = {
  iniciar,
  fechar,
  apagarAnamnese,
  setEditando: (v) => { EDITANDO = v; },
  setSenhaValida: (v) => { SENHA_VALIDA = v; },
  senhaValida: () => SENHA_VALIDA,
  setIndice: (i) => { INDICE = i; },
  setDerivando: (v) => { DERIVANDO = v; },
  acomodarRecarimbo,
  gradeDeOpcoesDinamicas,
  urlDoPlano,
  setOpcoes: (ep, lista) => { OPCOES.set(ep, lista); },
  setCuradorias: (lista) => { CURADORIAS = lista; CURADORIA_CARREGADA = true; },
  setRespostas: (m) => { RESPOSTAS.clear(); for (const par of m) RESPOSTAS.set(par[0], par[1]); },
  respostas: () => new Map(RESPOSTAS),
  pintarFichas,
  irParaPagina,
  filtrarFichas,
  abrirFormulario,
  voltarAoPortal,
  setPagina: (n) => { PAGINA = n; },
  pagina: () => PAGINA,
  porPagina: POR_PAGINA,
  setFichas: (f) => { FICHAS = f; },
  setEstados: (m) => { ESTADOS.clear(); for (const par of m) ESTADOS.set(par[0], par[1]); },
  fichas: () => FICHAS.slice(),
  estadoDe: (id) => ESTADOS.get(id) || null,
};`;

  const memo = new Map();
  const porId = (id) => {
    if (!memo.has(id)) {
      const ehSelect = id === 'ctx-professor' || id === 'ctx-aluna';
      const ehBotao = id === 'gravar' || id === 'comecar' || id === 'proxima' || id === 'anterior';
      memo.set(id, criarElemento(id, ehSelect ? 'select' : ehBotao ? 'button' : 'div'));
    }
    return memo.get(id);
  };
  const porSel = (sel) => {
    const chave = 'sel:' + sel;
    if (!memo.has(chave)) memo.set(chave, criarElemento('sel', 'div'));
    return memo.get(chave);
  };

  const chamadas = [];
  // O que a rota da EDIÇÃO devolve — a prova o troca para medir o que a tela faz com a
  // resposta (o carimbo novo, ou a notícia de que nada mudou).
  const roteiro = { editar: { ok: true } };
  const destinos = [];
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    URL, URLSearchParams, Date, Math, JSON, Set, Map, Array, Object, String, Number,
    Boolean, Error, Promise, RegExp, Intl, setTimeout, clearTimeout,
    Markdown: { paraLinha: (t) => String(t) },
    globalThis: null,
    /* `replace` EXISTE, E REGISTA O DESTINO (02/11/2026).
     *
     * O `location` do mock tinha `pathname`, `search` e `href` — e a página chama
     * `window.location.replace(alvo)` no caminho em que o ato não tem contexto válido
     * (`voltarParaALista`, e é o comportamento certo: sem contexto não há formulário a abrir, só
     * um endereço órfão). Sem `replace` no mock, esse caminho morria num `TypeError` e a prova
     * inteira parava ali, a meio do bloco (8) — a última asserção do ficheiro deixava de correr,
     * e o que se lia era «erro na prova», não «a página devolveu-me à lista».
     *
     * É o mock que estava incompleto, não a página: um navegador tem `replace`. Agora o destino
     * é REGISTADO (`destinos`), e quem quiser prova-lo fá-lo em vez de apanhar a exceção. */
    location: {
      pathname: pagina,
      search: '?professor=tiago-menegaz&escola=fita&ciclo=01',
      href: 'https://x' + pagina,
      replace(alvo) { destinos.push(String(alvo)); },
      assign(alvo) { destinos.push(String(alvo)); },
    },
    document: {
      getElementById: porId,
      querySelector: porSel,
      querySelectorAll: () => [],
      createElement: (tag) => criarElemento('novo', tag),
      addEventListener() {},
      body: criarElemento('body', 'body'),
      documentElement: criarElemento('html', 'html'),
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    fetch: async (alvo, opcoes) => {
      const metodo = (opcoes && opcoes.method) || 'GET';
      chamadas.push(metodo + ' ' + String(alvo));
      /* A LISTA DE ALUNAS E A DE PROFESSORES SÃO SERVIDAS (02/11/2026). O `fetch` do mock
       * respondia `{ok:true}` a tudo, e `carregarAlunas()` — que corre DEPOIS de a página semear o
       * contexto — reconstruía o `select` a partir de uma lista vazia e apagava a aluna. O
       * contexto ficava incompleto sem ninguém lhe tocar, `podePreencher()` via-o faltar, e a
       * porta devolvia à lista: o bloco (8) media a saída em vez do «Guardar».
       *
       * Não é o mock a imitar a página: é a página a receber a resposta que o servidor dá. */
      const endereco = String(alvo);
      const corpo = endereco.indexOf('mapa') !== -1
        ? { nos: [{ id: 'n1', campo: 'Pergunta' }], obrigatorios: 0, respondidas: 0, total: 1, tituloCabecalho: 'Prova' }
        : endereco.indexOf('anamnese-editar') !== -1
          ? roteiro.editar
          : endereco.indexOf('/api/bastidores/alunas') !== -1
            ? { ok: true, alunas: ['Vavá'] }
            : endereco.indexOf('/api/bastidores/professores') !== -1
              ? { ok: true, professores: [{ nome: 'Tiago Menegaz', slug: 'tiago-menegaz' }] }
              : { ok: true };
      return { ok: true, json: async () => corpo };
    },
    CSS: { escape: (s) => String(s).replace(/"/g, '\\"') },
    // `true`: se a trava da senha NÃO barrar, a exclusão SEGUE — é o que faz a prova
    // distinguir «barrada pela senha» de «barrada pela confirmação».
    confirm: () => true,
    speechSynthesis: { cancel() {}, speak() {} },
    addEventListener() {},
    history: { back() {}, pushState() {} },
    navigator: { userAgent: 'prova' },
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  new vm.Script(js, { filename: 'porta/index.html:script' }).runInContext(sandbox);
  return { porta: sandbox.__porta, porId, chamadas, roteiro, destinos };
}

function main() {
  const { porta, dom, sessao } = carregarPorta();
  provar('a página carrega com FONTE=anamnese', porta.fonte === 'anamnese', 'FONTE=' + porta.fonte);
  provar('o contexto do ato inclui «aluna»',
    porta.camposDoContexto.indexOf('aluna') !== -1, porta.camposDoContexto.join(','));

  // (1) A LISTA MOSTRA O APELIDO
  porta.setFichas(['anamnese-20261016-1404']);
  porta.setEstados([['anamnese-20261016-1404',
    { valor: 'Vavá', estado: 'solta', apelido: 'Vavá', semSujeito: false, vinculada: false, por: [], vigente: true }]]);
  porta.pintarFichas();
  const htmlLista = dom.porId.get('lista-fichas').innerHTML;
  provar('a lista mostra o APELIDO do sujeito', htmlLista.indexOf('Vavá') !== -1, htmlLista.slice(0, 120));
  provar('a lista usa a classe do sujeito', htmlLista.indexOf('class="quem"') !== -1);
  provar('a lista continua a mostrar a DATA', htmlLista.indexOf('class="quando"') !== -1);

  porta.setEstados([['anamnese-20261016-1404',
    { valor: null, estado: 'sem-sujeito', apelido: null, semSujeito: true, vinculada: false, por: [], vigente: false }]]);
  porta.pintarFichas();
  const htmlSem = dom.porId.get('lista-fichas').innerHTML;
  provar('a lista diz «sem apelido» em vez de ficar muda',
    htmlSem.indexOf('sem apelido') !== -1 && htmlSem.indexOf('sem-sujeito') !== -1);

  // (2) O ASTERISCO DO OBRIGATÓRIO
  porta.setIndice(0);
  const tObrig = porta.tituloDoNo({ campo: 'Pergunta', obrigatorio: true });
  const tOpc = porta.tituloDoNo({ campo: 'Pergunta', obrigatorio: false });
  const tDeriv = porta.tituloDoNo({ campo: 'Pergunta', obrigatorio: true, derivado: true });
  provar('o obrigatório leva asterisco', tObrig.indexOf('class="req"') !== -1, tObrig);
  provar('o opcional NÃO leva asterisco', tOpc.indexOf('class="req"') === -1, tOpc);
  provar('o derivado NÃO leva asterisco', tDeriv.indexOf('class="req"') === -1, tDeriv);

  // (3) O CONTEXTO VEM DO ENVELOPE
  porta.aplicarContextoDoEnvelope({
    contexto: { escola: 'fita', professor: 'tiago-menegaz', ciclo: '01', aluna: 'Vavá' },
  });
  provar('a escola é pré-preenchida', dom.porId.get('ctx-escola').value === 'fita');
  provar('o professor é pré-preenchido no select', dom.porId.get('ctx-professor').value === 'tiago-menegaz');
  /* O CICLO NÃO É DA ANAMNESE — e a asserção foi INVERTIDA, não apagada (05/11/2026).
   *
   * Ela dizia «o ciclo é pré-preenchido», e era verdade enquanto a anamnese pedia ciclo. Desde
   * 04/11/2026 ele saiu dos campos do ato (a anamnese é do sujeito, não do ciclo): `CAMPOS_DO_
   * CONTEXTO`, na anamnese, é `escola`, `professor` e `aluna`. Aplicar o contexto passou a
   * IGNORAR o ciclo que o envelope traga — e é isso que se mede aqui. A metade do plano
   * (onde o ciclo continua a ser identidade do ato) é provada mais abaixo, noutra página.
   *
   * A asserção antiga ficou a falhar em silêncio desde a remoção: o campo existe no HTML (o
   * `hidden` esconde-o na anamnese), e o valor vazio lia-se como «a prova é que está errada».
   * Uma prova que envelhece sem ser invertida mente para o lado do código que já não existe. */
  provar('o ciclo NÃO entra na anamnese, mesmo quando o envelope o traz',
    porta.camposDoContexto.indexOf('ciclo') === -1 && dom.porId.get('ctx-ciclo').value === '',
    'campos=' + porta.camposDoContexto.join(',') + ' ciclo=' + dom.porId.get('ctx-ciclo').value);
  provar('a ALUNA é pré-preenchida (era o campo que abria vazio)', dom.porId.get('ctx-aluna').value === 'Vavá');
  const caixaAluna = dom.porId.get('caixa-ctx-aluna');
  provar('o campo da aluna deixa de estar marcado como faltante', caixaAluna.classList.contains('falta') === false);

  // (4) A SENHA SE MARCA QUANDO FALTA
  porta.setSenhaValida(false);
  porta.apontarSenhaFaltando();
  provar('o campo da senha é marcado como faltante',
    dom.porId.get('caixa-senha').classList.contains('falta'));
  provar('o campo da senha recebe o foco', dom.porId.get('senha')._focado === true);
  provar('a senha faltante é DITA na barra',
    String(dom.porId.get('senha-status').textContent).indexOf('senha') !== -1,
    String(dom.porId.get('senha-status').textContent));

  // (5) A SENHA NÃO FICA REGISTRADA EM LUGAR NENHUM
  dom.porId.get('senha').value = 'segredo';
  porta.setSenhaValida(true);
  porta.setEditando('anamnese-20261016-1404');
  sessao.set('lancamento:senha', 'resíduo de antes da correção');
  porta.esquecerSenha();
  provar('esquecerSenha apaga o campo da senha', dom.porId.get('senha').value === '');
  provar('esquecerSenha derruba o «validado»', porta.senhaValida() === false);
  provar('esquecerSenha limpa o resíduo da sessão', sessao.size === 0,
    'chaves=' + Array.from(sessao.keys()).join(','));

  // (6) A TRAVA DO FORMULÁRIO — só-leitura enquanto a senha não vale
  const cxPergunta = dom.porId.get('pergunta');
  cxPergunta._controles = [criarElemento('c1', 'input'), criarElemento('c2', 'select')];
  porta.setSenhaValida(false);
  porta.travarFormularioSemSenha();
  provar('SEM senha: os controles do formulário ficam desabilitados',
    cxPergunta._controles.every((c) => c.disabled === true),
    JSON.stringify(cxPergunta._controles.map((c) => c.disabled)));
  provar('SEM senha: o formulário fica marcado como travado',
    cxPergunta.classList.contains('travado'));
  provar('SEM senha: o aviso da trava aparece',
    dom.porId.get('trava-senha').classList.contains('oculto') === false);
  provar('SEM senha: o «Guardar» fica travado', dom.porId.get('gravar').disabled === true);
  // Os botões de FORA do `#pergunta`: o `#fechar` roda o motor — trava. Navegar e sair não
  // travam. O «Pular» já não existe: o botão foi retirado em 18/10/2026, e a asserção
  // passou a guardar a AUSÊNCIA dele em vez de uma trava que já não tem onde viver.
  provar('o «Pular» já não existe na barra', dom.porId.has('pular') === false);
  provar('SEM senha: o «Fechar a elicitação» fica travado', dom.porId.get('fechar').disabled === true);
  provar('SEM senha: o «Anterior» segue LIVRE', dom.porId.get('anterior').disabled === false);
  provar('SEM senha: o «Próxima» segue LIVRE', dom.porId.get('proxima').disabled === false);
  provar('SEM senha: o «Sair» segue LIVRE', dom.porId.get('sair').disabled === false);
  porta.setSenhaValida(true);
  porta.travarFormularioSemSenha();
  provar('COM senha: os controles voltam a habilitar',
    cxPergunta._controles.every((c) => c.disabled === false));
  provar('COM senha: o «Pular» não voltou', dom.porId.has('pular') === false);
  // O `#fechar` volta à regra DELE (faltam obrigatórios), não a um `false` cego — aqui não há
  // mapa, logo não há obrigatórios pendentes.
  provar('COM senha: o «Fechar» volta à regra dele (sem obrigatórios pendentes)',
    dom.porId.get('fechar').disabled === false);
  provar('COM senha: o formulário deixa de estar travado',
    cxPergunta.classList.contains('travado') === false);
  provar('COM senha: o aviso da trava some',
    dom.porId.get('trava-senha').classList.contains('oculto') === true);

  // (7) O ESTADO (motor)
  const nucleo = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
  const prefixo = nucleo.PREFIXO_ENVELOPES;
  const envelopes = {
    'anamnese-20261016-1351.json': {
      id: 'anamnese-20261016-1351', envelope: '1.2.0',
      contexto: { escola: 'fita', professor: 'tiago-menegaz', ciclo: '01', aluna: 'Mari' },
      respostas: { 'categoria-etaria': { valor: 'Juvenil' } },
    },
    'anamnese-20261016-1404.json': {
      id: 'anamnese-20261016-1404', envelope: '1.2.0',
      contexto: { escola: 'fita', professor: 'tiago-menegaz', ciclo: '01', aluna: 'Mari' },
      respostas: { 'categoria-etaria': { valor: 'Infantil' } },
    },
  };
  const chaves = Object.keys(envelopes).map((n) => prefixo + n);
  const armazenamento = {
    async listar(p) { return chaves.filter((c) => c.indexOf(p) === 0); },
    async ler(c) {
      const nome = c.indexOf(prefixo) === 0 ? c.slice(prefixo.length) : c;
      return Object.prototype.hasOwnProperty.call(envelopes, nome) ? JSON.stringify(envelopes[nome]) : null;
    },
  };

  return nucleo.estadosDasAnamneses(armazenamento).then((estados) => {
    const novo = estados['anamnese-20261016-1404'];
    const velho = estados['anamnese-20261016-1351'];
    provar('o mais recente é o VIGENTE', novo.vigente === true && velho.vigente === false);
    provar('o VIGENTE não sai como «substituída»', novo.estado === 'solta', 'estado=' + novo.estado);
    provar('o ANTERIOR sai como «substituída»', velho.estado === 'legado', 'estado=' + velho.estado);

    // (8) A EDIÇÃO NÃO GRAVA SEM A SENHA — pelo caminho REAL do «Guardar»
    const boot = carregarPortaIniciada();
    /* O CONTEXTO DO ATO É POSTO ANTES DE `iniciar()` (02/11/2026).
     *
     * É a ordem do navegador: quem abre a porta chega com os campos do cabeçalho preenchidos do
     * envelope ou da barra, e `podePreencher()` confere-os na PRIMEIRA coisa que faz. A prova
     * punha-os depois, e por isso a página fazia o que deve — `voltarParaALista()` — e nunca
     * chegava a ligar o «Guardar». O bloco (8) media, sem saber, o caminho de saída.
     *
     * O que se prova agora são as DUAS metades: com contexto, a página fica (e liga o
     * manipulador); sem contexto, devolve à lista. A segunda era invisível — era o `TypeError`
     * que a escondia. */
    /* OS DOIS `select` PRECISAM DA `<option>` (02/11/2026). O `value` do elemento do mock só cola
     * quando há uma opção com aquele valor — é o que o DOM de verdade faz —, e a página semeia o
     * contexto da URL na abertura (`el.value = params.get(campo)`). Sem as opções, o `select` do
     * professor voltava a vazio no seed e `podePreencher()` via contexto faltando. As opções são
     * as que o servidor traria; aqui entram à mão porque o `fetch` do mock não as serve. */
    const comOpcoes = (id, valores) => {
      const el = boot.porId(id);
      for (const v of valores) if (!el.opcoes.some((o) => o.value === v)) el.appendChild({ value: v, textContent: v });
      return el;
    };
    comOpcoes('ctx-professor', ['tiago-menegaz']);
    comOpcoes('ctx-aluna', ['Vavá']);
    const porContexto = () => {
      boot.porId('ctx-escola').value = 'fita';
      boot.porId('ctx-professor').value = 'tiago-menegaz';
      // O CICLO NÃO ESTÁ AQUI (05/11/2026). Ele saiu do contexto da anamnese em 04/11/2026, e
      // preenchê-lo na prova simulava um estado que a página já não tem: a porta fechava por
      // outro motivo e a prova atribuía-o a um campo que não conta.
      boot.porId('ctx-aluna').value = 'Vavá';
    };
    porContexto();
    /* E EM MODO DE EDIÇÃO, que é o caminho que este bloco mede. A anamnese pede a senha para
     * ENTRAR (é a regra dela: a senha é pré-requisito de gravação, mas o ato novo começa com
     * ela); a EDIÇÃO não pede, e é por isso que o «Editar» da lista abre direto no formulário
     * (26/10/2026). Sem esta linha a prova pedia a entrada por um caminho que a página
     * legitimamente fecha — não havia defeito nenhum, havia um cenário errado. */
    boot.porta.setEditando('anamnese-20261016-1404');
    return boot.porta.iniciar().then(async () => {
      provar('COM o contexto do ato, a porta fica (não devolve à lista)',
        boot.destinos.length === 0,
        boot.destinos);
      const cliques = (boot.porId('gravar')._handlers || {}).click || [];
      provar('o «Guardar» liga o seu manipulador', cliques.length === 1, 'handlers=' + cliques.length);
      if (cliques.length !== 1) return;

      // `iniciar()` dispara buscas sem esperar por elas (alunas, professores, turmas): as
      // respostas podem reescrever os `select` por cima do que se pôs. Repõe-se depois de a
      // página assentar — e o `select` do mock só aceita um valor que tenha `<option>`, daí o
      // depósito interno (`_valor`), que é o que o `value` do elemento devolve.
      for (let i = 0; i < 8; i += 1) await new Promise((r) => setTimeout(r, 0));
      porContexto();

      boot.porta.setEditando('anamnese-20261016-1404');
      boot.porId('senha').value = 'segredo-do-professor';
      boot.porta.setSenhaValida(false);
      boot.chamadas.length = 0;
      await cliques[0]();
      const houvePut = boot.chamadas.some((c) => c.indexOf('anamnese-editar') !== -1);
      provar('SEM senha: a edição NÃO chega ao servidor', houvePut === false, boot.chamadas.join(' | '));
      provar('SEM senha: a recusa nomeia a senha',
        String(boot.porId('gravacao').innerHTML).indexOf('senha') !== -1,
        String(boot.porId('gravacao').innerHTML));

      boot.porta.setSenhaValida(true);
      boot.chamadas.length = 0;
      await cliques[0]();
      provar('COM senha: a edição CHEGA ao servidor (o PUT acontece)',
        boot.chamadas.some((c) => c.indexOf('anamnese-editar') !== -1), boot.chamadas.join(' | '));
      provar('GRAVOU: a senha não fica guardada no campo', boot.porId('senha').value === '',
        'campo=' + JSON.stringify(boot.porId('senha').value));
      provar('GRAVOU: o «validado» cai', boot.porta.senhaValida() === false);

      // (8b) A TELA DIZ O CARIMBO NOVO — a data da estante é a da última mudança, e o
      // professor precisa VER que ela mudou. O id que o servidor devolve é o que se mostra.
      boot.roteiro.editar = {
        ok: true, mudou: true, recarimbada: true,
        editada: 'anamnese-20261020-0730', anterior: 'anamnese-20261016-1404',
      };
      boot.porta.setEditando('anamnese-20261016-1404');
      boot.porId('senha').value = 'segredo-do-professor';
      boot.porta.setSenhaValida(true);
      boot.chamadas.length = 0;
      await cliques[0]();
      const dito = String(boot.porId('gravacao').innerHTML);
      provar('COM mudança: a tela mostra o carimbo NOVO',
        dito.indexOf('anamnese-20261020-0730') !== -1, dito);
      provar('COM mudança: e não mostra mais o antigo',
        dito.indexOf('anamnese-20261016-1404') === -1, dito);
      provar('COM mudança: e diz que o carimbo se refez',
        dito.indexOf('carimbo') !== -1, dito);

      boot.roteiro.editar = {
        ok: true, mudou: false, editada: 'anamnese-20261016-1404', anterior: 'anamnese-20261016-1404',
      };
      boot.porta.setEditando('anamnese-20261016-1404');
      boot.porId('senha').value = 'segredo-do-professor';
      boot.porta.setSenhaValida(true);
      boot.chamadas.length = 0;
      await cliques[0]();
      const semMudanca = String(boot.porId('gravacao').innerHTML);
      provar('SEM mudança: a tela diz que nada mudou', semMudanca.indexOf('nada mudou') !== -1, semMudanca);
      provar('SEM mudança: e mantém o carimbo de sempre',
        semMudanca.indexOf('anamnese-20261016-1404') !== -1, semMudanca);
      // Em qualquer dos casos a edição terminou: a senha cumpriu o papel e não fica.
      provar('SEM mudança: a senha também não fica', boot.porId('senha').value === '',
        'campo=' + JSON.stringify(boot.porId('senha').value));

      // (8c) A LISTA NÃO DEIXA A LINHA SUMIR. O recarimbo troca a chave do registro, e o
      // KV demora a listar a chave nova: sem acomodar, a professora veria a própria edição
      // desaparecer da estante. Aqui se prova que a tela troca o carimbo na hora.
      boot.porta.setFichas(['anamnese-20261016-1404', 'anamnese-20261016-1351']);
      boot.porta.setEstados([
        ['anamnese-20261016-1404', { carimbo: 'anamnese-20261016-1404', valor: 'Vavá', estado: 'solta' }],
        ['anamnese-20261016-1351', { carimbo: 'anamnese-20261016-1351', valor: 'Mari', estado: 'legado' }],
      ]);
      boot.porta.acomodarRecarimbo('anamnese-20261016-1404', 'anamnese-20261020-0730', 'Vavá');
      const depois = boot.porta.fichas();
      provar('o carimbo novo entra na lista', depois.indexOf('anamnese-20261020-0730') !== -1, depois.join(','));
      provar('e o carimbo antigo sai', depois.indexOf('anamnese-20261016-1404') === -1, depois.join(','));
      provar('e a outra aluna não se mexe', depois.indexOf('anamnese-20261016-1351') !== -1, depois.join(','));
      provar('o estado acompanha o carimbo novo',
        Boolean(boot.porta.estadoDe('anamnese-20261020-0730')), 'estado ausente');
      provar('e o sujeito da linha é preservado',
        boot.porta.estadoDe('anamnese-20261020-0730').valor === 'Vavá',
        JSON.stringify(boot.porta.estadoDe('anamnese-20261020-0730')));
      provar('o estado do carimbo antigo não fica órfão',
        boot.porta.estadoDe('anamnese-20261016-1404') === null);
      provar('a lista pintada cita o carimbo novo',
        String(boot.porId('lista-fichas').innerHTML).indexOf('anamnese-20261020-0730') !== -1,
        String(boot.porId('lista-fichas').innerHTML).slice(0, 200));

      // Sem recarimbo não há o que acomodar: a lista fica como está.
      boot.porta.acomodarRecarimbo('anamnese-20261020-0730', 'anamnese-20261020-0730', 'Vavá');
      provar('sem recarimbo a lista não muda',
        JSON.stringify(boot.porta.fichas()) === JSON.stringify(depois), boot.porta.fichas().join(','));

      // (9) EXCLUIR EXIGE A SENHA
      boot.roteiro.editar = { ok: true };
      boot.porta.setSenhaValida(false);
      boot.chamadas.length = 0;
      await boot.porta.apagarAnamnese('anamnese-20261016-1404');
      provar('SEM senha: a exclusão NÃO chega ao servidor',
        boot.chamadas.some((c) => c.indexOf('anamnese-vinculo') !== -1) === false,
        boot.chamadas.join(' | '));

      // (9b) FECHAR A ELICITAÇÃO — defesa em profundidade. O botão já nasce travado; o
      // guarda existe para o caminho do handler, que é por onde o motor seria gasto.
      boot.porta.setSenhaValida(false);
      boot.chamadas.length = 0;
      await boot.porta.fechar();
      provar('SEM senha: «fechar» NÃO consulta o motor (a prévia não roda)',
        boot.chamadas.some((c) => c.indexOf('elicitar') !== -1) === false,
        boot.chamadas.join(' | '));

      // (10) `editarAnamnese` LIGA o contexto — a função existir não basta; o que se prova
      // é a LIGAÇÃO. O resto da tela (roteiro, formulário) sai do escopo desta prova.
      for (const campo of porta.camposDoContexto) {
        const entrada = dom.porId.get('ctx-' + campo);
        if (entrada) entrada._valor = '';
      }
      // `editarAnamnese` é fire-and-forget (não devolve a promessa da cadeia): a prova
      // espera a cadeia assentar em vez de aguardar um retorno que não existe.
      porta.editarAnamnese('anamnese-20261016-1404');
      for (let i = 0; i < 8; i += 1) await new Promise((r) => setTimeout(r, 0));
      provar('editarAnamnese pré-preenche a ALUNA a partir do envelope',
        dom.porId.get('ctx-aluna').value === 'Vavá', 'aluna=' + dom.porId.get('ctx-aluna').value);
      provar('editarAnamnese pré-preenche também a ESCOLA',
        dom.porId.get('ctx-escola').value === 'fita', 'escola=' + dom.porId.get('ctx-escola').value);

      // (12) A PAGINAÇÃO DA ESTANTE — seis por página, e a sétima abre a segunda
      const oito = ['1351', '1352', '1353', '1354', '1355', '1356', '1357', '1358']
        .map((h) => 'anamnese-20261016-' + h);
      boot.porta.setFichas(oito);
      boot.porId('filtro-fichas').value = '';
      boot.porta.setPagina(1);
      boot.porta.pintarFichas();

      const linhas = (id) => (String(boot.porId(id).innerHTML).match(/<li>/g) || []).length;
      provar('a página traz SEIS linhas', linhas('lista-fichas') === 6, 'linhas=' + linhas('lista-fichas'));
      provar('e são as seis primeiras', String(boot.porId('lista-fichas').innerHTML).indexOf('anamnese-20261016-1356') !== -1);
      provar('a SÉTIMA não está na página 1',
        String(boot.porId('lista-fichas').innerHTML).indexOf('anamnese-20261016-1357') === -1);
      provar('com duas páginas o paginador aparece',
        boot.porId('paginacao').classList.contains('oculto') === false);
      provar('o paginador diz em que página se está',
        String(boot.porId('paginacao').innerHTML).indexOf('página 1 de 2') !== -1,
        String(boot.porId('paginacao').innerHTML));
      provar('o paginador conta os registros',
        String(boot.porId('paginacao').innerHTML).indexOf('8 registros') !== -1,
        String(boot.porId('paginacao').innerHTML));
      provar('o paginador oferece os botões das páginas',
        String(boot.porId('paginacao').innerHTML).indexOf('data-pagina="2"') !== -1);
      provar('e o «anterior» nasce desabilitado na primeira página',
        /<button[^>]*data-pagina="0"[^>]*disabled/.test(String(boot.porId('paginacao').innerHTML)),
        String(boot.porId('paginacao').innerHTML));

      boot.porta.irParaPagina(2);
      provar('a página 2 passa a valer', boot.porta.pagina() === 2, 'página=' + boot.porta.pagina());
      provar('a página 2 traz as DUAS restantes', linhas('lista-fichas') === 2,
        'linhas=' + linhas('lista-fichas'));
      provar('a sétima abre a página 2',
        String(boot.porId('lista-fichas').innerHTML).indexOf('anamnese-20261016-1357') !== -1);
      provar('e a primeira NÃO está mais lá',
        String(boot.porId('lista-fichas').innerHTML).indexOf('anamnese-20261016-1351') === -1);
      provar('o paginador acompanha', String(boot.porId('paginacao').innerHTML).indexOf('página 2 de 2') !== -1);
      provar('e a «seguinte» fica desabilitada na última página',
        /<button[^>]*data-pagina="3"[^>]*disabled/.test(String(boot.porId('paginacao').innerHTML)),
        String(boot.porId('paginacao').innerHTML));

      // Ir além da última não inventa página vazia: a página é limitada ao que existe.
      boot.porta.irParaPagina(99);
      provar('ir para além da última fica na última', boot.porta.pagina() === 2,
        'página=' + boot.porta.pagina());
      provar('e a lista não fica vazia', linhas('lista-fichas') === 2);

      // O FILTRO é do conjunto: procura nova, leitura do começo.
      boot.porta.irParaPagina(1);
      boot.porId('filtro-fichas').value = '1357';
      boot.porta.filtrarFichas();
      provar('filtrar volta à primeira página', boot.porta.pagina() === 1, 'página=' + boot.porta.pagina());
      provar('e a lista mostra só o que casa', linhas('lista-fichas') === 1,
        'linhas=' + linhas('lista-fichas'));
      provar('com uma página só, o paginador some',
        boot.porta.porId === undefined && boot.porId('paginacao').classList.contains('oculto') === true);

      // Com seis exatas, uma página: o paginador não aparece por nada.
      boot.porId('filtro-fichas').value = '';
      boot.porta.setFichas(oito.slice(0, 6));
      boot.porta.setPagina(1);
      boot.porta.pintarFichas();
      provar('seis fichas: seis linhas e nenhum paginador',
        linhas('lista-fichas') === 6 && boot.porId('paginacao').classList.contains('oculto') === true,
        'linhas=' + linhas('lista-fichas'));
      provar('o paginador fica limpo quando não há o que paginar',
        String(boot.porId('paginacao').innerHTML) === '', String(boot.porId('paginacao').innerHTML));

      /* (13) O ROTEIRO SÓ NA CONDUÇÃO — e SAIR É NAVEGAR, não esconder (02/11/2026).
       *
       * As três asserções que aqui estavam mediam o roteiro a esconder-se ao «voltar ao portal».
       * Esse portal já não existe nesta página: a abertura foi apagada (26/10/2026) e o «Sair»
       * passou a NAVEGAR para a lista (`voltarParaALista` → `location.replace`). O roteiro nasce
       * escondido no HTML (`<aside class="rail oculto">`) e aparece quando a condução abre; quem
       * sai da página não deixa um roteiro pendurado porque a página deixou de existir.
       *
       * Ficam as duas metades que continuam verdadeiras, medidas onde elas estão: o estado
       * inicial vem do HTML, e a saída é um DESTINO — que é o que se pode observar sem navegar. */
      provar('o roteiro nasce escondido no HTML (é a condução que o abre)',
        /<aside class="rail oculto" id="rail">/.test(fs.readFileSync(FONTE_HTML, 'utf8')));

      boot.porta.abrirFormulario(0, false);
      provar('na condução o roteiro aparece',
        boot.porId('rail').classList.contains('oculto') === false);
      provar('e a segunda coluna volta',
        boot.porId('principal').classList.contains('sem-roteiro') === false);

      boot.destinos.length = 0;
      boot.porta.voltarAoPortal();
      provar('sair da condução NAVEGA para a lista (o destino é declarado, não deduzido)',
        boot.destinos.length === 1 && /\/area-do-professor\/anamnese\/$/.test(boot.destinos[0]),
        boot.destinos);

      // (14) A TURMA DO PLANO: UMA POR PLANO, A JÁ FEITA BLOQUEADA — e o atalho para ela
      // A PÁGINA DO PLANO, e não a da anamnese: `turmasJaUsadas()` devolve vazio fora do
      // plano, por desenho — medir o bloqueio da turma na anamnese media o vazio.
      const bootDoPlano = carregarPortaIniciada('/plano-ensino/');
      /* O PROFESSOR DA BARRA, POSTO ANTES DE PERGUNTAR (02/11/2026). `listaDeTurmasDoProfessor`
       * devolve LISTA VAZIA quando não há professor — o recorte é dele, e sem ele não se sabe de
       * quem são as turmas. A prova pedia a grade sem o professor e lia «Escolha primeiro o
       * professor» em todas as doze asserções: medía o aviso, não a grade. As duas metades são
       * medidas: sem professor a tela DIZ o que falta (é o `avisoDaTurma`), com professor a
       * grade aparece. */
      const comProfessor = (boot, slug) => {
        const el = boot.porId('ctx-professor');
        if (!el.opcoes.some((o) => o.value === slug)) el.appendChild({ value: slug, textContent: slug });
        el.value = slug;
        boot.porId('ctx-escola').value = 'fita';
        boot.porId('ctx-ciclo').value = '01';
      };
      const gradeSemProfessor = bootDoPlano.porta.gradeDeOpcoesDinamicas({
        id: 'contexto-turma', campo: 'Turma observada', obrigatorio: true,
        aberto: true, opcoesDe: '/api/bastidores/turmas', daCuradoria: 'turmas',
      });
      provar('sem professor, a grade DIZ que é preciso escolher o professor (o recorte é dele)',
        gradeSemProfessor.indexOf('Escolha primeiro o professor') !== -1,
        gradeSemProfessor.slice(0, 120));
      comProfessor(bootDoPlano, 'tiago-menegaz');
      bootDoPlano.porta.setOpcoes('/api/bastidores/turmas', [
        { valor: 'Balé Nível 1' }, { valor: 'Balé Nível 2' }, { valor: 'Balé Nível 3' },
      ]);
      bootDoPlano.porta.setCuradorias([{ turmas: ['Balé Nível 1', 'Balé Nível 2', 'Balé Nível 3'] }]);
      // O Nível 1 já tem plano — o professor fez; o Nível 2 está ligado a um PO.
      bootDoPlano.porta.setEstados([
        ['plano-20261016-1000', { estado: 'solta', turma: 'Balé Nível 1', vinculada: false }],
        ['plano-20261016-1100', { estado: 'vinculada', turma: 'Balé Nível 2', vinculada: true }],
      ]);
      bootDoPlano.porta.setEditando(null);
      bootDoPlano.porta.setDerivando(null);
      bootDoPlano.porta.setRespostas([]);

      const noTurma = {
        id: 'contexto-turma', campo: 'Turma observada', obrigatorio: true,
        aberto: true, opcoesDe: '/api/bastidores/turmas', daCuradoria: 'turmas',
      };
      const grade = bootDoPlano.porta.gradeDeOpcoesDinamicas(noTurma);

      provar('a turma é escolha ÚNICA (radio, não caixa)',
        grade.indexOf('type="radio"') !== -1 && grade.indexOf('type="checkbox"') === -1,
        grade.slice(0, 200));
      provar('o Nível 1 (já planejado) fica DESABILITADO',
        /value="Balé Nível 1"[^>]*disabled/.test(grade), grade);
      provar('o Nível 2 (ligado a um PO) também fica desabilitado',
        /value="Balé Nível 2"[^>]*disabled/.test(grade), grade);
      provar('o Nível 3 (sem plano) segue LIVRE',
        /value="Balé Nível 3"[^>]*(?<!disabled)>/.test(grade.replace(/(disabled)/g, '$1')),
        grade);
      provar('a turma já planejada diz o estado do plano',
        grade.indexOf('>livre</span>') !== -1, grade);
      provar('e a ligada diz que está ligada', grade.indexOf('>ligada</span>') !== -1, grade);
      provar('o plano LIVRE oferece «ajustar o plano»',
        grade.indexOf('ajustar o plano') !== -1, grade);
      provar('e o atalho aponta para a EDIÇÃO daquele plano',
        /href="[^"]*editar=plano-20261016-1000/.test(grade), grade);
      provar('o plano LIGADO oferece «ver o plano», não a edição',
        grade.indexOf('ver o plano') !== -1 && !/editar=plano-20261016-1100/.test(grade), grade);
      /* O ATALHO DO LIGADO MUDOU DE DESTINO (02/11/2026) — e a prova tinha ficado no antigo.
       * Ele apontava para `api/envelope/<carimbo>` (o JSON cru); passou a apontar para
       * `api/plano-preenchido.<carimbo>?formato=html`, que é o documento LEGÍVEL — o mesmo
       * caminho que o PO e a aula já usam. A prova foi atualizada para o que a página faz; o que
       * ela guarda continua a ser o essencial: o plano ligado é LEITURA, e o atalho não oferece
       * `editar=`. */
      provar('e o atalho do ligado é a LEITURA do plano preenchido (não a edição)',
        /href="api\/plano-preenchido\.plano-20261016-1100\?formato=html"/.test(grade), grade);
      provar('o atalho abre em OUTRA aba',
        (grade.match(/target="_blank"/g) || []).length >= 2, grade);
      provar('a turma livre é a SUGERIDA (a primeira que ainda dá para planejar)',
        /value="Balé Nível 3"[^>]*checked/.test(grade), grade);
      provar('e as bloqueadas não vêm marcadas',
        !/value="Balé Nível 1"[^>]*checked/.test(grade), grade);

      // EDITAR o plano do Nível 1: a turma dele volta a estar disponível — senão a edição
      // seria impossível (o campo é obrigatório e a resposta dele é essa turma).
      bootDoPlano.porta.setEditando('plano-20261016-1000');
      const gradeEditando = bootDoPlano.porta.gradeDeOpcoesDinamicas(noTurma);
      provar('ao EDITAR, a turma daquele plano destrava',
        !/value="Balé Nível 1"[^>]*disabled/.test(gradeEditando), gradeEditando);
      provar('e o plano que se está a editar vem MARCADO',
        /value="Balé Nível 1"[^>]*checked/.test(gradeEditando), gradeEditando);
      provar('e as outras continuam bloqueadas',
        /value="Balé Nível 2"[^>]*disabled/.test(gradeEditando), gradeEditando);

      // DERIVAR do Nível 1: o elo novo é da MESMA turma, e a dela não pode bloquear.
      bootDoPlano.porta.setEditando(null);
      bootDoPlano.porta.setDerivando('plano-20261016-1000');
      const gradeDerivando = bootDoPlano.porta.gradeDeOpcoesDinamicas(noTurma);
      provar('ao DERIVAR, a turma de origem destrava',
        !/value="Balé Nível 1"[^>]*disabled/.test(gradeDerivando), gradeDerivando);
      bootDoPlano.porta.setDerivando(null);

      // Todas as turmas do professor já planejadas: a lista fica inteira bloqueada, e a tela
      // DIZ isso — em vez de deixar a leitura de «o sistema quebrou».
      bootDoPlano.porta.setCuradorias([{ turmas: ['Balé Nível 1', 'Balé Nível 2'] }]);
      const gradeTravada = bootDoPlano.porta.gradeDeOpcoesDinamicas(noTurma);
      provar('sem turma livre, a tela diz o que fazer',
        gradeTravada.indexOf('Todas as suas turmas já têm plano') !== -1, gradeTravada);
      provar('e não sugere nenhuma marcada',
        gradeTravada.indexOf('checked') === -1, gradeTravada);

      // Um plano com estado «derivada» (substituído) não bloqueia: a turma está com o
      // sucessor, que é quem a bloqueia.
      bootDoPlano.porta.setCuradorias([{ turmas: ['Balé Nível 1', 'Balé Nível 2', 'Balé Nível 3'] }]);
      bootDoPlano.porta.setEstados([
        ['plano-20261016-1000', { estado: 'legado', turma: 'Balé Nível 1', vinculada: false }],
      ]);
      const gradeLegado = bootDoPlano.porta.gradeDeOpcoesDinamicas(noTurma);
      provar('o plano SUBSTITUÍDO não bloqueia a turma',
        !/value="Balé Nível 1"[^>]*disabled/.test(gradeLegado), gradeLegado);
    });
  }).then(async () => {
    // (11) O PLANO também pré-preenche o contexto ao EDITAR/DERIVAR — o mesmo defeito da
    // anamnese, que o plano tinha e ninguém tinha visto.
    const plano = carregarPorta('/plano-ensino/');
    provar('a página do plano carrega com FONTE=plano', plano.porta.fonte === 'plano',
      'FONTE=' + plano.porta.fonte);
    provar('o contexto do plano NÃO inclui «aluna» (o plano é de todas)',
      plano.porta.camposDoContexto.indexOf('aluna') === -1, plano.porta.camposDoContexto.join(','));
    // Um nó SEM obrigatoriedade: assim o «Fechar» fica livre pela regra DELE (não há
    // obrigatório pendente), e a prova consegue distinguir a trava da senha da regra do fecho.
    plano.porta.setMapa({ nos: [{ id: 'n1', campo: 'Objetivo geral' }, { id: 'n2', campo: 'Marco' }], obrigatorios: 0, total: 2, respondidas: 0, tituloCabecalho: 'Prova' });
    for (const campo of plano.porta.camposDoContexto) {
      const el = plano.dom.porId.get('ctx-' + campo);
      if (el) el._valor = '';
    }
    plano.porta.carregarPlanoNaConducao({
      id: 'plano-20261016-1200',
      contexto: { escola: 'fita', professor: 'tiago-menegaz', ciclo: '01' },
      respostas: { 'objetivo-geral': { valor: 'Equilíbrio' } },
    });
    provar('carregarPlanoNaConducao pré-preenche a ESCOLA',
      plano.dom.porId.get('ctx-escola').value === 'fita',
      'escola=' + plano.dom.porId.get('ctx-escola').value);
    provar('carregarPlanoNaConducao pré-preenche o PROFESSOR',
      plano.dom.porId.get('ctx-professor').value === 'tiago-menegaz');
    provar('carregarPlanoNaConducao pré-preenche o CICLO',
      plano.dom.porId.get('ctx-ciclo').value === '01',
      'ciclo=' + plano.dom.porId.get('ctx-ciclo').value);
    // CRIAÇÃO do plano: a autorização é a CURADORIA — não a senha (13/10/2026).
    plano.porta.setEditando(null);
    plano.porta.setDerivando(null);
    plano.porta.setSenhaValida(false);
    provar('CRIAR plano não exige senha (a autorização é a curadoria)', plano.porta.exigeSenha() === false);
    plano.porta.travarFormularioSemSenha();
    provar('CRIAR plano: o «Pular» não existe', plano.dom.porId.has('pular') === false);
    provar('CRIAR plano: o «Fechar» segue a regra dele (sem obrigatório pendente)',
      plano.dom.porId.get('fechar').disabled === false,
      'fechar.disabled=' + plano.dom.porId.get('fechar').disabled);

    // EDITAR/DERIVAR o plano: aí SIM a senha governa (16/10/2026) — é escrita de quem o assina.
    const cxPlano = plano.dom.porId.get('pergunta');
    cxPlano._controles = [criarElemento('p1', 'input')];
    plano.porta.setEditando('plano-20261016-1200');
    provar('EDITAR plano exige senha', plano.porta.exigeSenha() === true);
    plano.porta.setSenhaValida(false);
    plano.porta.travarFormularioSemSenha();
    provar('EDITAR plano SEM senha: o controle fica desabilitado', cxPlano._controles[0].disabled === true);
    provar('EDITAR plano: o «Pular» não existe', plano.dom.porId.has('pular') === false);
    provar('EDITAR plano SEM senha: o «Fechar» fica travado', plano.dom.porId.get('fechar').disabled === true);
    // O `#anterior`/`#proxima` seguem a REGRA DO ROTEIRO (no índice 0, «Anterior» não tem para
    // onde ir) — a trava da senha não os toca. O «Sair» fica sempre livre.
    provar('EDITAR plano SEM senha: o «Próxima» segue LIVRE (a senha não trava a navegação)',
      plano.dom.porId.get('proxima').disabled === false,
      'proxima.disabled=' + plano.dom.porId.get('proxima').disabled);
    provar('EDITAR plano SEM senha: o «Sair» segue LIVRE', plano.dom.porId.get('sair').disabled === false);
    // `fechar()` de profundidade: sem senha, NÃO abre o fecho (não gasta o motor).
    plano.dom.porId.get('fecho').classList.add('oculto');
    await plano.porta.fechar();
    provar('EDITAR plano SEM senha: «fechar» não abre o fecho (o motor não roda)',
      plano.dom.porId.get('fecho').classList.contains('oculto') === true);
    plano.porta.setSenhaValida(true);
    plano.porta.travarFormularioSemSenha();
    provar('EDITAR plano COM senha: o controle volta a habilitar', cxPlano._controles[0].disabled === false);
    provar('EDITAR plano COM senha: o «Pular» não existe', plano.dom.porId.has('pular') === false);
    // DERIVAR também exige: o mesmo caminho governa o elo novo.
    plano.porta.setEditando(null);
    plano.porta.setDerivando('plano-20261016-1200');
    provar('DERIVAR plano exige senha', plano.porta.exigeSenha() === true);

    console.log('');
    if (falhas.length) {
      console.log('FALHARAM ' + falhas.length + ' de ' + (ok + falhas.length) + ' provas:');
      falhas.forEach((f) => console.log('  - ' + f));
      process.exit(1);
    }
    console.log(ok + ' prova(s) passaram, 0 falharam');
  });
}

main().catch((erro) => { console.error('erro na prova:', erro); process.exit(1); });
