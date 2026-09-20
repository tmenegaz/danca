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
 * com 1 imprimindo os problemas.
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

// O CONTRATO DE EXTRACAO vive em tools/lib-extracao-md.js -- definicao UNICA: o PO e o
// plano leem pelo MESMO contrato. Aqui fica o que e DESTE documento: o mapa das secoes
// (titulo em portugues -> campo do schema) e a validacao contra o schema.
const { extrair, lerYamlCabecalho, tipoDe } = require('./lib-extracao-md.js');

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
  const { campos, avisos } = extrair(linhas, schema, MAPA_SECOES);
  const problemas = [];

  for (const obrigatorio of schema.required) {
    const prop = schema.properties[obrigatorio] || {};
    if (!(obrigatorio in campos) || campos[obrigatorio] === undefined) {
      problemas.push(`campo ausente: ${obrigatorio}`);
      continue;
    }
    const valor = campos[obrigatorio];
    if (prop.type && tipoDe(valor) !== prop.type) {
      problemas.push(`campo ${obrigatorio}: esperado ${prop.type}, encontrado ${tipoDe(valor)}`);
      continue;
    }
    if (prop.type === 'object') {
      for (const nome of prop.required || []) {
        const esperadoSub = ((prop.properties || {})[nome] || {}).type;
        if (valor[nome] === undefined) {
          problemas.push(`campo ausente: ${obrigatorio}.${nome}`);
        } else if (esperadoSub && tipoDe(valor[nome]) !== esperadoSub) {
          problemas.push(`campo ${obrigatorio}.${nome}: esperado ${esperadoSub},`
            + ` encontrado ${tipoDe(valor[nome])}`);
        }
      }
    }
    if (prop.type === 'array' && valor.length === 0) {
      problemas.push(`campo ${obrigatorio}: array vazio (o recorte precisa de ao menos um item)`);
    }
    // A REGRA DE TABELA ENTREGA OBJETOS quando o schema declara `items.type: 'object'`. O
    // que não for objeto é DECLARADO em um aviso por campo (com a contagem), e não reprova:
    // o documento pode estar em transição, e a contagem é o que faz o desvio aparecer.
    if (prop.type === 'array' && (prop.items || {}).type === 'object') {
      const fora = valor.filter((x) => !x || typeof x !== 'object' || Array.isArray(x)).length;
      if (fora) {
        avisos.push(`campo ${obrigatorio}: ${fora} de ${valor.length} item(ns) não são objeto`
          + ' — a tabela do contrato produz objetos; o que não é tabela entra como texto');
      }
    }
  }

  // campos que existem, mas cuja decisão ainda é da pesquisadora
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

  const pendentes = Object.entries(campos.validationChecklist || {})
    .filter(([, marcado]) => marcado !== true).map(([k]) => k);

  if (json) {
    process.stdout.write(`${JSON.stringify(campos, null, 2)}\n`);
  }
  const escrever = json ? (...a) => console.error(...a) : (...a) => console.log(...a);

  if (problemas.length) {
    console.error(`PO ${path.basename(caminhoPo)} × schema ${path.basename(caminhoSchema)}`);
    console.error(`${problemas.length} problema(s):`);
    for (const p of problemas) console.error(`  - ${p}`);
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

