'use strict';

/**
 * disparar.js — o gatilho da geração: o Worker pede ao GitHub Actions que gere.
 *
 * A geração (pandoc → HTML + menu) NÃO roda num Worker: workerd é
 * JavaScript/Wasm, e o `tools/gerar-ciclo.sh` precisa de Node, Python e pandoc. Por
 * isso o Worker não gera — ele DISPARA. O alvo é o workflow
 * `.github/workflows/gerar-ciclo.yml` (um `workflow_dispatch` com os inputs
 * `professor`/`ciclo`/`escola`), chamado pela API REST do GitHub.
 *
 * Este módulo é o CLIENTE desse dispatch. É infraestrutura (uma chamada HTTP de
 * saída), não lógica do motor — por isso vive em `servidor/`, não em `nucleo/`.
 * Ele só usa `fetch` (Web Standard): corre igual no Node e no Worker.
 *
 * O token nunca é lido aqui de dentro: chega por parâmetro (injeção). Quem
 * injeta é a ponte (node.js/cloudflare.js), a partir de `env.GITHUB_TOKEN` — a
 * chave não toca o núcleo nem é registrada em lugar nenhum.
 *
 *   const r = await dispararGeracao({
 *     token, dono: 'tmenegaz', repo: 'danca', workflow: 'gerar-ciclo.yml',
 *     professor: 'tiago', ciclo: '01', escola: 'maria',
 *   });
 */

const ACEITE = 'application/vnd.github+json';
const API_VERSAO = '2022-11-28';

// A composição do nome do pacote/`.conf` — a MESMA que escreve o plano.
const { varianteDoContexto } = require('./escrever-po.js');

/**
 * Dispara o workflow de geração. Devolve `{ status, ok }` — a resposta da API
 * (o dispatch aceite responde 204, sem corpo). `fetchImpl` é injetável para as
 * provas não precisarem de rede.
 */
async function dispararGeracao({
  token,
  dono,
  repo,
  workflow,
  ref,
  professor,
  ciclo,
  escola,
  variante,
  fetchImpl,
}) {
  if (!token) throw new Error('disparo sem token: injete GITHUB_TOKEN na ponte');

  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo +
    '/actions/workflows/' + workflow + '/dispatches';

  const resposta = await f(url, {
    method: 'POST',
    headers: {
      'Accept': ACEITE,
      'Authorization': 'Bearer ' + token,
      'X-GitHub-Api-Version': API_VERSAO,
      'Content-Type': 'application/json',
      // O GitHub exige um User-Agent; o `fetch` do Worker não o envia por padrão.
      'User-Agent': 'danca-worker',
    },
    body: JSON.stringify({
      ref: ref || 'main',
      inputs: { professor, ciclo, escola, variante: variante || '' },
    }),
  });

  /* O ESTADO VAI NA RESPOSTA (10/11/2026). Sem ele, um disparo recusado virava `{ok:false}` e
   * mais nada — e a cadeia, que não tinha o que dizer, escrevia «a geração não partiu» sobre um
   * HTTP 403. Um número não explica tudo, mas é o que diz se é permissão, se é o workflow que não
   * existe, se é o token — e é a diferença entre pedir ajuda e adivinhar. */
  const ok = resposta.status >= 200 && resposta.status < 300;
  return {
    status: resposta.status,
    ok,
    erro: ok ? null : 'o GitHub recusou o disparo (HTTP ' + resposta.status + ')',
  };
}

/**
 * Monta o disparador pronto para a ponte: recebe o token (do env) e o alvo
 * (dono/repo/workflow), e devolve a função que a rota chama com o `contexto`
 * do PO. Sem token devolve `null` — em desenvolvimento não há o que disparar, e
 * a elicitação continua intacta.
 *
 * DOIS SLUGS, E ELES NÃO SÃO O MESMO (19/10/2026).
 *
 * O `.conf` que o plano compõe — com os `DOCS`, o `DATA_INICIO` e o `TOTAL_AULAS` da
 * TURMA — chama-se `ciclo-<ciclo>-<escola>-<turma>.conf`, e o pacote que o gerador
 * escreve chama-se igual. Mas o WORKER que publica chama-se pelo slug da ESCOLA:
 * `wrangler.<escola>.jsonc`. Mandar um só slug fazia o gerador ler o `.conf` da escola
 * (um esqueleto, `DOCS=""`) e morrer com «DOCS está vazio»; mandar a variante no lugar
 * da escola faria o passo do deploy procurar um `wrangler.<variante>.jsonc` que não
 * existe. São duas identidades: o CONTEÚDO é da variante, o SITE é da escola.
 *
 *   · `escola`   → o Worker (`wrangler.<escola>.jsonc`) e o nome do site;
 *   · `variante` → o `.conf`, o pacote e a âncora (`<escola>-<turma>`).
 *
 * Sem turma no contexto, a variante É a escola — o caso das escolas de uma turma só,
 * e o comportamento anterior fica intacto (a prova confere os dois).
 */
function criarDisparador({ token, dono, repo, workflow, ref, cota }) {
  if (!token) return null;
  return async (contexto) => {
    const ctx = contexto || {};
    /* A COTA, ANTES DO DISPARO (25/11/2026) — e o sítio é este, e não uma rota.
     *
     * O ciclo nasce por TRÊS pontes (`bastidores.js`, `node.js`, `cloudflare.js`), todas por esta
     * função. Uma trava numa rota só deixaria as outras duas abertas, e o sintoma seria o pior de
     * todos: o teto a funcionar no botão A e a não funcionar no botão B. A regra é uma, e vive onde
     * as três passam.
     *
     * A verificação é ANTES do `workflow_dispatch` porque depois dele o custo já foi pago e o ciclo
     * já existe. `cota` é injectada por quem tem o KV; sem ela nada é travado, e a prova declara
     * quais pontes a fornecem — uma ponte muda é uma porta aberta em silêncio. */
    if (typeof cota === 'function') {
      const veredicto = await cota(ctx);
      if (veredicto && veredicto.ok === false) {
        return { ok: false, motivo: 'cota', erro: veredicto.erro || 'o limite de ciclos desta escola já foi atingido' };
      }
    }
    return dispararGeracao({
      token,
      dono,
      repo,
      workflow,
      ref,
      professor: ctx.professor,
      ciclo: ctx.ciclo,
      escola: ctx.escola,
      variante: varianteDoContexto(ctx),
    });
  };
}

module.exports = { dispararGeracao, criarDisparador, ACEITE, API_VERSAO };
