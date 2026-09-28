#!/usr/bin/env node
'use strict';

/*
 * lib-tokens.js — lê a paleta de tools/templates/ciclo.css para os scripts Node.
 *
 * Por que existe: o ciclo.css é a fonte de verdade da identidade visual, mas o
 * navegador é o único que sabe ler `var(--x)` por conta própria. Os scripts de
 * geração rodam em Node, não têm uma árvore de CSS, e por isso repetiam os hex
 * à mão — era a cópia que divergia em silêncio. Este módulo NÃO é uma segunda
 * fonte de tokens: é um LEITOR da primeira, e existe para que ninguém precise
 * escrever um valor de novo.
 *
 *   const tokens = require('./lib-tokens').ler();
 *   tokens['--gold']  // '#b08d57'
 *
 * Lê só o bloco `:root` e só as cores (hex). Devolve os nomes com o `--`, porque
 * é assim que eles aparecem no CSS e é por esse nome que se procura.
 */

const fs = require('fs');
const path = require('path');

const FONTE = path.join(__dirname, 'templates', 'ciclo.css');

// Um `:root` de cor não tem aninhamento, então o primeiro `}` fecha o bloco.
function ler(caminho = FONTE) {
  const css = fs.readFileSync(caminho, 'utf8');
  // Sem os comentários: o ciclo.css cita `#a06000` justamente para registrar que
  // ele NÃO serve. Um valor rejeitado não é um token.
  const codigo = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const i = codigo.indexOf(':root');
  if (i < 0) throw new Error('paleta não encontrada: :root ausente em ' + caminho);
  const bloco = codigo.slice(i, codigo.indexOf('}', i));
  const tokens = {};
  for (const m of bloco.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g)) {
    tokens[m[1]] = m[2].toLowerCase();
  }
  if (!Object.keys(tokens).length) {
    throw new Error('paleta vazia: :root sem cores em ' + caminho);
  }
  return tokens;
}

// As PILHAS de fonte, que não são hex e por isso não saem em `ler()`.
function lerFontes(caminho = FONTE) {
  const css = fs.readFileSync(caminho, 'utf8');
  const codigo = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const i = codigo.indexOf(':root');
  const bloco = codigo.slice(i, codigo.indexOf('}', i));
  const pilhas = {};
  for (const m of bloco.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;{}]+);/g)) {
    if (!m[2].trim().startsWith('#')) pilhas[m[1]] = m[2].trim();
  }
  return pilhas;
}

module.exports = { FONTE, ler, lerFontes };

// ---------------------------------------------------------------------------
// Modo CLI: emite o bloco de cores em LaTeX para o cabeçalho do PDF, lido da
// mesma fonte. O LaTeX não sabe ler CSS, então este é o único jeito de o PDF
// carregar a identidade sem uma segunda lista de valores.
//   node tools/lib-tokens.js --latex
// Os pares usados no PDF e as razões de contraste estão em IDENTIDADE-VISUAL.md.
// ---------------------------------------------------------------------------
if (require.main === module && process.argv.includes('--latex')) {
  const cores = ler();
  const linhas = [];
  for (const [token, hex] of Object.entries(cores)) {
    // --gold-borda vira ciclogoldborda: xcolor não aceita hífen no nome.
    linhas.push(`\\definecolor{ciclo${token.slice(2).replace(/-/g, '')}}{HTML}{${hex.slice(1).toUpperCase()}}`);
  }
  // O `texorpdfstring` não é necessário: os títulos de seção não entram no PDF
  // como bookmark colorido, e o hyperref é carregado pelo pandoc DEPOIS deste
  // cabeçalho — por isso o hypersetup vai em \AtBeginDocument.
  linhas.push('\\AtBeginDocument{\\hypersetup{');
  linhas.push('  linkcolor=ciclogoldescuro, urlcolor=ciclogoldescuro, citecolor=ciclogoldescuro,');
  linhas.push('  filecolor=ciclogoldescuro, menucolor=ciclogoldescuro}}');
  linhas.push('\\allsectionsfont{\\color{cicloburgundy}}');
  process.stdout.write(linhas.join('\n') + '\n');
}
