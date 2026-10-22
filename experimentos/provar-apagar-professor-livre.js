#!/usr/bin/env node
'use strict';

/**
 * provar-apagar-professor-livre.js — excluir o professor é excluí-lo dos DOIS lados (22/10/2026).
 *
 * O QUE SE PEDIU. «Quando eu excluo um professor que foi cadastrado lá em produção, a gente
 * precisa tomar uma medida agora. Porque quando cadastra o professor, a gente tá gerando muitas
 * coisas importantes lá no GitHub.» E a regra: enquanto ele é **livre** — não está em nenhum
 * plano de ensino —, pode sair de verdade; vinculado, não.
 *
 * O QUE ACONTECIA. O `DELETE` apagava só o KV. A pasta `professores/<slug>/` continuava com os
 * cinco schemas, o inventário da escola continuava a declará-lo, e o painel — que nasce da
 * pasta, de propósito — continuava a listá-lo. O professor deixava de poder entrar e continuava
 * a existir: o fantasma ao contrário.
 *
 * A GUARDA É DUPLA, e esta prova mede as duas:
 *   · o KV diz «não está em plano nenhum» (a regra que já existia);
 *   · o repositório confirma «não há trabalho na pasta». Um PO, um plano, uma aula, um pacote,
 *     um `.conf` ou uma âncora são proveniência — aí não se apaga, e diz-se o que está lá.
 *
 *   node experimentos/provar-apagar-professor-livre.js
 */

const bastidores = require('../motor/servidor/bastidores.js');
const { comProfessorRemovido, arquivosDeTrabalho } = require('../motor/servidor/repo-escola.js');

const BASE = 'https://calango.tmenegaz77.workers.dev';
const CINCO = ['schema', 'po-schema', 'plano-schema', 'aula-schema', 'captura-schema']
  .map((s) => 'professores/livre/ciclos/ciclo-01-' + s + '.json');

let falhas = 0;
let n = 0;
const conferir = (nome, ok, detalhe) => {
  n += 1;
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok === false ? '  -> ' + JSON.stringify(detalhe) : ''));
  if (!ok) falhas += 1;
};

function criarKv(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
    _d: dados,
  };
}

/**
 * O GitHub falso com o mínimo que a exclusão usa: a árvore (`git/trees/<ref>?recursive=1`), a
 * base (`git/ref` + `git/commits`), o inventário (`contents/`) e as três escritas
 * (`git/trees`, `git/commits`, `git/refs`). Tudo o que se escreve é guardado para se conferir.
 */
function githubFalso({ caminhos, inventario, recusarPrimeiroPutDoIndice = false, recusarPrimeiroPatchDaRef = false }) {
  const chamadas = [];
  const criado = { arvore: null, commit: null, ref: null };
  let putsDoIndice = 0;
  let patchesDaRef = 0;
  const f = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const u = String(url);
    chamadas.push({ url: u, metodo });
    const corpo = init && init.body ? JSON.parse(init.body) : null;

    if (/\/git\/trees\/[^/?]+\?recursive=1$/.test(u)) {
      return { ok: true, status: 200, json: async () => ({ tree: caminhos.map((p) => ({ path: p, type: 'blob' })) }) };
    }
    if (/\/git\/ref\/heads\//.test(u)) {
      return { ok: true, status: 200, json: async () => ({ object: { sha: 'c0' } }) };
    }
    if (/\/git\/commits\/c0$/.test(u)) {
      return { ok: true, status: 200, json: async () => ({ tree: { sha: 't0' } }) };
    }
    // O ACERVO DOS ENVELOPES: sem ele a regra de proveniência não consegue ler e conta como
    // «vinculado» — e a exclusão seria recusada por um motivo que não é o do teste.
    if (metodo === 'GET' && /\/contents\/escola\/[a-z0-9-]+\/envelopes\/\.indice\.json/.test(u)) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          sha: 'e0',
          content: Buffer.from(JSON.stringify({ nomes: [], resumos: {} })).toString('base64'),
        }),
      };
    }
    if (metodo === 'GET' && /\/contents\/escola\/[a-z0-9-]+\/indice\.json/.test(u)) {
      if (!inventario) return { ok: false, status: 404, json: async () => ({}) };
      return {
        ok: true,
        status: 200,
        json: async () => ({ sha: 'i0', content: Buffer.from(JSON.stringify(inventario)).toString('base64') }),
      };
    }
    if (metodo === 'POST' && /\/git\/trees$/.test(u)) {
      criado.arvore = corpo;
      return { ok: true, status: 201, json: async () => ({ sha: 't1' }) };
    }
    if (metodo === 'POST' && /\/git\/commits$/.test(u)) {
      criado.commit = corpo;
      return { ok: true, status: 201, json: async () => ({ sha: 'c1' }) };
    }
    if (metodo === 'PATCH' && /\/git\/refs\/heads\//.test(u)) {
      patchesDaRef += 1;
      if (recusarPrimeiroPatchDaRef && patchesDaRef === 1) {
        return { ok: false, status: 422, json: async () => ({ message: 'Update is not a fast forward' }) };
      }
      criado.ref = corpo;
      return { ok: true, status: 200, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  return { fetch: f, chamadas, criado };
}

/**
 * O GitHub falso do VÍNCULO — só o `contents` do inventário. `recusar` diz quantas vezes a
 * gravação é recusada com 409 antes de aceitar: é a corrida perdida com o CI, medida em produção.
 */
function githubDoVinculo({ inventario, recusar = 0 }) {
  const chamadas = [];
  let recusas = 0;
  const f = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const u = String(url);
    chamadas.push({ url: u, metodo });
    if (metodo === 'GET') {
      if (!inventario) return { ok: false, status: 404, json: async () => ({}) };
      return {
        ok: true,
        status: 200,
        json: async () => ({ sha: 'sha-' + chamadas.length, content: Buffer.from(JSON.stringify(inventario)).toString('base64') }),
      };
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse(init.body || '{}');
      if (recusas < recusar) {
        recusas += 1;
        // O MESMO RECADO QUE O GITHUB DÁ quando a `sha` já não é a do `main`.
        return { ok: false, status: 409, json: async () => ({ message: 'does not match ' + corpo.sha }) };
      }
      return { ok: true, status: 200, json: async () => ({ commit: { sha: 'vc1' } }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  return { fetch: f, chamadas };
}

const env = (kv, token = 'gh') => ({
  ESCOLA_SLUG: 'calango',
  ESCOLA_HABILITADA: 'sim',
  SENHA_ADMIN: 's',
  PROFESSOR_NOME: 'Oculos Redondo',
  PROFESSOR_SLUG: 'oculos-redondo',
  GITHUB_TOKEN: token,
  PADD_KV: kv,
});

const LIVRE = { nome: 'Livre', slug: 'livre' };

async function pedirExclusao(e, corpo = { nome: 'Livre', senhaDirecao: 's' }) {
  return bastidores.fetch(new Request(BASE + '/api/bastidores/professor', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  }), e);
}

async function principais() {
  const original = globalThis.fetch;

  // ── 1. o professor LIVRE sai do repositório e do KV ───────────────────────
  {
    const kv = criarKv({ 'bastidores/calango/professores': JSON.stringify([LIVRE]) });
    const inventario = {
      escola: 'calango',
      professor: { slug: 'oculos-redondo', nome: 'Oculos Redondo' },
      professores: [{ slug: 'livre', nome: 'Livre', desde: '2026-10-22T11:00:00.000Z' }],
    };
    const { fetch, criado } = githubFalso({ caminhos: CINCO, inventario });
    globalThis.fetch = fetch;
    const resposta = await pedirExclusao(env(kv));
    const corpo = await resposta.json();
    globalThis.fetch = original;

    conferir('a exclusão responde 200', resposta.status === 200, corpo);
    const apagados = ((criado.arvore && criado.arvore.tree) || []).filter((t) => t.sha === null).map((t) => t.path);
    conferir('os CINCO schemas são apagados', apagados.length === 5, apagados);
    conferir('…e nada fora da pasta dele', apagados.every((p) => p.indexOf('professores/livre/') === 0), apagados);
    const inv = ((criado.arvore && criado.arvore.tree) || []).find((t) => t.path === 'escola/calango/indice.json');
    conferir('o inventário é reescrito no MESMO commit', !!inv && typeof inv.content === 'string', inv && inv.path);
    const depois = inv ? JSON.parse(inv.content) : {};
    conferir('…sem a linha dele', !('professores' in depois), depois.professores);
    conferir('…e o responsável continua', depois.professor && depois.professor.slug === 'oculos-redondo', depois.professor);
    conferir('o commit diz que ele saiu', /apagar o professor livre/.test((criado.commit || {}).message || ''),
      (criado.commit || {}).message && (criado.commit || {}).message.split('\n')[0]);
    conferir('o ponteiro avançou para esse commit', (criado.ref || {}).sha === 'c1', criado.ref);
    conferir('ele sai do KV', JSON.parse(await kv.get('bastidores/calango/professores') || '[]').length === 0);
    conferir('…e a resposta conta o que saiu', corpo.repositorio && corpo.repositorio.apagados === 5, corpo.repositorio);
  }

  // ── 2. com TRABALHO na pasta, nada é apagado ──────────────────────────────
  {
    const kv = criarKv({ 'bastidores/calango/professores': JSON.stringify([LIVRE]) });
    const comTrabalho = CINCO.concat(['professores/livre/ciclos/ciclo-01-calango-po.md']);
    const { fetch, criado } = githubFalso({ caminhos: comTrabalho, inventario: { escola: 'calango' } });
    globalThis.fetch = fetch;
    const resposta = await pedirExclusao(env(kv));
    const corpo = await resposta.json();
    globalThis.fetch = original;

    conferir('a resposta é 409', resposta.status === 409, corpo);
    conferir('…e diz que é proveniência', /proveniência não se apaga/.test(String(corpo.erro)), corpo.erro);
    conferir('…e nomeia o arquivo que a prova',
      JSON.stringify(corpo.trabalho) === JSON.stringify(['professores/livre/ciclos/ciclo-01-calango-po.md']), corpo.trabalho);
    conferir('nada é escrito no repositório', criado.arvore === null && criado.commit === null, criado);
    conferir('e o professor continua no KV',
      JSON.parse(await kv.get('bastidores/calango/professores') || '[]').length === 1);
  }

  // ── 3. se o GitHub recusar, o professor NÃO sai do KV ─────────────────────
  {
    const kv = criarKv({ 'bastidores/calango/professores': JSON.stringify([LIVRE]) });
    const { fetch } = githubFalso({ caminhos: CINCO, inventario: { escola: 'calango' } });
    globalThis.fetch = async (url, init) => {
      if (init && init.method === 'POST' && /\/git\/trees$/.test(String(url))) {
        return { ok: false, status: 500, json: async () => ({}) };
      }
      return fetch(url, init);
    };
    const resposta = await pedirExclusao(env(kv));
    const corpo = await resposta.json();
    globalThis.fetch = original;

    conferir('a recusa do GitHub vira 502', resposta.status === 502, corpo);
    conferir('…dizendo que nada foi tocado', /Nada foi tocado/.test(String(corpo.erro)), corpo.erro);
    conferir('…e o professor continua no KV',
      JSON.parse(await kv.get('bastidores/calango/professores') || '[]').length === 1);
  }

  // ── 4. A CORRIDA PERDIDA É RELEITURA, NÃO ERRO (22/10/2026) ───────────────
  // O caso medido: `meia-cortada` criado às 09:38 com o CI a escrever no `main` no mesmo
  // segundo. O vínculo chegou com uma `sha` velha, o GitHub recusou, e o professor ficou com a
  // pasta criada e sem escola declarada. Agora a recusa é uma tentativa a mais.
  {
    const { registrarProfessorNaEscola } = require('../motor/servidor/repo-escola.js');
    const inventario = { escola: 'calango', professor: { slug: 'oculos-redondo' } };
    const { fetch, chamadas } = githubDoVinculo({ inventario, recusar: 1 });
    const r = await registrarProfessorNaEscola({
      token: 'gh', dono: 't', repo: 'r', ref: 'main', slug: 'calango', professor: 'livre', nome: 'Livre',
      fetchImpl: fetch,
    });
    const puts = chamadas.filter((c) => c.metodo === 'PUT').length;
    const gets = chamadas.filter((c) => c.metodo === 'GET').length;
    conferir('uma recusa 409 do GitHub não derruba o vínculo', r.ok === true, r);
    conferir('…e o vínculo entrou COM o commit', r.commit === 'vc1', r.commit);
    conferir('…depois de reler o inventário (duas leituras, duas gravações)', gets === 2 && puts === 2, { gets, puts });
    conferir('…e o resultado diz em que tentativa', r.intentos === 2, r.intentos);
  }

  {
    const { registrarProfessorNaEscola } = require('../motor/servidor/repo-escola.js');
    const inventario = { escola: 'calango', professor: { slug: 'oculos-redondo' } };
    const { fetch } = githubDoVinculo({ inventario, recusar: 5 });
    let erro = null;
    try {
      await registrarProfessorNaEscola({
        token: 'gh', dono: 't', repo: 'r', ref: 'main', slug: 'calango', professor: 'livre', nome: 'Livre',
        fetchImpl: fetch,
      });
    } catch (e) { erro = e.message; }
    conferir('três recusas seguidas viram erro DITO (não um laço sem fim)',
      typeof erro === 'string' && /depois de 3 tentativas/.test(erro), erro);
  }

  {
    const { registrarProfessorNaEscola } = require('../motor/servidor/repo-escola.js');
    const inventario = {
      escola: 'calango',
      professores: [{ slug: 'livre', nome: 'Livre', desde: '2026-10-22T11:00:00.000Z' }],
    };
    const { fetch, chamadas } = githubDoVinculo({ inventario });
    const r = await registrarProfessorNaEscola({
      token: 'gh', dono: 't', repo: 'r', ref: 'main', slug: 'calango', professor: 'livre', nome: 'Livre',
      fetchImpl: fetch,
    });
    conferir('quem já está declarado não gera gravação nenhuma (idempotente)',
      r.jaExistia === true && chamadas.filter((c) => c.metodo === 'PUT').length === 0, r);
  }

  // ── 5. a exclusão também perde a corrida, e também refaz ─────────────────
  {
    const kv = criarKv({ 'bastidores/calango/professores': JSON.stringify([LIVRE]) });
    const { fetch, criado } = githubFalso({
      caminhos: CINCO,
      inventario: { escola: 'calango', professor: { slug: 'oculos-redondo' }, professores: [{ slug: 'livre' }] },
      recusarPrimeiroPatchDaRef: true,
    });
    globalThis.fetch = fetch;
    const resposta = await pedirExclusao(env(kv));
    const corpo = await resposta.json();
    globalThis.fetch = original;

    conferir('um 422 no PATCH da referência não derruba a exclusão', resposta.status === 200, corpo);
    conferir('…e o ponteiro acaba por avançar', (criado.ref || {}).sha === 'c1', criado.ref);
    conferir('…e o professor sai do KV na mesma',
      JSON.parse(await kv.get('bastidores/calango/professores') || '[]').length === 0);
  }

  // ── 6. as peças puras ─────────────────────────────────────────────────────
  const soUm = comProfessorRemovido(JSON.stringify({ escola: 'x', professores: [{ slug: 'a' }] }), { professor: 'a' });
  conferir('sem ninguém na lista, a chave é APAGADA (e não deixada a `[]`)',
    soUm !== null && !('professores' in JSON.parse(soUm)), soUm);
  conferir('quem não está na lista não reescreve o inventário',
    comProfessorRemovido(JSON.stringify({ escola: 'x', professores: [{ slug: 'a' }] }), { professor: 'b' }) === null,
    'deveria ser null');

  const trabalho = arquivosDeTrabalho([
    'professores/p/ciclos/ciclo-01-schema.json',
    'professores/p/ciclos/ciclo-01-po-schema.json',
    'professores/p/ciclos/ciclo-01-p-calango.conf',
    'professores/p/ciclos/ciclo-01.conf',
    'professores/p/ciclos/ciclo-01-calango-po.md',
    'professores/p/ciclos/ciclo-01-calango.fipp',
    'professores/p/ciclos/ciclo-01-calango/pacote.json',
  ], 'p');
  conferir('o que conta como trabalho: manifesto, PO, âncora e pacote — e NÃO os schemas',
    JSON.stringify(trabalho),
    JSON.stringify([
      'professores/p/ciclos/ciclo-01-p-calango.conf',
      'professores/p/ciclos/ciclo-01.conf',
      'professores/p/ciclos/ciclo-01-calango-po.md',
      'professores/p/ciclos/ciclo-01-calango.fipp',
      'professores/p/ciclos/ciclo-01-calango/pacote.json',
    ]));
  conferir('…e a pasta de OUTRO professor não conta como trabalho dele',
    JSON.stringify(arquivosDeTrabalho(['professores/q/ciclos/ciclo-01-aula-schema.json'], 'p')), '[]');
  conferir('os cinco schemas do ciclo declarado não bloqueiam a exclusão',
    arquivosDeTrabalho(CINCO, 'livre').length === 0, arquivosDeTrabalho(CINCO, 'livre'));

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principais().catch((e) => { console.error('EXPLODIU:', (e && e.stack) || e); process.exit(1); });
