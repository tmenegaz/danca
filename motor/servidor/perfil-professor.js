'use strict';

/**
 * perfil-professor.js — O PERFIL DO PROFESSOR, ESCRITO NO REPOSITÓRIO (03/11/2026).
 *
 * A DECISÃO DELA, e a razão de o perfil não viver no KV:
 *
 *   «As habilidades do professor vivem no registro da entidade do Professor
 *    (`professores/<slug>/perfil.json`), de forma independente do tenant da escola. Ao acionar a
 *    rotina de expurgo de uma escola, os dados operacionais do tenant são removidos, mas o perfil
 *    do professor e as suas declarações de habilitação pedagógica devem ser mantidos preservados
 *    e intactos.»
 *
 * PORQUE O REPOSITÓRIO E NÃO O KV. O KV de uma escola tem o prefixo dela (`bastidores/<escola>/`)
 * — é o cofre do TENANT. Guardar ali a habilitação faria dela um dado da escola, e o expurgo
 * levaria consigo a competência da pessoa: o professor ficaria sem saber ensinar no dia em que a
 * escola fechasse. É o contrário do que a decisão diz. No repositório, `professores/<slug>/` é do
 * **sistema**, não da escola (é o que o `professores/README.md` já declarava), e o expurgo não lhe
 * toca.
 *
 * O QUE ESTE MÓDULO FAZ: lê e grava UM ficheiro, por HTTP, com o token do repositório. A regra —
 * o que é um perfil válido, quem está habilitado, que turmas ficaram sem quem as ensine — está em
 * `motor/nucleo/perfil-do-professor.js`, e não se repete aqui.
 */

const nucleo = require('../nucleo/perfil-do-professor.js');

const ACEITE = 'application/vnd.github+json';
const API_VERSAO = '2022-11-28';

/** O caminho do perfil — uma pasta por professor, um ficheiro só. */
function caminhoDoPerfil(slug) {
  const s = String(slug || '').trim();
  if (!s) return '';
  return 'professores/' + s + '/perfil.json';
}

function cabecalhos(token) {
  return {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'Content-Type': 'application/json',
    'User-Agent': 'danca-perfil',
  };
}

function decodificarBase64(texto) {
  const limpo = String(texto || '').replace(/\s+/g, '');
  if (!limpo) return '';
  const binario = atob(limpo);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function codificarBase64(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let binario = '';
  for (let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i]);
  return btoa(binario);
}

/**
 * LÊ O PERFIL DE UM PROFESSOR.
 *
 * UM 404 NÃO É UM ERRO: é o estado de hoje — nenhum professor tem perfil ainda, e a decisão é
 * nova. Devolve `ok: true` com `perfil: null` e `existe: false`, para quem chama poder dizer «não
 * declarado» em vez de «falhou». A distinção importa: uma falha de rede e a ausência do dado
 * pedem coisas diferentes de quem lê.
 */
async function lerPerfil({ f, token, dono, repo, ref, slug }) {
  const caminho = caminhoDoPerfil(slug);
  if (!caminho) return { ok: false, status: 400, erro: 'informe o professor' };
  if (!token) return { ok: false, status: 401, erro: 'sem token do repositório' };

  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho
    + (ref ? '?ref=' + encodeURIComponent(ref) : '');
  let resposta;
  try {
    resposta = await f(url, { method: 'GET', headers: cabecalhos(token) });
  } catch (erro) {
    return { ok: false, status: 502, erro: 'não foi possível ler o perfil: ' + (erro && erro.message) };
  }
  if (resposta.status === 404) return { ok: true, existe: false, perfil: null, sha: null };
  if (resposta.status !== 200) {
    let corpo = '';
    try { corpo = await resposta.text(); } catch { corpo = ''; }
    return { ok: false, status: resposta.status, erro: 'o repositório recusou a leitura do perfil (HTTP '
      + resposta.status + '): ' + corpo.slice(0, 200) };
  }
  const dados = await resposta.json();
  let perfil;
  try {
    perfil = JSON.parse(decodificarBase64(dados.content || ''));
  } catch (erro) {
    return { ok: false, status: 502, erro: 'o perfil do repositório não é JSON válido' };
  }
  if (!perfil || typeof perfil !== 'object' || Array.isArray(perfil)) {
    return { ok: false, status: 502, erro: 'o perfil do repositório não é um objecto' };
  }
  return { ok: true, existe: true, perfil, sha: dados.sha || null };
}

/**
 * GRAVA O PERFIL — com o `sha` de onde se leu, para não escrever por cima de outra escrita.
 *
 * O `criado` NÃO SE REESCREVE quando o perfil já existe: é a data em que a pessoa nasceu no
 * sistema, e sobrescrevê-la a cada gravação apagaria a única data que diz «desde quando». É a
 * mesma regra do `atualizado` no lado oposto — um campo que sempre diz «agora» não diz nada.
 */
async function gravarPerfil({ f, token, dono, repo, ref, slug, perfil, sha, mensagem }) {
  const caminho = caminhoDoPerfil(slug);
  if (!caminho) return { ok: false, status: 400, erro: 'informe o professor' };
  if (!token) return { ok: false, status: 401, erro: 'sem token do repositório' };
  // O `atualizado` É O MOMENTO DA ESCRITA, e quem o sabe é o servidor. Sem isto, o campo saía
  // vazio em toda a gravação — e um campo que nunca diz quando foi mexido não diz nada.
  const validado = nucleo.normalizarPerfil(perfil, { hoje: new Date().toISOString().slice(0, 10) });
  if (!validado.ok) return { ok: false, status: 400, erro: validado.erros.join('; '), erros: validado.erros };

  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho;
  const corpo = JSON.stringify(Object.assign({}, validado.perfil, {
    _nota: 'O PERFIL DO PROFESSOR — a habilitação é da PESSOA, não da escola (03/11/2026). '
      + '`modalidades` é o que este professor declara saber ensinar; a escola oferece o que os '
      + 'professores dela declaram, por derivação. O expurgo de uma escola NÃO apaga este '
      + 'ficheiro: a competência de quem ensina não é dado do tenant.',
  }), null, 2) + '\n';

  let resposta;
  try {
    resposta = await f(url, {
      method: 'PUT',
      headers: cabecalhos(token),
      body: JSON.stringify({
        message: mensagem || ('perfil(professor): habilitar ' + slug + ' em '
          + (validado.perfil.modalidades.join(', ') || 'nenhuma modalidade')),
        content: codificarBase64(corpo),
        ...(ref ? { branch: ref } : {}),
        ...(sha ? { sha } : {}),
      }),
    });
  } catch (erro) {
    return { ok: false, status: 502, erro: 'não foi possível gravar o perfil: ' + (erro && erro.message) };
  }
  let dados = {};
  try { dados = await resposta.json(); } catch { dados = {}; }
  return {
    ok: resposta.status >= 200 && resposta.status < 300,
    status: resposta.status,
    erro: resposta.status >= 200 && resposta.status < 300 ? '' : 'o repositório recusou a gravação (HTTP '
      + resposta.status + ')',
    commit: (dados.commit && dados.commit.sha) || null,
    perfil: validado.perfil,
  };
}

module.exports = {
  caminhoDoPerfil,
  lerPerfil,
  gravarPerfil,
};
