#!/usr/bin/env node
'use strict';

/**
 * provar-tabela-da-notacao.js — A NOTAÇÃO EM TRÊS COLUNAS, E O TRECHO QUE NÃO ESTICA A TELA
 * (03/11/2026).
 *
 * OS DOIS PEDIDOS DELA, e o que cada um corrige:
 *
 *   1. A TABELA DA LISTAGEM TINHA DUAS COLUNAS e uma delas era «o que acontece» — a definição do
 *      exercício, escrita por inteiro em CADA linha. Com dois trechos, duas vezes a mesma frase;
 *      com oito, oito. E o compasso e a contagem dividiam uma célula, com a frequência de fora.
 *      Passa a três colunas — `compasso`, `contagem` (com a frequência escrita: «1–2 (duas
 *      vezes)») e `notação` —, e a definição sobe para o topo do bloco, UMA VEZ.
 *
 *   2. O PASSO 6 CRESCIA SEM PARAR. O bloco «o que fica escrito em cada trecho» despejava, por
 *      trecho, dois parágrafos abertos. Passa a um `<details>` por trecho, FECHADO por omissão.
 *
 * O QUE SE MEDE, e em que camada:
 *
 *   · O DADO QUE A LISTAGEM RECEBE (servidor): `detalhePorMusica` passa a levar `repeticoes` em
 *     cada linha. Sem isso a coluna da contagem não tinha o que escrever.
 *   · A TELA (jsdom, com a página de verdade): abre-se o painel da notação pelo «?» e contam-se as
 *     colunas, as frases e as dobras. Não se lê o texto do JS — mede-se o DOM depois do gesto.
 *
 * O QUE NÃO SE MEDE AQUI, e fica dito: PIXÉIS. Não há navegador nesta bancada (o `puppeteer` não
 * está instalado), portanto a altura da página não é medida — mede-se o TEXTO que fica à vista
 * quando as dobras estão fechadas, que é a causa da altura. A geometria em navegador de verdade
 * é a `provar-celular`/`provar-producao`, e continua a ser a que vale.
 *
 *   node experimentos/provar-tabela-da-notacao.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const verbete = require(path.join(RAIZ, 'motor/servidor/verbete.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const notacao = require(path.join(RAIZ, 'motor/nucleo/notacao.js'));

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const P = (rel) => path.join(RAIZ, 'biblioteca', 'modalidades', 'bale-classico', rel);
const lerJson = (rel) => JSON.parse(fs.readFileSync(rel, 'utf8'));

/** Um GitHub de mentira — o mesmo contrato das outras provas: lê, honra o `sha` e grava. */
function githubFalso(inicial) {
  const arquivos = new Map(Object.entries(inicial));
  const f = async (url, opcoes) => {
    const caminho = String(url).split('/contents/')[1].split('?')[0];
    if ((opcoes && opcoes.method) === 'PUT') {
      const corpo = JSON.parse(opcoes.body);
      const atual = arquivos.get(caminho);
      if (atual && corpo.sha && corpo.sha !== atual.sha) {
        return new Response(JSON.stringify({ message: 'sha mismatch' }), { status: 409 });
      }
      const texto = Buffer.from(corpo.content, 'base64').toString('utf8');
      arquivos.set(caminho, { sha: 'sha-' + (arquivos.size + 1), conteudo: texto });
      return new Response(JSON.stringify({ commit: { sha: 'c-' + arquivos.size } }), { status: 200 });
    }
    const atual = arquivos.get(caminho);
    if (!atual) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify({
      sha: atual.sha,
      content: Buffer.from(atual.conteudo, 'utf8').toString('base64'),
    }), { status: 200 });
  };
  return { f, arquivos };
}

function criarKv() {
  const mapa = new Map();
  return {
    async get(k) { return mapa.has(k) ? mapa.get(k) : null; },
    async put(k, v) { mapa.set(k, String(v)); },
    async delete(k) { mapa.delete(k); },
    async list() { return { keys: [...mapa.keys()].map((name) => ({ name })) }; },
  };
}

/* O ALFABETO DA PROVA É O CASO DELA, LIDO DO REPOSITÓRIO. O «Battement tendu» que ela gravou tem
 * dois trechos, `1–2` repetido duas vezes cada, em 2/4 — e é essa a forma que se planta aqui: dois
 * compostos de dois compassos, o primeiro em 1 e o segundo em 3. A frase é a MESMA nos dois, que é
 * o que fazia a tabela repeti-la. */
function alfabetoDaProva() {
  const alfa = lerJson(P('notacao.json'));
  const frase = 'Ação de estender a perna de trabalho no chão até a ponta do pé esticada ao máximo, '
    + 'mantendo o joelho rígido e o en dehors sem transferir o peso do corpo.';
  const celula = (dir) => ({
    contagem: '1–2',
    repeticoes: 2,
    categoria: 'Perna',
    sinais: ['ED', '1ª', '○', '-', '●', '1ª'],
    descricao: frase + '\nLê-se: Perna, varredura para fora, primeira posição, abre, ao lado.',
    ...(dir ? { orientacao: 'en-face' } : {}),
  });
  alfa.verbetes = {
    'Battement tendu': {
      '8|2/4': {
        cobre: 8,
        posicao: null,
        celulas: { 'a-la-seconde': [celula(true)], derriere: [celula(true)] },
      },
    },
    /* E UM SEGUNDO VERBETE COM DUAS FRASES DIFERENTES — o trecho antigo, guardado com a frase com
     * que foi escrito (P-03/P-04). As duas têm de aparecer, cada uma uma vez: escolher uma e calar
     * a outra seria perder a diferença em nome da limpeza. */
    'Plié': {
      '8|2/4': {
        cobre: 8,
        posicao: null,
        celulas: {
          '': [
            Object.assign(celula(false), { descricao: 'Frase de hoje.\nLê-se: desce e sobe.' }),
            Object.assign(celula(false), { descricao: 'Frase com que foi escrito.\nLê-se: desce.' }),
          ],
        },
      },
    },
  };
  return alfa;
}

// =====================================================================================
// A. O DADO — a linha da listagem leva a frequência
// =====================================================================================
function oDado() {
  console.log('\nA. O DADO QUE A LISTAGEM RECEBE — a linha leva a frequência');

  const alfa = alfabetoDaProva();
  // `listarVerbetes` é a função que a rota usa — a prova mede o mesmo caminho, não uma variante.
  const lista = verbete.listarVerbetes(alfa, 'breu');
  const item = lista.find((x) => x.nome === 'Battement tendu') || {};
  const musica = (item.porMusica || [])[0] || {};
  const linhas = musica.linhas || [];

  checar('a música foi lida com duas linhas', linhas.length === 2, linhas.map((l) => l.compasso));
  checar('…e cada linha traz a FREQUÊNCIA, que antes ficava de fora',
    linhas.length === 2 && linhas.every((l) => l.repeticoes === 2),
    linhas.map((l) => l.repeticoes));
  checar('…e a contagem que ela escreveu, intacta',
    linhas.length === 2 && linhas.every((l) => l.contagem === '1–2'),
    linhas.map((l) => l.contagem));
  checar('o primeiro trecho cai no compasso 1 e o segundo no 3 — dois compassos de 2/4 cada',
    linhas.map((l) => l.compasso).join(',') === '1,3', linhas.map((l) => l.compasso));
  checar('a linha traz a frase do exercício (a primeira da descrição, sem o «lê-se»)',
    linhas.every((l) => l.descricao.indexOf('Ação de estender') === 0 && l.descricao.indexOf('Lê-se') === -1),
    linhas.map((l) => l.descricao.slice(0, 40)));

  /* E O RECURSO — quando o motor não compõe, a listagem cai nos trechos gravados. A frequência
   * vem do mesmo `segmentosDe`, é a mesma conta. Mede-se aqui para não deixar a segunda metade da
   * leitura sem prova: o caminho da composição está acima, o dos trechos crus está aqui. */
  const crus = notacao.segmentosDe({ celulas: { '': [Object.assign(
    { contagem: '1–2', repeticoes: 3, categoria: 'Perna', sinais: ['ED'], descricao: 'x\nLê-se: y' },
  )] } }, 2).map((seg) => Number(seg.repeticoes) || 1);
  checar('o recurso (trechos gravados, sem composição) também conhece a frequência',
    crus.length === 1 && crus[0] === 3, crus);
}

// =====================================================================================
// B. A LISTAGEM — três colunas, e a definição uma vez
// =====================================================================================
async function aListagem() {
  console.log('\nB. A LISTAGEM — três colunas, e o «o que acontece» fora das linhas');

  const ALFABETO = alfabetoDaProva();
  const repo = githubFalso({
    [verbete.caminhoDoAlfabeto('bale-classico')]: {
      sha: 'sha-a', conteudo: JSON.stringify(ALFABETO, null, 2) + '\n',
    },
    [verbete.caminhoDoVocabulario('bale-classico')]: {
      sha: 'sha-v', conteudo: fs.readFileSync(P('vocabulario.json'), 'utf8'),
    },
  });
  const env = {
    ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't',
    PADD_KV: criarKv(),
  };
  const BASE = 'https://breu.tmenegaz77.workers.dev';

  const fetchDeVerdade = globalThis.fetch;
  globalThis.fetch = repo.f;

  const resposta = await bastidores.fetch(new Request(BASE + '/bastidores/estudio'), env);
  const html = await resposta.text();
  checar('a página da Produção é servida', resposta.status === 200 && html.length > 10000,
    { status: resposta.status, tamanho: html.length });

  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });

  const dom = new JSDOM(html, {
    url: BASE + '/bastidores/estudio',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.alert = () => {};
      w.confirm = () => true;
      w.fetch = async (u, i) => {
        const url = new URL(String(u), BASE + '/bastidores/estudio');
        if (url.pathname.indexOf('/api/') === 0) {
          const r = await bastidores.fetch(new Request(url.toString(), i), env);
          if (r) return r;
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        return new Response('', { status: 404 });
      };
    },
  });
  const w = dom.window;
  const d = w.document;
  const espera = (ms) => new Promise((r) => w.setTimeout(r, ms));

  let linhasDaLista = [];
  for (let i = 0; i < 60 && !linhasDaLista.length; i += 1) {
    await espera(25);
    linhasDaLista = Array.from(d.querySelectorAll('li.turma[data-verbete]'));
  }
  checar('a listagem trouxe os verbetes', linhasDaLista.length >= 2,
    linhasDaLista.map((l) => l.getAttribute('data-verbete')));

  const cartaoDe = (nome) => d.querySelector('li.turma[data-verbete="' + nome + '"]');
  const abrirNotacao = async (nome) => {
    const li = cartaoDe(nome);
    if (!li) return null;
    const b = li.querySelector('button.trio-item[data-balao="notacao"]');
    if (!b) return null;
    b.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    await espera(30);
    return li.querySelector('.trio-painel[data-painel="notacao"]');
  };

  // --- B1. O CASO DELA: dois trechos com a mesma frase ---------------------------------
  const painel = await abrirNotacao('Battement tendu');
  checar('o «?» da notação abre o painel', Boolean(painel) && painel.hidden === false,
    painel && painel.hidden);

  if (painel) {
    const ths = Array.from(painel.querySelectorAll('table thead th')).map((x) => x.textContent.trim());
    checar('a tabela tem TRÊS colunas: compasso, contagem e notação',
      ths.join('|') === 'compasso|contagem|notação', ths);
    checar('…e o «o que acontece» saiu do cabeçalho', ths.indexOf('o que acontece') === -1, ths);

    const frases = Array.from(painel.querySelectorAll('.trio-frase')).map((x) => x.textContent.trim());
    checar('a definição aparece UMA vez, acima da tabela', frases.length === 1, frases.length);
    checar('…e é a frase do exercício, inteira', frases.length === 1
      && frases[0].indexOf('Ação de estender a perna de trabalho') === 0, frases[0] && frases[0].slice(0, 40));

    const corpo = painel.querySelector('table tbody');
    checar('a definição NÃO se repete dentro das linhas',
      Boolean(corpo) && corpo.textContent.indexOf('Ação de estender') === -1,
      corpo && corpo.textContent.slice(0, 80));

    const trs = Array.from(painel.querySelectorAll('table tbody tr'));
    checar('são duas linhas', trs.length === 2, trs.length);
    const celulas = (tr) => Array.from(tr.querySelectorAll('td')).map((x) => x.textContent.trim());
    checar('a coluna do compasso diz 1 e 3',
      trs.length === 2 && celulas(trs[0])[0] === '1' && celulas(trs[1])[0] === '3',
      trs.map((t) => celulas(t)[0]));
    checar('a coluna da contagem diz a contagem E a frequência — «1–2 (duas vezes)»',
      trs.length === 2 && celulas(trs[0])[1] === '1–2 (duas vezes)' && celulas(trs[1])[1] === '1–2 (duas vezes)',
      trs.map((t) => celulas(t)[1]));
    checar('a coluna da notação mantém a forma sintética, como estava',
      trs.length === 2 && /^\[Perna: ED 1ª ○ - ● 1ª\]$/.test(celulas(trs[0])[2]),
      trs.map((t) => celulas(t)[2]));
    checar('…e a tabela da notação tem as TRÊS colunas por linha (nenhuma célula a menos)',
      trs.length === 2 && trs.every((t) => celulas(t).length === 3),
      trs.map((t) => celulas(t).length));
  }

  // --- B2. DUAS FRASES DIFERENTES: as duas aparecem, cada uma uma vez -----------------
  const painelP = await abrirNotacao('Plié');
  checar('o painel do «Plié» abre', Boolean(painelP) && painelP.hidden === false, painelP && painelP.hidden);
  if (painelP) {
    const frases = Array.from(painelP.querySelectorAll('.trio-frase')).map((x) => x.textContent.trim());
    checar('com duas frases diferentes, aparecem AS DUAS — cada uma uma vez', frases.length === 2, frases);
    checar('…e a frase de cada trecho não se perdeu',
      frases.indexOf('Frase de hoje.') !== -1 && frases.indexOf('Frase com que foi escrito.') !== -1, frases);
    const trs = Array.from(painelP.querySelectorAll('table tbody tr'));
    checar('…e as duas linhas continuam sem texto descritivo dentro',
      trs.length === 2 && trs.every((t) => !/Frase de/.test(t.textContent)),
      trs.map((t) => t.textContent.trim().slice(0, 40)));
  }

  // --- B3. A REPETIÇÃO SÓ APARECE QUANDO EXISTE ---------------------------------------
  const semRepetir = {
    cobre: 2, posicao: null,
    celulas: { '': [{ contagem: '1–2', categoria: 'Perna', sinais: ['ED'], descricao: 'frase curta' }] },
  };
  const so = verbete.listarVerbetes(
    { verbetes: { 'Battement tendu': { '8|2/4': semRepetir } }, sinonimos: {}, sinais: {} }, 'breu');
  const m = ((so[0] || {}).porMusica || [])[0] || {};
  checar('um trecho que acontece uma vez não ganha «(uma vez)»',
    (m.linhas || []).length === 1 && Number(m.linhas[0].repeticoes) === 1,
    (m.linhas || []).map((l) => l.repeticoes));

  checar('o script da página correu sem erro', problemas.length === 0, problemas);
  dom.window.close();
  globalThis.fetch = fetchDeVerdade;
}

// =====================================================================================
// C. O PASSO 6 — um trecho, uma dobra fechada
// =====================================================================================
async function oPasso6() {
  console.log('\nC. O PASSO 6 — um trecho, uma dobra FECHADA');

  const ALFABETO = alfabetoDaProva();
  const repo = githubFalso({
    [verbete.caminhoDoAlfabeto('bale-classico')]: {
      sha: 'sha-a', conteudo: JSON.stringify(ALFABETO, null, 2) + '\n',
    },
    [verbete.caminhoDoVocabulario('bale-classico')]: {
      sha: 'sha-v', conteudo: fs.readFileSync(P('vocabulario.json'), 'utf8'),
    },
  });
  const env = {
    ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't',
    PADD_KV: criarKv(),
  };
  const BASE = 'https://breu.tmenegaz77.workers.dev';

  const fetchDeVerdade = globalThis.fetch;
  globalThis.fetch = repo.f;

  const html = await (await bastidores.fetch(new Request(BASE + '/bastidores/estudio'), env)).text();
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });

  const dom = new JSDOM(html, {
    url: BASE + '/bastidores/estudio',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.alert = () => {};
      w.confirm = () => true;
      w.fetch = async (u, i) => {
        const url = new URL(String(u), BASE + '/bastidores/estudio');
        if (url.pathname.indexOf('/api/') === 0) {
          const r = await bastidores.fetch(new Request(url.toString(), i), env);
          if (r) return r;
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        return new Response('', { status: 404 });
      };
    },
  });
  const w = dom.window;
  const d = w.document;
  const espera = (ms) => new Promise((r) => w.setTimeout(r, ms));

  let botao = null;
  for (let i = 0; i < 60 && !botao; i += 1) {
    await espera(25);
    botao = Array.from(d.querySelectorAll('button.verbetes-editar'))
      .find((b) => b.getAttribute('data-musica') === '8|2/4') || null;
  }
  checar('a listagem traz o «Battement tendu» de 8|2/4', Boolean(botao),
    Array.from(d.querySelectorAll('button.verbetes-editar')).map((b) => b.getAttribute('data-musica')));
  if (!botao) { dom.window.close(); globalThis.fetch = fetchDeVerdade; return; }

  botao.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await espera(80);

  const fica = d.getElementById('vb-fica');
  checar('o bloco «o que fica escrito em cada trecho» existe', Boolean(fica));
  if (!fica) { dom.window.close(); globalThis.fetch = fetchDeVerdade; return; }

  const dobras = () => Array.from(fica.querySelectorAll('details[data-trecho]'));
  checar('há uma dobra por trecho', dobras().length === 2, dobras().length);
  checar('…e TODAS nascem fechadas', dobras().every((x) => x.open === false),
    dobras().map((x) => x.open));

  const resumos = dobras().map((x) => x.querySelector('summary').textContent.trim());
  checar('o resumo diz ONDE o trecho cai — direção, compasso e contagem',
    resumos.length === 2 && /compasso 1 · contagem 1–2 ×2/.test(resumos[0])
      && /compasso 3 · contagem 1–2 ×2/.test(resumos[1]), resumos);

  // A FRASE DO EXERCÍCIO FICA UMA VEZ, FORA DAS DOBRAS.
  const fora = Array.from(fica.children).filter((x) => x.tagName === 'P');
  checar('a frase do exercício aparece uma vez, no topo do bloco', fora.length === 1
    && /Frase/.test(fora[0].textContent) === false && fora[0].textContent.length > 0,
    fora.map((x) => x.textContent.slice(0, 40)));

  /* O QUE A TELA MOSTRA QUANDO ESTÁ FECHADA. Sem navegador não há pixéis a medir, portanto mede-se
   * a PROSA — que é a causa da altura. A pergunta é: quantos parágrafos de texto corrido ficam à
   * vista antes de a pessoa abrir alguma coisa? Era dois por trecho; passa a ser um, o do
   * exercício. Um parágrafo por dobra existe, mas fechado ele não é desenhado (é isso que
   * `details` faz), e a asserção seguinte prende-o à dobra em que ele vive. */
  const paragrafos = Array.from(fica.querySelectorAll('p'));
  const dentroDeDobra = paragrafos.filter((x) => x.closest('details[data-trecho]'));
  checar('à vista fica UM parágrafo, o do exercício — e não dois por trecho',
    paragrafos.length - dentroDeDobra.length === 1, {
      aVista: paragrafos.length - dentroDeDobra.length, dentroDasDobras: dentroDeDobra.length,
    });
  checar('…e a prosa de cada trecho está DENTRO de uma dobra fechada',
    dentroDeDobra.length === dobras().length
      && dentroDeDobra.every((x) => x.closest('details').open === false),
    dentroDeDobra.map((x) => [x.closest('details').getAttribute('data-trecho'), x.closest('details').open]));
  const textoTotal = fica.textContent.length;
  const textoFechado = dobras().reduce((n, x) => n + x.querySelector('summary').textContent.length, 0)
    + fora.reduce((n, x) => n + x.textContent.length, 0);
  console.log('    · medido: ' + textoFechado + ' de ' + textoTotal
    + ' caracteres ficam à vista com as dobras fechadas ('
    + Math.round(100 * textoFechado / textoTotal) + '% — o resto só a pedido)');

  // ABRIR MOSTRA O QUE É DAQUELE TRECHO — e só dele.
  dobras()[0].open = true;
  await espera(10);
  const corpo = dobras()[0].querySelector('p');
  checar('abrir a dobra mostra a leitura daquele trecho',
    Boolean(corpo) && /Lê-se: Perna, varredura para fora/.test(corpo.textContent),
    corpo && corpo.textContent.slice(0, 60));
  checar('…e a outra dobra continua fechada', dobras()[1].open === false, dobras().map((x) => x.open));

  /* REPINTAR NÃO FECHA O QUE ESTAVA ABERTO. A tela repinta a cada gesto — duplicar, mudar a
   * música —, e sem isto a dobra abria e fechava sozinha no gesto seguinte. */
  const duplicar = d.getElementById('vb-cel-duplicar');
  if (duplicar) duplicar.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await espera(60);
  const depois = dobras();
  checar('duplicar um trecho repinta o bloco', depois.length > 2, depois.length);
  checar('…e a dobra que estava aberta continua aberta',
    depois.some((x) => x.getAttribute('data-trecho') === 'a-la-seconde:0' && x.open === true),
    depois.map((x) => [x.getAttribute('data-trecho'), x.open]));
  checar('…e as novas nascem fechadas',
    depois.filter((x) => x.getAttribute('data-trecho') !== 'a-la-seconde:0').every((x) => !x.open),
    depois.map((x) => [x.getAttribute('data-trecho'), x.open]));

  // A TABELA DO PASSO 6 CONTINUA COM AS SUAS SEIS COLUNAS — a mudança foi na listagem, não aqui.
  const ths = Array.from(d.querySelectorAll('#vb-tabela thead th')).map((x) => x.textContent.trim());
  checar('a tabela do passo 6 continua a ter as seis colunas dela',
    ths.length === 6 && ths[0] === 'compasso' && ths[4] === 'notação', ths);
  const dentroDaTabela = Array.from(d.querySelectorAll('#vb-tabela details.dito'));
  checar('…e o «lê-se» de cada linha continua a nascer fechado',
    dentroDaTabela.length > 0 && dentroDaTabela.every((x) => x.open === false),
    dentroDaTabela.length);

  checar('o script da página correu sem erro', problemas.length === 0, problemas);
  dom.window.close();
  globalThis.fetch = fetchDeVerdade;
}

oDado();
aListagem().then(oPasso6).then(() => {
  console.log('');
  if (falhas) { console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).'); process.exit(1); }
  console.log('TUDO CERTO — a notação da listagem tem três colunas com a frequência escrita,');
  console.log('a definição aparece uma vez, e cada trecho do passo 6 é uma dobra fechada.');
}).catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
