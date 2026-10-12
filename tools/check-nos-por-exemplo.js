#!/usr/bin/env node
'use strict';

/*
 * check-nos-por-exemplo.js — a página «Nós, Por Exemplo» tem UMA fonte de
 * verdade: biblioteca/nos-por-exemplo.md. A raiz e os index.html dos ciclos são
 * CÓPIAS dela (a raiz sem links; os ciclos com os atalhos «Acessar …» virados
 * em link). Este validador confirma que nenhuma cópia derivou.
 *
 *   uso: node tools/check-nos-por-exemplo.js
 *
 * Sai com código 1 se alguma página divergir. O texto não tem lastro nem
 * vínculo com dados — a checagem é de consistência de redação, não de
 * proveniência.
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const fonte = path.join(raiz, 'biblioteca', 'nos-por-exemplo.md');

const erros = [];
const ok = [];

// ------------------------------------------------------------- normalização
// O "corpo" é o texto legível de uma página, já sem HTML/Markdown, sem os
// atalhos «Acessar …» (que só os ciclos têm) e com o espaço normalizado.
function normalizar(texto) {
  return String(texto || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(?:p|h[1-6]|li|ul|ol|div|main|header|footer|section|article|blockquote|table|tr|td|th)>/gi, ' ')
    .replace(/<[^>]+>/g, '')                      // tira as tags restantes (inline)
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')                          // normaliza o espaço PRIMEIRO
    .replace(/acessar a anamnese do aluno/g, ' ')  // atalho do ciclo
    .replace(/acessar o plano de ensino/g, ' ')
    .replace(/acessar o plano de observação/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// O corpo canônico, direto da fonte Markdown, sem o frontmatter e sem as
// linhas «Acessar …».
function canonico(md) {
  return String(md || '')
    .replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '')          // frontmatter YAML
    .split('\n')
    .filter((l) => !/^\*\*\[Acessar/.test(l.trim()))   // atalhos de link
    .join('\n')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')              // imagem
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')            // [texto](url) → texto
    .replace(/\*\*/g, '')                               // negrito
    .replace(/\*/g, '')                                 // itálico
    .replace(/^#{1,6}\s+/gm, '')                        // título
    .replace(/^\s*>\s?/gm, '')                          // citação
    .replace(/^\s*[-*+]\s+/gm, '')                      // marcador de lista
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// ------------------------------------------------------------- alvos
function paginasNós() {
  const alvos = [path.join(raiz, 'raiz', 'index.html')];
  const profDir = path.join(raiz, 'professores');
  if (!fs.existsSync(profDir)) return alvos;
  for (const professor of fs.readdirSync(profDir)) {
    const ciclos = path.join(profDir, professor, 'ciclos');
    if (!fs.existsSync(ciclos)) continue;
    for (const entrada of fs.readdirSync(ciclos)) {
      // só o índice do pacote (ciclo-XX-<escola>/index.html), não a porta.
      const idx = path.join(ciclos, entrada, 'index.html');
      if (fs.existsSync(idx)) alvos.push(idx);
    }
  }
  return alvos;
}

// ------------------------------------------------------------- execução
const md = fs.readFileSync(fonte, 'utf8');
const base = canonico(md);
if (!base) {
  console.error('erro: a fonte biblioteca/nos-por-exemplo.md está vazia');
  process.exit(1);
}

for (const alvo of paginasNós()) {
  const rel = path.relative(raiz, alvo);
  const html = fs.readFileSync(alvo, 'utf8');
  const corpo = normalizar(html);
  if (corpo.includes(base)) {
    ok.push(rel);
  } else {
    erros.push(rel);
  }
}

for (const rel of ok) console.log('ok: ' + rel);
for (const rel of erros) console.log('erro: ' + rel + ' — divergiu da fonte biblioteca/nos-por-exemplo.md');

if (erros.length) {
  console.error('\n' + erros.length + ' página(s) «Nós, Por Exemplo» divergente(s). ' +
    'Regenere com tools/gerar-raiz.sh (raiz) e tools/gerar-ciclo.sh <p> <ciclo> <escola> (ciclos).');
  process.exit(1);
}

console.log('\nOK: ' + ok.length + ' página(s) «Nós, Por Exemplo» fiéis à fonte.');
process.exit(0);
