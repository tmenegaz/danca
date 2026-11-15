'use strict';

/*
 * provar-recorte-do-po.js — o PO de um professor só vê o que a curadoria dele autoriza
 * (22/10/2026).
 *
 * O QUE SE VIU. Na escola `batata`, o PO de um professor oferecia o PLANO DE ENSINO de
 * outro, e a lista de sujeitos misturava a aluna do plano alheio. Eram dois vazamentos com
 * a mesma causa: a estante (`api/planos`) era a da ESCOLA, e o recorte dos sujeitos era
 * feito só pela TURMA — sem o professor. Como dois professores podem ter turmas com o
 * mesmo nome, a turma não distingue nada; quem distingue é o par (professor, turma) da
 * curadoria.
 *
 * O QUE ESTA PROVA TRAVA.
 *
 *   1. `/api/planos?professor=<slug>` devolve só os planos daquele professor;
 *   2. `/api/anamneses?plano=<carimbo>&professor=<slug>` devolve só as alunas da curadoria
 *      (professor, turma do plano) — mesmo quando os dois professores têm a MESMA turma;
 *   3. a tela do PO pede `/api/planos` com o professor da barra, e pede `/api/anamneses`
 *      com o plano e o professor;
 *   4. cada opção de plano mostra a TURMA e o atalho para o cadastro dela na Produção;
 *   5. trocar o professor limpa o plano/sujeitos do anterior e busca a estante do novo.
 *
 * COMO MEDE. Sobe o SERVIDOR de verdade (`motor/servidor/rotas.js`) sobre a memória do
 * núcleo, com as curadorias injetadas, e abre a PORTA em `jsdom`. O único stub é o
 * cadastro da Produção (`/api/bastidores/*`), que vive noutro Worker.
 *
 *   node experimentos/provar-recorte-do-po.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const { criarRotas } = require('../motor/servidor/rotas.js');
const { criarMemoria } = require('../motor/nucleo/armazenamento.js');
const porta = require('../motor/nucleo/porta.js');

const RAIZ = path.join(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(PORTA, p), 'utf8'));

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

// ------------------------------------------------------------------ a bancada

const PLANO_A = 'plano-20261022-1000';
const PLANO_B = 'plano-20261022-1100';
const ANAMNESE_A = 'anamnese-20261022-1000';
const ANAMNESE_B = 'anamnese-20261022-1100';
const TURMA = 'Turma 1';

const resposta = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });

const CURADORIAS = [
  { professor: 'prof-a', turma: TURMA, alunas: ['Aluna A'] },
  { professor: 'prof-b', turma: TURMA, alunas: ['Aluna B'] },
];

async function semear(memoria) {
  const envelope = (id, contexto, respostas) => JSON.stringify({ id, contexto, respostas });
  await memoria.guardar('envelope/' + PLANO_A + '.json', envelope(PLANO_A,
    { escola: 'x', professor: 'prof-a', ciclo: '01', turma: TURMA },
    {
      'contexto-professor': resposta('Prof A'),
      'contexto-turma': resposta(TURMA),
      'objetivo-geral': resposta('Objetivo A'),
    }));
  await memoria.guardar('envelope/' + PLANO_B + '.json', envelope(PLANO_B,
    { escola: 'x', professor: 'prof-b', ciclo: '01', turma: TURMA },
    {
      'contexto-professor': resposta('Prof B'),
      'contexto-turma': resposta(TURMA),
      'objetivo-geral': resposta('Objetivo B'),
    }));
  await memoria.guardar('envelope/' + ANAMNESE_A + '.json', envelope(ANAMNESE_A,
    { escola: 'x', professor: 'prof-a', ciclo: '01', aluna: 'Aluna A' }, {}));
  await memoria.guardar('envelope/' + ANAMNESE_B + '.json', envelope(ANAMNESE_B,
    { escola: 'x', professor: 'prof-b', ciclo: '01', aluna: 'Aluna B' }, {}));
  // O índice é o que as listas leem: nomes e resumos, sem abrir envelope.
  const nomes = (await memoria.listar('envelope/')).map((c) => c.slice('envelope/'.length));
  await memoria.guardar('envelope/.indice.json', JSON.stringify({ nomes }));
}

const CADASTRO = {
  '/api/bastidores/professores': () => ({
    ok: true, escola: 'x',
    professores: [{ nome: 'Prof A', slug: 'prof-a' }, { nome: 'Prof B', slug: 'prof-b' }],
  }),
  '/api/bastidores/alunas': () => ({ ok: true, alunas: ['Aluna A', 'Aluna B'] }),
  '/api/bastidores/turmas': () => ({
    ok: true,
    turmas: [{ id: 'turma-1', nome: TURMA, ativo: true }],
    opcoes: [{ valor: TURMA, rotulo: TURMA }],
  }),
  '/api/bastidores/turma-conteudos': () => ({ ok: true, relacoes: {} }),
  '/api/bastidores/termos': () => ({ ok: true, termos: [], opcoes: [] }),
  '/api/bastidores/validar-senha': () => ({ ok: true }),
};

function pedidosDe(registro, alvo) {
  return registro.filter((u) => new URL(u, 'http://x').pathname === alvo);
}

function comParametro(urls, nome) {
  return urls.map((u) => new URL(u, 'http://x').searchParams.get(nome)).filter(Boolean);
}

async function subir(memoria) {
  const rotas = criarRotas({
    armazenamento: memoria,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    escolaDoWorker: 'x',
    lerCuradorias: async () => CURADORIAS,
  });

  const registro = [];
  const servidor = http.createServer(async (pedido, respostaHttp) => {
    const url = new URL(pedido.url, 'http://x');
    if (url.pathname.indexOf('/api/') !== -1) registro.push(url.pathname + url.search);

    const cadastro = CADASTRO[url.pathname];
    if (cadastro) {
      if (url.pathname === '/api/bastidores/curadoria-professor') {
        const slug = url.searchParams.get('professor') || '';
        const curadorias = CURADORIAS.filter((c) => c.professor === slug);
        respostaHttp.writeHead(200, { 'Content-Type': 'application/json' });
        return respostaHttp.end(JSON.stringify({ ok: true, escola: 'x', professor: slug, curadorias }));
      }
      respostaHttp.writeHead(200, { 'Content-Type': 'application/json' });
      return respostaHttp.end(JSON.stringify(cadastro()));
    }
    if (url.pathname === '/api/bastidores/curadoria-professor') {
      const slug = url.searchParams.get('professor') || '';
      const curadorias = CURADORIAS.filter((c) => c.professor === slug);
      respostaHttp.writeHead(200, { 'Content-Type': 'application/json' });
      return respostaHttp.end(JSON.stringify({ ok: true, escola: 'x', professor: slug, curadorias }));
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      respostaHttp.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return respostaHttp.end(fs.readFileSync(path.join(PORTA, 'index.html')));
    }
    // O `markdown.js` da porta pede-se em `/plano-observacao/assets/…` (o caminho absoluto
    // do ficheiro, que é o único que o ASSETS serve nos três endereços da porta) — e por isso
    // a bancada lê o caminho sem esse prefixo, como o Worker faz.
    if (url.pathname.replace(/^\/plano-observacao/, '').indexOf('/assets/') === 0) {
      const mapa = {
        '/assets/markdown.js': path.join(PORTA, 'assets/markdown.js'),
        '/assets/nav.js': path.join(RAIZ, 'tools/templates/nav.js'),
        '/assets/style.css': path.join(RAIZ, 'tools/templates/ciclo.css'),
        '/assets/favicon.svg': path.join(RAIZ, 'tools/templates/marca/favicon.svg'),
        '/assets/lib-cifra.js': path.join(RAIZ, 'tools/lib-cifra.js'),
      };
      const arquivo = mapa[url.pathname.replace(/^\/plano-observacao/, '')];
      if (arquivo && fs.existsSync(arquivo)) {
        const tipo = arquivo.endsWith('.css') ? 'text/css'
          : arquivo.endsWith('.svg') ? 'image/svg+xml' : 'text/javascript';
        respostaHttp.writeHead(200, { 'Content-Type': tipo });
        return respostaHttp.end(fs.readFileSync(arquivo));
      }
      respostaHttp.writeHead(404);
      return respostaHttp.end('');
    }

    const r = await rotas.responder(new Request(url.href, {
      method: pedido.method,
      headers: pedido.headers,
    }));
    respostaHttp.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json' });
    return respostaHttp.end(await r.text());
  });

  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  return {
    base: 'http://127.0.0.1:' + servidor.address().port,
    registro,
    fechar: () => servidor.close(),
  };
}

// -------------------------------------------------------------------- a tela

function esperar(condicao, limite) {
  const fim = Date.now() + (limite || 5000);
  return new Promise((ok, falhar) => {
    const passo = () => {
      let pronto = false;
      try { pronto = condicao(); } catch { pronto = false; }
      if (pronto) return ok();
      if (Date.now() > fim) return falhar(new Error('tempo esgotado'));
      setTimeout(passo, 40);
    };
    passo();
  });
}

async function abrir(base) {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const virtual = new VirtualConsole();
  const erros = [];
  virtual.on('jsdomError', (e) => {
    if (/Not implemented/.test(e.message)) return;
    if (/Could not load (link|script): "[^"]*\/assets\//.test(e.message)) return;
    erros.push(e.message);
  });
  const dom = await JSDOM.fromURL(
    base + '/?fonte=po&escola=x&professor=prof-a&ciclo=01',
    {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      virtualConsole: virtual,
      beforeParse(janela) {
        janela.fetch = (u, o) => fetch(new URL(u, janela.location.href).href, o);
        janela.CSS = { escape: (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c) };
        // O jsdom não implementa `matchMedia`; o navegador implementa. É do AMBIENTE.
        janela.matchMedia = () => ({
          matches: false,
          media: '',
          addEventListener() {},
          removeEventListener() {},
          addListener() {},
          removeListener() {},
        });
      },
    });
  await esperar(() => dom.window.document.querySelectorAll('#roteiro li[data-i]').length > 0, 8000);
  return { dom, erros };
}

const texto = (el) => String((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

// -------------------------------------------------------------------- a prova

async function principais() {
  console.log('O RECORTE DO PO — plano e sujeitos são da curadoria do professor\n');

  const memoria = criarMemoria();
  await semear(memoria);
  const servidor = await subir(memoria);

  try {
    // ── 1. o servidor: a estante é do professor ─────────────────────────────
    {
      const pedir = async (caminho) => {
        const r = await fetch(servidor.base + caminho);
        return r.json();
      };
      const a = await pedir('/api/planos?professor=prof-a');
      const b = await pedir('/api/planos?professor=prof-b');
      checar('a estante de A traz só o plano de A',
        a.opcoes.map((o) => o.valor).join(',') === PLANO_A, a.opcoes.map((o) => o.valor));
      checar('a estante de B traz só o plano de B',
        b.opcoes.map((o) => o.valor).join(',') === PLANO_B, b.opcoes.map((o) => o.valor));
    }

    // ── 2. o servidor: os sujeitos são (professor, turma) da curadoria ─────
    {
      const pedir = async (caminho) => {
        const r = await fetch(servidor.base + caminho);
        return r.json();
      };
      const a = await pedir('/api/anamneses?plano=' + PLANO_A + '&professor=prof-a');
      const b = await pedir('/api/anamneses?plano=' + PLANO_B + '&professor=prof-b');
      checar('a turma é a mesma nos dois planos', a.turma === TURMA && b.turma === TURMA, [a.turma, b.turma]);
      checar('os sujeitos de A são só de A', a.opcoes.map((o) => o.valor).join(',') === 'Aluna A',
        a.opcoes.map((o) => o.valor));
      checar('os sujeitos de B são só de B', b.opcoes.map((o) => o.valor).join(',') === 'Aluna B',
        b.opcoes.map((o) => o.valor));
      const sem = await pedir('/api/anamneses?plano=' + PLANO_A);
      checar('sem o professor, a rota ainda devolve a união (o recorte é explícito)',
        sem.opcoes.length === 2, sem.opcoes.map((o) => o.valor));
      const soProfessor = await pedir('/api/anamneses?professor=prof-a');
      checar('sem plano escolhido, o professor já recorta para as alunas dele',
        soProfessor.opcoes.map((o) => o.valor).join(',') === 'Aluna A',
        soProfessor.opcoes.map((o) => o.valor));
    }

    // ── 3. a tela: a estante pede o professor da barra ─────────────────────
    servidor.registro.length = 0;
    const { dom, erros } = await abrir(servidor.base);
    const janela = dom.window;
    const documento = janela.document;

    const estantes = pedidosDe(servidor.registro, '/api/planos');
    checar('a tela pede a estante com o professor da barra',
      comParametro(estantes, 'professor').indexOf('prof-a') !== -1,
      estantes.slice(0, 3));
    checar('a tela não pede a estante sem professor', estantes.every((u) => {
      const p = new URL(u, 'http://x').searchParams.get('professor');
      return p === 'prof-a';
    }), estantes.slice(0, 3));

    // ── 4. a lista de planos mostra a turma e o atalho para ela ────────────
    const iPlano = janela.eval('MAPA.nos.findIndex((n) => n.id === "plano-de-ensino")');
    janela.irPara(iPlano, false);
    await esperar(() => documento.querySelectorAll('.grade .opcao').length > 0);

    const opcoes = [...documento.querySelectorAll('.grade .opcao')];
    checar('a lista do PO tem só o plano de A', opcoes.length === 1, opcoes.map(texto));
    const rotulo = texto(opcoes[0]);
    checar('a opção diz de que TURMA é o plano', /Turma:\s*Turma 1/.test(rotulo), rotulo);
    const atalho = opcoes[0].querySelector('a');
    checar('a opção tem o atalho «ver a turma»',
      !!atalho && /\/bastidores\/producao\?turma=Turma%201#turmas$/.test(atalho.getAttribute('href')),
      atalho && atalho.getAttribute('href'));
    checar('o plano de B não aparece', rotulo.indexOf('Objetivo B') === -1, rotulo);

    // ── 5. escolher o plano leva o par (plano, professor) aos sujeitos ─────
    const radio = opcoes[0].querySelector('input[type="radio"]');
    radio.checked = true;
    radio.dispatchEvent(new janela.Event('change', { bubbles: true }));
    await esperar(() => janela.eval('RESPOSTAS.get("plano-de-ensino")') === PLANO_A, 8000);
    checar('a escolha do plano fica registada', janela.eval('RESPOSTAS.get("plano-de-ensino")') === PLANO_A);

    const iSujeitos = janela.eval('MAPA.nos.findIndex((n) => n.id === "sujeitos")');
    janela.irPara(iSujeitos, false);
    await esperar(() => documento.querySelectorAll('input[name="pratica"]').length > 0);

    const anamneses = pedidosDe(servidor.registro, '/api/anamneses');
    const daTurma = anamneses.filter((u) => {
      const p = new URL(u, 'http://x').searchParams;
      return p.get('plano') === PLANO_A;
    });
    checar('a lista de sujeitos pede o plano escolhido', daTurma.length > 0, anamneses);
    checar('…e pede o PROFESSOR (o recorte é da curadoria)',
      daTurma.some((u) => new URL(u, 'http://x').searchParams.get('professor') === 'prof-a'), daTurma);
    const sujeitos = [...documento.querySelectorAll('.grade .opcao')].map(texto);
    checar('a aluna de A aparece', sujeitos.some((t) => t.indexOf('Aluna A') !== -1), sujeitos);
    checar('a aluna de B NÃO aparece', sujeitos.every((t) => t.indexOf('Aluna B') === -1), sujeitos);

    // ── 6. trocar o professor troca a estante e limpa o que era do anterior ─
    const seletor = documento.getElementById('ctx-professor');
    seletor.value = 'prof-b';
    seletor.dispatchEvent(new janela.Event('change', { bubbles: true }));

    await esperar(() => {
      const estante = pedidosDe(servidor.registro, '/api/planos');
      return comParametro(estante, 'professor').indexOf('prof-b') !== -1;
    }, 8000);
    checar('trocar o professor busca a estante do NOVO',
      comParametro(pedidosDe(servidor.registro, '/api/planos'), 'professor').indexOf('prof-b') !== -1);
    checar('o plano do professor anterior é esquecido',
      janela.eval('RESPOSTAS.get("plano-de-ensino")') == null,
      janela.eval('RESPOSTAS.get("plano-de-ensino")'));

    janela.irPara(iPlano, false);
    await esperar(() => documento.querySelectorAll('.grade .opcao').length > 0);
    const novas = [...documento.querySelectorAll('.grade .opcao')].map(texto);
    checar('a lista agora tem o plano de B', novas.some((t) => t.indexOf('Objetivo B') !== -1), novas);
    checar('e não tem o de A', novas.every((t) => t.indexOf('Objetivo A') === -1), novas);

    checar('a página não teve erro de script', erros.length === 0, erros.slice(0, 3));

    // ── 7. o atalho «ver a turma» abre a Produção já filtrada por ela ──────
    {
      const { JSDOM } = require('jsdom');
      const bastidores = require('../motor/servidor/bastidores.js');
      const turmas = [
        { id: 'turma-1', nome: TURMA, ativo: true, frequencia: 2, duracaoMin: 60 },
        { id: 'turma-2', nome: 'Outra turma', ativo: true, frequencia: 2, duracaoMin: 60 },
      ];
      const html = bastidores.paginaProducao('x', { professor: 'prof-a', ciclo: '01', query: '' },
        [], [], '', '', turmas, [], {}, [], [], [], null, null, TURMA);
      const producao = new JSDOM(html, {
        url: 'http://x/bastidores/producao?turma=' + encodeURIComponent(TURMA) + '#turmas',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        beforeParse(janela) {
          janela.matchMedia = () => ({
            matches: false,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
          });
          janela.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
        },
      });
      await esperar(() => producao.window.sessionStorage.getItem('producao:filtro-turmas') != null);
      const filtro = producao.window.sessionStorage.getItem('producao:filtro-turmas') || '';
      checar('a Produção recebe o filtro pelo NOME da turma, resolvido para o ID',
        filtro.indexOf('turma-1') !== -1, filtro);
      const dentro = producao.window.document.querySelector('li.turma[data-turma="turma-1"]');
      const fora = producao.window.document.querySelector('li.turma[data-turma="turma-2"]');
      checar('a turma do plano fica na lista', !!dentro && dentro.hidden === false);
      checar('e a outra turma sai da vista', !!fora && fora.hidden === true);
      producao.window.close();
    }

    janela.close();
  } finally {
    servidor.fechar();
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principais().catch((erro) => {
  console.error(erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
