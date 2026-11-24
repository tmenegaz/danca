#!/usr/bin/env node
'use strict';

/*
 * provar-a-mora.js — a multa e os juros da casa são os das contas de consumo, e não inventados
 * (25/11/2026).
 *
 * «A gente vai adotar a mesma política de multa e juros que tem em um serviço como, por exemplo,
 * conta de água, conta de luz, que eu acho que são os mais básicos, os mais baixos também que tem no
 * mercado.»
 *
 * A POLÍTICA QUE SE ADOTOU, e a norma que a sustenta:
 *   · multa de mora de **2% sobre o valor da fatura** — teto do **CDC art. 52, §1º** e da **REN
 *     ANEEL 1.000/2021, art. 343, §1º**;
 *   · juros de mora de **1% ao mês, pro rata die** — art. 343, *caput*, da mesma REN (é a norma, e
 *     não o Código Civil, que fixa o 1%: o CC/2002 remeteu à Selic no art. 406);
 *   · **sem carência**; a única tolerância é a do §3º (vencimento em dia não útil);
 *   · base de cálculo = o valor da fatura, e **sem anatocismo** (§2º, III).
 *
 * O QUE A PROVA MEDE, com o controlo em cada frente:
 *   (i) a conta do exemplo da pesquisa — R$ 100 em 30 dias = R$ 3,00 de encargos —, e o controlo de
 *       que 60 dias custam o DOBRO dos juros e a MESMA multa (a multa é uma só; os juros correm);
 *   (ii) o teto do CDC morde: pedir 10% aplica 2%, e não 10%;
 *   (iii) o dia do vencimento não é atraso — e o dia seguinte é;
 *   (iv) a correção monetária NÃO é aplicada, e a conta DIZ isso — não é uma omissão silenciosa;
 *   (v) a mora entra no extrato por mês e no total, e um mês PAGO não tem encargos (cobrar duas
 *       vezes a mesma mora é o defeito mais fácil de escrever aqui).
 *
 *   uso: node experimentos/provar-a-mora.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const mensalidades = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js'));
const monitoramento = require(path.join(RAIZ, 'motor/nucleo/monitoramento.js'));

let n = 0;
let falhas = 0;
function conferir(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
const cent = (c) => Number((c / 100).toFixed(2));

console.log('\nA. A política é a das contas de consumo, e está declarada com a norma');
{
  conferir('a multa é 2% — o teto do CDC e da REN', mensalidades.MULTA_DE_MORA === 0.02, mensalidades.MULTA_DE_MORA);
  conferir('os juros são 1% ao mês', mensalidades.JUROS_AO_MES === 0.01, mensalidades.JUROS_AO_MES);
  const r = mensalidades.encargos({ valorCentavos: 10000, vencimento: '2026-11-16', hoje: '2026-12-16' });
  conferir('a conta cita a norma — sem ela, ninguém defende o número quando a escola pergunta',
    /REN ANEEL 1\.000\/2021, art\. 343/.test(r.norma || '') && /CDC art\. 52/.test(r.norma || ''), r.norma);
}

console.log('\nB. O exemplo da pesquisa: R$ 100 em 30 dias = R$ 3,00');
{
  const r = mensalidades.encargos({ valorCentavos: 10000, vencimento: '2026-11-16', hoje: '2026-12-16' });
  conferir('a multa é R$ 2,00 (2% de 100)', cent(r.multaCentavos) === 2.00, cent(r.multaCentavos));
  conferir('os juros são R$ 1,00 (1% ao mês, pro rata die, 30 dias)', cent(r.jurosCentavos) === 1.00, cent(r.jurosCentavos));
  conferir('o total em mora é R$ 103,00', cent(r.totalCentavos) === 103.00, cent(r.totalCentavos));
  /* O CONTROLO, e é o que prova que a multa é UMA e os juros CORREM: a 60 dias a multa é igual e os
   * juros dobram. Sem isto, uma função que somasse tudo proporcional passaria a asserção de cima. */
  const doisMeses = mensalidades.encargos({ valorCentavos: 10000, vencimento: '2026-11-16', hoje: '2027-01-15' });
  conferir('CONTROLO: a 60 dias a multa é a MESMA (2%) e os juros são o DOBRO',
    doisMeses.multaCentavos === r.multaCentavos
    && cent(doisMeses.jurosCentavos) === 2.00, [cent(doisMeses.multaCentavos), cent(doisMeses.jurosCentavos)]);
}

console.log('\nC. O teto do CDC morde — pedir 10% aplica 2%');
{
  const r = mensalidades.encargos({
    valorCentavos: 10000, vencimento: '2026-11-16', hoje: '2026-12-16', multa: 0.10,
  });
  conferir('uma multa de 10% pedida pelo chamador é limitada a 2%', r.multa === 0.02, r.multa);
  conferir('…e o valor cobrado é o do teto, não o pedido', cent(r.multaCentavos) === 2.00, cent(r.multaCentavos));
  /* O CONTROLO: uma multa ABAIXO do teto é respeitada — a função corrige para baixo e não para
   * cima, senão não seria um teto, seria um preço fixo. */
  const menor = mensalidades.encargos({
    valorCentavos: 10000, vencimento: '2026-11-16', hoje: '2026-12-16', multa: 0.01,
  });
  conferir('CONTROLO: uma multa de 1% é respeitada (o teto não é um preço fixo)',
    menor.multa === 0.01 && cent(menor.multaCentavos) === 1.00, [menor.multa, cent(menor.multaCentavos)]);
}

console.log('\nD. O dia do vencimento não é atraso');
{
  const noDia = mensalidades.encargos({ valorCentavos: 10000, vencimento: '2026-11-16', hoje: '2026-11-16' });
  conferir('pagar no dia do vencimento não gera encargo nenhum',
    noDia.emAtraso === false && noDia.encargosCentavos === 0, noDia.encargosCentavos);
  const umDia = mensalidades.encargos({ valorCentavos: 10000, vencimento: '2026-11-16', hoje: '2026-11-17' });
  conferir('…e o dia seguinte já é um dia de mora (multa + 1 dia de juros)',
    umDia.emAtraso === true && umDia.diasDeAtraso === 1 && umDia.multaCentavos === 200,
    [umDia.diasDeAtraso, cent(umDia.multaCentavos), cent(umDia.jurosCentavos)]);
  /* ANTES do vencimento não há mora, e o número não pode ser negativo. */
  const antes = mensalidades.encargos({ valorCentavos: 10000, vencimento: '2026-12-16', hoje: '2026-11-16' });
  conferir('pagar antes do vencimento não gera encargo nem dias negativos',
    antes.emAtraso === false && antes.diasDeAtraso === 0, antes.diasDeAtraso);
}

console.log('\nE. A correção monetária não é aplicada — e a conta diz isso');
{
  const r = mensalidades.encargos({ valorCentavos: 10000, vencimento: '2026-11-16', hoje: '2026-12-16' });
  conferir('`correcaoAplicada` é false — buscar um índice oficial seria uma dependência que falha '
    + 'em silêncio e muda a dívida sem ninguém saber', r.correcaoAplicada === false, r.correcaoAplicada);
  /* O CONTROLADOR: a conta sem correção é EXACTAMENTE multa + juros + valor. Se houvesse um índice
   * aplicado por baixo, este número não fecharia. */
  conferir('CONTROLO: o total fecha ao cêntimo sem nenhum índice (valor + multa + juros)',
    r.totalCentavos === 10000 + r.multaCentavos + r.jurosCentavos, r.totalCentavos);
}

console.log('\nF. A mora entra no extrato por mês, e um mês pago não tem encargos');
{
  const s = mensalidades.situacaoDaEscola({
    escola: 'x',
    contrato: { plano: 'basico', valorCentavos: 6990, planoNome: 'Básico', criadoEm: '2026-11-16T12:00:00Z' },
    livro: [], agora: '2027-02-20T12:00:00Z',
  });
  conferir('quatro meses vencidos, todos com encargos calculados',
    s.meses.length === 4 && s.meses.every((m) => m.encargos && m.encargos.emAtraso),
    s.meses.map((m) => m.mes));
  conferir('…e o mês mais antigo tem mais mora do que o mais recente',
    s.meses[3].encargos.encargosCentavos > s.meses[0].encargos.encargosCentavos,
    [cent(s.meses[3].encargos.encargosCentavos), cent(s.meses[0].encargos.encargosCentavos)]);
  conferir('o total em mora = mensalidades + encargos, e a soma fecha',
    s.totalEmMoraCentavos === 4 * 6990 + s.encargosEmMoraCentavos,
    [cent(s.totalEmMoraCentavos), 4 * 69.90, cent(s.encargosEmMoraCentavos)]);
  conferir('a política viaja com o extrato — a página não precisa de a repetir',
    s.politicaDeMora && s.politicaDeMora.multa === 0.02 && s.politicaDeMora.jurosAoMes === 0.01,
    s.politicaDeMora && s.politicaDeMora.multa);
  /* O MÊS PAGO. Este é o defeito mais fácil de escrever: calcular a mora de tudo e esquecer o
   * `status`. Um mês pago em atraso teve a mora resolvida no acto do pagamento. */
  const comPago = mensalidades.situacaoDaEscola({
    escola: 'x',
    contrato: { plano: 'basico', valorCentavos: 6990, planoNome: 'Básico', criadoEm: '2026-11-16T12:00:00Z' },
    livro: [{ escola: 'x', mes: '2026-11', status: 'pago', valorCentavos: 6990, em: '2026-12-20T12:00:00Z' }],
    agora: '2027-02-20T12:00:00Z',
  });
  const novembro = comPago.meses.filter((m) => m.mes === '2026-11')[0];
  conferir('CONTROLO: um mês PAGO não tem encargos, mesmo tendo sido pago em atraso',
    novembro && novembro.encargos === null, novembro && novembro.encargos);
  conferir('…e o total em mora deixa de contar esse mês',
    comPago.totalEmMoraCentavos < s.totalEmMoraCentavos,
    [cent(comPago.totalEmMoraCentavos), cent(s.totalEmMoraCentavos)]);
}

console.log('\nG. O monitor conta a mora na dívida, e separa-a');
{
  const extrato = [{
    escola: 'x', nome: 'X', contratoVivo: true,
    meses: [
      { mes: '2026-11', venceu: true, status: 'aberto', valorCentavos: 6990,
        encargos: { encargosCentavos: 364, totalCentavos: 7354 } },
      { mes: '2026-12', venceu: true, status: 'aberto', valorCentavos: 6990,
        encargos: { encargosCentavos: 294, totalCentavos: 7284 } },
    ],
  }];
  const i = monitoramento.inadimplencia({ extrato, agora: '2027-02-20T12:00:00Z' });
  conferir('a dívida inclui a mora: 73,54 + 72,84 = 146,38',
    cent(i.dividaTotalCentavos) === 146.38, cent(i.dividaTotalCentavos));
  conferir('…e a mora vai separada, para a conversa dizer quanto é o quê',
    cent(i.moraTotalCentavos) === 6.58, cent(i.moraTotalCentavos));
  /* O CONTROLADOR: um extrato SEM o campo `encargos` — um livro gravado antes desta regra — continua
   * a somar, e soma o valor da mensalidade. Uma dívida que desaparece porque o campo é novo seria
   * pior do que uma dívida sem mora. */
  const antigo = monitoramento.inadimplencia({
    extrato: [{ escola: 'x', nome: 'X', contratoVivo: true,
      meses: [{ mes: '2026-11', venceu: true, status: 'aberto', valorCentavos: 6990 }] }],
    agora: '2027-02-20T12:00:00Z',
  });
  conferir('CONTROLO: um extrato antigo, sem `encargos`, continua a somar a mensalidade',
    cent(antigo.dividaTotalCentavos) === 69.90 && antigo.moraTotalCentavos === 0,
    [cent(antigo.dividaTotalCentavos), antigo.moraTotalCentavos]);
}

console.log('\n' + (falhas === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + (n - falhas) + '/' + n
  + ' asserção(ões).');
if (falhas) process.exit(1);
