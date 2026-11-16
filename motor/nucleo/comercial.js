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

/** O catálogo como a página o recebe: sem os campos internos de nota. */
function catalogoDaPagina() {
  return {
    moeda: CATALOGO.moeda,
    moeda_simbolo: CATALOGO.moeda_simbolo,
    periodicidade: CATALOGO.periodicidade,
    assinaturas: ASSINATURAS.map((a) => ({
      id: a.id, nome: a.nome, preco: a.preco, precoTexto: precoEmTexto(a.preco),
      professores: a.professores, alunos: a.alunos, consultas: a.consultas,
      resumo: a.resumo, inclui: a.inclui || [],
    })),
    lotes: { professores: lotesDe('professores'), alunos: lotesDe('alunos') },
    extensoes: EXTENSOES.map((e) => ({
      id: e.id, nome: e.nome, descricao: e.descricao, em: e.em, preco: e.preco,
    })),
  };
}

module.exports = {
  centavos,
  reais,
  precoEmTexto,
  assinaturaPorId,
  extensoesDoPlano,
  lotesDe,
  calcular,
  validarEscolha,
  catalogoDaPagina,
  ASSINATURAS,
  EXTENSOES,
};
