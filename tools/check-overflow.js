#!/usr/bin/env node
/**
 * check-overflow.js — valida se o conteudo de cada slide cabe na area util do Marp (1280x720).
 *
 * Uso:
 *   cd /home/mti/bibTex/danca
 *   node tools/check-overflow.js                      # usa out/apresentacao-ballet.html
 *   node tools/check-overflow.js caminho/do/deck.html
 *
 * Antes de rodar, gere o HTML:
 *   marp apresentacao-ballet.md --html -o out/apresentacao-ballet.html
 *
 * Requer Chrome/Chromium (usa o puppeteer-core que vem com o marp-cli global).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MARP_CLI = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
const puppeteer = require(path.join(MARP_CLI, 'node_modules', 'puppeteer-core'));

const raiz = path.resolve(__dirname, '..');
const APRESENTACAO = process.env.APRESENTACAO || path.join(raiz, 'apresentacoes', 'apresentacao-01-rizoma');
const html = path.resolve(process.argv[2] || path.join(APRESENTACAO, 'out', 'apresentacao-ballet.html'));
if (!fs.existsSync(html)) {
  console.error(`HTML nao encontrado: ${html}\nRode: marp apresentacao-ballet.md --html -o out/apresentacao-ballet.html`);
  process.exit(1);
}

const executablePath =
  process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));

const LIMITE = 720 - 66; // area util do Marp: altura do slide menos o padding-bottom

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(`file://${html}`, { waitUntil: 'networkidle0' });

  const rows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('section')).map((s, i) => {
      const sr = s.getBoundingClientRect();
      const scale = sr.height / 720;
      // limite por slide: o padding-bottom pode ser redefinido por classes (ex.: _class: map)
      const padBottom = parseFloat(getComputedStyle(s).paddingBottom) * scale;
      const limite = sr.bottom - padBottom;
      const conteudo = Array.from(s.children).filter(
        (el) => el.tagName !== 'HEADER' && el.tagName !== 'FOOTER'
      );
      const ultimo = conteudo[conteudo.length - 1];
      const fim = ultimo ? Math.round((ultimo.getBoundingClientRect().bottom - sr.top) / scale) : 0;
      return {
        page: i + 1,
        fim,
        limite: Math.round(sr.height / scale - padBottom / scale),
        sobra: Math.round((limite - (ultimo ? ultimo.getBoundingClientRect().bottom : sr.bottom)) / scale),
        titulo: (s.querySelector('h1,h2')?.textContent || '').trim().slice(0, 40),
      };
    });
  });

  rows.forEach((r) =>
    console.log(
      `slide ${String(r.page).padStart(2, '0')} | y final ${String(r.fim).padStart(3)} | sobra ${String(
        r.sobra
      ).padStart(4)} px${r.sobra < 0 ? '  <== ESTOURA (reduza o texto ou use _class: denser)' : ''} | ${r.titulo}`
    )
  );

  const bad = rows.filter((r) => r.sobra < 0);
  console.log(`\nslides: ${rows.length} | com overflow: ${bad.length} | limite por slide (720 - padding-bottom de cada classe)`);
  await browser.close();
  process.exit(bad.length ? 1 : 0);
})();
