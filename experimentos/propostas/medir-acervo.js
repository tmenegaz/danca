'use strict';
/*
 * Mede a proposta 6 — o acervo com a porta — nas três opções, em quatro larguras.
 *
 * O QUE SE MEDE, e porquê:
 *   · a CAIXINHA do ato ocupa a faixa inteira (é a peça do «Turma», e o pedido foi que fosse
 *     assim em vez de um terço) e tem altura de caixinha, não de botão grande;
 *   · o estado de REPOUSO — o que se vê sem abrir nada: a caixinha, a ficha em branco, e (em B)
 *     as acções. Em A as acções vivem dentro do painel, e isso é o custo declarado da opção;
 *   · o estado ABERTO — quantos pixels custa ver os campos e as acções;
 *   · e nada estoura na horizontal, nenhum botão sai cortado, nenhum alvo fica abaixo de 28px.
 *
 * Sem Chrome/Chromium: NÃO FEITO — nunca um «passou» silencioso.
 */
const { execSync } = require('child_process');
const path = require('path');
const puppeteer = require(path.join(execSync('npm root -g').toString().trim(),
  '@marp-team/marp-cli/node_modules/puppeteer-core'));
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const ARQ = 'file://' + path.join(__dirname, 'proposta-acervo.html');
const LARGURAS = [320, 390, 768, 1280];
const OPCOES = ['A', 'B', 'C'];
const assentar = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60))));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const faltas = [];
  let verdes = 0;
  /* UM ERRO DE JAVASCRIPT NÃO APARECE EM NENHUMA MEDIDA — a página fica com a marcação certa e
     o comportamento morto. A `medir.js` já o recolhe nas páginas que visita; esta acrescenta a
     que ela não visita. */
  const errosDeJs = [];
  page.on('pageerror', (e) => errosDeJs.push(String(e.message)));
  const ok = (t, c, d) => {
    if (c) { verdes += 1; return; }
    faltas.push(t + (d === undefined ? '' : ' → ' + JSON.stringify(d)));
  };
  const assentar = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60))));

  /* OS TRÊS ESTADOS DE CADA OPÇÃO, num só `evaluate`:
   *   repouso — o painel fechado, que é como a página é encontrada;
   *   aberto  — os campos e as acções à vista;
   *   e a caixinha, medida à parte porque é a peça que o pedido mudou. */
  const medir = () => page.evaluate(() => {
    const doc = document.documentElement;
    const R = (el) => (el ? el.getBoundingClientRect() : null);
    const visivel = (el) => {
      if (!el || !el.getClientRects().length) return false;
      if (getComputedStyle(el).display === 'none') return false;
      /* UM `details` FECHADO NÃO TIRA A CAIXA AO CONTEÚDO: o Chrome fecha-o com
       * content-visibility: hidden e o getBoundingClientRect do descendente continua a devolver
       * 314x202. A pergunta certa não é «tem caixa?», é «é visível para quem olha?». */
      if (el.closest('details:not([open])')) return false;
      return true;
    };
    const caixinha = document.querySelector('summary.trio-item');
    const painel = document.getElementById('painel-ato');
    const primeiro = document.querySelector('li.trio-plano:not(.contexto-cartao)');
    /* A LARGURA DA COLUNA DE LEITURA, e não da janela: `main` tem max-width, e a 1280 a
       caixinha certa mede 828 — comparar com a janela reprovava o que estava certo. */
    const coluna = document.querySelector('.filtro');
    const acoes = [...document.querySelectorAll('.acoes-do-ato')].filter(visivel);
    const alvos = [...document.querySelectorAll('button.acao, a.acao, .nome-do-registo, summary.trio-item')]
      .filter(visivel)
      .map((el) => { const r = el.getBoundingClientRect();
        return { l: Math.round(r.width), a: Math.round(r.height), txt: el.textContent.trim().slice(0, 20) }; });
    return {
      estouro: Math.max(0, Math.round(doc.scrollWidth - doc.clientWidth)),
      caixinhaL: caixinha ? Math.round(R(caixinha).width) : 0,
      colunaL: coluna ? Math.round(R(coluna).width) : 0,
      caixinhaA: caixinha ? Math.round(R(caixinha).height) : 0,
      caixinhaFim: caixinha ? Math.round(R(caixinha).right) : 0,
      caixinhaNegrito: caixinha
        ? getComputedStyle(caixinha.querySelector('.trio-k')).fontWeight : '',
      caixinhaFundo: caixinha ? getComputedStyle(caixinha).backgroundColor : '',
      coral: caixinha ? getComputedStyle(caixinha).borderRadius : '',
      temQ: !!(caixinha && caixinha.querySelector('.trio-q')),
      acoesPintadas: acoes.length,
      acoesCortadas: acoes.some((c) => [...c.querySelectorAll('.acao')]
        .some((a) => a.scrollWidth > a.clientWidth + 1)),
      /* QUALQUER UMA delas — há duas na marcação (a de fora, e a do cartão da opção C), e o
         `querySelector` devolvia sempre a primeira, que em C está escondida de propósito. */
      fichaVisivel: [...document.querySelectorAll('.ficha-em-branco a')].some(visivel),
      antes: primeiro ? Math.round(R(primeiro).top) : 0,
      painelAberto: painel ? painel.open : null,
      alvosPequenos: alvos.filter((a) => a.a < 28),
    };
  });

  const linhas = [];
  for (const largura of LARGURAS) {
    await page.setViewport({ width: largura, height: 844 });
    for (const opcao of OPCOES) {
      await page.goto(ARQ, { waitUntil: 'load' });
      await page.evaluate(() => localStorage.clear());
      await page.goto(ARQ, { waitUntil: 'load' });
      await page.evaluate((o) => window.aoTrocarOpcao(o), opcao);
      await page.evaluate(() => { const d = document.getElementById('painel-ato'); if (d) d.open = false; });
      await assentar(page);
      const repouso = await medir();
      await page.evaluate(() => { const d = document.getElementById('painel-ato'); if (d) d.open = true; });
      await assentar(page);
      const aberto = await medir();
      linhas.push({ largura, opcao, repouso, aberto });

      ok(`${largura}/${opcao}: não estoura na horizontal`, aberto.estouro <= 1, aberto.estouro);
      /* A CAIXINHA OCUPA A FAIXA INTEIRA — é o pedido de 25/10/2026. Ela é a peça do «Turma»,
         mas sozinha na linha, e não um terço dela. Em C não há caixinha: o contexto é um cartão. */
      if (opcao !== 'C') {
        ok(`${largura}/${opcao}: a caixinha ocupa a faixa toda da coluna`,
          repouso.caixinhaL >= repouso.colunaL - 2,
          { caixinha: repouso.caixinhaL, coluna: repouso.colunaL });
        ok(`${largura}/${opcao}: e é a peça da caixinha, não um botão grande`,
          repouso.caixinhaA >= 40 && repouso.caixinhaA <= 90, repouso.caixinhaA);
        ok(`${largura}/${opcao}: tem o «?» e o rótulo em versalete da peça`,
          repouso.temQ && repouso.caixinhaNegrito === '700', repouso.caixinhaNegrito);
      }
      /* A FICHA EM BRANCO ESTÁ SEMPRE À VISTA, nos três — foi o que o pedido exigiu. */
      ok(`${largura}/${opcao}: «ver a ficha em branco» está à vista em repouso`,
        repouso.fichaVisivel, repouso.fichaVisivel);
      /* E EM B AS ACÇÕES TAMBÉM. Em A e em C elas vivem dentro de algo fechado: é o custo. */
      if (opcao === 'A') {
        /* O CUSTO DECLARADO DA OPÇÃO ESCOLHIDA: em repouso, criar exige abrir o painel. */
        ok(`${largura}/A: as acções de criar estão dentro do painel (é o custo da opção)`,
          repouso.acoesPintadas === 0 && aberto.acoesPintadas >= 1,
          { repouso: repouso.acoesPintadas, aberto: aberto.acoesPintadas });
      } else {
        /* B e C põem-nas à vista: é a diferença que as separa de A. */
        ok(`${largura}/${opcao}: as acções de criar estão à vista em repouso`,
          repouso.acoesPintadas >= 1, repouso.acoesPintadas);
      }
      ok(`${largura}/${opcao}: nenhum botão de acção sai cortado`, !aberto.acoesCortadas, true);
      ok(`${largura}/${opcao}: nenhum alvo abaixo de 28px`, aberto.alvosPequenos.length === 0,
        aberto.alvosPequenos);
    }
  }

  /* ═══ A PROVA DE QUE É A MESMA PEÇA ═══
   * O pedido foi «o botão de expandir o acordeão ... do mesmo estilo do botão chamado Turma». Isso
   * é uma afirmação sobre o DESENHO, e ou se mede, ou se acha. Comparam-se as nove propriedades
   * que fazem a caixinha ser a caixinha — fundo, borda, raio, espaçamento, família, e as três do
   * rótulo em versalete — entre o `summary` do painel e uma caixa do cartão. */
  console.log('\n— a caixinha do ato é a MESMA peça do «Turma»? —');
  {
    await page.setViewport({ width: 1280, height: 1200 });
    await page.goto(ARQ, { waitUntil: 'load' });
    await page.evaluate(() => { window.aoTrocarOpcao('A'); document.getElementById('bancada').hidden = true;
      document.getElementById('painel-ato').open = false; });
    await assentar(page);
    const pega = await page.evaluate(() => {
      const ler = (el) => {
        const c = getComputedStyle(el);
        const k = getComputedStyle(el.querySelector('.trio-k'));
        return { fundo: c.backgroundColor, borda: c.borderTopColor + ' ' + c.borderTopWidth,
          raio: c.borderRadius, padding: c.padding, fonte: c.fontFamily,
          rotuloPeso: k.fontWeight, rotuloSize: k.fontSize, rotuloTransform: k.textTransform,
          temQ: !!el.querySelector('.trio-q') };
      };
      return { caixinha: ler(document.querySelector('summary.trio-item')),
        turma: ler(document.querySelector('li.trio-plano:not(.contexto-cartao) .trio-item')) };
    });
    const propriedades = Object.keys(pega.caixinha);
    const diferentes = propriedades.filter((k) =>
      JSON.stringify(pega.caixinha[k]) !== JSON.stringify(pega.turma[k]));
    ok('a caixinha do ato tem as 9 propriedades da caixa «Turma»', diferentes.length === 0, diferentes);
    for (const k of propriedades) {
      console.log('   ' + (diferentes.indexOf(k) === -1 ? '=' : '≠') + ' ' + k.padEnd(16)
        + JSON.stringify(pega.caixinha[k]));
    }
  }

  console.log('\nlarg  op  caixinha      repouso  aberto  ficha  acções(rep/abr)  estouro');
  for (const l of linhas) {
    console.log(String(l.largura).padEnd(6) + l.opcao.padEnd(4)
      + String(l.repouso.caixinhaL + '×' + l.repouso.caixinhaA).padEnd(14)
      + String(l.repouso.antes + 'px').padEnd(9) + String(l.aberto.antes + 'px').padEnd(8)
      + String(l.repouso.fichaVisivel ? 'sim' : 'NÃO').padEnd(7)
      + String(l.repouso.acoesPintadas + ' / ' + l.aberto.acoesPintadas).padEnd(18)
      + (l.aberto.estouro || 'não'));
  }

  ok('nenhum erro de JavaScript em nenhuma das páginas', errosDeJs.length === 0, errosDeJs);
  console.log('\n   ' + (errosDeJs.length ? 'FALHA' : 'ok')
    + '    nenhum erro de JavaScript em nenhuma das páginas'
    + (errosDeJs.length ? ': ' + errosDeJs.join(' · ') : ''));

  await browser.close();
  if (faltas.length) { console.log('\nFALHAS:'); faltas.forEach((f) => console.log('  · ' + f)); process.exit(1); }
  console.log('\nTUDO CERTO — ' + verdes + ' verificações em ' + (LARGURAS.length * OPCOES.length) + ' combinações.');
})();
