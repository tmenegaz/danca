'use strict';

/**
 * escrever-po.js — a outra metade da ponte: o Worker escreve a FONTE do PO no repositório.
 *
 * A derivação (`nucleo/derivar-po.js`) vira o `ciclo-XX-<escola>-po.md`; este módulo o
 * entrega ao GitHub pelo Contents API (PUT). É o que faz o PO elicitado deixar o KV e passar
 * a existir como FONTE versionada — a mesma que `tools/hash-ciclo.sh` ancora e
 * `tools/gerar-ciclo.sh` gera. O commit resultante dispara o `reancorar.yml` já existente.
 *
 * É infraestrutura (uma chamada HTTP de saída), não lógica: vive em `servidor/`, não em
 * `nucleo/`. Só usa `fetch` (Web Standard) — corre igual no Node e no Worker. O token chega
 * por parâmetro (injeção), nunca é lido daqui de dentro.
 *
 *   const escritor = criarEscritorDePO({ token, dono, repo });
 *   await escritor({ caminho: 'professores/fokini/ciclos/ciclo-01-diaghilev-po.md', conteudo, mensagem });
 */

const ACEITE = 'application/vnd.github+json';
const API_VERSAO = '2022-11-28';

// Base64 em UTF-8 SEM `Buffer` (global do Node, ausente no Workers runtime): o `btoa` é
// Web Standard, mas só cobre Latin-1 — a ponte é o TextEncoder/TextDecoder, nos dois.
function base64De(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}

/**
 * O caminho da fonte a partir do contexto do ato — a MESMA regra de `hash-ciclo.sh`
 * (`ARQUIVO_PO="$BASE/ciclo-$CICLO-$VARIANTE-po.md"`). O `professor` do contexto é o SLUG da
 * pasta (é o que a barra do formulário pré-preenche); se a escola/professor vierem em branco,
 * o caminho não pode ser composto e o escritor devolve erro — nunca grava num lugar adivinhado.
 */
function caminhoDoPO(contexto) {
  const ctx = contexto || {};
  const professor = String(ctx.professor || '').trim();
  const ciclo = String(ctx.ciclo || '').trim().padStart(2, '0');
  const escola = String(ctx.escola || '').trim();
  if (!professor || !ciclo || !escola) {
    throw new Error('contexto incompleto para a fonte do PO: precisa de professor, ciclo e escola');
  }
  return 'professores/' + professor + '/ciclos/ciclo-' + ciclo + '-' + escola + '-po.md';
}

/**
 * Escreve (cria ou atualiza) a fonte. Se o arquivo já existe, o Contents API exige o `sha`
 * atual — por isso ele é buscado antes do PUT. Devolve `{ status, ok, criado, atualizado }`.
 * `fetchImpl` é injetável para as provas.
 */
async function escreverPO({ token, dono, repo, caminho, conteudo, mensagem, ref, fetchImpl }) {
  if (!token) throw new Error('escrita sem token: injete GITHUB_TOKEN na ponte');

  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho;
  const cabecalhos = {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'Content-Type': 'application/json',
    // O GitHub exige um User-Agent; o `fetch` do Worker não o envia por padrão,
    // e sem ele a API responde 403 («Request forbidden by administrative rules»).
    'User-Agent': 'danca-worker',
  };

  // O `sha` atual, para atualizar sem apagar o histórico (a proveniência acrescenta, não edita).
  let sha = null;
  const atual = await f(url, { method: 'GET', headers: cabecalhos });
  if (atual.status === 200) {
    const dados = await atual.json();
    sha = dados.sha || null;
  } else if (atual.status !== 404) {
    let corpo = '';
    try { corpo = await atual.text(); } catch { corpo = ''; }
    return { status: atual.status, ok: false, criado: false, atualizado: false, erro: 'leitura do sha: HTTP ' + atual.status + ' — ' + corpo.slice(0, 300) };
  }

  const corpo = {
    message: mensagem || 'feat(po): o PO elicitado vira a fonte do ciclo',
    content: base64De(conteudo),
    ...(ref ? { branch: ref } : {}),
    ...(sha ? { sha } : {}),
  };

  const resposta = await f(url, { method: 'PUT', headers: cabecalhos, body: JSON.stringify(corpo) });
  const ok = resposta.status >= 200 && resposta.status < 300;
  return {
    status: resposta.status,
    ok,
    criado: ok && !sha,
    atualizado: ok && Boolean(sha),
  };
}

/**
 * Monta o escritor pronto para a ponte. Sem token devolve `null` (a elicitação continua
 * intacta). Devolve `(envelope, mensagem) => Promise` — a rota passa o documento elicitado e
 * o escritor deriva o Markdown e o caminho, e grava.
 */
function criarEscritorDePO({ token, dono, repo, ref, derivarPO }) {
  if (!token || !derivarPO) return null;
  return async (envelope, mensagem) => {
    const contexto = (envelope && envelope.contexto) || {};
    const caminho = caminhoDoPO(contexto);
    const { markdown } = derivarPO(envelope);
    return escreverPO({ token, dono, repo, ref, caminho, conteudo: markdown, mensagem });
  };
}

module.exports = { escreverPO, criarEscritorDePO, caminhoDoPO, ACEITE, API_VERSAO };
