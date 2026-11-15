'use strict';

/**
 * roteador.js — um roteador mínimo sobre WEB STANDARDS (Request/Response).
 *
 * Não depende de Node nem do Cloudflare: só de `Request`, `Response`, `URL` e
 * `fetch` — o que existe em qualquer runtime moderno. As rotas são declaradas
 * UMA vez (em rotas.js) e despachadas por este roteador, seja o pedido feito de
 * um `node:http` (ponte em node.js) ou do `fetch` de um Worker (cloudflare.js).
 *
 *   const roteador = criarRoteador();
 *   roteador.rota('GET', '/api/mapa', (ctx) => ({ nos: 53 })); // objeto → JSON
 *   const resposta = await roteador.responder(request);         // Response
 */

function casar(padrao, caminho) {
  // `*` sozinho casa com qualquer caminho (o fallback estático).
  if (padrao === '*') return {};
  // Padrão com sufixo `*` casa pelo prefixo (ex. `/api/ficha-preenchida.*`).
  if (padrao.endsWith('*')) {
    const prefixo = padrao.slice(0, -1);
    return caminho.startsWith(prefixo) ? { resto: caminho.slice(prefixo.length) } : null;
  }
  // Padrão com `:param` no segmento, ex. `/api/envelope/:id`.
  if (padrao.includes(':')) {
    const partesPadrao = padrao.split('/');
    const partesCaminho = caminho.split('/');
    if (partesPadrao.length !== partesCaminho.length) return null;
    const params = {};
    for (let i = 0; i < partesPadrao.length; i++) {
      const p = partesPadrao[i];
      if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(partesCaminho[i]);
      else if (p !== partesCaminho[i]) return null;
    }
    return params;
  }
  return padrao === caminho ? {} : null;
}

function criarRoteador() {
  const rotas = [];

  return {
    rota(metodo, padrao, handler) {
      rotas.push({ metodo, padrao, handler });
    },
    async responder(request) {
      const url = new URL(request.url);
      for (const r of rotas) {
        if (r.metodo !== request.method) continue;
        const params = casar(r.padrao, url.pathname);
        if (params === null) continue;
        /* O ERRO QUE TEM NOME NÃO REBENTA O WORKER (15/11/2026).
         *
         * Um `throw` que ninguém apanha sai do Worker como `error code: 1101` — «excepção de
         * JavaScript», sem corpo e sem dizer nada a quem está a olhar para a ficha. Aconteceu ao
         * vivo: um envelope cifrado com a chave anterior da escola deixou de abrir quando a chave
         * passou a ser derivada da mestra, e a ficha ficou em branco.
         *
         * Apanha-se AQUI, e não em cada rota, porque são dez rotas a ler envelopes e a próxima
         * que aparecer herdaria o defeito. O contrato é o que o erro traz consigo: `status` para a
         * resposta e `message` para quem lê. Um erro SEM nome continua a subir — quem o atirou não
         * declarou que sabe o que ele significa, e engoli-lo esconderia defeitos a sério. */
        let resultado;
        try {
          resultado = await r.handler({ request, url, params });
        } catch (erro) {
          if (!erro || !erro.nome || erro.nome === 'Error' || !erro.status) throw erro;
          return new Response(JSON.stringify({ ok: false, erro: erro.message }, null, 2) + '\n', {
            status: erro.status,
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Cache-Control': 'no-store, max-age=0',
            },
          });
        }
        if (resultado instanceof Response) return resultado;
        // O objeto devolvido por um handler é JSON do ATO presente (o mapa, as listas,
        // os estados): sai `no-store` para o navegador nunca desenhar o conteúdo de ontem.
        return new Response(JSON.stringify(resultado, null, 2) + '\n', {
          status: 200,
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Cache-Control': 'no-store, max-age=0',
          },
        });
      }
      return new Response(JSON.stringify({ ok: false, erro: 'nao encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    },
  };
}

module.exports = { criarRoteador };
