#!/usr/bin/env node
'use strict';

/**
 * provar-avisos.js — O RETORNO DE UM GESTO SAI DO FORMULÁRIO E VAI PARA O CANTO (19/11/2026).
 *
 * O pedido, na letra dela:
 *
 *   «Ao invés de colocar aqui dentro do formulário, vamos exibir na tela, no canto superior direito,
 *    essas mensagens, de êxito ou de erro ou de atenção, qualquer que seja ela. E elas são
 *    temporárias. Coloca que elas vão durar 8 segundos. Mesmo que elas fiquem uma sobre a outra, vão
 *    criando uma lista, mas cada uma dura 8 segundos. E também coloca um botão de fechar caso o
 *    usuário tenha pressa e queira fechar logo essas mensagens.»
 *
 * O QUE ESTA PROVA MEDE, e nada disto se vê na marcação:
 *
 *   A. A GEOMETRIA, num navegador de verdade: a pilha fica no CANTO SUPERIOR DIREITO da janela (o
 *      bordo direito a `--esp-4` da margem, o topo abaixo da faixa) — medido em duas larguras.
 *   B. A PILHA: dois avisos ficam um sobre o outro, o mais recente EM CIMA, e a pilha não tapa a
 *      página fora deles (`pointer-events: none` na zona, `auto` no aviso).
 *   C. O PRAZO: cada aviso sai sozinho aos 8 segundos — e o que foi fechado à mão não volta.
 *   D. O TIPO PINTA: `ok`, `erro` e `atencao` usam os três pares semânticos da folha, e um tipo
 *      inventado cai em `atencao` (o JavaScript não deixa nascer uma quarta cor).
 *   E. A ESTRUTURA, que não depende do navegador: o contentor está no casco da página (fora do
 *      `.conteudo`, ao lado do véu) e nasce vazio; a peça está declarada na folha; e o caminho de
 *      gravação que recarrega guarda o aviso antes de recarregar (senão ele morria no `reload`).
 *   F. O RECADO DA GERAÇÃO (19/11/2026): gravar um verbete ou um termo dispara a geração das Turmas
 *      que usam o exercício, e o canto tem de o dizer — que partiu (e leva minutos), que falhou (e
 *      os documentos ficam com a notação antiga), que não há ciclo (com o caminho), e o SILÊNCIO
 *      quando ninguém usa o exercício. Sem isto o trabalho acontecia e o professor não o via.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO MEDIDA.
 *
 *   node experimentos/provar-avisos.js
 */

const { execSync } = require('child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const FOLHA = path.join(RAIZ, 'tools/templates/ciclo.css');
const ESP_4 = 16; // px — `--esp-4`, a margem do canto que a peça declara.

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

function aPagina() {
  const b = require(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'));
  return b.paginaProducao('breu', { escola: 'breu' },
    [{ nome: 'Bri Volet', slug: 'bri', modalidades: ['Ballet Clássico'] }],
    ['abreu'], 'Brise Volet', 'brise-volet', [], [], {}, [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, null, [], new Set(),
    { ok: true, contrato: { plano: 'avancado', capacidade: {} } });
}

const MIME = { '.css': 'text/css;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

function servir(html) {
  return http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/bastidores/estudio') {
      res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (u.pathname.startsWith('/api/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, termos: [], alunos: [], linhas: [],
        professores: [], turmas: [], modalidades: [], tradicoes: {} }));
    }
    /* A FOLHA É A CONGELADA — `/assets/style.css` serve `tools/templates/ciclo.css`. Um 404 aqui
     * mediria a página sem desenho, e a posição do canto seria a de um `div` no fluxo. */
    const f = u.pathname === '/assets/style.css'
      ? FOLHA
      : path.join(RAIZ, 'tools/templates', u.pathname.replace('/assets/', ''));
    if (fs.existsSync(f) && fs.statSync(f).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      return res.end(fs.readFileSync(f));
    }
    res.writeHead(404); res.end('nao');
  });
}

(async () => {
  /* ---- E. A ESTRUTURA, antes do navegador: é dela que o resto depende ---- */
  const html = aPagina();

  bloco('E. A PEÇA EXISTE E O CONTENTOR VIVE NO CASCO');

  provar('o contentor `.avisos` está no casco, vazio e com a região anunciada',
    /<div class="avisos" id="avisos" role="status" aria-live="polite"><\/div>/.test(html), null);
  /* A ÂNCORA É `id="conteudo"`, e não `class="conteudo"`: esta página não tem a classe — o
   * contentor dela é identificado pelo `id`. A asserção é sobre a POSIÇÃO relativa: o aviso vem
   * depois (fora) e não dentro. */
  provar('…e fica FORA do `#conteudo`, depois de todas as secções — não pertence a nenhuma',
    html.indexOf('id="avisos"') > html.indexOf('id="conteudo"')
      && html.indexOf('id="avisos"') > html.lastIndexOf('class="secao"'), null);
  provar('a peça está declarada na folha, com os três tipos',
    /\.avisos \{/.test(fs.readFileSync(FOLHA, 'utf8'))
      && /\.aviso-do-gesto\[data-tipo="ok"\]/.test(fs.readFileSync(FOLHA, 'utf8'))
      && /\.aviso-do-gesto\[data-tipo="erro"\]/.test(fs.readFileSync(FOLHA, 'utf8'))
      && /\.aviso-do-gesto\[data-tipo="atencao"\]/.test(fs.readFileSync(FOLHA, 'utf8')), null);
  provar('o `prefers-reduced-motion` desliga a entrada, como manda a folha',
    /@media \(prefers-reduced-motion: reduce\) \{\s*\.aviso-do-gesto \{ animation: none; \}/.test(
      fs.readFileSync(FOLHA, 'utf8')), null);
  /* O AVISO ATRAVESSA A RECARGA. Sem esta chamada, o caminho de gravação que recarrega pintava um
   * aviso e apagava-o no instante seguinte — o pior dos dois mundos. */
  provar('a gravação que recarrega GUARDA o aviso antes de recarregar',
    /avisarDepoisDaRecarga\(d\.ajustou/.test(html) && /location\.reload\(\);/.test(html), null);
  provar('…e o arranque repinta o aviso guardado',
    /repintarAvisosGuardados\(\);/.test(html), null);
  provar('o prazo é de 8 segundos, e é POR AVISO',
    /setTimeout\(function\(\)\{ fecharAviso\(el\); \}, 8000\)/.test(html), null);
  provar('o aviso tem botão de fechar, com nome acessível',
    /aviso-do-gesto-fechar/.test(html) && /Fechar este aviso/.test(html), null);

  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executavel) {
    console.log('\n  —   NÃO MEDIDA a geometria: não há navegador nesta máquina.');
    console.log('      A prova mede posição e tempo reais; sem ele, não mede nada.');
    console.log('\n' + (falhas ? 'FALHOU — ' + falhas + ' de ' + total : 'TUDO CERTO — ' + total));
    process.exit(falhas ? 1 : 0);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (e) {
    console.log('\n  —   NÃO MEDIDA a geometria: puppeteer-core não encontrado (vem com o marp-cli).');
    process.exit(falhas ? 1 : 0);
  }

  const srv = servir(html);
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;

  const nav = await puppeteer.launch({ executablePath: executavel, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await nav.newPage();
  await pg.setViewport({ width: 1280, height: 900 });
  await pg.goto(base + '/bastidores/estudio', { waitUntil: 'networkidle0' });
  await pg.evaluate(() => {
    const g = document.getElementById('gate'); if (g) g.hidden = true;
    const c = document.getElementById('conteudo'); if (c) c.hidden = false;
  });

  /* ---- A. A GEOMETRIA DO CANTO ---- */
  bloco('A. O canto superior direito, medido a 1280 px');

  const medir = () => pg.evaluate(() => {
    const pilha = document.getElementById('avisos');
    const el = pilha && pilha.firstElementChild;
    if (!el) return null;
    const q = el.getBoundingClientRect();
    const p = pilha.getBoundingClientRect();
    return {
      janela: { w: window.innerWidth, h: window.innerHeight },
      aviso: { esquerda: Math.round(q.left), direita: Math.round(q.right), topo: Math.round(q.top),
        largura: Math.round(q.width), altura: Math.round(q.height) },
      pilha: { esquerda: Math.round(p.left), direita: Math.round(p.right), topo: Math.round(p.top),
        largura: Math.round(p.width) },
      pointerDaPilha: getComputedStyle(pilha).pointerEvents,
      pointerDoAviso: getComputedStyle(el).pointerEvents,
      zPilha: getComputedStyle(pilha).zIndex,
    };
  });

  await pg.evaluate(() => { avisar('ok', 'primeiro aviso'); });
  await new Promise((r) => setTimeout(r, 260));
  const um = await medir();

  provar('há um aviso na pilha', Boolean(um), null);
  provar('…encostado ao bordo DIREITO da janela, a 16 px dela',
    um && Math.abs(um.janela.w - um.aviso.direita - ESP_4) <= 1,
    um && { direita: um.aviso.direita, janela: um.janela.w });
  provar('…no TERÇO DE CIMA da janela — «canto superior»',
    um && um.aviso.topo < um.janela.h * 0.34, um && { topo: um.aviso.topo, janela: um.janela.h });
  provar('…abaixo da faixa do cabeçalho, e não por baixo dela',
    um && um.aviso.topo >= 0 && um.aviso.topo > 60, um && um.aviso.topo);
  provar('a pilha não recebe ponteiro — a zona não tapa a página',
    um && um.pointerDaPilha === 'none', um && um.pointerDaPilha);
  provar('…e o aviso recebe, para o «fechar» funcionar',
    um && um.pointerDoAviso === 'auto', um && um.pointerDoAviso);
  provar('a pilha fica acima do véu da operação (120)',
    um && Number(um.zPilha) > 120, um && um.zPilha);

  /* ---- B. A PILHA ---- */
  bloco('B. Uma lista de avisos, o mais recente em cima');

  await pg.evaluate(() => { avisar('erro', 'segundo aviso'); });
  await new Promise((r) => setTimeout(r, 260));
  const dois = await pg.evaluate(() => {
    const pilha = document.getElementById('avisos');
    return {
      quantos: pilha.children.length,
      primeiro: pilha.firstElementChild ? pilha.firstElementChild.textContent : '',
      ultimo: pilha.lastElementChild ? pilha.lastElementChild.textContent : '',
      tops: [...pilha.children].map((x) => Math.round(x.getBoundingClientRect().top)),
    };
  });
  provar('dois avisos convivem — «vão criando uma lista»', dois.quantos === 2, dois.quantos);
  provar('o mais recente fica EM CIMA', /segundo aviso/.test(dois.primeiro), dois.primeiro);
  provar('…e o anterior desce, em vez de ser empurrado para fora',
    /primeiro aviso/.test(dois.ultimo) && dois.tops[0] < dois.tops[1], dois.tops);

  /* ---- D. O TIPO PINTA ---- */
  bloco('D. O tipo pinta com os pares semânticos da folha');

  const cores = await pg.evaluate(() => {
    const pilha = document.getElementById('avisos');
    const ler = (tipo) => {
      while (pilha.firstChild) pilha.removeChild(pilha.firstChild);
      const el = avisar(tipo, 'x');
      const s = getComputedStyle(el);
      return { tipo: el.getAttribute('data-tipo'), fundo: s.backgroundColor, cor: s.color };
    };
    const ok = ler('ok');
    const erro = ler('erro');
    const atencao = ler('atencao');
    const inventado = ler('sucesso-magnifico');
    return { ok, erro, atencao, inventado };
  });
  provar('«ok», «erro» e «atencao» são três desenhos diferentes',
    cores.ok.fundo !== cores.erro.fundo && cores.erro.fundo !== cores.atencao.fundo
      && cores.ok.fundo !== cores.atencao.fundo, cores);
  provar('um tipo inventado cai em «atencao» — não nasce uma quarta cor',
    cores.inventado.tipo === 'atencao', cores.inventado);

  /* ---- C. O PRAZO E O FECHAR ---- */
  bloco('C. Oito segundos, e o «fechar» para quem tem pressa');

  const contagem = await pg.evaluate(() => {
    const pilha = document.getElementById('avisos');
    while (pilha.firstChild) pilha.removeChild(pilha.firstChild);
    avisar('ok', 'vai sair sozinho');
    avisar('ok', 'vai ser fechado à mão');
    const fechado = pilha.firstElementChild;
    fechado.querySelector('.aviso-do-gesto-fechar').click();
    return { depoisDoClique: pilha.children.length, comPrazo: Boolean(fechado.avisoPrazo) };
  });
  provar('o «fechar» tira o aviso do ecrã', contagem.depoisDoClique === 1, contagem);
  provar('…e cada aviso tem o seu prazo', contagem.comPrazo === true, contagem);

  /* O PRAZO É MEDIDO, e não lido: a prova espera os 8 segundos. É a única forma honesta de medir
   * um tempo — um `setTimeout(…, 8000)` no texto do script diz que alguém o escreveu, não que ele
   * corre. A espera é de 8,6 s, e o custo é dela. */
  console.log('        (a esperar 8,6 s pelo prazo do aviso…)');
  await new Promise((r) => setTimeout(r, 8600));
  const depois = await pg.evaluate(() => document.getElementById('avisos').children.length);
  provar('o aviso sai sozinho aos 8 segundos', depois === 0, depois);

  /* ---- F. O RECADO DA GERAÇÃO ---- */
  /* O DEFEITO QUE ISTO FECHA (19/11/2026). Com o T5 e o T6, gravar um verbete ou um termo passou a
   * disparar a geração das Turmas que usam o exercício — e o servidor devolve o que aconteceu em
   * `geracao`. As três telas que gravam liam `versao`/`ajustou`/`criouVersao` e ignoravam
   * `geracao`: o trabalho acontecia e ninguém o via. Mede-se AQUI, no navegador, porque a pergunta
   * é o que a pessoa lê no canto — e não o que a resposta traz. */
  bloco('F. O recado da geração — as três respostas, e o silêncio quando não há nada a refazer');

  const gerados = await pg.evaluate(() => {
    const pilha = document.getElementById('avisos');
    const limpar = () => { while (pilha.firstChild) pilha.removeChild(pilha.firstChild); };
    const correr = (g) => {
      limpar();
      /* DEGRADA, NÃO REBENTA — é o que faz o controlo negativo medir em vez de estourar: contra o
       * `bastidores.js` de antes desta correcção a função não existe, e sem esta guarda o
       * `pg.evaluate` morria num `ReferenceError` sem dizer quantas asserções falham. */
      if (typeof avisarDaGeracao === 'function') avisarDaGeracao(g);
      const el = pilha.firstElementChild;
      return {
        quantos: pilha.children.length,
        tipo: el ? el.getAttribute('data-tipo') : null,
        texto: el ? el.textContent : '',
      };
    };
    return {
      partiu: correr({ turmas: ['Rosa'], disparos: [{ turma: 'Rosa', ok: true, variante: 'breu-rosa' }] }),
      falhou: correr({ turmas: ['Rosa'], disparos: [{ turma: 'Rosa', ok: false, variante: 'breu-rosa' }] }),
      /* O `motivo` é o que o servidor sabe e o texto não deixava ver: qual dos dois casos foi. A
       * frase compõe-se dele, e a prova mede a frase — não o contrário. */
      semCiclo: correr({ turmas: ['Rosa', 'Lilás'], disparos: [], motivo: 'sem-plano' }),
      semToken: correr({ turmas: ['Rosa'], disparos: [], motivo: 'sem-token' }),
      ninguem: correr({ turmas: [], disparos: [] }),
      estourou: correr({ disparos: [], erro: 'sem GITHUB_TOKEN neste Worker' }),
      ausente: correr(undefined),
    };
  });

  provar('quando a geração PARTE, o canto diz que os documentos estão a ser refeitos',
    gerados.partiu.quantos === 1 && /ser refeitos/.test(gerados.partiu.texto),
    gerados.partiu);
  provar('…e nomeia a Turma pelo nome que a pessoa conhece, e não pela variante do pacote',
    /«Rosa»/.test(gerados.partiu.texto) && !/breu-rosa/.test(gerados.partiu.texto),
    gerados.partiu.texto);
  provar('…e avisa que leva minutos — o prazo do aviso não pode prometer o fim da geração',
    /alguns minutos/.test(gerados.partiu.texto), gerados.partiu.texto);
  provar('…em ATENÇÃO, e não em êxito: «gravado» está feito, a geração está a caminho',
    gerados.partiu.tipo === 'atencao', gerados.partiu.tipo);

  provar('quando o disparo FALHA, o canto di-lo — e não deixa o «gravado» sozinho a mentir',
    gerados.falhou.quantos === 1 && /não partiu/.test(gerados.falhou.texto)
      && /notação antiga/.test(gerados.falhou.texto), gerados.falhou);
  provar('…e nomeia a Turma que ficou por gerar', /«Rosa»/.test(gerados.falhou.texto),
    gerados.falhou.texto);

  provar('quando as Turmas usam o exercício mas não há ciclo, o canto diz o caminho',
    gerados.semCiclo.quantos === 1 && /plano de ensino/.test(gerados.semCiclo.texto),
    gerados.semCiclo);
  provar('…e nomeia as duas Turmas — «Rosa» e «Lilás»',
    /«Rosa»/.test(gerados.semCiclo.texto) && /«Lilás»/.test(gerados.semCiclo.texto),
    gerados.semCiclo.texto);
  provar('…e o caso do token é OUTRO, e diz-se de outra maneira',
    gerados.semToken.quantos === 1 && /GITHUB_TOKEN/.test(gerados.semToken.texto)
      && !/plano de ensino/.test(gerados.semToken.texto), gerados.semToken.texto);

  provar('quando NINGUÉM usa o exercício, o canto fica calado — não há documento a refazer',
    gerados.ninguem.quantos === 0, gerados.ninguem);
  provar('…e uma resposta sem `geracao` (um Worker de ontem) não parte nada',
    gerados.ausente.quantos === 0, gerados.ausente);

  /* 20/11/2026 — O AJUSTE FICA REPRESADO, e o que pode falhar passou a ser a LEITURA das Turmas (e
   * não um disparo). A frase mudou com o gesto: o que se promete ao canto é que o erro APARECE e
   * não se esconde atrás do «gravado». */
  provar('quando nem as Turmas se conseguem ler, o erro aparece — e não se esconde atrás do «gravado»',
    gerados.estourou.quantos === 1 && /ficou gravado/.test(gerados.estourou.texto)
      && /GITHUB_TOKEN/.test(gerados.estourou.texto), gerados.estourou);

  /* ---- A.2 A GEOMETRIA NO TELEMÓVEL ---- */
  bloco('A.2 No telemóvel a pilha atravessa o ecrã e desce para o fundo');

  await pg.setViewport({ width: 390, height: 780 });
  await new Promise((r) => setTimeout(r, 220));
  await pg.evaluate(() => { avisar('ok', 'no telemóvel'); });
  await new Promise((r) => setTimeout(r, 260));
  const telemovel = await pg.evaluate(() => {
    const el = document.getElementById('avisos').firstElementChild;
    if (!el) return null;
    const q = el.getBoundingClientRect();
    return { esquerda: Math.round(q.left), direita: Math.round(q.right),
      topo: Math.round(q.top), janelaW: window.innerWidth, janelaH: window.innerHeight };
  });
  provar('…cabe na largura — nada cortado à direita',
    telemovel && telemovel.direita <= telemovel.janelaW && telemovel.esquerda >= 0, telemovel);
  provar('…e fica ao alcance do polegar, na metade de baixo',
    telemovel && telemovel.topo > telemovel.janelaH / 2, telemovel);

  await nav.close();
  srv.close();

  console.log('\n' + (falhas
    ? 'FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).'
    : 'TUDO CERTO — ' + total + ' asserções: o aviso do gesto vive numa pilha no canto superior '
      + 'direito (16 px do bordo, abaixo da faixa), empilha com o mais recente em cima, usa os três '
      + 'pares semânticos da folha, sai sozinho aos 8 segundos e tem «fechar» para quem tem pressa; '
      + 'no telemóvel atravessa o ecrã e desce ao fundo.'));
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('erro na prova:', e && e.stack ? e.stack : e); process.exit(1); });
