'use strict';

/**
 * linhas-de-base-repo.js — A LINHA DE BASE NO REPOSITÓRIO, e não no KV (05/11/2026).
 *
 * PORQUE SAIU DO KV, e são três razões, todas dela:
 *
 *   1. **CUSTO E COTA.** «O KV também é custo, e esse é um espaço que o professor vai mexer
 *      muitas vezes.» A cota diária do KV já se gastou uma vez a medir sem querer, e um dado que
 *      o professor edita a cada aula não pode viver num recurso com tecto diário.
 *   2. **PROVENIÊNCIA.** «Não há série temporal. A gente tem que encontrar uma solução para isso.
 *      Essa é uma característica que vai valer muito dinheiro.» O KV guarda o estado de hoje: o
 *      «Gravar» do passo 4 faz `lista[idx] = linha` e o que existia antes desaparece. Aqui cada
 *      acto é um ARQUIVO NOVO — o passado não se reescreve, acrescenta-se, que é a lei da casa
 *      (P-03) e o que o `.fipp` já faz com os documentos.
 *   3. **O ÍNDICE E O RANQUE ENTRE ESCOLAS.** Um índice robusto e um ranque que atravesse escolas
 *      exigem que o dado seja alcançável pela mesma leitura. O KV de cada escola é uma ilha; o
 *      repositório é um só.
 *
 * O DESENHO, e porquê esta forma:
 *
 *   · O CAMINHO É A CHAVE. `escola/<escola>/linhas-de-base/<id>--<carimbo>.json`, a mesma forma
 *     dos envelopes (`escola/<escola>/envelopes/<carimbo>.json`). O `id` é o NOME da linha de base
 *     e NÃO muda entre versões — é ele que o plano guarda em `linha-de-base-alvo`, e um id que
 *     mudasse a cada envio quebraria o ponteiro do plano a cada ajuste. O `carimbo` separa as
 *     versões, e a versão VIGENTE de uma linha é a de carimbo maior.
 *
 *   · APPEND-ONLY, E O `anterior` DECLARA O ELO. Cada envio cria um arquivo novo e diz de qual
 *     veio. É a cadeia explícita, legível sem `git log` — e sobrevive a um squash, a um rebase e a
 *     uma migração, coisas que a história do Git não garante.
 *
 *   · APAGAR É UM ACTO, NÃO UM ESQUECIMENTO. O `DELETE` grava uma versão com `apagada_em`. A linha
 *     sai da lista (a versão apagada não é vigente), e o registo de que ela existiu e foi apagada
 *     fica. Uma linha de base apagada sem rasto é a única coisa que este sistema não pode ter.
 *
 *   · O RASCUNHO NÃO VIAJA. Só o acto de «Concluir e enviar para a turma» (passo 5) escreve aqui.
 *     O que o professor vai preenchendo fica no KV — é intenção, edita-se e descarta-se; o acto é
 *     facto, e é o que a turma, o plano e o PO leem. A distinção é a mesma do `aula-NN.md`
 *     (planejada) e do lançamento (dada).
 *
 * O QUE ELE **NÃO** FAZ: migrar em lote, escrever no KV, ou apagar arquivos. Um registo antigo do
 * KV continua a ser lido (`legado`), e migra na primeira vez que for concluído outra vez.
 */

const API_VERSAO = '2022-11-28';
const ACEITE = 'application/vnd.github+json';

const PREFIXO = 'escola/';
const PASTA = 'linhas-de-base/';

const DONO_PADRAO = 'tmenegaz';
const REPO_PADRAO = 'danca';
const REF_PADRAO = 'main';

/** O carimbo de um acto: `AAAAMMDD-HHMM`, a mesma forma dos envelopes. */
function carimboDe(iso) {
  const s = String(iso || new Date().toISOString());
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s);
  if (!m) return s.replace(/[^0-9]/g, '').slice(0, 12);
  return m[1] + m[2] + m[3] + '-' + m[4] + m[5];
}

/** O `id` de uma linha de base, sem acento e sem o separador das versões. */
function idDeChave(chave) {
  const nome = String(chave || '').replace(/\.json$/, '');
  const i = nome.lastIndexOf('--');
  return i === -1 ? nome : nome.slice(0, i);
}

/** O carimbo de uma chave; `''` quando a chave não o traz. */
function carimboDaChave(chave) {
  const nome = String(chave || '').replace(/\.json$/, '');
  const i = nome.lastIndexOf('--');
  return i === -1 ? '' : nome.slice(i + 2);
}

function chaveDe(id, carimbo) {
  return String(id) + '--' + String(carimbo) + '.json';
}

function caminhoDaChave(escola, chave) {
  const base = String(escola || '').replace(/[\\/]+$/, '');
  return PREFIXO + base + '/' + PASTA + String(chave).replace(/^\/+/, '');
}

/** `escola/x/linhas-de-base/y.json` → `{escola, chave}`; `null` quando não é da família. */
function lerCaminho(caminho) {
  const p = String(caminho || '');
  if (!p.startsWith(PREFIXO)) return null;
  const resto = p.slice(PREFIXO.length);
  const barra = resto.indexOf('/');
  if (barra === -1) return null;
  const escola = resto.slice(0, barra);
  const cauda = resto.slice(barra + 1);
  if (!cauda.startsWith(PASTA)) return null;
  const chave = cauda.slice(PASTA.length);
  if (!chave || chave.indexOf('/') !== -1) return null;
  return { escola, chave };
}

function base64De(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function textoDeBase64(base64) {
  const bin = atob(String(base64).replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function cabecalhosDe(token) {
  const h = { Accept: ACEITE, 'X-GitHub-Api-Version': API_VERSAO };
  if (token) h.Authorization = 'Bearer ' + token;
  return h;
}

/**
 * O leitor/escritor. Sem `token` ele fica INERTE e diz que não leu — não finge uma lista vazia
 * (uma lista vazia silenciosa faz a escola achar que perdeu as linhas de base).
 */
function criarStore({ token, dono, repo, ref, escola, fetchImpl }) {
  const slug = String(escola || '').trim();
  const f = fetchImpl || fetch;
  const base = 'https://api.github.com/repos/' + (dono || DONO_PADRAO) + '/' + (repo || REPO_PADRAO);
  const cabecalhos = cabecalhosDe(token);
  const ramo = ref || REF_PADRAO;
  const comRamo = (url) => url
    + (url.indexOf('?') === -1 ? '?' : '&') + 'ref=' + encodeURIComponent(ramo);

  const lidos = new Map();   // chave → {texto, sha} | null
  let nomes = null;          // a árvore, lida no máximo uma vez por instância

  const activo = Boolean(slug && token);
  const motivo = !slug ? 'sem ESCOLA_SLUG' : (!token ? 'sem GITHUB_TOKEN' : null);

  async function conteudo(chave) {
    if (lidos.has(chave)) return lidos.get(chave);
    if (!activo) { lidos.set(chave, null); return null; }
    const r = await f(comRamo(base + '/contents/' + caminhoDaChave(slug, chave)),
      { method: 'GET', headers: cabecalhos });
    if (r.status === 404) { lidos.set(chave, null); return null; }
    if (!r.ok) throw new Error('linhas-de-base: leitura de ' + chave + ': HTTP ' + r.status);
    const dados = await r.json().catch(() => null);
    const cru = dados && dados.content ? String(dados.content) : '';
    if (!cru) throw new Error('linhas-de-base: o arquivo veio vazio: ' + chave);
    const achado = { texto: textoDeBase64(cru), sha: (dados && dados.sha) || null };
    lidos.set(chave, achado);
    return achado;
  }

  async function arvore() {
    if (nomes) return nomes;
    if (!activo) { nomes = []; return nomes; }
    const r = await f(base + '/git/trees/' + encodeURIComponent(ramo) + '?recursive=1',
      { method: 'GET', headers: cabecalhos });
    if (!r.ok) throw new Error('linhas-de-base: não li a árvore do repositório: HTTP ' + r.status);
    const dados = await r.json().catch(() => null);
    const achadas = [];
    for (const item of (dados && dados.tree) || []) {
      if (!item || item.type !== 'blob') continue;
      const achado = lerCaminho(item.path);
      if (!achado || achado.escola !== slug) continue;
      achadas.push(achado.chave);
    }
    nomes = achadas;
    return nomes;
  }

  async function escrever(chave, texto, mensagem) {
    if (!activo) return { ok: false, erro: 'sem token ou sem escola: ' + motivo };
    const url = base + '/contents/' + caminhoDaChave(slug, chave);
    let ultimo = { ok: false, erro: 'não se tentou' };
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      let sha = null;
      const atual = await f(comRamo(url), { method: 'GET', headers: cabecalhos });
      if (atual.status === 200) {
        const dados = await atual.json().catch(() => null);
        sha = (dados && dados.sha) || null;
      } else if (atual.status !== 404) {
        return { ok: false, status: atual.status, erro: 'leitura do sha: HTTP ' + atual.status };
      }
      const resposta = await f(url, {
        method: 'PUT',
        headers: cabecalhos,
        body: JSON.stringify({
          message: mensagem || ('feat(linha de base): ' + chave),
          content: base64De(texto),
          branch: ramo,
          ...(sha ? { sha } : {}),
        }),
      });
      if (resposta.status >= 200 && resposta.status < 300) {
        const dados = await resposta.json().catch(() => null);
        lidos.delete(chave);
        if (Array.isArray(nomes) && nomes.indexOf(chave) === -1) nomes.push(chave);
        return {
          ok: true,
          status: resposta.status,
          criado: !sha,
          caminho: caminhoDaChave(slug, chave),
          commit: dados && dados.commit && dados.commit.sha ? dados.commit.sha : null,
        };
      }
      if (resposta.status !== 409) {
        return { ok: false, status: resposta.status, erro: 'o GitHub recusou a escrita: HTTP ' + resposta.status };
      }
      ultimo = { ok: false, status: 409, erro: 'conflito de escrita (409) — a repetir' };
    }
    return ultimo;
  }

  return {
    activo,
    motivo,
    escola: slug,

    /** As CHAVES de todas as versões da escola, da mais recente para a mais antiga. */
    async chaves() {
      const lista = await arvore();
      return lista.slice().sort((a, b) => carimboDaChave(b).localeCompare(carimboDaChave(a)));
    },

    /**
     * TODAS as versões, já lidas. Uma leitura por arquivo — e é o preço de um índice que vê o
     * passado. Quem só quer a vigente de cada linha usa `vigentes()`.
     */
    async versoes() {
      const lista = [];
      for (const chave of await arvore()) {
        try {
          const achado = await conteudo(chave);
          if (!achado) continue;
          const linha = JSON.parse(achado.texto);
          if (!linha || typeof linha !== 'object') continue;
          lista.push(Object.assign({}, linha, {
            id: linha.id || idDeChave(chave),
            carimbo: carimboDaChave(chave),
            chave,
          }));
        } catch (erro) { /* um arquivo ilegível não derruba a lista: fica de fora */ }
      }
      return lista.sort((a, b) => String(b.carimbo).localeCompare(String(a.carimbo)));
    },

    /**
     * A VIGENTE DE CADA LINHA — a versão de carimbo maior que não foi apagada.
     *
     * A ORDEM É O CARIMBO, e não a data que o ficheiro diz: o carimbo é do NOME, e um relógio
     * errado numa máquina não reordena o passado.
     */
    async vigentes() {
      const por = new Map();
      const vistas = new Set();
      /* A LÁPIDE APAGA A LINHA, e não só a si mesma — foi o primeiro erro desta função, apanhado
       * pela prova. Se a versão MAIS RECENTE de um id é uma lápide, a linha está apagada: saltar
       * só a lápide promoveria a versão anterior a vigente, e a linha apagada reaparecia na
       * estante. `vistas` marca o id na primeira versão que dele se vê (a mais recente). */
      for (const v of await this.versoes()) {
        if (vistas.has(v.id)) continue;
        vistas.add(v.id);
        if (v.apagada_em) continue;
        por.set(v.id, v);
      }
      return [...por.values()];
    },

    /** A versão vigente de UMA linha — `null` quando não existe (ou está apagada). */
    async vigente(id) {
      const alvo = String(id || '').trim();
      if (!alvo) return null;
      /* A PRIMEIRA É A MAIS RECENTE (as chaves vêm ordenadas por carimbo decrescente). Se ela for
       * uma lápide, a linha está apagada — e não se procura mais atrás: uma versão anterior a uma
       * lápide não é a vigente de nada. */
      const chave = (await this.chaves()).find((c) => idDeChave(c) === alvo);
      if (!chave) return null;
      try {
        const achado = await conteudo(chave);
        if (!achado) return null;
        const linha = JSON.parse(achado.texto);
        if (!linha || linha.apagada_em) return null;
        return Object.assign({}, linha, { id: alvo, carimbo: carimboDaChave(chave), chave });
      } catch (erro) { return null; }
    },

    /**
     * O ACTO. Grava uma versão NOVA — nunca reescreve a anterior — e devolve a chave dela.
     *
     * O `anterior` é a chave da versão vigente no momento, e vai dentro do ficheiro: é o elo
     * explícito da cadeia. Se a gravação falhar, o KV continua a ter o rascunho — e o servidor
     * responde com o erro em vez de dizer que concluiu.
     */
    async concluir(linha, { quando, mensagem } = {}) {
      const id = String((linha && linha.id) || '').trim();
      if (!id) return { ok: false, erro: 'a linha de base não tem identificador' };
      const carimbo = carimboDe(quando || new Date().toISOString());
      const anterior = await this.vigente(id);
      const chave = chaveDe(id, carimbo);
      const corpo = Object.assign({}, linha, {
        id,
        carimbo,
        enviada_em: String((linha && linha.enviada_em) || quando || new Date().toISOString()),
        ...(anterior ? { anterior: anterior.chave } : {}),
        gravada_em: String(quando || new Date().toISOString()),
      });
      const r = await escrever(chave, JSON.stringify(corpo, null, 2) + '\n', mensagem);
      if (!r.ok) return r;
      return Object.assign({}, r, { chave, carimbo, linha: corpo, anterior: anterior ? anterior.chave : null });
    },

    /** APAGAR É UM ACTO: uma versão com `apagada_em`. A linha sai da lista; o rasto fica. */
    async apagar(id, { quando, por } = {}) {
      const alvo = await this.vigente(id);
      if (!alvo) return { ok: false, erro: 'linha de base não encontrada: ' + id };
      const em = String(quando || new Date().toISOString());
      const carimbo = carimboDe(em);
      const chave = chaveDe(String(id), carimbo);
      const corpo = Object.assign({}, alvo, {
        id: String(id),
        carimbo,
        apagada_em: em,
        ...(por ? { apagada_por: String(por) } : {}),
        anterior: alvo.chave,
      });
      delete corpo.chave;
      const r = await escrever(chave, JSON.stringify(corpo, null, 2) + '\n',
        'chore(linha de base): apagar ' + id);
      if (!r.ok) return r;
      return Object.assign({}, r, { chave, carimbo, apagada: corpo });
    },

    /** A história de UMA linha, da mais recente para a mais antiga. */
    async historia(id) {
      const alvo = String(id || '').trim();
      const lista = [];
      for (const chave of (await this.chaves()).filter((c) => idDeChave(c) === alvo)) {
        try {
          const achado = await conteudo(chave);
          if (!achado) continue;
          const linha = JSON.parse(achado.texto);
          if (!linha) continue;
          lista.push(Object.assign({}, linha, { id: alvo, carimbo: carimboDaChave(chave), chave }));
        } catch (erro) { /* fica de fora */ }
      }
      return lista;
    },
  };
}

/** O store a partir do `env` do Worker — a única porta que a Produção e a ponte usam. */
function doAmbiente(env, escola) {
  const e = env || {};
  return criarStore({
    token: e.GITHUB_TOKEN,
    dono: e.GITHUB_DONO || DONO_PADRAO,
    repo: e.GITHUB_REPO || REPO_PADRAO,
    ref: e.GITHUB_REF || REF_PADRAO,
    escola: escola || e.ESCOLA_SLUG,
  });
}

module.exports = {
  PREFIXO,
  PASTA,
  DONO_PADRAO,
  REPO_PADRAO,
  REF_PADRAO,
  carimboDe,
  idDeChave,
  carimboDaChave,
  chaveDe,
  caminhoDaChave,
  lerCaminho,
  criarStore,
  doAmbiente,
};
