#!/usr/bin/env node
'use strict';

/*
 * provar-a-analitica-do-cloudflare.js — os pedidos e as operações de KV, medidos (25/11/2026).
 *
 * O QUE ELA PEDIU, e o que isto corrige:
 *
 *   «precisa habilitar no worker do Cloudflare a permissão de analítica para você poder fazer aqui um
 *   monitoramento dos pedidos que são feitos por dia no worker, a escrita de KV por dia e a leitura
 *   de KV por dia. Como é que eu faço isso?»
 *
 * A resposta foi: **não é preciso habilitar nada, já está**. E o painel dizia o contrário — que «a
 * leitura de analítica exige um token com permissão de analítica, **que este Worker não tem**». Uma
 * limitação declarada que é falsa é pior do que uma omissão: faz quem lê desistir de pedir o número.
 *
 * O QUE ESTA PROVA AFIRMA:
 *
 *   A. UMA consulta para as duas famílias, e não duas — o orçamento do Worker é de 50 subpedidos e
 *      cada chamada é um. O filtro vai no PEDIDO (o `accountTag` e as duas datas), e não em casa.
 *   B. O dia a dia: os dias sem tráfego entram a ZERO — e aqui o zero é um facto, não uma ausência
 *      de medição, porque a pergunta é «quantos pedidos houve» e a resposta é nenhum.
 *   C. As quatro acções do KV mapeiam para os quatro campos, e um grupo fora da janela é ignorado.
 *   D. O QUE FALHA É DECLARADO, E NUNCA ZERADO. Sem token; 403 (o token sem a permissão — a frase
 *      certa para quem tem de ir resolver); `errors` no corpo com HTTP 200; rede a rebentar. Nos
 *      quatro, `ok: false` com motivo — e o painel volta a dizer que não mediu, com o motivo
 *      verdadeiro.
 *   E. O PICO MANDA NO ALERTA, e não o hoje. A cota é diária e volta a zero: hoje a zero com um pico
 *      a 90% é um dia que pode acontecer outra vez, e o nível tem de o dizer. Controlo negativo: se
 *      o alerta olhasse o hoje, este parque dava «folga».
 *   F. O PICADO É DITO. Chegar ao tecto de 1 000 grupos faz do número um MÍNIMO, e um mínimo
 *      apresentado como total é a mentira que o painel existe para evitar.
 *   G. A PÁGINA: as barras do pico, o dia em que ele aconteceu, e o aviso do «não mede» que
 *      DESAPARECE quando se mede — era ele que carregava a frase falsa.
 *
 *   node experimentos/provar-a-analitica-do-cloudflare.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const analitica = require(path.join(RAIZ, 'motor/servidor/analitica-cloudflare.js'));
const monitor = require(path.join(RAIZ, 'motor/nucleo/monitoramento.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));

let ok = 0;
let ko = 0;
function conferir(titulo, condicao, dado) {
  if (condicao) { ok += 1; console.log('  ok    ' + titulo); return; }
  ko += 1;
  console.log('  FALHA ' + titulo + (dado === undefined ? '' : '  → ' + JSON.stringify(dado)));
}

const CONTA = 'conta-de-prova';
const AGORA = new Date('2026-11-25T12:00:00Z');

/** Um Cloudflare de mentira que devolve o que lhe mandarem, e conta os pedidos. */
function cloudflareFalso({ pedidos = [], kv = [], status = 200, errors = null, rebenta = false } = {}) {
  const visto = { chamadas: [], corpo: null };
  const f = async (url, init) => {
    visto.chamadas.push(String(url));
    if (rebenta) throw new Error('rede em baixo');
    const corpo = JSON.parse(init.body);
    visto.corpo = corpo;
    if (status !== 200) {
      return { ok: false, status, json: async () => ({ success: false, errors: [{ message: 'x' }] }) };
    }
    return {
      ok: true, status: 200,
      json: async () => (errors
        ? { data: null, errors }
        : { data: { viewer: { accounts: [{ pedidos, kv }] } }, errors: null }),
    };
  };
  return { f, visto };
}

const PEDIDOS = [
  { dimensions: { date: '2026-11-20', scriptName: 'danca' }, sum: { requests: 2000, errors: 3, subrequests: 900 } },
  { dimensions: { date: '2026-11-20', scriptName: 'lastro-teste' }, sum: { requests: 962, errors: 0, subrequests: 100 } },
  { dimensions: { date: '2026-11-24', scriptName: 'danca' }, sum: { requests: 512, errors: 0, subrequests: 40 } },
  { dimensions: { date: '2026-10-01', scriptName: 'danca' }, sum: { requests: 999999, errors: 0, subrequests: 0 } },
];
const KV = [
  { dimensions: { date: '2026-11-20', actionType: 'read' }, sum: { requests: 12804 } },
  { dimensions: { date: '2026-11-20', actionType: 'write' }, sum: { requests: 900 } },
  { dimensions: { date: '2026-11-20', actionType: 'list' }, sum: { requests: 61 } },
  { dimensions: { date: '2026-11-20', actionType: 'delete' }, sum: { requests: 31 } },
  { dimensions: { date: '2026-11-20', actionType: 'inventado' }, sum: { requests: 777 } },
  { dimensions: { date: '2026-10-01', actionType: 'read' }, sum: { requests: 999999 } },
];

(async () => {
  console.log('A analítica do Cloudflare — 25/11/2026\n');

  /* ── A. Uma consulta, com o filtro no pedido ─────────────────────────────── */
  console.log('A. UMA consulta para as duas famílias, com o filtro no PEDIDO');
  {
    const { f, visto } = cloudflareFalso({ pedidos: PEDIDOS, kv: KV });
    const r = await analitica.analiticaDoCloudflare({
      token: 'x', accountId: CONTA, agora: AGORA, dias: 7, fetchImpl: f,
    });
    conferir('leu', r.ok === true, r.motivo);
    conferir('foi UMA chamada, e não duas', visto.chamadas.length === 1, visto.chamadas.length);
    conferir('ao endpoint do GraphQL', visto.chamadas[0] === analitica.ENDPOINT, visto.chamadas[0]);
    conferir('com o accountTag do parâmetro', visto.corpo.variables.conta === CONTA, visto.corpo.variables);
    conferir('e a janela de 7 dias no pedido',
      visto.corpo.variables.de === '2026-11-19' && visto.corpo.variables.ate === '2026-11-25',
      visto.corpo.variables);
    conferir('as duas famílias vão na MESMA consulta',
      /workersInvocationsAdaptive/.test(visto.corpo.query) && /kvOperationsAdaptiveGroups/.test(visto.corpo.query));
  }

  /* ── B. O dia a dia, com o zero que é facto ─────────────────────────────── */
  console.log('\nB. O dia a dia — e o zero dos dias sem tráfego');
  {
    const { f } = cloudflareFalso({ pedidos: PEDIDOS, kv: KV });
    const r = await analitica.analiticaDoCloudflare({
      token: 'x', accountId: CONTA, agora: AGORA, dias: 7, fetchImpl: f,
    });
    conferir('a janela tem os 7 dias, do mais antigo ao mais novo', r.dias.length === 7, r.dias.length);
    conferir('o primeiro é 19/11 e o último é 25/11',
      r.dias[0].dia === '2026-11-19' && r.dias[6].dia === '2026-11-25', [r.dias[0].dia, r.dias[6].dia]);
    const d20 = r.dias.find((d) => d.dia === '2026-11-20');
    const d21 = r.dias.find((d) => d.dia === '2026-11-21');
    conferir('o dia 20 soma os DOIS scripts (2 000 + 962)', d20.pedidos === 2962, d20.pedidos);
    conferir('e traz os erros e os subpedidos', d20.erros === 3 && d20.subpedidos === 1000, d20);
    /* O ZERO QUE É FACTO: o dia 21 não veio na resposta, e a resposta certa é ZERO pedidos — não
     * «não medido». A pergunta é «quantos houve», e a resposta é nenhum. */
    conferir('um dia sem tráfego é ZERO, e está na lista', d21 && d21.pedidos === 0, d21);
    conferir('e não é a mesma coisa que um dia que falta', r.dias.every((d) => d.dia), 'há dias sem data');
  }

  /* ── C. As quatro acções do KV ──────────────────────────────────────────── */
  console.log('\nC. As quatro acções do KV mapeiam para os quatro campos');
  {
    const { f } = cloudflareFalso({ pedidos: PEDIDOS, kv: KV });
    const r = await analitica.analiticaDoCloudflare({
      token: 'x', accountId: CONTA, agora: AGORA, dias: 7, fetchImpl: f,
    });
    const d20 = r.dias.find((d) => d.dia === '2026-11-20');
    conferir('read → leituras', d20.leituras === 12804, d20.leituras);
    conferir('write → escritas', d20.escritas === 900, d20.escritas);
    conferir('list → listas', d20.listas === 61, d20.listas);
    conferir('delete → apagamentos', d20.apagamentos === 31, d20.apagamentos);
    /* Uma acção desconhecida não entra em nenhum campo — e não rebenta. */
    conferir('uma acção inventada não entra em lado nenhum',
      d20.leituras + d20.escritas + d20.listas + d20.apagamentos === 12804 + 900 + 61 + 31);
    /* E o grupo de OUTUBRO não entra: o filtro é do servidor, mas a guarda é nossa. */
    conferir('um grupo fora da janela é ignorado',
      r.dias.every((d) => d.leituras < 100000 && d.pedidos < 100000));
  }

  /* ── D. O que falha é declarado, e nunca zerado ─────────────────────────── */
  console.log('\nD. O QUE FALHA É DECLARADO — nunca um zero com cara de medição');
  {
    const semToken = await analitica.analiticaDoCloudflare({ accountId: CONTA, agora: AGORA });
    conferir('sem token: falha declarada', semToken.ok === false && /CLOUDFLARE_API_TOKEN/.test(semToken.motivo),
      semToken.motivo);

    const g = cloudflareFalso({ status: 403 });
    const semPermissao = await analitica.analiticaDoCloudflare({
      token: 'x', accountId: CONTA, agora: AGORA, fetchImpl: g.f,
    });
    conferir('403: falha declarada', semPermissao.ok === false);
    conferir('e o motivo NOMEIA a permissão que falta',
      /Account Analytics: Read/.test(semPermissao.motivo), semPermissao.motivo);

    const e = cloudflareFalso({ errors: [{ message: 'nope' }] });
    const comErro = await analitica.analiticaDoCloudflare({
      token: 'x', accountId: CONTA, agora: AGORA, fetchImpl: e.f,
    });
    /* O GraphQL devolve `errors` com HTTP 200. Ler só o `data` publicaria metade dos números como
     * se fossem todos. */
    conferir('errors com HTTP 200: falha declarada, e não meio número',
      comErro.ok === false && /GraphQL/.test(comErro.motivo), comErro.motivo);

    const rb = cloudflareFalso({ rebenta: true });
    const semRede = await analitica.analiticaDoCloudflare({
      token: 'x', accountId: CONTA, agora: AGORA, fetchImpl: rb.f,
    });
    conferir('rede a rebentar: falha declarada, e não uma excepção',
      semRede.ok === false && /não consegui falar/.test(semRede.motivo), semRede.motivo);
  }

  /* ── E. O pico manda no alerta ──────────────────────────────────────────── */
  console.log('\nE. O PICO manda no alerta — o hoje não serve');
  {
    /* Hoje a ZERO e o pico das escritas a 90 %: a cota é diária e volta a zero, e o dia em que se
     * escreveram 900 chaves pode acontecer outra vez. O alerta tem de o dizer. */
    const comPico = {
      ok: true, truncado: false,
      janela: { desde: '2026-11-19', ate: '2026-11-25', dias: 7 },
      hoje: { dia: '2026-11-25', pedidos: 0, leituras: 0, escritas: 0, listas: 0, apagamentos: 0 },
      dias: [
        { dia: '2026-11-20', pedidos: 2962, leituras: 12804, escritas: 900, listas: 61, apagamentos: 31 },
        { dia: '2026-11-25', pedidos: 0, leituras: 0, escritas: 0, listas: 0, apagamentos: 0 },
      ],
      porScript: [],
    };
    const cf = monitor.resumirCloudflare({ escolas: [], chaves: {}, analitica: comPico });
    conferir('as operações foram medidas', cf.operacoes && cf.operacoes.ok === true);
    conferir('o alerta lê o PICO das escritas (90%)', Math.abs(cf.fraccaoOperacoes - 0.9) < 1e-9, cf.fraccaoOperacoes);
    const retrato = monitor.retrato({ cloudflare: cf, receita: { mrrCentavos: 1 }, cambio: 5.4 });
    conferir('e o nível da casa passa a «atenção»', retrato.nivel === 'atencao', retrato.nivel);
    /* CONTROLO NEGATIVO: se o alerta olhasse o hoje, este parque dava «folga» — é a diferença que
     * a escolha do pico faz. */
    const soHoje = Math.max(...(cf.operacoes.porOperacao || []).map((o) => o.fraccaoHoje || 0));
    conferir('NEGATIVO: olhando só o hoje, daria folga (0 %)', soHoje === 0, soHoje);

    const opEscritas = cf.operacoes.porOperacao.find((o) => o.operacao === 'escritas');
    conferir('e cada operação diz o dia do seu pico', opEscritas.diaDoPico === '2026-11-20', opEscritas.diaDoPico);
    conferir('e o hoje ao lado', opEscritas.hoje === 0, opEscritas.hoje);
  }

  /* ── F. O picado declara-se ─────────────────────────────────────────────── */
  console.log('\nF. CHEGAR AO TECTO FAZ DO NÚMERO UM MÍNIMO — e diz-se');
  {
    const muitos = [];
    for (let i = 0; i < 1000; i += 1) {
      muitos.push({ dimensions: { date: '2026-11-20', scriptName: 's' + i }, sum: { requests: 1 } });
    }
    const { f } = cloudflareFalso({ pedidos: muitos, kv: [] });
    const r = await analitica.analiticaDoCloudflare({
      token: 'x', accountId: CONTA, agora: AGORA, dias: 7, fetchImpl: f,
    });
    conferir('truncado é dito quando o tecto de grupos é atingido', r.truncado === true, r.truncado);
    const cf = monitor.resumirCloudflare({ escolas: [], chaves: {}, analitica: r });
    conferir('e a marca chega ao painel', cf.operacoes.truncado === true);
    const html = painel.paginaDoMonitoramento({ retrato: { nivel: 'folga', cloudflare: cf, agora: '2026-11-25T12:00:00Z' }, cambio: 5.4 });
    conferir('a página escreve «o número está cortado»', /O número está cortado/.test(html));
  }

  /* ── G. A página ───────────────────────────────────────────────────────── */
  console.log('\nG. A PÁGINA — barras, o dia do pico, e o aviso que desaparece');
  {
    const { f } = cloudflareFalso({ pedidos: PEDIDOS, kv: KV });
    const r = await analitica.analiticaDoCloudflare({
      token: 'x', accountId: CONTA, agora: AGORA, dias: 7, fetchImpl: f,
    });
    const cf = monitor.resumirCloudflare({ escolas: [{ slug: 'breu' }], chaves: { breu: { total: 3, bytes: 2048 } }, analitica: r });
    const html = painel.paginaDoMonitoramento({ retrato: { nivel: 'folga', cloudflare: cf, agora: '2026-11-25T12:00:00Z' }, cambio: 5.4 });

    conferir('o bloco existe', /O que se faz num dia/.test(html));
    conferir('há uma barra por operação (5)', (html.match(/class="cota"/g) || []).length >= 5,
      (html.match(/class="cota"/g) || []).length);
    conferir('a barra diz que é o dia mais cheio', /O dia mais cheio da janela/.test(html));
    conferir('e nomeia o dia do pico', /Pico: <strong>2\u202f962<\/strong> em 20\/11\/2026/.test(html));
    conferir('a tabela dos dias mostra o 20/11 com as escritas', /20\/11\/2026/.test(html) && /900/.test(html));
    conferir('os Workers aparecem', /lastro-teste/.test(html));
    /* O AVISO DO «NÃO MEDE» DESAPARECE — era ele que carregava a frase falsa sobre a permissão. */
    conferir('o aviso do «não mede» desapareceu', !/não mede<\/strong>/.test(html));
    conferir('e a frase falsa sobre a permissão não está na página', !/que este Worker não tem/.test(html));

    /* E o controlo: quando NÃO se mede, o aviso VOLTA, com o motivo verdadeiro. */
    const semAnalitica = monitor.resumirCloudflare({
      escolas: [], chaves: {},
      analitica: { ok: false, motivo: 'o CLOUDFLARE_API_TOKEN não tem a permissão Account Analytics: Read (HTTP 403)' },
    });
    const htmlSem = painel.paginaDoMonitoramento({ retrato: { nivel: 'folga', cloudflare: semAnalitica, agora: '2026-11-25T12:00:00Z' }, cambio: 5.4 });
    conferir('sem medição, o aviso volta', /não mede<\/strong>/.test(htmlSem));
    conferir('com o motivo da FALHA, e não uma frase feita',
      /Account Analytics: Read \(HTTP 403\)/.test(htmlSem));
    conferir('e as cinco operações ficam listadas como não medidas',
      (htmlSem.match(/por dia<\/li>/g) || []).length === 5, (htmlSem.match(/por dia<\/li>/g) || []).length);
  }

  console.log('\n' + ok + '/' + (ok + ko) + ' · ' + (ko ? ko + ' falha(s)' : 'sem falhas'));
  process.exit(ko ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
