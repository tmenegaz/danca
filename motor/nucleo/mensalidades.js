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

/** `6990` → `69,90`. Uma formatação de dinheiro por módulo — a do painel é para o HTML, esta é
 *  para as FRASES que o núcleo escreve (a recusa do valor recebido). Duas cópias de `toFixed(2)`
 *  não divergem em número, mas divergem em arredondamento no dia em que uma for tocada. */
function reaisDe(emCentavos) {
  const c = Math.max(0, Math.round(Number(emCentavos) || 0));
  return (c / 100).toFixed(2).replace('.', ',');
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
/**
 * REGISTAR O PAGAMENTO DE UM MÊS — o acto da conciliação.
 *
 * `manterSeJaPago` (25/11/2026) é o que impede um segundo clique de REESCREVER A DATA. O botão da
 * linha diz «Marcar pago» e a página recarrega depois; um duplo clique, ou um clique numa aba que
 * ficou aberta da véspera, movia o `em` para «agora» — e a data do pagamento é o que se confere
 * contra o extrato do banco. Com a opção, um mês já pago devolve o registo que existe, com
 * `jaPago: true`, e NÃO escreve no KV.
 *
 * A opção é do CHAMADOR, e não o comportamento por omissão: a função continua a ser a primitiva que
 * grava o que lhe pedem, e é a rota do botão que diz «este gesto não reescreve o passado». Uma
 * primitiva que se recusasse a gravar por conta própria esconderia a regra de quem a lê.
 */
async function registarPagamento(kv, { escola, mes, valorCentavos, recebidoCentavos,
  devidoCentavos, plano, planoNome, quando, por, manterSeJaPago } = {}) {
  if (!kv || typeof kv.put !== 'function') return { ok: false, erro: 'sem KV nesta ligação' };
  const slug = String(escola || '').trim();
  if (!slug) return { ok: false, erro: 'informe a escola' };
  if (!partesDaCompetencia(mes)) return { ok: false, erro: 'informe o mês, no formato AAAA-MM' };
  const em = String(quando || new Date().toISOString());
  /* OS TRÊS NÚMEROS DA LINHA, e cada um responde a uma pergunta diferente (25/11/2026):
   *
   *   · `valorCentavos` é a FATURA do mês — o que foi cobrado. É o que a mudança de plano compara,
   *     e é por isso que ele não leva a mora: uma conta paga com atraso não é um plano novo;
   *   · `recebidoCentavos` é o ACUMULADO que entrou naquele mês. Somam-se os pagamentos, porque
   *     uma escola pode pagar em duas vezes;
   *   · `devidoCentavos` é o que se cobrava no momento do clique, já com a mora — é ele que decide
   *     se o mês ficou QUITADO ou só PARCIAL.
   *
   * A FATURA CONTINUA A NÃO SE RECALCULAR: o valor é gravado no clique e não se reescreve depois.
   */
  const fatura = Math.max(0, Math.round(Number(valorCentavos) || 0));
  const devido = Math.max(0, Math.round(Number(devidoCentavos) || 0)) || fatura;
  /* O QUE ENTROU NESTE GESTO. Ausente, é o pagamento inteiro — o comportamento de sempre, e o que
   * o botão do painel fazia antes de existir um campo de valor. */
  const entrou = recebidoCentavos === undefined || recebidoCentavos === null
    ? devido
    : Math.round(Number(recebidoCentavos) || 0);
  if (!Number.isFinite(entrou) || entrou < 0) {
    return { ok: false, erro: 'o valor recebido tem de ser um número de cêntimos, e não negativo' };
  }
  /* O TETO ANTI-ERRO-DE-DIGITAÇÃO. Um valor mais do que o DOBRO do devido não é um acerto: é um
   * `69,90` que virou `6990`. Recusar é mais barato do que gravar R$ 6.990,00 no livro e descobrir
   * na conciliação seguinte. É uma guarda DECLARADA, e não uma regra de negócio — quem precisar de
   * registar um valor maior corrige-o à mão no livro. */
  if (devido > 0 && entrou > devido * 2) {
    return {
      ok: false,
      erro: 'o valor recebido (' + reaisDe(entrou) + ') é mais do que o dobro do devido ('
        + reaisDe(devido) + ') — confira; nada foi gravado',
    };
  }
  const lista = await lerLivro(kv);
  const anterior = lista.find((l) => l && l.escola === slug && l.mes === String(mes)) || null;
  if (manterSeJaPago && anterior && (anterior.status || 'pago') === 'pago') {
    return { ok: true, jaPago: true, pagamento: anterior };
  }
  /* ZERO NÃO É UM PAGAMENTO. Gravar `recebidoCentavos: 0` num mês escreveria no livro uma linha que
   * diz «entrou nada» — e a linha seguinte, ao ler o acumulado, não a distinguiria de um mês que
   * ninguém tocou. Um mês sem pagamento fica sem linha: é assim que o extrato o mostra.
   *
   * A GUARDA VEM DEPOIS DA DE CIMA, e a ordem é o que a torna inofensiva para o mês já pago. Um mês
   * quitado tem `devidoCentavos: 0`, e o segundo clique de quem concilia traz esse zero: recusá-lo
   * aqui responderia «um pagamento de R$ 0,00 não regista nada» a quem só carregou duas vezes no
   * mesmo botão. O que ele precisa de ouvir é «já estava pago», e é o que a guarda anterior diz. */
  if (entrou === 0) {
    return { ok: false, erro: 'um pagamento de R$ 0,00 não regista nada — o mês fica em aberto' };
  }
  /* O ACUMULADO. Um registo anterior sem `recebidoCentavos` é um pagamento inteiro do tempo em que
   * só havia um — o `valorCentavos` dele é o que entrou. */
  const jaEntrou = anterior
    ? Math.max(0, Number(anterior.recebidoCentavos != null
      ? anterior.recebidoCentavos : anterior.valorCentavos) || 0)
    : 0;
  const total = jaEntrou + entrou;
  const quitado = total >= devido;
  const historico = Array.isArray(anterior && anterior.pagamentos) ? anterior.pagamentos.slice() : [];
  historico.push({ em, valorCentavos: entrou, por: por || null });
  const registo = {
    escola: slug,
    mes: String(mes),
    status: quitado ? 'pago' : 'parcial',
    valorCentavos: fatura || (anterior && Number(anterior.valorCentavos)) || 0,
    recebidoCentavos: total,
    devidoCentavos: devido,
    faltaCentavos: Math.max(0, devido - total),
    plano: plano || null,
    planoNome: planoNome || null,
    em,
    por: por || null,
    pagamentos: historico,
  };
  const semEste = lista.filter((l) => !(l && l.escola === slug && l.mes === registo.mes));
  semEste.push(registo);
  semEste.sort((a, b) => (a.escola === b.escola
    ? String(a.mes).localeCompare(String(b.mes))
    : String(a.escola).localeCompare(String(b.escola))));
  try {
    await kv.put(CHAVE, JSON.stringify({ lista: semEste, atualizadoEm: em }));
    return { ok: true, pagamento: registo, parcial: !quitado, faltaCentavos: registo.faltaCentavos };
  } catch (erro) {
    return { ok: false, erro: (erro && erro.message) || String(erro) };
  }
}

/**
 * O LIVRO NÃO SE APAGA QUANDO A ESCOLA É EXPURGADA (23/11/2026, à tarde).
 *
 * Houve aqui uma `apagarEscolaDoLivro`, escrita a 17/11 com as palavras dela — «essa parte toda de
 * pagamento e financeiro […] tem que deixar de existir» —, e foi usada até ela ver o resultado:
 *
 *   «O que não pode sair é a parte financeira. Tem que manter que ela é uma escola que tem um
 *   histórico de pagamentos e de ações. […] A parte financeira não pode expurgar, ela fica para
 *   histórico. E aí a gente diz numa linha seguinte que essa escola foi expurgada.»
 *
 * A função saiu em vez de ficar sem chamador: um caminho de escrita que ninguém usa é código morto
 * que parece vivo, e o próximo que o lesse acreditaria que apagar o livro é um gesto do produto.
 *
 * O QUE ESTE MÓDULO PASSA A GARANTIR, e é a metade que faltava: uma escola **sem contrato** — é o
 * que sobra de uma escola expurgada no KV — continua a ter as suas linhas no extrato, tiradas do
 * livro. Ver `situacaoDaEscola`: os meses sem contrato são os meses que ela PAGOU, e não uma
 * contagem de meses a cobrar a partir de uma adesão que já não existe.
 */

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
/**
 * O MÊS EM QUE O ENSAIO COMEÇA — o primeiro que NÃO está pago (17/11/2026).
 *
 * «AGORA ESTÁ VINDO TUDO COMO PAGO JÁ. Tem que vir como aberto para eu testar a funcionalidade, se
 * está pagando, se não está pagando. […] Se chegar tudo pago, não tem como eu fazer o teste.»
 *
 * A CAUSA ERA ARITMÉTICA, e não de desenho: a base do relógio era o instante em que se ligava, e
 * nos primeiros minutos o «hoje» comprimido dá o MÊS DA BASE — o mês corrente, precisamente o que
 * já está pago. Durante dez minutos o ensaio mostrava exactamente o que o relógio real mostrava, e
 * ela não tinha um mês em aberto para conciliar. O ensaio existia e não servia para o que foi
 * pedido.
 *
 * A REGRA: o ensaio começa no mês SEGUINTE AO ÚLTIMO PAGO. Assim, no instante em que se liga há um
 * mês em aberto para pagar — o que torna o ensaio utilizável a partir do primeiro segundo —, e cada
 * período que passa acrescenta outro, que é a listagem que ela quer ver crescer.
 *
 * PORQUE O SEGUINTE AO ÚLTIMO PAGO, e não «hoje»: uma escola que pagou até janeiro tem de começar o
 * ensaio em fevereiro, e não em novembro. O que interessa não é a data de hoje, é onde o DINHEIRO
 * parou — e é isso que o livro diz.
 *
 * Sem nada pago, o mês inicial é o da adesão: é o primeiro mês que existe, e já nasce em aberto como
 * nasceria a sério. Sem adesão datada, o mês corrente.
 */
function mesInicialDoEnsaio({ escola, contrato, livro } = {}) {
  const slug = String(escola || '').trim();
  const c = contrato || {};
  const inicio = c.criadoEm || c.habilitadaEm || null;
  const pagos = (Array.isArray(livro) ? livro : [])
    .filter((l) => l && l.escola === slug && l.mes && l.status === 'pago'
      && partesDaCompetencia(l.mes))
    .map((l) => String(l.mes))
    .sort();
  if (!pagos.length) {
    return inicio ? competencia(inicio) : competencia(new Date().toISOString());
  }
  return somarMeses(pagos[pagos.length - 1], 1);
}

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
  /* DE QUE MÊS PARTE A CONTAGEM (17/11/2026). Com `mesInicial` — o que a rota grava hoje —, conta-se
   * a partir do primeiro mês SEM PAGAMENTO, e o relógio nasce com um mês em aberto à frente. Sem ele
   * (um registo gravado antes desta regra), conta-se do mês da base, que era o comportamento antigo.
   * Um registo antigo não pode passar a dar erro por lhe faltar um campo novo. */
  const partida = (ensaio && partesDaCompetencia(ensaio.mesInicial))
    ? String(ensaio.mesInicial) : competencia(baseIso);
  const mes = somarMeses(partida, periodos);
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
function situacaoDaEscola({ escola, contrato, livro, agora, ensaio, aulasUsadas } = {}) {
  /* `aulasUsadas` chega de FORA, e é opcional de propósito: quem conta as aulas tem o plano
   * próprio (PLANO-CONTADOR-DE-AULAS.md) e ainda não existe. Sem ele, a franquia é mostrada e
   * o consumo é omitido — ver o comentário no `franquia` do objecto devolvido. */
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
  /* SEM CONTRATO, A LINHA DO TEMPO É O LIVRO (23/11/2026, à tarde).
   *
   * Uma escola expurgada perde o registo comercial — é o expurgo —, e o que sobra dela é a
   * `financeiro/mensalidades`: os meses que ela pagou. Contar os meses a partir da adesão deixaria
   * o extrato dela VAZIO (não há adesão que contar), e ela veria desaparecer exactamente o
   * histórico que a decisão de hoje manda guardar.
   *
   * A REGRA, e ela não inventa nada: sem contrato não há o que cobrar, portanto as únicas linhas
   * que existem são as que foram PAGAS. Elas vêm do livro, em ordem crescente — a mesma ordem que
   * a aritmética usa —, e o `valorCentavos` de cada uma já está no registo do pagamento.
   *
   * Com contrato nada disto corre: a linha do tempo continua a nascer da adesão, e é ela que
   * produz os meses em aberto. */
  /* UM MÊS QUE FOI PAGO NUNCA SE ESCONDE (23/11/2026, à tarde) — a linha do tempo é a UNIÃO.
   *
   * `mesesEntre` vai da adesão até hoje, e isso basta para a cobrança: não se cobra o futuro. Mas
   * uma página do livro pode estar FORA dessa janela, e ela é um pagamento que existiu:
   *
   *   · para trás — um mês anterior à adesão (um acerto, uma migração de contrato);
   *   · para a frente — um pagamento adiantado, e é o caso que a `breu` tem: sete meses pagos de
   *     2026-11 a 2027-05, com «hoje» em novembro de 2026. Ao recriar a escola, a adesão nova é de
   *     novembro, `mesesEntre` devolveria UM mês, e os outros seis desapareceriam do extrato —
   *     exactamente o que esta correcção existe para impedir.
   *
   * A regra é a mesma dos dois lados: o que se cobra vem da adesão; o que foi pago vem do livro; a
   * vista é a soma dos dois. Ordenada, porque a aritmética acima conta com a ordem crescente. */
  const daAdesao = inicio ? mesesEntre(inicio, hojeIso) : [];
  const doLivro = Object.keys(pagamentos);
  const meses = daAdesao.concat(doLivro.filter((m) => daAdesao.indexOf(m) === -1)).sort();

  const linhas = meses.map((mes) => {
    /* O REGISTO DO MÊS, e ele pode estar em dois estados (25/11/2026): `pago` (quitado) ou
     * `parcial` (entrou parte, e ainda falta). Um registo antigo não tem `status` — é um pagamento
     * inteiro do tempo em que só havia um, e lê-se como `pago`. */
    const registo = pagamentos[mes] || null;
    const statusDoRegisto = registo ? String(registo.status || 'pago') : null;
    const quitado = statusDoRegisto === 'pago';
    /* O QUE ENTROU. `recebidoCentavos` é o acumulado; um registo antigo só tem `valorCentavos`, e
     * nesse caso ele É o que entrou. */
    const recebido = registo
      ? Math.max(0, Number(registo.recebidoCentavos != null
        ? registo.recebidoCentavos : registo.valorCentavos) || 0)
      : 0;
    /* A FATURA DO MÊS — o que foi cobrado, sem a mora. É este número que a mudança de plano compara,
     * e é por isso que ele não inclui encargos: uma conta paga com atraso não é um plano novo. */
    const fatura = registo && Number(registo.valorCentavos) > 0
      ? Number(registo.valorCentavos) : (Number(c.valorCentavos) || 0);
    /* O SALDO — o que ainda se deve da fatura. Num mês quitado é zero; num parcial é o que sobrou
     * depois do que já entrou. */
    const saldo = quitado ? 0 : Math.max(0, fatura - recebido);
    const vencimento = vencimentoDe(mes, dia);
    const venceu = vencimento
      ? (ensaioValido ? vencimento <= hojeDia : (vencimento + 'T23:59:59') < hojeIso)
      : false;
    return {
      mes,
      nome: nomeDoMes(mes),
      vencimento,
      venceu: Boolean(venceu) && !quitado,
      status: quitado ? 'pago' : (registo ? 'parcial' : 'aberto'),
      valorCentavos: fatura,
      /* `valorPagoCentavos` é o que ENTROU — no mês quitado é a fatura (mais a mora, quando a
       * houve), no parcial é a parte. `valorCentavos` continua a ser a fatura, para as contas que
       * comparam planos. */
      valorPagoCentavos: registo ? recebido : null,
      recebidoCentavos: registo ? recebido : 0,
      faltaCentavos: saldo,
      planoNome: registo ? (registo.planoNome || null) : (c.planoNome || null),
      em: registo ? registo.em : null,
      emTexto: registo ? fuso.quandoLocal(registo.em) : null,
      por: registo ? registo.por : null,
      /* OS ENCARGOS DE MORA, por mês (25/11/2026). Ficam NA LINHA e não numa soma à parte: a escola
       * que pergunta «quanto devo?» pergunta por um mês, e a resposta que serve é a daquele mês. Um
       * mês quitado não tem encargos — o atraso já foi resolvido, e cobrá-lo outra vez seria cobrar
       * duas vezes a mesma mora.
       *
       * A BASE DA MORA É O SALDO, e não a fatura (25/11/2026). Num mês PARCIAL, a dívida já não é a
       * fatura inteira; cobrar multa e juros sobre o que a escola já pagou seria cobrar duas vezes.
       * Num mês sem pagamento o saldo é a fatura, e o número é o de sempre. */
      encargos: quitado ? null : encargos({
        valorCentavos: saldo, vencimento, hoje: hojeIso,
      }),
    };
  });

  /* UM MÊS PARCIAL ESTÁ EM ABERTO (25/11/2026) — entrou parte e falta o resto, e o extrato, o
   * alarme e a dívida têm de o contar. Tratá-lo como quitado esconderia dinheiro em falta; tratá-lo
   * como inexistente faria a lista dizer que o mês nunca foi tocado. */
  const emAberto = linhas.filter((l) => l.status !== 'pago');
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

  /* O TOTAL EM MORA — a soma do que está vencido e não pago, com multa e juros. É o número que a
   * conversa com a escola usa, e o que o monitor soma como dívida. Só conta mês VENCIDO: o mês em
   * curso ainda não é atraso. */
  const totalEmMoraCentavos = vencidos.reduce((s, l) => s
    + ((l.encargos && l.encargos.totalCentavos) || 0), 0);
  const encargosEmMoraCentavos = vencidos.reduce((s, l) => s
    + ((l.encargos && l.encargos.encargosCentavos) || 0), 0);

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
    /* O QUE SE COBRA HOJE, com a mora. `totalEmMora` já inclui multa e juros; `encargosEmMora` é a
     * parte que não é mensalidade. Sem dívida vencida, os dois são zero — e não `null`, porque aí o
     * zero é uma afirmação verdadeira: não há nada em atraso. */
    totalEmMoraCentavos,
    encargosEmMoraCentavos,
    politicaDeMora: {
      multa: MULTA_DE_MORA, jurosAoMes: JUROS_AO_MES,
      correcaoAplicada: false,
      norma: 'REN ANEEL 1.000/2021, art. 343 · CDC art. 52, §1º',
    },
    /* O VALOR QUE SE COBRA HOJE é o do contrato em vigor — e não o da última mensalidade. Um
     * upgrade feito ontem tem de aparecer na cobrança de amanhã. */
    valorCentavos: Number(c.valorCentavos) || 0,
    valor: c.valor || null,
    plano: c.plano || null,
    planoNome: c.planoNome || null,
    capacidade: c.capacidade || null,
    /* A DATA DA CONTRATAÇÃO, e as duas reservas dela (25/11/2026). O `contratadoEm` é o campo
     * próprio, carimbado quando um contrato NOVO é gravado. Nos registos anteriores a hoje ele não
     * existe, e a reserva é o `criadoEm` — o instante em que a escola nasceu já com este plano, que
     * é a mesma data dita pela fonte que a tem. `habilitadaEm` vem por último porque uma escola
     * pode ter sido habilitada mais tarde do que contratada. Sem nenhuma das três, sai `null`: a
     * página diz que não há data em vez de inventar uma. */
    contratadoEm: c.contratadoEm || c.criadoEm || c.habilitadaEm || null,
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
    /* A FRANQUIA DE AULAS (17/11/2026) — o eixo comercial de hoje, derivado do catálogo e dos
     * pacotes que a escola comprou. Vai para o cartão junto do resto porque é o PRIMEIRO número
     * que a escola procura: quanto ela tem, e quanto usou.
     *
     * `aulasUsadas` NÃO SE INVENTA AQUI. Quem conta as aulas é a fonte do ciclo (o `-dados.json`
     * → `aulas`), e essa contagem tem um plano próprio (PLANO-CONTADOR-DE-AULAS.md). Enquanto ela
     * não estiver montada, este campo sai a `null` e o cartão CALA o consumo — mostrar «0 de 100»
     * sobre uma contagem que não se fez seria dizer que a escola não trabalhou.
     *
     * O `ensaio` não mexe na franquia: ele comprime o RELÓGIO das mensalidades, e a franquia é do
     * mês civil. Misturar os dois daria uma franquia que muda de tamanho enquanto se testa. */
    franquia: comercial.situacaoDaFranquia({
      contrato: c,
      aulasUsadas: aulasUsadas == null ? null : aulasUsadas,
    }),
    pacotes: (comercial.franquiaDoContrato(c) || { pacotes: [] }).pacotes || [],
  };
}

/**
 * QUANTO SE DEVE POR UM MÊS, HOJE (25/11/2026) — a única resposta a essa pergunta.
 *
 * A rota que grava o pagamento precisa deste número ANTES de gravar, porque é ele que decide se o
 * mês ficou quitado ou apenas parcial. E ele não pode ser calculado outra vez na rota: uma segunda
 * conta da mora é uma segunda mora, e as duas divergem no primeiro dia que alguém tocar numa das
 * taxas.
 *
 * Por isso esta função não faz contas próprias — chama `situacaoDaEscola` e LÊ a linha do mês, que
 * é exactamente o número que a página mostra. Se o extrato diz R$ 92,42, é 92,42 que a rota espera.
 *
 * Devolve `null` quando o mês não está na linha do tempo da escola: aí não há nada a cobrar, e quem
 * chamou tem de decidir o que dizer — não se inventa um valor.
 */
function devidoDoMes({ escola, contrato, livro, mes, agora } = {}) {
  const competenciaPedida = String(mes || '').trim();
  if (!partesDaCompetencia(competenciaPedida)) return null;
  const situacao = situacaoDaEscola({ escola, contrato, livro, agora });
  const linha = (situacao.meses || []).find((l) => l.mes === competenciaPedida);
  if (!linha) return null;
  return {
    mes: competenciaPedida,
    /* A FATURA — o que foi cobrado, sem mora. É o que a mudança de plano compara. */
    faturaCentavos: linha.valorCentavos,
    /* O QUE JÁ ENTROU, e o que ainda falta da fatura. */
    recebidoCentavos: linha.recebidoCentavos || 0,
    faltaCentavos: linha.faltaCentavos || 0,
    /* O QUE SE COBRA HOJE, com multa e juros sobre o saldo. É este o valor que o botão propõe. */
    devidoCentavos: (linha.encargos && linha.encargos.totalCentavos) || linha.faltaCentavos || 0,
    encargosCentavos: (linha.encargos && linha.encargos.encargosCentavos) || 0,
    status: linha.status,
    quitado: linha.status === 'pago',
    venceu: Boolean(linha.venceu),
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
  /* O MÊS NOVO JÁ EXISTE NO EXTRATO? (17/11/2026.) Em 17/11 não existe — dezembro ainda não
   * começou —, e a frase é futuro: «a mudança passa a valer em dezembro». A partir de dezembro
   * (ou a qualquer momento com o relógio de ensaio a correr), o mês já está lá e em aberto, e o
   * futuro passa a ser falso: a mudança JÁ está em vigor, e o que há é uma cobrança por pagar.
   *
   * São duas frases porque são duas realidades, e a diferença não é de estilo: dizer «passa a
   * valer» sobre um mês que já está na lista faria o leitor procurar o que ainda falta acontecer. */
  const emVigor = meses.some((m) => m && m.mes === seguinte);
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
    emVigor,
  };
}

/** A FRASE DA SITUAÇÃO. Uma, escrita uma vez, para a página dela e a da escola dizerem o mesmo. */
function fraseDaSituacao(situacao) {
  if (situacao === 'em-dia') return 'Em dia: não há mensalidade vencida em aberto.';
  if (situacao === 'em-aberto') return 'Em aberto: há mensalidade vencida sem pagamento registado.';
  return 'Aguardando a liberação: a cobrança começa quando a escola é habilitada.';
}

/* ── MULTA E JUROS DE MORA — a política das contas de consumo *(25/11/2026)* ─────────────────
 *
 * «A gente vai adotar a mesma política de multa e juros que tem em um serviço como, por exemplo,
 * conta de água, conta de luz, que eu acho que são os mais básicos, os mais baixos também que tem no
 * mercado.»
 *
 * A POLÍTICA QUE ELA ESCOLHEU, e a norma que a sustenta — pesquisada e verificada:
 *   · **Multa de mora: 2% sobre o valor da fatura**, cobrada UMA vez. O teto de 2% não é uma
 *     escolha comercial: é o **art. 52, §1º do CDC** («não poderão ser superiores a dois por cento
 *     do valor da prestação»), e a **REN ANEEL nº 1.000/2021, art. 343, §1º** («a cobrança de multa
 *     pode ser realizada no percentual de até 2%»).
 *   · **Juros de mora: 1% ao mês, pro rata die** — art. 343, *caput*, da mesma REN. É a norma que
 *     fixa o 1%: o Código Civil de 2002 abandonou a taxa de 1% (art. 406 remete à Selic), pelo que
 *     quem sustenta o número é a regulação, não o código.
 *   · **Sem carência.** Nem a REN nem o CDC dão dias de graça. A ÚNICA tolerância é a do art. 343,
 *     §3º, e ela está implementada: vencimento em sábado, domingo ou feriado **não é atraso** se o
 *     pagamento cair no primeiro dia útil seguinte.
 *   · **Base de cálculo:** o **valor da fatura**, e não o saldo devedor; e multa e juros de períodos
 *     anteriores NÃO recebem multa outra vez (o §2º, III, veda o anatocismo).
 *
 * O QUE NÃO SE APLICA, E PORQUÊ. A REN manda atualizar pelo **IPCA**; aqui **não se aplica**. Buscar
 * um índice oficial seria uma dependência externa que falha em silêncio e muda o valor da dívida sem
 * ninguém saber — o mesmo raciocínio que fez o câmbio do painel ser **declarado** (`CAMBIO_USD_BRL`)
 * em vez de descoberto. A correção monetária fica **declarada como não aplicada**, e o campo existe
 * para o dia em que houver um índice lido de fonte confiável e datado. Inventar uma taxa seria pior
 * do que não a cobrar: um valor inventado numa cobrança é uma dívida que ninguém sabe de onde veio.
 *
 * E O QUE ISTO **NÃO** FAZ: não bloqueia, não suspende, não expulsa. A escada da inadimplência é
 * outra (desabilitar aos 1 mês, expurgar aos 3) e vive na §7.3 do PLANO-CONTADOR-DE-AULAS. Multa e
 * juros são o PREÇO do atraso, e não a consequência dele.
 */
/**
 * A CLÁUSULA DE QUITAÇÃO (25/11/2026) — a frase que diz QUANDO um mês deixa de estar em aberto.
 *
 * «Eu ainda não sei uma solução para isso, para impedir que a pessoa pague o valor menor. Ela vai
 * ter que pagar o valor maior.» A regra no código (o valor recebido compara-se com o devido) só
 * resolve metade do problema: a outra metade é a escola SABER a regra antes de pagar. Uma regra
 * que só existe no servidor é uma regra que se descobre quando o mês não fecha.
 *
 * Ela mora AQUI, e não em cada página, por duas razões: é o núcleo que decide o que é um mês
 * quitado (ver `registarPagamento` e `situacaoDaEscola`), e duas redacções da mesma cláusula
 * divergem — a da escola diria «mensalidade», a do painel diria «mensalidade + encargos», e a
 * diferença apareceria exactamente no mês em atraso, que é quando ela é lida.
 *
 * O QUE ELA NÃO DIZ: multa, juros, percentagens. Esses números mudam por decisão comercial e são
 * mostrados ao lado do valor que os aplica; a cláusula é a REGRA, e a regra não tem taxa.
 */
const CLAUSULA_DE_QUITACAO = 'O mês só se considera quitado quando o valor conciliado cobre a '
  + 'mensalidade e a mora. Um valor abaixo disso deixa o mês em aberto, e o que falta continua a '
  + 'ser cobrado.';

const MULTA_DE_MORA = 0.02;
const JUROS_AO_MES = 0.01;
const DIAS_NO_MES_COMERCIAL = 30;

/** O vencimento caiu em dia não útil? `Date.getUTCDay()`: 0 = domingo, 6 = sábado. */
function caiuEmDiaNaoUtil(iso) {
  const d = new Date(String(iso) + 'T12:00:00Z');
  if (Number.isNaN(d.getTime())) return false;
  const dia = d.getUTCDay();
  return dia === 0 || dia === 6;
}

/**
 * OS ENCARGOS DE UM MÊS EM ATRASO. Puro: recebe o valor, o vencimento e o dia de hoje, e devolve a
 * conta. Não lê KV, não olha o relógio — o «hoje» entra por parâmetro, como em todo este núcleo.
 *
 * `diasDeAtraso` é contado a partir do DIA SEGUINTE ao vencimento: quem paga no próprio dia não está
 * em atraso, e um dia de atraso é um dia de mora. A tolerância do dia não útil está em
 * `vencimentoEfetivo`, para que a conta e o rótulo usem a mesma data.
 */
function encargos({ valorCentavos, vencimento, hoje, multa, jurosAoMes } = {}) {
  const valor = Math.max(0, Math.round(Number(valorCentavos) || 0));
  const base = String(vencimento || '').slice(0, 10);
  const dia = String(hoje || '').slice(0, 10);
  const vazio = {
    diasDeAtraso: 0, emAtraso: false, multaCentavos: 0, jurosCentavos: 0,
    encargosCentavos: 0, totalCentavos: valor, correcaoAplicada: false,
    multa: MULTA_DE_MORA, jurosAoMes: JUROS_AO_MES,
  };
  if (!base || !dia || !valor) return vazio;
  const t0 = Date.parse(base + 'T12:00:00Z');
  const t1 = Date.parse(dia + 'T12:00:00Z');
  if (Number.isNaN(t0) || Number.isNaN(t1)) return vazio;
  const dias = Math.round((t1 - t0) / 86400000);
  if (dias <= 0) return vazio;

  const taxaDaMulta = Number.isFinite(Number(multa)) ? Number(multa) : MULTA_DE_MORA;
  const taxaDosJuros = Number.isFinite(Number(jurosAoMes)) ? Number(jurosAoMes) : JUROS_AO_MES;
  /* A MULTA É UMA SÓ, e o teto é 2% — se alguém passar um valor maior, o que vale é o teto do CDC.
   * É a única linha deste ficheiro que corrige o chamador, e corrige-o para baixo: um valor acima
   * do legal não é uma escolha, é uma cobrança indevida. */
  const multaEfetiva = Math.min(Math.max(0, taxaDaMulta), MULTA_DE_MORA);
  const multaCentavos = Math.round(valor * multaEfetiva);
  /* OS JUROS SÃO PRO RATA DIE: 1% ao mês ÷ 30 dias × dias de atraso. Um dia de atraso num mês de 31
   * dias usa o divisor 30, que é o que a REN diz («1% ao mês») e o que a praxe comercial aplica. */
  const jurosCentavos = Math.round(valor * taxaDosJuros * (dias / DIAS_NO_MES_COMERCIAL));
  return {
    diasDeAtraso: dias,
    emAtraso: true,
    multaCentavos,
    jurosCentavos,
    encargosCentavos: multaCentavos + jurosCentavos,
    totalCentavos: valor + multaCentavos + jurosCentavos,
    /* A correção monetária NÃO é aplicada, e diz-se em cada conta — não é uma omissão silenciosa. */
    correcaoAplicada: false,
    multa: multaEfetiva,
    jurosAoMes: taxaDosJuros,
    /* A NORMA, ao lado do número: uma cobrança sem a norma citada é uma cobrança que ninguém sabe
     * defender quando a escola pergunta de onde vem. */
    norma: 'REN ANEEL 1.000/2021, art. 343 · CDC art. 52, §1º',
    diasNaoUteisTolerados: caiuEmDiaNaoUtil(base),
  };
}

module.exports = {
  CHAVE,
  CLAUSULA_DE_QUITACAO,
  MULTA_DE_MORA,
  JUROS_AO_MES,
  encargos,
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
  reaisDe,
  situacaoDaEscola,
  devidoDoMes,
  instanteDoEnsaio,
  mesInicialDoEnsaio,
  mudancaDePlano,
  extraDoContrato,
  fraseDaSituacao,
};
