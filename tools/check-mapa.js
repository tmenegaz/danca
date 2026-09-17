#!/usr/bin/env node
'use strict';

/*
 * check-mapa.js — valida a geometria dos mapas do rizoma (SVG).
 *
 *   uso: node tools/check-mapa.js [arquivo.svg]
 *
 * Confere, sem dependências externas:
 *   1) colisões entre caixas de nó;
 *   2) arestas que começam ou terminam no vazio (extremidade longe de todo nó);
 *   3) nós órfãos (nenhuma aresta encosta neles);
 *   4) rótulos mais largos que a própria caixa (estimativa conservadora);
 *   5) inventário de traços: sólido / tracejado / pontilhado.
 *
 * Sai com código 1 se encontrar qualquer problema — serve para rodar depois de
 * cada edição do mapa, do mesmo modo que tools/check-overflow.js no deck.
 */

const fs = require('fs');
const path = require('path');

const arquivo = process.argv[2] ||
  path.join(process.env.APRESENTACAO || path.join(__dirname, '..', 'apresentacoes', 'apresentacao-01-rizoma'), 'rizoma-corrigido.svg');
const svg = fs.readFileSync(arquivo, 'utf8');

// ---- nós: cada <g> com um retângulo grande é uma caixa (nome + rótulo) ----
const nos = [];
const reGrupo = /<g\b[^>]*>([\s\S]*?)<\/g>/g;
let m;
while ((m = reGrupo.exec(svg)) !== null) {
  const corpo = m[1];
  const reRect = /<rect\b([^>]*)\/?>/g;
  let r, caixa = null, rotulos = [];
  while ((r = reRect.exec(corpo)) !== null) {
    const at = r[1];
    const v = (nome) => parseFloat((at.match(new RegExp(nome + '="([-\\d.]+)"')) || [, '0'])[1]);
    const larg = v('width');
    if (larg >= 40 && (!caixa || larg > caixa.w)) {
      caixa = { x: v('x'), y: v('y'), w: larg, h: v('height') };
    }
  }
  const reTexto = /<text\b([^>]*)>([^<]*)<\/text>/g;
  const TAMANHO = { grande: 14, medio: 11, pequeno: 9, sub: 8 };
  let t;
  while ((t = reTexto.exec(corpo)) !== null) {
    const classe = (t[1].match(/class="lbl (\w+)"/) || [, ''])[1];
    const inline = (t[1].match(/font-size\s*:\s*([\d.]+)/) || [, '0'])[1];
    const tam = parseFloat(inline) || TAMANHO[classe] || 9;
    rotulos.push({ texto: t[2].trim(), tam: tam, bold: classe === 'grande' || classe === 'medio' });
  }
  if (caixa) nos.push({ caixa: caixa, rotulos: rotulos });
}

// círculo do apresentador e legenda não são caixas: guardamos os pontos de referência
const circulos = [];
const reCirc = /<circle\b([^>]*)\/?>/g;
while ((m = reCirc.exec(svg)) !== null) {
  const g = (nome) => parseFloat((m[1].match(new RegExp(nome + '="([-\\d.]+)"')) || [, '0'])[1]);
  circulos.push({ cx: g('cx'), cy: g('cy'), r: g('r') });
}

// ---- arestas: primeiro e último ponto de cada path (o <defs> fica de fora: são marcadores) ----
const soDesenho = svg.replace(/<defs>[\s\S]*?<\/defs>/g, '');
const arestas = [];
const rePath = /<path\b([^>]*)\/?>/g;
while ((m = rePath.exec(soDesenho)) !== null) {
  const d = (m[1].match(/\bd="([^"]+)"/) || [, ''])[1];
  const nums = d.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 4) continue;
  arestas.push({
    inicio: { x: parseFloat(nums[0]), y: parseFloat(nums[1]) },
    fim: { x: parseFloat(nums[nums.length - 2]), y: parseFloat(nums[nums.length - 1]) },
    dash: (m[1].match(/stroke-dasharray="([^"]+)"/) || [, ''])[1],
    d: d,
  });
}

// distância de um ponto à caixa (0 se estiver dentro) e aos círculos
function distCaixa(p, c) {
  const dx = Math.max(c.x - p.x, 0, p.x - (c.x + c.w));
  const dy = Math.max(c.y - p.y, 0, p.y - (c.y + c.h));
  return Math.hypot(dx, dy);
}
function pertoDeAlgo(p) {
  let melhor = Infinity;
  nos.forEach(function (n) { melhor = Math.min(melhor, distCaixa(p, n.caixa)); });
  circulos.forEach(function (c) { melhor = Math.min(melhor, Math.hypot(c.cx - p.x, c.cy - p.y) - c.r); });
  return melhor;
}

// ---- 1) colisões ----
const colisoes = [];
for (let i = 0; i < nos.length; i++) {
  for (let j = i + 1; j < nos.length; j++) {
    const a = nos[i].caixa, b = nos[j].caixa;
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
      colisoes.push('(' + a.x + ',' + a.y + ') × (' + b.x + ',' + b.y + ')');
    }
  }
}

// ---- 2) arestas soltas no vazio ----
const TOLERANCIA = 16;
const soltas = arestas.filter(function (a) {
  return pertoDeAlgo(a.inicio) > TOLERANCIA || pertoDeAlgo(a.fim) > TOLERANCIA;
}).map(function (a) { return a.d; });

// ---- 3) nós órfãos ----
const orfaos = nos.filter(function (n) {
  return !arestas.some(function (a) {
    return distCaixa(a.inicio, n.caixa) <= TOLERANCIA || distCaixa(a.fim, n.caixa) <= TOLERANCIA;
  });
}).map(function (n) {
  return n.rotulos.length ? n.rotulos[0].texto : '(' + n.caixa.x + ',' + n.caixa.y + ')';
});

// ---- 4) rótulo mais largo que a caixa (estimativa calibrada pela medida real do Chrome) ----
const avisosRotulo = [];
nos.forEach(function (n) {
  const c = n.caixa;
  if (c.w < 60) return; // swatches da legenda
  n.rotulos.forEach(function (r) {
    const fator = r.bold ? 0.45 : 0.43;
    const largura = r.texto.length * r.tam * fator;
    if (largura > c.w) {
      avisosRotulo.push('"' + r.texto + '" (~' + Math.round(largura) + 'px > ' + c.w + 'px)');
    }
  });
});

// ---- 5) inventário de traços ----
const solidas = arestas.filter(function (a) { return !a.dash; }).length;
const tracejadas = arestas.filter(function (a) { return a.dash === '7 5'; }).length;
const pontilhadas = arestas.filter(function (a) { return a.dash === '2 4'; }).length;

// ---- relatório ----
const nome = path.relative(path.join(__dirname, '..'), arquivo);
const linhas = [
  'Mapa: ' + nome,
  '  nós (caixas) ................ ' + nos.length,
  '  arestas ..................... ' + arestas.length + ' (sólidas ' + solidas + ' · tracejadas ' + tracejadas + ' · pontilhadas ' + pontilhadas + ')',
  '  colisões entre caixas ....... ' + colisoes.length + (colisoes.length ? ' → ' + colisoes.join(', ') : ''),
  '  arestas soltas no vazio ..... ' + soltas.length + (soltas.length ? ' → ' + soltas.join(' | ') : ''),
  '  nós órfãos .................. ' + orfaos.length + (orfaos.length ? ' → ' + orfaos.join(', ') : ''),
  '  rótulos apertados (estim.) .. ' + avisosRotulo.length + (avisosRotulo.length ? ' → ' + avisosRotulo.join(' | ') : ''),
];
console.log(linhas.join('\n'));

const problemas = colisoes.length + soltas.length + orfaos.length;
if (avisosRotulo.length) {
  console.log('  (aviso de rótulo é estimativa: confirme com `node tools/medir-rotulos.js`)');
}
if (problemas) {
  console.error('\nFALHOU: ' + problemas + ' problema(s) de geometria no mapa.');
  process.exit(1);
}
console.log('\nOK: sem colisões, sem arestas soltas e sem nós órfãos.');

