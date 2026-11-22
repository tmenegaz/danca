#!/usr/bin/env node
'use strict';

/**
 * provar-a-coluna-da-vertical.js — entre 769 e 1140 a coluna dos Bastidores abre e fecha os grupos.
 *
 * O QUE ELA VIU (22/11/2026): «quando eu entro, por exemplo, em produção e depois eu vou para
 * aparência, ou eu vou para professores e eu vou para audição, o menu ele fica expandido. Ele fica
 * completamente aberto […] e essa parte que devia acompanhar o tamanho do menu não acompanha, esse
 * background não acompanha o tamanho do menu. Ele para ali no dicionário e ele deveria acompanhar o
 * tamanho.»
 *
 * A CAUSA NÃO ERA O FUNDO. A `.lateral` deixa de ser coluna e passa a barra+folha em
 * `@media (max-width:768px)` (`motor/servidor/bastidores.js`); o acordeão — `max-height:0`,
 * `[data-aberto="sim"]` e `:hover` — vivia só dentro de `@media (min-width:1141px)`, que é o corte
 * da coluna do SISTEMA LASTRO. Entre 769 e 1140 a coluna existe e o acordeão não: `.coluna-itens`
 * caía no `max-height: none` escrito para a FOLHA («na folha não há acordeão»), os quatro grupos
 * ficavam permanentemente abertos, `data-aberto` era ignorado e a seta não aparecia. O menu crescia,
 * o fundo acompanhava o que a caixa tinha de altura — e os últimos itens ficavam abaixo da dobra.
 *
 * O QUE SE MEDE, e é geometria e estado, nunca o HTML:
 *
 *   1. em 1280×800, 1024×640 e 900×700 os quatro grupos nascem FECHADOS (`max-height: 0px`);
 *   2. a seta de cada grupo está à vista (`display` diferente de `none`, largura > 0);
 *   3. clicar no título abre: `data-aberto="sim"` e o miolo cresce acima de 100px;
 *   4. aberto, o ÚLTIMO item do grupo cabe no ecrã — é isto que ela chamou «acompanhar o tamanho»;
 *   5. o mesmo grupo fecha no segundo clique, e os outros não se mexem;
 *   6. em 760×900 a lateral é a FOLHA (barra + `position: static`), e lá não há acordeão nenhum:
 *      os grupos mostram tudo. A regra nova não pode ter transbordado para o telemóvel.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` extrai o `motor/` e a folha desse commit. Em 1024 os grupos
 * nascem TODOS abertos e o último item fica fora do ecrã — que é o defeito, medido.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-a-coluna-da-vertical.js
 *   node experimentos/provar-a-coluna-da-vertical.js --contra=de95569a
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');

const PROFS = [{ nome: 'Demi Plié', slug: 'demi-plie' }];
const ALUNAS = [{ id: 'a', apelido: 'Aluna A' }, { id: 'b', apelido: 'Aluna B' }];
const TURMAS = [{
  id: 'rosa', nome: 'Rosa', modalidade: 'Balé clássico', dias: ['seg', 'qua', 'sex'],
  horarios: { seg: '16:30', qua: '16:30', sex: '16:30' }, duracaoMin: 120,
  periodoInicio: '2026-12-14', periodoFim: '2027-01-15',
}];

function pagina(motorRaiz) {
  const b = require(path.join(motorRaiz, 'motor/servidor/bastidores.js'));
  return b.paginaProducao('breu', { professor: 'demi-plie', ciclo: '01', query: '' }, PROFS, ALUNAS,
    'Demi Plié', 'demi-plie', TURMAS, [], [], [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, '', [], new Set(),
    { cadastro: { escolaNome: 'Breu' } }, [], null, [], undefined, null);
}

function servir(motorRaiz, html) {
  const folha = path.join(motorRaiz, 'tools/templates/ciclo.css');
  const nav = path.join(motorRaiz, 'tools/templates/nav.js');
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) return ok('text/css; charset=utf-8', fs.readFileSync(folha));
    if (caminho.endsWith('/assets/nav.js')) return ok('text/javascript', fs.readFileSync(nav));
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/** A lateral inteira, medida: os grupos, as setas, o fundo, e onde é que o último item cai. */
function ler(pg) {
  return pg.evaluate(() => {
    const lat = document.querySelector('.lateral');
    const lista = document.querySelector('.lateral-lista');
    const grupos = Array.from(document.querySelectorAll('.lateral .coluna-grupo'));
    const r = (e) => (e ? e.getBoundingClientRect() : { top: 0, bottom: 0, width: 0, height: 0 });
    const ultimo = document.querySelector('.lateral .coluna-grupo:last-of-type .coluna-itens a:last-of-type');
    /* «ESTÁ À VISTA» NÃO É «TEM RETÂNGULO» (22/11/2026). O `max-height: 0` do acordeão corta pelo
     * `overflow: hidden` do pai, e o `getBoundingClientRect` do filho continua a existir por baixo
     * do corte — medir o retângulo diria «à vista» com o grupo fechado. O que responde é o
     * `elementFromPoint`: no ponto onde o item estaria, o que está pintado é ele, ou é outra
     * coisa? É a pergunta que o olho faz. */
    const alcancavel = (el) => {
      if (!el) return false;
      const c = el.getBoundingClientRect();
      if (c.width === 0 || c.height === 0) return false;
      const x = Math.round(c.left + c.width / 2);
      const y = Math.round(c.top + c.height / 2);
      if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) return false;
      const alvo = document.elementFromPoint(x, y);
      return !!alvo && (alvo === el || el.contains(alvo));
    };
    return {
      // A COLUNA OU A FOLHA? É a pergunta que separa os dois mundos, e ela decide o resto.
      posicao: getComputedStyle(lat).position,
      barraASeitas: (() => {
        const b = document.getElementById('lateral-abrir');
        return b ? getComputedStyle(b).display !== 'none' && r(b).width > 0 : false;
      })(),
      fundoAltura: Math.round(r(lat).height),
      listaAltura: Math.round(r(lista).height),
      listaConteudo: lista.scrollHeight,
      listaMax: getComputedStyle(lista).maxHeight,
      rola: lat.scrollHeight > lat.clientHeight + 1,
      ecra: window.innerHeight,
      grupos: grupos.map((g) => {
        const itens = g.querySelector('.coluna-itens');
        // O MIOLO É QUEM TEM A ALTURA (22/11/2026). O acordeão deixou de ser `max-height` — um
        // valor fixo que cortava o grupo que crescesse — e passou a ser uma grade de uma linha
        // (`0fr` fechada, `1fr` aberta). Mede-se o filho que a grade mede, não a declaração.
        const miolo = g.querySelector('.coluna-itens-miolo') || itens;
        const seta = g.querySelector('.coluna-seta');
        const titulo = g.querySelector('.coluna-titulo');
        return {
          nome: (titulo ? titulo.textContent : '').replace(/\u203a/g, '').trim(),
          aberto: g.getAttribute('data-aberto'),
          // a trilha usada, como o navegador a reporta (`0px` fechada; o valor de `1fr` aberta)
          linha: getComputedStyle(itens).gridTemplateRows,
          altura: Math.round(r(miolo).height),
          conteudo: Math.round(miolo.scrollHeight),
          setaVisivel: seta ? getComputedStyle(seta).display !== 'none' && r(seta).width > 0 : false,
          expandido: titulo ? titulo.getAttribute('aria-expanded') : null,
        };
      }),
      ultimoItemFim: ultimo ? Math.round(r(ultimo).bottom) : null,
      ultimoAlcancavel: alcancavel(ultimo),
    };
  });
}

/** O título, por clique a sério: é o que a pessoa faz. */
async function tocar(pg, indice) {
  return pg.evaluate((i) => {
    const t = document.querySelectorAll('.lateral .coluna-titulo')[i];
    if (!t) return false;
    t.click();
    return true;
  }, indice);
}

const TELAS = [
  { w: 1280, h: 800, coluna: true },
  { w: 1024, h: 640, coluna: true },
  { w: 900, h: 700, coluna: true },
  { w: 760, h: 900, coluna: false },
];

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-a-coluna-da-vertical: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-a-coluna-da-vertical: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  const contra = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
  let motorRaiz = raiz;
  if (contra) {
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'vertical-'));
    // `modelo/` e `porta/` vão junto: o motor lê os esquemas do ciclo e o conteúdo da anamnese
    // por caminho relativo, e sem eles o `require` estoura antes de a página existir.
    execSync('git archive ' + contra + ' motor tools biblioteca modelo porta | tar -x -C ' + destino,
      { cwd: raiz, stdio: 'pipe' });
    motorRaiz = destino;
  }

  const html = pagina(motorRaiz);
  const { srv, base } = await servir(motorRaiz, html);
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();

  let total = 0;
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    total += 1;
    if (!cond) falhas += 1;
    console.log((cond ? '  ok    ' : '  FALHA ') + nome
      + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 200) : ''));
  };

  /* A FOLHA DO MENU COBRE TUDO O QUE TEM DENTRO (22/11/2026). Era `max-height: 78vh`: com os
   * quatro grupos abertos o conteúdo tem 587px a 1024×640, e a caixa escura tinha 499px — 88px
   * de menu FORA do fundo, a flutuar sobre a página, porque aqui o `overflow` é `visible`. É o
   * «ela fica faltando um pedaço sempre» dela, medido. A asserção é de conteúdo, não de valor:
   * a caixa e o conteúdo têm de coincidir enquanto couberem no ecrã. */
  for (const t of TELAS) {
    await pg.setViewport({ width: t.w, height: t.h });
    await pg.goto(base + '/bastidores/estudio', { waitUntil: 'load' });
    // o menu pede a senha? aqui não: a página é servida já com `#conteudo` aberto pelo servidor.
    await pg.evaluate(() => { const c = document.getElementById('conteudo'); if (c) c.hidden = false; });
    await pg.mouse.move(1, 1);
    await new Promise((r) => setTimeout(r, 140));

    console.log('\n' + t.w + '×' + t.h + (t.coluna ? '  (a coluna)' : '  (a folha)'));
    const a = await ler(pg);

    if (!t.coluna) {
      provar('é a folha: a barra com o «Seções» está à vista e a lateral não é fixa',
        a.barraASeitas && a.posicao === 'static', { posicao: a.posicao, barra: a.barraASeitas });
      provar('na folha não há acordeão: os grupos mostram tudo',
        a.grupos.every((g) => g.altura > 0 && g.altura === g.conteudo),
        a.grupos.map((g) => [g.nome, g.altura, g.conteudo]));
      continue;
    }

    provar('é a coluna: `position: fixed` e o «Seções» fora de cena',
      a.posicao === 'fixed' && !a.barraASeitas, { posicao: a.posicao, barra: a.barraASeitas });
    provar('os ' + a.grupos.length + ' grupos nascem FECHADOS (é o defeito: nasciam todos abertos)',
      a.grupos.length >= 4 && a.grupos.every((g) => g.altura === 0),
      a.grupos.map((g) => [g.nome, g.linha, g.altura]));
    provar('a seta de cada grupo está à vista (no defeito não aparecia)',
      a.grupos.every((g) => g.setaVisivel), a.grupos.map((g) => [g.nome, g.setaVisivel]));
    provar('com tudo fechado, o último item do menu não sobra abaixo da dobra',
      a.rola === false && a.ultimoAlcancavel === false,
      { rola: a.rola, alcancavel: a.ultimoAlcancavel, fundo: a.fundoAltura, ecra: a.ecra });

    // ABRIR O ÚLTIMO GRUPO — é o que ela fez («eu vou para audição»), e é o caso extremo: é o
    // último, e é o que empurra o fim da lista para fora do ecrã quando o acordeão não existe.
    const indice = a.grupos.length - 1;
    provar('o último grupo («' + a.grupos[indice].nome + '») abre no clique', await tocar(pg, indice));
    await new Promise((r) => setTimeout(r, 220));
    const aberto = await ler(pg);
    provar('…e declara-se aberto, no DOM e no `aria-expanded`',
      aberto.grupos[indice].aberto === 'sim' && aberto.grupos[indice].expandido === 'true',
      [aberto.grupos[indice].aberto, aberto.grupos[indice].expandido]);
    provar('…e o miolo cresce (acima de 100px)',
      aberto.grupos[indice].altura > 100, aberto.grupos[indice].altura);
    /* A ALTURA É A DO CONTEÚDO, E NÃO UM TECTO (22/11/2026). Era `max-height: 15rem`: um grupo com
     * mais itens do que cabem em 240px ficava cortado, sem barra e sem forma de lá chegar. Mede-se
     * que o miolo aberto mede EXACTAMENTE o que tem dentro — é a asserção que o `15rem` falharia
     * no dia em que a Pedagogia crescesse. */
    provar('…e aberto mede EXACTAMENTE o conteúdo (nenhum tecto a cortar)',
      aberto.grupos[indice].altura === aberto.grupos[indice].conteudo,
      [aberto.grupos[indice].altura, aberto.grupos[indice].conteudo]);
    provar('…e o ÚLTIMO item está à vista e cabe no ecrã — o fundo acompanha o menu',
      aberto.ultimoAlcancavel === true && aberto.ultimoItemFim <= t.h && aberto.rola === false,
      { alcancavel: aberto.ultimoAlcancavel, fim: aberto.ultimoItemFim, ecra: t.h,
        rola: aberto.rola, fundo: aberto.fundoAltura, lista: aberto.listaAltura });
    provar('a caixa da folha mede o conteúdo (nenhum tecto a cortar) — e cabe no ecrã',
      aberto.listaAltura === aberto.listaConteudo && aberto.listaAltura <= t.h,
      { caixa: aberto.listaAltura, conteudo: aberto.listaConteudo, ecra: t.h, max: aberto.listaMax });
    provar('…e os outros grupos não se mexeram',
      aberto.grupos.filter((g, i) => i !== indice).every((g) => g.altura === 0),
      aberto.grupos.map((g) => [g.nome, g.altura]));

    await tocar(pg, indice);
    await new Promise((r) => setTimeout(r, 220));
    const fechado = await ler(pg);
    provar('…e fecha no segundo clique — o miolo volta a zero e o item sai de vista',
      fechado.grupos[indice].altura === 0
        && fechado.ultimoAlcancavel === false && fechado.grupos[indice].aberto !== 'sim',
      [fechado.grupos[indice].linha, fechado.grupos[indice].altura,
        fechado.ultimoAlcancavel, fechado.grupos[indice].aberto]);
  }

  await br.close();
  srv.close();
  if (motorRaiz !== raiz) fs.rmSync(motorRaiz, { recursive: true, force: true });

  console.log('');
  if (falhas) {
    console.log((contra ? 'CONTROLE: ' : '') + 'FALHARAM ' + falhas + ' de ' + total + ' asserções.');
    process.exit(1);
  }
  console.log((contra ? 'CONTROLE CONFORME — ' : 'TUDO CERTO — ') + total + ' asserções: a partir dos 769 '
    + 'a coluna dos Bastidores fecha e abre os grupos, a seta aparece, e aberto o último item cabe no '
    + 'ecrã; abaixo dos 769 continua a folha, com tudo à vista.');
})();
