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
 * AS EXTENSÕES QUE A PESSOA ESCOLHEU, conferidas contra o plano (16/11/2026).
 *
 * O CATÁLOGO DIZ QUE A ESCOLHA EXISTE, e até aqui ninguém a fazia: «É o cliente que escolhe se
 * quer gerar ou só configurar» está escrito na descrição da extensão `turma-pronta-conteudo`. O
 * plano que inclui as duas (`avancado`) oferecia-as as duas, sempre, e a escola ficava com a mais
 * completa sem ninguém a ter pedido — ou sem poder ficar só com a mais simples.
 *
 * A REGRA É A MESMA DO RESTO DO MÓDULO: a página propõe, o servidor decide. Uma extensão que o
 * plano não inclui é RECUSADA com o nome dela (não é ignorada em silêncio: quem pediu tem de
 * saber que não ficou com o que pediu). Sem lista nenhuma, o comportamento antigo mantém-se — e é
 * ele que a criação pelo formulário público e as recriações de antes desta mudança usam.
 */
function extensoesEscolhidas(planoId, pedidas) {
  const incluidas = extensoesDoPlano(planoId);
  if (!Array.isArray(pedidas) || !pedidas.length) {
    return { ok: true, extensoes: incluidas.map((e) => e.id) };
  }
  const queridas = [];
  for (const bruto of pedidas) {
    const alvo = String(bruto == null ? '' : bruto).trim().toLowerCase();
    if (!alvo) continue;
    const achada = incluidas.find((e) => String(e.id).toLowerCase() === alvo);
    if (!achada) {
      const existe = EXTENSOES.find((e) => e && String(e.id).toLowerCase() === alvo);
      return {
        ok: false,
        erro: existe
          ? 'a extensão «' + alvo + '» não está incluída no plano «' + planoId + '»'
          : 'a extensão «' + alvo + '» não existe no catálogo',
      };
    }
    if (queridas.indexOf(achada.id) === -1) queridas.push(achada.id);
  }
  /* A ORDEM É A DO CATÁLOGO, e não a do pedido: duas escolas com as mesmas extensões têm de
   * ficar com o mesmo registo, senão comparar duas linhas do painel passa a ser ler duas ordens. */
  return { ok: true, extensoes: incluidas.filter((e) => queridas.indexOf(e.id) !== -1).map((e) => e.id) };
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
  const extensoes = extensoesEscolhidas(plano.id, p.extensoes);
  if (!extensoes.ok) return { ok: false, erro: extensoes.erro };
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
      extensoes: extensoes.extensoes,
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
  extensoesEscolhidas,
  lotesDe,
  calcular,
  validarEscolha,
  catalogoDaPagina,
  ASSINATURAS,
  EXTENSOES,
};
