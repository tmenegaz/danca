#!/usr/bin/env node
'use strict';

/*
 * provar-o-envio-da-aula.js — o «Enviar» do lançamento chega ao servidor (26/11/2026).
 *
 * O QUE ELA DISSE, e é o pedido inteiro: «Eu preenchi os campos, todos eles […] Coloquei a senha,
 * cliquei em enviar e nada foi enviado. Não deu certo.»
 *
 * O DIAGNÓSTICO, medido no Worker vivo e não lido no código: o botão não fazia NADA — nem pedido,
 * nem mensagem. A página carregava, o painel abria, os campos aceitavam tudo, e o clique morria
 * antes do `fetch`.
 *
 * A CAUSA, e é de âmbito: `coletarCaptura` (quem LÊ o formulário) chamava `tipoDaColuna`, que
 * existe apenas DENTRO de `camposCaptura` (quem o DESENHA). No bloco da linha de base — o único
 * com `secoes` — o nome não está no alcance: `ReferenceError: tipoDaColuna is not defined`. A
 * excepção subia de `gerarJson` sem ninguém a apanhar, e o clique lê-se como «não deu certo».
 *
 * PORQUE É QUE ISTO NUNCA TINHA SIDO APANHADO. Nenhuma prova exercia o ENVIO a sério: as provas
 * do lançamento medem o desenho dos campos e a leitura da página; esta mede o GESTO — preencher,
 * clicar, e ver o pedido sair com a aula lá dentro. E o defeito só dispara num ciclo cuja folha
 * tem o bloco da linha de base COM itens no PO — que é exactamente o ciclo que ela está a usar.
 *
 * O QUE SE AFIRMA, e cada alínea é uma coisa que falhava:
 *
 *   1. o clique em «Enviar» produz um `POST /api/receber` — o pedido existe;
 *   2. o corpo leva o ciclo, a senha e os arquivos;
 *   3. o ficheiro de dados enviado traz a AULA que se preencheu, com a marca da linha de base —
 *      ler o valor com o tipo da coluna é o que a função fora de alcance fazia;
 *   4. e a tela DIZ que enviou (o aviso não fica em branco);
 *   5. o controlo negativo: com o mesmo formulário e um campo obrigatório vazio, o pedido NÃO
 *      sai e o aviso diz o que falta — sem isto, uma página que enviasse sempre tudo passaria.
 *
 *   uso: node experimentos/provar-o-envio-da-aula.js
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.join(__dirname, '..');
/* O CICLO DELA, e não um de bancada: é este que tem a folha com `linha_de_base` e um PO com
 * itens — a combinação que faz o defeito disparar. */
const PACOTE = path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-piano');
const TEMPLATE = path.join(RAIZ, 'tools/templates/lancamento.html');

let n = 0;
let falhas = 0;
function conferir(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const MIME = { '.html': 'text/html;charset=utf-8', '.json': 'application/json;charset=utf-8',
  '.css': 'text/css', '.js': 'text/javascript' };

/* O DADO DO CICLO, EM CLARO E VAZIO. O do pacote é cifrado e traz 0 lançamentos; aqui ele entra
 * sem `_cifrado` para a página não precisar do Worker para abrir o ciclo — o que se mede nesta
 * prova é o ENVIO, e o pedido de leitura não pode ser a razão de ele não chegar. */
const DADOS = {
  _nota: 'dados de prova — não é o arquivo do pacote',
  ciclo: '01', escola: 'breu', aulas: {}, apelidos: { vava: 'Vavá' },
};

let PORTA = 0;
const pedidos = [];
const trocas = new Map();
/* A SENHA QUE O «WORKER» DA PROVA ACEITA — e o texto que ele devolve em claro. Ela é uma
 * constante porque o que se mede é o COMPORTAMENTO da página perante cada resposta, e não a
 * criptografia (essa tem prova própria, `provar-senha-do-lancamento`). */
const SENHA_BOA = 'senha-de-prova';
let textoEmClaro = null;

const servidor = http.createServer((req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORTA}`).pathname);
  const alvo = caminho.replace(/^\/+/, '');

  if (caminho === '/api/lancadas') {
    res.writeHead(200, { 'Content-Type': MIME['.json'] });
    return res.end(JSON.stringify({ ok: true, aulas: {} }));
  }
  /* O `/api/dados` DA PROVA faz o que o Worker faz: confere a senha e devolve o texto em claro.
   * Sem ele, o caminho «o ciclo não está aberto → o Enviar abre-o» não se podia exercitar em
   * bancada sem cifrar a sério e sem um Worker à frente. */
  if (caminho === '/api/dados') {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      const pedido = (() => { try { return JSON.parse(corpo); } catch (e) { return {}; } })();
      res.writeHead(200, { 'Content-Type': MIME['.json'] });
      if (pedido.senha !== SENHA_BOA) {
        return res.end(JSON.stringify({ ok: false, erro: 'senha não reconhecida' }));
      }
      res.end(JSON.stringify({ ok: true, texto: textoEmClaro }));
    });
    return;
  }
  if (caminho === '/api/receber') {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      pedidos.push({ caminho, corpo });
      res.writeHead(200, { 'Content-Type': MIME['.json'] });
      res.end(JSON.stringify({ ok: true, depois: { disparo: { ok: true } } }));
    });
    return;
  }
  /* A PÁGINA SERVIDA É O TEMPLATE (a fonte), e não a cópia publicada: o que se corrige é a fonte,
   * e medir o artefacto de ontem provaria o artefacto de ontem. */
  const conteudo = alvo === 'lancamento.html'
    ? fs.readFileSync(TEMPLATE)
    : (trocas.has(alvo) ? Buffer.from(trocas.get(alvo))
      : (() => {
        const arquivo = path.join(PACOTE, alvo);
        return arquivo.startsWith(PACOTE) && fs.existsSync(arquivo) && fs.statSync(arquivo).isFile()
          ? fs.readFileSync(arquivo) : null;
      })());
  if (!conteudo) { res.writeHead(404); return res.end('404 ' + alvo); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(alvo)] || 'application/octet-stream' });
  res.end(conteudo);
});

const espera = (win, ms = 80) => new Promise((r) => win.setTimeout(r, ms));
const PAGINA = () => `http://127.0.0.1:${PORTA}/lancamento.html`;

async function abrir() {
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => problemas.push(String((e && e.message) || e)));
  vc.on('error', (...a) => problemas.push(a.join(' ')));
  const dom = await JSDOM.fromURL(PAGINA(), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), PAGINA()), i);
      w.confirm = () => true;
      w.alert = () => {};
    },
  });
  await espera(dom.window, 400);
  return { win: dom.window, doc: dom.window.document, problemas };
}

/** Preenche o painel como uma pessoa: pelos campos que a página desenhou, não por uma lista. */
async function preencher(win, { deixarVazio = '' } = {}) {
  win.eval(`(function(){
    const set = (id, v) => { const x = document.getElementById(id); if (!x) return;
      x.value = v; x.dispatchEvent(new Event('change', { bubbles: true })); };
    const radio = (nome, v) => { const x = document.querySelector('input[name="' + nome +
      '"][value="' + v + '"]'); if (x) { x.checked = true;
      x.dispatchEvent(new Event('change', { bubbles: true })); } };
    const valores = ${JSON.stringify({ 'captura-data': '2026-11-26', 'captura-duracao': '60',
      'captura-animo': '3', 'captura-interesse': '4', 'captura-harmonia': '3',
      'captura-texto': 'aula de prova — o que aconteceu de novo' })};
    for (const [id, v] of Object.entries(valores)) set(id, v);
    radio('captura-plano', 'sim');
    radio('captura-surpreendeu', 'nao');
    const senha = document.getElementById('senha');
    if (senha) senha.value = 'senha-de-prova';
  })()`);
  // A linha de base: uma marca por item do PO, na célula que a matriz desenhou.
  win.eval(`(function(){
    const celulas = [...document.querySelectorAll('select[id^="lb-"]')];
    celulas.slice(0, 3).forEach((s) => {
      const op = [...s.options].find((o) => o.value);
      if (op) { s.value = op.value; s.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  })()`);
  /* A PRESENÇA POR ÚLTIMO, E DE PROPÓSITO — é a ordem em que uma pessoa faz: escreve, responde, e
   * no fim diz quem esteve. Marcar alguém RECONSTRÓI o painel, e é isso que se mede a seguir. */
  win.eval(`(function(){
    const pres = document.querySelector('input[id^="pres-"]');
    if (pres) { pres.checked = true; pres.dispatchEvent(new Event('change', { bubbles: true })); }
  })()`);
  await espera(win, 250);
  if (deixarVazio) win.eval(`(function(){ const x = document.getElementById(${JSON.stringify(deixarVazio)});
    if (x) { x.value = ''; x.dispatchEvent(new Event('change', { bubbles: true })); } })()`);
  await espera(win, 120);
}

async function clicarEnviar(win) {
  pedidos.length = 0;
  win.eval(`document.getElementById('gerar-json').click();`);
  await espera(win, 900);
}

(async () => {
  console.log('O ENVIO DA AULA — o clique chega ao servidor, e com a aula lá dentro\n');
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  PORTA = servidor.address().port;
  trocas.set('ciclo-01-breu-piano-dados.json', JSON.stringify(DADOS, null, 2) + '\n');

  /* ── 0. A FOLHA DESTE CICLO É A QUE FAZ DISPARAR O DEFEITO ─────────────────────────────── */
  const folha = JSON.parse(fs.readFileSync(path.join(PACOTE, 'captura-aula-01.json'), 'utf8'));
  const base = (folha.blocos || []).find((b) => b.chave === 'linha_de_base');
  conferir('a folha do ciclo tem o bloco da linha de base, com secções', Boolean(base && base.secoes),
    base && base.secoes);
  /* E O PO TEM ITENS NO CORPO — sem eles o ciclo do defeito não corre, e a prova estaria a medir
   * um caminho que ninguém percorre. */
  const po = JSON.parse(fs.readFileSync(path.join(PACOTE, 'po-01.json'), 'utf8'));
  const itensDoCorpo = (po.itensPorDimensao || []).filter((d) => /^corpo$/i.test(String(d.eixo)));
  conferir('…e o PO declara itens no eixo do corpo', itensDoCorpo.length > 0,
    itensDoCorpo.map((d) => d.dimensao));

  /* ── 1. O PAINEL ABRE E DESENHA OS CAMPOS ──────────────────────────────────────────────── */
  const { win, doc, problemas } = await abrir();
  conferir('o painel do lançamento abre com a aula 01', Boolean(doc.getElementById('captura-campos')),
    null);
  conferir('…e desenhou os campos do topo (data, duração, as três notas)',
    ['captura-data', 'captura-duracao', 'captura-animo', 'captura-interesse', 'captura-harmonia']
      .every((id) => Boolean(doc.getElementById(id))), null);
  conferir('…e a matriz da linha de base, uma célula por item do PO',
    doc.querySelectorAll('select[id^="lb-"]').length > 0,
    doc.querySelectorAll('select[id^="lb-"]').length);

  /* ── 2. O GESTO: PREENCHER E CARREGAR EM ENVIAR ────────────────────────────────────────── */
  await preencher(win);
  /* MARCAR A PRESENÇA RECONSTRÓI O PAINEL — e o que já estava respondido tem de sobreviver.
   * Era aqui que as duas perguntas de rádio voltavam a branco: quem as tinha respondido via-as
   * desaparecer, e o envio pedia outra vez uma resposta que já existia. */
  conferir('depois de marcar a presença, o «plano seguido» continua respondido',
    Boolean(win.eval(`(document.querySelector('input[name="captura-plano"]:checked') || {}).value`)),
    win.eval(`(document.querySelector('input[name="captura-plano"]:checked') || {}).value`));
  conferir('…e o «surpreendeu?» também',
    Boolean(win.eval(`(document.querySelector('input[name="captura-surpreendeu"]:checked') || {}).value`)),
    win.eval(`(document.querySelector('input[name="captura-surpreendeu"]:checked') || {}).value`));
  conferir('…e o texto do relatório não se perdeu',
    win.eval(`((document.getElementById('captura-texto') || {}).value || '')`).indexOf('aula de prova') >= 0,
    win.eval(`((document.getElementById('captura-texto') || {}).value || '')`));

  await clicarEnviar(win);

  conferir('o clique em «Enviar» produz um POST /api/receber', pedidos.length === 1,
    pedidos.map((p) => p.caminho));
  const corpo = pedidos.length ? JSON.parse(pedidos[0].corpo) : {};
  conferir('…o corpo diz o ciclo', corpo.ciclo === '01', corpo.ciclo);
  conferir('…leva a senha', corpo.senha === 'senha-de-prova', corpo.senha);
  conferir('…e leva os arquivos a gravar', Array.isArray(corpo.arquivos) && corpo.arquivos.length > 0,
    corpo.arquivos && corpo.arquivos.length);

  /* O FICHEIRO NOVO LEVA CARIMBO NO NOME (`…-dados-AAAA-MM-DDTHHMM.json`) — cada envio cria um
   * arquivo, e o índice passa a apontar para ele; o anterior não se reescreve. */
  const dadosEnviados = (corpo.arquivos || []).find((a) => /-dados-.*\.json$/.test(a.nome || ''));
  conferir('…entre eles o JSON de dados do ciclo, com carimbo no nome', Boolean(dadosEnviados),
    (corpo.arquivos || []).map((a) => a.nome));
  let gravado = null;
  try { gravado = dadosEnviados ? JSON.parse(dadosEnviados.texto) : null; } catch (e) { gravado = null; }
  const aula01 = gravado && gravado.aulas && gravado.aulas['01'];
  conferir('…com a aula 01 lá dentro', Boolean(aula01), gravado && Object.keys(gravado.aulas || {}));
  conferir('…e a marca da linha de base, lida com o tipo da coluna — é o que a função fora de '
    + 'alcance fazia', Boolean(aula01 && aula01.linha_de_base && aula01.linha_de_base.vava
      && aula01.linha_de_base.vava.length > 0),
    aula01 && aula01.linha_de_base);
  conferir('…e a marca que se escolheu chegou ao ficheiro',
    Boolean(aula01 && aula01.linha_de_base && aula01.linha_de_base.vava
      && aula01.linha_de_base.vava.some((m) => m.marca)), aula01 && aula01.linha_de_base);

  /* ── 3. A TELA DIZ QUE ENVIOU ──────────────────────────────────────────────────────────── */
  const aviso = doc.getElementById('aviso-json');
  conferir('a tela diz que enviou — o aviso não fica em branco',
    Boolean(aviso) && /lançamento enviado/i.test(aviso.textContent || ''), aviso && aviso.textContent);
  conferir('…e nenhum erro de JavaScript subiu sem resposta',
    !problemas.some((p) => /is not defined|ReferenceError/.test(String(p))), problemas.slice(0, 3));

  /* ── 4. O CONTROLO NEGATIVO: SEM O QUE É OBRIGATÓRIO, NÃO SE ENVIA ──────────────────────── */
  {
    const outra = await abrir();
    await preencher(outra.win, { deixarVazio: 'captura-texto' });
    await clicarEnviar(outra.win);
    const aviso2 = outra.doc.getElementById('aviso-json');
    conferir('com o relatório em branco, NADA é enviado', pedidos.length === 0,
      pedidos.map((p) => p.caminho));
    conferir('…e o aviso diz o que falta, em vez de ficar em branco',
      Boolean(aviso2) && /falta/i.test(aviso2.textContent || ''), aviso2 && aviso2.textContent);
  }

  /* ── 5. O «ABRIR» DO CICLO ENCONTRA O DADOS.JSON NA ÁRVORE PARTILHADA ───────────────────── */
  /*
   * O SEGUNDO DEFEITO DA MESMA TARDE, e ele só aparece na AULA SEGUINTE. Enquanto o ciclo tem
   * `lancamentos: 0` no invólucro, a página nem pede o ficheiro ao Worker — devolve a estrutura
   * vazia e o painel abre. A partir da primeira aula lançada o invólucro diz `lancamentos: 1`, a
   * página pede `/api/dados`, e o leitor do Worker procurava o ficheiro na RAIZ do ASSETS —
   * que no shard é `publicacao/`, e não `publicacao/<escola>/`.
   *
   * Resultado: o «Abrir» respondia «o pacote não tem …» para um ficheiro publicado e legível, e a
   * página contava isso como senha recusada. A aula 1 entrava; a 2 nunca abria.
   */
  {
    const fs2 = require('node:fs');
    const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));
    const ARVORE = path.join(RAIZ, 'publicacao');
    const pedidosAoAsset = [];
    const env = {
      ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', PACOTE_PARTILHADO: 'sim',
      SENHA_ADMIN: 'senha-de-prova', SENHA_CRIPTO: 'x', GITHUB_TOKEN: null,
      /* O KV só responde ao que a conferência de senha pergunta: a senha da direção vem do
       * ambiente (`SENHA_ADMIN`), e é isso que basta. */
      PADD_KV: { async get() { return null; }, async put() {}, async delete() {},
        async list() { return { keys: [], list_complete: true }; } },
      /* O ASSETS É O DE VERDADE — a árvore montada em `publicacao/`, com uma pasta por escola.
       * Um ASSETS de mentira com dois ficheiros provaria a minha ideia do caminho, e não o
       * caminho. */
      ASSETS: {
        async fetch(pedido) {
          const u = pedido instanceof URL ? pedido : new URL(pedido.url, 'https://assets.local');
          const rel = u.pathname.replace(/^\/+/, '');
          pedidosAoAsset.push(rel);
          const disco = path.join(ARVORE, rel);
          if (!fs2.existsSync(disco) || !fs2.statSync(disco).isFile()) {
            return new Response('nao encontrado', { status: 404 });
          }
          return new Response(fs2.readFileSync(disco),
            { status: 200, headers: { 'content-type': 'application/octet-stream' } });
        },
      },
    };
    const r = await producao.fetch(new Request('https://breu.padd.com.br/api/dados', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ arquivo: 'piano/ciclo-01-breu-piano-dados.json', senha: 'senha-de-prova' }),
    }), env);
    const corpoDados = await r.json().catch(() => null);
    const procurou = pedidosAoAsset.filter((p) => /dados\.json$/.test(p));
    conferir('o «Abrir» procura o dados.json DEBAIXO da escola, na árvore partilhada',
      procurou.includes('breu/piano/ciclo-01-breu-piano-dados.json'), procurou);
    /* O FICHEIRO É ENCONTRADO — o erro que sobra é da cifra, e é do banco (a chave de prova não é
     * a `SENHA_CRIPTO` da escola). O que se afirma é que ele NÃO é «o pacote não tem». */
    conferir('…e encontra o ficheiro: a resposta não é «o pacote não tem»',
      Boolean(corpoDados) && !/o pacote não tem/.test(String(corpoDados.erro || '')),
      corpoDados && corpoDados.erro);
  }

  /* ── 6. O «ENVIAR» ABRE O CICLO, EM VEZ DE MANDAR CARREGAR NOUTRO BOTÃO ──────────────────── */
  /*
   * O QUE ELA VIVEU, medido: lançou a aula 1 (gravou). A partir daí o ficheiro do ciclo diz
   * `lancamentos: 1`, e a página passa a exigir a senha para o abrir. Ela escreveu a senha — a
   * certa — e carregou em ENVIAR. A resposta foi «o ciclo ainda não está aberto — digite a senha
   * e clique em Abrir»: a senha estava lá, e o botão que faltava estava três ecrãs acima. Ela
   * foi procurar outra senha (2805, e depois 123, que é a certa).
   *
   * A partir daqui o ficheiro servido é o que o pacote serve depois do primeiro lançamento:
   * CIFRADO e com `lancamentos` > 0. É a diferença que faz o ciclo deixar de abrir sozinho.
   */
  console.log('\n6. O «Enviar» abre o ciclo com a senha do campo, em vez de mandar a outro botão');
  {
    textoEmClaro = JSON.stringify(DADOS);
    trocas.set('ciclo-01-breu-piano-dados.json', JSON.stringify({
      _cifrado: { algoritmo: 'PBKDF2-SHA256+AES-GCM', iteracoes: 100000, endereco: 'x', sal: 'y' },
      lancamentos: 1, apelidos: { vava: 'Vavá' },
      _nota: 'invólucro de prova — o texto em claro é servido pelo /api/dados da bancada',
    }));

    /* (a) SEM SENHA no campo: o ciclo não abre, e a mensagem aponta o CAMPO — não um botão. */
    const semSenha = await abrir();
    await preencher(semSenha.win);
    semSenha.win.eval(`(function(){ const s = document.getElementById('senha'); if (s) s.value = ''; })()`);
    await clicarEnviar(semSenha.win);
    const avisoSem = semSenha.doc.getElementById('aviso-json');
    conferir('sem senha no campo, nada é enviado', pedidos.length === 0, pedidos.length);
    conferir('…e a mensagem manda escrever a senha no CAMPO «Sua senha»',
      Boolean(avisoSem) && /Sua senha/i.test(avisoSem.textContent || ''),
      avisoSem && avisoSem.textContent);
    /* O ACORDEÃO FICA À VISTA COM A MENSAGEM (26/11/2026): fechado, escondia o botão Enviar —
     * o gesto que a própria mensagem pede. */
    conferir('…e o painel do lançamento está ABERTO, com o botão Enviar à vista',
      semSenha.doc.getElementById('captura').open === true,
      semSenha.doc.getElementById('captura').open);

    /* (b) SENHA ERRADA: a recusa diz «recusada», com a palavra certa — não «não está aberto». */
    const errada = await abrir();
    await preencher(errada.win);
    errada.win.eval(`(function(){ document.getElementById('senha').value = 'senha-errada'; })()`);
    await clicarEnviar(errada.win);
    const avisoErr = errada.doc.getElementById('aviso-json');
    conferir('com a senha errada, nada é enviado', pedidos.length === 0, pedidos.length);
    conferir('…e a recusa nomeia a senha, para não se procurar uma terceira',
      Boolean(avisoErr) && /senha não reconhecida/i.test(avisoErr.textContent || ''),
      avisoErr && avisoErr.textContent);

    /* (c) A SENHA CERTA NO CAMPO e um clique em ENVIAR: o ciclo ABRE — sem que ninguém tenha
     * carregado em «Abrir». É esta a correcção: a senha que já está no campo faz o que ela pede,
     * e não manda a pessoa a outro botão.
     *
     * E ELE NÃO ENVIA AINDA, e é correcto: enquanto o ciclo não abria, o painel não tinha campos
     * para preencher — o que está no ecrã é o pedido de senha. Abrir revela a aula que falta, e é
     * aí que se preenche. O que a asserção seguinte mede é o passo que faltava: preencher DEPOIS
     * de abrir, e então enviar. */
    const boa = await abrir();
    boa.win.eval(`(function(){ document.getElementById('senha').value = ${JSON.stringify(SENHA_BOA)}; })()`);
    await clicarEnviar(boa.win);
    const aviso6 = boa.doc.getElementById('aviso-json');
    conferir('com a senha certa no campo, o «Enviar» abre o ciclo sozinho',
      Boolean(aviso6) && /o ciclo abriu/i.test(aviso6.textContent || ''),
      aviso6 && aviso6.textContent);
    conferir('…e nada é enviado nesse clique — não havia campos preenchidos',
      pedidos.length === 0, pedidos.length);
    conferir('…e o filtro ficou na aula 01, que é a que falta',
      boa.win.eval(`sel.aula.value`) === '01', boa.win.eval(`sel.aula.value`));
    conferir('…e os campos da captura estão desenhados para ela',
      Boolean(boa.doc.getElementById('captura-data')), null);

    /* (d) AGORA preenche-se, e o envio SAI — o ciclo já está aberto, e a senha do campo continua
     * a autorizar a gravação. */
    await preencher(boa.win);
    await clicarEnviar(boa.win);
    conferir('preenchida a aula, o «Enviar» produz o POST', pedidos.length === 1, pedidos.length);
    const corpo6 = pedidos.length ? JSON.parse(pedidos[0].corpo) : {};
    conferir('…com a senha do campo no corpo', corpo6.senha === SENHA_BOA, corpo6.senha);
    conferir('…e com o ficheiro de dados lá dentro',
      (corpo6.arquivos || []).some((x) => /-dados-.*\.json$/.test(x.nome || '')),
      (corpo6.arquivos || []).map((x) => x.nome));
  }

  /* ── 7. ABRIR REVELA QUE A AULA JÁ ESTÁ LANÇADA — E O FILTRO AVANÇA, A DIZÊ-LO ───────────── */
  /*
   * «Criar a aula 2 e lançar os dados» foi o pedido dela. Depois da aula 1 lançada, o painel de
   * captura DESAPARECE para a aula 01 (é o comportamento certo) e não fica nada que diga onde
   * está o trabalho. Um painel que se fecha em silêncio lê-se como «não dá para lançar».
   */
  console.log('\n7. Depois de abrir, o filtro vai para a aula que falta — e diz que foi');
  {
    textoEmClaro = JSON.stringify({
      ciclo: '01', escola: 'breu-piano', apelidos: { vava: 'Vavá' },
      aulas: { '01': { data: '2026-11-26', duracao_min: 60, presentes: ['vava'], ausentes: [],
        condicoes_contorno: { plano_seguido: 'sim', animo: 4, interesse: 4, harmonia: 4, mudou: '' },
        relatorio: { texto: 'aula dada', surpresas: 'nao', ajustes: '' } } },
    });
    const jaLancada = await abrir();
    jaLancada.win.eval(`(function(){ document.getElementById('senha').value = ${JSON.stringify(SENHA_BOA)}; })()`);
    /* PRIMEIRO clique — o ciclo está por abrir: abre, e o filtro vai para a aula 01 (a primeira
     * sem dado no TEXTO servido, que tem a 01 lançada... por isso vai para a 02). */
    await clicarEnviar(jaLancada.win);
    const aviso7 = jaLancada.doc.getElementById('aviso-json');
    conferir('o ciclo abre e o filtro vai para a aula que FALTA — a 02',
      jaLancada.win.eval(`sel.aula.value`) === '02', jaLancada.win.eval(`sel.aula.value`));
    conferir('…e a tela diz que foi para a primeira sem dado, e que é ali que se preenche',
      Boolean(aviso7) && /primeira sem dado/i.test(aviso7.textContent || '')
        && /preencha/i.test(aviso7.textContent || ''), aviso7 && aviso7.textContent);
    conferir('…e o painel de captura está desenhado para a 02',
      Boolean(jaLancada.doc.getElementById('captura-data')), null);
    conferir('…e nada foi enviado — abrir não é lançar', pedidos.length === 0, pedidos.length);

    /* ESCOLHER A 01 À MÃO, com o ciclo já aberto: ela não é reenviada, e a recusa NOMEIA as duas
     * saídas — não uma lista de campos que não estão no ecrã. */
    jaLancada.win.eval(`(function(){ sel.aula.value = '01'; renderCaptura(); })()`);
    await new Promise((r) => jaLancada.win.setTimeout(r, 200));
    await clicarEnviar(jaLancada.win);
    const aviso7b = jaLancada.doc.getElementById('aviso-json');
    conferir('escolher a aula 01 à mão não a reenvia', pedidos.length === 0, pedidos.length);
    conferir('…e a recusa diz que ela já tem dado, e nomeia as duas saídas',
      Boolean(aviso7b) && /já tem dado/i.test(aviso7b.textContent || '')
        && /Ajustar lançamento/.test(aviso7b.textContent || ''),
      aviso7b && aviso7b.textContent);
    /* E O FILTRO NÃO SE MOVE SOZINHO: quem escolheu a 01 pode querer lê-la. Mexer no filtro
     * por cima de uma escolha deliberada é o mesmo defeito com o sinal trocado. */
    conferir('…e o filtro NÃO se move por cima da escolha de quem lê',
      jaLancada.win.eval(`sel.aula.value`) === '01', jaLancada.win.eval(`sel.aula.value`));
  }

  /* ── 8. O VALIDADOR CONCORDA COM A PÁGINA NO VOCABULÁRIO ─────────────────────────────────── */
  /*
   * O QUE ACONTECEU, e é o achado que fechou esta correcção: o lançamento dela foi **aceite pelo
   * servidor** e **recusado pelo validador do próprio repositório**. O `pre-commit` bloqueou o
   * commit seguinte com dez erros «'Domina' não é marca do formulário» sobre um registo verdadeiro.
   *
   * A causa: a `linha_de_base` é um bloco de ITENS (uma lista por aluna), e era a única coluna em
   * que o validador ainda exigia as cinco marcas. Só que a página, desde a decisão de 22/11 («uma
   * folha, uma régua»), desenha essa coluna como `rubrica` quando a folha mede critérios pela régua
   * da turma — e níveis como «Domina» passaram a ser legítimos. Duas regras, um dado só: a página
   * oferecia o que o validador recusava.
   *
   * A ASSERÇÃO QUE DISCRIMINA é o par (a)+(b): com a captura da aula, o registo dela PASSA; sem a
   * captura, o mesmo registo REPROVA. Sem a segunda, «alargar o validador» podia ter sido «desligar
   * o validador» — e o vocabulário fechado das marcas deixaria de guardar coisa nenhuma.
   */
  console.log('\n8. O validador e a página concordam no vocabulário — e a guarda antiga continua de pé');
  {
    const os = require('node:os');
    const { execFileSync } = require('node:child_process');
    const validator = path.join(RAIZ, 'tools/validar-dados-ciclo.js');

    /* O VALIDADOR ESCREVE OS ERROS EM `stderr` — e `execFileSync` engole-o quando lança. Ler só
     * `stdout` fazia a asserção do controlo negativo falhar com a resposta certa à frente: o
     * detalhe dizia «reprovou, como deve» e o teste dizia que não. Um leitor que não lê o canal
     * onde a mensagem está é o mesmo defeito do `grep` que não encontra o que existe. */
    const correr = (arquivo) => {
      try {
        const saida = execFileSync(process.execPath, [validator, arquivo],
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        return { ok: true, saida };
      } catch (e) {
        return { ok: false, saida: String((e && e.stdout) || '') + String((e && e.stderr) || '') };
      }
    };

    /* (a) O REGISTO DELA, como está na fonte. É esta a asserção que falhava. */
    const daFonte = path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-piano-dados.json');
    const r = correr(daFonte);
    conferir('o registo que o servidor aceitou PASSA no validador do repositório', r.ok,
      (r.saida.match(/não é marca do formulário/g) || []).length + ' erro(s) de marca');

    /* (b) O MESMO REGISTO, SEM a captura da aula: volta o vocabulário fechado, e «Domina» reprova.
     * É o controlo negativo — sem ele, o alargamento seria um desligamento. */
    const semCaptura = fs.mkdtempSync(path.join(os.tmpdir(), 'sem-captura-'));
    const copia = path.join(semCaptura, 'ciclo-01-prova-dados.json');
    fs.copyFileSync(daFonte, copia);
    const r2 = correr(copia);
    conferir('…e o MESMO registo, sem a captura da aula, REPROVA — o vocabulário fechado das marcas '
      + 'continua a guardar', !r2.ok && /não é marca do formulário/.test(r2.saida),
      r2.ok ? 'passou sem captura' : 'reprovou, como deve');

    /* (c) UMA MARCA INVENTADA continua a reprovar, MESMO com a captura. O domínio aberto é do
     * `rubrica` e do `texto`; a marca é fechada, e uma ferramenta que aceitasse tudo o que se lhe
     * escrevesse não estaria a validar nada.
     *
     * A FOLHA TEM DE SER DE BANCADA, e não a dela: na folha dela TODAS as colunas são `rubrica`
     * (é a decisão de 22/11), portanto uma marca inventada numa delas é, correctamente, aceite.
     * Para exercitar o vocabulário FECHADO é preciso uma coluna declarada `marca`. */
    const comCaptura = fs.mkdtempSync(path.join(os.tmpdir(), 'com-captura-'));
    const pastaDaCaptura = path.join(comCaptura, 'ciclo-01-prova');
    fs.mkdirSync(pastaDaCaptura, { recursive: true });
    fs.writeFileSync(path.join(pastaDaCaptura, 'captura-aula-01.json'), JSON.stringify({
      blocos: [{ chave: 'solo', titulo: 'solo', colunas: [{ chave: 'c1', rotulo: 'c1', tipo: 'marca' }] }],
    }));

    const mini = (valor) => ({
      _nota: 'fixture da prova — não é o arquivo de nenhum ciclo',
      ciclo: '01', escola: 'prova', professor: 'demi-plie', criado_em: '2026-11-26',
      po: 'po-de-prova', apelidos: { vava: 'Vavá' },
      aulas: {
        '01': {
          data: '2026-11-26', presentes: ['vava'], ausentes: [], duracao_min: 60,
          condicoes_contorno: { plano_seguido: 'sim', animo: 3, interesse: 3, harmonia: 3, mudou: '' },
          solo: { vava: { c1: valor } },
          relatorio: { texto: 'prova', surpresas: 'nao', ajustes: '' },
          ultimo_lancamento: '2026-11-26T15:00',
        },
      },
    });
    const arqInventado = path.join(comCaptura, 'ciclo-01-prova-dados.json');
    fs.writeFileSync(arqInventado, JSON.stringify(mini('marca-que-nao-existe'), null, 2) + '\n');
    const r3 = correr(arqInventado);
    conferir('…e uma marca inventada numa coluna declarada «marca» REPROVA',
      !r3.ok && /não é marca do formulário/.test(r3.saida),
      r3.ok ? 'passou' : 'reprovou, como deve');

    /* (d) O CONTROLO POSITIVO do mesmo par: a mesma folha, com uma marca do vocabulário. Sem ele,
     * o (c) podia estar a reprovar por qualquer outro motivo — e é o erro clássico de um controlo
     * negativo que nunca se viu passar. */
    fs.writeFileSync(arqInventado, JSON.stringify(mini('ok'), null, 2) + '\n');
    const r4 = correr(arqInventado);
    conferir('…e uma marca do vocabulário, na mesma folha, PASSA', r4.ok,
      r4.saida.split('\n').slice(0, 3).join(' | '));

    /* (d2) O RAMO QUE EU CORRIGI É O DOS ITENS, E NÃO O DAS PESSOAS — e a diferença importa.
     * O (c) caiu no `conferirBlocos` (bloco por pessoa: `{vava: {coluna: valor}}`), que já sabia
     * ler o tipo declarado. O defeito de hoje estava no `conferirItens` (lista por aluna:
     * `{vava: [{chave, item, marca}]}`), que é a forma da linha de base — e era o único sítio onde
     * o vocabulário continuava fechado. Uma prova que só exercitasse o (c) passaria sem o
     * `conferirItens` nunca ser chamado, e a correcção ficaria por medir.
     *
     * A FOLHA DECLARA A COLUNA `marca`: com ela, um valor inventado tem de reprovar. */
    fs.writeFileSync(path.join(pastaDaCaptura, 'captura-aula-01.json'), JSON.stringify({
      blocos: [
        { chave: 'solo', titulo: 'solo', colunas: [{ chave: 'c1', rotulo: 'c1', tipo: 'marca' }] },
        { chave: 'linha_de_base', titulo: 'linha de base',
          colunas: [{ chave: 'observado_na_aula', rotulo: 'observado', tipo: 'marca' }] },
      ],
    }));
    const comBase = (valor) => {
      const d = mini('ok');
      d.aulas['01'].linha_de_base = {
        vava: [{ chave: 'o_passe', item: 'o passé', marca: valor }],
      };
      return d;
    };
    fs.writeFileSync(arqInventado, JSON.stringify(comBase('inventada'), null, 2) + '\n');
    const rItens = correr(arqInventado);
    conferir('…numa LISTA por aluna declarada «marca», um valor inventado REPROVA pelo vocabulário',
      !rItens.ok && /linha_de_base[^\n]*não é marca/.test(rItens.saida),
      rItens.saida.split('\n').slice(0, 4).join(' | '));

    /* (d3) E A MESMA LISTA com a coluna declarada `rubrica` PASSA — é a correcção, isolada: os
     * níveis da régua são de domínio aberto na lista por aluna, como já eram no bloco por pessoa. */
    fs.writeFileSync(path.join(pastaDaCaptura, 'captura-aula-01.json'), JSON.stringify({
      blocos: [
        { chave: 'solo', titulo: 'solo', colunas: [{ chave: 'c1', rotulo: 'c1', tipo: 'marca' }] },
        { chave: 'linha_de_base', titulo: 'linha de base',
          colunas: [{ chave: 'observado_na_aula', rotulo: 'observado', tipo: 'rubrica' }] },
      ],
    }));
    fs.writeFileSync(arqInventado, JSON.stringify(comBase('Domina'), null, 2) + '\n');
    const rItensRubrica = correr(arqInventado);
    conferir('…e a MESMA lista declarada «rubrica» aceita «Domina» — é a correcção',
      !/linha_de_base[^\n]*não é marca/.test(rItensRubrica.saida),
      rItensRubrica.saida.split('\n').slice(0, 4).join(' | '));

    /* (e) E OS NÍVEIS DA RÉGUA na linha de base, com a captura dela: o caso que bloqueou o commit. */
    const r5 = correr(daFonte);
    conferir('…e o registo dela não tem NENHUM erro de marca na linha de base',
      !/linha_de_base[^\n]*não é marca/.test(r5.saida),
      (r5.saida.match(/linha_de_base[^\n]*não é marca/g) || []).length + ' erro(s)');

    fs.rmSync(semCaptura, { recursive: true, force: true });
    fs.rmSync(comCaptura, { recursive: true, force: true });
  }

  console.log('');
  servidor.close();
  if (falhas) { console.log('FALHOU — ' + (n - falhas) + '/' + n); process.exit(1); }
  console.log('TUDO CERTO — ' + n + ' asserção(ões).');
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
