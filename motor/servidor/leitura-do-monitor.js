'use strict';

/**
 * leitura-do-monitor.js — O QUE O PAINEL LÊ DO MUNDO, E O QUE ELE GUARDA PARA NÃO RELER
 * (17/11/2026).
 *
 * PORQUE É UM MÓDULO SEPARADO do `monitoramento.js`: aquele é CONTA (puro, mede-se com fixtures);
 * este é LEITURA (fala com o GitHub, com o KV, com `Date`). Misturar os dois tornaria a conta
 * intestável — é a mesma divisão do `mensalidades.js` (conta) e do `raiz.js` (rotas).
 *
 * AS DUAS LEITURAS CARAS, e o que se faz com elas:
 *
 *   · **Os runs do GitHub.** Uma listagem por página, e cada run custa uma chamada aos jobs para
 *     se saber os minutos FACTURADOS (o GitHub arredonda cada job ao minuto, e é isso que a fatura
 *     cobra). Sem cache, abrir o painel custaria dezenas de pedidos.
 *   · **As chaves do KV de cada escola.** Um `list()` por escola, e a listagem é cota (1.000/dia no
 *     plano gratuito). O painel não pode ser o que gasta a cota que ele mede.
 *
 * A CACHE É UMA CHAVE SÓ, com um objecto: `monitor/cache`. Um valor, uma leitura, uma escrita. O
 * QUE se guarda é o RESULTADO da medição de cada run (`{id: {minutos, jobs}}`) — e não o run
 * inteiro: o que interessa é a conta, e ela não muda depois de o run acabar.
 *
 * O QUE NUNCA SE GUARDA: o resultado de um run que ainda está a correr. Ele ainda vai gastar, e
 * gravar o parcial faria o número de hoje ficar congelado no de ontem.
 */

const janelaDe = (dias) => Math.max(1, Math.round(Number(dias) || 30));

/** O instante de corte da janela, em ISO. */
function desde(dias, agora) {
  const d = agora ? new Date(agora) : new Date();
  return new Date(d.getTime() - janelaDe(dias) * 24 * 3600 * 1000).toISOString();
}

/**
 * OS RUNS DA JANELA, como o GitHub os dá.
 *
 * `per_page=100` e um tecto de páginas: um repositório com muita actividade num mês passaria das
 * 100 páginas, e aí o número fica DECLARADO como truncado em vez de aparecer completo e errado.
 * O tecto é de 5 páginas (500 runs) — acima disso, o painel diz que a janela está cortada.
 */
async function runsDoGithub({ token, dono, repo, dias, agora, fetchImpl, paginas = 5 } = {}) {
  const f = fetchImpl || fetch;
  if (!token) return { ok: false, motivo: 'sem GITHUB_TOKEN', runs: [], truncado: false };
  const corte = desde(dias, agora);
  const lista = [];
  let truncado = false;
  for (let p = 1; p <= paginas; p += 1) {
    const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/actions/runs'
      + '?per_page=100&page=' + p;
    let r = null;
    try {
      r = await f(url, {
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'sistema-lastro',
        },
      });
    } catch (erro) {
      return { ok: false, motivo: 'não consegui falar com o GitHub', runs: lista, truncado };
    }
    if (!r || !r.ok) {
      return { ok: false, motivo: 'o GitHub respondeu ' + (r ? r.status : '?'), runs: lista, truncado };
    }
    const dados = await r.json().catch(() => null);
    const pagina = (dados && Array.isArray(dados.workflow_runs)) ? dados.workflow_runs : [];
    for (const w of pagina) {
      const quando = String(w.run_started_at || w.created_at || '');
      if (!quando || quando < corte) continue;
      const inicio = Date.parse(quando);
      const fim = Date.parse(String(w.updated_at || quando));
      lista.push({
        id: String(w.id),
        workflow: String((w.name || w.workflow_id || 'sem nome')).trim(),
        quando,
        estado: String(w.status || ''),
        conclusao: String(w.conclusion || ''),
        segundos: Number.isFinite(inicio) && Number.isFinite(fim) ? Math.max(0, Math.round((fim - inicio) / 1000)) : 0,
      });
    }
    /* A PÁGINA SAIU DO CORTE INTEIRA: as seguintes são mais antigas ainda. */
    const ultima = pagina.length ? String(pagina[pagina.length - 1].run_started_at || '') : '';
    if (!pagina.length || pagina.length < 100 || (ultima && ultima < corte)) break;
    if (p === paginas) truncado = true;
  }
  return { ok: true, runs: lista, truncado, desde: corte };
}

/**
 * OS MINUTOS FACTURADOS DE UM RUN — os jobs, e a conta que o GitHub faz.
 *
 * `null` significa «ainda não medido»: quem chama decide se mede agora. Um run terminado mede-se
 * UMA vez e guarda-se; um run em curso não se mede, porque o parcial envelheceria.
 */
async function minutosDoRunNoGithub({ token, dono, repo, id, fetchImpl } = {}) {
  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/actions/runs/' + id + '/jobs?per_page=100';
  try {
    const r = await f(url, {
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'sistema-lastro',
      },
    });
    if (!r || !r.ok) return null;
    const dados = await r.json().catch(() => null);
    const jobs = (dados && Array.isArray(dados.jobs)) ? dados.jobs : [];
    if (!jobs.length) return null;
    return jobs.map((j) => {
      const a = Date.parse(String(j.started_at || ''));
      const b = Date.parse(String(j.completed_at || ''));
      return { segundos: Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, Math.round((b - a) / 1000)) : 0 };
    });
  } catch (erro) {
    return null;
  }
}

/**
 * AS CHAVES DE UMA ESCOLA, com o tamanho de cada valor.
 *
 * O `list()` devolve nomes e metadados; o tamanho só vem com `include_metadata`, e nem todos os
 * adaptadores o devolvem. Sem tamanho, conta-se as chaves e diz-se que o tamanho não foi medido —
 * o que é diferente de zero.
 */
async function chavesDaEscola({ kv, escola } = {}) {
  if (!kv || typeof kv.list !== 'function') return null;
  const prefixo = 'bastidores/' + escola + '/';
  let total = 0;
  let bytes = 0;
  let comTamanho = false;
  let cursor = undefined;
  for (let volta = 0; volta < 10; volta += 1) {
    let pagina = null;
    try {
      pagina = await kv.list({ prefix: prefixo, cursor });
    } catch (erro) {
      return { total, bytes, comTamanho };
    }
    const chaves = (pagina && Array.isArray(pagina.keys)) ? pagina.keys : [];
    for (const k of chaves) {
      total += 1;
      if (k && k.metadata && Number.isFinite(k.metadata.bytes)) {
        bytes += Number(k.metadata.bytes);
        comTamanho = true;
      }
    }
    if (!pagina || pagina.list_complete || !pagina.cursor) break;
    cursor = pagina.cursor;
  }
  return { total, bytes, comTamanho };
}

module.exports = { desde, runsDoGithub, minutosDoRunNoGithub, chavesDaEscola };
