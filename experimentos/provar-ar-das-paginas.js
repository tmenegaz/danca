#!/usr/bin/env node
'use strict';

/**
 * provar-ar-das-paginas.js — o ar das nove páginas de um pacote, medido em navegador.
 *
 * PORQUE EXISTE (06/11/2026). A pesquisadora pediu a auditoria, depois de o respiro do cabeçalho
 * do plano da Aula 01 ter sido corrigido:
 *
 *   «Uma vez que o padrão de espaçamento, margens, respiros e alinhamentos foi corrigido e
 *    validado no Plano de Aula 1, o mesmo rigor de identidade visual deve se estender e estar
 *    perfeitamente aplicado aos demais motores de geração e páginas correlatas.»
 *
 * A pergunta dela é de COMPARAÇÃO, e comparação de geometria não se responde lendo o CSS: um
 * `padding: 0 24px` numa regra de faixa anula o `padding: 16px` de uma peça que vem depois no
 * arquivo, se a faixa tiver mais peso. Foi o que estava a acontecer ao rodapé — o texto a 5px do
 * próprio filete e o filete a 0,4px do último parágrafo —, e nenhuma captura de perto o mostrava.
 *
 * O QUE SE MEDE, em cada uma das nove páginas, a 1280 e a 390:
 *
 *   1. o ar do cabeçalho: da barra ao `h1`, e do último controlo à linha da sombra;
 *   2. o ar DEPOIS da faixa: da linha ao primeiro bloco da coluna de leitura — e é o MESMO em
 *      todas as páginas. Era 32px nos documentos que abrem por `##` e 8px nos que abrem por prosa;
 *   3. o ar do RODAPÉ: do conteúdo ao filete, e do filete ao texto;
 *   4. nada colado: nenhum par de irmãos visíveis com 0px entre eles;
 *   5. nenhuma página estoura na horizontal.
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-ar-das-paginas.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');

let puppeteer;
try {
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
} catch {
  console.error('provar-ar-das-paginas: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
  process.exit(1);
}
const executavel = process.env.CHROME_PATH
  || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
if (!executavel) {
  console.error('provar-ar-das-paginas: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
  process.exit(1);
}

/* O PACOTE É DESCOBERTO, não nomeado (21/10/2026) — ver `lib-pacote.js`. */
const { umPacote } = require('./lib-pacote.js');
const PACOTE = umPacote();

/* AS NOVE PÁGINAS. Não se lista o que existe por acaso: a lista é a do pacote, filtrada pelo que
 * o gerador produz, e a prova exige as SETE de documento — as duas restantes (o índice e a folha
 * de captura) entram quando existem. Uma página nova não fica de fora por esquecimento: o que se
 * exige é o conjunto mínimo, e o resto é medido também. */
const OBRIGATORIAS = ['plano', 'aula-01', 'notacao', 'referencias', 'glossario-benesh', 'harmonizacao', 'index'];
const paginas = fs.readdirSync(path.join(raiz, PACOTE))
  .filter((n) => /\.html$/.test(n))
  .map((n) => n.replace(/\.html$/, ''))
  .filter((n) => !['lancamento'].includes(n)) // o lançamento não é documento: é um formulário
  .sort();

const faltando = OBRIGATORIAS.filter((n) => !paginas.includes(n));
if (faltando.length) {
  console.error('provar-ar-das-paginas: o pacote «' + PACOTE + '» não tem ' + faltando.join(', ')
    + ' — sem elas não há o que comparar. NÃO FEITO.');
  process.exit(1);
}

/*
 * SERVIDOR ESTÁTICO com os assets apontados para a FONTE — o mesmo cuidado do
 * `provar-titulo-e-barra`: a página pede `assets/style.css`, e o que se quer medir é o arquivo
 * que o gerador copia, e não uma cópia que pode estar velha.
 */
const MAPA = { 'assets/style.css': 'tools/templates/ciclo.css', 'assets/nav.js': 'tools/templates/nav.js' };
function servir() {
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const assets = rel.match(/(?:^|\/)assets\/(style\.css|nav\.js)$/);
    const alvo = [assets ? MAPA['assets/' + assets[1]] : MAPA[rel], rel, path.join(PACOTE, rel)]
      .filter(Boolean).map((x) => path.join(raiz, x))
      .find((x) => x.startsWith(raiz) && fs.existsSync(x) && !fs.statSync(x).isDirectory());
    if (!alvo) { res.writeHead(404); res.end('nao encontrado'); return; }
    const tipo = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8' }[path.extname(alvo)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
    res.end(fs.readFileSync(alvo));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/** Uma leitura só, para todas as páginas medirem a mesma coisa. */
const MEDIR = () => {
  const r2 = (n) => Math.round(n * 10) / 10;
  const barra = document.querySelector('.topnav');
  const cab = document.querySelector('header.doc') || document.querySelector('.titulo-fixo');
  const main = document.querySelector('main');
  const coluna = document.querySelector('.conteudo');
  const rodape = document.querySelector('footer.rodape') || document.querySelector('.rodape');
  const out = { estouro: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth) };

  if (barra && cab) {
    const h1 = cab.querySelector('h1');
    const controles = [...cab.querySelectorAll('a.acao, button')];
    const ultimo = controles.length ? controles[controles.length - 1] : cab.lastElementChild;
    const cx = cab.getBoundingClientRect();
    out.cabecalho = {
      vaoDaBarra: h1 ? r2(h1.getBoundingClientRect().top - barra.getBoundingClientRect().bottom) : null,
      vaoDoFundo: ultimo ? r2(cx.bottom - ultimo.getBoundingClientRect().bottom) : null,
      subtitulo: (() => { const s = cab.querySelector('.subtitulo'); return s ? s.textContent.trim() : null; })(),
    };
  }

  /* O AR DEPOIS DA FAIXA. Mede-se o primeiro bloco VISÍVEL da coluna de leitura, e não a caixa:
   * a caixa pode ter padding e o primeiro bloco margem, e é a soma que o olho lê. */
  if (cab && coluna) {
    const prim = [...coluna.children].find((e) => e.getBoundingClientRect().height > 0);
    out.depoisDaFaixa = prim
      ? { valor: r2(prim.getBoundingClientRect().top - cab.getBoundingClientRect().bottom),
          primeiro: prim.tagName + '.' + (prim.className || '') }
      : null;
  }

  if (rodape && main) {
    const cr = rodape.getBoundingClientRect();
    const primeiro = rodape.querySelector('p') || rodape.firstElementChild;
    out.rodape = {
      doConteudoAoFilete: r2(cr.top - main.getBoundingClientRect().bottom),
      doFileteAoTexto: primeiro ? r2(primeiro.getBoundingClientRect().top - cr.top) : null,
    };
  }

  /* NADA COLADO: irmãos visíveis, em fluxo, em que o fundo de um TOCA o topo do seguinte. */
  const colados = [];
  for (const pai of document.querySelectorAll('main, main .conteudo, header.doc, footer.rodape, .rodape')) {
    const filhos = [...pai.children].filter((e) => {
      const cs = getComputedStyle(e);
      return cs.display !== 'none' && e.getBoundingClientRect().height > 0
        && cs.position !== 'fixed' && cs.position !== 'sticky';
    });
    for (let i = 0; i < filhos.length - 1; i++) {
      const a = filhos[i].getBoundingClientRect();
      const b = filhos[i + 1].getBoundingClientRect();
      const vao = r2(b.top - a.bottom);
      if (Math.abs(vao) < 1) {
        colados.push({ pai: pai.className || pai.tagName,
          par: filhos[i].tagName + ' → ' + filhos[i + 1].tagName, vao });
      }
    }
  }
  out.colados = colados;
  return out;
};

(async () => {
  const { srv, base } = await servir();
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    if (!cond) falhas++;
    console.log((cond ? 'ok     ' : 'FALHA  ') + nome + (extra !== undefined ? ' → ' + JSON.stringify(extra) : ''));
  };

  const medidas = {};
  try {
    for (const [w, h] of [[1280, 900], [390, 844]]) {
      for (const nome of paginas) {
        const pg = await br.newPage();
        await pg.setViewport({ width: w, height: h });
        await pg.goto(`${base}/${nome}.html`, { waitUntil: 'load' });
        await new Promise((r) => setTimeout(r, 120));
        medidas[nome + '@' + w] = await pg.evaluate(MEDIR);
        await pg.close();
      }
    }
  } finally {
    await br.close();
    srv.close();
  }

  for (const [w] of [[1280], [390]]) {
    console.log('\n' + w + 'px — ' + paginas.length + ' páginas');
    const doCabecalho = paginas.map((n) => medidas[n + '@' + w].cabecalho).filter(Boolean);
    console.log('  ' + paginas.map((n) => {
      const m = medidas[n + '@' + w];
      return n + ' ' + (m.depoisDaFaixa ? m.depoisDaFaixa.valor : '—');
    }).join(' · '));

    provar('todas as páginas têm o cabeçalho com o mesmo ar: barra → título',
      doCabecalho.length === paginas.length && doCabecalho.every((c) => c.vaoDaBarra >= 12),
      doCabecalho.map((c) => c.vaoDaBarra));
    provar('…e o último controlo do cabeçalho não encosta na linha da sombra',
      doCabecalho.every((c) => c.vaoDoFundo >= 12),
      doCabecalho.map((c) => c.vaoDoFundo));

    /* O MESMO VÃO DEPOIS DA FAIXA, EM TODAS. É ESTA a asserção que a auditoria de 06/11/2026
     * criou: 32px nos documentos que abrem por `##` e 8px nos que abrem por prosa — dois valores
     * para o mesmo lugar, e a diferença só se vê quando se olham as páginas lado a lado. */
    const vaos = paginas.map((n) => (medidas[n + '@' + w].depoisDaFaixa || {}).valor);
    const distintos = [...new Set(vaos)];
    provar('o ar depois da faixa do cabeçalho é UM SÓ em todas as páginas (≥ 24px)',
      distintos.length === 1 && distintos[0] >= 24, { vaos, distintos });

    const rodapes = paginas.map((n) => medidas[n + '@' + w].rodape).filter(Boolean);
    provar('o filete do rodapé não encosta no último parágrafo (≥ 24px)',
      rodapes.length === paginas.length && rodapes.every((r) => r.doConteudoAoFilete >= 24),
      rodapes.map((r) => r.doConteudoAoFilete));
    provar('…e o texto do rodapé não encosta no filete (≥ 12px)',
      rodapes.every((r) => r.doFileteAoTexto >= 12), rodapes.map((r) => r.doFileteAoTexto));

    const comColados = paginas.filter((n) => medidas[n + '@' + w].colados.length);
    provar('nenhuma página tem dois blocos encostados (0px entre irmãos)',
      comColados.length === 0,
      comColados.map((n) => ({ pagina: n, colados: medidas[n + '@' + w].colados })));

    const comEstouro = paginas.filter((n) => medidas[n + '@' + w].estouro > 0);
    provar('nenhuma página estoura na horizontal', comEstouro.length === 0,
      comEstouro.map((n) => ({ pagina: n, estouro: medidas[n + '@' + w].estouro })));
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — o ar das ' + paginas.length + ' páginas do pacote é o mesmo: '
    + 'cabeçalho com 12px acima e abaixo, ' + paginas.length + ' páginas com o mesmo vão depois da '
    + 'faixa, rodapé com 24px antes do filete e 12px depois, nenhum par encostado e nenhum estouro.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
