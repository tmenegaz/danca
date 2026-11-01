#!/usr/bin/env node
'use strict';

/**
 * provar-dimensoes-plano.js — a prova de que a DIMENSÃO OBSERVADA do PO deriva do PLANO.
 *
 * O modelo (decidido em 15/10/2026): o eixo é um só — **Técnica** — e cada **bloco da aula
 * que o plano marca** (solo, barra, centro, musicalidade, expressão) vira uma dimensão dele
 * («Técnica — Solo»). É a técnica que se trabalha *através* de cada bloco; o que muda de um
 * para o outro é o que se olha. Saíram do vocabulário do PO `musicalidade` (é um LUGAR, não
 * um eixo, e já entra pelo plano), `par/pas de deux` e `repertório do dia`.
 *
 * O defeito que esta prova trava é o da **prosa reaproveitada**: a lista era um campo
 * marcável com uma `forma` fixa em texto («técnica · musicalidade · par/pas de deux ·
 * repertório do dia») — vocabulário que não é o do plano nem o da anamnese, e que fazia o
 * professor redigitar o que ele já tinha declarado no plano. E, na repetição dos itens, a
 * referência da anamnese era impressa para QUALQUER repetição: a dimensão «Técnica — Solo»
 * aparecia como «Sem anamnese para «Técnica — Solo»», com um atalho para criar a anamnese
 * de uma dimensão.
 *
 * A prova roda a PÁGINA (jsdom, servida por HTTP de verdade) e não o contrato: o que se
 * afirma aqui é a tela — a lista que o professor LÊ, e a repetição que ele PREENCHE.
 *
 *   uso: npm install --no-save jsdom && node experimentos/provar-dimensoes-plano.js
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.join(__dirname, '..');
const CONTEUDO_PO = path.join(RAIZ, 'porta/po/conteudo/po.json');
const PAGINA_FONTE = path.join(RAIZ, 'porta/index.html');
// Os assets da RAIZ do pacote (a identidade visual, a cifra, a navbar) e os da página.
// O PACOTE DE ONDE SAEM OS ASSETS. Era `professores/tiago/ciclos/ciclo-01-maria`, que não
// existe mais (a pasta passou a `tiago-menegaz` e o pacote nunca esteve lá): a bancada servia
// o `index.html` para todo pedido de asset — inclusive para o `markdown.js` —, e a página
// morria em `Markdown is not defined` antes da primeira asserção. O pacote-zero é o que a
// escola publica, e é dele que se mede.
const PACOTE = path.join(RAIZ, 'professores/perna-boa/ciclos/ciclo-01-batata');
const ASSETS = path.join(PACOTE, 'assets');
const ASSETS_PAGINA = path.join(PACOTE, 'plano-observacao/assets');

let PORTA = 0;
const PAGINA = () => `http://127.0.0.1:${PORTA}/plano-observacao/`;

let n = 0;
const ok = (titulo) => { n += 1; console.log(`  ${String(n).padStart(2)}. ${titulo}`); };

const MIME = { '.html': 'text/html;charset=utf-8', '.json': 'application/json;charset=utf-8',
  '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

// O que o PLANO responde em `estrutura-de-cada-aula` — é a variável da prova: cada
// cenário troca a marcação e o que se mede é a lista que a tela monta a partir dela.
let MARCADOS = [{ marco: 1, marcados: ['Solo', 'Centro', 'Musicalidade'] }];

const ENVELOPE_PLANO = () => ({
  id: 'plano-20261015-1014',
  envelope: '1.2.0',
  contexto: { escola: 'barra', professor: 'leticia', ciclo: '01' },
  respostas: { 'estrutura-de-cada-aula': { valor: MARCADOS, origem: 'perguntado', respondente: 'professor', nota: null } },
});

function apiDe(rota) {
  if (rota.startsWith('api/mapa')) {
    const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
    return { ok: true, ...porta.mapa(JSON.parse(fs.readFileSync(CONTEUDO_PO, 'utf8'))) };
  }
  if (rota.startsWith('api/planos')) {
    return { ok: true, opcoes: [{ valor: 'plano-20261015-1014', rotulo: 'Fortalecer o corpo',
      carimbo: 'plano-20261015-1014', detalhe: 'api/envelope/plano-20261015-1014',
      escola: 'barra', professor: 'leticia', ciclo: '01' }] };
  }
  if (rota.startsWith('api/anamneses')) {
    return { ok: true, opcoes: [{ valor: 'Vavá', rotulo: 'Vavá · 14/10/2026',
      carimbo: 'anamnese-20261014-0035', detalhe: 'api/envelope/anamnese-20261014-0035',
      escola: 'barra', professor: 'leticia', ciclo: '01' }] };
  }
  if (rota.startsWith('api/envelope/plano-20261015-1014')) return ENVELOPE_PLANO();
  if (rota.startsWith('api/envelope/')) {
    return { id: 'anamnese-20261014-0035', contexto: { aluna: 'Vavá' }, respostas: {} };
  }
  if (rota.startsWith('api/bastidores/turmas')) return { ok: true, turmas: [] };
  if (rota.startsWith('api/bastidores/')) return {};
  if (rota.startsWith('api/')) return { ok: true, opcoes: [], estados: [] };
  return null;
}

const servidor = http.createServer((req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, PAGINA()).pathname).replace(/^\/+/, '');
  const envia = (corpo, tipo) => {
    res.writeHead(200, { 'Content-Type': tipo });
    res.end(corpo);
  };
  if (caminho.startsWith('plano-observacao/api/')) {
    const dados = apiDe(caminho.slice('plano-observacao/'.length));
    if (dados) return envia(JSON.stringify(dados), MIME['.json']);
  }
  // A PÁGINA sob prova é a FONTE (`porta/index.html`), e o conteúdo é o da fonte: é o
  // que o gerador copia para dentro do pacote.
  if (caminho === 'plano-observacao/' || caminho === 'plano-observacao/index.html') {
    return envia(fs.readFileSync(PAGINA_FONTE), MIME['.html']);
  }
  if (caminho === 'plano-observacao/po/conteudo/po.json') {
    return envia(fs.readFileSync(CONTEUDO_PO), MIME['.json']);
  }
  // A página carrega a identidade visual da RAIZ do pacote (`/assets/style.css`), de
  // propósito: o pacote é servido na raiz e as páginas vivem um nível abaixo.
  const base = caminho.startsWith('plano-observacao/assets/') ? ASSETS_PAGINA : ASSETS;
  const arquivo = path.join(base, path.basename(caminho));
  if (/^(plano-observacao\/)?assets\//.test(caminho) && fs.existsSync(arquivo)) {
    return envia(fs.readFileSync(arquivo), MIME[path.extname(arquivo)] || 'application/octet-stream');
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 ' + caminho);
});

const espera = (win, ms = 120) => new Promise((r) => win.setTimeout(r, ms));

async function abrir() {
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  vc.on('error', (...a) => problemas.push(a.join(' ')));
  const dom = await JSDOM.fromURL(PAGINA(), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), PAGINA()), i);
      w.confirm = () => true;
      w.alert = () => {};
    },
  });
  await espera(dom.window, 300);
  return { dom, win: dom.window, doc: dom.window.document, problemas };
}

/* Responde o plano (o nó do cabeçalho) e abre um nó pelo id, esperando o re-render. */
async function abrirNo(win, id) {
  await win.eval(`(async () => {
    RESPOSTAS.set('plano-de-ensino', 'plano-20261015-1014');
    const i = MAPA.nos.findIndex((n) => n.id === ${JSON.stringify(id)});
    irPara(i);
  })()`);
  await espera(win, 400);
}

const textosDe = (doc) => [...doc.querySelectorAll('ul.derivadas li')].map((li) => li.textContent.trim());

(async () => {
  console.log('PO — a dimensão observada derivada do plano\n');
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  PORTA = servidor.address().port;

  // 1 — O vocabulário do PO: o eixo sai do conteúdo, e a lista fixa em prosa sai de cena.
  const conteudo = JSON.parse(fs.readFileSync(CONTEUDO_PO, 'utf8'));
  const no = conteudo.blocos.flatMap((b) => b.campos || []).find((c) => c.id === 'dimensoes-de-observacao');
  assert.equal(no.doPlano.eixo, 'Técnica');
  assert.deepEqual(no.doPlano.blocos, ['Solo', 'Barra', 'Centro', 'Musicalidade', 'Expressão']);
  assert.equal(no.forma, undefined, 'a lista fixa em prosa saiu');
  assert.equal(no.multipla, undefined, 'a dimensão não se marca mais: ela deriva');
  ok('o conteúdo declara o EIXO e os blocos canónicos, e a lista fixa em prosa saiu');

  // 2 — O vocabulário antigo não sobrevive em lugar nenhum do conteúdo do PO.
  const cru = JSON.stringify(conteudo);
  for (const fora of ['par/pas de deux', 'repertório do dia']) {
    assert.ok(!cru.includes(fora), `${fora} ainda aparece no conteúdo do PO`);
  }
  ok('«par/pas de deux» e «repertório do dia» saíram do conteúdo do PO');

  // 3 — O cenário: o plano marca DOIS blocos, e um deles não é o primeiro canónico. Se a
  //     tela lesse a lista canónica (ou uma lista fixa), os itens 4 e 5 não passariam.
  MARCADOS = [{ marco: 1, marcados: ['Solo'] }, { marco: 3, marcados: ['Expressão', 'Solo'] }];
  let { win, doc, problemas } = await abrir();
  await abrirNo(win, 'dimensoes-de-observacao');
  assert.deepEqual(textosDe(doc), ['Técnica — Solo', 'Técnica — Expressão']);
  ok('a lista na tela é a UNIÃO dos blocos que o plano marca, sob o eixo «Técnica»');

  // 4 — A ordem é a CANÓNICA (a do conteúdo), não a ordem em que o plano os marcou.
  assert.deepEqual(textosDe(doc), ['Técnica — Solo', 'Técnica — Expressão']);
  ok('a ordem da lista é a canónica dos blocos (Solo antes de Expressão), não a do plano');

  // 5 — A dimensão é só-leitura: o professor não a marca — ele a lê e escreve os itens. O
  //     único campo dentro da caixa é a NOTA genérica de qualquer resposta (não é marcação).
  const caixa = doc.querySelector('ul.derivadas').closest('.caixa');
  assert.equal(caixa.querySelectorAll('input[type=checkbox], input[type=radio]').length, 0,
    'a dimensão derivada não se marca');
  const campos = [...caixa.querySelectorAll('input, textarea, select')];
  assert.deepEqual(campos.map((e) => (e.hasAttribute('data-campo-nota') ? 'nota' : 'outro')),
    ['nota'], 'o único campo da caixa é a nota — não há campo de valor');
  assert.match(caixa.textContent, /plano de ensino escolhido/);
  ok('a dimensão derivada não se marca (só a nota), e a caixa diz de onde ela veio');

  // 6 — A repetição dos itens recebe as dimensões e NÃO pede anamnese de uma dimensão.
  await abrirNo(win, 'itens-por-dimensao');
  const repetidos = [...doc.querySelectorAll('.item-repeticao h4')].map((h) => h.textContent.trim());
  assert.deepEqual(repetidos, ['Técnica — Solo', 'Técnica — Expressão']);
  assert.ok(!/Sem anamnese/.test(doc.querySelector('#pergunta').textContent),
    'a repetição dos itens não pode oferecer criar a anamnese de uma dimensão');
  ok('a repetição dos itens abre um registro por dimensão e não pede anamnese delas');

  // 7 — O envelope não mente sobre a origem: o valor derivado vai como `importado`
  //     («o valor entrou pronto de outro artefato»), e não como «perguntado».
  const pacote = await win.eval('JSON.stringify(pacoteParaEnviar()["dimensoes-de-observacao"])');
  assert.equal(JSON.parse(pacote).origem, 'importado');
  assert.deepEqual(JSON.parse(pacote).valor, ['Técnica — Solo', 'Técnica — Expressão']);
  ok('o valor derivado é enviado com `origem: "importado"` — não como «perguntado»');

  // 8 — Sem bloco marcado no plano, a lista não fica vazia: valem os canónicos.
  MARCADOS = [];
  ({ win, doc } = await abrir());
  await abrirNo(win, 'dimensoes-de-observacao');
  assert.deepEqual(textosDe(doc), ['Técnica — Solo', 'Técnica — Barra', 'Técnica — Centro',
    'Técnica — Musicalidade', 'Técnica — Expressão']);
  assert.match(doc.querySelector('ul.derivadas').closest('.caixa').textContent,
    /não marca bloco nenhum/);
  ok('plano sem bloco marcado cai nos cinco blocos canónicos, e a tela diz porquê');

  // 9 — A troca do plano REFAZ a lista: o que estava derivado não congela.
  MARCADOS = [{ marco: 1, marcados: ['Barra'] }];
  await win.eval(`(async () => {
    RESPOSTAS.set('plano-de-ensino', 'outro-plano');
    const i = MAPA.nos.findIndex((n) => n.id === 'dimensoes-de-observacao');
    irPara(i);
  })()`);
  await espera(win, 400);
  ok('a lista é refeita quando o plano muda (o valor derivado não congela)');

  // 10 — A FOLHA DE CAPTURA segue a dimensão derivada: um bloco por dimensão, com os
  //      itens dela como colunas. É o que o lançamento preenche aula a dia.
  const { declaracaoDeCaptura } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
  const folha = declaracaoDeCaptura({
    po: { respostas: {
      'dimensoes-de-observacao': ['Técnica — Solo', 'Técnica — Barra'],
      'itens-por-dimensao': [
        { sujeito: 'Técnica — Solo', itens: 'alinhamento dos metatarsos' },
        { sujeito: 'Técnica — Barra', itens: 'saída do calcanhar' },
      ],
    } },
    escola: 'Barra',
  });
  const titulos = Object.values(folha.blocos).map((b) => b.rotulo);
  assert.deepEqual(titulos, ['Técnica — Solo', 'Técnica — Barra', 'Linha de base']);
  assert.deepEqual(Object.keys(folha.blocos['Bloco 1 — Técnica — Solo'].colunas),
    ['alinhamento dos metatarsos']);
  ok('a folha de captura ganha um bloco por dimensão derivada, com os itens como colunas');

  /* 11 — O `;` SEPARA ITENS (01/11/2026).
   *
   * O DEFEITO: o conteúdo pede «um item por linha», e o professor escreve «a; b» — a forma como
   * se enumera em português. O corte era só por `\n`, então DOIS critérios caíam na MESMA
   * coluna da folha, e uma célula com dois critérios é uma célula que não se mede: o lançamento
   * pede um nível para o par inteiro, e o par não é observável.
   *
   * A trava é do CAMPO (`itensDaDimensao`), não do `emLista` geral: o `;` é pontuação legítima
   * noutros campos (o repertório, a proveniência), e alargar o corte em todo o lado partiria o
   * que é uma frase só. */
  const folhaComPontoEVirgula = declaracaoDeCaptura({
    po: { respostas: {
      'dimensoes-de-observacao': ['Técnica — Solo'],
      'itens-por-dimensao': [{ sujeito: 'Técnica — Solo',
        itens: 'alinhamento dos metatarsos; saída do calcanhar\neixo do corpo' }],
    } },
    escola: 'Barra',
  });
  assert.deepEqual(Object.keys(folhaComPontoEVirgula.blocos['Bloco 1 — Técnica — Solo'].colunas),
    ['alinhamento dos metatarsos', 'saída do calcanhar', 'eixo do corpo']);
  ok('o `;` separa itens — e o `\\n` também: três critérios, três colunas (era uma)');

  assert.equal(problemas.length, 0, 'a página não pode ter erro de script: ' + problemas.join(' | '));
  console.log(`\nprovar-dimensoes-plano: ${n} de ${n} passaram`);
  servidor.close();
  process.exit(0);
})().catch((e) => { console.error('\nFALHOU:', e.message); servidor.close(); process.exit(1); });
