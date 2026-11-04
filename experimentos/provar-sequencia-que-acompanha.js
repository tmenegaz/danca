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
 * E A QUINTA (03/11/2026): o conteúdo do exercício é o REPERTÓRIO CURADO da turma. Medir não é
 * curar — a matriz do parâmetro aceita qualquer termo, e um termo marcado fora da curadoria
 * entrava na aula como exercício («Port de bras», que existia na matriz e não no repertório).
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

/* O REPERTÓRIO DA TURMA — a curadoria, servida por esta prova. É variável de módulo porque a
 * secção 7 o estreita de propósito: o defeito que ela mede é o de uma medida marcada FORA do
 * repertório curado, e para o reproduzir a curadoria tem de deixar de a conter. */
let REPERTORIO = ['battement-tendu', 'plie', 'port-de-bras'];

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
      return json({ ok: true, relacoes: { [TURMA.id]: REPERTORIO.slice() } });
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
  provar('«Battement tendu» está no repertório e «Port de bras» não',
    sequenciaDoPlano.linhaForaDoRepertorio({ 'Conteúdo do nível': 'Port de bras' },
      ['Battement tendu', 'Plié']) === true
    && sequenciaDoPlano.linhaForaDoRepertorio({ 'Conteúdo do nível': 'Plié' },
      ['Battement tendu', 'Plié']) === false);
  provar('a linha vazia não é violação do repertório (a lacuna não se pune)',
    sequenciaDoPlano.linhaForaDoRepertorio({ Bloco: 'Barra' }, ['Plié']) === false);
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

  /* A OUTRA PORTA DO MESMO DEFEITO (03/11/2026): o exercício que a curadoria não acordou. Aqui o
   * objetivo EXISTE e a linha não é órfã — o que não existe é o exercício no repertório do
   * envelope. Publicá-lo punha na música uma peça que o «Repertório», duas secções abaixo, não
   * lista: a contradição dentro da própria página. */
  const sequenciaComPort = [
    { Bloco: 'Barra', 'Objetivo específico': ROTULO_1, 'Conteúdo do nível': 'Battement tendu' },
    { Bloco: 'Centro', 'Objetivo específico': ROTULO_1, 'Conteúdo do nível': 'Port de bras' },
  ];
  const envelopeCom = (repertorio) => {
    const e = envelope([OBJETIVO_1], sequenciaComPort);
    e.respostas.repertorio = { valor: repertorio };
    return e;
  };
  const mdFora = derivarPlano(envelopeCom(['Battement tendu', 'Plié'])).markdown;
  const mdDentro = derivarPlano(envelopeCom(['Battement tendu', 'Plié', 'Port de bras'])).markdown;
  provar('o exercício fora do repertório do envelope não entra na música',
    !/Port de bras/.test(musica(mdFora)), musica(mdFora));
  provar('…e o que está no repertório continua publicado',
    /Battement tendu —/.test(musica(mdFora)), musica(mdFora));
  provar('CONTROLE: no repertório, o mesmo exercício publica-se',
    /Port de bras —/.test(musica(mdDentro)), musica(mdDentro));
  const mdSemRepertorio = derivarPlano((() => {
    const e = envelope([OBJETIVO_1], sequenciaComPort);
    delete e.respostas.repertorio;
    return e;
  })()).markdown;
  provar('sem repertório declarado não se julga (não se apaga o que não se pode conferir)',
    /Port de bras —/.test(musica(mdSemRepertorio)), musica(mdSemRepertorio));

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
  bloco('5. A TABELA NÃO INVENTA NADA — nem uma linha a mais, nem uma a menos');
  /* --------------------------------------------------------------------------------------- */
  /* A REGRA, e ela é de negócio (03/11/2026): «adicionar uma linha não faz sentido existir aqui.
   * Se eu quiser que tenha mais, eu preciso voltar lá para a produção e vincular na curadoria
   * que tenha mais exercícios para essa turma. […] Isso quebra toda a nossa regra de negócio,
   * porque a gente tá gerando uma fraude. Não foi curado isso.» A curadoria é ela mesma um
   * plano, acordado entre a direção e o professor: uma linha acrescentada aqui seria um acordo
   * que ninguém fez, e publicá-la é o mesmo que falsificá-lo. */
  w.eval(semear([OBJETIVO_1], ESTADO.estrutura, ESTADO.parametro, SEQUENCIA_GUARDADA));
  await new Promise((r) => setTimeout(r, 250));
  const osBotoes = w.eval(`(function(){
    var q = document.getElementById('pergunta');
    return {
      acrescentar: q.querySelectorAll('[data-grelha-add]').length,
      remover: q.querySelectorAll('[data-grelha-del]').length,
      livres: q.querySelectorAll('[data-grelha-livre]').length,
      selects: q.querySelectorAll('tbody select').length
    };
  })()`);
  provar('não há botão «Adicionar linha»', osBotoes.acrescentar === 0, osBotoes);
  provar('não há ✕ nenhum na tabela', osBotoes.remover === 0, osBotoes);
  provar('não há campo livre — nem no conteúdo, nem nos tempos e no compasso',
    osBotoes.livres === 0 && osBotoes.selects === 0, osBotoes);

  /* CONTROLE POSITIVO, e é o que impede a leitura errada de que «a tabela deixou de funcionar»:
   * o caminho legítimo de ter mais exercícios — marcar mais um em «Parâmetro de medição» —
   * continua a produzir mais linhas. Sem esta asserção, a secção passaria com a tabela vazia. */
  const antesDoParametro = abrirASequencia(w).length;
  w.eval("(function(){ RESPOSTAS.set('aula-1-parametro',"
    + " [{ marco: 1, marcados: ['Battement tendu', 'Plié', 'Port de bras'] }]);"
    + ' pintarRoteiro(); return true; })()');
  await new Promise((r) => setTimeout(r, 250));
  const depoisDoParametro = abrirASequencia(w).length;
  provar('marcar um exercício a mais no PARÂMETRO acrescenta as linhas dele',
    depoisDoParametro > antesDoParametro,
    { antes: antesDoParametro, depois: depoisDoParametro });
  provar('e cada exercício novo ganha uma linha por bloco onde o objetivo é trabalhado',
    depoisDoParametro === antesDoParametro + 3,
    { antes: antesDoParametro, depois: depoisDoParametro });

  /* O CASO DA LACUNA — e ele é o que distingue «derivado de nada» de «campo por preencher». Sem
   * parâmetro marcado não há exercício nenhum para aquele objetivo; a tabela mostra o bloco e o
   * objetivo, e a célula do conteúdo fica VAZIA e travada — não vira campo livre. Um campo livre
   * aqui era a porta por onde entrava o exercício que a curadoria não acordou. */
  w.eval(semear([OBJETIVO_1], ESTADO.estrutura, [], SEQUENCIA_GUARDADA));
  await new Promise((r) => setTimeout(r, 250));
  const semParametro = abrirASequencia(w);
  provar('sem parâmetro marcado, aparecem as linhas dos blocos e nenhuma inventada',
    semParametro.length === 3, semParametro.length);
  provar('…e o conteúdo do nível fica vazio e travado, em vez de um campo para escrever',
    semParametro.every((l) => l.celulas[2].travada && !l.celulas[2].select
      && l.celulas[2].texto === '—'),
    semParametro.map((l) => l.celulas[2]));
  const rodape = w.eval("(function(){ var q = document.getElementById('pergunta');"
    + " var p = q.querySelectorAll('.sub'); var t = '';"
    + " for (var i = 0; i < p.length; i++) t += p[i].textContent; return t; })()");
  provar('e o rodapé diz que o repertório se muda na Curadoria',
    /Curadoria/.test(rodape), rodape.slice(0, 200));

  /* E O OUTRO LADO — a tabela que NÃO é a sequência não herda essa frase. A distribuição do
   * volume também recebe as linhas dos blocos marcados, mas ali a proporção SE ESCREVE, e o
   * rodapé tem de dizer isso. Uma mensagem só para as duas telas seria meia verdade numa delas. */
  const rodapeDoVolume = w.eval("(function(){ var i = MAPA.nos.findIndex(function(n){"
    + " return n.id === 'distribuicao-de-volume'; }); INDICE = i; renderPergunta();"
    + " var p = document.querySelectorAll('#pergunta .sub'); var t = '';"
    + " for (var j = 0; j < p.length; j++) t += p[j].textContent; return t; })()");
  provar('a distribuição do volume diz que ali a proporção se preenche',
    /proporção/.test(rodapeDoVolume) && !/Curadoria/.test(rodapeDoVolume),
    rodapeDoVolume.slice(0, 220));

  /* E a outra classe, que continua a valer: o controle que nasce travado por REGRA não pode ser
   * aceso pela senha. O «−» do primeiro objetivo específico (a lista nunca fica vazia) é o caso
   * vivo — a trava da senha escrevia `disabled = false` em todos os controles ao destravar. */
  const menos = w.eval("(function(){ var i = MAPA.nos.findIndex(function(n){ return n.id === 'marcos-por-aula'; });"
    + ' INDICE = i; renderPergunta();'
    + " return Array.prototype.slice.call(document.querySelectorAll('#pergunta [data-lista-del]'))"
    + ".map(function(b){ return b.disabled ? 'apagado' : 'activo'; }); })()");
  provar('o «−» do primeiro objetivo continua apagado (a lista não fica vazia)',
    JSON.stringify(menos) === JSON.stringify(['apagado']), menos);

  /* --------------------------------------------------------------------------------------- */
  /* --------------------------------------------------------------------------------------- */
  bloco('6. A TELA E O NÚCLEO CONCORDAM — a mesma lista de objetivos, as mesmas linhas');
  /* --------------------------------------------------------------------------------------- */
  // O estado volta ao caso dela: a secção 5 marcou um exercício a mais de propósito.
  w.eval(semear([OBJETIVO_1], ESTADO.estrutura, ESTADO.parametro, SEQUENCIA_GUARDADA));
  await new Promise((r) => setTimeout(r, 250));
  const desenhadas = abrirASequencia(w);
  const peloNucleo = sequenciaDoPlano.linhasVivas(SEQUENCIA_GUARDADA, [OBJETIVO_1]);
  provar('a tela desenha exactamente as linhas que o núcleo deixa passar',
    JSON.stringify(desenhadas.map((l) => l.celulas[0].texto + '␟' + l.celulas[1].texto))
    === JSON.stringify(peloNucleo.map((l) => String(l.Bloco) + '␟' + String(l['Objetivo específico']))),
    { tela: desenhadas.map((l) => l.celulas[0].texto), nucleo: peloNucleo.length });
  provar('…e são seis, no caso dela', desenhadas.length === 6 && peloNucleo.length === 6,
    { tela: desenhadas.length, nucleo: peloNucleo.length });
  provar('nenhum erro de JavaScript na página', problemas.length === 0, problemas);

  srv.close();

  /* --------------------------------------------------------------------------------------- */
  bloco('7. O CONTEÚDO É O DA CURADORIA — a medida fora do repertório não vira exercício');
  /* --------------------------------------------------------------------------------------- */
  /* O QUE ELA RELATOU. «A curadoria ativa deste teste possui estritamente apenas dois verbetes
   * cadastrados (Battement Tendu e Plié). No entanto, o sistema injetou automaticamente um
   * conteúdo chamado Port de Bras vinculado ao Objetivo 2.» E acrescentou a suspeita, que era
   * razoável: «há uma forte evidência de que os dados de teste (mock data)… estão injetando
   * valores fixos».
   *
   * NÃO HÁ MOCK. O que havia era uma porta: a «Conteúdo do nível» da sequência lia os termos
   * marcados na matriz do «Parâmetro de medição» sem os conferir contra o repertório curado. Uma
   * medida marcada fora dele — e a matriz aceita qualquer termo, porque medir não é curar —
   * entrava na aula como exercício. A medida não é o repertório (03/11/2026): agora só passa
   * quem a curadoria acordou, e o que fica de fora é DITO no rodapé, não sumido.
   *
   * O mesmo vale para a coluna do objetivo: uma linha da matriz de BLOCOS guardada para um
   * objetivo que já não existe gerava uma semente com o rótulo «3» e sem texto — a «menção
   * residual a um suposto Objetivo 3». Sem sujeito, não é linha. */
  const DOIS = ['reconhecer o apoio', 'transferir o peso'];
  const ESTRUTURA_DOIS = [{ marco: 1, marcados: ['Barra'] },
    { marco: 2, marcados: ['Barra', 'Centro', 'Expressão'] }];
  const PARAMETRO_COM_PORT = [{ marco: 1, marcados: ['Battement tendu', 'Plié'] },
    { marco: 2, marcados: ['Port de bras'] }];

  REPERTORIO = ['battement-tendu', 'plie'];
  const estreita = await abrir();
  estreita.w.eval(semear(DOIS, ESTRUTURA_DOIS, PARAMETRO_COM_PORT, []));
  await new Promise((r) => setTimeout(r, 400));
  const comPortFora = abrirASequencia(estreita.w);
  const textosFora = comPortFora.map((l) => l.celulas[2].texto);

  provar('a medida fora do repertório não vira exercício',
    textosFora.every((t) => !/port de bras/i.test(t)), textosFora);
  provar('a aula fica com os exercícios curados (dois no objetivo 1)',
    textosFora.filter((t) => t !== '\u2014').length === 2, textosFora);
  provar('e o objetivo 2, sem exercício curado, aparece como lacuna e não como invenção',
    comPortFora.filter((l) => /^2 —/.test(l.celulas[1].texto)).every((l) => l.celulas[2].texto === '\u2014'),
    textosFora);
  const rodapeFora = estreita.w.eval("(function(){ var q = document.getElementById('pergunta');"
    + " var p = q.querySelectorAll('.sub'); var t = '';"
    + " for (var i = 0; i < p.length; i++) t += p[i].textContent; return t; })()");
  provar('…e o rodapé nomeia o que ficou de fora, em vez de o sumir',
    /Port de bras/.test(rodapeFora) && /Curadoria/.test(rodapeFora), rodapeFora.slice(0, 240));

  /* CONTROLE NEGATIVO: com o «Port de bras» DENTRO da curadoria, os mesmos dados produzem os
   * exercícios dele. Sem este controlo, a asserção acima passaria mesmo que a coluna tivesse
   * deixado de ler a matriz por completo. */
  REPERTORIO = ['battement-tendu', 'plie', 'port-de-bras'];
  const larga = await abrir();
  larga.w.eval(semear(DOIS, ESTRUTURA_DOIS, PARAMETRO_COM_PORT, []));
  await new Promise((r) => setTimeout(r, 400));
  const comPortDentro = abrirASequencia(larga.w);
  provar('CONTROLE: curado o «Port de bras», ele aparece nos três blocos do objetivo 2',
    comPortDentro.filter((l) => /port de bras/i.test(l.celulas[2].texto)).length === 3,
    comPortDentro.map((l) => l.celulas[2].texto));

  /* O OBJETIVO 3, e as duas metades da mesma regra: uma linha de bloco para ele não pode gerar
   * semente, e com o objetivo de volta na lista tem de gerar. */
  larga.w.eval("(function(){ RESPOSTAS.set('estrutura-de-cada-aula',"
    + " [{ marco: 1, marcados: ['Barra'] }, { marco: 2, marcados: ['Centro'] },"
    + "  { marco: 3, marcados: ['Expressão'] }]); pintarRoteiro(); return true; })()");
  await new Promise((r) => setTimeout(r, 300));
  const comMarcoTres = abrirASequencia(larga.w);
  provar('um bloco guardado para o objetivo 3 não gera linha',
    comMarcoTres.every((l) => !/^3(\D|$)/.test(l.celulas[1].texto)),
    comMarcoTres.map((l) => l.celulas[1].texto));
  provar('…nem deixa a coluna do objetivo sem texto',
    comMarcoTres.every((l) => l.celulas[1].texto.trim().length > 0),
    comMarcoTres.map((l) => l.celulas[1].texto));
  larga.w.eval(semear(DOIS.concat(['sustentar a transferência']), [{ marco: 3, marcados: ['Expressão'] }],
    PARAMETRO_COM_PORT, []));
  await new Promise((r) => setTimeout(r, 300));
  const comObjetivoTres = abrirASequencia(larga.w);
  provar('CONTROLE: com o terceiro objetivo na lista, o bloco dele produz a linha',
    comObjetivoTres.some((l) => /^3 —/.test(l.celulas[1].texto)),
    comObjetivoTres.map((l) => l.celulas[1].texto));
  provar('nenhum erro de JavaScript nas duas páginas',
    estreita.problemas.length === 0 && larga.problemas.length === 0,
    { estreita: estreita.problemas, larga: larga.problemas });

  estreita.srv.close();
  larga.srv.close();
  console.log('');
  console.log((falhas ? 'FALHOU' : 'TUDO CERTO') + ' — ' + total + ' asserção(ões), ' + falhas + ' falha(s).');
  console.log(falhas
    ? 'A sequência não acompanha os objetivos.'
    : 'A sequência acompanha os objetivos — e só o que a curadoria acordou.');
  process.exit(falhas ? 1 : 0);
})();
