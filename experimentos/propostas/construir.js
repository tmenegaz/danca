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
/* A AULA É DESCOBERTA, não nomeada (21/10/2026). O construtor lia o nome de uma escola
 * escrita à mão — e as escolas deste protótipo são descartáveis por desenho: expurgada a
 * escola, as bancadas deixavam de se construir, embora o que elas mostrem (o cabeçalho e o
 * corpo de um documento longo) não dependa de qual escola é. Ver `../lib-pacote.js`. */
const { umPacote, umaPagina } = require('../lib-pacote.js');
const PACOTE_DA_AULA = umPacote();
const PAGINA_DA_AULA = umaPagina(PACOTE_DA_AULA, /^aula-\d{2}\.html$/);
if (!PAGINA_DA_AULA) {
  throw new Error('construir: o pacote «' + PACOTE_DA_AULA + '» não tem página de aula — a '
    + 'proposta do título mede o cabeçalho e o corpo de um documento real, e sem ele não há '
    + 'o que mostrar.');
}
const AULA = path.join(RAIZ, PACOTE_DA_AULA, PAGINA_DA_AULA);
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
      <a class="bancada-outra" href="index.html">‹ as propostas</a>
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
<html lang="pt-BR" data-opcao="${opcaoInicial}" data-titulo-fixo="nao" data-titulo-preso="nao" data-titulo-encolhido="nao" data-rolando="sobe">
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

// ============================================================ PROPOSTAS 3 e 4: O MENU E A LISTA

/*
 * DUAS DECISÕES, E NÃO UMA (23/10/2026). O pedido chegou como um assunto só — «o menu vai
 * ficar gigantesco» — mas são dois, e separá-los é o que evita escolher um pelo outro:
 *
 *   · a LISTAGEM resolve a CAPACIDADE. O menu deixa de enumerar documentos e passa a levar a
 *     páginas que os enumeram. Sozinha, leva a barra de 24 entradas para 12 e desliga o
 *     crescimento — que hoje é `6 + 8·T + A·T`, com `T` turmas e `A` aulas por turma;
 *   · o DESENHO resolve outra coisa: ONDE se lê o menu.
 *
 * DECIDIDO EM 23/10/2026, e é isso que estas duas páginas passam a mostrar:
 *
 *   1. o desenho é a COLUNA À ESQUERDA com o documento no topo — e a coluna é COMPACTA: os
 *      grupos abrem no ponteiro, empurram os de baixo para baixo, e fecham quando ele sai;
 *   2. a listagem adota a identidade de «Turmas cadastradas», na Produção: a mesma linha de
 *      nome com as ações, a mesma linha de complemento, e as MESMAS três caixinhas com o «?»
 *      — só que agora a caixinha toda é clicável, e não só o «?».
 *
 * BASTIDORES SAI DA COLUNA. Ele vai para a barra de cima, na ponta oposta à marca, e leva
 * consigo o Estúdio e a Produção. A coluna fica com o que é do trabalho de sala: Sistema
 * Lastro, Ciclos, Aulas, Planejamento, Área do Professor.
 *
 * OS NÚMEROS DESTAS BANCADAS NÃO SÃO INVENTADOS. As entradas do menu são CONTADAS do
 * `nav.json` real da escola de teste; a altura do painel e a largura da coluna são MEDIDAS no
 * navegador; o ritmo, a régua e os conteúdos dos dois planos são lidos do `.conf` da turma e
 * do `plano-01.json` do pacote. Um número estimado com ar de medido seria pior do que nenhum.
 *
 * A BARRA É DESENHADA PELO MÓDULO DE PRODUÇÃO. `motor/nucleo/nav.js` — o mesmo `desenhar()` que
 * serve a escola publicada — produz o HTML das três opções. E é por isso que a mudança de
 * Bastidores para a ponta direita NÃO precisa de tocar no módulo: o `desenhar()` já aceita um
 * `extras` (o documento) e um menu de um grupo só (o Bastidores). O que muda é lugar em CSS.
 */

const navDoProjeto = require(path.join(RAIZ, 'motor', 'nucleo', 'nav.js'));

/* OS DOCUMENTOS QUE HOJE SÃO O MENU — contados de `publicacao/calango/nav.json` em 23/10/2026,
 * com duas turmas («Balé Nível 1 — Teste 1» e «Balé Nível 2 — Teste 1») e uma aula publicada
 * por turma. Ficam escritos aqui, e não lidos do disco, de propósito: a escola de teste é
 * descartável por desenho, e uma bancada que se desmonta quando a escola é expurgada não
 * serve para decidir nada. Ver `../lib-pacote.js`, que resolve o mesmo problema para a aula. */
const DOCUMENTOS_DE_HOJE = [
  ['Ciclos', [
    'Plano do Ciclo 01 — Balé Nível 1 — Teste 1',
    'Referências Bibliográficas — Balé Nível 1 — Teste 1',
    'PDF do ciclo — Balé Nível 1 — Teste 1',
    'Plano do Ciclo 01 — Balé Nível 2 — Teste 1',
    'Referências Bibliográficas — Balé Nível 2 — Teste 1',
    'PDF do ciclo — Balé Nível 2 — Teste 1',
  ]],
  ['Aulas', [
    'Aula 01 — reconhecer o apoio e alinhar o eixo vertical — Balé Nível 1 — Teste 1',
    'Aula 01 — reconhecer o apoio e alinhar o eixo vertical — Balé Nível 2 — Teste 1',
  ]],
  ['Planejamento', [
    'Glossário do código Benesh — Balé Nível 1 — Teste 1',
    'Notação em Benesh — Balé Nível 1 — Teste 1',
    'Glossário do código Benesh — Balé Nível 2 — Teste 1',
    'Notação em Benesh — Balé Nível 2 — Teste 1',
  ]],
  ['Área do Professor', [
    'Anamnese do aluno',
    'Plano de ensino',
    'Plano de Observação',
    'Harmonização de linguagem — Balé Nível 1 — Teste 1',
    'Harmonização de linguagem — Balé Nível 2 — Teste 1',
    'Captura em aula — Aula 01 — para impressão — Balé Nível 1 — Teste 1',
    'Captura em aula — Aula 01 — para impressão — Balé Nível 2 — Teste 1',
    'Lançamento de aula — formulário electrónico — Balé Nível 1 — Teste 1',
    'Lançamento de aula — formulário electrónico — Balé Nível 2 — Teste 1',
  ]],
  ['Bastidores', ['Estúdio', 'Produção']],
];

/** O menu de hoje, como `nav.json` — 24 entradas: «Sistema Lastro» e 23 documentos. */
const MENU_DE_HOJE = {
  versao: 1,
  grupos: [{ tipo: 'link', rotulo: 'Sistema Lastro', href: '/index.html' }].concat(
    DOCUMENTOS_DE_HOJE.map(([rotulo, itens]) => ({
      tipo: 'menu',
      rotulo,
      itens: itens.map((r) => ({ rotulo: r, href: '/documentos/' })),
    }))),
};

/**
 * A COLUNA — quatro grupos, e o Bastidores NÃO está aqui.
 *
 * `Aulas` não tem itens: é `direto`, um destino só. É o que você pediu — e é também o que a
 * conta de crescimento exige, porque as aulas são o único acervo que cresce sem parar.
 *
 * O item `atual` é o que a página está a servir. Ele faz duas coisas: acende na coluna, e faz o
 * grupo dele nascer ABERTO — sem isso, na coluna compacta, a pessoa perde a única pista de onde
 * está, porque o item fica escondido dentro de um grupo fechado.
 */
const GRUPOS_DA_COLUNA = [
  { chave: 'ciclos', rotulo: 'Ciclos', itens: [
    { rotulo: 'Planos', atual: true },
    { rotulo: 'Referências' },
  ] },
  { chave: 'aulas', rotulo: 'Aulas', direto: true },
  { chave: 'planejamento', rotulo: 'Planejamento', itens: [
    { rotulo: 'Glossário' },
    { rotulo: 'Notação' },
  ] },
  { chave: 'area', rotulo: 'Área do Professor', itens: [
    { rotulo: 'Anamnese do aluno' },
    { rotulo: 'Plano de ensino' },
    { rotulo: 'Plano de Observação' },
    { rotulo: 'Lançamento de aula' },
  ] },
];

/** O que sobra para a barra de cima: o Bastidores e os dois destinos dele. */
const MENU_DA_BARRA = {
  versao: 1,
  grupos: [{ tipo: 'menu', rotulo: 'Bastidores', itens: [
    { rotulo: 'Estúdio de Dança', href: '/bastidores/estudio' },
    { rotulo: 'Produção', href: '/bastidores/producao' },
  ] }],
};

/* OS DOIS PLANOS QUE EXISTEM NA ESCOLA DE TESTE, com a forma real: `NOME`, `PROFESSOR`,
 * `FREQUENCIA`, `DIAS`, `DURACAO_POR_DIA` e `TOTAL_AULAS` do `.conf` da turma; `reguaDaRubrica`
 * e `repertorio` do `plano-01.json` do pacote; `hash`, `ancorado_em` e `po_state` do `.fipp`.
 *
 * São DUAS linhas e não uma dúzia porque são dois os planos — e são exactamente o par que
 * motivou a mudança: mesma escola, mesmos dados de ritmo e régua, e **professores diferentes**.
 * Um terceiro plano falso seria a única coisa falsa da página. */
const PLANOS = [
  {
    nome: 'Ciclo 01 — Calango · Balé Nível 1 — Teste 1',
    turma: 'Balé Nível 1 — Teste 1',
    professor: 'Oculos Redondo',
    ancorada: '23/10/2026',
    po: 'PO aguardando',
    poClasse: 'alerta',
    aulas: '18',
    hash: 'ca122b865128548b8544cb9197edc940ba9a842c1e481c2c31183240792004d8',
    ritmo: '2x · 60 min',
    ritmoCampos: [
      ['Frequência', '2x por semana (ter, qui)'],
      ['Dias e horário', 'ter e qui, 19:00'],
      ['Duração da aula', '60 min'],
      ['Período', '20/10/2026 a ?'],
    ],
    regua: ['Satisfatório', 'Razoável', 'Em desenvolvimento', 'Não se aplica'],
    reguaNota: 'Medida pela régua que o plano declara — a de omissão do motor, porque esta turma '
      + 'ainda não tem rubrica própria.',
    conteudos: ['Sequência de teste com plié, tendu e port de bras.'],
  },
  {
    nome: 'Ciclo 01 — Calango · Balé Nível 2 — Teste 1',
    turma: 'Balé Nível 2 — Teste 1',
    professor: 'Perna Boa',
    ancorada: '23/10/2026',
    po: 'PO aguardando',
    poClasse: 'alerta',
    aulas: '18',
    hash: '2540d67e7ebd1c4b6f997fd7b5f8b4f9110f49f1e700812122d71bc0d942561c',
    ritmo: '2x · 60 min',
    ritmoCampos: [
      ['Frequência', '2x por semana (ter, qui)'],
      ['Dias e horário', 'ter e qui, 19:00'],
      ['Duração da aula', '60 min'],
      ['Período', '20/10/2026 a ?'],
    ],
    regua: ['Satisfatório', 'Razoável', 'Em desenvolvimento', 'Não se aplica'],
    reguaNota: 'Medida pela régua que o plano declara — a de omissão do motor, porque esta turma '
      + 'ainda não tem rubrica própria.',
    conteudos: ['Sequência de teste com plié, tendu e port de bras.'],
  },
];

/** O normalizador da busca: sem acento e em minúsculas — «oculos» acha «Oculos Redondo». */
function chaveDeBusca(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** A cor de cada degrau da régua — a MESMA função da Produção, copiada na regra, não na cor. */
function classeDoNivel(nome, indice, total) {
  const n = chaveDeBusca(nome).trim();
  if (/satisf/.test(n)) return 'nivel-ok';
  if (/raz(o|ó)avel/.test(n)) return 'nivel-razoavel';
  if (/desenvolv/.test(n)) return 'nivel-alerta';
  if (/nao se aplica|n\/a|neutro/.test(n)) return 'nivel-neutro';
  if (indice === total - 1) return 'nivel-neutro';
  if (indice === 0) return 'nivel-ok';
  if (indice === 1) return 'nivel-razoavel';
  return 'nivel-alerta';
}

/** A barra desenhada pelo módulo de produção, com os endereços tornados inertes. */
function barraDoMenu(menu, pedido, extras) {
  const html = navDoProjeto.desenhar(menu, pedido, extras) || '';
  return html.replace(/ href="[^"]*"/g, ' href="#"');
}

/**
 * A COLUNA. Três arranjos, e o terceiro parâmetro é o que os separa:
 *
 *   · `compacta: false` — tudo à vista (a letra C de ontem);
 *   · `compacta: true`  — acordeão, e o grupo do documento actual ABERTO. Sabe-se onde se está
 *     porque se vê o item aceso; o preço é que a coluna nunca fica mais curta do que esse grupo;
 *   · `compacta: true` + `marcar`: acordeão, TUDO FECHADO, e o grupo do documento actual
 *     MARCADO no título (`data-atual`). É a leitura mais compacta, e continua a responder ao
 *     «sei onde estou» — não pelo item, mas pelo grupo, em ouro.
 */
function colunaDoMenu(compacta, marcar) {
  const partes = GRUPOS_DA_COLUNA.map((g) => {
    if (g.direto) return `    <a class="direto" href="#">${g.rotulo}</a>`;
    const temAtual = g.itens.some((i) => i.atual);
    const aberto = temAtual && !marcar ? 'sim' : 'nao';
    const atual = temAtual && marcar ? ' data-atual="sim"' : '';
    const itens = g.itens.map((i) => (i.atual
      ? `        <a href="#" aria-current="page">${i.rotulo}</a>`
      : `        <a href="#">${i.rotulo}</a>`)).join('\n');
    return `    <div class="grupo" data-aberto="${aberto}"${atual}>
      <button type="button" class="grupo-titulo" aria-expanded="${aberto === 'sim'}"
        aria-controls="g-${g.chave}"><span>${g.rotulo}</span><span class="seta" aria-hidden="true">›</span></button>
      <div class="grupo-itens" id="g-${g.chave}">
${itens}
      </div>
    </div>`;
  }).join('\n');
  return `<aside class="coluna" id="coluna-proposta" data-compacta="${compacta ? 'sim' : 'nao'}" data-aberta="nao"
  aria-label="Navegação do sistema">
  <span class="coluna-puxador" aria-hidden="true"></span>
  <a class="coluna-marca" href="#">Sistema Lastro</a>
  <nav>
${partes}
  </nav>
</aside>`;
}

/**
 * A BARRA DA PÁGINA — a `.lateral-barra` da Produção com outra roupa.
 *
 * ELA É SEPARADA DA COLUNA, e isso não é arrumação: é a mesma razão pela qual a Produção a tem
 * fora da `.lateral`. A coluna é `position: fixed` no computador e uma folha `fixed` no celular;
 * a barra tem de estar no FLUXO, acima do documento, a rolar com a página. Dentro da coluna, ela
 * ou flutuava sobre o conteúdo ou rolava dentro da folha.
 *
 * O que ela diz é o caminho: o grupo de cima e o documento em que se está. O separador vem do
 * desenho (`small::after`), para a leitura de ecrã não colar as duas palavras.
 */
function barraDeSecoes(grupo, documento) {
  return `<div class="coluna-barra">
  <span class="coluna-atual"><small>${grupo}</small>${documento}</span>
  <button type="button" class="coluna-abrir" id="coluna-abrir" aria-expanded="false"
    aria-controls="coluna-proposta">Seções <span aria-hidden="true">▾</span></button>
</div>`;
}

/**
 * AS TRÊS CAIXINHAS — e o «?» continua lá, mas quem recebe o toque é a caixinha.
 *
 * Na Produção a caixinha é um `<div>` com um `<button class="q">?</button>` dentro. Aqui a
 * caixinha É o botão, e o «?» é só o desenho que diz «há mais dentro». É a diferença entre
 * acertar num alvo de 20 px e acertar em 100% da caixinha — e resolve, de passagem, um
 * aninhamento de controles que um leitor de ecrã anuncia duas vezes.
 */
function metrica(rotulo, valor, qual, dica) {
  return `<button type="button" class="metrica" data-balao="${qual}" aria-expanded="false"
          aria-controls="p-${qual}-__ID__" aria-label="${dica}">
          <span class="k">${rotulo}</span>
          <span class="v">${valor}</span>
          <span class="q" aria-hidden="true">?</span>
        </button>`;
}

/** O painel que cada caixinha abre. Só um por cartão está visível, e é o da caixinha tocada. */
function painel(qual, conteudo, id) {
  return `      <div class="painel" data-painel="${qual}" id="p-${qual}-${id}" hidden>${conteudo}</div>`;
}

function painelRitmo(p) {
  return '<div class="grade">' + p.ritmoCampos.map(([k, v]) =>
    '<div><span class="k">' + k + '</span><span class="v">' + v + '</span></div>').join('') + '</div>';
}

function painelRegua(p) {
  return '<p class="nota">' + p.reguaNota + '</p>'
    + '<div class="escala">' + p.regua.map((n, i) =>
      '<span class="' + classeDoNivel(n, i, p.regua.length) + '">' + n + '</span>').join('') + '</div>';
}

function painelConteudos(p) {
  return '<div class="chips">'
    + (p.conteudos.length
      ? p.conteudos.map((c) => '<span class="chip">' + c + '</span>').join(' ')
      : '<span class="dono">(nenhum conteúdo associado)</span>')
    + '</div>';
}

function painelTurma(p) {
  return '<p class="nota">Turma do plano: <b>' + p.turma + '</b>.</p>' + painelRitmo(p);
}

function painelProfessor(p) {
  return '<div class="grade"><div><span class="k">Professor curado</span>'
    + '<span class="v">' + p.professor + '</span></div>'
    + '<div><span class="k">Turma</span><span class="v">' + p.turma + '</span></div></div>'
    + '<p class="nota">É a curadoria que liga professor e turma. Sem ela, este plano não existe.</p>';
}

function painelCadeia(p) {
  return '<div class="grade">'
    + '<div><span class="k">Ancorada em</span><span class="v">' + p.ancorada + '</span></div>'
    + '<div><span class="k">Estado do PO</span><span class="v">' + p.po + '</span></div>'
    + '<div><span class="k">Aulas previstas</span><span class="v">' + p.aulas + '</span></div>'
    + '<div><span class="k">Hash</span><span class="v" style="font-size:.74rem;word-break:break-all">'
    + p.hash.slice(0, 16) + '…</span></div></div>'
    + '<p class="nota">A cadeia acrescenta, não edita: um ajuste é um elo novo.</p>';
}

/**
 * UM CARTÃO DE PLANO. `modelo` escolhe o que vão ser as três caixinhas:
 *
 *   · `producao` — Ritmo · Régua · Conteúdos, que são as três de «Turmas cadastradas». É o
 *     modelo adoptado: a lista de planos fica com a mesma cara da lista de turmas, e o
 *     professor reconhece a peça. As quatro colunas que você pediu não se perdem: turma,
 *     professor e data vão na linha de complemento, sempre à vista;
 *   · `caixas` — Turma · Professor · Cadeia, as colunas que você pediu transformadas em
 *     caixinhas. Fica na bancada porque é a alternativa honesta, não porque esteja em cima da
 *     mesa: gasta as três caixinhas a repetir o que a linha de cima já diz.
 */
function cartaoDePlano(p, modelo, id) {
  const busca = chaveDeBusca([p.nome, p.turma, p.professor].join(' '));
  const dados = 'class="item" data-busca="' + busca + '" data-prof="' + p.professor
    + '" data-turma="' + p.turma + '"';
  const selo = '<span class="selo ' + p.poClasse + '">' + p.po + '</span>';
  const acoes = '<a class="acao pequena" href="#">Abrir o plano</a>'
    + '<a class="acao secundario pequena" href="#">Referências</a>'
    + '<a class="acao secundario pequena" href="#">PDF do ciclo</a>';

  const trio = modelo === 'producao'
    ? [
      ['Ritmo', p.ritmo, 'ritmo', 'ver o ritmo desta turma', painelRitmo(p)],
      ['Régua', String(p.regua.length) + ' níveis', 'regua', 'ver a régua desta turma', painelRegua(p)],
      ['Conteúdos', String(p.conteudos.length), 'conteudos', 'ver os conteúdos desta turma', painelConteudos(p)],
    ]
    : [
      ['Turma', p.turma.replace(/ — Teste 1$/, ''), 'turma', 'ver os detalhes desta turma', painelTurma(p)],
      ['Professor', p.professor, 'professor', 'ver o professor vinculado', painelProfessor(p)],
      ['Cadeia', p.po, 'cadeia', 'ver a cadeia deste plano', painelCadeia(p)],
    ];

  // A LINHA DE COMPLEMENTO NÃO REPETE O QUE AS CAIXINHAS DIZEM. Se as caixas são Turma ·
  // Professor · Cadeia, a linha passa a dizer o ciclo e o volume; se as caixas são o ritmo, a
  // régua e os conteúdos, a linha diz de quem é o plano. Em nenhum dos dois casos a mesma
  // informação aparece duas vezes — uma bancada que sabota uma das opções não serve para escolher.
  const dono = modelo === 'producao'
    ? [p.turma, p.professor, 'ancorada em ' + p.ancorada].join(' · ')
    : ['Ciclo 01', p.aulas + ' aulas previstas'].join(' · ');

  return `      <li ${dados}>
        <div class="linha-turma">
          <span class="nome"><b>${p.nome}</b> ${selo}</span>
          <span class="acoes">${acoes}</span>
        </div>
        <div class="dono">${dono}</div>
        <div class="metricas">
        ${trio.map(([r, v, q, d]) => metrica(r, v, q, d).replace(/__ID__/g, id)).join('\n        ')}
        </div>
${trio.map(([, , q, , conteudo]) => painel(q, conteudo, id)).join('\n')}
      </li>`;
}

const RODAPE_DE_PAGINACAO = `<div class="paginacao" hidden>
  <button type="button" class="pag-ant acao secundario pequena" aria-label="Página anterior">‹</button>
  <span class="pag-info"></span>
  <button type="button" class="pag-prox acao secundario pequena" aria-label="Página seguinte">›</button>
</div>`;

/** O filtro — o mesmo em todas as opções, e todo no cliente: nenhuma chamada, nenhuma cota. */
function filtroDePlanos() {
  return `<form class="filtro" onsubmit="return false">
  <div class="caixa filtrar">
    <div class="campo-filtro busca">
      <label class="campo-rotulo" for="f-busca">Procurar</label>
      <input id="f-busca" type="search" placeholder="plano, turma ou professor">
    </div>
    <div class="campo-filtro">
      <label class="campo-rotulo" for="f-prof">Professor</label>
      <select id="f-prof">
        <option value="">todos</option>
        <option>Oculos Redondo</option>
        <option>Perna Boa</option>
      </select>
    </div>
    <div class="campo-filtro">
      <label class="campo-rotulo" for="f-turma">Turma</label>
      <select id="f-turma">
        <option value="">todas</option>
        <option>Balé Nível 1 — Teste 1</option>
        <option>Balé Nível 2 — Teste 1</option>
      </select>
    </div>
    <p class="filtro-conta" id="f-conta">${PLANOS.length} planos</p>
  </div>
</form>`;
}

/** A lista inteira, num dos dois modelos. */
function listaDePlanos(modelo) {
  const cartoes = PLANOS.map((p, i) => cartaoDePlano(p, modelo, String(i + 1))).join('\n');
  return filtroDePlanos()
    + '<ul class="lista">\n' + cartoes + '\n</ul>\n'
    + RODAPE_DE_PAGINACAO;
}

/**
 * O filtro e as caixinhas. TUDO DELEGADO NO DOCUMENTO, e ligado UMA VEZ SÓ.
 *
 * A primeira versão voltava a ligar-se a cada troca de opção — e o ouvinte empilhado desfazia o
 * que o anterior tinha feito: a caixinha abria e fechava no mesmo toque. Delegar resolve as duas
 * coisas de uma vez: o ouvinte é o mesmo para a lista velha e para a nova, e o `itens()` é lido
 * na hora, não guardado numa variável que morre com o primeiro desenho.
 */
function scriptDaLista() {
  return `(function () {
  if (window.__listaDePlanosLigada) { window.aplicarFiltro(); return; }
  window.__listaDePlanosLigada = true;

  function itens() { return [].slice.call(document.querySelectorAll('li.item')); }

  window.aplicarFiltro = function () {
    var busca = document.getElementById('f-busca');
    var prof = document.getElementById('f-prof');
    var turma = document.getElementById('f-turma');
    var conta = document.getElementById('f-conta');
    if (!busca || !conta) return;
    var q = (busca.value || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
    var n = 0;
    var todos = itens();
    todos.forEach(function (l) {
      var ok = (!q || l.getAttribute('data-busca').indexOf(q) !== -1)
        && (!prof.value || l.getAttribute('data-prof') === prof.value)
        && (!turma.value || l.getAttribute('data-turma') === turma.value);
      l.hidden = !ok;
      if (ok) n++;
    });
    conta.textContent = n + (n === 1 ? ' plano' : ' planos') + ' de ' + todos.length;
  };

  document.addEventListener('input', function (e) {
    if (e.target.closest('.filtro')) window.aplicarFiltro();
  });
  document.addEventListener('change', function (e) {
    if (e.target.closest('.filtro')) window.aplicarFiltro();
  });

  // A CAIXINHA INTEIRA É O CONTROLE. Uma aberta por cartão; a caixinha acesa diz qual.
  function fechar(outro) {
    [].slice.call(document.querySelectorAll('.metrica[aria-expanded="true"]')).forEach(function (b) {
      if (b === outro) return;
      b.setAttribute('aria-expanded', 'false');
      var p = b.closest('li.item').querySelector('.painel:not([hidden])');
      if (p) p.hidden = true;
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.metrica');
    if (!b) {
      if (!e.target.closest('.painel') && !e.target.closest('.filtro')) fechar(null);
      return;
    }
    var abrir = b.getAttribute('aria-expanded') !== 'true';
    fechar(b);
    var painel = b.closest('li.item').querySelector('[data-painel="' + b.getAttribute('data-balao') + '"]');
    if (painel) painel.hidden = !abrir;
    b.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(null); });

  window.aplicarFiltro();
})();`;
}

/**
 * O comando do menu e dos grupos.
 *
 * TUDO DELEGADO NO DOCUMENTO, E LIGADO UMA VEZ SÓ. A versão anterior prendia ouvintes aos
 * elementos e voltava a prendê-los a cada troca de opção — e como a coluna e a barra são
 * RECONSTRUÍDAS a cada troca, o ouvinte antigo morria com o elemento e o novo empilhava sobre o
 * que sobrava. O sintoma era o pior possível: o ☰ abria e fechava no mesmo toque.
 *
 * Com delegação, o ouvinte não conhece os elementos: pergunta ao documento, na hora do clique,
 * onde é que ele caiu. Uma vez ligado, serve a coluna velha e a nova.
 *
 * OS TRÊS CAMINHOS DE ABERTURA DOS GRUPOS, e porque são três:
 *   · PONTEIRO — `:hover`, e só em aparelho que tem ponteiro (@media (hover: hover)). Num
 *     telemóvel o `:hover` fica «colado» depois do toque, e o grupo nunca mais fecharia;
 *   · TOQUE — o clique no título fixa o grupo aberto (`data-aberto="sim"` e `data-pinado="sim"`);
 *   · TECLADO — o foco dentro do grupo abre-o em `data-aberto="auto"`, e ao sair volta a fechar.
 *     `auto` é um terceiro estado de propósito: sem ele, `focusout` não sabe se deve fechar (foi
 *     o teclado que abriu) ou deixar (foi a pessoa que abriu).
 */
function scriptDoMenu() {
  return `(function () {
  if (window.__menuLigado) return;
  window.__menuLigado = true;

  var html = document.documentElement;
  var veu = document.querySelector('.veu');

  function coluna() { return document.getElementById('coluna-proposta'); }
  function lateral() { return /^(aberta|acordeao|marcada)$/.test(html.getAttribute('data-nav') || ''); }
  function barra() { return document.querySelector('.topnav'); }
  function botao() { return document.querySelector('.topnav .hamburger'); }
  function estreita() { return window.matchMedia('(max-width: 768px)').matches; }

  /* A FOLHA DO CELULAR — a mecânica da Produção. data-aberta é o estado DELA; body.coluna-aberta
     é o que acende o véu. Os dois porque são dois desenhos: a folha desliza por data-aberta, e o
     véu por uma classe no body — um véu dentro de um overflow-y:auto rolaria com o conteúdo. */
  function abrirFolha(sim) {
    var c = coluna();
    if (c) c.setAttribute('data-aberta', sim ? 'sim' : 'nao');
    document.body.classList.toggle('coluna-aberta', !!sim);
    var ab = document.getElementById('coluna-abrir');
    if (ab) ab.setAttribute('aria-expanded', String(!!sim));
    if (estreita() && botao()) botao().setAttribute('aria-expanded', String(!!sim));
  }
  function fechar() {
    abrirFolha(false);
    if (barra()) barra().classList.remove('aberto');
    if (botao() && !estreita()) botao().setAttribute('aria-expanded', 'false');
  }

  // ---------------------------------------------------------------- os grupos da coluna
  function por(g, estado) {
    g.setAttribute('data-aberto', estado);
    var b = g.querySelector('.grupo-titulo');
    if (b) b.setAttribute('aria-expanded', String(estado !== 'nao'));
  }
  function recolher(excepto) {
    [].slice.call(document.querySelectorAll('.coluna .grupo')).forEach(function (g) {
      if (g === excepto) return;
      if (g.getAttribute('data-pinado') === 'sim') return;
      var b = g.querySelector('.grupo-titulo');
      if (b && b.getAttribute('aria-expanded') === 'true') por(g, 'nao');
    });
  }

  // ---------------------------------------------------------------- os cliques
  document.addEventListener('click', function (e) {
    // 1. o ☰ da barra do sistema
    if (e.target.closest('.topnav .hamburger')) {
      var b = botao();
      if (!lateral()) { if (barra()) b.setAttribute('aria-expanded', String(barra().classList.toggle('aberto'))); return; }
      // Na coluna, o ☰ abre a MESMA folha que o «Seções»: a lei das duas navegações manda o
      // hambúrguer para a navegação global, e ele continua a abri-la — só mudou a apresentação.
      var c0 = coluna();
      abrirFolha(!c0 || c0.getAttribute('data-aberta') !== 'sim');
      return;
    }

    // 2. o botão «Seções» da barra da página — o gatilho da Produção
    if (e.target.closest('.coluna-abrir')) {
      var c1 = coluna();
      abrirFolha(!c1 || c1.getAttribute('data-aberta') !== 'sim');
      return;
    }

    // 3. o véu
    if (e.target.closest('.veu')) { fechar(); return; }

    // 4. o título de um grupo (a coluna estática, no computador)
    var titulo = e.target.closest('.coluna .grupo-titulo');
    if (titulo) {
      var g = titulo.closest('.grupo');
      if (!g || !lateral() || estreita()) return; // no celular o grupo é só um título
      var abrir = g.getAttribute('data-aberto') !== 'sim';
      recolher(g);
      g.setAttribute('data-pinado', abrir ? 'sim' : 'nao');
      por(g, abrir ? 'sim' : 'nao');
      return;
    }

    // 5. escolher um destino da folha fecha-a — como na Produção. Deixá-la aberta taparia
    //    justamente a página que se acabou de pedir.
    var alvo = e.target.closest('a[href]');
    var c2 = coluna();
    if (estreita() && alvo && c2 && c2.contains(alvo) && c2.getAttribute('data-aberta') === 'sim') {
      fechar();
      return;
    }

    // 6. um toque fora de um grupo aberto recolhe-o
    if (!e.target.closest('.coluna .grupo')) recolher(null);
  });

  // ---------------------------------------------------------------- o teclado
  document.addEventListener('focusin', function (e) {
    var g = e.target.closest && e.target.closest('.coluna .grupo');
    if (!g || !lateral() || estreita()) return;
    if (g.getAttribute('data-aberto') === 'sim') return;
    por(g, 'auto');
    recolher(g);
  });
  document.addEventListener('focusout', function (e) {
    var g = e.target.closest && e.target.closest('.coluna .grupo');
    if (!g) return;
    if (e.relatedTarget && g.contains(e.relatedTarget)) return;
    if (g.getAttribute('data-pinado') === 'sim') return;
    por(g, 'nao');
  });
  // O PONTEIRO SAI DO GRUPO — o :hover do CSS já o fecha; isto limpa o estado «auto» para ele não
  // ficar pendurado e reabrir sozinho no próximo foco.
  document.addEventListener('mouseleave', function (e) {
    var g = e.target.closest && e.target.closest('.coluna .grupo');
    if (!g) return;
    if (g.getAttribute('data-pinado') === 'sim') return;
    if (g.getAttribute('data-aberto') === 'auto' && !g.contains(document.activeElement)) por(g, 'nao');
  }, true);

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
  window.aoTrocarOpcao = function (opcao) { html.setAttribute('data-nav', opcao); fechar(); };
})();`;
}

/*
 * A FOLHA DESTA BANCADA. Duas partes, e a segunda é a que interessa:
 *
 *   · a COLUNA, que é a peça que se propõe. Todo o traço, cor e espaço vem dos papéis da folha
 *     (`--marca-fundo`, `--ornamento-forte`, `--raio-2`, `--esp-*`), porque é isso que a deixa
 *     nascer em `tools/templates/ciclo.css` sem inventar um valor — um tema troca o valor do
 *     papel, e a coluna acompanha;
 *   · a LISTA, que não é peça nova: são as regras de «Turmas cadastradas» da Produção, copiadas
 *     com os valores intactos. Copiadas, e não reinventadas, é o ponto: o que se decide aqui é
 *     ADOPTAR aquela identidade, e a única prova de que foi adoptada é não ter uma segunda.
 */
const CSS_NAV = `
/* ---------- a bancada e a nota (comuns às duas propostas) ---------- */
.nota-do-teste {
  max-width: 900px; margin: 0 auto var(--esp-5); padding: var(--esp-4) var(--esp-5);
  border: 1px solid var(--borda); border-left: 4px solid var(--marca);
  border-radius: var(--raio-2); background: var(--fundo-suave);
  font-size: 15px; color: var(--texto-suave);
}
.nota-do-teste p { margin: 0 0 var(--esp-2); }
.nota-do-teste p:last-child { margin: 0; }
.nota-do-teste strong { color: var(--texto); }

/* ---------- A COLUNA: a peça que se propõe ---------- */
.coluna { display: none; }
[data-nav="aberta"] .coluna, [data-nav="acordeao"] .coluna, [data-nav="marcada"] .coluna { display: flex; }
.coluna {
  position: fixed; top: 0; left: 0; bottom: 0; width: 248px; z-index: 21;
  flex-direction: column; overflow-y: auto; overflow-x: hidden;
  background: var(--marca-fundo); color: var(--sobre-marca);
  border-right: 3px solid var(--ornamento-forte);
  padding: var(--esp-4) var(--esp-3) var(--esp-5);
  box-shadow: var(--sombra-menu);
}
.coluna-marca {
  display: block; margin: 0 0 var(--esp-4); padding: 0 10px;
  font: 700 12px/1.2 var(--ui); letter-spacing: .12em; text-transform: uppercase;
  color: var(--ornamento-forte); text-decoration: none;
}
.coluna-marca:hover { color: var(--sobre-marca); }

/* O grupo: um título que abre, e os itens por baixo. O título é um botão porque também
   tem de funcionar sem ponteiro — no telemóvel e no teclado não há hover. */
.coluna .grupo { display: block; }
.coluna .grupo-titulo {
  display: flex; align-items: center; justify-content: space-between; gap: var(--esp-2);
  width: 100%; margin: 0; padding: 9px 10px; border: 0; border-radius: var(--raio-2);
  background: none; color: var(--sobre-marca); cursor: pointer;
  font: 15px/1.25 var(--ui); text-align: left;
}
.coluna .grupo-titulo:hover { background: var(--marca-fundo-hover); }
.coluna .grupo-titulo:focus-visible { outline: 2px solid var(--ornamento-forte); outline-offset: -2px; }
.coluna .grupo[data-aberto="sim"] > .grupo-titulo,
.coluna .grupo[data-aberto="auto"] > .grupo-titulo { background: var(--marca-fundo-hover); }
.coluna .seta { flex: 0 0 auto; opacity: .75; transition: transform .16s ease; }
.coluna .grupo[data-aberto="sim"] .seta,
.coluna .grupo[data-aberto="auto"] .seta { transform: rotate(90deg); }

/* O ACORDEÃO. max-height em vez de display:none porque é o que ANIMA e o que EMPURRA os
   de baixo — que é exactamente o que se quer: quando abre, os outros descem, e quando fecha
   voltam a subir. O filete à esquerda é o que diz que os itens pertencem ao grupo de cima. */
.coluna .grupo-itens {
  max-height: 0; overflow: hidden;
  margin: 0 0 0 10px; padding-left: 9px;
  border-left: 1px solid var(--ornamento);
  transition: max-height .16s ease;
}
.coluna .grupo-itens a {
  display: block; padding: 8px 10px; border-radius: var(--raio-2);
  color: var(--sobre-marca); text-decoration: none; font: 14px/1.25 var(--ui);
}
.coluna .grupo-itens a:hover { background: var(--marca-fundo-hover); }
.coluna .grupo-itens a:focus-visible { outline: 2px solid var(--ornamento-forte); outline-offset: -2px; }
.coluna .grupo-itens a[aria-current="page"] { background: var(--ativo-fundo); color: var(--ativo-texto); font-weight: 700; }
.coluna .grupo[data-aberto="sim"] > .grupo-itens,
.coluna .grupo[data-aberto="auto"] > .grupo-itens { max-height: 15rem; }

/* SÓ ONDE HÁ PONTEIRO. Num telemóvel o :hover fica colado ao toque e o grupo não fecharia. */
@media (hover: hover) {
  .coluna[data-compacta="sim"] .grupo:hover > .grupo-itens { max-height: 15rem; }
  .coluna[data-compacta="sim"] .grupo:hover > .grupo-titulo { background: var(--marca-fundo-hover); }
  .coluna[data-compacta="sim"] .grupo:hover .seta { transform: rotate(90deg); }
}
/* A coluna sempre aberta não tem acordeão nenhum. */
.coluna[data-compacta="nao"] .grupo-itens { max-height: none; }
.coluna[data-compacta="nao"] .seta { display: none; }
.coluna[data-compacta="nao"] .grupo-titulo { cursor: default; font-weight: 600; }

/* O GRUPO DO DOCUMENTO ACTUAL, MARCADO SEM ABRIR — a leitura mais compacta. Um filete de ouro
   à esquerda e o título na cor do ornamento: diz «estás aqui» sem gastar uma linha de altura, e
   sem depender de o item estar à vista. */
.coluna .grupo[data-atual="sim"] > .grupo-titulo {
  color: var(--ornamento-forte); font-weight: 700;
  box-shadow: inset 3px 0 0 var(--ornamento-forte);
}
.coluna .grupo[data-atual="sim"] > .grupo-titulo .seta { opacity: 1; }

/* «Aulas» é um destino, não uma pasta: sem seta, e com o peso de um título. */
.coluna a.direto {
  display: block; padding: 9px 10px; border-radius: var(--raio-2);
  color: var(--sobre-marca); text-decoration: none; font: 700 15px/1.25 var(--ui);
}
.coluna a.direto:hover { background: var(--marca-fundo-hover); }

/* ---------- a barra de cima, quando há coluna ----------
   A BARRA FICA AO LADO DA COLUNA, e não por baixo dela: o body é quem cede a largura. */
[data-nav="aberta"] body, [data-nav="acordeao"] body, [data-nav="marcada"] body { padding-left: 248px; }
[data-nav="aberta"] .topnav, [data-nav="acordeao"] .topnav, [data-nav="marcada"] .topnav { left: 248px; }
/* O documento actual, à esquerda da barra; o Bastidores, na ponta oposta. Os dois são
   arranjos de CSS sobre a barra que o desenhar() já produz — nenhum HTML novo. */
[data-nav="aberta"] .doc-atual, [data-nav="acordeao"] .doc-atual,
[data-nav="marcada"] .doc-atual {
  margin-left: var(--esp-3); padding-left: var(--esp-3);
  border-left: 2px solid var(--ornamento-forte);
  font: 600 14px/1.2 var(--ui); color: var(--sobre-marca);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto;
}
[data-nav="aberta"] .topnav .nav-links, [data-nav="acordeao"] .topnav .nav-links,
[data-nav="marcada"] .topnav .nav-links {
  flex: 0 0 auto; margin-left: auto;
}
.doc-atual { display: none; }
[data-nav="aberta"] .doc-atual, [data-nav="acordeao"] .doc-atual,
[data-nav="marcada"] .doc-atual { display: inline-block; }
.veu { display: none; }

/* ---------- A BARRA DA PÁGINA — só no celular ----------
   É a .lateral-barra da Produção, com outra roupa. Ela nasce oculta fora da media query: em
   tela larga a navegação é a coluna, e não há nada a subir. */
.coluna-barra { display: none; }
.coluna-puxador { display: none; }

/* ---------- O CELULAR: A MESMA SOLUÇÃO DA PRODUÇÃO (23/10/2026) ----------
   A coluna deixa de ser gaveta lateral e passa a ser FOLHA INFERIOR: sobe de baixo, com o
   pegador, os cantos de cima arredondados, o véu atrás e o limite de 78vh. É a mecânica da
   Produção, e é a mesma peça — não há uma segunda lista para envelhecer.

   DUAS COISAS MUDAM EM RELAÇÃO À PRODUÇÃO, e as duas são declaradas:
   · o FUNDO fica o da coluna (burgundy), e não o branco da folha da Produção. A lei das duas
     navegações (IDENTIDADE-VISUAL.md) diz que a do SISTEMA e a da PÁGINA não são a mesma
     coisa, e a cor é o que as distingue. A mecânica é emprestada; o papel, não;
   · o GATILHO é duplo: o botão «Seções» desta barra — como na Produção — e o ☰ da barra do
     sistema, que já existia. A lei manda o hambúrguer para a navegação global; ele continua a
     abrir a mesma folha, em vez de ficar sem função. */
@media (max-width: 768px) {
  [data-nav="aberta"] body, [data-nav="acordeao"] body, [data-nav="marcada"] body { padding-left: 0; }
  [data-nav="aberta"] .topnav, [data-nav="acordeao"] .topnav, [data-nav="marcada"] .topnav { left: 0; }
  .doc-atual { display: none !important; }

  .coluna-barra {
    display: flex; align-items: center; gap: var(--esp-3);
    padding: var(--esp-4) var(--esp-4) 0;
  }
  .coluna-atual {
    min-width: 0; display: flex; align-items: baseline; gap: 6px;
    font: 700 15px/1.25 var(--ui); color: var(--texto);
  }
  .coluna-atual small {
    font: 700 10px/1.3 var(--ui); letter-spacing: .09em;
    text-transform: uppercase; color: var(--texto-suave);
  }
  /* O separador é do desenho, não do conteúdo: sem ele os dois versos correm juntos na
     leitura de ecrã («CiclosPlanos do ciclo»). */
  .coluna-atual small::after { content: "·"; margin-left: 5px; }
  .coluna-abrir {
    margin-left: auto; flex: 0 0 auto; cursor: pointer;
    border: 1px solid var(--borda-campo); border-radius: var(--raio-pilula);
    background: var(--superficie); padding: .5rem .85rem;
    font: 600 .82rem/1 var(--ui); color: var(--marca);
    display: inline-flex; align-items: center; gap: 5px;
  }
  .coluna-abrir:hover { filter: brightness(.97); }
  .coluna-abrir:active { transform: translateY(1px); }
  .coluna-abrir:focus-visible { outline: 2px solid var(--marca); outline-offset: 2px; }

  /* A COLUNA VIRA FOLHA. top:auto é o que desfaz o top:0; bottom:0 do desktop — sem ele a
     folha continuaria a ocupar a altura toda e o translateY não teria para onde a esconder. */
  .coluna {
    position: fixed; left: 0; right: 0; bottom: 0; top: auto;
    width: auto; max-width: none; z-index: 60;
    border-right: 0; border-radius: var(--raio-3) var(--raio-3) 0 0;
    box-shadow: 0 -12px 34px rgba(31, 28, 26, .20);
    padding: 0 0 calc(var(--esp-4) + env(safe-area-inset-bottom, 0px));
    max-height: 78vh; overflow-y: auto;
    transform: translateY(101%); transition: transform .22s ease;
  }
  .coluna[data-aberta="sim"] { transform: translateY(0); }
  .coluna-puxador {
    display: block; width: 36px; height: 4px; border-radius: 2px;
    background: var(--ornamento); opacity: .55; margin: 10px auto 2px;
  }
  .coluna .coluna-marca { padding: var(--esp-3) var(--esp-5) var(--esp-2); margin: 0; }

  /* NA FOLHA NÃO HÁ ACORDEÃO: a altura é a da tela quase inteira, e um menu que abre e fecha
     dentro de uma folha é um menu a esconder-se dentro de outro. Tudo à vista. */
  .coluna[data-compacta="sim"] .grupo-itens { max-height: none; }
  .coluna[data-compacta="sim"] .seta { display: none; }
  .coluna[data-compacta="sim"] .grupo-titulo { cursor: default; }
  /* Os grupos passam a <h2> no desenho — miúdos, em maiúsculas, como os da Produção — e os
     destinos a uma linha alta de dedo.
     SEM opacity NOS TEXTOS, e isto é medido: --gold-claro sobre o burgundy da folha dá
     5,03:1, que é exactamente o mínimo AA. A .85 que aqui esteve baixava-o para 4,05:1 e
     reprovava. A hierarquia faz-se pelo tamanho e pelo espaço, não por transparência. */
  .coluna .grupo-titulo {
    padding: var(--esp-3) var(--esp-5) var(--esp-1);
    font: 700 10.5px/1 var(--ui); letter-spacing: .1em; text-transform: uppercase;
    color: var(--texto-destaque-marca); border-radius: 0;
  }
  .coluna .grupo-titulo:hover { background: none; }
  .coluna .grupo-itens { margin: 0; padding-left: 0; border-left: 0; }
  .coluna .grupo-itens a {
    display: flex; align-items: center; gap: .6rem;
    padding: .8rem var(--esp-5); border-radius: 0; font-size: 1rem;
  }
  .coluna .grupo-itens a[aria-current="page"]::after { content: "✓"; margin-left: auto; }
  .coluna a.direto { padding: .8rem var(--esp-5); border-radius: 0; font-size: 1rem; font-weight: 600; }
  .coluna .grupo[data-atual="sim"] > .grupo-titulo { box-shadow: none; color: var(--ornamento-forte); }

  /* O VÉU. Ele mora fora da coluna e é o body quem o mostra — na Produção é a .lateral que
     o acende, mas lá a folha é a própria .lateral; aqui a coluna é overflow-y:auto e um véu
     dentro dela rolaria junto. */
  .veu {
    display: block; position: fixed; inset: 0; z-index: 55;
    background: rgba(31, 28, 26, .36); opacity: 0; pointer-events: none;
    transition: opacity .2s ease;
  }
  body.coluna-aberta .veu { opacity: 1; pointer-events: auto; }
}

/* ---------- O FILTRO ---------- */
.filtro { margin: 0 0 var(--esp-4); }
.caixa.filtrar {
  display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--esp-4);
  margin: 0; padding: var(--esp-4);
}
.campo-filtro { display: flex; flex-direction: column; gap: var(--esp-1); }
.campo-filtro .campo-rotulo { margin: 0; }
.campo-filtro.busca { flex: 1 1 260px; }
.campo-filtro select { min-width: 190px; }
.filtro-conta { margin: 0 0 4px auto; font: 13px/1 var(--ui); color: var(--texto-suave); }
@media (max-width: 768px) {
  .caixa.filtrar { padding: var(--esp-3); gap: var(--esp-3); }
  .campo-filtro select { min-width: 0; }
  .campo-filtro:not(.busca) { flex: 1 1 45%; }
  .filtro-conta { margin: 0; flex-basis: 100%; }
}

/* ---------- A LISTA — as regras de «Turmas cadastradas», sem uma cor nova ----------
   Copiadas de motor/servidor/bastidores.js (o bloco de .turma), com os valores intactos.
   O que muda é o nome do invólucro (li.item em vez de li.turma), porque a peça passa a
   servir duas listas — e é essa a promessa: uma peça, duas listas. */
.lista { list-style: none; margin: 0; padding: 0; }
li.item { display: block; margin-bottom: .6rem; }
li.item .linha-turma { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
li.item .linha-turma .nome { flex: 1 1 14rem; min-width: 0; }
li.item .linha-turma .acoes { margin-left: auto; display: inline-flex; gap: .3rem; flex-wrap: wrap; }
li.item .dono { color: var(--texto-suave); font-size: .85rem; margin-top: .15rem; }

li.item .metricas {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .5rem; margin: .6rem 0 0;
}
@media (max-width: 360px) { li.item .metricas { grid-template-columns: minmax(0, 1fr); } }

/* A CAIXINHA É O BOTÃO. O appearance/border/font de origem têm de sair, senão vem o
   controle do navegador por cima do desenho — e o text-align: left é o que impede o rótulo
   de ir para o centro, que é o que um <button> faz por omissão. */
li.item .metrica {
  position: relative; display: block; width: 100%; margin: 0; text-align: left;
  appearance: none; -webkit-appearance: none;
  background: var(--fundo-suave); border: 1px solid var(--borda-campo);
  border-radius: var(--raio-2); padding: .45rem 1.9rem .45rem .6rem; min-width: 0;
  cursor: pointer; font: inherit; color: inherit;
}
li.item .metrica:hover { background: var(--fundo-hover); border-color: var(--borda-forte); }
li.item .metrica:focus-visible { outline: 2px solid var(--marca); outline-offset: 1px; }
li.item .metrica .k {
  display: block; font: 700 .66rem/1.2 var(--ui); letter-spacing: .08em; text-transform: uppercase;
  color: var(--texto-suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
li.item .metrica .v {
  display: block; font: 700 .95rem/1.25 var(--ui); color: var(--texto);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* A caixinha DIZ que está aberta. Sem isto o painel aparece abaixo da fila e não se sabe de
   onde veio — e com três caixinhas iguais, é a única pista. */
li.item .metrica[aria-expanded="true"] { background: var(--fundo-citacao); border-color: var(--borda-forte); }
/* O «?» fica: é o que diz que há mais dentro. Deixa de ser controle e passa a ser desenho —
   por isso aria-hidden na marcação, e nenhum cursor próprio. */
li.item .metrica .q {
  position: absolute; top: .28rem; right: .28rem; width: 1.25rem; height: 1.25rem;
  border-radius: var(--raio-pilula); border: 1px solid var(--borda-campo);
  background: var(--superficie); color: var(--texto-suave);
  font: 700 .72rem/1 var(--ui); display: grid; place-items: center; pointer-events: none;
}
li.item .metrica[aria-expanded="true"] .q {
  background: var(--marca-fundo); color: var(--sobre-marca); border-color: var(--marca-fundo);
}

li.item .painel {
  margin: .55rem 0 0; padding: .7rem .8rem; background: var(--fundo-citacao);
  border: 1px solid var(--borda-campo); border-radius: var(--raio-2);
}
li.item .painel[hidden] { display: none; }
li.item .painel .grade { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem .9rem; }
li.item .painel .grade .k {
  display: block; font: 700 .66rem/1.2 var(--ui); letter-spacing: .08em; text-transform: uppercase;
  color: var(--texto-suave);
}
li.item .painel .grade .v { display: block; font: 700 .88rem/1.35 var(--ui); color: var(--texto); }
li.item .painel .nota { margin: .6rem 0 0; font-size: .8rem; line-height: 1.4; color: var(--texto-suave); }
li.item .painel .nota:first-child { margin-top: 0; }
li.item .painel .chips { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem; }
li.item .painel .escala {
  display: flex; min-width: 0; border: 1px solid var(--borda-campo);
  border-radius: var(--raio-2); overflow: hidden; margin-top: .5rem;
}
li.item .painel .escala span {
  flex: 1 1 0; min-width: 0; text-align: center; padding: .3rem .2rem;
  font: 700 .72rem/1.2 var(--ui); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.nivel-ok { background: var(--ok); color: var(--superficie); }
.nivel-razoavel { background: var(--ok-fundo); color: var(--ok); box-shadow: inset 0 0 0 1px var(--ok); }
.nivel-alerta { background: var(--alerta); color: var(--superficie); }
.nivel-neutro { background: var(--fundo-faixa); color: var(--texto-suave); }
.chip {
  display: inline-block; margin: 0; padding: .1rem .45rem; background: var(--fundo-faixa);
  border: 1px solid var(--borda-campo); border-radius: var(--raio-pilula);
  font-size: .82rem; color: var(--texto);
}
.paginacao {
  display: flex; align-items: center; justify-content: flex-end; gap: .5rem;
  padding: .5rem 0 .1rem; font-size: .85rem; color: var(--texto-suave);
}
.selo { display: inline-block; }
`;

/** O esqueleto das duas páginas: coluna (quando há), barra, conteúdo, bancada. */
function paginaDeNav({ titulo, opcaoInicial, nav, barra, secoes, corpo }) {
  return `<!DOCTYPE html>
<html lang="pt-BR" data-opcao="${opcaoInicial}" data-nav="${nav || opcaoInicial}">
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
${CSS_NAV}
</style>
</head>
<body>

${barra}
<div class="veu" aria-hidden="true"></div>
${secoes || ''}

${corpo}

</body>
</html>
`;
}

const OPCOES_NAV = [
  { id: 'hoje', n: '0', t: 'Hoje — a barra com 24 entradas', m: '1,6 tela',
    d: 'controle: cada documento é uma entrada; no celular, com os grupos abertos, o painel mede 1298 px' },
  { id: 'aberta', n: 'A', t: 'Coluna sempre aberta', m: '485 px',
    d: 'os 11 destinos à vista de uma vez; o menu sai do caminho, e o olho tem de varrer a coluna toda' },
  { id: 'acordeao', n: 'B', t: 'Compacta, o grupo actual aberto', m: '284 px',
    d: 'quatro títulos, mais os itens do documento actual à vista: sabe-se onde se está sem procurar' },
  { id: 'marcada', n: 'C', t: 'Compacta, só o grupo actual marcado', m: 'ESCOLHIDA · 217 px',
    d: 'tudo fechado; o grupo do documento leva um filete de ouro. A mais curta, e ainda diz onde se está' },
];

function proporNavegacao() {
  const corpo = `<header class="doc">
  <h1>Planos do ciclo</h1>
  <p class="subtitulo">Calango · 2 turmas · 2 planos</p>
</header>

<main>
<div class="conteudo">

<div class="nota-do-teste">
  <p><strong>A coluna é a decidida — com uma correção.</strong> Na versão de ontem ela mostrava os
  onze destinos de uma vez. Agora ela é <em>compacta</em>: mostra quatro títulos, e o grupo abre
  quando o ponteiro entra, empurrando os de baixo para baixo. O grupo do documento actual já nasce
  aberto — sem isso, na coluna recolhida, perde-se a única pista de onde se está.</p>
  <p><strong>O Bastidores saiu da coluna.</strong> Ele está na barra de cima, na ponta oposta à
  marca, com o Estúdio e a Produção. A coluna fica com o trabalho de sala: Sistema Lastro, Ciclos,
  Aulas, Planejamento, Área do Professor.</p>
  <p><strong>B e C são as duas leituras do mesmo acordeão</strong>, e a diferença é uma tensão que
  vale a pena ver de perto: você pediu a coluna compacta <em>e</em> pediu para saber onde está.
  Medido: <strong>A</strong> ocupa <strong>485 px</strong>, <strong>B</strong> ocupa
  <strong>284 px</strong> e <strong>C</strong> ocupa <strong>217 px</strong>. Em <strong>B</strong>
  o grupo do documento abre e vê-se o item aceso; em <strong>C</strong> fecha-se tudo e o grupo leva
  um filete de ouro no título — o «onde estou» passa a ser do grupo, não do item.</p>
  <p>Ponha o ponteiro em <em>Ciclos</em>, depois em <em>Área do Professor</em>: o grupo abre,
  empurra os de baixo para baixo, e fecha quando o ponteiro sai. É o mesmo movimento nos dois.</p>
  <p><strong>No celular, a coluna vira FOLHA INFERIOR</strong> — a mesma solução da Produção: uma
  linha com o grupo e o documento em que se está, um botão <em>Seções</em>, e a navegação sobe de
  baixo com o pegador, o véu atrás e o limite de 78vh. Escolher fecha a folha. Abra esta página no
  telemóvel, ou estreite a janela abaixo de 768 px, para a ver.</p>
</div>

${listaDePlanos('producao')}

</div>
</main>`;

  const barraDaColuna = [
    colunaDoMenu(true, true),
    barraDoMenu(MENU_DA_BARRA, '/ciclos/planos/', '<span class="doc-atual">Planos do ciclo</span>'),
  ].join('\n');

  const base = paginaDeNav({
    titulo: 'O menu que deixa de contar documentos',
    opcaoInicial: 'marcada',
    barra: barraDaColuna,
    secoes: barraDeSecoes('Ciclos', 'Planos do ciclo'),
    corpo,
  });

  /* A COLUNA E A BARRA MUDAM COM A OPÇÃO. As três formas são montadas AQUI, no construtor, e o
   * script só troca qual delas o `<html data-nav>` deixa aparecer — porque cada uma é um HTML
   * diferente, e desenhá-las em tempo de execução seria reimplementar o `nav.desenhar()`. */
  const barraDeHoje = barraDoMenu(MENU_DE_HOJE, '/documentos/');
  const colunaAberta = colunaDoMenu(false);
  const colunaCompacta = colunaDoMenu(true, false);
  const colunaMarcada = colunaDoMenu(true, true);
  const barraDasColunas = barraDoMenu(MENU_DA_BARRA, '/ciclos/planos/',
    '<span class="doc-atual">Planos do ciclo</span>');

  const troca = `(function () {
  var BARRAS = {
    hoje: ${JSON.stringify(barraDeHoje)},
    aberta: ${JSON.stringify(barraDasColunas)},
    acordeao: ${JSON.stringify(barraDasColunas)},
    marcada: ${JSON.stringify(barraDasColunas)}
  };
  var COLUNAS = {
    aberta: ${JSON.stringify(colunaAberta)},
    acordeao: ${JSON.stringify(colunaCompacta)},
    marcada: ${JSON.stringify(colunaMarcada)}
  };
  var html = document.documentElement;
  var alvo = document.querySelector('.topnav');
  var coluna = document.getElementById('coluna-proposta');
  function por(opcao) {
    if (BARRAS[opcao] && alvo) {
      var molde = document.createElement('div');
      molde.innerHTML = BARRAS[opcao];
      var nova = molde.firstElementChild;
      alvo.replaceWith(nova);
      alvo = nova;
    }
    if (COLUNAS[opcao] && coluna) {
      var m2 = document.createElement('div');
      m2.innerHTML = COLUNAS[opcao];
      var novaColuna = m2.firstElementChild;
      coluna.replaceWith(novaColuna);
      coluna = novaColuna;
    }
  }
  por(html.getAttribute('data-nav'));
  var anterior = window.aoTrocarOpcao;
  window.aoTrocarOpcao = function (opcao) {
    if (typeof anterior === 'function') anterior(opcao);
    por(opcao);
  };
})();`;

  return base
    .replace('</body>', `${marcacaoDaBancada({
      sobre: 'Proposta 3 de 4 · o menu',
      titulo: 'Onde o menu se lê',
      intro: 'Três desfechos sobre a mesma página. As entradas são contadas do menu real; a '
        + 'altura do painel e a largura da coluna são medidas no navegador.',
      opcoes: OPCOES_NAV,
      inicio: 'marcada',
    })}
<script>${scriptDaBancada(OPCOES_NAV)}</script>
<script>${scriptDoMenu()}</script>
<script>${troca}</script>
<script>${scriptDaLista()}</script>
</body>`);
}

const OPCOES_LISTA = [
  { id: 'producao', n: '1', t: 'Ritmo · Régua · Conteúdos', m: '141 px/plano',
    d: 'a decoração da Produção com outra matéria: os dados de trabalho da turma atrás do «?»' },
  { id: 'caixas', n: '2', t: 'Turma · Professor · Cadeia', m: 'ESCOLHIDA · 141 px',
    d: 'as quatro colunas em três caixinhas; a linha de complemento fica com o ciclo e o volume' },
];

function proporListagem() {
  const corpo = `<header class="doc">
  <h1>Planos do ciclo</h1>
  <p class="subtitulo">Calango · 2 turmas · 2 planos</p>
</header>

<main>
<div class="conteudo">

<div class="nota-do-teste">
  <p><strong>A peça é a mesma da Produção, e é isso que se está a decidir.</strong> O cartão, a
  linha do nome com as ações, a linha de complemento e as três caixinhas com o «?» são as regras de
  <em>Turmas cadastradas</em>, copiadas com os valores intactos — nenhuma cor, raio ou espaço
  novo. O que muda é o invólucro, porque a peça passa a servir duas listas.</p>
  <p><strong>A caixinha toda é clicável.</strong> O «?» continua lá, mas deixou de ser o alvo: na
  Produção ele é um botão de 20 px dentro da caixinha; aqui a caixinha <em>é</em> o botão, e o «?»
  é o desenho que diz «há mais dentro». Toque em qualquer ponto de <em>Ritmo</em>, de
  <em>Régua</em> ou de <em>Conteúdos</em> — no computador e no telemóvel.</p>
  <p>Abre uma por cartão, fecha com o mesmo toque, com <em>Escape</em> ou tocando fora. A caixinha
  acesa diz qual está aberta.</p>
  <p><strong>Escolhida a opção 2</strong>, e ela fica ao lado da lista de turmas sem se confundir
  com ela: as caixinhas são <em>Turma · Professor · Cadeia</em>, e o ritmo, a régua e os conteúdos
  ficam a um toque, no cartão da turma. A linha de complemento fica com o ciclo e o volume, para
  nenhum dado aparecer duas vezes.</p>
  <p><strong>As duas ocupam o mesmo</strong> — 141 px por plano no computador, 178 px no celular —
  porque o que muda é a matéria dentro das caixinhas, não a caixinha. Medir não serviu para
  escolher entre elas: serviu para saber que a escolha não custa altura.</p>
</div>

<div id="lista-destino">
${listaDePlanos('caixas')}
</div>

</div>
</main>`;

  const barra = [
    colunaDoMenu(true, true),
    barraDoMenu(MENU_DA_BARRA, '/ciclos/planos/', '<span class="doc-atual">Planos do ciclo</span>'),
  ].join('\n');

  /* `nav` e `opcao` são coisas diferentes nesta página: a opção é o que a BANCADA compara (o que
   * vão ser as três caixinhas), e o `nav` é o menu — que aqui já é o decidido. Sem esta separação
   * a página da listagem mostrava a barra de hoje, e não aquela em que a lista vai viver. */
  const base = paginaDeNav({
    titulo: 'A lista que substitui o menu',
    opcaoInicial: 'caixas',
    nav: 'marcada',
    barra,
    secoes: barraDeSecoes('Ciclos', 'Planos do ciclo'),
    corpo,
  });

  /* A LISTA É RECONSTRUÍDA POR OPÇÃO, e não escondida por CSS: são duas marcações diferentes, e
   * dois blocos no DOM seriam duas vezes o mesmo conteúdo para o leitor de ecrã. Cada troca volta
   * a ligar o filtro e as caixinhas. */
  const listas = {
    producao: listaDePlanos('producao'),
    caixas: listaDePlanos('caixas'),
  };
  const troca = `(function () {
  var LISTAS = ${JSON.stringify(listas)};
  var html = document.documentElement;
  var destino = document.getElementById('lista-destino');
  window.aoTrocarOpcao = function (opcao) {
    if (!LISTAS[opcao] || !destino) return;
    destino.innerHTML = LISTAS[opcao];
    // Os ouvintes são delegados no documento, e por isso não morrem com a lista antiga: só é
    // preciso recontar os itens visíveis, que mudaram com a marcação.
    if (typeof window.aplicarFiltro === 'function') window.aplicarFiltro();
  };
})();`;

  return base
    .replace('</body>', `${marcacaoDaBancada({
      sobre: 'Proposta 4 de 4 · a listagem',
      titulo: 'A forma da lista',
      intro: 'A mesma decoração da Produção, com a área de toque na caixinha toda. '
        + 'Filtre e abra as caixinhas em qualquer das duas.',
      opcoes: OPCOES_LISTA,
      inicio: 'caixas',
    })}
<script>${scriptDaBancada(OPCOES_LISTA)}</script>
<script>${scriptDoMenu()}</script>
<script>${scriptDaLista()}</script>
<script>${troca}</script>
</body>`);
}

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
  <p class="subtitulo">Quatro decisões que precisam da sua escolha — contadas, não estimadas</p>
</header>

<main>
<div class="conteudo">

<p class="aviso-proposta"><strong>Isto não é o produto.</strong> São bancadas de comparação: cada
aba mostra a <em>mesma</em> página com as alternativas que estão em cima da mesa. O conteúdo é o
real — a Aula 01, o formulário de lançamento e os dois planos da escola de teste —, e o CSS é o do
projeto, embutido. Nada aqui muda o que está publicado na escola; a escolha é que vira código.</p>

<div class="cartoes">

  <a class="cartao" href="proposta-titulo.html">
    <p class="sobre">Proposta 1 de 4 · leitura</p>
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
    <p class="sobre">Proposta 2 de 4 · tela de trabalho</p>
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

  <a class="cartao" href="proposta-navegacao.html">
    <p class="sobre">Proposta 3 de 4 · o menu <strong>decidido</strong></p>
    <h2>A coluna que abre no ponteiro</h2>
    <p>Coluna à esquerda, compacta: quatro títulos à vista, e o grupo abre quando o ponteiro entra —
    empurrando os de baixo, e recompondo quando ele sai. O Bastidores saiu da coluna e foi para a
    ponta direita da barra.</p>
    <table>
      <tr><th>Opção</th><th>Destinos</th><th>A coluna ocupa</th><th>Leitura a 1280</th></tr>
      <tr><td>0 · hoje</td><td><strong>24</strong></td><td>1,6 tela no celular</td><td>1180 px</td></tr>
      <tr><td>A · sempre aberta</td><td>11</td><td>485 px</td><td>1032 px</td></tr>
      <tr><td>B · grupo actual aberto</td><td>11</td><td>284 px</td><td>1032 px</td></tr>
      <tr><td>C · só o grupo marcado</td><td>11</td><td><strong>217 px</strong></td><td>1032 px</td></tr>
    </table>
    <span class="abrir">Abrir a proposta →</span>
  </a>

  <a class="cartao" href="proposta-listagem.html">
    <p class="sobre">Proposta 4 de 4 · a listagem <strong>decidida</strong></p>
    <h2>A lista com a cara da Produção</h2>
    <p>As mesmas peças de «Turmas cadastradas»: a linha do nome com as ações, a linha de
    complemento e as três caixinhas com o «?» — agora com <strong>a caixinha toda clicável</strong>,
    no computador e no telemóvel.</p>
    <table>
      <tr><th>Caixinha</th><th>Abre</th></tr>
      <tr><td>Ritmo</td><td>frequência, dias e horário, duração e período</td></tr>
      <tr><td>Régua</td><td>a escala de níveis, com a cor de cada degrau</td></tr>
      <tr><td>Conteúdos</td><td>os conteúdos em chips</td></tr>
    </table>
    <span class="abrir">Abrir a proposta →</span>
  </a>

</div>

<p class="aviso-proposta" style="margin-top:24px">Para avaliar no telemóvel, abra esta página no
telemóvel: as quatro propostas mudam de comportamento conforme a largura, e é no telemóvel que a
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
  'proposta-navegacao.html': proporNavegacao(),
  'proposta-listagem.html': proporListagem(),
};

for (const [nome, texto] of Object.entries(arquivos)) {
  fs.writeFileSync(path.join(SAIDA, nome), texto, 'utf8');
  console.log(nome + ' — ' + Math.round(texto.length / 1024) + ' kB');
}
console.log('\nCSS do projeto embutido: ' + Math.round(CSS.length / 1024) + ' kB (tools/templates/ciclo.css)');
console.log('Sem dependências externas: as páginas abrem de `file://` e do Worker.');
