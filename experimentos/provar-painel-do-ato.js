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
      /* DUAS TURMAS NA CURADORIA (26/10/2026). Com uma só, a sugestão da curadoria e a turma do
         registo eram o mesmo valor, e a prova de «o campo mostra a turma do REGISTO» passaria
         mesmo com o campo a mostrar a sugestão — que era exactamente o defeito. */
      ? [{ turmas: ['Balé Nível 1', 'Balé Nível 2'], alunas: ['Aluna A'] }] : [] }));
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
    /* AS DUAS LEITURAS DA MESMA RESPOSTA (20/10/2026): `turmas` é o cadastro (o ritmo) e
       `opcoes` é o que o select marca. O stub devolvia só `turmas`, e o select da turma nascia
       vazio — um stub que aceita menos do que a produção esconde o defeito que a prova procura. */
    const nomes = ['Balé Nível 1', 'Balé Nível 2'];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true,
      turmas: nomes.map((nome) => ({ nome })),
      opcoes: nomes.map((nome) => ({ valor: nome, rotulo: nome })) }));
  }
  /* O ENVELOPE DE UM REGISTO — o que o «Ajustar» carrega para a condução. Sob o prefixo da
     porta, como em produção (`/anamnese/api/envelope/<id>`). */
  {
    const m = /^\/(anamnese|plano-ensino|plano-observacao)\/api\/envelope\/(.+)$/.exec(u.pathname);
    if (m) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        id: decodeURIComponent(m[2]),
        contexto: { escola: 'batata', professor: 'cafe-no-bule', ciclo: '01', aluna: 'Aluna A' },
        respostas: {
          idade: { valor: '32' },
          'contexto-turma': { valor: 'Balé Nível 2' },
          'plano-de-ensino': { valor: ['plano-20261022'] },
        },
        gerado_em: '2026-10-22T16:00',
      }));
    }
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
      /* Com uma RESPOSTA da pessoa: «há o que continuar» é isso, e não o depósito (26/10/2026). */
      JSON.stringify({ respondidos: 7, total: 53, quando: '2026-10-25T13:05:00.000Z', indice: 7,
        respostas: [['idade', '32']], notas: [], sugeridas: [] }));
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
        JSON.stringify({ respondidos: 7, total: 53, quando: '2026-10-25T13:05:00Z',
          indice: 3, respostas: [['idade', '32']], notas: [], sugeridas: [] }));
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
    /* UM NAVEGADOR LIMPO, E NÃO UMA ABA LIMPA. Desde que a retomada deixou de pedir a senha
       (26/10/2026), um depósito no `localStorage` abre o formulário por si — e a aba `p` está
       aberta no formulário, a gravar o depósito enquanto isto corre. Limpar o `localStorage` de
       uma aba e voltar a navegar nela media «o depósito que a outra aba reescreveu», não o
       bilhete. O que se quer medir é o bilhete, e só ele: «um bilhete gasto, sozinho, autoriza?».
       Um navegador novo é o único sítio onde a resposta é só essa. */
    const b2 = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
      args: ['--no-sandbox'] });
    const p2 = await b2.newPage();
    p2.on('console', (m) => { if (/DIAG/.test(m.text())) console.log('   ' + m.text()); });
    await p2.goto(alvoGasto, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1600));
    const repetido = { url: p2.url() };
    await b2.close();
    ok('um bilhete já usado NÃO abre o formulário — devolve à lista',
      /\/area-do-professor\/anamnese/.test(repetido.url), repetido.url);

    /* «CONTINUAR DE ONDE PAREI» TAMBÉM TEM DE ATERRAR NO FORMULÁRIO. Foi este o caso que a
       pesquisadora reportou: «eu vou clicar aqui em continuar de onde eu parei. Aí ele tá me
       levando de novo pra aquele lugar intermediário». Com depósito, a porta salta pelo ramo do
       «continuar» — e o que se mede é que ela entra na condução, e não na abertura. */
    await abrir('/area-do-professor/anamnese/', 1280);
    await p.evaluate(() => {
      /* UMA RESPOSTA DA PESSOA, e não um depósito qualquer: «há o que continuar» é uma resposta
         que ela deu à mão. As sugestões da semeadura viajam em `sugeridas` e não contam — é o que
         impede o botão de aparecer a quem só abriu o formulário. */
      localStorage.setItem('porta-anamnese-batata-cafe-no-bule-01-1',
        JSON.stringify({ respondidos: 7, total: 53, quando: '2026-10-25T13:05:00Z',
          indice: 2, respostas: [['idade', '32']], notas: [], sugeridas: [] }));
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

  console.log('\n12 · O «CONTINUAR» NÃO PEDE A SENHA — ela é de GRAVAR, não de entrar');
  {
    /* O CASO QUE A PESQUISADORA REPORTOU, e que a secção 11 não apanhava porque lá se digitava a
       senha: «o continuar de onde parei não tá resolvido». Com depósito e SEM senha, o botão está
       à vista e habilitado (só o «Nova» é que fecha sem senha) — e o clique não aterrava em lado
       nenhum: a porta arrancava sem bilhete, `podePreencher()` dava falso e devolvia à lista. O
       vaivém é indistinguível de «o botão não faz nada».

       A regra que se prova aqui é a que o pedido enuncia: a senha é pré-requisito de GRAVAÇÃO.
       Quem tem um preenchimento interrompido entra e continua a responder; a senha é pedida onde
       ela serve — no «Guardar». E o campo da senha aparece, porque é por ele que se grava. */
    /* A REGRA DA PESQUISADORA, primeiro: «só vai aparecer o continuar de onde parei… se de fato
       existir o que continuar. Se não tiver nada, não tem por quê». Um depósito com SÓ sugestões
       — o que a semeadura deixa atrás de si a quem apenas abriu o formulário — não é trabalho
       nenhum, e não pode produzir «continuar». */
    await p.evaluate(() => {
      localStorage.setItem('porta-anamnese-batata-cafe-no-bule-01-1',
        JSON.stringify({ respondidos: 3, total: 53, quando: '2026-10-26T09:00:00Z',
          indice: 0, respostas: [['idade', '30'], ['formacao', 'ballet']],
          notas: [], sugeridas: ['idade', 'formacao'] }));
    });
    await abrir('/area-do-professor/anamnese/', 1280, { limpar: false });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 600)));
    const soSugestoes = await p.evaluate(() => {
      const c = document.querySelector('[data-acao="continuar"]');
      const n = document.querySelector('[data-acao="nova"]');
      const vis = (e) => !!e && !e.hidden && e.getClientRects().length > 0;
      return { continuar: vis(c), nova: vis(n) };
    });
    ok('depósito com só sugestões NÃO produz «continuar»', soSugestoes.continuar === false, soSugestoes);
    ok('…e o «fazer anamnese» está lá, que é o que há a fazer', soSugestoes.nova === true, soSugestoes);

    /* E AGORA COM UMA RESPOSTA DA PESSOA, e SEM senha. */
    await p.evaluate(() => {
      localStorage.setItem('porta-anamnese-batata-cafe-no-bule-01-1',
        JSON.stringify({ respondidos: 7, total: 53, quando: '2026-10-26T09:05:00Z',
          indice: 2, respostas: [['idade', '32']], notas: [], sugeridas: [] }));
    });
    await abrir('/area-do-professor/anamnese/', 1280, { limpar: false });

    const antes = await p.evaluate(() => {
      const b = document.querySelector('[data-acao="continuar"]');
      const senha = document.getElementById('ato-senha');
      return { botao: !!b && b.getClientRects().length > 0,
        desabilitado: !!(b && b.disabled),
        senhaVazia: !senha || senha.value === '' };
    });
    ok('sem senha, «continuar» está à vista e habilitado', antes.botao && !antes.desabilitado, antes);
    ok('…e a senha está de facto por preencher', antes.senhaVazia === true, antes);

    const destinoSemSenha = await Promise.all([
      p.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => null),
      p.evaluate(() => document.querySelector('[data-acao="continuar"]').click()),
    ]).then(() => p.url());
    ok('o clique navega — não fica na lista',
      /\/anamnese\//.test(destinoSemSenha || '') && !/area-do-professor/.test(destinoSemSenha || ''),
      destinoSemSenha);
    ok('…e o endereço não leva senha nenhuma', !/senha=/.test(destinoSemSenha || ''), destinoSemSenha);

    await p.evaluate(() => new Promise((r) => setTimeout(r, 900)));
    const aterrou = await p.evaluate(() => {
      const visivel = (e) => !!e && !e.classList.contains('oculto') && e.getClientRects().length > 0;
      /* NA PORTA o campo chama-se `senha` (é o `<input id="senha">` do formulário). O
         `ato-senha` é o do painel, que fica na lista. */
      const senha = document.getElementById('senha');
      return { url: location.pathname,
        conducao: visivel(document.getElementById('conducao')),
        abertura: !!document.getElementById('abertura'),
        /* O campo da senha FICA à vista: sem bilhete, a gravação continua a exigi-la. É o
           contrário de um furo — é onde a senha tem de estar. */
        senha: visivel(senha) };
    });
    ok('…e aterra no FORMULÁRIO, com a condução à vista',
      aterrou.conducao && !aterrou.abertura, aterrou);
    ok('a porta não devolveu à lista', !/area-do-professor/.test(aterrou.url || ''), aterrou.url);
    ok('…e a senha é pedida onde grava: no campo, não à entrada', aterrou.senha === true, aterrou);

    /* O DEPÓSITO É LIDO ANTES DA SEMEADURA, e isto é o que prova que sim.
     *
     * A semeadura do contexto e da curadoria escreve em RESPOSTAS e chama `salvar()` — se ela
     * corresse antes da leitura, o depósito do professor era substituído pela sugestão, e o que
     * ele tinha respondido à mão desaparecia. O sinal, aqui, é o mais direto que há: a resposta
     * dele continua no `localStorage` depois de a página arrancar. */
    const sobreviveu = await p.evaluate(() => {
      try {
        const d = JSON.parse(localStorage.getItem('porta-anamnese-batata-cafe-no-bule-01-1') || 'null');
        return d && Array.isArray(d.respostas)
          ? d.respostas.some((par) => Array.isArray(par) && par[0] === 'idade') : false;
      } catch (e) { return false; }
    });
    ok('…e a resposta que já estava guardada não foi apagada pela semeadura', sobreviveu === true);
  }

  console.log('\n13 · O CAMINHO NA BARRA, O «AJUSTAR» E O «SAIR» QUE SAI');
  {
    /* O QUE A PESQUISADORA VIU. «Quando eu clico em editar, eu não tenho mais nada escrito em
       cima ali, do lado da logomarca, dizendo onde é que eu tô.» A porta não tem `<h1>`, e é do
       `<h1>` que a barra tira o caminho nas outras páginas — a página intermediária levou o
       cabeçalho consigo, e levou o caminho. O que se prova aqui é que a porta o escreve, e que o
       ÚLTIMO DEGRAU diz o que se está a FAZER: fazer, editar, ajustar.

       E O «SAIR» QUE NÃO SAÍA: «ele vai pra uma página e volta». Ele ia para o PO — fóssil da
       época em que o PO era a casa do plano —, e do PO para o PO. O destino passou a ser a lista
       da própria fonte, e é isso que se mede nas três. */
    const caminho = () => p.evaluate(() => {
      const d = document.querySelector('.topnav .doc-atual');
      if (!d) return null;
      const el = (sel) => d.querySelector(sel);
      return { grupo: el('small') ? el('small').textContent : '',
        lista: el('a') ? el('a').textContent : '',
        volta: el('a') ? el('a').getAttribute('href') : '',
        agora: el('b') ? el('b').textContent : '' };
    });
    const ctx = '?professor=cafe-no-bule&ciclo=01&aluna=Aluna+A';

    await abrir('/anamnese/' + ctx + '&abrir=1', 1280);
    const criar = await caminho();
    ok('a anamnese nova diz «Fazer anamnese» na barra', criar && criar.agora === 'Fazer anamnese', criar);
    ok('…e o degrau do meio é a lista de onde se veio, clicável',
      criar && criar.lista === 'Anamnese do aluno'
      && criar.volta === '/area-do-professor/anamnese/', criar);
    ok('…e o grupo é a Área do Professor', criar && criar.grupo === 'Área do Professor', criar);

    await abrir('/anamnese/' + ctx + '&editar=anamnese-20261020', 1280);
    const editar = await caminho();
    ok('editar a anamnese diz «Editar a anamnese»',
      editar && editar.agora === 'Editar a anamnese', editar);

    await abrir('/anamnese/' + ctx + '&ajustar=anamnese-20261020', 1280);
    const ajustar = await caminho();
    ok('ajustar a anamnese diz «Ajustar a anamnese»',
      ajustar && ajustar.agora === 'Ajustar a anamnese', ajustar);
    /* O CARIMBO LEVADO A SÉRIO: ajustar abre o REGISTO, e não um formulário vazio com contexto. */
    const carregado = await p.evaluate(() => {
      const visivel = (el) => !!el && !el.classList.contains('oculto') && el.getClientRects().length > 0;
      return { conducao: visivel(document.getElementById('conducao')),
        nRespostas: typeof RESPOSTAS !== 'undefined' ? RESPOSTAS.size : -1 };
    });
    ok('…e o registo vem carregado para a condução',
      carregado.conducao && carregado.nRespostas > 0, carregado);

    await abrir('/plano-ensino/?fonte=plano&professor=cafe-no-bule&ciclo=01&ajustar=plano-20261022', 1280);
    const noPlano = await p.evaluate(() => {
      const t = document.getElementById('ctx-turma');
      return { agora: (document.querySelector('.doc-atual b') || {}).textContent || '',
        turma: t ? t.value : 'sem campo' };
    });
    ok('o plano de ensino ajustado diz «Ajustar o plano de ensino»',
      noPlano.agora === 'Ajustar o plano de ensino', noPlano);
    /* A TURMA DO REGISTO, E NÃO A PRIMEIRA LIVRE. «Ele tá em escolher e é um campo bloqueado» era
       o select desenhado ANTES de o envelope ser lido — com a sugestão da curadoria, que é a
       primeira turma atribuída. O campo passou a ser redesenhado depois do registo. */
    ok('…e a turma do cabeçalho é a do registo, e não uma sugestão',
      noPlano.turma === 'Balé Nível 2', noPlano);

    /* NO TELEMONE FICA O VERBO, E SÓ ELE. Medido a 390 e a 320 com os três degraus, o caminho
       era cortado com reticências e o que se perdia era o FIM — «Área do Professor · Anamnese do
       al…». O degrau que the resta é o único que não tem substituto: o grupo e a lista são o
       caminho de volta, e no telefone a folha do ☰ já o é. */
    await abrir('/anamnese/' + ctx + '&ajustar=anamnese-20261020', 390);
    const noTelefone = await caminho();
    ok('no telemóvel o caminho é só o que se está a fazer',
      noTelefone && noTelefone.agora === 'Ajustar a anamnese'
      && noTelefone.lista === '' && noTelefone.grupo === '', noTelefone);
    const larguraDoCaminho = await p.evaluate(() => {
      const d = document.querySelector('.doc-atual');
      return { cortado: d.scrollWidth > d.clientWidth + 1,
        sobra: document.documentElement.scrollWidth - window.innerWidth };
    });
    ok('…e cabe inteiro, sem cortar nem esticar a página',
      larguraDoCaminho.cortado === false && larguraDoCaminho.sobra === 0, larguraDoCaminho);

    /* O «SAIR» — nas três fontes, e sempre para a lista da própria família. */
    /* COM `ajustar=`, e não com `abrir=1`: o `abrir` sozinho não autoriza nada, e a porta
       devolveria à lista antes de haver um «Sair» para clicar. O `ajustar` carrega o registo, e o
       registo é o que dispensa a senha. */
    for (const [fonte, caminhoDaLista] of [
      ['/anamnese/?professor=cafe-no-bule&ciclo=01&aluna=Aluna+A&ajustar=anamnese-20261020',
        '/area-do-professor/anamnese/'],
      ['/plano-ensino/?fonte=plano&professor=cafe-no-bule&ciclo=01&ajustar=plano-20261022',
        '/area-do-professor/plano-de-ensino/'],
      ['/plano-observacao/?fonte=po&professor=cafe-no-bule&ciclo=01&ajustar=po-20261023&plano=plano-20261022',
        '/area-do-professor/plano-de-observacao/'],
    ]) {
      await abrir(fonte, 1280);
      const saiu = await Promise.all([
        p.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => null),
        p.evaluate(() => document.getElementById('sair').click()),
      ]).then(() => p.url());
      ok('«Sair» de ' + caminhoDaLista + ' leva à própria lista',
        String(saiu || '').indexOf(caminhoDaLista) !== -1, saiu);
    }
  }

  console.log('\n14 · NO TELEMÓVEL, O PREENCHIMENTO INTERROMPIDO ABRE O BLOCO');
  {
    /* O PEDIDO, textual: «no modo celular, o fazer anamnese, que tem o botão continuar de onde
       parei, ele precisa estar expandido e não colapsado. Aí o próprio usuário escolhe se ele
       quer colapsar ou não. Mas enquanto tiver os dados preenchidos para continuar depois, ele
       vai abrir expandido sempre. Se tiver vazio, aí ele vai estar colapsado, mantém a regra que
       a gente tem agora.»
       Três coisas a medir, e cada uma é uma regra: vazio não abre; com depósito abre; e quem o
       fecha não o vê reabrir por baixo. */
    const bloco = () => p.evaluate(() => {
      const bl = document.getElementById('bloco-ato');
      const v = (e) => !!e && !e.hidden && e.getClientRects().length > 0;
      const cont = document.querySelector('[data-acao="continuar"]');
      return { aberto: bl ? bl.open : null, escondido: bl ? bl.hidden : null,
        visivel: v(bl), continuar: v(cont) };
    });
    const semear = (comDeposito) => p.evaluate((com) => {
      localStorage.clear();
      if (!com) return;
      localStorage.setItem('ato-batata-anamnese-1',
        JSON.stringify({ professor: 'cafe-no-bule', ciclo: '01', aluna: 'Aluna A' }));
      localStorage.setItem('porta-anamnese-batata-cafe-no-bule-01-1',
        JSON.stringify({ respondidos: 7, total: 53, quando: '2026-10-25T13:05:00Z', indice: 2,
          respostas: [['idade', '32']], notas: [], sugeridas: [] }));
    }, comDeposito);

    await abrir('/area-do-professor/anamnese/', 390);
    await semear(false);
    await p.reload({ waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1200));
    const vazio = await bloco();
    ok('telemóvel, sem depósito: o bloco não existe à vista — a regra de antes',
      vazio.escondido === true && vazio.visivel === false, vazio);

    await semear(true);
    await p.reload({ waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1200));
    const comDep = await bloco();
    ok('telemóvel, com depósito: o bloco abre EXPANDIDO, sem passar pelo menu',
      comDep.aberto === true && comDep.visivel === true, comDep);
    ok('…e é ali que está o «Continuar de onde parei»', comDep.continuar === true, comDep);

    /* COLAPSAR É A ESCOLHA DE QUEM FECHOU, e ela vale. */
    await p.evaluate(() => { const bl = document.getElementById('bloco-ato'); if (bl) bl.open = false; });
    await new Promise((r) => setTimeout(r, 500));
    const fechado = await bloco();
    ok('fechá-lo esconde-o, e o menu volta a ser a porta',
      fechado.aberto === false && fechado.visivel === false, fechado);
    /* E NÃO REABRE POR BAIXO: mudar o contexto redesenha o painel, e um painel que se reabrisse
       sozinho a cada mudança seria a página a lutar contra quem a está a usar. */
    await p.evaluate(() => {
      const c = document.getElementById('ato-ciclo');
      if (c) { c.value = '02'; c.dispatchEvent(new Event('input')); }
    });
    await new Promise((r) => setTimeout(r, 700));
    const depois = await bloco();
    ok('…e mudar o contexto não o reabre por baixo', depois.visivel === false, depois);

    /* NO COMPUTADOR NADA DISTO ACONTECE: os dois blocos ficam à vista e FECHADOS, com ou sem
       depósito. É a regra do §9, e ela não pode ser estragada por esta. */
    await abrir('/area-do-professor/anamnese/', 1280, { limpar: false });
    await new Promise((r) => setTimeout(r, 800));
    const noPc = await bloco();
    ok('computador: com depósito, o bloco fica à vista e FECHADO',
      noPc.escondido === false && noPc.aberto === false && noPc.visivel === true, noPc);
  }

  console.log('\n15 · O SUBMENU «BASTIDORES» CABE NA JANELA');
  {
    /* O PEDIDO: «Quando ele expande, ele tá sendo engolido pela parte direita da página… aparece
       escrito "Estúdio de Dan" e aí embaixo aparece "Produção". Não pode ser engolido pela margem
       direita.»
       E era: o submenu abria a partir da ESQUERDA do menu (`left: 0`) com 300px de largura fixa,
       e o menu está na ponta direita da barra. Medido antes da correção, a 1280: o painel ia de
       1165 a 1465 — 185px fora da janela. Como a barra é `position: fixed`, o que transborda não
       gera rolagem: é cortado. Daí o «Estúdio de Dan…».
       O que se mede aqui é a GEOMETRIA, em quatro larguras, nas duas páginas que importam: a
       lista (a barra da escola) e a porta (o formulário, servido noutro caminho). */
    const abrirOBastidores = () => p.evaluate(() => {
      const soma = [...document.querySelectorAll('.nav-links details.menu > summary')]
        .find((x) => /Bastidores/.test(x.textContent));
      if (!soma) return null;
      soma.click();
      const det = soma.parentElement;
      const sub = det.querySelector('.submenu');
      const r = sub.getBoundingClientRect();
      const itens = [...sub.querySelectorAll('a')].map((a) => {
        const x = a.getBoundingClientRect();
        return { texto: a.textContent.trim(), esquerda: Math.round(x.left),
          direita: Math.round(x.right), cortado: a.scrollWidth > a.clientWidth + 1 };
      });
      return { esquerda: Math.round(r.left), direita: Math.round(r.right),
        largura: Math.round(r.width), janela: window.innerWidth,
        fora: Math.round(Math.max(0, r.right - window.innerWidth)),
        foraEsquerda: Math.round(Math.max(0, -r.left)),
        itens };
    });
    for (const largura of [1440, 1280, 1150]) {
      /* A PORTA COM `ajustar=`: sem ele a trava devolve à lista, e a navegação a meio da medição
         destruía o contexto de execução. O que se quer medir é a barra da PORTA — e a porta, para
         ficar de pé, precisa de um registo. */
      for (const caminho of ['/area-do-professor/anamnese/',
        '/anamnese/?ajustar=anamnese-20261020&professor=cafe-no-bule&ciclo=01&aluna=Aluna+A']) {
        await abrir(caminho, largura);
        await new Promise((r) => setTimeout(r, 300));
        const m = await abrirOBastidores();
        ok('a ' + largura + ', em ' + caminho.split('?')[0] + ': o submenu cabe na janela',
          !!m && m.fora === 0 && m.foraEsquerda === 0, m && { fora: m.fora, caixa: m.esquerda + '..' + m.direita, janela: m.janela });
        /* E O TEXTO INTEIRO — era isto que se perdia: «Estúdio de Dan» sem o «ça». */
        ok('…e os dois destinos aparecem por inteiro',
          !!m && m.itens.length === 2 && m.itens.every((i) => !i.cortado)
          && m.itens[0].texto === 'Estúdio de Dança' && m.itens[1].texto === 'Produção',
          m && m.itens);
      }
    }
  }

  console.log('\n16 · UMA SÓ IDENTIDADE: AS TRÊS FOLHAS, AS DUAS PÍLULAS, E A COLUNA DOS BASTIDORES');
  {
    /* O PEDIDO, em três frases da mesma leitura:
       · «quando eu abro o menu… ela não é a mesma identidade visual de quando eu expando, por
         exemplo, sessões»;
       · «o botão de ações… tem ainda uma terceira identidade visual, que não pode»;
       · «em bastidores, em produção, o menu lateral tem outra identidade visual e outro
         comportamento… precisa ter o mesmo comportamento da página principal».
       O QUE SE MEDE AQUI não é «está bonito»: é IGUALDADE. As três folhas têm de devolver os
       mesmos valores para fundo, canto, sombra e pegador; as duas pílulas, os mesmos para borda,
       canto, fundo, cor, medida e corpo; e a coluna dos Bastidores tem de abrir e empurrar como
       a do sistema. Uma peça é uma coisa só, e a prova disso é o número. */
    const vestes = (sel, props) => p.evaluate((s, ps) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const o = {};
      for (const k of ps) o[k] = cs.getPropertyValue(k);
      return o;
    }, sel, props);

    const FOLHA = ['background-color', 'border-top-left-radius', 'border-top-right-radius',
      'box-shadow', 'padding-bottom'];
    const PEGADOR = ['display', 'width', 'height', 'background-color', 'border-radius'];

    // 1) a folha do ☰
    await abrir('/area-do-professor/anamnese/', 390);
    await p.evaluate(() => document.querySelector('.topnav .hamburger').click());
    await new Promise((r) => setTimeout(r, 400));
    const daNavegacao = { folha: await vestes('.coluna', FOLHA), puxador: await vestes('.coluna .folha-puxador', PEGADOR) };

    // 2) a folha do «Ações»
    await p.evaluate(() => { const c = document.querySelector('.coluna'); if (c) c.setAttribute('data-aberta', 'nao'); });
    await new Promise((r) => setTimeout(r, 300));
    await p.evaluate(() => document.getElementById('botao-acoes').click());
    await new Promise((r) => setTimeout(r, 400));
    const doAcoes = { folha: await vestes('#menu-de-acoes', FOLHA), puxador: await vestes('#menu-de-acoes .folha-puxador', PEGADOR) };
    const pilulaAcoes = await vestes('#botao-acoes',
      ['border-top-color', 'border-top-width', 'border-top-left-radius', 'background-color',
        'color', 'padding-top', 'padding-left', 'font-size', 'font-weight']);

    // 3) a folha do «Seções» (Produção) e a sua pílula
    await abrir('/bastidores/producao', 390);
    await p.evaluate(() => { const b = document.getElementById('lateral-abrir'); if (b) b.click(); });
    await new Promise((r) => setTimeout(r, 450));
    const doSecoes = { folha: await vestes('#lateral-lista', FOLHA), puxador: await vestes('#lateral-lista .folha-puxador', PEGADOR) };
    const pilulaSecoes = await vestes('#lateral-abrir',
      ['border-top-color', 'border-top-width', 'border-top-left-radius', 'background-color',
        'color', 'padding-top', 'padding-left', 'font-size', 'font-weight']);

    ok('as três folhas têm o mesmo fundo, canto, sombra e medida',
      !!daNavegacao.folha && JSON.stringify(daNavegacao.folha) === JSON.stringify(doAcoes.folha)
      && JSON.stringify(doAcoes.folha) === JSON.stringify(doSecoes.folha),
      { navegacao: daNavegacao.folha, acoes: doAcoes.folha, secoes: doSecoes.folha });
    ok('…e o mesmo pegador — a linha que diz «isto desliza»',
      !!daNavegacao.puxador && daNavegacao.puxador.display === 'block'
      && JSON.stringify(daNavegacao.puxador) === JSON.stringify(doAcoes.puxador)
      && JSON.stringify(doAcoes.puxador) === JSON.stringify(doSecoes.puxador),
      { navegacao: daNavegacao.puxador, acoes: doAcoes.puxador, secoes: doSecoes.puxador });
    ok('as duas pílulas são a mesma — o «Ações» adotou a do «Seções»',
      !!pilulaAcoes && JSON.stringify(pilulaAcoes) === JSON.stringify(pilulaSecoes),
      { acoes: pilulaAcoes, secoes: pilulaSecoes });
    ok('…e é secundária: vazada, não cheia',
      !!pilulaAcoes && pilulaAcoes['background-color'] !== pilulaAcoes['border-top-color'],
      pilulaAcoes && { fundo: pilulaAcoes['background-color'], borda: pilulaAcoes['border-top-color'] });

    /* A DISTÂNCIA ATÉ AO BLOCO. «Está completamente colado no contexto do ato… tá tocando as
       bordas.» Medido antes: 1px. */
    await abrir('/area-do-professor/anamnese/', 390);
    await p.evaluate(() => {
      document.getElementById('botao-acoes').click();
      const it = document.querySelector('[data-abrir="ato"]');
      if (it) it.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    const folga = await p.evaluate(() => {
      const b = document.getElementById('botao-acoes');
      const bl = document.getElementById('bloco-ato');
      return (b && bl) ? Math.round(bl.getBoundingClientRect().top - b.getBoundingClientRect().bottom) : null;
    });
    ok('…e o botão não toca no bloco que abre (há folga, não 1px)', folga !== null && folga >= 12, folga);

    /* A COLUNA DOS BASTIDORES — o mesmo comportamento da do sistema, no computador. */
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(base + '/bastidores/producao', { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 900));
    const lateral = await p.evaluate(() => {
      const l = document.querySelector('.lateral');
      if (!l) return null;
      const cs = getComputedStyle(l);
      const grupos = [...l.querySelectorAll('.coluna-grupo')];
      const antes = grupos.map((g) => Math.round(g.getBoundingClientRect().height));
      const topsAntes = grupos.map((g) => Math.round(g.getBoundingClientRect().top));
      grupos[1].querySelector('.coluna-titulo').click();
      return new Promise((r) => setTimeout(() => {
        const depois = grupos.map((g) => Math.round(g.getBoundingClientRect().height));
        const topsDepois = grupos.map((g) => Math.round(g.getBoundingClientRect().top));
        grupos[2].querySelector('.coluna-titulo').click();
        setTimeout(() => r({
          fundo: cs.backgroundColor, borda: cs.borderRightWidth,
          titulos: grupos.length,
          itensRecolhidos: getComputedStyle(l.querySelector('.coluna-itens')).maxHeight,
          setaVisivel: getComputedStyle(l.querySelector('.coluna-seta')).display,
          antes, depois, topsAntes, topsDepois,
          exclusivo: grupos.map((g) => g.getAttribute('data-aberto')),
          transbordo: document.documentElement.scrollWidth - window.innerWidth,
        }), 400);
      }, 400));
    });
    ok('a coluna dos Bastidores é a mesma coluna: fundo bordô e filete de ouro',
      !!lateral && lateral.fundo === 'rgb(107, 31, 46)' && lateral.borda === '3px',
      lateral && { fundo: lateral.fundo, borda: lateral.borda });
    ok('…com os quatro grupos da Produção, recolhidos, e a seta à vista',
      !!lateral && lateral.titulos === 4 && lateral.itensRecolhidos === '0px'
      && lateral.setaVisivel === 'block', lateral && { grupos: lateral.titulos, itens: lateral.itensRecolhidos });
    ok('…e o acordeão abre, cresce e EMPURRA os de baixo',
      !!lateral && lateral.depois[1] > lateral.antes[1]
      && lateral.topsDepois[2] > lateral.topsAntes[2],
      lateral && { antes: lateral.antes[1], depois: lateral.depois[1], topoAntes: lateral.topsAntes[2], topoDepois: lateral.topsDepois[2] });
    ok('…um de cada vez, como na coluna do sistema',
      !!lateral && lateral.exclusivo[1] === 'nao' && lateral.exclusivo[2] === 'sim', lateral && lateral.exclusivo);
    ok('…e nada estoura na horizontal', !!lateral && lateral.transbordo === 0, lateral && lateral.transbordo);

    /* O GRUPO DA PÁGINA ACTUAL ACENDE-SE, como na coluna do sistema. Sem isto, o menu dos
       Bastidores era o mesmo desenho mas não dizia «estás neste grupo» — metade do que um menu de
       secções tem de dizer. */
    const grupoAtual = await p.evaluate(() => {
      location.hash = '#turmas';
      return new Promise((r) => setTimeout(() => r({
        grupos: [...document.querySelectorAll('.lateral .coluna-grupo')]
          .map((g) => g.getAttribute('data-atual')),
        barra: (document.getElementById('lateral-grupo') || {}).textContent,
        nome: (document.getElementById('lateral-nome') || {}).textContent,
      }), 400));
    });
    ok('a coluna dos Bastidores acende o grupo da secção, e a barra diz onde se está',
      grupoAtual.grupos.filter((x) => x === 'sim').length === 1
      && grupoAtual.barra === 'Pedagogia' && grupoAtual.nome === 'Turmas', grupoAtual);
  }

  /* ── 17. A MARCA DE «ONDE ESTOU» NÃO SE PERDE AO APROFUNDAR ────────────────────────────
   *
   * «Quando eu estou em ciclos, vou em planos, abro o plano — precisa manter no menu marcado
   * que eu estou em planos… isso tem que acontecer também no modo celular. Isso tem que ser
   * uma norma.»
   *
   * O DEFEITO, e a razão de ele ser invisível nas provas anteriores: o item do menu marca-se
   * pelo CAMINHO (`ehAtivo`), e o caminho de um documento do pacote (`/balé-nível-2/plano`) não
   * tem nada do menu (`/ciclos/planos/`). Comparava-se o que não era comparável, e o resultado
   * era o menu a apagar a marca exactamente quando se estava mais fundo — a criar, a editar, a
   * ajustar. A norma daqui em diante: **o documento acende a lista de onde veio**, e a conta é
   * a MESMA tabela que o caminho da barra já lia (`TRILHA_DO_DOCUMENTO`).
   *
   * MEDE-SE O QUE SE VÊ, e nos dois desenhos, que são diferentes de propósito:
   *   · no COMPUTADOR (>1140) a coluna é compacta e os grupos nascem fechados — a marca do
   *     grupo é a cor e o filete de ouro no TÍTULO, e o item aceso está lá dentro, escondido;
   *   · no TELEMONE (≤1140) a folha mostra tudo à vista (não há acordeão dentro de uma folha),
   *     e o item aceso vê-se com o fundo da marca e o ✓.
   */
  console.log('\n17 · O documento acende a lista de onde veio, no computador e no telemóvel');
  const DOCUMENTOS = [
    ['/bale-nivel-2-teste-2/plano.html', '/ciclos/planos/', 'Ciclos'],
    /* AS REFERÊNCIAS ACENDEM «PLANOS» (26/10/2026): o item e a listagem «Referências» saíram do
       menu, e o único caminho até ao documento é o plano do ciclo. */
    ['/bale-nivel-2-teste-2/referencias.html', '/ciclos/planos/', 'Ciclos'],
    ['/bale-nivel-2-teste-2/aula-01.html', '/aulas/', 'Área do Professor'],
    ['/bale-nivel-2-teste-2/lancamento.html', '/aulas/', 'Área do Professor'],
    ['/bale-nivel-2-teste-2/notacao.html', '/area-do-professor/notacao/', 'Área do Professor'],
    ['/bale-nivel-2-teste-2/glossario-benesh.html', '/consulta/', 'Consulta'],
  ];
  const marcaDaColuna = () => p.evaluate(() => {
    const c = document.querySelector('.coluna');
    if (!c) return null;
    const aceso = c.querySelector('.coluna-itens a[aria-current="page"]');
    const direto = c.querySelector('a.coluna-direto.ativo');
    const grupos = [...c.querySelectorAll('.coluna-grupo')];
    const atual = grupos.find((g) => g.getAttribute('data-atual') === 'sim');
    const outro = grupos.find((g) => g !== atual);
    const titulo = atual && atual.querySelector('.coluna-titulo');
    const cs = titulo ? getComputedStyle(titulo) : null;
    const csOutro = (outro && outro.querySelector('.coluna-titulo'))
      ? getComputedStyle(outro.querySelector('.coluna-titulo')) : null;
    return {
      acesos: [...c.querySelectorAll('a[aria-current="page"]')].map((a) => a.getAttribute('href')),
      direto: direto ? direto.getAttribute('href') : null,
      diretoFundo: direto ? getComputedStyle(direto).backgroundColor : null,
      diretoDeOutro: (() => {
        const o = [...c.querySelectorAll('a.coluna-direto')].find((a) => a !== direto);
        return o ? getComputedStyle(o).backgroundColor : null;
      })(),
      /* O RÓTULO É O PRIMEIRO `<span>` DO BOTÃO. O `textContent` do botão inteiro inclui a SETA
         (`›`), que é um segundo `<span>` e é desenho, não nome: lida assim, a asserção do grupo
         comparava «Ciclos›» com «Ciclos» e reprovava uma coluna que estava certa. */
      grupo: (titulo && titulo.querySelector('span')) ? titulo.querySelector('span').textContent.trim() : '',
      tituloVisivel: !!titulo && titulo.getClientRects().length > 0,
      corDoAtual: cs ? cs.color : null,
      corDeOutro: csOutro ? csOutro.color : null,
      filete: cs ? cs.boxShadow : null,
      gruposMarcados: grupos.filter((g) => g.getAttribute('data-atual') === 'sim').length,
    };
  });

  for (const [documento, lista, grupo] of DOCUMENTOS) {
    await abrir(documento, 1280);
    const m = await marcaDaColuna();
    const nome = documento.replace('/bale-nivel-2-teste-2/', '');
    if (!m) { ok(nome + ': a coluna existe no computador', false, null); continue; }
    /* «Consulta» é um destino DIRECTO (`tipo: link`): não há grupo-acordeão para acender. A
       marca é a do próprio link, e o contraste com o link que NÃO está aceso é o que prova que
       ela é pintada — não a existência da classe. */
    if (grupo === 'Consulta') {
      ok(nome + ': o link directo «Consulta» fica aceso',
        m.direto === lista, { direto: m.direto, esperado: lista });
      ok(nome + ': …e pintado, e não só com a classe',
        !!m.diretoFundo && m.diretoFundo !== m.diretoDeOutro,
        { aceso: m.diretoFundo, apagado: m.diretoDeOutro });
    } else {
      ok(nome + ': o item da lista «' + lista + '» fica aceso no computador',
        m.acesos.length === 1 && m.acesos[0] === lista, m.acesos);
      ok(nome + ': …e um só grupo aceso, «' + grupo + '»',
        m.gruposMarcados === 1 && m.grupo === grupo, { grupo: m.grupo, marcados: m.gruposMarcados });
      ok(nome + ': …com o título À VISTA, mesmo com o grupo fechado',
        m.tituloVisivel === true, m.tituloVisivel);
      ok(nome + ': …e distinguido pela cor, não só pelo atributo',
        !!m.corDoAtual && m.corDoAtual !== m.corDeOutro && /inset/.test(String(m.filete)),
        { atual: m.corDoAtual, outro: m.corDeOutro, filete: m.filete });
    }
  }
  /* A CONTRAPROVA: um documento que não sai de lista nenhuma não inventa marca. Sem esta linha,
     «acender sempre» passaria por boa regra.
     O documento é a APRESENTAÇÃO (`/sistema.html`), e não a harmonização: a bancada serve o
     `publicacao/batata` que existe em disco, e o pacote dele não tem `harmonizacao.html` (quem a
     gera é a montagem da prova da barra). A apresentação serve o mesmo propósito e é real — ela
     está no sistema e não é destino de menu nenhum, como a secção D da `provar-barra-unica`
     também fixa. */
  await abrir('/sistema.html', 1280);
  const semLista = await marcaDaColuna();
  ok('um documento que não vem de lista nenhuma não inventa marca',
    !!semLista && semLista.acesos.length === 0 && semLista.gruposMarcados === 0
    && !semLista.direto, semLista && { acesos: semLista.acesos, grupos: semLista.gruposMarcados });

  /* NO TELEMONE. A folha não tem acordeão: abrir o ☰ mostra os itens todos, e o aceso é o que
     tem o fundo da marca. É a mesma marca do computador no mesmo HTML — o que muda é a largura. */
  /* AS REFERÊNCIAS ENTRAM AQUI (26/10/2026): elas são o caso novo — documento de «Planos», sem
     item próprio no menu —, e é no telemóvel que a marca e o caminho têm menos espaço. */
  for (const [documento, lista, grupo] of [DOCUMENTOS[0], DOCUMENTOS[1], DOCUMENTOS[5]]) {
    await abrir(documento, 390);
    await p.evaluate(() => document.querySelector('.topnav .hamburger').click());
    await p.evaluate(() => new Promise((r) => setTimeout(r, 450)));
    const naFolha = await p.evaluate(() => {
      const c = document.querySelector('.coluna');
      if (!c) return null;
      const aceso = c.querySelector('a[aria-current="page"]') || c.querySelector('a.coluna-direto.ativo');
      const outro = [...c.querySelectorAll('.coluna-itens a, a.coluna-direto')].find((a) => a !== aceso);
      const grupoMarcado = c.querySelector('.coluna-grupo[data-atual="sim"] .coluna-titulo');
      const r = aceso ? aceso.getBoundingClientRect() : null;
      return {
        folhaAberta: c.getAttribute('data-aberta'),
        href: aceso ? aceso.getAttribute('href') : null,
        fundo: aceso ? getComputedStyle(aceso).backgroundColor : null,
        fundoDeOutro: outro ? getComputedStyle(outro).backgroundColor : null,
        visivel: !!r && r.height > 0 && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight,
        grupo: (grupoMarcado && grupoMarcado.querySelector('span'))
          ? grupoMarcado.querySelector('span').textContent.trim() : '',
        corDoGrupo: grupoMarcado ? getComputedStyle(grupoMarcado).color : null,
        transbordo: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    const nome = documento.replace('/bale-nivel-2-teste-2/', '');
    ok('no telemóvel, ' + nome + ': a folha abre com o item aceso «' + lista + '» à vista',
      !!naFolha && naFolha.folhaAberta === 'sim' && naFolha.href === lista && naFolha.visivel === true,
      naFolha && { aberta: naFolha.folhaAberta, href: naFolha.href, visivel: naFolha.visivel });
    ok('…pintado com o fundo da marca, e não só com o atributo',
      !!naFolha && !!naFolha.fundo && naFolha.fundo !== naFolha.fundoDeOutro,
      naFolha && { aceso: naFolha.fundo, apagado: naFolha.fundoDeOutro });
    if (grupo !== 'Consulta') {
      ok('…e o grupo «' + grupo + '» diz onde se está pelo título',
        !!naFolha && naFolha.grupo === grupo && !!naFolha.corDoGrupo,
        naFolha && { grupo: naFolha.grupo, cor: naFolha.corDoGrupo });
    }
    ok('…e nada estoura na horizontal', !!naFolha && naFolha.transbordo === 0, naFolha && naFolha.transbordo);

    /* E O CAMINHO DA BARRA CONTINUA A DIZER ONDE SE ESTÁ, NO TELEMÓVEL. A marca do menu é uma
       das duas metades da norma; a outra é o caminho ao lado da logomarca.
       MEDIDO ANTES DA DECISÃO (26/10/2026): com os três degraus, a 390 o caminho era CORTADO em
       «Notação em Benesh» e no glossário, e a 320 em quatro dos seis documentos — e o corte come
       o FIM, que é o nome do documento. A decisão foi a mesma que a porta já tomava: abaixo de
       768 fica só o último degrau. Aqui mede-se que assim é, e que ele cabe. */
    const caminhoNoTelefone = await p.evaluate(() => {
      const d = document.querySelector('.topnav .doc-atual');
      if (!d) return null;
      const aVista = (el) => !!el && getComputedStyle(el).display !== 'none';
      const b = d.querySelector('b');
      const h1 = document.querySelector('h1');
      return {
        /* O TEXTO QUE SE VÊ, e não o `textContent`: os dois degraus escondidos continuam no DOM
           (é a mesma marcação para todas as larguras) e o `textContent` lê-os à mesma. */
        texto: [...d.children].filter((el) => el.getClientRects().length > 0)
          .map((el) => el.textContent.replace(/\s+/g, ' ').trim()).join(''),
        esperado: h1 ? h1.textContent.replace(/\s+/g, ' ').split(/\s+[—–]\s+/)[0].trim() : '',
        grupo: aVista(d.querySelector('small')),
        lista: aVista(d.querySelector('a')),
        separador: b ? getComputedStyle(b, '::before').content : '',
        cortado: d.scrollWidth > d.clientWidth + 1,
        sobra: document.documentElement.scrollWidth - window.innerWidth,
        visivel: d.getClientRects().length > 0,
      };
    });
    ok('no telemóvel, ' + nome + ': o caminho fica SÓ com o nome do documento',
      !!caminhoNoTelefone && caminhoNoTelefone.visivel === true
      && caminhoNoTelefone.texto === caminhoNoTelefone.esperado
      && caminhoNoTelefone.grupo === false && caminhoNoTelefone.lista === false
      && caminhoNoTelefone.separador === 'none',
      caminhoNoTelefone);
    ok('…e cabe: sem reticências e sem empurrar a barra para fora da tela',
      !!caminhoNoTelefone && caminhoNoTelefone.cortado === false
      && caminhoNoTelefone.sobra === 0, caminhoNoTelefone);
  }

  ok('nenhum erro de JavaScript', erros.length === 0, erros);

  await b.close(); servidor.close();
  console.log('\n' + (falhas ? 'FALHOU — ' + falhas : 'TUDO CERTO'));
  process.exit(falhas ? 1 : 0);
})();
