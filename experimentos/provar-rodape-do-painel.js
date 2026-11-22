#!/usr/bin/env node
'use strict';

/**
 * provar-rodape-do-painel.js — o rodapé do «Fale conosco» começa ONDE O CONTEÚDO COMEÇA.
 *
 * O QUE ELA VIU (18/11/2026):
 *
 *   «No bastidores produção é que não ficou. Então tem que ajustar isso, é só colocar ele mais
 *   para a direita. Ele está escondido, parte dele está escondido atrás do menu vertical à
 *   esquerda. Então eu só consigo ler «ponto com br» , WhatsApp e o número do WhatsApp.»
 *
 * A CAUSA NÃO É DE ESTILO, É DE SÍTIO. A página de trabalho tem a coluna do menu FIXA à esquerda
 * (248px, `position:fixed; left:0`), e é o `.corpo` que reserva esse espaço — no `padding-left`
 * de `calc(248px + esp-4 + esp-5)`. Um rodapé pendurado no `body` começa em x=0: nasce debaixo da
 * coluna, e o que sobra à vista é a cauda da linha, que é o sintoma que ela descreveu ao pé da
 * letra. Na raiz do Sistema Lastro não há coluna, e por isso lá ele sempre se leu bem.
 *
 * O QUE SE MEDE, e é GEOMETRIA — não gosto, nem a presença de uma classe:
 *
 *   A. na página de trabalho, a borda esquerda do rodapé fica à direita da coluna, e a direita
 *      dentro da janela — a 1280 e a 390;
 *   B. o rodapé é o ÚLTIMO filho de `.corpo` (é o que o faz herdar o recuo da listagem, e o que
 *      garante que ele fica depois do conteúdo e não por cima);
 *   C. numa página SEM `.corpo` — a raiz do Sistema Lastro — nada muda: o rodapé continua o
 *      último elemento do `body`, e continua a medir a largura toda.
 *
 * A bancada é LOCAL: um `http.createServer` em porta efémera serve a página que o módulo monta, a
 * folha de verdade (`tools/templates/ciclo.css`) e o `nav.js` de verdade, com as respostas de
 * `/api/*` stubadas. **Nada aqui toca no ar.**
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   uso: node experimentos/provar-rodape-do-painel.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const raiz = path.join(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));

const LARGURA_DA_COLUNA = 248;

let falhas = 0;
let total = 0;
function conferir(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) {
    console.log('  ✓ ' + rotulo);
  } else {
    falhas += 1;
    console.log('  ✗ ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  }
}

function servir(respostas) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    }
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    const html = Object.keys(respostas).find((k) => caminho.startsWith(k));
    return ok('text/html; charset=utf-8', respostas[html] || '');
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({
    srv, base: 'http://127.0.0.1:' + srv.address().port,
  })));
}

/** O que se lê da página, dentro dela — uma função só, e sem arredondar nada. */
function medir() {
  const rodape = document.querySelector('footer.rodape');
  const corpo = document.querySelector('.corpo');
  const coluna = document.querySelector('.lateral');
  const rect = (e) => {
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { esquerda: Math.round(r.left), direita: Math.round(r.right), largura: Math.round(r.width) };
  };
  return {
    janela: window.innerWidth,
    rodape: rect(rodape),
    corpo: rect(corpo),
    coluna: rect(coluna),
    paiDoRodape: rodape && rodape.parentElement
      ? (rodape.parentElement.className || rodape.parentElement.tagName) : null,
    /* O ÚLTIMO FILHO, e não «um filho»: o rodapé é o que vem depois de tudo. Um rodapé no meio do
     * `.corpo` herdaria o mesmo recuo e ficaria a estorvar o conteúdo pelo caminho. */
    ultimoDoCorpo: Boolean(corpo && corpo.lastElementChild
      && corpo.lastElementChild === rodape),
    texto: rodape ? rodape.textContent.replace(/\s+/g, ' ').trim() : '',
    /* O QUE O OLHO CONSEGUE LER. `elementsFromPoint` devolve os elementos empilhados no ponto —
     * e é isto que distingue «está à direita da coluna» de «está debaixo da coluna»: se o
     * primeiro da lista é a `.lateral`, o menu está por cima do rodapé, mesmo que o rodapé se
     * declare à vista. */
    quemEstaPorCimaNoInicio: (() => {
      if (!rodape) return null;
      const r = rodape.getBoundingClientRect();
      const alvo = document.elementsFromPoint(r.left + 4, r.top + Math.min(8, r.height / 2))[0];
      return alvo ? (alvo.className || alvo.tagName) : null;
    })(),
  };
}

(async () => {
  const producao = bastidores.paginaProducao('breu', { professor: 'demi-plie', ciclo: '01', query: '' },
    [], [], 'Tiago', 'tiago', [], [], [], [], [], []);
  const raizDoLastro = fs.readFileSync(path.join(raiz, 'raiz/index.html'), 'utf8');

  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-rodape-do-painel: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  const puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));

  const { srv, base } = await servir({ '/bastidores/estudio': producao, '/': raizDoLastro });
  const browser = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));

  try {
    console.log('\nA. A PÁGINA DE TRABALHO — o rodapé começa onde o conteúdo começa');
    for (const [largura, altura] of [[1280, 950], [1024, 800], [390, 844]]) {
      await page.setViewport({ width: largura, height: altura });
      await page.goto(base + '/bastidores/estudio', { waitUntil: 'networkidle0' });
      // A Produção é uma página de sessão; é o que o login faz ao vivo.
      await page.evaluate(() => { if (typeof abrirSessao === 'function') abrirSessao('token-de-prova'); });
      await new Promise((r) => setTimeout(r, 400));
      const m = await page.evaluate(medir);

      conferir('a ' + largura + 'px, o rodapé existe e diz o canal',
        Boolean(m.rodape) && /lastro@padd\.com\.br/.test(m.texto), m.texto);
      conferir('…e nasce DENTRO do `.corpo`, não pendurado no `body`',
        m.ultimoDoCorpo === true, { pai: m.paiDoRodape, ultimo: m.ultimoDoCorpo });
      if (largura > 768) {
        /* A COLUNA É FIXA E COMEÇA EM x=0. O rodapé tem de começar depois dela — é a medida
         * exacta do defeito: escondido atrás do menu, `esquerda` era 0. */
        conferir('…e a borda esquerda fica à direita da coluna de ' + LARGURA_DA_COLUNA + 'px',
          m.rodape && m.rodape.esquerda >= LARGURA_DA_COLUNA, m.rodape);
        conferir('…e o que está por cima do canto do rodapé não é o menu',
          m.quemEstaPorCimaNoInicio && !/lateral/.test(m.quemEstaPorCimaNoInicio),
          m.quemEstaPorCimaNoInicio);
      } else {
        /* No celular a coluna não é uma coluna: vira barra + folha, e o conteúdo ocupa a
         * largura. O que se mede é o que se mede em qualquer tela pequena — nada sai da janela. */
        conferir('…e no celular o rodapé começa na margem, sem recuo de coluna',
          m.rodape && m.rodape.esquerda > 0 && m.rodape.esquerda < 40, m.rodape);
      }
      conferir('…e a borda direita não sai da janela', m.rodape && m.rodape.direita <= m.janela, {
        direita: m.rodape && m.rodape.direita, janela: m.janela,
      });
    }

    console.log('\nB. A RAIZ DO SISTEMA LASTRO — que nunca teve coluna, continua igual');
    await page.setViewport({ width: 1280, height: 950 });
    await page.goto(base + '/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 400));
    const naRaiz = await page.evaluate(medir);
    conferir('sem `.corpo`, o rodapé continua o último elemento do `body`',
      naRaiz.paiDoRodape === 'BODY', naRaiz.paiDoRodape);
    /* A RAIZ TEM UMA COLUNA DE LEITURA CENTRADA — 50px de margem a 1280, medidos. O que não pode
     * é ela ter o RECUO DA COLUNA DE MENU, que é o que este trabalho corrigiu no painel: por isso
     * o que se afirma é a ausência desse recuo (a largura cobre a página), e não um número de
     * margem que é da folha da raiz e não desta correcção. */
    conferir('…e não leva o recuo da coluna de menu: cobre a largura da página',
      naRaiz.rodape && naRaiz.rodape.esquerda < LARGURA_DA_COLUNA / 2
        && naRaiz.rodape.largura > naRaiz.janela * 0.8,
      naRaiz.rodape);

    console.log('\nC. NENHUM ERRO DE JAVASCRIPT');
    /* O `Unexpected token '<'` é da bancada (as rotas devolvem HTML stubado), não da página. */
    const inesperados = erros.filter((m) => !/Unexpected token '<'/.test(m));
    conferir('nenhum erro de JavaScript', inesperados.length === 0, inesperados);
  } finally {
    await browser.close();
    srv.close();
  }

  console.log('\n' + (falhas === 0 ? 'PASSOU' : 'FALHOU') + ' — ' + (total - falhas) + ' de ' + total + ' asserções');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('erro na prova:', e.message);
  console.error(e.stack);
  process.exit(1);
});
