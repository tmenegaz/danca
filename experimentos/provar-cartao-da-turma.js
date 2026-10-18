#!/usr/bin/env node
'use strict';

/**
 * provar-cartao-da-turma.js — o cartão da turma é o HÍBRIDO, e ele abre.
 *
 * Por que existe (18/10/2026). A turma trazia NOVE faixas de informação todas abertas ao
 * mesmo tempo, em CADA turma: nome, nível, programa, ritmo, estado, vigência, o aviso de
 * «falta …», a régua em prosa, os conteúdos em chips, o seletor de associação e o histórico.
 * Numa escola com cinco turmas eram quarenta e cinco faixas. A proposta escolhida foi o
 * híbrido: três NÚMEROS à vista e um painel por número, e o painel não é prosa — é a peça
 * (a régua com a sua escala de cores, os conteúdos em chips, o ritmo em pares).
 *
 * Isso NÃO SE MEDE NO HTML. Um painel que abre é um elemento que aparece; o que se prova é
 * a GEOMETRIA (a largura das três métricas, o transbordo em seis larguras), o ESTADO que a
 * tela declara (`aria-expanded`, `data-aberto`, `hidden`) e o que está DENTRO de cada
 * painel. Um `<div class="painel">` no texto da página não prova que ele abre, nem que
 * fecha, nem que um segundo fecha o primeiro.
 *
 * O que se prova:
 *
 *   1. três métricas por cartão, com a MESMA largura, e nenhuma transborda — em 1280,
 *      1024, 768, 414, 390 e 320px;
 *   2. a página não estoura na horizontal em nenhuma dessas larguras;
 *   3. abrir o painel da régua abre SÓ o da régua, e a célula acende;
 *   4. abrir o dos conteúdos fecha o da régua e apaga a célula anterior;
 *   5. tocar outra vez no mesmo «?» fecha;
 *   6. `Escape` fecha;
 *   7. a escala da régua tem um degrau por nível, com a classe de cor certa POR NOME;
 *   8. a turma incompleta traz a nota de «falta» e a lista do que falta;
 *   9. no telefone, o seletor de termo e o botão «Associar» continuam na MESMA linha,
 *      dentro do painel — o botão lê o seletor;
 *  10. cada chip traz o «×» de desassociar.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `motor/` de `HEAD` com `git archive` e
 * roda as MESMAS provas. A página de antes não tem métrica, nem painel, nem escala: se
 * passasse, não estaria provando nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-cartao-da-turma.js
 *   node experimentos/provar-cartao-da-turma.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');

/** O contexto que a página espera para montar a barra do topo. */
const CONTEXTO = { professor: 'tiago-menegaz', ciclo: '01', query: 'professor=tiago-menegaz&escola=fita&ciclo=01' };

const TERMOS = [
  { id: 't1', termo: 'plié', categoria: 'posição', tradicao: 'compartilhada' },
  { id: 't2', termo: 'battement tendu', categoria: 'movimento', tradicao: 'clássico' },
];

/**
 * DUAS turmas, e a diferença entre elas é o que se quer ver: a primeira COMPLETA (tem
 * ritmo, tem conteúdos associados) e a segunda INCOMPLETA (sem ritmo, com vigência). É a
 * incompleta que tem de mostrar a nota e a lista.
 */
const TURMAS = [
  {
    id: 'tu1', nome: 'Balé nível 1, Grade 1', nivelReferencia: 'RAD', programaReferencia: 'Grade 1',
    frequencia: 2, dias: ['seg', 'qua'], horarios: { seg: '18:00', qua: '18:00' }, duracaoMin: 60,
    periodoInicio: '2026-01', periodoFim: '2026-12',
    rubrica: ['satisfatório', 'razoável', 'em desenvolvimento', 'não se aplica'],
  },
  {
    id: 'tu2', nome: 'Balé nível 2, Grade 2', nivelReferencia: 'RAD', programaReferencia: 'Grade 2',
    vigenteDe: '2026-03-01',
  },
];

const REL = { tu1: ['t1', 't2'] };

function pagina(motor) {
  const b = require(path.join(motor, 'servidor/bastidores.js'));
  // OS NOMES DOS PARÂMETROS ENGANAM: `trms` é a lista de TURMAS e `trmos` é a de TERMOS
  // (ver as duas primeiras linhas do corpo da função). Trocados, a página desenha um TERMO
  // como se fosse uma turma — com `data-turma` igual ao id do termo e o nome vazio — e a
  // prova mede uma coisa que não existe sem dizer nada.
  return b.paginaProducao('fita', CONTEXTO, [], [], 'Tiago Menegaz', 'tiago-menegaz', TURMAS, TERMOS, REL, [], [], []);
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
 * ABRIR A SECÇÃO TURMAS SÃO DOIS PASSOS, e o segundo custou uma rodada de medidas falsas.
 *
 *  1. `mostrarSecao` lê `location.hash` e alterna o `hidden` de cada `.secao`;
 *  2. mas as secções vivem DENTRO de `<div id="conteudo" hidden>`, que só deixa de estar
 *     oculto depois de a senha da direção ser aceita. Sem isto, a secção fica com
 *     `hidden=false` e o cartão mede ZERO — a prova passava com `[0,0,0]` e um `.every`
 *     sobre um array vazio.
 *
 * O `#conteudo` é aberto à mão porque a PORTARIA NÃO É O QUE SE ESTÁ A MEDIR: o cartão da
 * turma, sim.
 */
async function abrirTurmas(pg) {
  await pg.evaluate(() => {
    const c = document.getElementById('conteudo');
    if (c) c.hidden = false;
    location.hash = '#turmas';
  });
  await pg.waitForFunction(() => {
    const s = document.getElementById('sec-turmas');
    const l = document.querySelector('li.turma');
    return s && !s.hidden && l && l.getBoundingClientRect().width > 0;
  }, { timeout: 5000 });
}

const LARGURAS = [1280, 1024, 768, 414, 390, 320];
const LI = 'li.turma[data-turma="tu1"]';

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-cartao-da-turma: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-cartao-da-turma: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const negativo = process.argv.includes('--controle-negativo');
  let motor = path.join(raiz, 'motor');
  if (negativo) {
    // O CÓDIGO DE ANTES, extraído do commit — não uma cópia editada à mão. Vão as três
    // pastas que os `require` do motor alcançam: `biblioteca/` (o catálogo lê o
    // vocabulário por caminho relativo) e `tools/templates/` (a barra do topo).
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'motor-cartao-'));
    execSync('git archive HEAD motor biblioteca tools/templates | tar -x -C ' + destino, { cwd: raiz, stdio: 'pipe' });
    motor = path.join(destino, 'motor');
    console.log('CONTROLE NEGATIVO — o motor de HEAD (antes do cartão híbrido)\n');
  }

  const { srv, base } = await servir(pagina(motor));
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    if (!cond) falhas++;
    console.log((cond ? 'ok     ' : 'FALHA  ') + nome + (extra !== undefined ? ' → ' + JSON.stringify(extra) : ''));
  };

  // ---- 1 e 2: a geometria, em seis larguras ------------------------------------------
  for (const w of LARGURAS) {
    await pg.setViewport({ width: w, height: 900 });
    await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
    await abrirTurmas(pg);
    const r = await pg.evaluate((sel) => {
      const l = document.querySelector(sel);
      if (!l) return { existe: false };
      const ms = [...l.querySelectorAll('.metrica')];
      const larg = ms.map((e) => Math.round(e.getBoundingClientRect().width));
      return {
        existe: true,
        quantas: ms.length,
        larg,
        transborda: ms.map((e) => e.scrollWidth - e.clientWidth),
        alturas: ms.map((e) => Math.round(e.getBoundingClientRect().height)),
        estouroDaPagina: document.documentElement.scrollWidth - window.innerWidth,
      };
    }, LI);
    provar(`@${w} · o cartão da turma existe e tem três métricas`, r.existe && r.quantas === 3, r.quantas);
    // As três métricas são `1fr` cada: a diferença entre elas é o arredondamento, não o desenho.
    provar(`@${w} · as três métricas têm a mesma largura`,
      r.existe && Math.max(...r.larg) - Math.min(...r.larg) <= 2, r.larg);
    // A altura igual importa: uma métrica mais alta que as outras desalinha a fila.
    provar(`@${w} · as três métricas têm a mesma altura`,
      r.existe && Math.max(...r.alturas) - Math.min(...r.alturas) <= 1, r.alturas);
    provar(`@${w} · nenhuma métrica transborda`,
      r.existe && r.transborda.every((x) => x <= 1), r.transborda);
    provar(`@${w} · a página não estoura na horizontal`, r.estouroDaPagina <= 1, r.estouroDaPagina);
  }

  // ---- 3 a 6: o painel abre, fecha, e um fecha o outro -------------------------------
  await pg.setViewport({ width: 1280, height: 900 });
  await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
  await abrirTurmas(pg);
  const estado = () => pg.evaluate((sel) => {
    const l = document.querySelector(sel);
    if (!l) return null;
    return {
      paineis: [...l.querySelectorAll('.painel')].map((p) => ({ qual: p.getAttribute('data-painel'), oculto: p.hidden })),
      botoes: [...l.querySelectorAll('.metrica .q')].map((b) => ({
        qual: b.getAttribute('data-balao'),
        expandido: b.getAttribute('aria-expanded'),
        celula: b.closest('.metrica').getAttribute('data-aberto'),
      })),
    };
  }, LI);
  // O CÓDIGO DE ANTES NÃO TEM O BOTÃO, e `page.click` LANÇA quando o seletor não existe —
  // o controle negativo morria no clique em vez de reprovar. Aqui o clique que não encontra
  // o alvo não faz nada, e quem reprova é a asserção seguinte, que já sabe dizer por quê.
  const abrir = async (qual) => {
    try { await pg.click(`${LI} .metrica .q[data-balao="${qual}"]`); } catch { /* sem botão */ }
  };
  const painel = (e, qual) => (e && e.paineis.find((p) => p.qual === qual)) || { oculto: null };
  const botao = (e, qual) => (e && e.botoes.find((b) => b.qual === qual)) || { expandido: null, celula: null };

  const inicial = await estado();
  // `estado()` devolve `null` quando o cartão não existe, e `.every` num array vazio PASSA:
  // era assim que esta prova se dava por boa sem ter medido nada. O `inicial &&` corta isso.
  provar('os três painéis nascem FECHADOS, e o cartão tem os três «?»',
    Boolean(inicial) && inicial.paineis.length === 3 && inicial.paineis.every((p) => p.oculto)
      && inicial.botoes.length === 3,
    inicial && { paineis: inicial.paineis.length, botoes: inicial.botoes.length });

  await abrir('regua');
  let e = await estado();
  provar('tocar no «?» da régua abre o painel da régua', painel(e, 'regua').oculto === false);
  provar('…e só ele', Boolean(e) && e.paineis.filter((p) => !p.oculto).length === 1);
  provar('…e a célula diz que está aberta',
    botao(e, 'regua').expandido === 'true' && botao(e, 'regua').celula === 'sim');

  await abrir('conteudos');
  e = await estado();
  provar('abrir o dos conteúdos FECHA o da régua', painel(e, 'regua').oculto === true);
  provar('…e o dos conteúdos abre', painel(e, 'conteudos').oculto === false);
  provar('…e a célula anterior apaga', botao(e, 'regua').celula === null);

  await abrir('conteudos');
  e = await estado();
  // Os três `.length === 3` não são zelo: `.every` num array VAZIO PASSA, e sem eles as
  // duas provas abaixo davam «ok» no controle negativo, onde não há painel nem botão nenhum.
  provar('tocar outra vez no mesmo «?» fecha',
    Boolean(e) && e.paineis.length === 3 && e.paineis.every((p) => p.oculto));
  provar('…e nenhuma célula fica acesa',
    Boolean(e) && e.botoes.length === 3 && e.botoes.every((b) => b.celula === null && b.expandido === 'false'));

  await abrir('ritmo');
  await pg.keyboard.press('Escape');
  const depoisDoEscape = await estado();
  provar('`Escape` fecha o painel',
    Boolean(depoisDoEscape) && depoisDoEscape.paineis.length === 3
      && depoisDoEscape.paineis.every((p) => p.oculto === true));

  // ---- 7: a escala da régua, com a cor certa POR NOME --------------------------------
  const escala = await pg.evaluate((sel) => {
    const l = document.querySelector(sel);
    if (!l) return null;
    const sp = [...l.querySelectorAll('.painel[data-painel="regua"] .escala span')];
    return { textos: sp.map((s) => s.textContent.trim()), classes: sp.map((s) => s.className) };
  }, LI);
  provar('a escala tem um degrau por nível da régua', escala && escala.textos.length === 4, escala && escala.textos);
  provar('o primeiro degrau é «satisfatório» e está em verde pleno',
    escala && /^satisf/i.test(escala.textos[0]) && escala.classes[0] === 'nivel-ok', escala && escala.classes);
  provar('«em desenvolvimento» está em âmbar, e «não se aplica» em neutro',
    escala && escala.classes[2] === 'nivel-alerta' && escala.classes[3] === 'nivel-neutro', escala && escala.classes);

  // ---- 8: a turma incompleta diz o que falta ----------------------------------------
  const incompleta = await pg.evaluate(() => {
    const l = document.querySelector('li.turma[data-turma="tu2"]');
    if (!l) return null;
    const nota = l.querySelector('.nota-falta');
    const lista = [...l.querySelectorAll('.painel[data-painel="ritmo"] .lista-falta li')];
    return {
      temNota: Boolean(nota),
      notaTexto: nota ? nota.textContent.replace(/\s+/g, ' ').trim() : '',
      itens: lista.map((x) => x.textContent.trim()),
      metricaRitmo: (l.querySelector('.metrica .v') || {}).textContent || '',
    };
  });
  provar('a turma sem ritmo traz a nota de «falta»', incompleta && incompleta.temNota);
  provar('…e a nota começa por «falta»', incompleta && /^falta\b/.test(incompleta.notaTexto), incompleta && incompleta.notaTexto);
  provar('…e a métrica do ritmo mostra um TRAÇO, não uma frase vazia',
    incompleta && incompleta.metricaRitmo.trim() === '—', incompleta && incompleta.metricaRitmo);
  provar('…e o painel do ritmo lista o que falta, um a um',
    incompleta && incompleta.itens.length === 5, incompleta && incompleta.itens);

  // ---- 9 e 10: no telefone, associar continua possível ------------------------------
  await pg.setViewport({ width: 390, height: 900 });
  await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
  await abrirTurmas(pg);
  await abrir('conteudos');
  const par = await pg.evaluate((sel) => {
    const l = document.querySelector(sel);
    if (!l) return null;
    const p = l.querySelector('.painel[data-painel="conteudos"]');
    const s = p && p.querySelector('.sel-termo');
    const b = p && p.querySelector('.associar');
    if (!s || !b) return { tem: false };
    const r = (x) => x.getBoundingClientRect();
    return {
      tem: true,
      mesmaLinha: Math.abs(r(s).top - r(b).top) <= 4,
      dentro: Math.round(r(b).right) <= Math.round(r(p).right) + 1,
      larguraDoSeletor: Math.round(r(s).width),
      chips: [...p.querySelectorAll('.chip')].map((c) => Boolean(c.querySelector('button.desassociar'))),
    };
  }, LI);
  provar('no telefone o painel dos conteúdos tem o seletor e o botão «Associar»', par && par.tem);
  provar('…na MESMA linha — o botão lê o seletor', par && par.mesmaLinha, par);
  provar('…e o botão fica dentro do painel', par && par.dentro, par);
  provar('…e o seletor tem largura útil (não vira um traço)', par && par.larguraDoSeletor > 120, par && par.larguraDoSeletor);
  provar('cada chip traz o «×» de desassociar',
  Boolean(par && par.chips) && par.chips.length === 2 && par.chips.every(Boolean), par && par.chips);

  await br.close();
  srv.close();
  console.log(`\nprovar-cartao-da-turma: ${falhas === 0 ? 'TUDO CERTO' : falhas + ' FALHA(S)'}`);
  process.exit(falhas ? 1 : 0);
})();
