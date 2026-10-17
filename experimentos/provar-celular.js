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

const raiz = path.resolve(__dirname, '..');
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
  const turma = `<li class="turma">
    <div class="linha-turma">
      <span class="nome"><b>${MARCA}</b> <span class="dono">seg e qua · 19h00</span>
        ${selo('vinculada', 'vinculada')} ${selo('vigencia', 'ajustada em 16/10/2026')}</span>
      <span class="acoes">
        <button class="ajustar acao pequena">Derivar</button>
        <button class="apagar acao perigo pequena">Excluir</button>
      </span>
    </div>
    <div class="dono">Régua da rubrica: presença · escuta · tônus</div>
    <div class="assoc"><span class="dono">Conteúdos:</span>
      <span class="chip">equilíbrio</span><span class="chip">apoio</span><span class="chip">transferência de peso</span>
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
<nav class="lateral" aria-label="Seções da Produção">
  <h2>Produção</h2><a href="#">Painel inicial</a>
  <h2>Pessoas</h2><a href="#">Professores</a><a href="#">Alunas</a>
  <h2>Pedagogia</h2><a href="#">Turmas</a>
</nav>
<div class="principal">
<div class="secao"><h2>Turmas</h2>
<form><label>Nome da turma<input></label><button class="acao">Cadastrar</button></form>
<div class="col-lista"><h3>Cadastradas</h3><div class="rolagem"><ul class="lista">
${turma}
${item}
</ul></div></div></div>
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
    const assoc = document.querySelector('.assoc');
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
      await page.goto(`file://${path.join(raiz, rel)}`, { waitUntil: 'load' });
      const excesso = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (excesso > 0) transbordam.push([rel, w, excesso]);
    }
  }
  await browser.close();
  fs.unlinkSync(arquivo);

  // 1) Nada transborda na horizontal — em nenhuma largura. É o piso: o resto é conforto.
  provar('nenhuma largura transborda na horizontal', medidas.filter((m) => m.transbordo > 0).map((m) => m.largura), []);

  // 2) O menu de secções não come a primeira tela do celular. Era 248px de altura em
  //    coluna; em faixa, cabe em ~80px. O teto é generoso, o defeito era 3× isso.
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
