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
    provar('há 4 blocos de dimensão (as 4 bandas da janela)', blocos.length === 4, blocos.length);
    const colunas = blocos.flatMap((b) => (b.colunas || []).map((c) => c.rotulo));
    provar('as colunas são os 8 critérios, um por um', colunas.length === 8, colunas);
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
    provar('a tela desenha 8 campos de critério (1 aluna × 8 critérios)', campos.length === 8,
      campos.map((c) => c.id));
    const porBloco = {};
    for (const c of campos) porBloco[c.bloco] = (porBloco[c.bloco] || 0) + 1;
    provar('…dois por banda, e não um', JSON.stringify(porBloco) ===
      JSON.stringify({ tecnica_solo: 2, tecnica_barra: 2, tecnica_centro: 2, tecnica_musicalidade: 2 }),
      porBloco);
    const rotulos = Array.from(doc.querySelectorAll('#captura-campos table.captura th'))
      .map((th) => th.textContent.trim());
    provar('…e cada cabeçalho nomeia UM critério',
      ['alinhamento do pé de apoio', 'eixo do corpo na preparação',
        'saída do calcanhar no tendu', 'quadril sem subir no en dehors',
        'transferência de peso sem perder a verticalidade', 'braço junto do movimento',
        'resposta ao pulso na marcação', 'frase até o fim da música'].every((c) => rotulos.includes(c)),
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
      provar('com os dois critérios numa coluna, os campos caem para 4', camposAntigos.length === 4,
        camposAntigos.map((c) => c.id));
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
