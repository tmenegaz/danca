#!/usr/bin/env node
'use strict';

/**
 * provar-acordeoes.js — as cinco secções recolhem, e recolhidas a listagem ocupa a largura.
 *
 * Por que existe (18/10/2026). Turmas ganhou o acordeão primeiro, por uma razão que vale para
 * todas as secções da Produção: o formulário ocupa uma coluna que a listagem precisa. A
 * direção pediu o mesmo nas outras quatro — «quando eu colapso um formulário, ele fica em uma
 * linha só e aí abaixo dele toda a listagem ocupa a tela toda» — e o mesmo para o botão
 * «Carregar catálogo inicial», que não se redimensionava no telefone.
 *
 * O QUE SE PROVA NÃO ESTÁ NO HTML. Um `<button>` com uma seta no texto da página não prova
 * que ele recolhe, nem que a listagem passa a ocupar a largura, nem que a seta de uma secção
 * não mexe nas outras. Prova-se a GEOMETRIA (a largura da lista contra a da secção, as
 * colunas da grelha), o ESTADO que a tela declara (`data-recolhido`, `hidden`, `aria-expanded`)
 * e a MEMÓRIA (o estado por secção sobrevive ao recarregar).
 *
 * O que se prova, em 1280, 1200, 768, 390, 360 e 320px, e nas CINCO secções:
 *
 *   1. aberto, o formulário está à vista e a lista fica com a coluna dela — em duas colunas
 *      acima de 1140px, numa só abaixo disso;
 *   2. a seta recolhe: o formulário sai, a listagem passa a medir a largura INTEIRA da
 *      secção, e o título (o cabeçalho do acordeão) continua à vista;
 *   3. a mesma seta reabre, e a lista volta à coluna dela;
 *   4. a seta de uma secção NÃO mexe nas outras — o `data-acordeao` é o que separa a seta das
 *      turmas das outras quatro;
 *   5. o estado é lembrado POR SECÇÃO: recolher o vocabulário e recarregar deixa o vocabulário
 *      recolhido e as outras abertas;
 *   6. o «Carregar catálogo inicial (turmas + vocabulário)» cabe na coluna em todas as
 *      larguras, e a página não estoura na horizontal;
 *   7. a página inteira não estoura na horizontal em nenhuma largura, com tudo aberto.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `motor/` de `HEAD` com `git archive` e
 * roda as MESMAS provas. A página de antes não tem seta nas quatro secções nem o botão
 * redimensiona: se passasse, não estaria provando nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-acordeoes.js
 *   node experimentos/provar-acordeoes.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');

const CONTEXTO = { professor: 'tiago-menegaz', ciclo: '01', query: 'professor=tiago-menegaz&escola=fita&ciclo=01' };

/** As cinco secções, e o id do miolo de cada — o alvo que a seta controla. */
const SECOES = [
  ['professores', 'sec-professores', 'professores-miolo'],
  ['alunas', 'sec-alunas', 'alunas-miolo'],
  ['vocabulário', 'sec-vocabulario', 'vocabulario-miolo'],
  ['curadorias', 'sec-curadorias', 'curadorias-miolo'],
  // TURMAS entra na prova porque a seta dela é a única que já existia: a mudança de hoje
  // passou a despachar por `data-acordeao`, e o risco é exactamente ela deixar de funcionar.
  ['turmas', 'sec-turmas', 'turmas-paineis'],
];

const TURMAS = [
  {
    id: 'tu1', nome: 'Balé nível 1, Grade 1', nivelReferencia: 'RAD', programaReferencia: 'Grade 1',
    frequencia: 2, dias: ['seg', 'qua'], horarios: { seg: '18:00', qua: '18:00' }, duracaoMin: 60,
    periodoInicio: '2026-01-01', periodoFim: '2026-12-31', rubricaId: 'r1',
    rubrica: ['satisfatório', 'razoável', 'em desenvolvimento', 'não se aplica'],
  },
];

const TERMOS = [
  { id: 't1', termo: 'plié', categoria: 'posição', tradicao: 'compartilhada' },
  { id: 't2', termo: 'battement tendu', categoria: 'movimento', tradicao: 'clássico' },
];

const RUBRICAS = [{ id: 'r1', nome: 'Régua do Nível 1', niveis: ['satisfatório', 'razoável'] }];
const REL = { tu1: ['t1', 't2'] };
const PARES = [{ professor: 'leticia', turma: 'Balé nível 1, Grade 1', ciclo: '01' }];
const PROFS = [{ nome: 'Leticia', slug: 'leticia' }];
const ALUNAS = ['Vavá'];
const CURADORIAS = [{
  id: 'leticia-bale-classico-bale-nivel-1-grade-1',
  professor: 'leticia', modalidade: 'Balé clássico', tradicao: 'RAD',
  turmas: ['Balé nível 1, Grade 1'], alunas: ['Vavá'], repertorio: ['plié'],
}];

function pagina(motor) {
  const b = require(path.join(motor, 'servidor/bastidores.js'));
  return b.paginaProducao('fita', CONTEXTO, PROFS, ALUNAS, 'Tiago Menegaz', 'tiago-menegaz',
    TURMAS, TERMOS, REL, CURADORIAS, RUBRICAS, PARES);
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

/**
 * AS SECÇÕES VIVEM DENTRO DE `#conteudo[hidden]`, que só abre depois da senha da direção.
 * Abrir o `#conteudo` à mão é o que faz os elementos medirem — um elemento dentro de um
 * `hidden` mede zero, e uma prova sobre zeros passa sem provar nada.
 */
async function abrir(pg, id) {
  await pg.evaluate((idDaSecao) => {
    const c = document.getElementById('conteudo');
    if (c) c.hidden = false;
    for (const s of document.querySelectorAll('.secao')) s.hidden = s.id !== idDaSecao;
  }, id);
  await pg.waitForFunction((idDaSecao) => {
    const s = document.getElementById(idDaSecao);
    return s && !s.hidden && s.getBoundingClientRect().width > 0;
  }, { timeout: 5000 }, id);
  // A PAGINAÇÃO roda no arranque e esconde linhas: sem esta espera, a lista pode medir
  // antes de o rodapé existir. 120ms é o mesmo respiro das outras provas.
  await new Promise((r) => setTimeout(r, 120));
}

/** A geometria de UMA secção: o que a pessoa sente, e não o que o HTML diz. */
function ler(pg, id) {
  return pg.evaluate((idDaSecao) => {
    const s = document.getElementById(idDaSecao);
    const form = s.querySelector('.col-form');
    const lista = s.querySelector('.col-lista');
    const seta = s.querySelector('.alternar-form');
    const titulo = s.querySelector('h2');
    const r = (e) => (e ? e.getBoundingClientRect() : { width: 0, height: 0 });
    // DUAS ANATOMIAS, UM SÓ ESTADO (18/10/2026). Nas quatro secções de uma coisa só, quem
    // tem a grade e o `data-recolhido` é a `.secao`; nas TURMAS é o `.turmas-corpo` que a
    // tem, porque lá o que recolhe é a faixa dos passos, dentro da secção. A prova lê o que
    // a página declara, sem ter opinião sobre qual dos dois é — mas tem de saber que são dois.
    const grade = s.querySelector('.turmas-corpo') || s;
    const donoDoEstado = s.querySelector('[data-recolhido]') || s;
    return {
      recolhido: donoDoEstado.getAttribute('data-recolhido'),
      colunas: getComputedStyle(grade).gridTemplateColumns.split(' ').length,
      formVisivel: r(form).width > 0,
      lista: Math.round(r(lista).width),
      secao: Math.round(r(s).width),
      tituloVisivel: r(titulo).width > 0,
      seta: seta ? seta.textContent.trim() : null,
      expandido: seta ? seta.getAttribute('aria-expanded') : null,
      rotulo: seta ? seta.getAttribute('aria-label') : null,
    };
  }, id);
}

/** A seta, por CLIQUE A SÉRIO. Chamar a função do script provaria a função; o que a pessoa
 *  faz é tocar na seta. Devolve `false` quando a seta não existe — e aí quem chama reprova,
 *  em vez de estourar: uma prova tem de dizer o que falta, não cair. */
async function tocarSeta(pg, id) {
  return pg.evaluate((idDaSecao) => {
    const seta = document.querySelector('#' + idDaSecao + ' .alternar-form');
    if (!seta) return false;
    seta.click();
    return true;
  }, id);
}

const LARGURAS = [1280, 1200, 768, 390, 360, 320];

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-acordeoes: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-acordeoes: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const negativo = process.argv.includes('--controle-negativo');
  let motor = path.join(raiz, 'motor');
  if (negativo) {
    // O CÓDIGO DE ANTES, extraído do commit — não uma cópia editada à mão. Vão as pastas que
    // os `require` do motor alcançam: `biblioteca/` (o catálogo lê o vocabulário por caminho
    // relativo) e `tools/templates/` (a barra do topo e a folha).
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'motor-acordeoes-'));
    execSync('git archive HEAD motor biblioteca tools/templates | tar -x -C ' + destino, { cwd: raiz, stdio: 'pipe' });
    motor = path.join(destino, 'motor');
    console.log('CONTROLE NEGATIVO — o motor de HEAD (antes do acordeão das quatro secções)\n');
  }

  const { srv, base } = await servir(pagina(motor));
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    if (!cond) falhas++;
    console.log((cond ? 'ok     ' : 'FALHA  ') + nome + (extra !== undefined ? ' → ' + JSON.stringify(extra) : ''));
  };

  for (const w of LARGURAS) {
    await pg.setViewport({ width: w, height: 1400 });
    await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
    // O ESTADO É LIMPO A CADA LARGURA. Ele vive em `sessionStorage` e sobrevive à navegação:
    // sem limpar, a segunda largura começaria com tudo recolhido pela primeira, e a prova
    // mediria o rastro da anterior em vez do estado inicial.
    await pg.evaluate(() => { try { sessionStorage.clear(); } catch (e) { /* modo privado */ } });
    await pg.reload({ waitUntil: 'load' });

    const estreita = w < 1140; // abaixo disto a própria folha já é de uma coluna

    for (const [nome, id] of SECOES) {
      await abrir(pg, id);

      // A SETA EXISTE — a primeira coisa a provar, porque sem ela as outras três medidas
      // descrevem uma secção que não recolhe.
      const temSeta = await pg.evaluate((idDaSecao) =>
        Boolean(document.querySelector('#' + idDaSecao + ' .alternar-form')), id);
      provar(`@${w} · ${nome}: a secção tem a seta do acordeão`, temSeta === true, temSeta);

      const aberto = await ler(pg, id);
      provar(`@${w} · ${nome}: aberto, o formulário está à vista e a lista na coluna dela`,
        aberto.recolhido === 'nao' && aberto.formVisivel && aberto.tituloVisivel &&
        aberto.seta === '\u25BE' && aberto.expandido === 'true' &&
        aberto.colunas === (estreita ? 1 : 2), aberto);

      const recolheu = await tocarSeta(pg, id);
      provar(`@${w} · ${nome}: a seta responde ao toque`, recolheu === true, recolheu);
      await new Promise((r) => setTimeout(r, 90));

      const recolhido = await ler(pg, id);
      provar(`@${w} · ${nome}: a seta recolhe — o formulário sai, o título fica, a seta diz o estado`,
        recolhido.recolhido === 'sim' && !recolhido.formVisivel && recolhido.tituloVisivel &&
        recolhido.seta === '\u25B8' && recolhido.expandido === 'false' &&
        /Abrir/.test(String(recolhido.rotulo)), recolhido);
      // A LISTAGEM OCUPA A LARGURA TODA — é o pedido, medido em pixels e não em intenção.
      provar(`@${w} · ${nome}: recolhido, a listagem mede a largura inteira da secção`,
        recolhido.lista === recolhido.secao && recolhido.colunas === 1, recolhido);

      // AS OUTRAS NÃO SE MEXERAM. É a regressão que o `data-acordeao` evita: as cinco setas
      // têm a mesma classe, e sem o gancho a do vocabulário recolhia as turmas.
      const outras = await pg.evaluate(([idDaSecao, ids]) => {
        const fora = {};
        for (const outro of ids) {
          if (outro === idDaSecao) continue;
          const s = document.getElementById(outro);
          fora[outro] = s.getAttribute('data-recolhido');
        }
        return fora;
      }, [id, SECOES.map((x) => x[1])]);
      provar(`@${w} · ${nome}: a seta dela não recolhe as outras secções`,
        Object.values(outras).every((v) => v !== 'sim'), outras);

      // A MESMA SETA REABRE.
      await tocarSeta(pg, id);
      await new Promise((r) => setTimeout(r, 90));
      const reaberto = await ler(pg, id);
      provar(`@${w} · ${nome}: a mesma seta reabre, e a lista volta à coluna dela`,
        reaberto.recolhido === 'nao' && reaberto.formVisivel && reaberto.seta === '\u25BE' &&
        reaberto.colunas === (estreita ? 1 : 2) &&
        (!estreita || reaberto.lista === reaberto.secao), reaberto);
    }

    // O BOTÃO DO CATÁLOGO INICIAL. Ele é `nowrap` por herança da folha — decisão certa para
    // «Avançar» e errada para um rótulo de 47 caracteres: em 320px media 367px dentro de uma
    // coluna de 288, e a PÁGINA rolava de lado. Mede-se o que transbordava.
    await abrir(pg, 'sec-vocabulario');
    const semear = await pg.evaluate(() => {
      const b = document.getElementById('semear');
      const pai = b.parentElement;
      return {
        botao: Math.round(b.getBoundingClientRect().width),
        coluna: Math.round(pai.getBoundingClientRect().width),
        altura: Math.round(b.getBoundingClientRect().height),
        // 45px é a altura de UMA linha do controle; mais do que isso quer dizer que o rótulo
        // quebrou — e quebrar é o que se quer no telefone, nunca o contrário.
        linha: b.getBoundingClientRect().height <= 48 ? 'uma linha' : 'quebrado',
      };
    });
    provar(`@${w} · «Carregar catálogo inicial» cabe na coluna (${semear.linha})`,
      semear.botao <= semear.coluna, semear);

    const estouro = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    provar(`@${w} · a página não estoura na horizontal`, estouro <= 1, estouro);
  }

  // ---- A MEMÓRIA, POR SECÇÃO ------------------------------------------------------
  //
  // A página RECARREGA a cada operação (associar, gravar, apagar). Um acordeão que se reabre
  // sozinho desfaria, a cada operação, o que a pessoa acabou de pedir. E ele é POR SECÇÃO:
  // quem recolheu o vocabulário para ler a lista não pediu para recolher as alunas.
  await pg.setViewport({ width: 1280, height: 1400 });
  await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
  await pg.evaluate(() => { try { sessionStorage.clear(); } catch (e) { /* modo privado */ } });
  await pg.reload({ waitUntil: 'load' });
  await abrir(pg, 'sec-vocabulario');
  await tocarSeta(pg, 'sec-vocabulario');
  await pg.reload({ waitUntil: 'load' });
  await abrir(pg, 'sec-vocabulario');
  const lembrado = await pg.evaluate(() => {
    const g = (id) => document.getElementById(id).getAttribute('data-recolhido');
    return { vocabulario: g('sec-vocabulario'), alunas: g('sec-alunas'), professores: g('sec-professores') };
  });
  provar('o recolhimento é lembrado depois de recarregar — e só o da secção recolhida',
    lembrado.vocabulario === 'sim' && lembrado.alunas === 'nao' && lembrado.professores === 'nao',
    lembrado);

  await br.close();
  srv.close();
  console.log(`\nprovar-acordeoes: ${falhas === 0 ? 'TUDO CERTO' : falhas + ' FALHA(S)'}`);
  process.exit(falhas ? 1 : 0);
})();
