#!/usr/bin/env node
'use strict';

/*
 * medir.js — o que cada opção faz, medido no navegador.
 *
 * Um experimento que só se OLHA não é um experimento: «o título fica fixo» é uma afirmação sobre
 * GEOMETRIA, e geometria ou se mede ou se acha. Este script abre a demonstração nas duas larguras
 * que interessam e mede, para cada opção:
 *
 *   1. o título ainda está na tela depois de rolar? (é o pedido);
 *   2. quantos PIXELS DE ALTURA ele ocupa? (é o custo — e é o que decide no celular);
 *   3. um link do «Nesta página» leva ao lugar certo, ou a âncora fica escondida sob o título?
 *      (é o defeito que a correção pode criar);
 *   4. a página estoura na horizontal? (o defeito que a correção pode criar).
 *
 * Sem Chrome/Chromium: NÃO FEITO — nunca um «passou» silencioso.
 *
 *   node experimentos/dobra-do-titulo/medir.js
 */

const path = require('path');
const fs = require('fs');

const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const PAGINA = 'file://' + path.join(__dirname, 'index.html');

/*
 * OS ASSETS NÃO SÃO VERSIONADOS — são cópia do pacote publicado, e cópia de saída não se versiona.
 * Sem eles a demonstração abre sem folha de estilo e a medida não vale nada (tudo mede 0 px).
 * Copiam-se do pacote da escola no momento de medir, que é a regra desta pasta: «a folha dele deve
 * ser copiada da fonte no momento em que ele for montado».
 */
function garantirAssets() {
  const pasta = path.join(__dirname, 'assets');
  fs.mkdirSync(pasta, { recursive: true });
  const origem = path.join(__dirname, '..', '..', 'publicacao', 'batata', 'assets');
  for (const nome of ['style.css', 'nav.js', 'favicon.svg']) {
    const destino = path.join(pasta, nome);
    if (fs.existsSync(destino)) continue;
    if (!fs.existsSync(path.join(origem, nome))) {
      throw new Error('assets ausentes: monte a publicação antes (node tools/montar-publicacao.js batata)');
    }
    fs.copyFileSync(path.join(origem, nome), destino);
  }
}

function carregarPuppeteer() {
  const marp = path.join(process.execPath, '..', '..', 'lib', 'node_modules',
    '@marp-team', 'marp-cli');
  const candidatos = [
    path.join(marp, 'node_modules', 'puppeteer-core'),
    'puppeteer-core',
  ];
  for (const c of candidatos) {
    try { return require(c); } catch (e) { /* tenta o seguinte */ }
  }
  return null;
}

const OPCOES = ['atual', 'A', 'B', 'C', 'D'];
const LARGURAS = [
  { nome: 'desktop 1280', largura: 1280, altura: 800 },
  { nome: 'celular 390', largura: 390, altura: 844 },
];

/*
 * A ROLAGEM TEM DE SER INSTANTÂNEA, E ISSO É UMA ARMADILHA REAL.
 *
 * A folha do projeto declara `html { scroll-behavior: smooth }` — para os links de âncora, que
 * ficam bonitos. Mas `window.scrollTo(0, 1400)` passa a ANIMAR, e esperar dois
 * `requestAnimationFrame` (~32 ms) mede a página ainda a caminho do topo. A primeira versão desta
 * medição esperava só isso, e todas as opções apareciam iguais — a medir o ponto de partida.
 *
 * Desliga-se o `smooth` na página inteira antes de medir, e espera-se o `scrollY` chegar ao alvo.
 */
async function prepararRolagem(pagina) {
  await pagina.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
  });
}

async function rolarPara(pagina, y) {
  await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
  await pagina.evaluate((alvo) => new Promise((resolve) => {
    let voltas = 0;
    (function esperar() {
      if (Math.abs(window.scrollY - alvo) < 2 || voltas > 60) {
        return requestAnimationFrame(() => requestAnimationFrame(resolve));
      }
      voltas += 1;
      requestAnimationFrame(esperar);
    })();
  }), y);
}

async function medir(pagina, opcao, largura) {
  /*
   * RECARREGA ENTRE OPÇÕES. As opções mexem no DOM (a C move o título, a D escreve-o na
   * barra), e medir a seguinte sem limpar mede o que a anterior deixou. A primeira
   * versão disto não recarregava, e a tabela saía com «D» no rail e «atual» com o
   * título preso — a medir o estado do vizinho. Medir é isolar.
   */
  await pagina.goto(PAGINA, { waitUntil: 'load' });
  await pagina.setViewport({ width: largura.largura, height: largura.altura });
  await prepararRolagem(pagina);
  // A opção é escolhida pela bancada, para exercer o mesmo caminho que o dedo exerce.
  await pagina.evaluate((o) => {
    const b = document.querySelector('.bancada button[data-escolha="' + o + '"]');
    if (b) b.click();
    window.scrollTo(0, 0);
  }, opcao);
  await pagina.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

  const resultado = await pagina.evaluate(async () => {
    const espera = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const nav = document.querySelector('.topnav');
    const navH = nav.offsetHeight;
    const h1 = document.getElementById('titulo');

    /** Onde está o título AGORA — seja no cabeçalho, no rail ou dentro da barra. */
    function tituloVisivel() {
      const noRail = document.querySelector('.rail #titulo');
      const naBarra = document.querySelector('.topnav-titulo');
      const alvo = noRail || h1;
      const r = alvo.getBoundingClientRect();
      const estilo = getComputedStyle(alvo);
      const visivel = r.height > 0 && r.top >= 0 && r.top < window.innerHeight
        && estilo.visibility !== 'hidden' && estilo.display !== 'none';
      const naBarraVisivel = naBarra && getComputedStyle(naBarra).display !== 'none'
        && naBarra.textContent.trim().length > 0;
      return { visivel, naBarra: Boolean(naBarraVisivel), topo: Math.round(r.top),
        altura: Math.round(r.height), onde: noRail ? 'rail' : 'cabecalho' };
    }

    /** Quanta altura o «título preso» ocupa no topo, somando barra + cabeçalho preso. */
    function alturaOcupada() {
      const cab = document.getElementById('cabecalho');
      const r = cab.getBoundingClientRect();
      const preso = r.top <= navH + 1 && r.bottom > navH;
      return { preso, altura: preso ? Math.round(r.height) : 0 };
    }

    const inicial = tituloVisivel();
    // Rola o equivalente a duas telas: muito além do cabeçalho. Espera-se o scrollY chegar
    // ao alvo — um `scrollTo` não é síncrono, e o `smooth` da folha é desligado por fora.
    window.scrollTo(0, 1400);
    let voltas = 0;
    await new Promise((r) => {
      (function esperar() {
        if (Math.abs(window.scrollY - 1400) < 2 || voltas > 60) return r();
        voltas += 1;
        requestAnimationFrame(esperar);
      })();
    });
    await espera();
    await espera();
    const depois = tituloVisivel();
    const ocupada = alturaOcupada();

    /*
     * A ÂNCORA — MEDIDA NO CENÁRIO QUE ACONTECE. A primeira versão disto saltava a partir do
     * TOPO da página, e dava o mesmo número em todas as opções: no topo o título ainda não está
     * preso, e não há nada sob o que esconder o alvo. A medição não distinguia nada, e por isso
     * não provava nada.
     *
     * O gesto real é outro: rolar a página (o título prende), e SÓ ENTÃO tocar «Nesta página».
     * É assim que se mede, e é por isso que a medida passa a variar — a opção A, com 146 px
     * presos, esconde o alvo se o `scroll-padding-top` não for corrigido.
     */
    let ancora = null;
    {
      const link = document.querySelector('.toc-local a[href^="#"]');
      if (link) {
        const id = link.getAttribute('href').slice(1);
        // 1. rola para longe: o título prende.
        window.scrollTo(0, 1400);
        await espera();
        await espera();
        // 2. CLICA o link, como a pessoa faz. Antes disto a medição chamava `scrollIntoView`
        //    directamente — e media o caminho que ninguém percorre.
        link.click();
        await espera();
        await espera();
        await espera();
        const alvoAncora = document.getElementById(id);
        const r = alvoAncora.getBoundingClientRect();
        // O alvo tem de ficar ABAIXO do que está preso, e não só abaixo da barra.
        const cab = document.getElementById('cabecalho');
        const rc = cab.getBoundingClientRect();
        const presoAte = (rc.top <= navH + 1 && rc.bottom > navH) ? Math.max(navH, rc.bottom) : navH;
        ancora = { id, topo: Math.round(r.top), navH, presoAte: Math.round(presoAte),
          escondido: r.top < presoAte - 1 };
      }
    }

    // O ESTOURO HORIZONTAL.
    const estouro = document.documentElement.scrollWidth - document.documentElement.clientWidth;

    return { inicial, depois, ocupada, ancora, estouro, navH };
  });

  return resultado;
}

async function principal() {
  garantirAssets();
  if (!fs.existsSync(CHROME)) {
    console.error('medir: Chrome não encontrado em ' + CHROME + ' — NÃO FEITO.');
    process.exit(2);
  }
  const puppeteer = carregarPuppeteer();
  if (!puppeteer) {
    console.error('medir: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(2);
  }

  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  let falhas = 0;
  try {
    const pagina = await navegador.newPage();
    const erros = [];
    pagina.on('pageerror', (e) => erros.push(String(e.message)));
    await pagina.goto(PAGINA, { waitUntil: 'load' });

    console.log('O título que não se perde — medido, não olhado');
    console.log('página: ' + PAGINA + '\n');

    for (const largura of LARGURAS) {
      console.log('── ' + largura.nome + ' (' + largura.largura + '×' + largura.altura + ' px)');
      console.log('   opção   título na tela   ocupa   âncora        estouro');
      for (const opcao of OPCOES) {
        const m = await medir(pagina, opcao, largura);
        const tituloOk = m.depois.visivel || m.depois.naBarra;
        const onde = m.depois.naBarra ? 'na barra' : (m.depois.visivel ? m.depois.onde : '—');
        const ancora = m.ancora
          ? (m.ancora.escondido ? 'ESCONDIDA' : 'ok')
          : 'n/a';
        const linha = '   ' + String(opcao).padEnd(7)
          + (tituloOk ? 'sim (' + onde + ')' : 'NÃO').padEnd(18)
          + String(m.ocupada.altura + 'px').padEnd(9)
          + ancora.padEnd(14)
          + (m.estouro > 1 ? m.estouro + 'px' : 'não');
        console.log(linha);
      }
      console.log('');
    }

    /*
     * OS VEREDICTOS. Só se afirma o que se mediu — e cada afirmação tem a sua condição, porque
     * nenhuma opção é boa em tudo: é isso que a comparação existe para mostrar.
     */
    console.log('── O que fica provado');
    const desktop = {};
    const celular = {};
    for (const opcao of OPCOES) {
      desktop[opcao] = await medir(pagina, opcao, LARGURAS[0]);
      celular[opcao] = await medir(pagina, opcao, LARGURAS[1]);
    }
    const verificar = (rotulo, ok, detalhe) => {
      console.log((ok ? '  ok    ' : '  FALHA ') + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
      if (!ok) falhas += 1;
    };

    verificar('hoje (0) o título NÃO se vê depois de rolar — é o defeito',
      !(desktop.atual.depois.visivel || desktop.atual.depois.naBarra)
      && !(celular.atual.depois.visivel || celular.atual.depois.naBarra));

    for (const largura of ['desktop', 'celular']) {
      const m = largura === 'desktop' ? desktop : celular;
      for (const opcao of ['A', 'B', 'C', 'D']) {
        const ok = m[opcao].depois.visivel || m[opcao].depois.naBarra;
        verificar(largura + ': a opção ' + opcao + ' mantém o título à vista', ok,
          { onde: m[opcao].depois.naBarra ? 'na barra' : m[opcao].depois.onde });
      }
    }

    verificar('B ocupa MENOS altura do que A no celular (é o que a «encolhe» promete)',
      celular.B.ocupada.altura > 0 && celular.B.ocupada.altura < celular.A.ocupada.altura,
      { A: celular.A.ocupada.altura, B: celular.B.ocupada.altura });

    verificar('D não ocupa NENHUMA altura no celular (o título vive na barra)',
      celular.D.ocupada.altura === 0, celular.D.ocupada.altura);

    verificar('C põe o título na coluna no desktop', desktop.C.depois.onde === 'rail',
      desktop.C.depois.onde);
    verificar('e no celular C não inventa coluna — cai no cabeçalho',
      celular.C.depois.onde === 'cabecalho' && celular.C.depois.visivel, celular.C.depois.onde);

    for (const largura of ['desktop', 'celular']) {
      const m = largura === 'desktop' ? desktop : celular;
      for (const opcao of OPCOES) {
        verificar(largura + ': a opção ' + opcao + ' não estoura na horizontal',
          m[opcao].estouro <= 1, m[opcao].estouro);
      }
    }

    // A ÂNCORA é o defeito que a correção pode criar — e agora mede-se no cenário que o cria.
    for (const largura of ['desktop', 'celular']) {
      const m = largura === 'desktop' ? desktop : celular;
      for (const opcao of OPCOES) {
        const a = m[opcao].ancora;
        if (!a) continue;
        verificar(largura + ': a opção ' + opcao + ' não esconde o alvo da âncora sob o título preso',
          !a.escondido, a);
      }
    }

    /*
     * O CONTROLO NEGATIVO DA ÂNCORA. Uma asserção que passa em todas as opções pode estar a passar
     * por não medir nada — foi o que aconteceu à primeira versão. Aqui desliga-se o ajuste (a
     * página expõe `__desligarAjusteDeAncora`), e a opção A, que é a mais alta, TEM de esconder o
     * alvo. Se não esconder, a medida anterior não estava a medir o que dizia.
     */
    for (const largura of [LARGURAS[0], LARGURAS[1]]) {
      await pagina.goto(PAGINA, { waitUntil: 'load' });
      await pagina.setViewport({ width: largura.largura, height: largura.altura });
      await prepararRolagem(pagina);
      const controlo = await pagina.evaluate(async () => {
        const espera = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        document.querySelector('.bancada button[data-escolha="A"]').click();
        window.scrollTo(0, 1400);
        await espera(); await espera();
        window.__desligarAjusteDeAncora();
        const ligacao = document.querySelector('.toc-local a[href^="#"]');
        const id = ligacao.getAttribute('href').slice(1);
        const alvo = document.getElementById(id);
        ligacao.click();
        await espera(); await espera();
        const r = alvo.getBoundingClientRect();
        const cab = document.getElementById('cabecalho').getBoundingClientRect();
        return { topo: Math.round(r.top), presoAte: Math.round(cab.bottom),
          escondido: r.top < cab.bottom - 1 };
      });
      verificar('controlo negativo — sem o ajuste, a opção A ESCONDE o alvo da âncora ('
        + largura.nome + ')', controlo.escondido, controlo);
    }

    if (erros.length) {
      console.log('\n  FALHA erro de JavaScript na página: ' + erros.join(' · '));
      falhas += 1;
    } else {
      console.log('  ok    nenhum erro de JavaScript');
    }
  } finally {
    await navegador.close();
  }

  console.log('\n' + (falhas === 0 ? 'TUDO CERTO — medido, 0 falha(s).' : 'FALHOU — ' + falhas + ' medida(s).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((e) => { console.error(e); process.exit(1); });
