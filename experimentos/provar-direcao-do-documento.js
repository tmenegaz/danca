#!/usr/bin/env node
'use strict';

/*
 * provar-direcao-do-documento.js — O DOCUMENTO DERIVADO, A DIREÇÃO E A AUTORIA.
 *
 * ESTA PROVA NASCEU A 10/11/2026 para um defeito, e foi REESCRITA a 12/11/2026 para o contrário
 * dele. A história é o que a torna legível:
 *
 *   10/11 — a cadeia derivava o plano e o PO quando o professor da turma mudava, e o elo novo saía
 *   com o nome do professor NOVO. A intenção era corrigir o cabeçalho, que continuava a imprimir o
 *   nome do professor antigo («no cabeçalho do PO ainda aparecia o Pé Torto»). A prova de então
 *   exigia exactamente isso: «o elo novo diz o professor que passou a dirigir».
 *
 *   12/11 — a pesquisadora mediu a consequência e recusou-a: «ele trocou o nome do plano de ensino
 *   atual para quem fez sendo a Redinha Rosa e isso não é verdade». O cabeçalho estava correcto
 *   quanto ao formato e falso quanto ao facto. **A autoria não se reescreve.**
 *
 * O QUE PASSA A VALER, e é o que aqui se mede:
 *
 *   A. TROCAR O PROFESSOR NÃO DERIVA NADA. O documento do professor anterior fica como está, a
 *      dizer o seu autor, e a etapa fica BLOQUEADA com a razão dita. Quem dirige hoje escreve o
 *      seu — e quando o tiver, a etapa fecha-se sozinha.
 *   B. MUDAR DE SALA CONTINUA A DERIVAR — o professor é o mesmo, e o nome da sala é a identidade
 *      do documento. O elo novo relê a sala e conserva o autor. Se a Turma mudar de sala E de
 *      professor, não herda nada: o plano da sala nova não é do novo professor.
 *   C. NADA MUDOU — e a cadeia não inventa elos.
 *   D. O NÍVEL DO NÚCLEO, isolado: a sala manda (deriva), o professor trava (bloqueia).
 *   E. O ESTADO «SEM TURMA» — o documento que perdeu a turma, e o traço onde ela estava.
 *
 * O QUE SE MEDE, no fim: os envelopes NOVOS, lidos do armazenamento — não as intenções.
 *
 * SEM REDE: armazenamento em memória, escritores espiões, geração falsa.
 *
 *   node experimentos/provar-direcao-do-documento.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const { criarCadeia } = require(path.join(RAIZ, 'motor/servidor/cadeia.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const nucleoCadeia = require(path.join(RAIZ, 'motor/nucleo/cadeia.js'));

const ler = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta', p), 'utf8'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'prova';
const SALA = 'Rosa';
const OUTRA_SALA = 'Piano';
const ANTIGO = 'pe-torto';
const NOVO = 'redinha-rosa';
const NOME_NOVO = 'Redinha Rosa';
/* O DIA DA MUDANÇA — e o plano é do MESMO dia, de propósito: é o caso que a data não apanha. */
const QUANDO = '2026-11-10';
const HOJE = '2026-11-10T13:04';
const PLANO = 'plano-20261109-2341';
const PO = 'po-20261109-2341';

const r = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });

function relatorioDe(id) {
  return {
    id, estado: 'Input_anamnese_construida',
    contagem: { respondidos: 0, obrigatorios: 0 },
    elos: [], paradas: [], idsDesconhecidos: [],
    validacao: { resultado: 'aceite', contrato: 'prova' },
    errosDoDocumento: [], linhas: [],
  };
}

function planoFixture() {
  return {
    id: PLANO,
    contexto: { escola: ESCOLA, professor: ANTIGO, ciclo: '01', turma: SALA },
    respostas: {
      'objetivo-geral': r('consolidar o alinhamento e a transferência de peso'),
      'contexto-professor': r(ANTIGO),
      'contexto-turma': r(SALA),
      'contexto-duracao': r([{ numero: 45, unidade: 'minuto' }]),
      'marcos-por-aula': r(['reconhecer o apoio', 'transferir o peso']),
      'estrutura-de-cada-aula': r([{ marco: 1, marcados: ['Barra', 'Centro'] }]),
      'aula-1-parametro': r([{ marco: 1, marcados: ['Battement tendu'] }]),
      'distribuicao-de-volume': r({ unidade: 'percentual', linhas: [
        { Bloco: 'Barra', 'Proporção alvo': '40%', Justificativa: 'Apoio.' },
        { Bloco: 'Centro', 'Proporção alvo': '30%', Justificativa: 'Deslocamento.' },
        { Bloco: 'Musicalidade', 'Proporção alvo': '10%', Justificativa: 'Pulso.' },
        { Bloco: 'Expressão', 'Proporção alvo': '20%', Justificativa: 'Braços.' },
      ] }),
      'aula-1-sequencia': r([{ Bloco: 'Barra', 'Objetivo específico': '1 — reconhecer o apoio',
        'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '4/4' }]),
      'condicoes-preliminares': r('Sala com barra.'),
      'criterio-de-extensao': r('Estender em duas aulas.'),
      referencias: r('RAD (2015).'),
      'musicas-videos': r('Faixa em 4/4.'),
    },
    gerado_em: HOJE,
  };
}

function poFixture() {
  return {
    id: PO,
    contexto: { escola: ESCOLA, professor: ANTIGO, ciclo: '01', turma: SALA },
    respostas: {
      professor: r(ANTIGO),
      escola: r('Escola de prova'),
      'plano-de-ensino': r(PLANO),
      'sujeitos-da-observacao': r(['Aluna A', 'Aluna B']),
      'frequencia-de-registro': r('semanal'),
      'duracao-da-observacao': r([{ numero: 90, unidade: 'dia' }]),
      'recorte-do-que-se-observa': r('o apoio e a transferência de peso'),
      'condicao-de-registro': r('em vídeo, com o celular na barra'),
      'o-que-conta-como-evidencia': r('a aluna que corrige sem ser nomeada'),
      'criterio-de-parada': r('três aulas seguidas de registo'),
      'calendario-de-observacao': r('novembro a dezembro'),
      'volume-de-observacao': r('duas aulas por semana'),
      referencias: r('RAD (2015).'),
    },
    gerado_em: HOJE,
  };
}

function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    _dados: dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, v); return { ok: true }; },
    async delete(k) { dados.delete(k); },
    async list() { return { keys: [...dados.keys()].map((name) => ({ name })), list_complete: true }; },
  };
}

const elenco = (extra) => Object.assign({
  id: 'elenco-a', nome: 'Elenco A', professor: ANTIGO,
  alunas: ['Aluna A', 'Aluna B'], campos: [{ id: 'x', nome: 'X' }],
  carimbo: '20261109-2340', atualizada_em: '2026-11-09T23:40:00.000Z',
}, extra || {});

const curadoria = (extra) => Object.assign({
  id: ANTIGO + '-bale-classico-rosa', professor: ANTIGO, modalidade: 'Balé clássico',
  tradicao: 'RAD', grau: '', nivel: '1', nivelReferencia: 'Grade 1',
  turmas: [SALA], linhaDeBase: 'elenco-a', linhaDeBaseNome: 'Elenco A',
  repertorio: [], alunas: ['Aluna A', 'Aluna B'], vigenteDe: '2026-11-09',
}, extra || {});

/** A cadeia, com os escritores espiões — e nada de rede. */
function montar({ curadorias }) {
  const kv = kvDeMentira({ ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify(curadorias) });
  const arm = criarMemoria();
  const visto = { planos: [], pos: [] };
  const cadeia = criarCadeia({
    armazenamento: arm, porta,
    conteudo: ler('conteudo/anamnese.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    carimbar: () => '2026-11-10T22:00',
    escreverPlano: async (envelope) => { visto.planos.push(envelope); return { ok: true }; },
    escreverPO: async (envelope) => { visto.pos.push(envelope); return { ok: true }; },
    escreverCiclo: async () => ({ ok: true, documentos: [{}] }),
    disparar: async () => ({ ok: true }),
    geracao: null,
    concluirPO: async () => ({ fonte: { ok: true }, ciclo: { ok: true }, disparo: { ok: true } }),
    lerCuradorias: async () => JSON.parse(kv._dados.get('bastidores/' + ESCOLA + '/curadorias')),
    lerTurmas: async () => [{ nome: SALA }, { nome: OUTRA_SALA }],
    lerLinhasDeBase: async () => [elenco()],
    linhaDeBaseDaTurma: async () => elenco(),
    /* O CADASTRO — é dele que sai o NOME que o documento imprime. */
    lerProfessores: async () => [{ nome: NOME_NOVO, slug: NOVO }],
    kv, escola: ESCOLA,
    urlDaPorta: bastidores.urlDaPorta,
  });
  return { cadeia, arm, kv, visto };
}

async function semear(arm) {
  await porta.gravarEnvelope(arm, planoFixture(), relatorioDe(PLANO));
  await porta.gravarEnvelope(arm, poFixture(), relatorioDe(PO));
}

async function novaCadeia(arm) {
  return (await porta.nomesDeEnvelopes(arm, /^(plano|po)-.*\.json$/))
    .map((n) => n.replace(/\.json$/, ''));
}

/* ------------------------------------------------------------------------------------------ */

(async () => {
  /* A. A MESMA SALA, OUTRO PROFESSOR — o caso da pesquisadora. O plano é do MESMO dia.
   *
   * O QUE SE AFIRMA AGORA É O CONTRÁRIO DO QUE SE AFIRMAVA A 10/11: nada é derivado, e a etapa diz
   * porquê. Este bloco é a prova do defeito — quem voltar a derivar por mudança de professor
   * reprova aqui, com o nome do autor trocado à vista. */
  {
    console.log('\nA. TROCAR O PROFESSOR NÃO DERIVA NADA — a autoria não se reescreve');
    const { cadeia, arm, visto } = montar({
      curadorias: [
        curadoria({ substituidaPor: ANTIGO + '-bale-classico-rosa-2026-11-10' }),
        curadoria({ id: ANTIGO + '-bale-classico-rosa-2026-11-10', vigenteDe: QUANDO, professor: NOVO, substitui: ANTIGO + '-bale-classico-rosa' }),
      ],
    });
    await semear(arm);
    const r = await cadeia.executar({ gatilho: 'troca-de-direcao', turmas: [SALA], quando: QUANDO });

    const etapaPlano = ((r.alvos || [])[0] || {}).etapas.find((e) => e.chave === 'plano-de-ensino') || {};
    provar('a etapa do plano fica BLOQUEADA',
      etapaPlano.estado === 'bloqueada', etapaPlano);
    provar('…e a frase diz de quem é o plano, e que ele passa a «sem turma»',
      /pe-torto/.test(String(etapaPlano.falta || '')) && /sem turma/.test(String(etapaPlano.falta || '')),
      etapaPlano.falta);

    provar('NENHUM elo novo do plano foi escrito', visto.planos.length === 0, visto.planos.length);
    const envelopes = await novaCadeia(arm);
    provar('…nem do PO', envelopes.filter((x) => x.indexOf('po-') === 0 && x !== PO).length === 0, envelopes);

    const depoisPlano = await porta.lerEnvelope(arm, PLANO);
    const depoisPo = await porta.lerEnvelope(arm, PO);
    provar('o plano continua a ser de quem o escreveu',
      (depoisPlano.contexto || {}).professor === ANTIGO
        && (((depoisPlano.respostas || {})['contexto-professor']) || {}).valor === ANTIGO,
      { contexto: depoisPlano.contexto, resposta: (depoisPlano.respostas || {})['contexto-professor'] });
    provar('…e o PO também',
      (depoisPo.contexto || {}).professor === ANTIGO
        && (((depoisPo.respostas || {}).professor) || {}).valor === ANTIGO,
      { contexto: depoisPo.contexto, resposta: (depoisPo.respostas || {}).professor });
    provar('…e nenhum dos dois ganhou um sucessor',
      !depoisPlano.ajuste_de
        && envelopes.filter((x) => x !== PLANO && x !== PO).length === 0, envelopes);

    /* O ESTADO NA LISTAGEM: o plano do Pé Torto perdeu a Turma, e é isso que ela vê. */
    const curadorias = [
      curadoria({ substituidaPor: ANTIGO + '-bale-classico-rosa-2026-11-10' }),
      curadoria({ id: ANTIGO + '-bale-classico-rosa-2026-11-10', vigenteDe: QUANDO, professor: NOVO, substitui: ANTIGO + '-bale-classico-rosa' }),
    ];
    const estados = await porta.estadosDosPlanos(arm, { curadorias });
    const doPlano = estados[PLANO] || {};
    provar('o plano do professor anterior fica «sem turma»', doPlano.semTurma === true, doPlano);
    provar('…e o autor que a linha mostra é o que o escreveu', doPlano.professor === ANTIGO, doPlano);
    provar('…e diz quem dirige a Turma hoje', doPlano.turmaDe === NOVO, doPlano);
    const semCuradorias = (await porta.estadosDosPlanos(arm))[PLANO] || {};
    provar('CONTROLO: sem as curadorias lidas, ninguém é acusado de nada',
      semCuradorias.semTurma === undefined, semCuradorias);

    /* E QUANDO A NOVA PROFESSORA TEM O PLANO DELA, a etapa fecha-se sozinha — é o que a
     * pesquisadora descreveu: «só vai sair essa exclamação […] quando ela já tiver plano». */
    const planoDela = planoFixture();
    planoDela.id = 'plano-20261111-0900';
    planoDela.contexto = Object.assign({}, planoDela.contexto, { professor: NOVO });
    planoDela.respostas = Object.assign({}, planoDela.respostas, {
      'contexto-professor': { valor: NOME_NOVO, origem: 'perguntado', respondente: 'professor', nota: null },
    });
    planoDela.gerado_em = '2026-11-11T09:00';
    await porta.gravarEnvelope(arm, planoDela, relatorioDe(planoDela.id));
    const r2 = await cadeia.executar({ gatilho: 'troca-de-direcao', turmas: [SALA], quando: QUANDO });
    const etapa2 = ((r2.alvos || [])[0] || {}).etapas.find((e) => e.chave === 'plano-de-ensino') || {};
    provar('com o plano DELA, a etapa do plano fecha-se', etapa2.estado === 'feita', etapa2);
    provar('…e o plano dela não recebeu o nome de ninguém',
      (await porta.lerEnvelope(arm, 'plano-20261111-0900')).contexto.professor === NOVO);
    const estados2 = await porta.estadosDosPlanos(arm, { curadorias });
    provar('…e o plano ANTIGO continua «sem turma» (a verdade não se desfaz)',
      (estados2[PLANO] || {}).semTurma === true, estados2[PLANO]);
    provar('…e o dela tem turma', (estados2['plano-20261111-0900'] || {}).semTurma === undefined,
      estados2['plano-20261111-0900']);
  }

  /* B. A TURMA MUDA DE SALA — MESMO PROFESSOR. O plano segue-a, em vez de «nascer na porta», e o
   * autor fica. (Mudar de sala E de professor não herda nada: ver B2.) */
  {
    console.log('\nB. A TURMA MUDA DE SALA E O PLANO VAI ATRÁS DELA — do mesmo professor');
    const ORIGEM = ANTIGO + '-bale-classico-rosa-2026-11-10';
    const { cadeia, arm, visto } = montar({
      curadorias: [
        curadoria({ id: ORIGEM, vigenteDe: QUANDO, substituidaPor: ANTIGO + '-bale-classico-piano-2026-11-10' }),
        curadoria({ id: ANTIGO + '-bale-classico-piano-2026-11-10', vigenteDe: QUANDO,
          professor: ANTIGO, turmas: [OUTRA_SALA], substitui: ORIGEM }),
      ],
    });
    await semear(arm);
    const r = await cadeia.executar({ gatilho: 'troca-de-direcao', turmas: [OUTRA_SALA], quando: QUANDO });
    const etapas = ((r.alvos || [])[0] || {}).etapas || [];
    const etapaPlano = etapas.find((e) => e.chave === 'plano-de-ensino') || {};

    provar('a etapa do plano NÃO fica bloqueada por «não há plano na sala nova»',
      etapaPlano.estado !== 'bloqueada', etapaPlano);
    provar('…e é derivada a partir do plano da sala de ORIGEM',
      visto.planos.length === 1 && String(((visto.planos[0] || {}).ajuste_de) || '') === PLANO,
      { escritos: visto.planos.length, ajuste_de: (visto.planos[0] || {}).ajuste_de });
    provar('…e o elo novo declara a sala NOVA',
      (((visto.planos[0] || {}).respostas || {})['contexto-turma'] || {}).valor === OUTRA_SALA,
      (((visto.planos[0] || {}).respostas || {})['contexto-turma']));
    provar('…e o professor continua a ser o MESMO (o autor não muda com a sala)',
      (((visto.planos[0] || {}).respostas || {})['contexto-professor'] || {}).valor === ANTIGO
        && ((visto.planos[0] || {}).contexto || {}).professor === ANTIGO,
      { resposta: (((visto.planos[0] || {}).respostas || {})['contexto-professor']),
        contexto: (visto.planos[0] || {}).contexto });
    const etapaPo = etapas.find((e) => e.chave === 'plano-de-observacao') || {};
    provar('o PO também é derivado', vista(etapaPo) || visto.pos.length === 1, etapaPo);
  }

  /* B2. A TURMA MUDA DE SALA **E** DE PROFESSOR — não herda: o plano da sala de origem não é do
   * professor que passa a dirigir. É a mesma regra de A, aplicada ao eixo da sala. */
  {
    console.log('\nB2. MUDAR DE SALA E DE PROFESSOR NÃO HERDA O PLANO DO ANTERIOR');
    const ORIGEM = ANTIGO + '-bale-classico-rosa-2026-11-10';
    const { cadeia, arm, visto } = montar({
      curadorias: [
        curadoria({ id: ORIGEM, vigenteDe: QUANDO, substituidaPor: 'redinha-rosa-bale-classico-piano-2026-11-10' }),
        curadoria({ id: 'redinha-rosa-bale-classico-piano-2026-11-10', vigenteDe: QUANDO,
          professor: NOVO, turmas: [OUTRA_SALA], substitui: ORIGEM }),
      ],
    });
    await semear(arm);
    const r = await cadeia.executar({ gatilho: 'troca-de-direcao', turmas: [OUTRA_SALA], quando: QUANDO });
    const etapaPlano = (((r.alvos || [])[0] || {}).etapas || [])
      .find((e) => e.chave === 'plano-de-ensino') || {};
    provar('nem o plano da sala de origem é herdado por outro professor',
      visto.planos.length === 0, { escritos: visto.planos.length, etapa: etapaPlano });
    provar('…e nenhum elo do plano é escrito com nome trocado',
      !visto.planos.some((p) => ((p.contexto || {}).professor) === NOVO), visto.planos);
  }

  /* C. NADA MUDOU — e a cadeia não inventa elos. */
  {
    console.log('\nC. SEM MUDANÇA DE DIREÇÃO, A CADEIA NÃO DERIVA NADA');
    const { cadeia, arm, visto } = montar({
      curadorias: [curadoria({ id: ANTIGO + '-bale-classico-rosa-2026-11-10', vigenteDe: QUANDO })],
    });
    await semear(arm);
    await cadeia.executar({ gatilho: 'troca-de-direcao', turmas: [SALA], quando: QUANDO });
    provar('nenhum elo do plano é escrito', visto.planos.length === 0, visto.planos.length);
    provar('nenhum elo do PO é escrito', visto.pos.length === 0, visto.pos.length);
  }

  /* D. O NÍVEL DO NÚCLEO, isolado: a sala manda (deriva), o professor trava (bloqueia). */
  {
    console.log('\nD. O NÍVEL DO NÚCLEO — A SALA DERIVA, O PROFESSOR BLOQUEIA');
    /* A BASE É A MESMA DIREÇÃO — o plano declara `pe-torto`, e a curadoria também. É o controlo
     * que mostra que a data, sozinha, continua a valer quando nada mudou. */
    const base = {
      elenco: elenco(), turma: SALA, quando: QUANDO,
      curadoria: curadoria({ professor: ANTIGO }),
      plano: planoFixture(), po: poFixture(),
      pacoteEmDia: true,
    };
    const etapa = (estado, chave) => (estado.etapas.find((e) => e.chave === chave) || {});
    const igual = nucleoCadeia.indice(Object.assign({}, base));
    provar('plano do mesmo dia, mesma direção → feita',
      etapa(igual, 'plano-de-ensino').estado === 'feita', etapa(igual, 'plano-de-ensino'));

    const outroProfessor = nucleoCadeia.indice(Object.assign({}, base, {
      curadoria: curadoria({ professor: 'outra-pessoa' }),
    }));
    provar('a curadoria declara OUTRO professor → BLOQUEADA (não se deriva a autoria)',
      etapa(outroProfessor, 'plano-de-ensino').estado === 'bloqueada',
      etapa(outroProfessor, 'plano-de-ensino'));
    provar('…e a frase nomeia o autor do documento',
      /pe-torto/.test(String(etapa(outroProfessor, 'plano-de-ensino').falta || '')),
      etapa(outroProfessor, 'plano-de-ensino').falta);
    provar('…e o PO também, pela mesma razão',
      etapa(outroProfessor, 'plano-de-observacao').estado === 'bloqueada',
      etapa(outroProfessor, 'plano-de-observacao'));

    /* O CASO EM QUE O SERVIDOR JÁ NÃO ENTREGA O PLANO DO OUTRO: a etapa é bloqueada na mesma, e
     * a frase diz de quem é o plano — que é o que a tela precisa para mandar o professor certo. */
    const semPlano = nucleoCadeia.indice(Object.assign({}, base, {
      curadoria: curadoria({ professor: 'outra-pessoa' }),
      plano: null, po: null, pacoteEmDia: false,
      planoDeOutro: { id: PLANO, professor: ANTIGO, professorNome: 'Pé Torto' },
    }));
    provar('sem o plano do outro professor na mão, a etapa continua bloqueada',
      etapa(semPlano, 'plano-de-ensino').estado === 'bloqueada', etapa(semPlano, 'plano-de-ensino'));
    provar('…e a frase diz «Pé Torto» pelo NOME, e não pelo slug',
      /Pé Torto/.test(String(etapa(semPlano, 'plano-de-ensino').falta || '')),
      etapa(semPlano, 'plano-de-ensino').falta);
    provar('…e o pacote espera os documentos de quem dirige hoje',
      etapa(semPlano, 'pacote').estado === 'bloqueada'
        && /outro professor/.test(String(etapa(semPlano, 'pacote').falta || '')),
      etapa(semPlano, 'pacote'));

    const outraSala = nucleoCadeia.indice(Object.assign({}, base, {
      curadoria: curadoria({ turmas: [OUTRA_SALA] }), turma: OUTRA_SALA,
    }));
    provar('a sala mudou → pendente (o nome dela é a identidade do plano)',
      etapa(outraSala, 'plano-de-ensino').estado === 'pendente', etapa(outraSala, 'plano-de-ensino'));
  }

  console.log('\n' + (falhas ? 'FALHARAM ' + falhas + ' de ' + provas : 'TUDO CERTO — ' + provas
    + ' asserções: trocar o professor não reescreve a autoria (o documento fica «sem turma»); mudar '
    + 'de sala deriva o mesmo autor; e o plano da nova professora fecha a etapa sozinho.'));
  if (falhas) process.exit(1);
})();

/* Um `vista` pequeno para a asserção do PO, sem inventar semântica: a etapa não bloqueada basta. */
function vista(etapa) {
  return Boolean(etapa) && etapa.estado !== 'bloqueada' && etapa.estado !== 'pendente';
}
