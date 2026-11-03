#!/usr/bin/env node
'use strict';

/**
 * provar-sequencia-que-acompanha.js — a linha da sequência que perdeu o sujeito sai, e a que ainda
 * tem sujeito fica (03/11/2026).
 *
 * O QUE A PESQUISADORA RELATOU. «Na tabela de Sequência de Exercícios por Bloco o sistema continua
 * exibindo referências a itens que foram eliminados (ex.: rótulos como "Barra com objetivo
 * específico 2" e "Centro com objetivo específico 3")»; e fez a pergunta certa — «a sequência é
 * dinâmica ou está presa a dados de mock/teste estáticos?»
 *
 * A RESPOSTA É: é dinâmica, e não há mock nenhum. Medido no envelope verdadeiro dela
 * (`plano-20261103-1644`, que é a fixture desta prova, reduzida ao que importa): a lista dos
 * objetivos tinha UM item e a sequência guardava OITO linhas — duas a nomear os objetivos 2 e 3.
 * O bloco estava certo (a barra sumiu quando ela desmarcou o solo); o que ficou preso foi o outro
 * lado do par.
 *
 * AS TRÊS COISAS QUE ESTA PROVA GUARDA, e são uma regra só:
 *
 *   1. a linha de um objetivo que NÃO EXISTE sai da derivação, da tabela e do documento — ela não
 *      é memória do que a pessoa decidiu (a coluna é só de leitura; quem a escreve é o sistema),
 *      e publicá-la punha no documento um exercício cujo objetivo o mesmo documento não lista;
 *   2. o que reconhece uma linha é o NÚMERO do objetivo, e não o texto — pelo texto, corrigir a
 *      redacção de um objetivo duplicava a linha, com o texto velho e o conteúdo outra vez por
 *      escolher (o «campo aberto/vazio» que ela viu);
 *   3. o que NÃO é órfão não se toca: a linha acrescentada à mão, a prosa de um plano antigo, e o
 *      plano cujos objetivos ainda estão vazios (sem lista contra a qual medir, não há órfão).
 *
 * E A QUARTA, que é da tela e não da regra: o ✕ só remove a linha que a pessoa acrescentou. Nas
 * derivadas ele nasce apagado — e ficava aceso no instante em que ela digitava a senha, porque a
 * trava da senha reescrevia `disabled` em todos os controles do formulário.
 *
 *   node experimentos/provar-sequencia-que-acompanha.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const { mapa } = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { derivarPlano } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));
const sequenciaDoPlano = require(path.join(RAIZ, 'motor/nucleo/sequencia.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const CONTEUDO = JSON.parse(fs.readFileSync(path.join(PORTA, 'plano/conteudo/plano.json'), 'utf8'));
const MAPA = Object.assign({ ok: true }, mapa(CONTEUDO));
const VOCABULARIO = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'biblioteca/modalidades/bale-classico/vocabulario.json'), 'utf8'));
const ALFABETO = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'biblioteca/modalidades/bale-classico/notacao.json'), 'utf8'));

const MUSICAS = {};
for (const nome of Object.keys(ALFABETO.verbetes || {})) {
  if (nome.startsWith('_')) continue;
  const lista = Object.keys(ALFABETO.verbetes[nome] || {}).filter((k) => /^\d+\|/.test(k));
  if (lista.length) MUSICAS[nome] = lista;
}

const TERMOS = VOCABULARIO.map((t) => ({
  id: t.id, termo: t.termo, categoria: t.categoria,
  descricao: t.descricao || '', fonte: t.fonte || '', musicas: MUSICAS[t.termo] || [],
}));
const TURMA = {
  id: 't3', nome: 'Turma da prova', frequencia: 2, dias: ['ter', 'qui'], duracaoMin: 60,
  periodoInicio: '2027-02-02', periodoFim: '2027-04-29', totalAulas: 26,
};

/* A FIXTURE — os números do envelope verdadeiro dela, reduzidos ao que esta prova mede. Um
 * objetivo (depois de ela ter reduzido os três a um), quatro blocos marcados no objetivo 1, dois
 * exercícios medidos nesse objetivo, e OITO linhas guardadas na sequência — as seis primeiras do
 * par (objetivo 1 × bloco × exercício) e as DUAS ÚLTIMAS a nomear os objetivos 2 e 3, que já não
 * existem. É o defeito, com os valores de origem. */
const OBJETIVO_1 = 'reconhecer o apoio e alinhar o eixo vertical';
const ROTULO_1 = '1 — ' + OBJETIVO_1;
const ROTULO_2 = '2 — transferir o peso entre os pés sem perder o alinhamento';
const ROTULO_3 = '3 — sustentar a transferência com musicalidade e controle do movimento';

const SEQUENCIA_GUARDADA = [
  { Bloco: 'Barra', 'Objetivo específico': ROTULO_1, 'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '2/4' },
  { Bloco: 'Barra', 'Objetivo específico': ROTULO_1, 'Conteúdo do nível': 'Plié', Tempos: '4', Compasso: '2/4' },
  { Bloco: 'Centro', 'Objetivo específico': ROTULO_1, 'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '2/4' },
  { Bloco: 'Centro', 'Objetivo específico': ROTULO_1, 'Conteúdo do nível': 'Plié', Tempos: '4', Compasso: '2/4' },
  { Bloco: 'Expressão', 'Objetivo específico': ROTULO_1, 'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '2/4' },
  { Bloco: 'Expressão', 'Objetivo específico': ROTULO_1, 'Conteúdo do nível': 'Plié', Tempos: '4', Compasso: '2/4' },
  { Bloco: 'Barra', 'Objetivo específico': ROTULO_2, 'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '2/4' },
  { Bloco: 'Centro', 'Objetivo específico': ROTULO_3, 'Conteúdo do nível': 'Port de bras', Tempos: '16', Compasso: '3/4' },
];

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

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
      return json({ ok: true, relacoes: { [TURMA.id]: ['battement-tendu', 'plie', 'port-de-bras'] } });
    }
    if (rel.startsWith('api/bastidores/curadoria-professor')) {
      return json({ ok: true, curadorias: [{ id: 'c1', professor: 'prova',
        modalidade: 'Balé clássico', turmas: [TURMA.nome], alunas: [] }] });
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

async function abrir() {
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
      w.addEventListener('unhandledrejection', (e) => {
        problemas.push('REJEIÇÃO: ' + ((e.reason && e.reason.message) || e.reason));
      });
      w.addEventListener('error', (e) => problemas.push('ERRO: ' + e.message));
    },
  });
  const w = dom.window;
  await new Promise((r) => setTimeout(r, 900));
  return { w, srv, problemas };
}

/** Põe o estado da pessoa na página (a turma, os objetivos, as matrizes e a sequência). */
const semear = (objetivos, estrutura, parametro, sequencia) => `(function(){
  RESPOSTAS.set('contexto-turma', ${JSON.stringify(TURMA.nome)});
  RESPOSTAS.set('marcos-por-aula', ${JSON.stringify(objetivos)});
  RESPOSTAS.set('estrutura-de-cada-aula', ${JSON.stringify(estrutura)});
  RESPOSTAS.set('aula-1-parametro', ${JSON.stringify(parametro)});
  RESPOSTAS.set('aula-1-sequencia', ${JSON.stringify(sequencia)});
  pintarRoteiro();
  return true;
})()`;

/** Abre o nó da sequência e devolve as linhas desenhadas, com o tipo de cada célula. */
const abrirASequencia = (w) => w.eval(`(function(){
  var i = MAPA.nos.findIndex(function(n){ return n.id === 'aula-1-sequencia'; });
  INDICE = i;
  renderPergunta();
  var tb = document.getElementById('pergunta').querySelector('tbody');
  if (!tb) return [];
  return Array.prototype.slice.call(tb.querySelectorAll('tr')).map(function(tr){
    return {
      celulas: Array.prototype.slice.call(tr.children).map(function(td){
        return { texto: td.textContent.trim(),
          select: !!td.querySelector('select'),
          travada: td.classList.contains('travada') };
      }),
      xis: (function(){ var b = tr.querySelector('[data-grelha-del]');
        return b ? (b.disabled ? 'apagado' : 'activo') : null; })()
    };
  });
})()`);

const ESTADO = { estrutura: [{ marco: 1, marcados: ['Barra', 'Centro', 'Musicalidade', 'Expressão'] }],
  parametro: [{ marco: 1, marcados: ['Battement tendu', 'Plié'] }] };

const bloco = (titulo) => console.log('\n' + titulo);

(async () => {
  /* --------------------------------------------------------------------------------------- */
  bloco('1. O NÚCLEO — a linha de um objetivo que não existe');
  /* --------------------------------------------------------------------------------------- */
  provar('«3 — sustentar…» tem o número 3',
    sequenciaDoPlano.numeroDoObjetivo(ROTULO_3) === 3);
  provar('e «Barra» não tem número nenhum',
    Number.isNaN(sequenciaDoPlano.numeroDoObjetivo('Barra')));
  provar('a linha do objetivo 2 é órfã quando só existe um objetivo',
    sequenciaDoPlano.linhaOrfa(SEQUENCIA_GUARDADA[6], ['um só']) === true);
  provar('…e não é órfã quando o objetivo 2 existe',
    sequenciaDoPlano.linhaOrfa(SEQUENCIA_GUARDADA[6], ['um', 'dois']) === false);
  provar('a linha sem objetivo (a acrescentada à mão) não é órfã',
    sequenciaDoPlano.linhaOrfa({ Bloco: '', 'Objetivo específico': '' }, ['um só']) === false);
  provar('…e a prosa de um plano antigo também não',
    sequenciaDoPlano.linhaOrfa('Barra — Plié', ['um só']) === false);
  provar('sem objetivos nenhuns não se apaga nada (não há contra o que medir)',
    sequenciaDoPlano.linhasVivas(SEQUENCIA_GUARDADA, []).length === SEQUENCIA_GUARDADA.length);
  provar('com um objetivo, sobram as seis do objetivo 1',
    sequenciaDoPlano.linhasVivas(SEQUENCIA_GUARDADA, [OBJETIVO_1]).length === 6);
  /* CONTROLE NEGATIVO: os MESMOS dados, com os três objetivos de volta. Se nada mudar, a regra
   * não está a olhar para a lista — está a olhar para o conteúdo, ou para nada. */
  provar('CONTROLE: com os três objetivos, as oito linhas ficam',
    sequenciaDoPlano.linhasVivas(SEQUENCIA_GUARDADA, ['um', 'dois', 'três']).length === 8);

  /* --------------------------------------------------------------------------------------- */
  bloco('2. O DOCUMENTO — não se publica exercício de objetivo apagado');
  /* --------------------------------------------------------------------------------------- */
  const envelope = (objetivos, sequencia) => ({
    contexto: { escola: 'breu', professor: 'coqui-de-redinha', ciclo: '01', turma: TURMA.nome },
    respostas: {
      'marcos-por-aula': { valor: objetivos },
      'estrutura-de-cada-aula': { valor: ESTADO.estrutura },
      'aula-1-parametro': { valor: ESTADO.parametro },
      'aula-1-sequencia': { valor: sequencia },
      repertorio: { valor: ['Battement tendu', 'Plié', 'Port de bras'] },
    },
  });
  const musica = (md) => {
    const partes = String(md).split('## Música e vídeo de referência');
    return partes.length > 1 ? partes[1].split(/\n## /)[0] : '';
  };

  const mdVivo = derivarPlano(envelope([OBJETIVO_1], SEQUENCIA_GUARDADA)).markdown;
  const mdTres = derivarPlano(envelope([OBJETIVO_1, 'transferir o peso', 'sustentar'], SEQUENCIA_GUARDADA)).markdown;
  provar('a música do exercício do objetivo 1 continua publicada',
    /Battement tendu — 8 tempos em 2\/4/.test(musica(mdVivo)), musica(mdVivo));
  provar('…e o Port de bras, que só existia na linha do objetivo 3, desapareceu',
    !/Port de bras/.test(musica(mdVivo)), musica(mdVivo));
  /* CONTROLE NEGATIVO: com os três objetivos de volta, o Port de bras reaparece. Sem isto a
   * asserção acima passaria mesmo que a música tivesse deixado de ser publicada por completo. */
  provar('CONTROLE: com os três objetivos, o Port de bras volta',
    /Port de bras — 16 tempos em 3\/4/.test(musica(mdTres)), musica(mdTres));

  /* --------------------------------------------------------------------------------------- */
  bloco('3. A TELA — o caso medido no envelope dela');
  /* --------------------------------------------------------------------------------------- */
  const { w, srv, problemas } = await abrir();
  w.eval(semear([OBJETIVO_1], ESTADO.estrutura, ESTADO.parametro, SEQUENCIA_GUARDADA));
  await new Promise((r) => setTimeout(r, 300));
  const linhas = abrirASequencia(w);

  provar('a tabela desenha SEIS linhas, e não oito', linhas.length === 6, linhas.length);
  provar('nenhuma linha nomeia os objetivos 2 e 3',
    linhas.every((l) => !/^2 —/.test(l.celulas[1].texto) && !/^3 —/.test(l.celulas[1].texto)),
    linhas.map((l) => l.celulas[1].texto));
  provar('o conteúdo do nível vem preenchido e travado nas seis',
    linhas.every((l) => l.celulas[2].travada && !l.celulas[2].select && l.celulas[2].texto),
    linhas.map((l) => l.celulas[2]));

  const gravado = JSON.parse(w.eval(
    "(function(){ gravarRespostaDoNo(MAPA.nos[INDICE]);"
    + " return JSON.stringify(RESPOSTAS.get('aula-1-sequencia')); })()"));
  provar('e o envelope fica com as seis ao gravar (a órfã não se reescreve)',
    gravado.length === 6, gravado.length);

  /* --------------------------------------------------------------------------------------- */
  bloco('4. A CHAVE É O NÚMERO — corrigir o texto de um objetivo não duplica a linha');
  /* --------------------------------------------------------------------------------------- */
  const doisObjetivos = ['Objetivo A', 'Objetivo B'];
  const sequenciaDois = [
    { Bloco: 'Barra', 'Objetivo específico': '1 — Objetivo A', 'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '2/4' },
    { Bloco: 'Centro', 'Objetivo específico': '2 — Objetivo B', 'Conteúdo do nível': 'Plié', Tempos: '4', Compasso: '2/4' },
  ];
  const estruturaDois = [{ marco: 1, marcados: ['Barra'] }, { marco: 2, marcados: ['Centro'] }];
  const parametroDois = [{ marco: 1, marcados: ['Battement tendu'] }, { marco: 2, marcados: ['Plié'] }];

  w.eval(semear(doisObjetivos, estruturaDois, parametroDois, sequenciaDois));
  await new Promise((r) => setTimeout(r, 250));
  const antes = abrirASequencia(w);
  provar('antes da correcção: duas linhas', antes.length === 2, antes.length);

  // A pessoa corrige a redacção do objetivo 2 (a linha gravada guarda o texto antigo).
  w.eval("(function(){ RESPOSTAS.set('marcos-por-aula', ['Objetivo A', 'Objetivo B (corrigido)']);"
    + ' pintarRoteiro(); return true; })()');
  await new Promise((r) => setTimeout(r, 250));
  const depois = abrirASequencia(w);
  provar('depois da correcção: continuam DUAS linhas (não quatro)', depois.length === 2, depois.length);
  provar('…e o rótulo do objetivo 2 acompanha o texto novo',
    depois.some((l) => l.celulas[1].texto === '2 — Objetivo B (corrigido)'),
    depois.map((l) => l.celulas[1].texto));
  provar('…sem ficar nenhuma linha com o texto velho',
    !depois.some((l) => l.celulas[1].texto === '2 — Objetivo B'),
    depois.map((l) => l.celulas[1].texto));

  /* --------------------------------------------------------------------------------------- */
  bloco('5. O ✕ — a derivada não se remove, a acrescentada sim');
  /* --------------------------------------------------------------------------------------- */
  w.eval(semear([OBJETIVO_1], ESTADO.estrutura, ESTADO.parametro, SEQUENCIA_GUARDADA));
  await new Promise((r) => setTimeout(r, 250));
  const comXis = abrirASequencia(w);
  provar('as seis derivadas têm ✕ apagado, e isto COM a senha já validada',
    comXis.every((l) => l.xis === 'apagado'), comXis.map((l) => l.xis));

  w.eval("(function(){ mudarLinhasDaGrelha('add'); return true; })()");
  await new Promise((r) => setTimeout(r, 250));
  const comExtra = abrirASequencia(w);
  provar('a linha acrescentada nasce com ✕ activo', comExtra[comExtra.length - 1].xis === 'activo',
    comExtra.map((l) => l.xis));
  provar('…e as derivadas continuam apagadas', comExtra.slice(0, 6).every((l) => l.xis === 'apagado'),
    comExtra.map((l) => l.xis));

  w.eval("(function(){ var bs = document.querySelectorAll('#pergunta [data-grelha-del]');"
    + ' bs[bs.length - 1].click(); return true; })()');
  await new Promise((r) => setTimeout(r, 250));
  const semExtra = abrirASequencia(w);
  provar('o ✕ da acrescentada remove-a — e só a ela', semExtra.length === 6, semExtra.length);

  // A MESMA CLASSE, num sítio onde ela morde: o «−» do primeiro objetivo específico (a lista
  // nunca fica vazia) tem de continuar apagado com a senha validada.
  const menos = w.eval("(function(){ var i = MAPA.nos.findIndex(function(n){ return n.id === 'marcos-por-aula'; });"
    + ' INDICE = i; renderPergunta();'
    + " return Array.prototype.slice.call(document.querySelectorAll('#pergunta [data-lista-del]'))"
    + ".map(function(b){ return b.disabled ? 'apagado' : 'activo'; }); })()");
  provar('o «−» do primeiro objetivo continua apagado (a lista não fica vazia)',
    JSON.stringify(menos) === JSON.stringify(['apagado']), menos);

  /* --------------------------------------------------------------------------------------- */
  bloco('6. A TELA E O NÚCLEO CONCORDAM — a mesma lista de objetivos, as mesmas linhas');
  /* --------------------------------------------------------------------------------------- */
  const ficaram = JSON.parse(w.eval(
    "(function(){ return JSON.stringify(RESPOSTAS.get('aula-1-sequencia')); })()"));
  const peloNucleo = sequenciaDoPlano.linhasVivas(SEQUENCIA_GUARDADA, [OBJETIVO_1]);
  provar('as linhas que a tela gravou são as que o núcleo deixa passar',
    JSON.stringify(ficaram.map((l) => l['Objetivo específico']))
    === JSON.stringify(peloNucleo.map((l) => l['Objetivo específico'])),
    { tela: ficaram.length, nucleo: peloNucleo.length });
  provar('nenhum erro de JavaScript na página', problemas.length === 0, problemas);

  srv.close();
  console.log('');
  console.log((falhas ? 'FALHOU' : 'TUDO CERTO') + ' — ' + total + ' asserção(ões), ' + falhas + ' falha(s).');
  console.log(falhas
    ? 'A sequência não acompanha os objetivos.'
    : 'A sequência acompanha os objetivos: a linha órfã sai, a viva fica, e a chave é o número.');
  process.exit(falhas ? 1 : 0);
})();
