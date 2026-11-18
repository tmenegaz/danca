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
 * A FATURA DO MÊS, SOMADA — e os quatro números que ela tem de manter separados (17/11/2026).
 *
 * A REGRA QUE ESTE MÓDULO SEGUE, e que veio de uma leitura errada de uma fatura verdadeira: uma
 * linha «nov. 2026 · bruto $11,60 · cobrado $0,00» NÃO significa «vou pagar $11,60». Significa
 * «usou $11,60 de valor, e o desconto absorveu os $11,60». A franquia do GitHub não é apresentada
 * como «minutos incluídos» — é apresentada como **desconto igual ao bruto**, mês a mês. Por isso:
 *
 *   · `bruto`     — o valor do consumo, sem desconto. É o número que assusta, e não é o que se paga.
 *   · `desconto`  — o crédito da franquia que foi absorvido. É o crédito JÁ USADO.
 *   · `liquido`   — o que sai da conta. `bruto − desconto`.
 *   · `credito`   — a franquia do mês em dólares: `2.000 min × $0,006 = $12`.
 *
 * **O NÚMERO QUE DECIDE É O CRÉDITO QUE RESTA**, e não o bruto nem o líquido: enquanto
 * `desconto < credito`, o mês ainda não custou nada, por muito grande que o bruto pareça. No dia em
 * que o desconto empata com o crédito, cada minuto passa a ser pago.
 *
 * A `seriePorDia` existe para a página poder mostrar o dia em que a franquia acaba — que é a única
 * data que interessa a quem quer «me programar antes que seja tarde».
 */
function resumirFactura({ linhas, creditoUsd } = {}) {
  const ls = Array.isArray(linhas) ? linhas : [];
  let minutos = 0;
  let bruto = 0;
  let desconto = 0;
  let liquido = 0;
  let precoMinuto = 0;
  const porDia = new Map();
  const skus = new Set();
  for (const l of ls) {
    const q = Math.max(0, Number(l.quantidade) || 0);
    minutos += q;
    bruto += Math.max(0, Number(l.bruto) || 0);
    desconto += Math.max(0, Number(l.desconto) || 0);
    liquido += Math.max(0, Number(l.liquido) || 0);
    /* O preço unitário vem na linha: não se escreve à mão um preço que o fornecedor declara. */
    if (q > 0 && Number(l.precoUnitario) > 0) precoMinuto = Number(l.precoUnitario);
    if (l.sku) skus.add(String(l.sku));
    const dia = String(l.quando || '').slice(0, 10);
    if (!dia) continue;
    const a = porDia.get(dia) || { dia, minutos: 0, bruto: 0, desconto: 0, liquido: 0 };
    a.minutos += q;
    a.bruto += Math.max(0, Number(l.bruto) || 0);
    a.desconto += Math.max(0, Number(l.desconto) || 0);
    a.liquido += Math.max(0, Number(l.liquido) || 0);
    porDia.set(dia, a);
  }
  const serie = [...porDia.values()].sort((a, b) => (a.dia < b.dia ? -1 : 1));
  const credito = Number(creditoUsd) > 0 ? Number(creditoUsd) : COTAS.github.computeIncluidoUsd;
  const restante = Math.max(0, credito - desconto);
  /* O DIA EM QUE A FRANQUIA ACABA — lido do passado, não adivinhado: percorre-se a série e pára-se
   * no primeiro dia em que o crédito acumulado já não cobre o bruto acumulado. */
  let acumulado = 0;
  let diaEmQueAcabou = null;
  for (const d of serie) {
    acumulado += d.bruto;
    if (acumulado > credito + 1e-9) { diaEmQueAcabou = d.dia; break; }
  }
  return {
    minutos: Math.round(minutos),
    brutoUsd: Math.round(bruto * 100) / 100,
    descontoUsd: Math.round(desconto * 100) / 100,
    liquidoUsd: Math.round(liquido * 100) / 100,
    precoMinutoUsd: precoMinuto || COTAS.github.precoMinutoUsd,
    creditoUsd: Math.round(credito * 100) / 100,
    creditoRestanteUsd: Math.round(restante * 100) / 100,
    creditoUsadoFraccao: fracao(desconto, credito),
    diasComUso: serie.length,
    seriePorDia: serie,
    diaEmQueAcabou,
    skus: [...skus],
  };
}

/**
 * A PROJECÇÃO ATÉ AO FIM DO CICLO — «a este ritmo, onde é que isto pára?» (17/11/2026).
 *
 * UMA COTA MENSAL LIDA NO DIA 17 NÃO DIZ SE HÁ PROBLEMA. 1.933 de 2.000 é 96,7% — e é dia 17. O
 * número que serve para decidir é o do FIM do mês, e ele sai de uma regra de três: o que já andou
 * dividido pelos dias que andaram, vezes os dias que o mês tem.
 *
 * E O QUE SAI DA CONTA DELA NÃO É O BRUTO PROJETADO: é o bruto **menos a franquia**. Um mês que
 * fecha em $20,47 brutos com $12 de franquia custa **$8,47** — e a página tem de dizer oito e
 * quarenta e sete, não vinte. É a diferença entre assustar e informar.
 *
 * `diasAteAcabarCredito` é a resposta à pergunta que ela fez por outras palavras («me programar
 * antes que seja tarde»): **quantos dias faltam até o crédito do mês se esgotar**. Sai do crédito
 * que resta dividido pelo ritmo diário em dólares — e é `null` quando já se esgotou (aí o que
 * interessa é o que já está a ser cobrado, e para isso há o líquido da fatura).
 */
function projectarCiclo({ gastos, incluido, agora, precoMinutoUsd, creditoUsd, descontoUsd, serie } = {}) {
  const g = Math.max(0, Number(gastos) || 0);
  const inc = Math.max(0, Number(incluido) || 0);
  const preco = Number(precoMinutoUsd) > 0 ? Number(precoMinutoUsd) : COTAS.github.precoMinutoUsd;
  const credito = Number(creditoUsd) > 0 ? Number(creditoUsd) : inc * preco;
  const desconto = Number.isFinite(Number(descontoUsd)) ? Math.max(0, Number(descontoUsd)) : null;
  const d = agora ? new Date(agora) : null;
  if (!d || Number.isNaN(d.getTime())) {
    return {
      gastos: g, incluido: inc, fraccao: fracao(g, inc), diasDecorridos: null, diasNoMes: null,
      projeccao: null, excedentePrevisto: null, creditoUsd: credito, creditoRestanteUsd: null,
      diasAteAcabarCredito: null, liquidoPrevistoUsd: null, janelaDoRitmo: null,
    };
  }
  const diasNoMes = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0).getUTCDate();
  const diasDecorridos = Math.max(1, d.getUTCDate());

  /* ── O RITMO VEM DOS ÚLTIMOS DIAS, E NÃO DO MÊS INTEIRO (17/11/2026) ───────────────────────
   *
   * A MÉDIA DO MÊS MENTE QUANDO A ROTINA MUDA A MEIO DO MÊS. Medido neste dia: a publicação
   * passou de 3 jobs por push para 1, e a média do mês — que inclui dezessete dias a 3 jobs —
   * continuou a projectar ~3.400 min para um mês que já ia fechar muito abaixo disso. Uma
   * projecção que ignora uma mudança estrutural não é conservadora: é errada, e leva a contratar
   * um plano que já não é preciso.
   *
   * A JANELA É CURTA DE PROPÓSITO: os últimos 7 dias (ou os que houver), que é o tempo em que uma
   * mudança de rotina já aparece nos números sem apagar a variação normal de uma semana. A página
   * diz qual janela usou — uma média de 3 dias e uma de 7 não valem o mesmo.
   */
  const serieLimpa = Array.isArray(serie) ? serie.filter((x) => x && Number.isFinite(Number(x.minutos))) : [];
  const janela = serieLimpa.slice(-7);
  const usouCauda = janela.length >= 3;
  const ritmo = usouCauda
    ? janela.reduce((s, x) => s + Number(x.minutos), 0) / janela.length
    : g / diasDecorridos;

  /* ── «JÁ GASTO + RITMO × DIAS QUE FALTAM», E NÃO «RITMO × DIAS DO MÊS» (17/11/2026) ────────
   *
   * A SEGUNDA FÓRMULA RE-CONTABILIZA O PASSADO. `ritmo × 30` supõe que os dias que já passaram
   * custaram o mesmo que os de agora — e quando a rotina muda a meio do mês, isso é falso nos dois
   * sentidos: se o ritmo caiu, a projecção humilha o que já foi gasto; se subiu, apaga-o. Medido
   * neste dia: com a média do mês, a projecção dizia 3.416 min; com `ritmo × 30` e a cauda de 7
   * dias dizia 3.561 — as duas erradas, porque os 1.936 min já gastos NÃO vão ser gastos outra vez.
   *
   * A CONTA CERTA É A DO RUN RATE: o que já saiu, mais o que vai sair ao ritmo de agora. É a única
   * que respeita as duas metades do mês, e é a que responde à pergunta que interessa — «este mês
   * ainda cabe?»; a de Dezembro é outra, e é a que se lê na linha seguinte.
   */
  const diasRestantes = Math.max(0, diasNoMes - diasDecorridos);
  const projeccao = Math.round(g + ritmo * diasRestantes);
  const brutoPrevisto = Math.round(projeccao * preco * 100) / 100;
  /* O MÊS SEGUINTE, COM O RITMO DE AGORA E SEM HERANÇA NENHUMA — é onde a mudança de rotina
   * aparece inteira, porque não há um dia caro a puxar a média para cima. */
  const mesInteiroAoRitmo = Math.round(ritmo * diasNoMes);
  const creditoRestante = desconto == null ? Math.max(0, credito - g * preco) : Math.max(0, credito - desconto);
  const ritmoUsd = Math.round(ritmo * preco * 100) / 100;
  return {
    gastos: g,
    incluido: inc,
    fraccao: fracao(g, inc),
    diasDecorridos,
    diasNoMes,
    ritmoDia: Math.round(ritmo * 10) / 10,
    /* DE ONDE VEM O RITMO — dito, porque muda o número e quem lê tem de saber qual dos dois é. */
    janelaDoRitmo: usouCauda ? 'últimos ' + janela.length + ' dias' : 'média do mês',
    ritmoUsdDia: ritmoUsd,
    projeccao,
    diasRestantes,
    mesInteiroAoRitmo,
    /* O CUSTO DO PRÓXIMO MÊS a este ritmo — `0` quando cabe na franquia, e é esse o número que
     * responde a «preciso de contratar?». */
    proximoMesUsd: Math.max(0, Math.round((mesInteiroAoRitmo * preco - credito) * 100) / 100),
    brutoPrevistoUsd: brutoPrevisto,
    creditoUsd: Math.round(credito * 100) / 100,
    creditoRestanteUsd: Math.round(creditoRestante * 100) / 100,
    /* Quantos dias até o crédito acabar. Com o ritmo a zero, não acaba nunca — `null`, e não 0. */
    diasAteAcabarCredito: ritmoUsd > 0 ? Math.max(0, Math.ceil((creditoRestante / ritmoUsd) * 10) / 10) : null,
    /* O QUE SAI DA CONTA: o bruto previsto menos a franquia. Nunca negativo. */
    liquidoPrevistoUsd: Math.max(0, Math.round((brutoPrevisto - credito) * 100) / 100),
    excedentePrevisto: Math.max(0, projeccao - inc),
    custoPrevistoUsd: Math.max(0, Math.round((brutoPrevisto - credito) * 100) / 100),
    projeccaoExcede: projeccao > inc,
  };
}

/**
 * O CONSUMO DO GITHUB, por workflow e no total.
 *
 * `runs` chega como o painel o lê da API (`id`, `workflow`, `segundos`, `quando`), e `jobsPorRun` é
 * o mapa `{ <id>: [{segundos}] }` do que já foi medido. O que não estiver no mapa entra como
 * estimado — e a página diz quantos são.
 */
function resumirGithub({ runs, jobsPorRun, plano, desde, conferencia, facturado, agora, repositorioPublico } = {}) {
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

  /* QUEM AINDA CORRE, E QUEM JÁ NÃO — medido pelos próprios dados, sem pedido nenhum.
   *
   * A TABELA AGREGA O MÊS, e o mês inclui fluxos que já foram fundidos ou apagados: a 17/11/2026 o
   * «Regerar os índices» (768 min) e o «Reancorar a cadeia» (342 min) já não existiam — tinham sido
   * fundidos no `derivados.yml` — e continuavam no topo da tabela, a somar mais do que qualquer
   * fluxo vivo. Quem olha para ali para decidir dinheiro lê «isto gasta 768 min por mês», e é
   * falso. A marca não adivinha o futuro: diz que não houve execuções nas últimas 24 horas, que é
   * o que se sabe.            */
  const corte24 = agora && !Number.isNaN(Date.parse(agora))
    ? new Date(Date.parse(agora) - 24 * 3600 * 1000).toISOString()
    : null;

  const degrau = (plano && plano.computeUsd) || COTAS.github.computeIncluidoUsd;
  const total = minutosIncluidos({ computeUsd: degrau });
  const fluxos = [...porFluxo.values()].sort((a, b) => b.minutos - a.minutos);
  /* A MARCA, aplicada depois de todas as execuções contadas — e ela é sobre a ÚLTIMA vez de cada
   * fluxo, e não sobre a existência de um ficheiro: o código não tem lista de nomes (uma lista
   * apodrece), tem o instante da última execução. */
  if (corte24) {
    for (const f of fluxos) f.activoUltimas24h = Boolean(f.ultimaEm && f.ultimaEm >= corte24);
  }

  /* ── A CONFERÊNCIA CONTRA O CAMPO DE FACTURAÇÃO (17/11/2026) ────────────────────────────────
   *
   * FICA REGISTADA, E NÃO APAGADA, porque é a prova de uma coisa que se aprendeu: `billable`, de
   * `/runs/{id}/timing`, respondeu ZERO enquanto a fatura contava 1.933 minutos. O campo não serve
   * para medir — e a página diz isso com essas palavras, em vez de o apresentar como se servisse.
   *
   * `atesta` é a pergunta certa — «o fornecedor confirma consumo?» — e não «o número é zero?».
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

  /* ── O NÚMERO PRINCIPAL É O DA FATURA, E A FATURA TEM QUATRO NÚMEROS (17/11/2026) ───────────
   *
   * TUDO O QUE ESTÁ ACIMA É ATRIBUIÇÃO, E NÃO É O CONSUMO. Os `minutos` somados por fluxo dizem
   * QUEM gastou; quanto se gastou lê-se nas LINHAS DA FATURA, e a fatura não se calcula: pede-se.
   * Medido no dia em que se compararam: a regra dava 2.312 min até 17/11 e a fatura dizia **1.933**
   * — a regra corre ~20% acima, porque conta como facturado o que o fornecedor não conta.
   *
   * E O CICLO É MENSAL, NÃO ROLANTE. A franquia volta a zero no dia 1; uma janela de 30 dias
   * rolantes comparada com um tecto mensal mede duas coisas que não se somam.
   *
   * A FRANQUIA É UM DESCONTO, E NÃO UM LIMITE. O GitHub não diz «2.000 minutos incluídos» na
   * fatura: diz **bruto $X, desconto $X, líquido $0**. O crédito é $12/mês, e o que decide o mês é
   * quanto dele resta — não o bruto, que pode ser $11,60 e não custar nada.
   */
  const fatura = (facturado && facturado.ok && Array.isArray(facturado.linhas))
    ? resumirFactura({ linhas: facturado.linhas, creditoUsd: total * COTAS.github.precoMinutoUsd })
    : null;
  const daFactura = Boolean(fatura);
  const gastos = daFactura ? fatura.minutos : minutos;
  const incluido = daFactura ? Math.round(fatura.creditoUsd / fatura.precoMinutoUsd) : total;
  /* ── REPOSITÓRIO PÚBLICO: OS MINUTOS NÃO SÃO COBRADOS (17/11/2026) ──────────────────────────
   *
   * «Standard GitHub-hosted runners in public repositories» são gratuitos e ilimitados, e não
   * consomem o compute incluído. Num repositório público, portanto, os dólares que a fatura
   * registou são HISTÓRIA — o que se pagou enquanto era privado — e não uma conta a pagar.
   *
   * A distinção é entre o que a fatura diz e o que vai ser cobrado, e o painel não pode confundi-las:
   *   · `fatura.liquidoUsd` é o que a fatura registou;
   *   · `cobravel` é o que sai da conta, e num repositório público é ZERO.
   */
  const publico = repositorioPublico === true;
  const ciclo = projectarCiclo({
    gastos, incluido, agora, precoMinutoUsd: COTAS.github.precoMinutoUsd,
    creditoUsd: daFactura ? fatura.creditoUsd : null,
    descontoUsd: daFactura ? fatura.descontoUsd : null,
    serie: daFactura ? fatura.seriePorDia : null,
  });
  return {
    provedor: 'github',
    janela: desde || null,
    runs: lista.length,
    /* `minutos` é a ATRIBUIÇÃO (a regra, por fluxo); `gastos` é o CONSUMO, e vem da fatura quando
     * ela pôde ser lida. Quando não pôde, `gastos` cai na regra — e `fonte` diz qual dos dois é. */
    minutos,
    gastos,
    incluido,
    fonteDoGasto: daFactura ? 'factura' : 'regra',
    /* AS TRÊS RESPOSTAS A «QUANTO VOU PAGAR ESTE MÊS», e elas não são a mesma pergunta:
     *   · `repositorioPublico` — o que torna os minutos gratuitos;
     *   · `cobravel` — o que sai da conta, já com a visibilidade aplicada;
     *   · `liquidoDaFaturaUsd` — o que a fatura registou, independentemente dela. */
    repositorioPublico: publico,
    cobravel: !publico,
    liquidoDaFaturaUsd: daFactura ? fatura.liquidoUsd : null,
    cobravelUsd: publico ? 0 : (daFactura ? fatura.liquidoUsd : null),
    /* A PROJECÇÃO, IDEM: num repositório público não há conta a pagar no fim do mês. */
    liquidoPrevistoCobravelUsd: publico ? 0 : (ciclo.liquidoPrevistoUsd == null ? null : ciclo.liquidoPrevistoUsd),
    /* A fatura, tal como ela é: quatro números que não se podem confundir. */
    fatura,
    /* O DESVIO DA ATRIBUIÇÃO — e diz-se em vez de se esconder. A regra por fluxo não é a fatura:
     * conta como facturado o que o fornecedor não conta (jobs saltados, arredondamentos). Serve
     * para saber DE QUEM é o gasto, e não para medir o consumo. */
    desvioDaRegra: (daFactura && gastos > 0) ? Math.round(((minutos / gastos) - 1) * 1000) / 1000 : null,
    facturacaoIndisponivel: daFactura ? null : (facturado && facturado.motivo) || null,
    pedePermissao: daFactura ? null : ((facturado && facturado.pede) || null),
    ciclo,
    segundos,
    minutosPorRun: lista.length ? Math.round((minutos / lista.length) * 10) / 10 : 0,
    total,
    restantes: Math.max(0, incluido - gastos),
    fraccao: fracao(gastos, incluido),
    excedenteMinutos: Math.max(0, gastos - incluido),
    excedenteUsd: Math.max(0, gastos - incluido) * COTAS.github.precoMinutoUsd,
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

  /* ── A LEITURA EM AULAS (17/11/2026) ──────────────────────────────────────────────────────
   *
   * A unidade comercial passou a ser a AULA (§ADITIVO §1), e a receita em reais não responde à
   * pergunta que a decisão nova faz: «quantas aulas vendi, e a quanto sai cada uma?». Os reais
   * continuam a ser o que entra na conta — o livro é que manda, e não uma segunda aritmética —, e
   * estes dois números são a MESMA receita lida pelo eixo novo.
   *
   * O QUE NÃO SE INVENTA. A franquia soma-se dos contratos (`l.franquia.franquia`, que vem do
   * catálogo). O CONSUMO só se soma quando existe: enquanto não houver contador de aulas
   * (PLANO-CONTADOR-DE-AULAS.md), `aulasUsadas` é `null` — e a página cala-o, em vez de dizer que
   * o parque não trabalhou.
   *
   * O PREÇO MÉDIO POR AULA é o número que a decisão comercial usa para comparar degraus, e sai da
   * divisão certa: reais que entram ÷ aulas vendidas. Se a franquia total for zero (nenhum
   * contrato com plano), ele é `null` — e não uma divisão por zero disfarçada. */
  let franquiaAulas = 0;
  let aulasUsadas = 0;
  let comContagem = 0;
  let contratosComFranquia = 0;
  for (const l of vivas) {
    const f = l && l.franquia;
    if (!f || !Number.isFinite(Number(f.franquia))) continue;
    franquiaAulas += Math.max(0, Number(f.franquia) || 0);
    contratosComFranquia += 1;
    if (f.usadas != null) { aulasUsadas += Math.max(0, Number(f.usadas) || 0); comContagem += 1; }
  }
  /* A SOMA SÓ VALE SE FOR INTEIRA. Com um contrato contado e outro não, somar os que têm daria um
   * total que PARECE o do parque e é uma parte dele — o mesmo erro da amostra de 500 execuções, que
   * esta casa já pagou uma vez. Ou todos contam, ou o número é `null` e a página diz que ainda não
   * há contagem completa. */
  const contagemCompleta = contratosComFranquia > 0 && comContagem === contratosComFranquia;
  const algumaContagem = contagemCompleta;

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
    /* O EIXO NOVO — a mesma receita, contada em aulas. */
    aulas: {
      contratosComFranquia,
      contratosComContagem: comContagem,
      franquiaTotal: franquiaAulas,
      usadas: algumaContagem ? aulasUsadas : null,
      /* O preço médio que a escola paga por aula contratada — e não por aula usada: a franquia é
       * um direito, e o que se compara entre degraus é o preço do direito. */
      precoContratadoCentavos: franquiaAulas > 0 ? Math.round(mrr / franquiaAulas) : null,
      /* O preço por aula EFFECTIVAMENTE usada só existe quando há contagem, e é ele que diz se o
       * degrau está bem dimensionado: uma escola que compra 300 e usa 40 paga caro por aula. */
      precoUsadoCentavos: algumaContagem && aulasUsadas > 0 ? Math.round(mrr / aulasUsadas) : null,
    },
  };
}

/* ── A INADIMPLÊNCIA: QUEM DEVE, HÁ QUANTOS MESES, E O QUE FAZER ───────────────────────────────
 *
 * A REGRA DELA, e é uma escada de três degraus com uma acção em cada:
 *
 *   «A escola não pagou um mês, ela fica inadimplente. […] não pagou dois […] não pagou três meses,
 *   tá inadimplente, aí eu posso expurgar a escola. […] pelo monitoramento eu vou saber se a escola
 *   está adimplente ou inadimplente e vou entrar em contato com a escola, ver o que que aconteceu,
 *   tentar resolver e não perder o cliente.»
 *
 * O QUE JÁ EXISTIA, e não se duplica: `situacaoDaEscola` (no extrato) já calcula, mês a mês, se
 * venceu e se está pago; e `estadoDoExpurgo` (no `raiz.js`) já decide se a escola pode ser apagada.
 * Esta função NÃO decide nada disso — ela CONTA os meses em atraso e dá-lhes o nome que a conversa
 * usa. Uma segunda conta da dívida daria um segundo número, e o que ficasse a valer seria o que ela
 * lesse primeiro.
 *
 * OS TRÊS NOMES, e porquê:
 *   · `em-dia` — nada vencido por pagar. Não se contacta ninguém.
 *   · `inadimplente` — um ou dois meses vencidos. É a janela da CONVERSA: «entrar em contato, ver o
 *     que aconteceu, tentar resolver, e não perder o cliente». O número de meses é o que diz o tom.
 *   · `para-expurgar` — três ou mais. É a saída da escada, e a decisão continua a ser dela: o
 *     sistema diz que o prazo chegou, não apaga sozinho.
 *
 * A SUSPENSÃO NÃO ENTRA AQUI. Quem desabilita é ela («sou eu. Eu que faço isso. […] é uma
 * estratégia minha para negociação»), e o estado comercial vem do registo — não se deriva de uma
 * contagem de meses. Derivá-lo tirar-lhe-ia a alavanca: uma escola a quem ela decidiu dar mais um
 * mês apareceria como suspensa por um número, e não pela decisão dela.
 */
const MESES_ATE_EXPURGAR = 3;

function inadimplencia({ extrato, agora } = {}) {
  const linhas = Array.isArray(extrato) ? extrato : [];
  const vivas = linhas.filter((l) => l && l.contratoVivo !== false);
  const porEscola = [];
  let emDia = 0;
  let inadimplentes = 0;
  let paraExpurgar = 0;
  let dividaTotalCentavos = 0;

  for (const l of vivas) {
    const meses = Array.isArray(l.meses) ? l.meses : [];
    /* O QUE CONTA COMO DÍVIDA: o mês VENCEU e NÃO está pago. Um mês que ainda não venceu não é
     * atraso — é o mês em curso, e cobrá-lo como dívida seria contar o futuro. E um mês pago não
     * conta, mesmo que tenha sido pago tarde: o atraso já foi resolvido, e o que interessa à
     * conversa é o que falta pagar. */
    const vencidos = meses.filter((m) => m && m.venceu && m.status !== 'pago');
    const n = vencidos.length;
    const divida = vencidos.reduce((s, m) => s + Math.max(0, Number(m.valorCentavos) || 0), 0);
    dividaTotalCentavos += divida;
    let classe = 'em-dia';
    if (n >= MESES_ATE_EXPURGAR) { classe = 'para-expurgar'; paraExpurgar += 1; }
    else if (n > 0) { classe = 'inadimplente'; inadimplentes += 1; }
    else emDia += 1;
    if (n > 0) {
      porEscola.push({
        escola: l.escola,
        nome: l.nome || l.escola,
        mesesVencidos: n,
        /* O MÊS MAIS ANTIGO é o que âncora a conversa: «está devendo desde agosto». */
        desde: vencidos.length ? String(vencidos[vencidos.length - 1].mes || '') : null,
        dividaCentavos: divida,
        classe,
        plano: l.plano || null,
        planoNome: l.planoNome || null,
        estadoComercial: l.estadoComercial || null,
      });
    }
  }

  /* O MAIS ANTIGO PRIMEIRO: é a ordem do trabalho — quem deve há mais tempo é quem se contacta
   * primeiro, e a lista é para isso. */
  porEscola.sort((a, b) => (b.mesesVencidos - a.mesesVencidos)
    || String(a.desde || '').localeCompare(String(b.desde || '')));

  return {
    agora: agora || null,
    limiar: MESES_ATE_EXPURGAR,
    escolas: vivas.length,
    emDia,
    inadimplentes,
    paraExpurgar,
    dividaTotalCentavos,
    /* A LISTA SÓ TEM QUEM DEVE. Uma lista com as escolas em dia ao lado das devedoras faria
     * procurar o que interessa no meio do que não interessa — e a pergunta desta tabela é «quem é
     * que eu tenho de contactar». */
    devedoras: porEscola,
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
  /* ── O BOTÃO DE MIGRAR, E A VERDADE SOBRE ELE (17/11/2026) ───────────────────────────────────
   *
   * «Todos esses planos aqui têm que ter o botão para migrar, **para aqueles que for possível**.»
   *
   * O QUE É POSSÍVEL, MEDIDO E NÃO SUPOSTO:
   *   · **GitHub Free** — a migração não é de plano, é de VISIBILIDADE: repositório público não
   *     consome o compute incluído. É a única mudança que uma API faz por nós
   *     (`PATCH /repos/{dono}/{repo}` com `private`), e é a política de rotação do §L9e.
   *   · **GitHub Pro/Team/Enterprise** — mudar de plano é uma SUBSCRIÇÃO DE PAGAMENTO. Não há
   *     endpoint: o GitHub não expõe a alteração de plano na API, só a leitura do consumo.
   *   · **Cloudflare Workers Paid** — a subscrição muda no painel, com perfil de facturação; o
   *     token deste Worker não tem essa permissão (e não deve ter).
   *   · **Resend** — o plano muda no painel deles; não há endpoint.
   *
   * Um botão que promete o que não faz é pior do que não ter botão: quem carrega fica a achar que
   * mudou de plano. Onde não é possível, a página diz que não é e manda ao sítio certo. */
  const fazer = (possivel, accao, motivo, ligacao) => ({ possivel, accao, motivo, ligacao });
  const linha = (id, nome, quando, usdMes, nota, migrar) => {
    const delta = usdMes - actual;
    const fraccaoDaReceita = receitaUsd && receitaUsd > 0 ? usdMes / receitaUsd : null;
    cenarios.push({
      id, nome, quando, usdMes, delta, nota,
      fraccaoDaReceita,
      exigeReceitaUsd: fraccaoDaReceita ? usdMes / 0.05 : null, // 5% da receita: o limite que ela fixou
      migrar: migrar || fazer(false, null, 'não há caminho por API para este plano', null),
    });
  };

  /* AS ESCADAS, e o gatilho de cada degrau — os números que decidem, e não os nomes.
   *
   * O PRIMEIRO DEGRAU DO GITHUB É O GRÁTIS, e a migração dele não é de plano: é de visibilidade.
   * Está nesta tabela porque é o degrau que se muda todos os meses, e porque a pergunta «e o
   * grátis?» não tinha onde ser respondida. */
  linha('github-free', 'GitHub Free', 'o plano de hoje — a migração é torná-lo público ou privado',
    0,
    'o plano gratuito dá $12 de compute. Em repositório PÚBLICO os minutos de Actions não são '
    + 'cobrados nem consomem o incluído — é a rotação do §L9e.',
    fazer(true, 'visibilidade', null, null));
  linha('github-team', 'GitHub Team', 'acima de 2.000 min facturados no mês',
    COTAS.github.planos[1].porPessoaUsd,
    'inclui $18 de compute (3.000 min). Entre 2.000 e 2.667 min, pagar excedente sai mais barato '
    + 'do que o plano.',
    fazer(false, null, 'mudar de plano é uma subscrição de pagamento; o GitHub não expõe essa '
      + 'alteração na API, só a leitura do consumo', 'https://github.com/settings/billing'));
  linha('github-enterprise', 'GitHub Enterprise Cloud', 'acima de 5.833 min no mês',
    COTAS.github.planos[2].porPessoaUsd,
    'inclui $300 de compute (50.000 min). Só compensa no volume em que o excedente do Team passaria '
    + 'este valor.',
    fazer(false, null, 'idem: é subscrição de pagamento, e não há endpoint',
      'https://github.com/settings/billing'));
  linha('cloudflare-paid', 'Cloudflare Workers Paid', 'ao chegar a 1.000 escritas de KV por dia',
    COTAS.cloudflare.planoPagoUsd,
    'não é por uso: $5 por conta, com 10 milhões de pedidos e o KV desafogado.',
    fazer(false, null, 'a subscrição muda no painel, com perfil de facturação — o token deste '
      + 'Worker não tem (nem deve ter) essa permissão',
      'https://dash.cloudflare.com/?to=/:account/workers-and-pages'));
  linha('resend-pro', 'Resend Pro (50 mil)', 'ao chegar a 3.000 e-mails no mês, ou 100 no dia',
    COTAS.resend.planos[1].usdMes,
    'tira o limite diário, que é o que aperta primeiro no plano gratuito.',
    fazer(false, null, 'o Resend não expõe mudança de plano na API',
      'https://resend.com/settings/billing'));
  linha('resend-scale', 'Resend Scale (100 mil)', 'ao chegar a 50.000 e-mails no mês',
    COTAS.resend.planos[2].usdMes,
    'inclui 100 mil e-mails e o IP dedicado como extra.',
    fazer(false, null, 'o Resend não expõe mudança de plano na API',
      'https://resend.com/settings/billing'));

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
function retrato({ github, correio, cloudflare, receita: r, inadimplencia: inad, cambio, custosAtuaisUsd, agora } = {}) {
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
    /* A INADIMPLÊNCIA ENTRA NO RETRATO (17/11/2026): é a mesma família da receita — dinheiro que
     * devia ter entrado e não entrou —, e é a lista de quem contactar. Vai separada da receita
     * porque responde a outra pergunta: a receita diz «quanto entra», esta diz «quem não pagou». */
    inadimplencia: inad || null,
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
  projectarCiclo,
  resumirFactura,
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
  inadimplencia,
  MESES_ATE_EXPURGAR,
  impactoDaMigracao,
  retrato,
};
