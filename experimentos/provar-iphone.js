#!/usr/bin/env node
'use strict';

/**
 * provar-iphone.js — o que o iPhone mostrava e o Android não: a barra a passar da tela e a
 * rolagem a tremer.
 *
 * Por que existe (21/10/2026). Relatado de um iPhone: «o menu de hambúrguer aparece pela
 * metade» e «a rolagem fica a tremer». No Moto G4 e no Chrome do computador, bem.
 *
 * A PRIMEIRA VERSÃO DESTA PROVA MEDIU A COISA ERRADA, e fica escrito porque é o erro que
 * interessa. Ela tratou os dois sintomas como dois problemas e atacou o painel do menu — um
 * `max-height` com `overflow` —, o que punha o painel a rolar dentro de si. Não era isso: o
 * menu «pela metade» era a PÁGINA mais larga que o ecrã, e num telemóvel a barra
 * `position: fixed` é medida pela largura do LAYOUT. Com 97px de excesso, a barra ficava 97px
 * mais larga: o ☰ saía do ecrã à direita, e nem era clicável. A rolagem a tremer também
 * escondia uma parte de layout que não se suspeitava.
 *
 * O que ficou, e o que se prova aqui:
 *
 *   A. A PÁGINA NÃO PASSA DA TELA (a causa que estava por trás de três sintomas)
 *      1. toda página do pacote tem zero excesso horizontal em 320, 360 e 390px;
 *      2. o ☰ está inteiro dentro do ecrã e RECEBE O CLIQUE (`elementFromPoint`);
 *      3. uma tabela mais larga que a coluna ROLA DENTRO DE SI, em vez de alargar a página;
 *      4. no desktop a tabela continua a ser tabela (nada muda lá).
 *
 *   B. O `resize` DO iOS NÃO MEXE NO LAYOUT (a tremedeira)
 *      5. 60 eventos com a MESMA largura — o que o iOS faz a rolar, ao recolher as barras do
 *         sistema — não produzem nenhuma leitura de layout nem nenhuma escrita de custom
 *         property;
 *      6. mas uma mudança de LARGURA volta a medir: o portão não é um «nunca»;
 *      7. e 100 quadros de rolagem não leem layout.
 *
 *   C. NO LANÇAMENTO, o mesmo portão para o `resize` que publica `--barra-altura`.
 *
 * CONTROLES NEGATIVOS contra o `HEAD` anterior: com o CSS de antes, o `plano.html` tem 97px
 * de excesso e o ☰ não recebe o clique; com o `nav.js` de antes, os 60 `resize` produzem 60
 * leituras e 120 escritas.
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
  /* O COMMIT DE REFERÊNCIA é um SHA fixo, e não `HEAD`. O `HEAD` de hoje já contém a
   * correção — um controlo negativo contra ele mediria o código novo e passaria por
   * acidente. `b40aa0a` é o último commit antes desta correção, e fica escrito para que o
   * controlo continue a valer depois de o `HEAD` andar. Se o commit desaparecer da
   * história, a prova reprova em vez de fingir que conferiu. */
  const SEM_CORRECAO = 'b40aa0a';
  const gitShow = (p) => {
    try {
      return execSync(`git show ${SEM_CORRECAO}:${p}`, { cwd: raiz, encoding: 'utf8' });
    } catch {
      return undefined;
    }
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

  // ========================================= A. a página não passa da tela
  /*
   * O DEFEITO, medido: no `plano.html` havia uma tabela de cinco colunas com uma célula
   * «[Preencher: o critério de cada aula — declarado no lançamento da aula dada]». Num ecrã
   * de 360px ela não cabia, e as tabelas são `width:100%` com `padding` de 8px em cada
   * célula: o mínimo do conteúdo passava da coluna e a página ganhava 97px de rolagem
   * horizontal. Num telemóvel a barra `fixed` é medida pela largura do LAYOUT — ficou 97px
   * mais larga, e o ☰ saiu do ecrã à direita. Um defeito de tabela, três sintomas.
   */
  const PAGINAS = ['index.html', 'plano.html', 'aula-01.html', 'notacao.html',
    'glossario-benesh.html', 'referencias.html', 'harmonizacao.html', 'captura-aula-01.html'];
  for (const [w, h] of [[320, 568], [360, 740], [390, 664]]) {
    await pg.setViewport({ width: w, height: h, hasTouch: true, isMobile: true });
    const estouram = [];
    const cortados = [];
    for (const f of PAGINAS) {
      await pg.goto(`${base}/${PACOTE}/${f}`, { waitUntil: 'load' });
      await new Promise((r) => setTimeout(r, 120));
      const m = await pg.evaluate(() => {
        const doc = document.documentElement;
        const botao = document.querySelector('.hamburger');
        const r = botao ? botao.getBoundingClientRect() : null;
        /* O que está DEBAIXO do centro do ☰: um botão fora do ecrã, ou coberto, existe no
           DOM, mede 0 de erro de caixa e não recebe toque nenhum — só o
           `elementFromPoint` o diz. Foi este o sintoma relatado («tenho de rolar para a
           direita para ver o menu»). */
        const alvo = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
        const noBotao = Boolean(alvo && alvo.closest && alvo.closest('.hamburger'));
        return {
          excesso: doc.scrollWidth - doc.clientWidth,
          botaoDentro: r ? r.left >= 0 && r.right <= doc.clientWidth + 1 : false,
          recebeOClique: noBotao ? 'hamburger' : (alvo ? (alvo.className || alvo.tagName) : null),
        };
      });
      if (m.excesso > 1) estouram.push(`${f}: +${m.excesso}px`);
      if (!m.botaoDentro || !String(m.recebeOClique).includes('hamburger')) {
        cortados.push({ arquivo: f, dentro: m.botaoDentro, quemRecebe: m.recebeOClique });
      }
    }
    provar(`${w}px: nenhuma das ${PAGINAS.length} páginas passa da tela na horizontal`,
      estouram.length === 0, estouram.length ? estouram : undefined);
    provar(`${w}px: o ☰ está inteiro no ecrã e RECEBE o clique em todas elas`,
      cortados.length === 0, cortados.length ? cortados : undefined);
  }

  // A tabela larga rola DENTRO DE SI — e não alarga a página.
  await pg.setViewport({ width: 320, height: 568, hasTouch: true, isMobile: true });
  await pg.goto(`${base}/${PACOTE}/plano.html`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 200));
  const tabelas = await pg.evaluate(() => {
    const doc = document.documentElement;
    return {
      excessoDaPagina: doc.scrollWidth - doc.clientWidth,
      lista: [...document.querySelectorAll('table')].map((t) => ({
        largura: Math.round(t.getBoundingClientRect().width),
        conteudo: t.scrollWidth,
        rola: t.scrollWidth > t.clientWidth + 1,
        display: getComputedStyle(t).display,
      })),
    };
  });
  provar('em 320px a página do plano não estoura, mesmo com tabelas de 5 colunas',
    tabelas.excessoDaPagina === 0, { excesso: tabelas.excessoDaPagina });
  provar('…e as tabelas que não cabem ROLAM dentro de si (há pelo menos uma)',
    tabelas.lista.some((t) => t.rola)
    && tabelas.lista.every((t) => t.rola || t.conteudo <= t.largura + 1),
    tabelas.lista);

  // No desktop nada muda: a tabela continua a ser tabela.
  await pg.setViewport({ width: 1280, height: 800 });
  await pg.goto(`${base}/${PACOTE}/plano.html`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 200));
  const noDesktop = await pg.evaluate(() => [...document.querySelectorAll('table')]
    .map((t) => getComputedStyle(t).display));
  provar('no desktop as tabelas continuam `display: table` — o desenho não foi trocado',
    noDesktop.length > 0 && noDesktop.every((d) => d === 'table'), noDesktop);

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
  await pg.setViewport({ width: 360, height: 740, hasTouch: true, isMobile: true });
  await pg.goto(`${base}/${PACOTE}/plano.html?antigo=1`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 250));
  const velho = await pg.evaluate(() => ({
    excesso: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  /* A folha do controlo negativo tem de estar APLICADA. Sem esta linha, um erro de
   * MIME — que já aconteceu nesta prova — faz a página aparecer sem estilo, e o
   * controlo passa a medir uma página nua. */
  const regrasDaFolhaAntiga = await pg.evaluate(() => {
    const f = [...document.styleSheets].find((x) => (x.href || '').includes('antigo=1'));
    return f ? (f.cssRules ? f.cssRules.length : -1) : null;
  });
  provar(`CONTROLE NEGATIVO: o commit de referência (${SEM_CORRECAO}) tem os dois arquivos`,
    typeof antigos['nav.js'] === 'string' && typeof antigos['style.css'] === 'string',
    { nav: typeof antigos['nav.js'], css: typeof antigos['style.css'] });
  provar('CONTROLE NEGATIVO: a folha de estilo antiga está mesmo aplicada (senão media-se uma página nua)',
    regrasDaFolhaAntiga !== null && regrasDaFolhaAntiga > 100, { regras: regrasDaFolhaAntiga });
  provar('CONTROLE NEGATIVO: com o CSS de antes a página do plano estourava (é o defeito)',
    velho.excesso > 50, { excesso: velho.excesso });

  const velhoT = await tempestade(doc('?antigo=1'));
  provar('CONTROLE NEGATIVO: com o `nav.js` de antes, 60 `resize` fazem trabalho de layout',
    velhoT.naMesmaLargura.escritas > 0 && velhoT.naMesmaLargura.leituras > 0,
    velhoT.naMesmaLargura);

  await br.close();
  srv.close();
  console.log(`\n${falhas === 0 ? 'TUDO CERTO' : falhas + ' falha(s)'} — provar-iphone`);
  process.exit(falhas === 0 ? 0 : 1);
})();
