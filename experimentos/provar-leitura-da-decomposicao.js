#!/usr/bin/env node
'use strict';

/**
 * provar-leitura-da-decomposicao.js — A LISTAGEM LÊ O QUE ESTÁ GRAVADO (03/11/2026).
 *
 * O DEFEITO RELATADO, com as palavras dela: criou o verbete do «Battement tendu» com **dois
 * trechos** (compasso 1 e compasso 3), e a listagem respondeu «A decomposição deste exercício não
 * pôde ser lida». O dado estava gravado e era válido — `cobre: 8`, duas células de 4 tempos na
 * mesma pista. O que falhava era a LEITURA, e falhava por três razões encadeadas:
 *
 *   1. a listagem compunha com o alfabeto do **bundle** (`require` do JSON), e não com o que
 *      `lerModalidade` acabara de ler do repositório;
 *   2. não passava a **escola** — e desde 03/11 o verbete de uma escola vive em `8|2/4@breu`, logo
 *      compor sem dono procurava a versão do catálogo, que não existe, e devolvia
 *      `musica-nao-coberta`;
 *   3. quando a composição não fechava, **deitava fora os trechos** que estavam gravados, em vez de
 *      os mostrar com a razão ao lado.
 *
 * O QUE SE MEDE: a resposta da rota `/api/bastidores/verbete` de uma escola, e a marcação da
 * página. Nada de texto de JS — o que se lê é o que a tela recebe.
 *
 * E o caso que ela descreveu como «salto»: uma contagem que começa em 5 depois de outra que ocupa
 * 1–4. O compasso que a lista mostra é o DERIVADO da acumulação (a régua do motor, por pista), e a
 * CONTAGEM que ela escreveu vai ao lado — nenhuma das duas se inventa, e a linha aparece.
 *
 *   node experimentos/provar-leitura-da-decomposicao.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'));

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const P = (rel) => path.join(RAIZ, 'biblioteca', 'modalidades', 'bale-classico', rel);
const ALFABETO = JSON.parse(fs.readFileSync(P('notacao.json'), 'utf8'));
const VOCABULARIO = fs.readFileSync(P('vocabulario.json'), 'utf8');

/** Um GitHub de mentira: serve os ficheiros que se lhe dão, e é só de leitura. */
function githubFalso(arquivos) {
  return async (url) => {
    const caminho = String(url).split('/contents/')[1].split('?')[0];
    if (!(caminho in arquivos)) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify({
      sha: 'sha-' + caminho.length,
      content: Buffer.from(arquivos[caminho], 'utf8').toString('base64'),
    }), { status: 200 });
  };
}

/** A célula, na forma que a Produção grava. */
const celula = (contagem, texto, extra) => Object.assign({
  contagem: contagem,
  categoria: 'Perna',
  sinais: ['ED', '1ª', '↓', '↑'],
  descricao: texto + '\nLê-se: Perna, varredura para fora, primeira posição, cede, sobe.',
}, extra || {});

async function comAlfabeto(verbetes, escola) {
  const alfabeto = JSON.parse(JSON.stringify(ALFABETO));
  alfabeto.verbetes = verbetes;
  const original = globalThis.fetch;
  globalThis.fetch = githubFalso({
    [ 'biblioteca/modalidades/bale-classico/notacao.json' ]: JSON.stringify(alfabeto, null, 2) + '\n',
    [ 'biblioteca/modalidades/bale-classico/vocabulario.json' ]: VOCABULARIO,
  });
  try {
    const env = {
      ESCOLA_SLUG: escola, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't',
      PADD_KV: { async get() { return null; }, async put() {}, async delete() {}, async list() { return { keys: [], list_complete: true }; } },
    };
    const r = await bastidores.fetch(new Request('https://e.workers.dev/api/bastidores/verbete'), env);
    const corpo = await r.json();
    const pagina = await bastidores.fetch(new Request('https://e.workers.dev/bastidores/producao'), env);
    return { status: r.status, corpo, html: await pagina.text() };
  } finally {
    globalThis.fetch = original;
  }
}

// =====================================================================================
// A. O CASO RELATADO — dois trechos, um deles no compasso 3
// =====================================================================================
async function oCasoRelatado() {
  console.log('\nA. O CASO RELATADO — dois trechos gravados na escola, e a lista tem de os ler');

  /* OS DOIS TRECHOS DO RELATÓRIO, na forma exacta em que ficaram no ficheiro: contagem 1–2 com
   * duas repetições (4 tempos cada) em duas direções, as duas da categoria Perna. Em 2/4, o
   * primeiro cai no compasso 1 e o segundo no 3 — é o «salto» que ela descreveu, e ele NÃO é um
   * salto: é a régua a contar dois compassos de 2 tempos. */
  const verbete = {
    escola: 'breu',
    cobre: 8,
    posicao: null,
    metodo: 'compartilhada',
    celulas: {
      'a-la-seconde': [celula('1–2', 'estende ao lado', { repeticoes: 2 })],
      'derriere': [celula('1–2', 'estende atrás', { repeticoes: 2 })],
    },
  };
  const dados = await comAlfabeto({ 'Battement tendu': { '8|2/4@breu': verbete } }, 'breu');
  const bt = (dados.corpo.exercicios || []).find((x) => x.nome === 'Battement tendu');

  checar('a rota responde 200', dados.status === 200, dados.status);
  checar('o exercício aparece na listagem da escola', Boolean(bt),
    (dados.corpo.exercicios || []).map((x) => x.nome));
  const m = (bt && bt.porMusica && bt.porMusica[0]) || {};
  checar('a música é a que foi gravada, sem o dono na chave', m.chave === '8|2/4', m.chave);
  checar('…e o dono vem declarado', m.escola === 'breu', m.escola);
  checar('os dois trechos são contados', m.trechos === 2, m.trechos);
  checar('E OS DOIS SÃO LIDOS — era aqui que a lista dizia «não pôde ser lida»',
    (m.linhas || []).length === 2, m.linhas);
  checar('…e sem motivo nenhum, porque a composição fechou', !m.motivo, m.motivo);
  checar('o primeiro trecho cai no compasso 1', (m.linhas || [])[0]
    && m.linhas[0].compasso === 1, m.linhas && m.linhas[0]);
  checar('…e o segundo no 3, porque cada trecho ocupa dois compassos de 2/4',
    (m.linhas || [])[1] && m.linhas[1].compasso === 3, m.linhas && m.linhas[1]);
  checar('a contagem que ela escreveu vai na linha, ao lado',
    (m.linhas || []).every((l) => l.contagem === '1–2'), (m.linhas || []).map((l) => l.contagem));
  checar('…e a frase do trecho também, sem o «lê-se»',
    (m.linhas || []).every((l) => l.descricao && l.descricao.indexOf('Lê-se') === -1),
    (m.linhas || []).map((l) => l.descricao));

  checar('a página NÃO diz que não pôde ser lida',
    dados.html.indexOf('não pôde ser lida') === -1);
  checar('…e a peça da notação existe', dados.html.indexOf('painelDaNotacao') !== -1);
}

// =====================================================================================
// B. A VISTA É A DA ESCOLA — outra escola não vê esta, e o catálogo também não
// =====================================================================================
async function aVistaDaEscola() {
  console.log('\nB. A VISTA — cada escola lê a sua; as outras leem o catálogo');

  const soDaBreu = { 'Battement tendu': { '8|2/4@breu': {
    escola: 'breu', cobre: 4,
    celulas: { devant: [celula('1–4', 'da breu')] },
  } } };

  const maria = await comAlfabeto(soDaBreu, 'maria');
  checar('a `maria` não vê o verbete que é só da `breu`',
    (maria.corpo.exercicios || []).every((x) => x.nome !== 'Battement tendu'),
    (maria.corpo.exercicios || []).map((x) => x.nome));

  /* A ROTA EXIGE UMA ESCOLA — não há vista «de catálogo» pela tela, e é assim que deve ser. O que
   * se prova é que UMA TERCEIRA escola também não vê o verbete da `breu`. */
  const ponta = await comAlfabeto(soDaBreu, 'ponta');
  checar('e uma terceira escola também não',
    (ponta.corpo.exercicios || []).every((x) => x.nome !== 'Battement tendu'),
    (ponta.corpo.exercicios || []).map((x) => x.nome));

  // As duas ao mesmo tempo: a escola vence a sua, o catálogo fica com a dele.
  const ambas = { 'Battement tendu': {
    '8|2/4': { cobre: 4, celulas: { devant: [celula('1–4', 'do catálogo')] } },
    '8|2/4@breu': { escola: 'breu', cobre: 4, celulas: { devant: [celula('1–4', 'da breu')] } },
  } };
  const daBreu = await comAlfabeto(ambas, 'breu');
  const btBreu = daBreu.corpo.exercicios.find((x) => x.nome === 'Battement tendu');
  checar('com as duas versões, a breu lê a dela', btBreu && btBreu.porMusica.length === 1
    && btBreu.porMusica[0].escola === 'breu', btBreu && btBreu.porMusica.map((x) => x.escola));

  const daMaria = await comAlfabeto(ambas, 'maria');
  const btMaria = daMaria.corpo.exercicios.find((x) => x.nome === 'Battement tendu');
  checar('…e a maria lê a do catálogo', btMaria && btMaria.porMusica.length === 1
    && btMaria.porMusica[0].escola === null, btMaria && btMaria.porMusica.map((x) => x.escola));
}

// =====================================================================================
// C. A LEITURA É RESILIENTE — a conta que não fecha não apaga o que está gravado
// =====================================================================================
async function aLeituraResiliente() {
  console.log('\nC. A LEITURA NÃO DEITA FORA O QUE ESTÁ GRAVADO');

  // A MÚSICA DECLARA 8 E OS TRECHOS OCUPAM 4: a conta não fecha — e é isso que a listagem tem de
  // DIZER, sem esconder as quatro linhas que existem.
  const desacordo = { 'Battement tendu': { '8|2/4': {
    cobre: 4,
    celulas: { devant: [celula('1–2', 'um'), celula('3–4', 'dois')] },
  } } };
  const d = await comAlfabeto(desacordo, 'breu');
  const m = d.corpo.exercicios.find((x) => x.nome === 'Battement tendu').porMusica[0];
  checar('a conta que não fecha não esconde as linhas', (m.linhas || []).length === 2, m.linhas);
  checar('…e a listagem diz o motivo', Boolean(m.motivo), m.motivo);
  checar('…e diz qual é o desacordo, com os dois números',
    /4/.test(String(m.motivo)) && /8/.test(String(m.motivo)), m.motivo);

  /* A CONTAGEM QUE COMEÇA EM 5 — o «salto» dito por ela. O motor deriva o compasso da acumulação,
   * por pista; o que se garante é que a linha APARECE e que a contagem escrita não se perde. */
  const salto = { 'Battement tendu': { '8|2/4': {
    cobre: 8,
    celulas: { devant: [
      celula('1–2', 'primeiro'), celula('5–6', 'depois do intervalo'),
      celula('7–8', 'e o último'),
    ] },
  } } };
  const s = await comAlfabeto(salto, 'breu');
  const ms = s.corpo.exercicios.find((x) => x.nome === 'Battement tendu').porMusica[0];
  checar('uma contagem fora de sequência (1–2 e depois 5–6) não quebra a leitura',
    (ms.linhas || []).length === 3, ms.linhas);
  checar('…e as contagens escritas são as que aparecem',
    (ms.linhas || []).map((l) => l.contagem).join(' ') === '1–2 5–6 7–8',
    (ms.linhas || []).map((l) => l.contagem));

  // E UM VERBETE VAZIO diz que está vazio — sem falar em erro.
  const vazio = { 'Battement tendu': { '8|2/4': { cobre: 8, celulas: {} } } };
  const v = await comAlfabeto(vazio, 'breu');
  const btVazio = v.corpo.exercicios.find((x) => x.nome === 'Battement tendu');
  const mv = btVazio && btVazio.porMusica[0];
  checar('sem trechos, não há linhas — e o motivo di-lo', mv && mv.linhas.length === 0
    && /Nenhum|Não há|não há/.test(String(mv.motivo)), mv && mv.motivo);
}

// =====================================================================================
// D. O ALFABETO É O DO REPOSITÓRIO, e não o do bundle
// =====================================================================================
async function oAlfabetoDoRepo() {
  console.log('\nD. O ALFABETO LIDO É O QUE SE USA — e não o embutido no build');

  /* O VERBETE EXISTE NO FICHEIRO DO REPOSITÓRIO QUE A ROTA ACABOU DE LER. Se a listagem lesse o
   * bundle (o JSON embutido no build do Worker) e não este, um verbete gravado há um minuto sairia
   * em branco — que foi metade do defeito relatado. O nome «Port de bras» não existe no alfabeto
   * de verdade, e é de propósito: se a leitura viesse do bundle, ele não apareceria. */
  const nome = 'Port de bras';
  const alfabeto = JSON.parse(JSON.stringify(ALFABETO));
  alfabeto.verbetes = almofada(alfabeto.verbetes || {});
  alfabeto.verbetes[nome] = { '8|4/4': { cobre: 8, celulas: { devant: [
    celula('1–4', 'sobe'), celula('5–8', 'desce'),
  ] } } };
  Object.assign(alfabeto.verbetes, ALFABETO.verbetes || {});

  const original = globalThis.fetch;
  globalThis.fetch = githubFalso({
    'biblioteca/modalidades/bale-classico/notacao.json': JSON.stringify(alfabeto, null, 2) + '\n',
    'biblioteca/modalidades/bale-classico/vocabulario.json': VOCABULARIO,
  });
  try {
    const env = {
      ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't',
      PADD_KV: { async get() { return null; }, async put() {}, async delete() {}, async list() { return { keys: [], list_complete: true }; } },
    };
    const r = await bastidores.fetch(new Request('https://e.workers.dev/api/bastidores/verbete'), env);
    const corpo = await r.json();
    const achado = (corpo.exercicios || []).find((x) => x.nome === nome);
    checar('um verbete que só existe no ficheiro lido aparece na listagem', Boolean(achado),
      (corpo.exercicios || []).map((x) => x.nome));
    checar('…com as suas duas linhas lidas',
      achado && achado.porMusica[0].linhas.length === 2,
      achado && achado.porMusica[0].linhas);
  } finally {
    globalThis.fetch = original;
  }
}

/** Sem mexer no alfabeto real: devolve uma cópia vazia para o `Object.assign` ordenar. */
function almofada() { return {}; }

oCasoRelatado().then(aVistaDaEscola).then(aLeituraResiliente).then(oAlfabetoDoRepo).then(() => {
  console.log('');
  if (falhas) { console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).'); process.exit(1); }
  console.log('TUDO CERTO — a listagem lê o alfabeto que veio do repositório, a vista da escola,');
  console.log('e mostra os trechos gravados mesmo quando a conta da música não fecha.');
}).catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
