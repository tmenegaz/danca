#!/usr/bin/env node
'use strict';

/**
 * provar-uma-regua-so.js — a folha de lançamento mede por UMA régua, e é a da turma.
 *
 * O DEFEITO, nas palavras dela (22/11/2026):
 *
 *   «quando são lançadas as aulas no formulário que lança as aulas. Nós temos duas matrizes, está
 *    errado isso. A régua da turma é só uma, não pode ser duas, não pode ser duas matrizes para
 *    essa régua. Então a parte do corpo eu acho que está com uma régua que ela está chumbada no
 *    código. Ela é OK, parcial, não aconteceu e não vi. Está errado isso. Tem que ser a régua que
 *    foi definida lá pelo professor em bastidores, aquela régua de lá que funciona.»
 *
 * O QUE ESTAVA ACONTECENDO. Os blocos de critério da folha mediam-se pela RÉGUA da turma
 * (`rubrica`), e a matriz do corpo — a «linha de base revisitada» — media-se pelas cinco marcas
 * escritas no template (`ok / parcial / nao / nao_vi`). Na tela eram DUAS legendas: «Régua desta
 * turma: Satisfatório · Razoável · …» e «Marcas: ✓ aconteceu · ~ parcial · X não aconteceu · ?
 * não vi». Duas escalas para os critérios da mesma aula.
 *
 * AS DUAS METADES DA CORREÇÃO, e as duas se medem aqui:
 *   1. A DECLARAÇÃO — `declaracaoDeCaptura` passa a declarar a coluna do corpo como `rubrica`, e o
 *      merge adopta o `tipo` derivado (conservando a `chave`, que é a identidade do dado), para os
 *      schemas já gravados deixarem de dizer `marca`.
 *   2. A PÁGINA — a folha é servida SOZINHA, de um pacote que pode ter sido gerado ontem: quando a
 *      turma declara uma régua, ela é a única escala da página, mesmo que o config ainda diga
 *      `marca`. A §4 é o controle dessa metade.
 *
 * O QUE NÃO SE PERDE. O valor gravado é uma string nos dois casos, e um valor antigo que a régua
 * já não declara continua a aparecer (opção extra no formulário, `nivel-fora` na leitura). Um ciclo
 * que nunca declarou régua fica como estava — a §3 mede-o: sem régua declarada não se inventa
 * escala.
 *
 *   node experimentos/provar-uma-regua-so.js
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.join(__dirname, '..');
const PACOTE = path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa');
const AULA = '01';

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 300)));
}

const MIME = { '.html': 'text/html;charset=utf-8', '.json': 'application/json;charset=utf-8',
  '.css': 'text/css', '.js': 'text/javascript' };

/** O que a prova troca em memória — os controles negativos servem outra versão do mesmo ficheiro. */
const trocas = new Map();

function servir() {
  const srv = http.createServer((req, res) => {
    const alvo = decodeURIComponent(new URL(req.url, 'http://local').pathname).replace(/^\/+/, '');
    const corpo = trocas.has(alvo) ? trocas.get(alvo) : null;
    const arquivo = path.join(PACOTE, alvo);
    const serve = corpo !== null ? Buffer.from(corpo)
      : (arquivo.startsWith(PACOTE) && fs.existsSync(arquivo) && fs.statSync(arquivo).isFile()
        ? fs.readFileSync(arquivo) : null);
    if (!serve) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404 ' + alvo); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(alvo)] || 'application/octet-stream' });
    res.end(serve);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () =>
    pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port + '/lancamento.html' })));
}

const espera = (win, ms = 300) => new Promise((r) => win.setTimeout(r, ms));

async function abrir(base) {
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  const dom = await JSDOM.fromURL(base, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), base), i);
      w.confirm = () => true;
      w.alert = () => {};
      w.addEventListener('unhandledrejection', (e) => {
        problemas.push('REJEIÇÃO: ' + ((e.reason && e.reason.message) || e.reason));
      });
    },
  });
  await espera(dom.window, 700);
  const doc = dom.window.document;
  const sel = doc.getElementById('aula');
  if (sel && sel.options.length > 1) {
    sel.value = sel.options[1].value;
    sel.dispatchEvent(new dom.window.Event('change'));
    await espera(dom.window, 900);
  }
  return { dom, win: dom.window, doc, problemas };
}

/** Os campos da matriz do corpo, desenhados: id e as opções que o `<select>` oferece. */
const corpoDesenhado = (doc) => Array.from(doc.querySelectorAll('[id^="lb-"]'))
  .map((el) => ({ id: el.id, tag: el.tagName,
    opcoes: el.options ? Array.from(el.options).map((o) => o.text.trim()) : [] }));

/** As legendas que a página DESENHOU (não as que vivem no texto do script). */
const legendas = (doc) => Array.from(doc.querySelectorAll('p.fraco'))
  .map((e) => e.textContent.replace(/\s+/g, ' ').trim())
  .filter((t) => /Marcas:|Critério:/.test(t));

const MARCA_DA_FOLHA = ['✓ ok', '~ parcial', 'X não aconteceu', '? não vi'];

(async () => {
  /* ---------------------------------------------------------------------------------------- */
  console.log('\n1. A DECLARAÇÃO — a coluna do corpo nasce pela régua');
  /* ---------------------------------------------------------------------------------------- */
  const { declaracaoDeCaptura, mesclarDeclaracao } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
  const derivada = declaracaoDeCaptura({ po: {}, plano: {}, escola: 'Teste' });
  const bloco = derivada.blocos['Linha de base revisitada'];
  provar('o bloco do corpo existe na declaração', !!bloco, Object.keys(derivada.blocos));
  const coluna = bloco && bloco.colunas['Observado na aula'];
  provar('…e a coluna do corpo é medidade pela RÉGUA, e não pelas cinco marcas',
    !!coluna && coluna.tipo === 'rubrica', coluna);

  /* O MERGE — o caminho que faz a correção chegar aos schemas já gravados. A `chave` é a
   * identidade do dado e não pode mudar; o `tipo` é o modo de leitura, e é da derivação. */
  const antiga = { escola: 'Teste', blocos: {
    'Linha de base revisitada': Object.assign({}, bloco, {
      colunas: { 'Observado na aula': { chave: 'observado_na_aula', tipo: 'marca' } },
    }),
  } };
  const fundida = mesclarDeclaracao(antiga, derivada).blocos['Linha de base revisitada'].colunas['Observado na aula'];
  provar('o merge CONSERVA a chave gravada (o dado não muda de sítio)',
    fundida.chave === 'observado_na_aula', fundida);
  provar('…e adopta o tipo da derivação — o schema antigo deixa de dizer «marca»',
    fundida.tipo === 'rubrica', fundida);

  /* ---------------------------------------------------------------------------------------- */
  console.log('\n2. A TELA — o corpo mede-se pelos níveis da turma, e há UMA legenda');
  /* ---------------------------------------------------------------------------------------- */
  const plano = JSON.parse(fs.readFileSync(path.join(PACOTE, 'plano-' + AULA + '.json'), 'utf8'));
  const regua = (plano.reguaDaRubrica || []).filter((x) => typeof x === 'string' && x.trim());
  provar('o plano do ciclo DECLARA a régua (é dela que a página vive)', regua.length > 0, plano.reguaDaRubrica);

  const config = JSON.parse(fs.readFileSync(path.join(PACOTE, 'captura-aula-' + AULA + '.json'), 'utf8'));
  const { srv, base } = await servir();
  let aberto = null;
  try {
    aberto = await abrir(base);
    provar('a página abre sem erro de script', aberto.problemas.length === 0, aberto.problemas.slice(0, 2));
    const corpo = corpoDesenhado(aberto.doc);
    provar('a matriz do corpo está desenhada', corpo.length > 0, corpo.length);
    provar('cada campo do corpo oferece os NÍVEIS DA RÉGUA da turma',
      corpo.length > 0 && corpo.every((c) => regua.every((n) => c.opcoes.includes(n))),
      { regua, primeira: corpo[0] && corpo[0].opcoes });
    provar('…e nenhum oferece as cinco marcas chumbadas',
      corpo.every((c) => MARCA_DA_FOLHA.every((m) => !c.opcoes.includes(m))),
      corpo.map((c) => c.opcoes).slice(0, 2));

    const linhas = legendas(aberto.doc);
    provar('a legenda da página nomeia a RÉGUA da turma', linhas.some((t) => /RÉGUA desta turma/.test(t)), linhas);
    provar('…e NÃO há uma segunda legenda a explicar marcas — uma folha, uma régua',
      !linhas.some((t) => /^Marcas:/.test(t)), linhas);

    /* -------------------------------------------------------------------------------------- */
    console.log('\n3. CONTROLE — um CICLO ANTIGO (folha inteira em marcas) fica como estava');
    /* -------------------------------------------------------------------------------------- */
    /* A correção não reescreve o passado. Um ciclo cuja folha nunca declarou régua mede-se pelas
     * marcas que ela declara — e a página diz UMA coisa só. Sem isto, a «correção» teria mudado a
     * escala de ciclos que já estavam lançados, sem ninguém o ter pedido. */
    const velhoDeTudo = JSON.parse(JSON.stringify(config));
    velhoDeTudo.blocos.forEach((b) => {
      (b.colunas || []).forEach((c) => { c.tipo = 'marca'; });
    });
    trocas.set('plano-' + AULA + '.json', JSON.stringify(Object.assign({}, plano, { reguaDaRubrica: [] })));
    trocas.set('captura-aula-' + AULA + '.json', JSON.stringify(velhoDeTudo));
    const antigo = await abrir(base);
    const corpoAntigo = corpoDesenhado(antigo.doc);
    provar('a folha antiga mede o corpo pelas marcas que ela declara',
      corpoAntigo.length > 0 && corpoAntigo.every((c) => MARCA_DA_FOLHA.every((m) => c.opcoes.includes(m))),
      corpoAntigo[0] && corpoAntigo[0].opcoes);
    provar('…e a legenda é UMA — a das marcas, sem uma régua que ninguém declarou',
      legendas(antigo.doc).some((t) => /^Marcas:/.test(t))
        && !legendas(antigo.doc).some((t) => /RÉGUA desta turma/.test(t)),
      legendas(antigo.doc));
    trocas.delete('plano-' + AULA + '.json');
    trocas.delete('captura-aula-' + AULA + '.json');

    /* A PÁGINA NÃO MISTURA DUAS ESCALAS: se os critérios se medem pela régua, o corpo mede-se
     * pela MESMA — inclusive quando a régua é a de recurso (o plano não a declara). Um ciclo que
     * declare critérios pela régua e um corpo pelas marcas é exactamente a mistura que ela
     * recusou, e é este o caso que a mede. */
    trocas.set('plano-' + AULA + '.json', JSON.stringify(Object.assign({}, plano, { reguaDaRubrica: [] })));
    const semDeclarada = await abrir(base);
    const corpoSem = corpoDesenhado(semDeclarada.doc);
    const { NIVEIS_DA_RUBRICA } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));
    provar('sem régua declarada, o corpo usa a MESMA escala de recurso dos critérios',
      corpoSem.length > 0 && corpoSem.every((c) => NIVEIS_DA_RUBRICA.every((n) => c.opcoes.includes(n)))
        && corpoSem.every((c) => MARCA_DA_FOLHA.every((m) => !c.opcoes.includes(m))),
      { esperado: NIVEIS_DA_RUBRICA, primeira: corpoSem[0] && corpoSem[0].opcoes });
    provar('…e continua a haver uma só legenda na página',
      !legendas(semDeclarada.doc).some((t) => /^Marcas:/.test(t)), legendas(semDeclarada.doc));
    trocas.delete('plano-' + AULA + '.json');

    /* -------------------------------------------------------------------------------------- */
    console.log('\n4. CONTROLE — um PACOTE ANTIGO (config com «marca») continua a medir-se pela régua');
    /* -------------------------------------------------------------------------------------- */
    /* Esta é a metade da página, e a razão de ela existir: o config do pacote pode ter sido
     * gerado antes desta correção, e o professor veria as duas réguas outra vez. Com a turma a
     * declarar régua, é ela que mede — o config velho não reabre o defeito. */
    const velho = JSON.parse(JSON.stringify(config));
    velho.blocos.forEach((b) => {
      if (b.chave === 'linha_de_base') (b.colunas || []).forEach((c) => { c.tipo = 'marca'; });
    });
    trocas.set('captura-aula-' + AULA + '.json', JSON.stringify(velho));
    const pacoteVelho = await abrir(base);
    const corpoVelho = corpoDesenhado(pacoteVelho.doc);
    provar('com o config a dizer «marca» e a turma a declarar régua, mede-se pela régua',
      corpoVelho.length > 0 && corpoVelho.every((c) => regua.every((n) => c.opcoes.includes(n)))
        && corpoVelho.every((c) => MARCA_DA_FOLHA.every((m) => !c.opcoes.includes(m))),
      corpoVelho[0] && corpoVelho[0].opcoes);
    provar('…e continua a haver uma só legenda',
      !legendas(pacoteVelho.doc).some((t) => /^Marcas:/.test(t)), legendas(pacoteVelho.doc));
    trocas.delete('captura-aula-' + AULA + '.json');
  } finally {
    if (aberto && aberto.dom) aberto.dom.window.close();
    srv.close();
  }

  console.log('');
  if (falhas) { console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.'); process.exit(1); }
  console.log('TUDO CERTO — ' + total + ' asserções: a folha de lançamento mede o corpo pela régua da '
    + 'turma, com uma só escala e uma só legenda; um ciclo sem régua declarada não ganha escala nova; '
    + 'e um pacote antigo não reabre as duas réguas.');
})();
