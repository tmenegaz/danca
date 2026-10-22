#!/usr/bin/env node
'use strict';

/**
 * provar-cadastro-visivel.js — o botão «Cadastrar professor» diz o que está a acontecer
 * (22/10/2026).
 *
 * O QUE SE OUVIU. «O botão de cadastrar professor não dispara o carregamento da lista onde ficam
 * professores cadastrados. Aí eu tenho que recarregar a página para funcionar.» E: «nada
 * acontece — o botão parece morto».
 *
 * O QUE SE MEDIU, num Chrome de verdade, com a folha de estilo real e a secção dos professores à
 * vista (não se deduziu: mediu-se a geometria):
 *
 *   · o `fetch` SAI e o `location.reload()` É chamado no sucesso — o caminho nunca esteve morto;
 *   · o recado («cadastrando…» e «Erro: …») nascia no `#res` do TOPO do conteúdo, e com a página
 *     rolada até ao formulário ele estava a `top: -19` numa janela de 493 px: FORA DO ECRÃ;
 *   · no erro não há recarregamento — logo a única resposta visível era… nenhuma;
 *   · e o pedido demora 5 a 15 s (escreve no repositório), tempo em que nada mudava na tela.
 *
 * O que esta prova passa a exigir, e mede a cada execução:
 *
 *   1. enquanto o pedido corre, o BOTÃO muda (desabilitado, «cadastrando…») — está debaixo do dedo;
 *   2. no erro, o botão volta ao rótulo de antes e a mensagem aparece DENTRO da secção da ação;
 *   3. …e essa mensagem está NA TELA (topo ≥ 0 e fundo ≤ altura da janela);
 *   4. o `#res` do topo continua a existir para o que não tem secção;
 *   5. no sucesso, a página recarrega (o servidor vê o segundo GET).
 *
 * SEM NAVEGADOR A PROVA NÃO FINGE: ela diz «pulado» e sai 0. O `google-chrome` é o da máquina, e
 * o CI não o tem — uma prova que mente sobre o que não mediu é pior do que uma prova ausente.
 *
 *   node experimentos/provar-cadastro-visivel.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const bastidores = require('../motor/servidor/bastidores.js');

const RAIZ = path.join(__dirname, '..');

let falhas = 0;
let n = 0;
const conferir = (nome, ok, detalhe) => {
  n += 1;
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok ? '' : '  -> ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

function criarKv() {
  const dados = new Map();
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = '') {
      return { keys: [...dados.keys()].filter((x) => x.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
  };
}

const env = () => ({
  ESCOLA_SLUG: 'calango',
  ESCOLA_HABILITADA: 'sim',
  SENHA_ADMIN: 's',
  PROFESSOR_NOME: 'Oculos Redondo',
  PROFESSOR_SLUG: 'oculos-redondo',
  GITHUB_TOKEN: 'gh',
  PADD_KV: criarKv(),
});

const ASSETS = {
  '/assets/style.css': 'tools/templates/ciclo.css',
  '/assets/nav.js': 'tools/templates/nav.js',
  '/assets/teste-preenchimento.js': 'tools/templates/nav.js',
  '/assets/favicon.svg': 'tools/templates/marca/favicon.svg',
};

/** O Chrome da máquina, se houver. `null` quando não há — e então a prova é pulada. */
function acharChrome() {
  for (const caminho of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (fs.existsSync(caminho)) return caminho;
  }
  const r = spawnSync('which', ['google-chrome'], { encoding: 'utf8' });
  return r.status === 0 && r.stdout.trim() ? r.stdout.trim() : null;
}

/** Um CDP mínimo sobre o WebSocket global do Node 22 — sem dependência nenhuma. */
async function abrirNavegador(executavel) {
  const perfil = path.join(__dirname, '.tmp-perfil-da-prova');
  fs.rmSync(perfil, { recursive: true, force: true });
  const chrome = spawn(executavel, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--remote-debugging-port=0', '--user-data-dir=' + perfil, 'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error('o DevTools não abriu: ' + buf.slice(0, 300))), 20000);
    chrome.stderr.on('data', (d) => {
      buf += d.toString();
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf);
      if (m) { clearTimeout(t); resolve(m[1]); }
    });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((s) => ws.addEventListener('open', s));
  let id = 0;
  const pendentes = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pendentes.has(msg.id)) { pendentes.get(msg.id)(msg); pendentes.delete(msg.id); }
  });
  const enviar = (method, params = {}, sessionId) => new Promise((s) => {
    const meu = ++id;
    pendentes.set(meu, s);
    ws.send(JSON.stringify({ id: meu, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

  const alvo = await enviar('Target.createTarget', { url: 'about:blank' });
  const anexo = await enviar('Target.attachToTarget', { targetId: alvo.result.targetId, flatten: true });
  const sid = anexo.result.sessionId;
  await enviar('Runtime.enable', {}, sid);
  await enviar('Page.enable', {}, sid);

  return {
    sid, enviar,
    async ir(url) {
      await enviar('Page.navigate', { url }, sid);
      await new Promise((s) => setTimeout(s, 1200));
      // O PORTÃO DA SENHA. A página nasce com `#conteudo` oculto e é o login que o pinta; aqui
      // ele é aberto à mão para a geometria ser a real — a folha está carregada, e é dela que
      // sai a posição medida.
      await enviar('Runtime.evaluate', {
        expression: `document.getElementById('conteudo').hidden = false;
          var g = document.getElementById('painel-gate'); if (g) g.hidden = true;
          document.getElementById('sec-professores').hidden = false;
          document.getElementById('form-prof').scrollIntoView({block:'center'});`,
      }, sid);
      await new Promise((s) => setTimeout(s, 600));
    },
    async avaliar(expressao) {
      const r = await enviar('Runtime.evaluate', { expression: expressao, returnByValue: true }, sid);
      const v = r.result && r.result.result && r.result.result.value;
      return typeof v === 'string' ? JSON.parse(v) : v;
    },
    fechar() {
      chrome.kill();
      ws.close();
      // O Chrome ainda está a escrever no perfil quando o `kill` chega: apagar de imediato
      // rebenta com `ENOTEMPTY`. Limpar é higiene, não é a prova — e não pode derrubá-la.
      try { fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) {}
    },
  };
}

/** Sobe a página servida de 127.0.0.1, com o `/api/*` respondido pelo teste. */
async function subirBancada({ respostaDoPost, atraso }) {
  const pagina = await bastidores.fetch(new Request('https://calango.tmenegaz77.workers.dev/bastidores/producao'), env());
  const html = await pagina.text();
  const pedidos = [];
  const servidor = http.createServer((req, res) => {
    pedidos.push(req.method + ' ' + req.url);
    const u = new URL(req.url, 'http://127.0.0.1');
    if (u.pathname === '/bastidores/producao') {
      res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (u.pathname === '/api/bastidores/professor' && req.method === 'POST') {
      return setTimeout(() => {
        res.writeHead(respostaDoPost.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(respostaDoPost.corpo));
      }, atraso);
    }
    if (u.pathname === '/api/bastidores/professores' || u.pathname === '/api/bastidores/aparencia') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, escola: 'calango', professores: [], modo: 'clara', paleta: 'bordo' }));
    }
    const arquivo = path.join(RAIZ, ASSETS[u.pathname] || u.pathname.replace(/^\//, ''));
    if (fs.existsSync(arquivo) && fs.statSync(arquivo).isFile()) {
      res.writeHead(200, { 'Content-Type': path.extname(arquivo) === '.css' ? 'text/css' : 'text/javascript' });
      return res.end(fs.readFileSync(arquivo));
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('nao');
  });
  await new Promise((s) => servidor.listen(0, '127.0.0.1', s));
  return { servidor, pedidos, porta: servidor.address().port };
}

const CLICAR = `
  (function(){
    document.getElementById('pnome').value = 'Caneca';
    document.getElementById('psobrenome').value = 'Pequena';
    document.getElementById('psenha').value = 'p';
    document.querySelector('#form-prof button[type=submit]').click();
    return JSON.stringify({ clicou: true });
  })()
`;

const ESTADO_DO_BOTAO = `
  (function(){
    var b = document.querySelector('#form-prof button[type=submit]');
    return JSON.stringify({ rotulo: b.textContent, desabilitado: b.disabled });
  })()
`;

const ESTADO_DO_RECADO = `
  (function(){
    var sec = document.getElementById('sec-professores');
    var r = sec.querySelector('.res');
    var q = r.getBoundingClientRect();
    return JSON.stringify({
      existe: !!r,
      classe: r.className,
      texto: r.textContent,
      naTela: q.top >= 0 && q.bottom <= window.innerHeight && q.height > 0,
      topo: Math.round(q.top),
      altura: Math.round(q.height),
      janela: window.innerHeight,
      temNoTopo: !!document.getElementById('res')
    });
  })()
`;

async function principais() {
  const executavel = acharChrome();
  if (!executavel) {
    console.log('PULADO — não há navegador nesta máquina (google-chrome/chromium).');
    console.log('         A prova mede geometria de verdade; sem ele, não mede nada.');
    return;
  }

  // ── O ERRO: o botão avisa, e a mensagem aparece onde a ação foi pedida ────
  {
    const bancada = await subirBancada({
      respostaDoPost: { status: 502, corpo: { ok: false, erro: 'a estrutura dele não pôde ser criada no repositório' } },
      atraso: 1500,
    });
    const nav = await abrirNavegador(executavel);
    await nav.ir('http://127.0.0.1:' + bancada.porta + '/bastidores/producao#professores');
    await nav.avaliar(CLICAR);

    await new Promise((s) => setTimeout(s, 500));
    const durante = await nav.avaliar(ESTADO_DO_BOTAO);
    conferir('durante o pedido, o botão diz «cadastrando...»', /cadastrando/.test(durante.rotulo), durante);
    conferir('…e fica desabilitado (um segundo clique não dispara outro cadastro)', durante.desabilitado === true, durante);

    await new Promise((s) => setTimeout(s, 2000));
    const depois = await nav.avaliar(ESTADO_DO_BOTAO);
    const recado = await nav.avaliar(ESTADO_DO_RECADO);
    const gets = bancada.pedidos.filter((p) => p.indexOf('GET /bastidores/producao') === 0).length;

    conferir('no erro, o botão volta ao rótulo de antes', depois.rotulo === 'Cadastrar professor', depois);
    conferir('…e volta a ficar habilitado', depois.desabilitado === false, depois);
    conferir('o recado existe DENTRO da secção dos professores', recado.existe === true, recado);
    conferir('…com o estado de erro', recado.classe === 'res erro', recado.classe);
    conferir('…e diz o motivo', /não pôde ser criada/.test(recado.texto), recado.texto);
    conferir('…e está NA TELA', recado.naTela === true, recado);
    conferir('o `#res` do topo continua a existir para o que não tem secção', recado.temNoTopo === true, recado);
    conferir('sem sucesso, a página NÃO recarrega', gets === 1, gets);

    nav.fechar();
    bancada.servidor.close();
  }

  // ── O SUCESSO: a página recarrega ────────────────────────────────────────
  {
    const bancada = await subirBancada({
      respostaDoPost: { status: 201, corpo: { ok: true, professor: 'Caneca Pequena', slug: 'caneca-pequena' } },
      atraso: 300,
    });
    const nav = await abrirNavegador(executavel);
    await nav.ir('http://127.0.0.1:' + bancada.porta + '/bastidores/producao#professores');
    await nav.avaliar(CLICAR);
    await new Promise((s) => setTimeout(s, 2000));

    const gets = bancada.pedidos.filter((p) => p.indexOf('GET /bastidores/producao') === 0).length;
    const posts = bancada.pedidos.filter((p) => p.indexOf('POST /api/bastidores/professor') === 0).length;
    conferir('o clique manda UM pedido de cadastro', posts === 1, posts);
    conferir('no sucesso a página recarrega (o servidor vê o segundo GET)', gets >= 2, gets);

    nav.fechar();
    bancada.servidor.close();
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principais().catch((e) => { console.error('EXPLODIU:', (e && e.stack) || e); process.exit(1); });
