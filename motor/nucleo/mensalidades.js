/**
 * mensalidades.js — O EXTRATO MENSAL DE CADA ESCOLA (16/11/2026).
 *
 * O QUE ELA PEDIU: «eu preciso ter também uma forma de acompanhar mês a mês o pagamento de cada
 * escola, como se fosse um extrato, e com um botão que indica se foi pago. Quando eu clicar ali que
 * foi pago aquele mês, então vai ter ali também a data do pagamento, o plano que a escola
 * contratou.» E, do lado da escola: «se ela estiver inadimplente ou se chegar a data do vencimento
 * e ela quiser pagar, ela pode clicar […] ali vai aparecer então a chave Pix.»
 *
 * O QUE ESTE MÓDULO É, e o que ele NÃO é. É o LIVRO: uma lista de competências pagas, uma por
 * escola e por mês, com o valor que foi cobrado naquele mês e o plano que estava em vigor. Não é
 * um sistema de cobrança — não emite boleto, não fala com banco, não lembra ninguém. A conciliação
 * é manual, por decisão dela, e é por isso que o único gesto aqui é «isto foi pago».
 *
 * A COMPETÊNCIA É UM MÊS DE CALENDÁRIO, no fuso da escola. «Janeiro» é o que aconteceu entre 1 de
 * janeiro e 31 de janeiro — não trinta dias a contar da adesão. É a forma que se confere contra um
 * extrato bancário, e é a única que ela pode comparar com o que vê no banco.
 *
 * O VENCIMENTO É O DIA DA ADESÃO. Uma escola que começou a 16/11 vence a 16 de cada mês — é a
 * prática, e é o que torna «o próximo vencimento» uma data que se sabe sem perguntar a ninguém. Um
 * dia 31 num mês de 30 vence no último dia do mês: uma data que não existe é pior do que uma data
 * deslocada, porque não se pode pagar.
 *
 * O QUE NÃO ESTÁ PAGO FICA «EM ABERTO», e não «atrasado»: a distinção entre as duas é uma decisão
 * dela (a partir de quando é que se cobra juros? avisa-se?), e não está tomada. O módulo diz o que
 * sabe — a data passou ou não passou —, e a frase que se lê é derivada disso, num sítio só.
 */

const fuso = require('./fuso.js');
/* O CATÁLOGO — para dizer o que o plano inclui, que é metade da conta da capacidade a mais. A outra
 * metade é o registo comercial, que chega por parâmetro. Duas fontes, nenhuma copiada para o ecrã. */
const comercial = require('./comercial.js');

/** UMA chave com a lista dentro — a mesma forma dos descontos, e pelo mesmo motivo: o KV não se
 *  enumera, e uma chave por mês obrigaria a listar para desenhar o extrato. */
const CHAVE = 'financeiro/mensalidades';

/**
 * O DIA LOCAL, no formato `AAAA-MM-DD`.
 *
 * A conversão é do `fuso.js`, e não de `toISOString().slice(0,10)`: um pagamento às 22h de 31 de
 * janeiro em Passo Fundo é 01h de 1 de fevereiro em UTC, e cortar o ISO punha-o no mês seguinte —
 * a competência errada, no livro, para sempre. É o mesmo defeito do «habilitada ao meio-dia e 25»,
 * agora com uma consequência contabilística.
 */
function diaDoInstante(iso) {
  const p = fuso.partesLocais(iso);
  return p ? p.ano + '-' + p.mes + '-' + p.dia : '';
}

/** O mês de calendário de um instante: `2026-11`. */
function competencia(iso) {
  return diaDoInstante(iso).slice(0, 7);
}

/** `2026-11` → `{ ano: 2026, mes: 11 }`. Um valor que não seja mês devolve `null`. */
function partesDaCompetencia(mes) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(mes || ''));
  if (!m) return null;
  const ano = Number(m[1]);
  const numero = Number(m[2]);
  if (!ano || numero < 1 || numero > 12) return null;
  return { ano, mes: numero };
}

/** O último dia de um mês. `new Date(ano, mes, 0)` é o dia 0 do mês seguinte — o último deste. */
function ultimoDia(ano, mes) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** O dia do mês em que o contrato começou. Sem contrato datado, o dia 1. */
function diaDaAdesao(iso) {
  const texto = diaDoInstante(iso);
  const dia = texto ? Number(texto.slice(8, 10)) : 0;
  return dia >= 1 && dia <= 31 ? dia : 1;
}

/** O vencimento de uma competência: `2026-11` + adesão a 16 → `2026-11-16`. */
function vencimentoDe(mes, dia) {
  const p = partesDaCompetencia(mes);
  if (!p) return null;
  const d = Math.min(Math.max(1, Number(dia) || 1), ultimoDia(p.ano, p.mes));
  return String(p.ano) + '-' + String(p.mes).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

/** A competência seguinte (e a anterior) — a aritmética do calendário, sem `Date` a atravessar
 *  fusos: `2026-12` + 1 → `2027-01`. */
function somarMeses(mes, quantos) {
  const p = partesDaCompetencia(mes);
  if (!p) return '';
  const total = (p.ano * 12) + (p.mes - 1) + Number(quantos || 0);
  const ano = Math.floor(total / 12);
  const numero = (total % 12) + 1;
  return String(ano) + '-' + String(numero).padStart(2, '0');
}

/** As competências entre duas datas, inclusive. Vazio quando o fim é antes do princípio. */
function mesesEntre(de, ate) {
  const inicio = competencia(de);
  const fim = competencia(ate);
  if (!inicio || !fim) return [];
  const lista = [];
  let atual = inicio;
  /* O TECTO É UMA REDE, não uma regra: um contrato com data no futuro distante produziria uma
   * lista sem fim, e uma página que não abre. Cem meses são oito anos — mais do que qualquer
   * escola deste sistema tem, e o suficiente para a lista continuar a ser uma lista. */
  for (let i = 0; i < 100 && atual && atual <= fim; i += 1) {
    lista.push(atual);
    atual = somarMeses(atual, 1);
  }
  return lista;
}

/** `2026-11` → `novembro de 2026`. O rótulo é o que ela lê no extrato, e não um número. */
const NOMES_DOS_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function nomeDoMes(mes) {
  const p = partesDaCompetencia(mes);
  if (!p) return '';
  return NOMES_DOS_MESES[p.mes - 1] + ' de ' + p.ano;
}

/** O livro inteiro, como lista. Ausente ou ilegível → lista vazia («ainda não há pagamentos»). */
async function lerLivro(kv) {
  if (!kv || typeof kv.get !== 'function') return [];
  try {
    const texto = await kv.get(CHAVE);
    if (!texto) return [];
    const guardado = JSON.parse(texto);
    const lista = Array.isArray(guardado.lista) ? guardado.lista : [];
    return lista.filter((l) => l && l.escola && partesDaCompetencia(l.mes));
  } catch (erro) {
    return [];
  }
}

/**
 * REGISTA UM MÊS COMO PAGO — e a operação é do livro inteiro, não de uma chave.
 *
 * O `ler-modificar-gravar` tem a janela que todo o KV desta casa tem. Aqui ela é pequena e
 * conhecida: um pagamento é um clique dela, e dois cliques simultâneos sobre o MESMO mês escrevem
 * o mesmo facto. O que não se pode perder é o valor: ele é gravado no momento do clique, e não
 * recalculado depois — um mês pago em janeiro por R$ 69,90 continua a ser R$ 69,90 em dezembro,
 * mesmo que o plano da escola tenha mudado.
 *
 * `pago: false` NÃO É OFERECIDO, e é de propósito: ela foi directa — «não tem como eu clicar e
 * dizer não pago, isso não existe». Desfazer um pagamento registado é uma correção de contabilidade
 * manual, e não um botão ao lado do botão que paga.
 */
async function registarPagamento(kv, { escola, mes, valorCentavos, plano, planoNome, quando, por } = {}) {
  if (!kv || typeof kv.put !== 'function') return { ok: false, erro: 'sem KV nesta ligação' };
  const slug = String(escola || '').trim();
  if (!slug) return { ok: false, erro: 'informe a escola' };
  if (!partesDaCompetencia(mes)) return { ok: false, erro: 'informe o mês, no formato AAAA-MM' };
  const em = String(quando || new Date().toISOString());
  const registo = {
    escola: slug,
    mes: String(mes),
    status: 'pago',
    valorCentavos: Math.max(0, Math.round(Number(valorCentavos) || 0)),
    plano: plano || null,
    planoNome: planoNome || null,
    em,
    por: por || null,
  };
  const lista = await lerLivro(kv);
  const semEste = lista.filter((l) => !(l.escola === slug && l.mes === registo.mes));
  semEste.push(registo);
  semEste.sort((a, b) => (a.escola === b.escola
    ? String(a.mes).localeCompare(String(b.mes))
    : String(a.escola).localeCompare(String(b.escola))));
  try {
    await kv.put(CHAVE, JSON.stringify({ lista: semEste, atualizadoEm: em }));
    return { ok: true, pagamento: registo };
  } catch (erro) {
    return { ok: false, erro: (erro && erro.message) || String(erro) };
  }
}

/**
 * O RELÓGIO COMPRIMIDO — um período de mensalidade que dura minutos (17/11/2026).
 *
 * O QUE ELA PEDIU, e porquê: «Para poder testar isso, vamos colocar que um plano, ao invés de ser
 * mensal, ele dura apenas 3 minutos, que daí eu vou poder criar uma listagem e ver como é que está
 * acontecendo. Então passado o tempo de 3 minutos, já tem que pagar de novo e fazer todo o processo
 * e assim a gente tem uma listagem.»
 *
 * O QUE ISTO É, E O QUE NÃO É. Não é um segundo modelo de cobrança: é o MESMO, com o relógio
 * adiantado. Cada bloco de N minutos vale um mês de calendário — a primeira competência é a da
 * adesão, a segunda é a do mês seguinte, e por aí fora. Nada mais muda: as competências continuam a
 * ser `AAAA-MM`, o livro continua a guardar o mês, os rótulos continuam a ser «novembro de 2026». É
 * por isso que o que se vê no ensaio é o que se verá depois: o ensaio não desenha uma maquete, corre
 * o mesmo código com outra hora.
 *
 * A BASE É A ADESÃO, e não o instante em que o ensaio foi ligado: uma escola que aderiu a 17/11 tem
 * a primeira competência em novembro, e é a partir dela que os blocos contam. Sem base no passado
 * não há o que comprimir — e aí devolve-se a hora real, em vez de inventar um passado.
 *
 * O INSTANTE CAI AO MEIO-DIA UTC do vencimento da competência. É a hora que, no fuso da escola
 * (UTC−3), ainda é o MESMO dia — 12:00Z são 09:00 em Passo Fundo —, e é isso que impede a data de
 * andar um dia para trás ao ser lida.
 *
 * DESLIGADO POR OMISSÃO, e o ensaio tem de ser LIGADO por escola: sem o objecto `ensaio` (ou com
 * `minutosPorPeriodo` que não seja um número positivo) esta função devolve a hora real, e a
 * cobrança é mensal como sempre foi. É a única forma de isto não poder tocar numa escola a sério.
 */
function instanteDoEnsaio({ contrato, ensaio, agora } = {}) {
  const real = agora instanceof Date ? agora : new Date(agora || Date.now());
  const minutos = Number(ensaio && ensaio.minutosPorPeriodo);
  if (!(minutos > 0)) return real;

  const c = contrato || {};
  const baseTexto = (ensaio && ensaio.base) || c.criadoEm || c.habilitadaEm || null;
  if (!baseTexto) return real;
  const base = new Date(baseTexto);
  if (Number.isNaN(base.getTime()) || base.getTime() > real.getTime()) return real;

  const baseIso = base.toISOString();
  const periodos = Math.floor((real.getTime() - base.getTime()) / (minutos * 60000));
  const mes = somarMeses(competencia(baseIso), periodos);
  const vencimento = vencimentoDe(mes, diaDaAdesao(baseIso));
  if (!vencimento) return real;
  const deslocado = new Date(vencimento + 'T12:00:00Z');
  return Number.isNaN(deslocado.getTime()) ? real : deslocado;
}

/**
 * A SITUAÇÃO DE UMA ESCOLA — o extrato pronto a desenhar.
 *
 * `contrato` é o registo comercial (`bastidores/<escola>/comercial`, lido por `comercial.js`):
 * traz `plano`, `valorCentavos`, `capacidade` e `criadoEm`. `livro` é o que `lerLivro` devolveu.
 *
 * O QUE SAI, e o que cada campo responde:
 *   · `situacao` — `em-dia` (nada vencido em aberto), `em-aberto` (há mês vencido sem pagamento) ou
 *     `aguardando` (a escola ainda não foi habilitada: não há cobrança a correr);
 *   · `proximoVencimento` — a data do próximo mês que falta pagar, e `dias` até ela (negativo
 *     quando já passou);
 *   · `meses` — a lista do extrato, do mais recente para o mais antigo, com `status`, `vencimento`,
 *     `valorCentavos` e o `em` do pagamento quando há.
 */
function situacaoDaEscola({ escola, contrato, livro, agora, ensaio } = {}) {
  const slug = String(escola || '').trim();
  const c = contrato || {};
  /* O ENSAIO DE MINUTOS (17/11/2026). Presente e válido, o «hoje» é o do relógio comprimido; ausente,
   * é a hora real. A segunda coisa que ele muda é uma linha mais abaixo: no ensaio o período está
   * vencido desde o primeiro instante — «passado o tempo de 3 minutos, já tem que pagar de novo» —,
   * e por isso a comparação é `<=` e não `<`. Fora do ensaio nada disto corre. */
  const ensaioValido = Boolean(ensaio) && Number(ensaio.minutosPorPeriodo) > 0;
  const hoje = ensaioValido
    ? instanteDoEnsaio({ contrato: c, ensaio, agora })
    : (agora ? new Date(agora) : new Date());
  const hojeIso = hoje.toISOString();
  const mesDeHoje = competencia(hojeIso);
  const hojeDia = diaDoInstante(hojeIso);

  const limites = comercial.limitesDoContrato(c);

  const pagamentos = (Array.isArray(livro) ? livro : [])
    .filter((l) => l && l.escola === slug)
    .reduce((mapa, l) => { mapa[l.mes] = l; return mapa; }, {});

  /* DE ONDE COMEÇA A COBRANÇA. Do dia em que o contrato nasceu (`criadoEm`); sem ele, do instante
   * em que a escola foi habilitada. Sem nenhum dos dois, não há o que cobrar — e a lista fica
   * vazia em vez de inventar um princípio. */
  const inicio = c.criadoEm || c.habilitadaEm || null;
  const dia = diaDaAdesao(inicio);
  const meses = inicio ? mesesEntre(inicio, hojeIso) : [];

  const linhas = meses.map((mes) => {
    const pago = pagamentos[mes] || null;
    const vencimento = vencimentoDe(mes, dia);
    const venceu = vencimento
      ? (ensaioValido ? vencimento <= hojeDia : (vencimento + 'T23:59:59') < hojeIso)
      : false;
    return {
      mes,
      nome: nomeDoMes(mes),
      vencimento,
      venceu: Boolean(venceu) && !pago,
      status: pago ? 'pago' : 'aberto',
      valorCentavos: pago ? pago.valorCentavos : (Number(c.valorCentavos) || 0),
      valorPagoCentavos: pago ? pago.valorCentavos : null,
      planoNome: pago ? (pago.planoNome || null) : (c.planoNome || null),
      em: pago ? pago.em : null,
      emTexto: pago ? fuso.quandoLocal(pago.em) : null,
      por: pago ? pago.por : null,
    };
  });

  const emAberto = linhas.filter((l) => l.status === 'aberto');
  const vencidos = emAberto.filter((l) => l.venceu);
  /* O «PRÓXIMO VENCIMENTO» É O MAIS ANTIGO EM ABERTO, e não o mais recente.
   *
   * Com dois meses por pagar, os dois já venceram e a pergunta «quando vence?» tem uma resposta
   * útil: a data do primeiro que se deixou passar. Escolher o mais recente daria uma data que
   * ainda pode estar no futuro sobre uma dívida que já é antiga — e o número ao lado («venceu há
   * N dias») diria menos do que devia. */
  const proximo = emAberto.length ? emAberto[0] : null;
  const dias = proximo && proximo.vencimento
    ? Math.round((Date.parse(proximo.vencimento + 'T12:00:00Z') - Date.parse(hojeIso.slice(0, 10) + 'T12:00:00Z')) / 86400000)
    : null;

  let situacao;
  if (!inicio) situacao = 'aguardando';
  else if (vencidos.length) situacao = 'em-aberto';
  else situacao = 'em-dia';

  /* A PÁGINA MOSTRA DO MAIS RECENTE PARA O MAIS ANTIGO — é como se lê um extrato, e o mês que
   * interessa é o de cima. A ordem de `linhas` (crescente) é a que a aritmética usa, e é por isso
   * que ela não se inverte na origem. */
  const doMaisRecente = linhas.slice().sort((a, b) => b.mes.localeCompare(a.mes));

  return {
    escola: slug,
    situacao,
    diaDoVencimento: dia,
    inicio,
    mesDeHoje,
    meses: doMaisRecente,
    emAberto: emAberto.map((l) => l.mes),
    vencidos: vencidos.map((l) => l.mes),
    proximoVencimento: proximo ? proximo.vencimento : null,
    proximoMes: proximo ? proximo.mes : null,
    diasParaVencer: dias,
    /* O VALOR QUE SE COBRA HOJE é o do contrato em vigor — e não o da última mensalidade. Um
     * upgrade feito ontem tem de aparecer na cobrança de amanhã. */
    valorCentavos: Number(c.valorCentavos) || 0,
    valor: c.valor || null,
    plano: c.plano || null,
    planoNome: c.planoNome || null,
    capacidade: c.capacidade || null,
    /* O PISO E O TETO DO CONTRATO (16/11/2026) — «a partir de» e «até». A `capacidade` acima é o
     * mesmo número que o piso, e continua a sair porque é o nome que o registo comercial usa; o que
     * a tela lê é este par, que é o que a escola entende: ela contratou a partir de 9 professores, e
     * o plano dela vai até 20. O teto dos degraus de baixo é derivado do degrau de cima
     * (`comercial.tetoDoPlano`), e não guardado — a regra é uma, e não uma por plano. */
    piso: limites ? limites.piso : null,
    teto: limites ? limites.teto : null,
    /* O QUE FOI CONTRATADO ALÉM DO PLANO — e a conta de onde vem o valor (16/11/2026).
     *
     * «Aqui diz que a capacidade incluída foi nove professores e 120 alunos […] a mensalidade é
     * R$ 239. Isso quer dizer então que foi contratado o plano avançado de R$ 139,90 mais a
     * capacidade de mais três professores e mais 30 alunos. Aqui no espaço da dança, no financeiro,
     * não está dizendo isso.»
     *
     * E não dizia porque o extrato só mostrava o total. A conta faz-se AQUI, uma vez, e não na
     * página: `capacidade` menos o que o plano inclui. As duas fontes são as de sempre — o registo
     * comercial e o catálogo —, e nenhuma das duas se copia para o ecrã.
     *
     * OS LOTES GUARDADOS MANDAM, quando existem: são o que ela escolheu, e o total pode ter sido
     * calculado a partir deles. Um registo antigo não os tem (nasceram hoje), e aí a diferença
     * responde — é o caso da `duo`, com 9/120 no plano `avancado`, que inclui 6/90. */
    extra: extraDoContrato(c),
    extensoes: Array.isArray(c.extensoes) ? c.extensoes : [],
    estadoComercial: c.estado || null,
  };
}

/**
 * A CAPACIDADE A MAIS QUE FOI CONTRATADA, com o preço de cada lote.
 *
 * `{ professores: {qtd, lotes:[...]}, alunos: {...}, totalCentavos }` — ou `null` quando não há
 * nada a mais. Os lotes trazem o preço do catálogo, e não do registo: o preço de um lote é a tabela
 * em vigor, e o que se guardou foi a quantidade.
 *
 * Devolve `null` quando a conta não fecha — sem plano no catálogo não se sabe o que está incluído,
 * e inventar uma diferença seria dizer que ela contratou o que não se sabe.
 */
function extraDoContrato(contrato) {
  const c = contrato || {};
  const capacidade = c.capacidade || {};
  if (capacidade.professores == null && capacidade.alunos == null) return null;

  const guardados = {
    professores: Array.isArray(c.lotesProfessores) ? c.lotesProfessores.map(Number) : null,
    alunos: Array.isArray(c.lotesAlunos) ? c.lotesAlunos.map(Number) : null,
  };
  const temLotes = Boolean((guardados.professores && guardados.professores.length)
    || (guardados.alunos && guardados.alunos.length));

  let incluido = { professores: 0, alunos: 0 };
  let tabela = { professores: [], alunos: [] };
  try {
    const plano = comercial.assinaturaPorId(c.plano);
    if (!plano && !temLotes) return null;
    if (plano) {
      incluido = { professores: Number(plano.professores) || 0, alunos: Number(plano.alunos) || 0 };
      tabela = { professores: comercial.lotesDe('professores'), alunos: comercial.lotesDe('alunos') };
    }
  } catch (erro) { return null; }

  const umEixo = (eixo) => {
    const total = Number(capacidade[eixo]) || 0;
    const quantidades = temLotes && guardados[eixo]
      ? guardados[eixo]
      : null;
    const aMais = quantidades
      ? quantidades.reduce((s, q) => s + q, 0)
      : Math.max(0, total - incluido[eixo]);
    if (!aMais) return null;
    /* SEM OS LOTES GUARDADOS, a diferença DECOMPÕE-SE PELA TABELA — é o caso da `duo`, com 9
     * professores num plano que inclui 6: a mais são 3, e 3 é um lote de R$ 50. Sem esta
     * decomposição o valor extra sairia zero, e a página diria «contratou 3 professores a mais» sem
     * conseguir dizer quanto por isso — que é metade da pergunta dela. */
    const decompor = (falta, lotes) => {
      const partes = [];
      let resta = falta;
      const ordenados = lotes.slice().sort((a, b) => Number(b.qtd) - Number(a.qtd));
      for (const l of ordenados) {
        while (resta >= Number(l.qtd) && Number(l.qtd) > 0) {
          partes.push({ qtd: Number(l.qtd), preco: l.preco });
          resta -= Number(l.qtd);
        }
      }
      return resta === 0 ? partes : [];
    };
    const lotes = quantidades
      ? quantidades.map((q) => {
        const daTabela = tabela[eixo].find((l) => Number(l.qtd) === q) || null;
        return { qtd: q, preco: daTabela ? daTabela.preco : null };
      })
      : decompor(aMais, tabela[eixo]);
    return { qtd: aMais, lotes };
  };

  const professores = umEixo('professores');
  const alunos = umEixo('alunos');
  if (!professores && !alunos) return null;

  const totalCentavos = (professores ? professores.lotes.reduce((s, l) => s + (comercial.centavos(l.preco || 0)), 0) : 0)
    + (alunos ? alunos.lotes.reduce((s, l) => s + (comercial.centavos(l.preco || 0)), 0) : 0);
  return {
    professores, alunos, incluido, totalCentavos,
    total: totalCentavos ? comercial.precoEmTexto(totalCentavos / 100) : null,
  };
}

/**
 * A MUDANÇA DE PLANO QUE AINDA NÃO COBROU — «isto é para o próximo mês» (17/11/2026).
 *
 * O QUE ELA VIU, e o que faltava dizer: «A escola Breu contratou o plano que no total dá R$ 239,90.
 * Ela já pagou. Aí ela quer mudar o plano, vai para o básico […] o total ficou R$ 169,90, só que
 * isso é para o próximo mês. […] Precisa indicar aqui que o plano contratado é básico, R$ 169,90 por
 * mês. E aí a mudança vai passar a valer no mês seguinte.»
 *
 * O extrato já estava certo e a página não o dizia: o mês PAGO guarda o plano com que foi pago
 * (`livro`), e o mês EM ABERTO é cobrado pelo contrato de hoje (`situacaoDaEscola`). O que faltava
 * era a FRASE que liga as duas coisas — sem ela, ler «plano contratado 169,90» por cima de uma
 * linha «novembro · 239,90 · pago» parece erro de conta.
 *
 * A REGRA, e é a única que não inventa nada: compara-se o último mês PAGO com o contrato em vigor.
 * Se o plano ou o valor mudaram, a mudança vale a partir do mês seguinte ao último pago — e o
 * primeiro vencimento no plano novo é o dia da adesão, nesse mês.
 *
 * PORQUE O MÊS SEGUINTE AO ÚLTIMO PAGO, e não «o primeiro em aberto»: em 17/11 não há mês em aberto
 * nenhum (novembro está pago e dezembro ainda não começou a existir no extrato). «O primeiro em
 * aberto» responderia «nada» a quem está exactamente a fazer a pergunta. O mês seguinte ao último
 * pago existe sempre, e é a resposta certa nos dois casos.
 *
 * Devolve `null` quando não há nada a dizer: sem mês pago, ou com o plano do último pago igual ao
 * de hoje. Um aviso que aparece sempre deixa de ser aviso.
 */
function mudancaDePlano(situacao) {
  const s = situacao || {};
  const meses = Array.isArray(s.meses) ? s.meses : [];
  const pagos = meses.filter((m) => m && m.status === 'pago' && m.mes);
  if (!pagos.length) return null;
  /* `situacaoDaEscola` devolve do mais recente para o mais antigo — a ordem do extrato, e é dela
   * que sai «o último pago». */
  const ultimo = pagos[0];
  const mesmoPlano = String(ultimo.planoNome || '') === String(s.planoNome || '')
    && Number(ultimo.valorCentavos) === Number(s.valorCentavos);
  if (mesmoPlano) return null;
  const seguinte = somarMeses(ultimo.mes, 1);
  return {
    de: {
      mes: ultimo.mes,
      nome: ultimo.nome,
      planoNome: ultimo.planoNome || null,
      valorCentavos: Number(ultimo.valorCentavos) || 0,
    },
    mes: seguinte,
    nome: nomeDoMes(seguinte),
    vencimento: vencimentoDe(seguinte, s.diaDoVencimento),
  };
}

/** A FRASE DA SITUAÇÃO. Uma, escrita uma vez, para a página dela e a da escola dizerem o mesmo. */
function fraseDaSituacao(situacao) {
  if (situacao === 'em-dia') return 'Em dia: não há mensalidade vencida em aberto.';
  if (situacao === 'em-aberto') return 'Em aberto: há mensalidade vencida sem pagamento registado.';
  return 'Aguardando a liberação: a cobrança começa quando a escola é habilitada.';
}

module.exports = {
  CHAVE,
  NOMES_DOS_MESES,
  competencia,
  diaDoInstante,
  partesDaCompetencia,
  somarMeses,
  mesesEntre,
  nomeDoMes,
  vencimentoDe,
  diaDaAdesao,
  lerLivro,
  registarPagamento,
  situacaoDaEscola,
  instanteDoEnsaio,
  mudancaDePlano,
  extraDoContrato,
  fraseDaSituacao,
};
