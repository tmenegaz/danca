'use strict';

/**
 * disparar.js — o gatilho da geração: o Worker pede ao GitHub Actions que gere.
 *
 * A geração (pandoc/pdflatex → HTML + PDF + menu) NÃO roda num Worker: workerd é
 * JavaScript/Wasm, e o `tools/gerar-ciclo.sh` precisa de Node, Python e TeX. Por
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
 *     professor: 'fokini', ciclo: '01', escola: 'diaghilev',
 *   });
 */

const ACEITE = 'application/vnd.github+json';
const API_VERSAO = '2022-11-28';

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
      inputs: { professor, ciclo, escola },
    }),
  });

  return { status: resposta.status, ok: resposta.status >= 200 && resposta.status < 300 };
}

/**
 * Monta o disparador pronto para a ponte: recebe o token (do env) e o alvo
 * (dono/repo/workflow), e devolve a função que a rota chama com o `contexto`
 * do PO. Sem token devolve `null` — em desenvolvimento não há o que disparar, e
 * a elicitação continua intacta.
 */
function criarDisparador({ token, dono, repo, workflow, ref }) {
  if (!token) return null;
  return async (contexto) => {
    const ctx = contexto || {};
    return dispararGeracao({
      token,
      dono,
      repo,
      workflow,
      ref,
      professor: ctx.professor,
      ciclo: ctx.ciclo,
      escola: ctx.escola,
    });
  };
}

module.exports = { dispararGeracao, criarDisparador, ACEITE, API_VERSAO };
