#!/usr/bin/env node
'use strict';

/*
 * gerar-animacao.js — gera rizoma-animado.html a partir de rizoma-corrigido.svg.
 *
 * Por que existe: o mapa animado é uma CÓPIA do mapa completo com classes de
 * animação. Antes essa cópia era feita à mão, e cada edição do SVG obrigava a
 * reescrever o HTML (risco de os dois arquivos divergirem). Agora o SVG é a
 * única fonte da verdade: rode `node tools/gerar-animacao.js` depois de editar.
 *
 *   uso: node tools/gerar-animacao.js [entrada.svg] [saida.html]
 *
 * Regras preservadas:
 *  - arestas usam FADE (não traço desenhado): assim cada linha mantém o seu tipo
 *    (sólida = formação · tracejada = influência · pontilhada = interpretação);
 *  - preferência por movimento reduzido mostra tudo de imediato;
 *  - pausa/retomada não reinicia; reiniciar clona os elementos (e relê a lista).
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
// A apresentação vive em apresentacoes/apresentacao-01-rizoma/ (Regra 17).
// Troque com APRESENTACAO=/caminho node tools/gerar-animacao.js
const APRESENTACAO = process.env.APRESENTACAO || path.join(raiz, 'apresentacoes', 'apresentacao-01-rizoma');
const entrada = process.argv[2] || path.join(APRESENTACAO, 'rizoma-corrigido.svg');
const saida = process.argv[3] || path.join(APRESENTACAO, 'rizoma-animado.html');

const PASSO = 0.21;      // segundos entre dois elementos consecutivos
const T0_ARESTA = 0.30;  // atraso da primeira aresta
const T0_NO = 0.10;      // atraso do primeiro nó
const svg = fs.readFileSync(entrada, 'utf8');

// ---- recorte do SVG: tag, <defs>, grupo das arestas e resto (nós + legenda) ----
const abre = svg.indexOf('<svg');
const fimSvg = svg.lastIndexOf('</svg>');
if (abre < 0 || fimSvg < 0) throw new Error('SVG inválido: <svg> não encontrado em ' + entrada);
const tagSvg = svg.slice(abre, svg.indexOf('>', abre) + 1);
const interno = svg.slice(svg.indexOf('>', abre) + 1, fimSvg);

const iDefs = interno.indexOf('<defs>');
const fDefs = interno.indexOf('</defs>');
const defs = iDefs >= 0 && fDefs > iDefs ? interno.slice(iDefs, fDefs + '</defs>'.length) : '';

const iArestas = interno.indexOf('<g stroke="#b08d57"');
if (iArestas < 0) throw new Error('grupo de arestas (stroke="#b08d57") não encontrado');
const fArestas = interno.indexOf('</g>', iArestas) + '</g>'.length;
const arestas = interno.slice(iArestas, fArestas);
const corpos = interno.slice(fArestas);

const viewBox = (tagSvg.match(/viewBox="([^"]+)"/) || [, '0 0 1300 700'])[1];

// ---- arestas: acrescenta class="edge" e o atraso de cada uma ----
let nAresta = 0;
const arestasAnimadas = arestas.replace(/<path\b[^>]*?\/>/g, function (p) {
  const d = (T0_ARESTA + nAresta++ * PASSO).toFixed(2);
  return p.replace(/\s*\/>$/, ' class="edge" style="animation-delay:' + d + 's"/>');
});

// ---- nós: cada <g> de topo vira um nó animado (estes grupos não são aninhados) ----
let nNo = 0;
const corposAnimados = corpos.replace(/<g\b[^>]*>[\s\S]*?<\/g>/g, function (g) {
  const d = (T0_NO + nNo++ * PASSO).toFixed(2);
  return g.replace(/<g\b/, '<g class="node" style="animation-delay:' + d + 's"');
});

if (nAresta === 0 || nNo === 0) throw new Error('nada para animar: verifique a estrutura do SVG');

const duracao = Math.max(T0_ARESTA + (nAresta - 1) * PASSO, T0_NO + (nNo - 1) * PASSO) + 0.7;

// ---- saída ----------------------------------------------------------------
const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>O Rizoma da Dança — Versão Animada</title>
<style>
  :root { --burgundy:#6b1f2e; --gold:#b08d57; --gold-dark:#8a6a3b; --soft:#5a5348; --cream:#fbf8f3; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body {
    background:var(--cream); color:#1f1c1a; font-family:Georgia,'Times New Roman',serif;
    min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:18px; overflow:hidden;
  }
  h1 { color:var(--burgundy); font-size:30px; text-align:center; }
  .subtitle { color:var(--soft); font-style:italic; font-size:17px; margin:6px 0 14px; text-align:center; }
  svg { width:100%; max-width:1400px; height:auto; max-height:76vh; }
  /* Controles fixos no canto inferior direito */
  .ctrl {
    position:fixed; right:20px; bottom:16px; display:flex; gap:10px; align-items:center;
  }
  .ctrl button, .ctrl a {
    background:var(--burgundy); color:var(--cream); border:2px solid var(--gold); border-radius:6px;
    padding:12px 22px; font-family:Georgia,'Times New Roman',serif; font-size:16px;
    cursor:pointer; text-decoration:none;
  }
  .ctrl button:hover, .ctrl a:hover { background:#8a2a3d; }
  .ctrl .hint { color:var(--soft); font-size:13px; font-style:italic; }
  svg text { font-family: Georgia, 'Times New Roman', serif; }
  .node { opacity:0; transform-box:fill-box; transform-origin:center; animation:popIn .5s ease-out forwards; }
  /* Arestas: fade em vez de traço desenhado — assim cada linha preserva o seu tipo
     (sólida = formação · tracejada = influência · pontilhada = interpretação) */
  .edge { opacity:0; animation:fadeEdge .7s ease-out forwards; }
  @keyframes popIn { 0%{opacity:0;transform:scale(.5)} 70%{opacity:1;transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
  @keyframes fadeEdge { to { opacity:1 } }
  /* Se o navegador tiver animação reduzida, mostra tudo de imediato (nunca fica em branco) */
  @media (prefers-reduced-motion: reduce) {
    .node, .edge { animation:none !important; opacity:1 !important; stroke-dashoffset:0 !important; }
  }
</style>
</head>

<body>

<h1>O Rizoma da Dança</h1>
<p class="subtitle">De John Weaver (1717) a Tiago Menegaz (2026) — três linhagens, um rizoma</p>

<!-- Gerado por tools/gerar-animacao.js a partir de rizoma-corrigido.svg. Não edite à mão. -->
<svg id="rizoma" ${tagSvg.replace(/^<svg\s*/, '').replace(/\/?>$/, '')} xmlns="http://www.w3.org/2000/svg" style="background:#fbf8f3;font-family:Georgia,serif;">
${defs}

${arestasAnimadas}
${corposAnimados}</svg>

<div class="ctrl">
  <span class="hint">P pausa · R reinicia</span>
  <button id="btn-pause" type="button">&#9208; Pausar</button>
  <button id="btn-restart" type="button">&#8635; Reiniciar</button>
  <a href="rizoma-corrigido.svg" target="_blank">Mapa completo</a>
</div>



<script>
  'use strict';
  var svg = document.getElementById('rizoma');
  var btnPause = document.getElementById('btn-pause');
  var pausado = false;

  // Seleciona SEMPRE na hora (após um reinício, os elementos antigos não existem mais)
  function animados() { return svg.querySelectorAll('.node, .edge'); }

  function atualizarBotao() {
    btnPause.innerHTML = pausado ? '&#9654; Continuar' : '&#9208; Pausar';
  }

  // Pausa/retoma SEM reiniciar: o CSS guarda o estado da animação
  function togglePause() {
    pausado = !pausado;
    animados().forEach(function (el) {
      el.style.animationPlayState = pausado ? 'paused' : 'running';
    });
    atualizarBotao();
  }

  // Reinicia do zero. Dois cuidados que o exemplo de referência não tinha:
  //  1) os clones devem voltar a 'running' (caso o reinício aconteça pausado);
  //  2) reler a lista depois de clonar (as referências antigas ficam órfãs).
  function restart() {
    animados().forEach(function (el) {
      var clone = el.cloneNode(true);
      clone.style.animationPlayState = 'running';
      el.parentNode.replaceChild(clone, el);
    });
    pausado = false;
    atualizarBotao();
  }

  btnPause.addEventListener('click', togglePause);
  document.getElementById('btn-restart').addEventListener('click', restart);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'p' || e.key === 'P' || e.key === ' ') { e.preventDefault(); togglePause(); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); restart(); }
  });

  // Rede de segurança: se as animações não estiverem rodando (navegador antigo, bloqueio,
  // modo de economia), revela o mapa inteiro em vez de deixar a tela vazia.
  // Não interfere numa pausa: se estiver pausado, não faz nada.
  setTimeout(function () {
    if (pausado) return;
    var visiveis = 0;
    var nos = svg.querySelectorAll('.node');
    nos.forEach(function (n) { if (parseFloat(getComputedStyle(n).opacity) > 0.5) visiveis++; });
    if (visiveis < 3) {
      nos.forEach(function (n) { n.style.animation = 'none'; n.style.opacity = 1; });
      svg.querySelectorAll('.edge').forEach(function (e2) {
        e2.style.animation = 'none';
        e2.style.opacity = 1;
        e2.style.strokeDashoffset = 0;
      });
    }
  }, 2500);
</script>

</body>
</html>
`;

fs.writeFileSync(saida, html, 'utf8');

console.log('gerado: ' + path.relative(raiz, saida));
console.log('  fonte ............. ' + path.relative(raiz, entrada) + ' (viewBox ' + viewBox + ')');
console.log('  nós animados ...... ' + nNo);
console.log('  arestas animadas .. ' + nAresta);
console.log('  duração total ..... ~' + duracao.toFixed(1) + 's');
