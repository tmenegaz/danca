'use strict';

/*
 * provar-jsonc.js — o leitor de `.jsonc` aceita o que o `wrangler` aceita, e recusa o que ele
 * recusa (25/11/2026).
 *
 * A LIÇÃO QUE ORIGINOU ISTO. A criação da escola `breu` morreu no passo 8 de 10 com
 * `Expected double-quoted property name in JSON at position 628`. Uma vírgula a mais num
 * `wrangler.danca.jsonc` que o `wrangler` lia sem queixa nenhuma e que o `JSON.parse` dos nossos
 * utilitários recusava. O ficheiro era o mesmo; a gramática, não.
 *
 * O QUE SE MEDE AQUI, e as três são precisas:
 *
 *   1. o que o `wrangler` aceita e nós recusávamos — vírgula final em objeto e em lista,
 *      comentário de linha inteira, comentário no fim de uma linha com valor, e comentário de bloco;
 *   2. o que TEM de continuar a falhar — um ficheiro realmente inválido não pode passar a ser
 *      aceite a fingir de tolerante. Um leitor que aceita tudo não protege nada;
 *   3. a ARMADILHA — uma string que contém `,}` ou `//` é um valor legítimo e não pode ser
 *      cortada. É o que separa um scanner de um `replace`: com `/,(\s*[}\]])/g`, uma mensagem
 *      com uma vírgula antes de uma chaveta perdia o fim, em silêncio, e o valor passava a mentir.
 *
 * E o ficheiro a sério: o `wrangler.danca.jsonc` deste repositório é lido pela mesma função que o
 * `publicar-mapa-de-escolas` usa — o que falhou em produção é o primeiro caso de teste.
 *
 *   node experimentos/provar-jsonc.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const { lerJsonc, limpar } = require(path.join(RAIZ, 'tools/lib-jsonc.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

/** Um `.jsonc` temporário, para não depender do repositório em cada caso. */
const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'jsonc-'));
let n = 0;
const lerTexto = (texto) => {
  const arquivo = path.join(tmp, 'caso-' + (n += 1) + '.jsonc');
  fs.writeFileSync(arquivo, texto, 'utf8');
  return lerJsonc(arquivo);
};

console.log('A. O que o `wrangler` aceita e nós recusávamos');
{
  conferir('vírgula final num objeto', lerTexto('{"a":1,}').a === 1, null);
  conferir('vírgula final numa lista', JSON.stringify(lerTexto('{"a":[1,2,],}')) === '{"a":[1,2]}', null);
  conferir('vírgula final seguida de comentário de linha',
    lerTexto('{"a":1, // a última\n}').a === 1, null);
  conferir('vírgula final seguida de comentário de bloco',
    lerTexto('{"a":1, /* a última */ }').a === 1, null);
  conferir('comentário de linha inteira', lerTexto('// nota\n{"a":1}').a === 1, null);
  conferir('comentário no fim de uma linha com valor',
    lerTexto('{"a":1 // nota\n}').a === 1, null);
  conferir('comentário de bloco em várias linhas',
    lerTexto('/* nota\n   nota */\n{"a":1}').a === 1, null);
  conferir('o caso de produção: duas `var` removidas deixam vírgula pendurada',
    lerTexto('{"vars":{"A":"1","B":"2",\n\n  // nota longa\n  // mais nota\n},\n"triggers":{}}').vars.B === '2', null);
}

console.log('\nB. O que TEM de continuar a falhar');
{
  const deveFalhar = (texto) => {
    try { lerTexto(texto); return false; } catch { return true; }
  };
  conferir('uma chaveta a menos não passa a ser aceite', deveFalhar('{"a":1'), null);
  conferir('dois valores sem vírgula não passam a ser aceites', deveFalhar('{"a":1 "b":2}'), null);
  conferir('aspas simples NÃO são JSONC — o `wrangler` não as aceita', deveFalhar("{'a':1}"), null);
  conferir('chave sem aspas NÃO é JSONC', deveFalhar('{a:1}'), null);
  /* E o erro diz de QUE FICHEIRO fala: «position 628» sem dono foi a caçada de hoje. */
  let mensagem = '';
  try { lerTexto('{"a":1'); } catch (e) { mensagem = String(e.message || e); }
  conferir('…e o erro nomeia o ficheiro', /caso-\d+\.jsonc:/.test(mensagem), mensagem);
}

console.log('\nC. A armadilha: uma string é um valor, não é sintaxe');
{
  conferir('uma string com `,}` sobrevive inteira', lerTexto('{"a":"x,}"}').a === 'x,}', null);
  conferir('uma string com `, ]` sobrevive inteira', lerTexto('{"a":"x, ]"}').a === 'x, ]', null);
  conferir('uma string com `//` não é tratada como comentário',
    lerTexto('{"a":"https://lastro.padd.com.br"}').a === 'https://lastro.padd.com.br', null);
  conferir('uma string com `/*` não é tratada como comentário',
    lerTexto('{"a":"um /* isto */ nada"}').a === 'um /* isto */ nada', null);
  /* A MENSAGEM REAL DO PROJETO, com a vírgula antes da chaveta. Se o leitor fosse um `replace`,
   * este endereço perdia o fim e passava a apontar para outro sítio. */
  const endereco = 'Sistema Lastro <lastro@padd.com.br>, ';
  conferir('o remetente com vírgula e tudo, tal como está na configuração',
    lerTexto(JSON.stringify({ a: endereco })).a === endereco, endereco);
  conferir('aspas escapadas dentro de uma string não abrem uma string nova',
    lerTexto('{"a":"ele disse \\"oi\\", e saiu"}').a === 'ele disse "oi", e saiu', null);
}

console.log('\nD. O ficheiro a sério');
{
  const config = lerJsonc(path.join(RAIZ, 'wrangler.danca.jsonc'));
  conferir('o `wrangler.danca.jsonc` é lido pela mesma função que falhou em produção',
    config && config.name === 'danca', config && config.name);
  conferir('…e as `var` que restam chegam inteiras',
    Boolean(config.vars) && config.vars.HOST_PUBLICO === 'lastro.padd.com.br',
    config && config.vars);
  /* A CHAVE PIX NÃO ESTÁ AQUI, e é uma asserção, não uma nota: ela é um CPF, e um CPF no
   * repositório fica no histórico para sempre. Se alguém a escrever neste ficheiro, esta prova
   * reprova — é o único lugar em que o erro se apanha antes do commit. */
  const bruto = fs.readFileSync(path.join(RAIZ, 'wrangler.danca.jsonc'), 'utf8');
  conferir('…e não traz a chave Pix escrita (é segredo, não configuração)',
    !/PIX_CHAVE"\s*:/.test(bruto), null);
}

console.log('');
console.log(ko === 0 ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
  : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
process.exit(ko === 0 ? 0 : 1);
