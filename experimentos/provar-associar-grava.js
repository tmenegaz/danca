#!/usr/bin/env node
'use strict';

/*
 * provar-associar-grava.js — a sala fica com o professor que se associou (19/11/2026).
 *
 * O QUE ELA VIU, e são três coisas que parecem três e são uma:
 *
 *   «Eu tenho uma sala aqui que se chama sala rosa. Quando eu criei a sala e fui associar, o step
 *   dois que se chama associar, eu escolhi o professor pela modalidade […] a tradição veio correto, a
 *   régua também veio de forma correta, mas quando eu gravei o professor na listagem não aparece
 *   nada no nicho professor. […] A listagem do campo professor diz que esta sala ainda não diz a
 *   modalidade que aí se ensina. A modalidade escolhe-se em editar no passo um, o professor no passo
 *   dois. Não existe mais passo dois com professor aqui nas salas, então essa mensagem está errada.»
 *
 * A CAUSA DO PRIMEIRO. O «Gravar sala» de uma sala que JÁ EXISTE faz dois pedidos — a sala
 * (`turma-editar` ou `turma-derivar`) e o par modalidade+professor (`turma-professor`) —, e o
 * segundo vivia no `aoOk` do primeiro. O `enviar` chamava o `aoOk` e, na linha seguinte,
 * `location.reload()` derrubava a página com o segundo pedido ainda em voo. A sala ficava gravada e
 * o professor nunca: exactamente o estado que ela descreveu — modalidade e régua certas no passo 2,
 * nicho do professor vazio na listagem.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. A CADEIA, com as duas respostas presas na mão. Entre a resposta da sala e a do par, a página
 *      NÃO pode recarregar — é isso que distingue «a cadeia continua» de «a cadeia foi abortada».
 *      Com o defeito, a recarga acontece na primeira resposta e a asserção falha.
 *   B. A LISTAGEM: a sala com professor diz quem a dá; a que não tem manda ao passo «Associar», e
 *      NÃO ao passo 1 (que já não tem nem modalidade nem professor).
 *   C. O PORTÃO: sem nenhum professor com régua, a sala não se cria — o aviso existe, e o
 *      «Avançar» fica travado com a razão no `title`. Com um professor com régua, destrava.
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

const USOS_VAZIOS = () => ({ professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 });

const PROF_COM_REGUA = [
  { nome: 'Brise Volet', slug: 'brise-volet', sal: 's1', hash: 'h1' },
  {
    nome: 'Bombom', slug: 'bombom', sal: 's2', hash: 'h2',
    rubrica: { nome: 'Salto', niveis: ['bom', 'regular', 'baixo'] },
  },
];
const PROF_SEM_REGUA = [
  { nome: 'Brise Volet', slug: 'brise-volet', sal: 's1', hash: 'h1' },
  { nome: 'Bombom', slug: 'bombom', sal: 's2', hash: 'h2' },
];

/** A sala que ela tem: já gravada, com o ritmo completo. */
const SALA_ROSA = {
  id: 'sala-rosa', nome: 'Sala Rosa', vigente: true,
  dias: ['segunda'], horarios: { segunda: '18:00' }, duracaoMin: 60,
  periodoInicio: '2026-11-01', periodoFim: '2026-12-01',
};

/** A página como o servidor a desenha. */
function pagina({ profs = PROF_COM_REGUA, turmas = [SALA_ROSA] } = {}) {
  return bastidores.paginaProducao('breu', {}, profs, ['abreu'], 'Brise Volet', 'brise-volet',
    turmas, [], {}, [], [], [], USOS_VAZIOS(), null, '', [], new Set(), {}, [], null, []);
}

/**
 * A PÁGINA A CORRER — e a recarga medida pelo que o jsdom diz dela.
 *
 * O `location` do jsdom não se substitui (a propriedade não é configurável), e um espião posto
 * depois da construção não chegaria aos `location.reload()` do script. Mas não é preciso espião: o
 * jsdom **anuncia cada tentativa de navegação** («Not implemented: navigation») ao `virtualConsole`,
 * e é exactamente esse o facto que interessa — houve ou não uma recarga neste ponto da cadeia.
 * Contar os anúncios é medir o gesto, e não o efeito dele.
 */
function montar(html, fetchStub) {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const vc = new VirtualConsole();
  const erros = [];
  vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
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
      w.fetch = fetchStub;
    },
  });
  /* A RECARGA É A NAVEGAÇÃO QUE O JSDOM RECUSA — e recusá-la é o que a torna contável. */
  const recargas = {
    get length() { return erros.filter((e) => /Not implemented: navigation/.test(e)).length; },
  };
  return { dom, d: dom.window.document, W: dom.window, recargas, erros };
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // ===========================================================================================
  console.log('A. A cadeia do «Gravar sala»: a sala, e DEPOIS o professor — sem recarga a meio');

  {
    /* AS DUAS RESPOSTAS FICAM PRESAS NA MÃO. É o que torna a corrida observável: entre a resposta da
     * sala e a do par, o estado da página diz se a cadeia continua ou se foi derrubada. */
    const pendentes = [];
    const chamadas = [];
    /* DOIS PEDIDOS PRENDEM-SE, O RESTO RESPONDE. A página faz outras leituras ao abrir (o perfil de
     * cada professor, o estado das linhas de base…), e prendê-las deixaria o cenário à espera de
     * respostas que ninguém ia dar — a bancada mediria a própria greve. Só a cadeia da sala é que
     * fica na mão, porque é ela que se está a medir. */
    const fetchStub = (ep, opcoes) => {
      const caminho = String(ep);
      const resposta = (dados) => Promise.resolve({ status: 200, ok: true, json: async () => dados });
      if (/^\/api\/bastidores\/perfil/.test(caminho)) {
        return resposta({ ok: true, existe: true, modalidades: ['bale-classico'], catalogo: [] });
      }
      if (!/^\/api\/bastidores\/turma-(editar|derivar|professor)$/.test(caminho)) {
        return resposta({ ok: true });
      }
      chamadas.push(caminho);
      const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
      return new Promise((resolve) => {
        pendentes.push({
          caminho, corpo,
          responder: (dados) => resolve({ status: 200, ok: true, json: async () => dados }),
        });
      });
    };

    const { d, W, recargas, erros } = montar(pagina(), fetchStub);
    await espera(350);
    d.getElementById('sec-turmas').hidden = false;
    const clicar = (el) => el.dispatchEvent(new W.MouseEvent('click', { bubbles: true }));

    /* 1. «Editar» na sala — é o caminho em que ela viu o defeito (a sala já existe). */
    const ed = d.querySelector('#sec-turmas button.ajustar');
    conferir('a listagem tem o «Editar» da Sala Rosa', Boolean(ed), null);
    if (ed) clicar(ed);
    await espera(120);

    /* 2. «Avançar» — o passo 1 já vem preenchido pela sala em foco. */
    clicar(d.getElementById('t-enviar'));
    await espera(120);
    conferir('o passo «Associar» abre', !d.getElementById('passo-vincular').hidden, null);

    /* 3. A modalidade primeiro, e é ela que acende a lista de professores. */
    const selM = d.getElementById('vinc-modalidade');
    selM.value = 'Balé clássico';
    selM.dispatchEvent(new W.Event('change', { bubbles: true }));
    await espera(120);
    const selP = d.getElementById('vinc-professor');
    conferir('escolhida a modalidade, a lista de professores acende',
      !selP.disabled && selP.options.length > 1, { disabled: selP.disabled, opcoes: selP.options.length });
    selP.value = 'bombom';
    selP.dispatchEvent(new W.Event('change', { bubbles: true }));
    await espera(80);

    /* 4. «Gravar sala» — a primeira metade da cadeia. */
    clicar(d.getElementById('vinc-gravar'));
    await espera(120);
    conferir('o «Gravar sala» pede primeiro a sala', chamadas[0] === '/api/bastidores/turma-editar', chamadas);
    conferir('…e a página ainda não recarregou (a resposta não chegou)', recargas.length === 0, recargas.length);

    /* 5. A SALA RESPONDE. Aqui é onde o defeito vivia: a recarga disparava nesta linha. */
    if (pendentes[0]) pendentes[0].responder({ ok: true, id: 'sala-rosa', turma: 'Sala Rosa' });
    await espera(150);
    conferir('respondida a sala, o par (modalidade, professor) é pedido',
      chamadas[1] === '/api/bastidores/turma-professor', chamadas);
    conferir('…e a página CONTINUA sem recarregar — a cadeia tem de chegar ao fim',
      recargas.length === 0, recargas.length);
    const corpoDoPar = (pendentes[1] && pendentes[1].corpo) || {};
    conferir('…e o pedido do par leva a sala, a modalidade e o professor',
      corpoDoPar.turma === 'sala-rosa' && corpoDoPar.modalidade === 'Balé clássico'
        && corpoDoPar.professor === 'bombom', corpoDoPar);

    /* 6. O PAR RESPONDE — e agora sim, uma recarga, e uma só. */
    if (pendentes[1]) pendentes[1].responder({ ok: true, turma: 'Sala Rosa', professor: 'bombom' });
    await espera(150);
    conferir('respondido o par, a página recarrega uma vez', recargas.length === 1, recargas.length);
    /* A RECARGA ESPERADA NÃO É UM ERRO — é o gesto que se acabou de pedir ao jsdom. */
    const outrosErros = erros.filter((e) => !/Not implemented: navigation/.test(e));
    conferir('os scripts da página não lançam', outrosErros.length === 0, outrosErros.slice(0, 1));
  }

  // ===========================================================================================
  console.log('\nB. A listagem: o nicho do professor diz quem dá a sala');

  {
    const semProfessor = pagina({ turmas: [SALA_ROSA] });
    const secao = semProfessor.slice(semProfessor.indexOf('id="sec-turmas"'),
      semProfessor.indexOf('id="sec-verbetes"'));
    conferir('sem professor, a frase diz que falta quem a dê',
      /Esta sala ainda não diz quem a dá/.test(secao), null);
    conferir('…e manda ao passo «Associar»', /passo «Associar»/.test(secao), null);
    /* A FRASE ERRADA, NA LETRA DELA: «A modalidade escolhe-se em editar no passo um, o professor no
     * passo dois.» A modalidade e o professor estão os dois no passo «Associar» desde 19/11. */
    conferir('…e NÃO manda a modalidade ao passo 1, que já não a tem',
      !/no passo 1; o professor/.test(secao) && !/modalidade escolhe-se em «Editar», no passo 1/.test(secao), null);

    const comProfessor = pagina({
      turmas: [Object.assign({}, SALA_ROSA, { professor: 'bombom', modalidade: 'Balé clássico' })],
    });
    const secaoCom = comProfessor.slice(comProfessor.indexOf('id="sec-turmas"'),
      comProfessor.indexOf('id="sec-verbetes"'));
    conferir('com professor, o nicho diz o nome dele', /Professor<\/span><span class="trio-v">Bombom/.test(secaoCom), null);
    conferir('…e a modalidade que ele ali ensina',
      /Modalidade que aqui ensina<\/span><span class="trio-v">Balé clássico/.test(secaoCom), null);
    conferir('…e a frase de falta desaparece',
      !/Esta sala ainda não diz/.test(secaoCom), null);
  }

  // ===========================================================================================
  console.log('\nC. O portão: a sala não se cria sem quem a meça');

  {
    const semRegua = pagina({ profs: PROF_SEM_REGUA });
    conferir('sem nenhum professor com régua, o aviso do passo 1 existe',
      /<p class="aviso" id="sala-sem-regua">/.test(semRegua)
        && /Professores<\/b>, no passo «Rubrica»/.test(semRegua), null);
    conferir('…e a página diz ao cliente que não há com que medir',
      /var TEM_PROFESSOR_COM_REGUA = false/.test(semRegua), null);

    const comRegua = pagina({ profs: PROF_COM_REGUA });
    conferir('com um professor com régua, o aviso não existe',
      !/id="sala-sem-regua"/.test(comRegua), null);
    conferir('…e a página diz ao cliente que há',
      /var TEM_PROFESSOR_COM_REGUA = true/.test(comRegua), null);
  }

  {
    /* A TRAVA DO CLIENTE, e não só o aviso: `aplicarTravas` reescreve o `disabled` a cada carácter
     * escrito, e uma trava que só existisse no markup do servidor desaparecia ao primeiro toque. */
    const fetchStub = () => new Promise(() => {});
    const { d, W, erros } = montar(pagina({ profs: PROF_SEM_REGUA, turmas: [] }), fetchStub);
    await espera(350);
    d.getElementById('sec-turmas').hidden = false;
    const avancar = d.getElementById('t-enviar');
    const preencher = (id, valor) => {
      const el = d.getElementById(id);
      el.value = valor;
      el.dispatchEvent(new W.Event('input', { bubbles: true }));
    };
    preencher('tnome', 'Sala Nova');
    preencher('tduracao', '60');
    preencher('tinicio', '2026-11-01');
    preencher('tfim', '2026-12-01');
    const seg = d.querySelector('#tdias input[name="dia"]');
    if (seg) { seg.checked = true; seg.dispatchEvent(new W.Event('change', { bubbles: true })); }
    await espera(120);
    conferir('com a sala composta mas sem professor com régua, o «Avançar» fica travado',
      avancar.disabled === true, { disabled: avancar.disabled, title: avancar.title });
    conferir('…e a razão é a régua, com o sítio onde se cria',
      /professor com régua/.test(avancar.getAttribute('title') || '')
        && /Rubrica/.test(avancar.getAttribute('title') || ''), avancar.getAttribute('title'));
    conferir('os scripts da página não lançam', erros.length === 0, erros.slice(0, 1));
  }

  {
    /* E COM RÉGUA, O MESMO GESTO DESTRAVA — o controle positivo da secção. */
    const fetchStub = () => new Promise(() => {});
    const { d, W } = montar(pagina({ profs: PROF_COM_REGUA, turmas: [] }), fetchStub);
    await espera(350);
    d.getElementById('sec-turmas').hidden = false;
    const preencher = (id, valor) => {
      const el = d.getElementById(id);
      el.value = valor;
      el.dispatchEvent(new W.Event('input', { bubbles: true }));
    };
    preencher('tnome', 'Sala Nova');
    preencher('tduracao', '60');
    preencher('tinicio', '2026-11-01');
    preencher('tfim', '2026-12-01');
    const seg = d.querySelector('#tdias input[name="dia"]');
    if (seg) { seg.checked = true; seg.dispatchEvent(new W.Event('change', { bubbles: true })); }
    await espera(120);
    conferir('havendo professor com régua, o «Avançar» destrava',
      d.getElementById('t-enviar').disabled === false, d.getElementById('t-enviar').title);
  }

  // ===========================================================================================
  console.log('\nD. Editar o ritmo não apaga o professor que a sala já tem');

  {
    /* O SEGUNDO LADO DO MESMO DEFEITO. O `normalizarTurma` emite `modalidade` e `professor` sempre —
     * vazios quando o corpo não os manda —, e o `'modalidade' in declarado` era verdadeiro com `''`.
     * Como o passo 1 já não os recolhe, corrigir o ritmo de uma sala apagava a associação: a sala
     * ficava gravada, sem professor, e o nicho voltava a dizer que ninguém a dá. */
    const kv = {
      guardado: JSON.stringify([Object.assign({}, SALA_ROSA, { professor: 'bombom', modalidade: 'Balé clássico' })]),
      async get() { return this.guardado; },
      async put(k, v) { if (/\/turmas$/.test(k)) this.guardado = String(v); },
      async delete() {},
      async list() { return { keys: [], list_complete: true }; },
    };
    const env = {
      ESCOLA_SLUG: 'breu', PADD_KV: kv, GITHUB_TOKEN: 'gh-de-mentira', SENHA_ADMIN: '123',
      PROFESSOR_SLUG: 'brise-volet', PROFESSOR_NOME: 'Brise Volet',
      ASSETS: { fetch: async () => new Response('', { status: 200 }) },
    };
    /* O REPOSITÓRIO VAZIO — sem ele, a leitura dos planos que já existem atravessa a rede a sério e
     * a sala aparece «vinculada» por um plano que ninguém escreveu: a bancada mediria a própria
     * falta de rede, como já aconteceu nesta casa. Sem árvore, não há plano nenhum, e a sala é
     * editável — que é o caso dela. */
    const fetchDeVerdade = globalThis.fetch;
    globalThis.fetch = async () => ({
      status: 404, ok: false, json: async () => ({}), text: async () => '',
    });
    const pedir = async (caminho, corpo) => {
      const req = new Request('https://breu.padd.com.br' + caminho, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
      });
      const r = await bastidores.fetchSemRede(req, env);
      return { status: r.status, dados: await r.json().catch(() => ({})) };
    };
    const r = await pedir('/api/bastidores/turma-editar', {
      senhaDirecao: '123', id: 'sala-rosa', nome: 'Sala Rosa',
      dias: ['segunda', 'quarta'], horarios: { segunda: '18:00', quarta: '18:00' },
      duracaoMin: 75, periodoInicio: '2026-11-01', periodoFim: '2026-12-01',
    });
    conferir('editar o ritmo da sala responde 200', r.status === 200, r.dados);
    const guardada = JSON.parse(kv.guardado).find((t) => t && t.vigente !== false);
    conferir('…e o novo ritmo foi gravado', guardada && guardada.duracaoMin === 75, guardada && guardada.duracaoMin);
    conferir('…e o professor dela NÃO se perdeu', guardada && guardada.professor === 'bombom', guardada && guardada.professor);
    conferir('…nem a modalidade', guardada && guardada.modalidade === 'Balé clássico', guardada && guardada.modalidade);
    globalThis.fetch = fetchDeVerdade;
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
