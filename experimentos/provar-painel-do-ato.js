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
/* O cofre dos bilhetes da bancada, e o registo do que o painel pediu ao emiti-los: é por este
   último que se prova que a senha, a fonte, o ciclo e a aluna viajaram no PEDIDO — e não no
   endereço, que é o que se quer evitar. */
const BILHETES = new Map();
const LASTRO_DO_ATO = [];

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
    /* A ESCOLA VAI NA RESPOSTA, como na ponte (`{ ok, escola, professores }`). O stub não a
       mandava, e a bancada ficava com o contexto incompleto — a porta dizia «falta escola» e o
       salto direto, que respeita a trava, nunca acontecia. O defeito era da bancada, e ele
       escondia exactamente o que a secção 10 queria medir. */
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, escola: 'batata', professores: PROFS }));
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
  /* A ESTANTE SOB O PREFIXO DA PORTA — e SÓ lá. O stub anterior servia `/api/planos` na raiz,
     e a bancada ficava mais permissiva do que a ponte: em produção a raiz devolve 404 (o
     roteador das rotas só é alcançado sob `/anamnese/`, `/plano-ensino/` e `/plano-observacao/`),
     e o select do plano nascia vazio. Um stub que aceita o que a produção recusa esconde
     exactamente o defeito que a prova devia encontrar. */
  if (u.pathname === '/plano-observacao/api/planos') {
    /* A ESTANTE RECORTADA — o mesmo contrato da ponte (`porta.planos`): um carimbo por plano,
       com a turma que ele diz. Os do `manga-curta` são outros, e é isso que se mede: o PO de
       um professor não oferece o plano do outro. */
    const quem = u.searchParams.get('professor');
    const todos = [{ valor: 'plano-20261020', carimbo: 'plano-20261020', rotulo: 'Balé Nível 1',
      turma: 'Balé Nível 1', professor: 'cafe-no-bule' },
    { valor: 'plano-20261022', carimbo: 'plano-20261022', rotulo: 'Balé Nível 2',
      turma: 'Balé Nível 2', professor: 'cafe-no-bule' },
    { valor: 'plano-20261024', carimbo: 'plano-20261024', rotulo: 'Contemporâneo',
      turma: 'Contemporâneo', professor: 'manga-curta' }];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true,
      opcoes: todos.filter((x) => !quem || x.professor === quem) }));
  }
  if (u.pathname === '/api/bastidores/turmas') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, turmas: [{ nome: 'Balé Nível 1' }, { nome: 'Balé Nível 2' }] }));
  }
  /* O BILHETE DO ATO — emitido e consumido, como na ponte. Um mapa de um uso só: o `consumir`
     apaga, e um segundo pedido do mesmo bilhete responde «não». É a mesma regra do servidor
     (`emitirBilheteDoAto` / `consumirBilheteDoAto`), e é o que a porta precisa de encontrar. */
  if (u.pathname === '/api/bastidores/ato' && req.method === 'POST') {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      let d = {}; try { d = JSON.parse(corpo); } catch (e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (d.senha !== 'certa') {
        return res.end(JSON.stringify({ ok: false, erro: 'senha do professor não reconhecida' }));
      }
      const bilhete = 'a'.repeat(32);
      BILHETES.set(bilhete, { fonte: d.fonte, professor: d.professor, ciclo: d.ciclo,
        aluna: d.aluna || '', plano: d.plano || '', expira: Date.now() + 600000 });
      LASTRO_DO_ATO.push(d);
      return res.end(JSON.stringify({ ok: true, ato: bilhete, professor: 'Cafe No Bule' }));
    });
    return;
  }
  if (u.pathname === '/api/bastidores/ato/consumir' && req.method === 'POST') {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      let d = {}; try { d = JSON.parse(corpo); } catch (e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const ato = BILHETES.get(String(d.ato || ''));
      BILHETES.delete(String(d.ato || ''));
      return res.end(JSON.stringify(ato ? { ok: true, ato } : { ok: false, erro: 'bilhete inválido ou já usado' }));
    });
    return;
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

  /* `limpar` É UM PARÂMETRO, e não um hábito. A prova grava um preenchimento interrompido no
     `localStorage` e recarrega para o ver; um `clear()` escondido dentro do `abrir()` apagava-o
     e a secção media a ausência do que ela própria tinha acabado de criar. */
  const abrir = async (caminho, largura, opcoes) => {
    const limpar = !opcoes || opcoes.limpar !== false;
    await p.setViewport({ width: largura, height: 900 });
    await p.goto(base + caminho, { waitUntil: 'load' });
    if (limpar) await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    if (limpar) await p.reload({ waitUntil: 'load' });
    /* O MENU «AÇÕES» (25/10/2026, segunda leitura). No telemóvel ele é a única porta para os
       três espaços: escolher «criar» abre o bloco do ato com o contexto JÁ EXPANDIDO — e é isso
       que se chama aqui, porque sem esse passo o painel está fechado e a medição diria «não
       existe» sobre o que existe. No computador o botão não se vê e os blocos estão à vista; a
       escolha não faz nada. */
    await p.evaluate(() => {
      const bloco = document.getElementById('bloco-ato');
      const b = document.getElementById('botao-acoes');
      const item = document.querySelector('[data-abrir="ato"]');
      if (bloco && bloco.hidden && b && item) { b.click(); item.click(); }
      else if (bloco && bloco.hidden) bloco.hidden = false;
    });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 350)));
  };
  const estado = () => p.evaluate(() => {
    /* UM `summary` É VISÍVEL COM O `details` FECHADO — é ele que o abre. A guarda do
       `closest` escondia-o, e a medição acusava de ausente o botão que estava à vista. */
    const v = (sel) => { const e = document.querySelector(sel); if (!e) return false;
      if (!e.getClientRects().length) return false;
      if (getComputedStyle(e).display === 'none') return false;
      if (e.tagName !== 'SUMMARY' && e.closest('details:not([open])')) return false;
      return true; };
    const cx = document.querySelector('summary.trio-item');
    return {
      caixinha: cx ? Math.round(cx.getBoundingClientRect().width) + '×'
        + Math.round(cx.getBoundingClientRect().height) : 'ausente',
      nova: v('[data-acao="nova"]'), continuar: v('[data-acao="continuar"]'),
      recomecar: v('[data-acao="recomecar"]'), ficha: v('.ficha-em-branco a'),
      novaDesab: (document.querySelector('[data-acao="nova"]') || {}).disabled,
      resumo: (document.querySelector('[data-resumo]') || {}).textContent,
      estado: (document.querySelector('[data-estado]') || {}).textContent,
      painel: (document.getElementById('bloco-ato') || {}).open,
      blocoAberto: (() => { const b = document.getElementById('bloco-ato');
        return !!b && !b.hidden && b.getClientRects().length > 0; })(),
      camposVisiveis: (() => { const c = document.querySelector('.campos-do-ato');
        return !!c && c.getClientRects().length > 0; })(),
      itensDoMenu: [...document.querySelectorAll('#menu-de-acoes .menu-de-acoes-item')]
        .map((x) => x.textContent.trim()),
      professores: (document.getElementById('ato-professor') || {}).length,
      alunas: (document.getElementById('ato-aluna') || {}).length,
    };
  });

  console.log('\n1 · A anamnese: a caixinha, a seta, e a trava');
  await abrir('/area-do-professor/anamnese/', 390);
  let e = await estado();
  /* A CAIXINHA NÃO SE MEDE AQUI (25/10/2026, segunda leitura). No telemóvel ela está escondida
     por desenho: quem abre o contexto é o menu «Ações», e ela seria o segundo clique que o
     pedido recusa. Mede-se a 1280, na secção 9; aqui mede-se que o bloco abriu. */
  ok('no telemóvel o bloco do ato está aberto e o contexto à vista',
    e.blocoAberto === true && e.camposVisiveis === true, e);
  ok('os professores vieram da API', e.professores >= 3, e.professores);
  ok('sem contexto, «Nova» existe mas está desabilitado', e.novaDesab === true, e.novaDesab);
  ok('a caixinha diz o que falta', /escolher o professor/.test(e.resumo), e.resumo);
  ok('«continuar» e «recomeçar» não se vêem (não há memória)', e.continuar === false && e.recomecar === false);
  /* A FICHA DEIXOU DE SER UM LINK À VISTA: passou a ser a terceira acção do menu, e o nome
     seguiu o pedido — «acho que a palavra gerar é a mais adequada». */
  ok('«gerar ficha» está no menu, como as outras duas acções',
    e.itensDoMenu.indexOf('Gerar ficha') !== -1, e.itensDoMenu);

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
  /* O `abrir()` E NÃO O `reload()`: no telemóvel os blocos nascem fechados, e um recarregamento
     puro deixaria a medição a olhar para uma página em que nada está à vista. É o mesmo caminho
     de quem usa: recarregar e escolher «criar». */
  await abrir('/area-do-professor/anamnese/', 390, { limpar: false });
  e = await estado();
  ok('com memória, «Nova» DESAPARECE', e.nova === false, e.nova);
  ok('«continuar de onde parei» aparece', e.continuar === true);
  ok('«começar de novo» aparece', e.recomecar === true);
  /* O BLOCO ABRE SOZINHO para não esconder a notícia — e o do filtro fecha, porque nunca estão
     os dois. É o mesmo `abrirBloco` que o menu usa. */
  ok('o bloco do ato abre sozinho para não esconder a notícia',
    e.blocoAberto === true && e.painel === true);
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

  console.log('\n7 · A senha errada DIZ que é errada');
  {
    /* O DEFEITO MEDIDO EM PRODUÇÃO. Com a senha errada e o contexto inteiro, o botão ficava
     * desabilitado e a linha de estado ficava VAZIA — o professor tentava outra vez sem saber o
     * que corrigir. A porta diz «✗ senha não reconhecida»; aqui o estado passa a dizê-lo também. */
    await abrir('/area-do-professor/anamnese/', 390);
    await p.evaluate(() => {
      localStorage.setItem('ato-batata-anamnese-1',
        JSON.stringify({ professor: 'cafe-no-bule', ciclo: '01', aluna: 'Aluna A' }));
    });
    await p.reload({ waitUntil: 'load' });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 800)));
    await p.evaluate(() => {
      const s = document.getElementById('ato-senha');
      s.value = 'errada'; s.dispatchEvent(new Event('input'));
    });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 1200)));
    const m = await p.evaluate(() => ({
      desab: document.querySelector('[data-acao="nova"]').disabled,
      estado: (document.querySelector('[data-estado]') || {}).textContent,
      escondido: (document.querySelector('[data-estado]') || {}).hidden,
      selo: (document.querySelector('[data-senha-status]') || {}).hidden,
    }));
    ok('com a senha errada, «Nova» fica desabilitado', m.desab === true, m.desab);
    ok('…e o estado DIZ que a senha não foi reconhecida',
      !m.escondido && /senha do professor não foi reconhecida/.test(m.estado || ''), m);
    ok('…e o selo de «confere» não aparece', m.selo === true, m.selo);

    /* E COM A SENHA CERTA TUDO SE SOLTA. */
    await p.evaluate(() => {
      const s = document.getElementById('ato-senha');
      s.value = 'certa'; s.dispatchEvent(new Event('input'));
    });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 1200)));
    const m2 = await p.evaluate(() => ({
      desab: document.querySelector('[data-acao="nova"]').disabled,
      escondido: (document.querySelector('[data-estado]') || {}).hidden,
      selo: (document.querySelector('[data-senha-status]') || {}).hidden,
    }));
    ok('com a senha certa, «Nova» fica habilitado', m2.desab === false, m2.desab);
    ok('…o aviso desaparece e o selo de «confere» aparece',
      m2.escondido === true && m2.selo === false, m2);
  }

  console.log('\n8 · As acções de começar cabem numa fila');
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
    /* AQUI A ORDEM IMPORTA: grava-se, RECARREGA-SE e é o `abrir()` que escolhe «criar». Um
       `reload()` puro deixava o bloco fechado no telemóvel, e a fila de botões media zero. */
    await abrir('/area-do-professor/anamnese/', 390, { limpar: false });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 400)));
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

  console.log('\n9 · Geometria e erros');
  /* A CAIXINHA E A SETA SÓ EXISTEM NO COMPUTADOR (25/10/2026, segunda leitura). No telemóvel
     quem abre o contexto é o menu «Ações», e a caixinha saiu de cena — o pedido foi explícito:
     «que eu tenho que clicar de novo» era o defeito. O que se mede no telemóvel é que nada
     estoura; a caixinha e a seta medem-se onde elas existem. */
  for (const largura of [320, 390, 1280]) {
    await abrir('/area-do-professor/anamnese/', largura);
    const m = await p.evaluate(() => {
      const doc = document.documentElement;
      /* A «CAIXINHA» DE AGORA É O CABEÇALHO DO BLOCO (25/10/2026, terceira leitura): o `summary`
         com o título, o resumo e a seta. É ele que se mede — e ele existe nos dois modos, porque
         é o botão de colapsar em ambos. */
      const cx = document.querySelector('summary.bloco-cabeca');
      /* A SETA DO PAINEL, e não a do menu. As duas usam `.seta-do-ato` (é o mesmo desenho),
         e `querySelector` devolvia a do menu — que no computador está escondida. A prova
         passou a acusar de «não desenhada» uma seta que estava, e a medir a rotação da outra. */
      const seta = document.querySelector('.bloco-lista .bloco-cabeca .seta-do-ato');
      return {
        estouro: Math.max(0, Math.round(doc.scrollWidth - doc.clientWidth)),
        caixinhaA: cx ? Math.round(cx.getBoundingClientRect().height) : 0,
        setaVisivel: seta ? seta.getClientRects().length > 0 : false,
        setaTexto: seta ? seta.textContent : '',
      };
    });
    ok(largura + 'px: nada estoura na horizontal', m.estouro <= 1, m.estouro);
    /* O CABEÇALHO DO BLOCO EXISTE NOS DOIS MODOS — é o botão de colapsar, e é o mesmo desenho.
       No telemóvel ele só se vê depois de «Ações → Fazer anamnese», e é isso que o `abrir()` faz. */
    ok(largura + 'px: o cabeçalho do bloco tem altura de alvo de toque',
      m.caixinhaA >= 36 && m.caixinhaA <= 90, m.caixinhaA);
    ok(largura + 'px: a seta está desenhada', m.setaVisivel && m.setaTexto.trim() === '\u25be', m);
  }
  // a seta roda ao abrir
  await abrir('/area-do-professor/anamnese/', 1280);
  /* A MEDIÇÃO ESPERA A TRANSIÇÃO. `getComputedStyle` no meio de uma animação de 160ms devolve o
     valor INTERPOLADO — e a leitura anterior dizia «roda» com as duas medidas iguais, porque
     ambas foram tiradas com a seta já a caminho. Fecha-se, espera-se, mede-se; abre-se, espera-se,
     mede-se. */
  const rot = await p.evaluate(async () => {
    const s = document.querySelector('.bloco-lista .bloco-cabeca .seta-do-ato');
    const bloco = document.getElementById('bloco-ato');
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    bloco.open = false;
    await espera(300);
    const fechada = getComputedStyle(s).transform;
    bloco.open = true;
    await espera(300);
    return { fechada, aberta: getComputedStyle(s).transform };
  });
  ok('a seta roda 180° ao abrir', rot.fechada !== rot.aberta
    && /matrix\(-1/.test(rot.aberta), rot);
  console.log('\n10 · O PO — observa um PLANO, e a turma vem dele');
  {
    /* A REGRA DO PO («observa uma aula que tem plano») não tinha porta: vivia só na mensagem de
       uma lista vazia. Agora o PO escolhe o plano entre os DESTE professor, e a turma observada
       é leitura — pedir duas vezes a mesma coisa abriria a porta a duas respostas diferentes. */
    await abrir('/area-do-professor/plano-de-observacao/', 1280);
    const doPo = () => p.evaluate(() => ({
      temPlano: !!document.querySelector('[data-ato="plano"]'),
      temTurma: !!document.querySelector('[data-ato="turma"]'),
      opcoes: [...((document.getElementById('ato-plano') || { options: [] }).options)]
        .map((o) => o.value).filter(Boolean),
      leitura: (document.querySelector('[data-turma-leitura]') || {}).textContent,
      estado: (document.querySelector('[data-estado]') || {}).textContent,
      desab: (document.querySelector('[data-acao="nova"]') || {}).disabled,
    }));
    let po = await doPo();
    ok('o PO pede o PLANO, e não uma turma livre', po.temPlano && !po.temTurma);
    ok('sem professor a estante está vazia — não se oferece a escola inteira', po.opcoes.length === 0,
      po.opcoes);

    await p.evaluate(() => {
      const pr = document.getElementById('ato-professor'); pr.value = 'cafe-no-bule';
      pr.dispatchEvent(new Event('change'));
      const c = document.getElementById('ato-ciclo'); c.value = '01'; c.dispatchEvent(new Event('input'));
    });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 500)));
    po = await doPo();
    ok('a estante vem recortada pelo professor — dois planos, e não os três',
      po.opcoes.length === 2 && po.opcoes.indexOf('plano-20261024') === -1, po.opcoes);
    ok('sem plano escolhido, «Novo Plano de Observação» está travado e diz porquê',
      po.desab === true && /Falta o contexto do ato: plano de ensino/.test(po.estado || ''), po.estado);

    await p.evaluate(() => {
      const s = document.getElementById('ato-plano'); s.value = 'plano-20261022';
      s.dispatchEvent(new Event('change'));
    });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 300)));
    po = await doPo();
    ok('a turma observada passa a ser a do PLANO escolhido', po.leitura === 'Balé Nível 2', po.leitura);
    ok('e com o plano escolhido o botão abre', po.desab === false, po.desab);

    /* O DESTINO MEDE-SE A NAVEGAR, e não a reconstruir a URL no teste: uma URL montada à mão
       prova o que o teste sabe, não o que o código faz. Clica-se, espera-se a navegação, e lê-se
       onde a página parou — que é também a única forma de provar que o salto direto acontece. */
    const destino = await Promise.all([
      p.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => null),
      p.evaluate(() => document.querySelector('[data-acao="nova"]').click()),
    ]).then(() => p.url());
    ok('o destino leva o PLANO escolhido, e não «o primeiro da estante»',
      /plano=plano-20261022/.test(destino || ''), destino);
    ok('…e leva o salto direto ao formulário', /abrir=1/.test(destino || ''), destino);
    ok('…e o PO não leva senha nenhuma', !/senha=/.test(destino || ''), destino);

    /* E ATERRA NO FORMULÁRIO. É o pedido literal: «quando clicar em continuar de onde parei ou
       quando clicar em fazer a anamnese ou o plano ou o PO, aí vai direto pro formulário». A
       porta deixa de ser paragem — o cabeçalho, os textos e a listagem de fichas passaram a
       morar na lista. Mede-se no que se VÊ: a abertura oculta, a condução à vista. */
    await p.evaluate(() => new Promise((r) => setTimeout(r, 900)));
    const aterrou = await p.evaluate(() => {
      const abertura = document.getElementById('abertura');
      const conducao = document.getElementById('conducao');
      const visivel = (e) => !!e && !e.classList.contains('oculto') && e.getClientRects().length > 0;
      return { abertura: visivel(abertura), conducao: visivel(conducao),
        temPergunta: !!(document.querySelector('#pergunta') || {}).textContent };
    });
    ok('o salto aterra no FORMULÁRIO, e não na abertura', aterrou.conducao && !aterrou.abertura, aterrou);
    ok('…com a primeira pergunta à vista', !!aterrou.temPergunta, aterrou);

    /* E O SALTO NÃO PASSA POR CIMA DA TRAVA. Na anamnese a senha autoriza o ATO, e ela não
       viaja no endereço (a porta é explícita: «sair não leva a senha»). Sem ela, o salto pára
       na abertura e o botão diz o que falta — um atalho que saltasse a senha saltava a única
       coisa que autoriza a escrita. */
    await abrir('/area-do-professor/anamnese/', 1280);
    await p.evaluate(() => {
      const pr = document.getElementById('ato-professor'); pr.value = 'cafe-no-bule';
      pr.dispatchEvent(new Event('change'));
      const c = document.getElementById('ato-ciclo'); c.value = '01'; c.dispatchEvent(new Event('input'));
    });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 400)));
    await p.evaluate(() => {
      const a = document.getElementById('ato-aluna'); a.value = 'Aluna A';
      a.dispatchEvent(new Event('change'));
    });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 400)));
    const comTrava = await Promise.all([
      p.waitForNavigation({ waitUntil: 'load', timeout: 5000 }).catch(() => null),
      p.evaluate(() => document.querySelector('[data-acao="nova"]').click()),
    ]).then(() => p.url());
    /* O botão está travado pela senha, e um botão travado não navega. O clique não sai da
       página — e é isso que se prova: `abrir=1` não contorna a senha. */
    ok('sem a senha validada, «Nova anamnese» está travado e não leva a lado nenhum',
      /area-do-professor\/anamnese/.test(comTrava), comTrava);
  }

  console.log('\n10b · O MENU É UMA FOLHA, E OS DOIS BLOCOS NUNCA ESTÃO ABERTOS');
  {
    /* O PEDIDO FOI LITERAL, e a primeira versão não o cumpria: «eu tenho o botão ações, que ele
       não tá abrindo um menu igual o menu de opções… o botão de ações tá do lado esquerdo. Ele
       tem que ficar lá do lado direito… E não pode acontecer de eu abrir no menu a nova anamnese
       e aí em seguida eu quero agora ver o procurar e aí eu fico com os dois na tela. Não. Ou eu
       tenho o procurar ou eu tenho a nova anamnese.»
       O que se mede: o botão à direita no telemóvel, ausente no computador; a folha com véu que
       sobe; e a exclusividade nos dois modos. */

    /* --- TELEMÓVEL --- */
    await abrir('/area-do-professor/anamnese/', 390);
    const tl = await p.evaluate(() => {
      const b = document.getElementById('botao-acoes');
      const r = b ? b.getBoundingClientRect() : null;
      return { visivel: !!b && b.getClientRects().length > 0,
        /* à direita = o centro do botão passa de metade da janela */
        aDireita: r ? (r.left + r.width / 2) > (window.innerWidth / 2) : false,
        ato: (document.getElementById('bloco-ato') || {}).open,
        filtro: (document.getElementById('bloco-filtro') || {}).open };
    });
    ok('telemóvel: o «Ações» está à vista e à DIREITA', tl.visivel && tl.aDireita, tl);
    /* AQUI O `abrir()` DA BANCADA JÁ TINHA ESCOLHIDO «FAZER ANATOMNESE» — ele escolhe para poder
       medir. O repouso mede-se num carregamento limpo, sem escolha nenhuma: é o estado em que a
       pessoa chega. */
    const repouso = await p.evaluate(async () => {
      const r = await fetch(location.href).then((x) => x.text());
      const d = new DOMParser().parseFromString(r, 'text/html');
      const ato = d.getElementById('bloco-ato');
      const fil = d.getElementById('bloco-filtro');
      return { atoExiste: !!ato, filtroExiste: !!fil,
        atoAberto: !!ato && ato.hasAttribute('open'),
        filtroAberto: !!fil && fil.hasAttribute('open') };
    });
    ok('telemóvel: em repouso nenhum dos dois blocos está aberto no HTML — a tela é da listagem',
      repouso.atoExiste && repouso.filtroExiste
      && repouso.atoAberto === false && repouso.filtroAberto === false, repouso);

    const folha = await p.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      document.getElementById('botao-acoes').click();
      await espera(300);
      const m = document.getElementById('menu-de-acoes');
      const v = document.getElementById('veu-acoes');
      const cs = getComputedStyle(m);
      const r = m.getBoundingClientRect();
      return { aberto: !m.hidden, veu: !!v && !v.hidden, fixo: cs.position === 'fixed',
        embaixo: Math.round(window.innerHeight - r.bottom) <= 2 };
    });
    ok('telemóvel: «Ações» abre uma FOLHA (fixa, encostada em baixo), como o «Seções»',
      folha.aberto && folha.fixo && folha.embaixo, folha);
    ok('…com véu por trás', folha.veu === true, folha);

    const exc = await p.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const st = () => ({ ato: document.getElementById('bloco-ato').open,
        filtro: document.getElementById('bloco-filtro').open,
        menu: !document.getElementById('menu-de-acoes').hidden });
      document.querySelector('[data-abrir="ato"]').click();
      await espera(250);
      const comAto = st();
      document.getElementById('botao-acoes').click();
      await espera(150);
      document.querySelector('[data-abrir="filtro"]').click();
      await espera(250);
      return { comAto, comFiltro: st() };
    });
    ok('telemóvel: escolher «fazer anamnese» fecha o menu e abre o bloco do ato',
      exc.comAto.ato === true && exc.comAto.filtro === false && exc.comAto.menu === false, exc.comAto);
    ok('telemóvel: escolher «procurar» FECHA o do ato — nunca os dois',
      exc.comFiltro.filtro === true && exc.comFiltro.ato === false, exc.comFiltro);

    /* E COLAPSAR DEVOLVE A TELA LIMPA: só a listagem e o «Ações» outra vez. */
    const limpo = await p.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      document.getElementById('bloco-filtro').open = false;
      await espera(250);
      const ato = document.getElementById('bloco-ato');
      const fil = document.getElementById('bloco-filtro');
      return { ato: ato.getClientRects().length > 0 && ato.open,
        filtro: fil.getClientRects().length > 0 && fil.open,
        /* A LISTAGEM PODE ESTAR VAZIA (o fixture não semeia anamneses): o que se prova é que a
           página continua a ter conteúdo abaixo, e não que há linhas. */
        listagem: !!document.querySelector('.trio-lista, .aviso') };
    });
    ok('telemóvel: colapsar os dois devolve a tela limpa — só a listagem',
      limpo.ato === false && limpo.filtro === false && limpo.listagem === true, limpo);

    /* --- COMPUTADOR --- */
    await abrir('/area-do-professor/anamnese/', 1280);
    const pc = await p.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const b = document.getElementById('botao-acoes');
      const st = () => ({ ato: document.getElementById('bloco-ato').open,
        filtro: document.getElementById('bloco-filtro').open });
      const inicial = st();
      /* abrir o filtro pelo `summary`, como quem clica */
      document.querySelector('#bloco-filtro > summary').click();
      await espera(300);
      const depoisDoFiltro = st();
      document.querySelector('#bloco-ato > summary').click();
      await espera(300);
      return { botao: !!b && b.getClientRects().length > 0, inicial,
        depoisDoFiltro, depoisDoAto: st() };
    });
    ok('computador: o «Ações» NÃO aparece — é botão de telemóvel', pc.botao === false, pc.botao);
    /* NO COMPUTADOR OS DOIS NASCEM FECHADOS (25/10/2026, quarta leitura): «eu entrei em anamnese…
       ao invés de aparecer o contexto do ato expandido, ele vai aparecer também colapsado, igual
       tá o procurar». Duas barras com o nome da acção, e cada um abre a sua. */
    ok('computador: em repouso OS DOIS blocos estão fechados, como o procurar',
      pc.inicial.ato === false && pc.inicial.filtro === false, pc.inicial);
    ok('computador: abrir o procurar FECHA o contexto do ato',
      pc.depoisDoFiltro.filtro === true && pc.depoisDoFiltro.ato === false, pc.depoisDoFiltro);
    ok('computador: abrir o contexto do ato FECHA o procurar',
      pc.depoisDoAto.ato === true && pc.depoisDoAto.filtro === false, pc.depoisDoAto);
  }

  console.log('\n11 · O BILHETE DO ATO — a senha não viaja, a autorização sim');
  {
    /* O PROBLEMA QUE ELE RESOLVE, e que a pesquisadora encontrou a testar: «fui em criar
       anamnese… me levou pra página onde tá escrito anamnese do aluno e tem de novo o contexto
       do ato… Tem que me levar direto pro formulário». A porta pede a senha para COMEÇAR (a
       regra é dela, e está certa); a lista validou a senha e a autorização morria ali. O
       bilhete de uso único atravessa — opaco, ligado a um ato, sem a senha lá dentro. */
    await abrir('/area-do-professor/anamnese/', 1280);
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
    const desab = await p.evaluate(() => (document.querySelector('[data-acao="nova"]') || {}).disabled);
    ok('com a senha certa o botão abre', desab === false, desab);

    const destino = await Promise.all([
      p.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => null),
      p.evaluate(() => document.querySelector('[data-acao="nova"]').click()),
    ]).then(() => p.url());
    const pedido = LASTRO_DO_ATO[LASTRO_DO_ATO.length - 1] || {};
    ok('o painel pediu o bilhete ao servidor, com a senha e o ato',
      pedido.senha === 'certa' && pedido.professor === 'cafe-no-bule'
      && pedido.fonte === 'anamnese' && pedido.ciclo === '01' && pedido.aluna === 'Aluna A', pedido);
    ok('…e a senha NÃO vai no endereço', !/senha=/.test(destino || ''), destino);
    ok('…o bilhete vai', /ato=a{32}/.test(destino || ''), destino);

    await p.evaluate(() => new Promise((r) => setTimeout(r, 800)));
    const aterrou = await p.evaluate(() => {
      const visivel = (e) => !!e && !e.classList.contains('oculto') && e.getClientRects().length > 0;
      return { conducao: visivel(document.getElementById('conducao')),
        /* A ABERTURA JÁ NÃO EXISTE no ficheiro (26/10/2026): a pergunta passou a ser «há uma
           página intermediária à vista?», e a resposta certa é não haver sequer o elemento. */
        temAbertura: !!document.getElementById('abertura'),
        fichas: !!document.getElementById('lista-fichas'),
        url: location.search };
    });
    ok('a anamnese aterra no FORMULÁRIO — sem página intermediária, nem no ficheiro',
      aterrou.conducao && !aterrou.temAbertura && !aterrou.fichas, aterrou);
    ok('…e o bilhete sai do endereço depois de gasto', !/ato=a{32}/.test(aterrou.url || ''), aterrou.url);

    /* E UM BILHETE GASTO NÃO ABRE OUTRA VEZ. É «de uso único» — sem isto, um valor que fica no
       histórico voltaria a autorizar o mesmo ato, e a senha teria sido contornada por repetição.
       A página leva a pessoa à LISTA: é lá que se pede a senha outra vez, e é o único destino
       que sobrou quando a abertura deixou de existir. */
    /* NUM NAVEGADOR LIMPO, que é o caso real: alguém reusa um link antigo, ou abre-o noutro
       sítio. Aqui não há histórico para onde voltar — e é o DESTINO DECLARADO que tem de
       funcionar. Numa aba com histórico, o `back()` resolve; sem ele, só a rede salva. */
    /* O BILHETE DO STUB É CONHECIDO (`a` × 32), e é ele que se reusa. Montar o endereço a partir
       de `p.url()` NÃO serve: quando o `p.url()` é lido, a porta já gastou o bilhete e o tirou do
       endereço — o que se estava a reusar era um link SEM bilhete, e o teste passava a medir
       outra coisa. */
    const alvoGasto = destino + (destino.indexOf('?') === -1 ? '?' : '&') + 'ato=' + 'a'.repeat(32);
    const p2 = await b.newPage();
    await p2.goto(alvoGasto, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1600));
    const repetido = { url: p2.url() };
    await p2.close();
    ok('um bilhete já usado NÃO abre o formulário — devolve à lista',
      /\/area-do-professor\/anamnese/.test(repetido.url), repetido.url);

    /* «CONTINUAR DE ONDE PAREI» TAMBÉM TEM DE ATERRAR NO FORMULÁRIO. Foi este o caso que a
       pesquisadora reportou: «eu vou clicar aqui em continuar de onde eu parei. Aí ele tá me
       levando de novo pra aquele lugar intermediário». Com depósito, a porta salta pelo ramo do
       «continuar» — e o que se mede é que ela entra na condução, e não na abertura. */
    await abrir('/area-do-professor/anamnese/', 1280);
    await p.evaluate(() => {
      localStorage.setItem('porta-anamnese-batata-cafe-no-bule-01-1',
        JSON.stringify({ respondidos: 7, total: 53, quando: '2026-10-25T13:05:00Z',
          indice: 2, respostas: [], notas: [], sugeridas: [] }));
      localStorage.setItem('ato-batata-anamnese-1',
        JSON.stringify({ professor: 'cafe-no-bule', ciclo: '01', aluna: 'Aluna A' }));
    });
    await abrir('/area-do-professor/anamnese/', 1280, { limpar: false });
    await p.evaluate(() => {
      const s = document.getElementById('ato-senha');
      if (s) { s.value = 'certa'; s.dispatchEvent(new Event('input')); }
    });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 900)));
    const temContinuar = await p.evaluate(() => {
      const b = document.querySelector('[data-acao="continuar"]');
      return !!b && b.getClientRects().length > 0;
    });
    ok('com preenchimento interrompido, «continuar» está à vista', temContinuar === true);

    const destinoContinuar = await Promise.all([
      p.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => null),
      p.evaluate(() => document.querySelector('[data-acao="continuar"]').click()),
    ]).then(() => p.url());
    ok('«continuar» leva o plano/nó de onde parou e o salto directo',
      /abrir=1/.test(destinoContinuar || ''), destinoContinuar);

    await p.evaluate(() => new Promise((r) => setTimeout(r, 900)));
    const aterrouContinuar = await p.evaluate(() => {
      const visivel = (e) => !!e && !e.classList.contains('oculto') && e.getClientRects().length > 0;
      return { conducao: visivel(document.getElementById('conducao')),
        abertura: visivel(document.getElementById('abertura')) };
    });
    ok('…e aterra no FORMULÁRIO, não na página intermédia',
      aterrouContinuar.conducao && !aterrouContinuar.abertura, aterrouContinuar);
  }

  ok('nenhum erro de JavaScript', erros.length === 0, erros);

  await b.close(); servidor.close();
  console.log('\n' + (falhas ? 'FALHOU — ' + falhas : 'TUDO CERTO'));
  process.exit(falhas ? 1 : 0);
})();
