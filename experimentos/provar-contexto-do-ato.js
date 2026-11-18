#!/usr/bin/env node
'use strict';

/*
 * provar-contexto-do-ato.js — prova, executando o código REAL da porta, que
 *   (1) o campo do contexto que falta é DITO antes de o professor escrever (a barra
 *       marca o campo e o resumo nomeia o que falta);
 *   (2) a recusa do fecho APONTA o campo — abre o acordeão, rola e foca — e explica
 *       por que a anamnese pede um «ciclo» que ela não pergunta;
 *   (3) o «Começar» se trava com o MESMO critério do fecho, e não dois critérios
 *       diferentes (era o defeito: o começo pedia senha e aluna; o fecho pedia
 *       escola, professor e ciclo);
 *   (4) o `?aluna=` que o PO manda no atalho «criar a anamnese de …» SOBREVIVE —
 *       antes ele era descartado em silêncio pelo `select` sem opções.
 *
 * O que se executa é o `<script>` de `porta/index.html`, extraído na hora: não há
 * cópia da lógica aqui. O DOM é falso e mínimo.
 *
 *   uso: node experimentos/provar-contexto-do-ato.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.resolve(__dirname, '..');
const FONTE = path.join(RAIZ, 'porta/index.html');

let ok = 0;
const falhas = [];
function provar(nome, condicao, detalhe) {
  if (condicao) { ok++; return; }
  falhas.push(nome + (detalhe ? ' — ' + detalhe : ''));
}

// ---------------------------------------------------------------- o DOM falso

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
    _tem: (c) => conjunto.has(c),
  };
}

/*
 * Um elemento com o MÍNIMO que as funções provadas usam. Os dois `select` recebem
 * o comportamento do DOM de verdade que É a causa do defeito 4: atribuir um valor
 * que não corresponde a nenhuma `<option>` NÃO cola — o valor vira string vazia.
 */
function criarElemento(id, tag) {
  const el = {
    id,
    tagName: tag,
    _valor: '',
    textContent: '',
    innerHTML: '',
    disabled: false,
    title: '',
    open: false,
    style: {},
    classList: criarClasse([]),
    opcoes: [],
    _pai: null,
    _focado: false,
    _rolou: false,
    addEventListener() {},
    closest(sel) { return sel === '.campo' ? el._pai : null; },
    scrollIntoView() { el._rolou = true; },
    focus() { el._focado = true; },
  };
  Object.defineProperty(el, 'value', {
    get() { return el._valor; },
    set(v) {
      if (tag === 'select') {
        // O DOM DE VERDADE: sem a opção correspondente, a atribuição é descartada.
        const achou = el.opcoes.some((o) => o.value === v);
        el._valor = achou ? v : '';
        return;
      }
      el._valor = v === undefined || v === null ? '' : String(v);
    },
  });
  Object.defineProperty(el, 'selectedIndex', {
    get() { return el.opcoes.findIndex((o) => o.value === el._valor); },
  });
  Object.defineProperty(el, 'options', { get() { return el.opcoes; } });
  // `innerHTML` das opções: reconstrói as opções como o navegador faria.
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html || ''; },
    set(h) {
      el._html = h;
      if (tag !== 'select') return;
      const guardado = el._valor;
      el.opcoes = [];
      for (const m of String(h).matchAll(/<option value="([^"]*)"[^>]*>/g)) {
        el.opcoes.push({ value: m[1] });
      }
      // Reconstruir o `innerHTML` de um select PRESERVA a seleção se a opção voltar.
      el._valor = el.opcoes.some((o) => o.value === guardado) ? guardado : '';
    },
  });
  return el;
}

// A árvore: cada campo do contexto mora numa caixa `.campo`, que é o que se marca.
function montarDocumento() {
  const porId = new Map();
  const definir = (id, tag) => {
    const el = criarElemento(id, tag);
    const caixa = criarElemento('caixa-' + id, 'span');
    caixa.classList = criarClasse(['campo']);
    el._pai = caixa;
    caixa._filho = el;
    porId.set(id, el);
    return el;
  };
  definir('ctx-escola', 'input');
  definir('ctx-professor', 'select');
  definir('ctx-ciclo', 'input');
  definir('ctx-aluna', 'select');
  /* A MODALIDADE CONTRATADA NA BARRA (18/11/2026): uma LEITURA, e a linha só aparece quando o
   * pedido a declara. Os dois elementos que a função procura. */
  definir('ctx-modalidade-campo', 'span');
  definir('ctx-modalidade-conteudo', 'span');
  const comecar = criarElemento('comecar', 'button');
  porId.set('comecar', comecar);
  const acc = criarElemento('acordeao', 'details');
  const resumo = criarElemento('resumo', 'span');
  acc.classList = criarClasse([]);
  return { porId, comecar, acc, resumo };
}

// ------------------------------------------------------------------ o contexto

function carregarPorta(opcoes) {
  const fonte = fs.readFileSync(FONTE, 'utf8');
  const linhas = fonte.split('\n');
  const ini = linhas.findIndex((l) => l.trim() === '<script>');
  const fim = linhas.findIndex((l, i) => i > ini && l.trim() === '</script>');
  let js = linhas.slice(ini + 1, fim).join('\n');
  // O boot faz fetch e não é o objeto da prova: fora.
  js = js.replace(/^iniciar\(\);\s*$/m, '');
  js += '\nglobalThis.__porta = { contextoFaltando, contextoDaBarra, marcarContextoFaltando,'
      + ' atualizarComecar, carregarAlunas, carregarProfessores, aplicarCuradoria, FONTE,'
      + ' pintarModalidadeDoAto,'
      + ' definirCuradoria: (carregada, lista) => { CURADORIA_CARREGADA = carregada; CURADORIAS = lista; } };';

  const dom = montarDocumento();
  const url = new URL('https://fita.tmenegaz77.workers.dev' + opcoes.caminho);

  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    URLSearchParams,
    URL,
    Date,
    Math,
    JSON,
    Set,
    Map,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Error,
    Promise,
    RegExp,
    Intl,
    setTimeout,
    clearTimeout,
    globalThis: null,
    location: { pathname: url.pathname, search: url.search, href: url.href },
    document: {
      getElementById: (id) => dom.porId.get(id) || null,
      querySelector: (sel) => {
        if (sel === '.barra details.ctx-ato .ctx-resumo') return dom.resumo;
        if (sel === '.barra details.ctx-ato') return dom.acc;
        return null;
      },
      querySelectorAll: () => [],
      addEventListener() {},
      body: criarElemento('body', 'body'),
      documentElement: criarElemento('html', 'html'),
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    fetch: async (alvo) => {
      if (String(alvo).indexOf('alunas') !== -1) {
        /* O RECORTE DA ANAMNESE PASSOU A SER DO SERVIDOR (23/10/2026). A tela já não
           re-acrescenta nada: ela desenha a lista que o servidor manda, e o `?aluna=` vai no
           ENDEREÇO da consulta. Este stub faz o que a rota faz — devolve a lista e, se a aluna
           pedida não está no cadastro, acrescenta-a —, para a prova continuar a medir a sua
           parte: que o campo SELECCIONA a aluna que o servidor aceitou. A regra em si
           (quem é autorizada) mede-se em `provar-alunas-da-anamnese.js`, contra o motor. */
        const pedida = new URL(String(alvo), 'https://x').searchParams.get('aluna') || '';
        const lista = (opcoes.alunas || []).slice();
        if (pedida && lista.indexOf(pedida) === -1) lista.push(pedida);
        return { ok: true, json: async () => ({ ok: true, alunas: lista }) };
      }
      if (String(alvo).indexOf('professores') !== -1) {
        return { ok: true, json: async () => ({ ok: true, professores: opcoes.professores || [] }) };
      }
      return { ok: true, json: async () => ({}) };
    },
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
  return { porta: sandbox.__porta, dom, sandbox };
}

function preencher(dom, valores) {
  for (const [id, valor] of Object.entries(valores)) {
    const el = dom.porId.get(id);
    if (!el) continue;
    if (el.tagName === 'select') {
      el.innerHTML = '<option value="">— nenhum —</option>' +
        (valor.opcoes || []).map((o) => '<option value="' + o + '">' + o + '</option>').join('');
      el.value = valor.escolhido || '';
    } else {
      el.value = valor;
    }
  }
}

// =========================================================== as quatro provas

async function main() {

// ---------------------------------------------- 1) a barra diz o que falta

{
  // O caminho do DEFEITO: entrando pelos Bastidores, sem `?ciclo=` na URL.
  const { porta, dom } = carregarPorta({
    caminho: '/anamnese/?professor=tiago-menegaz&escola=fita',
    alunas: [],
  });
  provar('FONTE é anamnese no caminho /anamnese/', porta.FONTE === 'anamnese', porta.FONTE);

  /* A ANAMNESE NÃO PEDE CICLO (04/11/2026). «A anamnese pertence ao ALUNO, não ao ciclo» — uma
   * aluna que entra no ciclo 50 não fez os 49 anteriores. O contexto dela são TRÊS campos, e o
   * que falta aqui é o que se deixa vazio de propósito: a ALUNA. */
  preencher(dom, {
    'ctx-escola': 'fita',
    'ctx-professor': { opcoes: ['tiago-menegaz'], escolhido: 'tiago-menegaz' },
    'ctx-ciclo': '',
    'ctx-aluna': { opcoes: ['Mari'], escolhido: '' },
  });

  provar('o contexto da anamnese não inclui o ciclo — falta só a aluna',
    JSON.stringify(porta.contextoFaltando()) === JSON.stringify(['aluna']),
    JSON.stringify(porta.contextoFaltando()));

  porta.marcarContextoFaltando();
  const caixa = (id) => dom.porId.get(id)._pai;
  provar('a barra MARCA a caixa da aluna', caixa('ctx-aluna').classList._tem('falta'));
  provar('e NÃO marca a do ciclo — ele não é campo desta fonte',
    !caixa('ctx-ciclo').classList._tem('falta'));
  provar('e não marca a da escola', !caixa('ctx-escola').classList._tem('falta'));
  provar('nem a do professor', !caixa('ctx-professor').classList._tem('falta'));
  provar('o resumo da barra nomeia o que falta',
    /falta aluna para fechar/.test(dom.resumo.innerHTML), dom.resumo.innerHTML);
  provar('e o resumo mostra os campos do ato — sem ciclo',
    /escola/.test(dom.resumo.innerHTML) && /aluna/.test(dom.resumo.innerHTML)
    && !/·\s*ciclo/.test(dom.resumo.innerHTML), dom.resumo.innerHTML);

  // Preencher a aluna limpa a marca — a barra não fica acusando o que já está lá.
  dom.porId.get('ctx-aluna').value = 'Mari';
  porta.marcarContextoFaltando();
  provar('preenchida a aluna, a marca sai', !caixa('ctx-aluna').classList._tem('falta'));

  // ------------------------------------------ 3) o «Começar» usa a MESMA regra
  porta.atualizarComecar();
  provar('com contexto completo, mas SEM senha, o Começar não abre para a anamnese',
    dom.porId.get('comecar').disabled === true);
  provar('e o botão diz o que falta (a senha)',
    /senha/i.test(dom.porId.get('comecar').title), dom.porId.get('comecar').title);

  dom.porId.get('ctx-aluna').value = '';
  porta.atualizarComecar();
  provar('sem a aluna, o Começar fica travado mesmo com a senha dada',
    dom.porId.get('comecar').disabled === true);
  provar('e o title nomeia o campo que falta',
    /desde a aluna|falta|contexto do ato/i.test(dom.porId.get('comecar').title),
    dom.porId.get('comecar').title);
  provar('o title cita «aluna»',
    /aluna/.test(dom.porId.get('comecar').title), dom.porId.get('comecar').title);
  /* CONTROLE NEGATIVO: o CICLO vazio já não trava nada nesta fonte. Se travasse, a anamnese
   * continuaria a pedir um campo que deixou de ter. */
  dom.porId.get('ctx-aluna').value = 'Mari';
  dom.porId.get('ctx-ciclo').value = '';
  porta.atualizarComecar();
  provar('CONTROLE: com a aluna escolhida, o ciclo vazio NÃO trava o Começar',
    !/falta ciclo/i.test(dom.porId.get('comecar').title), dom.porId.get('comecar').title);
}

// ------------------------------------ 2) o fecho recusa, e APONTA o campo

{
  const { porta, dom } = carregarPorta({
    caminho: '/anamnese/?professor=tiago-menegaz&escola=fita',
  });
  preencher(dom, {
    'ctx-escola': 'fita',
    'ctx-professor': { opcoes: ['tiago-menegaz'], escolhido: 'tiago-menegaz' },
    'ctx-ciclo': '',
    'ctx-aluna': { opcoes: ['Mari'], escolhido: '' },
  });

  let mensagem = '';
  try { porta.contextoDaBarra(); } catch (erro) { mensagem = erro.message; }

  provar('o fecho RECUSA com a aluna vazia', mensagem !== '');
  provar('a mensagem nomeia o campo vazio', /aluna/.test(mensagem), mensagem);
  provar('a mensagem diz ONDE fica o campo',
    /barra/i.test(mensagem) && /alto/i.test(mensagem), mensagem);
  provar('a mensagem EXPLICA o que é o contexto — e nomeia os campos DESTA fonte',
    /não é conteúdo deste formulário/.test(mensagem) && /a aluna/.test(mensagem)
    && !/e ciclo/.test(mensagem), mensagem);
  provar('a mensagem diz que o que já foi respondido está guardado',
    /guardado/i.test(mensagem), mensagem);
  provar('a mensagem NÃO é a antiga', !/^preencha o contexto na barra/.test(mensagem), mensagem);
  provar('e o acordeão foi ABERTO — o campo pode estar recolhido',
    dom.acc.open === true);
  provar('a caixa da aluna ficou marcada depois da recusa',
    dom.porId.get('ctx-aluna')._pai.classList._tem('falta'));
  provar('e o foco foi para o campo que falta',
    dom.porId.get('ctx-aluna')._focado === true);
  provar('a barra foi levada à vista (scrollIntoView)',
    dom.porId.get('ctx-aluna')._rolou === true);

  /* Com tudo preenchido, o contexto sai — e NÃO leva ciclo: o envelope da anamnese deixou de o
   * declarar, e é isso que a torna atemporal (e o que impede que ela crie um ciclo na lista). */
  dom.porId.get('ctx-aluna').value = 'Mari';
  dom.porId.get('ctx-ciclo').value = '01';
  const ctx = porta.contextoDaBarra();
  provar('com a aluna escolhida, o contexto sai inteiro',
    ctx.escola === 'fita' && ctx.professor === 'tiago-menegaz' && ctx.aluna === 'Mari',
    JSON.stringify(ctx));
  provar('CONTROLE NEGATIVO — o ciclo NÃO entra no contexto da anamnese, mesmo preenchido',
    !Object.prototype.hasOwnProperty.call(ctx, 'ciclo'), JSON.stringify(ctx));
}

// ------------------------- 4) o `?aluna=` que o PO manda SOBREVIVE à lista

{
  // O atalho do PO: «criar a anamnese de Mari» → `?…&aluna=Mari`.
  const { porta, dom } = carregarPorta({
    caminho: '/anamnese/?escola=fita&professor=tiago-menegaz&ciclo=01&aluna=Mari',
    alunas: ['Mari', 'Vavá', 'Dani', 'Leti'],
  });
  // A barra nasce como o boot a deixa: a URL foi lida ANTES das opções existirem.
  dom.porId.get('ctx-escola').value = 'fita';
  dom.porId.get('ctx-ciclo').value = '01';
  dom.porId.get('ctx-aluna').value = 'Mari';   // o `select` sem opções DESCARTA este valor
  provar('o DOM de verdade descarta o valor do select sem opções (premissa do defeito)',
    dom.porId.get('ctx-aluna').value === '', dom.porId.get('ctx-aluna').value);

  await porta.carregarAlunas();
  provar('depois de carregar a lista, a aluna da URL está SELECIONADA',
    dom.porId.get('ctx-aluna').value === 'Mari', dom.porId.get('ctx-aluna').value);
  provar('e a lista continua inteira (as quatro da escola)',
    dom.porId.get('ctx-aluna').opcoes.length === 5, /* + a "— nenhuma —" */
    String(dom.porId.get('ctx-aluna').opcoes.length) + ' | ' +
    dom.porId.get('ctx-aluna').opcoes.map((o) => o.value).join(',') + ' | ' +
    String(dom.porId.get('ctx-aluna')._html).slice(0, 200));
}

{
  // A aluna que o sistema mandou e a Produção ainda não cadastrou não se perde.
  const { porta, dom } = carregarPorta({
    caminho: '/anamnese/?escola=fita&professor=tiago-menegaz&ciclo=01&aluna=Ju',
    alunas: ['Mari', 'Vavá'],
  });
  await porta.carregarAlunas();
  provar('aluna da URL fora da lista entra assim mesmo (foi o sistema que a mandou)',
    dom.porId.get('ctx-aluna').value === 'Ju', dom.porId.get('ctx-aluna').value ||
    '(vazio)');
}

{
  // CONTROLE NEGATIVO: sem `?aluna=`, o seletor segue em «nenhuma» — a correção
  // não inventa aluna nenhuma.
  const { porta, dom } = carregarPorta({
    caminho: '/anamnese/?escola=fita&professor=tiago-menegaz&ciclo=01',
    alunas: ['Mari', 'Vavá'],
  });
  await porta.carregarAlunas();
  provar('CONTROLE NEGATIVO — sem ?aluna=, nada é escolhido',
    dom.porId.get('ctx-aluna').value === '', dom.porId.get('ctx-aluna').value || '(vazio)');
}

{
  // O PO não tem o campo `aluna` no contexto: a correção não o exige lá.
  const { porta, dom } = carregarPorta({
    caminho: '/plano-observacao/?escola=fita&professor=tiago-menegaz&ciclo=01',
  });
  provar('no PO a fonte é po', porta.FONTE === 'po', porta.FONTE);
  dom.porId.get('ctx-escola').value = 'fita';
  dom.porId.get('ctx-ciclo').value = '01';
  dom.porId.get('ctx-professor').innerHTML = '<option value="">— escolher —</option><option value="tiago-menegaz">Tiago</option>';
  dom.porId.get('ctx-professor').value = 'tiago-menegaz';
  provar('no PO o contexto completo são três campos (sem aluna)',
    porta.contextoFaltando().length === 0, JSON.stringify(porta.contextoFaltando()));
  provar('e o Começar do PO abre sem senha', (() => {
    porta.atualizarComecar();
    return dom.porId.get('comecar').disabled === false;
  })());

  // E no PO, sem o ciclo, o Começar se trava — o mesmo defeito, ali também.
  dom.porId.get('ctx-ciclo').value = '';
  porta.atualizarComecar();
  provar('no PO, sem o ciclo, o Começar fica travado',
    dom.porId.get('comecar').disabled === true);
}

{
  // A trava da CURADORIA não pode ser dissolvida pela minha: as duas somam.
  const { porta, dom } = carregarPorta({
    caminho: '/plano-observacao/?escola=fita&professor=tiago-menegaz&ciclo=01',
  });
  dom.porId.get('ctx-escola').value = 'fita';
  dom.porId.get('ctx-ciclo').value = '01';
  dom.porId.get('ctx-professor').innerHTML =
    '<option value="">— escolher —</option><option value="tiago-menegaz">Tiago</option>';
  dom.porId.get('ctx-professor').value = 'tiago-menegaz';

  // Sem curadoria atribuída, a direção ainda não curou: o PO não começa.
  porta.definirCuradoria(true, []);
  porta.aplicarCuradoria();
  provar('CONTROLE — sem curadoria, o Começar do PO fica travado mesmo com o contexto completo',
    dom.porId.get('comecar').disabled === true);

  // COM curadoria, a trava sai — e é aqui que a versão anterior ficava presa: ela
  // desligava sem nunca religar ao trocar de professor.
  porta.definirCuradoria(true, [{ modalidade: 'balé clássico' }]);
  porta.aplicarCuradoria();
  provar('com curadoria e contexto completo, o Começar do PO abre',
    dom.porId.get('comecar').disabled === false);

  // E voltando para um professor sem curadoria, trava de novo.
  porta.definirCuradoria(true, []);
  porta.aplicarCuradoria();
  provar('voltando a um professor sem curadoria, trava outra vez',
    dom.porId.get('comecar').disabled === true);
}

// ------------------------------- 5) a modalidade contratada é uma LEITURA na barra

/* O QUE ELA PEDIU (18/11/2026): «é bom dizer aqui no contexto do ato, onde diz qual é o
 * professor, a aluna, e colocar aqui qual é a modalidade contratada» — e, na mesma frase, o que
 * a modalidade NÃO é: «não tem aqui nada de ação para o professor».
 *
 * São duas metades, e as duas se medem: a linha aparece com o valor que o pedido traz, e NÃO
 * aparece quando o pedido não a traz. A segunda metade é a que impede a tela de declarar «—»
 * sobre um ato que simplesmente não declarou modalidade nenhuma. */
{
  const comModalidade = carregarPorta({
    caminho: '/anamnese/?professor=tiago-menegaz&escola=fita&aluna=Mari&modalidade=Bal%C3%A9%20cl%C3%A1ssico',
    alunas: ['Mari'],
  });
  comModalidade.porta.pintarModalidadeDoAto();
  const caixa = comModalidade.dom.porId.get('ctx-modalidade-campo');
  const texto = comModalidade.dom.porId.get('ctx-modalidade-conteudo');
  provar('a modalidade do pedido aparece escrita na barra',
    texto.textContent === 'Balé clássico', texto.textContent);
  provar('…e o campo fica à vista (não nasce escondido quando há o que dizer)',
    caixa.hidden === false, caixa.hidden);

  const semModalidade = carregarPorta({
    caminho: '/anamnese/?professor=tiago-menegaz&escola=fita&aluna=Mari',
    alunas: ['Mari'],
  });
  semModalidade.porta.pintarModalidadeDoAto();
  const caixaSem = semModalidade.dom.porId.get('ctx-modalidade-campo');
  provar('sem modalidade no pedido, a linha NÃO aparece — não se declara o que não se sabe',
    caixaSem.hidden === true, caixaSem.hidden);

  /* E ELA NÃO É CAMPO: a anamnese com modalidade continua a fechar com os mesmos três do
   * contexto. Se a modalidade entrasse em CAMPOS_DO_CONTEXTO, o ato passaria a pedir ao
   * professor uma coisa que não é dele. */
  preencher(comModalidade.dom, {
    'ctx-escola': 'fita',
    'ctx-professor': { opcoes: ['tiago-menegaz'], escolhido: 'tiago-menegaz' },
    'ctx-aluna': { opcoes: ['Mari'], escolhido: 'Mari' },
  });
  /* A LIGAÇÃO — o que esta secção não pode deixar de fora: a função existir e ninguém a
   * chamar daria uma prova verde sobre uma barra que nunca mostra a modalidade. O arranque não
   * corre neste harness (faz fetch), e por isso a ligação mede-se no fonte: a chamada, e a peça
   * que ela preenche. */
  const fontePorta = fs.readFileSync(FONTE, 'utf8');
  provar('o arranque da anamnese PINTA a modalidade (senão a função é código morto)',
    /if \(FONTE === 'anamnese'\) pintarModalidadeDoAto\(\);/.test(fontePorta));
  provar('…e a barra tem a peça da leitura, com o rótulo e o valor',
    /id="ctx-modalidade-campo"[\s\S]{0,200}class="ctx-rotulo">modalidade</.test(fontePorta)
    && /id="ctx-modalidade-conteudo"/.test(fontePorta));

  provar('a modalidade NÃO entra nos campos que o professor tem de preencher',
    JSON.stringify(comModalidade.porta.contextoFaltando()) === JSON.stringify([]),
    JSON.stringify(comModalidade.porta.contextoFaltando()));
}

// ------------------------------------------------------------------- relatório

}  // fim de main()

main().then(() => {
  console.log(ok + ' prova(s) passaram, ' + falhas.length + ' falharam');
  for (const f of falhas) console.log('  FALHOU: ' + f);
  process.exit(falhas.length ? 1 : 0);
});
