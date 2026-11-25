#!/usr/bin/env node
'use strict';

/*
 * provar-a-escola-em-consultoria.js — o plano consultoria e o mês de demonstração (25/11/2026).
 *
 * O QUE ELA PEDIU: «Eu vou criar uma escola como consultor […] e aí eu vou deixar para a escola esse
 * ambiente configurado com o nome dela, disponível para ela usar por um mês. Só que vai ter um
 * limite. […] esse limite não se renova, tá? […] depois ele fica completamente congelado […] Ela só
 * pode ler as coisas. […] Aí se a escola pagar, ela contratar, aí eu clico em habilitar e a escola
 * fica livre dentro daquele plano.»
 *
 * E, hoje, o nome e os dois desfechos: «a gente pode chamar de plano consultoria»; e «no caso da
 * escola que está habilitada, que está pagando, essa escola quando ela excede a franquia […] ela vai
 * ter que ser onerada» — onerada é o plano PAGO; a consultoria INTERROMPE.
 *
 * O QUE ESTA PROVA AFIRMA, e cada bloco é uma coisa que pode estar errada em silêncio:
 *
 *   A. O CATÁLOGO — os sete números, `publico: false`, fora da oferta, e os planos pagos sem tetos.
 *   B. A CRIAÇÃO — `consultoria` nasce `ativa` e grátis pelo painel; pelo público é recusada.
 *   C. AS SETE TRAVAS — N passa, N+1 recusa, e a frase nomeia o limite e o número.
 *   D. AS CONTAGENS — desligado não conta, o titular conta, editar não é criar.
 *   E. O RELÓGIO — um mês no calendário LOCAL, o último dia aberto, o seguinte `expirada`.
 *   F. O CONGELAMENTO — `GET` passa, `POST` recusa, e as rotas de leitura passam.
 *   G. A NÃO-RENOVAÇÃO — entregar duas vezes não reinicia; apagar um ciclo não devolve aulas.
 *   H. O EXPURGO — uma `expirada` NÃO é apagável; depois de «Desabilitar», entra em carência.
 *   I. O PAGAMENTO — contrato pago levanta o congelamento; «Habilitar» sozinho, não.
 *   J. AS TRÊS PONTES — nenhuma cria um disparador sem cota.
 *
 *   uso: node experimentos/provar-a-escola-em-consultoria.js
 */

const path = require('path');
const fs = require('fs');
const RAIZ = path.join(__dirname, '..');
const cotas = require(path.join(RAIZ, 'motor/nucleo/cotas.js'));
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const fuso = require(path.join(RAIZ, 'motor/nucleo/fuso.js'));
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let n = 0;
let falhas = 0;
function conferir(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

function kvDeBolso(mapa) {
  const guardado = Object.assign(Object.create(null), mapa || {});
  return {
    async get(k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
    async put(k, v) { guardado[k] = String(v); },
    async delete(k) { delete guardado[k]; },
    _guardado: guardado,
  };
}

const CONSULTORIA = { estado: 'ativa', plano: 'consultoria', planoNome: 'Plano consultoria',
  valorCentavos: 0, criadoEm: '2026-11-20T12:00:00.000Z' };
const PAGO = { estado: 'ativa', plano: 'basico', planoNome: 'Básico', valorCentavos: 6990,
  criadoEm: '2026-11-20T12:00:00.000Z' };
const PERIODO = { entregueEm: '2026-11-25T20:00:00.000Z', terminaEm: '2026-12-26T02:59:59.999Z',
  convertidaEm: null, prorrogacoes: [] };

(async () => {
  /* ── A. O CATÁLOGO ───────────────────────────────────────────────────────────────────── */
  console.log('\nA. O catálogo: sete números, e um plano que não se vende');
  {
    const c = cotas.CONSULTORIA;
    conferir('a entrada «consultoria» existe no catálogo', Boolean(c));
    conferir('…e tem os SETE números que ela deu',
      c.limites.professores === 2 && c.limites.alunas === 5 && c.limites.ciclos === 2
      && c.limites.modalidades === 2 && c.limites.aulas === 3 && c.limites.salas === 2
      && c.limites.turmas === 3, c.limites);
    conferir('…e NÃO se vende: `publico: false`', c.publico === false);
    /* A OFERTA NÃO O MOSTRA. Um plano de demonstração ao lado dos pagos seria uma quarta porta na
     * escada, e a porta de entrada do produto não é uma demonstração. */
    const daPagina = comercial.catalogoDaPagina();
    const naOferta = JSON.stringify(daPagina);
    conferir('…e não aparece no catálogo que a página da oferta recebe',
      !/consultoria/i.test(naOferta) && !/Plano consultoria/i.test(naOferta), Object.keys(daPagina));
    /* OS PLANOS PAGOS NÃO GANHARAM TETOS. É o §ADITIVO §2: neles, gente é referência interna. */
    conferir('os planos pagos continuam SEM tetos de gente',
      cotas.limitesDoRegime(PAGO) === null && cotas.regimeDoContrato(PAGO) === 'assinatura');
    conferir('…e a demonstração tem os sete',
      Object.keys(cotas.limitesDoRegime(CONSULTORIA)).length === 7);
  }

  /* ── B. A CRIAÇÃO ────────────────────────────────────────────────────────────────────── */
  console.log('\nB. A criação: pelo painel nasce ativa e grátis; pelo público, é recusada');
  {
    const doPainel = comercial.validarEscolha({ plano: 'consultoria' }, { podeDispensar: true });
    conferir('o painel cria a consultoria, e ela nasce dispensada de pagamento',
      doPainel.ok && doPainel.escolha.pagamento === 'dispensado-pelo-proprietario'
      && doPainel.escolha.valorCentavos === 0, doPainel.escolha && doPainel.escolha.pagamento);
    conferir('…e a capacidade que a tela mostra é o TETO, e não uma referência',
      doPainel.escolha.capacidade.professores === 2 && doPainel.escolha.capacidade.alunos === 5,
      doPainel.escolha.capacidade);
    const doPublico = comercial.validarEscolha({ plano: 'consultoria' }, { podeDispensar: false });
    conferir('o público NÃO cria uma consultoria — e a recusa diz a saída',
      doPublico.ok === false && /administração/.test(doPublico.erro), doPublico.erro);
    conferir('um plano inventado continua a ser recusado',
      comercial.validarEscolha({ plano: 'zzz' }, { podeDispensar: true }).ok === false);
  }

  /* ── C. AS SETE TRAVAS ───────────────────────────────────────────────────────────────── */
  console.log('\nC. As sete travas: N passa, N+1 recusa — com o limite e o número na frase');
  {
    const casos = [
      ['professores', 2], ['alunas', 5], ['ciclos', 2], ['modalidades', 2],
      ['aulas', 3], ['salas', 2], ['turmas', 3],
    ];
    const errados = [];
    for (const [d, limite] of casos) {
      const cabe = cotas.travaDaCota({ contrato: CONSULTORIA, dimensao: d, usados: limite - 1 });
      const naoCabe = cotas.travaDaCota({ contrato: CONSULTORIA, dimensao: d, usados: limite });
      if (!cabe.cabe || naoCabe.cabe) errados.push({ d, cabe: cabe.cabe, naoCabe: naoCabe.cabe });
      if (!new RegExp('inclui ' + limite + ' ').test(String(naoCabe.erro))) {
        errados.push({ d, erro: naoCabe.erro });
      }
      /* A SAÍDA TEM DE ESTAR NA FRASE. Uma parede sem porta manda a escola desistir; esta diz o que
       * fazer — «contrate um plano» — e diz também o que NÃO se perde. */
      if (!/contrate um plano/.test(String(naoCabe.erro))) errados.push({ d, semSaida: naoCabe.erro });
    }
    conferir('as sete dimensões: N passa e N+1 recusa, com o número e a saída na frase',
      errados.length === 0, errados);
    /* A MESMA PERGUNTA NUM PLANO PAGO: nunca recusa. É o §ADITIVO §2. */
    conferir('num plano pago, nenhuma das sete recusa',
      casos.every(([d, limite]) => cotas.travaDaCota({ contrato: PAGO, dimensao: d, usados: limite * 3 }).cabe));
    /* A LEITURA FALHADA RECUSA, e diz que não conseguiu contar — não finge um zero. */
    const semLeitura = cotas.travaDaCota({ contrato: CONSULTORIA, dimensao: 'alunas', usados: null });
    conferir('uma contagem que falhou RECUSA, e a frase di-lo',
      semLeitura.cabe === false && /Não foi possível contar/.test(semLeitura.erro), semLeitura.erro);
    conferir('CONTROLO: um plano pago com leitura falhada não é travado',
      cotas.travaDaCota({ contrato: PAGO, dimensao: 'alunas', usados: null }).cabe === true);
  }

  /* ── D. AS CONTAGENS ─────────────────────────────────────────────────────────────────── */
  console.log('\nD. As contagens: o que está desligado não conta, e o titular conta');
  {
    /* Um professor DESLIGADO permanece no registo (é proveniência) e não ocupa lugar; o TITULAR
     * conta, e é literal na letra dela — «o titular e mais um». As duas regras juntas são o que faz
     * «apagar e criar outro» ser permitido, e é o §7 do plano. */
    const activos = (lista) => lista.filter((p) => !p.desligado).length + 1;
    conferir('o titular conta como um dos dois',
      cotas.travaDaCota({ contrato: CONSULTORIA, dimensao: 'professores', usados: activos([]) }).cabe
      && !cotas.travaDaCota({ contrato: CONSULTORIA, dimensao: 'professores',
        usados: activos([{ desligado: false }]) }).cabe);
    conferir('…e um professor desligado liberta a vaga (teto concorrente, não de vida)',
      cotas.travaDaCota({ contrato: CONSULTORIA, dimensao: 'professores',
        usados: activos([{ desligado: true }, { desligado: true }]) }).cabe);
    conferir('as AULAS são o único teto DE VIDA',
      cotas.DE_VIDA.has('aulas') && cotas.DE_VIDA.size === 1);
  }

  /* ── D-bis. A TRAVA LIGADA, COM UM KV A SÉRIO ────────────────────────────────────────── */
  /*
   * As funções puras já estão medidas; o que falta é a LIGAÇÃO — a peça que as rotas chamam, que lê
   * o contrato do KV, escolhe o regime e conta. É aí que um erro passa despercebido: uma função
   * perfeita que a rota nunca chama não trava nada.
   */
  console.log('\nD-bis. A trava ligada: o regime vem do contrato guardado, e a contagem é a de quem chama');
  {
    const kvConsultoria = kvDeBolso({
      'bastidores/breu/comercial': JSON.stringify(CONSULTORIA),
      'bastidores/breu/professores': JSON.stringify([
        { slug: 'dono', nome: 'Titular' },
        { slug: 'outro', nome: 'Outro' },
      ]),
      'bastidores/breu/curadorias': JSON.stringify([
        { id: 'c1', nome: 'Turma A' },
        { id: 'c2', nome: 'Turma B', substituidaPor: 'c2-novo' },
      ]),
    });
    const cabe = await bastidores.travaDaConsultoria({
      kv: kvConsultoria, escola: 'breu', dimensao: 'professores', contar: () => 1,
    });
    const naoCabe = await bastidores.travaDaConsultoria({
      kv: kvConsultoria, escola: 'breu', dimensao: 'professores', contar: () => 2,
    });
    conferir('a trava lê o contrato do KV e recusa com a frase do limite',
      cabe.ok === true && naoCabe.ok === false && /inclui 2 professores/.test(naoCabe.erro), naoCabe);
    /* O REGIME VEM DO REGISTO, e não de um argumento: a mesma chamada numa escola que paga não
     * trava, mesmo com a contagem acima de tudo. É o §ADITIVO §2, medido na ligação. */
    const kvPago = kvDeBolso({ 'bastidores/breu/comercial': JSON.stringify(PAGO) });
    const noPago = await bastidores.travaDaConsultoria({
      kv: kvPago, escola: 'breu', dimensao: 'professores', contar: () => 99,
    });
    conferir('…e a mesma chamada numa escola que paga não trava', noPago.ok === true && noPago.regime === 'assinatura');
    /* A CONTAGEM QUE FALHA RECUSA — e a diferença é a que o §13 exige: «não se inventa um zero
     * quando a leitura falha». */
    const falhou = await bastidores.travaDaConsultoria({
      kv: kvConsultoria, escola: 'breu', dimensao: 'alunas',
      contar: () => { throw new Error('KV fora'); },
    });
    conferir('…e uma contagem que rebenta recusa, em vez de deixar passar',
      falhou.ok === false && /Não foi possível contar/.test(falhou.erro), falhou.erro);

    /* AS CONTAGENS: o que está desligado ou substituído não conta. */
    const contagens = await bastidores.contagensDaConsultoria({
      env: { ESCOLA_SLUG: 'breu' }, kv: kvConsultoria, escola: 'breu', contagem: { ciclos: 1, aulas: 2 },
    });
    /* O DONO VEM DO SECRET (`PROFESSOR_SLUG`), e aqui ele não está posto: contam os dois da lista.
     * Com o dono, seriam três — e é por isso que a asserção seguinte põe a `var` e volta a contar. */
    conferir('os dois professores da lista contam', contagens.professores === 2, contagens.professores);
    const comDono = await bastidores.contagensDaConsultoria({
      env: { PROFESSOR_SLUG: 'dono' }, kv: kvConsultoria, escola: 'breu', contagem: {},
    });
    conferir('…e o TITULAR conta como um dos dois (com o dono, são três)',
      comDono.professores === 3, comDono.professores);
    conferir('a curadoria SUBSTITUÍDA não conta como turma', contagens.turmas === 1, contagens.turmas);
    conferir('…e os ciclos e as aulas vêm de fora, como o chamador os leu',
      contagens.ciclos === 1 && contagens.aulas === 2, contagens);
    /* O QUE NÃO SE CONTOU SAI `null`, e o resumo mostra «—». É a mesma disciplina da franquia. */
    /* UM KV VAZIO É «LI E NÃO HÁ» — zero, e um zero verdadeiro. O que dá `null` é a leitura que
     * FALHA, e é essa que a asserção seguinte força. */
    const semNada = await bastidores.contagensDaConsultoria({
      env: { ESCOLA_SLUG: 'breu' }, kv: kvDeBolso({}), escola: 'breu', contagem: {},
    });
    conferir('um KV vazio lê-se como zero (contou-se, e não há)',
      semNada.professores === 0 && semNada.turmas === 0, semNada);
    const kvPartido = { async get() { throw new Error('KV fora'); }, async put() {} };
    const falhada = await bastidores.contagensDaConsultoria({
      env: { ESCOLA_SLUG: 'breu' }, kv: kvPartido, escola: 'breu', contagem: {},
    });
    conferir('…e uma leitura que FALHA sai `null`, e não zero',
      falhada.professores === null && falhada.turmas === null, falhada);
    const resumo = cotas.resumoDasCotas({
      contrato: CONSULTORIA, contagens: { professores: 2, alunas: 5 },
    });
    conferir('…e o resumo mostra «—» onde não há contagem, e «2/2» onde há',
      resumo.dimensoes.ciclos.texto === '—' && resumo.dimensoes.professores.texto === '2/2', resumo.dimensoes);
    conferir('…e a frase de topo nomeia as dimensões que encheram',
      /professores \(2\/2\)/.test(String(resumo.frase)) && /alunas \(5\/5\)/.test(String(resumo.frase)),
      resumo.frase);
  }

  /* ── E. O RELÓGIO ────────────────────────────────────────────────────────────────────── */
  console.log('\nE. O relógio: um mês no calendário LOCAL, e o último dia está aberto');
  {
    /* O CASO DELA, ao minuto: entregue a 25/11 às 17:00 locais, o mês fecha a 25/12 às 23:59:59
     * locais — que são 26/12 às 02:59:59 UTC. O exemplo é o do próprio plano, e é a asserção que
     * prova que a conta é de calendário e não de 30 dias. */
    const fim = fuso.fimDeUmMes('2026-11-25T20:00:00.000Z');
    conferir('entregue a 25/11, o mês termina a 25/12 às 23:59:59 locais',
      fim === '2026-12-26T02:59:59.999Z', fim);
    conferir('…o último dia ainda está aberto (1 ms antes é dentro)',
      fuso.diaLocal('2026-12-26T02:59:59.998Z') === '25/12/2026');
    conferir('…e o instante seguinte é o fim',
      fuso.diaLocal('2026-12-26T03:00:00.000Z') === '26/12/2026');
    /* 31/01 + 1 mês = 28/02, e não 02/03: um mês é do calendário, e o dia é limitado ao último
     * daquele mês. */
    conferir('31/01 + um mês dá 28/02, no dia local',
      fuso.diaLocal(fuso.fimDeUmMes('2026-01-31T15:00:00.000Z')) === '28/02/2026',
      fuso.diaLocal(fuso.fimDeUmMes('2026-01-31T15:00:00.000Z')));
    conferir('uma data que não é data não produz prazo nenhum', fuso.fimDeUmMes('nada') === null);

    /* O ESTADO EFECTIVO, com um «agora» explícito — é o que faz o congelamento ser cálculo e não
     * cron. */
    const comPeriodo = Object.assign({}, CONSULTORIA, { periodoDeConsultoria: PERIODO });
    conferir('durante o mês, a escola está ativa',
      comercial.estadoEfetivo({ contrato: comPeriodo, agora: '2026-12-01T12:00:00.000Z' }) === 'ativa');
    conferir('no último instante do mês, ainda está ativa',
      comercial.estadoEfetivo({ contrato: comPeriodo, agora: '2026-12-26T02:59:59.998Z' }) === 'ativa');
    conferir('e um milissegundo depois é `expirada`',
      comercial.estadoEfetivo({ contrato: comPeriodo, agora: '2026-12-26T03:00:00.000Z' }) === 'expirada');
    /* UMA ESCOLA CRIADA HÁ DOIS MESES E ENTREGUE HOJE TEM O MÊS INTEIRO — é a diferença entre
     * contar da entrega e contar da criação (D2 vs. a J3 da L12). */
    const antiga = Object.assign({}, comPeriodo, { criadoEm: '2026-09-25T12:00:00.000Z' });
    conferir('…e é a entrega que conta, não a criação (criada há 2 meses, mês inteiro)',
      comercial.estadoEfetivo({ contrato: antiga, agora: '2026-12-20T12:00:00.000Z' }) === 'ativa');
    /* O ESTADO GUARDADO FICA `ativa` — é o que faz o D3 funcionar (o congelamento não inicia a
     * carência). */
    conferir('…e o estado GRAVADO continua `ativa` depois de expirar',
      comPeriodo.estado === 'ativa');
  }

  /* ── E-bis. A FAIXA QUE A ESCOLA LÊ ─────────────────────────────────────────────────── */
  /*
   * O §8.1 do plano: «uma faixa discreta com o fim e o consumo dos sete limites». Ela vive no mês a
   * mês — a página do extrato —, e o que se mede aqui é que os números que ela mostra são os do
   * motor: o mesmo `resumoDasCotas` que as rotas usam para recusar.
   */
  console.log('\nE-bis. A faixa do mês a mês: o prazo e os sete consumos, com «—» onde não se contou');
  {
    const contrato = Object.assign({}, CONSULTORIA, {
      periodoDeConsultoria: PERIODO,
      /* O LIVRO com uma aula já gasta: é dele que sai o número de aulas da faixa, e um livro vazio
       * mostraria «0/3» sobre uma escola que já deu uma — a mesma diferença entre «não li» e «zero»
       * que a faixa respeita nas outras dimensões. */
      aulasDaConsultoria: { aulas: { 'demi-plie/piano/01': '2026-11-04' } },
    });
    const situacao = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js')).situacaoDaEscola({
      escola: 'breu', contrato, livro: [], agora: new Date('2026-12-01T12:00:00.000Z'),
    });
    const html = bastidores.paginaFinanceiro('breu', {}, {}, {
      situacao: Object.assign({}, situacao, { frase: 'x' }), cadastro: { escolaNome: 'Breu' },
      contrato, pix: { chave: '1' }, cobrancas: {},
      contagensDaConsultoria: { professores: 1, alunas: 3, salas: 1, turmas: 1, modalidades: 1 },
    });
    conferir('a faixa diz até quando vai a demonstração, no dia local',
      /Demonstração até 25\/12\/2026/.test(html));
    conferir('…e mostra os sete consumos, com o que não se contou em «—»',
      /professores 1\/2/.test(html) && /alunas 3\/5/.test(html) && /ciclos —/.test(html)
      && /aulas 1\/3/.test(html), (html.match(/professores [^<]*/) || [])[0]);
    /* UMA DIMENSÃO CHEIA É DITA — e é dita por palavras, e não só pelo número. */
    const cheia = bastidores.paginaFinanceiro('breu', {}, {}, {
      situacao: Object.assign({}, situacao, { frase: 'x' }), cadastro: { escolaNome: 'Breu' },
      contrato, pix: { chave: '1' }, cobrancas: {},
      contagensDaConsultoria: { professores: 2, alunas: 5, salas: 1, turmas: 1, modalidades: 1 },
    });
    conferir('…e quando uma dimensão enche, a faixa nomeia-a',
      /chegou ao limite em: professores \(2\/2\)/.test(cheia),
      (cheia.match(/chegou ao limite[^<]*/) || [])[0]);
    /* A ESCOLA QUE PAGA NÃO TEM FAIXA NENHUMA — o regime manda, e não o período. */
    const paga = bastidores.paginaFinanceiro('breu', {}, {}, {
      situacao: Object.assign({}, situacao, { frase: 'x' }), cadastro: { escolaNome: 'Breu' },
      contrato: Object.assign({}, PAGO, { periodoDeConsultoria: PERIODO }),
      pix: { chave: '1' }, cobrancas: {}, contagensDaConsultoria: { professores: 9 },
    });
    conferir('…e a escola que pagou não vê faixa de demonstração',
      !/Demonstração até/.test(paga));
  }

  /* ── F. O CONGELAMENTO ───────────────────────────────────────────────────────────────── */
  console.log('\nF. O congelamento: ler passa, escrever recusa — e as rotas de leitura passam');
  {
    const pedido = (metodo, caminho) => ({ method: metodo, url: 'https://breu.padd.com.br' + caminho });
    conferir('GET passa sempre', producao.ehEscrita(pedido('GET', '/x'), '/x') === false);
    conferir('POST de escrita recusa', producao.ehEscrita(pedido('POST', '/api/receber'), '/api/receber') === true);
    /* O BILHETE: `ato` emite (leitura no efeito) e `ato/consumir` NÃO está na lista — um bilhete
     * não pode ser trocado por um acto numa escola congelada. Esta asserção existe porque um `POST`
     * na lista de leitura é uma porta que se abre por engano. */
    conferir('o bilhete: emitir passa, consumir NÃO',
      producao.ehEscrita(pedido('POST', '/api/bastidores/ato'), '/api/bastidores/ato') === false
      && producao.ehEscrita(pedido('POST', '/api/bastidores/ato/consumir'),
        '/api/bastidores/ato/consumir') === true);
    conferir('a validação de senha e a ficha do professor passam (são leitura)',
      producao.ehEscrita(pedido('POST', '/api/bastidores/validar-senha'),
        '/api/bastidores/validar-senha') === false
      && producao.ehEscrita(pedido('POST', '/api/bastidores/ficha-do-professor'),
        '/api/bastidores/ficha-do-professor') === false);
    /* AS DUAS FRASES SÃO DIFERENTES, e é de propósito: uma escola que parou de pagar não é a mesma
     * coisa que uma demonstração que chegou ao fim (L12). */
    conferir('a frase da expirada é OUTRA, e diz o que aconteceu',
      comercial.MENSAGEM_DA_EXPIRADA !== comercial.MENSAGEM_DA_SUSPENSAO
      && /demonstração terminou/i.test(comercial.MENSAGEM_DA_EXPIRADA)
      && !/regularizar/i.test(comercial.MENSAGEM_DA_EXPIRADA),
      comercial.MENSAGEM_DA_EXPIRADA);
    conferir('…e a do suspensa continua a ser a de sempre',
      /suspenso/i.test(comercial.MENSAGEM_DA_SUSPENSAO));
  }

  /* ── G. A NÃO-RENOVAÇÃO ──────────────────────────────────────────────────────────────── */
  console.log('\nG. A não-renovação: entregar duas vezes não reinicia, e apagar não devolve aulas');
  {
    const kv = kvDeBolso({
      'bastidores/breu/comercial': JSON.stringify(Object.assign({}, CONSULTORIA,
        { periodoDeConsultoria: PERIODO })),
    });
    const env = { PADD_KV: kv, HOST_DONO: 'danca.padd.com.br', SENHA_RAIZ: 's' };
    const AUTORIZACAO = 'Basic ' + Buffer.from('tmenegaz:s').toString('base64');
    const pedir = async (corpo) => {
      const r = await raiz.fetch(new Request('https://danca.padd.com.br/api/escola/consultoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: AUTORIZACAO },
        body: JSON.stringify(corpo),
      }), env);
      return { status: r.status, corpo: await r.json() };
    };
    const antes = JSON.parse(await kv.get('bastidores/breu/comercial')).periodoDeConsultoria.terminaEm;
    const segunda = await pedir({ escola: 'breu', acao: 'entregar' });
    conferir('entregar de novo é RECUSADO — o mês não se reinicia',
      segunda.status === 409 && /não se reinicia/.test(segunda.corpo.erro), segunda.corpo);
    const depois = JSON.parse(await kv.get('bastidores/breu/comercial')).periodoDeConsultoria.terminaEm;
    conferir('…e `terminaEm` não se moveu', antes === depois, { antes, depois });

    /* A PRORROGAÇÃO EXISTE, conta DO FIM que já estava marcado, e fica registada com motivo. */
    const prorrogada = await pedir({ escola: 'breu', acao: 'prorrogar', motivo: 'pediu mais um mês' });
    conferir('a prorrogação acrescenta um mês, contado do fim anterior',
      prorrogada.status === 200 && prorrogada.corpo.de === antes
      && fuso.diaLocal(prorrogada.corpo.terminaEm) === '25/01/2027', prorrogada.corpo);
    const registo = JSON.parse(await kv.get('bastidores/breu/comercial'));
    conferir('…e fica no registo, com motivo e autor',
      registo.periodoDeConsultoria.prorrogacoes.length === 1
      && registo.periodoDeConsultoria.prorrogacoes[0].motivo === 'pediu mais um mês', registo.periodoDeConsultoria.prorrogacoes);
    conferir('…e `entregueEm` continua o de origem — a entrega é um facto único',
      registo.periodoDeConsultoria.entregueEm === PERIODO.entregueEm);
    conferir('…e o estado gravado continua `ativa` (o congelamento é calculado)',
      registo.estado === 'ativa');

    /* O LIVRO DE AULAS: apagar um ciclo não devolve a vaga. A prova é a diferença entre o livro
     * (que só cresce) e a contagem derivada (que desce quando o dado desaparece). */
    let livro = cotas.lerLivroDeAulas(null);
    livro = cotas.registarNoLivro(livro, { professor: 'p', variante: 'piano', numero: '01' }, '2026-11-04');
    livro = cotas.registarNoLivro(livro, { professor: 'p', variante: 'piano', numero: '02' }, '2026-11-06');
    conferir('o livro conta duas aulas distintas', cotas.aulasNoLivro(livro) === 2);
    const outraVez = cotas.registarNoLivro(livro, { professor: 'p', variante: 'piano', numero: '01' });
    conferir('…e a mesma aula registada duas vezes continua a ser UMA',
      cotas.aulasNoLivro(outraVez) === 2, outraVez.aulas);
    /* A terceira aula fecha o teto; a quarta é recusada — e é esta a diferença para a franquia, que
     * paga o excedente em vez de interromper. */
    livro = cotas.registarNoLivro(livro, { professor: 'p', variante: 'rosa', numero: '01' });
    conferir('três aulas gastam o teto de vida',
      cotas.travaDaCota({ contrato: CONSULTORIA, dimensao: 'aulas', usados: cotas.aulasNoLivro(livro) }).cabe === false);
  }

  /* ── H. O EXPURGO ────────────────────────────────────────────────────────────────────── */
  console.log('\nH. O expurgo: uma expirada NÃO é apagável, e o congelamento não inicia a carência');
  {
    const comPeriodo = Object.assign({}, CONSULTORIA, { periodoDeConsultoria: PERIODO });
    const veredicto = raiz.estadoDoExpurgo
      ? raiz.estadoDoExpurgo(comPeriodo, { agora: '2027-03-01T12:00:00.000Z' })
      : null;
    /* A REGRA NÃO MUDOU, e é isso que a asserção mede: `estadoDoExpurgo` só aceita apagar uma
     * `suspensa` com `desabilitadaEm` e carência vencida. Uma `expirada` guardada como `ativa` não
     * é apagável, e portanto o fim da demonstração não põe a escola a caminho do expurgo (D3). */
    conferir('uma consultoria expirada NÃO é apagável automaticamente',
      veredicto !== null && veredicto.pode === false, veredicto);
    conferir('…e o estado guardado continua `ativa`, que é o que impede o expurgo',
      comPeriodo.estado === 'ativa' && comercial.estadoEfetivo({
        contrato: comPeriodo, agora: '2027-03-01T12:00:00.000Z',
      }) === 'expirada');
    /* DEPOIS DE «DESABILITAR», sim: aí há `suspensa`, `desabilitadaEm`, e a carência corre. É o
     * único caminho — e é a decisão dela, não do relógio. */
    const suspensa = Object.assign({}, comPeriodo, {
      estado: 'suspensa', desabilitadaEm: '2027-03-01T12:00:00.000Z',
    });
    const depoisDeDesabilitar = raiz.estadoDoExpurgo
      ? raiz.estadoDoExpurgo(suspensa, { agora: '2027-03-02T12:00:00.000Z' }) : null;
    conferir('…e depois de ela clicar «Desabilitar», a carência corre',
      depoisDeDesabilitar !== null && Boolean(depoisDeDesabilitar.carenciaAte), depoisDeDesabilitar);
  }

  /* ── I. O PAGAMENTO ──────────────────────────────────────────────────────────────────── */
  console.log('\nI. O pagamento levanta o congelamento — «Habilitar» sozinho, não');
  {
    const comPeriodo = Object.assign({}, CONSULTORIA, { periodoDeConsultoria: PERIODO });
    const vencida = '2027-02-01T12:00:00.000Z';
    conferir('a consultoria vencida está `expirada`',
      comercial.estadoEfetivo({ contrato: comPeriodo, agora: vencida }) === 'expirada');
    /* O CONTRATO PAGO É A PORTA: com ele, o efectivo volta a `ativa` mesmo com o período vencido — e
     * o período fica como história. */
    const paga = Object.assign({}, comPeriodo, { plano: 'basico', planoNome: 'Básico' });
    conferir('…e com o contrato pago volta a `ativa`, sem tocar no período',
      comercial.estadoEfetivo({ contrato: paga, agora: vencida }) === 'ativa'
      && paga.periodoDeConsultoria.terminaEm === PERIODO.terminaEm);
    /* «HABILITAR» SOZINHO NÃO É UMA PORTA DE FUGA: o estado guardado muda para `ativa` (é o que o
     * botão faz), mas sem plano pago o efectivo continua `expirada`. */
    const soHabilitada = Object.assign({}, comPeriodo, { estado: 'ativa', habilitadaEm: vencida });
    conferir('«Habilitar» sozinho NÃO levanta o congelamento',
      comercial.estadoEfetivo({ contrato: soHabilitada, agora: vencida }) === 'expirada');
    conferir('…e a única porta é o contrato — `planoPago` distingue os dois',
      comercial.planoPago('consultoria') === false && comercial.planoPago('basico') === true);
    /* O CONTADOR DA DEMONSTRAÇÃO NÃO TRANSITA: as 3 aulas foram custo de aquisição, e a franquia
     * mensal começa no contrato. A prova mede-o pela separação dos dois números. */
    const comLivro = Object.assign({}, paga, {
      aulasDaConsultoria: { aulas: { 'p/piano/01': '2026-11-04', 'p/piano/02': '2026-11-06',
        'p/piano/03': '2026-11-11' } },
    });
    conferir('o livro da demonstração fica fechado como facto (3 aulas), e não vira franquia',
      cotas.aulasNoLivro(comLivro.aulasDaConsultoria) === 3
      && cotas.limitesDoRegime(comLivro) === null);
  }

  /* ── J. AS TRÊS PONTES ───────────────────────────────────────────────────────────────── */
  console.log('\nJ. As três pontes do ciclo passam a cota — nenhuma fica aberta em silêncio');
  {
    /* O CICLO NASCE POR TRÊS PONTES, e uma trava numa só deixaria as outras duas abertas — «o teto a
     * funcionar no botão A e a não funcionar no botão B». A prova lê os três ficheiros e exige a
     * opção em cada chamada. Uma ponte muda é uma porta aberta em silêncio, e é isso que se mede. */
    const pontes = [
      ['bastidores.js', 'motor/servidor/bastidores.js'],
      ['node.js', 'motor/servidor/node.js'],
      ['cloudflare.js', 'motor/servidor/cloudflare.js'],
    ];
    const semCota = [];
    for (const [nome, rel] of pontes) {
      const texto = fs.readFileSync(path.join(RAIZ, rel), 'utf8');
      const i = texto.indexOf('criarDisparador({');
      if (i === -1) { semCota.push({ nome, motivo: 'não achei a chamada' }); continue; }
      /* O BLOCO DA CHAMADA vai até ao `});` que a fecha; olha-se para dentro dele. */
      const fim = texto.indexOf('\n}', i) === -1 ? texto.length : texto.length;
      const bloco = texto.slice(i, Math.min(fim, i + 3000));
      if (!/\bcota\s*:/.test(bloco)) semCota.push({ nome, motivo: 'sem a opção `cota`' });
    }
    conferir('as três pontes passam a cota ao disparador', semCota.length === 0, semCota);
    /* E A DE PRODUÇÃO RECUSA DE FACTO: a ponte declara-se muda, e é uma declaração, não um silêncio. */
    const nodeFonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/node.js'), 'utf8');
    conferir('…e a de desenvolvimento DECLARA que não conta',
      /ponte de desenvolvimento/.test(nodeFonte));
  }

  /* ── K. OS DOIS DESFECHOS SÃO DIFERENTES ─────────────────────────────────────────────── */
  console.log('\nK. Onerar e interromper são coisas diferentes — e é a distinção do dia');
  {
    /* A CONSULTORIA INTERROMPE. O plano pago ONERA: a franquia é uma comparação, e o que passa
     * paga-se como excedente (R$ 8,00 por aula, decidido hoje). Mede-se que os dois caminhos não se
     * confundem — uma escola em consultoria não tem excedente, e uma escola paga não tem teto. */
    const contadorDeAulas = require(path.join(RAIZ, 'motor/nucleo/contador-de-aulas.js'));
    /* AS DUAS CHAVES SÃO DIFERENTES, E É DE PROPÓSITO: o contador da franquia guarda
     * `<variante>/<numero>` (a aula dentro da escola, que é o que a factura conta) e o livro da
     * consultoria guarda `<professor>/<variante>/<numero>` (a identidade completa, que é o que não se
     * renova). Confundi-las aqui faria a prova medir um formato que o produto não usa. */
    const contagem = { fonte: 'x', meses: { '2026-11': {} } };
    for (let i = 1; i <= 5; i += 1) contagem.meses['2026-11']['piano/' + String(i).padStart(2, '0')] = '2026-11-05';
    const excedente = contadorDeAulas.excedenteDoMes({ contagem, competencia: '2026-11', franquia: 3 });
    conferir('no plano PAGO, passar da franquia gera excedente em reais',
      excedente && excedente.aulas === 2 && excedente.centavos === 1600, excedente);
    conferir('na CONSULTORIA, passar do teto INTERROMPE — e não há excedente a calcular',
      cotas.travaDaCota({ contrato: CONSULTORIA, dimensao: 'aulas', usados: 3 }).cabe === false
      && cotas.limitesDoRegime(CONSULTORIA).aulas === 3);
    /* E A FRASE DIZ QUAL DOS DOIS É: a da consultoria manda contratar; a do excedente fala de
     * cobrança no mês seguinte. Duas frases porque são dois factos. */
    const fraseDoPago = contadorDeAulas.resumo({ contagem, competencia: '2026-11', franquia: 3 }).frase;
    conferir('…e as duas frases não se confundem',
      /contrate um plano/.test(cotas.travaDaCota({ contrato: CONSULTORIA, dimensao: 'aulas', usados: 3 }).erro)
      && /cobrados no mês seguinte/.test(fraseDoPago), fraseDoPago);
  }

  console.log('');
  if (falhas) { console.log('FALHOU — ' + (n - falhas) + '/' + n); process.exit(1); }
  console.log('TUDO CERTO — ' + n + ' asserção(ões): o plano consultoria nasce do painel com os sete '
    + 'limites, o mês corre da entrega no calendário local e congela em só-leitura sem iniciar a '
    + 'carência, os sete tetos recusam N+1 com a frase que nomeia o limite e a saída, as aulas não se '
    + 'renovam, e pagar é a única porta que levanta o congelamento.');
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
