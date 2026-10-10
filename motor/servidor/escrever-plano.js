'use strict';

/**
 * escrever-plano.js — a metade da ponte do PLANO: o Worker escreve a FONTE do
 * plano (`ciclo-XX-<escola>-plano.md`) no repositório e, quando é a PRIMEIRA
 * fonte do ciclo (o `DOCS` ainda está vazio), liga o manifesto da variante a
 * `DOCS="plano"` — o que liga o plano à geração (o gerador exige `DOCS`
 * não-vazio).
 *
 * É o irmão do `escrever-po.js`: a derivação (`nucleo/derivar-plano-ciclo.js`)
 * vira o Markdown da fonte, e a escrita é a MESMA chamada do Contents API
 * (`escreverPO`), reutilizada. Sem token devolve `null` (a elicitação continua
 * intacta).
 */

const { escreverPO, ACEITE, API_VERSAO } = require('./escrever-po.js');
const { derivarPlano } = require('../nucleo/derivar-plano-ciclo.js');

// Base64 em UTF-8 SEM `Buffer` (ausente no Workers runtime): o par de ponte
// TextEncoder/TextDecoder, nos dois sentidos.
function codificarBase64(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}
function decodificarBase64(b64) {
  const binario = atob(String(b64).replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * O caminho da fonte a partir do contexto — a MESMA regra do `-po.md`
 * (`caminhoDoPO`), trocando o sufixo por `-plano.md`. O `professor` é o SLUG da
 * pasta; sem escola/professor/ciclo, o caminho não pode ser composto e o
 * escritor devolve erro — nunca grava num lugar adivinhado.
 */
function caminhoDoPlano(contexto) {
  const ctx = contexto || {};
  const professor = String(ctx.professor || '').trim();
  const ciclo = String(ctx.ciclo || '').trim().padStart(2, '0');
  const escola = String(ctx.escola || '').trim();
  if (!professor || !ciclo || !escola) {
    throw new Error('contexto incompleto para a fonte do plano: precisa de professor, ciclo e escola');
  }
  return 'professores/' + professor + '/ciclos/ciclo-' + ciclo + '-' + escola + '-plano.md';
}

/** O caminho do manifesto da variante — o `.conf` que o gerador lê. */
function caminhoDoConf(contexto) {
  const ctx = contexto || {};
  const professor = String(ctx.professor || '').trim();
  const ciclo = String(ctx.ciclo || '').trim().padStart(2, '0');
  const escola = String(ctx.escola || '').trim();
  return 'professores/' + professor + '/ciclos/ciclo-' + ciclo + '-' + escola + '.conf';
}

/**
 * Liga o plano à geração: se o `DOCS` do manifesto ainda está vazio (o ciclo
 * nasceu do zero), vira `DOCS="plano"` — a primeira fonte do ciclo. É
 * best-effort e idempotente: um `DOCS` já preenchido não é tocado.
 */
async function atualizarDocsDoConf({ token, dono, repo, ref, contexto, fetchImpl }) {
  if (!token) return { ok: false, erro: 'sem token' };
  const f = fetchImpl || fetch;
  const caminho = caminhoDoConf(contexto);
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho;
  const cabecalhos = {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'Content-Type': 'application/json',
  };

  const atual = await f(url, { method: 'GET', headers: cabecalhos });
  if (atual.status !== 200) {
    return { ok: false, erro: 'leitura do .conf: HTTP ' + atual.status };
  }
  const dados = await atual.json();
  const sha = dados.sha || null;
  const texto = decodificarBase64(dados.content || '');
  const novo = texto.replace(/^DOCS=""[ \t]*$/m, 'DOCS="plano"');
  if (novo === texto) {
    return { ok: true, atualizado: false, nota: 'DOCS já não está vazio' };
  }

  const resposta = await f(url, {
    method: 'PUT',
    headers: cabecalhos,
    body: JSON.stringify({
      message: 'feat(plano): o plano elicitado passa a ser o primeiro DOCS do ciclo',
      content: codificarBase64(novo),
      ...(ref ? { branch: ref } : {}),
      ...(sha ? { sha } : {}),
    }),
  });
  const ok = resposta.status >= 200 && resposta.status < 300;
  return { ok, atualizado: ok, status: resposta.status };
}

/**
 * Monta o escritor do plano. Sem token devolve `null`. Devolve
 * `(envelope, mensagem) => Promise` — deriva o Markdown, grava, e liga o DOCS.
 */
function criarEscritorDePlano({ token, dono, repo, ref }) {
  if (!token) return null;
  return async (envelope, mensagem) => {
    const contexto = (envelope && envelope.contexto) || {};
    const caminho = caminhoDoPlano(contexto);
    const { markdown } = derivarPlano(envelope);
    const escrita = await escreverPO({ token, dono, repo, ref, caminho, conteudo: markdown, mensagem });
    const docs = await atualizarDocsDoConf({ token, dono, repo, ref, contexto });
    return Object.assign({}, escrita, { docs });
  };
}

module.exports = {
  caminhoDoPlano,
  caminhoDoConf,
  criarEscritorDePlano,
  atualizarDocsDoConf,
  codificarBase64,
  decodificarBase64,
};
