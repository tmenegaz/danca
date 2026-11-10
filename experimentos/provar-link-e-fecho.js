#!/usr/bin/env node
'use strict';

/*
 * provar-link-e-fecho.js — O «ABRIR» ENTRA NO DOCUMENTO, E A GERAÇÃO CONTINUA-SE SOZINHA
 * (10/11/2026).
 *
 * O QUE ESTA PROVA FIXA, e porquê. A pesquisadora migrou um elenco dentro da Turma, a cadeia
 * parou no teto de subpedidos, e ela ficou com duas coisas por resolver:
 *
 *   1. o link «abrir» levava a `/plano-observacao/` SEM ALVO — a porta não tinha documento para
 *      abrir, a trava dela não encontrava o que validar, e devolvia-a à listagem. Ela descreveu
 *      o sintoma com precisão: «levou directo para o lugar aonde eu precisava clicar, mas depois
 *      voltou para a listagem». E com vários avisos empilhados, o professor perde o fio;
 *   2. o último passo — a geração — era trabalho dela: abrir o plano de observação, ajustar,
 *      gerar. A via crucis outra vez, só que no fim.
 *
 * O QUE SE MEDE AQUI, no navegador, sobre a página de verdade:
 *
 *   A. O ENDEREÇO. O «abrir» da etapa pendente traz `ajustar=<carimbo>` e `plano=<plano>` — os
 *      dois parâmetros que a porta já sabe ler (`provar-painel-do-ato.js` mede que eles abrem o
 *      documento e não devolvem à lista). Sem eles, o link é a página nua.
 *   B. A CONTINUAÇÃO. Com `porOrcamento`, a página pede `POST /api/bastidores/cadeia-pacote`
 *      SOZINHA — um pedido novo, logo um teto novo de subpedidos — e repinta com o resultado.
 *   C. SEM EMPILHAR. O que a função pintou sai antes do que ela vai pintar, e a frase do acto
 *      («Fulana passou de A para B») fica: a caixa é a mesma, e apagá-la apagaria o acto.
 *   D. UMA VEZ SÓ. Dois `pintarCadeia` no mesmo sítio não pedem duas gerações: a guarda está no
 *      próprio elemento. E sem `porOrcamento` não se pede nada.
 *   E. A FILA. Um gesto que toca duas turmas faz DOIS pedidos, um por turma — o teto é por
 *      invocação, e a que não fechar é a que fica à vista (e não o «fechou» da outra).
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `motor/` de `REF_NEGATIVO` (por omissão
 * `HEAD`) e corre as MESMAS provas. O código de antes não tem a continuação nem os carimbos no
 * endereço — se passasse, a prova não estaria a provar nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-link-e-fecho.js
 *   REF_NEGATIVO=HEAD~1 node experimentos/provar-link-e-fecho.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');
const CONTEXTO = {
  professor: 'tiago-menegaz', ciclo: '01',
  query: 'professor=tiago-menegaz&escola=valse&ciclo=01',
};

function pagina(motor) {
  const b = require(path.join(motor, 'servidor/bastidores.js'));
  return b.paginaProducao('valse', CONTEXTO, [], [], 'Tiago Menegaz', 'tiago-menegaz',
    [], [], [], [], [], []);
}

/** O servidor da bancada: a página, a folha, e a API stubada — sem tocar no ar. */
function servir(html, visto) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    }
    /* O FECHO DO PACOTE — a rota que se mede. Regista o que foi pedido e devolve o estado já
     * fechado, que é o que o servidor devolveria depois de a geração partir. */
    if (caminho === '/api/bastidores/cadeia-pacote' && req.method === 'POST') {
      let corpo = '';
      req.on('data', (c) => { corpo += c; });
      req.on('end', () => {
        let d = {};
        try { d = JSON.parse(corpo); } catch (e) { d = {}; }
        visto.push(d);
        /* A SEGUNDA TURMA NÃO FECHA — é o caso da fila: cada pedido leva o seu teto, e a que
         * falha tem de ser a que fica à vista no fim. */
        const turma = (d.turmas || [])[0];
        const falhou = turma === 'Jazz Nível 2';
        ok('application/json', JSON.stringify(falhou ? {
          ok: false,
          cadeia: {
            executada: true, ok: false, completa: true,
            fecharam: ['Vínculos e etiquetas', 'Plano de ensino', 'Plano de observação'],
            restam: ['Documentos gerados (HTML e PDF)'],
            porOrcamento: true,
            faltam: [{
              turma, chave: 'pacote', rotulo: 'Documentos gerados (HTML e PDF)',
              estado: 'pendente', falta: 'esta invocação do Worker já gastou 33 dos 50',
              href: '/plano-observacao/?professor=tiago-menegaz&escola=valse&ciclo=01&fonte=po',
            }],
            alvos: [{ turma, ok: false, etapas: [] }],
            recado: 'a cadeia avançou até «Plano de observação», e isso ficou gravado. '
              + 'Falta só Documentos gerados (HTML e PDF).',
          },
        } : {
          ok: true,
          cadeia: {
            executada: true,
            ok: true,
            completa: true,
            fecharam: ['Vínculos e etiquetas', 'Plano de ensino', 'Plano de observação',
              'Documentos gerados (HTML e PDF)'],
            restam: [],
            porOrcamento: false,
            faltam: [],
            alvos: [{ turma, ok: true, etapas: [] }],
            recado: 'a cadeia fechou: vínculos, plano de ensino, plano de observação e '
              + 'documentos gerados estão em dia.',
          },
        }));
      });
      return;
    }
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({
    srv, base: 'http://127.0.0.1:' + srv.address().port,
  })));
}

/* A CADEIA FALSA que a página vai pintar — o estado que o servidor devolve.
 *
 * DOIS CASOS, e são os dois que a pesquisadora encontrou:
 *   · `PARADA_NA_OBSERVACAO` — o PO ainda por derivar; o «abrir» leva `ajustar=` e `plano=`;
 *   · `PARADA_NO_PACOTE` — a travessia avançou até ao PO e o teto de subpedidos cortou a
 *     geração; é o caso dela, e é ele que a página continua sozinha.
 * Os hrefs são os que o `enderecoDaEtapa` produz (medidos em `provar-fecho-do-pacote.js`,
 * secção C) — aqui mede-se o que a TELA faz com eles. */
const PARADA_NA_OBSERVACAO = {
  executada: true, ok: false, completa: true,
  fecharam: ['Vínculos e etiquetas', 'Plano de ensino'],
  restam: ['Plano de observação', 'Documentos gerados (HTML e PDF)'],
  porOrcamento: false,
  alvos: [{ turma: 'Balé Nível 1', ok: false, etapas: [] }],
  faltam: [
    {
      turma: 'Balé Nível 1', chave: 'plano-de-observacao',
      rotulo: 'Plano de observação', estado: 'pendente',
      falta: 'o PO é anterior à mudança — a cadeia deriva um elo novo',
      href: '/plano-observacao/?professor=tiago-menegaz&escola=valse&ciclo=01'
        + '&fonte=po&ajustar=po-20261103-2221&plano=plano-20261103-2200',
    },
  ],
  recado: 'a cadeia avançou até «Plano de ensino», e isso ficou gravado. '
    + 'Falta Plano de observação, Documentos gerados (HTML e PDF).',
};

const PARADA_NO_PACOTE = {
  executada: true, ok: false, completa: true,
  fecharam: ['Vínculos e etiquetas', 'Plano de ensino', 'Plano de observação'],
  restam: ['Documentos gerados (HTML e PDF)'],
  porOrcamento: true,
  alvos: [{ turma: 'Balé Nível 1', ok: false, etapas: [] }],
  faltam: [
    {
      turma: 'Balé Nível 1', chave: 'pacote',
      rotulo: 'Documentos gerados (HTML e PDF)', estado: 'pendente',
      falta: 'esta invocação do Worker já gastou 33 dos 50 subpedidos permitidos',
      href: '/plano-observacao/?professor=tiago-menegaz&escola=valse&ciclo=01'
        + '&fonte=po&plano=plano-20261103-2200',
    },
  ],
  recado: 'a cadeia avançou até «Plano de observação», e isso ficou gravado. '
    + 'Falta só Documentos gerados (HTML e PDF). A geração não cabia neste pedido — ela corre '
    + 'já a seguir, num pedido próprio.',
};

/* O GESTO QUE TOCOU DUAS TURMAS — a fila. O teto é por invocação, e uma geração custa 18:
 * duas caberiam, mas a fila é por turma para que NUNCA dependa da conta. */
const DUAS_TURMAS = Object.assign({}, PARADA_NO_PACOTE, {
  alvos: [{ turma: 'Balé Nível 1', ok: false, etapas: [] },
    { turma: 'Jazz Nível 2', ok: false, etapas: [] }],
});

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-link-e-fecho: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-link-e-fecho: puppeteer-core não encontrado (vem do marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const negativo = process.argv.includes('--controle-negativo');
  let motor = path.join(raiz, 'motor');
  if (negativo) {
    const ref = process.env.REF_NEGATIVO || 'HEAD';
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'motor-fecho-'));
    execSync('git archive ' + ref + ' motor modelo porta biblioteca tools teste | tar -x -C ' + destino,
      { cwd: raiz, stdio: 'pipe' });
    // O `motor` lê os moldes de `modelo/` e o ajv de `node_modules/` — sem eles, o controle
    // negativo morria a montar a página, e não a medir o que ela faz.
    fs.symlinkSync(path.join(raiz, 'node_modules'), path.join(destino, 'node_modules'), 'dir');
    motor = path.join(destino, 'motor');
    console.log('CONTROLE NEGATIVO — o motor de ' + ref + ' (antes do fecho automático)\n');
  }

  const html = pagina(motor);
  const visto = [];
  const { srv, base } = await servir(html, visto);
  const navegador = await puppeteer.launch({
    executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  let ok = 0;
  let ko = 0;
  const provar = (rotulo, condicao, detalhe) => {
    if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
    else {
      ko += 1;
      console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
    }
  };
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  const p = await navegador.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0', timeout: 60000 });

  /* A CAIXA DO ACTO: o mesmo `data-res` que a página usa, com a frase que o gesto escreveu. É
   * ela que a cadeia não pode apagar. */
  await p.evaluate((cadeia) => {
    const caixa = document.createElement('p');
    caixa.id = 'prova-res';
    caixa.className = 'res ok';
    caixa.setAttribute('data-res', 'prova');
    caixa.textContent = 'Aluna B passou de Elenco A para Elenco B. ';
    document.body.appendChild(caixa);
    window.__cadeia = cadeia;
    window.pintarCadeia(cadeia, caixa);
  }, PARADA_NA_OBSERVACAO);

  // A. O ENDEREÇO
  {
    const href = await p.evaluate(() => {
      const a = document.querySelector('#prova-res a');
      return a ? a.getAttribute('href') : null;
    });
    provar('o «abrir» existe', Boolean(href), href);
    provar('…e leva o carimbo do documento (`ajustar=`)',
      /[?&]ajustar=/.test(String(href || '')), href);
    provar('…e o plano que ele observa (`plano=`)',
      /[?&]plano=/.test(String(href || '')), href);
    provar('…e o contexto da escola, para não abrir a porta de outra',
      /escola=valse/.test(String(href || '')) && /professor=tiago-menegaz/.test(String(href || '')), href);
  }

  // C. O ACTO FICA, E O QUE FOI PINTADO NÃO SE EMPILHA
  {
    const texto = await p.evaluate(() => (document.getElementById('prova-res') || {}).textContent || '');
    provar('a frase do ACTO continua na caixa', /passou de Elenco A para Elenco B/.test(texto), texto);
    provar('…e o recado da cadeia vem depois dela',
      texto.indexOf('passou de') < texto.indexOf('a cadeia avançou'), texto.slice(0, 160));
    const quantos = await p.evaluate(() => document.querySelectorAll('#prova-res [data-cadeia]').length);
    provar('…e há UMA nota e UMA linha por etapa em falta (duas, não quatro)', quantos === 2, quantos);
  }

  // B. A CONTINUAÇÃO SOZINHA
  /* É AGORA que a cadeia pára no PACOTE — o caso da pesquisadora: a travessia gravou os dois elos
   * e o teto de subpedidos cortou a geração. A caixa é a mesma, e é a mesma função que a pinta. */
  await p.evaluate((cadeia) => {
    window.pintarCadeia(cadeia, document.getElementById('prova-res'));
  }, PARADA_NO_PACOTE);
  await esperar(900);
  {
    provar('a página pediu a geração num pedido PRÓPRIO', visto.length === 1, visto);
    provar('…e disse de que turma', visto[0] && JSON.stringify(visto[0].turmas) === '["Balé Nível 1"]',
      visto[0]);
    const texto = await p.evaluate(() => (document.getElementById('prova-res') || {}).textContent || '');
    provar('…e repintou com o resultado da geração',
      /a cadeia fechou/.test(texto), texto.slice(-200));
    provar('…sem deixar a linha do «por concluir» a pairar',
      !/por concluir|subpedidos/.test(texto), texto.slice(-200));
    const quantos = await p.evaluate(() => document.querySelectorAll('#prova-res [data-cadeia]').length);
    provar('…e a caixa ficou com uma nota só', quantos === 1, quantos);
    provar('…sem o aviso provisório do «a gerar»',
      !/a gerar os documentos/.test(texto), texto.slice(-200));
    const ato = /passou de Elenco A para Elenco B/.test(texto);
    provar('…e o acto continua lá, no fim de tudo', ato, texto.slice(0, 120));
  }

  // D. UMA VEZ SÓ
  {
    await p.evaluate((cadeia) => {
      const caixa = document.createElement('p');
      caixa.id = 'prova-res-2';
      caixa.setAttribute('data-res', 'prova-2');
      document.body.appendChild(caixa);
      /* Duas chamadas seguidas ao mesmo sítio, como a gravação e o `carregarLinhas` fazem. */
      window.pintarCadeia(cadeia, caixa);
      window.pintarCadeia(cadeia, caixa);
    }, PARADA_NO_PACOTE);
    await esperar(900);
    provar('duas pinturas no mesmo sítio pedem a geração UMA vez', visto.length === 2, visto.length);

    /* E O CONTRÁRIO: sem `porOrcamento`, não se pede nada. */
    const antes = visto.length;
    await p.evaluate((cadeia) => {
      const caixa = document.createElement('p');
      caixa.id = 'prova-res-3';
      caixa.setAttribute('data-res', 'prova-3');
      document.body.appendChild(caixa);
      window.pintarCadeia(Object.assign({}, cadeia, { porOrcamento: false }), caixa);
    }, PARADA_NO_PACOTE);
    await esperar(600);
    provar('sem `porOrcamento` a página NÃO pede geração', visto.length === antes, visto.length);
  }

  // E. A FILA — UMA TURMA POR PEDIDO
  {
    const antes = visto.length;
    await p.evaluate((cadeia) => {
      const caixa = document.createElement('p');
      caixa.id = 'prova-res-4';
      caixa.setAttribute('data-res', 'prova-4');
      document.body.appendChild(caixa);
      window.pintarCadeia(cadeia, caixa);
    }, DUAS_TURMAS);
    await esperar(1500);
    provar('duas turmas, dois pedidos', visto.length === antes + 2, visto.slice(antes));
    provar('…e cada pedido leva UMA turma só',
      visto.slice(antes).map((d) => (d.turmas || []).length).join(',') === '1,1',
      visto.slice(antes));
    const texto = await p.evaluate(() => (document.getElementById('prova-res-4') || {}).textContent || '');
    /* O QUE FICA À VISTA É A QUE NÃO FECHOU: a caixa não pode dizer «a cadeia fechou» por a
     * primeira ter fechado. */
    provar('…e é a turma que não fechou que fica à vista',
      /Jazz Nível 2/.test(texto) && !/a cadeia fechou/.test(texto), texto.slice(-220));
    provar('…com o «abrir» dela',
      await p.evaluate(() => Boolean(document.querySelector('#prova-res-4 a[href*="plano-observacao"]'))));
  }

  await navegador.close();
  srv.close();

  console.log('');
  if (ko) {
    console.log('provar-link-e-fecho: ' + ko + ' de ' + (ok + ko) + ' FALHARAM.');
    process.exit(1);
  }
  console.log('provar-link-e-fecho: ' + ok + ' de ' + (ok + ko) + ' passaram — o «abrir» entra no '
    + 'documento, a geração continua-se sozinha num pedido próprio POR TURMA, o acto não se apaga, '
    + 'não se pede duas vezes e a turma que não fechou é a que fica à vista.');
})();
