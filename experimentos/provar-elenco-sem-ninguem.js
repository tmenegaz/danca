#!/usr/bin/env node
'use strict';

/**
 * provar-elenco-sem-ninguem.js — UM ELENCO SEM NINGUÉM (12/11/2026).
 *
 * O QUE MOTIVOU, na letra dela: «Eu tenho nas turmas uma turma vinculada a um elenco, que é o
 * elenco AME. Aí eu fui em audição e fiz a transferência de aluno […] e transferi todos para TAMI.
 * Então agora não tem mais nenhum aluno na AME aonde tem turma […] Isso não pode acontecer.»
 *
 * E a decisão, no turno seguinte: «Um elenco que não tem pessoas dentro do elenco é o mesmo que
 * excluir um elenco. Então a gente vai fazer assim: na transferência, se zerar o elenco, a gente
 * segue o processo da proveniência equivalente ao excluir o elenco […] E aí vai avisar que o elenco
 * será excluído, confirma isso […] Não vamos deixar um elenco ali zerado com não escalado.»
 *
 * AS DUAS METADES DA REGRA, e a diferença é o VÍNCULO:
 *
 *   A. O elenco é o corpo de uma TURMA → a transferência da última aluna é RECUSADA. Uma turma sem
 *      corpo não é um elenco vazio, é uma contradição.
 *   B. O elenco é LIVRE → a transferência passa, e o elenco é EXCLUÍDO com a proveniência do
 *      apagar (lápide no repositório, rascunho fora do KV) — mas só depois de o professor
 *      CONFIRMAR. Sem a confirmação, nada se escreve: nem o destino, que é o primeiro a escrever.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   1. O NÚCLEO — a regra pura: recusa com a frase que nomeia a turma, `zerada` quando é a última
 *      aluna de um elenco livre, e `zerada: false` quando sobram outras.
 *   2. A ROTA sem confirmação — 409 `precisaConfirmar`, e o repositório INTACTO (nenhuma escrita).
 *   3. A ROTA com confirmação — 200, `excluido`, a lápide no repositório (`apagada_em`) e o
 *      rascunho fora do KV, com a aluna no destino.
 *   4. A ROTA com o elenco em TURMA — 409 com a frase da turma, e o repositório intacto.
 *   5. REPETIR depois da exclusão — 200 `jaEstava`, sem escritas novas: o gesto pedido está feito.
 *   6. O `DELETE` continua a apagar pela MESMA função (o caminho antigo não regrediu).
 *   7. O CLIENTE sabe as turmas de cada elenco (`emTurma` no dado) e tem as duas frases — sem uma
 *      segunda cópia do texto: as frases viajam do núcleo como modelo.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` corre o núcleo e o servidor de `REF_NEGATIVO`.
 * Espera-se que reprove — se passasse, a prova não provava.
 *
 * ATENÇÃO À REFERÊNCIA. O `HEAD` por omissão **deixa de servir** assim que este commit entra na
 * história: a partir daí o `HEAD` já tem a regra, a prova passa, e o controle diz «não prova nada»
 * — o que é verdade e é o comportamento certo. A referência usada foi o commit imediatamente
 * anterior: `REF_NEGATIVO=d929a753~1`, que reprova 41 das 59.
 *
 *   node experimentos/provar-elenco-sem-ninguem.js
 *   REF_NEGATIVO=d929a753~1 node experimentos/provar-elenco-sem-ninguem.js --controle-negativo
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const negativo = process.argv.indexOf('--controle-negativo') !== -1;
const REF = process.env.REF_NEGATIVO || 'HEAD';

let destino = RAIZ;
if (negativo) {
  destino = fs.mkdtempSync(path.join(os.tmpdir(), 'elenco-vazio-'));
  execSync('git archive ' + REF + ' motor modelo porta biblioteca tools teste | tar -x -C '
    + JSON.stringify(destino), { cwd: RAIZ, stdio: 'pipe' });
  fs.symlinkSync(path.join(RAIZ, 'node_modules'), path.join(destino, 'node_modules'), 'dir');
  console.log('CONTROLE NEGATIVO contra ' + REF + '\n');
}

const transferencia = require(path.join(destino, 'motor/nucleo/transferencia.js'));
const bastidores = require(path.join(destino, 'motor/servidor/bastidores.js'));

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'calango';
const QUANDO = '2026-11-12T10:00:00.000Z';

/** Uma linha de base CONCLUÍDA — com recorte, que é o que a transferência exige. */
function linha(extra) {
  return Object.assign({
    id: 'ame',
    nome: 'AME',
    professor: 'pe-torto',
    alunas: ['Aluna A'],
    campos: [{ id: 'formato-anatomico-dos-joelhos', nome: 'Formato', grupo: 'Técnica' }],
    atualizada_em: '2026-11-12T09:00:00.000Z',
    carimbo: '20261112-0900',
    chave: 'ame--20261112-0900.json',
  }, extra || {});
}

const AME = linha();
const TAMI = linha({ id: 'tami', nome: 'TAMI', alunas: ['Aluna B'], carimbo: '20261112-0910',
  chave: 'tami--20261112-0910.json' });

// ==========================================================================================
console.log('1. A REGRA — um elenco sem ninguém não existe');

{
  /* A. O ELENCO É O CORPO DE UMA TURMA: a última aluna não sai. */
  const r = transferencia.moverAluna({
    origem: AME, destino: TAMI, aluna: 'Aluna A', quando: QUANDO,
    turmasDaOrigem: ['Piano'],
  });
  provar('a transferência da última aluna de um elenco em turma é RECUSADA', r.ok === false, r);
  provar('…e a frase diz QUAL é a turma', /Piano/.test((r.erros || []).join(' ')), r.erros);
  provar('…e diz o gesto que resolve (desvincular a turma)',
    /desvincule a turma/.test((r.erros || []).join(' ')), r.erros);
  provar('…e não devolve versões nenhumas — nada foi tocado',
    r.origem === undefined && r.destino === undefined, Object.keys(r));
}
{
  /* B. O MESMO ELENCO, LIVRE: passa, e diz que fica zerado. */
  const r = transferencia.moverAluna({
    origem: AME, destino: TAMI, aluna: 'Aluna A', quando: QUANDO, turmasDaOrigem: [],
  });
  provar('sem turma, a última aluna PODE sair', r.ok === true, r.erros);
  provar('…e a decisão diz que o elenco ficou zerado (`zerada`)', r.zerada === true, r.zerada);
  provar('…e a versão da origem fica com zero alunas',
    Array.isArray(r.origem.alunas) && r.origem.alunas.length === 0, r.origem.alunas);
  provar('…e o destino recebe a aluna', r.destino.alunas.indexOf('Aluna A') !== -1,
    r.destino.alunas);
}
{
  /* C. SOBRANDO OUTRAS, nada disto se aplica. */
  const cheio = linha({ id: 'ame', alunas: ['Aluna A', 'Aluna B'] });
  const r = transferencia.moverAluna({
    origem: cheio, destino: TAMI, aluna: 'Aluna A', quando: QUANDO, turmasDaOrigem: ['Piano'],
  });
  provar('com outras alunas, a transferência passa mesmo com o elenco em turma', r.ok === true,
    r.erros);
  provar('…e `zerada` é falso', r.zerada === false, r.zerada);
}
{
  /* D. A TURMA É LIDA DO VÍNCULO, E NÃO DO REGISTO ANTIGO — a frase com duas turmas concorda. */
  const r = transferencia.moverAluna({
    origem: AME, destino: TAMI, aluna: 'Aluna A', quando: QUANDO,
    turmasDaOrigem: ['Piano', 'Rosa'],
  });
  provar('duas turmas: a frase diz as DUAS, no plural',
    /as Turmas «Piano», «Rosa»/.test((r.erros || []).join(' ')), r.erros);
}
{
  /* E. O AVISO DA EXCLUSÃO não nomeia turma nenhuma — é outro caso, outra frase. */
  /* No controle negativo estas funções não existem — e é isso que se mede. A chamada guarda-se
   * para a prova REPROVAR em vez de rebentar: um controle negativo que estoura não diz nada sobre
   * o código de antes. */
  const aviso = typeof transferencia.avisoDoElencoQueSeraExcluido === 'function'
    ? transferencia.avisoDoElencoQueSeraExcluido({ nome: 'AME' }) : '';
  provar('o aviso diz que o elenco SERÁ EXCLUÍDO', /será EXCLUÍDO/.test(aviso), aviso);
  provar('…e pede confirmação, com a saída de cancelar',
    /Confirme/.test(aviso) && /cancele/.test(aviso), aviso);
  provar('…e a proveniência é dita: o registo fica', /proveniência/.test(aviso), aviso);
}

// ==========================================================================================
console.log('\n2. A ROTA — a confirmação é do servidor, e nada se escreve sem ela');

function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); },
    async delete(chave) { dados.delete(chave); },
    _dados: dados,
  };
}

function githubDeBolso(arquivos) {
  const ficheiros = new Map(Object.entries(arquivos || {}));
  const escritas = [];
  const b64 = (t) => Buffer.from(String(t), 'utf8').toString('base64');
  const json = (o, status) => new Response(JSON.stringify(o),
    { status: status || 200, headers: { 'content-type': 'application/json' } });
  const fetchFalso = async (url, opcoes) => {
    const u = new URL(String(url));
    const metodo = (opcoes && opcoes.method) || 'GET';
    if (u.pathname.indexOf('/git/trees/') !== -1) {
      return json({ sha: 'arvore',
        tree: [...ficheiros.keys()].map((p) => ({ path: p, type: 'blob', sha: 's' })) });
    }
    const m = /\/contents\/(.+)$/.exec(u.pathname);
    if (!m) return new Response('nao', { status: 404 });
    const caminho = decodeURIComponent(m[1]);
    if (metodo === 'GET') {
      if (!ficheiros.has(caminho)) return new Response('nao', { status: 404 });
      return json({ sha: 'sha-' + caminho, content: b64(ficheiros.get(caminho)) });
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
      const texto = Buffer.from(String(corpo.content), 'base64').toString('utf8');
      escritas.push({ caminho, mensagem: corpo.message || '', texto });
      ficheiros.set(caminho, texto);
      return json({ commit: { sha: 'c' + escritas.length } }, 201);
    }
    return new Response('nao', { status: 405 });
  };
  return { fetchFalso, escritas, ficheiros };
}

const caminhoDe = (l) => 'escola/' + ESCOLA + '/linhas-de-base/' + l.id + '--' + l.carimbo + '.json';
const indice = (lista) => ({
  versao: 1,
  versoes: Object.fromEntries(lista.map((l) => [l.id + '--' + l.carimbo + '.json', {
    id: l.id, carimbo: l.carimbo, arquivo: caminhoDe(l), nome: l.nome,
    professor: l.professor, turma: null, atualizada_em: l.atualizada_em,
    enviada_em: null, aspectos: (l.campos || []).map((c) => c.id),
    alunas: (l.alunas || []).length,
  }])),
});
const arquivosDoRepo = () => ({
  [caminhoDe(AME)]: JSON.stringify(AME, null, 2) + '\n',
  [caminhoDe(TAMI)]: JSON.stringify(TAMI, null, 2) + '\n',
  ['escola/' + ESCOLA + '/linhas-de-base/.indice.json']:
    JSON.stringify(indice([AME, TAMI]), null, 2) + '\n',
});

/** Uma curadoria que escolhe `linhaDeBase` — é o vínculo elenco↔turma, e é o que a regra lê. */
function curadoriaCom(elenco, turma) {
  return {
    id: 'pe-torto-bale-classico-' + turma, professor: 'pe-torto', modalidade: 'bale-classico',
    tradicao: 'RAD', turma, turmas: [turma], linhaDeBase: elenco, linhaDeBaseNome: elenco,
    alunas: [], nivel: '1',
  };
}

const senha = 'senha-de-prova';
const prepEnv = (estado) => ({
  ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim',
  SENHA_ADMIN: senha, SENHA_PROFESSOR: 'outra',
  PROFESSOR_NOME: 'Professora Dona', PROFESSOR_SLUG: 'dona',
  GITHUB_TOKEN: 'token-de-prova',
  PADD_KV: kvDeMentira(estado.kv || {}),
});
const pedir = async (env, caminho, corpo, metodo) => {
  const verbo = metodo || (corpo === undefined ? 'GET' : 'POST');
  const init = corpo === undefined ? { method: verbo } : {
    method: verbo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
  };
  const r = await bastidores.fetch(
    new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho, init), env);
  const texto = await r.text();
  let json = null;
  try { json = JSON.parse(texto); } catch (e) { json = null; }
  return { status: r.status, json, texto };
};

const fetchOriginal = globalThis.fetch;

(async () => {
  /* A. SEM CONFIRMAÇÃO, NADA SE ESCREVE — nem o destino, que é o primeiro a escrever. */
  {
    const gh = githubDeBolso(arquivosDoRepo());
    const env = prepEnv({});
    globalThis.fetch = gh.fetchFalso;
    let r;
    try {
      r = await pedir(env, '/api/bastidores/elenco-mover', {
        aluna: 'Aluna A', de: 'ame', para: 'tami', senhaDirecao: senha,
      });
    } finally { globalThis.fetch = fetchOriginal; }
    provar('sem confirmação, a transferência que esvazia responde 409', r.status === 409,
      { status: r.status, corpo: r.texto.slice(0, 200) });
    provar('…e a resposta pede confirmação (`precisaConfirmar`)',
      r.json && r.json.precisaConfirmar === true, r.json && Object.keys(r.json));
    provar('…e diz QUAL elenco será excluído',
      r.json && r.json.vaiExcluir && r.json.vaiExcluir.id === 'ame', r.json && r.json.vaiExcluir);
    provar('…e o aviso diz que ele será EXCLUÍDO', r.json && /EXCLUÍDO/.test(r.json.erro || ''),
      r.json && r.json.erro);
    provar('O REPOSITÓRIO FICA INTACTO — nenhuma escrita', gh.escritas.length === 0,
      gh.escritas.map((e) => e.caminho));
    provar('…e o rascunho também não é tocado',
      await env.PADD_KV.get('bastidores/' + ESCOLA + '/linhas-de-base') === null);
  }

  /* B. COM CONFIRMAÇÃO, O ELENCO É EXCLUÍDO — pela proveniência do apagar. */
  {
    const gh = githubDeBolso(arquivosDoRepo());
    const env = prepEnv({});
    globalThis.fetch = gh.fetchFalso;
    let r;
    try {
      r = await pedir(env, '/api/bastidores/elenco-mover', {
        aluna: 'Aluna A', de: 'ame', para: 'tami', senhaDirecao: senha, confirmarExclusao: true,
      });
    } finally { globalThis.fetch = fetchOriginal; }
    provar('com confirmação, responde 200', r.status === 200,
      { status: r.status, corpo: r.texto.slice(0, 300) });
    provar('…e diz qual elenco foi excluído', r.json && r.json.excluido
      && r.json.excluido.id === 'ame', r.json && r.json.excluido);
    provar('…e explica que um elenco sem ninguém é o mesmo que um excluído',
      r.json && /mesmo que um elenco excluído/.test(r.json.avisoDoElenco || ''),
      r.json && r.json.avisoDoElenco);

    const versoes = gh.escritas.filter((e) => e.caminho.indexOf('.indice.json') === -1);
    provar('duas escritas: o destino, e a lápide da origem', versoes.length === 2,
      versoes.map((v) => v.caminho));
    provar('O DESTINO escreve PRIMEIRO — a ordem que nunca perde a aluna',
      versoes[0] && /tami/.test(versoes[0].caminho), versoes.map((v) => v.caminho));
    const doDestino = versoes[0] ? JSON.parse(versoes[0].texto) : {};
    provar('…e o destino tem a aluna', (doDestino.alunas || []).indexOf('Aluna A') !== -1,
      doDestino.alunas);

    const lapide = versoes[1] ? JSON.parse(versoes[1].texto) : {};
    provar('a origem recebe uma LÁPIDE (`apagada_em`), e não uma versão com zero alunas',
      Boolean(lapide.apagada_em), lapide);
    provar('…e a lápide encadeia no elo anterior (`anterior`)', Boolean(lapide.anterior), lapide);
    provar('…e preserva o corpo que existia (a aluna fica no registo)',
      (lapide.alunas || []).indexOf('Aluna A') !== -1, lapide.alunas);
    provar('…e NÃO existe nenhuma versão viva com zero alunas',
      !versoes.some((v) => {
        const c = JSON.parse(v.texto);
        return c.id === 'ame' && !c.apagada_em && (c.alunas || []).length === 0;
      }), versoes.map((v) => (JSON.parse(v.texto).id || '') + ':' + (JSON.parse(v.texto).alunas || []).length));
  }

  /* C. O ELENCO QUE É A TURMA RECUSA — e a frase diz qual. */
  {
    const gh = githubDeBolso(arquivosDoRepo());
    const kv = { ['bastidores/' + ESCOLA + '/curadorias']:
      JSON.stringify([curadoriaCom('ame', 'Piano')]) };
    const env = prepEnv({ kv });
    globalThis.fetch = gh.fetchFalso;
    let r;
    try {
      r = await pedir(env, '/api/bastidores/elenco-mover', {
        aluna: 'Aluna A', de: 'ame', para: 'tami', senhaDirecao: senha, confirmarExclusao: true,
      });
    } finally { globalThis.fetch = fetchOriginal; }
    provar('o elenco que é a Turma «Piano» NÃO pode ser esvaziado', r.status === 409,
      { status: r.status, corpo: r.texto.slice(0, 220) });
    provar('…e a recusa nomeia a turma', /Piano/.test(r.texto), r.texto.slice(0, 160));
    provar('…e NÃO pede confirmação — não é uma coisa que se confirme',
      !(r.json && r.json.precisaConfirmar), r.json && Object.keys(r.json));
    provar('…e nada é escrito, nem confirmando', gh.escritas.length === 0,
      gh.escritas.map((e) => e.caminho));
  }

  /* D. REPETIR DEPOIS DA EXCLUSÃO — o gesto está feito, e diz-se. */
  {
    const gh = githubDeBolso(arquivosDoRepo());
    const env = prepEnv({});
    globalThis.fetch = gh.fetchFalso;
    let primeira, segunda;
    try {
      primeira = await pedir(env, '/api/bastidores/elenco-mover', {
        aluna: 'Aluna A', de: 'ame', para: 'tami', senhaDirecao: senha, confirmarExclusao: true,
      });
      segunda = await pedir(env, '/api/bastidores/elenco-mover', {
        aluna: 'Aluna A', de: 'ame', para: 'tami', senhaDirecao: senha, confirmarExclusao: true,
      });
    } finally { globalThis.fetch = fetchOriginal; }
    provar('a primeira transferência exclui o elenco', primeira.status === 200
      && primeira.json && primeira.json.excluido, primeira.json && primeira.json.excluido);
    provar('repetir depois da exclusão responde 200 (o pedido está satisfeito)',
      segunda.status === 200, { status: segunda.status, corpo: segunda.texto.slice(0, 200) });
    provar('…e diz-se `jaEstava`', segunda.json && segunda.json.jaEstava === true, segunda.json);
    provar('…e o aviso diz que a origem já não existe',
      segunda.json && /já não existe/.test(segunda.json.aviso || ''), segunda.json && segunda.json.aviso);
  }

  /* E. O `DELETE` CONTINUA A APAGAR — pela mesma função, sem regressão. */
  {
    const gh = githubDeBolso(arquivosDoRepo());
    const env = prepEnv({});
    globalThis.fetch = gh.fetchFalso;
    let r;
    try {
      r = await pedir(env, '/api/bastidores/linha-de-base',
        { id: 'ame', senhaDirecao: senha, professor: 'pe-torto' }, 'DELETE');
    } finally { globalThis.fetch = fetchOriginal; }
    provar('o DELETE do elenco responde 200', r.status === 200,
      { status: r.status, corpo: r.texto.slice(0, 200) });
    provar('…e diz que ficou registado na proveniência',
      r.json && /proveniência|repositório/.test(r.json.lapide || ''), r.json && r.json.lapide);
    const lapides = gh.escritas.filter((e) => /ame/.test(e.caminho));
    provar('…e grave uma lápide no repositório', lapides.length >= 1
      && /apagada_em/.test(lapides[0].texto), lapides.map((l) => l.caminho));
  }

  /* F. O CLIENTE SABE AS TURMAS DE CADA ELENCO, e as frases vêm do núcleo. */
  {
    const html = bastidores.paginaProducao(ESCOLA,
      { professor: 'pe-torto', escola: ESCOLA, query: 'professor=pe-torto&escola=' + ESCOLA },
      [{ nome: 'Pe Torto', slug: 'pe-torto' }], ['Aluna A', 'Aluna B'], 'Pe Torto', 'pe-torto',
      /* trms, trmos, rel, curs, rbs, pares, usosDosEnvelopes, aparencia, turmaEmFoco, linha */
      [], [], {}, [{
        id: 'pe-torto-bale-classico-Piano', professor: 'pe-torto', modalidade: 'Balé clássico',
        tradicao: 'RAD', turma: 'Piano', turmas: ['Piano'], linhaDeBase: 'ame',
        linhaDeBaseNome: 'AME', alunas: ['Aluna A'], nivel: '1',
      }], [], [], { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() },
      { modo: 'clara', paleta: 'bordo' }, '', [AME, TAMI]);
    provar('o dado do cliente traz `emTurma` para cada elenco', /emTurma/.test(html), html.length);
    provar('…e a AME vai marcada como estando na turma',
      /"id":"ame"[^}]*"emTurma":\["Piano"\]/.test(html.replace(/\s+/g, '')), 'procura no HTML');
    provar('…e a TAMI vai livre', /"id":"tami"[^}]*"emTurma":\[\]/.test(html.replace(/\s+/g, '')),
      'procura no HTML');
    /* O RÓTULO DIZ «EM TURMA», e é a MESMA frase no `<select>` do servidor e na repintura do
     * cliente (o servidor compõe-na uma vez e manda-a pronta em `rotuloMover`). Um professor que
     * escolhe a AME como origem vê, antes de tentar, que ela é o corpo de uma turma. */
    provar('o rótulo da origem avisa «em turma»',
      /AME — 1 aluna( \(rascunho\))? — em turma|AME — 1 aluna — em turma/.test(html), 'procura no HTML');
    provar('…e o rótulo vem pronto do servidor (`rotuloMover`), não composto no cliente',
      /rotuloMover/.test(html), 'procura no HTML');
    provar('as duas frases viajam como MODELO, do núcleo',
      /MODELOS_DO_ELENCO_VAZIO/.test(html) && /%ELENCO%/.test(html), 'procura no HTML');
    provar('o cliente sabe preencher o modelo (uma função, e não o texto copiado)',
      /function fraseDoModelo/.test(html) && /%TURMAS%/.test(html), 'procura no HTML');
    provar('…e o texto da frase NÃO é reescrito no cliente',
      (html.match(/esta é a última aluna de/g) || []).length === 2,
      (html.match(/esta é a última aluna de/g) || []).length);
  }

  /* G. O CLIENTE A CORRER — a pergunta é feita ANTES do pedido, e o pedido não parte sem ela. */
  {
    let JSDOM, VirtualConsole;
    try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { JSDOM = null; }
    if (!JSDOM) {
      console.log('  —   o cliente a correr: NÃO MEDIDO (jsdom ausente)');
    } else {
      const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
      const html = bastidores.paginaProducao(ESCOLA,
        { professor: 'pe-torto', escola: ESCOLA, query: 'professor=pe-torto&escola=' + ESCOLA },
        [{ nome: 'Pe Torto', slug: 'pe-torto' }], ['Aluna A', 'Aluna B'], 'Pe Torto', 'pe-torto',
        [], [], {}, [{
          id: 'pe-torto-bale-classico-Piano', professor: 'pe-torto', modalidade: 'Balé clássico',
          tradicao: 'RAD', turma: 'Piano', turmas: ['Piano'], linhaDeBase: 'ame',
          linhaDeBaseNome: 'AME', alunas: ['Aluna A'], nivel: '1',
        }], [], [], usos, { modo: 'clara', paleta: 'bordo' }, '', [AME, TAMI]);

      let pedidos = 0;
      let confirmacoes = 0;
      let respostaDoConfirm = true;
      /* As linhas que o `carregarLinhas` do cliente lê. Mudam no meio da prova: a segunda metade
       * precisa do elenco já VAZIO, que é o estado que a regra nova não deixa criar e que existe
       * em produção. */
      let linhasDoFetch = [AME, TAMI];
      const vc = new VirtualConsole();
      vc.on('jsdomError', () => {});
      const dom = new JSDOM(html.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: 'https://' + ESCOLA + '.workers.dev/bastidores/producao',
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.confirm = () => { confirmacoes += 1; return respostaDoConfirm; };
          w.alert = () => {};
          w.fetch = (u) => {
            const url = String(u);
            if (url.indexOf('elenco-mover') !== -1) pedidos += 1;
            /* `elencosComAsTurmas` não existe no código de antes — e o controle negativo tem de
             * REPROVAR, não rebentar. A guarda devolve a lista crua nesse caso: a prova mede
             * então o que o código de antes fazia de facto, e o cliente mostra o elenco zerado
             * como «em turma». */
            const comTurmas = typeof bastidores.elencosComAsTurmas === 'function'
              ? bastidores.elencosComAsTurmas(linhasDoFetch, [curadoriaCom('ame', 'Piano')])
              : bastidores.elencosParaATurma(linhasDoFetch);
            const corpo = url.indexOf('linhas-de-base') !== -1
              ? { ok: true, linhas: linhasDoFetch, elencos: comTurmas }
              : { ok: true };
            return Promise.resolve({ ok: true, status: 200,
              json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
          };
        },
      });
      const win = dom.window;
      const doc = win.document;
      await new Promise((r) => win.setTimeout(r, 300));

      const de = doc.getElementById('mv-de');
      const aluna = doc.getElementById('mv-aluna');
      const para = doc.getElementById('mv-para');
      const form = doc.getElementById('form-mover');
      const mudar = (el) => el.dispatchEvent(new win.Event('change', { bubbles: true }));

      provar('o `<select>` de origem mostra o elenco em turma, e diz porquê',
        [...de.options].some((o) => /AME/.test(o.textContent) && /em turma/.test(o.textContent)),
        [...de.options].map((o) => o.textContent));

      /* A AME é a Turma «Piano»: escolhê-la como origem, com uma aluna só, é o caso recusado. */
      de.value = 'ame'; mudar(de);
      aluna.value = 'Aluna A'; mudar(aluna);
      para.value = 'tami'; mudar(para);
      pedidos = 0; confirmacoes = 0;
      form.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
      await new Promise((r) => win.setTimeout(r, 80));
      const caixa = doc.querySelector('[data-res=transferencia]');
      provar('o elenco em TURMA não parte para o servidor', pedidos === 0, pedidos);
      provar('…e a recusa aparece na caixa, com o nome da turma',
        caixa && /Piano/.test(caixa.textContent), caixa && caixa.textContent);
      provar('…e não se pergunta nada — não é uma coisa que se confirme', confirmacoes === 0,
        confirmacoes);

      /* Agora o caso livre: a TAMI como origem. Pergunta-se, e a resposta decide. */
      de.value = 'tami'; mudar(de);
      aluna.value = 'Aluna B'; mudar(aluna);
      para.value = 'ame'; mudar(para);
      pedidos = 0; confirmacoes = 0; respostaDoConfirm = false;
      form.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
      await new Promise((r) => win.setTimeout(r, 80));
      provar('o elenco LIVRE pergunta antes de excluir', confirmacoes === 1, confirmacoes);
      provar('…e, cancelando, o pedido NÃO parte', pedidos === 0, pedidos);

      pedidos = 0; confirmacoes = 0; respostaDoConfirm = true;
      form.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
      await new Promise((r) => win.setTimeout(r, 80));
      provar('…e, confirmando, o pedido parte UMA vez', pedidos === 1, pedidos);

      /* F2. O ELENCO QUE JÁ ESTÁ NESSE ESTADO É SINALIZADO NA LISTAGEM. A regra impede os
       * próximos, e não apaga os que existem — o caso estava no ar («ami — 0 alunas — em turma»).
       * A sonda é o CARTÃO desenhado, e não a string no `<script>`: o script do cliente contém
       * as duas frases (a condicional inteira), e procurá-las lá mediria o código, não a tela. */
      /* O CASO REAL: o elenco que É a turma e ficou com ZERO alunas. A regra nova impede os
       * próximos e não apaga os que existem — e um deles estava no ar (`ami — 0 alunas — em
       * turma`). O professor tem de o ver, com o caminho: outro elenco para a turma, ou as
       * alunas de volta. */
      linhasDoFetch = [Object.assign({}, AME, { alunas: [] }), TAMI];
      await win.carregarLinhas();
      await new Promise((r) => win.setTimeout(r, 80));
      const cartoes = [...doc.querySelectorAll('#lb-lista li.trio-plano')];
      const doAme = cartoes.find((li) => /AME/.test(li.textContent));
      provar('o elenco que é a turma e não tem ninguém mostra o alerta «sem alunas»',
        Boolean(doAme) && /sem alunas/.test(doAme.textContent), doAme && doAme.textContent.trim().slice(0, 80));
      provar('…e a dica diz o que resolve',
        Boolean(doAme) && /Escolha outro elenco para a turma/.test(
          (doAme.querySelector('.selo') || {}).getAttribute
            ? doAme.querySelector('.selo').getAttribute('title') : ''), 'title do selo');
      provar('…e não é o selo «em turma»',
        Boolean(doAme) && !/\bem turma\b/.test(doAme.querySelector('.selo').textContent),
        doAme && doAme.querySelector('.selo').textContent);

      win.close();
    }
  }

  console.log('\n' + (falhas ? 'FALHARAM ' + falhas + ' de ' + n
    : 'TUDO CERTO — ' + n + ' asserções: um elenco sem ninguém não existe — a turma impede, o livre '
      + 'exclui-se com confirmação, e a proveniência fica.'));

  if (negativo) {
    if (falhas === 0) { console.log('A PROVA NÃO PROVA NADA: o código de antes passou tudo.'); process.exit(1); }
    console.log('Como esperado: o código de antes reprova ' + falhas + ' de ' + n + '.');
    process.exit(0);
  }
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.error('A prova rebentou: ' + (e && e.stack || e));
  process.exit(1);
});
