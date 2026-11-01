#!/usr/bin/env node
'use strict';

/**
 * provar-celula.js — os dois modos do verbete e o editor de trecho, num navegador de verdade.
 *
 * A prova pergunta o que a tela responde, e não o que o código diz:
 *
 *   1. o formulário abre no MODO DO VERBETE, e o do exercício não está no documento;
 *   2. a tabela das direções NÃO é uma pergunta: mostra o que o alfabeto cobre, diz «este
 *      exercício não vai ao lado» quando não vai;
 *   3. o «+» abre o modo do exercício — e nesse modo os campos do verbete NÃO ESTÃO, o `select`
 *      e o «+» ficam BLOQUEADOS (e bloqueados vê-se: a opacidade cai);
 *   4. o Enter no campo do nome não grava um verbete com os campos escondidos;
 *   5. gravar o exercício devolve ao modo do verbete, com ele escolhido;
 *   6. o editor de trecho É DE PÍLULAS — não há uma única lista suspensa, e os dois eixos estão
 *      separados: três direções do membro, cinco orientações do corpo;
 *   7. os sinais compõem-se por CLIQUE e não se substituem uns aos outros — o defeito de origem,
 *      em que escolher o segundo sinal apagava o primeiro;
 *   8. a direção e a orientação FICAM depois de acrescentar um trecho, e a FRASE TAMBÉM — só os
 *      sinais e a contagem se limpam (31/10/2026: era ela que se reescrevia a cada trecho);
 *   9. a frase vem do dicionário, escreve-se UMA vez para o exercício, e o ajuste da professora
 *      não se perde;
 *  10. o trecho acrescentado leva a `orientacao` ao repositório — e não a leva quando é en face;
 *  11. o último passo mostra o texto composto de cada trecho, e o «×» tira o trecho;
 *  12. os CINCO passos estão na tira — fora do formulário, à esquerda da listagem —, e a
 *      listagem está ao lado com as etiquetas de cada verbete (posição, direções, compasso,
 *      trechos); modelo da turma, desde 01/11/2026;
 *  13. nada transborda em 320, 390, 768 e 1280px, e nenhum erro de JavaScript aparece.
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
  versao: 5,
  // A LISTAGEM PASSOU A DIZER O QUE O VERBETE É (31/10/2026): o servidor manda a posição, os
  // trechos, as direções e os compassos, e a tela veste-os de etiqueta. O fixture tem de os
  // trazer — sem eles a prova mediria uma linha que já não existe.
  exercicios: [
    {
      nome: 'Battement tendu', musicas: ['4|4/4', '8|4/4'], descontinuado: false,
      posicao: { membro: 'pes', termo: 'premiere-position' },
      trechos: 4, direcoes: ['devant', 'derriere', 'a-la-seconde'], compassos: ['4/4'],
    },
    {
      nome: 'Plié', musicas: ['8|4/4'], descontinuado: false,
      posicao: { membro: 'pes', termo: 'premiere-position' },
      trechos: 2, direcoes: ['devant'], compassos: ['4/4'],
    },
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
  // A DEFINIÇÃO VAI JUNTO (31/10/2026) — o formulário pré-enche «o que acontece» com ela. O
  // `Changement` fica SEM definição de propósito: é o caso que cai para o dicionário do trecho,
  // e é o que a prova mede na secção da sugestão.
  exerciciosDoVocabulario: [
    { id: 'plie', termo: 'Plié', categoria: 'passo', descricao: '', fonte: '' },
    { id: 'battement-tendu', termo: 'Battement tendu', categoria: 'passo', descricao: '', fonte: '' },
    { id: 'changement', termo: 'Changement', categoria: 'salto', descricao: '', fonte: '' },
    {
      id: 'rond-de-jambe-en-l-air', termo: 'Rond de jambe en l’air', categoria: 'passo',
      descricao: 'Círculo da perna no ar.', fonte: '',
    },
  ],
  posicoes: [{ id: 'premiere-position', termo: 'Première position', membro: 'pes' }],
  // DOIS EIXOS (versão 5, 28/10/2026). A rota deixou de os mandar concatenados: a direção diz
  // para onde o membro vai, a orientação diz como o corpo está voltado. O fixture tem de ter a
  // forma que a rota serve — três e cinco, e não oito numa lista só.
  direcoes: [
    { termo: 'devant', nome: 'à frente', glifo: '+' },
    { termo: 'a-la-seconde', nome: 'ao lado', glifo: '-' },
    { termo: 'derriere', nome: 'atrás', glifo: '×' },
  ],
  orientacoes: [
    { termo: 'en-face', nome: 'en face', glifo: 'en-face' },
    { termo: 'croise', nome: 'croisé', glifo: 'croise' },
    { termo: 'efface', nome: 'effacé', glifo: 'efface' },
    { termo: 'ecarte', nome: 'écarté', glifo: 'ecarte' },
    { termo: 'epaulement', nome: 'épaulement', glifo: 'epaulement' },
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

/** O último corpo que a tela mandou gravar — lido no POST, não adivinhado na tela. */
let ULTIMO_CORPO = null;

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
    // O CORPO DO POST É GUARDADO. A orientação do corpo é o que se quer ver no que a tela
    // manda gravar — e o que não se vê na tela é o que se mede no corpo.
    if (caminho === '/api/bastidores/verbete' && req.method === 'POST') {
      let cru = '';
      req.on('data', (t) => { cru += t; });
      return req.on('end', () => {
        try { ULTIMO_CORPO = JSON.parse(cru); } catch { ULTIMO_CORPO = null; }
        ok('application/json', JSON.stringify({ ok: true, versao: 6 }));
      });
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
  const pílulas = (id) => [...((q(id) || {}).querySelectorAll
    ? q(id).querySelectorAll('input') : [])].map((x) => ({
    valor: x.getAttribute('data-valor') || x.value,
    marcado: x.checked,
  }));
  const sel = q('vbnome');
  const mais = q('vb-novo-exercicio');
  return {
    modoVerbete: visivel(q('vb-modo-verbete')),
    modoExercicio: visivel(q('vb-modo-exercicio')),
    selBloqueado: Boolean(sel && sel.disabled),
    maisBloqueado: Boolean(mais && mais.disabled),
    opacidadeBloqueado: sel ? getComputedStyle(sel).opacity : null,
    foco: document.activeElement ? document.activeElement.id : '',
    // UMA TABELA SÓ (28/10/2026): um bloco por direção, com as células dentro.
    tabela: [...document.querySelectorAll('#vb-tabela table')].map((t) => ({
      direcao: t.tHead.rows[0].cells[0].textContent.trim(),
      linhas: [...t.tBodies[0].rows].map((l) => [...l.cells].map((c) => {
        const campo = c.querySelector('input');
        return campo ? campo.value : c.textContent.trim();
      }).join(' | ')),
    })),
    cobertura: (q('vb-cobertura') || {}).textContent || '',
    // OS DOIS EIXOS, medidos como a tela os mostra.
    direcoes: pílulas('vb-dir'),
    orientacoes: pílulas('vb-orient'),
    contagens: pílulas('vb-contagem'),
    // O ESTADO INTERNO, para a falha dizer qual dos dois lados está errado: o dado ou a tela.
    dir: window.DIRECAO,
    orient: window.ORIENTACAO,
    // NENHUMA LISTA SUSPENSA NO TRECHO. É a asserção que impede o `<select>` de voltar.
    suspensasNoTrecho: [...document.querySelectorAll(
      '#vb-dir select, #vb-orient select, #vb-contagem select, #vb-sinais select')].length,
    sinaisMarcados: [...document.querySelectorAll('#vb-sinais input:checked')].length,
    // ESCOLHA ÚNICA *vs* MÚLTIPLA (29/10/2026). A direção e a orientação são UMA escolha, e o
    // `radio` é o que garante que a tela e o estado não divergem: com `checkbox` e sem repintura,
    // o navegador marcava a nova e deixava a anterior — a tela mostrava «à frente» e gravava
    // «atrás». É esta a asserção que impede o regresso.
    tipos: [...new Set([...document.querySelectorAll('#vb-dir input, #vb-orient input')]
      .map((x) => x.type))],
    direcoesMarcadas: [...document.querySelectorAll('#vb-dir input:checked')]
      .map((x) => x.getAttribute('data-valor')),
    orientacoesMarcadas: [...document.querySelectorAll('#vb-orient input:checked')]
      .map((x) => x.getAttribute('data-valor')),
    chips: (q('vb-chips') || {}).textContent.trim(),
    // A FRASE É DO VERBETE, E O QUE FICA ESCRITO É DERIVADO (31/10/2026). O campo «o que
    // acontece neste trecho» deixou de existir: a frase escreve-se uma vez, no passo 2, e o
    // último passo mostra o texto composto de cada trecho (frase + «lê-se») — que é o que se
    // grava. É este par que se mede, e não um campo que já não há.
    frase: (q('vb-frase') || {}).value || '',
    notaDaFrase: (q('vb-frase-nota') || {}).textContent || '',
    fica: (q('vb-fica') || {}).textContent.replace(/\s+/g, ' ').trim(),
    blocosDaFica: document.querySelectorAll('#vb-fica p').length,
    // As colunas contam-se pelo CABEÇALHO: a linha de «este exercício não vai…» ocupa a tabela
    // toda com um `colspan`, e contá-la daria 1.
    colunasDaTabela: [...document.querySelectorAll('#vb-tabela table')]
      .map((t) => t.tHead.rows[0].cells[0].colSpan),
    // OS SEIS PASSOS E O MODO DE EDIÇÃO (31/10/2026).
    passo: window.PASSO,
    avisoDeEdicao: (() => {
      const a = q('vb-edicao');
      return a && !a.hidden ? a.textContent.replace(/\s+/g, ' ').trim() : null;
    })(),
    tiraEditando: (q('vb-tira') || {}).dataset
      ? q('vb-tira').getAttribute('data-editando') : null,
    alertasVisiveis: [...document.querySelectorAll('#vb-tira .passo-alerta')]
      .filter((a) => getComputedStyle(a).display !== 'none').length,
    contagensMarcadas: [...document.querySelectorAll('#vb-contagem input:checked')]
      .map((x) => x.getAttribute('data-valor')),
    rotuloDoBotao: (q('vb-cel-acrescentar') || {}).textContent || '',
    linhaEmEdicao: Boolean(document.querySelector('#vb-tabela tr.em-edicao')),
    temBotaoTirar: Boolean(document.querySelector('#vb-tabela button[data-tirar]')),
    linhasDaTabela: [...document.querySelectorAll('#vb-tabela tr:not(.em-edicao)')]
      .map((r) => r.textContent.replace(/\s+/g, ' ').trim()).join(' | '),
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
  // OS DIÁLOGOS SÃO FECHADOS E REGISTADOS. O formulário usa `alert` para dizer o que falta, e
  // um `alert` pendente bloqueia a página inteira — uma prova que o ignore não mede a tela, mede
  // o silêncio dela. Registá-lo também mostra qual foi a recusa.
  const dialogos = [];
  page.on('dialog', async (d) => { dialogos.push(d.message()); await d.dismiss(); });

  /**
   * Clicar numa pílula — o gesto que a tela pede, e não uma escrita de valor.
   *
   * O clique vai para o `<label>` da pílula, e não para a caixa que ele contém: é o que a mão
   * faz (a caixa é parte da peça, não um alvo separado), e é o que funciona mesmo quando a
   * folha desenha a caixa com `appearance:none` e a esconde por baixo da peça.
   */
  // ================= OS CINCO PASSOS (31/10/2026 — cinco desde 01/11/2026) ========
  // Só o painel do passo actual está no ecrã — e um controlo num painel escondido não se pode
  // clicar. A prova leva-se ao passo onde o controlo vive, em vez de fingir que estão todos à
  // vista: é isso que a tela faz, e é isso que a prova deve fazer.
  //
  // O MAPA ENCOLHEU COM A FUSÃO. O exercício, a frase e a posição passaram a ser o passo 1 (o
  // painel do par do exercício e o painel da frase/posição, ambos `data-passo="1"`); a música
  // desceu a 2, o «para onde» a 3, os sinais a 4 e a decomposição a 5. É o passo onde o controlo
  // VIVE, e não a ordem em que se aprende — por isso a música vem antes do par do exercício.
  const PASSO_DE = [
    [/^#vbnome|^#vb-novo-exercicio/, 1],
    [/^#vb-frase|^#vb-frase-nota|^#vbposicao/, 1],
    [/^#vbtempos|^#vbcompasso/, 2],
    [/^#vb-dir|^#vb-orient|^#vb-categoria|^#vb-contagem/, 3],
    [/^#vb-sinais|^#vb-chips/, 4],
    [/^#vb-tabela|^#vb-fica|^#vb-cel-acrescentar|^input\[name=vb-cat\]/, 5],
  ];
  const passoDe = (seletor) => {
    for (const [re, n] of PASSO_DE) if (re.test(seletor)) return n;
    return null;
  };
  // O ÚLTIMO PASSO lê-se DA PÁGINA, e só depois de ela abrir: uma prova que escreve «7» à mão
  // mede a constante dela, não o comportamento — e já ficou com números errados quando a lista
  // mudou de tamanho. (`let`, e não `const`: a página ainda está em `about:blank` aqui.)
  let ULTIMO = null;
  const irA = async (n) => {
    await page.evaluate((k) => { if (typeof irParaPasso === 'function') irParaPasso(k); }, n);
    await new Promise((r) => setTimeout(r, 150));
  };
  const noPassoDe = async (seletor) => {
    const n = passoDe(seletor);
    if (n) await irA(n);
  };
  /** Clicar numa pílula — o gesto que a tela pede, e não uma escrita de valor. */
  const clicar = async (seletor) => {
    await noPassoDe(seletor);
    await page.evaluate((s) => {
      const alvo = document.querySelector(s);
      if (!alvo) throw new Error('pílula não encontrada: ' + s);
      (alvo.closest('label') || alvo).click();
    }, seletor);
    await new Promise((r) => setTimeout(r, 200));
  };
  const marcada = (lista) => (lista.find((x) => x.marcado) || {}).valor;
  const valores = (lista) => lista.map((x) => x.valor);

  try {
    await page.setViewport({ width: 1280, height: 950 });
    await page.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0' });
    ULTIMO = await page.evaluate(() => window.ULTIMO_PASSO);
    conferir('a página diz qual é o último passo, e são cinco', ULTIMO === 5, ULTIMO);
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

    console.log('\n2. A TABELA MOSTRA O QUE O ALFABETO COBRE, SEM PERGUNTAR');
    await noPassoDe('#vbnome'); await page.select('#vbnome', 'Battement tendu');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 400));
    const comExercicio = await page.evaluate(estado);
    conferir('há um bloco por DIREÇÃO do membro, e são três', comExercicio.tabela.length === 3,
      comExercicio.tabela.map((x) => x.direcao));
    conferir('a direção coberta mostra os trechos, com o compasso CALCULADO',
      /compasso 1 \| 1–2 \| en face \| \[Pé: 1ª → \+\]/.test(comExercicio.tabela[0].linhas[0]),
      comExercicio.tabela[0].linhas[0]);
    conferir('e a que o exercício não faz diz que não vai',
      /não vai ao lado/.test(comExercicio.tabela[1].linhas.join(' ')), comExercicio.tabela[1].linhas);
    conferir('a cobertura é dita em tempos', /Cobre os 8 tempos/.test(comExercicio.cobertura),
      comExercicio.cobertura);
    conferir('a célula sem orientação diz «en face» em palavras — a coluna não fica em branco',
      /en face/.test(comExercicio.tabela[0].linhas[0]), comExercicio.tabela[0].linhas[0]);

    console.log('\n3. O «+» ABRE O MODO DO EXERCÍCIO — E O OUTRO SAI');
    await noPassoDe('#vb-novo-exercicio');
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
    // A TIRA SAI TAMBÉM (01/11/2026). Ela passou a viver FORA do formulário, e por isso deixou de
    // desaparecer de borla com `#vb-modo-verbete`: sem `pintarPassos` a esconder, ficava a navegar
    // cinco passos de um formulário que não está no ecrã. O `hidden` sozinho não bastava — a regra
    // `.passos{display:flex}` vence a do navegador —, e é isso que os dois números abaixo medem.
    const tiraNoModoB = await page.evaluate(() => {
      const t = document.getElementById('vb-tira');
      return { atributo: t.hidden, altura: Math.round(t.getBoundingClientRect().height) };
    });
    conferir('a tira dos passos sai do ecrã no modo do exercício',
      tiraNoModoB.atributo === true && tiraNoModoB.altura === 0, tiraNoModoB);
    conferir('e o par do exercício também, que é o painel do passo 1',
      await page.evaluate(() => {
        const p = [...document.querySelectorAll('#form-verbete .passo-painel[data-passo="1"]')];
        return p.length === 2 && p.every((x) => x.hidden);
      }));

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

    console.log('\n6. O EDITOR DE TRECHO É DE PÍLULAS, E OS DOIS EIXOS ESTÃO SEPARADOS');
    await noPassoDe('#vbnome'); await page.select('#vbnome', 'Battement tendu');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '4';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 400));
    const eixos = await page.evaluate(estado);
    conferir('não há uma única lista suspensa no trecho', eixos.suspensasNoTrecho === 0, eixos.suspensasNoTrecho);
    conferir('a direção do membro oferece TRÊS',
      JSON.stringify(valores(eixos.direcoes)) === JSON.stringify(['devant', 'a-la-seconde', 'derriere']),
      valores(eixos.direcoes));
    conferir('e a orientação do corpo oferece CINCO — é o outro eixo',
      valores(eixos.orientacoes).length === 5, valores(eixos.orientacoes));
    conferir('nenhuma direção está escolhida antes de o professor escolher',
      marcada(eixos.direcoes) === undefined, marcada(eixos.direcoes));
    // «EN FACE» APARECE MARCADA DESDE O INÍCIO (29/10/2026). Ela é a omissão — o campo
    // `orientacao` só existe quando não é en face —, mas a pílula tem de o DIZER: antes era a
    // única que nunca marcava, e a pesquisadora leu isso como «não habilita»: um clique que não
    // dizia nada, num campo onde todos os outros diziam.
    conferir('a orientação já vem em «en face», que é a omissão — e vê-se',
      marcada(eixos.orientacoes) === 'en-face', marcada(eixos.orientacoes));
    conferir('direção e orientação são ESCOLHA ÚNICA (radio), e não lista de caixas',
      JSON.stringify(eixos.tipos) === JSON.stringify(['radio']), eixos.tipos);
    conferir('«en face» aparece marcada quando nenhuma outra está — é a omissão, e vê-se',
      JSON.stringify(eixos.orientacoesMarcadas) === JSON.stringify(['en-face']),
      eixos.orientacoesMarcadas);
    conferir('sem direção, a contagem diz que se escolha a direção primeiro',
      eixos.contagens.length === 0, eixos.contagens);

    await clicar('#vb-dir input[data-valor="devant"]');
    const comDirecao = await page.evaluate(estado);
    conferir('a pílula da direção fica marcada', marcada(comDirecao.direcoes) === 'devant',
      { marcada: marcada(comDirecao.direcoes), estado: comDirecao.dir, tudo: comDirecao.direcoes });
    conferir('em 2/4 a contagem só oferece o que cabe: 1 e 1–2',
      JSON.stringify(valores(comDirecao.contagens)) === JSON.stringify(['1', '1–2']),
      { contagens: valores(comDirecao.contagens), estado: comDirecao.dir });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 300));
    conferir('em 4/4 oferece até 4',
      JSON.stringify(valores((await page.evaluate(estado)).contagens))
        === JSON.stringify(['1', '1–2', '1–3', '1–4']),
      valores((await page.evaluate(estado)).contagens));
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 300));

    console.log('\n7. TRÊS CLIQUES EM TRÊS DIREÇÕES DEIXAM UMA SÓ — E É A ÚLTIMA');
    for (const d of ['devant', 'a-la-seconde', 'derriere']) {
      await clicar('#vb-dir input[data-valor="' + d + '"]');
    }
    const tres = await page.evaluate(estado);
    conferir('só uma direção fica marcada', tres.direcoesMarcadas.length === 1, tres.direcoesMarcadas);
    conferir('e é a última clicada — a tela não diz uma coisa e o estado outra',
      tres.direcoesMarcadas[0] === 'derriere' && tres.dir === 'derriere',
      { marcada: tres.direcoesMarcadas, estado: tres.dir });
    await clicar('#vb-dir input[data-valor="devant"]');
    conferir('e clicar noutra troca-a, sem deixar rasto da anterior',
      (await page.evaluate(estado)).direcoesMarcadas.length === 1,
      (await page.evaluate(estado)).direcoesMarcadas);

    console.log('\n8. OS SINAIS COMPÕEM-SE POR CLIQUE — NÃO SE SUBSTITUEM');
    await clicar('#vb-contagem input[data-valor="1–2"]');
    for (const s of ['1ª', '→', '+']) await clicar('#vb-sinais input[data-sinal="' + s + '"]');
    const composto = await page.evaluate(estado);
    conferir('três cliques puseram TRÊS sinais na ficha', /1\. 1ª/.test(composto.chips)
      && /2\. →/.test(composto.chips) && /3\. \+/.test(composto.chips), composto.chips);
    // A LEITURA EM PALAVRAS DEIXOU DE SER ESCRITA (31/10/2026): ela é DERIVADA da notação e só
    // aparece quando há trecho — antes disso não há nada para ler, e inventar um texto seria a
    // sugestão a competir com a frase do verbete.
    conferir('a leitura em palavras não é escrita antes de haver trecho',
      !/Lê-se:/.test(composto.fica), composto.fica);
    // OS SINAIS NÃO TOCAM NA FRASE DO VERBETE (31/10/2026). Era o defeito que a pesquisadora
    // descreveu como «toda vez que eu vou acrescentar um trecho, eu preciso digitar novamente o
    // que acontece»: o campo vivia no passo do trecho e era reescrito a cada acrescento. Agora a
    // frase é do exercício, e escolher sinais não a muda — muda o «lê-se» que se lhe acrescenta.
    conferir('escolher sinais não reescreve a frase do verbete',
      composto.frase === '', composto.frase);
    conferir('e o último passo ainda não tem trechos para mostrar',
      /Ainda não há trechos/.test(composto.fica), composto.fica);
    await clicar('#vb-sinais input[data-sinal="1ª"]');
    conferir('um sinal pode repetir-se no mesmo trecho — clicar outra vez acrescenta ao fim',
      /4\. 1ª/.test((await page.evaluate(estado)).chips), (await page.evaluate(estado)).chips);
    // O defeito de origem: escolher o segundo sinal apagava o primeiro. Com pílulas, nunca.
    conferir('nenhuma pílula de sinal fica marcada — o estado está nas fichas, não na caixa',
      (await page.evaluate(estado)).sinaisMarcados === 0, (await page.evaluate(estado)).sinaisMarcados);

    console.log('\n9. A FRASE ESCRITA À MÃO NÃO SE PERDE AO ESCOLHER UM SINAL');
    await noPassoDe('#vb-frase');
    await page.evaluate(() => {
      const d = document.getElementById('vb-frase');
      d.value = 'a minha própria frase';
      d.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vb-sinais');
    await clicar('#vb-sinais input[data-sinal="●"]');
    conferir('o que a professora escreveu fica',
      (await page.evaluate(estado)).frase === 'a minha própria frase',
      (await page.evaluate(estado)).frase);
    conferir('e a nota passa a dizer que a frase é dela',
      /A sua frase/.test((await page.evaluate(estado)).notaDaFrase),
      (await page.evaluate(estado)).notaDaFrase);

    console.log('\n10. A ORIENTAÇÃO DO CORPO ENTRA NO TRECHO — E É O OUTRO EIXO');
    await clicar('#vb-orient input[data-valor="croise"]');
    conferir('a orientação escolhida vê-se marcada',
      marcada((await page.evaluate(estado)).orientacoes) === 'croise',
      marcada((await page.evaluate(estado)).orientacoes));
    await clicar('#vb-orient input[data-valor="ecarte"]');
    conferir('e clicar noutra troca-a: uma só fica marcada',
      JSON.stringify((await page.evaluate(estado)).orientacoesMarcadas) === JSON.stringify(['ecarte']),
      (await page.evaluate(estado)).orientacoesMarcadas);
    await clicar('#vb-orient input[data-valor="en-face"]');
    conferir('clicar em «en face» volta à omissão, e a pílula fica marcada',
      marcada((await page.evaluate(estado)).orientacoes) === 'en-face',
      marcada((await page.evaluate(estado)).orientacoes));
    conferir('e o estado volta a vazio — é vazio que se grava',
      (await page.evaluate(estado)).orient === '',
      (await page.evaluate(estado)).orient);
    await clicar('#vb-orient input[data-valor="croise"]');

    console.log('\n11. ACRESCENTAR RECUSA O QUE FALTA, CAMPO A CAMPO');
    await noPassoDe('#vb-frase');
    await page.evaluate(() => {
      const d = document.getElementById('vb-frase');
      d.value = '';
      d.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vb-cel-acrescentar'); await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 250));
    conferir('a recusa nomeia a frase que falta, e o passo onde se escreve',
      /Falta a frase do verbete \(no passo 1\)/.test((await page.evaluate(estado)).recado),
      (await page.evaluate(estado)).recado);
    await noPassoDe('#vb-frase');
    await page.evaluate(() => {
      const d = document.getElementById('vb-frase');
      d.value = 'a perna sai em croisé e conduz à frente';
      d.dispatchEvent(new Event('input'));
    });
    ULTIMO_CORPO = null;
    await noPassoDe('#vb-cel-acrescentar'); await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 350));
    const acrescentado = await page.evaluate(estado);
    conferir('acrescentado, o trecho entra na tabela com a notação composta',
      /\[Pé: 1ª → \+ 1ª ●\]/.test(acrescentado.tabela[0].linhas.join(' ')),
      acrescentado.tabela[0].linhas);
    conferir('e a tabela mostra a ORIENTAÇÃO na sua coluna',
      /croisé/.test(acrescentado.tabela[0].linhas[acrescentado.tabela[0].linhas.length - 1] || ''),
      acrescentado.tabela[0].linhas);
    conferir('e a cobertura passa a contar os tempos dele',
      /Cobre 2 de 4 tempos/.test(acrescentado.cobertura), acrescentado.cobertura);

    console.log('\n12. A DIREÇÃO, A ORIENTAÇÃO E A FRASE FICAM — SÓ OS SINAIS SE LIMPAM');
    conferir('a direção continua marcada', marcada(acrescentado.direcoes) === 'devant',
      marcada(acrescentado.direcoes));
    conferir('a orientação continua marcada', marcada(acrescentado.orientacoes) === 'croise',
      marcada(acrescentado.orientacoes));
    conferir('as fichas é que se limpam', /Escolha a categoria/.test(acrescentado.chips),
      acrescentado.chips);
    // A FRASE NÃO SE LIMPA: era ela que obrigava a escrever a mesma coisa por cada trecho.
    conferir('a frase do verbete NÃO se limpa — é o que impede escrevê-la outra vez',
      acrescentado.frase === 'a perna sai em croisé e conduz à frente', acrescentado.frase);
    // O QUE FICA ESCRITO VÊ-SE NO ÚLTIMO PASSO: frase do verbete + «lê-se» do trecho.
    conferir('o último passo mostra o trecho composto — a frase e o «lê-se»',
      /a perna sai em croisé e conduz à frente/.test(acrescentado.fica)
        && /Lê-se: Pé, primeira posição, conduz a, à frente, primeira posição, fecha\./.test(acrescentado.fica),
      acrescentado.fica);

    console.log('\n13. A TABELA TEM QUATRO COLUNAS — A DA FRASE SAIU');
    // A QUINTA COLUNA ERA REDUNDANTE (31/10/2026). Com a frase a vir da definição do exercício,
    // todas as linhas diziam o mesmo; e a parte que muda por trecho (o «lê-se») é função da
    // notação, que já tem coluna. A pesquisadora viu-o e mandou tirá-la.
    const quatroColunas = await page.evaluate(estado);
    conferir('as tabelas têm quatro colunas, e não cinco',
      quatroColunas.colunasDaTabela.every((n) => n === 4), quatroColunas.colunasDaTabela);
    conferir('não há nenhum campo de frase dentro da tabela',
      (await page.evaluate(() => document.querySelectorAll('#vb-tabela input').length)) === 0);

    console.log('\n14. O QUE SE GRAVA LEVA A ORIENTAÇÃO — E NÃO A LEVA QUANDO É EN FACE');
    ULTIMO_CORPO = null;
    await page.evaluate(() => {
      const f = document.getElementById('form-verbete');
      if (f) f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 700));
    const corpo = ULTIMO_CORPO;
    const gravadas = (corpo && corpo.verbete && corpo.verbete.celulas) || null;
    const diagnostico = { semCorpo: corpo === null, recado: (await page.evaluate(estado)).recado, dialogos };
    conferir('o corpo gravado tem a célula nova',
      Boolean(gravadas && Array.isArray(gravadas.devant) && gravadas.devant.length),
      gravadas || diagnostico);
    const nova = gravadas && gravadas.devant ? gravadas.devant[gravadas.devant.length - 1] : null;
    conferir('e ela leva `orientacao: croise`', Boolean(nova) && nova.orientacao === 'croise',
      nova || diagnostico);
    // A FRASE GRAVADA É A DO CAMPO (31/10/2026) — definição + «lê-se», em duas linhas. A tabela
    // deixou de a mostrar, e por isso é aqui que se mede que ela não se perdeu.
    conferir('a frase gravada é a do campo, com as duas linhas',
      Boolean(nova) && /Lê-se:/.test(nova.descricao || ''), nova || diagnostico);
    conferir('o botão de gravar não inventa o campo nas células antigas',
      Boolean(gravadas) && gravadas.devant.every((c, i) => i === gravadas.devant.length - 1
        || !('orientacao' in c)), gravadas && gravadas.devant);

    console.log('\n15. O «×» TIRA O TRECHO — E O QUE FICA É O QUE SE GRAVA');
    // Volta a 8/4/4, que tem células no alfabeto: é onde o «×» se pode medir sem deixar a
    // direção vazia. Depois do submit a lista é recarregada, e é isso que se quer ver.
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 500));
    const antesDeTirar = await page.evaluate(estado);
    const linhasAntes = antesDeTirar.tabela[0].linhas.length;
    await page.evaluate(() => {
      // O «×» da PRIMEIRA tabela — a da direção «à frente», que é a que se está a medir.
      const botoes = [...document.querySelectorAll('#vb-tabela table')[0]
        .querySelectorAll('button[data-tirar]')];
      botoes[botoes.length - 1].click();
    });
    await new Promise((r) => setTimeout(r, 300));
    const depoisDeTirar = await page.evaluate(estado);
    conferir('o «×» tira uma linha da tabela',
      depoisDeTirar.tabela[0].linhas.length === linhasAntes - 1,
      { antes: linhasAntes, depois: depoisDeTirar.tabela[0].linhas.length });
    conferir('e a cobertura diminui os tempos dela', depoisDeTirar.cobertura !== antesDeTirar.cobertura,
      { antes: antesDeTirar.cobertura, depois: depoisDeTirar.cobertura });

    console.log('\n16. UM EN CROIX INTEIRO: CADA TRECHO NO SEU BLOCO, E O COMPASSO CORRIDO');
    // O EXERCÍCIO SEM VERBETE é o caso de quem está a escrever de raiz — e era o caso dela:
    // battement frappé, 16 tempos, 2/4, três direções. O `Changement` do fixture não tem verbete
    // nenhum, e é por isso que a decomposição começa vazia.
    await noPassoDe('#vbnome'); await page.select('#vbnome', 'Changement');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '16';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 500));
    const vazio = await page.evaluate(estado);
    conferir('sem verbete, a decomposição está vazia nas três direções',
      vazio.tabela.length === 3 && vazio.tabela.every((t) => /não vai/.test(t.linhas.join(' '))),
      vazio.tabela.map((t) => t.direcao));
    conferir('e a mesma direção oferece 1 e 1–2 em 2/4',
      JSON.stringify(valores(vazio.contagens)) === JSON.stringify(['1', '1–2']), valores(vazio.contagens));

    /** Acrescenta um trecho na direção dada, com a PRIMEIRA contagem que a tela oferecer. */
    // A FRASE É ESCRITA UMA VEZ PARA O EXERCÍCIO (31/10/2026). Era o parâmetro que obrigava a
    // repeti-la em cada trecho — e é isso que a prova agora impede: quem acrescenta três trechos
    // não volta a escrever a mesma frase.
    const escreverFrase = async (texto) => {
      await noPassoDe('#vb-frase');
      await page.evaluate((f) => {
        const d = document.getElementById('vb-frase');
        d.value = f;
        d.dispatchEvent(new Event('input'));
      }, texto);
    };
    const acrescentar = async (dir) => {
      await noPassoDe('#vb-dir');
      await clicar('#vb-dir input[data-valor="' + dir + '"]');
      const oferecidas = valores((await page.evaluate(estado)).contagens);
      await clicar('#vb-contagem input[data-valor="' + oferecidas[0] + '"]');
      for (const sg of ['1ª', '→', '+']) await clicar('#vb-sinais input[data-sinal="' + sg + '"]');
      await noPassoDe('#vb-cel-acrescentar'); await page.click('#vb-cel-acrescentar');
      await new Promise((r) => setTimeout(r, 400));
      return oferecidas;
    };

    await escreverFrase('o pé bate e volta');
    const offDevant = await acrescentar('devant');
    await acrescentar('a-la-seconde');
    await acrescentar('derriere');
    const croix = await page.evaluate(estado);
    conferir('o trecho de «à frente» está no bloco de «à frente», e não noutro',
      croix.tabela[0].linhas.length === 1 && /compasso 1 \| 1 \|/.test(croix.tabela[0].linhas[0]),
      croix.tabela.map((t) => ({ d: t.direcao, l: t.linhas })));
    conferir('e o de «atrás» está no bloco de «atrás»',
      /compasso 2 \|/.test((croix.tabela[2].linhas[0] || '')), croix.tabela[2].linhas);
    // A CONTAGEM CONTINUA ONDE O COMPASSO ESTÁ (29/10/2026) — em 2/4, «à frente» ocupa o tempo 1
    // e «ao lado» tem de ocupar o 2, senão dois trechos caem no mesmo tempo.
    conferir('a contagem de «ao lado» é 2, e não 1 — o compasso é corrido',
      /\| 2 \|/.test(croix.tabela[1].linhas[0] || ''), croix.tabela[1].linhas);
    conferir('e a de «atrás» recomeça em 1, no compasso 2',
      /compasso 2 \| 1 \|/.test(croix.tabela[2].linhas[0] || ''), croix.tabela[2].linhas);
    conferir('a cobertura soma os três tempos', /Cobre 3 de 16 tempos/.test(croix.cobertura),
      croix.cobertura);
    // A FRASE FOI ESCRITA UMA VEZ E ESTÁ NOS TRÊS (31/10/2026). É a asserção que fecha o defeito
    // que ela descreveu: antes, cada trecho obrigava a escrever outra vez «o que acontece».
    conferir('a frase do verbete entra nos três trechos, sem se escrever três vezes',
      (croix.fica.match(/o pé bate e volta/g) || []).length === 3,
      { vezes: (croix.fica.match(/o pé bate e volta/g) || []).length, fica: croix.fica });
    conferir('a segunda direção já não ofereceu o tempo 1',
      JSON.stringify(offDevant) === JSON.stringify(['1', '1–2']) && !croix.tabela[1].linhas.length === false,
      offDevant);

    console.log('\n17. A DEFINIÇÃO DO EXERCÍCIO PRÉ-ENCHE «O QUE ACONTECE»');
    // O CASO QUE ORIGINOU ISTO (31/10/2026): a pesquisadora escreveu o primeiro verbete a sério,
    // de Rond de jambe en l'air, e em cada um dos três trechos o campo — vazio, e sem nada que
    // dissesse o que ele quer — recebeu o NOME do exercício. A definição do vocabulário passa a
    // ser a versão de partida.
    await noPassoDe('#vbnome'); await page.select('#vbnome', 'Rond de jambe en l’air');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 500));
    const comDefinicao = await page.evaluate(estado);
    conferir('escolhido o exercício, o campo já traz a definição do vocabulário',
      comDefinicao.frase === 'Círculo da perna no ar.', comDefinicao.frase);
    conferir('e a nota diz de QUE exercício é a definição',
      /Rond de jambe en l’air/.test(comDefinicao.notaDaFrase), comDefinicao.notaDaFrase);
    conferir('a definição aparece SEM sinal nenhum escolhido — ela não depende do trecho',
      comDefinicao.chips.length > 0 && !/1\./.test(comDefinicao.chips), comDefinicao.chips);
    conferir('e nada ainda foi acrescentado, por isso não há «lê-se» a mostrar',
      /Ainda não há trechos/.test(comDefinicao.fica), comDefinicao.fica);
    // A DEFINIÇÃO NÃO É TEXTO A REESCREVER: quem ajustou não a vê voltar sozinha.
    await escreverFrase('o círculo da perna no ar, a partir do retiré');
    await noPassoDe('#vb-dir');
    await clicar('#vb-dir input[data-valor="devant"]');
    await clicar('#vb-contagem input[data-valor="1"]');
    // Os sinais do fixture (a lista real tem 18; aqui bastam dois para compor a leitura).
    for (const sg of ['-', '1ª']) await clicar('#vb-sinais input[data-sinal="' + sg + '"]');
    await noPassoDe('#vb-cel-acrescentar'); await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 400));
    const ajustada = await page.evaluate(estado);
    conferir('a frase ajustada sobrevive a escolher a direção e os sinais',
      ajustada.frase === 'o círculo da perna no ar, a partir do retiré', ajustada.frase);
    conferir('e o «lê-se» aparece no trecho, em palavras, por baixo da frase',
      /primeira posição/.test(ajustada.fica)
        && /Lê-se: Pé, ao lado, primeira posição\./.test(ajustada.fica),
      ajustada.fica);

    console.log('\n18. UM TRECHO ACRESCENTADO PODE SER CORRIGIDO — E É O PEDIDO DELA');
    // «quando eu acrescento um trecho, seria bom que eu pudesse editar esse trecho». A correcção
    // atravessa os dois passos do trecho, e é por isso que ela é um ESTADO: o aviso, o «!» nos
    // dois números da tira, o rótulo do botão do último passo e a linha da tabela têm todos de
    // saber.
    // Um trecho novo, num exercício sem verbete: é o caso de quem está a escrever de raiz, e é
    // onde a edição se mede sem depender do alfabeto de exemplo.
    await noPassoDe('#vbnome');
    await page.select('#vbnome', 'Changement');
    await noPassoDe('#vbtempos');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso');
    await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 500));
    await escreverFrase('o pé bate e troca');
    const oferecidas = await acrescentar('devant');
    await irA(ULTIMO);
    const comTrecho = await page.evaluate(estado);
    const botoesDaLinha = await page.evaluate(
      () => [...document.querySelectorAll('#vb-tabela button')].map((b) => b.textContent.trim()));
    conferir('a linha do trecho tem «Editar» e «×»',
      botoesDaLinha.indexOf('Editar') !== -1 && botoesDaLinha.indexOf('×') !== -1, botoesDaLinha);

    await page.evaluate(() => { document.querySelector('#vb-tabela button[data-editar]').click(); });
    await new Promise((r) => setTimeout(r, 400));
    const emEdicao = await page.evaluate(estado);
    conferir('«Editar» leva ao passo 3, que é onde a correcção começa', emEdicao.passo === 3, emEdicao.passo);
    conferir('o aviso de edição está à vista e diz qual é o trecho',
      emEdicao.avisoDeEdicao !== null && /trecho 1/.test(emEdicao.avisoDeEdicao), emEdicao.avisoDeEdicao);
    conferir('a tira acende o «!» — e só nos passos do trecho',
      emEdicao.tiraEditando === 'sim' && emEdicao.alertasVisiveis === 2,
      { tira: emEdicao.tiraEditando, alertas: emEdicao.alertasVisiveis });
    conferir('os valores do trecho estão carregados nas pílulas',
      emEdicao.direcoesMarcadas.length === 1 && emEdicao.contagensMarcadas.length === 1,
      { dir: emEdicao.direcoesMarcadas, cont: emEdicao.contagensMarcadas });
    conferir('e a contagem carregada é a DELE — a edição não desloca o trecho',
      emEdicao.contagensMarcadas[0] === oferecidas[0],
      { carregada: emEdicao.contagensMarcadas, era: oferecidas });
    conferir('o botão do último passo passa a «Guardar a alteração»',
      emEdicao.rotuloDoBotao === 'Guardar a alteração', emEdicao.rotuloDoBotao);

    // A LINHA EM EDIÇÃO, VISTA DO ÚLTIMO PASSO: marcada, sem «×» e com «Cancelar».
    await irA(ULTIMO);
    const linhaEmEdicao = await page.evaluate(estado);
    conferir('a linha em edição está marcada e não tem «×»',
      linhaEmEdicao.linhaEmEdicao === true && linhaEmEdicao.temBotaoTirar === false,
      { marcada: linhaEmEdicao.linhaEmEdicao, tirar: linhaEmEdicao.temBotaoTirar });

    // CANCELAR: nada muda, e volta-se à decomposição.
    await page.evaluate(() => { document.getElementById('vb-cancelar-edicao').click(); });
    await new Promise((r) => setTimeout(r, 400));
    const cancelado = await page.evaluate(estado);
    conferir('«Cancelar a edição» volta ao último passo', cancelado.passo === ULTIMO, cancelado.passo);
    conferir('e apaga o modo: o aviso e o «!» desaparecem',
      cancelado.avisoDeEdicao === null && cancelado.tiraEditando === 'nao',
      { aviso: cancelado.avisoDeEdicao, tira: cancelado.tiraEditando });
    conferir('o trecho continua na tabela, intacto',
      cancelado.linhasDaTabela === comTrecho.linhasDaTabela,
      { antes: comTrecho.linhasDaTabela, depois: cancelado.linhasDaTabela });

    console.log('\n19. OS CINCO PASSOS FORA DO FORMULÁRIO, E A LISTAGEM AO LADO');
    // OS CINCO PASSOS (01/11/2026). A tira é a navegação e o resumo; se um passo desaparecer
    // dela, o painel dele fica inalcançável. Eram sete — e a fusão do exercício, da frase e da
    // posição num só é uma decisão dela, não uma simplificação minha: a prova guarda os cinco,
    // senão volta a sete por inércia, ou a seis, que é como estava antes de nascer o sétimo.
    //
    // O ESTADO É PREPARADO, E NÃO HERDADO DO QUE A SECÇÃO 18 DEIXOU. A tira passou a resumir o
    // passo 1 com o nome E a posição, e para o medir é preciso um exercício com as duas coisas
    // escolhidas — o «Changement» da secção 18 não tem verbete no alfabeto de exemplo, e sem
    // posição o valor certo é só o nome.
    await irA(1);
    await page.select('#vbnome', 'Battement tendu');
    await new Promise((r) => setTimeout(r, 500));
    await page.select('#vbposicao', 'premiere-position');
    await new Promise((r) => setTimeout(r, 300));
    const tira = await page.evaluate(() => ({
      numeros: [...document.querySelectorAll('#vb-tira button.passo')]
        .map((b) => b.getAttribute('data-passo')),
      rotulos: [...document.querySelectorAll('#vb-tira button.passo')]
        .map((b) => (b.querySelectorAll('.passo-t')[0] || {}).textContent.trim()),
      valores: [...document.querySelectorAll('#vb-tira .passo-t[id^=vb-v]')]
        .map((x) => x.textContent.trim()),
      paineis: [...document.querySelectorAll('#form-verbete .passo-painel')].map(
        (p) => p.getAttribute('data-passo')),
      // A TIRA TEM DE ESTAR FORA DO `<form>` (01/11/2026) — é o desenho da turma, e é o que ela
      // pediu. `closest` conta a história inteira: se a tira voltar para dentro, isto falha.
      dentroDoFormulario: Boolean(document.getElementById('vb-tira').closest('form')),
      antesDoFormulario: document.getElementById('vb-tira')
        .compareDocumentPosition(document.getElementById('form-verbete'))
        & Node.DOCUMENT_POSITION_FOLLOWING ? true : false,
      // E O MESMO BLOCO: a tira e o formulário vivem na coluna da esquerda, e a lista na direita.
      tiraNaColunaDoFormulario: Boolean(document.getElementById('vb-tira')
        .closest('.col-form')),
    }));
    conferir('a tira tem cinco passos, numerados de 1 a 5',
      JSON.stringify(tira.numeros) === JSON.stringify(['1', '2', '3', '4', '5']),
      tira.numeros);
    conferir('e o segundo é a música — o resto mudou de número, não de sítio',
      tira.rotulos[1] === 'A música', tira.rotulos);
    conferir('o passo 1 juntou o exercício, a frase e a posição', tira.rotulos[0] === 'O exercício',
      tira.rotulos);
    conferir('e a tira diz o nome do exercício com a posição, e não a frase',
      /Battement tendu · Première position/.test(tira.valores[0]), tira.valores);
    // UM PASSO PODE TER MAIS DE UM PAINEL (o 1 tem dois: o par do exercício, que o modo B bloqueia,
    // e a frase com a posição). O que se exige é que TODO o número da tira tenha painel.
    conferir('cada passo da tira tem o seu painel no formulário',
      [...new Set(tira.paineis)].sort().join(',') === '1,2,3,4,5'
        && tira.paineis.length >= tira.numeros.length,
      tira.paineis);
    conferir('a tira está FORA do formulário, e antes dele',
      tira.dentroDoFormulario === false && tira.antesDoFormulario === true, tira);
    conferir('e vive na coluna do formulário, como a faixa da turma',
      tira.tiraNaColunaDoFormulario === true, tira.tiraNaColunaDoFormulario);

    // O PADRÃO DA SECÇÃO: FORMULÁRIO À ESQUERDA, LISTAGEM À DIREITA (01/11/2026). A 31/10/2026
    // ela tinha passado a uma coluna por causa dos sete passos; a fusão tirou a causa, e a secção
    // voltou a ser o que é em todas as outras. O que se mede é a GEOMETRIA: duas colunas, o
    // formulário na da esquerda, a listagem à direita dele — e presa, a rolar por dentro.
    const layout = await page.evaluate(() => {
      const sec = document.getElementById('sec-verbetes');
      const form = sec.querySelector('.col-form');
      const lista = sec.querySelector('.col-lista');
      const r = (e) => e.getBoundingClientRect();
      return {
        colunas: getComputedStyle(sec).gridTemplateColumns.split(' ').length,
        larguraSec: Math.round(r(sec).width),
        larguraForm: Math.round(r(form).width),
        direitaForm: Math.round(r(form).right),
        esquerdaLista: Math.round(r(lista).left),
        topoForm: Math.round(r(form).top),
        topoLista: Math.round(r(lista).top),
        presa: getComputedStyle(lista).position,
        transbordo: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    conferir('a secção dos verbetes tem DUAS colunas, como as outras',
      layout.colunas === 2, layout);
    conferir('e o formulário fica à esquerda, com a largura da coluna dele',
      layout.larguraForm < layout.larguraSec * 0.6 && layout.larguraForm > 400, layout);
    conferir('a listagem fica AO LADO, à direita do formulário',
      layout.esquerdaLista >= layout.direitaForm, layout);
    conferir('e começa no topo, como o formulário', Math.abs(layout.topoLista - layout.topoForm) <= 2,
      layout);
    conferir('volta a ser uma coluna presa', layout.presa === 'sticky', layout.presa);
    conferir('e as duas colunas cabem na largura da secção', layout.transbordo === 0, layout);

    // AS ETIQUETAS DA LISTAGEM. Antes era o nome e a chave crua da música — «4 | 4/4 · 8 | 4/4»,
    // com o `|` a vazar para a tela. Agora a posição vai em selo e o complemento diz as direções,
    // o compasso, em quantas músicas está escrito e quantos trechos tem.
    const linha = await page.evaluate(() => {
      const li = [...document.querySelectorAll('#lista-verbetes li')]
        .find((x) => /Battement tendu/.test(x.textContent)) || {};
      return {
        selos: [...(li.querySelectorAll ? li.querySelectorAll('.selo') : [])]
          .map((x) => x.textContent.trim()),
        dono: ((li.querySelector ? li.querySelector('.dono') : null) || {}).textContent || '',
        botao: Boolean(li.querySelector && li.querySelector('button.verbetes-editar')),
      };
    });
    conferir('a posição do exercício vai num selo', linha.selos.indexOf('Première position') !== -1,
      linha.selos);
    conferir('e o complemento diz as direções, o compasso e os trechos',
      /à frente · atrás · ao lado/.test(linha.dono) && /4\/4/.test(linha.dono)
        && /2 músicas/.test(linha.dono) && /4 trechos/.test(linha.dono), linha.dono);
    conferir('o nome continua a ser o botão que abre o verbete', linha.botao, linha.botao);

    console.log('\n20. NADA TRANSBORDA, E O SCRIPT NÃO REBENTA');
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
  console.log('TUDO CERTO — ' + total + ' asserções: os dois modos não coexistem, os dois eixos');
  console.log('estão separados, os sinais compõem-se por clique sem se substituírem, a direção e');
  console.log('a orientação ficam, e a orientação é o que se grava com o trecho.');
})().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
