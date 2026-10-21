#!/usr/bin/env node
'use strict';

/**
 * provar-iphone.js — o que o iPhone fazia e o Android não: o menu pela metade e a rolagem
 * a tremer.
 *
 * Por que existe (21/10/2026). Relatado de um iPhone, num iPhone: «o menu de hambúrguer
 * aparece pela metade» e «a rolagem fica a tremer». No Moto G4 e no Chrome do computador
 * estava bem. As duas coisas são do Safari do iOS, e as duas foram MEDIDAS antes de
 * corrigidas:
 *
 *   1. O MENU NÃO CABIA. O painel cresce com o conteúdo — 812px com os seis grupos
 *      abertos — e não tinha `max-height` nem `overflow`. Num iPhone, onde as barras do
 *      sistema comem 150 a 270px da altura, o fim do menu ficava FORA da tela e não havia
 *      como chegar lá: o painel está dentro de uma barra `position: fixed`, e a página por
 *      baixo rola sem o levar. Medido em 390×664 (o que um iPhone mostra com as barras):
 *      148px cortados; num 320×568, 266px. É a «metade».
 *
 *   2. O `resize` DO iOS DISPARA A ROLAR. Enquanto a página rola, o Safari recolhe e
 *      volta a mostrar as barras do sistema — e emite `resize` a cada quadro dessa
 *      animação. Os nossos dois `resize` faziam trabalho de layout: `ajustarAlturaNavbar`
 *      escrevia `--header-height` (que é o `padding-top` do `body`) e o bloco do título
 *      media o cabeçalho. Resultado medido: 60 eventos de `resize` com a MESMA largura
 *      davam 60 leituras de layout e 120 escritas em `:root` — o conteúdo andava por baixo
 *      do dedo. É a tremedeira. No Android o `resize` não dispara a rolar, e no desktop
 *      a janela não muda de tamanho sozinha: por isso só o iPhone mostrava o defeito.
 *
 * O que se prova aqui (Chrome; o iOS não está nesta máquina, e o que se pode provar é o
 * MECANISMO — o que o código faz quando o ambiente se comporta como o iOS):
 *
 *   A. O PAINEL CABE, ROLA E É DE UMA COLUNA SÓ
 *      1. em 390×664 e 320×568 (as alturas de um iPhone com as barras) a barra não passa
 *         do fundo da tela;
 *      2. quando o conteúdo excede, o painel ROLA por dentro (`scrollHeight > clientHeight`);
 *      3. e o ÚLTIMO link fica alcançável ao rolar o painel — é o que estava inalcançável;
 *      4. o hamburger continua à vista com o painel rolado (é por ele que se fecha);
 *      5. os filhos ficam numa coluna só, com os topos a subir — a armadilha do
 *         `flex-wrap: wrap` herdado, que punha metade dos links numa segunda coluna ao lado.
 *
 *   B. O ALVO DE TOQUE — o hamburger tem 44×44 ou mais (WCAG 2.5.5 / Apple HIG), em 320,
 *      390 e 414.
 *
 *   C. A TEMPESTADE DE `resize` — 60 eventos com a MESMA largura (o que o iOS faz a rolar)
 *      não produzem NENHUMA leitura de layout nem NENHUMA escrita de custom property; e
 *      uma mudança de LARGURA produz pelo menos uma, o que mostra que o portão não é um
 *      «nunca».
 *
 *   D. A ROLAGEM NÃO LÊ LAYOUT — 100 quadros de rolagem fazem no máximo 2 leituras de
 *      `getBoundingClientRect`.
 *
 *   E. O MESMO NO LANÇAMENTO — a barra de controles publica `--barra-altura` só quando a
 *      largura muda.
 *
 * CONTROLE NEGATIVO: com o `nav.js` e o `ciclo.css` do `HEAD` anterior, C reprova com as
 * 120 escritas e A reprova com o painel cortado. Sem isso a prova poderia estar a medir-se
 * a si mesma.
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-iphone.js
 */

const path = require('path');
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');

let puppeteer;
try {
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
} catch {
  console.error('provar-iphone: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
  process.exit(1);
}
const executavel = process.env.CHROME_PATH
  || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
if (!executavel) {
  console.error('provar-iphone: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
  process.exit(1);
}

const PACOTE = 'professores/sapo-bailarino/ciclos/ciclo-01-batata-bale-nivel-1-teste-2';
const MAPA = { 'assets/style.css': 'tools/templates/ciclo.css', 'assets/nav.js': 'tools/templates/nav.js' };

/** Serve o pacote, com os assets apontados para a FONTE (a cópia é conferida pelo
 *  `check-identidade.js`), e um `?antigo=1` que serve a versão do `HEAD` — o controlo
 *  negativo usa os MESMOS ficheiros, não uma reconstrução à mão que poderia mentir. */
function servir(antigos) {
  const srv = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const usarAntigo = url.searchParams.get('antigo') === '1';
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const assets = rel.match(/(?:^|\/)assets\/(style\.css|nav\.js)$/);
    let alvo;
    let conteudo;
    if (assets && usarAntigo && antigos[assets[1]]) {
      conteudo = antigos[assets[1]];
    } else {
      const tentativas = [assets ? MAPA['assets/' + assets[1]] : null, rel, path.join(PACOTE, rel)].filter(Boolean);
      alvo = tentativas.map((x) => path.join(raiz, x))
        .find((x) => x.startsWith(raiz) && fs.existsSync(x) && !fs.statSync(x).isDirectory());
    }
    if (!alvo && conteudo === undefined) { res.writeHead(404); res.end('nao encontrado'); return; }
    /* A MARCA TEM DE CHEGAR AOS ASSETS. O `<link>` e o `<script>` do documento pedem
       `assets/style.css` sem query nenhuma: servir o HTML «antigo» e os assets novos
       deixava o controlo negativo a medir o código de hoje — passava por acidente. */
    if (!assets && usarAntigo && /\.html$/.test(alvo || '')) {
      conteudo = fs.readFileSync(alvo, 'utf8')
        .replace(/assets\/(style\.css|nav\.js)/g, 'assets/$1?antigo=1');
    }
    /* O TIPO VEM DO CAMINHO PEDIDO, e não do ficheiro que se acabou de ler. Com o
       `alvo` indefinido (o caso do asset antigo, que não corresponde a ficheiro nenhum
       em disco) o `extname` caía no `.js` e a folha de estilo era servida como
       `text/javascript`. O Chrome RECUSA uma folha com MIME de script: a página do
       controlo negativo aparecia SEM estilo — e a prova media uma página nua, não o CSS
       de antes. Uma prova que mede o artefacto errado reprova pelo motivo errado; aqui
       teria APROVADO pelo motivo errado. */
    const ext = path.extname(rel) || '.bin';
    const tipo = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' }[ext] || 'text/plain';
    res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
    res.end(conteudo !== undefined ? conteudo : fs.readFileSync(alvo));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/** A leitura do painel do menu. */
const MEDIR_PAINEL = () => {
  const nav = document.querySelector('.topnav');
  const painel = nav && nav.querySelector('.nav-links');
  const botao = document.querySelector('.hamburger');
  if (!nav || !painel) return { temBarra: false };
  const rn = nav.getBoundingClientRect();
  const rp = painel.getBoundingClientRect();
  const links = [...painel.querySelectorAll('a')];
  const topos = [...painel.children].map((c) => Math.round(c.getBoundingClientRect().top));
  const rb = botao ? botao.getBoundingClientRect() : null;
  return {
    temBarra: true,
    tela: window.innerHeight,
    fundoDaBarra: Math.round(rn.bottom),
    sobraAbaixo: Math.round(window.innerHeight - rn.bottom),
    alturaDoPainel: Math.round(rp.height),
    rola: painel.scrollHeight > painel.clientHeight + 1,
    overflow: getComputedStyle(painel).overflowY,
    colunaUnica: topos.every((t, i) => i === 0 || t > topos[i - 1]),
    topos,
    links: links.length,
    botao: rb ? { largura: Math.round(rb.width), altura: Math.round(rb.height),
      aVista: rb.bottom > 0 && rb.top < window.innerHeight && rb.width > 0 } : null,
  };
};

(async () => {
  // O controlo negativo usa o conteúdo do `HEAD` — os mesmos ficheiros, servidos com ?antigo=1.
  const gitShow = (p) => {
    try { return execSync(`git show HEAD:${p}`, { cwd: raiz, encoding: 'utf8' }); } catch { return undefined; }
  };
  const antigos = { 'nav.js': gitShow('tools/templates/nav.js'), 'style.css': gitShow('tools/templates/ciclo.css') };

  const { srv, base } = await servir(antigos);
  const br = await puppeteer.launch({ executablePath: executavel,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    if (!cond) falhas += 1;
    console.log((cond ? 'ok     ' : 'FALHA  ') + nome
      + (extra !== undefined ? ' → ' + JSON.stringify(extra) : ''));
  };

  const doc = (q = '') => `${base}/${PACOTE}/aula-01.html${q}`;
  const lanc = (q = '') => `${base}/${PACOTE}/lancamento.html${q}`;

  /** Abre o menu e todos os grupos — o pior caso, que é o que se vê num iPhone. */
  const abrirTudo = async (url) => {
    await pg.goto(url, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 200));
    await pg.click('.hamburger');
    await new Promise((r) => setTimeout(r, 120));
    await pg.evaluate(() => document.querySelectorAll('.topnav details').forEach((d) => { d.open = true; }));
    await new Promise((r) => setTimeout(r, 150));
  };

  // ===================================================== A. o painel coube?
  /* As alturas que importam são as de um iPhone COM AS BARRAS DO SISTEMA à vista —
   * é nelas que o menu deixa de caber. 664 e 568 são esses casos. */
  for (const [w, h] of [[390, 664], [320, 568]]) {
    await pg.setViewport({ width: w, height: h });
    await abrirTudo(doc());
    const m = await pg.evaluate(MEDIR_PAINEL);
    provar(`${w}×${h}: a barra não passa do fundo da tela (nada cortado)`,
      m.sobraAbaixo >= 0, { fundoDaBarra: m.fundoDaBarra, tela: m.tela, sobra: m.sobraAbaixo });
    provar(`${w}×${h}: o painel ROLA por dentro — o conteúdo excede a caixa`,
      m.rola && m.overflow === 'auto', { rola: m.rola, overflow: m.overflow,
        altura: m.alturaDoPainel });
    provar(`${w}×${h}: os links ficam numa coluna só, com os topos a subir`,
      m.colunaUnica, { topos: m.topos });

    // O ÚLTIMO link: inalcançável era o defeito. Rola-se o painel e ele tem de aparecer.
    const alcance = await pg.evaluate(async () => {
      const p = document.querySelector('.topnav .nav-links');
      const links = [...p.querySelectorAll('a')];
      const ultimo = links[links.length - 1];
      p.scrollTop = p.scrollHeight;
      await new Promise((r) => requestAnimationFrame(r));
      const r = ultimo.getBoundingClientRect();
      return { topo: Math.round(r.top), fundo: Math.round(r.bottom), tela: innerHeight,
        dentro: r.top >= 0 && r.bottom <= innerHeight };
    });
    provar(`${w}×${h}: o ÚLTIMO dos ${m.links} links fica alcançável ao rolar o painel`,
      alcance.dentro, alcance);

    const depois = await pg.evaluate(MEDIR_PAINEL);
    provar(`${w}×${h}: o hamburger continua à vista com o painel rolado (é por ele que se fecha)`,
      Boolean(depois.botao && depois.botao.aVista), depois.botao);
  }

  // ============================================== B. o alvo de toque
  for (const w of [320, 390, 414]) {
    await pg.setViewport({ width: w, height: 844 });
    await pg.goto(doc(), { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 150));
    const b = await pg.evaluate(() => {
      const e = document.querySelector('.hamburger').getBoundingClientRect();
      return { largura: Math.round(e.width), altura: Math.round(e.height) };
    });
    provar(`${w}px: o hamburger mede 44×44 ou mais (é o único controle da barra)`,
      b.largura >= 44 && b.altura >= 44, b);
  }

  // ============================================== C. a tempestade de `resize`
  /*
   * O instrumento: conta leituras de layout e escritas de custom property DURANTE os
   * eventos. Se os dois números forem zero, o `resize` do iOS deixou de mexer no layout.
   * O caso da largura existe para provar que o portão não é «nunca»: um contador que só
   * sabe dar zero não mede nada.
   */
  const tempestade = async (url) => {
    await pg.setViewport({ width: 390, height: 844 });
    await pg.goto(url, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 300));
    return pg.evaluate(async () => {
      let leituras = 0; let escritas = 0; let escritasDeLargura = 0;
      const origG = Element.prototype.getBoundingClientRect;
      const origS = CSSStyleDeclaration.prototype.setProperty;
      const ligar = () => {
        Element.prototype.getBoundingClientRect = function () { leituras += 1; return origG.call(this); };
        CSSStyleDeclaration.prototype.setProperty = function (n, v, p) {
          if (/^--/.test(String(n))) escritas += 1; return origS.call(this, n, v, p);
        };
      };
      const desligar = () => {
        Element.prototype.getBoundingClientRect = origG;
        CSSStyleDeclaration.prototype.setProperty = origS;
      };
      ligar();
      for (let i = 0; i < 60; i++) window.dispatchEvent(new Event('resize'));
      desligar();
      const naMesmaLargura = { leituras, escritas };

      // agora a LARGURA muda: aqui TEM de haver trabalho
      leituras = 0; escritas = 0;
      ligar();
      window.dispatchEvent(new Event('resize'));   // primeira, ainda com a largura velha
      desligar();
      const primeira = { leituras, escritas };
      return { naMesmaLargura, primeiraComLarguraVelha: primeira };
    });
  };

  const t1 = await tempestade(doc());
  provar('60 `resize` com a MESMA largura (o que o iOS faz a rolar): nenhuma leitura de layout',
    t1.naMesmaLargura.leituras === 0, t1.naMesmaLargura);
  provar('…e nenhuma escrita de custom property — o conteúdo não anda por baixo do dedo',
    t1.naMesmaLargura.escritas === 0, t1.naMesmaLargura);

  /* A largura muda de verdade: o trabalho acontece. O interceptor fica ligado ENQUANTO
   * a janela muda — despachar um `resize` à mão depois de a largura já ter mudado não
   * prova nada, porque o portão o descarta (e foi assim que esta asserção nasceu a
   * falhar: media um evento que o código, com razão, ignora). */
  await pg.evaluate(() => {
    window.__escritas = 0;
    const origS = CSSStyleDeclaration.prototype.setProperty;
    window.__origS = origS;
    CSSStyleDeclaration.prototype.setProperty = function (n, v, p) {
      if (/^--/.test(String(n))) window.__escritas += 1;
      return origS.call(this, n, v, p);
    };
  });
  await pg.setViewport({ width: 700, height: 844 });
  await new Promise((r) => setTimeout(r, 300));
  const aoMudarLargura = await pg.evaluate(() => {
    CSSStyleDeclaration.prototype.setProperty = window.__origS;
    return { escritas: window.__escritas };
  });
  provar('mas uma mudança de LARGURA volta a medir (o portão não é um «nunca»)',
    aoMudarLargura.escritas >= 1, aoMudarLargura);

  // ============================================== D. a rolagem não lê layout
  await pg.setViewport({ width: 390, height: 844 });
  await pg.goto(doc(), { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 200));
  const naRolagem = await pg.evaluate(async () => {
    let leituras = 0;
    const origG = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () { leituras += 1; return origG.call(this); };
    document.documentElement.style.scrollBehavior = 'auto';
    for (let y = 0; y < 2000; y += 20) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(r));
    }
    Element.prototype.getBoundingClientRect = origG;
    return { leituras, quadros: 100 };
  });
  provar('100 quadros de rolagem fazem no máximo 2 leituras de layout',
    naRolagem.leituras <= 2, naRolagem);

  // ============================================== E. o lançamento
  const t2 = await tempestade(lanc());
  provar('lançamento: 60 `resize` com a mesma largura não escrevem `--barra-altura`',
    t2.naMesmaLargura.escritas === 0 && t2.naMesmaLargura.leituras === 0, t2.naMesmaLargura);

  // ============================================== controlo negativo
  await pg.setViewport({ width: 390, height: 664 });
  await abrirTudo(doc('?antigo=1'));
  const velho = await pg.evaluate(MEDIR_PAINEL);
  /* A folha do controlo negativo tem de estar APLICADA. Sem esta linha, um erro de
   * MIME — que já aconteceu nesta prova — faz a página aparecer sem estilo, e o
   * controlo passa a medir uma página nua. */
  const regrasDaFolhaAntiga = await pg.evaluate(() => {
    const f = [...document.styleSheets].find((x) => (x.href || '').includes('antigo=1'));
    return f ? (f.cssRules ? f.cssRules.length : -1) : null;
  });
  provar('CONTROLE NEGATIVO: a folha de estilo antiga está mesmo aplicada (senão media-se uma página nua)',
    regrasDaFolhaAntiga !== null && regrasDaFolhaAntiga > 100, { regras: regrasDaFolhaAntiga });
  provar('CONTROLE NEGATIVO: com o CSS de antes o painel passa do fundo da tela',
    velho.sobraAbaixo < 0, { sobra: velho.sobraAbaixo, altura: velho.alturaDoPainel });

  const velhoT = await tempestade(doc('?antigo=1'));
  provar('CONTROLE NEGATIVO: com o `nav.js` de antes, 60 `resize` fazem trabalho de layout',
    velhoT.naMesmaLargura.escritas > 0 && velhoT.naMesmaLargura.leituras > 0,
    velhoT.naMesmaLargura);

  await br.close();
  srv.close();
  console.log(`\n${falhas === 0 ? 'TUDO CERTO' : falhas + ' falha(s)'} — provar-iphone`);
  process.exit(falhas === 0 ? 0 : 1);
})();
