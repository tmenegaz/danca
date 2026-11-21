#!/usr/bin/env node
'use strict';

/**
 * provar-curadoria-ilegivel.js — «não consegui olhar» não é «não há».
 *
 * O QUE MOTIVOU, e é o defeito do dia (21/11/2026). Ela foi ao Plano de Observação conferir a
 * ligação do eixo com o que se observa, e o formulário **não abriu**:
 *
 *   «Aí eu vim fazer a investigação, olhar aqui no plano de observação, e aí não abre o formulário.
 *    Tá quebrado o plano de observação.»
 *
 * O CAMINHO, medido na bancada. `atualizarCuradoria` lia
 * `/api/bastidores/curadoria-professor`; quando a leitura FALHAVA (rede, um 500, a cota do KV do
 * dia, um prazo), o `catch` deixava `CURADORIAS = []` e a linha seguinte, **sem condição**, punha
 * `CURADORIA_CARREGADA = true`. A partir dali a página afirmava duas coisas falsas de uma vez:
 *
 *   · «este professor ainda não tem curadoria atribuída pela direção» — uma afirmação sobre a
 *     DIREÇÃO, a partir de uma falha de rede;
 *   · e, pela `podePreencher`, o **formulário não abria**: o arranque fazia `voltarParaALista()`.
 *
 * E havia um segundo silêncio por baixo: o recado era escrito num `#aviso-curadoria` que **não
 * existia na marcação**. `getElementById` devolvia `null` nos três sítios, e as três frases iam
 * para o vazio. Por isso ela não leu explicação nenhuma.
 *
 * O QUE SE PROVA — e a segunda metade é a que impede a cura de ser pior do que a doença:
 *
 *   A. a leitura a FALHAR → o formulário ABRE, e a página diz que não conseguiu conferir (com o
 *      motivo), em vez de afirmar um facto sobre a direção;
 *   B. a leitura a responder «nenhuma curadoria» → a trava declarada continua a valer: o
 *      formulário não abre e a pessoa é devolvida à lista. A regra de 23/10 não se perdeu;
 *   C. a leitura a responder bem → nada é dito (o aviso fica escondido).
 *
 * COMO É MEDIDO. O `<script>` REAL de `porta/index.html` (extraído na hora, como em
 * `provar-ajustes-anamnese.js`), num DOM mínimo que responde por qualquer id, com o `fetch`
 * roteirizado por caso. Sem rede, sem Chrome, sem KV.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): o `porta/index.html` de `HEAD`, com as mesmas três
 * montagens. Espera-se que REPROVE a A — é isso que diz que a prova mede o defeito e não a si
 * mesma.
 *
 *   node experimentos/provar-curadoria-ilegivel.js [--controle-negativo]
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.indexOf('--controle-negativo') !== -1;

const HTML = (() => {
  if (!NEGATIVO) return fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8');
  try {
    return execFileSync('git', ['show', 'HEAD:porta/index.html'], { cwd: RAIZ, encoding: 'utf8' });
  } catch (e) {
    console.error('provar-curadoria-ilegivel: controle sem referência — NÃO FEITO.');
    process.exit(2);
  }
})();

let provas = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 300)));
}

/* O DOM MÍNIMO — um elemento por id, criado à medida do id (o `<select>` da turma tem de ser um
 * select, o botão um botão), como em `provar-ajustes-anamnese.js`. */
function criarElemento(id, tag) {
  const classes = new Set();
  return {
    id, tagName: String(tag || 'div').toUpperCase(), value: '', textContent: '', innerHTML: '',
    hidden: false, disabled: false, title: '', type: tag === 'button' ? 'button' : '',
    children: [], parentNode: null, style: {},
    classList: {
      add: (c) => classes.add(c), remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c), toggle: (c, v) => (v ? classes.add(c) : classes.delete(c)),
    },
    appendChild(f) { this.children.push(f); if (f) f.parentNode = this; return f; },
    insertBefore(f) { this.children.unshift(f); if (f) f.parentNode = this; return f; },
    removeChild(f) { this.children = this.children.filter((c) => c !== f); return f; },
    remove() {}, setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
    addEventListener() {}, removeEventListener() {}, focus() {}, querySelector() { return null; },
    querySelectorAll() { return []; }, closest() { return null; }, get firstChild() { return null; },
  };
}

/**
 * Monta a página com um `fetch` roteirizado.
 *
 * `curadoria` é o que a rota da curadoria responde:
 *   · `{ falha: 500 }`  → a leitura FALHA;
 *   · `{ curadorias: [] }` → responde bem, e não há curadoria;
 *   · `{ curadorias: [...] }` → responde bem e há.
 */
function montar(curadoria) {
  const html = HTML.replace(/<!-- NAV -->/g, '');
  const casados = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  let js = casados.map((m) => m[1]).join('\n;\n');
  js = js.replace(/^iniciar\(\);\s*$/m, '');
  js += `
globalThis.__porta = {
  atualizarCuradoria,
  setCuradorias: (l) => { CURADORIAS = l; },
  curadorias: () => CURADORIAS.slice(),
  carregada: () => CURADORIA_CARREGADA,
  /* typeof: no controle negativo a porta de HEAD não tem a variável, e a bancada tem de
   * REPROVAR a asserção — não rebentar a correr. */
  falhou: () => (typeof CURADORIA_FALHOU === 'undefined' ? null : CURADORIA_FALHOU),
  podePreencher: (r) => podePreencher(r),
  limparFalha: () => { if (typeof CURADORIA_FALHOU !== 'undefined') CURADORIA_FALHOU = null; },
};`;

  const memo = new Map();
  /* O PROFESSOR ESCOLHIDO — `atualizarCuradoria` sai cedo quando não há slug (é o estado de quem
   * ainda não escolheu), e uma bancada que o deixasse vazio mediria essa saída em vez da leitura. */
  memo.set('ctx-professor', Object.assign(criarElemento('ctx-professor', 'select'),
    { value: 'demi-plie' }));
  /* E a identidade do ato inteira: `podePreencher` sai cedo enquanto faltar escola, professor ou
   * ciclo — e com ela vazia o que se mediria era a falta de contexto, não a curadoria. */
  memo.set('ctx-escola', Object.assign(criarElemento('ctx-escola', 'select'), { value: 'breu' }));
  memo.set('ctx-ciclo', Object.assign(criarElemento('ctx-ciclo', 'select'), { value: '01' }));
  const porId = (id) => {
    if (!memo.has(id)) {
      const ehSelect = /^ctx-/.test(String(id));
      const ehBotao = /^(gravar|comecar|proxima|anterior|senha-[a-z]+)$/.test(String(id));
      memo.set(id, criarElemento(id, ehSelect ? 'select' : ehBotao ? 'button' : 'div'));
    }
    return memo.get(id);
  };
  const destinos = [];
  const pedidos = [];

  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    URL, URLSearchParams, Date, Math, JSON, Set, Map, Array, Object, String, Number, Boolean,
    Error, Promise, RegExp, Intl, setTimeout, clearTimeout, queueMicrotask,
    globalThis: null,
    location: {
      pathname: '/plano-observacao/',
      search: '?professor=demi-plie&escola=breu&ciclo=01&fonte=po',
      href: 'https://x/plano-observacao/',
      replace(alvo) { destinos.push(String(alvo)); },
      assign(alvo) { destinos.push(String(alvo)); },
    },
    document: {
      getElementById: porId,
      querySelector: (sel) => porId('sel:' + sel),
      querySelectorAll: () => [],
      createElement: (tag) => criarElemento('novo', tag),
      addEventListener() {},
      body: criarElemento('body', 'body'),
      documentElement: criarElemento('html', 'html'),
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    fetch: async (alvo) => {
      const caminho = String(alvo);
      pedidos.push(caminho);
      if (caminho.indexOf('curadoria-professor') !== -1) {
        if (curadoria && curadoria.falha) {
          return { ok: false, status: curadoria.falha, json: async () => { throw new Error('sem corpo'); } };
        }
        return { ok: true, status: 200, json: async () => ({ ok: true, ...curadoria }) };
      }
      if (caminho.indexOf('professores') !== -1) {
        return { ok: true, status: 200, json: async () => ({ ok: true,
          professores: [{ nome: 'Demi Plié', slug: 'demi-plie' }] }) };
      }
      if (caminho.indexOf('turmas') !== -1) {
        return { ok: true, status: 200, json: async () => ({ ok: true,
          turmas: ['Rosa'], opcoes: ['Rosa'] }) };
      }
      return { ok: true, status: 200, json: async () => ({ ok: true, opcoes: [], estados: [] }) };
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
  try {
    new vm.Script(js, { filename: 'porta/index.html:script' }).runInContext(sandbox);
  } catch (e) {
    return { erroDeSintaxe: String(e && e.message), porta: null, sandbox, destinos, pedidos };
  }
  return { porta: sandbox.__porta, sandbox, destinos, pedidos, aviso: porId('aviso-curadoria') };
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  /* ========================================================================================= */
  console.log(NEGATIVO
    ? '\nCONTROLE NEGATIVO — as mesmas asserções contra a porta de HEAD (a A tem de REPROVAR)'
    : '\nA CURADORIA ILEGÍVEL — o formulário não se fecha por não se ter podido olhar');

  /* ----------------------------------------------------------------------------------------- */
  console.log('\nA. A leitura FALHA (500) — o formulário abre, e a página diz que não conferiu');
  /* ----------------------------------------------------------------------------------------- */
  {
    const m = montar({ falha: 500 });
    provar('a página monta (o script real corre sem erro de sintaxe)',
      Boolean(m.porta), m.erroDeSintaxe);
    if (m.porta) {
      m.sandbox.SENHA_VALIDA = true;
      m.porta.setCuradorias([]);
      await m.porta.atualizarCuradoria();
      await espera(10);
      provar('a leitura que falhou NÃO se declara concluída',
        m.porta.carregada() === false, m.porta.carregada());
      provar('…e o motivo fica guardado, para a tela poder dizê-lo',
        Boolean(m.porta.falhou()), m.porta.falhou());
      /* A MARCA TEM DE NOMEAR O QUE ACONTECEU. Um booleano não serve: a frase que a pessoa lê diz
       * «o servidor respondeu 500», e é essa a diferença entre informar e desculpar-se. */
      provar('…e o motivo nomeia a resposta do servidor',
        /500/.test(String(m.porta.falhou())), m.porta.falhou());
      provar('o formulário NÃO é fechado por uma leitura que falhou',
        m.porta.podePreencher(true) === true, m.porta.podePreencher(true));
      provar('…e a página não é devolvida à lista',
        m.destinos.length === 0, m.destinos);
      provar('o recado da curadoria tem um lugar na marcação (o `#aviso-curadoria` existia só no código)',
        /id="aviso-curadoria"/.test(HTML));
      provar('…e é nesse lugar que a frase da falha é escrita',
        Boolean(m.aviso) && /não consegui conferir a curadoria/i.test(String(m.aviso.textContent)),
        m.aviso && m.aviso.textContent);
    }
  }

  /* ----------------------------------------------------------------------------------------- */
  console.log('\nB. A leitura responde «nenhuma curadoria» — a trava de 23/10 continua a valer');
  /* ----------------------------------------------------------------------------------------- */
  {
    const m = montar({ curadorias: [] });
    if (m.porta) {
      m.sandbox.SENHA_VALIDA = true;
      m.porta.setCuradorias([]);
      await m.porta.atualizarCuradoria();
      await espera(10);
      provar('a leitura respondida declara-se concluída', m.porta.carregada() === true);
      provar('…e não guarda falha nenhuma', !m.porta.falhou(), m.porta.falhou());
      provar('sem curadoria, o plano e o PO NÃO abrem (a regra declarada)',
        m.porta.podePreencher(true) === false);
      if (m.aviso) {
        provar('…e o recado diz o que a direção tem de fazer, e não que houve um erro',
          /ainda não tem curadoria atribuída/i.test(String(m.aviso.textContent))
          && !/não consegui conferir/i.test(String(m.aviso.textContent)),
          m.aviso.textContent);
      }
    }
  }

  /* ----------------------------------------------------------------------------------------- */
  console.log('\nC. A leitura responde bem — não se diz nada');
  /* ----------------------------------------------------------------------------------------- */
  {
    const m = montar({ curadorias: [{ turmas: ['Rosa'], alunas: ['Aluna A'], linhaDeBase: 'tami' }] });
    if (m.porta) {
      m.sandbox.SENHA_VALIDA = true;
      await m.porta.atualizarCuradoria();
      await espera(10);
      provar('a lista chega, completa', m.porta.curadorias().length === 1);
      provar('…o formulário abre', m.porta.podePreencher(true) === true);
      provar('…e o aviso fica escondido',
        !m.aviso || m.aviso.classList.contains('oculto') || !String(m.aviso.textContent).trim(),
        m.aviso && m.aviso.textContent);
    }
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + provas + ' asserções: uma leitura da curadoria que falha deixa de '
    + 'fechar o formulário e passa a dizer-se — «não consegui conferir» é outra coisa que «a '
    + 'direção não curou» —, e a trava do que não tem curadoria nenhuma continua a valer.');
})();
