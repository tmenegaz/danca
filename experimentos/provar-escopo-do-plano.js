#!/usr/bin/env node
'use strict';

/**
 * provar-escopo-do-plano.js — de onde vêm os «parâmetros de medição» do plano de ensino.
 *
 * O QUE ELA VIU (07/11/2026, escola `batata`), no §9 do Plano de Ensino — «Parâmetro de medição»:
 *
 *   «a listagem de exercícios disponíveis exibe itens que não pertencem ao escopo desta escola
 *   […] aparecem selecionáveis os itens `batmatondi` e `batma fondi`, sendo que o usuário criou e
 *   cadastrou apenas `plié` e `batma gt`.»
 *
 * OS QUATRO NOMES DA TELA, lidos do KV da escola (não supostos):
 *
 *   `bastidores/batata/turma-conteudos` = {"sala-rosa":["battement-fondu","battement-tendu","plie"]}
 *   `bastidores/batata/curadorias`      = [{ turmas:["sala rosa"], repertorio:["Battement jeté","Plié"] }]
 *
 *   «batmatondi» = **Battement tendu**, «batma fondi» = **Battement fondu** — os dois que ela não
 *   declarou. Não vinham de outra escola, nem de um índice mal aplicado: vinham do MAPA ANTIGO
 *   (`turma-conteudos`), o registo do regime em que o conteúdo da turma se gravava no passo 3 da
 *   turma, e que ficou com três ids de uma rodada de testes anterior. A composição somava-o ao
 *   que a curadoria declara — soma que era a decisão de 03/11/2026 («nenhuma escola perde, por
 *   uma decisão de Novembro, o que associou em Outubro»), e que produzia, aqui, uma lista maior do
 *   que o professor declarou.
 *
 * A REGRA NOVA. A partir do momento em que existe uma curadoria VIGENTE para a turma, é ela que
 * diz o que a turma aprende; o mapa antigo é memória, e a memória não fala por cima de quem
 * declarou. Ele continua a ser a fonte das turmas que nunca tiveram curadoria — as escolas de
 * Outubro continuam a funcionar sem migração — e continua a ser devolvido em `doLegado`.
 *
 * AS TRÊS SECÇÕES, e porque é que a terceira existe:
 *
 *   A. o NÚCLEO (a composição), com os quatro casos: declarou · não declarou · declarou vazio ·
 *      declarou e a memória tinha o MESMO termo;
 *   B. a ROTA (`/api/bastidores/turma-conteudos`) sobre um KV com os valores reais da `batata`;
 *   C. a PÁGINA — o `porta/index.html` servido, num navegador, a resolver o nó
 *      `aula-1-parametro` com os payloads das duas rotas. É a única secção que mede o que ela
 *      viu: as linhas da matriz de parâmetros. Sem ela, «a lista encolheu» poderia ser verdade no
 *      núcleo e mentira na tela.
 *
 * A bancada é LOCAL: um `http.createServer` em porta efémera serve `porta/index.html` e as
 * respostas das rotas, que são obtidas do SERVIDOR DE VERDADE (`bastidores.fetch`) sobre um KV
 * falso com os valores reais. **Nada aqui toca no ar.**
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   uso: node experimentos/provar-escopo-do-plano.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const conteudos = require(path.join(RAIZ, 'motor/nucleo/conteudos.js'));
/* O MAPA DO PLANO — o `/api/mapa?fonte=plano` que a página pede ao abrir. Serve-se o do núcleo
 * (`porta.mapa`) porque a bancada não tem o roteador do servidor: sem ele a página morre em
 * «MAPA.nos is not iterable», e um erro de stub não pode ser lido como erro da página. */
const portaMotor = require(path.join(RAIZ, 'motor/nucleo/porta.js'));

let total = 0;
let falhas = 0;
function conferir(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + rotulo); return; }
  falhas += 1;
  console.log('  ✗ ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* ==========================================================================================
 * OS DADOS REAIS DA `batata`, copiados do KV a 07/11/2026 — não inventados.
 *
 * A FIXTURE FICA COMO ESTAVA, mesmo depois de o resíduo ter sido APAGADO do KV (07/11/2026,
 * 21:10 — ver a nota no REGISTRO). Ela não descreve o estado de hoje: descreve o CASO que a
 * regra existe para resolver, e é ele que tem de continuar a ser medido. Uma fixture «actualizada»
 * para o mapa antigo vazio aprovaria qualquer implementação — inclusive a que soma tudo —, porque
 * sem resíduo não há o que distinguir.
 * ========================================================================================== */
const LEGADO = { 'sala-rosa': ['battement-fondu', 'battement-tendu', 'plie'] };
const CURADORIA = {
  id: 'dedao-aberto-bale-classico-sala-rosa',
  professor: 'dedao-aberto', modalidade: 'Balé clássico', tradicao: 'RAD',
  nivel: '1', nivelReferencia: 'Grade 1',
  turmas: ['sala rosa'], linhaDeBase: 'tami', linhaDeBaseNome: 'tami',
  repertorio: ['Battement jeté', 'Plié'],
  alunas: ['Aluna A'],
};
const TURMA = {
  id: 'sala-rosa', nome: 'sala rosa', ordem: -1, frequencia: 2, dias: ['seg', 'qua'],
  horarios: { seg: '17:30', qua: '17:30' }, duracaoMin: 50,
  periodoInicio: '2027-02-01', periodoFim: '2027-02-02', ativo: true,
};

/** O que ela DECLAROU, em ids — a lista que tem de chegar à tela. */
const DECLARADOS = ['battement-jete', 'plie'];
/** O RESÍDUO, em ids — o que não pode chegar à tela. */
const RESIDUO = ['battement-tendu', 'battement-fondu'];

function criarKv(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) { dados.set(c, String(v)); },
    async delete(c) { dados.delete(c); },
    async list({ prefix = '' } = {}) {
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })),
        list_complete: true,
      };
    },
  };
}

function ambiente(kv) {
  return {
    ESCOLA_SLUG: 'batata', ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: 'senha-da-direcao', SENHA_PROFESSOR: 'senha-do-professor',
    PADD_KV: kv,
  };
}

/** O KV com os valores reais da escola. */
function kvDaBatata(extra = {}) {
  return criarKv(Object.assign({
    'bastidores/batata/turma-conteudos': JSON.stringify(LEGADO),
    'bastidores/batata/curadorias': JSON.stringify([CURADORIA]),
    'bastidores/batata/turmas': JSON.stringify([TURMA]),
  }, extra));
}

async function pedir(env, caminho) {
  const r = await bastidores.fetch(new Request('https://e.workers.dev' + caminho), env);
  let corpo = null;
  try { corpo = await r.json(); } catch { corpo = null; }
  return { status: r.status, corpo };
}

/* ==========================================================================================
 * A. O NÚCLEO
 * ========================================================================================== */
function aComposicao() {
  console.log('\nA. O NÚCLEO — quem manda na lista de uma turma');

  const declarou = conteudos.conteudosDaTurma(TURMA, { legado: LEGADO, curadorias: [CURADORIA] });
  conferir('a turma que DECLAROU aprende exactamente o que declarou',
    declarou.ids.join('|') === DECLARADOS.join('|'), declarou.ids);
  conferir('…e o resíduo do mapa antigo não entra na lista',
    RESIDUO.every((x) => declarou.ids.indexOf(x) === -1), declarou.ids);
  /* O QUE LÁ ESTAVA NÃO SE FINGE QUE NÃO EXISTIU: `doLegado` continua a dizê-lo. É a diferença
   * entre «não há memória» e «a memória não manda» — e é o que permite a quem lê explicar. */
  conferir('…mas o mapa antigo continua a ser REPORTADO (memória não é mentira)',
    declarou.doLegado.join('|') === 'battement-fondu|battement-tendu|plie', declarou.doLegado);
  conferir('…e a função diz que houve declaração', declarou.declarada === true, declarou.declarada);

  /* O CASO QUE PROTEGE AS ESCOLAS DE OUTUBRO: uma turma sem curadoria nenhuma continua a viver do
   * mapa antigo. Sem esta asserção, «a memória não manda» poderia ser «a memória desapareceu», e
   * as escolas que associavam conteúdos antes de 03/11 perdiam-nos em silêncio. */
  const semCuradoria = conteudos.conteudosDaTurma(TURMA, { legado: LEGADO, curadorias: [] });
  conferir('contraprova: sem curadoria nenhuma, o mapa antigo continua a valer',
    semCuradoria.ids.join('|') === 'battement-fondu|battement-tendu|plie', semCuradoria.ids);
  conferir('…e `declarada` é falso — não houve quem declarasse', semCuradoria.declarada === false,
    semCuradoria.declarada);

  /* A DECLARAÇÃO VAZIA TAMBÉM MANDA. Sem isto, esvaziar o «Conteúdo do Estilo» faria os termos
   * antigos voltarem sozinhos — o mesmo defeito ao contrário, e igualmente invisível. */
  const vazia = conteudos.conteudosDaTurma(TURMA,
    { legado: LEGADO, curadorias: [Object.assign({}, CURADORIA, { repertorio: [] })] });
  conferir('a curadoria que declarou NADA não deixa a memória voltar',
    vazia.ids.length === 0 && vazia.declarada === true, vazia);

  /* A SUBSTITUÍDA CONTINUA A NÃO SOMAR — a regra de 03/11 que esta não revoga. */
  const substituida = conteudos.conteudosDaTurma(
    { id: 't1', nome: 'Turma 1' },
    {
      legado: {},
      curadorias: [
        { id: 'velha', turmas: ['Turma 1'], repertorio: ['Plie', 'Fantasma'], substituidaPor: 'nova' },
        { id: 'nova', turmas: ['Turma 1'], repertorio: ['Plie'] },
      ],
    });
  conferir('a curadoria SUBSTITUÍDA continua a não somar (a regra de 03/11 fica de pé)',
    substituida.ids.join('|') === 'plie', substituida.ids);

  const mapa = conteudos.mapaDeConteudos({ legado: LEGADO, curadorias: [CURADORIA], turmas: [TURMA] });
  conferir('o MAPA composto da escola também só tem o que foi declarado',
    JSON.stringify(mapa['sala-rosa'] || []) === JSON.stringify(DECLARADOS), mapa);

  const mapaSem = conteudos.mapaDeConteudos({ legado: LEGADO, curadorias: [], turmas: [TURMA] });
  conferir('contraprova: o mapa sem curadoria mantém o antigo',
    (mapaSem['sala-rosa'] || []).length === 3, mapaSem);

  const mapaVazio = conteudos.mapaDeConteudos({
    legado: LEGADO, turmas: [TURMA],
    curadorias: [Object.assign({}, CURADORIA, { repertorio: [] })],
  });
  conferir('…e o mapa da declaração vazia não ressuscita o antigo',
    mapaVazio['sala-rosa'] === undefined, mapaVazio);
}

/* ==========================================================================================
 * B. A ROTA — o mesmo, pelo caminho que a página pede
 * ========================================================================================== */
async function aRota() {
  console.log('\nB. A ROTA — o que o plano de ensino pede');
  const env = ambiente(kvDaBatata());

  const rel = await pedir(env, '/api/bastidores/turma-conteudos');
  conferir('a rota responde', rel.status === 200 && rel.corpo && rel.corpo.ok, rel.status);
  const daSala = (rel.corpo.relacoes && rel.corpo.relacoes['sala-rosa']) || [];
  conferir('a relação da sala traz só o que foi declarado',
    JSON.stringify(daSala) === JSON.stringify(DECLARADOS), daSala);

  const termos = await pedir(env, '/api/bastidores/termos');
  conferir('o vocabulário continua inteiro — o dicionário não é o problema',
    termos.corpo.ok && termos.corpo.termos.length > 90, termos.corpo && termos.corpo.termos.length);
  /* E O TERMO RESÍDUO CONTINUA A EXISTIR NO DICIONÁRIO: não se apaga vocabulário para limpar uma
   * lista. A correção é de ESCOPO, e o dicionário é o dicionário. */
  conferir('…e «Battement fondu» continua no vocabulário (não se apaga o dicionário)',
    termos.corpo.termos.some((t) => t.termo === 'Battement fondu'), null);

  // A mesma rota com uma escola que nunca teve curadoria: a memória manda, e o plano não fica vazio.
  const envAntigo = ambiente(kvDaBatata({ 'bastidores/batata/curadorias': '[]' }));
  const relAntigo = await pedir(envAntigo, '/api/bastidores/turma-conteudos');
  conferir('contraprova na rota: sem curadoria, a relação antiga é servida (escolas de Outubro)',
    ((relAntigo.corpo.relacoes && relAntigo.corpo.relacoes['sala-rosa']) || []).length === 3,
    relAntigo.corpo.relacoes);
}

/* ==========================================================================================
 * C. A PÁGINA — o nó «Parâmetro de medição», resolvido pelo próprio `porta/index.html`
 * ========================================================================================== */
async function aPagina() {
  console.log('\nC. A PÁGINA — as linhas da matriz de parâmetros');

  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-escopo-do-plano: Chrome/Chromium não encontrado — secção C NÃO FEITA.');
    falhas += 1; total += 1;
    return;
  }
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-cli');
  let puppeteer;
  try {
    puppeteer = require(path.join(execSync('npm root -g').toString().trim(),
      '@marp-team/marp-cli', 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-escopo-do-plano: puppeteer-core não encontrado — secção C NÃO FEITA.');
    falhas += 1; total += 1;
    return;
  }
  void MARP;

  /* A PORTA SAI DA LISTA QUANDO NÃO TEM CONTEXTO — e a bancada não tem contexto de escola
   * nenhuma (não há `?abrir=`, não há curadoria, não há sessão). A página faz o que deve:
   * `location.replace(LISTA_DA_FONTE[...])`. Aqui essa saída é neutralizada, e só ela: o que se
   * mede são as funções que resolvem o nó, e elas não dependem do formulário estar aberto.
   * Neutralizar a SAÍDA não é neutralizar o que se prova — e sem isto a bancada mediria a página
   * da lista de outra fonte, que é outra coisa. */
  const porta = fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8')
    .replace('window.location.replace(alvo);',
      '/* bancada: a saída para a lista está neutralizada — ver a nota em provar-escopo-do-plano */');

  /** Os payloads das três rotas, obtidos do servidor de verdade sobre o KV da batata. */
  async function servico(curadorias) {
    const env = ambiente(kvDaBatata({ 'bastidores/batata/curadorias': JSON.stringify(curadorias) }));
    return {
      turmas: await pedir(env, '/api/bastidores/turmas'),
      relacoes: await pedir(env, '/api/bastidores/turma-conteudos'),
      termos: await pedir(env, '/api/bastidores/termos'),
    };
  }

  async function abrir(payloads) {
    const srv = http.createServer((req, res) => {
      const caminho = decodeURIComponent(req.url).split('?')[0];
      const ok = (tipo, corpo) => {
        res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
        res.end(corpo);
      };
      const j = (o) => ok('application/json; charset=utf-8', JSON.stringify(o));
      if (caminho.endsWith('/assets/style.css')) {
        return ok('text/css; charset=utf-8', fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')));
      }
      if (caminho.endsWith('/assets/markdown.js')) {
        return ok('text/javascript', fs.readFileSync(path.join(RAIZ, 'porta/assets/markdown.js')));
      }
      if (caminho.endsWith('/assets/nav.js')) {
        return ok('text/javascript', fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
      }
      if (caminho.indexOf('/api/bastidores/professores') !== -1) {
        return j({ ok: true, professores: [{ slug: 'dedao-aberto', nome: 'Dedão Aberto' }] });
      }
      if (caminho.indexOf('/api/bastidores/alunas') !== -1) {
        return j({ ok: true, alunas: [{ apelido: 'Aluna A' }] });
      }
      if (caminho.endsWith('/api/mapa')) {
        return j(portaMotor.mapa(require(path.join(RAIZ, 'porta/plano/conteudo/plano.json'))));
      }
      if (caminho === '/api/bastidores/turmas') return j(payloads.turmas.corpo);
      if (caminho === '/api/bastidores/turma-conteudos') return j(payloads.relacoes.corpo);
      if (caminho === '/api/bastidores/termos') return j(payloads.termos.corpo);
      if (caminho.indexOf('/api/') !== -1) return j({ ok: true });
      return ok('text/html; charset=utf-8', porta);
    });
    await new Promise((pronto) => srv.listen(0, '127.0.0.1', pronto));
    const base = 'http://127.0.0.1:' + srv.address().port;
    const browser = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const erros = [];
    page.on('pageerror', (e) => erros.push(e.message));
    /* `domcontentloaded`, e não `networkidle0`: a página sonda o estado da geração em
     * intervalos, e a rede nunca fica ociosa — a espera certa é a do MAPA, não a do silêncio. */
    await page.goto(base + '/plano-de-ensino/?fonte=plano&escola=batata&professor=dedao-aberto&ciclo=01',
      { waitUntil: 'load' });
    await page.waitForFunction(() => typeof MAPA !== 'undefined' && MAPA && Array.isArray(MAPA.nos),
      { timeout: 20000 });
    // A PÁGINA PEDE AS TRÊS ROTAS POR SI — é o `carregarTurmasDaEscola`, e é ele que enche os
    // globais que a resolução do nó lê. Chamá-lo aqui é fazer o que a página faz ao abrir o §9.
    await page.evaluate(() => carregarTurmasDaEscola());
    return { srv, browser, page, erros };
  }

  /** As linhas de parâmetro que a matriz desenharia — pelo código DA PÁGINA, não por uma cópia. */
  const linhas = (page) => page.evaluate(() => {
    RESPOSTAS.set('marcos-por-aula', ['Alinhar o corpo', 'Ganhar força']);
    RESPOSTAS.set('contexto-turma', 'sala rosa');
    const no = {
      id: 'aula-1-parametro', campo: 'Parâmetro de medição',
      porMarco: { de: 'marcos-por-aula', opcoesDaTurma: true, disposicao: 'parametros' },
    };
    const r = linhasEOpcoesDoNo(no);
    return { opcoes: r.opcoes || [], orfaos: (r.orfaos || []).map((o) => o.id), erro: r.erro || null };
  });

  // ---- com a declaração (o caso dela) ----
  const comDeclaracao = await abrir(await servico([CURADORIA]));
  try {
    const vista = await linhas(comDeclaracao.page);
    conferir('a matriz de parâmetros abre (sem aviso de falta de turma)',
      vista.erro === null, vista.erro);
    conferir('os parâmetros são EXACTAMENTE os que ela declarou',
      JSON.stringify(vista.opcoes.slice().sort()) === JSON.stringify(['Battement jeté', 'Plié']),
      vista.opcoes);
    conferir('«Battement tendu» não aparece', vista.opcoes.indexOf('Battement tendu') === -1, vista.opcoes);
    conferir('«Battement fondu» não aparece', vista.opcoes.indexOf('Battement fondu') === -1, vista.opcoes);
    conferir('…e não há órfãos: os dois que ficaram resolvem no vocabulário',
      vista.orfaos.length === 0, vista.orfaos);
    conferir('a página não deu um erro de JavaScript', comDeclaracao.erros.length === 0, comDeclaracao.erros);

    /* O HTML da matriz — para medir o que se VÊ, e não só o que a resolução devolve. */
    const html = await comDeclaracao.page.evaluate(() => {
      const no = {
        id: 'aula-1-parametro',
        porMarco: { de: 'marcos-por-aula', opcoesDaTurma: true, disposicao: 'parametros' },
      };
      return porParametrosDoNo(no).html;
    });
    const nomes = [...html.matchAll(/<th scope="row">([^<]+)<\/th>/g)].map((m) => m[1]);
    conferir('a tabela desenhada tem duas linhas de parâmetro', nomes.length === 2, nomes);
    conferir('…e são «Battement jeté» e «Plié» — nada mais',
      JSON.stringify(nomes.slice().sort()) === JSON.stringify(['Battement jeté', 'Plié']), nomes);
  } finally {
    await comDeclaracao.browser.close();
    comDeclaracao.srv.close();
  }

  // ---- sem declaração: a memória manda (escolas de Outubro) ----
  const semDeclaracao = await abrir(await servico([]));
  try {
    const vista = await linhas(semDeclaracao.page);
    conferir('contraprova na página: sem curadoria, a matriz mostra o conteúdo antigo',
      vista.opcoes.length === 3 && vista.opcoes.indexOf('Battement fondu') !== -1, vista.opcoes);
  } finally {
    await semDeclaracao.browser.close();
    semDeclaracao.srv.close();
  }
}

(async () => {
  aComposicao();
  await aRota();
  await aPagina();
  console.log('\n' + (falhas === 0 ? 'PASSOU' : 'FALHOU') + ' — ' + (total - falhas) + ' de ' + total + ' asserções');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('erro na prova:', e.message);
  console.error(e.stack);
  process.exit(1);
});
