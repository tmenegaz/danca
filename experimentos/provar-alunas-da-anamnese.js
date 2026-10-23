'use strict';

/**
 * provar-alunas-da-anamnese.js — DE QUEM É A LISTA DE ALUNAS NA ANAMNESE (23/10/2026).
 *
 * O QUE ACONTECEU. Em produção, a escola `batata` tem três alunas (A, B, C) e três professores,
 * e cada professor tem **uma** curadoria com **uma** aluna. A dona do produto viu, na anamnese:
 *
 *     Café no Bulé  → Aluna A e Aluna B
 *     Manga Curta   → Aluna A
 *     Meia Cortada  → Aluna A e Aluna C
 *
 * A «Aluna A» aparecia em todos — e não devia, porque ela está curada ao Manga Curta e a mais
 * ninguém. Os dados de produção dizem: café-no-bule → `["Aluna B"]`, manga-curta → `["Aluna A"]`,
 * meia-cortada → `["Aluna C"]`.
 *
 * A REGRA (B2b, 13/10/2026) é: o seletor de alunas da anamnese **filtra pelas alunas que a
 * curadoria atribuiu** ao professor; sem curadoria nenhuma, mostra a lista inteira (é a porta
 * de entrada). A regra estava certa; o filtro é que era contornável.
 *
 * O DEFEITO. `carregarAlunas()` filtra e, DEPOIS de filtrar, re-acrescenta o valor que o
 * `select` já tinha (`atual`) e o `?aluna=` da URL:
 *
 *     const escolhida = atual || daUrl;
 *     if (escolhida && lista.indexOf(escolhida) === -1) lista = lista.concat([escolhida]);
 *
 * O comentário diz por que isto existe — «Se o apelido não estiver na lista (aluna ainda não
 * cadastrada na Produção), ele entra assim mesmo: foi o sistema que o mandou, e descartá-lo é o
 * defeito». O caso legítimo é a aluna que **não está no cadastro**. O que o código faz é outra
 * coisa: re-acrescenta **qualquer** valor ausente da lista filtrada — inclusive uma aluna que
 * está no cadastro e que a curadoria **não** autoriza. A «Aluna A» fica seleccionada de um
 * professor anterior (ou veio no `?aluna=`), e a partir daí viaja com todos.
 *
 * O QUE ESTA PROVA MEDE. A lista visível, no browser, com os três professores e as curadorias
 * reais de produção — e as duas maneiras de contornar o filtro:
 *
 *   1. a lista de cada professor é a das suas curadorias (o correcto);
 *   2. trocar de professor **não** arrasta a aluna do anterior;
 *   3. o `?aluna=` da URL **não** acrescenta uma aluna que a curadoria não autoriza;
 *   4. o caso legítimo do comentário continua a valer: uma aluna que **não está no cadastro**
 *      (o atalho do PO para uma anamnese que ainda não existe) entra assim mesmo.
 *
 * Bancada local: `http.createServer` numa porta efémera, `porta/index.html` servido com as
 * `/api/*` stubadas. **Nada toca no ar** — a cota do Cloudflare não se gasta a depurar.
 *
 *   node experimentos/provar-alunas-da-anamnese.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const PAGINA = path.join(raiz, 'porta', 'index.html');

const provas = [];
function provar(titulo, condicao, detalhe) {
  provas.push({ titulo, ok: !!condicao, detalhe });
  console.log('  ' + (condicao ? 'ok    ' : 'FALHOU') + ' ' + titulo +
    (condicao ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* AS CURADORIAS REAIS DA `batata`, lidas da API de produção em 23/10/2026. Não são inventadas:
 * é a forma exacta que o Worker devolve, para a prova medir o caso que aconteceu. */
const CURADORIAS = {
  'cafe-no-bule': [{
    id: 'cafe-no-bule-bale-classico-bale-nivel-2-teste-2',
    professor: 'cafe-no-bule', modalidade: 'Balé clássico', tradicao: 'Vaganova',
    turmas: ['Balé Nível 2 — Teste 2'], repertorio: [], alunas: ['Aluna B'],
  }],
  'manga-curta': [{
    id: 'manga-curta-bale-classico-bale-nivel-1-teste-2',
    professor: 'manga-curta', modalidade: 'Balé clássico', tradicao: 'Vaganova',
    turmas: ['Balé Nível 1 — Teste 2'], repertorio: [], alunas: ['Aluna A'],
  }],
  'meia-cortada': [{
    id: 'meia-cortada-bale-classico-bale-nivel-3-teste-2',
    professor: 'meia-cortada', modalidade: 'Balé clássico', tradicao: 'Vaganova',
    turmas: ['Balé Nível 3 — Teste 2'], repertorio: [], alunas: ['Aluna C'],
  }],
  // O professor SEM curadoria: é o caso da «porta de entrada», e fica na prova de propósito —
  // é a metade da regra que a dona do produto lembrou («qualquer professor pode fazer a
  // anamnese»), e a prova registra qual é o comportamento de hoje.
  'sem-curadoria': [],
};

const ALUNAS = ['Aluna A', 'Aluna B', 'Aluna C'];

const MAPA = {
  ok: true,
  nos: [{ id: 'contexto-aluna', campo: 'Aluna', obrigatorio: true }],
  obrigatorios: 1, respondidas: 0, total: 1, tituloCabecalho: 'Anamnese',
};

function servir() {
  const srv = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const caminho = decodeURIComponent(url.pathname);
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    const json = (obj) => ok('application/json', JSON.stringify(obj));

    /* A PÁGINA VEM EM TRÊS CAMINHOS (`/anamnese/`, `/plano-ensino/`, `/plano-observacao/`),
       porque a porta lê a FONTE do `location.pathname`. A prova precisa da anamnese. */
    if (caminho === '/anamnese/' || caminho === '/anamnese/index.html') {
      return ok('text/html; charset=utf-8', fs.readFileSync(PAGINA, 'utf8'));
    }
    if (/\/assets\/style\.css$/.test(caminho)) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css'), 'utf8'));
    }
    if (caminho === '/assets/nav.js') {
      return ok('text/javascript; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js'), 'utf8'));
    }
    /* O `assets/markdown.js` é RELATIVO à página (`<script src="assets/markdown.js">`), e a
       página é servida em `/anamnese/` — logo o browser pede `/anamnese/assets/markdown.js`.
       Sem ele o `Markdown` não existe, o handler da troca de professor rebenta num `md()` e a
       prova mediria uma página partida em vez da regra. Foi o que aconteceu à primeira versão. */
    if (/\/assets\/markdown\.js$/.test(caminho)) {
      return ok('text/javascript; charset=utf-8', fs.readFileSync(path.join(raiz, 'porta/assets/markdown.js'), 'utf8'));
    }
    if (caminho.indexOf('/api/mapa') !== -1) return json(MAPA);
    if (caminho.endsWith('/api/bastidores/professores')) {
      return json({
        ok: true, escola: 'batata',
        professores: [
          { nome: 'Café no Bulé', slug: 'cafe-no-bule' },
          { nome: 'Manga Curta', slug: 'manga-curta' },
          { nome: 'Meia Cortada', slug: 'meia-cortada' },
          { nome: 'Sem Curadoria', slug: 'sem-curadoria' },
        ],
      });
    }
    if (caminho.endsWith('/api/bastidores/alunas')) return json({ ok: true, alunas: ALUNAS });
    if (caminho.indexOf('/api/bastidores/curadoria-professor') !== -1) {
      const slug = url.searchParams.get('professor') || '';
      return json({ ok: true, escola: 'batata', professor: slug, curadorias: CURADORIAS[slug] || [] });
    }
    if (caminho.endsWith('/api/envelopes')) return json({ ok: true, envelopes: [] });
    if (caminho.endsWith('/api/anamnese-estados')) return json({ ok: true, estados: {} });
    if (caminho.endsWith('/api/bastidores/validar-senha')) return json({ ok: true });
    if (caminho.indexOf('/api/') !== -1) return json({ ok: true });
    res.writeHead(404); res.end('nao encontrado');
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({
    srv, base: 'http://127.0.0.1:' + srv.address().port,
  })));
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-alunas-da-anamnese: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-alunas-da-anamnese: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  const { srv, base } = await servir();
  const navegador = await puppeteer.launch({
    executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1280, height: 900 });

  /** As opções do seletor de alunas, sem o «— nenhuma —». */
  const alunasVisiveis = () => pagina.evaluate(() => {
    const sel = document.getElementById('ctx-aluna');
    return [...sel.querySelectorAll('option')].map((o) => o.value).filter(Boolean);
  });

  /** Abre a anamnese já com um professor escolhido, e espera a curadoria chegar. */
  const abrir = async (slug, extra) => {
    await pagina.goto(base + '/anamnese/?escola=batata&professor=' + slug + (extra || ''),
      { waitUntil: 'load' });
    await pagina.waitForFunction(() => {
      const sel = document.getElementById('ctx-aluna');
      return sel && sel.querySelectorAll('option').length > 0;
    }, { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 250));
  };

  console.log('\n1 · Cada professor vê as alunas que a curadoria lhe atribuiu');
  for (const [slug, esperado, nome] of [
    ['cafe-no-bule', ['Aluna B'], 'Café no Bulé'],
    ['manga-curta', ['Aluna A'], 'Manga Curta'],
    ['meia-cortada', ['Aluna C'], 'Meia Cortada'],
  ]) {
    await abrir(slug);
    const vistas = await alunasVisiveis();
    provar(nome + ' vê só ' + JSON.stringify(esperado), JSON.stringify(vistas) === JSON.stringify(esperado),
      vistas);
  }

  console.log('\n2 · Trocar de professor não arrasta a aluna do anterior');
  /* A SEQUÊNCIA DO DEFEITO. Escolhe-se a aluna do Manga (A), troca-se para o Café (que só tem
     B) — e a A não pode continuar na lista. Era assim que ela viajava entre os três. */
  await abrir('manga-curta');
  await pagina.evaluate(() => {
    const sel = document.getElementById('ctx-aluna');
    sel.value = 'Aluna A';
    document.getElementById('ctx-professor').value = 'cafe-no-bule';
    document.getElementById('ctx-professor').dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 400));
  const depoisDaTroca = await alunasVisiveis();
  provar('depois de trocar Manga → Café, a lista é só ["Aluna B"]',
    JSON.stringify(depoisDaTroca) === JSON.stringify(['Aluna B']), depoisDaTroca);

  console.log('\n3 · O `?aluna=` da URL não autoriza ninguém');
  /* O ATALHO DO PO (`/anamnese/?…&aluna=Aluna A`) existe para não obrigar a escolher de novo.
     Mas ele chega com o professor do PO, e uma aluna que a curadoria daquele professor não
     autoriza não pode entrar só porque veio no endereço. */
  await abrir('cafe-no-bule', '&aluna=Aluna%20C');
  const comAtalho = await alunasVisiveis();
  provar('com `?aluna=Aluna C`, o Café continua a ver só a dele',
    JSON.stringify(comAtalho) === JSON.stringify(['Aluna B']), comAtalho);

  console.log('\n4 · O caso legítimo continua: aluna fora do cadastro entra assim mesmo');
  /* O comentário do código diz por que a re-inclusão existe: «aluna ainda não cadastrada na
     Produção». Se o atalho traz um apelido que NÃO está no cadastro da escola, descartá-lo
     deixaria o professor sem a aluna que o sistema lhe mandou observar. Esse caso fica. */
  await abrir('cafe-no-bule', '&aluna=Aluna%20Nova');
  const foraDoCadastro = await alunasVisiveis();
  provar('a aluna que não está no cadastro entra na lista (o atalho não é descartado)',
    foraDoCadastro.indexOf('Aluna Nova') !== -1 && foraDoCadastro.indexOf('Aluna B') !== -1,
    foraDoCadastro);

  console.log('\n5 · O professor sem curadoria vê a escola inteira (a «porta de entrada»)');
  /* Esta é a metade da regra que a dona do produto lembrou — «qualquer professor pode fazer a
     anamnese». Ela continua valendo: sem curadoria atribuída, a lista é a da escola. O que a
     prova registra é que a regra do filtro depende de existir curadoria. */
  await abrir('sem-curadoria');
  const semCuradoria = await alunasVisiveis();
  provar('sem curadoria, a lista é a da escola inteira',
    JSON.stringify(semCuradoria) === JSON.stringify(ALUNAS), semCuradoria);

  await navegador.close();
  srv.close();

  const falhou = provas.filter((p) => !p.ok).length;
  console.log('\nprovar-alunas-da-anamnese: ' + (provas.length - falhou) + ' de ' + provas.length + ' passaram');
  process.exit(falhou ? 1 : 0);
})().catch((e) => {
  console.error('provar-alunas-da-anamnese: ' + (e && e.message));
  process.exit(1);
});
