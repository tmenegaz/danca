#!/usr/bin/env node
'use strict';

/**
 * provar-um-commit-por-guardar.js — o «Guardar» do PO escreve o ciclo num commit só (22/10/2026).
 *
 * O QUE SE MEDIU. O «Guardar» do PO escrevia **um commit por arquivo** — pela API de `contents`,
 * que só sabe escrever um de cada vez: as sete fontes derivadas, a cópia cifrada, o `.conf` e o
 * schema de captura. Foram onze commits em vinte e dois segundos (`474af6f`, `83116dc`,
 * `c29a227`…), e cada um acorda três workflows. Trinta execuções para um clique, quase todas a
 * perder a corrida umas para as outras: foi esse enxame que produziu os dois vermelhos de hoje
 * (39788794107 e 39788790994), com treze arquivos de índice «em conflito» — que não eram conteúdo.
 *
 * O QUE ESTA PROVA TRAVA.
 *
 *   1. o «Guardar» faz ZERO `PUT /contents` (nenhum commit por arquivo);
 *   2. e UM único `POST /git/commits`, com todos os arquivos na árvore;
 *   3. o relatório continua a dizer arquivo por arquivo, e diz `ok` só depois de o repositório
 *      aceitar — uma gravação que mente sobre ter entrado é pior do que uma que falha;
 *   4. se o commit falhar, TODAS as escritas ficam com `ok: false` e o relatório reprova (é o que
 *      impede o disparo do gerador sobre um ciclo que o repositório não tem);
 *   5. e a mensagem do commit nomeia a variante, para o histórico dizer o que mudou.
 *
 *   uso: node experimentos/provar-um-commit-por-guardar.js
 */

const { criarEscritorDeCiclo } = require('../motor/servidor/escrever-ciclo.js');

let falhas = 0;
let n = 0;
const conferir = (nome, ok, detalhe) => {
  n += 1;
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok ? '' : '  -> ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

const CONF = [
  'CICLO="01"',
  'ESCOLA="batata"',
  'NOME="Ciclo 01 — batata"',
  'DURACOES="60"',
  'VOLUME_MIN="3"',
  'VOLUME_MAX="5"',
  'DOCS=""',
  'DIAS="segunda 18:00"',
].join('\n') + '\n';

/* O SCHEMA MIGRADO (07/11/2026): sem `porVariante`. A declaração da variante passou a ser um
 * arquivo próprio (`ciclo-NN-<variante>-captura-declaracao.json`), e o schema voltou a ser o
 * molde. O fixture reflete o estado de PRODUÇÃO — um schema que ainda carregasse declarações
 * faria o escritor limpá-lo, e a prova mediria uma migração que já não acontece. */
const SCHEMA = JSON.stringify({ _declaracao: { _nota: 'a declaração da variante tem arquivo próprio' } }, null, 2);

/**
 * O GitHub falso: serve o `.conf` e o schema de captura, responde 404 ao resto das fontes (é o
 * que faz cada uma ser escrita), e implementa a API de DADOS do Git — que é a que o lote usa.
 * Conta tudo o que importa: as escritas por `contents` e os commits.
 */
function githubFalso({ falharCommit = false } = {}) {
  const chamadas = [];
  const inventario = { commit: null, arvore: null, arquivos: [], conteudos: {} };
  const f = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const u = String(url);
    chamadas.push({ url: u, metodo });
    const corpo = init && init.body ? JSON.parse(init.body) : null;

    if (metodo === 'GET' && /\/contents\//.test(u)) {
      const caminho = u.split('/contents/')[1].split('?')[0];
      if (/\.conf$/.test(caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 's1', content: Buffer.from(CONF).toString('base64') }) };
      }
      if (/captura-schema\.json$/.test(caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 's2', content: Buffer.from(SCHEMA).toString('base64') }) };
      }
      // As fontes derivadas ainda não existem: é isto que manda escrevê-las.
      return { status: 404, ok: false, json: async () => ({}) };
    }
    if (metodo === 'GET' && /\/git\/ref\/heads\//.test(u)) return { status: 200, ok: true, json: async () => ({ object: { sha: 'c0' } }) };
    if (metodo === 'GET' && /\/git\/commits\//.test(u)) return { status: 200, ok: true, json: async () => ({ tree: { sha: 't0' } }) };
    if (metodo === 'POST' && /\/git\/blobs$/.test(u)) {
      const sha = 'b' + chamadas.length;
      inventario.conteudos[sha] = Buffer.from(String(corpo.content), 'base64').toString('utf8');
      return { status: 201, ok: true, json: async () => ({ sha }) };
    }
    if (metodo === 'POST' && /\/git\/trees$/.test(u)) {
      inventario.arvore = corpo;
      inventario.arquivos = (corpo.tree || []).map((t) => t.path);
      // O que cada caminho RECEBEU — é isto que a segunda passagem serve de volta. Desde
      // 08/11/2026 o conteúdo viaja DENTRO da entrada da árvore (`content`), e não num blob à
      // parte: a árvore cria o blob, e a entrada deixa de trazer `sha`. As duas formas são lidas
      // aqui porque a prova mede o que o caminho recebeu, não por que porta entrou.
      inventario.porCaminho = {};
      for (const t of corpo.tree || []) {
        inventario.porCaminho[t.path] = t.content !== undefined
          ? String(t.content) : inventario.conteudos[t.sha];
      }
      return { status: 201, ok: true, json: async () => ({ sha: 't1' }) };
    }
    if (metodo === 'POST' && /\/git\/commits$/.test(u)) {
      if (falharCommit) return { status: 500, ok: false, json: async () => ({ message: 'boom' }) };
      inventario.commit = corpo;
      return { status: 201, ok: true, json: async () => ({ sha: 'c1' }) };
    }
    if (metodo === 'PATCH' && /\/git\/refs\/heads\//.test(u)) return { status: 200, ok: true, json: async () => ({}) };
    return { status: 200, ok: true, json: async () => ({}) };
  };
  return { fetch: f, chamadas, inventario };
}

const PLANO = { objetivo: 'x', turma: 'bale-nivel-1-teste-2', professor: 'tiago-menegaz', ciclo: '01' };
const PO = { ciclo: '01', escola: 'batata' };
const CONTEXTO = {
  escola: 'batata', professor: 'tiago-menegaz', ciclo: '01',
  turma: 'bale-nivel-1-teste-2', variante: 'batata-bale-nivel-1-teste-2',
};

async function guardar(fetch) {
  const escrever = criarEscritorDeCiclo({
    token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: fetch,
  });
  return escrever({ plano: PLANO, po: PO, contexto: CONTEXTO });
}

async function principais() {
  // ── 1. o caminho feliz: um commit, e nenhuma escrita por arquivo ──────────
  {
    const { fetch, chamadas, inventario } = githubFalso();
    const relatorio = await guardar(fetch);

    const porContents = chamadas.filter((c) => c.metodo === 'PUT' && /\/contents\//.test(c.url));
    const commits = chamadas.filter((c) => c.metodo === 'POST' && /\/git\/commits$/.test(c.url));

    conferir('o «Guardar» faz ZERO escritas por `contents` (nenhum commit por arquivo)',
      porContents.length === 0, porContents.map((c) => c.url));
    conferir('…e UM único commit', commits.length === 1, commits.length);
    conferir('…com as OITO gravações na mesma árvore', inventario.arquivos.length === 8, inventario.arquivos);
    conferir('…incluindo o `.conf` e a declaração da variante',
      inventario.arquivos.some((p) => /\.conf$/.test(p))
        && inventario.arquivos.some((p) => /-captura-declaracao\.json$/.test(p)), inventario.arquivos);
    conferir('…e o pai do commit é a referência lida', inventario.commit && inventario.commit.parents[0] === 'c0',
      inventario.commit && inventario.commit.parents);
    conferir('…sobre a `base_tree` lida (o que impede apagar o resto do repositório)',
      inventario.arvore && inventario.arvore.base_tree === 't0', inventario.arvore && inventario.arvore.base_tree);
    conferir('a mensagem do commit nomeia a variante',
      /batata-bale-nivel-1-teste-2/.test(String(inventario.commit.message)), String(inventario.commit.message).split('\n')[0]);

    // ── 2. o relatório continua a dizer arquivo por arquivo ────────────────
    conferir('o relatório traz o commit', relatorio.commit && relatorio.commit.ok === true, relatorio.commit);
    conferir('…com o número de arquivos', relatorio.commit && relatorio.commit.arquivos === 8, relatorio.commit);
    // SEIS no relatório (as cinco fontes derivadas + a cópia cifrada) e OITO no commit (mais o
    // `.conf` e a declaração da variante, que não são «escritas» para o relatório mas são
    // gravações).
    conferir('…e as seis escritas do relatório com `ok` (dito só depois de o repositório aceitar)',
      relatorio.escritas.length === 6 && relatorio.escritas.every((e) => e.ok === true),
      relatorio.escritas.map((e) => e.ok));
    conferir('o `.conf` foi composto e gravado', relatorio.docs && relatorio.docs.ok === true, relatorio.docs);
    conferir('a cópia cifrada foi gravada', relatorio.cifrado && relatorio.cifrado.ok === true, relatorio.cifrado);
    conferir('a variante foi declarada no arquivo da variante',
      relatorio.schema && relatorio.schema.ok === true, relatorio.schema);
  }

  // ── 3. se o commit falha, o relatório NÃO mente ──────────────────────────
  {
    const { fetch } = githubFalso({ falharCommit: true });
    const relatorio = await guardar(fetch);
    conferir('commit recusado → nenhuma escrita se diz gravada',
      relatorio.escritas.length === 6 && relatorio.escritas.every((e) => e.ok === false),
      relatorio.escritas.map((e) => e.ok));
    conferir('…e o relatório reprova (é o que impede disparar o gerador)',
      relatorio.ok === false || (relatorio.commit && relatorio.commit.ok === false), relatorio.commit);
    conferir('…e o cifrado não se diz gravado', relatorio.cifrado && relatorio.cifrado.ok === false, relatorio.cifrado);
    conferir('…e o schema também não', relatorio.schema && relatorio.schema.ok === false, relatorio.schema);
  }

  // ── 4. IDEMPOTENTE: gravado uma vez, o segundo «Guardar» não escreve nada ─
  //
  // Prova-se por DUAS PASSAGENS, e é a única forma honesta: a primeira grava, e o que ela gravou
  // é servido de volta na segunda. Adivinhar o conteúdo esperado (o `DOCS` composto, a declaração
  // do schema) daria uma prova que mede a minha adivinhação e não o escritor.
  {
    const primeira = githubFalso();
    await guardar(primeira.fetch);
    const noRepo = primeira.inventario.porCaminho || {};
    conferir('a primeira passagem grava oito caminhos', Object.keys(noRepo).length === 8,
      Object.keys(noRepo));

    const chamadas = [];
    const f = async (url, init) => {
      const metodo = (init && init.method) || 'GET';
      const u = String(url);
      chamadas.push({ url: u, metodo });
      if (metodo === 'GET' && /\/contents\//.test(u)) {
        const caminho = u.split('/contents/')[1].split('?')[0];
        if (!(caminho in noRepo)) return { status: 404, ok: false, json: async () => ({}) };
        return { status: 200, ok: true, json: async () => ({ sha: 's', content: Buffer.from(noRepo[caminho]).toString('base64') }) };
      }
      if (metodo === 'GET' && /\/git\/ref\/heads\//.test(u)) return { status: 200, ok: true, json: async () => ({ object: { sha: 'c0' } }) };
      if (metodo === 'GET' && /\/git\/commits\//.test(u)) return { status: 200, ok: true, json: async () => ({ tree: { sha: 't0' } }) };
      return { status: 200, ok: true, json: async () => ({}) };
    };
    const relatorio = await guardar(f);
    const commits = chamadas.filter((c) => c.metodo === 'POST' && /\/git\/commits/.test(c.url));
    conferir('o segundo «Guardar» não cria commit nenhum', commits.length === 0, commits.length);
    conferir('…porque tudo já existe, e as fontes são ditas PULADAS',
      relatorio.puladas.length >= 6 && relatorio.escritas.length === 0,
      { puladas: relatorio.puladas.length, escritas: relatorio.escritas.length });
    conferir('…e o `.conf` não é recomposto (o `DOCS` já tem a aula)',
      relatorio.docs && relatorio.docs.ok === true && !relatorio.commit, relatorio.docs);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principais().catch((e) => { console.error('EXPLODIU:', (e && e.stack) || e); process.exit(1); });
