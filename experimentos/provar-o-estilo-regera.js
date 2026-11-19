#!/usr/bin/env node
'use strict';

/**
 * provar-o-estilo-regera.js — EDITAR UM EXERCÍCIO QUE UMA TURMA USA REGERA OS DOCUMENTOS (T5, 19/11/2026).
 *
 * A DECISÃO DELA, entre as três que estavam à mesa: **regerar automaticamente**. E aqui a travessia
 * não é a dos outros passos — **o plano não muda** (o professor não escreveu outra coisa): o que muda
 * é a LEITURA que os documentos fazem do exercício, a notação e o glossário. É um **regerar**, não um
 * derivar. Inventar um elo novo faria o passado dizer que alguém reescreveu uma decisão que ninguém
 * tocou.
 *
 * O QUE SE MEDE, e em que camada:
 *
 *   §A QUEM USA — `turmasQueUsamOTermo` responde pela COMPOSIÇÃO do mapa (as duas camadas: o
 *      `repertorio` da curadoria e o mapa antigo, enquanto ele falar), e devolve NOMES. Um termo
 *      que ninguém usa não devolve nada — e é isso que separa «a notação mudou» de «um documento
 *      tem de ser refeito».
 *   §B O DISPARO — `gerarOsCiclosDoTermo` dispara **uma** geração por (professor, ciclo, turma) que
 *      tem plano, e nenhuma quando não há. O `fetch` global é substituído por um GitHub de mentira
 *      que CONTA os despachos: sem contador, uma prova de «disparou» mede a intenção.
 *   §C O QUE NÃO SE PERDE — um disparo que falha não desfaz a gravação do verbete: a resposta leva o
 *      erro, e o ato fica. É a mesma regra do elenco («a falha do disparo não desfaz o ato»).
 *
 * O CONTROLADOR NEGATIVO. Contra o `motor/servidor/bastidores.js` de antes desta correcção,
 * **9 das 12** reprovam: as duas funções não existem (e a prova degrada, em vez de estourar), nada é
 * disparado, e o mapa antigo continuaria a contar depois de migrado. Se o negativo passar, a prova
 * não está a medir nada.
 *
 *   node experimentos/provar-o-estilo-regera.js
 */

const path = require('path');

const raiz = path.resolve(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));

/* DEGRADA, NÃO REBENTA — é o que faz o controlo negativo medir em vez de estourar. Contra o código
 * de antes desta correcção as duas funções não existem; sem esta linha a prova morria num
 * `TypeError` e não dizia quantas asserções falham. */
const turmasQueUsam = typeof bastidores.turmasQueUsamOTermo === 'function'
  ? bastidores.turmasQueUsamOTermo
  : async () => [];
const regerar = typeof bastidores.gerarOsCiclosDoTermo === 'function'
  ? bastidores.gerarOsCiclosDoTermo
  : async () => ({ disparos: [], turmas: [] });

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'breu';
const RAIZ = 'bastidores/' + ESCOLA;

function criarKV(inicial) {
  const memoria = new Map(Object.entries(inicial || {}));
  return {
    memoria,
    async get(k) { return memoria.has(k) ? memoria.get(k) : null; },
    async put(k, v) { memoria.set(k, String(v)); },
    async delete(k) { memoria.delete(k); },
    async list({ prefix } = {}) {
      const nomes = [...memoria.keys()].filter((k) => !prefix || k.indexOf(prefix) === 0);
      return { keys: nomes.map((name) => ({ name })), list_complete: true };
    },
  };
}

const SALA_ROSA = { id: 'rosa', nome: 'Rosa', professor: 'pe-torto', modalidade: 'Balé clássico', ordem: 1 };
const SALA_LILAS = { id: 'lilas', nome: 'Lilás', professor: 'pe-torto', modalidade: 'Balé clássico', ordem: 2 };

/* O PLANO DE ENSINO — o que o `paresComPlano` lê é o ÍNDICE (`envelope/plano-*.json`), e é de lá
 * que sai o par (professor, turma, ciclo). A fixture é o resumo mínimo que ele entende. */
const PLANO_ROSA = {
  id: 'plano-20261110-1300', gerado_em: '2026-11-10T13:00:00.000Z',
  contexto: { escola: ESCOLA, professor: 'pe-torto', ciclo: '01', turma: 'Rosa' },
};

const ambiente = (kv) => ({
  ESCOLA_SLUG: ESCOLA, SENHA_ADMIN: 'segredo', GITHUB_TOKEN: 'token-de-prova', PADD_KV: kv,
});

/** O GITHUB DE MENTIRA: conta os despachos e aceita-os. Sem contador não se mede «disparou». */
function githubDeMentira({ falhar = false } = {}) {
  const despachos = [];
  return {
    despachos,
    fetch: async (url) => {
      const u = String(url);
      if (u.indexOf('/actions/workflows/') !== -1) {
        if (falhar) return new Response('{"message":"server error"}', { status: 500 });
        despachos.push(u);
        return new Response(null, { status: 204 });
      }
      return new Response('{}', { status: 404 });
    },
  };
}

async function comGitHub(github, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = github.fetch;
  try { return await fn(); } finally { globalThis.fetch = original; }
}

async function principal() {
  /* =========================================================================================== */
  console.log('\nA. Quem usa este exercício — a resposta vem da composição, e é em nomes');

  const kv = criarKV({
    [RAIZ + '/turmas']: JSON.stringify([SALA_ROSA, SALA_LILAS]),
    [RAIZ + '/curadorias']: JSON.stringify([
      { id: 'c-rosa', substituidaPor: null, turmas: ['Rosa'], repertorio: ['plie'] },
      { id: 'c-lilas', substituidaPor: null, turmas: ['Lilás'], repertorio: ['battement-tendu'] },
    ]),
  });
  const env = ambiente(kv);

  const doPlie = await turmasQueUsam(env, ESCOLA, 'Plié');
  provar('o exercício que uma Turma declara responde pelo NOME da Turma',
    doPlie.length === 1 && doPlie[0] === 'Rosa', doPlie);
  provar('…e um exercício que ninguém usa não devolve Turma nenhuma',
    (await turmasQueUsam(env, ESCOLA, 'Battement fondu')).length === 0);
  provar('…e o nome casa pelo id: «Plié» e `plie` são o mesmo exercício',
    (await turmasQueUsam(env, ESCOLA, 'plie')).length === 1);

  /* O MAPA ANTIGO AINDA FALA (enquanto a escola não foi migrada, T4): o exercício que só lá está
   * conta para a pergunta. Depois da marca, deixa de contar — o par que prova o fecho é da §C. */
  const kvComMapa = criarKV({
    [RAIZ + '/turmas']: JSON.stringify([SALA_ROSA, SALA_LILAS]),
    [RAIZ + '/curadorias']: JSON.stringify([]),
    [RAIZ + '/turma-conteudos']: JSON.stringify({ lilas: ['battement-fondu'] }),
  });
  const soNoMapa = await turmasQueUsam(ambiente(kvComMapa), ESCOLA, 'Battement fondu');
  provar('o mapa antigo ainda conta enquanto não foi migrado — a composição é uma só',
    soNoMapa.length === 1 && soNoMapa[0] === 'Lilás', soNoMapa);

  /* =========================================================================================== */
  console.log('\nB. O disparo — uma geração por Turma com plano, e nenhuma sem');

  const kvDoPlano = criarKV({
    [RAIZ + '/turmas']: JSON.stringify([SALA_ROSA, SALA_LILAS]),
    [RAIZ + '/curadorias']: JSON.stringify([
      { id: 'c-rosa', turmas: ['Rosa'], repertorio: ['plie'] },
      { id: 'c-lilas', turmas: ['Lilás'], repertorio: ['plie'] },
    ]),
    /* O PAR (professor, turma, ciclo) sai do RESUMO do índice — é de lá que `paresComPlano` o lê,
     * e não do envelope. A fixture traz o mínimo que o índice guarda. */
    /* A CHAVE FÍSICA no KV leva o slug da escola na frente (`envelope/` é agnóstico de escola, e
     * o adaptador namespaça-o) — a chave LÓGICA é a que o núcleo vê. */
    [ESCOLA + '/envelope/.indice.json']: JSON.stringify({
      nomes: [PLANO_ROSA.id + '.json'],
      resumos: {
        [PLANO_ROSA.id + '.json']: {
          id: PLANO_ROSA.id, gerado_em: PLANO_ROSA.gerado_em,
          professor: 'pe-torto', turma: 'Rosa', ciclo: '01',
        },
      },
    }),
  });
  const envDoPlano = ambiente(kvDoPlano);

  const semNinguem = await regerar(envDoPlano, ESCOLA, 'Battement fondu');
  provar('um exercício que ninguém usa não dispara nada', semNinguem.disparos.length === 0,
    semNinguem.disparos);
  provar('…e a resposta diz porquê, em vez de ficar em silêncio',
    /nenhuma Turma usa/i.test(String(semNinguem.aviso)), semNinguem.aviso);

  /* AS DUAS TURMAS USAM O `plie`, mas só a Rosa tem plano: uma geração, e a outra dita. */
  const github = githubDeMentira();
  const comPlano = await comGitHub(github, () => regerar(envDoPlano, ESCOLA, 'Plié'));
  provar('as Turmas que usam o exercício são ditas na resposta',
    comPlano.turmas.length === 2, comPlano.turmas);
  provar('só a Turma que TEM plano gera — uma geração, não duas',
    github.despachos.length === 1, github.despachos);
  provar('…e o despacho nomeia a variante da Turma certa (a que tem o plano, e não a outra)',
    /-rosa$/.test(String(comPlano.disparos[0] && comPlano.disparos[0].variante))
      && comPlano.disparos[0].ok !== false,
    comPlano.disparos[0]);

  /* =========================================================================================== */
  console.log('\nC. O que não se perde — um disparo que falha não desfaz a notação gravada');

  const githubQueFalha = githubDeMentira({ falhar: true });
  const falhou = await comGitHub(githubQueFalha,
    () => regerar(envDoPlano, ESCOLA, 'Plié'));
  provar('o disparo falhado aparece na resposta, e não é escondido',
    falhou.disparos.length === 1 && falhou.disparos[0].ok === false, falhou.disparos);
  provar('…e a travessia não rebenta: o ato de gravar aconteceu antes, e não é desfeito',
    Boolean(falhou.turmas && falhou.turmas.length === 2), falhou.turmas);

  /* E O FECHO DO T4 VALE AQUI TAMBÉM: depois da marca, o mapa antigo não conta para a pergunta —
   * senão o exercício que ficou na memória continuaria a regerar documentos para sempre. */
  await kvComMapa.put(RAIZ + '/conteudos-migrados', JSON.stringify({ em: '2026-11-19T10:00:00.000Z' }));
  const depoisDaMarca = await turmasQueUsam(ambiente(kvComMapa), ESCOLA, 'Battement fondu');
  provar('depois de migrada, o mapa antigo deixa de contar — a memória não faz regerar',
    depoisDaMarca.length === 0, depoisDaMarca);

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: a pergunta «que Turmas usam este exercício» responde '
      + 'pela composição e em nomes; editar o verbete regera uma vez por Turma com plano, e nenhuma '
      + 'quando não há alvo — e diz-se; e um disparo que falha não desfaz a gravação.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
