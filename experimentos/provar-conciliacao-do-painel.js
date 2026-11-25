#!/usr/bin/env node
'use strict';

/*
 * provar-conciliacao-do-painel.js — o financeiro do painel deixa de mentir por omissão (17/11/2026).
 *
 * O QUE ELA DISSE, e é o pedido inteiro: «Pedi para parar porque você não colocou a conciliação no
 * financeiro do danca.padd.com.br. Por isso não consegui informar o pagamento e nem mudar de plano
 * de pagos ou inadimplentes.»
 *
 * O DIAGNÓSTICO, e não é opinião — é uma diferença entre duas chamadas do mesmo núcleo:
 *
 *   · `bastidores.dadosDaEscolaParaAProducao` (a página da escola) lê a chave `ensaio` e passa-a a
 *     `mensalidades.situacaoDaEscola`;
 *   · `raiz.extratoDasEscolas` (o painel do `danca.padd.com.br`) NÃO a lia.
 *
 * Resultado: com o relógio comprimido ligado, a ESCOLA via «dezembro · em aberto · R$ 169,90 · Pagar»
 * e o PAINEL continuava a ver só «novembro · pago». O mês que a escola pedia para pagar não existia
 * do lado de quem concilia — e não havia botão nenhum para o informar. A mesma pergunta («que meses
 * há?») com duas respostas é o pior defeito possível num ecrã de dinheiro.
 *
 * O QUE ESTA PROVA AFIRMA, e cada uma é uma coisa que falhava:
 *
 *   1. as duas leituras dão a MESMA lista de meses (mesmo com ensaio, e sem ele);
 *   2. o painel tem, por escola, um campo para INFORMAR um pagamento — e aceita um mês que ainda não
 *      está no extrato, que é o caso em que ela estava: o mês que a escola pediu não tinha linha;
 *   3. a rota RECUSA uma escola que não existe;
 *   4. a rota RECUSA um mês que não é mês;
 *   5. o «mudar o plano» está à vista no cartão, e não escondido dentro de outro acordeão.
 *
 * A 3 é a que sujava o livro: a rota aceitava qualquer slug e gravava um pagamento de R$ 0,00. Uma
 * linha dessas não se distingue de um pagamento a sério na soma do mês seguinte.
 *
 *   uso: node experimentos/provar-conciliacao-do-painel.js
 */

const path = require('path');
const RAIZ = path.join(__dirname, '..');
const mensalidades = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const { JSDOM } = require('jsdom');

let n = 0;
let falhas = 0;
function conferir(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const CONTRATO = {
  plano: 'basico', planoNome: 'Básico', valorCentavos: 16990,
  capacidade: { professores: 4, alunos: 40 }, lotesProfessores: [3], lotesAlunos: [30],
  criadoEm: '2026-11-17T00:41:26Z', habilitadaEm: '2026-11-17T00:41:26Z', estado: 'ativa',
};

/** O KV dos Bastidores é `get`/`put`; o livro mora em `financeiro/mensalidades`. */
function kvEmMemoria(mapa) {
  const guardado = Object.assign(Object.create(null), mapa);
  return {
    async get(k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
    async put(k, v) { guardado[k] = String(v); },
    async delete(k) { delete guardado[k]; },
    _guardado: guardado,
  };
}

const LIVRO = {
  lista: [{ escola: 'breu', mes: '2026-11', status: 'pago', valorCentavos: 23990,
    plano: 'avancado', planoNome: 'Avançado', em: '2026-11-17T00:48:32Z', por: 'proprietario' }],
  atualizadoEm: '2026-11-17T00:48:32Z',
};

const SENHA = 'segredo-da-raiz';
const AUTORIZACAO = 'Basic ' + Buffer.from('tmenegaz:' + SENHA).toString('base64');
const envCom = (ensaio, agora) => ({
  HOST_DONO: 'danca.padd.com.br',
  HOST_PUBLICO: 'lastro.padd.com.br',
  SENHA_RAIZ: SENHA,
  PADD_KV: kvEmMemoria({
    'bastidores/breu/comercial': JSON.stringify(CONTRATO),
    'bastidores/breu/cadastro': JSON.stringify({ escolaNome: 'Breu' }),
    'financeiro/mensalidades': JSON.stringify(LIVRO),
    ...(ensaio ? { 'bastidores/breu/ensaio': JSON.stringify(ensaio) } : {}),
  }),
  AGORA: agora,
});

const ESCOLAS = [{ slug: 'breu', nome: 'Breu' }];

(async () => {
  /* ── 1. AS DUAS LEITURAS ──────────────────────────────────────────────────────────────── */
  console.log('\n1. O painel e a escola respondem a MESMA coisa sobre os meses');
  {
    const ensaio = { minutosPorPeriodo: 3, base: '2026-11-17T17:00:00Z' };
    /* O «agora» é o das duas: a página da escola usa o relógio do processo, e o painel aceita um
     * `agora` explícito. Para as comparar, o mesmo instante de ensaio — 4 minutos depois da base,
     * que são dois períodos e portanto dois meses. */
    const agoraDoPainel = '2026-11-17T17:04:00Z';
    const doPainel = await raiz.extratoDasEscolas({
      env: envCom(ensaio), escolas: ESCOLAS, agora: agoraDoPainel,
    });
    const daEscola = mensalidades.situacaoDaEscola({
      escola: 'breu', contrato: CONTRATO, livro: mensalidadesDoLivro(), ensaio,
      agora: agoraDoPainel,
    });
    const mesesDoPainel = (doPainel[0] && doPainel[0].meses || []).map((m) => m.mes);
    const mesesDaEscola = daEscola.meses.map((m) => m.mes);
    conferir('com ensaio, o painel vê os mesmos meses que a escola',
      JSON.stringify(mesesDoPainel) === JSON.stringify(mesesDaEscola),
      { painel: mesesDoPainel, escola: mesesDaEscola });
    conferir('…e são dois meses — o pago e o que o ensaio abriu',
      mesesDaEscola.length === 2, mesesDaEscola);
    /* SEM ENSAIO, as duas continuam iguais — a correcção não pode inventar meses onde não há. */
    const semEnsaioPainel = await raiz.extratoDasEscolas({
      env: envCom(null), escolas: ESCOLAS, agora: agoraDoPainel,
    });
    conferir('…e sem ensaio as duas dão um mês só, o de novembro',
      (semEnsaioPainel[0].meses || []).map((m) => m.mes).join(',') === '2026-11',
      (semEnsaioPainel[0].meses || []).map((m) => m.mes));
  }

  /* ── 2. INFORMAR UM PAGAMENTO, INCLUSIVE DE UM MÊS SEM LINHA ──────────────────────────── */
  console.log('\n2. O painel deixa INFORMAR um pagamento — e de um mês que ainda não tem linha');
  {
    const html = painel.paginaFinanceira({
      pix: { chave: 'k', titular: 'T' }, descontos: [],
      escolas: ESCOLAS,
      extrato: [{
        escola: 'breu', nome: 'Breu', planoNome: 'Básico', valorCentavos: 16990,
        situacao: 'em-dia', mesDeHoje: '2026-11', emAberto: [], vencidos: [],
        meses: [{ mes: '2026-11', nome: 'novembro de 2026', vencimento: '2026-11-16',
          status: 'pago', valorCentavos: 23990, valorPagoCentavos: 23990,
          planoNome: 'Avançado', emTexto: '16/11/2026 às 21:48' }],
        estadoComercial: 'ativa', frase: 'Em dia.', capacidade: { professores: 4, alunos: 40 },
        piso: { professores: 4, alunos: 40 }, teto: { professores: 5, alunos: 89 },
        proximoVencimento: null, diasParaVencer: null,
        lotesProfessores: [3], lotesAlunos: [30],
      }],
      catalogo: null,
    });
    const d = new JSDOM(html).window.document;
    /* O CAMPO DE MÊS. Sem ele, o único caminho é o botão de cada linha — e um mês que ainda não
     * existe não tem linha. É exactamente o estado em que ela ficou. */
    const campoDeMes = d.querySelector('[data-pagamento-mes]');
    conferir('o cartão da escola tem um campo para informar um pagamento',
      Boolean(campoDeMes), null);
    conferir('…e o campo aceita um mês, e não só o que já está no extrato',
      campoDeMes && (campoDeMes.tagName === 'INPUT' && campoDeMes.getAttribute('type') === 'month'
        || campoDeMes.tagName === 'SELECT' && campoDeMes.querySelectorAll('option').length >= 2),
      campoDeMes && { tag: campoDeMes.tagName, tipo: campoDeMes.getAttribute('type') });
    conferir('…com o botão que o regista, ao lado',
      Boolean(d.querySelector('[data-pagamento-gravar]')), null);
    conferir('…e o rótulo diz o que faz — «Marcar como pago», e não «Gravar»',
      /marcar como pago/i.test((d.querySelector('[data-pagamento-gravar]') || {}).textContent || ''),
      (d.querySelector('[data-pagamento-gravar]') || {}).textContent);
    /* O CAMPO ABRE NO MÊS CORRENTE — o caso comum não obriga a escolher nada. */
    conferir('…e o campo já vem preenchido com o mês corrente, para o caso comum',
      campoDeMes && campoDeMes.getAttribute('value') === '2026-11',
      campoDeMes && campoDeMes.getAttribute('value'));
    /* O BOTÃO DA LINHA CONTINUA LÁ, para o caso normal. Aqui o extrato só tem novembro, e ele está
     * PAGO — portanto não há botão de linha, e é o certo: quem já pagou não vê um botão para pagar.
     * O que se afirma é a regra nos dois estados, e por isso se constrói também a escola em aberto. */
    const comAberto = painel.paginaFinanceira({
      pix: { chave: 'k', titular: 'T' }, descontos: [], escolas: ESCOLAS,
      extrato: [{
        escola: 'breu', nome: 'Breu', planoNome: 'Básico', valorCentavos: 16990,
        situacao: 'em-aberto', mesDeHoje: '2026-12', emAberto: ['2026-12'],
        vencidos: ['2026-12'],
        meses: [{ mes: '2026-12', nome: 'dezembro de 2026', vencimento: '2026-12-16',
          status: 'aberto', venceu: true, valorCentavos: 16990 }],
        estadoComercial: 'ativa', frase: 'Em aberto.', capacidade: { professores: 4, alunos: 40 },
        piso: { professores: 4, alunos: 40 }, teto: { professores: 5, alunos: 89 },
        proximoVencimento: '2026-12-16', diasParaVencer: -1,
        lotesProfessores: [3], lotesAlunos: [30],
      }],
      catalogo: null,
    });
    conferir('…e o «Marcar pago» de cada linha em aberto continua a existir, ao lado do campo',
      /data-pagar="breu"/.test(comAberto) && /data-mes="2026-12"/.test(comAberto), null);
    conferir('…e numa escola em dia não há botão de linha, porque não há o que pagar',
      !/data-pagar="breu"/.test(html), null);
    /* O CONTRATO À VISTA: o `summary` diz o que faz, e não está dentro de outro acordeão fechado. */
    const resumoDoContrato = [...d.querySelectorAll('summary')]
      .map((s) => s.textContent.trim()).filter((t) => /plano|capacidade/i.test(t));
    conferir('o «mudar o plano» está à vista, com um resumo que o nomeia',
      resumoDoContrato.length > 0 && /mudar o plano/i.test(resumoDoContrato.join(' ')),
      resumoDoContrato);
    conferir('…e o botão de gravar o contrato existe e diz o que faz',
      /gravar o contrato/i.test((d.querySelector('[data-contrato-gravar]') || {}).textContent || ''),
      (d.querySelector('[data-contrato-gravar]') || {}).textContent);
    /* E A PÁGINA REPINTA-SE SOZINHA DEPOIS DE GRAVAR (17/11/2026). Antes o recado mandava
     * recarregar — e recarregar mostrava o extrato igual, porque o mês em curso não muda por
     * desenho. Um recado que manda fazer o que não muda nada lê-se como «não funcionou». */
    conferir('…e gravar o contrato repinta a página, em vez de mandar recarregar',
      /if\(d&&d\.ok\)\{location\.reload\(\);return;\}/.test(html),
      /Recarregue para ver o extrato/.test(html) ? 'ainda manda recarregar' : null);
  }

  /* ── 3. A ROTA RECUSA UMA ESCOLA QUE NÃO EXISTE ───────────────────────────────────────── */
  console.log('\n3. A rota recusa o que não existe — antes gravava R$ 0,00');
  {
    const env = envCom(null);
    const antes = await env.PADD_KV.get('financeiro/mensalidades');
    const resposta = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/mensalidade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: AUTORIZACAO },
      body: JSON.stringify({ escola: 'zzz-nao-existe', mes: '2026-11' }),
    }), env);
    const corpo = await resposta.json();
    conferir('uma escola inexistente é recusada', corpo.ok === false, corpo);
    conferir('…e o livro fica exactamente como estava',
      (await env.PADD_KV.get('financeiro/mensalidades')) === antes, null);
    conferir('…e a recusa diz porquê, em vez de um «não foi possível»',
      /escola/i.test(String(corpo.erro || '')), corpo.erro);
    /* O MÊS TAMBÉM: um «2026-13» é um valor que o formato aceita e o calendário não. */
    const respostaMes = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/mensalidade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: AUTORIZACAO },
      body: JSON.stringify({ escola: 'breu', mes: '2026-13' }),
    }), env);
    const corpoMes = await respostaMes.json();
    conferir('um mês que não existe é recusado', corpoMes.ok === false, corpoMes);
    conferir('…e o livro continua como estava',
      (await env.PADD_KV.get('financeiro/mensalidades')) === antes, null);
  }

  /* ── 4. A ESCOLA QUE EXISTE E O MÊS QUE EXISTE ────────────────────────────────────────── */
  console.log('\n4. E o que existe grava-se, com o valor do contrato');
  {
    const env = envCom(null);
    const resposta = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/mensalidade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: AUTORIZACAO },
      body: JSON.stringify({ escola: 'breu', mes: '2026-12' }),
    }), env);
    const corpo = await resposta.json();
    conferir('um mês novo, de uma escola que existe, é aceite', corpo.ok === true, corpo);
    const livro = JSON.parse(await env.PADD_KV.get('financeiro/mensalidades'));
    const linha = (livro.lista || []).find((l) => l.escola === 'breu' && l.mes === '2026-12');
    conferir('…e entra no livro com o valor e o plano do contrato — não com zero',
      linha && linha.valorCentavos === 16990 && linha.planoNome === 'Básico', linha);
    conferir('…e o mês de novembro continua intocado, com o valor com que foi pago',
      (livro.lista || []).some((l) => l.mes === '2026-11' && l.valorCentavos === 23990), livro.lista);
  }

  /* ── 5. O ENSAIO LIGA-SE E DESLIGA-SE NO PAINEL ──────────────────────────────────────────
   *
   * «O botão de ativar ou desativar o ensaio deve ficar no https://danca.padd.com.br/financeiro e o
   * tempo deve ser de 10 minutos para cada mês. Eu ativo e desativo.»
   *
   * O QUE MUDA, e é uma mudança de DONO e não de desenho: o ensaio nasceu com um botão de saída na
   * página da ESCOLA, porque a saída de emergência não podia depender de ninguém se lembrar de um
   * comando. Agora há um controlo no painel, que é de quem concilia — e o botão da escola sai. Um
   * ensaio que a escola pode desligar não é um ensaio que a operação controla.
   *
   * O TEMPO PASSA A DEZ MINUTOS. Não é gosto: três minutos são suficientes para ver um mês nascer,
   * e curtos de mais para pagar dois seguidos e chegar a uma listagem com vários — que é o que ela
   * quer ver. Dez minutos dão para informar o pagamento com calma e ainda ver o mês seguinte abrir.
   */
  console.log('\n5. O ensaio liga-se e desliga-se no painel, a dez minutos por mês');
  {
    const env = envCom(null);
    const html = painel.paginaFinanceira({
      pix: { chave: 'k', titular: 'T' }, descontos: [], escolas: ESCOLAS,
      extrato: [{
        escola: 'breu', nome: 'Breu', planoNome: 'Básico', valorCentavos: 16990,
        situacao: 'em-dia', mesDeHoje: '2026-11', emAberto: [], vencidos: [],
        meses: [{ mes: '2026-11', nome: 'novembro de 2026', vencimento: '2026-11-16',
          status: 'pago', valorCentavos: 23990, valorPagoCentavos: 23990, planoNome: 'Avançado' }],
        estadoComercial: 'ativa', frase: 'Em dia.', capacidade: { professores: 4, alunos: 40 },
        piso: { professores: 4, alunos: 40 }, teto: { professores: 5, alunos: 89 },
        proximoVencimento: null, diasParaVencer: null,
        lotesProfessores: [3], lotesAlunos: [30], ensaio: null,
      }],
      catalogo: null,
    });
    const d = new JSDOM(html).window.document;
    conferir('o cartão da escola no PAINEL tem o controlo do ensaio',
      Boolean(d.querySelector('[data-ensaio-ligar]')), null);
    conferir('…e o rótulo diz o tempo — «10 minutos», e não «ensaio»',
      /10 minutos/.test((d.querySelector('[data-ensaio-ligar]') || {}).textContent || ''),
      (d.querySelector('[data-ensaio-ligar]') || {}).textContent);
    conferir('…e diz o que faz, com o mês no texto — ligar o relógio, não «activar»',
      /ligar/i.test((d.querySelector('[data-ensaio-ligar]') || {}).textContent || ''),
      (d.querySelector('[data-ensaio-ligar]') || {}).textContent);

    /* LIGADO: o mesmo lugar passa a oferecer DESLIGAR, e diz em que estado está. */
    const ligado = painel.paginaFinanceira({
      pix: { chave: 'k', titular: 'T' }, descontos: [], escolas: ESCOLAS,
      extrato: [{
        escola: 'breu', nome: 'Breu', planoNome: 'Básico', valorCentavos: 16990,
        situacao: 'em-dia', mesDeHoje: '2026-11', emAberto: [], vencidos: [], meses: [],
        estadoComercial: 'ativa', frase: 'Em dia.', capacidade: {}, piso: {}, teto: null,
        lotesProfessores: [], lotesAlunos: [],
        ensaio: { minutosPorPeriodo: 10, base: '2026-11-17T18:00:00Z' },
      }],
      catalogo: null,
    });
    const dl = new JSDOM(ligado).window.document;
    conferir('…e com o ensaio ligado o botão passa a dizer «desligar»',
      Boolean(dl.querySelector('[data-ensaio-desligar]'))
        && /desligar/i.test((dl.querySelector('[data-ensaio-desligar]') || {}).textContent || ''),
      (dl.querySelector('[data-ensaio-desligar]') || {}).textContent);
    conferir('…e diz de quanto está ligado, em vez de o deixar adivinhar',
      /10 min/.test(ligado), null);

    /* A ROTA GRAVA O MÊS DE PARTIDA — o primeiro sem pagamento. É o que faz o ensaio servir no
     * primeiro segundo, em vez de mostrar o mês já pago durante dez minutos. */
    const ligou = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/ensaio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: AUTORIZACAO },
      body: JSON.stringify({ escola: 'breu', minutosPorPeriodo: 10 }),
    }), env);
    const corpoLigou = await ligou.json();
    conferir('a rota grava o MÊS DE PARTIDA: o seguinte ao último pago (novembro → dezembro)',
      corpoLigou.ok === true && corpoLigou.ensaio
        && corpoLigou.ensaio.mesInicial === '2026-12', corpoLigou.ensaio);

    /* A ROTA: ligar grava a chave com a base de agora; desligar apaga-a. */
    const antes = Array.from(Object.keys(env.PADD_KV._guardado));
    const ligar = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/ensaio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: AUTORIZACAO },
      body: JSON.stringify({ escola: 'breu', minutosPorPeriodo: 10 }),
    }), env);
    const corpoLigar = await ligar.json();
    conferir('a rota liga o ensaio e devolve o que gravou',
      corpoLigar.ok === true && corpoLigar.ensaio && corpoLigar.ensaio.minutosPorPeriodo === 10,
      corpoLigar);
    const guardado = JSON.parse(await env.PADD_KV.get('bastidores/breu/ensaio'));
    conferir('…e a base é o INSTANTE DE AGORA — é o que faz o ensaio começar no mês de hoje',
      Math.abs(Date.parse(guardado.base) - Date.now()) < 5000, guardado.base);
    const desligar = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/ensaio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: AUTORIZACAO },
      body: JSON.stringify({ escola: 'breu', minutosPorPeriodo: 0 }),
    }), env);
    const corpoDesligar = await desligar.json();
    conferir('…e desliga-o apagando a chave', corpoDesligar.ok === true
      && (await env.PADD_KV.get('bastidores/breu/ensaio')) === null, corpoDesligar);
    /* E O LIVRO NÃO É TOCADO — ligar e desligar o ensaio não é um pagamento. */
    conferir('…e nem ligar nem desligar tocam no livro',
      JSON.stringify(Array.from(Object.keys(env.PADD_KV._guardado))) === JSON.stringify(antes)
        || (await env.PADD_KV.get('financeiro/mensalidades')) === JSON.stringify(LIVRO),
      Object.keys(env.PADD_KV._guardado));

    /* PEDIDO SEM MINUTOS = LIGAR NO PADRÃO, e não desligar. Um botão que manda só `{escola}` tem de
     * ligar — se a ausência valesse zero, o clique mais simples apagava o ensaio em vez de o criar. */
    const semMinutos = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/ensaio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: AUTORIZACAO },
      body: JSON.stringify({ escola: 'breu' }),
    }), env);
    const corpoSemMinutos = await semMinutos.json();
    conferir('…e um pedido sem minutos liga no padrão do botão, em vez de desligar',
      corpoSemMinutos.ok === true
        && corpoSemMinutos.ensaio
        && corpoSemMinutos.ensaio.minutosPorPeriodo === painel.ENSAIO_PADRAO_MINUTOS,
      corpoSemMinutos);
    conferir('…e o padrão é dez, como o rótulo do botão diz',
      painel.ENSAIO_PADRAO_MINUTOS === 10, painel.ENSAIO_PADRAO_MINUTOS);

    /* UMA ESCOLA QUE NÃO EXISTE NÃO GANHA UM ENSAIO. A chave ficaria lá, e um dia a escola seria
     * criada com aquele slug e nasceria a correr contra um relógio de minutos que ninguém ligou. */
    const inexistente = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/ensaio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: AUTORIZACAO },
      body: JSON.stringify({ escola: 'zzz-nao-existe', minutosPorPeriodo: 10 }),
    }), env);
    const corpoInexistente = await inexistente.json();
    conferir('…e uma escola que não existe não ganha ensaio',
      corpoInexistente.ok === false
        && (await env.PADD_KV.get('bastidores/zzz-nao-existe/ensaio')) === null, corpoInexistente);

    /* O BOTÃO DA ESCOLA SAIU. A página da escola continua a DIZER que está em ensaio — o estado é
     * informação, e quem lá está precisa de saber por que vê dezembro em novembro. O que ela deixa
     * de ter é o CONTROL O: um ensaio que a escola desliga não é um ensaio que a operação controla. */
    const paginaDaEscola = bastidores.paginaFinanceiro('breu',
      { professor: 'p', ciclo: '01', query: '' }, { modo: 'clara', paleta: 'bordo' }, {
        cadastro: { escolaNome: 'Breu' },
        ensaio: { minutosPorPeriodo: 10, base: '2026-11-17T18:00:00Z' },
        situacao: { meses: [], planoNome: 'Básico', valorCentavos: 16990 },
      });
    conferir('…e a página da ESCOLA diz o estado, mas já não tem o botão de desligar',
      /Modo de ensaio/.test(paginaDaEscola)
        && !/ensaio-desligar/.test(paginaDaEscola)
        && !/Desligar o modo de ensaio/.test(paginaDaEscola), null);
  }

  /* ── 6. A COLUNA DA SITUAÇÃO, E O BOTÃO DA CONCILIAÇÃO DE VOLTA ─────────────────────────
   *
   * «Apagou o botão que confirma se a escola pagou ou não a mensalidade, que é o resultado da
   * conciliação. Precisa voltar com esse botão. […] acrescenta uma coluna que é da situação, do
   * status do pagamento da escola, que tem esse botão.»
   *
   * O BOTÃO NUNCA SAIU DO CÓDIGO — estava numa coluna própria, à direita de «Situação», e a coluna
   * da cobrança (larga, com `<textarea>`) empurrou-o para lá do ecrã. Uma coluna que só se vê
   * rolando de lado não existe para quem olha. As duas passam a ser UMA.
   */
  console.log('\n6. A situação e o botão da conciliação na MESMA coluna — e a tabela mais estreita');
  {
    const html = painel.paginaFinanceira({
      pix: { chave: 'k', titular: 'T' }, descontos: [], escolas: ESCOLAS,
      extrato: [{
        escola: 'breu', nome: 'Breu', planoNome: 'Básico', valorCentavos: 16990,
        situacao: 'em-aberto', mesDeHoje: '2026-12', emAberto: ['2026-12'], vencidos: ['2026-12'],
        meses: [
          { mes: '2026-12', nome: 'dezembro de 2026', vencimento: '2026-12-16', status: 'aberto',
            venceu: true, valorCentavos: 16990,
            encargos: { diasDeAtraso: 9, multaCentavos: 340, jurosCentavos: 51, encargosCentavos: 391,
              totalCentavos: 17381 } },
          { mes: '2026-11', nome: 'novembro de 2026', vencimento: '2026-11-16', status: 'pago',
            valorCentavos: 23990, valorPagoCentavos: 23990, planoNome: 'Avançado',
            emTexto: '16/11/2026 às 21:48' },
        ],
        estadoComercial: 'ativa', frase: 'Em aberto.', capacidade: { professores: 4, alunos: 40 },
        piso: { professores: 4, alunos: 40 }, teto: { professores: 5, alunos: 89 },
        proximoVencimento: '2026-12-16', diasParaVencer: -9,
        lotesProfessores: [3], lotesAlunos: [30], cobrancas: {},
      }],
      catalogo: null,
    });
    const d = new JSDOM(html).window.document;
    const colunas = [...d.querySelectorAll('table thead th')].map((th) => th.textContent.trim());
    conferir('a tabela tem SEIS colunas, e não sete — a ação não sai do ecrã',
      colunas.length === 6, colunas);
    conferir('…e não há uma coluna «Pago / ação» separada da situação',
      !colunas.some((c) => /pago \/ ação/i.test(c)), colunas);
    conferir('…porque a coluna da situação passou a ter o botão',
      colunas.includes('Situação')
      && Boolean(d.querySelector('tr[data-mes="2026-12"] td:nth-child(5) [data-pagar="breu"]')), colunas);
    conferir('…e ela diz o estado por extenso: «atrasado», com a mora ao lado',
      /atrasado/.test((d.querySelector('tr[data-mes="2026-12"] td:nth-child(5)') || {}).textContent || '')
      && /de mora/.test((d.querySelector('tr[data-mes="2026-12"] td:nth-child(5)') || {}).textContent || ''),
      (d.querySelector('tr[data-mes="2026-12"] td:nth-child(5)') || {}).textContent);
    /* O MÊS PAGO NÃO TEM BOTÃO — quem já pagou não vê um botão para pagar. */
    conferir('…e o mês pago não tem botão nenhum',
      !d.querySelector('tr[data-mes="2026-11"] [data-pagar]'), null);
    conferir('…e diz quando foi pago, no mesmo sítio',
      /16\/11\/2026/.test((d.querySelector('tr[data-mes="2026-11"] td:nth-child(5)') || {}).textContent || ''),
      (d.querySelector('tr[data-mes="2026-11"] td:nth-child(5)') || {}).textContent);
  }

  /* ── 7. UM MÊS PAGO NÃO SE PAGA OUTRA VEZ ─────────────────────────────────────────────── */
  console.log('\n7. Um mês pago não se paga outra vez — nem por um segundo clique, nem por um POST à mão');
  {
    const env = envCom(null);
    const pedir = async (corpo) => {
      const r = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/mensalidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: AUTORIZACAO },
        body: JSON.stringify(corpo),
      }), env);
      return { status: r.status, corpo: await r.json() };
    };
    /* NOVEMBRO JÁ ESTÁ PAGO NO LIVRO, às 00:48 de 17/11. Um clique hoje não pode mover essa data. */
    const primeira = await pedir({ escola: 'breu', mes: '2026-11' });
    conferir('marcar pago um mês já pago responde `ok` e diz que já estava',
      primeira.corpo.ok === true && primeira.corpo.jaPago === true, primeira.corpo);
    const livro = JSON.parse(await env.PADD_KV.get('financeiro/mensalidades'));
    const linha = (livro.lista || []).find((l) => l.escola === 'breu' && l.mes === '2026-11');
    conferir('…e a data do pagamento NÃO se move — é ela que se confere no extrato do banco',
      linha && linha.em === '2026-11-17T00:48:32Z', linha && linha.em);
    conferir('…e o valor pago também não',
      linha && linha.valorCentavos === 23990, linha && linha.valorCentavos);

    /* E A COBRANÇA DE UM MÊS PAGO NÃO SE REESCREVE. A tela já desenha o campo em leitura; isto é o
     * MOTOR a recusar, para um POST escrito à mão não contornar a regra. */
    const cobranca = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/cobranca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: AUTORIZACAO },
      body: JSON.stringify({ escola: 'breu', mes: '2026-11', texto: 'x' }),
    }), env);
    const corpoCobranca = await cobranca.json();
    conferir('uma cobrança nova sobre um mês pago é RECUSADA pelo motor',
      cobranca.status === 409 && corpoCobranca.ok === false, { status: cobranca.status, corpo: corpoCobranca });
    conferir('…e a recusa diz que o mês está pago, em vez de um código',
      /já está pago/i.test(String(corpoCobranca.erro || '')), corpoCobranca.erro);
    conferir('…e nada foi escrito no KV',
      !(await env.PADD_KV.get('financeiro/cobrancas')), null);
  }

  console.log('');
  if (falhas) { console.log('FALHOU — ' + (n - falhas) + '/' + n); process.exit(1); }
  console.log('TUDO CERTO — ' + n + ' asserção(ões).');
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});

/** O livro como `lerLivro` o devolve: a lista dentro de um objecto. */
function mensalidadesDoLivro() {
  return Array.isArray(LIVRO.lista) ? LIVRO.lista : [];
}
