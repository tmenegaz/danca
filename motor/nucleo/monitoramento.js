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

/*
 * ── A UNIDADE QUE DECIDE: A AULA ────────────────────────────────────────────────────────────────
 *
 * O painel media minutos, e os minutos são a unidade do FORNECEDOR. A unidade da casa é a AULA — é o
 * que se vende, o que a franquia conta e o que o professor lança. Medido a 25/11/2026 sobre mil
 * execuções: um lançamento custa **1,00 min** (`Fechar os derivados`, mediana 11 s, 395 runs) e a
 * geração que ele pede custa **1,00 min** (`Gerar o ciclo`, mediana 40 s, 16 runs depois de o TeX
 * sair do caminho) — **2,0 minutos por aula**.
 *
 * O QUE ISSO QUER DIZER, e é o número que ela pediu: os 2.000 minutos do plano gratuito são
 * **1.000 aulas por mês**. É esse o número que o painel tem de mostrar a subir, porque é ele que
 * diz quando a conta sai do zero — e o §12 do CUSTO-DOS-FLUXOS mediu que, a partir daí, cada aula
 * custa **R$ 0,072** a um dólar de R$ 6.
 *
 * OS DOIS NÚMEROS SÃO DECLARADOS E DATADOS. `MINUTOS_POR_AULA` é uma MEDIÇÃO (com a sua data), e
 * `CAMBIO_DE_REFERENCIA` é uma DECISÃO dela — «até R$ 6 o dólar é onde eu posso suportar» —, e não
 * a cotação do dia: o comparador continua a usar o `CAMBIO_USD_BRL` do `env`, que é o que se paga.
 * A referência existe para a pergunta «e se o dólar for a 6?», que é a pergunta de quem se previne.
 */
const MINUTOS_POR_AULA = 2.0;
/* A data da medição é um INSTANTE e não um dia solto: passada pelo fuso da casa, uma data nua
 * (`2026-11-25`) é meia-noite UTC — e meia-noite UTC é o dia 24 às 21:00 em Passo Fundo. A casa já
 * pagou por isto uma vez (o comentário do `dia()` no painel). O meio-dia local não tem fronteira. */
const MINUTOS_POR_AULA_MEDIDO_EM = '2026-11-25T12:00:00-03:00';
const CAMBIO_DE_REFERENCIA = 6.0;

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
 * AS OPERAÇÕES DO CLOUDFLARE, DIA A DIA — a leitura que passou a existir a 25/11/2026.
 *
 * A FRASE QUE ISTO CORRIGE, e era falsa: o painel dizia que a leitura de analítica «exige um token
 * com permissão de analítica, que este Worker não tem». Medido com o token que o Worker já tem: tem.
 * Uma limitação declarada que é falsa é pior do que uma omissão — faz quem lê desistir de pedir o
 * número.
 *
 * O QUE ENTRA NO ALERTA É O **PICO**, e não o dia de hoje. A cota do Cloudflare é diária e volta a
 * zero à meia-noite UTC: hoje às 0,5 % não diz nada sobre o risco, e o dia em que se escreveu 234
 * chaves diz tudo. O pico é a evidência do que a operação faz, e é estável — não oscila com a hora a
 * que se abre o painel. O hoje fica ao lado, porque é a outra pergunta («como está agora?»).
 *
 * @param {object} analitica o que `analiticaDoCloudflare` devolveu
 * @param {object} base      as cotas (`COTAS.cloudflare`)
 */
const OPERACOES_DO_CLOUDFLARE = [
  { campo: 'pedidos', rotulo: 'Pedidos ao Worker', cota: 'pedidosDia' },
  { campo: 'leituras', rotulo: 'Leituras de KV', cota: 'leiturasKvDia' },
  { campo: 'escritas', rotulo: 'Escritas de KV', cota: 'escritasKvDia' },
  { campo: 'listas', rotulo: 'Listagens de KV', cota: 'listasKvDia' },
  { campo: 'apagamentos', rotulo: 'Apagamentos de KV', cota: 'apagamentosKvDia' },
];

function operacoesDoCloudflare(analitica, base) {
  if (!analitica || !analitica.ok) return null;
  const dias = Array.isArray(analitica.dias) ? analitica.dias : [];
  if (!dias.length) return null;
  const porOperacao = [];
  for (const op of OPERACOES_DO_CLOUDFLARE) {
    const cota = Math.max(0, Number(base[op.cota]) || 0);
    let pico = 0;
    let diaDoPico = null;
    for (const d of dias) {
      const v = Number(d[op.campo]) || 0;
      if (v > pico) { pico = v; diaDoPico = d.dia; }
    }
    const hoje = analitica.hoje ? (Number(analitica.hoje[op.campo]) || 0) : null;
    porOperacao.push({
      operacao: op.campo, rotulo: op.rotulo, cota,
      hoje, pico, diaDoPico,
      fraccaoHoje: hoje == null || !cota ? null : hoje / cota,
      fraccaoPico: !cota ? null : pico / cota,
    });
  }
  /* O PIOR É O PIOR DAS CINCO, e não a média: quatro operações folgadas e uma a 90% é uma a 90%. */
  const fraccoes = porOperacao.map((o) => o.fraccaoPico).filter((f) => typeof f === 'number');
  return {
    ok: true,
    janela: analitica.janela || null,
    hoje: analitica.hoje || null,
    dias,
    porScript: Array.isArray(analitica.porScript) ? analitica.porScript : [],
    porOperacao,
    fraccaoPico: fraccoes.length ? Math.max(...fraccoes) : 0,
    /* O TRUNCADO VAI JUNTO: num parque grande os grupos chegam ao tecto de 1 000 e o número passa a
     * ser um mínimo. Um mínimo apresentado como total é a mentira que o painel existe para evitar. */
    truncado: analitica.truncado === true,
  };
}

/**
 * A OCUPAÇÃO DO CLOUDFLARE — a de sempre (armazenamento) mais as operações por dia (25/11/2026).
 *
 * `escolas` é a lista das vivas (`{slug}`) e `chaves` é o mapa `{ <escola>: {total, bytes} }` que a
 * rota lê com `kv.list()`. `analitica` é o que `analiticaDoCloudflare` devolveu — e quando não vem,
 * ou quando vem falhada, o que não se mediu vai dito em `naoMedido` com o MOTIVO VERDADEIRO da
 * falha. É a diferença entre um painel e um enfeite.
 */
function resumirCloudflare({ escolas, chaves, cotas, analitica } = {}) {
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
  const operacoes = operacoesDoCloudflare(analitica, base);
  return {
    provedor: 'cloudflare',
    escolas: porEscola.length,
    porEscola,
    chaves: totalChaves,
    bytes: totalBytes,
    armazenamentoGb,
    totalArmazenamentoGb: base.armazenamentoKvGb,
    fraccaoArmazenamento: fracao(armazenamentoGb, base.armazenamentoKvGb),
    /* AS OPERAÇÕES POR DIA — MEDIDAS DESDE 25/11/2026 (ver `analiticaDoCloudflare`). O que fica
     * declarado é só o que a leitura não devolveu, e o motivo é o da falha, não uma frase feita. */
    operacoes,
    fraccaoOperacoes: operacoes ? operacoes.fraccaoPico : null,
    naoMedido: operacoes ? [] : [
      { o: 'pedidos ao Worker por dia', cota: base.pedidosDia },
      { o: 'leituras de KV por dia', cota: base.leiturasKvDia },
      { o: 'escritas de KV por dia', cota: base.escritasKvDia },
      { o: 'listagens de KV por dia', cota: base.listasKvDia },
      { o: 'apagamentos de KV por dia', cota: base.apagamentosKvDia },
    ],
    /* O MOTIVO VEM DA FALHA, e não de uma frase fixa. Era aqui que estava escrito «que este Worker
     * não tem» — e o Worker tem. Agora, quando falha, diz-se o que o Cloudflare respondeu. */
    motivoNaoMedido: operacoes ? null
      : ((analitica && analitica.motivo)
        || 'a analítica do Cloudflare não foi lida nesta abertura — o número está em Workers → '
          + 'Metrics, no painel do Cloudflare.'),
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
  let moraTotalCentavos = 0;

  for (const l of vivas) {
    const meses = Array.isArray(l.meses) ? l.meses : [];
    /* O QUE CONTA COMO DÍVIDA: o mês VENCEU e NÃO está pago. Um mês que ainda não venceu não é
     * atraso — é o mês em curso, e cobrá-lo como dívida seria contar o futuro. E um mês pago não
     * conta, mesmo que tenha sido pago tarde: o atraso já foi resolvido, e o que interessa à
     * conversa é o que falta pagar. */
    const vencidos = meses.filter((m) => m && m.venceu && m.status !== 'pago');
    const n = vencidos.length;
    /* A DÍVIDA LEVA A MORA (25/11/2026). «A gente vai adotar a mesma política de multa e juros que
     * tem em conta de água, conta de luz.» O que se cobra de uma escola em atraso não é a soma das
     * mensalidades: é a soma com multa e juros, e é esse o número que a conversa usa. Os dois ficam
     * separados no retorno — quem quiser saber quanto é mensalidade e quanto é mora tem os dois. */
    const divida = vencidos.reduce((s, m) => s
      + Math.max(0, (m.encargos && m.encargos.totalCentavos != null)
        ? Number(m.encargos.totalCentavos)
        : (Number(m.valorCentavos) || 0)), 0);
    const mora = vencidos.reduce((s, m) => s + Math.max(0, (m.encargos && m.encargos.encargosCentavos) || 0), 0);
    dividaTotalCentavos += divida;
    moraTotalCentavos += mora;
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
        moraCentavos: mora,
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
    moraTotalCentavos,
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

/* ── O PONTO DE MIGRAÇÃO: QUANDO É QUE VALE A PENA SUBIR DE PLANO ────────────────────────────── */

/**
 * A PERGUNTA DELA, e é a razão de isto existir: «É ali que você vai me dizer quando vale a pena
 * então migrar. É o ponto de migração da escola. E aí que eu vou pedir para o consultor entrar em
 * contacto e aí ele ganha uma grana e presta essa consultoria e mantém a escola viva.»
 *
 * A CONTA. Uma escola que cresce tem duas saídas: **comprar extensão** a R$ 0,50 por aula, ou
 * **subir de plano** e pagar a diferença da mensalidade. As duas custam dinheiro; a partir de um
 * certo número de aulas a segunda fica mais barata. Esse número é o **ponto de viragem**:
 *
 *     viragem = franquia do plano + (preço do plano de cima − preço do plano) ÷ preço da extensão
 *
 * Com a escada de 25/11/2026 e a extensão a R$ 0,50: Básico → Intermediário às **190** aulas/mês;
 * Intermediário → Avançado às **400**. O ponto existe porque o `planos.json` escolheu R$ 0,50
 * exactamente para isso — «o custo unitário da aula da extensão é maior do que o custo unitário da
 * aula do próximo plano».
 *
 * O QUE SE COMPARA, e é a parte que importa para ela não vender mal: no ponto de viragem a escola
 * paga **o mesmo** e leva **mais aulas**. No Básico, 190 aulas com extensão custam R$ 99,90 — o
 * preço do Intermediário, que dá 320. **Quem está no ponto e não migra está a pagar 130 aulas que
 * não recebe.** É essa frase que a consultoria leva.
 *
 * AS TRÊS FONTES DO NÚMERO, e a ordem em que se usa:
 *   1. **as aulas USADAS no mês**, quando o contador existir (`franquia.usadas`) — é o número certo;
 *   2. **as aulas contratadas** (`franquia.franquia` = plano + pacotes) — é o tecto, e uma escola que
 *      comprou pacotes até passar do ponto **já está a pagar a mais**, mesmo sem contar aulas;
 *   3. nenhuma das duas → a escola não entra na lista, e diz-se porquê.
 *
 * `nivel` diz o que fazer, e é uma palavra só: `migrar` (no ponto ou acima), `janela` (a comprar
 * extensão é o certo, por agora) e `folga`.
 */
function pontosDeMigracao({ extensao } = {}) {
  /* A escada e o preço da extensão vêm do CATÁLOGO, e não de uma cópia — a lição das provas que
   * ficaram verdes sobre um mundo que já não existia (25/11/2026). */
  const comercial = require('./comercial.js');
  const planos = comercial.ASSINATURAS.map((a) => ({
    id: a.id, nome: a.nome, preco: Number(a.preco), aulas: Number(a.aulas),
  }));
  const porAula = Number.isFinite(Number(extensao)) && Number(extensao) > 0
    ? Number(extensao)
    : (() => {
      const itens = comercial.pacotesDeAulas();
      if (!itens.length) return null;
      const precos = itens.map((i) => Number(i.preco) / Number(i.aulas));
      return precos.reduce((s, v) => s + v, 0) / precos.length;
    })();
  const pontos = [];
  for (let i = 0; i + 1 < planos.length; i += 1) {
    const de = planos[i];
    const para = planos[i + 1];
    if (!porAula) continue;
    const viragem = Math.ceil(de.aulas + (para.preco - de.preco) / porAula);
    pontos.push({
      de: de.id, deNome: de.nome, para: para.id, paraNome: para.nome,
      viragem,
      /* O que a escola paga no ponto, com extensões — e o que pagaria já migrada. Os dois números
       * são iguais por construção; é isso que faz do ponto um ponto. */
      pagaNoPonto: de.preco + (viragem - de.aulas) * porAula,
      pagaMigrada: para.preco,
      aulasQueRecebe: para.aulas,
      aulasQuePagaSemReceber: para.aulas - viragem,
      porAulaNoPonto: (de.preco + (viragem - de.aulas) * porAula) / viragem,
      porAulaMigrada: para.preco / para.aulas,
    });
  }
  return {
    extensao: porAula,
    pontos,
    /* O mapa por plano de ORIGEM, para a lista das escolas o consultar sem varrer. */
    porPlano: pontos.reduce((m, p) => { m[p.de] = p; return m; }, {}),
  };
}

/**
 * AS ESCOLAS QUE VALE A PENA MIGRAR — a lista que ela pede ao consultor.
 *
 * Só entram escolas **vivas**, **com contrato**, e **com degrau acima** (o Avançado não tem para
 * onde subir, e a resposta certa nesse caso é a negociação à mão — está dito, e não escondido).
 */
function escolasParaMigrar({ extrato, agora } = {}) {
  const comercial = require('./comercial.js');
  const mapa = pontosDeMigracao();
  const linhas = Array.isArray(extrato) ? extrato : [];
  const lista = [];
  const semDegrau = [];
  let semNumero = 0;
  for (const l of linhas) {
    if (!l || l.contratoVivo === false) continue;
    const plano = l.plano || (l.franquia && l.franquia.plano) || null;
    if (!plano) { semNumero += 1; continue; }
    const ponto = mapa.porPlano[plano];
    const franquia = l.franquia && Number(l.franquia.franquia) > 0 ? Number(l.franquia.franquia) : null;
    const usadas = l.franquia && l.franquia.usadas != null ? Number(l.franquia.usadas) : null;
    /* O NÚMERO QUE DECIDE: o medido quando existe, o contratado quando não. E diz-se qual é. */
    const numero = usadas != null ? usadas : franquia;
    if (!ponto) {
      /* O TOPO DA ESCADA. Entra na lista na mesma — quem está acima da franquia do Avançado é uma
       * conversa que ela tem de ter, e uma lista que a cala deixa a maior escola sem resposta. */
      if (franquia) semDegrau.push({ escola: l.escola, nome: l.nome || l.escola, plano, franquia, usadas });
      continue;
    }
    if (numero == null) { semNumero += 1; continue; }
    const nivel = numero >= ponto.viragem ? 'migrar' : (numero > ponto.viragem * 0.8 ? 'janela' : 'folga');
    /* QUANTO ELA PERDE POR MÊS, e são DUAS coisas diferentes — a prova obrigou a separá-las
     * (25/11/2026):
     *
     *   · `economiaCentavos` — o dinheiro que ela pouparia migrando: hoje paga `valorCentavos`,
     *     no plano de cima pagaria `para.preco`. **É este o número que CRESCE com o crescimento**,
     *     e é o que a conversa usa.
     *   · `aulasQuePagaSemReceber` — a diferença de aulas entre o que ela tem e o que o plano de
     *     cima dá. **Encolhe** à medida que ela se aproxima da franquia de cima, e por isso não
     *     serve de medida de perda: dizer «paga 90 aulas a menos» a quem está a 230 de 320 é
     *     verdade e é inútil.
     *
     * A regra que ficou: **o dinheiro mede a perda, as aulas descrevem a distância.** */
    const valorDoContrato = Number(l.valorCentavos) || 0;
    const economiaCentavos = nivel === 'migrar'
      ? Math.max(0, valorDoContrato - Math.round(ponto.pagaMigrada * 100)) : 0;
    const aulasQuePagaSemReceber = nivel === 'migrar' ? Math.max(0, ponto.aulasQueRecebe - numero) : 0;
    lista.push({
      escola: l.escola, nome: l.nome || l.escola,
      plano, planoNome: l.planoNome || ponto.deNome,
      para: ponto.para, paraNome: ponto.paraNome,
      numero, fonteDoNumero: usadas != null ? 'usadas' : 'contratadas',
      franquia, usadas,
      viragem: ponto.viragem,
      falta: Math.max(0, ponto.viragem - numero),
      nivel,
      pagaNoPonto: ponto.pagaNoPonto,
      pagaMigrada: ponto.pagaMigrada,
      aulasQueRecebe: ponto.aulasQueRecebe,
      aulasQuePagaSemReceber,
      economiaCentavos,
      porAulaHoje: numero > 0 ? (Number(l.valorCentavos) || 0) / numero / 100 : null,
      porAulaMigrada: ponto.porAulaMigrada,
      valorCentavos: Number(l.valorCentavos) || 0,
    });
  }
  const ordem = { migrar: 0, janela: 1, folga: 2 };
  lista.sort((a, b) => (ordem[a.nivel] - ordem[b.nivel]) || (b.numero - a.numero));
  const migrar = lista.filter((x) => x.nivel === 'migrar');
  const janela = lista.filter((x) => x.nivel === 'janela');
  return {
    extensao: mapa.extensao,
    pontos: mapa.pontos,
    escolas: lista,
    /* AS DUAS LISTAS QUE ELA USA: quem já passou do ponto, e quem está a chegar. */
    migrar,
    janela,
    semDegrau,
    semNumero,
    /* A FRASE ÚNICA — o que se lê no topo do bloco. */
    frase: migrar.length
      ? migrar.length + ' escola(s) já passaram do ponto de viragem: pagam o mesmo que o plano de '
        + 'cima e recebem menos aulas.'
      : (janela.length
        ? janela.length + ' escola(s) estão a chegar ao ponto de viragem. Ainda não compensa mudar.'
        : 'Nenhuma escola está no ponto de viragem.'),
  };
}

/* ── A CONTA EM AULAS: ONDE O GASTO SAI DO ZERO, E QUANTO CUSTA DEPOIS ──────────────────────── */

/**
 * A PERGUNTA DELA, ao pé da letra: «quando é que os meus custos aumentam, se é que eles aumentam em
 * algum momento? E se eu vou ter prejuízo em algum momento?»
 *
 * A RESPOSTA TEM TRÊS FRASES, e todas as três se calculam daqui:
 *   1. O custo é **zero até 1.000 aulas/mês** na conta inteira (2.000 min ÷ 2,0 min/aula).
 *   2. Passado esse ponto é **R$ 0,072 por aula**, e mais nada — não há um segundo degrau.
 *   3. **Não há prejuízo em nenhum volume plausível**: a margem converge para um piso que depende do
 *      plano (90,7 % / 80,5 % / 62,9 % com a escada de 25/11 e o dólar a 6), e nunca cruza o zero.
 *
 * O QUE ENTRA POR PARÂMETRO, e por que: `aulasVendidas` é a franquia que o parque vendeu (soma dos
 * contratos) — o TECTO do que pode ser lançado, e não o que foi lançado. É a única grandeza que
 * existe hoje: o contador de aulas do mês ainda não está implementado
 * (`PLANO-CONTADOR-DE-AULAS.md`), e medir o consumo a partir da franquia vendida é o pior caso — que
 * é o caso certo para um alarme. Quando o contador existir, passa-se-lhe o número medido e o resto
 * desta função não muda.
 *
 * `precoDaAula` é a receita média por aula contratada, e vem da mesma tabela da receita
 * (`mrr ÷ aulas vendidas`). Sem ela, a margem não é calculada — e diz-se, em vez de se inventar.
 */
function projectarAulas({ aulasVendidas, precoDaAulaCentavos, cambio, referenciaCambio } = {}) {
  const aulas = Number(aulasVendidas);
  const temAulas = Number.isFinite(aulas) && aulas >= 0;
  const taxa = Number(cambio) > 0 ? Number(cambio) : null;
  const referencia = Number(referenciaCambio) > 0 ? Number(referenciaCambio) : CAMBIO_DE_REFERENCIA;
  const preco = Number(precoDaAulaCentavos);

  /* AS DUAS COTAS, e a segunda é a que ela quer vigiar. O fim do GRATUITO é em aulas; o fim do
   * TEAM (quando o excedente passa a custar mais do que o plano fixo) também, porque é a mesma
   * divisão. */
  const aulasQueEsgotamGratuito = Math.floor(minutosIncluidos(null) / MINUTOS_POR_AULA);
  const aulasQueEsgotamTeam = Math.floor(
    minutosIncluidos(COTAS.github.planos[1]) / MINUTOS_POR_AULA);

  /* A FUNÇÃO DO CUSTO, a uma taxa qualquer. É a mesma escada do §12 do CUSTO-DOS-FLUXOS, aqui
   * escrita em aulas em vez de minutos para haver uma conta só na casa. */
  const custoUsd = (n, taxaUsada) => {
    const minutos = n * MINUTOS_POR_AULA;
    const incluido = minutosIncluidos(null);
    if (minutos <= incluido) return 0;
    const teamMinutos = minutosIncluidos(COTAS.github.planos[1]);
    const excedente = (minutos - incluido) * COTAS.github.precoMinutoUsd;
    if (minutos <= teamMinutos) return Math.min(excedente, COTAS.github.planos[1].porPessoaUsd);
    return COTAS.github.planos[1].porPessoaUsd
      + (minutos - teamMinutos) * COTAS.github.precoMinutoUsd;
  };

  const retratoDaTaxa = (taxaUsada) => {
    if (!taxaUsada || !temAulas) return null;
    const usd = custoUsd(aulas, taxaUsada);
    const brlCentavos = Math.round(usd * taxaUsada * 100);
    const receitaCentavos = Number.isFinite(preco) && preco > 0 ? Math.round(preco * aulas) : null;
    const margem = receitaCentavos && receitaCentavos > 0
      ? (receitaCentavos - brlCentavos) / receitaCentavos : null;
    return { cambio: taxaUsada, custoUsd: usd, custoCentavos: brlCentavos, margem };
  };

  const hoje = retratoDaTaxa(taxa);
  const naReferencia = retratoDaTaxa(referencia);

  /* A FRACÇÃO DO GRATUITO, para a barra da cota. `null` quando não há aulas vendidas: `null` é «não
   * sei», e zero seria a afirmação de um parque vazio. */
  const fraccao = temAulas ? fracao(aulas, aulasQueEsgotamGratuito) : null;
  const aulasRestantes = temAulas ? Math.max(0, aulasQueEsgotamGratuito - aulas) : null;

  const frase = !temAulas
    ? 'Ainda não há aulas vendidas registadas: o consumo em aulas não é calculado.'
    : (aulas <= aulasQueEsgotamGratuito
      ? 'O parque vendeu ' + aulas + ' aulas/mês e o plano gratuito paga ' + aulasQueEsgotamGratuito
        + ' — restam ' + aulasRestantes + '. Enquanto assim for, o custo é zero.'
      : 'O parque vendeu ' + aulas + ' aulas/mês, ' + (aulas - aulasQueEsgotamGratuito)
        + ' acima do que o plano gratuito paga. A partir daqui cada aula custa R$ '
        + (MINUTOS_POR_AULA * COTAS.github.precoMinutoUsd * referencia).toFixed(3).replace('.', ',')
        + ' a um dólar de R$ ' + String(referencia).replace('.', ',') + '.');

  return {
    /* O que é medido, e o que é suposto. */
    minutosPorAula: MINUTOS_POR_AULA,
    minutosPorAulaMedidoEm: MINUTOS_POR_AULA_MEDIDO_EM,
    cambioDeReferencia: referencia,
    /* As cotas, em aulas. */
    aulasVendidas: temAulas ? aulas : null,
    aulasQueEsgotamGratuito,
    aulasQueEsgotamTeam,
    aulasRestantes,
    fraccao,
    excedenteAulas: temAulas ? Math.max(0, aulas - aulasQueEsgotamGratuito) : null,
    /* A conta, à taxa do dia e à de referência. */
    hoje,
    naReferencia,
    /* O QUE A FRANQUIA PROMETE, contra o que a cota paga: é a leitura que se quer de um alarme. */
    cabeNaReferencia: temAulas ? aulas <= aulasQueEsgotamGratuito : null,
    frase,
  };
}

/* ── O RETRATO COMPLETO ─────────────────────────────────────────────────────────────────────── */

/**
 * O que a página desenha, num objecto só. `agora` é o carimbo (ISO) e `hoje` é o dia LOCAL — a
 * mesma separação do `mensalidades.js`: o mês e o dia de uma cota são os do fuso da escola.
 */
function retrato({ github, correio, cloudflare, receita: r, inadimplencia: inad, aulas, cambio,
  migracaoDasEscolas, janelaDaCache, janelaLidaEm, custosAtuaisUsd, agora } = {}) {
  const migracao = impactoDaMigracao({ receita: r, cambio, custosAtuaisUsd });
  /* A CONTA EM AULAS entra no retrato (25/11/2026), e entra como COTA — é ela que responde à
   * pergunta dela («quando é que os meus custos aumentam?»), e uma cota que não está no pior
   * indicador não avisa ninguém. `aulas` vem pronto (`projectarAulas`) ou é calculado aqui a partir
   * da receita, que já sabe a franquia vendida e o preço médio da aula. */
  /* A MIGRAÇÃO DAS ESCOLAS entra no retrato (25/11/2026) — é a lista de quem contactar, e uma
   * lista que só se calcula quando alguém se lembra de a pedir não serve para nada. Vem pronta do
   * chamador (`escolas`) ou é calculada aqui a partir do mesmo extrato que a receita lê. */
  const migrarEscolas = migracaoDasEscolas || escolasParaMigrar({ extrato: r && r.linhas });
  const emAulas = aulas || projectarAulas({
    aulasVendidas: r && r.aulas ? r.aulas.franquiaTotal : null,
    precoDaAulaCentavos: r && r.aulas ? r.aulas.precoContratadoCentavos : null,
    cambio,
  });
  /* O ALERTA É O PIOR DOS QUATRO, e não a média: uma cota a 95% e três a 10% é uma cota a 95%. */
  const fraccoes = [github && github.fraccao, correio && correio.fraccao, correio && correio.fraccaoDia,
    cloudflare && cloudflare.fraccaoArmazenamento,
    /* AS OPERAÇÕES DO CLOUDFLARE ENTRAM NO ALERTA (25/11/2026). Sem esta linha, um parque com as
     * escritas de KV a 90 % e as outras cotas a 10 % dava «folga» — e a escrita de KV é a cota mais
     * apertada da casa: 1 000 por dia, contra 100 000 leituras. */
    cloudflare && cloudflare.fraccaoOperacoes,
    emAulas && emAulas.fraccao]
    .filter((f) => typeof f === 'number');
  const pior = fraccoes.length ? Math.max(...fraccoes) : 0;
  return {
    agora: agora || null,
    github: github || null,
    correio: correio || null,
    cloudflare: cloudflare || null,
    aulas: emAulas || null,
    migracaoDasEscolas: migrarEscolas || null,
    /* DE ONDE VEIO A JANELA (25/11/2026). `null` quando não se sabe — e não `false`, que afirmaria
     * «foi ao GitHub» sobre uma leitura que ninguém fez. */
    janelaDaCache: typeof janelaDaCache === 'boolean' ? janelaDaCache : null,
    janelaLidaEm: janelaLidaEm || null,
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
  MINUTOS_POR_AULA,
  MINUTOS_POR_AULA_MEDIDO_EM,
  CAMBIO_DE_REFERENCIA,
  projectarAulas,
  pontosDeMigracao,
  escolasParaMigrar,
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
