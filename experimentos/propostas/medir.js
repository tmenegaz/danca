#!/usr/bin/env node
'use strict';

/*
 * medir.js — o que cada proposta faz, medido no navegador.
 *
 * «O título fica preso» e «a barra ocupa menos» são afirmações sobre GEOMETRIA. Ou se medem, ou se
 * acham. Este script abre as duas propostas, nas duas larguras, e mede — por opção:
 *
 *   · o título continua à vista depois de rolar? (é o pedido)
 *   · quantos pixels de altura ele ocupa? (é o custo — e é o que decide no celular)
 *   · a barra de paginação está colada no fundo? quanto ocupa?
 *   · um link do «Nesta página» leva ao lugar, ou o alvo fica escondido sob o título?
 *   · a página estoura na horizontal?
 *
 * E mede também a BANCADA, que é a moldura: ela não pode tapar o que demonstra. Essa foi a falha
 * da primeira versão — o painel ocupava 230 dos 390 px do celular, por cima do rodapé que existia
 * para mostrar.
 *
 * Sem Chrome/Chromium: NÃO FEITO — nunca um «passou» silencioso.
 *
 *   node experimentos/propostas/medir.js
 *   CHROME_PATH=/usr/bin/chromium node experimentos/propostas/medir.js
 */

const path = require('path');
const fs = require('fs');

const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const BASE = 'file://' + __dirname + path.sep;

function carregarPuppeteer() {
  const marp = path.join(process.execPath, '..', '..', 'lib', 'node_modules',
    '@marp-team', 'marp-cli');
  for (const c of [path.join(marp, 'node_modules', 'puppeteer-core'), 'puppeteer-core']) {
    try { return require(c); } catch (e) { /* tenta o seguinte */ }
  }
  return null;
}

const LARGURAS = [
  { nome: 'desktop 1280', largura: 1280, altura: 800 },
  { nome: 'celular 390', largura: 390, altura: 844 },
];

const TITULO = [
  { id: 'atual', nome: 'hoje' },
  { id: 'A', nome: 'A · preso no topo' },
  { id: 'B', nome: 'B · encolhe' },
  { id: 'C', nome: 'C · vai para a coluna' },
  { id: 'D', nome: 'D · vai para o menu' },
];

const PAGINACAO = [
  { id: 'hoje', nome: 'hoje' },
  { id: 'bloco', nome: '1 · vira bloco' },
  { id: 'compacta', nome: '2 · compacta' },
  { id: 'auto-esconde', nome: '3 · esconde ao descer' },
];

let n = 0;
let falhas = 0;
function verificar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  ok    ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

/**
 * A ROLAGEM TEM DE SER INSTANTÂNEA. A folha do projeto declara `scroll-behavior: smooth` para os
 * links de âncora; com ela, `scrollTo` anima e esperar dois quadros mede a página ainda a caminho.
 * A primeira versão disto media o ponto de partida e dava todas as opções iguais.
 */
async function preparar(pagina) {
  await pagina.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
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

/** Espera uma transição (a opção 3 anima 180 ms) — medir a meio lê o estado errado. */
async function assentar(pagina) {
  await pagina.evaluate(() => new Promise((r) => setTimeout(r, 280)));
  await pagina.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/**
 * ABRE a proposta com a opção escolhida e o PAINEL FECHADO. Medir com o painel aberto mediria o
 * painel: é a moldura, não o desenho.
 */
async function abrir(pagina, arquivo, opcao, largura) {
  await pagina.goto(BASE + arquivo, { waitUntil: 'load' });
  await pagina.setViewport({ width: largura.largura, height: largura.altura });
  await preparar(pagina);
  const estado = await pagina.evaluate((o) => {
    const b = document.querySelector('.bancada-opcoes button[data-escolha="' + o + '"]');
    if (!b) return { erro: 'opção ausente: ' + o };
    b.click();
    document.getElementById('bancada-ver').click();
    return {
      painelFechado: document.getElementById('bancada').hidden,
      abaVisivel: !document.getElementById('bancada-aba').hidden,
      // A ABA DIZ O QUE ESTÁ ACTIVO — sem isto, fechado o painel, não se sabe o que se está a ver.
      abaDiz: document.getElementById('bancada-aba').textContent.trim().replace(/\s+/g, ' '),
    };
  }, opcao);
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await assentar(pagina);
  return estado;
}

// ------------------------------------------------------------------ proposta 1: o título

async function medirTitulo(pagina, opcao, largura) {
  const estado = await abrir(pagina, 'proposta-titulo.html', opcao, largura);
  await rolarPara(pagina, 1400);
  await assentar(pagina);

  const m = await pagina.evaluate(async () => {
    const espera = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const nav = document.querySelector('.topnav');
    const navH = nav.offsetHeight;
    const h1 = document.getElementById('titulo');
    const cab = document.getElementById('cabecalho');

    const noRail = document.querySelector('.rail #titulo');
    const naBarra = document.querySelector('.topnav-titulo');
    const alvo = noRail || h1;
    const r = alvo.getBoundingClientRect();
    const estilo = getComputedStyle(alvo);
    const visivel = r.height > 0 && r.top >= 0 && r.top < window.innerHeight
      && estilo.visibility !== 'hidden' && estilo.display !== 'none';
    const naBarraVisivel = Boolean(naBarra) && getComputedStyle(naBarra).display !== 'none'
      && naBarra.textContent.trim().length > 0;

    const rc = cab.getBoundingClientRect();
    const preso = rc.top <= navH + 1 && rc.bottom > navH;

    // A ÂNCORA — medida no cenário que a cria: já se rolou (o título está preso), e só então se
    // salta. Saltar do topo não distingue nada, e foi o erro da primeira versão.
    const link = document.querySelector('.toc-local a[href^="#"]');
    let ancora = null;
    if (link) {
      const id = link.getAttribute('href').slice(1);
      link.click();
      await espera(); await espera();
      const alvoA = document.getElementById(id);
      const ra = alvoA.getBoundingClientRect();
      const rcA = cab.getBoundingClientRect();
      const presoAte = (rcA.top <= navH + 1 && rcA.bottom > navH) ? Math.max(navH, rcA.bottom) : navH;
      ancora = { topo: Math.round(ra.top), presoAte: Math.round(presoAte),
        escondido: ra.top < presoAte - 1 };
    }

    return {
      visivel, naBarra: naBarraVisivel, onde: noRail ? 'coluna' : 'cabecalho',
      altura: preso ? Math.round(rc.height) : 0, preso,
      ancora, vh: window.innerHeight, navH,
      estouro: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  return Object.assign({}, m, { estado });
}

// --------------------------------------------------------------- proposta 2: a paginação

async function medirPaginacao(pagina, opcao, largura) {
  const estado = await abrir(pagina, 'proposta-paginacao.html', opcao, largura);
  await rolarPara(pagina, 900);
  await assentar(pagina);

  const m = await pagina.evaluate(() => {
    const barra = document.querySelector('footer.barra-de-controle');
    const r = barra.getBoundingClientRect();
    const vh = window.innerHeight;
    const visivel = r.bottom > 0 && r.top < vh && getComputedStyle(barra).display !== 'none';
    const colada = visivel && Math.abs(r.bottom - vh) < 4;
    const nav = document.querySelector('.topnav');
    return {
      visivel, colada, altura: Math.round(r.height), vh,
      navH: nav ? nav.offsetHeight : 0,
      sobra: vh - (nav ? nav.offsetHeight : 0) - (visivel ? Math.round(r.height) : 0),
      estouro: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  let mais = null;
  if (opcao === 'compacta') {
    mais = await pagina.evaluate(() => {
      const barra = document.querySelector('footer.barra-de-controle');
      const seletor = barra.querySelector('#porPagina');
      const antes = seletor.getBoundingClientRect().height;
      document.getElementById('mais').click();
      const depois = seletor.getBoundingClientRect().height;
      return { escondidoAntes: antes === 0, reveladoDepois: depois > 0 };
    });
  }

  let auto = null;
  if (opcao === 'auto-esconde') {
    await rolarPara(pagina, 1800);
    await assentar(pagina);
    const desce = await pagina.evaluate(() => {
      const b = document.querySelector('footer.barra-de-controle');
      const r = b.getBoundingClientRect();
      return { fora: r.top >= window.innerHeight - 4 || getComputedStyle(b).opacity === '0' };
    });
    await rolarPara(pagina, 900);
    await assentar(pagina);
    const sobe = await pagina.evaluate(() => {
      const b = document.querySelector('footer.barra-de-controle');
      const r = b.getBoundingClientRect();
      return { visivel: r.top < window.innerHeight && r.bottom > 0,
        opacidade: getComputedStyle(b).opacity };
    });
    auto = { desce, sobe };
  }

  return Object.assign({}, m, { estado, mais, auto });
}

// ------------------------------------------------------------- a moldura: a própria bancada

/**
 * A BANCADA NÃO PODE TAPAR O QUE DEMONSTRA. Esta secção existe por causa da primeira versão: no
 * celular o painel ocupava 230 dos 390 px e ficava por cima do rodapé de paginação que ela existe
 * para mostrar. Mede-se com o painel ABERTO (é quando ele ocupa espaço) e com ele FECHADO.
 */
async function medirBancada(pagina, arquivo, largura) {
  await pagina.goto(BASE + arquivo, { waitUntil: 'load' });
  await pagina.setViewport({ width: largura.largura, height: largura.altura });
  await new Promise((r) => setTimeout(r, 250));

  const aberto = await pagina.evaluate(() => {
    const painel = document.getElementById('bancada');
    const caixa = painel.querySelector('.bancada-caixa');
    const r = caixa.getBoundingClientRect();
    return {
      visivel: !painel.hidden,
      largura: Math.round(r.width),
      altura: Math.round(r.height),
      vh: window.innerHeight,
      // O painel tem de CABER e ser rolável: um painel maior do que a tela esconde o botão de sair.
      cabe: r.height <= window.innerHeight,
      rolavel: caixa.scrollHeight <= caixa.clientHeight + 1 || getComputedStyle(caixa).overflowY === 'auto',
      opcoes: document.querySelectorAll('.bancada-opcoes button').length,
      temSaida: Boolean(document.getElementById('bancada-ver')),
    };
  });

  await pagina.evaluate(() => document.getElementById('bancada-ver').click());
  await new Promise((r) => setTimeout(r, 250));

  const fechado = await pagina.evaluate(() => {
    const painel = document.getElementById('bancada');
    const aba = document.getElementById('bancada-aba');
    const ra = aba.getBoundingClientRect();
    // A aba não pode passar por cima da coluna de leitura: a margem da página são 24 px.
    const coluna = document.querySelector('header.doc, main');
    const rc = coluna ? coluna.getBoundingClientRect() : null;
    return {
      painelFechado: painel.hidden,
      abaVisivel: !aba.hidden,
      abaLargura: Math.round(ra.width),
      // «A aba não cobre a coluna» = ela termina antes de a coluna começar.
      abaNaMargem: rc ? ra.right <= rc.left + 1 : null,
      estouro: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  return { aberto, fechado };
}

// ---------------------------------------------------------------------------------- principal

async function principal() {
  if (!fs.existsSync(CHROME)) {
    console.error('medir: Chrome não encontrado em ' + CHROME + ' — NÃO FEITO.');
    process.exit(2);
  }
  const puppeteer = carregarPuppeteer();
  if (!puppeteer) {
    console.error('medir: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(2);
  }
  for (const arquivo of ['index.html', 'proposta-titulo.html', 'proposta-paginacao.html']) {
    if (!fs.existsSync(path.join(__dirname, arquivo))) {
      console.error('medir: falta ' + arquivo + ' — corra antes `node experimentos/propostas/construir.js`.');
      process.exit(2);
    }
  }

  const navegador = await puppeteer.launch({ executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const erros = [];
  try {
    const pagina = await navegador.newPage();
    pagina.on('pageerror', (e) => erros.push(String(e.message)));
    await pagina.goto(BASE + 'index.html', { waitUntil: 'load' });

    // ── A. A MOLDURA ────────────────────────────────────────────────────────────────
    console.log('A. A bancada não tapa o que demonstra');
    const molduras = {};
    for (const largura of LARGURAS) {
      for (const arquivo of ['proposta-titulo.html', 'proposta-paginacao.html']) {
        const m = await medirBancada(pagina, arquivo, largura);
        molduras[largura.nome + '|' + arquivo] = m;
        const chave = largura.nome + ' · ' + arquivo.replace('proposta-', '').replace('.html', '');
        verificar(chave + ': o painel abre no carregamento', m.aberto.visivel);
        verificar(chave + ': o painel CABE na tela', m.aberto.cabe,
          { altura: m.aberto.altura, tela: m.aberto.vh });
        verificar(chave + ': o painel tem saída («Ver a página»)', m.aberto.temSaida);
        verificar(chave + ': depois de fechar, sobra a aba — e o painel sai',
          m.fechado.painelFechado && m.fechado.abaVisivel, m.fechado);
        verificar(chave + ': a aba fica na margem, sem cobrir a coluna de leitura',
          m.fechado.abaNaMargem === true || m.fechado.abaLargura <= 24, m.fechado);
        verificar(chave + ': nada estoura na horizontal', m.fechado.estouro <= 1, m.fechado.estouro);
      }
    }

    // ── B. PROPOSTA 1 — O TÍTULO ────────────────────────────────────────────────────
    console.log('\nB. Proposta 1 — o título que não se perde');
    const titulo = {};
    for (const largura of LARGURAS) {
      console.log('\n   ' + largura.nome);
      console.log('   opção                   título à vista   ocupa   âncora     estouro');
      for (const o of TITULO) {
        const m = await medirTitulo(pagina, o.id, largura);
        titulo[largura.nome + '|' + o.id] = m;
        console.log('   ' + o.nome.padEnd(23)
          + (m.visivel ? 'sim (' + m.onde + ')' : m.naBarra ? 'sim (na barra)' : 'NÃO').padEnd(17)
          + String(m.altura + 'px').padEnd(8)
          + (m.ancora ? (m.ancora.escondido ? 'ESCONDIDA' : 'ok') : 'n/a').padEnd(11)
          + (m.estouro > 1 ? m.estouro + 'px' : 'não'));
      }
    }

    const t = (largura, id) => titulo[largura + '|' + id];
    verificar('hoje o título NÃO se vê depois de rolar — é o defeito',
      !(t('desktop 1280', 'atual').visivel || t('desktop 1280', 'atual').naBarra)
      && !(t('celular 390', 'atual').visivel || t('celular 390', 'atual').naBarra));
    for (const largura of ['desktop 1280', 'celular 390']) {
      for (const id of ['A', 'B', 'C', 'D']) {
        const m = t(largura, id);
        verificar(largura + ' · ' + id + ': o título fica à vista',
          m.visivel || m.naBarra, { onde: m.naBarra ? 'na barra' : m.onde });
        verificar(largura + ' · ' + id + ': não esconde o alvo da âncora',
          !m.ancora || !m.ancora.escondido, m.ancora);
        verificar(largura + ' · ' + id + ': não estoura na horizontal', m.estouro <= 1, m.estouro);
      }
    }
    verificar('B ocupa menos altura do que A no celular (é o que «encolhe» promete)',
      t('celular 390', 'B').altura > 0 && t('celular 390', 'B').altura < t('celular 390', 'A').altura,
      { A: t('celular 390', 'A').altura, B: t('celular 390', 'B').altura });
    verificar('D não ocupa altura no celular (o título vive na barra)',
      t('celular 390', 'D').altura === 0, t('celular 390', 'D').altura);
    verificar('C põe o título na coluna, no desktop', t('desktop 1280', 'C').onde === 'coluna',
      t('desktop 1280', 'C').onde);

    // ── C. PROPOSTA 2 — A PAGINAÇÃO ─────────────────────────────────────────────────
    console.log('\nC. Proposta 2 — a paginação no celular');
    const pag = {};
    for (const largura of LARGURAS) {
      console.log('\n   ' + largura.nome);
      console.log('   opção                   barra          ocupa   sobra   estouro');
      for (const o of PAGINACAO) {
        const m = await medirPaginacao(pagina, o.id, largura);
        pag[largura.nome + '|' + o.id] = m;
        console.log('   ' + o.nome.padEnd(23)
          + (m.visivel ? (m.colada ? 'colada' : 'no fluxo') : 'fora de vista').padEnd(15)
          + String(m.altura + 'px').padEnd(8)
          + String(m.sobra + 'px').padEnd(8)
          + (m.estouro > 1 ? m.estouro + 'px' : 'não'));
      }
    }

    const g = (largura, id) => pag[largura + '|' + id];
    verificar('hoje a barra fica colada no fundo, nas duas larguras',
      g('desktop 1280', 'hoje').colada && g('celular 390', 'hoje').colada);
    verificar('e no celular ocupa uma fatia real da tela',
      g('celular 390', 'hoje').altura >= 40, g('celular 390', 'hoje').altura);
    verificar('1 · no celular deixa de estar colada', !g('celular 390', 'bloco').colada);
    verificar('1 · e o desktop mantém a barra presa (não estraga o lado que funcionava)',
      g('desktop 1280', 'bloco').colada);
    verificar('2 · a compacta ocupa menos altura no celular',
      g('celular 390', 'compacta').altura > 0
      && g('celular 390', 'compacta').altura < g('celular 390', 'hoje').altura,
      { hoje: g('celular 390', 'hoje').altura, compacta: g('celular 390', 'compacta').altura });
    verificar('2 · e o «⋯» devolve os controles escondidos',
      g('celular 390', 'compacta').mais.escondidoAntes
      && g('celular 390', 'compacta').mais.reveladoDepois, g('celular 390', 'compacta').mais);
    verificar('3 · a barra sai ao descer', g('celular 390', 'auto-esconde').auto.desce.fora,
      g('celular 390', 'auto-esconde').auto.desce);
    verificar('3 · e volta ao subir',
      g('celular 390', 'auto-esconde').auto.sobe.visivel
      && Number(g('celular 390', 'auto-esconde').auto.sobe.opacidade) > 0.9,
      g('celular 390', 'auto-esconde').auto.sobe);
    for (const largura of ['desktop 1280', 'celular 390']) {
      for (const o of PAGINACAO) {
        verificar(largura + ' · ' + o.nome + ': não estoura na horizontal',
          g(largura, o.id).estouro <= 1, g(largura, o.id).estouro);
      }
    }

    // ── D. A ABA DIZ O QUE ESTÁ ACTIVO ──────────────────────────────────────────────
    console.log('\nD. A aba diz qual é a opção — sem ela, fechado o painel, não se sabe o que se vê');
    for (const [arquivo, lista] of [['proposta-titulo.html', TITULO], ['proposta-paginacao.html', PAGINACAO]]) {
      for (const o of lista) {
        const e = await abrir(pagina, arquivo, o.id, LARGURAS[1]);
        verificar(arquivo.replace('proposta-', '').replace('.html', '') + ' · ' + o.nome
          + ': a aba nomeia a opção', e.abaDiz && e.abaDiz.length > 3
          && e.abaDiz.indexOf(o.id === 'atual' || o.id === 'hoje' ? '0' : o.nome.charAt(0)) !== -1,
          e.abaDiz);
      }
    }

    if (erros.length) {
      console.log('\n  FALHA erro de JavaScript: ' + erros.join(' · '));
      falhas += 1;
    } else {
      console.log('\n  ok    nenhum erro de JavaScript em nenhuma das páginas');
    }
  } finally {
    await navegador.close();
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' medidas, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' medida(s).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((e) => { console.error(e); process.exit(1); });
