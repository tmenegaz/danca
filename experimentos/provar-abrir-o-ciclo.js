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
 * O QUE ESTA PROVA FIXA:
 *
 *   A. A REGRA DO NOME é uma só (`motor/nucleo/lancamento.js`), aceita a variante com hífens e o
 *      carimbo, e continua a RECUSAR o que sai do alfabeto de slug — a rota recebe o nome do
 *      cliente, e um `../` leria outro arquivo do pacote.
 *   B. O LEITOR decifra o `-dados.json` de um ciclo de turma e o devolve em claro.
 *   C. O «ABRIR», no navegador: com a senha, a leitura aparece (e não um vazio — o vazio lia-se
 *      como «não abriu»), e o filtro NÃO salta para a aula que falta lançar.
 *   D. A CONTRAPROVA: com a regra VELHA, o mesmo clique devolve «arquivo de dados inválido» — o
 *      defeito, a correr. Sem ela a prova aprovaria qualquer coisa.
 *
 * Requer Chrome/Chromium para a parte C/D (puppeteer-core vem com o marp-cli global).
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

const { nomeDeDadosValido, varianteDoNomeDeDados } = require(path.join(RAIZ, 'motor/nucleo/lancamento.js'));
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
 * B. O leitor
 * ======================================================================================== */
console.log('\nB. O leitor decifra o ciclo de uma turma — e devolve o texto em claro');
(async () => {
  const senha = 'senha-da-prova';
  const claro = fs.readFileSync(DADOS, 'utf8');
  const envelope = await Cifra.cifrar(claro, senha);
  const leitor = criarLeitorDeDados({
    senhaCripto: senha,
    lerAsset: async (nome) => (nome === NOME
      ? { corpo: new TextEncoder().encode(JSON.stringify({ _cifrado: envelope })) }
      : null),
    senhaOk: async (s) => s === 'a-senha-da-pessoa',
  });

  const ok = await leitor({ arquivo: NOME, senha: 'a-senha-da-pessoa' });
  provar('devolve ok para o nome real', ok.ok === true, ok);
  provar('…e o que devolve é o JSON em claro, com a aula lançada',
    JSON.parse(ok.texto).aulas && Object.keys(JSON.parse(ok.texto).aulas).length > 0,
    ok.texto && Object.keys(JSON.parse(ok.texto).aulas || {}));

  const semSenha = await leitor({ arquivo: NOME, senha: 'errada' });
  provar('sem a senha certa, recusa', semSenha.ok === false && /senha/.test(semSenha.erro), semSenha);
  const invasor = await leitor({ arquivo: '../professores/x/ciclos/ciclo-01-dados.json', senha: 'a-senha-da-pessoa' });
  provar('…e um nome fora do padrão não chega ao ASSETS',
    invasor.ok === false && /inválido/.test(invasor.erro), invasor);

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
  }

  /* ========================================================================================
   * F. O VALIDADOR DE DADOS LÊ O TIPO QUE A CAPTURA DECLARA
   *   O primeiro lançamento com régua foi recusado pelo hook com dez erros do género
   *   «'Satisfatório' não é marca do formulário» — a regra media o registro errado, e o registro
   *   certo (o `captura-aula-NN.json` do pacote) estava ao lado. Sem a captura, o vocabulário
   *   fechado das marcas responde como sempre respondeu: a guarda não enfraquece por omissão.
   * ====================================================================================== */
  console.log('\nF. O validador de dados aceita a régua quando a captura a declara — e só então');
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

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: a regra do nome aceita a variante da turma e recusa'
    + ' o que sai do slug; o leitor devolve o ciclo em claro; o «Abrir» mostra a leitura e não salta'
    + ' para o lançamento; e a regra velha — a do defeito — continua a reprovar o nome real.');
})().catch((erro) => { console.error(erro); process.exit(1); });
