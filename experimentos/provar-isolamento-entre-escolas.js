#!/usr/bin/env node
'use strict';

/*
 * provar-isolamento-entre-escolas.js — o dado de uma escola não é alcançável por outra.
 *
 * POR QUE ESTA PROVA EXISTE (13/11/2026). A pergunta que a pôs em pé veio da conversa sobre
 * multi-tenant: «eu posso pôr em risco que, se uma escola pediu para apagar um professor, eu vá
 * apagar os professores de todas as outras?». A resposta era «não, porque toda a chave carrega a
 * escola» — mas era **afirmação**, não asserção do repositório. As provas que existiam mediam o
 * EXPURGO (o caso extremo, que apaga), e nenhuma media o dia a dia: a escrita comum, a leitura
 * comum, a listagem.
 *
 * A AFIRMAÇÃO, PRECISADA. O isolamento desta casa não vem de haver um Worker por escola — vem de
 * o **caminho** carregar a escola, em três famílias independentes:
 *
 *   · CADASTRO (`bastidores/<escola>/…`) — as rotas dos Bastidores escrevem a chave por extenso;
 *   · ENVELOPE e CUSTO (`envelope/…`, `ia-registro/…`) — famílias que NÃO carregam a escola na
 *     chave lógica, e a quem o adaptador põe o slug à frente (`<escola>/envelope/…`);
 *   · REPOSITÓRIO (`escola/<escola>/envelopes/…`, `escola/<escola>/linhas-de-base/…`).
 *
 * É por isso que a prova é sobre as três. E é por isso que ela continua a valer quando o
 * multi-tenant mudar a topologia dos Workers: as chaves não dependem de quem as serve.
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   1. o ADAPTADOR namespaça o envelope e o custo — duas escolas com o mesmo id de envelope não
 *      se veem, e a chave física de uma nunca é a chave física da outra;
 *   2. os CADASTROS: criar e apagar professor/aluna/turma numa escola não escreve uma única chave
 *      fora de `bastidores/<escola>/`, e a outra escola fica **byte a byte** igual;
 *   3. LER como A não devolve o dado de B — nem pela rota, nem pela lista;
 *   4. o EXPURGO de A não tem ALCANCE sobre B (os prefixos de uma não casam com as chaves da
 *      outra) — a trava que já existe, medida;
 *   5. os CAMINHOS do repositório de uma escola não casam com o padrão do acervo da outra;
 *   6. CONTROLO NEGATIVO: sem o `ESCOLA_SLUG` no adaptador (a forma que existia antes de
 *      20/10/2026), a escola B LÊ o envelope da A. Se o controlo passasse, a prova estaria a
 *      medir o nome das chaves, e não o isolamento.
 *
 *   node experimentos/provar-isolamento-entre-escolas.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const { criarCloudflare } = require(path.join(RAIZ, 'motor/adaptadores/cloudflare.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const acervo = require(path.join(RAIZ, 'motor/servidor/acervo-envelopes.js'));
const expurgo = require(path.join(RAIZ, 'motor/servidor/expurgar-escola.js'));

let ok = 0;
let ko = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
  else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
};

const ESCOLA_A = 'calango';
const ESCOLA_B = 'batata';

/** O KV de mentira, com o contrato que o motor usa — e com o registo das chaves escritas. */
function criarKv() {
  const dados = new Map();
  const escritas = [];
  return {
    dados,
    escritas,
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { escritas.push(chave); dados.set(chave, String(valor)); },
    async delete(chave) { escritas.push('DEL ' + chave); dados.delete(chave); },
    async list({ prefix = '' } = {}) {
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })),
        list_complete: true,
      };
    },
  };
}

/** Um `env` de escola. Sem ASSETS: o adaptador cai no KV, que é o que se quer medir. */
function ambiente(kv, slug) {
  return {
    ESCOLA_SLUG: slug,
    ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: 'senha-da-direcao',
    SENHA_PROFESSOR: 'senha-do-professor',
    PROFESSOR_NOME: 'Tiago',
    /* SEM TOKEN, DE PROPÓSITO. O isolamento que esta prova mede é o do KV; com token, a guarda de
     * proveniência iria ao repositório (e, sem rede, recusaria o apagamento — comportamento certo,
     * mas que mediria outra coisa). */
    GITHUB_TOKEN: null,
    PADD_KV: kv,
  };
}

/** Uma fotografia das chaves e dos valores — para comparar antes/depois sem ambiguidade. */
function retrato(kv) {
  return [...kv.dados.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
}

(async () => {
  /* ── 1. O ADAPTADOR: envelope e custo ───────────────────────────────────────────────────── */
  console.log('\n1 · o adaptador põe a escola à frente do envelope e do custo');
  {
    const kv = criarKv();
    const armA = criarCloudflare(ambiente(kv, ESCOLA_A));
    const armB = criarCloudflare(ambiente(kv, ESCOLA_B));

    /* O MESMO ID nas duas escolas — é o caso que interessa: se o adaptador não namespaçasse, a
     * segunda escrita apagava a primeira. */
    await armA.guardar('envelope/anamnese-20260101-0900.json', 'da-escola-A');
    await armB.guardar('envelope/anamnese-20260101-0900.json', 'da-escola-B');
    await armA.anexar('ia-registro/2026-11.jsonl', '{"custo":"A"}\n');
    await armB.anexar('ia-registro/2026-11.jsonl', '{"custo":"B"}\n');

    provar('a escola A lê o PRÓPRIO envelope',
      (await armA.ler('envelope/anamnese-20260101-0900.json')) === 'da-escola-A');
    provar('a escola B lê o PRÓPRIO envelope (o mesmo id, valor diferente)',
      (await armB.ler('envelope/anamnese-20260101-0900.json')) === 'da-escola-B');
    provar('o custo também: A lê o de A',
      (await armA.ler('ia-registro/2026-11.jsonl')) === '{"custo":"A"}\n');
    provar('o custo também: B lê o de B',
      (await armB.ler('ia-registro/2026-11.jsonl')) === '{"custo":"B"}\n');

    const fisicas = [...kv.dados.keys()].sort();
    /* O adaptador escreve também o REGISTRO DE CHAVES de cada escola (`bastidores/<e/c>/.chaves.json`)
     * — é ele que permite ao expurgo apagar sem enumerar. São, por isso, mais do que quatro. */
    provar('todas as chaves físicas começam por um dos dois slugs',
      fisicas.length >= 4 && fisicas.every((c) => c.startsWith(ESCOLA_A + '/')
        || c.startsWith(ESCOLA_B + '/') || c.startsWith('bastidores/' + ESCOLA_A + '/')
        || c.startsWith('bastidores/' + ESCOLA_B + '/')),
      fisicas);
    provar('a chave física leva o slug; a lógica não',
      fisicas.includes(ESCOLA_A + '/envelope/anamnese-20260101-0900.json'), fisicas);
  }

  /* ── 2. OS CADASTROS: criar e apagar numa escola não toca na outra ──────────────────────── */
  console.log('\n2 · os cadastros de A não escrevem uma única chave fora de `bastidores/A/`');
  {
    const kv = criarKv();
    const envA = ambiente(kv, ESCOLA_A);
    const envB = ambiente(kv, ESCOLA_B);
    const pedir = async (env, caminho, init) => {
      const r = await bastidores.fetch(new Request('https://' + env.ESCOLA_SLUG + '.x.local' + caminho, init), env);
      if (!r) throw new Error('os Bastidores não trataram ' + caminho);
      return { status: r.status, corpo: await r.json().catch(() => null) };
    };
    const json = (corpo) => ({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(corpo),
    });

    /* O PASSO DO REPOSITÓRIO ACONTECE MESMO, e é aqui que se vê porquê: o `DELETE` do professor
     * apaga também a pasta dele no repositório (`professores/<slug>/`). Sem rede, a rota recusaria
     * em 502 com «nada foi tocado» — comportamento certo, mas que não exercia a escrita no KV.
     * A árvore falsa está VAZIA, e portanto o passo do repositório é um «já não existia»: nada é
     * escrito lá, e o que se mede é só o KV. */
    const fetchReal = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      const u = String(url && url.url ? url.url : url);
      if (!/api\.github\.com/.test(u)) return fetchReal(url, init);
      const resp = (obj, status = 200) => new Response(JSON.stringify(obj),
        { status, headers: { 'content-type': 'application/json' } });
      if (/\/git\/trees\//.test(u)) return resp({ tree: [] });
      if (/\/contents\//.test(u)) return resp({ message: 'Not Found' }, 404);
      return resp({ sha: 'sha-da-prova' });
    };

    /* O CADASTRO É SEMEADO NO KV, e não pela rota do professor: essa rota também cria a estrutura
     * do professor no REPOSITÓRIO (`professores/<slug>/ciclos/…`), e esta prova mede o KV. Semear
     * à mão é mais fiel ao que se mede — e é o mesmo que a rota grava. */
    const professor = { nome: 'Tiago Menegaz', slug: 'tiago-menegaz', sal: 's', hash: 'h' };
    for (const slug of [ESCOLA_A, ESCOLA_B]) {
      await kv.put('bastidores/' + slug + '/professores', JSON.stringify([professor]));
      await kv.put('bastidores/' + slug + '/alunas', JSON.stringify(['ami']));
    }
    const antesDeB = retrato(kv).filter(([c]) => c.startsWith('bastidores/' + ESCOLA_B + '/'));
    provar('as duas escolas começam com o MESMO cadastro (o cenário difícil)',
      antesDeB.length === 2 && antesDeB.every(([, v]) => v.indexOf('ami') !== -1 || v.indexOf('Tiago') !== -1),
      antesDeB.map(([c]) => c));

    /* AGORA O ATO QUE A PESQUISADORA TEMIA: apagar, numa escola, o que ela pediu. */
    kv.escritas.length = 0;
    const apagouProfessor = await pedir(envA, '/api/bastidores/professor',
      { method: 'DELETE', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nome: 'Tiago Menegaz', senhaDirecao: 'senha-da-direcao' }) });
    const apagouAluna = await pedir(envA, '/api/bastidores/aluna',
      { method: 'DELETE', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ apelido: 'ami', senhaDirecao: 'senha-da-direcao' }) });
    provar('os dois apagamentos foram aceites pela rota',
      apagouProfessor.status < 400 && apagouAluna.status < 400,
      [apagouProfessor.status, apagouAluna.status, apagouProfessor.corpo, apagouAluna.corpo]);

    const escritasDoAto = kv.escritas.filter((c) => !c.startsWith('DEL '));
    /* «PERTENCE À ESCOLA A» TEM DOIS PREFIXOS, e é a mesma dupla do expurgo: o cadastro vai por
     * extenso (`bastidores/A/…`) e as famílias que o adaptador namespaça ficam em `A/…`
     * (`envelope/`, `ia-registro/`). O que não pode existir é uma escrita fora dos dois. */
    const prefixosDeA = expurgo.prefixosDaEscola(ESCOLA_A);
    const foraDaEscola = escritasDoAto.filter((c) => !prefixosDeA.some((p) => c.startsWith(p)));
    provar('nenhuma escrita do ato saiu dos prefixos da escola A (' + escritasDoAto.length + ' escrita(s))',
      foraDaEscola.length === 0, foraDaEscola);

    const depoisDeB = retrato(kv).filter(([c]) => c.startsWith('bastidores/' + ESCOLA_B + '/'));
    provar('a escola B ficou BYTE A BYTE igual',
      JSON.stringify(antesDeB) === JSON.stringify(depoisDeB),
      { antes: antesDeB.length, depois: depoisDeB.length });

    /* E o contrário da leitura: B continua a ver o seu, A deixou de ver o seu. */
    const alunaDeA = await pedir(envA, '/api/bastidores/alunas');
    const alunaDeB = await pedir(envB, '/api/bastidores/alunas');
    const nomes = (r) => JSON.stringify(r.corpo);
    provar('A já não tem a aluna que apagou', nomes(alunaDeA).indexOf('"ami"') === -1, alunaDeA.corpo);
    provar('B continua a ter a sua (o apagamento de A não a alcançou)',
      nomes(alunaDeB).indexOf('"ami"') !== -1, alunaDeB.corpo);
    const profDeA = await pedir(envA, '/api/bastidores/professores');
    const profDeB = await pedir(envB, '/api/bastidores/professores');
    globalThis.fetch = fetchReal;
    provar('A perdeu o professor, B manteve o dela — o ato que a pesquisadora temia',
      JSON.stringify(profDeA.corpo).indexOf('tiago-menegaz') === -1
        && JSON.stringify(profDeB.corpo).indexOf('tiago-menegaz') !== -1,
      { A: profDeA.corpo, B: profDeB.corpo });
  }

  /* ── 3. LER COMO A NÃO DEVOLVE O DE B ──────────────────────────────────────────────────── */
  console.log('\n3 · a leitura da escola A não alcança o cadastro da escola B');
  {
    const kv = criarKv();
    /* A chave vai escrita à mão: o que se mede é a ROTA a ler, não a rota a escrever. */
    await kv.put('bastidores/' + ESCOLA_B + '/alunas', JSON.stringify(['aluna-da-batata']));
    await kv.put('bastidores/' + ESCOLA_A + '/alunas', JSON.stringify(['aluna-do-calango']));
    const envA = ambiente(kv, ESCOLA_A);
    const r = await bastidores.fetch(new Request('https://' + ESCOLA_A + '.x.local/api/bastidores/alunas'), envA);
    const corpo = await r.json();
    provar('A vê a sua', JSON.stringify(corpo).indexOf('aluna-do-calango') !== -1, corpo);
    provar('A NÃO vê a da B', JSON.stringify(corpo).indexOf('aluna-da-batata') === -1, corpo);
  }

  /* ── 4. O EXPURGO DE A NÃO TEM ALCANCE SOBRE B ─────────────────────────────────────────── */
  console.log('\n4 · os prefixos do expurgo de A não casam com nenhuma chave de B');
  {
    const prefixosA = expurgo.prefixosDaEscola(ESCOLA_A);
    const chavesDeB = [
      'bastidores/' + ESCOLA_B + '/alunas',
      'bastidores/' + ESCOLA_B + '/professores',
      ESCOLA_B + '/envelope/anamnese-20260101-0900.json',
      ESCOLA_B + '/ia-registro/2026-11.jsonl',
    ];
    const alcancadas = chavesDeB.filter((c) => prefixosA.some((p) => c.startsWith(p)));
    provar('nenhuma chave de B começa por um prefixo de A', alcancadas.length === 0, alcancadas);
    provar('e os prefixos de A casam com as chaves de A (o expurgo não ficou cego)',
      ['bastidores/' + ESCOLA_A + '/alunas', ESCOLA_A + '/envelope/x.json']
        .every((c) => prefixosA.some((p) => c.startsWith(p))), prefixosA);
    /* O PERIGO ESPECÍFICO: um slug que é PREFIXO do outro. `cala` e `calango` — o `startsWith`
     * apanharia a escola errada se o prefixo não tivesse a barra. */
    provar('um slug que é prefixo de outro não é confundido (a barra é a trava)',
      expurgo.prefixosDaEscola('cala').some((p) => ('bastidores/calango/alunas').startsWith(p)) === false,
      expurgo.prefixosDaEscola('cala'));
  }

  /* ── 5. OS CAMINHOS DO REPOSITÓRIO ─────────────────────────────────────────────────────── */
  console.log('\n5 · os caminhos do acervo de A não pertencem ao padrão de B');
  {
    const deA = acervo.caminhoDaChave(ESCOLA_A, 'envelope/anamnese-20260101-0900.json');
    provar('o caminho de A é `escola/A/envelopes/…`',
      deA === 'escola/' + ESCOLA_A + '/envelopes/anamnese-20260101-0900.json', deA);
    provar('o inverso reconhece a escola de A', (acervo.lerCaminho(deA) || {}).escola === ESCOLA_A);
    provar('e o acervo de A não reconhece o caminho de B como seu',
      acervo.ehAcervoDaEscola('escola/' + ESCOLA_B + '/envelopes/x.json', ESCOLA_A) === false);
    provar('nem o acervo de B reconhece o de A',
      acervo.ehAcervoDaEscola(deA, ESCOLA_B) === false);
    /* A BARRA É RECUSADA, e não codificada: um nome com `/` cairia noutra pasta do repositório —
     * e outra pasta pode ser a de outra escola. */
    let recusou = false;
    try { acervo.caminhoDaChave(ESCOLA_A, 'envelope/../' + ESCOLA_B + '/x.json'); } catch (erro) { recusou = true; }
    provar('um nome de envelope com barra é RECUSADO (não escapa para outra pasta)', recusou);
  }

  /* ── 6. CONTROLO NEGATIVO ──────────────────────────────────────────────────────────────── */
  console.log('\n6 · controlo negativo: sem `ESCOLA_SLUG`, a escola B lê o envelope da A');
  {
    /* A FORMA ANTERIOR A 20/10/2026: um adaptador sem escola. Escreve um, lê outro — é o que
     * acontecia com duas escolas no mesmo namespace. */
    const kvSem = criarKv();
    const semEscolaQueEscreve = criarCloudflare({ PADD_KV: kvSem, ESCOLA_SLUG: '' });
    const semEscolaQueLe = criarCloudflare({ PADD_KV: kvSem, ESCOLA_SLUG: '' });
    await semEscolaQueEscreve.guardar('envelope/plano-20260101-0800.json', 'plano-da-escola-A');
    provar('o adaptador SEM escola: quem escreve e quem lê partilham a chave (é o defeito)',
      (await semEscolaQueLe.ler('envelope/plano-20260101-0800.json')) === 'plano-da-escola-A');

    /* E com escola, o MESMO id escrito por A não é alcançável por B. */
    const kvCom = criarKv();
    const armA = criarCloudflare(ambiente(kvCom, ESCOLA_A));
    const armB = criarCloudflare(ambiente(kvCom, ESCOLA_B));
    await armA.guardar('envelope/plano-20260101-0800.json', 'plano-secreto-da-escola-A');
    provar('e com escola, B NÃO lê o mesmo id',
      (await armB.ler('envelope/plano-20260101-0800.json')) === null,
      await armB.ler('envelope/plano-20260101-0800.json'));
  }

  console.log('\n' + (ko ? 'FALHOU' : 'TUDO CERTO') + ' — ' + ok + ' asserção(ões)' +
    (ko ? ', ' + ko + ' falha(s)' : '') + '.');
  process.exit(ko ? 1 : 0);
})().catch((erro) => { console.error(erro); process.exit(1); });
