#!/usr/bin/env node
'use strict';

/*
 * provar-dono-do-expurgo.js — de QUEM é a escola, quando o expurgo vai apagar.
 *
 * O DEFEITO, e ele é de 02/11/2026: o expurgo da `batata` deixou no repositório o
 * `professores/pe-torto/ciclos/ciclo-01.conf`. Não sobrou por acaso nem por regra — sobrou
 * porque o expurgo perguntou à ÁRVORE quem era o dono, e a árvore respondeu `pe-junto`.
 *
 * `escolaDosCaminhos` atribui a escola ao primeiro professor que aparece nos caminhos, em
 * ordem de árvore. Uma escola pode ter VÁRIOS professores (o dono e os que receberam turma em
 * curadoria), e os arquivos do secundário — o pacote do ciclo, gerado no nome dele — vêm antes
 * no alfabeto. O expurgo então procurou `professores/pe-junto/ciclos/ciclo-01.conf`, que nunca
 * existiu, devolveu lista vazia, e o manifesto do dono verdadeiro ficou.
 *
 * Reproduzido sobre a árvore de `aeb2b2c1^` (o commit anterior ao último expurgo da batata):
 * professor derivado `pe-junto`, manifesto `[]`, e `professores/pe-torto/ciclos/ciclo-01.conf`
 * presente. É o controle negativo da secção A.
 *
 * A REGRA CERTA JÁ EXISTIA: `responsavelDoInventario` lê o elo MAIS RECENTE de `recriacao[]`
 * — a encarnação que está a ser expurgada — e só cai no `professor` do topo quando não há elo.
 * O `escola/expurgar.js` local já a usava; a metade que escreve no repositório, não.
 *
 * O QUE ESTA PROVA MEDE, sempre pelo `apagarEscolaDoRepo` de verdade e com um GitHub falso:
 *
 *   A. com dois professores na mesma escola, o manifesto que sai é o do DONO (o do elo novo),
 *      e o do secundário não é tocado — o controle negativo é a regra antiga, que não apaga nada;
 *   B. quando o dono tem OUTRA escola viva no mesmo ciclo, o manifesto base fica (é dela também);
 *   C. sem inventário (escola antiga, sem `escola/<slug>/indice.json`), a árvore volta a decidir —
 *      a degradação é declarada, e não uma falha em silêncio.
 *
 *   node experimentos/provar-dono-do-expurgo.js
 */

const repo = require('../motor/servidor/repo-escola.js');

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const b64 = (texto) => Buffer.from(texto, 'utf8').toString('base64');

/**
 * Um GitHub falso que serve UMA árvore e captura o corpo do commit de árvore.
 *
 * `arvore` é a lista de caminhos; `indices` é `{ caminho: objeto }` para os ficheiros que o
 * expurgo LÊ (o inventário da escola). O resto responde o suficiente para o caminho andar, e é
 * o corpo do `POST /git/trees` que a prova examina: é ele que diz o que o commit apaga.
 */
function githubFalso({ arvore, indices }) {
  const estado = { corposDeArvore: [], commits: 0 };
  estado.fetch = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const responde = (status, corpo) => ({ ok: status >= 200 && status < 300, status, json: async () => corpo });
    const u = String(url);

    if (u.indexOf('/git/trees/') !== -1 && metodo === 'GET') {
      return responde(200, { tree: arvore.map((p) => ({ type: 'blob', path: p })) });
    }
    if (u.indexOf('/contents/') !== -1 && metodo === 'GET') {
      const m = /\/contents\/([^?]+)/.exec(u);
      const caminho = m ? decodeURIComponent(m[1]) : '';
      const objeto = indices[caminho];
      if (objeto === undefined) return responde(404, { message: 'Not Found' });
      return responde(200, { content: b64(JSON.stringify(objeto, null, 2)) });
    }
    if (u.indexOf('/git/ref/heads/') !== -1 && metodo === 'GET') {
      return responde(200, { object: { sha: 'commit-base' } });
    }
    if (u.indexOf('/git/commits/') !== -1 && metodo === 'GET') {
      return responde(200, { sha: 'commit-base', tree: { sha: 'arvore-base' } });
    }
    if (u.indexOf('/git/trees') !== -1 && metodo === 'POST') {
      estado.corposDeArvore.push(JSON.parse(init.body));
      return responde(201, { sha: 'arvore-nova' });
    }
    if (u.indexOf('/git/commits') !== -1 && metodo === 'POST') {
      estado.commits += 1;
      return responde(201, { sha: 'commit-novo' });
    }
    if (u.indexOf('/git/refs/heads/') !== -1 && metodo === 'PATCH') {
      return responde(200, { object: { sha: 'commit-novo' } });
    }
    return responde(200, {});
  };
  return estado;
}

/** Os caminhos que o commit PEDIU para apagar. */
const apagadosNoCommit = (estado) => {
  const corpo = estado.corposDeArvore[estado.corposDeArvore.length - 1] || { tree: [] };
  return (corpo.tree || []).filter((t) => t.sha === null).map((t) => t.path);
};

/**
 * O INVENTÁRIO de uma escola recriada: o topo diz quem a criou PRIMEIRO (memória), e o elo
 * mais recente de `recriacao[]` diz quem responde por ela HOJE. É a distinção que a correção usa.
 */
const inventarioDe = ({ escola, dono, criadorOriginal, ciclo }) => ({
  escola,
  professor: { slug: criadorOriginal, nome: criadorOriginal },
  ciclo,
  arquivos: [],
  expurgo: [],
  recriacao: [
    { em: '2026-10-20T02:06:23.439Z', motivo: 'recriada por tools/criar-escola.sh' },
    { em: '2026-11-01T22:29:37.341Z', motivo: 'recriada por tools/criar-escola.sh',
      professor: { slug: dono, nome: dono }, responsavel: dono, ciclo },
  ],
});

const expurgar = (estado) => repo.apagarEscolaDoRepo({
  token: 'x', dono: 'd', repo: 'r', ref: 'main',
  slug: 'zzz', confirmacao: 'zzz', motivo: 'prova', quando: '2026-11-07',
  fetchImpl: estado.fetch,
});

(async () => {
  console.log('\nA. Dois professores na mesma escola — o manifesto que sai é o do DONO');

  /* A ÁRVORE DA BATATA, em pequeno: o secundário (`aa-secundario`) vem PRIMEIRO no alfabeto, e
   * foi ele que gerou o pacote do ciclo. O dono é `bb-dono`, e é dele o manifesto base. */
  const ARVORE = [
    'professores/aa-secundario/ciclos/ciclo-01-zzz-plano.md',
    'professores/aa-secundario/ciclos/ciclo-01-zzz-po.md',
    'professores/bb-dono/ciclos/ciclo-01.conf',
    'professores/bb-dono/ciclos/ciclo-01-zzz.conf',
    'professores/bb-dono/ciclos/ciclo-01-zzz-po.md',
    'escola/zzz/indice.json',
    'wrangler.zzz.jsonc',
  ];
  const INVENTARIO = inventarioDe({
    escola: 'zzz', dono: 'bb-dono', criadorOriginal: 'criador-antigo', ciclo: '01',
  });

  // O CONTROLE NEGATIVO — a regra que estava lá, aplicada à mesma árvore.
  const derivada = repo.escolaDosCaminhos('zzz', ARVORE);
  const manifestoDaRegraAntiga = repo.manifestoBaseDoCiclo(ARVORE, derivada.professor, derivada.ciclo);
  checar('a árvore, sozinha, atribui a escola ao professor que vem primeiro (o secundário)',
    derivada.professor === 'aa-secundario', derivada.professor);
  checar('…e é por isso que a regra antiga NÃO apagava manifesto nenhum',
    manifestoDaRegraAntiga.length === 0, manifestoDaRegraAntiga);

  const estado = githubFalso({ arvore: ARVORE, indices: { 'escola/zzz/indice.json': INVENTARIO } });
  const r = await expurgar(estado);
  checar('o expurgo entra', r.ok === true, r && (r.erro || r.motivo));
  const apagados = apagadosNoCommit(estado);
  checar('o manifesto base do DONO entra no commit de remoção',
    apagados.includes('professores/bb-dono/ciclos/ciclo-01.conf'), apagados);
  checar('…e a variante do dono também',
    apagados.includes('professores/bb-dono/ciclos/ciclo-01-zzz.conf'), apagados);
  checar('…e os arquivos do secundário também — a escola é uma só',
    apagados.includes('professores/aa-secundario/ciclos/ciclo-01-zzz-po.md'), apagados);

  console.log('\nB. O dono tem OUTRA escola viva no ciclo — o manifesto base FICA (é dela também)');

  const ARVORE_COM_IRMA = ARVORE.concat([
    'professores/bb-dono/ciclos/ciclo-01-outra.conf',
    'professores/bb-dono/ciclos/ciclo-01-outra-po.md',
    'wrangler.outra.jsonc',
  ]);
  const estadoIrma = githubFalso({ arvore: ARVORE_COM_IRMA, indices: { 'escola/zzz/indice.json': INVENTARIO } });
  const rIrma = await expurgar(estadoIrma);
  checar('o expurgo entra', rIrma.ok === true, rIrma && rIrma.erro);
  const apagadosIrma = apagadosNoCommit(estadoIrma);
  checar('o manifesto base NÃO sai: o mesmo professor tem outra escola no ciclo 01',
    !apagadosIrma.includes('professores/bb-dono/ciclos/ciclo-01.conf'), apagadosIrma);
  checar('…mas a variante DESTA escola sai',
    apagadosIrma.includes('professores/bb-dono/ciclos/ciclo-01-zzz.conf'), apagadosIrma);

  console.log('\nC. Sem inventário — a árvore volta a decidir, e isso é dito, não escondido');

  const estadoSemIndice = githubFalso({ arvore: ARVORE, indices: {} });
  const rSemIndice = await expurgar(estadoSemIndice);
  checar('o expurgo entra mesmo sem `escola/<slug>/indice.json`',
    rSemIndice.ok === true, rSemIndice && rSemIndice.erro);
  checar('…e sem inventário o comportamento é o de antes — nada é inventado',
    !apagadosNoCommit(estadoSemIndice).includes('professores/bb-dono/ciclos/ciclo-01.conf'),
    apagadosNoCommit(estadoSemIndice));

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções: o expurgo pergunta ao INVENTÁRIO quem responde pela'
    + ' escola (o elo mais recente), apaga o manifesto base do dono e só dele, preserva o manifesto'
    + ' quando o dono tem outra escola viva no mesmo ciclo, e volta à árvore — sem inventar — quando'
    + ' não há inventário.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
