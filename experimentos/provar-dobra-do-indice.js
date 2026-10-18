#!/usr/bin/env node
'use strict';

/**
 * provar-dobra-do-indice.js — o índice da página recolhe no celular, e só lá.
 *
 * Por que existe (18/10/2026). O bloco «Nesta página» é uma COLUNA congelada à direita a
 * partir de 1200px — e abaixo disso ele é um bloco no TOPO do texto. Num telefone isso é
 * rolagem antes de se chegar ao conteúdo: o índice de um documento tem 15, 20, 30 linhas.
 * O pedido: um controle que encolha o bloco até o título, e que o devolva inteiro a quem
 * o quiser. «Só vai existir no display de celular» — e o critério é o MESMO do layout, a
 * largura, não o tamanho do aparelho.
 *
 * O QUE NÃO SE PROVA NO HTML: que o bloco ENCOLHE. Um `<button>` no texto da página não
 * prova que a lista sai da tela, nem que o bloco fica menor, nem que o estado é lembrado.
 * Mede-se a GEOMETRIA (a altura do bloco), o ESTADO (`data-recolhido`, `aria-expanded`,
 * o glifo) e a PRESENÇA (`display` da lista).
 *
 * O que se prova:
 *
 *   1. com JavaScript e no celular: o botão existe, está visível, e o bloco NASCE
 *      recolhido — é o que devolve a rolagem;
 *   2. recolhido, a lista não é renderizada e o bloco fica MUITO menor (medido, não
 *      estimado);
 *   3. um toque expande: a lista volta, `aria-expanded` vira `true`, o glifo muda;
 *   4. o estado é LEMBRADO ao recarregar e ao trocar de página (é a mesma sessão);
 *   5. em tela larga (>= 1200px) NÃO HÁ BOTÃO e o índice NUNCA se fecha — nem quando a
 *      memória da sessão diz «fechado»: ali a coluna É a navegação;
 *   6. sem JavaScript não há botão nenhum — nada morto na tela, e o índice fica inteiro,
 *      como sempre esteve;
 *   7. na porta o mesmo controle serve ao «Roteiro», com o alvo e o rótulo certos — o
 *      rótulo sai da `aria-label` do bloco, não de uma palavra escrita à mão;
 *   8. no papel o índice sai INTEIRO e o botão não se imprime;
 *   9. em nenhuma largura a página estoura na horizontal.
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-dobra-do-indice.js
 */

const path = require('path');
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');

let puppeteer;
try {
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
} catch {
  console.error('provar-dobra-do-indice: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
  process.exit(1);
}
const executavel = process.env.CHROME_PATH
  || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
if (!executavel) {
  console.error('provar-dobra-do-indice: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
  process.exit(1);
}

const PACOTE = 'professores/tiago-menegaz/ciclos/ciclo-01-fita';

/**
 * SERVIDOR ESTÁTICO que reproduz o PACOTE. Não `file://`: a porta pede `/assets/style.css`
 * e `/assets/nav.js`, caminhos de raiz, e em `file://` isso resolve para lugar nenhum — a
 * página abriria SEM folha e SEM script, e a prova mediria um índice que não recolhe por
 * não haver componente nenhum. É o mesmo cuidado (e o mesmo motivo) do `provar-celular`.
 *
 * `assets/style.css` e `assets/nav.js` apontam SEMPRE para a FONTE, qualquer que seja o
 * caminho de onde o navegador os peça (`/assets/…` na porta, `…/ciclo-01-fita/assets/…`
 * no pacote): é o arquivo que o gerador copia, e é o que se quer medir. A cópia do pacote
 * é conferida pelo `check-identidade.js` («Circuito») — e a primeira versão desta prova
 * servia a cópia sem o saber, medindo a versão ANTERIOR do CSS e reprovando um `@media
 * print` que já estava certo. Prova que mede o artefato errado reprova pelo motivo errado.
 */
const MAPA = { 'assets/style.css': 'tools/templates/ciclo.css', 'assets/nav.js': 'tools/templates/nav.js' };
function servir() {
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const assets = rel.match(/(?:^|\/)assets\/(style\.css|nav\.js)$/);
    const tentativas = [assets ? MAPA['assets/' + assets[1]] : MAPA[rel], rel, path.join(PACOTE, rel), path.join('porta', rel)].filter(Boolean);
    const alvo = tentativas.map((x) => path.join(raiz, x))
      .find((x) => x.startsWith(raiz) && fs.existsSync(x) && !fs.statSync(x).isDirectory());
    if (!alvo) { res.writeHead(404); res.end('nao encontrado'); return; }
    const tipo = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' }[path.extname(alvo)]
      || 'application/octet-stream';
    res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
    res.end(fs.readFileSync(alvo));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/** A leitura do bloco. Uma função só, para todas as medidas serem a mesma. */
const MEDIR = () => {
  const bloco = document.querySelector('.toc-local');
  if (!bloco) return { temBloco: false };
  const botao = bloco.querySelector('.toc-dobra');
  const lista = bloco.querySelector('ul, ol');
  const visivel = (e) => Boolean(e) && getComputedStyle(e).display !== 'none'
    && e.getBoundingClientRect().height > 0;
  const sinal = botao ? botao.querySelector('.toc-dobra-sinal') : null;
  return {
    temBloco: true,
    temBotao: Boolean(botao),
    botaoVisivel: visivel(botao),
    listaVisivel: visivel(lista),
    recolhido: bloco.getAttribute('data-recolhido'),
    altura: Math.round(bloco.getBoundingClientRect().height),
    expandido: botao ? botao.getAttribute('aria-expanded') : null,
    rotulo: botao ? botao.getAttribute('aria-label') : null,
    alvo: botao ? botao.getAttribute('aria-controls') : null,
    alvoExiste: botao ? Boolean(document.getElementById(botao.getAttribute('aria-controls'))) : false,
    glifo: sinal ? sinal.textContent : null,
    memorizado: (() => { try { return sessionStorage.getItem('ciclo:indice'); } catch (e) { return null; } })(),
    estouro: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
};

(async () => {
  const { srv, base } = await servir();
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    if (!cond) falhas++;
    console.log((cond ? 'ok     ' : 'FALHA  ') + nome + (extra !== undefined ? ' → ' + JSON.stringify(extra) : ''));
  };

  const DOC = `${base}/${PACOTE}/index.html`;
  const outraPagina = `${base}/porta/index.html`;

  // ---- 1 e 2: no celular o bloco NASCE recolhido, e o ganho é medido ----
  await pg.setViewport({ width: 390, height: 844 });
  await pg.goto(DOC, { waitUntil: 'load' });
  const fechado = await pg.evaluate(MEDIR);
  provar('no celular o bloco do índice tem o botão da dobra, e ele está visível',
    fechado.temBotao && fechado.botaoVisivel, fechado);
  provar('…e o índice NASCE recolhido (é o que devolve a rolagem)',
    fechado.recolhido === 'sim' && fechado.listaVisivel === false && fechado.expandido === 'false',
    fechado);
  provar('…apontando para a lista que ele governa, por id',
    fechado.alvoExiste === true && fechado.alvo === 'toc-corpo-0', fechado);

  // O GANHO, medido. Sem ele a prova seria uma opinião sobre o CSS.
  await pg.evaluate(() => { document.querySelector('.toc-dobra').click(); });
  const aberto = await pg.evaluate(MEDIR);
  provar('um toque expande: a lista volta, o estado e o glifo acompanham',
    aberto.recolhido === 'nao' && aberto.listaVisivel === true && aberto.expandido === 'true'
    && aberto.glifo === '\u25BE' && fechado.glifo === '\u25B8', { fechado, aberto });
  provar('o bloco recolhido é MUITO menor que o aberto (medido, não estimado)',
    fechado.altura > 0 && aberto.altura > fechado.altura * 3,
    { recolhido: fechado.altura, aberto: aberto.altura });

  // ---- 4: lembrado ao recarregar e ao trocar de página ----
  await pg.goto(DOC, { waitUntil: 'load' });
  const recarregado = await pg.evaluate(MEDIR);
  provar('o estado é lembrado ao recarregar (o que a pessoa fez não se desfaz sozinho)',
    recarregado.recolhido === 'nao' && recarregado.memorizado === 'aberto', recarregado);

  await pg.goto(outraPagina, { waitUntil: 'load' });
  const naPorta = await pg.evaluate(MEDIR);
  provar('…e vale na página seguinte, no MESMO bloco de outra tela (o Roteiro da porta)',
    naPorta.temBotao && naPorta.recolhido === 'nao' && naPorta.memorizado === 'aberto', naPorta);
  provar('o rótulo do botão sai da `aria-label` do bloco, e nomeia o ROTEIRO — não uma palavra fixa',
    naPorta.rotulo === 'Recolher roteiro da elicitação' && naPorta.alvo === 'roteiro', naPorta);

  // Fecha outra vez, para o estado «fechado» também ser lembrado.
  await pg.goto(DOC, { waitUntil: 'load' });
  await pg.evaluate(() => { document.querySelector('.toc-dobra').click(); });
  const fechou = await pg.evaluate(MEDIR);
  provar('o segundo toque recolhe outra vez, e a memória diz «fechado»',
    fechou.recolhido === 'sim' && fechou.listaVisivel === false && fechou.memorizado === 'fechado', fechou);

  // ---- 5: em tela larga não há botão, e o índice nunca se fecha ----
  //
  // A memória diz «fechado» de propósito: em tela larga o estado guardado é IGNORADO. Ali
  // a coluna É a navegação, e fechá-la seria esconder a única coisa que orienta a leitura.
  for (const w of [1280, 1440]) {
    await pg.setViewport({ width: w, height: 900 });
    await pg.goto(DOC, { waitUntil: 'load' });
    const largo = await pg.evaluate(MEDIR);
    provar(`em ${w}px não há botão, e o índice está inteiro (a memória é ignorada)`,
      largo.temBotao === true && largo.botaoVisivel === false && largo.listaVisivel === true
      && largo.recolhido === 'nao' && largo.memorizado === 'fechado', largo);
  }

  // ---- 5b: o corte é o do LAYOUT (1199 × 1200), não o do aparelho ----
  await pg.setViewport({ width: 1199, height: 900 });
  await pg.goto(DOC, { waitUntil: 'load' });
  const antes = await pg.evaluate(MEDIR);
  await pg.setViewport({ width: 1200, height: 900 });
  await pg.goto(DOC, { waitUntil: 'load' });
  const depois = await pg.evaluate(MEDIR);
  provar('o corte é o do layout: em 1199 há botão; em 1200 não há',
    antes.botaoVisivel === true && depois.botaoVisivel === false, { p1199: antes, p1200: depois });

  // ---- 6: sem JavaScript não há botão, e o índice fica inteiro ----
  const semJs = await br.newPage();
  await semJs.setViewport({ width: 390, height: 844 });
  await semJs.setJavaScriptEnabled(false);
  await semJs.goto(DOC, { waitUntil: 'load' });
  const cru = await semJs.evaluate(MEDIR);
  provar('sem JavaScript não há botão nenhum — nada morto na tela',
    cru.temBotao === false, cru);
  provar('…e o índice fica inteiro, como sempre esteve (nada se perde sem JS)',
    cru.listaVisivel === true && cru.recolhido === null, cru);
  await semJs.close();

  // ---- 8: no papel o índice sai inteiro e o botão não se imprime ----
  await pg.setViewport({ width: 390, height: 844 });
  await pg.goto(DOC, { waitUntil: 'load' });
  await pg.emulateMediaType('print');
  const noPapel = await pg.evaluate(MEDIR);
  await pg.emulateMediaType(null);
  provar('no papel o índice sai inteiro, e o botão não se imprime',
    noPapel.listaVisivel === true && noPapel.botaoVisivel === false, noPapel);

  // ---- 9: nenhuma largura estoura na horizontal ----
  const estouros = [];
  for (const w of [320, 360, 390, 414, 768, 1024, 1280]) {
    await pg.setViewport({ width: w, height: 900 });
    await pg.goto(DOC, { waitUntil: 'load' });
    const r = await pg.evaluate(MEDIR);
    if (r.estouro !== 0) estouros.push({ largura: w, estouro: r.estouro });
  }
  provar('o bloco não estoura a página em nenhuma largura', estouros.length === 0, estouros);

  await br.close();
  srv.close();
  console.log(`\nprovar-dobra-do-indice: ${falhas === 0 ? 'TUDO CERTO' : falhas + ' FALHA(S)'}`);
  process.exit(falhas ? 1 : 0);
})();
