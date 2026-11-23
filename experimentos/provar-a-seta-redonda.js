#!/usr/bin/env node
'use strict';

/**
 * provar-a-seta-redonda.js — A SETA DE ABRIR E FECHAR, E O PRIMEIRO ABERTO (22/11/2026).
 *
 * O QUE ELA PEDIU, e é uma regra de identidade e não um ajuste de gosto:
 *
 *   «Nos bastidores, tem nas salas, no professores, alunos, na audição, nós temos a seta […] Ele é
 *   maior, ele é grande, ele é redondo, tem uma borda redonda e tal. Vamos adotar isso como padrão
 *   […] onde é que vai ser padrão esse botão? Nesses títulos que a gente tem no contexto […] E aí
 *   começa com todos eles colapsados, exceto o primeiro.»
 *
 * O QUE MUDA, e são duas coisas de naturezas diferentes:
 *
 *   1. A PEÇA. A seta dos títulos do pacote deixa de ser um glifo solto de 13px e passa a ser a
 *      redonda de 2rem dos Bastidores — a mesma, medida a mesma.
 *   2. O ESTADO INICIAL. O documento abre com o PRIMEIRO título aberto e todos os outros fechados,
 *      e não com tudo aberto. A memória da sessão continua a mandar depois do primeiro gesto.
 *
 * O QUE SE MEDE, e cada asserção existe porque a sua negação é um defeito que se vê:
 *
 *   A. A GEOMETRIA — no navegador, na página de verdade. O lado é 32px nas duas dimensões (é
 *      redonda), o raio é ≥ metade do lado (999px computa em círculo), o filete existe e tem 1px,
 *      e o fundo não é transparente (a peça tem caixa, ao contrário do glifo que lá estava).
 *   B. O ESTADO — o primeiro aberto, os outros fechados, em QUATRO documentos (o plano, a aula, a
 *      notação e o glossário): a regra é do documento, e não de uma página.
 *   C. O GESTO — clicar abre e fecha, a memória sobrevive ao recarregamento, e o índice abre uma
 *      secção fechada (senão metade do índice não leva a lado nenhum).
 *   D. O PAPEL — no `print` a peça não se imprime e as secções saem inteiras.
 *
 * CONTROLE NEGATIVO: o mesmo código corrido contra o pacote do commit anterior ao desta mudança —
 * lá a seta tem 13px de altura, fundo transparente e raio zero, e o documento abre com TUDO
 * aberto. É o artefacto, não uma reconstrução: o `plano.html` é saída versionada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-a-seta-redonda.js
 *   node experimentos/provar-a-seta-redonda.js --contra=22354d71
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { execSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const PACOTE = path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa');
const CONTRA = (process.argv.find((x) => x.indexOf('--contra=') === 0) || '').split('=')[1] || '';

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 320)));
}

/** O pacote servido de uma pasta — a do repositório, ou a de um commit extraído. */
function servir(pasta) {
  const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0].split('#')[0];
    let arquivo = path.join(pasta, caminho);
    if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, 'index.html');
    if (!fs.existsSync(arquivo)) { res.writeHead(404); res.end(''); return; }
    res.writeHead(200, { 'content-type': tipos[path.extname(arquivo)] || 'application/octet-stream',
      'cache-control': 'no-store' });
    res.end(fs.readFileSync(arquivo));
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1',
    () => ok({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

/** A geometria e o estado das secções, lidos do que está à vista. */
const MEDIR = () => {
  const botoes = [...document.querySelectorAll('.conteudo > h2[id] .secao-dobra')];
  const primeiro = botoes[0] || null;
  const estilo = primeiro ? getComputedStyle(primeiro) : null;
  const r = primeiro ? primeiro.getBoundingClientRect() : null;
  const secoes = [...document.querySelectorAll('.conteudo > h2[id]')].map((h2) => ({
    id: h2.id,
    aberta: (() => {
      const c = document.getElementById('secao-corpo-' + h2.id);
      return c ? c.getAttribute('data-recolhido') !== 'sim' : null;
    })(),
  }));
  return {
    temBotao: !!primeiro,
    botoes: botoes.length,
    lado: r ? { largura: Math.round(r.width), altura: Math.round(r.height) } : null,
    raio: estilo ? estilo.borderTopLeftRadius : null,
    filete: estilo ? `${estilo.borderTopWidth} ${estilo.borderTopStyle}` : null,
    fundo: estilo ? estilo.backgroundColor : null,
    glifo: primeiro ? (primeiro.textContent || '').trim() : '',
    secções: secoes.length,
    abertas: secoes.filter((s) => s.aberta).map((s) => s.id),
    fechadas: secoes.filter((s) => s.aberta === false).map((s) => s.id),
    // A altura do título: mede-se o crescimento que a peça provoca, e diz-se o número.
    alturaDoTitulo: (() => {
      const h2 = document.querySelector('.conteudo > h2[id]');
      return h2 ? Math.round(h2.getBoundingClientRect().height) : null;
    })(),
  };
};

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-a-seta-redonda: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-a-seta-redonda: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  let pasta = PACOTE;
  let temporario = null;
  if (CONTRA) {
    /* O PACOTE DO COMMIT, e não o de hoje: é o artefacto que a pessoa via antes desta mudança. */
    temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'seta-'));
    execSync('git archive ' + CONTRA + ' professores/demi-plie/ciclos/ciclo-01-breu-rosa | tar -x -C ' + temporario,
      { cwd: RAIZ, stdio: 'pipe' });
    pasta = path.join(temporario, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa');
  }

  const br = await puppeteer.launch({
    executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const pg = await br.newPage();
  await pg.setViewport({ width: 1280, height: 900 });
  const avaliar = async (fn, arg) => {
    try { return await pg.evaluate(fn, arg); } catch (e) { return { erro: String((e && e.message) || e) }; }
  };
  const abrir = async (base, pagina) => {
    await pg.goto(base + '/' + pagina, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 320));
  };

  const servico = await servir(pasta);

  /* ═══════════════ A · A GEOMETRIA — a peça, medida no navegador ═══════════════ */

  console.log('\nA · A GEOMETRIA — a redonda de 2rem, e não o glifo de 13px');
  await abrir(servico.base, 'plano.html');
  const g = await avaliar(MEDIR);
  provar('o plano tem os botões de abrir e fechar nos seus títulos',
    g.temBotao === true && g.botoes >= 8, { botoes: g.botoes });
  provar('a peça tem 32×32px (é a `.alternar-form` dos Bastidores, não uma parecida)',
    g.lado && g.lado.largura === 32 && g.lado.altura === 32, g.lado);
  provar('…é REDONDA: o raio computado é metade do lado',
    g.raio && parseFloat(g.raio) >= 16, g.raio);
  provar('…tem MOLDURA de 1px (o glifo de antes não tinha caixa nenhuma)',
    g.filete === '1px solid', g.filete);
  provar('…e fundo de superfície, não transparente', g.fundo && g.fundo !== 'rgba(0, 0, 0, 0)', g.fundo);
  provar('o glifo é a seta, e não uma palavra («▸»/«▾»)',
    g.glifo === '\u25BE' || g.glifo === '\u25B8', g.glifo);
  console.log(`        (medido: o título com a seta tem ${g.alturaDoTitulo}px de altura)`);

  /* ═══════════════ B · O ESTADO — o primeiro aberto, os outros fechados ═══════════════ */

  console.log('\nB · O ESTADO — «começa com todos colapsados, exceto o primeiro»');
  provar('o plano abre com UMA secção aberta', g.abertas.length === 1, g.abertas);
  /* E É A PRIMEIRA DO DOCUMENTO — o `id` do primeiro `<h2>` é o que tem de estar na lista. */
  const primeiroId = await avaliar(() => {
    const h2 = document.querySelector('.conteudo > h2[id]');
    return h2 ? h2.id : null;
  });
  provar('…e é a PRIMEIRA do documento (' + primeiroId + ')',
    g.abertas.length === 1 && g.abertas[0] === primeiroId, { abertas: g.abertas, primeiroId });
  provar('todas as outras estão fechadas', g.fechadas.length === g.secções - 1,
    { secções: g.secções, fechadas: g.fechadas.length });

  /* A MESMA REGRA NOS QUATRO DOCUMENTOS que ela nomeou: o plano, a aula, a notação e o glossário. */
  for (const pagina of ['aula-02.html', 'notacao.html', 'glossario-codigo_de_danca.html']) {
    await abrir(servico.base, pagina);
    const e = await avaliar(MEDIR);
    const primeira = await avaliar(() => {
      const h2 = document.querySelector('.conteudo > h2[id]');
      const c = h2 ? document.getElementById('secao-corpo-' + h2.id) : null;
      return { id: h2 ? h2.id : null, aberta: c ? c.getAttribute('data-recolhido') !== 'sim' : null };
    });
    provar(`${pagina}: abre com o primeiro título aberto e o resto fechado`,
      primeira.aberta === true && e.fechadas.length === e.secções - 1,
      { primeiro: primeira, secções: e.secções, fechadas: e.fechadas.length });
  }

  /* ═══════════════ C · O GESTO — abrir, fechar, lembrar, e o índice ═══════════════ */

  console.log('\nC · O GESTO — clicar, lembrar, e o índice abrir o que está fechado');
  await abrir(servico.base, 'plano.html');
  const antesDoClique = await avaliar(() => {
    const b = document.querySelectorAll('.conteudo > h2[id] .secao-dobra')[1];
    const h2 = b.closest('h2');
    return { id: h2.id, rotulo: b.getAttribute('aria-label'), expandido: b.getAttribute('aria-expanded') };
  });
  provar('a segunda secção nasce fechada, e o botão DIZ isso (`aria-expanded=false`)',
    antesDoClique.expandido === 'false' && /Mostrar /.test(antesDoClique.rotulo || ''), antesDoClique);

  await pg.click('.conteudo > h2[id]:nth-of-type(1) .secao-dobra').catch(() => {});
  const depois = await avaliar((id) => {
    const b = document.querySelectorAll('.conteudo > h2[id] .secao-dobra')[1];
    b.click();
    const c = document.getElementById('secao-corpo-' + b.closest('h2').id);
    return { id: b.closest('h2').id, aberta: c.getAttribute('data-recolhido') !== 'sim',
      expandido: b.getAttribute('aria-expanded'), rotulo: b.getAttribute('aria-label'),
      glifo: (b.textContent || '').trim() };
  }, antesDoClique.id);
  provar('clicar abre a secção, e o botão passa a «Recolher» com a seta para baixo',
    depois.aberta === true && depois.expandido === 'true' && /Recolher /.test(depois.rotulo || '')
    && depois.glifo === '\u25BE', depois);

  await pg.reload({ waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 320));
  const lembrado = await avaliar(() => {
    const c = document.getElementById('secao-corpo-' + document.querySelectorAll('.conteudo > h2[id]')[1].id);
    return { aberta: c.getAttribute('data-recolhido') !== 'sim' };
  });
  provar('a escolha sobrevive ao recarregamento (a memória da sessão)', lembrado.aberta === true, lembrado);

  /* O ÍNDICE MANDA. Um link do índice para uma secção fechada tem de a abrir — senão metade do
     índice não leva a lado nenhum, e o sintoma é «cliquei e não aconteceu nada». */
  await abrir(servico.base, 'plano.html');
  await avaliar(() => { try { sessionStorage.clear(); } catch (e) {} });
  await pg.reload({ waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 320));
  const doIndice = await avaliar(() => {
    const alvo = [...document.querySelectorAll('.toc-local a[href^="#"]')]
      .map((a) => a.getAttribute('href').slice(1))
      .find((id) => {
        const c = document.getElementById('secao-corpo-' + id);
        return c && c.getAttribute('data-recolhido') === 'sim';
      });
    if (!alvo) return { achou: false };
    const c = document.getElementById('secao-corpo-' + alvo);
    const a = document.querySelector('.toc-local a[href="#' + alvo + '"]');
    a.click();
    return { achou: true, id: alvo, aberta: c.getAttribute('data-recolhido') !== 'sim' };
  });
  provar('um link do índice abre a secção que estava fechada', doIndice.achou && doIndice.aberta === true,
    doIndice);

  /* ═══════════════ E · A JANELA NÃO É CONTEÚDO DE SECÇÃO ═══════════════
   *
   * O DEFEITO QUE ESTA SECÇÃO GUARDA, e ele nasceu com a regra do primeiro aberto. O diálogo que
   * cria a aula é a última coisa do plano, depois do último `<h2>` — e a dobra apanha «tudo o que
   * vem depois do título até ao título seguinte». Com as secções a nascer ABERTAS, o diálogo
   * engolido não se notava. Com elas a nascer FECHADAS, `#criar-aula` ficou dentro de uma caixa
   * `display:none`, e o botão «Criar» deixou de ser clicável: o sintoma lido em voz alta é «o modal
   * abriu e não responde».
   *
   * Mede-se o que o browser faz: o diálogo ABERTO pelo endereço (`?criar-aula=03`) tem de estar à
   * vista, e o botão «Criar» tem de ser clicável de facto — a mesma pergunta que o
   * `provar-a-musica-do-modal` faz ao clicar. */

  console.log('\nE · A JANELA — o diálogo de criar a aula não é engolido por uma secção');
  await abrir(servico.base, 'plano.html?criar-aula=03');
  const janela = await avaliar(() => {
    const m = document.getElementById('criar-aula');
    if (!m) return { existe: false };
    const caixa = m.querySelector('.modal-caixa');
    const b = document.getElementById('criar-aula-guardar');
    const r = b ? b.getBoundingClientRect() : null;
    return {
      existe: true,
      dentroDeSecao: !!m.closest('.secao-corpo'),
      aberto: !m.hidden,
      alturaDaCaixa: caixa ? Math.round(caixa.getBoundingClientRect().height) : 0,
      botaoNaTela: r ? r.width > 0 && r.height > 0 : false,
    };
  });
  provar('o diálogo de criar a aula existe no plano', janela.existe === true, janela);
  provar('…e NÃO está dentro do corpo de uma secção (senão a dobra esconde-o)',
    janela.dentroDeSecao === false, janela);
  provar('…abre pelo endereço, e o botão «Criar» tem tamanho na tela',
    janela.aberto === true && janela.botaoNaTela === true, janela);

  /* ═══════════════ D · O PAPEL ═══════════════ */

  console.log('\nD · O PAPEL — a peça não se imprime e as secções saem inteiras');
  await abrir(servico.base, 'plano.html');
  await pg.emulateMediaType('print');
  const papel = await avaliar(() => {
    const b = document.querySelector('.conteudo > h2[id] .secao-dobra');
    const c = document.querySelector('.secao-corpo');
    return {
      botaoVisivel: b ? getComputedStyle(b).display !== 'none' : null,
      corpoVisivel: c ? getComputedStyle(c).display !== 'none' : null,
    };
  });
  provar('no papel o botão não se imprime', papel.botaoVisivel === false, papel);
  provar('…e uma secção fechada sai inteira (o documento não mente no PDF)',
    papel.corpoVisivel === true, papel);
  await pg.emulateMediaType(null);

  await br.close();
  servico.srv.close();
  if (temporario) fs.rmSync(temporario, { recursive: true, force: true });

  if (CONTRA) {
    console.log('\n' + (falhas ? 'CONTROLE CONFORME — ' : 'CONTROLE SUSPEITO — ') + falhas + ' de '
      + total + ' asserções falham com o pacote de ' + CONTRA + '.');
    process.exit(falhas ? 0 : 1);
  }

  console.log('');
  if (falhas) { console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.'); process.exit(1); }
  console.log('TUDO CERTO — ' + total + ' asserções: a seta dos títulos é a redonda de 2rem dos '
    + 'Bastidores (32×32, raio de metade, filete de 1px, com fundo), os quatro documentos abrem com '
    + 'o PRIMEIRO título aberto e todos os outros fechados, o gesto abre e fecha, a memória da sessão '
    + 'sobrevive ao recarregamento, o índice abre o que estava fechado, a janela de criar a aula não '
    + 'é engolida por uma secção, e no papel a peça não se imprime e as secções saem inteiras.');
})();
