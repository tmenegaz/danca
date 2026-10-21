#!/usr/bin/env node
'use strict';

/*
 * construir.js — monta as PROPOSTAS de layout, autossuficientes e operáveis.
 *
 * PORQUE ISTO FOI REFEITO (21/10/2026). A primeira versão tinha duas falhas que a tornavam
 * inoperável, e as duas foram vistas antes de serem corrigidas:
 *
 *   1. O PAINEL TAPAVA O QUE ESTAVA A DEMONSTRAR. No celular a bancada ocupava 230 dos 390 px —
 *      59% da tela — e ficava por cima do rodapé de paginação que ela existe para mostrar. Não se
 *      avalia um comportamento de tela com outra coisa em cima dele.
 *   2. NÃO SE CHEGAVA A ELA DO TELEFONE. As páginas viviam em `file://`, e o que está a ser
 *      decidido é o comportamento NO CELULAR. Uma proposta que só se abre no computador de quem a
 *      escreveu não é uma proposta: é um ficheiro.
 *
 * O QUE MUDA AQUI:
 *
 *   · um painel que ABRE, EXPLICA e SAI DA FRENTE — e que se volta a chamar por uma aba fina na
 *     margem, que não tapa nem o rodapé nem o título;
 *   · cada opção com o seu custo medido, escrito ao lado — para escolher sem ter de decorar;
 *   · páginas AUTOSSUFICIENTES: o `ciclo.css` e o `nav.js` do projeto entram embutidos, e o
 *     resultado não depende de nenhum asset que o Git ignore;
 *   · as propostas são servidas pelo Worker em `/propostas/`, que é como se lhes chega pelo
 *     telefone (ver `tools/montar-publicacao.js --com-propostas`).
 *
 * O CSS NÃO É REESCRITO: é o `tools/templates/ciclo.css` — a fonte de verdade —, lido e embutido.
 * O conteúdo também não: o cabeçalho e o corpo vêm da Aula 01 publicada; o rodapé vem do
 * `tools/templates/lancamento.html`. Se a fonte mudar, a proposta muda com ela.
 *
 *   node experimentos/propostas/construir.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
const SAIDA = __dirname;

const CSS = fs.readFileSync(path.join(RAIZ, 'tools', 'templates', 'ciclo.css'), 'utf8');
const NAVJS = fs.readFileSync(path.join(RAIZ, 'tools', 'templates', 'nav.js'), 'utf8');
const AULA = path.join(RAIZ, 'professores', 'sapo-bailarino', 'ciclos',
  'ciclo-01-batata-bale-nivel-1-teste-2', 'aula-01.html');
const LANCAMENTO = path.join(RAIZ, 'tools', 'templates', 'lancamento.html');

// --------------------------------------------------------------------------- peças do projeto

/** O cabeçalho e o corpo REAIS da Aula 01 — a página longa que motivou o pedido. */
function conteudoDaAula() {
  const fonte = fs.readFileSync(AULA, 'utf8');
  const cabecalho = /<header class="doc">[\s\S]*?<\/header>/.exec(fonte);
  const corpo = /<main>[\s\S]*?<\/main>/.exec(fonte);
  if (!cabecalho || !corpo) throw new Error('a aula-01 não tem cabeçalho ou corpo — a montagem parou');
  return {
    cabecalho: cabecalho[0]
      .replace('<header class="doc">', '<header class="doc" id="cabecalho">')
      .replace('<h1>', '<h1 id="titulo">'),
    corpo: corpo[0],
  };
}

/** O `<footer class="barra-de-controle">` do lançamento — a marcação de produção, tal e qual. */
function rodapeDoLancamento() {
  const fonte = fs.readFileSync(LANCAMENTO, 'utf8');
  const m = /<footer class="barra-de-controle">([\s\S]*?)<\/footer>/.exec(fonte);
  if (!m) throw new Error('o rodapé não foi encontrado no template — a montagem parou');
  return m[1];
}

/** O CSS da barra do lançamento, em REGRAS COMPLETAS (não em linhas cortadas). */
function cssDaBarraDoLancamento() {
  const fonte = fs.readFileSync(LANCAMENTO, 'utf8');
  const bloco = /<style>([\s\S]*?)<\/style>/.exec(fonte);
  if (!bloco) return '';
  const texto = bloco[1];
  const regras = [];
  let profundidade = 0;
  let inicio = 0;
  for (let i = 0; i < texto.length; i += 1) {
    if (texto[i] === '{') profundidade += 1;
    else if (texto[i] === '}') {
      profundidade -= 1;
      if (profundidade === 0) { regras.push(texto.slice(inicio, i + 1)); inicio = i + 1; }
    }
  }
  return regras.filter((r) => /barra-de-controle|\.paginacao|\.fraco/.test(r)).join('\n').trim();
}

// ------------------------------------------------------------------------ a bancada (comum)

/*
 * O PAINEL É UM COMPONENTE SÓ, e é o mesmo nas duas propostas. Ele apareceu para resolver o
 * problema da versão anterior: explicar as opções SEM tapar o que está a ser demonstrado.
 *
 * AS TRÊS PEÇAS, e a razão de cada uma:
 *   · `.bancada` — o painel. Abre no carregamento, porque quem chega não sabe o que está a ver.
 *   · `.bancada-aba` — uma tira fina na margem esquerda. Chama o painel de volta sem tapar nada:
 *     fica na margem, fora da coluna de leitura e longe do rodapé.
 *   · `.bancada-balao` — o aviso que diz, durante 4 s, o que a opção escolhida faz e quanto custa.
 *     É o que permite fechar o painel, olhar a página, e mesmo assim perceber o que mudou.
 */
const CSS_BANCADA = `
/* ============================================================================
   A BANCADA — as propostas de layout. Componente só, usado pelas duas páginas.
   Ele NÃO faz parte do que se está a propor: é a moldura de quem compara.
   ========================================================================== */

.bancada {
  position: fixed; inset: 0; z-index: 90;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(20, 16, 14, .42);
  padding: 0; opacity: 1; transition: opacity .16s ease;
}
.bancada[hidden] { display: none !important; }
.bancada-caixa {
  width: 100%; max-width: 720px; max-height: 86vh; overflow-y: auto;
  background: var(--superficie, #fff); color: var(--texto, #1f1c1a);
  border: 1px solid var(--borda, #ddd); border-radius: 14px 14px 0 0;
  padding: 18px 20px 20px; box-shadow: 0 -8px 40px rgba(0,0,0,.28);
  font: 15px/1.5 var(--ui, system-ui, sans-serif);
}
@media (min-width: 700px) {
  .bancada { align-items: center; padding: 24px; }
  .bancada-caixa { border-radius: 14px; max-height: 88vh; }
}
.bancada-caixa .bancada-sobre {
  margin: 0 0 2px; font-size: 12px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--marca-texto, #6b1f2e); font-weight: 700;
}
.bancada-caixa h2 { margin: 0 0 6px; font-size: 21px; line-height: 1.2; color: var(--marca, #6b1f2e); }
.bancada-caixa .bancada-intro { margin: 0 0 14px; color: var(--texto-suave, #5a5348); font-size: 14px; }

.bancada-opcoes { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.bancada-opcoes button {
  display: grid; grid-template-columns: 30px 1fr auto; align-items: baseline; gap: 4px 10px;
  width: 100%; text-align: left; cursor: pointer;
  background: var(--fundo-faixa, #f7f1e7); color: inherit;
  border: 1px solid var(--borda, #ddd); border-radius: 10px; padding: 10px 12px;
  font: inherit;
}
.bancada-opcoes button:hover { background: var(--fundo-hover, #f3ece1); }
.bancada-opcoes button[aria-pressed="true"] {
  background: var(--marca, #6b1f2e); color: #fff; border-color: var(--marca, #6b1f2e);
}
.bancada-opcoes .n {
  font: 700 15px/1 var(--ui, system-ui); grid-row: 1 / span 2;
  opacity: .75;
}
.bancada-opcoes .t { font-weight: 700; font-size: 15px; }
.bancada-opcoes .d { grid-column: 2; font-size: 13px; opacity: .85; }
.bancada-opcoes .m {
  grid-row: 1 / span 2; grid-column: 3; font-size: 12px; text-align: right;
  font-variant-numeric: tabular-nums; opacity: .9; white-space: nowrap;
}
.bancada-opcoes button[aria-pressed="true"] .d,
.bancada-opcoes button[aria-pressed="true"] .m { opacity: .92; }

.bancada-rodape { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 16px; }
.bancada-ver {
  flex: 1 1 auto; cursor: pointer; min-height: 46px;
  background: var(--marca, #6b1f2e); color: #fff; border: 1px solid var(--marca, #6b1f2e);
  border-radius: 10px; padding: 10px 18px; font: 700 15px/1.2 var(--ui, system-ui);
}
.bancada-ver:hover { background: var(--marca-claro, #8a2a3d); }
.bancada-outra {
  color: var(--marca-texto, #6b1f2e); font-size: 14px; text-decoration: none;
  border-bottom: 1px dotted currentColor; padding-bottom: 1px;
}

/*
 * A ABA. Ela faz duas coisas, e é por isso que substituiu o balão que aqui esteve: DIZ QUAL É A
 * OPÇÃO ACTIVA e quanto ela custa, e CHAMA O PAINEL de volta.
 *
 * A primeira versão avisava num balão no topo — e o balão tapava exactamente o que estava a ser
 * demonstrado (o título que se quer ver preso). Um aviso que esconde a coisa observada é pior do
 * que aviso nenhum. A aba vive na margem, na vertical, e não passa por cima de nada: a coluna de
 * leitura tem 24 px de margem, e ela ocupa 22.
 */
.bancada-aba {
  position: fixed; left: 0; top: 50%; transform: translateY(-50%); z-index: 80;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  max-width: 22px; overflow: hidden;
  background: var(--marca, #6b1f2e); color: #fff; border: 0; border-radius: 0 8px 8px 0;
  padding: 10px 3px; cursor: pointer; opacity: .94;
  writing-mode: vertical-rl; text-orientation: mixed;
  font: 700 11px/1 var(--ui, system-ui); letter-spacing: .04em;
}
.bancada-aba:hover, .bancada-aba:focus-visible { opacity: 1; }
.bancada-aba[hidden] { display: none !important; }
.bancada-aba .aba-custo { font-weight: 400; opacity: .82; }

@media print { .bancada, .bancada-aba { display: none !important; } }
`;

/**
 * O `<script>` da bancada. Recebe as opções e o que cada uma diz; o resto é igual nas duas
 * propostas, e é isso que faz o componente ser um só.
 */
function scriptDaBancada(opcoes) {
  return `(function () {
  var OPCOES = ${JSON.stringify(opcoes)};
  var html = document.documentElement;
  var painel = document.getElementById('bancada');
  var aba = document.getElementById('bancada-aba');
  var abaRotulo = document.getElementById('bancada-aba-rotulo');
  var botoes = [].slice.call(document.querySelectorAll('.bancada-opcoes button'));

  function opcaoAtual() { return html.getAttribute('data-opcao'); }

  function aplicar(opcao) {
    var def = OPCOES.filter(function (o) { return o.id === opcao; })[0];
    if (!def) return;
    html.setAttribute('data-opcao', opcao);
    botoes.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.escolha === opcao));
    });
    // A ABA DIZ O QUE ESTÁ ACTIVO. Sem isto, fechado o painel, não se sabe qual das opções está na
    // tela — e comparar exige saber o que se está a ver.
    if (abaRotulo) abaRotulo.textContent = def.n + ' · ' + def.t + ' · ' + def.m;
    aba.setAttribute('title', def.t + ' — ' + def.d + ' (' + def.m + ')');
    try { sessionStorage.setItem('proposta:opcao', opcao); } catch (e) {}
    if (typeof window.aoTrocarOpcao === 'function') window.aoTrocarOpcao(opcao);
  }

  function abrir(sim) {
    painel.hidden = !sim;
    aba.hidden = sim;
    if (sim) {
      var atual = document.querySelector('.bancada-opcoes button[aria-pressed="true"]');
      if (atual) atual.focus();
    }
  }

  botoes.forEach(function (b) {
    b.addEventListener('click', function () { aplicar(b.dataset.escolha); });
  });
  document.getElementById('bancada-ver').addEventListener('click', function () { abrir(false); });
  aba.addEventListener('click', function () { abrir(true); });
  painel.addEventListener('click', function (e) { if (e.target === painel) abrir(false); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') abrir(false);
    var mapa = {};
    OPCOES.forEach(function (o, i) { mapa[String(i)] = o.id; });
    if (mapa[e.key] && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      aplicar(mapa[e.key]);
    }
  });

  // A opção escolhida sobrevive a um recarregamento — numa proposta que se avalia a rolar,
  // perder a escolha a cada recarregamento é perder o trabalho.
  var guardada = null;
  try { guardada = sessionStorage.getItem('proposta:opcao'); } catch (e) {}
  aplicar(guardada && OPCOES.some(function (o) { return o.id === guardada; }) ? guardada : html.getAttribute('data-opcao'));
})();`;
}

/** A marcação da bancada, a partir das opções. */
function marcacaoDaBancada({ sobre, titulo, intro, opcoes, inicio }) {
  return `<div class="bancada" id="bancada" role="dialog" aria-modal="false" aria-label="${titulo}">
  <div class="bancada-caixa">
    <p class="bancada-sobre">${sobre}</p>
    <h2>${titulo}</h2>
    <p class="bancada-intro">${intro}</p>
    <ul class="bancada-opcoes">
${opcoes.map((o) => `      <li><button type="button" data-escolha="${o.id}" aria-pressed="${o.id === inicio ? 'true' : 'false'}">
        <span class="n" aria-hidden="true">${o.n}</span>
        <span class="t">${o.t}</span>
        <span class="m">${o.m}</span>
        <span class="d">${o.d}</span>
      </button></li>`).join('\n')}
    </ul>
    <div class="bancada-rodape">
      <button type="button" class="bancada-ver" id="bancada-ver">Ver a página →</button>
      <a class="bancada-outra" href="index.html">‹ as duas propostas</a>
    </div>
  </div>
</div>
<button type="button" class="bancada-aba" id="bancada-aba" hidden
  aria-label="Mudar de opção — abrir o painel das propostas">
  <span id="bancada-aba-rotulo">propostas</span>
</button>`;
}

/** O esqueleto comum das duas páginas. O CSS do projeto entra AQUI, embutido. */
function pagina({ titulo, opcaoInicial, corpo, cssExtra, scriptExtra, opcoes, bancada }) {
  return `<!DOCTYPE html>
<html lang="pt-BR" data-opcao="${opcaoInicial}" data-titulo-preso="nao" data-titulo-encolhido="nao" data-rolando="sobe">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} · Sistema Lastro</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E">
<style>
${CSS}
</style>
<style>
${CSS_BANCADA}
${cssExtra}
</style>
</head>
<body>

<nav class="topnav" aria-label="Navegação">
  <span class="marca" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 249.21 291.95" width="249.21" height="291.95"><title>Sistema Lastro</title><path d="M162 163.3C166.3 159.1 170.8 155.1 174.9 150.7C177.8 147.7 180.3 144.3 183 141C183 141 200.6 115.1 200.6 115.1C203.1 110.4 205.3 105.4 207.4 100.5C207.4 100.5 215.6 74.6 215.6 74.6C216.5 69.7 217.5 64.7 217.5 59.7C217.5 51.6 212.5 43.8 207.2 37.7C204.5 34.6 201.6 31.6 198.3 29.1C198.3 29.1 164.5 9.6 164.5 9.6C161.9 8.6 159.1 8.3 156.4 7.6C154.4 7.2 152.1 9.3 151.4 11.2C149.2 17.1 147.2 23 145.8 29.1C142.4 44.4 139.5 59.7 137.1 75.1C133.4 98.4 131.3 122.7 135.6 145.8C135.6 145.8 145.7 176.3 145.7 176.3C145.7 176.3 114.4 207.4 114.4 207.4C107 217 101.6 228.8 100.4 240.7C99.4 251.1 102.5 262 107.3 271.3C108.9 274.4 111.2 277.1 113.4 279.8C113.4 279.8 125.9 290.2 125.9 290.2C127.4 291.1 129.1 291.4 130.7 291.9C130.7 291.9 119 271.1 119 271.1C118.5 268.8 118.5 266.4 118.6 264C118.6 264 122 252.9 122 252.9C122.8 251.3 123.7 249.9 124.8 248.6C142.2 229.6 169.3 222.6 192.4 211.2C207.8 203.6 222.1 192.5 232.5 178.8C232.5 178.8 245.4 154.5 245.4 154.5C247.1 148.8 248.2 142.9 248.7 137C249.2 130.2 248.9 123.3 248.4 116.5C248.4 116.5 243.4 92.7 243.4 92.7C243.4 92.7 229.3 64.6 229.3 64.6C228.1 63 226.5 61.8 225.1 60.3C225.1 60.3 227.4 66.5 227.4 66.5C228.4 69.1 229.2 71.8 229.6 74.6C229.6 74.6 228.2 93.5 228.2 93.5C228.2 93.5 213.2 116.8 213.2 116.8C198.1 134.2 181.5 151 162 163.3Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/></svg></span>
  <span class="topnav-titulo" aria-hidden="true"></span>
  <div class="nav-links" id="nav-links">
    <a href="index.html">Propostas</a>
  </div>
  <button class="hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-links">
    <span></span><span></span><span></span>
  </button>
</nav>

${corpo}

${bancada}

<script>${NAVJS}</script>
<script>${scriptDaBancada(opcoes)}</script>
<script>${scriptExtra || ''}</script>
</body>
</html>
`;
}

// =========================================================================== PROPOSTA 1: O TÍTULO

const OPCOES_TITULO = [
  { id: 'atual', n: '0', t: 'Hoje — nada muda', m: '0 px',
    d: 'o título sai da tela e não volta; numa página longa perde-se de que documento se trata' },
  { id: 'A', n: 'A', t: 'Preso no topo', m: '146 / 374 px',
    d: 'o bloco fica e o texto rola por baixo — no celular come 44% da tela' },
  { id: 'B', n: 'B', t: 'Encolhe ao rolar', m: '33 / 60 px',
    d: 'o título diminui e a ficha sai: devolve a altura à leitura' },
  { id: 'C', n: 'C', t: 'Vai para «Nesta página»', m: '0 px no desktop',
    d: 'o título muda-se para a coluna da direita; sem coluna, cai na B' },
  { id: 'D', n: 'D', t: 'Vai para o menu', m: '0 px no celular',
    d: 'o título ocupa a sobra da barra: não rouba um pixel da leitura' },
];

const CSS_TITULO = `
/* ============================================================================
   PROPOSTA 1 — O TÍTULO QUE NÃO SE PERDE

   Um mecanismo, cinco desfechos. «O título está preso» é UM estado (o fim do
   cabeçalho passou por baixo da barra); cada opção decide ONDE ele vive nesse
   estado. É o que torna legítimo compará-las: não são cinco invenções, é uma
   decisão com cinco respostas.
   ========================================================================== */

/* o fundo cobre a largura toda quando o cabeçalho fica: sem isto, o texto que
   passa nas laterais aparece ao lado dele em telas largas */
[data-titulo-encolhido="sim"] header.doc,
[data-titulo-preso="sim"] header.doc {
  background: var(--fundo);
  box-shadow: 0 0 0 100vmax var(--fundo), 0 1px 0 var(--borda);
  clip-path: inset(0 -100vmax);
}

/* 0 · HOJE — nada. */

/* A · PRESO NO TOPO */
[data-opcao="A"] header.doc { position: sticky; top: var(--header-height); z-index: 15; }

/* B · ENCOLHE */
[data-opcao="B"] header.doc { position: sticky; top: var(--header-height); z-index: 15; }
[data-opcao="B"][data-titulo-encolhido="sim"] header.doc h1 {
  font-size: 17px; border-bottom-width: 1px; padding-bottom: 4px; margin-bottom: 2px;
  transition: font-size .15s ease;
}
[data-opcao="B"][data-titulo-encolhido="sim"] header.doc .subtitulo,
[data-opcao="B"][data-titulo-encolhido="sim"] header.doc .ficha { display: none; }

/* C · VAI PARA A COLUNA — só onde a coluna existe; abaixo de 1200px cai na B */
[data-opcao="C"] header.doc .titulo-no-rail { display: none; }
@media (max-width: 1199px) {
  [data-opcao="C"] header.doc { position: sticky; top: var(--header-height); z-index: 15; }
  [data-opcao="C"][data-titulo-encolhido="sim"] header.doc h1 {
    font-size: 17px; border-bottom-width: 1px; padding-bottom: 4px; margin-bottom: 2px;
    transition: font-size .15s ease;
  }
  [data-opcao="C"][data-titulo-encolhido="sim"] header.doc .subtitulo,
  [data-opcao="C"][data-titulo-encolhido="sim"] header.doc .ficha { display: none; }
}
@media (min-width: 1200px) {
  [data-opcao="C"] header.doc { position: static; }
  [data-opcao="C"] .rail { position: sticky; top: calc(var(--header-height) + 8px); align-self: start; }
  [data-opcao="C"] .rail .titulo-no-rail {
    display: block; background: var(--fundo);
    font: 700 15px/1.25 var(--serif); color: var(--marca);
    padding: 0 0 6px; margin: 0 0 8px; border-bottom: 2px solid var(--borda);
  }
  [data-opcao="C"] .rail .toc-local { position: static; max-height: none; }
}

/* D · VAI PARA O MENU — só no celular, onde a barra tem espaço; acima disso cai na A */
.topnav .topnav-titulo { display: none; }
@media (max-width: 1199px) {
  [data-opcao="D"][data-titulo-preso="sim"] .topnav .topnav-titulo {
    display: block; min-width: 0; flex: 1 1 auto;
    margin: 0 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font: 700 13px/1.2 var(--ui); color: var(--fundo); opacity: .92;
  }
  [data-opcao="D"] header.doc { position: static; }
}
@media (min-width: 1200px) {
  [data-opcao="D"] header.doc { position: sticky; top: var(--header-height); z-index: 15; }
}

/* O QUE O EXPERIMENTO DIZ, no fim do documento */
.nota-do-teste {
  max-width: 900px; margin: 40px auto 60px; padding: 16px 20px;
  border-left: 4px solid var(--ornamento-forte); background: var(--superficie);
  color: var(--texto-suave); font-size: 15px; border-radius: 0 8px 8px 0;
}
.nota-do-teste strong { color: var(--texto); }
`;

const SCRIPT_TITULO = `(function () {
  var html = document.documentElement;
  var nav = document.querySelector('.topnav');
  var cabecalho = document.getElementById('cabecalho');
  var titulo = document.getElementById('titulo');
  var sentinela = document.getElementById('sentinela');
  var rail = document.querySelector('.rail');
  var devolver = null;

  function alturaDaBarra() { return nav ? nav.offsetHeight : 0; }

  function tituloParaORail(sim) {
    if (!rail || !titulo) return;
    if (sim) {
      if (titulo.parentNode && titulo.parentNode.classList.contains('titulo-no-rail')) return;
      devolver = { pai: titulo.parentNode, antes: titulo.nextSibling };
      var bloco = document.createElement('div');
      bloco.className = 'titulo-no-rail';
      rail.insertBefore(bloco, rail.firstChild);
      bloco.appendChild(titulo);
    } else if (devolver) {
      var b = rail.querySelector('.titulo-no-rail');
      if (b) b.parentNode.removeChild(b);
      devolver.pai.insertBefore(titulo, devolver.antes);
      devolver = null;
    }
  }

  function aoRolar() {
    var passou = sentinela.getBoundingClientRect().top <= alturaDaBarra();
    var encolhido = window.scrollY > 8;
    html.setAttribute('data-titulo-preso', passou ? 'sim' : 'nao');
    html.setAttribute('data-titulo-encolhido', encolhido ? 'sim' : 'nao');
    var opcao = html.getAttribute('data-opcao');
    tituloParaORail(opcao === 'C' && window.innerWidth >= 1200 && passou);
    var span = nav.querySelector('.topnav-titulo');
    if (span) span.textContent = passou ? titulo.textContent : '';
  }

  /*
   * O SALTO PARA A ÂNCORA, FEITO À MÃO — E PORQUÊ.
   *
   * Com o título preso, o alvo de «Nesta página» pára por baixo dele e quem salta chega ao sítio
   * sem ver o que foi lá buscar. O 'scroll-padding-top' só sabe um número fixo, e a altura que
   * fica presa MUDA com o estado (146 px inteiro, 25 px encolhido) — e esse estado depende da
   * posição. Com um número só, ou se reserva o máximo (o alvo cai longe) ou o mínimo (cai debaixo).
   *
   * A saída é não reservar às cegas: salta-se, deixa-se o estado assentar, e CORRIGE-SE com a
   * altura que ficou. A correção é SIMÉTRICA — desce se o alvo ficou escondido, sobe se ficou
   * longe. Uma correção que só empurra para baixo resolve metade dos casos.
   */
  function alturaPresada() {
    var opcao = html.getAttribute('data-opcao');
    var noTopo = opcao === 'A' || opcao === 'B'
      || (opcao === 'C' && window.innerWidth < 1200)
      || (opcao === 'D' && window.innerWidth >= 1200);
    if (!noTopo) return 0;
    var r = cabecalho.getBoundingClientRect();
    var preso = r.top <= alturaDaBarra() + 1 && r.bottom > alturaDaBarra();
    return preso ? r.height : 0;
  }

  function saltarPara(id) {
    var alvo = document.getElementById(id);
    if (!alvo) return;
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    alvo.scrollIntoView({ behavior: 'auto', block: 'start' });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        // O limite é o que está PINTADO no topo: a barra, ou o fundo do cabeçalho se ele estiver
        // por baixo dela. É a única medida que não depende do estado que se está a medir.
        var rc = cabecalho.getBoundingClientRect();
        var necessario = Math.max(alturaDaBarra(), Math.min(rc.bottom, window.innerHeight)) + 8;
        var r = alvo.getBoundingClientRect();
        var diferenca = Math.round(r.top - necessario);
        if (Math.abs(diferenca) > 1) window.scrollTo(0, Math.max(0, window.scrollY + diferenca));
      });
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('.toc-local a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!document.getElementById(id)) return;
    e.preventDefault();
    saltarPara(id);
  });

  var pedido = false;
  function rolar() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(function () { pedido = false; aoRolar(); });
  }
  window.addEventListener('scroll', rolar, { passive: true });
  window.addEventListener('resize', rolar);

  window.aoTrocarOpcao = function () {
    if (html.getAttribute('data-opcao') !== 'C') tituloParaORail(false);
    aoRolar();
  };
  aoRolar();
})();`;

function proporTitulo() {
  const { cabecalho, corpo } = conteudoDaAula();
  const nota = `<div class="nota-do-teste">
  <p><strong>O que está a ser comparado.</strong> O título do documento deve ficar à vista enquanto
  se rola — a página da aula é longa, e hoje ele sai da tela. Role com cada opção e repare em duas
  coisas: <strong>o título continua visível?</strong> e <strong>quanta altura ele ocupa no
  topo?</strong></p>
  <p>Os números ao lado de cada opção são medidos, não estimados: <strong>146 px</strong> é o
  cabeçalho inteiro preso, no computador; <strong>374 px</strong> é o mesmo no telemóvel — 44% da
  tela. É por isso que a opção A, que parece a mais óbvia, é a pior no celular.</p>
  <p>As opções C e D mudam de comportamento conforme a largura: não há coluna «Nesta página» abaixo
  de 1200 px, e a barra do topo só tem espaço de sobra no celular. Uma proposta que só olhasse para
  um dos lados não serviria.</p>
  </div>`;

  return pagina({
    titulo: 'Proposta — o título que não se perde',
    opcaoInicial: 'atual',
    corpo: `${cabecalho}

<div id="sentinela" aria-hidden="true"></div>

${corpo}

${nota}`,
    cssExtra: CSS_TITULO,
    scriptExtra: SCRIPT_TITULO,
    opcoes: OPCOES_TITULO,
    bancada: marcacaoDaBancada({
      sobre: 'Proposta 1 de 2 · leitura',
      titulo: 'O título que não se perde',
      intro: 'A página longa é a <strong>Aula 01</strong> verdadeira. Escolha uma opção, feche este '
        + 'painel e role: o que se compara é se o título continua à vista e quanta altura ocupa.',
      opcoes: OPCOES_TITULO,
      inicio: 'atual',
    }),
  });
}

// ===================================================================== PROPOSTA 2: A PAGINAÇÃO

const OPCOES_PAGINACAO = [
  { id: 'hoje', n: '0', t: 'Hoje — presa no fundo', m: '182 px',
    d: 'fica sempre à vista e, no celular, ocupa 21% da tela — mesmo sem haver o que folhear' },
  { id: 'bloco', n: '1', t: 'Vira bloco no fim', m: '0 px',
    d: 'deixa de ser presa no celular e volta a ser o que o nome diz: um rodapé' },
  { id: 'compacta', n: '2', t: 'Compacta com «⋯»', m: '47 px',
    d: 'só os botões e a contagem; o resto abre no «⋯» — uma linha em vez de três' },
  { id: 'auto-esconde', n: '3', t: 'Esconde ao descer', m: '0 px',
    d: 'sai quando se lê, volta quando se procura: devolve a tela sem perder o controle' },
];

const CSS_PAGINACAO = `
${cssDaBarraDoLancamento()}

/* ============================================================================
   PROPOSTA 2 — A PAGINAÇÃO DO LANÇAMENTO NO CELULAR

   A barra é a do produto: o <footer> é extraído do template, e o CSS dela também.
   O que muda entre as opções é ONDE ela vive e QUANTO dela se mostra no celular.
   ========================================================================== */

header.doc { margin-top: 8px; }

/* 0 · HOJE — nada. */

/* 1 · VIRA BLOCO NO FIM: deixa de ser presa no celular, e continua presa no desktop */
@media (max-width: 899px) {
  [data-opcao="bloco"] footer.barra-de-controle {
    position: static; margin: 22px 0 40px; border: 1px solid var(--borda);
    border-radius: 8px; border-top: 2px solid var(--borda);
  }
}

/* 2 · COMPACTA COM «⋯» */
@media (max-width: 899px) {
  [data-opcao="compacta"] footer.barra-de-controle { gap: 4px 10px; padding: 6px 10px; }
  [data-opcao="compacta"] footer.barra-de-controle .por-pagina,
  [data-opcao="compacta"] footer.barra-de-controle .contagem { display: none; }
  [data-opcao="compacta"] footer.barra-de-controle .mais { display: inline-block; margin-left: auto; }
  [data-opcao="compacta"] footer.barra-de-controle[data-aberto="sim"] .por-pagina,
  [data-opcao="compacta"] footer.barra-de-controle[data-aberto="sim"] .contagem { display: inline; }
  [data-opcao="compacta"] footer.barra-de-controle .paginacao { gap: 6px; }
  [data-opcao="compacta"] footer.barra-de-controle strong { font-size: 13px; }
  [data-opcao="compacta"] footer.barra-de-controle button { padding: 4px 9px; }
}

/* 3 · ESCONDE AO DESCER, VOLTA AO SUBIR */
[data-opcao="auto-esconde"] footer.barra-de-controle {
  transition: transform .18s ease, opacity .18s ease;
}
[data-opcao="auto-esconde"][data-rolando="desce"] footer.barra-de-controle {
  transform: translateY(130%); opacity: 0; pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  [data-opcao="auto-esconde"] footer.barra-de-controle { transition: none; }
}

/* a peça que só a proposta tem */
.mais {
  display: none; cursor: pointer; background: var(--fundo-faixa);
  border: 1px solid var(--borda); border-radius: 6px; padding: 4px 10px;
  font: 700 15px/1 var(--ui); color: var(--marca-texto);
}
@media (min-width: 900px) { .mais { display: none !important; } }

.nota-do-teste {
  max-width: 900px; margin: 40px auto 60px; padding: 16px 20px;
  border-left: 4px solid var(--ornamento-forte); background: var(--superficie);
  color: var(--texto-suave); font-size: 15px; border-radius: 0 8px 8px 0;
}
.nota-do-teste strong { color: var(--texto); }
`;

const SCRIPT_PAGINACAO = `(function () {
  var html = document.documentElement;
  var rodape = document.querySelector('footer.barra-de-controle');
  var alvo = document.getElementById('paginacao');
  var pagina = 1, total = 1, quantos = 6;

  function desenhar() {
    var botao = function (ir, rotulo) {
      return '<button type="button" data-ir="' + ir + '"'
        + (ir < 1 || ir > total ? ' disabled' : '') + '>' + rotulo + '</button>';
    };
    alvo.innerHTML = botao(pagina - 1, '‹ anterior')
      + '<strong>Página ' + pagina + ' de ' + total + '</strong>'
      + botao(pagina + 1, 'próxima ›')
      + '<span class="fraco contagem">' + quantos + ' bloco(s) no filtro</span>';
  }
  desenhar();

  var mais = document.getElementById('mais');
  if (mais) mais.addEventListener('click', function () {
    var aberto = rodape.getAttribute('data-aberto') === 'sim';
    rodape.setAttribute('data-aberto', aberto ? 'nao' : 'sim');
    mais.setAttribute('aria-expanded', String(!aberto));
  });

  /* a opção 3: esconde ao descer, volta ao subir */
  var ultimo = window.scrollY, pedido = false;
  function aoRolar() {
    var y = window.scrollY;
    if (Math.abs(y - ultimo) > 6) {
      html.setAttribute('data-rolando', (y > ultimo && y > 120) ? 'desce' : 'sobe');
      ultimo = y;
    }
  }
  window.addEventListener('scroll', function () {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(function () { pedido = false; aoRolar(); });
  }, { passive: true });

  window.aoTrocarOpcao = function () {
    html.setAttribute('data-rolando', 'sobe');
  };
})();`;

function blocosDaAula(qtd) {
  const campos = ['Presença', 'Técnica — Solo', 'Técnica — Barra', 'Musicalidade', 'Observação'];
  const lista = [];
  for (let i = 1; i <= qtd; i += 1) {
    lista.push(`<section class="captura">
  <h3>Aula ${String(i).padStart(2, '0')} — o registro da aula dada</h3>
  <table>${campos.map((c) => `<tr><th>${c}</th><td><input type="text" value="—" size="20"></td></tr>`).join('')}</table>
  <p class="fraco">Bloco ${i} de ${qtd}. O formulário é o mesmo nas quatro opções: o que se compara é o
  <strong>rodapé</strong>.</p>
</section>`);
  }
  return lista.join('\n');
}

function proporPaginacao() {
  const nota = `<div class="nota-do-teste">
  <p><strong>O que está a ser comparado.</strong> O rodapé de paginação do lançamento fica presa no
  fundo da tela. No computador isso é útil; no celular rouba espaço à leitura — e a barra
  <strong>não ocupa 52 px como parece</strong>: os controlos dobram-se em três linhas e ela mede
  <strong>182 px</strong>, 21% da tela de um telemóvel de 390×844. Mesmo quando não há o que
  folhear («Página 1 de 1», com os dois botões cinzas), que é o caso do ciclo com uma aula.</p>
  <p>Role com cada opção. Repare em quanta altura sobra para o formulário — e repare também que a
  opção 1 mantém o rodapé presa no computador: <strong>o que funciona num lado não precisa de ser
  sacrificado</strong>.</p>
  </div>`;

  return pagina({
    titulo: 'Proposta — a paginação no celular',
    opcaoInicial: 'hoje',
    corpo: `<header class="doc">
  <h1>Lançamento da aula — formulário eletrônico</h1>
  <p class="subtitulo">O rodapé de paginação: quatro desfechos</p>
  <p class="ficha"><span>Proposta 2 de 2</span><span>6 blocos</span><span>formulário decorativo</span></p>
</header>

<main>
<div class="conteudo">
${blocosDaAula(6)}
</div>
</main>

<footer class="barra-de-controle">
${rodapeDoLancamento().replace('<span><label class="campo-rotulo em-linha" for="porPagina">',
    '<span class="por-pagina"><label class="campo-rotulo em-linha" for="porPagina">')}
  <button type="button" class="mais" id="mais" aria-expanded="false"
    aria-label="Mais opções da paginação">⋯</button>
</footer>

${nota}`,
    cssExtra: CSS_PAGINACAO,
    scriptExtra: SCRIPT_PAGINACAO,
    opcoes: OPCOES_PAGINACAO,
    bancada: marcacaoDaBancada({
      sobre: 'Proposta 2 de 2 · tela de trabalho',
      titulo: 'A paginação no celular',
      intro: 'O formulário é decorativo; o que se compara é o <strong>rodapé</strong>. Escolha uma '
        + 'opção, feche o painel e role: repare em quanta altura sobra para os campos.',
      opcoes: OPCOES_PAGINACAO,
      inicio: 'hoje',
    }),
  });
}

// =============================================================================== PROPOSTA: ÍNDICE

function indice() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Propostas de layout · Sistema Lastro</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E">
<style>
${CSS}
</style>
<style>
${CSS_BANCADA}
.aviso-proposta {
  max-width: 760px; margin: 0 auto 24px; padding: 12px 16px; border-radius: 8px;
  background: var(--fundo-faixa); border: 1px solid var(--borda); border-left: 4px solid var(--marca);
  font-size: 14px; color: var(--texto-suave);
}
.cartoes { display: grid; gap: 16px; max-width: 760px; margin: 0 auto; }
.cartao {
  display: block; text-decoration: none; color: inherit;
  background: var(--superficie); border: 1px solid var(--borda); border-radius: 12px;
  padding: 18px 20px; transition: border-color .14s ease, transform .14s ease;
}
.cartao:hover { border-color: var(--marca); transform: translateY(-1px); }
.cartao .sobre { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--marca-texto); font-weight: 700; margin: 0 0 4px; }
.cartao h2 { margin: 0 0 6px; font-size: 20px; color: var(--marca); }
.cartao p { margin: 0 0 10px; font-size: 15px; color: var(--texto-suave); }
.cartao .abrir { font: 700 14px/1 var(--ui); color: var(--marca); border-bottom: 1px dotted currentColor; padding-bottom: 2px; }
.cartao table { font-size: 14px; margin: 8px 0 12px; }
.cartao th, .cartao td { padding: 4px 8px; }
</style>
</head>
<body>

<header class="doc">
  <h1>Propostas de layout</h1>
  <p class="subtitulo">Duas decisões que precisam da sua escolha — medidas, não estimadas</p>
</header>

<main>
<div class="conteudo">

<p class="aviso-proposta"><strong>Isto não é o produto.</strong> São bancadas de comparação: cada
aba mostra a <em>mesma</em> página com as alternativas que estão em cima da mesa. O conteúdo é o
real — a Aula 01 e o formulário de lançamento —, e o CSS é o do projeto, embutido. Nada aqui muda o
que está publicado na escola; a escolha é que vira código.</p>

<div class="cartoes">

  <a class="cartao" href="proposta-titulo.html">
    <p class="sobre">Proposta 1 de 2 · leitura</p>
    <h2>O título que não se perde</h2>
    <p>Hoje o título sai da tela quando se rola, e a página da aula é longa: perde-se de que
    documento se trata. Quatro desfechos, um mecanismo.</p>
    <table>
      <tr><th>Opção</th><th>Desktop</th><th>Celular</th></tr>
      <tr><td>A · preso no topo</td><td>146 px</td><td><strong>374 px</strong></td></tr>
      <tr><td>B · encolhe</td><td>33 px</td><td>60 px</td></tr>
      <tr><td>C · vai para a coluna</td><td><strong>0 px</strong></td><td>60 px</td></tr>
      <tr><td>D · vai para o menu</td><td>146 px</td><td><strong>0 px</strong></td></tr>
    </table>
    <span class="abrir">Abrir a proposta →</span>
  </a>

  <a class="cartao" href="proposta-paginacao.html">
    <p class="sobre">Proposta 2 de 2 · tela de trabalho</p>
    <h2>A paginação no celular</h2>
    <p>O rodapé de paginação do lançamento é bom no computador e mau no celular. Ele não ocupa 52 px
    como parece: ocupa <strong>182 px</strong>, 21% da tela.</p>
    <table>
      <tr><th>Opção</th><th>Ocupa no celular</th><th>Sobra</th></tr>
      <tr><td>1 · vira bloco no fim</td><td>0 px</td><td>783 px</td></tr>
      <tr><td>2 · compacta com «⋯»</td><td><strong>47 px</strong></td><td>736 px</td></tr>
      <tr><td>3 · esconde ao descer</td><td>0 px</td><td>783 px</td></tr>
    </table>
    <span class="abrir">Abrir a proposta →</span>
  </a>

</div>

<p class="aviso-proposta" style="margin-top:24px">Para avaliar no telemóvel, abra esta página no
telemóvel: as duas propostas mudam de comportamento conforme a largura, e é no telemóvel que a
decisão é difícil. O painel de escolha abre sozinho e fecha em <strong>Ver a página</strong>; a aba
<em>propostas</em>, na margem esquerda, chama-o de volta.</p>

</div>
</main>

</body>
</html>
`;
}

// ==================================================================================== escrever

const arquivos = {
  'index.html': indice(),
  'proposta-titulo.html': proporTitulo(),
  'proposta-paginacao.html': proporPaginacao(),
};

for (const [nome, texto] of Object.entries(arquivos)) {
  fs.writeFileSync(path.join(SAIDA, nome), texto, 'utf8');
  console.log(nome + ' — ' + Math.round(texto.length / 1024) + ' kB');
}
console.log('\nCSS do projeto embutido: ' + Math.round(CSS.length / 1024) + ' kB (tools/templates/ciclo.css)');
console.log('Sem dependências externas: as páginas abrem de `file://` e do Worker.');
