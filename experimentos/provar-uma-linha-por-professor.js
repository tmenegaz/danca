#!/usr/bin/env node
'use strict';

/*
 * provar-uma-linha-por-professor.js — A LISTAGEM NÃO É A PROVENIÊNCIA (13/11/2026).
 *
 * O RELATO DELA, e é o defeito que esta prova fecha:
 *
 *   «os planos antigos, eles continuam sobre o guarda-chuva do plano vigente […] o plano antigo, que
 *   foi que deu origem a essa derivação, ele não precisa aparecer, porque esse controle de
 *   proveniência é nosso para a gente usar futuramente […] a gente tem que mostrar na listagem dois
 *   planos mesmo, que é o do pé torto e o da redinha, que estão se alternando. Mas os históricos, a
 *   proveniência deles […] eles não precisam aparecer na listagem.»
 *
 * E, quando perguntada sobre a cadeia que muda de nome de turma no meio (Rosa → Piano), ela
 * escolheu: **duas linhas**, «só o mais recente de cada professor, na cadeia inteira» — porque a
 * cadeia é a identidade do documento, e a turma é um atributo que mudou.
 *
 * O DEFEITO, MEDIDO ANTES DE MEXER, no acervo do `calango`: uma cadeia de plano com **18 elos**,
 * alternando Pé Torto ↔ Redinha Rosa, aparecia como **5 linhas** na turma `Piano` (e o PO, igual —
 * 20 elos, 6 linhas). Três delas eram linhas **órfãs**: não escondidas por um sucessor (o sucessor
 * é de outro autor, e a regra de 12/11 impede-o) e sem histórico próprio.
 *
 * O QUE SE MEDE AQUI:
 *
 *   A. A ALTERNÂNCIA — 6 elos, dois autores → **2 linhas**, e são os mais recentes de cada um.
 *   B. O HISTÓRICO não se perde: cada linha conta os elos que a antecedem, e a soma fecha com o
 *      acervo (vigentes + histórico = total). É a proveniência que ela quer guardar.
 *   C. A CADEIA QUE MUDOU DE TURMA não parte em duas linhas — o grupo é a raiz, não o nome.
 *   D. DUAS CADEIAS INDEPENDENTES do mesmo professor **não** se colapsam: são dois documentos.
 *   E. A CADEIA SEM ALTERNÂNCIA não regride: um autor, 3 elos → 1 linha, 2 anteriores.
 *   F. A ANAMENSE não é tocada: a regra é das famílias que se agrupam pela cadeia.
 *   G. O CONTROLO NEGATIVO: a mesma cadeia pela regra **antiga** (chave de contexto nula, que é o
 *      caminho de quem não está em `FAMILIAS_POR_CADEIA`) devolve as 6 linhas — e se devolvesse 2, a
 *      prova não estaria a medir nada.
 *
 * Uso:
 *   node experimentos/provar-uma-linha-por-professor.js
 */

const path = require('path');
const porta = require(path.join(__dirname, '..', 'motor', 'nucleo', 'porta.js'));

let passes = 0;
let failures = 0;
function ok(msg) { passes += 1; console.log('  ok    ' + msg); }
function fail(msg) { failures += 1; console.error('  FALHA ' + msg); }
function igual(rotulo, obtido, esperado) {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  if (a === b) ok(rotulo + ' → ' + a);
  else fail(rotulo + ' → esperado ' + b + ', obtido ' + a);
}
function verdade(rotulo, condicao) {
  if (condicao) ok(rotulo);
  else fail(rotulo);
}

/* ------------------------------------------------------------------ o registo de mentira */

const T = (h, m) => '2026-11-' + String(h).padStart(2, '0') + 'T' + String(m).padStart(2, '0');

/** Um elo de plano. `id` é o carimbo; `de` é o pai; `prof` é o autor. */
function elo(id, prof, de, geradoEm, turma) {
  return {
    id: 'plano-' + id,
    fonte: 'plano',
    escola: 'calango',
    professor: prof,
    ciclo: '01',
    turma: turma || 'Piano',
    gerado_em: geradoEm,
    ...(de ? { ajuste_de: 'plano-' + de } : {}),
  };
}

const PE = 'pe-torto';
const RED = 'redinha-rosa';

/* A. e B. — a cadeia do relato: Pé Torto, Redinha, Pé Torto, Redinha, Pé Torto, Redinha. */
const ALTERNANDO = [
  elo('20261111-0809', PE, null, T(11, 8)),
  elo('20261111-0858', RED, '20261111-0809', T(11, 9)),
  elo('20261111-1016', PE, '20261111-0858', T(11, 10)),
  elo('20261111-1527', RED, '20261111-1016', T(11, 11)),
  elo('20261112-0837', PE, '20261111-1527', T(12, 8)),
  elo('20261212-1450', RED, '20261112-0837', T(12, 14)),
];

/* C. — a mesma cadeia, com o nome da turma a mudar no meio (foi o que aconteceu no `calango`). */
const COM_RENOMEACAO = ALTERNANDO.map((r, i) => Object.assign({}, r, { turma: i < 2 ? 'Rosa' : 'Piano' }));

/* D. — duas cadeias independentes, do mesmo professor. */
const DUAS_CADEIAS = [
  elo('a1', PE, null, T(11, 8), 'Piano'),
  elo('a2', PE, 'a1', T(11, 9), 'Piano'),
  elo('b1', PE, null, T(11, 8), 'Rosa'),
  elo('b2', PE, 'b1', T(11, 9), 'Rosa'),
];

/* E. — a cadeia sem alternância. */
const UM_AUTOR = [
  elo('x1', PE, null, T(11, 8)),
  elo('x2', PE, 'x1', T(11, 9)),
  elo('x3', PE, 'x2', T(11, 10)),
];

/* F. — a anamnese, que não se agrupa pela cadeia. */
const ANAMNESES = [
  { id: 'anamnese-1', fonte: 'anamnese', escola: 'calango', aluna: 'Aluna A', gerado_em: T(11, 8) },
  { id: 'anamnese-2', fonte: 'anamnese', escola: 'calango', aluna: 'Aluna A', gerado_em: T(11, 9) },
];

/* ------------------------------------------------------------------------------ as asserções */

console.log('\n§A — a alternância rende DUAS linhas, e são as mais recentes de cada professor');
{
  const r = porta.vigentesDaFamilia(ALTERNANDO, 'plano');
  igual('linhas na listagem', r.vigentes.length, 2);
  const ids = r.vigentes.map((v) => v.id).sort();
  igual('os dois vigentes', ids, ['plano-20261112-0837', 'plano-20261212-1450']);
  const porProf = Object.fromEntries(r.vigentes.map((v) => [v.professor, v.id]));
  igual('o mais recente do Pé Torto', porProf[PE], 'plano-20261112-0837');
  igual('o mais recente da Redinha', porProf[RED], 'plano-20261212-1450');
}

console.log('\n§B — o histórico não se perde, e a soma fecha com o acervo');
{
  const r = porta.vigentesDaFamilia(ALTERNANDO, 'plano');
  const historico = [...r.historico.values()].reduce((n, ids) => n + ids.length, 0);
  igual('elos em histórico', historico, ALTERNANDO.length - r.vigentes.length);
  igual('vigentes + histórico = acervo', r.vigentes.length + historico, ALTERNANDO.length);
  const daRedinha = (r.historico.get('plano-20261212-1450') || []).sort();
  igual('a Redinha guarda os elos dela', daRedinha, ['plano-20261111-0858', 'plano-20261111-1527']);
  const doPe = (r.historico.get('plano-20261112-0837') || []).sort();
  igual('o Pé Torto guarda os dele', doPe, ['plano-20261111-0809', 'plano-20261111-1016']);
}

console.log('\n§C — a cadeia que mudou de nome de turma NÃO parte em duas linhas');
{
  const r = porta.vigentesDaFamilia(COM_RENOMEACAO, 'plano');
  igual('linhas, com «Rosa» nos primeiros elos', r.vigentes.length, 2);
  const turmas = r.vigentes.map((v) => v.turma);
  verdade('a linha que fica é a da turma de hoje («Piano»), e não a antiga («Rosa»)',
    turmas.every((t) => t === 'Piano'));
}

console.log('\n§D — duas cadeias independentes do mesmo professor continuam a ser dois documentos');
{
  const r = porta.vigentesDaFamilia(DUAS_CADEIAS, 'plano');
  igual('linhas', r.vigentes.length, 2);
  const turmas = r.vigentes.map((v) => v.turma).sort();
  igual('uma por turma', turmas, ['Piano', 'Rosa']);
}

console.log('\n§E — a cadeia sem alternância não regride');
{
  const r = porta.vigentesDaFamilia(UM_AUTOR, 'plano');
  igual('linhas', r.vigentes.length, 1);
  igual('a mais recente', r.vigentes[0].id, 'plano-x3');
  igual('versões anteriores', (r.historico.get('plano-x3') || []).length, 2);
}

console.log('\n§F — a anamnese não é tocada pela regra das cadeias');
{
  const r = porta.vigentesDaFamilia(ANAMNESES, 'anamnese');
  /* A anamnese fecha por (aluna, escola) — a mesma aluna, um retrato por data —, e isso não muda. */
  igual('linhas para a mesma aluna', r.vigentes.length, 1);
  igual('o mais recente', r.vigentes[0].id, 'anamnese-2');
}

console.log('\n§G — CONTROLO NEGATIVO: a mesma cadeia pela regra anterior dá as 6 linhas');
{
  /* Quem não está em `FAMILIAS_POR_CADEIA` usa `chaveDoContexto` — e um nome de família que não está
   * no mapa de contexto devolve `null`, que é EXACTAMENTE o comportamento antigo do plano. Se este
   * número fosse 2, a asserção do §A não estaria a medir a regra nova. */
  const antiga = porta.vigentesDaFamilia(ALTERNANDO, 'plano-sem-cadeia');
  igual('linhas pela regra antiga', antiga.vigentes.length, ALTERNANDO.length);
  verdade('e são MAIS do que as duas de hoje', antiga.vigentes.length > 2);
}

console.log('\n§H — o acervo de verdade, se ele estiver à mão');
{
  /* A medição do relato, no `calango`. Se o acervo mudar (ela continua a trabalhar), a asserção
   * não se ajusta sozinha — e é de propósito: um número que segue o dado não prova nada. O que se
   * afirma é a REGRA (2 linhas, uma por professor), e a contagem só é conferida se existirem
   * exatamente os dois autores na mesma cadeia. */
  let resumos = null;
  try {
    const fs = require('fs');
    const p = path.join(__dirname, '..', 'escola', 'calango', 'envelopes', '.indice.json');
    const idx = JSON.parse(fs.readFileSync(p, 'utf8'));
    resumos = Object.entries(idx.resumos || {})
      .map(([nome, r]) => Object.assign({}, r, { id: r.id || nome.replace(/\.json$/, '') }));
  } catch (erro) { resumos = null; }
  if (!resumos) {
    console.log('  aviso  o acervo do `calango` não está nesta árvore — a secção não corre');
  } else {
    const planos = resumos.filter((r) => r.fonte === 'plano');
    const r = porta.vigentesDaFamilia(planos, 'plano');
    const historico = [...r.historico.values()].reduce((n, ids) => n + ids.length, 0);
    console.log('         acervo: ' + planos.length + ' planos → ' + r.vigentes.length
      + ' linhas · ' + historico + ' em proveniência');
    igual('vigentes + histórico = acervo', r.vigentes.length + historico, planos.length);
    const autores = new Set(r.vigentes.map((v) => v.professor));
    verdade('as linhas são uma por autor (nunca duas do mesmo)',
      r.vigentes.length === autores.size);
    /* A PROPRIEDADE QUE IMPORTA: nenhum elo se perde nem se repete. Todo o id do acervo está ou
     * na lista de vigentes ou numa — e só numa — lista de histórico. É isto que garante que «sair
     * da listagem» não é «desaparecer». */
    const contados = r.vigentes.map((v) => String(v.id))
      .concat([...r.historico.values()].flat().map(String));
    const doAcervo = new Set(planos.map((p) => String(p.id)));
    const perdidos = [...doAcervo].filter((id) => !contados.includes(id));
    const repetidos = contados.filter((id, i) => contados.indexOf(id) !== i);
    igual('elos perdidos', perdidos.length, 0);
    igual('elos repetidos', repetidos.length, 0);
  }
}

console.log('\n' + (failures
  ? 'FALHAS — ' + failures + ' de ' + (passes + failures) + ' asserções'
  : 'TUDO CERTO — ' + passes + ' asserções: dentro de cada cadeia fica o elo mais recente de cada '
    + 'professor; o resto é proveniência, contada na linha do vigente.'));
process.exit(failures ? 1 : 0);
