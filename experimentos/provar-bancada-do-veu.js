#!/usr/bin/env node
'use strict';

/*
 * provar-bancada-do-veu.js — A BANCADA DAS FORMAS DO VÉU DEIXA ESCOLHER (11/11/2026).
 *
 * O QUE MOTIVOU, na letra dela: «A página do experimento que você me passou está em looping, está
 * carregando o tempo todo e eu não consigo ver as opções. […] só me mostra o cartão. Eu não
 * consigo ir para a opção um, nem para a opção dois, nem ver a página e nem as propostas. Ela está
 * sempre carregando infinitamente.»
 *
 * NÃO ERA A PÁGINA. Era o véu a fazer o ofício dele sobre a própria bancada. O módulo do `nav.js`
 * põe `inert` em TODOS os filhos do `body` durante a operação — é assim que ele impede o professor
 * de agir a meio de uma derivação. A bancada publica uma operação para mostrar o véu, e o painel
 * que escolhe as opções fica `inert` com o resto: nenhum botão responde ao rato nem ao teclado. O
 * que se lê é «carrega para sempre e não dá para escolher nada».
 *
 * O QUE ESTA PROVA MEDE, na bancada de verdade, com o `construir.js` de verdade:
 *
 *   A. O VÉU ESTÁ DE PÉ — é o objecto em estudo, e sem ele nada disto se aplica.
 *   B. O PAINEL RESPONDE — `#bancada` e a aba NÃO estão `inert`, e um clique a sério no botão de
 *      cada opção troca `data-opcao` na raiz. É a asserção que reprovava o código de antes.
 *   C. A NOTA DA OUTRA ABA NÃO APARECE — nesta página ela seria falsa (a operação é desta aba), e
 *      ainda ia ser lida por quem ouve.
 *   D. O INTERRUPTOR TIRA E REPÕE O VÉU — com o véu fora, a Produção por baixo volta a responder
 *      (deixa de estar `inert`), e é isso que permite comparar as duas coisas.
 *   E. AS TRÊS OPÇÕES ESTÃO LÁ, e cada uma aplica o seu `data-opcao`.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` constrói a página com o `construir.js` de
 * `REF_NEGATIVO` (por omissão `HEAD`, que é a bancada de antes) e corre as mesmas asserções. Sem o
 * desafogo, B e D reprovam — se passassem, a prova não provava nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-bancada-do-veu.js
 *   REF_NEGATIVO=HEAD node experimentos/provar-bancada-do-veu.js --controle-negativo
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PROPOSTAS = path.join(RAIZ, 'experimentos', 'propostas');
const PAGINA = path.join(PROPOSTAS, 'proposta-veu.html');
const negativo = process.argv.indexOf('--controle-negativo') !== -1;

let ok = 0, ko = 0;
function provar(nome, condicao, detalhe) {
  if (condicao) { ok++; console.log('  ok   ' + nome); return true; }
  ko++;
  console.log('  FALHA ' + nome);
  if (detalhe !== undefined) console.log('        ' + JSON.stringify(detalhe));
  return false;
}

/* Construir a bancada. O CONTROLE NEGATIVO corre o `construir.js` de outra referência: copiado para
 * o MESMO directório, para `__dirname` continuar a apontar para a raiz do projecto (o construtor
 * resolve o CSS e o `nav.js` a partir dela). No fim, bom ou mau, o construtor de hoje volta a
 * correr — a bancada publicada não pode ficar com a página do negativo. */
const CONSTRUTOR = path.join(PROPOSTAS, 'construir.js');
function construirDeHoje() { execFileSync('node', [CONSTRUTOR], { cwd: RAIZ, stdio: 'pipe' }); }

if (negativo) {
  const ref = process.env.REF_NEGATIVO || 'HEAD';
  const efemero = path.join(PROPOSTAS, '.construir-negativo.js');
  fs.writeFileSync(efemero, execSync('git show ' + ref + ':experimentos/propostas/construir.js',
    { cwd: RAIZ, maxBuffer: 64 * 1024 * 1024 }));
  console.log('CONTROLE NEGATIVO contra ' + ref + '\n');
  try { execFileSync('node', [efemero], { cwd: RAIZ, stdio: 'pipe' }); } finally { fs.unlinkSync(efemero); }
} else {
  construirDeHoje();
}

const puppeteer = require(execSync('npm root -g').toString().trim()
  + '/@marp-team/marp-cli/node_modules/puppeteer-core');

const srv = http.createServer((req, res) => {
  const rota = req.url.split('?')[0];
  if (rota.startsWith('/api/')) {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end('{}');
  }
  const ficheiro = rota === '/' ? PAGINA : path.join(PROPOSTAS, rota.replace(/^\//, ''));
  if (!fs.existsSync(ficheiro) || !fs.statSync(ficheiro).isFile()) {
    res.statusCode = 404; return res.end('nao');
  }
  res.setHeader('content-type', rota.endsWith('.html') || rota === '/' ? 'text/html; charset=utf-8'
    : rota.endsWith('.css') ? 'text/css' : rota.endsWith('.js') ? 'application/javascript' : 'application/octet-stream');
  res.end(fs.readFileSync(ficheiro));
});

(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + srv.address().port + '/';
  const nav = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox'] });
  const p = await nav.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  p.on('dialog', (d) => d.dismiss());
  await p.goto(url, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  /* ========================================================================
   * A. O VÉU ESTÁ DE PÉ — o objecto em estudo
   * ====================================================================== */
  console.log('A. o véu, que é o que se está a julgar');
  const a = await p.evaluate(() => {
    const v = document.getElementById('veu');
    const cs = v && getComputedStyle(v);
    return {
      existe: Boolean(v),
      ocupado: v && v.getAttribute('data-ocupado'),
      display: cs && cs.display,
      opacidade: Number(cs && cs.opacity),
      etiqueta: v && (v.querySelector('.veu-etiqueta') || {}).textContent,
      texto: v && (v.querySelector('.veu-texto') || {}).textContent,
    };
  });
  provar('o véu existe e está de pé', a.existe && a.ocupado === 'sim' && a.display === 'flex', a);
  provar('…e vê-se (opacidade 1)', a.opacidade === 1, a.opacidade);
  provar('…e nomeia a operação', /Deriva/.test(String(a.etiqueta)) && /derivar/.test(String(a.texto)), a);

  /* ========================================================================
   * B. O PAINEL RESPONDE — o defeito de 11/11/2026
   * ====================================================================== */
  console.log('\nB. o painel das opções responde (era isto que não acontecia)');
  const b = await p.evaluate(() => {
    const painel = document.getElementById('bancada');
    const aba = document.getElementById('bancada-aba');
    const botao = document.querySelector('.bancada-opcoes button[data-escolha="giro"]');
    const cs = botao && getComputedStyle(botao);
    return {
      painelInert: Boolean(painel && painel.inert),
      abaInert: Boolean(aba && aba.inert),
      botaoExiste: Boolean(botao),
      botaoInert: Boolean(botao && botao.closest('[inert]')),
      // `elementFromPoint` no centro do botão: se outro elemento estiver por cima, o clique não
      // chega — e é o que acontece quando o véu tapa o painel.
      porCima: (() => {
        if (!botao) return null;
        const r = botao.getBoundingClientRect();
        const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return alvo ? (alvo.closest('button') ? botao.dataset.escolha : (alvo.id || alvo.className)) : null;
      })(),
      visivel: Boolean(cs && cs.display !== 'none' && Number(cs.opacity) > 0),
    };
  });
  provar('o painel NÃO está trancado', b.painelInert === false, b);
  provar('a aba NÃO está trancada', b.abaInert === false, b);
  provar('o botão da opção 1 existe e está visível', b.botaoExiste && b.visivel, b);
  provar('…e não está dentro de nada trancado', b.botaoInert === false, b);
  provar('…e nada o tapa (o clique chega ao botão)', b.porCima === 'giro', b.porCima);

  // O clique A SÉRIO, como a pesquisadora o dá.
  const antes = await p.evaluate(() => document.documentElement.getAttribute('data-opcao'));
  await p.click('.bancada-opcoes button[data-escolha="giro"]');
  await new Promise((r) => setTimeout(r, 150));
  const depoisDoClique = await p.evaluate(() => ({
    opcao: document.documentElement.getAttribute('data-opcao'),
    cartaoSemCaixa: getComputedStyle(document.querySelector('#veu .veu-cartao')).borderTopWidth,
  }));
  provar('o clique na opção 1 troca a opção na tela', depoisDoClique.opcao === 'giro',
    { antes, depois: depoisDoClique });
  provar('…e a opção 1 tira a caixa do cartão', depoisDoClique.cartaoSemCaixa === '0px', depoisDoClique);

  /* As teclas também: é o caminho que o painel anuncia na nota. */
  await p.keyboard.press('2');
  await new Promise((r) => setTimeout(r, 150));
  const porTecla = await p.evaluate(() => document.documentElement.getAttribute('data-opcao'));
  provar('a tecla 2 leva à opção 2', porTecla === 'marca', porTecla);

  /* ========================================================================
   * C. A NOTA DA OUTRA ABA NÃO APARECE
   * ====================================================================== */
  console.log('\nC. o véu não mente sobre a origem da operação');
  const c = await p.evaluate(() => {
    const nota = document.querySelector('#veu .veu-nota');
    return { existe: Boolean(nota), remota: document.getElementById('veu').getAttribute('data-remota') };
  });
  provar('a nota «noutra aba» não existe nesta página', c.existe === false, c);
  provar('…e o véu não se diz remoto', c.remota === null, c.remota);

  /* ========================================================================
   * D. O INTERRUPTOR TIRA E REPÕE O VÉU
   * ====================================================================== */
  console.log('\nD. o interruptor devolve a Produção por baixo');
  const interruptor = await p.evaluate(() => {
    const b = document.getElementById('veu-interruptor');
    return { existe: Boolean(b), texto: b && b.textContent.trim(), pressed: b && b.getAttribute('aria-pressed') };
  });
  provar('o interruptor existe e diz «Tirar o véu»',
    interruptor.existe && /Tirar/.test(interruptor.texto) && interruptor.pressed === 'true', interruptor);

  await p.click('#veu-interruptor').catch(() => {});
  await new Promise((r) => setTimeout(r, 150));
  const semVeu = await p.evaluate(() => {
    const v = document.getElementById('veu');
    const blocos = Array.from(document.body.children)
      .filter((e) => e.id !== 'veu' && e.inert).map((e) => e.id || e.tagName);
    const b = document.getElementById('veu-interruptor');
    return {
      ocupado: v.getAttribute('data-ocupado'),
      trancados: blocos,
      texto: b ? b.textContent.trim() : null,
      painelInert: Boolean(document.getElementById('bancada').inert),
    };
  });
  provar('tirar o véu esvazia o estado', semVeu.ocupado === null, semVeu);
  provar('…e destranca a página toda', semVeu.trancados.length === 0, semVeu.trancados);
  provar('…e o painel continua a responder', semVeu.painelInert === false, semVeu);
  provar('…e o interruptor passa a dizer «Pôr o véu»', /Pôr/.test(String(semVeu.texto)), semVeu.texto);

  await p.click('#veu-interruptor').catch(() => {});
  await new Promise((r) => setTimeout(r, 150));
  const comVeu = await p.evaluate(() => ({
    ocupado: document.getElementById('veu').getAttribute('data-ocupado'),
    trancados: Array.from(document.body.children).filter((e) => e.id !== 'veu' && e.inert)
      .map((e) => e.id || e.tagName),
    painelInert: Boolean(document.getElementById('bancada').inert),
    texto: (document.getElementById('veu-interruptor') || {}).textContent,
  }));
  provar('pôr o véu volta a acendê-lo', comVeu.ocupado === 'sim', comVeu);
  provar('…e volta a trancar a Produção por baixo', comVeu.trancados.length > 0, comVeu.trancados);
  provar('…mas NUNCA o painel', comVeu.painelInert === false, comVeu);
  provar('…e a nota falsa não volta', await p.evaluate(() => !document.querySelector('#veu .veu-nota')));

  /* ========================================================================
   * E. AS TRÊS OPÇÕES, UMA A UMA
   * ====================================================================== */
  console.log('\nE. as três formas estão todas lá');
  const e = await p.evaluate(() => Array.from(document.querySelectorAll('.bancada-opcoes button'))
    .map((x) => ({ id: x.dataset.escolha, n: x.querySelector('.n').textContent.trim() })));
  provar('há três opções, 0 · 1 · 2',
    e.length === 3 && e.map((x) => x.n).join('') === '012', e);

  for (const opcao of ['hoje', 'giro', 'marca']) {
    await p.click('.bancada-opcoes button[data-escolha="' + opcao + '"]');
    await new Promise((r) => setTimeout(r, 120));
    const posto = await p.evaluate(() => document.documentElement.getAttribute('data-opcao'));
    provar('a opção «' + opcao + '» aplica-se', posto === opcao, posto);
  }

  /* Escape fecha o painel e deixa ver o véu sobre a Produção — o gesto que ela precisava de fazer. */
  await p.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 150));
  const fechado = await p.evaluate(() => {
    const painel = document.getElementById('bancada');
    const bancadaVisivel = !painel.hidden && getComputedStyle(painel).display !== 'none';
    const v = document.getElementById('veu');
    return {
      painelVisivel: bancadaVisivel,
      abaVisivel: !document.getElementById('bancada-aba').hidden,
      veuDePe: v.getAttribute('data-ocupado') === 'sim',
      altura: document.documentElement.scrollHeight,
    };
  });
  provar('Escape fecha o painel', fechado.painelVisivel === false, fechado);
  provar('…e a aba da bancada aparece', fechado.abaVisivel === true, fechado);
  provar('…e o véu fica sobre a Produção verdadeira', fechado.veuDePe === true, fechado);
  provar('…e a página tem a Produção por baixo (rola-se)', fechado.altura > 1200, fechado.altura);

  await nav.close();
  srv.close();
  if (negativo) construirDeHoje();

  console.log('\n' + (ko ? 'FALHARAM ' + ko + ' de ' + (ok + ko) : 'TUDO CERTO — ' + ok
    + ' asserções: a bancada do véu abre, escolhe, tira o véu, repõe, e não mente sobre a aba.'));
  if (negativo) {
    if (ko === 0) { console.log('A PROVA NÃO PROVA NADA: a bancada de antes passou tudo.'); process.exit(1); }
    console.log('Como esperado: a bancada de antes reprova ' + ko + ' de ' + (ok + ko) + '.');
    process.exit(0);
  }
  process.exit(ko ? 1 : 0);
})().catch((e) => {
  console.error('A prova rebentou: ' + (e && e.stack || e));
  srv.close();
  process.exit(1);
});
