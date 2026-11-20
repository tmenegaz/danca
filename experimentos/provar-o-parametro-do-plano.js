#!/usr/bin/env node
'use strict';

/**
 * provar-o-parametro-do-plano.js — O PARÂMETRO DE MEDIÇÃO DO PLANO MOSTRA O QUE ESTÁ GRAVADO?
 *
 * O DEFEITO QUE ISTO MEDE, relatado por ela a 20/11/2026:
 *
 *   «No modal, eu escolhi os três objetivos. Eu estou aqui no plano de ensino, no item nove,
 *    parâmetro de medição. O Batman GT aparece aqui, mas nenhum dos três que eu escolhi está
 *    marcado. Está errado isso, eu escolhi os três, deveriam estar aqui marcados os três.»
 *
 * E o dado estava CERTO — medido no mesmo instante, ao vivo: a Turma declarava
 * `objetivosDoRepertorio: {"Battement jeté": [1, 2, 3]}` e o plano `plano-20261120-1817` tinha os
 * três marcos com o «Battement jeté» em `aula-1-parametro`. O defeito era da TELA.
 *
 * A PERGUNTA DESTA PROVA é onde ele está, e ela tem duas respostas possíveis — que se medem
 * separadamente, porque a correcção é diferente:
 *
 *   A. O WIDGET — dada a resposta na mão (`RESPOSTAS` com a matriz), as caixas ficam marcadas?
 *      Se não ficarem, o casamento entre o termo gravado e a opção do nível está partido.
 *   B. O CAMINHO — chegar ao plano de ensino pelo endereço carrega o plano GRAVADO no formulário?
 *      Se não carregar, o formulário está a mostrar uma condução VAZIA com as opções do nível à
 *      frente e nada marcado — que é exactamente o que ela descreveu.
 *
 * O que se mede é a TELA, em jsdom, servida por HTTP de verdade, com o envelope REAL do caso
 * (três marcos, o parâmetro com o termo nos três). Nada é injetado no lugar do que a página
 * pede: as respostas vêm do `api/envelope/<id>`, como no ar.
 *
 *   uso: node experimentos/provar-o-parametro-do-plano.js
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const PAGINA_FONTE = path.join(RAIZ, 'porta/index.html');
const CONTEUDO_PLANO = path.join(RAIZ, 'porta/plano/conteudo/plano.json');
/* OS ASSETS SÃO OS DA FONTE (`porta/assets/`) e os da raiz da publicação. O pacote
 * `perna-boa/ciclo-01-batata` que a prova irmã usava não existe mais neste clone — é a mesma
 * armadilha que ela já pagou uma vez (ver `provar-dimensoes-plano.js`): servir o HTML para todo
 * pedido de asset deixa a página a morrer em `Markdown is not defined` antes da primeira
 * asserção, e a prova parece medir o produto quando está a medir a bancada. */
const ASSETS_DA_PAGINA = path.join(RAIZ, 'porta/assets');
const ASSETS = path.join(RAIZ, 'publicacao/breu/assets');

let JSDOM;
let VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = require('jsdom'));
} catch (erro) {
  console.error('jsdom ausente — npm install --no-save jsdom');
  process.exit(2);
}

let provas = 0;
let falhas = 0;
function conferir(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('ok    ' + titulo); return; }
  falhas += 1;
  console.log('FALHA ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* ── O CASO REAL, copiado do envelope `plano-20261120-1817` da `breu` ────────────────────────
 *
 * Os três marcos são os que a Turma declara; o parâmetro tem o «Battement jeté» nos três. Os
 * outros termos vêm do nível da turma (o conteúdo), como no ar. */
const MARCOS = [
  'reconhecer o apoio e alinhar o eixo vertical',
  'transferir o peso entre os pés sem perder o alinhamento',
  'sustentar a transferência com musicalidade e controle do movimento',
];
const PARAMETRO = [
  { marco: 1, marcados: ['Battement tendu', 'Plié', 'Relevé', 'Battement jeté'] },
  { marco: 2, marcados: ['Plié', 'Relevé', 'Battement jeté'] },
  { marco: 3, marcados: ['Battement tendu', 'Relevé', 'Battement jeté'] },
];
const CARIMBO = 'plano-20261120-1817';

const r = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });
const ENVELOPE = () => ({
  id: CARIMBO,
  envelope: '1.2.0',
  contexto: { escola: 'breu', professor: 'demi-plie', ciclo: '01', turma: 'Rosa' },
  gerado_em: '2026-11-20T18:17',
  respostas: {
    'objetivo-geral': r('consolidar o alinhamento e a transferência de peso'),
    'contexto-escola': r('breu'),
    'contexto-professor': r('demi-plie'),
    'contexto-turma': r('Rosa'),
    'contexto-metodologia': r('RAD'),
    'marcos-por-aula': r(MARCOS),
    'aula-1-parametro': r(PARAMETRO),
    'aula-1-sequencia': r([]),
    repertorio: r(['Battement tendu', 'Plié', 'Relevé', 'Battement jeté']),
    'estrutura-de-cada-aula': r([{ marco: 1, marcados: ['Solo', 'Barra'] }]),
  },
});

const TERMOS = [
  { id: 'battement-tendu', termo: 'Battement tendu' },
  { id: 'plie', termo: 'Plié' },
  { id: 'releve', termo: 'Relevé' },
  { id: 'battement-jete', termo: 'Battement jeté' },
];
const RELACOES = { rosa: ['battement-tendu', 'plie', 'releve', 'battement-jete'] };
const TURMAS = [{ id: 'rosa', nome: 'Rosa', professor: 'demi-plie', modalidade: 'bale-classico' }];
/* A CURADORIA DA DIREÇÃO, na forma que a rota do ar devolve (`curadoria-professor`). Sem ela a
 * bancada mentia: `listaDeTurmasDoProfessor` filtra as opções pelas turmas atribuídas, e sem
 * curadoria a lista sai vazia — e `selectDaTurma` APAGA a turma do plano (`RESPOSTAS.delete`,
 * 27/10/2026). O plano chegava com «Rosa» e o widget caía em «escolha a turma». Medido: era essa
 * a única razão de o parâmetro aparecer sem caixa nenhuma. */
const CURADORIA = [{
  professor: 'demi-plie', modalidade: 'bale-classico', tradicao: 'francesa',
  turmas: ['Rosa'], repertorio: ['Battement tendu', 'Plié', 'Relevé', 'Battement jeté'],
  elencos: { Rosa: ['Ana', 'Bia'] }, alunas: ['Ana', 'Bia'],
}];

function apiDe(rota) {
  if (rota.startsWith('api/mapa')) {
    const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
    return { ok: true, ...porta.mapa(JSON.parse(fs.readFileSync(CONTEUDO_PLANO, 'utf8'))) };
  }
  if (rota.startsWith('api/planos')) {
    return { ok: true, opcoes: [{ valor: CARIMBO, rotulo: 'Objetivo de teste 3', carimbo: CARIMBO,
      detalhe: 'api/envelope/' + CARIMBO, escola: 'breu', professor: 'demi-plie', ciclo: '01' }] };
  }
  if (rota.startsWith('api/envelope/')) return ENVELOPE();
  if (rota.startsWith('api/bastidores/turma-conteudos')) return { ok: true, relacoes: RELACOES };
  if (rota.startsWith('api/bastidores/termos')) return { ok: true, termos: TERMOS };
  if (rota.startsWith('api/bastidores/turmas')) {
    return { ok: true, turmas: TURMAS, opcoes: TURMAS.map((t) => ({ valor: t.nome, rotulo: t.nome })) };
  }
  if (rota.startsWith('api/bastidores/curadoria-professor')) {
    return { ok: true, escola: 'breu', professor: 'demi-plie', curadorias: CURADORIA, rotulos: {} };
  }
  if (rota.startsWith('api/bastidores/')) return { ok: true };
  if (rota.startsWith('api/')) return { ok: true, opcoes: [], estados: [] };
  return null;
}

const MIME = { '.html': 'text/html;charset=utf-8', '.json': 'application/json;charset=utf-8',
  '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

let PORTA = 0;
const PAGINA = () => `http://127.0.0.1:${PORTA}/plano-ensino/`;

const servidor = http.createServer((req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, PAGINA()).pathname).replace(/^\/+/, '');
  const envia = (corpo, tipo) => { res.writeHead(200, { 'Content-Type': tipo }); res.end(corpo); };
  /* OS ENDEREÇOS ABSOLUTOS (`/api/…`) BATEM NA RAIZ (20/11/2026). A página pede
   * `/api/bastidores/turmas` com barra inicial — no ar é o Worker que responde na raiz, e é lá
   * que a bancada tem de responder também. Sem este ramo, três leituras davam 404, `TURMAS` e
   * `TERMOS` ficavam vazios, e o widget caía no ramo «escolha a turma»: a prova media a bancada
   * a mentir sobre o produto, que é a armadilha que esta sessão já pagou cinco vezes. */
  const semPrefixo = caminho.replace(/^plano-ensino\//, '');
  if (semPrefixo.startsWith('api/')) {
    const dados = apiDe(semPrefixo);
    if (dados) return envia(JSON.stringify(dados), MIME['.json']);
  }
  if (caminho === 'plano-ensino/' || caminho === 'plano-ensino/index.html') {
    return envia(fs.readFileSync(PAGINA_FONTE), MIME['.html']);
  }
  if (caminho === 'plano-ensino/plano/conteudo/plano.json') {
    return envia(fs.readFileSync(CONTEUDO_PLANO), MIME['.json']);
  }
  /* O `markdown.js` vem de `porta/assets/` (é a fonte) e o resto do pacote publicado. A procura
   * é nos dois sítios: a página pede `/plano-observacao/assets/markdown.js` por caminho absoluto,
   * e o resto vem relativo. */
  const nome = path.basename(caminho);
  const daFonte = path.join(ASSETS_DA_PAGINA, nome);
  const arquivo = fs.existsSync(daFonte) ? daFonte : path.join(ASSETS, nome);
  if (/assets\//.test(caminho) && fs.existsSync(arquivo)) {
    return envia(fs.readFileSync(arquivo), MIME[path.extname(arquivo)] || 'application/octet-stream');
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 ' + caminho);
});

const espera = (win, ms = 250) => new Promise((r2) => win.setTimeout(r2, ms));

async function abrir() {
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  vc.on('error', (...a) => problemas.push(a.join(' ')));
  const dom = await JSDOM.fromURL(PAGINA() + '?professor=demi-plie&escola=breu&ciclo=01', {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), PAGINA()), i);
      w.confirm = () => true;
      w.alert = () => {};
    },
  });
  await espera(dom.window, 600);
  return { dom, win: dom.window, doc: dom.window.document, problemas };
}

/** Vai ao nó do parâmetro e devolve o estado das caixas: quantas, quantas marcadas, quais. */
async function medirOParametro(win, doc) {
  await win.eval(`(async () => {
    const i = MAPA.nos.findIndex((n) => n.id === 'aula-1-parametro');
    if (i >= 0) irPara(i);
  })()`);
  await espera(win, 500);
  if (process.env.DIAG) {
    console.log('   [diag] chaves:', win.eval('JSON.stringify([...RESPOSTAS.keys()])'));
    console.log('   [diag] envelope lido?', win.eval("JSON.stringify(RESPOSTAS.get('plano-de-ensino'))"));
    console.log('   [diag] turmas:', win.eval('JSON.stringify((TURMAS_DA_ESCOLA||[]).map(t=>t.nome))'),
      '| ctx-turma:', win.eval("JSON.stringify(RESPOSTAS.get('contexto-turma'))"),
      '| turmaDoPlano:', win.eval('JSON.stringify((turmaDoPlano()||{}).id)'),
      '| conteudos:', win.eval('JSON.stringify(TURMA_CONTEUDOS)'),
      '| termos:', win.eval('(TERMOS_DA_ESCOLA||[]).length'));
  }
  const caixas = [...doc.querySelectorAll('input[type=checkbox][data-marco]')];
  const marcadas = caixas.filter((c) => c.checked);
  return {
    caixas: caixas.length,
    marcadas: marcadas.length,
    // O par (objetivo, termo) marcado — é o que o professor lê na matriz.
    pares: marcadas.map((c) => c.getAttribute('data-marco') + ':' + c.value).sort(),
    temLinhaDoTermo: caixas.some((c) => c.value === 'Battement jeté'),
    texto: String((doc.querySelector('.matriz-parametros') || doc.querySelector('.matriz-marco')
      || {}).textContent || '').replace(/\s+/g, ' ').slice(0, 220),
  };
}

(async () => {
  await new Promise((res) => servidor.listen(0, '127.0.0.1', res));
  PORTA = servidor.address().port;

  // ==========================================================================
  console.log('\nA. O WIDGET — com a resposta na mão, as caixas marcam?');

  {
    const { win, doc, problemas } = await abrir();
    conferir('a página do plano de ensino corre sem erro de script',
      problemas.length === 0, problemas.slice(0, 2));

    /* A RESPOSTA NA MÃO — é o cenário de quem ACABOU de marcar na própria página (a matriz
     * escreve em `RESPOSTAS`), e o de quem carregou o plano para editar. Se nem assim as caixas
     * marcarem, o defeito é o casamento entre o termo gravado e a opção do nível. */
    await win.eval(`RESPOSTAS.set('aula-1-parametro', ${JSON.stringify(PARAMETRO)});`);
    await win.eval(`RESPOSTAS.set('marcos-por-aula', ${JSON.stringify(MARCOS)});`);
    const comResposta = await medirOParametro(win, doc);
    conferir('com a matriz em `RESPOSTAS`, a linha do «Battement jeté» existe na matriz',
      comResposta.temLinhaDoTermo, comResposta.texto);
    conferir('…e as TRÊS colunas em que ele foi marcado aparecem marcadas',
      comResposta.pares.filter((p) => p.endsWith(':Battement jeté')).length === 3,
      comResposta.pares);
    conferir('…e o par (objetivo 1, termo) é um deles',
      comResposta.pares.indexOf('1:Battement jeté') !== -1, comResposta.pares);
    win.close();
  }

  // ==========================================================================
  console.log('\nB. O CAMINHO — chegar ao plano pelo endereço carrega o plano GRAVADO?');

  {
    const { win, doc } = await abrir();
    /* O ENDEREÇO é o que a Turma dá: `/plano-ensino/?professor=…&escola=…&ciclo=…`. Sem
     * `?ajustar=`, sem passar pela estante. É por aqui que ela entra — e é aqui que se mede o
     * que a página mostra sem ninguém carregar nada. */
    const semCaminho = await medirOParametro(win, doc);
    /* O PLANO TEM DE ESTAR ABERTO — e é isto que faltava: a página não pedia o envelope nenhum,
     * mostrava uma condução vazia. `PLANO_ABERTO` é o carimbo do plano que a página abriu, e é
     * ele que o preenchedor das escolas de teste consulta para não encher a fixture por cima. */
    conferir('…e a página regista que abriu o plano gravado (`PLANO_ABERTO`)',
      win.eval('PLANO_ABERTO') === CARIMBO, win.eval('PLANO_ABERTO'));
    /* O QUE SE ESPERA: o plano vigente da estante é carregado no formulário, com as marcas. O
     * que a página faz hoje é mostrar uma CONDUÇÃO VAZIA — as opções do nível à frente, e nada
     * marcado. É exactamente o sintoma que ela descreveu («aparece aqui, mas nenhum marcado»). */
    conferir('chegar ao plano pelo endereço traz o plano gravado, com as três marcas',
      semCaminho.pares.filter((p) => p.endsWith(':Battement jeté')).length === 3,
      semCaminho);

    /* E O OUTRO CAMINHO, que é o que a página oferece hoje: abrir o plano da estante (editar). */
    await win.eval(`editarPlano(${JSON.stringify(CARIMBO)})`);
    await espera(win, 700);
    const porEdicao = await medirOParametro(win, doc);
    conferir('pelo «editar» do plano da estante, as três marcas aparecem',
      porEdicao.pares.filter((p) => p.endsWith(':Battement jeté')).length === 3, porEdicao);
    win.close();
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o plano de ensino mostra, no parâmetro de medição, as '
      + 'marcas que estão gravadas no envelope, e o widget casa o termo do nível com o termo do '
      + 'plano nos três objetivos.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  servidor.close();
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('\nA PROVA REBENTOU:', erro && erro.stack ? erro.stack : erro);
  servidor.close();
  process.exit(1);
});
