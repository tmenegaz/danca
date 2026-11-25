#!/usr/bin/env node
'use strict';

/*
 * provar-o-contador.js — quantas aulas esta escola processou neste mês (25/11/2026).
 *
 * O PEDIDO: «Vamos agora implementar o contador de aula.» E a razão de ele existir está no
 * PLANO-CONTADOR-DE-AULAS §2: a franquia é de AULAS, a renovação é mensal, e o que passar da
 * franquia paga-se. Sem o número, a franquia é um número no ecrã.
 *
 * O QUE ESTA PROVA AFIRMA — os seis pontos do §8 do plano, mais os que as decisões de hoje
 * acrescentaram:
 *
 *   1. UM LANÇAMENTO CONTA 1, e regravar a mesma aula continua a contar 1 (`fundirAulas`);
 *   2. REGERAR O PACOTE NÃO CONTA — a geração preserva `aulas`;
 *   3. A COMPETÊNCIA É A DA DATA DA AULA — uma aula de 30/11 lançada a 02/12 é de novembro;
 *   4. A AULA NÃO DADA NÃO CONTA — não há registo, e o contador não inventa;
 *   5. `null` ≠ `0` — sem contagem o ecrã cala; com contagem, diz (mesmo quando diz zero);
 *   6. A SOMA É INTEIRA OU NÃO É — sem contagem não se apresenta parte como o todo;
 *   7. O EXCEDENTE A R$ 8,00 — a decisão de hoje, e a razão dela (o pacote tem de ser mais barato);
 *   8. O EXCEDENTE ENTRA NA CONTA DO MÊS SEGUINTE, discriminado, e NÃO na fatura;
 *   9. A ESCRITA NO KV SÓ ACONTECE QUANDO O CONJUNTO MUDA — a reconciliação não gasta cota à toa;
 *  10. A RAIZ LÊ A CÓPIA — o financeiro de quem cobra vê o número sem ver o ASSETS da escola.
 *
 * O QUE A PROVA NÃO FAZ: ar fresco. Todas as leituras de ASSETS são um stub, e o KV é um mapa em
 * memória — a bancada mede a REGRA, e a regra é o que aqui se decide.
 *
 *   uso: node experimentos/provar-o-contador.js
 */

const path = require('path');
const RAIZ = path.join(__dirname, '..');
const contador = require(path.join(RAIZ, 'motor/nucleo/contador-de-aulas.js'));
const { criarContadorDaEscola, chaveDaContagem, pastaDaTurma } =
  require(path.join(RAIZ, 'motor/servidor/contador-da-escola.js'));
const mensalidades = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js'));
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));

let n = 0;
let falhas = 0;
function conferir(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/** Um ciclo como o `ciclos.json` publicado o traz: `aulas[]` com `n`, `data` e `lancada`. */
function ciclo(variante, aulas) {
  return { variante, aulas: aulas.map(([nn, data, lancada]) => ({ n: nn, data, lancada })) };
}

/** O KV de bolso, com contagem de escritas — é ela que mede o custo da reconciliação. */
function kvDeBolso(mapa) {
  const guardado = Object.assign(Object.create(null), mapa || {});
  const escritas = [];
  return {
    async get(k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
    async put(k, v) { guardado[k] = String(v); escritas.push(k); },
    async delete(k) { delete guardado[k]; },
    _guardado: guardado,
    _escritas: escritas,
  };
}

/** Um ASSETS de bolso: serve `<prefixo><variante>/ciclos.json`. */
function assetsDeBolso(porVariante, prefixo) {
  return {
    async fetch(url) {
      const u = String(url);
      const alvo = Object.keys(porVariante).find((v) => u.endsWith('/' + v + '/ciclos.json')
        || u.endsWith(prefixo + '/' + v + '/ciclos.json'));
      if (!alvo) return { ok: false };
      return { ok: true, text: async () => JSON.stringify({ ciclos: [porVariante[alvo]] }) };
    },
  };
}

const CONTRATO_BASICO = {
  plano: 'basico', planoNome: 'Básico', valorCentavos: 6990,
  criadoEm: '2026-10-01T12:00:00.000Z', estado: 'ativa',
};

(async () => {
  /* ── 1. O NÚCLEO — a regra, sem KV e sem HTML ─────────────────────────────────────────── */
  console.log('\n1. Um lançamento conta 1 — e regravar a mesma aula não conta outra');
  {
    const um = ciclo('piano', [['01', '2026-11-04', true]]);
    const c1 = contador.contagemDosCiclos([um], '2026-11-25T12:00:00Z');
    conferir('uma aula lançada num mês conta 1',
      contador.contarAulasDoMes({ contagem: c1.contagem, competencia: '2026-11' }) === 1,
      c1.contagem.meses);

    /* O MESMO FICHEIRO RELANÇADO — o `fundirAulas` do acervo funde por número, e o contador tem de
     * dar o mesmo número depois de a mesma aula ser gravada duas vezes. */
    let c = contador.contagemVazia();
    c = contador.fundirNaContagem(c, { variante: 'piano', numero: '01', data: '2026-11-04' });
    c = contador.fundirNaContagem(c, { variante: 'piano', numero: '01', data: '2026-11-04' });
    conferir('…e a mesma aula registada duas vezes continua a contar 1',
      contador.contarAulasDoMes({ contagem: c, competencia: '2026-11' }) === 1, c.meses);
    /* E a PROVA DISCRIMINANTE: uma implementação que somasse um contador a cada lançamento diria 2.
     * É o defeito que o plano recusa no §3.1, e é este o número que o apanha. */

    const duas = ciclo('piano', [['01', '2026-11-04', true], ['02', '2026-11-06', true]]);
    const c2 = contador.contagemDosCiclos([duas]);
    conferir('duas aulas lançadas contam 2',
      contador.contarAulasDoMes({ contagem: c2.contagem, competencia: '2026-11' }) === 2);
  }

  console.log('\n2. Regerar o pacote não conta — a geração preserva o facto');
  {
    /* Regerar o pacote reescreve o `ciclos.json` com os mesmos `lancada`, e a contagem tem de sair
     * igual. Mede-se pela ASSINATURA: se ela muda, a reconciliação gravaria de novo, e o número
     * poderia ter mudado. */
    const antes = contador.contagemDosCiclos([ciclo('piano', [['01', '2026-11-04', true]])]);
    const depois = contador.contagemDosCiclos([ciclo('piano', [['01', '2026-11-04', true]])]);
    conferir('a mesma geração dá a mesma assinatura — não há escrita nem número novo',
      antes.contagem.fonte === depois.contagem.fonte, { antes: antes.contagem.fonte, depois: depois.contagem.fonte });
    conferir('…e o número é o mesmo', Object.keys(antes.contagem.meses['2026-11']).length
      === Object.keys(depois.contagem.meses['2026-11']).length);
  }

  console.log('\n3. A competência é a da DATA da aula, e não a do lançamento');
  {
    /* A AULA DE 30/11 LANÇADA A 02/12. Se a competência fosse a do lançamento, ela cairia em
     * dezembro e saltaria de franquia — o defeito que o plano nomeia. */
    const c = contador.contagemDosCiclos([ciclo('piano', [['05', '2026-11-30', true]])]);
    conferir('a aula de 30/11 lançada a 02/12 é de NOVEMBRO',
      contador.contarAulasDoMes({ contagem: c.contagem, competencia: '2026-11' }) === 1
      && contador.contarAulasDoMes({ contagem: c.contagem, competencia: '2026-12' }) === 0,
      c.contagem.meses);
    /* E A CORRECÇÃO DA DATA MOVE A AULA DE MÊS, em vez de a duplicar. */
    const corrigida = contador.fundirNaContagem(c.contagem,
      { variante: 'piano', numero: '05', data: '2026-12-02' });
    conferir('corrigir a data da aula move-a de mês — e não a duplica',
      contador.contarAulasDoMes({ contagem: corrigida, competencia: '2026-11' }) === null
      || (contador.contarAulasDoMes({ contagem: corrigida, competencia: '2026-11' }) === 0
        && contador.contarAulasDoMes({ contagem: corrigida, competencia: '2026-12' }) === 1),
      corrigida.meses);
  }

  console.log('\n4. A aula não dada não conta — e uma aula sem data não se soma a mês nenhum');
  {
    const c = contador.contagemDosCiclos([ciclo('piano', [
      ['01', '2026-11-04', true], ['02', '2026-11-06', false], ['03', '2026-11-11', undefined]])]);
    conferir('das três aulas do calendário, só a lançada conta',
      contador.contarAulasDoMes({ contagem: c.contagem, competencia: '2026-11' }) === 1,
      c.contagem.meses);
    const semData = contador.contagemDosCiclos([ciclo('piano', [['04', null, true]])]);
    conferir('uma aula lançada SEM data fica de fora e é contada à parte',
      contador.contarAulasDoMes({ contagem: semData.contagem, competencia: '2026-11' }) === null
      && semData.semData === 1, { semData: semData.semData, meses: semData.contagem.meses });
  }

  console.log('\n5. `null` não é `0` — e a diferença chega ao ecrã');
  {
    conferir('sem contagem, o número é `null`',
      contador.contarAulasDoMes({ competencia: '2026-11' }) === null);
    const r = contador.resumo({ competencia: '2026-11', franquia: 130 });
    conferir('…e o resumo cala o estado e di-lo por palavras',
      r.estado === null && r.processadas === null && /ainda não é contado/i.test(r.frase), r);
    /* UMA CONTAGEM QUE EXISTE E NÃO TEM ESTE MÊS É UM ZERO VERDADEIRO: contou-se, e o mês está
     * vazio. É a asserção que separa «não li» de «li, e não há». */
    const vaziaDeOutroMes = contador.contagemDosCiclos([ciclo('piano', [['01', '2026-10-07', true]])]);
    conferir('com contagem de outro mês, este mês é ZERO e não `null`',
      contador.contarAulasDoMes({ contagem: vaziaDeOutroMes.contagem, competencia: '2026-11' }) === 0);
    const r0 = contador.resumo({ contagem: vaziaDeOutroMes.contagem, competencia: '2026-11', franquia: 130 });
    conferir('…e o resumo diz «0 de 130», com estado',
      r0.estado === 'folga' && /0 de 130/.test(r0.frase), r0.frase);
  }

  console.log('\n6. Uma escola, várias turmas — a franquia é da escola');
  {
    const ciclos = [
      ciclo('piano', [['01', '2026-11-04', true], ['02', '2026-11-06', true]]),
      ciclo('rosa', [['01', '2026-11-05', true]]),
    ];
    const c = contador.contagemDosCiclos(ciclos);
    conferir('duas turmas somam na MESMA franquia (2 + 1 = 3)',
      contador.contarAulasDoMes({ contagem: c.contagem, competencia: '2026-11' }) === 3, c.contagem.meses);
    conferir('…e a chave distingue a turma — `piano/01` e `rosa/01` são duas aulas',
      Boolean(c.contagem.meses['2026-11']['piano/01'])
      && Boolean(c.contagem.meses['2026-11']['rosa/01']), c.contagem.meses);
  }

  /* ── 7. O EXCEDENTE ─────────────────────────────────────────────────────────────────── */
  console.log('\n7. O excedente: R$ 8,00 por aula, e o pacote tem de ser mais barato');
  {
    conferir('o preço da aula excedente é R$ 8,00 — decisão de 25/11/2026',
      contador.PRECO_DA_AULA_EXCEDENTE_CENTAVOS === 800);
    /* A CONTA QUE JUSTIFICA O NÚMERO, e ela é do catálogo: o pacote mais barato tem de dar um custo
     * por aula MENOR do que a aula excedente. Sem isto, o excedente deixaria de ser um comando que
     * empurra a escola para o pacote, e passaria a ser uma multa. */
    const pacotes = comercial.pacotesDeAulas();
    const piorPorAula = Math.max(...pacotes.map((p) => p.preco / p.aulas));
    conferir('o pacote mais caro por aula ainda é mais barato do que o excedente',
      piorPorAula * 100 < contador.PRECO_DA_AULA_EXCEDENTE_CENTAVOS,
      { porAulaCentavos: Math.round(piorPorAula * 100), excedente: contador.PRECO_DA_AULA_EXCEDENTE_CENTAVOS });

    const doze = ciclo('piano', Array.from({ length: 12 }, (_, i) =>
      [String(i + 1).padStart(2, '0'), '2026-11-' + String(i + 1).padStart(2, '0'), true]));
    const c = contador.contagemDosCiclos([doze]).contagem;
    const dentro = contador.resumo({ contagem: c, competencia: '2026-11', franquia: 130 });
    conferir('dentro da franquia não há excedente', dentro.excedenteAulas === 0
      && dentro.excedenteCentavos === 0 && dentro.estado === 'folga', dentro);
    const passou = contador.resumo({ contagem: c, competencia: '2026-11', franquia: 10 });
    conferir('acima da franquia há excedente, em aulas E em reais',
      passou.excedenteAulas === 2 && passou.excedenteCentavos === 1600 && passou.estado === 'passou', passou);
    conferir('…e a frase diz as aulas, o preço e o total — não só o total',
      /2 além da franquia/.test(passou.frase) && /R\$ 8,00/.test(passou.frase)
      && /R\$ 16,00/.test(passou.frase), passou.frase);
    /* AS PREVISTAS NÃO COBRAM. É a regra dura dela: «planear não custa nada, processar custa». */
    const previstasAltas = contador.resumo({ contagem: c, competencia: '2026-11', franquia: 130,
      ciclos: [ciclo('piano', Array.from({ length: 40 }, (_, i) =>
        [String(i + 1).padStart(2, '0'), '2026-11-' + String((i % 28) + 1).padStart(2, '0'), i < 12]))] });
    conferir('40 aulas PREVISTAS não criam excedente nenhum',
      previstasAltas.excedenteAulas === 0 && previstasAltas.previstas === 40, previstasAltas);
  }

  console.log('\n8. O excedente entra na conta do mês seguinte, discriminado — e não na fatura');
  {
    const aulas = {};
    for (let i = 1; i <= 12; i += 1) aulas['piano/' + String(i).padStart(2, '0')] = '2026-11-05';
    const contagem = { fonte: 'x', meses: { '2026-11': aulas } };
    const contrato = Object.assign({}, CONTRATO_BASICO, { pacotesDeAulas: [] });
    const s = mensalidades.situacaoDaEscola({
      escola: 'breu', contrato, livro: [], agora: new Date('2026-12-10T12:00:00Z'), contagem,
    });
    const dez = s.meses.find((m) => m.mes === '2026-12');
    /* A FRANQUIA DO BÁSICO É 130, e 12 aulas não passam. O excedente só existe com a franquia
     * pequena — que é o plano de consultoria (três aulas), o próximo bloco. Aqui mede-se a REGRA com
     * a franquia forçada, e é por isso que se usa `resumo` e não o extrato. */
    conferir('com a franquia do plano, 12 aulas não geram excedente',
      dez.excedente === null && dez.aPagarCentavos === dez.encargos.totalCentavos, dez);
    /* E COM A FRANQUIA PEQUENA, o excedente aparece na linha do mês SEGUINTE, com o mês de origem. */
    const excedente = contador.excedenteDoMes({ contagem, competencia: '2026-11', franquia: 10 });
    conferir('o excedente é do mês FECHADO (novembro), com as aulas e o preço',
      excedente && excedente.competencia === '2026-11' && excedente.aulas === 2
      && excedente.centavos === 1600, excedente);
    conferir('…e a fatura do mês seguinte NÃO muda — o excedente é um número próprio',
      dez.valorCentavos === 6990, dez.valorCentavos);
    /* A FATURA É O QUE FOI COBRADO, e é ela que a mudança de plano compara: misturar o excedente
     * nela faria um mês com muitas aulas parecer um plano novo. */
    conferir('…e sem contagem não há linha de excedente nenhuma (nem de R$ 0,00)',
      contador.excedenteDoMes({ competencia: '2026-11', franquia: 10 }) === null);
  }

  /* ── 9. A RECONCILIAÇÃO NO SERVIDOR ─────────────────────────────────────────────────── */
  console.log('\n9. A reconciliação: grava quando muda, cala-se quando não mudou');
  {
    const kv = kvDeBolso();
    const env = { ASSETS: assetsDeBolso({
      piano: ciclo('piano', [['01', '2026-11-04', true], ['02', '2026-11-06', true]]),
    }, '') };
    const contadorDaEscola = criarContadorDaEscola({ env, kv, escola: 'breu' });
    const curadorias = [{ id: 'breu-piano', modalidade: 'Balé clássico' }];

    const primeira = await contadorDaEscola.reconciliar({ curadorias, quando: '2026-11-25T12:00:00Z' });
    conferir('a primeira reconciliação grava e conta as duas aulas',
      primeira.escreveu === true
      && contador.contarAulasDoMes({ contagem: primeira.contagem, competencia: '2026-11' }) === 2,
      primeira.contagem.meses);
    conferir('…na chave da escola, ao lado das outras',
      contadorDaEscola.chave === 'bastidores/breu/aulas-processadas', contadorDaEscola.chave);

    const segunda = await contadorDaEscola.reconciliar({ curadorias });
    conferir('a segunda não gasta uma escrita — o conjunto não mudou', segunda.escreveu === false);
    conferir('…e o KV tem UMA versão, não duas',
      kv._escritas.length === 1 && Boolean(kv._guardado[chaveDaContagem('breu')]), kv._escritas.length);

    /* A TURMA NOVA — outra variante, com a sua aula — soma-se à contagem que já existe. */
    const env2 = { ASSETS: assetsDeBolso({
      piano: ciclo('piano', [['01', '2026-11-04', true], ['02', '2026-11-06', true]]),
      rosa: ciclo('rosa', [['01', '2026-11-05', true]]),
    }, '') };
    const outro = criarContadorDaEscola({ env: env2, kv, escola: 'breu' });
    const terceira = await outro.reconciliar({
      curadorias: [{ id: 'breu-piano' }, { id: 'breu-rosa' }],
    });
    conferir('uma turma nova acrescenta a aula dela à contagem existente',
      terceira.escreveu === true
      && contador.contarAulasDoMes({ contagem: terceira.contagem, competencia: '2026-11' }) === 3,
      terceira.contagem.meses);

    /* A RECONCILIAÇÃO É MONÓTONA: o que estava no KV não sai. Uma turma que desaparece do pacote
     * — substituída, ou com o pacote ainda por gerar — não apaga a aula que já foi lançada. */
    const env3 = { ASSETS: assetsDeBolso({}, '') };
    const vazia = criarContadorDaEscola({ env: env3, kv, escola: 'breu' });
    const quarta = await vazia.reconciliar({ curadorias: [{ id: 'breu-piano' }] });
    conferir('uma leitura sem pacote NÃO apaga as aulas já contadas',
      contador.contarAulasDoMes({ contagem: quarta.contagem, competencia: '2026-11' }) === 3,
      quarta.contagem.meses);
    conferir('…e ela DIZ que não leu o pacote, em vez de dizer que a turma não tem aulas',
      quarta.semPacote.length === 1, quarta.semPacote);

    /* O KV COM LIXO não rebenta e não vira zero: lê-se como «não contado». */
    const comLixo = criarContadorDaEscola({ env: env2, kv: kvDeBolso({ 'bastidores/breu/aulas-processadas': '{{{isto não é JSON' }), escola: 'breu' });
    const lida = await comLixo.ler();
    conferir('CONTROLO: um KV com lixo devolve a contagem vazia, e não uma excepção',
      lida !== null && Object.keys(lida.meses).length === 0, lida);
    conferir('…e a contagem vazia LÊ-SE como «não contado», e não como zero',
      contador.contarAulasDoMes({ contagem: lida, competencia: '2026-11' }) === null);

    /* A PASTA DA TURMA — o cálculo que o pacote publica. */
    conferir('a pasta da turma é o id sem o prefixo da escola e sem o carimbo',
      pastaDaTurma('breu-piano', 'breu') === 'piano'
      && pastaDaTurma('breu-piano-2026-11-25-3', 'breu') === 'piano', pastaDaTurma('breu-piano', 'breu'));
  }

  /* ── 10. A RAIZ LÊ A CÓPIA ──────────────────────────────────────────────────────────── */
  console.log('\n10. O financeiro da raiz vê o número sem ver o ASSETS da escola');
  {
    const aulas = {};
    for (let i = 1; i <= 12; i += 1) aulas['piano/' + String(i).padStart(2, '0')] = '2026-11-05';
    const env = {
      HOST_DONO: 'danca.padd.com.br',
      PADD_KV: kvDeBolso({
        'bastidores/breu/comercial': JSON.stringify(CONTRATO_BASICO),
        'bastidores/breu/aulas-processadas': JSON.stringify({
          atualizadoEm: '2026-11-25T12:00:00Z', fonte: 'x', meses: { '2026-11': aulas },
        }),
      }),
      AGORA: '2026-11-20T12:00:00.000Z',
    };
    /* O «AGORA» É NOVEMBRO, e a escolha é a asserção: o contador do mês fala do MÊS CIVIL REAL, e
     * não do mês que a linha do extrato está a cobrar. Uma escola que lançou 12 aulas em novembro e
     * ainda não lançou nenhuma em dezembro vê «12 de 130» em novembro e «0 de 130» em dezembro —
     * são as duas verdade, e é por isso que o número é do mês e não do extrato. */
    const extrato = await raiz.extratoDasEscolas({
      env, escolas: [{ slug: 'breu', nome: 'Breu' }], agora: '2026-11-20T12:00:00.000Z',
    });
    const conta = extrato[0] || {};
    conferir('a raiz conta as 12 aulas do mês a partir da cópia, sem ler o ASSETS',
      conta.franquia && conta.franquia.usadas === 12, conta.franquia && conta.franquia.usadas);
    conferir('…e traz o contador do mês com a franquia',
      conta.contadorDoMes && conta.contadorDoMes.processadas === 12
      && conta.contadorDoMes.franquia === 130, conta.contadorDoMes);

    /* SEM A CÓPIA, o consumo é `null` — e o ecrã cala. É a asserção que impede o pior defeito
     * possível num ecrã de dinheiro: dizer «0 aulas» de uma escola que trabalhou. */
    const semCopia = await raiz.extratoDasEscolas({
      env: Object.assign({}, env, {
        PADD_KV: kvDeBolso({ 'bastidores/breu/comercial': JSON.stringify(CONTRATO_BASICO) }),
      }),
      escolas: [{ slug: 'breu', nome: 'Breu' }], agora: '2026-11-20T12:00:00.000Z',
    });
    conferir('sem a cópia, o consumo é `null` e não zero',
      semCopia[0].franquia && semCopia[0].franquia.usadas === null,
      semCopia[0].franquia && semCopia[0].franquia.usadas);
    conferir('…e o contador di-lo por palavras, em vez de mostrar «0 de 130»',
      /ainda não é contado/i.test(String(semCopia[0].contadorDoMes && semCopia[0].contadorDoMes.frase)));
  }

  /* ── 11. O ECRÃ ─────────────────────────────────────────────────────────────────────── */
  console.log('\n11. O ecrã mostra o excedente discriminado — aulas × preço = total');
  {
    const aulas = {};
    for (let i = 1; i <= 132; i += 1) aulas['piano/' + String(i).padStart(2, '0')] = '2026-11-05';
    const html = painel.paginaFinanceira({
      pix: {}, descontos: [], escolas: [],
      extrato: [{
        escola: 'breu', nome: 'Breu', planoNome: 'Básico', valorCentavos: 6990,
        situacao: 'em-aberto', mesDeHoje: '2026-12', emAberto: ['2026-12'], vencidos: ['2026-12'],
        meses: [{
          mes: '2026-12', nome: 'dezembro de 2026', vencimento: '2026-12-01', status: 'aberto',
          venceu: true, valorCentavos: 6990, recebidoCentavos: 0, faltaCentavos: 6990,
          encargos: { diasDeAtraso: 9, multaCentavos: 140, jurosCentavos: 21, encargosCentavos: 161,
            totalCentavos: 7151 },
          excedente: { competencia: '2026-11', aulas: 2, precoDaAulaCentavos: 800, centavos: 1600,
            processadas: 132, franquia: 130 },
          aPagarCentavos: 8751,
        }],
        estadoComercial: 'ativa', frase: 'Em aberto.', capacidade: { professores: 4, alunos: 40 },
        piso: { professores: 4, alunos: 40 }, teto: { professores: 5, alunos: 89 },
        proximoVencimento: '2026-12-01', diasParaVencer: -9,
        franquia: { franquia: 130, usadas: 132, excedente: 2, estado: 'passou' },
        contadorDoMes: {
          competencia: '2026-12', processadas: 132, previstas: null, franquia: 130,
          restantes: 0, excedenteAulas: 2, precoDaAulaCentavos: 800, excedenteCentavos: 1600,
          estado: 'passou', frase: '132 de 130 aula(s): 2 além da franquia.',
        },
        lotesProfessores: [], lotesAlunos: [], cobrancas: {},
      }],
      catalogo: null,
    });
    conferir('o cartão do financeiro diz o excedente em aulas × preço = total',
      /2 × R\$ 8,00 = R\$ 16,00/.test(html), (html.match(/Excedente de aulas[^<]*/) || [])[0]);
    conferir('…e diz onde é cobrado, para o número não ficar sem data',
      /cobrado no mês seguinte/.test(html));
    /* E A ESCOLA TAMBÉM O VÊ, no mês a mês dela — «a escola precisa ter noção disso». */
    const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
    const doMesAMes = bastidores.paginaFinanceiro('breu', {}, {}, {
      situacao: {
        situacao: 'em-aberto', mesDeHoje: '2026-12', proximoVencimento: '2026-12-01',
        diasParaVencer: -9, valorCentavos: 6990, franquia: { franquia: 130, usadas: 132 },
        contadorDoMes: { estado: 'passou', excedenteAulas: 2, precoDaAulaCentavos: 800,
          excedenteCentavos: 1600, processadas: 132, franquia: 130,
          frase: '132 de 130 aula(s): 2 além da franquia.' },
        meses: [{
          mes: '2026-12', nome: 'dezembro de 2026', vencimento: '2026-12-01', status: 'aberto',
          venceu: true, valorCentavos: 6990, recebidoCentavos: 0, faltaCentavos: 6990,
          aPagarCentavos: 8751,
          encargos: { diasDeAtraso: 9, multaCentavos: 140, jurosCentavos: 21, encargosCentavos: 161,
            totalCentavos: 7151 },
          excedente: { competencia: '2026-11', aulas: 2, precoDaAulaCentavos: 800, centavos: 1600 },
        }],
      },
      cadastro: { escolaNome: 'Breu' }, pix: { chave: '0215' }, cobrancas: {},
    });
    conferir('…e a escola lê o mesmo no mês a mês dela, com as aulas e o mês de origem',
      /\+ 2 aula\(s\) excedente\(s\) de 2026-11 = R\$ 16,00/.test(doMesAMes),
      (doMesAMes.match(/excedente\(s\) de[^<]*/) || [])[0]);
    /* O CARTÃO DA ESCOLA é outro sítio — vive na Produção, e é lá que ela lê o contrato. A frase do
     * contador tem de lá estar: é o único lugar onde a escola vê que há um contador a correr. */
    const cartao = bastidores.cartaoDaEscola({
      escola: 'breu', cadastro: { escolaNome: 'Breu' },
      situacao: {
        plano: 'basico', planoNome: 'Básico', valorCentavos: 6990, proximoVencimento: '2026-12-01',
        diasParaVencer: -9, franquia: { franquia: 130, usadas: 132, excedente: 2, estado: 'passou' },
        contadorDoMes: { estado: 'passou', excedenteAulas: 2, precoDaAulaCentavos: 800,
          excedenteCentavos: 1600, processadas: 132, franquia: 130,
          frase: '132 de 130 aula(s): 2 além da franquia, a R$ 8,00 cada, dão R$ 16,00.' },
      },
    });
    conferir('…e o cartão da escola diz que há um contador a correr',
      /132 de 130 aula\(s\)/.test(cartao), (cartao.match(/Consumo do mês[\s\S]{0,140}/) || [])[0]);
    conferir('…com o excedente discriminado em aulas × preço',
      /2 aula\(s\) × R\$ 8,00 = R\$ 16,00/.test(cartao),
      (cartao.match(/Excedente de aulas[\s\S]{0,120}/) || [])[0]);
    conferir('…e a linha do mês mostra de que mês vem o excedente',
      /2 aula\(s\) excedente\(s\) de 2026-11 a R\$ 8,00 = R\$ 16,00/.test(html),
      (html.match(/aula\(s\) excedente[^<]*/) || [])[0]);
    /* E O NÚMERO QUE O BOTÃO PROPÕE É O `aPagar`, com o excedente dentro — senão a conta não
     * fecharia com o que a linha mostra ao lado. */
    conferir('o botão de pagar propõe o total com o excedente (R$ 87,51)',
      /value="87,51"/.test(html), (html.match(/data-pagar-valor[^>]*value="[^"]*"/) || [])[0]);
  }

  console.log('');
  if (falhas) { console.log('FALHOU — ' + (n - falhas) + '/' + n); process.exit(1); }
  console.log('TUDO CERTO — ' + n + ' asserção(ões): a aula conta quando está lançada, uma vez por '
    + 'número, no mês da DATA dela; a contagem é guardada como conjunto de factos (nunca um total), '
    + 'a reconciliação só grava quando muda, e o excedente de R$ 8,00 por aula aparece discriminado '
    + 'na conta do mês seguinte — onde a escola e quem cobra o podem ler.');
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
