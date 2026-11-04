'use strict';

/**
 * fusao.js — a FUSÃO de duas edições do mesmo documento (decisão 84, 04/11/2026).
 *
 * O problema que ela resolve não é o da corrida do NOME (esse está fechado em `criar`): é o de
 * duas pessoas — ou duas abas — a gravar o **mesmo** documento. Sem esta regra, a segunda
 * gravação vencia em silêncio, e o que a primeira escreveu desaparecia.
 *
 * A regra é a da pesquisadora, e tem duas partes:
 *
 *   1. **Locais diferentes** — se uma edição mexeu num campo e a outra noutro, as duas são
 *      preservadas. Não se escolhe uma: o documento fica com as duas mudanças.
 *   2. **Mesmo local** — se as duas mexeram no MESMO campo e chegaram a valores diferentes,
 *      vence a edição **mais recente**, comparada ao milissegundo (`editado_em`). No empate
 *      vence a que está a ser gravada — o desempate é determinístico, e não depende de quem lê.
 *
 * O que é lido como «local»: a CHAVE de `respostas` (o campo do documento). `objetivo-geral` é um
 * local; o `valor` dentro dele não é um segundo local, porque uma resposta é uma unidade — meio
 * `valor` de um e meio `origem` de outro não é uma resposta. `notas` segue a mesma regra.
 *
 * **Sem base não há fusão.** Uma fusão a três vias precisa das três versões: a que o professor
 * leu (base), a que ele gravou (minha) e a que está no acervo (atual). Faltando a base, o certo é
 * NÃO adivinhar — `podeFundir` diz que não, e quem chama grava como sempre gravou.
 */

/** Igualdade profunda para os valores de um envelope (objetos, arrays, escalares, null). */
function igual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  const ehArrayA = Array.isArray(a);
  const ehArrayB = Array.isArray(b);
  if (ehArrayA !== ehArrayB) return false;
  if (ehArrayA) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) if (!igual(a[i], b[i])) return false;
    return true;
  }
  const chavesA = Object.keys(a).sort();
  const chavesB = Object.keys(b).sort();
  if (chavesA.length !== chavesB.length) return false;
  for (let i = 0; i < chavesA.length; i += 1) {
    if (chavesA[i] !== chavesB[i]) return false;
    if (!igual(a[chavesA[i]], b[chavesB[i]])) return false;
  }
  return true;
}

/**
 * O INSTANTE de um carimbo, em milissegundos. `null` quando não se sabe — e «não se sabe» é uma
 * resposta, não um erro: um envelope gravado antes de `editado_em` existir só tem `gerado_em`, que
 * é de minuto.
 */
function instante(texto) {
  const s = String(texto == null ? '' : texto).trim();
  if (!s) return null;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * O CARIMBO DO INSTANTE DA ESCRITA, com milissegundos — o que a regra da recência compara.
 *
 * ISO em UTC (`...Z`), e não a hora local do carimbo do id: o id é um NOME (e é legível de
 * propósito); este é um INSTANTE, e comparar instantes de fusos diferentes com carimbos sem fuso
 * é como comparar números de telefone. `quando` existe para a prova fixar o instante.
 */
function carimbarInstante(quando) {
  const agora = quando instanceof Date ? quando : new Date();
  return agora.toISOString();
}

/** A base de comparação de um envelope: o que ele declara sobre QUANDO foi escrito. */
function quandoDoEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object') return null;
  return envelope.escrito_em || envelope.editado_em || envelope.gerado_em || null;
}

/** Há base para fundir? As três versões, e a minha a declarar quando foi escrita. */
function podeFundir(base, minha, atual, quandoMinha) {
  return Boolean(base && minha && atual
    && typeof base === 'object' && typeof minha === 'object' && typeof atual === 'object'
    && quandoMinha);
}

/**
 * A FUSÃO. Devolve as respostas unificadas e o RELATO do que aconteceu — porque uma fusão
 * silenciosa é indistinguível de uma sobrescrita: quem lê a resposta da gravação tem de saber
 * que dois campos vieram de outra pessoa, e que num deles houve desacordo.
 */
function fundirRespostas({ base, minha, atual, quandoMinha }) {
  const b = (base && base.respostas && typeof base.respostas === 'object') ? base.respostas : {};
  const m = (minha && minha.respostas && typeof minha.respostas === 'object') ? minha.respostas : {};
  const t = (atual && atual.respostas && typeof atual.respostas === 'object') ? atual.respostas : {};
  const quandoAtual = quandoDoEnvelope(atual);

  const msMinha = instante(quandoMinha);
  const msAtual = instante(quandoAtual);
  // O EMPATE VAI PARA QUEM ESTÁ A GRAVAR: é o único desempate que não depende de relógios
  // externos nem da ordem de chegada dos pedidos — a gravação que corre agora é, por definição,
  // a última das duas a ser aplicada.
  const venceMinha = (msAtual === null) || (msMinha !== null && msMinha >= msAtual);

  const unidos = [];
  const mantidos = [];
  const conflitos = [];
  const respostas = {};

  const chaves = new Set([...Object.keys(b), ...Object.keys(m), ...Object.keys(t)]);
  for (const campo of [...chaves].sort()) {
    const naBase = b[campo];
    const meu = m[campo];
    const dele = t[campo];
    const euMudei = !igual(meu, naBase);
    const eleMudou = !igual(dele, naBase);

    // Eu não mexi neste campo: fica o que está no acervo. Se o outro mexeu, isso é um campo
    // UNIFICADO — a minha gravação não o apaga. Se ninguém mexeu, fica o da base.
    if (!euMudei) {
      if (dele !== undefined) {
        respostas[campo] = dele;
        if (eleMudou) mantidos.push(campo);
      } else if (meu !== undefined) {
        respostas[campo] = meu;
      }
      continue;
    }
    // Eu mexi e ele não: fica o meu.
    if (!eleMudou) {
      if (meu !== undefined) respostas[campo] = meu;
      continue;
    }
    // Os dois mexeram, e chegaram ao mesmo sítio: é a mesma edição, não há o que escolher.
    if (igual(meu, dele)) {
      if (meu !== undefined) respostas[campo] = meu;
      continue;
    }
    // Os dois mexeram no MESMO campo, com valores diferentes: a regra da recência.
    const vencedor = venceMinha ? meu : dele;
    if (vencedor !== undefined) respostas[campo] = vencedor;
    conflitos.push({ campo, venceu: venceMinha ? 'minha' : 'atual', quandoMinha, quandoAtual });
  }

  return {
    respostas,
    // `unidos` são os campos que a OUTRA gravação mudou e que esta preservou — a prova de que
    // nada se perdeu. `mantidos` é o mesmo conjunto, com o nome do ponto de vista de quem lê.
    unidos: mantidos.slice(),
    conflitos,
    houveFusao: mantidos.length > 0 || conflitos.length > 0,
  };
}

/**
 * O DOCUMENTO fundido — o envelope que vai para o acervo.
 *
 * O corpo vem do MEU (é a minha gravação: o id, o contexto, o `editado_em`), as `respostas` e as
 * `notas` vêm da fusão. `editado_em` é o instante desta gravação — é ele que a próxima fusão vai
 * comparar, e por isso não pode ser herdado.
 */
function fundirEnvelopes({ base, minha, atual, quandoMinha }) {
  const resultado = fundirRespostas({ base, minha, atual, quandoMinha });
  const documento = Object.assign({}, minha);
  documento.respostas = resultado.respostas;
  if (resultado.respostas && Object.keys(resultado.respostas).length === 0) delete documento.respostas;
  documento.editado_em = quandoMinha;
  return { documento, relato: resultado };
}

module.exports = {
  igual,
  instante,
  carimbarInstante,
  quandoDoEnvelope,
  podeFundir,
  fundirRespostas,
  fundirEnvelopes,
};
