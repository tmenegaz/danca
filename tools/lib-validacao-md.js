'use strict';

/**
 * lib-validacao-md.js — A VALIDAÇÃO DE UM DOCUMENTO EXTRAÍDO. Definição ÚNICA.
 *
 * Nasceu do mesmo risco que a `lib-extracao-md.js` fechou: o laço de validação — campos
 * obrigatórios, tipos, subcampos, os avisos da regra de tabela e os provisórios `[Preencher]`
 * — estava DUPLICADO nos dois validadores (`validar-po-ciclo.js` e `validar-plano-ciclo.js`),
 * e duas cópias divergem na primeira regra nova. É a mesma classe de erro do `lib-fontes.sh`.
 *
 * O QUE ELE VALIDA, e contra quê:
 *   · `schema.required`        → campo obrigatório AUSENTE é erro;
 *   · `properties[x].type`     → tipo errado é erro (aceita `type: ['string','object']`);
 *   · objeto com `required`    → subcampo ausente, ou de tipo errado, é erro;
 *   · array vazio              → erro; a FRASE entre parênteses vem de `opcoes.arrayVazio`,
 *                                porque ela é do DOCUMENTO (o PO fala do recorte);
 *   · array de objetos         → item que não é objeto é AVISO (o documento pode estar em
 *                                transição entre prosa e tabela);
 *   · `[Preencher…]`           → provisório: o campo existe, a decisão é da pesquisadora;
 *   · `_algo`                  → METADADO, não campo do schema: nunca conta como extra.
 *
 * O QUE ELE DEVOLVE:
 *   { ok, erros, avisos, provisorios, lacunas, extras }
 *
 * `lacunas` (a convenção `_lacunas`, dos entregáveis que declaram o que não têm) sai em campo
 * PRÓPRIO, e não dentro de `avisos`: imprimir uma linha por lacuna é decisão do TOOL, e
 * mudaria a saída dele. Quem quiser a linha, usa a lista.
 */
const { tipoDe } = require('./lib-extracao-md.js');

function validar(campos, schema, opcoes = {}) {
  const erros = [];
  const avisos = [];
  const provisorios = [];
  const extras = [];
  const prefixoDeMetadado = opcoes.metadados === undefined ? '_' : opcoes.metadados;

  for (const nome of schema.required || []) {
    const prop = schema.properties[nome] || {};
    const valor = campos[nome];
    if (!(nome in campos) || valor === undefined) {
      erros.push(`campo ausente: ${nome}`);
      continue;
    }
    const tipos = Array.isArray(prop.type) ? prop.type : [prop.type];
    if (prop.type && !tipos.includes(tipoDe(valor))) {
      erros.push(`campo ${nome}: esperado ${tipos.join(' ou ')}, encontrado ${tipoDe(valor)}`);
      continue;
    }
    if (prop.type === 'object') {
      for (const sub of prop.required || []) {
        const esperadoSub = ((prop.properties || {})[sub] || {}).type;
        if (valor[sub] === undefined) {
          erros.push(`campo ausente: ${nome}.${sub}`);
        } else if (esperadoSub && tipoDe(valor[sub]) !== esperadoSub) {
          erros.push(`campo ${nome}.${sub}: esperado ${esperadoSub}, encontrado ${tipoDe(valor[sub])}`);
        }
      }
    }
    if (prop.type === 'array' && valor.length === 0) {
      erros.push(`campo ${nome}: array vazio${opcoes.arrayVazio ? ` (${opcoes.arrayVazio})` : ''}`);
    }
    if (prop.type === 'array' && (prop.items || {}).type === 'object') {
      const fora = valor.filter((x) => !x || typeof x !== 'object' || Array.isArray(x)).length;
      if (fora) {
        avisos.push(`campo ${nome}: ${fora} de ${valor.length} item(ns) não são objeto`
          + ' — a tabela do contrato produz objetos; o que não é tabela entra como texto');
      }
    }
  }

  // os provisórios: campos que existem, mas cuja decisão ainda é da pesquisadora
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

  // as lacunas DECLARADAS (a convenção `_lacunas`) e o que o schema não declara
  const lacunas = Array.isArray(campos._lacunas) ? campos._lacunas : [];
  Object.keys(campos).forEach((k) => {
    if (prefixoDeMetadado && k.startsWith(prefixoDeMetadado)) return;
    if (!(k in (schema.properties || {}))) extras.push(k);
  });

  return { ok: erros.length === 0, erros, avisos, provisorios, lacunas, extras };
}

module.exports = { validar };
