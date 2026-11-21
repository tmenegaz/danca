#!/usr/bin/env node
'use strict';

/**
 * provar-turmas-do-professor.js — A TURMA NÃO EXISTE SEM O PROFESSOR (27/10/2026).
 *
 * O RELATO DA PESQUISADORA, em produção:
 *
 *   «Eu tenho a curadoria. O professor Demi Plié está curado para a turma balé nível 1, teste 2.
 *    O professor Só para a Direita está curado para balé nível 2 e 3. […] E quando eu vou fazer o
 *    plano de ensino, eu consigo misturar aqui os professores e as turmas. Não preciso respeitar a
 *    curadoria. Isso não pode acontecer. […] o professor é o caminho da verdade. Quando eu
 *    seleciono um dos professores, a lista de turmas já se carrega para aquelas turmas das quais o
 *    professor pode fazer o seu plano. E o contrário não. Não vai existir possibilidade de escolher
 *    uma turma se não tiver o nome do professor.»
 *
 * O DEFEITO, medido nesta bancada antes de se tocar em código. A regra JÁ EXISTIA — «a lista
 * filtra para o que é do professor» — e tinha uma porta aberta no sítio exacto onde a pergunta não
 * tem resposta:
 *
 *     if (no.daCuradoria && CURADORIA_CARREGADA && atribuido.length) { filtrar… }
 *
 * Com o professor em branco, `atribuido` fica VAZIO, o `if` não corre, e a lista sai INTEIRA: as
 * três turmas da escola, com uma já escolhida. É a ausência de dado a ser lida como autorização —
 * a mesma família de erro que esta sessão vem corrigindo, agora na autorização do plano.
 *
 * O QUE ESTA PROVA TRAVA:
 *
 *   1. um professor só vê as turmas da curadoria DELE — e são as certas;
 *   2. trocar de professor troca a lista, e a escolha do anterior NÃO sobrevive;
 *   3. SEM professor não há turma nenhuma, e a tela diz porquê;
 *   4. professor com curadoria sem turma também não tem nenhuma;
 *   5. a lista é vazia enquanto a curadoria não chegou (não se mostra o que não se sabe);
 *   6. o SERVIDOR recusa o plano de uma turma não atribuída — um filtro de tela não é uma regra.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): a `porta/index.html` de antes, servida a partir do
 * commit que introduziu `listaDeTurmasDoProfessor` com os quatro estados, menos um. Espera-se que
 * as asserções 3, 4 e 5 reprovem — são as que a porta aberta deixava passar.
 *
 *   node experimentos/provar-turmas-do-professor.js [--controle-negativo]
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, execFileSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const PAGINA = path.join(raiz, 'porta', 'index.html');

let total = 0;
let falhas = 0;
const provar = (nome, ok, detalhe) => {
  total += 1;
  console.log('  ' + (ok ? 'ok    ' : 'FALHOU') + ' ' + nome
    + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

const negativo = process.argv.includes('--controle-negativo');

/* A ESCOLA MUDOU DE `batata` PARA `breu` (20/11/2026) — a `batata` foi expurgada, e o que esta
 * prova mede é a REGRA («o professor só vê as turmas dele»), que não depende da escola. Os slugs
 * acompanham os nomes das fixtures. */
const ESCOLA = 'breu';
const TURMAS = ['Balé Nível 1 — Teste 2', 'Balé Nível 2 — Teste 2', 'Balé Nível 3 — Teste 2'];
const CURADORIAS = [
  { id: 'pb1', professor: 'demi-plie', modalidade: 'Balé clássico', tradicao: 'Vaganova',
    turmas: [TURMAS[0]], alunas: ['Aluna A'] },
  { id: 'sp1', professor: 'so-para-direita', modalidade: 'Balé clássico', tradicao: 'Vaganova',
    turmas: [TURMAS[1]], alunas: ['Aluna B'] },
  { id: 'sp2', professor: 'so-para-direita', modalidade: 'Balé clássico', tradicao: 'Vaganova',
    turmas: [TURMAS[2]], alunas: ['Aluna C'] },
  { id: 'sm1', professor: 'sem-turma', modalidade: 'Balé clássico', tradicao: 'Vaganova',
    turmas: [], alunas: ['Aluna D'] },
];

/* A PÁGINA SERVIDA. No controle negativo, a de antes — do commit que introduziu a regra dos
 * quatro estados, menos um. O ref NÃO se fixa em `HEAD` (a lição de 26/10): depois do commit,
 * `HEAD` é o estado novo e o controle passaria a medir o presente. */
/* O REF DO CONTROLE SE DERIVA DO MARCADOR, e não se fixa em `HEAD` (a lição de 26/10: depois
 * do commit, `HEAD` É o código novo, e o controle passaria a medir o presente e a dar verde).
 * Dois arquivos, dois marcadores: a tela e a barreira do servidor entram no mesmo commit, mas
 * medir cada uma contra o seu próprio marcador impede que um commit futuro numa delas cegue a
 * outra. Sem referência, a prova diz «NÃO FEITO» e sai com 2 — nunca finge ter medido. */
function refDoMarcador(arquivo, marcador) {
  const em = (ref) => {
    try { return execFileSync('git', ['show', ref + ':' + arquivo], { cwd: raiz, encoding: 'utf8' }); }
    catch (e) { return null; }
  };
  if (process.env.REF_NEGATIVO) return process.env.REF_NEGATIVO;
  const noHead = em('HEAD');
  if (noHead !== null && noHead.indexOf(marcador) === -1) return 'HEAD';
  let sha = '';
  try {
    sha = execFileSync('git', ['log', '-1', '--format=%H', '-S' + marcador, '--', arquivo],
      { cwd: raiz, encoding: 'utf8' }).trim();
  } catch (e) { sha = ''; }
  return sha ? sha + '~1' : null;
}

const paginaServida = (() => {
  if (!negativo) return fs.readFileSync(PAGINA, 'utf8');
  const ref = refDoMarcador('porta/index.html', 'avisoDaTurma');
  const texto = ref ? execFileSync('git', ['show', ref + ':porta/index.html'],
    { cwd: raiz, encoding: 'utf8' }) : null;
  if (texto === null) {
    console.error('provar-turmas-do-professor: controle da TELA sem referência — NÃO FEITO.');
    process.exit(2);
  }
  console.log('  (controle da tela sobre ' + ref + ')');
  return texto;
})();

/* O CONTROLE DA BARREIRA. A tela de antes é servida no mesmo sítio; o SERVIDOR de antes tem de
 * estar carregado, e não basta trocar o HTML — sem isto o bloco 5 media o `rotas.js` do worktree
 * nos dois sentidos, e o controle passava a provar o contrário do que diz provar. A receita é a
 * do projeto: compilar o arquivo do ref e instalá-lo no `require` ANTES de requerer quem o usa. */
if (negativo) {
  const ref = refDoMarcador('motor/servidor/rotas.js', 'não está atribuída a este professor');
  let texto = null;
  if (ref) {
    try {
      texto = execFileSync('git', ['show', ref + ':motor/servidor/rotas.js'],
        { cwd: raiz, encoding: 'utf8' });
    } catch (e) { texto = null; }
  }
  if (texto === null) {
    console.error('provar-turmas-do-professor: controle do SERVIDOR sem referência — NÃO FEITO.');
    process.exit(2);
  }
  const Module = require('module');
  const alvo = path.join(raiz, 'motor/servidor/rotas.js');
  const modulo = new Module(alvo, null);
  modulo.filename = alvo;
  modulo.paths = Module._nodeModulePaths(path.dirname(alvo));
  modulo._compile(texto, alvo);
  require.cache[alvo] = modulo;
  console.log('  (controle do servidor sobre ' + ref + ')');
}

/* ------------------------------------------------------------------ a bancada de servidor */

const producao = require(path.join(raiz, 'motor/servidor/producao.js'));

function kv(inicial) {
  const m = new Map(Object.entries(inicial || {}));
  return {
    m,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, String(v)); },
    async delete(k) { m.delete(k); },
    async list(p) {
      return { keys: [...m.keys()].filter((k) => !p || k.startsWith(p)).map((name) => ({ name })),
        list_complete: true };
    },
  };
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json',
};
function assets(dir) {
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      let p = path.join(dir, url.pathname);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(p), { status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream' } });
    },
  };
}

const MAPA = require(path.join(raiz, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa'
  + '/plano-observacao/plano/conteudo/plano.json'));

function envDaBancada() {
  return {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'Demi Plié',
    SENHA_PROFESSOR: 'p', SENHA_ADMIN: 'd',
    PADD_KV: kv({
      ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify(CURADORIAS),
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify(TURMAS.map((nome, i) => ({
        id: 't' + (i + 1), nome, ativo: true, ordem: i + 1, frequencia: '2x/semana',
        dias: ['terça'], duracao: 60, periodo: '2027-1',
      }))),
      ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([
        { nome: 'Demi Plié', slug: 'demi-plie', senha: 'p' },
        { nome: 'Só para Direita', slug: 'so-para-direita', senha: 'p' },
        { nome: 'Sem Turma', slug: 'sem-turma', senha: 'p' },
      ]),
    }),
    ASSETS: assets(path.join(raiz, 'publicacao', ESCOLA)),
  };
}

/* A PÁGINA DO PLANO servida pela bancada é a de `porta/index.html` — e no controle negativo, a de
   antes. O pedido da página em si passa pelo `producao`; o que se substitui é o CONTEÚDO servido
   no caminho da porta, e é o mesmo caminho que o Worker serve em produção. */
function servir(env) {
  const srv = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (/^\/plano-ensino\/(index\.html)?$/.test(url.pathname)) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(paginaServida);
      return;
    }
    const pedacos = [];
    for await (const p of req) pedacos.push(p);
    const corpo = Buffer.concat(pedacos);
    const r = await producao.fetch(new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + req.url, {
      method: req.method,
      headers: req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : undefined,
      body: corpo.length && req.method !== 'GET' ? corpo : undefined,
    }), env);
    res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'text/html; charset=utf-8',
      'cache-control': 'no-store' });
    res.end(Buffer.from(await r.arrayBuffer()));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-turmas-do-professor: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(2);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-turmas-do-professor: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(2);
  }

  const env = envDaBancada();
  const { srv, base } = await servir(env);
  const navegador = await puppeteer.launch({
    executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1280, height: 900 });
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(String(e && e.message).slice(0, 160)));

  const abrir = async (slug) => {
    const q = slug ? '&professor=' + encodeURIComponent(slug) : '';
    const alvo = base + '/plano-ensino/?escola=' + ESCOLA + '&ciclo=01' + q + '&abrir=1';
    await pagina.goto(alvo, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1500));
  };
  const estadoDaTurma = () => pagina.evaluate(() => {
    const sel = document.getElementById('ctx-turma');
    if (!sel) return { existe: false, opcoes: [], valor: null, desabilitado: null, aviso: '' };
    /* O AVISO VIVE AO LADO DO SELECT, dentro de `#ctx-turma-conteudo` — e há dois estados de
       vazio: o `<select>` desabilitado com a frase (quando a lista é vazia) e o `<p class="aviso">`
       que o mesmo ramo emite. Lê-se o contentor, e não o pai do `<select>`: o pai é o contentor,
       mas escrever isso é depender de a marcação não mudar. */
    const caixa = document.getElementById('ctx-turma-conteudo') || sel.parentElement;
    const aviso = caixa ? String((caixa.querySelector('.aviso') || {}).textContent || '').trim() : '';
    return {
      existe: true,
      opcoes: [...sel.querySelectorAll('option')].map((o) => o.value).filter(Boolean),
      valor: sel.value,
      desabilitado: sel.disabled,
      aviso,
      textoDaCaixa: caixa ? String(caixa.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200) : null,
      textoDaOpcaoVazia: ((sel.querySelector('option') || {}).textContent || '').trim(),
    };
  });
  const trocar = async (slug) => {
    await pagina.evaluate((s) => {
      const sel = document.getElementById('ctx-professor');
      sel.value = s;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }, slug);
    await new Promise((r) => setTimeout(r, 1600));
  };

  console.log('\n1. Cada professor vê as turmas da curadoria DELE — e só essas');
  await abrir('demi-plie');
  let e = await estadoDaTurma();
  provar('demi-plie vê só a turma dele', JSON.stringify(e.opcoes) === JSON.stringify([TURMAS[0]]), e.opcoes);
  provar('…e não vê as dos outros dois',
    e.opcoes.indexOf(TURMAS[1]) === -1 && e.opcoes.indexOf(TURMAS[2]) === -1, e.opcoes);

  await abrir('so-para-direita');
  e = await estadoDaTurma();
  provar('so-para-direita vê as DUAS turmas dele',
    JSON.stringify(e.opcoes) === JSON.stringify([TURMAS[1], TURMAS[2]]), e.opcoes);
  provar('…e não vê a do demi-plie', e.opcoes.indexOf(TURMAS[0]) === -1, e.opcoes);

  console.log('\n2. Trocar de professor troca a lista, e a escolha do anterior não sobrevive');
  await abrir('demi-plie');
  await pagina.evaluate(() => {
    const sel = document.getElementById('ctx-turma');
    sel.value = sel.options[1].value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 400));
  const antes = await estadoDaTurma();
  provar('com o demi-plie, a turma dele fica escolhida', antes.valor === TURMAS[0], antes.valor);
  await trocar('so-para-direita');
  e = await estadoDaTurma();
  provar('ao trocar, a lista é a do novo professor',
    JSON.stringify(e.opcoes) === JSON.stringify([TURMAS[1], TURMAS[2]]), e.opcoes);
  provar('…e a turma do anterior NÃO fica escolhida', e.valor === '', e.valor);

  console.log('\n3. SEM professor não há turma nenhuma — e a tela diz porquê');
  await trocar('');
  e = await estadoDaTurma();
  provar('a lista fica vazia', e.existe && e.opcoes.length === 0, e.opcoes);
  provar('o campo fica desabilitado', e.desabilitado === true, e.desabilitado);
  provar('e o aviso manda escolher o professor primeiro', /professor/i.test(e.aviso), e.aviso);

  console.log('\n4. Professor com curadoria mas SEM turma: também nenhuma');
  await abrir('sem-turma');
  e = await estadoDaTurma();
  provar('a lista fica vazia', e.opcoes.length === 0, e.opcoes);
  provar('e o aviso diz que a direção não atribuiu turma', /curadoria|atribuiu|turma/i.test(e.aviso),
    { existe: e.existe, aviso: e.aviso, caixa: e.textoDaCaixa, opcao: e.textoDaOpcaoVazia });

  console.log('\n5. O SERVIDOR recusa a turma não atribuída — a tela não é a regra');
  /* O PORQUÊ: um filtro de tela é contornável por qualquer `POST` à mão. A regra que a
     pesquisadora descreveu («não pode ser algo que um professor pode fazer o plano de ensino de
     qualquer turma») tem de estar onde o documento nasce. A prova faz o PEDIDO, e não lê o
     código. */
  const pedirPlano = async (professor, turma) => {
    /* O ENDEREÇO LEVA O PREFIXO DA PORTA. No Worker, `/api/elicitar` resolve para
       `/plano-ensino/api/elicitar` — a elicitação é da porta, não da raiz. A primeira versão
       pedia a raiz e recebia 404, que se lê como «o servidor não recusou» quando na verdade
       ninguém atendeu. */
    const r = await producao.fetch(new Request(
      'https://' + ESCOLA + '.tmenegaz77.workers.dev/plano-ensino/api/elicitar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fonte: 'plano',
          contexto: { escola: ESCOLA, professor, ciclo: '01' },
          respostas: { 'contexto-turma': { valor: turma } },
        }),
      }), env);
    let json = {};
    try { json = await r.json(); } catch (e) { json = {}; }
    return { status: r.status, erro: String(json.erro || '') };
  };
  const cruzado = await pedirPlano('demi-plie', TURMAS[1]);
  provar('o plano do demi-plie com a turma do so-para-direita é RECUSADO',
    cruzado.status === 403, cruzado);
  provar('…e a recusa nomeia a turma e diz de quem ela é',
    /Balé Nível 2/.test(cruzado.erro) && /professor|curadoria/i.test(cruzado.erro), cruzado.erro);

  const alheia = await pedirPlano('sem-turma', TURMAS[0]);
  provar('um professor sem turma nenhuma não escreve plano de turma alguma',
    alheia.status === 403, alheia);

  const propria = await pedirPlano('demi-plie', TURMAS[0]);
  provar('…e a turma que É dele passa (não se proíbe o que é autorizado)',
    propria.status !== 403, propria);

  provar('nenhum erro de JavaScript na página', erros.length === 0, erros.slice(0, 3));

  await navegador.close();
  srv.close();

  console.log('\n' + (falhas
    ? 'FALHOU — ' + falhas + ' de ' + total + ' asserções'
    : 'TUDO CERTO — ' + total + ' asserção(ões), 0 falha(s)') + '.'
    + (negativo ? ' (controle negativo: espera-se reprovar)' : ''));
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.error('provar-turmas-do-professor: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
