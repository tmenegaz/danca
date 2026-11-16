'use strict';

/*
 * lib-jsonc.js — ler um `.jsonc` do jeito que o `wrangler` o lê (25/11/2026).
 *
 * PORQUE É QUE ISTO EXISTE. A criação da escola `breu` morreu no passo 8 de 10 — «Publicar o mapa
 * de escolas» — com `Expected double-quoted property name in JSON at position 628 (line 33 column
 * 3)`. A causa era uma vírgula a mais no `wrangler.danca.jsonc`, deixada por uma edição que
 * retirou as duas últimas `var` do bloco: o `wrangler` ACEITA a vírgula final (o deploy da raiz
 * passou, no mesmo commit), e o `JSON.parse` dos nossos dois utilitários NÃO. O mesmo ficheiro,
 * dois leitores, duas respostas.
 *
 * O CUSTO DE DISCORDAR É ASSIMÉTRICO. O `wrangler` era quem estava certo: a vírgula final é
 * legítima em JSONC, e o erro estava em nós. Mas o preço de o descobrir tarde é o pior possível —
 * a escola já tinha sido criada no Cloudflare, o scaffold já tinha sido montado, e o passo que
 * falhou é o penúltimo. O que se perde não é o passo: é a criação inteira, desfeita depois.
 *
 * O QUE SE ACEITA, e nem mais um pouco: comentários de linha (`//`), comentários de bloco
 * (`/* … *\/`) e vírgula antes de `}` ou `]`. Nada de aspas simples, chaves sem aspas ou escapes
 * inventados — isso já não é JSONC, é JSON5, e aceitá-lo seria inventar uma gramática que o
 * `wrangler` não tem.
 *
 * O SCANNER ANDA CARÁCTER A CARÁCTER, e é obrigatório que ande: uma expressão regular não sabe se
 * a vírgula está dentro de uma string. `"Sistema Lastro <lastro@padd.com.br>, "` é uma string
 * legítima, e um `replace(/,(\s*[}\]])/)` global cortá-la-ia em silêncio — trocando um erro que
 * grita por um valor que mente.
 */

/** O texto de um `.jsonc`, já sem comentários e sem vírgulas penduradas. */
function limpar(texto) {
  let saida = '';
  let dentroDeString = false;
  let escapado = false;
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (dentroDeString) {
      saida += c;
      if (escapado) escapado = false;
      else if (c === '\\') escapado = true;
      else if (c === '"') dentroDeString = false;
      continue;
    }
    if (c === '"') { dentroDeString = true; saida += c; continue; }
    if (c === '/' && texto[i + 1] === '/') {
      while (i < texto.length && texto[i] !== '\n') i += 1;
      saida += '\n';
      continue;
    }
    if (c === '/' && texto[i + 1] === '*') {
      i += 2;
      while (i < texto.length && !(texto[i] === '*' && texto[i + 1] === '/')) i += 1;
      i += 1;
      continue;
    }
    // A vírgula só cai quando o que vem a seguir (fora de string, fora de comentário) fecha um
    // objeto ou uma lista. Guardar o índice para não a escrever é mais seguro do que a apagar
    // depois: aqui sabemos que estamos fora de string; depois, já não se sabe.
    if (c === ',') {
      let j = i + 1;
      for (;;) {
        while (j < texto.length && /\s/.test(texto[j])) j += 1;
        if (texto[j] === '/' && texto[j + 1] === '/') {
          while (j < texto.length && texto[j] !== '\n') j += 1;
          continue;
        }
        if (texto[j] === '/' && texto[j + 1] === '*') {
          j += 2;
          while (j < texto.length && !(texto[j] === '*' && texto[j + 1] === '/')) j += 1;
          j += 2;
          continue;
        }
        break;
      }
      if (texto[j] === '}' || texto[j] === ']') continue;
    }
    saida += c;
  }
  return saida;
}

/** Lê um `.jsonc` de um caminho, como objeto. Lança com o nome do arquivo quando não dá. */
function lerJsonc(arquivo) {
  const bruto = require('fs').readFileSync(arquivo, 'utf8');
  try {
    return JSON.parse(limpar(bruto));
  } catch (erro) {
    // O NOME DO ARQUIVO VAI NA MENSAGEM. Antes, o erro era só «Expected double-quoted property
    // name in JSON at position 628» — um número sem dono, e uma caçada por entre nove ficheiros
    // `wrangler.*.jsonc`. Quem lê um erro tem de saber de que ficheiro ele fala.
    throw new Error(arquivo + ': ' + erro.message);
  }
}

module.exports = { lerJsonc, limpar };
