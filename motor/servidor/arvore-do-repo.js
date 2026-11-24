'use strict';

/**
 * arvore-do-repo.js — A ÁRVORE DO REPOSITÓRIO, LIDA UMA VEZ E GUARDADA POR COMMIT (24/11/2026).
 *
 * O PROBLEMA, medido. `GET /repos/{dono}/{repo}/git/trees/{ref}?recursive=1` devolve **273 KB**
 * (933 entradas neste repositório, medido a 24/11/2026). Quatro sítios o pediam, cada um com a sua
 * própria cópia do pedido:
 *
 *   · `repo-escola.js` — `arvoreDeCaminhos`, usada por SEIS funções (as listas de professores, de
 *     escolas, o inventário, a verificação de duplicados);
 *   · `acervo-envelopes.js` — memoizada **dentro da requisição**, e a requisição seguinte pagava os
 *     273 KB outra vez;
 *   · `linhas-de-base-repo.js` — igual;
 *   · `indice-acervo.js` — direto.
 *
 * A árvore é a mesma para todos, e só muda quando o ramo muda.
 *
 * A CHAVE DO CACHE É O COMMIT, e descobri-lo custa **365 bytes** — `GET .../git/ref/heads/{ramo}`
 * (medido na mesma data). O caminho barato não é perguntar pelo `sha` da árvore: `.../git/trees/main`
 * sem `recursive` devolve 15,8 KB só para dizer o mesmo. 365 bytes para saber se vale a pena pedir
 * 273 KB é a troca que esta cache faz, e é de **750×**.
 *
 * PORQUE NÃO SE USA O `sha` DA ÁRVORE COMO O `indice-acervo` FAZ. Lá o cache guarda o ÍNDICE
 * construído (que também custa N leituras de ficheiro), e a política é «usa-se o que está lá; quem
 * sabe que acabou de gravar pede `reconstruir`». Aqui o que se guarda é a LISTA DE CAMINHOS, e o
 * commit identifica-a exatamente: um commit diferente é uma árvore diferente, e não há janela em
 * que o cache minta — o custo de verificar (365 B) é menor do que o de não verificar (273 KB).
 *
 * O QUE ESTA CACHE **NÃO** É. Não é dado de escola, e por isso não viola a decisão 18 («o KV é o
 * último recurso; só guarda o que é da ESCOLA»): é um derivado GLOBAL do repositório, com a mesma
 * natureza da cache do acervo que já vive no KV (`CHAVE_ACERVO` em `indice-acervo.js`). Um `get`
 * por requisição e um `put` por commit — nunca um `list`, que é a operação com cota diária.
 *
 * E QUEM NÃO TEM KV CONTINUA A FUNCIONAR. Sem `kv`, ou com o KV a falhar, o leitor pede a árvore
 * como sempre pediu. Uma cache indisponível não é um erro: é a ausência de uma economia.
 */

/* A LISTA ÚNICA DE CABEÇALHOS (ver `github-api.js`): o `User-Agent` que o GitHub exige e a versão
 * da API têm UM dono, e um `Bearer` montado à mão neste ficheiro seria a próxima cópia a nascer
 * errada — é exactamente o que o `check-github-headers` guarda. */
const { cabecalhosDe } = require('./github-api.js');

/** O prefixo das chaves. Fica fora de `envelope/`, e por isso o adaptador NÃO lhe põe a escola à
 * frente (`escolar()`, em `motor/adaptadores/cloudflare.js`): a árvore é a mesma para todas. */
const PREFIXO = 'arvore-do-repo/';

/** A chave de uma árvore. Só entra o que identifica o commit e o repositório. */
function chaveDaArvore({ dono, repo, commit }) {
  return PREFIXO + dono + '/' + repo + '/' + commit;
}

/**
 * O SHA DO COMMIT de um ramo — 365 bytes. `null` quando não se conseguiu saber, e nesse caso o
 * leitor não usa cache nenhuma em vez de arriscar uma chave errada.
 *
 * Um `ref` que já É um sha (alguns chamadores passam o commit, não o ramo) não se pergunta: usa-se.
 */
async function commitDoRamo({ token, dono, repo, ref, fetchImpl }) {
  if (/^[0-9a-f]{40}$/i.test(String(ref || ''))) return String(ref);
  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/git/ref/heads/' + encodeURIComponent(ref);
  try {
    const r = await f(url, { method: 'GET', headers: cabecalhosDe(token) });
    if (!r || !r.ok) return null;
    const d = await r.json().catch(() => null);
    const sha = d && d.object && d.object.sha;
    return sha ? String(sha) : null;
  } catch (erro) {
    return null;
  }
}

/**
 * O LEITOR. Devolve `{ caminhos(), custo() }` — `caminhos()` resolve para a lista de `blob` do
 * repositório, já sem diretórios e sem o que não é ficheiro.
 *
 * `kv` é opcional e aceita `{ ler(chave), guardar(chave, texto) }` — a forma do `indice-acervo`.
 * A memoização POR INSTÂNCIA fica: um mesmo pedido que pergunte duas vezes não faz dois pedidos,
 * com ou sem KV.
 */
function criarLeitorDaArvore({ token, dono = 'tmenegaz', repo = 'danca', ref = 'main', fetchImpl, kv } = {}) {
  const f = fetchImpl || fetch;
  const estado = { arvores: 0, kvLeituras: 0, kvEscritas: 0, doCache: null, commit: null };
  let promessa = null;

  async function pedirArvore() {
    estado.arvores += 1;
    const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/git/trees/'
      + encodeURIComponent(ref) + '?recursive=1';
    const r = await f(url, { method: 'GET', headers: cabecalhosDe(token) });
    if (!r.ok) throw new Error('não li a árvore do repositório: HTTP ' + r.status);
    const dados = await r.json().catch(() => null);
    const tree = (dados && dados.tree) || [];
    return tree.filter((t) => t && t.type === 'blob').map((t) => t.path);
  }

  async function carregar() {
    const usaKv = Boolean(kv && typeof kv.ler === 'function' && typeof kv.guardar === 'function');
    if (!usaKv) {
      estado.doCache = false;
      return pedirArvore();
    }

    const commit = await commitDoRamo({ token, dono, repo, ref, fetchImpl: f });
    if (!commit) {
      /* Sem saber o commit não há chave honesta: pede-se a árvore, e não se guarda nada. Gravar
       * debaixo de uma chave adivinhada seria pior do que não ter cache. */
      estado.doCache = false;
      return pedirArvore();
    }
    estado.commit = commit;
    const chave = chaveDaArvore({ dono, repo, commit });
    estado.kvLeituras += 1;
    const guardado = await kv.ler(chave).catch(() => null);
    if (guardado) {
      try {
        const d = JSON.parse(guardado);
        if (d && Array.isArray(d.caminhos)) {
          estado.doCache = true;
          return d.caminhos;
        }
      } catch (erro) {
        /* Cache ilegível é cache ausente: reconstrói-se. Não é erro, é a vida de um derivado. */
      }
    }

    const caminhos = await pedirArvore();
    estado.doCache = false;
    estado.kvEscritas += 1;
    // BEST-EFFORT: um KV cheio ou sem cota não pode impedir a resposta. O derivado é reconstruível.
    await kv.guardar(chave, JSON.stringify({ commit, caminhos })).catch(() => null);
    return caminhos;
  }

  return {
    caminhos() {
      if (!promessa) promessa = carregar();
      return promessa;
    },
    custo() { return Object.assign({}, estado); },
  };
}

module.exports = {
  PREFIXO,
  chaveDaArvore,
  commitDoRamo,
  criarLeitorDaArvore,
};
