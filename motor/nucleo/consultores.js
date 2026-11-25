'use strict';

/**
 * consultores.js — QUEM ATENDE AS ESCOLAS (25/11/2026).
 *
 * O QUE ELA DESENHOU, na letra: «vou pôr o nome, o CPF e o CNPJ, os equipamentos que ele precisa
 * ter, carro e habilitação e computador próprio, um notebook próprio. E aí um botão de ativar ou
 * desativar e um status para saber se ele está ativo ou não.»
 *
 * E a razão de isto existir, dita por ela duas vezes: «ele é uma forma de eu saber que o consultor
 * tá trabalhando» e «assim eu não faço confusão, não vou premiar um consultor pelo mérito de outro
 * consultor». O cadastro não é um directório de contactos: é a **identidade que atribui** — é ela
 * que o link leva, e é ela que um dia sustenta uma meta.
 *
 * ESTE MÓDULO É PURO. Não lê KV, não fala com o GitHub, não conhece página nenhuma: recebe o corpo
 * de um pedido e devolve «cabe» ou «não cabe, e porquê»; recebe uma lista e devolve a lista com um
 * estado mudado. Quem guarda é o chamador (`motor/servidor/consultores-da-casa.js`), e quem mostra
 * é o painel. É a mesma divisão do `cotas.js` e do `contato.js`, e pela mesma razão: uma regra em
 * dois sítios é uma regra com duas respostas, e a que responde mal é sempre a que ninguém olha.
 *
 * ── O QUE O REGISTO GUARDA, E O QUE NÃO GUARDA ────────────────────────────────────────────────
 *
 * GUARDA o nome, o documento, a praça, os contactos, o equipamento declarado e o estado.
 *
 * NÃO GUARDA **o token de acesso** — e não é esquecimento: o token nasce na área dele (F2), e o
 * que se guarda é o HASH, como no convite de recriação. Este módulo não conhece token nenhum, e
 * essa ausência é a garantia de que um registo de consultor lido do KV não abre porta nenhuma.
 *
 * NÃO GUARDA **a senha de nada**. O consultor não tem senha no sistema: o que ele tem é um
 * endereço com um token, e um endereço revoga-se desactivando.
 */

const cadastro = require('./cadastro-da-escola.js');

/**
 * A CHAVE DO REGISTO — uma só, e uma lista.
 *
 * PORQUE É UMA LISTA E NÃO UMA CHAVE POR CONSULTOR. São poucos (é uma pessoa, ou um punhado), e a
 * lista lê-se numa leitura só — enquanto uma chave por consultor obrigaria a uma ENUMERAÇÃO
 * (`list`), que é a operação do KV limitada por dia. Foi a cota da enumeração que já apagou a
 * lista de fichas uma vez (18/10/2026), e essa lição está paga.
 *
 * O tecto existe pela mesma razão do `contato.js`: sem tecto, a chave cresce para sempre, e um
 * valor de KV tem 25 MiB. Duzentos consultores são muitos anos; o mais antigo sai quando entra o
 * duzentos e um — e o que sai fica dito no `historico` do que ficou? Não. Sai, e o painel diz
 * quantos foram retirados, porque um limite que apaga em silêncio é uma mentira por omissão.
 */
const CHAVE = 'consultores/registos';
const MAXIMO_NA_LISTA = 200;

/** O que o equipamento pergunta — três factos, e não uma nota livre. */
const EQUIPAMENTOS = [
  { id: 'carro', rotulo: 'Carro', frase: 'tem carro para as visitas' },
  { id: 'habilitacao', rotulo: 'Habilitação', frase: 'tem habilitação válida' },
  { id: 'notebook', rotulo: 'Notebook próprio', frase: 'tem notebook próprio para a consultoria' },
];

/** Os dois estados, e só dois. Não há «suspenso» nem «a analisar»: ou ele atende, ou não atende. */
const ATIVO = 'ativo';
const INATIVO = 'inativo';
const ESTADOS = [ATIVO, INATIVO];

/**
 * O ID DO CONSULTOR — derivado do nome e do CARIMBO, e não de uma contagem.
 *
 * Duas criações ao mesmo tempo dariam o mesmo número a duas pessoas se o id viesse de
 * `lista.length + 1` — é o mesmo cuidado que o sufixo do professor homónimo já toma. O carimbo
 * entra no id, e a colisão deixa de ser possível sem uma consulta.
 */
function novoId(nome, quando) {
  const base = String(nome || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'consultor';
  const carimbo = String(quando || new Date().toISOString())
    .replace(/[^0-9]/g, '').slice(0, 14);
  const sal = Math.random().toString(16).slice(2, 6);
  return 'c-' + carimbo + '-' + base + '-' + sal;
}

/**
 * VALIDA O CADASTRO — e a ORDEM das perguntas é a ordem das mensagens.
 *
 * A ORDEM NÃO É ARBITRÁRIA: pergunta-se pelo nome (quem é), depois pela praça (onde atende),
 * depois pelo documento (que pessoa jurídica é), e só no fim pelo equipamento. Um erro no
 * documento não deve aparecer depois de a pessoa ter marcado três caixas de equipamento.
 *
 * PELO MENOS UM DOCUMENTO, E NÃO OS DOIS. Ela pediu «o CPF e o CNPJ», e o que faz sentido é
 * **pelo menos um**: um consultor pode ser uma pessoa que factura por MEI, e nesse caso tem os
 * dois; um que não factura tem só o CPF. Exigir os dois fecharia a porta a quem dá aula e faz
 * consultoria como pessoa física — que é o caso mais provável do primeiro consultor.
 *
 * OS DOIS, QUANDO VÊM, SÃO VALIDADOS. Um CNPJ com 13 dígitos não é «preenchido a mais»: é um erro
 * de digitação que só apareceria no dia da nota fiscal.
 */
function validarCadastro(pedido) {
  const p = pedido || {};
  const erros = [];

  const nome = cadastro.normalizarNome(p.nome, { de: 'nome do consultor', minimo: 3 });
  if (!nome.ok) erros.push({ campo: 'nome', erro: nome.erro });

  /* A PRAÇA — a região onde ele atende. É dela que o token vai dizer «em que praça é esta escola»,
   * e por isso ela é exigida: um consultor sem praça não é atribuível, e um link sem praça não
   * responde à pergunta que ela vai fazer («quem está a trabalhar nesta região?»). */
  const praca = cadastro.normalizarNome(p.praca, { de: 'praça do consultor', minimo: 2 });
  if (!praca.ok) erros.push({ campo: 'praca', erro: praca.erro });

  const cpfBruto = String(p.cpf == null ? '' : p.cpf).trim();
  const cnpjBruto = String(p.cnpj == null ? '' : p.cnpj).trim();
  let cpf = { ok: true, valor: '' };
  let cnpj = { ok: true, valor: '' };
  if (cpfBruto) {
    cpf = cadastro.normalizarCpf(cpfBruto, { de: 'CPF do consultor' });
    if (!cpf.ok) erros.push({ campo: 'cpf', erro: cpf.erro });
  }
  if (cnpjBruto) {
    cnpj = cadastro.normalizarCnpj(cnpjBruto, { de: 'CNPJ do consultor' });
    if (!cnpj.ok) erros.push({ campo: 'cnpj', erro: cnpj.erro });
  }
  if (!cpfBruto && !cnpjBruto) {
    erros.push({ campo: 'cpf', erro: 'informe o CPF do consultor, ou o CNPJ se ele factura como empresa — um dos dois é obrigatório' });
  }

  const email = cadastro.normalizarEmail(p.email, { de: 'e-mail do consultor' });
  if (!email.ok) erros.push({ campo: 'email', erro: email.erro });
  const telefone = cadastro.normalizarTelefone(p.telefone, { de: 'telefone do consultor' });
  if (!telefone.ok) erros.push({ campo: 'telefone', erro: telefone.erro });

  /* O EQUIPAMENTO É DECLARADO, E NÃO VERIFICADO. Não há como o sistema saber se ele tem carro —
   * o que ele guarda é a DECLARAÇÃO, com data, e é isso que a torna auditável: «em 25/11/2026 ele
   * declarou ter carro e habilitação». Um booleano sem data seria uma memória sem autor. */
  const equipamento = {};
  for (const e of EQUIPAMENTOS) equipamento[e.id] = p.equipamento ? p.equipamento[e.id] === true : p[e.id] === true;

  if (erros.length) return { ok: false, erros, erro: erros[0].erro };
  return {
    ok: true,
    cadastro: {
      nome: nome.valor,
      praca: praca.valor,
      cpf: cpf.valor || '',
      cnpj: cnpj.valor || '',
      email: email.valor,
      telefone: telefone.valor,
      equipamento,
    },
  };
}

/**
 * COMO SE CHAMA UM CONSULTOR NUMA FRASE.
 *
 * O nome é o que ela escreveu; o documento entra entre parênteses só quando há dois consultores
 * com o mesmo nome — o que é o caso em que a frase sozinha seria ambígua. Aqui devolve-se só o
 * nome: quem precisa do desempate é o painel, e é ele que sabe se há homónimos.
 */
function nomeDoConsultor(registo) {
  return String((registo && registo.nome) || '').trim() || 'consultor sem nome';
}

/** O documento, para o painel: «CPF 123.456.789-01», «CNPJ …», ou os dois. */
function documentoEmTexto(registo) {
  const r = registo || {};
  const so = (v) => String(v || '').replace(/\D/g, '');
  const cpf = so(r.cpf);
  const cnpj = so(r.cnpj);
  const partes = [];
  if (cpf.length === 11) {
    partes.push('CPF ' + cpf.slice(0, 3) + '.' + cpf.slice(3, 6) + '.' + cpf.slice(6, 9) + '-' + cpf.slice(9));
  }
  if (cnpj.length === 14) {
    partes.push('CNPJ ' + cnpj.slice(0, 2) + '.' + cnpj.slice(2, 5) + '.' + cnpj.slice(5, 8)
      + '/' + cnpj.slice(8, 12) + '-' + cnpj.slice(12));
  }
  return partes.length ? partes.join(' · ') : '—';
}

/** O equipamento em palavras, na ordem em que ela o pediu. A ausência diz-se, não se omite. */
function equipamentoEmTexto(registo) {
  const eq = (registo && registo.equipamento) || {};
  return EQUIPAMENTOS.map((e) => e.rotulo + (eq[e.id] ? '' : ' (não)')).join(' · ');
}

/** O estado em palavras — e o `ativo` guardado é o que manda, não uma data. */
function estaAtivo(registo) {
  return Boolean(registo && registo.ativo === true);
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────
 * A LISTA — ler, acrescentar, mudar de estado
 * ───────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * LÊ A LISTA DO QUE ESTÁ GUARDADO.
 *
 * A LEITURA É TOLERANTE COM O QUE NÃO ENTENDE, e diz o que deitou fora: um registo sem nome e sem
 * documento não é um consultor, é lixo — e um lixo que passasse adiante apareceria como uma linha
 * vazia na tabela, que é a pior forma de descobrir um dado corrompido. O que se filtra é o mínimo
 * que faz de uma entrada um consultor: um id e um nome.
 */
function lerLista(bruto) {
  if (!bruto) return [];
  let dados;
  try {
    dados = typeof bruto === 'string' ? JSON.parse(bruto) : bruto;
  } catch (erro) {
    return [];
  }
  if (!Array.isArray(dados)) return [];
  return dados.filter((r) => r && typeof r === 'object' && r.id && String(r.nome || '').trim());
}

/**
 * ACRESCENTA UM CONSULTOR NOVO — **inactivo**, e é a decisão que o plano justifica.
 *
 * «Um cadastro é um dado; o acesso é uma decisão.» Se nascesse activo, um cadastro feito à pressa
 * — ou por engano — abriria a porta que o link do consultor abre. Nasce fechado, e o «Activar» é
 * um gesto separado, com data e com autor.
 *
 * RECUSA UM DOCUMENTO JÁ REGISTADO: dois consultores com o mesmo CPF são a mesma pessoa, e duas
 * fichas dariam duas atribuições para o mesmo trabalho — exactamente o que ela quer evitar quando
 * diz «não vou premiar um consultor pelo mérito de outro».
 */
function acrescentar(lista, cadastroValido, quando) {
  const actual = Array.isArray(lista) ? lista.slice() : [];
  const c = cadastroValido || {};
  const cpf = String(c.cpf || '').replace(/\D/g, '');
  const cnpj = String(c.cnpj || '').replace(/\D/g, '');
  if (cpf) {
    const igual = actual.find((r) => String(r.cpf || '').replace(/\D/g, '') === cpf);
    if (igual) {
      return { ok: false, erro: 'o CPF ' + cpf + ' já é do consultor «' + nomeDoConsultor(igual) + '» — cada CPF é uma pessoa.' };
    }
  }
  if (cnpj) {
    const igual = actual.find((r) => String(r.cnpj || '').replace(/\D/g, '') === cnpj);
    if (igual) {
      return { ok: false, erro: 'o CNPJ ' + cnpj + ' já é do consultor «' + nomeDoConsultor(igual) + '» — cada CNPJ é uma empresa.' };
    }
  }
  const em = String(quando || new Date().toISOString());
  const registo = {
    id: novoId(c.nome, em),
    nome: c.nome,
    praca: c.praca,
    cpf: cpf,
    cnpj: cnpj,
    email: c.email,
    telefone: c.telefone,
    equipamento: Object.assign({}, c.equipamento || {}, { declaradoEm: em }),
    ativo: false,
    criadoEm: em,
    atualizadoEm: em,
    /* O HISTÓRICO NASCE COM UM ELO, e um elo é um facto: «criado em …». Sem ele, o primeiro
     * «activado» seria o primeiro elo e o registo começaria a sua história a meio. */
    historico: [{ em, o: 'criado' }],
  };
  const nova = actual.concat([registo]);
  const retirados = Math.max(0, nova.length - MAXIMO_NA_LISTA);
  return {
    ok: true,
    registo,
    lista: retirados ? nova.slice(retirados) : nova,
    retirados,
  };
}

/**
 * MUDA O ESTADO — e a mudança é um ELO, não uma sobrescrita.
 *
 * «Um ajuste é um elo novo, nunca uma sobrescrita.» Activar e desactivar são actos datados, e o
 * histórico é o que permite responder, seis meses depois, a «quando é que este consultor deixou de
 * atender?» — que é a pergunta que se faz quando uma escola chegou por um link e ninguém sabe de
 * quem era.
 *
 * MUDAR PARA O MESMO ESTADO NÃO É UM ERRO, e não grava nada: um clique duplo não deve encher o
 * histórico de elos que não mudaram nada. A resposta diz que não mudou, e isso não é uma falha.
 */
function mudarEstado(lista, id, ativo, quando, motivo) {
  const actual = Array.isArray(lista) ? lista.slice() : [];
  const i = actual.findIndex((r) => r && r.id === String(id || '').trim());
  if (i === -1) return { ok: false, erro: 'não há consultor com este id — recarregue a lista' };
  const registo = actual[i];
  const querAtivo = Boolean(ativo);
  if (Boolean(registo.ativo) === querAtivo) {
    return { ok: true, mudou: false, registo, lista: actual };
  }
  const em = String(quando || new Date().toISOString());
  const elo = { em, o: querAtivo ? 'ativado' : 'desativado' };
  const razao = String(motivo == null ? '' : motivo).trim();
  if (razao) elo.motivo = razao;
  const novo = Object.assign({}, registo, {
    ativo: querAtivo,
    atualizadoEm: em,
    historico: (Array.isArray(registo.historico) ? registo.historico.slice() : []).concat([elo]),
  });
  const copia = actual.slice();
  copia[i] = novo;
  return { ok: true, mudou: true, registo: novo, lista: copia };
}

/** Um consultor pelo id, ou `null`. Lido da lista que já se tem — sem uma segunda leitura de KV. */
function porId(lista, id) {
  const alvo = String(id || '').trim();
  if (!alvo) return null;
  return (Array.isArray(lista) ? lista : []).find((r) => r && r.id === alvo) || null;
}

/**
 * O RESUMO QUE O PAINEL MOSTRA NO TOPO — e são quatro números que respondem a quatro perguntas.
 *
 * `activos` é «quem pode gerar link agora»; `inativos` é «quem está cadastrado e não atende»;
 * `pracas` é «em quantas regiões há gente» — e é o número que, no dia em que houver meta, se
 * compara com o que se vendeu. `equipamento` conta os que declararam os três, porque um consultor
 * sem carro numa praça sem transporte é uma visita que não acontece.
 */
function resumo(lista) {
  const todos = Array.isArray(lista) ? lista : [];
  const pracas = new Set();
  let activos = 0;
  let completos = 0;
  for (const r of todos) {
    if (estaAtivo(r)) activos += 1;
    const praca = String(r.praca || '').trim().toLowerCase();
    if (praca) pracas.add(praca);
    const eq = r.equipamento || {};
    if (EQUIPAMENTOS.every((e) => eq[e.id] === true)) completos += 1;
  }
  return {
    total: todos.length,
    activos,
    inativos: todos.length - activos,
    pracas: pracas.size,
    comEquipamentoCompleto: completos,
  };
}

module.exports = {
  CHAVE,
  MAXIMO_NA_LISTA,
  EQUIPAMENTOS,
  ATIVO,
  INATIVO,
  ESTADOS,
  novoId,
  validarCadastro,
  nomeDoConsultor,
  documentoEmTexto,
  equipamentoEmTexto,
  estaAtivo,
  lerLista,
  acrescentar,
  mudarEstado,
  porId,
  resumo,
};
