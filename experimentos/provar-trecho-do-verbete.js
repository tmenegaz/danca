#!/usr/bin/env node
'use strict';

/**
 * provar-trecho-do-verbete.js — os passos do TRECHO só abrem dentro de um trecho.
 *
 * O QUE ELA RELATOU (15/11/2026), na letra dela:
 *
 *   «eu fui em estilo para fazer uma edição. Quando eu cliquei em editar, eu consegui alterar o
 *   step quatro sem passar pelo editar da composição que fica no step seis. Então isso tem que ser
 *   corrigido. Eu só posso editar os itens que pertencem ao que está na composição pelo editar do
 *   item da composição.»
 *
 * O QUE ESTAVA A ACONTECER. Os passos 4 (a contagem) e 5 (os sinais) são os campos de UM trecho da
 * decomposição. A tira abria-os sempre que os passos anteriores estivessem cumpridos, e eles ficavam
 * a um clique de qualquer pessoa que abrisse um verbete pela listagem — sem que houvesse trecho
 * nenhum a compor. Escrever ali era escrever num sítio que, ao guardar, ou caía num trecho que já
 * existia (outro), ou não ia a lado nenhum.
 *
 * A REGRA DE AGORA. Um trecho é um GESTO com dois nomes: «Acrescentar trecho» (um novo) e «Editar»
 * de uma linha da tabela (aquele). Fora de um gesto, o 4 e o 5 não abrem — e o `title` do botão diz
 * porque: a decomposição é o passo 6, e é lá que o gesto nasce.
 *
 * O CÍRCULO QUE ISSO ABRIU, e que também se mede aqui: o botão que abre o gesto vive no passo 6, e
 * o 6 exigia os passos 4 e 5 cumpridos. Com o 4 e o 5 fechados, ninguém chegava ao 6 — e o
 * formulário ficava sem porta. Por isso `faltasAntesDe` deixou de contar os passos do trecho a quem
 * não está a compor: sem gesto não há contagem nem sinais a exigir.
 *
 * O QUE SE MEDE, num navegador e por GEOMETRIA/ESTADO (um `disabled` no HTML não prova nada):
 *
 *   A. ABRIR UM VERBETE NÃO ABRE O TRECHO — com o verbete aberto pela listagem e os passos 1 a 3
 *      cumpridos, o 4 e o 5 estão DESLIGADOS, com a frase que diz porquê, e o 6 está LIGADO (é a
 *      porta do gesto).
 *   B. O GESTO ABRE OS PASSOS — «Acrescentar trecho» leva ao 4, liga o 4 e o 5, troca o botão para
 *      «Guardar o trecho» e o aviso para «A compor».
 *   C. GUARDAR FECHA O GESTO E VOLTA À DECOMPOSIÇÃO — a linha nova fica na tabela, os passos 4 e 5
 *      voltam a fechar, e a tela não fica num painel apagado.
 *   D. «EDITAR» DE UMA LINHA É O OUTRO CAMINHO — abre o gesto SEM mudar de passo (a decisão de
 *      02/11/2026), e «Cancelar» fecha-o e deixa a tela na decomposição.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `motor/` de `HEAD` e corre as MESMAS provas. Na
 * página de antes o 4 abre com um clique e sem gesto: se as provas passassem, não provavam nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-trecho-do-verbete.js
 *   node experimentos/provar-trecho-do-verbete.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
let MOTOR = path.join(RAIZ, 'motor');
const NEGATIVO = process.argv.includes('--controle-negativo');

if (NEGATIVO) {
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'motor-trecho-'));
  /* As pastas que os `require` do motor alcançam: o motor, o catálogo, a folha, os cenários de
   * teste, o esquema do ciclo e o conteúdo da porta. */
  execSync('git archive HEAD motor biblioteca tools teste modelo porta | tar -x -C ' + destino,
    { cwd: RAIZ, stdio: 'pipe' });
  MOTOR = path.join(destino, 'motor');
  console.log('CONTROLE NEGATIVO — o motor de HEAD (antes do gesto do trecho)\n');
}

const bastidores = require(path.join(MOTOR, 'servidor/bastidores.js'));

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* O ALFABETO DA BANCADA — um exercício que já existe, e nenhum verbete gravado. É o caso dela:
 * abrir pela listagem um verbete que ainda não tem decomposição. */
const ALFABETO = {
  ok: true,
  versao: 5,
  exercicios: [{ nome: 'Plié', categoria: 'passo', temConteudo: true }],
  verbetes: { 'Plié': { '8|2/4': { metodo: '', posicao: '', trechos: [] } } },
  exerciciosDoVocabulario: [{ termo: 'Plié', categoria: 'passo', tradicao: 'RAD' }],
  posicoes: [],
  direcoes: [{ termo: 'devant', nome: 'à frente', glifo: '+' }],
  orientacoes: [{ termo: 'en-face', nome: 'de frente', tradicao: 'en face', glifo: 'en-face' }],
  categoriasDeBloco: ['Pé'],
  descricoes: {},
  sinais: [{ sinal: '→', nome: 'conduz a', grupo: 'Movimento' }],
};

function servir(html) {
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
    // Servido pelo Worker ao vivo; aqui vazio, para o `<script>` não engolir a página.
    if (caminho.endsWith('/scripts/teste-preenchimento.js')) return ok('text/javascript', '');
    if (caminho === '/api/bastidores/verbete') return ok('application/json', JSON.stringify(ALFABETO));
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({
    srv, base: 'http://127.0.0.1:' + srv.address().port,
  })));
}

(async () => {
  const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
  const html = bastidores.paginaProducao('batata', { escola: 'batata', professor: 'lapis-rosa', ciclo: '01', query: '' },
    [{ nome: 'Lápis Rosa', slug: 'lapis-rosa' }], ['Aluna Um'], 'Tiago', 'tiago',
    [], [], {}, [], [], [], usos, { modo: 'clara', paleta: 'bordo' }, '', [], new Set());

  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-trecho-do-verbete: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  const puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));

  const { srv, base } = await servir(html);
  const browser = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));

  const estado = () => page.evaluate(() => {
    const botao = (n) => document.querySelector('#vb-tira button.passo[data-passo="' + n + '"]');
    const painel = (n) => document.querySelector('#form-verbete .passo-painel[data-passo="' + n + '"]');
    const visivel = (e) => Boolean(e) && !e.hidden && getComputedStyle(e).display !== 'none';
    const daTira = (n) => {
      const b = botao(n);
      return b ? { disabled: b.disabled, titulo: b.getAttribute('title') || '' } : null;
    };
    const aviso = document.getElementById('vb-edicao');
    const guardar = document.getElementById('vb-cel-guardar');
    const acrescentar = document.getElementById('vb-cel-acrescentar');
    return {
      passo: window.PASSO,
      tira: { 4: daTira(4), 5: daTira(5), 6: daTira(6) },
      podeIr6: typeof podeIrParaVerbete === 'function' ? podeIrParaVerbete(6) : null,
      emEdicao: Boolean(window.EM_EDICAO),
      trechoNovo: Boolean(window.TRECHO_NOVO),
      gesto: typeof trechoEmCurso === 'function' ? trechoEmCurso() : null,
      painel: [1, 2, 3, 4, 5, 6].filter((n) => visivel(painel(n))),
      aviso: { visivel: Boolean(aviso) && !aviso.hidden, rotulo: (document.getElementById('vb-edicao-rotulo') || {}).textContent, qual: (document.getElementById('vb-edicao-n') || {}).textContent },
      guardar: guardar ? { visivel: !guardar.hidden, rotulo: guardar.textContent } : null,
      acrescentar: acrescentar ? { visivel: !acrescentar.hidden } : null,
      linhas: document.querySelectorAll('#vb-tabela tr[data-linha], #vb-tabela tbody tr').length,
      celulas: typeof CELULAS === 'object' && CELULAS ? Object.keys(CELULAS).length : null,
      editar: Boolean(document.querySelector('#vb-tabela button[data-editar]')),
    };
  });

  const dispara = (id, tipo) => page.evaluate((i, t) => {
    const el = document.getElementById(i);
    if (el) el.dispatchEvent(new Event(t, { bubbles: true }));
  }, id, tipo);

  try {
    await page.setViewport({ width: 1280, height: 950 });
    await page.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      if (typeof abrirSessao === 'function') abrirSessao('token-de-prova');
      location.hash = '#verbetes';
      if (typeof mostrarSecao === 'function') mostrarSecao();
    });
    await new Promise((r) => setTimeout(r, 600));

    /* O VERBETE, PREPARADO COMO ELA O PREPARA: escolhe o exercício, diz os tempos e o compasso,
     * e escreve a frase. É o que os passos 1 a 3 pedem — e o que os passos do trecho NÃO pedem. */
    await page.evaluate(() => {
      const vn = document.getElementById('vbnome');
      if (vn) { vn.value = 'Plié'; }
    });
    await dispara('vbnome', 'change');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      if (t) { t.value = '8'; }
      const c = document.getElementById('vbcompasso');
      if (c) { c.value = '2/4'; }
      const p1 = document.getElementById('vnnome');
      if (p1) { p1.value = 'Plié'; }
      const cat = document.getElementById('vncategoria');
      if (cat) { cat.value = 'passo'; }
      const tra = document.getElementById('vntradicao');
      if (tra) { tra.value = 'RAD'; }
      const fr = document.getElementById('vb-frase');
      if (fr) { fr.value = 'Flexão e extensão dos joelhos, com os quadris abertos.'; }
    });
    await dispara('vbtempos', 'input');
    await dispara('vbcompasso', 'change');
    await dispara('vncategoria', 'change');
    await dispara('vntradicao', 'change');
    await dispara('vb-frase', 'input');
    await page.evaluate(() => { if (typeof pintarPassos === 'function') pintarPassos(); });
    await new Promise((r) => setTimeout(r, 300));

    console.log('\nA. ABRIR UM VERBETE NÃO ABRE O TRECHO');
    const abertura = await estado();
    checar('o passo 4 está DESLIGADO sem gesto nenhum', abertura.tira[4] && abertura.tira[4].disabled === true, abertura.tira[4]);
    checar('…e o 5 também', abertura.tira[5] && abertura.tira[5].disabled === true, abertura.tira[5]);
    checar('…e o título diz que o trecho se compõe na decomposição',
      /passo 6/.test(String(abertura.tira[4] && abertura.tira[4].titulo)), abertura.tira[4]);
    checar('o passo 6 está LIGADO — é a porta do gesto', abertura.tira[6] && abertura.tira[6].disabled === false, abertura.tira[6]);
    checar('…e a conta concorda: dá para ir ao 6 sem tocar no 4 nem no 5', abertura.podeIr6 === true, abertura.podeIr6);

    console.log('\nB. O GESTO ABRE OS PASSOS — «Acrescentar trecho»');
    await page.evaluate(() => { irParaPassoVerbete(6); });
    await new Promise((r) => setTimeout(r, 250));
    await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 400));
    const gesto = await estado();
    checar('o gesto abriu (é um trecho NOVO)', gesto.trechoNovo === true && gesto.emEdicao === false, gesto);
    checar('…e levou ao passo 4, que é onde o trecho se escreve', gesto.passo === 4 && gesto.painel.length === 1 && gesto.painel[0] === 4, gesto.painel);
    checar('…e o 4 e o 5 estão LIGADOS dentro do gesto',
      gesto.tira[4].disabled === false && gesto.tira[5].disabled === false, gesto.tira);
    checar('…e o aviso diz «A compor»', gesto.aviso.visivel === true && gesto.aviso.rotulo === 'A compor', gesto.aviso);
    checar('…e o botão virou «Guardar o trecho»', gesto.guardar && gesto.guardar.visivel === true && /Guardar o trecho/.test(gesto.guardar.rotulo), gesto.guardar);
    checar('…e o «Acrescentar» saiu de cena', gesto.acrescentar && gesto.acrescentar.visivel === false, gesto.acrescentar);

    console.log('\nC. GUARDAR FECHA O GESTO E VOLTA À DECOMPOSIÇÃO');
    await page.evaluate(() => {
      window.CONTAGEM = '1-2';
      window.SINAIS = [{ sinal: '→', nome: 'conduz a', grupo: 'Movimento' }];
    });
    await dispara('vb-repeticoes', 'change');
    // O «Guardar» vive no painel do 6, e estamos no 4: um `page.click` não o alcança (o painel
    // está escondido). O clique é o MESMO evento — só não passa pela geometria.
    await page.evaluate(() => { document.getElementById('vb-cel-guardar').click(); });
    await new Promise((r) => setTimeout(r, 500));
    const guardado = await estado();
    checar('o trecho entrou na decomposição', guardado.celulas !== null && guardado.celulas > 0, guardado.celulas);
    checar('o gesto fechou', guardado.gesto === false && guardado.trechoNovo === false, guardado);
    checar('…e a tela voltou à decomposição (passo 6), e não ficou num painel apagado',
      guardado.passo === 6 && guardado.painel.length === 1 && guardado.painel[0] === 6, guardado.painel);
    checar('…e o 4 e o 5 fecharam outra vez',
      guardado.tira[4].disabled === true && guardado.tira[5].disabled === true, guardado.tira);
    checar('…e o «Acrescentar» voltou', guardado.acrescentar && guardado.acrescentar.visivel === true, guardado.acrescentar);
    checar('a linha nova está na tabela, com o «Editar» dela', guardado.linhas > 0 && guardado.editar === true, { linhas: guardado.linhas, editar: guardado.editar });

    console.log('\nD. «EDITAR» DE UMA LINHA — o outro caminho para o gesto');
    await page.evaluate(() => {
      const b = document.querySelector('#vb-tabela button[data-editar]');
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const naEdicao = await estado();
    checar('o «Editar» da linha abre o gesto, e é o de EDIÇÃO',
      naEdicao.emEdicao === true && naEdicao.trechoNovo === false && naEdicao.gesto === true, naEdicao);
    checar('…sem mudar de passo — a correcção não salta para o 4 (decisão de 02/11/2026)',
      naEdicao.passo === 6, naEdicao.passo);
    checar('…e os passos do trecho ficam LIGADOS, porque há um trecho em curso',
      naEdicao.tira[4].disabled === false && naEdicao.tira[5].disabled === false, naEdicao.tira);
    checar('…e o aviso diz «Em edição», com o número do trecho',
      naEdicao.aviso.rotulo === 'Em edição' && /^\d+$/.test(String(naEdicao.aviso.qual)), naEdicao.aviso);

    await page.evaluate(() => {
      const b = document.getElementById('vb-cancelar-edicao-2');
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const cancelado = await estado();
    checar('«Cancelar» fecha o gesto', cancelado.gesto === false && cancelado.emEdicao === false, cancelado);
    checar('…e devolve à decomposição', cancelado.passo === 6, cancelado.passo);
    checar('…e o 4 e o 5 voltam a fechar', cancelado.tira[4].disabled === true && cancelado.tira[5].disabled === true, cancelado.tira);
    checar('nenhum erro de script na página', erros.length === 0, erros);
  } finally {
    await browser.close();
    srv.close();
  }

  console.log('\n' + (falhas ? '✗ ' + falhas + ' de ' + total + ' reprovaram' : '✓ ' + total + ' de ' + total));
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.error('provar-trecho-do-verbete rebentou:', e && e.stack ? e.stack : e);
  process.exit(1);
});
