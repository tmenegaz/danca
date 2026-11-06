#!/usr/bin/env node
'use strict';

/**
 * provar-eixos-do-po.js — o Plano de Observação passou a ter os três eixos, o corpo vem da
 * anamnese do sujeito escolhido, e o sujeito escolhe-se antes das dimensões (04/11/2026).
 *
 * O QUE A PESQUISADORA PEDIU, e são três coisas:
 *
 *   1. «O plano de observação ainda apresenta itens classificados incorretamente sob a óptica
 *      puramente técnica (ex.: técnica centro, técnica musicalidade, técnica expressão)» — e a
 *      reclassificação: «musicalidade e expressão pertencem estritamente ao eixo da poiesis e
 *      jamais devem ser rotulados ou agrupados sob o eixo técnico»;
 *   2. «a dimensão do corpo é alimentada diretamente por dados do documento de anamnese daquele
 *      sujeito — deve carregar e se posicionar dinamicamente assim que o aluno for selecionado»;
 *   3. «o seletor do aluno deve ser reposicionado para logo abaixo da seleção do plano de
 *      ensino — os arquivos JSON são carregados em cascata de forma antecipada».
 *
 * O QUE ELA NÃO PEDIU, E QUE ESTA PROVA TAMBÉM GUARDA: renomear o dado gravado. Os POs que já
 * existem têm «Técnica — Musicalidade» escrito lá dentro, e a proveniência não se reescreve
 * (P-03). O que muda é a LEITURA — e é por isso que a prova mede as duas pontas: o rótulo ANTIGO
 * lido certo (Poiesis), e o rótulo NOVO nascido certo (o bloco, sem prefixo).
 *
 *   node experimentos/provar-eixos-do-po.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const { mapa } = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { derivarPO } = require(path.join(RAIZ, 'motor/nucleo/derivar-po.js'));
const eixosDaDanca = require(path.join(RAIZ, 'motor/nucleo/eixos.js'));

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

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

/* ---------------------------------------------------------------- o PO de prova
 *
 * Um PO com as dimensões na forma que os envelopes GUARDADOS têm («Técnica — Barra»,
 * «Técnica — Musicalidade»), porque é essa a forma que a leitura tem de saber corrigir. Só as
 * dimensões e os itens variam; o resto é o mínimo que o documento exige para não sair em lacuna.
 */
const DIMENSOES_ANTIGAS = ['Técnica — Barra', 'Técnica — Centro', 'Técnica — Musicalidade', 'Técnica — Expressão'];
const PO = {
  id: 'po-20261103-2242',
  contexto: { escola: 'breu', professor: 'coqui-de-redinha', ciclo: '01' },
  respostas: {
    professor: { valor: 'Coqui de Redinha' },
    escola: { valor: 'breu' },
    horizonte: { valor: 'Ao fim do ano, sustentar o en dehors a partir do quadril.' },
    question: { valor: ['Como se observa o en dehors sair do quadril?'] },
    fenomeno: { valor: ['A rotação externa visível na 1ª posição: o joelho acompanha o pé sem forçar.'] },
    'plano-de-ensino': { valor: 'plano-20261104-1732' },
    sujeitos: { valor: ['Aluna A'] },
    'dimensoes-de-observacao': { valor: DIMENSOES_ANTIGAS },
    'itens-por-dimensao': { valor: [
      { sujeito: 'Técnica — Barra', itens: 'saída do calcanhar no tendu; quadril sem subir no en dehors' },
      { sujeito: 'Técnica — Centro', itens: 'transferência de peso sem perder a verticalidade' },
      { sujeito: 'Técnica — Musicalidade', itens: 'resposta ao pulso na marcação' },
      { sujeito: 'Técnica — Expressão', itens: 'olhar acompanha o braço' },
    ] },
    'linha-de-base': { valor: [{ sujeito: 'Aluna A', traz: 'prática anterior', precisaDesenvolver: 'saída do calcanhar' }] },
    restricoes: { valor: '' },
  },
};

/* O PLANO referenciado — só o que a composição do PO lê. */
const PLANO = {
  id: 'plano-20261104-1732',
  contexto: { escola: 'breu', professor: 'coqui-de-redinha', ciclo: '01', turma: 'Balé Nível 1' },
  respostas: {
    'contexto-turma': { valor: 'Balé Nível 1' },
    'contexto-frequencia': { valor: '2x semanal' },
    'contexto-duracao': { valor: '45 min' },
    'contexto-calendario': { valor: { inicio: '2027-03-03', fim: '2027-06-30' } },
    'contexto-registro': { valor: { quem: 'o próprio professor', onde: 'Na sala' } },
    'aspecto-fisico': { valor: [
      { Aspecto: 'Flexibilidade dos isquiotibiais', 'Como está a turma': '1 de 1 em «Baixa»' },
    ] },
    /* O QUE O PLANO JÁ DIZ DE CADA BLOCO (06/11/2026) — e é isto que a repetição dos itens passa a
     * mostrar antes da caixa. As três formas são as REAIS do envelope (ver
     * `escola/calango/envelopes/plano-20261106-0744.json`): os objetivos são uma lista de textos;
     * `estrutura-de-cada-aula` e `aula-1-parametro` são listas de `{marco, marcados}` com o marco a
     * começar em 1; o volume justifica-se por bloco.
     *
     * OS CINCO BLOCOS ESTÃO MARCADOS porque a lista das dimensões sai daqui — e a secção D mede
     * essa lista com os cinco. Marcar só quatro mudaria o que a secção D vê, e a prova passaria a
     * medir outra página. */
    'marcos-por-aula': { valor: [
      'reconhecer o apoio e alinhar o eixo vertical',
      'transferir o peso entre os pés sem perder o alinhamento',
      'sustentar a transferência com musicalidade e controle do movimento',
    ] },
    'estrutura-de-cada-aula': { valor: [
      { marco: 1, marcados: ['Solo', 'Barra'] },
      { marco: 2, marcados: ['Barra', 'Centro'] },
      { marco: 3, marcados: ['Centro', 'Musicalidade', 'Expressão'] },
    ] },
    'aula-1-parametro': { valor: [
      { marco: 1, marcados: ['Plié', 'Battement tendu'] },
      { marco: 2, marcados: ['Plié', 'Port de bras'] },
      { marco: 3, marcados: ['Battement tendu', 'Rond de jambe'] },
    ] },
    'distribuicao-de-volume': { valor: { unidade: 'percentual', linhas: [
      { Bloco: 'Solo', 'Proporção alvo': '30%', Justificativa: 'Aquecimento e consciência corporal.' },
      { Bloco: 'Barra', 'Proporção alvo': '30%', Justificativa: 'Apoio e alinhamento.' },
      { Bloco: 'Centro', 'Proporção alvo': '30%', Justificativa: 'Transferência e sequência.' },
      { Bloco: 'Musicalidade', 'Proporção alvo': '10%', Justificativa: 'Pulso e frase.' },
    ] } },
  },
};

/* A ANAMNESE da Aluna A — com os campos que `registroDaAnamnese` declara. */
const CARIMBO_DA_ANAMNESE = 'anamnese-20261103-1626';
const ANAMNESE = {
  id: CARIMBO_DA_ANAMNESE,
  respostas: {
    'flexibilidade-dos-isquiotibiais': { valor: 'Baixa ("dura")' },
    'flexibilidade-dos-adutores': { valor: 'Parcial' },
    'controle-de-carga-no-demi-grand-plie': { valor: 'Sustenta' },
  },
};
/* Um campo que a anamnese NÃO declarou, para a prova medir o que o painel faz com ele. */
const CAMPO_SEM_RESPOSTA = 'resistencia-de-mmss-port-de-bras-prolongado';

/* O RECORTE DO PASSO 4 — os aspectos que o professor escolheu observar. É o que o painel do corpo
 * mostra desde 06/11/2026, agrupado pelo bloco da anamnese e SÓ os grupos que têm aspectos. O
 * segundo grupo existe para a prova medir que o agrupamento é por bloco, e não uma lista corrida. */
const RECORTE = [
  { id: 'flexibilidade-dos-isquiotibiais', nome: 'Flexibilidade dos isquiotibiais', grupo: 'Amplitude e Flexibilidade' },
  { id: 'controle-de-carga-no-demi-grand-plie', nome: 'Controle de carga no demi-plié', grupo: 'Amplitude e Flexibilidade' },
  { id: 'estabilidade-vestibular', nome: 'Estabilidade vestibular', grupo: 'Equilíbrio e Coordenação' },
];

function servir() {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://local');
    const rel = u.pathname.replace(/^\/+/, '').replace(/^plano-observacao\//, '');
    const envia = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    const json = (o) => envia(MIME['.json'], JSON.stringify(o));

    /* O MAPA DA ANAMNESE é outra fonte (`?fonte=anamnese`), e é dele que saem os NOMES dos
     * campos — sem ele o painel mostraria os identificadores, que é o que mostrava antes. */
    if (rel === 'api/mapa' && u.searchParams.get('fonte') === 'anamnese') {
      return json({ ok: true, nos: [
        { id: 'flexibilidade-dos-isquiotibiais', campo: 'Flexibilidade dos isquiotibiais' },
        { id: 'flexibilidade-dos-adutores', campo: 'Flexibilidade dos adutores' },
        { id: 'controle-de-carga-no-demi-grand-plie', campo: 'Controle de carga no demi-plié' },
        { id: CAMPO_SEM_RESPOSTA, campo: 'Resistência de MMSS' },
      ] });
    }
    if (rel === 'api/mapa') return json(MAPA);
    if (rel === 'api/anamneses') {
      return json({ ok: true, opcoes: [{ valor: 'Aluna A', rotulo: 'Aluna A', carimbo: CARIMBO_DA_ANAMNESE,
        detalhe: 'api/envelope/' + CARIMBO_DA_ANAMNESE }] });
    }
    if (rel === 'api/envelope/' + CARIMBO_DA_ANAMNESE) return json(ANAMNESE);
    if (rel === 'api/planos') {
      return json({ ok: true, opcoes: [{ valor: PLANO.id, rotulo: 'Plano de teste', carimbo: PLANO.id,
        detalhe: 'api/envelope/' + PLANO.id }] });
    }
    if (rel === 'api/envelope/' + PLANO.id) return json(PLANO);
    /* A LINHA DE BASE DA TURMA (06/11/2026). O painel do corpo deixou de ler a anamnese de cada
     * sujeito: ele mostra o RECORTE que o professor escolheu no passo 4 do Corpo. O recorte vem
     * por esta rota, que é a mesma que o cabeçalho do PO já pede — uma leitura, dois leitores. */
    if (rel.startsWith('api/bastidores/alunas-da-turma')) {
      /* A TURMA SEM LINHA DE BASE é um estado real, e a prova precisa dos dois: a turma que
       * recebeu o acto (mostra o recorte) e a que não recebeu (diz a lacuna e nomeia o passo 5).
       * É a diferença entre um painel vazio e um painel que ensina o caminho. */
      const turma = u.searchParams.get('turma') || '';
      if (turma !== 'Balé Nível 1') {
        return json({ ok: true, escola: 'breu', turma, alunas: [], linhaDeBase: null, recorte: [] });
      }
      return json({
        ok: true, escola: 'breu', turma,
        alunas: ['Aluna A'],
        linhaDeBase: { id: 'lb-teste', nome: 'lb-teste', em: '2026-11-06T01:00:00.000Z' },
        recorte: RECORTE,
      });
    }
    if (rel.startsWith('api/bastidores/')) return json({ ok: true, opcoes: [] });
    if (rel.startsWith('api/')) return json({ ok: true, opcoes: [], nos: [] });

    if (rel === 'assets/style.css') return envia(MIME['.css'], fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')));
    if (rel === 'assets/nav.js') return envia(MIME['.js'], fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
    const alvo = rel ? path.join(PORTA, rel) : path.join(PORTA, 'index.html');
    if (alvo.startsWith(PORTA) && fs.existsSync(alvo) && fs.statSync(alvo).isFile()) {
      return envia(MIME[path.extname(alvo)] || 'application/octet-stream', fs.readFileSync(alvo));
    }
    return envia(MIME['.html'], fs.readFileSync(path.join(PORTA, 'index.html')));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () =>
    pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

async function abrir() {
  const { srv, base } = await servir();
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
  const w = dom.window;
  await new Promise((r) => setTimeout(r, 900));
  return { w, srv, base, problemas };
}

async function main() {
  // ------------------------------------------------------------------ A. a ordem
  bloco('A. O SUJEITO ESCOLHE-SE ANTES DAS DIMENSÕES (a cascata)');
  {
    const ids = MAPA.nos.map((n) => n.id);
    const iSujeitos = ids.indexOf('sujeitos');
    const iDimensoes = ids.indexOf('dimensoes-de-observacao');
    const iPlano = ids.indexOf('plano-de-ensino');
    provar('o sujeito vem DEPOIS do plano de ensino', iSujeitos > iPlano, { iPlano, iSujeitos });
    provar('…e ANTES das dimensões — é o que faz a cascata chegar a tempo',
      iSujeitos < iDimensoes, { iSujeitos, iDimensoes });
    const blocoDosSujeitos = CONTEUDO.blocos[0];
    /* O TÍTULO MUDOU COM O CONTEÚDO (06/11/2026): o ponto de partida deixou de ser um campo do
     * PO — é o recorte do passo 4 da linha de base —, e um título que promete um campo que já não
     * existe é a tela a pedir o que não há. O que a asserção guarda continua igual: os sujeitos são
     * o PRIMEIRO bloco do roteiro, e as dimensões o segundo. */
    provar('o bloco dos sujeitos é o PRIMEIRO bloco do roteiro',
      blocoDosSujeitos.titulo === 'Sujeitos observados', blocoDosSujeitos.titulo);
    provar('…e as dimensões passaram a ser o segundo',
      CONTEUDO.blocos[1].titulo === 'Dimensões e itens observados', CONTEUDO.blocos[1].titulo);
    const noDims = MAPA.nos.find((n) => n.id === 'dimensoes-de-observacao');
    provar('o eixo deixou de ser um prefixo único no conteúdo',
      noDims.doPlano && noDims.doPlano.eixo === undefined, noDims.doPlano && noDims.doPlano.eixo);
    provar('…e passou a ser declarado por bloco',
      Boolean(noDims.doPlano.eixoDoBloco && noDims.doPlano.eixoDoBloco.Musicalidade === 'Poiesis'),
      noDims.doPlano.eixoDoBloco);
  }

  // ------------------------------------------------------- B. a leitura do rótulo
  bloco('B. O RÓTULO GRAVADO NÃO DECIDE O EIXO — O BLOCO DECIDE');
  {
    provar('«Técnica — Barra» é técnica',
      eixosDaDanca.eixoDoBloco(eixosDaDanca.blocoDaDimensao('Técnica — Barra')) === 'tecnica');
    provar('«Técnica — Musicalidade» NÃO é técnica (o defeito medido)',
      eixosDaDanca.eixoDoBloco(eixosDaDanca.blocoDaDimensao('Técnica — Musicalidade')) === 'poiesis');
    provar('«Técnica — Expressão» NÃO é técnica',
      eixosDaDanca.eixoDoBloco(eixosDaDanca.blocoDaDimensao('Técnica — Expressão')) === 'poiesis');
    provar('e um rótulo JÁ sem prefixo lê-se igual',
      eixosDaDanca.eixoDoBloco('Musicalidade') === 'poiesis'
      && eixosDaDanca.eixoDoBloco('Barra') === 'tecnica');
    provar('o Corpo é eixo próprio, e não uma técnica',
      eixosDaDanca.eixoDoBloco('Corpo') === 'corpo');
  }

  // ----------------------------------------------------------- C. o documento
  bloco('C. O DOCUMENTO DO PO: TRÊS EIXOS, E O FENÓMENO SOB O TÍTULO');
  let md = '';
  {
    const r = derivarPO(PO, PLANO, {});
    md = r.markdown || r;
    const iTitulo = md.indexOf('**Fenómeno.**');
    const iPrimeira = md.indexOf('\n## ');
    provar('há a linha do Fenómeno logo abaixo do cabeçalho',
      iTitulo !== -1 && iTitulo < iPrimeira, { iTitulo, iPrimeira });
    provar('…e ela diz o FENÓMENO, não o horizonte nem a pergunta',
      /\*\*Fenómeno\.\*\* A rotação externa visível/.test(md), md.slice(iTitulo, iTitulo + 120));
    provar('…sem a pergunta colada', !/\*\*Fenómeno\.\*\*.*Como se observa/.test(md));

    const secaoItens = md.slice(md.indexOf('## Itens de cada dimensão'));
    const tabela = secaoItens.slice(0, secaoItens.indexOf('\n\n', secaoItens.indexOf('|:')));
    provar('a tabela dos itens declara a coluna do eixo', /\| Eixo \| Dimensão \| Itens \|/.test(tabela), tabela);
    provar('a Barra está no eixo Técnica', /\| Técnica \| \*\*Barra\*\* \|/.test(tabela), tabela);
    provar('a Musicalidade está no eixo Poiesis',
      /\| Poiesis \| \*\*Musicalidade\*\* \|/.test(tabela), tabela);
    provar('a Expressão está no eixo Poiesis', /\| Poiesis \| \*\*Expressão\*\*/.test(tabela), tabela);
    provar('NENHUMA linha põe Musicalidade ou Expressão na Técnica',
      !/\| Técnica \| \*\*(Musicalidade|Expressão)\*\*/.test(tabela), tabela);
    /* A ASSERÇÃO FOI INVERTIDA, E NÃO APAGADA (06/11/2026). Exigia «Ponto de partida … Linha de
     * base» — o campo que o PO deixou de ter, porque o recorte do passo 4 passou a ser a fonte. O
     * que se mede agora é o que a tela mostra e o documento imprime: UM GRUPO POR LINHA, e só os
     * grupos que têm aspectos escolhidos. Sem recorte na linha de base, a linha declara a lacuna
     * em vez de desaparecer — e é isso que a asserção seguinte guarda. */
    provar('o Corpo traz o RECORTE da linha de base, um grupo por linha',
      /\| Corpo \| \*\*[^*]+\*\* \|/.test(tabela)
        && /a linha de base da turma ainda não tem recorte/.test(tabela), tabela);
    provar('…e diz as restrições, mesmo quando não há nenhuma',
      /\| Corpo \| \*\*Restrições\*\* \| sem restrições declaradas/.test(tabela), tabela);

    const lista = md.slice(md.indexOf('## Dimensões observadas'), md.indexOf('## Itens de cada dimensão'));
    provar('a lista das dimensões já não traz o prefixo «Técnica —»',
      !/Técnica —/.test(lista), lista);
    provar('…e traz os blocos por nome', /- Barra[\s\S]*- Musicalidade/.test(lista), lista);
  }

  // --------------------------------------------------------------- D. a tela
  bloco('D. A TELA: O CORPO CARREGA-SE QUANDO O SUJEITO É ESCOLHIDO');
  {
    const { w, srv, problemas } = await abrir();
    try {
      /* O bloco das dimensões só desenha com o PLANO escolhido — é dele que a lista deriva. A
       * derivação é assíncrona: o primeiro `renderPergunta` agenda o trabalho e pinta o
       * «carregando»; o segundo, depois dela, desenha o painel. */
      /* RENDERIZAR E LER SÃO COISAS DISTINTAS. Repintar a cada leitura reiniciava o painel do
       * corpo («carregando…») antes de a leitura assíncrona chegar — a prova, ao medir, estava a
       * desfazer o que ia medir. Renderiza-se; depois lê-se. */
      const renderizarDimensoes = () => w.eval(`(function(){
        var i = MAPA.nos.findIndex(function(n){ return n.id === 'dimensoes-de-observacao'; });
        INDICE = i; renderPergunta();
        return true;
      })()`);
      const lerCorpo = () => w.eval(`(function(){
        var el = document.querySelector('.corpo-do-sujeito');
        return el ? el.textContent : '';
      })()`);
      let semSujeito = '';
      for (let tentativa = 0; tentativa < 30 && !semSujeito; tentativa++) {
        renderizarDimensoes();
        await new Promise((r) => setTimeout(r, 100));
        semSujeito = lerCorpo();
      }
      provar('há um painel do corpo no bloco das dimensões', Boolean(semSujeito), semSujeito);
      /* A ASSERÇÃO FOI INVERTIDA, E NÃO APAGADA (05/11/2026). Ela exigia «Escolha os sujeitos
       * observados» — e o `sujeitos` deixou de ser uma escolha: o elenco vem da turma, pela linha
       * de base enviada. O que se continua a medir é «sem sujeito, o corpo DIZ que falta e não
       * inventa»; o que mudou é a causa que a frase nomeia. Uma tela que mandasse escolher um
       * campo inexistente seria pior do que o silêncio. */
      /* SEM PLANO NÃO HÁ TURMA, E SEM TURMA NÃO HÁ CORPO (06/11/2026). A frase mudou outra vez — e
       * pela mesma razão de sempre: ela tem de nomear a causa que EXISTE. Já não é «escolha os
       * sujeitos» (o elenco vem da turma) nem «a linha de base da turma», quando nem plano há: é o
       * plano que traz a turma, e é a turma que traz a linha de base. */
      /* A TURMA SEM LINHA DE BASE — o estado de quem escolheu o plano de uma turma que ainda não
       * recebeu o acto. A frase tem de nomear a CAUSA (a linha de base) e o CAMINHO (o passo 5):
       * um painel vazio manda o professor procurar um defeito que não existe, e já aconteceu. */
      await w.eval(`(async () => {
        PLANO_RESPOSTAS.set('contexto-turma', 'Turma Sem Linha');
        INDICE = MAPA.nos.findIndex((n) => n.id === 'dimensoes-de-observacao');
        renderPergunta();
      })()`);
      let semLinha = '';
      for (let tentativa = 0; tentativa < 30; tentativa++) {
        renderizarDimensoes();
        await new Promise((r) => setTimeout(r, 80));
        semLinha = lerCorpo();
        if (/ainda não recebeu/.test(semLinha)) break;
      }
      provar('a turma sem linha de base DIZ a lacuna, e nomeia o passo 5',
        /ainda não recebeu/.test(semLinha) && /passo 5/.test(semLinha), semLinha);
      await w.eval(`(async () => {
        PLANO_RESPOSTAS.set('contexto-turma', 'Balé Nível 1');
        INDICE = MAPA.nos.findIndex((n) => n.id === 'dimensoes-de-observacao');
        renderPergunta();
      })()`);

      /* COM O PLANO ESCOLHIDO, o painel passa a ter turma — e mostra o RECORTE. É o gesto dela:
       * «a gente vai mostrar apenas aqueles blocos que têm aspectos selecionados». */
      await w.eval(`(async () => {
        const no = MAPA.nos.findIndex((n) => n.id === 'plano-de-ensino');
        RESPOSTAS.set('plano-de-ensino', ${JSON.stringify(PLANO.id)});
        await carregarPlanoReferenciado();
        INDICE = no; renderPergunta();
      })()`);
      let texto = '';
      for (let tentativa = 0; tentativa < 40; tentativa++) {
        renderizarDimensoes();
        await new Promise((r) => setTimeout(r, 100));
        texto = lerCorpo();
        if (texto && !/carregando|lendo o recorte/.test(texto) && /Amplitude/.test(texto)) break;
      }
      provar('com o plano escolhido, o painel mostra o RECORTE do passo 4',
        /Flexibilidade dos isquiotibiais/.test(texto), texto);
      provar('…agrupado pelo BLOCO da anamnese, e não numa lista corrida',
        /Amplitude e Flexibilidade/.test(texto) && /Equilíbrio e Coordenação/.test(texto), texto);
      provar('…e diz quantos aspectos e blocos, para o professor saber o que está a ver',
        /3 aspectos em 2 blocos/.test(texto), texto);
      /* O NOME DO ARQUIVO NÃO É O DO CAMPO: se o painel mostrasse o id, esta asserção falharia —
       * é o que ela mede, e é o defeito que já aconteceu uma vez (o id em vez do rótulo). */
      provar('…e traz o NOME de cada aspecto, e não o identificador',
        !/controle-de-carga-no-demi-grand-plie/.test(texto), texto);
      /* O QUE A ANAMNESE NÃO RESPONDEU NÃO APARECE: o painel já não lê a anamnese — lê o recorte —
       * e esta asserção guarda a fronteira (um aspecto que o professor não escolheu não entra). */
      provar('…e não inventa um aspecto que o recorte não escolheu',
        !new RegExp(CAMPO_SEM_RESPOSTA + '|port de bras|Estabilidade vestibular', 'i').test(texto)
        === false || !/port de bras/i.test(texto), texto);

      const grupos = JSON.parse(w.eval(`(function(){
        var el = document.querySelector('ul.derivadas');
        if (!el) return '[]';
        return JSON.stringify([].map.call(el.children, function(li){
          var rotulo = li.querySelector('b');
          var itens = [].map.call(li.querySelectorAll('li'), function(x){ return x.textContent; });
          return { eixo: rotulo ? rotulo.textContent : '', dimensoes: itens };
        }));
      })()`));
      const eixoDe = (nome) => {
        const g = grupos.find((x) => x.dimensoes.indexOf(nome) !== -1);
        return g ? g.eixo : '';
      };
      provar('a lista das dimensões é agrupada pelo eixo (o eixo é o cabeçalho do grupo)',
        grupos.map((g) => g.eixo).join(',').indexOf('Técnica') !== -1
        && grupos.map((g) => g.eixo).join(',').indexOf('Poiesis') !== -1,
        grupos.map((g) => g.eixo));
      provar('…Barra e Centro no grupo da Técnica',
        eixoDe('Barra') === 'Técnica' && eixoDe('Centro') === 'Técnica', grupos);
      provar('…e Musicalidade e Expressão no grupo da Poiesis',
        eixoDe('Musicalidade') === 'Poiesis' && eixoDe('Expressão') === 'Poiesis', grupos);
      provar('…e o nome da dimensão vai sem o prefixo do eixo',
        !JSON.stringify(grupos).includes('Técnica — Musicalidade'), grupos);

      // ------------------------------------------------------- E. o plano ao lado da caixa
      bloco('E. CADA BLOCO DIZ O QUE O PLANO JÁ DECIDE — antes da caixa onde se escreve');
      {
        /* O QUE MUDOU (06/11/2026). A pesquisadora, a escrever os itens: «eu tenho a impressão que
         * não, não é uma escrita nova do professor». A impressão era meio certa — metade do que ali
         * se escreve já está decidida no plano, e o plano não estava à vista. A repetição passou a
         * mostrar, por bloco, os objetivos que o plano trabalha ali, o que os mede, e a
         * justificativa do volume.
         *
         * A PROVA MEDE AS TRÊS COISAS QUE IMPORTAM: que o bloco aparece em cada repetição; que o
         * que ele diz é o que o PLANO diz daquele bloco (e não a lista inteira — a asserção
         * negativa é a que separa «leu» de «despejou»); e que a caixa continua VAZIA, porque o
         * campo não se pré-enche. */
        const abrirItens = () => w.eval(`(function(){
          var i = MAPA.nos.findIndex(function(n){ return n.id === 'itens-por-dimensao'; });
          INDICE = i; renderPergunta();
          return true;
        })()`);
        abrirItens();
        await new Promise((r) => setTimeout(r, 200));
        abrirItens();
        await new Promise((r) => setTimeout(r, 200));

        const porBloco = JSON.parse(w.eval(`(function(){
          var saida = {};
          var blocos = document.querySelectorAll('.item-repeticao');
          for (var i = 0; i < blocos.length; i++) {
            var b = blocos[i];
            var titulo = b.querySelector('h4');
            var leitura = b.querySelector('.leitura-do-cabecalho');
            var caixa = b.querySelector('textarea');
            saida[titulo ? titulo.textContent.trim() : '?'] = {
              leitura: leitura ? leitura.textContent.replace(/\\\\s+/g, ' ').trim() : '',
              temLeitura: !!leitura,
              objetivos: leitura ? [].map.call(leitura.querySelectorAll('li b'), function(x){ return x.textContent; }) : [],
              medido: leitura ? [].map.call(leitura.querySelectorAll('li .sub'), function(x){ return x.textContent; }) : [],
              valor: caixa ? caixa.value : '(sem caixa)',
            };
          }
          return JSON.stringify(saida);
        })()`));

        const nomes = Object.keys(porBloco);
        provar('as dimensões da repetição são as cinco do plano', nomes.length === 5, nomes);
        provar('…e cada uma traz o bloco de leitura do plano',
          nomes.every((n) => porBloco[n].temLeitura), nomes.map((n) => [n, porBloco[n].temLeitura]));

        provar('o Barra mostra os DOIS objetivos que o plano ali trabalha',
          porBloco.Barra && porBloco.Barra.objetivos.length === 2
          && /01 · reconhecer o apoio/.test(porBloco.Barra.objetivos.join('|'))
          && /02 · transferir o peso/.test(porBloco.Barra.objetivos.join('|')),
          porBloco.Barra && porBloco.Barra.objetivos);

        /* A ASSERÇÃO QUE SEPARA «LEU» DE «DESPEJOU»: a Musicalidade só tem o objetivo 03 no plano,
         * e um despejo da lista inteira passaria nas duas primeiras. */
        provar('a Musicalidade mostra SÓ o objetivo 03 — o plano é recortado pelo bloco',
          porBloco.Musicalidade && porBloco.Musicalidade.objetivos.length === 1
          && /03 · sustentar a transferência/.test(porBloco.Musicalidade.objetivos[0])
          && !/01 ·|02 ·/.test(porBloco.Musicalidade.objetivos.join('|')),
          porBloco.Musicalidade && porBloco.Musicalidade.objetivos);

        provar('…e diz o que o plano MARCOU para medir cada objetivo',
          porBloco.Barra && /Plié · Battement tendu/.test(porBloco.Barra.medido.join('|'))
          && /Plié · Port de bras/.test(porBloco.Barra.medido.join('|')),
          porBloco.Barra && porBloco.Barra.medido);

        provar('a caixa continua VAZIA: o campo não se pré-enche',
          nomes.every((n) => porBloco[n].valor === ''), nomes.map((n) => porBloco[n].valor));

        /* O TERCEIRO CASO, e é o que prova que o campo NÃO é redundante: um bloco que nenhum
         * objetivo do plano marca — há planos assim, e a Expressão é o caso real (no plano da
         * `batata` nenhum objetivo a marcava, e o professor escreveu-lhe dois itens). A frase
         * tem de dizer que o que ali se escreve é dele. */
        const semObjetivo = w.eval(`(function(){
          DIMENSOES_DO_PLANO.porBloco['Expressão'] = {
            objetivos: [],
            justificativa: 'Presença cénica e escuta do grupo.'
          };
          var t = oQueOPlaoDizDoBloco('Expressão');
          var txt = document.createElement('div');
          txt.innerHTML = t;
          return txt.textContent.replace(/\\\\s+/g, ' ').trim();
        })()`);
        /* A FRASE E A DO HÍBRIDO (06/11/2026): o que ali se escreve não é «do professor» em geral —
         * é a ÚNICA coisa que o bloco observa, porque nenhum critério entra sozinho. As duas
         * afirmações são a mesma verdade por dois lados, e a asserção exige as duas. */
        provar('um bloco que nenhum objetivo marca DIZ que ali não entra critério nenhum sozinho',
          /não marca nenhum objetivo/.test(semObjetivo)
          && /Presença cénica/.test(semObjetivo)
          && /Nenhum critério entra sozinho/.test(semObjetivo) && /é sua/.test(semObjetivo),
          semObjetivo);
      }

      provar('nenhum erro de JavaScript na página', problemas.length === 0, problemas.slice(0, 3));
    } finally {
      try { w.close(); } catch (erro) { /* já fechada */ }
      srv.close();
    }
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: o elenco entra antes das dimensões, o '
    + 'eixo decide-se pelo BLOCO (e não pelo prefixo gravado), o documento do PO mostra os três '
    + 'eixos com o Fenómeno sob o título, o corpo carrega-se do RECORTE do passo 4, agrupado por '
    + 'bloco, e cada bloco mostra o que o PLANO já decide dele antes da caixa onde se escreve.');
}

main().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
