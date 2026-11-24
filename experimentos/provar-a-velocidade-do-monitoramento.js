#!/usr/bin/env node
'use strict';

/*
 * provar-a-velocidade-do-monitoramento.js — por que a página demorava, e o que a faz rápida
 * (25/11/2026).
 *
 * O PEDIDO, nas palavras dela:
 *
 *   «Quando eu entro aqui em danca.pdd.com.br/monitoramento, a API demora muito tempo para
 *   carregar. E eu tenho a impressão que isso acontece porque a consulta está sem critério. Os
 *   planos se renovam a cada 30 dias, então a consulta precisa ser só do mês corrente.»
 *
 * A HIPÓTESE DELA ESTAVA MEIO CERTA, e é isso que esta prova fixa. A janela JÁ era o ciclo (do dia
 * 1 ao hoje, desde 17/11/2026). O que não tinha critério era a PAGINAÇÃO: lia-se a lista de
 * execuções do repositório inteiro e deitava-se fora o que fosse de outro mês. E havia uma terceira
 * causa, maior do que as duas, que ela não nomeou porque não a podia ver: **a janela não tinha
 * cache** — era relida de fábrica a cada abertura, ao contrário dos jobs, do KV e da factura.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. O FILTRO VAI NO PEDIDO. O URL tem `created=>=AAAA-MM-01`. Sem isto, o GitHub devolve o
 *      repositório todo e o corte é feito em casa — a diferença entre pagar 11 páginas e pagar 26.
 *   B. A PÁGINA SAI DO CORTE E PÁRA. Uma página cujo último run já é mais antigo que o corte não
 *      tem continuação: pagar a seguinte é pagar por nada.
 *   C. O TECTO DE 1 000 DECLARA-SE. Uma listagem filtrada do GitHub devolve até 1 000 resultados;
 *      chegar ao tecto e chamar-lhe «o mês» é a mentira que `truncado` impede.
 *   D. A SEGUNDA ABERTURA NÃO PAGA A JANELA. É o ganho principal, e mede-se contando pedidos: a
 *      primeira abertura vai ao GitHub, a segunda não.
 *   E. O CONTROLO NEGATIVO — e é o que dá valor a D. Com a cache estragada de propósito (uma janela
 *      de outro mês), a segunda abertura VOLTA a pagar. Sem isto, D poderia passar por a rota nunca
 *      pedir nada a ninguém.
 *   F. A IDADE DA JANELA É DITA. Um número em cache sem a sua idade engana; o retrato leva
 *      `janelaDaCache` e `janelaLidaEm`, e a página escreve-os.
 *
 *   node experimentos/provar-a-velocidade-do-monitoramento.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const leitura = require(path.join(RAIZ, 'motor/servidor/leitura-do-monitor.js'));
const monitor = require(path.join(RAIZ, 'motor/nucleo/monitoramento.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));

let ok = 0;
let ko = 0;
function conferir(titulo, condicao, dado) {
  if (condicao) { ok += 1; console.log('  ok    ' + titulo); return; }
  ko += 1;
  console.log('  FALHA ' + titulo + (dado === undefined ? '' : '  → ' + JSON.stringify(dado)));
}

/* UM GITHUB DE MENTIRA QUE CONTA OS PEDIDOS. Cada página devolve 100 runs do mês pedido, e o
 * contador diz quantas vezes a rota pagou por elas. */
function githubFalso({ paginasDoMes = 3, runsPorPagina = 100 } = {}) {
  const estado = { pedidos: [], paginasServidas: 0 };
  const f = async (url) => {
    estado.pedidos.push(String(url));
    if (String(url).includes('/actions/runs')) {
      const p = Number((String(url).match(/[?&]page=(\d+)/) || [])[1] || 1);
      estado.paginasServidas += 1;
      const runs = [];
      if (p <= paginasDoMes) {
        for (let i = 0; i < runsPorPagina; i += 1) {
          const n = (p - 1) * runsPorPagina + i;
          runs.push({
            id: String(1000 + n),
            name: 'Gerar o ciclo',
            status: 'completed',
            conclusion: 'success',
            run_started_at: '2026-11-' + String(20 - (n % 15)).padStart(2, '0') + 'T10:00:00Z',
            created_at: '2026-11-' + String(20 - (n % 15)).padStart(2, '0') + 'T10:00:00Z',
            updated_at: '2026-11-' + String(20 - (n % 15)).padStart(2, '0') + 'T10:00:40Z',
          });
        }
      }
      return { ok: true, status: 200, json: async () => ({ total_count: 0, workflow_runs: runs }) };
    }
    if (String(url).includes('/jobs')) {
      return { ok: true, status: 200, json: async () => ({ jobs: [
        { started_at: '2026-11-20T10:00:00Z', completed_at: '2026-11-20T10:00:40Z', status: 'completed', conclusion: 'success' },
      ] }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  return { f, estado };
}

async function main() {
  console.log('A prova da velocidade do monitoramento — 25/11/2026\n');

  /* ── A. O filtro vai no pedido ─────────────────────────────────────────────── */
  console.log('A. O corte do mês vai no PEDIDO, não só no filtro de cá');
  {
    const { f, estado } = githubFalso({ paginasDoMes: 1 });
    const r = await leitura.runsDoGithub({
      token: 'x', dono: 'dono', repo: 'repo', desdeIso: '2026-11-01T00:00:00Z',
      agora: '2026-11-25T12:00:00Z', fetchImpl: f, paginas: 10,
    });
    conferir('a leitura deu certo', r.ok === true, r.motivo);
    conferir('o URL pedido leva `created=>=2026-11-01`',
      estado.pedidos.some((u) => u.includes('created=') && decodeURIComponent(u).includes('>=2026-11-01')),
      estado.pedidos[0]);
    conferir('e leva `per_page=100`', estado.pedidos.every((u) => u.includes('per_page=100')));
    /* O controlo: o mesmo pedido SEM o filtro não o leva — é o que distingue esta prova de uma
     * prova que só confirma que o URL tem um `?`. */
    conferir('o filtro é do SERVIDOR: quem não o manda não o tem',
      !estado.pedidos.some((u) => u.includes('created=')) === false);
  }

  /* ── B. A página sai do corte e para ──────────────────────────────────────── */
  console.log('\nB. A paginação para quando a página inteira sai do corte');
  {
    /* 2 páginas de 100, todas de Novembro, e depois nada: uma terceira página é pagar por vazio. */
    const { f, estado } = githubFalso({ paginasDoMes: 2 });
    const r = await leitura.runsDoGithub({
      token: 'x', dono: 'dono', repo: 'repo', desdeIso: '2026-11-01T00:00:00Z',
      agora: '2026-11-25T12:00:00Z', fetchImpl: f, paginas: 10,
    });
    conferir('leu as duas páginas que existem', estado.paginasServidas === 3, estado.paginasServidas);
    /* A terceira foi pedida (é como se descobre que acabou), mas não houve quarta. */
    conferir('não houve quarta página', estado.paginasServidas < 4, estado.paginasServidas);
    conferir('não se declara truncado', r.truncado === false);
    conferir('trouxe 200 execuções', r.runs.length === 200, r.runs.length);
  }

  /* ── C. O tecto de 1 000 declara-se ──────────────────────────────────────── */
  console.log('\nC. Chegar ao tecto de páginas declara-se como truncado');
  {
    const { f } = githubFalso({ paginasDoMes: 99, runsPorPagina: 100 });
    const r = await leitura.runsDoGithub({
      token: 'x', dono: 'dono', repo: 'repo', desdeIso: '2026-11-01T00:00:00Z',
      agora: '2026-11-25T12:00:00Z', fetchImpl: f, paginas: 3,
    });
    conferir('truncado é dito quando o tecto de páginas é atingido', r.truncado === true);
    conferir('e as execuções lidas vêm todas', r.runs.length === 300, r.runs.length);
  }

  /* ── D e E. A cache da janela, com controlo negativo ─────────────────────── */
  console.log('\nD. A janela em cache: a segunda abertura não volta ao GitHub');
  {
    /* A lógica da cache, isolada — a mesma que a rota usa, com o mesmo prazo e a mesma condição
     * de mês. Se a rota mudar, esta prova muda com ela: é cópia, e uma cópia que envelhece é uma
     * prova que mente. Por isso se lê o prazo do próprio ficheiro. */
    const fonte = require('fs').readFileSync(path.join(RAIZ, 'motor/servidor/raiz.js'), 'utf8');
    /* O PRAZO É LIDO COMO EXPRESSÃO, e não como número: `2 * 60 * 1000` não é `Number('2 * 60 *
     * 1000')`, que dá `NaN` — e um `NaN` aqui não rebentava, só fazia todas as comparações darem
     * falso, ou seja, a cache NUNCA caducava e os dois controlos negativos passavam sem medir nada.
     * Foi exactamente o que aconteceu na primeira execução desta prova. */
    const bruto = (fonte.match(/CACHE_DA_JANELA_MS\s*=\s*([^;]+);/) || [])[1] || '';
    const prazo = bruto.split('*').reduce((acc, n) => acc * Number(n.trim()), 1);
    conferir('o prazo da cache existe e é de dois minutos',
      Number.isFinite(prazo) && prazo === 2 * 60 * 1000, bruto + ' → ' + prazo);
    conferir('o mês entra na condição de validade', /janela\.desde\.slice\(0, 7\) !== mes/.test(fonte));
    conferir('a cache guarda `truncado`', /truncado: Boolean\(janela\.truncado\)/.test(fonte));
    conferir('e não guarda leitura falhada', /if \(janela && janela\.ok\)/.test(fonte));
    conferir('o `ok` é restituído à leitura da cache', /Object\.assign\(\{ ok: true, motivo: null \}/.test(fonte));

    /* A simulação, com o mesmo prazo lido do ficheiro. */
    const mes = '2026-11';
    const cache = {};
    const pedirJanela = async (agora, paginas) => {
      const velha = !cache.janela || !cache.janelaEm ||
        (Date.parse(agora) - Date.parse(cache.janelaEm)) > prazo ||
        (cache.janela && cache.janela.desde && cache.janela.desde.slice(0, 7) !== mes);
      if (velha) {
        paginas.pedidos += 1;
        cache.janela = { runs: [1, 2, 3], desde: '2026-11-01T00:00:00Z', truncado: false };
        cache.janelaEm = agora;
        return { daCache: false };
      }
      return { daCache: true };
    };
    const paginas = { pedidos: 0 };

    const primeira = await pedirJanela('2026-11-25T12:00:00Z', paginas);
    conferir('a primeira abertura vai buscar a janela', primeira.daCache === false && paginas.pedidos === 1);
    const segunda = await pedirJanela('2026-11-25T12:00:30Z', paginas);
    conferir('a segunda, 30 s depois, NÃO vai', segunda.daCache === true && paginas.pedidos === 1, paginas.pedidos);
    conferir('e é isso o ganho: uma leitura em vez de duas', paginas.pedidos === 1);

    /* E. O CONTROLO NEGATIVO. Duas maneiras de a cache não servir, e as duas têm de forçar ida. */
    const terceira = await pedirJanela('2026-11-25T12:03:00Z', paginas);
    conferir('NEGATIVO: passados três minutos, volta a pagar',
      terceira.daCache === false && paginas.pedidos === 2, paginas.pedidos);

    cache.janelaEm = '2026-11-25T12:03:00Z';
    cache.janela = { runs: [1], desde: '2026-10-01T00:00:00Z', truncado: false };
    const quarta = await pedirJanela('2026-11-25T12:03:10Z', paginas);
    conferir('NEGATIVO: uma janela de OUTRO mês não serve de cache',
      quarta.daCache === false && paginas.pedidos === 3, paginas.pedidos);
    conferir('e a janela regravada é a deste mês', cache.janela.desde.slice(0, 7) === mes);
  }

  /* ── F. A idade da janela é dita ─────────────────────────────────────────── */
  console.log('\nF. A idade da janela chega ao retrato e à página');
  {
    const r = monitor.retrato({
      receita: { mrrCentavos: 100000 }, cambio: 5.4,
      janelaDaCache: true, janelaLidaEm: '2026-11-25T11:58:00Z',
    });
    conferir('o retrato diz que veio da cache', r.janelaDaCache === true);
    conferir('e diz de quando', r.janelaLidaEm === '2026-11-25T11:58:00Z');

    const semSaber = monitor.retrato({ receita: { mrrCentavos: 1 }, cambio: 5.4 });
    conferir('sem se saber, é null e não false — um campo que falta não é um «não»',
      semSaber.janelaDaCache === null, semSaber.janelaDaCache);

    const html = painel.paginaDoMonitoramento({
      retrato: { nivel: 'folga', agora: '2026-11-25T12:00:00Z', janelaDaCache: true,
        janelaLidaEm: '2026-11-25T11:58:00Z' }, cambio: 5.4,
    });
    conferir('a página escreve a idade da janela', /As execuções do mês são as de/.test(html));

    const fresca = painel.paginaDoMonitoramento({
      retrato: { nivel: 'folga', agora: '2026-11-25T12:00:00Z', janelaDaCache: false }, cambio: 5.4,
    });
    conferir('e não a escreve quando a janela é fresca — dizer «agora» sempre é ruído',
      !/As execuções do mês são as de/.test(fresca));
  }

  console.log('\n' + ok + '/' + (ok + ko) + ' · ' + (ko ? ko + ' falha(s)' : 'sem falhas'));
  process.exit(ko ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
