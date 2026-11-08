'use strict';

/**
 * subpedidos.js — o ORÇAMENTO de subpedidos de UMA invocação do Worker.
 *
 * PORQUE EXISTE (08/11/2026). O Cloudflare conta cada `fetch` que o Worker faz para fora como um
 * SUBPEDIDO, e o teto é POR INVOCAÇÃO: **50** no plano gratuito (até 10.000.000 no pago, mas o
 * limite é do plano, não do nosso desenho). O «Guardar» do Plano de Observação faz muitos — cada
 * leitura e cada escrita na API do GitHub é um —, e quando o teto estoura o Worker não devolve
 * erro: a invocação é ABORTADA a meio.
 *
 * O QUE ACONTECEU, medido. Em 08/11/2026 o «Guardar» do PO gravou o envelope (`b7b5a66f`) e a
 * fonte `-po.md` (`06bd359d`) e **não** gravou as fontes do ciclo: o último passo do pedido morreu
 * no teto. O pacote ficou com o `-po.md` a apontar para um PO (`po-…-0956`) e o `-dados.json` a
 * descrever outro (`po-…-2211`) — dois documentos do mesmo ciclo a discordar, com uma âncora a
 * certificar o conjunto. A mensagem que o professor viu («Too many subrequests by single Worker
 * invocation») é o Cloudflare a dizer que o orçamento acabou, e não uma frase sobre o ciclo.
 *
 * A REGRA. Não se adivinha o que sobra: CONTA-SE. Este módulo embrulha o `fetch` do pedido com um
 * contador, e o mesmo embrulho é o `fetchImpl` de todos os escritores — assim o orçamento é um só
 * para a invocação inteira, e não um por módulo (que é como se chega ao teto sem ninguém dar por
 * isso). Quem sabe o custo do seu trabalho pergunta antes: se não couber, **não começa** — e um
 * ciclo pela metade deixa de ser um estado possível.
 *
 * O TETO É DECLARADO, E TEM UM PADRÃO CONSERVADOR: 50, o do plano gratuito. Uma conta paga levanta
 * o número pela `vars` `SUBPEDIDOS` do `wrangler.<escola>.jsonc`, sem tocar no código — mas o
 * padrão é o pior caso, porque o custo de estar errado é assimétrico: por baixo, o «Guardar»
 * recusa e diz porquê; por cima, ele morre a meio e mente sobre o que gravou.
 */

/** O teto do plano gratuito. É o pior caso, e é de propósito (ver a nota acima). */
const LIMITE_PADRAO = 50;

/**
 * Embrulha um `fetch` num contador. Devolve o próprio `fetch` (com `.subpedidos` pendurado), para
 * poder ser passado a `fetchImpl` de quem já o aceita sem mudar nenhuma assinatura.
 */
function contarSubpedidos(baseFetch, limite) {
  const base = baseFetch || fetch;
  const teto = Number(limite) > 0 ? Number(limite) : LIMITE_PADRAO;
  const estado = {
    limite: teto,
    /** Quantos já foram gastos nesta invocação. */
    usados: 0,
    /** Quantos ainda cabem. */
    get restantes() { return Math.max(0, teto - estado.usados); },
    /** O que já não couber: é o que os escritores perguntam antes de começar. */
    coube(estimativa) { return Number(estimativa) <= estado.restantes; },
    /** A frase que a tela mostra quando não coube — dita, e não um `undefined`. */
    motivo(estimativa) {
      return 'esta invocação do Worker já gastou ' + estado.usados + ' dos ' + teto
        + ' subpedidos permitidos, e o passo seguinte precisa de ' + estimativa
        + '. Nada do ciclo foi escrito — repita o «Guardar»; se repetir sempre, o teto do plano '
        + 'do Cloudflare terá de subir (vars `SUBPEDIDOS` em wrangler.<escola>.jsonc).';
    },
  };
  const contado = async (url, init) => {
    estado.usados += 1;
    return base(url, init);
  };
  contado.subpedidos = estado;
  return contado;
}

/** O contador escondido em `fetchImpl`, ou `null` quando não há nenhum (bancadas, Node). */
function orcamentoDe(fetchImpl) {
  return (fetchImpl && fetchImpl.subpedidos) || null;
}

module.exports = { LIMITE_PADRAO, contarSubpedidos, orcamentoDe };
