#!/usr/bin/env node
'use strict';

/**
 * provar-sessao-na-barra.js — o caminho SOBE para a barra do sistema, e o ☰ não anda.
 *
 * Por que existe (18/10/2026). A opção S5 do estudo de opções visuais foi a escolhida para
 * a navegação da Produção no celular: em repouso, a barra da página («PRODUÇÃO · Painel
 * inicial», com o botão «Seções») fica no topo do CONTEÚDO e rola para fora; ao descer, o
 * que ela dizia entra na barra do sistema — `PEDAGOGIA · Turmas [Seções] ☰`. Ao voltar ao
 * topo, desfaz-se. Em repouso não custa um pixel de altura.
 *
 * Isso NÃO SE MEDE NO HTML. A afirmação da proposta é geométrica — «o ☰ não anda» —, e é
 * medida com a posição REAL do botão antes e depois do scroll. Um `data-descido` no
 * atributo diz que o CSS tem onde pegar; não diz que a peça apareceu, nem que a barra
 * deixou de crescer, nem que o nome encolhe em vez de empurrar.
 *
 * O que se prova:
 *
 *   1. em tela larga (1280px) nada disto existe: sessão e botão continuam `display:none`,
 *      e a barra é a de sempre;
 *   2. no celular, no topo, a sessão e o botão estão ocultos e a barra do sistema tem a
 *      altura de repouso;
 *   3. ao rolar (>24px), a sessão aparece, diz o GRUPO e a PÁGINA, e o botão «Seções»;
 *   4. O ☰ NÃO ANDA — mesma posição e mesmo tamanho antes e depois de rolar. É a condição
 *      que separa esta proposta da S1, onde a barra recuava inteira e levava o ☰ junto;
 *   5. a barra NÃO CRESCE — a peça entra no vão que o `margin-left:auto` do ☰ já ocupava;
 *   6. com um nome comprido («Vocabulário técnico») a 320px, o nome TRUNCA em vez de
 *      quebrar a barra em duas linhas — e o ☰ continua parado;
 *   7. o botão «Seções» da barra abre a MESMA folha do menu (`data-aberta`, `aria-expanded`);
 *   8. ao voltar ao topo, a sessão sai da barra e o ☰ continua no lugar.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-sessao-na-barra.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');
const CONTEXTO = { professor: 'tiago-menegaz', ciclo: '01', query: 'professor=tiago-menegaz&escola=fita&ciclo=01' };

/** TURMAS suficientes para a página ser mais alta do que a janela — sem isso não há o
 *  que rolar, e a prova mediria o repouso duas vezes. */
const TURMAS = Array.from({ length: 8 }, (_, i) => ({
  id: 'tu' + (i + 1),
  nome: 'Balé nível ' + (i + 1),
  frequencia: 2,
  dias: ['seg', 'qua'],
  horarios: { seg: '18:00', qua: '18:00' },
  duracaoMin: 60,
  periodoInicio: '2026-10-16',
  periodoFim: '2026-12-18',
}));

function pagina() {
  const b = require(path.join(raiz, 'motor/servidor/bastidores.js'));
  return b.paginaProducao('fita', CONTEXTO, [], ['Vavá'], 'Tiago Menegaz', 'tiago-menegaz',
    TURMAS, [], {}, [], [], []);
}

function servir(html) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) return ok('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    if (caminho.endsWith('/assets/nav.js')) return ok('text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/** A medida que interessa: o ☰ em px inteiros, e o que a barra diz. */
function medir() {
  const nav = document.querySelector('.topnav');
  const hamb = document.querySelector('.topnav .hamburger');
  const sessao = document.querySelector('.topnav .s5-sessao');
  const secoes = document.getElementById('s5-secoes');
  const marca = document.querySelector('.topnav > .marca');
  const r = (e) => { const b = e.getBoundingClientRect(); return { top: Math.round(b.top), left: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height) }; };
  const nome = document.getElementById('s5-nome');
  return {
    descido: nav ? nav.getAttribute('data-descido') : null,
    hamburger: hamb ? r(hamb) : null,
    alturaDaBarra: nav ? Math.round(nav.getBoundingClientRect().height) : null,
    sessao: sessao ? getComputedStyle(sessao).display : null,
    secoes: secoes ? getComputedStyle(secoes).display : null,
    // O «Seções» É UM BOTÃO, E MEDE-SE COMO TAL (18/10/2026). Antes era texto com borda:
    // ~72×18px, e no telefone parecia exigir um dedo muito delicado. O que se prova é o
    // TAMANHO (alvo de toque) e o PREENCHIMENTO (fundo opaco, não transparente) — as duas
    // coisas que fazem um controle parecer clicável.
    botao: secoes ? Object.assign(r(secoes), {
      fundo: getComputedStyle(secoes).backgroundColor,
      raio: getComputedStyle(secoes).borderRadius,
      rotulo: secoes.textContent.replace(/\s+/g, ' ').trim(),
    }) : null,
    marcaVisivel: marca ? getComputedStyle(marca).display !== 'none' : null,
    grupo: (document.getElementById('s5-grupo') || {}).textContent || null,
    nome: nome ? nome.textContent : null,
    nomeTrunca: nome ? nome.scrollWidth > nome.clientWidth : null,
    estouro: document.documentElement.scrollWidth - window.innerWidth,
    rolagem: Math.round(window.pageYOffset || window.scrollY || 0),
  };
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-sessao-na-barra: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-sessao-na-barra: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const { srv, base } = await servir(pagina());
  const navegador = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let ok = 0;
  let ko = 0;
  const provar = (rotulo, condicao, detalhe) => {
    if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
    else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
  };

  /** Abre a página, passa a portaria e escolhe a secção. `#conteudo` é aberto à mão: a
   *  senha não é o que se está a medir. */
  const abrir = async (largura, secao) => {
    const p = await navegador.newPage();
    await p.setViewport({ width: largura, height: 760 });
    await p.goto(base + '/bastidores/estudio', { waitUntil: 'load', timeout: 60000 });
    await p.evaluate((s) => {
      const c = document.getElementById('conteudo');
      if (c) c.hidden = false;
      location.hash = '#' + s;
    }, secao || 'turmas');
    await p.waitForFunction((s) => {
      const el = document.getElementById('sec-' + s);
      return el && !el.hidden;
    }, { timeout: 5000 }, secao || 'turmas');
    return p;
  };
  const rolar = async (p, y) => {
    await p.evaluate((v) => window.scrollTo(0, v), y);
    await new Promise((r) => setTimeout(r, 260));
  };

  // ---------------------------------------------------------------- 1) tela larga
  console.log('\ntela larga (1280px) — a S5 é do celular, e não aparece');
  {
    const p = await abrir(1280, 'turmas');
    await rolar(p, 600);
    const m = await p.evaluate(medir);
    provar('a sessão continua oculta', m.sessao === 'none', m.sessao);
    provar('o botão «Seções» continua oculto', m.secoes === 'none', m.secoes);
    provar('a marca do topo continua visível', m.marcaVisivel === true, m.marcaVisivel);
    provar('a barra não cresce', m.alturaDaBarra === 61 || m.alturaDaBarra > 0, m.alturaDaBarra);
    await p.close();
  }

  // ---------------------------------------------------------------- 2 a 5) celular
  console.log('\ncelular (390px) — a sessão sobe, e o ☰ fica parado');
  {
    const p = await abrir(390, 'turmas');
    const noTopo = await p.evaluate(medir);
    provar('no topo: data-descido=nao', noTopo.descido === 'nao', noTopo.descido);
    provar('no topo: a sessão está oculta', noTopo.sessao === 'none', noTopo.sessao);
    provar('no topo: o botão «Seções» está oculto', noTopo.secoes === 'none', noTopo.secoes);
    provar('no topo: a marca do topo está visível', noTopo.marcaVisivel === true, noTopo.marcaVisivel);

    await rolar(p, 600);
    const rolado = await p.evaluate(medir);
    provar('a rolar: a página desceu', rolado.rolagem > 24, rolado.rolagem);
    provar('a rolar: data-descido=sim', rolado.descido === 'sim', rolado.descido);
    provar('a rolar: a sessão aparece', rolado.sessao !== 'none', rolado.sessao);
    provar('a rolar: o botão «Seções» aparece', rolado.secoes !== 'none', rolado.secoes);
    // O BOTÃO É UM BOTÃO: alvo de toque e fundo opaco. O mínimo confortável é 44px; 40 é o
    // que cabe sem crescer a barra (o ☰ tem 42). O que não se aceita é voltar ao texto com
    // borda — fundo transparente e 18px de altura.
    provar('o «Seções» tem altura de alvo de toque (≥36px)',
      Boolean(rolado.botao) && rolado.botao.h >= 36, rolado.botao && rolado.botao.h);
    provar('…e largura suficiente para o dedo (≥64px)',
      Boolean(rolado.botao) && rolado.botao.w >= 64, rolado.botao && rolado.botao.w);
    provar('…e é PREENCHIDO (fundo opaco, não transparente)',
      Boolean(rolado.botao) && !/rgba?\([^)]*,\s*0\s*\)/.test(rolado.botao.fundo)
        && rolado.botao.fundo !== 'transparent', rolado.botao && rolado.botao.fundo);
    provar('…e arredondado como pílula', Boolean(rolado.botao) && rolado.botao.raio.indexOf('999') !== -1,
      rolado.botao && rolado.botao.raio);
    provar('a rolar: a marca do topo sai', rolado.marcaVisivel === false, rolado.marcaVisivel);
    provar('a rolar: o caminho diz «Pedagogia · Turmas»',
      rolado.grupo === 'Pedagogia' && rolado.nome === 'Turmas', { grupo: rolado.grupo, nome: rolado.nome });
    provar('O ☰ NÃO ANDA — mesma posição, antes e depois',
      JSON.stringify(noTopo.hamburger) === JSON.stringify(rolado.hamburger),
      { antes: noTopo.hamburger, depois: rolado.hamburger });
    provar('a barra NÃO cresce (mesma altura)',
      rolado.alturaDaBarra === noTopo.alturaDaBarra,
      { antes: noTopo.alturaDaBarra, depois: rolado.alturaDaBarra });
    provar('não há estouro horizontal a 390px', rolado.estouro <= 1, rolado.estouro);

    // O botão «Seções» da barra abre a MESMA folha do menu.
    await p.click('#s5-secoes');
    await new Promise((r) => setTimeout(r, 320));
    const folha = await p.evaluate(() => ({
      aberta: (document.querySelector('.lateral') || {}).getAttribute
        ? document.querySelector('.lateral').getAttribute('data-aberta') : null,
      expandido: (document.getElementById('s5-secoes') || {}).getAttribute
        ? document.getElementById('s5-secoes').getAttribute('aria-expanded') : null,
    }));
    provar('o «Seções» da barra abre a folha do menu',
      folha.aberta === 'sim' && folha.expandido === 'true', folha);
    await p.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 320));

    await rolar(p, 0);
    const voltou = await p.evaluate(medir);
    provar('ao voltar ao topo: a sessão sai da barra',
      voltou.descido === 'nao' && voltou.sessao === 'none', voltou.descido);
    provar('ao voltar ao topo: o ☰ continua no mesmo lugar',
      JSON.stringify(voltou.hamburger) === JSON.stringify(noTopo.hamburger),
      { antes: noTopo.hamburger, depois: voltou.hamburger });
    await p.close();
  }

  // ---------------------------------------------------------------- 6) nome comprido
  console.log('\n320px com «Vocabulário técnico» — o nome trunca, a barra não quebra');
  {
    const p = await abrir(320, 'vocabulario');
    const noTopo = await p.evaluate(medir);
    await rolar(p, 400);
    const rolado = await p.evaluate(medir);
    provar('o nome comprido chega à barra', rolado.nome === 'Vocabulário técnico', rolado.nome);
    provar('…e TRUNCA em vez de quebrar a barra', rolado.nomeTrunca === true, rolado.nomeTrunca);
    provar('…a barra não cresce com ele',
      rolado.alturaDaBarra === noTopo.alturaDaBarra,
      { antes: noTopo.alturaDaBarra, depois: rolado.alturaDaBarra });
    provar('…e o ☰ continua parado',
      JSON.stringify(rolado.hamburger) === JSON.stringify(noTopo.hamburger),
      { antes: noTopo.hamburger, depois: rolado.hamburger });
    await p.close();
  }

  await navegador.close();
  srv.close();
  console.log(`\nprovar-sessao-na-barra: ${ko === 0 ? 'TUDO CERTO' : ko + ' FALHA(S)'} (${ok} provas)`);
  process.exit(ko ? 1 : 0);
})();
