'use strict';

/*
 * provar-plano-da-turma.js — o plano de ensino é de UMA turma, e o total de aulas é conta.
 *
 * A regra (16/10/2026), do teste do PO na `fita`:
 *
 *   1. UMA TURMA POR PLANO. O professor vê todas as turmas que a direção lhe atribuiu; a
 *      que já tem plano aparece BLOQUEADA, com o estado do plano (livre / ligada / derivada)
 *      e o atalho para o ver ou ajustar. Não se marcam duas.
 *   2. O TOTAL DE AULAS É CALCULADO. Antes só saía quando a TURMA trazia o ritmo; agora sai
 *      também quando o professor o declara no plano — e com os dias declarados a conta é a
 *      das aulas que caem nesses dias.
 *   3. A TURMA NÃO NASCE INCOMPLETA, e a curadoria não atribui uma turma sem ritmo.
 *
 *   node experimentos/provar-plano-da-turma.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  \u2713 ' + rotulo); return; }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

function igual(rotulo, obtido, esperado) {
  checar(rotulo, JSON.stringify(obtido) === JSON.stringify(esperado), { obtido, esperado });
}

const ENVELOPE = (id, turma, objetivo) => JSON.stringify({
  id,
  contexto: { escola: 'fita', professor: 'tiago-menegaz', ciclo: '01' },
  respostas: {
    'objetivo-geral': { valor: objetivo || 'Equilíbrio' },
    'contexto-turma': { valor: turma },
  },
});

// ------------------------------------------------------------------ o conteúdo

function oConteudo() {
  console.log('\no conteúdo: a turma é UMA, e o total de aulas é conta');

  const c = JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta/plano/conteudo/plano.json'), 'utf8'));
  let noTurma = null;
  let noTotal = null;
  const anda = (x) => {
    if (Array.isArray(x)) { x.forEach(anda); return; }
    if (!x || typeof x !== 'object') return;
    if (x.id === 'contexto-turma') noTurma = x;
    if (x.id === 'contexto-total-aulas') noTotal = x;
    Object.values(x).forEach(anda);
  };
  anda(c);

  checar('a turma existe no conteúdo', Boolean(noTurma));
  checar('a turma NÃO é múltipla', !noTurma.multipla, noTurma.multipla);
  checar('a turma continua obrigatória', noTurma.obrigatorio === true);
  checar('a turma vem da curadoria', noTurma.daCuradoria === 'turmas');
  checar('a turma usa a lista das turmas da escola',
    noTurma.opcoesDe === '/api/bastidores/turmas', noTurma.opcoesDe);

  checar('o total de aulas continua ligado à turma', noTotal.daTurma === 'totalAulas');
  checar('e o total diz que é CALCULADO',
    /CALCULADO/.test(noTotal.explicacao.preencher), noTotal.explicacao.preencher);
}

// ------------------------------------------------------------------ a conta

/*
 * A CONTA, extraída do fonte da porta (as funções puras). Rodar o arquivo da porta inteiro
 * exigiria o DOM; a conta não depende dele — e é ela que se mede aqui.
 */
function aConta() {
  console.log('\no total de aulas: a conta, com e sem os dias declarados');

  const html = fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8');
  const casado = html.match(/const DIAS_POR_CODIGO[\s\S]*?\nfunction numeroDeAulasDaTurma\(t\) \{[\s\S]*?\n\}/);
  checar('a conta está no fonte da porta', Boolean(casado));
  if (!casado) return;

  const { numeroDeAulas } = new Function(casado[0] + '; return { numeroDeAulas };')();

  // O caso do professor: ter/qui/sex, de 16 a 30 de outubro de 2026.
  const comDias = numeroDeAulas({ inicio: '2026-10-16', fim: '2026-10-30', frequencia: 3, dias: ['ter', 'qui', 'sex'] });
  const semDias = numeroDeAulas({ inicio: '2026-10-16', fim: '2026-10-30', frequencia: 3, dias: [] });
  igual('com os dias, conta as aulas que CAEM neles (ter/qui/sex → 7)', comDias, 7);
  igual('sem os dias, a média do período (3x/semana → 6)', semDias, 6);
  checar('e as duas contas DIFEREM (a prova mede o que diz medir)', comDias !== semDias, { comDias, semDias });

  igual('dois dias por semana', numeroDeAulas({ inicio: '2026-10-16', fim: '2026-10-30', frequencia: 2, dias: ['seg', 'qua'] }), 4);
  igual('um único dia, o próprio dia', numeroDeAulas({ inicio: '2026-10-16', fim: '2026-10-16', frequencia: 1, dias: ['sex'] }), 1);
  igual('sábado e domingo são dias', numeroDeAulas({ inicio: '2026-10-17', fim: '2026-10-18', frequencia: 2, dias: ['sáb', 'dom'] }), 2);

  igual('sem frequência não há conta', numeroDeAulas({ inicio: '2026-10-16', fim: '2026-10-30', frequencia: null, dias: [] }), null);
  igual('sem o início não há conta', numeroDeAulas({ inicio: '', fim: '2026-10-30', frequencia: 2, dias: [] }), null);
  igual('sem o fim não há conta', numeroDeAulas({ inicio: '2026-10-16', fim: '', frequencia: 2, dias: [] }), null);
  igual('fim antes do início não é período', numeroDeAulas({ inicio: '2026-10-30', fim: '2026-10-16', frequencia: 2, dias: [] }), null);
  // Um dia que o calendário não conhece é DESCARTADO (não vira linha nenhuma) — e a conta
  // cai na média, que é o melhor número disponível em vez de nenhum.
  igual('dia desconhecido cai na média', numeroDeAulas({ inicio: '2026-10-16', fim: '2026-10-30', frequencia: 2, dias: ['feriado'] }), 4);
  // O período de um dia com frequência alta nunca dá zero.
  igual('nunca devolve zero', numeroDeAulas({ inicio: '2026-10-18', fim: '2026-10-18', frequencia: 5, dias: ['seg'] }), 1);
}

// ------------------------------------------------------------------ a turma do envelope

function aTurmaDoEnvelope() {
  console.log('\na turma de um plano, lida do envelope');

  igual('lê a turma de uma escolha única',
    porta.turmaDoEnvelope(JSON.parse(ENVELOPE('plano-1', 'Balé Nível 1'))), 'Balé Nível 1');
  // O campo JÁ FOI MÚLTIPLO, e há envelopes assim gravados: a leitura não pode descartá-los,
  // senão a estante diria que a turma está livre quando não está.
  igual('lê a turma de um envelope com lista (formato antigo)',
    porta.turmaDoEnvelope(JSON.parse(ENVELOPE('plano-2', ['Balé Nível 1', 'Balé Nível 2']))), 'Balé Nível 1');
  igual('sem turma, devolve nulo',
    porta.turmaDoEnvelope({ respostas: {} }), null);
  igual('turma em branco é ausência', porta.turmaDoEnvelope(JSON.parse(ENVELOPE('plano-3', '   '))), null);
  igual('sem respostas, devolve nulo', porta.turmaDoEnvelope({}), null);
}

// ------------------------------------------------------------------ a estante do servidor

async function aEstanteDoServidor() {
  console.log('\na estante do servidor: o plano diz de que turma é');

  const armazenamento = criarMemoria({
    'envelope/plano-20261016-1000.json': ENVELOPE('plano-20261016-1000', 'Balé Nível 1'),
    'envelope/plano-20261016-1100.json': ENVELOPE('plano-20261016-1100', 'Balé Nível 2'),
  });

  const lista = await porta.planos(armazenamento);
  igual('a lista de planos traz a turma de cada um',
    lista.map((o) => o.turma).sort(), ['Balé Nível 1', 'Balé Nível 2']);

  const estados = await porta.estadosDosPlanos(armazenamento);
  igual('os estados trazem a turma',
    Object.values(estados).map((o) => o.turma).sort(), ['Balé Nível 1', 'Balé Nível 2']);
  igual('e continuam a trazer o objetivo',
    Object.values(estados).map((o) => o.objetivo).sort(), ['Equilíbrio', 'Equilíbrio']);
}

// ------------------------------------------------------------------ o ritmo obrigatório

function oRitmoObrigatorio() {
  console.log('\no ritmo da turma: não nasce incompleta, e não se atribui incompleta');

  const completa = {
    nome: 'Turma Completa', frequencia: 3, dias: ['ter', 'qui', 'sex'],
    duracaoMin: 55, periodoInicio: '2026-10-16', periodoFim: '2026-12-18',
  };
  igual('a turma completa não tem falta', bastidores.faltaNoRitmoDaTurma(completa), []);

  // Cada campo que falta, um a um — a mensagem tem de dizer QUAL. A FREQUÊNCIA SAIU DA
  // LISTA (18/10/2026): ela é a contagem dos dias, não um campo que se declare. Quem falta
  // são os dias; a frequência é o que eles valem.
  const casos = [
    ['dias', { ...completa, dias: [] }],
    ['duracaoMin', { ...completa, duracaoMin: null }],
    ['periodoInicio', { ...completa, periodoInicio: '' }],
    ['periodoFim', { ...completa, periodoFim: '' }],
  ];
  for (const [campo, t] of casos) {
    const falta = bastidores.faltaNoRitmoDaTurma(t);
    checar('sem ' + campo + ', a turma está incompleta', falta.length === 1, falta);
  }

  const semNada = { nome: 'Vazia' };
  igual('sem nada, os quatro campos faltam', bastidores.faltaNoRitmoDaTurma(semNada).length, 4);
  // A frequência declarada é IGNORADA quando há dias: a turma vale pelos dias marcados.
  equal('frequência zero com dias não é falta (ela é a contagem dos dias)',
    bastidores.faltaNoRitmoDaTurma({ ...completa, frequencia: 0 }).length, 0);

  // A FRASE, para a mensagem sair em português e não em «falta o os dias».
  igual('a frase de uma falta',
    bastidores.fraseDaFalta(['a frequência semanal']), 'a frequência semanal');
  igual('a frase de duas faltas',
    bastidores.fraseDaFalta(['a frequência semanal', 'os dias da semana']),
    'a frequência semanal e os dias da semana');
  igual('a frase de três faltas',
    bastidores.fraseDaFalta(['a frequência semanal', 'os dias da semana', 'a duração de cada aula']),
    'a frequência semanal, os dias da semana e a duração de cada aula');
  igual('sem falta, a frase é vazia', bastidores.fraseDaFalta([]), '');

  // O texto do aviso não pode sair «falta o os dias».
  const frase = bastidores.fraseDaFalta(bastidores.faltaNoRitmoDaTurma({ nome: 'X', frequencia: 2 }));
  checar('a frase não repete artigo', !/\bo (a |o |os |as )/.test(frase), frase);
  checar('a frase diz os quatro campos quando nada foi declarado',
    bastidores.fraseDaFalta(bastidores.faltaNoRitmoDaTurma({ nome: 'X' })) ===
      'os dias da semana (é deles que sai a frequência), a duração de cada aula, o início do período e o fim do período',
    bastidores.fraseDaFalta(bastidores.faltaNoRitmoDaTurma({ nome: 'X' })));
}

function equal(rotulo, obtido, esperado) {
  checar(rotulo, obtido === esperado, { obtido, esperado });
}

// ------------------------------------------------------------------ o controle negativo

function controleNegativo() {
  console.log('\ncontrole negativo — a prova reprova o que deve reprovar');

  // (a) A CONTA que ignorasse os dias daria 6 onde o professor espera 7. É o defeito que a
  //     mudança corrige, medido no mesmo instante.
  const html = fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8');
  const casado = html.match(/const DIAS_POR_CODIGO[\s\S]*?\nfunction numeroDeAulasDaTurma\(t\) \{[\s\S]*?\n\}/);
  const { numeroDeAulas } = new Function(casado[0] + '; return { numeroDeAulas };')();
  const antiga = (t) => {
    const inicio = new Date(t.inicio + 'T00:00:00');
    const fim = new Date(t.fim + 'T00:00:00');
    return Math.max(1, Math.round(((Math.floor((fim - inicio) / 86400000) + 1) / 7) * t.frequencia));
  };
  const p = { inicio: '2026-10-16', fim: '2026-10-30', frequencia: 3, dias: ['ter', 'qui', 'sex'] };
  checar('a conta ANTIGA (só a média) daria outro número',
    antiga(p) !== numeroDeAulas(p), { antiga: antiga(p), nova: numeroDeAulas(p) });

  // (b) A turma incompleta TEM de ser apontada: a prova enxerga a falta, e não a ignora.
  const completa = { nome: 'ok', frequencia: 1, dias: ['seg'], duracaoMin: 60, periodoInicio: '2026-01-01', periodoFim: '2026-02-01' };
  checar('uma turma completa passa na validação', bastidores.faltaNoRitmoDaTurma(completa).length === 0);
  const semDuracao = { ...completa, duracaoMin: null };
  checar('e uma incompleta NÃO passa', bastidores.faltaNoRitmoDaTurma(semDuracao).length === 1);
  checar('a falta nomeia o campo certo',
    bastidores.faltaNoRitmoDaTurma(semDuracao)[0] === 'a duração de cada aula',
    bastidores.faltaNoRitmoDaTurma(semDuracao));

  // (c) O CONTEÚDO: se a turma voltasse a ser múltipla, a prova acima reprovaria. Aqui se
  //     mede o que a regra proíbe, direto no dado.
  const c = JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta/plano/conteudo/plano.json'), 'utf8'));
  const cru = JSON.stringify(c);
  checar('o conteúdo não declara a turma como múltipla', !/"multipla":\s*true[^}]*contexto-turma/s.test(cru));
}

async function main() {
  console.log('o plano de ensino e a turma — uma por plano, e o total é conta');
  oConteudo();
  aConta();
  aTurmaDoEnvelope();
  await aEstanteDoServidor();
  oRitmoObrigatorio();
  controleNegativo();
  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' provas, 0 falhas'
    : 'FALHOU — ' + n + ' provas, ' + falhas + ' falhas'));
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((erro) => {
  console.error('\na prova quebrou: ' + erro.stack);
  process.exit(1);
});
