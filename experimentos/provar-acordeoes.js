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
  // O VOCABULÁRIO SAIU (01/11/2026) e o VERBETES entrou no lugar dele: as duas são secções com
  // acordeão, e a prova mede a peça, não o assunto. Trocar um pelo outro mantém a cobertura —
  // e mede a secção que a página GANHOU em importância, que é agora a porta do exercício.
  ['verbetes', 'sec-verbetes', 'verbetes-miolo'],
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

/** O verbete que faz existir um cartão no Estilo — e o gesto dele na coluna das acções. */
const VERBETE = {
  ok: true,
  verbetes: { 'Plié': { '4/4|A': { metodo: 'RAD', posicao: 'barra', trechos: [] } } },
  exercicios: [{
    nome: 'Plié', escola: true, emTurma: [], trechos: 1,
    porMusica: [{ chave: '4/4|A', tempos: '4/4', compasso: '4/4', trechos: 1, escola: true,
      categorias: ['passo'], direcoes: [], orientacoes: [] }],
  }],
  exerciciosDoVocabulario: [{ termo: 'Plié', categoria: 'passo', tradicao: 'RAD', descricao: 'dobra' }],
  posicoes: [], direcoes: [], orientacoes: [], categoriasDeBloco: ['Pé'],
  descricoes: {}, sinais: [{ sinal: '→', nome: 'conduz a', grupo: 'Movimento' }],
};

/** O elenco que faz existir um cartão na Audição, com o «Editar» dele. */
const ELENCOS = [{
  id: 'elenco-1', nome: 'Elenco 1', professor: 'Leticia',
  alunas: ['Vavá'], campos: [], turma: '',
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
    /* OS DADOS QUE FALTAM PARA OS GESTOS EXISTIREM (18/11/2026). O «Derivar» do Estilo e o da
     * Audição são botões DESENHADOS PELO CLIENTE a partir destas duas rotas; com o `{ok:true}`
     * genérico a lista fica vazia, não há botão nenhum, e a asserção do gesto passaria por
     * ausência — que é a pior forma de uma prova passar. */
    if (caminho === '/api/bastidores/verbete') return ok('application/json', JSON.stringify(VERBETE));
    if (caminho === '/api/bastidores/linhas-de-base') return ok('application/json', JSON.stringify({ ok: true, linhas: ELENCOS }));
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

      /* A REGRA NOVA (18/11/2026) — «quando abrir a primeira vez, deve estar colapsado».
       *
       * A prova media o contrário: nascia aberta e o primeiro toque recolhia. Com o padrão
       * invertido, ela mediria o rastro da regra antiga em cada medida — por isso a ordem do
       * guião mudou: agora começa fechada, o primeiro toque ABRE, e o segundo fecha. O que se
       * mede é o mesmo (estado, geometria, memória); o sentido é que se inverteu. */
      const inicial = await ler(pg, id);
      provar(`@${w} · ${nome}: a primeira vez nasce RECOLHIDA — o formulário não está à vista`,
        inicial.recolhido === 'sim' && !inicial.formVisivel && inicial.tituloVisivel &&
        inicial.seta === '\u25B8' && inicial.expandido === 'false' &&
        /Abrir/.test(String(inicial.rotulo)) &&
        inicial.lista === inicial.secao && inicial.colunas === 1, inicial);

      // O ESTADO DAS OUTRAS ANTES DO TOQUE: a asserção do isolamento é «não MUDOU», e não
      // «está aberta». Com o padrão recolhido, «as outras estão abertas» deixou de ser verdade
      // no arranque — mas «o meu toque não lhes toca» continua a ser o que se quer saber.
      const antesDoToque = await pg.evaluate(([idDaSecao, ids]) => {
        const fora = {};
        // A PRÓPRIA SECÇÃO SAI DA COMPARAÇÃO: é ela que o toque muda, e compará-la consigo
        // mesma seria pedir que o gesto não fizesse nada.
        for (const outro of ids) {
          if (outro === idDaSecao) continue;
          fora[outro] = document.getElementById(outro).getAttribute('data-recolhido');
        }
        return fora;
      }, [id, SECOES.map((x) => x[1])]);

      const tocou = await tocarSeta(pg, id);
      provar(`@${w} · ${nome}: a seta responde ao toque`, tocou === true, tocou);
      await new Promise((r) => setTimeout(r, 90));

      const aberto = await ler(pg, id);
      provar(`@${w} · ${nome}: a seta abre — o formulário entra e a lista volta à coluna dela`,
        aberto.recolhido === 'nao' && aberto.formVisivel && aberto.tituloVisivel &&
        aberto.seta === '\u25BE' && aberto.expandido === 'true' &&
        aberto.colunas === (estreita ? 1 : 2), aberto);

      // AS OUTRAS NÃO SE MEXERAM. É a regressão que o `data-acordeao` evita: as seis setas
      // têm a mesma classe, e sem o gancho a do vocabulário recolhia as turmas.
      const depois = await pg.evaluate(([idDaSecao, ids]) => {
        const fora = {};
        for (const outro of ids) {
          if (outro === idDaSecao) continue;
          fora[outro] = document.getElementById(outro).getAttribute('data-recolhido');
        }
        return fora;
      }, [id, SECOES.map((x) => x[1])]);
      provar(`@${w} · ${nome}: a seta dela não mexe nas outras secções`,
        JSON.stringify(depois) === JSON.stringify(antesDoToque), depois);

      // A MESMA SETA RECOLHE, e recolhida a listagem ocupa a largura toda — é o pedido de
      // 18/10/2026, medido em pixels e não em intenção.
      await tocarSeta(pg, id);
      await new Promise((r) => setTimeout(r, 90));
      const recolhido = await ler(pg, id);
      provar(`@${w} · ${nome}: a mesma seta recolhe — e a listagem mede a largura inteira`,
        recolhido.recolhido === 'sim' && !recolhido.formVisivel && recolhido.tituloVisivel &&
        recolhido.seta === '\u25B8' && recolhido.expandido === 'false' &&
        recolhido.lista === recolhido.secao && recolhido.colunas === 1, recolhido);
    }

    // O BOTÃO DO CATÁLOGO INICIAL. Ele é `nowrap` por herança da folha — decisão certa para
    // «Avançar» e errada para um rótulo de 47 caracteres: em 320px media 367px dentro de uma
    // coluna de 288, e a PÁGINA rolava de lado. Mede-se o que transbordava.
    //
    // ELE MUDOU DE SECÇÃO (01/11/2026): vive agora no «+» do verbete, que é uma caixa escondida
    // até se clicar — e uma caixa escondida não tem largura. Abre-se o modo do exercício antes de
    // medir; sem isso, `getBoundingClientRect` devolve zero e a prova passaria sem medir nada.
    await abrir(pg, 'sec-verbetes');
    /* A SECÇÃO TEM DE ESTAR ABERTA PARA O BOTÃO TER LARGURA (18/11/2026). Ela passou a nascer
     * recolhida, e a folha esconde o `.col-form` — a caixa do «+» fica dentro de um `display:none`
     * e mede ZERO. A asserção seguinte comparava 0 com 0 e passava sem medir nada: é a
     * «prova que passa por ausência», a pior de todas. Abre-se com a seta, que é o gesto real. */
    await tocarSeta(pg, 'sec-verbetes');
    await new Promise((r) => setTimeout(r, 90));
    await pg.evaluate(() => { if (typeof modoExercicio === 'function') modoExercicio(true); });
    await new Promise((r) => setTimeout(r, 150));
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
      semear.botao > 0 && semear.coluna > 0 && semear.botao <= semear.coluna, semear);

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
  /* O QUE SE LEMBRA AGORA É O ABERTO (18/11/2026). Antes, o padrão era «aberta» e o que se
   * guardava era o recolhimento; com o padrão recolhido, `"nao"` passou a ser a decisão a
   * preservar. Mede-se o par: quem ABRIU o Estilo volta a encontrá-lo aberto, e quem nunca lhe
   * tocou volta a encontrá-lo fechado — que é a prova de que a chave ausente não é o mesmo
   * facto que a chave com «nao». */
  await abrir(pg, 'sec-verbetes');
  await tocarSeta(pg, 'sec-verbetes');
  await pg.reload({ waitUntil: 'load' });
  await abrir(pg, 'sec-verbetes');
  const lembrado = await pg.evaluate(() => {
    const g = (id) => document.getElementById(id).getAttribute('data-recolhido');
    return { verbetes: g('sec-verbetes'), alunas: g('sec-alunas'), professores: g('sec-professores') };
  });
  provar('o estado é lembrado depois de recarregar — só o da secção mexida',
    lembrado.verbetes === 'nao' && lembrado.alunas === 'sim' && lembrado.professores === 'sim',
    lembrado);
  const lembradoVisivel = await pg.evaluate(() =>
    document.querySelector('#sec-verbetes .col-form')
      ? document.querySelector('#sec-verbetes .col-form').getBoundingClientRect().width > 0 : false);
  provar('…e o formulário que ela abriu está mesmo à vista, e não só o atributo',
    lembradoVisivel === true, lembradoVisivel);

  // ---- «DERIVAR» E «EDITAR» ABREM O FORMULÁRIO RECOLHIDO (18/11/2026) ------------------
  //
  // O PEDIDO, ao pé da letra: «se eu estou em turma ou em estilo ou em audição ou em salas, ou em
  // alunas ou em professor, qualquer um desses se estiver com o formulário colapsado e clicar em
  // derivar, tem que expandir o formulário. Expande o formulário para poder o usuário fazer a
  // edição que ele quiser fazer».
  //
  // PORQUE ISTO É UM DEFEITO E NÃO UM PORMENOR. O botão do gesto vive na LISTA, que fica à vista
  // quando o formulário recolhe. Sem esta ligação, clicar em «Derivar» preenchia campos dentro de
  // um painel fechado: o trabalho acontecia e não se via nada — «cliquei e não aconteceu nada».
  //
  // MEDE-SE POR CLIQUE A SÉRIO no botão do gesto, e a asserção é a GEOMETRIA de depois: o
  // formulário com largura maior que zero. Um `data-recolhido="nao"` sozinho diria que o atributo
  // mudou, não que a pessoa passou a ver o formulário.
  {
    const GESTOS = [
      ['Turmas', 'sec-curadorias', '[data-curadoria-ajustar]'],
      ['Salas', 'sec-turmas', '[data-turma-ajustar]'],
      ['Estilo', 'sec-verbetes', '[data-editar-verbete]'],
      ['Audição', 'sec-corpo', '[data-lb-editar]'],
      ['Professores', 'sec-professores', 'button.editar'],
    ];
    for (const [nome, id, seletor] of GESTOS) {
      await pg.setViewport({ width: 1280, height: 1400 });
      await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
      await pg.evaluate(() => { try { sessionStorage.clear(); } catch (e) { /* modo privado */ } });
      await pg.reload({ waitUntil: 'load' });
      await abrir(pg, id);
      // As rotas respondem com `fetch` de verdade, e o cartão do elenco e o do verbete são
      // desenhados DEPOIS da resposta: sem esta espera, o clique procuraria um botão que ainda
      // não existe e a asserção falharia por pressa, não por defeito.
      await new Promise((r) => setTimeout(r, 250));

      const antes2 = await ler(pg, id);
      const temBotao = await pg.evaluate((sel) => Boolean(document.querySelector(sel)), seletor);
      provar(`${nome}: o cartão oferece o gesto, e o formulário está recolhido antes do clique`,
        temBotao === true && antes2.recolhido === 'sim' && !antes2.formVisivel,
        { temBotao, recolhido: antes2.recolhido, formVisivel: antes2.formVisivel });

      const clicou = await pg.evaluate((sel) => {
        const b = document.querySelector(sel);
        if (!b) return false;
        b.click();
        return true;
      }, seletor);
      provar(`${nome}: o gesto responde ao clique`, clicou === true, clicou);
      await new Promise((r) => setTimeout(r, 400));

      const depois2 = await ler(pg, id);
      provar(`${nome}: o gesto ABRE o formulário recolhido — é o que ela pediu`,
        depois2.recolhido === 'nao' && depois2.formVisivel && depois2.seta === '\u25BE' &&
        depois2.expandido === 'true', depois2);
    }

    /* E A OUTRA METADE: QUEM NUNCA CLICOU EM NADA ENCONTRA O FORMULÁRIO FECHADO. Sem esta
     * asserção, «abre no gesto» poderia estar a passar porque TUDO abre no arranque — e o
     * recolhimento por omissão, que é metade do pedido, ficaria por medir. */
    await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
    await pg.evaluate(() => { try { sessionStorage.clear(); } catch (e) { /* modo privado */ } });
    await pg.reload({ waitUntil: 'load' });
    const todasFechadas = await pg.evaluate((ids) => {
      const fora = {};
      for (const id of ids) {
        const s = document.getElementById(id);
        const form = s.querySelector('.col-form');
        fora[id] = {
          estado: s.getAttribute('data-recolhido'),
          visivel: Boolean(form) && form.getBoundingClientRect().width > 0,
        };
      }
      return fora;
    }, SECOES.map((x) => x[1]));
    provar('sem ninguém tocar em nada, as cinco secções nascem TODAS fechadas',
      Object.values(todasFechadas).every((x) => x.estado === 'sim' && x.visivel === false),
      todasFechadas);
  }

  /* ---- O «CANCELAR» FECHA O FORMULÁRIO (18/11/2026) --------------------------------
   *
   * «Quando clicar em cancelar, tem que colapsar de novo o formulário e limpar todos os campos
   * que estiverem preenchidos. […] o cancelar cancela de fato aquela edição, aquela derivação,
   * mas vai colapsar o formulário. Essa é a regra agora que tem que acontecer para todos.»
   *
   * MEDE-SE O EFEITO, e não a chamada: o formulário deixa de ter largura, a secção passa a dizer
   * `data-recolhido="sim"`, e o campo que se tinha escrito fica vazio. Uma asserção que só visse
   * o atributo passaria com um formulário ainda à vista — que é o estado que ela descreveu como
   * errado: cancelar e ficar aberto, com os campos vazios, à espera de ser confundido com
   * trabalho pronto.
   *
   * O CAMINHO É O DELA: primeiro o gesto que abre (a lista), depois o «Cancelar».
   */
  {
    const CANCELARES = [
      ['Turmas', 'sec-curadorias', '[data-curadoria-ajustar]', '#cu-cancelar', '#form-curadoria'],
      ['Salas', 'sec-turmas', '[data-turma-ajustar]', '#t-cancelar', '#form-turma'],
      ['Estilo', 'sec-verbetes', '[data-editar-verbete]', '#vb-cancelar', '#form-verbete'],
      ['Audição', 'sec-corpo', '[data-lb-editar]', '#lb-cancelar', '#form-linha-base'],
      ['Professores', 'sec-professores', 'button.editar', '#prof-cancelar', '#form-prof'],
    ];
    for (const [nome, id, seletorDoGesto, seletorDoCancelar, seletorDoForm] of CANCELARES) {
      await pg.setViewport({ width: 1280, height: 1400 });
      await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
      await pg.evaluate(() => { try { sessionStorage.clear(); } catch (e) { /* modo privado */ } });
      await pg.reload({ waitUntil: 'load' });
      await abrir(pg, id);
      await new Promise((r) => setTimeout(r, 250));

      await pg.evaluate((sel) => { const b = document.querySelector(sel); if (b) b.click(); }, seletorDoGesto);
      await new Promise((r) => setTimeout(r, 400));

      // Escreve-se em TODOS os campos de texto do formulário: é o que a pessoa faria, e é o que
      // permite verificar que a limpeza é do formulário inteiro e não de um campo à sorte.
      await pg.evaluate((sel) => {
        const f = document.querySelector(sel);
        if (!f) return;
        for (const c of f.querySelectorAll('input[type="text"], input:not([type]), input[type="email"], input[type="tel"]')) {
          if (!c.readOnly && !c.disabled && c.type !== 'hidden' && c.type !== 'checkbox' && c.type !== 'radio') c.value = 'lixo-de-prova';
        }
      }, seletorDoForm);
      await new Promise((r) => setTimeout(r, 120));

      const antes3 = await pg.evaluate(([idDaSecao, selForm, selCancelar]) => {
        const s = document.getElementById(idDaSecao);
        const form = s.querySelector('.col-form');
        const f = document.querySelector(selForm);
        const c = document.querySelector(selCancelar);
        const preenchidos = f ? [...f.querySelectorAll('input')]
          .filter((x) => x.value === 'lixo-de-prova').length : 0;
        return {
          aberto: s.getAttribute('data-recolhido'),
          formVisivel: Boolean(form) && form.getBoundingClientRect().width > 0,
          cancelarVisivel: Boolean(c) && !c.hidden && c.getBoundingClientRect().width > 0,
          preenchidos,
        };
      }, [id, seletorDoForm, seletorDoCancelar]);
      provar(`${nome}: antes do «Cancelar» o formulário está aberto, com o cancelar à vista e os campos escritos`,
        antes3.aberto === 'nao' && antes3.formVisivel && antes3.cancelarVisivel && antes3.preenchidos > 0,
        antes3);

      await pg.evaluate((sel) => { const b = document.querySelector(sel); if (b) b.click(); }, seletorDoCancelar);
      await new Promise((r) => setTimeout(r, 600));

      const depois3 = await pg.evaluate(([idDaSecao, selForm]) => {
        const s = document.getElementById(idDaSecao);
        const form = s.querySelector('.col-form');
        const f = document.querySelector(selForm);
        const restou = f ? [...f.querySelectorAll('input')]
          .filter((x) => x.value === 'lixo-de-prova').length : 0;
        return {
          estado: s.getAttribute('data-recolhido'),
          formVisivel: Boolean(form) && form.getBoundingClientRect().width > 0,
          restou,
        };
      }, [id, seletorDoForm]);
      provar(`${nome}: o «Cancelar» FECHA o formulário e limpa os campos`,
        depois3.estado === 'sim' && depois3.formVisivel === false && depois3.restou === 0,
        depois3);
    }
  }

  /* ---- O ESTILO: ONDE CADA BOTÃO MORA (18/11/2026) ---------------------------------
   *
   * As quatro regras do pedido, medidas na geometria e não na intenção:
   *   1. no passo 1 não há «Voltar» — nem apagado, nem escondido por CSS: não está;
   *   2. há um «Cancelar» na barra de navegação, ao lado de «Seguir»/«Gravar verbete»;
   *   3. o «Limpar» subiu para a linha do «Acrescentar trecho» — MESMA linha, medida em pixels;
   *   4. o «Cancelar a edição» de baixo desapareceu, e o de cima (no aviso «Em edição») fica.
   */
  {
    await pg.setViewport({ width: 1280, height: 1400 });
    await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
    await pg.evaluate(() => { try { sessionStorage.clear(); } catch (e) { /* modo privado */ } });
    await pg.reload({ waitUntil: 'load' });
    await abrir(pg, 'sec-verbetes');
    await pg.evaluate(() => { definirSecaoRecolhida('sec-verbetes', false); });
    await new Promise((r) => setTimeout(r, 300));
    await pg.evaluate(() => { irParaPassoVerbete(1); });
    await new Promise((r) => setTimeout(r, 200));

    const noUm = await pg.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return { visivel: q.width > 0 && q.height > 0, hidden: e.hidden }; };
      return { voltar: r('#vb-voltar'), cancelar: r('#vb-cancelar'), seguir: r('#vb-seguir') };
    });
    provar('Estilo · passo 1: NÃO há «Voltar» — nem apagado, nem à vista',
      noUm.voltar !== null && noUm.voltar.visivel === false, noUm.voltar);
    provar('Estilo · passo 1: o «Cancelar» está lá, e o «Seguir» também',
      noUm.cancelar && noUm.cancelar.visivel && noUm.seguir && noUm.seguir.visivel, noUm);

    await pg.evaluate(() => { irParaPassoVerbete(6); });
    await new Promise((r) => setTimeout(r, 300));
    const noSeis = await pg.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return { topo: Math.round(q.top), esq: Math.round(q.left), visivel: q.width > 0 }; };
      const nav = document.getElementById('vb-nav');
      return {
        voltar: r('#vb-voltar'), cancelar: r('#vb-cancelar'), gravar: r('#vb-gravar'),
        acrescentar: r('#vb-cel-acrescentar'), limpar: r('#vbnovo'),
        cancelarDaEdicaoDeBaixo: Boolean(document.getElementById('vb-cancelar-edicao-2')),
        cancelarDaEdicaoDeCima: Boolean(document.getElementById('vb-cancelar-edicao')),
        mesmaNav: Boolean(nav && nav.querySelector('#vb-cancelar')),
      };
    });
    provar('Estilo · passo 6: o «Voltar» volta a estar à vista', noSeis.voltar && noSeis.voltar.visivel, noSeis.voltar);
    provar('Estilo · passo 6: o «Cancelar» está na barra de navegação, com o «Gravar»',
      noSeis.mesmaNav === true && noSeis.cancelar.visivel && noSeis.gravar.visivel, noSeis);
    provar('Estilo · passo 6: o «Limpar» está na MESMA linha do «Acrescentar trecho»',
      noSeis.limpar && noSeis.acrescentar && noSeis.limpar.visivel &&
      noSeis.limpar.topo === noSeis.acrescentar.topo &&
      noSeis.limpar.esq > noSeis.acrescentar.esq, { limpar: noSeis.limpar, acrescentar: noSeis.acrescentar });
    provar('Estilo · passo 6: o «Cancelar a edição» de BAIXO desapareceu',
      noSeis.cancelarDaEdicaoDeBaixo === false, noSeis.cancelarDaEdicaoDeBaixo);
    provar('…e o do aviso «Em edição» continua na marcação — é o único que fica',
      noSeis.cancelarDaEdicaoDeCima === true, noSeis.cancelarDaEdicaoDeCima);
  }

  await br.close();
  srv.close();
  console.log(`\nprovar-acordeoes: ${falhas === 0 ? 'TUDO CERTO' : falhas + ' FALHA(S)'}`);
  process.exit(falhas ? 1 : 0);
})();
