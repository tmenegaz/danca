#!/usr/bin/env node
'use strict';

/*
 * provar-a-ocupacao.js — dois corpos não ocupam o mesmo lugar à mesma hora (25/11/2026).
 *
 * O QUE ELA PEDIU, e a regra que estava no código a negá-lo:
 *
 *   «A gente tem ciclos diferentes também e que podem estar no mesmo período de tempo, mas não pode
 *   ter essa colisão. O que vai separar se todos ocupam a sala às 2:00 da tarde, o que diferencia é o
 *   dia da semana. Se todos ocupam a sala nas segundas e quartas, o que diferencia é o horário.»
 *
 * O código dizia «uma sala recebe UMA Turma por vez», e MEDIDO: duas curadorias na mesma sala a 14h e
 * a 16h recebiam 409, com a frase «duas aulas no mesmo horário» sobre duas aulas que não são.
 *
 * O QUE ESTA PROVA AFIRMA:
 *
 *   A. A SOBREPOSIÇÃO É MEIO-ABERTA — e os cinco casos que a decidem: encadeadas (14–15 e 15–16) NÃO
 *      colidem; 14–15:30 e 15–16 SIM; dias diferentes NÃO; um dia em comum SIM; 14–15 e 14:30–15 SIM.
 *   B. O PERÍODO É A QUARTA DIMENSÃO — a mesma sala, os mesmos dias e horas, com períodos que não se
 *      tocam, NÃO colidem: é a sucessão normal de uma sala. E um período em falta conta como «toca».
 *   C. OS TRÊS RECURSOS — sala, professor e elenco — e cada um sozinho decide.
 *   D. A DECISÃO DELA SOBRE O ELENCO (25/11/2026): a mesma aluna em duas Turmas da MESMA modalidade é
 *      permitida, desde que não colidam. É o que a regra antiga proibia.
 *   E. A TURMA SEM HORA É RECUSADA — a decisão dela, e não a minha recomendação: não se salta a
 *      verificação, obriga-se o dado a ficar completo, e a mensagem nomeia os dias.
 *   F. O QUE NÃO ESTÁ EM VIGOR NÃO OCUPA — a substituída e a encerrada.
 *   G. A MENSAGEM DIZ O RECURSO, O DIA E AS DUAS HORAS — e o caminho para resolver.
 *   H. OS CONTROLES NEGATIVOS: sem recursos em comum, nada; sem sobreposição, nada; e a leitura que
 *      falha devolve `null` e não «tudo ocupado».
 *
 *   node experimentos/provar-a-ocupacao.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const O = require(path.join(RAIZ, 'motor/nucleo/ocupacao.js'));

let ok = 0;
let ko = 0;
function conferir(titulo, condicao, dado) {
  if (condicao) { ok += 1; console.log('  ok    ' + titulo); return; }
  ko += 1;
  console.log('  FALHA ' + titulo + (dado === undefined ? '' : '  → ' + JSON.stringify(dado)));
}

/** Uma ocupação pronta — o que `ocupacaoDaCuradoria` devolve, sem passar pelas Salas. */
function ocupa({ id = 'x', rotulo = null, salas = [], professor = null, alunas = [],
  dias = ['segunda'], de = '14:00', ate = '15:00', periodo = null } = {}) {
  const inicio = O.minutosDe(de);
  const fim = O.minutosDe(ate);
  return {
    id, rotulo, salas, professor, alunas, periodo,
    intervalos: (dias || []).map((d) => ({ dia: d, inicio, fim, inicioTexto: de, fimTexto: ate })),
  };
}

/* A SALA REAL, como o cadastro a grava (`bastidores.js:3636-3656`). */
const SALAS = {
  'Estúdio 1': {
    nome: 'Estúdio 1', dias: ['segunda', 'quarta'],
    horarios: { segunda: '14:00', quarta: '14:00' }, duracaoMin: 60,
    periodoInicio: '2026-08-01', periodoFim: '2026-12-15', modalidade: 'Balé Clássico',
  },
};

console.log('A ocupação — 25/11/2026\n');

/* ── A. A sobreposição é meio-aberta ─────────────────────────────────────── */
console.log('A. A SOBREPOSIÇÃO — os cinco casos que a decidem');
{
  const caso = (t, a, b, esperado) => {
    const n = O.conflitosEntre(ocupa(a), ocupa(b)).length > 0;
    conferir(t, n === esperado, { colidiu: n, esperado });
  };
  /* O CASO QUE MAIS IMPORTA: duas aulas encadeadas na mesma sala. Um intervalo FECHADO diria que
   * colidem, e a escola não conseguiria ter a aula das 14h e a das 15h na mesma sala — que é o caso
   * normal de uma sala de ballet. */
  caso('14:00–15:00 e 15:00–16:00 NÃO colidem (encadeadas)', { salas: ['E1'] }, { salas: ['E1'], de: '15:00', ate: '16:00' }, false);
  caso('14:00–15:30 e 15:00–16:00 colidem (15:00–15:30 é de ambas)',
    { salas: ['E1'], ate: '15:30' }, { salas: ['E1'], de: '15:00', ate: '16:00' }, true);
  caso('segundas 14:00 e terças 14:00 NÃO colidem (dias diferentes)',
    { salas: ['E1'] }, { salas: ['E1'], dias: ['terca'] }, false);
  caso('segundas e quartas contra só quartas COLIDEM (a quarta é comum)',
    { salas: ['E1'], dias: ['segunda', 'quarta'] }, { salas: ['E1'], dias: ['quarta'] }, true);
  caso('14:00–15:00 e 14:30–15:00 colidem (o início cai dentro)',
    { salas: ['E1'] }, { salas: ['E1'], de: '14:30', ate: '15:00' }, true);
  /* E o caso dela, à letra: a mesma sala, o mesmo dia, horas diferentes. */
  caso('O CASO DELA: 14h e 16h na mesma sala, no mesmo dia → NÃO colidem',
    { salas: ['Estúdio 1'] }, { salas: ['Estúdio 1'], de: '16:00', ate: '17:00' }, false);
}

/* ── B. O período é a quarta dimensão ────────────────────────────────────── */
console.log('\nB. O PERÍODO — a sucessão normal de uma sala');
{
  const a = ocupa({ salas: ['E1'], periodo: { inicio: '2026-02-01', fim: '2026-06-30' } });
  const b = ocupa({ salas: ['E1'], periodo: { inicio: '2026-08-01', fim: '2026-12-15' } });
  conferir('mesma sala, mesmo dia e hora, períodos que NÃO se tocam → não colidem',
    O.conflitosEntre(a, b).length === 0);
  const c = ocupa({ salas: ['E1'], periodo: { inicio: '2026-06-30', fim: '2026-12-15' } });
  conferir('períodos que se tocam num dia (30/06) → colidem', O.conflitosEntre(a, c).length > 0);
  /* Um período em falta é «não se sabe», e nessa dúvida compara-se como se tocassem. */
  const d = ocupa({ salas: ['E1'] });
  conferir('um período em falta conta como «toca» (o lado conservador)',
    O.conflitosEntre(a, d).length > 0);
  conferir('períodos em texto inválido também contam como «toca»',
    O.periodosTocamSe({ inicio: 'Junho', fim: '2026-12-15' }, { inicio: '2026-02-01', fim: '2026-06-30' }) === true);
}

/* ── C. Os três recursos ─────────────────────────────────────────────────── */
console.log('\nC. OS TRÊS RECURSOS — e cada um sozinho decide');
{
  const base = { salas: ['Estúdio 1'], professor: 'demi-plie', alunas: ['Aluna A'] };
  const igual = (b) => O.conflitosEntre(ocupa(base), ocupa(b));

  const porSala = igual({ salas: ['Estúdio 1'], professor: 'outro', alunas: ['Aluna Z'] });
  conferir('a SALA sozinha decide: mesmo lugar, sem professor nem aluna em comum',
    porSala.length > 0 && porSala.every((c) => c.recurso === 'sala'), porSala.map((c) => c.recurso));

  const porProf = igual({ salas: ['Estúdio 2'], professor: 'demi-plie', alunas: ['Aluna Z'] });
  conferir('o PROFESSOR sozinho decide: salas diferentes, mesma pessoa',
    porProf.length > 0 && porProf.every((c) => c.recurso === 'professor'), porProf.map((c) => c.recurso));

  const porAluna = igual({ salas: ['Estúdio 2'], professor: 'outro', alunas: ['Aluna A'] });
  conferir('o ELENCO sozinho decide: salas e professores diferentes, a mesma aluna',
    porAluna.length > 0 && porAluna.every((c) => c.recurso === 'elenco'), porAluna.map((c) => c.recurso));

  /* E os três de uma vez: três conflitos, um por recurso. Um só diria «resolvi» a quem mudasse
   * apenas um deles. */
  const tres = igual({ salas: ['Estúdio 1'], professor: 'demi-plie', alunas: ['Aluna A'] });
  const tipos = new Set(tres.map((c) => c.recurso));
  conferir('com os três em comum, os três são nomeados', tipos.size === 3, [...tipos]);
  /* O PROFESSOR DA SALA TAMBÉM É QUEM DÁ A AULA (25/11/2026). A professora disse-o por extenso —
   * «o professor também não pode estar em duas salas ao mesmo tempo» —, e a Sala declara um
   * professor (`bastidores.js:3636-3656`).
   *
   * O CASO QUE O MEDE é o da substituição: a curadoria declara QUEM A SUBSTITUI, e a Sala declara o
   * docente dela. Sem a união, o docente da sala não estaria em `professores`, e ele estaria em duas
   * salas ao mesmo tempo sem ninguém dar por isso. */
  const salasDoCaso = {
    'E1': { nome: 'E1', dias: ['segunda'], horarios: { segunda: '14:00' }, duracaoMin: 60, professor: 'demi-plie' },
    'E2': { nome: 'E2', dias: ['segunda'], horarios: { segunda: '14:00' }, duracaoMin: 60 },
  };
  /* A curadoria de E1 declara o substituto; quem dá a aula em E1 é o `demi-plie`, que só a Sala diz. */
  const cA = O.ocupacaoDaCuradoria({ id: 'a', turmas: ['E1'], professor: 'quem-substitui' }, { salasPorNome: salasDoCaso });
  /* A de E2 é do `demi-plie` — mesma hora, sala diferente. */
  const cB = O.ocupacaoDaCuradoria({ id: 'b', turmas: ['E2'], professor: 'demi-plie' }, { salasPorNome: salasDoCaso });
  conferir('a união traz o professor da SALA, e não só o da curadoria',
    cA.professores.indexOf('demi-plie') !== -1, cA.professores);
  conferir('…e por isso o mesmo docente em duas salas à mesma hora é RECUSADO',
    O.conflitosEntre(cA, cB).some((c) => c.recurso === 'professor'),
    O.conflitosEntre(cA, cB).map((c) => c.recurso));
  /* O controlo que dá sentido aos dois: a mesma Sala E1, mas com o `demi-plie` declarado na
   * curadoria em vez de descoberto na Sala — o resultado tem de ser o mesmo. Se este divergisse, a
   * união estaria a inventar professores. */
  const cAdeclarado = O.ocupacaoDaCuradoria({ id: 'a', turmas: ['E1'], professor: 'demi-plie' }, { salasPorNome: salasDoCaso });
  conferir('…e declará-lo na curadoria, em vez de o descobrir na Sala, dá o mesmo conflito',
    O.conflitosEntre(cAdeclarado, cB).filter((c) => c.recurso === 'professor').length
      === O.conflitosEntre(cA, cB).filter((c) => c.recurso === 'professor').length);

  /* E um por DIA: dois dias em comum são dois conflitos por recurso. */
  const doisDias = O.conflitosEntre(
    ocupa({ salas: ['E1'], dias: ['segunda', 'quarta'] }),
    ocupa({ salas: ['E1'], dias: ['segunda', 'quarta'] }));
  conferir('dois dias em comum são dois conflitos, e não um', doisDias.length === 2, doisDias.length);
}

/* ── D. A decisão dela sobre o elenco ────────────────────────────────────── */
console.log('\nD. O ELENCO — a mesma aluna em duas Turmas da mesma modalidade');
{
  /* A regra ANTIGA (`alunasComprometidas`) recusava isto: mesma modalidade, sem olhar horas. A
   * decisão dela a 25/11/2026 é que pode, desde que não colidam — e é a letra da frase: «ele pode até
   * estar fazendo aula na mesma modalidade no mesmo dia, mas são horários diferentes». */
  const a = ocupa({ salas: ['Estúdio 1'], professor: 'p1', alunas: ['Aluna A'], de: '14:00', ate: '15:00' });
  const b = ocupa({ salas: ['Estúdio 2'], professor: 'p2', alunas: ['Aluna A'], de: '16:00', ate: '17:00' });
  conferir('mesma aluna, mesma modalidade, HORÁRIOS diferentes → permitido', O.conflitosEntre(a, b).length === 0);
  const c = ocupa({ salas: ['Estúdio 2'], professor: 'p2', alunas: ['Aluna A'], de: '14:30', ate: '15:30' });
  conferir('mesma aluna, horários SOBREPOSTOS → recusado (elenco)',
    O.conflitosEntre(a, c).some((x) => x.recurso === 'elenco'));
  const d = ocupa({ salas: ['Estúdio 2'], professor: 'p2', alunas: ['Aluna A'], dias: ['terca'] });
  conferir('mesma aluna, mesmo horário, DIA diferente → permitido', O.conflitosEntre(a, d).length === 0);
  const e = ocupa({ salas: ['Estúdio 1'], professor: 'p1', alunas: ['Aluna A'], de: '16:00', ate: '17:00' });
  conferir('mesma aluna, mesma SALA e mesmo professor, hora diferente → permitido',
    O.conflitosEntre(a, e).length === 0);
}

/* ── E. A turma sem hora é recusada ─────────────────────────────────────── */
console.log('\nE. A TURMA SEM HORA — a decisão dela é RECUSAR, e não saltar');
{
  conferir('uma turma com todos os dias e horas não tem dias em falta',
    O.diasSemHora({ dias: ['segunda', 'quarta'], horarios: { segunda: '14:00', quarta: '09:00' } }).length === 0);
  conferir('uma turma sem hora num dia nomeia ESSE dia',
    JSON.stringify(O.diasSemHora({ dias: ['segunda', 'quarta'], horarios: { segunda: '14:00' } })) === '["quarta"]',
    O.diasSemHora({ dias: ['segunda', 'quarta'], horarios: { segunda: '14:00' } }));
  conferir('uma turma sem `horarios` nomeia todos os dias',
    O.diasSemHora({ dias: ['segunda', 'quarta'] }).length === 2);
  conferir('uma hora em formato inválido conta como em falta',
    O.diasSemHora({ dias: ['segunda'], horarios: { segunda: '25:00' } }).length === 1);
  /* E a consequência na resolução: a Sala com um dia sem hora não é conferível. */
  conferir('uma Sala com um dia sem hora devolve `null` — e não uma lista vazia',
    O.intervalosDaSala({ dias: ['segunda', 'quarta'], horarios: { segunda: '14:00' }, duracaoMin: 60 }) === null);
  conferir('uma Sala sem duração devolve `null`',
    O.intervalosDaSala({ dias: ['segunda'], horarios: { segunda: '14:00' } }) === null);
  conferir('e uma Sala completa devolve um intervalo por dia',
    (O.intervalosDaSala(SALAS['Estúdio 1']) || []).length === 2);
}

/* ── F. O que não está em vigor não ocupa ───────────────────────────────── */
console.log('\nF. O QUE NÃO ESTÁ EM VIGOR NÃO OCUPA');
{
  const minha = { id: 'c2', turmas: ['Estúdio 1'], professor: 'p2', alunas: [] };
  const substituida = { id: 'c1', turmas: ['Estúdio 1'], professor: 'p1', substituidaPor: 'c9' };
  const encerrada = { id: 'c3', turmas: ['Estúdio 1'], professor: 'p3', encerrada_em: '2026-11-01' };
  conferir('a substituída não colide',
    (O.conflitosDaCuradoria({ curadoria: minha, outras: [substituida], salasPorNome: SALAS }) || []).length === 0);
  conferir('a encerrada não colide', (O.conflitosDaCuradoria({ curadoria: minha, outras: [encerrada], salasPorNome: SALAS }) || []).length === 0);
  const viva = { id: 'c4', turmas: ['Estúdio 1'], professor: 'p4' };
  conferir('e a VIVA colide — o controlo', (O.conflitosDaCuradoria({ curadoria: minha, outras: [viva], salasPorNome: SALAS }) || []).length > 0);
  /* E ela não colide consigo mesma, ao ser editada. */
  /* A exclusão é IMPLÍCITA pelo id — quem edita não passa `excetoId`, e a lista que lê inclui-se. */
  conferir('a própria curadoria não colide consigo, SEM `excetoId`', (O.conflitosDaCuradoria({
    curadoria: minha, outras: [minha], salasPorNome: SALAS,
  }) || []).length === 0);
  /* E na DERIVAÇÃO são dois ids — o da versão nova e o da anterior —, e é `excetoId` que exclui a
   * anterior: a versão nova SUCEDE-a, e colidir com ela impediria toda a derivação. */
  conferir('na derivação, `excetoId` exclui a versão anterior, que é substituída',
    (O.conflitosDaCuradoria({
      curadoria: { id: 'nova', turmas: ['Estúdio 1'], professor: 'p2' },
      outras: [{ id: 'velha', turmas: ['Estúdio 1'], professor: 'p1' }],
      salasPorNome: SALAS, excetoId: 'velha',
    }) || []).length === 0);
}

/* ── G. A mensagem ──────────────────────────────────────────────────────── */
console.log('\nG. A MENSAGEM — o recurso, o dia e as duas horas');
{
  const a = ocupa({ id: 'c1', rotulo: 'Balé 1', salas: ['Estúdio 1'], de: '14:00', ate: '15:00' });
  const b = ocupa({ id: 'c2', rotulo: 'Balé 2', salas: ['Estúdio 1'], de: '14:30', ate: '15:30' });
  const c = O.conflitosEntre(a, b)[0];
  const frase = O.motivoDoConflito(c, { rotulo: 'Balé 1' });
  conferir('nomeia o recurso («sala»)', /sala «Estúdio 1»/.test(frase), frase);
  conferir('nomeia o dia', /segunda/.test(frase));
  conferir('e as DUAS horas', /14:00–15:00/.test(frase) && /14:30–15:30/.test(frase), frase);
  conferir('nomeia quem ocupa', /Balé 2/.test(frase));
  /* E o caminho — a recusa que não diz o que fazer é uma parede. */
  conferir('e diz o que se pode fazer', /Mude a hora ou o dia/.test(frase));

  const prof = O.motivoDoConflito({ recurso: 'professor', nome: 'demi-plie', de: '14:00', ate: '15:00',
    dia: 'segunda', outroDe: '14:00', outroAte: '15:00', comRotulo: 'Jazz' }, { rotulo: 'Balé 1' });
  conferir('a do professor não sugere «outro professor» — não há', /Um professor não está em duas Turmas/.test(prof), prof);
  const al = O.motivoDoConflito({ recurso: 'elenco', nome: 'Aluna A', de: '14:00', ate: '15:00',
    dia: 'segunda', outroDe: '14:00', outroAte: '15:00', comRotulo: 'Jazz' }, { rotulo: 'Balé 1' });
  conferir('a do elenco diz que ela PODE estar nas duas, só não naquele horário',
    /pode estar nas duas Turmas/.test(al), al);
}

/* ── H. Os controlos negativos ──────────────────────────────────────────── */
console.log('\nH. OS CONTROLES NEGATIVOS');
{
  conferir('sem recurso em comum, não há conflito — mesmo com tudo o resto igual',
    O.conflitosEntre(ocupa({ salas: ['E1'], professor: 'p1', alunas: ['A'] }),
      ocupa({ salas: ['E2'], professor: 'p2', alunas: ['B'] })).length === 0);
  conferir('com os três recursos em comum mas sem sobreposição de horas, não há conflito',
    O.conflitosEntre(ocupa({ salas: ['E1'], professor: 'p1', alunas: ['A'] }),
      ocupa({ salas: ['E1'], professor: 'p1', alunas: ['A'], de: '16:00', ate: '17:00' })).length === 0);
  /* A LEITURA QUE FALHA DEVOLVE `null`, E NÃO «TUDO OCUPADO». Recusar um acto legítimo por um erro
   * de leitura é pior do que deixar passar uma ocupação que a tela mostra — é a disciplina que o
   * `salasOcupadas` já tinha, e que se mantém. */
  conferir('sem o mapa das Salas, devolve `null` (não se inventa colisão)',
    O.conflitosDaCuradoria({ curadoria: {}, outras: [], salasPorNome: null }) === null);
  conferir('sem a lista das outras, devolve `null`',
    O.conflitosDaCuradoria({ curadoria: {}, outras: null, salasPorNome: SALAS }) === null);
  conferir('e sem nenhuma outra, a lista é vazia — não é `null`',
    JSON.stringify(O.conflitosDaCuradoria({ curadoria: { id: 'c1', turmas: ['Estúdio 1'] }, outras: [], salasPorNome: SALAS })) === '[]');
  /* As horas, na fronteira. */
  conferir('`minutosDe` recusa o que não é hora', O.minutosDe('24:00') === null && O.minutosDe('9:00') === null);
  conferir('`minutosDe` aceita 00:00 e 23:59', O.minutosDe('00:00') === 0 && O.minutosDe('23:59') === 1439);
  conferir('e `horaDe` faz o caminho de volta', O.horaDe(870) === '14:30' && O.horaDe(0) === '00:00');
}

console.log('\n' + ok + '/' + (ok + ko) + ' · ' + (ko ? ko + ' falha(s)' : 'sem falhas'));
process.exit(ko ? 1 : 0);
