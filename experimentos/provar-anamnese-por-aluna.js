#!/usr/bin/env node
'use strict';

/**
 * provar-anamnese-por-aluna.js — o ato é de UMA aluna, e a página não troca dela.
 *
 * OS DOIS DEFEITOS (26/10/2026, lidos na tela pela pesquisadora, na escola de teste «Breu»).
 *
 * 1. «Eu clico em fazer anamnese, ele vai para o formulário e imediatamente volta para a anamnese
 *    do aluno, e aí fica habilitado os dois botões de continuar de onde parei ou começar de novo.»
 *    A causa medida: a escola chama-se BREU, e «breu» é uma das três palavras que marcam uma
 *    escola como ESCOLA DE TESTE (`Calango`→1, `Batata`→2, `Breu`→3). Toda porta dessa escola
 *    recebe o preenchedor do fixture, que corria ANTES de a aluna do ato chegar ao seletor: sem
 *    aluna escolhida caía no primeiro registo do fixture («Aluna A») e ESCREVIA essa aluna no
 *    campo. O ato dizia B, o campo dizia A, a porta compara os dois para autorizar o bilhete, não
 *    batiam — e a página devolvia a pessoa à lista. O depósito que o preenchedor gravava é o que
 *    fazia a lista oferecer «continuar» sobre um preenchimento que ninguém fez.
 *
 * 2. O depósito do navegador não conhecia a aluna. `porta-<fonte>-<escola>-<professor>-<ciclo>-1`
 *    era a chave, e o rascunho da Aluna A era restaurado ao abrir o ato da Aluna B — as respostas
 *    de uma entravam no documento da outra. Medido: `idade` da A aparecia no mapa da B.
 *
 * O QUE SE PROVA:
 *
 *   1. o preenchedor NÃO troca a aluna do ato: com `?aluna=Aluna B`, o campo fica «Aluna B», o
 *      bilhete autoriza e a condução abre — na escola de teste e fora dela;
 *   2. aluna do ato SEM registo no fixture → nada é preenchido, e o ato continua a abrir;
 *   3. o depósito é POR ALUNA: o rascunho da A não é restaurado ao abrir a B;
 *   4. a chave é a MESMA nos dois lados — a porta (que grava) e a lista (que oferece «continuar»).
 *      Duas cópias que divergem dão um botão que leva a uma página que não encontra nada;
 *   5. na lista, sem depósito, o botão é «Fazer anamnese» e os de continuar/recomeçar estão
 *      escondidos; com depósito daquela aluna, é o contrário.
 *
 * COMO É MEDIDA. A ponte de produção de VERDADE (`motor/servidor/producao.js`), em processo, com
 * um KV em memória e o fixture de verdade. JSDOM para as duas páginas. Nada toca no ar.
 *
 *   node experimentos/provar-anamnese-por-aluna.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');

/* CONTROLE NEGATIVO — `--controle-negativo` extrai a árvore de um ref (`REF_NEGATIVO`, padrão
 * `HEAD`) e corre as MESMAS asserções. O ref é o estado ANTES desta correção: as duas primeiras
 * secções têm de reprovar lá, senão a prova não está a medir o defeito — está a medir o presente.
 * Vão as pastas que os `require` pedem: `motor/` (a ponte e o preenchedor do fixture),
 * `porta/` (a página), `tools/` (a barra e a cifra), `biblioteca/` (o catálogo) e `teste/`
 * (os fixtures, que o motor exige no topo do módulo). */
const negativo = process.argv.includes('--controle-negativo');
let ARVORE = RAIZ;
if (negativo) {
  const ref = process.env.REF_NEGATIVO || 'HEAD';
  ARVORE = fs.mkdtempSync(path.join(require('os').tmpdir(), 'motor-anamnese-'));
  require('child_process').execSync(
    'git archive ' + ref + ' motor porta tools biblioteca teste | tar -x -C ' + ARVORE,
    { cwd: RAIZ, stdio: 'pipe' });
  console.log('CONTROLE NEGATIVO — a árvore de ' + ref + ' (antes da correção)');
}
const PORTA_DIR = path.join(ARVORE, 'porta');
const producao = require(path.join(ARVORE, 'motor/servidor/producao.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const ALUNAS = ['Aluna A', 'Aluna B', 'Aluna C', 'Aluna D'];
const SENHA = 'segredo';

/* Um servidor por ESCOLA: o fixture é escolhido pelo nome, e é isso que se está a medir. */
function montar(escola) {
  const dados = new Map();
  const kv = {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix } = {}) {
      return { keys: [...dados.keys()].filter((k) => !prefix || k.startsWith(prefix))
        .map((name) => ({ name })), list_complete: true };
    },
  };
  const ASSETS = {
    async fetch(req) {
      const bruto = req && req.pathname ? req.pathname : String((req && req.url) || req);
      const rel = new URL(bruto, 'https://assets.local').pathname
        .replace(/^\/+/, '').replace(/^(anamnese|plano-ensino|plano-observacao)\//, '');
      const alvo = path.join(PORTA_DIR, rel);
      if (!alvo.startsWith(PORTA_DIR) || !fs.existsSync(alvo) || !fs.statSync(alvo).isFile()) {
        return new Response('ausente', { status: 404 });
      }
      return new Response(fs.readFileSync(alvo),
        { headers: { 'Content-Type': MIME[path.extname(alvo)] || 'application/octet-stream' } });
    },
  };
  const env = { ESCOLA_SLUG: escola, ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'Cafe No Bule',
    SENHA_PROFESSOR: SENHA, PADD_KV: kv, ASSETS };
  return { env, dados, kv };
}

async function semear(kv, escola) {
  await kv.put('bastidores/' + escola + '/alunas', JSON.stringify(ALUNAS));
  await kv.put('bastidores/' + escola + '/professores', JSON.stringify([
    { nome: 'Cafe No Bule', slug: 'cafe-no-bule' }]));
  await kv.put('bastidores/' + escola + '/curadorias', JSON.stringify([]));
  await kv.put('bastidores/' + escola + '/envelopes/anamnese-1.json', JSON.stringify({
    id: 'anamnese-1', tipo: 'anamnese', familia: 'anamnese', escola,
    professor: 'cafe-no-bule', aluna: 'Aluna A', ciclo: '01', estado: 'completa',
    gerado_em: '2026-10-26T12:00',
    contexto: { escola, professor: 'Cafe No Bule', aluna: 'Aluna A', ciclo: '01' },
    respostas: { idade: { valor: '12' } },
  }));
}

/** O endereço que o painel da lista monta, com o bilhete de verdade. */
async function enderecoDoAto(env, escola, aluna) {
  const HOST = 'https://' + escola + '.tmenegaz77.workers.dev';
  const r = await producao.fetch(new Request(HOST + '/api/bastidores/ato', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha: SENHA, professor: 'cafe-no-bule', fonte: 'anamnese',
      ciclo: '01', aluna }),
  }), env);
  const d = await r.json();
  return '/anamnese/?professor=cafe-no-bule&ciclo=01&aluna=' + encodeURIComponent(aluna)
    + '&abrir=1' + (d.ato ? '&ato=' + d.ato : '');
}

/** Um servidor de verdade, com o corpo dos POST encaminhado. */
function servir(env, escola) {
  const HOST = 'https://' + escola + '.tmenegaz77.workers.dev';
  const srv = http.createServer(async (req, res) => {
    const pedacos = [];
    for await (const p of req) pedacos.push(p);
    const corpo = Buffer.concat(pedacos);
    const r = await producao.fetch(new Request(HOST + req.url, {
      method: req.method, headers: { 'Content-Type': 'application/json' },
      body: corpo.length && req.method !== 'GET' ? corpo : undefined }), env);
    res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'text/html; charset=utf-8',
      'cache-control': 'no-store' });
    res.end(Buffer.from(await r.arrayBuffer()));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

async function abrirPagina({ base, caminho, preencher }) {
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => {
    if (!/Not implemented|Could not load (link|script)/.test(e.message)) problemas.push(e.message.slice(0, 160));
  });
  const dom = await JSDOM.fromURL(base + caminho, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), base + caminho), i);
      w.CSS = w.CSS || {};
      if (!w.CSS.escape) w.CSS.escape = (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
      w.confirm = () => true;
      w.alert = () => {};
      w.scrollTo = () => {};
      if (preencher) preencher(w);
    },
  });
  await new Promise((r) => setTimeout(r, 1600));
  return { w: dom.window, problemas };
}

const estadoDaPorta = (w) => JSON.parse(w.eval(`JSON.stringify({
  alunaNoCampo: (document.getElementById('ctx-aluna') || {}).value || '',
  atoAutorizado: typeof ATO_AUTORIZADO !== 'undefined' ? ATO_AUTORIZADO : null,
  conducaoAberta: typeof CONDUCAO_ABERTA !== 'undefined' ? CONDUCAO_ABERTA : null,
  chave: typeof chaveDaMemoria === 'function' ? chaveDaMemoria() : null,
  idade: typeof RESPOSTAS !== 'undefined' ? (RESPOSTAS.get('idade') || null) : null
})`));

(async () => {
  // ------------------------------------------------------------ 1) a escola de teste
  console.log('\n1. na escola de TESTE (nome «breu»), o preenchedor não troca a aluna do ato');
  {
    const { env, kv } = montar('breu');
    await semear(kv, 'breu');
    const url = await enderecoDoAto(env, 'breu', 'Aluna B');
    const { base, srv } = await servir(env, 'breu');
    const { w, problemas } = await abrirPagina({ base, caminho: url });
    try {
      const e = estadoDaPorta(w);
      provar('a escola «breu» é reconhecida como escola de teste', w.eval(
        'document.documentElement.getAttribute("data-escola-teste")') === '3');
      provar('…o campo da aluna fica com a aluna DO ATO, e não com a primeira do fixture',
        e.alunaNoCampo === 'Aluna B', e.alunaNoCampo);
      provar('…o bilhete autoriza o ato', e.atoAutorizado === true, e.atoAutorizado);
      provar('…e o formulário ABRE (a página não devolve à lista)', e.conducaoAberta === true,
        e.conducaoAberta);
      provar('…sem erro de JavaScript na página', problemas.length === 0, problemas.slice(0, 2));
    } finally { w.close(); srv.close(); }
  }

  // ------------------------------------------------------------ 2) sem registo no fixture
  console.log('\n2. aluna do ato SEM registo no fixture: não se preenche nada, e o ato abre');
  {
    const { env, kv } = montar('breu');
    await semear(kv, 'breu');
    const url = await enderecoDoAto(env, 'breu', 'Aluna D');   // o fixture tem A, B e C
    const { base, srv } = await servir(env, 'breu');
    const { w } = await abrirPagina({ base, caminho: url });
    try {
      const e = estadoDaPorta(w);
      provar('o campo continua com a Aluna D', e.alunaNoCampo === 'Aluna D', e.alunaNoCampo);
      provar('…o ato abre', e.conducaoAberta === true, e.conducaoAberta);
      provar('…e a idade do fixture NÃO entrou no formulário', e.idade === null, e.idade);
    } finally { w.close(); srv.close(); }
  }

  // ------------------------------------------------------------ 3) o depósito é por aluna
  console.log('\n3. o depósito é POR ALUNA: o rascunho de uma não entra no documento de outra');
  {
    const { env, kv } = montar('negra');    // escola neutra: sem preenchedor a atrapalhar
    await semear(kv, 'negra');
    const { base, srv } = await servir(env, 'negra');

    /* A CHAVE NÃO SE ADIVINHA — MEDE-SE. Abre-se o ato da Aluna A, lê-se a chave que a página
       usa, e grava-se o rascunho DEBAIXO DELA. Assim a prova vale nas duas versões do código:
       no código de antes as duas alunas partilham a chave (e o rascunho é restaurado na B); no
       código de agora cada uma tem a sua (e não é). */
    const urlA = await enderecoDoAto(env, 'negra', 'Aluna A');
    const { w: daA } = await abrirPagina({ base, caminho: urlA });
    const chaveDaA = estadoDaPorta(daA).chave;
    const rascunho = JSON.stringify({ total: 60, quando: '2026-10-26T10:00:00.000Z', indice: 3,
      respostas: [['contexto-aluna', 'Aluna A'], ['idade', '12']],
      notas: [], sugeridas: ['contexto-aluna'] });
    daA.close();

    const urlB = await enderecoDoAto(env, 'negra', 'Aluna B');
    const { w: daB } = await abrirPagina({ base, caminho: urlB, preencher(win) {
      try { win.localStorage.setItem(chaveDaA, rascunho); } catch (e) { /* sem depósito */ }
    } });
    try {
      const e = estadoDaPorta(daB);
      provar('a chave do ato da Aluna B é diferente da chave da Aluna A',
        e.chave !== chaveDaA, { daB: e.chave, daA: chaveDaA });
      provar('…e a idade da Aluna A NÃO foi restaurada no mapa da B', e.idade === null, e.idade);
      provar('…e o rascunho da A continua guardado, intocado',
        JSON.parse(daB.localStorage.getItem(chaveDaA) || '{}').respostas !== undefined);
    } finally { daB.close(); srv.close(); }
  }

  // ------------------------------------------------------------ 4) as duas chaves concordam
  console.log('\n4. a chave da LISTA é a mesma que a PORTA grava');
  {
    const { env, kv } = montar('negra');
    await semear(kv, 'negra');
    const url = await enderecoDoAto(env, 'negra', 'Aluna B');
    const { base, srv } = await servir(env, 'negra');
    // A chave que a porta grava, lida da própria porta.
    const { w: daPorta } = await abrirPagina({ base, caminho: url });
    const chaveDaPorta = estadoDaPorta(daPorta).chave;
    daPorta.close();

    /* A LISTA, de caixa-negra: o contexto escolhido é restaurado do `localStorage`
       (`ato-<escola>-<fonte>-1`), e o que se mede é se ela ENCONTRA o depósito que a porta
       gravou. Um depósito na chave certa e outro na chave antiga (sem a aluna) — um aparece,
       o outro não. É a diferença que prova que as duas cópias concordam. */
    const abrirLista = (chaveDoDeposito) => abrirPagina({
      base, caminho: '/area-do-professor/anamnese/', preencher(win) {
        try {
          win.localStorage.setItem('ato-negra-anamnese-1', JSON.stringify({
            professor: 'cafe-no-bule', ciclo: '01', aluna: 'Aluna B' }));
          win.localStorage.setItem(chaveDoDeposito, JSON.stringify({ total: 60,
            quando: '2026-10-26T10:00:00.000Z', indice: 1,
            respostas: [['idade', '12']], notas: [], sugeridas: [] }));
        } catch (e) { /* sem depósito */ }
      },
    });
    const lerBotoes = (w) => JSON.parse(w.eval(`(function(){
      var b = function(acao){
        var el = document.querySelector('[data-acao="' + acao + '"]');
        return el ? { escondido: !!el.hidden, desabilitado: !!el.disabled } : null;
      };
      return JSON.stringify({ nova: b('nova'), continuar: b('continuar'), recomecar: b('recomecar') });
    })()`));

    const comAChaveDaPorta = await abrirLista(chaveDaPorta);
    try {
      const b = lerBotoes(comAChaveDaPorta.w);
      provar('com o depósito na chave da porta, a lista oferece «Continuar de onde parei»',
        b.continuar && b.continuar.escondido === false && b.recomecar.escondido === false, b);
      provar('…e esconde o «Fazer anamnese» (há o que continuar)', b.nova && b.nova.escondido === true, b.nova);
    } finally { comAChaveDaPorta.w.close(); }

    const comAChaveAntiga = await abrirLista('porta-anamnese-negra-cafe-no-bule-01-1');
    try {
      const b = lerBotoes(comAChaveAntiga.w);
      provar('com o depósito na chave ANTIGA (sem a aluna), a lista NÃO o encontra',
        b.continuar && b.continuar.escondido === true, b);
      provar('…e o botão é «Fazer anamnese»', b.nova && b.nova.escondido === false, b.nova);
    } finally { comAChaveAntiga.w.close(); }
    srv.close();
  }

  if (negativo) {
    console.log('\n' + (falhas ? 'CONTROLE NEGATIVO OK — ' : 'CONTROLE NEGATIVO INÚTIL — ')
      + total + ' asserção(ões), ' + falhas + ' falha(s). '
      + (falhas ? 'As asserções reprovam no código de antes: a prova mede a correção.'
        : 'Todas passaram no código de ANTES — a prova não mede o defeito.'));
    process.exit(falhas ? 0 : 1);
  }
  console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ') + total + ' asserção(ões), '
    + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
