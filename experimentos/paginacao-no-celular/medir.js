#!/usr/bin/env node
'use strict';

/*
 * medir.js — quanto de tela cada desfecho do rodapé devolve, medido no navegador.
 *
 * «A tela fica com menos espaço» é uma afirmação sobre PIXELS. Aqui mede-se quantos, em cada
 * opção, e nas duas larguras — porque o pedido é explícito: no desktop a barra presa é boa, no
 * celular não. Uma solução que só olhe para um dos dois lados não serve.
 *
 * O que se mede, por opção:
 *
 *   1. a barra está VISÍVEL no fundo depois de rolar? (é o comportamento de hoje, e é o que se quer
 *      manter no desktop e perder no celular, conforme a opção);
 *   2. quantos PIXELS ela ocupa? (o custo, e é o número que decide);
 *   3. quantos pixels sobram para o formulário? (o lucro);
 *   4. na opção 2, o «⋯» devolve os controles escondidos? (uma barra compacta que esconde o que
 *      ninguém consegue abrir é pior do que a barra inteira);
 *   5. na opção 3, a barra sai ao descer e volta ao subir? (é o que ela promete);
 *   6. a página estoura na horizontal?
 *
 * Sem Chrome: NÃO FEITO — nunca um «passou» silencioso.
 *
 *   node experimentos/paginacao-no-celular/medir.js
 */

const path = require('path');
const fs = require('fs');

const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const PAGINA = 'file://' + path.join(__dirname, 'index.html');

function carregarPuppeteer() {
  const marp = path.join(process.execPath, '..', '..', 'lib', 'node_modules',
    '@marp-team', 'marp-cli');
  for (const c of [path.join(marp, 'node_modules', 'puppeteer-core'), 'puppeteer-core']) {
    try { return require(c); } catch (e) { /* tenta o seguinte */ }
  }
  return null;
}

const OPCOES = ['hoje', 'bloco', 'compacta', 'auto-esconde'];
const LARGURAS = [
  { nome: 'desktop 1280', largura: 1280, altura: 800, celular: false },
  { nome: 'celular 390', largura: 390, altura: 844, celular: true },
];

async function preparar(pagina) {
  await pagina.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
}

/**
 * ESPERA A TRANSIÇÃO DA BARRA, e não só um quadro. A opção 3 anima 180 ms (`transform` e
 * `opacity`); medir num `requestAnimationFrame` apanha-a a meio — a primeira versão disto leu
 * `opacity: 0.51` e reprovou um comportamento que estava certo. Um estado animado só é medido
 * depois de assentar.
 */
async function assentar(pagina) {
  await pagina.evaluate(() => new Promise((r) => setTimeout(r, 260)));
  await pagina.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
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
  await pagina.goto(PAGINA, { waitUntil: 'load' });
  await pagina.setViewport({ width: largura.largura, height: largura.altura });
  await preparar(pagina);
  await pagina.evaluate((o) => {
    document.querySelector('.bancada button[data-escolha="' + o + '"]').click();
    window.scrollTo(0, 0);
  }, opcao);
  await pagina.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

  // 1. Rola para o MEIO do formulário — é onde se está a lançar, e é onde a barra incomoda.
  await rolarPara(pagina, 900);
  await assentar(pagina);

  const medio = await pagina.evaluate(() => {
    const barra = document.querySelector('footer.barra-de-controle');
    const r = barra.getBoundingClientRect();
    const vh = window.innerHeight;
    const visivel = r.bottom > 0 && r.top < vh && getComputedStyle(barra).display !== 'none';
    // «Colada no fundo» = a barra encosta no fim da janela (o comportamento sticky de hoje).
    const colada = visivel && Math.abs(r.bottom - vh) < 4;
    return {
      visivel, colada, altura: Math.round(r.height),
      topo: Math.round(r.top), vh,
      estouro: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  // 2. A OPÇÃO 2: o «⋯» devolve o que a largura escondeu?
  let mais = null;
  if (opcao === 'compacta') {
    mais = await pagina.evaluate(() => {
      const barra = document.querySelector('footer.barra-de-controle');
      const seletor = barra.querySelector('#porPagina');
      const antes = seletor.getBoundingClientRect().height;
      document.getElementById('mais').click();
      const depois = seletor.getBoundingClientRect().height;
      const alturaAntes = 0;
      return { escondidoAntes: antes === 0, reveladoDepois: depois > 0,
        aberto: barra.getAttribute('data-aberto') };
    });
  }

  // 3. A OPÇÃO 3: sai ao descer, volta ao subir?
  let autoEsconde = null;
  if (opcao === 'auto-esconde') {
    await rolarPara(pagina, 1600);   // desce
    await assentar(pagina);
    const aoDescer = await pagina.evaluate(() => {
      const b = document.querySelector('footer.barra-de-controle');
      const r = b.getBoundingClientRect();
      return { topo: Math.round(r.top), vh: window.innerHeight,
        fora: r.top >= window.innerHeight - 4 || getComputedStyle(b).opacity === '0' };
    });
    await rolarPara(pagina, 900);    // sobe
    await assentar(pagina);
    const aoSubir = await pagina.evaluate(() => {
      const b = document.querySelector('footer.barra-de-controle');
      const r = b.getBoundingClientRect();
      return { visivel: r.top < window.innerHeight && r.bottom > 0,
        opacidade: getComputedStyle(b).opacity };
    });
    autoEsconde = { aoDescer, aoSubir };
  }

  // 4. O TOPO: a barra do lançamento continua alcançável? (o título não pode ser comido)
  const titulo = await pagina.evaluate(() => {
    const h1 = document.querySelector('header.doc h1');
    window.scrollTo(0, 0);
    const r = h1.getBoundingClientRect();
    const nav = document.querySelector('.topnav');
    return { visivel: r.top >= 0 && r.bottom <= window.innerHeight,
      navH: nav ? nav.offsetHeight : 0 };
  });

  return { ...medio, mais, autoEsconde, titulo };
}

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

  const navegador = await puppeteer.launch({ executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let falhas = 0;
  const verificar = (rotulo, ok, detalhe) => {
    console.log((ok ? '  ok    ' : '  FALHA ') + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
    if (!ok) falhas += 1;
  };

  try {
    const pagina = await navegador.newPage();
    const erros = [];
    pagina.on('pageerror', (e) => erros.push(String(e.message)));
    await pagina.goto(PAGINA, { waitUntil: 'load' });

    console.log('A paginação do lançamento — medido, não olhado\n');
    const medida = {};
    for (const largura of LARGURAS) {
      console.log('── ' + largura.nome + ' (' + largura.largura + '×' + largura.altura + ' px)');
      console.log('   opção           barra      ocupa   sobra p/ o formulário   estouro');
      for (const opcao of OPCOES) {
        const m = await medir(pagina, opcao, largura);
        medida[largura.nome + '|' + opcao] = m;
        const estado = m.visivel ? (m.colada ? 'colada' : 'no fluxo') : 'fora de vista';
        const sobra = m.vh - m.titulo.navH - (m.visivel ? m.altura : 0);
        console.log('   ' + opcao.padEnd(15) + estado.padEnd(14)
          + String(m.altura + 'px').padEnd(8) + String(sobra + 'px').padEnd(24)
          + (m.estouro > 1 ? m.estouro + 'px' : 'não'));
      }
      console.log('');
    }

    const d = (opcao) => medida['desktop 1280|' + opcao];
    const c = (opcao) => medida['celular 390|' + opcao];

    console.log('── O que fica provado');

    verificar('hoje a barra fica COLADA no fundo, nas duas larguras — é o comportamento atual',
      d('hoje').colada && c('hoje').colada, { desktop: d('hoje').colada, celular: c('hoje').colada });

    verificar('e no celular ela ocupa uma fatia real da tela',
      c('hoje').altura >= 40, c('hoje').altura + 'px de ' + c('hoje').vh);

    // OPÇÃO 1 — deixa de ser presa no celular, e continua presa no desktop.
    verificar('1 · no celular deixa de estar colada no fundo', !c('bloco').colada, c('bloco'));
    verificar('1 · e o desktop mantém a barra presa (a opção não estraga o lado que funcionava)',
      d('bloco').colada, d('bloco').colada);

    // OPÇÃO 2 — compacta: ocupa menos, e não esconde o que não se pode abrir.
    verificar('2 · a barra compacta ocupa MENOS altura no celular',
      c('compacta').altura > 0 && c('compacta').altura < c('hoje').altura,
      { hoje: c('hoje').altura, compacta: c('compacta').altura });
    verificar('2 · e o «⋯» devolve os controles que a largura escondeu',
      c('compacta').mais && c('compacta').mais.escondidoAntes && c('compacta').mais.reveladoDepois,
      c('compacta').mais);

    // OPÇÃO 3 — sai ao descer, volta ao subir.
    verificar('3 · a barra sai quando se desce', c('auto-esconde').autoEsconde.aoDescer.fora,
      c('auto-esconde').autoEsconde.aoDescer);
    verificar('3 · e volta quando se sobe', c('auto-esconde').autoEsconde.aoSubir.visivel
      && Number(c('auto-esconde').autoEsconde.aoSubir.opacidade) > 0.9,
      c('auto-esconde').autoEsconde.aoSubir);

    // O TÍTULO — o outro pedido: o rodapé não pode comer o topo, e vice-versa.
    for (const largura of LARGURAS) {
      for (const opcao of OPCOES) {
        const m = medida[largura.nome + '|' + opcao];
        verificar(largura.nome + ': ' + opcao + ' mantém o título do lançamento à vista no topo',
          m.titulo.visivel, m.titulo);
        verificar(largura.nome + ': ' + opcao + ' não estoura na horizontal', m.estouro <= 1, m.estouro);
      }
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
