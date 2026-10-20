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
  assert.match(htmlTeste, /\/assets\/teste-preenchimento\.js/);
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
  await kv.put('bastidores/' + escola + '/vocabulario', JSON.stringify(termos));
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
    if (u.pathname === '/assets/teste-preenchimento.js') return envia(MIME['.js'], SCRIPT);
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
  assert.equal(primeira.d.getElementById('tnome').value, FIXTURE.producao.turmas[0].nome);
  assert.equal(primeira.d.getElementById('rubr-nome').value, FIXTURE.producao.rubricas[0].nome);
  assert.equal(primeira.d.getElementById('vtermo').value, FIXTURE.producao.vocabulario[0].termo);
  assert.equal(primeira.d.getElementById('anome').value, FIXTURE.producao.alunas[0]);
  assert.ok(primeira.d.querySelector('details.teste-painel'), 'o painel de teste não apareceu na Produção');
  assert.deepEqual([...new Set(pedidos)], ['GET']);
  ok('a Produção nasce com turma, rubrica, termo e aluna preenchidos — e só por GET');
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
  assert.equal(d1.getElementById('vinc-rubrica').value, '');
  ok('sem «Editar», o estado antigo não restaura: turma, rubrica e associação ficam vazias');
  semEdicao.window.close();

  const emEdicao = await abrir(true);
  const d2 = emEdicao.window.document;
  assert.equal(d2.getElementById('tnome').value, 'Turma Antiga');
  assert.equal(d2.getElementById('rubr-nome').value, 'Régua Antiga');
  assert.equal(d2.getElementById('vinc-rubrica').value, 'r1');
  ok('com «Editar», o mesmo estado volta a preencher os três formulários');
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
    return {
      ok: true,
      turmas: FIXTURE.producao.turmas.map((t) => Object.assign({}, t, { id: t.nome })),
      opcoes: FIXTURE.producao.turmas.map((t) => ({ valor: t.nome, rotulo: t.nome })),
    };
  }
  if (rota.startsWith('api/bastidores/turma-conteudos')) return { ok: true, relacoes: {} };
  if (rota.startsWith('api/bastidores/termos')) return { ok: true, termos: [], opcoes: [] };
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

  const metodosPlano = [...new Set(PEDIDOS.map((p) => p.metodo))];
  assert.deepEqual(metodosPlano, ['GET']);
  ok('o plano só fez GET — nenhum envio, nenhuma gravação');

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

  // A DIMENSÃO é DERIVADA dos blocos da aula que o plano marca — não vem do fixture.
  const dimensoes = JSON.parse(await po.win.eval('JSON.stringify(RESPOSTAS.get("dimensoes-de-observacao"))'));
  assert.ok(dimensoes.length > 0, 'a dimensão observada não foi derivada do plano');
  assert.ok(dimensoes.every((d) => d.indexOf('Técnica') === 0), 'a dimensão saiu sem o eixo');
  ok('a dimensão observada nasce dos blocos da aula que o plano marca');

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

  // A EXCLUSÃO: a sugestão devolve a razão de não haver nada a excluir, e não uma falha.
  await po.win.eval(`(function(){
    var i = MAPA.nos.findIndex(function(n){return n.id === 'exclusao';});
    INDICE = i; renderPergunta();
  })()`);
  await espera(300);
  await po.win.eval(`(function(){
    var botao = document.querySelector('[data-derivar="exclusao"]');
    derivarDoConjunto(botao, MAPA.nos.find(function(n){return n.id === 'exclusao';}));
  })()`);
  await espera(700);
  const dicaExclusao = await po.win.eval(
    '(document.querySelector(\'[data-derivacao-de="exclusao"]\') || {}).textContent || ""');
  assert.ok(/Nada a excluir/.test(dicaExclusao), 'a exclusão não explicou o resultado: ' + dicaExclusao);
  assert.ok(!/Nenhum item bateu/.test(dicaExclusao), 'a exclusão ainda usa a frase de falha');
  ok('a sugestão de exclusão diz por que não há nada a excluir — não parece avaria');

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
