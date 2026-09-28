#!/usr/bin/env node
'use strict';

/*
 * sincronizar-slide.js — injeta rizoma-slide.svg no slide do mapa do deck.
 *
 *   uso: node tools/sincronizar-slide.js
 *
 * Por que existe: o mapa do slide está EMBUTIDO no Markdown (SVG inline) para
 * aparecer no PDF/PPTX sem depender de arquivo externo. Isso significa que o
 * mesmo desenho vivia em dois lugares (rizoma-slide.svg e o deck) e podia
 * divergir. Agora o SVG é a fonte da verdade e este script copia o conteúdo
 * para dentro do deck, entre os marcadores MAPA:INICIO e MAPA:FIM.
 *
 * Dois cuidados obrigatórios (aprendidos na prática):
 *  1) nenhuma linha em branco dentro do bloco — o CommonMark encerra o bloco
 *     HTML na linha em branco e o resto do SVG vira código-fonte na tela;
 *  2) o estilo do <svg> é o do slide (largura 100%, altura limitada), não o do
 *     arquivo avulso.
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
// A apresentação vive em apresentacoes/apresentacao-01-rizoma/ (Regra 17)
const APRESENTACAO = process.env.APRESENTACAO || path.join(raiz, 'apresentacoes', 'apresentacao-01-rizoma');
const svgPath = path.join(APRESENTACAO, 'rizoma-slide.svg');
const deckPath = path.join(APRESENTACAO, 'apresentacao-ballet.md');
// O fundo do mapa é o `--cream` da identidade: lido da fonte de verdade, não
// reescrito aqui. O deck é Marp (Markdown), então o valor precisa ser resolvido.
const tokens = require('./lib-tokens').ler();
const ESTILO = 'display:block;margin:0 auto;width:100%;height:auto;max-height:540px;background:'
  + tokens['--cream'] + ";font-family:Georgia,serif;";
const INICIO = '<!-- MAPA:INICIO';
const FIM = '<!-- MAPA:FIM';

const linhas = fs.readFileSync(svgPath, 'utf8')
  .split('\n')
  .map(function (l) { return l.replace(/\s+$/, ''); })
  .filter(function (l) { return l.trim() !== '' && !/^<\?xml/.test(l); });

linhas[0] = linhas[0].replace(/(<svg[^>]*style=")[^"]*(")/, '$1' + ESTILO + '$2');
if (!/^<svg/.test(linhas[0])) throw new Error('primeira linha útil do SVG não é a tag <svg>');
const bloco = [
  INICIO + ' — gerado de rizoma-slide.svg por tools/sincronizar-slide.js; não editar à mão -->',
].concat(linhas, [FIM + ' -->']).join('\n');

const deck = fs.readFileSync(deckPath, 'utf8');
const i = deck.indexOf(INICIO);
const f = deck.indexOf(FIM);
if (i < 0 || f < i) throw new Error('marcadores MAPA:INICIO / MAPA:FIM não encontrados em ' + deckPath);
const fimLinha = deck.indexOf('\n', f);
const novo = deck.slice(0, i) + bloco + deck.slice(fimLinha);

if (novo === deck) {
  console.log('já estava sincronizado — nada a fazer (' + linhas.length + ' linhas de SVG)');
} else {
  fs.writeFileSync(deckPath, novo, 'utf8');
  console.log('slide sincronizado com rizoma-slide.svg (' + linhas.length + ' linhas de SVG)');
}

const caixas = (linhas.join('\n').match(/<rect\b[^>]*width="(\d+)"/g) || []).length;
console.log('  caixas no bloco .... ' + caixas);
console.log('  linhas em branco ... 0 (obrigatório: CommonMark encerra o bloco HTML na linha vazia)');
