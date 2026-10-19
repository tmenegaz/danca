#!/usr/bin/env node
'use strict';

/**
 * vetorizar.js — a marca do Sistema Lastro em SVG de verdade: contornos medidos, não imagem
 * embalada.
 *
 * Por que existe (18/10/2026). A direção enviou a logomarca como `logo_vermelho.svg` e
 * `logo_prata.svg` — dois arquivos de 106KB e 134KB que, abertos, são um `<svg>` com um PNG
 * em base64 dentro de um `<image>`. Não são vetores: a cor não se troca por `fill`, a forma
 * não se limpa ao ampliar, e o peso contraria a regra do projeto («imagem não entra no
 * servidor porque pesa»). Este script produz o que os arquivos diziam ser.
 *
 * A DECISÃO DE PRODUTO QUE ELE RESPEITA. Traçam-se os contornos que EXISTEM na referência —
 * quatro silhuetas fechadas — e não se inventam cortes. A marca entregue não tem cinco
 * pétalas separadas: tem três pétalas à esquerda e a pétala maior à direita, que desce numa
 * cauda; as separações entre elas são CANALETAS TRANSPARENTES, e é por isso que elas saem
 * como contornos independentes. Foi medido e mostrado antes de traçar (ver
 * `experimentos/marca/README.md`): o que não está na arte não entra no arquivo.
 *
 * COMO SE TRAÇA. Quatro passos, e nenhum deles adivinha:
 *
 *   1. lê a ALFA do PNG embalado — a forma, e só a forma; a cor da arte não é geometria;
 *   2. amplia a alfa ×4 por Catmull-Rom e corre marching squares a 127,5: o contorno sai
 *      SUBPIXEL, sem a serrilha que um traçado binário a 251px produziria;
 *   3. suaviza a volta (média circular) e simplifica por Ramer–Douglas–Peucker — a média
 *      antes, para o RDP não gastar vértices a seguir o ruído do degradê;
 *   4. ajusta Béziers cúbicas por mínimos quadrados com subdivisão e reparticipação
 *      (Schneider, Graphics Gems 1990), com os cantos preservados por ângulo de viragem.
 *
 * O resultado é MEDIDO, não declarado: o script rasteriza o próprio SVG (varredura com
 * supersampling vertical) e compara com a alfa da referência. É o número que sai no fim.
 *
 * ---------------------------------------------------------------------------------------
 * Uso:
 *   node experimentos/marca/vetorizar.js                  → mede e grava marca/lastro.svg
 *   node experimentos/marca/vetorizar.js --inline         → imprime o <svg> para embutir
 *   node experimentos/marca/vetorizar.js --json           → só os números
 *   node experimentos/marca/vetorizar.js --ref prata      → traça a outra referência
 *   node experimentos/marca/vetorizar.js --variantes      → grava as duas cores fixas
 *
 * Sem dependências: o PNG descodifica-se com o `zlib` do Node e o SVG escreve-se como texto.
 * O `img/` está fora do Git (imagem de referência não entra no repositório): quem clonar não
 * tem as artes, e o script diz isso em vez de estourar.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const raiz = path.resolve(__dirname, '..', '..');
const REFERENCIAS = {
  vermelho: path.join(raiz, 'img/logo_vermelho.svg'),
  prata: path.join(raiz, 'img/logo_prata.svg'),
};
// OS ARQUIVOS VÃO PARA `tools/templates/marca/`, QUE É CONGELADO — e é a coisa certa: a marca
// é peça do sistema, não rascunho. Este script é o GERADOR dele, e mora em `experimentos/`
// pela mesma razão que o `medir-paletas.js`: o instrumento fica onde se experimenta, o produto
// fica onde se serve. Gravar aqui dentro deixaria a marca fora do alcance das telas.
const DIR_MARCA = path.join(raiz, 'tools/templates/marca');
const SAIDA = path.join(DIR_MARCA, 'lastro.svg');
/** O módulo que a barra usa: `require` funciona no Node e no bundle do Worker; ler um arquivo
 *  com `fs` não funcionaria no Worker. Daí a marca viajar como STRING. */
const MODULO_MARCA = path.join(raiz, 'tools/templates/marca-lastro.js');
const FAVICON = path.join(DIR_MARCA, 'favicon.svg');
/** A precisão das coordenadas. 1 casa em unidades do `viewBox` = 0,1px na arte de 249 — o
 *  ajuste de Béziers não distingue menos do que isso, e o IoU é o mesmo com 1 e com 2 casas
 *  (medido: 0,9796 nos dois). Duas casas gastam 526 bytes a mais em TODA página. */
const CASAS = 1;

// ---------------------------------------------------------------------------------------
// 1. O PNG EMBALADO NO SVG
// ---------------------------------------------------------------------------------------
//
// O SVG entregue é um `<image xlink:href="data:image/png;base64,…">`. Lê-se o base64 e
// descodifica-se o PNG à mão: cabeçalho, IHDR, os IDAT concatenados, e o filtro de cada
// linha desfeito conforme a especificação. É o único jeito de não depender de nada.
function lerPngEmbutido(caminho) {
  const bruto = fs.readFileSync(caminho, 'utf8');
  const m = /base64,([A-Za-z0-9+/=\s]+?)["'>\s]/.exec(bruto);
  if (!m) throw new Error('o arquivo não tem PNG embutido: ' + caminho);
  const png = Buffer.from(m[1].replace(/\s/g, ''), 'base64');
  let p = 8; let W = 0; let H = 0; let prof = 0; let tipoCor = 0; let entrelacado = 0;
  const idats = [];
  let paleta = null; let trns = null;
  while (p + 8 <= png.length) {
    const tam = png.readUInt32BE(p);
    const tipo = png.toString('ascii', p + 4, p + 8);
    const dados = png.slice(p + 8, p + 8 + tam);
    if (tipo === 'IHDR') {
      W = dados.readUInt32BE(0); H = dados.readUInt32BE(4);
      prof = dados[8]; tipoCor = dados[9]; entrelacado = dados[12];
    } else if (tipo === 'PLTE') paleta = dados;
    else if (tipo === 'tRNS') trns = dados;
    else if (tipo === 'IDAT') idats.push(dados);
    p += 12 + tam;
  }
  if (entrelacado) throw new Error('PNG entrelaçado não suportado');
  const cru = zlib.inflateSync(Buffer.concat(idats));
  const canais = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[tipoCor];
  if (!canais) throw new Error('tipo de cor ' + tipoCor + ' não suportado');
  const passo = Math.ceil((canais * prof * W) / 8);
  const bpp = Math.max(1, Math.ceil((canais * prof) / 8));
  const linhas = Buffer.alloc(H * passo);
  let anterior = Buffer.alloc(passo);
  for (let y = 0; y < H; y++) {
    const filtro = cru[y * (passo + 1)];
    const linha = cru.slice(y * (passo + 1) + 1, y * (passo + 1) + 1 + passo);
    const alvo = linhas.slice(y * passo, (y + 1) * passo);
    for (let i = 0; i < passo; i++) {
      const a = i >= bpp ? alvo[i - bpp] : 0;
      const b = anterior[i];
      const c = i >= bpp ? anterior[i - bpp] : 0;
      const x = linha[i];
      let v;
      switch (filtro) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: {
          const pp = a + b - c;
          const pa = Math.abs(pp - a); const pb = Math.abs(pp - b); const pc = Math.abs(pp - c);
          v = x + (pa <= pb && pa <= pc ? a : (pb <= pc ? b : c));
          break;
        }
        default: throw new Error('filtro PNG ' + filtro);
      }
      alvo[i] = v & 0xff;
    }
    anterior = alvo;
  }
  const A = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = y * passo + x * (canais * prof) / 8;
      let a = 255;
      if (tipoCor === 6) a = linhas[o + 3];
      else if (tipoCor === 4) a = linhas[o + 1];
      else if (tipoCor === 3) a = trns && trns[linhas[o]] != null ? trns[linhas[o]] : 255;
      A[y * W + x] = a;
    }
  }
  void paleta;
  return { W, H, A };
}

// ---------------------------------------------------------------------------------------
// 2. CONTORNOS SUBPIXEL
// ---------------------------------------------------------------------------------------

/** Catmull-Rom ×f. A alfa é suave; ampliá-la dá contorno em fracções de pixel. */
function ampliar({ W, H, A }, f) {
  const W2 = W * f; const H2 = H * f;
  const B = new Float32Array(W2 * H2);
  const at = (x, y) => A[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  const cr = (p0, p1, p2, p3, t) => {
    const t2 = t * t; const t3 = t2 * t;
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  };
  for (let y = 0; y < H2; y++) {
    const sy = (y + 0.5) / f - 0.5; const y0 = Math.floor(sy); const ty = sy - y0;
    for (let x = 0; x < W2; x++) {
      const sx = (x + 0.5) / f - 0.5; const x0 = Math.floor(sx); const tx = sx - x0;
      const col = [0, 1, 2, 3].map((k) => cr(
        at(x0 - 1, y0 - 1 + k), at(x0, y0 - 1 + k), at(x0 + 1, y0 - 1 + k), at(x0 + 2, y0 - 1 + k), tx));
      B[y * W2 + x] = Math.max(0, Math.min(255, cr(col[0], col[1], col[2], col[3], ty)));
    }
  }
  return { W: W2, H: H2, A: B };
}

/** Marching squares com interpolação linear: segmentos em fracções de pixel. */
function contornos({ W, H, A }, limiar) {
  const segs = [];
  const val = (x, y) => ((x < 0 || y < 0 || x >= W || y >= H) ? 0 : A[y * W + x]);
  for (let y = -1; y < H; y++) {
    for (let x = -1; x < W; x++) {
      const a = val(x, y); const b = val(x + 1, y);
      const c = val(x + 1, y + 1); const d = val(x, y + 1);
      let idx = 0;
      if (a > limiar) idx |= 1;
      if (b > limiar) idx |= 2;
      if (c > limiar) idx |= 4;
      if (d > limiar) idx |= 8;
      if (idx === 0 || idx === 15) continue;
      const t = (u, v) => (limiar - u) / (v - u);
      const top = [x + 1 - t(a, b), y];
      const right = [x + 1, y + 1 - t(b, c)];
      const bottom = [x + 1 - t(d, c), y + 1];
      const left = [x, y + 1 - t(a, d)];
      switch (idx) {
        case 1: segs.push([left, top]); break;
        case 2: segs.push([top, right]); break;
        case 3: segs.push([left, right]); break;
        case 4: segs.push([right, bottom]); break;
        case 6: segs.push([top, bottom]); break;
        case 7: segs.push([left, bottom]); break;
        case 8: segs.push([bottom, left]); break;
        case 9: segs.push([bottom, top]); break;
        case 11: segs.push([bottom, right]); break;
        case 12: segs.push([right, left]); break;
        case 13: segs.push([right, top]); break;
        case 14: segs.push([top, left]); break;
        case 5: segs.push([left, top]); segs.push([right, bottom]); break;
        case 10: segs.push([top, right]); segs.push([bottom, left]); break;
        default: break;
      }
    }
  }
  return segs;
}

/** Encadeia os segmentos em voltas fechadas. */
function encadear(segs) {
  const chave = (p) => p[0].toFixed(5) + ',' + p[1].toFixed(5);
  const mapa = new Map();
  segs.forEach((s, i) => {
    for (const k of [chave(s[0]), chave(s[1])]) {
      if (!mapa.has(k)) mapa.set(k, []);
      mapa.get(k).push(i);
    }
  });
  const usado = new Array(segs.length).fill(false);
  const voltas = [];
  for (let i = 0; i < segs.length; i++) {
    if (usado[i]) continue;
    const volta = [segs[i][0]];
    let atual = i;
    while (atual != null) {
      usado[atual] = true;
      const fim = segs[atual][1];
      volta.push(fim);
      const proximos = (mapa.get(chave(fim)) || []).filter((j) => !usado[j]);
      atual = proximos.length ? proximos[0] : null;
    }
    if (volta.length > 3) voltas.push(volta);
  }
  return voltas;
}

const areaAssinada = (pts) => {
  let s = 0;
  for (let i = 0; i < pts.length - 1; i++) s += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  return s / 2;
};

/** Ramer–Douglas–Peucker numa polilinha ABERTA (a fechada divide por zero na corda). */
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const a = pts[0]; const b = pts[pts.length - 1];
  const dx = b[0] - a[0]; const dy = b[1] - a[1];
  const comprimento = Math.hypot(dx, dy);
  let maxD = -1; let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = comprimento < 1e-12
      ? Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1])
      : Math.abs((pts[i][0] - a[0]) * dy - (pts[i][1] - a[1]) * dx) / comprimento;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [a, b];
  return rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps));
}

/** Média circular: tira o ruído do degradê sem encolher a forma (ao contrário de um blur). */
function suavizar(pts, janela) {
  const n = pts.length;
  const raio = janela >> 1;
  const saida = new Array(n);
  for (let i = 0; i < n; i++) {
    let x = 0; let y = 0;
    for (let k = -raio; k <= raio; k++) {
      const p = pts[(i + k + n * 4) % n];
      x += p[0]; y += p[1];
    }
    saida[i] = [x / (raio * 2 + 1), y / (raio * 2 + 1)];
  }
  return saida;
}

// ---------------------------------------------------------------------------------------
// 3. BÉZIERS — Schneider, com os cantos preservados
// ---------------------------------------------------------------------------------------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const soma = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, s) => [a[0] * s, a[1] * s];
const ponto = (a, b) => a[0] * b[0] + a[1] * b[1];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const unit = (a) => { const l = Math.hypot(a[0], a[1]) || 1e-12; return [a[0] / l, a[1] / l]; };

function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u; const b = 3 * u * u * t; const c = 3 * u * t * t; const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

function erroDaCurva(pts, p0, p1, p2, p3, u) {
  let maxE = 0; let idx = Math.floor(pts.length / 2);
  for (let i = 1; i < pts.length - 1; i++) {
    const e = dist(bezier(p0, p1, p2, p3, u[i]), pts[i]);
    if (e > maxE) { maxE = e; idx = i; }
  }
  return { erro: maxE, idx };
}

function gerarBezier(pts, u, p0, p1, p2, p3) {
  const C = [[0, 0], [0, 0]];
  const X = [0, 0];
  for (let i = 0; i < pts.length; i++) {
    const t = u[i]; const m = 1 - t;
    const b0 = m * m * m; const b1 = 3 * m * m * t; const b2 = 3 * m * t * t; const b3 = t * t * t;
    const ajuste = soma(soma(mul(p0, b0), mul(p1, b1)), soma(mul(p2, b2), mul(p3, b3)));
    C[0][0] += b1 * b1; C[0][1] += b1 * b2; C[1][0] += b2 * b1; C[1][1] += b2 * b2;
    const resto = sub(pts[i], ajuste);
    X[0] += b1 * resto[0]; X[1] += b2 * resto[0];
  }
  const det = C[0][0] * C[1][1] - C[1][0] * C[0][1];
  if (Math.abs(det) < 1e-12) return null;
  const alfaA = (X[0] * C[1][1] - X[1] * C[0][1]) / det;
  const alfaB = (C[0][0] * X[1] - C[1][0] * X[0]) / det;
  let d1 = mul(unit(sub(p1, p0)), alfaA);
  let d2 = mul(unit(sub(p2, p3)), alfaB);
  if (!isFinite(alfaA) || !isFinite(alfaB) || alfaA < 0 || alfaB < 0) {
    const meio = dist(p0, p3) / 3;
    d1 = mul(unit(sub(p1, p0)), meio);
    d2 = mul(unit(sub(p2, p3)), meio);
  }
  return [p0, soma(p0, d1), soma(p3, d2), p3];
}

function reparametrizar(pts, u, p0, p1, p2, p3) {
  const n = pts.length;
  const novo = new Array(n);
  const d1 = sub(p1, p0); const d2 = sub(p2, p1); const d3 = sub(p3, p2);
  for (let i = 0; i < n; i++) {
    const t = u[i]; const m = 1 - t;
    const q = bezier(p0, p1, p2, p3, t);
    const q1 = soma(soma(mul(d1, 3 * m * m), mul(d2, 6 * m * t)), mul(d3, 3 * t * t));
    const q2 = soma(mul(sub(d2, d1), 6 * m), mul(sub(d3, d2), 6 * t));
    const dif = sub(q, pts[i]);
    const den = ponto(q1, q1) + ponto(dif, q2);
    const v = den === 0 ? t : t - ponto(dif, q1) / den;
    novo[i] = isFinite(v) ? Math.min(1, Math.max(0, v)) : t;
  }
  novo[0] = 0; novo[n - 1] = 1;
  return novo;
}

function parametrizar(pts) {
  const u = [0];
  for (let i = 1; i < pts.length; i++) u.push(u[i - 1] + dist(pts[i], pts[i - 1]));
  const total = u[u.length - 1] || 1;
  return u.map((v) => v / total);
}

function ajustar(pts, t1, t2, erro, saida, prof) {
  if (prof > 24 || pts.length === 2) {
    const c = dist(pts[0], pts[pts.length - 1]) / 3;
    saida.push([pts[0], soma(pts[0], mul(t1, c)), soma(pts[pts.length - 1], mul(t2, c)),
      pts[pts.length - 1]]);
    return;
  }
  let u = parametrizar(pts);
  let curva = gerarBezier(pts, u, pts[0], soma(pts[0], t1),
    soma(pts[pts.length - 1], t2), pts[pts.length - 1]);
  if (!curva) {
    saida.push([pts[0], pts[0], pts[pts.length - 1], pts[pts.length - 1]]);
    return;
  }
  let { erro: e, idx } = erroDaCurva(pts, curva[0], curva[1], curva[2], curva[3], u);
  if (e <= erro) { saida.push(curva); return; }
  if (e < erro * 4) {
    for (let k = 0; k < 12; k++) {
      u = reparametrizar(pts, u, curva[0], curva[1], curva[2], curva[3]);
      const proxima = gerarBezier(pts, u, pts[0], curva[1], curva[2], pts[pts.length - 1]);
      if (!proxima) break;
      curva = proxima;
      const r = erroDaCurva(pts, curva[0], curva[1], curva[2], curva[3], u);
      if (r.erro <= erro) { saida.push(curva); return; }
      if (r.erro >= e * 0.999) { e = r.erro; idx = r.idx; break; }
      e = r.erro; idx = r.idx;
    }
  }
  const meio = Math.max(1, Math.min(pts.length - 2, idx));
  const c = unit(sub(pts[meio - 1], pts[meio + 1]));
  ajustar(pts.slice(0, meio + 1), t1, c, erro, saida, prof + 1);
  ajustar(pts.slice(meio), mul(c, -1), t2, erro, saida, prof + 1);
}

/** Uma volta fechada -> lista de Béziers, cortada nos cantos. */
function voltaEmCurvas(volta, erro, grau) {
  const pts = volta.slice(0, -1);
  if (pts.length < 3) return [];
  // O fecho cai no ponto de MAIOR viragem: abrir a volta aí põe a emenda num canto, onde ela
  // não se vê. Abrir num trecho suave deixaria marca na junção.
  let melhor = 0; let pior = 2;
  for (let i = 0; i < pts.length; i++) {
    const a = unit(sub(pts[i], pts[(i - 1 + pts.length) % pts.length]));
    const b = unit(sub(pts[(i + 1) % pts.length], pts[i]));
    const v = ponto(a, b);
    if (v < pior) { pior = v; melhor = i; }
  }
  const girado = pts.slice(melhor).concat(pts.slice(0, melhor));
  girado.push(girado[0]);
  const limite = Math.cos((grau * Math.PI) / 180);
  const cortes = [0];
  for (let i = 1; i < girado.length - 1; i++) {
    if (ponto(unit(sub(girado[i], girado[i - 1])), unit(sub(girado[i + 1], girado[i]))) < limite) {
      cortes.push(i);
    }
  }
  cortes.push(girado.length - 1);
  const saida = [];
  for (let k = 0; k < cortes.length - 1; k++) {
    const trecho = girado.slice(cortes[k], cortes[k + 1] + 1);
    if (trecho.length < 2) continue;
    const t1 = unit(sub(trecho[1], trecho[0]));
    const t2 = unit(sub(trecho[trecho.length - 2], trecho[trecho.length - 1]));
    if (!isFinite(t1[0]) || !isFinite(t2[0])) continue;
    ajustar(trecho, t1, t2, erro, saida, 0);
  }
  return saida;
}

// ---------------------------------------------------------------------------------------
// 4. O TRAÇADO COMPLETO, E A MEDIDA
// ---------------------------------------------------------------------------------------

const PADRAO = {
  ampliar: 4,   // factor de subpixel
  janela: 9,    // suavização da volta, em pontos da polilinha ampliada
  eps: 2.0,     // RDP — 0,5px na escala da referência
  erro: 0.7,    // erro máximo do ajuste de Béziers — 0,18px na escala da referência
  grau: 60,     // ângulo a partir do qual um vértice é CANTO e não curva
  ordens: { vermelho: 4 }, // nº de contornos a preservar (ver a nota do cabeçalho)
};

function tracar(referencia, opcoes) {
  const o = Object.assign({}, PADRAO, opcoes);
  const alfa = lerPngEmbutido(REFERENCIAS[referencia] || referencia);
  const ampliada = ampliar(alfa, o.ampliar);
  const voltas = encadear(contornos(ampliada, 127.5));
  const formas = voltas.map((v) => {
    const aberta = suavizar(v.slice(0, -1), o.janela);
    const simplificada = o.eps > 0 ? rdp(aberta, o.eps) : aberta;
    const curvas = voltaEmCurvas(simplificada.concat([simplificada[0]]), o.erro, o.grau);
    return { curvas, area: Math.abs(areaAssinada(v)) / (o.ampliar * o.ampliar) };
  }).filter((f) => f.curvas.length);
  // A MAIOR PRIMEIRO: o `id` de cada path fica estável entre execuções, e é o que permite
  // dizer «a pétala maior» e discuti-la por nome.
  formas.sort((a, b) => b.area - a.area);
  formas.forEach((f, i) => { f.id = 'petala-' + (i + 1); });
  return { formas, W: alfa.W, H: alfa.H, opcoes: o };
}

/** Caixa justa das curvas, e o deslocamento que põe a marca em (0,0). */
function caixa(formas) {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const f of formas) {
    for (const [p0, c1, c2, p3] of f.curvas) {
      for (const p of [p0, c1, c2, p3]) {
        if (p[0] < x0) x0 = p[0];
        if (p[0] > x1) x1 = p[0];
        if (p[1] < y0) y0 = p[1];
        if (p[1] > y1) y1 = p[1];
      }
    }
  }
  return { x0, y0, largura: x1 - x0, altura: y1 - y0 };
}

/** O `d` de um path, em unidades do `viewBox` (escala 1, com o deslocamento da caixa). */
function dDeCurvas(curvas, deslocamento, escala, casas) {
  const fator = Math.pow(10, casas);
  const n = (v) => String(Math.round(((v - 0) * escala) * fator) / fator);
  const pt = (p) => n(p[0] - deslocamento.x0) + ' ' + n(p[1] - deslocamento.y0);
  if (!curvas.length) return '';
  let d = 'M' + pt(curvas[0][0]);
  for (const [, c1, c2, p3] of curvas) d += 'C' + pt(c1) + ' ' + pt(c2) + ' ' + pt(p3);
  return d + 'Z';
}

/** Rasteriza o próprio SVG e compara com a alfa da referência: o IoU é o veredicto. */
function medir(formas, referencia, escala, supersampling) {
  const alfa = lerPngEmbutido(REFERENCIAS[referencia]);
  const { W, H } = alfa;
  const arestas = [];
  for (const f of formas) {
    const pts = [];
    for (const [p0, c1, c2, p3] of f.curvas) {
      const N = 12;
      for (let i = 0; i <= N; i++) {
        const t = i / N; const u = 1 - t;
        pts.push([
          (u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0]) / escala,
          (u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]) / escala,
        ]);
      }
    }
    for (let i = 0; i < pts.length; i++) arestas.push([pts[i], pts[(i + 1) % pts.length]]);
  }
  const conta = new Uint16Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let sy = 0; sy < supersampling; sy++) {
      const yy = y + (sy + 0.5) / supersampling;
      const xs = [];
      for (const [p, q] of arestas) {
        if ((p[1] <= yy && q[1] > yy) || (q[1] <= yy && p[1] > yy)) {
          xs.push(p[0] + ((yy - p[1]) / (q[1] - p[1])) * (q[0] - p[0]));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const x0 = Math.max(0, Math.ceil(xs[i] - 0.5));
        const x1 = Math.min(W - 1, Math.floor(xs[i + 1] - 0.5));
        for (let x = x0; x <= x1; x++) conta[y * W + x]++;
      }
    }
  }
  let inter = 0; let uniao = 0;
  for (let i = 0; i < W * H; i++) {
    const dentro = conta[i] > supersampling / 2;
    const ref = alfa.A[i] > 127.5;
    if (dentro && ref) inter++;
    if (dentro || ref) uniao++;
  }
  return uniao ? inter / uniao : 1;
}

// ---------------------------------------------------------------------------------------

function svgcompleto(tracado) {
  const c = caixa(tracado.formas);
  // AS UNIDADES DO `viewBox` SÃO AS DA REFERÊNCIA (o pixel da arte), e não as da grelha
  // ampliada: 251×292 é o que se lê no arquivo, e é o que qualquer editor mostra. As curvas
  // foram ajustadas na grelha ×4 — daí a divisão — e a precisão de 2 casas guarda 0,01px,
  // quatro vezes mais fina do que o ajuste consegue distinguir.
  const escala = 1 / tracado.opcoes.ampliar;
  const ds = tracado.formas.map((f) => dDeCurvas(f.curvas, c, escala, CASAS));
  const largura = Math.round(c.largura * escala * 100) / 100;
  const altura = Math.round(c.altura * escala * 100) / 100;
  const viewBox = [0, 0, largura, altura].join(' ');
  const paths = tracado.formas.map((f, i) =>
    '  <path id="' + f.id + '" d="' + ds[i] + '" fill="currentColor" ' +
    'fill-rule="evenodd" clip-rule="evenodd"/>').join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${largura}" ` +
    `height="${altura}" role="img" aria-label="Sistema Lastro">\n` +
    `  <title>Sistema Lastro</title>\n${paths}\n</svg>\n`;
}

/**
 * AS DUAS VARIANTES MONOCROMÁTICAS. A mesma geometria, `fill` fixo — os dois arquivos que a
 * direção pediu por nome. Não são dois desenhos: são o mesmo `<path>`, e é por isso que um
 * ajuste de nó se faz uma vez e vale para os três arquivos (a versão de `currentColor` e as
 * duas coloridas).
 *
 * O `fill` fica SÓ no `<svg>`, e os `<path>` não declaram nenhum: em SVG o preenchimento é
 * herdado, e assim a cor muda num lugar só. Sem `fill` nos paths, um editor que abra o
 * arquivo mostra a cor do grupo — e trocar a de uma pétala é criar um preenchimento local,
 * que é o que se quer poder fazer.
 */
function variantes(tracado) {
  const c = caixa(tracado.formas);
  const escala = 1 / tracado.opcoes.ampliar;
  const largura = Math.round(c.largura * escala * 100) / 100;
  const altura = Math.round(c.altura * escala * 100) / 100;
  const viewBox = [0, 0, largura, altura].join(' ');
  const saida = [];
  for (const v of [{ id: 'vermelho', cor: '#6f0913' }, { id: 'prata', cor: '#b3b4b5' }]) {
    const paths = tracado.formas.map((f) =>
      '  <path id="' + f.id + '" d="' + dDeCurvas(f.curvas, c, escala, CASAS) + '"/>').join('\n');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${largura}" ` +
      `height="${altura}" fill="${v.cor}" role="img" aria-label="Sistema Lastro">\n` +
      `  <title>Sistema Lastro — ${v.id}</title>\n${paths}\n</svg>\n`;
    const arquivo = path.join(DIR_MARCA, 'logo-' + v.id + '.svg');
    fs.writeFileSync(arquivo, svg);
    saida.push({ arquivo: path.relative(raiz, arquivo), cor: v.cor, bytes: Buffer.byteLength(svg) });
  }
  return saida;
}

/**
 * O FAVICON — um desenho PRÓPRIO, e a razão está medida.
 *
 * A 16px a marca inteira é textura: as canaletas entre as pétalas medem 2–3px na arte de
 * 249px, o que dá 0,15px no favicon. Foi medido antes de decidir (as cinco colunas de
 * tamanho em `experimentos/marca/README.md`): a 16 e a 24px as quatro silhuetas fundem-se
 * num borrão, e nem a coroa sem a cauda se salva.
 *
 * O que sobrevive é UMA silhueta. E não é uma silhueta inventada: é `petala-1` — a pétala
 * maior, a que domina a arte —, com o MESMO `d` do `lastro.svg`, dentro de um emblema
 * arredondado. O emblema existe por uma razão de facto: uma pétala solta na cor da marca
 * desaparece numa barra de abas escura (medido: sobre `#202124` ela some). Sólido em cima de
 * um fundo sólido, o ícone lê-se nas duas barras — clara e escura.
 *
 * AS CORES VÊM DA FOLHA, não da cabeça de quem escreveu isto: `--burgundy` e `--cream` são
 * lidos de `tools/templates/ciclo.css` no momento da geração. E vão declarados como CUSTOM
 * PROPERTIES dentro do SVG (`--burgundy: #6b1f2e`), que é a forma que o validador sabe
 * conferir: `tools/check-identidade.js` casa cada `--token: #hex` de um «declarante» com a
 * fonte, e reprova se divergir. Um favicon é servido SOZINHO — não tem `<link>` para a folha
 * —, e é por isso que ele pode declarar, e tem de ser conferido.
 *
 * A PALETA É A VIGENTE, e é decisão declarada (a mesma do PDF): o favicon é do SISTEMA, não da
 * escola. Uma escola em Verde de Ensaio tem o site verde e o ícone bordô — do mesmo jeito que
 * tem o PDF bordô. Trocar isso exige uma rota por escola, e não se faz sem decisão.
 */
function favicon(tracado, css) {
  const tokens = {};
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\b/g)) {
    if (!tokens[m[1]]) tokens[m[1]] = m[2].toLowerCase();
  }
  const fundo = tokens['--burgundy'];
  const tinta = tokens['--cream'];
  if (!fundo || !tinta) throw new Error('faltam --burgundy/--cream em tools/templates/ciclo.css');

  // A PÉTALA MAIOR, com o `d` que ela tem no `lastro.svg` — a mesma geometria, não uma cópia
  // redesenhada. É a forma com maior área (a que domina a arte) e a que se lê a 16px.
  const c = caixa(tracado.formas);
  const escala = 1 / tracado.opcoes.ampliar;
  const d = dDeCurvas(tracado.formas[0].curvas, c, escala, CASAS);
  const larg = c.largura * escala;
  const alt = c.altura * escala;

  // O ENCAIXE, calculado e não a olho: a pétala cabe em 100×100 com 12 de margem por cima e
  // por baixo do eixo mais apertado (a altura). O deslocamento é óptico — sobe um pouco,
  // porque a cauda puxa a massa para baixo e o centro geométrico não é o centro que se vê.
  const LADO = 100;
  const MARGEM = 12;
  const k = (LADO - MARGEM * 2) / alt;
  const tx = (LADO - larg * k) / 2;
  const ty = (LADO - alt * k) / 2 - 2.5;
  const num = (v) => Math.round(v * 100) / 100;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}" ` +
    `width="${LADO}" height="${LADO}" role="img" aria-label="Sistema Lastro">\n` +
    `  <title>Sistema Lastro</title>\n` +
    `  <!-- As cores declaradas: o favicon é servido sozinho, sem a folha. Conferidas por
` +
    `       tools/check-identidade.js contra tools/templates/ciclo.css. -->\n` +
    `  <style>:root{--burgundy:${fundo};--cream:${tinta}}</style>\n` +
    `  <rect width="${LADO}" height="${LADO}" rx="22" fill="var(--burgundy)"/>\n` +
    `  <path d="${d}" fill="var(--cream)" fill-rule="evenodd" ` +
    `transform="translate(${num(tx)} ${num(ty)}) scale(${num(k * 1000) / 1000})"/>\n` +
    `</svg>\n`;
}

/**
 * O MÓDULO QUE A BARRA USA. `nav-html.js` é `require`-ido pelo gerador do pacote (Node) e pelo
 * `bastidores.js` (que vai para o Worker, empacotado) — e no Worker não há `fs`. A marca viaja
 * então como STRING num módulo, e o `<svg>` é escrito inline no `<span class="marca">`, que é
 * o que faz o `currentColor` funcionar: a cor vem do `color` do contexto (o `--sobre-marca` da
 * barra), e a marca atravessa as três famílias sem um arquivo por família.
 */
function moduloDaMarca(tracado) {
  // O `<svg>` vai numa linha só, para o markup da barra não vir com quebras no meio de um
  // atributo. O espaço entre os elementos é PRESERVADO (vira um espaço simples): sem ele o
  // `/><path` cola e a comparação com o arquivo acusa diferença onde não há.
  const svg = svgcompleto(tracado).trim().replace(/\n\s*/g, ' ');
  return `'use strict';\n\n` +
    `/**\n` +
    ` * marca-lastro.js — a marca do Sistema Lastro em SVG, como STRING.\n` +
    ` *\n` +
    ` * GERADO por \`node experimentos/marca/vetorizar.js\`. Não editar à mão: o desenho vem de\n` +
    ` * \`tools/templates/marca/lastro.svg\`, e \`tools/check-identidade.js\` confere que os dois\n` +
    ` * são o mesmo texto. Corrigir um nó faz-se no gerador, e as duas cópias acompanham.\n` +
    ` *\n` +
    ` * \`fill="currentColor"\` é o ponto: a marca veste o papel de onde está. Na barra é o\n` +
    ` * \`--sobre-marca\` da família; no papel, o \`--marca-texto\`. Nenhuma família precisa de\n` +
    ` * uma exportação própria.\n` +
    ` */\n` +
    `const SVG = ${JSON.stringify(svg)};\n\n` +
    `/** O tamanho em que a marca entra na barra. O SVG não traz width/height — quem\n` +
    ` *  manda é o CSS (\`.topnav .marca svg\`), e por isso o mesmo arquivo serve a barra e\n` +
    ` *  qualquer outro lugar sem uma segunda cópia. */\n` +
    `module.exports = { SVG };\n`;
}

function principal() {
  const iRef = process.argv.indexOf('--ref');
  const referencia = iRef !== -1 ? process.argv[iRef + 1] : 'vermelho';
  if (!fs.existsSync(REFERENCIAS[referencia])) {
    console.error(`vetorizar: falta a referência «${referencia}» em img/ (imagem de referência ` +
      'não entra no repositório) — NÃO FEITO.');
    return 1;
  }
  const tracado = tracar(referencia);
  const svg = svgcompleto(tracado);
  const iou = medir(tracado.formas, referencia, tracado.opcoes.ampliar, 4);
  const beziers = tracado.formas.reduce((s, f) => s + f.curvas.length, 0);

  if (process.argv.includes('--inline')) {
    process.stdout.write(svg);
    return 0;
  }
  const relatorio = {
    referencia, contornos: tracado.formas.length, beziers, bytes: Buffer.byteLength(svg),
    iou: +iou.toFixed(4), viewBox: svg.match(/viewBox="([^"]+)"/)[1],
    formas: tracado.formas.map((f) => ({ id: f.id, curvas: f.curvas.length, area: Math.round(f.area) })),
  };
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(relatorio, null, 2));
    return 0;
  }
  fs.mkdirSync(DIR_MARCA, { recursive: true });
  fs.writeFileSync(SAIDA, svg);
  console.log('gravado: ' + path.relative(raiz, SAIDA));

  // A BARRA precisa da marca como STRING (o Worker não tem `fs`), e o FAVICON precisa da
  // pétala maior e de dois hex da folha. Os dois saem daqui para não haver uma segunda
  // geometria a envelhecer.
  const css = fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css'), 'utf8');
  fs.writeFileSync(FAVICON, favicon(tracado, css));
  console.log('gravado: ' + path.relative(raiz, FAVICON) + '  ' +
    (fs.statSync(FAVICON).size / 1024).toFixed(1) + 'KB');
  fs.writeFileSync(MODULO_MARCA, moduloDaMarca(tracado));
  console.log('gravado: ' + path.relative(raiz, MODULO_MARCA) + '  ' +
    (fs.statSync(MODULO_MARCA).size / 1024).toFixed(1) + 'KB');

  if (process.argv.includes('--variantes')) {
    for (const v of variantes(tracado)) {
      console.log('gravado: ' + v.arquivo + '  ' + v.cor + '  ' + (v.bytes / 1024).toFixed(1) + 'KB');
    }
  }
  console.log('  contornos ' + relatorio.contornos + ' · béziers ' + beziers +
    ' · ' + (relatorio.bytes / 1024).toFixed(1) + 'KB · viewBox ' + relatorio.viewBox);
  console.log('  fidelidade (IoU contra a alfa da referência): ' + relatorio.iou.toFixed(4));
  for (const f of relatorio.formas) {
    console.log('   · ' + f.id + '  ' + f.curvas + ' curvas  ' + f.area + 'px²');
  }
  return 0;
}

if (require.main === module) process.exit(principal());

module.exports = { tracar, medir, caixa, dDeCurvas, svgcompleto, lerPngEmbutido, REFERENCIAS, SAIDA };
