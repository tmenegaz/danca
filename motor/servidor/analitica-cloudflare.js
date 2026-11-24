'use strict';

/**
 * analitica-cloudflare.js — os pedidos ao Worker e as operações de KV, POR DIA, medidos.
 *
 * O QUE ISTO SUBSTITUI, e é uma correção de facto, não uma funcionalidade nova.
 *
 * O painel dizia, desde 17/11/2026, que «a leitura de analítica exige um token do Cloudflare com
 * permissão de analítica, **que este Worker não tem**». Medido a 25/11/2026, com o token que o
 * Worker já tem: **tem**. Uma sonda ao GraphQL devolveu as operações de KV e os pedidos por script,
 * com números reais. A frase era falsa, e uma limitação declarada que é falsa é pior do que uma
 * omissão — ela faz quem lê desistir de pedir o número.
 *
 * O QUE SE PEDE, e por que é UMA chamada.
 *
 * Os dois conjuntos vivem debaixo do mesmo `viewer.accounts`. Uma consulta traz os dois, e uma
 * consulta é **um subpedido** — o orçamento do Worker é de 50 por invocação e o painel já gasta 15
 * a 26. Duas consultas seriam dois, e não há razão para isso.
 *
 * A GRANULARIDADE É O DIA, E ISSO FOI MEDIDO CONTRA A ARMADILHA. A primeira sonda agregou por
 * `datetime` (minuto) com `limit: 10000` sobre sete dias: **9 113 grupos num só dia com tráfego**, e
 * um tecto que corta em silêncio. A agregação por `date` dá **2 grupos por dia** (um por script) e
 * nenhum risco de corte — e confere: somados os dois modos no mesmo dia, `2 029` pelos dois lados,
 * diferença zero. A agregação por minuto não foi usada por ser mais fina: foi posta de lado por ter
 * um tecto que mente.
 *
 * O QUE ESTES NÚMEROS SÃO, e o que não são. Vêm de conjuntos **com amostragem adaptativa**
 * (`…Adaptive…`, no nome). Em volume baixo a amostragem é total e o número é exacto; em volume alto
 * o Cloudflare extrapola, e o valor é uma estimativa dele. Não é um número nosso, e está dito no
 * painel — a alternativa seria não o mostrar, e ele é o único que responde «quanto falta para o
 * tecto».
 *
 * O QUE ELE NÃO FAZ: não inventa. Sem token, com o token sem permissão, com o Cloudflare a
 * responder 4xx/5xx ou com `errors` no corpo, devolve `{ok: false, motivo}` — e o painel volta a
 * dizer que não mediu, agora com o motivo verdadeiro.
 */

const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

/**
 * A consulta. `$conta` é o `accountTag`, e as datas são `Date` — os dois como o schema os declara
 * (`date_geq`/`date_leq`), e não como string solta.
 */
const CONSULTA = `
query AnaliticaDoLastro($conta: String!, $de: Date, $ate: Date) {
  viewer {
    accounts(filter: { accountTag: $conta }) {
      pedidos: workersInvocationsAdaptive(
        limit: 1000
        filter: { date_geq: $de, date_leq: $ate }
      ) {
        sum { requests errors subrequests }
        dimensions { date scriptName }
      }
      kv: kvOperationsAdaptiveGroups(
        limit: 1000
        filter: { date_geq: $de, date_leq: $ate }
      ) {
        sum { requests }
        dimensions { date actionType }
      }
    }
  }
}`;

/** `2026-11-24` de um instante, em UTC — o dia da cota é o dia do Cloudflare. */
function diaUtc(instante) {
  const d = instante instanceof Date ? instante : new Date(instante);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Os `dias` dias que terminam em `ate` (inclusive), do mais antigo para o mais novo. */
function janelaDeDias(ate, dias) {
  const fim = diaUtc(ate);
  if (!fim) return null;
  const n = Math.max(1, Math.min(31, Number(dias) || 7));
  const base = new Date(fim + 'T00:00:00Z');
  const inicio = new Date(base.getTime() - (n - 1) * 24 * 3600 * 1000);
  return { desde: diaUtc(inicio), ate: fim, dias: n };
}

const ACOES = ['read', 'write', 'list', 'delete'];

/** O nome que o painel usa, e o campo que ele lê. Uma tradução, num sítio só. */
const CAMPO_DA_ACAO = { read: 'leituras', write: 'escritas', list: 'listas', delete: 'apagamentos' };

/**
 * LÊ A ANALÍTICA. Devolve sempre um objecto — nunca lança, porque um painel que rebenta por causa
 * de um dos seus números não serve para nada.
 *
 * @param {object} o
 * @param {string} o.token      o `CLOUDFLARE_API_TOKEN` do Worker
 * @param {string} o.accountId  o `accountTag`
 * @param {string|Date} [o.agora] o instante de referência (injectável para a prova)
 * @param {number} [o.dias]     quantos dias (1 a 31); por omissão 7
 * @param {Function} [o.fetchImpl]
 */
async function analiticaDoCloudflare({ token, accountId, agora, dias = 7, fetchImpl } = {}) {
  const janela = janelaDeDias(agora || new Date(), dias);
  if (!janela) return { ok: false, motivo: 'o instante de referência não é uma data válida' };
  if (!token) return { ok: false, motivo: 'falta o CLOUDFLARE_API_TOKEN no Worker', janela };
  if (!accountId) return { ok: false, motivo: 'falta o id da conta do Cloudflare', janela };

  const f = fetchImpl || fetch;
  let resposta = null;
  try {
    resposta = await f(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'User-Agent': 'sistema-lastro',
      },
      body: JSON.stringify({
        query: CONSULTA,
        variables: { conta: String(accountId), de: janela.desde, ate: janela.ate },
      }),
    });
  } catch (erro) {
    return { ok: false, motivo: 'não consegui falar com o Cloudflare', janela };
  }
  if (!resposta || !resposta.ok) {
    /* O 403 tem nome próprio, e é o caso que a frase antiga descrevia: o token existe e não tem a
     * permissão. Dizer «sem permissão» é o que faz alguém ir ao painel resolver. */
    const estado = resposta ? resposta.status : '?';
    return {
      ok: false,
      status: estado,
      motivo: estado === 403 || estado === 401
        ? 'o CLOUDFLARE_API_TOKEN não tem a permissão Account Analytics: Read (HTTP ' + estado + ')'
        : 'o Cloudflare respondeu ' + estado,
      janela,
    };
  }

  let corpo = null;
  try { corpo = await resposta.json(); } catch (erro) { corpo = null; }
  if (!corpo) return { ok: false, motivo: 'a resposta do Cloudflare não era JSON', janela };
  /* O GRAPHQL DEVOLVE `errors` COM STATUS 200. Um `data` pela metade com `errors` ao lado é uma
   * leitura falhada — e ler só o `data` publicaria metade dos números como se fossem todos. */
  if (Array.isArray(corpo.errors) && corpo.errors.length) {
    return { ok: false, motivo: 'o GraphQL respondeu com erro: ' + String(corpo.errors[0].message || ''), janela };
  }
  const contas = corpo.data && corpo.data.viewer && corpo.data.viewer.accounts;
  const conta = Array.isArray(contas) ? contas[0] : null;
  if (!conta) return { ok: false, motivo: 'o Cloudflare não devolveu a conta pedida', janela };

  /* O DIA A DIA, preenchido a zero. Um dia sem tráfego não aparece na resposta — e «não aparece» é
   * zero de verdade: nenhum pedido foi feito. Ao contrário das operações por dia que não se medem,
   * aqui a ausência TEM significado, e o zero é o valor certo. */
  const porDia = new Map();
  for (let i = 0; i < janela.dias; i += 1) {
    const d = diaUtc(new Date(new Date(janela.desde + 'T00:00:00Z').getTime() + i * 24 * 3600 * 1000));
    porDia.set(d, { dia: d, pedidos: 0, erros: 0, subpedidos: 0, leituras: 0, escritas: 0, listas: 0, apagamentos: 0 });
  }

  const porScript = new Map();
  for (const p of Array.isArray(conta.pedidos) ? conta.pedidos : []) {
    const dia = p && p.dimensions && p.dimensions.date;
    const alvo = porDia.get(dia);
    if (!alvo) continue;   // fora da janela: o filtro é do servidor, a guarda é nossa
    const soma = p.sum || {};
    alvo.pedidos += Number(soma.requests) || 0;
    alvo.erros += Number(soma.errors) || 0;
    alvo.subpedidos += Number(soma.subrequests) || 0;
    const script = String((p.dimensions && p.dimensions.scriptName) || 'sem nome');
    const s = porScript.get(script) || { script, pedidos: 0 };
    s.pedidos += Number(soma.requests) || 0;
    porScript.set(script, s);
  }

  for (const k of Array.isArray(conta.kv) ? conta.kv : []) {
    const dia = k && k.dimensions && k.dimensions.date;
    const alvo = porDia.get(dia);
    if (!alvo) continue;
    const tipo = String((k.dimensions && k.dimensions.actionType) || '');
    if (ACOES.indexOf(tipo) === -1) continue;
    alvo[CAMPO_DA_ACAO[tipo]] += Number(k.sum && k.sum.requests) || 0;
  }

  const dias_ = [...porDia.values()];
  const hoje = dias_.find((d) => d.dia === janela.ate) || null;
  return {
    ok: true,
    janela,
    dias: dias_,
    hoje,
    porScript: [...porScript.values()].sort((a, b) => b.pedidos - a.pedidos),
    /* OS DOIS GRUPOS VÊM LIMITADOS A 1 000. Num parque deste tamanho são dezenas; se algum dia
     * forem mil, o número está cortado e TEM de o dizer — é a mesma disciplina do `truncado` da
     * janela do GitHub. */
    truncado: (Array.isArray(conta.pedidos) && conta.pedidos.length >= 1000)
      || (Array.isArray(conta.kv) && conta.kv.length >= 1000),
    fonte: 'graphql',
  };
}

module.exports = {
  analiticaDoCloudflare, janelaDeDias, diaUtc, CONSULTA, ENDPOINT, CAMPO_DA_ACAO,
};
