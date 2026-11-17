#!/usr/bin/env node
'use strict';

/*
 * provar-a-coluna-do-formulario.js — a listagem à direita, o formulário dentro das abas, os passos
 * recolhidos com ele, e as etiquetas do piso com espaço (17/11/2026).
 *
 * QUATRO COISAS QUE ELA VIU NO MESMO ECRÃ, e são todas de geometria:
 *
 *   1. «O padrão é que toda listagem fique à direita e o conteúdo de formulário fica dentro das
 *      abas.» O `.turmas-corpo` é uma GRADE DE DUAS COLUNAS, e a tira das abas era FILHA DIRECTA
 *      dela — a grade punha a tira na coluna 1, empurrava o `.col-form` para a coluna 2 e a
 *      listagem caía para a linha de baixo, na coluna 1. Medido a 1440 px antes da correcção:
 *      tira a x=288 e formulário a x=748 (a coluna da DIREITA), com a lista por baixo da tira.
 *   2. «Quando eu colapso o formulário, o step está ficando de fora do colapsar. Os steps também
 *      tem que ser colapsados, porque, afinal de contas, eles dizem respeito ao formulário.»
 *   3. «Isso é um problema antigo, já tinha sido ajustado isso. Toda hora tem que refazer esse tipo
 *      de problema.» É a razão de esta prova existir: o que não é medido volta. A terceira queixa
 *      daquele dia — as etiquetas do piso coladas ao «8 lugares» — resolveu-se tirando as
 *      etiquetas do sítio errado (elas viviam nos formulários, e o número que limita é o teto, que
 *      já está dito em «A escola»); a regressão disso está em `provar-piso`, secção E.
 *
 * PORQUE EM NAVEGADOR, E NÃO NO TEXTO DO HTML. As quatro são POSIÇÃO: onde a coluna começa, em
 * que linha está, se o passo desaparece quando o pai recolhe, quantos píxeis separam duas
 * etiquetas. Nada disso se lê numa string.
 *
 *   node experimentos/provar-a-coluna-do-formulario.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const FOLHA = path.join(RAIZ, 'tools/templates/ciclo.css');

let ok = 0;
let ko = 0;
function conferir(titulo, condicao, dado) {
  if (condicao) { ok += 1; console.log('  ok    ' + titulo); return; }
  ko += 1;
  console.log('  FALHA ' + titulo + (dado === undefined ? '' : '  → ' + JSON.stringify(dado)));
}

/* A PÁGINA DA PRODUÇÃO, com as duas secções que interessam e um contrato para o medidor existir.
 * Ela vem do servidor, e não de um exemplo escrito à mão: se a marcação mudar, a prova muda com
 * ela — é o que a torna uma prova e não uma fotografia. */
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const PAGINA = bastidores.paginaProducao(
  'breu', {},
  [{ nome: 'Ana Diag', slug: 'ana-diag', sal: 's1', hash: 'h1' }],
  ['abreu', 'vava'],
  'Brise Volet', 'brise-volet',
  [], [], {}, [], [], [],
  { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
  { modo: 'clara', paleta: 'bordo' }, null, [], new Set(),
  { ok: true, contrato: { plano: 'avancado', capacidade: { professores: 3, alunos: 120 } } },
);

(async () => {
  console.log('A. A estrutura: a grade tem dois filhos, e a tira pertence ao do formulário');
  {
    /* A REGRA NÃO É «A TIRA ESTÁ EM TAL SÍTIO»: é «a grade tem dois filhos». Enquanto forem
     * quatro, a grade distribui-os em duas linhas, e nenhuma correcção de largura resolve isso —
     * foi o que se mediu. */
    const grade = (PAGINA.match(/<div class="turmas-corpo" data-abas="sim">([\s\S]*?)<div class="col-lista"/) || [])[1] || '';
    conferir('a tira das abas nasce DENTRO do `.col-form` dos Professores',
      PAGINA.indexOf('id="professores-miolo"') < PAGINA.indexOf('id="pf-abas"'),
      { colForm: PAGINA.indexOf('id="professores-miolo"'), tira: PAGINA.indexOf('id="pf-abas"') });
    conferir('…e a da Audição também',
      PAGINA.indexOf('id="corpo-miolo"') < PAGINA.indexOf('id="lb-abas"'),
      { colForm: PAGINA.indexOf('id="corpo-miolo"'), tira: PAGINA.indexOf('id="lb-abas"') });
    conferir('…e a pílula do telemóvel entra com ela (senão ficava um filho a mais na grade)',
      PAGINA.indexOf('id="professores-miolo"') < PAGINA.indexOf('id="pf-abas-folha"')
        && PAGINA.indexOf('id="corpo-miolo"') < PAGINA.indexOf('id="lb-abas-folha"'), null);
    /* E A LISTAGEM NÃO ESTÁ DENTRO DO FORMULÁRIO: ela é a outra coluna, e continua visível em
     * todas as abas — a regra que a Audição fixou em 09/11/2026. */
    const secProfs = (PAGINA.match(/id="sec-professores"[\s\S]*?<\/section>/) || [''])[0];
    conferir('a listagem fica FORA do `.col-form` — é a outra coluna',
      /<div class="col-lista"/.test(secProfs)
        && secProfs.indexOf('class="col-lista"') > secProfs.indexOf('id="pf-painel-desligamento"'), null);
    void grade;
  }

  /* ---------------------------------------------------------------- o navegador */

  const executavel = process.env.CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-a-coluna-do-formulario: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team', 'marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (erro) {
    console.error('provar-a-coluna-do-formulario: puppeteer-core não encontrado (vem com o marp-cli) — NÃO FEITO.');
    process.exit(1);
  }

  const css = fs.readFileSync(FOLHA, 'utf8');
  const srv = http.createServer((req, res) => {
    if (req.url.indexOf('/assets/style.css') === 0) {
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(css);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    res.end(PAGINA);
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;

  const browser = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(base + '/', { waitUntil: 'load' });

    /* AS SECÇÕES NASCEM ESCONDIDAS, e quem as mostra é a navegação da página. Para medir
     * geometria de CSS, mostra-se a cadeia inteira do elemento que se vai medir — e nada mais:
     * a prova é da folha e da marcação, não do roteador de secções. */
    const mostrar = async (seletor) => page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return false;
      let n = el;
      while (n) { if (n.hidden) n.hidden = false; n = n.parentElement; }
      return true;
    }, seletor);

    console.log('\nB. A geometria: o formulário à esquerda, a listagem à direita, na mesma linha');
    {
      /* A ÂNCORA É O FORMULÁRIO, e não o medidor do piso: ele existiu entre 16 e 17/11/2026 e foi
       * retirado a pedido dela — «essa informação não pode estar aqui em alunas e nem em
       * professores». A geometria que esta secção mede não dependede dele. */
      await mostrar('#form-prof');
      const m = await page.evaluate(() => {
        const r = (el) => { if (!el) return null; const q = el.getBoundingClientRect(); return { x: Math.round(q.left), dir: Math.round(q.right), topo: Math.round(q.top), larg: Math.round(q.width) }; };
        const sec = document.getElementById('sec-professores');
        return {
          form: r(sec.querySelector('.col-form')),
          lista: r(sec.querySelector('.col-lista')),
          tira: r(document.getElementById('pf-abas')),
          colunas: getComputedStyle(sec.querySelector('.turmas-corpo')).gridTemplateColumns,
        };
      });
      conferir('o formulário fica na coluna da ESQUERDA e a listagem na da DIREITA',
        m.form && m.lista && m.form.x < m.lista.x, { form: m.form.x, lista: m.lista.x });
      conferir('…e as duas começam na MESMA linha (a listagem não cai para baixo do formulário)',
        m.form && m.lista && Math.abs(m.form.topo - m.lista.topo) <= 2,
        { topoForm: m.form.topo, topoLista: m.lista.topo });
      conferir('…e a tira das abas começa onde o formulário começa, e não numa coluna própria',
        m.tira && m.form && Math.abs(m.tira.x - m.form.x) <= 2,
        { tira: m.tira.x, form: m.form.x });
      conferir('…e tem a largura da coluna do formulário, não a da página',
        m.tira && m.form && m.tira.larg <= m.form.larg + 2,
        { tira: m.tira.larg, form: m.form.larg });
      /* DUAS COLUNAS — contadas por TRACKS, e não pelo texto: o navegador devolve a forma
       * resolvida (`431.672px 675.531px`), e o que se quer saber é quantas faixas a grade tem.
       * Conta-se separando por espaço fora de parênteses, que é como se lê uma lista de tracks. */
      const colunas = String(m.colunas || '').trim();
      let tracks = 0;
      let fundura = 0;
      if (colunas) {
        tracks = 1;
        for (const c of colunas) {
          if (c === '(') fundura += 1;
          else if (c === ')') fundura -= 1;
          else if (c === ' ' && fundura === 0) tracks += 1;
        }
      }
      conferir('a grade continua a ser de DUAS colunas (o que mudou foi quem é filho dela)',
        tracks === 2, { colunas: m.colunas, tracks });
    }

    console.log('\nC. Os passos recolhem com o formulário — nas três secções');
    {
      /* «Os steps também tem que ser colapsados, porque, afinal de contas, eles dizem respeito ao
       * formulário.» A asserção é a do comportamento: recolhido, o display é `none`; aberto,
       * volta. As três secções que têm tira: Salas, Audição e Estilo. */
      /* O ALVO É A TIRA, E NÃO O MIOLO. `#turmas-paineis` é o que o script esconde com `hidden`;
       * a tira dos passos está FORA dele (é a primeira linha do corpo), e é ela que se mede —
       * aquela que ficava de fora do recolhimento. */
      const alvos = [['sec-turmas', '#sec-turmas .passos', 'Salas'], ['sec-corpo', '#lb-faixa', 'Audição'],
        ['sec-verbetes', '#vb-tira', 'Estilo']];
      for (const [id, seletorDoPasso, nome] of alvos) {
        const r = await page.evaluate(({ id, sel }) => {
          const sec = document.getElementById(id);
          const el = document.querySelector(sel);
          if (!sec || !el) return { achou: false };
          let n = sec;
          while (n) { if (n.hidden) n.hidden = false; n = n.parentElement; }
          const antes = getComputedStyle(el).display;
          sec.setAttribute('data-recolhido', 'sim');
          const depois = getComputedStyle(el).display;
          sec.removeAttribute('data-recolhido');
          return { achou: true, antes, depois, voltou: getComputedStyle(el).display };
        }, { id, sel: seletorDoPasso });
        conferir(nome + ': recolhida a secção, os passos SAEM',
          r.achou && r.antes !== 'none' && r.depois === 'none', r);
        conferir(nome + ': …e voltam quando ela abre', r.achou && r.voltou !== 'none', r);
      }
    }

    console.log('\nD. Recolhido, o formulário leva as abas consigo (e a listagem fica)');
    {
      const r = await page.evaluate(() => {
        const sec = document.getElementById('sec-professores');
        let n = sec;
        while (n) { if (n.hidden) n.hidden = false; n = n.parentElement; }
        const visivel = (el) => !!(el && (el.offsetParent !== null || el.getClientRects().length));
        const antes = { tira: visivel(document.getElementById('pf-abas')), lista: visivel(sec.querySelector('.col-lista')) };
        sec.setAttribute('data-recolhido', 'sim');
        const depois = { tira: visivel(document.getElementById('pf-abas')), lista: visivel(sec.querySelector('.col-lista')) };
        sec.removeAttribute('data-recolhido');
        return { antes, depois };
      });
      conferir('com a secção aberta, a tira e a listagem estão ambas à vista',
        r.antes.tira && r.antes.lista, r.antes);
      conferir('recolhida, a tira sai (é do formulário) e a LISTAGEM fica (é a leitura)',
        r.depois.tira === false && r.depois.lista === true, r.depois);
    }
  } finally {
    await browser.close();
    srv.close();
  }

  console.log('');
  if (ko) {
    console.log('FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + ok + ' asserção(ões).');
})();
