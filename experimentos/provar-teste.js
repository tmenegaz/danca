#!/usr/bin/env node
'use strict';

/**
 * provar-teste.js — as ESCOLAS DE TESTE: o fixture certo, e SÓ preenchimento.
 *
 * O combinado (19/10/2026): uma escola cujo nome traz `Calango`, `Batata` ou `Breu`
 * recebe, nos formulários, os valores do JSON `teste/<palavra>.json`. O carregador NÃO
 * envia nada: nem POST, nem PUT, nem DELETE; nem toca no KV. Ele só preenche.
 *
 * A prova cobre as três fronteiras:
 *   1. a DETECÇÃO — `Batata` é teste 2; `escola-real` e `testemunho` não são;
 *   2. a PRODUÇÃO — a página recebe `data-escola-teste` e o script só na escola de
 *      teste, e a rota `/api/teste` devolve o fixture daquela escola;
 *   3. a PORTA — na anamnese, a aluna A nasce preenchida e trocar para B troca os
 *      valores; no plano, a turma 1 nasce preenchida e trocar para a 2 troca o
 *      objetivo. Em todos os casos, NENHUM pedido que não seja GET.
 *
 * Uso:
 *   node experimentos/provar-teste.js
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.join(__dirname, '..');
const PAGINA_FONTE = path.join(RAIZ, 'porta/index.html');
const CONTEUDO_ANAMNESE = path.join(RAIZ, 'porta/conteudo/anamnese.json');
const CONTEUDO_PLANO = path.join(RAIZ, 'porta/plano/conteudo/plano.json');
const PACOTE = path.join(RAIZ, 'professores/tiago-menegaz/ciclos/ciclo-01-valse');
const ASSETS = path.join(PACOTE, 'assets');
const ASSETS_PAGINA = path.join(PACOTE, 'plano-observacao/assets');

const { numeroDoTeste, fixtureDaEscola } = require('../motor/servidor/teste-fixtures.js');
const { SCRIPT } = require('../motor/servidor/teste-cliente.js');
const bastidores = require('../motor/servidor/bastidores.js');

const FIXTURE = fixtureDaEscola('batata');
const MIME = { '.html': 'text/html;charset=utf-8', '.json': 'application/json;charset=utf-8',
  '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

let n = 0;
const ok = (titulo) => { n += 1; console.log(`  ${String(n).padStart(2)}. ${titulo}`); };

// ================= 1. A DETECÇÃO ============================================

function detectar() {
  const casos = [
    // A palavra, sozinha — é assim que se cria uma escola de teste à mão.
    ['calango', 1], ['batata', 2], ['breu', 3],
    // Em qualquer posição do nome, e a primeira que aparece é a que vale.
    ['escola-batata', 2], ['batata-da-tarde', 2], ['breu-de-manha', 3],
    ['calango-do-breu', 1], ['batata-do-breu', 2],
    // O nome de EXIBIÇÃO passa pelo mesmo slug: acento e maiúscula não atrapalham.
    ['Batata da Tarde', 2], ['CALANGO', 1],
    // E o que NÃO é: nomes parecidos, e a convenção antiga (`teste 1/2/3`).
    ['testemunho', 0], ['batatada', 0], ['breu2', 0], ['escola-real', 0],
    ['calando-teste-1', 0], ['plie-teste-1', 0], ['batata', 2],
  ];
  for (const [slug, esperado] of casos) {
    assert.equal(numeroDoTeste(slug), esperado, slug);
  }
  ok('a palavra Calango/Batata/Breu é o que decide; testemunho e batatada não são teste');
  assert.equal(fixtureDaEscola('batata').teste, 2);
  assert.equal(fixtureDaEscola('breu').teste, 3);
  assert.equal(fixtureDaEscola('calango').teste, 1);
  assert.equal(fixtureDaEscola('escola-real'), null);
  ok('o fixture está ligado ao número, e escola normal não recebe nenhum');
}

// ================= 2. A PRODUÇÃO ============================================

function criarKv() {
  const dados = new Map();
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
  };
}

async function producao() {
  const envTeste = { ESCOLA_SLUG: 'batata', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x',
    SENHA_PROFESSOR: 'y', PROFESSOR_NOME: 'Docente', PADD_KV: criarKv() };
  const envReal = { ESCOLA_SLUG: 'escola-real', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x',
    SENHA_PROFESSOR: 'y', PROFESSOR_NOME: 'Docente', PADD_KV: criarKv() };

  const rTeste = await bastidores.fetch(new Request('https://batata.example/bastidores/producao'), envTeste);
  const htmlTeste = await rTeste.text();
  assert.match(htmlTeste, /data-escola-teste="2"/);
  assert.match(htmlTeste, /\/scripts\/teste-preenchimento\.js/);
  ok('a Produção da escola de teste recebe o atributo e o preenchidor');

  const rReal = await bastidores.fetch(new Request('https://escola-real.example/bastidores/producao'), envReal);
  const htmlReal = await rReal.text();
  assert.doesNotMatch(htmlReal, /data-escola-teste=/);
  assert.doesNotMatch(htmlReal, /teste-preenchimento\.js/);
  ok('a Produção de uma escola normal não recebe nenhum dos dois');

  const prod = require('../motor/servidor/producao.js');
  const apiTeste = await prod.fetch(new Request('https://batata.example/api/teste'), envTeste);
  assert.equal(apiTeste.status, 200);
  const dados = await apiTeste.json();
  assert.equal(dados.teste, 2);
  assert.equal(dados.fixture.producao.turmas.length, 3);
  ok('/api/teste devolve o fixture da escola certa');

  const apiReal = await prod.fetch(new Request('https://escola-real.example/api/teste'), envReal);
  assert.equal(apiReal.status, 404);
  ok('/api/teste responde 404 para escola normal');
}


// ================= 2b. A PRODUÇÃO PREENCHIDA ================================

async function producaoNoNavegador() {
  const escola = 'batata';
  const kv = criarKv();
  const turmas = FIXTURE.producao.turmas.map((t, i) => Object.assign({}, t, {
    id: 'turma-' + i, ativo: true, vigenteDe: '2026-10-20',
  }));
  const rubricas = FIXTURE.producao.rubricas.map((r, i) => Object.assign({}, r, { id: 'rubrica-' + i }));
  const termos = FIXTURE.producao.vocabulario.map((v, i) => Object.assign({}, v, { id: 'termo-' + i }));
  await kv.put('bastidores/' + escola + '/turmas', JSON.stringify(turmas));
  await kv.put('bastidores/' + escola + '/rubricas', JSON.stringify(rubricas));
  // O VOCABULÁRIO JÁ NÃO SE PÕE NO KV (28/10/2026). Ele vive no repositório, e a tela lê-o do
  // bundle — pô-lo aqui seria criar o fixture de uma cópia que já não existe, e a prova passaria
  // a medir uma página que nenhum Worker serve.
  await kv.put('bastidores/' + escola + '/alunas', JSON.stringify(FIXTURE.producao.alunas));

  const env = { ESCOLA_SLUG: escola, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x',
    SENHA_PROFESSOR: 'y', PROFESSOR_NOME: 'Docente', PADD_KV: kv };
  const pagina = await bastidores.fetch(new Request('https://' + escola + '.example/bastidores/producao'), env);
  const html = await pagina.text();

  const pedidos = [];
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    pedidos.push(req.method);
    const envia = (tipo, corpo, status) => {
      res.writeHead(status || 200, { 'Content-Type': tipo, 'Cache-Control': 'no-store' });
      res.end(corpo);
    };
    if (u.pathname === '/api/teste') {
      return envia(MIME['.json'], JSON.stringify({ ok: true, teste: 1, escola: escola, fixture: FIXTURE }));
    }
    if (u.pathname.startsWith('/api/bastidores/')) {
      return envia(MIME['.json'], JSON.stringify({ ok: true, turmas: [], alunas: [], termos: [],
        rubricas: [], professores: [{ nome: 'Docente', slug: 'docente' }] }));
    }
    if (u.pathname === '/assets/style.css') return envia(MIME['.css'], fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')));
    if (u.pathname === '/assets/nav.js') return envia(MIME['.js'], fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
    if (u.pathname === '/scripts/teste-preenchimento.js') return envia(MIME['.js'], SCRIPT);
    if (u.pathname === '/assets/favicon.svg') return envia(MIME['.svg'], fs.readFileSync(path.join(RAIZ, 'tools/templates/marca/favicon.svg')));
    if (u.pathname === '/bastidores/producao' || u.pathname === '/bastidores/producao/') return envia(MIME['.html'], html);
    return envia('text/plain', '404 ' + u.pathname, 404);
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const abrirProducao = async (editando) => {
    const problemas = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
    vc.on('error', (...a) => problemas.push(a.join(' ')));
    const dom = await JSDOM.fromURL(base + '/bastidores/producao', {
      runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {} });
        w.fetch = (u, i) => fetch(new URL(String(u), base + '/bastidores/producao'), i);
        w.confirm = () => true; w.alert = () => {}; w.scrollTo = () => {};
        if (editando) {
          try { w.sessionStorage.setItem('producao:editando', 'turma'); } catch (e) {}
        }
      },
    });
    await espera(900);
    return { dom, d: dom.window.document, problemas };
  };

  const primeira = await abrirProducao(false);
  /* A SALA E A RÉGUA JÁ NÃO SE PREENCHEM, E ISSO É A CORRECÇÃO (19/11/2026).
   *
   * A SALA. As salas do fixture são as MESMAS que este teste põe no KV (`turmas` acima) — é uma
   * escola de teste, e o fixture é o que ela já tem. Escrever o nome de uma delas num formulário de
   * CRIAR é pedir ao servidor para criar o que já existe: era assim que a pesquisadora recebia «já
   * existe uma turma com este nome» depois de corrigir o nome da sala e o preenchimento lhe pôr o
   * antigo outra vez. Ver `provar-sala-e-portao.js`, secção A.
   *
   * A RÉGUA. `#rubr-nome` deixou de ser a rubrica da ESCOLA: a régua é do professor, e vive no
   * passo 2 do cadastro dele. Preencher aqui seria escrever a régua de uma pessoa que o fixture
   * não conhece.
   *
   * O QUE O PREENCHEDOR CONTINUA A FAZER: o termo e a aluna — esses sim, campos de criação. */
  assert.equal(primeira.d.getElementById('tnome').value, '');
  assert.equal(primeira.d.getElementById('rubr-nome').value, '');
  /* O TERMO PASSOU PARA O «+» DO VERBETE (01/11/2026). O preenchimento escreve agora em
   * `vnnome` — os campos do exercício —, e abre o modo do exercício antes, porque esses campos
   * só existem quando ele está aberto. O `vtermo` da secção do vocabulário deixou de existir. */
  assert.equal(primeira.d.getElementById('vnnome').value, FIXTURE.producao.vocabulario[0].termo);
  assert.equal(primeira.d.getElementById('anome').value, FIXTURE.producao.alunas[0]);
  assert.ok(primeira.d.querySelector('details.teste-painel'), 'o painel de teste não apareceu na Produção');
  assert.deepEqual([...new Set(pedidos)], ['GET']);
  ok('a Produção nasce com termo e aluna preenchidos — e a sala que já existe não se propõe criar');
  primeira.dom.window.close();

  const emEdicao = await abrirProducao(true);
  assert.equal(emEdicao.d.getElementById('tnome').value, '');
  assert.ok(emEdicao.d.querySelector('details.teste-painel'), 'o painel sumiu no modo edição');
  ok('em modo edição o fixture NÃO passa por cima do formulário; o painel continua');
  emEdicao.dom.window.close();

  srv.close();
}


// ================= 2c. O ESTADO FORA DA EDIÇÃO ===============================

async function estadoForaDaEdicao() {
  const escola = 'escola-real';
  const kv = criarKv();
  const turma = { id: 't1', nome: 'Turma Antiga', ativo: true, vigenteDe: '2026-10-20',
    programaReferencia: '', nivelReferencia: 'Grade 1', descricao: 'nota antiga',
    dias: ['ter'], horarios: { ter: '19:00' }, duracaoMin: 60,
    periodoInicio: '2026-10-20', periodoFim: '2026-12-20' };
  const rubrica = { id: 'r1', nome: 'Régua Antiga', niveis: ['Bom', 'Regular'] };
  await kv.put('bastidores/' + escola + '/turmas', JSON.stringify([turma]));
  await kv.put('bastidores/' + escola + '/rubricas', JSON.stringify([rubrica]));

  const env = { ESCOLA_SLUG: escola, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x',
    SENHA_PROFESSOR: 'y', PROFESSOR_NOME: 'Docente', PADD_KV: kv };
  const html = await (await bastidores.fetch(
    new Request('https://' + escola + '.example/bastidores/producao'), env)).text();

  const ESTADO = JSON.stringify({
    turma: {
      nome: 'Turma Antiga', descricao: 'nota antiga', duracaoMin: '60',
      periodoInicio: '2026-10-20', periodoFim: '2026-12-20',
      __niveis: ['Grade 1'], __programa: '', __horarios: { ter: '19:00' },
      __derivar: 't1', __modo: 'editar', 'dia:ter': true,
    },
    rubrica: { id: 'r1', nome: 'Régua Antiga', niveis: ['Bom', 'Regular'] },
    vincular: { turma: 't1', rubrica: 'r1' },
  });

  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const envia = (tipo, corpo, status) => {
      res.writeHead(status || 200, { 'Content-Type': tipo, 'Cache-Control': 'no-store' });
      res.end(corpo);
    };
    if (u.pathname.startsWith('/api/bastidores/')) {
      return envia(MIME['.json'], JSON.stringify({ ok: true, turmas: [], alunas: [], termos: [], rubricas: [] }));
    }
    if (u.pathname === '/assets/style.css') return envia(MIME['.css'], fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')));
    if (u.pathname === '/assets/nav.js') return envia(MIME['.js'], fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
    if (u.pathname === '/assets/favicon.svg') return envia(MIME['.svg'], fs.readFileSync(path.join(RAIZ, 'tools/templates/marca/favicon.svg')));
    if (u.pathname === '/bastidores/producao' || u.pathname === '/bastidores/producao/') return envia(MIME['.html'], html);
    return envia('text/plain', '404 ' + u.pathname, 404);
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;

  const abrir = async (editando) => {
    const vc = new VirtualConsole();
    const dom = await JSDOM.fromURL(base + '/bastidores/producao', {
      runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {} });
        w.fetch = (u, i) => fetch(new URL(String(u), base + '/bastidores/producao'), i);
        w.confirm = () => true; w.alert = () => {}; w.scrollTo = () => {};
        try {
          w.sessionStorage.setItem('producao:form', ESTADO);
          if (editando) w.sessionStorage.setItem('producao:editando', 'turma');
        } catch (e) {}
      },
    });
    await espera(500);
    return dom;
  };

  const semEdicao = await abrir(false);
  const d1 = semEdicao.window.document;
  assert.equal(d1.getElementById('tnome').value, '');
  assert.equal(d1.getElementById('rubr-nome').value, '');
  /* O `#vinc-rubrica` SAIU (19/11/2026): a régua deixou de se associar à sala por um `select` da
   * escola — ela vem com o professor, e a régua compõe-se em Professores. O passo 2 das Salas passou
   * a perguntar a modalidade e o professor. A asserção mede a mesma coisa (o estado antigo não
   * restaura) nos campos que existem hoje. */
  assert.equal(d1.getElementById('vinc-modalidade').value, '');
  assert.equal(d1.getElementById('vinc-professor').value, '');
  ok('sem «Editar», o estado antigo não restaura: sala, régua e o par modalidade × professor ficam vazios');
  semEdicao.window.close();

  const emEdicao = await abrir(true);
  const d2 = emEdicao.window.document;
  assert.equal(d2.getElementById('tnome').value, 'Turma Antiga');
  /* A RÉGUA JÁ NÃO VOLTA PELO ESTADO DA SALA (19/11/2026) — «a régua é do professor». O campo
   * `#rubr-nome` existe nesta página, mas é o do passo 2 do cadastro DELE, e ele não se preenche
   * com o estado de uma sala: `estadoDoFormulario` deixou de capturar a rubrica, e a régua vem do
   * registo da pessoa (`professores/<slug>/rubrica`). O que continua a valer — e é o que esta
   * secção mede — é a memória do que a pessoa escreveu: o nome da sala. */
  assert.equal(d2.getElementById('rubr-nome').value, '');
  ok('com «Editar», o estado volta a preencher a sala (e a régua já não vem por aqui)');
  emEdicao.window.close();
  srv.close();
}

// ================= 3. A PORTA ==============================================

let PORTA = 0;
const BASE = () => `http://127.0.0.1:${PORTA}`;

const MAPA_ANAMNESE = (() => {
  const porta = require('../motor/nucleo/porta.js');
  return { ok: true, ...porta.mapa(JSON.parse(fs.readFileSync(CONTEUDO_ANAMNESE, 'utf8'))) };
})();
const MAPA_PLANO = (() => {
  const porta = require('../motor/nucleo/porta.js');
  return { ok: true, ...porta.mapa(JSON.parse(fs.readFileSync(CONTEUDO_PLANO, 'utf8'))) };
})();
const MAPA_PO = (() => {
  const porta = require('../motor/nucleo/porta.js');
  return { ok: true, ...porta.mapa(JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta/po/conteudo/po.json'), 'utf8'))) };
})();

// O PLANO já lançado na estante: um carimbo por turma da fixture, com as respostas DENTRO
// (é `api/envelope/<carimbo>` que a tela lê para saber a metodologia e os blocos da aula).
const PLANOS_DA_ESTANTE = (FIXTURE.plano || []).map((pl, i) => ({
  carimbo: 'plano-2026101' + i + '-1000',
  turma: pl.turma,
  respostas: pl.respostas,
}));
const ANAMNESES_DA_ESTANTE = (FIXTURE.anamnese || []).map((a, i) => ({
  carimbo: 'anamnese-2026101' + i + '-1000',
  aluna: a.aluna,
  respostas: a.respostas,
}));
// Um interruptor para a prova poder fingir a estante VAZIA (o «ainda não há plano»).
let ESTANTE_VAZIA = false;
/* A CURADORIA DO DOCENTE, quando a prova quer recortá-la (27/10/2026). `null` = as três turmas
 * da fixture. Uma lista = só aquelas — é como se mede o preenchimento de teste a respeitar a
 * autorização, que é a regra nova. */
let CURADORIA_RECORTADA = null;

const PEDIDOS = [];

function apiDe(rota, fonte) {
  if (rota.startsWith('api/mapa')) {
    if (fonte === 'po') return MAPA_PO;
    return fonte === 'plano' ? MAPA_PLANO : MAPA_ANAMNESE;
  }
  if (rota.startsWith('api/planos')) {
    return {
      ok: true,
      opcoes: ESTANTE_VAZIA ? [] : PLANOS_DA_ESTANTE.map((p) => ({
        valor: p.carimbo, rotulo: p.respostas['objetivo-geral'], carimbo: p.carimbo,
        turma: p.turma, detalhe: 'api/envelope/' + p.carimbo, vinculada: false, por: [],
      })),
    };
  }
  if (rota.startsWith('api/anamneses')) {
    return {
      ok: true,
      opcoes: ESTANTE_VAZIA ? [] : ANAMNESES_DA_ESTANTE.map((a) => ({
        valor: a.aluna, rotulo: a.aluna, carimbo: a.carimbo,
        detalhe: 'api/envelope/' + a.carimbo, vinculada: false, por: [],
      })),
    };
  }
  if (rota.startsWith('api/envelopes')) {
    return { ok: true, envelopes: PLANOS_DA_ESTANTE.map((p) => p.carimbo + '.json') };
  }
  if (rota.startsWith('api/envelope/')) {
    const id = decodeURIComponent(rota.slice('api/envelope/'.length));
    const achado = PLANOS_DA_ESTANTE.concat(ANAMNESES_DA_ESTANTE).find((e) => e.carimbo === id);
    if (!achado) return null;
    const respostas = {};
    for (const [k, v] of Object.entries(achado.respostas || {})) respostas[k] = { valor: v, origem: 'declarado' };
    return { id, contexto: { escola: 'batata', professor: 'Docente', ciclo: '01' }, respostas };
  }
  if (rota.startsWith('api/teste')) {
    return { ok: true, teste: 2, escola: 'batata', fixture: FIXTURE };
  }
  if (rota.startsWith('api/bastidores/professores')) {
    return { ok: true, escola: 'batata', professores: [{ nome: 'Docente', slug: 'docente' }] };
  }
  if (rota.startsWith('api/bastidores/alunas')) {
    return { ok: true, alunas: FIXTURE.producao.alunas };
  }
  if (rota.startsWith('api/bastidores/turmas')) {
    /* AS TURMAS DO CADASTRO — mais as que a prova recorta na curadoria sem elas existirem no
     * fixture (ver `CURADORIA_RECORTADA`). Sem isto, o recorte para uma turma desconhecida
     * esvaziava o seletor pelo motivo errado: não é «a curadoria aponta para fora do cadastro»,
     * é «esta turma não tem plano de fixture». São coisas diferentes, e a prova mede a segunda. */
    const turmas = FIXTURE.producao.turmas.map((t) => Object.assign({}, t, { id: t.nome }));
    for (const nome of CURADORIA_RECORTADA || []) {
      if (!turmas.some((t) => t.nome === nome)) {
        turmas.push({ id: nome, nome: nome, ativo: true, frequencia: 2, dias: ['seg'],
          duracaoMin: 50, periodoInicio: '2027-02-01', periodoFim: '2027-04-30' });
      }
    }
    return {
      ok: true,
      turmas: turmas,
      opcoes: turmas.map((t) => ({ valor: t.nome, rotulo: t.nome })),
    };
  }
  if (rota.startsWith('api/bastidores/turma-conteudos')) return { ok: true, relacoes: {} };
  if (rota.startsWith('api/bastidores/termos')) return { ok: true, termos: [], opcoes: [] };
  /* A BANCADA DECLARA A CURADORIA (27/10/2026).
   *
   * Ficava no `{ok: true}` genérico — sem `curadorias` —, e a lista de turmas do plano vinha
   * INTEIRA: a regra tratava «a direção não atribuiu nada» como «pode tudo». Corrigida a regra
   * (a ausência deixou de ser permissão), esta bancada passou a ter ZERO turmas — e com razão,
   * porque não dizia nada sobre quem é curado para o quê.
   *
   * O `Docente` é curado para as turmas da fixture, e é isso que a prova mede: trocar a turma no
   * cabeçalho repreenche o plano com os valores daquela turma. Sem esta linha a prova continua a
   * falhar, e passaria a falhar pelo motivo errado. */
  if (rota.startsWith('api/bastidores/curadoria-professor')) {
    return {
      ok: true,
      professor: 'docente',
      curadorias: [{
        id: 'c-docente', professor: 'docente', escola: 'batata',
        turmas: CURADORIA_RECORTADA || FIXTURE.plano.map((pl) => pl.turma),
        alunas: (FIXTURE.anamnese || []).map((a) => a.aluna),
      }],
    };
  }
  if (rota.startsWith('api/bastidores/')) return { ok: true };
  if (rota.startsWith('api/')) return { ok: true, opcoes: [], estados: [] };
  return null;
}

function htmlDaPorta(comTeste, fonte) {
  let html = fs.readFileSync(PAGINA_FONTE, 'utf8');
  if (!comTeste) return html;
  html = html.replace(/<html([^>]*)>/i, '<html$1 data-escola-teste="2">');
  html = html.replace(/<\/body>/i, '<script>' + SCRIPT + '</script></body>');
  return html;
}

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, BASE());
  const caminho = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  PEDIDOS.push({ metodo: req.method, caminho: caminho });
  const envia = (corpo, tipo, status) => {
    res.writeHead(status || 200, { 'Content-Type': tipo, 'Cache-Control': 'no-store' });
    res.end(corpo);
  };

  const fonte = caminho.startsWith('plano-observacao/') ? 'po'
    : caminho.startsWith('plano-ensino/') ? 'plano'
    : caminho.startsWith('anamnese/') ? 'anamnese'
    : (url.searchParams.get('fonte') === 'plano' ? 'plano'
      : url.searchParams.get('fonte') === 'po' ? 'po' : 'anamnese');

  // As chamadas da porta chegam com o prefixo do caminho (`/anamnese/api/…`).
  const api = caminho.match(/^(anamnese|plano-ensino|plano-observacao)\/(api\/.*)$/);
  if (api) {
    const rota = api[2] + (url.search || '');
    const dados = apiDe(rota, fonte);
    if (dados) return envia(JSON.stringify(dados), MIME['.json']);
    return envia(JSON.stringify({ ok: false, erro: 'nao encontrado' }), MIME['.json'], 404);
  }
  // As chamadas ABSOLUTAS da porta (`/api/bastidores/alunas`, `/api/teste`).
  if (caminho.startsWith('api/')) {
    const dados = apiDe(caminho, fonte);
    if (dados) return envia(JSON.stringify(dados), MIME['.json']);
    return envia(JSON.stringify({ ok: false, erro: 'nao encontrado' }), MIME['.json'], 404);
  }

  if (caminho === 'anamnese/' || caminho === 'anamnese/index.html' ||
      caminho === 'plano-ensino/' || caminho === 'plano-ensino/index.html' ||
      caminho === 'plano-observacao/' || caminho === 'plano-observacao/index.html') {
    return envia(htmlDaPorta(url.searchParams.get('normal') !== '1', fonte), MIME['.html']);
  }

  const origem = caminho.replace(/^(anamnese|plano-ensino|plano-observacao)\//, '');
  const asset = origem.startsWith('assets/')
    ? path.join(ASSETS_PAGINA, path.basename(origem))
    : null;
  if (asset && fs.existsSync(asset)) return envia(fs.readFileSync(asset), MIME[path.extname(asset)] || 'application/octet-stream');
  if (origem === 'assets/markdown.js') return envia(fs.readFileSync(path.join(RAIZ, 'porta/assets/markdown.js')), MIME['.js']);
  if (origem === 'assets/style.css') return envia(fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')), MIME['.css']);
  if (origem === 'assets/nav.js') return envia(fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')), MIME['.js']);
  if (origem === 'assets/lib-cifra.js') return envia(fs.readFileSync(path.join(RAIZ, 'tools/lib-cifra.js')), MIME['.js']);

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 ' + caminho);
});

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function abrir(caminho) {
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  vc.on('error', (...a) => problemas.push(a.join(' ')));
  const dom = await JSDOM.fromURL(BASE() + '/' + caminho, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), BASE() + '/' + caminho), i);
      // O jsdom não traz `CSS.escape`; o navegador traz. É do AMBIENTE, não da página.
      w.CSS = w.CSS || {};
      if (!w.CSS.escape) w.CSS.escape = (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
      w.confirm = () => true;
      w.alert = () => {};
    },
  });
  await espera(600);
  return { dom, win: dom.window, doc: dom.window.document, problemas };
}

async function porta() {
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  PORTA = servidor.address().port;

  // ---- 3a. ANAMNESE ----
  PEDIDOS.length = 0;
  const anam = await abrir('anamnese/?professor=docente&ciclo=01');
  assert.equal(anam.doc.body.getAttribute('data-tela'), 'porta');
  assert.ok(anam.doc.querySelector('details.teste-painel'), 'o painel do teste não apareceu');
  assert.equal(anam.doc.getElementById('ctx-aluna').value, FIXTURE.anamnese[0].aluna);
  const idadeA = await anam.win.eval('RESPOSTAS.get("idade")');
  assert.equal(idadeA, FIXTURE.anamnese[0].respostas.idade);
  const total = await anam.win.eval('RESPOSTAS.size');
  assert.ok(total > 40, 'a anamnese não foi preenchida: ' + total);
  ok('a anamnese nasce preenchida com a Aluna A da fixture');

  const alunaB = FIXTURE.anamnese[1];
  await anam.win.eval(`(function(){
    var s = document.getElementById('ctx-aluna');
    s.value = ${JSON.stringify(alunaB.aluna)};
    s.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await espera(250);
  const idadeB = await anam.win.eval('RESPOSTAS.get("idade")');
  assert.equal(idadeB, alunaB.respostas.idade);
  ok('trocar a aluna no contexto repreenche com os valores daquela aluna');

  const metodosAnamnese = [...new Set(PEDIDOS.map((p) => p.metodo))];
  assert.deepEqual(metodosAnamnese, ['GET']);
  ok('a anamnese só fez GET — nenhum envio, nenhuma gravação');
  anam.dom.window.close();

  // ---- 3b. PLANO DE ENSINO ----
  PEDIDOS.length = 0;
  const plano = await abrir('plano-ensino/?professor=docente&ciclo=01&fonte=plano');
  assert.ok(plano.doc.querySelector('details.teste-painel'), 'o painel do plano não apareceu');
  const selTurma = plano.doc.getElementById('ctx-turma');
  assert.ok(selTurma, 'o seletor de turma não abriu');
  assert.equal(selTurma.value, FIXTURE.plano[0].turma);
  const objetivo1 = await plano.win.eval('RESPOSTAS.get("objetivo-geral")');
  assert.equal(objetivo1, FIXTURE.plano[0].respostas['objetivo-geral']);
  ok('o plano nasce preenchido com a primeira turma da fixture');

  const turma2 = FIXTURE.plano[1].turma;
  await plano.win.eval(`(function(){
    var s = document.getElementById('ctx-turma');
    s.value = ${JSON.stringify(turma2)};
    s.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await espera(300);
  const objetivo2 = await plano.win.eval('RESPOSTAS.get("objetivo-geral")');
  assert.equal(objetivo2, FIXTURE.plano[1].respostas['objetivo-geral']);
  ok('trocar a turma no contexto repreenche com os valores daquela turma');

  /* A IDENTIDADE É DE QUEM PREENCHE; O FIXTURE SÓ DÁ O CONTEÚDO (18/11/2026).
   *
   * A pesquisadora: «se eu mudo o nome no plano de ensino para a turma não ser um daqueles nomes
   * que já estão definidos pelo ambiente de teste, o plano de ensino não reconhece o nome que eu
   * coloquei». O preenchedor exigia a turma do FIXTURE no seletor e, quando ela não estava,
   * desistia — e ainda mudava o seletor para a turma do fixture quando estava. As duas metades
   * são o mesmo erro: o fixture mandava na identidade.
   *
   * O que se mede, e são três coisas: (a) o seletor NÃO se move; (b) a resposta «contexto-turma»
   * diz a turma do SELETOR — a divergência de 01/11/2026 continua fechada; (c) o conteúdo é o do
   * registo escolhido no painel. O fixture preenche, a turma é dela.
   *
   * O SELETOR VOLTA À TURMA 1 ANTES DE O PAINEL ESCOLHER A 2: sem este passo a asserção seria
   * trivial, porque a secção anterior já tinha posto o seletor na turma 2. */
  await plano.win.eval(`(function(){
    var s = document.getElementById('ctx-turma');
    s.value = ${JSON.stringify(FIXTURE.plano[0].turma)};
    s.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await espera(300);
  const painelPreencheu = await plano.win.eval(`(function(){
    var antes = document.getElementById('ctx-turma').value;
    window.__preencherTeste.plano(${JSON.stringify(FIXTURE.plano[1])});
    return {
      antes: antes,
      seletor: document.getElementById('ctx-turma').value,
      resposta: RESPOSTAS.get('contexto-turma'),
      objetivo: RESPOSTAS.get('objetivo-geral'),
    };
  })()`);
  assert.notEqual(painelPreencheu.antes, FIXTURE.plano[1].turma,
    'a asserção não mediria nada: o seletor já estava na turma do registo escolhido');
  assert.equal(painelPreencheu.seletor, FIXTURE.plano[0].turma,
    'o preenchimento moveu o seletor: ' + JSON.stringify(painelPreencheu));
  assert.equal(painelPreencheu.resposta, FIXTURE.plano[0].turma,
    'a resposta e o seletor divergiram: ' + JSON.stringify(painelPreencheu));
  assert.equal(painelPreencheu.objetivo, FIXTURE.plano[1].respostas['objetivo-geral'],
    'o conteúdo não veio do registo escolhido: ' + JSON.stringify(painelPreencheu));
  ok('o painel de teste preenche o CONTEÚDO e não toca na TURMA — e a resposta segue o seletor');

  const metodosPlano = [...new Set(PEDIDOS.map((p) => p.metodo))];
  assert.deepEqual(metodosPlano, ['GET']);
  ok('o plano só fez GET — nenhum envio, nenhuma gravação');

  /* O PREENCHIMENTO DE TESTE NÃO PASSA POR CIMA DA CURADORIA — E NÃO SE CALA POR CAUSA DELA
   * (27/10/2026, revisto a 18/11/2026).
   *
   * A pesquisadora desconfiou da ferramenta: «o que preenche campos […] está interferindo ali».
   * Interferia: `garantirOpcao` ACRESCENTAVA ao seletor a turma do fixture quando ela não estava
   * na lista autorizada — e o servidor passou a recusar gravar essa turma. O sintoma era o
   * preenchimento de teste a preparar um plano que não podia ser guardado.
   *
   * A correção de então tinha duas metades, e a segunda estava errada: com uma turma SEM plano no
   * fixture (a turma que ela inventa, que é o que se faz a testar) «nada se preenchia». A
   * ferramenta ficava muda na única situação em que é precisa. O que fica medido aqui:
   * (a) com a curadoria recortada para uma turma que TEM plano no fixture, preenche-se com essa;
   * (b) com uma turma que NÃO tem, preenche-se com o CONTEÚDO do primeiro registo — a turma do
   * seletor não se toca, e a resposta diz a turma dela. Nunca se acrescenta ao seletor. */
  console.log('\n14. O preenchimento de teste respeita a curadoria');
  CURADORIA_RECORTADA = [FIXTURE.plano[1].turma];
  const recortado = await abrir('plano-ensino/?professor=docente&ciclo=01&fonte=plano');
  await espera(700);
  const selRecortado = recortado.doc.getElementById('ctx-turma');
  const opcoesRecortadas = [...selRecortado.options].map((o) => o.value).filter(Boolean);
  assert.deepEqual(opcoesRecortadas, [FIXTURE.plano[1].turma]);
  assert.equal(selRecortado.value, FIXTURE.plano[1].turma);
  const preencheuRecortado = await recortado.win.eval('RESPOSTAS.get("objetivo-geral")');
  assert.equal(preencheuRecortado, FIXTURE.plano[1].respostas['objetivo-geral']);
  ok('com uma turma autorizada, o fixture preenche com o plano DESSA turma');

  CURADORIA_RECORTADA = ['Balé Nível 9 — Turma sem fixture'];
  recortado.dom.window.close();
  const semFixture = await abrir('plano-ensino/?professor=docente&ciclo=01&fonte=plano');
  await espera(700);
  const selSem = semFixture.doc.getElementById('ctx-turma');
  assert.deepEqual([...selSem.options].map((o) => o.value).filter(Boolean), CURADORIA_RECORTADA);
  /* A TURMA QUE NÃO ESTÁ NO FIXTURE — o caso dela (18/11/2026). Antes: nada preenchido. Agora: o
   * conteúdo do primeiro registo, e a turma do seletor intacta nos dois lugares que a dizem. */
  const turmaInventada = await semFixture.win.eval(`(function(){
    return {
      seletor: document.getElementById('ctx-turma').value,
      resposta: RESPOSTAS.get('contexto-turma'),
      objetivo: RESPOSTAS.get('objetivo-geral') || null,
      dito: (document.querySelector('.teste-status') || {}).textContent || '',
    };
  })()`);
  assert.equal(turmaInventada.seletor, CURADORIA_RECORTADA[0],
    'o seletor não ficou na turma dela: ' + JSON.stringify(turmaInventada));
  assert.equal(turmaInventada.resposta, CURADORIA_RECORTADA[0],
    'a resposta não diz a turma do seletor: ' + JSON.stringify(turmaInventada));
  assert.equal(turmaInventada.objetivo, FIXTURE.plano[0].respostas['objetivo-geral'],
    'o conteúdo de teste não foi preenchido para uma turma fora do fixture: '
      + JSON.stringify(turmaInventada));
  assert.match(String(turmaInventada.dito), /conteúdo de teste/i,
    'a ferramenta não disse o que fez: ' + JSON.stringify(turmaInventada.dito));
  ok('turma fora do fixture: preenche o CONTEÚDO e não toca na turma que ela escreveu');
  semFixture.dom.window.close();
  CURADORIA_RECORTADA = null;


  // ---- 3b-bis. O PLANO CHEGA PREENCHIDO INTEIRO, NÃO MEIO (20/10/2026) ----
  //
  // O QUE ESTAVA A ACONTECER. O fixture preenchia, e a tela mostrava metade em branco. A
  // causa não era o carregador: era a FORMA do valor no JSON não ser a que o widget lê.
  //   · os MARCOS PARCIAIS estavam numa STRING com quebras de linha, e a lista numerada
  //     só aceita ARRAY — o bloco 3 abria vazio, e com ele os blocos que dele derivam (4, 5 e 6);
  //   · o VOLUME e a CONDIÇÃO DE REGISTRO não estavam no fixture;
  //   · a NOTAÇÃO não estava;
  //   · a ORIGEM era uma string, e o campo é de escolha MÚLTIPLA — nenhuma caixa marcada,
  //     e a frase inteira caía no «outra origem».
  // Um fixture com a forma errada não falha em sítio nenhum: preenche o que pode e deixa o
  // resto em branco. Esta secção exige o PREENCHIMENTO VISÍVEL, campo a campo.
  const marcos = JSON.parse(await plano.win.eval('JSON.stringify(RESPOSTAS.get("marcos-por-aula"))'));
  assert.ok(Array.isArray(marcos), 'os marcos parciais não são uma lista: ' + typeof marcos);
  assert.equal(marcos.length, FIXTURE.plano[0].respostas['marcos-por-aula'].length);
  ok('os marcos parciais são uma LISTA — a forma que a lista numerada lê');

  // O que se vê na tela, não só o que está no depósito: as linhas do bloco 3 com o texto.
  const linhasVisiveis = await plano.win.eval(`(function(){
    var i = MAPA.nos.findIndex(function(n){return n.id === 'marcos-por-aula';});
    INDICE = i; renderPergunta();
    return JSON.stringify(Array.prototype.slice
      .call(document.querySelectorAll('#pergunta [data-lista]'))
      .map(function(el){ return el.value; }));
  })()`);
  const visiveis = JSON.parse(linhasVisiveis);
  assert.deepEqual(visiveis, FIXTURE.plano[0].respostas['marcos-por-aula'],
    'o bloco dos marcos abriu com as linhas em branco');
  ok('o bloco dos marcos abre com as linhas PREENCHIDAS na tela — não o campo vazio');

  // Os três campos que faltavam, e o que estava com a forma errada.
  const registroDoPlano = JSON.parse(await plano.win.eval(
    'JSON.stringify(RESPOSTAS.get("contexto-registro"))'));
  assert.ok(registroDoPlano && Array.isArray(registroDoPlano.observa)
    && registroDoPlano.observa.indexOf('o próprio professor') !== -1,
  'a condição de registro não diz quem observa: ' + JSON.stringify(registroDoPlano));
  ok('a condição de registro diz quem observa — «o próprio professor»');

  const volume = JSON.parse(await plano.win.eval('JSON.stringify(RESPOSTAS.get("contexto-volume"))'));
  assert.equal(volume.min, 3);
  assert.equal(volume.max, 6);
  assert.equal(volume.unidade, 'séries');
  ok('o volume de trabalho vem como faixa «3 a 6 séries»');

  assert.equal(await plano.win.eval('RESPOSTAS.get("contexto-notacao")'), 'Benesh');
  assert.equal(await plano.win.eval('RESPOSTAS.get("contexto-metodologia-origem")'), 'Eu escolho');
  ok('a notação dominada é Benesh, e quem escolhe a metodologia é «Eu escolho»');

  const origem = JSON.parse(await plano.win.eval('JSON.stringify(RESPOSTAS.get("proveniencia"))'));
  assert.ok(Array.isArray(origem), 'o registro de origem não é uma lista de escolhas: ' + typeof origem);
  assert.ok(origem.indexOf('Plano derivado de literatura de apoio sobre corpo e aula') !== -1,
    'o registro de origem não marca a literatura de apoio: ' + JSON.stringify(origem));
  ok('o registro de origem é escolha múltipla, e marca a literatura de apoio');

  // AS TRÊS MATRIZES POR MARCO seguem a contagem dos marcos: com 3 marcos não pode haver
  // linha de marco 4 e 5 (órfãs) nem marcos sem linha.
  const nMarcos = marcos.length;
  for (const id of ['estrutura-de-cada-aula', 'aula-1-parametro']) {
    const linhas = JSON.parse(await plano.win.eval('JSON.stringify(RESPOSTAS.get(' + JSON.stringify(id) + '))'));
    const numeros = linhas.map((l) => l.marco);
    assert.deepEqual(numeros, Array.from({ length: nMarcos }, (_, i) => i + 1),
      id + ' não casa com os marcos: ' + JSON.stringify(numeros));
  }
  ok('as matrizes por marco têm uma linha por marco — nem órfãs, nem marcos sem linha');

  // Os blocos da aula que os marcos marcam são os que a distribuição de volume declara.
  const blocosMarcados = [...new Set(
    JSON.parse(await plano.win.eval('JSON.stringify(RESPOSTAS.get("estrutura-de-cada-aula"))'))
      .flatMap((l) => l.marcados))].sort();
  const blocosDoVolume = JSON.parse(await plano.win.eval(
    'JSON.stringify(RESPOSTAS.get("distribuicao-de-volume").linhas.map(function(l){return l["Bloco"];}))'
  )).sort();
  assert.deepEqual(blocosDoVolume, blocosMarcados,
    'a distribuição de volume declara blocos que os marcos não marcam: ' +
    JSON.stringify({ blocosDoVolume, blocosMarcados }));
  ok('a distribuição de volume só declara os blocos que os marcos marcam');

  // EM QUE AULA CADA OBJETIVO (26/10/2026, etapa 2). O bloco novo tem de abrir com uma linha
  // por objetivo, com o número do objetivo e a AULA PROPOSTA já escrita — o padrão 1:1 é o que
  // faz 26 objetivos não serem 26 decisões. E a leitura tem de devolver o que está na tela.
  const linhasDoObjetivo = JSON.parse(await plano.win.eval(`(function(){
    var i = MAPA.nos.findIndex(function(n){return n.id === 'aula-de-cada-objetivo';});
    INDICE = i; renderPergunta();
    return JSON.stringify({
      campos: Array.prototype.slice.call(document.querySelectorAll('#pergunta [data-aula-de-objetivo]'))
        .map(function(el){ return el.value; }),
      textos: document.querySelectorAll('#pergunta [data-aula-linha] .marco-texto').length
    });
  })()`));
  assert.equal(linhasDoObjetivo.campos.length, marcos.length,
    'o bloco «em que aula» não tem uma linha por objetivo: '
    + JSON.stringify(linhasDoObjetivo.campos));
  assert.deepEqual(linhasDoObjetivo.campos, marcos.map((_, i) => String(i + 1).padStart(2, '0')),
    'a aula proposta não é a do número do objetivo: ' + JSON.stringify(linhasDoObjetivo.campos));
  ok('o bloco «em que aula cada objetivo» abre com o padrão 1:1 já proposto');

  const lido = JSON.parse(await plano.win.eval(`(function(){
    var campos = document.querySelectorAll('#pergunta [data-aula-de-objetivo]');
    campos[1].value = '01, 02';
    return JSON.stringify(lerResposta(MAPA.nos[INDICE]).valor);
  })()`));
  assert.equal(lido.length, marcos.length, 'a leitura não devolveu uma entrada por objetivo');
  assert.deepEqual(lido[1], { objetivo: 2, aulas: ['01', '02'] },
    'a leitura não guardou as duas aulas do objetivo 2: ' + JSON.stringify(lido[1]));
  assert.deepEqual(lido[0], { objetivo: 1, aulas: ['01'] },
    'a leitura estragou o objetivo que não foi tocado: ' + JSON.stringify(lido[0]));
  ok('…e ler a tela guarda as aulas do objetivo — «01, 02» são duas, e o resto fica como estava');

  // OS CAMPOS QUE VÊM DA TURMA resolvem-se do CADASTRO (frequência, duração, calendário).
  // Eles não estão no fixture porque não são do fixture: são da turma. O que se prova é que
  // eles RESOLVEM — e a frequência lia-se de um campo (`frequencia`) que a turma pode não
  // ter, embora tenha os dias de que ela sai; o plano ficava com um obrigatório em branco
  // sobre um dado que a escola declarou.
  const daTurma = JSON.parse(await plano.win.eval(`(function(){
    var saida = {};
    MAPA.nos.forEach(function(n){
      if (!n.daTurma) return;
      var v = valorDaTurma(n);
      saida[n.id] = v === undefined || v === null ? null : v;
    });
    return JSON.stringify(saida);
  })()`));
  assert.ok(daTurma['contexto-frequencia'] && daTurma['contexto-frequencia'].vezes === 2,
    'a frequência não saiu dos dias da turma: ' + JSON.stringify(daTurma['contexto-frequencia']));
  assert.ok(daTurma['contexto-duracao'] && daTurma['contexto-duracao'].length,
    'a duração não saiu da turma: ' + JSON.stringify(daTurma['contexto-duracao']));
  assert.ok(daTurma['contexto-calendario'] && daTurma['contexto-calendario'].inicio,
    'o calendário não saiu da turma: ' + JSON.stringify(daTurma['contexto-calendario']));
  ok('frequência, duração e calendário vêm do cadastro da turma — sem campo em branco');

  // O FIXTURE NÃO CITA UM MARCO QUE NÃO TEM (20/10/2026). O critério de extensão dizia
  // «se o marco 4 não for alcançado» com três marcos no plano — texto que sobreviveu ao corte
  // de cinco para três e ia para o documento publicado a falar de uma aula que não existe. Um
  // fixture não é dado morto: é o que o professor lê no plano impresso.
  for (const registro of FIXTURE.plano) {
    const quantos = registro.respostas['marcos-por-aula'].length;
    const citados = [...String(registro.respostas['criterio-de-extensao'] || '')
      .matchAll(/marco\s+(\d+)/gi)].map((m) => Number(m[1]));
    assert.deepEqual(citados.filter((n) => n > quantos), [],
      registro.turma + ': o critério de extensão cita um marco que o plano não tem (' + quantos + ')');
  }
  ok('o critério de extensão não cita um marco que o plano não tem');

  // E o que o formulário exige fica todo respondido quando se passa pelos campos do
  // cadastro (é o que acontece ao avançar). Sem isto, «preenchido» seria opinião.
  const faltamNoPlano = await plano.win.eval(`(function(){
    MAPA.nos.forEach(function(n){
      if (!n.daTurma) return;
      var v = valorDaTurma(n);
      if (v !== undefined && v !== null) RESPOSTAS.set(n.id, v);
    });
    atualizarBarra();
    return JSON.stringify(obrigatoriosFaltando().map(function(n){return n.id;}));
  })()`);
  assert.equal(faltamNoPlano, '[]', 'o plano não ficou completo: faltam ' + faltamNoPlano);
  ok('o plano fica sem nenhum obrigatório em falta — nada por preencher');

  /* O QUE NÃO SE PERGUNTA (26/10/2026). Escola, professor, turma, frequência, duração,
     calendário e nº de aulas continuam no mapa — o envelope e o `## Contexto` leem-nos — mas
     não são degraus: o roteiro salta-os, e o valor é SEMEADO do cabeçalho. A asserção que
     interessa é a segunda: sem semente, sete obrigatórios ficariam em branco e o «Guardar»
     fecharia sobre um dado que a escola já declarou. */
  const semCabecalho = JSON.parse(await plano.win.eval(`JSON.stringify(
    MAPA.nos.map(function(n, i){ return n.noCabecalho ? i : -1; }).filter(function(i){ return i >= 0; }))`));
  const noRoteiro = JSON.parse(await plano.win.eval(`JSON.stringify(
    Array.prototype.slice.call(document.querySelectorAll('#roteiro li[data-i]'))
      .map(function(li){ return Number(li.dataset.i); }))`));
  /* O NÚMERO É DERIVADO, E NÃO ESCRITO (03/11/2026). Era `7` em três sítios, e a metodologia
     entrou no cabeçalho — a conta passou a 8 e a asserção ficou vermelha por estar a medir a data
     em que foi escrita. O que ela guarda não é o número: é a IGUALDADE entre os nós que o mapa
     marca como do cabeçalho e os que o roteiro salta. Um nó novo entra sozinho. */
  assert.ok(semCabecalho.length > 0,
    'o mapa não tem nenhum nó do cabeçalho: ' + JSON.stringify(semCabecalho));
  const totalDeNos = await plano.win.eval('MAPA.nos.length');
  assert.equal(noRoteiro.length, totalDeNos - semCabecalho.length,
    'o roteiro não perdeu os nós do cabeçalho: ' + JSON.stringify(noRoteiro));
  assert.deepEqual(noRoteiro.filter((i) => semCabecalho.indexOf(i) !== -1), [],
    'um nó do cabeçalho continua a ser um degrau do roteiro');
  const numeros = JSON.parse(await plano.win.eval(`JSON.stringify(
    Array.prototype.slice.call(document.querySelectorAll('#roteiro li[data-i] .n'))
      .map(function(s){ return s.textContent; }))`));
  assert.equal(numeros[0], '1', 'a numeração do roteiro não começa em 1: ' + numeros[0]);
  assert.equal(numeros[numeros.length - 1], String(numeros.length),
    'a numeração do roteiro não conta só os degraus: ' + numeros.join(','));
  ok('o roteiro salta os ' + semCabecalho.length + ' nós do cabeçalho, e a numeração conta só o que se pergunta');

  const semeados = JSON.parse(await plano.win.eval(`(function(){
    pintarRoteiro();
    return JSON.stringify({
      escola: RESPOSTAS.get('contexto-escola') || null,
      professor: RESPOSTAS.get('contexto-professor') || null,
      frequencia: RESPOSTAS.get('contexto-frequencia') || null,
      duracao: RESPOSTAS.get('contexto-duracao') || null,
      calendario: RESPOSTAS.get('contexto-calendario') || null,
      total: RESPOSTAS.get('contexto-total-aulas') || null
    });
  })()`));
  for (const [qual, valor] of Object.entries(semeados)) {
    assert.ok(valor !== null && valor !== '', 'o nó do cabeçalho «' + qual + '» ficou vazio');
  }
  ok('…e os valores do cabeçalho são semeados sem ninguém os visitar');

  /* A FRONTEIRA FECHADA (26/10/2026). Sair do roteiro nao bastava: quem la chegasse por um
     indice antigo via um degrau completo — e escola e professor ainda tinham o campo de
     resposta ABERTO, que e exactamente o que nao podem ter. Agora desenham o valor em leitura,
     sem campo de resposta nem de nota; e atravessa-los NAO apaga o valor semeado.
     Medido em pedacos pequenos: um `eval` com um template grande e uma armadilha (o meu nao
     fechava, e o erro aparecia noutra linha). */
  const indicesDoCabecalho = JSON.parse(await plano.win.eval(
    'JSON.stringify(MAPA.nos.map(function(n, i){ return n.noCabecalho ? i : null; })'
    + '.filter(function(i){ return i !== null; }))'));
  assert.equal(indicesDoCabecalho.length, semCabecalho.length,
    'a segunda leitura dos nos do cabecalho discorda da primeira: ' + JSON.stringify(indicesDoCabecalho));
  const leituras = [];
  for (const indiceDoNo of indicesDoCabecalho) {
    const r = JSON.parse(await plano.win.eval(
      '(function(i){ INDICE = i; renderPergunta();'
      + ' var caixa = document.querySelector("#pergunta .leitura-do-cabecalho");'
      + ' var campos = document.querySelectorAll("#pergunta .caixa textarea,'
      + ' #pergunta .caixa input, #pergunta .caixa select");'
      + ' var antes = JSON.stringify(RESPOSTAS.get(MAPA.nos[i].id));'
      + ' gravarRespostaDoNo(MAPA.nos[i]);'
      + ' return JSON.stringify({ id: MAPA.nos[i].id, caixa: !caixa ? false : true,'
      + ' campos: campos.length,'
      + ' texto: caixa ? caixa.textContent.split(String.fromCharCode(10)).join(" ").slice(0, 120) : null,'
      + ' sobreviveu: JSON.stringify(RESPOSTAS.get(MAPA.nos[i].id)) === antes });'
      + '})(' + indiceDoNo + ')'));
    leituras.push(r);
  }
  for (const l of leituras) {
    assert.ok(l.caixa, 'o no ' + l.id + ' nao desenha o valor em leitura');
    assert.equal(l.campos, 0, 'o no ' + l.id + ' ainda abre ' + l.campos + ' campo(s)');
    assert.ok((l.texto || '').indexOf('Não se preenche aqui') !== -1,
      'o no ' + l.id + ' nao diz que nao se preenche ali: ' + JSON.stringify(l.texto));
    assert.ok(l.sobreviveu, 'atravessar o no ' + l.id + ' apagou o valor semeado');
  }
  ok('…e, se alguém cair num deles, vê o valor em leitura — sem campo, e sem perder o valor');

  plano.dom.window.close();

  // ---- 3c. PLANO DE OBSERVAÇÃO ----
  //
  // O PO consome o plano e a anamnese: o fixture escreve os campos, a ESTANTE decide o
  // carimbo do plano, e a folha derivada do checklist confere o que os campos dizem. Nada
  // aqui é submetido — o `Guardar` continua a ser um clique do professor.
  PEDIDOS.length = 0;
  ESTANTE_VAZIA = false;
  const po = await abrir('plano-observacao/?professor=docente&ciclo=01');
  assert.equal(po.doc.body.getAttribute('data-tela'), 'porta');
  assert.ok(po.doc.querySelector('details.teste-painel'), 'o painel do PO não apareceu');
  assert.equal(await po.win.eval('FONTE'), 'po');

  const registro = FIXTURE.po[0];
  const faltam = await po.win.eval('JSON.stringify(obrigatoriosFaltando().map(function(n){return n.id;}))');
  assert.equal(faltam, '[]', 'o PO não ficou completo: faltam ' + faltam);
  ok('o PO nasce preenchido com a turma da fixture — todos os obrigatórios respondidos');

  const esperado = registro.respostas;
  for (const id of ['horizonte', 'question', 'fenomeno', 'inclusao', 'exclusao',
    'condicoes-de-contorno', 'referencia-ao-problema', 'explicacao-do-recorte',
    'o-que-fica-de-fora', 'base-teorica', 'limitacoes']) {
    const valor = await po.win.eval('JSON.stringify(RESPOSTAS.get(' + JSON.stringify(id) + '))');
    assert.equal(valor, JSON.stringify(esperado[id]), 'o campo ' + id + ' não veio do fixture');
  }
  const itens = JSON.parse(await po.win.eval('JSON.stringify(RESPOSTAS.get("itens-por-dimensao"))'));
  assert.deepEqual(itens, esperado['itens-por-dimensao']);
  const base = JSON.parse(await po.win.eval('JSON.stringify(RESPOSTAS.get("linha-de-base"))'));
  assert.deepEqual(base, esperado['linha-de-base']);
  ok('os campos pedidos vêm todos do fixture, incluindo itens por dimensão e ponto de partida');

  const sujeitos = JSON.parse(await po.win.eval('JSON.stringify(RESPOSTAS.get("sujeitos"))'));
  assert.deepEqual(sujeitos, registro.sujeitos);
  ok('os sujeitos observados são as alunas do fixture');

  /* A DIMENSÃO é DERIVADA dos blocos da aula que o plano marca — não vem do fixture.
   *
   * E DESDE 04/11/2026 ELA É O BLOCO, sem prefixo: «o NOME GRAVADO É O BLOCO — o eixo vive no
   * ecrã e no documento». Esta asserção ainda exigia «Técnica» à frente do nome, que era a forma
   * anterior; passou a medir a regra de hoje — o nome é um bloco dos que o conteúdo declara, e
   * CADA UM leva o seu eixo (Musicalidade e Expressão levam «Poiesis», não «Técnica»). */
  const dimensoes = JSON.parse(await po.win.eval('JSON.stringify(RESPOSTAS.get("dimensoes-de-observacao"))'));
  assert.ok(dimensoes.length > 0, 'a dimensão observada não foi derivada do plano');
  const comEixo = JSON.parse(await po.win.eval(
    'JSON.stringify(DIMENSOES_DO_PLANO.lista.map(function(b){return [b, DIMENSOES_DO_PLANO.eixoDe(b)];}))'));
  assert.deepEqual(comEixo.map((par) => par[0]), dimensoes,
    'a resposta não é a lista canónica dos blocos: ' + JSON.stringify(comEixo));
  assert.ok(comEixo.every((par) => par[1]), 'a dimensão saiu sem o eixo');
  assert.ok(comEixo.length ? comEixo.some((par) => par[1] !== 'Técnica') : true,
    'o eixo voltou a ser um só para todos os blocos: ' + JSON.stringify(comEixo));
  ok('a dimensão observada é o BLOCO da aula, e cada bloco leva o seu eixo');

  // O CHECKLIST: cada folha vale o que os campos que ela MONITORA dizem — nem o selo
  // «pré-preenchido» com a folha em branco (o que estava a acontecer), nem um «sim» de fábrica.
  const checklist = JSON.parse(await po.win.eval(
    'JSON.stringify(MAPA.nos.filter(function(n){return n.derivadoDe;})' +
    '.map(function(n){return [n.id, RESPOSTAS.get(n.id)];}))'));
  const porId = new Map(checklist);
  assert.equal(porId.get('checklist-fenomeno-definido'), 'sim');
  assert.equal(porId.get('checklist-fronteiras-claras'), 'sim');
  assert.equal(porId.get('checklist-norma-estabelecida'), 'sim');
  assert.equal(porId.get('checklist-justificativa-fundada'), 'sim');
  assert.equal(porId.get('checklist-recorte-viavel'), 'sim');
  assert.equal(porId.get('checklist-criterios-exclusivos'), 'não');
  ok('o checklist chega marcado — cinco «sim» do que está escrito, e «não» no que ninguém decide');

  // E a recíproca: apagar o campo que uma folha monitora vira a folha para «não».
  await po.win.eval('RESPOSTAS.delete("fenomeno"); atualizarBarra();');
  assert.equal(await po.win.eval('RESPOSTAS.get("checklist-fenomeno-definido")'), 'não');
  await po.win.eval('RESPOSTAS.set("fenomeno", ' + JSON.stringify(esperado.fenomeno) + '); atualizarBarra();');
  assert.equal(await po.win.eval('RESPOSTAS.get("checklist-fenomeno-definido")'), 'sim');
  ok('a folha segue o campo que ela monitora — apagado o campo, ela volta a «não»');

  /* A SUGESTÃO DERIVADA DA ANAMNESE — SE O CONTEÚDO A DECLARAR (18/11/2026).
   *
   * Esta secção procurava o nó «exclusao» e chamava a derivação dele. O conteúdo do PO deixou de
   * declarar `derivarDe` — nenhum nó o tem hoje —, e a chamada morria com
   * «Cannot read properties of undefined (reading 'derivarDe')»: um TypeError que não mede nada e
   * ainda esconde as verificações que vêm depois. Passa a perguntar primeiro; e quando não há
   * nada a medir, DIZ-SE, em vez de passar em silêncio. */
  const nosComDerivacao = await po.win.eval(
    'JSON.stringify(MAPA.nos.filter(function(n){return !!n.derivarDe;}).map(function(n){return n.id;}))');
  const idsDerivaveis = JSON.parse(nosComDerivacao);
  if (!idsDerivaveis.length) {
    console.log('  ! o conteúdo do PO não declara sugestão derivada (derivarDe) — '
      + 'a derivação a partir da anamnese não se mede nesta prova');
  } else {
    // A EXCLUSÃO: a sugestão devolve a razão de não haver nada a excluir, e não uma falha.
    const idDerivavel = idsDerivaveis.indexOf('exclusao') !== -1 ? 'exclusao' : idsDerivaveis[0];
    await po.win.eval(`(function(){
      var i = MAPA.nos.findIndex(function(n){return n.id === ${JSON.stringify(idDerivavel)};});
      INDICE = i; renderPergunta();
    })()`);
    await espera(300);
    await po.win.eval(`(function(){
      var no = MAPA.nos.find(function(n){return n.id === ${JSON.stringify(idDerivavel)};});
      var botao = document.querySelector('[data-derivar="' + no.id + '"]');
      derivarDoConjunto(botao, no);
    })()`);
    await espera(700);
    const dicaDerivada = await po.win.eval(
      `(document.querySelector('[data-derivacao-de="${idDerivavel}"]') || {}).textContent || ""`);
    assert.ok(String(dicaDerivada).trim().length > 0,
      'a sugestão derivada não disse nada: ' + dicaDerivada);
    ok('a sugestão derivada responde — e não parece avaria');
  }

  const metodosPo = [...new Set(PEDIDOS.map((p) => p.metodo))];
  assert.deepEqual(metodosPo, ['GET']);
  ok('o PO só fez GET — nenhum envio, nenhuma gravação');
  po.dom.window.close();

  // ---- 3d. A ESTANTE VAZIA ----
  // Sem plano de ensino lançado, o nó diz «ainda não há plano de ensino» — nunca um erro.
  ESTANTE_VAZIA = true;
  const vazio = await abrir('plano-observacao/?professor=docente&ciclo=01');
  await vazio.win.eval(`(function(){
    var i = MAPA.nos.findIndex(function(n){return n.id === 'plano-de-ensino';});
    INDICE = i; renderPergunta();
  })()`);
  await espera(500);
  const textoVazio = await vazio.win.eval(
    '(document.querySelector("#pergunta") || {}).textContent || ""');
  assert.ok(/Ainda não há plano de ensino/.test(textoVazio),
    'o nó sem plano não disse que ainda não há plano: ' + textoVazio.slice(0, 300));
  assert.equal(await vazio.win.eval(
    'document.querySelectorAll("#pergunta .erro").length'), 0,
  'o nó sem plano mostrou um ERRO onde devia dizer que não há nada');
  assert.ok(!/Unexpected token|Não foi possível carregar/.test(textoVazio),
    'a tela ainda mostra o erro cru do analisador');
  ok('sem plano de ensino lançado, o nó diz que ainda não há — e não um erro');
  vazio.dom.window.close();
  ESTANTE_VAZIA = false;

  // ---- 3e. ESCOLA NORMAL ----
  const normal = await abrir('anamnese/?professor=docente&ciclo=01&normal=1');
  assert.equal(normal.doc.querySelector('details.teste-painel'), null);
  const idadeNormal = await normal.win.eval('RESPOSTAS.get("idade")');
  assert.notEqual(idadeNormal, FIXTURE.anamnese[0].respostas.idade);
  ok('sem o atributo, o painel não aparece e o fixture não é carregado');
  normal.dom.window.close();

  servidor.close();
}

(async () => {
  console.log('Escolas de teste — fixture por nome, e só preenchimento\n');
  detectar();
  await producao();
  await producaoNoNavegador();
  await estadoForaDaEdicao();
  await porta();
  console.log(`\nprovar-teste: ${n} verificações passaram`);
})().catch((e) => {
  console.error('\nFALHA:', e && e.stack ? e.stack : e);
  try { servidor.close(); } catch (_) {}
  process.exit(1);
});
