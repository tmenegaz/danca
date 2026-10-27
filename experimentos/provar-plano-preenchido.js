'use strict';

/**
 * provar-plano-preenchido.js — o link «plano de ensino» abre o PLANO DE ENSINO preenchido.
 *
 * O DEFEITO QUE ISTO MEDE, relatado pela pesquisadora em produção:
 *
 *   «a solução que você fez para imprimir, para mostrar o plano de ensino preenchido […] vem
 *    com vários campos preenchidos, mas o objetivo por bloco por aula tá vazio. […] Esse aqui
 *    você chamou de plano do ciclo, né? E a gente tem que colocar o nome certo ali, que é o
 *    plano de ensino. […] O plano do ciclo, ele só nasce depois que eu faço o plano de
 *    observação. […] é só o que tá preenchido, o nome dos campos, todos eles listados, com
 *    seus títulos, tudo certinho, bonitinho, mas marcado ali o que foi escolhido.»
 *
 * Eram TRÊS defeitos num só documento, e a prova mede os três separadamente:
 *
 *   1. o NOME — a folha dizia «Plano do Ciclo 01 — batata», que é o título da fonte do ciclo;
 *   2. a SECÇÃO VAZIA — o texto era a derivação do ciclo, que deixa `<!-- CALENDARIO -->` e
 *      `<!-- OBJETIVOS -->` para o gerador resolver, e a folha os apagava; «Objetivos por
 *      bloco e por aula» ficava com o título e nada debaixo;
 *   3. o CONTEÚDO — é o formulário com as respostas, campo por campo, com o título de cada um;
 *      não a derivação, que renomeia, junta e comenta.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): o `motor/servidor/rotas.js` de antes — derivado do
 * commit que introduziu `fichaDoPlano`, menos um —, instalado na cache do `require` ANTES de
 * carregar o servidor. Espera-se que reprove o nome, a secção vazia e a contagem de campos.
 * O ref NÃO se fixa em `HEAD` (a lição de 26/10): depois do commit, `HEAD` é o código novo.
 *
 *   node experimentos/provar-plano-preenchido.js [--controle-negativo]
 *   REF_NEGATIVO=<sha> node experimentos/provar-plano-preenchido.js --controle-negativo
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const negativo = process.argv.indexOf('--controle-negativo') !== -1;

const ESCOLA = 'batata';
const ARQUIVO_ROTAS = 'motor/servidor/rotas.js';

/* O CONTROLE: o estado de ANTES, e DOIS módulos — não um.
 *
 * A primeira versão trocava só o `rotas.js`, e a asserção do NOME passava no controle porque o
 * título vem de `ficha-html.js` (`paginaDoPlano`), que continuava a ser o do worktree. Um
 * controle que mede metade do que mudou é a mesma armadilha de 26/10 noutra roupa: verde por
 * medir o objeto errado. Os dois arquivos entram, do MESMO ref, instalados na cache do
 * `require` ANTES de o servidor carregar.
 *
 * O ref não se fixa em `HEAD` (depois do commit, `HEAD` é o código novo): deriva-se do commit
 * que introduziu o marcador, menos um. Sem referência, a prova diz NÃO FEITO e sai com 2. */
if (negativo) {
  const ARQUIVO_FOLHA = 'motor/nucleo/ficha-html.js';
  const em = (ref, arquivo) => {
    try {
      return execFileSync('git', ['show', ref + ':' + arquivo], { cwd: raiz, encoding: 'utf8' });
    } catch (e) { return null; }
  };
  let ref = process.env.REF_NEGATIVO || '';
  if (!ref) {
    const noHead = em('HEAD', ARQUIVO_ROTAS);
    if (noHead !== null && noHead.indexOf('fichaDoPlano') === -1) ref = 'HEAD';
    else {
      let sha = '';
      try {
        sha = execFileSync('git', ['log', '-1', '--format=%H', '-SfichaDoPlano', '--', ARQUIVO_ROTAS],
          { cwd: raiz, encoding: 'utf8' }).trim();
      } catch (e) { sha = ''; }
      ref = sha ? sha + '~1' : '';
    }
  }
  const Module = require('module');
  const instalar = (arquivo) => {
    const texto = ref ? em(ref, arquivo) : null;
    if (texto === null) return false;
    const alvo = path.join(raiz, arquivo);
    const modulo = new Module(alvo, null);
    modulo.filename = alvo;
    modulo.paths = Module._nodeModulePaths(path.dirname(alvo));
    modulo._compile(texto, alvo);
    require.cache[alvo] = modulo;
    return true;
  };
  const rotasOk = instalar(ARQUIVO_ROTAS);
  const folhaOk = instalar(ARQUIVO_FOLHA);
  if (!rotasOk || !folhaOk) {
    console.error('provar-plano-preenchido: controle sem referência (' + (ref || 'nenhuma')
      + ') — NÃO FEITO.');
    process.exit(2);
  }
  console.log('  (controle sobre ' + ref + ' — rotas e folha)');
}

const producao = require(path.join(raiz, 'motor/servidor/producao.js'));
const CONTEUDO = JSON.parse(fs.readFileSync(
  path.join(raiz, 'porta/plano/conteudo/plano.json'), 'utf8'));

const TURMAS = [
  { id: 'bale-nivel-1-teste-2', nome: 'Balé Nível 1 — Teste 2', ativo: true, frequencia: 2,
    dias: ['seg', 'qua'], duracaoMin: 50, periodoInicio: '2027-02-01', periodoFim: '2027-04-30',
    programaReferencia: 'RAD', nivelReferencia: 'Grade 1',
    rubrica: ['Excelente', 'Bom', 'Em construção'] },
  { id: 'bale-nivel-2-teste-2', nome: 'Balé Nível 2 — Teste 2', ativo: true, frequencia: 2,
    dias: ['seg', 'qua'], duracaoMin: 90, periodoInicio: '2027-02-01', periodoFim: '2027-04-30',
    programaReferencia: 'RAD', nivelReferencia: 'Grade 2',
    rubrica: ['Excelente', 'Bom', 'Em construção'] },
];

/* AS RESPOSTAS DE UM PLANO COMPLETO — o mesmo vocabulário do formulário. É um plano do acervo
 * de teste (o fixture da escola de teste), não um plano inventado para a prova: o que se mede
 * é o que o formulário grava, não a forma que convém ao teste. */
const { fixtureDaEscola } = require('../motor/servidor/teste-fixtures.js');
const RESPOSTAS = (() => {
  const base = fixtureDaEscola('batata').plano[0];
  const respostas = {};
  const por = (id, valor) => { respostas[id] = { valor: valor, origem: 'declarado' }; };
  por('contexto-escola', ESCOLA);
  por('contexto-professor', 'perna-boa');
  por('contexto-turma', base.turma);
  for (const [k, v] of Object.entries(base.respostas || {})) por(k, v);
  /* O QUE O FIXTURE NÃO TRAZ e o formulário grava — as duas respostas que a etapa 2 introduziu,
   * e que sem isto sairiam em lacuna (e a prova não veria a secção preenchida). */
  if (!respostas['aula-de-cada-objetivo']) {
    por('aula-de-cada-objetivo', [{ objetivo: 1, aulas: ['1'] }, { objetivo: 2, aulas: ['2'] },
      { objetivo: 3, aulas: ['3', '4'] }]);
  }
  return respostas;
})();

function kv(inicial) {
  const m = new Map(Object.entries(inicial || {}));
  return {
    m,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, String(v)); },
    async delete(k) { m.delete(k); },
    async list(p) {
      return { keys: [...m.keys()].filter((k) => !p || k.startsWith(p)).map((name) => ({ name })),
        list_complete: true };
    },
  };
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.json': 'application/json' };

function assets(dir) {
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      let p = path.join(dir, url.pathname);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(p), { status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream' } });
    },
  };
}

const ID_DO_PLANO = 'plano-20261027-1200';

function envDaBancada() {
  return {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'Perna Boa',
    SENHA_PROFESSOR: 'p', SENHA_ADMIN: 'd',
    PADD_KV: kv({
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify(TURMAS),
      ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([
        { nome: 'Perna Boa', slug: 'perna-boa', senha: 'p' }]),
      ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([
        { id: 'c1', professor: 'perna-boa', turmas: [TURMAS[0].nome] }]),
      /* O ENVELOPE VIVE SOB O PREFIXO DA ESCOLA, e o índice é quem o anuncia. Sem o índice, a
       * rota responde «plano não encontrado» sobre um registo que existe. */
      [ESCOLA + '/envelope/' + ID_DO_PLANO + '.json']: JSON.stringify({
        id: ID_DO_PLANO,
        contexto: { escola: ESCOLA, professor: 'perna-boa', ciclo: '01' },
        geradoEm: '2026-10-27T12:00:00-0300',
        respostas: RESPOSTAS,
      }),
      [ESCOLA + '/envelope/.indice.json']: JSON.stringify({
        versao: 3, incompleto: false, nomes: [ID_DO_PLANO + '.json'], resumos: {},
      }),
    }),
    ASSETS: assets(path.join(raiz, 'publicacao', ESCOLA)),
  };
}

/* --------------------------------------------------------------- as asserções */

let total = 0;
let falhas = 0;
function provar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) {
    console.log('  ok     ' + descricao);
    return;
  }
  falhas += 1;
  console.log('  FALHOU ' + descricao + (detalhe === undefined ? ''
    : '  → ' + JSON.stringify(detalhe).slice(0, 400)));
}

const semTags = (html) => String(html)
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

(async () => {
  const env = envDaBancada();
  const r = await producao.fetch(new Request(
    'https://' + ESCOLA + '.tmenegaz77.workers.dev/plano-ensino/api/plano-preenchido.'
    + ID_DO_PLANO + '?formato=html'), env);
  const html = await r.text();

  console.log('\n1. O documento responde, e é uma folha');
  provar('responde 200', r.status === 200, r.status);
  provar('é HTML', /text\/html/.test(r.headers.get('content-type') || ''),
    r.headers.get('content-type'));
  const texto = semTags(html);
  provar('não despeja JSON', texto.indexOf('"respostas"') === -1 && texto.length > 2000,
    texto.length);

  console.log('\n2. O NOME é «Plano de ensino» — e não «Plano do Ciclo»');
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  provar('o <h1> diz «Plano de ensino»', /plano de ensino/i.test(semTags(h1)), semTags(h1));
  provar('o documento NÃO se chama «Plano do Ciclo»', !/plano do ciclo/i.test(texto),
    (texto.match(/plano do ciclo[^.]{0,60}/i) || [])[0]);
  provar('o <title> também', !/plano do ciclo/i.test((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''));

  console.log('\n3. É o FORMULÁRIO PREENCHIDO — todos os campos, com os seus títulos');
  const campos = [];
  const juntar = (lista) => { for (const c of lista || []) campos.push(c); };
  juntar((CONTEUDO.cabecalho || {}).campos);
  for (const b of CONTEUDO.blocos || []) juntar(b.campos);
  provar('o conteúdo declara 26 campos', campos.length === 26, campos.length);
  const ausentes = campos.filter((c) => texto.indexOf(c.campo) === -1).map((c) => c.campo);
  provar('todos os títulos aparecem no documento', ausentes.length === 0, ausentes);

  console.log('\n4. A secção que estava VAZIA tem conteúdo');
  /* «Objetivos por bloco e por aula» vinha do marcador `<!-- OBJETIVOS -->`, que a folha
   * apagava. O que a substitui é a leitura por objetivo, com o que foi marcado em cada um. */
  provar('não há marcador do gerador à vista',
    texto.indexOf('<!--') === -1 && !/CALENDARIO|OBJETIVOS/.test(texto));
  provar('os objetivos específicos estão escritos',
    texto.indexOf('reconhecer o apoio e alinhar o eixo vertical') !== -1);
  provar('e o que se mede em cada objetivo também',
    texto.indexOf('Plié, Battement tendu') !== -1);
  const blocosVazios = (() => {
    const secoes = semTags(html).split(/\s(?=\d{1,2}\.\s[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/);
    return secoes.filter((s) => s.trim().split(' ').length < 4);
  })();
  provar('nenhuma secção sai só com o título', blocosVazios.length === 0,
    blocosVazios.slice(0, 2));

  console.log('\n5. O que vem da TURMA aparece — não é lacuna sobre um dado declarado');
  provar('a frequência vem do cadastro', texto.indexOf('2x semanal') !== -1);
  provar('a duração também, e em português', /50 minutos/.test(texto), texto.match(/50 \w+/));
  provar('o calendário também', texto.indexOf('2027-02-01') !== -1);
  provar('a régua da rubrica também', texto.indexOf('Em construção') !== -1);

  console.log('\n6. O que não foi respondido fica DECLARADO, e não inventado');
  provar('a lacuna é dita com a marca do projeto', texto.indexOf('[a decidir]') !== -1);
  provar('o documento diz quantos campos ficaram em lacuna',
    /em lacuna/.test(texto) || /nenhum em lacuna/.test(texto),
    (texto.match(/\d+ campos? preenchidos?[^.]*\./) || [])[0]);

  console.log('\n7. A folha continua a ser uma folha');
  /* A HIERARQUIA É A DA FOLHA: o `<h1>` é o da página, e o markdown entra UM DEGRAU ABAIXO
   * (`corpoDaFicha` → `paraHtml(markdown, 2)`). Por isso as secções do documento saem em
   * `<h2>` e os campos em `<h3>` — e é isso que se confere, e não a marca do markdown. */
  /* A HIERARQUIA NÃO SALTA UM DEGRAU: o `<h1>` é o da página, as secções são `<h2>`, e o
   * campo é texto em negrito — não um título. Antes desta correção as secções saíam `<h3>`,
   * logo abaixo de um `<h1>`. */
  const niveis = { h1: (html.match(/<h1/g) || []).length, h2: (html.match(/<h2/g) || []).length,
    h3: (html.match(/<h3/g) || []).length };
  provar('tem um <h1>, secções em <h2> e NENHUM nível saltado',
    niveis.h1 === 1 && niveis.h2 > 0 && niveis.h3 === 0, niveis);
  provar('os campos são texto em negrito, não títulos',
    (html.match(/<p><strong>/g) || []).length >= 20,
    (html.match(/<p><strong>/g) || []).length);
  provar('não tem estilo inline no corpo do documento',
    (html.match(/<p[^>]*style=/g) || []).length === 0);

  console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ') + total + ' asserção(ões), '
    + falhas + ' falha(s).' + (negativo ? ' (controle negativo: espera-se reprovar)' : ''));
  process.exit(falhas ? 1 : 0);
})();
