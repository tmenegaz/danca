#!/usr/bin/env node
'use strict';

/**
 * provar-menu-do-formulario.js — o menu e o cabeçalho, NAS TELAS DE FORMULÁRIO, estão visíveis,
 * contrastados, clicáveis, e o conteúdo rola POR BAIXO deles.
 *
 * O QUE A PESQUISADORA VIU (04/11/2026):
 *
 *   «Nos formulários de criação e edição da Anamnese (incluindo o novo botão de "Novo Registro"),
 *   do Plano de Ensino (ao acessar "Ajustar" ou "Novo") e do Plano de Observação: o menu de
 *   navegação lateral e o cabeçalho aparecem renderizados com uma cor extremamente clara (quase
 *   uma sombra, meio-tom imperceptível acima do background). Além de visivelmente comprometidos,
 *   eles perdem a funcionalidade (cliques não respondem).»
 *
 *   «Ao rolar a página para baixo, o conteúdo do formulário rola por cima do cabeçalho.»
 *
 * PORQUE É QUE NENHUMA BANCADA APANHOU ISTO — e é a parte que importa.
 *
 * As bancadas da porta (`provar-contexto-do-ato`, `provar-faixa-do-ato-no-celular`) servem
 * `porta/index.html` **cru**. Em produção a ponte desenha a barra e a coluna ao servir
 * (`motor/servidor/producao.js` → `motor/nucleo/nav.js`, `aplicar`), e o marcador `<!-- NAV -->`
 * é substituído na geração. Ou seja: **a página medida pelas bancadas não tinha menu nenhum** — e
 * o que não existe não se pode ver esbatido.
 *
 * Esta bancada serve a página a sério, por `producao.fetch`, com o menu da escola viva
 * (`publicacao/breu/nav.json`) e o acervo de um plano e de um PO. É a LISTA da Área do Professor —
 * é lá que estão os botões «Novo», «Ajustar» e «Novo registo», e é dentro dela que o formulário
 * abre (`details#bloco-ato`).
 *
 * O QUE ELE MEDE, e cada um é a definição operacional de um dos três sintomas:
 *
 *   A. VISÍVEL — a barra e a coluna têm opacidade efectiva 1 (nada as esbate) e o texto da barra
 *      passa AA (4,5:1) contra o fundo dela.
 *   B. CLICÁVEL — `elementFromPoint` no centro de um link do menu devolve o link ou um
 *      descendente dele. Se algo o cobre, devolve o que cobre, e é isso que se lê no detalhe.
 *   C. ROLAGEM — com o formulário ABERTO e a página rolada, o topo da janela continua a ser a
 *      barra, e nenhum bloco de conteúdo invade a faixa dela.
 *
 * A ROLAGEM TEM DE ACONTECER, e é asserção: uma página mais curta do que a janela devolve
 * `scrollY: 0`, e as asserções de rolagem passariam sem medir nada. Foi um falso verde da
 * primeira versão desta bancada, e a asserção `a página ROLOU` existe por causa dele.
 *
 * Requer Chrome/Chromium e o `puppeteer-core` do marp-cli global. Sem eles o resultado é
 * declarado NÃO FEITO — nunca um «passou» silencioso.
 *
 *   node experimentos/provar-menu-do-formulario.js
 *   CHROME_PATH=/usr/bin/google-chrome node experimentos/provar-menu-do-formulario.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const navModulo = require(path.join(RAIZ, 'motor/nucleo/nav.js'));
const { mapa } = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const CONTEUDO = JSON.parse(fs.readFileSync(path.join(PORTA, 'po', 'conteudo', 'po.json'), 'utf8'));
const MAPA = mapa(CONTEUDO);
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));

/* O MENU É O DA ESCOLA VIVA. Sem ele a página não tem barra nenhuma — `aplicar()` devolve `null`
 * quando não há `<nav>` —, e a bancada media uma página sem menu: o falso verde que ela existe
 * para não dar. */
const MENU = JSON.parse(fs.readFileSync(path.join(RAIZ, 'publicacao', 'breu', 'nav.json'), 'utf8'));

/* OS DADOS SÃO OS DA ESCOLA VIVA: o plano do ciclo (que dá as dezasseis leituras do formulário) e
 * a turma. Um fixture de duas linhas mede um formulário que não existe. */
const ENVELOPE = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'escola', 'breu', 'envelopes', 'plano-20261104-1732.json'), 'utf8'));
const PLANO = { id: ENVELOPE.id || 'plano-20261104-1732', contexto: ENVELOPE.contexto,
  respostas: ENVELOPE.respostas };
const TURMA = {
  id: 'bale-nivel-1-teste-3',
  nome: (ENVELOPE.respostas['contexto-turma'] || {}).valor || 'Balé Nível 1 — Teste 3',
  dias: ['qua', 'sex'], horaInicio: '16:30', duracao: 45,
  periodoInicio: '2027-03-03', periodoFim: '2027-06-30',
};

const LARGURAS = [1280, 390];

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };

/** A publicação mínima: a folha, o nav.js, o favicon e o menu. A PÁGINA é a da ponte. */
function publicacaoMinima() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'menu-form-'));
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  for (const [de, para] of [
    ['tools/templates/ciclo.css', 'assets/style.css'],
    ['tools/templates/nav.js', 'assets/nav.js'],
    ['tools/templates/marca/favicon.svg', 'assets/favicon.svg'],
  ]) fs.copyFileSync(path.join(RAIZ, de), path.join(dir, para));
  fs.writeFileSync(path.join(dir, 'nav.json'), JSON.stringify(MENU));
  return dir;
}

function kvDeMentira() {
  const dados = new Map();
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list(op) {
      const prefixo = (op && op.prefix) || '';
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefixo))
        .map((name) => ({ name })), list_complete: true };
    },
  };
}

function assetsDe(dir) {
  const procurar = (caminho) => {
    const semPrefixo = String(caminho).replace(/^\/+/, '').replace(/^plano-observacao\//, '');
    for (const [base, rel] of [[dir, semPrefixo], [path.join(RAIZ, 'porta'), semPrefixo]]) {
      const alvo = path.join(base, rel);
      if (fs.existsSync(alvo) && fs.statSync(alvo).isFile()) return alvo;
    }
    return null;
  };
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      const alvo = procurar(url.pathname);
      if (!alvo) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(alvo), { status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream' } });
    },
  };
}

const relatorio = (id) => ({ id, estado: 'prova', contagem: { respondidos: 0, obrigatorios: 0 },
  elos: [], paradas: [], idsDesconhecidos: [], validacao: { resultado: 'aceite', contrato: 'prova' },
  errosDoDocumento: [], linhas: [] });

/** O ambiente da ponte com um plano e um PO no acervo — o formulário precisa dos dois. */
async function ambiente(dir) {
  const env = {
    ESCOLA_SLUG: 'prova', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', SENHA_PROFESSOR: 'p',
    PROFESSOR_NOME: 'Coqui', PADD_KV: kvDeMentira(), ASSETS: assetsDe(dir),
  };
  await env.PADD_KV.put('bastidores/prova/curadorias', JSON.stringify([
    { id: 'c1', professor: 'coqui-de-redinha', modalidade: 'balé', turma: TURMA.nome,
      turmas: [TURMA.nome], alunas: ['Aluna A'] },
  ]));
  const armazenamento = producao.__armazenamento(env);
  const resp = (v) => ({ valor: v });
  const docs = [
    { id: PLANO.id, contexto: PLANO.contexto, respostas: PLANO.respostas, ajuste_de: null,
      gerado_em: '2026-11-04T17:32' },
    { id: 'po-20261104', contexto: { escola: 'prova', professor: 'coqui-de-redinha', ciclo: '01',
      aluna: 'Aluna A' }, ajuste_de: null, gerado_em: '2026-11-04T18:11',
      respostas: { sujeitos: resp(['Aluna A']), 'plano-de-ensino': resp([PLANO.id]) } },
    { id: 'anamnese-20261103', contexto: { escola: 'prova', professor: 'coqui-de-redinha',
      aluna: 'Aluna A' }, ajuste_de: null, gerado_em: '2026-11-03T16:26', respostas: {} },
  ];
  for (const d of docs) await porta.gravarEnvelope(armazenamento, d, relatorio(d.id));
  return env;
}

function servir(dir, env) {
  const srv = http.createServer(async (req, res) => {
    const caminho = req.url.split('?')[0];
    if (caminho.startsWith('/assets/') || caminho === '/nav.json') {
      const alvo = path.join(dir, caminho);
      if (!fs.existsSync(alvo)) { res.writeHead(404); res.end('nao'); return; }
      res.writeHead(200, { 'content-type': TIPOS[path.extname(alvo)] || 'application/octet-stream',
        'cache-control': 'no-store' });
      res.end(fs.readFileSync(alvo));
      return;
    }
    const r = await producao.fetch(new Request('https://prova.tmenegaz77.workers.dev' + req.url), env);
    res.writeHead(r.status, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(await r.text());
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1',
    () => ok({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

/**
 * A MEDIÇÃO — dentro da página, e devolve NÚMEROS.
 *
 * A opacidade «efectiva» não é a do próprio elemento: um véu por cima com `opacity: .1` deixa a
 * barra a 90% e o `getComputedStyle` da barra continua a dizer `1`. O que se lê é **o que está no
 * ponto** — se o centro do link do menu devolve o próprio link, nada o cobre.
 */
const MEDIR = () => {
  const barra = document.querySelector('.topnav');
  const coluna = document.querySelector('aside.coluna');
  if (!barra) return { erro: 'a barra não existe no documento' };
  const caixa = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const rgb = (cor) => {
    const m = /rgba?\(([^)]+)\)/.exec(cor || '');
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
  };
  const lum = (c) => {
    const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const contraste = (a, b) => {
    const la = lum(a), lb = lum(b);
    return Math.round(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)) * 100) / 100;
  };
  /* O QUE ESTÁ NO PONTO, e se ele pertence ao LINK. O `svg` da marca é descendente do `<a>`: o
   * clique acerta no link, e a asserção tem de o entender — senão reprova o comportamento certo. */
  const noPonto = (x, y, alvoLink) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    return {
      tag: el.tagName.toLowerCase(),
      classe: String(el.className || el.getAttribute('class') || '').slice(0, 40),
      texto: (el.textContent || '').trim().slice(0, 40),
      acertaOAlvo: Boolean(alvoLink && (el === alvoLink || el.closest('a') === alvoLink)),
    };
  };
  const visivel = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const linksDaBarra = [...barra.querySelectorAll('a')].filter(visivel);
  const alvoBarra = linksDaBarra[0] || null;
  const alvoColuna = coluna ? [...coluna.querySelectorAll('a')].filter(visivel)[0] : null;
  const estiloBarra = getComputedStyle(barra);
  const fundoBarra = rgb(estiloBarra.backgroundColor);
  const textoBarra = alvoBarra ? rgb(getComputedStyle(alvoBarra).color) : null;
  const centro = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return noPonto(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2), el);
  };

  return {
    barra: caixa(barra),
    barraPosicao: estiloBarra.position,
    barraZ: estiloBarra.zIndex,
    barraOpacidade: Number(estiloBarra.opacity),
    coluna: coluna ? Object.assign({}, caixa(coluna),
      { z: getComputedStyle(coluna).zIndex, opacidade: Number(getComputedStyle(coluna).opacity),
        aberta: coluna.getAttribute('data-aberta') }) : null,
    contrasteDaBarra: fundoBarra && textoBarra ? contraste(fundoBarra, textoBarra) : null,
    linkDaBarra: centro(alvoBarra),
    linkDaColuna: centro(alvoColuna),
    /* A ÁREA DO CONTEÚDO — o que «rola por cima». */
    conteudoTopo: [...document.querySelectorAll('main .cartao, main .bloco-lista, main section, .faixa > .cartao')]
      .filter(visivel).slice(0, 6)
      .map((el) => Object.assign({ tag: el.tagName.toLowerCase(),
        classe: String(el.className).slice(0, 40) }, caixa(el))),
    /* O QUE ESTÁ NO TOPO DA JANELA — depois de rolar, se o conteúdo passar por cima, o ponto
     * (meia largura, 8px) devolve conteúdo; se passar por baixo, devolve a barra. */
    topoDaJanela: (() => {
      const el = document.elementFromPoint(Math.round(window.innerWidth / 2), 8);
      if (!el) return null;
      return { tag: el.tagName.toLowerCase(),
        classe: String(el.className || el.getAttribute('class') || '').slice(0, 40),
        dentroDaBarra: Boolean(el.closest && el.closest('.topnav')) };
    })(),
    /* A SONDA DA FAIXA — o que o sintoma «o conteúdo rola POR CIMA do cabeçalho» quer dizer,
     * medido: cinco pontos DENTRO da faixa da barra. Se algum devolver conteúdo, há conteúdo
     * pintado sobre ela. Que o conteúdo fique ATRÁS da barra é o normal de uma barra fixa — o que
     * não pode acontecer é vê-lo por cima. */
    sondaDaFaixa: (() => {
      /* OS PONTOS SÃO DA BARRA, e não da janela: no computador a coluna ocupa os primeiros 248px
       * e a barra começa ao lado dela — uma sonda sobre a largura da JANELA media a coluna no
       * primeiro ponto e reprovava o comportamento certo. */
      const caixaDaBarra = barra.getBoundingClientRect();
      const y = Math.max(2, Math.round(caixaDaBarra.height / 2));
      return [0.15, 0.35, 0.5, 0.7, 0.9].map((f) => {
        const el = document.elementFromPoint(
          Math.round(caixaDaBarra.x + caixaDaBarra.width * f), y);
        return { f, y, tag: el ? el.tagName.toLowerCase() : null,
          classe: el ? String(el.className || el.getAttribute('class') || '').slice(0, 30) : null,
          dentroDaBarra: Boolean(el && el.closest && el.closest('.topnav')) };
      });
    })(),
    rolado: Math.round(window.scrollY),
    alturaDaPagina: Math.round(document.documentElement.scrollHeight),
  };
};

/*
 * A PORTA NÃO TEM SERVIDOR PRÓPRIO (05/11/2026) — e este é o reparo que importa.
 *
 * Havia um `servirPorta` que lia `porta/index.html` e aplicava o menu À MÃO, com o mesmo
 * `navModulo.aplicar` que a ponte usa. A bancada dava 40/40 sobre uma página que ela própria
 * tinha arranjado — enquanto a produção servia a porta com o marcador `<!-- NAV -->` cru, sem
 * barra e sem coluna. O defeito que a pesquisadora viu («eu perco completamente a identidade
 * visual») estava a salvo de uma bancada verde.
 *
 * A LIÇÃO É A DE SEMPRE: quem aplica a moldura é quem SERVE, e é isso que se mede. A porta vai
 * pela ponte (`producao.fetch`), como a lista — mesmo servidor, mesmo `nav.json`, mesmo
 * `enquadrar`. Uma bancada que constrói o que devia encontrar não mede nada.
 */

(async () => {
  const executablePath = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executablePath) {
    console.error('provar-menu-do-formulario: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (erro) {
    console.error('provar-menu-do-formulario: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  const dir = publicacaoMinima();
  const env = await ambiente(dir);
  const { srv, base } = await servir(dir, env);
  const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    for (const largura of LARGURAS) {
      console.log('\n' + largura + 'px — a lista da Área do Professor, com o formulário aberto');
      /* A JANELA É MAIS CURTA DO QUE A PÁGINA, de propósito: com 900px de altura a lista cabe
       * inteira, `scrollY` fica em 0 e as asserções de rolagem passariam sem medir nada. A altura
       * de 520px é a de um telemóvel deitado ou de uma janela estreita — e é o estado em que se
       * rola de verdade. */
      await page.setViewport({ width: largura, height: 520 });
      await page.goto(base + '/area-do-professor/anamnese/?professor=coqui-de-redinha&escola=prova'
        + '&ciclo=01', { waitUntil: 'load' });
      await new Promise((r) => setTimeout(r, 700));

      const repouso = await page.evaluate(MEDIR);
      if (repouso.erro) { provar('a página abriu com a barra do sistema', false, repouso.erro); continue; }

      /* A. VISÍVEL */
      provar('a barra está em `fixed` no topo', repouso.barraPosicao === 'fixed' && repouso.barra.y === 0,
        { posicao: repouso.barraPosicao, y: repouso.barra.y });
      provar('a barra tem opacidade inteira (nenhum véu a esbater)',
        repouso.barraOpacidade === 1, repouso.barraOpacidade);
      provar('o texto da barra passa AA contra o fundo dela (4,5:1)',
        repouso.contrasteDaBarra !== null && repouso.contrasteDaBarra >= 4.5, repouso.contrasteDaBarra);

      /* B. CLICÁVEL — o ponto devolve o link, ou um descendente dele (o `svg` da marca). */
      provar('o centro do primeiro link da barra acerta no link (nada por cima)',
        Boolean(repouso.linkDaBarra) && repouso.linkDaBarra.acertaOAlvo === true, repouso.linkDaBarra);
      provar('a coluna do menu existe (é a navegação lateral do formulário)', Boolean(repouso.coluna));
      if (repouso.coluna) {
        provar('a coluna tem opacidade inteira', repouso.coluna.opacidade === 1, repouso.coluna.opacidade);
        /* No telemóvel a coluna nasce fechada (fora do ecrã): abrir é o gesto do ☰, e sem ele o
         * link não tem centro a medir. Abre-se pelo mesmo atributo que o `nav.js` escreve. */
        if (largura < 1141) {
          await page.evaluate(() => {
            const col = document.querySelector('aside.coluna');
            if (col) { col.setAttribute('data-aberta', 'sim'); document.body.classList.add('coluna-aberta'); }
          });
          await new Promise((r) => setTimeout(r, 350));
        }
        const aberta = await page.evaluate(MEDIR);
        provar('o centro do primeiro link da coluna acerta no link',
          Boolean(aberta.linkDaColuna) && aberta.linkDaColuna.acertaOAlvo === true, aberta.linkDaColuna);
        /* Fechar de novo: o estado aberto é o do gesto, e o resto da bancada mede a página livre. */
        await page.evaluate(() => {
          const col = document.querySelector('aside.coluna');
          if (col) { col.setAttribute('data-aberta', 'nao'); document.body.classList.remove('coluna-aberta'); }
        });
        await new Promise((r) => setTimeout(r, 350));
      }

      /* C. ROLAGEM — com o FORMULÁRIO ABERTO, que é o estado do defeito. */
      const abriu = await page.evaluate(() => {
        const bloco = document.getElementById('bloco-ato');
        if (!bloco) return false;
        bloco.hidden = false;
        bloco.open = true;
        const botao = document.getElementById('botao-acoes');
        if (botao) botao.click();          // abre o menu «Ações»...
        const item = document.querySelector('#menu-de-acoes [data-abrir="ato"]');
        if (item) item.click();            // ...e escolhe o bloco, como o professor faz
        return true;
      });
      provar('a lista tem o bloco do formulário («Fazer anamnese»)', abriu);
      await new Promise((r) => setTimeout(r, 400));

      const antes = await page.evaluate(MEDIR);
      provar('com o formulário aberto, a página é mais alta do que a janela (há o que rolar)',
        antes.alturaDaPagina > 520, antes.alturaDaPagina);

      await page.evaluate(() => window.scrollTo(0, 600));
      await new Promise((r) => setTimeout(r, 300));
      const rolado = await page.evaluate(MEDIR);

      provar('a página ROLOU (scrollY > 0) — sem isto as asserções de rolagem não medem nada',
        rolado.rolado > 0, rolado.rolado);
      provar('depois de rolar, o topo da janela ainda é a barra (o conteúdo passa por baixo)',
        Boolean(rolado.topoDaJanela) && rolado.topoDaJanela.dentroDaBarra === true, rolado.topoDaJanela);
      provar('a barra continua em `fixed` no topo depois de rolar (y === 0)',
        rolado.barra.y === 0, { y: rolado.barra.y, rolado: rolado.rolado });
      /* D. A AJUDA ABERTA (o «?» de um campo) não pode comer os cliques do menu.
       *
       * A folha da explicação sobe no telemóvel com um véu que é um `::before` do próprio painel
       * — `position: fixed; inset: 0; z-index: -1` —, e um véu fixo que cobre a página inteira
       * recebe os cliques que ninguém lhe deu. Este bloco mede o que acontece ao centro de um
       * link do menu com a explicação aberta: se o ponto deixa de acertar no link, o véu está a
       * comer o clique. */
      const temAjuda = await page.evaluate(() => {
        const caixa = document.getElementById('explica');
        if (!caixa) return false;
        caixa.hidden = false;
        caixa.classList.add('aberto');
        return true;
      });
      if (temAjuda) {
        await new Promise((r) => setTimeout(r, 250));
        const comAjuda = await page.evaluate(MEDIR);
        provar('com a ajuda aberta, o link da barra continua a receber o clique',
          Boolean(comAjuda.linkDaBarra) && comAjuda.linkDaBarra.acertaOAlvo === true,
          comAjuda.linkDaBarra);
        await page.evaluate(() => {
          const caixa = document.getElementById('explica');
          if (caixa) { caixa.hidden = true; caixa.classList.remove('aberto'); }
        });
        await new Promise((r) => setTimeout(r, 200));
      }

      /* A FAIXA, MEDIDA DENTRO DELA. Uma caixa que começa em y=43 com a barra a ir até 60 está
       * ATRÁS da barra, e isso é o comportamento certo de uma barra fixa. O defeito é o inverso:
       * o que está pintado NA faixa não ser a barra. Cinco pontos, e todos têm de ser dela. */
      const fora = (rolado.sondaDaFaixa || []).filter((p) => p.dentroDaBarra !== true);
      provar('os cinco pontos da faixa da barra são da barra (nada pinta por cima do cabeçalho)',
        fora.length === 0, fora);

      /* A COLUNA SÓ EXISTE AO LADO DA BARRA ACIMA DE 1140 — abaixo disso ela é a folha, e a
       * barra ocupa a largura toda. A simulação mede o caso em que o defeito aparece. */
      if (largura >= 1141) {
    /* ----------------------------------------------------------------------------------- */
    console.log('\nE. UM NAVEGADOR SEM `:has()` — o menu continua a responder?');
    /* ----------------------------------------------------------------------------------- */
    /* O DEFEITO REPRODUZIDO, e a razão de ele passar por todas as bancadas.
     *
     * O layout da coluna dependia de `body:has(> .coluna)`, e `:has()` não existe em todo o lado
     * — Firefox só a teve na 121 (Dez/2023), e o ESR 115 não a tem. Sem ela, a barra fica em
     * `left: 0`, a coluna (`z-index: 21`) cobre-lhe os primeiros 248px, e **o primeiro item do
     * menu deixa de receber o clique**: o `elementFromPoint` devolve a marca da coluna. É o «os
     * cliques não respondem», igual nas três telas de formulário.
     *
     * A simulação é FIEL: as regras com `:has(` são desactivadas no próprio CSSOM (troca-se o
     * `selectorText` por um que não casa), e não sobrepostas com `!important` — sobrepor seria uma
     * segunda diferença, inventada por quem mede. */
      const semHas = await page.evaluate(() => {
      let n = 0;
      const andar = (regras) => {
        for (let i = regras.length - 1; i >= 0; i--) {
          const r = regras[i];
          if (r.cssRules) andar(r.cssRules);
          if (r.selectorText && r.selectorText.indexOf(':has(') !== -1) {
            r.selectorText = '.nao-casa-' + i;
            n++;
          }
        }
      };
      for (let i = 0; i < document.styleSheets.length; i++) {
        try { andar(document.styleSheets[i].cssRules); } catch (e) { /* folha opaca */ }
      }
      return n;
    });
      provar('havia regras com `:has()` a desactivar (senão não se está a medir nada)',
      semHas > 0, semHas);
      await new Promise((r) => setTimeout(r, 200));
      const mSemHas = await page.evaluate(MEDIR);
      provar('sem `:has()`, a barra continua ao lado da coluna (left = 248)',
      mSemHas.barra.x === 248, mSemHas.barra.x);
      provar('sem `:has()`, o primeiro link do menu CONTINUA a receber o clique',
      Boolean(mSemHas.linkDaBarra) && mSemHas.linkDaBarra.acertaOAlvo === true,
      mSemHas.linkDaBarra);

    /* O CONTROLO NEGATIVO: sem o atributo que o `nav.js` escreve, o caminho alternativo também
     * não existe — e o defeito volta. Sem esta asserção, o «passou» acima podia ser do `:has()`
     * que eu não consegui desactivar, e não do remendo. */
      await page.evaluate(() => document.documentElement.removeAttribute('data-tem-coluna'));
      await new Promise((r) => setTimeout(r, 150));
      const semNada = await page.evaluate(MEDIR);
      provar('…e sem o atributo do `nav.js` o defeito VOLTA (o remendo é que salva, não o acaso)',
      semNada.barra.x === 0 && Boolean(semNada.linkDaBarra) && semNada.linkDaBarra.acertaOAlvo === false,
      { x: semNada.barra.x, link: semNada.linkDaBarra });


      }

    }
    /* ----------------------------------------------------------------------------------- */
    console.log('\nA PÁGINA DO FORMULÁRIO (a porta) — servida pela ponte, sem truque');
    /* ----------------------------------------------------------------------------------- */
    /* É a página onde «Novo registo» e «Ajustar» aterram, e é a que estava sem moldura. Aqui ela
     * vai pelo MESMO `servir` da lista: nada de aplicar menu à mão. */
    {
      const p2 = await browser.newPage();
      for (const largura of LARGURAS) {
        console.log('\n' + largura + 'px — a porta do Plano de Observação, com o menu da escola');
        await p2.setViewport({ width: largura, height: 520 });
        await p2.goto(base + '/plano-observacao/?professor=coqui-de-redinha&escola=prova'
          + '&ciclo=01&plano=' + encodeURIComponent(PLANO.id) + '&fonte=po', { waitUntil: 'load' });
        await new Promise((r) => setTimeout(r, 900));
        const m2 = await p2.evaluate(MEDIR);
        if (m2.erro) { provar('a porta abriu com a barra do sistema', false, m2.erro); continue; }
        provar('a barra está em `fixed` no topo', m2.barraPosicao === 'fixed' && m2.barra.y === 0,
          { posicao: m2.barraPosicao, y: m2.barra.y });
        provar('a barra tem opacidade inteira (nenhum véu a esbater)', m2.barraOpacidade === 1,
          m2.barraOpacidade);
        provar('o texto da barra passa AA contra o fundo dela (4,5:1)',
          m2.contrasteDaBarra !== null && m2.contrasteDaBarra >= 4.5, m2.contrasteDaBarra);
        provar('o centro do primeiro link da barra acerta no link (nada por cima)',
          Boolean(m2.linkDaBarra) && m2.linkDaBarra.acertaOAlvo === true, m2.linkDaBarra);
        provar('a coluna do menu existe e está opaca',
          Boolean(m2.coluna) && m2.coluna.opacidade === 1, m2.coluna);
        /* A ROLAGEM NÃO SE MEDE AQUI, e DIZ-SE — não se dá por boa. Uma asserção que passa sempre
         * é pior do que nenhuma: foi assim que a primeira versão desta bancada deu um verde falso
         * na rolagem. Com os dados do stub o formulário não chega a ser mais alto do que a janela,
         * e `scrollTo` devolveria `scrollY: 0`. A rolagem mede-se na lista (acima) — a mesma folha,
         * a mesma barra, a mesma coluna. */
        console.log('  ----  rolagem NÃO MEDIDA nesta página: o stub não enche o formulário; '
          + 'ela é medida na lista, com a mesma barra e a mesma coluna');
      }
      await p2.close();
    }
  } finally {
    await browser.close();
    srv.close();
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: a barra e a coluna, nas telas de formulário, '
    + 'estão visíveis, contrastadas, clicáveis — e o conteúdo passa por baixo delas.');
})();
