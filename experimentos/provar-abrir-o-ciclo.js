#!/usr/bin/env node
'use strict';

/*
 * provar-abrir-o-ciclo.js — o «Abrir» do formulário abre o ciclo, e o erro aparece na tela.
 *
 * O RELATO (06/11/2026). «O abrir não abre nada, ele não funciona, mesmo colocando a senha, e o
 * gerar .md do caderno também não faz nada.» Medido no Worker vivo: `POST /api/dados` com o nome
 * verdadeiro do ficheiro respondia
 *
 *   { ok: false, erro: "arquivo de dados inválido: ciclo-01-calango-bale-nivel-1-teste-1-dados.json" }
 *
 * A SENHA NÃO TINHA CULPA. A regra que valida o nome (`motor/servidor/ler-dados.js`) aceitava UM
 * segmento de variante (`(?:-[a-z0-9]+)?`), e a variante é `<escola>-<turma>`
 * (`calango-bale-nivel-1-teste-1`) — com hífens. Todo pacote de turma era recusado; só passava o
 * modelo antigo, de uma escola e uma turma (`ciclo-01-duo-dados.json`). E o sintoma mentia duas
 * vezes: a tela dizia «a senha foi recusada», e o «Gerar .md» morria numa promessa rejeitada, sem
 * dizer nada.
 *
 * A SEGUNDA VOLTA (06/11/2026, à tarde). «Eu coloco a senha, clico em abrir e ele diz que não
 * abriu, o pacote não tem ciclo; as duas senhas de teste não funcionam; não sei qual é a senha
 * que ele espera.» AS DUAS SENHAS ESTAVAM CERTAS. O `-dados.json` vive DENTRO do pacote da turma
 * (`publicacao/<escola>/<variante>/`), e o leitor procurava-o na RAIZ do site — desde 20/10/2026,
 * quando o `assets.directory` passou a ser a publicação. Respondia «o pacote não tem …» para um
 * ficheiro publicado, e a página traduzia TODO erro que não fosse «sem senha» em «a senha
 * digitada foi recusada». Uma frase que mente custa mais do que nenhuma.
 *
 * A PROVA TAMBÉM MENTIA, e é a lição desta volta: o banco servia a página na raiz e o stub do
 * `/api/dados` encontrava o ficheiro para QUALQUER nome. Ela media a pergunta, não o caminho.
 * Agora há um banco com a FORMA DA PUBLICAÇÃO (a raiz com o `nav.json`, o pacote com os seus
 * documentos) e o leitor VERDADEIRO a resolver contra ela.
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   A. A REGRA DO NOME é uma só (`motor/nucleo/lancamento.js`), aceita a variante com hífens e o
 *      carimbo, e continua a RECUSAR o que sai do alfabeto de slug — a rota recebe o nome do
 *      cliente, e um `../` leria outro arquivo do pacote.
 *   A.2 O CAMINHO: `<pacote>/<nome>`, uma pasta, alfabeto de slug — e o nome sozinho, para o
 *      pacote servido na raiz.
 *   B. O LEITOR decifra o `-dados.json` no caminho em que ele está publicado — e a CONTRAPROVA
 *      do nome sozinho, que não o encontra (e não fala de senha).
 *   C. O «ABRIR», no navegador: com a senha, a leitura aparece (e não um vazio — o vazio lia-se
 *      como «não abriu»), e o filtro NÃO salta para a aula que falta lançar.
 *   D. A CONTRAPROVA: com a regra VELHA, o mesmo clique devolve «arquivo de dados inválido» — o
 *      defeito, a correr. Sem ela a prova aprovaria qualquer coisa.
 *   F. O ACORDEÃO «Lançar uma aula» abre, fecha e não desaparece ao clique — e a contraprova com
 *      o ouvinte de antes, que escondia o painel.
 *   G. O VALIDADOR aceita a régua que a captura declara, e só então.
 *   H. A PÁGINA DENTRO DO PACOTE, como no ar: abre com a senha certa, o pedido leva a pasta, e
 *      sem nada aberto não há paginação («tá aparecendo um rodapé para um lugar que não tem
 *      paginação»). H.2 é a contraprova: com o leitor de antes, a tela diz «não abriu» e NÃO
 *      culpa a senha.
 *
 * Requer Chrome/Chromium para as partes de navegador (puppeteer-core vem com o marp-cli global).
 *
 *   node experimentos/provar-abrir-o-ciclo.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PACOTE = path.join(RAIZ, 'professores/rabo-gramde/ciclos/ciclo-01-calango-bale-nivel-1-teste-1');
const DADOS = path.join(RAIZ, 'professores/rabo-gramde/ciclos/ciclo-01-calango-bale-nivel-1-teste-1-dados.json');
const NOME = 'ciclo-01-calango-bale-nivel-1-teste-1-dados.json';
const NOME_CARIMBADO = 'ciclo-01-calango-bale-nivel-1-teste-1-dados-2026-11-06T1642.json';

const { nomeDeDadosValido, varianteDoNomeDeDados, partesDoCaminhoDeDados } =
  require(path.join(RAIZ, 'motor/nucleo/lancamento.js'));
const { criarLeitorDeDados } = require(path.join(RAIZ, 'motor/servidor/ler-dados.js'));
const Cifra = require(path.join(RAIZ, 'tools/lib-cifra.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* ==========================================================================================
 * A. A regra do nome — uma definição, a do núcleo
 * ======================================================================================== */
console.log('\nA. A regra do nome de dados aceita a variante da turma — e recusa o que sai do slug');
{
  for (const nome of [NOME, NOME_CARIMBADO, 'ciclo-01-duo-dados.json', 'ciclo-02-bale-nivel-1-dados.json']) {
    provar('aceita ' + nome, nomeDeDadosValido(nome), nome);
  }
  provar('…e a variante que ela extrai é a da turma',
    varianteDoNomeDeDados(NOME) === 'calango-bale-nivel-1-teste-1', varianteDoNomeDeDados(NOME));

  for (const [nome, porque] of [
    ['../ciclo-01-dados.json', 'travessia de caminho'],
    ['ciclo-01-../../etc/passwd', 'travessia com variante'],
    ['ciclo-01-calango/dados.json', 'barra no nome'],
    ['ciclo-01-calango-BALE-dados.json', 'maiúsculas'],
    ['ciclo-01-calango-dados.json.json', 'extensão dupla'],
    ['ciclos.json', 'não é arquivo de dados'],
    ['', 'vazio'],
  ]) {
    provar('recusa ' + (nome || '(vazio)') + ' — ' + porque, !nomeDeDadosValido(nome), nome);
  }

  /* A CONTRAPROVA DA REGRA: a expressão que estava no Worker (um segmento). Com ela, o nome real
   * do ciclo de turma é recusado — é o defeito, medido na própria regra. */
  const REGRA_VELHA = /^ciclo-[0-9]{2}(?:-[a-z0-9]+)?-dados(?:-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{4})?\.json$/;
  provar('a regra VELHA recusava o nome real — é o defeito, a correr',
    REGRA_VELHA.test(NOME) === false, { nome: NOME, velha: REGRA_VELHA.test(NOME) });
}

/* ==========================================================================================
 * A.2 O CAMINHO NO SITE — a pasta do pacote, e só ela
 *   A leitura no Worker recebe o caminho do cliente. Ele passou a aceitar UMA pasta (o pacote da
 *   turma, desde que o site deixou de ser o pacote e passou a ser a `publicacao/<escola>/`).
 *   A regra é a mesma do nome: o que não estiver no alfabeto de slug não chega ao ASSETS.
 * ======================================================================================== */
console.log('\nA.2 O caminho: `<pacote>/<nome>`, e nada além de uma pasta');
{
  const pasta = 'bale-nivel-1-teste-1';
  const ok = partesDoCaminhoDeDados(pasta + '/' + NOME);
  provar('aceita o caminho real da publicação', ok && ok.pasta === pasta && ok.nome === NOME, ok);
  provar('…e aceita o nome sozinho (o pacote servido na raiz)',
    (partesDoCaminhoDeDados(NOME) || {}).pasta === '', partesDoCaminhoDeDados(NOME));
  provar('…e a barra inicial não atrapalha (o caminho da página vem com ela)',
    (partesDoCaminhoDeDados('/' + pasta + '/' + NOME) || {}).pasta === pasta,
    partesDoCaminhoDeDados('/' + pasta + '/' + NOME));
  for (const [caminho, porque] of [
    ['../' + NOME, 'travessia de caminho'],
    [pasta + '/../' + NOME, 'travessia no nome'],
    ['a/b/' + NOME, 'duas pastas'],
    ['Pasta-Maiuscula/' + NOME, 'maiúsculas na pasta'],
    ['.' + '/' + NOME, 'pasta que é um ponto'],
    ['', 'vazio'],
    [pasta + '/ciclos.json', 'nome que não é de dados'],
  ]) {
    provar('recusa ' + (caminho || '(vazio)') + ' — ' + porque,
      partesDoCaminhoDeDados(caminho) === null, caminho);
  }
}

/* ==========================================================================================
 * B. O leitor
 * ======================================================================================== */
console.log('\nB. O leitor decifra o ciclo de uma turma — no caminho em que ele está publicado');
(async () => {
  const senha = 'senha-da-prova';
  const claro = fs.readFileSync(DADOS, 'utf8');
  const envelope = await Cifra.cifrar(claro, senha);
  /* A ÁRVORE DE VERDADE, E NÃO UM STUB QUE ENCONTRA TUDO (06/11/2026). Aqui o `lerAsset`
   * devolvia o arquivo para QUALQUER nome — e por isso esta prova aprovou um leitor que
   * procurava o ficheiro na raiz do site, quando ele está dentro do pacote da turma. Uma prova
   * que responde «sim» a tudo não mede o caminho: mede a pergunta. Agora a árvore tem a forma
   * da publicação — a raiz com o `nav.json`, o pacote com os documentos — e quem procura no
   * lugar errado recebe `null`, como no Worker. */
  const arvore = {
    'nav.json': '{}',
    ['bale-nivel-1-teste-1/' + NOME]: JSON.stringify({ _cifrado: envelope }),
  };
  const lerAsset = async (caminho) => (arvore[caminho]
    ? { corpo: new TextEncoder().encode(arvore[caminho]) }
    : null);
  const leitor = criarLeitorDeDados({
    senhaCripto: senha, lerAsset, senhaOk: async (s) => s === 'a-senha-da-pessoa',
  });

  const ok = await leitor({ arquivo: 'bale-nivel-1-teste-1/' + NOME, senha: 'a-senha-da-pessoa' });
  provar('devolve ok pelo caminho da publicação', ok.ok === true, ok);
  provar('…e o que devolve é o JSON em claro, com a aula lançada',
    JSON.parse(ok.texto).aulas && Object.keys(JSON.parse(ok.texto).aulas).length > 0,
    ok.texto && Object.keys(JSON.parse(ok.texto).aulas || {}));

  /* A CONTRAPROVA DO CAMINHO — o defeito que ela viu, a correr: com o NOME SOZINHO na mesma
   * árvore, o leitor procura na raiz e não encontra. É a resposta «o pacote não tem …» que a
   * página traduzia em «a senha foi recusada». */
  const naRaiz = await leitor({ arquivo: NOME, senha: 'a-senha-da-pessoa' });
  provar('contraprova: o nome sozinho, na árvore da publicação, não encontra o arquivo',
    naRaiz.ok === false && /o pacote não tem/.test(naRaiz.erro), naRaiz);
  provar('…e essa recusa NÃO fala de senha (era a mentira que ela leu)',
    !/senha/i.test(naRaiz.erro), naRaiz.erro);

  const semSenha = await leitor({ arquivo: 'bale-nivel-1-teste-1/' + NOME, senha: 'errada' });
  provar('sem a senha certa, recusa', semSenha.ok === false && /senha/.test(semSenha.erro), semSenha);
  for (const mau of ['../professores/x/ciclos/ciclo-01-dados.json',
    'bale-nivel-1-teste-1/../' + NOME, 'a/b/' + NOME]) {
    const invasor = await leitor({ arquivo: mau, senha: 'a-senha-da-pessoa' });
    provar('…e ' + mau + ' não chega ao ASSETS',
      invasor.ok === false && /inválido/.test(invasor.erro), invasor);
  }

  /* ========================================================================================
   * C e D. O «Abrir» no navegador — com a regra de agora, e com a de antes
   * ====================================================================================== */
  console.log('\nC. O «Abrir» no navegador: a leitura aparece, e o filtro não salta para o lançamento');

  let puppeteer;
  let executavel;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
    executavel = process.env.CHROME_PATH
      || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  } catch (e) { puppeteer = null; }
  if (!puppeteer || !executavel) {
    provar('o navegador existe para medir o «Abrir»', false, 'puppeteer-core/Chrome ausente — NÃO FEITO');
  } else {
    const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };

    /* O stub aplica A REGRA DE VERDADE (`nomeDeDadosValido`) ou, na contraprova, a de antes. */
    async function bancada({ regraVelha }) {
      const srv = http.createServer((req, res) => {
        const url = decodeURIComponent(req.url.split('?')[0]);
        if (req.method === 'POST' && url === '/api/dados') {
          let corpo = '';
          req.on('data', (d) => { corpo += d; });
          req.on('end', () => {
            let p = {};
            try { p = JSON.parse(corpo); } catch (e) { p = {}; }
            const valida = regraVelha
              ? /^ciclo-[0-9]{2}(?:-[a-z0-9]+)?-dados(?:-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{4})?\.json$/.test(String(p.arquivo || ''))
              : nomeDeDadosValido(p.arquivo);
            const resposta = valida
              ? { ok: true, texto: claro }
              : { ok: false, erro: 'arquivo de dados inválido: ' + (p.arquivo || '(vazio)') };
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify(resposta));
          });
          return;
        }
        const rel = url.replace(/^\/+/, '') || 'index.html';
        /* O FORMULÁRIO É O DA FONTE, e não a cópia do pacote: o gerador copia
         * `tools/templates/lancamento.html` para dentro dele, e uma prova que medisse a cópia
         * estaria a medir a geração anterior — passaria a vermelho depois de cada correção no
         * template, e por um motivo que não é o que ela mede. */
        const alvo = rel === 'lancamento.html'
          ? path.join(RAIZ, 'tools/templates/lancamento.html')
          : path.join(PACOTE, rel);
        const DENTRO = (x) => x.startsWith(PACOTE) || x === path.join(RAIZ, 'tools/templates/lancamento.html');
        if (!DENTRO(alvo) || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) {
          res.writeHead(404); res.end('nao encontrado'); return;
        }
        res.writeHead(200, { 'content-type': MIME[path.extname(alvo)] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(fs.readFileSync(alvo));
      });
      return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
    }

    async function abrirNoNavegador({ regraVelha }) {
      const { srv, base } = await bancada({ regraVelha });
      const nav = await puppeteer.launch({ executablePath: executavel, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
      const erros = [];
      try {
        const p = await nav.newPage();
        await p.setViewport({ width: 1280, height: 900 });
        p.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
        await p.goto(`${base}/lancamento.html`, { waitUntil: 'networkidle0' });
        await p.select('#ciclo', '01');
        await new Promise((r) => setTimeout(r, 300));
        await p.$eval('#senha', (n) => { n.value = 'a-senha-da-pessoa'; });
        await p.$eval('#abrir-ciclo', (b) => b.click());
        await new Promise((r) => setTimeout(r, 900));
        return {
          texto: (await p.$eval('#saida', (n) => n.textContent)).trim(),
          html: await p.$eval('#saida', (n) => n.innerHTML),
          aula: await p.$eval('#aula', (n) => n.value),
          erros,
        };
      } finally { await nav.close(); srv.close(); }
    }

    const bom = await abrirNoNavegador({ regraVelha: false });
    provar('com a senha, a leitura do ciclo ABRE (a área de resultados não fica vazia)',
      /Aula 06/.test(bom.texto) && bom.html.length > 200, { texto: bom.texto.slice(0, 120) });
    provar('…e o filtro fica em «todas as aulas» — o «Abrir» é leitura, não o próximo lançamento',
      bom.aula === '', { aula: bom.aula });
    provar('…e o título da aula não repete o nome do ciclo',
      /<h3>Aula 06 — [^<]+<\/h3>/.test(bom.html), (bom.html.match(/<h3>[^<]*/) || [])[0]);
    provar('…e o período do ciclo sai com «a», e não com «..»',
      /a<\/span>|a \d{2}\/\d{2}\/\d{4}/.test(bom.html) && !/\.\./.test(bom.html), bom.html.slice(0, 200));
    /* A ÚNICA MARCAÇÃO QUE A FOLHA NÃO DESENHA (06/11/2026). O registro da aula saía num `<dl>`
     * — e o navegador o desenhava com o recuo dele (40px de `dd`), no meio de um documento que
     * usa a escala da casa em tudo o mais. `ul`/`li` são peça da folha. */
    provar('…e o registro da aula é uma lista da folha, não um `<dl>` do navegador',
      !/<dl>/.test(bom.html) && /<ul><li><strong>Relatório:/.test(bom.html),
      (bom.html.match(/<(dl|ul)[^>]*>/) || [])[0]);
    provar('…e a área de resultados não devolveu erro de página', bom.erros.length === 0, bom.erros);

    console.log('\nD. A contraprova: com a regra VELHA, o mesmo clique falha — o defeito, a correr');
    const mau = await abrirNoNavegador({ regraVelha: true });
    provar('a regra velha recusa o nome real, e a tela diz isso',
      /arquivo de dados inválido/.test(mau.texto), mau.texto.slice(0, 200));
    provar('…e não há leitura nenhuma — é o «não abre nada» do relato',
      !/Aula 06/.test(mau.texto), mau.texto.slice(0, 120));

    /* ======================================================================================
     * E. O «Gerar .md»: falha DIZENDO, e conclui quando o ciclo está aberto
     * ==================================================================================== */
    console.log('\nE. O «Gerar .md»: sem o ciclo aberto a tela diz o que fazer — não fica muda');
    async function gerarNoNavegador({ abrirPrimeiro, tipo }) {
      const { srv, base } = await bancada({ regraVelha: false });
      const nav = await puppeteer.launch({ executablePath: executavel, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
      const erros = [];
      try {
        const p = await nav.newPage();
        await p.setViewport({ width: 1280, height: 900 });
        p.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
        // `baixar` usa âncora + Blob; o download em headless não é o que se mede — o que se
        // mede é a MENSAGEM, que é o contrato com quem clica.
        await p.evaluateOnNewDocument(() => {
          window.__baixados = [];
          window.addEventListener('DOMContentLoaded', () => {
            const b = document.getElementById('gerar');
            if (b) b.dataset.pronto = '1';
          });
        });
        await p.goto(`${base}/lancamento.html`, { waitUntil: 'networkidle0' });
        await p.select('#ciclo', '01');
        await new Promise((r) => setTimeout(r, 300));
        if (abrirPrimeiro) {
          await p.$eval('#senha', (n) => { n.value = 'a-senha-da-pessoa'; });
          await p.$eval('#abrir-ciclo', (b) => b.click());
          await new Promise((r) => setTimeout(r, 900));
        }
        await p.select('#entregavel', tipo);
        await p.$eval('#autor', (n) => { n.value = 'prova'; n.dispatchEvent(new Event('input', { bubbles: true })); });
        /* A SENHA É O CASO DA VOLTA SEM `Abrir`: sem ela o JSON cifrado não abre, e é esse o
         * estado em que o clique ficava mudo. Onde o caso pede o ciclo aberto, ela já foi
         * digitada acima. */
        if (!abrirPrimeiro) await p.$eval('#senha', (n) => { n.value = ''; });
        await p.click('#gerar');
        await new Promise((r) => setTimeout(r, 900));
        return {
          aviso: (await p.$eval('#aviso-gerado', (n) => n.textContent)).trim(),
          html: await p.$eval('#aviso-gerado', (n) => n.innerHTML),
          erros,
        };
      } finally { await nav.close(); srv.close(); }
    }

    const semAbrir = await gerarNoNavegador({ abrirPrimeiro: false, tipo: 'caderno' });
    provar('sem o ciclo aberto, o «Gerar .md» DIZ que não gerou',
      /não gerei o arquivo/i.test(semAbrir.aviso), semAbrir.aviso.slice(0, 160));
    provar('…e nomeia o gesto que resolve (a senha e o Abrir)',
      /senha/i.test(semAbrir.html) && /Abrir/.test(semAbrir.html), semAbrir.html.slice(0, 220));
    provar('…sem promessa rejeitada sem dono', semAbrir.erros.length === 0, semAbrir.erros);

    const comAbrir = await gerarNoNavegador({ abrirPrimeiro: true, tipo: 'caderno' });
    provar('com o ciclo aberto, o caderno é gerado e a tela o declara',
      /gerado: caderno-01/i.test(comAbrir.aviso), comAbrir.aviso.slice(0, 160));
    provar('…e o entregável saiu pelo caminho normal, sem erro de página',
      comAbrir.erros.length === 0, comAbrir.erros);
  /* ========================================================================================
   * F. O ACORDEÃO «LANÇAR UMA AULA» ABRE E FECHA — e não desaparece ao clique
   *   O ouvinte era `renderCaptura` com o EVENTO: ao clicar fora do modo captura ele fazia
   *   `caixa.hidden = true` e o painel sumia («não expande, ele quebra»); dentro do modo
   *   captura, o `if (!caixa.open) caixa.open = true` reabria no mesmo gesto, e fechar era
   *   impossível. Quem manda no aberto/fechado é quem clica.
   * ====================================================================================== */
  console.log('\nF. O acordeão «Lançar uma aula»: abre, fecha, e não desaparece ao clique');
  if (!puppeteer || !executavel) {
    provar('o navegador existe para medir o acordeão', false, 'NÃO FEITO');
  } else {
    const { srv, base } = await bancada({ regraVelha: false });
    const nav = await puppeteer.launch({ executablePath: executavel, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    try {
      const p = await nav.newPage();
      await p.setViewport({ width: 390, height: 844 });
      const erros = [];
      p.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
      const estado = () => p.evaluate(() => {
        const c = document.getElementById('captura');
        return { hidden: c.hidden, open: c.open,
          visivel: !!(c.offsetWidth || c.offsetHeight),
          altura: Math.round(c.getBoundingClientRect().height) };
      });
      const clicar = () => p.evaluate(() => document.querySelector('#captura summary').click());

      await p.goto(`${base}/lancamento.html`, { waitUntil: 'networkidle0' });
      // O estado de CHEGADA (sem ciclo aberto): clicar abre e não faz o painel desaparecer.
      await clicar();
      await new Promise((r) => setTimeout(r, 250));
      const chegada = await estado();
      provar('na chegada, clicar no acordeão ABRE (e não o esconde)',
        chegada.open === true && chegada.hidden === false && chegada.visivel === true, chegada);

      // No modo captura, o gesto manda: fecha quando se fecha, abre quando se abre.
      await p.select('#ciclo', '01');
      await new Promise((r) => setTimeout(r, 300));
      await p.$eval('#senha', (n) => { n.value = 'a-senha-da-pessoa'; });
      await p.$eval('#abrir-ciclo', (b) => b.click());
      await new Promise((r) => setTimeout(r, 700));
      await p.select('#aula', '07');
      await new Promise((r) => setTimeout(r, 600));
      const aberto = await estado();
      await clicar();
      await new Promise((r) => setTimeout(r, 250));
      const fechado = await estado();
      await clicar();
      await new Promise((r) => setTimeout(r, 250));
      const reaberto = await estado();
      provar('no modo captura, o painel nasce aberto e com os campos',
        aberto.open === true && aberto.hidden === false && aberto.altura > 200, aberto);
      provar('…fecha-se quando se clica (o gesto do utilizador manda)',
        fechado.open === false && fechado.altura < aberto.altura / 2, fechado);
      provar('…e reabre no clique seguinte', reaberto.open === true && reaberto.altura > 200, reaberto);
      provar('…sem erro de página em nenhum gesto', erros.length === 0, erros);

      /* A CONTRAPROVA, e é o defeito a correr: com o ouvinte de antes — `renderCaptura` com
       * o evento —, clicar no resumo, com o ciclo JÁ ABERTO (a leitura em cena), esconde o
       * painel em vez de o abrir. É o «não expande, ele quebra» do relato, na sua forma exata. */
      const cp = await nav.newPage();
      await cp.setViewport({ width: 390, height: 844 });
      await cp.goto(`${base}/lancamento.html`, { waitUntil: 'networkidle0' });
      await cp.select('#ciclo', '01');
      await new Promise((r) => setTimeout(r, 300));
      await cp.$eval('#senha', (n) => { n.value = 'a-senha-da-pessoa'; });
      await cp.$eval('#abrir-ciclo', (b) => b.click());
      await new Promise((r) => setTimeout(r, 800));
      const ligou = await cp.evaluate(() => {
        const c = document.getElementById('captura');
        if (typeof renderCaptura !== 'function') return false;
        c.addEventListener('toggle', renderCaptura);   // a ligação de antes
        document.querySelector('#captura summary').click();
        return true;
      });
      const depois = await cp.evaluate(() => {
        const c = document.getElementById('captura');
        return { hidden: c.hidden, visivel: !!(c.offsetWidth || c.offsetHeight) };
      });
      provar('contraprova: com o ouvinte de ANTES, o clique ESCONDE o painel que devia abrir',
        ligou === true && depois.hidden === true && depois.visivel === false, depois);
      await cp.close();
    } finally { await nav.close(); srv.close(); }
  }

  }


  /* ========================================================================================
   * G. O VALIDADOR DE DADOS LÊ O TIPO QUE A CAPTURA DECLARA
   *   O primeiro lançamento com régua foi recusado pelo hook com dez erros do género
   *   «'Satisfatório' não é marca do formulário» — a regra media o registro errado, e o registro
   *   certo (o `captura-aula-NN.json` do pacote) estava ao lado. Sem a captura, o vocabulário
   *   fechado das marcas responde como sempre respondeu: a guarda não enfraquece por omissão.
   * ====================================================================================== */
  console.log('\nG. O validador de dados aceita a régua quando a captura a declara — e só então');
  {
    const { execFileSync } = require('child_process');
    const os = require('os');
    const validar = (arquivo) => {
      try {
        return { codigo: 0, saida: execFileSync(process.execPath,
          [path.join(RAIZ, 'tools/validar-dados-ciclo.js'), arquivo], { encoding: 'utf8' }) };
      } catch (e) { return { codigo: e.status || 1, saida: String((e.stdout || '') + (e.stderr || '')) }; }
    };

    const fonte = path.join(RAIZ, 'professores/rabo-gramde/ciclos/ciclo-01-calango-bale-nivel-1-teste-1-dados.json');
    const comConfig = validar(fonte);
    provar('com a captura ao lado, o lançamento com régua PASSA',
      comConfig.codigo === 0 && !/não é marca/.test(comConfig.saida),
      comConfig.saida.trim().split('\n').slice(0, 3));

    /* A CONTRAPROVA: o MESMO conteúdo, num sítio sem pacote e sem captura. Ali o validador não
     * sabe o tipo, e a régua deixa de passar — o vocabulário fechado das marcas é o de antes. */
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dados-sem-captura-'));
    const semConfig = path.join(tmp, path.basename(fonte));   // mesmo nome, sem a pasta do pacote
    fs.copyFileSync(fonte, semConfig);
    const soMarca = validar(semConfig);
    provar('…e sem a captura, o mesmo conteúdo é recusado pela regra das marcas (a guarda de antes)',
      soMarca.codigo !== 0 && /não é marca do formulário/.test(soMarca.saida),
      soMarca.saida.trim().split('\n').slice(0, 2));
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  /* ========================================================================================
   * H. A PÁGINA NO LUGAR EM QUE ELA É PUBLICADA — e a verdade sobre a senha
   *   O RELATO (06/11/2026, segunda volta): «eu coloco a senha, clico em abrir e ele diz que não
   *   abriu, o pacote não tem ciclo; as duas senhas de teste não funcionam; não sei qual é a
   *   senha que ele espera». As duas senhas estavam certas.
   *
   *   O BANCO DE PROVA MENTIA POR CONSTRUÇÃO: ele servia a página na RAIZ e resolvia o
   *   `/api/dados` por um stub que encontrava o ficheiro para qualquer nome. No ar a página é
   *   servida DENTRO do pacote (`/bale-nivel-1-teste-1/lancamento`), e o leitor do Worker
   *   procurava o ficheiro na raiz do site — onde ele não está. Daí em diante, cada mensagem da
   *   tela culpava a senha.
   *
   *   Aqui o banco tem a FORMA DA PUBLICAÇÃO: a raiz com o `nav.json`, o pacote com os seus
   *   documentos, e o leitor VERDADEIRO (`criarLeitorDeDados`) a resolver contra essa árvore.
   * ====================================================================================== */
  console.log('\nH. A página servida DENTRO do pacote — como no ar — abre o ciclo com a senha');
  if (!puppeteer || !executavel) {
    provar('o navegador existe para medir a página publicada', false, 'NÃO FEITO');
  } else {
    const PASTA = 'bale-nivel-1-teste-1';
    const MIME2 = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };

    async function bancadaPublicada({ leitorNaRaiz }) {
      const senhaCripto = 'senha-da-prova';
      const claro = fs.readFileSync(DADOS, 'utf8');
      const envelope = await Cifra.cifrar(claro, senhaCripto);
      // A árvore: na raiz só o `nav.json`; o pacote tem os documentos.
      const arvore = { ['nav.json']: '{"versao":2,"coluna":[],"barra":[]}',
        [PASTA + '/' + NOME]: JSON.stringify({ _cifrado: envelope }) };
      /* A RAIZ DO SITE, COMO NO AR: só o que está declarado na árvore. Os documentos do pacote
       * vêm do disco — mas SÓ debaixo da pasta dele. Sem esta disciplina, o nome sozinho
       * encontraria o ficheiro em `PACOTE/<nome>` no disco, e o banco de prova voltaria a mentir
       * a favor do leitor que procura no lugar errado. */
      const lerAsset = async (caminho) => {
        if (arvore[caminho]) return { corpo: new TextEncoder().encode(arvore[caminho]) };
        if (!String(caminho).startsWith(PASTA + '/')) return null;
        const disco = path.join(PACOTE, caminho.slice(PASTA.length + 1));
        if (fs.existsSync(disco) && fs.statSync(disco).isFile()) {
          return { corpo: fs.readFileSync(disco) };
        }
        return null;
      };
      const leitor = criarLeitorDeDados({
        senhaCripto, senhaOk: async (s) => s === 'a-senha-da-pessoa',
        lerAsset: leitorNaRaiz
          // O LEITOR DE ANTES: procurava o nome na raiz, e só na raiz.
          ? async (c) => (String(c).indexOf('/') === -1 ? lerAsset(c) : null)
          : async (c) => lerAsset(c),
      });
      const pedidos = [];
      const srv = http.createServer((req, res) => {
        const url = decodeURIComponent(req.url.split('?')[0]);
        if (req.method === 'POST' && url === '/api/dados') {
          let corpo = '';
          req.on('data', (d) => { corpo += d; });
          req.on('end', async () => {
            let p = {};
            try { p = JSON.parse(corpo); } catch (e) { p = {}; }
            pedidos.push(p.arquivo);
            const r = await leitor({ arquivo: p.arquivo, senha: p.senha });
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify(r));
          });
          return;
        }
        const rel = url.replace(/^\/+/, '');
        if (!rel.startsWith(PASTA + '/')) { res.writeHead(404); res.end('nao encontrado'); return; }
        const dentro = rel.slice(PASTA.length + 1);
        // O FORMULÁRIO É O DA FONTE (o gerador copia-o para o pacote).
        const alvo = dentro === 'lancamento.html'
          ? path.join(RAIZ, 'tools/templates/lancamento.html')
          : path.join(PACOTE, dentro);
        const DENTRO = alvo === path.join(RAIZ, 'tools/templates/lancamento.html') || alvo.startsWith(PACOTE);
        if (!DENTRO || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) {
          res.writeHead(404); res.end('nao encontrado'); return;
        }
        res.writeHead(200, { 'content-type': MIME2[path.extname(alvo)] || 'application/octet-stream',
          'cache-control': 'no-store' });
        res.end(fs.readFileSync(alvo));
      });
      const { port } = await new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ port: srv.address().port })));
      return { srv, base: `http://127.0.0.1:${port}/${PASTA}`, pedidos };
    }

    async function abrirPublicado({ leitorNaRaiz }) {
      const { srv, base, pedidos } = await bancadaPublicada({ leitorNaRaiz });
      const nav = await puppeteer.launch({ executablePath: executavel, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
      try {
        const p = await nav.newPage();
        await p.setViewport({ width: 390, height: 844 });
        const erros = [];
        p.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
        await p.goto(`${base}/lancamento.html`, { waitUntil: 'networkidle0' });
        // A CHEGADA: o ciclo vigente já vem escolhido, e ainda sem senha.
        const chegada = await p.evaluate(() => ({
          ciclo: (document.getElementById('ciclo') || {}).value,
          painel: (document.getElementById('captura-campos') || {}).textContent || '',
          paginacao: (document.getElementById('paginacao') || {}).innerHTML || '',
          barra: (() => { const b = document.querySelector('footer.barra-de-controle');
            return b ? { hidden: b.hidden, visivel: !!(b.offsetWidth || b.offsetHeight) } : null; })(),
          aviso: (document.getElementById('saida') || {}).textContent || '',
        }));
        await p.$eval('#senha', (n) => { n.value = 'a-senha-da-pessoa'; });
        await p.$eval('#abrir-ciclo', (b) => b.click());
        await new Promise((r) => setTimeout(r, 900));
        const aberto = await p.evaluate(() => ({
          texto: (document.getElementById('saida') || {}).textContent || '',
          paginacao: (document.getElementById('paginacao') || {}).innerHTML || '',
          barra: (() => { const b = document.querySelector('footer.barra-de-controle');
            return b ? { hidden: b.hidden, visivel: !!(b.offsetWidth || b.offsetHeight) } : null; })(),
        }));
        return { chegada, aberto, pedidos, erros };
      } finally { await nav.close(); srv.close(); }
    }

    const bom = await abrirPublicado({ leitorNaRaiz: false });
    provar('com a senha certa, o ciclo ABRE no pacote publicado',
      /Aula 06/.test(bom.aberto.texto) && bom.aberto.texto.length > 100,
      bom.aberto.texto.slice(0, 140));
    provar('…e o pedido de leitura leva a PASTA do pacote, não só o nome',
      bom.pedidos.some((a) => String(a || '').startsWith(PASTA + '/')), bom.pedidos);
    provar('…e sem erro de página', bom.erros.length === 0, bom.erros);
    /* NA CHEGADA, SEM SENHA, NÃO HÁ PAGINAÇÃO (06/11/2026): «tá aparecendo um rodapé para um
     * lugar que não tem paginação». Não há resultado nenhum, e «Página 1 de 0» não informa —
     * ocupa o pé da tela. */
    provar('na chegada, sem nada aberto, a paginação está vazia',
      bom.chegada.paginacao.trim() === '', bom.chegada.paginacao.slice(0, 80));
    provar('…e a barra do rodapé não aparece (não há o que folhear)',
      bom.chegada.barra && bom.chegada.barra.visivel === false, bom.chegada.barra);
    provar('…e a área de resultados pede a senha, sem falar em recusa',
      /senha/i.test(bom.chegada.aviso) && !/recusada/i.test(bom.chegada.aviso),
      bom.chegada.aviso.slice(0, 160));
    provar('…e o painel de lançamento diz que o ciclo NÃO ESTÁ ABERTO (e não «escolha um ciclo»)',
      /ainda não está aberto/i.test(bom.chegada.painel) && !/Escolha um ciclo/i.test(bom.chegada.painel),
      bom.chegada.painel.slice(0, 160));

    console.log('\nH.2 A contraprova: com o leitor de ANTES, a tela NÃO culpa a senha');
    const mau = await abrirPublicado({ leitorNaRaiz: true });
    provar('o defeito corre: o ciclo não abre', !/Aula 06/.test(mau.aberto.texto),
      mau.aberto.texto.slice(0, 140));
    provar('…e a frase NÃO diz «a senha foi recusada» — foi ela que a mandou caçar senha',
      !/recusada/i.test(mau.aberto.texto) && /não abriu|não é a senha/i.test(mau.aberto.texto),
      mau.aberto.texto.slice(0, 220));
    provar('…e o detalhe nomeia o arquivo que falta',
      /o pacote não tem/.test(mau.aberto.texto), mau.aberto.texto.slice(0, 400));
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: a regra do nome e o caminho do pacote aceitam a'
    + ' variante da turma e recusam o que sai do slug; o leitor devolve o ciclo em claro NO CAMINHO'
    + ' EM QUE ELE É PUBLICADO; o «Abrir» mostra a leitura e não salta para o lançamento; o acordeão'
    + ' obedece a quem clica; e as contraprovas — a regra velha, o leitor velho, o ouvinte velho —'
    + ' continuam a reprovar o nome, o caminho e o gesto.');
})().catch((erro) => { console.error(erro); process.exit(1); });
