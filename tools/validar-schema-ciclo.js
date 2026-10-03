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
 * Extra: quando o schema declara `pattern`, o valor também é conferido — em
 * QUALQUER campo declarado com ele, obrigatório ou opcional. `required` governa
 * presença; `pattern` governa forma. Sem dependências externas.
 *
 * Extra: quando o schema declara `if`/`then`/`else` — numa entrada de `allOf`
 * ou na raiz —, a condição é avaliada contra o conjunto de campos do `.conf` e o
 * ramo que casar passa a exigir os seus `required` e a conferir os seus
 * `pattern`. É o que permite dizer "a escola desabilitada PRECISA declarar por
 * que e desde quando" sem tornar esses campos obrigatórios para a escola que
 * está habilitada. Sem o campo da condição, o ramo não se aplica — e o opcional
 * continua opcional.
 *
 * Sai com 0 se todos os campos obrigatórios estão presentes e todo campo com
 * `pattern` (quando presente) bate o padrão; com 1 se algo falta ou está torto.
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

// Campos que a condição menciona — os discriminantes do ramo.
function discriminantes(condicao) {
  if (!condicao || typeof condicao !== 'object') return [];
  const mencionados = new Set(Array.isArray(condicao.required) ? condicao.required : []);
  for (const campo of Object.keys(condicao.properties || {})) mencionados.add(campo);
  return [...mencionados];
}

// Avalia o `if` de um campo condicional contra os campos presentes: casa quando
// TODO campo que ele menciona existe e bate — `const` (igualdade exata) ou
// `pattern` (forma). `if` sem campo mencionado casa vacuamente.
//
// Quem decide o ramo é o chamador, em duas etapas, e a diferença importa:
//   · discriminante AUSENTE: nenhum ramo se aplica, e o opcional segue opcional
//     (quem não declarou o valor não entra no contrato condicional);
//   · discriminante presente que não casa: é o caso do `else`.
function condicaoCasa(condicao, campos) {
  const props = (condicao && condicao.properties) || {};
  for (const [campo, def] of Object.entries(props)) {
    if (!(campo in campos)) return false;
    if (def && 'const' in def && campos[campo] !== String(def.const)) return false;
    if (def && def.pattern && !new RegExp(def.pattern).test(campos[campo])) return false;
  }
  return true;
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

  // Forma: todo campo declarado com `pattern` é conferido quando PRESENTE —
  // inclusive os opcionais. `required` responde "existe?"; `pattern` responde
  // "está no formato?". Amarrar o padrão ao `required` deixaria um campo
  // opcional passar com qualquer valor, que é o oposto de uma checagem.
  const padroes = Object.entries(propriedades)
    .filter(([, def]) => def && def.pattern)
    .map(([campo, def]) => [campo, def.pattern]);

  // Condicional: o ramo que casar acrescenta ao contrato — os `required` dele
  // passam a faltar quando ausentes, e os `pattern` dele entram na conferência
  // de forma. É o que exige "por que" e "desde quando" de quem se declara
  // desabilitado, sem exigir isso de quem está habilitado.
  //
  // A condição é lida onde o JSON Schema draft-07 a declara — no nível do
  // OBJETO, não dentro de `properties.X`: numa entrada de `allOf` (a forma que
  // `experimentos/pe/ramificacao/ramificacao-schema.json` já usa) ou na raiz do
  // schema. `if` sobre uma string não teria como carregar `required`/`pattern`.
  //
  // O ramo se escolhe em DUAS etapas: primeiro se a condição se APLICA (algum
  // discriminante declarado?), depois qual ramo cabe. Sem a primeira etapa, o
  // `else` seria aplicado mesmo quando o `if` casa.
  const condicoes = (Array.isArray(schema.allOf) ? schema.allOf : [])
    .filter((e) => e && typeof e === 'object');
  if (schema.if) condicoes.push(schema);

  const porCausa = [];
  for (const entrada of condicoes) {
    const condicao = entrada.if;
    const quando = entrada.then;
    const senao = entrada.else;
    if (!quando && !senao) continue;

    const disc = discriminantes(condicao);
    const seAplica = disc.length === 0 || disc.some((c) => c in campos);
    if (!seAplica) continue;

    const ramo = condicaoCasa(condicao, campos) ? ['then', quando] : ['else', senao];
    const exigencia = ramo[1];
    if (!exigencia || typeof exigencia !== 'object') continue;

    const exigidos = Array.isArray(exigencia.required) ? exigencia.required : [];
    faltando.push(...exigidos.filter((c) => !(c in campos)));
    for (const [alvo, sub] of Object.entries(exigencia.properties || {})) {
      if (sub && sub.pattern) padroes.push([alvo, sub.pattern]);
    }
    if (exigidos.length) {
      porCausa.push(`ramo "${ramo[0]}": exige ${exigidos.join(', ')}`);
    }
  }

  const fora = [];
  for (const [campo, padrao] of padroes) {
    if (!(campo in campos)) continue;
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
    for (const c of porCausa) { console.error(`  (${c})`); }
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
