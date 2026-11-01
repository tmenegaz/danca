#!/usr/bin/env node
'use strict';

/**
 * provar-escopo-da-aula.js — o que a aula deixa de fora vem do PO; o volume vem do plano; e nada
 * se perde em silêncio.
 *
 * TRÊS DEFEITOS, MEDIDOS, E CADA UM COM A SUA HISTÓRIA.
 *
 * 1. A «CONDIÇÃO DESTA AULA» ERA UMA FRASE FIXA NO CÓDIGO. «Sem deslocamento, sem giro, sem
 *    mudança de direção» era o **subtítulo da Aula 01 da Diaghilev** (`4462d6a`, 23/09/2026) — as
 *    aulas 02, 03 e 04 tinham subtítulos diferentes. Quando o subtítulo saiu do cabeçalho
 *    (28/10/2026), a frase foi promovida a texto fixo e passou a sair em TODAS as aulas de TODAS
 *    as escolas. Agora vem do PO, dos campos que a arquitetura do `po_ref` chama `what_is_left_out`
 *    («o que fica de fora, e por quê») — «O que fica de fora» (`o-que-fica-de-fora`) e «Critérios
 *    de exclusão» (`exclusao`). Sem nenhum dos dois, a lacuna declara-se; não se inventa.
 *
 * 2. A §6 «DISTRIBUIÇÃO DO VOLUME FÍSICO» DUPLICAVA A §3. A §3 imprime bloco × tempos × fatia
 *    com o total; a §6 imprimia só o total, uma secção depois. Nenhum consumidor lia o campo.
 *    Saiu, e as secções seguintes desceram um número — o que obrigou o mapa do validador a
 *    conhecer as três novas variantes, ou as descartaria em silêncio.
 *
 * 3. O `dimensoesEItens` PERDIA OS ITENS QUANDO FALTAVA `dimensoes-de-observacao`. Medido: sem o
 *    campo → `[]`; com UMA dimensão declarada → só essa, e as outras três com os itens dentro
 *    desapareciam. E nada falhava: a §5 saía `[Preencher]` e a folha saía sem os blocos de
 *    critério. O silêncio mais caro que este ficheiro podia ter.
 *
 *   node experimentos/provar-escopo-da-aula.js
 */

const fs = require('node:fs');
const path = require('node:path');
const {
  derivarAula01, dimensoesEItens, derivarCaptura,
} = require('../motor/nucleo/derivar-ciclo.js');

const RAIZ = path.resolve(__dirname, '..');
const ENVELOPES = path.join(RAIZ, 'escola/batata/envelopes');
const PLANO = JSON.parse(fs.readFileSync(path.join(ENVELOPES, 'plano-20261027-1025.json'), 'utf8'));
const PO = JSON.parse(fs.readFileSync(path.join(ENVELOPES, 'po-20261027-1353.json'), 'utf8'));
const CAL = { duracaoMinutos: 50, volumeMin: 80, volumeMax: 100 };
const CTX = { ciclo: '01', escola: 'Batata' };

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const aula = (po) => derivarAula01({
  plano: { respostas: PLANO.respostas },
  po: { respostas: po },
  contexto: CTX, calibracao: CAL,
});

console.log('\n1. O que a aula deixa de fora vem do PO');
const comPO = aula(PO.respostas);
const linhaDoEscopo = (md) => (md.split('\n').find((l) => /deixa de fora/.test(l)) || '');
provar('a frase fixa da Diaghilev já não aparece',
  !/Sem deslocamento, sem giro/.test(comPO), linhaDoEscopo(comPO));
provar('…e o que aparece é o «O que fica de fora» do PO da Batata',
  /allegro, o trabalho de ponta e a avaliação de repertório/.test(linhaDoEscopo(comPO)),
  linhaDoEscopo(comPO));
provar('…com a origem declarada na própria frase (o PO, não a aula)',
  /deixa de fora/.test(linhaDoEscopo(comPO)), linhaDoEscopo(comPO));

console.log('\n2. Sem o campo, a lacuna declara-se — não se inventa');
const semEscopo = { ...PO.respostas };
delete semEscopo['o-que-fica-de-fora'];
delete semEscopo['exclusao'];
const semNada = aula(semEscopo);
provar('sem os dois campos, a frase da Diaghilev NÃO volta',
  !/Sem deslocamento, sem giro/.test(semNada), linhaDoEscopo(semNada));
provar('…sai a lacuna, com o caminho de volta («O que fica de fora», no PO)',
  /\[Preencher:.*Plano de Observação/s.test(linhaDoEscopo(semNada)), linhaDoEscopo(semNada));

console.log('\n3. A queda para o segundo campo só acontece quando o primeiro está vazio');
const soExclusao = { ...PO.respostas };
delete soExclusao['o-que-fica-de-fora'];
provar('com «O que fica de fora» vazio, lê-se «Critérios de exclusão»',
  /intenção declarada e o esforço percebido/.test(linhaDoEscopo(aula(soExclusao))),
  linhaDoEscopo(aula(soExclusao)));

console.log('\n4. A «Distribuição do volume físico» saiu — o número mora num lugar só');
const secoes = comPO.split(/^## /m).slice(1).map((x) => x.split('\n')[0]);
provar('não há secção de distribuição do volume', !secoes.some((t) => /volume físico/i.test(t)), secoes);
provar('a numeração é contínua de 1 a 8',
  JSON.stringify(secoes.map((t) => t.split('.')[0])) === JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8']),
  secoes.map((t) => t.split('.')[0]));
provar('…e o total do volume aparece UMA vez (na §3)',
  (comPO.match(/\*\*90\*\*/g) || []).length === 1, (comPO.match(/\*\*90\*\*/g) || []).length);
provar('as três secções que desceram continuam a nascer (proveniência, auditoria, próximo passo)',
  ['6. Proveniência', '7. Registro de auditoria', '8. Próximo passo']
    .every((t) => secoes.some((s) => s.startsWith(t))), secoes);

console.log('\n5. O par dimensão × item não se perde quando falta a lista das dimensões');
const itens = [
  { sujeito: 'Técnica — Solo', itens: 'a; b' },
  { sujeito: 'Técnica — Barra', itens: 'c; d' },
];
provar('sem `dimensoes-de-observacao`, os itens continuam lá (era `[]`)',
  JSON.stringify(dimensoesEItens({ respostas: { 'itens-por-dimensao': itens } }))
    === JSON.stringify([{ dimensao: 'Técnica — Solo', itens: ['a', 'b'] },
      { dimensao: 'Técnica — Barra', itens: ['c', 'd'] }]),
  dimensoesEItens({ respostas: { 'itens-por-dimensao': itens } }));
provar('com só UMA dimensão declarada, as outras não desaparecem',
  dimensoesEItens({ respostas: {
    'dimensoes-de-observacao': ['Técnica — Solo'],
    'itens-por-dimensao': itens,
  } }).length === 2,
  dimensoesEItens({ respostas: {
    'dimensoes-de-observacao': ['Técnica — Solo'],
    'itens-por-dimensao': itens,
  } }));
provar('a ordem é a declarada primeiro, e a declarada sem itens fica com a lista vazia',
  JSON.stringify(dimensoesEItens({ respostas: {
    'dimensoes-de-observacao': ['Técnica — Centro', 'Técnica — Solo'],
    'itens-por-dimensao': itens,
  }}).map((d) => [d.dimensao, d.itens.length]))
    === JSON.stringify([['Técnica — Centro', 0], ['Técnica — Solo', 2], ['Técnica — Barra', 2]]),
  dimensoesEItens({ respostas: {
    'dimensoes-de-observacao': ['Técnica — Centro', 'Técnica — Solo'],
    'itens-por-dimensao': itens,
  }}));

console.log('\n6. E a folha de captura, que lê o mesmo par, também não perde os blocos');
const folha = derivarCaptura({ po: { respostas: { 'itens-por-dimensao': itens } }, contexto: CTX });
provar('a folha declara os dois blocos que só existiam nos itens',
  (folha.match(/^## Bloco /gm) || []).length === 2, (folha.match(/^## Bloco /gm) || []).length);
provar('…com um critério por linha de tabela, e não dois numa célula',
  /\| a \|/.test(folha) && /\| b \|/.test(folha) && !/a; b/.test(folha),
  (folha.match(/^\| .* \|.*\|$/gm) || []).slice(0, 3));

console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ')
  + total + ' asserção(ões), ' + falhas + ' falha(s).');
process.exit(falhas ? 1 : 0);
