#!/usr/bin/env node
'use strict';

/**
 * provar-geracao.js — a tela sabe o que está a acontecer, e o workflow sabe o que gerar.
 *
 * Duas queixas da pesquisadora, em 19/10/2026, na escola `calando-teste-1`:
 *
 *   1. «Eu gerei o PO completo e não aparece nada na tela. Não diz se deu certo, se não
 *      deu, se está processando. Recarregar não muda nada.»
 *   2. «Já tem dois erros: no gerar o ciclo, e no guardar o PO que deriva do ciclo 01.»
 *
 * A primeira é esta prova: `motor/servidor/geracao.js` (o registro no KV + a consulta ao
 * GitHub) e `motor/servidor/geracao-cliente.js` (o cartão que a ponte injeta na porta).
 * Ela cobre as três fronteiras do AVISO: o disparo só sai com as fontes prontas, o ESTADO
 * conta a história certa, e o CARTÃO diz o que sabe — e cala o que não sabe.
 *
 * A segunda (o disparo que mandava a escola onde o gerador queria a variante, e o push que
 * perdia a corrida) é a prova irmã: `provar-geracao-do-ciclo.js`.
 *
 *   node experimentos/provar-geracao.js
 *
 * Sem rede: o GitHub é um `fetch` falso, e o KV é um mapa. Determinístico.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.join(__dirname, '..');
const ler = (p) => fs.readFileSync(path.join(RAIZ, p), 'utf8');

const { varianteDoContexto } = require('../motor/servidor/escrever-po.js');
const {
  criarGeracao, rotuloDaGeracao, chaveDoRegistro, fontesDoCicloProntas,
} = require('../motor/servidor/geracao.js');
const { SCRIPT: SCRIPT_DO_CARTAO } = require('../motor/servidor/geracao-cliente.js');
const { criarRotas } = require('../motor/servidor/rotas.js');
const { criarMemoria } = require('../motor/nucleo/armazenamento.js');

let n = 0;
let falhas = 0;
const ok = (titulo) => { n += 1; console.log(`  ${String(n).padStart(2)}. ${titulo}`); };
const morrer = (titulo, erro) => {
  n += 1;
  falhas += 1;
  console.log(`  ${String(n).padStart(2)}. ✗ ${titulo}\n     ${(erro && erro.message) || erro}`);
};
const prova = (titulo, fn) => {
  try { fn(); ok(titulo); } catch (e) { morrer(titulo, e); }
};
const provaAsync = async (titulo, fn) => {
  try { await fn(); ok(titulo); } catch (e) { morrer(titulo, e); }
};

const CONTEXTO = {
  escola: 'calando-teste-1',
  professor: 'sapo-bailarino',
  ciclo: '01',
  turma: 'balé nível 1 teste 1',
};
const VARIANTE = varianteDoContexto(CONTEXTO);
const ESCOLA = 'calando-teste-1';

// ===========================================================================
// 2. O GATILHO É CONDICIONADO AO QUE AS FONTES FICARAM
// ===========================================================================
// Antes, o disparo partia mesmo quando o `escrever-ciclo.js` falhava: o workflow arrancava
// sem fonte e morria. Pior que o erro era o silêncio — a tela dizia «gravado».

console.log('\no disparo só sai com as fontes prontas');

function oGatilho() {
  assert.equal(fontesDoCicloProntas(undefined), true);
  ok('sem escritor (modo local) não há o que bloquear');

  assert.equal(fontesDoCicloProntas({ docs: { ok: true }, escritas: [{ ok: true }] }), true);
  ok('fontes escritas: o disparo passa');

  assert.equal(fontesDoCicloProntas({ conf: { ok: false, pendencia: 'horário' } }), false);
  ok('`.conf` não composto (turma sem horário): o disparo NÃO passa');

  assert.equal(fontesDoCicloProntas({ escritas: [{ ok: true }, { ok: false }] }), false);
  ok('uma fonte que não foi escrita: o disparo NÃO passa');

  assert.equal(fontesDoCicloProntas({ cifrado: { ok: false } }), false);
  ok('a cópia cifrada que falhou: o disparo NÃO passa');
}

// ===========================================================================
// 3. O REGISTRO E O ESTADO
// ===========================================================================

const PORTA = (p) => JSON.parse(ler(path.join('porta', p)));

function kvFalso() {
  const dados = new Map();
  return {
    dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).sort().map((name) => ({ name })),
        list_complete: true,
      };
    },
  };
}

/** O GitHub de mentira: a lista de execuções e os passos de uma delas. */
function githubFalso(cenario) {
  const visto = [];
  const fetch = async (url) => {
    visto.push(String(url));
    if (/\/runs\?event=workflow_dispatch/.test(url)) {
      return { ok: true, json: async () => ({ workflow_runs: cenario.execucoes || [] }) };
    }
    if (/\/jobs(\?|$)/.test(url)) {
      return { ok: true, json: async () => ({ jobs: [{ name: 'gerar', steps: cenario.passos || [] }] }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  return { fetch, visto };
}

function execucao(campos) {
  return Object.assign({
    id: 1,
    status: 'queued',
    conclusion: null,
    html_url: 'https://github.com/tmenegaz/danca/actions/runs/1',
    display_title: rotuloDaGeracao(CONTEXTO),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, campos);
}

const AGORA = new Date().toISOString();

function registroBase(extras) {
  return Object.assign({
    em: AGORA,
    professor: CONTEXTO.professor,
    ciclo: CONTEXTO.ciclo,
    turma: CONTEXTO.turma,
    escola: ESCOLA,
    variante: VARIANTE,
    rotulo: rotuloDaGeracao(CONTEXTO),
    documentos: [{ id: 'plano', nome: 'Plano de ensino' }],
    disparo: { ok: true, status: 204 },
  }, extras);
}

async function oEstado() {
  // --- a chave e o rótulo
  assert.equal(chaveDoRegistro(ESCOLA, CONTEXTO),
    'bastidores/calando-teste-1/geracao/calando-teste-1-bale-nivel-1-teste-1');
  ok('a chave do KV é a variante — duas turmas da mesma escola não se sobrescrevem');

  assert.equal(rotuloDaGeracao(CONTEXTO),
    'Gerar o ciclo · sapo-bailarino/01/calando-teste-1-bale-nivel-1-teste-1');
  ok('o rótulo diz professor, ciclo e variante');

  // --- sem KV
  const semKv = criarGeracao({ kv: null, escola: ESCOLA, token: 'x' });
  assert.equal((await semKv.estado(CONTEXTO)).fase, 'indisponivel');
  ok('sem armazenamento a instância diz «indisponivel» — não inventa estado');

  // --- sem registro
  const vazio = criarGeracao({ kv: kvFalso(), escola: ESCOLA, token: 'x' });
  assert.equal((await vazio.estado(CONTEXTO)).fase, 'sem-registro');
  ok('escola sem geração registada responde «sem-registro»');

  // --- o registro grava o que é preciso para a tela
  const kv = kvFalso();
  const servico = criarGeracao({ kv, escola: ESCOLA, token: 'token', fetchImpl: githubFalso({}).fetch });
  const registro = await servico.registrar(CONTEXTO, {
    disparo: { ok: true, status: 204 },
    ciclo: {
      docs: { ok: true, docs: ['plano', 'aula-01', 'glossario-benesh'] },
      escritas: [{ ok: true }, { ok: true }],
      puladas: [],
    },
  });
  assert.equal(registro.ok, true);
  const guardado = JSON.parse(kv.dados.get(chaveDoRegistro(ESCOLA, CONTEXTO)));
  assert.equal(guardado.variante, VARIANTE);
  assert.equal(guardado.rotulo, rotuloDaGeracao(CONTEXTO));
  assert.deepEqual(guardado.documentos.map((d) => d.nome),
    ['Plano de ensino', 'Aula 01', 'Glossário Benesh']);
  ok('o registro guarda a variante, o rótulo e os documentos com nomes legíveis');

  // --- O PONTEIRO DO ÚLTIMO REGISTRO (20/10/2026). A tela pergunta pelo endereço da porta, que
  //     não traz a turma: para responder «o que esta escola pediu por último» era preciso
  //     ENUMERAR (`kv.list`) — a operação de cota diária. Com o ponteiro, é um `get`.
  assert.equal(kv.dados.get('bastidores/calando-teste-1/geracao/.ultimo'),
    chaveDoRegistro(ESCOLA, CONTEXTO));
  ok('gravar deixa o ponteiro do último registro (um `get` em vez de uma enumeração)');

  // Conta as enumerações: a pergunta da tela SEM turma não pode pagar nenhuma.
  let listas = 0;
  const kvContado = kvFalso();
  const listarOriginal = kvContado.list;
  kvContado.list = async (...args) => { listas += 1; return listarOriginal(...args); };
  const comPonteiro = criarGeracao({ kv: kvContado, escola: ESCOLA, token: 'token', fetchImpl: githubFalso({}).fetch });
  await comPonteiro.registrar(CONTEXTO, { disparo: { ok: true, status: 204 }, ciclo: {} });
  // A ESCOLA VAI NO CONTEXTO — o `rotas.js` preenche-a com o `ESCOLA_SLUG` do Worker
  // (`comAEscolaDoWorker`). Sem ela o pedido é recusado como incompleto, e a prova mediria
  // outra coisa que não o caminho da tela.
  const pedidoSemTurma = {
    professor: CONTEXTO.professor, ciclo: CONTEXTO.ciclo, escola: ESCOLA,
  };
  const estadoSemTurma = await comPonteiro.estado(pedidoSemTurma);
  assert.equal(listas, 0);
  ok('a pergunta sem turma (a do cartão) não enumera o KV — ' + estadoSemTurma.fase);

  // A ESCOLA ANTIGA, SEM PONTEIRO: cai na enumeração — e o ponteiro passa a existir.
  const kvVelho = kvFalso();
  await kvVelho.put(chaveDoRegistro(ESCOLA, CONTEXTO), JSON.stringify({
    em: '2026-10-19T10:00:00.000Z', variante: VARIANTE, rotulo: rotuloDaGeracao(CONTEXTO),
    documentos: [], disparo: { ok: true, status: 204 },
  }));
  const antigo = criarGeracao({ kv: kvVelho, escola: ESCOLA, token: 'x', fetchImpl: githubFalso({}).fetch });
  const achado = await antigo.estado(pedidoSemTurma);
  assert.equal(achado.fase !== 'sem-registro', true);
  assert.equal(kvVelho.dados.get('bastidores/calando-teste-1/geracao/.ultimo'),
    chaveDoRegistro(ESCOLA, CONTEXTO));
  ok('escola sem ponteiro acha o registro pela enumeração — e passa a ter ponteiro');

  // E COM A ENUMERAÇÃO A FALHAR (a cota), ainda responde pelo ponteiro.
  const kvQuebrado = kvFalso();
  await kvQuebrado.put('bastidores/calando-teste-1/geracao/.ultimo', chaveDoRegistro(ESCOLA, CONTEXTO));
  await kvQuebrado.put(chaveDoRegistro(ESCOLA, CONTEXTO), JSON.stringify({
    em: '2026-10-19T10:00:00.000Z', variante: VARIANTE, rotulo: rotuloDaGeracao(CONTEXTO),
    documentos: [], disparo: { ok: true, status: 204 },
  }));
  kvQuebrado.list = async () => { throw new Error('KV list() limit exceeded for the day.'); };
  const comCota = criarGeracao({ kv: kvQuebrado, escola: ESCOLA, token: 'x', fetchImpl: githubFalso({}).fetch });
  const pelaCota = await comCota.estado(pedidoSemTurma);
  assert.equal(pelaCota.fase !== 'sem-registro', true);
  ok('com a enumeração a estourar, o cartão continua a saber o estado (pelo ponteiro)');

  // --- as fases
  const casos = [
    ['enfileirada', { execucoes: [execucao({ status: 'queued' })] }, {}],
    ['em-andamento', { execucoes: [execucao({ status: 'in_progress' })],
      passos: [{ name: 'Gerar e validar o pacote', number: 4, status: 'in_progress', conclusion: null }] },
    (r) => assert.equal(r.etapaAtual, 'Gerar e validar o pacote')],
    ['concluida', { execucoes: [execucao({ status: 'completed', conclusion: 'success' })],
      passos: [{ name: 'Gerar e validar o pacote', status: 'completed', conclusion: 'success' }] }, {}],
    ['falhou', { execucoes: [execucao({ status: 'completed', conclusion: 'failure' })],
      passos: [
        { name: 'Instalar pandoc, TeX e pdfinfo', status: 'completed', conclusion: 'success' },
        { name: 'Gerar e validar o pacote', status: 'completed', conclusion: 'failure' },
      ] }, (r) => assert.equal(r.etapaQueFalhou, 'Gerar e validar o pacote')],
  ];
  for (const [esperada, cenario, confere] of casos) {
    const k = kvFalso();
    await k.put(chaveDoRegistro(ESCOLA, CONTEXTO), JSON.stringify(registroBase()));
    const g = criarGeracao({
      kv: k, escola: ESCOLA, token: 'token', fetchImpl: githubFalso(cenario).fetch,
      agora: () => new Date(),
    });
    const estado = await g.estado(CONTEXTO);
    assert.equal(estado.fase, esperada, 'fase esperada ' + esperada + ', veio ' + estado.fase);
    if (typeof confere === 'function') confere(estado);
    if (esperada === 'concluida' || esperada === 'falhou') {
      assert.ok(estado.run && estado.run.html_url, 'o estado final traz o link da execução');
    }
  }
  ok('as fases contam a história: fila → a correr (com o passo) → concluída, ou falhou (com o passo)');

  // --- a execução de OUTRA escola não é confundida com esta
  const kOutro = kvFalso();
  await kOutro.put(chaveDoRegistro(ESCOLA, CONTEXTO), JSON.stringify(registroBase()));
  const alheia = criarGeracao({
    kv: kOutro, escola: ESCOLA, token: 'token',
    fetchImpl: githubFalso({
      execucoes: [execucao({ display_title: 'Gerar o ciclo · outro/01/outra-escola-teste-1',
        status: 'completed', conclusion: 'success' })],
    }).fetch,
  });
  assert.equal((await alheia.estado(CONTEXTO)).fase, 'enfileirada');
  ok('a execução de outra escola é ignorada — é o rótulo que separa as gerações simultâneas');

  // --- mas a execução SEM nome de geração é reconhecida quando é a única
  const kAnonima = kvFalso();
  await kAnonima.put(chaveDoRegistro(ESCOLA, CONTEXTO), JSON.stringify(registroBase()));
  const anonima = await criarGeracao({
    kv: kAnonima, escola: ESCOLA, token: 'token',
    fetchImpl: githubFalso({
      execucoes: [execucao({ display_title: 'chore(entrega): gerar o pacote de …',
        status: 'completed', conclusion: 'success' })],
    }).fetch,
  }).estado(CONTEXTO);
  assert.equal(anonima.fase, 'concluida');
  ok('a execução sem nome de geração é seguida quando é a única na janela');

  // --- o disparo que falhou é desfecho, não espera
  const kFalho = kvFalso();
  await kFalho.put(chaveDoRegistro(ESCOLA, CONTEXTO),
    JSON.stringify(registroBase({ disparo: { ok: false, status: 401 } })));
  const estadoFalho = await criarGeracao({ kv: kFalho, escola: ESCOLA, token: 'token',
    fetchImpl: githubFalso({}).fetch }).estado(CONTEXTO);
  assert.equal(estadoFalho.fase, 'falhou-no-disparo');
  assert.equal(estadoFalho.erro, 'HTTP 401');
  ok('o disparo recusado (401) diz «não saiu» — em vez de girar para sempre');

  // --- sem token: o pedido saiu, mas esta instância não lê o estado
  const kSemToken = kvFalso();
  await kSemToken.put(chaveDoRegistro(ESCOLA, CONTEXTO), JSON.stringify(registroBase()));
  assert.equal((await criarGeracao({ kv: kSemToken, escola: ESCOLA, token: null })
    .estado(CONTEXTO)).fase, 'sem-consulta');
  ok('sem token a tela ainda mostra o registro e o link do workflow');

  // --- a tela pergunta sem a turma (o endereço da porta não a traz)
  const kSemTurma = kvFalso();
  await kSemTurma.put(chaveDoRegistro(ESCOLA, CONTEXTO), JSON.stringify(registroBase()));
  const outra = { escola: ESCOLA, professor: 'sapo-bailarino', ciclo: '01', turma: 'outra turma' };
  await kSemTurma.put(chaveDoRegistro(ESCOLA, outra),
    JSON.stringify(registroBase({ em: '2026-10-01T10:00:00.000Z', turma: 'outra turma' })));
  const semTurma = await criarGeracao({ kv: kSemTurma, escola: ESCOLA, token: 'token',
    fetchImpl: githubFalso({ execucoes: [execucao({ status: 'queued' })] }).fetch })
    .estado({ escola: ESCOLA, professor: 'sapo-bailarino', ciclo: '01' });
  assert.equal(semTurma.registro.turma, CONTEXTO.turma);
  ok('sem turma no pedido, responde o ÚLTIMO registro da escola (o endereço não traz a turma)');
}

// ===========================================================================
// 4. A ROTA: O «GUARDAR» DO PO INFORMA O QUE VAI ACONTECER
// ===========================================================================

async function pedir(rotas, metodo, caminho, corpo) {
  const resposta = await rotas.responder(new Request('http://local' + caminho, {
    method: metodo,
    headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  }));
  const texto = await resposta.text();
  let dados;
  try { dados = JSON.parse(texto); } catch (e) { dados = texto; }
  return { status: resposta.status, dados };
}

const BASE_PO = {
  fonte: 'po',
  simular: false,
  gravado: true,
  contexto: { professor: CONTEXTO.professor, ciclo: CONTEXTO.ciclo, turma: CONTEXTO.turma },
  respostas: {},
};

function bancada({ ciclo, disparar, geracao }) {
  return criarRotas({
    armazenamento: criarMemoria(),
    conteudo: PORTA('conteudo/anamnese.json'),
    esquema: PORTA('envelope/elicitacao-schema.json'),
    conteudoPO: PORTA('po/conteudo/po.json'),
    conteudoPlano: PORTA('plano/conteudo/plano.json'),
    escreverCiclo: async () => ciclo,
    disparar,
    geracao,
    escolaDoWorker: ESCOLA,
  });
}

const CICLO_BOM = {
  docs: { ok: true, docs: ['plano', 'aula-01'] },
  escritas: [{ ok: true }, { ok: true }],
  puladas: [],
  conf: { ok: true },
};

async function aRota() {
  // --- fontes prontas: dispara, registra, e diz o que está a ser gerado
  const pedidos = [];
  const kv = kvFalso();
  const geracao = criarGeracao({ kv, escola: ESCOLA, token: 'token',
    fetchImpl: githubFalso({ execucoes: [execucao({ status: 'queued' })] }).fetch });
  const rotas = bancada({
    ciclo: CICLO_BOM,
    disparar: async (c) => { pedidos.push(c); return { ok: true, status: 204 }; },
    geracao,
  });
  const r = await pedir(rotas, 'POST', '/api/elicitar', BASE_PO);
  assert.equal(r.status, 200);
  assert.equal(pedidos.length, 1);
  assert.equal(pedidos[0].turma, CONTEXTO.turma, 'o disparo recebeu a turma do contexto');
  ok('com as fontes prontas, o disparo sai — e vai com a turma no contexto');

  assert.equal(r.dados.geracao.ok, true);
  assert.ok(kv.dados.get(chaveDoRegistro(ESCOLA, CONTEXTO)), 'o registro não foi gravado no KV');
  ok('o disparo fica REGISTADO no KV — é o que sobrevive a recarregar a página');

  const estado = await pedir(rotas, 'GET',
    '/api/geracao?professor=' + encodeURIComponent(CONTEXTO.professor) + '&ciclo=01');
  assert.equal(estado.status, 200);
  assert.equal(estado.dados.fase, 'enfileirada');
  assert.equal(estado.dados.registro.turma, CONTEXTO.turma);
  assert.deepEqual(estado.dados.registro.documentos.map((d) => d.nome),
    ['Plano de ensino', 'Aula 01']);
  ok('GET /api/geracao devolve a fila, a turma e os documentos a gerar');

  // --- fontes que NÃO ficaram prontas: não dispara, e diz porquê
  const pedidos2 = [];
  const kv2 = kvFalso();
  const rotas2 = bancada({
    ciclo: { conf: { ok: false, pendencia: 'a hora de início da turma' }, escritas: [{ ok: true }] },
    disparar: async (c) => { pedidos2.push(c); return { ok: true, status: 204 }; },
    geracao: criarGeracao({ kv: kv2, escola: ESCOLA, token: 'token', fetchImpl: githubFalso({}).fetch }),
  });
  const r2 = await pedir(rotas2, 'POST', '/api/elicitar', BASE_PO);
  assert.equal(r2.status, 200);
  assert.equal(pedidos2.length, 0);
  assert.equal(r2.dados.disparo.naoDisparado, true);
  assert.match(r2.dados.disparo.motivo, /fontes do ciclo não ficaram prontas/);
  ok('fontes incompletas: NÃO dispara, e a tela recebe o motivo em vez de silêncio');

  // --- o roteador sem o serviço de estado
  const semServico = await pedir(bancada({ ciclo: CICLO_BOM, disparar: null, geracao: null }),
    'GET', '/api/geracao?professor=x&ciclo=01');
  assert.equal(semServico.status, 404);
  ok('instância sem serviço de estado recusa a rota (não inventa resposta)');

  // --- pedido sem professor/ciclo
  const semContexto = await pedir(bancada({ ciclo: CICLO_BOM, disparar: null, geracao }),
    'GET', '/api/geracao?ciclo=01');
  assert.equal(semContexto.status, 400);
  ok('pedido sem professor e ciclo é recusado com 400');
}

// ===========================================================================
// 6. O CARTÃO NA PORTA — diz o que sabe, cala o que não sabe
// ===========================================================================

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const HTML_DA_PORTA = `<!doctype html><html lang="pt-BR"><head><title>porta</title></head>
<body id="top" data-tela="porta">
  <section id="fecho">
    <div id="resultado"></div>
    <div class="acoes"><button class="acao" id="gravar">Guardar</button></div>
    <div id="gravacao"></div>
  </section>
</body></html>`;

async function abrirCartao({ busca = '?professor=sapo-bailarino&ciclo=01&fonte=po', respostas = [] } = {}) {
  const dom = new JSDOM(HTML_DA_PORTA, {
    url: 'https://escola.example/plano-observacao/' + busca,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const win = dom.window;
  const pedidos = [];
  const fila = respostas.slice();
  win.fetch = async (url) => {
    pedidos.push(String(url));
    const proximo = fila.length > 1 ? fila.shift() : fila[0];
    return { ok: true, status: 200, json: async () => proximo };
  };
  win.eval(SCRIPT_DO_CARTAO);
  await espera(30);
  return { dom, win, doc: win.document, pedidos };
}

function painel(doc) {
  return doc.getElementById('geracao-painel');
}

async function oCartao() {
  // --- sem professor/ciclo no endereço: nada aparece
  const semContexto = await abrirCartao({ busca: '' });
  assert.equal(painel(semContexto.doc), null);
  assert.equal(semContexto.pedidos.length, 0);
  ok('sem professor e ciclo no endereço o cartão nem é montado — nenhum pedido sai');
  semContexto.dom.window.close();

  // --- sem registro: a porta abre limpa, como sempre abriu
  const semRegistro = await abrirCartao({ respostas: [{ ok: true, fase: 'sem-registro' }] });
  assert.equal(painel(semRegistro.doc).hidden, true);
  ok('sem geração registada o cartão fica escondido — a porta abre limpa');
  semRegistro.dom.window.close();

  // --- a correr: giro visível, o passo, o link e os documentos
  const emAndamento = await abrirCartao({
    respostas: [{
      ok: true,
      fase: 'em-andamento',
      registro: registroBase({ documentos: [{ id: 'plano', nome: 'Plano de ensino' },
        { id: 'aula-01', nome: 'Aula 01' }] }),
      etapaAtual: 'Gerar e validar o pacote',
      run: { id: 9, status: 'in_progress', conclusion: null,
        html_url: 'https://github.com/tmenegaz/danca/actions/runs/9' },
    }],
  });
  const p1 = painel(emAndamento.doc);
  assert.equal(p1.hidden, false);
  assert.equal(p1.querySelector('.geracao-giro').hidden, false, 'o giro tem de estar a andar');
  assert.match(p1.querySelector('.geracao-titulo').textContent, /Gerando os documentos/);
  assert.match(p1.querySelector('.geracao-sub').textContent, /turma balé nível 1 teste 1/);
  assert.match(p1.querySelector('.geracao-docs').textContent, /Plano de ensino · Aula 01/);
  assert.match(p1.querySelector('.geracao-passo').textContent, /Gerar e validar o pacote/);
  assert.equal(p1.querySelector('.geracao-link a').getAttribute('href'),
    'https://github.com/tmenegaz/danca/actions/runs/9');
  assert.match(emAndamento.pedidos[0], /api\/geracao\?professor=sapo-bailarino&ciclo=01/);
  ok('a correr: giro, turma, documentos, passo actual e o link da execução');
  emAndamento.dom.window.close();

  // --- concluída: o giro para, e a frase diz o que fazer em seguida
  const concluida = await abrirCartao({
    respostas: [{
      ok: true,
      fase: 'concluida',
      registro: registroBase(),
      run: { id: 9, status: 'completed', conclusion: 'success',
        html_url: 'https://github.com/tmenegaz/danca/actions/runs/9' },
    }],
  });
  const p2 = painel(concluida.doc);
  assert.equal(p2.querySelector('.geracao-giro').hidden, true, 'concluída não gira mais');
  assert.match(p2.querySelector('.geracao-fim').textContent, /Pronto/);
  assert.equal(p2.querySelector('.geracao-fim').className.indexOf('ok') !== -1, true);
  ok('concluída: o giro para e a tela diz «Pronto — recarregue a página do ciclo»');
  concluida.dom.window.close();

  // --- falhou: diz em que passo, e que o que foi gravado está salvo
  const falhou = await abrirCartao({
    respostas: [{
      ok: true,
      fase: 'falhou',
      registro: registroBase(),
      etapaQueFalhou: 'Gerar e validar o pacote',
      run: { id: 9, status: 'completed', conclusion: 'failure',
        html_url: 'https://github.com/tmenegaz/danca/actions/runs/9' },
    }],
  });
  const p3 = painel(falhou.doc);
  assert.match(p3.querySelector('.geracao-passo').textContent, /Falhou no passo «Gerar e validar o pacote»/);
  assert.match(p3.querySelector('.geracao-fim').textContent, /O plano que você gravou está salvo/);
  assert.equal(p3.querySelector('.geracao-fim').className.indexOf('falha') !== -1, true);
  ok('falhou: nomeia o passo e tranquiliza — o que foi gravado não se perdeu');
  falhou.dom.window.close();

  // --- o disparo recusado
  const recusado = await abrirCartao({
    respostas: [{
      ok: true,
      fase: 'falhou-no-disparo',
      registro: registroBase({ disparo: { ok: false, status: 401 } }),
      erro: 'HTTP 401',
    }],
  });
  const p4 = painel(recusado.doc);
  assert.match(p4.querySelector('.geracao-titulo').textContent, /não saiu/);
  assert.match(p4.querySelector('.geracao-passo').textContent, /HTTP 401/);
  ok('o pedido que não saiu tem nome e motivo — não fica a girar');
  recusado.dom.window.close();

  // --- desfecho antigo não fica no ecrã
  const antigo = await abrirCartao({
    respostas: [{
      ok: true,
      fase: 'falhou',
      registro: registroBase({ em: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }),
      run: { id: 9, status: 'completed', conclusion: 'failure', html_url: 'https://x/9' },
    }],
  });
  assert.equal(painel(antigo.doc).hidden, true);
  ok('um desfecho de ontem não fica no ecrã de quem abre a porta hoje');
  antigo.dom.window.close();

  // --- o cartão não mexe no que a porta escreve
  const intacto = await abrirCartao({
    respostas: [{ ok: true, fase: 'sem-registro' }],
  });
  const gravacao = intacto.doc.getElementById('gravacao');
  gravacao.innerHTML = '<p class="ok">o que a porta escreveu</p>';
  await espera(20);
  assert.equal(gravacao.innerHTML, '<p class="ok">o que a porta escreveu</p>');
  ok('o cartão não toca no «#gravacao» — o que o motor da porta escreve continua dele');
  intacto.dom.window.close();
}

// ===========================================================================
// 7. A PONTE INJETA O CARTÃO — e só na porta
// ===========================================================================

/**
 * O ASSETS do Worker, servido do disco: o pacote da escola quando o arquivo existe lá, e
 * a pasta `porta/` no resto (o conteúdo, o esquema, o CSS). É o mesmo par que o Worker
 * real publica — o `assets.directory` aponta para o pacote, e a porta vive dentro dele.
 */
function assetsFalsos() {
  const PACOTE = path.join(RAIZ, 'professores/sapo-bailarino/ciclos/ciclo-01-calando-teste-1');
  const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.md': 'text/markdown' };
  return {
    async fetch(pedido) {
      const rel = decodeURIComponent(new URL(pedido).pathname.replace(/^\/+/, ''));
      // O ASSETS de uma escola publica o PACOTE, e a porta vive lá dentro, em
      // `plano-observacao/`. Sem o pacote (uma escola expurgada), a mesma árvore está em
      // `porta/` na raiz — e é de lá que se serve, tirando o prefixo. A prova não pode
      // depender de uma escola viva: quem a apaga é a própria pesquisadora, no ensaio.
      const semPrefixo = rel.replace(/^plano-observacao\//, '');
      const candidatos = [path.join(PACOTE, rel), path.join(RAIZ, 'porta', semPrefixo)];
      for (const arquivo of candidatos) {
        if (fs.existsSync(arquivo) && fs.statSync(arquivo).isFile()) {
          const tipo = TIPOS[path.extname(arquivo)] || 'application/octet-stream';
          return new Response(fs.readFileSync(arquivo), { status: 200, headers: { 'Content-Type': tipo } });
        }
      }
      return new Response('', { status: 404 });
    },
  };
}

async function aInjecao() {
  const producao = require('../motor/servidor/producao.js');
  // A Área do Professor só abre com um professor cadastrado — o freio é do produto, não
  // do teste: a porta é do professor, e sem ele a página explica onde cadastrá-lo.
  const env = { ESCOLA_SLUG: 'calando-teste-1', ESCOLA_HABILITADA: 'sim', PADD_KV: kvFalso(),
    PROFESSOR_NOME: 'Sapo Bailarino', ASSETS: assetsFalsos() };

  // O endereço carrega o slug da escola: a ponte de produção recusa servir quando o
  // subdomínio não bate com o `ESCOLA_SLUG` (é o freio que impede o deploy trocado).
  const porta = await producao.fetch(new Request('https://calando-teste-1.example/plano-observacao/'), env);
  const html = await porta.text();
  assert.match(html, /<script src="\/assets\/geracao\.js"><\/script><\/body>/);
  ok('a porta é servida com o cartão injetado — em qualquer escola, sem regenerar o pacote');

  const asset = await producao.fetch(new Request('https://calando-teste-1.example/assets/geracao.js'), env);
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('content-type'), /javascript/);
  assert.match(asset.headers.get('cache-control'), /no-store/);
  ok('o script é servido com `no-store` — o cartão não fica em cache no navegador');

  const assetTeste = await producao.fetch(new Request('https://calando-teste-1.example/assets/teste-preenchimento.js'), env);
  assert.equal(assetTeste.status, 200);
  ok('o preenchidor das escolas de teste continua a ser servido');
}

/*
 * O REDIRECIONAMENTO PARA A PÁGINA DA ESCOLA (20/10/2026).
 *
 * Concluída a geração, os documentos passam a existir e a tela onde o professor está — o
 * formulário do PO — já não tem nada para dizer. A página que diz «o que foi criado» é a raiz da
 * escola, e ninguém sabia ir lá: era preciso clicar na logo.
 *
 * O QUE NÃO PODE ACONTECER, e é o risco desta função: expulsar quem abriu a porta para trabalhar.
 * O cartão mostra o desfecho de uma geração recente por até duas horas (é HISTÓRICO, e é útil), e
 * uma regra ingénua — «se está concluída, redireciona» — faria de cada abertura da porta um
 * salto para fora, durante duas horas, e para sempre em ciclo. As guardas são duas: a página tem
 * de ter VISTO a geração a correr, e o salto acontece UMA VEZ por sessão.
 */
async function oRedirecionamento() {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  // A chave é por VARIANTE: duas turmas da mesma escola podem estar a gerar em separado, e
  // um salto numa não deve impedir o aviso da outra.
  const CHAVE_DA_SESSAO = 'geracao-abriu:' + VARIANTE;
  const concluida = {
    ok: true,
    fase: 'concluida',
    registro: registroBase(),
    run: { id: 12, status: 'completed', conclusion: 'success',
      html_url: 'https://github.com/tmenegaz/danca/actions/runs/12' },
  };
  const aCorrer = {
    ok: true,
    fase: 'em-andamento',
    registro: registroBase(),
    etapaAtual: 'Gerar e validar o pacote',
    run: { id: 12, status: 'in_progress', conclusion: null,
      html_url: 'https://github.com/tmenegaz/danca/actions/runs/12' },
  };

  /*
   * COMO SE MEDE UM SALTO QUE NÃO SE PODE INTERCEPTAR. O `location.assign` do jsdom é uma
   * propriedade não-configurável (e não navega: «Not implemented»). Em vez de contorcer o código
   * de produção para o tornar espionável, mede-se o que a decisão DEIXA ATRÁS — e são duas
   * coisas, as duas observáveis:
   *
   *   · o cartão passa a dizer «A abrir a página da escola…», que é a frase que o professor lê;
   *   · a sessão ganha a chave que impede o segundo salto.
   *
   * Juntas, provam a decisão. O destino em si (`/`) é uma linha só, e é afirmado no código-fonte —
   * está na asserção estática no fim.
   */
  async function abrir({ respostas, sessao }) {
    const dom = new JSDOM(HTML_DA_PORTA, {
      url: 'https://escola.example/plano-observacao/?professor=sapo-bailarino&ciclo=01&fonte=po',
      runScripts: 'outside-only',
      pretendToBeVisual: true,
      // O `setTimeout` do salto dispara depois do veredicto; o jsdom avisaria «Not implemented»
      // e o ruído passaria por falha. O que interessa já foi medido.
      virtualConsole: new VirtualConsole(),
    });
    const win = dom.window;
    for (const [k, v] of Object.entries(sessao || {})) win.sessionStorage.setItem(k, v);
    const fila = respostas.slice();
    win.fetch = async () => ({ ok: true, status: 200, json: async () => (fila.length > 1 ? fila.shift() : fila[0]) });
    win.eval(SCRIPT_DO_CARTAO);
    return { dom, win, doc: win.document };
  }

  const textoDoFim = (c) => {
    const el = c.doc.querySelector('.geracao-fim');
    return el ? el.textContent : '';
  };
  const chavesDeSessao = (c) => Object.keys(c.win.sessionStorage.toRaw ? c.win.sessionStorage.toRaw() : {})
    .concat([]);

  // --- 1. A encontrou a geração JÁ concluída: mostra o desfecho e fica onde está.
  {
    const c = await abrir({ respostas: [concluida] });
    await espera(80);
    assert.equal(/documentos do ciclo foram gerados/.test(textoDoFim(c)), true, textoDoFim(c));
    assert.equal(/A abrir a página da escola/.test(textoDoFim(c)), false);
    assert.equal(c.win.sessionStorage.getItem(CHAVE_DA_SESSAO), null);
    ok('uma geração já concluída à chegada mostra o desfecho e NÃO salta — a porta fica utilizável');
    c.dom.window.close();
  }

  /*
   * OS TRÊS CASOS QUE LEVAM A SEGUNDA CONSULTA CORREM EM PARALELO. O cartão espera 5 s entre
   * perguntas com a geração a correr (é o intervalo real, e não se mexe nele para o testar), e
   * três esperas em série fariam desta secção a mais lenta do projeto. São janelas independentes.
   */
  const falhou = {
    ok: true, fase: 'falhou', registro: registroBase(),
    etapaQueFalhou: 'Gerar e validar o pacote',
    run: { id: 13, status: 'completed', conclusion: 'failure', html_url: 'https://x/13' },
  };
  const [corrida, repetida, falhada] = await Promise.all([
    abrir({ respostas: [aCorrer, concluida] }),
    abrir({ respostas: [aCorrer, concluida], sessao: { [CHAVE_DA_SESSAO]: '1' } }),
    abrir({ respostas: [aCorrer, falhou] }),
  ]);
  await espera(5400);

  // --- 2. Viu a geração a correr e viu-a terminar: o caso do professor que acabou de gravar.
  {
    assert.equal(/A abrir a página da escola/.test(textoDoFim(corrida)), true, textoDoFim(corrida));
    assert.equal(corrida.win.sessionStorage.getItem(CHAVE_DA_SESSAO), '1');
    ok('vista a correr e depois concluída, a página abre a escola — e diz que o vai fazer');
    corrida.dom.window.close();
  }

  // --- 3. Uma vez por sessão: voltar à porta não expulsa outra vez.
  {
    assert.equal(/A abrir a página da escola/.test(textoDoFim(repetida)), false, textoDoFim(repetida));
    // O desfecho continua escrito: o que não acontece é o salto.
    assert.equal(/documentos do ciclo foram gerados/.test(textoDoFim(repetida)), true, textoDoFim(repetida));
    ok('voltando à porta na mesma sessão, não há segundo salto — o vaivém não existe');
    repetida.dom.window.close();
  }

  // --- 4. Falhou: nada de saltar. O plano está salvo, e a pessoa tem de o saber ali.
  {
    assert.equal(/A abrir a página da escola/.test(textoDoFim(falhada)), false, textoDoFim(falhada));
    assert.equal(falhada.win.sessionStorage.getItem(CHAVE_DA_SESSAO), null);
    ok('uma geração que falhou não salta — o desfecho tem de ser lido onde aconteceu');
    falhada.dom.window.close();
  }

  // --- 5. O destino, medido no código: a RAIZ, e com `assign` (para o «voltar» funcionar).
  {
    const fonte = require('fs').readFileSync(
      require('path').join(__dirname, '..', 'motor/servidor/geracao-cliente.js'), 'utf8');
    assert.equal(/window\.location\.assign\('\/'\)/.test(fonte), true,
      'o salto não tem de ir para a raiz do domínio');
    assert.equal(/window\.location\.replace/.test(fonte), false,
      'com `replace` a porta sairia do histórico, e o «voltar» saltava o formulário');
    ok('o salto vai para a raiz do domínio, e com `assign` — a porta fica no histórico');
  }

  void chavesDeSessao;
}

// ===========================================================================

(async () => {
  prova('o gatilho é condicionado', oGatilho);
  await provaAsync('o registro e o estado', oEstado);
  await provaAsync('a rota do «Guardar»', aRota);
  await provaAsync('o cartão na porta', oCartao);
  await provaAsync('o salto para a página da escola', oRedirecionamento);
  await provaAsync('a ponte injeta o cartão', aInjecao);

  console.log('');
  if (falhas) {
    console.log(`${falhas} de ${n} verificações FALHARAM`);
    process.exit(1);
  }
  console.log(`TUDO CERTO — ${n} verificações`);
  // As provas do cartão deixam o jsdom com relógios próprios; sair explicitamente evita
  // que um `setTimeout` órfão segure o processo depois do veredito.
  process.exit(0);
})();
