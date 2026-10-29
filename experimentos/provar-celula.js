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
          // A FORMA NOVA DA CÉLULA (28/10/2026): a direção é a chave, e o campo `bloco` deixou de
          // ser texto — a notação passou a ser `categoria` + `sinais`, que se compõem na tela.
          devant: [
            { contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '→', '+'], descricao: 'extensão à frente a partir da 1ª posição, a ponta no chão' },
            { contagem: '3–4', categoria: 'Pé', sinais: ['+', '●', '1ª'], descricao: 'retorno à 1ª posição' },
          ],
          derriere: [
            { contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '→', '×'], descricao: 'extensão atrás, a ponta no chão' },
            { contagem: '3–4', categoria: 'Pé', sinais: ['×', '●', '1ª'], descricao: 'retorno à 1ª posição' },
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
  // O DICIONÁRIO DO QUE ACONTECE, como a rota o serve — indexado pela NOTAÇÃO, e não pelo nome
  // do exercício: o Plié tem duas coisas (desce, sobe) e por isso duas frases.
  descricoes: {
    '[Pé: 1ª → +]': 'extensão à frente a partir da 1ª posição, a ponta no chão',
    '[Pé: + ● 1ª]': 'retorno à 1ª posição',
  },
  // OS SINAIS VÊM COM NOME E GRUPO (28/10/2026) — a rota deixou de mandar símbolos soltos, e
  // deixou de meter as categorias dentro deles. O fixture tem de ter a forma que a rota serve,
  // senão a prova mede uma tela que não existe (foi o que aconteceu: `x.grupo` de uma string).
  sinais: [
    { sinal: '→', nome: 'conduz a', grupo: 'Movimento' },
    { sinal: '●', nome: 'fecha', grupo: 'Movimento' },
    { sinal: '↓', nome: 'cede', grupo: 'Movimento' },
    { sinal: '↑', nome: 'sobe', grupo: 'Movimento' },
    { sinal: '+', nome: 'à frente', grupo: 'Destino do membro' },
    { sinal: '-', nome: 'ao lado', grupo: 'Destino do membro' },
    { sinal: '×', nome: 'atrás', grupo: 'Destino do membro' },
    { sinal: '1ª', nome: 'primeira posição', grupo: 'Posições dos pés' },
    { sinal: '2ª', nome: 'segunda posição', grupo: 'Posições dos pés' },
  ],
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
    // UMA TABELA SÓ (28/10/2026): um bloco por direção, com as células dentro. As duas tabelas
    // antigas diziam a mesma coisa — e sem células, as duas diziam «não há nada».
    tabela: [...document.querySelectorAll('#vb-tabela table')].map((t) => ({
      direcao: t.tHead.rows[0].cells[0].textContent.trim(),
      linhas: [...t.tBodies[0].rows].map((l) => [...l.cells].map((c) => {
        const campo = c.querySelector('input');
        return campo ? campo.value : c.textContent.trim();
      }).join(' | ')),
    })),
    cobertura: (q('vb-cobertura') || {}).textContent || '',
    contagens: [...((q('vb-cel-contagem') || {}).options || [])].map((o) => o.value).filter(Boolean),
    chips: (q('vb-chips') || {}).textContent.trim(),
    lido: (q('vb-lido') || {}).textContent.trim(),
    frase: (q('vb-cel-desc') || {}).value || '',
    notaDaFrase: (q('vb-desc-nota') || {}).textContent || '',
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
    conferir('a decomposição pede o exercício antes de o haver',
      /Escolha o exercício/.test(await page.evaluate(
        () => document.getElementById('vb-tabela').textContent)));

    console.log('\n2. A DIREÇÃO NÃO SE PERGUNTA — MOSTRA-SE, NUMA TABELA SÓ');
    await page.select('#vbnome', 'Battement tendu');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 400));
    const comExercicio = await page.evaluate(estado);
    conferir('há um bloco por direção da gramática, e são três',
      comExercicio.tabela.length === 3, comExercicio.tabela.map((x) => x.direcao));
    conferir('a direção coberta mostra os trechos, com o compasso CALCULADO',
      /compasso 1 \| 1–2 \| \[Pé: 1ª → \+\]/.test(comExercicio.tabela[0].linhas[0]),
      comExercicio.tabela[0].linhas[0]);
    conferir('e a que o exercício não faz diz que não vai',
      /não vai ao lado/.test(comExercicio.tabela[1].linhas.join(' ')), comExercicio.tabela[1].linhas);
    conferir('a cobertura é dita em tempos e compassos',
      /Cobre os 8 tempos/.test(comExercicio.cobertura), comExercicio.cobertura);
    conferir('não há caixa de marcar nenhuma na tela',
      await page.evaluate(() => document.querySelectorAll('#form-verbete input[type=checkbox]').length) === 0);

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

    console.log('\n6. A CONTAGEM É CALCULADA — NÃO SE ESCREVE');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '4';
      t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 400));
    const semCelulas = await page.evaluate(estado);
    conferir('sem exercício escolhido a decomposição diz o que falta',
      /não vai à frente/.test(semCelulas.tabela[0].linhas.join(' ')), semCelulas.tabela[0].linhas);
    conferir('sem direção escolhida, a lista da contagem está vazia',
      semCelulas.contagens.length === 0, semCelulas.contagens);
    await page.select('#vb-cel-dir', 'devant');
    await new Promise((r) => setTimeout(r, 250));
    const comDirecao = await page.evaluate(estado);
    conferir('em 2/4 a contagem só oferece o que cabe: 1 e 1–2',
      JSON.stringify(comDirecao.contagens) === JSON.stringify(['1', '1–2']), comDirecao.contagens);
    await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 250));
    conferir('em 4/4 oferece até 4',
      JSON.stringify((await page.evaluate(estado)).contagens) === JSON.stringify(['1', '1–2', '1–3', '1–4']),
      (await page.evaluate(estado)).contagens);

    console.log('\n7. A NOTAÇÃO COMPÕE-SE, E O DICIONÁRIO DÁ A FRASE');
    await page.select('#vb-cel-contagem', '1–2');
    for (const s of ['1ª', '→', '+']) {
      await page.select('#vb-sinal', s);
      await page.click('#vb-add-sinal');
      await new Promise((r) => setTimeout(r, 150));
    }
    const composto = await page.evaluate(estado);
    conferir('as fichas mostram os sinais escolhidos', /1ª/.test(composto.chips) && /→/.test(composto.chips),
      composto.chips);
    conferir('e a leitura em palavras vem do nome de cada sinal',
      /primeira posição/.test(composto.lido) && /conduz a/.test(composto.lido), composto.lido);
    conferir('a frase é SUGERIDA pelo dicionário, não escrita do zero',
      composto.frase === 'extensão à frente a partir da 1ª posição, a ponta no chão', composto.frase);
    conferir('e a tela diz que é sugestão', /dicionário/.test(composto.notaDaFrase), composto.notaDaFrase);

    console.log('\n8. A FRASE AJUSTADA NÃO SE PERDE AO ACRESCENTAR UM SINAL');
    await page.evaluate(() => {
      const d = document.getElementById('vb-cel-desc');
      d.value = 'a minha própria frase';
      d.dispatchEvent(new Event('input'));
    });
    await page.select('#vb-sinal', '●');
    await page.click('#vb-add-sinal');
    await new Promise((r) => setTimeout(r, 300));
    conferir('o que a professora escreveu fica',
      (await page.evaluate(estado)).frase === 'a minha própria frase',
      (await page.evaluate(estado)).frase);

    console.log('\n9. ACRESCENTAR RECUSA O QUE FALTA, CAMPO A CAMPO');
    await page.evaluate(() => { document.getElementById('vb-cel-desc').value = ''; });
    await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 250));
    conferir('a recusa nomeia a frase que falta',
      /Falta o que acontece/.test((await page.evaluate(estado)).recado),
      (await page.evaluate(estado)).recado);
    await page.evaluate(() => {
      const d = document.getElementById('vb-cel-desc');
      d.value = 'a ponta sobe e o apoio estende';
      d.dispatchEvent(new Event('input'));
    });
    await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 350));
    const acrescentado = await page.evaluate(estado);
    conferir('acrescentado, o trecho entra na tabela com a notação composta',
      /\[Pé: 1ª → \+ ●\]/.test(acrescentado.tabela[0].linhas.join(' ')), acrescentado.tabela[0].linhas);
    conferir('e a cobertura passa a contar os tempos dele',
      /Cobre 2 de 4 tempos/.test(acrescentado.cobertura), acrescentado.cobertura);

    console.log('\n10. A FRASE EDITA-SE NA PRÓPRIA LINHA, E O «×» TIRA O TRECHO');
    await page.evaluate(() => {
      const campo = document.querySelector('input[data-desc]');
      campo.value = 'frase corrigida na tabela';
      campo.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 200));
    conferir('a frase nova está na tabela',
      /frase corrigida na tabela/.test((await page.evaluate(estado)).tabela[0].linhas.join(' ')),
      (await page.evaluate(estado)).tabela[0].linhas);
    await page.evaluate(() => { document.querySelector('button[data-tirar]').click(); });
    await new Promise((r) => setTimeout(r, 300));
    const tirado = await page.evaluate(estado);
    conferir('o «×» tira o trecho', /não vai|Cobre 0 de/.test(tirado.tabela[0].linhas.join(' ') + tirado.cobertura),
      tirado.cobertura);

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
  console.log('alfabeto, a contagem só oferece o que cabe, os sinais compõem-se, e a frase vem');
  console.log('do dicionário — ajustável, e o ajuste não se perde.');
})().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
