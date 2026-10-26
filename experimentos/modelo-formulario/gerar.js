#!/usr/bin/env node
'use strict';

/*
 * gerar.js — o modelo num arquivo só.
 *
 * Por que existe. O modelo foi entregue primeiro como um `index.html` que pedia DOIS
 * ficheiros de CSS ao lado. Quem o abrisse de outro sítio — ou por uma rota que não
 * servisse os vizinhos — via a página sem folha: texto solto, que se lê como «não abriu».
 * A correção é não depender de nada: este script copia `ciclo.css` e a folha da porta para
 * DENTRO do HTML e grava o ícone como data URI. O resultado é um ficheiro que se abre com
 * dois cliques, offline, e sai igual em qualquer navegador.
 *
 *   node experimentos/modelo-formulario/gerar.js
 *
 * Entra:  fonte.html + tools/templates/ciclo.css + estilo-da-porta.css + o favicon
 * Sai:    modelo.html  (é o que o servidor local serve na raiz)
 */

const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const RAIZ = path.resolve(AQUI, '..', '..');

const fonte = fs.readFileSync(path.join(AQUI, 'fonte.html'), 'utf8');
const ciclo = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
const porta = fs.readFileSync(path.join(AQUI, 'estilo-da-porta.css'), 'utf8');
const svg = fs.readFileSync(path.join(RAIZ, 'tools/templates/marca/favicon.svg'));
const favicon = 'data:image/svg+xml;base64,' + svg.toString('base64');

const alvo = new RegExp(
  '<link rel="icon"[^>]*>\\s*'
  + '<link rel="stylesheet" href="\\.\\./\\.\\./tools/templates/ciclo\\.css">\\s*'
  + '<link rel="stylesheet" href="estilo-da-porta\\.css">',
);
if (!alvo.test(fonte)) {
  console.error('gerar: o cabeçalho de links de fonte.html não está na forma esperada.');
  process.exit(1);
}

const substituto = [
  '<link rel="icon" href="' + favicon + '">',
  '<style>',
  '/* ===== tools/templates/ciclo.css, copiado: este ficheiro não pede nada a ninguém ===== */',
  ciclo,
  '/* ===== a folha da porta (a do formulário de verdade) ===== */',
  porta,
  '</style>',
].join('\n');

const saida = fonte.replace(alvo, substituto);
const destino = path.join(AQUI, 'modelo.html');
fs.writeFileSync(destino, saida, 'utf8');

const externos = saida.match(/<link[^>]*>/g) || [];
const deRede = externos.filter((l) => !/data:/.test(l));
console.log('gerado: ' + path.relative(RAIZ, destino) + ' (' + Math.round(saida.length / 1024) + ' KB)');
console.log('  links externos que não sejam data URI: ' + deRede.length);
if (deRede.length) {
  console.error('  → o ficheiro deixou de ser autossuficiente: ' + deRede.join(' '));
  process.exit(1);
}
