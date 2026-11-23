#!/usr/bin/env node
'use strict';

/**
 * provar-painel.js — as escolas apagadas têm um destino (22/10/2026).
 *
 * O QUE FALTAVA. O expurgo grava um ELO em `escola/<slug>/indice.json` — quando, por quê, o
 * que saiu do repositório, o que ficou no KV. Versionado e correto, e **sem destino**: quem
 * quisesse ler o registo abria o JSON no GitHub. O painel dá-lhe página, e a lista dá-lhe
 * entrada no menu.
 *
 * O QUE ESTA PROVA TRAVA, e por que cada elo:
 *
 *   1. a LISTA mostra a escola apagada com as duas datas (criação e saída) e o link;
 *   2. a escola VIVA não aparece na lista — «apagada» é um facto, não um sinónimo de «existe»;
 *   3. o REGISTO abre com o motivo, os arquivos apagados e o que ficou no KV;
 *   4. um slug que não está na lista é 404, e não uma página de registo vazia;
 *   5. sem `GITHUB_TOKEN` o painel DIZ que não consegue ler — nunca uma lista vazia, que se
 *      leria como «nenhuma escola apagada»;
 *   6. o MENU tem a logomarca e NENHUM item — a navegação do painel vive nos botões da raiz;
 *   7. a DATA não passa por `Date` — o ISO do índice tem microssegundos, e um `Invalid Date`
 *      sairia na cara de quem lê.
 *
 * Tudo corre em processo, com a API do GitHub substituída: nenhuma requisição sai.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` carrega o `motor/` daquele commit — é assim que se mostra
 * que as asserções desta prova MORDEM, e não passam por acaso. A âncora é o commit imediatamente
 * anterior ao trabalho que se está a medir, e NUNCA `HEAD`: um controle ancorado em `HEAD` passa a
 * comparar a prova com ela mesma no dia em que o trabalho é cometido.
 *
 *   uso: node experimentos/provar-painel.js
 *        node experimentos/provar-painel.js --contra=c7b1ee0f
 */

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execSync } = require('node:child_process');

const RAIZ_DESTA_PROVA = path.resolve(__dirname, '..');
const CONTRA = (process.argv.find((x) => x.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let RAIZ_DO_MOTOR = RAIZ_DESTA_PROVA;
if (CONTRA) {
  RAIZ_DO_MOTOR = fs.mkdtempSync(path.join(os.tmpdir(), 'painel-'));
  /* O CATÁLOGO VAI JUNTO: `motor/nucleo/comercial.js` lê `biblioteca/comercial/planos.json`, e um
   * `motor` sem ele não carrega — o controle morreria a carregar, e um controle que não corre não
   * prova nada (foi o que aconteceu na primeira tentativa). */
  execSync('git archive ' + CONTRA + ' motor biblioteca modelo tools teste | tar -x -C ' + RAIZ_DO_MOTOR,
    { cwd: RAIZ_DESTA_PROVA, stdio: 'pipe' });
  console.log('CONTROLE NEGATIVO — o motor de ' + CONTRA + ', antes desta mudança\n');
}

const raiz = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/raiz.js'));
const painel = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/painel-html.js'));
const painelTabela = painel.tabelaDeProfessores;

const BASE = 'https://danca.tmenegaz77.workers.dev';
const AUTORIZACAO = 'Basic ' + Buffer.from('tmenegaz:segredo').toString('base64');

let falhas = 0;
const conferir = (nome, ok, detalhe) => {
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

const b64 = (obj) => Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj)).toString('base64');

/** O inventário de uma escola — o elo que o expurgo grava. */
function inventario({ slug, criado, expurgo }) {
  return {
    escola: slug.charAt(0).toUpperCase() + slug.slice(1),
    worker: slug,
    criado_em: criado,
    professor: { slug: 'sapo-bailarino', nome: 'Sapo Bailarino' },
    responsavel: 'Sapo Bailarino',
    ciclo: '01',
    estado: { habilitada: true },
    arquivos: [],
    expurgo: expurgo || [],
  };
}

const EXPURGO_DA_CALANGO = [{
  em: '2026-10-22T10:48:48.104Z',
  motivo: 'expurgada pela página «Sistema Lastro»',
  apagado: [
    'wrangler.calango.jsonc',
    'professores/oculos-redondo/ciclos/ciclo-01-calango.conf',
    'professores/oculos-redondo/ciclos/ciclo-01-calango.fipp',
  ],
  kv: { ok: true, apagadas: 3, restantes: 0, prefixos: ['calango/', 'bastidores/calango/'] },
}];

/**
 * A API do GitHub, de mentira. `arquivos` é o conteúdo por caminho — o que a árvore declara e
 * o que cada `contents/` devolve. Nada de rede.
 */
function githubFalso(arquivos) {
  const caminhos = Object.keys(arquivos);
  const chamadas = [];
  const f = async (url, init) => {
    const u = String(url);
    const metodo = (init && init.method) || 'GET';
    chamadas.push({ url: u, metodo });
    if (metodo === 'GET' && /\/git\/trees\//.test(u)) {
      return {
        ok: true, status: 200,
        json: async () => ({ sha: 'arvore-1', tree: caminhos.map((p) => ({ path: p, type: 'blob' })) }),
      };
    }
    if (metodo === 'GET' && /\/contents\//.test(u)) {
      const caminho = u.split('/contents/')[1].split('?')[0];
      if (!(caminho in arquivos)) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ content: b64(arquivos[caminho]) }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  return { fetch: f, chamadas };
}

const ARQUIVOS = {
  // O ÍNDICE VERSIONADO — a única leitura das listas. O acervo inteiro, já derivado.
  'indices/acervo.json': {
    versao: 3,
    escolas: [
      { slug: 'calango', nome: 'calango', professor: 'sapo-bailarino',
        professores: ['murisoca-baiana', 'oculos-redondo', 'sapo-bailarino'],
        criada_em: '2026-10-19T18:18:57.289485+00:00', expurgada_em: '2026-10-22T10:48:48.104Z',
        expurgada: true, expurgos: 4 },
      { slug: 'breu', nome: 'breu', professor: 'sapo-bailarino',
        professores: ['sapo-bailarino', 'vaso-bonito'],
        criada_em: '2026-10-19T23:41:57.342597+00:00', expurgada_em: '2026-10-21T21:06:01.896Z',
        expurgada: true, expurgos: 2 },
      { slug: 'viva', nome: 'viva', professor: 'tiago-menegaz',
        professores: ['tiago-menegaz', 'sapo-bailarino'],
        criada_em: '2026-10-20T10:00:00.000000+00:00', expurgada_em: null,
        expurgada: false, expurgos: 0 },
    ],
    // A LISTA DE PROFESSORES, derivada das escolas. `sapo-bailarino` está numa viva E em duas
    // apagadas — é o caso que a lista tem de atender. `so-apagadas` não tem nenhuma viva.
    professores: [
      { slug: 'sapo-bailarino', nome: 'Sapo Bailarino', escolas: ['calango', 'breu', 'viva'] },
      { slug: 'tiago-menegaz', nome: 'Tiago Menegaz', escolas: ['viva'] },
      { slug: 'so-apagadas', nome: null, escolas: ['calango'] },
    ],
  },
  'escola/calango/indice.json': inventario({
    slug: 'calango', criado: '2026-10-19T18:18:57.289485+00:00', expurgo: EXPURGO_DA_CALANGO,
  }),
  // A página da raiz, com o marcador — é o arquivo real do repositório.
  'index.html': require('fs').readFileSync(require('path').join(__dirname, '..', 'raiz', 'index.html'), 'utf8'),
};

/** O `ASSETS` do Worker: serve o que estiver em `ARQUIVOS`, e 404 no resto. */
function assetsFalso(arquivos) {
  const f = async (req) => {
    const u = new URL(typeof req === 'string' ? req : req.url);
    const caminho = u.pathname === '/' ? '/index.html' : u.pathname;
    const chave = caminho.replace(/^\//, '');
    if (!(chave in arquivos)) return { ok: false, status: 404, headers: new Map(), text: async () => '' };
    const corpo = String(arquivos[chave]);
    return {
      ok: true,
      status: 200,
      headers: { get: (k) => (/content-type/i.test(k) ? 'text/html' : null) },
      text: async () => corpo,
    };
  };
  return { fetch: f };
}

const ambiente = (extra) => Object.assign({
  SENHA_RAIZ: 'segredo',
  GITHUB_TOKEN: 'tok',
}, extra || {});

async function pedir(env, caminho) {
  return raiz.fetch(new Request(BASE + caminho, { headers: { Authorization: AUTORIZACAO } }), env);
}

/** Corre `fn` com a rede do GitHub substituída e o ASSETS de mentira. */
async function semRede(fn) {
  const original = globalThis.fetch;
  const { fetch, chamadas } = githubFalso(ARQUIVOS);
  globalThis.fetch = fetch;
  try {
    return await fn(chamadas);
  } finally { globalThis.fetch = original; }
}

const envComAssets = (extra) => ambiente(Object.assign({ ASSETS: assetsFalso(ARQUIVOS) }, extra || {}));

async function principais() {
  // ── 1. a página `/` é o painel: o bloco informativo, sem lista ─────────────
  const home = await semRede(async () => {
    const r = await pedir(envComAssets(), '/');
    return { status: r.status, html: await r.text() };
  });
  conferir('a raiz responde 200', home.status === 200, home.status);
  conferir('tem o capítulo «Escolas do sistema»', /<h2 id="escolas-do-sistema">Escolas do sistema<\/h2>/.test(home.html), null);
  conferir('…e o marcador foi substituído', !/id="escolas-do-sistema"><\/div>/.test(home.html), null);
  conferir('explica as duas regras',
    /uma escola tem os seus professores/.test(home.html)
      && /um professor pode estar em mais de uma escola/.test(home.html), null);
  conferir('a tabela-explicação tem as TRÊS listas',
    ['/escolas-vivas', '/escolas-apagadas', '/professores'].every((h) => home.html.indexOf('"' + h + '"') !== -1), null);
  conferir('NÃO tem mais a lista dinâmica de escolas', !/<tbody><tr><td><a href="https:\/\//.test(home.html), null);
  conferir('NÃO tem mais os botões dentro do bloco',
    !/<h2 id="escolas-do-sistema">[\s\S]{0,2000}<a class="acao secundario" href="\/escolas-vivas">Ver só as vivas<\/a>/.test(home.html), null);

  // ── 2. `/` NÃO lê o repositório — o bloco é estático ───────────────────────
  const custo = await semRede(async (chamadas) => {
    await pedir(envComAssets(), '/');
    return chamadas.filter((c) => /api\.github\.com/.test(c.url)).length;
  });
  conferir('a página `/` faz ZERO requisições ao GitHub', custo === 0, custo);

  // …e abre mesmo sem index: o que a página que cria escolas precisa.
  const semIndice = await semRede(async () => {
    const original = ARQUIVOS['indices/acervo.json'];
    delete ARQUIVOS['indices/acervo.json'];
    try {
      const r = await pedir(envComAssets(), '/');
      return { status: r.status, html: await r.text() };
    } finally { ARQUIVOS['indices/acervo.json'] = original; }
  });
  conferir('`/` abre mesmo sem o índice existir', semIndice.status === 200, semIndice.status);
  conferir('…e continua a explicar as listas', /Escolas do sistema/.test(semIndice.html), null);

  /* ── 3. AS DUAS COLUNAS CONGELADAS ─────────────────────────────────────────
   *
   * ESTAS ASSERÇÕES JÁ FORAM REESCRITAS POR MIM A 19/11/2026 — e a reescrita estava errada. Eu
   * tirei o `.rail rail-esq` do painel da raiz e passei as acções para a `.acoes-da-lista`, com o
   * argumento de que «o rail existe para o índice ter onde grudar». A pesquisadora: «por que é que
   * você tirou os botões do lado esquerdo fixo onde estavam. Eu não pedi para fazer isso. […]
   * Tem que rever isso e botar de volta no mesmo lugar: fixos empilhados do lado esquerdo.»
   *
   * O que era uma preferência minha passou a ser uma asserção minha — e uma asserção a favor de
   * uma mudança que ninguém pediu é a pior espécie: tranca a mudança e apaga o rasto de que ela foi
   * indevida. A prova volta a exigir o rail, e passa a exigir TAMBÉM a coluna presa (o
   * `position: sticky`), que é a metade que se perde sem ninguém notar. */
  const railEsq = (/<div class="rail rail-esq">([\s\S]*?)<div class="rail rail-dir"/.exec(home.html) || [])[1] || '';
  const destinos = (railEsq.match(/class="acao[^"]*"/g) || []).length;
  conferir('a coluna das ações existe', /<div class="rail rail-esq">/.test(home.html), null);
  conferir('…com os oito destinos empilhados', destinos === 8, destinos);
  conferir('…incluindo «Professores»', /href="\/professores"[^>]*>Professores</.test(railEsq), null);
  conferir('…e os dois botões de sempre', /id="btn-apagar"/.test(home.html) && /id="btn-criar"/.test(home.html), null);
  /* A COLUNA É PRESA E EMPILHADA — «fixos empilhados do lado esquerdo», que é a frase dela. Sem
   * esta asserção, alguém (eu) volta a trocar a coluna por um bloco no topo e a bancada continua
   * verde. */
  conferir('…e a coluna é EMPILHADA e PRESA (sticky), e não um bloco no topo',
    /\.rail\.rail-esq \{[\s\S]{0,160}?position: sticky/.test(home.html)
      && /\.rail-esq \{[\s\S]{0,120}?flex-direction: column/.test(home.html), null);
  /* O RAIL DO ÍNDICE LEVA `data-dono` desde 25/11/2026 — a marca que o retira da página pública.
   * A asserção exigia `>` logo a seguir à classe e por isso reprovava sobre a marca, não sobre o
   * rail. O que se mede é a coluna, e não a ausência de atributos. (Falhava já no `HEAD`.) */
  conferir('a coluna do índice existe', /<div class="rail rail-dir"[\s>]/.test(home.html), null);
  conferir('…e o índice foi montado', /<nav class="toc-local"/.test(home.html), null);
  conferir('…com o título «Nesta página»', /toc-titulo">Nesta página</.test(home.html), null);
  conferir('…e leva aos capítulos da apresentação', /href="#o-que-é-o-sistema-lastro"/.test(home.html), null);
  conferir('…e TAMBÉM a «Escolas do sistema»', /href="#escolas-do-sistema"/.test(home.html), null);
  conferir('…com os passos aninhados', /<ul><li><a href="#passo-1-anamnese-do-aluno"/.test(home.html), null);
  conferir('os h2 dos MODAIS ficam fora do índice',
    !/href="#modal-titulo"/.test(home.html) && !/href="#apagar-titulo"/.test(home.html), null);
  conferir('NÃO há botão nem link «/painel»', !/href="\/painel"/.test(home.html), null);

  // ── 4. a lista das VIVAS ───────────────────────────────────────────────────
  const vivas = await semRede(async (chamadas) => {
    const r = await pedir(envComAssets(), '/escolas-vivas');
    return { status: r.status, html: await r.text(), chamadas };
  });
  conferir('«Escolas vivas» responde 200', vivas.status === 200, vivas.status);
  const custoVivas = vivas.chamadas.filter((c) => /api\.github\.com/.test(c.url)).length;
  conferir('…com UMA requisição', custoVivas === 1, custoVivas);
  /* O ENDEREÇO É O DA ESCOLA, E NÃO O `workers.dev` (14/11/2026). Era o técnico, e aparecia aqui
   * e no cartão de apagar. O que se mostra é `<escola>.padd.com.br` — o que o sistema criou. */
  conferir('…com o nome ligado ao site da escola, no domínio próprio',
    /href="https:\/\/viva\.padd\.com\.br\/"><strong>viva<\/strong>/.test(vivas.html), null);
  conferir('…e NENHUM `workers.dev` na página', !/workers\.dev/.test(vivas.html), null);
  /* AS COLUNAS DAS VIVAS CRESCERAM A 25/11/2026 — plano, habilitação e acesso entraram na mesma
   * linha, e a asserção ficou a exigir «Escola · Professor · Criada · Estado» em sequência. O que
   * ela mede agora é a ORDEM que interessa: a escola, quem a dá, quando nasceu, e o que se faz
   * com ela. (Falhava já no `HEAD`.) */
  conferir('…com as colunas na ordem pedida',
    /<th>Escola<\/th>[\s\S]{0,200}?Professor[\s\S]{0,200}?<th>Criada<\/th>/.test(vivas.html)
      && /<th>Plano<\/th>/.test(vivas.html) && /<th>Acesso<\/th>/.test(vivas.html)
      && /<th>Estado<\/th>/.test(vivas.html), null);
  conferir('…e a coluna «Professor» ordena (é ligação)',
    /<th aria-sort="none"><a href="\/escolas-vivas\?ordem=professor"/.test(vivas.html), null);
  conferir('…mostrando o NOME do professor, não o slug',
    /<td>Tiago Menegaz<\/td>/.test(vivas.html), null);
  conferir('…e sem as apagadas', !/Abrir o registo/.test(vivas.html), null);
  conferir('…e com «Voltar ao painel»', /Voltar ao painel/.test(vivas.html), null);

  // ── 5. a lista das APAGADAS, com os professores ────────────────────────────
  const apagadas = await semRede(async () => {
    const r = await pedir(envComAssets(), '/escolas-apagadas');
    return { status: r.status, html: await r.text() };
  });
  conferir('«Escolas apagadas» responde 200', apagadas.status === 200, apagadas.status);
  conferir('…com as duas apagadas', /calango/.test(apagadas.html) && /breu/.test(apagadas.html), null);
  conferir('…e sem a viva', !/href="\/escolas-apagadas\/viva"/.test(apagadas.html), null);
  conferir('…com a coluna «Professores»', /(<a[^>]*>)?Professores(<\/a>)?<\/th>/.test(apagadas.html), null);
  conferir('…e TODOS os professores que o elo prova',
    /murisoca-baiana, oculos-redondo, Sapo Bailarino/.test(apagadas.html), null);
  // O NOME QUANDO SE SABE, O SLUG QUANDO NÃO. `sapo-bailarino` tem nome no índice;
  // `murisoca-baiana` e `oculos-redondo` não têm nenhum registado no repositório — e a célula diz
  // o que se sabe, em vez de inventar um nome.
  conferir('…traduzindo para o nome quem o índice conhece',
    /murisoca-baiana, oculos-redondo, Sapo Bailarino/.test(apagadas.html), null);
  conferir('…com os professores em TEXTO, não ligação de site',
    !/href="https:\/\/sapo-bailarino\.tmenegaz77\.workers\.dev/.test(apagadas.html), null);
  conferir('…e com a data da saída', /22\/10\/2026/.test(apagadas.html), null);
  conferir('…e com «Voltar ao painel»', /Voltar ao painel/.test(apagadas.html), null);

  // ── 6. a lista dos PROFESSORES ─────────────────────────────────────────────
  const profs = await semRede(async (chamadas) => {
    const r = await pedir(envComAssets(), '/professores');
    return { status: r.status, html: await r.text(), chamadas };
  });
  conferir('«Professores» responde 200', profs.status === 200, profs.status);
  const custoProfs = profs.chamadas.filter((c) => /api\.github\.com/.test(c.url)).length;
  conferir('…com UMA requisição', custoProfs === 1, custoProfs);
  conferir('…com o nome do professor', /Sapo Bailarino/.test(profs.html), null);
  conferir('…e a pasta', /<code>sapo-bailarino<\/code>/.test(profs.html), null);
  conferir('…mostrando a escola VIVA dele, no domínio próprio',
    /href="https:\/\/viva\.padd\.com\.br\/">viva</.test(profs.html), null);
  conferir('…e NÃO as apagadas dele',
    !/href="https:\/\/calango\.padd\.com\.br/.test(profs.html)
      && !/href="https:\/\/breu\.padd\.com\.br/.test(profs.html), null);
  conferir('quem não tem escola viva aparece, com o selo',
    /class="selo discreto">sem escola viva</.test(profs.html), null);
  conferir('o professor sem nome registado mostra o slug',
    /<code>so-apagadas<\/code>/.test(profs.html), null);
  conferir('…e «Voltar ao painel»', /Voltar ao painel/.test(profs.html), null);

  // ── 6a. A COLUNA «AÇÕES» (23/11/2026) ─────────────────────────────────────
  //
  // PALAVRAS DELA: «Aqui chama escolas vivas, a gente vai chamar aqui de ações. […] onde está
  // escrito sem escola viva, que é só uma etiqueta, vai virar um botão de ação. Sem escola viva é
  // uma etiqueta, mas se tiver escola viva, aí o botão leva até a escola viva. Aí o botão vai ser o
  // nome da escola.»
  //
  // A REGRA QUE A LISTA TEM DE ATENDER: um professor, mais de uma escola. O caso está montado com
  // o `sapo-bailarino` em duas vivas — e agora são DUAS AÇÕES, não uma vírgula entre dois links.
  const muitas = painelTabelaDeProfessoresComDuasVivas();
  conferir('um professor com DUAS escolas vivas sai com uma AÇÃO por escola',
    /<div class="acoes-da-linha"><a class="acao secundario" href="https:\/\/viva\.padd\.com\.br\/">viva<\/a><a class="acao secundario" href="https:\/\/outra\.padd\.com\.br\/">outra<\/a><\/div>/.test(muitas),
    muitas);
  conferir('…e o rótulo de cada botão é o NOME da escola, e não o slug',
    painelTabelaDeProfessores([
      { slug: 'sapo-bailarino', nome: 'Sapo Bailarino', escolas: ['viva'] },
    ], [{ slug: 'viva', nome: 'Escola Viva', expurgada: false }]).indexOf('>Escola Viva</a>') !== -1,
    null);
  /* O `title` DIZ QUEM É O RESPONSÁVEL — o dado que ela pediu («se eles são professores
   * titulares donos da escola»), e que só aparece onde é verdade: na escola onde `e.professor`
   * é esta pessoa. */
  const responsavel = painelTabelaDeProfessores([
    { slug: 'dona', nome: 'Dona', escolas: ['viva'] },
    { slug: 'outra-pessoa', nome: 'Outra', escolas: ['viva'] },
  ], [{ slug: 'viva', nome: 'Escola Viva', professor: 'dona', expurgada: false }]);
  conferir('…e o tooltip marca a escola de que ele é RESPONSÁVEL',
    /title="Escola Viva — professor responsável por esta escola"/.test(responsavel)
    && /Escola Viva/.test(responsavel), responsavel.slice(0, 400));
  /* O OUTRO LADO DA FRASE DELA: sem escola não há gesto nenhum a fazer, e o que fica é a
   * etiqueta — não um botão para nenhum sítio. */
  conferir('quem NÃO tem escola viva fica com a ETIQUETA, e não com um botão',
    /<td><span class="selo discreto">sem escola viva<\/span><\/td>/.test(profs.html)
    && !/<td><div class="acoes-da-linha"><\/div><\/td>/.test(profs.html), null);

  // ── 6b. O CADASTRO NA LISTA: DOCUMENTO E CONTACTO (23/11/2026) ─────────────
  //
  // «aqui tem que ter também os campos de contato, que é o telefone, o e-mail e o CNPJ do
  // professor. […] O CNPJ ou CPF que o professor tenha, né, também vai estar lá. Professor pode ter
  // CNPJ ou CPF, tá? Não necessariamente só CPF.»
  {
    /* O DOCUMENTO É LIDO PELO COMPRIMENTO, e o rótulo sai do número: catorze dígitos são um CNPJ,
     * onze são um CPF — mesmo que o campo onde ele está se chame `cpf`. É este o caso que faz a
     * regra dela ser verdadeira, e não uma frase na documentação. */
    const comCpf = painelTabelaDeProfessores(
      [{ slug: 'ana', nome: 'Ana', escolas: [] }], [],
      null, { ana: { cpf: '23323824024', email: 'ana@exemplo.com', telefone: '54991752662' } });
    conferir('o CPF do professor sai escrito como se lê, e rotulado «CPF»',
      /<td>CPF 233\.238\.240-24<\/td>/.test(comCpf), comCpf.slice(0, 900));

    const comCnpj = painelTabelaDeProfessores(
      [{ slug: 'escola-de-danca', nome: 'Escola De Dança', escolas: [] }], [],
      null, { 'escola-de-danca': { cnpj: '37455854000172' } });
    conferir('um professor com CNPJ sai rotulado «CNPJ», no formato dele',
      /<td>CNPJ 37\.455\.854\/0001-72<\/td>/.test(comCnpj), comCnpj.slice(0, 900));
    conferir('…e com o CNPJ presente, um `cpf` de 14 dígitos NÃO é lido como CPF',
      /<td>CNPJ /.test(painelTabelaDeProfessores(
        [{ slug: 'x', nome: 'X', escolas: [] }], [],
        null, { x: { cpf: '37455854000172' } })), null);

    conferir('o e-mail e o telefone saem com as duas formas de falar (`mailto:` e `wa.me`)',
      /<a href="mailto:ana@exemplo\.com">ana@exemplo\.com<\/a><br><a href="https:\/\/wa\.me\/5554991752662"/.test(comCpf),
      null);

    const semFicha = painelTabelaDeProfessores([{ slug: 'zeca', nome: 'Zeca', escolas: [] }], []);
    conferir('sem ficha, o documento e o contacto são um TRAÇO — e não um vazio',
      (semFicha.match(/<td>—<\/td>/g) || []).length === 2, semFicha.slice(0, 900));

    conferir('…e o NOME vem da ficha quando o índice não o guarda',
      /<td><strong>Nome Da Ficha<\/strong><\/td>/.test(painelTabelaDeProfessores(
        [{ slug: 'zeca', nome: null, escolas: [] }], [],
        null, { zeca: { nomeCompleto: 'Nome Da Ficha' } })), null);
  }

  // ── 6b. A COLUNA «NOME» E AS ORDENAÇÕES (22/10/2026) ──────────────────────
  //
  // O que se pediu: «preciso de uma coluna anterior que é o nome do professor. Eu preciso saber o
  // nome real. E preciso de uma ordenação na coluna escolas vivas, e uma ordenação por professor
  // nas escolas apagadas e nas vivas.»
  {
    const h = profs.html;
    conferir('a PRIMEIRA coluna é «Nome», e não a pasta',
      /<thead><tr><th aria-sort="ascending">Nome<\/th>/.test(h), /<thead>.{0,160}/.exec(h) && /<thead>.{0,160}/.exec(h)[0]);
    conferir('…e a pasta vem depois, como identificador',
      /<th>Pasta<\/th>/.test(h), null);
    conferir('…com o nome em destaque e a pasta em código',
      /<td><strong>Tiago Menegaz<\/strong><\/td><td><code>tiago-menegaz<\/code><\/td>/.test(h), null);
    conferir('quem não tem nome registado mostra o SELO, e não o slug fingido de nome',
      /<span class="selo discreto" title="o repositório não guarda o nome/.test(h), null);
    conferir('…e a coluna «Ações» ordena pelas escolas — a célula é o gesto, a ordem é o facto',
      /<th aria-sort="none"><a href="\/professores\?ordem=escolas" title="Ordenar pelas escolas"/.test(h), null);

    // A ORDEM POR ESCOLAS agrupa quem partilha escola — é o que se pediu («ordenar pelas mesmas
    // escolas»). A tabela é exercitada DIRECTAMENTE, com dados em que as duas ordens DÃO
    // RESULTADOS DIFERENTES: com dados em que dão o mesmo, a prova passaria sem provar nada.
    const nomeNaOrdem = primeirasCelulas(painelTabelaDeProfessores([
      { slug: 'zeca', nome: null, escolas: [] },
      { slug: 'ana', nome: 'Ana', escolas: ['viva'] },
      { slug: 'bruno', nome: 'Bruno', escolas: ['outra'] },
    ], [{ slug: 'viva', expurgada: false }, { slug: 'outra', expurgada: false }], 'nome'));
    conferir('por NOME: a ordem é alfabética, e quem não tem nome vai pelo SLUG',
      JSON.stringify(nomeNaOrdem) === JSON.stringify(['Ana', 'Bruno', '']), nomeNaOrdem);

    const porEscolas = primeirasCelulas(painelTabelaDeProfessores([
      { slug: 'zeca', nome: null, escolas: [] },
      { slug: 'ana', nome: 'Ana', escolas: ['viva'] },
      { slug: 'bruno', nome: 'Bruno', escolas: ['outra'] },
    ], [{ slug: 'viva', expurgada: false }, { slug: 'outra', expurgada: false }], 'escolas'));
    // A ORDEM É PELA CADEIA DE ESCOLAS: `outra` < `viva`, e quem não tem nenhuma vem primeiro
    // (a cadeia vazia é a menor de todas). É o que agrupa os professores da mesma escola.
    conferir('por ESCOLAS VIVAS: quem não tem escola vem primeiro, e os outros agrupam-se',
      JSON.stringify(porEscolas) === JSON.stringify(['', 'Bruno', 'Ana']), porEscolas);

    const porProfessor = primeirasCelulas(painelTabelaDeEscolas([
      { slug: 'tarde', professor: 'zeca', criada_em: '2026-10-20T10:00:00Z', expurgada: true, expurgada_em: '2026-10-21T10:00:00Z' },
      { slug: 'cedo', professor: 'ana', criada_em: '2026-10-10T10:00:00Z', expurgada: true, expurgada_em: '2026-10-22T10:00:00Z' },
    ], 'apagadas', 'professor', [{ slug: 'zeca', nome: 'Zeca' }, { slug: 'ana', nome: 'Ana' }]));
    // `Ana` < `Zeca`: por nome, a escola da Ana (`cedo`) vem primeiro — e por DATA também, porque
    // `cedo` saiu mais recentemente. Para a prova distinguir as duas ordens, o nome tem de
    // contrariar a data: por isso o `zeca` (saída 21/10) é a «tarde» e a `ana` (saída 22/10) é a
    // «cedo» — se a ordenação fosse a da data, daria o mesmo; então a segunda conferência usa
    // nomes TROCADOS.
    const porProfessorTrocado = primeirasCelulas(painelTabelaDeEscolas([
      { slug: 'tarde', professor: 'ana', criada_em: '2026-10-20T10:00:00Z', expurgada: true, expurgada_em: '2026-10-21T10:00:00Z' },
      { slug: 'cedo', professor: 'zeca', criada_em: '2026-10-10T10:00:00Z', expurgada: true, expurgada_em: '2026-10-22T10:00:00Z' },
    ], 'apagadas', 'professor', [{ slug: 'zeca', nome: 'Zeca' }, { slug: 'ana', nome: 'Ana' }]));
    conferir('nas apagadas, por PROFESSOR, a ordem é a do nome e CONTRARIA a da data',
      JSON.stringify(porProfessorTrocado) === JSON.stringify(['tarde', 'cedo']), porProfessorTrocado);
    conferir('…e o mesmo par, sem ordem pedida, sai na ordem da data (a mais recente primeiro)',
      JSON.stringify(porProfessor) === JSON.stringify(['cedo', 'tarde']), porProfessor);

    const porData = primeirasCelulas(painelTabelaDeEscolas([
      { slug: 'tarde', professor: 'zeca', criada_em: '2026-10-20T10:00:00Z', expurgada: true, expurgada_em: '2026-10-21T10:00:00Z' },
      { slug: 'cedo', professor: 'ana', criada_em: '2026-10-10T10:00:00Z', expurgada: true, expurgada_em: '2026-10-22T10:00:00Z' },
    ], 'apagadas', null, []));
    conferir('…e sem ordem pedida, a lista continua a ser a da data de saída (a mais recente primeiro)',
      JSON.stringify(porData) === JSON.stringify(['cedo', 'tarde']), porData);

    // O HTTP: os cabeçalhos dizem a ordem em vigor, e a ordem repetida não é clique.
    const porEscolasHttp = await semRede(async () => (await pedir(envComAssets(), '/professores?ordem=escolas')).text());
    conferir('o cabeçalho passa a dizer que a ordem EM VIGOR é a das escolas',
      /<th aria-sort="ascending">Ações<\/th>/.test(porEscolasHttp), null);
    conferir('…e «Nome» volta a ser ligação (a ordem repetida não se clica)',
      /<th aria-sort="none"><a href="\/professores\?ordem=nome" title="Ordenar por nome">Nome<\/a><\/th>/.test(porEscolasHttp), null);

    const apagadasPorProfessor = await semRede(async () => (await pedir(envComAssets(), '/escolas-apagadas?ordem=professor')).text());
    const vivasPorProfessor = await semRede(async () => (await pedir(envComAssets(), '/escolas-vivas?ordem=professor')).text());
    conferir('as apagadas dizem que ordenam por professor',
      /<th aria-sort="ascending">Professores<\/th>/.test(apagadasPorProfessor), null);
    conferir('as vivas dizem que ordenam por professor',
      /<th aria-sort="ascending">Professor<\/th>/.test(vivasPorProfessor), null);
    conferir('uma ordem desconhecida cai na padrão, e não dá 400',
      (await semRede(async () => (await pedir(envComAssets(), '/professores?ordem=xpto')).status)) === 200, null);
  }

  // ── 7. o registo abre com UMA leitura ──────────────────────────────────────
  const registro = await semRede(async (chamadas) => {
    const r = await pedir(envComAssets(), '/escolas-apagadas/calango');
    return { status: r.status, html: await r.text(), chamadas };
  });
  conferir('o registo responde 200', registro.status === 200, registro.status);
  const doRegisto = registro.chamadas.filter((c) => /api\.github\.com/.test(c.url)).map((c) => c.url);
  conferir('o registo faz UMA requisição', doRegisto.length === 1, doRegisto.length);
  conferir('…e é a do elo da escola', /escola\/calango\/indice\.json/.test(doRegisto[0] || ''), doRegisto[0]);
  conferir('mostra o MOTIVO declarado', /expurgada pela página/.test(registro.html), null);
  conferir('lista os arquivos que saíram', /ciclo-01-calango\.conf/.test(registro.html), null);
  conferir('diz o que ficou no KV', /3 chave\(s\) apagada/.test(registro.html), null);

  // ── 8. os dois expurgos acumulam ──────────────────────────────────────────
  const doisElos = painelPaginaDoisElos();
  conferir('dois elos dão dois blocos', (doisElos.match(/Expurgo de/g) || []).length === 2,
    (doisElos.match(/Expurgo de/g) || []).length);

  // ── 9. escola sem elo → 404, e com UMA leitura ─────────────────────────────
  const inexistente = await semRede(async (chamadas) => {
    const r = await pedir(envComAssets(), '/escolas-apagadas/nunca-existiu');
    return { status: r.status, chamadas };
  });
  conferir('escola sem elo responde 404', inexistente.status === 404, inexistente.status);
  conferir('…e não reconstrói o acervo',
    inexistente.chamadas.filter((c) => /acervo\.json/.test(c.url)).length === 0, null);

  // ── 10. as rotas antigas continuam a responder ─────────────────────────────
  for (const [de, para] of [['/painel', '/'], ['/painel/escolas-apagadas', '/escolas-apagadas'],
    ['/painel/escolas-apagadas/calango', '/escolas-apagadas/calango']]) {
    const r = await pedir(envComAssets(), de);
    conferir('301 de ' + de, r.status === 301 && r.headers.get('Location') === para,
      { status: r.status, location: r.headers.get('Location') });
  }

  /* ── 10b. A FICHA DA PESSOA CHEGA PELA ROTA (23/11/2026) ─────────────────────
   *
   * A tabela já foi medida com um mapa de fichas; aqui mede-se a PORTA — que a rota as vai buscar
   * ao KV, por slug, e que o dado mostrado é o que lá está. Uma tabela que sabe mostrar e uma rota
   * que não entrega dariam uma coluna de traços, e a prova da tabela passaria.
   *
   * O KV é de bolso: nada toca no sistema ao vivo. */
  {
    const kv = new Map([
      ['professores/sapo-bailarino/contato', JSON.stringify({
        nomeCompleto: 'Sapo Bailarino', cpf: '23323824024',
        email: 'sapo@exemplo.com', telefone: '54991752662',
      })],
    ]);
    const kvDeBolso = {
      async get(c) { return kv.has(c) ? kv.get(c) : null; },
      async put(c, v) { kv.set(c, String(v)); },
      async delete(c) { kv.delete(c); },
      async list({ prefix = '' } = {}) {
        return { keys: [...kv.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) };
      },
    };
    const comKv = await semRede(async () => (await pedir(
      envComAssets({ PADD_KV: kvDeBolso }), '/professores')).text());
    conferir('a rota vai buscar a ficha ao KV e a página mostra o CPF e o contacto',
      /<td>CPF 233\.238\.240-24<\/td>/.test(comKv)
      && /mailto:sapo@exemplo\.com/.test(comKv), comKv.slice(0, 1200));
    conferir('…e o professor que NÃO tem ficha fica com o traço, sem inventar',
      (comKv.match(/<td>—<\/td>/g) || []).length >= 2, null);

    /* E O CUSTO: um `get` por professor, e ZERO `list`. A enumeração é a operação limitada por
     * dia (18/10/2026); esta página não é razão para a gastar. */
    const conta = { gets: 0, lists: 0 };
    const contado = {
      async get(c) { conta.gets += 1; return kv.has(c) ? kv.get(c) : null; },
      async put(c, v) { kv.set(c, String(v)); },
      async delete(c) { kv.delete(c); },
      async list(o) { conta.lists += 1; return kvDeBolso.list(o); },
    };
    await semRede(async () => { await (await pedir(envComAssets({ PADD_KV: contado }), '/professores')).text(); });
    const quantos = (ARQUIVOS['indices/acervo.json'].professores || []).length;
    conferir('…e cada abertura custa UM `get` por professor, e nenhuma enumeração',
      conta.gets === quantos && conta.lists === 0, { gets: conta.gets, professos: quantos, lists: conta.lists });
  }

  // ── 11. o slug não vira caminho arbitrário ─────────────────────────────────
  const travessia = await semRede(async (chamadas) => {
    await pedir(envComAssets(), '/escolas-apagadas/..%2F..%2Fetc');
    return chamadas.filter((c) => /escola\/\.\./.test(c.url)).length;
  });
  conferir('slug com travessia não lê arquivo nenhum', travessia === 0, travessia);

  // ── 12. sem token: diz, não finge ──────────────────────────────────────────
  for (const rota of ['/escolas-apagadas', '/escolas-vivas', '/professores']) {
    const r = await pedir(envComAssets({ GITHUB_TOKEN: '' }), rota);
    const html = await r.text();
    conferir('sem GITHUB_TOKEN, ' + rota + ' responde 500', r.status === 500, r.status);
    conferir('…diz o que falta', /GITHUB_TOKEN/.test(html), null);
    conferir('…e NÃO diz «Nenhuma»', !/Nenhuma escola/.test(html) && !/Nenhum professor/.test(html), null);
  }

  // ── 13. o menu: SÓ a logomarca (14/11/2026) ───────────────────────────────
  //
  // Aqui esteve «…e «Escolas apagadas»». O item SAIU da barra por decisão da pesquisadora: *«na
  // página que ele me leva está escrito no topo escolas apagadas como um botão. Tira isso daí.
  // Isso não vai existir mais em nenhum lugar.»* A navegação do painel é a coluna esquerda da
  // página `danca` — um dono só, e não dois a descrever a mesma lista de destinos.
  const menu = apagadas.html;
  conferir('o menu tem a logomarca', /class="marca" href="\/"/.test(menu), null);
  /* A BARRA, e não a página inteira: o `<body>` traz `data-tela="escolas-apagadas"`, e é ele que
   * fazia uma leitura ingénua do HTML dizer que o item ainda lá estava. */
  const barra = (/<nav[\s\S]*?<\/nav>/.exec(menu) || [''])[0];
  conferir('…e «Escolas apagadas» NÃO está na barra',
    barra.length > 0 && !/escolas-apagadas/.test(barra), null);
  conferir('…e não há gaveta vazia: sem hamburguer quando não há itens',
    !/class="hamburger"/.test(menu), null);
  conferir('SEM «Sistema Lastro» no menu', !/<a href="\/index.html">Sistema Lastro<\/a>/.test(menu), null);
  conferir('SEM «Área do Professor»', !/Área do Professor/.test(menu), null);
  conferir('SEM «Bastidores»', !/Bastidores/.test(menu), null);
  conferir('SEM menu que abre e fecha', !/<details class="menu">/.test(menu), null);

  // ── 14. a data é legível, e a hora é a de quem lê ─────────────────────────
  /* AS TRÊS ASSERÇÕES DESTA SECÇÃO NÃO COMPARAVAM NADA (16/11/2026): passavam o valor esperado
   * como TERCEIRO argumento, e o `conferir` só olha para o segundo — um texto é sempre verdadeiro,
   * e as três imprimiam «ok» sobre o que quer que a função devolvesse. Agora comparam. E a
   * expectativa mudou de propósito: `10:48Z` são 07:48 em Passo Fundo, e escrever «10:48» era o
   * defeito que ela viu — o `Z` do ISO tratado como se não existisse. Ver `nucleo/fuso.js`. */
  conferir('microssegundos no ISO não viram NaN',
    painel.dia('2026-10-19T18:18:57.289485+00:00') === '19/10/2026',
    painel.dia('2026-10-19T18:18:57.289485+00:00'));
  conferir('ISO sem data devolve null, não «NaN/NaN/NaN»', painel.dia('nada') === null, painel.dia('nada'));
  conferir('a hora é a de quem lê, e não o corte do ISO',
    painel.quando('2026-10-22T10:48:48.104Z') === '22/10/2026 às 07:48',
    painel.quando('2026-10-22T10:48:48.104Z'));
}

/** As primeiras células de cada linha de uma tabela — o que se lê na coluna que decide a ordem. */
function primeirasCelulas(html) {
  return [...String(html).matchAll(/<tr><td>(?:<strong>)?([^<]*)/g)]
    .map((m) => m[1].trim())
    .filter((x, i) => i >= 0);
}

/** A tabela de professores, exercitada directamente (a rota só muda de onde vêm `ordem` e
 * `contatos`). As fichas chegam como um mapa `slug → contato`, que é o que a rota monta do KV. */
function painelTabelaDeProfessores(professores, escolas, ordem, contatos) {
  return painel.tabelaDeProfessores(professores, escolas, ordem, contatos);
}

/** A tabela de escolas, idem. */
function painelTabelaDeEscolas(escolas, modo, ordem, professores) {
  return painel.tabelaDeEscolas(escolas, modo, ordem, professores);
}

/** A tabela de professores com um professor em DUAS escolas vivas — a regra do produto. */
function painelTabelaDeProfessoresComDuasVivas() {
  return painelTabela([
    { slug: 'sapo-bailarino', nome: 'Sapo Bailarino', escolas: ['viva', 'outra', 'apagada'] },
  ], [
    { slug: 'viva', expurgada: false },
    { slug: 'outra', expurgada: false },
    { slug: 'apagada', expurgada: true },
  ]);
}

/** A página de registo com dois elos — a `breu`, que foi apagada duas vezes. */
function painelPaginaDoisElos() {
  const elo = (em, motivo) => ({ em, motivo, apagado: ['x'], kv: null });
  return painel.paginaDoRegistro({
    slug: 'breu',
    indice: { escola: 'breu', criado_em: '2026-10-19T23:41:57Z', professor: { nome: 'X' },
      expurgo: [elo('2026-10-21T18:00:00Z', 'primeira'), elo('2026-10-21T21:06:01Z', 'segunda')] },
  });
}

principais().then(() => {
  console.log('');
  if (falhas) {
    console.log(falhas + ' asserção(ões) falharam');
    process.exit(1);
  }
  console.log('TUDO CERTO — o registo do expurgo tem destino, e o painel não tem segundo dono da navegação');
}).catch((e) => {
  console.error('EXPLODIU:', e && e.stack ? e.stack : e);
  process.exit(1);
});
