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
const segredo = require('./segredo.js');

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

/* ══════════════════════════════════════════════════════════════════════════════════════════════
 * F2 — O ACESSO DELE, E O LINK DE UMA VISITA (25/11/2026)
 *
 * «O consultor vai gerar esse link para N escolas que ele consultar e fizer a implementação.»
 *
 * DUAS ESPÉCIES DE TOKEN, e não uma. O **acesso** é o endereço dele em
 * `lastro.padd.com.br/consultor/<token>`: quem o tem entra na área dele, e é ela que lho manda ao
 * activar. O **link da visita** é o que ele manda à escola: abre a criação de UMA escola, no plano
 * consultoria, atribuída a ele. São segredos diferentes com públicos diferentes — o primeiro é do
 * consultor, o segundo passa por WhatsApp e por e-mail —, e por isso são âmbitos diferentes no
 * `segredo.js`: um token de um nunca confere no outro.
 *
 * O QUE O TOKEN CARREGA, nas palavras dela: «ele vai dizer quem é o consultor, qual é a escola que
 * ele tá atendendo, vai dizer também qual é a praça desse consultor e vai dizer também que ele é
 * acesso único, só pode ser feito uma vez.» Três dessas quatro coisas NÃO vão no token — e é de
 * propósito:
 *
 *   - **quem é o consultor** e **a praça** vivem no REGISTO, e o token é só a chave que lá chega.
 *     Um token que carregasse o nome (`?consultor=joao`) seria forjável por quem soubesse escrever
 *     `joao`;
 *   - **qual é a escola** é o que a escola escreve depois de abrir o link — o consultor declara um
 *     nome provisório (`escolaNome`), mas quem dá o nome final é quem cria;
 *   - **acesso único** é uma propriedade do REGISTO (`usadaEm`), não do token: um token que
 *     carregasse «já foi usado» estaria a mentir no dia em que fosse usado.
 *
 * A VISITA É UMA COISA, E NÃO UM PARÂMETRO. Um `?consultor=` no link responderia à atribuição e a
 * mais nada; não responderia a «quantas visitas ele marcou», «quantas deram escola», «quando é que
 * esta expira» — que são as três perguntas que a página dele faz e que os R$ 10 vão cobrar.
 * ══════════════════════════════════════════════════════════════════════════════════════════════ */

/** Os dois âmbitos do `segredo.js` que este módulo usa. */
const AMBITO_DO_ACESSO = 'acesso';
const AMBITO_DO_LINK = 'visita';

/**
 * QUANTOS DIAS UM LINK DE VISITA VALE — trinta, que é a decisão Q5 do plano.
 *
 * É o mesmo prazo de um mês de demonstração, e não é coincidência: o link existe para abrir um mês,
 * e um link que continuasse a abrir depois do mês teria uma vida que o produto não tem. Um link que
 * não expira é uma porta que ninguém volta a fechar.
 */
const DIAS_DO_LINK = 30;

/**
 * O TECTO DE VISITAS DE UM CONSULTOR — e aqui ele **recusa**, em vez de deixar cair o mais antigo.
 *
 * A lista de consultores (duzentos) deixa cair o mais antigo e diz quantos caíram; esta não pode
 * fazer isso. Uma visita que deu escola é uma linha do LIVRO dos R$ 10 (`F4`), e uma lista que
 * apagasse a mais antiga estaria a apagar uma dívida em silêncio — o pior desfecho possível para um
 * dado de dinheiro. Recusar é visível, recuperável, e cabe numa frase.
 *
 * MIL é um número que não se alcança: a dez escolas por mês, são oito anos.
 */
const MAXIMO_DE_VISITAS = 1000;

/** A chave do livro de visitas de UM consultor — uma leitura para a área dele, e nenhuma enumeração. */
function chaveDasVisitas(id) {
  const alvo = String(id || '').trim();
  return alvo ? 'consultores/visitas/' + alvo : '';
}

/**
 * O ESTADO DE UMA VISITA — **calculado**, e não guardado.
 *
 * É a mesma disciplina da `expirada` do plano consultoria: uma data guardada como estado precisa de
 * um relógio que a mude, e não há cron nesta casa. Calculado, o estado nunca está velho — e não há
 * um segundo sítio onde a mesma verdade possa ser escrita mal.
 *
 * A ORDEM DAS PERGUNTAS É A ORDEM EM QUE O USO DEIXA DE SER POSSÍVEL: já deu escola (o link está
 * gasto, e nenhuma data o devolve), expirou, ou está aberta.
 */
function estadoDaVisita(visita, agora) {
  if (!visita) return 'inexistente';
  if (visita.usadaEm) return 'criada';
  const expira = Date.parse(visita.expiraEm || '');
  const referencia = agora ? new Date(agora).getTime() : Date.now();
  /* UM LINK SEM PRAZO LEGÍVEL É UM LINK EXPIRADO. A direcção do erro é a que fecha: um `expiraEm`
   * que não se lê (ausente, corrompido) não pode valer para sempre por omissão. */
  if (!Number.isFinite(expira) || expira <= referencia) return 'expirada';
  return 'aberta';
}

/**
 * A VISÃO PÚBLICA DE UMA VISITA — o que pode sair daqui para um cliente.
 *
 * O `tokenHash` NÃO SAI. Não é o token, mas é o que há de mais próximo dele, e um cliente que não
 * precisa dele não deve recebê-lo: o hash de um link vivo é uma peça a menos para quem o quisesse
 * forçar. É a mesma disciplina de nunca devolver o `cofre` numa resposta de listagem — o que não é
 * necessário não se envia, porque o que se envia fica nos registos de quem o recebeu.
 */
function visaoDaVisita(visita, agora) {
  if (!visita) return null;
  return {
    id: visita.id,
    escolaNome: visita.escolaNome || '',
    cidade: visita.cidade || '',
    previstaPara: visita.previstaPara || null,
    criadaEm: visita.criadaEm || null,
    expiraEm: visita.expiraEm || null,
    escolaSlug: visita.escolaSlug || null,
    reemissoes: Number(visita.reemissoes) || 0,
    estado: estadoDaVisita(visita, agora),
  };
}

/** O estado em palavras, para a página — e a frase diz o que fazer a seguir. */
function estadoDaVisitaEmTexto(visita, agora) {
  const estado = estadoDaVisita(visita, agora);
  if (estado === 'criada') return 'a escola nasceu';
  if (estado === 'expirada') return 'expirado';
  if (estado === 'aberta') return 'aberto';
  return '—';
}

/** O dia (AAAA-MM-DD) ou `null` — e um formato inválido é recusado, não convertido em `null` calado. */
function normalizarData(valor, { de = 'data prevista' } = {}) {
  const bruto = String(valor == null ? '' : valor).trim();
  if (!bruto) return { ok: true, valor: null };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(bruto);
  if (!m) return { ok: false, erro: 'a ' + de + ' tem de ser um dia no formato AAAA-MM-DD' };
  const instante = Date.parse(bruto + 'T12:00:00.000Z');
  if (!Number.isFinite(instante)) return { ok: false, erro: 'a ' + de + ' não é um dia que exista' };
  /* O `Date.parse` aceita 2026-02-31 e devolve 3 de Março. A volta ao texto é o que separa «o dia
   * que ela escreveu» de «o dia que o JavaScript arredondou». */
  const volta = new Date(instante).toISOString().slice(0, 10);
  if (volta !== bruto) return { ok: false, erro: 'a ' + de + ' não é um dia que exista' };
  return { ok: true, valor: bruto };
}

/**
 * VALIDA O QUE O CONSULTOR DECLARA ANTES DE GERAR O LINK.
 *
 * O NOME DA ESCOLA É OBRIGATÓRIO e é **provisório** — é a etiqueta com que ele reconhece a visita na
 * lista dele. Quem dá o nome definitivo à escola é quem a cria, na página do link. Sem esta etiqueta
 * ele não conseguiria distinguir duas visitas na própria lista, e «Visita 1 / Visita 2» não diria a
 * ninguém o que foi feito.
 *
 * A CIDADE E A DATA SÃO OPCIONAIS — ele marca a visita muitas vezes já dentro do carro.
 */
function validarVisita(pedido) {
  const p = pedido || {};
  const erros = [];
  const nome = cadastro.normalizarNome(p.escolaNome, { de: 'nome da escola', minimo: 2 });
  if (!nome.ok) erros.push({ campo: 'escolaNome', erro: nome.erro });
  const cidade = String(p.cidade == null ? '' : p.cidade).trim();
  const data = normalizarData(p.previstaPara);
  if (!data.ok) erros.push({ campo: 'previstaPara', erro: data.erro });
  if (erros.length) return { ok: false, erros, erro: erros[0].erro };
  return {
    ok: true,
    visita: {
      escolaNome: nome.valor,
      cidade: cidade ? cidade.slice(0, 80) : '',
      previstaPara: data.valor,
    },
  };
}

/** O ID DA VISITA — carimbo e sal, como o do consultor, e pela mesma razão: dois cliques ao mesmo tempo. */
function novoIdDeVisita(quando) {
  const carimbo = String(quando || new Date().toISOString()).replace(/[^0-9]/g, '').slice(0, 14);
  const sal = Math.random().toString(16).slice(2, 6);
  return 'v-' + carimbo + '-' + sal;
}

/** LÊ AS VISITAS do que estava guardado, e deita fora o que não é visita (id e nome da escola). */
function lerVisitas(bruto) {
  if (!bruto) return [];
  let dados;
  try {
    dados = typeof bruto === 'string' ? JSON.parse(bruto) : bruto;
  } catch (erro) {
    return [];
  }
  if (!Array.isArray(dados)) return [];
  return dados.filter((v) => v && typeof v === 'object' && v.id && String(v.escolaNome || '').trim());
}

/**
 * ACRESCENTA UMA VISITA — e recusa quando o livro está cheio, em vez de deixar cair a mais antiga.
 * Ver `MAXIMO_DE_VISITAS`: aqui a visita é uma linha de dinheiro, e dinheiro não se apaga em silêncio.
 */
function acrescentarVisita(lista, visitaValida, hash, quando) {
  const actual = Array.isArray(lista) ? lista.slice() : [];
  const v = visitaValida || {};
  if (!v.escolaNome) return { ok: false, erro: 'informe o nome da escola' };
  if (!hash) return { ok: false, erro: 'segredo: o link nasceu sem hash — não foi guardado nada' };
  if (actual.length >= MAXIMO_DE_VISITAS) {
    return {
      ok: false,
      cheio: true,
      erro: 'este consultor já tem ' + MAXIMO_DE_VISITAS + ' visitas registadas, e o livro não se '
        + 'apaga — cada visita é uma linha de dinheiro. Escreva para a administração do Sistema Lastro.',
    };
  }
  const em = String(quando || new Date().toISOString());
  const registo = {
    id: novoIdDeVisita(em),
    escolaNome: v.escolaNome,
    cidade: v.cidade || '',
    previstaPara: v.previstaPara || null,
    tokenHash: hash,
    criadaEm: em,
    expiraEm: segredo.validadeDe(em, DIAS_DO_LINK),
    usadaEm: null,
    escolaSlug: null,
    reemissoes: 0,
    historico: [{ em, o: 'criada' }],
  };
  return { ok: true, visita: registo, lista: actual.concat([registo]) };
}

/** Uma visita pelo id, ou `null`. */
function porVisita(lista, id) {
  const alvo = String(id || '').trim();
  if (!alvo) return null;
  return (Array.isArray(lista) ? lista : []).find((v) => v && v.id === alvo) || null;
}

/**
 * REEMITE O LINK DE UMA VISITA — o segundo endereço para a mesma visita.
 *
 * PORQUE ISTO EXISTE, e é a consequência de guardar só o hash: o link aparece **uma vez**, no momento
 * em que nasce, e não há como o mostrar outra vez — o servidor não o sabe. Sem reemissão, um link
 * perdido (o WhatsApp apagado, o telemóvel trocado) seria uma visita que nunca pode dar escola, e a
 * lista dele encher-se-ia de fantasmas.
 *
 * O QUE NÃO SE REEMITE: uma visita cuja escola já nasceu. Aí o link cumpriu o que tinha a cumprir, e
 * um segundo endereço para a mesma visita seria um segundo caminho para a mesma escola.
 *
 * O PRAZO CONTA DE NOVO. Um link novo com o prazo do antigo não serviria a ninguém — a reemissão é
 * um gesto de hoje, e vale trinta dias a partir de hoje.
 */
function reemitirLink(lista, id, hash, quando) {
  const actual = Array.isArray(lista) ? lista.slice() : [];
  const i = actual.findIndex((v) => v && v.id === String(id || '').trim());
  if (i === -1) return { ok: false, erro: 'não há visita com este id — recarregue a página' };
  const visita = actual[i];
  if (visita.usadaEm) {
    return { ok: false, gasto: true, erro: 'esta visita já deu escola — o link cumpriu o que tinha a cumprir' };
  }
  if (!hash) return { ok: false, erro: 'segredo: o link nasceu sem hash — não foi guardado nada' };
  const em = String(quando || new Date().toISOString());
  const novo = Object.assign({}, visita, {
    tokenHash: hash,
    expiraEm: segredo.validadeDe(em, DIAS_DO_LINK),
    reemissoes: (Number(visita.reemissoes) || 0) + 1,
    historico: (Array.isArray(visita.historico) ? visita.historico.slice() : []).concat([{ em, o: 'link-reemitido' }]),
  });
  const copia = actual.slice();
  copia[i] = novo;
  return { ok: true, visita: novo, lista: copia };
}

/**
 * O RESUMO DA ÁREA DELE — quatro números, e cada um responde a uma pergunta que ele faz.
 *
 * `abertas` é «quantos links ainda podem abrir uma escola»; `criadas` é «quantas escolas nasceram»;
 * `expiradas` é «quantos links se perderam» — e é o número que ele tem de ver, porque um link
 * perdido é uma visita que ele fez e não vai contar. `escolas` é o mesmo que `criadas`, dito na
 * palavra dela («quantas escolas nasceram»), e não se soma à parte.
 */
function resumoDasVisitas(lista, agora) {
  const todas = Array.isArray(lista) ? lista : [];
  let abertas = 0;
  let criadas = 0;
  let expiradas = 0;
  for (const v of todas) {
    const estado = estadoDaVisita(v, agora);
    if (estado === 'aberta') abertas += 1;
    else if (estado === 'criada') criadas += 1;
    else if (estado === 'expirada') expiradas += 1;
  }
  return { total: todas.length, abertas, criadas, expiradas, escolas: criadas };
}

/* ── o acesso dele ──────────────────────────────────────────────────────────────────────────── */

/**
 * O CONSULTOR QUE ESTE TOKEN ABRE — ou `null`.
 *
 * A COMPARAÇÃO É SOBRE O HASH, e é uma comparação de cadeias iguais: o token nunca é guardado, e o
 * que se procura na lista é o hash. Um `hash` vazio não encontra ninguém — é a guarda que impede
 * que um registo sem acesso (o de um consultor que nunca foi activado) seja aberto por um token
 * vazio.
 */
function porAcesso(lista, hash) {
  const alvo = String(hash || '');
  if (!alvo) return null;
  return (Array.isArray(lista) ? lista : []).find((r) => r && String(r.acessoHash || '') === alvo) || null;
}

/**
 * DÁ (OU TROCA) O ENDEREÇO DE ACESSO — e a troca é um elo datado, como o activar.
 *
 * O HASH ANTIGO É SUBSTITUÍDO, e não guardado ao lado: dois endereços válidos para a mesma pessoa
 * são duas portas onde ela pediu uma, e a que ela não usa é a que fica abertas para quem a encontrar
 * num WhatsApp antigo. «Se guarda, se troca, e se revoga desactivando» — a troca é isto.
 *
 * Um consultor INACTIVO não recebe endereço: o acesso dele nasce do «Activar», e um endereço emitido
 * fora desse gesto seria uma porta aberta por uma rota que ninguém olhou.
 */
function darAcesso(lista, id, hash, quando) {
  const actual = Array.isArray(lista) ? lista.slice() : [];
  const i = actual.findIndex((r) => r && r.id === String(id || '').trim());
  if (i === -1) return { ok: false, erro: 'não há consultor com este id — recarregue a lista', status: 404 };
  const registo = actual[i];
  if (!estaAtivo(registo)) {
    return { ok: false, inativo: true, erro: 'este consultor está inactivo — active-o primeiro, e o endereço nasce desse gesto' };
  }
  if (!hash) return { ok: false, erro: 'segredo: o endereço nasceu sem hash — não foi guardado nada' };
  const em = String(quando || new Date().toISOString());
  const novo = Object.assign({}, registo, {
    acessoHash: hash,
    acessoEm: em,
    atualizadoEm: em,
    historico: (Array.isArray(registo.historico) ? registo.historico.slice() : []).concat([{ em, o: 'acesso-emitido' }]),
  });
  const copia = actual.slice();
  copia[i] = novo;
  return { ok: true, registo: novo, lista: copia };
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
  /* F2 — o acesso dele e o link de uma visita */
  AMBITO_DO_ACESSO,
  AMBITO_DO_LINK,
  DIAS_DO_LINK,
  MAXIMO_DE_VISITAS,
  chaveDasVisitas,
  estadoDaVisita,
  estadoDaVisitaEmTexto,
  visaoDaVisita,
  normalizarData,
  validarVisita,
  novoIdDeVisita,
  lerVisitas,
  acrescentarVisita,
  porVisita,
  reemitirLink,
  resumoDasVisitas,
  porAcesso,
  darAcesso,
};
