/**
 * comercial.js — O QUE UMA ESCOLA CONTRATA, E QUANTO ISSO CUSTA (25/11/2026).
 *
 * A FRENTE L8 DO PLANEJAMENTO pede uma fonte única para que «o preço exibido, o calculado e o
 * cobrado não divirjam». Este módulo é a metade que CALCULA; a fonte é
 * `biblioteca/comercial/planos.json`, e não há nenhum valor desta tabela escrito em código.
 *
 * O QUE ELE **NÃO** FAZ, e não é esquecimento:
 *   · não cobra, não fala com banco, não gera QR Code. O pagamento é PIX directo para a chave do
 *     proprietário, e a conciliação é MANUAL — a decisão dela: «a conciliação bancária é feita por
 *     mim, é feita manualmente».
 *   · não aplica desconto. A política não está fechada (§L8, risco b) e um desconto inventado num
 *     dado é um preço errado que ninguém sabe de onde veio. `descontos` está vazio no JSON, e o
 *     cálculo diz `desconto: 0` em vez de o inventar.
 *
 * A REGRA DA C23, e ela é a única: a mensalidade é `assinatura + Σ lotes`, e o lote é RECORRENTE.
 * A capacidade incluída no plano não se desconta do lote — é a tabela decidida.
 */

const CATALOGO = require('../../biblioteca/comercial/planos.json');

const ASSINATURAS = Array.isArray(CATALOGO.assinaturas) ? CATALOGO.assinaturas : [];
const LOTES = CATALOGO.lotes || { professores: [], alunos: [] };
const EXTENSOES = Array.isArray(CATALOGO.extensoes) ? CATALOGO.extensoes : [];
/** Os pacotes de aulas — o eixo que substituiu os lotes de gente (17/11/2026). */
const PACOTES = (CATALOGO.pacotesDeAulas && Array.isArray(CATALOGO.pacotesDeAulas.itens))
  ? CATALOGO.pacotesDeAulas.itens : [];

/** O dinheiro não se guarda em vírgula flutuante, e é por isso que a conta é em cêntimos. */
function centavos(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

/** `6990` → `69,90`. A formatação é a da casa: vírgula decimal, sem separador de milhares. */
function reais(emCentavos) {
  const c = Math.max(0, Math.round(Number(emCentavos) || 0));
  return (c / 100).toFixed(2).replace('.', ',');
}

/** O texto que a página mostra: `R$ 69,90`. */
function precoEmTexto(valor) {
  return String(CATALOGO.moeda_simbolo || 'R$') + ' ' + reais(centavos(valor));
}

function assinaturaPorId(id) {
  const alvo = String(id || '').trim().toLowerCase();
  return ASSINATURAS.find((a) => a && String(a.id).toLowerCase() === alvo) || null;
}

/** As extensões que um plano inclui — derivadas do próprio catálogo, não copiadas. */
function extensoesDoPlano(id) {
  const alvo = String(id || '').trim().toLowerCase();
  if (!alvo) return [];
  return EXTENSOES.filter((e) => e && Array.isArray(e.em) && e.em.indexOf(alvo) !== -1);
}

/** Os lotes de um eixo (`professores` ou `alunos`), como a página os mostra. */
function lotesDe(eixo) {
  const lista = (LOTES && LOTES[eixo]) || [];
  return lista.filter((l) => l && Number(l.qtd) > 0);
}

/**
 * O VALOR MENSAL — a conta inteira, em cêntimos, e a decomposição que a página mostra.
 *
 * `lotes` chega como `{ professores: [qtd, qtd, …], alunos: [...] }` — a quantidade de cada lote
 * escolhido, repetida tantas vezes quantas as compradas. Uma quantidade que não existe na tabela
 * é RECUSADA (e não arredondada para a mais próxima): um preço que não é o da tabela é um preço
 * que ninguém decidiu.
 */
function calcular({ assinatura, lotes, pacotes } = {}) {
  const plano = assinaturaPorId(assinatura);
  if (!plano) return { ok: false, erro: 'escolha um plano' };
  const base = centavos(plano.preco);
  const escolhidos = { professores: [], alunos: [] };
  const erros = [];
  let capacidade = 0;

  for (const eixo of ['professores', 'alunos']) {
    const pedidos = (lotes && Array.isArray(lotes[eixo])) ? lotes[eixo] : [];
    const tabela = lotesDe(eixo);
    for (const bruto of pedidos) {
      const qtd = Number(bruto);
      const achado = tabela.find((l) => Number(l.qtd) === qtd);
      if (!achado) { erros.push('o lote de ' + qtd + ' ' + eixo + ' não existe na tabela'); continue; }
      escolhidos[eixo].push({ qtd: achado.qtd, preco: centavos(achado.preco) });
      capacidade += centavos(achado.preco);
    }
  }

  /* OS PACOTES DE AULAS (17/11/2026) — o eixo comercial de hoje. `pacotes` chega como a lista de
   * ids (`['p','m','p']`), e a mesma disciplina dos lotes vale: um id que não está no catálogo é
   * RECUSADO, não arredondado. O preço soma-se à mensalidade e é recorrente. */
  const aulasCompradas = [];
  const pedidosDeAulas = (pacotes && Array.isArray(pacotes)) ? pacotes : [];
  for (const bruto of pedidosDeAulas) {
    const id = String(bruto || '').trim().toLowerCase();
    const achado = PACOTES.find((x) => String(x.id).toLowerCase() === id);
    if (!achado) { erros.push('o pacote de aulas «' + bruto + '» não existe na tabela'); continue; }
    aulasCompradas.push({ id: achado.id, nome: achado.nome, aulas: Number(achado.aulas), preco: centavos(achado.preco) });
    capacidade += centavos(achado.preco);
  }

  if (erros.length) return { ok: false, erro: erros[0], erros };

  const total = base + capacidade;
  return {
    ok: true,
    assinatura: plano.id,
    assinaturaNome: plano.nome,
    incluso: {
      professores: Number(plano.professores) || 0,
      alunos: Number(plano.alunos) || 0,
      consultas: Number(plano.consultas) || 0,
      aulas: Number(plano.aulas) || 0,
    },
    lotes: escolhidos,
    pacotes: aulasCompradas,
    baseCentavos: base,
    capacidadeCentavos: capacidade,
    descontoCentavos: 0,
    totalCentavos: total,
    base: precoEmTexto(plano.preco),
    capacidade: precoEmTexto(capacidade / 100),
    total: precoEmTexto(total / 100),
    // O que a escola FICA COM: o incluído mais o que comprou. As pessoas são REFERÊNCIA (ver a
    // `_nota` do catálogo): contam-se para a controladoria, não para um limite.
    capacidadeTotal: {
      professores: (Number(plano.professores) || 0)
        + escolhidos.professores.reduce((s, l) => s + Number(l.qtd), 0),
      alunos: (Number(plano.alunos) || 0)
        + escolhidos.alunos.reduce((s, l) => s + Number(l.qtd), 0),
      // A FRANQUIA — o número comercial. É este que a escola lê e que o excedente compara.
      aulas: (Number(plano.aulas) || 0)
        + aulasCompradas.reduce((s, x) => s + Number(x.aulas), 0),
    },
    extensoes: extensoesDoPlano(plano.id).map((e) => e.id),
    periodicidade: CATALOGO.periodicidade || 'mês',
  };
}

/**
 * A ESCOLHA DE PLANO QUE VEIO DA PÁGINA — validada, e não confiada.
 *
 * É a mesma disciplina do cadastro (`cadastro-da-escola.js`): a página propõe, o servidor decide.
 * Um plano que não está no catálogo é recusado agora, e não meses depois num ecrã que não sabe
 * lê-lo. O `dispensar` existe para UMA porta — a do proprietário: ela cria escolas de teste, e
 * obrigá-la a pagar a si mesma por cada ensaio fecharia a porta a quem mais usa o sistema.
 */
function validarEscolha(pedido, { podeDispensar = false } = {}) {
  const p = pedido || {};
  const pedido_ = String(p.plano || p.assinatura || '').trim().toLowerCase();
  /* O PLANO CONSULTORIA (25/11/2026) — a quarta porta da criação, e a única que não se vende.
   *
   * Ele não está na escada de assinaturas e não tem preço: é o ambiente da escola que ainda está em
   * consultoria. Por isso não passa pelo `calcular` — não há lotes nem pacotes a somar —, e tem um
   * caminho próprio que devolve a MESMA FORMA que os outros planos, para a criação não ter dois
   * códigos.
   *
   * SÓ A PORTA DO PROPRIETÁRIO O PODE CRIAR (`podeDispensar`). No público, um `plano: 'consultoria'`
   * seria uma escola grátis pedida pela própria escola: a recusa nomeia a saída em vez de um código.
   */
  if (pedido_ === 'consultoria' || pedido_ === 'demonstracao') {
    if (!podeDispensar) {
      return {
        ok: false,
        erro: 'o plano consultoria é criado pela administração do Sistema Lastro, e não pela página '
          + 'da escola. Escolha um dos planos para criar a sua.',
      };
    }
    const c = (CATALOGO && CATALOGO.consultoria) || {};
    return {
      ok: true,
      escolha: {
        plano: 'consultoria',
        planoNome: c.nome || 'Plano consultoria',
        lotesProfessores: [],
        lotesAlunos: [],
        pacotes: [],
        valorCentavos: 0,
        valor: '0,00',
        extensoes: [],
        /* A `capacidade` sai do LIMITE dos professores e das alunas, e não de uma referência: numa
         * consultoria os dois são paredes, e a página tem de mostrar o mesmo número que o motor
         * aplica. */
        capacidade: {
          professores: Number((c.limites && c.limites.professores) || 0),
          alunos: Number((c.limites && c.limites.alunas) || 0),
        },
        periodicidade: (c.duracaoMeses || 1) + ' mês',
        pagamento: 'dispensado-pelo-proprietario',
      },
      calculo: null,
      consultoria: true,
    };
  }
  const plano = assinaturaPorId(p.plano || p.assinatura);
  if (!plano) return { ok: false, erro: 'escolha o plano da escola' };
  const calculo = calcular({
    assinatura: plano.id,
    lotes: { professores: p.lotesProfessores || [], alunos: p.lotesAlunos || [] },
    /* OS PACOTES DE AULAS (17/11/2026) — a escolha que a página passou a poder fazer. Vêm como
     * ids, e o `calcular` recusa um que não exista. */
    pacotes: Array.isArray(p.pacotes) ? p.pacotes : [],
  });
  if (!calculo.ok) return calculo;
  const dispensado = Boolean(podeDispensar && p.dispensarPagamento);
  return {
    ok: true,
    escolha: {
      plano: plano.id,
      planoNome: plano.nome,
      lotesProfessores: calculo.lotes.professores.map((l) => l.qtd),
      lotesAlunos: calculo.lotes.alunos.map((l) => l.qtd),
      /* OS PACOTES GUARDADOS SÃO OS IDS — é o que o contrato precisa para reconstruir a franquia
       * sem repetir preços (o preço é do catálogo, e um preço copiado diverge no dia em que a
       * tabela muda). */
      pacotes: calculo.pacotes.map((x) => x.id),
      valorCentavos: calculo.totalCentavos,
      valor: calculo.total,
      extensoes: calculo.extensoes,
      capacidade: calculo.capacidadeTotal,
      periodicidade: calculo.periodicidade,
      pagamento: dispensado ? 'dispensado-pelo-proprietario' : 'pix-a-conciliar',
    },
    calculo,
  };
}

/* ── A FRANQUIA DE AULAS — a unidade comercial de 17/11/2026 ────────────────────────────────────
 *
 * «A unidade comercial dos planos passa a ser a AULA, expressa como franquia mensal de aulas. […]
 * uma aula registrada e processada consome uma unidade da franquia, tenha ela um aluno ou mil.»
 * (§ADITIVO COMERCIAL §1)
 *
 * O QUE ISTO SUBSTITUI. O eixo `professores × alunos` do §L9b/C23 cobrava a capacidade de PESSOAS, e
 * a trava do piso recusava cadastro acima do contratado. O §ADITIVO §2 corta as duas coisas: «não
 * exibir limites comerciais de professores e alunos na oferta. Não usar essas quantidades para
 * calcular a mensalidade nem para bloquear a escola». O que fica delas é a MEDIÇÃO — «não é correto
 * afirmar que fichas de alunos ou registros de professores não custam nada» —, e é por isso que
 * `professores`/`alunos` continuam no catálogo como referência e continuam a ser contados.
 *
 * E A FRANQUIA NÃO É UM TETO QUE BLOQUEIA. É um número que se compara com o que a escola processou:
 * dentro dele, está pago; acima, há excedente e o excedente paga-se. «Se ela der mais aulas do que o
 * que ela contratou, tem um excedente. Aí ela tem que pagar pelo excedente» — e por isso o estado
 * devolve o número, e não uma recusa.
 */

/** Os pacotes de aulas que o catálogo vende — o que se pode acrescentar à franquia. */
function pacotesDeAulas() {
  return PACOTES
    .filter((x) => x && Number(x.aulas) > 0)
    .map((x) => ({
      id: x.id,
      nome: x.nome,
      aulas: Number(x.aulas),
      preco: Number(x.preco),
      precoTexto: precoEmTexto(x.preco),
    }));
}

/** A franquia de um plano, em aulas. `0` quando o plano não existe — e a página diz «—». */
function franquiaDoPlano(id) {
  const plano = assinaturaPorId(id);
  if (!plano) return 0;
  return Number(plano.aulas) || 0;
}

/**
 * A FRANQUIA DE UM CONTRATO — o plano mais os pacotes que a escola comprou.
 *
 * `contrato` é o registo comercial (`bastidores/<escola>/comercial`), que guarda `plano` e, quando
 * os há, `pacotes`. Um contrato anterior a 17/11/2026 não tem `pacotes` e não tem `aulas` — e o que
 * ele tem é o que vale: a franquia sai do plano do catálogo, e os lotes antigos não a mudam, porque
 * um lote de gente nunca comprou aulas. Isto é uma leitura, e não uma migração: quem contratou antes
 * passa a ter a franquia do plano em que está, e é isso que o aditivo quer dizer com «a oferta é
 * expressa em franquia mensal».
 */
function franquiaDoContrato(contrato) {
  const c = contrato || {};
  const plano = c.plano || c.assinatura || null;
  if (!plano) return null;
  const base = franquiaDoPlano(plano);
  if (!base) return null;
  /* OS PACOTES GUARDADOS são ids (`['p','m']`); os registos mais antigos podem ter objectos. As
   * duas formas somam, e uma quantidade que não existe no catálogo vale zero em vez de rebentar —
   * um contrato não pode deixar de ser legível porque o catálogo mudou. */
  const guardados = Array.isArray(c.pacotes) ? c.pacotes : [];
  let extra = 0;
  const itens = [];
  for (const bruto of guardados) {
    if (bruto && typeof bruto === 'object') {
      const aulas = Number(bruto.aulas) || 0;
      extra += aulas;
      if (aulas) itens.push({ id: bruto.id || null, aulas, preco: Number(bruto.preco) || 0 });
      continue;
    }
    const achado = PACOTES.find((x) => String(x.id).toLowerCase() === String(bruto || '').trim().toLowerCase());
    if (achado) { extra += Number(achado.aulas); itens.push({ id: achado.id, aulas: Number(achado.aulas), preco: Number(achado.preco) }); }
  }
  return { plano, baseAulas: base, aulasExtras: extra, franquia: base + extra, pacotes: itens };
}

/**
 * A FRANQUIA CONTRA O CONSUMO — o número que a escola e o painel leem.
 *
 * `aulasUsadas` vem de FORA, e é o que mantém esta função pura (mede-se sem KV): quem conta as aulas
 * é a fonte do ciclo (`-dados.json` → `aulas`), e essa contagem tem um plano próprio
 * (PLANO-CONTADOR-DE-AULAS.md). Aqui só se compara.
 *
 * OS QUATRO ESTADOS, e o corte entre eles é declarado e não estético:
 *   · `folga`   — abaixo de 80% da franquia. Nada a dizer.
 *   · `perto`   — de 80% a 100%. O alarme serve para a escola decidir ANTES de passar.
 *   · `limite`  — exactamente a franquia. Ainda não há excedente.
 *   · `passou`  — acima. Há excedente, e o excedente paga-se.
 *
 * O `excedente` é o número que interessa quando `passou`, e é `0` nos outros três: uma escola dentro
 * da franquia não deve nada, e dizer-lhe «0 de excedente» é diferente de «não há excedente».
 */
function situacaoDaFranquia({ contrato, aulasUsadas } = {}) {
  const daFranquia = franquiaDoContrato(contrato);
  if (!daFranquia) return null;
  const franquia = daFranquia.franquia;
  /* SEM CONTAGEM NÃO SE INVENTA UM ZERO. `aulasUsadas` ausente (`null`/`undefined`) devolve
   * `usadas: null` e `estado: null` — o cartão mostra a franquia e cala o consumo. Zero seria uma
   * afirmação: diria que a escola não lançou nenhuma aula no mês, e sobre uma contagem que não se
   * fez isso é falso. É a mesma disciplina do `ancora: null` do envelope. */
  const semContagem = aulasUsadas === null || aulasUsadas === undefined || aulasUsadas === '';
  if (semContagem) {
    return {
      plano: daFranquia.plano,
      baseAulas: daFranquia.baseAulas,
      aulasExtras: daFranquia.aulasExtras,
      franquia,
      usadas: null,
      restantes: null,
      excedente: null,
      fraccao: null,
      percentagem: null,
      estado: null,
      frase: 'A franquia é de ' + franquia + ' aula(s) por mês. O consumo do mês ainda não é '
        + 'contado por este ecrã.',
      pacotes: daFranquia.pacotes,
    };
  }
  const usadas = Math.max(0, Math.round(Number(aulasUsadas) || 0));
  const fraccao = franquia > 0 ? usadas / franquia : 0;
  const excedente = Math.max(0, usadas - franquia);
  let estado = 'folga';
  if (usadas > franquia) estado = 'passou';
  else if (usadas === franquia && franquia > 0) estado = 'limite';
  else if (fraccao >= 0.8) estado = 'perto';
  const restantes = Math.max(0, franquia - usadas);
  const frases = {
    folga: 'Dentro da franquia: ' + restantes + ' aula(s) ainda disponíveis neste mês.',
    perto: 'A franquia está a chegar ao fim: ' + restantes + ' aula(s) disponíveis. Passando disso, '
      + 'há excedente.',
    limite: 'A franquia deste mês está exactamente usada. A próxima aula é excedente.',
    passou: 'A franquia deste mês foi ultrapassada em ' + excedente + ' aula(s) — as excedentes '
      + 'são cobradas além da mensalidade.',
  };
  return {
    plano: daFranquia.plano,
    baseAulas: daFranquia.baseAulas,
    aulasExtras: daFranquia.aulasExtras,
    franquia,
    usadas,
    restantes,
    excedente,
    fraccao: Math.round(fraccao * 1000) / 1000,
    percentagem: Math.round(fraccao * 100),
    estado,
    frase: frases[estado],
    pacotes: daFranquia.pacotes,
  };
}

/* ── O PISO E O TETO — «a partir de» e «até» (16/11/2026) ──────────────────────────────────────
 *
 * A PALAVRA «CAPACIDADE» DAVA A IDEIA ERRADA, e a correcção é dela: «Capacidade dá ideia de teto,
 * então dá ideia de que tem só nove professores e 120 alunos. O nosso não é capacidade, o nosso é a
 * partir de.» O número do plano não é um máximo que a escola tem — é o **piso** que ela contratou,
 * e é a garantia de que, quando a gente particiona, aquela escola tem espaço para operar.
 *
 * E o teto é outra coisa, e ela também o nomeou: «ela tem um teto […] Qual é o teto de quem contrata
 * o plano intermediário? É o base do plano avançado menos um.» Ou seja:
 *
 *   · **piso** = o que a escola comprou (o plano + os lotes). É a trava do cadastro (§L9b): acima
 *     disto, cadastrar professor ou aluna é recusado com as duas saídas — comprar um lote ou subir
 *     de plano.
 *   · **teto** = até onde o plano dela vai. Acima disto não é questão de preço: é subir de degrau,
 *     ou falar com a proprietária (a decisão de 15/11/2026: «acima, vende-se por conversa»).
 *
 * O TETO DOS DEGRAUS DE BAIXO É DERIVADO, e não copiado: o do Básico é o piso do Intermediário
 * menos um (2 professores e 39 alunas), o do Intermediário é o do Avançado menos um (5 e 89). Só o
 * Avançado declara um número, porque não tem degrau acima — e esse número vem da conta da
 * infraestrutura (§L9c do PLANEJAMENTO), não do gosto.
 *
 * O TETO NUNCA FICA ABAIXO DO PISO. Quem compra um lote no Básico leva o piso a 4 professores, e um
 * teto de 2 punha a própria escola fora do teto ao comprar — o adicional viraria uma armadilha. O
 * teto sobe então até ao piso, e não além: para crescer, o caminho é o degrau de cima.
 */

/** O piso que um plano dá — o que ele inclui. Ausente no catálogo → zero, e a página diz «—». */
function pisoDoPlano(id) {
  const plano = assinaturaPorId(id);
  if (!plano) return { professores: 0, alunos: 0 };
  return { professores: Number(plano.professores) || 0, alunos: Number(plano.alunos) || 0 };
}

/** O degrau acima na escada — a ordem é a do catálogo, que é a ordem de preço. */
function planoAcima(id) {
  const i = ASSINATURAS.findIndex((a) => a && String(a.id).toLowerCase() === String(id || '').trim().toLowerCase());
  if (i === -1 || i + 1 >= ASSINATURAS.length) return null;
  return ASSINATURAS[i + 1];
}

/**
 * O teto de um plano: o piso do degrau de cima menos um; no topo da escada, o número declarado.
 * Devolve `null` quando o plano não existe — e a página diz «—» em vez de inventar um limite.
 */
function tetoDoPlano(id) {
  if (!assinaturaPorId(id)) return null;
  const acima = planoAcima(id);
  if (acima) {
    const piso = pisoDoPlano(acima.id);
    return { professores: Math.max(0, piso.professores - 1), alunos: Math.max(0, piso.alunos - 1) };
  }
  const declarado = CATALOGO.teto || {};
  /* O TOPO DA ESCADA não tem degrau acima, e a referência de tamanho que ele declara é
   * `professoresReferencia`/`alunosReferencia` — os nomes antigos (`professores`/`alunos`) ficaram
   * como apelido porque um registo de catálogo lido por um isolate antigo não pode passar a dizer
   * zero. Ver a `_nota` do `teto` no catálogo. */
  return {
    professores: Number(declarado.professoresReferencia != null ? declarado.professoresReferencia : declarado.professores) || 0,
    alunos: Number(declarado.alunosReferencia != null ? declarado.alunosReferencia : declarado.alunos) || 0,
  };
}

/** Quanto os lotes acrescentam ao piso — `lotes` é a lista de quantidades já escolhidas. */
function acrescimoDosLotes(lotes) {
  const somar = (eixo) => (Array.isArray(lotes && lotes[eixo]) ? lotes[eixo] : [])
    .reduce((s, q) => s + (Number(q) || 0), 0);
  return { professores: somar('professores'), alunos: somar('alunos') };
}

/**
 * O PISO E O TETO DE UM CONTRATO — o par que a escola lê como «a partir de … até …».
 *
 * `contrato` pode ser o registo comercial inteiro (com `plano` e `capacidade`) ou só a escolha
 * (`{plano, lotes}`): a página às vezes tem um, às vezes tem o outro, e uma segunda função para
 * cada forma daria duas respostas à mesma pergunta.
 */
function limitesDoContrato(contrato) {
  const c = contrato || {};
  const plano = c.plano || c.assinatura || null;
  if (!plano) return null;
  const base = pisoDoPlano(plano);
  const tetoDoPlanoDela = tetoDoPlano(plano);
  if (!tetoDoPlanoDela) return null;
  /* O PISO VEM DO CONTRATO QUANDO ELE O TEM. O registo comercial guarda `capacidade` — o total que
   * a escola contratou —, e é ele que manda; os lotes são o caminho para o reconstruir quando o
   * registo é antigo e não os tem. */
  const guardado = c.capacidade || null;
  const acrescimo = acrescimoDosLotes(c.lotes || c);
  const piso = {
    professores: guardado && guardado.professores != null
      ? Number(guardado.professores) || 0 : base.professores + acrescimo.professores,
    alunos: guardado && guardado.alunos != null
      ? Number(guardado.alunos) || 0 : base.alunos + acrescimo.alunos,
  };
  const teto = {
    professores: Math.max(tetoDoPlanoDela.professores, piso.professores),
    alunos: Math.max(tetoDoPlanoDela.alunos, piso.alunos),
  };
  const inclui = teto.professores > piso.professores || teto.alunos > piso.alunos;
  return { plano, piso, teto, planoInclui: base, inclui };
}

/* ── A TRAVA DO PISO — «a partir de», e o que acontece quando o cadastro chega lá ─────────────
 *
 * O PISO NÃO É UM NÚMERO DE ECRÃ: é a linha acima da qual o cadastro deixa de ser aceite sozinho.
 * «Numa escola no teto, cadastrar mais um professor ou aluna é recusado com a mensagem que nomeia
 * as DUAS saídas: acrescentar um lote ou subir de assinatura» (§L9b, critério vi).
 *
 * E A RECUSA NÃO DIZ «o Básico não permite 2 professores». Essa frase esconde que o bloqueio é
 * reversível, e a própria frente diz porquê: «mensagens diferentes para o mesmo bloqueio escondem
 * que a primeira é reversível». A frase diz o que está cheio, quanto, e as duas saídas.
 *
 * O QUE ESTA FUNÇÃO **NÃO** FAZ — e é de propósito:
 *   · não recusa quando não há contrato. Uma escola anterior à camada comercial não prometeu piso
 *     nenhum; travar-lhe o cadastro seria inventar um limite que ninguém contratou.
 *   · não conta o que já saiu. Um professor desligado permanece no registo (é proveniência), mas
 *     não ocupa lugar no piso; quem conta é quem está a trabalhar. Quem soma os números é a rota —
 *     esta função recebe o número pronto, e é pura para poder ser medida sem um KV.
 *   · não limita LEITURA nem escrita do que já existe. O piso limita o **cadastro**, e mais nada:
 *     uma escola acima do piso continua a ler, a exportar e a registar as aulas das turmas que já
 *     tem — a alternativa seria punir o dado da escola por causa de um contrato.
 */

/** Os rótulos dos dois eixos. Uma vez, para a recusa e a tela dizerem a mesma palavra. */
const ROTULOS_DOS_EIXOS = { professores: 'professor(es)', alunos: 'aluna(s)' };

/**
 * O que o próximo passo custa e liberta — o que a recusa oferece, com números e não com adjectivos.
 * `null` quando não há lote que resolva (já no teto) ou quando o catálogo não tem lotes do eixo.
 */
function proximoLote(eixo) {
  const lotes = lotesDe(eixo);
  if (!lotes.length) return null;
  /* O lote MAIS PEQUENO resolve o primeiro lugar, e é o mais barato: oferecer o maior primeiro é
   * vender o que não foi pedido. */
  const menor = lotes.slice().sort((a, b) => Number(a.qtd) - Number(b.qtd))[0];
  return { qtd: Number(menor.qtd) || 0, preco: Number(menor.preco) || 0, precoTexto: precoEmTexto(menor.preco) };
}

/**
 * O CADASTRO DE PESSOAS DEIXOU DE SER TRAVADO (17/11/2026) — e a decisão é do §ADITIVO, não minha.
 *
 * «Não exibir limites comerciais de professores e alunos na oferta. Não usar essas quantidades para
 * calcular a mensalidade nem para BLOQUEAR a escola por ter mais pessoas cadastradas.» (¶2)
 *
 * O QUE ISTO SUBSTITUI. Até hoje esta função recusava o cadastro acima do piso contratado, com as
 * duas saídas («acrescente um lote» ou «suba de plano»). Com a unidade comercial na AULA, o piso de
 * gente deixou de ser uma promessa: uma escola com 30 professoras e 800 alunos que processe 40 aulas
 * por mês está DENTRO do que contratou, e travá-la por causa das fichas seria cobrar-lhe um eixo que
 * o aditivo retirou. A franquia de aulas é que mede o consumo, e ela não bloqueia — ela devolve um
 * excedente que se paga.
 *
 * O QUE FICA, E PORQUÊ. A contagem fica: «não é correto afirmar que fichas de alunos ou registros de
 * professores não custam nada» — o cadastro consome KV, índice e workflow, e a controladoria precisa
 * do número para decidir migração. O que muda é o uso: em vez de recusar, a função **informa**.
 *
 * `cabe` continua a existir e é **sempre `true`**. Mantê-lo não é preciosismo: as duas rotas que
 * chamam esta função (`bastidores.js`, no cadastro de professor e de aluna) perguntam `if
 * (!trava.cabe)`, e uma função que deixasse de devolver o campo faria as duas recusarem por
 * `undefined` — o defeito silencioso exacto que se quer evitar. Quem quiser o aviso lê `aviso`;
 * quem só quer saber se pode seguir lê `cabe`, e pode.
 */
function travaDoPiso({ contrato, eixo, cadastrados } = {}) {
  const nome = String(eixo || '');
  if (nome !== 'professores' && nome !== 'alunos') return { cabe: true, motivo: 'eixo desconhecido' };

  const tem = Math.max(0, Math.round(Number(cadastrados) || 0));
  const referencia = referenciaDoPlano(contrato, nome);
  const base = { eixo: nome, cadastrados: tem, referencia };
  /* `aviso: null` EXPLÍCITO nos dois caminhos de saída. Um consumidor que leia `trava.aviso` e
   * receba `undefined` faz o mesmo que com `null` — mas um que TESTE `'aviso' in trava` não, e é
   * essa a diferença entre «não há aviso» e «esta função não sabe dizer». */
  if (!referencia) return Object.assign({ cabe: true, aviso: null, motivo: 'sem contrato — nada a informar' }, base);

  /* O AVISO EXISTE PARA A CONTROLADORIA, NÃO PARA A ESCOLA. Uma escola com mais gente do que o
   * degrau esperava é um dado: pode ser crescimento (e aí o degrau é que está desajustado), pode ser
   * cadastro a mais de quem não usa. Nenhuma das duas se resolve a recusar o cadastro. */
  const acima = tem > referencia;
  return Object.assign({
    cabe: true,
    acimaDaReferencia: acima,
    aviso: acima
      ? 'Esta escola tem ' + tem + ' ' + ROTULOS_DOS_EIXOS[nome] + ' e o degrau dela esperava cerca de '
        + referencia + '. Não há bloqueio: a franquia que se cobra é de AULAS. O número fica medido '
        + 'para a controladoria.'
      : null,
  }, base);
}

/**
 * A REFERÊNCIA DE TAMANHO de um plano, para um eixo — o que o degrau esperava servir.
 *
 * Não é um piso nem um teto: é a expectativa, e o §ADITIVO §2 chama-lhe «custo interno». Devolve
 * `null` quando não há contrato, para a função acima poder calar-se em vez de inventar um número.
 */
function referenciaDoPlano(contrato, eixo) {
  const c = contrato || {};
  const plano = c.plano || c.assinatura || null;
  if (!plano) return null;
  const p = pisoDoPlano(plano);
  const n = Number(p[eixo]) || 0;
  return n > 0 ? n : null;
}

/** O catálogo como a página o recebe: sem os campos internos de nota. */
/**
 * O PLANO CONSULTORIA COMO A PÁGINA DO LINK O MOSTRA (25/11/2026 — F3).
 *
 * PORQUE É UM ACESSO PRÓPRIO, E NÃO UM CAMPO A MAIS NO `catalogoDaPagina`. Aquele objecto é servido à
 * PÁGINA PÚBLICA, e pôr lá a consultoria seria oferecê-la a quem a não pode pedir — a recusa do
 * `validarEscolha` continuaria a valer, mas a página passaria a mostrar um plano que ela recusa, e um
 * plano que se vê e não se pode ter é pior do que um plano que não se vê.
 *
 * A página do link precisa dos LIMITES e não do preço: é o que a escola está a aceitar, e ela tem de
 * os ler antes de criar. Os números vêm do catálogo, e não de uma cópia — uma página que os
 * escrevesse à mão passaria a mentir no dia em que o catálogo mudasse, e a mentira só apareceria na
 * primeira recusa.
 */
function consultoriaDaPagina() {
  const c = (CATALOGO && CATALOGO.consultoria) || {};
  const lim = c.limites || {};
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  return {
    id: 'consultoria',
    nome: c.nome || 'Plano consultoria',
    duracaoMeses: n(c.duracaoMeses) === null ? 1 : n(c.duracaoMeses),
    limites: {
      professores: n(lim.professores), alunas: n(lim.alunas), ciclos: n(lim.ciclos),
      modalidades: n(lim.modalidades), aulas: n(lim.aulas), salas: n(lim.salas), turmas: n(lim.turmas),
    },
  };
}

function catalogoDaPagina() {
  return {
    moeda: CATALOGO.moeda,
    moeda_simbolo: CATALOGO.moeda_simbolo,
    periodicidade: CATALOGO.periodicidade,
    // A UNIDADE COMERCIAL, dita uma vez para a página poder escrevê-la sem a inferir.
    unidade: 'aula',
    assinaturas: ASSINATURAS.map((a) => ({
      id: a.id, nome: a.nome, preco: a.preco, precoTexto: precoEmTexto(a.preco),
      // A FRANQUIA é o que se mostra. `professores`/`alunos` vão no `referencia`, para a
      // controladoria, e a página não os apresenta como limite (o §ADITIVO §2 proíbe).
      aulas: Number(a.aulas) || 0,
      referencia: { professores: Number(a.professores) || 0, alunos: Number(a.alunos) || 0 },
      consultas: a.consultas,
      piso: pisoDoPlano(a.id), teto: tetoDoPlano(a.id),
      resumo: a.resumo, inclui: a.inclui || [],
    })),
    // Os lotes ficam no catálogo como LEGADO DE LEITURA (ver a `_nota` no JSON): nada novo os
    // vende, mas um contrato antigo continua a poder ser lido e mostrado.
    lotes: { professores: lotesDe('professores'), alunos: lotesDe('alunos') },
    pacotesDeAulas: pacotesDeAulas(),
    extensoes: EXTENSOES.map((e) => ({
      id: e.id, nome: e.nome, descricao: e.descricao, em: e.em, preco: e.preco,
    })),
  };
}

/* ── O ESTADO COMERCIAL, QUE É OUTRA COISA DA TABELA DE PREÇOS ────────────────────────────────
 *
 * «Suspensa» e «aguardando» NÃO são preço: são o estado de uma escola no tempo. Vivem na mesma
 * chave que a raiz escreve (`bastidores/<escola>/comercial`, ver `raiz.js`), e é UM lugar só
 * porque a pergunta «esta escola pode escrever?» é feita em dois sítios — a porta que recusa o
 * pedido (`producao.js`) e a rota que valida a senha do professor (`bastidores.js`).
 *
 * PORQUE É QUE ISTO MUDOU DE CASA (16/11/2026). A leitura estava só em `producao.js`, e a rota da
 * senha, que vive em `bastidores.js`, não a alcançava sem um `require` circular. Ficou a alcançar
 * nada — e a tela do professor ganhou um veredicto `suspensa` que lia `r.dados.suspensa` de uma
 * resposta que NUNCA o trazia. O quarto veredicto era código morto: a tela continuava a dizer
 * «a senha do professor não foi reconhecida» sobre uma senha certa. O defeito não estava na
 * tela — estava em a resposta do servidor não ter o facto.
 */

/** O estado de uma escola que ainda não tem registo. Um estado novo não se impõe ao passado. */
const ESTADO_PADRAO = 'ativa';
const ESTADOS = ['aguardando', 'ativa', 'suspensa'];

/* O ESTADO EFECTIVO (25/11/2026) — `expirada` NÃO SE GUARDA, CALCULA-SE.
 *
 * «Ele fica desabilitado automaticamente depois desse prazo de um mês.» O estado guardado continua a
 * ser o que sempre foi (`aguardando` · `ativa` · `suspensa`); `expirada` é o JUÍZO de um instante, e
 * o resultado de uma comparação — nunca um cron que escreve.
 *
 * PORQUE CALCULADO E NÃO UM CRON. Um agendador que escrevesse `suspensa` no vencimento dependeria de
 * um relógio que o produto não tem, correria no fuso errado, e escreveria o estado ANTES de alguém o
 * ler — tornando o congelamento um facto consumado em vez de uma leitura. O cálculo no pedido é
 * idempotente, não precisa de agendador, e chega a todos os leitores ao mesmo tempo. É a mesma
 * disciplina do `estadoDaAula`: o estado é o juízo de um instante, e quem tem um `agora` é quem o
 * calcula.
 *
 * PORQUE O ESTADO GUARDADO FICA `ativa` — e isto não é descuido, é o que faz o D3 funcionar:
 * `estadoDoExpurgo` só aceita apagar uma escola `suspensa` com `desabilitadaEm` e carência vencida.
 * Uma `expirada` guardada como `ativa` NÃO é apagável automaticamente. O fim de uma demonstração
 * não é dívida (L12), e tratá-lo pela régua da inadimplência bloquearia quem nunca deveu nada. */
const ESTADOS_EFETIVOS = ['aguardando', 'ativa', 'suspensa', 'expirada'];

/** A frase da recusa do `suspensa`. UMA, escrita uma vez, para os dois lados dizerem a mesma coisa. */
const MENSAGEM_DA_SUSPENSAO = 'O acesso desta escola está suspenso: é possível ler o que já foi '
  + 'criado, mas não criar nem editar. Fale com o Sistema Lastro para regularizar.';

/* A FRASE DA EXPIRADA É OUTRA, e a diferença é de facto, não de estilo: uma escola que parou de
 * pagar não é a mesma coisa que uma demonstração que chegou ao fim. A do `suspensa` manda
 * «regularizar» e fala de pagamento em atraso; esta diz o que ACONTECEU — quando terminou — e qual
 * é a saída. Duas frases porque são dois factos (L12: «o fim do período gratuito não é dívida»). */
const MENSAGEM_DA_EXPIRADA = 'O período de demonstração terminou. O que está criado continua '
  + 'legível; para continuar a criar, contrate um plano.';

/**
 * O estado comercial, do KV da escola. Ausente ou ilegível → `ativa` (ver `ESTADO_PADRAO`).
 *
 * O CACHE É POR PEDIDO, e não de isolate: o estado muda por um clique dela, e um valor guardado
 * entre pedidos faria a escola continuar aberta depois de suspensa — ou fechada depois de
 * habilitada — até o isolate morrer. Uma leitura de KV por pedido é o preço de um estado que
 * muda fora do sistema.
 */
async function lerComercial(kv, escola) {
  const nome = String(escola || '').trim();
  if (!kv || typeof kv.get !== 'function' || !nome) return null;
  const texto = await kv.get('bastidores/' + nome + '/comercial');
  if (!texto) return { estado: ESTADO_PADRAO, motivo: 'sem registo comercial' };
  let registo = null;
  try { registo = JSON.parse(texto); } catch (erro) { return { estado: ESTADO_PADRAO, motivo: 'registo ilegível' }; }
  const estado = ESTADOS.indexOf(String((registo && registo.estado) || '')) !== -1
    ? String(registo.estado) : ESTADO_PADRAO;
  return Object.assign({}, registo, { estado });
}

/**
 * O CONTRATO É DE UM PLANO PAGO? A pergunta que decide se o congelamento ainda se aplica.
 *
 * «Aí se a escola pagar, ela contratar, aí eu clico em habilitar e a escola fica livre dentro
 * daquele plano.» Pagar é o que LEVANTA o congelamento; «Habilitar» sozinho, não — e é por isso que
 * esta função existe separada do estado.
 *
 * Um plano é pago quando o seu id está na escada de assinaturas do catálogo. O `consultoria` não
 * está, e a comparação é com o catálogo e não com uma lista escrita aqui: uma segunda lista de
 * planos pagos envelheceria no dia em que a escada mudasse.
 */
function planoPago(plano) {
  const id = String(plano == null ? '' : plano).trim().toLowerCase();
  if (!id) return false;
  return Boolean(assinaturaPorId(id));
}

/**
 * O PERÍODO DA CONSULTORIA — o que foi entregue, e até quando.
 *
 * Devolve `null` quando não há período: uma escola que nunca foi entregue não tem prazo a correr.
 * Nota que ela TEM limites desde a criação (o teto total, sem loophole) — o que não tem é relógio.
 */
function periodoDaConsultoria(contrato) {
  const c = contrato || {};
  const p = c.periodoDeConsultoria;
  if (!p || typeof p !== 'object') return null;
  const entregueEm = String(p.entregueEm || '').trim() || null;
  const terminaEm = String(p.terminaEm || '').trim() || null;
  if (!entregueEm && !terminaEm) return null;
  return {
    entregueEm,
    terminaEm,
    convertidaEm: String(p.convertidaEm || '').trim() || null,
    /* UMA PRORROGAÇÃO É UM FACTO DECLARADO (25/11/2026). «Se a escola que está em teste disser para
     * mim: me dá mais um mês de teste, eu dou mais um mês de teste.» Ela existe, mas não é um botão
     * de renovação: é um elo no histórico, com motivo e data, e o número de prorrogações fica à
     * vista — «não se renova» continua verdadeiro, e uma excepção tem dono. */
    prorrogacoes: Array.isArray(p.prorrogacoes) ? p.prorrogacoes.slice() : [],
  };
}

/**
 * O ESTADO EFECTIVO — o que a escola PODE FAZER agora, e não só o que está gravado.
 *
 * A ordem das perguntas é a ordem das consequências, e cada degrau vence o seguinte:
 *
 *   1. `suspensa` guardada → `suspensa`. Uma escola suspensa por ela não é uma demonstração: o
 *      primeiro facto manda, e é o que inicia a carência do expurgo.
 *   2. `aguardando` guardada → `aguardando`. Ninguém conciliou o pagamento; não há o que ler.
 *   3. plano PAGO → `ativa`. O contrato levanta o congelamento, e o período fica como história.
 *   4. há período e o prazo passou → `expirada`.
 *   5. caso contrário → `ativa`.
 *
 * O degrau 3 vem antes do 4 de propósito: é a garantia de que «Habilitar» sozinho não é uma porta
 * de fuga — se ela clicar sem contrato pago, o efectivo continua `expirada` e a escola abre em
 * só-leitura. A única porta é o contrato.
 */
function estadoEfetivo({ contrato, agora } = {}) {
  const c = contrato || {};
  const guardado = ESTADOS.indexOf(String(c.estado || '')) !== -1 ? String(c.estado) : ESTADO_PADRAO;
  if (!c || !Object.keys(c).length) return guardado;
  if (guardado === 'suspensa' || guardado === 'aguardando') return guardado;
  if (planoPago(c.plano || c.assinatura)) return 'ativa';
  const periodo = periodoDaConsultoria(c);
  if (!periodo || !periodo.terminaEm) return guardado;
  const fim = Date.parse(periodo.terminaEm);
  const hoje = agora ? Date.parse(String(agora)) : Date.now();
  if (Number.isNaN(fim) || Number.isNaN(hoje)) return guardado;
  return hoje > fim ? 'expirada' : guardado;
}

/** O mesmo, a partir do `env` de uma escola (o `ESCOLA_SLUG` diz de quem é o registo). */
async function comercialDaEscola(env) {
  return lerComercial(env && env.PADD_KV, env && env.ESCOLA_SLUG);
}

module.exports = {
  centavos,
  reais,
  precoEmTexto,
  ESTADO_PADRAO,
  ESTADOS,
  MENSAGEM_DA_SUSPENSAO,
  MENSAGEM_DA_EXPIRADA,
  ESTADOS_EFETIVOS,
  planoPago,
  periodoDaConsultoria,
  estadoEfetivo,
  lerComercial,
  comercialDaEscola,
  assinaturaPorId,
  extensoesDoPlano,
  lotesDe,
  pacotesDeAulas,
  consultoriaDaPagina,
  franquiaDoPlano,
  franquiaDoContrato,
  situacaoDaFranquia,
  referenciaDoPlano,
  pisoDoPlano,
  tetoDoPlano,
  limitesDoContrato,
  travaDoPiso,
  ROTULOS_DOS_EIXOS,
  calcular,
  validarEscolha,
  catalogoDaPagina,
  ASSINATURAS,
  EXTENSOES,
  PACOTES,
};
