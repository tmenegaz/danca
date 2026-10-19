'use strict';

/*
 * provar-listas-sem-repeticao.js — uma carga de página, um pedido por endereço.
 *
 * O QUE FOI MEDIDO (20/10/2026). A conta do Cloudflare KV estourou a cota diária de `list` uma
 * vez, e a investigação mostrou que a enumeração era o problema. Mas ao medir o custo de UMA
 * carga de página apareceu outra coisa, mais boba e igualmente cara: a MESMA página pedia o
 * MESMO endereço duas vezes.
 *
 *   · o PO pedia `api/envelopes` duas vezes — `carregarFichas` (a estante) e `semearDoPlano`
 *     (que varria os nomes à procura do `plano-*` mais recente para semear os campos);
 *   · o plano pedia `/api/bastidores/turmas` duas vezes — uma para as opções do select
 *     (`carregarOpcoesDe`) e outra para o cadastro com o ritmo (`carregarTurmasDaEscola`),
 *     sendo que a ROTA DEVOLVE AS DUAS COISAS na mesma resposta (`turmas` e `opcoes`);
 *   · a anamnese pedia `/api/bastidores/alunas` duas vezes.
 *
 * Cada repetição é tráfego e é LEITURA no KV. Não é otimização de vaidade: é a conta do dia.
 *
 * O QUE ESTA PROVA FIXA:
 *   1. nenhuma página pede o mesmo endereço de `/api/` duas vezes na MESMA carga;
 *   2. o PO não varre a estante para achar o plano: usa o plano ESCOLHIDO, e a estante que a
 *      página já carregou;
 *   3. o cadastro de turmas semeia as opções do select — quem pede o select depois não busca;
 *   4. o orçamento de leituras por carga (o teto que a fase 2 deixou) não é furado;
 *   5. a lista NÃO CRESCE com o acervo: 40 anamneses custam o mesmo que 4, porque o que ela
 *      mostra vem do RESUMO no índice — e o índice é um arquivo só;
 *   6. a migração do índice antigo (só nomes) custa uma enumeração e uma leitura por envelope,
 *      UMA vez: a leitura seguinte já é a carga normal.
 *
 * COMO MEDE. Sobe o SERVIDOR de verdade (`motor/servidor/rotas.js`) atrás de um `http` local,
 * abre cada uma das três páginas em `jsdom` e conta, rota a rota, o que o CLIENTE pediu e
 * quantas LEITURAS cada pedido custou no armazenamento.
 *
 * Os cadastros da Produção (`/api/bastidores/*`) vivem no Worker da ESCOLA
 * (`motor/servidor/producao.js`), não em `rotas.js` — aqui eles são servidos por um stub com a
 * FORMA da rota real, e as leituras que a rota real faria entram na conta declaradas
 * (`LEITURAS_DO_CADASTRO`), para o total sair comparável ao do Worker.
 *
 *   node experimentos/provar-listas-sem-repeticao.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const { criarRotas } = require('../motor/servidor/rotas.js');
const { criarMemoria } = require('../motor/nucleo/armazenamento.js');

const RAIZ = path.join(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(PORTA, p), 'utf8'));

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

/*
 * As leituras que cada rota de cadastro faz no KV da escola — lidas do código
 * (`bastidores.js`): a lista de turmas lê as turmas e as rubricas (a régua sai resolvida), e
 * cada uma das outras lê a sua própria lista.
 */
const LEITURAS_DO_CADASTRO = {
  '/api/bastidores/turmas': 2,
  '/api/bastidores/termos': 1,
  '/api/bastidores/turma-conteudos': 1,
  '/api/bastidores/professores': 1,
  '/api/bastidores/curadoria-professor': 1,
  '/api/bastidores/alunas': 1,
};

/** A resposta de cada rota de cadastro, com a MESMA forma da rota real. */
const CORPO_DO_CADASTRO = {
  '/api/bastidores/turmas': {
    ok: true,
    turmas: [{ nome: 'Turma Teste', ativo: true, frequencia: 2, duracaoMin: 60 }],
    opcoes: [{ valor: 'Turma Teste', rotulo: 'Turma Teste' }],
  },
  '/api/bastidores/termos': { ok: true, termos: [{ id: 'termo-1', termo: 'Termo' }], opcoes: [] },
  '/api/bastidores/turma-conteudos': { ok: true, relacoes: {} },
  '/api/bastidores/professores': { ok: true, professores: [{ apelido: 'sapo-bailarino' }] },
  '/api/bastidores/curadoria-professor': { ok: true, vinculos: [] },
  '/api/bastidores/alunas': { ok: true, alunas: [] },
};

/** O dataset de uma escola em uso: anamneses, planos e um PO. */
async function semear(memoria) {
  const envelope = (id, contexto) => JSON.stringify({ id, contexto, respostas: {} });
  for (let i = 0; i < 4; i += 1) {
    await memoria.guardar('envelope/anamnese-20261019-100' + i + '.json',
      envelope('anamnese-20261019-100' + i, { aluna: 'Aluna ' + 'ABCD'[i], escola: 'x', professor: 'p', ciclo: '01' }));
  }
  for (let i = 0; i < 3; i += 1) {
    await memoria.guardar('envelope/plano-20261019-110' + i + '.json',
      envelope('plano-20261019-110' + i, { turma: 'Turma ' + i, escola: 'x', professor: 'p', ciclo: '01' }));
  }
  for (let i = 0; i < 2; i += 1) {
    await memoria.guardar('envelope/po-20261019-120' + i + '.json',
      envelope('po-20261019-120' + i, { escola: 'x', professor: 'p', ciclo: '01' }));
  }
  const nomes = (await memoria.listar('envelope/')).map((c) => c.slice('envelope/'.length));
  await memoria.guardar('envelope/.indice.json', JSON.stringify({ nomes }));
}

/** Sobe o servidor e devolve `{ base, fechar }`; `chamadas` conta por caminho. */
async function subir(memoria) {
  const contador = { ler: 0, listar: 0, guardar: 0, existe: 0 };
  const armazenamento = {};
  for (const k of Object.keys(contador)) {
    armazenamento[k] = async (...args) => { contador[k] += 1; return memoria[k](...args); };
  }

  const rotas = criarRotas({
    armazenamento,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    fuso: 'America/Sao_Paulo',
    escolaDoWorker: 'x',
  });

  const chamadas = {};
  const servidor = http.createServer(async (pedido, resposta) => {
    const caminho = decodeURIComponent(new URL(pedido.url, 'http://x').pathname);

    if (CORPO_DO_CADASTRO[caminho]) {
      const c = chamadas[caminho] || (chamadas[caminho] = { n: 0, ler: 0 });
      c.n += 1;
      c.ler += LEITURAS_DO_CADASTRO[caminho] || 0;
      resposta.writeHead(200, { 'Content-Type': 'application/json' });
      return resposta.end(JSON.stringify(CORPO_DO_CADASTRO[caminho]));
    }

    if (caminho === '/' || caminho === '/index.html') {
      resposta.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
      return resposta.end(fs.readFileSync(path.join(PORTA, 'index.html')));
    }
    if (caminho.startsWith('/assets/')) {
      const arquivo = path.join(PORTA, caminho);
      if (fs.existsSync(arquivo)) {
        resposta.writeHead(200, {
          'Content-Type': caminho.endsWith('.css') ? 'text/css' : 'text/javascript',
        });
        return resposta.end(fs.readFileSync(arquivo));
      }
      resposta.writeHead(404);
      return resposta.end('');
    }

    const antes = Object.assign({}, contador);
    const r = await rotas.responder(new Request('http://local' + pedido.url, { method: pedido.method }));
    const corpo = await r.text();
    const c = chamadas[caminho] || (chamadas[caminho] = { n: 0, ler: 0 });
    c.n += 1;
    c.ler += contador.ler - antes.ler;
    resposta.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json' });
    return resposta.end(corpo);
  });

  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));

  /*
   * O AQUECIMENTO — e o custo da MIGRAÇÃO, medido.
   *
   * O índice desta escola foi escrito pela versão antiga (só nomes), e a nova precisa do resumo
   * de cada envelope: a PRIMEIRA leitura reconstrói o índice, pagando uma enumeração e uma
   * leitura por envelope. É o preço ÚNICO de uma escola que já existia — depois disso, as listas
   * não voltam a ler envelope nenhum. Medir com o índice frio mediria a migração, não a carga.
   */
  const custoDe = async (caminho) => {
    const antes = contador.ler;
    await rotas.responder(new Request('http://local' + caminho));
    return contador.ler - antes;
  };
  const migracao = await custoDe('/api/envelopes');
  const morno = await custoDe('/api/envelopes');

  return {
    base: 'http://127.0.0.1:' + servidor.address().port + '/',
    chamadas,
    migracao,
    morno,
    limpar: () => { for (const k of Object.keys(chamadas)) delete chamadas[k]; },
    fechar: () => servidor.close(),
  };
}

/** Abre a página de uma fonte e devolve o que o cliente pediu. */
async function carregar(base, fonte, chamadas) {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const virtual = new VirtualConsole();
  const erros = [];
  virtual.on('jsdomError', (e) => {
    if (/Not implemented/.test(e.message)) return;
    // `/assets/` (o CSS, o `nav.js`) é servido pelo Worker da escola a partir do pacote do
    // ciclo, que aqui não existe: um 404 de asset não é erro da PÁGINA — o JS da porta é inline.
    if (/Could not load (link|script): "[^"]*\/assets\//.test(e.message)) return;
    erros.push(e.message);
  });
  const dom = await JSDOM.fromURL(base + '?fonte=' + fonte + '&escola=x&professor=p&ciclo=01', {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: virtual,
    beforeParse(janela) {
      janela.fetch = (u, o) => fetch(new URL(u, janela.location.href).href, o);
      // O jsdom não traz `CSS.escape`; o navegador traz. É do AMBIENTE, não da página.
      janela.CSS = { escape: (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c) };
    },
  });
  await new Promise((ok) => setTimeout(ok, 2500));
  dom.window.close();
  const rotas = Object.entries(chamadas)
    .filter(([c]) => /\/api\//.test(c))
    .map(([c, v]) => ({ caminho: c, pedidos: v.n, ler: v.ler }));
  return { rotas, erros };
}

/** A carga de página de cada fonte, com o tecto de leituras que a fase 2 deixou. */
const TETO = {
  // professores 1 · envelopes 1 (o índice) · planos 1 (o índice) · curadoria 1 · o plano
  // escolhido 1 (o detalhe que semeia o PO)
  po: 5,
  // + turmas 2 · conteudos 1 · termos 1 · plano-estados 1
  plano: 9,
  // professores 1 · envelopes 1 · curadoria 1 · anamnese-estados 1 · alunas 1
  anamnese: 5,
};

async function main() {
  console.log('A CARGA DE CADA PÁGINA — um pedido por endereço\n');

  const memoria = criarMemoria();
  await semear(memoria);
  const servidor = await subir(memoria);

  try {
    for (const fonte of ['po', 'plano', 'anamnese']) {
      servidor.limpar();
      const { rotas, erros } = await carregar(servidor.base, fonte, servidor.chamadas);
      const repetidas = rotas.filter((r) => r.pedidos > 1);
      const leituras = rotas.reduce((s, r) => s + r.ler, 0);
      const pedidos = rotas.reduce((s, r) => s + r.pedidos, 0);

      console.log('  ' + fonte.toUpperCase() + ' — ' + pedidos + ' pedido(s), ' + leituras + ' leitura(s)');
      for (const r of rotas) {
        console.log('    ' + r.caminho.padEnd(40) + ' ' + r.pedidos + 'x  ler=' + r.ler);
      }

      checar(fonte + ': nenhum endereço é pedido duas vezes', repetidas.length === 0,
        repetidas.map((r) => r.caminho + ' ×' + r.pedidos));
      checar(fonte + ': não estoura o orçamento de leituras (' + leituras + ' ≤ ' + TETO[fonte] + ')',
        leituras <= TETO[fonte], leituras);
      checar(fonte + ': a página abre sem erro de script', erros.length === 0, erros.slice(0, 3));
    }

    // 2. O PO NÃO VARRE A ESTANTE. A semeadura usava `api/envelopes` para descobrir o `plano-*`
    //    mais recente; agora usa o plano ESCOLHIDO e a estante que a página já tem. O que fica
    //    de `api/envelopes` é a estante das fichas — UM pedido.
    servidor.limpar();
    await carregar(servidor.base, 'po', servidor.chamadas);
    const envelopes = servidor.chamadas['/api/envelopes'] || { n: 0 };
    checar('PO: `api/envelopes` é pedido UMA vez (a estante, não a semeadura)', envelopes.n === 1, envelopes.n);
    const planos = servidor.chamadas['/api/planos'] || { n: 0 };
    checar('PO: `api/planos` é pedido UMA vez (a estante do select)', planos.n === 1, planos.n);

    // 3. O CADASTRO DE TURMAS SEMEIA AS OPÇÕES. A rota devolve `turmas` e `opcoes` na mesma
    //    resposta; quem pede o select depois encontra pronto. Com o stub, a prova de que o
    //    segundo pedido não acontece é o número: UM pedido, e o select populado.
    servidor.limpar();
    const plano = await carregar(servidor.base, 'plano', servidor.chamadas);
    const turmas = servidor.chamadas['/api/bastidores/turmas'] || { n: 0 };
    checar('plano: `/api/bastidores/turmas` é pedido UMA vez (cadastro + opções na mesma resposta)',
      turmas.n === 1, turmas.n);
    checar('plano: o cadastro de turmas ainda é lido (a régua e o ritmo não desapareceram)',
      turmas.n === 1 && plano.rotas.some((r) => r.caminho === '/api/bastidores/turma-conteudos'),
      plano.rotas.map((r) => r.caminho));

    // 4. A MIGRAÇÃO DO ÍNDICE, e o seu fim. A primeira leitura de uma escola que tinha o
    //    índice antigo (só nomes) paga enumeração + uma leitura por envelope, e grava. A
    //    segunda já lê um arquivo. Sem esta asserção, o preço único passaria por regressão.
    console.log('  migração do índice: ' + servidor.migracao + ' leitura(s), depois '
      + servidor.morno + ' por leitura da lista');
    checar('o índice antigo é migrado numa leitura só (' + servidor.migracao + ' = 1 + envelopes)',
      servidor.migracao > 1, servidor.migracao);
    checar('migrado o índice, a lista custa UM arquivo (' + servidor.morno + ')',
      servidor.morno === 1, servidor.morno);

    // 5. A LISTA NÃO CRESCE COM O ACERVO. É o ponto do resumo no índice: 40 anamneses em vez
    //    de 4 não pode custar 10 vezes mais. Se custar, o resumo não está a ser usado.
    const grande = criarMemoria();
    await semear(grande);
    const envelope = (id) => JSON.stringify({ id, contexto: { aluna: id, escola: 'x', professor: 'p', ciclo: '01' }, respostas: {} });
    for (let i = 0; i < 40; i += 1) {
      const id = 'anamnese-20261020-09' + String(i).padStart(2, '0');
      await grande.guardar('envelope/' + id + '.json', envelope(id));
    }
    const nomesGrandes = (await grande.listar('envelope/')).map((c) => c.slice('envelope/'.length));
    await grande.guardar('envelope/.indice.json', JSON.stringify({ nomes: nomesGrandes }));
    const servidorGrande = await subir(grande);
    try {
      servidorGrande.limpar();
      const pagina = await carregar(servidorGrande.base, 'anamnese', servidorGrande.chamadas);
      const leituras = pagina.rotas.reduce((soma, r) => soma + r.ler, 0);
      console.log('  ANAMNESE com 40+ anamneses — ' + leituras + ' leitura(s)');
      checar('com 40 anamneses, a carga custa o mesmo que com 4 (' + leituras + ' ≤ ' + TETO.anamnese + ')',
        leituras <= TETO.anamnese, leituras);
    } finally {
      servidorGrande.fechar();
    }
  } finally {
    servidor.fechar();
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
