#!/usr/bin/env node
'use strict';

/*
 * provar-custo-da-listagem.js — a lista custa o ÍNDICE, e não um ficheiro por registo.
 *
 * O QUE FOI MEDIDO (13/11/2026). A pesquisadora descreveu a diferença sem a nomear: «quando eu
 * navego nos bastidores, é o clique e já carrega; agora a anamnese, o plano de ensino e o plano
 * de observação demoram… tem alguma coisa sendo processada?». Tinha.
 *
 * Estas três páginas são as únicas que NÃO são estáticas: são montadas a cada pedido, e cada
 * montagem lê o acervo pelo GitHub. Medido ao ar, no Worker da escola:
 *
 *     /aulas/                          0,30 s   (asset)
 *     /ciclos/planos/                  0,07 s   (asset)
 *     /area-do-professor/anamnese      2,43 s
 *     /area-do-professor/plano-de-ensino  7,54 s
 *     /area-do-professor/plano-de-observacao 7,61 s
 *
 * A causa, contada no porto local: a lista do plano de ensino e a do PO faziam **24 idas à API
 * do GitHub** cada uma. Dezanove delas eram `lerArquivo` de cada PO — para buscar
 * `respostas.sujeitos`, que **já estava no resumo do índice**. O índice existe precisamente para
 * a estante não ler envelopes (ver `resumosDeEnvelopes` em `motor/nucleo/porta.js`); a cascata
 * de revalidação tinha ficado de fora dessa regra.
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   1. com os resumos completos, `revalidacaoPendente` NÃO lê envelope nenhum — e o resultado é
 *      o mesmo (um PO desactualizado e o plano de que ele depende);
 *   2. com um índice antigo, sem `sujeitos`, ela LÊ o envelope e chega ao MESMO resultado — o
 *      recurso não é decoração: é o que impede uma lista de perder o vínculo em silêncio;
 *   3. `vigentes()` lê as versões AO MESMO TEMPO (as janelas de leitura sobrepõem-se), e não em
 *      fila — é a diferença entre somar esperas e esperar a mais longa.
 *
 * A prova é determinística: o armazenamento e as leituras são de memória, e a concorrência é
 * medida pelas janelas de tempo de cada leitura, não por um relógio de parede.
 *
 *   node experimentos/provar-custo-da-listagem.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const linhasRepo = require(path.join(RAIZ, 'motor/servidor/linhas-de-base-repo.js'));

let ok = 0;
let ko = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
  else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
};

/* ============================================================================
   1–2. A CASCATA DE REVALIDAÇÃO: o resumo primeiro, o arquivo só como recurso
   ========================================================================== */

/* O acervo sintético: um PO antigo que observa a `ami`, e uma anamnese mais recente dela. É o
   caso em que o selo «precisa de revisão» TEM de aparecer — sem ele, a prova passaria a medir
   o vazio, que é a armadilha desta casa. */
const ANAMNESE = {
  id: 'anamnese-20260102-1000', contexto: { escola: 'e', aluna: 'ami' },
  gerado_em: '2026-01-02T10:00', respostas: {},
};
const PO = {
  id: 'po-20260101-0900', contexto: { escola: 'e', professor: 'p', ciclo: '01' },
  gerado_em: '2026-01-01T09:00',
  respostas: {
    'sujeitos': { valor: ['ami'] },
    'plano-de-ensino': { valor: ['plano-20260101-0800'] },
  },
};
const PLANO = {
  id: 'plano-20260101-0800', contexto: { escola: 'e', professor: 'p', ciclo: '01' },
  gerado_em: '2026-01-01T08:00', respostas: {},
};

/**
 * Um armazenamento de leitura, com as leituras CONTADAS.
 * `semSujeitos` simula o índice de uma versão anterior do resumo.
 */
function acervoSintetico({ semSujeitos }) {
  const resumoPo = porta.resumoDoEnvelope(PO, 'po-20260101-0900.json');
  if (semSujeitos) delete resumoPo.sujeitos;
  const indice = JSON.stringify({
    versao: 4,
    nomes: ['anamnese-20260102-1000.json', 'plano-20260101-0800.json', 'po-20260101-0900.json'],
    resumos: {
      'anamnese-20260102-1000.json': porta.resumoDoEnvelope(ANAMNESE, 'anamnese-20260102-1000.json'),
      'plano-20260101-0800.json': porta.resumoDoEnvelope(PLANO, 'plano-20260101-0800.json'),
      'po-20260101-0900.json': resumoPo,
    },
  });
  const arquivos = {
    'envelope/.indice.json': indice,
    'envelope/anamnese-20260102-1000.json': JSON.stringify(ANAMNESE),
    'envelope/plano-20260101-0800.json': JSON.stringify(PLANO),
    'envelope/po-20260101-0900.json': JSON.stringify(PO),
  };
  const lidos = [];
  return {
    lidos,
    async ler(chave) {
      if (arquivos[chave] === undefined) return null;
      if (/^envelope\/.+\.json$/.test(chave) && !/\.indice\.json$/.test(chave)) lidos.push(chave);
      return arquivos[chave];
    },
    async listar() { return Object.keys(arquivos); },
    async guardar() { return true; },
    async apagar() { return true; },
    async existe(chave) { return arquivos[chave] !== undefined; },
  };
}

const comoObjeto = (m) => (m instanceof Map ? Object.fromEntries(m) : (m || {}));

(async () => {
  console.log('\n1 · com os resumos completos, a cascata NÃO lê envelope nenhum');
  {
    const comResumo = acervoSintetico({ semSujeitos: false });
    const r = await porta.revalidacaoPendente(comResumo, null, [], []);
    const pendentes = comoObjeto(r.pendentes);
    provar('o PO desactualizado é assinalado', Boolean(pendentes['po-20260101-0900']),
      Object.keys(pendentes));
    provar('…e o plano de que ele depende também', Boolean(pendentes['plano-20260101-0800']),
      Object.keys(pendentes));
    provar('nenhum envelope foi lido: ' + comResumo.lidos.length + ' leitura(s)',
      comResumo.lidos.length === 0, comResumo.lidos);
  }

  console.log('\n2 · com um índice antigo (sem `sujeitos`), o recurso lê o envelope — e diz o MESMO');
  {
    const semSujeitos = acervoSintetico({ semSujeitos: true });
    const r = await porta.revalidacaoPendente(semSujeitos, null, [], []);
    const pendentes = comoObjeto(r.pendentes);
    const completo = comoObjeto((await porta.revalidacaoPendente(acervoSintetico({ semSujeitos: false }), null, [], [])).pendentes);
    provar('o recurso leu o PO (uma leitura por PO, não zero)',
      semSujeitos.lidos.filter((c) => /^envelope\/po-/.test(c)).length === 1, semSujeitos.lidos);
    provar('e o resultado é IDÊNTICO ao do caminho do resumo',
      JSON.stringify(pendentes) === JSON.stringify(completo),
      { peloResumo: Object.keys(completo), peloArquivo: Object.keys(pendentes) });
  }

  /* ==========================================================================
     3. AS VERSÕES DA LINHA DE BASE LÊEM-SE AO MESMO TEMPO
     ======================================================================== */

  console.log('\n3 · as linhas de base vigentes lêem-se em paralelo, e não em fila');
  {
    /* Quatro linhas de base, cada uma com a sua versão. O `fetch` simulado demora 40 ms e anota
       a JANELA de cada leitura (início e fim). Em fila, as janelas não se tocam; em paralelo,
       sobrepõem-se — e é isso que se mede, sem depender do relógio da máquina. */
    const JANELAS = [];
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    const linhas = ['a', 'b', 'c', 'd'].map((id) => ({
      id, enviada_em: '2026-01-01T09:00', campos: [{ nome: id + '1' }], alunas: [],
    }));
    const arquivos = {};
    for (const l of linhas) {
      const chave = 'escola/e/linhas-de-base/' + l.id + '--20260101-0900.json';
      arquivos[chave] = JSON.stringify(Object.assign({ carimbo: '20260101-0900' }, l));
    }
    arquivos['escola/e/linhas-de-base/.indice.json'] = JSON.stringify({
      versao: 1,
      versoes: Object.fromEntries(Object.keys(arquivos).map((c) => [c.split('/').pop(), {
        arquivo: c.split('/').pop(), id: c.split('/').pop().split('--')[0], carimbo: '20260101-0900',
      }])),
    });
    const fetchFalso = async (url) => {
      const u = String(url && url.url ? url.url : url);
      const inicio = Date.now();
      JANELAS.push({ u, inicio, fim: null });
      const janela = JANELAS[JANELAS.length - 1];
      await espera(40);
      janela.fim = Date.now();
      if (u.includes('/git/trees/')) {
        return new Response(JSON.stringify({ tree: Object.keys(arquivos).map((c) => ({ path: c, type: 'blob' })) }),
          { status: 200, headers: { 'content-type': 'application/json' } });
      }
      const m = /\/contents\/([^?]+)/.exec(u);
      if (m) {
        const chave = decodeURIComponent(m[1]);
        if (!arquivos[chave]) return new Response('{}', { status: 404 });
        return new Response(JSON.stringify({ content: Buffer.from(arquivos[chave]).toString('base64'), sha: 's' }),
          { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('{}', { status: 404 });
    };
    const store = linhasRepo.criarStore({
      token: 'f', dono: 'd', repo: 'r', ref: 'main', escola: 'e', fetchImpl: fetchFalso,
    });
    const vigentes = await store.vigentes();
    const doIndice = JANELAS.filter((j) => /\/contents\/.*linhas-de-base\/[^/]+\.json/.test(j.u)
      && !/\.indice\.json/.test(j.u));
    let sobrepostas = 0;
    for (let i = 0; i < doIndice.length; i += 1) {
      for (let k = i + 1; k < doIndice.length; k += 1) {
        const a = doIndice[i];
        const b = doIndice[k];
        if (a.inicio < b.fim && b.inicio < a.fim) sobrepostas += 1;
      }
    }
    provar('as quatro linhas de base foram lidas', vigentes.length === 4, vigentes.length);
    provar('as leituras das quatro versões acontecem AO MESMO TEMPO (' + sobrepostas + ' par(es) sobreposto(s))',
      doIndice.length === 4 && sobrepostas === 6, { leituras: doIndice.length, sobrepostas });
  }

  console.log('\n' + (ko ? 'FALHOU' : 'TUDO CERTO') + ' — ' + ok + ' asserção(ões)' +
    (ko ? ', ' + ko + ' falha(s)' : '') + '.');
  process.exit(ko ? 1 : 0);
})().catch((erro) => { console.error(erro); process.exit(1); });
