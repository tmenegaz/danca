#!/usr/bin/env node
'use strict';

/**
 * provar-janela-do-lancamento.js — o formulário da coleta pergunta pela JANELA inteira.
 *
 * A FRASE, e é dela (01/11/2026):
 *
 *   «o formulário precisa ser a expressão da janela. É o que eu olho pela janela. É o que olhar
 *    através da janela me dá de resposta. Então eu não posso só olhar por uma banda da janela.
 *    Eu tenho que olhar por todas as bandas da janela.»
 *
 * O DEFEITO QUE ISTO TRAVA. O PO declara **4 dimensões** e **8 critérios** (dois por dimensão). A
 * folha de captura e o formulário de lançamento desenhavam **4 células** — uma por dimensão, com
 * os dois critérios colados num rótulo só («alinhamento do pé de apoio; eixo do corpo na
 * preparação»). O professor olhava pela janela e só podia marcar metade: um nível para o par
 * inteiro, quando o par não é observável. A banda estava lá; o critério não.
 *
 * A CAUSA era o corte dos itens (`emLista`, que corta só por `\n`), corrigida em
 * `itensDaDimensao`; o que faltava era o conserto **chegar aos três artefatos já gravados** — a
 * fonte da folha (`.md`), a declaração do schema (`_declaracao.porVariante`) e o config que o
 * formulário lê (`captura-aula-01.json`). Um conserto que fica no código e não chega ao artefato
 * não conserta nada.
 *
 * COMO É MEDIDA. A página do pacote, por HTTP de verdade (jsdom), com o config do pacote: contam-se
 * os campos de critério que a tela desenha. Não se afirma sobre o contrato — afirma-se sobre a
 * tela que o professor vê. A secção 3 corre o CONTROLE NEGATIVO: com o config antigo (os dois
 * critérios numa coluna), a tela desenha metade dos campos, e a prova falha. É isso que separa
 * «a tela lê o config» de «a tela tem 8 campos escritos na página».
 *
 *   node experimentos/provar-janela-do-lancamento.js
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.join(__dirname, '..');
/* O PACOTE É O DA ESCOLA VIVA (20/11/2026) — a `batata` foi expurgada com a escola, e o pacote
 * que esta prova abre é o do ciclo publicado da `breu`. */
const PACOTE = path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa');
const AULA = '01';

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const MIME = { '.html': 'text/html;charset=utf-8', '.json': 'application/json;charset=utf-8',
  '.css': 'text/css', '.js': 'text/javascript' };

/** O que a prova troca em memória — o controle negativo usa-o para repor o config ANTIGO. */
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

const espera = (win, ms = 200) => new Promise((r) => win.setTimeout(r, ms));

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
  await espera(dom.window, 600);
  return { dom, win: dom.window, doc: dom.window.document, problemas };
}

/** Os campos de critério que a tela desenhou, com o bloco e a coluna a que pertencem. */
/** Os campos agrupados por bloco da folha — a chave do bloco é a do id (`t-<bloco>-…`). */
const porBlocoDe = (campos) => campos.reduce((m, c) => {
  m[c.bloco] = (m[c.bloco] || 0) + 1;
  return m;
}, {});

const camposDeCriterio = (doc) => Array.from(doc.querySelectorAll('[id^="t-"]'))
  .map((el) => {
    const m = /^t-(.+?)-([^-]+)-(.+)$/.exec(el.id);
    return { id: el.id, bloco: m ? m[1] : null, aluna: m ? m[2] : null, coluna: m ? m[3] : null };
  });

(async () => {
  const { srv, base } = await servir();
  let aberto = null;
  try {
    /* 1 — O CONFIG QUE O FORMULÁRIO LÊ. É o elo final: o `.md` da folha e a declaração do schema
     * podem estar certos, e o formulário continuar a ler o JSON velho. */
    console.log('\n1. O config do pacote declara os 8 critérios, um por coluna');
    const config = JSON.parse(fs.readFileSync(path.join(PACOTE, 'captura-aula-' + AULA + '.json'), 'utf8'));
    const blocos = config.blocos.filter((b) => b.tipo === 'tabela' && b.chave !== 'linha_de_base');
    /* AS CONTAGENS SÃO AS DO PACOTE, E NÃO AS DE OUTRA ESCOLA (20/11/2026). A prova media quatro
     * bandas e oito critérios — os da `batata`, expurgada. O DEFEITO que ela trava não é o número:
     * é a coluna que junta DOIS critérios num rótulo só. O que se mede passa a ser a relação
     * (uma coluna por critério, um campo por coluna × aluna), e o número sai do próprio config. */
    provar('há blocos de dimensão (as bandas da janela)', blocos.length > 0, blocos.length);
    const colunas = blocos.flatMap((b) => (b.colunas || []).map((c) => c.rotulo));
    provar('o config declara as colunas de todas as bandas', colunas.length > blocos.length, colunas.length);
    provar('nenhuma coluna junta dois critérios com «;»',
      colunas.every((c) => !c.includes(';')), colunas.filter((c) => c.includes(';')));
    provar('cada critério tem a sua chave (é debaixo dela que a marca se guarda)',
      blocos.every((b) => b.colunas.every((c) => !!c.chave)),
      blocos.map((b) => b.colunas.map((c) => c.chave)));

    /* 2 — A TELA. O config certo com uma tela que não o lesse não serviria de nada. */
    console.log('\n2. A tela desenha um campo por critério — a janela inteira');
    aberto = await abrir(base);
    const { win, doc, problemas } = aberto;
    provar('a página abre sem erro de script', problemas.length === 0, problemas.slice(0, 3));
    const sel = doc.getElementById('aula');
    provar('o seletor de aula foi populado pelo índice', !!sel && sel.options.length > 1,
      sel && sel.options.length);
    win.eval(`sel.aula.value = ${JSON.stringify(AULA)}; renderCaptura(); render();`);
    await espera(win, 400);
    const campos = camposDeCriterio(doc);
    /* UM CAMPO POR PAR (ESPAÇO, CRITÉRIO) E POR ALUNA — e não por coluna declarada (20/11/2026).
     *
     * A CONTA ANTIGA era `colunas × alunas`, e valia enquanto cada espaço fosse um bloco só. A
     * folha pode declarar o MESMO espaço duas vezes — «Bloco 1 — Solo» com os objectivos do plano e
     * «Bloco 5 — Técnica — Solo» com os critérios —, e o formulário junta-os: o par (espaço,
     * critério) é uma pergunta só. O total passa a ser o número de PARES, que é o que a tela
     * desenha; a conta continua a sair do config, e não de um literal.
     *
     * O DEFEITO que a secção trava não mudou: é a coluna que junta DOIS critérios num rótulo só. */
    const alunas = [...new Set(campos.map((c) => c.aluna))];
    const { blocoDaDimensao } = require(path.join(RAIZ, 'motor/nucleo/eixos.js'));
    const semAcento = (t) => String(t == null ? '' : t).normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    const pares = new Set();
    for (const b of blocos) {
      const espaco = semAcento(blocoDaDimensao(b.rotulo || b.titulo || '') || b.rotulo || b.chave);
      for (const c of b.colunas) pares.add(espaco + '|' + semAcento(c.rotulo));
    }
    provar('a tela desenha um campo por par (espaço, critério) e por aluna',
      campos.length === pares.size * alunas.length,
      { campos: campos.length, pares: pares.size, alunas: alunas.length });
    provar('…e cada banda continua a ter os seus campos, e não um só',
      blocos.every((b) => (porBlocoDe(campos)[b.chave] || 0) > 0),
      { porBloco: porBlocoDe(campos) });
    const rotulos = Array.from(doc.querySelectorAll('#captura-campos table.captura th'))
      .map((th) => th.textContent.trim());
    provar('…e cada cabeçalho nomeia UM critério',
      colunas.every((c) => rotulos.includes(c)) && rotulos.every((r) => !r.includes(';')),
      rotulos);

    /* 3 — O CONTROLE NEGATIVO. Com o config ANTIGO — um rótulo com os dois critérios —, a tela
     * desenha METADE dos campos. Se ela desenhasse 8 mesmo assim, os 8 estariam escritos na
     * página, e não lidos do config. */
    console.log('\n3. CONTROLE NEGATIVO: com o config antigo, a tela desenha metade');
    const antigo = JSON.parse(JSON.stringify(config));
    for (const b of antigo.blocos) {
      if (b.tipo !== 'tabela' || b.chave === 'linha_de_base') continue;
      const rotulo = b.colunas.map((c) => c.rotulo).join('; ');
      b.colunas = [{ rotulo, chave: b.colunas.map((c) => c.chave).join('_e_'), tipo: b.colunas[0].tipo }];
    }
    trocas.set('captura-aula-' + AULA + '.json', JSON.stringify(antigo));
    const negativo = await abrir(base);
    try {
      negativo.win.eval(`sel.aula.value = ${JSON.stringify(AULA)}; renderCaptura(); render();`);
      await espera(negativo.win, 400);
      const camposAntigos = camposDeCriterio(negativo.doc);
      /* UMA COLUNA POR BANDA ⇒ UM CAMPO POR BANDA. É a descida que prova que os campos são
       * LIDOS do config: a tela não os traz escritos na página. */
      provar('com os critérios todos numa coluna, os campos caem para um por banda',
        camposAntigos.length === blocos.length * alunas.length,
        { campos: camposAntigos.length, esperado: blocos.length * alunas.length });
      provar('…e é a tela a dizer, não uma lista escrita na página',
        camposAntigos.length !== campos.length, { comConfigNovo: campos.length, comConfigAntigo: camposAntigos.length });
    } finally {
      negativo.dom.window.close();
    }
  } finally {
    if (aberto) aberto.dom.window.close();
    srv.close();
  }

  console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ')
    + total + ' asserção(ões), ' + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
