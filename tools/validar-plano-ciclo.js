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
 * erros.
 */

const fs = require('fs');
const path = require('path');
const { extrair, lerYamlCabecalho, avisosDeSecaoSoCitacao } = require('./lib-extracao-md.js');
const { validar } = require('./lib-validacao-md.js');

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
  const { campos, avisos: avisosDaExtracao, secoesSoCitacao } = extrair(linhas, schema, DECLARACAO);
  const lacunasSemLugar = aplicarLacunas(campos);
  if (lacunasSemLugar.length) campos._lacunas = lacunasSemLugar;

  // A VALIDAÇÃO É DA LIB (lib-validacao-md.js): obrigatórios, tipos, avisos da regra de
  // tabela e provisórios. As lacunas declaradas saem em `lacunas`, para o tool decidir.
  const { erros, avisos: avisosDaValidacao, provisorios } = validar(campos, schema, {});
  const avisos = [...avisosDaExtracao, ...avisosDaValidacao,
    ...avisosDeSecaoSoCitacao(secoesSoCitacao, linhas)];

  if (json) {
    process.stdout.write(`${JSON.stringify(campos, null, 2)}\n`);
  }
  const escrever = json ? (...a) => console.error(...a) : (...a) => console.log(...a);

  if (erros.length) {
    console.error(`plano ${path.basename(caminhoPlano)} × schema ${path.basename(caminhoSchema)}`);
    console.error(`${erros.length} problema(s):`);
    for (const p of erros) console.error(`  - ${p}`);
    // OS AVISOS SAEM TAMBÉM NO ERRO — é aqui que eles mais servem: uma seção cujo único
    // conteúdo é citação não gera o campo, e o erro diz só `campo ausente`. Sem esta linha,
    // a causa (`> nota`) ficava escondida atrás do sintoma.
    if (avisos.length) {
      console.error(`    aviso(s): ${avisos.length}`);
      for (const a of avisos) console.error(`      · ${a}`);
    }
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
