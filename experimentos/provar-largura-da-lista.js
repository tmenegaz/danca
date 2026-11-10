#!/usr/bin/env node
'use strict';

/**
 * provar-largura-da-lista.js — a listagem do Produção não encolhe até ficar ilegível
 * na faixa dos monitores intermediários.
 *
 * Por que existe. A 10/11/2026 a pesquisadora mudou a resolução do monitor de 1920×1080
 * para 1366×768 e viu «as coisas acavaladas»: as margens das etiquetas e o espaçamento da
 * tela do Lastro tinham desaparecido. A suspeita dela era `px` em vez de `rem`; a causa era
 * outra, e só se vê a medir.
 *
 * MEDIDO (bancada local, listagem de alunos com dados de forma realista): a `.secao` é uma
 * grade de duas colunas — formulário e listagem — e a do formulário tinha um TECTO que
 * também funcionava como PISO: `minmax(0,34rem)` tomava sempre os 544px inteiros, e o `1fr`
 * da listagem ficava com o resto. A 1920 a listagem tem 1115px; a 1366, 561px. Dentro dessa
 * coluna, a linha tem três partes que não cedem (o nome, a etiqueta «turmas · …» com 240px e
 * os botões com 65px) — e quem cedia era o NOME, que não tem segunda fonte: **163px a 1366**,
 * contra **394px a 1024**, onde a secção já é uma coluna. Isto é, entre 1141 e ~1500 a
 * listagem estava pior do que no telemóvel (a 768 o nome tem 338px).
 *
 * O QUE SE PROVA AQUI, e é geometria medida num navegador de verdade:
 *
 *   A. nada transborda na horizontal, em nenhuma das doze larguras;
 *   B. na faixa da fita (≥ 1141px) o NOME nunca fica abaixo de 11rem — é o piso que impede
 *      o defeito de voltar, e é o que a folha declara;
 *   C. as ações nunca saem da linha (a etiqueta encolhe, os botões não são empurrados);
 *   D. a coluna da listagem a 1366 tem pelo menos 640px (era 561 antes da correção);
 *   E. o formulário nunca fica abaixo de 20rem nem acima de 34rem — e a 1920 mede
 *      exactamente 544px, porque a tela larga não podia mudar;
 *   F. a 1920 a listagem mede exactamente o que media antes da correção (1115px, nome 717px).
 *
 * E TEM CONTROLE NEGATIVO, porque uma prova que só sabe dizer «passou» não prova nada:
 * reposta a regra antiga (`minmax(0,34rem)` e `min-width:0`), as asserções B, D e F têm de
 * FALHAR. Se passarem com a regra antiga, a prova não mede o que diz medir.
 *
 * Requer Chrome/Chromium (usa o puppeteer-core que vem com o marp-cli global), como o
 * `provar-celular.js`. Sem ele o resultado é declarado NÃO FEITO — nunca um «passou» calado.
 *
 * Uso:
 *   node experimentos/provar-largura-da-lista.js
 *   CHROME_PATH=/usr/bin/chromium node experimentos/provar-largura-da-lista.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));

// Os dados são os da forma real: nomes de pessoa com duas palavras, turmas com nome comprido.
// Não é decoração — a largura que o nome recebe depende do texto que ele tem de mostrar.
const ALUNAS = ['Ana Beatriz', 'Bianca', 'Clara', 'Débora', 'Eduarda', 'Fernanda',
  'Gabriela', 'Helena', 'Isabela', 'Joana'];
const TURMAS = [
  { id: 'tu1', nome: 'Balé Clássico Nível 1 — Iniciante', frequencia: 2, dias: ['ter', 'qui'],
    horarios: { ter: '18:00', qui: '18:00' }, duracaoMin: 60,
    periodoInicio: '2026-01-01', periodoFim: '2026-12-31' },
  { id: 'tu2', nome: 'Balé Clássico Nível 2 — Intermediário', frequencia: 2, dias: ['seg', 'qua'],
    horarios: { seg: '19:00', qua: '19:00' }, duracaoMin: 75,
    periodoInicio: '2026-01-01', periodoFim: '2026-12-31' },
  { id: 'tu3', nome: 'Dança Contemporânea — Adulto', frequencia: 1, dias: ['sex'],
    horarios: { sex: '20:00' }, duracaoMin: 90,
    periodoInicio: '2026-01-01', periodoFim: '2026-12-31' },
];
const CURADORIAS = [
  { id: 'c1', professor: 'pe-torto', modalidade: 'Balé clássico', tradicao: 'RAD',
    turmas: ['Balé Clássico Nível 1 — Iniciante'], alunas: ALUNAS.slice(0, 7), repertorio: [] },
  { id: 'c2', professor: 'pe-torto', modalidade: 'Balé clássico', tradicao: 'RAD',
    turmas: ['Balé Clássico Nível 2 — Intermediário'], alunas: ALUNAS.slice(3, 10), repertorio: [] },
  { id: 'c3', professor: 'pe-torto', modalidade: 'Dança contemporânea', tradicao: 'Laban',
    turmas: ['Dança Contemporânea — Adulto'], alunas: ALUNAS.slice(1, 5), repertorio: [] },
];

// As doze larguras. As três entre 1141 e 1440 são as que NÃO estavam a ser medidas em lugar
// nenhum — a `provar-celular.js` vai até 1024, e a 1025–1919 não havia prova nenhuma.
const LARGURAS = [320, 390, 560, 768, 1024, 1141, 1200, 1280, 1366, 1440, 1600, 1920];
const ALTURA = 900;      // a altura alta de propósito: o que se mede é a LARGURA
const PISO_DO_NOME = 176; // 11rem — o piso declarado na folha
const LISTA_A_1366 = 640; // era 561 antes da correção

function pagina() {
  return bastidores.paginaProducao('calango',
    { professor: 'pe-torto', ciclo: '01', query: 'professor=pe-torto&escola=calango&ciclo=01' },
    [{ nome: 'Petorto', slug: 'pe-torto' }], ALUNAS, 'Petorto', 'pe-torto', TURMAS, [], {},
    CURADORIAS, [], []);
}

function servir() {
  const html = pagina();
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    }
    // A lista de alunas busca os vínculos; o resto das rotas só precisa de dizer «ok» para o
    // script da página não parar a meio. Nada disto vai à rede: o KV é falso.
    if (caminho.indexOf('/api/') !== -1) {
      return ok('application/json', JSON.stringify({
        ok: true, alunas: ALUNAS, turmas: TURMAS, professores: [{ nome: 'Petorto', slug: 'pe-torto' }],
      }));
    }
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1',
    () => r({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

const provas = [];
let falhou = 0;
function provar(descricao, obtido, esperado) {
  const ok = typeof esperado === 'function' ? esperado(obtido) : JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhou++;
  provas.push({ ok, descricao, obtido, esperado: typeof esperado === 'function' ? esperado.descricao : esperado });
  return ok;
}

/** Abre a secção das alunas e mede a linha, a coluna da listagem e a do formulário. */
async function medir(pg, largura, cssExtra) {
  await pg.setViewport({ width: largura, height: ALTURA });
  await pg.goto(pg.__base + '/bastidores/producao', { waitUntil: 'load' });
  await pg.evaluate(() => {
    const conteudo = document.getElementById('conteudo');
    if (conteudo) conteudo.hidden = false;
    location.hash = '#alunas';
    const secao = document.getElementById('sec-alunas');
    if (secao) secao.hidden = false;
  });
  if (cssExtra) {
    await pg.evaluate((css) => {
      const s = document.createElement('style');
      s.id = 'controle-negativo';
      s.textContent = css;
      document.head.appendChild(s);
    }, cssExtra);
  }
  await new Promise((r) => setTimeout(r, 350));
  return pg.evaluate(() => {
    const doc = document.documentElement;
    const secao = document.getElementById('sec-alunas');
    const lista = secao.querySelector('.col-lista');
    const formulario = secao.querySelector('.col-form');
    const linha = [...secao.querySelectorAll('.lb-cartoes > li, .lista > li')]
      .find((li) => !li.classList.contains('vazia') && li.getBoundingClientRect().width > 0);
    const nome = linha.querySelector('.nome');
    const etiqueta = linha.querySelector('.filtrar-turmas');
    const acoes = linha.querySelector('.acoes');
    const caixa = (el) => (el ? el.getBoundingClientRect() : null);
    const r = caixa(linha);
    return {
      lista: Math.round(caixa(lista).width),
      formulario: Math.round(caixa(formulario).width),
      linha: Math.round(r.width),
      nome: Math.round(caixa(nome).width),
      nomeVisivel: getComputedStyle(nome).display !== 'contents',
      etiqueta: etiqueta ? Math.round(caixa(etiqueta).width) : null,
      acoes: Math.round(caixa(acoes).width),
      acoesDentro: Math.round(caixa(acoes).right) <= Math.round(r.right) + 1,
      etiquetaDentro: etiqueta ? Math.round(caixa(etiqueta).right) <= Math.round(r.right) + 1 : true,
      transbordo: doc.scrollWidth - doc.clientWidth,
    };
  });
}

(async () => {
  const executavel = process.env.CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-largura-da-lista: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    console.error('  defina CHROME_PATH, ou rode onde houver navegador.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (e) {
    console.error('provar-largura-da-lista: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const { srv, base } = await servir();
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();
  pg.__base = base;

  const medidas = [];
  for (const w of LARGURAS) medidas.push(Object.assign({ largura: w }, await medir(pg, w)));

  // ---- A. nada transborda -------------------------------------------------------------
  for (const m of medidas) {
    provar(`A · a ${m.largura}px nada transborda na horizontal`, m.transbordo, 0);
  }
  // ---- B. o piso do nome na faixa da fita ---------------------------------------------
  for (const m of medidas.filter((x) => x.largura >= 1141)) {
    provar(`B · a ${m.largura}px o nome tem pelo menos ${PISO_DO_NOME}px`, m.nome,
      (v) => v >= PISO_DO_NOME);
  }
  provas[provas.length - 1].esperado = `>= ${PISO_DO_NOME}`;
  // ---- C. as ações e a etiqueta ficam dentro da linha ---------------------------------
  for (const m of medidas) {
    provar(`C · a ${m.largura}px as ações ficam dentro da linha`, m.acoesDentro, true);
    provar(`C · a ${m.largura}px a etiqueta fica dentro da linha`, m.etiquetaDentro, true);
  }
  // ---- D. a coluna da listagem a 1366 -------------------------------------------------
  const a1366 = medidas.find((m) => m.largura === 1366);
  provar(`D · a 1366px a listagem tem pelo menos ${LISTA_A_1366}px (era 561)`, a1366.lista,
    (v) => v >= LISTA_A_1366);
  provas[provas.length - 1].esperado = `>= ${LISTA_A_1366}`;
  // ---- E. o formulário: piso de 20rem, tecto de 34rem, e 544px a 1920 ------------------
  for (const m of medidas.filter((x) => x.largura >= 1141)) {
    provar(`E · a ${m.largura}px o formulário fica entre 320 e 544px`, m.formulario,
      (v) => v >= 320 && v <= 544);
  }
  provas[provas.length - 1].esperado = '320 <= v <= 544';
  const a1920 = medidas.find((m) => m.largura === 1920);
  provar('E · a 1920px o formulário mede exactamente os 544px de sempre', a1920.formulario, 544);
  // ---- F. a tela larga não mudou -------------------------------------------------------
  provar('F · a 1920px a listagem continua com os 1115px de antes', a1920.lista, 1115);
  provar('F · a 1920px o nome continua com os 717px de antes', a1920.nome, 717);

  // ---- CONTROLE NEGATIVO: reposta a regra antiga, B/D/F têm de falhar -------------------
  const negativo = [];
  for (const [rotulo, cssExtra] of [
    ['minmax(0,34rem) — o tecto que era piso',
      '.secao,.turmas-corpo{grid-template-columns:minmax(0,34rem) minmax(24rem,1fr)!important;}'],
    ['min-width:0 no nome — o nome que cedia tudo',
      '.lista>li>.nome:not(.fixo){min-width:0!important;}'],
  ]) {
    const volta = [];
    for (const w of [1141, 1366, 1920]) volta.push(Object.assign({ largura: w }, await medir(pg, w, cssExtra)));
    negativo.push({ rotulo, volta });
  }
  const comRegraAntiga = negativo[0].volta.find((m) => m.largura === 1366);
  provar('N · com o tecto antigo, a listagem a 1366 volta a ficar abaixo de 640px',
    comRegraAntiga.lista, (v) => v < LISTA_A_1366);
  provas[provas.length - 1].esperado = `< ${LISTA_A_1366}`;
  const nomeAntigo = negativo[1].volta.find((m) => m.largura === 1141);
  provar(`N · com o nome sem piso, a 1141px ele volta a ficar abaixo de ${PISO_DO_NOME}px`,
    nomeAntigo.nome, (v) => v < PISO_DO_NOME);
  provas[provas.length - 1].esperado = `< ${PISO_DO_NOME}`;

  await br.close();
  srv.close();

  const falhas = provas.filter((p) => !p.ok);
  for (const p of provas) {
    process.stdout.write((p.ok ? 'ok     ' : 'FALHOU ') + p.descricao +
      (p.ok ? '' : '\n  obtido:   ' + JSON.stringify(p.obtido) +
        '\n  esperado: ' + JSON.stringify(p.esperado)) + '\n');
  }
  process.stdout.write('\nmedido: ' + medidas.map((m) => m.largura + 'px→lista ' + m.lista +
    '/nome ' + m.nome + '/form ' + m.formulario).join(' · ') + '\n');
  process.stdout.write('\nprovar-largura-da-lista: ' + (provas.length - falhas.length) + ' de ' +
    provas.length + ' passaram\n');
  process.exitCode = falhas.length === 0 ? 0 : 1;
})().catch((e) => { console.error(e); process.exit(1); });
