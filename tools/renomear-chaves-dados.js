#!/usr/bin/env node
'use strict';

/*
 * renomear-chaves-dados.js — a MIGRAÇÃO do rename (peça d, Fase 3).
 *
 *   uso: node tools/renomear-chaves-dados.js <ciclo-XX[-<escola>]-dados.json> \
 *          --renomear <antiga>=<nova> [--renomear …] [--aplicar]
 *
 * POR QUE EXISTE, E POR QUE É NA FONTE. As chaves do JSON de dados eram as do modelo fixo
 * (`alinhamento`, `tempo`…) e o ciclo passou a declarar as suas (o schema da captura: rótulo ↔
 * chave). O rename acontece no TEXTO PLANO — `ciclos/ciclo-XX[-<escola>]-dados.json`, que é FONTE
 * (entra no hash FIPP) —, e não no envelope cifrado do pacote: o envelope é DERIVADO, e o gerador
 * o reescreve a partir deste arquivo a cada `gerar-ciclo.sh`. Migrar o envelope seria perdido na
 * geração seguinte (foi o que aconteceu na primeira tentativa desta fase).
 *
 * A TABELA DE ALIASES chega por argumento, não em código: ela é a decisão que a Fase 1 mediu
 * (`alinhamento=metatarsos`, no Duo — e mais nenhuma).
 *
 * SEM `--aplicar` é dry-run: relata os caminhos que trocaria e não escreve nada. O JSON de dados é
 * FONTE: migração de fonte não se faz às cegas.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const aplicar = args.includes('--aplicar');
const posicionais = [];
const aliases = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--renomear') {
    const par = args[i + 1] || '';
    const igual = par.indexOf('=');
    if (igual < 1) {
      console.error(`erro: --renomear espera <antiga>=<nova> (veio '${par}')`);
      process.exit(2);
    }
    aliases[par.slice(0, igual)] = par.slice(igual + 1);
    i++;
    continue;
  }
  if (!args[i].startsWith('--')) posicionais.push(args[i]);
}
const [caminho] = posicionais;
if (!caminho || Object.keys(aliases).length === 0) {
  console.error('uso: node tools/renomear-chaves-dados.js <ciclo-XX[-<escola>]-dados.json>'
    + ' --renomear <antiga>=<nova> [--aplicar]');
  process.exit(2);
}
if (/_cifrado/.test(fs.readFileSync(caminho, 'utf8').slice(0, 400))) {
  console.error(`erro: ${path.basename(caminho)} é o ENVELOPE CIFRADO (derivado), não a fonte —`
    + ' renomeie o texto plano (ciclos/ciclo-XX[-<escola>]-dados.json) e rode o gerador.');
  process.exit(1);
}

const dados = JSON.parse(fs.readFileSync(caminho, 'utf8'));

// Onde as chaves moram: nos objetos por PESSOA, dentro de cada bloco de cada aula
// (`aula.tecnica.<apelido>.<chave>`). O passe é raso de propósito: renomear em profundidade
// alcançaria prosa (`condicoes_contorno`, `relatorio`) que a migração não toca.
const trocas = [];
const renomear = (obj, onde) => {
  Object.entries(aliases).forEach(([de, para]) => {
    if (!Object.prototype.hasOwnProperty.call(obj, de)) return;
    if (Object.prototype.hasOwnProperty.call(obj, para)) {
      trocas.push(`${onde}.${de} — NÃO trocada: '${para}' já existe (conflito, resolver à mão)`);
      return;
    }
    const valor = obj[de];
    delete obj[de];
    obj[para] = valor;
    trocas.push(`${onde}.${de} → ${para}`);
  });
};

Object.entries(dados.aulas || {}).forEach(([id, aula]) => {
  Object.entries(aula || {}).forEach(([bloco, valor]) => {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return;
    Object.entries(valor).forEach(([pessoa, marcas]) => {
      if (!marcas || typeof marcas !== 'object' || Array.isArray(marcas)) return;
      renomear(marcas, `aula ${id} → ${bloco} → ${pessoa}`);
    });
  });
});

console.log(`${aplicar ? 'APLICANDO' : 'DRY-RUN'}: ${path.basename(caminho)} — ${trocas.length} troca(s)`);
trocas.forEach((t) => console.log(`  ${t}`));
const recusadas = trocas.filter((t) => t.includes('NÃO trocada')).length;
if (!aplicar) {
  console.log('nada foi escrito (sem --aplicar)');
  process.exit(recusadas ? 1 : 0);
}
if (recusadas) {
  console.error('erro: há conflito de chave — resolva à mão antes de aplicar');
  process.exit(1);
}

fs.writeFileSync(caminho, JSON.stringify(dados, null, 2) + '\n', 'utf8');
console.log(`gravado: ${path.basename(caminho)} — rode tools/gerar-ciclo.sh para o envelope seguir`);
