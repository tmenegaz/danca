#!/usr/bin/env node
'use strict';

/**
 * provar-ponte-do-worker.js — o Worker fala com a REDE, e não consigo mesmo.
 *
 * O DEFEITO QUE ISTO TRAVA (08/11/2026). A ponte (`motor/servidor/cloudflare.js`) exporta o
 * entrypoint como `fetch` — é o nome que o `workers/principal.js` importa. Quando o orçamento de
 * subpedidos passou a embrulhar o `fetch` para o contar, embrulhou **o entrypoint**:
 *
 *     const subpedidos = contarSubpedidos(fetch, …);   // ← este `fetch` é o DESTE módulo
 *
 * Cada leitura do acervo virou uma **chamada recursiva** a esta própria função, com uma `Request`
 * que era uma string e um `env` que era o `init`. A recursão não chegava ao GitHub: caía no
 * bootstrap, que responde **500** quando o conteúdo não veio do ASSETS — e o acervo reportava
 * `acervo: leitura de envelope/.indice.json: HTTP 500`.
 *
 * O SINTOMA, na tela dela: a escola nova (a `calango`) não gravava a anamnese («não há acesso ao
 * envelope»), e as listas respondiam «não foi possível ler a lista agora». Parecia permissão,
 * token, escola. Era o nome de uma função a apontar para o sítio errado.
 *
 * O QUE ESTA PROVA MEDE — no entrypoint VERDADEIRO, com a rede substituída:
 *
 *   A. a leitura do índice CHEGA À REDE, no endereço do acervo da escola do pedido;
 *   B. a rota responde **200** com a lista, e não o 500 do bootstrap;
 *   C. o texto «conteúdo ou esquema ausentes no ASSETS» — a assinatura da recursão — não aparece
 *      em resposta nenhuma (é o que a recursão devolvia, e é o que se lia como erro do acervo);
 *   D. as duas listas que ela viu a responder 503 (planos e estados da anamnese) respondem 200;
 *   E. o `POST /api/elicitar` da anamnese ESCREVE pela mesma rede (o `PUT` do envelope sai do
 *      mesmo `subpedidos` — a linha é uma só para o acervo e para os escritores).
 *
 * Contraprova: no código de antes, A/B/D reprovam (a rede não é chamada nenhuma vez e o status é
 * 500). Ver o REGISTRO de 08/11/2026.
 *
 *   node experimentos/provar-ponte-do-worker.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'calango';
const PROFESSOR = 'pe-torto';
const CICLO = '01';

/* A REDE DE MENTIRA. Serve o acervo da escola no repositório e conta o que lhe pedem — é a única
 * forma de saber se o Worker chegou à NET ou se ficou a falar consigo mesmo. */
function redeFalsa() {
  const chamadas = [];
  const f = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const u = String(url && url.url ? url.url : url);
    chamadas.push({ metodo, url: u });
    const json = (o, status) => ({
      ok: (status || 200) < 300, status: status || 200,
      json: async () => o, text: async () => JSON.stringify(o),
    });
    const m = /\/contents\/([^?]+)/.exec(u);
    if (m) {
      const caminho = decodeURIComponent(m[1]);
      if (/envelopes\/\.indice\.json$/.test(caminho)) {
        const corpo = {
          versao: 4,
          nomes: ['anamnese-' + CICLO + '-1.json', 'plano-' + CICLO + '-1.json'],
          resumos: {
            ['anamnese-' + CICLO + '-1.json']: { tipo: 'anamnese', apelido: 'Aluna A', gerado_em: '2026-11-08T12:00' },
            ['plano-' + CICLO + '-1.json']: { tipo: 'plano', rotulo: 'Turma de teste', turma: 'sala rosa', gerado_em: '2026-11-08T12:10' },
          },
        };
        return json({ sha: 'idx', content: Buffer.from(JSON.stringify(corpo)).toString('base64') });
      }
      if (metodo === 'PUT') return json({ content: { sha: 'novo' }, commit: { sha: 'c1' } }, 201);
      return json({ message: 'Not Found' }, 404);
    }
    return json({ message: 'Not Found' }, 404);
  };
  return { fetch: f, chamadas };
}

/* O ENV da bancada: uma escola com o essencial. O ASSETS responde ao bootstrap da porta (é o
 * `{}` que faz o `montarPorta` montar o roteador de verdade). */
function ambiente() {
  return {
    ESCOLA_SLUG: ESCOLA,
    ESCOLA_HABILITADA: 'sim',
    PROFESSOR_NOME: 'Pe Torto',
    GITHUB_TOKEN: 'token-de-bancada',
    PADD_KV: {
      async get() { return null; },
      async put() {},
      async delete() {},
      async list() { return { keys: [] }; },
    },
    /* O ASSETS serve a PORTA DE VERDADE (`porta/`), e não um `{}`: o conteúdo da anamnese é o
     * contrato que a elicitação lê, e um fixture magro mediria o fixture. É o mesmo que o pacote
     * publicado tem — a porta é copiada para `plano-observacao/` com estes arquivos dentro. */
    ASSETS: {
      async fetch(pedido) {
        const url = String(pedido && pedido.url ? pedido.url : pedido);
        const caminho = new URL(url, 'https://assets.local').pathname.replace(/^\/+/, '');
        const rel = caminho.replace(/^plano-observacao\//, '');
        const abs = path.join(RAIZ, 'porta', rel);
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
          return new Response(fs.readFileSync(abs), { status: 200 });
        }
        return new Response('{}', { status: 200 });
      },
    },
  };
}

(async () => {
  const rede = redeFalsa();
  // A REDE ENTRA ANTES DO `require`: é `globalThis.fetch` que a ponte consulta (ver o alias
  // `buscarNaRede`). Substituí-la depois também funcionaria — a consulta é em tempo de chamada —,
  // mas assim a bancada não depende dessa ordem.
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = rede.fetch;

  let ponte;
  try {
    ponte = require(path.join(RAIZ, 'motor/servidor/cloudflare.js'));
  } finally {
    globalThis.fetch = fetchOriginal;
  }

  const env = ambiente();
  /* UM PEDIDO À PONTE, com a rede trocada. A excepção NÃO sobe: em produção ela chega ao
   * Cloudflare como «error code: 1101» (o Worker morreu), e é isso que a bancada tem de poder
   * medir — um `catch` que devolve o mesmo `{status, corpo}` que uma rota daria. Sem isto, a
   * contraprova explodia em vez de reprovar, e uma prova que explode não diz o que falhou. */
  const chamar = async (caminho, init) => {
    globalThis.fetch = rede.fetch;
    try {
      const init2 = Object.assign({ method: 'GET' }, init || {});
      const r = await ponte.fetch(new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho, init2), env);
      const corpo = await r.text();
      return { status: r.status, corpo, texto: async () => corpo };
    } catch (erro) {
      return { status: 500, corpo: 'EXCEÇÃO: ' + erro.message, texto: async () => 'EXCEÇÃO: ' + erro.message };
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  };

  // ==========================================================================================
  console.log('\nA. A LEITURA DO ÍNDICE CHEGA À REDE');

  rede.chamadas.length = 0;
  {
    const r = await chamar('/api/envelopes');
    const corpo = r.corpo;
    const doAcervo = rede.chamadas.filter((c) => /envelopes\/\.indice\.json/.test(c.url));
    provar('a rede foi chamada no endereço do acervo da escola do pedido',
      doAcervo.length >= 1
        && /^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\/escola\/calango\/envelopes\/\.indice\.json/.test(doAcervo[0].url),
      doAcervo.map((c) => c.url));
    provar('…e a rota responde 200 com a lista', r.status === 200, { status: r.status, corpo: corpo.slice(0, 120) });
    provar('…com os nomes que o índice guarda', /anamnese-0?1-1/.test(corpo) && /plano-0?1-1/.test(corpo),
      corpo.slice(0, 200));
    provar('…e SEM a assinatura da recursão («conteúdo ou esquema ausentes»)',
      !/conteúdo ou esquema ausentes/.test(corpo), corpo.slice(0, 200));
  }

  // ==========================================================================================
  console.log('\nD. AS DUAS LISTAS QUE ELA VIU A RESPONDER 503');

  for (const [rotulo, caminho] of [
    ['os planos', '/api/planos?professor=' + PROFESSOR],
    ['os estados da anamnese', '/api/anamnese-estados'],
  ]) {
    rede.chamadas.length = 0;
    const r = await chamar(caminho);
    const corpo = r.corpo;
    let json = null;
    try { json = JSON.parse(corpo); } catch (e) { json = null; }
    provar(rotulo + ' respondem 200', r.status === 200, { status: r.status, corpo: corpo.slice(0, 140) });
    provar('…e a resposta é o contrato `ok: true`', Boolean(json && json.ok === true),
      json ? Object.keys(json) : corpo.slice(0, 120));
    provar('…e os dados vieram da rede', rede.chamadas.length >= 1, rede.chamadas.map((c) => c.url));
  }

  // ==========================================================================================
  console.log('\nE. A ESCRITA DA ANAMNESE SAI PELA MESMA REDE');

  {
    rede.chamadas.length = 0;
    const r = await chamar('/api/elicitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        respostas: { 'idade': '12/03/2015', 'categoria-etaria': 'Infantil' },
        contexto: { escola: ESCOLA, professor: PROFESSOR, ciclo: CICLO, aluna: 'Aluna A' },
        fonte: 'anamnese',
      }),
    });
    const corpo = r.corpo;
    const escritas = rede.chamadas.filter((c) => c.metodo === 'PUT');
    provar('o «Guardar» da anamnese responde 200', r.status === 200, { status: r.status, corpo: corpo.slice(0, 200) });
    provar('…e grava o envelope pela rede (um `PUT` no acervo)',
      escritas.some((c) => /\/contents\/escola\/calango\/envelopes\//.test(c.url)),
      rede.chamadas.map((c) => c.metodo + ' ' + c.url));
    provar('…sem cair na recursão', !/conteúdo ou esquema ausentes/.test(corpo), corpo.slice(0, 120));
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + (n - falhas) + ' de ' + n + ' asserções passaram');
    process.exit(1);
  }
  console.log('PASSOU — ' + n + ' de ' + n + ' asserções');
})();
