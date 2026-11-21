#!/usr/bin/env node
'use strict';

/*
 * provar-aulas-dadas.js — a lista das aulas dadas, e o formulário que não volta para uma delas.
 *
 * O RELATO (06/11/2026). «Esse formulário para essa aula não tem que estar mais disponível, porque
 * eu já fiz isso. Mas ao mesmo tempo eu preciso de um lugar similar ao que eu tenho com aulas — a
 * página aulas, aonde eu listo as aulas dadas e posso abrir e ver como é que foi preenchido. […]
 * A gente já arruma a listagem e já conserta também o filtro para poder fazer isso.»
 *
 * DUAS COISAS QUE ANDAM JUNTAS, e por isso são uma prova só:
 *
 *   A. O ÍNDICE — lido da FONTE no repositório (escrita no acto do lançamento), e não do pacote
 *      publicado, que só muda quando a geração corre. É ele que responde «esta aula já foi dada?».
 *   B. A PÁGINA — no padrão das outras oito listas, com as regras no cartão (quando se ajusta,
 *      quando não se ajusta, o que não se apaga) e o «Nenhuma aula foi realizada até o momento».
 *   C. O FORMULÁRIO — não se oferece para uma aula lançada, mesmo quando o pacote ainda é o de
 *      antes. D é a CONTRAPROVA: sem o índice, ele volta — o defeito, a correr.
 *   E. O LINK — a lista abre o lançamento de UMA aula, e a página não salta para outra.
 *
 * O banco de prova tem a FORMA DA PUBLICAÇÃO (a lição de 06/11: um stub que responde «sim» a tudo
 * não mede o caminho, mede a pergunta).
 *
 * Requer Chrome/Chromium para as partes C/D/E (puppeteer-core vem com o marp-cli global).
 *
 *   node experimentos/provar-aulas-dadas.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');

/* A ESCOLA MUDOU DE `calango` PARA `breu` (20/11/2026), E A FIXTURE DEIXOU DE SER UM FICHEIRO.
 *
 * O `calango` foi expurgado, a prova rebentava a abrir a sua fonte, e uma prova que não corre não
 * guarda regra nenhuma. Podia reapontar-se para o ciclo da `breu` — e não serve: a fonte da `breu`
 * tem ZERO aulas lançadas, e esta prova existe precisamente para medir o que acontece com uma aula
 * lançada (o índice, o cartão, o formulário que não se oferece, a cifra com e sem lançamento).
 *
 * O que fica é um dado DECLARADO aqui, com a forma da fonte verdadeira — `aulas['NN']` com `data`,
 * `duracao_min`, `presentes`, `ausentes` e `ultimo_lancamento` — e um `ciclos.json` publicado com
 * as duas aulas que a prova precisa (a 06 lançada, a 07 não). Um dado declarado não fica velho: é
 * ele que a prova afirma. O que NÃO se dispensa é o pacote real, para os ficheiros que o servidor
 * serve na bancada (a folha, os assets) — esse continua a vir do ciclo da `breu`. */
const PACOTE = path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa');
const VAR = 'breu-rosa';
const PASTA = 'rosa'; // o que o site serve: a variante sem o nome da escola à frente

/* AS DATAS SÃO RELATIVAS AO DIA EM QUE A PROVA CORRE — e é isto que a impede de apodrecer.
 *
 * A fixture antiga tinha datas fixas (05/11 e 10/11/2026) e a prova foi escrita a 06/11/2026, com
 * os prazos ainda no FUTURO. Escrita assim, ela vale duas semanas: depois disso a aula 07 passa a
 * estar «não dada» (§3.3 — prazo vencido sem registro), o painel dela não abre, e a asserção
 * reprova por o calendário ter andado. Foi exatamente o que aconteceu hoje, e o sintoma
 * («o formulário não aparece») se lê como defeito do código.
 *
 * A aula 06 fica no PASSADO e é a lançada; a 07 fica no FUTURO e é a que ainda se pode lançar — que
 * é o par de estados que a secção E precisa de medir. */
const DIA = 24 * 60 * 60 * 1000;
const dia = (ms) => new Date(ms).toISOString().slice(0, 10);
const HOJE = Date.now();
const DATA06 = dia(HOJE - 6 * DIA);
const DATA07 = dia(HOJE + 1 * DIA);
const DATA07_FIM = dia(HOJE + 2 * DIA);
const LANCADA06 = dia(HOJE - 5 * DIA) + 'T16:42';
const PRAZO06 = dia(HOJE - 4 * DIA) + 'T19:00';
const PRAZO07 = DATA07_FIM + 'T19:00';
const BR = (iso) => { const [a, m, d] = iso.split('-'); return d + '/' + m + '/' + a; };

const DADOS = {
  ciclo: '01', escola: 'breu', professor: 'demi-plie',
  apelidos: { aluna_a: 'Aluna A', aluna_b: 'Aluna B' },
  aulas: {
    '06': {
      data: DATA06, duracao_min: 60,
      presentes: ['aluna_a', 'aluna_b'], ausentes: [],
      condicoes_contorno: { plano_seguido: 'sim', animo: 4, interesse: 4, harmonia: 5, mudou: '' },
      relatorio: { texto: 'registro da aula 06', surpresas: 'sim', ajustes: '' },
      ultimo_lancamento: LANCADA06,
    },
  },
};

/* O ÍNDICE DO PACOTE — completo o bastante para a folha abrir: `arquivo` diz qual JSON de dados
 * a página lê (sem ele, o `fetch` vai a `undefined` e recebe 404), e `inicio`, `fim`, `total_aulas`
 * e `duracao_min` são o que a folha usa para saber o ciclo em que está. */
const PUBLICADO = {
  ciclos: [{
    id: '01', professor: 'demi-plie', escola: 'Breu',
    inicio: DATA06, fim: DATA07_FIM, total_aulas: 2, duracao_min: 120,
    arquivo: 'ciclo-01-' + VAR + '-dados.json',
    aulas: [
      /* O `config` É O QUE FAZ A FOLHA APARECER: sem ele, a página sabe que a aula existe mas não
       * tem captura para desenhar — e o painel fica vazio (`painel: false`). Os dois apontam para a
       * folha que o pacote da `breu` tem; o que se mede aqui é a leitura, não o conteúdo dela. */
      { n: '06', data: DATA06, prazo: PRAZO06, marco: 'marco da aula 06',
        config: 'captura-aula-01.json' },
      { n: '07', data: DATA07, prazo: PRAZO07, marco: null,
        config: 'captura-aula-01.json' },
    ],
  }],
};

const aulasDadas = require(path.join(RAIZ, 'motor/servidor/aulas-dadas.js'));
const listas = require(path.join(RAIZ, 'motor/nucleo/lista-html.js'));
const Cifra = require(path.join(RAIZ, 'tools/lib-cifra.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* ==========================================================================================
 * A. O índice — a fonte do repositório, e o índice da escola
 * ======================================================================================== */
console.log('\nA. O índice das aulas dadas lê a FONTE, no caminho em que ela está');

/** Uma resposta de `contents` como a API do GitHub a devolve (base64 no `content`). */
function respostaDeConteudo(texto, status) {
  if (status === 404 || texto === null || texto === undefined) {
    return { status: 404, ok: false, async json() { return {}; }, async text() { return ''; } };
  }
  return {
    status: 200, ok: true,
    async json() {
      return { sha: 'sha-de-prova', content: Buffer.from(texto, 'utf8').toString('base64') };
    },
    async text() { return ''; },
  };
}

/**
 * A ÁRVORE DO REPOSITÓRIO da prova. Os caminhos são os de verdade, e quem pedir outro recebe 404
 * — como no GitHub. É isto que impede a prova de aprovar um leitor que procura no sítio errado.
 */
function arvoreDeProva({ dados, escola = 'breu' }) {
  const indice = JSON.stringify({
    escola, versao: 6,
    ciclos: [{
      id: 'ciclo:rabo-gramde/01/' + escola,
      escola, numero: '01', professor: 'demi-plie',
      ancora: { id: 'ciclo-01-' + VAR, caminho: 'professores/demi-plie/ciclos/ciclo-01-' + VAR + '.fipp' },
    }],
  });
  return {
    ['indices/escolas/' + escola + '.json']: indice,
    ['professores/demi-plie/ciclos/ciclo-01-' + VAR + '-dados.json']: dados,
  };
}

function leitorDaArvore(arvore) {
  return {
    async fetchImpl(url) {
      const caminho = decodeURIComponent(String(url).replace(/^.*\/contents\//, '').replace(/\?.*$/, ''));
      return respostaDeConteudo(Object.prototype.hasOwnProperty.call(arvore, caminho) ? arvore[caminho] : null);
    },
  };
}

(async () => {
  const daFonte = JSON.stringify(DADOS, null, 2);
  const publicado = JSON.stringify(PUBLICADO, null, 2);

  const arvore = arvoreDeProva({ dados: daFonte });
  const leitor = leitorDaArvore(arvore);
  const indice = aulasDadas.criarIndiceDeAulas({
    token: 'token-de-prova',
    fetchImpl: leitor.fetchImpl,
    lerAsset: async (rel) => (rel === VAR + '/ciclos.json' ? publicado : null),
  });

  const aulas = await indice.porEscola('breu');
  provar('o índice traz as aulas dadas da escola', Array.isArray(aulas) && aulas.length > 0,
    Array.isArray(aulas) ? aulas.length : aulas);
  const a06 = aulas.find((a) => a.numero === '06');
  provar('…com o número, o dia e o carimbo de quando foi lançada',
    a06 && a06.numero === '06' && a06.data === DATA06 && a06.lancada_em === LANCADA06,
    a06);
  provar('…e o prazo DECLARADO pelo índice do ciclo (a página não recalcula o que já vem dito)',
    a06 && a06.prazo === PRAZO06, a06 && a06.prazo);
  provar('…e a variante, que é o endereço do pacote', a06 && a06.variante === VAR, a06 && a06.variante);

  const mapa = await indice.lancadas('breu', { variante: VAR, ciclo: '01' });
  provar('o «o que já foi lançado» responde por número de aula',
    mapa && mapa['06'] === LANCADA06, mapa);
  provar('…e NÃO responde por uma aula que não foi lançada', mapa && !mapa['07'], mapa && Object.keys(mapa));

  /* A CONTRAPROVA DO CAMINHO: com uma árvore sem a fonte, o índice fica vazio — e `lancadas`
   * devolve o que a leitura conseguiu, não uma suposição. `null` (leitura falhada) é diferente de
   * `{}` (nada lançado): quem pergunta decide o que fazer com cada um. */
  const semFonte = aulasDadas.criarIndiceDeAulas({
    token: 'token-de-prova',
    fetchImpl: leitorDaArvore({
      ['indices/escolas/breu.json']: arvore['indices/escolas/breu.json'],
    }).fetchImpl,
    lerAsset: async () => null,
  });
  provar('contraprova: sem a fonte, não há aula dada nenhuma', (await semFonte.porEscola('breu')).length === 0);
  provar('…e o mapa sai vazio, sem inventar carimbos',
    JSON.stringify(await semFonte.lancadas('breu', { variante: VAR })) === '{}');
  const semIndice = aulasDadas.criarIndiceDeAulas({
    token: 'token-de-prova', fetchImpl: leitorDaArvore({}).fetchImpl, lerAsset: async () => null,
  });
  provar('…e sem o índice da escola a resposta é `null` — «não sei», e não «não há»',
    (await semIndice.lancadas('breu', { variante: VAR })) === null);

  /* ========================================================================================
   * B. A página — o padrão, as regras, e a frase dela
   * ====================================================================================== */
  console.log('\nB. A página «Aulas dadas»: o padrão das listas, as regras no cartão, e a frase dela');
  const pagina = await aulasDadas.pagina({
    escola: 'breu', menu: null, pedido: '/area-do-professor/aulas-dadas/', indice,
  });
  const html = pagina.html;
  provar('a página usa a peça da lista (os mesmos cartões das outras oito)',
    /<ul class="trio-lista">/.test(html) && /class="trio-plano"/.test(html));
  /* AS TRÊS CAIXAS, NA ORDEM FIXA DA CASA (24/10/2026): a primeira diz de quem é, a segunda quem
   * fez, a terceira quando. Aqui: «Aula» · «Lançada em» · «Situação». A ordem é o que faz a lista
   * ler-se com o mesmo gesto do olho em todas as páginas. */
  const rotulosDasCaixas = [...html.matchAll(/class="trio-k">([^<]*)</g)].map((m) => m[1]);
  provar('…e as três caixas na ordem fixa da casa: de quem é, quem fez, quando',
    rotulosDasCaixas.slice(0, 3).join(' · ') === 'Aula · Lançada em · Situação',
    rotulosDasCaixas.slice(0, 3));
  provar('…e o rótulo do cartão é a aula com o dia',
    html.includes('Aula 06 — ' + BR(DATA06)), (html.match(/trio-nome[^>]*>[\s\S]{0,120}/) || [])[0]);
  /* A PASTA DO SITE NÃO É A VARIANTE INTEIRA. O endereço que a publicação dá à turma é o que vem
   * DEPOIS do nome da escola (`bale-nivel-1-teste-1`), e não `calango-bale-nivel-1-teste-1` — esse
   * dá 404 (medido ao vivo em 06/11/2026: o «Abrir o lançamento» levava a lugar nenhum). */
  provar('…e o «abrir o lançamento» leva à PASTA que o site serve, com o ciclo e a aula no endereço',
    html.includes('/' + PASTA + '/lancamento.html?ciclo=01&amp;aula=06'),
    (html.match(/lancamento\.html[^"]*/) || [])[0]);
  provar('…e não ao endereço com o nome da escola à frente, que o pacote não tem',
    !html.includes('/' + VAR + '/lancamento.html'), VAR);
  provar('…e a regra da proveniência está escrita no cartão',
    /um ajuste é um elo novo/.test(html) && /não se apaga/.test(html));
  provar('…e diz quando se ajusta (o prazo declarado)',
    /ajustável até|prazo encerrado em/.test(html), (html.match(/Situação[\s\S]{0,240}/) || [])[0]);
  /* O QUE A LISTA **NÃO** MOSTRA: o nome de quem ajustou. A página é servida sem senha, e um nome
   * de pessoa não se publica para dizer que houve um ajuste. */
  const fonteJson = JSON.parse(daFonte);
  const autor = String(fonteJson.ajustado_por || '').trim();
  provar('…e NÃO publica o nome de quem ajustou (a lista é servida sem senha)',
    !autor || html.indexOf(autor) === -1, autor);

  /* A FRASE VAZIA É A DELA, e é a única do sistema que se escreve com as palavras de quem a pediu:
   * «Enquanto isso será mostrada a mensagem: "Nenhuma aula foi realizada até o momento"». */
  const vazia = await aulasDadas.pagina({
    escola: 'breu', menu: null, pedido: '/area-do-professor/aulas-dadas/',
    indice: { porEscola: async () => [] },
  });
  provar('a lista vazia mostra a frase dela e NÃO o aviso que explica linhas que não existem',
    /Nenhuma aula foi realizada até o momento/.test(vazia.html)
      && !/Cada linha é uma aula/.test(vazia.html), vazia.html.slice(0, 120));

  provar('a lista vazia usa a frase dela, palavra por palavra',
    /Nenhuma aula foi realizada até o momento/.test(
      listas.paginaDeLista({ titulo: 'Aulas dadas', itens: [], vazio: 'Nenhuma aula foi realizada até o momento' })),
    'a frase não chegou à página vazia');

  /* ========================================================================================
   * C, D e E. O formulário no navegador
   * ====================================================================================== */
  console.log('\nC. O formulário não se oferece para uma aula já lançada (e o pacote ainda é o de antes)');

  let puppeteer;
  let executavel;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
    executavel = process.env.CHROME_PATH
      || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  } catch (e) { puppeteer = null; }

  if (!puppeteer || !executavel) {
    provar('o navegador existe para medir o formulário', false, 'puppeteer-core/Chrome ausente — NÃO FEITO');
  } else {
    const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };

    /**
     * O BANCO: a página servida DENTRO do pacote (como no ar), o `-dados.json` do pacote CIFRADO
     * com ZERO lançamentos — é a janela em que o pacote ainda é o de antes —, e a rota
     * `/api/lancadas` com o que a fonte diz. `semIndice: true` é a CONTRAPROVA: a rota não
     * responde, e vale só o pacote.
     */
    async function bancada({ semIndice, comSenha }) {
      const senha = 'senha-da-prova';
      const claro = daFonte;
      const aula06 = JSON.parse(claro).aulas['06'];
      // O PACOTE DE ANTES: o invólucro existe (há apontamento do PO) e diz zero lançamentos.
      const envelope = await Cifra.cifrar(JSON.stringify({
        ciclo: '01', escola: VAR, professor: 'demi-plie',
        apelidos: { aluna_a: 'Aluna A', aluna_b: 'Aluna B' }, aulas: {},
      }, null, 2), senha);
      /* `comSenha`: o invólucro diz que HÁ lançamento e o `/api/dados` devolve o ciclo inteiro —
       * é o caso real de quem abre o lançamento de uma aula já dada, e o único em que o painel da
       * senha aparece antes de a aula estar à vista. */
      const invólucro = JSON.stringify({
        _cifrado: envelope, lancamentos: comSenha ? Object.keys(JSON.parse(claro).aulas).length : 0,
        apelidos: { aluna_a: 'Aluna A', aluna_b: 'Aluna B' },
      });
      const srv = http.createServer((req, res) => {
        const url = decodeURIComponent(req.url.split('?')[0]);
        if (req.method === 'POST' && url === '/api/lancadas') {
          const corpo = semIndice
            ? { ok: true, aulas: {} }
            : { ok: true, aulas: { '06': aula06.ultimo_lancamento || 'lançada' } };
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify(corpo));
          return;
        }
        if (req.method === 'POST' && url === '/api/dados') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: true, texto: comSenha ? claro : JSON.stringify({
            ciclo: '01', escola: VAR, professor: 'demi-plie',
            apelidos: { aluna_a: 'Aluna A', aluna_b: 'Aluna B' }, aulas: {},
          }, null, 2) }));
          return;
        }
        const rel = url.replace(/^\/+/, '');
        if (!rel.startsWith(VAR + '/')) { res.writeHead(404); res.end('nao encontrado'); return; }
        const dentro = rel.slice(VAR.length + 1);
        if (dentro === 'ciclo-01-' + VAR + '-dados.json') {
          res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
          res.end(invólucro);
          return;
        }
        /* O `ciclos.json` SERVIDO É O «PACOTE DE ANTES» (20/11/2026) — e é ele que faz a bancada
         * medir o que diz medir. O pacote REAL da `breu` declara as 15 aulas e a primeira sem dado
         * é a 01; servir esse fazia o formulário abrir na 01 mesmo no caso em que o índice devia
         * mandar na 06. O índice do pacote que a prova serve é o `PUBLICADO`: duas aulas, a 06 e a
         * 07, e NENHUMA marcada como lançada — exatamente a janela em que o pacote ainda é o de
         * antes de a aula ser lançada, que é o cenário desta secção. */
        if (dentro === 'ciclos.json') {
          res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
          res.end(publicado);
          return;
        }
        const alvo = dentro === 'lancamento.html'
          ? path.join(RAIZ, 'tools/templates/lancamento.html')
          : path.join(PACOTE, dentro);
        const DENTRO = alvo === path.join(RAIZ, 'tools/templates/lancamento.html') || alvo.startsWith(PACOTE);
        if (!DENTRO || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) {
          res.writeHead(404); res.end('nao encontrado'); return;
        }
        res.writeHead(200, { 'content-type': MIME[path.extname(alvo)] || 'application/octet-stream',
          'cache-control': 'no-store' });
        res.end(fs.readFileSync(alvo));
      });
      const { port } = await new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ port: srv.address().port })));
      return { srv, base: `http://127.0.0.1:${port}/${VAR}` };
    }

    async function abrir({ semIndice, sufixo = '', comSenha = false }) {
      const { srv, base } = await bancada({ semIndice, comSenha });
      const nav = await puppeteer.launch({ executablePath: executavel, headless: 'new',
        args: ['--no-sandbox', '--disable-dev-shm-usage'] });
      try {
        const p = await nav.newPage();
        await p.setViewport({ width: 390, height: 844 });
        const erros = [];
        p.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
        await p.goto(base + '/lancamento.html' + sufixo, { waitUntil: 'networkidle0' });
        await new Promise((r) => setTimeout(r, 500));
        const chegada = await p.evaluate(() => ({
          aula: (document.getElementById('aula') || {}).value,
          painel: !document.getElementById('captura').hidden,
          campos: (document.getElementById('captura-campos') || {}).textContent || '',
          // O FILTRO É A PEÇA DA FOLHA, e não um `fieldset` desta página (06/11/2026).
          filtroCaixa: !!document.querySelector('div.caixa.filtrar'),
          // O `fieldset` que SOBRA é o do painel («Depois da aula»), e não o do filtro: o que se
          // mede é que não há nenhum DENTRO do filtro.
          filtroFieldset: !!document.querySelector('.caixa.filtrar fieldset'),
          filtroNota: !!document.querySelector('.filtro-conta'),
        }));
        // Escolher a aula já lançada, à mão: o formulário dela NÃO pode aparecer.
        const naMao = await p.evaluate(() => {
          const sel = document.getElementById('aula');
          const op = [...sel.options].find((o) => o.value === '06');
          if (!op) return { existe: false };
          sel.value = '06';
          sel.dispatchEvent(new Event('change'));
          return { existe: true };
        });
        await new Promise((r) => setTimeout(r, 500));
        const depois = await p.evaluate(() => ({
          aula: (document.getElementById('aula') || {}).value,
          painel: !document.getElementById('captura').hidden,
          campos: (document.getElementById('captura-campos') || {}).textContent || '',
          saida: (document.getElementById('saida') || {}).textContent || '',
        }));
        return { chegada, naMao, depois, erros };
      } finally { await nav.close(); srv.close(); }
    }

    const comIndice = await abrir({ semIndice: false });
    provar('o filtro do lançamento é a peça da folha (`.caixa.filtrar`), e não um `fieldset`',
      comIndice.chegada.filtroCaixa === true && comIndice.chegada.filtroFieldset === false,
      comIndice.chegada);
    provar('…com a nota do filtro, como nas outras oito listas', comIndice.chegada.filtroNota === true);
    provar('na chegada, o filtro NÃO cai na aula que o pacote acha que falta (a 06 está lançada)',
      comIndice.chegada.aula !== '06', comIndice.chegada);
    provar('…e o painel não está a oferecer o formulário da 06',
      !(comIndice.chegada.aula === '06' && comIndice.chegada.painel), comIndice.chegada);
    provar('escolher a 06 à mão não abre o formulário dela',
      comIndice.naMao.existe === true && comIndice.depois.painel === false, comIndice.depois);
    provar('…e a área de resultados diz que ela está lançada e o site ainda não publicou',
      /lançada/i.test(comIndice.depois.saida), comIndice.depois.saida.slice(0, 200));
    provar('…sem erro de página', comIndice.erros.length === 0, comIndice.erros);

    /* A CONTRAPROVA: SEM O ÍNDICE, A PÁGINA VOLTA-SE PARA O PACOTE — e oferece o formulário.
     *
     * É o defeito de 06/11/2026, a correr: o pacote publicado ainda é o de antes, e quem se guia
     * só por ele oferece de novo uma aula que já foi lançada. O que o índice traz é justamente o
     * que o pacote não sabe.
     *
     * O QUE ELA ESCOLHE, e porquê a 07: sem o índice, a 06 está fora de prazo e sem dado no pacote
     * — é a «não dada» do §3.3, e a página não a oferece. A primeira que o pacote ainda pode lançar
     * é a 07. (Com o índice, a 06 aparece como lançada e o formulário dela não se abre: é a secção
     * C. As duas metades são o mesmo defeito visto de dois lados.) */
    console.log('\nD. A contraprova: sem o índice do site, o formulário VOLTA — o defeito, a correr');
    const semIndice = await abrir({ semIndice: true });
    provar('sem o índice, o filtro cai na primeira aula que o PACOTE ainda pode lançar (a 07)',
      semIndice.chegada.aula === '07', semIndice.chegada.aula);
    provar('…e o formulário dela é oferecido outra vez — o «voltou ao formulário» do relato',
      semIndice.chegada.painel === true, semIndice.chegada.painel);

    console.log('\nE. O link da lista abre a aula que ele aponta — e a página não salta para outra');
    const comLink = await abrir({ semIndice: false, sufixo: '?ciclo=01&aula=06' });
    provar('com `?ciclo=01&aula=06`, o filtro fica na 06', comLink.chegada.aula === '06', comLink.chegada);
    provar('…e o formulário dela continua sem aparecer (ela está lançada)',
      comLink.chegada.painel === false, comLink.chegada);
    /* A CONTRAPROVA DO LINK: a mesma página, na aula 07 (que não foi lançada) — ali o formulário
     * tem de aparecer, com os campos. Prova que o link não «esconde» o formulário por acidente. */
    const naoDada = await abrir({ semIndice: false, sufixo: '?ciclo=01&aula=07' });
    provar('na aula 07 (sem lançamento), o formulário aparece com os campos',
      naoDada.chegada.aula === '07' && naoDada.chegada.painel === true
        && naoDada.chegada.campos.length > 100, naoDada.chegada);

    /* A AULA PEDIDA SOBREVIVE À SENHA (06/11/2026). Com o pacote cheio, o link chega aqui e a
     * página PEDE A SENHA antes de saber abrir o ciclo — e o «Abrir» do painel refazia a troca de
     * ciclo, mandando o filtro para «todas as aulas». Quem clicou numa aula caía noutro sítio,
     * depois de digitar a senha. */
    console.log('\nE.2 A aula pedida sobrevive ao painel da senha');
    const comSenha = await (async () => {
      const { srv, base } = await bancada({ semIndice: false, comSenha: true });
      const nav = await puppeteer.launch({ executablePath: executavel, headless: 'new',
        args: ['--no-sandbox', '--disable-dev-shm-usage'] });
      try {
        const p = await nav.newPage();
        await p.setViewport({ width: 390, height: 844 });
        await p.goto(base + '/lancamento.html?ciclo=01&aula=06', { waitUntil: 'networkidle0' });
        await new Promise((r) => setTimeout(r, 400));
        const antes = await p.evaluate(() => ({
          pedeSenha: !!document.getElementById('abrir-ciclo'),
          aula: (document.getElementById('aula') || {}).value,
        }));
        await p.$eval('#senha', (n) => { n.value = 'a-senha-da-pessoa'; });
        await p.$eval('#abrir-ciclo', (b) => b.click());
        await new Promise((r) => setTimeout(r, 900));
        const depois = await p.evaluate(() => ({
          aula: (document.getElementById('aula') || {}).value,
          painel: !document.getElementById('captura').hidden,
          saida: (document.getElementById('saida') || {}).textContent || '',
        }));
        return { antes, depois };
      } finally { await nav.close(); srv.close(); }
    })();
    provar('sem senha, a página pede a senha (e o filtro ainda não escolheu nada)',
      comSenha.antes.pedeSenha === true && !comSenha.antes.aula, comSenha.antes);
    provar('…e, com a senha, o filtro fica na aula que o link apontou — e não em «todas»',
      comSenha.depois.aula === '06', comSenha.depois);
    provar('…e o formulário dela não aparece (a aula já tem dado)',
      comSenha.depois.painel === false && /Aula 06/.test(comSenha.depois.saida), comSenha.depois);
  }

  /* ========================================================================================
   * F. A PONTE — as duas rotas existem no ar, e respondem com a verdade quando não conseguem ler
   *   Uma prova que só medisse o módulo aprovaria um módulo que ninguém chama. Aqui a ponte de
   *   produção é chamada em processo, sem rede (sem token, a leitura do repositório não sai), e o
   *   que se mede é o DESPACHO: a página sai com a frase dela, e a rota responde JSON — e não o
   *   404 dos assets, que é o que uma rota não despachada devolve.
   * ====================================================================================== */
  console.log('\nF. A ponte: a página e a rota existem — e, sem leitura, dizem isso');
  {
    const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));
    const env = { ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim' };
    const r = await producao.fetch(
      new Request('https://breu.exemplo/area-do-professor/aulas-dadas/'), env);
    const htmlPonte = await r.text();
    provar('a página das aulas dadas é servida pela ponte (200, e não o 404 dos assets)',
      r.status === 200 && /<title>Aulas dadas · Sistema Lastro<\/title>/.test(htmlPonte), r.status);
    provar('…e, sem conseguir ler o repositório, mostra a frase dela',
      /Nenhuma aula foi realizada até o momento/.test(htmlPonte), htmlPonte.slice(0, 120));

    const r2 = await producao.fetch(new Request('https://breu.exemplo/api/lancadas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ variante: VAR, ciclo: '01' }),
    }), env);
    const corpo = await r2.json().catch(() => null);
    provar('a rota «o que já foi lançado» responde JSON na ponte, e não o 404 dos assets',
      r2.status === 200 && corpo && typeof corpo.ok === 'boolean', corpo);
    provar('…e sem leitura diz `ok:false` — nunca «não há nada»',
      corpo && corpo.ok === false && /índice/.test(String(corpo.erro)), corpo);
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: o índice lê a FONTE (e não o pacote que ainda'
    + ' não publicou), a lista é a peça da casa e usa a frase dela, o formulário não se oferece para'
    + ' uma aula já dada, o link abre a aula que aponta, as duas rotas existem na ponte — e as'
    + ' contraprovas mostram o defeito a correr quando o índice falta.');
})().catch((erro) => { console.error(erro); process.exit(1); });
