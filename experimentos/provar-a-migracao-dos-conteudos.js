#!/usr/bin/env node
'use strict';

/**
 * provar-a-migracao-dos-conteudos.js — O MAPA ANTIGO PASSA PARA O `repertorio`, E FECHA (T4, 19/11/2026).
 *
 * A DECISÃO DELA, nas palavras com que escolheu entre as três: *«migrar»*. O mapa
 * `turma-conteudos` era o dono antigo dos conteúdos de uma turma; a 03/11/2026 o dono passou a ser
 * o `repertorio` da curadoria, e o mapa ficou a ser **lido** como memória (a regra de 07/11: ele
 * fala pelas turmas que nunca tiveram curadoria). Enquanto for lido, há dois donos do mesmo facto —
 * e dois donos divergem.
 *
 * O QUE SE MEDE, e em que camada:
 *
 *   §A o NÚCLEO — `migrarMapaAntigo`. O que entra, o que não entra, e o que não tem para onde ir.
 *      A migração **não inventa destino**: uma turma sem curadoria vigente não recebe nada, e uma
 *      curadoria que ensina duas turmas também não serve (o repertório é um só, e migrar daria à
 *      outra o que não é dela).
 *   §B a ROTA — `POST /api/bastidores/migrar-conteudos`. `simular` não escreve; com `semDestino` a
 *      leitura NÃO é fechada (409, e a marca não é gravada); sem `semDestino`, as curadorias e a
 *      marca são escritas.
 *   §C o EFEITO DA MARCA — depois de migrada, a escola deixa de ler o mapa: um termo que só existia
 *      nele **desaparece**, e antes de migrada ele **aparece**. É o par que prova a mudança.
 *   §D O FECHO DA ESCRITA — as rotas antigas (`POST`/`DELETE /api/bastidores/turma-conteudo`)
 *      recusam com o caminho certo, e não escrevem nada.
 *
 * O CONTROLADOR NEGATIVO. Contra o `motor/nucleo/conteudos.js` e o `motor/servidor/bastidores.js` de
 * antes desta correcção, **14 das 24** reprovam: o núcleo não tem a migração (e a prova degrada, em
 * vez de estourar), a rota não existe, e as duas rotas antigas continuam a escrever. Se o negativo
 * passar, a prova não está a medir nada.
 *
 *   node experimentos/provar-a-migracao-dos-conteudos.js
 */

const path = require('path');

const raiz = path.resolve(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
const conteudos = require(path.join(raiz, 'motor/nucleo/conteudos.js'));

/* DEGRADA, NÃO REBENTA — e é isto que faz o controlo negativo medir em vez de estourar. Contra o
 * código de antes desta correcção a função não existe; sem esta linha a prova morria com um
 * `TypeError` e não dizia quantas asserções falham. Com ela, as asserções do núcleo correm contra
 * um plano vazio e reprovam uma a uma. */
const migrar = typeof conteudos.migrarMapaAntigo === 'function'
  ? conteudos.migrarMapaAntigo
  : ({ curadorias } = {}) => ({
    curadorias: Array.isArray(curadorias) ? curadorias : [], migradas: [], semDestino: [], mudou: false,
  });

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

const ambiente = (kv) => ({
  ESCOLA_SLUG: ESCOLA, SENHA_ADMIN: 'segredo', GITHUB_TOKEN: 'token-de-prova', PADD_KV: kv,
});

async function pedir(env, caminho, corpo) {
  const pedido = new Request('https://breu.workers.dev' + caminho, corpo
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) }
    : {});
  const resposta = await bastidores.fetch(pedido, env);
  let dados = null;
  try { dados = await resposta.json(); } catch { dados = null; }
  return { status: resposta.status, dados };
}

const TURMA = {
  id: 'pe-torto-bale-classico-rosa', professor: 'pe-torto', modalidade: 'Balé clássico',
  tradicao: 'francesa', grau: '1', nivel: 'Nível 1', turmas: ['Rosa'],
  linhaDeBase: 'elenco-1', alunas: ['aluna-a'],
};
const SALA = {
  id: 'rosa', nome: 'Rosa', professor: 'pe-torto', modalidade: 'Balé clássico',
  dias: ['segunda'], horarios: { segunda: '18:00' },
  duracaoMin: 60, periodoInicio: '2026-11-02', periodoFim: '2026-12-20', ordem: 1,
};

async function principal() {
  /* =========================================================================================== */
  console.log('\nA. O núcleo — o que entra, o que não entra, e o que não tem destino');

  const base = {
    legado: { rosa: ['plie', 'battement-tendu'], 'turma-orfa': ['plie'] },
    curadorias: [Object.assign({}, TURMA, { repertorio: ['Plié'] })],
    turmas: [SALA],
  };
  const plano = migrar(base);
  const alvo = plano.curadorias[0];
  provar('o que já estava declarado não se duplica — «Plié» e `plie` são o mesmo termo',
    alvo.repertorio.filter((x) => conteudos.idDeTermo(x) === 'plie').length === 1, alvo.repertorio);
  provar('…e o que faltava entra',
    conteudos.idDeTermo(alvo.repertorio[alvo.repertorio.length - 1]) === 'battement-tendu',
    alvo.repertorio);
  provar('…na ordem da declaração: o que a curadoria declara primeiro, o do mapa no fim',
    conteudos.idDeTermo(alvo.repertorio[0]) === 'plie', alvo.repertorio);
  provar('a turma sem curadoria vigente NÃO é migrada, e o motivo é dito',
    plano.semDestino.length === 1 && plano.semDestino[0].id === 'turma-orfa'
      && /curadoria vigente/.test(String(plano.semDestino[0].motivo)),
    plano.semDestino);
  provar('…e nada é inventado para ela — a lista de curadorias não ganha uma nova',
    plano.curadorias.length === base.curadorias.length, plano.curadorias.length);

  /* A CURADORIA QUE ENSINA MAIS DE UMA TURMA. Este é o caso que uma cópia cega estragaria: o
   * repertório é um só, e migrar o mapa de uma das turmas daria à outra o que não é dela. */
  const duasTurmas = migrar({
    legado: { rosa: ['plie'], 'outra-sala': ['battement-tendu'] },
    curadorias: [Object.assign({}, TURMA, { turmas: ['Rosa', 'Outra Sala'], repertorio: [] })],
    turmas: [SALA, { id: 'outra-sala', nome: 'Outra Sala' }],
  });
  provar('curadoria que ensina duas turmas não recebe a migração — e diz porquê',
    duasTurmas.migradas.length === 0 && duasTurmas.semDestino.length === 2
      && /ensina 2 turmas/.test(String(duasTurmas.semDestino[0].motivo)),
    duasTurmas.semDestino);

  /* A SUBSTITUÍDA NÃO RECEBE: ela é memória. Quem manda é a vigente. */
  const comSubstituida = migrar({
    legado: { rosa: ['plie'] },
    curadorias: [
      Object.assign({}, TURMA, { id: 'antiga', repertorio: [], substituidaPor: 'nova' }),
      Object.assign({}, TURMA, { id: 'nova', repertorio: [] }),
    ],
    turmas: [SALA],
  });
  provar('a curadoria SUBSTITUÍDA não recebe nada — quem manda é a vigente',
    comSubstituida.migradas.length === 1 && comSubstituida.migradas[0].curadoria === 'nova',
    comSubstituida.migradas);

  /* E É IDEMPOTENTE: correr outra vez sobre o resultado não muda nada. É o que permite retomar uma
   * migração interrompida sem contar termos duas vezes. */
  const segunda = migrar({
    legado: base.legado, curadorias: plano.curadorias, turmas: base.turmas,
  });
  provar('correr a migração duas vezes não muda nada — ela é retomável',
    segunda.migradas.length === 0 && segunda.mudou === false, segunda.migradas);

  /* =========================================================================================== */
  console.log('\nB. A rota — simular não escreve, e sem destino a leitura não fecha');

  const kv = criarKV({
    [RAIZ + '/turmas']: JSON.stringify([SALA]),
    [RAIZ + '/curadorias']: JSON.stringify([Object.assign({}, TURMA, { repertorio: [] })]),
    [RAIZ + '/turma-conteudos']: JSON.stringify({ rosa: ['plie', 'battement-tendu'] }),
  });
  const env = ambiente(kv);
  const curadoriasAntes = await kv.get(RAIZ + '/curadorias');

  const simulado = await pedir(env, '/api/bastidores/migrar-conteudos', {
    senhaDirecao: 'segredo', simular: true,
  });
  provar('simular responde 200 e mostra o que entraria',
    simulado.status === 200 && simulado.dados && simulado.dados.migradas.length === 1,
    simulado.dados && simulado.dados.migradas);
  provar('…e NÃO escreve nada — o KV fica exactamente como estava',
    (await kv.get(RAIZ + '/curadorias')) === curadoriasAntes
      && (await kv.get(RAIZ + '/conteudos-migrados')) === null);

  /* COM DESTINO EM FALTA, A LEITURA NÃO PODE FECHAR. Uma turma do mapa sem curadoria vigente
   * perderia os conteúdos da tela no instante em que a marca fosse escrita. */
  await kv.put(RAIZ + '/turma-conteudos', JSON.stringify({
    rosa: ['plie', 'battement-tendu'], 'turma-orfa': ['plie'],
  }));
  const recusada = await pedir(env, '/api/bastidores/migrar-conteudos', { senhaDirecao: 'segredo' });
  provar('com uma turma sem destino, a migração responde 409', recusada.status === 409, recusada.status);
  provar('…e diz que a leitura não fechou, e porquê',
    Boolean(recusada.dados) && /não fechou a leitura/.test(String(recusada.dados.erro)),
    recusada.dados && recusada.dados.erro);
  provar('…e a marca NÃO é gravada — o mapa continua a falar por essa turma',
    (await kv.get(RAIZ + '/conteudos-migrados')) === null);
  provar('…e a curadoria também não é tocada: nada de meia migração',
    (await kv.get(RAIZ + '/curadorias')) === curadoriasAntes);

  await kv.put(RAIZ + '/turma-conteudos', JSON.stringify({ rosa: ['plie', 'battement-tendu'] }));
  const feito = await pedir(env, '/api/bastidores/migrar-conteudos', { senhaDirecao: 'segredo' });
  provar('sem destino em falta, migra e responde 200',
    feito.status === 200 && feito.dados && feito.dados.migradas.length === 1, feito.status);
  const curadoriasDepois = JSON.parse(await kv.get(RAIZ + '/curadorias'))[0];
  provar('…e o repertório da curadoria passou a ter os dois termos',
    curadoriasDepois.repertorio.map(conteudos.idDeTermo).sort().join(',')
      === 'battement-tendu,plie', curadoriasDepois.repertorio);
  provar('…e a marca foi gravada — é ela que fecha a leitura',
    Boolean(await kv.get(RAIZ + '/conteudos-migrados')));

  /* =========================================================================================== */
  console.log('\nC. O efeito da marca — antes de migrar o mapa fala, depois cala-se');

  /* O PAR QUE PROVA A MUDANÇA, e é o mesmo pedido nos dois lados: um termo que só existe no MAPA.
   * Antes da marca, ele aparece (é a memória a falar pela turma); depois, não. */
  const comResto = async (migrada) => {
    const k = criarKV({
      [RAIZ + '/turmas']: JSON.stringify([SALA]),
      [RAIZ + '/curadorias']: JSON.stringify([Object.assign({}, TURMA,
        { repertorio: ['plie', 'battement-tendu', 'battement-fondu'] })]),
    });
    // O mapa guarda um termo que NINGUÉM declarou (o resíduo de uma rodada de testes).
    await k.put(RAIZ + '/turma-conteudos', JSON.stringify({
      'turma-sem-curadoria': ['battement-fondu-de-outubro'],
    }));
    if (migrada) await k.put(RAIZ + '/conteudos-migrados', JSON.stringify({ em: '2026-11-19T10:00:00.000Z' }));
    const r = await pedir(ambiente(k), '/api/bastidores/turma-conteudos');
    return (r.dados && r.dados.relacoes) || {};
  };
  const antes = await comResto(false);
  const depois = await comResto(true);
  provar('antes de migrar, o mapa antigo ainda fala — a turma sem curadoria aparece na relação',
    Array.isArray(antes['turma-sem-curadoria']) && antes['turma-sem-curadoria'].length === 1,
    antes['turma-sem-curadoria']);
  provar('…e depois de migrar, ele cala-se: a mesma chave desaparece',
    depois['turma-sem-curadoria'] === undefined, depois['turma-sem-curadoria']);
  provar('…e o que a curadoria declara continua lá — fechar a memória não fecha a declaração',
    Array.isArray(depois.rosa) && depois.rosa.indexOf('plie') !== -1, depois.rosa);

  /* =========================================================================================== */
  console.log('\nD. O fecho da escrita — as rotas antigas recusam, e dizem por onde');

  const kvDoFecho = criarKV({
    [RAIZ + '/turmas']: JSON.stringify([SALA]),
    [RAIZ + '/turma-conteudos']: JSON.stringify({ rosa: [] }),
  });
  const envDoFecho = ambiente(kvDoFecho);
  const mapaAntes = await kvDoFecho.get(RAIZ + '/turma-conteudos');

  const associar = await pedir(envDoFecho, '/api/bastidores/turma-conteudo', {
    senhaDirecao: 'segredo', turma: 'Rosa', termo: 'plie',
  });
  provar('POST /turma-conteudo recusa com 409 — a rota existe, o caminho é que está errado',
    associar.status === 409, associar.status);
  provar('…e a frase nomeia o sítio certo (o formulário da Turma)',
    Boolean(associar.dados) && /repertório/.test(String(associar.dados.erro))
      && associar.dados.caminho === '/api/bastidores/curadoria',
    associar.dados && associar.dados.erro);

  const pedidoDelete = new Request('https://breu.workers.dev/api/bastidores/turma-conteudo', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaDirecao: 'segredo', turma: 'Rosa', termo: 'plie' }),
  });
  const remover = await bastidores.fetch(pedidoDelete, envDoFecho);
  provar('DELETE /turma-conteudo recusa com 409', remover.status === 409, remover.status);
  provar('…e o mapa não foi tocado por nenhuma das duas',
    (await kvDoFecho.get(RAIZ + '/turma-conteudos')) === mapaAntes);

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o mapa antigo dos conteúdos passa para o repertório '
      + 'da turma sem duplicar e sem inventar destino; a marca só é escrita quando nenhuma turma '
      + 'fica sem para onde ir, e é ela que faz o mapa deixar de falar; e as rotas antigas recusam, '
      + 'dizendo por onde.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
