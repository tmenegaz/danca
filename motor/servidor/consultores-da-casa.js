'use strict';

/**
 * consultores-da-casa.js — O REGISTO DE CONSULTORES, LIDO E ESCRITO NO KV (25/11/2026).
 *
 * O QUE ELE É, E O QUE ELE NÃO É. A regra — validar, acrescentar, mudar de estado — está em
 * `motor/nucleo/consultores.js`, que é puro. Aqui está só o que precisa do KV: ler a lista,
 * gravar a lista, e dizer quando não há KV. É a mesma divisão do `contato-do-site.js`, e pela
 * mesma razão: uma regra em dois sítios responde duas coisas.
 *
 * PORQUE É UM MÓDULO E NÃO QUATRO LINHAS DENTRO DA ROTA. As três rotas do painel (a lista, a
 * criação e o estado) leem e escrevem a MESMA chave, e a leitura tem uma regra que não pode ser
 * copiada: **um KV que não responde não é uma lista vazia**. Se a leitura falhar e a rota disser
 * «não há consultores», ela mente — e o gesto seguinte (criar) grava por cima de uma lista que
 * existia. É a mesma família do `lerLista(kv, chave, estrito)` que o `bastidores.js` já usa para as
 * câmaras e as turmas.
 *
 * O QUE ELE **NÃO** FAZ: não manda e-mail, não gera token, não fala com o GitHub. Um consultor
 * registado não tem acesso a nada — o acesso dele nasce em F2, e é outro ficheiro.
 */

const consultores = require('../nucleo/consultores.js');

const SEM_KV = {
  ok: false,
  erro: 'esta instalação não tem KV — o registo de consultores não pode ser lido nem gravado',
};

/** O KV existe e sabe gravar? A pergunta é feita uma vez, e a resposta é a mesma em todas as rotas. */
function temKv(env) {
  const kv = env && env.PADD_KV;
  return Boolean(kv && typeof kv.get === 'function' && typeof kv.put === 'function');
}

/**
 * LÊ A LISTA. Devolve `{ ok, lista, erro }`.
 *
 * `ok: false` quando o KV não existe ou quando a leitura estourou — e **nunca** com uma lista
 * vazia a fingir de resposta: a diferença entre «não há consultores» e «não consegui ler» é a
 * diferença entre uma decisão e um acidente, e quem escreve a seguir precisa de a saber.
 *
 * A chave que não existe (KV vazio) é `ok: true, lista: []` — isso não é uma falha, é o começo.
 */
async function ler(env) {
  if (!temKv(env)) return Object.assign({}, SEM_KV, { lista: [] });
  let bruto;
  try {
    bruto = await env.PADD_KV.get(consultores.CHAVE);
  } catch (erro) {
    return {
      ok: false,
      lista: [],
      erro: 'não foi possível ler o registo de consultores: ' + ((erro && erro.message) || String(erro)),
    };
  }
  return { ok: true, lista: consultores.lerLista(bruto), vazio: !bruto };
}

/** Grava a lista inteira. Devolve `{ ok, erro }` — e não engole a falha. */
async function gravar(env, lista) {
  if (!temKv(env)) return SEM_KV;
  try {
    await env.PADD_KV.put(consultores.CHAVE, JSON.stringify(Array.isArray(lista) ? lista : []));
    return { ok: true };
  } catch (erro) {
    return {
      ok: false,
      erro: 'não foi possível gravar o registo de consultores: ' + ((erro && erro.message) || String(erro)),
    };
  }
}

/**
 * CRIA UM CONSULTOR — valida, confere o documento repetido, e grava.
 *
 * A ORDEM É A DA CASA: valida primeiro (nada se grava sobre um corpo inválido), confere o
 * documento contra a lista LIDA (e não contra uma lista de memória), e só então escreve. Se a
 * gravação falhar, a resposta diz que não foi gravado — o registo devolvido não deve ser mostrado
 * como existente.
 */
async function criar(env, pedido, quando) {
  const validado = consultores.validarCadastro(pedido);
  if (!validado.ok) return { ok: false, erro: validado.erro, erros: validado.erros, status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const acrescentado = consultores.acrescentar(lido.lista, validado.cadastro, quando);
  if (!acrescentado.ok) return { ok: false, erro: acrescentado.erro, status: 409 };
  const gravado = await gravar(env, acrescentado.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  return {
    ok: true,
    registo: acrescentado.registo,
    /* O QUE SAI DA LISTA DIZ-SE. Um tecto que apaga em silêncio é uma mentira por omissão — e o
     * painel tem de o poder dizer a quem acabou de cadastrar o duzentos e um. */
    retirados: acrescentado.retirados,
    lista: acrescentado.lista,
  };
}

/** Activa ou desactiva. Devolve `{ ok, mudou, registo, lista }`. */
async function mudarEstado(env, { id, ativo, motivo } = {}, quando) {
  const alvo = String(id || '').trim();
  if (!alvo) return { ok: false, erro: 'falta o id do consultor', status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const mudado = consultores.mudarEstado(lido.lista, alvo, ativo, quando, motivo);
  if (!mudado.ok) return { ok: false, erro: mudado.erro, status: 404 };
  /* MUDAR PARA O MESMO ESTADO NÃO GRAVA: um clique duplo não deve encher o histórico de elos que
   * não mudaram nada. E não gravar é a resposta certa, não uma falha. */
  if (!mudado.mudou) return { ok: true, mudou: false, registo: mudado.registo, lista: lido.lista };
  const gravado = await gravar(env, mudado.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  return { ok: true, mudou: true, registo: mudado.registo, lista: mudado.lista };
}

module.exports = {
  temKv,
  ler,
  gravar,
  criar,
  mudarEstado,
};
