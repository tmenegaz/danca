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

const servidor = http.createServer((req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORTA}`).pathname);
  const alvo = caminho.replace(/^\/+/, '');

  if (caminho === '/api/lancadas') {
    res.writeHead(200, { 'Content-Type': MIME['.json'] });
    return res.end(JSON.stringify({ ok: true, aulas: {} }));
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

  console.log('');
  servidor.close();
  if (falhas) { console.log('FALHOU — ' + (n - falhas) + '/' + n); process.exit(1); }
  console.log('TUDO CERTO — ' + n + ' asserção(ões).');
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
