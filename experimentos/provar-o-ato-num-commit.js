#!/usr/bin/env node
'use strict';

/*
 * provar-o-ato-num-commit.js — o agrupamento DENTRO do ato (25/11/2026).
 *
 * O QUE ELA APROVOU, e o que ela quis garantir:
 *
 *   «Essa medição que encontrou coisa maior, o único ato dispara dois a quatro gerações e uma a
 *   sete derivações, que a gente acaba gastando muito. Então vamos fazer essa solução que você
 *   aponta aqui. O agrupamento que falta é dentro do ato e não dentro das aulas. […] É importante
 *   que isso não estrague nada do que está funcionando.»
 *
 * O QUE A MEDIÇÃO MOSTROU, nos runs de 23 e 24/11 — e é a linha de base desta prova:
 *
 *   21 execuções do «Fechar os derivados», 7 CANCELADAS.
 *   Duração somada dos jobs: 274 s = 4,6 min de trabalho.
 *   Facturado: 21 × 1 min = 21 min, porque cada job arredonda ao minuto.
 *   → 4,6× de desperdício, e as 7 canceladas são 7 minutos pagos por 22 segundos.
 *
 * E um ato isolado, o do «Guardar» das 11:11:53 às 11:12:30 de 24/11: QUATRO commits em nove
 * segundos — `envelope/.indice.json`, `envelope/plano-….json`, o `.conf`, e as dez fontes (essas
 * já juntas). Quatro pushes, quatro execuções do derivados, três canceladas.
 *
 * O QUE ESTA PROVA AFIRMA:
 *
 *   A. SEM LOTE, NADA MUDA — o mesmo par de commits de sempre, e é este o controlo negativo que
 *      dá valor a tudo o resto.
 *   B. COM LOTE, UM COMMIT para o índice e o envelope.
 *   C. O LOTE VÊ O QUE ESTÁ PENDENTE — um `guardar` seguido de `ler` devolve o que foi prometido,
 *      e duas escritas do mesmo pedido não escolhem o mesmo nome.
 *   D. O `criado` PERGUNTA-SE ANTES DE GUARDAR — um envelope novo é `criado: true` mesmo dentro
 *      do lote (o defeito que a primeira versão tinha).
 *   E. UM LOTE VAZIO NÃO FAZ COMMIT — quem só leu não escreve.
 *   F. O COMMIT QUE FALHA DESMENTE A GRAVAÇÃO — a promessa que não entrou não se anuncia como
 *      guardada.
 *   G. O APAGAR FECHA O LOTE ANTES — o que foi prometido entra primeiro, e o apagamento vê o
 *      repositório com tudo.
 *
 *   node experimentos/provar-o-ato-num-commit.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const acervo = require(path.join(RAIZ, 'motor/servidor/acervo-envelopes.js'));

let ok = 0;
let ko = 0;
function conferir(titulo, condicao, dado) {
  if (condicao) { ok += 1; console.log('  ok    ' + titulo); return; }
  ko += 1;
  console.log('  FALHA ' + titulo + (dado === undefined ? '' : '  → ' + JSON.stringify(dado)));
}

/* UM GITHUB DE MENTIRA QUE CONTA COMMITS. Ele serve o suficiente para o acervo funcionar: as
 * leituras de `contents` dão 404 (o ficheiro não existe), os `PUT /contents` são um commit cada,
 * e o caminho da árvore/commit/referência é o que `gravarArquivosNumCommit` usa — e conta UM. */
function githubFalso({ commitsForcados = 0 } = {}) {
  const estado = { commits: [], puts: 0, arvores: 0 };
  let sha = 'sha-inicial';
  const f = async (url, init) => {
    const u = String(url);
    const metodo = (init && init.method) || 'GET';

    if (u.includes('/git/ref/heads/')) {
      return { ok: true, status: 200, json: async () => ({ object: { sha } }) };
    }
    if (u.includes('/git/commits/')) {
      return { ok: true, status: 200, json: async () => ({ tree: { sha: 'arvore-' + sha } }) };
    }
    if (u.includes('/git/trees') && metodo === 'POST') {
      estado.arvores += 1;
      const corpo = JSON.parse(init.body);
      if (estado.arvores > commitsForcados) {
        estado.commits.push(corpo.tree.map((e) => e.path));
        sha = 'sha-' + estado.commits.length;
        const arquivos = corpo.tree.map((e) => e.path);
        const idx = corpo.tree.find((e) => e.path.endsWith('.indice.json'));
        if (idx) estado.indice = true;
        return { ok: true, status: 201, json: async () => ({ sha: 'arvore-nova-' + estado.commits.length }) };
      }
      return { ok: false, status: 409, json: async () => ({}) };
    }
    if (u.includes('/git/commits') && metodo === 'POST') {
      return { ok: true, status: 201, json: async () => ({ sha: 'commit-' + estado.commits.length }) };
    }
    if (u.includes('/git/refs/heads/') && metodo === 'PATCH') {
      return { ok: true, status: 200, json: async () => ({}) };
    }
    if (u.includes('/contents/') && metodo === 'GET') {
      return { ok: false, status: 404, json: async () => null };
    }
    if (u.includes('/contents/') && metodo === 'PUT') {
      estado.puts += 1;
      const corpo = JSON.parse(init.body);
      estado.commits.push([u.split('/contents/')[1].split('?')[0]]);
      return { ok: true, status: 201, json: async () => ({ commit: { sha: 'c' + estado.puts } }) };
    }
    if (u.includes('/git/trees')) {
      return { ok: true, status: 200, json: async () => ({ tree: [] }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  return { f, estado };
}

function montar(estado) {
  return acervo.criarAcervoDeEnvelopes({
    token: 'token-de-prova', escola: 'breu', fetchImpl: estado.f, senhaCripto: null,
    cifrar: async (t) => t,
  });
}

const INDICE = 'envelope/.indice.json';
const ENVELOPE = 'envelope/po-20261124-0815.json';

(async () => {
  console.log('O ato num commit só — 25/11/2026\n');

  /* ── A. O controlo negativo: sem lote, dois commits ────────────────────────── */
  console.log('A. SEM LOTE, NADA MUDA — dois commits, como sempre foi');
  {
    const g = githubFalso();
    const a = montar(g);
    await a.guardar(INDICE, '{"nomes":["po-1.json"]}');
    await a.guardar(ENVELOPE, '{"id":"po-1"}');
    conferir('sem lote, são dois commits', g.estado.commits.length === 2, g.estado.commits.length);
    conferir('e cada um leva um ficheiro', g.estado.commits.every((c) => c.length === 1));
    conferir('nada foi adiado', a.emLote() === false);
  }

  /* ── B. Com lote, um commit ────────────────────────────────────────────────── */
  console.log('\nB. COM LOTE, UM COMMIT para o índice e o envelope');
  {
    const g = githubFalso();
    const a = montar(g);
    a.abrirLote();
    const r1 = await a.guardar(INDICE, '{"nomes":["po-1.json"]}');
    const r2 = await a.guardar(ENVELOPE, '{"id":"po-1"}');
    conferir('as escritas ficaram adiadas', r1.adiado === true && r2.adiado === true);
    conferir('e nada foi ao repositório ainda', g.estado.commits.length === 0, g.estado.commits.length);
    conferir('o lote sabe que tem escritas', a.emLote() === true);
    const fecho = await a.fecharLote('teste');
    conferir('o fecho deu certo', fecho.ok === true, fecho.erro);
    conferir('UM commit, e não dois', g.estado.commits.length === 1, g.estado.commits.length);
    conferir('e leva os dois ficheiros', g.estado.commits[0].length === 2, g.estado.commits[0]);
    conferir('o índice vai dentro dele', g.estado.commits[0].some((p) => p.endsWith('.indice.json')));
    conferir('o lote ficou fechado', a.emLote() === false);
  }

  /* ── C. O pendente é visível ──────────────────────────────────────────────── */
  console.log('\nC. O LOTE VÊ O QUE ESTÁ PENDENTE');
  {
    const g = githubFalso();
    const a = montar(g);
    a.abrirLote();
    await a.guardar(ENVELOPE, '{"id":"po-1"}');
    const lido = await a.ler(ENVELOPE);
    conferir('ler devolve o que foi prometido, sem ter ido à rede',
      typeof lido === 'string' && JSON.parse(lido).id === 'po-1', lido);
    const outra = await a.criar(ENVELOPE, '{"id":"po-2"}');
    conferir('e o mesmo nome não se cria duas vezes', outra.jaExiste === true, outra);
    await a.fecharLote('teste');
  }

  /* ── D. O `criado` pergunta-se antes ─────────────────────────────────────── */
  console.log('\nD. O `criado` PERGUNTA-SE ANTES DE GUARDAR');
  {
    const g = githubFalso();
    const a = montar(g);
    a.abrirLote();
    const novo = await a.criar('envelope/po-1.json', '{"id":"a1"}');
    conferir('um nome livre é criado', novo.criado === true, novo);
    const igual = await a.criar('envelope/po-1.json', '{"id":"a1"}');
    conferir('o segundo já existe — não é criado', igual.jaExiste === true, igual);
    await a.fecharLote('teste');
  }

  /* ── E. Lote vazio não faz commit ────────────────────────────────────────── */
  console.log('\nE. UM LOTE VAZIO NÃO FAZ COMMIT');
  {
    const g = githubFalso();
    const a = montar(g);
    a.abrirLote();
    const fecho = await a.fecharLote('teste');
    conferir('o fecho de um lote vazio é ok', fecho.ok === true);
    conferir('e diz que não havia nada', fecho.nada === true);
    conferir('e não fez commit nenhum', g.estado.commits.length === 0, g.estado.commits.length);
    /* E abrir duas vezes não perde a primeira. */
    a.abrirLote();
    await a.guardar(ENVELOPE, '{"id":"x"}');
    a.abrirLote();
    conferir('abrir duas vezes não apaga o que estava no lote', a.emLote() === true);
    await a.fecharLote('teste');
  }

  /* ── F. Quando as DUAS coisas falham, não se anuncia nada ───────────────── */
  console.log('\nF. COM O LOTE E O UM-A-UM A FALHAR, NADA SE ANUNCIA COMO GRAVADO');
  {
    /* `commitsForcados: 99` faz o `POST /git/trees` responder 409 sempre — o commit único nunca
     * entra; e o `PUT /contents` responde 500, de modo que a degradação também não salva nada. É
     * o pior caso, e o que ele tem de garantir é a HONESTIDADE: `ok: false` com o motivo, e não
     * um `ok: true` sobre um repositório que não mudou. */
    const f = async (url, init) => {
      const u = String(url);
      const metodo = (init && init.method) || 'GET';
      if (u.includes('/git/ref/heads/')) return { ok: true, status: 200, json: async () => ({ object: { sha: 's' } }) };
      if (u.includes('/git/commits/')) return { ok: true, status: 200, json: async () => ({ tree: { sha: 'a' } }) };
      if (u.includes('/git/trees') && metodo === 'POST') return { ok: false, status: 409, json: async () => ({}) };
      if (u.includes('/git/trees')) return { ok: true, status: 200, json: async () => ({ tree: [] }) };
      if (metodo === 'GET') return { ok: false, status: 404, json: async () => null };
      return { ok: false, status: 500, json: async () => ({ message: 'o GitHub recusou' }) };
    };
    const a = acervo.criarAcervoDeEnvelopes({
      token: 'token-de-prova', escola: 'breu', fetchImpl: f, senhaCripto: null, cifrar: async (t) => t,
    });
    a.abrirLote();
    const r = await a.guardar(ENVELOPE, '{"id":"po-1"}');
    conferir('a escrita foi aceite no lote', r.ok === true && r.adiado === true);
    const fecho = await a.fecharLote('teste');
    conferir('o fecho FALHA', fecho.ok === false, fecho);
    conferir('e diz porquê, e diz que degradou', Boolean(fecho.erro) && fecho.degradado === true, fecho);
    conferir('e não deu nada por escrito', (fecho.escritos || []).length === 0, fecho.escritos);
  }

  /* ── G. O apagar fecha o lote antes ──────────────────────────────────────── */
  console.log('\nG. O APAGAR FECHA O LOTE ANTES');
  {
    const g = githubFalso();
    const a = montar(g);
    a.abrirLote();
    await a.guardar(ENVELOPE, '{"id":"po-1"}');
    await a.apagar('envelope/outro.json');
    conferir('o que estava prometido entrou antes do apagamento',
      g.estado.commits.length >= 1, g.estado.commits.length);
    conferir('e o lote ficou vazio', a.emLote() === false);
  }

  /* ── H. O commit único que falha NÃO leva a gravação consigo ─────────────── */
  console.log('\nH. DECRADE, NÃO REBENTA: sem a API de Git, grava um a um');
  {
    /* O CASO REAL que isto fixa é o da prova `provar-escola-do-documento`: um `fetchImpl` que só
     * conhece `/contents/` e a árvore. Sem a saída, o ato deixava de gravar — e um ganho de cota
     * não pode custar a gravação. */
    const escritos = [];
    const f = async (url, init) => {
      const u = String(url);
      const metodo = (init && init.method) || 'GET';
      if (u.includes('/git/trees/')) return { ok: true, status: 200, json: async () => ({ sha: 'a', tree: [] }) };
      if (metodo === 'GET') return { ok: false, status: 404, json: async () => null };
      const m = /\/contents\/(.+?)(\?|$)/.exec(u);
      escritos.push(m ? m[1] : u);
      return { ok: true, status: 201, json: async () => ({ content: { sha: 's' }, commit: { sha: 'c' } }) };
    };
    const a = acervo.criarAcervoDeEnvelopes({
      token: 'token-de-prova', escola: 'breu', fetchImpl: f, senhaCripto: null, cifrar: async (t) => t,
    });
    a.abrirLote();
    await a.guardar(INDICE, '{"nomes":[]}');
    await a.guardar(ENVELOPE, '{"id":"po-1"}');
    const fecho = await a.fecharLote('teste');
    conferir('o fecho conseguiu gravar, mesmo sem a API de Git', fecho.ok === true, fecho.erro);
    conferir('e DIZ que degradou', fecho.degradado === true, fecho.degradado);
    conferir('com o motivo do lote', Boolean(fecho.motivoDoLote), fecho.motivoDoLote);
    conferir('e os dois ficheiros entraram, um a um', escritos.length === 2, escritos);
    conferir('o lote ficou fechado', a.emLote() === false);
  }

  console.log('\n' + ok + '/' + (ok + ko) + ' · ' + (ko ? ko + ' falha(s)' : 'sem falhas'));
  process.exit(ko ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
