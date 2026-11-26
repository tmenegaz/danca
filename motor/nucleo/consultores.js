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

/* ══════════════════════════════════════════════════════════════════════════════════════════════
 * F3 — O LINK QUE ABRE UMA ESCOLA (25/11/2026)
 *
 * «Depois que eu terminar o processo, a escola pode contratar o serviço ou não. […] Eu vou deixar
 * para a escola esse ambiente configurado com o nome dela, disponível para ela usar por um mês.»
 *
 * UMA VISITA, UMA ESCOLA. É a regra inteira desta metade do módulo, e ela tem três consequências que
 * precisam de código:
 *
 *   1. O link GASTA-SE na primeira criação que passa (`usadaEm` + `escolaSlug`). Um segundo pedido
 *      com o mesmo link encontra a visita gasta e é recusado.
 *   2. O link RESERVA-SE antes de a escola nascer, e a reserva é o que impede o caso que dois
 *      pedidos simultâneos produziriam: dois leitores a verem `usadaEm: null` ao mesmo tempo, e duas
 *      escolas a nascerem de um link só. Um link que dá duas escolas é um consultor a receber por um
 *      trabalho que não fez — e é exactamente o que ela quer que não aconteça («não vou premiar um
 *      consultor pelo mérito de outro»).
 *   3. A reserva CAI quando a criação falha, e cai sozinha depois de `MINUTOS_DE_RESERVA`: um pedido
 *      que morreu a meio (o telemóvel perdeu a rede) não pode queimar o link para sempre. O prazo é
 *      curto porque a criação leva segundos; é longo o bastante para o pior caso de uma rede má.
 * ══════════════════════════════════════════════════════════════════════════════════════════════ */

/**
 * QUANTOS MINUTOS UMA RESERVA VALE.
 *
 * Dez: uma criação de escola leva segundos (o trabalho pesado é o workflow, que corre depois), e o
 * pior caso de uma rede má não chega a isto. Curto de mais queimaria links a quem tem má rede;
 * longo de mais deixaria um link preso por uma hora a quem desistiu a meio.
 */
const MINUTOS_DE_RESERVA = 10;

/** A CHAVE DO ÍNDICE DE LINKS — um `get` por abertura, e nunca uma enumeração. */
function chaveDoLink(hash) {
  const alvo = String(hash || '').trim();
  return alvo ? 'consultores/link/' + alvo : '';
}

/** A reserva ainda vale? Uma reserva sem data legível vale como caída — a direcção do erro é a que abre. */
function reservaActiva(visita, agora) {
  if (!visita || !visita.reservadaEm) return false;
  const em = Date.parse(visita.reservadaEm);
  if (!Number.isFinite(em)) return false;
  const referencia = agora ? new Date(agora).getTime() : Date.now();
  return referencia - em < MINUTOS_DE_RESERVA * 60 * 1000;
}

/**
 * O ESTADO DE UM LINK, DO PONTO DE VISTA DE QUEM O ABRE — uma resposta, e não três.
 *
 * A ORDEM É A ORDEM EM QUE A PORTA SE FECHA, e ela é a mesma do `estadoDaVisita` mais a reserva:
 * gasta (a escola já nasceu), reservada (uma criação está a decorrer), expirada, e só então aberta.
 *
 * `motivo` é a FRASE que a escola lê. Cada uma diz a saída, e não o erro: quem abre este link está a
 * criar uma escola, e uma recusa sem saída manda desistir uma pessoa que já pagou três horas de
 * consultoria para chegar aqui.
 */
function estadoDoLink(visita, agora) {
  if (!visita) return { ok: false, motivo: MOTIVO_DO_LINK_INVALIDO };
  const expira = Date.parse(visita.expiraEm || '');
  const referencia = agora ? new Date(agora).getTime() : Date.now();
  if (visita.usadaEm) {
    return {
      ok: false,
      estado: 'gasta',
      motivo: 'este link já foi usado, e uma escola nasceu dele em '
        + String(visita.usadaEm).slice(0, 10) + '. Cada link abre uma escola, e só uma — se esta '
        + 'escola precisa de outra, peça ao consultor um link novo.',
    };
  }
  if (reservaActiva(visita, agora)) {
    return {
      ok: false,
      estado: 'reservada',
      motivo: 'este link está a ser usado neste momento. Se foi você que o abriu, espere um minuto '
        + 'e recarregue a página; se a criação falhou, o link volta a funcionar sozinho.',
    };
  }
  if (!Number.isFinite(expira) || expira <= referencia) {
    return {
      ok: false,
      estado: 'expirada',
      motivo: 'este link de demonstração expirou'
        + (Number.isFinite(expira) ? ' a ' + new Date(expira).toISOString().slice(0, 10) : '')
        + '. Peça ao consultor um link novo — ele gera outro na área dele em segundos.',
    };
  }
  return { ok: true, estado: 'aberta', expiraEm: visita.expiraEm };
}

/**
 * A FRASE DO LINK INVÁLIDO — uma só, e sem distinguir «não existe» de «existe e não é seu».
 *
 * Distinguir os casos só ajudaria a quem está a adivinhar tokens. E o que a escola precisa de saber
 * é o mesmo nos dois: o link não abre, e a quem pedir outro.
 */
const MOTIVO_DO_LINK_INVALIDO = 'este link não abre nenhuma escola. Confirme que copiou o endereço '
  + 'inteiro da mensagem, e peça um novo ao consultor que o atendeu.';

/** Reserva a visita para esta criação. Devolve a lista nova, ou `{ ok: false }` se ela já não serve. */
function reservarVisita(lista, visitaId, agora) {
  const actual = Array.isArray(lista) ? lista.slice() : [];
  const i = actual.findIndex((v) => v && v.id === String(visitaId || '').trim());
  if (i === -1) return { ok: false, erro: 'não há visita com este id' };
  const visita = actual[i];
  const estado = estadoDoLink(visita, agora);
  if (!estado.ok) return { ok: false, estado: estado.estado, erro: estado.motivo };
  const em = String(agora || new Date().toISOString());
  const novo = Object.assign({}, visita, {
    reservadaEm: em,
    historico: (Array.isArray(visita.historico) ? visita.historico.slice() : []).concat([{ em, o: 'reservada' }]),
  });
  const copia = actual.slice();
  copia[i] = novo;
  return { ok: true, visita: novo, lista: copia };
}

/**
 * MARCA A VISITA GASTA — e é o elo que diz qual escola nasceu dela.
 *
 * `escolaSlug` é o que responde, seis meses depois, a «esta escola veio de quem?» sem ter de
 * percorrer o livro de visitas de todos os consultores. A reserva cai no mesmo gesto: são o mesmo
 * facto visto de dois ângulos, e guardar as duas coisas separadas deixaria uma reserva pendurada
 * numa visita já gasta.
 */
function marcarVisitaUsada(lista, visitaId, escolaSlug, agora) {
  const actual = Array.isArray(lista) ? lista.slice() : [];
  const i = actual.findIndex((v) => v && v.id === String(visitaId || '').trim());
  if (i === -1) return { ok: false, erro: 'não há visita com este id' };
  const em = String(agora || new Date().toISOString());
  const novo = Object.assign({}, actual[i], {
    usadaEm: em,
    escolaSlug: String(escolaSlug || '').trim() || null,
    historico: (Array.isArray(actual[i].historico) ? actual[i].historico.slice() : [])
      .concat([{ em, o: 'escola-criada', escola: String(escolaSlug || '').trim() || null }]),
  });
  delete novo.reservadaEm;
  const copia = actual.slice();
  copia[i] = novo;
  return { ok: true, visita: novo, lista: copia };
}

/** LARGA A RESERVA — a criação falhou, e o link tem de voltar a servir para quem o tentar outra vez. */
function largarReserva(lista, visitaId, agora) {
  const actual = Array.isArray(lista) ? lista.slice() : [];
  const i = actual.findIndex((v) => v && v.id === String(visitaId || '').trim());
  if (i === -1) return { ok: false, erro: 'não há visita com este id' };
  const em = String(agora || new Date().toISOString());
  const novo = Object.assign({}, actual[i], {
    historico: (Array.isArray(actual[i].historico) ? actual[i].historico.slice() : [])
      .concat([{ em, o: 'reserva-libertada' }]),
  });
  delete novo.reservadaEm;
  const copia = actual.slice();
  copia[i] = novo;
  return { ok: true, visita: novo, lista: copia };
}

/* ══════════════════════════════════════════════════════════════════════════════════════════════
 * F4 — O LIVRO DOS R$ 10 (25/11/2026)
 *
 * «Cada vez que ele fizer a consultoria e rodar uma aula, rodar lá, criar um professor e tudo mais,
 * qualquer outra coisa, R$ 10 já me paga.»
 *
 * UM LIVRO, E NÃO UMA COBRANÇA. O sistema não tem como cobrar: não há cartão, não há débito, não há
 * conta do consultor. O que ele pode fazer — e é o que serve — é dizer a verdade sobre o que é
 * devido, e guardar o que já foi recebido.
 *
 * A FORMA É A DO CONTADOR DE AULAS, e é a decisão que faz este módulo pequeno: **o devido é
 * DERIVADO, o recebido é GUARDADO**. Uma visita que deu escola (`usadaEm`) deve uma taxa; contar as
 * visitas é contar factos que já existem, e guardar o total ao lado delas seria um segundo número a
 * divergir do primeiro — a família de erro que esta casa persegue desde o `-dados.json`. O que não se
 * pode derivar é o acto de receber: esse é um elo, com data e nota, e vive no seu próprio registo.
 *
 * O QUE NÃO SE PAGA: uma visita expirada sem escola. Não houve consultoria, houve um link. A frase é
 * dela e está certa — «com êxito ou sem êxito» fala da consultoria que ACONTECEU, e uma visita que
 * ninguém abriu é um link que se perdeu.
 * ══════════════════════════════════════════════════════════════════════════════════════════════ */

/** A chave dos recebimentos de UM consultor — a mesma forma das visitas, e pela mesma razão. */
function chaveDosRecebimentos(id) {
  const alvo = String(id || '').trim();
  return alvo ? 'consultores/recebidos/' + alvo : '';
}

/**
 * A TAXA DE UMA CONSULTORIA, em centavos — lida do catálogo, e nunca de uma constante daqui.
 *
 * Uma constante neste ficheiro seria o terceiro sítio (o catálogo, o guião e o código), e o guião já
 * tem prova a compará-lo com o catálogo. Devolve `null` quando o catálogo não a declara: um livro
 * que inventasse uma taxa de zero diria «não deves nada», que é pior do que «não sei».
 */
function taxaDaConsultoria() {
  const c = require('../../biblioteca/comercial/planos.json').consultoria || {};
  const n = Number(c.taxaCentavos);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** LÊ OS RECEBIMENTOS do que estava guardado, e deita fora o que não é um elo. */
function lerRecebimentos(bruto) {
  if (!bruto) return [];
  let dados;
  try {
    dados = typeof bruto === 'string' ? JSON.parse(bruto) : bruto;
  } catch (erro) {
    return [];
  }
  if (!Array.isArray(dados)) return [];
  return dados.filter((e) => e && typeof e === 'object' && Number.isFinite(Number(e.centavos)) && Number(e.centavos) > 0);
}

/**
 * QUANTO ESTE CONSULTOR DEVE, HOJE — derivado das visitas.
 *
 * A visita conta quando tem `usadaEm` e uma escola: é o sinal de que a consultoria ACONTECEU e a
 * escola nasceu. Conta pelo `usadaEm` (o instante em que a escola nasceu), e não pela data da visita,
 * porque é esse o facto que o livro regista — a mesma escolha do contador de aulas, que conta pela
 * data da aula e não pelo dia do lançamento.
 */
function devidas(visitas, taxa) {
  const t = Number(taxa);
  const preco = Number.isFinite(t) && t > 0 ? Math.round(t) : 0;
  const lista = Array.isArray(visitas) ? visitas : [];
  const pagas = lista.filter((v) => v && v.usadaEm && v.escolaSlug);
  return {
    quantidade: pagas.length,
    centavos: pagas.length * preco,
    taxaCentavos: preco || null,
    /* AS VISITAS QUE DERAM ESCOLA, para o painel poder nomear cada uma. Uma linha de dinheiro sem
     * saber de onde vem é uma linha que ninguém consegue conferir. */
    linhas: pagas.map((v) => ({
      visitaId: v.id,
      escolaNome: v.escolaNome || '',
      escolaSlug: v.escolaSlug || null,
      em: v.usadaEm,
    })),
  };
}

/**
 * O RESUMO DO LIVRO: devido, recebido, e o que falta.
 *
 * `saldo` pode ser NEGATIVO, e isso não é um erro a esconder: significa que ele pagou a mais (um
 * pagamento adiantado, ou um engano num valor). Mostrá-lo é mais honesto do que truncar em zero — um
 * zero esconderia o engano, e a única forma de o corrigir é vê-lo.
 */
function resumoDoLivro(visitas, recebimentos, taxa) {
  const d = devidas(visitas, taxa === undefined ? taxaDaConsultoria() : taxa);
  const elos = Array.isArray(recebimentos) ? recebimentos : [];
  const recebidoCentavos = elos.reduce((soma, e) => soma + Math.round(Number(e.centavos) || 0), 0);
  return {
    quantidadeDevida: d.quantidade,
    devidoCentavos: d.centavos,
    taxaCentavos: d.taxaCentavos,
    recebidoCentavos,
    saldoCentavos: d.centavos - recebidoCentavos,
    linhas: d.linhas,
    recebimentos: elos,
  };
}

/**
 * ACRESCENTA UM RECEBIMENTO — e recusa o que não é um recebimento.
 *
 * PORQUE É QUE RECUSA RECEBER MAIS DO QUE O SALDO. O livro é monótono: um elo não se apaga, e um
 * engano corrige-se com outro elo. Só que um «estorno» é uma coisa que ninguém desenhou ainda — não
 * há botão, não há frase, não há prova. Aceitar um valor a mais criava um saldo negativo que ninguém
 * saberia desfazer; recusar, com a frase que diz quanto é devido, deixa o engano do lado de fora,
 * onde ele se corrige à mão em dois segundos.
 *
 * O ZERO E O NEGATIVO SÃO RECUSADOS pela mesma razão, e com a mesma frase.
 */
function receber(recebimentos, centavos, quando, nota) {
  const lista = Array.isArray(recebimentos) ? recebimentos.slice() : [];
  const valor = Math.round(Number(centavos));
  if (!Number.isFinite(valor) || valor <= 0) {
    return { ok: false, erro: 'o valor recebido tem de ser maior do que zero — escreva quanto ele pagou' };
  }
  const em = String(quando || new Date().toISOString());
  const razao = String(nota == null ? '' : nota).trim();
  const elo = { em, centavos: valor };
  if (razao) elo.nota = razao.slice(0, 200);
  return { ok: true, elo, lista: lista.concat([elo]) };
}

/** O LIVRO EM PALAVRAS — a frase que o painel mostra, e a mesma que a prova confere. */
function livroEmTexto(resumo, moeda) {
  const r = resumo || {};
  const m = String(moeda || 'R$');
  const emReais = (c) => m + ' ' + (Math.round(Number(c) || 0) / 100).toFixed(2).replace('.', ',');
  if (!r.taxaCentavos) {
    return 'a taxa da consultoria não está declarada no catálogo — o livro não pode ser calculado';
  }
  if (!r.quantidadeDevida) {
    if (!r.recebidoCentavos) return 'nenhuma consultoria com escola ainda';
    /* RECEBIDO SEM NADA DEVIDO: é um adiantamento, ou um engano — e as duas coisas se dizem. Um
     * «recebido R$ 5,00» seco leria como uma dívida paga, quando não havia dívida nenhuma. */
    return r.saldoCentavos < 0
      ? 'nenhuma consultoria com escola ainda · recebido ' + emReais(r.recebidoCentavos)
        + ' · a mais ' + emReais(-r.saldoCentavos)
      : 'nenhuma consultoria com escola ainda · recebido ' + emReais(r.recebidoCentavos);
  }
  const base = r.quantidadeDevida + (r.quantidadeDevida === 1 ? ' consultoria' : ' consultorias')
    + ' · devido ' + emReais(r.devidoCentavos);
  if (!r.recebidoCentavos) return base + ' · nada recebido';
  if (r.saldoCentavos === 0) return base + ' · recebido, nada em falta';
  if (r.saldoCentavos > 0) return base + ' · recebido ' + emReais(r.recebidoCentavos)
    + (r.saldoCentavos === r.devidoCentavos ? '' : ' · falta ' + emReais(r.saldoCentavos));
  return base + ' · recebido ' + emReais(r.recebidoCentavos) + ' · a mais ' + emReais(-r.saldoCentavos);
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
  /* F3 — o link que abre uma escola */
  MINUTOS_DE_RESERVA,
  MOTIVO_DO_LINK_INVALIDO,
  chaveDoLink,
  reservaActiva,
  estadoDoLink,
  reservarVisita,
  marcarVisitaUsada,
  largarReserva,
  /* F4 — o livro dos R$ 10 */
  chaveDosRecebimentos,
  taxaDaConsultoria,
  lerRecebimentos,
  devidas,
  resumoDoLivro,
  receber,
  livroEmTexto,
};
