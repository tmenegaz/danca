#!/usr/bin/env node
'use strict';

/**
 * provar-observacao-do-professor.js — o que o professor escreve em «Itens de cada dimensão»
 * chega ao fim do caminho, ou perde-se pelo meio?
 *
 * A PERGUNTA DELA (06/11/2026), depois de aprovar o híbrido — os objetivos do plano entram
 * sozinhos, a caixa fica para o que é só dela:
 *
 *   «Eu preciso ter certeza de que quando o professor escrever alguma observação aqui, ela vai ser
 *    acrescentada. […] É algo que não vai se perder o que o professor escrever?»
 *
 * É a pergunta certa, e a resposta não se dá em prosa. O campo passou a ser OPCIONAL, e um campo
 * opcional que se perde em silêncio é pior do que um obrigatório: ninguém dá pela falta.
 *
 * O CAMINHO QUE SE MEDE — e são CINCO leitores do mesmo dado:
 *
 *   o `textarea` da dimensão → `RESPOSTAS` → o corpo do envelope (`itens-por-dimensao`)
 *      → 1. o documento `-po.md` (`derivarPO` → `## Itens de cada dimensão`)
 *      → 2. a folha de captura (`derivarCaptura`): a coluna que se marca
 *      → 3. a declaração `porVariante` (`declaracaoDeCaptura`): a chave que a marca grava
 *      → 4. o guia da aula (`derivarAula01`): o que o professor leva para a sala
 *      → 5. o `po-01.json`, pela EXTRAÇÃO VERDADEIRA (`tools/validar-po-ciclo.js --json`)
 *
 * E DOIS MODOS DE PERDER que existiam, os dois em silêncio — foi por isso que custaram:
 *
 *   · um critério escrito «Exemplo prático do apoio» era DESCARTADO da folha e da declaração
 *     (o filtro do gabarito vazado casava com a palavra «Exemplo»), e o documento continuava a
 *     mostrá-lo: o PO e a folha a discordar sem um erro em lado nenhum;
 *   · um critério escrito «Alinhamento do pé: o arco não cede» perdia a metade depois dos dois
 *     pontos na folha — o cabeçalho é curto de propósito (não estoura a margem), mas a descrição
 *     não estava em lado nenhum do papel.
 *
 * A BANCADA MEDE O GESTO, NÃO A FUNÇÃO. O texto é escrito no `textarea` e o evento corre: quem o
 * lê é o ouvinte delegado da página. Chamar `gravarRespostaDoNo` à mão provaria a função e não a
 * ligação — e a ligação é metade do que se quer guardar.
 *
 *   node experimentos/provar-observacao-do-professor.js
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawnSync } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const { mapa } = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { derivarPO } = require(path.join(RAIZ, 'motor/nucleo/derivar-po.js'));
const { derivarCaptura, derivarAula01, declaracaoDeCaptura } =
  require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));

const CONTEUDO = JSON.parse(fs.readFileSync(path.join(PORTA, 'po', 'conteudo', 'po.json'), 'utf8'));
const MAPA = mapa(CONTEUDO);

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

/* O TEXTO DO PROFESSOR. Ele existe para não poder ser confundido com nada que o sistema escreva:
 * três critérios — um que vira coluna, um com descrição depois dos dois pontos (a legenda da
 * folha), e um que começa por «Exemplo» (o filtro do gabarito). */
const DO_PROFESSOR = 'MARCA-PROFESSORA o arco do pé não cede; alinhamento: a borda externa não '
  + 'rola; Exemplo prático do apoio na barra';
const MARCA = 'MARCA-PROFESSORA';

/* O PLANO — com objetivos, para o híbrido estar ligado enquanto se mede o texto dela. Sem eles a
 * prova mediria o caminho antigo, e é o novo que se quer guardar. O ciclo está declarado porque é
 * dele que o PO o herda. */
const PLANO = {
  id: 'plano-da-prova',
  contexto: { escola: 'prova', professor: 'prova', ciclo: '01', turma: 'Balé Nível 1' },
  respostas: {
    'contexto-turma': { valor: 'Balé Nível 1' },
    'marcos-por-aula': { valor: ['reconhecer o apoio', 'transferir o peso'] },
    'estrutura-de-cada-aula': { valor: [
      { marco: 1, marcados: ['Barra', 'Expressão'] },
      { marco: 2, marcados: ['Barra'] },
    ] },
  },
};

const CONTEXTO = { ciclo: '01', escola: 'prova', escolaNome: 'Prova' };

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

/* O QUE A PÁGINA PEDE, e que ela não dispensa: a curadoria do professor (sem ela o Plano de
 * Observação fica TRAVADO — a memória da aula dada pertence à escola), a estante dos planos (com
 * o ciclo de cada um, que é o que o cabeçalho passa a inscrever) e o envelope do plano. */
function servir(capturados) {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://local');
    const rel = u.pathname.replace(/^\/+/, '').replace(/^plano-observacao\//, '');
    const envia = (tipo, corpo) => { res.writeHead(200, { 'content-type': tipo }); res.end(corpo); };
    const json = (o) => envia(MIME['.json'], JSON.stringify(o));
    if (req.method === 'POST' && rel === 'api/elicitar') {
      let corpo = '';
      req.on('data', (pedaco) => { corpo += pedaco; });
      req.on('end', () => {
        capturados.push(corpo);
        json({ ok: true, id: 'po-da-prova', gravado: true });
      });
      return;
    }
    if (rel === 'api/mapa') return json(MAPA);
    if (rel === 'api/bastidores/curadoria-professor') {
      return json({ ok: true, curadorias: [{ professor: 'prova', turmas: ['Balé Nível 1'],
        tradicao: 'francesa', modalidade: 'balé', alunas: ['Aluna A'] }],
      rotulos: { francesa: 'Francesa' } });
    }
    if (rel === 'api/planos') {
      return json({ ok: true, opcoes: [{ valor: PLANO.id, carimbo: PLANO.id, rotulo: 'Plano da prova',
        detalhe: 'api/envelope/' + PLANO.id, turma: 'Balé Nível 1', ciclo: '01' }] });
    }
    if (rel === 'api/envelope/' + PLANO.id) return json(PLANO);
    if (rel.startsWith('api/bastidores/alunas-da-turma')) {
      return json({ ok: true, escola: 'prova', turma: 'Balé Nível 1', alunas: ['Aluna A'],
        linhaDeBase: { id: 'lb', nome: 'lb', em: '2026-11-06T01:00:00.000Z' },
        recorte: [{ id: 'a', nome: 'Aspecto A', grupo: 'Grupo A' }] });
    }
    if (rel.startsWith('api/bastidores/')) return json({ ok: true, opcoes: [] });
    if (rel.startsWith('api/')) return json({ ok: true, opcoes: [], nos: [] });
    if (rel === 'assets/style.css') {
      return envia(MIME['.css'], fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')));
    }
    if (rel === 'assets/nav.js') {
      return envia(MIME['.js'], fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
    }
    const alvo = rel ? path.join(PORTA, rel) : path.join(PORTA, 'index.html');
    if (alvo.startsWith(PORTA) && fs.existsSync(alvo) && fs.statSync(alvo).isFile()) {
      return envia(MIME[path.extname(alvo)] || 'application/octet-stream', fs.readFileSync(alvo));
    }
    return envia(MIME['.html'], fs.readFileSync(path.join(PORTA, 'index.html')));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () =>
    pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

async function abrir(capturados) {
  const { srv, base } = await servir(capturados);
  const caminho = 'plano-observacao/?professor=prova&escola=prova&ciclo=01';
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  const dom = await JSDOM.fromURL(base + '/' + caminho, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), base + '/' + caminho), i);
      w.CSS = w.CSS || {};
      if (!w.CSS.escape) w.CSS.escape = (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
      w.confirm = () => true;
      w.alert = () => {};
      w.addEventListener('unhandledrejection', (e) => {
        problemas.push('REJEIÇÃO: ' + ((e.reason && e.reason.message) || e.reason));
      });
      w.addEventListener('error', (e) => problemas.push('ERRO: ' + e.message));
    },
  });
  await new Promise((r) => setTimeout(r, 900));
  return { w: dom.window, srv, problemas };
}

(async () => {
  const capturados = [];
  let corpo = null;
  let problemas = [];

  // -------------------------------------------------------------------------------------------
  bloco('A. O PERCURSO: o que se escreve na dimensão chega ao envelope que se grava');
  {
    const { w, srv, problemas: p } = await abrir(capturados);
    problemas = p;
    try {
      /* A ENTRADA, na ordem em que a página a faz: a estante dos planos, o plano escolhido, a
       * cascata. Sem o ciclo herdado do plano a barra não fecha e a página NÃO LIGA os ouvintes
       * do formulário (a trava de entrada) — e a bancada estaria a medir uma página inerte. */
      await w.eval(`(async () => {
        await carregarOpcoesDe(enderecoDosPlanos());
        RESPOSTAS.set('plano-de-ensino', ${JSON.stringify(PLANO.id)});
        await carregarDimensoesDoPlano();
        await carregarPlanoReferenciado();
        mostrarCicloDoPo();
      })()`);
      const faltam = await w.eval('JSON.stringify(contextoFaltando())');
      provar('a barra fecha — o ciclo do ato vem do plano escolhido', faltam === '[]', faltam);

      /* O SEGUNDO ARRANQUE LIGA OS OUVINTES. O primeiro correu com a barra aberta (ainda sem
       * plano): a trava de entrada fechou-a antes de os ouvintes serem registados, e a página
       * ficou pintada mas surda. Não é defeito — é a ordem real, e a bancada segue-a. */
      await w.eval('iniciar().catch(() => {})');
      await new Promise((r) => setTimeout(r, 400));
      await w.eval(`(function(){
        INDICE = MAPA.nos.findIndex((n) => n.id === 'itens-por-dimensao');
        renderPergunta();
        return INDICE;
      })()`);
      await new Promise((r) => setTimeout(r, 400));

      const caixas = await w.eval(`JSON.stringify([].map.call(
        document.querySelectorAll('textarea[data-repeticao]'),
        (t) => ({ dimensao: t.dataset.repeticao, valor: t.value })))`);
      const listaDeCaixas = JSON.parse(caixas);
      provar('há uma caixa por dimensão, e todas nascem vazias',
        listaDeCaixas.length >= 2 && listaDeCaixas.every((c) => c.valor === ''),
        listaDeCaixas.map((c) => c.dimensao));

      /* O GESTO: o valor entra na caixa e o `input` corre, como no browser. */
      const escrito = await w.eval(`(function(){
        var t = document.querySelector('textarea[data-repeticao="Barra"]');
        if (!t) return null;
        t.value = ${JSON.stringify(DO_PROFESSOR)};
        t.dispatchEvent(new Event('input', { bubbles: true }));
        return t.value;
      })()`);
      provar('a caixa do Barra aceita o texto', escrito === DO_PROFESSOR, escrito);
      await new Promise((r) => setTimeout(r, 200));

      const naResposta = await w.eval(`JSON.stringify(RESPOSTAS.get('itens-por-dimensao'))`);
      provar('o ouvinte da página grava em RESPOSTAS, na forma canónica [{sujeito, itens}]',
        Boolean(naResposta) && naResposta.indexOf(MARCA) !== -1
        && naResposta.indexOf('"sujeito":"Barra"') !== -1, naResposta);

      /* O CORPO DO ENVELOPE, montado pela função do «Guardar» — e depois ENVIADO, para se ler o
       * que passou pelo fio. Uma reconstrução da prova mediria o que o teste sabe. */
      const pacote = await w.eval('JSON.stringify(pacoteParaEnviar()["itens-por-dimensao"])');
      provar('o pacote do envelope leva o texto', Boolean(pacote) && pacote.indexOf(MARCA) !== -1,
        pacote);
      await w.eval('enviar(false)');
      await new Promise((r) => setTimeout(r, 300));
      provar('o POST do «Guardar» levou o texto no corpo', capturados.length === 1
        && capturados[0].indexOf(MARCA) !== -1, capturados.map((c) => c.slice(0, 120)));
      provar('nenhum erro de JavaScript na página', problemas.length === 0, problemas.slice(0, 3));
      corpo = capturados.length ? JSON.parse(capturados[0]) : null;
    } finally {
      try { w.close(); } catch (erro) { /* já fechada */ }
      srv.close();
    }
  }

  // -------------------------------------------------------------------------------------------
  bloco('B. OS CINCO LEITORES do mesmo dado — a partir do envelope que passou pelo fio');
  {
    /* O ENVELOPE DA PROVA É O QUE A PÁGINA ENVIOU. Ler daqui é ler o que o servidor recebe — não
     * uma fixture que a prova arranjou para si. */
    const ENVELOPE = { id: 'po-da-prova', contexto: (corpo && corpo.contexto) || CONTEXTO,
      respostas: (corpo && corpo.respostas) || {} };
    provar('o envelope enviado traz o ciclo herdado do plano',
      String((ENVELOPE.contexto || {}).ciclo || '') === '01', ENVELOPE.contexto);

    const documento = derivarPO(ENVELOPE, PLANO).markdown;
    const desdeItens = documento.slice(documento.indexOf('## Itens de cada dimensão'));
    provar('1. o documento `-po.md` imprime o texto na secção dos itens',
      documento.indexOf('## Itens de cada dimensão') !== -1 && desdeItens.indexOf(MARCA) !== -1);

    const captura = derivarCaptura({ po: ENVELOPE, plano: PLANO, contexto: CONTEXTO });
    provar('2. a folha de captura pede o critério numa coluna', captura.indexOf(MARCA) !== -1);

    const declaracao = declaracaoDeCaptura({ po: ENVELOPE, plano: PLANO, escola: 'Prova' });
    const colunas = Object.values(declaracao.blocos).flatMap((b) => Object.keys(b.colunas));
    provar('3. a declaração `porVariante` declara a coluna — é por ela que a marca se grava',
      colunas.some((c) => c.indexOf(MARCA) !== -1), colunas);

    const guia = derivarAula01({ plano: PLANO, po: ENVELOPE, contexto: CONTEXTO });
    provar('4. o guia da aula repete o critério', String(guia).indexOf(MARCA) !== -1);

    /* 5. A EXTRAÇÃO VERDADEIRA: o documento vai ao validador e o que sai é o `po-01.json` que os
     * derivados leem. Não se reconstrói o JSON na prova — lê-se o que a ferramenta produz. O
     * código de saída NÃO se exige zero: esta fixture não preenche os campos obrigatórios todos,
     * e o que se mede é se o texto dela sobrevive à extração. */
    const arquivo = path.join(os.tmpdir(), 'po-professora-' + process.pid + '.md');
    fs.writeFileSync(arquivo, documento);
    let extraido = null;
    try {
      const r = spawnSync(process.execPath, [path.join(RAIZ, 'tools/validar-po-ciclo.js'),
        path.join(RAIZ, 'modelo/ciclos/ciclo-01-po-schema.json'), arquivo, '--json'],
      { encoding: 'utf8' });
      try { extraido = JSON.parse(r.stdout); } catch (erro) { extraido = null; }
    } finally {
      fs.rmSync(arquivo, { force: true });
    }
    provar('5. o `po-01.json` extraído guarda o texto em `itensPorDimensao`',
      JSON.stringify(extraido && extraido.itensPorDimensao).indexOf(MARCA) !== -1,
      JSON.stringify(extraido && extraido.itensPorDimensao).slice(0, 240));
  }

  // -------------------------------------------------------------------------------------------
  bloco('C. OS DOIS MODOS DE PERDER, fechados no mesmo dia');
  {
    const PO = (itens) => ({ contexto: {}, respostas: {
      sujeitos: { valor: ['Aluna A'] },
      'dimensoes-de-observacao': { valor: ['Barra'] },
      'itens-por-dimensao': { valor: [{ sujeito: 'Barra', itens }] },
    } });

    /* O FILTRO DO GABARITO. O conteúdo escreve os exemplos ENTRE « » (`Ex.: «…»`); um critério
     * que começa por «Exemplo» não é gabarito — é dela, e tem de ficar. */
    const doExemplo = derivarCaptura({ po: PO('Exemplo prático do apoio na barra'),
      plano: null, contexto: CONTEXTO });
    const declaracaoDoExemplo = declaracaoDeCaptura({ po: PO('Exemplo prático do apoio na barra'),
      escola: 'Prova' });
    const colunasDoExemplo = Object.values(declaracaoDoExemplo.blocos)
      .flatMap((b) => Object.keys(b.colunas));
    provar('um critério que começa por «Exemplo» NÃO é descartado (era o filtro do gabarito)',
      doExemplo.indexOf('Exemplo prático do apoio na barra') !== -1
      && colunasDoExemplo.some((c) => c.indexOf('Exemplo prático') !== -1), colunasDoExemplo);
    /* …E A ASSERÇÃO NEGATIVA, que é a que impede o filtro de ser simplesmente apagado. */
    const doGabarito = derivarCaptura({ po: PO('Ex.: «alinhamento da pelve sobre os apoios», '
      + '«resposta ao pulso sem contagem»'), plano: null, contexto: CONTEXTO });
    provar('…e o gabarito vazado do conteúdo continua a ser descartado',
      !/alinhamento da pelve sobre os apoios/.test(doGabarito));

    /* A DESCRIÇÃO DEPOIS DOS DOIS PONTOS. O cabeçalho da coluna fica curto de propósito (é ele
     * que não pode estourar a margem); a descrição vai numa legenda, para o papel não perder a
     * metade que o professor escreveu. */
    const comDescricao = derivarCaptura({ po: PO('Alinhamento do pé: a borda externa não rola'),
      plano: null, contexto: CONTEXTO });
    provar('o cabeçalho da coluna fica curto',
      /\| Alinhamento do pé \|/.test(comDescricao));
    provar('…e a descrição sai numa legenda, para não se perder do papel',
      /\*\*Alinhamento do pé\*\* — a borda externa não rola/.test(comDescricao),
      comDescricao.slice(comDescricao.indexOf('O que cada critério')));
    provar('…e sem descrição nenhuma a legenda não aparece (não se inventa secção)',
      derivarCaptura({ po: PO('apoio do pé'), plano: null, contexto: CONTEXTO })
        .indexOf('O que cada critério') === -1);
  }

  // -------------------------------------------------------------------------------------------
  bloco('D. A FOLHA E A DECLARAÇÃO FALAM DO MESMO — o defeito assimétrico do «Guardar»');
  {
    /* O DEFEITO, medido. O `escrever-ciclo.js` derivava a folha SEM o plano e a declaração COM
     * ele: a folha ficava com as colunas que o professor escreveu, a declaração com essas MAIS as
     * que os objetivos do plano acrescentam — e a folha impressa deixava de pedir metade do que o
     * sistema ia guardar. Nenhum validador o via, porque o `validar-captura-ciclo.js` só reprova
     * no sentido contrário (coluna na folha que o schema não declara); a coluna declarada e
     * ausente da folha passa em silêncio.
     *
     * O que esta secção guarda é a invariante que faltava, e ela mede-se nos dois sentidos. */
    const PO = { contexto: {}, respostas: {
      sujeitos: { valor: ['Aluna A'] },
      'dimensoes-de-observacao': { valor: ['Barra'] },
      'itens-por-dimensao': { valor: [{ sujeito: 'Barra', itens: MARCA + ' o arco do pé' }] },
    } };
    const colunasDeclaradas = (declaracao) => Object.values(declaracao.blocos)
      .flatMap((b) => Object.keys(b.colunas));

    const folha = derivarCaptura({ po: PO, plano: PLANO, contexto: CONTEXTO });
    const declaradas = colunasDeclaradas(declaracaoDeCaptura({ po: PO, plano: PLANO, escola: 'Prova' }));
    provar('com o plano nos dois lados, toda coluna declarada está na folha',
      declaradas.every((c) => folha.indexOf(c) !== -1), { declaradas, folha });

    /* O CONTRA-EXEMPLO, e é ele que dá sentido à linha de cima: a folha derivada SEM o plano não
     * tem a coluna que o objetivo acrescenta. Se um dia a folha voltar a ser derivada sem o
     * plano, a asserção acima reprova por esta mesma razão. */
    const folhaSemPlano = derivarCaptura({ po: PO, plano: null, contexto: CONTEXTO });
    provar('derivada SEM o plano, a folha perde a coluna do objetivo (a razão de a passar)',
      !/[Rr]econhecer o apoio/.test(folhaSemPlano)
      && /[Rr]econhecer o apoio/.test(folha),
      folhaSemPlano.split('\n').filter((l) => l.indexOf('|') === 0).slice(0, 3));
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: o que o professor escreve em «Itens de cada '
    + 'dimensão» atravessa o gesto, o envelope e os cinco leitores (documento, folha, declaração, '
    + 'guia e po-01.json), e os dois modos de o perder em silêncio estão fechados — com o gabarito '
    + 'vazado ainda descartado.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
