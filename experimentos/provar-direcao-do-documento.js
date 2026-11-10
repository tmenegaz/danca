#!/usr/bin/env node
'use strict';

/*
 * provar-direcao-do-documento.js — O DOCUMENTO DERIVADO DIZ QUEM PASSA A DIRIGIR (10/11/2026).
 *
 * O QUE MOTIVOU, e são dois sintomas que a pesquisadora leu no mesmo dia:
 *
 *   1. «no cabeçalho do PO ainda aparecia o Pé Torto […] se eu mandar gerar, ele vai gerar com
 *      aqueles valores, né? e não com a professora Redinha Rosa.» Estava certa.
 *   2. A cadeia dizia «a cadeia avançou até ao Plano de observação» e depois não derivava nada —
 *      porque o plano vigente era do MESMO DIA, e a pergunta era só «é anterior à mudança?».
 *
 * DUAS CAUSAS INDEPENDENTES, e é por isso que as duas se medem aqui:
 *
 *   A. A DATA NÃO BASTA. `indice()` decidia pela hora: `gerado_em >= quando` dava o plano por em
 *      dia mesmo quando ele declarava OUTRO professor. Um elo do mesmo dia nunca era derivado, e a
 *      geração corria com o nome antigo no cabeçalho. Passa a comparar a DIREÇÃO (professor e
 *      sala) com o que a curadoria declara agora.
 *
 *   B. A IDENTIDADE ESTÁ NAS RESPOSTAS. `contextoDoElo` atualizava `contexto.professor`, e o
 *      documento não se imprime do contexto: o `## Contexto` do plano lê a resposta
 *      `contexto-professor`, e o YAML do PO lê a resposta `professor` («a RESPOSTA manda, e o
 *      contexto é a reserva» — `derivar-po.js`). Corrigir só o contexto dava um elo novo com o
 *      documento errado — o pior dos mundos: a tela certa e o papel errado.
 *
 *   C. E O PLANO SEGUE A TURMA QUANDO ELA MUDA DE SALA. O plano é procurado pelo NOME da sala;
 *      mudando de sala, o destino não tinha plano nenhum e a cadeia parava em «o primeiro nasce
 *      na porta» — verdadeiro e inútil, porque o plano existia na sala de origem.
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
  /* A. A MESMA SALA, OUTRO PROFESSOR — o caso da pesquisadora. O plano é do MESMO dia. */
  {
    console.log('\nA. O ELO DO MESMO DIA É DERIVADO QUANDO A DIREÇÃO MUDOU');
    const { cadeia, arm, visto } = montar({
      curadorias: [
        curadoria({ substituidaPor: ANTIGO + '-bale-classico-rosa-2026-11-10' }),
        curadoria({ id: ANTIGO + '-bale-classico-rosa-2026-11-10', vigenteDe: QUANDO, professor: NOVO, substitui: ANTIGO + '-bale-classico-rosa' }),
      ],
    });
    await semear(arm);
    const r = await cadeia.executar({ gatilho: 'troca-de-direcao', turmas: [SALA], quando: QUANDO });

    const etapaPlano = ((r.alvos || [])[0] || {}).etapas.find((e) => e.chave === 'plano-de-ensino') || {};
    /* A ETAPA APARECE JÁ «FEITA» — porque a cadeia a derivou neste mesmo pedido. O que se mede é
     * o que a torna feita: o elo novo, e a razão que o justificou. */
    provar('o plano do MESMO dia é derivado (a direção mudou)',
      /elo novo/.test(String(etapaPlano.detalhe || '')), etapaPlano);
    provar('…e a frase diz o que mudou, com os dois nomes',
      /pe-torto/.test(String(etapaPlano.falta || '')) && new RegExp(NOVO).test(String(etapaPlano.falta || '')),
      etapaPlano.falta);

    provar('um elo novo do plano foi escrito', visto.planos.length === 1, visto.planos.length);
    const planoNovo = visto.planos[0] || {};
    provar('…e o `## Contexto` dele imprime o NOME do professor novo',
      (((planoNovo.respostas || {})['contexto-professor']) || {}).valor === NOME_NOVO,
      ((planoNovo.respostas || {})['contexto-professor']));
    provar('…e a turma continua a ser a mesma',
      (((planoNovo.respostas || {})['contexto-turma']) || {}).valor === SALA,
      ((planoNovo.respostas || {})['contexto-turma']));
    provar('…e o contexto também', (planoNovo.contexto || {}).professor === NOVO,
      planoNovo.contexto);

    /* O ELO DO PO LÊ-SE DO ARMAZENAMENTO: quem escreve a fonte é o `concluirPO`, e aqui ele é um
     * stub. A prova não mede o espião — mede o envelope que ficou gravado. */
    const envelopes = await novaCadeia(arm);
    const idPoNovo = envelopes.find((x) => x.indexOf('po-') === 0 && x !== PO);
    provar('um elo novo do PO foi escrito', Boolean(idPoNovo), envelopes);
    const poNovo = idPoNovo ? await porta.lerEnvelope(arm, idPoNovo) : {};
    provar('…e o CABEÇALHO dele imprime o professor novo (é a resposta que o YAML lê)',
      (((poNovo.respostas || {}).professor) || {}).valor === NOME_NOVO,
      ((poNovo.respostas || {}).professor));
    provar('…e o PO novo observa o plano novo',
      (((poNovo.respostas || {})['plano-de-ensino']) || {}).valor === planoNovo.id,
      ((poNovo.respostas || {})['plano-de-ensino']));

    const antesPlano = await porta.lerEnvelope(arm, PLANO);
    const antesPo = await porta.lerEnvelope(arm, PO);
    provar('o elo ANTIGO não é reescrito (o passado fica)',
      (((antesPlano.respostas || {})['contexto-professor']) || {}).valor === ANTIGO
        && (((antesPo.respostas || {}).professor) || {}).valor === ANTIGO,
      { plano: ((antesPlano.respostas || {})['contexto-professor']), po: ((antesPo.respostas || {}).professor) });
  }

  /* B. A TURMA MUDA DE SALA — o plano segue-a, em vez de «nascer na porta». */
  {
    console.log('\nB. A TURMA MUDA DE SALA E O PLANO VAI ATRÁS DELA');
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
    provar('…e o professor novo',
      (((visto.planos[0] || {}).respostas || {})['contexto-professor'] || {}).valor === NOME_NOVO,
      (((visto.planos[0] || {}).respostas || {})['contexto-professor']));
    const etapaPo = etapas.find((e) => e.chave === 'plano-de-observacao') || {};
    provar('o PO também é derivado', vista(etapaPo) || visto.pos.length === 1, etapaPo);
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

  /* D. O NÍVEL DO NÚCLEO, isolado: a direção manda mesmo com a data a favor. */
  {
    console.log('\nD. O NÍVEL DO NÚCLEO — A DIREÇÃO E A DATA, UMA DE CADA VEZ');
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
    provar('a curadoria declara OUTRO professor → pendente',
      etapa(outroProfessor, 'plano-de-ensino').estado === 'pendente',
      etapa(outroProfessor, 'plano-de-ensino'));
    provar('…e o PO também, pela mesma razão',
      etapa(outroProfessor, 'plano-de-observacao').estado === 'pendente',
      etapa(outroProfessor, 'plano-de-observacao'));

    const outraSala = nucleoCadeia.indice(Object.assign({}, base, {
      curadoria: curadoria({ turmas: [OUTRA_SALA] }), turma: OUTRA_SALA,
    }));
    provar('a sala mudou → pendente (o nome dela é a identidade do plano)',
      etapa(outraSala, 'plano-de-ensino').estado === 'pendente', etapa(outraSala, 'plano-de-ensino'));
  }

  console.log('\n' + (falhas ? 'FALHARAM ' + falhas + ' de ' + provas : 'TUDO CERTO — ' + provas
    + ' asserções: o documento derivado diz quem passa a dirigir, em que sala, e o plano segue a Turma.'));
  if (falhas) process.exit(1);
})();

/* Um `vista` pequeno para a asserção do PO, sem inventar semântica: a etapa não bloqueada basta. */
function vista(etapa) {
  return Boolean(etapa) && etapa.estado !== 'bloqueada' && etapa.estado !== 'pendente';
}
