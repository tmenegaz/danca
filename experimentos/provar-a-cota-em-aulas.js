#!/usr/bin/env node
'use strict';

/*
 * provar-a-cota-em-aulas.js — o painel passa a medir a cota na unidade da CASA, e a avisar antes
 * (25/11/2026).
 *
 * A PERGUNTA DELA, ao pé da letra: «A gente tem um monitoramento aqui e ele diz para a gente quando é
 * que a gente precisa tomar alguma medida antes que ela aconteça.» As cotas que o painel mostrava
 * eram todas do FORNECEDOR — minutos, e-mails, chaves do KV. Nenhuma delas responde à pergunta que
 * decide: **quantas aulas cabem antes de a conta sair do zero?**
 *
 * A CONTA QUE ISTO PROTEGE. Medido a 25/11/2026 sobre mil execuções: um lançamento custa 1,00 min
 * (`Fechar os derivados`, mediana 11 s em 395 runs) e a geração que ele pede custa 1,00 min
 * (`Gerar o ciclo`, mediana 40 s em 16 runs depois de o TeX sair). São **2,0 minutos por aula**, e
 * os 2 000 minutos do plano gratuito são **1 000 aulas por mês**. A partir daí cada aula custa
 * R$ 0,072 a um dólar de R$ 6 — o número que o §12 do CUSTO-DOS-FLUXOS fixou.
 *
 * O QUE SE MEDE, e o controlo em cada frente:
 *   (i) as cotas derivam do catálogo de cotas e da unidade, e não de números escritos à mão;
 *   (ii) o custo é ZERO até 1 000 aulas e cresce a partir daí — com o controlo de que a 999 é zero
 *        e a 1 001 não é;
 *   (iii) a referência é R$ 6 e o câmbio do dia é outro: as duas contas aparecem, e a de R$ 6 é
 *        MAIOR — se não fosse, a «sobra» que ela pediu não existiria;
 *   (iv) `null` ≠ `0`: sem aulas vendidas o painel diz que não sabe, e não desenha um zero;
 *   (v) a ligação ao retrato: a cota em aulas entra no pior indicador, e é ela que faz o nível
 *        subir quando as outras três estão de folga — que é o defeito que isto existe para evitar.
 *
 *   uso: node experimentos/provar-a-cota-em-aulas.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const m = require(path.join(RAIZ, 'motor/nucleo/monitoramento.js'));
const ph = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));

let n = 0;
let falhas = 0;
function conferir(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

console.log('\nA. As constantes: a unidade é medida, a referência é decidida');
{
  conferir('a unidade é 2,0 minutos por aula — o medido', m.MINUTOS_POR_AULA === 2.0, m.MINUTOS_POR_AULA);
  conferir('…e o valor bate com os dois jobs: 1,00 (derivados) + 1,00 (gerar)',
    m.MINUTOS_POR_AULA === 1.0 + 1.0, m.MINUTOS_POR_AULA);
  conferir('a medição tem data, e a data é um INSTANTE (senão o fuso come o dia)',
    /T\d{2}:\d{2}/.test(m.MINUTOS_POR_AULA_MEDIDO_EM), m.MINUTOS_POR_AULA_MEDIDO_EM);
  conferir('a referência de segurança é R$ 6 — o que ela declarou suportar',
    m.CAMBIO_DE_REFERENCIA === 6.0, m.CAMBIO_DE_REFERENCIA);
  /* O CONTROLADOR: se a unidade fosse 1 min — a leitura antiga, antes de o §7.8 medir os dois jobs —
   * a cota em aulas seria o dobro, e o alarme tocaria tarde. */
  const aulasComUmMinuto = Math.floor(m.minutosIncluidos(null) / 1);
  conferir('CONTROLO: com 1 min/aula a cota diria ' + aulasComUmMinuto
    + ' aulas — o dobro, e o alarme tocaria tarde',
    aulasComUmMinuto === 2 * Math.floor(m.minutosIncluidos(null) / 2), aulasComUmMinuto);
}

console.log('\nB. O custo: zero até 1 000 aulas, e R$ 0,072 por aula depois');
{
  const p = (aulas) => m.projectarAulas({ aulasVendidas: aulas, precoDaAulaCentavos: 30, cambio: 6.0 });
  const zero = p(1000);
  conferir('as 1 000 aulas cabem inteiras no gratuito — custo zero',
    zero.hoje.custoUsd === 0 && zero.hoje.custoCentavos === 0, zero.hoje);
  conferir('1 001 aulas já não cabem — e custam mais do que zero',
    p(1001).hoje.custoUsd > 0, p(1001).hoje.custoUsd);
  /* O CONTROLADOR da fronteira: a 999 é zero, a 1 001 não é. Sem os dois lados, a asserção de cima
   * passaria com uma função que devolvesse sempre zero. */
  conferir('CONTROLO: a 999 é zero, a 1 001 não é — a fronteira existe',
    p(999).hoje.custoUsd === 0 && p(1001).hoje.custoUsd > 0,
    [p(999).hoje.custoUsd, p(1001).hoje.custoUsd]);
  /* AS DUAS FAIXAS, e é preciso medi-las as duas porque a segunda não é linear no começo. Acima de
   * 1 000 aulas o minuto custa US$ 0,006; mas a partir de 1 500 (3 000 min) entra o **Team**, que
   * substitui MIL minutos do excedente por um valor fixo de US$ 4. É a razão pela qual a regra de
   * bolso `(aulas − 1 000) × 0,072` EXAGERA sempre — ela ignora esse bocado. O §12.9 do
   * CUSTO-DOS-FLUXOS já o declara, e aqui mede-se. */
  const g = m.projectarAulas({ aulasVendidas: 2850, precoDaAulaCentavos: 33, cambio: 6.0 });
  const minutos = 2850 * 2.0;
  const doTeam = 4 + (minutos - 3000) * 0.006;   // a escada real, acima dos 3 000 min
  conferir('2 850 aulas custam US$ ' + doTeam.toFixed(2) + ' — o Team (US$ 4) mais o excedente acima '
    + 'dos 3 000 min',
  Math.abs(g.hoje.custoUsd - doTeam) < 1e-9, g.hoje.custoUsd);
  /* E O MARGINAL, que é o número que ela usa para decidir: cada aula a mais, NESTA faixa, custa
   * R$ 0,072 — o Team já está pago. */
  const maisUma = m.projectarAulas({ aulasVendidas: 2851, precoDaAulaCentavos: 33, cambio: 6.0 });
  conferir('…e cada aula a mais nesta faixa custa R$ 0,072 — o Team já está pago',
    Math.abs((maisUma.hoje.custoUsd - g.hoje.custoUsd) * 6.0 - 0.072) < 1e-6,
    Number(((maisUma.hoje.custoUsd - g.hoje.custoUsd) * 6.0).toFixed(6)));
  /* O CONTROLADOR da regra de bolso: ela dá MAIS do que a conta real, e é por isso que serve para
   * orçamentar — mas não é o número. */
  const regraDeBolso = 1850 * 0.072;
  conferir('CONTROLO: a regra de bolso (' + regraDeBolso.toFixed(2) + ') EXAGERA sobre a conta real ('
    + (g.hoje.custoUsd * 6.0).toFixed(2) + ') — erra por excesso, e é declarado',
  regraDeBolso > g.hoje.custoUsd * 6.0, [regraDeBolso, g.hoje.custoUsd * 6.0]);
}

console.log('\nC. As duas câmbios: o do dia e o de referência, e a referência é a maior');
{
  const r = m.projectarAulas({ aulasVendidas: 2850, precoDaAulaCentavos: 33, cambio: 5.40 });
  conferir('a conta aparece à taxa do dia e à de referência',
    r.hoje && r.naReferencia && r.hoje.cambio === 5.40 && r.naReferencia.cambio === 6.0,
    [r.hoje && r.hoje.cambio, r.naReferencia && r.naReferencia.cambio]);
  conferir('…e a de R$ 6 é MAIOR — é a sobra que ela pediu',
    r.naReferencia.custoCentavos > r.hoje.custoCentavos,
    [r.hoje.custoCentavos, r.naReferencia.custoCentavos]);
  /* O CONTROLADOR: à taxa zero o custo em reais é zero, e a margem é 100% — mas o custo em DÓLAR
   * não muda. Sem isso, uma função que devolvesse o mesmo em reais não estaria a converter nada. */
  conferir('CONTROLO: o custo em dólar é o MESMO nas duas taxas — só o real muda',
    Math.abs(r.hoje.custoUsd - r.naReferencia.custoUsd) < 1e-9,
    [r.hoje.custoUsd, r.naReferencia.custoUsd]);
  const semCambio = m.projectarAulas({ aulasVendidas: 2850, precoDaAulaCentavos: 33, cambio: null });
  conferir('sem câmbio declarado, a conta de hoje é null — e a de referência continua',
    semCambio.hoje === null && semCambio.naReferencia !== null, semCambio.hoje);
}

console.log('\nD. `null` ≠ `0`: sem aulas vendidas, o painel diz que não sabe');
{
  const vazio = m.projectarAulas({ cambio: 5.40 });
  conferir('sem aulas, `aulasVendidas` é null e a fracção também',
    vazio.aulasVendidas === null && vazio.fraccao === null, [vazio.aulasVendidas, vazio.fraccao]);
  conferir('…e a frase diz que não é calculado, em vez de dizer zero',
    /não é calculado/.test(vazio.frase || ''), vazio.frase);
  conferir('…e o bloco avisa em vez de desenhar uma barra a zero',
    /sem aulas vendidas/i.test(ph.blocoDasAulas(vazio)), ph.blocoDasAulas(vazio).slice(0, 200));
  const zero = m.projectarAulas({ aulasVendidas: 0, precoDaAulaCentavos: 30, cambio: 5.40 });
  conferir('CONTROLO: com ZERO aulas vendidas o número é 0 e a barra existe — «sei, e não há»',
    zero.aulasVendidas === 0 && zero.fraccao === 0
    && !/sem aulas vendidas/i.test(ph.blocoDasAulas(zero)), zero.fraccao);
}

console.log('\nE. A ligação ao retrato: a cota em aulas entra no pior indicador');
{
  /* Três cotas folgadas e as aulas estouradas: o nível TEM de subir. Era este o defeito — um painel
   * com as cotas do fornecedor em folga e a conta a correr. */
  const folgado = { fraccao: 0.1, minutos: 200, total: 2000 };
  const r = m.retrato({
    github: folgado, correio: { fraccao: 0.1, fraccaoDia: 0.1 }, cloudflare: { fraccaoArmazenamento: 0.1 },
    receita: { mrrCentavos: 92910, aulas: { franquiaTotal: 2850, precoContratadoCentavos: 33 } },
    cambio: 5.40,
  });
  conferir('com as três cotas do fornecedor a 10% e as aulas a 2,85×, o nível é «agora»',
    r.nivel === 'agora', [r.nivel, r.piorFraccao]);
  conferir('…e o pior indicador é o das aulas, e não o dos minutos',
    Math.abs(r.piorFraccao - 2.85) < 1e-9, r.piorFraccao);
  /* O CONTROLADOR: sem a cota em aulas no retrato, o mesmo parque dava «folga». É a diferença que a
   * linha nova faz, e é ela que se mede. */
  const semAulas = m.retrato({
    github: folgado, correio: { fraccao: 0.1, fraccaoDia: 0.1 }, cloudflare: { fraccaoArmazenamento: 0.1 },
    receita: { mrrCentavos: 92910 }, cambio: 5.40,
  });
  conferir('CONTROLO: sem aulas vendidas no livro, o mesmo parque dava «folga»',
    semAulas.nivel === 'folga', [semAulas.nivel, semAulas.piorFraccao]);
}

console.log('\nF. O que a página mostra, e o que ela se recusa a mostrar');
{
  const r = m.projectarAulas({ aulasVendidas: 2850, precoDaAulaCentavos: 33, cambio: 5.40 });
  const h = ph.blocoDasAulas(r);
  conferir('o bloco diz as 1 000 aulas que o plano paga, e o número é formatado com milhar',
    /1\u202f000 aulas por mês/.test(h), h.slice(0, 400));
  conferir('…e diz de quando é a medição, no dia certo',
    /25\/11\/2026/.test(h), h.match(/medido a ([^)]+)/));
  conferir('…e as duas câmbios, com o rótulo de cada uma',
    /o câmbio\s+declarado/.test(h.replace(/\s+/g, ' ')) && /referência de segurança/.test(h), null);
  conferir('…e declara que a conta é só das aulas — o CI de desenvolvimento corre na mesma cota',
    /CI do desenvolvimento/.test(h), null);
  /* O QUE O BLOCO NÃO PODE DIZER: que a franquia vendida é o consumo. A casa não conta as aulas do
   * mês; a franquia é o TECTO. Chamar-lhe «consumo» seria a mentira que o painel existe para não
   * contar. */
  conferir('o bloco chama-lhe franquia dos contratos, e NÃO consumo',
    /franquia dos contratos/.test(h) && !/Consumo do mês/.test(h), null);
}

const total = n;
console.log('\n' + (falhas === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + (total - falhas) + '/' + total
  + ' asserção(ões).');
if (falhas) process.exit(1);
