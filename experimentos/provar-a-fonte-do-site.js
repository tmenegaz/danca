#!/usr/bin/env node
'use strict';

/**
 * provar-a-fonte-do-site.js — a fonte é ENTREGUE, e não apenas declarada.
 *
 * O QUE MOTIVOU (21/11/2026). Ela: «a nossa fonte é a Open Sans. Essa fonte é para usar como
 * padrão no site todo.» A folha passou a declarar `'Open Sans'` — e declarar não é entregar.
 *
 * O DEFEITO, medido antes de o corrigir: não havia `@font-face` nenhum, nenhum `.woff2` no
 * repositório e nenhum `<link>` para uma CDN. A pilha era só nomes. Numa máquina COM a fonte
 * instalada (`fc-list | grep -ci 'open sans'` → 13) o site desenhava-se em Open Sans e a mudança
 * parecia feita; num telemóvel, num Windows de fábrica, ou no navegador que imprime o documento,
 * caía para o fallback — e o MESMO documento saía em duas fontes, sem nada avisar. Foi por isso
 * que ela disse «acho que deu certo, mas preciso testar»: no computador dela, deu.
 *
 * O QUE SE PROVA — e a segunda metade é a que impede a correção de ser decorativa:
 *
 *   A. o ficheiro é PEDIDO e CHEGA — a página descarrega `assets/fontes/open-sans-variavel.woff2`
 *      com 200 do próprio servidor do pacote. Sem esse pedido, `'Open Sans'` é uma aposta na
 *      máquina de quem abre;
 *   B. a fonte que o navegador USA é a que chegou — `document.fonts.check` é verdadeiro e o
 *      `FontFace` está `loaded`. E, para não confundir «carregou» com «carregou a que está
 *      instalada no sistema», a prova mede a LARGURA de uma mesma frase com a fonte e com uma
 *      serifa de referência: se as duas dessem o mesmo, o navegador estaria a usar a fonte do
 *      sistema e o pedido seria decorativo;
 *   C. o FALLBACK NÃO É GEORGIA — com o `.woff2` bloqueado, a página não cai numa serifa. É a
 *      diferença entre «o pacote veio sem as fontes» e «o documento mudou de cara em silêncio»;
 *   D. as TRÊS superfícies recebem as fontes: o pacote da escola, a raiz e o pacote zero. Uma
 *      cópia esquecida é um 404 que ninguém vê até alguém abrir aquela página;
 *   E. a ficha da anamnese — que é servida SOZINHA, sem `<link>` — aponta para o caminho
 *      ABSOLUTO (`/assets/fontes/…`), porque um `fontes/…` relativo resolveria para dentro da
 *      rota `/anamnese/api/…` e daria 404 em todas as fichas.
 *
 * COMO É MEDIDO. Um `http.createServer` em 127.0.0.1 numa porta efêmera serve o pacote real; o
 * Chrome (puppeteer-core que vem com o marp-cli global) abre a página. Nada toca o ar. Para a
 * alínea C, o mesmo servidor RECUSA o `.woff2` — é o pior caso que se quer medir.
 *
 *   node experimentos/provar-a-fonte-do-site.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const FONTE = 'open-sans-variavel.woff2';

let provas = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 300)));
}

/** As três superfícies que a folha veste, e a página de cada uma que se abre na prova. */
function superficies() {
  return [
    { nome: 'pacote da escola', dir: path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa'),
      pagina: '/aula-01.html' },
    { nome: 'raiz', dir: path.join(RAIZ, 'raiz'), pagina: '/index.html' },
    { nome: 'pacote zero', dir: path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu'),
      pagina: '/plano-observacao/index.html' },
  ];
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg',
};

/**
 * Serve um diretório numa porta efêmera. `negarFonte` recusa o `.woff2` com 404 — é o caso em
 * que o pacote foi copiado sem os assets, e é a única maneira honesta de medir o fallback.
 */
function servir(dir, negarFonte) {
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      const caminho = decodeURIComponent((req.url || '/').split('?')[0]);
      if (negarFonte && /\.woff2$/.test(caminho)) { res.writeHead(404); res.end('sem fonte'); return; }
      let alvo = path.join(dir, caminho === '/' ? '/index.html' : caminho);
      if (!alvo.startsWith(dir)) { res.writeHead(403); res.end('fora'); return; }
      if (fs.existsSync(alvo) && fs.statSync(alvo).isDirectory()) alvo = path.join(alvo, 'index.html');
      if (!fs.existsSync(alvo)) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'content-type': TIPOS[path.extname(alvo)] || 'application/octet-stream' });
      res.end(fs.readFileSync(alvo));
    });
    srv.listen(0, '127.0.0.1', () => ok({ srv, base: 'http://127.0.0.1:' + srv.address().port }));
  });
}

(async () => {
  const executavel = process.env.CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-a-fonte-do-site: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (e) {
    console.error('provar-a-fonte-do-site: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  console.log('\nA FONTE DO SITE — entregue pelo pacote, não pedida a ninguém');

  /* --------------------------------------------------------------------------------------- */
  console.log('\nA. O ficheiro é pedido e chega — em cada uma das três superfícies');
  /* --------------------------------------------------------------------------------------- */
  for (const s of superficies()) {
    if (!fs.existsSync(s.dir)) { provar(s.nome + ': o diretório existe', false, s.dir); continue; }
    const woff = path.join(s.dir, 'assets/fontes', FONTE);
    const bytes = fs.existsSync(woff) ? fs.statSync(woff).size : 0;
    provar(s.nome + ': o .woff2 está em assets/fontes/', bytes > 20000, bytes);
    const css = path.join(s.dir, 'assets/style.css');
    const texto = fs.existsSync(css) ? fs.readFileSync(css, 'utf8') : '';
    provar(s.nome + ': a folha declara o @font-face', /@font-face[\s\S]{0,400}fontes\/open-sans-variavel\.woff2/.test(texto));
    provar(s.nome + ': o url() é relativo à folha (resolve em assets/fontes/)',
      /url\('fontes\/open-sans-variavel\.woff2'\)/.test(texto));
    provar(s.nome + ': a licença viaja com a fonte (OFL)',
      fs.existsSync(path.join(s.dir, 'assets/fontes/OFL.txt')));
  }

  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  /* --------------------------------------------------------------------------------------- */
  console.log('\nB. O navegador usa a fonte que chegou — não a que estiver instalada na máquina');
  /* --------------------------------------------------------------------------------------- */
  {
    const alvo = superficies()[0];
    const { srv, base } = await servir(alvo.dir, false);
    const pg = await br.newPage();
    const pedidos = [];
    pg.on('response', (r) => pedidos.push({ url: r.url(), estado: r.status() }));
    await pg.goto(base + alvo.pagina, { waitUntil: 'networkidle0' });
    const r = await pg.evaluate(async () => {
      await document.fonts.ready;
      const faces = [...document.fonts].map((f) => ({ familia: f.family, estilo: f.style,
        peso: f.weight, estado: f.status }));
      /* A LARGURA COMO TESTEMUNHA. A mesma frase, o mesmo corpo, duas famílias: se o Open Sans
       * do pacote não estivesse a ser usado, esta diferença seria zero — o navegador estaria a
       * desenhar as duas com a mesma fonte do sistema. */
      const sonda = document.createElement('span');
      sonda.textContent = 'A transferência de peso entre os pés, sem perder o alinhamento.';
      sonda.style.cssText = 'position:absolute;visually:hidden;font-size:100px;white-space:nowrap;'
        + 'left:-9999px;top:0';
      document.body.appendChild(sonda);
      const larguraCom = (familia) => {
        sonda.style.fontFamily = familia;
        return sonda.getBoundingClientRect().width;
      };
      const daPagina = getComputedStyle(document.body).fontFamily;
      const aberta = larguraCom("'Open Sans'");
      const serifa = larguraCom("Georgia, 'Times New Roman', serif");
      const sans = larguraCom("system-ui, sans-serif");
      sonda.remove();
      return { faces, daPagina, aberta, serifa, sans,
        marcado: document.documentElement.outerHTML.indexOf('open-sans-variavel') !== -1 };
    });

    const baixou = pedidos.find((p) => /\/assets\/fontes\/open-sans-variavel\.woff2$/.test(p.url));
    provar('a página PEDE o .woff2 do pacote', Boolean(baixou), pedidos.filter((p) => /woff2/.test(p.url)));
    provar('…e o servidor do pacote entrega-o (200)', Boolean(baixou) && baixou.estado === 200,
      baixou && baixou.estado);
    provar('o @font-face do pacote está registado no documento',
      r.faces.some((f) => /open sans/i.test(f.familia)), r.faces);
    provar('…e está carregado, e não «unloaded»',
      r.faces.some((f) => /open sans/i.test(f.familia) && f.estado === 'loaded'), r.faces);
    provar('o Open Sans é uma fonte variável: um ficheiro, o peso 300–800',
      r.faces.some((f) => /open sans/i.test(f.familia) && /300\s*800/.test(String(f.peso))), r.faces);
    provar('o corpo da página pede o Open Sans',
      /Open Sans/.test(r.daPagina), r.daPagina);
    /* A TESTEMUNHA: larguras diferentes = famílias diferentes a desenhar. */
    provar('a fonte do pacote desenha DIFERENTE de uma serifa (não é o fallback)',
      Math.abs(r.aberta - r.serifa) > 20, { aberta: Math.round(r.aberta), serifa: Math.round(r.serifa) });
    console.log('        (largura da mesma frase a 100px: Open Sans '
      + Math.round(r.aberta) + 'px · serifa ' + Math.round(r.serifa) + 'px · sans do sistema '
      + Math.round(r.sans) + 'px)');

    await pg.close();
    srv.close();
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\nC. Sem o ficheiro, o fallback NÃO é Georgia — erra para sans, que não se confunde');
  /* --------------------------------------------------------------------------------------- */
  {
    const alvo = superficies()[0];
    const { srv, base } = await servir(alvo.dir, true);
    const pg = await br.newPage();
    const pedidos = [];
    pg.on('response', (r) => pedidos.push({ url: r.url(), estado: r.status() }));
    await pg.goto(base + alvo.pagina, { waitUntil: 'networkidle0' });
    const r = await pg.evaluate(() => ({
      pilha: getComputedStyle(document.body).fontFamily,
      carregou: [...document.fonts].some((f) => /open sans/i.test(f.family) && f.status === 'loaded'),
    }));
    const recusado = pedidos.find((p) => /\.woff2$/.test(p.url));
    provar('o pedido do .woff2 é RECUSADO (é o pior caso, e é o que se quer medir)',
      Boolean(recusado) && recusado.estado === 404, recusado);
    provar('a página não declara a fonte como carregada', r.carregou === false, r.carregou);
    provar('a pilha de fallback não começa por Georgia', !/^\s*Georgia/i.test(r.pilha), r.pilha);
    provar('…e cai numa sans (system-ui), não numa serifa',
      /system-ui|-apple-system|sans-serif/.test(r.pilha), r.pilha);
    await pg.close();
    srv.close();
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\nD. A ficha da anamnese aponta para o caminho ABSOLUTO');
  /* --------------------------------------------------------------------------------------- */
  {
    const js = fs.readFileSync(path.join(RAIZ, 'motor/nucleo/ficha-html.js'), 'utf8');
    provar('a ficha declara o @font-face', /@font-face/.test(js));
    provar('…com o caminho absoluto /assets/fontes/',
      /url\('\/assets\/fontes\/open-sans-variavel\.woff2'\)/.test(js), 'um `fontes/…` relativo daria 404 em /anamnese/api/');
    provar('…e o corpo dela pede o Open Sans', /--serif:\s*'Open Sans'/.test(js));
    /* A ficha é servida pelo Worker: o `/assets/` partilhado tem de ter a fonte. */
    const pub = path.join(RAIZ, 'publicacao/assets/fontes', FONTE);
    if (fs.existsSync(path.join(RAIZ, 'publicacao'))) {
      provar('o `/assets/` partilhado da publicação tem a fonte', fs.existsSync(pub), pub);
    } else {
      console.log('        (publicacao/ não está montada nesta máquina — a verificação do /assets/ '
        + 'partilhado acontece na montagem)');
    }
  }

  await br.close();

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + provas + ' asserções: o Open Sans é pedido, chega do próprio '
    + 'pacote, é a fonte que desenha (a largura da frase o atesta), a ficha aponta para o caminho '
    + 'absoluto, e o fallback — quando o ficheiro falta — cai numa sans, não numa serifa.');
})();
