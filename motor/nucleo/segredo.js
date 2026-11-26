'use strict';

/**
 * segredo.js — O TOKEN DE UM LINK, E O QUE O TORNA UM SEGREDO (25/11/2026).
 *
 * ESTE MÓDULO NASCEU DE UMA DUPLICAÇÃO EVITADA. O token do convite de recriação já vivia em
 * `convite.js`, com as três propriedades que o tornam um segredo. O consultor precisa de dois
 * tokens com exactamente as mesmas propriedades — o do ACESSO dele e o do LINK de uma visita —, e
 * escrevê-los outra vez seria a terceira cópia da mesma criptografia. Três cópias de uma regra de
 * segurança são três sítios onde ela pode ficar mais fraca sem ninguém notar — é a mesma lição do
 * `copiar.js`, onde a rotina vivia numa página e as outras duas emitiam o botão sem ouvinte.
 *
 * AS TRÊS PROPRIEDADES, e porquê:
 *
 *   1. é **aleatório** — 128 bits do CSPRNG do runtime, 32 caracteres hex. O `Math.random` não
 *      serve: não é criptográfico, e um token adivinhável é a porta aberta com um nome.
 *   2. **não se guarda**: guarda-se o SHA-256. Quem ler o KV — ou um backup dele — não reconstrói
 *      o link. É a disciplina de uma senha, e o valor que abriu a página não fica escrito em sítio
 *      nenhum.
 *   3. **expira** e (quando o chamador o decide) **usa-se uma vez**. Um link que vale para sempre é
 *      uma porta que ninguém volta a fechar.
 *
 * O `AMBITO` É O QUE SEPARA OS TRÊS. O hash não é `sha256(token)`: é `sha256('lastro/' + âmbito +
 * '/' + token)`. Sem ele, o mesmo token valeria como convite, como acesso de consultor e como link
 * de visita — porque o hash seria o mesmo número. Com ele, um token de uma espécie nunca confere na
 * outra, e isso está medido (`provar-o-link-do-consultor` §A).
 *
 * O QUE ESTE MÓDULO NÃO FAZ: não lê KV, não valida prazo, não conhece consultor nem convite. Ele
 * gera, derruba e compara. Quem decide «este token ainda vale» é quem conhece o registo.
 */

/** Os âmbitos que existem. Um âmbito inventado é um erro de programação, e diz-se alto. */
const AMBITOS = ['convite', 'acesso', 'visita'];

/** 32 caracteres hex = 16 bytes = 128 bits. O CSPRNG do runtime, nunca o `Math.random`. */
function novoToken() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

/**
 * O SHA-256 do token, em hex — é ISTO que fica guardado, e é contra isto que se compara.
 *
 * O ÂMBITO ENTRA NO TEXTO HASHEADO, e não é decoração: é ele que impede que o token de um convite
 * sirva como link de uma visita. Um `throw` num âmbito desconhecido é deliberado — não há valor
 * por omissão que seja seguro, e um `''` silencioso colapsaria os três âmbitos num só.
 */
async function hashDoToken(ambito, token) {
  if (!AMBITOS.includes(ambito)) {
    throw new TypeError('segredo: âmbito desconhecido «' + String(ambito) + '» — use um de ' + AMBITOS.join(', '));
  }
  const dados = new TextEncoder().encode('lastro/' + ambito + '/' + String(token == null ? '' : token));
  const resumo = await globalThis.crypto.subtle.digest('SHA-256', dados);
  return [...new Uint8Array(resumo)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * `2026-11-25T12:00:00.000Z` + N dias → o instante em que o link deixa de valer, em ISO.
 *
 * Devolve um instante e não uma data: os três prazos desta casa — sete dias do convite, trinta do
 * link da visita, trinta do mês da demonstração — são instantes, e o dia em que caem é uma conta
 * de fuso que se faz onde há fuso (o `fuso.js`), não aqui.
 */
function validadeDe(agora, dias) {
  const base = agora ? new Date(agora) : new Date();
  const t = Number.isFinite(base.getTime()) ? base.getTime() : Date.now();
  const n = Number(dias);
  const passos = Number.isFinite(n) && n >= 0 ? n : 0;
  return new Date(t + passos * 24 * 60 * 60 * 1000).toISOString();
}

module.exports = {
  AMBITOS,
  novoToken,
  hashDoToken,
  validadeDe,
};
