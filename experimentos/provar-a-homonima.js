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
const NAM_A_ANTIGA = 'anamnese-20261116-2201';
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

function envelope({ id, aluna, alunaId, professor, turma, plano, sujeitos }) {
  const contexto = { escola: ESCOLA, professor: professor || 'demi-plie', ciclo: null };
  if (aluna) contexto.aluna = aluna;
  if (alunaId) contexto.alunaId = alunaId;
  const respostas = {};
  if (turma) respostas['contexto-turma'] = resposta(turma);
  if (plano) respostas['plano-de-ensino'] = resposta([plano]);
  if (sujeitos) respostas.sujeitos = resposta(sujeitos);
  return { id, contexto, respostas, gerado_em: '2026-11-19T10:00' };
}

/** A LISTAGEM da Área do Professor, montada com os envelopes que o caso pede. */
async function listagem({ anamneses, plano, po }) {
  const kv = kvDeMentira();
  const env = { ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', PADD_KV: kv };
  const arm = producao.__armazenamento(env);
  const docs = (anamneses || []).slice();
  if (plano) docs.push(envelope(Object.assign({ id: plano.id, turma: plano.turma }, plano)));
  if (po) {
    docs.push(envelope({ id: po.id, plano: po.plano, professor: po.professor,
      sujeitos: po.sujeitos || [] }));
  }
  for (const d of docs) await porta.gravarEnvelope(arm, d, relatorioDe(d.id));
  const pagina = await listasDoAcervo.pagina('/area-do-professor/anamnese/', {
    env, menu: null, escola: ESCOLA, curadorias: CURADORIAS, linhasDeBase: LINHAS,
  });
  const html = pagina ? pagina.html : '';
  const cartoes = [...html.matchAll(/<li class="trio-plano"[\s\S]*?<\/li>/g)].map((m) => m[0]);
  const semTags = (c) => c.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const daAluna = (nome, carimbo) => cartoes.find((c) => c.indexOf(carimbo) !== -1
    && semTags(c).indexOf(nome) !== -1) || '';
  const nomeDoCartao = (c) => {
    const m = /<b>([\s\S]*?)<\/b>/.exec(c);
    return m ? m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim() : '';
  };
  const quantas = (nome) => cartoes.filter((c) => nomeDoCartao(c) === nome).length;
  return { html, cartoes, daAluna, quantas };
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
  console.log('\nC. A listagem da anamnese: uma linha por sujeito, e o selo do REGISTO');

  {
    /* AS DUAS SITUAÇÕES QUE O DOCUMENTO DISTINGUE (`experimentos/po/README.md` §7, §5.24):
     *   · o registo não está preso a nenhum Plano de Observação → `solta`: edita-se e apaga-se,
     *     mesmo que a aluna esteja numa turma. É a negativa que a prova da regra mede — «a aluna de
     *     um elenco **sem** PO continua livre»;
     *   · um PO observa a turma em cujo elenco ela está → `vinculada`: só se acrescenta elo. */
    const semPo = await listagem({
      anamneses: [
        envelope({ id: NAM_ANTIGA_B, aluna: 'Aluna B' }),
        envelope({ id: NAM_NOVA_B, aluna: 'Aluna B', alunaId: 'aluna-b-2', professor: 'bom-bom' }),
        envelope({ id: NAM_A, aluna: 'Aluna A', alunaId: 'aluna-a-3' }),
        envelope({ id: NAM_A_ANTIGA, aluna: 'Aluna A' }),
        envelope({ id: NAM_SOLTA, aluna: 'Aluna C' }),
      ],
    });
    const novaB = semPo.daAluna('Aluna B', NAM_NOVA_B);
    provar('a anamnese da aluna B NOVA não leva o selo «desligada»',
      novaB !== '' && !/selo legado">desligada</.test(novaB), novaB.slice(0, 200));
    provar('…e é a ÚNICA linha daquele sujeito — as duas versões do mesmo apelido são uma linha',
      semPo.quantas('Aluna B') === 1, semPo.quantas('Aluna B'));
    provar('…e a linha diz que guardou a anterior',
      /1 versão anterior guardada/.test(novaB), novaB.slice(0, 200));

    const daA = semPo.daAluna('Aluna A', NAM_A);
    provar('sem PO, a aluna A está numa turma mas o registo é «solta» — o cadeado é do PO',
      /class="selo livre"[^>]*>solta</.test(daA), daA.slice(0, 260));
    provar('…e a linha diz a turma e a linha de base, que é o facto da PESSOA',
      /turma Rosa · linha de base «Tami»/.test(daA), null);
    provar('…e oferece «Apagar», porque nada a prende',
      /data-apagar="/.test(daA), (daA.match(/data-apagar="[^"]*"/) || [])[0]);

    /* COM O PO — o mesmo retrato, agora observado. É a outra metade da regra. */
    const comPo = await listagem({
      anamneses: [
        envelope({ id: NAM_A, aluna: 'Aluna A', alunaId: 'aluna-a-3' }),
        envelope({ id: NAM_SOLTA, aluna: 'Aluna C' }),
      ],
      plano: { id: 'plano-rosa', turma: 'Rosa', professor: 'demi-plie' },
      po: { id: 'po-rosa', plano: 'plano-rosa', professor: 'demi-plie' },
    });
    const daAComPo = comPo.daAluna('Aluna A', NAM_A);
    provar('com um PO a observar a turma, o registo passa a «vinculada»',
      /class="selo vinculada"[^>]*>vinculada</.test(daAComPo), daAComPo.slice(0, 260));
    provar('…e deixa de oferecer «Apagar»', !/data-apagar=/.test(daAComPo),
      (daAComPo.match(/data-apagar="[^"]*"/) || [])[0]);
    provar('…e oferece «Novo registo», que é o gesto certo para um retrato novo',
      /Novo registo/.test(daAComPo), null);
    /* A ALUNA C não tem turma nem linha de base: é «nova», e nada a prende. É o outro ramo da
     * mesma pergunta — o PO existe, mas não a observa. */
    provar('a aluna C, que ninguém observa, continua «nova» e apagável',
      /class="selo livre"[^>]*>nova</.test(comPo.daAluna('Aluna C', NAM_SOLTA))
        && /data-apagar=/.test(comPo.daAluna('Aluna C', NAM_SOLTA)),
      comPo.daAluna('Aluna C', NAM_SOLTA).slice(0, 200));
  }

  /* ========================================================================================= */
  console.log('\nD. A guarda do apagar pergunta o mesmo que o selo');

  {
    const kv = kvDeMentira();
    const env = { ESCOLA_SLUG: ESCOLA, SENHA_ADMIN: 's', PADD_KV: kv };
    const arm = producao.__armazenamento(env);
    for (const d of [
      envelope({ id: NAM_A, aluna: 'Aluna A', alunaId: 'aluna-a-3' }),
      envelope({ id: NAM_SOLTA, aluna: 'Aluna C' }),
      envelope({ id: 'plano-rosa', aluna: null, turma: 'Rosa' }),
      envelope({ id: 'po-rosa', aluna: null, plano: 'plano-rosa', sujeitos: [] }),
    ]) await porta.gravarEnvelope(arm, d, relatorioDe(d.id));

    const elenco = { linhas: LINHAS, curadorias: CURADORIAS };
    const estado = async (id) => porta.estadoDaAnamnese(arm,
      await porta.lerEnvelope(arm, id), elenco);

    const daA = await estado(NAM_A);
    provar('com o PO, o estado da anamnese da aluna A é «vinculada»',
      daA.vinculada === true, daA);
    provar('…e a recusa nomeia o PO', (daA.por || []).length > 0, daA.por);

    const solta = await estado(NAM_SOLTA);
    provar('a anamnese de quem ninguém observa é «solta»', solta.vinculada === false, solta);
  }

  /* ========================================================================================= */
  console.log('\nE. O «sujeitos» de um PO novo nasce do elenco — e o corpo não o escreve');

  {
    /* O CASO, medido na «breu»: o preenchedor de teste escrevia o `sujeitos` do fixture — três
     * nomes de uma escola de teste — e o PO gravava-os. A «Aluna B» passou a ler-se «vinculada»
     * sem nunca ter estado em elenco nenhum, e a mesma linha dizia «sem turma e sem linha de
     * base». As duas frases eram verdade sobre coisas diferentes (o registo e a pessoa) e,
     * juntas, mentiam. O `sujeitos` é a única cópia do elenco num documento, e uma cópia que não
     * veio do elenco não é proveniência: é invenção. */
    const conteudoPO = require(path.join(raiz, 'porta/po/conteudo/po.json'));
    const elenco = { linhas: LINHAS, curadorias: CURADORIAS };
    const contexto = { escola: ESCOLA, professor: 'demi-plie', ciclo: '01' };
    const inventados = ['Aluna A', 'Aluna B', 'Aluna C'];

    async function gravar(corpo) {
      const kv = kvDeMentira();
      const arm = producao.__armazenamento({ ESCOLA_SLUG: ESCOLA, PADD_KV: kv });
      await porta.gravarEnvelope(arm,
        envelope({ id: 'plano-rosa', turma: 'Rosa', professor: 'demi-plie' }), relatorioDe('plano-rosa'));
      const r = await porta.elicitar(arm, Object.assign({ fonte: 'po', contexto }, corpo), {
        conteudoPO, esquema: {}, elenco, agora: () => '2026-11-19T13:00',
      });
      const env = r.gravado ? await porta.lerEnvelope(arm, r.id) : null;
      return { r, sujeitos: env ? (env.respostas.sujeitos || {}).valor : null };
    }

    const novo = await gravar({
      respostas: { 'plano-de-ensino': resposta('plano-rosa'), sujeitos: resposta(inventados) },
    });
    provar('um PO novo grava os sujeitos DO ELENCO, e não os do corpo',
      JSON.stringify(novo.sujeitos) === '["Aluna A"]', novo.sujeitos);
    provar('…e diz na resposta o que tirou do corpo',
      JSON.stringify((novo.r.sujeitosDoElenco || {}).tirados) === '["Aluna B","Aluna C"]',
      novo.r.sujeitosDoElenco);

    /* O PASSADO NÃO SE RE-SEMEIA. A derivação é um elo novo com o conteúdo do anterior: os
     * sujeitos que ele declara são a linha de base daquele momento, e re-semeá-los com o elenco
     * de hoje reescreveria o passado — o modo de falha que a proveniência existe para impedir. */
    const derivado = await gravar({
      ajuste_de: 'po-rosa', motivo: 'corrigir a digitação',
      respostas: { 'plano-de-ensino': resposta('plano-rosa'), sujeitos: resposta(inventados) },
    });
    provar('um PO DERIVADO mantém os sujeitos que o anterior declarou',
      JSON.stringify(derivado.sujeitos) === JSON.stringify(inventados), derivado.sujeitos);
    provar('…e a resposta não anuncia substituição nenhuma',
      derivado.r.sujeitosDoElenco === undefined, derivado.r.sujeitosDoElenco);
  }

  console.log('\n' + (falhas
    ? 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'
    : 'TUDO CERTO — ' + provas + ' asserções: o apelido é rótulo e o id é identidade; quem chegou '
      + 'não herda a memória da homónima; a listagem da anamnese diz o estado do REGISTO pelas '
      + 'palavras do documento (solta/vinculada/nova), o cadeado continua a ser o Plano de '
      + 'Observação, e os sujeitos de um PO novo vêm do elenco.'));
  process.exit(falhas ? 1 : 0);
})().catch((erro) => {
  console.error('erro na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
