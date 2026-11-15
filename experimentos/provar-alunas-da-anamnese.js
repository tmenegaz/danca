'use strict';

/**
 * provar-alunas-da-anamnese.js — DE QUEM É A LISTA DE ALUNAS NA ANAMNESE (23/10/2026).
 *
 * O QUE ACONTECEU. Em produção, a escola `batata` tem três alunas (A, B, C) e três professores,
 * e cada professor tem **uma** curadoria com **uma** aluna. A dona do produto viu, na anamnese:
 *
 *     Café no Bulé  → Aluna A e Aluna B
 *     Manga Curta   → Aluna A
 *     Meia Cortada  → Aluna A e Aluna C
 *
 * A «Aluna A» aparecia em todos — e não devia, porque ela está curada ao Manga Curta e a mais
 * ninguém. Os dados de produção dizem: café-no-bule → `["Aluna B"]`, manga-curta → `["Aluna A"]`,
 * meia-cortada → `["Aluna C"]`.
 *
 * A REGRA (B2b, 13/10/2026) é: o seletor de alunas da anamnese **filtra pelas alunas que a
 * curadoria atribuiu** ao professor; sem curadoria nenhuma, mostra a lista inteira (é a porta
 * de entrada). A regra estava certa; o filtro é que era contornável.
 *
 * O DEFEITO. `carregarAlunas()` filtra e, DEPOIS de filtrar, re-acrescenta o valor que o
 * `select` já tinha (`atual`) e o `?aluna=` da URL:
 *
 *     const escolhida = atual || daUrl;
 *     if (escolhida && lista.indexOf(escolhida) === -1) lista = lista.concat([escolhida]);
 *
 * O comentário diz por que isto existe — «Se o apelido não estiver na lista (aluna ainda não
 * cadastrada na Produção), ele entra assim mesmo: foi o sistema que o mandou, e descartá-lo é o
 * defeito». O caso legítimo é a aluna que **não está no cadastro**. O que o código faz é outra
 * coisa: re-acrescenta **qualquer** valor ausente da lista filtrada — inclusive uma aluna que
 * está no cadastro e que a curadoria **não** autoriza. A «Aluna A» fica seleccionada de um
 * professor anterior (ou veio no `?aluna=`), e a partir daí viaja com todos.
 *
 * O QUE ESTA PROVA MEDE. A lista visível, no browser, com os três professores e as curadorias
 * reais de produção — e as duas maneiras de contornar o filtro:
 *
 *   1. a lista de cada professor é a das suas curadorias (o correcto);
 *   2. trocar de professor **não** arrasta a aluna do anterior;
 *   3. o `?aluna=` da URL **não** acrescenta uma aluna que a curadoria não autoriza;
 *   4. o caso legítimo do comentário continua a valer: uma aluna que **não está no cadastro**
 *      (o atalho do PO para uma anamnese que ainda não existe) entra assim mesmo.
 *
 * Bancada local: `http.createServer` numa porta efémera, `porta/index.html` servido com as
 * `/api/*` stubadas. **Nada toca no ar** — a cota do Cloudflare não se gasta a depurar.
 *
 *   node experimentos/provar-alunas-da-anamnese.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const PAGINA = path.join(raiz, 'porta', 'index.html');

const provas = [];
function provar(titulo, condicao, detalhe) {
  provas.push({ titulo, ok: !!condicao, detalhe });
  console.log('  ' + (condicao ? 'ok    ' : 'FALHOU') + ' ' + titulo +
    (condicao ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* A PARTIR DAQUI O RECORTE É DO SERVIDOR (23/10/2026), e a prova tem de o exercer a sério:
 * a bancada não responde por um stub — chama `bastidores.fetch` com um KV semeado. Um stub que
 * devolvesse a lista já recortada estaria a provar o stub, e o defeito voltaria pela porta de
 * trás no dia em que a rota mudasse. É a mesma disciplina do `provar-producao`.
 */
function criarKv(inicial) {
  const store = new Map(Object.entries(inicial || {}));
  return {
    store,
    async get(chave) { return store.has(chave) ? store.get(chave) : null; },
    async put(chave, valor) { store.set(chave, String(valor)); },
    async delete(chave) { store.delete(chave); },
    async list() { return { keys: [...store.keys()].map((name) => ({ name })), list_complete: true }; },
  };
}

/* AS CURADORIAS REAIS DA `batata`, lidas da API de produção em 23/10/2026. Não são inventadas:
 * é a forma exacta que o Worker devolve, para a prova medir o caso que aconteceu. */
const CURADORIAS = {
  'cafe-no-bule': [{
    id: 'cafe-no-bule-bale-classico-bale-nivel-2-teste-2',
    professor: 'cafe-no-bule', modalidade: 'Balé clássico', tradicao: 'Vaganova',
    turmas: ['Balé Nível 2 — Teste 2'], repertorio: [], alunas: ['Aluna B'],
  }],
  'manga-curta': [{
    id: 'manga-curta-bale-classico-bale-nivel-1-teste-2',
    professor: 'manga-curta', modalidade: 'Balé clássico', tradicao: 'Vaganova',
    turmas: ['Balé Nível 1 — Teste 2'], repertorio: [], alunas: ['Aluna A'],
  }],
  'meia-cortada': [{
    id: 'meia-cortada-bale-classico-bale-nivel-3-teste-2',
    professor: 'meia-cortada', modalidade: 'Balé clássico', tradicao: 'Vaganova',
    turmas: ['Balé Nível 3 — Teste 2'], repertorio: [], alunas: ['Aluna C'],
  }],
  // O professor SEM curadoria: é o caso da «porta de entrada», e fica na prova de propósito —
  // é a metade da regra que a dona do produto lembrou («qualquer professor pode fazer a
  // anamnese»), e a prova registra qual é o comportamento de hoje.
  'sem-curadoria': [],
};

/* A ALUNA NOVA. «Aluna D» está no cadastro e em curadoria NENHUMA — é a que ainda não tem
 * turma, e é para ela que a anamnese é o instrumento de entrada. A regra de 23/10/2026 diz que
 * qualquer professor a pode entrevistar, e que ela leva a marca «nova» na lista. */
const ALUNAS = ['Aluna A', 'Aluna B', 'Aluna C', 'Aluna D'];
const NOVAS = ['Aluna D'];

const MAPA = {
  ok: true,
  nos: [{ id: 'contexto-aluna', campo: 'Aluna', obrigatorio: true }],
  obrigatorios: 1, respondidas: 0, total: 1, tituloCabecalho: 'Anamnese',
};

/** O motor dos Bastidores, com o KV da escola `batata` semeado com os dados de produção. */
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
const ENV = {
  ESCOLA_SLUG: 'batata',
  ESCOLA_HABILITADA: 'sim',
  PROFESSOR_NOME: 'Café no Bulé',
  SENHA_ADMIN: 'senha-da-direcao',
  /* A SENHA DO PROFESSOR (26/10/2026). A porta devolve à lista quem chega sem o ato autorizado, e
     autorizar é o que a senha faz — na vida real a lista valida a senha e emite um BILHETE de uso
     único, que a porta troca por autorização. A bancada faz o mesmo, com o motor a sério: sem
     isto, cada `goto` desta prova aterrava em `/area-do-professor/anamnese/` e a prova media uma
     página que já não estava aberta. */
  SENHA_PROFESSOR: 'senha-do-professor',
  PADD_KV: criarKv({
    'bastidores/batata/alunas': JSON.stringify(ALUNAS),
    'bastidores/batata/curadorias': JSON.stringify(
      Object.values(CURADORIAS).flat().filter(Boolean)),
    /* Os professores que NÃO são o dono precisam da senha no registo: a do dono vem do `env`. */
    'bastidores/batata/professores': JSON.stringify(
      ['manga-curta', 'meia-cortada', 'sem-curadoria'].map((slug) => ({
        nome: slug, slug, senha: 'senha-do-professor',
      }))),
  }),
};
async function motor(caminhoComQuery) {
  const r = await bastidores.fetch(new Request('https://x' + caminhoComQuery), ENV);
  if (!r) throw new Error('os Bastidores não trataram ' + caminhoComQuery);
  return { status: r.status, corpo: await r.text() };
}

/** O mesmo motor, com o método e o corpo do pedido — os bilhetes são POST. */
async function motorCom(caminhoComQuery, metodo, corpo) {
  const r = await bastidores.fetch(new Request('https://x' + caminhoComQuery, {
    method: metodo,
    headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo || undefined,
  }), ENV);
  if (!r) throw new Error('os Bastidores não trataram ' + caminhoComQuery);
  return { status: r.status, corpo: await r.text() };
}

/** O BILHETE DO ATO — o mesmo gesto da lista: a senha confere, o servidor emite o bilhete. */
async function bilhete(slug, aluna) {
  const r = await bastidores.fetch(new Request('https://x/api/bastidores/ato', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha: 'senha-do-professor', professor: slug, fonte: 'anamnese',
      ciclo: '01', aluna }),
  }), ENV);
  const d = await r.json();
  if (!d || !d.ato) throw new Error('sem bilhete para ' + slug + '/ ' + aluna + ': ' + JSON.stringify(d));
  return d.ato;
}

function servir() {
  const srv = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const caminho = decodeURIComponent(url.pathname);
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    const json = (obj) => ok('application/json', JSON.stringify(obj));

    /* A PÁGINA VEM EM TRÊS CAMINHOS (`/anamnese/`, `/plano-ensino/`, `/plano-observacao/`),
       porque a porta lê a FONTE do `location.pathname`. A prova precisa da anamnese. */
    if (caminho === '/anamnese/' || caminho === '/anamnese/index.html') {
      return ok('text/html; charset=utf-8', fs.readFileSync(PAGINA, 'utf8'));
    }
    if (/\/assets\/style\.css$/.test(caminho)) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css'), 'utf8'));
    }
    if (caminho === '/assets/nav.js') {
      return ok('text/javascript; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js'), 'utf8'));
    }
    /* O `markdown.js` DA PORTA — servido no caminho ABSOLUTO, e é o Worker que decide qual é.
     *
     * AQUI ESTAVA UMA BANCADA QUE ESCONDIA UM DEFEITO (15/11/2026). Ela servia
     * `/anamnese/assets/markdown.js` «porque o `src` é relativo à página» — e com isso tapava o
     * que o produto fazia: no Worker, um caminho com a forma `/<pasta>/assets/…` vai DIRETO ao ASSETS
     * (a negativa `run_worker_first` de 13/11/2026), onde `anamnese/assets/` não existe. O
     * ficheiro devolvia 404, o `Markdown` não existia, e o formulário não abria.
     *
     * A regra da bancada passa a ser a do produto: só se serve o caminho que o ASSETS tem de
     * facto — `plano-observacao/assets/…`, o sítio único do ficheiro no pacote. Se a página
     * voltar a pedir o relativo, esta prova falha em vez de passar. */
    if (/^\/plano-observacao\/assets\/markdown\.js$/.test(caminho)) {
      return ok('text/javascript; charset=utf-8', fs.readFileSync(path.join(raiz, 'porta/assets/markdown.js'), 'utf8'));
    }
    if (caminho.indexOf('/api/mapa') !== -1) return json(MAPA);
    if (caminho.endsWith('/api/bastidores/professores')) {
      return json({
        ok: true, escola: 'batata',
        professores: [
          { nome: 'Café no Bulé', slug: 'cafe-no-bule' },
          { nome: 'Manga Curta', slug: 'manga-curta' },
          { nome: 'Meia Cortada', slug: 'meia-cortada' },
          { nome: 'Sem Curadoria', slug: 'sem-curadoria' },
        ],
      });
    }
    /* O MOTOR, A SÉRIO. As duas rotas que interessam são servidas pelo `bastidores.js` — o
       mesmo código que o Worker empacota —, sobre um KV semeado com as curadorias e o cadastro
       de produção. O que a prova mede é a lista que o servidor devolve E a que o browser
       desenha: duas metades, e a primeira não pode ser um stub. */
    if (caminho.endsWith('/api/bastidores/alunas')
      || caminho.indexOf('/api/bastidores/curadoria-professor') !== -1
      || caminho.indexOf('/api/bastidores/ato') !== -1) {
      const pedacos = [];
      req.on('data', (p) => pedacos.push(p));
      req.on('end', () => {
        const corpo = Buffer.concat(pedacos).toString('utf8');
        motorCom(url.pathname + url.search, req.method, corpo).then((r) => {
          res.writeHead(r.status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
          res.end(r.corpo);
        }).catch((e) => { res.writeHead(500); res.end(String(e)); });
      });
      return undefined;
    }
    if (caminho.endsWith('/api/envelopes')) return json({ ok: true, envelopes: [] });
    if (caminho.endsWith('/api/anamnese-estados')) return json({ ok: true, estados: {} });
    if (caminho.endsWith('/api/bastidores/validar-senha')) return json({ ok: true });
    if (caminho.indexOf('/api/') !== -1) return json({ ok: true });
    res.writeHead(404); res.end('nao encontrado');
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({
    srv, base: 'http://127.0.0.1:' + srv.address().port,
  })));
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-alunas-da-anamnese: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-alunas-da-anamnese: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  const { srv, base } = await servir();
  const navegador = await puppeteer.launch({
    executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1280, height: 900 });

  /** As opções do seletor de alunas, sem o «— nenhuma —». */
  const alunasVisiveis = () => pagina.evaluate(() => {
    const sel = document.getElementById('ctx-aluna');
    return [...sel.querySelectorAll('option')].map((o) => o.value).filter(Boolean);
  });

  /* Abre a anamnese já com um professor escolhido, e espera a curadoria chegar.
   *
   * O `&ciclo=01` E O `&aluna=` NÃO SÃO DECORAÇÃO (26/10/2026). A porta devolve à lista quem chega
   * sem o contexto do ato — professor, ciclo e, na anamnese, aluna (`CAMPOS_DO_CONTEXTO`) —, e a
   * trava corre depois de `carregarAlunas`. Sem estes dois parâmetros o browser navegava para
   * `/area-do-professor/anamnese/` antes de o seletor encher, e esta prova media uma página que
   * já não estava aberta: ficou a arder desde o dia em que a trava passou a valer, e o sintoma era
   * um `waitForFunction` a expirar. A aluna passa a vir no endereço como vem na vida real: a lista
   * da Área do Professor monta o link do ato com ela. */
  const abrir = async (slug, aluna) => {
    const t = await bilhete(slug, aluna);
    await pagina.goto(base + '/anamnese/?escola=batata&ciclo=01&professor=' + slug
      + '&aluna=' + encodeURIComponent(aluna) + '&abrir=1&ato=' + encodeURIComponent(t),
      { waitUntil: 'load' });
    await pagina.waitForFunction(() => {
      const sel = document.getElementById('ctx-aluna');
      return sel && sel.querySelectorAll('option').length > 0;
    }, { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 250));
  };

  const opcoes = () => pagina.evaluate(() => [...document.getElementById('ctx-aluna')
    .querySelectorAll('option')].map((o) => ({ valor: o.value, texto: o.textContent.trim() }))
    .filter((o) => o.valor));

  console.log('\n1 · A aluna matriculada é do professor dela; a nova é de todos');
  /* A REGRA MISTA (23/10/2026). Três professoras, três alunas curadas uma a uma, mais uma
     aluna no cadastro sem curadoria nenhuma («Aluna D», a NOVA). Cada professora vê a sua
     aluna MAIS a nova — e não vê as alunas das outras. */
  for (const [slug, propria, nome] of [
    ['cafe-no-bule', 'Aluna B', 'Café no Bulé'],
    ['manga-curta', 'Aluna A', 'Manga Curta'],
    ['meia-cortada', 'Aluna C', 'Meia Cortada'],
  ]) {
    await abrir(slug, propria);
    const vistas = await alunasVisiveis();
    provar(nome + ' vê a sua aluna e a nova, e mais nenhuma',
      JSON.stringify(vistas) === JSON.stringify([propria, 'Aluna D']), vistas);
    /* A MARCA. Só a nova a leva: uma aluna curada já tem professor e turma, e uma marca a
       dizer «nova» ao lado do nome dela seria uma afirmação falsa sobre o registo. */
    const rotulos = await opcoes();
    const daNova = (rotulos.find((o) => o.valor === 'Aluna D') || {}).texto || '';
    const daPropria = (rotulos.find((o) => o.valor === propria) || {}).texto || '';
    provar(nome + ': a nova leva a marca «nova», e a curada não',
      /— nova$/.test(daNova) && daPropria === propria, { nova: daNova, curada: daPropria });
  }

  console.log('\n2 · Trocar de professor não arrasta a aluna do anterior');
  /* A SEQUÊNCIA DO DEFEITO. Escolhe-se a aluna do Manga (A), troca-se para o Café (que tem a
     B) — e a A não pode continuar na lista. Era assim que ela viajava entre as três. */
  await abrir('manga-curta', 'Aluna A');
  await pagina.evaluate(() => {
    document.getElementById('ctx-aluna').value = 'Aluna A';
    const sel = document.getElementById('ctx-professor');
    sel.value = 'cafe-no-bule';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 500));
  const depoisDaTroca = await alunasVisiveis();
  provar('depois de trocar Manga → Café, a lista é a do Café',
    JSON.stringify(depoisDaTroca) === JSON.stringify(['Aluna B', 'Aluna D']), depoisDaTroca);

  console.log('\n3 · O `?aluna=` da URL não autoriza ninguém');
  /* O ATALHO DO PO existe para não obrigar a escolher de novo — mas uma aluna curada a OUTRA
     professora não entra só porque veio no endereço.
     A MEDIÇÃO MUDOU DE SÍTIO (26/10/2026), e a consequência ficou mais forte. Antes media-se na
     lista desenhada: pedia-se a porta com `?aluna=Aluna C` e via-se que a C não entrava no
     seletor. Hoje a porta não abre sem o ato inteiro, e a aluna não autorizada deixa o campo
     vazio — a trava devolve a pessoa à lista em vez de lhe mostrar um seletor sem ela. O sítio da
     decisão sempre foi o servidor; é lá que a regra se mede, e a consequência mede-se na página. */
  const comAtalho = JSON.parse((await motor('/api/bastidores/alunas?professor=cafe-no-bule&aluna='
    + encodeURIComponent('Aluna C'))).corpo);
  provar('o servidor não acrescenta a Aluna C (curada a outra professora) por ela vir no endereço',
    JSON.stringify(comAtalho.alunas) === JSON.stringify(['Aluna B', 'Aluna D'])
    && JSON.stringify(comAtalho.novas) === JSON.stringify(['Aluna D']), comAtalho);

  const t3 = await bilhete('cafe-no-bule', 'Aluna C');
  await pagina.goto(base + '/anamnese/?escola=batata&ciclo=01&professor=cafe-no-bule'
    + '&aluna=Aluna%20C&abrir=1&ato=' + encodeURIComponent(t3), { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 700));
  provar('e a porta, com ela no endereço, devolve a pessoa à lista em vez de abrir o ato',
    pagina.url().indexOf('/area-do-professor/anamnese/') !== -1, pagina.url());

  console.log('\n4 · O caso legítimo continua: aluna fora do cadastro entra assim mesmo');
  /* O comentário do código diz por que a re-inclusão existe: «aluna ainda não cadastrada na
     Produção». Se o atalho traz um apelido que NÃO está no cadastro, descartá-lo deixaria o
     professor sem a aluna que o sistema lhe mandou observar. Esse caso fica. */
  await abrir('cafe-no-bule', 'Aluna Nova');
  const foraDoCadastro = await alunasVisiveis();
  provar('a aluna que não está no cadastro entra na lista (o atalho não é descartado)',
    foraDoCadastro.indexOf('Aluna Nova') !== -1 && foraDoCadastro.indexOf('Aluna B') !== -1,
    foraDoCadastro);

  console.log('\n5 · Quem não tem curadoria nenhuma vê só as novas');
  /* Sem curadoria, a professora não autoriza aluna matriculada nenhuma — mas a porta de entrada
     continua aberta para quem ainda não tem turma. É a metade que a dona do produto lembrou,
     agora com o recorte certo: as matriculadas são de quem as curou, as novas são de todos. */
  await abrir('sem-curadoria', 'Aluna D');
  const semCuradoria = await alunasVisiveis();
  provar('sem curadoria, a lista é só a das alunas novas',
    JSON.stringify(semCuradoria) === JSON.stringify(NOVAS), semCuradoria);

  console.log('\n6 · A marca não entra no documento');
  /* «Aluna D — nova» é o TEXTO da opção; o valor é «Aluna D». O contexto do ato lê o rótulo da
     opção escolhida (`valorDoContexto`), e sem o `data-nome` a palavra «nova» iria para dentro
     do envelope — um apelido que não existe, e num campo que a proveniência não reescreve. */
  await abrir('cafe-no-bule', 'Aluna B');
  const valorNoDocumento = await pagina.evaluate(() => {
    const sel = document.getElementById('ctx-aluna');
    sel.value = 'Aluna D';
    const opcao = sel.options[sel.selectedIndex];
    return { texto: opcao.textContent.trim(), valor: sel.value,
      nome: opcao.getAttribute('data-nome') };
  });
  provar('a opção diz «Aluna D — nova», mas o valor e o `data-nome` são o apelido',
    valorNoDocumento.texto === 'Aluna D — nova' && valorNoDocumento.valor === 'Aluna D'
    && valorNoDocumento.nome === 'Aluna D', valorNoDocumento);

  console.log('\n7 · A marca «nova» sai quando a anamnese já existe (e a lista fica)');
  /* O DEFEITO QUE A PESQUISADORA VIU (26/10/2026). «Eu fiz a anamnese da aluna A. Ela tá pronta
     a anamnese. […] ela não deveria estar mais na lista aqui.» A decisão dela: a aluna FICA (é
     preciso poder voltar a mexer no que foi respondido), mas perde a marca — o aviso é «ainda
     falta entrevistar», e deixa de ser verdade no instante em que há registo.
     O QUE SE MEDE É O ANTES E O DEPOIS DO MESMO REGISTO: a seção 6 acabou de ler «Aluna D —
     nova» com o acervo vazio. Grava-se a anamnese dela e volta-se a abrir: a mesma aluna, o
     mesmo seletor, sem a marca. Se alguém apagar a regra do `alunasDaAnamnese`, a segunda metade
     reprova — é o controle negativo feito com o dado, e não com o código. */
  const CARIMBO = 'anamnese-20261026090000';
  /* A CHAVE LEVA O PREFIXO DA ESCOLA — `batata/envelope/…`, e não `envelope/…`. O adaptador
     (`armazenamento`) põe o slug da escola à frente de tudo o que lê e escreve; sem ele o
     envelope ficava ao lado da família, invisível para o motor, e esta seção media a ausência do
     dado em vez da regra. Custou uma corrida: o índice gravado apareceu em
     `batata/envelope/.indice.json` e o semeado em `envelope/`. */
  const PREFIXO = 'batata/envelope/';
  ENV.PADD_KV.store.set(PREFIXO + CARIMBO + '.json', JSON.stringify({
    id: CARIMBO,
    $comentario: 'envelope de prova — a Aluna D já foi entrevistada',
    envelope: 1,
    conteudo: { endereco: 'x', norma: 'y', digest: null, digestAlgoritmo: 'sha256' },
    respostas: { 'contexto-aluna': { valor: 'Aluna D' } },
    contexto: { escola: 'batata', professor: 'cafe-no-bule', ciclo: '01', aluna: 'Aluna D' },
    gerado_em: '2026-10-26T09:00:00Z',
    validacao: { contrato: 'x', resultado: 'passou', motivos: [] },
  }));
  /* O ÍNDICE JÁ GRAVADO NÃO SABE DESTE ENVELOPE. A primeira leitura da seção 1 construiu-o e
     guardou-o no KV; `lerIndice` devolve-o tal e qual enquanto ele lá estiver. Apagá-lo é o que
     obriga a enumeração a ver o registo novo — e é o que a produção faz sozinha, porque
     `gravarEnvelope` reescreve o índice na mesma escrita. */
  ENV.PADD_KV.store.delete(PREFIXO + '.indice.json');

  await abrir('cafe-no-bule', 'Aluna B');
  const depoisDaAnamnese = await opcoes();
  provar('a Aluna D continua na lista depois de ter anamnese',
    depoisDaAnamnese.some((o) => o.valor === 'Aluna D'), depoisDaAnamnese);
  const rotuloDaD = (depoisDaAnamnese.find((o) => o.valor === 'Aluna D') || {}).texto || '';
  provar('e deixa de levar a marca «nova»', rotuloDaD === 'Aluna D', rotuloDaD);

  /* O `markdown.js` PEDE-SE ONDE ELE EXISTE (15/11/2026).
   *
   * Este é o defeito que o formulário pagou: com o `src` relativo, a página de `/anamnese/`
   * pedia `/anamnese/assets/markdown.js`; a negativa `/<pasta>/assets/…` do `run_worker_first`
   * mandava esse pedido ao ASSETS, onde o ficheiro não está, e o 404 deixava o `Markdown`
   * indefinido — o primeiro `md()` lançava, o desenho abortava e o professor via a Condução sem
   * pergunta nenhuma. A prova mede o ENDEREÇO no HTML servido, e não a bancada: uma bancada que
   * sirva o caminho errado passaria a esconder o defeito, como escondeu. */
  const htmlDaPorta = fs.readFileSync(PAGINA, 'utf8');
  const tagDoMarkdown = (/<script src="[^"]*markdown\.js"/.exec(htmlDaPorta) || [])[0] || '';
  provar('o `markdown.js` é pedido no caminho ABSOLUTO do pacote',
    /src="\/plano-observacao\/assets\/markdown\.js"/.test(tagDoMarkdown), tagDoMarkdown);
  provar('…e esse caminho é o que o ficheiro ocupa no pacote (não um segundo sítio)',
    fs.existsSync(path.join(raiz, 'porta', 'assets', 'markdown.js'))
      && tagDoMarkdown.indexOf('plano-observacao/assets/markdown.js') !== -1, tagDoMarkdown);

  await navegador.close();
  srv.close();

  const falhou = provas.filter((p) => !p.ok).length;
  console.log('\nprovar-alunas-da-anamnese: ' + (provas.length - falhou) + ' de ' + provas.length + ' passaram');
  process.exit(falhou ? 1 : 0);
})().catch((e) => {
  console.error('provar-alunas-da-anamnese: ' + (e && e.message));
  process.exit(1);
});
