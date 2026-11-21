#!/usr/bin/env node
'use strict';

/**
 * provar-trava-da-operacao.js — a cadeia do ciclo não se deixa atropelar por si mesma.
 *
 * O QUE MOTIVOU (08/11/2026). Ela contou como percorreu a cadeia: «criar a aluna, fazer a anamnese,
 * incluí-la no elenco, incluí-la na turma, fazer o plano de ensino, fazer o plano de observação…
 * eu fui dando cliques, fazendo de forma bem rápida e não deu tempo do workflow das actions
 * terminarem seus processos». Cada passo LÊ o que o anterior gravou, e o último escreve no
 * repositório e dispara a geração do pacote. Clicados em sequência, os gestos entram uns sobre os
 * outros: 08/11/2026 correram três gerações do mesmo ciclo em cinquenta segundos, uma perdeu a
 * corrida e o pacote ficou meio entregue.
 *
 * O QUE ESTA PROVA MEDE, num Chrome e na página REAL (`porta/index.html`, servida pela ponte de
 * produção montada):
 *
 *   A. ANTES. O véu não está de pé, o conteúdo responde ao ponteiro e não está `inert`.
 *   B. DURANTE. `ocupar()` põe o véu a cobrir a janela inteira, com o texto que lhe foi dado, e o
 *      conteúdo fica `inert` — nem ponteiro (`elementFromPoint` devolve o véu), nem teclado, nem
 *      leitor de ecrã. É isto que faz um passo não ser clicável enquanto o anterior corre.
 *   C. DEPOIS. `liberar()` devolve a página ao estado de antes, sem resíduo.
 *   D. A LIGAÇÃO. O «Guardar» chama `ocupar` ANTES de escrever e `liberar` num `finally` — sem
 *      isso a peça existiria e ninguém a usaria. A prova lê a fonte e diz que é leitura de fonte,
 *      não medição de tela: as duas coisas valem o que valem.
 *   E. A ESPERA. `esperarAGeracao` desiste quando o estado não existe (uma bancada) em vez de
 *      girar para sempre — o caso que uma barra sem informação produz.
 *
 * Requer Chrome/Chromium. Sem ele: NÃO FEITO (e o resto não corre, porque tudo aqui é tela).
 *
 *   node experimentos/provar-trava-da-operacao.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');

let puppeteer = null;
try {
  // O `puppeteer-core` vem DENTRO do `marp-cli` global — é o caminho que as outras provas de tela
  // usam (`provar-menu-do-formulario`), e não um segundo navegador instalado só para provar.
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
} catch (e) { puppeteer = null; }
const CHROME = process.env.CHROME_PATH
  || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

(async () => {
  if (!puppeteer || !fs.existsSync(CHROME)) {
    console.log('NÃO FEITO — sem Chrome/Chromium ou sem puppeteer-core; esta prova é de tela.');
    process.exit(2);
  }

  const lib = require(path.join(raiz, 'experimentos/lib-pacote.js'));
  const montada = lib.publicacaoDeUmaEscolaComCiclo();
  if (!montada) {
    console.error('provar-trava-da-operacao: nenhuma publicação para servir — NÃO FEITO.');
    process.exit(2);
  }
  const producao = require(path.join(raiz, 'motor/servidor/producao.js'));
  const dir = montada.dir;
  const ESCOLA = montada.escola;

  /* O KV DA BANCADA — com a CURADORIA, e não vazio. A porta confere `podePreencher` no arranque e
   * devolve à lista quem não tem turma atribuída: sem esta chave a página nunca abria, e a prova
   * mediria a lista em vez do formulário. */
  const memoriaKv = new Map(Object.entries({
    ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([{
      id: 'c1', professor: 'dedao-aberto', modalidade: 'balé', tradicao: 'clássico',
      turmas: ['sala rosa'], alunas: ['Aluna A', 'Aluna B', 'Aluna C'],
    }]),
  }));
  const kv = {
    async get(k) { return memoriaKv.has(k) ? memoriaKv.get(k) : null; },
    async put(k, v) { memoriaKv.set(k, v); },
    async delete(k) { memoriaKv.delete(k); },
    async list() { return { keys: [...memoriaKv.keys()].map((name) => ({ name })) }; },
  };
  global.ENV = {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', SENHA_PROFESSOR: 'certa',
    // Sem professor cadastrado a ponte serve «Área do Professor desabilitada» e a porta nunca
    // chega à tela: é a guarda de `temProfessor`, e a bancada tem de a satisfazer.
    PROFESSOR_NOME: 'Dedão Aberto',
    PADD_KV: kv,
    ASSETS: {
      async fetch(pedido) {
        const url = pedido instanceof URL ? pedido : new URL(pedido.url);
        let p = path.join(dir, url.pathname);
        if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
        if (!fs.existsSync(p)) return new Response('nao', { status: 404 });
        const t = /[.](css|js|svg|json|html)$/.exec(url.pathname);
        const M = { '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
          '.svg': 'image/svg+xml', '.json': 'application/json' };
        return new Response(fs.readFileSync(p), { status: 200,
          headers: { 'Content-Type': M[t ? '.' + t[1] : ''] || 'text/html; charset=utf-8' } });
      },
    },
  };

  const servidor = http.createServer(async (req, res) => {
    try {
      /* TUDO VAI À PONTE DE VERDADE, `/api/*` incluído: a bancada não reinventa as respostas — o
       * que se mede é a página servida, com o seu contexto (a escola, o professor, a curadoria)
       * vindo do mesmo sítio que em produção. */
      const r = await producao.fetch(new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + req.url), global.ENV);
      const texto = await r.text();
      res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'text/html; charset=utf-8' });
      return res.end(texto);
    } catch (erro) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end(String(erro && erro.message));
    }
  });
  const porta = await new Promise((r) => { servidor.listen(0, '127.0.0.1', () => r(servidor.address().port)); });
  const base = 'http://127.0.0.1:' + porta;

  const navegador = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const p = await navegador.newPage();
    await p.setViewport({ width: 1280, height: 800 });
    /* O ENDEREÇO DO ATO — o MESMO que a lista da Área do Professor monta (`endereco()` em
     * `listas-do-acervo.js`): professor, ciclo, `fonte=po`, o PLANO escolhido e `abrir=1`. Sem o
     * plano a porta escolhe o primeiro da estante; sem `abrir` ela pára antes do formulário. */
    await p.goto(base + '/plano-observacao/?professor=dedao-aberto&ciclo=01&fonte=po'
      + '&plano=plano-20261108-0955&abrir=1&escola=' + ESCOLA,
      { waitUntil: 'networkidle2', timeout: 30000 });

    // ==========================================================================================
    console.log('\nA. ANTES — a página responde, e o véu não está de pé');
    {
      const antes = await p.evaluate(() => {
        const veu = document.getElementById('veu');
        const principal = document.getElementById('principal');
        return {
          existe: Boolean(veu),
          visivel: veu ? getComputedStyle(veu).display !== 'none' : null,
          ocupado: veu ? veu.dataset.ocupado || null : null,
          inert: principal ? principal.inert === true : null,
          funcoes: typeof window.ocupar === 'function' && typeof window.liberar === 'function',
        };
      });
      provar('a porta publicada traz o véu', antes.existe === true, antes);
      provar('…que nasce escondido', antes.visivel === false, antes.visivel);
      provar('…e o conteúdo responde (não está `inert`)', antes.inert === false, antes.inert);
      provar('…e as duas funções da trava existem na página', antes.funcoes === true, antes);
    }

    // ==========================================================================================
    console.log('\nB. DURANTE — o véu cobre, tranca e diz');
    {
      const durante = await p.evaluate(() => {
        // Sem a peça (a contraprova, sobre o código de antes) não há o que medir: devolve-se o
        // facto, e as asserções abaixo reprovam — em vez de a prova explodir num `TypeError`, que
        // se lê como avaria da bancada e não como ausência da trava.
        if (typeof window.ocupar !== 'function') return { semPeca: true };
        window.ocupar('gravando o Plano de Observação e gerando o ciclo…');
        const veu = document.getElementById('veu');
        const caixa = veu.getBoundingClientRect();
        const texto = document.getElementById('veu-texto');
        const principal = document.getElementById('principal');
        const meio = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        const alvo = document.querySelector('#voltar');
        const alvoCaixa = alvo ? alvo.getBoundingClientRect() : null;
        const sobreOAlvo = alvoCaixa
          ? document.elementFromPoint(alvoCaixa.left + alvoCaixa.width / 2, alvoCaixa.top + alvoCaixa.height / 2)
          : null;
        return {
          display: getComputedStyle(veu).display,
          largura: Math.round(caixa.width), altura: Math.round(caixa.height),
          janela: [window.innerWidth, window.innerHeight],
          texto: texto ? texto.textContent : null,
          inert: principal.inert === true,
          noMeio: meio ? meio.className : null,
          sobreOAlvo: sobreOAlvo ? sobreOAlvo.className : null,
        };
      });
      // `semPeca` (a contraprova, sobre o código de antes) faz TODAS as asserções desta secção
      // reprovarem — que é o que se quer dizer: sem a peça, não há trava.
      provar('o véu está de pé', durante.display === 'flex', durante);
      provar('…a cobrir a janela inteira',
        Array.isArray(durante.janela) && durante.largura === durante.janela[0]
          && durante.altura === durante.janela[1], durante);
      provar('…e diz o que está a acontecer',
        /gerando o ciclo/.test(String(durante.texto)), durante.texto);
      provar('o conteúdo fica `inert` (teclado e leitor de ecrã também)', durante.inert === true, durante.inert);
      provar('o ponteiro, no meio da tela, encontra o VÉU', /veu/.test(String(durante.noMeio)), durante.noMeio);
      provar('…e em cima de um botão do conteúdo também (ele não é clicável)',
        /veu/.test(String(durante.sobreOAlvo)), durante.sobreOAlvo);
    }

    // ==========================================================================================
    console.log('\nC. DEPOIS — `liberar()` devolve a página ao que era');
    {
      const depois = await p.evaluate(() => {
        if (typeof window.liberar !== 'function' || !document.getElementById('veu')) return { semPeca: true };
        window.liberar();
        const veu = document.getElementById('veu');
        const principal = document.getElementById('principal');
        return {
          display: getComputedStyle(veu).display,
          ocupado: veu.dataset.ocupado || null,
          inert: principal.inert === true,
          noMeio: (document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2) || {}).className || null,
        };
      });
      provar('o véu sai', depois.display === 'none', depois.display);
      provar('…sem deixar marca no elemento', depois.ocupado === null, depois.ocupado);
      provar('…e o conteúdo volta a responder', depois.inert === false, depois.inert);
      provar('…com o ponteiro a chegar outra vez ao conteúdo', !/veu/.test(String(depois.noMeio)), depois.noMeio);
    }

    // ==========================================================================================
    console.log('\nE. A ESPERA — desiste quando não há geração para esperar');
    {
      const espera = await p.evaluate(async () => {
        if (typeof window.esperarAGeracao !== 'function') return { semPeca: true };
        const t0 = Date.now();
        const estado = await window.esperarAGeracao({ professor: 'dedao-aberto', ciclo: '01', turma: 'sala rosa' }, 3000);
        return { fase: estado && estado.fase, ms: Date.now() - t0 };
      });
      provar('sem estado de geração, a espera termina em vez de girar para sempre',
        ['sem-registro', 'indisponivel', 'sem-consulta'].indexOf(String(espera.fase)) !== -1, espera);
      provar('…e termina depressa (não espera o limite de 3 s)', espera.ms < 2500, espera.ms);
    }
  } finally {
    await navegador.close();
    servidor.close();
  }

  // ============================================================================================
  console.log('\nD. A LIGAÇÃO — o «Guardar» usa a trava (leitura da fonte, não da tela)');
  {
    const fonte = fs.readFileSync(path.join(raiz, 'porta/index.html'), 'utf8');
    const corpo = fonte.replace(/<script src="[^"]*"><\/script>/g, '');
    const posOcupar = corpo.indexOf("ocupar(FONTE === 'po'");
    const posEnviar = corpo.indexOf('const dados = await enviar(false');
    const posLiberar = corpo.indexOf('} finally {\n      liberar();');
    provar('o «Guardar» tranca ANTES de escrever', posOcupar !== -1 && posEnviar !== -1 && posOcupar < posEnviar,
      { posOcupar, posEnviar });
    provar('…e destranca num `finally` (nenhum caminho deixa a página trancada)',
      posLiberar !== -1 && posLiberar > posEnviar, { posLiberar, posEnviar });
    provar('…e espera a geração quando ela foi disparada',
      /const disparo = dados\.disparo/.test(corpo) && /await esperarAGeracao\(/.test(corpo));
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + (n - falhas) + ' de ' + n + ' asserções passaram');
    process.exit(1);
  }
  console.log('PASSOU — ' + n + ' de ' + n + ' asserções');
})();
