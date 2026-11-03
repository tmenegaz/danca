#!/usr/bin/env node
'use strict';

/**
 * provar-plano-e-curadoria.js — o que a direção curou chega ao plano, ou fica pelo caminho?
 *
 * O DEFEITO, medido a 03/11/2026 depois de a pesquisadora fazer a curadoria e perguntar «verifique
 * o processo daqui até à geração dos documentos». O caminho é: a direção cura (turma, modalidade,
 * tradição, nível, **repertório**) → o professor abre o plano → o plano **lê a turma** (frequência,
 * duração, calendário, total de aulas) e **lê o conteúdo da turma** (a coluna «Conteúdo do nível»)
 * → o plano vira fonte `.md` → o gerador compõe o pacote.
 *
 * O SEGUNDO ELO ESTAVA PARTIDO, e em silêncio. `porta/index.html` passou a ter **duas** funções com
 * o mesmo nome — `turmaDoPlano` —, uma que devolve a TURMA (linha 1600) e outra que devolve uma
 * LISTA DE NOMES (linha 5888, escrita para «carregar das anamneses da turma», 02/11/2026). Duas
 * declarações de função no mesmo escopo: a segunda ganha para **todos** os chamadores, por hoisting.
 * Quem esperava a turma passou a receber um array — e um array não dá erro:
 *
 *   · `t.periodoInicio` → `undefined` (o calendário do plano não descia da turma);
 *   · `t.frequencia`    → `NaN` → `vezes = 0` → `valorDaTurma` devolvia `undefined` (a frequência,
 *                          a duração e o calendário ficavam por preencher, sem uma palavra);
 *   · `termosDaTurma(t.id)` → `termosDaTurma(undefined)` → `[]` → **a coluna «Conteúdo do nível»
 *                          nunca mostrava o que a curadoria declara**.
 *
 * É a mesma família de falha que o repositório já nomeou duas vezes («um `undefined` numa
 * comparação não dá erro: dá `false`»): o dado falta, a tela não diz porquê, e quem olha conclui
 * que o sistema «não pega» o que ele acabou de decidir.
 *
 * COMO É MEDIDA. JSDOM sobre a porta de verdade, com o mapa de verdade, o vocabulário de verdade e
 * uma turma de prova que tem o RITMO e o REPERTÓRIO que a curadoria declara. A §D corre o CONTROLE
 * NEGATIVO (a mesma página sem o mapa composto): a coluna tem de ficar vazia, senão a §C estaria a
 * passar por acidente.
 *
 *   node experimentos/provar-plano-e-curadoria.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const { mapa } = require(path.join(RAIZ, 'motor/nucleo/porta.js'));

const CONTEUDO = JSON.parse(fs.readFileSync(path.join(PORTA, 'plano/conteudo/plano.json'), 'utf8'));
const MAPA = Object.assign({ ok: true }, mapa(CONTEUDO));
const VOCABULARIO = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'biblioteca/modalidades/bale-classico/vocabulario.json'), 'utf8'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* A TURMA DA PROVA tem o que a curadoria da pesquisadora declara (03/11/2026): o ritmo — quarta e
 * sexta, 45 minutos, de março a junho — e o repertório — Plié e Battement tendu. Os valores são os
 * dela; a turma é de ensaio. */
const TURMA = {
  id: 'bale-nivel-1-teste-3',
  nome: 'Balé Nível 1 — Teste 3',
  frequencia: 2,
  dias: ['qua', 'sex'],
  horarios: { qua: '16:30', sex: '16:30' },
  duracaoMin: 45,
  periodoInicio: '2027-03-03',
  periodoFim: '2027-06-30',
};
const REPERTORIO = ['plie', 'battement-tendu'];
const NOME_DA_TURMA = TURMA.nome;

const TERMOS = VOCABULARIO.map((t) => ({
  id: t.id, termo: t.termo, categoria: t.categoria, descricao: t.descricao || '', fonte: t.fonte || '',
}));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
};

/** `semMapaComposto` é o CONTROLE NEGATIVO da §D: a rota responde, mas sem o repertório. */
function servir(semMapaComposto) {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://local');
    const rel = u.pathname.replace(/^\/+/, '').replace(/^plano-ensino\//, '');
    const envia = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    const json = (o) => envia(MIME['.json'], JSON.stringify(o));

    if (rel === 'api/mapa') return json(MAPA);
    if (rel === 'api/bastidores/professores') {
      return json({ ok: true, professores: [{ nome: 'Prova', slug: 'prova' }],
        opcoes: [{ valor: 'prova', rotulo: 'Prova' }] });
    }
    if (rel === 'api/bastidores/turmas') {
      return json({ ok: true, turmas: [TURMA], opcoes: [{ valor: TURMA.nome, rotulo: TURMA.nome }] });
    }
    if (rel === 'api/bastidores/termos') {
      return json({ ok: true, termos: TERMOS, opcoes: TERMOS.map((t) => ({ valor: t.id, rotulo: t.termo })) });
    }
    if (rel === 'api/bastidores/turma-conteudos') {
      return json({ ok: true, relacoes: semMapaComposto ? {} : { [TURMA.id]: REPERTORIO } });
    }
    if (rel.startsWith('api/bastidores/curadoria-professor')) {
      return json({ ok: true, curadorias: [{
        id: 'c1', professor: 'prova', modalidade: 'Balé clássico', tradicao: 'RAD',
        nivel: '1', nivelReferencia: 'Grade 1',
        turmas: [TURMA.nome], repertorio: ['Plié', 'Battement tendu'], alunas: ['Aluna A'],
      }] });
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
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () =>
    pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

async function abrir(semMapaComposto) {
  const { srv, base } = await servir(semMapaComposto);
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
      // A turma é semeada como o cabeçalho a semeia (`daCuradoria: turmas` → o NOME dela).
      const semear = w.setInterval(() => {
        try {
          w.eval("if (typeof RESPOSTAS !== 'undefined' && typeof MAPA !== 'undefined'"
            + " && !RESPOSTAS.get('contexto-turma')) RESPOSTAS.set('contexto-turma', " +
            JSON.stringify(NOME_DA_TURMA) + ");");
        } catch (e) { /* a página ainda não tem estas variáveis */ }
      }, 4);
      w.addEventListener('load', () => w.setTimeout(() => w.clearInterval(semear), 2500));
      w.addEventListener('unhandledrejection', (e) => {
        problemas.push('REJEIÇÃO: ' + ((e.reason && e.reason.message) || e.reason));
      });
      w.addEventListener('error', (e) => problemas.push('ERRO: ' + e.message));
    },
  });
  const w = dom.window;
  await new Promise((r) => setTimeout(r, 1200));
  return { w, srv, problemas };
}

/* A LEITURA, feita DENTRO da página e com as funções dela — não com uma cópia da regra. Se a
 * função mudar de nome, a prova falha em vez de passar a medir outra coisa. */
const MEDIR = `(function(){
  var t = (typeof turmaDoPlano === 'function') ? turmaDoPlano() : 'AUSENTE';
  var no = MAPA.nos.filter(function(n){ return n.id === 'aula-1-sequencia'; })[0];
  INDICE = MAPA.nos.indexOf(no);
  var coluna = (no.tabela.selecoes || {})['Conteúdo do nível'] || {};
  var opcoes = [];
  try { opcoes = opcoesDaColuna(coluna, 'Conteúdo do nível') || []; } catch (e) { opcoes = ['ERRO: ' + e.message]; }
  var valores = {};
  ['frequencia', 'duracao', 'calendario', 'totalAulas'].forEach(function(qual){
    try { valores[qual] = valorDaTurma({ daTurma: qual }) || null; } catch (e) { valores[qual] = 'ERRO'; }
  });
  var periodo = {};
  try { periodo = periodoEFrequencia() || {}; } catch (e) { periodo = { erro: e.message }; }
  return {
    tipo: Array.isArray(t) ? 'lista' : (t === null ? 'nulo' : typeof t),
    id: t && !Array.isArray(t) ? t.id : null,
    nome: t && !Array.isArray(t) ? t.nome : null,
    opcoes: opcoes,
    valores: valores,
    periodo: periodo
  };
})()`;

/* OS NOMES REPETIDOS EM CADA BLOCO DE CLIENTE. Lê os dois ficheiros e devolve, por bloco, as
 * funções declaradas mais de uma vez. Não é análise de JS: é a conta que teria apanhado o defeito da
 * §A no dia em que ele entrou — e é por isso que ela fica aqui, e não só o caso concreto. */
function funcoesRepetidas(texto) {
  const nomes = new Map();
  const re = /^\s*(?:\+\s*)?['"]?\s*function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  let m;
  while ((m = re.exec(texto))) {
    nomes.set(m[1], (nomes.get(m[1]) || 0) + 1);
  }
  return [...nomes.entries()].filter(([, n]) => n > 1).map(([nome, n]) => nome + ' ×' + n);
}

function nomesRepetidos() {
  const porta = fs.readFileSync(path.join(PORTA, 'index.html'), 'utf8').split('\n');
  // O script da porta é UM bloco: de `<script>` (sem src) até `</script>`.
  const inicio = porta.findIndex((l) => /^<script>/.test(l.trim()));
  const fim = porta.findIndex((l, i) => i > inicio && /<\/script>/.test(l));
  const corpoDaPorta = porta.slice(inicio, fim).join('\n');

  // A Produção: um `<script>` concatenado, com vários `(function(){ … })()` dentro. A conta é feita
  // por IIFE, porque dois blocos diferentes PODEM ter funções com o mesmo nome — o que não podem é
  // duas declarações dentro do MESMO escopo.
  const bast = fs.readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8').split('\n');
  const abre = bast.findIndex((l) => /^\s*'<script>'\s*\+/.test(l));
  const fecha = bast.findIndex((l, i) => i > abre && /<\/script>/.test(l));
  const corpo = bast.slice(abre, fecha);
  const fronteiras = [];
  corpo.forEach((l, i) => { if (/^\s*'\(function\(\)\{'\s*\+/.test(l)) fronteiras.push(i); });
  fronteiras.push(corpo.length);
  const repetidas = [];
  for (let k = 0; k < fronteiras.length - 1; k++) {
    const bloco = corpo.slice(fronteiras[k], fronteiras[k + 1]).join('\n');
    for (const r of funcoesRepetidas(bloco)) repetidas.push(r + ' (bloco ' + (k + 1) + ')');
  }
  return { porta: funcoesRepetidas(corpoDaPorta), bastidores: repetidas };
}

async function main() {
  // ---- §A a §C: a página com o mapa composto ----------------------------------------
  const a = await abrir(false);
  const m = await a.w.eval(MEDIR);
  a.w.close();
  a.srv.close();

  console.log('\nA. A TURMA DO PLANO — uma turma, não uma lista de nomes');
  provar('turmaDoPlano devolve a TURMA (o objeto), e não um array', m.tipo === 'object', m.tipo);
  provar('…a turma é a que a curadoria atribuiu', m.id === TURMA.id && m.nome === TURMA.nome,
    { id: m.id, nome: m.nome });

  console.log('\nB. O RITMO DESCE DA TURMA PARA O PLANO (os quatro nós `daTurma`)');
  provar('a frequência sai dos dias: 2 por semana, qua e sex',
    m.valores.frequencia && m.valores.frequencia.vezes === 2
    && String((m.valores.frequencia.dias || []).join(',')) === 'qua,sex', m.valores.frequencia);
  provar('a duração é a da turma: 45 minutos',
    JSON.stringify(m.valores.duracao).indexOf('"numero":45') !== -1
    && /minuto/.test(JSON.stringify(m.valores.duracao)), m.valores.duracao);
  provar('o calendário é o da turma: 2027-03-03 → 2027-06-30',
    m.valores.calendario
    && JSON.stringify(m.valores.calendario).indexOf('2027-03-03') !== -1
    && JSON.stringify(m.valores.calendario).indexOf('2027-06-30') !== -1, m.valores.calendario);
  provar('o período e a frequência do plano vêm da turma',
    m.periodo.inicio === TURMA.periodoInicio && m.periodo.fim === TURMA.periodoFim
    && m.periodo.frequencia === 2, m.periodo);
  provar('e o total de aulas é a conta do período com a frequência',
    m.valores.totalAulas === null || Number(m.valores.totalAulas) >= 18, m.valores.totalAulas);

  console.log('\nC. O CONTEÚDO DA CURADORIA CHEGA À COLUNA «Conteúdo do nível»');
  provar('a coluna oferece Plié e Battement tendu',
    m.opcoes.length === 2 && /Pli/i.test(m.opcoes[0] || '') && /tendu/i.test(m.opcoes[1] || ''), m.opcoes);

  // ---- §D: o controle negativo -------------------------------------------------------
  const b = await abrir(true);
  const n = await b.w.eval(MEDIR);
  b.w.close();
  b.srv.close();

  console.log('\nD. O CONTROLE NEGATIVO — sem o mapa composto a coluna fica VAZIA');
  provar('sem `turma-conteudos`, a coluna não inventa conteúdo', n.opcoes.length === 0, n.opcoes);
  provar('…e o ritmo continua a descer (é da turma, não do mapa)', n.tipo === 'object', n.tipo);

  // ---- §E: a família do defeito, não só a instância --------------------------------
  //
  // O defeito da §A não foi um erro de álgebra: foi um NOME usado duas vezes. A defesa que resta é
  // medir a classe — em cada bloco de cliente, nenhuma função pode ser declarada duas vezes, porque
  // a segunda ganha para todos os chamadores e o sintoma aparece a três andares de distância.
  console.log('\nE. A CLASSE DO DEFEITO — nenhum bloco declara a mesma função duas vezes');
  const repetidas = nomesRepetidos();
  provar('a porta do professor não tem funções homónimas', repetidas.porta.length === 0, repetidas.porta);
  provar('a Produção também não', repetidas.bastidores.length === 0, repetidas.bastidores);

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — a curadoria chega ao plano: o ritmo desce da turma, e o repertório aparece na coluna.'
    : 'FALHOU — ' + falhas + ' de ' + total + ' asserções.'));
  process.exit(falhas ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
