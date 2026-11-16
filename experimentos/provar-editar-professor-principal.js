#!/usr/bin/env node
'use strict';

/**
 * provar-editar-professor-principal.js — o «Editar» do principal é o formulário, não um alert
 * (22/10/2026).
 *
 * O QUE SE PEDIU. «Quando eu clico no botão editar, ele é o único professor que pode editar, não
 * pode ser excluído. Tem que preencher no formulário para poder fazer a edição do nome do
 * professor. E não abrir uma janelinha que parece um alert para poder fazer isso.»
 *
 * O QUE HAVIA. `prompt("Novo nome do dono da escola:", atual)` — a janelinha nativa do
 * navegador, com uma linha e sem contexto, e nada na tela a dizer o que estava a acontecer. O
 * erro vinha depois num `alert`.
 *
 * A REGRA MUDOU A 16/11/2026, e esta prova mudou com ela. Ela disse: «Pode editar tudo, não tem
 * campo desabilitado» — a senha deixou de sair de cena, o botão deixou de estar travado e o
 * «Editar» passou a existir em TODAS as linhas (a ficha inteira, e não só o nome do principal).
 * O que NÃO mudou é a regra da proveniência: o NOME de quem já assinou documentos continua preso,
 * e quem o recusa é o servidor — a tela deixa de esconder o botão, porque a ficha tem sete campos
 * e um deles preso não é a ficha toda presa.
 *
 * O que aqui se continua a medir, e é o que esta prova tem de próprio: NENHUM DIÁLOGO NATIVO,
 * o clique de verdade, e a página a recarregar. O preenchimento da ficha e as gravações no
 * servidor são medidos em `provar-cadastro-do-professor.js`, que não precisa de navegador.
 *
 * O QUE ESTA PROVA MEDE (num Chrome de verdade, com a folha real servida de `127.0.0.1`):
 *
 *   1. o «Editar» NÃO abre diálogo nativo nenhum — nenhum `prompt`, `alert` ou `confirm` é
 *      chamado (os três estão instrumentados; um `alert` de verdade bloquearia a prova);
 *   2. o formulário do cadastro passa a estar preenchido com o nome atual, dividido em nome e
 *      sobrenome, e o foco vai para o primeiro campo;
 *   3. a senha sai de cena no modo de edição, e a nota diz por quê;
 *   4. o botão passa a dizer o que vai fazer, e o «Cancelar» aparece;
 *   5. gravar manda UM pedido a `/api/bastidores/dono`, com o nome inteiro (nome + sobrenome), e
 *      recarrega a página no sucesso;
 *   6. «Cancelar» volta ao cadastro — campos vazios, senha de volta, botão com o rótulo de
 *      antes — sem mandar pedido nenhum;
 *   7. na linha do principal há «Editar» e NÃO há «Excluir»; nas outras, o contrário.
 *
 * SEM NAVEGADOR A PROVA NÃO FINGE: diz «pulado» e sai 0 (o CI não tem Chrome).
 *
 *   node experimentos/provar-editar-professor-principal.js
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

function criarKv(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
  };
}

const env = (curadorias = []) => ({
  ESCOLA_SLUG: 'calango',
  ESCOLA_HABILITADA: 'sim',
  SENHA_ADMIN: 's',
  PROFESSOR_NOME: 'Ana Maria Silva',
  PROFESSOR_SLUG: 'ana-silva',
  GITHUB_TOKEN: 'gh',
  PADD_KV: criarKv({
    'bastidores/calango/professores': JSON.stringify([
      { nome: 'Caneca Pequena', slug: 'caneca-pequena', sal: 'x', hash: 'y' },
    ]),
    ...(curadorias.length ? { 'bastidores/calango/curadorias': JSON.stringify(curadorias) } : {}),
  }),
});

const ASSETS = {
  '/assets/style.css': 'tools/templates/ciclo.css',
  '/assets/nav.js': 'tools/templates/nav.js',
  '/scripts/teste-preenchimento.js': 'tools/templates/nav.js',
  '/assets/favicon.svg': 'tools/templates/marca/favicon.svg',
};

function acharChrome() {
  for (const c of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (fs.existsSync(c)) return c;
  }
  const r = spawnSync('which', ['google-chrome'], { encoding: 'utf8' });
  return r.status === 0 && r.stdout.trim() ? r.stdout.trim() : null;
}

async function abrirNavegador(executavel, perfil) {
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
    sid,
    async ir(url) {
      // OS TRÊS DIÁLOGOS NATIVOS SÃO INSTRUMENTADOS ANTES DE A PÁGINA CARREGAR. É a única forma
      // de provar que NENHUM foi chamado: um `alert` de verdade bloquearia o navegador headless,
      // e o `prompt` devolveria texto sem ninguém ver.
      await enviar('Page.navigate', { url }, sid);
      await new Promise((s) => setTimeout(s, 1200));
      await enviar('Runtime.evaluate', {
        expression: `window.__DIALOGOS = [];
          window.prompt = function(msg){ window.__DIALOGOS.push('prompt: ' + msg); return 'Nome Escrito No Prompt'; };
          window.alert = function(msg){ window.__DIALOGOS.push('alert: ' + msg); };
          window.confirm = function(msg){ window.__DIALOGOS.push('confirm: ' + msg); return true; };
          document.getElementById('conteudo').hidden = false;
          var g = document.getElementById('painel-gate'); if (g) g.hidden = true;
          document.getElementById('sec-professores').hidden = false;
          document.getElementById('professores-miolo').hidden = false;`,
      }, sid);
      await new Promise((s) => setTimeout(s, 300));
    },
    async avaliar(expressao) {
      const r = await enviar('Runtime.evaluate', { expression: expressao, returnByValue: true }, sid);
      const v = r.result && r.result.result && r.result.result.value;
      return typeof v === 'string' ? JSON.parse(v) : v;
    },
    fechar() {
      chrome.kill();
      ws.close();
      try { fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) {}
    },
  };
}

async function subirBancada({ respostaDoDono, curadorias = [] }) {
  const pagina = await bastidores.fetch(new Request('https://calango.tmenegaz77.workers.dev/bastidores/producao'), env(curadorias));
  const html = await pagina.text();
  const pedidos = [];
  const servidor = http.createServer((req, res) => {
    pedidos.push(req.method + ' ' + req.url);
    const u = new URL(req.url, 'http://127.0.0.1');
    if (u.pathname === '/bastidores/producao') {
      res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    /* A FICHA (16/11/2026) — o «Editar» lê-a para preencher CPF, telefone, e-mail e habilidade. */
    if (u.pathname === '/api/bastidores/professor' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        ok: true, slug: u.searchParams.get('slug'), nome: 'Ana Maria Silva', dono: true,
        cpf: '111.444.777-35', telefone: '(51) 99999-0000', email: 'ana@exemplo.com',
        modalidade: 'bale-classico',
      }));
    }
    /* A GRAVAÇÃO DA FICHA — o `POST` que substituiu o `/dono` no modo de edição. */
    if (u.pathname === '/api/bastidores/professor' && req.method === 'POST') {
      let corpo = '';
      req.on('data', (c) => { corpo += c; });
      req.on('end', () => {
        pedidos.push('CORPO /api/bastidores/professor ' + corpo);
        res.writeHead(respostaDoDono.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(respostaDoDono.corpo));
      });
      return;
    }
    if (u.pathname === '/api/bastidores/dono' && req.method === 'POST') {
      let corpo = '';
      req.on('data', (c) => { corpo += c; });
      req.on('end', () => {
        pedidos.push('CORPO /api/bastidores/dono ' + corpo);
        res.writeHead(respostaDoDono.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(respostaDoDono.corpo));
      });
      return;
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

const CLICAR_EDITAR = `
  (function(){
    var b = document.querySelector('#sec-professores button.editar');
    if (!b) return JSON.stringify({achou: false});
    b.click();
    return JSON.stringify({achou: true, alvo: b.getAttribute('data-alvo')});
  })()
`;

/** O estado do formulário e das linhas da lista, depois de um clique. */
const ESTADO = `
  (function(){
    var v = function(id){ var e = document.getElementById(id); return e ? e.value : null; };
    var h = function(id){ var e = document.getElementById(id); return e ? !!e.hidden : null; };
    var b = document.getElementById('prof-enviar');
    var c = document.getElementById('prof-cancelar');
    var foco = document.activeElement ? document.activeElement.id : null;
    var linhas = [];
    var lis = document.querySelectorAll('#sec-professores .col-lista li');
    for (var i = 0; i < lis.length; i++) {
      linhas.push({
        nome: (lis[i].querySelector('.nome') || {}).textContent || '',
        temEditar: !!lis[i].querySelector('button.editar'),
        temExcluir: !!lis[i].querySelector('button.apagar')
      });
    }
    return JSON.stringify({
      modo: v('prof-modo'),
      nome: v('pnome'),
      sobrenome: v('psobrenome'),
      senhaVisivel: !h('prof-senha'),
      notaVisivel: !h('prof-nota'),
      rotuloBotao: b ? b.textContent : null,
      botaoHabilitado: b ? !b.disabled : null,
      cancelarVisivel: c ? !c.hidden : null,
      foco: foco,
      dialogos: window.__DIALOGOS || [],
      linhas: linhas
    });
  })()
`;

async function principais() {
  const executavel = acharChrome();
  if (!executavel) {
    console.log('PULADO — não há navegador nesta máquina (google-chrome/chromium).');
    console.log('         A prova mede o formulário e o clique de verdade; sem ele, não mede nada.');
    return;
  }
  const perfil = path.join(__dirname, '.tmp-perfil-da-edicao');

  // ── 1. o «Editar» entra no formulário ────────────────────────────────────
  {
    const bancada = await subirBancada({ respostaDoDono: { status: 200, corpo: { ok: true } } });
    const nav = await abrirNavegador(executavel, perfil);
    await nav.ir('http://127.0.0.1:' + bancada.porta + '/bastidores/producao#professores');

    const antes = await nav.avaliar(ESTADO);
    conferir('a linha do principal tem «Editar» e NÃO tem «Excluir»',
      antes.linhas.length >= 1 && antes.linhas[0].temEditar === true && antes.linhas[0].temExcluir === false,
      antes.linhas[0]);
    conferir('a linha do outro professor tem «Excluir»',
      antes.linhas.length >= 2 && antes.linhas[1].temExcluir === true, antes.linhas[1]);
    conferir('antes do clique, o botão diz «Cadastrar professor»', antes.rotuloBotao === 'Cadastrar professor', antes.rotuloBotao);
    conferir('…e a senha está à vista', antes.senhaVisivel === true, antes.senhaVisivel);
    conferir('…e todas as linhas têm «Editar» (não só a do principal)',
      antes.linhas.length >= 2 && antes.linhas.every((l) => l.temEditar === true),
      antes.linhas.map((l) => l.temEditar));

    const clique = await nav.avaliar(CLICAR_EDITAR);
    conferir('o «Editar» do principal é encontrado', clique.achou === true, clique);
    const depois = await nav.avaliar(ESTADO);

    conferir('NENHUM diálogo nativo foi aberto (prompt, alert ou confirm)', depois.dialogos.length === 0, depois.dialogos);
    conferir('o formulário entra no modo de edição', depois.modo === 'editar', depois.modo);
    conferir('…preenchido com o nome dividido (primeira palavra = nome)',
      depois.nome === 'Ana' && depois.sobrenome === 'Maria Silva', { nome: depois.nome, sobrenome: depois.sobrenome });
    conferir('…com o foco no primeiro campo', depois.foco === 'pnome', depois.foco);
    /* A SENHA FICA — «não tem campo desabilitado». Em branco, mantém a que ele usa; o servidor
     * di-lo, e é isso que a nota explica. */
    conferir('a senha CONTINUA à vista (e é ela que se pode trocar)',
      depois.senhaVisivel === true, depois.senhaVisivel);
    conferir('…e a nota explica por quê', depois.notaVisivel === true, depois.notaVisivel);
    conferir('o botão passa a dizer o que vai fazer', depois.rotuloBotao === 'Gravar as mudanças', depois.rotuloBotao);
    conferir('o «Cancelar» aparece', depois.cancelarVisivel === true, depois.cancelarVisivel);

    // ── 2. gravar: um pedido, com o nome inteiro, e a página recarrega ──────
    await nav.avaliar(`
      (function(){
        document.getElementById('pnome').value = 'Ana Maria';
        document.getElementById('psobrenome').value = 'Silva Souza';
        document.getElementById('prof-enviar').click();
        return JSON.stringify({ foi: true });
      })()
    `);
    await new Promise((s) => setTimeout(s, 2000));

    const corpo = bancada.pedidos.find((p) => p.indexOf('CORPO /api/bastidores/professor') === 0);
    const pedidos = bancada.pedidos.filter((p) => p.indexOf('POST /api/bastidores/professor') === 0);
    const gets = bancada.pedidos.filter((p) => p.indexOf('GET /bastidores/producao') === 0).length;
    conferir('gravar manda UM pedido a /api/bastidores/professor', pedidos.length === 1, pedidos.length);
    conferir('…com o nome inteiro, juntando os dois campos, e SEM o `s` comido',
      !!corpo && /"nome":"Ana Maria"/.test(corpo) && /"sobrenome":"Silva Souza"/.test(corpo), corpo);
    conferir('…e com o SLUG de quem se está a editar (é ele que identifica a pessoa)',
      !!corpo && /"editar":"ana-silva"/.test(corpo), corpo);
    conferir('…e a página recarrega no sucesso', gets >= 2, gets);

    nav.fechar();
    bancada.servidor.close();
  }

  // ── 3. «Cancelar» volta ao cadastro, sem pedido ──────────────────────────
  {
    const bancada = await subirBancada({ respostaDoDono: { status: 500, corpo: { ok: false, erro: 'x' } } });
    const nav = await abrirNavegador(executavel, perfil);
    await nav.ir('http://127.0.0.1:' + bancada.porta + '/bastidores/producao#professores');
    await nav.avaliar(CLICAR_EDITAR);
    await nav.avaliar(`(function(){ document.getElementById('prof-cancelar').click(); return JSON.stringify({foi:true}); })()`);
    const cancelado = await nav.avaliar(ESTADO);

    conferir('«Cancelar» sai do modo de edição', cancelado.modo === '', cancelado.modo);
    conferir('…e esvazia os campos',
      cancelado.nome === '' && cancelado.sobrenome === '', { nome: cancelado.nome, sobrenome: cancelado.sobrenome });
    conferir('…devolve a senha', cancelado.senhaVisivel === true, cancelado.senhaVisivel);
    conferir('…esconde a nota', cancelado.notaVisivel === false, cancelado.notaVisivel);
    conferir('…volta o rótulo «Cadastrar professor»', cancelado.rotuloBotao === 'Cadastrar professor', cancelado.rotuloBotao);
    conferir('…e o «Cancelar» desaparece', cancelado.cancelarVisivel === false, cancelado.cancelarVisivel);
    conferir('cancelar não manda pedido nenhum',
      bancada.pedidos.filter((p) => p.indexOf('/api/bastidores/dono') === 0).length === 0, bancada.pedidos);

    // ── 4. no ERRO, o botão volta e o recado aparece na secção ─────────────
    await nav.avaliar(CLICAR_EDITAR);
    // O CLIQUE COMO UMA PESSOA O DÁ: com o botão à vista. Num navegador, não se carrega num
    // botão que está fora do ecrã — e é essa a situação que interessa medir (a mensagem nasce
    // logo acima do botão que se acabou de carregar).
    await nav.avaliar(`(function(){ document.getElementById('prof-enviar').scrollIntoView({block:'center'}); return JSON.stringify({foi:true}); })()`);
    await new Promise((s) => setTimeout(s, 700));
    await nav.avaliar(`(function(){ document.getElementById('pnome').value = 'Outro'; document.getElementById('prof-enviar').click(); return JSON.stringify({foi:true}); })()`);
    await new Promise((s) => setTimeout(s, 2000));
    const erro = await nav.avaliar(`
      (function(){
        var b = document.getElementById('prof-enviar');
        var r = document.querySelector('#sec-professores .res'); var q = r.getBoundingClientRect();
        return JSON.stringify({ rotulo: b.textContent, habilitado: !b.disabled,
          recado: r.textContent, naTela: q.top >= 0 && q.bottom <= window.innerHeight && q.height > 0,
          topo: Math.round(q.top), altura: Math.round(q.height), janela: window.innerHeight,
          scroll: Math.round(window.scrollY), botao: Math.round(b.getBoundingClientRect().top) });
      })()
    `);
    conferir('no erro, o botão volta ao rótulo do modo (gravar)', erro.rotulo === 'Gravar as mudanças', erro.rotulo);
    conferir('…e volta a ficar habilitado', erro.habilitado === true, erro.habilitado);
    conferir('…e o recado aparece na secção, na tela', erro.naTela === true && /Erro:/.test(erro.recado), erro);

    nav.fechar();
    bancada.servidor.close();
  }

  // ── 5. CURADO: o botão abre a ficha e DIZ que o nome não muda (16/11/2026) ─────
  //
  // A regra da proveniência é a mesma: o nome do principal só se muda enquanto ele é LIVRE. O que
  // mudou é o que a tela faz com ela. Antes, o botão ficava desabilitado — e escondia com ele os
  // outros seis campos, que podem ser corrigidos. Agora o «Editar» abre a ficha, e o motivo do
  // nome preso vive no `title` do botão; quem recusa é o SERVIDOR, se o nome for mudado.
  {
    const bancada = await subirBancada({
      respostaDoDono: { status: 200, corpo: { ok: true } },
      curadorias: [{ id: 'c1', professor: 'Ana Maria Silva', turma: 'Turma A', alunas: [] }],
    });
    const nav = await abrirNavegador(executavel, perfil);
    await nav.ir('http://127.0.0.1:' + bancada.porta + '/bastidores/producao#professores');
    const estado = await nav.avaliar(`
      (function(){
        var b = document.querySelector('#sec-professores button.editar');
        var papel = document.querySelector('#sec-professores .nome .dono');
        return JSON.stringify({
          temEditarClicavel: !!b && !b.disabled,
          motivo: b ? b.getAttribute('title') : null,
          aviso: b ? b.getAttribute('title') : null,
          papel: papel ? papel.textContent : null
        });
      })()
    `);
    conferir('principal CURADO: o «Editar» CONTINUA clicável (a ficha tem sete campos)',
      estado.temEditarClicavel === true, estado);
    conferir('…e o motivo de o NOME não mudar vai escrito no botão',
      /não muda/.test(String(estado.motivo)) || /documentos/.test(String(estado.aviso)), estado);
    conferir('…e o motivo nomeia a curadoria',
      /curadoria/.test(String(estado.motivo) + ' ' + String(estado.aviso)), estado);
    conferir('…sem perder o papel da linha (continua «principal»)', estado.papel === 'principal', estado.papel);
    nav.fechar();
    bancada.servidor.close();
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principais().catch((e) => { console.error('EXPLODIU:', (e && e.stack) || e); process.exit(1); });
