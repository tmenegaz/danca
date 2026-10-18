#!/usr/bin/env node
'use strict';

/**
 * provar-celular.js — a vista de trabalho cabe num TELEFONE.
 *
 * Por que existe. O `check-identidade.js` mede cor e papel; a `provar-tema.js`, o
 * comportamento da aparência. Nenhuma das duas vê LARGURA. Em 17/10/2026 a lista de
 * turmas do Produção estava acavalada no celular: o nome da turma ficava com 156px
 * enquanto os dois botões, que não encolhem (`white-space:nowrap`), ocupavam 126px
 * fixos — o nome quebrava em quatro linhas ao lado deles. Nada disso aparece num
 * teste de DOM: é geometria, e geometria se mede no navegador.
 *
 * O que ele faz. Extrai do `motor/servidor/bastidores.js` o bloco `<style>` do
 * Produção (o mesmo que o Worker serve, sem cópia), monta uma página com as formas
 * de linha que existem de facto e mede, em seis larguras, se cada uma se sustenta.
 *
 * O que ele NÃO faz. Não sobe o Worker nem precisa de KV: a vista é uma função pura
 * de dados, e o que se prova é a folha. Dados reais não mudam uma media query.
 *
 * Requer Chrome/Chromium (usa o puppeteer-core que vem com o marp-cli global), como
 * o `tools/check-overflow.js`. Sem ele o resultado é declarado NÃO FEITO — nunca
 * um «passou» silencioso.
 *
 * Uso:
 *   node experimentos/provar-celular.js
 *   CHROME_PATH=/usr/bin/chromium node experimentos/provar-celular.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');

/**
 * SERVIDOR ESTÁTICO MÍNIMO. Por que não `file://`: a porta pede a folha em
 * `/assets/style.css` — caminho ABSOLUTO de raiz, porque ela vive um nível abaixo do
 * pacote. Em `file://` isso resolve para `file:///assets/style.css`, que não existe: a
 * página abre SEM folha, e medir o desenho dela assim dá «campo cru» e «nada transborda»
 * em toda parte — dois resultados falsos, um alarme e um silêncio. Servir da raiz do
 * repositório é o que reproduz o que o Worker faz.
 */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
function servir() {
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    // O que um PACOTE é: a porta pede `/assets/style.css` e `/assets/nav.js`, que no
    // pacote gerado são as cópias da fonte. Aqui elas apontam para a própria fonte —
    // é o mesmo arquivo que o `gerar-ciclo.sh` copia.
    const mapa = {
      'assets/style.css': 'tools/templates/ciclo.css',
      'assets/nav.js': 'tools/templates/nav.js',
    };
    const tentativas = [mapa[rel], rel, path.join('porta', rel), path.join('raiz', rel)].filter(Boolean);
    const alvo = tentativas.map((x) => path.join(raiz, x))
      .find((x) => x.startsWith(raiz) && fs.existsSync(x) && !fs.statSync(x).isDirectory());
    if (!alvo) { res.writeHead(404); res.end('nao encontrado'); return; }
    // `no-store` NÃO É DETALHE: sem cabeçalho de cache o Chrome guarda a resposta por
    // heurística, e a segunda navegação à mesma página servia o CSS da PRIMEIRA. Foi o
    // que fez um controle negativo passar — a folha antiga parecia já corrigida.
    res.writeHead(200, {
      'content-type': TIPOS[path.extname(alvo)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(fs.readFileSync(alvo));
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}
const FONTE = path.join(raiz, 'motor/servidor/bastidores.js');
const FOLHA = path.join(raiz, 'tools/templates/ciclo.css');

// ---------------------------------------------------------------------------
// O CSS do Produção sai do próprio JS — nada de cópia que possa envelhecer.
// ---------------------------------------------------------------------------
function cssDaProducao() {
  const src = fs.readFileSync(FONTE, 'utf8');
  const i = src.indexOf("'.lateral{position:sticky");
  if (i < 0) throw new Error('bastidores.js: bloco de estilo da Produção não encontrado');
  const j = src.indexOf("'</style></head>", i);
  if (j < 0) throw new Error('bastidores.js: fim do bloco de estilo não encontrado');
  return [...src.slice(i, j).matchAll(/'((?:[^'\\]|\\.)*)'/g)]
    .map((m) => m[1].replace(/\\'/g, "'"))
    .join('\n');
}

// ---------------------------------------------------------------------------
// A página de prova: as formas de linha que o Produção realmente emite.
// ---------------------------------------------------------------------------
const MARCA = 'TURMA-MARCADA';

function pagina(css) {
  const selo = (classe, texto) => `<span class="selo ${classe}">${texto}</span>`;
  // O CARTÃO DA TURMA, NA FORMA DO HÍBRIDO (18/10/2026). O seletor de termo deixou de
  // viver num `.assoc` sempre aberto e passou para dentro do painel dos CONTEÚDOS — que
  // nasce fechado. Para a medida continuar a valer, o painel é aberto aqui (`hidden` fora):
  // a regra não mudou («o botão fica na mesma linha do seletor que ele lê»), mudou o lugar
  // onde ela se aplica. Uma prova que medisse um `<div class="assoc">` que já não existe
  // estaria a medir o passado.
  const turma = `<li class="turma">
    <div class="linha-turma">
      <span class="nome"><b>${MARCA}</b>
        ${selo('vinculada', 'vinculada')} ${selo('vigencia', 'ajustada em 16/10/2026')}</span>
      <span class="acoes">
        <button class="ajustar acao pequena">Derivar</button>
        <button class="apagar acao perigo pequena">Excluir</button>
      </span>
    </div>
    <div class="dono">RAD · Grade 1 · 2x/semana · seg, qua 19:00 · 60 min</div>
    <div class="metricas">
      <div class="metrica"><span class="k">Ritmo</span><span class="v">2x · 60 min</span>
        <button class="q" data-balao="ritmo" aria-expanded="false">?</button></div>
      <div class="metrica"><span class="k">Régua</span><span class="v">4 níveis</span>
        <button class="q" data-balao="regua" aria-expanded="false">?</button></div>
      <div class="metrica"><span class="k">Conteúdos</span><span class="v">3</span>
        <button class="q" data-balao="conteudos" aria-expanded="false">?</button></div>
    </div>
    <div class="painel" data-painel="conteudos">
      <div class="chips">
        <span class="chip">equilíbrio</span><span class="chip">apoio</span><span class="chip">transferência de peso</span>
      </div>
      <span class="par-associar">
        <select class="sel-termo"><option>— associar termo —</option><option>apoio</option></select>
        <button class="associar acao pequena">Associar</button>
      </span>
    </div>
  </li>`;

  const item = `<li><span class="nome"><b>Ana P.</b> <span class="dono">· Iniciadas A</span></span>
    <span class="acoes"><button class="acao pequena">Editar</button>
    <button class="apagar acao perigo pequena">Excluir</button></span></li>`;

  // A SEÇÃO COM ABAS. É o formato que o dono do produto viu acavalado: `Turmas` tem um
  // `.aba-painel` com grade PRÓPRIA dentro da `.secao`. Quando o `@media` desfazia só a
  // grade da `.secao`, esta continuava com duas colunas — a lista ficava ao lado do
  // formulário numa tela de telefone, e as duas se sobrepunham.
  const abas = `<section class="secao" id="sec-turmas">
    <h2>Turmas</h2>
    <div class="abas" role="tablist">
      <button type="button" class="aba ativo" role="tab" aria-selected="true">Turma</button>
      <button type="button" class="aba" role="tab" aria-selected="false">Criar rubrica</button>
    </div>
    <div class="aba-painel" id="aba-turma">
      <div class="col-form"><form id="form-turma">
        <label class="campo-rotulo" for="tnome">Nome da turma</label>
        <input id="tnome" placeholder="ex.: Balé Nível 1">
        <button type="submit" class="acao grande">Cadastrar turma</button>
      </form></div>
      <div class="col-lista" data-paginar data-por-pagina="7">
        <h3>Turmas cadastradas</h3>
        <div class="rolagem"><ul class="lista">${turma}${turma}</ul></div>
      </div>
    </div>
  </section>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${fs.readFileSync(FOLHA, 'utf8')}</style><style>${css}</style></head>
<body data-layout="painel" data-tela="bastidores"><div class="corpo">
<nav class="lateral" aria-label="Seções da Produção" data-aberta="nao">
  <div class="lateral-barra"><span class="lateral-atual"><small>Produção</small>
    <span>Painel inicial</span></span>
    <button type="button" class="lateral-abrir">Seções ▾</button></div>
  <div class="lateral-lista">
    <span class="lateral-puxador"></span>
    <h2>Produção</h2><a href="#" class="ativo">Painel inicial</a>
    <h2>Pessoas</h2><a href="#">Professores</a><a href="#">Alunas</a>
    <h2>Pedagogia</h2><a href="#">Turmas</a>
  </div>
  <div class="lateral-veu"></div>
</nav>
<div class="principal">
<div class="secao"><h2>Turmas</h2>
<form><label>Nome da turma<input></label><button class="acao">Cadastrar</button></form>
<div class="col-lista"><h3>Cadastradas</h3><div class="rolagem"><ul class="lista">
${turma}
${item}
</ul></div></div></div>
<div class="secao" id="sec-pilha"><h2>Pilha crua</h2>
<div class="col-form"><form id="pilha">
  <label class="campo-rotulo" for="p1">Nome</label>
  <input id="p1">
  <label class="campo-rotulo" for="p2">Sobrenome</label>
  <input id="p2">
  <label class="campo-rotulo" for="p3">Senha</label>
  <input id="p3" type="password">
  <button type="submit" class="acao grande">Cadastrar</button>
</form></div></div>
${abas}
</div></div></body></html>`;
}

// ---------------------------------------------------------------------------
// As medidas. Uma por defeito que se quer impedir de voltar.
// ---------------------------------------------------------------------------
const LARGURAS = [320, 360, 390, 414, 768, 1024];

function medir(page, largura) {
  return page.evaluate((w) => {
    const centro = (el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    };
    const doc = document.documentElement;
    const corpo = document.querySelector('.corpo');
    const lateral = document.querySelector('.lateral');
    const linha = document.querySelector('.linha-turma');
    const nome = linha.querySelector('.nome');
    const acoes = linha.querySelector('.acoes');
    const assoc = document.querySelector('.turma .painel[data-painel="conteudos"]');
    const select = assoc.querySelector('.sel-termo');
    const botao = assoc.querySelector('.associar');

    // A métrica de «mesma linha» é o CENTRO vertical: o nome tem 2–3 linhas de altura
    // e os botões uma só, então comparar os topos daria sempre «linhas diferentes».
    const mesmaLinha = (a, b) => Math.abs(centro(a) - centro(b)) < 6;

    return {
      largura: w,
      transbordo: doc.scrollWidth - doc.clientWidth,
      colunas: getComputedStyle(corpo).gridTemplateColumns.split(' ').length,
      colunasAba: (() => {
        const aba = document.querySelector('.aba-painel');
        if (!aba) return null;
        return getComputedStyle(aba).gridTemplateColumns.split(' ').length;
      })(),
      lateralAltura: Math.round(lateral.getBoundingClientRect().height),
      nomeLargura: Math.round(nome.getBoundingClientRect().width),
      nomeAltura: Math.round(nome.getBoundingClientRect().height),
      acoesMesmaLinha: mesmaLinha(nome, acoes),
      acoesLargura: Math.round(acoes.getBoundingClientRect().width),
      linhaLargura: Math.round(linha.getBoundingClientRect().width),
      assocTransborda: assoc.scrollWidth - assoc.clientWidth,
      vaoPilha: (() => {
        const c = document.getElementById('p3');
        const bt = document.querySelector('#pilha button');
        if (!c || !bt) return null;
        return Math.round(bt.getBoundingClientRect().top - c.getBoundingClientRect().bottom);
      })(),
      selectBotaoJuntos: mesmaLinha(select, botao),
      botaoDentro: Math.round(botao.getBoundingClientRect().right) <=
        Math.round(assoc.getBoundingClientRect().right) + 1,
    };
  }, largura);
}

// ---------------------------------------------------------------------------
const provas = [];
let falhou = 0;
function provar(descricao, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhou++;
  provas.push({ ok, descricao, obtido, esperado });
}

(async () => {
  const executablePath =
    process.env.CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executablePath) {
    console.error('provar-celular: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    console.error('  defina CHROME_PATH, ou rode onde houver navegador.');
    process.exit(1);
  }

  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (e) {
    console.error('provar-celular: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const { srv, base } = await servir();
  const css = cssDaProducao();
  const arquivo = path.join(require('os').tmpdir(), 'provar-celular.html');
  fs.writeFileSync(arquivo, pagina(css));

  const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();

  const medidas = [];
  for (const w of LARGURAS) {
    await page.setViewport({ width: w, height: 900 });
    await page.goto(`file://${arquivo}`, { waitUntil: 'load' });
    medidas.push(await medir(page, w));
  }

  // As OUTRAS superfícies não têm grade própria: são fluidas, e o que se prova nelas é
  // só o piso — nada transborda. Isto fecha a pergunta «há critério de celular no
  // sistema?» com uma medida, e não com uma leitura do CSS.
  const superficies = [
    ['porta (Área do Professor)', 'porta/index.html'],
    ['raiz (criar escola)', 'raiz/index.html'],
    ['lançamento de aula', 'tools/templates/lancamento.html'],
  ];
  const pacotes = fs.readdirSync(path.join(raiz, 'professores')).flatMap((prof) => {
    const dir = path.join(raiz, 'professores', prof, 'ciclos');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith('ciclo-'))
      .flatMap((e) => ['index.html', 'plano-observacao/index.html']
        .map((p) => `professores/${prof}/ciclos/${e.name}/${p}`)
        .filter((p) => fs.existsSync(path.join(raiz, p))));
  });
  for (const p of pacotes) superficies.push([p, p]);

  const transbordam = [];
  for (const [, rel] of superficies) {
    for (const w of [320, 390, 768]) {
      await page.setViewport({ width: w, height: 900 });
      await page.goto(`${base}/${rel}`, { waitUntil: 'load' });
      const excesso = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (excesso > 0) transbordam.push([rel, w, excesso]);
    }
  }
  // 1) Nada transborda na horizontal — em nenhuma largura. É o piso: o resto é conforto.
  provar('nenhuma largura transborda na horizontal', medidas.filter((m) => m.transbordo > 0).map((m) => m.largura), []);

  // 2) O menu de secções não come a primeira tela do celular. Era 248px de altura em
  //    coluna, virou uma faixa de ~80px, e desde 18/10/2026 é uma BARRA de uma linha com
  //    a lista dentro de uma folha (`position: fixed`, fora do fluxo): o que ocupa altura
  //    na página é só a barra. O teto de 120px continua generoso — a barra tem ~48px.
  const celulares = medidas.filter((m) => m.largura <= 768);
  provar('no celular o menu de secções não passa de 120px de altura',
    celulares.filter((m) => m.lateralAltura > 120).map((m) => [m.largura, m.lateralAltura]), []);

  // 3) O CORTE É UM SÓ. Em 768 a barra do topo já está no hamburger (ciclo.css); o
  //    corpo tem de estar numa coluna só. Antes o painel cortava em 760 e entre 761 e
  //    768 conviviam menu colapsado e menu lateral — navegação em dobro.
  provar('o painel é uma coluna só a partir do corte de celular (768)',
    medidas.filter((m) => m.largura <= 768 && m.colunas !== 1).map((m) => [m.largura, m.colunas]), []);

  // 4) O NOME DA TURMA NUNCA É ESPREMIDO. Ou ele divide a linha com os botões e tem
  //    pelo menos 14rem (o `flex-basis`), ou ele fica sozinho na linha e ocupa quase
  //    tudo. O defeito medido era 116px de nome contra 126px de botões.
  const espremidos = medidas
    .filter((m) => m.acoesMesmaLinha && m.nomeLargura < 224)
    .map((m) => [m.largura, m.nomeLargura]);
  provar('o nome da turma nunca fica abaixo de 14rem dividindo a linha com os botões', espremidos, []);

  // 5) Quando os botões descem, o nome fica com a linha inteira (não com um terço).
  const descem = medidas.filter((m) => !m.acoesMesmaLinha);
  provar('quando os botões descem, o nome ocupa a linha',
    descem.filter((m) => m.nomeLargura < m.linhaLargura - 4).map((m) => [m.largura, m.nomeLargura, m.linhaLargura]), []);

  // 6) O seletor de termo e o botão «Associar» andam JUNTOS — o botão lê o seletor.
  provar('o seletor de termo e o botão «Associar» ficam na mesma linha',
    medidas.filter((m) => !m.selectBotaoJuntos).map((m) => m.largura), []);
  provar('o botão «Associar» não sai do bloco de conteúdos',
    medidas.filter((m) => !m.botaoDentro).map((m) => m.largura), []);
  provar('o bloco de conteúdos não transborda',
    medidas.filter((m) => m.assocTransborda > 0).map((m) => m.largura), []);

  // 7) A SEÇÃO COM ABAS TEM DE COLAPSAR TAMBÉM. Este é o defeito que o dono do produto
  //    viu: em `Turmas` a lista continuava ao lado do formulário no telefone, porque o
  //    `.aba-painel` tem grade própria e o `@media` só desfazia a da `.secao`.
  provar('a seção com abas (Turmas) também fica numa coluna no celular',
    medidas.filter((m) => m.largura <= 1140 && m.colunasAba !== 1).map((m) => [m.largura, m.colunasAba]), []);

  // 8) As demais superfícies: em 320/390/768 nada transborda na horizontal.
  provar(`nenhuma das ${superficies.length} páginas servidas transborda em 320, 390 e 768`,
    transbordam, []);

  // 9) NENHUM CAMPO FICA CRU. O seletor de campo exigia `input[type=…]`, e 15 campos do
  //    sistema — o nome da escola, o do professor, a confirmação do expurgo — não têm o
  //    atributo `type`: caíam no desenho do navegador no meio de uma tela desenhada. Era
  //    isso que fazia os formulários parecerem «sem CSS». A conferência é por MEDIDA, não
  //    por regex: todo `input`/`select`/`textarea` visível tem de ter raio e altura de
  //    controle. Um seletor estreito de novo reprova aqui.
  const crus = [];
  // O `lancamento.html` NÃO entra: é um template de corpo, sem `<link>` — quem o veste
  // é o Pandoc, com `--css=assets/style.css` na geração. Aberto cru não tem folha, e
  // mediria o desenho do navegador em todo campo. A conferência dele é a do pacote.
  for (const [, rel] of superficies.filter(([, r]) => !r.includes('lancamento.html'))) {
    await page.setViewport({ width: 1024, height: 900 });
    await page.goto(`${base}/${rel}`, { waitUntil: 'load' });
    const achados = await page.evaluate(() => {
      const fora = [];
      for (const el of document.querySelectorAll('input, select, textarea')) {
        const t = (el.getAttribute('type') || '').toLowerCase();
        if (['hidden', 'checkbox', 'radio', 'submit', 'button', 'color', 'file', 'range'].includes(t)) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (el.closest('[hidden]')) continue;
        // Campo que não ocupa altura não está na tela: o painel dele está fechado.
        // Medir o desenho de um elemento que não renderiza daria «raio 0» sempre.
        if (el.getBoundingClientRect().height < 1) continue;
        const r = cs.borderRadius === '0px' ? 0 : parseFloat(cs.borderRadius);
        const alt = el.getBoundingClientRect().height;
        // O desenho do navegador tem raio 0 e altura ~20px. O controle do sistema tem
        // raio >= 8 e altura >= 36. Não há zona cinzenta entre os dois.
        if (r < 8 || alt < 36) {
          fora.push((el.id || el.name || el.tagName.toLowerCase()) + ` raio=${r} alt=${Math.round(alt)}`);
        }
      }
      return fora;
    });
    if (achados.length) crus.push([rel, achados.slice(0, 4)]);
  }
  provar('todo campo visível tem o desenho do sistema (raio >= 8, altura >= 36)', crus, []);

  // 10) TODO BOTÃO TEM OS QUATRO LADOS. `border: 1px solid` seguido de `border-bottom:
  //     none` deixa a base em 0 — e foi exactamente o que aconteceu: a regra que tirava
  //     o sublinhado pontilhado do `a.acao` estava na regra COMPARTILHADA e apagava a
  //     borda de baixo de todo `<button>`. O botão claro ficava sem caixa na base e
  //     parecia quebrado. A conferência é por MEDIDA: os quatro `border-*-width` iguais
  //     e > 0, em todo botão visível de toda superfície.
  const semBorda = [];
  for (const [, rel] of superficies.filter(([, r]) => !r.includes('lancamento.html'))) {
    await page.setViewport({ width: 1024, height: 900 });
    await page.goto(`${base}/${rel}`, { waitUntil: 'load' });
    const achados = await page.evaluate(() => {
      const fora = [];
      for (const el of document.querySelectorAll('button, a.acao')) {
        const rc = el.getBoundingClientRect();
        if (rc.height < 1 || rc.width < 1) continue;
        if (el.closest('[hidden]')) continue;
        const cs = getComputedStyle(el);
        const lados = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth']
          .map((p) => parseFloat(cs[p]));
        // O botão de hambúrguer e o `modal-x` são desenhados sem caixa de propósito.
        if (el.classList.contains('hamburger') || el.classList.contains('modal-x')) continue;
        if (lados.some((v) => v < 1) || new Set(lados).size !== 1) {
          fora.push((el.id || el.className || el.tagName) + ' → ' + lados.join('/'));
        }
      }
      return fora;
    });
    if (achados.length) semBorda.push([rel, achados.slice(0, 5)]);
  }
  provar('todo botão visível tem os quatro lados com a mesma espessura', semBorda, []);

  // 11) O MODAL QUE NÃO CABE ROLA, e a mensagem de resultado é alcançável. Era
  //     `align-items: center` num contêiner sem `overflow`: numa tela de 700px a caixa
  //     de 1112px começava em `top: -206px` e Cancelar/Criar ficavam abaixo da dobra sem
  //     nada que rolasse até eles — não dava para enviar nem cancelar no celular.
  // A ALTURA É 420, NÃO 700. Com 700 a caixa do formulário (já sem os textos
  // explicativos) CABE, e a conferência passaria sem exercitar o caso que interessa —
  // foi o que aconteceu na primeira versão. Um telefone em paisagem, ou um campo com o
  // teclado aberto, dá ~400px; é esse o cenário em que os botões sumiam.
  await page.setViewport({ width: 390, height: 420, isMobile: true, hasTouch: true });
  await page.goto(`${base}/raiz/index.html`, { waitUntil: 'load' });
  await page.evaluate(() => document.getElementById('btn-criar').click());
  await new Promise((r) => setTimeout(r, 300));
  const modal = await page.evaluate(() => {
    const m = document.querySelector('#modal-criar');
    const caixa = m.querySelector('.modal-caixa').getBoundingClientRect();
    m.scrollTop = m.scrollHeight;
    const c = document.getElementById('btn-cancelar').getBoundingClientRect();
    const criar = m.querySelector('[type=submit]').getBoundingClientRect();
    const vh = window.innerHeight;
    return {
      topoNegativo: caixa.top < 0,
      rola: getComputedStyle(m).overflowY === 'auto',
      cancelarAlcancavel: c.top >= 0 && c.bottom <= vh,
      criarAlcancavel: criar.top >= 0 && criar.bottom <= vh,
    };
  });
  // 12) O VÃO ENTRE O ÚLTIMO CONTROLE E O BOTÃO. Era 0: o `.acao` tem `margin: 0`, e a
  //     única coisa que afastava o botão era o acaso de ele estar dentro de um
  //     `.modal-acoes`. Numa pilha crua de formulário — a dos Bastidores — ficava colado.
  //     A primeira correção TAMBÉM deu 0, porque `:where(…) + .acao` (0,1,0) perde para
  //     `button.acao` (0,1,1). A conferência mede o pixel, não a intenção.
  provar('o botão depois de um campo tem 16px de ar',
    medidas.filter((m) => m.vaoPilha !== 16).map((m) => [m.largura, m.vaoPilha]), []);

  provar('no celular o modal rola em vez de cortar',
    [modal.rola, modal.topoNegativo], [true, false]);
  provar('…e Cancelar e Criar ficam alcançáveis depois de rolar',
    [modal.cancelarAlcancavel, modal.criarAlcancavel], [true, true]);

  await browser.close();
  srv.close();
  fs.unlinkSync(arquivo);

  // -------------------------------------------------------------------------
  const larguraMax = Math.max(...provas.map((p) => p.descricao.length));
  for (const p of provas) {
    if (p.ok) {
      console.log('ok     ' + p.descricao);
    } else {
      console.log('FALHA  ' + p.descricao);
      console.log('       esperado ' + JSON.stringify(p.esperado) + ' · obtido ' + JSON.stringify(p.obtido));
    }
  }
  console.log('');
  console.log('medido em ' + LARGURAS.join(', ') + 'px');
  console.log(`provar-celular: ${provas.length - falhou} de ${provas.length} passaram`);
  process.exit(falhou ? 1 : 0);
})().catch((e) => {
  console.error('provar-celular: ' + e.message);
  process.exit(1);
});
