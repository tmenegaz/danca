#!/usr/bin/env node
'use strict';

/**
 * provar-o-custo-da-consultoria.js — QUANTO CUSTA UMA DEMONSTRAÇÃO (25/11/2026).
 *
 * A PERGUNTA, e ela é de risco: «isso vai ter custo, não vai sair de graça. […] No final, se a escola
 * não contratar, esse limitador é o que garante que o custo seja mínimo. Afinal de contas, o risco do
 * negócio é meu.»
 *
 * O [CUSTO-DOS-FLUXOS.md](./CUSTO-DOS-FLUXOS.md) §22 responde **16 minutos e R$ 0,58** — a
 * demonstração canónica, uma turma —, e **26 min / R$ 0,94** para o pior caso que ainda cabe nas sete
 * paredes. O [FLUXO-DA-ESCOLA-EM-CONSULTORIA.md](./FLUXO-DA-ESCOLA-EM-CONSULTORIA.md) repete os dois
 * ao consultor. Dois documentos a afirmar o mesmo número é a receita para os dois mentirem juntos — que é
 * a família de erro que o §20 registou, com uma prova a dizer 3 durante seis dias enquanto o
 * documento dizia 2.
 *
 * **Esta prova é o que impede os dois de apodrecerem.** Ela não confia em nenhum deles: recalcula a
 * partir do CATÁLOGO (`planos.json` → `consultoria.limites`) e do DADO (`ciclos.json`, as aulas que um
 * ciclo realmente tem), e compara o resultado com o que está escrito nos dois documentos. Se mudarem
 * os limites, a prova reprova até a documentação mudar.
 *
 * O QUE SE MEDE:
 *
 *   §A o catálogo ainda diz o que o §22.1 pressupõe — 2 ciclos, 3 aulas, e uma demonstração que cabe;
 *   §B os dois tectos, recalculados do catálogo, são os dos documentos (16 min/R$ 0,58 canónico,
 *      26 min/R$ 0,94 com as três turmas);
 *   §C o contrafactual sem limitador usa as aulas REAIS de um ciclo (24, lidas do `ciclos.json`);
 *   §D a franquia: quantas demonstrações cabem nos 2 000 min, com e sem a engenharia;
 *   §E o custo do treino que o guião promete ao consultor (32 min, R$ 1,15);
 *   §F CONTROLO NEGATIVO: a conta depende mesmo do catálogo — com 6 aulas em vez de 3, o tecto muda
 *      na proporção certa; e o número de TURMAS muda o tecto (1 → 16, 2 → 21, 3 → 26), que é o que
 *      impede a prova de passar com os actos por turma somados uma vez só.
 *
 *   node experimentos/provar-o-custo-da-consultoria.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const lerTexto = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8');
const lerJson = (rel) => JSON.parse(lerTexto(rel));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* ── os números medidos, e de onde vêm ────────────────────────────────────────────────────────────
 *
 * As quatro primeiras linhas foram MEDIDAS na API do Actions a 25/11/2026, e o §22.1 traz o run ou o
 * commit de cada uma. A prova não pode voltar à API (é dinheiro e cota), por isso **declara-as** — e o
 * que ela garante é que a aritmética em cima delas está certa e que os documentos não se afastaram
 * dela. Se alguém mudar um destes números sem refazer a medição, é aqui que se descobre.
 */
const MIN = {
  criarEscola: 2,      // criar (40 s) + derivados (25 s) — MEDIDO: run 45156042117 + ddbee1d5
  gravarPlano: 1,      // só derivados — MEDIDO: 229a322a e 225c8e3b, uma execução cada
  gravarPo: 2,         // gerar + derivados — MEDIDO: 00df9fe4, 45e0dff4, 0ea82c68
  gerarCiclo: 1,       // só gerar — MEDIDO: 6177f30d, nenhuma outra execução
  lancarAula: 3,       // 2 derivados + 1 geração — MEDIDO (§20.4)
  atoDeKv: 0,          // entregar, prorrogar, habilitar
};

const CAMBIO = 6;             // R$/US$, a taxa do §20
const USD_POR_MIN = 0.006;    // §2, Linux standard
const TAXA_BRL = USD_POR_MIN * CAMBIO;   // R$ 0,036/min
const FRANQUIA_MIN = 2000;    // §2
const ENGENHARIA_MIN = 522;   // §L9f, medido

const reais = (min) => Math.round(min * TAXA_BRL * 100) / 100;

/* ── o tecto, calculado a partir dos limites do catálogo ──────────────────────────────────────── */

/**
 * O TECTO DE UMA DEMONSTRAÇÃO — e são DOIS, porque a prática é que decide qual vale.
 *
 * `turmas` não é decoração: o `gerar` corre **uma vez por alvo**, e o alvo é a turma. Uma demonstração
 * canónica leva UMA turma até ao fim (plano, PO, ciclos) e deixa as outras montadas; o pior caso que
 * ainda cabe nas sete paredes leva as três. A diferença é de 16 para 26 minutos, e é por isso que os
 * dois números existem e os dois são afirmados.
 */
function tectoDaLiberdade(limites, aulasPorCiclo, turmas) {
  // O que a escola PODE fazer dentro do limitador: o menor entre as aulas que o limite permite e as
  // que os ciclos permitidos contêm. É este `min` que faz do limitador um orçamento.
  const aulas = Math.min(limites.aulas, limites.ciclos * aulasPorCiclo);
  const ciclos = limites.ciclos;
  const min =
    MIN.criarEscola + turmas * (MIN.gravarPlano + MIN.gravarPo) +
    turmas * ciclos * MIN.gerarCiclo + aulas * MIN.lancarAula + MIN.atoDeKv;
  return { aulas, ciclos, turmas, min, brl: reais(min) };
}

/* ── §A o catálogo ───────────────────────────────────────────────────────────────────────────── */

console.log('\n§A o catálogo diz o que o §22.1 pressupõe');

const planos = lerJson('biblioteca/comercial/planos.json');
const consultoria = planos.consultoria || planos.planos && planos.planos.consultoria;
provar('o plano consultoria existe no catálogo', !!consultoria, Object.keys(planos));
const limites = consultoria && consultoria.limites;
provar('tem limites declarados', !!limites, limites);
provar('2 ciclos', limites && limites.ciclos === 2, limites && limites.ciclos);
provar('3 aulas', limites && limites.aulas === 3, limites && limites.aulas);
provar('é o plano escondido (não se vende)', consultoria && consultoria.publico === false,
  consultoria && consultoria.publico);
provar('preço zero — não é dívida', consultoria && consultoria.preco === 0, consultoria && consultoria.preco);

/* ── a fonte: as aulas que um ciclo REALMENTE tem ────────────────────────────────────────────── */

const CICLO = 'professores/demi-plie/ciclos/ciclo-01-breu-piano/ciclos.json';
const indice = lerJson(CICLO);
const aulasDoCiclo = indice.ciclos[0].aulas;
provar('o índice do ciclo traz as aulas datadas', Array.isArray(aulasDoCiclo), typeof aulasDoCiclo);
provar('e são 24 — o número que o §22.2 usa', aulasDoCiclo.length === 24, aulasDoCiclo.length);
provar('nenhuma nasce lançada — é a leitura B do §10.1-bis do plano',
  aulasDoCiclo.every((a) => a.lancada === false),
  aulasDoCiclo.filter((a) => a.lancada !== false).map((a) => a.n));

/* ── §B o tecto, recalculado ─────────────────────────────────────────────────────────────────── */

console.log('\n§B o tecto de uma demonstração, recalculado do catálogo');

const tecto = tectoDaLiberdade(limites, aulasDoCiclo.length, 1);
const pior = tectoDaLiberdade(limites, aulasDoCiclo.length, 3);
console.log('        canónico ' + JSON.stringify(tecto));
console.log('        pior     ' + JSON.stringify(pior));
provar('16 minutos — a demonstração canónica, uma turma', tecto.min === 16, tecto.min);
provar('R$ 0,58 — o número do §22.2', tecto.brl === 0.58, tecto.brl);
provar('26 minutos — o pior caso dentro do limitador, as três turmas', pior.min === 26, pior.min);
provar('R$ 0,94 — e não R$ 0,58, é o que se orçamenta', pior.brl === 0.94, pior.brl);
provar('à taxa do §20 (R$ 0,036/min)', Math.abs(TAXA_BRL - 0.036) < 1e-9, TAXA_BRL);
provar('o limitador de aulas é o que morde (3 < 2 × 24)', tecto.aulas === limites.aulas, tecto.aulas);

/* ── §C o contrafactual ──────────────────────────────────────────────────────────────────────── */

console.log('\n§C sem limitador, os mesmos 2 ciclos dão outro produto');

const semTecto = { aulas: limites.ciclos * aulasDoCiclo.length, turmas: 1 };
semTecto.min = MIN.criarEscola + MIN.gravarPlano + MIN.gravarPo +
  limites.ciclos * MIN.gerarCiclo + semTecto.aulas * MIN.lancarAula;
semTecto.brl = reais(semTecto.min);

provar('48 aulas — as 24 de cada ciclo', semTecto.aulas === 48, semTecto.aulas);
provar('151 minutos — o número do §22.2', semTecto.min === 151, semTecto.min);
provar('R$ 5,44 — o número do §22.2', semTecto.brl === 5.44, semTecto.brl);
const razao = Math.round((semTecto.min / tecto.min) * 10) / 10;
provar('9,4× — a razão que o §22.3 afirma contra o canónico', razao === 9.4, razao);
const razaoPior = Math.round((semTecto.min / pior.min) * 10) / 10;
provar('5,8× contra o pior caso — o limitador continua a valer', razaoPior === 5.8, razaoPior);
provar('o limitador corta 135 dos 151 minutos', semTecto.min - tecto.min === 135, semTecto.min - tecto.min);
provar('e 125 do pior caso', semTecto.min - pior.min === 125, semTecto.min - pior.min);

/* ── §D a franquia ───────────────────────────────────────────────────────────────────────────── */

console.log('\n§D quantas demonstrações cabem nos 2 000 minutos');

const sobra = FRANQUIA_MIN - ENGENHARIA_MIN;
const comEngenharia = Math.floor(sobra / tecto.min);
const semEngenharia = Math.floor(FRANQUIA_MIN / tecto.min);
const comPior = Math.floor(sobra / pior.min);
provar('92 canónicas com a engenharia — o número do §22.4', comEngenharia === 92, comEngenharia);
provar('56 no pior caso', comPior === 56, comPior);
provar('125 sem descontar a engenharia', semEngenharia === 125, semEngenharia);
provar('em dinheiro, zero enquanto a franquia durar',
  tecto.brl > 0 && comEngenharia > 0, { brl: tecto.brl, comEngenharia });
provar('a cota é o recurso escasso, não o dinheiro',
  comEngenharia * tecto.min <= FRANQUIA_MIN, comEngenharia * tecto.min);

/* ── §E o treino ─────────────────────────────────────────────────────────────────────────────── */

console.log('\n§E o custo de treinar um consultor');

const treino = { min: tecto.min * 2 };
treino.brl = reais(treino.min);
provar('32 minutos — duas demonstrações, uma para ver e uma para fazer',
  treino.min === 32, treino.min);
provar('R$ 1,15 — o número do §22.5 e do guião', treino.brl === 1.15, treino.brl);

/* ── §F o controlo negativo ──────────────────────────────────────────────────────────────────── */

console.log('\n§F o controlo negativo: a conta depende mesmo do catálogo');

const comSeisAulas = tectoDaLiberdade({ ...limites, aulas: 6 }, aulasDoCiclo.length, 1);
provar('com 6 aulas o tecto sobe para 25 min', comSeisAulas.min === 25, comSeisAulas.min);
provar('e NÃO fica nos 16 — a aritmética lê o catálogo', comSeisAulas.min !== tecto.min, comSeisAulas.min);
provar('o valor acompanha (R$ 0,90)', comSeisAulas.brl === 0.9, comSeisAulas.brl);

const comUmCiclo = tectoDaLiberdade({ ...limites, ciclos: 1 }, aulasDoCiclo.length, 1);
provar('com 1 ciclo o tecto desce para 15 min', comUmCiclo.min === 15, comUmCiclo.min);
provar('e as aulas continuam a ser 3 — o menor dos dois limites',
  comUmCiclo.aulas === 3, comUmCiclo.aulas);

const tresTurmas = tectoDaLiberdade(limites, aulasDoCiclo.length, 2);
provar('com 2 turmas o tecto fica entre os dois (21 min)', tresTurmas.min === 21, tresTurmas.min);

/* ── §G os documentos dizem o mesmo que a conta ─────────────────────────────────────────────── */

console.log('\n§G os dois documentos não se afastaram da conta');

const custo = lerTexto('CUSTO-DOS-FLUXOS.md');
const guiao = lerTexto('FLUXO-DA-ESCOLA-EM-CONSULTORIA.md');

provar('o §22 existe no CUSTO-DOS-FLUXOS', /^## 22\. O custo de uma escola em consultoria/m.test(custo),
  (custo.match(/^## 2\d\..*/gm) || []).slice(-3));
provar('o §22 diz 16 minutos canónicos', /\| \*\*16\*\* \| \*\*R\$ 0,58\*\* \|/.test(custo), null);
provar('o §22 diz 26 minutos no pior caso', /\| \*\*26\*\* \| \*\*R\$ 0,94\*\* \|/.test(custo), null);
provar('o §22 diz 151 minutos no contrafactual', /\| \*\*151\*\* \| \*\*R\$ 5,44\*\* \|/.test(custo), null);
provar('o §22 diz 9,4 vezes', /9,4 vezes/.test(custo), null);
provar('o §22 diz 5,8 vezes', /5,8 vezes/.test(custo), null);
provar('o §22 diz 92 demonstrações', /\| \*\*92\*\* \|/.test(custo), null);
provar('o §22 diz 32 minutos de treino', /\| \*\*por consultor, com uma repetição\*\* \| \*\*32\*\* \| \*\*R\$ 1,15\*\* \|/.test(custo), null);
provar('o §22 diz R$ 1,15', /R\$ 1,15/.test(custo), null);
provar('o §22 regista os run ids medidos', /45156042117/.test(custo) && /00df9fe4/.test(custo) && /6177f30d/.test(custo), null);
provar('o §22 declara o método (head_sha, hora local)', /head_sha/.test(custo) && /UTC−3/.test(custo), null);

provar('o guião aponta para o §22', /CUSTO-DOS-FLUXOS\.md\) §22/.test(guiao), null);
provar('o guião orçamenta pelos 26 e não pelos 16', /O número a orçamentar é 26, e não 16/.test(guiao), null);
provar('o guião diz 16 no canónico', /\| \*\*16\*\* \| \*\*R\$ 0,58\*\* \|/.test(guiao), null);
provar('o guião diz 26 no pior caso', /\| \*\*26\*\* \| \*\*R\$ 0,94\*\* \|/.test(guiao), null);
provar('o guião promete 32 a cada consultor', /\| \*\*32\*\* \|/.test(guiao), null);
provar('o guião promete R$ 1,15', /R\$ 1,15 por consultor treinado/.test(guiao), null);
provar('o guião manda montar UMA turma até ao fim',
  /leva só uma até ao fim/.test(guiao), null);

/* ── o resumo ───────────────────────────────────────────────────────────────────────────────── */

console.log('\n' + provas + ' asserções, ' + (provas - falhas) + ' ok, ' + falhas + ' falha(s)');
console.log('canónico ' + tecto.min + ' min = R$ ' + tecto.brl.toFixed(2) +
  ' · pior caso ' + pior.min + ' min = R$ ' + pior.brl.toFixed(2) +
  ' · sem limitador ' + semTecto.min + ' min = R$ ' + semTecto.brl.toFixed(2));
process.exit(falhas === 0 ? 0 : 1);
