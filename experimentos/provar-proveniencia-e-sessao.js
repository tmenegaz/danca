#!/usr/bin/env node
'use strict';

/**
 * provar-proveniencia-e-sessao.js — o vão fantasma do menu, a sessão única e a regra de
 * proveniência fora da curadoria.
 *
 * Por que existe (18/10/2026). Três defeitos ditos a usar, os três de uma vez:
 *
 *   1. **O vão fantasma.** Abrir o hambúrguer do sistema e depois fechar por um clique FORA
 *      (o «Seções» da página) deixava a altura do menu aberto em `--header-height`, e o
 *      `body` guardava o vão acima do conteúdo.
 *   2. **A sessão dupla ao rolar.** Durante a rolagem, a barra da página aparecia por baixo
 *      do menu fixo enquanto a sessão já tinha subido: dois «Seções» e dois «Pessoas · Alunas».
 *   3. **A proveniência só na curadoria.** Professores, alunas, turmas e vocabulário podiam
 *      ser apagados mesmo depois de entrarem num plano de ensino.
 *
 * Isso não se mede no HTML. O vão é GEOMETRIA (a altura do `body`), a sessão é ESTADO
 * calculado (o `display` das duas cópias) e a proveniência é uma regra do SERVIDOR — que se
 * prova pedindo a exclusão e esperando o 409.
 *
 * O que se prova:
 *
 *   1. abrir o hambúrguer aumenta o `padding-top` do `body`; fechá-lo por fora o DEVOLVE;
 *   2. ao rolar, a barra da página some e a do sistema aparece — nunca as duas;
 *   3. professor, aluna, turma e termo já usados num plano mostram o selo e NÃO têm
 *      «Excluir»; os livres continuam com ele;
 *   4. o SERVIDOR recusa (409) a exclusão dos vinculados, mesmo com pedido direto — e
 *      aceita a de um livre.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-proveniencia-e-sessao.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');
const puppeteer = require(path.join(
  execSync('npm root -g').toString().trim(), '@marp-team/marp-cli', 'node_modules', 'puppeteer-core'));
const motor = require(path.join(raiz, 'motor/servidor/bastidores.js'));

/** UM KV de memória — a prova não toca no KV da escola nem na rede. */
const mem = new Map();
const kv = {
  async get(k) { return mem.has(k) ? mem.get(k) : null; },
  async put(k, v) { mem.set(k, v); },
  async list({ prefix } = {}) {
    return { keys: [...mem.keys()].filter((k) => !prefix || k.startsWith(prefix)).map((name) => ({ name })) };
  },
};
const env = {
  SENHA_ADMIN: '123456', PADD_KV: kv, PROFESSOR_NOME: 'Tiago',
  PROFESSOR_SLUG: 'tiago-menegaz', ESCOLA_SLUG: 'fita',
};

/** O cenário: um plano de ensino que vincula um professor, uma turma, uma aluna (via
 *  curadoria) e um termo. O resto fica livre — e é a diferença entre os dois que se mede. */
function semear() {
  mem.clear();
  kv.put('bastidores/fita/professores', JSON.stringify([
    { nome: 'Maria', slug: 'maria', sal: 'x', hash: 'h' },
  ]));
  kv.put('bastidores/fita/alunas', JSON.stringify(['Vavá', 'Bia']));
  kv.put('bastidores/fita/turmas', JSON.stringify([
    { id: 'tu1', nome: 'Balé 1', frequencia: 2, dias: ['seg'], horarios: { seg: '18:00' },
      duracaoMin: 60, periodoInicio: '2026-10-16', periodoFim: '2026-12-18' },
    { id: 'tu2', nome: 'Balé 2', frequencia: 1, dias: ['ter'], duracaoMin: 45,
      periodoInicio: '2026-10-16', periodoFim: '2026-12-18' },
  ]));
  kv.put('bastidores/fita/vocabulario', JSON.stringify([
    { id: 'plie', termo: 'Plié', categoria: 'passo' },
    { id: 'tendu', termo: 'Tendu', categoria: 'passo' },
  ]));
  kv.put('bastidores/fita/turma-conteudos', JSON.stringify({ tu1: ['plie'] }));
  kv.put('bastidores/fita/curadorias', JSON.stringify([
    { id: 'c1', professor: 'tiago-menegaz', modalidade: 'Balé clássico',
      turmas: ['Balé 1'], alunas: ['Vavá'], repertorio: ['Plié'] },
  ]));
  kv.put('fita/envelope/plano-1.json', JSON.stringify({
    contexto: { professor: 'tiago-menegaz', escola: 'fita' },
    respostas: {
      'contexto-turma': { valor: 'Balé 1' },
      'repertorio': { valor: ['Plié'] },
      'contexto-professor': { valor: 'Tiago' },
    },
  }));
  kv.put('fita/envelope/plano-2.json', JSON.stringify({
    contexto: { professor: 'maria', escola: 'fita' },
    respostas: { 'contexto-turma': { valor: 'Balé 2' }, 'repertorio': { valor: ['Tendu'] } },
  }));
}

function servir() {
  const srv = http.createServer(async (req, res) => {
    const caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const send = (code, tipo, body) => { res.writeHead(code, { 'content-type': tipo }); res.end(body); };
    if (caminho.endsWith('/assets/style.css')) return send(200, 'text/css', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    if (caminho.endsWith('/assets/nav.js')) return send(200, 'text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    if (caminho.startsWith('/api/')) {
      let body = '';
      for await (const c of req) body += c;
      const out = await motor.fetch(new Request('http://x' + req.url, {
        method: req.method, headers: { 'content-type': 'application/json' },
        body: (req.method === 'GET' || req.method === 'HEAD') ? undefined : (body || '{}'),
      }), env);
      if (!out) return send(404, 'application/json', '{}');
      return send(out.status, 'application/json', await out.text());
    }
    const out = await motor.fetch(new Request('http://x' + req.url), env);
    if (!out) return send(404, 'text/plain', 'não tratado');
    send(out.status, 'text/html', await out.text());
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-proveniencia-e-sessao: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  semear();
  const { srv, base } = await servir();
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();
  await pg.setViewport({ width: 390, height: 800 });
  let ok = 0; let ko = 0;
  const provar = (n, c, e) => {
    if (c) { ok++; console.log('  ok    ' + n + (e !== undefined ? '  → ' + JSON.stringify(e) : '')); }
    else { ko++; console.log('  FALHA ' + n + (e !== undefined ? '  → ' + JSON.stringify(e) : '')); }
  };

  await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
  await pg.type('#dsenha', '123456');
  await pg.click('#form-senha button[type=submit]');
  await pg.waitForFunction(() => !document.getElementById('conteudo').hidden, { timeout: 5000 });
  await pg.evaluate(() => { location.hash = '#turmas'; });
  await new Promise((r) => setTimeout(r, 300));

  // ---- 1) o vão fantasma ---------------------------------------------------------
  const altura = () => pg.evaluate(() => ({
    pad: getComputedStyle(document.body).paddingTop,
    nav: document.querySelector('.topnav').offsetHeight,
    aberto: document.querySelector('.topnav').classList.contains('aberto'),
  }));
  const antes = await altura();
  await pg.click('.hamburger');
  await new Promise((r) => setTimeout(r, 250));
  const aberto = await altura();
  provar('abrir o hambúrguer aumenta a barra (e o vão)', aberto.nav > antes.nav, { antes: antes.nav, aberto: aberto.nav });

  await pg.evaluate(() => {
    const b = document.getElementById('lateral-abrir') || document.getElementById('s5-secoes');
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 350));
  await pg.evaluate(() => {
    const a = [...document.querySelectorAll('.lateral-lista a')].find((x) => x.getAttribute('data-secao') === 'alunas');
    if (a) a.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  const depois = await altura();
  provar('fechar por fora DEVOLVE a altura (sem vão fantasma)',
    depois.pad === antes.pad && depois.nav === antes.nav && depois.aberto === false, depois);

  // ---- 2) sessão única ao rolar ---------------------------------------------------
  await pg.evaluate(() => { document.body.style.minHeight = '3000px'; window.scrollTo(0, 400); });
  await new Promise((r) => setTimeout(r, 350));
  const sessao = await pg.evaluate(() => ({
    barraDaPagina: getComputedStyle(document.querySelector('.lateral-barra')).display,
    sessaoNoTopo: getComputedStyle(document.querySelector('.s5-sessao')).display,
    descido: document.body.getAttribute('data-descido'),
  }));
  provar('ao rolar NÃO há sessão dupla',
    sessao.barraDaPagina === 'none' && sessao.sessaoNoTopo !== 'none' && sessao.descido === 'sim', sessao);

  // ---- 3) os selos e os botões ----------------------------------------------------
  const linhas = (secao) => pg.evaluate((s) => [...document.querySelectorAll(s + ' .lista li')].map((li) => ({
    texto: li.textContent.replace(/\s+/g, ' ').trim(),
    apaga: Boolean(li.querySelector('.apagar')),
    derivar: Boolean(li.querySelector('.ajustar')),
  })), secao);

  await pg.evaluate(() => { window.scrollTo(0, 0); location.hash = '#professores'; });
  await new Promise((r) => setTimeout(r, 350));
  const profs = await linhas('#sec-professores');
  provar('professor vinculado: selo, e SEM «Excluir»',
    profs.some((p) => /Maria/.test(p.texto) && /vinculado/.test(p.texto) && !p.apaga), profs);

  await pg.evaluate(() => { location.hash = '#alunas'; });
  await new Promise((r) => setTimeout(r, 300));
  const aluns = await linhas('#sec-alunas');
  provar('aluna em curadoria com plano: vinculada, sem «Excluir»',
    aluns.some((a) => /Vavá/.test(a.texto) && /vinculada/.test(a.texto) && !a.apaga), aluns);
  provar('aluna fora de plano: livre, com «Excluir»',
    aluns.some((a) => /Bia/.test(a.texto) && /livre/.test(a.texto) && a.apaga), aluns);

  await pg.evaluate(() => { location.hash = '#vocabulario'; });
  await new Promise((r) => setTimeout(r, 300));
  const termos = await linhas('#sec-vocabulario');
  provar('termo em plano (conteúdo ou repertório): «em uso», sem «Excluir»',
    termos.filter((t) => /em uso/.test(t.texto) && !t.apaga).length === 2, termos);

  await pg.evaluate(() => { location.hash = '#turmas'; });
  await new Promise((r) => setTimeout(r, 300));
  const turmas = await pg.evaluate(() => [...document.querySelectorAll('#sec-turmas li.turma')].map((li) => ({
    nome: (li.querySelector('.nome b') || {}).textContent,
    apaga: Boolean(li.querySelector('.apagar')),
  })));
  provar('turma com plano: sem «Excluir»',
    turmas.some((t) => /Balé 1/.test(t.nome) && !t.apaga), turmas);

  // ---- 4) a regra no SERVIDOR -----------------------------------------------------
  const pedir = async (rota, corpo) => (await fetch(base + '/api/bastidores/' + rota, {
    method: 'DELETE', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(Object.assign({ senhaDirecao: '123456' }, corpo)),
  })).status;
  provar('servidor RECUSA excluir professor vinculado', (await pedir('professor', { nome: 'Maria' })) === 409);
  provar('servidor RECUSA excluir aluna vinculada', (await pedir('aluna', { apelido: 'Vavá' })) === 409);
  provar('servidor RECUSA excluir termo em uso', (await pedir('termo', { termo: 'Plié' })) === 409);
  provar('servidor RECUSA excluir termo que só consta no repertório', (await pedir('termo', { termo: 'Tendu' })) === 409);
  provar('servidor RECUSA excluir turma com plano', (await pedir('turma', { id: 'tu1' })) === 409);
  provar('servidor ACEITA excluir aluna livre', (await pedir('aluna', { apelido: 'Bia' })) === 200);

  await br.close();
  srv.close();
  console.log(`\nprovar-proveniencia-e-sessao: ${ko === 0 ? 'TUDO CERTO' : ko + ' FALHA(S)'} (${ok} provas)`);
  process.exit(ko ? 1 : 0);
})().catch((e) => {
  console.error('provar-proveniencia-e-sessao: ' + e.stack);
  process.exit(1);
});
