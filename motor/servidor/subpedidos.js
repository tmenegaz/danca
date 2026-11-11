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
    /** O Cloudflare recusou um `fetch` por teto — a invocação acabou, e já se sabe. */
    estourou: false,
    /**
     * A frase que a tela mostra quando não coube — dita, e não um `undefined`.
     *
     * O QUE A FRASE NÃO DIZ MAIS (10/11/2026). Dizia «repita o «Guardar»», e a instrução estava
     * certa e a leitura errada ao mesmo tempo: numa cadeia, o passo que não coube é o ÚLTIMO, e
     * os anteriores já estão gravados — repetir repete-os também (são idempotentes, mas o
     * professor não tem como saber). Quem sabe o que já entrou é quem chamou; por isso a frase
     * passou a declarar só o que ela mede — o orçamento e o passo —, e a instrução é dada onde o
     * estado é conhecido (`rodarCadeia`, e o fecho automático do pacote).
     */
    motivo(estimativa) {
      return 'esta invocação do Worker já gastou ' + estado.usados + ' dos ' + teto
        + ' subpedidos permitidos, e o passo seguinte precisa de ' + estimativa
        + '. Este passo não foi escrito — o que veio antes dele está gravado. Se se repetir '
        + 'sempre, o teto do plano do Cloudflare terá de subir (vars `SUBPEDIDOS` em '
        + 'wrangler.<escola>.jsonc).';
    },
  };
  /* O TETO DO CLOUDFLARE FALA OUTRA LÍNGUA, E É AQUI QUE SE TRADUZ (10/11/2026).
   *
   * O contador sabe QUANTOS subpedidos foram gastos, mas a invocação pode morrer no teto por um
   * `fetch` que estoura — e aí o erro que sobe é o do Cloudflare, em inglês:
   * «Too many subrequests by single Worker invocation». O resto do sistema não o reconhece: a
   * etapa fica com uma frase crua, `porOrcamento` fica falso, e a continuação automática não
   * parte — o professor volta exactamente ao estado que a continuação existe para acabar.
   *
   * A tradução é feita no ÚNICO sítio que sabe do orçamento: aqui. Uma fronteira, uma frase, e
   * tudo o que está a jusante — a etapa, a tela, o fecho automático — passa a falar a mesma. */
  const contado = async (url, init) => {
    estado.usados += 1;
    try {
      return await base(url, init);
    } catch (erro) {
      const texto = String((erro && erro.message) || erro || '');
      if (/too many subrequests/i.test(texto)) {
        estado.estourou = true;
        const novo = new Error('esta invocação do Worker gastou o teto de ' + teto
          + ' subpedidos do plano do Cloudflare, e o passo seguinte não coube. O que veio antes '
          + 'está gravado; repetir o gesto continua de onde parou. Se acontecer sempre, o teto '
          + 'terá de subir (vars `SUBPEDIDOS` em wrangler.<escola>.jsonc).');
        novo.subpedidosEsgotados = true;
        novo.causa = erro;
        throw novo;
      }
      throw erro;
    }
  };
  contado.subpedidos = estado;
  return contado;
}

/** O contador escondido em `fetchImpl`, ou `null` quando não há nenhum (bancadas, Node). */
function orcamentoDe(fetchImpl) {
  return (fetchImpl && fetchImpl.subpedidos) || null;
}

/**
 * A mensagem é de ORÇAMENTO? Uma pergunta, um sítio — porque há duas frases para o mesmo facto: a
 * nossa (`motivo`) e a do Cloudflare, que a tradução acima deixa passar em forma crua quando o
 * erro nasce fora do contador. Quem decide se a tela pode tentar de novo pergunta aqui.
 */
function ehOrcamento(texto) {
  const t = String(texto || '');
  return /subpedidos/.test(t) || /too many subrequests/i.test(t);
}

module.exports = { LIMITE_PADRAO, contarSubpedidos, orcamentoDe, ehOrcamento };
