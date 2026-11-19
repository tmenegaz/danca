#!/usr/bin/env node
'use strict';

/**
 * provar-a-homonima.js — DUAS PESSOAS COM O MESMO APELIDO NÃO SÃO A MESMA PESSOA (19/11/2026).
 *
 * OS DOIS RELATOS DELA, e são um só problema visto de dois lados:
 *
 *   1. «eu criei a aluna B e eu fiz a anamnese da aluna B. E na listagem das alunas cadastradas, tá
 *      dizendo que a aluna B, ela tá desligada. Essa aluna B, ela não é aquela aluna B antiga que
 *      nós fizemos que não tinha CPF, agora tem CPF. […] é um outro CPF, então é uma outra aluna B.
 *      É o homônimo, apenas isso.»
 *   2. «a aluna A na anamnese de alunos tá dizendo que ela é uma aluna livre. Mas essa aluna, ela
 *      tá diretamente ligada a um elenco que está ligado a uma turma. Então ela não é mais uma
 *      aluna livre. […] verificar as validações, porque as validações que você tá usando estão
 *      erradas.»
 *
 * O QUE ESTA PROVA MEDE — e cada alínea reprova sem a correcção:
 *
 *   A. A DERIVAÇÃO, isolada. Com o elenco antigo (`lida` → anamnese sem `alunaId`) e a Turma
 *      substituída, a aluna B NOVA (`aluna-b-2`) não está desligada; a ANTIGA (`aluna-b`, sem id)
 *      continua desligada — a memória não se perdeu, só deixou de ser emprestada.
 *   B. A LISTAGEM DA PRODUÇÃO. O cartão da aluna nova diz «livre»; o da aluna que está na turma
 *      com plano de ensino diz «vinculada».
 *   C. A LISTAGEM DA ANAMNESE. A aluna B nova não leva o selo «desligada»; a anamnese da aluna A,
 *      que um elenco leu e cuja turma a declara, leva «vinculada» e NÃO oferece «Apagar».
 *   D. A GUARDA DO APAGAR. O `DELETE` recusa com 409 o retrato que um elenco leu ou de uma aluna
 *      em turma, e continua a apagar o de quem não está em nada — a validação não pode ser mais
 *      larga do que o facto, senão deixa de ser uma guarda e passa a ser um bloqueio.
 */

const path = require('path');

const raiz = path.resolve(__dirname, '..');
const porta = require(path.join(raiz, 'motor/nucleo/porta.js'));
const producao = require(path.join(raiz, 'motor/servidor/producao.js'));
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
const listasDoAcervo = require(path.join(raiz, 'motor/servidor/listas-do-acervo.js'));
const desligamento = require(path.join(raiz, 'motor/nucleo/desligamento.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); },
    async delete(chave) { dados.delete(chave); },
    async list(op) {
      const prefixo = (op && op.prefix) || '';
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefixo)).map((name) => ({ name })),
        list_complete: true,
      };
    },
    _dados: dados,
  };
}

function relatorioDe(id) {
  return {
    id, estado: 'Input_anamnese_construida', contagem: { respondidos: 0, obrigatorios: 0 },
    elos: [], paradas: [], idsDesconhecidos: [],
    validacao: { resultado: 'aceite', contrato: 'prova' }, errosDoDocumento: [], linhas: [],
  };
}

const ESCOLA = 'breu';
const resposta = (valor) => ({ valor });

/* ------------------------------------------------------------------------------------------- */
/* O PALCO — o estado que ela descreveu: a elenco antigo leu a anamnese da Aluna B de então, a
 * Turma antiga declarava-a, e hoje há uma pessoa NOVA com o mesmo apelido. */

const NAM_ANTIGA_B = 'anamnese-20261117-1407';
const NAM_NOVA_B = 'anamnese-20261119-1145';
const NAM_A = 'anamnese-20261118-1737';
const NAM_SOLTA = 'anamnese-20261120-0900';

const LINHAS = [
  /* O elenco da Aluna A: leu o retrato NOVO (o que declara `aluna-a-3`). */
  { id: 'tami', nome: 'Tami', alunas: ['Aluna A'], lida: { 'Aluna A': NAM_A },
    atualizada_em: '2026-11-18T20:39:00.000Z' },
  /* O elenco da Aluna B ANTIGA: leu o retrato sem id — logo, o primeiro titular do apelido. Ele
   * próprio já foi apagado (é o que acontece quando a aluna sai e o elenco é refeito): é por isso
   * que ela deixou de estar «em elenco vigente» e passou a ler-se «desligada». */
  { id: 'ami', nome: 'Ami', alunas: ['Aluna B'], lida: { 'Aluna B': NAM_ANTIGA_B },
    atualizada_em: '2026-11-18T17:10:00.000Z', apagada_em: '2026-11-18T19:11:02.125Z' },
];

const CURADORIAS = [
  { id: 'demi-plie-bale-classico-rosa', professor: 'demi-plie', modalidade: 'Balé clássico',
    turmas: ['Rosa'], alunas: ['Aluna A'], linhaDeBase: 'tami', vigenteDe: '2026-11-19' },
  /* A passagem antiga da Aluna B: substituída, e é ela que sustenta o «desligada» de quem saiu. */
  { id: 'demi-plie-bale-classico-rosa-antiga', professor: 'demi-plie',
    modalidade: 'Balé clássico', turmas: ['Rosa'], alunas: ['Aluna B'], linhaDeBase: 'ami',
    vigenteDe: '2026-11-18', substituidaPor: 'demi-plie-bale-classico-rosa',
    substituidaEm: '2026-11-19' },
];

const REGISTOS = [
  { id: 'aluna-a-3', apelido: 'Aluna A' },
  /* A NOVA: outro CPF, outro id. É ela que a lista mostra. */
  { id: 'aluna-b-2', apelido: 'Aluna B' },
  /* A ANTIGA: fora da escola, com o mesmo apelido. */
  { id: 'aluna-b', apelido: 'Aluna B', desligadaEm: '2026-11-18' },
];

const ANAMNESES = new Map([[NAM_A, 'aluna-a-3']]);

function envelope({ id, aluna, alunaId, professor }) {
  const contexto = { escola: ESCOLA, professor: professor || 'demi-plie', ciclo: null, aluna };
  if (alunaId) contexto.alunaId = alunaId;
  return { id, contexto, respostas: {}, gerado_em: '2026-11-19T10:00' };
}

(async () => {
  /* ========================================================================================= */
  console.log('\nA. A derivação: o elenco da antiga não é o elenco da nova');

  {
    const nova = desligamento.estadoDaAluna({
      aluna: 'Aluna B', alunaId: 'aluna-b-2', linhas: LINHAS, curadorias: CURADORIAS,
      observada: false, anamneses: ANAMNESES,
    });
    provar('a aluna B NOVA não está desligada', nova.desligada === false, nova);

    const antiga = desligamento.estadoDaAluna({
      aluna: 'Aluna B', alunaId: 'aluna-b', linhas: LINHAS, curadorias: CURADORIAS,
      observada: false, anamneses: ANAMNESES,
    });
    provar('a aluna B ANTIGA continua desligada — a memória não se perdeu',
      antiga.desligada === true, antiga);
    provar('…e diz em que sala esteve', antiga.sala === 'Rosa', antiga.sala);

    const a = desligamento.estadoDaAluna({
      aluna: 'Aluna A', alunaId: 'aluna-a-3', linhas: LINHAS, curadorias: CURADORIAS,
      observada: false, anamneses: ANAMNESES,
    });
    provar('a aluna A está na turma dela, por identidade', a.turma === 'Rosa', a);
    provar('…e não está desligada', a.desligada === false, a);
  }

  /* ========================================================================================= */
  console.log('\nB. A listagem das alunas: «livre» para quem chegou, «vinculada» para quem está na turma');

  {
    const SALAS = [{
      id: 'rosa', nome: 'Rosa', dias: ['seg'], horarios: ['16:30'], duracaoMin: 45,
      frequencia: 1, periodoInicio: '2026-12-14', periodoFim: '2027-02-05', ativo: true,
      professor: 'demi-plie', modalidade: 'Balé clássico',
    }];
    const PROF = [{ nome: 'Demi Plié', slug: 'demi-plie', modalidades: ['Ballet Clássico'] }];
    const PARES = [{ professor: 'demi-plie', turma: 'Rosa', ciclo: '01' }];
    const html = bastidores.paginaProducao(ESCOLA, { escola: ESCOLA }, PROF, ['Aluna A', 'Aluna B'],
      'Demi Plié', 'demi-plie', SALAS, [], {}, CURADORIAS, [], PARES,
      { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 1 },
      { modo: 'clara', paleta: 'bordo' }, null, LINHAS, new Set(), null, [], null, REGISTOS,
      ANAMNESES);
    const secao = html.slice(html.indexOf('id="sec-alunas"'), html.indexOf('id="sec-audicao"'));
    const doCartao = (apelido) => {
      const i = secao.indexOf('data-aluna="' + apelido + '"');
      return i === -1 ? '' : secao.slice(i, i + 900);
    };
    const selo = (pedaco) => ((/class="selo ([a-z]+)"[^>]*>([a-zçã]+)</.exec(pedaco) || [])[2] || '');

    provar('a aluna B nova leva o selo «livre»', selo(doCartao('Aluna B')) === 'livre',
      selo(doCartao('Aluna B')));
    provar('…e NÃO «desligada»', !/desligada<\/span>/.test(doCartao('Aluna B')),
      doCartao('Aluna B').slice(0, 200));
    provar('a aluna A, que está na turma com plano de ensino, leva «vinculada»',
      selo(doCartao('Aluna A')) === 'vinculada', selo(doCartao('Aluna A')));
  }

  /* ========================================================================================= */
  console.log('\nC. A listagem da anamnese: os dois selos que ela leu errados');

  {
    const kv = kvDeMentira();
    const env = { ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', PADD_KV: kv };
    const arm = producao.__armazenamento(env);
    const docs = [
      envelope({ id: NAM_ANTIGA_B, aluna: 'Aluna B' }),
      envelope({ id: NAM_NOVA_B, aluna: 'Aluna B', alunaId: 'aluna-b-2', professor: 'bom-bom' }),
      envelope({ id: NAM_A, aluna: 'Aluna A', alunaId: 'aluna-a-3' }),
      envelope({ id: NAM_SOLTA, aluna: 'Aluna C' }),
    ];
    for (const d of docs) await porta.gravarEnvelope(arm, d, relatorioDe(d.id));

    const pagina = await listasDoAcervo.pagina('/area-do-professor/anamnese/', {
      env, menu: null, escola: ESCOLA, curadorias: CURADORIAS, linhasDeBase: LINHAS,
    });
    const html = pagina ? pagina.html : '';
    const cartoes = [...html.matchAll(/<li class="trio-plano"[\s\S]*?<\/li>/g)].map((m) => m[0]);
    const semTags = (c) => c.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    const daAluna = (nome, carimbo) => cartoes.find((c) => semTags(c).indexOf(nome) !== -1
      && c.indexOf(carimbo) !== -1) || '';

    const novaB = daAluna('Aluna B', NAM_NOVA_B);
    provar('a anamnese da aluna B NOVA não leva o selo «desligada»',
      novaB !== '' && !/selo legado">desligada</.test(novaB), novaB.slice(0, 260));
    provar('…e ela é uma linha própria, não uma «versão anterior» da antiga',
      novaB !== '' && !/versão anterior guardada/.test(novaB), novaB.slice(0, 260));

    const daA = daAluna('Aluna A', NAM_A);
    provar('a anamnese da aluna A leva «vinculada» — o elenco leu-a e a turma declara-a',
      /class="selo vinculada"[^>]*>vinculada</.test(daA), daA.slice(0, 320));
    provar('…e NÃO oferece «Apagar»', daA !== '' && !/data-apagar=/.test(daA),
      (daA.match(/data-apagar="[^"]*"/) || [])[0]);
    provar('…e oferece «Novo registo», que é o gesto certo para um retrato novo',
      /Novo registo/.test(daA), null);

    const solta = daAluna('Aluna C', NAM_SOLTA);
    provar('a anamnese de quem não está em nada continua «nova», e apagável',
      /selo livre">nova</.test(solta) && /data-apagar=/.test(solta), solta.slice(0, 260));
  }

  /* ========================================================================================= */
  console.log('\nD. A guarda do apagar pergunta o mesmo que o selo');

  {
    const elf = { linhas: LINHAS, curadorias: CURADORIAS };
    const kv = kvDeMentira();
    const env = { ESCOLA_SLUG: ESCOLA, SENHA_ADMIN: 's', PADD_KV: kv };
    const arm = producao.__armazenamento(env);
    for (const d of [
      envelope({ id: NAM_A, aluna: 'Aluna A', alunaId: 'aluna-a-3' }),
      envelope({ id: NAM_NOVA_B, aluna: 'Aluna B', alunaId: 'aluna-b-2' }),
      envelope({ id: NAM_ANTIGA_B, aluna: 'Aluna B' }),
      envelope({ id: NAM_SOLTA, aluna: 'Aluna C' }),
    ]) await porta.gravarEnvelope(arm, d, relatorioDe(d.id));

    /* O CONTROLE NEGATIVO NÃO PODE REBENTAR AQUI. Sem a função (o código de antes), as asserções
     * desta secção reprovam — que é o que se quer medir —, e não derrubam a bancada. */
    provar('a guarda da citação existe no núcleo',
      typeof porta.citacaoDaAnamnese === 'function', typeof porta.citacaoDaAnamnese);
    const cit = async (id) => (typeof porta.citacaoDaAnamnese === 'function'
      ? porta.citacaoDaAnamnese(arm, await porta.lerEnvelope(arm, id), elf)
      : { citada: false, por: [], ausente: true });

    const daA = await cit(NAM_A);
    provar('o retrato que o elenco leu está CITADO', daA.citada === true, daA);
    provar('…e a citação nomeia o elenco', /elenco «Tami»/.test(daA.por.join(' · ')), daA.por);
    provar('…e a Turma que a declara', /turma «Rosa»/.test(daA.por.join(' · ')), daA.por);

    const novaB = await cit(NAM_NOVA_B);
    provar('o retrato da aluna B NOVA não é citado pelo elenco da homónima',
      novaB.por.filter((p) => /elenco/.test(p)).length === 0, novaB.por);
    provar('…nem pela Turma antiga', novaB.citada === false, novaB);

    const solta = await cit(NAM_SOLTA);
    provar('o retrato de quem não está em nada não está citado', solta.citada === false, solta);
  }

  console.log('\n' + (falhas
    ? 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'
    : 'TUDO CERTO — ' + provas + ' asserções: o apelido é rótulo e o id é identidade; quem chegou '
      + 'não herda a memória da homónima, e quem já está num elenco ou numa turma não se lê '
      + '«livre» nem se apaga.'));
  process.exit(falhas ? 1 : 0);
})().catch((erro) => {
  console.error('erro na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
