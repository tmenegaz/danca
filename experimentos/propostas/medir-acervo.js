'use strict';
/* Mede a proposta 6 nas três opções, em quatro larguras. Bancada local, sem rede. */
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
  const ok = (t, c, d) => { if (!c) faltas.push(t + (d === undefined ? '' : ' → ' + JSON.stringify(d))); };
  const linhas = [];
  for (const largura of LARGURAS) {
    await page.setViewport({ width: largura, height: 900 });
    for (const opcao of OPCOES) {
      await page.goto(ARQ, { waitUntil: 'load' });
      await page.evaluate((o) => window.aoTrocarOpcao(o), opcao);
      await assentar(page);
      const m = await page.evaluate(() => {
        const doc = document.documentElement;
        const R = (el) => el ? el.getBoundingClientRect() : null;
        const visivel = (el) => { if (!el) return false; const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none'; };
        const painel = [...document.querySelectorAll('#painel-ato, .contexto-cartao')].filter(visivel)[0];
        const acoes = [...document.querySelectorAll('.acoes-do-ato')].filter(visivel);
        const cartao = document.querySelector('li.trio-plano:not(.contexto-cartao)');
        const nome = cartao.querySelector('.trio-nome');
        const botoes = cartao.querySelector('.trio-acoes');
        const primeiroAcao = acoes[0] ? R(acoes[0].querySelector('.acao')) : null;
        /* SÓ OS ALVOS VISÍVEIS. A primeira versão media também os botões da opção que está
           escondida, e reportava 0×0 como «alvo pequeno» — uma falha que não existe, a esconder a
           que existe. */
        const alvos = [...document.querySelectorAll('button.acao, a.acao, .nome-do-registo')]
          .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { l: Math.round(r.width), a: Math.round(r.height), txt: el.textContent.trim().slice(0, 18) };
          });
        return {
          estouro: Math.max(0, Math.round(doc.scrollWidth - doc.clientWidth)),
          painelAltura: painel ? Math.round(R(painel).height) : 0,
          painelTopo: painel ? Math.round(R(painel).top) : -1,
          acoesAltura: acoes.length ? Math.round(R(acoes[0]).height) : 0,
          acoesVisiveis: acoes.length,
          acoesLargura: primeiroAcao ? Math.round(primeiroAcao.width) : 0,
          acoesCortadas: acoes.length ? [...acoes[0].querySelectorAll('.acao')]
            .some((a) => a.scrollWidth > a.clientWidth + 1) : false,
          cartaoAltura: cartao ? Math.round(R(cartao).height) : 0,
          botoesQuebram: nome && botoes ? R(botoes).top >= R(nome).bottom - 1 : false,
          alvosPequenos: alvos.filter((a) => a.a < 28),
          // quanto da tela de 844 o campo e a lista ocupam antes do primeiro cartão
          antesDosCartoes: Math.round(R(document.querySelector('li.trio-plano:not(.contexto-cartao)')).top),
        };
      });
      linhas.push({ largura, opcao, ...m });
      ok(`${largura}/${opcao}: não estoura na horizontal`, m.estouro <= 1, m.estouro);
      ok(`${largura}/${opcao}: as acções de começar existem e são visíveis`, m.acoesVisiveis >= 1, m.acoesVisiveis);
      ok(`${largura}/${opcao}: nenhum botão de acção sai cortado`, !m.acoesCortadas, m.acoesCortadas);
      ok(`${largura}/${opcao}: nenhum alvo de toque abaixo de 28px`, m.alvosPequenos.length === 0, m.alvosPequenos);
      ok(`${largura}/${opcao}: o botão de acção tem largura de leitura`, m.acoesLargura >= 90, m.acoesLargura);
    }
  }
  /* ═══ O ESTADO QUE DECIDE: O PAINEL FECHADO ═══
   * Abertas, A e B medem o mesmo total — é a mesma matéria, arrumada de outra maneira. O que as
   * separa é o que se vê SEM ABRIR NADA, que é como a página se encontra em 99% das visitas de
   * quem só quer conferir uma ficha. */
  console.log('\n— fechado (o estado em que a página é encontrada) —');
  console.log('larg  op  acções à vista  altura até ao 1.º cartão  tela ocupada');
  const fechadas = [];
  for (const largura of LARGURAS) {
    await page.setViewport({ width: largura, height: 844 });
    for (const opcao of OPCOES) {
      await page.goto(ARQ, { waitUntil: 'load' });
      await page.evaluate((o) => window.aoTrocarOpcao(o), opcao);
      await assentar(page);
      const m = await page.evaluate(() => {
        const p = document.getElementById('painel-ato');
        if (p) p.open = false;
        /* UM `details` FECHADO NÃO TIRA A CAIXA AO CONTEÚDO — e a primeira versão desta medição
           acreditou que sim. O Chrome fecha o `details` com `content-visibility: hidden`, e o
           `getBoundingClientRect` de um descendente continua a devolver 314×202: a opção A dava
           «acções à vista», que é exactamente o que ela não tem. A pergunta certa não é «tem
           caixa?» — é «é visível para quem olha?». */
        const visivel = (el) => {
          if (!el || !el.getClientRects().length) return false;
          if (getComputedStyle(el).display === 'none') return false;
          if (el.closest('details:not([open])')) return false;
          return true;
        };
        const visiveis = [...document.querySelectorAll('.acoes-do-ato')].filter(visivel);
        const primeiro = document.querySelector('li.trio-plano:not(.contexto-cartao)');
        return {
          acoesVisiveis: visiveis.length,
          antes: Math.round(primeiro.getBoundingClientRect().top),
        };
      });
      fechadas.push({ largura, opcao, ...m });
      console.log(String(largura).padEnd(6) + opcao.padEnd(4)
        + (m.acoesVisiveis ? 'sim' : 'NÃO').padEnd(17)
        + String(m.antes + 'px').padEnd(29)
        + Math.round((m.antes / 844) * 100) + '%');
    }
  }
  /* E a asserção que traduz a decisão: no telemóvel, nenhuma opção pode esconder o gesto de criar
     sem que haja um caminho de UM toque até ele. Em A há um toque a mais (abrir o painel). */
  for (const f of fechadas.filter((x) => x.largura === 390)) {
    if (f.opcao === 'A') {
      ok('390/A fechado: o gesto de criar NÃO está à vista (é o custo da opção)',
        f.acoesVisiveis === 0, f.acoesVisiveis);
    } else {
      ok(`390/${f.opcao} fechado: o gesto de criar está à vista`, f.acoesVisiveis >= 1, f.acoesVisiveis);
    }
  }

  console.log('\nlarg  op  painel  acções  antes  cartão  topo-fora  acçõesQuebram  estouro');
  for (const l of linhas) {
    console.log(String(l.largura).padEnd(6) + l.opcao.padEnd(4)
      + String(l.painelAltura + 'px').padEnd(8) + String(l.acoesAltura + 'px').padEnd(8)
      + String(l.antesDosCartoes + 'px').padEnd(7) + String(l.cartaoAltura + 'px').padEnd(8)
      + String(l.acoesVisiveis === 2 ? 'sim' : 'não').padEnd(11)
      + String(l.botoesQuebram ? 'sim' : 'não').padEnd(14) + (l.estouro || 'não'));
  }
  await browser.close();
  if (faltas.length) { console.log('\nFALHAS:'); faltas.forEach((f) => console.log('  · ' + f)); process.exit(1); }
  console.log('\nTUDO CERTO — ' + (linhas.length * 5) + ' verificações em ' + (LARGURAS.length * OPCOES.length) + ' combinações.');
})();
