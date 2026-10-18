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
 *   9. o painel dos conteúdos MOSTRA e não compõe: tem os chips, e não tem seletor, nem
 *      botão «Associar», nem «×»;
 *  10. o formulário da TURMA não tem mais o bloco — só se associa conteúdo a uma turma que
 *      já existe, e ali ela ainda está a nascer;
 *  11. os três passos, na ordem, com os rótulos «Turma», «Rubricas» e «Associar»;
 *  12. o cartão da turma traz um «!» âmbar POR ETAPA, e cada um leva ao passo com aquela
 *      turma escolhida;
 *  13. o passo «Associar» mostra os chips da turma escolhida, diz com que régua ela está
 *      hoje, e tem associar E desassociar a rubrica e o conteúdo;
 *  14. o passo e a turma são LEMBRADOS depois de recarregar — sem isso, cada associação
 *      devolvia a direção ao passo 1 e à primeira turma da lista.
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
  // A VINCULADA: tem plano de ensino, e é por isso que o botão dela é «Derivar» e não
  // «Editar». É nela que se prova o modo derivar — no modo editar não há como.
  {
    id: 'tu3', nome: 'Balé nível 3, Grade 3', nivelReferencia: 'RAD',
    frequencia: 1, dias: ['sex'], horarios: { sex: '17:00' }, duracaoMin: 45,
    periodoInicio: '2026-02', periodoFim: '2026-06',
  },
];

const REL = { tu1: ['t1', 't2'], tu3: ['t1', 't2'] };

/** O par turma↔plano que faz uma turma ser VINCULADA (o `pares` do `paginaProducao`). */
const PARES = [{ turma: 'Balé nível 3, Grade 3' }];

function pagina(motor) {
  const b = require(path.join(motor, 'servidor/bastidores.js'));
  // OS NOMES DOS PARÂMETROS ENGANAM: `trms` é a lista de TURMAS e `trmos` é a de TERMOS
  // (ver as duas primeiras linhas do corpo da função). Trocados, a página desenha um TERMO
  // como se fosse uma turma — com `data-turma` igual ao id do termo e o nome vazio — e a
  // prova mede uma coisa que não existe sem dizer nada.
  return b.paginaProducao('fita', CONTEXTO, [], [], 'Tiago Menegaz', 'tiago-menegaz', TURMAS, TERMOS, REL, [], [], PARES);
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

  // ---- 9 a 14: a ASSOCIAÇÃO vive no PASSO 3, e o passo é uma SEQUÊNCIA ------------
  //
  // A regra mudou duas vezes (18/10/2026), e a segunda corrigiu a primeira:
  //
  //   1. a associação saiu do cartão (o painel passou a MOSTRAR);
  //   2. e saiu TAMBÉM do formulário da turma — só se associa conteúdo a uma turma que já
  //      existe, e o cadastro é o sítio onde ela ainda está a nascer. Foi para o passo 3,
  //      «Associar», que é onde a turma já existe e recebe a régua e os conteúdos.
  //
  // As provas abaixo medem as três coisas: o que o painel do cartão deixou de ter, o que o
  // formulário da turma deixou de ter, e o que o passo 3 passou a ter.

  await pg.evaluate(() => { location.hash = '#turmas'; });
  await pg.waitForFunction(() => {
    const s = document.getElementById('sec-turmas');
    return s && !s.hidden;
  }, { timeout: 5000 });

  const painelDeConteudos = await pg.evaluate((sel) => {
    const l = document.querySelector(sel);
    if (!l) return null;
    const p = l.querySelector('.painel[data-painel="conteudos"]');
    if (!p) return { tem: false };
    return {
      tem: true,
      chips: p.querySelectorAll('.chip').length,
      temSeletor: Boolean(p.querySelector('.sel-termo')),
      temAssociar: Boolean(p.querySelector('.associar')),
      temRemover: p.querySelectorAll('button.desassociar').length,
    };
  }, LI);
  provar('o painel dos conteúdos mostra os chips',
    painelDeConteudos && painelDeConteudos.tem && painelDeConteudos.chips === 2, painelDeConteudos);
  provar('…e NÃO tem o seletor de associação', painelDeConteudos && painelDeConteudos.temSeletor === false, painelDeConteudos);
  provar('…nem o botão «Associar»', painelDeConteudos && painelDeConteudos.temAssociar === false, painelDeConteudos);
  provar('…nem o «×» de remover', painelDeConteudos && painelDeConteudos.temRemover === 0, painelDeConteudos);

  // O FORMULÁRIO DA TURMA NÃO TEM MAIS O BLOCO — ele só cria a turma.
  const noCadastro = await pg.evaluate(() => ({
    noFormularioDaTurma: Boolean(document.getElementById('form-turma'))
      && document.getElementById('form-turma').contains(document.getElementById('t-conteudos')),
    temBlocoDaTurma: Boolean(document.getElementById('t-conteudos')),
    temBlocoNoPasso3: Boolean(document.getElementById('vinc-conteudos')),
  }));
  provar('o formulário da TURMA não tem mais bloco de conteúdos',
    noCadastro.noFormularioDaTurma === false && noCadastro.temBlocoDaTurma === false, noCadastro);
  provar('o bloco de conteúdos existe no passo ASSOCIAR', noCadastro.temBlocoNoPasso3 === true, noCadastro);

  // OS TRÊS PASSOS: o rótulo, a ordem e o nome semântico.
  const passos = await pg.evaluate(() => [...document.querySelectorAll('button.passo')].map((b) => ({
    qual: b.getAttribute('data-passo'),
    rotulo: b.textContent.replace(/\s+/g, ' ').trim(),
    atual: b.getAttribute('aria-current'),
  })));
  provar('são três passos, nesta ordem: turma, rubrica, associar',
    passos.length === 3 && passos.map((p) => p.qual).join(',') === 'turma,rubrica,vincular', passos.map((p) => p.qual));
  provar('…e os rótulos são «Turma», «Rubricas» e «Associar»',
    passos.map((p) => p.rotulo.replace(/^\d\s*/, '')).join('|') === 'Turma|Rubricas|Associar', passos.map((p) => p.rotulo));

  // O «!» DE CADA ETAPA, no cartão da turma.
  const atalhos = await pg.evaluate((sel) => {
    const l = document.querySelector(sel);
    if (!l) return null;
    const bs = [...l.querySelectorAll('[data-ir-para]')];
    return {
      quantos: bs.length,
      destinos: bs.map((b) => b.getAttribute('data-ir-para')),
      turma: bs.map((b) => b.getAttribute('data-turma-de')),
      titulos: bs.map((b) => (b.getAttribute('title') || '').slice(0, 24)),
      cor: bs[0] ? getComputedStyle(bs[0].querySelector('.alerta')).backgroundColor : '',
    };
  }, LI);
  provar('o cartão da turma traz um atalho por etapa', atalhos && atalhos.quantos === 3, atalhos && atalhos.quantos);
  provar('…e cada um sabe a que passo vai e de que turma',
    atalhos && atalhos.destinos.join(',') === 'turma,rubrica,vincular' && atalhos.turma.every((x) => x === 'tu1'), atalhos);
  provar('…e cada um diz, no title, o que ali se edita',
    atalhos && atalhos.titulos.every((s) => s.length > 10), atalhos && atalhos.titulos);
  // ÂMBAR, e não vermelho: o «!» anuncia uma PORTA, não um defeito. Vermelho faria
  // procurar um erro que não existe.
  provar('…e o «!» é âmbar', atalhos && /^rgb\(143, 90, 18\)$/.test(atalhos.cor), atalhos && atalhos.cor);

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
    const sel = document.getElementById('vinc-turma');
    const chips = document.querySelectorAll('#vinc-conteudos .chip');
    return {
      visivel: Boolean(p) && !p.hidden,
      turmasNoSelect: sel ? sel.options.length : 0,
      chipsDaTurma1: chips.length,
      estado: (document.getElementById('vinc-estado') || {}).textContent || '',
      temRubrica: Boolean(document.getElementById('vinc-rubrica')),
      temAssociarRubrica: Boolean(document.getElementById('vinc-associar')),
      temDesassociarRubrica: Boolean(document.getElementById('vinc-desassociar')),
      temAssociarTermo: Boolean(document.getElementById('vinc-associar-termo')),
    };
  });
  provar('o passo «Associar» mostra a turma escolhida e os chips DELA',
    noPasso3.visivel && noPasso3.turmasNoSelect === 3 && noPasso3.chipsDaTurma1 === 2, noPasso3);
  provar('…e diz com que régua a turma está hoje', /Hoje:/.test(noPasso3.estado), noPasso3.estado);
  provar('…e tem associar E desassociar a RUBRICA',
    noPasso3.temRubrica && noPasso3.temAssociarRubrica && noPasso3.temDesassociarRubrica, noPasso3);
  provar('…e associar o CONTEÚDO', noPasso3.temAssociarTermo === true, noPasso3);

  // Trocar de turma troca os chips — o bloco segue o `select`.
  await pg.evaluate(() => {
    const sel = document.getElementById('vinc-turma');
    if (!sel) return;
    for (const o of sel.options) if (o.value === 'tu3') { sel.value = 'tu3'; break; }
    sel.dispatchEvent(new Event('change'));
  });
  const trocou = await pg.evaluate(() => ({
    chips: document.querySelectorAll('#vinc-conteudos .chip').length,
    remover: document.querySelectorAll('#vinc-conteudos button.desassociar').length,
    estado: (document.getElementById('vinc-estado') || {}).textContent || '',
  }));
  provar('trocar a turma troca os chips', trocou.chips === 2 && trocou.remover === 2, trocou);
  provar('…e o estado da régua acompanha', /Balé nível 3/.test(trocou.estado), trocou.estado);

  // O PASSO É LEMBRADO: recarregar não devolve a direção ao passo 1.
  await pg.reload({ waitUntil: 'load' });
  await pg.evaluate(() => { const c = document.getElementById('conteudo'); if (c) c.hidden = false; });
  const depoisDeRecarregar = await pg.evaluate(() => ({
    passo: (document.querySelector('button.passo[aria-current="step"]') || {}).getAttribute
      ? document.querySelector('button.passo[aria-current="step"]').getAttribute('data-passo') : null,
    turma: (document.getElementById('vinc-turma') || {}).value,
  }));
  provar('o passo em que se estava é LEMBRADO depois de recarregar',
    depoisDeRecarregar.passo === 'vincular', depoisDeRecarregar);
  provar('…e a turma escolhida também', depoisDeRecarregar.turma === 'tu3', depoisDeRecarregar);

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
    return Boolean(p) && !p.hidden && Boolean(document.getElementById('vinc-termo'));
  }, { timeout: 2000 }).catch(() => {});
  const par = await pg.evaluate(() => {
    const s = document.getElementById('vinc-termo');
    const b = document.getElementById('vinc-associar-termo');
    const caixa = document.getElementById('vinc-conteudos');
    if (!s || !b) return { tem: false };
    const r = (x) => x.getBoundingClientRect();
    return {
      tem: true,
      mesmaLinha: Math.abs(r(s).top - r(b).top) <= 4,
      dentro: Math.round(r(b).right) <= Math.round(r(caixa.parentElement).right) + 1,
      larguraDoSeletor: Math.round(r(s).width),
      estouro: caixa.parentElement.scrollWidth - caixa.parentElement.clientWidth,
    };
  });
  provar('no telefone, no passo Associar, o seletor e o botão ficam na MESMA linha',
    par && par.tem && par.mesmaLinha, par);
  provar('…e o botão fica dentro do bloco', par && par.dentro, par);
  provar('…e o seletor tem largura útil', par && par.larguraDoSeletor > 120, par && par.larguraDoSeletor);
  provar('…e o bloco não transborda em 390px', par && par.estouro <= 1, par && par.estouro);

  await br.close();
  srv.close();
  console.log(`\nprovar-cartao-da-turma: ${falhas === 0 ? 'TUDO CERTO' : falhas + ' FALHA(S)'}`);
  process.exit(falhas ? 1 : 0);
})();
