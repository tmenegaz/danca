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
 * O CORTE PODE SER UM INSTANTE (`desdeIso`) E NÃO SÓ UM NÚMERO DE DIAS (17/11/2026). A cota do
 * GitHub não é uma janela móvel de 30 dias: é um CICLO MENSAL que volta a zero no dia 1. Medir 30
 * dias rolantes e comparar com um tecto mensal comparava duas coisas diferentes — e foi assim que
 * o painel mostrou 3.623 min de uma cota em que a fatura dizia 1.930.
 */
async function runsDoGithub({ token, dono, repo, dias, agora, desdeIso, fetchImpl, paginas = 5 } = {}) {
  const f = fetchImpl || fetch;
  if (!token) return { ok: false, motivo: 'sem GITHUB_TOKEN', runs: [], truncado: false };
  const corte = desdeIso ? String(desdeIso) : desde(dias, agora);
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
 * O QUE O FORNECEDOR DIZ QUE FOI FACTURADO — a conferência contra a fonte, num pedido só.
 * (17/11/2026)
 *
 * PORQUE ISTO EXISTE, e não é zelo abstracto. O painel calcula os minutos pela REGRA DOCUMENTADA
 * do GitHub («cada job arredondado ao minuto»). Uma regra documentada não é a fatura. No primeiro
 * dia em produção, `.../runs/<id>/timing` — o próprio campo de facturação do fornecedor — respondeu
 * `billable.UBUNTU.total_ms = 0` a **todas** as execuções medidas, com os jobs a demorarem 13 a 34
 * segundos de relógio. Ou seja: a regra dava 1 minuto por job e o fornecedor dava zero.
 *
 * Qual dos dois está certo não se decide dentro do código: decide-se na fatura. O que o código pode
 * fazer — e passa a fazer — é **mostrar os dois** e deixar a divergência à vista, em vez de
 * apresentar uma conta como se fosse um extracto. O painel pede este campo uma vez de vez em quando
 * (6 horas de cache), para não gastar subpedidos a repetir a mesma pergunta.
 *
 * `null` significa «não deu para perguntar», e não «zero».
 */
async function facturavelDoRunNoGithub({ token, dono, repo, id, fetchImpl } = {}) {
  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/actions/runs/' + id + '/timing';
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
    const billable = (dados && dados.billable) || {};
    let ms = 0;
    let jobs = 0;
    for (const chave of Object.keys(billable)) {
      const b = billable[chave] || {};
      ms += Math.max(0, Number(b.total_ms) || 0);
      jobs += Math.max(0, Number(b.jobs) || 0);
    }
    return {
      ms,
      jobs,
      relogioSegundos: Math.max(0, Math.round((Number(dados && dados.run_duration_ms) || 0) / 1000)),
    };
  } catch (erro) {
    return null;
  }
}

/**
 * O CONSUMO FACTURADO DO MÊS — a FONTE, e não a regra (17/11/2026).
 *
 * PORQUE ISTO PASSA A SER O NÚMERO PRINCIPAL. Toda a conta do painel era uma REGRA (cada job
 * arredondado ao minuto) porque era o que se podia ler daqui. A regra não é a fatura, e no dia em
 * que se compararam as duas, discordaram: a regra dava ~3.600 min por 30 dias e a fatura da
 * proprietária dizia **1.930 minutos de 2.000, de 1 a 17 de Novembro** — um ciclo MENSAL, não uma
 * janela rolante. Duas correcções caíram de uma vez: o número principal é o da fatura, e a janela
 * é o mês.
 *
 * A PERMISSÃO, e ela é exacta porque o GitHub a diz no próprio 403. O cabeçalho
 * `x-accepted-github-permissions` respondeu **`plan=read`**: um token fino precisa da permissão de
 * CONTA «Plan → Read-only». Sem ela, este pedido responde 403 — e o painel di-lo, com o caminho
 * para a resolver, em vez de mostrar a regra como se fosse a fatura.
 *
 * O ENDEREÇO DEPENDE DE QUEM É O DONO. `/users/{login}/settings/billing/actions` para uma conta de
 * pessoa, `/orgs/{org}/settings/billing/actions` para uma organização. Tenta-se o primeiro e, se
 * ele disser 404 (é uma organização), o segundo — dois pedidos no pior caso, e só de hora a hora.
 */
async function consumoFacturadoDoGithub({ token, dono, fetchImpl } = {}) {
  const f = fetchImpl || fetch;
  if (!token) return { ok: false, motivo: 'sem GITHUB_TOKEN', pede: 'plan=read' };
  const cabecalhos = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'sistema-lastro',
  };
  const tentativas = [
    { via: 'utilizador', url: 'https://api.github.com/users/' + dono + '/settings/billing/actions' },
    { via: 'organizacao', url: 'https://api.github.com/orgs/' + dono + '/settings/billing/actions' },
  ];
  let motivo = 'não consegui falar com o GitHub';
  for (const t of tentativas) {
    let r = null;
    try {
      r = await f(t.url, { headers: cabecalhos });
    } catch (erro) {
      continue;
    }
    if (r && r.status === 404) continue;
    if (!r || !r.ok) {
      motivo = r && r.status === 403
        ? 'o token não pode ler a facturação — falta a permissão de conta «Plan → Read-only» (plan=read)'
        : 'o GitHub respondeu ' + (r ? r.status : '?') + ' ao pedido da facturação';
      return { ok: false, motivo, pede: r && r.status === 403 ? 'plan=read' : null };
    }
    const d = await r.json().catch(() => null);
    if (!d || !Number.isFinite(Number(d.total_minutes_used))) {
      return { ok: false, motivo: 'a resposta da facturação veio sem o total de minutos', pede: null };
    }
    return {
      ok: true,
      via: t.via,
      minutosUsados: Number(d.total_minutes_used) || 0,
      minutosPagos: Number(d.total_paid_minutes_used) || 0,
      incluidos: Number(d.included_minutes) || 0,
      detalhe: d.minutes_used_breakdown || null,
    };
  }
  return { ok: false, motivo, pede: null };
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

module.exports = {
  desde, runsDoGithub, minutosDoRunNoGithub, facturavelDoRunNoGithub,
  consumoFacturadoDoGithub, chavesDaEscola,
};
