#!/usr/bin/env node
'use strict';

/*
 * construir.js — monta a demonstração da PAGINAÇÃO a partir da marcação REAL do template.
 *
 * Porquê construir em vez de escrever à mão: uma demonstração que copia a barra «mais ou menos»
 * mede «mais ou menos». Aqui o `<footer class="barra-de-controle">` é EXTRAÍDO de
 * `tools/templates/lancamento.html` — não reescrito — e o CSS é o `style.css` publicado. Se a barra
 * mudar na fonte, a demonstração muda com ela; e se eu a tivesse copiado mal, ninguém descobriria.
 *
 *   node experimentos/paginacao-no-celular/construir.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
const TEMPLATE = path.join(RAIZ, 'tools', 'templates', 'lancamento.html');

const fonte = fs.readFileSync(TEMPLATE, 'utf8');

/** O `<footer>` de produção, tal e qual. Falha alto se o template mudar de forma. */
function rodapeReal() {
  const m = /<footer class="barra-de-controle">([\s\S]*?)<\/footer>/.exec(fonte);
  if (!m) throw new Error('o rodapé não foi encontrado no template — a demonstração parou');
  return m[1];
}

/**
 * O CSS DA BARRA — extraído em REGRAS COMPLETAS, não em linhas.
 *
 * A primeira versão filtrava linhas que contivessem «barra-de-controle», e errou duas vezes de
 * uma só vez: apanhou a linha do HTML (`<footer class="barra-de-controle">`, que ficou dentro do
 * `<style>` e cortou a demonstração ao meio) e apanhou uma regra CSS só até à primeira linha, ou
 * seja com a chave aberta e o corpo cortado — o que engole tudo o que vem depois.
 *
 * Regra é unidade: lê-se o bloco `<style>` do template e corta-se em `}` de profundidade zero.
 * Só então se filtra pelos seletores que interessam.
 */
function cssDaBarra() {
  const bloco = /<style>([\s\S]*?)<\/style>/.exec(fonte);
  if (!bloco) throw new Error('o template não tem <style> — a demonstração parou');
  const texto = bloco[1];

  // Corta em `}` de profundidade zero — dentro de `@media` a profundidade conta.
  const regras = [];
  let profundidade = 0;
  let inicio = 0;
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (c === '{') profundidade += 1;
    else if (c === '}') {
      profundidade -= 1;
      if (profundidade === 0) {
        regras.push(texto.slice(inicio, i + 1));
        inicio = i + 1;
      }
    }
  }
  // Um `@media` inteiro é uma regra de profundidade zero; um bloco fica completo.

  const quer = /barra-de-controle|\.paginacao|\.fraco/;
  return regras
    .filter((r) => quer.test(r))
    // `@media` que não toque na barra não interessa — e um `@media` que a toque entra inteiro.
    .map((r) => r.trim())
    .join('\n');
}

const RODAPE = rodapeReal();

/** O conteúdo de um bloco de lançamento — alto como o real, para a página rolar. */
function bloco(n) {
  const campos = ['Presença', 'Técnica — Solo', 'Técnica — Barra', 'Musicalidade', 'Observação'];
  return '<section class="captura">'
    + '<h3>Aula ' + String(n).padStart(2, '0') + ' — o registro da aula dada</h3>'
    + '<table>' + campos.map((c) =>
      '<tr><th>' + c + '</th><td><input type="text" value="—" size="24"></td></tr>').join('')
    + '</table>'
    + '<p class="fraco">Bloco ' + n + ' de 6 · o formulário é o mesmo em todas as opções; o que se '
    + 'compara é o RODAPÉ.</p>'
    + '</section>';
}

const BLOCOS = [1, 2, 3, 4, 5, 6].map(bloco).join('\n');

const html = `<!DOCTYPE html>
<html lang="pt-BR" data-opcao="hoje" data-rolando="sobe">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Experimento — a paginação no celular · Sistema Lastro</title>
<link rel="icon" href="assets/favicon.svg">
<link rel="stylesheet" href="assets/style.css">
<style>
/* ============================================================================
   EXPERIMENTO: A PAGINAÇÃO DO LANÇAMENTO NO CELULAR — 20/10/2026

   O PROBLEMA, nas palavras de quem usa: «o rodapé é fixo … no desktop é interessante,
   mas para navegação no celular é bem ruim porque a tela fica com menos espaço».

   A barra é \`position: sticky; bottom: 0\` e ocupa ~52 px, sempre — mesmo quando não há
   para onde folhear («Página 1 de 1», com os dois botões cinzas), que é o caso do ciclo
   real de uma aula. Num telefone de 390×844, com a barra do topo (~61 px), a leitura
   fica com ~730 px e a barra é 6% da tela, permanentemente.

   O QUE SE COMPARA: quatro desfechos para a MESMA barra, com o MESMO conteúdo.
   Muda onde ela vive e quanto dela aparece no celular.
   ========================================================================== */

${cssDaBarra()}

/* O topo, para a medida ser a da página real: no produto é a barra do lançamento. */
header.doc { margin-top: 8px; }
header.doc h1 { font-size: 27px; margin: 0 0 6px; }

/* ---------- a bancada ---------- */
.bancada {
  position: fixed; right: 12px; top: 74px; z-index: 70;
  display: flex; flex-direction: column; gap: 6px; width: 216px;
  background: var(--superficie); border: 1px solid var(--borda);
  border-radius: 8px; padding: 8px; box-shadow: 0 6px 20px rgba(0,0,0,.18);
  font: 12px/1.3 var(--ui);
}
.bancada[hidden] { display: none; }
.bancada .bancada-titulo { font-weight: 700; color: var(--marca-texto); text-transform: uppercase; letter-spacing: .06em; }
.bancada button {
  text-align: left; cursor: pointer; background: var(--fundo-faixa);
  border: 1px solid var(--borda); border-radius: 6px; padding: 5px 8px;
  font: inherit; color: var(--texto);
}
.bancada button[aria-pressed="true"] { background: var(--marca); color: var(--fundo); border-color: var(--marca); }
.bancada .bancada-nota { color: var(--texto-suave); }

/* ============================================================================
   AS QUATRO OPÇÕES — cada uma um desfecho para a MESMA barra.
   ========================================================================== */

/* 0 · HOJE — nada muda. É o que se está a medir. */

/* 1 · VIRA BLOCO NO FIM. O rodapé deixa de ser preso no celular e volta a ser o que o
   nome diz: um rodapé. Quem chegou ao fim pagina ali; quem está a ler tem a tela toda.
   No desktop continua preso — ali há espaço, e prender é útil. */
@media (max-width: 899px) {
  [data-opcao="bloco"] footer.barra-de-controle {
    position: static; margin: 22px 0 40px; border: 1px solid var(--borda);
    border-radius: 8px; border-top: 2px solid var(--borda);
  }
}

/* 2 · COMPACTA COM «⋯». No celular a barra mostra o essencial — os dois botões e a
   contagem — e o resto («Blocos por página», «N bloco(s) no filtro») vive num «⋯».
   Uma linha em vez de três, e tudo continua alcançável. */
@media (max-width: 899px) {
  [data-opcao="compacta"] footer.barra-de-controle {
    gap: 4px 10px; padding: 6px 10px;
  }
  [data-opcao="compacta"] footer.barra-de-controle .por-pagina,
  [data-opcao="compacta"] footer.barra-de-controle .contagem,
  [data-opcao="compacta"] footer.barra-de-controle span[class="fraco"] { display: none; }
  [data-opcao="compacta"] footer.barra-de-controle .mais { display: inline-block; margin-left: auto; }
  [data-opcao="compacta"] footer.barra-de-controle[data-aberto="sim"] .por-pagina,
  [data-opcao="compacta"] footer.barra-de-controle[data-aberto="sim"] .contagem { display: inline; }
  [data-opcao="compacta"] footer.barra-de-controle .paginacao { gap: 6px; }
  [data-opcao="compacta"] footer.barra-de-controle strong { font-size: 13px; }
  [data-opcao="compacta"] footer.barra-de-controle button { padding: 4px 9px; }
}

/* 3 · ESCONDE AO DESCER, VOLTA AO SUBIR. A barra sai quando se lê e volta quando se
   procura — devolve a tela inteira sem tirar o controle do alcance. */
[data-opcao="auto-esconde"] footer.barra-de-controle {
  transition: transform .18s ease, opacity .18s ease;
}
[data-opcao="auto-esconde"][data-rolando="desce"] footer.barra-de-controle {
  transform: translateY(130%); opacity: 0; pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  [data-opcao="auto-esconde"] footer.barra-de-controle { transition: none; }
}

/* ---------- a peça que só a demonstração tem ---------- */
.mais {
  display: none; cursor: pointer; background: var(--fundo-faixa);
  border: 1px solid var(--borda); border-radius: 6px; padding: 4px 10px;
  font: 700 15px/1 var(--ui); color: var(--marca-texto);
}
</style>
</head>
<body>

<!-- A barra do topo é a do produto, e NÃO é decoração: é ela que, somada ao rodapé,
     decide quanto sobra para o formulário. Medir o rodapé sem o topo daria um número
     que ninguém vive. -->
<nav class="topnav" aria-label="Navegação">
  <a class="marca" href="/" aria-label="Sistema Lastro — página inicial" title="Ir para o início"><span aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 249.21 291.95" width="249.21" height="291.95" role="img" aria-label="Sistema Lastro"><title>Sistema Lastro</title><path d="M162 163.3C166.3 159.1 170.8 155.1 174.9 150.7C177.8 147.7 180.3 144.3 183 141C183 141 200.6 115.1 200.6 115.1C203.1 110.4 205.3 105.4 207.4 100.5C207.4 100.5 215.6 74.6 215.6 74.6C216.5 69.7 217.5 64.7 217.5 59.7C217.5 51.6 212.5 43.8 207.2 37.7C204.5 34.6 201.6 31.6 198.3 29.1C198.3 29.1 164.5 9.6 164.5 9.6C161.9 8.6 159.1 8.3 156.4 7.6C154.4 7.2 152.1 9.3 151.4 11.2C149.2 17.1 147.2 23 145.8 29.1C142.4 44.4 139.5 59.7 137.1 75.1C133.4 98.4 131.3 122.7 135.6 145.8C135.6 145.8 145.7 176.3 145.7 176.3C145.7 176.3 114.4 207.4 114.4 207.4C107 217 101.6 228.8 100.4 240.7C99.4 251.1 102.5 262 107.3 271.3C108.9 274.4 111.2 277.1 113.4 279.8C113.4 279.8 125.9 290.2 125.9 290.2C127.4 291.1 129.1 291.4 130.7 291.9C130.7 291.9 119 271.1 119 271.1C118.5 268.8 118.5 266.4 118.6 264C118.6 264 122 252.9 122 252.9C122.8 251.3 123.7 249.9 124.8 248.6C142.2 229.6 169.3 222.6 192.4 211.2C207.8 203.6 222.1 192.5 232.5 178.8C232.5 178.8 245.4 154.5 245.4 154.5C247.1 148.8 248.2 142.9 248.7 137C249.2 130.2 248.9 123.3 248.4 116.5C248.4 116.5 243.4 92.7 243.4 92.7C243.4 92.7 229.3 64.6 229.3 64.6C228.1 63 226.5 61.8 225.1 60.3C225.1 60.3 227.4 66.5 227.4 66.5C228.4 69.1 229.2 71.8 229.6 74.6C229.6 74.6 228.2 93.5 228.2 93.5C228.2 93.5 213.2 116.8 213.2 116.8C198.1 134.2 181.5 151 162 163.3Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/></svg></span></a>
  <div class="nav-links" id="nav-links">
    <a href="#" class="ativo">Lançamento</a>
    <details class="menu"><summary>Área do Professor</summary><div class="submenu"><a href="#">Anamnese do aluno</a></div></details>
  </div>
  <button class="hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-links">
    <span></span><span></span><span></span>
  </button>
</nav>

<header class="doc">
  <h1>Lançamento da aula — formulário eletrônico</h1>
  <p class="subtitulo">O rodapé de paginação: quatro desfechos no celular</p>
  <p class="ficha"><span>Experimento</span><span>390×844 e 1280×800</span><span>6 blocos</span></p>
</header>

<main>
<div class="conteudo">
<p>O formulário abaixo é decorativo — os campos não gravam nada. O que está a ser comparado é o
<strong>rodapé</strong>: a barra de paginação que hoje fica presa no fundo da tela. Escolha uma opção
na bancada, à direita, e role.</p>
${BLOCOS}
</div>
</main>

<footer class="barra-de-controle">
${RODAPE.replace('<span><label class="campo-rotulo em-linha" for="porPagina">',
  '<span class="por-pagina"><label class="campo-rotulo em-linha" for="porPagina">')}
  <button type="button" class="mais" id="mais" aria-expanded="false"
    aria-label="Mais opções da paginação">⋯</button>
</footer>

<div class="bancada" id="bancada" role="group" aria-label="Bancada do experimento">
  <span class="bancada-titulo">A paginação no celular</span>
  <button type="button" data-escolha="hoje" aria-pressed="true">0 · Hoje (presa no fundo)</button>
  <button type="button" data-escolha="bloco" aria-pressed="false">1 · Vira bloco no fim</button>
  <button type="button" data-escolha="compacta" aria-pressed="false">2 · Compacta com «⋯»</button>
  <button type="button" data-escolha="auto-esconde" aria-pressed="false">3 · Esconde ao descer</button>
  <span class="bancada-nota">Esc esconde a bancada.</span>
</div>

<script src="assets/nav.js"></script>
<script>
/* ============================================================================
   A PAGINAÇÃO, com o comportamento de produção: os botões levam a uma página e a
   contagem diz quantos blocos o filtro tem. Aqui há UMA página (6 blocos, 50 por
   página) — o caso real do ciclo com uma aula: «Página 1 de 1», os dois botões
   cinzas, e a barra presa sem ter o que folhear. É exactamente aí que ela incomoda.
   ========================================================================== */
(function () {
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
  mais.addEventListener('click', function () {
    var aberto = rodape.getAttribute('data-aberto') === 'sim';
    rodape.setAttribute('data-aberto', aberto ? 'nao' : 'sim');
    mais.setAttribute('aria-expanded', String(!aberto));
  });

  /* ---------- a bancada ---------- */
  var botoes = [].slice.call(document.querySelectorAll('.bancada button'));
  function escolher(opcao) {
    html.setAttribute('data-opcao', opcao);
    botoes.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.escolha === opcao)); });
    try { sessionStorage.setItem('demo-paginacao:opcao', opcao); } catch (e) {}
  }
  botoes.forEach(function (b) { b.addEventListener('click', function () { escolher(b.dataset.escolha); }); });
  var guardada = null;
  try { guardada = sessionStorage.getItem('demo-paginacao:opcao'); } catch (e) {}
  if (guardada) escolher(guardada);

  /* ---------- a opção 3: esconde ao descer, volta ao subir ---------- */
  var ultimo = window.scrollY, pedido = false;
  function aoRolar() {
    var y = window.scrollY;
    // Um limiar de 6 px impede que o tremor do dedo faça a barra piscar.
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

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.getElementById('bancada').hidden = true;
    var mapa = { '0': 'hoje', '1': 'bloco', '2': 'compacta', '3': 'auto-esconde' };
    if (mapa[e.key]) escolher(mapa[e.key]);
  });
})();
</script>
</body>
</html>
`;

const pastaAssets = path.join(__dirname, 'assets');
fs.mkdirSync(pastaAssets, { recursive: true });
for (const nome of ['style.css', 'nav.js', 'favicon.svg']) {
  const destino = path.join(pastaAssets, nome);
  if (!fs.existsSync(destino)) {
    fs.copyFileSync(path.join(RAIZ, 'publicacao', 'batata', 'assets', nome), destino);
  }
}
fs.writeFileSync(path.join(__dirname, 'index.html'), html, 'utf8');
console.log('paginacao-no-celular/index.html — ' + html.length + ' bytes');
console.log('  rodapé: extraído de tools/templates/lancamento.html (não reescrito)');
