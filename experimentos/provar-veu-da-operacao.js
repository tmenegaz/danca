#!/usr/bin/env node
'use strict';

/*
 * provar-veu-da-operacao.js — O VÉU COBRE, TRANCA, DIZ O PASSO E SAI (10/11/2026).
 *
 * O QUE MOTIVOU, na letra dela: «continuo podendo clicar aí para onde eu quiser, fazer o que eu
 * quiser, e aí quando dá errado o processo não tem nenhuma flag ali que diga, ó, está em ajuste,
 * vai para tal lugar. O usuário fica sem nenhum feedback.»
 *
 * O VÉU JÁ EXISTIA — na PORTA (plano de ensino, plano de observação, anamnese), desde 08/11. Não
 * existia nos BASTIDORES, que é onde ela trabalha: Turmas, Salas, Elencos, Professores. Um gesto
 * destes escreve no repositório e manda correr a cadeia; um segundo clique durante o primeiro põe
 * duas escritas a competir pelo mesmo `main` — foi o defeito de 08/11, com o `-po.md` a apontar um
 * PO e o `-dados.json` a descrever outro.
 *
 * O QUE ESTA PROVA MEDE, no navegador, sobre a página de verdade:
 *
 *   A. EM REPOUSO o véu está escondido (é estado, `data-ocupado`, e não classe).
 *   B. A LIGAÇÃO DO PACOTE traz a turma (`data-fechar`) e o rótulo «abrir» — é por ela que a
 *      geração se executa onde vive, em vez de abrir a porta sem documento para carregar.
 *   C. DURANTE o pedido: o véu está de pé, diz o que está a acontecer, e TUDO o que está por
 *      baixo fica `inert` — o clique não chega, e o teclado também não.
 *   D. NO FIM o véu sai, a página volta a responder, o resultado fica na caixa do gesto, e o
 *      pedido foi feito UMA vez.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `motor/` de `REF_NEGATIVO` (por omissão
 * `HEAD`, que não tem o véu nos Bastidores) e corre as mesmas provas. Sem véu, A e C falham — se
 * passassem, a prova não provava nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-veu-da-operacao.js
 *   REF_NEGATIVO=HEAD node experimentos/provar-veu-da-operacao.js --controle-negativo
 */

/* Conferência de bancada (não versionada): o véu aparece, tranca, e sai. */
const fs = require('fs');
const http = require('http');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const negativo = process.argv.indexOf('--controle-negativo') !== -1;
let motor = path.join(RAIZ, 'motor');
if (negativo) {
  const ref = process.env.REF_NEGATIVO || 'HEAD';
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'veu-negativo-'));
  execSync('git archive ' + ref + ' motor modelo porta biblioteca tools teste | tar -x -C '
    + JSON.stringify(destino), { cwd: RAIZ, stdio: 'pipe' });
  fs.symlinkSync(path.join(RAIZ, 'node_modules'), path.join(destino, 'node_modules'), 'dir');
  motor = path.join(destino, 'motor');
  console.log('CONTROLE NEGATIVO contra ' + ref + '\n');
}
const b = require(path.join(motor, 'servidor/bastidores.js'));
const html = b.paginaProducao('calango',
  { professor: 'pe-torto', escola: 'calango', query: 'professor=pe-torto&escola=calango' },
  [{ nome: 'Redinha Rosa', slug: 'redinha-rosa' }], [], 'Pe Torto', 'pe-torto',
  [], [], [], [], [], []);

const MD = JSON.stringify({
  ok: true,
  cadeia: {
    executada: true, ok: true, completa: true, porOrcamento: false, faltam: [],
    fecharam: ['Vínculos e etiquetas', 'Plano de ensino', 'Plano de observação',
      'Documentos gerados (HTML e PDF)'],
    restam: [], alvos: [{ turma: 'Rosa', ok: true, etapas: [] }],
    recado: 'a cadeia fechou.',
  },
});
let pedidos = 0;

const srv = http.createServer((req, res) => {
  const caminho = decodeURIComponent(req.url).split('?')[0];
  const ok = (tipo, corpo) => {
    res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
    res.end(corpo);
  };
  if (caminho.endsWith('/assets/style.css')) {
    return ok('text/css; charset=utf-8', fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')));
  }
  if (caminho.endsWith('/assets/nav.js')) {
    return ok('text/javascript', fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
  }
  if (caminho.endsWith('/assets/favicon.svg')) return ok('image/svg+xml', '<svg/>');
  if (caminho === '/api/bastidores/cadeia-pacote') {
    pedidos += 1;
    // DEMORA DE PROPÓSITO: é durante ela que o véu tem de estar de pé.
    return setTimeout(() => ok('application/json', MD), 700);
  }
  if (caminho.indexOf('/api/bastidores') === 0) return ok('application/json', '{"ok":true}');
  return ok('text/html; charset=utf-8', html);
});

(async () => {
  let executavel = null;
  for (const c of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (fs.existsSync(c)) { executavel = c; break; }
  }
  if (!executavel) { console.log('sem Chrome — NÃO FEITO'); process.exit(1); }
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  const puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));

  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const nav = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const p = await nav.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0', timeout: 60000 });

  let ok = 0, ko = 0;
  const provar = (t, c, d) => { if (c) { ok++; console.log('  ok    ' + t); } else { ko++; console.log('  FALHOU ' + t + (d === undefined ? '' : ' → ' + JSON.stringify(d))); } };

  // uma caixa de recado e uma ligação do pacote, como `pintarCadeia` as constrói
  await p.evaluate(() => {
    const caixa = document.createElement('p');
    caixa.id = 'prova-res'; caixa.className = 'res'; caixa.setAttribute('data-res', 'prova');
    document.body.appendChild(caixa);
    window.pintarCadeia({
      executada: true, ok: false, porOrcamento: false,
      faltam: [{ turma: 'Rosa', chave: 'pacote', rotulo: 'Documentos gerados (HTML e PDF)',
        estado: 'pendente', falta: 'os documentos são os de antes da mudança', href: '#turmas' }],
      alvos: [{ turma: 'Rosa', ok: false, etapas: [] }],
      recado: 'a cadeia avançou até «Plano de observação».',
    }, caixa, true);
  });

  const antes = await p.evaluate(() => {
    const v = document.getElementById('veu');
    if (!v) return { existe: false };
    return { existe: true, ocupado: v.dataset.ocupado || null, display: getComputedStyle(v).display };
  });
  provar('o véu existe e está escondido em repouso',
    antes.existe === true && antes.ocupado === null && antes.display === 'none', antes);

  const ligacao = await p.evaluate(() => {
    const a = document.querySelector('#prova-res a[data-fechar]');
    return a ? { turma: a.getAttribute('data-fechar'), texto: a.textContent } : null;
  });
  provar('a ligação do pacote traz a turma e o rótulo «abrir»',
    Boolean(ligacao) && ligacao.turma === 'Rosa' && ligacao.texto === 'abrir', ligacao);

  await p.evaluate(() => {
    const a = document.querySelector('#prova-res a[data-fechar]');
    if (a) a.click();
  });
  await new Promise((r) => setTimeout(r, 250));
  const durante = await p.evaluate(() => {
    const v = document.getElementById('veu');
    const filhos = [...document.body.children].filter((x) => x.id !== 'veu');
    return {
      existe: Boolean(v),
      ocupado: v ? (v.dataset.ocupado || null) : null,
      display: v ? getComputedStyle(v).display : null,
      texto: (document.getElementById('veu-texto') || {}).textContent,
      cobertos: filhos.length,
      trancados: filhos.filter((x) => x.inert).length,
    };
  });
  provar('durante o pedido o véu está de pé',
    durante.existe === true && durante.ocupado === 'sim' && durante.display === 'flex', durante);
  provar('…e diz o que está a acontecer', /gerar os documentos de «Rosa»/.test(String(durante.texto)), durante.texto);
  provar('…e a página por baixo fica INERT (o clique não chega)',
    durante.trancados === durante.cobertos && durante.cobertos > 0, durante);

  await new Promise((r) => setTimeout(r, 1200));
  const depois = await p.evaluate(() => {
    const v = document.getElementById('veu');
    const filhos = [...document.body.children].filter((x) => x.id !== 'veu');
    return {
      existe: Boolean(v),
      ocupado: v ? (v.dataset.ocupado || null) : null,
      display: v ? getComputedStyle(v).display : null,
      trancados: filhos.filter((x) => x.inert).length,
      caixa: (function(){ var r = alvoDoRecado(); return r ? r.textContent : ''; })(),
    };
  });
  provar('no fim o véu sai', depois.existe === true && depois.ocupado === null
    && depois.display === 'none', depois);
  provar('…e a página volta a responder', depois.trancados === 0, depois);
  provar('…e o resultado fica na caixa do gesto', /a cadeia fechou/.test(depois.caixa), depois.caixa.slice(-160));
  provar('…e o pedido foi feito UMA vez', pedidos === 1, pedidos);

  await nav.close();
  srv.close();
  console.log('\n' + (ko ? 'FALHARAM ' + ko + ' de ' + (ok + ko) : 'TUDO CERTO — ' + ok
    + ' asserções: o véu cobre, tranca, diz o passo e sai.'));
  if (negativo) {
    // No controle negativo, falhar É o resultado certo.
    if (ko === 0) { console.log('A PROVA NÃO PROVA NADA: o motor de antes passou tudo.'); process.exit(1); }
    console.log('Como esperado: o motor de antes reprova ' + ko + ' de ' + (ok + ko) + '.');
    process.exit(0);
  }
  process.exit(ko ? 1 : 0);
})();
