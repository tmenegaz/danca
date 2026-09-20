#!/usr/bin/env node
'use strict';

/*
 * validar-plano-ciclo.js — valida o PLANO de um ciclo (Regra 10, camada 1).
 *
 *   uso: node tools/validar-plano-ciclo.js <schema.json> <ciclo-XX-plano.md> [--json]
 *
 * Irmão do validar-po-ciclo.js: a EXTRAÇÃO é do MESMO contrato compartilhado
 * (tools/lib-extracao-md.js) — `## Seção → campo`, `### Subcampo → subcampo`, `- item →
 * array`, tabela → array de objetos (ou OBJETO, quando o bloco é item/valor). O que é DESTE
 * documento é a DECLARAÇÃO (o mapa das seções, o das colunas e os blocos item/valor) e a
 * validação contra o schema do plano.
 *
 * AS LACUNAS SÃO DECLARADAS. O plano não tem tudo o que a referência do experimento tem, e o
 * que falta ou é PROSA ou é do .conf: o extrator não adivinha — declara `[Preencher: …]`, no
 * campo quando o tipo o permite, e em `_lacunas` quando o campo é um array (não há onde
 * pendurar a chave). É a mesma regra dos outros entregáveis: o que não existe na fonte sai
 * declarado, nunca inventado.
 *
 * Sai com 0 se os campos obrigatórios existem e têm o tipo correto; com 1 imprimindo os
 * problemas.
 */

const fs = require('fs');
const path = require('path');
const { extrair, lerYamlCabecalho, tipoDe } = require('./lib-extracao-md.js');

// Títulos em português do documento → propriedades do schema. As CHAVES do mapa são o título
// em minúsculas: é assim que o contrato normaliza o `## Seção` para procurar.
const MAPA_SECOES = {
  'objetivo geral': 'objetivoGeral',
  'marcos parciais por aula': 'marcosPorAula',
  'estrutura de cada aula': 'estruturaDeCadaAula',
  'distribuição do volume pelos blocos (regra 9, etapa 2)': 'distribuicaoDeVolume',
  'rubrica de avaliação final': 'rubrica',
  'registro de proveniência': 'proveniencia',
  'calendário do ciclo': 'calendario',
};

// O mapa das COLUNAS: chave derivada (cabeçalho da tabela, ou rótulo do par) → chave do alvo.
const MAPA_COLUNAS = {
  // a tabela de identificação do ciclo (no bloco `Objetivo geral`, que a declaração manda
  // para `ciclo` — ver PARES)
  duracao: 'duracaoAulas',
  duracaoDeCadaAula: 'duracaoMinutos',
  dataDeInicio: 'inicio',
  encerramentoPrevisto: 'encerramento',
  // os marcos parciais
  aula: 'n',
  objetivoEspecificoMarcoParcial: 'marco',
};

// Os blocos cuja tabela é ITEM/VALOR. No plano, a identificação do ciclo está sob "Objetivo
// geral" — o mesmo bloco tem a prosa (objetivoGeral) e a tabela (ciclo).
const PARES = { objetivoGeral: 'ciclo' };

const DECLARACAO = { secoes: MAPA_SECOES, colunas: MAPA_COLUNAS, pares: PARES };

// AS LACUNAS DECLARADAS — o que o documento não tem em forma de dado. O motivo vai escrito:
// quem lê o `[Preencher]` sabe de quem é a decisão (e de que a conversão não foi feita, não
// que o dado não exista no documento).
const LACUNAS = {
  calendario: 'o calendário não está no .md — o gerador injeta o bloco calculado do .conf da '
    + 'variante (Regra 10, camada 2)',
  'rubrica.aplicadaEm': 'leitura de prosa não implementada — o documento diz "Aplicada na Aula '
    + '11 (formativa) e na Aula 12 (somativa)"',
};

/**
 * Aplica as lacunas declaradas. Onde o caminho pode hospedar a chave (o pai é um objeto), ela
 * entra no campo; onde não pode (o pai é um array, ou não existe), a lacuna vai para
 * `_lacunas` — declarada, fora da forma que não a comporta.
 */
function aplicarLacunas(campos) {
  const semLugar = [];
  Object.entries(LACUNAS).forEach(([caminho, motivo]) => {
    const partes = caminho.split('.');
    const folha = partes.pop();
    let alvo = campos;
    for (const p of partes) {
      if (!alvo[p] || typeof alvo[p] !== 'object' || Array.isArray(alvo[p])) { alvo = null; break; }
      alvo = alvo[p];
    }
    if (!alvo) semLugar.push({ campo: caminho, declara: `[Preencher: ${motivo}]` });
    else if (alvo[folha] === undefined) alvo[folha] = `[Preencher: ${motivo}]`;
  });
  return semLugar;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const [caminhoSchema, caminhoPlano] = args.filter((a) => !a.startsWith('--'));
  if (!caminhoSchema || !caminhoPlano) {
    console.error('uso: node tools/validar-plano-ciclo.js <schema.json> <ciclo-XX-plano.md> [--json]');
    return 2;
  }

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(caminhoSchema, 'utf8'));
  } catch (e) {
    console.error(`erro: não consegui ler o schema ${caminhoSchema} (${e.message})`);
    return 1;
  }
  if (!Array.isArray(schema.required)) {
    console.error(`erro: o schema ${path.basename(caminhoSchema)} não declara 'required'`);
    return 1;
  }

  let linhas;
  try {
    linhas = fs.readFileSync(caminhoPlano, 'utf8').split('\n');
  } catch (e) {
    console.error(`erro: não consegui ler ${caminhoPlano} (${e.message})`);
    return 1;
  }

  const meta = lerYamlCabecalho(linhas);
  const { campos, avisos } = extrair(linhas, schema, DECLARACAO);
  const lacunasSemLugar = aplicarLacunas(campos);
  if (lacunasSemLugar.length) campos._lacunas = lacunasSemLugar;

  const problemas = [];
  for (const obrigatorio of schema.required) {
    const prop = schema.properties[obrigatorio] || {};
    const valor = campos[obrigatorio];
    if (!(obrigatorio in campos) || valor === undefined) {
      problemas.push(`campo ausente: ${obrigatorio}`);
      continue;
    }
    const tipos = Array.isArray(prop.type) ? prop.type : [prop.type];
    if (prop.type && !tipos.includes(tipoDe(valor))) {
      problemas.push(`campo ${obrigatorio}: esperado ${tipos.join(' ou ')}, encontrado ${tipoDe(valor)}`);
      continue;
    }
    if (prop.type === 'object') {
      for (const nome of prop.required || []) {
        if (valor[nome] === undefined) problemas.push(`campo ausente: ${obrigatorio}.${nome}`);
      }
    }
    if (prop.type === 'array' && valor.length === 0) {
      problemas.push(`campo ${obrigatorio}: array vazio`);
    }
    if (prop.type === 'array' && (prop.items || {}).type === 'object') {
      const fora = valor.filter((x) => !x || typeof x !== 'object' || Array.isArray(x)).length;
      if (fora) {
        avisos.push(`campo ${obrigatorio}: ${fora} de ${valor.length} item(ns) não são objeto`
          + ' — a tabela do contrato produz objetos; o que não é tabela entra como texto');
      }
    }
  }

  // os provisórios: campos que existem, mas cuja decisão é da pesquisadora ou do gerador
  const provisorios = [];
  const coletar = (prefixo, v) => {
    if (typeof v === 'string') {
      if (v.includes('[Preencher')) provisorios.push(prefixo);
    } else if (Array.isArray(v)) {
      v.forEach((x, i) => coletar(`${prefixo}[${i}]`, x));
    } else if (v && typeof v === 'object') {
      Object.entries(v).forEach(([k, x]) => coletar(`${prefixo}.${k}`, x));
    }
  };
  Object.entries(campos).forEach(([k, v]) => coletar(k, v));

  if (json) {
    process.stdout.write(`${JSON.stringify(campos, null, 2)}\n`);
  }
  const escrever = json ? (...a) => console.error(...a) : (...a) => console.log(...a);

  if (problemas.length) {
    console.error(`plano ${path.basename(caminhoPlano)} × schema ${path.basename(caminhoSchema)}`);
    console.error(`${problemas.length} problema(s):`);
    for (const p of problemas) console.error(`  - ${p}`);
    return 1;
  }

  escrever(`ok: ${path.basename(caminhoPlano)} satisfaz ${path.basename(caminhoSchema)}`
    + ` (${schema.required.length} campos obrigatórios)`);
  escrever(`    campos extraídos: ${Object.keys(campos).length} · estado declarado: `
    + `${meta.state || '(sem state no cabeçalho)'}`);
  if (provisorios.length) {
    escrever(`    provisórios '[Preencher]': ${provisorios.length} —`
      + ' decisão da pesquisadora, ou do gerador (o calendário)');
  }
  if (avisos.length) {
    escrever(`    avisos: ${avisos.length}`);
    avisos.forEach((a) => escrever(`      · ${a}`));
  }
  return 0;
}

process.exit(main());
