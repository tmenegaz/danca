#!/usr/bin/env node
'use strict';

/*
 * provar-excluir-travado.js — com uma ficha aberta em edição, ninguém exclui (19/11/2026).
 *
 * O PEDIDO, na letra dela:
 *
 *   «Quando eu estou em professores ou alunas ou sala ou audição ou estilo ou turmas, em qualquer um
 *   desses, e eu estou no modo edição de qualquer um dos formulários ou derivação em qualquer um dos
 *   formulários, o botão excluir, daquilo que é permitido excluir, deve ficar desabilitado. Não pode
 *   permitir a exclusão enquanto estiver em modo de edição/derivação.»
 *
 * PORQUE É UMA REGRA, e não um ajuste de cada ecrã. Excluir é o único gesto que destrói. Com uma
 * ficha aberta para correcção ou derivação, o registo em edição pode ser o que se apaga — a lista
 * recarrega, o formulário fica a apontar para um registo que já não existe, e o gesto seguinte
 * responde «não encontrado» a quem estava a trabalhar.
 *
 * O QUE ESTA PROVA MEDE — seis secções, o gesto verdadeiro de cada uma:
 *
 *   A. PROFESSORES — «Editar» numa linha desabilita os «Excluir»; «Cancelar» devolve-os.
 *   B. ALUNAS       — «Derivar» (o botão da listagem) desabilita; o cancelar devolve.
 *   C. SALAS        — «Editar» desabilita; «Cancelar» devolve.
 *   D. AUDIÇÃO      — abrir um elenco para editar desabilita o «Excluir» do elenco.
 *   E. ESTILO       — abrir um verbete para corrigir desabilita o «Excluir» do verbete.
 *   F. TURMAS       — «Atribuir turma»/«Derivar» desabilita; o «Cancelar» devolve.
 *   G. A GUARDA DO GESTO — o clique num botão travado não chega a pedir a exclusão, e diz porquê.
 *   H. O QUE NÃO É DESTA SECÇÃO NÃO É TOCADO — editar um professor não trava o «Excluir» de uma
 *      aluna: a regra é por secção, e uma travagem global seria outra coisa.
 *
 *   node experimentos/provar-excluir-travado.js
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

const PROFS = [
  { nome: 'Brise Volet', slug: 'brise-volet', sal: 's1', hash: 'h1' },
  { nome: 'Bom Bom', slug: 'bom-bom', sal: 's2', hash: 'h2',
    rubrica: { nome: 'Salto', niveis: ['bom', 'regular', 'baixo'] } },
];
const SALAS = [{
  id: 'sala-rosa', nome: 'Sala Rosa', vigente: true, dias: ['seg'], horarios: { seg: '18:00' },
  duracaoMin: 60, periodoInicio: '2026-11-01', periodoFim: '2026-12-01',
  professor: 'bom-bom', modalidade: 'Balé clássico',
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

/**
 * A PÁGINA A CORRER, com as rotas a sério.
 *
 * O `fetch` da página é o `fetchSemRede` do módulo — as leituras (perfis, verbetes, linhas de base)
 * respondem o que o servidor responderia, e não o que a bancada gostaria. Sem isto, a listagem de
 * elencos e a de verbetes nasciam vazias, e a bancada mediria a própria falta de dados.
 */
async function abrir({ profs = PROFS, turmas = SALAS, linhas = [], verbetes = null, curadorias = [] } = {}) {
  /* O REPOSITÓRIO VAZIO (19/11/2026). As rotas da casa leem o repositório pelo `fetch` GLOBAL — a
   * árvore, o índice, os perfis. Sem o prender, a bancada ia à rede a sério: cada secção esperava
   * por um tempo-limite, e a lista das linhas de base voltava em erro («não consegui ler os
   * elencos»), que é o ramo que a `pintarLinhas` desenha sem botão nenhum. A bancada passava a
   * medir a própria falta de rede. Um 404 em tudo é o repositório vazio, e é o estado que estas
   * secções sabem ler. */
  const fetchDeVerdade = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({}), text: async () => '' });
  const kvInicial = {
    'bastidores/breu/professores': JSON.stringify(profs),
    'bastidores/breu/dono': JSON.stringify({ nome: 'Brise Volet', slug: 'brise-volet' }),
    'bastidores/breu/turmas': JSON.stringify(turmas),
  };
  if (curadorias.length) kvInicial['bastidores/breu/curadorias'] = JSON.stringify(curadorias);
  /* AS LINHAS DE BASE VÃO PARA O KV, e não só para a página (19/11/2026). A lista dos elencos é
   * desenhada no CLIENTE, a partir de `/api/bastidores/linhas-de-base` — que lê o KV. Passá-las só
   * ao `paginaProducao` dava uma lista vazia e a bancada contava zero botões. */
  if (linhas.length) kvInicial['bastidores/breu/linhas-de-base'] = JSON.stringify(linhas);
  const kv = kvFalso(kvInicial);
  const env = {
    ESCOLA_SLUG: 'breu', PADD_KV: kv, GITHUB_TOKEN: 'gh-de-mentira', SENHA_ADMIN: '123',
    PROFESSOR_SLUG: 'brise-volet', PROFESSOR_NOME: 'Brise Volet',
    ASSETS: { fetch: async () => new Response('', { status: 200 }) },
  };

  const html = bastidores.paginaProducao('breu', {}, profs, ['abreu'], 'Brise Volet', 'brise-volet',
    turmas, [], {}, curadorias, [], [], USOS_VAZIOS(), null, '', linhas, new Set(), {}, [], null, []);

  const { JSDOM, VirtualConsole } = require('jsdom');
  const vc = new VirtualConsole();
  const erros = [];
  vc.on('jsdomError', (e) => {
    const m = String((e && e.message) || e);
    if (!/Not implemented/.test(m)) erros.push(m.split('\n')[0]);
  });

  const pedidos = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://breu.padd.com.br/bastidores/estudio',
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      Object.defineProperty(w, 'localStorage', {
        configurable: true,
        value: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      });
      w.scrollTo = () => {};
      w.Element.prototype.scrollIntoView = function () {};
      w.confirm = () => true;
      w.alert = () => {};
      w.fetch = async (ep, op) => {
        const caminho = String(ep);
        const init = { method: (op && op.method) || 'GET' };
        if (op && op.body) {
          const corpo = JSON.parse(op.body);
          if (!corpo.token) corpo.senhaDirecao = '123';
          init.body = JSON.stringify(corpo);
        }
        /* O VERBETE VEM DE UM DUPLO, e é o único: ele vive num ficheiro de biblioteca que a bancada
         * não sobe. A LISTA é o que a secção do Estilo desenha, e sem ela não há «Excluir» nenhum
         * para medir. */
        if (/^\/api\/bastidores\/verbete/.test(caminho) && verbetes) {
          return { ok: true, status: 200, json: async () => verbetes, text: async () => JSON.stringify(verbetes) };
        }
        const r = await bastidores.fetchSemRede(new Request('https://breu.padd.com.br' + caminho, init), env);
        const texto = await r.clone().text();
        pedidos.push({ caminho, metodo: init.method, status: r.status, resposta: texto.slice(0, 160) });
        return { ok: r.ok, status: r.status, json: async () => JSON.parse(texto), text: async () => texto };
      };
    },
  });

  await espera(450);
  const d = dom.window.document;
  /* O CONTEÚDO E OS MIOLOS ABERTOS COMO A APLICAÇÃO OS ABRE. `#conteudo` nasce `hidden` (o portão);
   * sem o abrir, os botões existem e a bancada mede o `hidden` do portão, não a regra. */
  d.getElementById('conteudo').hidden = false;

  const W = dom.window;
  const clicar = (el) => el.dispatchEvent(new W.MouseEvent('click', { bubbles: true }));
  const excluiresDa = (idDaSecao) => [...d.querySelectorAll('#' + idDaSecao + ' button.apagar')];
  /* A JANELA NÃO SE FECHA ENTRE SECÇÕES — e a razão é medida, não zelo.
   *
   * Cada secção faz leituras de rede (os perfis, as linhas de base, o alfabeto), e as respostas
   * chegam a um `.then` que toca no `document`. Fechar a janela antes de as respostas assentarem
   * deixa esse `.then` a correr sobre um `document` indefinido — um erro que sobe do seio da página
   * e derruba o processo da bancada. O sintoma não é da regra que se está a medir: é do harness a
   * puxar o tapete. As janelas ficam abertas até ao `process.exit` do fim, e é o processo que as
   * leva consigo. */
  return {
    d, W, kv, erros, pedidos, clicar, excluiresDa,
    fechar: () => { globalThis.fetch = fetchDeVerdade; },
  };
}

const todosTravados = (bs) => bs.length > 0 && bs.every((b) => b.disabled === true);
const todosLivres = (bs) => bs.length > 0 && bs.every((b) => b.disabled === false);

(async () => {
  // ===========================================================================================
  console.log('A. Professores: «Editar» desabilita os «Excluir»; «Cancelar» devolve-os');
  {
    const a = await abrir();
    a.d.getElementById('sec-professores').hidden = false;
    if (typeof a.W.definirSecaoRecolhida === 'function') a.W.definirSecaoRecolhida('sec-professores', false);
    await espera(150);

    const antes = a.excluiresDa('sec-professores');
    conferir('a secção tem «Excluir» para medir', antes.length > 0, antes.length);
    conferir('…e sem edição em curso eles estão LIVRES', todosLivres(antes),
      antes.map((b) => [b.textContent.trim(), b.disabled]));

    const ed = a.d.querySelector('#sec-professores button.editar');
    a.clicar(ed);
    await espera(300);
    conferir('com a ficha aberta em «Editar», os «Excluir» ficam desabilitados',
      todosTravados(antes), antes.map((b) => [b.textContent.trim(), b.disabled]));
    conferir('…e o `title` diz porque — e não fica mudo',
      /Conclua ou cancele a edição/.test(antes[0].getAttribute('title') || ''), antes[0].getAttribute('title'));
    conferir('…e o leitor de ecrã sabe (aria-disabled)', antes[0].getAttribute('aria-disabled') === 'true', null);

    a.clicar(a.d.getElementById('prof-cancelar'));
    await espera(250);
    conferir('«Cancelar» devolve os «Excluir»', todosLivres(antes),
      antes.map((b) => [b.textContent.trim(), b.disabled]));
    conferir('…e devolve também o `title` que já lá estava (não o substitui para sempre)',
      !/Conclua ou cancele a edição/.test(antes[0].getAttribute('title') || ''), antes[0].getAttribute('title'));
    conferir('os scripts da página não lançam', a.erros.length === 0, a.erros.slice(0, 1));
    a.fechar();
  }

  // ===========================================================================================
  console.log('\nB. Alunas: «Derivar» desabilita os «Excluir»');

  {
    const a = await abrir();
    a.d.getElementById('sec-alunas').hidden = false;
    if (typeof a.W.definirSecaoRecolhida === 'function') a.W.definirSecaoRecolhida('sec-alunas', false);
    await espera(150);
    const bs = a.excluiresDa('sec-alunas');
    conferir('a secção tem «Excluir» de aluna', bs.length > 0, bs.length);
    conferir('…e sem edição em curso estão LIVRES', todosLivres(bs), bs.map((b) => b.disabled));

    /* O gesto dela: o botão de derivar da lista de vínculos. Se não houver vínculo (a escola desta
     * bancada não tem matrículas), usa-se o próprio campo do modo — é ele que a pintura lê. */
    const derivar = a.d.querySelector('#sec-alunas [data-aluna-derivar]');
    if (derivar) {
      a.clicar(derivar);
      await espera(300);
    } else {
      const oculto = a.d.getElementById('aluna-em-derivacao');
      if (oculto) oculto.value = 'sim';
      const modo = a.d.getElementById('aluna-modo');
      if (modo) modo.value = 'derivar';
      a.W.pintarTravasDaAluna();
      await espera(120);
    }
    conferir('com a aluna em derivação, os «Excluir» ficam desabilitados', todosTravados(bs),
      { derivar: Boolean(derivar), bs: bs.map((b) => b.disabled) });
    a.fechar();
  }

  // ===========================================================================================
  console.log('\nC. Salas: «Editar» desabilita o «Excluir» da sala');

  {
    const a = await abrir();
    a.d.getElementById('sec-turmas').hidden = false;
    if (typeof a.W.definirFormularioRecolhido === 'function') a.W.definirFormularioRecolhido(false);
    await espera(150);
    const bs = a.excluiresDa('sec-turmas');
    conferir('a secção tem «Excluir» de sala', bs.length > 0, bs.length);
    conferir('…e sem edição em curso está LIVRE', todosLivres(bs), bs.map((b) => b.disabled));

    const ed = a.d.querySelector('#sec-turmas button.ajustar');
    a.clicar(ed);
    await espera(300);
    conferir('com a sala aberta em «Editar», o «Excluir» fica desabilitado', todosTravados(bs),
      bs.map((b) => b.disabled));

    a.clicar(a.d.getElementById('t-cancelar'));
    await espera(300);
    /* O «Cancelar» das Salas descarta a memória e RECARREGA — no jsdom a recarga é a navegação que
     * ele recusa. O que importa medir é que o modo deixou de estar escrito: é ele que a pintura lê
     * no arranque seguinte. */
    const modo = (a.d.getElementById('tmodo') || {}).value;
    const derivar = (a.d.getElementById('tderivar') || {}).value;
    conferir('«Cancelar» limpa o modo e o alvo da sala', !modo && !derivar, { modo, derivar });
    a.fechar();
  }

  // ===========================================================================================
  console.log('\nD. Audição: abrir um elenco desabilita o «Excluir» do elenco');

  {
    /* UM ELENCO NA LISTA — sem ele não há «Excluir» para medir. O formato é o do rascunho do KV
     * (`id` e `campos`), que é o que `linhasDeBase` filtra. */
    /* O RASCUNHO DO ELENCO, no formato que `linhasDeBase` filtra: `id` e `campos` — e `campos` é um
     * ARRAY de ids (são os aspectos do corpo marcados no passo 4), não o registo inteiro. Um
     * `campos` objeto passa a filtragem e a lista nasce vazia: foi o que aconteceu à primeira
     * versão desta bancada, e ela media zero botões sem dizer porquê. */
    const elenco = {
      id: 'elenco-teste', nome: 'Elenco Teste', professor: 'brise-volet',
      alunas: ['abreu'], campos: ['formato-dos-joelhos'],
      criada_em: '2026-11-01T10:00:00.000Z',
    };
    const a = await abrir({ linhas: [elenco] });
    a.d.getElementById('sec-corpo').hidden = false;
    if (typeof a.W.definirSecaoRecolhida === 'function') a.W.definirSecaoRecolhida('sec-corpo', false);
    await espera(500);
    /* A LISTA PODE SER PINTADA OUTRA VEZ (e é): `carregarLinhas` corre no arranque e outra vez por
     * cada gravação. Forçar a repintura aqui garante que a medição seja sobre a lista, e não sobre o
     * instante em que o `fetch` ainda não tinha chegado. */
    if (typeof a.W.carregarLinhas === 'function') await a.W.carregarLinhas();
    await espera(250);

    const bs = a.excluiresDa('sec-corpo');
    conferir('a secção tem «Excluir» de elenco', bs.length > 0,
      { n: bs.length, lista: (a.d.getElementById('lb-lista') || {}).innerHTML ?
        String(a.d.getElementById('lb-lista').innerHTML).slice(0, 220) : '(sem lista)' });
    if (!bs.length) { a.fechar(); } else {
      conferir('…e sem elenco aberto está LIVRE', todosLivres(bs), bs.map((b) => b.disabled));
      /* O gesto: abrir o elenco para editar. A função é a da casa (`editarLinha`), chamada pelo
       * botão do cartão; se ele não existir na listagem, usa-se a função — é ela que pinta. */
      const abrirBtn = a.d.querySelector('#sec-corpo [data-lb-editar]');
      if (abrirBtn) a.clicar(abrirBtn);
      else if (typeof a.W.editarLinha === 'function') a.W.editarLinha('elenco-teste');
      await espera(350);
      conferir('com o elenco aberto para editar, o «Excluir» fica desabilitado', todosTravados(bs),
        { abertoPorBotao: Boolean(abrirBtn), bs: bs.map((b) => b.disabled) });
      a.fechar();
    }
  }

  // ===========================================================================================
  console.log('\nE. Estilo: corrigir um verbete desabilita o «Excluir» do verbete');

  {
    /* O CONTRATO DA ROTA, lido de `carregarVerbetes`: a LISTA de exercícios vem em `exercicios`
     * (cada um com `nome`, `escola` e o que a linha mostra), e os verbetes em `verbetes`. Só os
     * exercícios que têm verbete entram na lista — é o que dá o botão «Excluir» para medir. */
    const verbete = {
      ok: true,
      exercicios: [
        { nome: 'Plié', escola: 'breu', trechos: 1, emTurma: null, porMusica: null },
        { nome: 'Battement Tendu', escola: 'breu', trechos: 1, emTurma: null, porMusica: null },
      ],
      exerciciosDoVocabulario: [
        { nome: 'Plié', categoria: 'passo', termo: 'Plié' },
        { nome: 'Battement Tendu', categoria: 'passo', termo: 'Battement Tendu' },
      ],
      posicoes: [], direcoes: [], orientacoes: [], categorias: [],
      verbetes: {
        'Plié': { '2|4': { metodo: 'RAD', direcao: 'frente', orientacao: 'en dehors',
          trechos: [{ contagem: '1-2', sinais: ['flexão'], descricao: 'desce' }] } },
        'Battement Tendu': { '2|4': { metodo: 'RAD', direcao: 'lado', orientacao: 'en dehors',
          trechos: [{ contagem: '1-2', sinais: ['extensão'], descricao: 'estende' }] } },
      },
    };
    const a = await abrir({ verbetes: verbete });
    a.d.getElementById('sec-verbetes').hidden = false;
    if (typeof a.W.definirSecaoRecolhida === 'function') a.W.definirSecaoRecolhida('sec-verbetes', false);
    /* O Estilo desenha a lista a partir da resposta do verbete — a leitura é um `fetch`, e o duplo
     * responde. Espera-se mais tempo porque há dois pedidos em cadeia (o alfabeto e o verbete). */
    await espera(700);

    const bs = a.excluiresDa('sec-verbetes');
    conferir('a secção tem «Excluir» de verbete', bs.length > 0, bs.length);
    if (!bs.length) { a.fechar(); } else {
      conferir('…e sem correcção em curso estão LIVRES', todosLivres(bs), bs.map((b) => b.disabled));
      if (typeof a.W.editarVerbete === 'function') a.W.editarVerbete('Plié');
      await espera(300);
      conferir('com o verbete aberto para corrigir, o «Excluir» fica desabilitado',
        todosTravados(bs), { vbacao: (a.d.getElementById('vbacao') || {}).value, bs: bs.map((b) => b.disabled) });
      a.fechar();
    }
  }

  // ===========================================================================================
  console.log('\nF. Turmas: «Atribuir turma» desabilita o «Excluir» da turma');

  {
    /* A TURMA DA LISTA É UMA CURADORIA, e ela vive no KV — sem uma, a secção nasce vazia e a
     * asserção passaria por vacuidade (zero botões, zero travados). Uma turma com a sala e a aluna
     * que esta bancada já tem. */
    const curadoria = {
      id: 'c1', professor: 'Brise Volet', modalidade: 'Balé clássico',
      turmas: ['Sala Rosa'], alunas: ['abreu'], criadaEm: '2026-11-01',
    };
    const a = await abrir({ curadorias: [curadoria] });
    a.d.getElementById('sec-curadorias').hidden = false;
    if (typeof a.W.definirSecaoRecolhida === 'function') a.W.definirSecaoRecolhida('sec-curadorias', false);
    await espera(250);

    const bs = a.excluiresDa('sec-curadorias');
    conferir('a secção tem «Excluir» de turma', bs.length > 0, bs.length);
    if (!bs.length) { a.fechar(); } else {
      conferir('…e sem edição em curso estão LIVRES', todosLivres(bs), bs.map((b) => b.disabled));

      /* O GESTO DELA: o botão de abrir a turma na listagem. */
      const ajustar = a.d.querySelector('#sec-curadorias [data-curadoria-ajustar]');
      conferir('a listagem tem o botão de abrir a turma', Boolean(ajustar), null);
      if (ajustar) a.clicar(ajustar);
      await espera(300);
      conferir('com a turma aberta em edição, o «Excluir» fica desabilitado', todosTravados(bs),
        { cuderivar: (a.d.getElementById('cuderivar') || {}).value, bs: bs.map((b) => b.disabled) });

      a.clicar(a.d.getElementById('cu-cancelar'));
      await espera(250);
      conferir('«Cancelar» devolve os «Excluir»', todosLivres(bs), bs.map((b) => b.disabled));
      a.fechar();
    }
  }

  // ===========================================================================================
  console.log('\nG. A guarda do gesto: o clique num botão travado não chega a pedir a exclusão');

  {
    const a = await abrir();
    a.d.getElementById('sec-professores').hidden = false;
    if (typeof a.W.definirSecaoRecolhida === 'function') a.W.definirSecaoRecolhida('sec-professores', false);
    await espera(150);
    a.clicar(a.d.querySelector('#sec-professores button.editar'));
    await espera(300);

    const bs = a.excluiresDa('sec-professores');
    const antes = a.pedidos.filter((p) => p.metodo === 'DELETE').length;
    /* O CLIQUE PROGRAMÁTICO CONTORNA O `disabled` DO RATO — e é isso que a guarda existe para
     * travar. `dispatchEvent` num botão desabilitado corre os ouvintes; um `disabled` sozinho seria
     * uma promessa que o código não cumpre. */
    bs.forEach((b) => a.clicar(b));
    await espera(400);
    const depois = a.pedidos.filter((p) => p.metodo === 'DELETE').length;
    conferir('clicar um «Excluir» travado não faz nenhum pedido de exclusão', depois === antes,
      a.pedidos.filter((p) => p.metodo === 'DELETE').map((p) => p.caminho));
    a.fechar();
  }

  // ===========================================================================================
  console.log('\nH. A regra é POR SECÇÃO: editar um professor não trava a aluna');

  {
    const a = await abrir();
    a.d.getElementById('sec-professores').hidden = false;
    a.d.getElementById('sec-alunas').hidden = false;
    if (typeof a.W.definirSecaoRecolhida === 'function') {
      a.W.definirSecaoRecolhida('sec-professores', false);
      a.W.definirSecaoRecolhida('sec-alunas', false);
    }
    await espera(150);
    a.clicar(a.d.querySelector('#sec-professores button.editar'));
    await espera(300);

    const daAluna = a.excluiresDa('sec-alunas');
    conferir('com o professor em edição, os «Excluir» da aluna continuam LIVRES',
      daAluna.length === 0 || todosLivres(daAluna), daAluna.map((b) => b.disabled));
    const doProf = a.excluiresDa('sec-professores');
    conferir('…e os do professor estão travados', todosTravados(doProf), doProf.map((b) => b.disabled));
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
