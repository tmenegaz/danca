#!/usr/bin/env node
'use strict';

/**
 * provar-o-cadastro-do-consultor.js — QUEM ATENDE AS ESCOLAS, E QUEM PODE ABRIR A PORTA (25/11/2026).
 *
 * O QUE ELA PEDIU: «vou pôr o nome, o CPF e o CNPJ, os equipamentos que ele precisa ter, carro e
 * habilitação e computador próprio, um notebook próprio. E aí um botão de ativar ou desativar e um
 * status para saber se ele está ativo ou não.»
 *
 * E a razão, que decide o desenho: «ele é uma forma de eu saber que o consultor tá trabalhando» e
 * «assim eu não faço confusão, não vou premiar um consultor pelo mérito de outro consultor». Um
 * cadastro que aceitasse dois consultores com o mesmo CPF seria **duas fichas para a mesma pessoa**
 * — e é exactamente por aí que se premia um pelo mérito do outro.
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   §A a validação: nome, praça, PELO MENOS um documento, contactos, e a ordem das mensagens;
 *   §B o consultor NASCE INACTIVO — o cadastro é um dado e o acesso é uma decisão;
 *   §C a porta do activo: o estado muda com data e AUTOR, e a mudança é um elo, não uma sobrescrita;
 *   §D o documento repetido é RECUSADO — o controlo que impede premiar um pelo mérito de outro;
 *   §E o KV: uma leitura falhada NÃO é uma lista vazia (a diferença entre uma decisão e um acidente);
 *   §F as três rotas do painel: a página, o cadastro e o estado — e o `/consultores` a responder
 *      **404 no endereço público**, que é a parede que impede a lista de sair no site aberto;
 *   §G o tecto da lista: o duzentos e um entra e o mais antigo sai — e a resposta DIZ quantos saíram;
 *   §H CONTROLO NEGATIVO: sem `ativo` no corpo, a rota recusa. Activar por omissão seria a pior
 *      falha possível numa rota que abre uma porta.
 *
 *   node experimentos/provar-o-cadastro-do-consultor.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const consultores = require(path.join(RAIZ, 'motor/nucleo/consultores.js'));
const daCasa = require(path.join(RAIZ, 'motor/servidor/consultores-da-casa.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/** Um KV em memória, com `get`/`put` — o mesmo contrato do KV do Cloudflare para o que se usa. */
function kvDeMentira(inicial) {
  const mem = new Map(Object.entries(inicial || {}));
  return {
    mem,
    async get(k) { return mem.has(k) ? mem.get(k) : null; },
    async put(k, v) { mem.set(k, String(v)); },
    async delete(k) { mem.delete(k); },
    async list() { return { keys: [...mem.keys()].map((name) => ({ name })), list_complete: true }; },
  };
}

/** Um KV que explode ao ler — para medir o que a rota faz quando não conseguiu ler. */
function kvQueFalha() {
  return {
    async get() { throw new Error('o KV não respondeu'); },
    async put() { throw new Error('o KV não respondeu'); },
  };
}

const CADASTRO = {
  nome: 'Maria Silva',
  praca: 'Santa Maria',
  cpf: '123.456.789-01',
  email: 'maria@exemplo.com',
  telefone: '(55) 99999-0000',
  equipamento: { carro: true, habilitacao: true, notebook: true },
};

/* ── §A a validação ────────────────────────────────────────────────────────────────────────── */

console.log('\n§A o cadastro valida o que ela pediu, na ordem das mensagens');

const valido = consultores.validarCadastro(CADASTRO);
provar('um cadastro completo passa', valido.ok === true, valido.erros);
provar('e o CPF é guardado em dígitos', valido.cadastro.cpf === '12345678901', valido.cadastro.cpf);
provar('a praça é guardada como ela a escreveu', valido.cadastro.praca === 'Santa Maria', valido.cadastro.praca);
provar('e os três equipamentos são declarados', ['carro', 'habilitacao', 'notebook']
  .every((e) => valido.cadastro.equipamento[e] === true), valido.cadastro.equipamento);

const semNome = consultores.validarCadastro(Object.assign({}, CADASTRO, { nome: '' }));
provar('sem nome, recusa', semNome.ok === false, semNome.erro);
provar('…e a primeira frase é a do nome (a ordem das perguntas é a ordem das mensagens)',
  semNome.erros[0].campo === 'nome', semNome.erros[0]);
provar('…e a frase, no vazio, é «informe o nome»', /informe o nome/i.test(semNome.erro), semNome.erro);

/* DUAS LETRAS NÃO CHEGAM. Sem este caso, o ramo do mínimo nunca seria exercido: o vazio é apanhado
   antes, pela falta, e a asserção passaria a medir a frase errada. */
const nomeCurto = consultores.validarCadastro(Object.assign({}, CADASTRO, { nome: 'Jo' }));
provar('com duas letras, recusa', nomeCurto.ok === false, nomeCurto.erro);
provar('…e diz que o nome precisa de três letras',
  /pelo menos 3 letras/.test(nomeCurto.erro), nomeCurto.erro);

const semPraca = consultores.validarCadastro(Object.assign({}, CADASTRO, { praca: '' }));
provar('sem praça, recusa — um consultor sem praça não é atribuível', semPraca.ok === false, semPraca.erro);
provar('…e o campo da recusa é a praça', semPraca.erros[0].campo === 'praca', semPraca.erros[0]);

/* PELO MENOS UM DOCUMENTO, E NÃO OS DOIS. Ela pediu «o CPF e o CNPJ», e exigir os dois fecharia a
 * porta a quem faz consultoria como pessoa física — que é o caso mais provável do primeiro. */
const semDocumento = consultores.validarCadastro(Object.assign({}, CADASTRO, { cpf: '' }));
provar('sem CPF e sem CNPJ, recusa', semDocumento.ok === false, semDocumento.erro);
provar('…e a frase diz que um dos dois é obrigatório',
  /um dos dois é obrigatório/.test(semDocumento.erro), semDocumento.erro);
const soCnpj = consultores.validarCadastro(Object.assign({}, CADASTRO, { cpf: '', cnpj: '11.222.333/0001-81' }));
provar('só com CNPJ, passa — quem factura como empresa não precisa de CPF', soCnpj.ok === true, soCnpj.erros);
const soCpf = consultores.validarCadastro(Object.assign({}, CADASTRO, { cnpj: '' }));
provar('só com CPF, passa — o caso mais comum', soCpf.ok === true, soCpf.erros);
const osDois = consultores.validarCadastro(Object.assign({}, CADASTRO, { cnpj: '11.222.333/0001-81' }));
provar('com os dois, passa — quem dá aula e factura por MEI tem os dois', osDois.ok === true, osDois.erros);

const cnpjTorto = consultores.validarCadastro(Object.assign({}, CADASTRO, { cnpj: '112223330001' }));
provar('um CNPJ com menos dígitos é RECUSADO, e não ignorado — o erro só apareceria na nota fiscal',
  cnpjTorto.ok === false, cnpjTorto.erro);
provar('…e a frase diz quantos dígitos vieram', /13 dígitos|vieram 12/.test(cnpjTorto.erro), cnpjTorto.erro);

const cpfRepetido = consultores.validarCadastro(Object.assign({}, CADASTRO, { cpf: '111.111.111-11' }));
provar('um CPF de dígitos repetidos é recusado', cpfRepetido.ok === false, cpfRepetido.erro);

const semEmail = consultores.validarCadastro(Object.assign({}, CADASTRO, { email: '' }));
provar('sem e-mail, recusa — é por lá que se fala com ele', semEmail.ok === false, semEmail.erro);
const semTelefone = consultores.validarCadastro(Object.assign({}, CADASTRO, { telefone: '' }));
provar('sem telefone, recusa', semTelefone.ok === false, semTelefone.erro);

const semEquipamento = consultores.validarCadastro(Object.assign({}, CADASTRO, { equipamento: {} }));
provar('o equipamento não é obrigatório — um consultor sem carro existe', semEquipamento.ok === true, semEquipamento.erros);
provar('…e o que ele não declarou fica FALSO, e não ausente',
  semEquipamento.cadastro.equipamento.carro === false, semEquipamento.cadastro.equipamento);
provar('três equipamentos, e são os três que ela pediu',
  consultores.EQUIPAMENTOS.map((e) => e.id).join(',') === 'carro,habilitacao,notebook',
  consultores.EQUIPAMENTOS.map((e) => e.id));

/* ── §B nasce inactivo ─────────────────────────────────────────────────────────────────────── */

console.log('\n§B o cadastro é um dado; o acesso é uma decisão');

const criado = consultores.acrescentar([], valido.cadastro, '2026-11-25T20:00:00.000Z');
provar('acrescentar devolve o registo', criado.ok === true && Boolean(criado.registo));
provar('o consultor NASCE INACTIVO', criado.registo.ativo === false, criado.registo.ativo);
provar('com um id próprio, derivado do nome e do carimbo',
  /^c-20261125200000-maria-silva-/.test(criado.registo.id), criado.registo.id);
provar('e o histórico nasce com o elo «criado» — a história não começa a meio',
  criado.registo.historico.length === 1 && criado.registo.historico[0].o === 'criado',
  criado.registo.historico);
provar('a declaração do equipamento leva a data — um booleano sem data é uma memória sem autor',
  criado.registo.equipamento.declaradoEm === '2026-11-25T20:00:00.000Z', criado.registo.equipamento);
provar('o registo NÃO guarda token nenhum — o acesso nasce em F2, noutro ficheiro',
  JSON.stringify(criado.registo).indexOf('token') === -1, Object.keys(criado.registo));
provar('nem senha', JSON.stringify(criado.registo).indexOf('senha') === -1, Object.keys(criado.registo));

/* ── §C a porta do activo ─────────────────────────────────────────────────────────────────── */

console.log('\n§C activar é um elo datado, não uma sobrescrita');

const activado = consultores.mudarEstado(criado.lista, criado.registo.id, true, '2026-11-25T21:00:00.000Z', 'primeiro consultor');
provar('activar muda o estado', activado.ok === true && activado.mudou === true, activado);
provar('…e o registo fica activo', activado.registo.ativo === true, activado.registo.ativo);
provar('…e o histórico passa a ter dois elos, o segundo «ativado»',
  activado.registo.historico.length === 2 && activado.registo.historico[1].o === 'ativado',
  activado.registo.historico);
provar('…e o motivo fica escrito, quando há motivo',
  activado.registo.historico[1].motivo === 'primeiro consultor', activado.registo.historico[1]);
provar('…e a data do último elo é a da mudança',
  activado.registo.atualizadoEm === '2026-11-25T21:00:00.000Z', activado.registo.atualizadoEm);

const outraVez = consultores.mudarEstado(activado.lista, criado.registo.id, true, '2026-11-25T22:00:00.000Z');
provar('activar o que já está activo NÃO grava nada — um clique duplo não enche o histórico',
  outraVez.ok === true && outraVez.mudou === false, outraVez.mudou);
provar('…e o histórico continua com dois elos', outraVez.registo.historico.length === 2, outraVez.registo.historico.length);

const desactivado = consultores.mudarEstado(activado.lista, criado.registo.id, false, '2026-11-26T08:00:00.000Z');
provar('desactivar volta o estado para inactivo', desactivado.registo.ativo === false, desactivado.registo.ativo);
provar('…e o elo diz «desativado»', desactivado.registo.historico[2].o === 'desativado', desactivado.registo.historico[2]);

const idErrado = consultores.mudarEstado(activado.lista, 'c-nao-existe', true);
provar('um id que não existe é recusado, com a saída na frase',
  idErrado.ok === false && /recarregue a lista/.test(idErrado.erro), idErrado.erro);

/* ── §D o documento repetido ──────────────────────────────────────────────────────────────── */

console.log('\n§D o mesmo documento NÃO entra duas vezes');

const repetido = consultores.acrescentar(criado.lista, valido.cadastro, '2026-11-26T00:00:00.000Z');
provar('o mesmo CPF é recusado', repetido.ok === false, repetido.ok);
provar('…e a frase nomeia quem já o tem — é a pergunta «é a mesma pessoa?» com resposta',
  /já é do consultor «Maria Silva»/.test(repetido.erro), repetido.erro);
provar('…e diz a regra: cada CPF é uma pessoa', /cada CPF é uma pessoa/.test(repetido.erro), repetido.erro);

const comCnpj = consultores.validarCadastro(Object.assign({}, CADASTRO, { cpf: '', cnpj: '11.222.333/0001-81' }));
const comCnpjCriado = consultores.acrescentar([], comCnpj.cadastro, '2026-11-25T20:00:00.000Z');
const cnpjRepetido = consultores.acrescentar(comCnpjCriado.lista, comCnpj.cadastro, '2026-11-26T00:00:00.000Z');
provar('o mesmo CNPJ também é recusado', cnpjRepetido.ok === false, cnpjRepetido.ok);
provar('…e a frase diz «cada CNPJ é uma empresa»', /cada CNPJ é uma empresa/.test(cnpjRepetido.erro), cnpjRepetido.erro);

/* ── §E o KV que falha ───────────────────────────────────────────────────────────────────── */

(async () => {
  console.log('\n§E um KV que não responde não é uma lista vazia');

  const semKv = await daCasa.ler({});
  provar('sem KV no env, a leitura diz que não leu', semKv.ok === false, semKv.ok);
  provar('…e a lista vem vazia mas marcada como falha, não como «não há consultores»',
    Array.isArray(semKv.lista) && semKv.lista.length === 0 && semKv.ok === false, semKv.erro);

  const comKvQuebrado = await daCasa.ler({ PADD_KV: kvQueFalha() });
  provar('um KV que estoura devolve `ok: false` e o motivo', comKvQuebrado.ok === false && /não respondeu/.test(comKvQuebrado.erro),
    comKvQuebrado.erro);

  const vazio = await daCasa.ler({ PADD_KV: kvDeMentira() });
  provar('um KV vazio (chave ausente) é `ok: true` com lista vazia — isso não é falha, é o começo',
    vazio.ok === true && vazio.lista.length === 0, vazio);

  const naoGrava = await daCasa.criar({ PADD_KV: kvQueFalha() }, CADASTRO);
  provar('criar sobre um KV que não lê recusa, em vez de gravar por cima de uma lista que existia',
    naoGrava.ok === false, naoGrava);
  provar('…e não devolve um registo a fingir de criado', !naoGrava.registo, Object.keys(naoGrava));

  /* ── §F as rotas ─────────────────────────────────────────────────────────────────────────── */

  console.log('\n§F as três rotas do painel, e o 404 no endereço público');

  const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
  const kv = kvDeMentira();
  const env = {
    SENHA_RAIZ: 'a-senha-da-bancada',
    PADD_KV: kv,
    HOST_DONO: 'danca.padd.com.br',
  };
  /* A AUTENTICAÇÃO É HTTP BASIC, e a bancada tem de a passar — sem ela todas as rotas do painel
   * respondem 401, e a prova mediria a parede em vez do que lá está dentro. */
  /* O UTILIZADOR É `tmenegaz`, e não um nome inventado — a comparação do `autorizado` é literal,
   * e um `Basic` com outro utilizador dá 401 numa bancada que parece certa. Foi assim que a
   * primeira versão desta prova falhou: a página respondia 401 e o erro parecia do servidor. */
  const credencial = 'Basic ' + Buffer.from('tmenegaz:' + env.SENHA_RAIZ).toString('base64');
  const pedir = (caminho, opcoes) => raiz.default
    ? raiz.default.fetch(new Request('https://danca.padd.com.br' + caminho, Object.assign({ headers: {} }, opcoes || {})), env)
    : null;

  /* O `fetch` do Worker pode não estar em `raiz.default` — procura-se o export certo sem partir. */
  const handler = raiz.default || raiz;
  const chamar = (caminho, opcoes) => {
    const o = Object.assign({ headers: {} }, opcoes || {});
    o.headers = Object.assign({ Authorization: credencial }, o.headers);
    if (o.body && !o.headers['Content-Type']) o.headers['Content-Type'] = 'application/json';
    return handler.fetch(new Request('https://danca.padd.com.br' + caminho, o), env);
  };

  const pagina = await chamar('/consultores');
  const html = await pagina.text();
  provar('a página /consultores responde 200 com a senha', pagina.status === 200, pagina.status);
  provar('…e traz o formulário e o botão de cadastrar',
    html.indexOf('consultor-cadastrar') !== -1 && html.indexOf('consultor-nome') !== -1);
  provar('…e diz que o cadastro nasce inactivo, antes de o fazer',
    /nasce <strong>inactivo<\/strong>/.test(html), null);
  provar('…e anuncia o botão de activar na lista, para quem ainda não há',
    html.indexOf('Nenhum consultor cadastrado') !== -1, null);

  const semSenha = await handler.fetch(new Request('https://danca.padd.com.br/consultores'), env);
  provar('sem a senha, a página responde 401', semSenha.status === 401, semSenha.status);

  /* O ENDEREÇO PÚBLICO É A PAREDE QUE IMPEDE A LISTA DE SAIR NO SITE ABERTO. É um **permitir**, e
   * não um proibir: `/consultores` não está na lista, logo não passa. */
  const publico = await handler.fetch(new Request('https://lastro.padd.com.br/consultores'), env);
  provar('no endereço público, /consultores responde 404', publico.status === 404, publico.status);
  const publicoApi = await handler.fetch(new Request('https://lastro.padd.com.br/api/consultores', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(CADASTRO),
  }), env);
  provar('…e o POST de cadastro também, com o corpo válido', publicoApi.status === 404, publicoApi.status);

  const respostaCriar = await chamar('/api/consultores', { method: 'POST', body: JSON.stringify(CADASTRO) });
  const corpoCriar = await respostaCriar.json();
  provar('o POST de cadastro responde 201', respostaCriar.status === 201, respostaCriar.status);
  provar('…com o consultor criado INACTIVO', corpoCriar.ok === true && corpoCriar.consultor.ativo === false,
    corpoCriar.consultor && corpoCriar.consultor.ativo);
  provar('…e o registo foi mesmo para o KV',
    Boolean(kv.mem.get(consultores.CHAVE)) && JSON.parse(kv.mem.get(consultores.CHAVE)).length === 1,
    kv.mem.get(consultores.CHAVE));

  const respostaRepetida = await chamar('/api/consultores', { method: 'POST', body: JSON.stringify(CADASTRO) });
  provar('o mesmo CPF outra vez responde 409', respostaRepetida.status === 409, respostaRepetida.status);
  const corpoRepetido = await respostaRepetida.json();
  provar('…e a frase do servidor é a mesma do núcleo',
    /já é do consultor/.test(corpoRepetido.erro), corpoRepetido.erro);

  const respostaRuim = await chamar('/api/consultores', { method: 'POST', body: JSON.stringify({ nome: 'X' }) });
  provar('um corpo inválido responde 400, e não 500', respostaRuim.status === 400, respostaRuim.status);

  const id = corpoCriar.consultor.id;
  const respostaActivar = await chamar('/api/consultores/estado', {
    method: 'POST', body: JSON.stringify({ id, ativo: true }),
  });
  const corpoActivar = await respostaActivar.json();
  provar('activar responde ok e mudou', corpoActivar.ok === true && corpoActivar.mudou === true, corpoActivar);
  provar('…e o consultor no KV fica activo', corpoActivar.consultor.ativo === true, corpoActivar.consultor);

  const respostaSegunda = await chamar('/api/consultores/estado', {
    method: 'POST', body: JSON.stringify({ id, ativo: true }),
  });
  const corpoSegunda = await respostaSegunda.json();
  provar('activar outra vez responde `mudou: false` — e isso não é uma falha',
    corpoSegunda.ok === true && corpoSegunda.mudou === false, corpoSegunda);

  const paginaDepois = await (await chamar('/consultores')).text();
  provar('a lista passa a mostrar o consultor e o botão «Desactivar»',
    paginaDepois.indexOf('Maria Silva') !== -1 && paginaDepois.indexOf('Desactivar') !== -1, null);
  provar('…e o selo diz activo', /class="selo ok">activo</.test(paginaDepois), null);
  provar('…e a praça está na tabela', paginaDepois.indexOf('Santa Maria') !== -1, null);

  /* O RESUMO É O QUE RESPONDE «QUEM PODE ABRIR LINK AGORA» sem ler a tabela linha a linha. Mede-se
   * o número, e não a presença da caixa: uma caixa vazia também está presente. */
  const resumoHtml = (/<div class="caixa" id="consultores-resumo">([\s\S]*?)<\/div>/.exec(paginaDepois) || [])[1] || '';
  provar('o resumo conta um activo e zero inactivos',
    /<strong>1<\/strong> activo/.test(resumoHtml) && /<strong>0<\/strong> inactivo/.test(resumoHtml),
    resumoHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  provar('…e os três equipamentos declarados contam como equipamento completo',
    /<strong>1<\/strong> com o equipamento todo declarado/.test(resumoHtml), null);

  /* ── §H o controlo negativo do `ativo` ───────────────────────────────────────────────────── */

  console.log('\n§H sem dizer para que estado, a rota RECUSA');

  const semAtivo = await chamar('/api/consultores/estado', { method: 'POST', body: JSON.stringify({ id }) });
  provar('sem `ativo` no corpo, responde 400', semAtivo.status === 400, semAtivo.status);
  const corpoSemAtivo = await semAtivo.json();
  provar('…e a frase diz o que falta', /falta dizer se é para activar ou desactivar/.test(corpoSemAtivo.erro),
    corpoSemAtivo.erro);
  provar('…e o consultor continua como estava (a recusa não muda nada)',
    JSON.parse(kv.mem.get(consultores.CHAVE))[0].ativo === true,
    JSON.parse(kv.mem.get(consultores.CHAVE))[0].ativo);

  const semId = await chamar('/api/consultores/estado', { method: 'POST', body: JSON.stringify({ ativo: false }) });
  provar('sem id, responde 400', semId.status === 400, semId.status);

  /* ── §G o tecto da lista ─────────────────────────────────────────────────────────────────── */

  console.log('\n§G o tecto da lista diz quantos saíram — um limite silencioso é uma mentira');

  let grande = [];
  for (let i = 0; i < consultores.MAXIMO_NA_LISTA; i += 1) {
    const c = Object.assign({}, valido.cadastro, {
      cpf: String(10000000000 + i), nome: 'Consultor ' + i,
    });
    grande = consultores.acrescentar(grande, c, '2026-11-25T20:00:00.000Z').lista;
  }
  provar('a lista enche até ao tecto', grande.length === consultores.MAXIMO_NA_LISTA, grande.length);
  const maisUm = consultores.acrescentar(grande, Object.assign({}, valido.cadastro, {
    cpf: '99988877766', nome: 'O de mais',
  }), '2026-11-25T20:00:00.000Z');
  provar('o duzentos e um entra', maisUm.ok === true, maisUm.ok);
  provar('…e o mais antigo sai, para a lista não crescer para sempre',
    maisUm.lista.length === consultores.MAXIMO_NA_LISTA, maisUm.lista.length);
  provar('…e a resposta DIZ que um saiu', maisUm.retirados === 1, maisUm.retirados);
  provar('…e o que saiu é o primeiro, e não um qualquer', maisUm.lista[0].nome !== 'Consultor 0',
    maisUm.lista[0].nome);

  const kvCheio = kvDeMentira({ [consultores.CHAVE]: JSON.stringify(grande) });
  const respostaCheia = await (async () => {
    const salvo = env.PADD_KV;
    env.PADD_KV = kvCheio;
    try {
      const r = await chamar('/api/consultores', {
        method: 'POST', body: JSON.stringify(Object.assign({}, CADASTRO, { cpf: '99988877766' })),
      });
      return { status: r.status, corpo: await r.json() };
    } finally { env.PADD_KV = salvo; }
  })();
  provar('e a ROTA diz os retirados à pessoa que cadastrou o duzentos e um',
    respostaCheia.corpo.retirados === 1, respostaCheia.corpo);

  /* ── o resumo ───────────────────────────────────────────────────────────────────────────── */

  /* ── §I Q8 do plano: ELE NÃO SE ACTIVA A SI MESMO ──────────────────────────────────────────
   *
   * A pergunta estava em aberto no §13 do PLANO-DO-CONSULTOR: «o consultor pode activar-se a si
   * mesmo, ou só ela?» A recomendação era **só ela**, e o código cumpre-o por duas razões
   * independentes — o que é a única forma de uma regra desta espécie valer:
   *
   *   1. o consultor **nasce inactivo** (§B desta prova), e nenhuma rota dele escreve `ativo`;
   *   2. as rotas que escrevem `ativo` são as do PAINEL, e o painel exige a senha da dona — o token
   *      dele, em qualquer forma (Bearer, no corpo), não passa.
   *
   * O QUE ESTA SECÇÃO MEDE, e é o que faltava: **nenhuma das formas de apresentar o token dele
   * activa nada**. Sem esta asserção, um `autorizado` mal escrito — que aceitasse um Bearer por
   * conveniência — abriria a porta e ninguém daria por isso: o consultor activo a mais parece
   * exactamente um consultor que trabalha.
   */
  console.log('\n§I Q8 — ele não se activa a si mesmo: o token dele não abre as rotas do dono');

  const kvQ8 = kvDeMentira();
  const envQ8 = {
    PADD_KV: kvQ8, SENHA_RAIZ: 'a-senha-da-bancada', HOST_DONO: 'danca.padd.com.br',
    HOST_PUBLICO: 'lastro.padd.com.br',
  };
  const criadoQ8 = await daCasa.criar(envQ8, CADASTRO);
  const activadoQ8 = await daCasa.mudarEstado(envQ8, { id: criadoQ8.registo.id, ativo: true }, '2026-11-25T12:00:00.000Z');
  /* Desactivado por ela — é este o estado em que ele quereria activar-se. */
  await daCasa.mudarEstado(envQ8, { id: criadoQ8.registo.id, ativo: false }, '2026-11-25T13:00:00.000Z');
  const tokenQ8 = activadoQ8.token;
  provar('a bancada tem o consultor inactivo e com um token válido em mãos',
    Boolean(tokenQ8) && (await daCasa.ler(envQ8)).lista[0].ativo === false, Boolean(tokenQ8));

  const comToken = (caminho, cabecalhos, corpo) => handler.fetch(new Request('https://danca.padd.com.br' + caminho, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos || {}),
    body: JSON.stringify(corpo || {}),
  }), envQ8);

  const comoBearer = await comToken('/api/consultores/estado', { Authorization: 'Bearer ' + tokenQ8 },
    { id: criadoQ8.registo.id, ativo: true });
  provar('activar-se com o token no cabeçalho é RECUSADO (401)', comoBearer.status === 401, comoBearer.status);

  const noCorpo = await comToken('/api/consultores/estado', {}, { id: criadoQ8.registo.id, ativo: true, token: tokenQ8 });
  provar('…e com o token no corpo do pedido também (401)', noCorpo.status === 401, noCorpo.status);

  const comAcesso = await comToken('/api/consultores/acesso', { Authorization: 'Bearer ' + tokenQ8 },
    { id: criadoQ8.registo.id });
  provar('…e o «Novo endereço» também (401)', comAcesso.status === 401, comAcesso.status);

  const depoisQ8 = (await daCasa.ler(envQ8)).lista[0];
  provar('…e ele continua INACTIVO depois de todas as tentativas', depoisQ8.ativo === false, depoisQ8.ativo);
  provar('…e o histórico dele acaba no «desativado» dela, sem um «ativado» a seguir',
    depoisQ8.historico.map((e) => e.o).join(' > ') === 'criado > ativado > acesso-emitido > desativado',
    depoisQ8.historico.map((e) => e.o));

  /* E A OUTRA METADE: mesmo ACTIVO, ele não muda o próprio estado — nem para desactivar. Desactivar
   * fecha os links que ele já espalhou, e isso não é um gesto dele: é uma decisão de quem paga o
   * servidor. */
  await daCasa.mudarEstado(envQ8, { id: criadoQ8.registo.id, ativo: true }, '2026-11-25T14:00:00.000Z');
  const desactivarSe = await comToken('/api/consultores/estado', { Authorization: 'Bearer ' + tokenQ8 },
    { id: criadoQ8.registo.id, ativo: false });
  provar('…e, já activo, também não se desactiva a si mesmo (401)', desactivarSe.status === 401, desactivarSe.status);
  provar('…e continua activo', (await daCasa.ler(envQ8)).lista[0].ativo === true, null);

  /* E AS ROTAS DELE NÃO TOCAM NO `ativo` — a segunda metade da regra, e a que nenhum 401 prova.
   *
   * O RECORTE É POR FRONTEIRA DE FUNÇÃO, e a primeira versão desta asserção estava errada por uma
   * armadilha do JavaScript: `fonte.indexOf(marca, i) || i + 6000`. Quando a marca não existe depois
   * de `i`, o `indexOf` devolve **-1**, e **-1 é truthy** — o `||` nunca corria, e o `slice(i, -1)`
   * ia do início da função até ao fim do ficheiro, apanhando as rotas do painel (que escrevem
   * `ativo` de propósito). A asserção reprovava o código certo.
   *
   * Agora o fim é a **próxima declaração de função**, e o recorte tem de ter tamanho plausível — uma
   * asserção que medisse um recorte vazio passaria a aprovar tudo. */
  const fonte = require('fs').readFileSync(path.join(RAIZ, 'motor/servidor/raiz.js'), 'utf8');
  const recorteDe = (nome) => {
    const i = fonte.indexOf('async function ' + nome);
    if (i === -1) return '';
    const j = fonte.indexOf('\nasync function ', i + 10);
    return fonte.slice(i, j === -1 ? fonte.length : j);
  };
  for (const nome of ['respostaDaAreaDoConsultor', 'responderAoPedidoDoConsultor']) {
    const bloco = recorteDe(nome);
    provar('o recorte de ' + nome + ' tem corpo (não é vazio)',
      bloco.length > 300 && bloco.indexOf('async function ' + nome) === 0, bloco.length);
    provar('…e ' + nome + ' NÃO escreve o estado do consultor (só o painel o faz)',
      !/mudarEstado\(|\.ativo\s*=[^=]/.test(bloco), (bloco.match(/mudarEstado\(|\.ativo\s*=[^=]/g) || []).slice(0, 3));
  }

  const r = consultores.resumo(activado.lista);
  /*
   * UMA ASSERÇÃO POR NÚMERO, e não uma composta. A composta escondeu durante meia hora um erro meu
   * de escrita — `r.inactivos` com «c» — porque tudo o resto era verdade e o `false` não dizia qual
   * das cinco parcelas falhava. Separadas, o número errado sai com nome.
   */
  provar('o resumo conta o total', r.total === 1, r.total);
  provar('o resumo conta os activos', r.activos === 1, r.activos);
  provar('o resumo conta os inativos', r.inativos === 0, r.inativos);
  provar('o resumo conta as praças', r.pracas === 1, r.pracas);
  provar('o resumo conta quem tem o equipamento completo',
    r.comEquipamentoCompleto === 1, r.comEquipamentoCompleto);

  console.log('\n' + provas + ' asserções, ' + (provas - falhas) + ' ok, ' + falhas + ' falha(s)');
  process.exit(falhas === 0 ? 0 : 1);
})();
