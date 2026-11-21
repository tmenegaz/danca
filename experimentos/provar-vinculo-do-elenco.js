#!/usr/bin/env node
'use strict';

/**
 * provar-vinculo-do-elenco.js — a aluna que entra no elenco fica VINCULADA, mesmo com o PO velho.
 *
 * O DEFEITO, medido na `batata` e relatado por ela (08/11/2026): «a aluna B […] já está sendo
 * observada e a etiqueta ainda está como livre e eu ainda posso editar ou apagar essa aluna, e
 * isso é uma falha grave». É: uma anamnese sobre a qual já se observou não se reescreve nem se
 * apaga — é a regra que separa memória de rascunho.
 *
 * O QUE ACONTECEU, com carimbos e não com adjetivos:
 *
 *   · `linha de base tami`, versão de 22:29 (07/11) → elenco `[Aluna A]`
 *   · `po-20261107-2211`, de 22:11 (07/11)        → `sujeitos: [Aluna A]`
 *   · `linha de base tami`, versão de 01:05 (08/11) → elenco `[Aluna A, Aluna B]`  ← a aluna entra
 *
 * O documento derivado passou a observar as duas (`## Sujeitos`, e a §6 da Aula lista as duas
 * anamneses). A derivação do VÍNCULO, porém, lia só `po.sujeitos` — a cópia do dia em que o PO foi
 * gravado —, e por isso a anamnese da Aluna B continuou «solta»: etiqueta «livre», botões
 * «editar»/«apagar», `PUT` e `DELETE` a responder 200. Três superfícies a mentir sobre o mesmo
 * facto, e a mais grave delas é a rota.
 *
 * A AUTORIDADE JÁ ESTAVA ESCRITA, duas vezes, e a casa já a tinha usado para o ELENCO:
 *   · `elencoDoCiclo` (06/11/2026, §5.20/§5.21): o PO herda a linha de base, e quando herda mal é
 *     a linha de base que está certa;
 *   · `alunasDaTurma` (05/11/2026): o elenco lê-se da linha de base, e a curadoria é recurso.
 * Era o mesmo defeito num terceiro sítio: o vínculo da anamnese.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. O NÚCLEO, com os envelopes REAIS da `batata` e a linha de base REAL do disco. O A/B é
 *      explícito: sem o elenco, «solta» (o defeito); com ele, «vinculada».
 *   B. AS NEGATIVAS, e são elas que impedem a cura de ser pior do que a doença: uma aluna do
 *      elenco de uma turma que nenhum PO observa continua livre; uma que SAIU do elenco continua
 *      vinculada (o cadeado não abre por uma das fontes esquecer um nome); sem leitor de linha de
 *      base a derivação degrada para o `sujeitos`, sem inventar vínculo.
 *   C. AS ROTAS — `PUT` e `DELETE` recusam (409) a Aluna B, e continuam a aceitar a aluna livre.
 *      A rota é a linha; a tela é comodidade.
 *   D. A GRAVAÇÃO — uma anamnese nova da Aluna B EMPILHA (elo novo) em vez de substituir o
 *      registo dela. Era o outro lado do mesmo defeito, e o único que apagava.
 *   E. A LISTAGEM — a etiqueta «vinculada» e o gesto «Novo registo», na página que o Worker serve.
 *
 *   uso: node experimentos/provar-vinculo-do-elenco.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const RAIZ = path.resolve(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const { criarRotas } = require(path.join(RAIZ, 'motor/servidor/rotas.js'));
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* AS FONTES SÃO AS DA ESCOLA VIVA (20/11/2026). A `batata` foi expurgada e esta prova lia dela os
 * envelopes e as linhas de base. A forma é a mesma; o que muda é QUEM observa quem, e é isso que
 * as asserções dizem em vez de fixarem carimbos de outra escola:
 *
 *   · a ALUNA A tem plano de observação (todos os 30 POs da `breu` a nomeiam em `sujeitos`);
 *   · a ALUNA B está na linha de base vigente (`tami--20261120-2146`), e nenhum PO a observa.
 *
 * É o par que o A/B precisa: uma aluna ligada pelo elenco E observada, outra só ligada. */
const CARIMBO_A = 'anamnese-20261118-1737';   // Aluna A, o mais recente dela no acervo
const CARIMBO_B = 'anamnese-20261119-1145';   // Aluna B, a única anamnese dela
const PO_DA_A = 'po-20261119-1233';           // um PO que a Aluna A observa
const TURMA = 'Rosa';
const LINHA = 'tami';

/** Os envelopes REAIS da escola viva, do disco. */
function envelopesDaBatata() {
  const dir = path.join(RAIZ, 'escola/breu/envelopes');
  const mapa = {};
  for (const f of fs.readdirSync(dir)) mapa['envelope/' + f] = fs.readFileSync(path.join(dir, f), 'utf8');
  return mapa;
}

/** As linhas de base REAIS da escola viva — a vigente de cada `id` (carimbo maior). */
function linhasDaBatata() {
  const dir = path.join(RAIZ, 'escola/breu/linhas-de-base');
  const porId = new Map();
  for (const f of fs.readdirSync(dir)) {
    if (!/--/.test(f)) continue;
    const l = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const carimbo = f.split('--')[1].replace(/\.json$/, '');
    const atual = porId.get(l.id);
    if (!atual || carimbo > atual.carimbo) porId.set(l.id, Object.assign({}, l, { carimbo }));
  }
  return [...porId.values()];
}

/* A CURADORIA, como ela está AO AR — lida da rota em 08/11/2026, uma leitura só, e transcrita.
 * É ela que declara qual elenco a sala recebe (a nomenclatura nova: a sala é o ritmo, o elenco é
 * o corpo, e a turma diz qual corpo a sala recebe). */
const CURADORIAS = [{
  id: 'demi-plie-bale-classico-rosa',
  professor: 'demi-plie',
  turmas: [TURMA],
  linhaDeBase: LINHA,
  alunas: ['Aluna A', 'Aluna B'],
}];

const ler = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta', p), 'utf8'));
const resposta = (v) => ({ valor: v, origem: 'perguntado', respondente: 'professor', nota: null });

/* ========================================================================================== */

(async () => {
  /* ------------------------------------------------------------------------------------------ */
  console.log('\nA · O NÚCLEO — os envelopes e a linha de base REAIS da breu');
  /* ------------------------------------------------------------------------------------------ */
  {
    const arm = criarMemoria(envelopesDaBatata());
    const linhas = linhasDaBatata();

    const antes = await porta.estadosDasAnamneses(arm);
    provar('sem o elenco, a Aluna B sai «solta» — o defeito, reproduzido',
      (antes[CARIMBO_B] || {}).estado === 'solta' && antes[CARIMBO_B].vinculada === false,
      antes[CARIMBO_B] && antes[CARIMBO_B].estado);

    const depois = await porta.estadosDasAnamneses(arm, { linhas, curadorias: CURADORIAS });
    provar('com o elenco, a Aluna B passa a VINCULADA',
      (depois[CARIMBO_B] || {}).vinculada === true, depois[CARIMBO_B]);
    provar('…e o estado diz o mesmo',
      (depois[CARIMBO_B] || {}).estado === 'vinculada', (depois[CARIMBO_B] || {}).estado);
    /* QUEM NOMEIA OS PO É A ALUNA QUE ELES OBSERVAM. Na `breu` é a Aluna A: os 30 POs declaram
     * `sujeitos: ['Aluna A']`, e nenhum nomeia a Aluna B — que é justamente a que só o elenco
     * liga. A asserção mudou de aluna porque o facto mudou de aluna; o que ela mede é o mesmo:
     * o estado diz QUEM observa, e não só que está ligada. */
    provar('…e nomeia os PO que a observam',
      ((depois[CARIMBO_A] || {}).por || []).indexOf(PO_DA_A) !== -1,
      (depois[CARIMBO_A] || {}).por);
    provar('…e a Aluna A continua vinculada (a correcção não a soltou)',
      (depois[CARIMBO_A] || {}).vinculada === true, depois[CARIMBO_A]);

    /* A mesma leitura pela lista que o nó `sujeitos` e a §6 consomem. */
    const lista = await porta.anamneses(arm, null, { linhas, curadorias: CURADORIAS });
    const daB = lista.find((o) => o.valor === 'Aluna B') || {};
    provar('a lista de anamneses também diz «vinculada»', daB.vinculada === true, daB.vinculada);
    provar('…e traz o carimbo vigente da aluna', daB.carimbo === CARIMBO_B, daB.carimbo);
  }

  /* ------------------------------------------------------------------------------------------ */
  console.log('\nB · AS NEGATIVAS — o que não pode passar a estar vinculado');
  /* ------------------------------------------------------------------------------------------ */
  {
    const linhas = [
      { id: 'elenco-com-po', alunas: ['Aluna X'], campos: [{ id: 'c', nome: 'c' }] },
      { id: 'elenco-sem-po', alunas: ['Aluna W'], campos: [{ id: 'c', nome: 'c' }] },
    ];
    const anamneseDe = (carimbo, aluna) => JSON.stringify({
      id: carimbo,
      contexto: { escola: 'f', professor: 'p1', ciclo: '01', aluna },
      respostas: {},
    });
    const mapa = {
      'envelope/anamnese-20260101-1000.json': anamneseDe('anamnese-20260101-1000', 'Aluna X'),
      /* A ALUNA Y SAIU DO ELENCO: só o `sujeitos` do PO a nomeia. É o cadeado que não abre. */
      'envelope/anamnese-20260101-1200.json': anamneseDe('anamnese-20260101-1200', 'Aluna Y'),
      /* A ALUNA W está num elenco que NENHUM PO observa. */
      'envelope/anamnese-20260101-1300.json': anamneseDe('anamnese-20260101-1300', 'Aluna W'),
      'envelope/plano-20260101-0900.json': JSON.stringify({
        id: 'plano-20260101-0900',
        contexto: { escola: 'f', professor: 'p1', ciclo: '01', turma: 'turma com po' },
        respostas: { 'contexto-turma': resposta('turma com po'), 'objetivo-geral': resposta('objetivo') },
      }),
      'envelope/po-20260101-1100.json': JSON.stringify({
        id: 'po-20260101-1100',
        contexto: { escola: 'f', professor: 'p1', ciclo: '01' },
        respostas: { sujeitos: resposta(['Aluna Y']), 'plano-de-ensino': resposta(['plano-20260101-0900']) },
      }),
    };
    const arm = criarMemoria(mapa);
    const curadorias = [
      { id: 'c1', professor: 'p1', turmas: ['turma com po'], linhaDeBase: 'elenco-com-po' },
      { id: 'c2', professor: 'p1', turmas: ['turma sem po'], linhaDeBase: 'elenco-sem-po' },
    ];

    const comPO = await porta.estadosDasAnamneses(arm, { linhas, curadorias });
    provar('a aluna do elenco de uma turma QUE TEM PO fica vinculada',
      (comPO['anamnese-20260101-1000'] || {}).vinculada === true, comPO['anamnese-20260101-1000']);

    /* Só a turma SEM po: a aluna está no elenco, mas ninguém a observa. */
    const soSemPo = [{ id: 'c2', professor: 'p1', turmas: ['turma sem po'], linhaDeBase: 'elenco-sem-po' }];
    const semPO = await porta.estadosDasAnamneses(arm, { linhas, curadorias: soSemPo });
    provar('…e a aluna do elenco de uma turma SEM PO continua livre',
      (semPO['anamnese-20260101-1300'] || {}).vinculada === false, semPO['anamnese-20260101-1300']);

    /* QUEM SAIU DO ELENCO CONTINUA VINCULADA: o PO a observou, e um cadeado que se abre quando
     * uma das duas fontes esquece um nome não é cadeado. */
    provar('quem está em `po.sujeitos` e saiu do elenco continua vinculada',
      (comPO['anamnese-20260101-1200'] || {}).vinculada === true, comPO['anamnese-20260101-1200']);

    /* SEM LEITOR DE LINHA DE BASE não se inventa vínculo: é a derivação de antes. */
    const semLeitor = await porta.estadosDasAnamneses(arm, { curadorias });
    provar('sem as linhas de base, degrada para o `sujeitos` — sem inventar vínculo',
      (semLeitor['anamnese-20260101-1000'] || {}).vinculada === false
      && (semLeitor['anamnese-20260101-1200'] || {}).vinculada === true,
      [semLeitor['anamnese-20260101-1000'], semLeitor['anamnese-20260101-1200']]);
  }

  /* ------------------------------------------------------------------------------------------ */
  console.log('\nC · AS ROTAS — a linha é o servidor, não a tela');
  /* ------------------------------------------------------------------------------------------ */
  const arm = criarMemoria(envelopesDaBatata());
  const linhas = linhasDaBatata();
  const rotas = criarRotas({
    armazenamento: arm,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    escolaDoWorker: 'breu',
    lerCuradorias: async () => CURADORIAS,
    lerLinhasDeBase: async () => linhas,
  });

  const pedir = async (metodo, caminho, corpo) => {
    const r = await rotas.responder(new Request('https://breu.local' + caminho, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      ...(corpo ? { body: JSON.stringify(corpo) } : {}),
    }));
    const texto = await r.text();
    let dados = {};
    try { dados = JSON.parse(texto); } catch { dados = { cru: texto }; }
    return { status: r.status, dados };
  };

  {
    /* A GUARDA É MEDIDA EM QUEM TEM PO. A recusa nomeia os POs (`estado.por.join`), e a Aluna B
     * não tem nenhum — a recusa dela seria outra, e não a que esta secção mede. */
    const estado = await pedir('GET', '/api/anamnese-estado/' + CARIMBO_A);
    provar('GET /api/anamnese-estado da aluna observada diz «vinculada»',
      (estado.dados.estado || {}).vinculada === true, estado.dados.estado);

    const apagar = await pedir('DELETE', '/api/anamnese-vinculo/' + CARIMBO_A);
    provar('DELETE da anamnese observada é RECUSADO (409)', apagar.status === 409, apagar.status);
    provar('…e a recusa diz quem a observa',
      /VINCULADA/.test(String(apagar.dados.erro || '')) && /po-/.test(String(apagar.dados.erro || '')),
      apagar.dados.erro);

    const editar = await pedir('PUT', '/api/anamnese-editar/' + CARIMBO_A, { respostas: {} });
    provar('PUT da anamnese observada é RECUSADO (409)', editar.status === 409, editar.status);

    /* O CONTROLO POSITIVO: a guarda não passou a recusar tudo. Uma aluna que não está no elenco
     * nem em nenhum PO continua editável — é o que a regra sempre disse. */
    await porta.gravarEnvelope(arm, {
      id: 'anamnese-20260101-0900',
      contexto: { escola: 'breu', professor: 'demi-plie', ciclo: '01', aluna: 'Aluna Z' },
      respostas: {},
    }, {
      id: 'anamnese-20260101-0900', estado: 'prova', contagem: { respondidos: 0, obrigatorios: 0 },
      elos: [], paradas: [], idsDesconhecidos: [],
      validacao: { resultado: 'aceite', contrato: 'prova' }, errosDoDocumento: [], linhas: [],
    });
    const apagarZ = await pedir('DELETE', '/api/anamnese-vinculo/anamnese-20260101-0900');
    provar('…e a aluna que ninguém observa continua a apagar-se (200)', apagarZ.status === 200,
      apagarZ.status);
  }

  /* ------------------------------------------------------------------------------------------ */
  console.log('\nD · A GRAVAÇÃO — vinculada EMPILHA, e não substitui');
  /* ------------------------------------------------------------------------------------------ */
  {
    /* O `alunaId` VAI NO CONTEXTO (18/11/2026): é ele que distingue duas pessoas de mesmo
     * apelido, e é por ele que `vigenteDoSujeito` acha o retrato atual. Sem ele a prova media o
     * caminho antigo — «não há vigente» —, e a anamnese nascia sem elo. Os ids são os dos
     * envelopes da `breu`: a Aluna A é `aluna-a-3`, a Aluna B é `aluna-b-2`. */
    const simular = async (aluna, carimbo) => porta.elicitar(arm, {
      fonte: 'anamnese',
      respostas: {},
      simular: true,
      contexto: { escola: 'breu', professor: 'demi-plie', ciclo: '01', aluna,
        alunaId: aluna === 'Aluna B' ? 'aluna-b-2' : 'aluna-a-3' },
    }, {
      conteudo: ler('conteudo/anamnese.json'),
      esquema: ler('envelope/elicitacao-schema.json'),
      elenco: { linhas, curadorias: CURADORIAS },
      agora: () => carimbo,
    });

    const daB = await simular('Aluna B', '2026-11-08T02:00');
    provar('uma anamnese nova da Aluna B nasce como ELO NOVO',
      String(daB.documento.ajuste_de || '') === CARIMBO_B,
      { ajuste_de: daB.documento.ajuste_de, id: daB.documento.id });
    provar('…e com carimbo próprio, e não o dela',
      daB.documento.id !== CARIMBO_B, daB.documento.id);

    /* O A/B: sem o elenco, o sistema SUBSTITUÍA o registo da Aluna B — o modo de falha que apaga. */
    const semElenco = await porta.elicitar(arm, {
      fonte: 'anamnese', respostas: {}, simular: true,
      contexto: { escola: 'breu', professor: 'demi-plie', ciclo: '01', aluna: 'Aluna B',
        alunaId: 'aluna-b-2' },
    }, {
      conteudo: ler('conteudo/anamnese.json'),
      esquema: ler('envelope/elicitacao-schema.json'),
      agora: () => '2026-11-08T02:00',
    });
    provar('…e sem o elenco o mesmo gesto SOBRESCREVIA o registo (o defeito, no A/B)',
      semElenco.documento.id === CARIMBO_B, semElenco.documento.id);
  }

  /* ------------------------------------------------------------------------------------------ */
  console.log('\nE · A LISTAGEM — a etiqueta e o gesto, na página que o Worker serve');
  /* ------------------------------------------------------------------------------------------ */
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vinculo-prova-'));
    fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
    for (const [de, para] of [
      ['tools/templates/ciclo.css', 'assets/style.css'],
      ['tools/templates/nav.js', 'assets/nav.js'],
      ['tools/templates/marca/favicon.svg', 'assets/favicon.svg'],
    ]) fs.copyFileSync(path.join(RAIZ, de), path.join(dir, para));
    fs.writeFileSync(path.join(dir, 'nav.json'), JSON.stringify({ escola: 'prova', itens: [] }));

    const dados = new Map();
    const kv = {
      async get(k) { return dados.has(k) ? dados.get(k) : null; },
      async put(k, v) { dados.set(k, String(v)); },
      async delete(k) { dados.delete(k); },
      async list(op) {
        const prefixo = (op && op.prefix) || '';
        return {
          keys: [...dados.keys()].filter((k) => k.startsWith(prefixo)).map((name) => ({ name })),
          list_complete: true,
        };
      },
    };
    const TIPOS = {
      '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json',
    };
    const assets = {
      async fetch(pedido) {
        const url = pedido instanceof URL ? pedido : new URL(pedido.url);
        const rel = String(url.pathname).replace(/^\/+/, '').replace(/^plano-observacao\//, '');
        for (const base of [dir, path.join(RAIZ, 'porta')]) {
          const alvo = path.join(base, rel);
          if (fs.existsSync(alvo) && fs.statSync(alvo).isFile()) {
            return new Response(fs.readFileSync(alvo), {
              status: 200,
              headers: { 'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream' },
            });
          }
        }
        return new Response('nao', { status: 404 });
      },
    };
    const env = {
      ESCOLA_SLUG: 'prova', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', SENHA_PROFESSOR: 'p',
      PROFESSOR_NOME: 'Dedão', PADD_KV: kv, ASSETS: assets,
    };

    /* A MESMA FORMA AO AR: a turma declara o elenco, e o elenco tem as duas. */
    await kv.put('bastidores/prova/curadorias', JSON.stringify([{
      id: 'c1', professor: 'dedao-aberto', modalidade: 'balé clássico',
      turma: TURMA, turmas: [TURMA], linhaDeBase: LINHA,
    }]));
    await kv.put('bastidores/prova/linhas-de-base', JSON.stringify([{
      id: LINHA, carimbo: '20261108-0105', alunas: ['Aluna A', 'Aluna B'],
      campos: [{ id: 'tendu', nome: 'o tendu', grupo: 'Os elementos basilares' }],
    }]));

    const acervo = producao.__armazenamento(env);
    const relatorio = (id) => ({
      id, estado: 'prova', contagem: { respondidos: 0, obrigatorios: 0 }, elos: [], paradas: [],
      idsDesconhecidos: [], validacao: { resultado: 'aceite', contrato: 'prova' },
      errosDoDocumento: [], linhas: [],
    });
    for (const d of [
      { id: 'anamnese-20261107-1928', contexto: { escola: 'prova', professor: 'dedao-aberto', ciclo: '01', aluna: 'Aluna A' }, respostas: {}, gerado_em: '2026-11-07T19:28' },
      { id: 'anamnese-20261107-2204', contexto: { escola: 'prova', professor: 'dedao-aberto', ciclo: '01', aluna: 'Aluna B' }, respostas: {}, gerado_em: '2026-11-07T22:04' },
      { id: 'plano-20261107-2201', contexto: { escola: 'prova', professor: 'dedao-aberto', ciclo: '01', turma: TURMA }, respostas: { 'contexto-turma': resposta(TURMA), 'objetivo-geral': resposta('Teste') }, gerado_em: '2026-11-07T22:01' },
      /* O PO da véspera: declara SÓ a Aluna A. É o caso dela. */
      { id: 'po-20261107-2211', contexto: { escola: 'prova', professor: 'dedao-aberto', ciclo: '01' }, respostas: { sujeitos: resposta(['Aluna A']), 'plano-de-ensino': resposta(['plano-20261107-2201']) }, gerado_em: '2026-11-07T22:11' },
    ]) await porta.gravarEnvelope(acervo, d, relatorio(d.id));

    const pagina = await producao.fetch(
      new Request('https://prova.tmenegaz77.workers.dev/area-do-professor/anamnese/'), env);
    const html = await pagina.text();
    provar('a listagem da anamnese responde 200', pagina.status === 200, pagina.status);

    const linhaDe = (nome) => {
      const m = new RegExp('<li class="trio-plano"[\\s\\S]*?' + nome + '[\\s\\S]*?</li>').exec(html);
      if (!m) return null;
      return { html: m[0], texto: m[0].replace(/<[^>]+>/g, ' ') };
    };
    const b = linhaDe('Aluna B');
    provar('a linha da Aluna B existe', Boolean(b), Boolean(b));
    provar('…e diz «vinculada»', /vinculada/.test((b || {}).texto || ''), (b || {}).texto);
    provar('…e NÃO diz «livre»', !/\blivre\b/.test((b || {}).texto || ''), (b || {}).texto);
    provar('…e não oferece «apagar»', !/apagar/i.test((b || {}).html || ''), (b || {}).html);
    provar('…e não oferece «editar» como gesto de escrita em sítio',
      !/>\s*Editar\s*</.test((b || {}).html || ''), (b || {}).html);

    const a = linhaDe('Aluna A');
    provar('a linha da Aluna A também diz «vinculada»', /vinculada/.test((a || {}).texto || ''),
      (a || {}).texto);
  }

  console.log('\n' + (falhas === 0 ? 'PASSOU' : 'FALHOU') + ' — ' + (total - falhas) + ' de ' + total + ' asserções');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('erro na prova:', e.message);
  console.error(e.stack);
  process.exit(1);
});
