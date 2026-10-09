#!/usr/bin/env node
'use strict';

/**
 * validar.js — o validador mínimo do PE.
 *
 * Decide se um artefato respeita o seu contrato, com o subconjunto de JSON
 * Schema draft-07 que ESTE repositório usa — e nada além dele. Não é um
 * validador genérico e não pretende ser: é a menor máquina capaz de decidir se
 * o plano derivado e o envelope respeitam o que declaram.
 *
 * As 15 palavras-chave de VALIDAÇÃO, as 4 inertes e as 2 anotações de dado
 * foram medidas nos dois contratos (21 identificadores ao todo). Uma chave que
 * não esteja entre elas faz o validador RECUSAR o contrato em vez de a ignorar
 * em silêncio: ignorar o que não se sabe ler é aceitar em silêncio.
 *
 *   validação  $ref  additionalProperties  allOf  const  enum  if  items
 *              minItems  minimum  oneOf  pattern  properties  required  then
 *              type
 *   inertes    $schema  definitions  description  title
 *   dado       $comentario  $lastModified
 *
 * NÃO implementadas — e por isso recusadas se aparecerem: `anyOf`, `not`,
 * `else`, `format`, `default`, `$defs`, `patternProperties`, `propertyNames`,
 * `dependencies`, `maxItems`, `uniqueItems`, `maxLength`, `minLength`,
 * `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`, `examples`.
 *
 * Uso:
 *   node validar.js                 valida todos os contratos registrados
 *   node validar.js plano           valida só o contrato nomeado
 *   node validar.js --json          saída legível por máquina
 *   node validar.js --autoteste     prova que o validador decide
 */

// NÚCLEO AGNÓSTICO — sem `fs`, sem `path`, sem `http`, sem `process`. Este módulo
// só contém a LÓGICA pura do validador: recebe a instância e o esquema e decide.
// Quem lê os contratos do disco é o adaptador (motor/validar.js, o lado Node).

// ---------------------------------------------------------------------------
// O subconjunto coberto
// ---------------------------------------------------------------------------

const PALAVRAS_ATIVAS = new Set([
  '$ref',
  'additionalProperties',
  'allOf',
  'const',
  'enum',
  'if',
  'items',
  'minItems',
  'minimum',
  'oneOf',
  'pattern',
  'properties',
  'required',
  'then',
  'type',
]);

const PALAVRAS_INERTES = new Set([
  '$schema',
  'definitions',
  'description',
  'title',
  '$comentario',
  '$lastModified',
]);

const CONHECIDAS = new Set([...PALAVRAS_ATIVAS, ...PALAVRAS_INERTES]);

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function tipoDe(valor) {
  if (valor === null) return 'null';
  if (Array.isArray(valor)) return 'array';
  if (Number.isInteger(valor)) return 'integer';
  return typeof valor;
}

function casarTipo(valor, tipo) {
  if (tipo === 'integer') return Number.isInteger(valor);
  if (tipo === 'number') return typeof valor === 'number';
  return tipoDe(valor) === tipo;
}

function iguais(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((v, i) => iguais(v, b[i]));
  }
  if (typeof a === 'object') {
    const chavesA = Object.keys(a);
    const chavesB = Object.keys(b);
    if (chavesA.length !== chavesB.length) return false;
    return chavesA.every(
      (k) => Object.prototype.hasOwnProperty.call(b, k) && iguais(a[k], b[k])
    );
  }
  return false;
}

function resumir(valor) {
  const texto = JSON.stringify(valor);
  if (texto === undefined) return String(valor);
  return texto.length > 60 ? texto.slice(0, 57) + '...' : texto;
}

function resolverRef(raiz, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) {
    throw new Error('$ref não local, e este validador só resolve os locais: ' + String(ref));
  }
  const partes = ref.slice(2).split('/');
  let atual = raiz;
  for (const parte of partes) {
    const chave = parte.replace(/~1/g, '/').replace(/~0/g, '~');
    if (atual === null || typeof atual !== 'object' || !(chave in atual)) {
      throw new Error('$ref não resolvido: ' + ref);
    }
    atual = atual[chave];
  }
  return atual;
}

// ---------------------------------------------------------------------------
// O núcleo
// ---------------------------------------------------------------------------

/**
 * Valida `instancia` contra `esquema`, acumulando erros em `erros`.
 *
 * `raiz` é o documento do esquema inteiro, para o qual os `$ref` locais
 * apontam. `caminho` é a trilha da instância (`/destinos[0]/ramos[1]`), e é o
 * que torna um erro localizável em vez de apenas verdadeiro.
 */
function validar(instancia, esquema, raiz, caminho, erros) {
  if (esquema === undefined) return;

  if (typeof esquema !== 'object' || esquema === null || Array.isArray(esquema)) {
    throw new Error('esquema malformado em ' + (caminho || '(raiz)'));
  }

  for (const chave of Object.keys(esquema)) {
    if (!CONHECIDAS.has(chave)) {
      throw new Error(
        'palavra-chave não coberta pelo validador: `' +
          chave +
          '` em ' +
          (caminho || '(raiz)')
      );
    }
  }

  // draft-07: o `$ref` substitui o esquema irmão.
  if (typeof esquema.$ref === 'string') {
    validar(instancia, resolverRef(raiz, esquema.$ref), raiz, caminho, erros);
    return;
  }

  if (esquema.type !== undefined) {
    const tipos = Array.isArray(esquema.type) ? esquema.type : [esquema.type];
    if (!tipos.some((t) => casarTipo(instancia, t))) {
      erros.push({
        caminho,
        mensagem: 'esperado ' + tipos.join(' | ') + ', veio ' + tipoDe(instancia),
      });
      return;
    }
  }

  if (esquema.const !== undefined && !iguais(instancia, esquema.const)) {
    erros.push({
      caminho,
      mensagem: 'const: esperado ' + resumir(esquema.const) + ', veio ' + resumir(instancia),
    });
  }

  if (Array.isArray(esquema.enum) && !esquema.enum.some((v) => iguais(instancia, v))) {
    erros.push({
      caminho,
      mensagem:
        'enum: ' + resumir(instancia) + ' não está entre ' + resumir(esquema.enum),
    });
  }

  if (typeof instancia === 'string' && typeof esquema.pattern === 'string') {
    if (!new RegExp(esquema.pattern).test(instancia)) {
      erros.push({
        caminho,
        mensagem: 'pattern: ' + resumir(instancia) + ' não casa `' + esquema.pattern + '`',
      });
    }
  }

  if (
    typeof instancia === 'number' &&
    typeof esquema.minimum === 'number' &&
    instancia < esquema.minimum
  ) {
    erros.push({
      caminho,
      mensagem: 'minimum: ' + instancia + ' é menor que ' + esquema.minimum,
    });
  }

  if (Array.isArray(instancia)) {
    if (typeof esquema.minItems === 'number' && instancia.length < esquema.minItems) {
      erros.push({
        caminho,
        mensagem: 'minItems: ' + instancia.length + ' é menor que ' + esquema.minItems,
      });
    }
    if (esquema.items !== undefined) {
      const porIndice = Array.isArray(esquema.items) ? esquema.items : null;
      instancia.forEach((valor, i) => {
        const sub = porIndice ? porIndice[i] : esquema.items;
        if (sub !== undefined) validar(valor, sub, raiz, caminho + '[' + i + ']', erros);
      });
    }
  }

  if (typeof instancia === 'object' && instancia !== null && !Array.isArray(instancia)) {
    if (Array.isArray(esquema.required)) {
      for (const chave of esquema.required) {
        if (!Object.prototype.hasOwnProperty.call(instancia, chave)) {
          erros.push({ caminho, mensagem: 'required: falta `' + chave + '`' });
        }
      }
    }

    const propriedades =
      esquema.properties && typeof esquema.properties === 'object' ? esquema.properties : {};

    for (const chave of Object.keys(propriedades)) {
      if (Object.prototype.hasOwnProperty.call(instancia, chave)) {
        validar(instancia[chave], propriedades[chave], raiz, caminho + '/' + chave, erros);
      }
    }

    if (esquema.additionalProperties !== undefined) {
      const extras = Object.keys(instancia).filter(
        (k) => !Object.prototype.hasOwnProperty.call(propriedades, k)
      );
      if (esquema.additionalProperties === false) {
        for (const chave of extras) {
          erros.push({
            caminho,
            mensagem: 'additionalProperties: chave não declarada `' + chave + '`',
          });
        }
      } else if (
        typeof esquema.additionalProperties === 'object' &&
        esquema.additionalProperties !== null
      ) {
        for (const chave of extras) {
          validar(
            instancia[chave],
            esquema.additionalProperties,
            raiz,
            caminho + '/' + chave,
            erros
          );
        }
      }
    }
  }

  if (Array.isArray(esquema.allOf)) {
    esquema.allOf.forEach((sub, i) => {
      validar(instancia, sub, raiz, caminho, erros);
    });
  }

  if (Array.isArray(esquema.oneOf)) {
    const casaram = esquema.oneOf.filter((sub) => {
      const bolsa = [];
      validar(instancia, sub, raiz, caminho, bolsa);
      return bolsa.length === 0;
    });
    if (casaram.length !== 1) {
      erros.push({
        caminho,
        mensagem:
          'oneOf: ' + casaram.length + ' esquemas casaram, e exige-se exatamente 1',
      });
    }
  }

  if (esquema.if !== undefined) {
    const bolsa = [];
    validar(instancia, esquema.if, raiz, caminho, bolsa);
    if (bolsa.length === 0 && esquema.then !== undefined) {
      validar(instancia, esquema.then, raiz, caminho, erros);
    }
  }
}

/** Valida e devolve a lista de erros. Nunca lança por invalidez. */
function validarCom(instancia, esquema) {
  const erros = [];
  validar(instancia, esquema, esquema, '', erros);
  return erros;
}
// ---------------------------------------------------------------------------
// A exportação do NÚCLEO: só lógica pura. RAIZ/CONTRATOS e a CLI (ler do disco,
// autoteste, principal) ficam no adaptador — motor/validar.js.
// ---------------------------------------------------------------------------

module.exports = {
  PALAVRAS_ATIVAS,
  PALAVRAS_INERTES,
  tipoDe,
  iguais,
  resolverRef,
  validar,
  validarCom,
};
