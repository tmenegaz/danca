#!/usr/bin/env node
'use strict';

/**
 * provar-derivados-da-sequencia.js — o que a sequência já decidiu não se escreve outra vez.
 *
 * O DEFEITO, dito pela pesquisadora (01/11/2026): «toda vez que eu vou acrescentar um trecho eu
 * preciso digitar novamente o que acontece nesse trecho — mesmo que já tenha escrito». A mesma
 * família de erro, um andar acima: o bloco 10 do plano («Música e repertório») pedia
 * «um por linha: título e, se quiser, a faixa ou o compasso» — e o compasso de cada exercício já
 * estava no VERBETE, e os exercícios da aula já estavam na SEQUÊNCIA, uma tela acima. Duas fontes
 * para o mesmo dado é uma fonte a mais: o professor redigita o que já decidiu, e as duas versões
 * podem discordar sem que nada falhe.
 *
 * A REGRA, decidida por ela (01/11/2026):
 *
 *   1. a MÚSICA da aula sobe da sequência (que a lê do verbete), exercício por exercício, e aparece
 *      ACIMA do campo do nó 24 — o campo pede o VÍDEO, e só;
 *   2. o REPERTÓRIO é a própria sequência: o nó não se escreve (`somenteLeitura`), e o valor entra
 *      semeado para o envelope, o índice e o documento não ficarem cegos ao que a aula usa;
 *   3. a SEQUÊNCIA é um DEMONSTRATIVO e semeia-se sozinha a cada pintura do roteiro — antes ela só
 *      era gravada se o nó fosse ABERTO, e quem preenchesse a matriz e gerasse o documento sem
 *      passar por lá perdia a sequência inteira;
 *   4. O QUE O PROFESSOR ESCREVEU NÃO SE SOBRESCREVE: um valor que não foi semeado por aqui (o de
 *      um plano antigo, ou o que ele digitou à mão) passa como veio.
 *
 * COMO É MEDIDA. JSDOM, com o conteúdo de verdade, o alfabeto de verdade e a turma da prova. A
 * seção 6 corre o CONTROLE NEGATIVO — sem o campo `musicas` na rota, a música não sobe —, e a
 * seção 7 mede o documento (o `.md` do plano) derivado do envelope.
 *
 *   node experimentos/provar-derivados-da-sequencia.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const { mapa } = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { derivarPlano } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));

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

/** As músicas que o alfabeto declara, por nome de exercício — o que o servidor manda em `musicas`. */
const MUSICAS = {};
for (const nome of Object.keys(ALFABETO.verbetes || {})) {
  if (nome.startsWith('_')) continue;
  const lista = Object.keys(ALFABETO.verbetes[nome] || {}).filter((k) => /^\d+\|/.test(k));
  if (lista.length) MUSICAS[nome] = lista;
}

/* A TURMA DA PROVA, com o ALFABETO QUE EXISTE (03/11/2026).
 *
 * AQUI ESTAVA «um exercício com UMA música (o fondu, `2|4/4`), um com TRÊS (o tendu) e um sem
 * verbete nenhum (o jeté)». Nenhum dos três era verdade no alfabeto do repositório, e a bancada
 * media a si mesma: hoje `biblioteca/modalidades/bale-classico/notacao.json` declara **Plié**
 * (`4|2/4`) e **Battement tendu** (`8|2/4@breu`), e mais nada — o fondu existe no VOCABULÁRIO
 * (a lista de termos) e não tem VERBETE (o registo com a música). Por isso a asserção «o fondu é
 * 2|4/4» reprovava: o sistema dizia a verdade («tempos e compasso por declarar no verbete») e a
 * fixture é que estava a mentir sobre o que o alfabeto tem.
 *
 * Os três casos que a derivação distingue continuam a ser três, com o dado de hoje:
 *   · **Plié** — um verbete com UMA música (`4|2/4`), e é dela que saem os tempos e o compasso;
 *   · **Battement tendu** — outro verbete (`8|2/4`), marcado em DOIS objetivos: a linha não pode
 *     repetir-se por isso;
 *   · **Jeté** — existe no vocabulário e NÃO tem verbete: a lacuna é dita por palavras.
 * Criar o verbete do fondu é acto de CONTEÚDO (é dela, P-16), não desta prova. */
const TERMOS = VOCABULARIO.map((t) => ({
  id: t.id, termo: t.termo, categoria: t.categoria,
  descricao: t.descricao || '', fonte: t.fonte || '',
  musicas: MUSICAS[t.termo] || [],
}));
const CONTEUDO_DA_TURMA = ['plie', 'battement-tendu', 'jete'];
const TURMA = {
  id: 't3', nome: 'Turma da prova', frequencia: 2, dias: ['ter', 'qui'], duracaoMin: 60,
  periodoInicio: '2027-02-02', periodoFim: '2027-04-29', totalAulas: 26,
};
const OBJETIVOS = ['Objetivo A', 'Objetivo B'];
const EXERCICIOS = ['Plié', 'Battement tendu', 'Jeté'];

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

/** `semMusicas` é o CONTROLE NEGATIVO: a mesma página, com a rota a não trazer o campo. */
function servir(semMusicas) {
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
      const lista = semMusicas
        ? TERMOS.map((t) => Object.assign({}, t, { musicas: undefined }))
        : TERMOS;
      return json({ ok: true, termos: lista, opcoes: TERMOS.map((t) => ({ valor: t.id, rotulo: t.termo })) });
    }
    if (rel === 'api/bastidores/turma-conteudos') {
      return json({ ok: true, relacoes: { [TURMA.id]: CONTEUDO_DA_TURMA } });
    }
    if (rel.startsWith('api/bastidores/curadoria-professor')) {
      return json({ ok: true, curadorias: [{ id: 'c1', professor: 'prova',
        modalidade: 'Balé clássico', turmas: [TURMA.nome], alunas: [] }] });
    }
    if (rel.startsWith('api/')) return json({ ok: true, opcoes: [] });

    /* O `markdown.js` DA PORTA (22/11/2026 — fixture). A página pede-o num caminho ABSOLUTO
     * (`/plano-observacao/assets/markdown.js`), que é onde o produto o serve; a bancada serve a
     * porta em `/plano-ensino/` e devolvia a própria página em vez do script — o primeiro `md()`
     * lançava «Markdown is not defined» e a prova morria sem medir nada. */
    if (rel === 'plano-observacao/assets/markdown.js') {
      return envia(MIME['.js'], fs.readFileSync(path.join(PORTA, 'assets/markdown.js')));
    }
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

/** Abre a página do plano com a turma já escolhida — a trava do `podePreencher` exige-a. */
async function abrir(semMusicas) {
  const { srv, base } = await servir(semMusicas);
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
      const semear = w.setInterval(() => {
        try {
          w.eval("if (typeof RESPOSTAS !== 'undefined' && typeof MAPA !== 'undefined'"
            + " && !RESPOSTAS.get('contexto-turma')) RESPOSTAS.set('contexto-turma', 'Turma da prova');");
        } catch (e) { /* a página ainda não tem estas variáveis */ }
      }, 4);
      w.addEventListener('load', () => w.setTimeout(() => w.clearInterval(semear), 2000));
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

/* A MATRIZ DA AULA, posta como ela a põe: dois objetivos, dois blocos, três exercícios marcados no
 * objetivo 1 e um no objetivo 2 — e o fno fondu no primeiro. Depois `pintarRoteiro()` e NADA MAIS:
 * a sequência tem de se semear sozinha, sem o nó dela ser aberto. */
const SEMEAR_A_MATRIZ = `(function(){
  RESPOSTAS.set('contexto-turma', 'Turma da prova');
  RESPOSTAS.set('marcos-por-aula', ${JSON.stringify(OBJETIVOS)});
  RESPOSTAS.set('estrutura-de-cada-aula', [
    { marco: 1, marcados: ['Solo', 'Barra'] },
    { marco: 2, marcados: ['Centro'] }
  ]);
  RESPOSTAS.set('aula-1-parametro', [
    { marco: 1, marcados: ${JSON.stringify(EXERCICIOS)} },
    { marco: 2, marcados: ['Battement tendu'] }
  ]);
  pintarRoteiro();
  return true;
})()`;

/** Abre UM nó do mapa e devolve o que a tela desenhou. */
const abrirNo = (w, id) => w.eval(`(async function(){
  var i = MAPA.nos.findIndex(function(n){ return n.id === ${JSON.stringify(id)}; });
  INDICE = i;
  renderPergunta();
  var q = document.getElementById('pergunta');
  return {
    texto: q.textContent || '',
    campos: Array.prototype.slice.call(q.querySelectorAll('input,textarea,select'))
      .filter(function(el){
        return el.type !== 'hidden' && !el.hasAttribute('data-campo-nota');
      })
      .map(function(el){ return { tag: el.tagName.toLowerCase(), campo: el.getAttribute('data-campo-aberto') }; }),
    leituras: Array.prototype.slice.call(q.querySelectorAll('.leitura-do-cabecalho'))
      .map(function(d){ return d.textContent; }),
    valor: RESPOSTAS.get(${JSON.stringify(id)}) || null,
    somenteLeitura: !!MAPA.nos[i].somenteLeitura,
    derivado: !!MAPA.nos[i].derivadoDaSequencia
  };
})()`);

(async () => {
  const { w, srv, problemas } = await abrir(false);
  try {
    console.log('\n1. A sequência semeia-se sozinha — sem o nó dela ser aberto');
    await w.eval(SEMEAR_A_MATRIZ);
    const sequencia = await w.eval("RESPOSTAS.get('aula-1-sequencia')");
    provar('a sequência existe depois de pintar o roteiro',
      Array.isArray(sequencia) && sequencia.length > 0, sequencia && sequencia.length);
    /* A expansão: (marco 1 × Solo) e (marco 1 × Barra) × 3 exercícios = 6, mais
     * (marco 2 × Centro) × 1 exercício = 7. A conta é a da matriz, e é ela que diz quantas
     * linhas a aula tem. */
    provar('…com uma linha por (objetivo × bloco × exercício)',
      Array.isArray(sequencia) && sequencia.length === 7, sequencia && sequencia.length);
    const porExercicio = {};
    for (const l of sequencia || []) {
      if (l['Conteúdo do nível']) porExercicio[l['Conteúdo do nível']] = l;
    }
    provar('…e os exercícios que vieram da marcação',
      Object.keys(porExercicio).sort().join(' | ') === ['Plié', 'Battement tendu', 'Jeté'].sort().join(' | '),
      Object.keys(porExercicio));
    provar('…com os tempos e o compasso vindos do VERBETE (o plié é 4|2/4)',
      porExercicio['Plié']
        && porExercicio['Plié'].Tempos === '4'
        && porExercicio['Plié'].Compasso === '2/4',
      porExercicio['Plié']);

    console.log('\n2. O repertório NÃO se escreve: é a sequência, e é leitura');
    const rep = await abrirNo(w, 'repertorio');
    provar('o nó declara-se só de leitura', rep.somenteLeitura === true, rep.somenteLeitura);
    provar('…e não abre campo nenhum', rep.campos.length === 0, rep.campos);
    provar('…e o valor dele é a sequência (os exercícios, sem repetição)',
      JSON.stringify(rep.valor) === JSON.stringify(EXERCICIOS), rep.valor);
    provar('…e a tela diz de onde vem', /SEQUÊNCIA desta aula/.test(rep.texto), rep.texto.slice(0, 120));

    console.log('\n3. A música sobe da sequência, acima do campo do vídeo');
    const video = await abrirNo(w, 'musicas-videos');
    provar('o nó da música NÃO é só de leitura (o vídeo ainda se escreve)',
      video.somenteLeitura === false, video.somenteLeitura);
    provar('…e há uma leitura acima do campo', video.leituras.length === 1, video.leituras);
    provar('…com a música de cada exercício, lida do verbete',
      /Plié — 4 tempos em 2\/4/.test(video.leituras[0] || '')
        && /Battement tendu — /.test(video.leituras[0] || ''),
      video.leituras[0]);
    provar('…e um exercício sem verbete é dito por palavras, não escondido',
      /Jeté — tempos e compasso por declarar no verbete/.test(video.leituras[0] || ''),
      video.leituras[0]);
    provar('…e o campo que sobra é UM (o do vídeo)', video.campos.length === 1, video.campos);

    console.log('\n4. O que o professor escreveu não se sobrescreve');
    const escrito = [{ Bloco: 'Solo', 'Objetivo específico': '1 — Objetivo A',
      'Conteúdo do nível': 'Escrito à mão', Tempos: '8', Compasso: '3/4' }];
    await w.eval(`(function(){
      RESPOSTAS.set('aula-1-sequencia', ${JSON.stringify(escrito)});
      pintarRoteiro();
      return true;
    })()`);
    const depois = await w.eval("RESPOSTAS.get('aula-1-sequencia')");
    provar('um valor que não foi semeado aqui passa como veio (plano antigo, ou digitado)',
      JSON.stringify(depois) === JSON.stringify(escrito), depois);

    console.log('\n5. A sequência semeada acompanha a decisão — não congela');
    await w.eval(`(function(){
      RESPOSTAS.delete('aula-1-sequencia');
      pintarRoteiro();
      return true;
    })()`);
    await w.eval(`(function(){
      RESPOSTAS.set('aula-1-parametro', [{ marco: 1, marcados: ['Plié'] }]);
      pintarRoteiro();
      return true;
    })()`);
    const refeita = await w.eval("RESPOSTAS.get('aula-1-sequencia')");
    const comExercicio = (refeita || []).map((l) => l['Conteúdo do nível']).filter(Boolean);
    /* O tendu e o jeté SAEM (deixaram de estar marcados), o fondu fica nos dois blocos em que
     * ele é trabalhado. A terceira linha é a do objetivo 2 × Centro: este objetivo não tem
     * exercício marcado, e a derivação NÃO inventa um — deixa a linha vazia para ele escrever. */
    provar('desmarcar um exercício tira-lhe as linhas',
      JSON.stringify(comExercicio) === JSON.stringify(['Plié', 'Plié']),
      comExercicio);
    provar('…e o objetivo sem exercício marcado fica com a linha vazia, sem invenção',
      Array.isArray(refeita) && refeita.length === 3
        && refeita.some((l) => !l['Conteúdo do nível']),
      refeita && refeita.length);

    provar('nenhum erro de JavaScript na página', problemas.length === 0, problemas.slice(0, 3));
  } finally {
    w.close();
    srv.close();
  }

  /* O CONTROLE NEGATIVO: a mesma página, a rota sem o campo `musicas`. Se a música subisse de uma
   * lista escrita na tela, ela subiria mesmo assim — e é isso que se quer impedir. */
  console.log('\n6. CONTROLE NEGATIVO: sem o campo da rota, a música não sobe');
  const negativo = await abrir(true);
  try {
    await negativo.w.eval(SEMEAR_A_MATRIZ);
    const video = await abrirNo(negativo.w, 'musicas-videos');
    provar('sem as músicas na rota, a leitura não promete tempos que não existem',
      !/2 tempos em 4\/4/.test(video.leituras[0] || ''), video.leituras[0]);
    provar('…e o exercício aparece como «por declarar», que é a verdade',
      /Plié — tempos e compasso por declarar no verbete/.test(video.leituras[0] || ''),
      video.leituras[0]);
    provar('…e nenhum erro de JavaScript', negativo.problemas.length === 0, negativo.problemas.slice(0, 3));
  } finally {
    negativo.w.close();
    negativo.srv.close();
  }

  /* O DOCUMENTO. O `.md` do plano imprime a música da sequência antes do que o professor escreveu
   * no campo — e o repertório sai da chave `repertorio`, que a tela agora semeia. Um plano antigo,
   * sem sequência, continua a imprimir o que estava escrito: proveniência não reescreve. */
  console.log('\n7. O documento imprime a música derivada, e o repertório semeado');
  const envelope = (respostas) => ({ contexto: { escola: 'Prova', professor: 'Prova', ciclo: '01' }, respostas });
  const comSequencia = derivarPlano(envelope({
    'objetivo-geral': 'Objetivo da prova',
    'aula-1-sequencia': [
      { Bloco: 'Solo', 'Conteúdo do nível': 'Plié', Tempos: '4', Compasso: '2/4' },
      { Bloco: 'Barra', 'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '4/4' },
      { Bloco: 'Barra', 'Conteúdo do nível': 'Battement tendu', Tempos: '12', Compasso: '4/4' },
      { Bloco: 'Centro', 'Conteúdo do nível': 'Jeté' },
    ],
    'musicas-videos': 'https://www.youtube.com/watch?v=prova — o plié na barra',
    'repertorio': ['Plié', 'Battement tendu', 'Jeté'],
  })).markdown;
  provar('a música sai exercício por exercício', /- Plié — 4 tempos em 2\/4/.test(comSequencia),
    (comSequencia.match(/^## Músicas e vídeos[\s\S]{0,400}/m) || [''])[0]);
  /* O NOME DA ASSERÇÃO ESTAVA A PROMETER OUTRA COISA (03/11/2026). Ela dizia «o exercício com duas
   * músicas», e nenhum verbete do alfabeto declara duas hoje. O que ela prova — e continua a
   * provar — é a REGRA: o mesmo exercício, marcado nos dois objetivos, sai UMA vez na lista. */
  provar('…o mesmo exercício, em duas linhas da sequência, sai UMA vez',
    (comSequencia.match(/Battement tendu — /g) || []).length === 1,
    (comSequencia.match(/Battement tendu — /g) || []).length);
  provar('…e o que o professor escreveu no campo vem depois, sem ser perdido',
    /- https:\/\/www\.youtube\.com\/watch\?v=prova/.test(comSequencia));
  /* A FRASE MUDOU (22/11/2026), e a mudança é uma correção: «por declarar no verbete» mandava
   * procurar no sítio errado quando o verbete DECLARA a música e é a linha que não a copiou. Agora
   * a frase nomeia os dois sítios, e o exercício que não tem música em nenhum deles diz isso. */
  provar('…e o exercício sem verbete é dito por palavras, com os dois sítios nomeados',
    /- Jeté — sem música declarada — nem na sequência, nem no verbete deste exercício/.test(comSequencia),
    (comSequencia.match(/- Jeté[^\n]*/) || [''])[0]);
  provar('o repertório sai como a tela o semeou', /## Repertório\n\n- Plié\n- Battement tendu\n- Jeté/.test(comSequencia),
    (comSequencia.match(/^## Repertório[\s\S]{0,200}/m) || [''])[0]);

  const antigo = derivarPlano(envelope({
    'objetivo-geral': 'Objetivo da prova',
    'musicas-videos': 'Faixa de teste em 4/4 e 3/4.',
    'repertorio': 'Sequência de teste com plié e tendu.',
  })).markdown;
  provar('um plano antigo, sem sequência, passa como veio (nada é inventado)',
    /- Faixa de teste em 4\/4 e 3\/4\./.test(antigo)
      && !/sem música declarada/.test(antigo),
    (antigo.match(/^## Músicas e vídeos[\s\S]{0,200}/m) || [''])[0]);

  console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ') + total + ' asserção(ões), ' + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
