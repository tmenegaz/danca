#!/usr/bin/env node
'use strict';

/**
 * provar-estante-do-po.js — quais planos de ensino o PO oferece, e como se chama o botão que fecha.
 *
 * OS DOIS DEFEITOS QUE ELA RELATOU na mesma tarde (07/11/2026), a ajustar o PO depois de a aluna
 * B entrar no elenco:
 *
 *   1. **«o sistema passa a exibir DOIS planos de ensino»**. Ela ajustara o plano de ensino para
 *      incluir a aluna nova — o que criou um elo (`plano-…-2206`, com `ajuste_de: plano-…-2201`) —
 *      e a estante do PO passou a oferecer os dois.
 *
 *      **O remédio de 07/11 foi metade, e ela apanhou-o a 22/11/2026:** «o item dois […] você
 *      preencheu com dois planos de ensino. […] que não é para ter dois aqui dentro do mesmo
 *      ciclo. E você colocou o mesmo objetivo deles, mas você tomou uma nota no segundo que diz
 *      versão anterior. E não pode ser assim, isso está errado.» Ficou de fora a EXCEPÇÃO — o
 *      plano que o documento já apontava continuava listado, com «(versão anterior)» no rótulo.
 *      Quando o documento aponta um elo substituído, a lista mostra dois. Hoje a lista segue a
 *      cadeia até ao topo e o campo abre no vigente; o elo antigo continua na estante, e é o
 *      histórico que o lê. Pior: com o MESMO rótulo («Teste»), porque o
 *      rótulo é o objetivo e o objetivo não mudou. A proveniência está certa; o que estava errado
 *      é a lista de ESCOLHA mostrar a história. Quem escolhe qual plano observar não está a ler o
 *      passado — está a decidir o presente, e ali a versão anterior não é uma opção: é a mesma
 *      coisa, mais velha.
 *
 *   2. **«o botão é o fechar o plano de observação»** — e dizia «Fechar a elicitação».
 *
 * AS FIXTURES SÃO OS ENVELOPES REAIS DA `batata`, lidos do disco — não inventados. É o caso que
 * ela viveu, com os carimbos que ela produziu.
 *
 * O QUE ESTA PROVA MEDE, e por que é que cada asserção existe:
 *
 *   A. A ESTANTE NÃO ESCONDE — MARCA. O servidor devolve todos os planos e diz quem foi
 *      substituído (`anterior`). Cortar a lista no servidor respondia só à pergunta «o que
 *      escolher»; a estante responde também «o que ESTE documento declara», e é daqui que saem a
 *      turma e o ciclo do PO. Com a lista cortada, um PO antigo perdia as duas em silêncio.
 *
 *   B. O HISTÓRICO NÃO SE PERDE. `estadosDosPlanos` continua a devolver todos, com o
 *      `substituido_por` — é o que a listagem do acervo lê.
 *
 *   C. A ESCOLHA NA TELA. Medida em `jsdom`, sobre a porta de verdade: o plano substituído não
 *      aparece na lista; o documento que JÁ o declara continua a vê-lo, dito «(versão anterior)»;
 *      e a leitura da turma desse plano continua a responder — a razão de ser da marca.
 *
 *   D. OS DOIS CLIENTES escondem o substituído. São duas páginas diferentes (a porta e a lista do
 *      acervo): se uma esquecer o filtro, o defeito volta só ali — a assimetria que ninguém
 *      encontra depois.
 *
 *   E. O BOTÃO — o nome do ato que se está a fechar, nas três superfícies.
 *
 *   uso: node experimentos/provar-estante-do-po.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const RAIZ = path.join(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const { criarRotas } = require(path.join(RAIZ, 'motor/servidor/rotas.js'));

let total = 0;
let falhas = 0;
function conferir(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + rotulo); return; }
  falhas += 1;
  console.log('  ✗ ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/**
 * Os envelopes REAIS de uma escola VIVA, do disco — a `breu` desde 20/11/2026.
 *
 * A `batata` foi expurgada (é o ciclo de vida de uma escola de teste), e esta função lia a pasta
 * dela: a prova morreu com `ENOENT` e ficou meses sem correr. Ler a escola VIVA é o que a mantém
 * honesta — e a prova não fixa carimbos: descobre o topo da cadeia e o elo que ele substituiu.
 */
const ESCOLA_VIVA = 'breu';
const PROFESSOR_VIVO = 'demi-plie';
function armazenamentoDaEscolaViva() {
  const dir = path.join(RAIZ, 'escola', ESCOLA_VIVA, 'envelopes');
  const mapa = {};
  for (const f of fs.readdirSync(dir)) mapa['envelope/' + f] = fs.readFileSync(path.join(dir, f), 'utf8');
  return criarMemoria(mapa);
}

/** O topo da cadeia e o elo que ele declara ter ajustado — descobertos, não escritos à mão. */
function ultimoElo(lista) {
  const ordenada = lista.slice().sort((a, b) => (a.carimbo < b.carimbo ? 1 : -1));
  const recenteComElo = ordenada.find((o) => o.ajuste_de);
  return recenteComElo
    ? { novo: recenteComElo.carimbo, velho: recenteComElo.ajuste_de }
    : { novo: ordenada[0] && ordenada[0].carimbo, velho: null };
}

/** Planos encadeados à mão — para o caso do elo intermédio (A→B→C) e do par independente. */
function armazenamentoComCadeia(ids) {
  const mapa = {};
  ids.forEach(([id, ajusteDe], i) => {
    mapa['envelope/' + id + '.json'] = JSON.stringify({
      id,
      contexto: { escola: 'fita', professor: 'tiago-menegaz', ciclo: '01', turma: 'Turma Única' },
      gerado_em: '2026-11-0' + (i + 1) + 'T10:00',
      ajuste_de: ajusteDe || undefined,
      respostas: {
        'objetivo-geral': { valor: 'Equilíbrio' },
        'contexto-turma': { valor: 'Turma Única' },
      },
    });
  });
  return criarMemoria(mapa);
}

/* ---------------------------------------------------------------------------------------- *
 * A BANCADA DA TELA — a porta de verdade, servida sobre o motor de verdade. O único stub é o
 * cadastro da Produção, que vive noutro Worker (`provar-recorte-do-po` faz o mesmo).
 * ---------------------------------------------------------------------------------------- */

const PORTA = path.join(RAIZ, 'porta');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(PORTA, p), 'utf8'));

const VELHO = 'plano-20261107-2201';
const NOVO = 'plano-20261107-2206';
const TURMA = 'Batata — Sala Rosa';

const resposta = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });

async function semearCadeia(memoria) {
  const plano = (id, ajusteDe) => JSON.stringify({
    id,
    contexto: { escola: 'x', professor: 'dedao-aberto', ciclo: '01', turma: TURMA },
    gerado_em: id,
    ajuste_de: ajusteDe || undefined,
    respostas: {
      'contexto-professor': resposta('Dedão Aberto'),
      'contexto-turma': resposta(TURMA),
      'objetivo-geral': resposta('Teste'),
    },
  });
  await memoria.guardar('envelope/' + VELHO + '.json', plano(VELHO, null));
  await memoria.guardar('envelope/' + NOVO + '.json', plano(NOVO, VELHO));
  await memoria.guardar('envelope/anamnese-20261107-2201.json', JSON.stringify({
    id: 'anamnese-20261107-2201',
    contexto: { escola: 'x', professor: 'dedao-aberto', ciclo: '01', aluna: 'Aluna A' },
    respostas: {},
  }));
  const nomes = (await memoria.listar('envelope/')).map((c) => c.slice('envelope/'.length));
  await memoria.guardar('envelope/.indice.json', JSON.stringify({ nomes }));
}

const CADASTRO = {
  '/api/bastidores/professores': () => ({
    ok: true, escola: 'x',
    professores: [{ nome: 'Dedão Aberto', slug: 'dedao-aberto' }],
  }),
  '/api/bastidores/alunas': () => ({ ok: true, alunas: ['Aluna A'] }),
  '/api/bastidores/turmas': () => ({
    ok: true,
    turmas: [{ id: 'turma-1', nome: TURMA, ativo: true }],
    opcoes: [{ valor: TURMA, rotulo: TURMA }],
  }),
  '/api/bastidores/turma-conteudos': () => ({ ok: true, relacoes: {} }),
  '/api/bastidores/termos': () => ({ ok: true, termos: [], opcoes: [] }),
  '/api/bastidores/validar-senha': () => ({ ok: true }),
};

async function subir(memoria) {
  const rotas = criarRotas({
    armazenamento: memoria,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    escolaDoWorker: 'x',
    lerCuradorias: async () => [{ professor: 'dedao-aberto', turma: TURMA, alunas: ['Aluna A'] }],
  });

  const servidor = http.createServer(async (pedido, respostaHttp) => {
    const url = new URL(pedido.url, 'http://x');

    const cadastro = CADASTRO[url.pathname];
    if (cadastro) {
      respostaHttp.writeHead(200, { 'Content-Type': 'application/json' });
      return respostaHttp.end(JSON.stringify(cadastro()));
    }
    if (url.pathname === '/api/bastidores/curadoria-professor') {
      const curadorias = [{ professor: 'dedao-aberto', turma: TURMA, alunas: ['Aluna A'] }];
      respostaHttp.writeHead(200, { 'Content-Type': 'application/json' });
      return respostaHttp.end(JSON.stringify({ ok: true, escola: 'x', professor: 'dedao-aberto', curadorias }));
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      respostaHttp.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return respostaHttp.end(fs.readFileSync(path.join(PORTA, 'index.html')));
    }
    // O `markdown.js` da porta pede-se em `/plano-observacao/assets/…` (o caminho absoluto
    // do ficheiro, que é o único que o ASSETS serve nos três endereços da porta) — e por isso
    // a bancada lê o caminho sem esse prefixo, como o Worker faz.
    if (url.pathname.replace(/^\/plano-observacao/, '').indexOf('/assets/') === 0) {
      const mapa = {
        '/assets/markdown.js': path.join(PORTA, 'assets/markdown.js'),
        '/assets/nav.js': path.join(RAIZ, 'tools/templates/nav.js'),
        '/assets/style.css': path.join(RAIZ, 'tools/templates/ciclo.css'),
        '/assets/favicon.svg': path.join(RAIZ, 'tools/templates/marca/favicon.svg'),
        '/assets/lib-cifra.js': path.join(RAIZ, 'tools/lib-cifra.js'),
      };
      const arquivo = mapa[url.pathname.replace(/^\/plano-observacao/, '')];
      if (arquivo && fs.existsSync(arquivo)) {
        const tipo = arquivo.endsWith('.css') ? 'text/css'
          : arquivo.endsWith('.svg') ? 'image/svg+xml' : 'text/javascript';
        respostaHttp.writeHead(200, { 'Content-Type': tipo });
        return respostaHttp.end(fs.readFileSync(arquivo));
      }
      respostaHttp.writeHead(404);
      return respostaHttp.end('');
    }

    const r = await rotas.responder(new Request(url.href, {
      method: pedido.method,
      headers: pedido.headers,
    }));
    respostaHttp.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json' });
    return respostaHttp.end(await r.text());
  });

  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  return {
    base: 'http://127.0.0.1:' + servidor.address().port,
    fechar: () => servidor.close(),
  };
}

function esperar(condicao, limite) {
  const fim = Date.now() + (limite || 5000);
  return new Promise((ok, falhar) => {
    const passo = () => {
      let pronto = false;
      try { pronto = condicao(); } catch { pronto = false; }
      if (pronto) return ok();
      if (Date.now() > fim) return falhar(new Error('tempo esgotado'));
      setTimeout(passo, 40);
    };
    passo();
  });
}

async function abrir(base) {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const virtual = new VirtualConsole();
  const erros = [];
  virtual.on('jsdomError', (e) => {
    if (/Not implemented/.test(e.message)) return;
    if (/Could not load (link|script): "[^"]*\/assets\//.test(e.message)) return;
    erros.push(e.message);
  });
  const dom = await JSDOM.fromURL(
    base + '/?fonte=po&escola=x&professor=dedao-aberto&ciclo=01',
    {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      virtualConsole: virtual,
      beforeParse(janela) {
        janela.fetch = (u, o) => fetch(new URL(u, janela.location.href).href, o);
        janela.CSS = { escape: (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c) };
        janela.matchMedia = () => ({
          matches: false,
          media: '',
          addEventListener() {},
          removeEventListener() {},
          addListener() {},
          removeListener() {},
        });
      },
    });
  await esperar(() => dom.window.document.querySelectorAll('#roteiro li[data-i]').length > 0, 8000);
  return { janela: dom.window, documento: dom.window.document, erros };
}

const texto = (el) => String((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

/* ---------------------------------------------------------------------------------------- */

(async () => {
  // ==========================================================================================
  console.log('\nA. A ESTANTE NÃO ESCONDE — MARCA quem foi substituído');

  const arm = armazenamentoDaEscolaViva();
  const estante = await porta.planos(arm, { professor: PROFESSOR_VIVO });
  const carimbos = estante.map((o) => o.carimbo);
  const elo = ultimoElo(estante);
  const original = estante.find((o) => o.carimbo === elo.velho) || {};
  const ajuste = estante.find((o) => o.carimbo === elo.novo) || {};
  conferir('a estante da escola viva traz a cadeia inteira — o histórico não se corta',
    carimbos.indexOf(elo.velho) !== -1 && carimbos.indexOf(elo.novo) !== -1, [elo, carimbos.length]);
  conferir('…e o original vem MARCADO como anterior', original.anterior === true, original);
  /* A ESCOLA CRESCE — e a prova não pode congelar o quanto. Em 08/11/2026, um PO novo ajustou o
   * plano outra vez e o `plano-…-2206`, que era o topo, passou a ter sucessor. O que se afirma é a
   * REGRA: a cadeia tem um topo só, e é o único que ninguém declara ter ajustado. */
  const vigentes = estante.filter((o) => !o.anterior).map((o) => o.carimbo);
  const declarados = new Set(estante.map((o) => o.ajuste_de).filter(Boolean));
  conferir('…e só o TOPO da cadeia fica sem marca — os elos do meio também a têm',
    vigentes.length === 1 && !declarados.has(vigentes[0]),
    { vigentes, ajustados: [...declarados] });
  /* O TOPO NÃO TEM A MARCA — `anterior` só existe em quem foi substituído, e a ausência do campo
   * é o que diz «vigente». Afirmar `=== false` era afirmar a FORMA do objecto, e não a regra. */
  conferir('…e o TOPO da cadeia não tem a marca',
    ajuste.anterior !== true && original.anterior === true,
    { topo: ajuste.carimbo, topoAnterior: ajuste.anterior, eloAnterior: original.anterior });
  /* O RÓTULO É O OBJETIVO DO PLANO — e quando o ajuste não lhe mexe, os dois elos têm o MESMO
   * rótulo. É isso que torna as duas opções indistinguíveis na escolha, e é a razão de a lista
   * não poder ter duas. Não se fixa o texto: os objetivos desta escola mudam a cada ronda. */
  conferir('o rótulo continua a ser o do conteúdo — e é o MESMO nos dois elos da cadeia',
    !!original.rotulo && original.rotulo === ajuste.rotulo, [original.rotulo, ajuste.rotulo]);

  /* O ELO INTERMÉDIO (A→B→C): A e B têm sucessor, C não. Quem escolhe esconde os dois e mostra o
   * topo — e a marca diz isso sem que ninguém recalcule a cadeia na tela. */
  const cadeia = armazenamentoComCadeia([
    ['plano-A', null], ['plano-B', 'plano-A'], ['plano-C', 'plano-B'],
  ]);
  const daCadeia = await porta.planos(cadeia, { professor: 'tiago-menegaz' });
  const marcados = daCadeia.filter((o) => o.anterior).map((o) => o.carimbo);
  conferir('numa cadeia A→B→C, os dois elos anteriores vêm marcados, e o topo não',
    daCadeia.length === 3 && marcados.sort().join(',') === 'plano-A,plano-B'
      && !daCadeia.find((o) => o.carimbo === 'plano-C').anterior,
    daCadeia.map((o) => [o.carimbo, o.anterior]));

  const semElo = armazenamentoComCadeia([['plano-X', null], ['plano-Y', null]]);
  const independentes = await porta.planos(semElo, { professor: 'tiago-menegaz' });
  conferir('dois planos que nunca foram ajustados não têm marca — a regra é sobre a cadeia',
    independentes.length === 2 && independentes.every((o) => !o.anterior),
    independentes.map((o) => [o.carimbo, o.anterior]));

  /* O RECORTE DO PROFESSOR CONTINUA A VALER — a mudança não pode ter aberto essa porta. */
  const deOutro = await porta.planos(arm, { professor: 'professor-que-nao-e-deste-plano' });
  conferir('o recorte pelo professor continua a valer', deOutro.length === 0, deOutro.map((o) => o.carimbo));

  // ==========================================================================================
  console.log('\nB. O HISTÓRICO NÃO SE PERDE — a listagem continua a ver os dois');

  const estados = await porta.estadosDosPlanos(arm);
  /* O NÚMERO NÃO É O FIXO — é o da estante: a listagem vê tudo o que a escolha vê. */
  conferir('os estados continuam a trazer TODOS os planos da estante',
    Object.keys(estados).length === estante.length, [Object.keys(estados).length, estante.length]);
  conferir('…e o original diz quem o substituiu',
    (estados[elo.velho] || {}).substituido_por
    && estados[elo.velho].substituido_por.indexOf(elo.novo) !== -1,
    estados[elo.velho]);
  conferir('…e o vigente diz que é ajuste de outro',
    (estados[elo.novo] || {}).ajuste_de === elo.velho, estados[elo.novo]);

  // ==========================================================================================
  console.log('\nC. A ESCOLHA NA TELA — um plano, e o do documento em mãos quando ele o declara');

  const memoria = criarMemoria();
  await semearCadeia(memoria);
  const servidor = await subir(memoria);
  try {
    const { janela, documento, erros } = await abrir(servidor.base);
    const iPlano = janela.eval('MAPA.nos.findIndex((n) => n.id === "plano-de-ensino")');
    janela.irPara(iPlano, false);
    await esperar(() => documento.querySelectorAll('.grade .opcao').length > 0, 8000);

    const listaDePlanos = () => [...documento.querySelectorAll('.grade .opcao')].map(texto);
    const inicial = listaDePlanos();
    conferir('a lista do PO oferece UM plano, e não os dois', inicial.length === 1, inicial);
    conferir('…e é o VIGENTE (o ajuste), sem a marca', inicial.length === 1
      && inicial[0].indexOf('versão anterior') === -1, inicial);

    /* O DOCUMENTO ANTIGO — e aqui está a correção de 22/11/2026.
     *
     * O REMÉDIO DE 07/11 era deixar ficar o plano que o documento aponta, com «(versão anterior)»
     * no rótulo, e isso mostrava DOIS planos com o mesmo objetivo — exactamente o que ela recusou.
     * Agora o campo segue a cadeia até ao topo: um plano, o vigente, e uma nota que diz o que
     * aconteceu. A âncora de 07/11 era razoável (a gravação seguinte não podia perder a
     * referência em silêncio); a nota é o que a substitui — a referência muda À VISTA. */
    janela.eval('RESPOSTAS.set("plano-de-ensino", ' + JSON.stringify(VELHO) + '); renderPergunta();');
    await esperar(() => listaDePlanos().length === 1
      && /foi ajustado/.test(documento.body.textContent), 3000);
    const comAnterior = listaDePlanos();
    conferir('com o documento a apontar para o elo antigo, continua a haver UM plano',
      comAnterior.length === 1, comAnterior);
    conferir('…e nenhuma opção diz «versão anterior» — não há duas para distinguir',
      comAnterior.every((t) => t.indexOf('versão anterior') === -1), comAnterior);
    conferir('…e o campo passa a apontar o VIGENTE da mesma cadeia',
      janela.eval('String(RESPOSTAS.get("plano-de-ensino") || "")') === NOVO,
      janela.eval('String(RESPOSTAS.get("plano-de-ensino") || "")'));
    conferir('…e uma nota diz que o plano foi ajustado, em vez de o mudar em silêncio',
      /foi ajustado/.test(documento.body.textContent)
        && documento.body.textContent.indexOf(VELHO) !== -1,
      (documento.body.textContent.match(/Este documento apontava[^.]*\./) || [''])[0].slice(0, 200));

    /* A LEITURA QUE JUSTIFICA A MARCA. A turma do plano declarado sai da estante; se o servidor
     * tivesse cortado o original, esta linha devolvia `null` e o cabeçalho do PO perdia a turma. */
    conferir('a turma do plano antigo continua a ler-se da estante',
      janela.eval('turmaDoPlanoReferenciado()') === TURMA,
      janela.eval('turmaDoPlanoReferenciado()'));
    conferir('a página não teve erro de script', erros.length === 0, erros.slice(0, 3));
  } finally {
    servidor.fechar();
  }

  // ==========================================================================================
  console.log('\nD. OS DOIS CLIENTES escondem o substituído — sem excepção nenhuma');

  const portaHtml = fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8');
  /* A EXCEPÇÃO MORREU A 22/11/2026: era ela (`|| String(o.valor) === escolhido`) que punha o
   * segundo plano na lista. O que se mede agora é a ausência dela e a presença da travessia. */
  conferir('a porta esconde TODO plano substituído — a excepção de 07/11 saiu da lista',
    /lista = lista\.filter\(\(o\) => !o\.anterior\);/.test(portaHtml)
      && !/!o\.anterior \|\| String\(o\.valor\) === escolhido/.test(portaHtml), null);
  conferir('…e segue a cadeia do elo antigo até ao topo, em vez de o mostrar com uma nota',
    /topoDaCadeia/.test(portaHtml) && /String\(o\.ajuste_de \|\| ''\) === atual/.test(portaHtml), null);
  conferir('…e diz à pessoa que a referência mudou (não a muda em silêncio)',
    /Este documento apontava o/.test(portaHtml) && /foi ajustado/.test(portaHtml), null);
  conferir('…e já não escreve «(versão anterior)» em opção nenhuma',
    !/\(versão anterior\)/.test(portaHtml.replace(/^\s*\*.*$/gm, '')), null);

  const acervo = fs.readFileSync(path.join(RAIZ, 'motor/servidor/listas-do-acervo.js'), 'utf8');
  conferir('a lista do acervo esconde o substituído, pela mesma regra e sem excepção',
    /return !p\.anterior;/.test(acervo)
      && !/!p\.anterior \|\| String\(p\.carimbo \|\| p\.valor\) === atual/.test(acervo), null);
  conferir('…e segue a MESMA travessia da cadeia (uma regra, dois clientes)',
    /topoDaCadeia/.test(acervo) && /String\(PLANOS\[i\]\.ajuste_de \|\| ''\) === v/.test(acervo), null);

  // ==========================================================================================
  console.log('\nE. O BOTÃO — o nome do ato que se está a fechar');

  conferir('o rótulo sai de `CAMINHO_NA_BARRA`, e não de três textos escritos à mão',
    /function rotuloDeFechar\(\)[\s\S]{0,300}CAMINHO_NA_BARRA\[FONTE\]/.test(portaHtml), null);
  conferir('…e o botão mostra-o, e não só o `title` (o `title` não existe no telefone)',
    /fechar\.textContent = rotuloDeFechar\(\);/.test(portaHtml), null);
  conferir('…e o `title` também',
    /fechar\.title = faltam[\s\S]{0,200}: rotuloDeFechar\(\);/.test(portaHtml), null);

  /* AS TRÊS SUPERFÍCIES, uma a uma — os `ato` de `CAMINHO_NA_BARRA` são o vocabulário da casa. */
  const mapa = (portaHtml.match(/const CAMINHO_NA_BARRA = \{[\s\S]*?\n\};/) || [''])[0];
  conferir('a anamnese fecha «a anamnese»', /anamnese: \{[^}]*ato: 'a anamnese'/.test(mapa), mapa.slice(0, 200));
  conferir('o plano de ensino fecha «o plano de ensino»',
    /plano: \{[^}]*ato: 'o plano de ensino'/.test(mapa), null);
  conferir('o plano de observação fecha «o Plano de Observação»',
    /po: \{[^}]*ato: 'o Plano de Observação'/.test(mapa), null);
  /* E «elicitação» já não é o texto do botão — nem o da marcação, nem o das três superfícies.
   * Ele pode continuar a aparecer em comentário (a história do botão é útil), mas não no rótulo
   * que se lê. */
  conferir('a marcação do botão já não diz «elicitação»',
    !/<button id="fechar"[^>]*>Fechar a elicitação<\/button>/.test(portaHtml), null);
  conferir('…e o rótulo de recurso é «Fechar», não o nome técnico',
    /return c && c\.ato \? 'Fechar ' \+ c\.ato : 'Fechar';/.test(portaHtml), null);

  console.log('\n' + (falhas === 0 ? 'PASSOU' : 'FALHOU') + ' — ' + (total - falhas) + ' de ' + total + ' asserções');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('erro na prova:', e.message);
  console.error(e.stack);
  process.exit(1);
});
