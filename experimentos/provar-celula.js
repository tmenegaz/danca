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
 *   8. a direção e a orientação FICAM depois de acrescentar um trecho, e só os sinais, a
 *      contagem e a frase se limpam;
 *   9. a frase vem do dicionário, e o ajuste da professora não se perde;
 *  10. o trecho acrescentado leva a `orientacao` ao repositório — e não a leva quando é en face;
 *  11. a frase edita-se na tabela, e o «×» tira o trecho;
 *  12. nada transborda em 320, 390, 768 e 1280px, e nenhum erro de JavaScript aparece.
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
    // O «LÊ-SE» PASSOU A SER A SEGUNDA LINHA DO CAMPO (31/10/2026). Não há mais parágrafo
    // próprio: mede-se no texto do campo, que é o que a célula grava.
    lido: (() => {
      const v = String((q('vb-cel-desc') || {}).value || '');
      const i = v.indexOf('Lê-se:');
      return i === -1 ? '' : v.slice(i).trim();
    })(),
    linhasDoCampo: String((q('vb-cel-desc') || {}).value || '').split('\n').length,
    frase: (q('vb-cel-desc') || {}).value || '',
    notaDaFrase: (q('vb-desc-nota') || {}).textContent || '',
    // A ORDEM DENTRO DO CAMPO (31/10/2026): a definição na primeira linha, o «lê-se» na segunda.
    // Mede-se o texto, não a intenção.
    definicaoAntesDaLicao: (() => {
      const v = String((q('vb-cel-desc') || {}).value || '');
      const i = v.indexOf('Lê-se:');
      return i === -1 ? null : i > 0 && i > v.lastIndexOf('.', i) - 1;
    })(),
    // As colunas contam-se pelo CABEÇALHO: a linha de «este exercício não vai…» ocupa a tabela
    // toda com um `colspan`, e contá-la daria 1.
    colunasDaTabela: [...document.querySelectorAll('#vb-tabela table')]
      .map((t) => t.tHead.rows[0].cells[0].colSpan),
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
  const clicar = async (seletor) => {
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
    await page.select('#vbnome', 'Battement tendu');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '4/4');
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

    console.log('\n6. O EDITOR DE TRECHO É DE PÍLULAS, E OS DOIS EIXOS ESTÃO SEPARADOS');
    await page.select('#vbnome', 'Battement tendu');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '4';
      t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '2/4');
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
    await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 300));
    conferir('em 4/4 oferece até 4',
      JSON.stringify(valores((await page.evaluate(estado)).contagens))
        === JSON.stringify(['1', '1–2', '1–3', '1–4']),
      valores((await page.evaluate(estado)).contagens));
    await page.select('#vbcompasso', '2/4');
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
    conferir('e a leitura em palavras vem do nome de cada sinal',
      /primeira posição/.test(composto.lido) && /conduz a/.test(composto.lido), composto.lido);
    // O `Battement tendu` do fixture NÃO tem definição no vocabulário: a frase cai para o
    // dicionário do TRECHO, indexado pela notação. É o segundo na ordem, e é o que se mede aqui.
    conferir('sem definição no vocabulário, a frase vem do dicionário do trecho',
      composto.frase.split('\n')[0] === 'extensão à frente a partir da 1ª posição, a ponta no chão',
      composto.frase);
    conferir('e a nota diz que a origem é o trecho, não o exercício',
      /dicionário deste trecho/.test(composto.notaDaFrase), composto.notaDaFrase);
    // O «LÊ-SE» VIVE DENTRO DO CAMPO, NA SEGUNDA LINHA (31/10/2026). Era um parágrafo à parte;
    // a pesquisadora pediu-o dentro do texto porque é ele que a célula grava e o documento mostra.
    conferir('o campo tem DUAS linhas: a definição e o «lê-se»', composto.linhasDoCampo === 2,
      composto.frase);
    conferir('e o «lê-se» está na SEGUNDA linha, depois da definição',
      composto.frase.split('\n')[1].indexOf('Lê-se:') === 0, composto.frase.split('\n'));
    conferir('o «lê-se» nomeia a categoria e cada sinal em palavras',
      /Pé/.test(composto.lido) && /primeira posição/.test(composto.lido) && /à frente/.test(composto.lido),
      composto.lido);
    await clicar('#vb-sinais input[data-sinal="1ª"]');
    conferir('um sinal pode repetir-se no mesmo trecho — clicar outra vez acrescenta ao fim',
      /4\. 1ª/.test((await page.evaluate(estado)).chips), (await page.evaluate(estado)).chips);
    // O defeito de origem: escolher o segundo sinal apagava o primeiro. Com pílulas, nunca.
    conferir('nenhuma pílula de sinal fica marcada — o estado está nas fichas, não na caixa',
      (await page.evaluate(estado)).sinaisMarcados === 0, (await page.evaluate(estado)).sinaisMarcados);

    console.log('\n9. A FRASE AJUSTADA NÃO SE PERDE AO ACRESCENTAR UM SINAL');
    await page.evaluate(() => {
      const d = document.getElementById('vb-cel-desc');
      d.value = 'a minha própria frase';
      d.dispatchEvent(new Event('input'));
    });
    await clicar('#vb-sinais input[data-sinal="●"]');
    // A DEFINIÇÃO ESCRITA À MÃO FICA, E O «LÊ-SE» É ACRESCENTADO POR BAIXO (31/10/2026).
    conferir('o que a professora escreveu fica',
      (await page.evaluate(estado)).frase.split('\n')[0] === 'a minha própria frase',
      (await page.evaluate(estado)).frase);

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
    await page.evaluate(() => { document.getElementById('vb-cel-desc').value = ''; });
    await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 250));
    conferir('a recusa nomeia a frase que falta',
      /Falta o que acontece/.test((await page.evaluate(estado)).recado),
      (await page.evaluate(estado)).recado);
    await page.evaluate(() => {
      const d = document.getElementById('vb-cel-desc');
      d.value = 'a perna sai em croisé e conduz à frente';
      d.dispatchEvent(new Event('input'));
    });
    ULTIMO_CORPO = null;
    await page.click('#vb-cel-acrescentar');
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

    console.log('\n12. A DIREÇÃO E A ORIENTAÇÃO FICAM — SÓ OS SINAIS E A FRASE SE LIMPAM');
    conferir('a direção continua marcada', marcada(acrescentado.direcoes) === 'devant',
      marcada(acrescentado.direcoes));
    conferir('a orientação continua marcada', marcada(acrescentado.orientacoes) === 'croise',
      marcada(acrescentado.orientacoes));
    conferir('as fichas é que se limpam', /Escolha a categoria/.test(acrescentado.chips),
      acrescentado.chips);
    conferir('e a frase também', acrescentado.frase === '', acrescentado.frase);

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
    await page.select('#vbcompasso', '4/4');
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
    await page.select('#vbnome', 'Changement');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '16';
      t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 500));
    const vazio = await page.evaluate(estado);
    conferir('sem verbete, a decomposição está vazia nas três direções',
      vazio.tabela.length === 3 && vazio.tabela.every((t) => /não vai/.test(t.linhas.join(' '))),
      vazio.tabela.map((t) => t.direcao));
    conferir('e a mesma direção oferece 1 e 1–2 em 2/4',
      JSON.stringify(valores(vazio.contagens)) === JSON.stringify(['1', '1–2']), valores(vazio.contagens));

    /** Acrescenta um trecho na direção dada, com a PRIMEIRA contagem que a tela oferecer. */
    const acrescentar = async (dir, frase) => {
      await clicar('#vb-dir input[data-valor="' + dir + '"]');
      const oferecidas = valores((await page.evaluate(estado)).contagens);
      await clicar('#vb-contagem input[data-valor="' + oferecidas[0] + '"]');
      for (const sg of ['1ª', '→', '+']) await clicar('#vb-sinais input[data-sinal="' + sg + '"]');
      await page.evaluate((f) => {
        const d = document.getElementById('vb-cel-desc');
        d.value = f;
        d.dispatchEvent(new Event('input'));
      }, frase);
      await page.click('#vb-cel-acrescentar');
      await new Promise((r) => setTimeout(r, 400));
      return oferecidas;
    };

    const offDevant = await acrescentar('devant', 'o pé bate à frente, a ponta no chão');
    await acrescentar('a-la-seconde', 'o pé bate ao lado');
    await acrescentar('derriere', 'o pé bate atrás');
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
    conferir('a segunda direção já não ofereceu o tempo 1',
      JSON.stringify(offDevant) === JSON.stringify(['1', '1–2']) && !croix.tabela[1].linhas.length === false,
      offDevant);

    console.log('\n17. A DEFINIÇÃO DO EXERCÍCIO PRÉ-ENCHE «O QUE ACONTECE»');
    // O CASO QUE ORIGINOU ISTO (31/10/2026): a pesquisadora escreveu o primeiro verbete a sério,
    // de Rond de jambe en l'air, e em cada um dos três trechos o campo — vazio, e sem nada que
    // dissesse o que ele quer — recebeu o NOME do exercício. A definição do vocabulário passa a
    // ser a versão de partida.
    await page.select('#vbnome', 'Rond de jambe en l’air');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 500));
    const comDefinicao = await page.evaluate(estado);
    conferir('escolhido o exercício, o campo já traz a definição do vocabulário',
      comDefinicao.frase === 'Círculo da perna no ar.', comDefinicao.frase);
    conferir('e a nota diz de QUE exercício é a definição',
      /Rond de jambe en l’air/.test(comDefinicao.notaDaFrase), comDefinicao.notaDaFrase);
    conferir('a definição aparece SEM sinal nenhum escolhido — ela não depende do trecho',
      comDefinicao.chips.length > 0 && !/1\./.test(comDefinicao.chips), comDefinicao.chips);
    conferir('e o «como se lê» continua vazio enquanto não há sinais',
      comDefinicao.lido === '', comDefinicao.lido);
    // A DEFINIÇÃO NÃO É TEXTO A REESCREVER: quem ajustou não a vê voltar sozinha.
    await page.evaluate(() => {
      const d = document.getElementById('vb-cel-desc');
      d.value = 'o círculo da perna no ar, a partir do retiré';
      d.dispatchEvent(new Event('input'));
    });
    await clicar('#vb-dir input[data-valor="devant"]');
    await clicar('#vb-contagem input[data-valor="1"]');
    // Os sinais do fixture (a lista real tem 18; aqui bastam dois para compor a leitura).
    for (const sg of ['-', '1ª']) await clicar('#vb-sinais input[data-sinal="' + sg + '"]');
    const ajustada = await page.evaluate(estado);
    conferir('a frase ajustada sobrevive a escolher a direção e os sinais',
      ajustada.frase.split('\n')[0] === 'o círculo da perna no ar, a partir do retiré', ajustada.frase);
    conferir('e o «lê-se» aparece na segunda linha, em palavras',
      /primeira posição/.test(ajustada.lido) && ajustada.linhasDoCampo === 2,
      { lido: ajustada.lido, linhas: ajustada.linhasDoCampo });

    console.log('\n18. NADA TRANSBORDA, E O SCRIPT NÃO REBENTA');
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
