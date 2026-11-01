#!/usr/bin/env node
'use strict';

/**
 * provar-musica-no-plano.js — os tempos e o compasso vêm do verbete.
 *
 * O DEFEITO QUE ISTO TRAVA (31/10/2026). A pesquisadora abriu o nó «Sequência de exercícios por
 * bloco», do plano do Nível 3, e o «Battement fondu» — que ela tinha acabado de escrever no
 * verbete, com a música `2|4/4` — aparecia com «Tempos» e «Compasso» VAZIOS. O documento publicado
 * diria, na linha dele, «os tempos e o compasso ainda não estão declarados no plano».
 *
 * O que estava mal não era o dado: o plano contribui com DUAS coisas para a notação — os tempos e
 * o compasso —, e juntas são a CHAVE do verbete (`<tempos>|<compasso>`). O verbete já a declara.
 * Pedi-la outra vez, em campos vazios, é a mesma redundância que se tirou da tabela de
 * decomposição, um andar acima.
 *
 * A REGRA, decidida por ela:
 *
 *   1. o verbete declara UMA música → os dois campos vêm preenchidos e TRAVADOS (como o Bloco e o
 *      Objetivo, que também vêm do sistema), e o que fica GRAVADO é esse par;
 *   2. o verbete declara VÁRIAS → os dois são escolha, e só as músicas declaradas se oferecem
 *      (8 tempos não podem conviver com 3/4, porque essa música não existe no alfabeto);
 *   3. o exercício NÃO tem verbete → fica como era: tempos à mão e o compasso dos oito. Não há o
 *      que derivar, e derivar seria inventar;
 *   4. a tela DIZ de onde vêm, e onde se corrige — um campo travado sem explicação parece um
 *      defeito.
 *
 * COMO É MEDIDA. JSDOM, com o conteúdo de verdade (`porta/plano/conteudo/plano.json`) e o
 * alfabeto de verdade (`biblioteca/modalidades/bale-classico/notacao.json`): o que se serve de
 * `/api/bastidores/termos` é o mapa `nome → músicas` que o servidor passou a mandar. A seção 5
 * corre o CONTROLRO negativo — sem esse campo, nada muda, e é isso que prova que a derivação vem
 * do dado e não de uma regra escrita na tela.
 *
 *   node experimentos/provar-musica-no-plano.js
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

/* A TURMA DA PROVA tem os TRÊS CASOS, e é de propósito: um exercício com uma música (fondu), um
 * com três (tendu), e dois sem verbete nenhum (arabesque, jeté) — que é o que ela tem hoje. */
const TERMOS = VOCABULARIO.map((t) => ({
  id: t.id, termo: t.termo, categoria: t.categoria,
  descricao: t.descricao || '', fonte: t.fonte || '',
  musicas: MUSICAS[t.termo] || [],
}));
const CONTEUDO_DA_TURMA = ['battement-fondu', 'battement-tendu', 'arabesque', 'jete'];
const TURMA = {
  id: 't3', nome: 'Turma da prova', frequencia: 2, dias: ['ter', 'qui'], duracaoMin: 60,
  periodoInicio: '2027-02-02', periodoFim: '2027-04-29', totalAulas: 26,
};
const OBJETIVOS = ['Objetivo A', 'Objetivo B'];

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
      // `RESPOSTAS` é um `let` de topo: existe no ambiente lexical, não como propriedade de
      // `window`. A semente entra por `eval`, entre os `await` do arranque.
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

/** Desenha a sequência com os quatro exercícios da turma e devolve o que saiu, e o que se grava. */
const desenhar = (w) => w.eval(`(async function(){
  RESPOSTAS.set('contexto-turma', 'Turma da prova');
  RESPOSTAS.set('marcos-por-aula', ${JSON.stringify(OBJETIVOS)});
  RESPOSTAS.set('estrutura-de-cada-aula', [{ marco: 1, marcados: ['Solo'] }]);
  RESPOSTAS.set('aula-1-parametro', [{ marco: 1,
    marcados: ['Battement fondu', 'Battement tendu', 'Arabesque', 'Jeté'] }]);
  await carregarTurmasDaEscola();
  INDICE = MAPA.nos.findIndex(function(n){ return n.id === 'aula-1-sequencia'; });
  renderPergunta();
  var q = document.getElementById('pergunta');
  var porExercicio = {};
  Array.prototype.slice.call(q.querySelectorAll('tbody tr')).forEach(function(tr){
    var cels = Array.prototype.slice.call(tr.children);
    var nome = (cels[2] || {}).textContent || '';
    var celula = function(k){ return cels[k] || {}; };
    var campos = Array.prototype.slice.call(celula(3).querySelectorAll('input,select'))
      .concat(Array.prototype.slice.call(celula(4).querySelectorAll('input,select')));
    porExercicio[nome.trim()] = {
      temposTexto: celula(3).textContent.trim(),
      compassoTexto: celula(4).textContent.trim(),
      travadas: [celula(3).classList.contains('travada'), celula(4).classList.contains('travada')],
      temposCampo: celula(3).querySelector('input,select') ? celula(3).querySelector('input,select').tagName.toLowerCase() : null,
      compassoCampo: celula(4).querySelector('input,select') ? celula(4).querySelector('input,select').tagName.toLowerCase() : null,
      opcoesDeTempo: Array.prototype.slice.call(celula(3).querySelectorAll('option')).map(function(o){ return o.value; }).filter(Boolean),
      opcoesDeCompasso: Array.prototype.slice.call(celula(4).querySelectorAll('option')).map(function(o){ return o.value; }).filter(Boolean),
      musicas: tr.getAttribute('data-musicas'),
      campos: campos.length,
    };
  });
  return {
    linhas: porExercicio,
    nota: (q.querySelector('.sub') || {}).textContent || '',
    gravado: lerResposta(MAPA.nos[INDICE]).valor,
  };
})()`);

(async () => {
  const { w, srv, problemas } = await abrir(false);
  try {
    const d = await desenhar(w);

    console.log('\n1. O verbete declara UMA música: os tempos e o compasso vêm preenchidos e travados');
    const fondu = d.linhas['Battement fondu'] || {};
    provar('a linha do Battement fondu traz os tempos do verbete (2)', fondu.temposTexto === '2', fondu.temposTexto);
    provar('…e o compasso do verbete (4/4)', fondu.compassoTexto === '4/4', fondu.compassoTexto);
    provar('…e os dois são LEITURA, não campos a escrever',
      JSON.stringify(fondu.travadas) === JSON.stringify([true, true]), fondu.travadas);
    provar('…mas o valor viaja num campo escondido, para ser gravado',
      fondu.temposCampo === 'input' && fondu.compassoCampo === 'input',
      [fondu.temposCampo, fondu.compassoCampo]);

    console.log('\n2. O que fica GRAVADO é esse par — sem um clique');
    const linhaFondu = (d.gravado || []).filter((l) => l['Conteúdo do nível'] === 'Battement fondu')[0] || {};
    provar('a resposta gravada diz Tempos=2', linhaFondu['Tempos'] === '2', linhaFondu);
    provar('…e Compasso=4/4', linhaFondu['Compasso'] === '4/4', linhaFondu);

    console.log('\n3. O verbete declara VÁRIAS músicas: os dois viram escolha, e só do que existe');
    const tendu = d.linhas['Battement tendu'] || {};
    provar('os tempos são escolha, com as três músicas do verbete',
      tendu.temposCampo === 'select' && JSON.stringify(tendu.opcoesDeTempo) === JSON.stringify(['4', '8', '12']),
      { campo: tendu.temposCampo, opcoes: tendu.opcoesDeTempo });
    provar('…e o compasso só oferece 4/4, que é o das três',
      tendu.compassoCampo === 'select' && JSON.stringify(tendu.opcoesDeCompasso) === JSON.stringify(['4/4']),
      { campo: tendu.compassoCampo, opcoes: tendu.opcoesDeCompasso });
    provar('…e a linha leva os pares declarados, para o compasso acompanhar os tempos',
      tendu.musicas === '4|4/4 8|4/4 12|4/4', tendu.musicas);

    console.log('\n4. Sem verbete, nada muda: tempos à mão e o compasso dos oito');
    // O EXEMPLO MUDOU DE DONO (01/11/2026). Era o Arabesque — e o Arabesque deixou de ser um
    // exercício sem verbete no dia em que o modelo de ensaio lhe deu um (`4|4/4`). O caso que esta
    // secção mede não desapareceu com isso; quem o representa agora é o Jeté, que continua sem
    // verbete e continua a ser pedido pelo plano. Uma prova que mede «o que não tem verbete» com
    // um exercício que passou a ter mediria o contrário do que diz.
    const semVerbete = d.linhas['Jeté'] || {};
    provar('o Jeté não tem travadas', JSON.stringify(semVerbete.travadas) === JSON.stringify([false, false]),
      semVerbete.travadas);
    provar('…os tempos são texto livre', semVerbete.temposCampo === 'input',
      { campo: semVerbete.temposCampo, campos: semVerbete.campos });
    provar('…e o compasso oferece as oito opções de sempre',
      semVerbete.opcoesDeCompasso.length === 8, semVerbete.opcoesDeCompasso);

    console.log('\n5. A tela diz de onde vêm, e onde se corrige');
    provar('há uma nota a dizer que vêm do verbete', /vêm do verbete/.test(d.nota), d.nota);
    provar('…e que corrigir o exercício é alterar o verbete, em Produção',
      /Produção/.test(d.nota) && /verbete é que se altera/.test(d.nota), d.nota);

    provar('nenhum erro de JavaScript na página', problemas.length === 0, problemas.slice(0, 3));
  } finally {
    w.close();
    srv.close();
  }

  /* O CONTROLE NEGATIVO: a mesma página, a rota sem o campo `musicas`. Se a derivação fosse uma
   * regra escrita na tela (um `switch` por nome de exercício), ele continuaria a preencher — e é
   * isso que se quer impedir: a fonte é o alfabeto, não uma lista paralela. */
  console.log('\n6. CONTROLE NEGATIVO: sem o campo da rota, nada é derivado');
  const negativo = await abrir(true);
  try {
    const d = await desenhar(negativo.w);
    const fondu = d.linhas['Battement fondu'] || {};
    provar('sem as músicas na rota, o Battement fondu volta a ser campo livre',
      JSON.stringify(fondu.travadas) === JSON.stringify([false, false]), fondu.travadas);
    provar('…e não há nota a prometer uma origem que não existe',
      !/vêm do verbete/.test(d.nota), d.nota);
    provar('…e nenhum erro de JavaScript', negativo.problemas.length === 0, negativo.problemas.slice(0, 3));
  } finally {
    negativo.w.close();
    negativo.srv.close();
  }

  console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ') + total + ' asserção(ões), ' + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})();
