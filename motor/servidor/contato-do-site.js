'use strict';

/**
 * contato-do-site.js — O «FALE CONOSCO» SERVIDO POR QUALQUER UM DOS DOIS WORKERS (18/11/2026).
 *
 * PORQUE É QUE ISTO É UM MÓDULO E NÃO UMA FUNÇÃO DENTRO DA PÁGINA. O rodapé com o «Fale conosco»
 * passou a existir em TODAS as telas — a raiz (`danca.padd.com.br`), os Bastidores e o site de cada
 * escola (`breu.padd.com.br`, e todas as que nascerem). São DOIS Workers diferentes: o da raiz
 * (`motor/servidor/raiz.js`) e o do shard, que serve as escolas (`motor/servidor/producao.js`).
 * Duas cópias do mesmo manipulador divergiriam no primeiro dia em que uma delas fosse corrigida —
 * e o sintoma seria o pior possível: o formulário funciona numa tela e mente na outra.
 *
 * A CAIXA DE ENTRADA É UMA SÓ, e é a mesma chave de KV (`contatos/entradas`) nos dois Workers —
 * eles estão ligados ao MESMO namespace (`wrangler.danca.jsonc` e `wrangler.lastro-teste.jsonc`
 * declaram o mesmo `id`). Quem escreve no site da escola aparece no painel dela em
 * `danca.padd.com.br/contatos`, sem cópia, sem sincronização e sem rota de transferência.
 *
 * O QUE ELE FAZ, POR ESTA ORDEM, E PORQUÊ:
 *
 *   1. VALIDA — os cinco campos, com as regras da casa;
 *   2. GRAVA o pedido — antes de qualquer envio, porque a caixa de entrada é o que não pode
 *      perder-se;
 *   3. ENVIA o aviso por e-mail (`correio.enviar`, Resend) — é o que ela pediu: «o formulário é
 *      para enviar direto, não vai abrir nada»;
 *   4. GRAVA O DESFECHO no próprio pedido. Se aqui falhar, o pedido continua na lista com
 *      `aviso: null` — «não se sabe», que é a verdade, e não «não foi enviado».
 *
 * A RESPOSTA DIZ SEMPRE AS DUAS COISAS SEPARADAS: `registado` (ficou do nosso lado) e `enviado`
 * (saiu por e-mail). Uma resposta com um booleano só obrigaria a página a adivinhar qual das duas
 * metades falhou — e a mentir sobre a outra.
 */

const correio = require('./correio.js');
const contato = require('../nucleo/contato.js');

const JSON_OK = (corpo, status) => new Response(JSON.stringify(corpo), {
  status: status || 200,
  headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
});

/**
 * RESPOSTA AO `POST /api/contato` — o caminho público, sem senha, dos dois Workers.
 *
 * `enviar` é injectável para que a raiz possa passar pelo CONTADOR do correio (`enviarEContar`):
 * um envio que não é contado deixa o painel do monitoramento a mentir, e o contador é a única
 * defesa contra a cota do Resend aparecer como surpresa. Quando não é passado, usa-se o correio
 * directo — é o caso do Worker da escola, que não tem o painel de monitoramento.
 */
async function responderContato(request, env, { enviar, fetchImpl } = {}) {
  if (!request || request.method !== 'POST') {
    return JSON_OK({ ok: false, erro: 'use POST' }, 405);
  }
  const kv = env && env.PADD_KV;
  if (!kv || typeof kv.put !== 'function') {
    return JSON_OK({
      ok: false,
      registado: false,
      enviado: false,
      erro: 'o sistema não tem onde guardar o pedido agora — escreva para ' + contato.DESTINO_DO_PEDIDO,
    }, 503);
  }

  let corpo = {};
  try { corpo = await request.json(); } catch (erro) { corpo = {}; }

  const lido = contato.lerEntrada(corpo);
  if (!lido.ok) {
    return JSON_OK({ ok: false, registado: false, enviado: false, erro: lido.erro }, 400);
  }
  const entrada = lido.entrada;

  /* 1 e 2 — GRAVAR ANTES DE ENVIAR. Se a escrita falhar, não se envia nada: um aviso por e-mail
   * sobre um pedido que não ficou registado faria a proprietária responder a alguém que não está
   * em lista nenhuma, e o rasto perder-se-ia no dia seguinte. */
  let lista;
  try {
    lista = contato.lerLista(await kv.get(contato.CHAVE));
    await kv.put(contato.CHAVE, JSON.stringify(contato.acrescentar(lista, entrada)));
  } catch (erro) {
    return JSON_OK({
      ok: false,
      registado: false,
      enviado: false,
      erro: 'não foi possível guardar o pedido agora — escreva para ' + contato.DESTINO_DO_PEDIDO,
    }, 502);
  }

  /* 3 — O AVISO. Qualquer desfecho serve menos uma excepção: `correio.enviar` já não lança, mas
   * quem o embrulha pode, e um `throw` aqui faria a página mostrar erro a quem já está registado. */
  let desfecho;
  try {
    const mensagem = contato.comporAviso(entrada);
    desfecho = enviar
      ? await enviar(mensagem)
      : await correio.enviar({
        mensagem,
        chave: env && env.RESEND_API_KEY,
        de: env && env.CORREIO_DE,
        fetchImpl,
      });
  } catch (erro) {
    desfecho = { enviado: false, motivo: (erro && erro.message) || String(erro) };
  }
  const enviado = Boolean(desfecho && desfecho.enviado);

  /* 4 — O DESFECHO NO PEDIDO. O que se guarda é o mínimo que responde à pergunta do painel —
   * «este chegou-me à caixa de correio?» —, e não o id do provedor, que não serve a ninguém aqui. */
  try {
    const actual = contato.lerLista(await kv.get(contato.CHAVE));
    await kv.put(contato.CHAVE, JSON.stringify(contato.marcarAviso(actual, entrada.quando, {
      enviado,
      motivo: enviado ? null : String((desfecho && desfecho.motivo) || 'motivo não declarado'),
    })));
  } catch (erro) { /* o pedido está gravado; só o desfecho é que não — e `null` diz «não se sabe» */ }

  return JSON_OK({
    ok: true,
    registado: true,
    enviado,
    /* A DICA SÓ APARECE QUANDO FALTA O TOKEN, que é o único caso que quem instala pode resolver.
     * O provedor fora do ar ou uma quota gasta não se resolvem com uma instrução na tela. */
    dica: !enviado && desfecho && /RESEND_API_KEY/.test(String(desfecho.motivo || ''))
      ? 'falta o segredo RESEND_API_KEY no Worker que serve esta página'
      : undefined,
  }, 201);
}

module.exports = { responderContato };
