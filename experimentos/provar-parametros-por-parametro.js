#!/usr/bin/env node
'use strict';

/**
 * provar-parametros-por-parametro.js — a matriz do parâmetro manda, e o dado não mudou.
 *
 * O DEFEITO QUE ISTO TRAVA (26/10/2026, decidido pela pesquisadora depois de ver o modelo).
 * A matriz do parâmetro de medição tinha uma linha por OBJETIVO e escrevia o nome de cada
 * parâmetro em todas as linhas. Com os 3 parâmetros do teste lê-se; o professor pode querer 20,
 * e aí são 60 caixas e 60 nomes, e a pessoa desce e cruza duas direções para saber se o
 * parâmetro 14 está marcado no objetivo 3.
 *
 * A GEOMETRIA FOI MEDIDA À PARTE, no modelo, com navegador de verdade (1280/768/390 px): a
 * matriz de hoje mede 2631 px de altura a 390 px de largura e desaba para uma coluna; a do
 * parâmetro mede 1293 px. O que esta prova mede é o CONTRATO e a ESTRUTURA — que é onde o
 * defeito pode voltar em silêncio:
 *
 *   1. a disposição `parametros` desenha uma tabela: UMA linha por parâmetro, UMA coluna por
 *      objetivo, o nome escrito uma vez só, e um «todos» por linha;
 *   2. O DADO É O MESMO. As caixas continuam a ser `data-marco`, e o `lerPorMarco` de antes lê
 *      esta tabela sem uma linha de alteração — `{marco, marcados}` sai igual. É esta asserção
 *      que impede a mudança de desenho de virar mudança de contrato;
 *   3. o botão «todos» marca a linha inteira, diz «nenhum» para desfazer, grava a resposta, e
 *      clicar outra vez devolve o que estava;
 *   4. o campo aberto não se perdeu: continua a haver um por objetivo, num resumo fechado;
 *   5. sem conteúdo no nível da turma, a tela NÃO devolve o aviso da outra disposição: desenha o
 *      campo aberto de cada objetivo — que é o único caminho que resta;
 *   6. o contentor declara `overflow-x: auto` na folha da página: com 26 objetivos são 27
 *      colunas, e uma tabela que não rola dentro de si empurra a página.
 *
 * COMO É MEDIDA. JSDOM — o mesmo harness de `provar-teste.js`, que abre esta página com o
 * conteúdo de verdade. Sem navegador, porque o que se prova aqui é a marcação e a leitura.
 *
 *   node experimentos/provar-parametros-por-parametro.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const { mapa } = require(path.join(RAIZ, 'motor/nucleo/porta.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* Os 20 parâmetros e os 26 objetivos: o caso que motivou a mudança. */
const PARAMETROS = Array.from({ length: 20 }, (_, i) => 'Parâmetro ' + String(i + 1).padStart(2, '0'));
const OBJETIVOS = Array.from({ length: 26 }, (_, i) =>
  'Objetivo ' + String(i + 1).padStart(2, '0') + ' — o que fica pronto nesta aula');

const CONTEUDO = JSON.parse(fs.readFileSync(path.join(PORTA, 'plano/conteudo/plano.json'), 'utf8'));
const MAPA = Object.assign({ ok: true }, mapa(CONTEUDO));

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

/* A rota é a de sempre para esta página (`/plano-ensino/`): o `FONTE` do formulário deriva do
 * caminho (`location.pathname.indexOf('/plano-ensino/') === 0`), e servir noutro sítio faz a
 * página achar que é a anamnese e voltar para a lista. O prefixo sai do caminho ANTES de
 * qualquer comparação — o pedido do mapa é relativo (`api/mapa`). */
function servir() {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://local');
    const rel = u.pathname.replace(/^\/+/, '').replace(/^plano-ensino\//, '');
    const envia = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    const json = (o) => envia(MIME['.json'], JSON.stringify(o));

    if (rel === 'api/mapa') return json(MAPA);
    /* O CORPO DESTES ENDPOINTS É PLANO. `buscarJSON` devolve o corpo inteiro em `dados`, e os
     * chamadores leem `dados.turmas` / `dados.termos` / `dados.relacoes` — um envelope
     * `{dados: {…}}` a mais faz a lista chegar vazia e a tela cair no caminho de «não há
     * conteúdo», em silêncio. Foi assim que a primeira redação desta prova não desenhou nada. */
    if (rel === 'api/bastidores/professores') {
      return json({ ok: true, professores: [{ nome: 'Prova', slug: 'prova' }],
        opcoes: [{ valor: 'prova', rotulo: 'Prova' }] });
    }
    if (rel === 'api/bastidores/turmas') {
      return json({ ok: true, opcoes: [], turmas: [{ id: 't1', nome: 'Turma da prova',
        frequencia: 2, dias: ['ter', 'qui'], duracaoMin: 60, periodoInicio: '2027-02-02',
        periodoFim: '2027-04-29', totalAulas: 26 }] });
    }
    if (rel === 'api/bastidores/termos') {
      return json({ ok: true, termos: PARAMETROS.map((t, i) => ({ id: 'p' + i, termo: t })) });
    }
    if (rel === 'api/bastidores/turma-conteudos') {
      return json({ ok: true, relacoes: { t1: PARAMETROS.map((_, i) => 'p' + i) } });
    }
    if (rel.startsWith('api/bastidores/curadoria-professor')) {
      return json({ ok: true, curadorias: [{ id: 'c1', professor: 'prova',
        modalidade: 'Balé clássico', turmas: ['Turma da prova'], alunas: [] }] });
    }
    if (rel.startsWith('api/')) return json({ ok: true, opcoes: [] });

    if (rel === 'assets/style.css') return envia(MIME['.css'], fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')));
    if (rel === 'assets/nav.js') return envia(MIME['.js'], fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
    const alvo = rel ? path.join(PORTA, rel) : path.join(PORTA, 'index.html');
    if (alvo.startsWith(PORTA) && fs.existsSync(alvo) && fs.statSync(alvo).isFile()) {
      return envia(MIME[path.extname(alvo)] || 'application/octet-stream', fs.readFileSync(alvo));
    }
    return envia(MIME['.html'], fs.readFileSync(path.join(PORTA, 'index.html')));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

(async () => {
  const { srv, base } = await servir();
  const caminho = 'plano-ensino/?professor=prova&escola=prova&ciclo=01';
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
      /* A TURMA TEM DE ESTAR ESCOLHIDA ANTES DA TRAVA. `podePreencher` recusa o formulário sem
       * `contexto-turma` e devolve a pessoa à lista — e é DEPOIS dessa trava que a página regista
       * os ouvintes de clique. Sem esta semente, a prova mediria uma página que já foi
       * abandonada, e um clique não faria nada por uma razão que não é a que se quer medir.
       *
       * A semente entra por `w.eval` porque `RESPOSTAS` é um `let` de topo: existe no ambiente
       * lexical global, mas não como propriedade de `window`. O intervalo corre entre os
       * `await` do arranque, que é exactamente a janela que interessa. */
      const semear = w.setInterval(() => {
        try {
          w.eval("if (typeof RESPOSTAS !== 'undefined' && typeof MAPA !== 'undefined'"
            + " && !RESPOSTAS.get('contexto-turma')) RESPOSTAS.set('contexto-turma', 'Turma da prova');");
        } catch (e) { /* a página ainda não tem estas variáveis */ }
      }, 4);
      w.addEventListener('load', () => w.setTimeout(() => w.clearInterval(semear), 2000));
      // Uma rejeição sem `catch` (o `iniciar()` é chamado sem `await`) não chega ao
      // `jsdomError`: sem estas duas linhas, um arranque partido a meio parece um arranque são.
      w.addEventListener('unhandledrejection', (e) => {
        problemas.push('REJEIÇÃO: ' + ((e.reason && e.reason.message) || e.reason));
      });
      w.addEventListener('error', (e) => problemas.push('ERRO: ' + e.message));
    },
  });
  const w = dom.window;
  await new Promise((r) => setTimeout(r, 900));

  /* O nó entra com a turma e os 26 objetivos, como entrariam pelo formulário. `comNivel=false`
   * esvazia o conteúdo da turma ANTES de desenhar e devolve a marcação que saiu. */
  const preparar = (comNivel) => w.eval(`(async function(comNivel){
    RESPOSTAS.set('contexto-turma', 'Turma da prova');
    RESPOSTAS.set('marcos-por-aula', ${JSON.stringify(OBJETIVOS)});
    RESPOSTAS.set('aula-1-parametro', ${JSON.stringify(OBJETIVOS)}.map(function(_, j){
      return { marco: j + 1, marcados: ${JSON.stringify(PARAMETROS)}.filter(function(_, i){
        return (i % 2 === 0) || j === 0; }) }; }));
    // O CONTEÚDO DO NÍVEL vem da Produção, e é uma leitura à parte: sem esta espera a matriz
    // sairia vazia e o desenho nunca seria exercido.
    await carregarTurmasDaEscola();
    var guardado = TURMA_CONTEUDOS;
    if (!comNivel) TURMA_CONTEUDOS = { t1: [] };
    INDICE = MAPA.nos.findIndex(function(n){ return n.id === 'aula-1-parametro'; });
    renderPergunta();
    var html = document.getElementById('pergunta').innerHTML;
    TURMA_CONTEUDOS = guardado;
    return html;
  })(${comNivel ? 'true' : 'false'})`);

  try {
    provar('a página abriu no formulário do plano', w.eval('FONTE') === 'plano', w.eval('FONTE'));
    provar('…e o mapa do plano carregou', w.eval('typeof MAPA !== "undefined" && MAPA && MAPA.nos.length > 0'));

    // ---------------------------------------------------------------- 1) o desenho
    console.log('\n1. o parâmetro manda: uma linha por parâmetro, uma coluna por objetivo');
    await preparar(true);
    const aposTodos = w.eval(`(function(){
      var botao = document.querySelector('#pergunta [data-todos-parametro="1"]');
      var celulas = function(){ return document.querySelectorAll(
        '#pergunta tbody tr:nth-child(2) input[data-marco]:checked').length; };
      var antes = celulas();
      botao.click();
      var depois = celulas();
      var dito = botao.textContent.trim();
      var gravado = lerResposta(MAPA.nos[INDICE]).valor.filter(function(l){
        return l.marcados.indexOf('Parâmetro 02') !== -1; }).length;
      botao.click();
      var devolta = celulas();
      return { antes: antes, depois: depois, dito: dito, gravado: gravado, devolta: devolta,
        ditoFinal: botao.textContent.trim() };
    })()`);
    provar('antes do clique a linha 2 tinha 1 marcação (só o objetivo 1)',
      aposTodos.antes === 1, aposTodos.antes);
    provar('…e o clique marca os 26 objetivos daquela linha', aposTodos.depois === 26, aposTodos.depois);
    provar('…e o botão passa a dizer «nenhum» (o próximo clique desfaz)', aposTodos.dito === 'nenhum', aposTodos.dito);
    provar('…e a resposta gravada diz que o parâmetro 02 serve aos 26', aposTodos.gravado === 26, aposTodos.gravado);
    /* O BOTÃO É UM INTERRUPTOR DA LINHA INTEIRA, e não um «desfazer»: o primeiro clique marca os
     * 26, o segundo desmarca os 26 — não volta ao «só o objetivo 1» de antes, porque esse estado
     * não é do botão, é do que estava marcado. A asserção diz o que ele faz, não o que eu supus. */
    provar('…e o segundo clique desmarca a linha inteira (0, e volta a dizer «todos»)',
      aposTodos.devolta === 0 && aposTodos.ditoFinal === 'todos',
      [aposTodos.devolta, aposTodos.ditoFinal]);

    // ---------------------------------------------------------------- 4) o campo aberto
    console.log('\n4. o campo aberto por objetivo não se perdeu');
    const abertos = w.eval(`(function(){
      var campos = document.querySelectorAll('#pergunta [data-marco-aberto]');
      return { quantos: campos.length, noResumo: campos.length ? !!campos[0].closest('details') : false };
    })()`);
    provar('há um campo aberto por objetivo: 26', abertos.quantos === 26, abertos.quantos);
    provar('…e ele vive num resumo fechado, fora do caminho de quem não precisa', abertos.noResumo);

    // ---------------------------------------------------------------- 5) sem conteúdo no nível
    console.log('\n5. sem conteúdo no nível, a tela desenha o campo aberto — e não um aviso');
    const semNivel = await preparar(false);
    provar('não há tabela (não há parâmetro para desenhar)',
      semNivel.indexOf('tabela-parametros') === -1);
    provar('…o aviso diz que a turma não tem conteúdo, e manda escrever abaixo',
      semNivel.indexOf('ainda não tem conteúdo declarado') !== -1
      && semNivel.indexOf('Escreva a medida de cada objetivo') !== -1);
    provar('…e os 26 campos abertos estão lá — o que a versão anterior prometia e não desenhava',
      (semNivel.match(/data-marco-aberto/g) || []).length === 26,
      (semNivel.match(/data-marco-aberto/g) || []).length);

    // ---------------------------------------------------------------- 6) a largura
    console.log('\n6. a matriz rola dentro de si: 27 colunas não podem empurrar a página');
    const folha = w.eval(`(function(){
      var estilos = Array.prototype.slice.call(document.querySelectorAll('style'))
        .map(function(s){ return s.textContent; }).join('\\n');
      return { declara: /\\.matriz-parametros\\s*\\{[^}]*overflow-x:\\s*auto/.test(estilos) };
    })()`);
    provar('a folha da página declara `overflow-x: auto` para `.matriz-parametros`', folha.declara);

    provar('nenhum erro de JavaScript na página', problemas.length === 0, problemas.slice(0, 3));
  } finally {
    w.close();
    srv.close();
  }

  console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ') + total + ' asserção(ões), ' + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
