'use strict';

/**
 * convite.js — O CONVITE DE RECRIAÇÃO, E O QUE O TORNA UM SEGREDO (16/11/2026).
 *
 * O QUE ELA DESENHOU, e é o fluxo inteiro: «quando eu clicar em recriar […] envia um e-mail para o
 * e-mail cadastrado da escola […] Lá ele tem um link que acessa essa tela […] que ali ele escolhe o
 * plano e ele cadastra a senha. […] Aí ele envia […] Aí aguarda a conciliação.»
 *
 * PORQUE É QUE ISTO NÃO É UM LINK COM O SLUG DA ESCOLA. A página do convite é PÚBLICA — quem a abre
 * é o professor, num endereço aberto, sem a senha da raiz. Um endereço `…/recriar/duo` daria a
 * qualquer pessoa que o adivinhasse o direito de **escolher a senha da escola do Fernando** e de a
 * recriar. O slug não é um segredo: está nos e-mails, nos índices, na lista das apagadas. O que
 * autentica é o TOKEN, e ele tem três propriedades que o slug não tem:
 *
 *   1. é **aleatório** (128 bits do CSPRNG do runtime, 32 caracteres hex) — não se adivinha;
 *   2. **não se guarda**: o KV guarda o SHA-256 dele. Quem ler o KV (ou um backup dele) não
 *      consegue reconstruir o link;
 *   3. **expira** e **usa-se uma vez**. Um convite é um gesto datado, e um link que vale para
 *      sempre é uma porta que ninguém volta a fechar.
 *
 * O TOKEN SÓ EXISTE EM CLARO NA MENSAGEM. Ele é gerado, metido no link, enviado, e a partir daí o
 * sistema só conhece o hash — é a mesma disciplina de uma senha, e é de propósito: a comparação é
 * feita sobre o hash, e o valor que abriu a página não fica escrito em sítio nenhum.
 *
 * ESTE MÓDULO É PURO, menos a geração e o hash — que usam o `crypto` do runtime (o mesmo no Worker e
 * no Node 24). Não lê KV, não fala com o correio, não conhece o repositório: quem guarda é o
 * chamador, e quem envia é o `correio.js`.
 */

/** Quantos dias um convite vale. Sete é o prazo de quem combinou o pagamento por WhatsApp. */
const DIAS_DE_VALIDADE = 7;

/** 32 caracteres hex = 16 bytes = 128 bits. O CSPRNG do runtime, nunca o `Math.random`. */
function novoToken() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

/** O SHA-256 do token, em hex — é ISTO que fica guardado, e é contra isto que se compara. */
async function hashDoToken(token) {
  const dados = new TextEncoder().encode('lastro/convite/' + String(token || ''));
  const resumo = await globalThis.crypto.subtle.digest('SHA-256', dados);
  return [...new Uint8Array(resumo)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** `2026-11-16T12:00:00.000Z` → o instante em que um convite criado agora deixa de valer. */
function validadeDe(agora) {
  const base = agora ? new Date(agora) : new Date();
  const t = Number.isFinite(base.getTime()) ? base.getTime() : Date.now();
  return new Date(t + DIAS_DE_VALIDADE * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * O ESTADO DE UM CONVITE — uma resposta, e não três.
 *
 * Devolve `{ ok, motivo }`. A ordem das perguntas é a ordem em que a resposta deixa de ser «sim»:
 * não existe, já foi usado, expirou, o token não confere. E `motivo` é a FRASE que a página mostra —
 * a mesma nos três casos em que o convite não serve, porque distinguir «existe mas expirou» de
 * «não existe» só ajudaria a quem está a adivinhar.
 */
async function estadoDoConvite(registo, token, agora) {
  const recusado = {
    ok: false,
    motivo: 'Este convite não está válido. Peça outro à administração do Sistema Lastro — '
      + 'um convite vale uma vez, e por tempo limitado.',
  };
  if (!registo || !registo.hash) return recusado;
  if (registo.usadoEm) {
    return Object.assign({}, recusado, {
      motivo: 'Este convite já foi usado. Se a escola já foi recriada, ela está na lista das vivas; '
        + 'se precisa de outro, peça-o à administração do Sistema Lastro.',
    });
  }
  const expira = Date.parse(registo.expiraEm || '');
  const referencia = agora ? new Date(agora).getTime() : Date.now();
  if (!Number.isFinite(expira) || expira <= referencia) {
    return Object.assign({}, recusado, {
      motivo: 'Este convite expirou. Peça outro à administração do Sistema Lastro — são '
        + DIAS_DE_VALIDADE + ' dias a contar do envio.',
    });
  }
  const esperado = await hashDoToken(token);
  if (esperado !== registo.hash) return recusado;
  return { ok: true, escola: registo.escola || null, expiraEm: registo.expiraEm };
}

module.exports = {
  DIAS_DE_VALIDADE,
  novoToken,
  hashDoToken,
  validadeDe,
  estadoDoConvite,
};
