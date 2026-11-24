'use strict';

/**
 * indice-acervo.js — o índice do acervo, lido do repositório e guardado como CACHE no KV.
 *
 * O QUE ELE É. A camada de I/O do `motor/nucleo/indices.js`: a derivação é pura e está lá; aqui
 * lê-se o que ela precisa, e guarda-se o resultado. É a única peça nova que fala com o GitHub
 * para construir o índice.
 *
 * O CUSTO, MEDIDO — e é o ponto. Sem índice, responder «que escolas existem?» custava UMA
 * leitura da árvore POR PERGUNTA. Com ele, a construção custa:
 *
 *     1 árvore (o índice de caminhos do repositório, que também dá o `sha` do cache)
 *   + 1 por escola (`escola/<slug>/indice.json` — o inventário)
 *   + 1 por escola (`escola/<slug>/envelopes/.indice.json` — os RESUMOS, já escritos pelo acervo)
 *   + 1 por âncora (`*.fipp`, pequenos)
 *
 * e depois disso **zero**: o resultado fica em `indice/acervo.json` no KV, com o `sha` da árvore
 * como chave de invalidação. Essa é a diferença entre um índice e uma varredura com nome bonito.
 *
 * O KV AQUI É O USO LEGÍTIMO. O índice é derivado, determinístico e reconstruível: se o cache
 * desaparecer, a próxima leitura reconstrói-se a partir do repositório e o resultado é o mesmo.
 * Nada se perde quando o KV se perde — e é exactamente por isso que ele pode viver lá.
 *
 * A INVALIDAÇÃO É O `sha` DA ÁRVORE. Qualquer commit muda a árvore, e a árvore muda o `sha`; não
 * há relógio, não há TTL, não há «esperar X minutos». Um cache com TTL mostra o acervo de ontem
 * a quem acabou de gravar; este mostra o do commit que está a ser servido.
 */

const indices = require('../nucleo/indices.js');
/* A ÁRVORE DO REPOSITÓRIO, LIDA UMA VEZ E GUARDADA POR COMMIT (24/11/2026). */
const { criarLeitorDaArvore } = require('./arvore-do-repo.js');
/* A MESMA RESPOSTA PARA «ESTE SCRIPT É UMA ESCOLA?» (24/11/2026) — a função que o
 * `gerar-indices.js` também passou a chamar. Duas leituras do mesmo marcador divergiriam. */
const shardsDoRepo = require('../nucleo/shards.js');

const API_VERSAO = '2022-11-28';
const ACEITE = 'application/vnd.github+json';

const DONO_PADRAO = 'tmenegaz';
const REPO_PADRAO = 'danca';
const REF_PADRAO = 'main';

// As chaves do cache. NÃO começam por `envelope/`, e por isso vão para o KV — que é onde o
// índice derivado deve estar.
const CHAVE_ACERVO = 'indice/acervo.json';
const chaveDaEscola = (slug) => 'indice/escola/' + slug + '.json';

function cabecalhosDe(token) {
  return {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'User-Agent': 'danca-worker',
  };
}

function textoDeBase64(base64) {
  return new TextDecoder().decode(Uint8Array.from(atob(String(base64).replace(/\s+/g, '')), (c) => c.charCodeAt(0)));
}

/**
 * O `.fipp` é um YAML de uma linha por campo, com uma lista no fim. Não há parser YAML no
 * repositório e não vale a pena trazer um: os campos são fixos e o formato é do `hash-ciclo.sh`.
 * Um campo desconhecido é ignorado — e uma linha que não case fica de fora sem quebrar a leitura.
 */
function lerAncora(texto) {
  const campos = {};
  const cobertura = [];
  let emCobertura = false;
  for (const linha of String(texto || '').split('\n')) {
    if (/^cobertura:\s*$/.test(linha)) { emCobertura = true; continue; }
    const item = /^\s+-\s+(.*)$/.exec(linha);
    if (emCobertura && item) { cobertura.push(item[1].trim()); continue; }
    const campo = /^([A-Za-z_]+):\s*(.*)$/.exec(linha);
    if (campo) { campos[campo[1]] = campo[2].trim(); emCobertura = false; }
  }
  campos.cobertura = cobertura;
  return campos;
}

/**
 * LÊ O ACERVO E CONSTRÓI O ÍNDICE. Devolve `{indice, custo}`.
 *
 * `comApelido` decide se o índice da escola carrega o apelido da aluna. É o único ponto onde
 * essa decisão se toma — e ela é do CHAMADOR (a ponte da escola diz sim; a raiz diz não), não
 * de um parâmetro que se esquece.
 */
async function construirDoAcervo({ token, dono, repo, ref, fetchImpl, agora, comApelido, kv }) {
  if (!token) throw new Error('índice: sem GITHUB_TOKEN não há acervo para indexar');
  const f = fetchImpl || fetch;
  const base = 'https://api.github.com/repos/' + (dono || DONO_PADRAO) + '/' + (repo || REPO_PADRAO);
  const ramo = ref || REF_PADRAO;
  const cabecalhos = cabecalhosDe(token);
  const custo = { arvores: 0, leituras: 0 };

  /* A ÁRVORE VEM DO LEITOR PARTILHADO (24/11/2026) — ver `arvore-do-repo.js`. Era o QUARTO `GET`
   * de 273 KB do mesmo repositório, e o que a cache do índice não cobria: quando ela erra (a
   * chave não está, ou é de uma versão anterior), a reconstrução pedia a árvore inteira outra
   * vez. Agora a árvore tem cache própria, por commit, e a reconstrução do índice só paga as
   * leituras dos ficheiros — que é o trabalho dela. */
  const leitor = criarLeitorDaArvore({ token, dono: dono || DONO_PADRAO, repo: repo || REPO_PADRAO, ref: ramo, fetchImpl: f, kv });
  const caminhos = await leitor.caminhos();
  custo.arvores += Math.max(1, leitor.custo().arvores);
  /* O `commit` que o índice grava vem do LEITOR, e não da resposta da árvore: o leitor é quem o
   * sabe (é a chave da cache). Antes lia-se `corpo.sha` — a resposta da árvore ecoa o sha do
   * COMMIT quando o `ref` é um ramo, e era essa a fonte. Com a cache, a resposta pode nem existir
   * (veio do KV), e o commit continua a ser o mesmo. `null` quando não se soube: o campo é volátil
   * e o `--check` do índice já o exclui. */
  const commitDaArvore = leitor.custo().commit || null;

  const lerTexto = async (caminho) => {
    custo.leituras += 1;
    const r = await f(base + '/contents/' + caminho + '?ref=' + encodeURIComponent(ramo),
      { method: 'GET', headers: cabecalhos });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('índice: leitura de ' + caminho + ': HTTP ' + r.status);
    const dados = await r.json().catch(() => null);
    const cru = dados && dados.content ? String(dados.content) : '';
    return cru ? textoDeBase64(cru) : null;
  };
  const lerJson = async (caminho) => {
    const texto = await lerTexto(caminho);
    if (!texto) return null;
    try { return JSON.parse(texto); } catch { return null; }
  };

  const slugDe = (caminho) => {
    const m = /^escola\/([a-z0-9-]+)\/indice\.json$/.exec(caminho);
    return m ? m[1] : null;
  };

  // O INVENTÁRIO e os RESUMOS, um por escola — as duas únicas leituras por escola. Os resumos já
  // existem (o acervo escreve-os em cada gravação): o índice não abre envelope nenhum.
  const inventarios = {};
  const envelopes = {};
  for (const caminho of caminhos) {
    const slug = slugDe(caminho);
    if (slug) {
      const inv = await lerJson(caminho);
      if (inv) inventarios[slug] = inv;
    }
    const daEscola = /^escola\/([a-z0-9-]+)\/envelopes\/\.indice\.json$/.exec(caminho);
    if (daEscola) {
      const lido = await lerJson(caminho);
      const resumos = (lido && lido.resumos) || {};
      envelopes[daEscola[1]] = (Array.isArray(lido && lido.nomes) ? lido.nomes : [])
        .map((nome) => ({ nome, resumo: resumos[nome] || null }))
        .filter((x) => x.resumo);
    }
  }

  // AS ÂNCORAS. Uma leitura por `.fipp`, e o índice COPIA o que lá está — não recalcula hash
  // nenhum. Recalcular seria ter duas implementações da fórmula, e a segunda a divergir.
  const ancoras = {};
  for (const caminho of caminhos) {
    if (!/\.fipp$/.test(caminho)) continue;
    const texto = await lerTexto(caminho);
    if (texto === null) continue;
    ancoras[caminho] = lerAncora(texto);
  }

  /* OS SHARDS, PELO CAMINHO DO SERVIDOR (24/11/2026) — e esta linha é o conserto.
   *
   * O `gerar-indices.js` já os conhecia: lia o marcador `PACOTE_PARTILHADO` no config e passava a
   * lista a `indices.construir`, de modo que o `indices/` do repositório saía certo. Aqui — o
   * caminho que a PÁGINA usa, com a árvore lida do GitHub e o resultado guardado no KV — a lista
   * não era passada. Consequência medida ao vivo: `/api/escolas` respondia `['lastro-teste']`, o
   * shard aparecia como escola VIVA no painel, e o botão «Apagar escola» oferecia o Worker que
   * serve todas as escolas. O mesmo defeito que a derivação do disco já tinha consertado, vivo no
   * sítio onde ele tem botão.
   *
   * A regra é uma só, e mora em `motor/nucleo/shards.js` — a mesma função que o `gerar-indices.js`
   * passa a chamar, para não haver duas leituras do mesmo marcador. O custo é o número de SHARDS
   * (quem tem elo é escola e não se abre), e não o número de escolas. */
  const shards = await shardsDoRepo.scriptsDeShard({ caminhos, lerTexto });

  const { acervo, escolas } = indices.construir({
    fonte: { commit: commitDaArvore, arvore: commitDaArvore },
    agora: agora || null,
    arvores: caminhos,
    inventarios,
    envelopes,
    ancoras,
    /* O SHARD NÃO É ESCOLA. Sem esta linha ele entra no acervo, a lista das vivas mostra-o, e o
     * expurgo é oferecido a quem não tem elo nenhum para apagar. */
    shards,
    comApelido: comApelido === true,
  });

  return { acervo, escolas, custo, arvore: commitDaArvore };
}

/**
 * O ÍNDICE COM CACHE. `kv` é o armazenamento (o mesmo da escola); `reconstruir: true` ignora o
 * que está guardado.
 *
 * Devolve `{ok, indice, doCache, custo}` — e `custo` é o que a prova mede: com o cache quente,
 * `arvores` e `leituras` ficam a ZERO, e só há uma leitura de KV.
 *
 * UMA COISA QUE ELE NÃO FAZ: reconstruir porque o cache «parece velho». A validade é o `sha` da
 * árvore, e descobri-lo custa uma chamada — a mesma que a construção custa. Então a política é a
 * certa para um cache derivado: usa-se o que está lá, e quem sabe que acabou de gravar pede
 * `reconstruir`. Não há como um cache deste tipo mentir por muito tempo: a próxima gravação que
 * peça o índice com `reconstruir` (o «Guardar» pede) põe-no em dia.
 */
async function lerComCache({ token, dono, repo, ref, fetchImpl, agora, comApelido, escola, kv, reconstruir }) {
  const alvo = escola ? chaveDaEscola(escola) : CHAVE_ACERVO;
  const custo = { arvores: 0, leituras: 0, kvLeituras: 0, kvEscritas: 0 };

  if (!reconstruir && kv && typeof kv.ler === 'function') {
    custo.kvLeituras += 1;
    const guardado = await kv.ler(alvo).catch(() => null);
    if (guardado) {
      try {
        const indice = JSON.parse(guardado);
        if (indice && indice.versao === indices.VERSAO) {
          return { ok: true, indice, doCache: true, custo };
        }
      } catch (erro) {
        // Cache ilegível é cache ausente: reconstrói-se. Não é erro, é a vida de um derivado.
      }
    }
  }

  const construido = await construirDoAcervo({ token, dono, repo, ref, fetchImpl, agora, comApelido, kv });
  custo.arvores += construido.custo.arvores;
  custo.leituras += construido.custo.leituras;
  const indice = escola ? construido.escolas[escola] : construido.acervo;

  if (!indice) {
    return {
      ok: false,
      erro: 'a escola «' + escola + '» não está no acervo',
      doCache: false,
      custo,
    };
  }

  if (kv && typeof kv.guardar === 'function') {
    custo.kvEscritas += 1;
    // BEST-EFFORT: um KV cheio ou sem cota não pode impedir a resposta. O índice é derivado —
    // não guardá-lo custa uma reconstrução na próxima leitura, e nada mais.
    await kv.guardar(alvo, JSON.stringify(indice, null, 2) + '\n').catch(() => null);
  }

  return { ok: true, indice, doCache: false, custo };
}

/**
 * O PORTÃO da ponte: as funções que o `rotas.js` recebe, já com o `env` fechado dentro.
 *
 * `comApelido` é `true` aqui porque quem chama é o Worker da ESCOLA: o índice que ele serve é o
 * mesmo dado que a estante dela mostra, atrás da mesma senha de direção. A raiz constrói o seu
 * sem apelido (`comApelido: false`), e é isso que impede o dado de menor de atravessar para o
 * lado transversal.
 */
function criarIndice(env, { kv, escola } = {}) {
  const comum = {
    token: (env && env.GITHUB_TOKEN) || null,
    dono: DONO_PADRAO,
    repo: REPO_PADRAO,
    ref: REF_PADRAO,
    kv: kv || null,
  };
  const slug = escola || (env && env.ESCOLA_SLUG) || '';

  return {
    async ler(opcoes) {
      const o = opcoes || {};
      const agora = o.agora || (env && env.AGORA) || null;
      return lerComCache(Object.assign({}, comum, {
        escola: o.escola === undefined ? slug : o.escola,
        comApelido: o.comApelido !== false,
        reconstruir: o.reconstruir === true,
        agora,
      }));
    },

    /**
     * A INVALIDAÇÃO, DEPOIS DE GRAVAR (20/10/2026).
     *
     * Um índice que só se actualiza «na próxima vez que alguém pedir com `reconstruir`» mostra
     * ao professor o acervo de antes do registo que ele acabou de fazer — e o sintoma seria
     * «gravei e a estante não tem», que é o pior que esta tela pode dizer. Quem grava apaga o
     * cache: a leitura seguinte reconstrói-se do repositório, onde o registo já está.
     *
     * Custa DUAS escritas de KV por gravação (o acervo e a escola), e nenhuma leitura do GitHub.
     * E é best-effort: se o KV recusar, o índice fica velho até a próxima reconstrução — não se
     * perde dado nenhum, porque o índice não é o dado.
     */
    async invalidar() {
      if (!comum.kv || typeof comum.kv.apagar !== 'function') return { ok: false, motivo: 'sem KV' };
      const chaves = [CHAVE_ACERVO];
      if (slug) chaves.push(chaveDaEscola(slug));
      for (const chave of chaves) {
        try { await comum.kv.apagar(chave); } catch (erro) { /* best-effort */ }
      }
      return { ok: true, chaves };
    },
  };
}

module.exports = {
  CHAVE_ACERVO,
  chaveDaEscola,
  lerAncora,
  construirDoAcervo,
  lerComCache,
  criarIndice,
};
