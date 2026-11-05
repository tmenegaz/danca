#!/usr/bin/env node
'use strict';

/**
 * provar-novo-registo-e-ciclo.js — o «Novo registo» da anamnese ABRE o formulário e fica aberto; a
 * anamnese não pede ciclo; e o ciclo do Plano de Observação é uma LISTA dos ciclos que já têm
 * plano de ensino.
 *
 * O QUE A PESQUISADORA VIU (05/11/2026):
 *
 *   «O botão de "Novo Registro" na Anamnese apresenta um comportamento de crash/loop: a página
 *   "pisca", trava momentaneamente e RETORNA DE IMEDIATO PARA A LISTAGEM, impedindo o
 *   preenchimento.»
 *
 *   «O campo de ciclo ainda continua aparecendo no formulário da anamnese.»
 *
 *   «O campo de ciclo no formulário do Plano de Observação deve ser estritamente dinâmico:
 *   listando apenas os ciclos que já possuem um Plano de Ensino válido.»
 *
 *   «O documento em processo de exclusão deve ficar totalmente desabilitado/inacessível para
 *   cliques, leituras ou novas edições enquanto a remoção não estiver 100% concluída.»
 *
 * A CAUSA DO PRIMEIRO, e é de uma linha. `podePreencher` isenta a EDIÇÃO e a DERIVAÇÃO de senha à
 * entrada (`emEdicao = EDITANDO || DERIVANDO`): a senha é pré-requisito de GRAVAR, não de abrir. O
 * «Novo registo» não é nenhum dos dois — é `DUPLICANDO`, que **não estava na lista**. E como
 * `duplicarAnamnese` corre ANTES da trava, o formulário chegava a ser pintado e, um instante
 * depois, a mesma trava encontrava senha vazia e chamava `voltarParaALista()`. O sintoma
 * «pisca e volta» é a assinatura disso: duas pinturas, e a segunda é a lista.
 *
 * A CAUSA DO SEGUNDO não é o `<input>`: é o MARKUP do cabeçalho, escrito à mão no ficheiro.
 * `#ctx-ciclo` é escondido por JS; o `<span class="ctx-resumo">` dizia «escola · professor ·
 * ciclo» a todas as fontes até o JS reescrever, e o `<label for="ctx-ciclo">ciclo</label>` fica
 * dentro do `.campo` que o JS esconde — escondido por CSS, mas presente na marcação.
 *
 * COMO É MEDIDA. Não com stubs de JSON: o acervo é o verdadeiro (os envelopes no KV falso) e a
 * página é servida pela ponte de produção (`producao.fetch`), com o menu aplicado pelo mesmo
 * módulo que a ponte usa. Um stub incompleto de `api/…` faz o arranque rebentar a meio e o
 * formulário fica em branco — e um formulário em branco não devolve ninguém à lista, o que dá um
 * verde falso à primeira asserção. Foi assim que o defeito passou numa bancada anterior.
 *
 *   node experimentos/provar-novo-registo-e-ciclo.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const navModulo = require(path.join(RAIZ, 'motor/nucleo/nav.js'));
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));
const CONTEUDO = JSON.parse(fs.readFileSync(path.join(PORTA, 'po', 'conteudo', 'po.json'), 'utf8'));
const MAPA = porta.mapa(CONTEUDO);
const MENU = JSON.parse(fs.readFileSync(path.join(RAIZ, 'publicacao', 'breu', 'nav.json'), 'utf8'));

const PLANO = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'escola', 'breu', 'envelopes', 'plano-20261104-1732.json'), 'utf8'));
const TURMA = {
  id: 'bale-nivel-1-teste-3',
  nome: 'Balé Nível 1 — Teste 3',
  dias: ['qua', 'sex'], horaInicio: '16:30', duracao: 45,
  periodoInicio: '2027-03-03', periodoFim: '2027-06-30',
};
const ANAMNESE = {
  id: 'anamnese-20261103-1626',
  contexto: { escola: 'prova', professor: 'coqui-de-redinha', aluna: 'Aluna A' },
  /* Duas respostas em nós que EXISTEM no conteúdo da anamnese (`porta/conteudo/anamnese.json`).
   * Um id inventado entra no depósito e não é desenhado por nó nenhum — e a bancada mediria a
   * cópia sem conseguir mostrar o campo, que é o que a professora vê. */
  respostas: {
    'historico-de-praticas-corporais': { valor: 'pratica anterior: mais de 5 anos' },
    'en-dehors': { valor: 'melhorar o en dehors' },
  },
  ajuste_de: null,
  gerado_em: '2026-11-03T16:26',
};
/* O CICLO 02 SEM PLANO DE ENSINO — e ele existe de propósito.
 *
 * É o estado que a regra proíbe (um PO de um ciclo sem plano), e é a ÚNICA fixture que separa os
 * dois comportamentos: com um ciclo só, «lista dos que têm plano» e «trava no próximo» dão o mesmo
 * resultado, e a asserção passaria sem medir nada. Com o 02 presente e sem plano, a lista do PO
 * tem de mostrar `01` e só `01`.
 */
const PO_ORFAO = {
  id: 'po-20261105-0900',
  contexto: { escola: 'prova', professor: 'coqui-de-redinha', ciclo: '02', turma: TURMA.nome },
  respostas: { sujeitos: { valor: ['Aluna A'] } },
  ajuste_de: null,
  gerado_em: '2026-11-05T09:00',
};

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };

function publicacaoMinima() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'novo-registo-'));
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  for (const [de, para] of [
    ['tools/templates/ciclo.css', 'assets/style.css'],
    ['tools/templates/nav.js', 'assets/nav.js'],
    ['tools/templates/marca/favicon.svg', 'assets/favicon.svg'],
  ]) fs.copyFileSync(path.join(RAIZ, de), path.join(dir, para));
  fs.writeFileSync(path.join(dir, 'nav.json'), JSON.stringify(MENU));
  return dir;
}

function kvDeMentira() {
  const dados = new Map();
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list(op) {
      const prefixo = (op && op.prefix) || '';
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefixo))
        .map((name) => ({ name })), list_complete: true };
    },
  };
}

function assetsDe(dir) {
  const procurar = (caminho) => {
    const semPrefixo = String(caminho).replace(/^\/+/, '').replace(/^plano-observacao\//, '');
    for (const [base, rel] of [[dir, semPrefixo], [path.join(RAIZ, 'porta'), semPrefixo]]) {
      const alvo = path.join(base, rel);
      if (fs.existsSync(alvo) && fs.statSync(alvo).isFile()) return alvo;
    }
    return null;
  };
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      const alvo = procurar(url.pathname);
      if (!alvo) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(alvo), { status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream' } });
    },
  };
}

const relatorio = (id) => ({ id, estado: 'prova', contagem: { respondidos: 0, obrigatorios: 0 },
  elos: [], paradas: [], idsDesconhecidos: [], validacao: { resultado: 'aceite', contrato: 'prova' },
  errosDoDocumento: [], linhas: [] });

async function ambiente(dir) {
  const env = {
    ESCOLA_SLUG: 'prova', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', SENHA_PROFESSOR: 'p',
    PROFESSOR_NOME: 'Coqui', PADD_KV: kvDeMentira(), ASSETS: assetsDe(dir),
  };
  await env.PADD_KV.put('bastidores/prova/curadorias', JSON.stringify([
    { id: 'c1', professor: 'coqui-de-redinha', modalidade: 'balé', turma: TURMA.nome,
      turmas: [TURMA.nome], alunas: ['Aluna A'] },
  ]));
  const armazenamento = producao.__armazenamento(env);
  for (const d of [PLANO, ANAMNESE, PO_ORFAO]) {
    await porta.gravarEnvelope(armazenamento, {
      id: d.id, contexto: d.contexto, respostas: d.respostas,
      ajuste_de: d.ajuste_de === undefined ? null : d.ajuste_de, gerado_em: d.gerado_em,
    }, relatorio(d.id));
  }
  return env;
}

/** A página da porta, com o menu aplicado pelo MESMO módulo que a ponte usa. */
function servir(dir, env) {
  let html = fs.readFileSync(path.join(PORTA, 'index.html'), 'utf8');
  if (html.indexOf('<nav class="topnav"') === -1) {
    html = html.replace('<!-- NAV -->', '<nav class="topnav" aria-label="Navegação do ciclo"></nav>');
  }
  html = navModulo.aplicar(html, MENU, '/area-do-professor/anamnese/') || html;

  const srv = http.createServer(async (req, res) => {
    const caminho = req.url.split('?')[0];
    if (caminho.startsWith('/assets/') || caminho === '/nav.json') {
      const alvo = path.join(dir, caminho);
      if (!fs.existsSync(alvo)) { res.writeHead(404); res.end('nao'); return; }
      res.writeHead(200, { 'content-type': TIPOS[path.extname(alvo)] || 'application/octet-stream',
        'cache-control': 'no-store' });
      res.end(fs.readFileSync(alvo));
      return;
    }
    /* A PORTA É O HTML DO ASSETS, e a ponte não o tem: ela serve `api/…` e o que está publicado.
     * Aqui o HTML é o da raiz e o resto vai à ponte — é a única coisa que este servidor responde
     * por ela, e é o que faz as três fontes (pelo caminho, como em produção) funcionarem. */
    if (caminho === '/' || caminho === '/anamnese/' || caminho === '/plano-ensino/'
      || caminho === '/plano-observacao/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(html);
      return;
    }
    const r = await producao.fetch(new Request('https://prova.tmenegaz77.workers.dev' + req.url), env);
    res.writeHead(r.status, { 'content-type': String(r.headers.get('content-type')
      || 'text/html; charset=utf-8'), 'cache-control': 'no-store' });
    res.end(await r.text());
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1',
    () => ok({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

/** O que se lê da página, dentro dela. */
const LER = () => {
  const campoCiclo = document.getElementById('ctx-ciclo');
  const caixa = campoCiclo ? campoCiclo.closest('.campo') : null;
  const resumo = document.querySelector('.barra details.ctx-ato .ctx-resumo');
  const detalhe = document.querySelector('.barra details.ctx-ato');
  const visivel = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const e = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && e.display !== 'none' && e.visibility !== 'hidden';
  };
  return {
    caminho: location.pathname + location.search,
    fonte: typeof FONTE === 'string' ? FONTE : null,
    /* A CONDUÇÃO é o formulário. Se ela desapareceu, a página devolveu a pessoa à lista. */
    temConducao: Boolean(document.getElementById('conducao'))
      && getComputedStyle(document.getElementById('conducao')).display !== 'none',
    cicloVisivel: visivel(caixa),
    /* O TEXTO DO CABEÇALHO, fechado e aberto: é o que a pessoa lê sem clicar em nada. */
    resumoFechado: resumo ? resumo.textContent.trim() : null,
    aberto: detalhe ? detalhe.hasAttribute('open') : null,
    marcacaoDoCabecalho: detalhe ? detalhe.innerHTML.replace(/\s+/g, ' ') : null,
    ciclo: !campoCiclo ? null : {
      tipo: campoCiclo.tagName.toLowerCase(),
      valor: campoCiclo.value,
      readonly: campoCiclo.readOnly === true,
      opcoes: campoCiclo.tagName === 'SELECT'
        ? [...campoCiclo.options].map((o) => o.value) : null,
    },
    respostasNoFormulario: [...document.querySelectorAll('input, select, textarea')]
      .filter((c) => /pratica anterior|dehors/.test(String(c.value || ''))).length,
  };
};

(async () => {
  const executablePath = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executablePath) {
    console.error('provar-novo-registo-e-ciclo: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (erro) {
    console.error('provar-novo-registo-e-ciclo: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  const dir = publicacaoMinima();
  const env = await ambiente(dir);
  const { srv, base } = await servir(dir, env);
  const browser = await puppeteer.launch({ executablePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    /* --------------------------------------------------------------------------------------- */
    console.log('\n1 · «NOVO REGISTO» — o formulário abre, fica aberto e traz o retrato anterior');
    /* --------------------------------------------------------------------------------------- */
    /* O endereço é o que a listagem emite: `?novo=<carimbo>` e o contexto. SEM bilhete e SEM
     * senha — que é o caminho normal de quem chega da lista. */
    const navegacoes = [];
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) navegacoes.push(f.url()); });
    await page.goto(base + '/anamnese/?novo=' + ANAMNESE.id
      + '&professor=coqui-de-redinha&aluna=Aluna%20A', { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1400));
    const novo = await page.evaluate(LER);

    provar('a página NÃO foi devolvida à listagem (o endereço continua o do formulário)',
      /\/anamnese\/\?novo=/.test(novo.caminho), novo.caminho);
    provar('…e a condução (o formulário) está à vista', novo.temConducao === true);
    const voltas = navegacoes.filter((u) => !/\?novo=/.test(u));
    provar('…e nenhuma navegação de regresso (o «pisca e volta» é isto)', voltas.length === 0, voltas);
    /* O GESTO É DUPLICAR: o retrato anterior chega preenchido ao formulário. Sem isto, «Novo
     * registo» seria um formulário em branco com outro nome.
     *
     * A CONDUÇÃO MOSTRA UMA PERGUNTA DE CADA VEZ, e a resposta copiada pode não ser a da
     * primeira: mede-se portanto no sítio onde ela aparece — abre-se o nó que a guarda e lê-se o
     * campo. Ler só o depósito (`RESPOSTAS`) provaria o mecanismo e não o que a professora vê. */
    const copiado = await page.evaluate(async () => {
      const idx = (MAPA.nos || []).findIndex((n) => n.id === 'historico-de-praticas-corporais');
      if (idx >= 0) abrirFormulario(idx);
      await new Promise((r) => setTimeout(r, 400));
      const campos = [...document.querySelectorAll('#pergunta input, #pergunta select, #pergunta textarea')];
      return {
        no: idx,
        comOValor: campos.filter((c) => String(c.value || '').indexOf('mais de 5 anos') !== -1).length,
        noDeposito: [...RESPOSTAS.values()]
          .filter((v) => typeof v === 'string' && /mais de 5 anos/.test(v)).length,
      };
    });
    provar('o nó da resposta copiada existe no mapa', copiado.no >= 0, copiado.no);
    provar('…e o campo mostra o valor do retrato anterior (o formulário abre preenchido)',
      copiado.comOValor > 0, copiado);

    /* --------------------------------------------------------------------------------------- */
    console.log('\n2 · A ANAMNESE NÃO PEDE CICLO — nem aberta, nem no texto do cabeçalho');
    /* --------------------------------------------------------------------------------------- */
    provar('a fonte é a anamnese', novo.fonte === 'anamnese', novo.fonte);
    provar('o CAMPO do ciclo não está visível', novo.cicloVisivel === false, novo.cicloVisivel);
    provar('…e o cabeçalho FECHADO não diz «ciclo»', Boolean(novo.resumoFechado)
      && !/ciclo/i.test(novo.resumoFechado), novo.resumoFechado);
    /* FECHADO NÃO BASTA: o acordeão abre-se, e o que está lá dentro também é lido. A marcação
     * inteira é varrida — um `<label for="ctx-ciclo">ciclo</label>` escondido por CSS continua a
     * existir para quem inspeciona a página e para o leitor de ecrã que a leia. */
    const marca = String(novo.marcacaoDoCabecalho || '');
    provar('…nem o cabeçalho ABERTO tem o rótulo «ciclo»', !/ctx-ciclo/.test(marca),
      (marca.match(/.{0,40}ctx-ciclo.{0,40}/) || [''])[0]);

    /* --------------------------------------------------------------------------------------- */
    console.log('\n3 · O CICLO DO PO — a lista dos ciclos que TÊM plano de ensino');
    /* --------------------------------------------------------------------------------------- */
    await page.goto(base + '/plano-observacao/?fonte=po&professor=coqui-de-redinha&ciclo=01'
      + '&plano=' + encodeURIComponent(PLANO.id), { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1400));
    const noPo = await page.evaluate(LER);

    provar('a fonte é o PO', noPo.fonte === 'po', noPo.fonte);
    provar('no PO o campo do ciclo está visível', noPo.cicloVisivel === true, noPo.cicloVisivel);
    provar('…e o cabeçalho diz «ciclo» (nesta fonte ele é a identidade do ato)',
      Boolean(noPo.resumoFechado) && /ciclo/i.test(noPo.resumoFechado), noPo.resumoFechado);
    provar('o campo do ciclo é uma LISTA (select), e não um número travado',
      Boolean(noPo.ciclo) && noPo.ciclo.tipo === 'select', noPo.ciclo);
    /* A LISTA TEM O 01 E NÃO TEM O 02 — o 02 existe no acervo (o `PO_ORFAO`) e não tem plano de
     * ensino. É esta a diferença entre «os ciclos que existem» e «os ciclos que se podem observar».
     */
    provar('…e a lista mostra o ciclo 01, que tem plano de ensino',
      Boolean(noPo.ciclo && noPo.ciclo.opcoes) && noPo.ciclo.opcoes.indexOf('01') !== -1, noPo.ciclo);
    provar('…e NÃO mostra o ciclo 02, que não tem plano de ensino',
      Boolean(noPo.ciclo && noPo.ciclo.opcoes) && noPo.ciclo.opcoes.indexOf('02') === -1, noPo.ciclo);
    provar('…com o ciclo do documento escolhido', Boolean(noPo.ciclo) && noPo.ciclo.valor === '01',
      noPo.ciclo && noPo.ciclo.valor);

    /* E O PLANO DE ENSINO CONTINUA TRAVADO NO PRÓXIMO — a lista é do PO, não das três fontes. */
    await page.goto(base + '/plano-ensino/?fonte=plano&professor=coqui-de-redinha&ciclo=01',
      { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1400));
    const noPlano = await page.evaluate(LER);
    provar('no plano de ensino o campo continua a ser um número TRAVADO no próximo',
      Boolean(noPlano.ciclo) && noPlano.ciclo.tipo === 'input' && noPlano.ciclo.readonly === true,
      noPlano.ciclo);
    provar('…e mantém o ciclo do próprio documento (o ciclo não muda: é a posição na cadeia)',
      Boolean(noPlano.ciclo) && noPlano.ciclo.valor === '01', noPlano.ciclo && noPlano.ciclo.valor);

    /* --------------------------------------------------------------------------------------- */
    console.log('\n4 · A LINHA A APAGAR — o véu, o fio e o spinner, medidos no sítio');
    /* --------------------------------------------------------------------------------------- */
    /* A PEÇA É DA FOLHA (`[data-apagando="sim"]` em `ciclo.css`) e o estado é do cliente
     * (`provar-apagar-da-listagem` §4b prova os atributos). O que SÓ um navegador pode dizer é se
     * o véu cobre a linha e se o spinner gira: são geometria e animação, e um DOM falso responde
     * «talvez».
     *
     * A MEDIÇÃO: põe-se o estado na primeira linha da listagem de planos e lê-se o que o
     * navegador calculou para os dois pseudo-elementos — a caixa do véu contra a caixa da linha,
     * e o nome da animação do spinner. */
    await page.goto(base + '/area-do-professor/plano-de-ensino/', { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 700));
    const aApagar = await page.evaluate(() => {
      const linha = document.querySelector('li.trio-plano');
      if (!linha) return { erro: 'a listagem não tem linha nenhuma' };
      linha.setAttribute('data-apagando', 'sim');
      const caixa = linha.getBoundingClientRect();
      const veu = getComputedStyle(linha, '::after');
      const fio = getComputedStyle(linha, '::before');
      return {
        largura: Math.round(caixa.width), altura: Math.round(caixa.height),
        veuAltura: veu.height, veuLargura: veu.width,
        veuTexto: veu.content, veuOpacidade: Number(veu.opacity),
        fioAnimacao: fio.animationName, fioDuracao: fio.animationDuration,
        ponteiroNaLinha: getComputedStyle(linha).pointerEvents,
      };
    });
    provar('a listagem tem uma linha para medir', !aApagar.erro, aApagar.erro);
    if (!aApagar.erro) {
      provar('o véu cobre a linha inteira (mesma altura e a mesma largura)',
        Math.round(parseFloat(aApagar.veuAltura)) === aApagar.altura
          && Math.round(parseFloat(aApagar.veuLargura)) === aApagar.largura,
        { veu: [aApagar.veuLargura, aApagar.veuAltura], linha: [aApagar.largura, aApagar.altura] });
      provar('…e diz o que está a acontecer', /apagando/.test(aApagar.veuTexto), aApagar.veuTexto);
      provar('…sem apagar a linha do mapa: o véu é papel de fundo com opacidade, não `display:none`',
        aApagar.veuOpacidade > 0 && aApagar.veuOpacidade < 1, aApagar.veuOpacidade);
      provar('o spinner gira (tem animação, e não é um círculo parado)',
        aApagar.fioAnimacao === 'apagando-gira' && parseFloat(aApagar.fioDuracao) > 0,
        { nome: aApagar.fioAnimacao, duracao: aApagar.fioDuracao });
      provar('…e a linha não aceita o ponteiro enquanto tem o estado',
        aApagar.ponteiroNaLinha === 'none', aApagar.ponteiroNaLinha);
    }
  } finally {
    await browser.close();
    srv.close();
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: o «Novo registo» abre o formulário e traz o '
    + 'retrato anterior, a anamnese não pede ciclo (nem no texto do cabeçalho), o ciclo do PO é a '
    + 'lista dos ciclos que têm plano de ensino, o do plano continua travado no próximo, e a linha '
    + 'a apagar ganha véu, fio e spinner.');
})();
