#!/usr/bin/env node
'use strict';

/**
 * provar-teste.js — as ESCOLAS DE TESTE: o fixture certo, e SÓ preenchimento.
 *
 * O combinado (19/10/2026): uma escola cujo slug termina em `teste-1/2/3` recebe,
 * nos formulários, os valores do JSON `teste/escola-teste-N.json`. O carregador
 * NÃO envia nada: nem POST, nem PUT, nem DELETE; nem toca no KV. Ele só preenche.
 *
 * A prova cobre as três fronteiras:
 *   1. a DETECÇÃO — `Plie teste 1` é teste 1; `testemunho` e `teste 4` não são;
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

const FIXTURE = fixtureDaEscola('plie-teste-1');
const MIME = { '.html': 'text/html;charset=utf-8', '.json': 'application/json;charset=utf-8',
  '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

let n = 0;
const ok = (titulo) => { n += 1; console.log(`  ${String(n).padStart(2)}. ${titulo}`); };

// ================= 1. A DETECÇÃO ============================================

function detectar() {
  const casos = [
    ['plie-teste-1', 1], ['abacate-teste-2', 2], ['pingo-teste-3', 3],
    ['teste-1', 1], ['escola-teste-01', 1], ['testemunho', 0], ['teste-4', 0],
    ['teste', 0], ['teste-10', 0], ['x-teste-2x', 0],
  ];
  for (const [slug, esperado] of casos) {
    assert.equal(numeroDoTeste(slug), esperado, slug);
  }
  ok('o sufixo teste-1/2/3 é o que decide; testemunho e teste 4 não são teste');
  assert.equal(fixtureDaEscola('plie-teste-1').teste, 1);
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
  const envTeste = { ESCOLA_SLUG: 'plie-teste-1', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x',
    SENHA_PROFESSOR: 'y', PROFESSOR_NOME: 'Docente', PADD_KV: criarKv() };
  const envReal = { ESCOLA_SLUG: 'escola-real', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x',
    SENHA_PROFESSOR: 'y', PROFESSOR_NOME: 'Docente', PADD_KV: criarKv() };

  const rTeste = await bastidores.fetch(new Request('https://plie-teste-1.example/bastidores/producao'), envTeste);
  const htmlTeste = await rTeste.text();
  assert.match(htmlTeste, /data-escola-teste="1"/);
  assert.match(htmlTeste, /\/assets\/teste-preenchimento\.js/);
  ok('a Produção da escola de teste recebe o atributo e o preenchidor');

  const rReal = await bastidores.fetch(new Request('https://escola-real.example/bastidores/producao'), envReal);
  const htmlReal = await rReal.text();
  assert.doesNotMatch(htmlReal, /data-escola-teste=/);
  assert.doesNotMatch(htmlReal, /teste-preenchimento\.js/);
  ok('a Produção de uma escola normal não recebe nenhum dos dois');

  const prod = require('../motor/servidor/producao.js');
  const apiTeste = await prod.fetch(new Request('https://plie-teste-1.example/api/teste'), envTeste);
  assert.equal(apiTeste.status, 200);
  const dados = await apiTeste.json();
  assert.equal(dados.teste, 1);
  assert.equal(dados.fixture.producao.turmas.length, 3);
  ok('/api/teste devolve o fixture da escola certa');

  const apiReal = await prod.fetch(new Request('https://escola-real.example/api/teste'), envReal);
  assert.equal(apiReal.status, 404);
  ok('/api/teste responde 404 para escola normal');
}


// ================= 2b. A PRODUÇÃO PREENCHIDA ================================

async function producaoNoNavegador() {
  const escola = 'plie-teste-1';
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

const PEDIDOS = [];

function apiDe(rota, fonte) {
  if (rota.startsWith('api/mapa')) {
    return fonte === 'plano' ? MAPA_PLANO : MAPA_ANAMNESE;
  }
  if (rota.startsWith('api/teste')) {
    return { ok: true, teste: 1, escola: 'plie-teste-1', fixture: FIXTURE };
  }
  if (rota.startsWith('api/bastidores/professores')) {
    return { ok: true, escola: 'plie-teste-1', professores: [{ nome: 'Docente', slug: 'docente' }] };
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
  html = html.replace(/<html([^>]*)>/i, '<html$1 data-escola-teste="1">');
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

  const fonte = caminho.startsWith('plano-ensino/') ? 'plano'
    : caminho.startsWith('anamnese/') ? 'anamnese'
    : (url.searchParams.get('fonte') === 'plano' ? 'plano' : 'anamnese');

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
      caminho === 'plano-ensino/' || caminho === 'plano-ensino/index.html') {
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
  plano.dom.window.close();

  // ---- 3c. ESCOLA NORMAL ----
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
