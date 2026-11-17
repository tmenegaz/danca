#!/usr/bin/env node
'use strict';

/*
 * provar-relogio-do-ensaio.js — um período de mensalidade que dura minutos (17/11/2026).
 *
 * O QUE ELA PEDIU: «Aí para poder testar isso, vamos colocar que um plano, ao invés de ser mensal,
 * ele dura apenas 3 minutos, que daí eu vou poder criar uma listagem e ver como é que está
 * acontecendo. Então passado o tempo assim de 3 minutos, já tem que pagar de novo e fazer todo o
 * processo e assim a gente tem uma listagem. Para aí a gente consegue testar essa situação das
 * mudanças do plano.»
 *
 * O QUE ESTA PROVA TEM DE AFIRMAR, e não é «o ensaio corre»:
 *
 *   1. que o relógio comprimido produz UM MÊS DE CALENDÁRIO por bloco de minutos — a mesma forma
 *      de competência (`AAAA-MM`), os mesmos rótulos, o mesmo livro. Se o ensaio inventasse um
 *      segundo modelo, o que ela visse não seria o que vai ver depois;
 *   2. que cada período novo nasce VENCIDO — «já tem que pagar de novo» —, e não «a vencer»;
 *   3. que DESLIGADO é desligado: sem o objecto, a hora é a real e a cobrança é mensal;
 *   4. que o ensaio NÃO passa de uma escola para outra, nem para o livro.
 *
 * A 3 é a que importa mais. Um modo de ensaio que se pode ligar por acidente numa escola a sério
 * cobra-lhe meses que não existem — e o dinheiro não é de ensaio.
 *
 *   uso: node experimentos/provar-relogio-do-ensaio.js
 */

const path = require('path');
const RAIZ = path.join(__dirname, '..');
const mensalidades = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let n = 0;
let falhas = 0;
function conferir(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/** O contrato dela: adesão a 17/11/2026, Básico com os adicionais, R$ 169,90. */
const CONTRATO = {
  plano: 'basico', planoNome: 'Básico', valorCentavos: 16990,
  capacidade: { professores: 4, alunos: 40 },
  criadoEm: '2026-11-17T13:00:00Z', estado: 'ativa',
};
const BASE = Date.parse('2026-11-17T13:00:00Z');
const emMinutos = (m) => new Date(BASE + m * 60000).toISOString();

const situacaoEm = (minutos, ensaio, livro) => mensalidades.situacaoDaEscola({
  escola: 'breu', contrato: CONTRATO, livro: livro || [], agora: emMinutos(minutos), ensaio,
});

console.log('\n1. Cada bloco de minutos vale um mês de calendário');
{
  const tres = { minutosPorPeriodo: 3 };
  const zero = situacaoEm(0, tres);
  conferir('ao minuto zero há uma competência só, a do mês da adesão',
    zero.meses.length === 1 && zero.meses[0].mes === '2026-11', zero.meses.map((m) => m.mes));
  const tresMin = situacaoEm(3, tres);
  conferir('aos 3 minutos aparecem duas: novembro e dezembro',
    tresMin.meses.map((m) => m.mes).join(',') === '2026-12,2026-11',
    tresMin.meses.map((m) => m.mes));
  const nove = situacaoEm(9, tres);
  conferir('aos 9 minutos são quatro, e a mais recente é fevereiro de 2027',
    nove.meses.length === 4 && nove.meses[0].mes === '2027-02', nove.meses.map((m) => m.mes));
  conferir('…e o rótulo é o de sempre — «fevereiro de 2027», e não um número de bloco',
    nove.meses[0].nome === 'fevereiro de 2027', nove.meses[0].nome);
  /* A FORMA É A MESMA DO MÊS A SÉRIO: é o que faz o ensaio valer como ensaio. */
  conferir('…e a competência continua no formato `AAAA-MM`, a mesma do livro',
    /^\d{4}-\d{2}$/.test(nove.meses[0].mes), nove.meses[0].mes);
  conferir('…e o vencimento continua a cair no dia da adesão',
    nove.meses.every((m) => m.vencimento.slice(8, 10) === '17'),
    nove.meses.map((m) => m.vencimento));
}

console.log('\n2. Cada período novo nasce VENCIDO — «já tem que pagar de novo»');
{
  const tres = { minutosPorPeriodo: 3 };
  conferir('aos 3 minutos, o mês novo já está em aberto e vencido',
    situacaoEm(3, tres).meses[0].venceu === true, situacaoEm(3, tres).meses[0]);
  conferir('…e a situação da escola é «em-aberto», não «em-dia»',
    situacaoEm(3, tres).situacao === 'em-aberto', situacaoEm(3, tres).situacao);
  /* O CONTRASTE com o relógio real, no mesmo instante: aí novembro ainda está «a vencer», porque
   * o dia 17 só acaba à meia-noite. É esta diferença que faz o ensaio servir para pagar. */
  const real = situacaoEm(3, null);
  conferir('…e no relógio REAL, no mesmo instante, novembro ainda não venceu',
    real.meses.length === 1 && real.meses[0].venceu === false, real.meses[0]);
  /* PAGO, SAI DA CONTA: o ensaio não insiste num mês já pago. */
  const pago = situacaoEm(3, tres, [{ escola: 'breu', mes: '2026-11', status: 'pago',
    valorCentavos: 16990, planoNome: 'Básico', em: emMinutos(3) }]);
  conferir('…e o mês que já foi pago deixa de estar em aberto',
    pago.meses.find((m) => m.mes === '2026-11').status === 'pago'
      && pago.vencidos.join(',') === '2026-12', pago.vencidos);
}

console.log('\n3. Desligado é desligado — a cobrança mensal de sempre');
{
  const casos = [[undefined, 'sem ensaio'], [null, 'ensaio nulo'],
    [{}, 'ensaio sem minutos'], [{ minutosPorPeriodo: 0 }, 'zero minutos'],
    [{ minutosPorPeriodo: -3 }, 'minutos negativos'],
    [{ minutosPorPeriodo: 'abc' }, 'minutos que não são número']];
  for (const [ensaio, nome] of casos) {
    const s = situacaoEm(30, ensaio);
    conferir('com ' + nome + ', o extrato fica no mês de calendário real',
      s.meses.length === 1 && s.meses[0].mes === '2026-11', s.meses.map((m) => m.mes));
  }
  /* SEM BASE NO PASSADO não há o que comprimir: devolve a hora real em vez de inventar um passado. */
  const semBase = mensalidades.instanteDoEnsaio({
    contrato: { criadoEm: '2027-06-01T00:00:00Z' }, ensaio: { minutosPorPeriodo: 3 },
    agora: BASE,
  });
  conferir('…e uma base no FUTURO não inventa um passado: devolve a hora real',
    semBase.getTime() === BASE, semBase.toISOString());
  const semContrato = mensalidades.instanteDoEnsaio({
    ensaio: { minutosPorPeriodo: 3 }, agora: BASE,
  });
  conferir('…e sem adesão nenhuma também não há relógio a comprimir',
    semContrato.getTime() === BASE, semContrato.toISOString());
}

console.log('\n4. O ensaio é de UMA escola, e não toca no livro');
{
  /* A CHAVE É POR ESCOLA, e é o servidor que a lê. A prova mede o que `dadosDaEscolaParaAProducao`
   * devolve para duas escolas no mesmo KV: uma com a chave, outra sem. */
  const guardado = {
    /* O PREFIXO É O DAS CHAVES DOS BASTIDORES (`RAIZ`, em `bastidores.js`), e não `padd/`: são
     * dois espaços de nomes, e escrever o errado aqui daria «não há ensaio» — que é exactamente o
     * que se quer distinguir de «há ensaio e ele não pega». */
    'bastidores/breu/ensaio': JSON.stringify({ minutosPorPeriodo: 3 }),
    'bastidores/breu/cadastro': JSON.stringify({ escolaNome: 'Breu' }),
    'bastidores/breu/comercial': JSON.stringify(CONTRATO),
    'bastidores/outra/cadastro': JSON.stringify({ escolaNome: 'Outra' }),
    'bastidores/outra/comercial': JSON.stringify(CONTRATO),
  };
  /* O KV CONTA AS ESCRITAS. Ler o extrato não pode escrever nada — e é sobretudo o ensaio que não
   * pode deixar marca no livro: um mês de ensaio no livro é uma competência paga que nunca existiu,
   * e o livro é o registo de dinheiro. Uma asserção que só olhasse para as chaves no fim diria
   * «não há» mesmo que uma escrita tivesse acontecido e fosse sobrescrita. */
  const escritas = [];
  const kv = {
    async get(k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
    async put(k, v) { escritas.push(k); guardado[k] = String(v); },
    async delete(k) { escritas.push(k); delete guardado[k]; },
  };
  return (async () => {
    const comEnsaio = await bastidores.dadosDaEscolaParaAProducao({}, kv, 'breu');
    const semEnsaio = await bastidores.dadosDaEscolaParaAProducao({}, kv, 'outra');
    conferir('a escola com a chave entra em ensaio, e a outra não',
      !!comEnsaio.ensaio && comEnsaio.ensaio.minutosPorPeriodo === 3
        && semEnsaio.ensaio === null, { breu: comEnsaio.ensaio, outra: semEnsaio.ensaio });
    conferir('…e ler o extrato não escreve nada — o ensaio não toca no livro',
      escritas.length === 0, escritas);
    conferir('…e a chave do livro continua a não existir depois da leitura',
      guardado['financeiro/mensalidades'] === undefined, Object.keys(guardado));

    /* A BASE É O INSTANTE EM QUE SE LIGA, E NÃO A ADESÃO — o erro que esta prova existe para
     * travar. Ligado às 17h do dia em que a escola aderiu às 00:41, uma base na adesão dava
     * dezasseis horas a três minutos por período: trinta e três anos de competências de uma vez, e
     * o extrato a abrir em 2059. */
    const comBaseNaAdesao = mensalidades.situacaoDaEscola({
      escola: 'breu', contrato: CONTRATO, livro: [],
      agora: '2026-11-17T17:00:00Z',
      ensaio: { minutosPorPeriodo: 3, base: '2026-11-17T00:41:26Z' },
    });
    const anos = Number(comBaseNaAdesao.mesDeHoje.slice(0, 4)) - 2026;
    conferir('…e uma base na adesão de horas antes já dava anos de competências — a base é o agora',
      anos > 20, { mesDeHoje: comBaseNaAdesao.mesDeHoje, anos });
    const comBaseAgora = mensalidades.situacaoDaEscola({
      escola: 'breu', contrato: CONTRATO, livro: [],
      agora: '2026-11-17T17:00:00Z',
      ensaio: { minutosPorPeriodo: 3, base: '2026-11-17T17:00:00Z' },
    });
    conferir('…e ligado agora, começa no mês de hoje', comBaseAgora.mesDeHoje === '2026-11',
      comBaseAgora.mesDeHoje);

    /* O AVISO NA PÁGINA — o ecrã não pode mostrar meses que ainda não existem sem o dizer. */
    const comAviso = bastidores.paginaFinanceiro('breu',
      { professor: 'p', ciclo: '01', query: '' }, { modo: 'clara', paleta: 'bordo' },
      Object.assign({}, comEnsaio, { cadastro: { escolaNome: 'Breu' } }));
    const semAviso = bastidores.paginaFinanceiro('outra',
      { professor: 'p', ciclo: '01', query: '' }, { modo: 'clara', paleta: 'bordo' },
      Object.assign({}, semEnsaio, { cadastro: { escolaNome: 'Outra' } }));
    conferir('…e a página diz que está em ensaio, com os minutos e como sair',
      /Modo de ensaio: cada período vale 3 minutos/.test(comAviso)
        && /não é cobrança/.test(comAviso), null);
    conferir('…e a escola sem a chave não tem aviso nenhum',
      !/Modo de ensaio/.test(semAviso), null);

    console.log('');
    if (falhas) { console.log('FALHOU — ' + (n - falhas) + '/' + n); process.exit(1); }
    console.log('TUDO CERTO — ' + n + ' asserção(ões).');
  })();
}
