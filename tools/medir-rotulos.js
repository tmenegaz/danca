#!/usr/bin/env node
'use strict';

/*
 * medir-rotulos.js — mede no navegador se algum rótulo passa da própria caixa.
 *
 *   uso: node tools/medir-rotulos.js [arquivo.svg ...]
 *
 * Por que existe: a estimativa por número de caracteres erra (depende da fonte
 * instalada). Aqui o SVG é aberto no Chrome e a largura real de cada <text> é
 * lida com getComputedTextLength(), comparada com a largura da caixa do grupo.
 * Usa o puppeteer-core que já vem no marp-cli — nenhuma dependência nova.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const puppeteer = require(
  path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli/node_modules/puppeteer-core')
);

const raiz = path.resolve(__dirname, '..');
const APRESENTACAO = process.env.APRESENTACAO || path.join(raiz, 'apresentacoes', 'apresentacao-01-rizoma');

const arquivos = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['rizoma-corrigido.svg', 'rizoma-slide.svg'].map((f) => path.join(APRESENTACAO, f));

(async () => {
  const navegador = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  let problemas = 0;

  for (const rel of arquivos) {
    const abs = path.resolve(rel);
    if (!fs.existsSync(abs)) { console.error('não encontrado: ' + rel); continue; }
    const pagina = await navegador.newPage();
    await pagina.goto('file://' + abs, { waitUntil: 'load' });

    const r = await pagina.evaluate(() => {
      const svg = document.querySelector('svg');
      const saida = [];
      const caixas = [];
      const textos = [];
      svg.querySelectorAll('g').forEach((g, indice) => {
        const doGrupo = Array.from(g.querySelectorAll('rect'))
          .map((x) => ({ x: parseFloat(x.getAttribute('x')), y: parseFloat(x.getAttribute('y')), w: parseFloat(x.getAttribute('width')), h: parseFloat(x.getAttribute('height')) }))
          .filter((c) => c.w >= 60); // só caixas de nó (ignora swatches da legenda)
        if (!doGrupo.length) return;
        const largura = Math.max.apply(null, doGrupo.map((c) => c.w));
        doGrupo.forEach((c) => caixas.push(Object.assign({ grupo: indice }, c)));
        g.querySelectorAll('text').forEach((t) => {
          const larg = t.getComputedTextLength();
          const bb = t.getBBox();
          textos.push({ grupo: indice, texto: t.textContent.trim(), medida: Math.round(larg), tamanho: getComputedStyle(t).fontSize, bb: bb, largura: largura });
        });
      });

      textos.forEach((t) => {
        if (t.medida > t.largura) {
          saida.push({ tipo: 'excede', texto: t.texto, medida: t.medida, caixa: Math.round(t.largura), folga: Math.round(t.largura - t.medida), tamanho: t.tamanho });
        } else if (t.medida > t.largura - 6) {
          saida.push({ tipo: 'justo', texto: t.texto, medida: t.medida, caixa: Math.round(t.largura), folga: Math.round(t.largura - t.medida), tamanho: t.tamanho });
        }
        // invasão de caixa alheia: o rótulo de um nó não pode cobrir a caixa de outro
        caixas.forEach((c) => {
          if (c.grupo === t.grupo) return;
          const x1 = Math.max(t.bb.x, c.x), x2 = Math.min(t.bb.x + t.bb.width, c.x + c.w);
          const y1 = Math.max(t.bb.y, c.y), y2 = Math.min(t.bb.y + t.bb.height, c.y + c.h);
          const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
          if (area > 8) {
            saida.push({ tipo: 'invade', texto: t.texto, medida: Math.round(area), caixa: Math.round(c.w), folga: Math.round(y1 - y2), tamanho: t.tamanho, alvo: '(' + Math.round(c.x) + ',' + Math.round(c.y) + ')' });
          }
        });
      });
      return saida;
    });

    console.log('\n' + rel + ' — ' + (r.length ? r.length + ' aviso(s) de rótulo:' : 'todos os rótulos cabem na caixa e não invadem outras caixas ✓'));
    r.forEach((o) => {
      const etiqueta = o.tipo === 'excede' ? 'FALHA' : o.tipo === 'invade' ? 'INVADE' : 'justo';
      const detalhe = o.tipo === 'invade'
        ? o.medida + 'px² sobre a caixa ' + o.alvo
        : o.medida + 'px em caixa de ' + String(o.caixa).padStart(3) + 'px (folga ' + String(o.folga).padStart(4) + 'px)';
      console.log('  [' + etiqueta + '] ' + (o.texto + ' ').padEnd(26, '.') + ' ' + detalhe.padEnd(42) + o.tamanho);
    });
    problemas += r.filter((o) => o.tipo !== 'justo').length;
    await pagina.close();
  }

  await navegador.close();
  if (problemas) { console.error('\nFALHOU: ' + problemas + ' rótulo(s) fora da caixa ou invadindo outra.'); process.exit(1); }
  console.log('\nOK: nenhum rótulo passa da caixa nem invade caixa alheia (medida real do navegador).');
})();
