#!/usr/bin/env node
'use strict';

/**
 * provar-paginacao.js — as listas da Produção folheiam de verdade (17/10/2026).
 *
 * O DEFEITO. O dono do produto reparou nas Turmas e no Vocabulário: o rodapé dizia «1 / 3» e
 * nenhum clique o mudava. As duas listas eram as únicas com tamanho suficiente para paginar,
 * e foi por isso que só elas apareceram — mas a paginação da Produção é UMA implementação
 * partilhada pelas SETE listas, e estava quebrada em todas.
 *
 * A causa, numa linha:
 *
 *     var passos = b.className === "pag-prox" ? 1 : -1;
 *
 * O `className` de um elemento é o atributo `class` INTEIRO, e os botões nascem com
 * `class="pag-prox acao secundario pequena"`. A comparação era sempre falsa, os dois botões
 * valiam -1, e como o `paginar()` trava a página em `[1, N]`, a página 1 era o fim da linha:
 * «›» recuava para 1, «‹» recuava para 1, e o número nunca subia.
 *
 * O que passou despercebido foi a FORMA do erro: o botão ganhou as classes de estilo e a
 * comparação nasceu a exigir que ele tivesse UMA. Por isso a correcção é `classList.contains`
 * — que sobrevive a uma classe a mais, e é o que a próxima pessoa não vai quebrar sem reparar.
 *
 * PORQUE ESTA PROVA NÃO É DE CONTRATO. A pergunta é «o clique move a lista?» — e isso só se
 * responde com um DOM e um clique a sério. A prova monta a página da Produção pelo caminho
 * verdadeiro (`bastidores.fetch`, com um KV em memória), carrega o HTML no jsdom, CARREGA os
 * scripts e CLICA nos botões. Um teste que chamasse o `paginar()` directamente passaria com
 * o defeito lá dentro — foi exactamente assim que ele passou até hoje.
 *
 *   uso: npm install --no-save jsdom && node experimentos/provar-paginacao.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let JSDOM;
let VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = require('jsdom'));
} catch (e) {
  console.error('falta o jsdom: npm install --no-save jsdom');
  process.exit(2);
}

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  \u2713 ' + rotulo); return; }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'danca';
const CHAVE = (nome) => 'bastidores/' + ESCOLA + '/' + nome;

/** O KV dos Bastidores é `get`/`put` — não o `ler`/`guardar` do núcleo. */
function kvEmMemoria(mapa) {
  const guardado = Object.assign(Object.create(null), mapa);
  return {
    async get(k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
    async put(k, v) { guardado[k] = String(v); },
    async delete(k) { delete guardado[k]; },
    _guardado: guardado,
  };
}

/** As sete listas com `quantos` itens cada — os nomes que a página mostra em cada `<h3>`. */
const LISTAS = [
  // A ALUNA é o APELIDO em texto — a lista é de strings, não de objectos (`esc(a)` na
  // página). Semear objectos aqui dava quinze linhas a dizer `[object Object]`: o teste
  // passaria a provar a paginação de quinze linhas iguais, que é provar nada.
  { titulo: 'Professores cadastrados', chave: 'professores', itens: (i) => ({ id: 'p' + i, nome: 'Professor ' + i, slug: 'professor-' + i }) },
  { titulo: 'Alunas cadastradas', chave: 'alunas', itens: (i) => 'Aluna ' + i },
  { titulo: 'Turmas cadastradas', chave: 'turmas', itens: (i) => ({ id: 't' + i, nome: 'Turma ' + i, modalidade: 'Balé clássico' }) },
  { titulo: 'Rubricas criadas', chave: 'rubricas', itens: (i) => ({ id: 'r' + i, nome: 'Rubrica ' + i, niveis: [] }) },
  { titulo: 'Com que régua cada turma é medida', chave: 'turma-conteudos', itens: null },
  // O TERMO chama-se `termo` (não `nome`): é o campo que a página imprime.
  { titulo: 'Termos cadastrados', chave: 'vocabulario', itens: (i) => ({ id: 'v' + i, termo: 'Termo ' + i }) },
  { titulo: 'Curadorias atribuídas', chave: 'curadorias', itens: (i) => ({ id: 'c' + i, professor: 'Professor ' + i, modalidade: 'Balé clássico', turma: 'Turma ' + i }) },
];

/** Monta o mapa do KV com `quantos` itens em cada lista. `turma-conteudos` é um MAPA. */
function semear(quantos) {
  const mapa = {};
  for (const l of LISTAS) {
    if (l.chave === 'turma-conteudos') {
      const mapaDeVinculos = {};
      for (let i = 1; i <= quantos; i += 1) mapaDeVinculos['t' + i] = ['v' + i];
      mapa[CHAVE(l.chave)] = JSON.stringify(mapaDeVinculos);
    } else {
      const lista = [];
      for (let i = 1; i <= quantos; i += 1) lista.push(l.itens(i));
      mapa[CHAVE(l.chave)] = JSON.stringify(lista);
    }
  }
  return mapa;
}

async function abrirProducao(quantos) {
  const kv = kvEmMemoria(semear(quantos));
  const res = await bastidores.fetch(
    new Request('https://prova.test/bastidores/producao'),
    { ESCOLA_SLUG: ESCOLA, PADD_KV: kv, PROFESSOR_NOME: 'Tiago Menegaz' }
  );
  const html = await res.text();
  const erros = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) erros.push(e.message); });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    virtualConsole: vc,
    url: 'https://prova.test/bastidores/producao',
  });
  return { dom, doc: dom.window.document, erros, html };
}

/** O painel de uma lista, pelo título — é como o professor o encontra. */
function painelDe(doc, titulo) {
  return Array.from(doc.querySelectorAll('[data-paginar]'))
    .find((p) => {
      const h = p.querySelector('h3');
      return h && String(h.textContent).trim() === titulo;
    }) || null;
}

function visiveis(painel) {
  const ul = painel.querySelector('ul');
  return Array.from(ul.children).filter((li) => !li.hidden);
}

function textoDaPagina(painel) {
  const info = painel.querySelector('.pag-info');
  return info ? String(info.textContent).trim() : '(sem .pag-info)';
}

/** O texto de cada linha visível — para provar que nenhuma se perde nem se repete. */
function linhasVisiveis(painel) {
  return visiveis(painel).map((li) => String(li.textContent).replace(/\s+/g, ' ').trim());
}

(async () => {
  // -------------------------------------------------------------------------
  console.log('\n1. As SETE listas da Produção folheiam (15 itens, 7 por página)');
  // -------------------------------------------------------------------------
  const { doc, erros } = await abrirProducao(15);

  checar('a página carrega sem erro de script', erros.length === 0, erros);

  const paineis = doc.querySelectorAll('[data-paginar]');
  checar('há SETE listas pagináveis (a implementação é uma só)', paineis.length === 7, paineis.length);

  for (const lista of LISTAS) {
    const painel = painelDe(doc, lista.titulo);
    checar('[' + lista.titulo + '] o painel existe', Boolean(painel));
    if (!painel) continue;

    // A CONTAGEM VEM DO DOM, não do que foi semeado. Os Professores ganham SEMPRE o dono
    // à frente (a linha «criado na página»), e uma prova que fixasse 15 estaria a medir o
    // seed em vez de medir a página.
    const ul = painel.querySelector('ul');
    const total = ul.children.length;
    const porPagina = parseInt(painel.getAttribute('data-por-pagina') || '10', 10);
    const paginas = Math.max(1, Math.ceil(total / porPagina));
    const ultima = total - porPagina * (paginas - 1);

    const rodape = painel.querySelector('.paginacao');
    checar('  o rodapé aparece com mais de uma página',
      Boolean(rodape) && rodape.hidden === false, rodape && rodape.hidden);
    checar('  diz «1 / ' + paginas + '»', textoDaPagina(painel) === '1 / ' + paginas, textoDaPagina(painel));
    checar('  a página 1 mostra ' + Math.min(porPagina, total) + ' itens',
      visiveis(painel).length === Math.min(porPagina, total), visiveis(painel).length);

    const pagina1 = linhasVisiveis(painel);
    checar('  a página 1 começa no primeiro item',
      ul.children[0].hidden === false, ul.children[0].hidden);
    checar('  o ' + (porPagina + 1) + '.º item NÃO está na página 1',
      ul.children[porPagina].hidden === true, ul.children[porPagina].hidden);

    const prox = painel.querySelector('.pag-prox');
    const ant = painel.querySelector('.pag-ant');
    checar('  o «‹» nasce desabilitado na primeira página', ant.disabled === true, ant.disabled);
    checar('  o «›» nasce habilitado', prox.disabled === false, prox.disabled);

    // O CLIQUE — o gesto que não funcionava.
    prox.click();
    checar('  «›» leva à página 2', textoDaPagina(painel) === '2 / ' + paginas, textoDaPagina(painel));
    checar('  a página 2 mostra ' + porPagina + ' itens', visiveis(painel).length === porPagina, visiveis(painel).length);
    checar('  e são OUTROS itens (a página mudou mesmo)',
      JSON.stringify(linhasVisiveis(painel)) !== JSON.stringify(pagina1),
      [pagina1.slice(0, 1), linhasVisiveis(painel).slice(0, 1)]);
    checar('  o «‹» fica habilitado na página 2', ant.disabled === false, ant.disabled);

    // Salta até à última página — com TETO de cliques. Sem teto, o próprio defeito que
    // esta prova existe para apanhar a fazia NUNCA TERMINAR: com `passos` sempre -1, o
    // «›» fica eternamente habilitado e a página nunca chega à última. Uma prova que
    // trava em vez de falhar é uma prova que esconde o resultado.
    for (let salto = 0; salto < paginas && !prox.disabled; salto += 1) prox.click();
    checar('  «›» chega à última página', textoDaPagina(painel) === paginas + ' / ' + paginas, textoDaPagina(painel));
    checar('  a última página mostra o que sobra (' + ultima + ')', visiveis(painel).length === ultima, visiveis(painel).length);
    checar('  o «›» fica desabilitado na última página', prox.disabled === true, prox.disabled);

    // O ÚLTIMO clique de todos: o botão está desabilitado, logo não há evento. A página não
    // pode sair da faixa.
    prox.click();
    checar('  «›» na última página não sai da faixa',
      textoDaPagina(painel) === paginas + ' / ' + paginas, textoDaPagina(painel));

    ant.click();
    checar('  «‹» recua uma página', textoDaPagina(painel) === (paginas - 1) + ' / ' + paginas, textoDaPagina(painel));
    for (let volta = 0; volta < paginas + 1 && !ant.disabled; volta += 1) ant.click();
    checar('  «‹» volta à primeira', textoDaPagina(painel) === '1 / ' + paginas, textoDaPagina(painel));
    ant.click();
    checar('  «‹» na primeira página não sai da faixa', textoDaPagina(painel) === '1 / ' + paginas, textoDaPagina(painel));

    // NENHUM ITEM SE PERDE, NENHUM SE REPETE: folheando todas as páginas, o conjunto de
    // linhas tem de ser o da lista inteira. É o que distingue «paginar» de «esconder».
    const todas = [];
    for (let p = 1; p <= paginas; p += 1) {
      todas.push(...linhasVisiveis(painel));
      if (p < paginas) prox.click();
    }
    checar('  folheando todas as páginas aparecem as ' + total + ' linhas', todas.length === total, todas.length);
    checar('  e nenhuma linha se repete', new Set(todas).size === total, new Set(todas).size);
  }

  // -------------------------------------------------------------------------
  console.log('\n2. Sem o que paginar, o rodapé não aparece');
  // -------------------------------------------------------------------------
  {
    const { doc: d7 } = await abrirProducao(7);
    const painel = painelDe(d7, 'Turmas cadastradas');
    checar('7 itens: nenhuma página a mais', textoDaPagina(painel) === '1 / 1', textoDaPagina(painel));
    checar('7 itens: o rodapé fica escondido', painel.querySelector('.paginacao').hidden === true);
    checar('7 itens: e os sete estão à vista', visiveis(painel).length === 7, visiveis(painel).length);
  }
  {
    const { doc: d0 } = await abrirProducao(0);
    const painel = painelDe(d0, 'Turmas cadastradas');
    checar('0 itens: o rodapé fica escondido', painel.querySelector('.paginacao').hidden === true);
    // Zero itens deixa UMA linha: o estado vazio («(nenhuma turma cadastrada)»). Ela é uma
    // linha e não um item — e é por isso que a contagem de páginas continua a dar 1.
    const so = visiveis(painel);
    checar('0 itens: a única linha à vista é o estado vazio',
      so.length === 1 && so[0].classList.contains('vazia'), so.map((x) => x.className));
  }
  {
    // O caso de fronteira: 8 itens = duas páginas, e a segunda tem UMA linha.
    const { doc: d8 } = await abrirProducao(8);
    const painel = painelDe(d8, 'Turmas cadastradas');
    checar('8 itens: duas páginas', textoDaPagina(painel) === '1 / 2', textoDaPagina(painel));
    painel.querySelector('.pag-prox').click();
    checar('8 itens: a página 2 tem a oitava linha', visiveis(painel).length === 1, visiveis(painel).length);
    checar('8 itens: e o «›» desabilita', painel.querySelector('.pag-prox').disabled === true);
  }

  // -------------------------------------------------------------------------
  console.log('\n3. A troca de página não mexe nas OUTRAS listas');
  // -------------------------------------------------------------------------
  {
    const { doc: d } = await abrirProducao(15);
    const turmas = painelDe(d, 'Turmas cadastradas');
    const termos = painelDe(d, 'Termos cadastrados');
    turmas.querySelector('.pag-prox').click();
    turmas.querySelector('.pag-prox').click();
    checar('as Turmas vão à página 3', textoDaPagina(turmas) === '3 / 3', textoDaPagina(turmas));
    checar('e o Vocabulário fica na 1', textoDaPagina(termos) === '1 / 3', textoDaPagina(termos));
    checar('com as suas 7 linhas intactas', visiveis(termos).length === 7, visiveis(termos).length);
  }

  // -------------------------------------------------------------------------
  console.log('\n4. O rótulo dos botões não é a classe inteira (a raiz do defeito)');
  // -------------------------------------------------------------------------
  {
    const { doc: d } = await abrirProducao(15);
    const painel = painelDe(d, 'Turmas cadastradas');
    const prox = painel.querySelector('.pag-prox');
    checar('o botão carrega MAIS do que a classe que o identifica',
      prox.className !== 'pag-prox' && prox.className.indexOf('pag-prox') === 0,
      prox.className);
    checar('e ainda assim é reconhecido como «próximo»',
      prox.classList.contains('pag-prox') === true);
    checar('o «‹» não é confundido com o «›»',
      painel.querySelector('.pag-ant').classList.contains('pag-prox') === false);
  }

  console.log('');
  if (falhas) {
    console.log(falhas + ' FALHA(S) de ' + n);
    process.exit(1);
  }
  console.log('provar-paginacao: ' + n + ' de ' + n + ' passaram');
})().catch((err) => {
  console.error('erro na prova: ' + ((err && err.stack) || err));
  process.exit(1);
});
