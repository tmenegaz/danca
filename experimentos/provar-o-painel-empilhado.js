#!/usr/bin/env node
'use strict';

/**
 * provar-o-painel-empilhado.js — os blocos do painel ficam UM SOB O OUTRO, como ela aprovou.
 *
 * O QUE ELA DISSE (22/11/2026), depois de ver o painel construído: «no painel inicial você me
 * apresentou no experimento, na parte de teste, os blocos empilhados e agora você colocou o breu do
 * lado esquerdo, as salas do lado direito, um ao lado do outro, os elencos abaixo e as modalidades
 * do lado direito. Então você me entregou duas linhas e duas colunas. Eu prefiro do jeito que eu
 * aprovei. Eu aprovei com a parte visual que você me mostrou que é empilhados.»
 *
 * PORQUE ACONTECEU. A bancada (`experimentos/propostas/proposta-painel-do-estudio.html`) é uma
 * página própria, com os cartões no fluxo. A página real põe a secção dentro da `.secao`, que é uma
 * GRADE DE DUAS COLUNAS — formulário à esquerda, listagem à direita —, e os quatro cartões caíam
 * nela dois a dois. O modelo e o produto tinham o mesmo conteúdo e uma arrumação diferente, e foi
 * o modelo que ela aprovou.
 *
 * O QUE SE MEDE: a GEOMETRIA. Quantas colunas a secção tem de facto (`gridTemplateColumns`), e
 * onde cada cartão cai — mesma borda esquerda, mesma largura, e o topo a crescer pela ordem da
 * leitura (identidade → salas → elencos → modalidades). Um painel «empilhado» que passasse por
 * ter as classes certas não passaria aqui.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` extrai `motor/` desse commit e mede o MESMO. Antes desta
 * correção a secção tem duas colunas, e os cartões formam duas linhas e duas colunas — o defeito,
 * medido.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-o-painel-empilhado.js
 *   node experimentos/provar-o-painel-empilhado.js --contra=a61d4ddb
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');

const PROFS = [{ nome: 'Demi Plié', slug: 'demi-plie' }];
const ALUNAS = [{ id: 'a', apelido: 'Aluna A' }, { id: 'b', apelido: 'Aluna B' }];
const TURMAS = [{
  id: 'rosa', nome: 'Rosa', modalidade: 'Balé clássico', dias: ['seg', 'qua', 'sex'],
  horarios: { seg: '16:30' }, duracaoMin: 120,
  periodoInicio: '2026-12-14', periodoFim: '2027-01-15',
}];
const LINHAS = [{
  id: 'tami', nome: 'Tami', professor: 'demi-plie', alunas: ['Aluna A', 'Aluna B'],
  atualizada_em: '2026-11-22T11:49:02.524Z',
}];
const MATRICULAS = [{ aluna: 'Aluna A', modalidade: 'Balé clássico', professor: 'demi-plie' }];

const A_ORDEM = ['(identidade)', 'As salas', 'Os elencos', 'As modalidades'];

/** A página com o painel, montada pelo motor do commit pedido. */
async function paginaDe(motorRaiz) {
  const b = require(path.join(motorRaiz, 'motor/servidor/bastidores.js'));
  const painel = await b.painelDoEstudio({
    env: {}, escola: 'breu', aluns: ALUNAS, profs: PROFS, dono: 'Demi Plié', trms: TURMAS,
    linhas: LINHAS, matriculasDaEscola: MATRICULAS,
    dadosDaEscola: { cadastro: { escolaNome: 'Breu' } },
  });
  return b.paginaProducao('breu', { professor: 'demi-plie', ciclo: '01', query: '' }, PROFS, ALUNAS,
    'Demi Plié', 'demi-plie', TURMAS, [], [], [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, '', LINHAS, new Set(),
    { cadastro: { escolaNome: 'Breu' } }, MATRICULAS, null, [], painel);
}

function servir(motorRaiz, html) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(motorRaiz, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('text/javascript', fs.readFileSync(path.join(motorRaiz, 'tools/templates/nav.js')));
    }
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/** Onde cada cartão cai, e quantas colunas a secção declara. */
function ler(pg) {
  return pg.evaluate(() => {
    const sec = document.getElementById('sec-painel');
    const r = (e) => e.getBoundingClientRect();
    const cartoes = [...sec.querySelectorAll(':scope > .caixa')];
    return {
      colunas: getComputedStyle(sec).gridTemplateColumns.split(' ').filter(Boolean).length,
      declarado: getComputedStyle(sec).gridTemplateColumns,
      larguraDaSecao: Math.round(r(sec).width),
      cartoes: cartoes.map((c) => ({
        nome: (c.querySelector('h3') || {}).textContent || '(identidade)',
        esquerda: Math.round(r(c).left),
        topo: Math.round(r(c).top),
        largura: Math.round(r(c).width),
      })),
    };
  });
}

const TELAS = [
  { w: 1440, h: 900 },
  { w: 1280, h: 800 },
  { w: 1024, h: 700 },
  { w: 390, h: 800 },
];

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-o-painel-empilhado: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-o-painel-empilhado: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  const contra = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
  let motorRaiz = raiz;
  if (contra) {
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'empilhado-'));
    execSync('git archive ' + contra + ' motor tools biblioteca modelo porta | tar -x -C ' + destino,
      { cwd: raiz, stdio: 'pipe' });
    motorRaiz = destino;
  }

  const { srv, base } = await servir(motorRaiz, await paginaDe(motorRaiz));
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();
  let total = 0;
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    total += 1;
    if (!cond) falhas += 1;
    console.log((cond ? '  ok    ' : '  FALHA ') + nome
      + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 220) : ''));
  };

  for (const t of TELAS) {
    await pg.setViewport({ width: t.w, height: t.h });
    await pg.goto(base + '/bastidores/estudio', { waitUntil: 'load' });
    // só a secção do painel: as outras são formulários longos e não interessam a esta medida
    await pg.evaluate(() => {
      const c = document.getElementById('conteudo');
      if (c) c.hidden = false;
      for (const s of document.querySelectorAll('.secao')) s.hidden = s.id !== 'sec-painel';
    });
    await new Promise((r) => setTimeout(r, 160));

    console.log('\n' + t.w + '×' + t.h);
    const d = await ler(pg);

    provar('a secção tem UMA coluna (o defeito eram duas)',
      d.colunas === 1, d.declarado);
    provar('os quatro blocos estão, e pela ordem da leitura',
      d.cartoes.map((c) => c.nome).join(' | ') === A_ORDEM.join(' | '),
      d.cartoes.map((c) => c.nome));
    provar('todos começam na MESMA borda esquerda (um sob o outro, não lado a lado)',
      new Set(d.cartoes.map((c) => c.esquerda)).size === 1,
      d.cartoes.map((c) => c.esquerda));
    provar('todos ocupam a LARGURA da secção (nenhum encolhido numa coluna)',
      d.cartoes.every((c) => Math.abs(c.largura - d.larguraDaSecao) <= 1),
      { largura: d.cartoes.map((c) => c.largura), secao: d.larguraDaSecao });
    provar('o topo cresce bloco a bloco (nada a partilhar a linha)',
      d.cartoes.every((c, i) => i === 0 || c.topo > d.cartoes[i - 1].topo),
      d.cartoes.map((c) => c.topo));
  }

  await br.close();
  srv.close();
  if (motorRaiz !== raiz) fs.rmSync(motorRaiz, { recursive: true, force: true });

  console.log('');
  if (falhas) {
    console.log((contra ? 'CONTROLE: ' : '') + 'FALHARAM ' + falhas + ' de ' + total + ' asserções.');
    process.exit(1);
  }
  console.log((contra ? 'CONTROLE CONFORME — ' : 'TUDO CERTO — ') + total + ' asserções: o painel inicial '
    + 'empilha os seus quatro blocos numa coluna, com a largura da página, pela ordem da leitura — '
    + 'a arrumação da bancada que ela aprovou.');
})();
