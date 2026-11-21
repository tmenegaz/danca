#!/usr/bin/env node
'use strict';

/**
 * provar-o-registo-abre.js — «Ajustar» abre o REGISTO, e não um nó que não se preenche.
 *
 * O QUE MOTIVOU (21/11/2026). Ela, depois de o Plano de Observação voltar a abrir:
 *
 *   «O plano de observação abre o formulário quando eu clico em ajustar. O problema é que não
 *    carrega o formulário, não tem nada aqui carregando o formulário. Então o que aparece é
 *    retomada de um preenchimento interrompido.»
 *
 * E a URL onde a aba empacava: `/api/bastidores/alunas-da-turma?turma=Rosa` — que responde 200 em
 * 0,5–1,1 s, medido três vezes. Não era ela.
 *
 * O DEFEITO, e são três elos, medidos na bancada com o acervo real da `breu`:
 *
 *   1. A CAIXA DA RETOMADA FICAVA A MENTIR. `lerMemoria` corre ANTES do atalho (tem de correr: o
 *      depósito é lido antes de a barra ser semeada), e deixa escrito «Retomando um preenchimento
 *      interrompido: 5 de 23». O `?ajustar=` abre depois um REGISTO, substitui as respostas — e o
 *      recado ficava, a contradizer os contadores («18 de 23») na mesma tela.
 *   2. A PÁGINA ABRIA NUM NÓ DE CABEÇALHO. `abrirFormulario(0)` chama `irPara(0)`; com um
 *      depósito restaurado o `INDICE` vale 6, logo `i < INDICE`, e a busca do primeiro degrau
 *      segue PARA TRÁS. A partir do 0 ela sai do mapa, desiste, e devolve 0 — que é cabeçalho. O
 *      resultado é a moldura do formulário com «Professor responsável … não se preenche aqui»
 *      dentro, e nenhuma pergunta. Sem depósito, o `INDICE` também é 0, a busca segue para a
 *      frente, e funciona: era a diferença entre quem já tinha preenchido e quem nunca tinha.
 *   3. DUAS CHAVES PARA O MESMO RASCUNHO. `chaveDaMemoria()` lê o campo e, quando ele está vazio,
 *      a URL. O link «Ajustar» não levava `escola`, portanto a leitura saía
 *      `porta-po-demi-plie-01-1`; e o `salvar()` seguinte, com o campo já preenchido, gravava em
 *      `porta-po-breu-demi-plie-01-1`. Metade do depósito em cada lado, e «retomar» encontrava um
 *      de cada vez.
 *
 * O QUE SE PROVA:
 *
 *   A. sem depósito: abre no primeiro DEGRAU («1. Horizonte»), como sempre abriu;
 *   B. COM depósito — o caso dela: abre no primeiro DEGRAU, não num nó de cabeçalho, e o recado
 *      da retomada não fica visível depois de o registo ser carregado;
 *   C. nenhum índice do roteiro leva a um nó de cabeçalho, em nenhuma das duas situações — é a
 *      regra que o elo 2 violava;
 *   D. o link «Ajustar» da lista leva `escola`, e as duas pontas produzem a MESMA chave.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): o `porta/index.html` de `HEAD`. Espera-se que B e C
 * caiam — sem isso a prova não mede o defeito, mede-se a si mesma.
 *
 *   node experimentos/provar-o-registo-abre.js [--controle-negativo]
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, execFileSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.indexOf('--controle-negativo') !== -1;
const ESCOLA = 'breu';
const PAGINA = path.join(raiz, 'porta', 'index.html');

/** O `index.html` que a bancada serve — o de hoje, ou o de `HEAD` no controle negativo. */
const HTML = (() => {
  if (!NEGATIVO) return fs.readFileSync(PAGINA, 'utf8');
  try {
    return execFileSync('git', ['show', 'HEAD:porta/index.html'], { cwd: raiz, encoding: 'utf8' });
  } catch (e) {
    console.error('provar-o-registo-abre: controle sem referência — NÃO FEITO.');
    process.exit(2);
  }
})();

let total = 0;
let falhas = 0;
function provar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok     ' + descricao); return; }
  falhas += 1;
  console.log('  FALHOU ' + descricao
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 400)));
}

function kv(inicial) {
  const m = new Map(Object.entries(inicial || {}));
  return {
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, String(v)); },
    async delete(k) { m.delete(k); },
    async list(p) {
      return { keys: [...m.keys()].filter((k) => !p || k.startsWith(p)).map((name) => ({ name })),
        list_complete: true };
    },
  };
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.json': 'application/json' };

function assets(dir) {
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      /* A PÁGINA É A DESTA PROVA, e não a publicada: é o `<script>` de `porta/index.html` que se
       * mede, e servir a cópia do pacote mediria o pacote de ontem. */
      if (url.pathname === '/plano-observacao/' || url.pathname === '/plano-observacao/index.html') {
        return new Response(HTML, { status: 200, headers: { 'Content-Type': TIPOS['.html'] } });
      }
      let p = path.join(dir, url.pathname);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(p), { status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream' } });
    },
  };
}

/* O ACERVO REAL — os envelopes e a linha de base que a `breu` tem no disco. É o estado dela. */
function acervo() {
  const base = {};
  const envelopes = path.join(raiz, 'escola', ESCOLA, 'envelopes');
  for (const nome of fs.readdirSync(envelopes)) {
    if (!nome.endsWith('.json')) continue;
    base[ESCOLA + '/envelope/' + nome] = fs.readFileSync(path.join(envelopes, nome), 'utf8');
  }
  const ldb = path.join(raiz, 'escola', ESCOLA, 'linhas-de-base');
  if (fs.existsSync(ldb)) {
    for (const nome of fs.readdirSync(ldb)) {
      if (!nome.endsWith('.json') || nome.startsWith('.')) continue;
      base[ESCOLA + '/linhas-de-base/' + nome] = fs.readFileSync(path.join(ldb, nome), 'utf8');
    }
  }
  base['bastidores/' + ESCOLA + '/curadorias'] = JSON.stringify([{
    id: 'c1', professor: 'demi-plie', turmas: ['Rosa'], alunas: ['Aluna A', 'Aluna B'],
    linhaDeBase: 'tami' }]);
  base['bastidores/' + ESCOLA + '/turmas'] = JSON.stringify([{ id: 'rosa', nome: 'Rosa', ativo: true,
    frequencia: 3, dias: ['seg', 'qua', 'sex'],
    horarios: { seg: '10:30', qua: '10:30', sex: '10:30' }, duracaoMin: 120,
    periodoInicio: '2026-12-14', periodoFim: '2027-01-15', programaReferencia: 'RAD',
    nivelReferencia: 'Grade 1', rubrica: ['Excelente', 'Bom', 'Em desenvolvimento'] }]);
  base['bastidores/' + ESCOLA + '/professores'] = JSON.stringify([
    { nome: 'Demi Plié', slug: 'demi-plie', senha: 'p' }]);
  return base;
}

const producao = require(path.join(raiz, 'motor/servidor/producao.js'));

function envDaBancada() {
  return {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'Demi Plié',
    SENHA_PROFESSOR: 'p', SENHA_ADMIN: 'd',
    PADD_KV: kv(acervo()),
    ASSETS: assets(path.join(raiz, 'publicacao', ESCOLA)),
  };
}

function servir(env) {
  const srv = http.createServer(async (req, res) => {
    const pedacos = [];
    for await (const p of req) pedacos.push(p);
    const corpo = Buffer.concat(pedacos);
    const r = await producao.fetch(new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + req.url, {
      method: req.method,
      headers: req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : undefined,
      body: corpo.length && req.method !== 'GET' ? corpo : undefined,
    }), env);
    res.writeHead(r.status, {
      'content-type': r.headers.get('content-type') || 'text/html; charset=utf-8',
      'cache-control': 'no-store' });
    res.end(Buffer.from(await r.arrayBuffer()));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

/* O DEPÓSITO — o mesmo formato que `salvar()` grava, com o que ela tinha a meio. */
function deposito() {
  return JSON.stringify({
    total: 23, quando: '2026-11-21T01:10:00.000Z', indice: 6,
    respostas: [
      ['horizonte', 'Ao fim do ano, a turma do Nível 1 deve sustentar o en dehors sem perder o eixo.'],
      ['question', 'o que exatamente se observa'],
      ['sujeitos', ['Aluna A', 'Aluna B']],
      ['dimensoes-de-observacao', ['Solo', 'Barra', 'Centro', 'Musicalidade']],
      ['itens-por-dimensao', Array.from({ length: 12 }, (_, i) => ({ dimensao: 'B' + i, itens: 'a; b' }))],
    ],
    notas: [], sugeridas: [],
  });
}

(async () => {
  const executavel = process.env.CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-o-registo-abre: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (e) {
    console.error('provar-o-registo-abre: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  /* O id do PO mais recente do acervo — o mesmo que a lista oferece em «Ajustar». */
  const envelopes = fs.readdirSync(path.join(raiz, 'escola', ESCOLA, 'envelopes'))
    .filter((n) => /^po-.*\.json$/.test(n)).sort();
  const PO = envelopes.length ? envelopes[envelopes.length - 1].replace(/\.json$/, '') : null;
  const planos = fs.readdirSync(path.join(raiz, 'escola', ESCOLA, 'envelopes'))
    .filter((n) => /^plano-.*\.json$/.test(n)).sort();
  const PLANO = planos.length ? planos[planos.length - 1].replace(/\.json$/, '') : '';

  const { srv, base } = await servir(envDaBancada());
  const br = await puppeteer.launch({ executablePath: executavel,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const URL_AJUSTAR = base + '/plano-observacao/?fonte=po&escola=' + ESCOLA +
    '&ajustar=' + encodeURIComponent(PO) + '&professor=demi-plie&ciclo=01' +
    (PLANO ? '&plano=' + encodeURIComponent(PLANO) : '');

  console.log('\nA FONTE DA VERDADE É O QUE A TELA MOSTRA — e o registo dela é o caso');

  /* --------------------------------------------------------------------------------------- */
  console.log('\nA. Sem depósito: abre no primeiro degrau');
  /* --------------------------------------------------------------------------------------- */
  {
    const pg = await br.newPage();
    await pg.setViewport({ width: 1360, height: 768 });
    await pg.goto(URL_AJUSTAR, { waitUntil: 'networkidle2', timeout: 60000 });
    const r = await pg.evaluate(() => ({
      pergunta: (document.getElementById('pergunta') || {}).innerText?.replace(/\s+/g, ' ').trim().slice(0, 90),
      aviso: (document.getElementById('aviso-do-ato') || {}).innerText?.replace(/\s+/g, ' ').trim().slice(0, 90),
      avisoOculto: (document.getElementById('aviso-do-ato') || {}).classList?.contains('oculto'),
    }));
    provar('o formulário abre na pergunta 1 (e não numa moldura vazia)',
      /horizonte/i.test(String(r.pergunta)), r.pergunta);
    provar('sem depósito não há recado de retomada', r.avisoOculto !== false ? true : !r.aviso, r);
    await pg.close();
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\nB. COM depósito (o caso dela): abre no primeiro degrau, e a retomada não mente');
  /* --------------------------------------------------------------------------------------- */
  {
    const pg = await br.newPage();
    await pg.setViewport({ width: 1360, height: 768 });
    /* Semeia o depósito na chave que a URL produz — é o que o navegador dela tem. */
    await pg.goto(base + '/plano-observacao/?fonte=po&escola=' + ESCOLA, { waitUntil: 'domcontentloaded' });
    await pg.evaluate((v) => localStorage.setItem('porta-po-breu-demi-plie-01-1', v), deposito());
    await pg.goto(URL_AJUSTAR, { waitUntil: 'networkidle2', timeout: 60000 });
    const r = await pg.evaluate(() => ({
      /* 400 e não 120: a marca do defeito («não se preenche aqui») vem DEPOIS do aviso do fecho,
       * e um corte curto deixava-a de fora — a asserção passava por não ter lido. */
      pergunta: (document.getElementById('pergunta') || {}).innerText?.replace(/\s+/g, ' ').trim().slice(0, 400),
      aviso: (document.getElementById('aviso-do-ato') || {}).innerText?.replace(/\s+/g, ' ').trim().slice(0, 120),
      carregado: (document.querySelector('.contadores') || {}).innerText?.replace(/\s+/g, ' ').trim(),
    }));
    /* O DEFEITO ERA EXACTAMENTE ESTA FRASE, a aparecer como «pergunta». */
    provar('a página NÃO abre num nó de cabeçalho («Professor responsável … não se preenche aqui»)',
      !/não se preenche aqui/i.test(String(r.pergunta)), r.pergunta);
    provar('…abre na pergunta 1', /horizonte/i.test(String(r.pergunta)), r.pergunta);
    provar('o recado da retomada não fica a contradizer o registo aberto',
      !/Retomando um preenchimento interrompido/i.test(String(r.aviso)), r.aviso);
    provar('e os contadores são os do REGISTO, não os do depósito (18 e não 5)',
      /18\s*\/\s*23/.test(String(r.carregado)), r.carregado);
    await pg.close();
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\nC. Nenhum índice leva a um nó de cabeçalho');
  /* --------------------------------------------------------------------------------------- */
  {
    const pg = await br.newPage();
    await pg.setViewport({ width: 1360, height: 768 });
    await pg.goto(URL_AJUSTAR, { waitUntil: 'networkidle2', timeout: 60000 });
    const achados = [];
    const quantos = await pg.evaluate(() => document.querySelectorAll('#roteiro li').length);
    for (let i = 0; i < quantos; i += 1) {
      const texto = await pg.evaluate((n) => {
        const lis = [...document.querySelectorAll('#roteiro li')];
        const li = lis[n];
        if (!li) return null;
        (li.querySelector('a, button') || li).click();
        return (document.getElementById('pergunta') || {}).innerText?.replace(/\s+/g, ' ').trim().slice(0, 110);
      }, i);
      if (texto && /não se preenche aqui/i.test(texto)) achados.push({ i, texto });
    }
    provar('percorridos todos os degraus, nenhum abre o «não se preenche aqui»',
      achados.length === 0, achados.slice(0, 3));
    await pg.close();
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\nD. O link «Ajustar» leva a escola — uma chave, e não duas');
  /* --------------------------------------------------------------------------------------- */
  {
    /* NO CONTROLE NEGATIVO LÊ-SE O DE `HEAD` — senão esta asserção lê o worktree e passa sempre,
     * jurando medir o passado. Um controle que não separa nada não é um controle. */
    const listas = NEGATIVO
      ? (() => { try { return execFileSync('git', ['show', 'HEAD:motor/servidor/listas-do-acervo.js'],
        { cwd: raiz, encoding: 'utf8' }); } catch (e) { return ''; } })()
      : fs.readFileSync(path.join(raiz, 'motor/servidor/listas-do-acervo.js'), 'utf8');
    provar('a lista passa `escola` ao endereço do formulário',
      /escola:\s*registo\.escola/.test(listas), 'sem ela a chave do depósito perde a escola');
    const pg = await br.newPage();
    await pg.setViewport({ width: 1360, height: 768 });
    await pg.goto(base + '/area-do-professor/plano-de-observacao/?professor=demi-plie&escola=' + ESCOLA,
      { waitUntil: 'networkidle2', timeout: 60000 });
    const href = await pg.evaluate(() => {
      const a = [...document.querySelectorAll('a')].find((x) => /ajustar=/i.test(x.getAttribute('href') || ''));
      return a ? a.getAttribute('href') : null;
    });
    provar('o «Ajustar» da listagem existe', Boolean(href), href);
    provar('…e traz a escola no endereço', Boolean(href) && /[?&]escola=/.test(href), href);
    await pg.close();
  }

  await br.close();
  srv.close();

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: «Ajustar» abre o REGISTO na primeira pergunta, '
    + 'com os contadores do registo e sem o recado da retomada a contradizê-lo; nenhum índice do '
    + 'roteiro abre um nó de cabeçalho; e o endereço leva a escola, que é o que faz o depósito ter '
    + 'uma chave só.');
})();
