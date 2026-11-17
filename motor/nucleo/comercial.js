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
function calcular({ assinatura, lotes } = {}) {
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
    },
    lotes: escolhidos,
    baseCentavos: base,
    capacidadeCentavos: capacidade,
    descontoCentavos: 0,
    totalCentavos: total,
    base: precoEmTexto(plano.preco),
    capacidade: precoEmTexto(capacidade / 100),
    total: precoEmTexto(total / 100),
    // O que a escola FICA COM: o incluído mais o que comprou por lote.
    capacidadeTotal: {
      professores: (Number(plano.professores) || 0)
        + escolhidos.professores.reduce((s, l) => s + Number(l.qtd), 0),
      alunos: (Number(plano.alunos) || 0)
        + escolhidos.alunos.reduce((s, l) => s + Number(l.qtd), 0),
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
  const plano = assinaturaPorId(p.plano || p.assinatura);
  if (!plano) return { ok: false, erro: 'escolha o plano da escola' };
  const calculo = calcular({
    assinatura: plano.id,
    lotes: { professores: p.lotesProfessores || [], alunos: p.lotesAlunos || [] },
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
  return { professores: Number(declarado.professores) || 0, alunos: Number(declarado.alunos) || 0 };
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
 * A DECISÃO. `cabe: true` quando o cadastro pode seguir; `cabe: false` com a frase pronta quando
 * não pode.
 *
 * Devolve também os números que a página usa para explicar o estado (o piso, o teto, quantos há),
 * e `via` — qual das duas saídas resolve: `lote`, `plano` (os dois), ou `conversa` (já no teto do
 * último degrau, e aí o caminho é falar com a proprietária — a decisão de 15/11/2026).
 */
function travaDoPiso({ contrato, eixo, cadastrados } = {}) {
  const nome = String(eixo || '');
  if (nome !== 'professores' && nome !== 'alunos') return { cabe: true, motivo: 'eixo desconhecido' };
  const limites = limitesDoContrato(contrato);
  if (!limites) return { cabe: true, motivo: 'sem contrato — não há piso contratado' };

  const piso = Number(limites.piso[nome]) || 0;
  const teto = Number(limites.teto[nome]) || 0;
  const tem = Math.max(0, Math.round(Number(cadastrados) || 0));
  const rotulo = ROTULOS_DOS_EIXOS[nome];
  const base = { eixo: nome, piso, teto, cadastrados: tem, plano: limites.plano };

  if (tem < piso) return Object.assign({ cabe: true }, base);

  /* DOIS BLOQUEIOS DIFERENTES, E DUAS RESPOSTAS DIFERENTES — e confundi-los foi o defeito da
   * primeira escrita desta função. O piso cheio e o TETO cheio não são a mesma coisa:
   *
   *   · **piso cheio, teto à vista** (`piso <= tem < teto`): há espaço no plano dela, e o que falta
   *     é contratar. Um lote resolve, e subir de plano também — as duas saídas.
   *   · **teto cheio** (`tem >= teto`): um lote NÃO resolve, porque o plano não vai além do teto.
   *     Ou se sobe de degrau, ou — no último degrau — se fala com a proprietária e o preço é
   *     refeito (a decisão de 15/11/2026).
   *
   * Oferecer «acrescente um lote» a quem está no teto seria vender o que não resolve o problema. */
  const acima = planoAcima(limites.plano);
  const noTeto = tem >= teto;
  const ultimoDegrau = acima === null;
  /* O lote só se oferece quando ele RESOLVE: dentro do teto do plano, comprar abre lugar; no teto,
   * não abre nada, porque o plano não vai além dele. */
  const lote = noTeto ? null : proximoLote(nome);
  /* O que o plano de cima inclui, quando há plano de cima. */
  const ganho = acima ? pisoDoPlano(acima.id)[nome] : 0;
  const via = noTeto
    ? (ultimoDegrau ? 'conversa' : 'plano')
    : (lote ? (ultimoDegrau ? 'lote' : 'lote-ou-plano') : (ultimoDegrau ? 'conversa' : 'plano'));

  let erro = 'O piso contratado está cheio: esta escola contratou a partir de ' + piso + ' ' + rotulo
    + ' e já tem ' + tem + '. ';
  if (via === 'conversa') {
    erro += 'O teto deste plano é ' + teto + ' ' + rotulo + ' e não há degrau acima — para ir '
      + 'além, fale com o Sistema Lastro: o preço é refeito para o caso da escola.';
  } else if (via === 'plano') {
    erro += 'O teto deste plano é ' + teto + ' ' + rotulo + ': acrescentar um lote não abre mais '
      + 'lugar, porque o plano não vai além disso. Para cadastrar mais, é subir de plano — o plano '
      + 'de cima inclui ' + ganho + '. Fale com o Sistema Lastro.';
  } else if (via === 'lote') {
    erro += 'Há lugar no plano até ' + teto + ' ' + rotulo + ': acrescente um lote de ' + lote.qtd
      + ' ' + rotulo + ' (' + lote.precoTexto + ', na mensalidade), no painel Financeiro do '
      + 'Sistema Lastro.';
  } else {
    erro += 'Há duas saídas: acrescentar um lote de ' + lote.qtd + ' ' + rotulo + ' ('
      + lote.precoTexto + ', na mensalidade) ou subir de plano — o plano de cima inclui ' + ganho
      + '. Os dois se pedem no painel Financeiro do Sistema Lastro.';
  }

  return Object.assign({ cabe: false, erro, via, lote, planoAcima: acima ? acima.id : null,
    tetoCheio: noTeto, saidas: via === 'lote-ou-plano' ? ['lote', 'plano']
      : (via === 'plano' ? ['plano'] : (via === 'lote' ? ['lote'] : ['conversa'])) }, base);
}

/**
 * O MEDIDOR — «4 de 9», ao lado do formulário (16/11/2026).
 *
 * A TRAVA SEM AVISO É UMA ARMADILHA. Recusar o cadastro é a metade do trabalho; a outra é dizer,
 * ANTES do clique, quantos lugares restam. Sem isto a direção descobre o piso ao ser recusada — e
 * um limite que só se conhece pelo erro é um limite que parece um defeito.
 *
 * O QUE ELE DIZ, e porque é assim: o número grande é a contagem CONTRA O PISO («4 de 9»), porque é
 * o piso que trava o cadastro; o teto aparece ao lado, e menor, porque é a resposta à pergunta
 * seguinte («e se eu quiser mais?»). A palavra é «piso», e não «capacidade» — a correcção é dela:
 * «capacidade dá ideia de teto, então dá ideia de que tem só nove professores e 120 alunos».
 *
 * A FRASE DA RECUSA É A MESMA OBJECTO. Quando o piso está cheio, o medidor devolve também o
 * `recusa` de `travaDoPiso` — a página escreve-a, e o servidor recusa com ela: uma função, duas
 * bocas, e nenhuma possibilidade de a tela prometer o que o motor não faz.
 */
function medidorDoPiso({ contrato, eixo, cadastrados } = {}) {
  const nome = String(eixo || '');
  if (nome !== 'professores' && nome !== 'alunos') return null;
  const limites = limitesDoContrato(contrato);
  if (!limites) return null;

  const piso = Number(limites.piso[nome]) || 0;
  const teto = Number(limites.teto[nome]) || 0;
  const tem = Math.max(0, Math.round(Number(cadastrados) || 0));
  const cheio = tem >= piso;
  const noTeto = tem >= teto;
  const restantes = Math.max(0, piso - tem);
  const trava = travaDoPiso({ contrato, eixo: nome, cadastrados: tem });

  return {
    eixo: nome,
    tem, piso, teto, cheio, noTeto, restantes,
    contagem: tem + ' de ' + piso,
    rotulo: ROTULOS_DOS_EIXOS[nome],
    /* O PLURAL É PARA O MEDIDOR, e não é preciosismo: «Professor(es): 2 de 9» lê-se mal, e o
     * parêntese é a marca de um texto que não decidiu. Na fileira de factos cabe o plural. */
    rotuloPlural: nome === 'professores' ? 'Professores' : 'Alunas',
    /* O selo diz o ESTADO, não a contagem: a contagem já está ao lado, e repeti-la num selo é
     * dizer duas vezes a mesma coisa em duas tipografias. */
    selo: cheio ? 'falha' : 'discreto',
    seloTexto: cheio
      ? (noTeto ? 'no teto do plano' : 'piso cheio')
      : (restantes === 1 ? '1 lugar' : restantes + ' lugares'),
    /* A RECUSA SÓ QUANDO HÁ RECUSA. Um aviso preventivo numa escola com lugar é ruído, e o ruído
     * ensina a ignorar o aviso. */
    recusa: cheio ? trava.erro : null,
    via: cheio ? trava.via : null,
    plano: limites.plano,
  };
}

/** O catálogo como a página o recebe: sem os campos internos de nota. */
function catalogoDaPagina() {
  return {
    moeda: CATALOGO.moeda,
    moeda_simbolo: CATALOGO.moeda_simbolo,
    periodicidade: CATALOGO.periodicidade,
    assinaturas: ASSINATURAS.map((a) => ({
      id: a.id, nome: a.nome, preco: a.preco, precoTexto: precoEmTexto(a.preco),
      professores: a.professores, alunos: a.alunos, consultas: a.consultas,
      piso: pisoDoPlano(a.id), teto: tetoDoPlano(a.id),
      resumo: a.resumo, inclui: a.inclui || [],
    })),
    lotes: { professores: lotesDe('professores'), alunos: lotesDe('alunos') },
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

/** A frase da recusa. UMA, escrita uma vez, para os dois lados dizerem a mesma coisa. */
const MENSAGEM_DA_SUSPENSAO = 'O acesso desta escola está suspenso: é possível ler o que já foi '
  + 'criado, mas não criar nem editar. Fale com o Sistema Lastro para regularizar.';

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
  lerComercial,
  comercialDaEscola,
  assinaturaPorId,
  extensoesDoPlano,
  lotesDe,
  pisoDoPlano,
  tetoDoPlano,
  limitesDoContrato,
  travaDoPiso,
  medidorDoPiso,
  ROTULOS_DOS_EIXOS,
  calcular,
  validarEscolha,
  catalogoDaPagina,
  ASSINATURAS,
  EXTENSOES,
};
