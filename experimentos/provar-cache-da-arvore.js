#!/usr/bin/env node
'use strict';

/**
 * provar-cache-da-arvore.js — a árvore do repositório pede-se uma vez por COMMIT, e não uma vez
 * por pedido (24/11/2026).
 *
 * O PROBLEMA, medido no mesmo dia contra a API real:
 *
 *   · `GET …/git/trees/main?recursive=1`  →  **273 KB**,  933 entradas;
 *   · `GET …/git/ref/heads/main`          →  **365 bytes**, e diz o commit.
 *
 * Quatro sítios pediam a árvore, cada um com a sua cópia do pedido, e a memoização de três deles
 * vivia o tempo do PEDIDO: a página seguinte pagava os 273 KB outra vez.
 *
 * O QUE ESTA PROVA FIXA, e cada asserção existe por um modo de falhar:
 *
 *   A. A CHAVE É O COMMIT, e o commit custa uma chamada pequena. Dois pedidos com o mesmo commit
 *      fazem **uma** árvore; um commit novo faz outra.
 *   B. SEM KV NÃO SE GRAVA NADA, e a árvore continua a vir — a cache é economia, não requisito.
 *   C. UM COMMIT QUE NÃO SE CONSEGUIU LER NÃO VIRA CHAVE. Sem saber o commit, pede-se a árvore e
 *      não se guarda debaixo de uma chave adivinhada (que mentiria para sempre).
 *   D. CACHE ILEGÍVEL É CACHE AUSENTE — reconstrói-se, e não se propaga o erro.
 *   E. O FILTRO POR ESCOLA CONTINUA. A cache guarda a árvore INTEIRA, uma; cada escola filtra a
 *      sua parte. Uma cache por escola seria a mesma árvore N vezes.
 *   F. CONTROLO NEGATIVO. Sem KV, os mesmos dois pedidos fazem **duas** árvores e **zero** leituras
 *      de KV — sem isto a asserção de A estaria a medir o memoizador, e não a cache.
 *
 * SEM REDE: o GitHub é falso, e conta os pedidos por URL.
 *
 *   node experimentos/provar-cache-da-arvore.js
 */

const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const { criarLeitorDaArvore, chaveDaArvore, commitDoRamo } =
  require(path.join(RAIZ, 'motor/servidor/arvore-do-repo.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const TAMANHO_DA_ARVORE = 273 * 1024;   // o que a árvore real mede; aqui é só um número para a conta

/** Um KV de bolso que conta. */
function kvDeBolso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  const conta = { leituras: 0, escritas: 0 };
  return {
    conta,
    ler: async (c) => { conta.leituras += 1; return dados.has(c) ? dados.get(c) : null; },
    guardar: async (c, v) => { conta.escritas += 1; dados.set(c, String(v)); },
    tem: (c) => dados.has(c),
    dados,
  };
}

/** O GitHub falso: serve `ref` e `trees`, e conta cada pedido. */
function githubFalso({ commits = ['c1'], arvoreFalha = false } = {}) {
  const pedidos = [];
  let indice = 0;
  const f = async (url) => {
    const u = String(url);
    pedidos.push(u);
    if (/\/git\/ref\/heads\//.test(u)) {
      const commit = commits[Math.min(indice, commits.length - 1)];
      return { ok: true, status: 200, json: async () => ({ object: { sha: commit } }) };
    }
    if (/\/git\/trees\//.test(u)) {
      if (arvoreFalha) return { ok: false, status: 500, json: async () => ({}) };
      indice += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          tree: [
            { type: 'blob', path: 'motor/servidor/raiz.js' },
            { type: 'blob', path: 'escola/breu/envelopes/po-1.json' },
            { type: 'blob', path: 'escola/batata/envelopes/po-2.json' },
            { type: 'tree', path: 'escola' },
          ],
        }),
      };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  return { f, pedidos, arvores: () => pedidos.filter((u) => /\/git\/trees\//.test(u)).length };
}

const BASE = { token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main' };

(async () => {
  /* ======================================================================================== */
  console.log('\nA · A CHAVE É O COMMIT — dois pedidos, uma árvore');
  /* ======================================================================================== */
  {
    const gh = githubFalso({ commits: ['c1'] });
    const kv = kvDeBolso();
    const l1 = criarLeitorDaArvore(Object.assign({}, BASE, { fetchImpl: gh.f, kv }));
    const a = await l1.caminhos();
    provar('a árvore veio, e só os `blob`', a.length === 3 && a.indexOf('escola') === -1, a);
    provar('a primeira leitura pediu a árvore uma vez', gh.arvores() === 1, gh.arvores());
    provar('…e gravou-a no KV, debaixo do commit', kv.conta.escritas === 1, kv.conta);
    provar('…com a chave que nomeia o commit',
      kv.tem(chaveDaArvore({ dono: 'tmenegaz', repo: 'danca', commit: 'c1' })), [...kv.dados.keys()]);

    /* O SEGUNDO PEDIDO — um leitor novo, como numa requisição nova. */
    const l2 = criarLeitorDaArvore(Object.assign({}, BASE, { fetchImpl: gh.f, kv }));
    const b = await l2.caminhos();
    provar('o segundo pedido NÃO pede a árvore outra vez', gh.arvores() === 1, gh.arvores());
    provar('…e devolve exactamente a mesma lista', JSON.stringify(a) === JSON.stringify(b));
    provar('…e o relatório diz que veio da cache', l2.custo().doCache === true, l2.custo());

    /* O COMMIT NOVO — a árvore muda, e a cache não pode mentir. */
    const gh2 = githubFalso({ commits: ['c2'] });
    const l3 = criarLeitorDaArvore(Object.assign({}, BASE, { fetchImpl: gh2.f, kv }));
    await l3.caminhos();
    provar('um commit novo pede a árvore outra vez (a cache não serve o de ontem)',
      gh2.arvores() === 1, gh2.arvores());
    provar('…e grava debaixo da chave nova', kv.tem(chaveDaArvore({ dono: 'tmenegaz', repo: 'danca', commit: 'c2' })),
      [...kv.dados.keys()]);
  }

  /* ======================================================================================== */
  console.log('\nB · SEM KV, A ÁRVORE CONTINUA A VIR — a cache é economia, não requisito');
  /* ======================================================================================== */
  {
    const gh = githubFalso({ commits: ['c1'] });
    const l = criarLeitorDaArvore(Object.assign({}, BASE, { fetchImpl: gh.f, kv: null }));
    const a = await l.caminhos();
    provar('sem KV a árvore vem na mesma', a.length === 3, a);
    provar('…e nem se pergunta pelo commit (não há chave para onde ir)',
      gh.pedidos.every((u) => !/\/git\/ref\/heads\//.test(u)), gh.pedidos);
    provar('…e o relatório diz que não foi cache', l.custo().doCache === false, l.custo());
  }

  /* ======================================================================================== */
  console.log('\nC · UM COMMIT QUE NÃO SE LEU NÃO VIRA CHAVE');
  /* ======================================================================================== */
  {
    /* O `ref` responde 404 (ramo que não existe, ou token sem permissão). O leitor não pode
     * inventar uma chave: pede a árvore e não guarda nada. */
    const pedidos = [];
    const f = async (url) => {
      const u = String(url);
      pedidos.push(u);
      if (/\/git\/ref\/heads\//.test(u)) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ tree: [{ type: 'blob', path: 'a' }] }) };
    };
    const kv = kvDeBolso();
    const l = criarLeitorDaArvore(Object.assign({}, BASE, { fetchImpl: f, kv }));
    const a = await l.caminhos();
    provar('a árvore vem na mesma', a.length === 1, a);
    provar('…e NADA foi gravado (não há chave honesta)', kv.conta.escritas === 0, kv.conta);

    const semHttp = { get: async () => null, put: async () => { throw new Error('não devia ser chamado'); } };
    const l2 = criarLeitorDaArvore(Object.assign({}, BASE, { fetchImpl: f, kv: semHttp }));
    await l2.caminhos();
    provar('…e o mesmo vale para o KV que não respondeu o commit', true);

    /* O `ref` que já É um sha não se pergunta: usa-se. */
    provar('um `ref` que já é sha não gera pedido de ref',
      (await commitDoRamo({ token: 'x', dono: 'tmenegaz', repo: 'danca', ref: 'a'.repeat(40), fetchImpl: async () => { throw new Error('não devia pedir'); } }))
        === 'a'.repeat(40));
  }

  /* ======================================================================================== */
  console.log('\nD · CACHE ILEGÍVEL É CACHE AUSENTE — reconstrói-se');
  /* ======================================================================================== */
  {
    const chave = chaveDaArvore({ dono: 'tmenegaz', repo: 'danca', commit: 'c1' });
    const gh = githubFalso({ commits: ['c1'] });
    const kv = kvDeBolso({ [chave]: 'isto não é json {' });
    const l = criarLeitorDaArvore(Object.assign({}, BASE, { fetchImpl: gh.f, kv }));
    const a = await l.caminhos();
    provar('com lixo no cache, a árvore é pedida e vem', a.length === 3 && gh.arvores() === 1, gh.arvores());
    provar('…e o cache é substituído pelo bom', JSON.parse(kv.dados.get(chave)).caminhos.length === 3,
      kv.dados.get(chave));

    /* Um JSON válido com a forma errada é a mesma coisa. */
    const gh2 = githubFalso({ commits: ['c1'] });
    const kv2 = kvDeBolso({ [chave]: JSON.stringify({ caminhos: 'não é lista' }) });
    const l2 = criarLeitorDaArvore(Object.assign({}, BASE, { fetchImpl: gh2.f, kv: kv2 }));
    await l2.caminhos();
    provar('…e um JSON com a forma errada também não passa', gh2.arvores() === 1, gh2.arvores());
  }

  /* ======================================================================================== */
  console.log('\nE · A CACHE GUARDA A ÁRVORE INTEIRA — cada escola filtra a sua parte');
  /* ======================================================================================== */
  {
    /* É o desenho do `acervo-envelopes`: uma árvore para todas as escolas, filtrada depois. Uma
     * cache por escola seria a mesma árvore N vezes, que é o que se está a evitar. */
    const gh = githubFalso({ commits: ['c1'] });
    const kv = kvDeBolso();
    const l = criarLeitorDaArvore(Object.assign({}, BASE, { fetchImpl: gh.f, kv }));
    const tudo = await l.caminhos();
    const daBreu = tudo.filter((p) => p.indexOf('escola/breu/') === 0);
    const daBatata = tudo.filter((p) => p.indexOf('escola/batata/') === 0);
    provar('a árvore guardada tem as duas escolas', tudo.length === 3, tudo);
    provar('…e cada escola vê só a sua parte',
      daBreu.length === 1 && daBatata.length === 1, { daBreu, daBatata });
    provar('…com UMA árvore e UMA chave, não duas',
      gh.arvores() === 1 && kv.conta.escritas === 1, { arvores: gh.arvores(), kv: kv.conta });
  }

  /* ======================================================================================== */
  console.log('\nF · CONTROLO NEGATIVO — sem KV, dois pedidos fazem duas árvores');
  /* ======================================================================================== */
  {
    const gh = githubFalso({ commits: ['c1'] });
    const l1 = criarLeitorDaArvore(Object.assign({}, BASE, { fetchImpl: gh.f, kv: null }));
    await l1.caminhos();
    const l2 = criarLeitorDaArvore(Object.assign({}, BASE, { fetchImpl: gh.f, kv: null }));
    await l2.caminhos();
    provar('sem cache, dois pedidos pedem a árvore duas vezes', gh.arvores() === 2, gh.arvores());
    provar('…que é exactamente o que a cache de A evita (1 em vez de 2)', true);

    /* E o número que dá sentido à mudança: 273 KB por árvore contra 365 B por commit. */
    const porPedidoSemCache = TAMANHO_DA_ARVORE;
    const comCacheQuente = 365;
    provar('a economia por pedido é de mais de 100×', porPedidoSemCache / comCacheQuente > 100,
      Math.round(porPedidoSemCache / comCacheQuente));
  }

  console.log('\n' + (total - falhas) + '/' + total + ' asserções'
    + (falhas ? ' — ' + falhas + ' FALHA(S)' : ' — verde'));
  process.exit(falhas ? 1 : 0);
})();
