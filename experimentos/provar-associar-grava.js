#!/usr/bin/env node
'use strict';

/*
 * provar-associar-grava.js — o par (modalidade, professor) do passo «Associar» fica gravado na sala
 * (19/11/2026).
 *
 * O QUE ELA VIU, e são três frases que descrevem um defeito só:
 *
 *   «Quando eu criei a sala e fui associar, o step dois que se chama associar, eu escolhi o professor
 *   pela modalidade […] a tradição veio correto, a régua também veio de forma correta, mas quando eu
 *   gravei o professor na listagem não aparece nada no nicho professor.»
 *
 *   «A listagem do campo professor diz que esta sala ainda não diz a modalidade que aí se ensina. A
 *   modalidade escolhe-se em editar no passo um, o professor no passo dois. Não existe mais passo
 *   dois com professor aqui nas salas, então essa mensagem está errada.»
 *
 *   «Eu estou em salas e não persistiu os dados que eu gravei na associação no step dois associar.»
 *
 * AS DUAS CAUSAS, e a segunda foi encontrada a medir a primeira:
 *
 *   1. O «Gravar sala» de uma sala que já existe fazia DOIS pedidos — a sala (`turma-editar` ou
 *      `turma-derivar`) e, no callback do primeiro, o par por `turma-professor`. A cadeia partia-se
 *      em silêncio de duas maneiras: a recarga que segue a gravação derrubava o segundo pedido a
 *      meio do voo; e na derivação o segundo pedido apontava para o id ANTIGO, escrevendo o
 *      professor no elo que desceu ao histórico. A sala ficava gravada e o professor não.
 *   2. `normalizarTurma` emite `modalidade` e `professor` SEMPRE — vazios quando o corpo não os
 *      manda —, e a edição copiava os campos presentes: corrigir o ritmo de uma sala a partir de um
 *      cliente que não mandasse o par APAGAVA a associação.
 *
 * A CORREÇÃO. As três rotas da sala partilham uma conferência (`conferirOParDaSala`), e as duas que
 * escrevem a sala passam a gravar o par na MESMA escrita. O cliente faz UM pedido nos três casos.
 * O que não tem onde se perder não se perde.
 *
 * O QUE ESTA PROVA MEDE — as rotas a correr a sério, num DOM a sério:
 *
 *   A. UM PEDIDO, E ELE LEVA O PAR. Clica-se «Gravar sala» e conta-se o que saiu: um só POST, com a
 *      modalidade e o professor no corpo, e o KV com os dois depois.
 *   B. O MESMO NA DERIVAÇÃO — e a asserção que o id obriga: o par fica no elo NOVO, e o elo antigo
 *      não o recebe. Com a cadeia antiga, o segundo pedido escrevia no id que já tinha descido.
 *   C. REABRIR «EDITAR» REPÕE O PAR no passo 2 — a modalidade e o professor, os dois.
 *   D. A LISTAGEM: o nicho diz quem dá a sala; sem ninguém, manda ao passo «Associar» (e não ao
 *      passo 1, que já não tem nenhum dos dois campos).
 *   E. O PORTÃO: sem professor com régua não se cria sala.
 *   F. UMA GRAVAÇÃO QUE NÃO TRAZ O PAR NÃO O APAGA (o segundo defeito, do lado do servidor).
 *
 *   node experimentos/provar-associar-grava.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const USOS_VAZIOS = () => ({ professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 });

const PROF_COM_REGUA = [
  { nome: 'Brise Volet', slug: 'brise-volet', sal: 's1', hash: 'h1' },
  { nome: 'Bom Bom', slug: 'bom-bom', sal: 's2', hash: 'h2',
    rubrica: { nome: 'Salto', niveis: ['bom', 'regular', 'baixo'] } },
];
const PROF_SEM_REGUA = [
  { nome: 'Brise Volet', slug: 'brise-volet', sal: 's1', hash: 'h1' },
  { nome: 'Bom Bom', slug: 'bom-bom', sal: 's2', hash: 'h2' },
];

/** A sala que ela tem: o ritmo completo, e sem professor — que é o estado em que ela a deixou. */
const SALA_ROSA = {
  id: 'sala-rosa', nome: 'Sala Rosa', vigente: true,
  dias: ['seg'], horarios: { seg: '18:00' }, duracaoMin: 60,
  periodoInicio: '2026-11-01', periodoFim: '2026-12-01',
};
const CURADORIA = [{
  id: 'c1', professor: 'bom-bom', modalidade: 'bale-classico', turmas: ['Sala Rosa'],
  alunas: ['abreu'], criadaEm: '2026-11-01',
}];

function kvFalso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
    bruto: dados,
  };
}

const PERFIL_DO_BOM_BOM = JSON.stringify({ slug: 'bom-bom', nome: 'Bom Bom', modalidades: ['bale-classico'] });

/**
 * A PÁGINA COM AS ROTAS A SÉRIO.
 *
 * O `fetch` da página não é um duplo que devolve o que a bancada quer: é o `fetchSemRede` do módulo,
 * com o KV e o ambiente da escola. As rotas correm, escrevem, e recusam — é a única maneira de
 * medir «ficou gravado», que é exactamente a pergunta dela. O perfil do professor (que vive no
 * repositório) é o único pedaço de fora, e vem de um `globalThis.fetch` de mentira.
 */
async function abrir({ turmas = [SALA_ROSA], curadorias = [], profs = PROF_COM_REGUA } = {}) {
  const kvInicial = {
    'bastidores/breu/professores': JSON.stringify(profs),
    'bastidores/breu/dono': JSON.stringify({ nome: 'Brise Volet', slug: 'brise-volet' }),
    'bastidores/breu/turmas': JSON.stringify(turmas),
  };
  if (curadorias.length) kvInicial['bastidores/breu/curadorias'] = JSON.stringify(curadorias);
  const kv = kvFalso(kvInicial);

  const env = {
    ESCOLA_SLUG: 'breu', PADD_KV: kv, GITHUB_TOKEN: 'gh-de-mentira', SENHA_ADMIN: '123',
    PROFESSOR_SLUG: 'brise-volet', PROFESSOR_NOME: 'Brise Volet',
    ASSETS: { fetch: async () => new Response('', { status: 200 }) },
  };

  const fetchDeVerdade = globalThis.fetch;
  globalThis.fetch = async (u) => {
    const url = String(u);
    if (url.indexOf('/contents/professores/bom-bom/perfil.json') !== -1) {
      return {
        ok: true, status: 200, text: async () => '',
        json: async () => ({ content: Buffer.from(PERFIL_DO_BOM_BOM, 'utf8').toString('base64'), sha: 'x' }),
      };
    }
    return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
  };

  const html = bastidores.paginaProducao('breu', {}, profs, ['abreu'], 'Brise Volet', 'brise-volet',
    turmas.filter((t) => !t.substituidaPor), [], {}, curadorias, [], [], USOS_VAZIOS(),
    null, '', [], new Set(), {}, [], null, []);

  const { JSDOM, VirtualConsole } = require('jsdom');
  const vc = new VirtualConsole();
  const erros = [];
  vc.on('jsdomError', (e) => {
    const m = String((e && e.message) || e);
    if (!/Not implemented: navigation/.test(m)) erros.push(m.split('\n')[0]);
  });

  const pedidos = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://breu.padd.com.br/bastidores/producao#turmas',
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      Object.defineProperty(w, 'localStorage', {
        configurable: true,
        value: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      });
      w.scrollTo = () => {};
      w.Element.prototype.scrollIntoView = function () {};
      w.fetch = async (ep, op) => {
        const caminho = String(ep);
        const init = { method: (op && op.method) || 'GET' };
        if (op && op.body) {
          /* O TOKEN vive no `sessionStorage`, e a bancada não tem sessão: a credencial entra pela
           * senha, que é a outra porta da mesma guarda (`autorizacaoDirecaoOk`). */
          const corpo = JSON.parse(op.body);
          if (!corpo.token) corpo.senhaDirecao = '123';
          init.body = JSON.stringify(corpo);
        }
        const r = await bastidores.fetchSemRede(new Request('https://breu.padd.com.br' + caminho, init), env);
        const texto = await r.clone().text();
        pedidos.push({
          caminho, metodo: init.method,
          corpo: init.body ? JSON.parse(init.body) : null,
          status: r.status, resposta: texto.slice(0, 160),
        });
        return { ok: r.ok, status: r.status, json: async () => JSON.parse(texto), text: async () => texto };
      };
    },
  });

  await espera(400);
  const d = dom.window.document;
  /* O CONTEÚDO E O MIOLO ABERTOS COMO A APLICAÇÃO OS ABRE (19/11/2026). Sem isto, `#conteudo` e
   * `#turmas-paineis` ficam `[hidden]` no jsdom (é o portão e o acordeão), e `alvoDoRecado` — que
   * prefere o `.res` À VISTA — não encontra nenhum e cai no primeiro, que está escondido. A bancada
   * estaria a medir a própria falta de sessão em vez da página. */
  dom.window.document.getElementById('conteudo').hidden = false;
  d.getElementById('sec-turmas').hidden = false;
  if (typeof dom.window.definirFormularioRecolhido === 'function') dom.window.definirFormularioRecolhido(false);

  const clicar = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  const escolher = (id, valor) => {
    const el = d.getElementById(id);
    el.value = valor;
    el.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  };
  const escritas = () => pedidos.filter((p) => p.metodo === 'POST' && /^\/api\/bastidores\/turma/.test(p.caminho));
  const fechar = () => { globalThis.fetch = fetchDeVerdade; dom.window.close(); };

  return { d, W: dom.window, pedidos, escritas, kv, env, clicar, escolher, fechar, erros };
}

/** A sala vigente depois de uma gravação (o elo que a lista mostra). */
const vigentes = (kv) => JSON.parse(kv.bruto.get('bastidores/breu/turmas') || '[]')
  .filter((t) => t && !t.substituidaPor);

(async () => {
  // ===========================================================================================
  console.log('A. «Gravar sala» numa sala que já existe: UM pedido, e ele leva o par');

  {
    const a = await abrir();
    const ed = a.d.querySelector('#sec-turmas button.ajustar');
    conferir('a listagem dá «Editar» à sala sem professor',
      Boolean(ed) && ed.getAttribute('data-modo') === 'editar', ed && ed.getAttribute('data-modo'));
    a.clicar(ed);
    await espera(150);
    a.clicar(a.d.getElementById('t-enviar'));
    await espera(150);
    conferir('o passo «Associar» abre', !a.d.getElementById('passo-vincular').hidden, null);

    a.escolher('vinc-modalidade', 'Balé clássico');
    await espera(250);
    a.escolher('vinc-professor', 'bom-bom');
    await espera(100);
    conferir('o «Gravar sala» está aceso com o par escolhido',
      a.d.getElementById('vinc-gravar').disabled === false, null);

    const antes = a.escritas().length;
    a.clicar(a.d.getElementById('vinc-gravar'));
    await espera(600);
    const feitas = a.escritas().slice(antes);

    conferir('clicar «Gravar sala» faz UM pedido de escrita', feitas.length === 1,
      feitas.map((p) => p.caminho + ' ' + p.status));
    conferir('…e é o pedido da sala', feitas[0] && feitas[0].caminho === '/api/bastidores/turma-editar',
      feitas[0] && feitas[0].caminho);
    conferir('…e ele respondeu 200', feitas[0] && feitas[0].status === 200, feitas[0] && feitas[0].resposta);
    conferir('…e leva a modalidade e o professor no MESMO corpo',
      feitas[0] && feitas[0].corpo.modalidade === 'Balé clássico' && feitas[0].corpo.professor === 'bom-bom',
      feitas[0] && { modalidade: feitas[0].corpo.modalidade, professor: feitas[0].corpo.professor });
    const salva = vigentes(a.kv).find((t) => t.nome === 'Sala Rosa');
    conferir('…e a sala ficou com o professor e a modalidade',
      salva && salva.professor === 'bom-bom' && salva.modalidade === 'Balé clássico',
      salva && { professor: salva.professor, modalidade: salva.modalidade });
    conferir('…e o ritmo não se perdeu no caminho', salva && Number(salva.duracaoMin) === 60, salva && salva.duracaoMin);
    conferir('os scripts da página não lançam', a.erros.length === 0, a.erros.slice(0, 1));
    a.fechar();
  }

  // ===========================================================================================
  console.log('\nB. O mesmo na derivação — e o par tem de ficar no elo NOVO');

  {
    const a = await abrir({ curadorias: CURADORIA });
    const botao = a.d.querySelector('#sec-turmas button.ajustar');
    conferir('a sala que está numa curadoria diz «Derivar»',
      Boolean(botao) && /Derivar/.test(botao.textContent) && botao.getAttribute('data-modo') !== 'editar',
      botao && botao.textContent);
    a.clicar(botao);
    await espera(150);
    a.clicar(a.d.getElementById('t-enviar'));
    await espera(150);
    a.escolher('vinc-modalidade', 'Balé clássico');
    await espera(250);
    a.escolher('vinc-professor', 'bom-bom');
    await espera(100);

    const antes = a.escritas().length;
    a.clicar(a.d.getElementById('vinc-gravar'));
    await espera(800);
    const feitas = a.escritas().slice(antes);

    conferir('derivar a sala é UM pedido de escrita', feitas.length === 1,
      feitas.map((p) => p.caminho + ' ' + p.status));
    conferir('…e é o pedido da derivação',
      feitas[0] && feitas[0].caminho === '/api/bastidores/turma-derivar', feitas[0] && feitas[0].caminho);
    conferir('…e leva o par no corpo',
      feitas[0] && feitas[0].corpo.modalidade === 'Balé clássico' && feitas[0].corpo.professor === 'bom-bom',
      feitas[0] && { modalidade: feitas[0].corpo.modalidade, professor: feitas[0].corpo.professor });

    const todas = JSON.parse(a.kv.bruto.get('bastidores/breu/turmas') || '[]');
    const novo = todas.find((t) => t && !t.substituidaPor);
    const antigo = todas.find((t) => t && t.substituidaPor);
    conferir('o elo NOVO ficou com o professor', novo && novo.professor === 'bom-bom', novo && novo.professor);
    conferir('…e com a modalidade', novo && novo.modalidade === 'Balé clássico', novo && novo.modalidade);
    /* É esta a asserção que a cadeia de dois pedidos não podia passar: o segundo ia para o id antigo. */
    conferir('…e o elo que desceu ao histórico NÃO ganhou a associação dele',
      antigo && !antigo.professor, antigo && antigo.professor);
    a.fechar();
  }

  // ===========================================================================================
  console.log('\nC. Reabrir «Editar» repõe o par no passo 2');

  {
    const a = await abrir({
      turmas: [Object.assign({}, SALA_ROSA, { professor: 'bom-bom', modalidade: 'Balé clássico' })],
    });
    a.clicar(a.d.querySelector('#sec-turmas button.ajustar'));
    await espera(400);
    conferir('a modalidade da sala volta escolhida',
      a.d.getElementById('vinc-modalidade').value === 'Balé clássico',
      a.d.getElementById('vinc-modalidade').value);
    conferir('…e o professor também — a lista chega depois, e ele é reposto nela',
      a.d.getElementById('vinc-professor').value === 'bom-bom',
      a.d.getElementById('vinc-professor').value);
    a.fechar();
  }

  // ===========================================================================================
  console.log('\nD. A listagem: o nicho do professor diz quem dá a sala');

  {
    const pagina = (turmas) => bastidores.paginaProducao('breu', {}, PROF_COM_REGUA, ['abreu'],
      'Brise Volet', 'brise-volet', turmas, [], {}, [], [], [], USOS_VAZIOS(),
      null, '', [], new Set(), {}, [], null, []);
    const secao = (html) => html.slice(html.indexOf('id="sec-turmas"'), html.indexOf('id="sec-verbetes"'));

    const sem = secao(pagina([SALA_ROSA]));
    conferir('sem professor, a frase diz que falta quem a dê', /Esta sala ainda não diz quem a dá/.test(sem), null);
    conferir('…e manda ao passo «Associar»', /passo «Associar»/.test(sem), null);
    /* A FRASE ERRADA, NA LETRA DELA: «a modalidade escolhe-se em editar no passo um, o professor no
     * passo dois» — os dois estão no «Associar» desde 19/11. */
    conferir('…e NÃO manda a modalidade ao passo 1, que já não a tem',
      !/no passo 1; o professor/.test(sem), null);

    const com = secao(pagina([Object.assign({}, SALA_ROSA, { professor: 'bom-bom', modalidade: 'Balé clássico' })]));
    conferir('com professor, o nicho diz o nome dele',
      /Professor<\/span><span class="trio-v">Bom Bom/.test(com), null);
    conferir('…e a modalidade que ele ali ensina',
      /Modalidade que aqui ensina<\/span><span class="trio-v">Balé clássico/.test(com), null);
    conferir('…e a frase de falta desaparece', !/Esta sala ainda não diz/.test(com), null);
  }

  // ===========================================================================================
  console.log('\nE. O portão: a sala não se cria sem quem a meça');

  {
    const pagina = (profs) => bastidores.paginaProducao('breu', {}, profs, ['abreu'],
      'Brise Volet', 'brise-volet', [], [], {}, [], [], [], USOS_VAZIOS(),
      null, '', [], new Set(), {}, [], null, []);

    const semRegua = pagina(PROF_SEM_REGUA);
    conferir('sem nenhum professor com régua, o aviso do passo 1 existe',
      /<p class="aviso" id="sala-sem-regua">/.test(semRegua)
        && /Professores<\/b>, no passo «Rubrica»/.test(semRegua), null);
    conferir('…e a página diz ao cliente que não há com que medir',
      /var TEM_PROFESSOR_COM_REGUA = false/.test(semRegua), null);

    const comRegua = pagina(PROF_COM_REGUA);
    conferir('com um professor com régua, o aviso não existe', !/id="sala-sem-regua"/.test(comRegua), null);
    conferir('…e a página diz ao cliente que há', /var TEM_PROFESSOR_COM_REGUA = true/.test(comRegua), null);
  }

  {
    /* A TRAVA DO CLIENTE, e não só o aviso: `aplicarTravas` reescreve o `disabled` a cada carácter
     * escrito, e uma trava que só existisse no markup do servidor desaparecia ao primeiro toque. */
    const semRegua = await abrir({ profs: PROF_SEM_REGUA, turmas: [] });
    const preencher = (id, valor) => {
      const el = semRegua.d.getElementById(id);
      el.value = valor;
      el.dispatchEvent(new semRegua.W.Event('input', { bubbles: true }));
    };
    preencher('tnome', 'Sala Nova');
    preencher('tduracao', '60');
    preencher('tinicio', '2026-11-01');
    preencher('tfim', '2026-12-01');
    const seg = semRegua.d.querySelector('#tdias input[name="dia"][value="seg"]');
    if (seg) { seg.checked = true; seg.dispatchEvent(new semRegua.W.Event('change', { bubbles: true })); }
    await espera(150);
    const avancar = semRegua.d.getElementById('t-enviar');
    conferir('com a sala composta mas sem professor com régua, o «Avançar» fica travado',
      avancar.disabled === true, { disabled: avancar.disabled, title: avancar.title });
    conferir('…e a razão é a régua, com o sítio onde se cria',
      /professor com régua/.test(avancar.getAttribute('title') || '')
        && /Rubrica/.test(avancar.getAttribute('title') || ''), avancar.getAttribute('title'));
    semRegua.fechar();

    /* E COM RÉGUA, O MESMO GESTO DESTRAVA — o controle positivo da secção. */
    const comRegua = await abrir({ profs: PROF_COM_REGUA, turmas: [] });
    const preencher2 = (id, valor) => {
      const el = comRegua.d.getElementById(id);
      el.value = valor;
      el.dispatchEvent(new comRegua.W.Event('input', { bubbles: true }));
    };
    preencher2('tnome', 'Sala Nova');
    preencher2('tduracao', '60');
    preencher2('tinicio', '2026-11-01');
    preencher2('tfim', '2026-12-01');
    const seg2 = comRegua.d.querySelector('#tdias input[name="dia"][value="seg"]');
    if (seg2) { seg2.checked = true; seg2.dispatchEvent(new comRegua.W.Event('change', { bubbles: true })); }
    await espera(150);
    conferir('havendo professor com régua, o «Avançar» destrava',
      comRegua.d.getElementById('t-enviar').disabled === false, comRegua.d.getElementById('t-enviar').title);
    comRegua.fechar();
  }

  // ===========================================================================================
  console.log('\nF. Uma gravação que não traz o par não o apaga');

  {
    /* O SEGUNDO DEFEITO. Um cliente que só corrige o RITMO (sem modalidade nem professor no corpo) não
     * pode limpar a associação — e o `normalizarTurma` emite os dois vazios sempre. */
    const a = await abrir({
      turmas: [Object.assign({}, SALA_ROSA, { professor: 'bom-bom', modalidade: 'Balé clássico' })],
    });
    const r = await a.d.defaultView.fetch('/api/bastidores/turma-editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senhaDirecao: '123', id: 'sala-rosa', nome: 'Sala Rosa',
        dias: ['seg', 'qua'], horarios: { seg: '18:00', qua: '18:00' },
        duracaoMin: '75', periodoInicio: '2026-11-01', periodoFim: '2026-12-01',
      }),
    });
    conferir('editar o ritmo sem o par responde 200', r.status === 200, r.status);
    const salva = vigentes(a.kv).find((t) => t.nome === 'Sala Rosa');
    conferir('…e o ritmo novo foi gravado', salva && Number(salva.duracaoMin) === 75, salva && salva.duracaoMin);
    conferir('…e o professor dela NÃO se perdeu', salva && salva.professor === 'bom-bom', salva && salva.professor);
    conferir('…e nem a modalidade', salva && salva.modalidade === 'Balé clássico', salva && salva.modalidade);
    a.fechar();
  }

  // ===========================================================================================
  console.log('\nG. Compor no passo 1 uma sala que JÁ EXISTE: é a mesma sala, e ela recebe o professor');

  {
    /* O SILÊNCIO QUE ELA ENCONTROU, e não estava em nenhuma das correcções anteriores.
     *
     * Ela compôs a sala no passo 1 — nome «Rosa», os dias e as horas —, avançou, escolheu a
     * modalidade e o professor, e clicou «Gravar sala». O cliente tomou o caminho de CRIAR (não
     * havia sala em foco, porque ela não clicou «Editar»), e o servidor recusou: «já existe uma sala
     * com o nome «Rosa»». A associação não era gravada, e a recusa ia para o `.res` do PASSO 1 — que
     * está `hidden` enquanto o passo 2 está aberto. A tela ficava igual.
     *
     * A sala não tem nome próprio: o `id` dela é o slug do nome. Duas com o mesmo nome e o mesmo
     * ritmo são a mesma sala, e o acto é o mesmo — completá-la. É o que esta secção mede. */
    const a = await abrir();
    const preencher = (id, valor) => {
      const el = a.d.getElementById(id);
      el.value = valor;
      el.dispatchEvent(new a.W.Event('input', { bubbles: true }));
    };
    preencher('tnome', 'Sala Rosa');
    preencher('tduracao', '60');
    preencher('tinicio', '2026-11-01');
    preencher('tfim', '2026-12-01');
    const seg = a.d.querySelector('#tdias input[name="dia"][value="seg"]');
    if (seg) { seg.checked = true; seg.dispatchEvent(new a.W.Event('change', { bubbles: true })); }
    const hora = a.d.querySelector('.hora-do-dia[data-dia="seg"]');
    if (hora) { hora.value = '18:00'; hora.dispatchEvent(new a.W.Event('change', { bubbles: true })); }
    await espera(150);

    a.clicar(a.d.getElementById('t-enviar'));
    await espera(150);
    conferir('o passo «Associar» abre com a sala composta', !a.d.getElementById('passo-vincular').hidden, null);
    a.escolher('vinc-modalidade', 'Balé clássico');
    await espera(250);
    a.escolher('vinc-professor', 'bom-bom');
    await espera(100);

    const antes = a.escritas().length;
    a.clicar(a.d.getElementById('vinc-gravar'));
    await espera(600);
    const feitas = a.escritas().slice(antes);

    conferir('gravar a associação de uma sala que já existe é UM pedido', feitas.length === 1,
      feitas.map((p) => p.caminho + ' ' + p.status));
    conferir('…e ele responde 200 — a sala que já existe não é recusada', feitas[0] && feitas[0].status === 200,
      feitas[0] && feitas[0].resposta);
    conferir('…e a resposta diz que a sala foi reaproveitada',
      feitas[0] && /"reaproveitada":\s*true/.test(feitas[0].resposta), feitas[0] && feitas[0].resposta);

    const salas = vigentes(a.kv);
    conferir('…e NÃO nasceu uma segunda sala com o mesmo nome', salas.length === 1, salas.map((t) => t.nome));
    const salva = salas.find((t) => t.nome === 'Sala Rosa');
    conferir('…e a sala ficou com o professor que se associou',
      salva && salva.professor === 'bom-bom', salva && salva.professor);
    conferir('…e com a modalidade', salva && salva.modalidade === 'Balé clássico', salva && salva.modalidade);
    /* O RITMO DELA NÃO É TOCADO: o passo 2 acrescenta o par, e não reescreve o que o passo 1 não
     * mudou. */
    conferir('…e o ritmo que já estava não foi reescrito', salva && Number(salva.duracaoMin) === 60,
      salva && salva.duracaoMin);
    a.fechar();
  }

  // ===========================================================================================
  console.log('\nH. E a recusa aparece ONDE SE CLICOU — no passo «Associar», à vista');

  {
    /* A MESMA SALA, OUTRO RITMO: aí são duas intenções a disputar um nome, e a recusa é a resposta
     * certa. O que não pode acontecer é ela ser escrita num `.res` escondido — foi o que fez três
     * relatos de «não gravou» sem uma única mensagem à vista. */
    const a = await abrir();
    const preencher = (id, valor) => {
      const el = a.d.getElementById(id);
      el.value = valor;
      el.dispatchEvent(new a.W.Event('input', { bubbles: true }));
    };
    preencher('tnome', 'Sala Rosa');
    preencher('tduracao', '60');
    preencher('tinicio', '2026-11-01');
    preencher('tfim', '2026-12-01');
    const seg = a.d.querySelector('#tdias input[name="dia"][value="seg"]');
    if (seg) { seg.checked = true; seg.dispatchEvent(new a.W.Event('change', { bubbles: true })); }
    const hora = a.d.querySelector('.hora-do-dia[data-dia="seg"]');
    if (hora) { hora.value = '19:30'; hora.dispatchEvent(new a.W.Event('change', { bubbles: true })); }
    await espera(150);
    a.clicar(a.d.getElementById('t-enviar'));
    await espera(150);
    a.escolher('vinc-modalidade', 'Balé clássico');
    await espera(250);
    a.escolher('vinc-professor', 'bom-bom');
    await espera(100);

    const antes = a.escritas().length;
    a.clicar(a.d.getElementById('vinc-gravar'));
    await espera(600);
    const feitas = a.escritas().slice(antes);
    conferir('com outro ritmo, a recusa é 409', feitas[0] && feitas[0].status === 409,
      feitas[0] && feitas[0].status);

    const resDoPar = a.d.querySelector('.res[data-res="sala-par"]');
    conferir('o passo «Associar» tem o seu próprio recado', Boolean(resDoPar), null);
    conferir('…e é ELE que recebe a recusa, e não o do passo 1',
      resDoPar && /já existe uma sala com o nome/.test(resDoPar.textContent), resDoPar && resDoPar.textContent);
    conferir('…e está à vista — não dentro de um painel escondido',
      resDoPar && !resDoPar.closest('[hidden]'), resDoPar && Boolean(resDoPar.closest('[hidden]')));
    conferir('…e a sala ficou sem professor, e continua uma só',
      vigentes(a.kv).length === 1 && !vigentes(a.kv)[0].professor, vigentes(a.kv).map((t) => [t.nome, t.professor]));
    a.fechar();
  }

  console.log('');
  console.log(ko === 0
    ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
