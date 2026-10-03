#!/usr/bin/env node
'use strict';

/*
 * validar-schema-ciclo.js — valida os arquivos .conf de um ciclo contra o schema
 * do ciclo (P-08: "os campos do ciclo são declarados em schema").
 *
 *   uso: node tools/validar-schema-ciclo.js <schema.json> <conf1> [conf2 ...]
 *        node tools/validar-schema-ciclo.js ciclos/ciclo-01-schema.json \
 *             ciclos/ciclo-01.conf ciclos/ciclo-01-diaghilev.conf
 *
 * O contrato é a PRESENÇA dos campos obrigatórios. A união dos .conf passados é
 * considerada, porque neste projeto o manifesto base (ciclo-XX.conf) e o de
 * variante (ciclo-XX-<escola>.conf) se complementam.
 *
 * Extra: quando o schema declara `pattern`, o valor também é conferido — é uma
 * checagem a mais, nunca a mais fraca. Sem dependências externas.
 *
 * Sai com 0 se todos os campos obrigatórios estão presentes (e batem o padrão);
 * com 1 se algo falta, imprimindo os campos faltantes.
 */

const fs = require('fs');
const path = require('path');

function uso() {
  console.error('uso: node tools/validar-schema-ciclo.js <schema.json> <conf1> [conf2 ...]');
}

// Lê um .conf no formato CHAVE="valor" ou CHAVE=valor; ignora vazias e comentários.
// O arquivo é consumido pelo bash (`source`), então o parser imita o bash:
//   · valor entre aspas duplas ou simples termina na aspa de fechamento;
//   · o que vem depois da aspa (ou o que segue um # fora de aspas) é comentário;
//   · sem aspas, o valor termina no primeiro # ou no fim da linha.
function lerConf(caminho) {
  const campos = {};
  const linhas = fs.readFileSync(caminho, 'utf8').split('\n');
  for (const linha of linhas) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith('#')) continue;
    const m = limpa.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const chave = m[1];
    let resto = m[2].trim();
    let valor = resto;
    if (resto.startsWith('"') || resto.startsWith("'")) {
      const aspa = resto[0];
      const fim = resto.indexOf(aspa, 1);
      valor = fim === -1 ? resto.slice(1) : resto.slice(1, fim);
    } else {
      const corte = resto.indexOf('#');
      valor = (corte === -1 ? resto : resto.slice(0, corte)).trim();
    }
    campos[chave] = valor;
  }
  return campos;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) { uso(); return 2; }

  const [caminhoSchema, ...confs] = args;

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(caminhoSchema, 'utf8'));
  } catch (e) {
    console.error(`erro: não consegui ler o schema ${caminhoSchema} (${e.message})`);
    return 1;
  }

  const obrigatorios = Array.isArray(schema.required) ? schema.required : [];
  const propriedades = schema.properties || {};

  // união dos campos presentes em todos os .conf passados
  const campos = {};
  for (const conf of confs) {
    let lidos;
    try {
      lidos = lerConf(conf);
    } catch (e) {
      console.error(`erro: não consegui ler ${conf} (${e.message})`);
      return 1;
    }
    Object.assign(campos, lidos);
  }

  const faltando = obrigatorios.filter((c) => !(c in campos));
  const fora = [];
  for (const campo of obrigatorios) {
    const padrao = propriedades[campo] && propriedades[campo].pattern;
    if (!padrao || !(campo in campos)) continue;
    if (!new RegExp(padrao).test(campos[campo])) {
      fora.push(`${campo}="${campos[campo]}" (esperado ${padrao})`);
    }
  }

  const nomeSchema = path.basename(caminhoSchema);
  const nomeConfs = confs.map((c) => path.basename(c)).join(' + ');

  if (faltando.length) {
    console.error(`schema ${nomeSchema} × ${nomeConfs}`);
    console.error(`faltam ${faltando.length} campo(s) obrigatório(s):`);
    for (const c of faltando) { console.error(`  - ${c}`); }
    return 1;
  }

  if (fora.length) {
    console.error(`schema ${nomeSchema} × ${nomeConfs}`);
    console.error(`${fora.length} campo(s) com valor fora do padrão:`);
    for (const c of fora) { console.error(`  - ${c}`); }
    return 1;
  }

  console.log(`ok: ${nomeConfs} satisfaz ${nomeSchema} (${obrigatorios.length} campos obrigatórios)`);
  return 0;
}

process.exit(main());
