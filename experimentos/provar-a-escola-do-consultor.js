#!/usr/bin/env node
'use strict';

/**
 * provar-a-escola-do-consultor.js — A ESCOLA QUE NASCE DE UM LINK (25/11/2026 — F3).
 *
 * A FASE QUE NÃO PODE FALHAR EM SILÊNCIO. Uma escola criada com o plano errado, ou sem atribuição,
 * é um cliente que existe e não se sabe de onde veio — e o erro só aparece no dia em que as contas
 * são feitas. É por isso que esta prova mede duas coisas de espécies diferentes:
 *
 *   · o que a porta DECIDE (o plano, o mês, a atribuição) — em funções puras, sem Worker;
 *   · o que a rota FAZ quando as coisas correm mal (a criação falha, dois pedidos chegam juntos) —
 *     porque é aí que uma escola se duplica ou um link se queima.
 *
 * §A a regra da porta: o plano é o da consultoria e não se escolhe; o pagamento é dispensado; o mês
 *    começa na criação; a atribuição leva o consultor e a visita.
 * §B o CONTROLRO NEGATIVO da §A: pela porta pública, o mesmo corpo continua a ser recusado com a
 *    frase de sempre — «criado pela administração», palavra por palavra.
 * §C o link: desconhecido, suspenso, gasta, expirada, reservada — cinco frases, cinco saídas.
 * §D a rota: reserva antes de criar, gasta depois, e LARGA quando a criação falha (senão um erro de
 *    digitação queimava o link, e a escola teria de pedir outro).
 * §E dois pedidos SIMULTÂNEOS do mesmo link produzem UMA escola. É o controlo que a reserva existe
 *    para fazer, e sem ele um consultor receberia por um trabalho que não fez.
 * §F a página: o formulário só existe quando o link abre, os limites vêm do catálogo, e o token entra
 *    no endereço do pedido.
 *
 *   node experimentos/provar-a-escola-do-consultor.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const consultores = require(path.join(RAIZ, 'motor/nucleo/consultores.js'));
const escolaDoConsultor = require(path.join(RAIZ, 'motor/nucleo/escola-do-consultor.js'));
const daCasa = require(path.join(RAIZ, 'motor/servidor/consultores-da-casa.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

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

const CADASTRO = {
  nome: 'Maria Silva', praca: 'Santa Maria', cpf: '123.456.789-01',
  email: 'maria@exemplo.com', telefone: '(55) 99999-0000',
  equipamento: { carro: true, habilitacao: true, notebook: true },
};

const CONSULTOR = { id: 'c-20261125120000-maria-ab12', nome: 'Maria Silva', praca: 'Santa Maria', visitaId: 'v-1' };

/** Uma bancada com um consultor activo e uma visita aberta — o estado de onde a escola nasce. */
async function bancada() {
  const kv = kvDeMentira();
  const env = { PADD_KV: kv, SENHA_RAIZ: 'a-senha-da-bancada', HOST_DONO: 'danca.padd.com.br', HOST_PUBLICO: 'lastro.padd.com.br' };
  const criado = await daCasa.criar(env, CADASTRO);
  await daCasa.mudarEstado(env, { id: criado.registo.id, ativo: true }, '2026-11-25T12:00:00.000Z');
  const visita = await daCasa.criarVisita(env, criado.registo.id, { escolaNome: 'Studio Aurora', cidade: 'Santa Maria' },
    '2026-11-25T12:00:00.000Z');
  return { env, kv, id: criado.registo.id, token: visita.token, visita: visita.visita };
}

/** Um `responderCriacao` de bancada — o que a rota faria com o Cloudflare, sem o Cloudflare. */
function criacaoDeMentira(resultado) {
  const chamadas = [];
  const fn = async (pedido, env, opcoes) => {
    chamadas.push({ opcoes, corpo: await pedido.json().catch(() => ({})) });
    const corpo = typeof resultado === 'function' ? resultado(chamadas.length) : resultado;
    return new Response(JSON.stringify(corpo.corpo), {
      status: corpo.status || 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  fn.chamadas = chamadas;
  return fn;
}

function pedidoDe(caminho, corpo) {
  return new Request('https://lastro.padd.com.br' + caminho, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo || {}),
  });
}

const CORPO_DA_ESCOLA = {
  nome: 'Studio Aurora', cnpj: '11222333000181', email: 'escola@exemplo.com',
  telefone: '(55) 3222-0000', professorNome: 'Ana', professorSobrenome: 'Souza',
  cpf: '111.444.777-35', modalidade: 'bale-classico',
  senhaAdmin: 'uma-senha-boa', senhaProfessor: '',
};

(async () => {
  /* ── §A a regra da porta ──────────────────────────────────────────────────────────────── */

  console.log('\n§A a regra da porta: o plano não se escolhe, o mês começa agora, e a escola é atribuída');

  const preparado = escolaDoConsultor.prepararACriacao({
    corpo: { plano: 'avancado', nome: 'Studio Aurora' }, origem: 'consultor',
    consultor: CONSULTOR, agora: '2026-11-25T21:00:00.000Z',
  });
  provar('a porta do consultor prepara a criação', preparado.ok === true, preparado.erro);
  provar('…e o plano é o da consultoria, mesmo que o corpo peça outro',
    preparado.corpo.plano === 'consultoria', preparado.corpo.plano);
  provar('…e o resto do corpo fica como veio', preparado.corpo.nome === 'Studio Aurora', preparado.corpo.nome);
  provar('…e o pagamento é dispensado (a porta foi autorizada pelo token, não pela senha)',
    preparado.podeDispensar === true, null);
  provar('…e o mês começa NA CRIAÇÃO, e não no «Entregar à escola»',
    preparado.periodo.entregueEm === '2026-11-25T21:00:00.000Z', preparado.periodo.entregueEm);
  provar('…e termina no último instante do mês local',
    preparado.periodo.terminaEm === require(path.join(RAIZ, 'motor/nucleo/fuso.js')).fimDeUmMes('2026-11-25T21:00:00.000Z'),
    preparado.periodo.terminaEm);
  provar('…e a atribuição leva o consultor, a praça e a visita',
    preparado.atribuicao.id === CONSULTOR.id && preparado.atribuicao.praca === 'Santa Maria'
      && preparado.atribuicao.visitaId === 'v-1', preparado.atribuicao);
  provar('a escola em consultoria nasce ACTIVA (senão o mês corria sem ninguém poder usá-lo)',
    escolaDoConsultor.estadoAoNascer(preparado) === 'ativa', escolaDoConsultor.estadoAoNascer(preparado));

  /* A ATRIBUIÇÃO VAI PARA O REGISTO COMERCIAL, e não para o índice: o índice é versionado e o nome
   * do consultor é dado de pessoa; e «quem trouxe esta escola?» é uma pergunta comercial. */
  const campos = escolaDoConsultor.camposComerciais(preparado);
  provar('o registo comercial recebe o consultor', campos.consultor && campos.consultor.id === CONSULTOR.id, null);
  provar('…e o período da consultoria', campos.periodoDeConsultoria
    && campos.periodoDeConsultoria.entregueEm === '2026-11-25T21:00:00.000Z', null);

  /* SEM CONSULTOR NÃO SE CRIA. Uma escola em consultoria sem atribuição é exactamente o cliente que
   * existe e não se sabe de onde veio — o desfecho que o plano declara querer evitar. */
  const semConsultor = escolaDoConsultor.prepararACriacao({ origem: 'consultor', corpo: {}, agora: '2026-11-25T21:00:00.000Z' });
  provar('sem consultor, a porta recusa — e não degrada para «como se fosse o painel»',
    semConsultor.ok === false, semConsultor.erro);
  provar('…e a frase diz o que fazer', /peça outro ao consultor/.test(String(semConsultor.erro)), semConsultor.erro);

  /* ── §B o controlo negativo ───────────────────────────────────────────────────────────── */

  console.log('\n§B pela porta pública, o mesmo corpo continua a ser recusado — palavra por palavra');

  const pelaPublica = escolaDoConsultor.prepararACriacao({
    corpo: { plano: 'consultoria', nome: 'Studio Aurora' }, origem: 'publico', agora: '2026-11-25T21:00:00.000Z',
  });
  provar('a porta pública não dispensa pagamento', pelaPublica.podeDispensar === false, null);
  provar('…e não força plano nenhum', pelaPublica.corpo.plano === 'consultoria', pelaPublica.corpo.plano);
  const recusa = escolaDoConsultor.validarEscolha(pelaPublica.corpo, { podeDispensar: pelaPublica.podeDispensar });
  provar('…e o `validarEscolha` recusa, com a frase de sempre', recusa.ok === false, recusa.erro);
  provar('…que nomeia a administração e não um código de erro',
    /criado pela administração do Sistema Lastro/.test(String(recusa.erro)), recusa.erro);
  provar('…e a mesma escolha PASSA quando a porta é a do painel',
    escolaDoConsultor.validarEscolha({ plano: 'consultoria' }, { podeDispensar: true }).ok === true, null);

  /* ── §C o link, e as cinco recusas ────────────────────────────────────────────────────── */

  console.log('\n§C o link: cinco recusas, cinco frases, e cada uma diz a saída');

  const b = await bancada();

  const aberto = await daCasa.situacaoDoLink(b.env, b.token, '2026-11-26T00:00:00.000Z');
  provar('um link recém-gerado abre', aberto.ok === true && aberto.estado === 'aberta', aberto.motivo);
  provar('…e traz o nome da escola que o consultor escreveu', aberto.escolaNome === 'Studio Aurora', aberto.escolaNome);
  provar('…e traz o consultor, para a página o nomear', aberto.consultor && aberto.consultor.id === b.id, null);

  const desconhecido = await daCasa.situacaoDoLink(b.env, 'nao-e-um-link', '2026-11-26T00:00:00.000Z');
  provar('um token que não é de link nenhum não abre', desconhecido.ok === false, null);
  provar('…e a frase é a mesma para «não existe» e «não é seu» (não se ajuda quem adivinha)',
    desconhecido.motivo === consultores.MOTIVO_DO_LINK_INVALIDO, desconhecido.motivo);
  provar('…e a frase diz a quem pedir outro', /peça um novo ao consultor/.test(desconhecido.motivo), null);

  /* A EXPIRAÇÃO: trinta dias, e o estado é CALCULADO — sem cron. */
  const expirado = await daCasa.situacaoDoLink(b.env, b.token, '2027-01-30T00:00:00.000Z');
  provar('passados trinta dias, o link expira sozinho', expirado.ok === false && expirado.estado === 'expirada', expirado.estado);
  provar('…e a frase manda pedir outro ao consultor', /Peça ao consultor um link novo/.test(expirado.motivo), expirado.motivo);

  /* O CONSULTOR INACTIVO FECHA O LINK JÁ ESPALHADO — é o que a F2 prometeu, e é aqui que se cumpre. */
  await daCasa.mudarEstado(b.env, { id: b.id, ativo: false }, '2026-11-26T00:00:00.000Z');
  const suspenso = await daCasa.situacaoDoLink(b.env, b.token, '2026-11-26T01:00:00.000Z');
  provar('desactivar o consultor fecha o link que ele já espalhou', suspenso.ok === false && suspenso.suspenso === true, suspenso.motivo);
  provar('…e a frase diz que a demonstração está suspensa, e não que o link é inválido',
    /demonstração com consultoria está suspensa/.test(suspenso.motivo), suspenso.motivo);
  provar('…e dá a saída (escrever para a administração)', /lastro@padd\.com\.br/.test(suspenso.motivo), null);
  await daCasa.mudarEstado(b.env, { id: b.id, ativo: true }, '2026-11-26T01:00:00.000Z');

  /* A GASTA: o link que já deu escola. */
  const gasto = consultores.marcarVisitaUsada([b.visita], b.visita.id, 'studio-aurora', '2026-11-26T02:00:00.000Z');
  provar('marcar a visita usada diz qual escola nasceu dela', gasto.visita.escolaSlug === 'studio-aurora', gasto.visita.escolaSlug);
  const estadoGasto = consultores.estadoDoLink(gasto.visita, '2026-11-26T02:01:00.000Z');
  provar('…e a partir daí o link está gasto', estadoGasto.ok === false && estadoGasto.estado === 'gasta', estadoGasto.estado);
  provar('…e a frase diz que cada link abre uma escola, e só uma',
    /Cada link abre uma escola, e só uma/.test(estadoGasto.motivo), estadoGasto.motivo);

  /* A RESERVADA, e o prazo que a faz cair sozinha. */
  const reserva = consultores.reservarVisita([b.visita], b.visita.id, '2026-11-26T03:00:00.000Z');
  provar('reservar fecha a porta a um segundo pedido', consultores.estadoDoLink(reserva.visita, '2026-11-26T03:01:00.000Z').estado === 'reservada', null);
  provar('…e a reserva cai sozinha ao fim de ' + consultores.MINUTOS_DE_RESERVA + ' minutos',
    consultores.estadoDoLink(reserva.visita, '2026-11-26T03:11:00.000Z').ok === true, null);
  /* A direcção do erro, medida: uma reserva sem data legível NÃO fecha o link para sempre. */
  provar('…e uma reserva com data ilegível não prende o link',
    consultores.reservaActiva({ reservadaEm: 'nem-isto-e-uma-data' }, '2026-11-26T03:00:00.000Z') === false, null);

  /* ── §D a rota: reserva, gasta, e larga quando falha ──────────────────────────────────── */

  console.log('\n§D a rota reserva antes de criar, gasta depois, e LARGA quando a criação falha');

  const d = await bancada();
  const criacaoOk = criacaoDeMentira({ corpo: { ok: true, escola: 'studio-aurora', url: 'https://studio-aurora.padd.com.br' }, status: 201 });
  const respostaOk = await raiz.receberAVisita(pedidoDe('/api/visita/' + d.token, CORPO_DA_ESCOLA), d.env, { responderCriacao: criacaoOk });
  const corpoOk = await respostaOk.json();
  provar('a criação pela visita responde 201', respostaOk.status === 201 && corpoOk.ok === true, respostaOk.status);
  provar('…e a criação recebeu a origem «consultor»', criacaoOk.chamadas[0].opcoes.origem === 'consultor', criacaoOk.chamadas[0].opcoes.origem);
  provar('…e recebeu o consultor, com a visita', criacaoOk.chamadas[0].opcoes.consultor
    && criacaoOk.chamadas[0].opcoes.consultor.id === d.id
    && criacaoOk.chamadas[0].opcoes.consultor.visitaId === d.visita.id, criacaoOk.chamadas[0].opcoes.consultor);
  provar('…e exigiu o cadastro completo (a escola que nasce por link não nasce a meio)',
    criacaoOk.chamadas[0].opcoes.exigirCadastro === true, null);
  provar('…e a resposta DIZ que a visita ficou marcada', corpoOk.visitaGasta === true, corpoOk.visitaGasta);
  const depois = await daCasa.lerVisitas(d.env, d.id);
  provar('…e o livro diz qual escola nasceu daquela visita',
    depois.visitas[0].escolaSlug === 'studio-aurora', depois.visitas[0].escolaSlug);
  const reabrir = await daCasa.situacaoDoLink(d.env, d.token, '2026-11-26T00:05:00.000Z');
  provar('…e o link não abre segunda vez', reabrir.ok === false && reabrir.estado === 'gasta', reabrir.estado);

  /* A CRIAÇÃO QUE FALHA NÃO QUEIMA O LINK. Sem isto, um CNPJ repetido ou uma senha fraca obrigavam a
   * escola a pedir outro link ao consultor — por causa de um erro de digitação. */
  const e = await bancada();
  const criacaoRuim = criacaoDeMentira({ corpo: { ok: false, erro: 'o CNPJ 11222333000181 já é da escola «X»' }, status: 409 });
  const respostaRuim = await raiz.receberAVisita(pedidoDe('/api/visita/' + e.token, CORPO_DA_ESCOLA), e.env, { responderCriacao: criacaoRuim });
  const corpoRuim = await respostaRuim.json();
  provar('a criação que falha devolve o erro da criação, e não um erro novo',
    respostaRuim.status === 409 && /já é da escola/.test(String(corpoRuim.erro)), corpoRuim.erro);
  const depoisDaFalha = await daCasa.situacaoDoLink(e.env, e.token, '2026-11-26T00:05:00.000Z');
  provar('…e o link CONTINUA a abrir (o erro de digitação não custou o link)',
    depoisDaFalha.ok === true, depoisDaFalha.motivo);
  const livroDepoisDaFalha = await daCasa.lerVisitas(e.env, e.id);
  provar('…e a visita não ficou gasta', livroDepoisDaFalha.visitas[0].usadaEm == null, livroDepoisDaFalha.visitas[0].usadaEm);

  /* UMA EXCEPÇÃO A MEIO TAMBÉM LARGA A RESERVA — o `catch` que a rota tem, medido. */
  const f = await bancada();
  const criacaoQueEstoura = async () => { throw new Error('o Cloudflare caiu a meio'); };
  let estourou = false;
  try {
    await raiz.receberAVisita(pedidoDe('/api/visita/' + f.token, CORPO_DA_ESCOLA), f.env, { responderCriacao: criacaoQueEstoura });
  } catch (erro) { estourou = true; }
  provar('uma excepção a meio da criação sobe (não é engolida)', estourou === true, null);
  const aposEstouro = await daCasa.situacaoDoLink(f.env, f.token, '2026-11-26T00:05:00.000Z');
  provar('…e mesmo assim o link volta a abrir', aposEstouro.ok === true, aposEstouro.motivo);

  /* ── §D-bis o link que nasceu ANTES do índice ─────────────────────────────────────────────
   *
   * O defeito que ela encontrou ao vivo, a 25/11/2026: gerou o link pela F2, abriu-o depois de a F3
   * estar no ar, e leu «não abre nenhuma escola». Não era avaria do link — era um link órfão: a F2
   * escrevia a visita e não o índice, e o índice é desta fase.
   *
   * A resposta não é uma migração (que ninguém volta a correr quando aparecer outro caso): é o
   * caminho de excepção que SE CURA. Na falha do índice, procura-se a visita nos consultores — N
   * leituras, onde N é o número de CONSULTORES, não de visitas — e, achada, o índice escreve-se.
   * A segunda abertura já é um `get` só.
   */
  console.log('\n§D-bis o link que nasceu antes do índice abre — e o índice cura-se');

  const lb = await bancada();
  const segredo = require(path.join(RAIZ, 'motor/nucleo/segredo.js'));
  const hashDoLink = await segredo.hashDoToken(consultores.AMBITO_DO_LINK, lb.token);
  lb.env.PADD_KV.mem.delete(consultores.chaveDoLink(hashDoLink));
  /* A PRECONDIÇÃO, medida à parte: a chave do índice não existe, e é isso que faz deste um link da
   * F2. Sem esta asserção, o resto passaria com um índice que nunca faltou. */
  provar('a chave do índice não existe (é um link da F2)',
    !lb.env.PADD_KV.mem.has(consultores.chaveDoLink(hashDoLink)), null);
  /* E o caminho de excepção NÃO é uma porta: um hash que não está em visita nenhuma não acha dono. */
  provar('…e o caminho de excepção não inventa dono para um hash desconhecido',
    (await daCasa.porLinkLegado(lb.env, 'hash-que-nao-existe')).dono === null, null);
  const legado = await daCasa.situacaoDoLink(lb.env, lb.token, '2026-11-26T00:00:00.000Z');
  provar('…mas a página do link encontra-o pelo livro de visitas', legado.ok === true, legado.motivo);
  provar('…e diz de que escola é', legado.escolaNome === 'Studio Aurora', legado.escolaNome);
  provar('…e o índice fica escrito (a próxima abertura é um `get` só)',
    lb.env.PADD_KV.mem.has(consultores.chaveDoLink(hashDoLink)), null);
  const curado = JSON.parse(lb.env.PADD_KV.mem.get(consultores.chaveDoLink(hashDoLink)));
  provar('…e o registo curado diz que foi curado', Boolean(curado.curadoEm), Object.keys(curado));
  /* E um token que não é de ninguém continua a não abrir — o caminho de excepção não é uma porta. */
  const semNada = await daCasa.situacaoDoLink(lb.env, 'nao-e-um-link', '2026-11-26T00:00:00.000Z');
  provar('…e um token inventado continua a não abrir nada', semNada.ok === false, null);

  /* ── §E dois pedidos simultâneos, uma escola ──────────────────────────────────────────── */

  console.log('\n§E dois pedidos SIMULTÂNEOS do mesmo link dão UMA escola — é para isto que a reserva existe');

  const g = await bancada();
  /* A criação de bancada é LENTA de propósito: ela espera que o segundo pedido chegue, e é isso que
   * reproduz a corrida. Um `await` de um tick não bastava — as duas leituras aconteceriam antes de
   * qualquer escrita, que é exactamente o defeito que a reserva evita. */
  let libertarOsDois;
  const espera = new Promise((resolve) => { libertarOsDois = resolve; });
  let quantasCriacoes = 0;
  const criacaoLenta = async () => {
    quantasCriacoes += 1;
    await espera;
    return new Response(JSON.stringify({ ok: true, escola: 'studio-aurora-' + quantasCriacoes }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  };
  /* OS DOIS ARRANCAM, E SÓ DEPOIS SE LIBERTA A CRIAÇÃO. A ordem importa, e foi um defeito desta
   * prova que a ensinou: a primeira versão esperava a resposta do segundo pedido ANTES de libertar a
   * criação lenta, e com a reserva desligada os dois ficavam à espera um do outro para sempre. Uma
   * prova que pendura é pior do que uma que reprova — o corredor conta-a como «tecto» e a regressão
   * passa a viver numa lista de falhas conhecidas. Assim, é impossível bloquear: solta-se sempre. */
  const primeiro = raiz.receberAVisita(pedidoDe('/api/visita/' + g.token, CORPO_DA_ESCOLA), g.env, { responderCriacao: criacaoLenta });
  /* O segundo pedido arranca depois de o primeiro ter reservado, e antes de a criação acabar. */
  await new Promise((r) => setTimeout(r, 30));
  const segundo = raiz.receberAVisita(pedidoDe('/api/visita/' + g.token, CORPO_DA_ESCOLA), g.env, { responderCriacao: criacaoLenta });
  await new Promise((r) => setTimeout(r, 30));
  libertarOsDois();
  const [primeiroDepois, segundoDepois] = await Promise.all([primeiro, segundo]);
  const corpoSegundo = await segundoDepois.json();
  provar('o segundo pedido é RECUSADO enquanto o primeiro cria', segundoDepois.status === 409, segundoDepois.status);
  provar('…e a frase diz que o link está a ser usado, e o que fazer',
    /está a ser usado neste momento/.test(String(corpoSegundo.erro)), corpoSegundo.erro);
  provar('…e o primeiro conclui normalmente', primeiroDepois.status === 201, primeiroDepois.status);
  provar('…e só UMA criação aconteceu', quantasCriacoes === 1, quantasCriacoes);
  const livroG = await daCasa.lerVisitas(g.env, g.id);
  provar('…e o livro tem uma visita gasta, com uma escola', livroG.visitas.length === 1
    && livroG.visitas[0].usadaEm != null, livroG.visitas.length);

  /* ── §F a página ─────────────────────────────────────────────────────────────────────── */

  console.log('\n§F a página do link: formulário só quando abre, limites do catálogo, e o token no pedido');

  const catalogo = Object.assign({ modalidades: [{ id: 'bale-classico', nome: 'Balé clássico' }] },
    require(path.join(RAIZ, 'motor/nucleo/comercial.js')).catalogoDaPagina(),
    { consultoria: require(path.join(RAIZ, 'motor/nucleo/comercial.js')).consultoriaDaPagina() });
  const html = painel.paginaDaVisita({
    situacao: { ok: true, estado: 'aberta', escolaNome: 'Studio Aurora', expiraEm: '2026-12-25T12:00:00.000Z' },
    consultor: { nome: 'Maria Silva' }, token: 'abc123', catalogo,
  });
  provar('a página com o link aberto traz o formulário', html.indexOf('visita-criar') !== -1, null);
  provar('…com o nome da escola já preenchido', /value="Studio Aurora"/.test(html), null);
  provar('…e o token entra no endereço do pedido', html.indexOf('/api/visita/abc123') !== -1, null);
  provar('…e o `__TOKEN__` não sobra no HTML', html.indexOf('__TOKEN__') === -1, null);
  provar('…e não é indexável', /name="robots" content="noindex"/.test(html), null);
  /* OS SETE LIMITES, do catálogo — não de uma cópia. Uma página que os escrevesse à mão passaria a
   * mentir no dia em que o catálogo mudasse, e a mentira só apareceria na recusa. */
  const limitesDoCatalogo = (catalogo.consultoria && catalogo.consultoria.limites) || {};
  const esperado = String(Number(limitesDoCatalogo.alunas));
  provar('…e declara os limites do catálogo (as alunas)',
    html.indexOf('<strong>' + esperado + '</strong> aluna') !== -1, esperado);
  provar('…e diz que o plano não se escolhe e começa hoje',
    /plano é o da consultoria/.test(html) && /começa hoje/.test(html), null);
  provar('…e diz que no fim do mês fica em leitura (sem prometer renovação)',
    /fica em leitura/.test(html), null);
  provar('…e nomeia o consultor que a atendeu', /Maria Silva/.test(html), null);
  /* A LISTA VAZIA NÃO SE DESENHA (o defeito que a §F apanhou à primeira): sem catálogo, a página
   * dizia «a escola pode ter:» e não mostrava nada. A ausência passa a dizer-se. */
  const semLimites = painel.paginaDaVisita({
    situacao: { ok: true, estado: 'aberta', escolaNome: 'X' }, token: 'abc', catalogo: {},
  });
  provar('sem catálogo, a página NÃO promete limites vazios — diz que não chegaram',
    /limites desta demonstração não chegaram/.test(semLimites), null);
  provar('…e o catálogo do link traz os sete limites do plano consultoria',
    Object.values(require(path.join(RAIZ, 'motor/nucleo/comercial.js')).consultoriaDaPagina().limites)
      .every((v) => Number.isFinite(v)), null);

  /* AS CINCO RECUSAS NÃO TÊM FORMULÁRIO — e nenhuma delas é uma página de erro do servidor. */
  for (const [rotulo, situacao] of [
    ['link inválido', { ok: false, motivo: consultores.MOTIVO_DO_LINK_INVALIDO }],
    ['suspenso', { ok: false, suspenso: true, motivo: 'a demonstração com consultoria está suspensa.' }],
    ['gasto', { ok: false, estado: 'gasta', motivo: 'este link já foi usado.' }],
    ['expirado', { ok: false, estado: 'expirada', motivo: 'este link de demonstração expirou.' }],
  ]) {
    const pagina = painel.paginaDaVisita({ situacao, token: 'abc', catalogo });
    provar('a recusa «' + rotulo + '» não mostra o formulário', pagina.indexOf('visita-criar') === -1, null);
    provar('…e diz o motivo por palavras', pagina.indexOf(situacao.motivo.slice(0, 18)) !== -1, null);
  }

  /* A ROTA PÚBLICA, ao vivo no handler: um token inválido dá 404 no `/api/visita` e a PÁGINA
   * (200 com a frase) no `/visita/`. A diferença é deliberada: quem abre a página é a escola, e uma
   * página de erro do servidor não lhe diz o que fazer. */
  const handler = raiz.default || raiz;
  const envF = { PADD_KV: kvDeMentira(), HOST_DONO: 'danca.padd.com.br', HOST_PUBLICO: 'lastro.padd.com.br' };
  const paginaInvalida = await handler.fetch(new Request('https://lastro.padd.com.br/visita/nao-e-um-link'), envF);
  const corpoPaginaInvalida = await paginaInvalida.text();
  provar('a página de um link inválido responde 200, com a frase (não é uma página de erro)',
    paginaInvalida.status === 200 && /não abre nenhuma escola/.test(corpoPaginaInvalida), paginaInvalida.status);
  const apiInvalida = await handler.fetch(new Request('https://lastro.padd.com.br/api/visita/nao-e-um-link', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  }), envF);
  provar('…mas o pedido de criação de um link inválido responde 404', apiInvalida.status === 404, apiInvalida.status);

  /* NO ENDEREÇO DO PAINEL, O LINK NÃO ABRE — ela não é uma página do dono. */
  const enviadoAoPainel = await handler.fetch(new Request('https://danca.padd.com.br/visita/nao-e-um-link'), envF);
  provar('no endereço do painel, /visita/<token> não é servido como a página da escola',
    enviadoAoPainel.status !== 200 || !/não abre nenhuma escola/.test(await enviadoAoPainel.text()),
    enviadoAoPainel.status);

  console.log('\n' + provas + ' asserções, ' + (provas - falhas) + ' ok, ' + falhas + ' falha(s)');
  process.exit(falhas === 0 ? 0 : 1);
})();
