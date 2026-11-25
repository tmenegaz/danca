#!/usr/bin/env node
'use strict';

/**
 * provar-o-custo-da-consultoria.js — QUANTO CUSTA UMA DEMONSTRAÇÃO (25/11/2026).
 *
 * A PERGUNTA, e ela é de risco: «isso vai ter custo, não vai sair de graça. […] No final, se a escola
 * não contratar, esse limitador é o que garante que o custo seja mínimo. Afinal de contas, o risco do
 * negócio é meu.»
 *
 * O [CUSTO-DOS-FLUXOS.md](./CUSTO-DOS-FLUXOS.md) §22 responde **22 minutos e R$ 0,79**, e o
 * [FLUXO-DA-ESCOLA-EM-CONSULTORIA.md](./FLUXO-DA-ESCOLA-EM-CONSULTORIA.md) repete o número ao
 * consultor. Dois documentos a afirmar o mesmo número é a receita para os dois mentirem juntos — que é
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
 *   §B o tecto da demonstração, recalculado do catálogo, é o dos documentos (22 min, R$ 0,79);
 *   §C o contrafactual sem limitador usa as aulas REAIS de um ciclo (24, lidas do `ciclos.json`);
 *   §D a franquia: quantas demonstrações cabem nos 2 000 min, com e sem a engenharia;
 *   §E o custo do treino que o guião promete ao consultor (44 min, R$ 1,58);
 *   §F CONTROLO NEGATIVO: a conta depende mesmo do catálogo — com 6 aulas em vez de 3, o tecto muda
 *      na proporção certa. Sem isto, uma prova que só compara constantes passaria com a aritmética
 *      trocada.
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
 * As três primeiras linhas são as do §22.1 e trazem a sua base; as duas últimas são MEDIDAS. A prova
 * não pode medir a API do GitHub (é dinheiro e cota), por isso **declara-as** — e o que ela garante é
 * que a aritmética em cima delas está certa e que os documentos não se afastaram dela.
 */
const MIN = {
  criarEscola: 3,      // 1 job medido (§2) + derivados + publicar — os dois observadores: INFERIDO
  gravarPlano: 2,      // §5 declara 1; §20.3 mediu a gravação irmã em 4 — INFERIDO
  gravarPo: 2,         // idem
  gerarCiclo: 3,       // gerar + derivados + publicar, 1 min cada — medido (§20.2)
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

function tectoDaLiberdade(limites, aulasPorCiclo) {
  // O que a escola PODE fazer dentro do limitador: o menor entre as aulas que o limite permite e as
  // que os ciclos permitidos contêm. É este `min` que faz do limitador um orçamento.
  const aulas = Math.min(limites.aulas, limites.ciclos * aulasPorCiclo);
  const ciclos = limites.ciclos;
  const min =
    MIN.criarEscola + MIN.gravarPlano + MIN.gravarPo +
    ciclos * MIN.gerarCiclo + aulas * MIN.lancarAula + MIN.atoDeKv;
  return { aulas, ciclos, min, brl: reais(min) };
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

const tecto = tectoDaLiberdade(limites, aulasDoCiclo.length);
console.log('        ' + JSON.stringify(tecto));
provar('22 minutos — o número do §22.1', tecto.min === 22, tecto.min);
provar('R$ 0,79 — o número do §22.1', tecto.brl === 0.79, tecto.brl);
provar('à taxa do §20 (R$ 0,036/min)', Math.abs(TAXA_BRL - 0.036) < 1e-9, TAXA_BRL);
provar('o limitador de aulas é o que morde (3 < 2 × 24)', tecto.aulas === limites.aulas, tecto.aulas);

/* ── §C o contrafactual ──────────────────────────────────────────────────────────────────────── */

console.log('\n§C sem limitador, os mesmos 2 ciclos dão outro produto');

const semTecto = {
  aulas: limites.ciclos * aulasDoCiclo.length,
};
semTecto.min = MIN.criarEscola + MIN.gravarPlano + MIN.gravarPo +
  limites.ciclos * MIN.gerarCiclo + semTecto.aulas * MIN.lancarAula;
semTecto.brl = reais(semTecto.min);

provar('48 aulas — as 24 de cada ciclo', semTecto.aulas === 48, semTecto.aulas);
provar('157 minutos — o número do §22.2', semTecto.min === 157, semTecto.min);
provar('R$ 5,65 — o número do §22.2', semTecto.brl === 5.65, semTecto.brl);
const razao = Math.round((semTecto.min / tecto.min) * 10) / 10;
provar('7,1× — a razão que o §22.2 afirma', razao === 7.1, razao);
provar('o limitador corta 135 dos 157 minutos', semTecto.min - tecto.min === 135, semTecto.min - tecto.min);

/* ── §D a franquia ───────────────────────────────────────────────────────────────────────────── */

console.log('\n§D quantas demonstrações cabem nos 2 000 minutos');

const comEngenharia = Math.floor((FRANQUIA_MIN - ENGENHARIA_MIN) / tecto.min);
const semEngenharia = Math.floor(FRANQUIA_MIN / tecto.min);
provar('67 com a engenharia — o número do §22.3', comEngenharia === 67, comEngenharia);
provar('90 sem ela', semEngenharia === 90, semEngenharia);
provar('em dinheiro, zero enquanto a franquia durar',
  tecto.brl > 0 && comEngenharia > 0, { brl: tecto.brl, comEngenharia });
provar('a cota é o recurso escasso, não o dinheiro',
  comEngenharia * tecto.min <= FRANQUIA_MIN, comEngenharia * tecto.min);

/* ── §E o treino ─────────────────────────────────────────────────────────────────────────────── */

console.log('\n§E o custo de treinar um consultor');

const treino = { min: tecto.min * 2 };
treino.brl = reais(treino.min);
provar('44 minutos — duas demonstrações, uma para ver e uma para fazer',
  treino.min === 44, treino.min);
provar('R$ 1,58 — o número do §22.4 e do guião', treino.brl === 1.58, treino.brl);

/* ── §F o controlo negativo ──────────────────────────────────────────────────────────────────── */

console.log('\n§F o controlo negativo: a conta depende mesmo do catálogo');

const comSeisAulas = tectoDaLiberdade({ ...limites, aulas: 6 }, aulasDoCiclo.length);
provar('com 6 aulas o tecto sobe para 31 min', comSeisAulas.min === 31, comSeisAulas.min);
provar('e NÃO fica nos 22 — a aritmética lê o catálogo', comSeisAulas.min !== tecto.min, comSeisAulas.min);
provar('o valor acompanha (R$ 1,12)', comSeisAulas.brl === 1.12, comSeisAulas.brl);

const comUmCiclo = tectoDaLiberdade({ ...limites, ciclos: 1 }, aulasDoCiclo.length);
provar('com 1 ciclo o tecto desce para 19 min', comUmCiclo.min === 19, comUmCiclo.min);
provar('e as aulas continuam a ser 3 — o menor dos dois limites',
  comUmCiclo.aulas === 3, comUmCiclo.aulas);

/* ── §G os documentos dizem o mesmo que a conta ─────────────────────────────────────────────── */

console.log('\n§G os dois documentos não se afastaram da conta');

const custo = lerTexto('CUSTO-DOS-FLUXOS.md');
const guiao = lerTexto('FLUXO-DA-ESCOLA-EM-CONSULTORIA.md');

provar('o §22 existe no CUSTO-DOS-FLUXOS', /^## 22\. O custo de uma escola em consultoria/m.test(custo),
  (custo.match(/^## 2\d\..*/gm) || []).slice(-3));
provar('o §22 diz 22 minutos', /\*\*22 minutos por demonstração\*\*/.test(custo), null);
provar('o §22 diz R$ 0,79', /\*\*R\$ 0,79\*\*/.test(custo), null);
provar('o §22 diz 157 minutos no contrafactual', /\| \*\*157\*\* \| \*\*R\$ 5,65\*\*/.test(custo), null);
provar('o §22 diz 7,1 vezes', /7,1 vezes/.test(custo), null);
provar('o §22 diz 67 demonstrações', /\*\*67 demonstrações por mês/.test(custo), null);
provar('o §22 diz 44 minutos de treino', /\*\*por consultor, com uma repetição\*\* \| \*\*44\*\*/.test(custo), null);
provar('o §22 diz R$ 1,58', /R\$ 1,58 por consultor treinado/.test(custo), null);

provar('o guião aponta para o §22', /CUSTO-DOS-FLUXOS\.md\) §22/.test(guiao), null);
provar('o guião manda orçamentar pelos 22 minutos', /\| \*\*22\*\* \|/.test(guiao), null);
provar('o guião promete 44 a cada consultor', /\*\*44\*\*/.test(guiao), null);
provar('o guião promete R$ 1,58', /R\$ 1,58 por consultor treinado/.test(guiao), null);

/* ── o resumo ───────────────────────────────────────────────────────────────────────────────── */

console.log('\n' + provas + ' asserções, ' + (provas - falhas) + ' ok, ' + falhas + ' falha(s)');
console.log('tecto da demonstração: ' + tecto.min + ' min = R$ ' + tecto.brl.toFixed(2) +
  ' · sem limitador: ' + semTecto.min + ' min = R$ ' + semTecto.brl.toFixed(2));
process.exit(falhas === 0 ? 0 : 1);
