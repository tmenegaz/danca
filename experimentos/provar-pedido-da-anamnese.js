#!/usr/bin/env node
'use strict';

/**
 * provar-pedido-da-anamnese.js — o e-mail diz «a anamnese da aluna C» e a tela abre na aluna C
 * (18/11/2026).
 *
 * O DEFEITO, na letra dela: «o aluno que eu fiz esse pedido para anamnese é o aluno C. Foi para
 * ele que eu pedi e chegou preenchido o aluno A. […] na URL, no endereço, o get está passado
 * certo.» O endereço do pedido chegava certo — `?professor=…&aluna=…&modalidade=` —, e a página
 * da lista não o lia em sítio nenhum: o painel nascia do `localStorage`, que guardava a escolha
 * da visita anterior. O link dizia uma coisa e a tela mostrava outra.
 *
 * O QUE SE MEDE, e como:
 *
 *   1. o `select` da aluna termina na ALUNA DO PEDIDO, com uma memória a apontar para outra —
 *      é esse o cenário do defeito, e sem a memória contrária a asserção não mede nada;
 *   2. o `select` do professor fica o do pedido, pela mesma razão;
 *   3. o parâmetro SAI do endereço depois de usado — um `F5` não pode desfazer a escolha que o
 *      professor acabou de fazer no painel;
 *   4. o endereço da PORTA leva a aluna **e a modalidade** — sem a modalidade, o envelope da
 *      anamnese nasce sem ela e o vínculo nunca aparece como «concluída» na listagem;
 *   5. CONTROLE: sem o pedido no endereço, a memória continua a mandar — a correção não pode ter
 *      transformado o painel numa tela que esquece tudo.
 *
 * O QUE CORRE É O `<script>` DA PÁGINA GERADA, num jsdom: não há cópia da lógica aqui. A única
 * coisa acrescentada é uma linha de exportação das funções que a prova lê, injectada no fim do
 * IIFE — o mesmo recurso de `provar-contexto-do-ato.js`, e não código de produção.
 *
 *   node experimentos/provar-pedido-da-anamnese.js
 */

const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const raiz = path.resolve(__dirname, '..');
const listasDoAcervo = require(path.join(raiz, 'motor/servidor/listas-do-acervo.js'));

const ESCOLA = 'breu';
/* DOIS PROFESSORES, e não um. Com um só, o `select` acerta no pedido por não ter escolha — a
 * asserção passaria sem medir nada. É a mesma armadilha que a prova da modalidade já pagou: uma
 * fixture que não oferece alternativa não mede a escolha. */
const PROFESSORES = [
  { nome: 'Demi Plié', slug: 'demi-plier' },
  { nome: 'Redinha Rosa', slug: 'redinha-rosa' },
];
const ALUNAS = ['Aluna A', 'Aluna C', 'Aluna D'];

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

function kvVazio() {
  const d = new Map();
  return {
    async get(k) { return d.has(k) ? d.get(k) : null; },
    async put(k, v) { d.set(k, String(v)); },
    async delete(k) { d.delete(k); },
    async list(o) {
      const p = (o && o.prefix) || '';
      return { keys: [...d.keys()].filter((k) => k.startsWith(p)).map((name) => ({ name })),
        list_complete: true };
    },
  };
}

async function htmlDaLista() {
  const pagina = await listasDoAcervo.pagina('/area-do-professor/anamnese/', {
    env: { ESCOLA_SLUG: ESCOLA, PADD_KV: kvVazio() },
    menu: null, escola: ESCOLA, curadorias: [], linhasDeBase: [],
  });
  return pagina && pagina.html;
}

/** O `fetch` do painel: só as rotas que ele pede, com os dados do cenário. */
function api(busca) {
  const caminho = String(busca || '');
  const so = caminho.split('?')[0];
  if (so === '/api/bastidores/professores') return { ok: true, professores: PROFESSORES };
  if (so === '/api/bastidores/alunas') return { ok: true, alunas: ALUNAS.slice() };
  if (so === '/api/bastidores/curadoria-professor') return { ok: true, curadorias: [] };
  if (so === '/api/bastidores/turmas') return { ok: true, turmas: [], opcoes: [] };
  return { ok: true };
}

const espera = (win, ms = 300) => new Promise((r) => win.setTimeout(r, ms));

/**
 * Abre a lista com um endereço e uma memória.
 *
 * A MEMÓRIA É A DO DEFEITO: «Aluna A», a da visita anterior. Sem ela o cenário não prova nada —
 * uma página que nunca teve escolha guardada acerta no pedido por acidente.
 */
async function abrir(html, { busca = '', memoria = null } = {}) {
  /* A EXPORTAÇÃO DA PROVA — uma linha, no fim do IIFE do painel. `endereco` é o que constrói o
   * destino da porta; `atos` e `modalidade` dizem o que ficou semeado. */
  /* O FECHO É O DO PAINEL, e não o primeiro `})();` da página: a lista tem outros scripts, e
   * substituir o primeiro punha a exportação num IIFE que não conhece estas funções. O âncora é
   * a última linha do painel — a chamada que fecha o arranque. */
  const marcado = /abrirSeHaOQueContinuar\(\);\s*\}\)\(\);<\/script>/;
  if (!marcado.test(html)) throw new Error('não achei o fecho do painel na página');
  const injetado = html.replace(marcado,
    'abrirSeHaOQueContinuar();\n'
    + 'globalThis.__pa = {endereco: endereco, atos: function () { return ATOS; },'
    + ' modalidade: function () { return MODALIDADE_DO_ATO; }};})();</script>');

  const vc = new VirtualConsole();
  const problemas = [];
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });

  const dom = new JSDOM(injetado, {
    url: 'https://' + ESCOLA + '.example/area-do-professor/anamnese/' + busca,
    runScripts: 'dangerously',
    virtualConsole: vc,
    beforeParse(w) {
      if (memoria) {
        try { w.localStorage.setItem('ato-' + ESCOLA + '-anamnese-1', JSON.stringify(memoria)); } catch (e) {}
      }
      w.fetch = (alvo) => {
        const corpo = JSON.stringify(api(String(alvo)));
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(corpo)) });
      };
      w.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
    },
  });
  await espera(dom.window);
  return { win: dom.window, doc: dom.window.document, problemas, fechar: () => dom.window.close() };
}

const valor = (doc, id) => {
  const el = doc.getElementById(id);
  return el ? el.value : null;
};

(async () => {
  console.log('\nO PEDIDO DA ANAMNESE — o endereço do e-mail manda, e a memória não o atropela');
  const html = await htmlDaLista();

  /* ── 1. O CENÁRIO DO DEFEITO ───────────────────────────────────────────────────────────── */
  console.log('\nA · chega o pedido da Aluna C, e a memória diz Aluna A');
  {
    const ab = await abrir(html, {
      busca: '?professor=demi-plier&aluna=Aluna+C&modalidade=Bal%C3%A9+cl%C3%A1ssico',
      memoria: { professor: 'redinha-rosa', aluna: 'Aluna A', turma: '', plano: '' },
    });
    const { win, doc } = ab;
    provar('a aluna do seletor é a do PEDIDO (Aluna C), e não a da memória',
      valor(doc, 'ato-aluna') === 'Aluna C', valor(doc, 'ato-aluna'));
    provar('…e o professor é o do pedido (e não o da memória, que é outra pessoa)',
      valor(doc, 'ato-professor') === 'demi-plier', valor(doc, 'ato-professor'));
    provar('a modalidade do pedido fica semeada para seguir para a porta',
      win.__pa.modalidade() === 'Balé clássico', win.__pa.modalidade());

    const destino = win.__pa.endereco();
    provar('o endereço da porta leva a ALUNA do pedido',
      /[?&]aluna=Aluna%20C(&|$)/.test(destino), destino);
    /* SEM A MODALIDADE o envelope nasce sem ela, e `estadoDaAnamnese` — que procura o par
     * (aluna × modalidade) — nunca casa o vínculo: a anamnese fica «pedida» para sempre. */
    provar('…e leva a MODALIDADE, senão o vínculo nunca aparece como concluído',
      /[?&]modalidade=Bal%C3%A9%20cl%C3%A1ssico(&|$)/.test(destino), destino);
    provar('o parâmetro sai do endereço depois de usado — um F5 não desfaz a escolha',
      !/[?&]aluna=/.test(win.location.search) && !/[?&]modalidade=/.test(win.location.search),
      win.location.search);
    provar('o painel não escreveu erro nenhum', ab.problemas.length === 0, ab.problemas.slice(0, 2));
    ab.fechar();
  }

  /* ── 2. O CONTROLE: SEM PEDIDO, A MEMÓRIA CONTINUA A MANDAR ───────────────────────────── */
  console.log('\nB · sem pedido no endereço, a memória continua a mandar (a correção não apaga o painel)');
  {
    const ab = await abrir(html, {
      memoria: { professor: 'demi-plier', aluna: 'Aluna D', turma: '', plano: '' },
    });
    const { doc } = ab;
    provar('a aluna é a que ficou guardada (Aluna D)', valor(doc, 'ato-aluna') === 'Aluna D',
      valor(doc, 'ato-aluna'));
    provar('o professor também', valor(doc, 'ato-professor') === 'demi-plier',
      valor(doc, 'ato-professor'));
    provar('sem modalidade declarada, nenhuma é inventada',
      ab.win.__pa.modalidade() === '', ab.win.__pa.modalidade());
    ab.fechar();
  }

  /* ── 3. A LISTA NÃO ACEITA A ALUNA QUE O SERVIDOR NÃO MANDOU ──────────────────────────── */
  console.log('\nC · uma aluna que o servidor não devolve não é seleccionada por engano');
  {
    const ab = await abrir(html, {
      busca: '?professor=demi-plier&aluna=Aluna+Z&modalidade=Jazz',
      memoria: { professor: 'redinha-rosa', aluna: 'Aluna A', turma: '', plano: '' },
    });
    /* O `select` recusa o valor que não tem opção — o mesmo comportamento do DOM de verdade, e
     * é por isso que esta asserção vive aqui e não numa cópia da regra. */
    provar('a aluna desconhecida não fica seleccionada (o campo fica vazio)',
      valor(ab.doc, 'ato-aluna') === '', valor(ab.doc, 'ato-aluna'));
    ab.fechar();
  }

  console.log('');
  console.log(falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
