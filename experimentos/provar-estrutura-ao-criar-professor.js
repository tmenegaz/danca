#!/usr/bin/env node
'use strict';

/**
 * provar-estrutura-ao-criar-professor.js — o professor criado já tem estrutura (22/10/2026).
 *
 * O QUE ACONTECEU. O teste ponta a ponta com o professor SECUNDÁRIO falhou na geração: o
 * `gerar-ciclo.sh` exige `ciclo-NN-po-schema.json` na pasta do professor, e a pasta do
 * `vaso-bonito` não o tinha (run 39660657812, «não consegui ler … po-schema.json»). A correção
 * existia e estava inativa; e, mesmo depois dela, havia uma janela: os schemas só nasciam no
 * «Guardar» do plano ou do PO. Entre o cadastro do professor e esse dia, a pasta dele não era
 * igual à do professor principal.
 *
 * O QUE ESTA PROVA TRAVA. Criar um professor dentro da escola é um ato que já diz «esta pessoa
 * vai trabalhar aqui». Logo a estrutura nasce NESSE ato — e nasce antes, não depois:
 *
 *   1. o POST cria os cinco schemas do ciclo que a escola declara;
 *   2. cria os de TODOS os ciclos declarados (01 e 02), não só do primeiro;
 *   3. quando nada falta, não escreve nada (`pulados`) — o cadastro é idempotente;
 *   4. se o repositório recusa, o professor NÃO é cadastrado e a resposta diz por quê;
 *   5. o ciclo é LIDO do `.conf` no repositório — e, sem ele, o palpite é DITO.
 *
 *   uso: node experimentos/provar-estrutura-ao-criar-professor.js
 */

const bastidores = require('../motor/servidor/bastidores.js');
const { ciclosDaEscola } = require('../motor/servidor/schemas-do-ciclo.js');

const BASE = 'https://calango.tmenegaz77.workers.dev';

let falhas = 0;
const conferir = (nome, ok, detalhe) => {
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok === false ? '  → ' + JSON.stringify(detalhe) : ''));
  if (!ok) falhas += 1;
};

/** Um KV com o contrato mínimo que os Bastidores usam. */
function criarKv(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })),
        list_complete: true,
      };
    },
    _dados: dados,
  };
}

/**
 * Um `fetch` de mentira para a API do GitHub. `arquivos` é o conteúdo que a pasta do professor
 * JÁ tem (os nomes); o resto responde como o Contents API responde.
 */
function githubFalso({ arquivosDaPasta = [], inventario = null, falharPut = false, falharListagem = false } = {}) {
  const chamadas = [];
  const escritasNoInventario = [];
  const f = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const u = String(url);
    chamadas.push({ url: u, metodo });
    const ehListagem = metodo === 'GET' && /\/contents\/professores\/[^/]+\/ciclos(\?|$)/.test(u);
    if (ehListagem) {
      if (falharListagem) return { ok: false, status: 500, json: async () => ({}) };
      return {
        ok: true,
        status: 200,
        json: async () => arquivosDaPasta.map((name) => ({ name, type: 'file' })),
      };
    }
    const ehLeitura = metodo === 'GET' && /\/contents\//.test(u);
    if (ehLeitura) {
      const nome = u.split('/contents/')[1].split('?')[0];
      // O INVENTÁRIO DA ESCOLA — é onde o vínculo com o professor é declarado.
      if (/^escola\/[a-z0-9-]+\/indice\.json$/.test(nome)) {
        if (!inventario) return { ok: false, status: 404, json: async () => ({}) };
        return {
          ok: true,
          status: 200,
          json: async () => ({ sha: 'sha-do-inventario', content: Buffer.from(JSON.stringify(inventario)).toString('base64') }),
        };
      }
      // O molde existe; o destino do professor, só se `arquivosDaPasta` o declarar.
      const existe = nome.startsWith('modelo/') || arquivosDaPasta.indexOf(nome.split('/').pop()) !== -1;
      if (!existe) return { ok: false, status: 404, json: async () => ({}) };
      return {
        ok: true,
        status: 200,
        json: async () => ({ sha: 'x', content: Buffer.from('{"ok":true}').toString('base64') }),
      };
    }
    if (metodo === 'PUT') {
      if (falharPut) return { ok: false, status: 403, json: async () => ({}) };
      if (/\/contents\/escola\/[a-z0-9-]+\/indice\.json$/.test(u)) {
        const corpo = JSON.parse((init && init.body) || '{}');
        escritasNoInventario.push({
          caminho: u.split('/contents/')[1],
          texto: Buffer.from(corpo.content || '', 'base64').toString('utf8'),
          mensagem: corpo.message || '',
          sha: corpo.sha || null,
        });
      }
      return { ok: true, status: 201, json: async () => ({ commit: { sha: 'c1' } }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  return { fetch: f, chamadas, escritasNoInventario };
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

const postarProfessor = (e, corpo = { nome: 'Caneca', sobrenome: 'Pequena', senha: 'p', senhaDirecao: 's' }) =>
  bastidores.fetch(new Request(BASE + '/api/bastidores/professor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  }), e);

async function principais() {
  const original = globalThis.fetch;

  // ── 1. o cadastro cria os cinco schemas do ciclo da escola ────────────────
  {
    const kv = criarKv();
    const { fetch, chamadas } = githubFalso({ arquivosDaPasta: ['ciclo-01-calango.conf', 'ciclo-01.conf'], inventario: { escola: 'calango', professor: { slug: 'oculos-redondo', nome: 'Oculos Redondo' }, ciclo: '01', arquivos: [] } });
    globalThis.fetch = fetch;
    const resposta = await postarProfessor(env(kv));
    const corpo = await resposta.json();
    globalThis.fetch = original;

    conferir('o professor é cadastrado (201)', resposta.status === 201, corpo);
    const puts = chamadas.filter((c) => c.metodo === 'PUT').map((c) => c.url);
    const destinos = puts.map((u) => u.split('/contents/')[1]);
    const esperados = ['schema', 'po-schema', 'plano-schema', 'aula-schema', 'captura-schema']
      .map((s) => 'professores/caneca-pequena/ciclos/ciclo-01-' + s + '.json');
    conferir('cria os CINCO schemas na pasta do professor novo',
      esperados.every((d) => destinos.indexOf(d) !== -1), destinos);
    conferir('…e o relatório diz quantos criou', corpo.estrutura && corpo.estrutura.criados === 5, corpo.estrutura);
    conferir('…com o ciclo lido do `.conf`', corpo.estrutura && corpo.estrutura.ciclos.join(','), '01');
    conferir('o professor EXISTE no KV depois do cadastro',
      JSON.parse(await kv.get('bastidores/calango/professores') || '[]').length === 1);
  }

  // ── 2. todos os ciclos declarados, não só o primeiro ──────────────────────
  {
    const kv = criarKv();
    const { fetch, chamadas } = githubFalso({
      arquivosDaPasta: ['ciclo-01-calango.conf', 'ciclo-02-calango.conf', 'ciclo-01-po-schema.json'],
      inventario: { escola: 'calango', professor: { slug: 'oculos-redondo', nome: 'Oculos Redondo' }, ciclo: '01', arquivos: [] },
    });
    globalThis.fetch = fetch;
    const corpo = await (await postarProfessor(env(kv))).json();
    globalThis.fetch = original;

    conferir('lê os DOIS ciclos do repositório', corpo.estrutura && corpo.estrutura.ciclos.join(','), '01,02');
    const destinos = chamadas.filter((c) => c.metodo === 'PUT').map((u) => u.url.split('/contents/')[1]);
    conferir('cria o ciclo 02 também',
      destinos.some((d) => d.indexOf('/ciclo-02-po-schema.json') !== -1), destinos);
    conferir('…e 10 ao todo (5 por ciclo, contando o que já existia)',
      corpo.estrutura.criados + corpo.estrutura.jaExistiam === 10, corpo.estrutura);
  }

  // ── 3. idempotente: com tudo no lugar, nada é escrito ─────────────────────
  {
    const kv = criarKv();
    const todos = ['ciclo-01-schema.json', 'ciclo-01-po-schema.json', 'ciclo-01-plano-schema.json',
      'ciclo-01-aula-schema.json', 'ciclo-01-captura-schema.json'];
    const { fetch, chamadas } = githubFalso({ arquivosDaPasta: ['ciclo-01-calango.conf', ...todos], inventario: { escola: 'calango', professor: { slug: 'oculos-redondo', nome: 'Oculos Redondo' }, ciclo: '01', arquivos: [] } });
    globalThis.fetch = fetch;
    const corpo = await (await postarProfessor(env(kv))).json();
    globalThis.fetch = original;

    const puts = chamadas.filter((c) => c.metodo === 'PUT' && /professores\//.test(c.url));
    conferir('nada é escrito quando a estrutura já existe', puts.length === 0, puts.length);
    conferir('…e o relatório diz que já existia', corpo.estrutura && corpo.estrutura.jaExistiam === 5, corpo.estrutura);
    conferir('…e o professor é cadastrado na mesma (201)', corpo.ok === true, corpo);
  }

  // ── 4. se o repositório recusa, o professor NÃO nasce ─────────────────────
  {
    const kv = criarKv();
    const { fetch } = githubFalso({ arquivosDaPasta: ['ciclo-01-calango.conf'], falharPut: true, inventario: { escola: 'calango', professor: { slug: 'oculos-redondo', nome: 'Oculos Redondo' }, ciclo: '01', arquivos: [] } });
    globalThis.fetch = fetch;
    const resposta = await postarProfessor(env(kv));
    const corpo = await resposta.json();
    globalThis.fetch = original;

    conferir('a recusa do repositório vira 502', resposta.status === 502, corpo);
    conferir('…e o professor NÃO fica no KV',
      JSON.parse(await kv.get('bastidores/calango/professores') || '[]').length === 0);
    conferir('…e a mensagem diz que ele não foi cadastrado e por quê',
      typeof corpo.erro === 'string' && /NÃO foi cadastrado/.test(corpo.erro), corpo.erro && corpo.erro.slice(0, 80));
  }

  // ── 5. a ESCOLA declara o professor no inventário ────────────────────────
  {
    const kv = criarKv();
    const inventario = { escola: 'calango', professor: { slug: 'oculos-redondo', nome: 'Oculos Redondo' }, ciclo: '01', arquivos: [] };
    const { fetch, escritasNoInventario } = githubFalso({ arquivosDaPasta: ['ciclo-01-calango.conf'], inventario });
    globalThis.fetch = fetch;
    const corpo = await (await postarProfessor(env(kv))).json();
    globalThis.fetch = original;

    conferir('o vínculo com a escola é gravado no inventário', escritasNoInventario.length === 1, escritasNoInventario.length);
    const escrito = escritasNoInventario[0] ? JSON.parse(escritasNoInventario[0].texto) : {};
    conferir('…com o slug e o nome de quem foi cadastrado',
      JSON.stringify((escrito.professores || []).map((p) => p.slug + ':' + p.nome)),
      JSON.stringify(['caneca-pequena:Caneca Pequena']));
    conferir('…com a data do vínculo', !!((escrito.professores || [])[0] || {}).desde,
      (escrito.professores || [])[0] && (escrito.professores || [])[0].desde);
    conferir('…sem reescrever o responsável nem o resto do inventário',
      escrito.professor && escrito.professor.slug === 'oculos-redondo' && escrito.ciclo === '01',
      { professor: escrito.professor, ciclo: escrito.ciclo });
    conferir('…no commit que diz que a escola o declara',
      /a escola calango declara o professor caneca-pequena/.test(escritasNoInventario[0].mensagem),
      escritasNoInventario[0].mensagem);
    conferir('…e a resposta diz em que escola o vínculo ficou',
      corpo.estrutura && corpo.estrutura.vinculo && corpo.estrutura.vinculo.escola, corpo.estrutura);
  }

  // ── 6. o vínculo é IDEMPOTENTE: quem já está declarado não é reescrito ────
  {
    const kv = criarKv();
    const inventario = {
      escola: 'calango',
      professor: { slug: 'oculos-redondo', nome: 'Oculos Redondo' },
      professores: [{ slug: 'caneca-pequena', nome: 'Caneca Pequena', desde: '2026-10-22T10:00:00.000Z' }],
      ciclo: '01',
    };
    const { fetch, escritasNoInventario } = githubFalso({ arquivosDaPasta: ['ciclo-01-calango.conf'], inventario });
    globalThis.fetch = fetch;
    const corpo = await (await postarProfessor(env(kv))).json();
    globalThis.fetch = original;

    conferir('quem já está declarado não é reescrito', escritasNoInventario.length === 0, escritasNoInventario.length);
    conferir('…e a resposta diz que já existia',
      corpo.estrutura && corpo.estrutura.vinculo && corpo.estrutura.vinculo.jaExistia === true, corpo.estrutura);
  }

  // ── 7. sem inventário não há onde declarar: o cadastro NÃO acontece ───────
  {
    const kv = criarKv();
    const { fetch } = githubFalso({ arquivosDaPasta: ['ciclo-01-calango.conf'], inventario: null });
    globalThis.fetch = fetch;
    const resposta = await postarProfessor(env(kv));
    const corpo = await resposta.json();
    globalThis.fetch = original;

    conferir('escola sem inventário recusa o cadastro (502)', resposta.status === 502, corpo.erro);
    conferir('…e o professor não fica no KV',
      JSON.parse(await kv.get('bastidores/calango/professores') || '[]').length === 0);
    conferir('…e a mensagem diz o que faltou', /não tem inventário/.test(String(corpo.erro)), corpo.erro && corpo.erro.slice(0, 90));
  }

  // ── 8. sem token: o cadastro falha, em vez de criar meio professor ────────
  {
    const kv = criarKv();
    const { fetch, chamadas } = githubFalso({ arquivosDaPasta: ['ciclo-01-calango.conf'], inventario: { escola: 'calango', professor: { slug: 'oculos-redondo', nome: 'Oculos Redondo' }, ciclo: '01', arquivos: [] } });
    globalThis.fetch = fetch;
    const resposta = await postarProfessor(env(kv, ''));
    globalThis.fetch = original;

    conferir('sem GITHUB_TOKEN, o cadastro é recusado', resposta.status === 502, resposta.status);
    conferir('…e nenhuma escrita é tentada no repositório',
      chamadas.filter((c) => c.metodo === 'PUT').length === 0);
    conferir('…e o professor não fica no KV',
      JSON.parse(await kv.get('bastidores/calango/professores') || '[]').length === 0);
  }

  // ── 6. o palpite é DITO, e não disfarçado de leitura ──────────────────────
  {
    const { fetch } = githubFalso({ falharListagem: true });
    globalThis.fetch = fetch;
    const r = await ciclosDaEscola({
      token: 'gh', dono: 'tmenegaz', repo: 'danca', professor: 'caneca-pequena', escola: 'calango',
    });
    globalThis.fetch = original;
    conferir('listagem que falha cai no ciclo 01', r.ciclos.join(','), '01');
    conferir('…e diz que foi palpite', typeof r.nota === 'string' && /assumido o ciclo 01/.test(r.nota), r.nota);
  }
}

principais().then(() => {
  console.log('');
  if (falhas) {
    console.log(falhas + ' asserção(ões) falharam');
    process.exit(1);
  }
  console.log('TUDO CERTO — o professor criado já tem a estrutura do professor principal');
}).catch((e) => {
  console.error('erro na prova:', e && e.stack ? e.stack : e);
  process.exit(1);
});
