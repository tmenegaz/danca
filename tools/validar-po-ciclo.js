#!/usr/bin/env node
'use strict';

/*
 * validar-po-ciclo.js — valida o Plano de Observação (PO) de um ciclo.
 *
 *   uso: node tools/validar-po-ciclo.js <schema.json> <ciclo-XX-po.md>
 *
 * O PO é Markdown, então este script extrai os campos e valida o resultado contra
 * o schema (draft-07) do PO:
 *
 *   · cabeçalho YAML  → `state` e demais chaves (parse manual, sem dependências);
 *   · `## Seção`      → um campo do schema (título em português → propriedade);
 *   · `### Subcampo`  → subcampo de um objeto (título já em camelCase);
 *   · linhas `- item` → elemento de array; `- [ ]` / `- [x]` → booleano;
 *   · texto corrido   → valor de um campo string.
 *
 * Contrato: `[Preencher]` é aceito como valor provisório de qualquer campo string
 * (o campo existe, a decisão da pesquisadora ainda não), mas campo AUSENTE é erro.
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
  'critérios de inclusão': 'inclusionCriteria',
  'criterios de inclusao': 'inclusionCriteria',
  'critérios de exclusão': 'exclusionCriteria',
  'justificativa': 'justification',
  'limitações': 'limitations',
  'checklist de validação': 'validationChecklist',
};

const normalizar = (s) => s.trim().toLowerCase();

function lerYamlCabecalho(linhas) {
  const meta = {};
  if (linhas[0] && linhas[0].trim() === '---') {
    for (let i = 1; i < linhas.length; i++) {
      if (linhas[i].trim() === '---') break;
      const m = linhas[i].match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      meta[m[1]] = v;
    }
  }
  return meta;
}

// Extrai os campos observacionais do Markdown, respeitando o TIPO que o schema
// espera para cada seção: em campo string, itens de lista e tabelas fazem parte do
// texto (o spec diz "o texto da seção"); em campo array, cada item é um elemento.
function extrair(linhas, schema) {
  const campos = {};
  const texto = {};
  let secao = null;
  let subcampo = null;

  const tipo = (campo) => (schema.properties[campo] || {}).type;
  const tipoSub = (campo, sub) =>
    (((schema.properties[campo] || {}).properties || {})[sub] || {}).type;

  for (const linha of linhas) {
    const limpa = linha.trim();

    const h2 = limpa.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      secao = MAPA_SECOES[normalizar(h2[1])] || null;
      subcampo = null;
      if (secao && !(secao in campos)) campos[secao] = undefined;
      continue;
    }

    const h3 = limpa.match(/^###\s+(\S+)\s*$/);
    if (h3) { subcampo = h3[1]; continue; }

    if (!secao) continue;

    // comentários e vazios não entram em nenhum valor
    if (limpa === '' || limpa === '---' || limpa.startsWith('>')) continue;

    // `- [ ]` / `- [x]` → booleano (checklist)
    const checkbox = limpa.match(/^-\s*\[( |x|X)\]\s*(.*)$/);
    if (checkbox) {
      if (!campos[secao] || typeof campos[secao] !== 'object') campos[secao] = {};
      const chave = subcampo || 'item';
      campos[secao][chave] = /x/i.test(checkbox[1]);
      continue;
    }

    const item = limpa.match(/^[-*]\s+(.+)$/);
    if (item) {
      const alvo = tipo(secao);
      if (alvo === 'array') {
        if (!Array.isArray(campos[secao])) campos[secao] = [];
        campos[secao].push(item[1]);
      } else if (alvo === 'string') {
        texto[secao] = ((texto[secao] || '') + ' ' + item[1]).trim();
        campos[secao] = texto[secao];
      }
      continue;
    }

    // linha de tabela: em campo string faz parte do texto; em array, é item
    if (limpa.startsWith('|')) {
      const celulas = limpa.replace(/^\|/, '').replace(/\|$/, '')
        .split('|').map((c) => c.trim()).filter(Boolean).join(' · ');
      if (!celulas || /^-+$/.test(celulas.replace(/[:\- ]/g, ''))) continue;
      if (tipo(secao) === 'array') {
        if (!Array.isArray(campos[secao])) campos[secao] = [];
        campos[secao].push(celulas);
      } else {
        texto[secao] = ((texto[secao] || '') + ' ' + celulas).trim();
        campos[secao] = texto[secao];
      }
      continue;
    }

    // texto corrido
    if (subcampo) {
      const chave = `${secao}.${subcampo}`;
      if (tipoSub(secao, subcampo) === 'boolean') continue;
      if (!campos[secao] || typeof campos[secao] !== 'object') campos[secao] = {};
      texto[chave] = ((texto[chave] || '') + ' ' + limpa).trim();
      campos[secao][subcampo] = texto[chave];
    } else if (tipo(secao) === 'array') {
      if (!Array.isArray(campos[secao])) campos[secao] = [];
      campos[secao].push(limpa);
    } else if (tipo(secao) === 'string') {
      texto[secao] = ((texto[secao] || '') + ' ' + limpa).trim();
      campos[secao] = texto[secao];
    }
  }
  return campos;
}

function tipoDe(v) {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  return typeof v;
}

function main() {
  const [caminhoSchema, caminhoPo] = process.argv.slice(2);
  if (!caminhoSchema || !caminhoPo) {
    console.error('uso: node tools/validar-po-ciclo.js <schema.json> <ciclo-XX-po.md>');
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
  const campos = extrair(linhas, schema);
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

  if (problemas.length) {
    console.error(`PO ${path.basename(caminhoPo)} × schema ${path.basename(caminhoSchema)}`);
    console.error(`${problemas.length} problema(s):`);
    for (const p of problemas) console.error(`  - ${p}`);
    return 1;
  }

  console.log(`ok: ${path.basename(caminhoPo)} satisfaz ${path.basename(caminhoSchema)}`
    + ` (${schema.required.length} campos de topo)`);
  console.log(`    estado declarado: ${meta.state || '(sem state no cabeçalho)'}`);
  if (provisorios.length) {
    console.log(`    provisórios '[Preencher]': ${provisorios.length} campo(s) —`
      + ' decisão da pesquisadora (aceitos pelo validador, mas o PO não está aprovado)');
  }
  if (pendentes.length) {
    console.log(`    checklist: ${pendentes.length} item(ns) sem marcar`
      + ' → o estado permanece Input_PO_Aguardando');
  }
  return 0;
}

process.exit(main());

