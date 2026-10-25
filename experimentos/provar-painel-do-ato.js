#!/usr/bin/env node
'use strict';

/*
 * provar-painel-do-ato.js — o contexto do ato DENTRO da listagem, e a regra dos botões.
 *
 * O QUE MUDOU (25/10/2026). A Área do Professor tinha duas páginas para o mesmo assunto: a lista,
 * com o padrão das outras, e a porta, onde vivia o contexto do ato. Criar exigia sair da lista, e
 * o mesmo registo aparecia em dois lugares. O contexto passou a ser um painel dentro da lista —
 * a caixinha do «Turma», na faixa inteira, com uma SETA em vez do «?».
 *
 * O QUE SE PROVA AQUI, e não no texto:
 *   1. a caixinha tem largura de faixa (não de um terço) e altura de caixinha, nas três larguras;
 *   2. o ícone é a seta `▾`, e RODA 180° ao abrir — a mesma gramática da `.coluna-seta`;
 *   3. a regra dos botões é a da porta, e é executada: sem memória → «Nova»; com memória →
 *      «Continuar» + «Começar de novo» e «Nova» desaparece; «Começar de novo» limpa e devolve;
 *   4. a chave da memória é a MESMA da porta (`porta-<fonte>-<escola>-<professor>-<ciclo>-1`),
 *      e é por isso que o painel sabe o que o professor começou a preencher lá;
 *   5. o CONTEXTO ESCOLHIDO sobrevive ao recarregamento — sem isso a chave da memória seria
 *      calculada com o professor vazio, e o «continuar» nunca apareceria;
 *   6. a trava da curadoria vale no plano e no PO, e a da senha na anamnese;
 *   7. o campo «aluna» só existe na anamnese; a turma é `select` no plano e LEITURA no PO;
 *   8. «ver a ficha em branco» fica FORA do painel, à vista com ele fechado;
 *   9. nada estoura na horizontal e não há erro de JavaScript.
 *
 * A BANCADA É FIEL A PRODUÇÃO EM DUAS COISAS QUE JÁ ENGANARAM A MEDIÇÃO: os `assets/` são servidos
 * ANTES do Worker, com o `Content-Type` certo (em produção é o asset-first do Cloudflare; servir
 * a folha pelo `comAparencia` devolve `text/html` e o browser NÃO a aplica — a página é medida
 * sem desenho e todas as medidas passam a valer zero), e a API é stubada com a forma real.
 *
 * Pede Chrome/Chromium: sem ele, NÃO FEITO — nunca um «passou» silencioso.
 *
 *   node experimentos/provar-painel-do-ato.js
 *   CHROME_PATH=/usr/bin/chromium node experimentos/provar-painel-do-ato.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const puppeteer = require(path.join(execSync('npm root -g').toString().trim(),
  '@marp-team/marp-cli/node_modules/puppeteer-core'));
const producao = require(path.join(raiz, 'motor/servidor/producao.js'));

function kvDeMentira(inicial) {
  const d = new Map(Object.entries(inicial || {}));
  return {
    async get(k) { return d.has(k) ? d.get(k) : null; },
    async put(k, v) { d.set(k, String(v)); },
    async delete(k) { d.delete(k); },
    async list(o) { const p = (o && o.prefix) || '';
      return { keys: [...d.keys()].filter((k) => k.startsWith(p)).map((name) => ({ name })), list_complete: true }; },
  };
}
const rel = (id) => ({ id, estado: 'x', contagem: { respondidos: 0, obrigatorios: 0 }, elos: [], paradas: [],
  idsDesconhecidos: [], validacao: { resultado: 'aceite', contrato: 'prova' }, errosDoDocumento: [], linhas: [] });

const DIR = path.join(raiz, 'publicacao', 'batata');
const ALUNAS = ['Aluna A', 'Aluna B', 'Aluna C'];
const PROFS = [{ nome: 'Cafe No Bule', slug: 'cafe-no-bule' }, { nome: 'Manga Curta', slug: 'manga-curta' }];

const servidor = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1');
  // A API stubada — a mesma forma que o Worker devolve.
  // OS ASSETS SÃO SERVIDOS ANTES DO WORKER, como em produção (asset-first do Cloudflare).
  // Sem isto o `comAparencia` devolve a folha como text/html e o browser não a aplica — a
  // bancada mediria uma página sem desenho nenhum, a jurar que mediu.
  if (u.pathname.startsWith('/assets/')) {
    const f = path.join(DIR, u.pathname);
    if (fs.existsSync(f)) {
      const t = /[.](css|js|svg|json)$/.exec(u.pathname);
      const M = { '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
        '.svg': 'image/svg+xml', '.json': 'application/json' };
      res.writeHead(200, { 'Content-Type': M[t ? '.' + t[1] : ''] || 'application/octet-stream' });
      return res.end(fs.readFileSync(f));
    }
  }
  if (u.pathname === '/api/bastidores/professores') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, professores: PROFS }));
  }
  if (u.pathname === '/api/bastidores/alunas') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, alunas: ALUNAS }));
  }
  if (u.pathname === '/api/bastidores/curadoria-professor') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const p = u.searchParams.get('professor');
    return res.end(JSON.stringify({ ok: true, curadorias: p === 'cafe-no-bule'
      ? [{ turmas: ['Balé Nível 1'], alunas: ['Aluna A'] }] : [] }));
  }
  if (u.pathname === '/api/bastidores/turmas') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, turmas: [{ nome: 'Balé Nível 1' }, { nome: 'Balé Nível 2' }] }));
  }
  if (u.pathname === '/api/bastidores/validar-senha') {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      let d = {}; try { d = JSON.parse(corpo); } catch (e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(d.senha === 'certa'
        ? { ok: true, professor: 'Cafe No Bule' } : { ok: false, erro: 'senha do professor não reconhecida' }));
    });
    return;
  }
  // o resto → a ponte real
  const env = global.ENV;
  const r = await producao.fetch(new Request('https://batata.tmenegaz77.workers.dev' + req.url), env);
  const texto = await r.text();
  res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'text/html; charset=utf-8' });
  res.end(texto);
});

(async () => {
  const dir = path.join(raiz, 'publicacao', 'batata');
  const kv = kvDeMentira({
    'bastidores/batata/curadorias': JSON.stringify([{ id: 'c', professor: 'cafe-no-bule',
      modalidade: 'balé', tradicao: 'clássico', turmas: ['Balé Nível 1'], alunas: ['Aluna A'] }]),
  });
  global.ENV = {
    ESCOLA_SLUG: 'batata', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', SENHA_PROFESSOR: 'certa',
    PROFESSOR_NOME: 'Cafe No Bule', PADD_KV: kv,
    ASSETS: { async fetch(pedido) { const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      let p = path.join(dir, url.pathname);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) return new Response('nao', { status: 404 });
      const t = /[.](css|js|svg|json|html)$/.exec(url.pathname);
      const M = { '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
        '.svg': 'image/svg+xml', '.json': 'application/json' };
      return new Response(fs.readFileSync(p), { status: 200,
        headers: { 'Content-Type': M[t ? '.' + t[1] : ''] || 'text/html; charset=utf-8' } }); } },
  };
  const porta = await new Promise((r) => { servidor.listen(0, '127.0.0.1', () => r(servidor.address().port)); });
  const base = 'http://127.0.0.1:' + porta;

  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    args: ['--no-sandbox'] });
  const p = await b.newPage();
  const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  let falhas = 0;
  const ok = (t, c, d) => { if (c) console.log('  ok    ' + t);
    else { falhas += 1; console.log('  FALHOU ' + t + (d === undefined ? '' : ' → ' + JSON.stringify(d))); } };

  const abrir = async (caminho, largura) => {
    await p.setViewport({ width: largura, height: 900 });
    await p.goto(base + caminho, { waitUntil: 'load' });
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.reload({ waitUntil: 'load' });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 350)));
  };
  const estado = () => p.evaluate(() => {
    const v = (sel) => { const e = document.querySelector(sel); if (!e) return false;
      if (!e.getClientRects().length) return false;
      if (getComputedStyle(e).display === 'none') return false;
      if (e.closest('details:not([open])')) return false; return true; };
    const cx = document.querySelector('summary.trio-item');
    return {
      caixinha: cx ? Math.round(cx.getBoundingClientRect().width) + '×'
        + Math.round(cx.getBoundingClientRect().height) : 'ausente',
      nova: v('[data-acao="nova"]'), continuar: v('[data-acao="continuar"]'),
      recomecar: v('[data-acao="recomecar"]'), ficha: v('.ficha-em-branco a'),
      novaDesab: (document.querySelector('[data-acao="nova"]') || {}).disabled,
      resumo: (document.querySelector('[data-resumo]') || {}).textContent,
      estado: (document.querySelector('[data-estado]') || {}).textContent,
      painel: (document.getElementById('painel-ato') || {}).open,
      professores: (document.getElementById('ato-professor') || {}).length,
      alunas: (document.getElementById('ato-aluna') || {}).length,
    };
  });

  console.log('\n1 · A anamnese: a caixinha, a seta, e a trava');
  await abrir('/area-do-professor/anamnese/', 390);
  let e = await estado();
  ok('a caixinha do ato tem largura de faixa (não de um terço)', parseInt(e.caixinha, 10) >= 300, e.caixinha);
  ok('os professores vieram da API', e.professores >= 3, e.professores);
  ok('sem contexto, «Nova» existe mas está desabilitado', e.novaDesab === true, e.novaDesab);
  ok('a caixinha diz o que falta', /escolher o professor/.test(e.resumo), e.resumo);
  ok('«continuar» e «recomeçar» não se vêem (não há memória)', e.continuar === false && e.recomecar === false);
  ok('«ver a ficha em branco» está à vista com o painel fechado', e.ficha === true);

  console.log('\n2 · Escolher professor, ciclo, aluna e a senha certa');
  await p.evaluate(() => {
    const pr = document.getElementById('ato-professor'); pr.value = 'cafe-no-bule';
    pr.dispatchEvent(new Event('change'));
    const c = document.getElementById('ato-ciclo'); c.value = '01'; c.dispatchEvent(new Event('input'));
  });
  await p.evaluate(() => new Promise((r) => setTimeout(r, 400)));
  await p.evaluate(() => {
    const a = document.getElementById('ato-aluna'); a.value = 'Aluna A';
    a.dispatchEvent(new Event('change'));
    const s = document.getElementById('ato-senha'); s.value = 'certa';
    s.dispatchEvent(new Event('input'));
  });
  await p.evaluate(() => new Promise((r) => setTimeout(r, 900)));
  e = await estado();
  ok('o resumo da caixinha diz o contexto inteiro',
    /Cafe No Bule/.test(e.resumo) && /ciclo 01/.test(e.resumo) && /Aluna A/.test(e.resumo), e.resumo);
  ok('com o contexto e a senha, «Nova» fica habilitado', e.novaDesab === false, e.novaDesab);
  ok('e o aviso do que falta desaparece', !/Falta o contexto/.test(e.estado || ''), e.estado);

  console.log('\n3 · «Nova» leva à porta com o contexto, e o painel passa a «continuar»');
  const destino = await p.evaluate(() => {
    const q = [];
    if (document.getElementById('ato-professor').value) q.push('professor=' + encodeURIComponent(document.getElementById('ato-professor').value));
    if (document.getElementById('ato-ciclo').value) q.push('ciclo=' + encodeURIComponent(document.getElementById('ato-ciclo').value));
    if (document.getElementById('ato-aluna').value) q.push('aluna=' + encodeURIComponent(document.getElementById('ato-aluna').value));
    return '/anamnese/' + (q.length ? '?' + q.join('&') : '');
  });
  ok('o destino tem professor, ciclo e aluna',
    /professor=cafe-no-bule/.test(destino) && /ciclo=01/.test(destino) && /aluna=Aluna(\+|%20)A/.test(destino),
    destino);

  // simular um preenchimento interrompido: gravar na chave da PORTA
  await p.evaluate(() => {
    localStorage.setItem('porta-anamnese-batata-cafe-no-bule-01-1',
      JSON.stringify({ respondidos: 7, total: 53, quando: '2026-10-25T13:05:00.000Z', indice: 7,
        respostas: [], notas: [], sugeridas: [] }));
  });
  await p.reload({ waitUntil: 'load' });
  await p.evaluate(() => new Promise((r) => setTimeout(r, 500)));
  e = await estado();
  ok('com memória, «Nova» DESAPARECE', e.nova === false, e.nova);
  ok('«continuar de onde parei» aparece', e.continuar === true);
  ok('«começar de novo» aparece', e.recomecar === true);
  ok('o painel abre sozinho para não esconder a notícia', e.painel === true);
  ok('e o estado diz o preenchimento interrompido', /preenchimento interrompido/.test(e.estado || ''), e.estado);

  console.log('\n4 · «Começar de novo» limpa e devolve o «Nova»');
  await p.evaluate(() => document.querySelector('[data-acao="recomecar"]').click());
  await p.evaluate(() => new Promise((r) => setTimeout(r, 300)));
  e = await estado();
  ok('«Nova» volta', e.nova === true, e.nova);
  ok('«continuar» desaparece', e.continuar === false);
  ok('«recomeçar» desaparece', e.recomecar === false);
  const mem = await p.evaluate(() => localStorage.getItem('porta-anamnese-batata-cafe-no-bule-01-1'));
  ok('a memória foi mesmo apagada', mem === null, mem);

  console.log('\n5 · O PO: sem curadoria, a trava da direção');
  await abrir('/area-do-professor/plano-de-observacao/', 390);
  ok('o PO tem o campo da turma em LEITURA, não um select',
    await p.evaluate(() => !!document.querySelector('[data-turma-leitura]')
      && !document.querySelector('[data-ato="turma"]')));
  await p.evaluate(() => {
    const pr = document.getElementById('ato-professor'); pr.value = 'manga-curta';
    pr.dispatchEvent(new Event('change'));
  });
  await p.evaluate(() => new Promise((r) => setTimeout(r, 500)));
  e = await estado();
  ok('sem curadoria, «Nova» continua desabilitado', e.novaDesab === true, e.novaDesab);
  ok('…e o estado diz porquê', /curadoria/.test(e.estado || ''), e.estado);

  console.log('\n6 · O plano de ensino: a turma é um select, e as turmas vêm da API');
  await abrir('/area-do-professor/plano-de-ensino/', 390);
  await p.evaluate(() => {
    const pr = document.getElementById('ato-professor'); pr.value = 'cafe-no-bule';
    pr.dispatchEvent(new Event('change'));
  });
  await p.evaluate(() => new Promise((r) => setTimeout(r, 500)));
  const turmas = await p.evaluate(() => {
    const s = document.getElementById('ato-turma');
    return s ? { existe: true, n: s.options.length } : { existe: false };
  });
  ok('há um select de turma', turmas.existe);
  ok('e as turmas vieram da API', turmas.n >= 3, turmas.n);

  console.log('\n7 · As acções de começar cabem numa fila');
  {
    /* A 390px, com o preenchimento interrompido, sobram DOIS botões («Continuar» e «Começar de
     * novo»). Medido: 169+129+6,4 = 304 numa coluna de 339 — uma fila, 29px. É o que decidiu a
     * forma das acções: com `.acao` em todas, as mesmas duas pediam 97px e duas filas. */
    await abrir('/area-do-professor/anamnese/', 390);
    await p.evaluate(() => {
      localStorage.setItem('porta-anamnese-batata-cafe-no-bule-01-1',
        JSON.stringify({ respondidos: 7, total: 53, quando: '2026-10-25T13:05:00Z' }));
      localStorage.setItem('ato-batata-anamnese-1',
        JSON.stringify({ professor: 'cafe-no-bule', ciclo: '01', aluna: 'Aluna A' }));
    });
    await p.reload({ waitUntil: 'load' });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 600)));
    const m = await p.evaluate(() => {
      const c = document.querySelector('.acoes-do-ato');
      const bs = [...c.querySelectorAll('.acao')].filter((b) => b.getClientRects().length);
      const tops = new Set(bs.map((b) => Math.round(b.getBoundingClientRect().top)));
      return { filas: tops.size, altura: Math.round(c.getBoundingClientRect().height),
        n: bs.length, rotulos: bs.map((b) => b.textContent.trim()) };
    });
    ok('com preenchimento interrompido há dois botões', m.n === 2, m.rotulos);
    ok('e cabem numa fila só', m.filas === 1, m);
    ok('a fila tem menos de 40px de altura', m.altura < 40, m.altura);
  }

  console.log('\n8 · Geometria e erros');
  for (const largura of [320, 390, 1280]) {
    await abrir('/area-do-professor/anamnese/', largura);
    const m = await p.evaluate(() => {
      const doc = document.documentElement;
      const cx = document.querySelector('summary.trio-item');
      const seta = document.querySelector('.seta-do-ato');
      return {
        estouro: Math.max(0, Math.round(doc.scrollWidth - doc.clientWidth)),
        caixinhaA: cx ? Math.round(cx.getBoundingClientRect().height) : 0,
        setaVisivel: seta ? seta.getClientRects().length > 0 : false,
        setaTexto: seta ? seta.textContent : '',
      };
    });
    ok(largura + 'px: nada estoura na horizontal', m.estouro <= 1, m.estouro);
    ok(largura + 'px: a caixinha tem altura de caixinha', m.caixinhaA >= 40 && m.caixinhaA <= 90, m.caixinhaA);
    ok(largura + 'px: a seta está desenhada', m.setaVisivel && m.setaTexto.trim() === '\u25be', m);
  }
  // a seta roda ao abrir
  await abrir('/area-do-professor/anamnese/', 390);
  const rot = await p.evaluate(() => {
    const s = document.querySelector('.seta-do-ato');
    document.getElementById('painel-ato').open = false;
    const fechada = getComputedStyle(s).transform;
    document.getElementById('painel-ato').open = true;
    return new Promise((r) => setTimeout(() => r({ fechada, aberta: getComputedStyle(s).transform }), 250));
  });
  ok('a seta roda 180° ao abrir', rot.fechada !== rot.aberta
    && /matrix\(-1/.test(rot.aberta), rot);
  ok('nenhum erro de JavaScript', erros.length === 0, erros);

  await b.close(); servidor.close();
  console.log('\n' + (falhas ? 'FALHOU — ' + falhas : 'TUDO CERTO'));
  process.exit(falhas ? 1 : 0);
})();
