'use strict';

/**
 * acervo-anamneses.js — a ANAMNESE no repositório, e não só no KV.
 *
 * O QUE MOTIVOU (19/10/2026). O professor fez as anamneses, foi ver os workflows e não estava
 * nada. A medição no código confirmou o pior: **a anamnese nunca chegou ao Git**. Ela tinha dois
 * destinos, ambos no KV (o envelope e o cofre cifrado), e nenhum escritor de Git existia —
 * `ls motor/servidor/escrever-*.js` dava plano, po e ciclo, nunca anamnese. As respostas das
 * alunas viviam num único sítio, e o KV não é um sítio: é um cache com cota diária.
 *
 * A REGRA DA CASA, aplicada aqui. A anamnese é registro da ESCOLA, não da sessão de quem a
 * preencheu: o professor pode levar dias até fazer o plano de ensino, e outro professor noutro
 * computador tem de a ver sem esperar por nada. Então ela vai para o repositório — e o KV fica
 * como cache, não como autoridade.
 *
 * O DESENHO, em três decisões:
 *
 *   1. O NOME DO ARQUIVO CARREGA A CHAVE. `escola/<escola>/anamneses/<apelido>--<carimbo>.json`
 *      — o `apelido` percent-codificado (é perda nenhuma: `decodeURIComponent` devolve-o como
 *      foi escrito, e o PO guarda o apelido byte a byte) e o carimbo do envelope. Assim a
 *      LISTAGEM é UMA chamada (`git/trees?recursive=1`), sem ficheiro de índice para manter, e
 *      sem o risco de o índice divergir do dado — que é o defeito que o `envelope/.indice.json`
 *      teve de aprender a tolerar no KV.
 *
 *   2. O METADADO EM CLARO, AS RESPOSTAS CIFRADAS. `id`, `contexto` (escola, professor, ciclo,
 *      aluna) e `gerado_em` ficam legíveis — são o que a listagem precisa e não dizem nada de
 *      ninguém além do apelido estável (P-12). As respostas vão num `_cifrado` com a
 *      `SENHA_CRIPTO` da escola, o mesmo envelope do cofre e do `-dados.json`, decifrável pelo
 *      mesmo `tools/lib-cifra.js`. Dado de menor não entra em claro num repositório.
 *
 *   3. O CONFLITO DO `PUT` REPETE-SE. A Contents API exige o `sha` atual; dois «Guardar»
 *      simultâneos (dois professores, dois isolates) fazem o segundo falhar com 409. O escritor
 *      relê o `sha` e repete — não se perde a anamnese de ninguém por uma corrida.
 *
 * O QUE ELE **NÃO** FAZ: apagar. A anamnese ajustada gera um CARIMBO NOVO (`ajuste_de` aponta
 * para o anterior), e a listagem mostra o mais recente por apelido — o anterior fica como elo,
 * que é a regra da proveniência. Nada é reescrito.
 */

const Cifra = require('../../tools/lib-cifra.js');

const API_VERSAO = '2022-11-28';
const ACEITE = 'application/vnd.github+json';

// O teto do runtime do Worker (o mesmo do cifrar-envelope.js: o WebCrypto do workerd recusa
// PBKDF2 acima de 100.000). O esquema é autodescritivo — `_cifrado.iteracoes` viaja no arquivo,
// e quem decifra lê a contagem DE VOLTA. Está aqui repetido, e não importado, para este módulo
// não depender do `escrever-ciclo` (que é do ciclo, não do acervo).
const ITERACOES_DO_WORKER = 100000;

const NOTA = 'A anamnese de uma aluna, com as RESPOSTAS cifradas pela senha da escola (SENHA_CRIPTO, '
  + 'o mesmo tools/lib-cifra.js do cofre e do JSON de dados do pacote). O metadado fica em claro de '
  + 'propósito: a listagem de sujeitos lê o NOME do arquivo e o contexto, e nunca precisa de abrir '
  + 'as respostas. O nome do arquivo é <apelido percent-codificado>--<carimbo>.json; o carimbo é a '
  + 'identidade do registro, e um ajuste gera um carimbo novo (nada se reescreve). Não editar à mão.';

const PREFIXO = 'escola/';

/** O slug do apelido, percent-codificado: reversível, e seguro como nome de arquivo. */
function apelidoNoCaminho(aluna) {
  return encodeURIComponent(String(aluna == null ? '' : aluna).trim());
}

/**
 * O caminho da anamnese no repositório.
 * `escola/<escola>/anamneses/<apelido>--<carimbo>.json`
 *
 * Sem apelido não há caminho: a anamnese sem sujeito («sem-sujeito», que a lista de gestão
 * mostra) não tem a quem pertencer, e inventar um lugar para ela seria perder a chave que a
 * torna encontrável. Quem chama trata a ausência.
 */
function caminhoDaAnamnese(contexto, carimbo) {
  const ctx = contexto || {};
  const escola = String(ctx.escola || '').trim();
  const aluna = String(ctx.aluna || '').trim();
  const id = String(carimbo || '').trim();
  if (!escola || !aluna || !id) {
    throw new Error('caminho da anamnese: precisa de escola, aluna e carimbo');
  }
  // A BARRA É RECUSADA, e não codificada. O `encodeURIComponent` transforma-a em `%2F`, mas a
  // Contents API DECODIFICA o caminho antes de o resolver — e `%2F` volta a ser separador de
  // pasta. O arquivo cairia noutro sítio, ou não cairia em nenhum. Um apelido é um nome estável
  // (P-12), não um caminho: recusar é dizer a verdade em vez de gravar no lugar errado.
  if (aluna.indexOf('/') !== -1) {
    throw new Error('o apelido não pode conter «/»: ' + aluna);
  }
  return PREFIXO + escola + '/anamneses/' + apelidoNoCaminho(aluna) + '--' + id + '.json';
}

/** O INVERSO: de um caminho, o `{escola, aluna, carimbo}` — ou null se não for do acervo. */
function lerCaminhoDaAnamnese(caminho) {
  const m = /^escola\/([^/]+)\/anamneses\/([^/]+)--([a-z0-9][a-z0-9-]*)\.json$/.exec(String(caminho || ''));
  if (!m) return null;
  let aluna;
  try {
    aluna = decodeURIComponent(m[2]);
  } catch (erro) {
    return null; // nome ilegível: não é uma anamnese que este módulo escreveu
  }
  return { escola: m[1], aluna, carimbo: m[3] };
}

/** Base64 em UTF-8 SEM `Buffer` (ausente no runtime dos Workers). */
function base64De(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}

function cabecalhosDe(token) {
  return {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'Content-Type': 'application/json',
    // O GitHub exige um User-Agent; o `fetch` do Worker não o envia por padrão.
    'User-Agent': 'danca-worker',
  };
}

/**
 * O ARQUIVO que vai para o repositório: metadado em claro + respostas cifradas.
 * `envelope` é o envelope elicitado (o mesmo que o KV guarda), com `respostas` em claro.
 */
async function montarArquivoDaAnamnese(envelope, senha, cifrar) {
  if (!senha) throw new Error('anamnese no repositório: falta a SENHA_CRIPTO');
  const e = envelope || {};
  const contexto = e.contexto || {};
  const id = String(e.id || '').trim();
  if (!id) throw new Error('anamnese no repositório: o envelope não tem id');

  const respostas = JSON.stringify(
    { respostas: e.respostas || {}, notas: e.notas || {} }, null, 2,
  );
  const _cifrado = cifrar
    ? await cifrar(respostas, senha)
    : await Cifra.cifrar(respostas, senha, { iteracoes: ITERACOES_DO_WORKER });

  return JSON.stringify({
    $nota: NOTA,
    id,
    documento: e.documento || 'anamnese',
    envelope: e.envelope || null,
    gerado_em: e.gerado_em || null,
    contexto: {
      escola: contexto.escola || null,
      professor: contexto.professor || null,
      ciclo: contexto.ciclo || null,
      aluna: contexto.aluna || null,
    },
    // A proveniência do ajuste: um elo novo aponta para o anterior, nada se reescreve.
    ajuste_de: e.ajuste_de || undefined,
    estado: e.estado || undefined,
    respostas: { _cifrado, _nota: NOTA },
  }, null, 2) + '\n';
}

/**
 * Escreve a anamnese no repositório. Devolve `{ ok, caminho, criado, status, erro }`.
 *
 * O 409 REPETE. Entre a leitura do `sha` e o `PUT`, outro isolate pode ter gravado. Duas
 * tentativas cobrem o caso real (dois «Guardar» próximos); três é o teto para não girar.
 */
async function escreverAnamnese({ token, dono, repo, ref, caminho, conteudo, mensagem, fetchImpl }) {
  if (!token) return { ok: false, erro: 'sem token: a anamnese não foi para o repositório' };
  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho;
  const cabecalhos = cabecalhosDe(token);

  let ultimo = { ok: false, status: 0, erro: 'não se tentou' };
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    let sha = null;
    const atual = await f(url + (ref ? '?ref=' + encodeURIComponent(ref) : ''), {
      method: 'GET', headers: cabecalhos,
    });
    if (atual.status === 200) {
      const dados = await atual.json().catch(() => null);
      sha = (dados && dados.sha) || null;
    } else if (atual.status !== 404) {
      return {
        ok: false, status: atual.status, caminho,
        erro: 'leitura do sha: HTTP ' + atual.status,
      };
    }

    const resposta = await f(url, {
      method: 'PUT',
      headers: cabecalhos,
      body: JSON.stringify({
        message: mensagem || ('feat(anamnese): ' + caminho),
        content: base64De(conteudo),
        ...(ref ? { branch: ref } : {}),
        ...(sha ? { sha } : {}),
      }),
    });

    if (resposta.status >= 200 && resposta.status < 300) {
      const dados = await resposta.json().catch(() => null);
      return {
        ok: true,
        status: resposta.status,
        caminho,
        criado: !sha,
        commit: dados && dados.commit && dados.commit.sha ? dados.commit.sha : null,
      };
    }
    ultimo = {
      ok: false, status: resposta.status, caminho,
      erro: resposta.status === 409
        ? 'conflito de escrita (409) — a repetir'
        : 'o GitHub recusou a escrita: HTTP ' + resposta.status,
    };
    // Só o conflito se repete: 401/403/422 não melhoram com uma segunda tentativa.
    if (resposta.status !== 409) return ultimo;
  }
  return ultimo;
}

/**
 * A LISTAGEM, em UMA chamada. A árvore do repositório é o índice: os nomes dos arquivos dizem
 * quem é a aluna e qual é o carimbo. Nada de ficheiro de índice para manter — e nada que possa
 * divergir do dado, que é a lição do `.indice.json` do KV.
 *
 * Devolve `{ ok, anamneses, erro }` com `anamneses` na forma que a porta já usa:
 * `[{ valor: apelido, carimbo, rotulo, detalhe, escola, professor, ciclo }]`, o mais recente
 * primeiro e um por apelido (o vigente).
 */
async function listarAnamnesesDoRepo({ token, dono, repo, ref, escola, fetchImpl }) {
  if (!token) return { ok: false, anamneses: [], erro: 'sem token' };
  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo +
    '/git/trees/' + encodeURIComponent(ref || 'main') + '?recursive=1';
  const r = await f(url, { method: 'GET', headers: cabecalhosDe(token) });
  if (!r.ok) {
    return { ok: false, anamneses: [], erro: 'não li a árvore do repositório: HTTP ' + r.status };
  }
  const dados = await r.json().catch(() => null);
  const arvore = (dados && dados.tree) || [];
  const achadas = [];
  for (const item of arvore) {
    if (!item || item.type !== 'blob') continue;
    const lido = lerCaminhoDaAnamnese(item.path);
    if (!lido) continue;
    if (escola && lido.escola !== escola) continue;
    achadas.push(lido);
  }
  // O MAIS RECENTE primeiro (o carimbo ordena cronologicamente), e um por apelido: é a mesma
  // regra da `porta.anamneses` — o vigente é o primeiro que aparece.
  achadas.sort((a, b) => (a.carimbo < b.carimbo ? 1 : -1));
  const vistos = new Set();
  const anamneses = [];
  for (const a of achadas) {
    if (vistos.has(a.aluna)) continue;
    vistos.add(a.aluna);
    anamneses.push({
      valor: a.aluna,
      carimbo: a.carimbo,
      rotulo: a.aluna,
      detalhe: 'api/envelope/' + encodeURIComponent(a.carimbo),
      escola: a.escola,
      doRepositorio: true,
    });
  }
  return { ok: true, anamneses, erro: null, total: achadas.length };
}

/** Lê UMA anamnese do repositório e devolve o envelope com as respostas decifradas. */
async function lerAnamneseDoRepo({ token, dono, repo, ref, caminho, carimbo, escola, senha, fetchImpl }) {
  if (!token) return { ok: false, erro: 'sem token' };
  const f = fetchImpl || fetch;

  // PELO CARIMBO, SEM SABER O APELIDO. É o caso do detalhe pedido por `api/envelope/<id>`: o
  // caminho carrega o apelido, e o id não o traz. Uma chamada à árvore resolve — e é só no
  // caminho de RECURSO (quando o KV não tem o envelope), não no caminho normal.
  if (!caminho && carimbo) {
    const t = await f('https://api.github.com/repos/' + dono + '/' + repo +
      '/git/trees/' + encodeURIComponent(ref || 'main') + '?recursive=1',
    { method: 'GET', headers: cabecalhosDe(token) });
    if (!t.ok) return { ok: false, erro: 'não li a árvore: HTTP ' + t.status };
    const dados = await t.json().catch(() => null);
    for (const item of (dados && dados.tree) || []) {
      const lido = lerCaminhoDaAnamnese(item && item.path);
      if (!lido || lido.carimbo !== carimbo) continue;
      if (escola && lido.escola !== escola) continue;
      caminho = item.path;
      break;
    }
    if (!caminho) return { ok: false, existe: false, erro: 'não está no repositório' };
  }
  if (!caminho) return { ok: false, erro: 'sem caminho nem carimbo' };

  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho +
    (ref ? '?ref=' + encodeURIComponent(ref) : '');
  const r = await f(url, { method: 'GET', headers: cabecalhosDe(token) });
  if (r.status === 404) return { ok: false, existe: false, erro: 'não está no repositório' };
  if (!r.ok) return { ok: false, erro: 'leitura: HTTP ' + r.status };
  const dados = await r.json().catch(() => null);
  const base64 = dados && dados.content ? String(dados.content).replace(/\s+/g, '') : '';
  if (!base64) return { ok: false, erro: 'o arquivo veio vazio' };
  let texto;
  try {
    texto = new TextDecoder().decode(
      Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
    );
  } catch (erro) {
    return { ok: false, erro: 'o arquivo não se decodificou' };
  }
  let arquivo;
  try {
    arquivo = JSON.parse(texto);
  } catch (erro) {
    return { ok: false, erro: 'o arquivo não é JSON' };
  }
  if (!senha) return { ok: false, erro: 'sem SENHA_CRIPTO: não consigo abrir as respostas' };
  try {
    const claro = await Cifra.decifrar(
      arquivo.respostas && arquivo.respostas._cifrado,
      senha,
      (arquivo.respostas && arquivo.respostas._cifrado && arquivo.respostas._cifrado.iteracoes) || 0,
    );
    const conteudo = JSON.parse(claro);
    return {
      ok: true,
      existe: true,
      envelope: {
        id: arquivo.id,
        documento: arquivo.documento || 'anamnese',
        envelope: arquivo.envelope || null,
        gerado_em: arquivo.gerado_em || null,
        contexto: arquivo.contexto || {},
        ajuste_de: arquivo.ajuste_de || null,
        respostas: conteudo.respostas || {},
        notas: conteudo.notas || {},
      },
    };
  } catch (erro) {
    return { ok: false, existe: true, erro: 'não decifrou: ' + ((erro && erro.message) || String(erro)) };
  }
}

/**
 * O ESCRITOR pronto para a ponte — `null` sem token, como os outros (a elicitação continua
 * intacta, e a rota diz que a anamnese não foi para o repositório).
 */
function criarEscritorDeAnamnese({ token, dono, repo, ref, senhaCripto, cifrar, fetchImpl }) {
  if (!token) return null;
  return async (envelope, mensagem) => {
    const contexto = (envelope && envelope.contexto) || {};
    let caminho;
    try {
      caminho = caminhoDaAnamnese(contexto, envelope && envelope.id);
    } catch (erro) {
      return { ok: false, erro: erro.message, semSujeito: !contexto.aluna };
    }
    let conteudo;
    try {
      conteudo = await montarArquivoDaAnamnese(envelope, senhaCripto, cifrar);
    } catch (erro) {
      return { ok: false, caminho, erro: erro.message };
    }
    return escreverAnamnese({
      token, dono, repo, ref, caminho, conteudo, mensagem, fetchImpl,
    });
  };
}

module.exports = {
  PREFIXO,
  NOTA,
  apelidoNoCaminho,
  caminhoDaAnamnese,
  lerCaminhoDaAnamnese,
  montarArquivoDaAnamnese,
  escreverAnamnese,
  criarEscritorDeAnamnese,
  listarAnamnesesDoRepo,
  lerAnamneseDoRepo,
};
