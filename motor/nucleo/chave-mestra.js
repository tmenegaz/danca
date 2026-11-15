'use strict';

/**
 * chave-mestra.js — UMA chave por escola, derivada de um segredo só (15/11/2026).
 *
 * O PROBLEMA QUE ISTO RESOLVE, dito na letra da pesquisadora: «eu quero usar o shard desde o momento
 * em que eu crio uma escola». Num shard há UM Worker para N escolas, logo um `env` para N escolas —
 * e a `SENHA_CRIPTO` morava lá, com um valor por Worker. A anamnese passou a responder
 * «não foi possível gravar: anamnese no repositório: falta a SENHA_CRIPTO», e com razão: sem a
 * chave daquela escola não se escreve nem se lê uma resposta de aluna.
 *
 * PORQUE NÃO SE COPIA A CHAVE ANTIGA. Porque não se consegue: o segredo do Cloudflare é
 * write-only (`GET /scripts/<escola>/secrets` devolve o NOME e o tipo, nunca o valor) e a chave é
 * gerada ao acaso com 24 bytes de entropia no nascimento da escola. Ela existe dentro do Worker
 * daquela escola e em mais sítio nenhum. É a plataforma a falar, não uma escolha nossa.
 *
 * A DERIVAÇÃO. A chave de cada escola passa a ser
 *
 *     chave(<escola>) = HMAC-SHA256(chave-mestra, "lastro/escola/<slug>")
 *
 * e há três propriedades que é preciso ver, porque cada uma foi escolhida:
 *
 *   · **Uma chave por escola.** O `slug` entra na mensagem assinada, portanto duas escolas nunca
 *     partilham chave — que é a condição para o dado de uma não abrir na outra.
 *   · **Nada se guarda.** Não há cofre, nem registo cifrado, nem escrita no KV: a chave é uma
 *     FUNÇÃO, e calcula-se quando é precisa. Foi o que a pesquisadora exigiu («aumentaria os custos
 *     do uso do KV»), e é o que evita a pergunta seguinte — onde é que se guarda a chave que guarda
 *     as chaves.
 *   · **O domínio é separado.** A mensagem assinada leva o prefixo `lastro/escola/` para a mesma
 *     mestra não poder ser reaproveitada noutro uso (uma segunda derivação com o mesmo texto daria
 *     a mesma chave, e dois usos da mesma chave é como um deles fica fraco).
 *
 * O QUE SE PERDE, e é a conta que ela aceitou: quem tem a mestra tem todas as escolas, e perder a
 * mestra perde todas. É o mesmo risco de guardar as chaves cifradas com a mestra — sem o KV no
 * meio. O ganho não é segurança: é não ter um segundo sítio onde as chaves vivem.
 *
 * E O QUE ISSO OBRIGA, dito aqui porque é a consequência prática: **trocar a mestra é trocar todas
 * as chaves**, e o que estiver cifrado com as antigas fica ilegível. Não há migração suave — há uma
 * decisão, e ela tem data.
 */

/** O nome do segredo no `env` do Worker. É o único sítio onde a mestra existe. */
const SEGREDO = 'SENHA_MESTRA';

/** O prefixo do domínio — o que impede a mestra de ser reaproveitada noutro uso. */
const DOMINIO = 'lastro/escola/';

const TEXTO = new TextEncoder();

/** `true` quando este Worker tem a mestra — o shard tem; uma escola antiga não. */
function temMestra(env) {
  return Boolean(String((env && env[SEGREDO]) || '').trim());
}

/**
 * A CHAVE DE UMA ESCOLA, derivada. Hex minúsculo de 64 caracteres — a mesma forma que a
 * `SENHA_CRIPTO` gerada tinha, para o `Cifra`/PBKDF2 não notar a diferença.
 *
 * Sem `escola`, RECUSA. Uma chave derivada de string vazia seria uma chave partilhada por todas as
 * escolas — exactamente o que a derivação existe para impedir — e o modo de falha seria silencioso:
 * o documento cifrado com a chave de uma escola aberto com a de outra.
 */
async function derivar(mestra, escola) {
  const m = String(mestra == null ? '' : mestra);
  const e = String(escola == null ? '' : escola).trim();
  if (!m) throw new Error('chave-mestra: falta a mestra (' + SEGREDO + ')');
  if (!e) throw new Error('chave-mestra: falta a escola — a chave é POR escola');
  const chave = await globalThis.crypto.subtle.importKey(
    'raw', TEXTO.encode(m), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const assinatura = await globalThis.crypto.subtle.sign('HMAC', chave, TEXTO.encode(DOMINIO + e));
  const bytes = new Uint8Array(assinatura);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}

/**
 * A CHAVE QUE O MOTOR DEVE USAR — a derivada, quando há mestra; a antiga (`SENHA_CRIPTO` do
 * Worker), quando não há.
 *
 * A reserva não é preguiça: é o que mantém uma escola de antes a funcionar no dia em que este
 * código entra. Elas não têm mestra, têm o segredo delas, e continuam a abrir as anamneses que
 * cifraram. Migrar exige reescrever o que está cifrado, e isso é um acto com data — não um efeito
 * colateral de um deploy.
 */
async function chaveDaEscola(env, escola) {
  const alvo = String(escola || '').trim();
  if (temMestra(env)) return derivar(env[SEGREDO], alvo);
  const legado = String((env && env.SENHA_CRIPTO) || '').trim();
  return legado || null;
}

/**
 * A MESMA CHAVE, DE FORMA RECONHECÍVEL — os primeiros 8 hex.
 *
 * Serve para uma coisa só, e é importante: dizer «esta escola usa a chave X» sem mostrar a chave.
 * O cofre da raiz mostra a mestra; esta impressão digital é o que o diagnóstico de uma escola pode
 * mostrar, e é o que permite conferir, num relatório, que duas escolas não partilham chave — sem
 * que o relatório passe a ser um sítio por onde as chaves escapam.
 */
function impressao(chave) {
  const c = String(chave || '');
  return c ? c.slice(0, 8) : null;
}

module.exports = { SEGREDO, DOMINIO, temMestra, derivar, chaveDaEscola, impressao };
