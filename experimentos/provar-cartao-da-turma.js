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
 *   1. DUAS métricas por cartão — RITMO e RÉGUA, com a MESMA largura, e nenhuma transborda —
 *      em 1280,
 *      1024, 768, 414, 390 e 320px;
 *   2. a página não estoura na horizontal em nenhuma dessas larguras;
 *   3. abrir o painel da régua abre SÓ o da régua, e a célula acende;
 *   4. abrir o dos conteúdos fecha o da régua e apaga a célula anterior;
 *   5. tocar outra vez no mesmo «?» fecha;
 *   6. `Escape` fecha;
 *   7. a escala da régua tem um degrau por nível, com a classe de cor certa POR NOME;
 *   8. a turma incompleta traz a nota de «falta» e a lista do que falta;
 *   9. o painel dos conteúdos MOSTRA e não compõe: tem os chips, e não tem seletor, nem
 *      botão «Associar», nem «×»;
 *  10. o formulário da TURMA não tem mais o bloco — só se associa conteúdo a uma turma que
 *      já existe, e ali ela ainda está a nascer;
 *  11. os três passos, na ordem, com os rótulos «Turma», «Rubricas» e «Associar»;
 *  12. os «!» de edição aparecem SÓ nos passos e SÓ quando se está a editar — fora da
 *      edição não há «!» nenhum, e entrar em «Editar» liga os três de uma vez;
 *  13. o passo «Associar» mostra os chips da turma escolhida, diz com que régua ela está
 *      hoje, e tem associar E desassociar a rubrica e o conteúdo;
 *  14. o passo e a turma são LEMBRADOS depois de recarregar — sem isso, cada associação
 *      devolvia a direção ao passo 1 e à primeira turma da lista;
 *  15. a coluna «turmas» de Professor, Aluna e Termo nomeia as turmas de cada um e FILTRA a
 *      listagem de Turmas quando clicada — e o «Mostrar todas» a devolve inteira.
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
    periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
    rubricaId: 'r1',
    rubrica: ['satisfatório', 'razoável', 'em desenvolvimento', 'não se aplica'],
  },
  {
    id: 'tu2', nome: 'Balé nível 2, Grade 2', nivelReferencia: 'RAD', programaReferencia: 'Grade 2',
    vigenteDe: '2026-03-01',
  },
  // A VINCULADA: tem plano de ensino, e é por isso que o botão dela é «Derivar» e não
  // «Editar». É nela que se prova o modo derivar — no modo editar não há como.
  {
    id: 'tu3', nome: 'Balé nível 3, Grade 3', nivelReferencia: 'RAD',
    frequencia: 1, dias: ['sex'], horarios: { sex: '17:00' }, duracaoMin: 45,
    periodoInicio: '2026-02-01', periodoFim: '2026-06-30',
  },
];

// A RUBRICA COM NOME da turma «tu1»: é ela que o «Editar» tem de abrir no passo 2.
const RUBRICAS = [
  { id: 'r1', nome: 'Régua do Nível 1', niveis: ['satisfatório', 'razoável', 'em desenvolvimento', 'não se aplica'] },
];

const REL = { tu1: ['t1', 't2'], tu3: ['t1', 't2'] };

/** O par turma↔plano que faz uma turma ser VINCULADA (o `pares` do `paginaProducao`).
 *  O `professor` e o `ciclo` entram porque é deles que sai o LINK para o plano de ensino
 *  na listagem das curadorias (18/10/2026): o plano é do professor, e a porta pede o ciclo. */
const PARES = [{ professor: 'leticia', turma: 'Balé nível 3, Grade 3', ciclo: '01' }];

/** O PROFESSOR que não é o dono — a linha dele tem de mostrar as turmas dele. */
const PROFS = [{ nome: 'Leticia', slug: 'leticia' }];

/** A ALUNA da lista, e a curadoria que a põe numa turma: é dela que sai a coluna «turmas». */
const ALUNAS = ['Vavá'];

// A CURADORIA é a fonte das turmas da aluna e do professor (o plano de ensino é a outra, e
// vem em `PARES`). «Vavá» está na turma 1; «Leticia» na turma 3 — as duas linhas têm de
// mostrar turmas DIFERENTES, senão a prova não distinguiria «tem coluna» de «tem a certa».
const CURADORIAS = [
  {
    id: 'tiago-menegaz-bale-classico-bale-nivel-1-grade-1',
    professor: 'tiago-menegaz', modalidade: 'Balé clássico', tradicao: 'RAD',
    turmas: ['Balé nível 1, Grade 1'], alunas: ['Vavá'], repertorio: ['plié'],
  },
  {
    id: 'leticia-bale-classico-bale-nivel-3-grade-3',
    professor: 'leticia', modalidade: 'Balé clássico', tradicao: 'RAD',
    turmas: ['Balé nível 3, Grade 3'], alunas: [], repertorio: ['plié'],
  },
];

function pagina(motor) {
  const b = require(path.join(motor, 'servidor/bastidores.js'));
  // OS NOMES DOS PARÂMETROS ENGANAM: `trms` é a lista de TURMAS e `trmos` é a de TERMOS
  // (ver as duas primeiras linhas do corpo da função). Trocados, a página desenha um TERMO
  // como se fosse uma turma — com `data-turma` igual ao id do termo e o nome vazio — e a
  // prova mede uma coisa que não existe sem dizer nada.
  // `rbs` é a lista de RUBRICAS COM NOME — a que o passo 2 edita e o `rubricaId` referencia.
  // `curs` são as CURADORIAS — a fonte das turmas da aluna e do professor.
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
    // `tools/` E `teste/` ENTRARAM NA LISTA (01/11/2026). O motor de HEAD já carrega os três
    // cenários de teste (`servidor/teste-fixtures.js` → `teste/<escola>.json`) e a cifra dos
    // acompanhamentos (`acervo-envelopes.js` → `tools/lib-cifra.js`); sem eles o `require`
    // rebentava antes da primeira asserção — e um controle negativo que não corre não controla
    // nada. `tools/` inteiro, e não só os templates: a folha vem de `tools/templates`, mas o
    // caminho é o mesmo `require`.**

    execSync('git archive HEAD motor biblioteca tools teste | tar -x -C ' + destino, { cwd: raiz, stdio: 'pipe' });
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
      const ms = [...l.querySelectorAll('.trio-item')];
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
    /* DUAS, E NÃO TRÊS (07/11/2026). O cartão da sala tinha Ritmo, Régua e Conteúdos; o
     * terceiro número saiu porque o conteúdo da aula é da TURMA, e uma sala que diz «Conteúdos:
     * N» afirma o que já não é dela. O cartão passou a `trio trio-duo`, e é isso que se mede. */
    provar(`@${w} · o cartão da sala existe e tem DUAS métricas`, r.existe && r.quantas === 2, r.quantas);
    // As duas métricas são `1fr` cada: a diferença entre elas é o arredondamento, não o desenho.
    provar(`@${w} · as duas métricas têm a mesma largura`,
      r.existe && Math.max(...r.larg) - Math.min(...r.larg) <= 2, r.larg);
    // A altura igual importa: uma métrica mais alta que as outras desalinha a fila.
    provar(`@${w} · as duas métricas têm a mesma altura`,
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
      paineis: [...l.querySelectorAll('.trio-painel')].map((p) => ({ qual: p.getAttribute('data-painel'), oculto: p.hidden })),
      botoes: [...l.querySelectorAll('.trio-item')].map((b) => ({
        qual: b.getAttribute('data-balao'),
        expandido: b.getAttribute('aria-expanded'),
        celula: b.getAttribute('aria-expanded'),
      })),
    };
  }, LI);
  // O CÓDIGO DE ANTES NÃO TEM O BOTÃO, e `page.click` LANÇA quando o seletor não existe —
  // o controle negativo morria no clique em vez de reprovar. Aqui o clique que não encontra
  // o alvo não faz nada, e quem reprova é a asserção seguinte, que já sabe dizer por quê.
  const abrir = async (qual) => {
    try { await pg.click(`${LI} .trio-item[data-balao="${qual}"]`); } catch { /* sem botão */ }
  };
  const painel = (e, qual) => (e && e.paineis.find((p) => p.qual === qual)) || { oculto: null };
  const botao = (e, qual) => (e && e.botoes.find((b) => b.qual === qual)) || { expandido: null, celula: null };

  const inicial = await estado();
  // `estado()` devolve `null` quando o cartão não existe, e `.every` num array vazio PASSA:
  // era assim que esta prova se dava por boa sem ter medido nada. O `inicial &&` corta isso.
  provar('os DOIS painéis nascem FECHADOS, e o cartão tem os dois «?»',
    Boolean(inicial) && inicial.paineis.length === 2 && inicial.paineis.every((p) => p.oculto)
      && inicial.botoes.length === 2,
    inicial && { paineis: inicial.paineis.length, botoes: inicial.botoes.length });

  await abrir('regua');
  let e = await estado();
  provar('tocar no «?» da régua abre o painel da régua', painel(e, 'regua').oculto === false);
  provar('…e só ele', Boolean(e) && e.paineis.filter((p) => !p.oculto).length === 1);
  provar('…e a célula diz que está aberta',
    botao(e, 'regua').expandido === 'true');

  /* ABRIR UM FECHA O OUTRO — agora com DOIS. O par que se mede é (régua, ritmo): o dos conteúdos
   * saiu a 07/11/2026, e uma prova que o abrisse estaria a medir um botão que não existe (o
   * `abrir` engole o clique que não acha o alvo, e quem reprovaria seria a asserção seguinte). */
  await abrir('ritmo');
  e = await estado();
  provar('abrir o do ritmo FECHA o da régua', painel(e, 'regua').oculto === true);
  provar('…e o do ritmo abre', painel(e, 'ritmo').oculto === false);
  provar('…e a célula anterior apaga', botao(e, 'regua').expandido === 'false');

  await abrir('ritmo');
  e = await estado();
  // Os dois `.length === 2` não são zelo: `.every` num array VAZIO PASSA, e sem eles as
  // duas provas abaixo davam «ok» no controle negativo, onde não há painel nem botão nenhum.
  provar('tocar outra vez no mesmo «?» fecha',
    Boolean(e) && e.paineis.length === 2 && e.paineis.every((p) => p.oculto));
  provar('…e nenhuma célula fica acesa',
    Boolean(e) && e.botoes.length === 2 && e.botoes.every((b) => b.expandido === 'false'));

  await abrir('ritmo');
  await pg.keyboard.press('Escape');
  const depoisDoEscape = await estado();
  provar('`Escape` fecha o painel',
    Boolean(depoisDoEscape) && depoisDoEscape.paineis.length === 2
      && depoisDoEscape.paineis.every((p) => p.oculto === true));

  // ---- 7: a escala da régua, com a cor certa POR NOME --------------------------------
  const escala = await pg.evaluate((sel) => {
    const l = document.querySelector(sel);
    if (!l) return null;
    const sp = [...l.querySelectorAll('.trio-painel[data-painel="regua"] .trio-escala span')];
    return { textos: sp.map((s) => s.textContent.trim()), classes: sp.map((s) => s.className) };
  }, LI);
  provar('a escala tem um degrau por nível da régua', escala && escala.textos.length === 4, escala && escala.textos);
  provar('o primeiro degrau é «satisfatório» e está em verde pleno',
    escala && /^satisf/i.test(escala.textos[0]) && escala.classes[0] === 'trio-ok', escala && escala.classes);
  provar('«em desenvolvimento» está em âmbar, e «não se aplica» em neutro',
    escala && escala.classes[2] === 'trio-alerta' && escala.classes[3] === 'trio-neutro', escala && escala.classes);

  // ---- 8: a turma incompleta diz o que falta ----------------------------------------
  const incompleta = await pg.evaluate(() => {
    const l = document.querySelector('li.turma[data-turma="tu2"]');
    if (!l) return null;
    const nota = l.querySelector('.nota-falta');
    const lista = [...l.querySelectorAll('.trio-painel[data-painel="ritmo"] .trio-falta li')];
    return {
      temNota: Boolean(nota),
      notaTexto: nota ? nota.textContent.replace(/\s+/g, ' ').trim() : '',
      itens: lista.map((x) => x.textContent.trim()),
      metricaRitmo: (l.querySelector('.trio-item .trio-v') || {}).textContent || '',
    };
  });
  provar('a turma sem ritmo traz a nota de «falta»', incompleta && incompleta.temNota);
  provar('…e a nota começa por «falta»', incompleta && /^falta\b/.test(incompleta.notaTexto), incompleta && incompleta.notaTexto);
  provar('…e a métrica do ritmo mostra um TRAÇO, não uma frase vazia',
    incompleta && incompleta.metricaRitmo.trim() === '—', incompleta && incompleta.metricaRitmo);
  provar('…e o painel do ritmo lista o que falta, um a um',
    // QUATRO, e não cinco (18/10/2026): a frequência e os dias eram duas linhas, e as duas
    // diziam «os dias da semana». A frequência SAI dos dias, e agora é uma linha só.
    incompleta && incompleta.itens.length === 4, incompleta && incompleta.itens);

  // ---- 8b: A COLUNA «TURMAS» — nomeia, e FILTRA ------------------------------------
  //
  // A lista de Professor, Aluna e Termo diz a que turmas cada um pertence; o «turmas» é o
  // filtro. Aqui mede-se o que o servidor desenhou (os ids certos em cada linha) e o que o
  // clique faz (a listagem de Turmas fica só com aquelas, e o «Mostrar todas» a devolve).
  const colunas = await pg.evaluate(() => {
    // O link de uma linha, procurado pelo NOME que ela mostra — as três listas (professores,
    // alunas, termos) partilham o mesmo desenho, e é isso que faz a medida ser UMA só.
    const daLinha = (nome) => {
      for (const li of document.querySelectorAll('.lista li')) {
        if ((li.querySelector('.nome b') || {}).textContent !== nome) continue;
        const b = li.querySelector('button.filtrar-turmas');
        return b
          ? { ids: b.getAttribute('data-turmas'), quem: b.getAttribute('data-quem'), texto: b.textContent.trim() }
          : { ids: null };
      }
      return null;
    };
    return { aluna: daLinha('Vavá'), leticia: daLinha('Leticia'), termo: daLinha('plié') };
  });
  provar('a aluna mostra a TURMA dela e o link filtra por ela',
    Boolean(colunas.aluna) && colunas.aluna.ids === 'tu1' &&
    /Balé nível 1/.test(colunas.aluna.texto), colunas.aluna);
  provar('o professor mostra as turmas DELE (outra turma, outra linha)',
    Boolean(colunas.leticia) && colunas.leticia.ids === 'tu3' &&
    /Balé nível 3/.test(colunas.leticia.texto), colunas.leticia);
  provar('o termo mostra TODAS as turmas que o usam (as duas)',
    Boolean(colunas.termo) && colunas.termo.ids === 'tu1,tu3', colunas.termo);

  // O CLIQUE. Ele guarda o filtro, leva à secção Turmas e reduz a listagem.
  await pg.evaluate(() => {
    for (const li of document.querySelectorAll('.lista li')) {
      if ((li.querySelector('.nome b') || {}).textContent === 'Vavá') {
        const b = li.querySelector('button.filtrar-turmas');
        if (b) b.click();
      }
    }
  });
  await pg.waitForFunction(() => (location.hash || '') === '#turmas', { timeout: 2000 }).catch(() => {});
  const filtrado = await pg.evaluate(() => {
    const itens = [...document.querySelectorAll('li.turma')];
    const aviso = document.getElementById('filtro-turmas');
    return {
      hash: location.hash,
      visiveis: itens.filter((l) => !l.hidden).map((l) => l.getAttribute('data-turma')),
      aviso: aviso && !aviso.hidden ? aviso.textContent.replace(/\s+/g, ' ').trim() : '',
      temLimpar: Boolean(aviso && aviso.querySelector('button.limpar-filtro')),
      passo: (() => {
        const b = document.querySelector('button.passo[aria-current="step"]');
        return b ? b.getAttribute('data-passo') : null;
      })(),
    };
  });
  provar('clicar em «turmas» leva à secção Turmas com a listagem REDUZIDA',
    filtrado.hash === '#turmas' && filtrado.visiveis.join(',') === 'tu1', filtrado);
  provar('…diz de quem são as turmas que sobraram, e oferece «Mostrar todas»',
    /Vavá/.test(filtrado.aviso) && /1 turma/.test(filtrado.aviso) && filtrado.temLimpar, filtrado);
  provar('…e volta ao passo 1 (quem veio ver turmas não quer editar a última)',
    filtrado.passo === 'turma', filtrado.passo);

  await pg.click('button.limpar-filtro');
  const limpo = await pg.evaluate(() => ({
    visiveis: [...document.querySelectorAll('li.turma')].filter((l) => !l.hidden).length,
    avisoOculto: document.getElementById('filtro-turmas').hidden,
    filtro: (() => { try { return sessionStorage.getItem('producao:filtro-turmas'); } catch (err) { return null; } })(),
  }));
  provar('«Mostrar todas» devolve a listagem inteira e apaga o filtro',
    limpo.visiveis === 3 && limpo.avisoOculto === true && limpo.filtro === null, limpo);

  // ---- 8c: O ACORDEÃO — recolhido, a listagem ocupa a LARGURA TODA -----------------
  //
  // O filtro recolhe o formulário (18/10/2026), e recolhido ele é UMA FAIXA: os três passos
  // à vista e a seta. O que se mede é a GEOMETRIA, porque é ela que a pessoa sente: a lista
  // passa da coluna da direita para a linha inteira, e sobe para debaixo da faixa.
  const geometria = () => pg.evaluate(() => {
    const corpo = document.querySelector('.turmas-corpo');
    const form = document.getElementById('turmas-form');
    const miolo = document.getElementById('turmas-paineis');
    const lista = document.querySelector('#sec-turmas .col-lista');
    const seta = document.getElementById('alternar-form');
    return {
      recolhido: corpo.getAttribute('data-recolhido'),
      colunas: getComputedStyle(corpo).gridTemplateColumns.split(' ').length,
      mioloOculto: miolo.hidden,
      seta: seta.textContent,
      expandido: seta.getAttribute('aria-expanded'),
      lista: Math.round(lista.getBoundingClientRect().width),
      corpo: Math.round(corpo.getBoundingClientRect().width),
      topoLista: Math.round(lista.getBoundingClientRect().top),
      topoForm: Math.round(form.getBoundingClientRect().top),
      passosVisiveis: [...document.querySelectorAll('#sec-turmas button.passo')]
        .filter((b) => b.getBoundingClientRect().width > 0).length,
    };
  });

  // O FORMULÁRIO ABERTO é o estado normal: duas colunas, e a lista na da direita. O estado
  // é postO à mão (e não por um clique) para a prova não depender do que a anterior deixou —
  // a asserção seguinte mede o EFEITO do clique, e um estado herdado mediria o contrário.
  await pg.evaluate(() => { definirFormularioRecolhido(false); });
  const aberto = await geometria();
  provar('o formulário aberto são DUAS colunas, com a lista ao lado',
    aberto.recolhido === 'nao' && aberto.colunas === 2 && !aberto.mioloOculto &&
    aberto.lista < aberto.corpo, aberto);

  // A SETA recolhe — e recolhido a listagem ocupa a largura toda.
  await pg.evaluate(() => { document.querySelector('#sec-turmas .alternar-form').click(); });
  const recolhido = await geometria();
  provar('a seta recolhe: uma coluna, o miolo fora, e a seta diz o estado',
    recolhido.recolhido === 'sim' && recolhido.colunas === 1 && recolhido.mioloOculto &&
    recolhido.seta === '▸' && recolhido.expandido === 'false', recolhido);
  provar('…e a LISTAGEM ocupa a largura toda, abaixo da faixa',
    recolhido.lista === recolhido.corpo && recolhido.topoLista > recolhido.topoForm, recolhido);
  /* A DECISÃO VIROU A 17/11/2026, e a asserção vira com ela. Até aqui os três passos FICAVAM à
   * vista com a secção recolhida — «é eles que dizem onde se está» (01/11/2026). A proprietária
   * viu o resultado e disse o contrário: «quando eu colapso o formulário, o step está ficando de
   * fora do colapsar. Os steps também tem que ser colapsados, porque, afinal de contas, eles
   * dizem respeito ao formulário.» E dizem: a tira navega os passos do formulário, e recolhido o
   * formulário não há passo a que ir. O que se afirma agora é que eles SAEM com ele. */
  provar('…e os três passos saem com ele (a tira navega um formulário que já não está à vista)',
    recolhido.passosVisiveis === 0, recolhido.passosVisiveis);

  // A SETA outra vez devolve tudo.
  await pg.evaluate(() => { document.querySelector('#sec-turmas .alternar-form').click(); });
  const reaberto = await geometria();
  provar('a mesma seta reabre, e a lista volta à coluna dela',
    reaberto.recolhido === 'nao' && reaberto.colunas === 2 && !reaberto.mioloOculto &&
    reaberto.seta === '▾' && reaberto.lista < reaberto.corpo, reaberto);

  // CHEGAR PELO FILTRO RECOLHE SOZINHO — é o pedido: quem vem ver as turmas de alguém não
  // quer o formulário à frente.
  await pg.evaluate(() => {
    sessionStorage.setItem('producao:filtro-turmas',
      JSON.stringify({ ids: ['tu1'], quem: 'Vavá', tipo: 'pessoa' }));
    aplicarFiltroDeTurmas();
  });
  const peloFiltro = await geometria();
  provar('aplicar o filtro recolhe o formulário e dá a largura toda à lista',
    peloFiltro.recolhido === 'sim' && peloFiltro.colunas === 1 &&
    peloFiltro.lista === peloFiltro.corpo, peloFiltro);

  // E «MOSTRAR TODAS» DEVOLVE OS DOIS: a lista inteira e o formulário aberto (a causa do
  // recolhimento desapareceu, e o efeito vai atrás).
  await pg.evaluate(() => { document.querySelector('button.limpar-filtro').click(); });
  const devolvido = await geometria();
  provar('«Mostrar todas» devolve também o formulário aberto',
    devolvido.recolhido === 'nao' && devolvido.colunas === 2 && !devolvido.mioloOculto, devolvido);

  // O ESTADO SOBREVIVE AO RECARREGAR — a página recarrega a cada operação.
  await pg.evaluate(() => { document.querySelector('#sec-turmas .alternar-form').click(); });
  await pg.reload({ waitUntil: 'load' });
  await pg.evaluate(() => {
    const c = document.getElementById('conteudo'); if (c) c.hidden = false;
    location.hash = '#turmas';
    document.getElementById('sec-turmas').hidden = false;
  });
  await new Promise((r) => setTimeout(r, 250));
  const depoisDeRecarregarAcordeao = await geometria();
  provar('o recolhimento é lembrado depois de recarregar',
    depoisDeRecarregarAcordeao.recolhido === 'sim' && depoisDeRecarregarAcordeao.mioloOculto, depoisDeRecarregarAcordeao);
  // Devolve o estado aberto para as provas seguintes (elas contam com o formulário).
  await pg.evaluate(() => { document.querySelector('#sec-turmas .alternar-form').click(); });

  // ---- 9 a 14: a ASSOCIAÇÃO vive no PASSO 3, e o passo é uma SEQUÊNCIA ------------
  //
  // A regra mudou três vezes:
  //
  //   1. (18/10/2026) a associação saiu do cartão (o painel passou a MOSTRAR);
  //   2. (18/10/2026) e saiu TAMBÉM do formulário da turma — só se associa a uma turma que já
  //      existe, e o cadastro é o sítio onde ela ainda está a nascer. Foi para o passo 3;
  //   3. (03/11/2026) e a dos CONTEÚDOS saiu do passo 3 também: o conteúdo é ato pedagógico, e
  //      o passo 3 ficou só com a régua. Ver `provar-conteudos-e-estado-da-turma.js`.
  //
  // As provas abaixo medem as três coisas: o que o painel do cartão deixou de ter (e, desde
  // 07/11/2026, que ele já não existe), o que os dois formulários deixaram de ter, e o que o
  // passo 3 passou a ter.

  await pg.evaluate(() => { location.hash = '#turmas'; });
  await pg.waitForFunction(() => {
    const s = document.getElementById('sec-turmas');
    return s && !s.hidden;
  }, { timeout: 5000 });

  /* O PAINEL DOS CONTEÚDOS SAIU INTEIRO A 07/11/2026 — e as quatro asserções acima, que mediam o
   * que ele deixou de ter, passam a medir que ele NÃO EXISTE. A ordem é a mesma das outras: o
   * cartão da sala não fala de conteúdos em nenhum sítio, nem no número nem no painel.
   *
   * O que continua a valer, e continua a ser medido abaixo: o conteúdo da aula é da TURMA
   * (`#esc-conteudos`), e o formulário da sala não tem o bloco. */
  const painelDeConteudos = await pg.evaluate((sel) => {
    const l = document.querySelector(sel);
    if (!l) return null;
    return {
      temPainel: Boolean(l.querySelector('.trio-painel[data-painel="conteudos"]')),
      temBotao: Boolean(l.querySelector('.trio-item[data-balao="conteudos"]')),
      quantosPaineis: l.querySelectorAll('.trio-painel').length,
      quantosBotoes: l.querySelectorAll('.trio-item').length,
    };
  }, LI);
  provar('o cartão da sala NÃO tem o painel dos conteúdos',
    painelDeConteudos && painelDeConteudos.temPainel === false, painelDeConteudos);
  provar('…nem o botão que o abria', painelDeConteudos && painelDeConteudos.temBotao === false, painelDeConteudos);
  provar('…e os painéis e os botões são DOIS, um por facto que a sala tem',
    painelDeConteudos && painelDeConteudos.quantosPaineis === 2 && painelDeConteudos.quantosBotoes === 2,
    painelDeConteudos);

  // O FORMULÁRIO DA TURMA NÃO TEM MAIS O BLOCO — ele só cria a turma.
  const noCadastro = await pg.evaluate(() => ({
    noFormularioDaTurma: Boolean(document.getElementById('form-turma'))
      && document.getElementById('form-turma').contains(document.getElementById('t-conteudos')),
    temBlocoDaTurma: Boolean(document.getElementById('t-conteudos')),
    temBlocoNoPasso3: Boolean(document.getElementById('vinc-conteudos')),
  }));
  provar('o formulário da TURMA não tem mais bloco de conteúdos',
    noCadastro.noFormularioDaTurma === false && noCadastro.temBlocoDaTurma === false, noCadastro);
  // E O PASSO «ASSOCIAR» TAMBÉM NÃO O TEM (03/11/2026). Ele morou aqui entre 18/10 e 03/11 — a
  // régua e os conteúdos associavam-se no mesmo passo, porque o passo é o sítio onde a turma já
  // existe. A pesquisadora levou-o mais longe: o conteúdo é «um ato pedagógico», e o lugar de um
  // ato pedagógico é a CURADORIA. O passo 3 ficou com o que é dele — a rubrica.
  provar('…nem o passo ASSOCIAR, que passou a ser só da rubrica',
    noCadastro.temBlocoNoPasso3 === false, noCadastro);

  // OS TRÊS PASSOS: o rótulo, a ordem e o nome semântico.
  //
  // A CONSULTA É DA SECÇÃO DAS TURMAS, e não da página (05/11/2026). Ela era `document.
  // querySelectorAll('button.passo')` — a peça, e não o dono —, e passava porque só as Turmas
  // tinham passos. Quando a Linha de Base (e o verbete da anotação) chegaram à mesma página com
  // a MESMA peça, a prova passou a ler catorze botões e a chamar-lhes «três». O que ela quer
  // medir são os três passos DA TURMA; a peça ser partilhada é o desenho, e é bom que seja.
  const passos = await pg.evaluate(() => [...document.querySelectorAll('#sec-turmas button.passo')].map((b) => ({
    qual: b.getAttribute('data-passo'),
    rotulo: b.textContent.replace(/[!]/g, '').replace(/\s+/g, ' ').trim(),
    atual: b.getAttribute('aria-current'),
  })));
  provar('são três passos, nesta ordem: turma, rubrica, associar',
    passos.length === 3 && passos.map((p) => p.qual).join(',') === 'turma,rubrica,vincular', passos.map((p) => p.qual));
  provar('…e os rótulos são «Sala», «Rubricas» e «Associar»',
    passos.map((p) => p.rotulo.replace(/^\d\s*/, '')).join('|') === 'Sala|Rubricas|Associar', passos.map((p) => p.rotulo));

  // O «!» DE EDIÇÃO NOS PASSOS (18/10/2026). Saiu do cartão da turma: agora vive nos três
  // PASSOS, e só aparece quando se está a editar — fora da edição não há «!» nenhum. É o
  // que separa «navegar» de «editar».
  const semEdicao = await pg.evaluate(() => {
    const ol = document.querySelector('#sec-turmas ol.passos');
    const alertas = [...document.querySelectorAll('#sec-turmas .passo .passo-alerta')];
    return {
      editando: ol ? ol.getAttribute('data-editando') : null,
      quantos: alertas.length,
      visiveis: alertas.filter((a) => getComputedStyle(a).display !== 'none').length,
    };
  });
  provar('fora da edição, os passos NÃO têm «!»',
    semEdicao.editando === 'nao' && semEdicao.quantos === 3 && semEdicao.visiveis === 0, semEdicao);

  // FORA DA EDIÇÃO, OS PASSOS 2 E 3 NASCEM VAZIOS (18/10/2026). Não há rubrica sugerida,
  // turma pré-escolhida nem conteúdo clonado: o formulário é de CRIAÇÃO, e quem preenche é a
  // direção. O «Avançar» nasce travado e o «Cancelar» não existe, porque não há o que cancelar.
  const foraDaEdicao = await pg.evaluate(() => ({
    rubricaNome: document.getElementById('rubr-nome').value,
    rubricaNiveis: document.querySelectorAll('#rubr-niveis input').length,
    rubricaEscolhida: document.getElementById('vinc-rubrica').value,
    nomeEmFocoEscondido: document.getElementById('vinc-turma-nome').hidden,
    chips: document.querySelectorAll('#vinc-conteudos .chip').length,
    avancarTravado: document.getElementById('t-enviar').disabled,
    cancelarEscondido: ['t-cancelar', 'rubr-cancelar', 'vinc-cancelar']
      .every((id) => document.getElementById(id).hidden),
    semLimpar: !document.getElementById('rubr-limpar'),
  }));
  provar('fora da edição, os passos 2 e 3 nascem VAZIOS',
    foraDaEdicao.rubricaNome === '' && foraDaEdicao.rubricaNiveis === 0 &&
    foraDaEdicao.rubricaEscolhida === '' && foraDaEdicao.nomeEmFocoEscondido &&
    foraDaEdicao.chips === 0, foraDaEdicao);
  provar('…e o «Avançar» nasce travado, sem «Cancelar» nem «Limpar»',
    foraDaEdicao.avancarTravado && foraDaEdicao.cancelarEscondido && foraDaEdicao.semLimpar,
    foraDaEdicao);

  // Entrar em edição liga os «!». A turma «tu1» é livre: o botão dela é «Editar».
  await pg.evaluate(() => {
    const b = document.querySelector('li.turma[data-turma="tu1"] button.ajustar');
    if (b) b.click();
  });
  const emEdicao = await pg.evaluate(() => {
    const ol = document.querySelector('ol.passos');
    const alertas = [...document.querySelectorAll('.passo .passo-alerta')];
    return {
      editando: ol ? ol.getAttribute('data-editando') : null,
      visiveis: alertas.filter((a) => getComputedStyle(a).display !== 'none').length,
      turmaLembrada: (() => { try { return sessionStorage.getItem('producao:vinc-turma'); } catch (err) { return null; } })(),
    };
  });
  provar('clicar em «Editar» liga os «!» nos três passos',
    emEdicao.editando === 'sim' && emEdicao.visiveis === 3, emEdicao);
  provar('…e lembra a turma que se está a editar', emEdicao.turmaLembrada === 'tu1', emEdicao.turmaLembrada);

  // UM SÓ «EDITAR» ABRE OS TRÊS PASSOS (18/10/2026): a turma, a rubrica DELA (com nome e
  // níveis) e a associação DELA (a régua escolhida e o nome no topo). É a possibilidade que
  // o dono do produto pediu — e o «Cancelar» acompanha em cada passo, sem texto de aviso.
  const emEdicaoFormularios = await pg.evaluate(() => ({
    rubricaId: document.getElementById('rubr-id').value,
    rubricaNome: document.getElementById('rubr-nome').value,
    rubricaNiveis: [...document.querySelectorAll('#rubr-niveis input')].map((i) => i.value),
    rubricaEscolhida: document.getElementById('vinc-rubrica').value,
    nomeEmFoco: (document.getElementById('vinc-turma-nome') || {}).textContent || '',
    cancelarVisivel: ['t-cancelar', 'rubr-cancelar', 'vinc-cancelar']
      .every((id) => !document.getElementById(id).hidden),
    semTextoDeAviso: !document.getElementById('t-aviso') && !document.getElementById('t-aviso-texto'),
  }));
  provar('«Editar» abre a turma, a rubrica e a associação',
    emEdicaoFormularios.rubricaId === 'r1' &&
    emEdicaoFormularios.rubricaNome === 'Régua do Nível 1' &&
    emEdicaoFormularios.rubricaNiveis.length === 4 &&
    emEdicaoFormularios.rubricaEscolhida === 'r1' &&
    /Balé nível 1/.test(emEdicaoFormularios.nomeEmFoco), emEdicaoFormularios);
  provar('…e o «Cancelar» aparece nos três passos, sem texto de aviso',
    emEdicaoFormularios.cancelarVisivel && emEdicaoFormularios.semTextoDeAviso,
    emEdicaoFormularios);

  // O PASSO 3: escolher a turma e associar, sem recarregar a página à mão.
  await pg.evaluate(() => {
    const b = document.querySelector('button.passo[data-passo="vincular"]');
    if (b) b.click();
  });
  // Um `waitForFunction` que estoura LANÇA, e a prova morre em vez de reprovar. Aqui a espera
  // é curta e o resultado é usado como ASSERÇÃO: no controle negativo o painel não existe, e
  // quem tem de dizer isso são as provas seguintes, com o que mediram.
  const passo3Abriu = await pg.waitForFunction(() => {
    const p = document.getElementById('passo-vincular');
    return Boolean(p) && !p.hidden;
  }, { timeout: 2000 }).then(() => true).catch(() => false);
  provar('clicar em «Associar» abre o painel do passo 3', passo3Abriu === true);
  const noPasso3 = await pg.evaluate(() => {
    const p = document.getElementById('passo-vincular');
    const chips = document.querySelectorAll('#vinc-conteudos .chip');
    return {
      visivel: Boolean(p) && !p.hidden,
      // O SELECT DA TURMA SAIU (18/10/2026): a turma é a que está em foco, e o que se mostra
      // é o NOME dela no topo do formulário.
      nomeDaTurma: (document.getElementById('vinc-turma-nome') || {}).textContent || '',
      temSelectTurma: Boolean(document.getElementById('vinc-turma')),
      chipsDaTurma1: chips.length,
      estado: (document.getElementById('vinc-estado') || {}).textContent || '',
      temRubrica: Boolean(document.getElementById('vinc-rubrica')),
      temAssociarRubrica: Boolean(document.getElementById('vinc-associar')),
      temDesassociarRubrica: Boolean(document.getElementById('vinc-desassociar')),
      temAssociarTermo: Boolean(document.getElementById('vinc-associar-termo')),
    };
  });
  provar('o passo «Associar» mostra a turma em foco, sem chips de conteúdo',
    noPasso3.visivel && /Balé nível 1/.test(noPasso3.nomeDaTurma) &&
    !noPasso3.temSelectTurma && noPasso3.chipsDaTurma1 === 0, noPasso3);
  provar('…e diz com que régua a turma está hoje', /Hoje:/.test(noPasso3.estado), noPasso3.estado);
  provar('…e tem associar E desassociar a RUBRICA',
    noPasso3.temRubrica && noPasso3.temAssociarRubrica && noPasso3.temDesassociarRubrica, noPasso3);
  provar('…e NÃO associa conteúdo — isso é da curadoria', noPasso3.temAssociarTermo === false, noPasso3);

  // O CONTEÚDO MUDOU DE CASA (03/11/2026). O que era o `#vinc-conteudos` é hoje o
  // `#esc-conteudos` do formulário da CURADORIA — o mesmo `escolhedor` das alunas, com o NOME
  // do termo como valor (a lista é para o professor LER).
  //
  // E A LISTA PASSOU A SER A DOS EXERCÍCIOS QUE TÊM NOTAÇÃO (03/11/2026, pedido dela). Este
  // `TERMOS` de prova escreve «plié» e «battement tendu», minúsculos: o verbete do alfabeto é
  // «Plié» e «Battement tendu», e nenhum dos dois casa. O menu fica VAZIO — e é isso que se
  // mede aqui: a lista segue o verbete, não o vocabulário. Uma asserção que esperasse «> 1»
  // media a lista antiga (o vocabulário inteiro), que é exactamente o que saiu.
  const ALFABETO = JSON.parse(fs.readFileSync(
    path.join(raiz, 'biblioteca/modalidades/bale-classico/notacao.json'), 'utf8'));
  const comNotacao = new Set(Object.keys(ALFABETO.verbetes || {}).filter((nome) => {
    if (nome.startsWith('_')) return false;
    const musicas = ALFABETO.verbetes[nome] || {};
    return Object.keys(musicas).filter((k) => /^\d+\|/.test(k)).some((k) => {
      const celulas = (musicas[k] && musicas[k].celulas) || {};
      return Object.keys(celulas).some((d) => (celulas[d] || []).length > 0);
    });
  }));
  const conteudosOndeEstao = await pg.evaluate(() => {
    const e = document.getElementById('esc-conteudos');
    return {
      noPasso3: document.querySelectorAll('#vinc-conteudos *').length,
      naCuradoria: Boolean(e),
      opcoes: e ? [...e.querySelectorAll('select.opcoes option')].map((o) => o.value).filter(Boolean) : [],
      adicionar: e ? Boolean(e.querySelector('button.adicionar')) : false,
    };
  });
  provar('os conteúdos saíram do passo 3 e vivem no formulário da curadoria',
    conteudosOndeEstao.noPasso3 === 0 && conteudosOndeEstao.naCuradoria &&
    conteudosOndeEstao.adicionar, conteudosOndeEstao);
  provar('…e o menu só oferece exercícios com notação',
    conteudosOndeEstao.opcoes.every((v) => comNotacao.has(v)), conteudosOndeEstao.opcoes);
  provar('…e os termos da prova, que não têm verbete, não entram na lista',
    conteudosOndeEstao.opcoes.length === 0, conteudosOndeEstao.opcoes);

  // O PASSO É LEMBRADO: recarregar não devolve a direção ao passo 1.
  await pg.reload({ waitUntil: 'load' });
  await pg.evaluate(() => { const c = document.getElementById('conteudo'); if (c) c.hidden = false; });
  const depoisDeRecarregar = await pg.evaluate(() => ({
    passo: (document.querySelector('button.passo[aria-current="step"]') || {}).getAttribute
      ? document.querySelector('button.passo[aria-current="step"]').getAttribute('data-passo') : null,
    turma: (() => { try { return sessionStorage.getItem('producao:vinc-turma'); } catch (err) { return null; } })(),
  }));
  provar('o passo em que se estava é LEMBRADO depois de recarregar',
    depoisDeRecarregar.passo === 'vincular', depoisDeRecarregar);
  provar('…e a turma em foco também', depoisDeRecarregar.turma === 'tu1', depoisDeRecarregar);

  // No telefone, o par associar continua a andar junto.
  await pg.setViewport({ width: 390, height: 900 });
  await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
  await pg.evaluate(() => {
    const c = document.getElementById('conteudo'); if (c) c.hidden = false;
    location.hash = '#turmas';
    const b = document.querySelector('button.passo[data-passo="vincular"]');
    if (b) b.click();
  });
  await pg.waitForFunction(() => {
    const p = document.getElementById('passo-vincular');
    return Boolean(p) && !p.hidden && Boolean(document.getElementById('vinc-rubrica'));
  }, { timeout: 2000 }).catch(() => {});
  // O QUE SE MEDE NO TELEFONE, DEPOIS DE 03/11/2026: o par «seletor de termo + Adicionar»
  // deixou de existir no passo 3 (foi para a curadoria), e o que resta é a régua. A geometria
  // que importa é a dela: o seletor com largura útil, os dois botões juntos, e nada a estourar.
  const par = await pg.evaluate(() => {
    const s = document.getElementById('vinc-rubrica');
    const a = document.getElementById('vinc-associar');
    const d = document.getElementById('vinc-desassociar');
    const p = document.getElementById('passo-vincular');
    if (!s || !a || !d || !p) return { tem: false };
    const r = (x) => x.getBoundingClientRect();
    const caixa = p.getBoundingClientRect();
    return {
      tem: true,
      larguraDoSeletor: Math.round(r(s).width),
      estouro: p.scrollWidth - p.clientWidth,
      // `.par-botoes` é `flex-wrap:wrap`: no telefone os dois botões podem descer um para
      // baixo do outro, e isso é o desenho — o que NÃO pode é um deles sair da caixa.
      dentroDaCaixa: Math.round(r(a).right) <= Math.round(caixa.right) + 1 &&
        Math.round(r(d).right) <= Math.round(caixa.right) + 1,
      seletorDeTermo: Boolean(document.getElementById('vinc-termo')),
    };
  });
  provar('no telefone, o passo Associar não transborda em 390px',
    par && par.tem && par.estouro <= 1, par);
  provar('…e o seletor da rubrica tem largura útil',
    par && par.larguraDoSeletor > 120, par && par.larguraDoSeletor);
  provar('…e os dois botões da rubrica cabem na caixa (um pode descer)',
    par && par.dentroDaCaixa, par);
  provar('…e não há seletor de termo nenhum (o par de associação saiu)',
    par && par.seletorDeTermo === false, par);

  // O «CANCELAR» DO PASSO 3 (18/10/2026). Ele é o mesmo ato nos três passos — sair da
  // edição —, e o que se prova é o DEPOIS: a memória do preenchimento e do modo apagada, o
  // passo 1, e os formulários outra vez vazios. É a diferença entre um botão que existe e
  // um botão que faz o que promete.
  await Promise.all([
    pg.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
    pg.evaluate(() => { const b = document.getElementById('vinc-cancelar'); if (b) b.click(); }),
  ]);
  await pg.evaluate(() => {
    const c = document.getElementById('conteudo'); if (c) c.hidden = false;
    location.hash = '#turmas';
  });
  const depoisDoCancelar = await pg.evaluate(() => ({
    passo: (() => {
      const b = document.querySelector('button.passo[aria-current="step"]');
      return b ? b.getAttribute('data-passo') : null;
    })(),
    memoria: (() => {
      try {
        return {
          form: sessionStorage.getItem('producao:form'),
          editando: sessionStorage.getItem('producao:editando'),
          turma: sessionStorage.getItem('producao:vinc-turma'),
        };
      } catch (err) { return null; }
    })(),
    nome: document.getElementById('tnome').value,
    rubricaNome: document.getElementById('rubr-nome').value,
    rubricaEscolhida: document.getElementById('vinc-rubrica').value,
    nomeEmFocoEscondido: document.getElementById('vinc-turma-nome').hidden,
  }));
  provar('o «Cancelar» sai da edição: passo 1 e memória limpa',
    depoisDoCancelar.passo === 'turma' && depoisDoCancelar.memoria &&
    depoisDoCancelar.memoria.form === null && depoisDoCancelar.memoria.editando === null &&
    depoisDoCancelar.memoria.turma === null, depoisDoCancelar);
  provar('…e os formulários ficam outra vez vazios',
    depoisDoCancelar.nome === '' && depoisDoCancelar.rubricaNome === '' &&
    depoisDoCancelar.rubricaEscolhida === '' && depoisDoCancelar.nomeEmFocoEscondido,
    depoisDoCancelar);

  // ---- 16: O «CANCELAR» DA CURADORIA — a mesma regra, e sem texto de aviso ----------
  //
  // «A mesma coisa tem que ser pra todos os formulários» (18/10/2026): ao lado do botão,
  // escondido fora da edição, e sem a frase que explicava o modo. Aqui mede-se o estado,
  // porque é ele que a pessoa vê: nasce escondido, aparece ao «Editar», e o formulário
  // volta a «Atribuir curadoria» quando se cancela.
  await pg.evaluate(() => { location.hash = '#curadorias'; });
  await new Promise((r) => setTimeout(r, 250));
  const curadoriaAntes = await pg.evaluate(() => ({
    cancelarEscondido: document.getElementById('cu-cancelar').hidden,
    textoDeAviso: Boolean(document.getElementById('cu-aviso-texto')),
    vigenciaEscondida: document.getElementById('cu-vigencia-campo').hidden,
    botao: document.getElementById('cu-enviar').textContent.trim(),
  }));
  provar('a curadoria nasce sem «Cancelar» e sem texto de aviso',
    curadoriaAntes.cancelarEscondido === true && curadoriaAntes.textoDeAviso === false &&
    curadoriaAntes.vigenciaEscondida === true && curadoriaAntes.botao === 'Atribuir turma',
    curadoriaAntes);

  await pg.evaluate(() => {
    const b = document.querySelector('#sec-curadorias button.ajustar');
    if (b) b.click();
  });
  const curadoriaEditando = await pg.evaluate(() => ({
    cancelarVisivel: document.getElementById('cu-cancelar').hidden === false,
    mesmaFileira: document.getElementById('cu-cancelar').closest('.par-botoes') ===
      document.getElementById('cu-enviar').closest('.par-botoes'),
    botao: document.getElementById('cu-enviar').textContent.trim(),
    professorTravado: document.getElementById('cuprofessor').disabled,
    professor: document.getElementById('cuprofessor').value,
    alunas: [...document.querySelectorAll('#esc-alunas .escolhido')]
      .map((f) => f.getAttribute('data-valor')),
  }));
  provar('«Editar» mostra o «Cancelar» ao lado do botão, e nada explica o modo',
    curadoriaEditando.cancelarVisivel && curadoriaEditando.mesmaFileira &&
    curadoriaEditando.botao === 'Gravar turma', curadoriaEditando);
  provar('…com as alunas da curadoria já nas fichas',
    curadoriaEditando.alunas.length > 0 && curadoriaEditando.professorTravado === true,
    curadoriaEditando);

  await pg.evaluate(() => document.getElementById('cu-cancelar').click());
  const curadoriaCancelada = await pg.evaluate(() => ({
    cancelarEscondido: document.getElementById('cu-cancelar').hidden,
    botao: document.getElementById('cu-enviar').textContent.trim(),
    professorDestravado: document.getElementById('cuprofessor').disabled === false,
    alunas: document.querySelectorAll('#esc-alunas .escolhido').length,
    vigenciaEscondida: document.getElementById('cu-vigencia-campo').hidden,
  }));
  provar('cancelar a curadoria devolve o formulário a «Atribuir curadoria»',
    curadoriaCancelada.cancelarEscondido && curadoriaCancelada.botao === 'Atribuir turma' &&
    curadoriaCancelada.professorDestravado && curadoriaCancelada.alunas === 0 &&
    curadoriaCancelada.vigenciaEscondida, curadoriaCancelada);

  // ---- 17: O NOME DO PROFESSOR CUJA CURADORIA TEM PLANO É O CAMINHO PARA ELE ------
  //
  // «Com plano, o nome dele se torna um link que leva direto para o plano de ensino dele.
  // Sem plano, o nome fica exatamente como está» (18/10/2026). E o selo acompanha: «livre»
  // enquanto não há plano, «vinculada» quando há — a MESMA regra de proveniência das
  // outras listas, e o que a prova mede aqui é que as duas coisas andam juntas.
  const curadoriasLista = await pg.evaluate(() => {
    const linhas = [...document.querySelectorAll('#sec-curadorias .lista li')];
    return linhas.map((li) => {
      const b = li.querySelector('.nome b');
      const a = li.querySelector('.nome b a.nome-link');
      const selo = li.querySelector('.selo');
      return {
        nome: (b || {}).textContent || '',
        link: a ? a.getAttribute('href') : null,
        selo: selo ? selo.textContent.trim() : '',
        modo: (li.querySelector('[data-curadoria-ajustar]') || {}).getAttribute
          ? li.querySelector('[data-curadoria-ajustar]').getAttribute('data-modo') : null,
      };
    });
  });
  const comPlano = curadoriasLista.find((l) => l.nome === 'Leticia') || {};
  const semPlano = curadoriasLista.find((l) => l.nome === 'Tiago Menegaz') || {};
  provar('o professor COM plano tem o nome como link para o plano de ensino',
    /^\/plano-ensino\/\?/.test(String(comPlano.link || '')) &&
    comPlano.link.indexOf('professor=leticia') !== -1 &&
    comPlano.link.indexOf('escola=fita') !== -1 &&
    comPlano.link.indexOf('ciclo=01') !== -1, comPlano);
  provar('…e o selo dele diz «vinculada»',
    comPlano.selo === 'vinculada' && comPlano.modo === 'derivar', comPlano);
  provar('o professor SEM plano fica como está: sem link, «livre», e editável',
    semPlano.link === null && semPlano.selo === 'livre' && semPlano.modo === 'editar', semPlano);

  // ---- 18: A FAIXA DOS PASSOS É UMA LINHA SÓ, POR BAIXO DO TÍTULO -------------------
  //
  // «No celular, o botão do acordeão está fazendo os steps criarem duas linhas … o step tem
  // que continuar com uma linha e o botão de acordeão logo no final, do lado direito»
  // (18/10/2026). Aqui só a geometria o pode dizer: no telefone, um pixel a mais na faixa e a
  // terceira pílula desce — e nenhum atributo no HTML fica diferente por isso. Mede-se nas
  // três larguras de telefone, nos DOIS estados (editando e não), porque é o «!» da edição
  // que rouba largura aos rótulos.
  //
  // A SETA SAIU DA FAIXA E SUBIU AO TÍTULO (01/11/2026), e é a segunda metade do mesmo
  // pedido: «os steps de Turma têm o botão de colapsar ou expandir na mesma linha dos steps […]
  // nos demais, o botão está no título. Então aqui na Turma vamos fazer esse ajuste, deixar
  // igual aos demais». O que se mede passa a ser três coisas, e todas de geometria: a faixa
  // numa linha só; a seta DENTRO do título e FORA da faixa; e a faixa a atravessar o corpo de
  // ponta a ponta, acima do formulário E da listagem — «vão ficar num bloco acima, abaixo do
  // título, mas acima do formulário e dos exercícios».
  for (const w of [414, 390, 360, 320, 1280]) {
    for (const editando of [false, true]) {
      await pg.setViewport({ width: w, height: 900 });
      await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
      await abrirTurmas(pg);
      if (editando) {
        await pg.evaluate(() => {
          const ol = document.querySelector('#sec-turmas ol.passos');
          if (ol) ol.setAttribute('data-editando', 'sim');
        });
      }
      const faixa = await pg.evaluate(() => {
        const f = document.querySelector('.turmas-faixa');
        const ol = f.querySelector('.passos');
        const seta = document.getElementById('alternar-form');
        const titulo = document.querySelector('#sec-turmas h2');
        const corpo = document.querySelector('.turmas-corpo');
        // A COLUNA DO FORMULÁRIO, e não o `.col-form` do painel: o painel de um passo que
        // não é o corrente está `hidden`, e um elemento dentro de um `hidden` mede zero em
        // tudo — inclusive no `top`, que passava a 0 e fazia a asserção falhar por medir o
        // vazio. `#turmas-form` é a coluna, e está sempre à vista.
        const colForm = document.getElementById('turmas-form');
        const lista = document.querySelector('#sec-turmas .col-lista');
        const r = (x) => x.getBoundingClientRect();
        return {
          linhas: new Set([...ol.querySelectorAll('li')].map((li) => Math.round(r(li).top))).size,
          passoDentro: Math.round(r(ol.querySelector('li:last-child .passo')).right) <= Math.round(r(f).right),
          setaNoTitulo: Boolean(seta) && titulo.contains(seta),
          setaForaDaFaixa: Boolean(seta) && !f.contains(seta),
          setaLadoANome: leftDe(seta) >= rightDe(titulo.querySelector('.secao-nome')),
          faixaLarguraToda: Math.abs(r(f).width - r(corpo).width) <= 1,
          faixaAcimaDoFormulario: Math.round(r(colForm).top) >= Math.round(r(f).bottom),
          faixaAcimaDaLista: Math.round(r(lista).top) >= Math.round(r(f).bottom),
          cortados: [...ol.querySelectorAll('.passo-t')].filter((t) => t.scrollWidth > t.clientWidth + 1).length,
          estouro: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
        function leftDe(e) { return Math.round(r(e).left); }
        function rightDe(e) { return Math.round(r(e).right); }
      });
      const onde = w + 'px' + (editando ? ' (editando)' : '');
      provar(`em ${onde} os três passos ficam numa LINHA só`, faixa.linhas === 1, faixa);
      provar(`em ${onde} a seta vive no TÍTULO, e não na faixa`,
        faixa.setaNoTitulo && faixa.setaForaDaFaixa && faixa.setaLadoANome && faixa.passoDentro, faixa);
      provar(`em ${onde} a faixa atravessa o corpo, acima do formulário e da listagem`,
        faixa.faixaLarguraToda && faixa.faixaAcimaDoFormulario && faixa.faixaAcimaDaLista, faixa);
      provar(`em ${onde} os rótulos cabem inteiros e a página não estoura`,
        faixa.cortados === 0 && faixa.estouro === 0, faixa);
    }
  }

  await br.close();
  srv.close();
  console.log(`\nprovar-cartao-da-turma: ${falhas === 0 ? 'TUDO CERTO' : falhas + ' FALHA(S)'}`);
  process.exit(falhas ? 1 : 0);
})();
