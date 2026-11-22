#!/usr/bin/env node
'use strict';

/**
 * provar-a-margem-da-aba.js — O FORMULÁRIO NÃO ENCOSTA NO FILETE DAS ABAS (19/11/2026).
 *
 * O relato, na letra dela:
 *
 *   «Em professores voltou a acontecer um erro que já tinha sido corrigido. Na aba cadastros, logo
 *    que ela abre o formulário, a margem superior do formulário está colada na margem das abas. O
 *    correto é igual a habilitações, existe um espaço entre a aba e a margem superior do formulário.
 *    Cadastros já havia sido corrigido anteriormente e agora voltou a acontecer esse mesmo problema.
 *    Precisa fazer o ajuste e documentar isso para não acontecer mais.»
 *
 * A CAUSA, e é a terceira vez que ela aparece. A regra que dá o ar era
 *
 *     .aba-painel > form:first-child { margin-top: 1rem }
 *
 * — e ela nomeia o FILHO. Quando o painel do Cadastro ganhou um embrulho (`#pf-cadastro-paineis`,
 * que separa os dois passos), o `form` deixou de ser o primeiro filho e a regra parou de casar EM
 * SILÊNCIO: nada falha, nada avisa, o formulário só fica encostado. Medido a 1280 px, antes da
 * correcção: **0 px** no Cadastro contra **16 px** nas Habilitações.
 *
 * O QUE ESTA PROVA MEDE — e o A/B é a própria correcção:
 *
 *   A. A GEOMETRIA, em todas as abas das duas secções que as têm: o vão entre o fundo da tira de
 *      abas e o topo do primeiro conteúdo do painel é 16 px — o mesmo que ela declarou certo nas
 *      Habilitações. No `HEAD` o Cadastro mede 0.
 *   B. A REGRA É ESTRUTURAL. O que se afirma não é «o Cadastro está a 16 px» (isso o A mede), é que
 *      a regra NÃO depende de qual elemento está em primeiro: ela não pode voltar a nomear
 *      `form:first-child`. É a parte que impede o quarto regresso — a primeira já se corrigiu duas
 *      vezes e voltou.
 *   C. As peças que já trazem margem própria (`.aviso`, `.caixa`) não a recebem duas vezes: 16 px,
 *      e não 32.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITA.
 *
 *   node experimentos/provar-a-margem-da-aba.js
 *   node experimentos/provar-a-margem-da-aba.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const FOLHA = path.join(RAIZ, 'tools/templates/ciclo.css');
const ESPERADO = 16; // px — o vão que ela declarou certo, medido nas Habilitações.

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

function aPagina(motor) {
  const b = require(path.join(motor, 'servidor/bastidores.js'));
  return b.paginaProducao('breu', { escola: 'breu' },
    [{ nome: 'Bri Volet', slug: 'bri', modalidades: ['Ballet Clássico'] }],
    ['abreu'], 'Brise Volet', 'brise-volet', [], [], {}, [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, null, [], new Set(),
    { ok: true, contrato: { plano: 'avancado', capacidade: {} } });
}

const MIME = { '.css': 'text/css;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

function servir(html) {
  return http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/bastidores/estudio') {
      res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    /* AS ROTAS SÃO TODAS «OK E VAZIO»: a geometria das abas não depende do dado, e o preenchimento
     * delas é o que está a ser medido. Um 404 aqui faria a página parar a meio e mediria outra. */
    if (u.pathname.startsWith('/api/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, existe: true, modalidades: [], tradicoes: {},
        alunas: [], linhas: [], professores: [], turmas: [] }));
    }
    /* A FOLHA É A CONGELADA, e o nome do ficheiro não é o do endereço: `/assets/style.css` serve
     * `tools/templates/ciclo.css`. Um 404 aqui deixava a página sem folha nenhuma — e a geometria
     * medida seria a do navegador sem desenho, não a do produto. Apanhado a medir: com o 404, o
     * `.caixa` do painel 2 aparecia com `margin-top: 0px` e a prova reprovava um defeito que não
     * existia. */
    const f = u.pathname === '/assets/style.css'
      ? FOLHA
      : path.join(RAIZ, 'tools/templates', u.pathname.replace('/assets/', ''));
    if (fs.existsSync(f) && fs.statSync(f).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      return res.end(fs.readFileSync(f));
    }
    res.writeHead(404); res.end('nao');
  });
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executavel) {
    console.log('  —   NÃO MEDIDA: não há navegador nesta máquina.');
    console.log('      A prova mede geometria de verdade; sem ele, não mede nada.');
    process.exit(0);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (e) {
    console.log('  —   NÃO MEDIDA: puppeteer-core não encontrado (vem com o marp-cli global).');
    process.exit(0);
  }

  /* CONTROLE NEGATIVO: troca-se UMA linha — a regra da margem volta a ser a do `HEAD`, e mais nada
   * muda. É mais honesto do que extrair o repositório inteiro: a única diferença entre as duas
   * medições é a causa em teste, e não um motor de outra idade com outros defeitos lá dentro. Se a
   * bancada passasse com a regra antiga, não estaria a medir nada. */
  let html = aPagina(path.join(RAIZ, 'motor'));
  if (process.argv.includes('--controle-negativo')) {
    const ANTES = '.aba-painel>form:first-child,.aba-painel>.aviso[hidden]+form{margin-top:1rem;}';
    const DEPOIS = /.aba-painel>:first-child,\.aba-painel>\[hidden\]\+\*\{margin-top:1rem;\}/;
    if (!DEPOIS.test(html)) {
      console.log('  —   o controle negativo não achou a regra a substituir: NÃO FEITO.');
      process.exit(0);
    }
    html = html.replace(DEPOIS, ANTES);
    console.log('  (controle negativo: a regra da margem como estava no HEAD)');
  }

  const srv = servir(html);
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;

  const nav = await puppeteer.launch({ executablePath: executavel, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await nav.newPage();
  await pg.setViewport({ width: 1280, height: 900 });
  await pg.goto(base + '/bastidores/estudio', { waitUntil: 'networkidle0' });
  await pg.evaluate(() => {
    document.getElementById('gate').hidden = true;
    document.getElementById('conteudo').hidden = false;
    for (const s of ['sec-professores', 'sec-corpo']) {
      const el = document.getElementById(s);
      if (el) el.hidden = false;
    }
    if (typeof definirSecaoRecolhida === 'function') {
      definirSecaoRecolhida('sec-professores', false);
      definirSecaoRecolhida('sec-corpo', false);
    }
    /* O ELENCO QUE NÃO EXISTE FECHA AS ABAS 2 E 3, e para medir a margem delas é preciso que
     * abram — é o mesmo estado de quem já gravou um elenco. */
    try { ELENCOS_GRAVADOS = 1; } catch (e) {}
    if (typeof pintarAbasDaAudicao === 'function') pintarAbasDaAudicao();
  });
  await new Promise((r) => setTimeout(r, 400));

  /** O vão medido: do fundo da tira de abas ao topo do painel E ao topo do primeiro filho. */
  const vao = () => pg.evaluate(() => {
    return [...document.querySelectorAll('.aba-painel')].filter((p) => !p.hidden).map((p) => {
      const rotulo = document.getElementById(p.getAttribute('aria-labelledby'));
      const tira = rotulo ? rotulo.closest('nav') : null;
      if (!tira) return { id: p.id, erro: 'sem tira' };
      const qn = tira.getBoundingClientRect();
      const qp = p.getBoundingClientRect();
      const primeiro = [...p.children].find((c) => c.getBoundingClientRect().height > 0)
        || p.firstElementChild;
      const qf = primeiro ? primeiro.getBoundingClientRect() : qp;
      const rotuloDoPrimeiro = primeiro
        ? primeiro.tagName.toLowerCase() + (primeiro.id ? '#' + primeiro.id
          : '.' + String(primeiro.className || '').split(' ')[0])
        : '(vazio)';
      return { id: p.id, vaoPainel: Math.round(qp.top - qn.bottom),
        vaoPrimeiro: Math.round(qf.top - qn.bottom), primeiro: rotuloDoPrimeiro };
    });
  });

  // ===========================================================================================
  bloco('A. TODAS AS ABAS RESPIRAM 16 px — o vão que ela declarou certo nas Habilitações');

  const abas = [];
  for (const nome of ['cadastro', 'habilitacoes', 'desligamento']) {
    await pg.evaluate((a) => abrirAbaDoProfessor(a), nome);
    await new Promise((r) => setTimeout(r, 150));
    for (const m of await vao()) if (m.id.indexOf('pf-') === 0) abas.push(Object.assign({ aba: nome }, m));
  }
  for (const n of ['1', '2', '3']) {
    await pg.evaluate((x) => abrirAbaDaAudicao(x), n);
    await new Promise((r) => setTimeout(r, 150));
    for (const m of await vao()) if (m.id.indexOf('lb-') === 0 && m.aba === undefined) {
      abas.push(Object.assign({ aba: 'audicao-' + n }, m));
    }
  }

  const medidas = abas.filter((m) => /^(cadastro|habilitacoes|desligamento|audicao)/.test(m.aba));
  provar('as abas das duas secções foram medidas', medidas.length >= 4, medidas.map((m) => m.id));
  for (const m of medidas) {
    provar(m.aba + ' · ' + m.id + ' (' + m.primeiro + '): ' + m.vaoPrimeiro + 'px',
      m.vaoPrimeiro === ESPERADO, m);
  }

  await nav.close();
  srv.close();

  // ===========================================================================================
  bloco('\nB. A REGRA NÃO DEPENDE DE QUEM ESTÁ EM PRIMEIRO — a parte que impede o quarto regresso');

  /* O QUE SE AFIRMA NÃO É O NÚMERO — esse a secção A mede na tela. É a FORMA da regra: nomear o
   * filho (`.aba-painel>form:first-child`) é o que a quebrou duas vezes, e uma terceira correcção
   * do mesmo tipo voltaria a quebrar no dia em que outro painel ganhasse um embrulho. */
  const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8');
  provar('a folha da página dá margem ao PRIMEIRO FILHO, seja ele qual for',
    /\.aba-painel>:first-child/.test(fonte), null);
  provar('…e também ao primeiro que vem depois de um filho escondido (o aviso da Audição)',
    /\.aba-painel>\[hidden\]\+/.test(fonte), null);
  /* A REGRA A VALER É A DO `<style>`, e não a prosa que a explica: o comentário acima cita a regra
   * antiga (é preciso, para se perceber o defeito), e um `!` sobre o ficheiro inteiro reprovava a
   * própria explicação. O que se lê é o CSS que o servidor emite. */
  const estilo = (html.split('<style>')[1] || '').split('</style>')[0];
  provar('…sem nomear `form` na regra que o servidor emite (foi isso que a quebrou duas vezes)',
    !/\.aba-painel>form:first-child/.test(estilo), null);
  provar('…e sem excepções — a margem é definida, e não somada a quem já traz a sua',
    !/:not\(\.aviso\)/.test(estilo) && !/:not\(\.caixa\)/.test(estilo), null);

  /* A FOLHA CONGELADA NÃO FOI TOCADA: esta regra é da página, como o `.par-botoes`. Se um dia ela
   * passar para `ciclo.css`, este `provar` avisa que o sítio mudou — e que a cópia das superfícies
   * (`raiz/assets/style.css`, os pacotes) tem de ir atrás. */
  const folha = fs.readFileSync(FOLHA, 'utf8');
  provar('a regra da margem vive na página, e não na folha congelada',
    !/\.aba-painel\s*>\s*:first-child/.test(folha), null);

  // ===========================================================================================
  console.log('\n' + total + ' asserções, ' + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
