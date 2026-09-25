#!/usr/bin/env node
'use strict';

/*
 * validar-po-ciclo.js — valida o Plano de Observação (PO) de um ciclo.
 *
 *   uso: node tools/validar-po-ciclo.js <schema.json> <ciclo-XX-po.md> [--json]
 *
 * A EXTRAÇÃO é do contrato compartilhado (tools/lib-extracao-md.js) — o MESMO do plano:
 * `## Seção → campo`, `### Subcampo → subcampo`, `- item → array`, tabela → array de objetos
 * e `- [ ]`/`- [x]` → booleano. O que é DESTE documento é o mapa das seções (título em
 * português → campo do schema) e a validação:
 *
 *   · campo obrigatório AUSENTE é erro; `[Preencher…]` é aceito como provisório (o campo
 *     existe, a decisão da pesquisadora ainda não);
 *   · o tipo de cada campo vem do schema — e quando ele declara `items.type: 'object'`, um
 *     item que não é objeto sai em AVISO (o documento está em transição entre prosa e tabela);
 *   · `--json` despeja o objeto extraído no stdout (o resumo humano vai para o stderr).
 *
 * Sai com 0 se todos os campos obrigatórios existem e têm o tipo correto;
 * com 1 imprimindo os erros.
 */

const fs = require('fs');
const path = require('path');

// Títulos em português do documento → propriedades do schema
const MAPA_SECOES = {
  'pergunta': 'question',
  'fenômeno': 'phenomenon',
  'fenomeno': 'phenomenon',
  'campo empírico': 'field',
  'contexto': 'context',
  'sujeitos': 'subjects',
  'linha de base': 'linhaDeBase',
  'critérios de inclusão': 'inclusionCriteria',
  'criterios de inclusao': 'inclusionCriteria',
  'critérios de exclusão': 'exclusionCriteria',
  'justificativa': 'justification',
  'condições de contorno da execução': 'condicoesDeContorno',
  'limitações': 'limitations',
  'checklist de validação': 'validationChecklist',
};

// O mapa das COLUNAS (chave derivada → chave do alvo), para a linha de base: a tabela do PO é
// `| Dimensão | O que as alunas trazem | O que falta | O que já dominam |`, e sem o mapa as
// chaves sairiam `oQueAsAlunasTrazem`/`oQueFalta`/`oQueJaDominam`. Com ele, saem as chaves que
// o recorte usa — `trazem`, `falta`, `dominam` (é como o PO fala, e como o experimento
// estruturou à mão).
const MAPA_COLUNAS = {
  oQueAsAlunasTrazem: 'trazem',
  oQueFalta: 'falta',
  oQueJaDominam: 'dominam',
};

// A DECLARAÇÃO DO PO para o contrato compartilhado (tools/lib-extracao-md.js): o mapa das
// seções e o das colunas. O schema continua sendo o que diz o TIPO de cada campo.
const DECLARACAO = { secoes: MAPA_SECOES, colunas: MAPA_COLUNAS };

// O CONTRATO DE EXTRACAO vive em tools/lib-extracao-md.js -- definicao UNICA: o PO e o
// plano leem pelo MESMO contrato. Aqui fica o que e DESTE documento: o mapa das secoes
// (titulo em portugues -> campo do schema) e a validacao contra o schema.
const { extrair, lerYamlCabecalho, avisosDeSecaoSoCitacao } = require('./lib-extracao-md.js');
const { validar } = require('./lib-validacao-md.js');

function main() {
  const args = process.argv.slice(2);
  // `--json` despeja o OBJETO EXTRAÍDO no stdout (o extrator e o validador são o mesmo
  // código: o schema diz o que extrair, e o JSON é o que saiu). Com `--json`, o resumo
  // humano vai para o stderr, para o stdout ficar limpo para quem consome o JSON.
  const json = args.includes('--json');
  const [caminhoSchema, caminhoPo] = args.filter((a) => !a.startsWith('--'));
  if (!caminhoSchema || !caminhoPo) {
    console.error('uso: node tools/validar-po-ciclo.js <schema.json> <ciclo-XX-po.md> [--json]');
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
    linhas = fs.readFileSync(caminhoPo, 'utf8').split('\n');
  } catch (e) {
    console.error(`erro: não consegui ler ${caminhoPo} (${e.message})`);
    return 1;
  }

  const meta = lerYamlCabecalho(linhas);
  const { campos, avisos: avisosDaExtracao, secoesSoCitacao } = extrair(linhas, schema, DECLARACAO);
  // A VALIDAÇÃO É DA LIB (lib-validacao-md.js): obrigatórios, tipos, avisos da regra de
  // tabela e provisórios. As lacunas declaradas saem em `lacunas`, para o tool decidir.
  const { erros, avisos: avisosDaValidacao, provisorios } = validar(campos, schema,
    { arrayVazio: 'o recorte precisa de ao menos um item' });
  const avisos = [...avisosDaExtracao, ...avisosDaValidacao,
    ...avisosDeSecaoSoCitacao(secoesSoCitacao, linhas)];

  const pendentes = Object.entries(campos.validationChecklist || {})
    .filter(([, marcado]) => marcado !== true).map(([k]) => k);

  if (json) {
    process.stdout.write(`${JSON.stringify(campos, null, 2)}\n`);
  }
  const escrever = json ? (...a) => console.error(...a) : (...a) => console.log(...a);

  if (erros.length) {
    console.error(`PO ${path.basename(caminhoPo)} × schema ${path.basename(caminhoSchema)}`);
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

  escrever(`ok: ${path.basename(caminhoPo)} satisfaz ${path.basename(caminhoSchema)}`
    + ` (${schema.required.length} campos de topo)`);
  escrever(`    estado declarado: ${meta.state || '(sem state no cabeçalho)'}`);
  if (provisorios.length) {
    escrever(`    provisórios '[Preencher]': ${provisorios.length} campo(s) —`
      + ' decisão da pesquisadora (aceitos pelo validador, mas o PO não está aprovado)');
  }
  if (pendentes.length) {
    escrever(`    checklist: ${pendentes.length} item(ns) sem marcar`
      + ' → o estado permanece Input_PO_Aguardando');
  }
  if (avisos.length) {
    escrever(`    avisos: ${avisos.length}`);
    avisos.forEach((a) => escrever(`      · ${a}`));
  }
  return 0;
}

process.exit(main());

