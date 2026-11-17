'use strict';

/**
 * monitoramento.js — O QUE O SISTEMA GASTA, QUANTO FALTA, E O QUE ISSO FAZ À RECEITA
 * (17/11/2026).
 *
 * O QUE ELA PEDIU, e são três coisas que só valem juntas:
 *
 *   «Eu preciso de um monitor que me mostre isso […] cada processo quando ele ocorre, o quanto ele
 *   gastou, quanto falta para o teto, qual é a capacidade total, tanto no GitHub com o workflow, o
 *   CICD, quanto no Cloudflare com ocupação de espaços e os workers e o KV, quanto no Resend […]
 *   Eu também preciso que nesse painel de monitoramento eu tenha a receita, quanto é faturado […]
 *   e preciso também fazer uma comparação de quando eu migrar, tiver que mudar o plano dos meus
 *   custos para aumentar a minha capacidade, qual é o impacto na minha receita.»
 *
 * A FRASE QUE GOVERNA ESTE MÓDULO é a última: «para não ser pega de surpresa e poder se programar
 * […] para tomar medidas antes que seja tarde demais». Um monitor que mente é pior do que não ter
 * monitor — por isso cada número aqui traz **de onde veio** e **o que não foi medido**, e o que não
 * foi medido diz-se em vez de se estimar para o lado bonito.
 *
 * AS TRÊS PROVIDÊNCIAS, e o que cada uma consegue responder:
 *
 *   · **GitHub** — mede-se de verdade: cada run tem os seus jobs, e o GitHub factura **cada job
 *     arredondado ao minuto**. O que se soma aqui é essa conta, e não o tempo de relógio.
 *   · **Resend** — mede-se o que o SISTEMA pediu (cada envio passa por aqui), e declara-se que a
 *     fatura do provedor é a fonte de verdade dos bounces. A cota é de e-mails por mês no pago e
 *     por DIA no gratuito, e as duas contam.
 *   · **Cloudflare** — mede-se a OCUPAÇÃO (escolas, chaves no KV, bytes), que é o que dá para ler
 *     sem token de analytics. Pedidos e operações de KV por dia **não se medem daqui**, e o painel
 *     diz isso em vez de mostrar um zero com cara de medição.
 *
 * SEM `fs`, SEM `fetch`, SEM `Date.now()` escondido: o módulo é puro, recebe o que já foi lido e
 * devolve números e frases. É o que permite medi-lo com fixtures — e é a mesma disciplina do
 * `mensalidades.js` e do `retrato.js`.
 */

/* ── AS COTAS, COM PROCEDÊNCIA ────────────────────────────────────────────────────────────────
 *
 * NENHUM DESTES NÚMEROS É ESTIMATIVA. Cada um foi lido na página de preço ou na documentação do
 * fornecedor em `lidoEm`, e a fonte vai ao lado porque um número de cota sem data é um número que
 * envelhece sem avisar — e este é o sítio onde ela vai olhar para decidir se muda de plano.
 */
const LIDO_EM = '2026-11-17';

const COTAS = {
  github: {
    plano: 'Free',
    /* O INCLUÍDO É UM VALOR EM DÓLAR, e não um pacote de minutos: o plano gratuito inclui $12/mês de
     * «compute», e o minuto do runner ubuntu-24.04 (Linux 2-core) custa $0,006. É dessa divisão que
     * saem os 2.000 minutos que a página comercial anuncia — e é a mesma conta que se usa aqui. */
    computeIncluidoUsd: 12,
    precoMinutoUsd: 0.006,
    ciclo: 'mês',
    /* A ESCADA, para o comparador da migração. `computeUsd` é o incluído de cada degrau; o preço é
     * por PESSOA e por mês nos dois pagos. */
    planos: [
      { id: 'free', nome: 'Free', porPessoaUsd: 0, computeUsd: 12 },
      { id: 'team', nome: 'Team', porPessoaUsd: 4, computeUsd: 18 },
      { id: 'enterprise', nome: 'Enterprise Cloud', porPessoaUsd: 21, computeUsd: 300 },
    ],
    fonte: 'docs.github.com/en/billing (GitHub Actions billing) · github.com/pricing',
    lidoEm: LIDO_EM,
  },
  cloudflare: {
    plano: 'Workers Free',
    pedidosDia: 100000,
    escritasKvDia: 1000,
    leiturasKvDia: 100000,
    listasKvDia: 1000,
    apagamentosKvDia: 1000,
    armazenamentoKvGb: 1,
    /* O pago não é por uso: é $5/mês por CONTA, e inclui 10 milhões de pedidos e 30 milhões de ms
     * de CPU. Os assets estáticos são gratuitos e ilimitados nos dois planos. */
    planoPagoUsd: 5,
    planoPagoPedidosMes: 10000000,
    fonte: 'developers.cloudflare.com/workers/platform/pricing · /limits',
    lidoEm: LIDO_EM,
  },
  resend: {
    plano: 'Free',
    /* AS DUAS COTAS CONTAM, e é a pegadinha do plano gratuito: 3.000 e-mails por mês E 100 por dia.
     * Quem olha só para a mensal vê folga e leva a recusa no dia em que dispara um lote. */
    emailsMes: 3000,
    emailsDia: 100,
    planos: [
      { id: 'free', nome: 'Free', usdMes: 0, emailsMes: 3000, emailsDia: 100 },
      { id: 'pro-50k', nome: 'Pro 50 mil', usdMes: 20, emailsMes: 50000, emailsDia: null },
      { id: 'scale-100k', nome: 'Scale 100 mil', usdMes: 90, emailsMes: 100000, emailsDia: null },
    ],
    fonte: 'resend.com/pricing',
    lidoEm: LIDO_EM,
  },
};

/** Os minutos que o incluído do GitHub compra: `12 / 0,006 = 2.000`. */
function minutosIncluidos(plano) {
  const p = (plano && plano.computeUsd) || COTAS.github.computeIncluidoUsd;
  return Math.floor(p / COTAS.github.precoMinutoUsd);
}

/* ── AS CONTAS ──────────────────────────────────────────────────────────────────────────────── */

/** Um rácio com o sinal que a página precisa: `0,42`, e não «42%» escrito à mão duas vezes. */
function fracao(parte, total) {
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  const p = Math.max(0, Number(parte) || 0);
  return p / t;
}

/**
 * O CUSTO FACTURADO DE UM RUN — a conta que o GitHub faz, e não a que parece.
 *
 * «Cada job arredondado ao minuto» é a regra do fornecedor, e ela muda o número: um run de 11
 * segundos custa **1 minuto**; um run com quatro jobs de 6 a 25 segundos custa **4 minutos** para
 * 64 segundos de trabalho. Foi essa diferença (2× no orçamento) que fez a conta do §L9c mudar de
 * sinal em 16/11/2026, e é por isso que ela mora aqui, num sítio só, e não na página.
 *
 * Sem os jobs medidos, o run vale o MÍNIMO: um job pelo tempo de relógio. E vai marcado como
 * estimado — um número por baixo que se sabe ser por baixo é honesto; o mesmo número sem a marca
 * seria uma mentira simpática.
 */
function minutosDoRun(run, jobs) {
  if (Array.isArray(jobs) && jobs.length) {
    const segundos = jobs.reduce((s, j) => s + Math.max(0, Number(j.segundos) || 0), 0);
    const minutos = jobs.reduce((s, j) => s + Math.max(1, Math.ceil((Number(j.segundos) || 0) / 60)), 0);
    return { minutos, segundos, jobs: jobs.length, estimado: false };
  }
  const s = Math.max(0, Number(run && run.segundos) || 0);
  return { minutos: Math.max(1, Math.ceil(s / 60)), segundos: s, jobs: 1, estimado: true };
}

/**
 * O CONSUMO DO GITHUB, por workflow e no total.
 *
 * `runs` chega como o painel o lê da API (`id`, `workflow`, `segundos`, `quando`), e `jobsPorRun` é
 * o mapa `{ <id>: [{segundos}] }` do que já foi medido. O que não estiver no mapa entra como
 * estimado — e a página diz quantos são.
 */
function resumirGithub({ runs, jobsPorRun, plano, desde, conferencia } = {}) {
  const lista = Array.isArray(runs) ? runs : [];
  const mapa = jobsPorRun || {};
  const porFluxo = new Map();
  let minutos = 0;
  let estimados = 0;
  let medidos = 0;
  let segundos = 0;

  /* A CALIBRAGEM — e ela é o que torna este número utilizável (17/11/2026).
   *
   * O PROBLEMA QUE ELA RESOLVE, medido em produção no primeiro dia: a janela de 30 dias deste
   * repositório tem **2.810 execuções**. Medir os jobs de todas seria 2.810 pedidos por abertura do
   * painel — impossível, e gastaria a cota que o painel mede. Medir vinte e dar 1 minuto a cada uma
   * das outras 2.790 seria pior do que não medir: o painel diria 27,7% de uma cota que na verdade
   * está estourada.
   *
   * A SAÍDA É A MÉDIA POR FLUXO. Mede-se uma AMOSTRA (as mais recentes), calcula-se quantos minutos
   * facturados cada execução daquele fluxo custa em média, e aplica-se essa média às que faltam. O
   * número deixa de ser um piso arbitrário e passa a ser uma estimativa CALIBRADA — e a página diz
   * quantas foram medidas e quantas foram estimadas, porque uma estimativa que se apresenta como
   * medição é a mentira que este painel existe para não contar.
   *
   * O FLUXO SEM NENHUMA MEDIÇÃO fica com o mínimo de 1 minuto por execução, e é declarado. */
  const somaPorFluxo = new Map();
  for (const r of lista) {
    if (!mapa[r.id]) continue;
    const nome = String(r.workflow || r.name || 'sem nome');
    const conta = minutosDoRun(r, mapa[r.id]);
    const a = somaPorFluxo.get(nome) || { minutos: 0, runs: 0 };
    a.minutos += conta.minutos;
    a.runs += 1;
    somaPorFluxo.set(nome, a);
  }
  const mediaDoFluxo = (nome) => {
    const a = somaPorFluxo.get(nome);
    return a && a.runs ? a.minutos / a.runs : null;
  };

  for (const r of lista) {
    const conta = minutosDoRun(r, mapa[r.id]);
    if (!conta.estimado) medidos += 1;
    const nome = String(r.workflow || r.name || 'sem nome');
    const actual = porFluxo.get(nome) || {
      workflow: nome, runs: 0, minutos: 0, segundos: 0, ultimaEm: null, ultimoMinutos: 0, estimados: 0,
    };
    /* A EXECUÇÃO SEM OS JOBS MEDIDOS leva a média do SEU fluxo, quando há uma. O
     * `Math.round` é proposital: minutos facturados são inteiros, e uma média de 1,4 min por
     * execução não é um número que exista na fatura — mas somada a 300 execuções, ela é o que mais
     * se aproxima do que a fatura vai cobrar. */
    const media = conta.estimado ? mediaDoFluxo(nome) : null;
    const minutosDaVez = media == null ? conta.minutos : Math.max(1, Math.round(media));
    actual.runs += 1;
    actual.minutos += minutosDaVez;
    actual.segundos += conta.segundos;
    actual.calibrado = media != null;
    if (conta.estimado) { actual.estimados += 1; estimados += 1; }
    /* A ÚLTIMA VEZ É A MAIS RECENTE, e a lista não vem garantidamente ordenada de quem chama. */
    const quando = String(r.quando || '');
    if (!actual.ultimaEm || quando > actual.ultimaEm) {
      actual.ultimaEm = quando || null;
      actual.ultimoMinutos = conta.minutos;
    }
    porFluxo.set(nome, actual);
    minutos += minutosDaVez;
    segundos += conta.segundos;
  }

  const degrau = (plano && plano.computeUsd) || COTAS.github.computeIncluidoUsd;
  const total = minutosIncluidos({ computeUsd: degrau });
  const fluxos = [...porFluxo.values()].sort((a, b) => b.minutos - a.minutos);

  /* ── A CONFERÊNCIA CONTRA O FORNECEDOR (17/11/2026) ────────────────────────────────────────
   *
   * A CONTA ACIMA É UMA REGRA, NÃO UM EXTRACTO. Ela aplica o que o GitHub DOCUMENTA («cada job
   * arredondado ao minuto»). O que ele FACTURA lê-se no campo `billable` de `/runs/<id>/timing`, e
   * são coisas diferentes até prova em contrário.
   *
   * A PROVA APARECEU NO PRIMEIRO DIA EM PRODUÇÃO: para todas as execuções medidas, `billable` veio
   * ZERO — com jobs que demoraram 13 a 34 segundos de relógio. A regra dá-lhes 1 minuto; o
   * fornecedor dá-lhes 0. Um dos dois está errado, e não é o código que o decide: é a fatura. O
   * que o painel pode fazer é não esconder nenhum dos dois, e é isto.
   *
   * `atesta` é a pergunta certa — «o fornecedor atesta consumo?» — e não «o número é zero?». Zero
   * não é uma conclusão de graça: é a ausência de uma atestação, e a página di-lo com essas
   * palavras.
   */
  let conferenciaFeita = null;
  if (conferencia && conferencia.facturavelMs != null && Number.isFinite(Number(conferencia.facturavelMs))) {
    const facturavelMinutos = Math.round((Number(conferencia.facturavelMs) / 60000) * 100) / 100;
    conferenciaFeita = {
      run: String(conferencia.run || ''),
      workflow: String(conferencia.workflow || ''),
      quando: conferencia.quando || null,
      jobs: Math.max(0, Number(conferencia.jobs) || 0),
      segundos: Math.max(0, Number(conferencia.segundos) || 0),
      facturavelMinutos,
      estimadoMinutos: Math.max(0, Number(conferencia.estimadoMinutos) || 0),
      atesta: facturavelMinutos > 0,
    };
  }

  return {
    provedor: 'github',
    janela: desde || null,
    runs: lista.length,
    minutos,
    segundos,
    minutosPorRun: lista.length ? Math.round((minutos / lista.length) * 10) / 10 : 0,
    total,
    restantes: Math.max(0, total - minutos),
    fraccao: fracao(minutos, total),
    excedenteMinutos: Math.max(0, minutos - total),
    excedenteUsd: Math.max(0, minutos - total) * COTAS.github.precoMinutoUsd,
    estimados,
    medidos,
    /* O QUE A CALIBRAGEM ASSUME, dito para a página o poder dizer: as execuções que faltam valem a
     * média das que foram medidas, por fluxo. Onde não há medição nenhuma, vale 1 minuto. */
    calibradoPorFluxo: [...somaPorFluxo.entries()]
      .map(([workflow, a]) => ({ workflow, medidos: a.runs, mediaMinutos: a.minutos / a.runs })),
    conferencia: conferenciaFeita,
    fluxos,
    cotas: COTAS.github,
  };
}

/**
 * O CONSUMO DO CORREIO. `contadores` é o que o próprio sistema grava a cada envio:
 * `{ mes, enviados, falhados, dias: { 'AAAA-MM-DD': {enviados, falhados} } }`.
 *
 * O QUE ESTE NÚMERO É, e o que não é: é **o que o sistema pediu ao Resend** — a chamada que saiu
 * daqui. Não é o que o Resend facturou (bounces e repetições vivem lá), e a diferença só aparece
 * na fatura. Por isso a página diz as duas coisas, e a cota que mostra é a do plano declarado.
 */
function resumirCorreio({ contadores, hoje, plano, cotas } = {}) {
  const c = contadores || {};
  const doMes = Math.max(0, Number(c.enviados) || 0);
  const falhadosMes = Math.max(0, Number(c.falhados) || 0);
  const dia = String(hoje || '');
  const doDia = Math.max(0, Number((c.dias && c.dias[dia] && c.dias[dia].enviados) || 0));
  const base = cotas || COTAS.resend;
  /* `null` NUMA COTA É UM FACTO, E NÃO A AUSÊNCIA DELE. O plano pago do Resend não tem limite
   * diário, e `plano.emailsDia` vem `null` de propósito. Com `||`, esse `null` caía na cota
   * gratuita (100/dia) e o painel mostrava um limite que a escola já não tem — o defeito que esta
   * prova apanhou antes de ele chegar ao ecrã. A pergunta é «o plano declarou?», e ela faz-se com
   * `!= null`. */
  const mensal = (plano && plano.emailsMes != null) ? plano.emailsMes : base.emailsMes;
  const diaria = (plano && 'emailsDia' in plano) ? plano.emailsDia : base.emailsDia;

  /* O QUE ESTÁ MAIS APERTADO MANDA NO ALERTA. No plano gratuito a cota DIÁRIA (100) chega antes da
   * mensal (3.000) sempre que houver 30 dias de uso — e mostrar só a mensal daria 97% de folga no
   * dia em que a recusa chega. */
  const fraccaoMes = fracao(doMes, mensal);
  const fraccaoDia = diaria ? fracao(doDia, diaria) : 0;
  const manda = diaria && fraccaoDia > fraccaoMes ? 'dia' : 'mes';

  return {
    provedor: 'resend',
    enviados: doMes,
    falhados: falhadosMes,
    enviadosHoje: doDia,
    total: mensal,
    restantes: Math.max(0, mensal - doMes),
    fraccao: fraccaoMes,
    limiteDia: diaria,
    restantesHoje: diaria == null ? null : Math.max(0, diaria - doDia),
    fraccaoDia,
    manda,
    cotas: base,
    plano: (plano && plano.nome) || base.plano,
  };
}

/**
 * A OCUPAÇÃO DO CLOUDFLARE — o que se consegue medir sem token de analytics.
 *
 * `escolas` é a lista das vivas (`{slug}`) e `chaves` é o mapa `{ <escola>: {total, bytes} }` que a
 * rota lê com `kv.list()`. O que NÃO se mede daqui — pedidos e operações de KV por dia — vai dito
 * como `naoMedido`, com o motivo. É a diferença entre um painel e um enfeite.
 */
function resumirCloudflare({ escolas, chaves, cotas } = {}) {
  const base = cotas || COTAS.cloudflare;
  const vivas = Array.isArray(escolas) ? escolas : [];
  const mapa = chaves || {};
  let totalChaves = 0;
  let totalBytes = 0;
  const porEscola = [];
  for (const e of vivas) {
    const slug = String((e && e.slug) || e || '').trim();
    if (!slug) continue;
    const c = mapa[slug] || null;
    const n = Math.max(0, Number(c && c.total) || 0);
    const b = Math.max(0, Number(c && c.bytes) || 0);
    totalChaves += n;
    totalBytes += b;
    porEscola.push({ escola: slug, chaves: n, bytes: b, medido: Boolean(c) });
  }
  const gb = 1024 * 1024 * 1024;
  const armazenamentoGb = totalBytes / gb;
  return {
    provedor: 'cloudflare',
    escolas: porEscola.length,
    porEscola,
    chaves: totalChaves,
    bytes: totalBytes,
    armazenamentoGb,
    totalArmazenamentoGb: base.armazenamentoKvGb,
    fraccaoArmazenamento: fracao(armazenamentoGb, base.armazenamentoKvGb),
    /* AS OPERAÇÕES POR DIA, declaradas e não inventadas. A API de analytics do Cloudflare exige um
     * token com permissão de leitura de analítica, que este Worker não tem — e um número inventado
     * aqui seria pior do que a ausência dele, porque ninguém o iria conferir. */
    naoMedido: [
      { o: 'pedidos ao Worker por dia', cota: base.pedidosDia },
      { o: 'escritas de KV por dia', cota: base.escritasKvDia },
      { o: 'leituras de KV por dia', cota: base.leiturasKvDia },
    ],
    motivoNaoMedido: 'a leitura de analítica exige um token do Cloudflare com permissão de '
      + 'analítica, que este Worker não tem. O número está no painel do Cloudflare, em Workers → '
      + 'Metrics. A ocupação abaixo é medida; as operações por dia não são.',
    cotas: base,
  };
}

/* ── A RECEITA ──────────────────────────────────────────────────────────────────────────────── */

/**
 * A RECEITA, do mesmo livro que o financeiro lê — e não de uma segunda conta.
 *
 * `extrato` é o que `extratoDasEscolas` devolve (uma linha por escola viva, com `valorCentavos`,
 * `situacao` e `meses`), e `descontos` é a lista de `lerDescontos`. O que sai:
 *
 *   · `mrrmBruto` — a soma dos contratos em vigor, em cêntimos;
 *   · `descontos` — a soma dos descontos concedidos às escolas vivas;
 *   · `mrr` — o que entra por mês, líquido;
 *   · `recebidoNoMes` — o que já foi marcado como pago no mês corrente;
 *   · `emAberto` — o que venceu e não foi pago (a dívida, não a receita).
 */
function receita({ extrato, descontos, mes, agora } = {}) {
  const linhas = Array.isArray(extrato) ? extrato : [];
  const vivas = linhas.filter((l) => l && l.contratoVivo !== false);
  let bruto = 0;
  for (const l of vivas) bruto += Math.max(0, Number(l.valorCentavos) || 0);

  const porEscola = new Map();
  for (const d of Array.isArray(descontos) ? descontos : []) {
    if (!d || !d.escola) continue;
    /* A LISTA VEM DO MAIS RECENTE PARA O MAIS ANTIGO, e um desconto por escola: o primeiro que
     * aparece é o que vale. Somar todos contaria o desconto substituído duas vezes. */
    if (!porEscola.has(d.escola)) porEscola.set(d.escola, Math.max(0, Number(d.valorCentavos) || 0));
  }
  let totalDescontos = 0;
  for (const l of vivas) totalDescontos += porEscola.get(l.escola) || 0;

  const competencia = String(mes || '');
  let recebido = 0;
  let emAberto = 0;
  for (const l of vivas) {
    for (const m of Array.isArray(l.meses) ? l.meses : []) {
      if (!m) continue;
      if (m.status === 'pago' && (!competencia || m.mes === competencia)) {
        recebido += Math.max(0, Number(m.valorPagoCentavos != null ? m.valorPagoCentavos : m.valorCentavos) || 0);
      }
      if (m.status === 'aberto' && m.venceu) {
        emAberto += Math.max(0, Number(m.valorCentavos) || 0);
      }
    }
  }

  const mrr = Math.max(0, bruto - totalDescontos);
  return {
    escolas: vivas.length,
    mes: competencia || null,
    agora: agora || null,
    brutoCentavos: bruto,
    descontosCentavos: totalDescontos,
    mrrCentavos: mrr,
    recebidoNoMesCentavos: recebido,
    emAbertoCentavos: emAberto,
    /* O ANO, a partir do mês: uma escola a pagar 12 meses vale 12× o MRR, e é o número que ela
     * precisa para comparar com um custo anual. */
    anualCentavos: mrr * 12,
  };
}

/* ── A MIGRAÇÃO: O QUE CUSTA, E O QUE FAZ À RECEITA ─────────────────────────────────────────── */

/**
 * O IMPACTO DE SUBIR DE PLANO, em percentagem da receita.
 *
 * A PERGUNTA DELA, ao pé da letra: «qual é o impacto na minha receita». A resposta útil não é o
 * valor em dólar — é a FRAÇÃO do que entra. Um plano de $5 sobre $1.400 de receita é 0,4% e não
 * muda decisão nenhuma; o mesmo $5 sobre $70 é 7%, e muda.
 *
 * O CÂMBIO É DECLARADO, e não escondido: o custo é em dólar e a receita em real. `cambio` entra
 * por parâmetro (a taxa do dia não se inventa num módulo puro), e a página diz qual usou.
 */
function impactoDaMigracao({ receita: r, cambio, custosAtuaisUsd } = {}) {
  const taxa = Number(cambio) > 0 ? Number(cambio) : null;
  const mrrCentavos = Math.max(0, Number(r && r.mrrCentavos) || 0);
  const receitaUsd = taxa ? (mrrCentavos / 100) / taxa : null;
  const actual = Math.max(0, Number(custosAtuaisUsd) || 0);

  const cenarios = [];
  const linha = (id, nome, quando, usdMes, nota) => {
    const delta = usdMes - actual;
    const fraccaoDaReceita = receitaUsd && receitaUsd > 0 ? usdMes / receitaUsd : null;
    cenarios.push({
      id, nome, quando, usdMes, delta, nota,
      fraccaoDaReceita,
      exigeReceitaUsd: fraccaoDaReceita ? usdMes / 0.05 : null, // 5% da receita: o limite que ela fixou
    });
  };

  /* AS TRÊS ESCADAS, e o gatilho de cada degrau — os números que decidem, e não os nomes. */
  linha('github-team', 'GitHub Team', 'acima de 2.000 min facturados no mês',
    COTAS.github.planos[1].porPessoaUsd,
    'inclui $18 de compute (3.000 min). Entre 2.000 e 2.667 min, pagar excedente sai mais barato '
    + 'do que o plano.');
  linha('github-enterprise', 'GitHub Enterprise Cloud', 'acima de 5.833 min no mês',
    COTAS.github.planos[2].porPessoaUsd,
    'inclui $300 de compute (50.000 min). Só compensa no volume em que o excedente do Team passaria '
    + 'este valor.');
  linha('cloudflare-paid', 'Cloudflare Workers Paid', 'ao chegar a 1.000 escritas de KV por dia',
    COTAS.cloudflare.planoPagoUsd,
    'não é por uso: $5 por conta, com 10 milhões de pedidos e o KV desafogado.');
  linha('resend-pro', 'Resend Pro (50 mil)', 'ao chegar a 3.000 e-mails no mês, ou 100 no dia',
    COTAS.resend.planos[1].usdMes,
    'tira o limite diário, que é o que aperta primeiro no plano gratuito.');
  linha('resend-scale', 'Resend Scale (100 mil)', 'ao chegar a 50.000 e-mails no mês',
    COTAS.resend.planos[2].usdMes,
    'inclui 100 mil e-mails e o IP dedicado como extra.');

  const totalAtual = cenarios.reduce((s, c) => s + c.usdMes, 0);
  return {
    cambio: taxa,
    custoAtualUsd: actual,
    custoTotalSeTodosUsd: totalAtual,
    receitaUsd,
    receitaCentavos: mrrCentavos,
    cenarios,
    /* O QUE O PAINEL PRECISA DIZER EM UMA FRASE: quantos por cento do que entra cada degrau come. */
    frase: !taxa
      ? 'Sem câmbio declarado, o impacto em percentagem não é calculado.'
      : (receitaUsd > 0
        ? 'O custo de hoje é ' + ((actual / receitaUsd) * 100).toFixed(2) + '% da receita; se todos '
          + 'os degraus subirem, é ' + ((totalAtual / receitaUsd) * 100).toFixed(2) + '%.'
        : 'Ainda não há receita registada: o custo é 100% do que não existe.'),
  };
}

/* ── O RETRATO COMPLETO ─────────────────────────────────────────────────────────────────────── */

/**
 * O que a página desenha, num objecto só. `agora` é o carimbo (ISO) e `hoje` é o dia LOCAL — a
 * mesma separação do `mensalidades.js`: o mês e o dia de uma cota são os do fuso da escola.
 */
function retrato({ github, correio, cloudflare, receita: r, cambio, custosAtuaisUsd, agora } = {}) {
  const migracao = impactoDaMigracao({ receita: r, cambio, custosAtuaisUsd });
  /* O ALERTA É O PIOR DOS TRÊS, e não a média: uma cota a 95% e duas a 10% é uma cota a 95%. */
  const fraccoes = [github && github.fraccao, correio && correio.fraccao, correio && correio.fraccaoDia,
    cloudflare && cloudflare.fraccaoArmazenamento].filter((f) => typeof f === 'number');
  const pior = fraccoes.length ? Math.max(...fraccoes) : 0;
  return {
    agora: agora || null,
    github: github || null,
    correio: correio || null,
    cloudflare: cloudflare || null,
    receita: r || null,
    migracao,
    piorFraccao: pior,
    /* OS TRÊS NÍVEIS, e a mesma régua em todas as cotas da casa: 80% é «atenção», 95% é «agora». */
    nivel: pior >= 0.95 ? 'agora' : (pior >= 0.8 ? 'atencao' : 'folga'),
  };
}

/* ── O CONTADOR DO CORREIO — o que o SISTEMA pediu, gravado por quem pede ──────────────────────
 *
 * O CORREIO NÃO TINHA MEMÓRIA DE SI. A caixa de saída (`bastidores/<escola>/correio/…`) guarda as
 * cartas que NÃO saíram — é o que serve para reenviar, e é um bom desenho para isso. Mas quem quer
 * saber «quantos e-mails este mês?» não tinha onde olhar: um envio que deu certo deixava rasto
 * nenhum.
 *
 * O contador é a resposta, e é **uma chave só** (`financeiro/correio`, um objecto por mês), pela
 * mesma razão que os descontos: o KV não se enumera. Uma chave por mês obrigaria a listar para
 * desenhar o painel, e a listagem é cota.
 *
 * O QUE ELE CONTA, e o que não conta: conta as CHAMADAS ao provedor — uma por mensagem enviada,
 * com os destinatários que tiver. Não conta destinatário a destinatário, porque o Resend factura
 * por e-mail e uma mensagem para três pessoas são três e-mails. Isso é dito no painel: é o único
 * número da casa que é uma aproximação POR BAIXO, e sabe-se de quanto.
 */
const CHAVE_DO_CORREIO = 'financeiro/correio';

/** O contador do mês, vazio. */
function contadoresVazios(mes) {
  return { mes: String(mes || ''), enviados: 0, falhados: 0, destinatarios: 0, dias: {} };
}

/**
 * O contador DEPOIS de um envio — devolve um objecto novo, não altera o que recebeu.
 *
 * `destinatarios` é o número de endereços DAQUELA mensagem: é ele que dá a diferença entre «12
 * chamadas» e «15 e-mails», e é a diferença que a fatura mostra.
 */
function contarEnvio(contadores, { mes, dia, quantos, enviado } = {}) {
  const base = (contadores && contadores.mes === String(mes)) ? contadores : contadoresVazios(mes);
  const d = String(dia || '');
  const quantos2 = Math.max(0, Math.round(Number(quantos) || 0));
  const dias = Object.assign({}, base.dias);
  const doDia = Object.assign({ enviados: 0, falhados: 0 }, dias[d] || {});
  if (enviado) { doDia.enviados += 1; doDia.destinatarios = (doDia.destinatarios || 0) + quantos2; }
  else { doDia.falhados += 1; }
  dias[d] = doDia;
  return {
    mes: String(mes),
    enviados: base.enviados + (enviado ? 1 : 0),
    falhados: base.falhados + (enviado ? 0 : 1),
    destinatarios: (base.destinatarios || 0) + (enviado ? quantos2 : 0),
    dias,
  };
}

module.exports = {
  COTAS,
  CHAVE_DO_CORREIO,
  contadoresVazios,
  contarEnvio,
  LIDO_EM,
  minutosIncluidos,
  minutosDoRun,
  resumirGithub,
  resumirCorreio,
  resumirCloudflare,
  receita,
  impactoDaMigracao,
  retrato,
};
