#!/usr/bin/env node
'use strict';

/*
 * check-identidade.js — guarda-corpo da identidade visual do Projeto Ciclo.
 *
 *   uso: node tools/check-identidade.js
 *
 * A identidade tem UMA fonte de verdade: tools/templates/ciclo.css. A regra é
 * `IDENTIDADE-VISUAL.md`. Este arquivo existe porque a divergência que motivou
 * aquela regra era silenciosa: quatro arquivos declaravam a paleta, cada um com
 * o seu valor, e nada avisava. Confere, sem dependências externas:
 *
 *   1) a paleta: todo par declarado (texto/fundo, traço/fundo) passa no piso
 *      WCAG 2.1 AA — 4,5:1 para texto, 3,0:1 para traço com função. O valor é
 *      MEDIDO, não estimado: a norma é aritmética, não gosto;
 *   2) a cópia única: nenhum arquivo fora do ciclo.css redeclara um destes hex;
 *   3) o circuito: o ciclo.css chegou mesmo ao pacote (assets/style.css idêntico),
 *      e o nav.js também — sem isso a página fica sem barra e sem menu.
 *
 * Sai com código 1 se o contraste falhar ou se um hex solto reaparecer.
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const fonte = path.join(raiz, 'tools/templates/ciclo.css');

const erros = [];
const ok = [];

// ------------------------------------------------------------------ contraste

// WCAG 2.1: luminância relativa e razão de contraste.
function luminancia(hex) {
  const h = hex.replace('#', '');
  const seis = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(seis.substr(i, 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const x = luminancia(a);
  const y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Os pares que a identidade usa, com o piso de cada um. `texto` é o piso 4,5:1;
// `traço` é o piso 3,0:1 (borda e filete têm função, não são decoração).
const PARES = [
  ['corpo do texto sobre o papel', '--tinta', '--cream', 4.5],
  ['texto secundário', '--soft', '--cream', 4.5],
  ['título de seção', '--burgundy', '--cream', 4.5],
  ['título de bloco (h4)', '--gold-texto', '--cream', 4.5],
  ['cabeçalho de tabela', '--gold-texto', '--creme-2', 4.5],
  ['legenda de ficha', '--gold-texto', '--creme-2', 4.5],
  ['marca da barra', '--gold-claro', '--burgundy', 4.5],
  ['marca sob o ponteiro', '--cream', '--burgundy-claro', 4.5],
  ['item de menu', '--cream', '--burgundy', 4.5],
  ['item de menu aberto', '--cream', '--burgundy-claro', 4.5],
  ['botão voltar ao topo', '--cream', '--burgundy', 4.5],
  ['item ativo (texto sobre o ouro)', '--sobre-ouro', '--gold', 4.5],
  ['aviso de parcial', '--alerta', '--cream', 4.5],
  ['aviso sobre fundo de tabela', '--alerta', '--creme-2', 4.5],
  ['aconteceu', '--ok', '--cream', 4.5],
  ['erro / não aconteceu', '--falha', '--cream', 4.5],
  ['filete de ouro', '--gold-escuro', '--cream', 3.0],
  ['borda de tabela', '--gold-escuro', '--branco', 3.0],
  ['borda de campo de formulário', '--gold-borda', '--branco', 3.0],
  ['borda de campo sobre o papel', '--gold-borda', '--cream', 3.0],
  ['ornamento da barra', '--gold-claro', '--burgundy', 3.0],
];

// Os tokens declarados no :root da fonte de verdade. Lê o bloco até a primeira
// chave fechada — o :root do ciclo.css é plano, sem aninhamento.
function lerTokens() {
  const css = fs.readFileSync(fonte, 'utf8');
  const i = css.indexOf(':root');
  if (i < 0) {
    erros.push('Identidade: tools/templates/ciclo.css não declara :root');
    return {};
  }
  const bloco = css.slice(i, css.indexOf('}', i));
  const tokens = {};
  for (const m of bloco.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g)) {
    tokens[m[1]] = m[2].toLowerCase();
  }
  return tokens;
}

const tokens = lerTokens();

// ------------------------------------------------------------------ 1) paleta

if (Object.keys(tokens).length) {
  const falhas = [];
  for (const [nome, fundoToken, frenteToken, piso] of PARES) {
    const frente = tokens[frenteToken];
    const fundo = tokens[fundoToken];
    if (!frente || !fundo) {
      erros.push(`Identidade: par "${nome}" cita token inexistente (${frenteToken} / ${fundoToken})`);
      continue;
    }
    const r = contraste(frente, fundo);
    if (r < piso) falhas.push(`${nome} ${r.toFixed(2)}:1 (piso ${piso.toFixed(1)})`);
  }
  if (falhas.length) {
    for (const f of falhas) erros.push(`Contraste: ${f}`);
  } else {
    ok.push(`Contraste: ${PARES.length} pares medidos, todos em AA ou acima`);
  }
}

// ------------------------------------------------------- 2) a cópia única

// Quem consome a paleta. O ciclo.css é a fonte e por isso não entra: ele é o
// único lugar onde um hex pode ser escrito.
const CONSUMIDORES = [
  'tools/templates/ciclo.html',
  'tools/templates/lancamento.html',
  'tools/gerar-ciclo.sh',
  'tools/gerar-animacao.js',
  'tools/sincronizar-slide.js',
  'tools/hash-ciclo.sh',
  // O deck é Marp, não pode referenciar os tokens: ele DECLARA os valores e a
  // correspondência fica por conta deste validador.
  'apresentacoes/apresentacao-01-rizoma/apresentacao-ballet.md',
];

// Um comentário que CITA um valor — para explicar por que ele saiu — não é
// redeclaração. Esta função apaga o texto dos comentários PRESERVANDO as quebras
// de linha, porque o número da linha é metade do valor do erro.
function semComentarios(texto, rel) {
  const apaga = (m) => m.replace(/[^\n]/g, ' ');
  let t = texto;
  if (/\.(css|js|html)$/.test(rel)) t = t.replace(/\/\*[\s\S]*?\*\//g, apaga);
  t = t.replace(/<!--[\s\S]*?-->/g, apaga);
  if (/\.(js|sh)$/.test(rel)) {
    t = t.replace(/(^|\s)\/\/[^\n]*/g, apaga);
    t = t.replace(/^[ \t]*#[^\n]*/gm, apaga);
  }
  return t;
}

// A paleta é o conjunto de hex que a fonte de verdade ESCREVE — os comentários
// fora: o `#a06000` do ciclo.css é um valor REJEITADO, citado para registrar por
// que não serve, e não um tom da identidade.
const paleta = new Set();
{
  const codigo = semComentarios(fs.readFileSync(fonte, 'utf8'), 'tools/templates/ciclo.css');
  for (const m of codigo.matchAll(/#[0-9a-fA-F]{6}\b/g)) paleta.add(m[0].toLowerCase());
}

// Tons que NÃO são da identidade (um cinza de rótulo do deck, por exemplo) podem
// existir soltos — o que não pode é a paleta se duplicar.
//
// O deck é a exceção declarada: sendo Marp (Markdown), ele não consegue referenciar
// `var(--x)` da fonte de verdade, então DECLARA os valores. Nos demais arquivos um
// hex da paleta é cópia indevida; na linha do `:root` do deck ele é a declaração —
// e o que se confere ali é se o valor declarado BATE com o canônico.
const DECK = 'apresentacoes/apresentacao-01-rizoma/apresentacao-ballet.md';
const soltos = [];
for (const rel of CONSUMIDORES) {
  const p = path.join(raiz, rel);
  if (!fs.existsSync(p)) {
    erros.push(`Identidade: consumidor declarado não existe: ${rel}`);
    continue;
  }
  const bruto = fs.readFileSync(p, 'utf8');
  let codigo = semComentarios(bruto, rel);
  // O deck é Marp (Markdown): no corpo ele EMBUTE a obra do mapa como SVG inline
  // (gerado de rizoma-slide.svg, que é casado como texto e por isso não pode virar
  // token). A parte que consome a identidade é o bloco `style:` do frontmatter —
  // só ele é conferido; o desenho tem as suas próprias cores literais.
  // O fora-do-escopo é MASCARADO (vira espaço, mantendo as quebras de linha) para
  // que o número da linha do erro continue sendo o número da linha no arquivo:
  // semComentarios preserva o comprimento do texto, então os índices valem.
  if (rel === DECK) {
    const i = codigo.indexOf('style: |');
    const fim = codigo.indexOf('\n---', i);
    const ate = fim < 0 ? codigo.length : fim;
    codigo = codigo
      .split('')
      .map((c, n) => (n >= i && n < ate ? c : c === '\n' ? '\n' : ' '))
      .join('');
  }
  codigo.split('\n').forEach((linha, i) => {
    for (const m of linha.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
      if (!paleta.has(m[0].toLowerCase())) continue;
      if (rel === DECK && /^\s*--[a-z0-9-]+\s*:/.test(linha)) continue;  // declaração
      soltos.push(`${rel}:${i + 1} ${m[0]}`);
    }
  });
}
if (soltos.length) {
  for (const s of soltos.slice(0, 12)) {
    erros.push(`Cópia única: hex da paleta fora do ciclo.css — ${s}`);
  }
  if (soltos.length > 12) erros.push(`Cópia única: +${soltos.length - 12} ocorrência(s)`);
} else {
  ok.push(`Cópia única: nenhum dos ${paleta.size} hex da paleta fora de tools/templates/ciclo.css`);
}

// A correspondência declarada pelo deck: cada `--token: #hex` do frontmatter tem
// de valer o mesmo que a fonte de verdade. É o que impede o deck de "declarar a
// identidade" com um valor que já mudou.
{
  const p = path.join(raiz, DECK);
  if (fs.existsSync(p)) {
    const texto = fs.readFileSync(p, 'utf8');
    const front = texto.slice(0, texto.indexOf('\n---', 3));
    const divergentes = [];
    let declarados = 0;
    for (const m of front.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;?\s*$/gm)) {
      const [, nome, valor] = m;
      declarados++;
      if (!tokens[nome]) {
        divergentes.push(`${nome} não existe na fonte de verdade`);
      } else if (tokens[nome] !== valor.toLowerCase()) {
        divergentes.push(`${nome} declara ${valor.toLowerCase()}, a fonte diz ${tokens[nome]}`);
      }
    }
    if (divergentes.length) {
      for (const d of divergentes) erros.push(`Deck: ${d}`);
    } else if (declarados) {
      ok.push(`Deck: os ${declarados} tokens declarados batem com tools/templates/ciclo.css`);
    }
  }
}

// ------------------------------------------------------------- 3) o circuito

// A folha de estilo e o nav são COPIADOS ao pacote pelo gerador. Se a cópia
// divergir da fonte, a página servida não é a identidade — é uma versão antiga.
function compararPacotes() {
  const dirProf = path.join(raiz, 'professores');
  if (!fs.existsSync(dirProf)) return;
  for (const prof of fs.readdirSync(dirProf)) {
    const dirCiclos = path.join(dirProf, prof, 'ciclos');
    if (!fs.existsSync(dirCiclos)) continue;
    for (const entry of fs.readdirSync(dirCiclos, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('ciclo-')) continue;
      const pacote = path.join(dirCiclos, entry.name);
      for (const [origem, destino] of [
        ['tools/templates/ciclo.css', 'assets/style.css'],
        ['tools/templates/nav.js', 'assets/nav.js'],
      ]) {
        const fonteArq = path.join(raiz, origem);
        const copia = path.join(pacote, destino);
        if (!fs.existsSync(copia)) {
          erros.push(`Circuito: ${path.relative(raiz, copia)} não existe — regenere o pacote`);
          continue;
        }
        if (fs.readFileSync(fonteArq, 'utf8') !== fs.readFileSync(copia, 'utf8')) {
          erros.push(`Circuito: ${path.relative(raiz, copia)} divergiu de ${origem} — regenere o pacote`);
        }
      }
    }
  }
}
compararPacotes();
if (!erros.some((e) => e.startsWith('Circuito'))) {
  ok.push('Circuito: assets/style.css e assets/nav.js de cada pacote batem com a fonte');
}

// -------------------------------------------------------------------- saída

for (const l of ok) console.log(`ok: ${l}`);
for (const e of erros) console.error(`erro: ${e}`);
if (erros.length) {
  console.error(`\n${erros.length} problema(s). A identidade está em IDENTIDADE-VISUAL.md.`);
}
process.exit(erros.length ? 1 : 0);
