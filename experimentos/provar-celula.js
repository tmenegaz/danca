#!/usr/bin/env node
'use strict';

/**
 * provar-celula.js — os dois modos do verbete e o editor de célula, num navegador de verdade.
 *
 * A prova pergunta o que a tela responde, e não o que o código diz:
 *
 *   1. o formulário abre no MODO DO VERBETE, e o do exercício não está no documento;
 *   2. o «+» abre o modo do exercício — e nesse modo os campos do verbete NÃO ESTÃO, o `select`
 *      e o «+» ficam BLOQUEADOS (e bloqueados vê-se: a opacidade cai);
 *   3. o Enter no campo do nome não grava um verbete (a guarda do `submit`);
 *   4. gravar o exercício devolve ao modo do verbete, com ele escolhido;
 *   5. a tabela das direções NÃO é uma pergunta: mostra o que o alfabeto cobre, diz «este
 *      exercício não vai ao lado» quando não vai, e «sem célula para N tempos em C» quando vai
 *      noutra música;
 *   6. o editor de célula cria a decomposição que faltava — e o gargalo que ele destapa é este:
 *      sem ele, «Gravar verbete» recusava criar o que não existia (55 exercícios, 4 verbetes);
 *   7. gravar sem célula é recusado, e a recusa diz ONDE resolver;
 *   8. as células que o editor acrescenta aparecem nas duas tabelas; o «×» tira-as das duas;
 *   9. nada transborda em 320, 390, 768 e 1280px.
 *
 * A bancada é LOCAL: um `http.createServer` em porta efémera serve a página que o módulo monta,
 * a folha, a barra e as respostas de `/api` stubadas. **Nada aqui toca no ar** — a regra do
 * projeto é medir na bancada e deixar a carga ao vivo para o fim.
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   uso: node experimentos/provar-celula.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const raiz = path.join(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));

let falhas = 0;
let total = 0;
function conferir(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) {
    console.log('  ok     ' + rotulo);
  } else {
    falhas += 1;
    console.log('  FALHOU ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  }
}

/** O alfabeto de mentira da bancada: um exercício COM decomposição e outro sem nenhuma. */
const ALFABETO = {
  ok: true,
  versao: 3,
  exercicios: [
    { nome: 'Battement tendu', musicas: ['4|4/4', '8|4/4'], descontinuado: false },
    { nome: 'Plié', musicas: ['8|4/4'], descontinuado: false },
  ],
  verbetes: {
    'Battement tendu': {
      '8|4/4': {
        posicao: { membro: 'pes', termo: 'premiere-position' },
        cobre: 8,
        celulas: {
          devant: [
            { contagem: '1–2', bloco: '[Pé: 1ª → +]', descricao: 'extensão à frente, a ponta no chão' },
            { contagem: '3–4', bloco: '[Pé: + ● 1ª]', descricao: 'retorno à 1ª posição' },
          ],
          derriere: [
            { contagem: '5–6', bloco: '[Pé: 1ª → ×]', descricao: 'extensão atrás, a ponta no chão' },
            { contagem: '7–8', bloco: '[Pé: × ● 1ª]', descricao: 'retorno à 1ª posição' },
          ],
        },
      },
    },
  },
  exerciciosDoVocabulario: [
    { id: 'plie', termo: 'Plié', categoria: 'passo' },
    { id: 'battement-tendu', termo: 'Battement tendu', categoria: 'passo' },
    { id: 'changement', termo: 'Changement', categoria: 'salto' },
  ],
  posicoes: [{ id: 'premiere-position', termo: 'Première position', membro: 'pes' }],
  direcoes: [
    { termo: 'devant', nome: 'à frente' },
    { termo: 'a-la-seconde', nome: 'ao lado' },
    { termo: 'derriere', nome: 'atrás' },
  ],
  categoriasDeBloco: ['Pé', 'Peso', 'Plié', 'Braço'],
  sinais: ['→', '●', '⌒', '↺', '+', '-', '×', '↓', '↑', 'ED', 'EI', '1ª', '2ª', '3ª', '4ª', '5ª', 'D', 'E'],
};

function servir(html) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      // `no-store`: sem ele o Chrome reaproveita a página entre as navegações da prova.
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    }
    if (caminho === '/api/bastidores/verbete') return ok('application/json', JSON.stringify(ALFABETO));
    if (caminho === '/api/bastidores/termo') {
      return ok('application/json', JSON.stringify({ ok: true, termo: 'Sissonne ouverte', id: 'sissonne-ouverte' }));
    }
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({
    srv, base: 'http://127.0.0.1:' + srv.address().port,
  })));
}

/** O que se mede, dentro da página. Uma função só, chamada de fora. */
function estado() {
  const q = (s) => document.getElementById(s);
  const visivel = (e) => Boolean(e) && !e.hidden && getComputedStyle(e).display !== 'none'
    && e.getBoundingClientRect().height > 0;
  const linhasDe = (id) => {
    const t = q(id);
    return t ? [...t.tBodies[0].rows].map((l) => [...l.cells].map((c) => c.textContent.trim()).join(' | ')) : [];
  };
  const sel = q('vbnome');
  const mais = q('vb-novo-exercicio');
  return {
    modoVerbete: visivel(q('vb-modo-verbete')),
    modoExercicio: visivel(q('vb-modo-exercicio')),
    selBloqueado: Boolean(sel && sel.disabled),
    maisBloqueado: Boolean(mais && mais.disabled),
    opacidadeBloqueado: sel ? getComputedStyle(sel).opacity : null,
    foco: document.activeElement ? document.activeElement.id : '',
    direcoes: linhasDe('vb-direcoes'),
    celulas: linhasDe('vb-celulas'),
    legenda: (q('vb-sinais') || {}).textContent || '',
    recado: (document.querySelector('[data-res=verbetes]') || {}).textContent || '',
    botaoVerboNoModoB: (() => {
      const b = q('vb-modo-exercicio');
      return b ? /Gravar verbete/.test(b.textContent) : null;
    })(),
    transbordo: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-celula: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-celula: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const html = bastidores.paginaProducao('valse', { professor: 'perna-boa', ciclo: '01', query: '' },
    [], [], 'Tiago', 'tiago', [], [], [], [], [], []);
  const { srv, base } = await servir(html);
  const browser = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errosDeJs = [];
  page.on('pageerror', (e) => errosDeJs.push(e.message));

  try {
    await page.setViewport({ width: 1280, height: 950 });
    await page.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0' });
    // A Produção é uma página de sessão: `abrirSessao` é o que revela o conteúdo e o que o
    // login faz ao vivo. Ir pelo formulário da senha exigiria a rota de sessão, que aqui não
    // é o que se mede.
    await page.evaluate(() => {
      if (typeof abrirSessao === 'function') abrirSessao('token-de-prova');
      location.hash = '#verbetes';
      if (typeof mostrarSecao === 'function') mostrarSecao();
    });
    await new Promise((r) => setTimeout(r, 700));

    console.log('\n1. O FORMULÁRIO ABRE NO MODO DO VERBETE');
    const inicial = await page.evaluate(estado);
    conferir('o modo do verbete está à vista', inicial.modoVerbete, inicial.modoVerbete);
    conferir('e o modo do exercício não está', inicial.modoExercicio === false, inicial.modoExercicio);
    conferir('o seletor e o «+» estão activos', !inicial.selBloqueado && !inicial.maisBloqueado, inicial);
    conferir('a tabela das direções pede o exercício',
      /Escolha o exercício/.test(inicial.direcoes.join(' ')), inicial.direcoes);

    console.log('\n2. A DIREÇÃO NÃO SE PERGUNTA — MOSTRA-SE');
    await page.select('#vbnome', 'Battement tendu');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 350));
    const comExercicio = await page.evaluate(estado);
    conferir('a tabela dá uma linha por direção da gramática', comExercicio.direcoes.length === 3,
      comExercicio.direcoes.length);
    conferir('a direção coberta mostra o que acontece',
      /1–2 — extensão à frente/.test(comExercicio.direcoes[0]), comExercicio.direcoes[0]);
    conferir('a que o exercício não faz diz que não vai',
      /este exercício não vai ao lado/.test(comExercicio.direcoes[1]), comExercicio.direcoes[1]);
    conferir('não há caixa de marcar nenhuma na tela',
      await page.evaluate(() => document.querySelectorAll('#vbdirecoes input[type=checkbox]').length) === 0);

    console.log('\n3. O «+» ABRE O MODO DO EXERCÍCIO — E O OUTRO SAI');
    await page.click('#vb-novo-exercicio');
    await new Promise((r) => setTimeout(r, 300));
    const noModoB = await page.evaluate(estado);
    conferir('o modo do verbete desaparece', noModoB.modoVerbete === false, noModoB.modoVerbete);
    conferir('e o do exercício aparece', noModoB.modoExercicio, noModoB.modoExercicio);
    conferir('o seletor fica BLOQUEADO', noModoB.selBloqueado, noModoB.selBloqueado);
    conferir('o «+» também', noModoB.maisBloqueado, noModoB.maisBloqueado);
    conferir('e o bloqueio vê-se: a opacidade cai', noModoB.opacidadeBloqueado === '0.4',
      noModoB.opacidadeBloqueado);
    conferir('o foco vai para o nome do exercício novo', noModoB.foco === 'vnnome', noModoB.foco);
    conferir('não há «Gravar verbete» no modo do exercício', noModoB.botaoVerboNoModoB === false,
      noModoB.botaoVerboNoModoB);
    conferir('e os campos do verbete não estão no documento',
      await page.evaluate(() => !document.getElementById('vb-modo-exercicio').querySelector('#vbtempos')));

    console.log('\n4. O ENTER NÃO GRAVA UM VERBETE COM OS CAMPOS ESCONDIDOS');
    await page.type('#vnnome', 'Sissonne ouverte');
    await page.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 400));
    const depoisDoEnter = await page.evaluate(estado);
    conferir('o modo do exercício continua aberto', depoisDoEnter.modoExercicio, depoisDoEnter.modoExercicio);
    conferir('e nenhum recado de gravação apareceu', !/gravado/i.test(depoisDoEnter.recado), depoisDoEnter.recado);

    console.log('\n5. GRAVAR O EXERCÍCIO DEVOLVE AO MODO DO VERBETE, COM ELE ESCOLHIDO');
    await page.click('#vb-criar-exercicio');
    await new Promise((r) => setTimeout(r, 700));
    const gravado = await page.evaluate(estado);
    conferir('o modo do verbete voltou', gravado.modoVerbete, gravado.modoVerbete);
    conferir('o seletor está activo outra vez', !gravado.selBloqueado, gravado.selBloqueado);
    conferir('e o exercício novo está escolhido',
      await page.evaluate(() => document.getElementById('vbnome').value) === 'Sissonne ouverte');

    console.log('\n6. O EDITOR DE CÉLULA CRIA O QUE NÃO EXISTIA');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 350));
    const semCelulas = await page.evaluate(estado);
    conferir('sem decomposição, a lista de células diz o que falta',
      /Nenhuma célula para esta música/.test(semCelulas.celulas.join(' ')), semCelulas.celulas);
    conferir('e as três direções dizem que o exercício não vai',
      semCelulas.direcoes.every((l) => /não vai/.test(l)), semCelulas.direcoes);
    conferir('a legenda dos sinais vem do alfabeto',
      /Categorias: Pé/.test(semCelulas.legenda) && /Sinais: →/.test(semCelulas.legenda), semCelulas.legenda);

    console.log('\n7. GRAVAR SEM CÉLULA É RECUSADO — E A RECUSA DIZ ONDE RESOLVER');
    await page.click('#form-verbete button[type=submit]');
    await new Promise((r) => setTimeout(r, 400));
    const recusado = await page.evaluate(estado);
    conferir('a recusa fala em «Células deste verbete»',
      /Células deste verbete/.test(recusado.recado), recusado.recado);
    conferir('e nada foi gravado', recusado.celulas.length === 1, recusado.celulas.length);

    console.log('\n8. O EDITOR ACRESCENTA, MOSTRA NAS DUAS TABELAS E TIRA');
    const acrescentar = async (dir, contagem, bloco, desc) => {
      await page.select('#vb-cel-dir', dir);
      await page.type('#vb-cel-contagem', contagem);
      await page.type('#vb-cel-bloco', bloco);
      await page.type('#vb-cel-desc', desc);
      await page.click('#vb-cel-acrescentar');
      await new Promise((r) => setTimeout(r, 250));
    };
    await acrescentar('devant', '1–2', '[Pé: 1ª → +]', 'abre à frente, a ponta no chão');
    await acrescentar('devant', '3–4', '[Pé: + ● 1ª]', 'fecha na 1ª posição');
    const comCelulas = await page.evaluate(estado);
    conferir('as duas células entram na tabela do rascunho', comCelulas.celulas.length === 2,
      comCelulas.celulas.length);
    conferir('e a linha «à frente» passa a mostrá-las',
      /abre à frente/.test(comCelulas.direcoes[0]), comCelulas.direcoes[0]);
    conferir('os campos ficam limpos para a célula seguinte',
      await page.evaluate(() => ['vb-cel-contagem', 'vb-cel-bloco', 'vb-cel-desc']
        .every((i) => document.getElementById(i).value === '')));
    // A RECUSA NOMEIA O QUE FALTA, e não «faltam campos». A direção fica escolhida entre
    // células (é o gesto de quem escreve três seguidas na mesma direção), e o que falta a
    // seguir são a contagem e o bloco — a recusa tem de dizer isso, e não o campo que já está.
    conferir('acrescentar com os campos vazios é recusado, e a recusa nomeia o que falta',
      await (async () => {
        await page.type('#vb-cel-desc', 'x');
        await page.click('#vb-cel-acrescentar');
        await new Promise((r) => setTimeout(r, 250));
        const d = await page.evaluate(estado);
        return /Falta a contagem, o bloco/.test(d.recado) && d.celulas.length === 2;
      })());
    conferir('e sem direção escolhida a recusa começa por ela', await (async () => {
      await page.select('#vb-cel-dir', '');
      await page.type('#vb-cel-contagem', '5–6');
      await page.type('#vb-cel-bloco', '[Pé: 1ª → ×]');
      await page.click('#vb-cel-acrescentar');
      await new Promise((r) => setTimeout(r, 250));
      const d = await page.evaluate(estado);
      return /Falta a direção/.test(d.recado) && d.celulas.length === 2;
    })());

    await page.evaluate(() => { document.querySelectorAll('button.vb-cel-tirar')[1].click(); });
    await new Promise((r) => setTimeout(r, 250));
    const tirada = await page.evaluate(estado);
    conferir('o «×» tira a célula do rascunho', tirada.celulas.length === 1, tirada.celulas.length);
    conferir('e ela sai também da tabela das direções',
      !/fecha na 1ª posição/.test(tirada.direcoes[0]), tirada.direcoes[0]);

    console.log('\n9. NADA TRANSBORDA, E O SCRIPT NÃO REBENTA');
    for (const largura of [320, 390, 768, 1280]) {
      await page.setViewport({ width: largura, height: 900 });
      await new Promise((r) => setTimeout(r, 250));
      const m = await page.evaluate(estado);
      conferir('em ' + largura + 'px não há transbordo horizontal', m.transbordo === 0, m.transbordo);
    }
    conferir('nenhum erro de JavaScript na página', errosDeJs.length === 0, errosDeJs);
  } finally {
    await browser.close();
    srv.close();
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: os modos não coexistem, a direção é lida do');
  console.log('alfabeto, e o editor de célula cria a decomposição que faltava.');
})().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
