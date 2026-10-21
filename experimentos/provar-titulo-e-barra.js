#!/usr/bin/env node
'use strict';

/**
 * provar-titulo-e-barra.js — o título que fica, e a barra do lançamento no celular.
 *
 * Por que existe (21/10/2026). A pesquisadora escolheu, entre as quatro opções medidas em
 * `experimentos/propostas/`, duas coisas:
 *
 *   · TÍTULO — a opção «B · encolhe»: o cabeçalho prende-se ao topo e diminui ao rolar,
 *     no desktop e no celular. A página da aula tem 15 ecrãs, e o título — que diz de que
 *     documento se trata — saía da tela na primeira rolagem.
 *   · BARRA — um MIX das opções 2 e 3: o rodapé de paginação do lançamento sai da frente
 *     ao descer, volta ao subir, e volta COMPACTO (só os botões e a contagem, o resto no
 *     «⋯»). Hoje ele ocupa 182px — 21% da tela de um telefone — mesmo sem haver o que
 *     folhear.
 *
 * O QUE NÃO SE PROVA OLHANDO O CSS: que o título FICA. Um `position: sticky` na folha não
 * diz se o elemento está preso, nem quanto ocupa, nem se o alvo de uma âncora chega por
 * baixo dele. Mede-se a GEOMETRIA depois de rolar, o ESTADO declarado, e a ALTURA
 * RESERVADA — que é o número que o resto da folha usa para não desenhar por cima.
 *
 * O que se prova:
 *
 *   A. o título (documento real, 1280 e 390)
 *      1. no topo não está preso nem encolhido — a página começa como sempre começou;
 *      2. ao rolar, o cabeçalho fica à vista: o topo dele encosta na barra e o fundo não
 *         passa da barra — ele está PRESO, e não apenas a caminho;
 *      3. …e ENCOLHE: o `h1` desce de corpo, o subtítulo e a ficha saem, e a altura que
 *         ele ocupa cai (medida, nos dois tamanhos de tela);
 *      4. `--titulo-preso` é a altura MEDIDA, e o `scroll-padding-top` passou a incluí-la —
 *         é o que impede a âncora de parar debaixo do título;
 *      5. o alvo de «Nesta página» chega INTEIRO: o topo dele fica abaixo do fundo do
 *         cabeçalho preso (a verificação que teria apanhado a regressão da proposta);
 *      6. sem JavaScript nada fica preso — a página é a de antes, e não uma página presa
 *         que nunca encolhe;
 *      7. a FOLHA DE CAPTURA fica de fora: ela é de usar em aula e imprimir;
 *      8. no papel o cabeçalho sai inteiro, no lugar: papel não tem estado de rolagem;
 *      9. em nenhuma das larguras a página estoura na horizontal.
 *
 *   B. a barra do lançamento (390 e 1280)
 *     10. no celular ela é COMPACTA: o seletor «Blocos por página» e a contagem saem, o «⋯»
 *         entra, e a altura cai (medida contra a de hoje);
 *     11. o «⋯» devolve o que escondeu, e diz o estado em `aria-expanded`;
 *     12. ao descer ela SAI (fora do ecrã, e sem receber clique) e ao subir VOLTA — e
 *         volta compacta;
 *     13. no desktop nada muda: nem compacta, nem se esconde;
 *     14. sem JavaScript a barra fica INTEIRA e o «⋯» não aparece — a versão compacta
 *         esconderia um controle que ninguém poderia abrir.
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-titulo-e-barra.js
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
  console.error('provar-titulo-e-barra: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
  process.exit(1);
}
const executavel = process.env.CHROME_PATH
  || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
if (!executavel) {
  console.error('provar-titulo-e-barra: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
  process.exit(1);
}

const PACOTE = 'professores/sapo-bailarino/ciclos/ciclo-01-batata-bale-nivel-1-teste-2';

/*
 * SERVIDOR ESTÁTICO com os assets apontados para a FONTE — o mesmo cuidado (e o mesmo
 * motivo) do `provar-dobra-do-indice`: a página pede `assets/style.css` e `assets/nav.js`,
 * e o que se quer medir é o arquivo que o gerador copia, e não uma cópia que pode estar
 * velha. O `check-identidade.js` («Circuito») confere que as cópias batem.
 */
const MAPA = { 'assets/style.css': 'tools/templates/ciclo.css', 'assets/nav.js': 'tools/templates/nav.js' };
function servir() {
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const assets = rel.match(/(?:^|\/)assets\/(style\.css|nav\.js)$/);
    const tentativas = [assets ? MAPA['assets/' + assets[1]] : MAPA[rel], rel, path.join(PACOTE, rel)].filter(Boolean);
    const alvo = tentativas.map((x) => path.join(raiz, x))
      .find((x) => x.startsWith(raiz) && fs.existsSync(x) && !fs.statSync(x).isDirectory());
    if (!alvo) { res.writeHead(404); res.end('nao encontrado'); return; }
    const tipo = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' }[path.extname(alvo)]
      || 'application/octet-stream';
    res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
    res.end(fs.readFileSync(alvo));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/** A leitura do título. Uma função só, para todas as medidas serem a mesma. */
const MEDIR_TITULO = () => {
  const r = document.documentElement;
  const cab = document.querySelector('header.doc') || document.querySelector('.titulo-fixo');
  if (!cab) return { temCabecalho: false };
  const h1 = cab.querySelector('h1');
  const caixa = cab.getBoundingClientRect();
  const barra = document.querySelector('.topnav');
  const barraAltura = barra ? barra.offsetHeight : 0;
  // `--titulo-preso` e `scroll-padding-top` COMPUTADOS: o CSS já resolveu o `calc`, e é
  // esse número que o navegador usa — o texto da declaração não prova nada.
  const cs = getComputedStyle(r);
  return {
    temCabecalho: true,
    fixo: r.getAttribute('data-titulo-fixo'),
    encolhido: r.getAttribute('data-titulo-encolhido'),
    corpoDoTitulo: parseFloat(getComputedStyle(h1).fontSize),
    alturaCabecalho: Math.round(caixa.height),
    topoCabecalho: Math.round(caixa.top),
    fundoCabecalho: Math.round(caixa.bottom),
    barraAltura,
    tituloPreso: cs.getPropertyValue('--titulo-preso').trim(),
    scrollPadding: parseFloat(cs.scrollPaddingTop),
    subtituloVisivel: (() => {
      const s = cab.querySelector('.subtitulo');
      return Boolean(s) && getComputedStyle(s).display !== 'none';
    })(),
    fichaVisivel: (() => {
      const f = cab.querySelector('.ficha');
      return Boolean(f) && getComputedStyle(f).display !== 'none';
    })(),
    posicao: getComputedStyle(cab).position,
    alturaDaTela: window.innerHeight,
    estouro: r.scrollWidth - r.clientWidth,
  };
};

/** A leitura da barra do lançamento. */
const MEDIR_BARRA = () => {
  const r = document.documentElement;
  const barra = document.querySelector('footer.barra-de-controle');
  if (!barra) return { temBarra: false };
  const visivel = (e) => Boolean(e) && getComputedStyle(e).display !== 'none'
    && e.getBoundingClientRect().height > 0;
  const caixa = barra.getBoundingClientRect();
  const cs = getComputedStyle(barra);
  const mais = document.querySelector('.mais');
  return {
    temBarra: true,
    compacta: r.getAttribute('data-barra-compacta'),
    rolando: r.getAttribute('data-rolando'),
    aberto: barra.getAttribute('data-aberto'),
    altura: Math.round(caixa.height),
    topo: Math.round(caixa.top),
    dentroDoEcra: caixa.top < window.innerHeight && caixa.bottom > 0,
    opacidade: parseFloat(cs.opacity),
    transformacao: cs.transform,
    clicavel: cs.pointerEvents !== 'none',
    seletorVisivel: visivel(barra.querySelector('.por-pagina')),
    contagemVisivel: visivel(barra.querySelector('.contagem')),
    maisVisivel: visivel(mais),
    /* O que está DEBAIXO do centro do «⋯». Um controle coberto por outro existe na
     marcação, mede 0 de distância e não recebe toque nenhum — e nenhuma medida de caixa
     o denuncia. Foi assim que o «voltar ao topo», fixo no canto, ficou por cima dele. */
    /* O «voltar ao topo» e a barra têm de ficar EMPILHADOS: fundo do círculo acima do
       topo da barra. É a medida que a colisão não deixa passar. */
    fundoDoTopo: (() => {
      const t = document.querySelector('.topo');
      return t && getComputedStyle(t).display !== 'none'
        ? Math.round(t.getBoundingClientRect().bottom) : null;
    })(),
    quemRecebeOToque: (() => {
      if (!visivel(mais)) return null;
      const c = mais.getBoundingClientRect();
      const alvo = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
      return alvo ? (alvo.id || alvo.className || alvo.tagName) : null;
    })(),
    maisExpandido: mais ? mais.getAttribute('aria-expanded') : null,
    alturaDaTela: window.innerHeight,
  };
};

(async () => {
  const { srv, base } = await servir();
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    if (!cond) falhas++;
    console.log((cond ? 'ok     ' : 'FALHA  ') + nome + (extra !== undefined ? ' → ' + JSON.stringify(extra) : ''));
  };

  const DOC = `${base}/${PACOTE}/aula-01.html`;
  const CAPTURA = `${base}/${PACOTE}/captura-aula-01.html`;
  const LANCAMENTO = `${base}/${PACOTE}/lancamento.html`;

  /* Rolar é uma MEDIDA, e o `scroll-behavior: smooth` da folha a estragaria: a rolagem
   * animada faz a leitura acontecer a meio caminho. Desliga-se o smooth e espera-se que o
   * `scrollY` CHEGUE ao alvo antes de medir — duas voltas de `requestAnimationFrame` não
   * garantem isso quando a distância é grande. */
  const rolarPara = async (y) => {
    await pg.evaluate((alvo) => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, alvo);
    }, y);
    await pg.waitForFunction((alvo) => Math.abs(window.scrollY - alvo) < 4, { timeout: 4000 }, y)
      .catch(() => {});
    await new Promise((r) => setTimeout(r, 260)); // as transições são de 150/180ms
  };

  // =========================================================== A. o título
  await pg.setViewport({ width: 1280, height: 800 });
  await pg.goto(DOC, { waitUntil: 'load' });
  const topo1280 = await pg.evaluate(MEDIR_TITULO);

  provar('o mecanismo está ligado, e o documento NASCE sem encolher',
    topo1280.fixo === 'sim' && topo1280.encolhido === 'nao', topo1280);
  provar('…e no topo o cabeçalho ainda não está preso (é o começo de sempre)',
    topo1280.posicao === 'sticky' && topo1280.topoCabecalho > topo1280.barraAltura + 4, topo1280);
  provar('no topo o subtítulo e a ficha estão à vista — nada foi escondido sem rolar',
    topo1280.subtituloVisivel === true && topo1280.fichaVisivel === true, topo1280);

  await rolarPara(1400);
  const preso1280 = await pg.evaluate(MEDIR_TITULO);

  provar('ao rolar, o cabeçalho está PRESO na barra (topo encostado, fundo à vista)',
    preso1280.encolhido === 'sim'
    && Math.abs(preso1280.topoCabecalho - preso1280.barraAltura) <= 2
    && preso1280.fundoCabecalho > preso1280.barraAltura, preso1280);
  provar('…e ENCOLHE: o corpo do título cai, o subtítulo e a ficha saem',
    preso1280.corpoDoTitulo < topo1280.corpoDoTitulo
    && preso1280.subtituloVisivel === false && preso1280.fichaVisivel === false,
    { antes: topo1280.corpoDoTitulo, depois: preso1280.corpoDoTitulo });
  provar('…e a altura que ele ocupa no desktop fica abaixo de 60px',
    preso1280.alturaCabecalho > 0 && preso1280.alturaCabecalho < 60,
    { encolhido: preso1280.alturaCabecalho, inteiro: topo1280.alturaCabecalho });
  provar('`--titulo-preso` é a altura MEDIDA, e não um número escrito à mão',
    preso1280.tituloPreso === `${preso1280.alturaCabecalho}px`
    || Math.abs(parseFloat(preso1280.tituloPreso) - preso1280.alturaCabecalho) <= 1,
    { variavel: preso1280.tituloPreso, medido: preso1280.alturaCabecalho });
  provar('…e o `scroll-padding-top` passou a incluir essa altura (barra + título + 8)',
    Math.abs(preso1280.scrollPadding - (preso1280.barraAltura + parseFloat(preso1280.tituloPreso) + 8)) <= 1.5,
    { scrollPadding: preso1280.scrollPadding, esperado: preso1280.barraAltura + parseFloat(preso1280.tituloPreso) + 8 });

  /* A ÂNCORA — a regressão que a proposta apanhou, e a razão de `--titulo-preso` existir.
   * Mede-se a partir de MEIO da página: saltar do topo não prova nada, porque ali nada está
   * preso, e o número sairia igual em qualquer implementação. */
  const terceiroLink = await pg.evaluate(() => {
    const a = [...document.querySelectorAll('.toc-local a[href^="#"]')][2];
    return a ? { href: a.getAttribute('href'), texto: a.textContent.trim() } : null;
  });
  await pg.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await pg.click('.toc-local a[href^="#"]:nth-of-type(3)').catch(() => {});
  await pg.evaluate((href) => {
    const a = [...document.querySelectorAll('.toc-local a[href^="#"]')].find((x) => x.getAttribute('href') === href);
    if (a) a.click();
  }, terceiroLink && terceiroLink.href);
  await new Promise((r) => setTimeout(r, 500));
  const aposAncora = await pg.evaluate((href) => {
    const alvo = document.getElementById(href.slice(1));
    const cab = document.querySelector('header.doc');
    if (!alvo || !cab) return null;
    const a = alvo.getBoundingClientRect();
    const c = cab.getBoundingClientRect();
    return { topoDoAlvo: Math.round(a.top), fundoDoCabecalho: Math.round(c.bottom),
             escondido: Math.round(c.bottom - a.top) };
  }, terceiroLink && terceiroLink.href);
  provar('o alvo de «Nesta página» chega INTEIRO, sem parar debaixo do título preso',
    Boolean(aposAncora) && aposAncora.topoDoAlvo >= aposAncora.fundoDoCabecalho,
    { link: terceiroLink, ...aposAncora });
  provar('…e em nenhuma largura a página estoura na horizontal',
    preso1280.estouro === 0, { estouro: preso1280.estouro });

  // --- 390: o caso que motivou o pedido (o título ocupava 44% da tela na opção A)
  await pg.setViewport({ width: 390, height: 844 });
  await pg.goto(DOC, { waitUntil: 'load' });
  await rolarPara(1200);
  const preso390 = await pg.evaluate(MEDIR_TITULO);
  provar('no celular o título também fica e encolhe — e ocupa menos de 10% da tela',
    preso390.encolhido === 'sim' && preso390.alturaCabecalho > 0
    && preso390.alturaCabecalho / preso390.alturaDaTela < 0.10,
    { altura: preso390.alturaCabecalho, tela: preso390.alturaDaTela,
      fracao: +(preso390.alturaCabecalho / preso390.alturaDaTela).toFixed(3) });
  provar('…e continua a dizer de que documento se trata (o `h1` está à vista e legível)',
    preso390.corpoDoTitulo >= 15 && preso390.corpoDoTitulo < 31 && preso390.fundoCabecalho > 0,
    { corpo: preso390.corpoDoTitulo, fundo: preso390.fundoCabecalho });
  provar('no celular a página também não estoura na horizontal', preso390.estouro === 0, preso390);

  // --- a folha de captura fica de fora
  await pg.goto(CAPTURA, { waitUntil: 'load' });
  const captura = await pg.evaluate(MEDIR_TITULO);
  await rolarPara(900);
  const capturaRolada = await pg.evaluate(MEDIR_TITULO);
  provar('a folha de captura NÃO é presa: o mecanismo não se liga nela',
    captura.fixo === null && capturaRolada.topoCabecalho < 0, { captura, rolada: capturaRolada });
  provar('…e o `scroll-padding-top` dela fica sem parcela de título (0px)',
    parseFloat(captura.scrollPadding) === captura.barraAltura + 8, captura);

  // --- sem JavaScript
  const semJs = await br.newPage();
  await semJs.setJavaScriptEnabled(false);
  await semJs.setViewport({ width: 1280, height: 800 });
  await semJs.goto(DOC, { waitUntil: 'load' });
  const semJsTopo = await semJs.evaluate(MEDIR_TITULO);
  provar('sem JavaScript nada fica preso — a página é a de antes, e não uma presa que nunca encolhe',
    semJsTopo.fixo === null && semJsTopo.posicao !== 'sticky', semJsTopo);
  await semJs.close();

  // --- no papel
  await pg.setViewport({ width: 1280, height: 800 });
  await pg.goto(DOC, { waitUntil: 'load' });
  await rolarPara(1400);
  await pg.emulateMediaType('print');
  const papel = await pg.evaluate(MEDIR_TITULO);
  provar('no papel o cabeçalho sai INTEIRO e no lugar: papel não tem estado de rolagem',
    papel.posicao === 'static' && papel.corpoDoTitulo === 31
    && papel.subtituloVisivel === true && papel.fichaVisivel === true, papel);
  await pg.emulateMediaType(null);

  // ====================================================== B. a barra do lançamento
  await pg.setViewport({ width: 390, height: 844 });
  await pg.goto(LANCAMENTO, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 300));
  const barra390 = await pg.evaluate(MEDIR_BARRA);

  provar('no celular a barra é COMPACTA: o seletor e a contagem saem, o «⋯» entra',
    barra390.compacta === 'sim' && barra390.seletorVisivel === false
    && barra390.contagemVisivel === false && barra390.maisVisivel === true, barra390);
  provar('…e ela ocupa bem menos que os 182px de hoje (abaixo de 70px)',
    barra390.altura > 0 && barra390.altura < 70, { altura: barra390.altura });
  provar('o «⋯» RECEBE O TOQUE: não há nada fixo por cima dele',
    barra390.quemRecebeOToque === 'maisPag', barra390.quemRecebeOToque);
  provar('…e o «voltar ao topo» fica ACIMA da barra, não por cima dela',
    barra390.fundoDoTopo !== null && barra390.fundoDoTopo <= barra390.topo,
    { fundoDoTopo: barra390.fundoDoTopo, topoDaBarra: barra390.topo });

  // o «⋯» devolve o que escondeu
  await pg.click('.mais');
  await new Promise((r) => setTimeout(r, 300));
  const barraAberta = await pg.evaluate(MEDIR_BARRA);
  provar('o «⋯» devolve o seletor e a contagem, e anuncia o estado',
    barraAberta.aberto === 'sim' && barraAberta.seletorVisivel === true
    && barraAberta.contagemVisivel === true && barraAberta.maisExpandido === 'true'
    && barraAberta.altura > barra390.altura, { fechada: barra390.altura, aberta: barraAberta.altura });
  provar('…e com a barra ABERTA o círculo sobe com ela — a altura é publicada, não suposta',
    barraAberta.fundoDoTopo !== null && barraAberta.fundoDoTopo <= barraAberta.topo
    && barraAberta.topo < barra390.topo,
    { fundoDoTopo: barraAberta.fundoDoTopo, topoDaBarra: barraAberta.topo });
  await pg.click('.mais');
  await new Promise((r) => setTimeout(r, 300));

  // esconde ao descer, volta ao subir
  await rolarPara(900);
  const descendo = await pg.evaluate(MEDIR_BARRA);
  provar('ao DESCER a barra sai do ecrã e deixa de receber clique',
    descendo.rolando === 'desce' && !descendo.dentroDoEcra
    && descendo.opacidade === 0 && descendo.clicavel === false, descendo);
  await rolarPara(600);
  const subindo = await pg.evaluate(MEDIR_BARRA);
  provar('ao SUBIR ela volta — e volta COMPACTA, como se pediu',
    subindo.rolando === 'sobe' && subindo.dentroDoEcra && subindo.opacidade === 1
    && subindo.clicavel === true && subindo.maisVisivel === true
    && subindo.seletorVisivel === false, subindo);

  // no desktop nada muda
  await pg.setViewport({ width: 1280, height: 800 });
  await pg.goto(LANCAMENTO, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 300));
  const barra1280 = await pg.evaluate(MEDIR_BARRA);
  await rolarPara(900);
  const barra1280Rolada = await pg.evaluate(MEDIR_BARRA);
  provar('no desktop a barra não é compacta nem se esconde — nada muda lá',
    barra1280.seletorVisivel === true && barra1280.maisVisivel === false
    && barra1280Rolada.dentroDoEcra === true && barra1280Rolada.opacidade === 1
    && barra1280Rolada.seletorVisivel === true,
    { parada: barra1280, rolada: barra1280Rolada });

  // sem JavaScript a barra fica inteira, e sem botão morto
  const semJsBarra = await br.newPage();
  await semJsBarra.setJavaScriptEnabled(false);
  await semJsBarra.setViewport({ width: 390, height: 844 });
  await semJsBarra.goto(LANCAMENTO, { waitUntil: 'load' });
  const barraSemJs = await semJsBarra.evaluate(MEDIR_BARRA);
  provar('sem JavaScript a barra fica INTEIRA e o «⋯» não aparece — nenhum controle morto',
    barraSemJs.compacta === null && barraSemJs.seletorVisivel === true
    && barraSemJs.maisVisivel === false && barraSemJs.altura > 70, barraSemJs);
  await semJsBarra.close();

  await br.close();
  srv.close();

  console.log(`\n${falhas === 0 ? 'TUDO OK' : falhas + ' falha(s)'} — provar-titulo-e-barra`);
  process.exit(falhas === 0 ? 0 : 1);
})();
