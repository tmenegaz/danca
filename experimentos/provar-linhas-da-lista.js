#!/usr/bin/env node
'use strict';

/**
 * provar-linhas-da-lista.js — as listas simples têm DUAS linhas, e todas a mesma altura.
 *
 * Por que existe (18/10/2026). A regra das duas linhas quebrou DUAS vezes, e as duas vezes
 * por um motivo diferente:
 *
 *   1. com `display: block` no complemento, o selo descia sozinho e a curadoria ficava com
 *      TRÊS linhas (93px contra 63px);
 *   2. com `flex` + `wrap`, o selo descia para uma linha própria quando não cabia ao lado do
 *      nome — num contentor que quebra, os itens são distribuídos por linhas ANTES de
 *      encolherem, e um item sozinho na sua linha nunca encolhe. A 390px o «Balé nível 1,
 *      Grade 1» com o selo «Régua do Nível 1» dava 96px em vez de 65px.
 *
 * Nenhuma das duas apareceu no HTML: as duas só aparecem MEDINDO, e só em certas larguras.
 * Uma prova que abra as listas em quatro larguras e compare as alturas entre si apanha as
 * duas — a primeira porque a terceira linha é mais alta, a segunda porque a lista deixa de
 * ser uniforme.
 *
 * O que se prova, em 1280, 1024, 768, 390 e 320px:
 *
 *   1. cada item de lista simples tem uma `.linha1` (o nome e os selos) e, quando tem
 *      complemento, um `.dono` ABAIXO dela — nunca ao lado;
 *   2. todos os itens da MESMA lista têm a mesma altura (±3px): é a oscilação que a direção
 *      via ao trocar de página no vocabulário;
 *   3. o selo não escapa da primeira linha (a borda direita dele cabe na do grupo);
 *   4. nada transborda na horizontal, no item nem na página.
 *
 * NO TELEFONE A REGRA É OUTRA, e a prova muda de lado com ela (18/10/2026). Até 560px o item
 * vira uma grelha de três faixas — nome em cima, complemento (quando há) e, embaixo, o selo, a
 * coluna de turmas e o botão. O selo SAI da `.linha1` por `display: contents` nos invólucros,
 * sem marcação nova. Ali não se prova «o selo cabe na primeira linha» (é o contrário do que se
 * quer): prova-se que ele DESCE, que divide a faixa com a turma e o botão, e que o nome fica
 * sozinho em cima, numa linha só (reticências, nunca quebra).
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `motor/` de `HEAD` com `git archive`.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-linhas-da-lista.js
 *   node experimentos/provar-linhas-da-lista.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');

const CONTEXTO = { professor: 'tiago-menegaz', ciclo: '01', query: 'professor=tiago-menegaz&escola=fita&ciclo=01' };

/**
 * OS DADOS SÃO ESCOLHIDOS PARA TENSÃO, não para ficarem bonitos: um nome de turma longo e um
 * nome de rubrica longo (que é o que empurrava o selo para a linha de baixo), um nome curto
 * (que deixava o complemento ao lado), e um termo com o complemento comprido. É a variação
 * de comprimento que faz a altura oscilar — e é ela que se está a medir.
 */
const TERMOS = [
  { id: 't1', termo: 'arabesque', categoria: 'posição', tradicao: 'compartilhada' },
  { id: 't2', termo: 'fouetté entre-nan', categoria: 'giro', tradicao: 'compartilhada' },
  { id: 't3', termo: 'glissade', categoria: 'ligação', tradicao: 'compartilhada' },
  { id: 't4', termo: 'grand battement', categoria: 'movimento', tradicao: 'clássico' },
];

const RUBRICAS = [
  { id: 'r1', nome: 'Régua do Nível 1', niveis: ['satisfatório', 'razoável', 'em desenvolvimento', 'não se aplica'] },
  { id: 'r2', nome: 'Régua de Ensaio', niveis: ['ok', 'parcial'] },
  { id: 'r3', nome: 'Régua', niveis: ['a'] },
];

const TURMAS = [
  {
    id: 'tu1', nome: 'Balé nível 1, Grade 1', nivelReferencia: 'RAD', programaReferencia: 'Grade 1',
    frequencia: 2, dias: ['seg', 'qua'], horarios: { seg: '18:00', qua: '18:00' }, duracaoMin: 60,
    periodoInicio: '2026-01', periodoFim: '2026-12', rubricaId: 'r1',
    rubrica: ['satisfatório', 'razoável', 'em desenvolvimento', 'não se aplica'],
  },
  { id: 'tu2', nome: 'Balé nível 2, Grade 2', nivelReferencia: 'RAD', vigenteDe: '2026-03-01' },
  { id: 'tu3', nome: 'Balé nível 3, Grade 3', nivelReferencia: 'RAD', frequencia: 1, dias: ['sex'], horarios: { sex: '17:00' }, duracaoMin: 45 },
];

const REL = { tu1: ['t1', 't2'], tu3: ['t1'] };

const CURADORIAS = [
  { id: 'c1', professor: 'Tiago Menegaz', modalidade: 'balé clássico', turmas: ['tu1'], passos: 4, alunas: 6 },
  { id: 'c2', professor: 'Ana Lima', modalidade: 'dança contemporânea', turmas: ['tu3'], passos: 2, alunas: 3 },
];

const PROFS = [{ nome: 'Ana Lima', slug: 'ana-lima' }, { nome: 'Rita Souza', slug: 'rita-souza' }];
const ALUNAS = ['Maria P.', 'Joana R.', 'Clara M.'];

function pagina(motor) {
  const b = require(path.join(motor, 'servidor/bastidores.js'));
  return b.paginaProducao('fita', CONTEXTO, PROFS, ALUNAS, 'Tiago Menegaz', 'tiago-menegaz',
    TURMAS, TERMOS, REL, CURADORIAS, RUBRICAS, [{ turma: 'Balé nível 3, Grade 3' }]);
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
 * A LEITURA, feita no navegador sobre as listas SIMPLES: as que seguem a regra das duas
 * linhas. A lista de turmas não entra — o cartão da turma é outra peça, com métricas e
 * painéis, e é medido pela `provar-cartao-da-turma.js`.
 */
function medir() {
  const LISTAS = [
    ['professores', '#sec-professores .col-lista li:not(.vazia)'],
    ['alunas', '#sec-alunas .col-lista li:not(.vazia)'],
    ['vocabulário', '#sec-vocabulario .col-lista li:not(.vazia)'],
    ['curadorias', '#sec-curadorias .col-lista li:not(.vazia)'],
    ['rubricas', '#passo-rubrica .col-lista li:not(.vazia)'],
    ['vínculos', '#passo-vincular .col-lista li:not(.vazia)'],
  ];
  const saida = [];
  for (const [nome, sel] of LISTAS) {
    const itens = [...document.querySelectorAll(sel)];
    saida.push({
      lista: nome,
      quantos: itens.length,
      alturas: itens.map((li) => Math.round(li.getBoundingClientRect().height)),
      linhas: itens.map((li) => {
        const nome2 = li.querySelector('.nome');
        if (!nome2) return null;
        const l1 = nome2.querySelector('.linha1') || nome2.querySelector('b');
        const dono = [...nome2.children].find((c) => c.classList && c.classList.contains('dono'));
        const r = (e) => (e ? e.getBoundingClientRect() : null);
        const b1 = r(l1);
        const bd = r(dono);
        const selo = nome2.querySelector('.selo');
        const bs = r(selo);
        const bt = r(li.querySelector('.turmas-do-nome'));
        const ba = r(li.querySelector('.acoes'));
        // LINHAS VISUAIS: quantas faixas horizontais distintas o item ocupa, contando só o que
        // tem conteúdo. 8px de folga porque selo (30px) e botão (29px) centrados na mesma faixa
        // arredondam com 1px de diferença — isso é a mesma linha, não uma terceira.
        const ys = [b1, bs, bd, bt, ba].filter(Boolean).map((q) => q.top).sort((p, q) => p - q);
        let linhasVisuais = 0; let anterior = -999;
        for (const y of ys) { if (y - anterior > 8) { linhasVisuais++; anterior = y; } }
        return {
          temGrupo: Boolean(nome2.querySelector('.linha1')),
          linhasVisuais,
          // No telefone o selo SAI da primeira linha (é a regra que esta prova passou a
          // descrever): desce para a faixa de baixo e passa a dividi-la com a coluna de
          // turmas e o botão. Mede-se a descida e a companhia, não a caixa do grupo.
          seloAbaixo: !bs || !b1 || bs.top >= b1.bottom - 2,
          seloComOsBotoes: !bs || !ba || Math.abs(bs.top - ba.top) <= 8,
          // O nome NÃO QUEBRA em duas linhas no telefone: encurta com reticências. Sem isto,
          // um nome comprido voltaria a empurrar tudo (28px é uma linha de `b`; 34 dá folga).
          nomeEmUmaLinha: !b1 || b1.height <= 34,
          // Um item SEM complemento tem uma linha, e está certo: a regra diz onde o
          // complemento fica, não que ele tenha de existir («Ana Lima» não tem papel a
          // declarar; o principal tem «principal»). Por isso a altura é comparada DENTRO do
          // grupo dos que têm complemento.
          temDono: Boolean(dono),
          // O COMPLEMENTO TEM DE ESTAR ABAIXO, e não ao lado. 2px de folga para o arredondamento.
          donoAbaixo: !bd || !b1 || bd.top >= b1.bottom - 2,
          seloDentro: !bs || !b1 || bs.right <= b1.right + 1,
          estouro: li.scrollWidth - li.clientWidth,
        };
      }),
    });
  }
  return { listas: saida, pagina: document.documentElement.scrollWidth - window.innerWidth };
}

const LARGURAS = [1280, 1024, 768, 390, 320];

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-linhas-da-lista: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-linhas-da-lista: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const negativo = process.argv.includes('--controle-negativo');
  let motor = path.join(raiz, 'motor');
  if (negativo) {
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'motor-linhas-'));
    execSync('git archive HEAD motor biblioteca tools/templates | tar -x -C ' + destino, { cwd: raiz, stdio: 'pipe' });
    motor = path.join(destino, 'motor');
    console.log('CONTROLE NEGATIVO — o motor de HEAD (antes do grupo da primeira linha)\n');
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
    await pg.setViewport({ width: w, height: 1200 });
    // A REGRA MUDA DE LADO A 560px, e a prova tem de mudar com ela: na tela larga o selo mora
    // DENTRO da primeira linha (é o que impede o nome de quebrar ao lado dele); no telefone ele
    // sai para a faixa de baixo, junto da turma e do botão, e o nome fica sozinho em cima.
    // Afirmar uma só das duas coisas reprovaria a outra — e foi o que aconteceu quando a regra
    // do telefone entrou.
    const estreito = w <= 560;
    const linhaCerta = (x) => (estreito
      ? x.seloAbaixo && x.seloComOsBotoes && x.nomeEmUmaLinha && x.linhasVisuais <= 3
      : x.seloDentro);
    const rotuloDaLinha = estreito
      ? 'o selo desce para a linha da turma e do botão, e o nome fica sozinho em cima'
      : 'o complemento desce, e o selo fica na primeira linha';

    await pg.goto(base + '/bastidores/estudio', { waitUntil: 'load' });
    await pg.evaluate(() => {
      const c = document.getElementById('conteudo');
      if (c) c.hidden = false;
      location.hash = '#turmas';
    });
    await new Promise((r) => setTimeout(r, 120));

    // Os dois passos que têm lista própria precisam estar ABERTOS para medir: um elemento
    // dentro de um `hidden` mede zero.
    for (const passo of ['rubrica', 'vincular']) {
      await pg.evaluate((p) => {
        const b = document.querySelector('button.passo[data-passo="' + p + '"]');
        if (b) b.click();
      }, passo);
      await new Promise((r) => setTimeout(r, 60));
      const m = await pg.evaluate(medir);
      const l = m.listas.find((x) => x.lista === (passo === 'rubrica' ? 'rubricas' : 'vínculos'));
      if (l && l.quantos) {
        const comDono = (l.linhas || []).map((x, i) => (x && x.temDono ? l.alturas[i] : null)).filter((x) => x != null);
        const min = Math.min(...comDono); const max = Math.max(...comDono);
        provar(`@${w} · ${l.lista}: ${l.quantos} itens, e os que têm complemento têm a mesma altura`,
          comDono.length === 0 || max - min <= 3, l.alturas);
        if (l.linhas.some((x) => x)) {
          // O GRUPO da primeira linha é o MECANISMO: é ele que faz o nome encolher em vez de
          // o selo descer. Uma lista que ainda não o tenha pode passar nas medidas com os
          // dados de hoje e falhar com os de amanhã — e foi assim que esta regra quebrou
          // duas vezes. Provar o mecanismo, e não só o resultado, é o que a segura.
          provar(`@${w} · ${l.lista}: cada item tem o grupo da primeira linha (nome + selos)`,
            l.linhas.every((x) => x && x.temGrupo), l.linhas.map((x) => x && x.temGrupo));
          provar(`@${w} · ${l.lista}: ${rotuloDaLinha}`,
            l.linhas.every((x) => x && x.donoAbaixo && linhaCerta(x)), l.linhas);
        }
      }
    }

    // As listas das secções que já estão no documento.
    await pg.evaluate(() => { location.hash = '#professores'; });
    await new Promise((r) => setTimeout(r, 100));
    for (const secao of ['professores', 'alunas', 'vocabulario', 'curadorias']) {
      await pg.evaluate((s) => { location.hash = '#' + s; }, secao);
      await new Promise((r) => setTimeout(r, 100));
      const m = await pg.evaluate(medir);
      const l = m.listas.find((x) => x.lista === ({
        professores: 'professores', alunas: 'alunas', vocabulario: 'vocabulário', curadorias: 'curadorias',
      })[secao]);
      if (!l || !l.quantos) continue;
      const comDono = (l.linhas || []).map((x, i) => (x && x.temDono ? l.alturas[i] : null)).filter((x) => x != null);
      const min = Math.min(...comDono); const max = Math.max(...comDono);
      provar(`@${w} · ${l.lista}: ${l.quantos} itens, e os que têm complemento têm a mesma altura`,
        comDono.length === 0 || max - min <= 3, l.alturas);
      if (l.linhas.some((x) => x)) {
        provar(`@${w} · ${l.lista}: cada item tem o grupo da primeira linha (nome + selos)`,
          l.linhas.every((x) => x && x.temGrupo), l.linhas.map((x) => x && x.temGrupo));
        provar(`@${w} · ${l.lista}: ${rotuloDaLinha}`,
          l.linhas.every((x) => x && x.donoAbaixo && linhaCerta(x)), l.linhas);
      }
      provar(`@${w} · ${l.lista}: nenhum item transborda`,
        l.linhas.every((x) => x && x.estouro <= 1), l.linhas.map((x) => x && x.estouro));
    }
    provar(`@${w} · a página não estoura na horizontal`,
      (await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1);
  }

  await br.close();
  srv.close();
  console.log(`\nprovar-linhas-da-lista: ${falhas === 0 ? 'TUDO CERTO' : falhas + ' FALHA(S)'}`);
  process.exit(falhas ? 1 : 0);
})();
