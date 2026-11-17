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
function situacaoDaEscola({ escola, contrato, livro, agora } = {}) {
  const slug = String(escola || '').trim();
  const c = contrato || {};
  const hoje = agora ? new Date(agora) : new Date();
  const hojeIso = hoje.toISOString();
  const mesDeHoje = competencia(hojeIso);

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
    const venceu = vencimento ? (vencimento + 'T23:59:59') < hojeIso : false;
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
    extensoes: Array.isArray(c.extensoes) ? c.extensoes : [],
    estadoComercial: c.estado || null,
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
  fraseDaSituacao,
};
