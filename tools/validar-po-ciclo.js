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
  'linha de base': 'linhaDeBase',
  'critérios de inclusão': 'inclusionCriteria',
  'criterios de inclusao': 'inclusionCriteria',
  'critérios de exclusão': 'exclusionCriteria',
  'justificativa': 'justification',
  'condições de contorno da execução': 'condicoesDeContorno',
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

// ----------------------------------------------------- a REGRA DE TABELA (2026-09-20)
/**
 * A regra que faltava ao contrato: uma tabela cujo bloco tem campo ARRAY no schema vira um
 * ARRAY DE OBJETOS — uma linha de dados por objeto, o cabeçalho como chaves.
 *
 * Sem ela, cada linha virava UMA string (`célula · célula`), e os blocos que o guia de
 * observação consome — marcos por aula, rubrica, distribuição do volume, linha de base —
 * saíam inutilizáveis: era por isso que a `linhaDeBase` do experimento teve de ser
 * estruturada à mão.
 *
 * Cuidados declarados (todos com motivo):
 *   · a linha de separação (`:---`, `:---:`, `---`) é IGNORADA — inclusive fora da regra,
 *     porque ela vazava para o texto dos campos string (o teste antigo removia `:`, `-` e
 *     espaço e depois casava `^-+$`, o que nunca casa: `:-- · :--` entrava no valor);
 *   · `\|` dentro da célula é escape: não divide a célula, e volta a `|` no valor;
 *   · cabeçalho em **negrito** vira chave sem os asteriscos;
 *   · a chave é um IDENTIFICADOR — acento fora, não-alfanumérico vira fronteira, camelCase
 *     (`Dimensão` → `dimensao`, `Em desenvolvimento` → `emDesenvolvimento`);
 *   · a ênfase sai também do VALOR: o JSON não carrega marcação de markdown;
 *   · a célula vazia mantém a POSIÇÃO (não desloca coluna) — o filtro de células vazias
 *     do caminho antigo alinhava mal as linhas com buraco no meio;
 *   · só a PRIMEIRA tabela do bloco entra no campo: uma segunda tabela no mesmo bloco gera
 *     AVISO e fica de fora — o contrato não escolhe qual das duas é o campo, o documento
 *     precisa dar a cada tabela o seu bloco.
 */
const celulasDaLinha = (linha) => {
  const partes = [];
  let atual = '';
  for (let i = 0; i < linha.length; i++) {
    if (linha[i] === '\\' && linha[i + 1] === '|') { atual += '\u0001'; i++; continue; }
    if (linha[i] === '|') { partes.push(atual); atual = ''; continue; }
    atual += linha[i];
  }
  partes.push(atual);
  if (partes.length && partes[0].trim() === '') partes.shift();
  if (partes.length && partes[partes.length - 1].trim() === '') partes.pop();
  return partes.map((c) => c.trim());
};

const semEnfase = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1');
const textoDaCelula = (s) => semEnfase(s).replace(/\u0001/g, '|').trim();
const chaveDaColuna = (s) => {
  const palavras = textoDaCelula(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ').trim().split(' ');
  if (!palavras[0]) return '';
  return palavras[0].toLowerCase() + palavras.slice(1)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
};
const ehSeparador = (celulas) =>
  celulas.length > 0 && celulas.every((c) => /^:?-+:?$/.test(c));

// Extrai os campos observacionais do Markdown, respeitando o TIPO que o schema
// espera para cada seção: em campo string, itens de lista e tabelas fazem parte do
// texto (o spec diz "o texto da seção"); em campo array, cada item é um elemento —
// e uma TABELA é o array de objetos (a regra de 2026-09-20, acima).
function extrair(linhas, schema) {
  const campos = {};
  const texto = {};
  const avisos = [];
  let secao = null;
  let subcampo = null;

  const tipo = (campo) => (schema.properties[campo] || {}).type;
  const tipoSub = (campo, sub) =>
    (((schema.properties[campo] || {}).properties || {})[sub] || {}).type;
  const ehArray = (campo, sub) => (sub ? tipoSub(campo, sub) : tipo(campo)) === 'array';
  const campoDoBlocoEhArray = () => !!secao && ehArray(secao, subcampo);

  // a tabela do bloco em construção — o buffer que a regra de tabela usa
  let tabela = null;
  const blocosComTabela = new Set();

  const despejarTabela = () => {
    if (!tabela) return;
    const t = tabela;
    tabela = null;
    if (!t.cabecalho.some(Boolean)) return;          // tabela sem cabeçalho: não há chave
    const chave = t.subcampo ? `${t.secao}.${t.subcampo}` : t.secao;
    if (blocosComTabela.has(chave)) {
      avisos.push(`bloco '${chave}': as ${t.linhas.length} linha(s) de uma SEGUNDA tabela`
        + ' ficaram de fora — o contrato lê uma tabela por bloco (dê à tabela o seu bloco)');
      return;
    }
    blocosComTabela.add(chave);
    const objetos = t.linhas.map((linha) => {
      const o = {};
      t.cabecalho.forEach((k, i) => { if (k) o[k] = textoDaCelula(linha[i] || ''); });
      return o;
    });
    if (t.subcampo) {
      if (!campos[t.secao] || typeof campos[t.secao] !== 'object') campos[t.secao] = {};
      campos[t.secao][t.subcampo] = (campos[t.secao][t.subcampo] || []).concat(objetos);
    } else {
      if (!Array.isArray(campos[t.secao])) campos[t.secao] = [];
      objetos.forEach((o) => campos[t.secao].push(o));
    }
  };

  for (const linha of linhas) {
    const limpa = linha.trim();

    // --- a tabela do bloco (regra de 2026-09-20): quando o campo do bloco é ARRAY, a
    // tabela É o array — as linhas ficam em buffer e saem como objetos quando a tabela
    // (ou o bloco) termina. Fora disso, a linha de tabela segue o caminho antigo (texto).
    if (limpa.startsWith('|') && !tabela && campoDoBlocoEhArray()) {
      const celulas = celulasDaLinha(limpa);
      if (!ehSeparador(celulas)) {
        tabela = { secao, subcampo, cabecalho: celulas.map(chaveDaColuna), linhas: [] };
        continue;
      }
    }
    if (tabela && limpa.startsWith('|')) {
      const celulas = celulasDaLinha(limpa);
      if (!ehSeparador(celulas)) tabela.linhas.push(celulas);
      continue;
    }
    if (tabela) despejarTabela();        // o bloco terminou: a tabela fecha

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

    // onde este trecho entra: no subcampo (se houver) ou na seção
    const acumular = (trecho) => {
      if (subcampo) {
        if (tipoSub(secao, subcampo) === 'boolean') return;
        if (!campos[secao] || typeof campos[secao] !== 'object') campos[secao] = {};
        const chave = `${secao}.${subcampo}`;
        texto[chave] = ((texto[chave] || '') + ' ' + trecho).trim();
        campos[secao][subcampo] = texto[chave];
      } else if (tipo(secao) === 'string') {
        texto[secao] = ((texto[secao] || '') + ' ' + trecho).trim();
        campos[secao] = texto[secao];
      }
    };
    const paraArray = (trecho) => {
      if (subcampo) return;                       // array dentro de subcampo não existe neste schema
      if (tipo(secao) !== 'array') return;
      if (!Array.isArray(campos[secao])) campos[secao] = [];
      campos[secao].push(trecho);
    };

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
      if (subcampo) acumular(item[1]); else { paraArray(item[1]); acumular(item[1]); }
      continue;
    }

    // linha de tabela (bloco cujo campo é string: a tabela faz parte do TEXTO)
    if (limpa.startsWith('|')) {
      // a linha de separação (`:---`) NÃO é conteúdo — ver a regra de tabela, acima
      if (ehSeparador(celulasDaLinha(limpa))) continue;
      const celulas = limpa.replace(/^\|/, '').replace(/\|$/, '')
        .split('|').map((c) => c.trim()).filter(Boolean).join(' · ');
      if (!celulas) continue;
      if (subcampo) acumular(celulas); else { paraArray(celulas); acumular(celulas); }
      continue;
    }

    // texto corrido
    if (subcampo) {
      acumular(limpa);
    } else {
      paraArray(limpa);
      acumular(limpa);
    }
  }
  despejarTabela();          // a última tabela do documento
  return { campos, avisos };
}

function tipoDe(v) {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  return typeof v;
}

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
  const { campos, avisos } = extrair(linhas, schema);
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

