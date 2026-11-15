'use strict';

/**
 * senha.js — como uma senha se guarda, num lugar só (15/11/2026).
 *
 * O QUE MUDOU, E PORQUÊ ISTO PASSOU A SER UM MÓDULO. O `hashSenha` vivia dentro de
 * `motor/servidor/bastidores.js`, e duas coisas passaram a precisar dele: os Bastidores (as senhas
 * dos professores adicionais) e o PROVISIONAMENTO (o registo do dono, escrito quando a escola
 * nasce). O segundo não pode `require` o primeiro — os Bastidores são uma superfície enorme, e
 * puxá-los para dentro da criação de escola seria carregar o motor inteiro para fazer um `SHA-256`.
 *
 * A ALTERNATIVA ERA COPIAR AS SEIS LINHAS, e é a que este repositório recusa por princípio: duas
 * cópias de «como se guarda uma senha» divergem no dia em que uma delas aprender alguma coisa — e
 * a que ficar para trás é a que aceita o que a outra recusa.
 *
 * O QUE ESTE MÓDULO NÃO É: não é um `bcrypt`. É o que a casa já usava — `SHA-256(sal + senha)` com
 * 16 bytes de sal por registo — e a mudança de algoritmo não é deste trabalho. O que este módulo
 * garante é que a REGRA é uma: enquanto for esta, é esta em todos os sítios.
 *
 * E o que o sal compra, dito para não ser esquecido: duas pessoas com a mesma senha têm hashes
 * diferentes, e um dicionário pré-calculado não serve. O que ele NÃO compra é resistência a força
 * bruta sobre uma senha fraca — isso é trabalho do comprimento, não do sal.
 */

const TEXTO = new TextEncoder();

/** 16 bytes de entropia em hex — o sal de um registo novo. */
function salAleatorio() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let s = '';
  for (let i = 0; i < bytes.length; i += 1) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

/**
 * O hash de uma senha com o sal dela. `SHA-256(sal + senha)`, hex.
 *
 * A ORDEM (sal primeiro) é a que já estava em produção: invertê-la agora invalidaria todas as
 * senhas guardadas, e uma correcção de arrumação não pode custar o acesso de ninguém.
 */
async function hashSenha(senha, sal) {
  const bytes = TEXTO.encode(String(sal || '') + String(senha == null ? '' : senha));
  const digesto = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  let s = '';
  for (const b of new Uint8Array(digesto)) s += b.toString(16).padStart(2, '0');
  return s;
}

/** O registo de uma senha, do jeito que o KV guarda: `{hash, sal}`. Nunca o texto. */
async function registoDeSenha(senha) {
  const sal = salAleatorio();
  return { hash: await hashSenha(senha, sal), sal };
}

/** `true` quando a senha confere com o registo `{hash, sal}`. */
async function confere(senha, registo) {
  const r = registo && typeof registo === 'object' ? registo : {};
  const hash = String(r.hash || '').trim();
  if (!hash) return false;
  return (await hashSenha(senha, r.sal)) === hash;
}

module.exports = { salAleatorio, hashSenha, registoDeSenha, confere };
