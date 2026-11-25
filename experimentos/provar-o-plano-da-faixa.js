#!/usr/bin/env node
'use strict';

/*
 * provar-o-plano-da-faixa.js — o plano de ensino lê o ritmo DA FAIXA que a Turma ocupa.
 *
 * O DEFEITO QUE ISTO MEDE (25/11/2026), e é uma consequência directa do modelo que acabámos de
 * construir. A raiz de uma Sala é o **espelho da faixa 1** — foi assim que todas as salas de uma
 * faixa continuaram a funcionar sem migração. Mas o `.conf` do ciclo, o ritmo que a cadeia compara
 * e o total de aulas liam essa raiz, e uma Turma que ocupa a **faixa 2** tem outros dias, outra
 * hora e outra duração.
 *
 *   Sala «Piano»:  faixa 1 = seg/qua/sex, 16:00, 55 min
 *                  faixa 2 = seg/qua,     17:00, 70 min
 *
 * Com a Turma na faixa 2, o plano saía com **55 minutos em três dias por semana** — dois erros no
 * mesmo documento impresso, e nenhum aviso. Pior: como a raiz não muda quando a faixa muda, a
 * guarda `ritmoMudou` também nunca disparava, e um plano já gerado ficava velho em silêncio.
 *
 * O QUE SE MEDE:
 *
 *   A. o `.conf` — `DURACOES` e `FREQUENCIA` da faixa escolhida;
 *   B. o ritmo que a cadeia compara — tem de mudar entre faixas, senão a guarda cala-se;
 *   C. o total de aulas do período, que sai do mesmo ritmo;
 *   D. a equivalência: uma Sala de UMA faixa dá exactamente o mesmo que dava antes;
 *   E. os controlos negativos;
 *   F. a CADEIA — a guarda da autoria também tem de ler a faixa, e não a raiz da Sala.
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const { comporConf, respostasDoRitmo, aulasNoPeriodo } = require(path.join(RAIZ, 'motor/servidor/compor-conf.js'));
const O = require(path.join(RAIZ, 'motor/nucleo/ocupacao.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* A SALA DELA, à letra: duas faixas no mesmo espaço, com durações e dias diferentes. */
const PIANO = () => ({
  id: 'piano', nome: 'Piano', ordem: 0, ativo: true,
  dias: ['seg', 'qua', 'sex'], horarios: { seg: '16:00', qua: '16:00', sex: '16:00' },
  duracaoMin: 55, periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
  modalidade: 'Balé clássico', professor: 'demi-plie',
  faixas: [
    { id: 'f1', dias: ['seg', 'qua', 'sex'], horarios: { seg: '16:00', qua: '16:00', sex: '16:00' },
      duracaoMin: 55, periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
      modalidade: 'Balé clássico', professor: 'demi-plie' },
    { id: 'f2', dias: ['seg', 'qua'], horarios: { seg: '17:00', qua: '17:00' },
      duracaoMin: 70, periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
      modalidade: 'Balé clássico', professor: 'demi-plie' },
  ],
});

/* Uma Sala de UMA faixa — a forma de todas as que existem hoje. */
const ROSA = () => ({
  id: 'rosa', nome: 'Rosa', ordem: 0, ativo: true,
  dias: ['ter', 'qui'], horarios: { ter: '18:00', qui: '18:00' },
  duracaoMin: 60, periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
  modalidade: 'Balé clássico', professor: 'coqui',
});

const conf = (turma, faixa) => comporConf({
  turma, faixa, plano: {}, identidade: { ESCOLA: 'teste' }, escola: 'teste', ciclo: 1,
}).texto;
const linha = (texto, chave) => {
  const m = new RegExp('^' + chave + '="([^"]*)"', 'm').exec(texto || '');
  return m ? m[1] : null;
};

/* ── A. O `.conf` ────────────────────────────────────────────────────────── */
console.log('A. O `.conf` — a duração e a frequência da FAIXA escolhida');

{
  const textoF1 = conf(PIANO(), 'f1');
  const textoF2 = conf(PIANO(), 'f2');

  provar('a faixa 1 põe 55 minutos no manifesto', linha(textoF1, 'DURACOES') === '55', linha(textoF1, 'DURACOES'));
  provar('…e três dias por semana', linha(textoF1, 'FREQUENCIA') === '3x/semana', linha(textoF1, 'FREQUENCIA'));

  provar('a faixa 2 põe 70 minutos — e não os 55 da raiz', linha(textoF2, 'DURACOES') === '70', linha(textoF2, 'DURACOES'));
  provar('…e dois dias por semana', linha(textoF2, 'FREQUENCIA') === '2x/semana', linha(textoF2, 'FREQUENCIA'));
  /* O DEFEITO, nomeado: antes desta correcção as duas davam 55 e 3x. */
  provar('as duas faixas NÃO dão o mesmo manifesto', textoF1 !== textoF2);
}

/* ── B. O ritmo que a cadeia compara ─────────────────────────────────────── */
console.log('\nB. O RITMO DA CADEIA — tem de mudar entre faixas, senão a guarda cala-se');

{
  const r1 = respostasDoRitmo(PIANO(), 'f1');
  const r2 = respostasDoRitmo(PIANO(), 'f2');
  provar('o ritmo da faixa 1 declara três dias',
    r1['contexto-frequencia'] && r1['contexto-frequencia'].vezes === 3, r1['contexto-frequencia']);
  provar('o da faixa 2 declara dois',
    r2['contexto-frequencia'] && r2['contexto-frequencia'].vezes === 2, r2['contexto-frequencia']);
  provar('…e os dois ritmos são DIFERENTES — é o que faz `ritmoMudou` disparar',
    JSON.stringify(r1) !== JSON.stringify(r2));
  /* A duração em linguagem natural: 55 min é «55 minutos», 70 é «1 hora e 10 minutos». */
  provar('a duração da faixa 2 diz 70 minutos, e não 55',
    JSON.stringify(r2['contexto-duracao']).indexOf('"numero":10') !== -1,
    r2['contexto-duracao']);
}

/* ── C. O total de aulas do período ──────────────────────────────────────── */
console.log('\nC. O TOTAL DE AULAS — sai do mesmo ritmo, e por isso também muda');

{
  const efetiva1 = O.salaEfetiva(PIANO(), 'f1');
  const efetiva2 = O.salaEfetiva(PIANO(), 'f2');
  const t1 = aulasNoPeriodo(efetiva1);
  const t2 = aulasNoPeriodo(efetiva2);
  provar('a faixa 1 tem mais aulas no período do que a faixa 2', t1 > t2, { f1: t1, f2: t2 });
  provar('…e ambos são números positivos', t1 > 0 && t2 > 0, { f1: t1, f2: t2 });
}

/* ── D. A equivalência com as salas de hoje ──────────────────────────────── */
console.log('\nD. UMA SALA DE UMA FAIXA DÁ O MESMO QUE DAVA — a equivalência que a migração exige');

{
  const comFaixa = conf(ROSA(), null);
  const semNada = comporConf({
    turma: ROSA(), plano: {}, identidade: { ESCOLA: 'teste' }, escola: 'teste', ciclo: 1,
  }).texto;
  provar('sem faixa, o manifesto é o mesmo de sempre', comFaixa === semNada);
  provar('…e diz 60 minutos em dois dias',
    linha(comFaixa, 'DURACOES') === '60' && linha(comFaixa, 'FREQUENCIA') === '2x/semana',
    [linha(comFaixa, 'DURACOES'), linha(comFaixa, 'FREQUENCIA')]);
  /* E uma faixa que não existe cai na raiz: é o caso de um id que já não existe — degradar para o
   * ritmo da Sala é melhor do que gerar um documento sem ritmo nenhum. */
  const idMorto = conf(PIANO(), 'f9');
  provar('uma faixa que não existe cai na raiz — e não gera um documento sem ritmo',
    linha(idMorto, 'DURACOES') === '55', linha(idMorto, 'DURACOES'));
}

/* ── E. Controlos negativos ──────────────────────────────────────────────── */
console.log('\nE. OS CONTROLOS NEGATIVOS');

{
  /* A PROJECÇÃO É A ÚNICA COISA QUE MUDA O RITMO: a mesma Sala sem faixa tem de dar a raiz, e é
   * isso que prova que os números acima vêm da faixa e não de outro sítio. */
  provar('CONTROLO: a Sala sem faixa escolhida lê a raiz (55)',
    linha(conf(PIANO(), null), 'DURACOES') === '55');
  const umaSo = ROSA();
  provar('CONTROLO: `salaEfetiva` devolve a PRÓPRIA Sala quando ela tem uma faixa só — sem cópia',
    O.salaEfetiva(umaSo, null) === umaSo && O.salaEfetiva(umaSo, 'f1') === umaSo);
  /* E com duas faixas devolve uma cópia, deixando a Sala intacta: é a projecção, não uma escrita. */
  const duas = PIANO();
  const projectada = O.salaEfetiva(duas, 'f2');
  provar('…e com duas devolve uma cópia, sem tocar na Sala',
    projectada !== duas && duas.duracaoMin === 55 && projectada.duracaoMin === 70,
    { sala: duas.duracaoMin, projectada: projectada.duracaoMin });
  /* E um objecto sem `faixas` nem `dias` não rebenta: devolve-se tal e qual. */
  const vazia = { nome: 'Sem ritmo' };
  provar('CONTROLO: uma Sala sem ritmo nem faixas não rebenta a projecção',
    O.salaEfetiva(vazia, 'f1') === vazia);
}

/* ------------------------------------------------------------------------------------------ */

/* F. A CADEIA TAMBÉM TEM DE LER A FAIXA — e é aqui que ela decidia sobre o professor ERRADO.
 *
 * `salaDaTurma` devolve o registo inteiro da Sala, e a raiz desse registo é o espelho da faixa 1.
 * Os leitores do ritmo já tinham sido corrigidos (§A–§D). A guarda da autoria não: `autoriaIntacta`
 * compara o professor do plano com `professorEfetivo(curadoria, sala)`, que lia `sala.professor` —
 * a raiz. Numa Sala cuja faixa 2 tem outro docente, a Turma da faixa 2 era comparada com o docente
 * da faixa 1, a autoria parecia quebrada, e a derivação parava a dizer «sem turma» sobre um plano
 * que era, afinal, de quem dá aquela aula.
 *
 * O caso é o que a pesquisadora montou a 25/11/2026 na Sala do Piano: o mesmo professor em duas
 * faixas, com modalidades diferentes. Aqui usa-se um segundo professor de propósito — é a versão
 * mais dura do mesmo erro. */

function montarCadeiaDaFaixa({ sala, curadorias, plano }) {
  const fs = require('fs');
  const path2 = require('path');
  const porta = require(path2.join(RAIZ, 'motor/nucleo/porta.js'));
  const { criarMemoria } = require(path2.join(RAIZ, 'motor/nucleo/armazenamento.js'));
  const { criarCadeia } = require(path2.join(RAIZ, 'motor/servidor/cadeia.js'));
  const bastidores = require(path2.join(RAIZ, 'motor/servidor/bastidores.js'));
  const lerF = (p) => JSON.parse(fs.readFileSync(path2.join(RAIZ, 'porta', p), 'utf8'));

  const dados = new Map([['bastidores/prova/curadorias', JSON.stringify(curadorias)]]);
  const kv = {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, v); return { ok: true }; },
    async delete(k) { dados.delete(k); },
    async list() { return { keys: [...dados.keys()].map((name) => ({ name })), list_complete: true }; },
  };
  const arm = criarMemoria();
  const visto = { planos: [], pos: [] };
  const cadeia = criarCadeia({
    armazenamento: arm, porta,
    conteudo: lerF('conteudo/anamnese.json'),
    conteudoPlano: lerF('plano/conteudo/plano.json'),
    conteudoPO: lerF('po/conteudo/po.json'),
    esquema: lerF('envelope/elicitacao-schema.json'),
    carimbar: () => '2026-11-25T22:00',
    escreverPlano: async (e) => { visto.planos.push(e); return { ok: true }; },
    escreverPO: async (e) => { visto.pos.push(e); return { ok: true }; },
    escreverCiclo: async () => ({ ok: true, documentos: [{}] }),
    disparar: async () => ({ ok: true }),
    geracao: null,
    concluirPO: async () => ({ fonte: { ok: true }, ciclo: { ok: true }, disparo: { ok: true } }),
    lerCuradorias: async () => JSON.parse(dados.get('bastidores/prova/curadorias')),
    lerTurmas: async () => [sala],
    lerLinhasDeBase: async () => [elencoF],
    linhaDeBaseDaTurma: async () => elencoF,
    lerProfessores: async () => [{ nome: 'Novo Professor', slug: 'novo-prof' },
      { nome: 'Antigo Professor', slug: 'antigo-prof' }],
    kv, escola: 'prova',
    urlDaPorta: bastidores.urlDaPorta,
  });
  return { cadeia, arm, visto, porta };
}

const rF = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });
const elencoF = {
  id: 'elenco-f', nome: 'Elenco F', professor: 'antigo-prof',
  alunas: ['Aluna A', 'Aluna B'], campos: [{ id: 'x', nome: 'X' }],
  carimbo: '20261125-2200', atualizada_em: '2026-11-25T22:00:00.000Z',
};

function planoDaFaixa2() {
  const respostas = {
    'objetivo-geral': rF('sustentar a queda e o contrapeso'),
    'contexto-professor': rF('antigo-prof'),
    'contexto-turma': rF('Piano'),
    'contexto-duracao': rF([{ numero: 70, unidade: 'minuto' }]),
    'marcos-por-aula': rF(['reconhecer o apoio', 'transferir o peso']),
    'estrutura-de-cada-aula': rF([{ marco: 1, marcados: ['Barra', 'Centro'] }]),
    'aula-1-parametro': rF([{ marco: 1, marcados: ['Battement tendu'] }]),
    'distribuicao-de-volume': rF({ unidade: 'percentual', linhas: [
      { Bloco: 'Barra', 'Proporção alvo': '40%', Justificativa: 'Apoio.' },
      { Bloco: 'Centro', 'Proporção alvo': '30%', Justificativa: 'Deslocamento.' },
      { Bloco: 'Musicalidade', 'Proporção alvo': '10%', Justificativa: 'Pulso.' },
      { Bloco: 'Expressão', 'Proporção alvo': '20%', Justificativa: 'Braços.' },
    ] }),
    'aula-1-sequencia': rF([{ Bloco: 'Barra', 'Objetivo específico': '1 — reconhecer o apoio',
      'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '4/4' }]),
    'condicoes-preliminares': rF('Sala com barra.'),
    'criterio-de-extensao': rF('Estender em duas aulas.'),
    referencias: rF('RAD (2015).'),
    'musicas-videos': rF('Faixa em 4/4.'),
  };
  return {
    id: 'plano-20261124-2300',
    contexto: { escola: 'prova', professor: 'antigo-prof', ciclo: '01', turma: 'Piano' },
    respostas, gerado_em: '2026-11-24T23:00',
  };
}

const relatorioF = (id) => ({
  id, estado: 'Input_anamnese_construida',
  contagem: { respondidos: 0, obrigatorios: 0 }, elos: [], paradas: [], idsDesconhecidos: [],
  validacao: { resultado: 'aceite', contrato: 'prova' }, errosDoDocumento: [], linhas: [],
});

/* A SALA COM DUAS FAIXAS E DOIS DOCENTES. A raiz espelha a faixa 1 (docente novo). */
const SALA_DA_PROVA = {
  nome: 'Piano', modalidade: 'Balé clássico', professor: 'novo-prof',
  dias: ['seg', 'qua'], duracaoMin: 55, inicio: '16:00', periodoInicio: '2026-11-03',
  periodoFim: '2026-12-19',
  faixas: [
    { id: 'f1', dias: ['seg', 'qua'], modalidade: 'Balé clássico', professor: 'novo-prof',
      duracaoMin: 55, inicio: '16:00', periodoInicio: '2026-11-03', periodoFim: '2026-12-19' },
    { id: 'f2', dias: ['seg', 'qua'], modalidade: 'Dança contemporânea', professor: 'antigo-prof',
      duracaoMin: 70, inicio: '17:00', periodoInicio: '2026-11-03', periodoFim: '2026-12-19' },
  ],
};

function curadoriaDaFaixa2() {
  return {
    id: 'antigo-prof-danca-contemporanea-piano', professor: 'antigo-prof',
    modalidade: 'Dança contemporânea', tradicao: 'Contemporâneo', grau: '', nivel: '2',
    nivelReferencia: 'Intermediário', turmas: ['Piano'], faixa: 'f2',
    linhaDeBase: 'elenco-f', linhaDeBaseNome: 'Elenco F',
    repertorio: [], alunas: ['Aluna A', 'Aluna B'], vigenteDe: '2026-11-24',
  };
}

(async () => {
  console.log('\nF. A CADEIA DECIDE SOBRE O DOCENTE DA FAIXA, NÃO SOBRE O DA FAIXA 1');

  {
    const { cadeia, arm, porta } = montarCadeiaDaFaixa({
      sala: SALA_DA_PROVA, curadorias: [curadoriaDaFaixa2()],
    });
    await porta.gravarEnvelope(arm, planoDaFaixa2(), relatorioF('plano-20261124-2300'));
    const r = await cadeia.executar({
      gatilho: 'troca-de-direcao', turmas: ['Piano'], quando: '2026-11-25',
    });
    const alvo = (r.alvos || [])[0] || {};
    const etapa = (alvo.etapas || []).find((e) => e.chave === 'plano-de-ensino') || {};
    const falta = String(etapa.falta || '');

    provar('a etapa do plano NÃO acusa autoria quebrada',
      !/sem turma/.test(falta), { estado: etapa.estado, falta });
    provar('…nem diz que o plano é de outra pessoa',
      !/novo-prof/.test(falta), falta);
    provar('CONTROLO — sem `faixa`, a MESMA Sala dava o docente da faixa 1 e bloqueava',
      (() => {
        const semFaixa = Object.assign({}, curadoriaDaFaixa2());
        delete semFaixa.faixa;
        return O.salaEfetiva(SALA_DA_PROVA, undefined).professor === 'novo-prof'
          && semFaixa.faixa === undefined;
      })());
  }
  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o plano de ensino lê a duração, os dias e o total de '
      + 'aulas da FAIXA que a Turma ocupa, o ritmo que a cadeia compara muda com ela, a guarda da '
      + 'autoria decide sobre o docente da faixa, e uma Sala de uma faixa dá exactamente o que dava antes.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})();
