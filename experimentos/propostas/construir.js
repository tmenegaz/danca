#!/usr/bin/env node
'use strict';

/*
 * construir.js — monta as PROPOSTAS de layout, autossuficientes e operáveis.
 *
 * PORQUE ISTO FOI REFEITO (21/10/2026). A primeira versão tinha duas falhas que a tornavam
 * inoperável, e as duas foram vistas antes de serem corrigidas:
 *
 *   1. O PAINEL TAPAVA O QUE ESTAVA A DEMONSTRAR. No celular a bancada ocupava 230 dos 390 px —
 *      59% da tela — e ficava por cima do rodapé de paginação que ela existe para mostrar. Não se
 *      avalia um comportamento de tela com outra coisa em cima dele.
 *   2. NÃO SE CHEGAVA A ELA DO TELEFONE. As páginas viviam em `file://`, e o que está a ser
 *      decidido é o comportamento NO CELULAR. Uma proposta que só se abre no computador de quem a
 *      escreveu não é uma proposta: é um ficheiro.
 *
 * O QUE MUDA AQUI:
 *
 *   · um painel que ABRE, EXPLICA e SAI DA FRENTE — e que se volta a chamar por uma aba fina na
 *     margem, que não tapa nem o rodapé nem o título;
 *   · cada opção com o seu custo medido, escrito ao lado — para escolher sem ter de decorar;
 *   · páginas AUTOSSUFICIENTES: o `ciclo.css` e o `nav.js` do projeto entram embutidos, e o
 *     resultado não depende de nenhum asset que o Git ignore;
 *   · as propostas são servidas pelo Worker em `/propostas/`, que é como se lhes chega pelo
 *     telefone (ver `tools/montar-publicacao.js --com-propostas`).
 *
 * O CSS NÃO É REESCRITO: é o `tools/templates/ciclo.css` — a fonte de verdade —, lido e embutido.
 * O conteúdo também não: o cabeçalho e o corpo vêm da Aula 01 publicada; o rodapé vem do
 * `tools/templates/lancamento.html`. Se a fonte mudar, a proposta muda com ela.
 *
 *   node experimentos/propostas/construir.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
const SAIDA = __dirname;

const CSS = fs.readFileSync(path.join(RAIZ, 'tools', 'templates', 'ciclo.css'), 'utf8');
const NAVJS = fs.readFileSync(path.join(RAIZ, 'tools', 'templates', 'nav.js'), 'utf8');
/* A AULA É DESCOBERTA, não nomeada (21/10/2026). O construtor lia o nome de uma escola
 * escrita à mão — e as escolas deste protótipo são descartáveis por desenho: expurgada a
 * escola, as bancadas deixavam de se construir, embora o que elas mostrem (o cabeçalho e o
 * corpo de um documento longo) não dependa de qual escola é. Ver `../lib-pacote.js`. */
const { relatorioDePacotes, umPacote, umaPagina } = require('../lib-pacote.js');
/* SEM PACOTE GERADO, NÃO HÁ BANCADA — e isso é uma AUSÊNCIA, não uma avaria (27/10/2026).
 *
 * O QUE ACONTECEU. O expurgo da `batata` levou o único pacote de ciclo gerado do repositório, e a
 * `breu` nasceu como esqueleto (ciclo-zero, sem `DOCS`): não há `aula-NN.html` em sítio nenhum. O
 * `umPacote()` do `lib-pacote` falha alto — e faz bem, porque as PROVAS que o usam medem um pacote
 * real e medir o vazio seria pior. Mas este ficheiro não é uma prova: é o construtor das bancadas,
 * e o que ele alimenta é o passo «Construir as bancadas de layout» do `deploy-escolas.yml`, que
 * corre com `set -euo pipefail`. Resultado medido: a publicação das escolas passou a falhar em
 * TODOS os deploys, por causa de uma página de bancada.
 *
 * O QUE SE FAZ: diz-se e segue-se. O `montar-publicacao.js --com-propostas` já trata este caso —
 * avisa «pedido sem propostas montadas» e publica o resto, e é essa a degradação declarada que o
 * projeto escolheu para esta opção. O que NÃO se faz é sair em silêncio: a mensagem diz o que
 * falta e onde se gera.
 *
 * O `throw` seguinte FICA: um pacote que existe e não tem página de aula é uma anomalia a sério, e
 * essa não se degrada. */
/* A AUSÊNCIA É EXPLICADA PELO REGISTRO, E NÃO AFIRMADA AQUI (27/10/2026).
 *
 * O QUE ISTO SUBSTITUI, e porquê. A primeira correção foi um `if (!pacotes().length) exit(0)`
 * com uma frase fixa — «sem pacote de ciclo gerado». A pesquisadora recusou-a, e tinha razão: a
 * frase afirma sem consultar, e não distingue o que o sistema já sabe distinguir. «Não há
 * pacote» cobre três estados diferentes, e cada um pede uma acção:
 *
 *   · a escola foi EXPURGADA (estado normal e registado — nada a fazer);
 *   · a escola é NOVA e ainda não tem ciclo gerado (nada a fazer até gerar);
 *   · a escola está viva com ciclo e os ficheiros desapareceram (AVARIA — a única que pede mão).
 *
 * `relatorioDePacotes()` lê `escola/<slug>/indice.json` com a regra única do `foiRecriada`, e o
 * que se imprime passa a ser o ESTADO, não a minha suposição. É o que faz «não existe» deixar de
 * ser uma frase e passar a ser um facto com data.
 *
 * PORQUE NÃO SE FALHA. Uma página de bancada não é razão para deixar uma escola sem publicar — e
 * era isso que acontecia: o passo do `deploy-escolas.yml` corre com `set -euo pipefail`, e as
 * bancadas já degradam sozinhas no `montar-publicacao.js --com-propostas` («pedido sem propostas
 * montadas»). O `umPacote()` do `lib-pacote` continua a falhar alto, e deve: uma PROVA mede o
 * real. Este ficheiro não é uma prova.
 */
/* NEM TODA A BANCADA MEDE UMA AULA (02/11/2026).
 *
 * A proposta da listagem dos verbetes não mede documento nenhum: ela lê o ALFABETO, que está
 * versionado e existe sempre. Só a do título precisa da Aula 01 de um pacote real.
 *
 * Era tudo ou nada: sem pacote, o construtor saía e não escrevia nada — e a bancada do verbete
 * ficava sem poder existir numa escola nova, que é exactamente quando ela é precisa. Passa a
 * construir o que pode, e a página que não pode medir diz que não pode, com o motivo do registro.
 * O diagnóstico que se imprime é o mesmo; o que muda é deixar de ser uma sentença.
 */
const RELATORIO_DE_PACOTES = relatorioDePacotes();
{
  const relatorio = RELATORIO_DE_PACOTES;
  if (!relatorio.usados.length) {
    console.error('construir: nenhuma escola tem ciclo gerado — a bancada do título mede a');
    console.error('  Aula 01 de um pacote REAL, e não há nenhum para medir. Ela sai como aviso;');
    console.error('  as outras constroem-se.');
    for (const p of relatorio.pulados) {
      console.error('  desconsiderado: ' + p.pacote + ' — ' + p.escola + ' ' + p.motivo);
    }
    const vivas = relatorio.escolas.filter((e) => e.viva).map((e) => e.slug);
    console.error('  escolas vivas: ' + (vivas.length ? vivas.join(', ') : '(nenhuma)'));
    const expurgadas = relatorio.escolas.filter((e) => !e.viva);
    if (expurgadas.length) {
      console.error('  fora do registro, por expurgo: ' + expurgadas.length + ' escola(s) — '
        + expurgadas.map((e) => e.slug + ' (' + (e.ultimo_expurgo || '?') + ')').join(', '));
        console.error('  para as bancadas voltarem: gere um ciclo (tools/gerar-ciclo.sh).');
    }
    /* AS PÁGINAS DE ONTEM SAEM. São saída (o `.gitignore` fecha `experimentos/propostas/*`), e
       num checkout limpo não existem — o CI avisa «sem propostas montadas» e publica o resto.
       Aqui, na bancada de quem já construiu, elas FICARIAM, e o `montar-publicacao` as levaria
       como se fossem desta publicação: uma página a dizer que mede «a Aula 01 real» sobre um
       pacote que já não existe. Apagar é o que faz o local e o CI concordarem. */
    try {
      for (const nome of fs.readdirSync(SAIDA)) {
        if (/^proposta-.*\.html$/.test(nome) || nome === 'index.html') {
          fs.unlinkSync(path.join(SAIDA, nome));
        }
      }
    } catch (e) { /* sem pasta, não há o que apagar */ }
    /* O `process.exit(0)` SAIU (02/11/2026), e a limpeza fica. Ela existia porque, sem pacote,
       a página de ontem ficava e o `montar-publicacao` a levava como se fosse desta publicação.
       Continua a fazer falta: o que sai agora é a página do título — a única que mede a aula —,
       e as outras constroem-se. */
  }
}
const PACOTE_DA_AULA = RELATORIO_DE_PACOTES.usados.length ? RELATORIO_DE_PACOTES.usados[0] : null;
const PAGINA_DA_AULA = PACOTE_DA_AULA ? umaPagina(PACOTE_DA_AULA, /^aula-\d{2}\.html$/) : null;
if (PACOTE_DA_AULA && !PAGINA_DA_AULA) {
  throw new Error('construir: o pacote «' + PACOTE_DA_AULA + '» não tem página de aula — a '
    + 'proposta do título mede o cabeçalho e o corpo de um documento real, e sem ele não há '
    + 'o que mostrar.');
}
const AULA = PACOTE_DA_AULA ? path.join(RAIZ, PACOTE_DA_AULA, PAGINA_DA_AULA) : null;
const LANCAMENTO = path.join(RAIZ, 'tools', 'templates', 'lancamento.html');

// --------------------------------------------------------------------------- peças do projeto

/** O cabeçalho e o corpo REAIS da Aula 01 — a página longa que motivou o pedido. */
function conteudoDaAula() {
  const fonte = fs.readFileSync(AULA, 'utf8');
  const cabecalho = /<header class="doc">[\s\S]*?<\/header>/.exec(fonte);
  const corpo = /<main>[\s\S]*?<\/main>/.exec(fonte);
  if (!cabecalho || !corpo) throw new Error('a aula-01 não tem cabeçalho ou corpo — a montagem parou');
  return {
    cabecalho: cabecalho[0]
      .replace('<header class="doc">', '<header class="doc" id="cabecalho">')
      .replace('<h1>', '<h1 id="titulo">'),
    corpo: corpo[0],
  };
}

/** O `<footer class="barra-de-controle">` do lançamento — a marcação de produção, tal e qual. */
function rodapeDoLancamento() {
  const fonte = fs.readFileSync(LANCAMENTO, 'utf8');
  const m = /<footer class="barra-de-controle">([\s\S]*?)<\/footer>/.exec(fonte);
  if (!m) throw new Error('o rodapé não foi encontrado no template — a montagem parou');
  return m[1];
}

/** O CSS da barra do lançamento, em REGRAS COMPLETAS (não em linhas cortadas). */
function cssDaBarraDoLancamento() {
  const fonte = fs.readFileSync(LANCAMENTO, 'utf8');
  const bloco = /<style>([\s\S]*?)<\/style>/.exec(fonte);
  if (!bloco) return '';
  const texto = bloco[1];
  const regras = [];
  let profundidade = 0;
  let inicio = 0;
  for (let i = 0; i < texto.length; i += 1) {
    if (texto[i] === '{') profundidade += 1;
    else if (texto[i] === '}') {
      profundidade -= 1;
      if (profundidade === 0) { regras.push(texto.slice(inicio, i + 1)); inicio = i + 1; }
    }
  }
  return regras.filter((r) => /barra-de-controle|\.paginacao|\.fraco/.test(r)).join('\n').trim();
}

// ------------------------------------------------------------------------ a bancada (comum)

/*
 * O PAINEL É UM COMPONENTE SÓ, e é o mesmo nas duas propostas. Ele apareceu para resolver o
 * problema da versão anterior: explicar as opções SEM tapar o que está a ser demonstrado.
 *
 * AS TRÊS PEÇAS, e a razão de cada uma:
 *   · `.bancada` — o painel. Abre no carregamento, porque quem chega não sabe o que está a ver.
 *   · `.bancada-aba` — uma tira fina na margem esquerda. Chama o painel de volta sem tapar nada:
 *     fica na margem, fora da coluna de leitura e longe do rodapé.
 *   · `.bancada-balao` — o aviso que diz, durante 4 s, o que a opção escolhida faz e quanto custa.
 *     É o que permite fechar o painel, olhar a página, e mesmo assim perceber o que mudou.
 */
const CSS_BANCADA = `
/* ============================================================================
   A BANCADA — as propostas de layout. Componente só, usado pelas duas páginas.
   Ele NÃO faz parte do que se está a propor: é a moldura de quem compara.
   ========================================================================== */

.bancada {
  position: fixed; inset: 0; z-index: 90;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(20, 16, 14, .42);
  padding: 0; opacity: 1; transition: opacity .16s ease;
}
.bancada[hidden] { display: none !important; }
.bancada-caixa {
  width: 100%; max-width: 720px; max-height: 86vh; overflow-y: auto;
  background: var(--superficie, #fff); color: var(--texto, #1f1c1a);
  border: 1px solid var(--borda, #ddd); border-radius: 14px 14px 0 0;
  padding: 18px 20px 20px; box-shadow: 0 -8px 40px rgba(0,0,0,.28);
  font: 15px/1.5 var(--ui, system-ui, sans-serif);
}
@media (min-width: 700px) {
  .bancada { align-items: center; padding: 24px; }
  .bancada-caixa { border-radius: 14px; max-height: 88vh; }
}
.bancada-caixa .bancada-sobre {
  margin: 0 0 2px; font-size: 12px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--marca-texto, #6b1f2e); font-weight: 700;
}
.bancada-caixa h2 { margin: 0 0 6px; font-size: 21px; line-height: 1.2; color: var(--marca, #6b1f2e); }
.bancada-caixa .bancada-intro { margin: 0 0 14px; color: var(--texto-suave, #5a5348); font-size: 14px; }

.bancada-opcoes { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.bancada-opcoes button {
  display: grid; grid-template-columns: 30px 1fr auto; align-items: baseline; gap: 4px 10px;
  width: 100%; text-align: left; cursor: pointer;
  background: var(--fundo-faixa, #f7f1e7); color: inherit;
  border: 1px solid var(--borda, #ddd); border-radius: 10px; padding: 10px 12px;
  font: inherit;
}
.bancada-opcoes button:hover { background: var(--fundo-hover, #f3ece1); }
.bancada-opcoes button[aria-pressed="true"] {
  background: var(--marca, #6b1f2e); color: #fff; border-color: var(--marca, #6b1f2e);
}
.bancada-opcoes .n {
  font: 700 15px/1 var(--ui, system-ui); grid-row: 1 / span 2;
  opacity: .75;
}
.bancada-opcoes .t { font-weight: 700; font-size: 15px; }
.bancada-opcoes .d { grid-column: 2; font-size: 13px; opacity: .85; }
.bancada-opcoes .m {
  grid-row: 1 / span 2; grid-column: 3; font-size: 12px; text-align: right;
  font-variant-numeric: tabular-nums; opacity: .9; white-space: nowrap;
}
.bancada-opcoes button[aria-pressed="true"] .d,
.bancada-opcoes button[aria-pressed="true"] .m { opacity: .92; }

.bancada-rodape { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 16px; }
.bancada-ver {
  flex: 1 1 auto; cursor: pointer; min-height: 46px;
  background: var(--marca, #6b1f2e); color: #fff; border: 1px solid var(--marca, #6b1f2e);
  border-radius: 10px; padding: 10px 18px; font: 700 15px/1.2 var(--ui, system-ui);
}
.bancada-ver:hover { background: var(--marca-claro, #8a2a3d); }
.bancada-outra {
  color: var(--marca-texto, #6b1f2e); font-size: 14px; text-decoration: none;
  border-bottom: 1px dotted currentColor; padding-bottom: 1px;
}

/*
 * A ABA. Ela faz duas coisas, e é por isso que substituiu o balão que aqui esteve: DIZ QUAL É A
 * OPÇÃO ACTIVA e quanto ela custa, e CHAMA O PAINEL de volta.
 *
 * A primeira versão avisava num balão no topo — e o balão tapava exactamente o que estava a ser
 * demonstrado (o título que se quer ver preso). Um aviso que esconde a coisa observada é pior do
 * que aviso nenhum. A aba vive na margem, na vertical, e não passa por cima de nada: a coluna de
 * leitura tem 24 px de margem, e ela ocupa 22.
 */
.bancada-aba {
  position: fixed; left: 0; top: 50%; transform: translateY(-50%); z-index: 80;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  max-width: 22px; overflow: hidden;
  background: var(--marca, #6b1f2e); color: #fff; border: 0; border-radius: 0 8px 8px 0;
  padding: 10px 3px; cursor: pointer; opacity: .94;
  writing-mode: vertical-rl; text-orientation: mixed;
  font: 700 11px/1 var(--ui, system-ui); letter-spacing: .04em;
}
.bancada-aba:hover, .bancada-aba:focus-visible { opacity: 1; }
.bancada-aba[hidden] { display: none !important; }
.bancada-aba .aba-custo { font-weight: 400; opacity: .82; }

@media print { .bancada, .bancada-aba { display: none !important; } }
`;

/**
 * O `<script>` da bancada. Recebe as opções e o que cada uma diz; o resto é igual nas duas
 * propostas, e é isso que faz o componente ser um só.
 *
 * `atributosDoHtml` (11/11/2026) põe atributos na tag `<html>`. Existe por causa de uma proposta
 * só — a do véu —, que precisa de dizer «esta página não avisa outras abas» ANTES de o `nav.js`
 * correr, e o `scriptExtra` corre depois dele. Um atributo declarado na marcação chega a tempo;
 * uma linha de JavaScript, não.
 */
function scriptDaBancada(opcoes) {
  return `(function () {
  var OPCOES = ${JSON.stringify(opcoes)};
  var html = document.documentElement;
  var painel = document.getElementById('bancada');
  var aba = document.getElementById('bancada-aba');
  var abaRotulo = document.getElementById('bancada-aba-rotulo');
  var botoes = [].slice.call(document.querySelectorAll('.bancada-opcoes button'));

  /* UMA BANCADA SEM OPÇÕES NÃO TEM PAINEL — e o script não pode partir por isso. A sala de ensaio
     ('proposta-estados') mostra estados, e não escolhe entre opções: não tem '#bancada' nem aba.
     Sem esta guarda o console acusava um erro de JavaScript numa página que está inteira. */
  if (!painel || !aba) return;

  function opcaoAtual() { return html.getAttribute('data-opcao'); }

  function aplicar(opcao) {
    var def = OPCOES.filter(function (o) { return o.id === opcao; })[0];
    if (!def) return;
    html.setAttribute('data-opcao', opcao);
    botoes.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.escolha === opcao));
    });
    // A ABA DIZ O QUE ESTÁ ACTIVO. Sem isto, fechado o painel, não se sabe qual das opções está na
    // tela — e comparar exige saber o que se está a ver.
    if (abaRotulo) abaRotulo.textContent = def.n + ' · ' + def.t + ' · ' + def.m;
    aba.setAttribute('title', def.t + ' — ' + def.d + ' (' + def.m + ')');
    try { sessionStorage.setItem('proposta:opcao', opcao); } catch (e) {}
    if (typeof window.aoTrocarOpcao === 'function') window.aoTrocarOpcao(opcao);
  }

  function abrir(sim) {
    painel.hidden = !sim;
    aba.hidden = sim;
    if (sim) {
      var atual = document.querySelector('.bancada-opcoes button[aria-pressed="true"]');
      if (atual) atual.focus();
    }
  }

  botoes.forEach(function (b) {
    b.addEventListener('click', function () { aplicar(b.dataset.escolha); });
  });
  document.getElementById('bancada-ver').addEventListener('click', function () { abrir(false); });
  aba.addEventListener('click', function () { abrir(true); });
  painel.addEventListener('click', function (e) { if (e.target === painel) abrir(false); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') abrir(false);
    var mapa = {};
    OPCOES.forEach(function (o, i) { mapa[String(i)] = o.id; });
    if (mapa[e.key] && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      aplicar(mapa[e.key]);
    }
  });

  // A opção escolhida sobrevive a um recarregamento — numa proposta que se avalia a rolar,
  // perder a escolha a cada recarregamento é perder o trabalho.
  var guardada = null;
  try { guardada = sessionStorage.getItem('proposta:opcao'); } catch (e) {}
  aplicar(guardada && OPCOES.some(function (o) { return o.id === guardada; }) ? guardada : html.getAttribute('data-opcao'));
})();`;
}

/** A marcação da bancada, a partir das opções. */
function marcacaoDaBancada({ sobre, titulo, intro, opcoes, inicio }) {
  return `<div class="bancada" id="bancada" role="dialog" aria-modal="false" aria-label="${titulo}">
  <div class="bancada-caixa">
    <p class="bancada-sobre">${sobre}</p>
    <h2>${titulo}</h2>
    <p class="bancada-intro">${intro}</p>
    <ul class="bancada-opcoes">
${opcoes.map((o) => `      <li><button type="button" data-escolha="${o.id}" aria-pressed="${o.id === inicio ? 'true' : 'false'}">
        <span class="n" aria-hidden="true">${o.n}</span>
        <span class="t">${o.t}</span>
        <span class="m">${o.m}</span>
        <span class="d">${o.d}</span>
      </button></li>`).join('\n')}
    </ul>
    <div class="bancada-rodape">
      <button type="button" class="bancada-ver" id="bancada-ver">Ver a página →</button>
      <a class="bancada-outra" href="index.html">‹ as propostas</a>
    </div>
  </div>
</div>
<button type="button" class="bancada-aba" id="bancada-aba" hidden
  aria-label="Mudar de opção — abrir o painel das propostas">
  <span id="bancada-aba-rotulo">propostas</span>
</button>`;
}

/** O esqueleto comum das duas páginas. O CSS do projeto entra AQUI, embutido. */
function pagina({ titulo, opcaoInicial, corpo, cssExtra, scriptExtra, opcoes, bancada, atributosDoHtml }) {
  return `<!DOCTYPE html>
<html lang="pt-BR" data-opcao="${opcaoInicial}" data-titulo-fixo="nao" data-titulo-preso="nao" data-titulo-encolhido="nao" data-rolando="sobe"${atributosDoHtml ? ' ' + atributosDoHtml : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} · Sistema Lastro</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E">
<style>
${CSS}
</style>
<style>
${CSS_BANCADA}
${cssExtra}
</style>
</head>
<body>

<nav class="topnav" aria-label="Navegação">
  <span class="marca" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 249.21 291.95" width="249.21" height="291.95"><title>Sistema Lastro</title><path d="M162 163.3C166.3 159.1 170.8 155.1 174.9 150.7C177.8 147.7 180.3 144.3 183 141C183 141 200.6 115.1 200.6 115.1C203.1 110.4 205.3 105.4 207.4 100.5C207.4 100.5 215.6 74.6 215.6 74.6C216.5 69.7 217.5 64.7 217.5 59.7C217.5 51.6 212.5 43.8 207.2 37.7C204.5 34.6 201.6 31.6 198.3 29.1C198.3 29.1 164.5 9.6 164.5 9.6C161.9 8.6 159.1 8.3 156.4 7.6C154.4 7.2 152.1 9.3 151.4 11.2C149.2 17.1 147.2 23 145.8 29.1C142.4 44.4 139.5 59.7 137.1 75.1C133.4 98.4 131.3 122.7 135.6 145.8C135.6 145.8 145.7 176.3 145.7 176.3C145.7 176.3 114.4 207.4 114.4 207.4C107 217 101.6 228.8 100.4 240.7C99.4 251.1 102.5 262 107.3 271.3C108.9 274.4 111.2 277.1 113.4 279.8C113.4 279.8 125.9 290.2 125.9 290.2C127.4 291.1 129.1 291.4 130.7 291.9C130.7 291.9 119 271.1 119 271.1C118.5 268.8 118.5 266.4 118.6 264C118.6 264 122 252.9 122 252.9C122.8 251.3 123.7 249.9 124.8 248.6C142.2 229.6 169.3 222.6 192.4 211.2C207.8 203.6 222.1 192.5 232.5 178.8C232.5 178.8 245.4 154.5 245.4 154.5C247.1 148.8 248.2 142.9 248.7 137C249.2 130.2 248.9 123.3 248.4 116.5C248.4 116.5 243.4 92.7 243.4 92.7C243.4 92.7 229.3 64.6 229.3 64.6C228.1 63 226.5 61.8 225.1 60.3C225.1 60.3 227.4 66.5 227.4 66.5C228.4 69.1 229.2 71.8 229.6 74.6C229.6 74.6 228.2 93.5 228.2 93.5C228.2 93.5 213.2 116.8 213.2 116.8C198.1 134.2 181.5 151 162 163.3Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/></svg></span>
  <span class="topnav-titulo" aria-hidden="true"></span>
  <div class="nav-links" id="nav-links">
    <a href="index.html">Propostas</a>
  </div>
  <button class="hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-links">
    <span></span><span></span><span></span>
  </button>
</nav>

${corpo}

${bancada}

<script>${NAVJS}</script>
<script>${scriptDaBancada(opcoes)}</script>
<script>${scriptExtra || ''}</script>
</body>
</html>
`;
}

// =========================================================================== PROPOSTA 1: O TÍTULO

const OPCOES_TITULO = [
  { id: 'atual', n: '0', t: 'Hoje — nada muda', m: '0 px',
    d: 'o título sai da tela e não volta; numa página longa perde-se de que documento se trata' },
  { id: 'A', n: 'A', t: 'Preso no topo', m: '146 / 374 px',
    d: 'o bloco fica e o texto rola por baixo — no celular come 44% da tela' },
  { id: 'B', n: 'B', t: 'Encolhe ao rolar', m: '33 / 60 px',
    d: 'o título diminui e a ficha sai: devolve a altura à leitura' },
  { id: 'C', n: 'C', t: 'Vai para «Nesta página»', m: '0 px no desktop',
    d: 'o título muda-se para a coluna da direita; sem coluna, cai na B' },
  { id: 'D', n: 'D', t: 'Vai para o menu', m: '0 px no celular',
    d: 'o título ocupa a sobra da barra: não rouba um pixel da leitura' },
];

const CSS_TITULO = `
/* ============================================================================
   PROPOSTA 1 — O TÍTULO QUE NÃO SE PERDE

   Um mecanismo, cinco desfechos. «O título está preso» é UM estado (o fim do
   cabeçalho passou por baixo da barra); cada opção decide ONDE ele vive nesse
   estado. É o que torna legítimo compará-las: não são cinco invenções, é uma
   decisão com cinco respostas.
   ========================================================================== */

/* o fundo cobre a largura toda quando o cabeçalho fica: sem isto, o texto que
   passa nas laterais aparece ao lado dele em telas largas */
[data-titulo-encolhido="sim"] header.doc,
[data-titulo-preso="sim"] header.doc {
  background: var(--fundo);
  box-shadow: 0 0 0 100vmax var(--fundo), 0 1px 0 var(--borda);
  clip-path: inset(0 -100vmax);
}

/* 0 · HOJE — nada. */

/* A · PRESO NO TOPO */
[data-opcao="A"] header.doc { position: sticky; top: var(--header-height); z-index: 15; }

/* B · ENCOLHE */
[data-opcao="B"] header.doc { position: sticky; top: var(--header-height); z-index: 15; }
[data-opcao="B"][data-titulo-encolhido="sim"] header.doc h1 {
  font-size: 17px; border-bottom-width: 1px; padding-bottom: 4px; margin-bottom: 2px;
  transition: font-size .15s ease;
}
[data-opcao="B"][data-titulo-encolhido="sim"] header.doc .subtitulo,
[data-opcao="B"][data-titulo-encolhido="sim"] header.doc .ficha { display: none; }

/* C · VAI PARA A COLUNA — só onde a coluna existe; abaixo de 1200px cai na B */
[data-opcao="C"] header.doc .titulo-no-rail { display: none; }
@media (max-width: 1199px) {
  [data-opcao="C"] header.doc { position: sticky; top: var(--header-height); z-index: 15; }
  [data-opcao="C"][data-titulo-encolhido="sim"] header.doc h1 {
    font-size: 17px; border-bottom-width: 1px; padding-bottom: 4px; margin-bottom: 2px;
    transition: font-size .15s ease;
  }
  [data-opcao="C"][data-titulo-encolhido="sim"] header.doc .subtitulo,
  [data-opcao="C"][data-titulo-encolhido="sim"] header.doc .ficha { display: none; }
}
@media (min-width: 1200px) {
  [data-opcao="C"] header.doc { position: static; }
  [data-opcao="C"] .rail { position: sticky; top: calc(var(--header-height) + 8px); align-self: start; }
  [data-opcao="C"] .rail .titulo-no-rail {
    display: block; background: var(--fundo);
    font: 700 15px/1.25 var(--serif); color: var(--marca);
    padding: 0 0 6px; margin: 0 0 8px; border-bottom: 2px solid var(--borda);
  }
  [data-opcao="C"] .rail .toc-local { position: static; max-height: none; }
}

/* D · VAI PARA O MENU — só no celular, onde a barra tem espaço; acima disso cai na A */
.topnav .topnav-titulo { display: none; }
@media (max-width: 1199px) {
  [data-opcao="D"][data-titulo-preso="sim"] .topnav .topnav-titulo {
    display: block; min-width: 0; flex: 1 1 auto;
    margin: 0 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font: 700 13px/1.2 var(--ui); color: var(--fundo); opacity: .92;
  }
  [data-opcao="D"] header.doc { position: static; }
}
@media (min-width: 1200px) {
  [data-opcao="D"] header.doc { position: sticky; top: var(--header-height); z-index: 15; }
}

/* O QUE O EXPERIMENTO DIZ, no fim do documento */
.nota-do-teste {
  max-width: 900px; margin: 40px auto 60px; padding: 16px 20px;
  border-left: 4px solid var(--ornamento-forte); background: var(--superficie);
  color: var(--texto-suave); font-size: 15px; border-radius: 0 8px 8px 0;
}
.nota-do-teste strong { color: var(--texto); }
`;

const SCRIPT_TITULO = `(function () {
  var html = document.documentElement;
  var nav = document.querySelector('.topnav');
  var cabecalho = document.getElementById('cabecalho');
  var titulo = document.getElementById('titulo');
  var sentinela = document.getElementById('sentinela');
  var rail = document.querySelector('.rail');
  var devolver = null;

  function alturaDaBarra() { return nav ? nav.offsetHeight : 0; }

  function tituloParaORail(sim) {
    if (!rail || !titulo) return;
    if (sim) {
      if (titulo.parentNode && titulo.parentNode.classList.contains('titulo-no-rail')) return;
      devolver = { pai: titulo.parentNode, antes: titulo.nextSibling };
      var bloco = document.createElement('div');
      bloco.className = 'titulo-no-rail';
      rail.insertBefore(bloco, rail.firstChild);
      bloco.appendChild(titulo);
    } else if (devolver) {
      var b = rail.querySelector('.titulo-no-rail');
      if (b) b.parentNode.removeChild(b);
      devolver.pai.insertBefore(titulo, devolver.antes);
      devolver = null;
    }
  }

  function aoRolar() {
    var passou = sentinela.getBoundingClientRect().top <= alturaDaBarra();
    var encolhido = window.scrollY > 8;
    html.setAttribute('data-titulo-preso', passou ? 'sim' : 'nao');
    html.setAttribute('data-titulo-encolhido', encolhido ? 'sim' : 'nao');
    var opcao = html.getAttribute('data-opcao');
    tituloParaORail(opcao === 'C' && window.innerWidth >= 1200 && passou);
    var span = nav.querySelector('.topnav-titulo');
    if (span) span.textContent = passou ? titulo.textContent : '';
  }

  /*
   * O SALTO PARA A ÂNCORA, FEITO À MÃO — E PORQUÊ.
   *
   * Com o título preso, o alvo de «Nesta página» pára por baixo dele e quem salta chega ao sítio
   * sem ver o que foi lá buscar. O 'scroll-padding-top' só sabe um número fixo, e a altura que
   * fica presa MUDA com o estado (146 px inteiro, 25 px encolhido) — e esse estado depende da
   * posição. Com um número só, ou se reserva o máximo (o alvo cai longe) ou o mínimo (cai debaixo).
   *
   * A saída é não reservar às cegas: salta-se, deixa-se o estado assentar, e CORRIGE-SE com a
   * altura que ficou. A correção é SIMÉTRICA — desce se o alvo ficou escondido, sobe se ficou
   * longe. Uma correção que só empurra para baixo resolve metade dos casos.
   */
  function alturaPresada() {
    var opcao = html.getAttribute('data-opcao');
    var noTopo = opcao === 'A' || opcao === 'B'
      || (opcao === 'C' && window.innerWidth < 1200)
      || (opcao === 'D' && window.innerWidth >= 1200);
    if (!noTopo) return 0;
    var r = cabecalho.getBoundingClientRect();
    var preso = r.top <= alturaDaBarra() + 1 && r.bottom > alturaDaBarra();
    return preso ? r.height : 0;
  }

  function saltarPara(id) {
    var alvo = document.getElementById(id);
    if (!alvo) return;
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    alvo.scrollIntoView({ behavior: 'auto', block: 'start' });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        // O limite é o que está PINTADO no topo: a barra, ou o fundo do cabeçalho se ele estiver
        // por baixo dela. É a única medida que não depende do estado que se está a medir.
        var rc = cabecalho.getBoundingClientRect();
        var necessario = Math.max(alturaDaBarra(), Math.min(rc.bottom, window.innerHeight)) + 8;
        var r = alvo.getBoundingClientRect();
        var diferenca = Math.round(r.top - necessario);
        if (Math.abs(diferenca) > 1) window.scrollTo(0, Math.max(0, window.scrollY + diferenca));
      });
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('.toc-local a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!document.getElementById(id)) return;
    e.preventDefault();
    saltarPara(id);
  });

  var pedido = false;
  function rolar() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(function () { pedido = false; aoRolar(); });
  }
  window.addEventListener('scroll', rolar, { passive: true });
  window.addEventListener('resize', rolar);

  window.aoTrocarOpcao = function () {
    if (html.getAttribute('data-opcao') !== 'C') tituloParaORail(false);
    aoRolar();
  };
  aoRolar();
})();`;

function proporTitulo() {
  /* SEM PACOTE, A BANCADA DO TÍTULO DIZ QUE NÃO PODE MEDIR (02/11/2026). Antes ela não existia —
     o construtor saía inteiro, e as outras bancadas iam com ela. Uma página que explica a
     ausência é melhor do que um link que não abre, e é a mesma regra do diagnóstico: a ausência
     diz-se pelo estado, não pelo silêncio. */
  if (!AULA) {
    return pagina({
      titulo: 'Proposta — o título (sem pacote para medir)',
      opcaoInicial: 'hoje',
      corpo: `<header class="doc">
  <h1>O título que não se perde</h1>
  <p class="subtitulo">Esta bancada não pode ser construída agora</p>
</header>
<main>
<div class="conteudo">
<div class="nota-do-teste">
  <p><strong>Ela mede o cabeçalho e o corpo da Aula 01 de um pacote real</strong> — e não há nenhum
  gerado nesta escola. Não é uma avaria: uma escola nova ainda não tem ciclo, e uma escola
  expurgada não volta a ter.</p>
  <p>Para a bancada voltar: <code>tools/gerar-ciclo.sh &lt;professor&gt; &lt;ciclo&gt; &lt;escola&gt;</code>,
  e depois <code>node experimentos/propostas/construir.js</code>.</p>
  <p class="fina">As outras propostas estão prontas — a da listagem dos verbetes não depende de
  pacote nenhum, porque lê o alfabeto, que é versionado.</p>
</div>
</div>
</main>`,
      opcoes: [],
    });
  }
  const { cabecalho, corpo } = conteudoDaAula();
  const nota = `<div class="nota-do-teste">
  <p><strong>O que está a ser comparado.</strong> O título do documento deve ficar à vista enquanto
  se rola — a página da aula é longa, e hoje ele sai da tela. Role com cada opção e repare em duas
  coisas: <strong>o título continua visível?</strong> e <strong>quanta altura ele ocupa no
  topo?</strong></p>
  <p>Os números ao lado de cada opção são medidos, não estimados: <strong>146 px</strong> é o
  cabeçalho inteiro preso, no computador; <strong>374 px</strong> é o mesmo no telemóvel — 44% da
  tela. É por isso que a opção A, que parece a mais óbvia, é a pior no celular.</p>
  <p>As opções C e D mudam de comportamento conforme a largura: não há coluna «Nesta página» abaixo
  de 1200 px, e a barra do topo só tem espaço de sobra no celular. Uma proposta que só olhasse para
  um dos lados não serviria.</p>
  </div>`;

  return pagina({
    titulo: 'Proposta — o título que não se perde',
    opcaoInicial: 'atual',
    corpo: `${cabecalho}

<div id="sentinela" aria-hidden="true"></div>

${corpo}

${nota}`,
    cssExtra: CSS_TITULO,
    scriptExtra: SCRIPT_TITULO,
    opcoes: OPCOES_TITULO,
    bancada: marcacaoDaBancada({
      sobre: 'Proposta 1 de 2 · leitura',
      titulo: 'O título que não se perde',
      intro: 'A página longa é a <strong>Aula 01</strong> verdadeira. Escolha uma opção, feche este '
        + 'painel e role: o que se compara é se o título continua à vista e quanta altura ocupa.',
      opcoes: OPCOES_TITULO,
      inicio: 'atual',
    }),
  });
}

// ===================================================================== PROPOSTA 2: A PAGINAÇÃO

const OPCOES_PAGINACAO = [
  { id: 'hoje', n: '0', t: 'Hoje — presa no fundo', m: '182 px',
    d: 'fica sempre à vista e, no celular, ocupa 21% da tela — mesmo sem haver o que folhear' },
  { id: 'bloco', n: '1', t: 'Vira bloco no fim', m: '0 px',
    d: 'deixa de ser presa no celular e volta a ser o que o nome diz: um rodapé' },
  { id: 'compacta', n: '2', t: 'Compacta com «⋯»', m: '47 px',
    d: 'só os botões e a contagem; o resto abre no «⋯» — uma linha em vez de três' },
  { id: 'auto-esconde', n: '3', t: 'Esconde ao descer', m: '0 px',
    d: 'sai quando se lê, volta quando se procura: devolve a tela sem perder o controle' },
];

const CSS_PAGINACAO = `
${cssDaBarraDoLancamento()}

/* ============================================================================
   PROPOSTA 2 — A PAGINAÇÃO DO LANÇAMENTO NO CELULAR

   A barra é a do produto: o <footer> é extraído do template, e o CSS dela também.
   O que muda entre as opções é ONDE ela vive e QUANTO dela se mostra no celular.
   ========================================================================== */

header.doc { margin-top: 8px; }

/* 0 · HOJE — nada. */

/* 1 · VIRA BLOCO NO FIM: deixa de ser presa no celular, e continua presa no desktop */
@media (max-width: 899px) {
  [data-opcao="bloco"] footer.barra-de-controle {
    position: static; margin: 22px 0 40px; border: 1px solid var(--borda);
    border-radius: 8px; border-top: 2px solid var(--borda);
  }
}

/* 2 · COMPACTA COM «⋯» */
@media (max-width: 899px) {
  [data-opcao="compacta"] footer.barra-de-controle { gap: 4px 10px; padding: 6px 10px; }
  [data-opcao="compacta"] footer.barra-de-controle .por-pagina,
  [data-opcao="compacta"] footer.barra-de-controle .contagem { display: none; }
  [data-opcao="compacta"] footer.barra-de-controle .mais { display: inline-block; margin-left: auto; }
  [data-opcao="compacta"] footer.barra-de-controle[data-aberto="sim"] .por-pagina,
  [data-opcao="compacta"] footer.barra-de-controle[data-aberto="sim"] .contagem { display: inline; }
  [data-opcao="compacta"] footer.barra-de-controle .paginacao { gap: 6px; }
  [data-opcao="compacta"] footer.barra-de-controle strong { font-size: 13px; }
  [data-opcao="compacta"] footer.barra-de-controle button { padding: 4px 9px; }
}

/* 3 · ESCONDE AO DESCER, VOLTA AO SUBIR */
[data-opcao="auto-esconde"] footer.barra-de-controle {
  transition: transform .18s ease, opacity .18s ease;
}
[data-opcao="auto-esconde"][data-rolando="desce"] footer.barra-de-controle {
  transform: translateY(130%); opacity: 0; pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  [data-opcao="auto-esconde"] footer.barra-de-controle { transition: none; }
}

/* a peça que só a proposta tem */
.mais {
  display: none; cursor: pointer; background: var(--fundo-faixa);
  border: 1px solid var(--borda); border-radius: 6px; padding: 4px 10px;
  font: 700 15px/1 var(--ui); color: var(--marca-texto);
}
@media (min-width: 900px) { .mais { display: none !important; } }

.nota-do-teste {
  max-width: 900px; margin: 40px auto 60px; padding: 16px 20px;
  border-left: 4px solid var(--ornamento-forte); background: var(--superficie);
  color: var(--texto-suave); font-size: 15px; border-radius: 0 8px 8px 0;
}
.nota-do-teste strong { color: var(--texto); }
`;

const SCRIPT_PAGINACAO = `(function () {
  var html = document.documentElement;
  var rodape = document.querySelector('footer.barra-de-controle');
  var alvo = document.getElementById('paginacao');
  var pagina = 1, total = 1, quantos = 6;

  function desenhar() {
    var botao = function (ir, rotulo) {
      return '<button type="button" data-ir="' + ir + '"'
        + (ir < 1 || ir > total ? ' disabled' : '') + '>' + rotulo + '</button>';
    };
    alvo.innerHTML = botao(pagina - 1, '‹ anterior')
      + '<strong>Página ' + pagina + ' de ' + total + '</strong>'
      + botao(pagina + 1, 'próxima ›')
      + '<span class="fraco contagem">' + quantos + ' bloco(s) no filtro</span>';
  }
  desenhar();

  var mais = document.getElementById('mais');
  if (mais) mais.addEventListener('click', function () {
    var aberto = rodape.getAttribute('data-aberto') === 'sim';
    rodape.setAttribute('data-aberto', aberto ? 'nao' : 'sim');
    mais.setAttribute('aria-expanded', String(!aberto));
  });

  /* a opção 3: esconde ao descer, volta ao subir */
  var ultimo = window.scrollY, pedido = false;
  function aoRolar() {
    var y = window.scrollY;
    if (Math.abs(y - ultimo) > 6) {
      html.setAttribute('data-rolando', (y > ultimo && y > 120) ? 'desce' : 'sobe');
      ultimo = y;
    }
  }
  window.addEventListener('scroll', function () {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(function () { pedido = false; aoRolar(); });
  }, { passive: true });

  window.aoTrocarOpcao = function () {
    html.setAttribute('data-rolando', 'sobe');
  };
})();`;

function blocosDaAula(qtd) {
  const campos = ['Presença', 'Técnica — Solo', 'Técnica — Barra', 'Musicalidade', 'Observação'];
  const lista = [];
  for (let i = 1; i <= qtd; i += 1) {
    lista.push(`<section class="captura">
  <h3>Aula ${String(i).padStart(2, '0')} — o registro da aula dada</h3>
  <table>${campos.map((c) => `<tr><th>${c}</th><td><input type="text" value="—" size="20"></td></tr>`).join('')}</table>
  <p class="fraco">Bloco ${i} de ${qtd}. O formulário é o mesmo nas quatro opções: o que se compara é o
  <strong>rodapé</strong>.</p>
</section>`);
  }
  return lista.join('\n');
}

function proporPaginacao() {
  const nota = `<div class="nota-do-teste">
  <p><strong>O que está a ser comparado.</strong> O rodapé de paginação do lançamento fica presa no
  fundo da tela. No computador isso é útil; no celular rouba espaço à leitura — e a barra
  <strong>não ocupa 52 px como parece</strong>: os controlos dobram-se em três linhas e ela mede
  <strong>182 px</strong>, 21% da tela de um telemóvel de 390×844. Mesmo quando não há o que
  folhear («Página 1 de 1», com os dois botões cinzas), que é o caso do ciclo com uma aula.</p>
  <p>Role com cada opção. Repare em quanta altura sobra para o formulário — e repare também que a
  opção 1 mantém o rodapé presa no computador: <strong>o que funciona num lado não precisa de ser
  sacrificado</strong>.</p>
  </div>`;

  return pagina({
    titulo: 'Proposta — a paginação no celular',
    opcaoInicial: 'hoje',
    corpo: `<header class="doc">
  <h1>Lançamento da aula — formulário eletrônico</h1>
  <p class="subtitulo">O rodapé de paginação: quatro desfechos</p>
  <p class="ficha"><span>Proposta 2 de 2</span><span>6 blocos</span><span>formulário decorativo</span></p>
</header>

<main>
<div class="conteudo">
${blocosDaAula(6)}
</div>
</main>

<footer class="barra-de-controle">
${rodapeDoLancamento().replace('<span><label class="campo-rotulo em-linha" for="porPagina">',
    '<span class="por-pagina"><label class="campo-rotulo em-linha" for="porPagina">')}
  <button type="button" class="mais" id="mais" aria-expanded="false"
    aria-label="Mais opções da paginação">⋯</button>
</footer>

${nota}`,
    cssExtra: CSS_PAGINACAO,
    scriptExtra: SCRIPT_PAGINACAO,
    opcoes: OPCOES_PAGINACAO,
    bancada: marcacaoDaBancada({
      sobre: 'Proposta 2 de 2 · tela de trabalho',
      titulo: 'A paginação no celular',
      intro: 'O formulário é decorativo; o que se compara é o <strong>rodapé</strong>. Escolha uma '
        + 'opção, feche o painel e role: repare em quanta altura sobra para os campos.',
      opcoes: OPCOES_PAGINACAO,
      inicio: 'hoje',
    }),
  });
}

// =============================================================================== PROPOSTA: ÍNDICE

// ============================================================ PROPOSTAS 3 e 4: O MENU E A LISTA

/*
 * DUAS DECISÕES, E NÃO UMA (23/10/2026). O pedido chegou como um assunto só — «o menu vai
 * ficar gigantesco» — mas são dois, e separá-los é o que evita escolher um pelo outro:
 *
 *   · a LISTAGEM resolve a CAPACIDADE. O menu deixa de enumerar documentos e passa a levar a
 *     páginas que os enumeram. Sozinha, leva a barra de 24 entradas para 12 e desliga o
 *     crescimento — que hoje é `6 + 8·T + A·T`, com `T` turmas e `A` aulas por turma;
 *   · o DESENHO resolve outra coisa: ONDE se lê o menu.
 *
 * DECIDIDO EM 23/10/2026, e é isso que estas duas páginas passam a mostrar:
 *
 *   1. o desenho é a COLUNA À ESQUERDA com o documento no topo — e a coluna é COMPACTA: os
 *      grupos abrem no ponteiro, empurram os de baixo para baixo, e fecham quando ele sai;
 *   2. a listagem adota a identidade de «Turmas cadastradas», na Produção: a mesma linha de
 *      nome com as ações, a mesma linha de complemento, e as MESMAS três caixinhas com o «?»
 *      — só que agora a caixinha toda é clicável, e não só o «?».
 *
 * BASTIDORES SAI DA COLUNA. Ele vai para a barra de cima, na ponta oposta à marca, e leva
 * consigo o Estúdio e a Produção. A coluna fica com o que é do trabalho de sala: Sistema
 * Lastro, Ciclos, Aulas, Planejamento, Área do Professor.
 *
 * OS NÚMEROS DESTAS BANCADAS NÃO SÃO INVENTADOS. As entradas do menu são CONTADAS do
 * `nav.json` real da escola de teste; a altura do painel e a largura da coluna são MEDIDAS no
 * navegador; o ritmo, a régua e os conteúdos dos dois planos são lidos do `.conf` da turma e
 * do `plano-01.json` do pacote. Um número estimado com ar de medido seria pior do que nenhum.
 *
 * A BARRA É DESENHADA PELO MÓDULO DE PRODUÇÃO. `motor/nucleo/nav.js` — o mesmo `desenhar()` que
 * serve a escola publicada — produz o HTML das três opções. E é por isso que a mudança de
 * Bastidores para a ponta direita NÃO precisa de tocar no módulo: o `desenhar()` já aceita um
 * `extras` (o documento) e um menu de um grupo só (o Bastidores). O que muda é lugar em CSS.
 */

const navDoProjeto = require(path.join(RAIZ, 'motor', 'nucleo', 'nav.js'));
/* O DESENHADOR DOS CARTÕES É O DO PRODUTO, e não uma cópia (25/10/2026). Numa bancada que existe
   para decidir, um cartão desenhado à mão mostra o cartão que o autor imaginou — e é assim que se
   aprova uma coisa e se recebe outra. `cartaoDaLista` é o mesmo módulo que serve as três listas. */
const listasDoNucleo = require(path.join(RAIZ, 'motor', 'nucleo', 'lista-html.js'));

/* OS DOCUMENTOS QUE HOJE SÃO O MENU — contados de `publicacao/calango/nav.json` em 23/10/2026,
 * com duas turmas («Balé Nível 1 — Teste 1» e «Balé Nível 2 — Teste 1») e uma aula publicada
 * por turma. Ficam escritos aqui, e não lidos do disco, de propósito: a escola de teste é
 * descartável por desenho, e uma bancada que se desmonta quando a escola é expurgada não
 * serve para decidir nada. Ver `../lib-pacote.js`, que resolve o mesmo problema para a aula. */
const DOCUMENTOS_DE_HOJE = [
  ['Ciclos', [
    'Plano do Ciclo 01 — Balé Nível 1 — Teste 1',
    'Referências Bibliográficas — Balé Nível 1 — Teste 1',
    'PDF do ciclo — Balé Nível 1 — Teste 1',
    'Plano do Ciclo 01 — Balé Nível 2 — Teste 1',
    'Referências Bibliográficas — Balé Nível 2 — Teste 1',
    'PDF do ciclo — Balé Nível 2 — Teste 1',
  ]],
  ['Aulas', [
    'Aula 01 — reconhecer o apoio e alinhar o eixo vertical — Balé Nível 1 — Teste 1',
    'Aula 01 — reconhecer o apoio e alinhar o eixo vertical — Balé Nível 2 — Teste 1',
  ]],
  ['Planejamento', [
    'Glossário do código Benesh — Balé Nível 1 — Teste 1',
    'Notação em Benesh — Balé Nível 1 — Teste 1',
    'Glossário do código Benesh — Balé Nível 2 — Teste 1',
    'Notação em Benesh — Balé Nível 2 — Teste 1',
  ]],
  ['Área do Professor', [
    'Anamnese do aluno',
    'Plano de ensino',
    'Plano de Observação',
    'Harmonização de linguagem — Balé Nível 1 — Teste 1',
    'Harmonização de linguagem — Balé Nível 2 — Teste 1',
    'Captura em aula — Aula 01 — para impressão — Balé Nível 1 — Teste 1',
    'Captura em aula — Aula 01 — para impressão — Balé Nível 2 — Teste 1',
    'Lançamento de aula — formulário electrónico — Balé Nível 1 — Teste 1',
    'Lançamento de aula — formulário electrónico — Balé Nível 2 — Teste 1',
  ]],
  ['Bastidores', ['Estúdio', 'Produção']],
];

/** O menu de hoje, como `nav.json` — 24 entradas: «Sistema Lastro» e 23 documentos. */
const MENU_DE_HOJE = {
  versao: 1,
  grupos: [{ tipo: 'link', rotulo: 'Sistema Lastro', href: '/index.html' }].concat(
    DOCUMENTOS_DE_HOJE.map(([rotulo, itens]) => ({
      tipo: 'menu',
      rotulo,
      itens: itens.map((r) => ({ rotulo: r, href: '/documentos/' })),
    }))),
};

/**
 * A COLUNA — quatro grupos, e o Bastidores NÃO está aqui.
 *
 * `Aulas` não tem itens: é `direto`, um destino só. É o que você pediu — e é também o que a
 * conta de crescimento exige, porque as aulas são o único acervo que cresce sem parar.
 *
 * O item `atual` é o que a página está a servir. Ele faz duas coisas: acende na coluna, e faz o
 * grupo dele nascer ABERTO — sem isso, na coluna compacta, a pessoa perde a única pista de onde
 * está, porque o item fica escondido dentro de um grupo fechado.
 */
const GRUPOS_DA_COLUNA = [
  { chave: 'ciclos', rotulo: 'Ciclos', itens: [
    { rotulo: 'Planos', atual: true },
    { rotulo: 'Referências' },
  ] },
  { chave: 'aulas', rotulo: 'Aulas', direto: true },
  { chave: 'planejamento', rotulo: 'Planejamento', itens: [
    { rotulo: 'Glossário' },
    { rotulo: 'Notação' },
  ] },
  { chave: 'area', rotulo: 'Área do Professor', itens: [
    { rotulo: 'Anamnese do aluno' },
    { rotulo: 'Plano de ensino' },
    { rotulo: 'Plano de Observação' },
    { rotulo: 'Lançamento de aula' },
  ] },
];

/** O que sobra para a barra de cima: o Bastidores e os dois destinos dele. */
const MENU_DA_BARRA = {
  versao: 1,
  grupos: [{ tipo: 'menu', rotulo: 'Bastidores', itens: [
    { rotulo: 'Estúdio de Dança', href: '/bastidores/estudio' },
    { rotulo: 'Produção', href: '/bastidores/producao' },
  ] }],
};

/* OS DOIS PLANOS QUE EXISTEM NA ESCOLA DE TESTE, com a forma real: `NOME`, `PROFESSOR`,
 * `FREQUENCIA`, `DIAS`, `DURACAO_POR_DIA` e `TOTAL_AULAS` do `.conf` da turma; `reguaDaRubrica`
 * e `repertorio` do `plano-01.json` do pacote; `hash`, `ancorado_em` e `po_state` do `.fipp`.
 *
 * São DUAS linhas e não uma dúzia porque são dois os planos — e são exactamente o par que
 * motivou a mudança: mesma escola, mesmos dados de ritmo e régua, e **professores diferentes**.
 * Um terceiro plano falso seria a única coisa falsa da página. */
const PLANOS = [
  {
    nome: 'Ciclo 01 — Calango · Balé Nível 1 — Teste 1',
    turma: 'Balé Nível 1 — Teste 1',
    professor: 'Oculos Redondo',
    ancorada: '23/10/2026',
    po: 'PO aguardando',
    poClasse: 'alerta',
    aulas: '18',
    hash: 'ca122b865128548b8544cb9197edc940ba9a842c1e481c2c31183240792004d8',
    ritmo: '2x · 60 min',
    ritmoCampos: [
      ['Frequência', '2x por semana (ter, qui)'],
      ['Dias e horário', 'ter e qui, 19:00'],
      ['Duração da aula', '60 min'],
      ['Período', '20/10/2026 a ?'],
    ],
    regua: ['Satisfatório', 'Razoável', 'Em desenvolvimento', 'Não se aplica'],
    reguaNota: 'Medida pela régua que o plano declara — a de omissão do motor, porque esta turma '
      + 'ainda não tem rubrica própria.',
    conteudos: ['Sequência de teste com plié, tendu e port de bras.'],
  },
  {
    nome: 'Ciclo 01 — Calango · Balé Nível 2 — Teste 1',
    turma: 'Balé Nível 2 — Teste 1',
    professor: 'Perna Boa',
    ancorada: '23/10/2026',
    po: 'PO aguardando',
    poClasse: 'alerta',
    aulas: '18',
    hash: '2540d67e7ebd1c4b6f997fd7b5f8b4f9110f49f1e700812122d71bc0d942561c',
    ritmo: '2x · 60 min',
    ritmoCampos: [
      ['Frequência', '2x por semana (ter, qui)'],
      ['Dias e horário', 'ter e qui, 19:00'],
      ['Duração da aula', '60 min'],
      ['Período', '20/10/2026 a ?'],
    ],
    regua: ['Satisfatório', 'Razoável', 'Em desenvolvimento', 'Não se aplica'],
    reguaNota: 'Medida pela régua que o plano declara — a de omissão do motor, porque esta turma '
      + 'ainda não tem rubrica própria.',
    conteudos: ['Sequência de teste com plié, tendu e port de bras.'],
  },
];

/** O normalizador da busca: sem acento e em minúsculas — «oculos» acha «Oculos Redondo». */
function chaveDeBusca(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** A cor de cada degrau da régua — a MESMA função da Produção, copiada na regra, não na cor. */
function classeDoNivel(nome, indice, total) {
  const n = chaveDeBusca(nome).trim();
  if (/satisf/.test(n)) return 'nivel-ok';
  if (/raz(o|ó)avel/.test(n)) return 'nivel-razoavel';
  if (/desenvolv/.test(n)) return 'nivel-alerta';
  if (/nao se aplica|n\/a|neutro/.test(n)) return 'nivel-neutro';
  if (indice === total - 1) return 'nivel-neutro';
  if (indice === 0) return 'nivel-ok';
  if (indice === 1) return 'nivel-razoavel';
  return 'nivel-alerta';
}

/** A barra desenhada pelo módulo de produção, com os endereços tornados inertes. */
function barraDoMenu(menu, pedido, extras) {
  const html = navDoProjeto.desenhar(menu, pedido, extras) || '';
  return html.replace(/ href="[^"]*"/g, ' href="#"');
}

/**
 * A COLUNA. Três arranjos, e o terceiro parâmetro é o que os separa:
 *
 *   · `compacta: false` — tudo à vista (a letra C de ontem);
 *   · `compacta: true`  — acordeão, e o grupo do documento actual ABERTO. Sabe-se onde se está
 *     porque se vê o item aceso; o preço é que a coluna nunca fica mais curta do que esse grupo;
 *   · `compacta: true` + `marcar`: acordeão, TUDO FECHADO, e o grupo do documento actual
 *     MARCADO no título (`data-atual`). É a leitura mais compacta, e continua a responder ao
 *     «sei onde estou» — não pelo item, mas pelo grupo, em ouro.
 */
function colunaDoMenu(compacta, marcar) {
  const partes = GRUPOS_DA_COLUNA.map((g) => {
    if (g.direto) return `    <a class="direto" href="#">${g.rotulo}</a>`;
    const temAtual = g.itens.some((i) => i.atual);
    const aberto = temAtual && !marcar ? 'sim' : 'nao';
    const atual = temAtual && marcar ? ' data-atual="sim"' : '';
    const itens = g.itens.map((i) => (i.atual
      ? `        <a href="#" aria-current="page">${i.rotulo}</a>`
      : `        <a href="#">${i.rotulo}</a>`)).join('\n');
    return `    <div class="grupo" data-aberto="${aberto}"${atual}>
      <button type="button" class="grupo-titulo" aria-expanded="${aberto === 'sim'}"
        aria-controls="g-${g.chave}"><span>${g.rotulo}</span><span class="seta" aria-hidden="true">›</span></button>
      <div class="grupo-itens" id="g-${g.chave}">
${itens}
      </div>
    </div>`;
  }).join('\n');
  return `<aside class="coluna" id="coluna-proposta" data-compacta="${compacta ? 'sim' : 'nao'}" data-aberta="nao"
  aria-label="Navegação do sistema">
  <span class="coluna-puxador" aria-hidden="true"></span>
  <a class="coluna-marca" href="#">Sistema Lastro</a>
  <nav>
${partes}
  </nav>
</aside>`;
}

/**
 * A BARRA DA PÁGINA — a `.lateral-barra` da Produção com outra roupa.
 *
 * ELA É SEPARADA DA COLUNA, e isso não é arrumação: é a mesma razão pela qual a Produção a tem
 * fora da `.lateral`. A coluna é `position: fixed` no computador e uma folha `fixed` no celular;
 * a barra tem de estar no FLUXO, acima do documento, a rolar com a página. Dentro da coluna, ela
 * ou flutuava sobre o conteúdo ou rolava dentro da folha.
 *
 * O que ela diz é o caminho: o grupo de cima e o documento em que se está. O separador vem do
 * desenho (`small::after`), para a leitura de ecrã não colar as duas palavras.
 */
function barraDeSecoes(grupo, documento) {
  return `<div class="coluna-barra">
  <span class="coluna-atual"><small>${grupo}</small>${documento}</span>
  <button type="button" class="coluna-abrir" id="coluna-abrir" aria-expanded="false"
    aria-controls="coluna-proposta">Seções <span aria-hidden="true">▾</span></button>
</div>`;
}

/**
 * AS TRÊS CAIXINHAS — e o «?» continua lá, mas quem recebe o toque é a caixinha.
 *
 * Na Produção a caixinha é um `<div>` com um `<button class="q">?</button>` dentro. Aqui a
 * caixinha É o botão, e o «?» é só o desenho que diz «há mais dentro». É a diferença entre
 * acertar num alvo de 20 px e acertar em 100% da caixinha — e resolve, de passagem, um
 * aninhamento de controles que um leitor de ecrã anuncia duas vezes.
 */
function metrica(rotulo, valor, qual, dica) {
  return `<button type="button" class="metrica" data-balao="${qual}" aria-expanded="false"
          aria-controls="p-${qual}-__ID__" aria-label="${dica}">
          <span class="k">${rotulo}</span>
          <span class="v">${valor}</span>
          <span class="q" aria-hidden="true">?</span>
        </button>`;
}

/** O painel que cada caixinha abre. Só um por cartão está visível, e é o da caixinha tocada. */
function painel(qual, conteudo, id) {
  return `      <div class="painel" data-painel="${qual}" id="p-${qual}-${id}" hidden>${conteudo}</div>`;
}

function painelRitmo(p) {
  return '<div class="grade">' + p.ritmoCampos.map(([k, v]) =>
    '<div><span class="k">' + k + '</span><span class="v">' + v + '</span></div>').join('') + '</div>';
}

function painelRegua(p) {
  return '<p class="nota">' + p.reguaNota + '</p>'
    + '<div class="escala">' + p.regua.map((n, i) =>
      '<span class="' + classeDoNivel(n, i, p.regua.length) + '">' + n + '</span>').join('') + '</div>';
}

function painelConteudos(p) {
  return '<div class="chips">'
    + (p.conteudos.length
      ? p.conteudos.map((c) => '<span class="chip">' + c + '</span>').join(' ')
      : '<span class="dono">(nenhum conteúdo associado)</span>')
    + '</div>';
}

function painelTurma(p) {
  return '<p class="nota">Turma do plano: <b>' + p.turma + '</b>.</p>' + painelRitmo(p);
}

function painelProfessor(p) {
  return '<div class="grade"><div><span class="k">Professor curado</span>'
    + '<span class="v">' + p.professor + '</span></div>'
    + '<div><span class="k">Turma</span><span class="v">' + p.turma + '</span></div></div>'
    + '<p class="nota">É a curadoria que liga professor e turma. Sem ela, este plano não existe.</p>';
}

function painelCadeia(p) {
  return '<div class="grade">'
    + '<div><span class="k">Ancorada em</span><span class="v">' + p.ancorada + '</span></div>'
    + '<div><span class="k">Estado do PO</span><span class="v">' + p.po + '</span></div>'
    + '<div><span class="k">Aulas previstas</span><span class="v">' + p.aulas + '</span></div>'
    + '<div><span class="k">Hash</span><span class="v" style="font-size:.74rem;word-break:break-all">'
    + p.hash.slice(0, 16) + '…</span></div></div>'
    + '<p class="nota">A cadeia acrescenta, não edita: um ajuste é um elo novo.</p>';
}

/**
 * UM CARTÃO DE PLANO. `modelo` escolhe o que vão ser as três caixinhas:
 *
 *   · `producao` — Ritmo · Régua · Conteúdos, que são as três de «Turmas cadastradas». É o
 *     modelo adoptado: a lista de planos fica com a mesma cara da lista de turmas, e o
 *     professor reconhece a peça. As quatro colunas que você pediu não se perdem: turma,
 *     professor e data vão na linha de complemento, sempre à vista;
 *   · `caixas` — Turma · Professor · Cadeia, as colunas que você pediu transformadas em
 *     caixinhas. Fica na bancada porque é a alternativa honesta, não porque esteja em cima da
 *     mesa: gasta as três caixinhas a repetir o que a linha de cima já diz.
 */
function cartaoDePlano(p, modelo, id) {
  const busca = chaveDeBusca([p.nome, p.turma, p.professor].join(' '));
  const dados = 'class="item" data-busca="' + busca + '" data-prof="' + p.professor
    + '" data-turma="' + p.turma + '"';
  const selo = '<span class="selo ' + p.poClasse + '">' + p.po + '</span>';
  const acoes = '<a class="acao pequena" href="#">Abrir o plano</a>'
    + '<a class="acao secundario pequena" href="#">Referências</a>'
    + '<a class="acao secundario pequena" href="#">PDF do ciclo</a>';

  const trio = modelo === 'producao'
    ? [
      ['Ritmo', p.ritmo, 'ritmo', 'ver o ritmo desta turma', painelRitmo(p)],
      ['Régua', String(p.regua.length) + ' níveis', 'regua', 'ver a régua desta turma', painelRegua(p)],
      ['Conteúdos', String(p.conteudos.length), 'conteudos', 'ver os conteúdos desta turma', painelConteudos(p)],
    ]
    : [
      ['Turma', p.turma.replace(/ — Teste 1$/, ''), 'turma', 'ver os detalhes desta turma', painelTurma(p)],
      ['Professor', p.professor, 'professor', 'ver o professor vinculado', painelProfessor(p)],
      ['Cadeia', p.po, 'cadeia', 'ver a cadeia deste plano', painelCadeia(p)],
    ];

  // A LINHA DE COMPLEMENTO NÃO REPETE O QUE AS CAIXINHAS DIZEM. Se as caixas são Turma ·
  // Professor · Cadeia, a linha passa a dizer o ciclo e o volume; se as caixas são o ritmo, a
  // régua e os conteúdos, a linha diz de quem é o plano. Em nenhum dos dois casos a mesma
  // informação aparece duas vezes — uma bancada que sabota uma das opções não serve para escolher.
  const dono = modelo === 'producao'
    ? [p.turma, p.professor, 'ancorada em ' + p.ancorada].join(' · ')
    : ['Ciclo 01', p.aulas + ' aulas previstas'].join(' · ');

  return `      <li ${dados}>
        <div class="linha-turma">
          <span class="nome"><b>${p.nome}</b> ${selo}</span>
          <span class="acoes">${acoes}</span>
        </div>
        <div class="dono">${dono}</div>
        <div class="metricas">
        ${trio.map(([r, v, q, d]) => metrica(r, v, q, d).replace(/__ID__/g, id)).join('\n        ')}
        </div>
${trio.map(([, , q, , conteudo]) => painel(q, conteudo, id)).join('\n')}
      </li>`;
}

const RODAPE_DE_PAGINACAO = `<div class="paginacao" hidden>
  <button type="button" class="pag-ant acao secundario pequena" aria-label="Página anterior">‹</button>
  <span class="pag-info"></span>
  <button type="button" class="pag-prox acao secundario pequena" aria-label="Página seguinte">›</button>
</div>`;

/** O filtro — o mesmo em todas as opções, e todo no cliente: nenhuma chamada, nenhuma cota. */
function filtroDePlanos() {
  return `<form class="filtro" onsubmit="return false">
  <div class="caixa filtrar">
    <div class="campo-filtro busca">
      <label class="campo-rotulo" for="f-busca">Procurar</label>
      <input id="f-busca" type="search" placeholder="plano, turma ou professor">
    </div>
    <div class="campo-filtro">
      <label class="campo-rotulo" for="f-prof">Professor</label>
      <select id="f-prof">
        <option value="">todos</option>
        <option>Oculos Redondo</option>
        <option>Perna Boa</option>
      </select>
    </div>
    <div class="campo-filtro">
      <label class="campo-rotulo" for="f-turma">Turma</label>
      <select id="f-turma">
        <option value="">todas</option>
        <option>Balé Nível 1 — Teste 1</option>
        <option>Balé Nível 2 — Teste 1</option>
      </select>
    </div>
    <p class="filtro-conta" id="f-conta">${PLANOS.length} planos</p>
  </div>
</form>`;
}

/** A lista inteira, num dos dois modelos. */
function listaDePlanos(modelo) {
  const cartoes = PLANOS.map((p, i) => cartaoDePlano(p, modelo, String(i + 1))).join('\n');
  return filtroDePlanos()
    + '<ul class="lista">\n' + cartoes + '\n</ul>\n'
    + RODAPE_DE_PAGINACAO;
}

/**
 * O filtro e as caixinhas. TUDO DELEGADO NO DOCUMENTO, e ligado UMA VEZ SÓ.
 *
 * A primeira versão voltava a ligar-se a cada troca de opção — e o ouvinte empilhado desfazia o
 * que o anterior tinha feito: a caixinha abria e fechava no mesmo toque. Delegar resolve as duas
 * coisas de uma vez: o ouvinte é o mesmo para a lista velha e para a nova, e o `itens()` é lido
 * na hora, não guardado numa variável que morre com o primeiro desenho.
 */
function scriptDaLista() {
  return `(function () {
  if (window.__listaDePlanosLigada) { window.aplicarFiltro(); return; }
  window.__listaDePlanosLigada = true;

  function itens() { return [].slice.call(document.querySelectorAll('li.item')); }

  window.aplicarFiltro = function () {
    var busca = document.getElementById('f-busca');
    var prof = document.getElementById('f-prof');
    var turma = document.getElementById('f-turma');
    var conta = document.getElementById('f-conta');
    if (!busca || !conta) return;
    var q = (busca.value || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
    var n = 0;
    var todos = itens();
    todos.forEach(function (l) {
      var ok = (!q || l.getAttribute('data-busca').indexOf(q) !== -1)
        && (!prof.value || l.getAttribute('data-prof') === prof.value)
        && (!turma.value || l.getAttribute('data-turma') === turma.value);
      l.hidden = !ok;
      if (ok) n++;
    });
    conta.textContent = n + (n === 1 ? ' plano' : ' planos') + ' de ' + todos.length;
  };

  document.addEventListener('input', function (e) {
    if (e.target.closest('.filtro')) window.aplicarFiltro();
  });
  document.addEventListener('change', function (e) {
    if (e.target.closest('.filtro')) window.aplicarFiltro();
  });

  // A CAIXINHA INTEIRA É O CONTROLE. Uma aberta por cartão; a caixinha acesa diz qual.
  function fechar(outro) {
    [].slice.call(document.querySelectorAll('.metrica[aria-expanded="true"]')).forEach(function (b) {
      if (b === outro) return;
      b.setAttribute('aria-expanded', 'false');
      var p = b.closest('li.item').querySelector('.painel:not([hidden])');
      if (p) p.hidden = true;
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.metrica');
    if (!b) {
      if (!e.target.closest('.painel') && !e.target.closest('.filtro')) fechar(null);
      return;
    }
    var abrir = b.getAttribute('aria-expanded') !== 'true';
    fechar(b);
    var painel = b.closest('li.item').querySelector('[data-painel="' + b.getAttribute('data-balao') + '"]');
    if (painel) painel.hidden = !abrir;
    b.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(null); });

  window.aplicarFiltro();
})();`;
}

/**
 * O comando do menu e dos grupos.
 *
 * TUDO DELEGADO NO DOCUMENTO, E LIGADO UMA VEZ SÓ. A versão anterior prendia ouvintes aos
 * elementos e voltava a prendê-los a cada troca de opção — e como a coluna e a barra são
 * RECONSTRUÍDAS a cada troca, o ouvinte antigo morria com o elemento e o novo empilhava sobre o
 * que sobrava. O sintoma era o pior possível: o ☰ abria e fechava no mesmo toque.
 *
 * Com delegação, o ouvinte não conhece os elementos: pergunta ao documento, na hora do clique,
 * onde é que ele caiu. Uma vez ligado, serve a coluna velha e a nova.
 *
 * OS TRÊS CAMINHOS DE ABERTURA DOS GRUPOS, e porque são três:
 *   · PONTEIRO — `:hover`, e só em aparelho que tem ponteiro (@media (hover: hover)). Num
 *     telemóvel o `:hover` fica «colado» depois do toque, e o grupo nunca mais fecharia;
 *   · TOQUE — o clique no título fixa o grupo aberto (`data-aberto="sim"` e `data-pinado="sim"`);
 *   · TECLADO — o foco dentro do grupo abre-o em `data-aberto="auto"`, e ao sair volta a fechar.
 *     `auto` é um terceiro estado de propósito: sem ele, `focusout` não sabe se deve fechar (foi
 *     o teclado que abriu) ou deixar (foi a pessoa que abriu).
 */
function scriptDoMenu() {
  return `(function () {
  if (window.__menuLigado) return;
  window.__menuLigado = true;

  var html = document.documentElement;
  var veu = document.querySelector('.veu');

  function coluna() { return document.getElementById('coluna-proposta'); }
  function lateral() { return /^(aberta|acordeao|marcada)$/.test(html.getAttribute('data-nav') || ''); }
  function barra() { return document.querySelector('.topnav'); }
  function botao() { return document.querySelector('.topnav .hamburger'); }
  function estreita() { return window.matchMedia('(max-width: 768px)').matches; }

  /* A FOLHA DO CELULAR — a mecânica da Produção. data-aberta é o estado DELA; body.coluna-aberta
     é o que acende o véu. Os dois porque são dois desenhos: a folha desliza por data-aberta, e o
     véu por uma classe no body — um véu dentro de um overflow-y:auto rolaria com o conteúdo. */
  function abrirFolha(sim) {
    var c = coluna();
    if (c) c.setAttribute('data-aberta', sim ? 'sim' : 'nao');
    document.body.classList.toggle('coluna-aberta', !!sim);
    var ab = document.getElementById('coluna-abrir');
    if (ab) ab.setAttribute('aria-expanded', String(!!sim));
    if (estreita() && botao()) botao().setAttribute('aria-expanded', String(!!sim));
  }
  function fechar() {
    abrirFolha(false);
    if (barra()) barra().classList.remove('aberto');
    if (botao() && !estreita()) botao().setAttribute('aria-expanded', 'false');
  }

  // ---------------------------------------------------------------- os grupos da coluna
  function por(g, estado) {
    g.setAttribute('data-aberto', estado);
    var b = g.querySelector('.grupo-titulo');
    if (b) b.setAttribute('aria-expanded', String(estado !== 'nao'));
  }
  function recolher(excepto) {
    [].slice.call(document.querySelectorAll('.coluna .grupo')).forEach(function (g) {
      if (g === excepto) return;
      if (g.getAttribute('data-pinado') === 'sim') return;
      var b = g.querySelector('.grupo-titulo');
      if (b && b.getAttribute('aria-expanded') === 'true') por(g, 'nao');
    });
  }

  // ---------------------------------------------------------------- os cliques
  document.addEventListener('click', function (e) {
    // 1. o ☰ da barra do sistema
    if (e.target.closest('.topnav .hamburger')) {
      var b = botao();
      if (!lateral()) { if (barra()) b.setAttribute('aria-expanded', String(barra().classList.toggle('aberto'))); return; }
      // Na coluna, o ☰ abre a MESMA folha que o «Seções»: a lei das duas navegações manda o
      // hambúrguer para a navegação global, e ele continua a abri-la — só mudou a apresentação.
      var c0 = coluna();
      abrirFolha(!c0 || c0.getAttribute('data-aberta') !== 'sim');
      return;
    }

    // 2. o botão «Seções» da barra da página — o gatilho da Produção
    if (e.target.closest('.coluna-abrir')) {
      var c1 = coluna();
      abrirFolha(!c1 || c1.getAttribute('data-aberta') !== 'sim');
      return;
    }

    // 3. o véu
    if (e.target.closest('.veu')) { fechar(); return; }

    // 4. o título de um grupo (a coluna estática, no computador)
    var titulo = e.target.closest('.coluna .grupo-titulo');
    if (titulo) {
      var g = titulo.closest('.grupo');
      if (!g || !lateral() || estreita()) return; // no celular o grupo é só um título
      var abrir = g.getAttribute('data-aberto') !== 'sim';
      recolher(g);
      g.setAttribute('data-pinado', abrir ? 'sim' : 'nao');
      por(g, abrir ? 'sim' : 'nao');
      return;
    }

    // 5. escolher um destino da folha fecha-a — como na Produção. Deixá-la aberta taparia
    //    justamente a página que se acabou de pedir.
    var alvo = e.target.closest('a[href]');
    var c2 = coluna();
    if (estreita() && alvo && c2 && c2.contains(alvo) && c2.getAttribute('data-aberta') === 'sim') {
      fechar();
      return;
    }

    // 6. um toque fora de um grupo aberto recolhe-o
    if (!e.target.closest('.coluna .grupo')) recolher(null);
  });

  // ---------------------------------------------------------------- o teclado
  document.addEventListener('focusin', function (e) {
    var g = e.target.closest && e.target.closest('.coluna .grupo');
    if (!g || !lateral() || estreita()) return;
    if (g.getAttribute('data-aberto') === 'sim') return;
    por(g, 'auto');
    recolher(g);
  });
  document.addEventListener('focusout', function (e) {
    var g = e.target.closest && e.target.closest('.coluna .grupo');
    if (!g) return;
    if (e.relatedTarget && g.contains(e.relatedTarget)) return;
    if (g.getAttribute('data-pinado') === 'sim') return;
    por(g, 'nao');
  });
  // O PONTEIRO SAI DO GRUPO — o :hover do CSS já o fecha; isto limpa o estado «auto» para ele não
  // ficar pendurado e reabrir sozinho no próximo foco.
  document.addEventListener('mouseleave', function (e) {
    var g = e.target.closest && e.target.closest('.coluna .grupo');
    if (!g) return;
    if (g.getAttribute('data-pinado') === 'sim') return;
    if (g.getAttribute('data-aberto') === 'auto' && !g.contains(document.activeElement)) por(g, 'nao');
  }, true);

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
  window.aoTrocarOpcao = function (opcao) { html.setAttribute('data-nav', opcao); fechar(); };
})();`;
}

/*
 * A FOLHA DESTA BANCADA. Duas partes, e a segunda é a que interessa:
 *
 *   · a COLUNA, que é a peça que se propõe. Todo o traço, cor e espaço vem dos papéis da folha
 *     (`--marca-fundo`, `--ornamento-forte`, `--raio-2`, `--esp-*`), porque é isso que a deixa
 *     nascer em `tools/templates/ciclo.css` sem inventar um valor — um tema troca o valor do
 *     papel, e a coluna acompanha;
 *   · a LISTA, que não é peça nova: são as regras de «Turmas cadastradas» da Produção, copiadas
 *     com os valores intactos. Copiadas, e não reinventadas, é o ponto: o que se decide aqui é
 *     ADOPTAR aquela identidade, e a única prova de que foi adoptada é não ter uma segunda.
 */
const CSS_NAV = `
/* ---------- a bancada e a nota (comuns às duas propostas) ---------- */
.nota-do-teste {
  max-width: 900px; margin: 0 auto var(--esp-5); padding: var(--esp-4) var(--esp-5);
  border: 1px solid var(--borda); border-left: 4px solid var(--marca);
  border-radius: var(--raio-2); background: var(--fundo-suave);
  font-size: 15px; color: var(--texto-suave);
}
.nota-do-teste p { margin: 0 0 var(--esp-2); }
.nota-do-teste p:last-child { margin: 0; }
.nota-do-teste strong { color: var(--texto); }

/* ---------- A COLUNA: a peça que se propõe ---------- */
.coluna { display: none; }
[data-nav="aberta"] .coluna, [data-nav="acordeao"] .coluna, [data-nav="marcada"] .coluna { display: flex; }
.coluna {
  position: fixed; top: 0; left: 0; bottom: 0; width: 248px; z-index: 21;
  flex-direction: column; overflow-y: auto; overflow-x: hidden;
  background: var(--marca-fundo); color: var(--sobre-marca);
  border-right: 3px solid var(--ornamento-forte);
  padding: var(--esp-4) var(--esp-3) var(--esp-5);
  box-shadow: var(--sombra-menu);
}
.coluna-marca {
  display: block; margin: 0 0 var(--esp-4); padding: 0 10px;
  font: 700 12px/1.2 var(--ui); letter-spacing: .12em; text-transform: uppercase;
  color: var(--ornamento-forte); text-decoration: none;
}
.coluna-marca:hover { color: var(--sobre-marca); }

/* O grupo: um título que abre, e os itens por baixo. O título é um botão porque também
   tem de funcionar sem ponteiro — no telemóvel e no teclado não há hover. */
.coluna .grupo { display: block; }
.coluna .grupo-titulo {
  display: flex; align-items: center; justify-content: space-between; gap: var(--esp-2);
  width: 100%; margin: 0; padding: 9px 10px; border: 0; border-radius: var(--raio-2);
  background: none; color: var(--sobre-marca); cursor: pointer;
  font: 15px/1.25 var(--ui); text-align: left;
}
.coluna .grupo-titulo:hover { background: var(--marca-fundo-hover); }
.coluna .grupo-titulo:focus-visible { outline: 2px solid var(--ornamento-forte); outline-offset: -2px; }
.coluna .grupo[data-aberto="sim"] > .grupo-titulo,
.coluna .grupo[data-aberto="auto"] > .grupo-titulo { background: var(--marca-fundo-hover); }
.coluna .seta { flex: 0 0 auto; opacity: .75; transition: transform .16s ease; }
.coluna .grupo[data-aberto="sim"] .seta,
.coluna .grupo[data-aberto="auto"] .seta { transform: rotate(90deg); }

/* O ACORDEÃO. max-height em vez de display:none porque é o que ANIMA e o que EMPURRA os
   de baixo — que é exactamente o que se quer: quando abre, os outros descem, e quando fecha
   voltam a subir. O filete à esquerda é o que diz que os itens pertencem ao grupo de cima. */
.coluna .grupo-itens {
  max-height: 0; overflow: hidden;
  margin: 0 0 0 10px; padding-left: 9px;
  border-left: 1px solid var(--ornamento);
  transition: max-height .16s ease;
}
.coluna .grupo-itens a {
  display: block; padding: 8px 10px; border-radius: var(--raio-2);
  color: var(--sobre-marca); text-decoration: none; font: 14px/1.25 var(--ui);
}
.coluna .grupo-itens a:hover { background: var(--marca-fundo-hover); }
.coluna .grupo-itens a:focus-visible { outline: 2px solid var(--ornamento-forte); outline-offset: -2px; }
.coluna .grupo-itens a[aria-current="page"] { background: var(--ativo-fundo); color: var(--ativo-texto); font-weight: 700; }
.coluna .grupo[data-aberto="sim"] > .grupo-itens,
.coluna .grupo[data-aberto="auto"] > .grupo-itens { max-height: 15rem; }

/* SÓ ONDE HÁ PONTEIRO. Num telemóvel o :hover fica colado ao toque e o grupo não fecharia. */
@media (hover: hover) {
  .coluna[data-compacta="sim"] .grupo:hover > .grupo-itens { max-height: 15rem; }
  .coluna[data-compacta="sim"] .grupo:hover > .grupo-titulo { background: var(--marca-fundo-hover); }
  .coluna[data-compacta="sim"] .grupo:hover .seta { transform: rotate(90deg); }
}
/* A coluna sempre aberta não tem acordeão nenhum. */
.coluna[data-compacta="nao"] .grupo-itens { max-height: none; }
.coluna[data-compacta="nao"] .seta { display: none; }
.coluna[data-compacta="nao"] .grupo-titulo { cursor: default; font-weight: 600; }

/* O GRUPO DO DOCUMENTO ACTUAL, MARCADO SEM ABRIR — a leitura mais compacta. Um filete de ouro
   à esquerda e o título na cor do ornamento: diz «estás aqui» sem gastar uma linha de altura, e
   sem depender de o item estar à vista. */
.coluna .grupo[data-atual="sim"] > .grupo-titulo {
  color: var(--ornamento-forte); font-weight: 700;
  box-shadow: inset 3px 0 0 var(--ornamento-forte);
}
.coluna .grupo[data-atual="sim"] > .grupo-titulo .seta { opacity: 1; }

/* «Aulas» é um destino, não uma pasta: sem seta, e com o peso de um título. */
.coluna a.direto {
  display: block; padding: 9px 10px; border-radius: var(--raio-2);
  color: var(--sobre-marca); text-decoration: none; font: 700 15px/1.25 var(--ui);
}
.coluna a.direto:hover { background: var(--marca-fundo-hover); }

/* ---------- a barra de cima, quando há coluna ----------
   A BARRA FICA AO LADO DA COLUNA, e não por baixo dela: o body é quem cede a largura. */
[data-nav="aberta"] body, [data-nav="acordeao"] body, [data-nav="marcada"] body { padding-left: 248px; }
[data-nav="aberta"] .topnav, [data-nav="acordeao"] .topnav, [data-nav="marcada"] .topnav { left: 248px; }
/* O documento actual, à esquerda da barra; o Bastidores, na ponta oposta. Os dois são
   arranjos de CSS sobre a barra que o desenhar() já produz — nenhum HTML novo. */
[data-nav="aberta"] .doc-atual, [data-nav="acordeao"] .doc-atual,
[data-nav="marcada"] .doc-atual {
  margin-left: var(--esp-3); padding-left: var(--esp-3);
  border-left: 2px solid var(--ornamento-forte);
  font: 600 14px/1.2 var(--ui); color: var(--sobre-marca);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto;
}
[data-nav="aberta"] .topnav .nav-links, [data-nav="acordeao"] .topnav .nav-links,
[data-nav="marcada"] .topnav .nav-links {
  flex: 0 0 auto; margin-left: auto;
}
.doc-atual { display: none; }
[data-nav="aberta"] .doc-atual, [data-nav="acordeao"] .doc-atual,
[data-nav="marcada"] .doc-atual { display: inline-block; }
.veu { display: none; }

/* ---------- A BARRA DA PÁGINA — só no celular ----------
   É a .lateral-barra da Produção, com outra roupa. Ela nasce oculta fora da media query: em
   tela larga a navegação é a coluna, e não há nada a subir. */
.coluna-barra { display: none; }
.coluna-puxador { display: none; }

/* ---------- O CELULAR: A MESMA SOLUÇÃO DA PRODUÇÃO (23/10/2026) ----------
   A coluna deixa de ser gaveta lateral e passa a ser FOLHA INFERIOR: sobe de baixo, com o
   pegador, os cantos de cima arredondados, o véu atrás e o limite de 78vh. É a mecânica da
   Produção, e é a mesma peça — não há uma segunda lista para envelhecer.

   DUAS COISAS MUDAM EM RELAÇÃO À PRODUÇÃO, e as duas são declaradas:
   · o FUNDO fica o da coluna (burgundy), e não o branco da folha da Produção. A lei das duas
     navegações (IDENTIDADE-VISUAL.md) diz que a do SISTEMA e a da PÁGINA não são a mesma
     coisa, e a cor é o que as distingue. A mecânica é emprestada; o papel, não;
   · o GATILHO é duplo: o botão «Seções» desta barra — como na Produção — e o ☰ da barra do
     sistema, que já existia. A lei manda o hambúrguer para a navegação global; ele continua a
     abrir a mesma folha, em vez de ficar sem função. */
@media (max-width: 768px) {
  [data-nav="aberta"] body, [data-nav="acordeao"] body, [data-nav="marcada"] body { padding-left: 0; }
  [data-nav="aberta"] .topnav, [data-nav="acordeao"] .topnav, [data-nav="marcada"] .topnav { left: 0; }
  .doc-atual { display: none !important; }

  .coluna-barra {
    display: flex; align-items: center; gap: var(--esp-3);
    padding: var(--esp-4) var(--esp-4) 0;
  }
  .coluna-atual {
    min-width: 0; display: flex; align-items: baseline; gap: 6px;
    font: 700 15px/1.25 var(--ui); color: var(--texto);
  }
  .coluna-atual small {
    font: 700 10px/1.3 var(--ui); letter-spacing: .09em;
    text-transform: uppercase; color: var(--texto-suave);
  }
  /* O separador é do desenho, não do conteúdo: sem ele os dois versos correm juntos na
     leitura de ecrã («CiclosPlanos do ciclo»). */
  .coluna-atual small::after { content: "·"; margin-left: 5px; }
  .coluna-abrir {
    margin-left: auto; flex: 0 0 auto; cursor: pointer;
    border: 1px solid var(--borda-campo); border-radius: var(--raio-pilula);
    background: var(--superficie); padding: .5rem .85rem;
    font: 600 .82rem/1 var(--ui); color: var(--marca);
    display: inline-flex; align-items: center; gap: 5px;
  }
  .coluna-abrir:hover { filter: brightness(.97); }
  .coluna-abrir:active { transform: translateY(1px); }
  .coluna-abrir:focus-visible { outline: 2px solid var(--marca); outline-offset: 2px; }

  /* A COLUNA VIRA FOLHA. top:auto é o que desfaz o top:0; bottom:0 do desktop — sem ele a
     folha continuaria a ocupar a altura toda e o translateY não teria para onde a esconder. */
  .coluna {
    position: fixed; left: 0; right: 0; bottom: 0; top: auto;
    width: auto; max-width: none; z-index: 60;
    border-right: 0; border-radius: var(--raio-3) var(--raio-3) 0 0;
    box-shadow: 0 -12px 34px rgba(31, 28, 26, .20);
    padding: 0 0 calc(var(--esp-4) + env(safe-area-inset-bottom, 0px));
    max-height: 78vh; overflow-y: auto;
    transform: translateY(101%); transition: transform .22s ease;
  }
  .coluna[data-aberta="sim"] { transform: translateY(0); }
  .coluna-puxador {
    display: block; width: 36px; height: 4px; border-radius: 2px;
    background: var(--ornamento); opacity: .55; margin: 10px auto 2px;
  }
  .coluna .coluna-marca { padding: var(--esp-3) var(--esp-5) var(--esp-2); margin: 0; }

  /* NA FOLHA NÃO HÁ ACORDEÃO: a altura é a da tela quase inteira, e um menu que abre e fecha
     dentro de uma folha é um menu a esconder-se dentro de outro. Tudo à vista. */
  .coluna[data-compacta="sim"] .grupo-itens { max-height: none; }
  .coluna[data-compacta="sim"] .seta { display: none; }
  .coluna[data-compacta="sim"] .grupo-titulo { cursor: default; }
  /* Os grupos passam a <h2> no desenho — miúdos, em maiúsculas, como os da Produção — e os
     destinos a uma linha alta de dedo.
     SEM opacity NOS TEXTOS, e isto é medido: --gold-claro sobre o burgundy da folha dá
     5,03:1, que é exactamente o mínimo AA. A .85 que aqui esteve baixava-o para 4,05:1 e
     reprovava. A hierarquia faz-se pelo tamanho e pelo espaço, não por transparência. */
  .coluna .grupo-titulo {
    padding: var(--esp-3) var(--esp-5) var(--esp-1);
    font: 700 10.5px/1 var(--ui); letter-spacing: .1em; text-transform: uppercase;
    color: var(--texto-destaque-marca); border-radius: 0;
  }
  .coluna .grupo-titulo:hover { background: none; }
  .coluna .grupo-itens { margin: 0; padding-left: 0; border-left: 0; }
  .coluna .grupo-itens a {
    display: flex; align-items: center; gap: .6rem;
    padding: .8rem var(--esp-5); border-radius: 0; font-size: 1rem;
  }
  .coluna .grupo-itens a[aria-current="page"]::after { content: "✓"; margin-left: auto; }
  .coluna a.direto { padding: .8rem var(--esp-5); border-radius: 0; font-size: 1rem; font-weight: 600; }
  .coluna .grupo[data-atual="sim"] > .grupo-titulo { box-shadow: none; color: var(--ornamento-forte); }

  /* O VÉU. Ele mora fora da coluna e é o body quem o mostra — na Produção é a .lateral que
     o acende, mas lá a folha é a própria .lateral; aqui a coluna é overflow-y:auto e um véu
     dentro dela rolaria junto. */
  .veu {
    display: block; position: fixed; inset: 0; z-index: 55;
    background: rgba(31, 28, 26, .36); opacity: 0; pointer-events: none;
    transition: opacity .2s ease;
  }
  body.coluna-aberta .veu { opacity: 1; pointer-events: auto; }
}

/* ---------- O FILTRO ---------- */
.filtro { margin: 0 0 var(--esp-4); }
.caixa.filtrar {
  display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--esp-4);
  margin: 0; padding: var(--esp-4);
}
.campo-filtro { display: flex; flex-direction: column; gap: var(--esp-1); }
.campo-filtro .campo-rotulo { margin: 0; }
.campo-filtro.busca { flex: 1 1 260px; }
.campo-filtro select { min-width: 190px; }
.filtro-conta { margin: 0 0 4px auto; font: 13px/1 var(--ui); color: var(--texto-suave); }
@media (max-width: 768px) {
  .caixa.filtrar { padding: var(--esp-3); gap: var(--esp-3); }
  .campo-filtro select { min-width: 0; }
  .campo-filtro:not(.busca) { flex: 1 1 45%; }
  .filtro-conta { margin: 0; flex-basis: 100%; }
}

/* ---------- A LISTA — as regras de «Turmas cadastradas», sem uma cor nova ----------
   Copiadas de motor/servidor/bastidores.js (o bloco de .turma), com os valores intactos.
   O que muda é o nome do invólucro (li.item em vez de li.turma), porque a peça passa a
   servir duas listas — e é essa a promessa: uma peça, duas listas. */
.lista { list-style: none; margin: 0; padding: 0; }
li.item { display: block; margin-bottom: .6rem; }
li.item .linha-turma { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
li.item .linha-turma .nome { flex: 1 1 14rem; min-width: 0; }
li.item .linha-turma .acoes { margin-left: auto; display: inline-flex; gap: .3rem; flex-wrap: wrap; }
li.item .dono { color: var(--texto-suave); font-size: .85rem; margin-top: .15rem; }

li.item .metricas {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .5rem; margin: .6rem 0 0;
}
@media (max-width: 360px) { li.item .metricas { grid-template-columns: minmax(0, 1fr); } }

/* A CAIXINHA É O BOTÃO. O appearance/border/font de origem têm de sair, senão vem o
   controle do navegador por cima do desenho — e o text-align: left é o que impede o rótulo
   de ir para o centro, que é o que um <button> faz por omissão. */
li.item .metrica {
  position: relative; display: block; width: 100%; margin: 0; text-align: left;
  appearance: none; -webkit-appearance: none;
  background: var(--fundo-suave); border: 1px solid var(--borda-campo);
  border-radius: var(--raio-2); padding: .45rem 1.9rem .45rem .6rem; min-width: 0;
  cursor: pointer; font: inherit; color: inherit;
}
li.item .metrica:hover { background: var(--fundo-hover); border-color: var(--borda-forte); }
li.item .metrica:focus-visible { outline: 2px solid var(--marca); outline-offset: 1px; }
li.item .metrica .k {
  display: block; font: 700 .66rem/1.2 var(--ui); letter-spacing: .08em; text-transform: uppercase;
  color: var(--texto-suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
li.item .metrica .v {
  display: block; font: 700 .95rem/1.25 var(--ui); color: var(--texto);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* A caixinha DIZ que está aberta. Sem isto o painel aparece abaixo da fila e não se sabe de
   onde veio — e com três caixinhas iguais, é a única pista. */
li.item .metrica[aria-expanded="true"] { background: var(--fundo-citacao); border-color: var(--borda-forte); }
/* O «?» fica: é o que diz que há mais dentro. Deixa de ser controle e passa a ser desenho —
   por isso aria-hidden na marcação, e nenhum cursor próprio. */
li.item .metrica .q {
  position: absolute; top: .28rem; right: .28rem; width: 1.25rem; height: 1.25rem;
  border-radius: var(--raio-pilula); border: 1px solid var(--borda-campo);
  background: var(--superficie); color: var(--texto-suave);
  font: 700 .72rem/1 var(--ui); display: grid; place-items: center; pointer-events: none;
}
li.item .metrica[aria-expanded="true"] .q {
  background: var(--marca-fundo); color: var(--sobre-marca); border-color: var(--marca-fundo);
}

li.item .painel {
  margin: .55rem 0 0; padding: .7rem .8rem; background: var(--fundo-citacao);
  border: 1px solid var(--borda-campo); border-radius: var(--raio-2);
}
li.item .painel[hidden] { display: none; }
li.item .painel .grade { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem .9rem; }
li.item .painel .grade .k {
  display: block; font: 700 .66rem/1.2 var(--ui); letter-spacing: .08em; text-transform: uppercase;
  color: var(--texto-suave);
}
li.item .painel .grade .v { display: block; font: 700 .88rem/1.35 var(--ui); color: var(--texto); }
li.item .painel .nota { margin: .6rem 0 0; font-size: .8rem; line-height: 1.4; color: var(--texto-suave); }
li.item .painel .nota:first-child { margin-top: 0; }
li.item .painel .chips { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem; }
li.item .painel .escala {
  display: flex; min-width: 0; border: 1px solid var(--borda-campo);
  border-radius: var(--raio-2); overflow: hidden; margin-top: .5rem;
}
li.item .painel .escala span {
  flex: 1 1 0; min-width: 0; text-align: center; padding: .3rem .2rem;
  font: 700 .72rem/1.2 var(--ui); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.nivel-ok { background: var(--ok); color: var(--superficie); }
.nivel-razoavel { background: var(--ok-fundo); color: var(--ok); box-shadow: inset 0 0 0 1px var(--ok); }
.nivel-alerta { background: var(--alerta); color: var(--superficie); }
.nivel-neutro { background: var(--fundo-faixa); color: var(--texto-suave); }
.chip {
  display: inline-block; margin: 0; padding: .1rem .45rem; background: var(--fundo-faixa);
  border: 1px solid var(--borda-campo); border-radius: var(--raio-pilula);
  font-size: .82rem; color: var(--texto);
}
.paginacao {
  display: flex; align-items: center; justify-content: flex-end; gap: .5rem;
  padding: .5rem 0 .1rem; font-size: .85rem; color: var(--texto-suave);
}
.selo { display: inline-block; }

/* ---------- AS DUAS COLUNAS E A FICHA (24/10/2026) ----------
   A bancada da proposta 5 compara três contagens de caixinha. As duas regras abaixo são as que
   NÃO existem na folha do projeto — e é de propósito que vivem aqui: enquanto a escolha não
   estiver feita, não há peça nova. Se a opção 2 for a escolhida, «duas» passa a ser um
   modificador declarado em ciclo.css; se for a 3, é a .fatos que nasce lá. */
/* O QUE A MEDIÇÃO OBRIGOU A CORRIGIR NA PRÓPRIA CAIXINHA (24/10/2026).
 *
 * A 390px, a caixa tem 111px e o valor lá dentro tem **67px** — porque o «?» reserva 30,4px de
 * padding-right (1,9rem), 27% da caixa. Medido na lista de planos que já está publicada: três
 * valores saem cortados com reticências — «Balé Nível 2» (precisa 89), «Cafe No Bule» (97) e
 * «PO aguardando» (118). Não é um caso de bordo: é o nome da turma.
 *
 * Duas correções, e as duas medidas:
 *   1. o «?» deixa de reservar a faixa inteira — fica sobre a linha do rótulo, que é pequena,
 *      e a linha do valor passa a usar a caixa toda (67 → 97px);
 *   2. o valor pode quebrar em DUAS linhas. Com 97px × 2, tudo o que a listagem escreve cabe:
 *      o período completo (187px) numa linha, «Açúcar Branco» (109) numa linha, «PO aguardando»
 *      (118) em duas.
 *
 * Isto NÃO é uma opção da bancada: é um defeito da peça de hoje, e a proposta parte dele
 * corrigido. Na folha do projeto são duas regras — e uma delas mexe no congelado. */
li.item .metrica { padding-right: .6rem; }
li.item .metrica .k { padding-right: 1.25rem; }
li.item .metrica .v {
  white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}

li.item .metricas.duas { grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (max-width: 360px) { li.item .metricas.duas { grid-template-columns: minmax(0, 1fr); } }

/* A linha de factos: o mesmo dado das caixinhas, sem a caixa. Os pontos são do desenho, e não do
   texto — para a leitura de ecrã não colar as palavras umas nas outras. */
li.item .fatos { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 .4rem; margin-top: .2rem; }
li.item .fatos .fato { font: 700 .88rem/1.35 var(--ui); color: var(--texto); }
li.item .fatos .fato + .fato::before { content: "·"; margin-right: .4rem; color: var(--texto-suave); }

/* O que a bancada mostra e não é peça: o título de cada lista e a sua dica. */
.bloco-lista { margin: 0 0 2.2rem; }
.bloco-lista h2 { margin: 0 0 .2rem; font-size: 1.15rem; color: var(--marca-texto); }
.bloco-lista .dica { margin: 0 0 .6rem; font-size: .9rem; color: var(--texto-suave); }
.bloco-lista .filtro { margin-bottom: .6rem; }
.nota-do-teste .fina { font-size: .9rem; color: var(--texto-suave); }
`;

/** O esqueleto das duas páginas: coluna (quando há), barra, conteúdo, bancada. */
function paginaDeNav({ titulo, opcaoInicial, nav, barra, secoes, corpo }) {
  return `<!DOCTYPE html>
<html lang="pt-BR" data-opcao="${opcaoInicial}" data-nav="${nav || opcaoInicial}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} · Sistema Lastro</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E">
<style>
${CSS}
</style>
<style>
${CSS_BANCADA}
${CSS_NAV}
</style>
</head>
<body>

${barra}
<div class="veu" aria-hidden="true"></div>
${secoes || ''}

${corpo}

</body>
</html>
`;
}

const OPCOES_NAV = [
  { id: 'hoje', n: '0', t: 'Hoje — a barra com 24 entradas', m: '1,6 tela',
    d: 'controle: cada documento é uma entrada; no celular, com os grupos abertos, o painel mede 1298 px' },
  { id: 'aberta', n: 'A', t: 'Coluna sempre aberta', m: '485 px',
    d: 'os 11 destinos à vista de uma vez; o menu sai do caminho, e o olho tem de varrer a coluna toda' },
  { id: 'acordeao', n: 'B', t: 'Compacta, o grupo actual aberto', m: '284 px',
    d: 'quatro títulos, mais os itens do documento actual à vista: sabe-se onde se está sem procurar' },
  { id: 'marcada', n: 'C', t: 'Compacta, só o grupo actual marcado', m: 'ESCOLHIDA · 217 px',
    d: 'tudo fechado; o grupo do documento leva um filete de ouro. A mais curta, e ainda diz onde se está' },
];

function proporNavegacao() {
  const corpo = `<header class="doc">
  <h1>Planos do ciclo</h1>
  <p class="subtitulo">Calango · 2 turmas · 2 planos</p>
</header>

<main>
<div class="conteudo">

<div class="nota-do-teste">
  <p><strong>A coluna é a decidida — com uma correção.</strong> Na versão de ontem ela mostrava os
  onze destinos de uma vez. Agora ela é <em>compacta</em>: mostra quatro títulos, e o grupo abre
  quando o ponteiro entra, empurrando os de baixo para baixo. O grupo do documento actual já nasce
  aberto — sem isso, na coluna recolhida, perde-se a única pista de onde se está.</p>
  <p><strong>O Bastidores saiu da coluna.</strong> Ele está na barra de cima, na ponta oposta à
  marca, com o Estúdio e a Produção. A coluna fica com o trabalho de sala: Sistema Lastro, Ciclos,
  Aulas, Planejamento, Área do Professor.</p>
  <p><strong>B e C são as duas leituras do mesmo acordeão</strong>, e a diferença é uma tensão que
  vale a pena ver de perto: você pediu a coluna compacta <em>e</em> pediu para saber onde está.
  Medido: <strong>A</strong> ocupa <strong>485 px</strong>, <strong>B</strong> ocupa
  <strong>284 px</strong> e <strong>C</strong> ocupa <strong>217 px</strong>. Em <strong>B</strong>
  o grupo do documento abre e vê-se o item aceso; em <strong>C</strong> fecha-se tudo e o grupo leva
  um filete de ouro no título — o «onde estou» passa a ser do grupo, não do item.</p>
  <p>Ponha o ponteiro em <em>Ciclos</em>, depois em <em>Área do Professor</em>: o grupo abre,
  empurra os de baixo para baixo, e fecha quando o ponteiro sai. É o mesmo movimento nos dois.</p>
  <p><strong>No celular, a coluna vira FOLHA INFERIOR</strong> — a mesma solução da Produção: uma
  linha com o grupo e o documento em que se está, um botão <em>Seções</em>, e a navegação sobe de
  baixo com o pegador, o véu atrás e o limite de 78vh. Escolher fecha a folha. Abra esta página no
  telemóvel, ou estreite a janela abaixo de 768 px, para a ver.</p>
</div>

${listaDePlanos('producao')}

</div>
</main>`;

  const barraDaColuna = [
    colunaDoMenu(true, true),
    barraDoMenu(MENU_DA_BARRA, '/ciclos/planos/', '<span class="doc-atual">Planos do ciclo</span>'),
  ].join('\n');

  const base = paginaDeNav({
    titulo: 'O menu que deixa de contar documentos',
    opcaoInicial: 'marcada',
    barra: barraDaColuna,
    secoes: barraDeSecoes('Ciclos', 'Planos do ciclo'),
    corpo,
  });

  /* A COLUNA E A BARRA MUDAM COM A OPÇÃO. As três formas são montadas AQUI, no construtor, e o
   * script só troca qual delas o `<html data-nav>` deixa aparecer — porque cada uma é um HTML
   * diferente, e desenhá-las em tempo de execução seria reimplementar o `nav.desenhar()`. */
  const barraDeHoje = barraDoMenu(MENU_DE_HOJE, '/documentos/');
  const colunaAberta = colunaDoMenu(false);
  const colunaCompacta = colunaDoMenu(true, false);
  const colunaMarcada = colunaDoMenu(true, true);
  const barraDasColunas = barraDoMenu(MENU_DA_BARRA, '/ciclos/planos/',
    '<span class="doc-atual">Planos do ciclo</span>');

  const troca = `(function () {
  var BARRAS = {
    hoje: ${JSON.stringify(barraDeHoje)},
    aberta: ${JSON.stringify(barraDasColunas)},
    acordeao: ${JSON.stringify(barraDasColunas)},
    marcada: ${JSON.stringify(barraDasColunas)}
  };
  var COLUNAS = {
    aberta: ${JSON.stringify(colunaAberta)},
    acordeao: ${JSON.stringify(colunaCompacta)},
    marcada: ${JSON.stringify(colunaMarcada)}
  };
  var html = document.documentElement;
  var alvo = document.querySelector('.topnav');
  var coluna = document.getElementById('coluna-proposta');
  function por(opcao) {
    if (BARRAS[opcao] && alvo) {
      var molde = document.createElement('div');
      molde.innerHTML = BARRAS[opcao];
      var nova = molde.firstElementChild;
      alvo.replaceWith(nova);
      alvo = nova;
    }
    if (COLUNAS[opcao] && coluna) {
      var m2 = document.createElement('div');
      m2.innerHTML = COLUNAS[opcao];
      var novaColuna = m2.firstElementChild;
      coluna.replaceWith(novaColuna);
      coluna = novaColuna;
    }
  }
  por(html.getAttribute('data-nav'));
  var anterior = window.aoTrocarOpcao;
  window.aoTrocarOpcao = function (opcao) {
    if (typeof anterior === 'function') anterior(opcao);
    por(opcao);
  };
})();`;

  return base
    .replace('</body>', `${marcacaoDaBancada({
      sobre: 'Proposta 3 de 4 · o menu',
      titulo: 'Onde o menu se lê',
      intro: 'Três desfechos sobre a mesma página. As entradas são contadas do menu real; a '
        + 'altura do painel e a largura da coluna são medidas no navegador.',
      opcoes: OPCOES_NAV,
      inicio: 'marcada',
    })}
<script>${scriptDaBancada(OPCOES_NAV)}</script>
<script>${scriptDoMenu()}</script>
<script>${troca}</script>
<script>${scriptDaLista()}</script>
</body>`);
}

const OPCOES_LISTA = [
  { id: 'producao', n: '1', t: 'Ritmo · Régua · Conteúdos', m: '141 px/plano',
    d: 'a decoração da Produção com outra matéria: os dados de trabalho da turma atrás do «?»' },
  { id: 'caixas', n: '2', t: 'Turma · Professor · Cadeia', m: 'ESCOLHIDA · 141 px',
    d: 'as quatro colunas em três caixinhas; a linha de complemento fica com o ciclo e o volume' },
];

function proporListagem() {
  const corpo = `<header class="doc">
  <h1>Planos do ciclo</h1>
  <p class="subtitulo">Calango · 2 turmas · 2 planos</p>
</header>

<main>
<div class="conteudo">

<div class="nota-do-teste">
  <p><strong>A peça é a mesma da Produção, e é isso que se está a decidir.</strong> O cartão, a
  linha do nome com as ações, a linha de complemento e as três caixinhas com o «?» são as regras de
  <em>Turmas cadastradas</em>, copiadas com os valores intactos — nenhuma cor, raio ou espaço
  novo. O que muda é o invólucro, porque a peça passa a servir duas listas.</p>
  <p><strong>A caixinha toda é clicável.</strong> O «?» continua lá, mas deixou de ser o alvo: na
  Produção ele é um botão de 20 px dentro da caixinha; aqui a caixinha <em>é</em> o botão, e o «?»
  é o desenho que diz «há mais dentro». Toque em qualquer ponto de <em>Ritmo</em>, de
  <em>Régua</em> ou de <em>Conteúdos</em> — no computador e no telemóvel.</p>
  <p>Abre uma por cartão, fecha com o mesmo toque, com <em>Escape</em> ou tocando fora. A caixinha
  acesa diz qual está aberta.</p>
  <p><strong>Escolhida a opção 2</strong>, e ela fica ao lado da lista de turmas sem se confundir
  com ela: as caixinhas são <em>Turma · Professor · Cadeia</em>, e o ritmo, a régua e os conteúdos
  ficam a um toque, no cartão da turma. A linha de complemento fica com o ciclo e o volume, para
  nenhum dado aparecer duas vezes.</p>
  <p><strong>As duas ocupam o mesmo</strong> — 141 px por plano no computador, 178 px no celular —
  porque o que muda é a matéria dentro das caixinhas, não a caixinha. Medir não serviu para
  escolher entre elas: serviu para saber que a escolha não custa altura.</p>
</div>

<div id="lista-destino">
${listaDePlanos('caixas')}
</div>

</div>
</main>`;

  const barra = [
    colunaDoMenu(true, true),
    barraDoMenu(MENU_DA_BARRA, '/ciclos/planos/', '<span class="doc-atual">Planos do ciclo</span>'),
  ].join('\n');

  /* `nav` e `opcao` são coisas diferentes nesta página: a opção é o que a BANCADA compara (o que
   * vão ser as três caixinhas), e o `nav` é o menu — que aqui já é o decidido. Sem esta separação
   * a página da listagem mostrava a barra de hoje, e não aquela em que a lista vai viver. */
  const base = paginaDeNav({
    titulo: 'A lista que substitui o menu',
    opcaoInicial: 'caixas',
    nav: 'marcada',
    barra,
    secoes: barraDeSecoes('Ciclos', 'Planos do ciclo'),
    corpo,
  });

  /* A LISTA É RECONSTRUÍDA POR OPÇÃO, e não escondida por CSS: são duas marcações diferentes, e
   * dois blocos no DOM seriam duas vezes o mesmo conteúdo para o leitor de ecrã. Cada troca volta
   * a ligar o filtro e as caixinhas. */
  const listas = {
    producao: listaDePlanos('producao'),
    caixas: listaDePlanos('caixas'),
  };
  const troca = `(function () {
  var LISTAS = ${JSON.stringify(listas)};
  var html = document.documentElement;
  var destino = document.getElementById('lista-destino');
  window.aoTrocarOpcao = function (opcao) {
    if (!LISTAS[opcao] || !destino) return;
    destino.innerHTML = LISTAS[opcao];
    // Os ouvintes são delegados no documento, e por isso não morrem com a lista antiga: só é
    // preciso recontar os itens visíveis, que mudaram com a marcação.
    if (typeof window.aplicarFiltro === 'function') window.aplicarFiltro();
  };
})();`;

  return base
    .replace('</body>', `${marcacaoDaBancada({
      sobre: 'Proposta 4 de 4 · a listagem',
      titulo: 'A forma da lista',
      intro: 'A mesma decoração da Produção, com a área de toque na caixinha toda. '
        + 'Filtre e abra as caixinhas em qualquer das duas.',
      opcoes: OPCOES_LISTA,
      inicio: 'caixas',
    })}
<script>${scriptDaBancada(OPCOES_LISTA)}</script>
<script>${scriptDoMenu()}</script>
<script>${scriptDaLista()}</script>
<script>${troca}</script>
</body>`);
}

function indice() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Propostas de layout · Sistema Lastro</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E">
<style>
${CSS}
</style>
<style>
${CSS_BANCADA}
.aviso-proposta {
  max-width: 760px; margin: 0 auto 24px; padding: 12px 16px; border-radius: 8px;
  background: var(--fundo-faixa); border: 1px solid var(--borda); border-left: 4px solid var(--marca);
  font-size: 14px; color: var(--texto-suave);
}
.cartoes { display: grid; gap: 16px; max-width: 760px; margin: 0 auto; }
.cartao {
  display: block; text-decoration: none; color: inherit;
  background: var(--superficie); border: 1px solid var(--borda); border-radius: 12px;
  padding: 18px 20px; transition: border-color .14s ease, transform .14s ease;
}
.cartao:hover { border-color: var(--marca); transform: translateY(-1px); }
.cartao .sobre { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--marca-texto); font-weight: 700; margin: 0 0 4px; }
.cartao h2 { margin: 0 0 6px; font-size: 20px; color: var(--marca); }
.cartao p { margin: 0 0 10px; font-size: 15px; color: var(--texto-suave); }
.cartao .abrir { font: 700 14px/1 var(--ui); color: var(--marca); border-bottom: 1px dotted currentColor; padding-bottom: 2px; }
.cartao table { font-size: 14px; margin: 8px 0 12px; }
.cartao th, .cartao td { padding: 4px 8px; }
</style>
</head>
<body>

<header class="doc">
  <h1>Propostas de layout</h1>
  <p class="subtitulo">Quatro decisões que precisam da sua escolha — contadas, não estimadas</p>
</header>

<main>
<div class="conteudo">

<p class="aviso-proposta"><strong>Isto não é o produto.</strong> São bancadas de comparação: cada
aba mostra a <em>mesma</em> página com as alternativas que estão em cima da mesa. O conteúdo é o
real — a Aula 01, o formulário de lançamento e os dois planos da escola de teste —, e o CSS é o do
projeto, embutido. Nada aqui muda o que está publicado na escola; a escolha é que vira código.</p>

<div class="cartoes">

  <a class="cartao" href="proposta-titulo.html">
    <p class="sobre">Proposta 1 de 4 · leitura</p>
    <h2>O título que não se perde</h2>
    <p>Hoje o título sai da tela quando se rola, e a página da aula é longa: perde-se de que
    documento se trata. Quatro desfechos, um mecanismo.</p>
    <table>
      <tr><th>Opção</th><th>Desktop</th><th>Celular</th></tr>
      <tr><td>A · preso no topo</td><td>146 px</td><td><strong>374 px</strong></td></tr>
      <tr><td>B · encolhe</td><td>33 px</td><td>60 px</td></tr>
      <tr><td>C · vai para a coluna</td><td><strong>0 px</strong></td><td>60 px</td></tr>
      <tr><td>D · vai para o menu</td><td>146 px</td><td><strong>0 px</strong></td></tr>
    </table>
    <span class="abrir">Abrir a proposta →</span>
  </a>

  <a class="cartao" href="proposta-paginacao.html">
    <p class="sobre">Proposta 2 de 4 · tela de trabalho</p>
    <h2>A paginação no celular</h2>
    <p>O rodapé de paginação do lançamento é bom no computador e mau no celular. Ele não ocupa 52 px
    como parece: ocupa <strong>182 px</strong>, 21% da tela.</p>
    <table>
      <tr><th>Opção</th><th>Ocupa no celular</th><th>Sobra</th></tr>
      <tr><td>1 · vira bloco no fim</td><td>0 px</td><td>783 px</td></tr>
      <tr><td>2 · compacta com «⋯»</td><td><strong>47 px</strong></td><td>736 px</td></tr>
      <tr><td>3 · esconde ao descer</td><td>0 px</td><td>783 px</td></tr>
    </table>
    <span class="abrir">Abrir a proposta →</span>
  </a>

  <a class="cartao" href="proposta-navegacao.html">
    <p class="sobre">Proposta 3 de 4 · o menu <strong>decidido</strong></p>
    <h2>A coluna que abre no ponteiro</h2>
    <p>Coluna à esquerda, compacta: quatro títulos à vista, e o grupo abre quando o ponteiro entra —
    empurrando os de baixo, e recompondo quando ele sai. O Bastidores saiu da coluna e foi para a
    ponta direita da barra.</p>
    <table>
      <tr><th>Opção</th><th>Destinos</th><th>A coluna ocupa</th><th>Leitura a 1280</th></tr>
      <tr><td>0 · hoje</td><td><strong>24</strong></td><td>1,6 tela no celular</td><td>1180 px</td></tr>
      <tr><td>A · sempre aberta</td><td>11</td><td>485 px</td><td>1032 px</td></tr>
      <tr><td>B · grupo actual aberto</td><td>11</td><td>284 px</td><td>1032 px</td></tr>
      <tr><td>C · só o grupo marcado</td><td>11</td><td><strong>217 px</strong></td><td>1032 px</td></tr>
    </table>
    <span class="abrir">Abrir a proposta →</span>
  </a>

  <a class="cartao" href="proposta-listagem.html">
    <p class="sobre">Proposta 4 de 4 · a listagem <strong>decidida</strong></p>
    <h2>A lista com a cara da Produção</h2>
    <p>As mesmas peças de «Turmas cadastradas»: a linha do nome com as ações, a linha de
    complemento e as três caixinhas com o «?» — agora com <strong>a caixinha toda clicável</strong>,
    no computador e no telemóvel.</p>
    <table>
      <tr><th>Caixinha</th><th>Abre</th></tr>
      <tr><td>Ritmo</td><td>frequência, dias e horário, duração e período</td></tr>
      <tr><td>Régua</td><td>a escala de níveis, com a cor de cada degrau</td></tr>
      <tr><td>Conteúdos</td><td>os conteúdos em chips</td></tr>
    </table>
    <span class="abrir">Abrir a proposta →</span>
  </a>

  <a class="cartao" href="proposta-padrao-da-lista.html">
    <p class="sobre">Proposta 5 · o padrão da lista</p>
    <h2>As oito listas, com o mesmo gesto</h2>
    <p>A forma da listagem passou a valer para todas: <strong>de quem é · quem fez ·
    quando</strong>, sempre nessa ordem. Muda o rótulo, nunca o lugar. O que está em aberto são
    as três listas de documento — referências, glossário e notação.</p>
    <table>
      <tr><th>Lista</th><th>De quem</th><th>Quem fez</th><th>Quando</th></tr>
      <tr><td>Planos do ciclo</td><td>Turma</td><td>Professor</td><td>Período</td></tr>
      <tr><td>Aulas</td><td>Turma</td><td>Professor</td><td>Horário</td></tr>
      <tr><td>Anamnese</td><td>Turma</td><td>Quem fez</td><td>Data</td></tr>
      <tr><td>Plano de ensino</td><td>Turma</td><td>Quem fez</td><td>Vigência</td></tr>
      <tr><td>Plano de Observação</td><td>Turma</td><td>Quem fez</td><td>Período</td></tr>
      <tr><td>Referências / Glossário / Notação</td><td>Turma</td><td>—</td><td>Ciclo / Norma</td></tr>
    </table>
    <span class="abrir">Abrir a proposta →</span>
  </a>

  <a class="cartao" href="proposta-verbetes.html">
    <p class="sobre">Proposta 7 · a listagem do verbete <strong>decidida — opção 1</strong></p>
    <h2>Os exercícios com a cara das turmas</h2>
    <p>Escolhida a <strong>opção 1</strong>, e implementada na Produção: as <strong>mesmas
    peças</strong> da listagem de turmas — o nome e os selos numa linha, o complemento por baixo,
    e as três caixinhas com o «?» que abrem. A da notação abre a decomposição trecho a trecho,
    lida do motor. E os nomes em português.</p>
    <table>
      <tr><th>Opção</th><th>Na bancada (320)</th><th>No produto, por cartão</th></tr>
      <tr><td>0 · a linha de antes</td><td>66 px</td><td>— (saiu)</td></tr>
      <tr><td><strong>1 · o cartão das turmas</strong></td><td>198 px</td><td><strong>285 px</strong> a 320 · 192 a 390 · 142 a 768</td></tr>
      <tr><td>2 · com a notação à vista</td><td>561 px</td><td>— (não escolhida)</td></tr>
    </table>
    <span class="abrir">Abrir a proposta →</span>
  </a>

  <a class="cartao" href="proposta-estados.html">
    <p class="sobre">Sala de ensaio · os estados da lista</p>
    <h2>O rótulo, o botão e o painel — tudo à vista</h2>
    <p>Os cartões são os do <strong>produto</strong> (o mesmo módulo que serve as três listas), com
    os dados do fixture. Junta o que estava provado em separado: os três estados da anamnese
    (<em>livre</em>, <em>nova</em>, <em>vinculada</em>) com o botão que cada um oferece, os dois do
    plano de ensino, e o painel do ato <strong>fechado e aberto</strong> — onde se vê o nome da
    barra a trocar de «Fazer anamnese» para «Contexto do ato».</p>
    <span class="abrir">Abrir a sala de ensaio →</span>
  </a>

  <a class="cartao" href="proposta-veu.html">
    <p class="sobre">Proposta · o véu da operação</p>
    <h2>As formas do véu — com o spinner que está feio</h2>
    <p>O véu de 11/11 está no produto, e a pesquisadora aprovou-o: «ficou do jeito que eu
    esperava». O que ficou <em>feio</em> foi o <strong>cartão</strong> com a etiqueta e a frase —
    e a dúvida é se a informação se pode dizer de outra forma. Três desfechos do <strong>mesmo
    elemento</strong>, construído pelo <code>nav.js</code> de verdade, sobre a Produção de
    verdade: o cartão de hoje; só o giro, sem nada escrito; e a palavra e a frase soltas, com
    halo em vez de moldura.</p>
    <table>
      <tr><th>Opção</th><th>O que se lê</th><th>Peso</th></tr>
      <tr><td>0 · a que está</td><td>etiqueta + frase</td><td>cartão opaco, 34 rem</td></tr>
      <tr><td><strong>1 · só o giro</strong></td><td>nada</td><td>38 px, com halo</td></tr>
      <tr><td>2 · o texto na tela</td><td>etiqueta + frase</td><td>duas linhas, sem caixa</td></tr>
    </table>
    <span class="abrir">Abrir a bancada do véu →</span>
  </a>

  <a class="cartao" href="proposta-acervo.html">
    <p class="sobre">Proposta 6 · o acervo com a porta</p>
    <h2>A Área do Professor numa página</h2>
    <p>A listagem absorve o cabeçalho da porta e as acções de começar. O contexto do ato
    (professor, ciclo, aluna, senha) vira um <strong>painel que se abre</strong>, e a estante
    «Fichas gravadas» desaparece — as fichas são a lista que já está lá. O nome de cada registo
    passa a ser o link para o <strong>.html</strong> pronto a imprimir, com o selo ao lado e os
    gestos <em>editar · apagar · ajustar</em> na mesma linha.</p>
    <table>
      <tr><th>Opção</th><th>Campos do ato</th><th>Acções de começar</th><th>Peça nova</th></tr>
      <tr><td>A</td><td>painel fechado</td><td>dentro do painel</td><td>2</td></tr>
      <tr><td>B</td><td>painel fechado</td><td>sempre à vista</td><td>2</td></tr>
      <tr><td>C</td><td>primeiro cartão</td><td>no cartão</td><td>0</td></tr>
    </table>
    <span class="abrir">Abrir a proposta →</span>
  </a>

</div>

<p class="aviso-proposta" style="margin-top:24px">Para avaliar no telemóvel, abra esta página no
telemóvel: as quatro propostas mudam de comportamento conforme a largura, e é no telemóvel que a
decisão é difícil. O painel de escolha abre sozinho e fecha em <strong>Ver a página</strong>; a aba
<em>propostas</em>, na margem esquerda, chama-o de volta.</p>

</div>
</main>

</body>
</html>
`;
}

// ============================================== PROPOSTA 5: O PADRÃO DA LISTA (24/10/2026)

/*
 * O PEDIDO. A listagem nasceu nos planos do ciclo, e a decisão foi: «essa forma de fazer a
 * listagem a gente vai ter também que usar para todos os demais». E veio com uma segunda
 * pergunta, que é a que manda: **o que é que se quer saber em cada lista?**
 *
 * A RESPOSTA QUE ESTA BANCADA PROPÕE tem duas partes, e só a segunda é uma escolha:
 *
 *   1. A ORDEM É FIXA, e é isso que faz a identidade: em toda a lista, a primeira caixinha
 *      responde «de quem é isto», a segunda «quem fez», a terceira «quando». Muda o rótulo de
 *      cada uma (Turma/Aluna, Professor/Quem fez, Período/Data), nunca o lugar. Quem varre
 *      sete listas diferentes lê-as com o mesmo gesto do olho.
 *
 *   2. O QUE FAZER NAS LISTAS POBRES — as três que têm dois factos e não três: as referências,
 *      o glossário e a notação. É a única coisa que está em aberto, e as três opções desta
 *      página são as três respostas possíveis: encher a terceira caixinha, mostrar duas, ou
 *      trocar as caixinhas por uma linha de factos.
 *
 * NAS CINCO LISTAS RICAS AS TRÊS OPÇÕES SÃO IGUAIS. Isso não é preguiça da bancada: é a
 * informação que faz a escolha barata — o que se decide aqui não toca nos planos, nas aulas,
 * nas anamneses, nos planos de ensino nem nos planos de observação. Toca em três listas.
 *
 * OS DADOS NÃO SÃO INVENTADOS. A turma «Balé Nível 2» vem do `plano-01.json` publicado
 * (objetivo, calendário 02/02/2027 → 29/04/2027, 26 aulas); a «Balé Nível 1» vem do `.conf` do
 * ciclo, e traz o que interessa medir: **o período em lacuna** (`DATA_INICIO="[Preencher: …]"`),
 * que é o estado em que a caixa «Período» tem de dizer a verdade em vez de inventar uma data.
 */

/** As duas turmas de que a bancada precisa — uma com período, outra sem. */
const TURMAS_DO_TESTE = {
  n1: {
    nome: 'Balé Nível 1', professor: 'Açúcar Branco', ciclo: '01', aulas: 5,
    dias: 'ter e qui', hora: '19:00', duracao: 60, inicio: '', fim: '',
  },
  n2: {
    nome: 'Balé Nível 2', professor: 'Cafe No Bule', ciclo: '01', aulas: 26,
    dias: 'ter e qui', hora: '18:00', duracao: 60, inicio: '02/02/2027', fim: '29/04/2027',
  },
};

/**
 * O PERÍODO NO VALOR DA CAIXA — e porque é que o ano vai em dois dígitos (24/10/2026, medido).
 *
 * A caixa tem 87px de largura útil a 390px. O período completo («02/02/2027 → 29/04/2027») mede
 * 187px, e em duas linhas de 87 não cabe — medido, pedia três (57px de texto contra 38px de
 * caixa). Com dois dígitos no ano («02/02/27 → 29/04/27») mede 152px e cabe em duas linhas; e a
 * 1280px cabe numa só, na caixa de 179px.
 *
 * O ANO NÃO SE PERDE: as datas inteiras ficam no painel, e quem abre o período lê-as por extenso.
 * A listagem é para reconhecer a linha, não para citar a data.
 */
/** `02/02/2027` → `02/02/27`: o dia e o mês ficam, o século sai. */
const anoCurto = (data) => String(data).replace(/^(\d{2}\/\d{2}\/)(\d{2})(\d{2})$/, '$1$3');
const periodoDe = (t) => (t.inicio && t.fim
  ? anoCurto(t.inicio) + ' → ' + anoCurto(t.fim)
  : 'a preencher');

/** Um painel: pares rótulo/valor, e uma nota opcional. */
function painelDe(pares, nota) {
  return '<div class="grade">' + pares.map(([k, v]) =>
    '<div><span class="k">' + k + '</span><span class="v">' + (v || '—') + '</span></div>').join('')
    + '</div>' + (nota ? '<p class="nota">' + nota + '</p>' : '');
}

/**
 * AS OITO LISTAS, com o que cada uma quer dizer.
 *
 * `simples: true` são as três que têm dois factos e não três. São elas que a escolha muda.
 * `caixas` tem SEMPRE três entradas, mesmo nas simples — a terceira é o que está em discussão,
 * e escrevê-la aqui é o que permite mostrar as três opções a partir do mesmo dado.
 */
function listasDoPadrao() {
  const n1 = TURMAS_DO_TESTE.n1;
  const n2 = TURMAS_DO_TESTE.n2;

  return [
    {
      id: 'planos', titulo: 'Ciclos · Planos',
      dica: 'de quem é o ciclo, quem o conduz, e quando ele corre',
      linhas: [
        {
          nome: 'Ciclo 01 — ' + n2.nome, selo: 'PO concluído', seloClasse: 'ok',
          acoes: [['Abrir o plano'], ['Referências', 'secundario'], ['PDF do ciclo', 'secundario']],
          contexto: 'Ciclo ' + n2.ciclo + ' · ' + n2.aulas + ' aulas previstas',
          caixas: [
            { k: 'Turma', v: n2.nome, painel: painelDe([
              ['Turma', n2.nome], ['Ciclo', n2.ciclo], ['Aulas previstas', String(n2.aulas)]],
              'Modalidade e tradição são decididas na curadoria, com o professor.') },
            { k: 'Professor', v: n2.professor, painel: painelDe([
              ['Professor curado', n2.professor], ['Turma', n2.nome]],
              'É a curadoria que liga professor e turma. Sem ela, este plano não existe.') },
            { k: 'Período', v: periodoDe(n2), painel: painelDe([
              ['Começa', n2.inicio], ['Termina', n2.fim], ['Frequência', '2x por semana — ' + n2.dias],
              ['Ancorada em', '23/10/2026']],
              'A cadeia acrescenta, não edita: um ajuste é um elo novo.') },
          ],
          fatos: [n2.nome, n2.professor, periodoDe(n2)],
        },
        {
          nome: 'Ciclo 01 — ' + n1.nome, selo: 'PO aguardando', seloClasse: 'alerta',
          acoes: [['Abrir o plano'], ['Referências', 'secundario']],
          contexto: 'Ciclo ' + n1.ciclo + ' · ' + n1.aulas + ' aulas previstas',
          caixas: [
            { k: 'Turma', v: n1.nome, painel: painelDe([
              ['Turma', n1.nome], ['Ciclo', n1.ciclo], ['Aulas previstas', String(n1.aulas)]]) },
            { k: 'Professor', v: n1.professor, painel: painelDe([
              ['Professor curado', n1.professor], ['Turma', n1.nome]]) },
            { k: 'Período', v: 'a preencher', painel: painelDe([
              ['Começa', 'a preencher'], ['Termina', 'sai do início'],
              ['Aulas previstas', String(n1.aulas)]],
              'O plano elicitado estabelece a data de início. Sem ela, a listagem diz «a '
              + 'preencher» — e não uma data inventada.') },
          ],
          fatos: [n1.nome, n1.professor, 'a preencher'],
        },
      ],
    },
    {
      id: 'referencias', titulo: 'Ciclos · Referências', simples: true,
      dica: 'de quem são as referências, e em que norma',
      linhas: [
        { nome: 'Referências Bibliográficas', selo: '', acoes: [['Abrir']],
          contexto: 'Ciclo ' + n2.ciclo + ' · norma ABNT',
          caixas: [
            { k: 'Turma', v: n2.nome }, { k: 'Ciclo', v: n2.ciclo }, { k: 'Norma', v: 'ABNT' }],
          fatos: [n2.nome, 'Ciclo ' + n2.ciclo, 'ABNT'] },
        { nome: 'Referências Bibliográficas — ' + n1.nome, selo: '', acoes: [['Abrir']],
          contexto: 'Ciclo ' + n1.ciclo + ' · norma ABNT',
          caixas: [
            { k: 'Turma', v: n1.nome }, { k: 'Ciclo', v: n1.ciclo }, { k: 'Norma', v: 'ABNT' }],
          fatos: [n1.nome, 'Ciclo ' + n1.ciclo, 'ABNT'] },
      ],
    },
    {
      id: 'glossario', titulo: 'Código · Glossário', simples: true,
      dica: 'de quem é o glossário, e em que código',
      linhas: [
        { nome: 'Glossário do código Benesh', selo: '', acoes: [['Abrir o glossário']],
          contexto: 'Ciclo ' + n2.ciclo + ' · Benesh',
          caixas: [
            { k: 'Turma', v: n2.nome }, { k: 'Ciclo', v: n2.ciclo }, { k: 'Código', v: 'Benesh' }],
          fatos: [n2.nome, 'Ciclo ' + n2.ciclo, 'Benesh'] },
        { nome: 'Glossário do código Benesh — ' + n1.nome, selo: '', acoes: [['Abrir o glossário']],
          contexto: 'Ciclo ' + n1.ciclo + ' · Benesh',
          caixas: [
            { k: 'Turma', v: n1.nome }, { k: 'Ciclo', v: n1.ciclo }, { k: 'Código', v: 'Benesh' }],
          fatos: [n1.nome, 'Ciclo ' + n1.ciclo, 'Benesh'] },
      ],
    },
    {
      id: 'notacao', titulo: 'Código · Notação', simples: true,
      dica: 'de quem é a notação, e em que código',
      linhas: [
        { nome: 'Notação em Benesh', selo: '', acoes: [['Abrir a notação']],
          contexto: 'Ciclo ' + n2.ciclo + ' · Benesh',
          caixas: [
            { k: 'Turma', v: n2.nome }, { k: 'Ciclo', v: n2.ciclo }, { k: 'Código', v: 'Benesh' }],
          fatos: [n2.nome, 'Ciclo ' + n2.ciclo, 'Benesh'] },
        { nome: 'Notação em Benesh — ' + n1.nome, selo: '', acoes: [['Abrir a notação']],
          contexto: 'Ciclo ' + n1.ciclo + ' · Benesh',
          caixas: [
            { k: 'Turma', v: n1.nome }, { k: 'Ciclo', v: n1.ciclo }, { k: 'Código', v: 'Benesh' }],
          fatos: [n1.nome, 'Ciclo ' + n1.ciclo, 'Benesh'] },
      ],
    },
    {
      id: 'aulas', titulo: 'Aulas', 
      dica: 'de que turma é a aula, quem a dá, e a que horas ela acontece',
      linhas: [
        { nome: 'Aula 03 — transferir o peso', selo: '', acoes: [['Abrir a aula'], ['Lançar', 'secundario'],
          ['Captura para impressão', 'secundario']],
          contexto: 'Ciclo ' + n2.ciclo + ' · aula 3 de ' + n2.aulas,
          caixas: [
            { k: 'Turma', v: n2.nome, painel: painelDe([
              ['Turma', n2.nome], ['Ciclo', n2.ciclo], ['Aulas', '3 de ' + n2.aulas]]) },
            { k: 'Professor', v: n2.professor, painel: painelDe([
              ['Professor da turma', n2.professor]],
              'A aula não tem professor próprio: quem o tem é a turma, e é a curadoria que o liga.') },
            { k: 'Horário', v: n2.hora + ' · ' + n2.duracao + ' min', painel: painelDe([
              ['Dias', n2.dias], ['Começa às', n2.hora], ['Duração', n2.duracao + ' min'],
              ['Sala', 'não declarada']],
              'A hora é do DIA da semana, não da turma: a direção pode ter a turma às 18h na '
              + 'terça e às 19h na quinta.') },
          ],
          fatos: [n2.nome, n2.professor, n2.hora + ' · ' + n2.duracao + ' min'],
        },
        { nome: 'Aula 03 — transferir o peso', selo: '', acoes: [['Abrir a aula'], ['Lançar', 'secundario']],
          contexto: 'Ciclo ' + n1.ciclo + ' · aula 3 de ' + n1.aulas,
          caixas: [
            { k: 'Turma', v: n1.nome, painel: painelDe([
              ['Turma', n1.nome], ['Ciclo', n1.ciclo], ['Aulas', '3 de ' + n1.aulas]]) },
            { k: 'Professor', v: n1.professor, painel: painelDe([
              ['Professor da turma', n1.professor]]) },
            { k: 'Horário', v: n1.hora + ' · ' + n1.duracao + ' min', painel: painelDe([
              ['Dias', n1.dias], ['Começa às', n1.hora], ['Duração', n1.duracao + ' min'],
              ['Sala', 'não declarada']]) },
          ],
          fatos: [n1.nome, n1.professor, n1.hora + ' · ' + n1.duracao + ' min'],
        },
      ],
    },
    {
      id: 'anamnese', titulo: 'Área do Professor · Anamnese',
      dica: 'de quem é a anamnese, quem a fez, e quando',
      linhas: [
        { nome: 'Aluna A', id: 'anamnese-20261023-1117', selo: 'vinculada', seloClasse: 'vinculada',
          acoes: [['Abrir a anamnese']],
          contexto: 'vinculada à turma ' + n2.nome,
          caixas: [
            { k: 'Turma', v: n2.nome, painel: painelDe([
              ['Turma', n2.nome], ['Estado', 'vinculada — um PO já a usa']],
              'A anamnese é da aluna, e a turma vem da curadoria que a matriculou.') },
            { k: 'Quem fez', v: n2.professor, painel: painelDe([
              ['Professor', n2.professor], ['Ciclo', n2.ciclo]]) },
            { k: 'Quando', v: '20/10/2026', painel: painelDe([
              ['Feita em', '20/10/2026'], ['Ajustes', '1 — o último em 22/10/2026']],
              'A data vem do carimbo do registo: é a hora em que ele foi gravado.') },
          ],
          fatos: [n2.nome, n2.professor, '20/10/2026'],
        },
        { nome: 'Aluna B', id: 'anamnese-20261023-1142', selo: 'nova', seloClasse: 'livre',
          acoes: [['Abrir a anamnese']],
          contexto: 'aluna nova — sem turma',
          caixas: [
            { k: 'Turma', v: 'sem turma', painel: painelDe([
              ['Turma', 'sem turma'], ['Matrícula', 'não está em nenhuma curadoria']],
              'Aluna nova pode ser entrevistada por qualquer professor. O selo «nova» é '
              + 'derivado: no dia em que entrar numa curadoria, deixa de o ser.') },
            { k: 'Quem fez', v: n1.professor, painel: painelDe([
              ['Professor', n1.professor], ['Ciclo', n1.ciclo]]) },
            { k: 'Quando', v: '22/10/2026', painel: painelDe([['Feita em', '22/10/2026']]) },
          ],
          fatos: ['sem turma', n1.professor, '22/10/2026'],
        },
      ],
    },
    {
      id: 'plano-de-ensino', titulo: 'Área do Professor · Plano de ensino',
      dica: 'de que turma é o plano, quem o planejou, e para quando ele vale',
      linhas: [
        { nome: 'Plano de ensino — ' + n2.nome, selo: 'vinculado', seloClasse: 'vinculada',
          acoes: [['Abrir o plano'], ['Derivar', 'secundario']],
          contexto: 'consolidar o alinhamento e a transferência de peso, com musicalidade',
          caixas: [
            { k: 'Turma', v: n2.nome, painel: painelDe([
              ['Turma', n2.nome], ['Ciclo', n2.ciclo], ['Volume', '3–6 séries']]) },
            { k: 'Quem fez', v: n2.professor, painel: painelDe([
              ['Professor responsável', n2.professor], ['Frequência', '2x semanal — ' + n2.dias],
              ['Duração da aula', n2.duracao + ' min']]) },
            { k: 'Vigência', v: periodoDe(n2), painel: painelDe([
              ['Começa', n2.inicio], ['Termina', n2.fim],
              ['Expira', 'não declarada — vale enquanto o ciclo correr']],
              'O plano não expira por data própria: ele acompanha o período do ciclo.') },
          ],
          fatos: [n2.nome, n2.professor, periodoDe(n2)],
        },
        { nome: 'Plano de ensino — ' + n1.nome, selo: 'livre', seloClasse: 'livre',
          acoes: [['Abrir o plano']],
          contexto: 'plano da turma, à espera do Plano de Observação',
          caixas: [
            { k: 'Turma', v: n1.nome, painel: painelDe([
              ['Turma', n1.nome], ['Ciclo', n1.ciclo]]) },
            { k: 'Quem fez', v: n1.professor, painel: painelDe([
              ['Professor responsável', n1.professor], ['Frequência', '2x semanal — ' + n1.dias]]) },
            { k: 'Vigência', v: 'a preencher', painel: painelDe([
              ['Começa', 'a preencher'], ['Termina', 'sai do início']],
              'Sem período declarado, a listagem diz «a preencher».') },
          ],
          fatos: [n1.nome, n1.professor, 'a preencher'],
        },
      ],
    },
    {
      id: 'plano-de-observacao', titulo: 'Área do Professor · Plano de Observação',
      dica: 'de que turma é o PO, quem o fez, e que período ele cobre',
      linhas: [
        { nome: 'Plano de Observação — ' + n2.nome, selo: 'concluído', seloClasse: 'ok',
          acoes: [['Abrir o PO'], ['Derivar o ciclo', 'secundario']],
          contexto: 'observa o plano de ensino de 22/10/2026',
          caixas: [
            { k: 'Turma', v: n2.nome, painel: painelDe([
              ['Turma', n2.nome], ['Sujeitos', 'a turma inteira'], ['Ciclo', n2.ciclo]]) },
            { k: 'Quem fez', v: n2.professor, painel: painelDe([
              ['Professor', n2.professor]],
              'É o mesmo professor do plano de ensino: a observação é dele sobre a turma dele.') },
            { k: 'Período', v: periodoDe(n2), painel: painelDe([
              ['Cobre', n2.inicio + ' → ' + n2.fim], ['Aulas observadas', String(n2.aulas)]]) },
          ],
          fatos: [n2.nome, n2.professor, periodoDe(n2)],
        },
        { nome: 'Plano de Observação — ' + n1.nome, selo: 'aguardando', seloClasse: 'alerta',
          acoes: [['Abrir o PO']],
          contexto: 'observa o plano de ensino da ' + n1.nome,
          caixas: [
            { k: 'Turma', v: n1.nome, painel: painelDe([
              ['Turma', n1.nome], ['Ciclo', n1.ciclo]]) },
            { k: 'Quem fez', v: n1.professor, painel: painelDe([
              ['Professor', n1.professor]]) },
            { k: 'Período', v: 'a preencher', painel: painelDe([
              ['Cobre', 'a preencher'], ['Aulas observadas', String(n1.aulas)]]) },
          ],
          fatos: [n1.nome, n1.professor, 'a preencher'],
        },
      ],
    },
  ];
}

/** Uma linha da lista, no modelo das caixinhas. `quantas` é 2 ou 3; nas ricas é sempre 3. */
function linhaDaLista(linha, quantas, id) {
  const acoes = (linha.acoes || []).map(([rotulo, classe]) =>
    '<a class="acao ' + (classe || '') + ' pequena" href="#">' + rotulo + '</a>').join('');
  const selo = linha.selo ? '<span class="selo ' + linha.seloClasse + '">' + linha.selo + '</span>' : '';
  const caixas = linha.caixas.slice(0, quantas).map((c, i) => {
    const chave = 'c' + i + '-' + id;
    const aberta = c.painel
      ? ' aria-expanded="false" aria-controls="' + chave + '"'
      : ' data-sem-painel="sim"';
    return '<button type="button" class="metrica" data-balao="' + chave + '"' + aberta + '>'
      + '<span class="k">' + c.k + '</span><span class="v">' + c.v + '</span>'
      + '<span class="q" aria-hidden="true">' + (c.painel ? '?' : '') + '</span></button>';
  }).join('\n        ');
  const paineis = linha.caixas.slice(0, quantas).map((c, i) => (c.painel
    ? '<div class="painel" data-painel="c' + i + '-' + id + '" hidden>' + c.painel + '</div>' : ''))
    .filter(Boolean).join('\n      ');
  return '      <li class="item">\n'
    + '        <div class="linha-turma">\n'
    + '          <span class="nome"><b>' + linha.nome + '</b> ' + selo + '</span>\n'
    + '          <span class="acoes">' + acoes + '</span>\n'
    + '        </div>\n'
    + '        <div class="dono">' + linha.contexto + '</div>\n'
    + '        <div class="metricas' + (quantas === 2 ? ' duas' : '') + '">\n        '
    + caixas + '\n        </div>\n'
    + (paineis ? paineis + '\n' : '')
    + '      </li>';
}

/** Uma linha no modelo da FICHA: os mesmos factos, em texto, sem caixinha nenhuma. */
function linhaDaFicha(linha, id) {
  const acoes = (linha.acoes || []).map(([rotulo, classe]) =>
    '<a class="acao ' + (classe || '') + ' pequena" href="#">' + rotulo + '</a>').join('');
  const selo = linha.selo ? '<span class="selo ' + linha.seloClasse + '">' + linha.selo + '</span>' : '';
  const fatos = linha.fatos.map((f) => '<span class="fato">' + f + '</span>').join('');
  /* A FICHA NÃO PERDE O DETALHE. As listas ricas mantêm as caixinhas — o que muda é que, nas
   * pobres, o que não tem painel deixa de fingir que o tem. */
  const comPainel = linha.caixas.filter((c, i) => c.painel && i < 3);
  const caixas = comPainel.map((c) => {
    const chave = 'f' + linha.caixas.indexOf(c) + '-' + id;
    return '<button type="button" class="metrica" data-balao="' + chave + '" aria-expanded="false"'
      + ' aria-controls="' + chave + '"><span class="k">' + c.k + '</span>'
      + '<span class="v">' + c.v + '</span><span class="q" aria-hidden="true">?</span></button>';
  }).join('\n        ');
  const paineis = comPainel.map((c) =>
    '<div class="painel" data-painel="f' + linha.caixas.indexOf(c) + '-' + id + '" hidden>'
    + c.painel + '</div>').join('\n      ');
  return '      <li class="item">\n'
    + '        <div class="linha-turma">\n'
    + '          <span class="nome"><b>' + linha.nome + '</b> ' + selo + '</span>\n'
    + '          <span class="acoes">' + acoes + '</span>\n'
    + '        </div>\n'
    + '        <div class="fatos">' + fatos + '</div>\n'
    + '        <div class="dono">' + linha.contexto + '</div>\n'
    + (caixas ? '        <div class="metricas">\n        ' + caixas + '\n        </div>\n' : '')
    + (paineis ? paineis + '\n' : '')
    + '      </li>';
}

/** A lista inteira, numa das três opções. */
function listaDoPadrao(opcao) {
  const listas = listasDoPadrao();
  return listas.map((lista) => {
    const corpo = lista.linhas.map((linha, i) => {
      const id = lista.id + '-' + (i + 1);
      if (!lista.simples) return linhaDaLista(linha, 3, id);
      if (opcao === 'ficha') return linhaDaFicha(linha, id);
      return linhaDaLista(linha, opcao === 'duas' ? 2 : 3, id);
    }).join('\n');
    return '<section class="bloco-lista">\n'
      + '  <h2>' + lista.titulo + '</h2>\n'
      + '  <p class="dica">' + lista.dica + '</p>\n'
      + '  <form class="filtro" onsubmit="return false"><div class="caixa filtrar">'
      + '<div class="campo-filtro busca"><label class="campo-rotulo" for="f-' + lista.id + '">Procurar</label>'
      + '<input id="f-' + lista.id + '" type="search" placeholder="pelo nome ou pela turma"></div></div></form>\n'
      + '  <ul class="lista">\n' + corpo + '\n  </ul>\n'
      + '</section>';
  }).join('\n');
}

const OPCOES_PADRAO = [
  { id: 'tres', n: '1', t: 'Três caixinhas, sempre', m: '5 ricas · 3 pobres',
    d: 'a terceira caixinha existe em toda a lista; nas referências, no glossário e na notação '
      + 'ela leva a norma ou o código, que é o terceiro facto que essas listas têm' },
  { id: 'duas', n: '2', t: 'Duas ou três, conforme o que existe', m: '5 ricas · 2 nas pobres',
    d: 'as três listas de documento ficam com Turma · Ciclo, e a norma (ou o código) desce para '
      + 'a linha de contexto — nenhuma caixinha fica a dizer «—»' },
  { id: 'ficha', n: '3', t: 'Caixinha só onde há o que abrir', m: '5 ricas · 0 nas pobres',
    d: 'onde não há painel, os factos vão numa linha de texto; a caixinha fica reservada ao que '
      + 'tem detalhe dentro — é a mais curta, e a que gasta menos altura por linha' },
];

function proporPadraoDaLista() {
  const corpo = `<header class="doc">
  <h1>O padrão da lista</h1>
  <p class="subtitulo">Batata · as oito listas, com o que cada uma quer dizer</p>
</header>

<main>
<div class="conteudo">

<div class="nota-do-teste">
  <p><strong>A ordem das caixinhas é fixa, e é isso que faz a identidade.</strong> Em toda a lista,
  a primeira responde <em>de quem é isto</em>, a segunda <em>quem fez</em>, a terceira
  <em>quando</em>. Muda o rótulo — Turma ou Aluna, Professor ou Quem fez, Período ou Data —, nunca
  o lugar. Quem varre oito listas diferentes lê-as com o mesmo gesto do olho.</p>
  <p><strong>A escolha só toca em três listas.</strong> As referências, o glossário e a notação têm
  dois factos e não três: nas outras cinco, as três opções dão exactamente o mesmo. É por isso que
  escolher aqui é barato.</p>
  <p><strong>O que está em lacuna diz-se em lacuna.</strong> A «Balé Nível 1» não tem data de
  início — o <code>.conf</code> do ciclo traz <code>[Preencher: …]</code> —, e a caixa escreve
  <em>a preencher</em>. Uma data inventada numa listagem é pior do que um espaço em branco: ela
  parece um facto.</p>
  <p><strong>A cadeia não ganhou uma quarta caixa.</strong> O estado do PO fica no selo, ao lado do
  nome, e a data de ancoragem vai para dentro do painel do Período. Cinco factos continuam a caber
  em três caixas porque dois deles não competem pelo mesmo lugar.</p>
  <p class="fina">Toque em qualquer caixinha com «?» para abrir o painel; a do canto sem «?» é
  a que só tem um valor. No telemóvel as três caixinhas ficam lado a lado até aos 360 px, e aí
  passam a uma coluna — a regra que já está na folha.</p>
</div>

<div id="lista-destino">
${listaDoPadrao('tres')}
</div>

</div>
</main>`;

  const barra = [
    colunaDoMenu(true, true),
    barraDoMenu(MENU_DA_BARRA, '/ciclos/planos/', '<span class="doc-atual">Planos do ciclo</span>'),
  ].join('\n');

  const base = paginaDeNav({
    titulo: 'O padrão da lista',
    opcaoInicial: 'tres',
    nav: 'marcada',
    barra,
    secoes: barraDeSecoes('Ciclos', 'Planos do ciclo'),
    corpo,
  });

  const listas = {
    tres: listaDoPadrao('tres'),
    duas: listaDoPadrao('duas'),
    ficha: listaDoPadrao('ficha'),
  };
  const troca = `(function () {
  var LISTAS = ${JSON.stringify(listas)};
  var destino = document.getElementById('lista-destino');
  window.aoTrocarOpcao = function (opcao) {
    if (!LISTAS[opcao] || !destino) return;
    destino.innerHTML = LISTAS[opcao];
    if (typeof window.aplicarFiltro === 'function') window.aplicarFiltro();
  };
})();`;

  return base
    .replace('</body>', `${marcacaoDaBancada({
      sobre: 'Proposta 5 · o padrão da lista',
      titulo: 'A forma de todas as listas',
      intro: 'As oito listas com os factos que cada uma quer dizer. O que muda entre as opções '
        + 'são só as três listas de documento.',
      opcoes: OPCOES_PADRAO,
      inicio: 'tres',
    })}
<script>${scriptDaBancada(OPCOES_PADRAO)}</script>
<script>${scriptDoMenu()}</script>
<script>${scriptDaLista()}</script>
<script>${troca}</script>
</body>`);
}

// ============================================ PROPOSTA 6: O ACERVO COM A PORTA (25/10/2026)

/*
 * O PEDIDO. As três listas da Área do Professor têm hoje o padrão da listagem — e nada mais:
 * clica-se «Nova anamnese» e sai-se da página para a PORTA (`/anamnese/`), que é uma segunda
 * página com o cabeçalho (contexto do ato: professor, ciclo, aluna, senha), dois parágrafos de
 * texto explicativo e, embaixo, a estante das fichas gravadas. O mesmo registo aparece em DOIS
 * lugares, com duas gramáticas de botão — e o texto explicativo que abre a porta é de
 * desenvolvimento, não é para o professor.
 *
 * O QUE SE PROPÕE: uma página só. O contexto do ato vira um PAINEL que se abre — e o botão que o
 * abre é a PEÇA DA CAIXINHA (`trio-item`), a mesma do «Turma · Quem fez · Quando», mas ocupando a
 * faixa inteira em vez de um terço. Foi a decisão de 25/10/2026: «ele me parece mais orgânico pra
 * entender do que se trata». E a estante das fichas deixa de existir, porque as fichas são a
 * listagem que já está lá.
 *
 * A OPÇÃO ESCOLHIDA É A. As outras duas ficam na bancada como registo do que se comparou — B
 * (acções fora do painel) e C (o contexto é o primeiro cartão) —, e continuam a poder ver-se.
 *
 * AS PEÇAS. O cartão, as caixas, o selo e o botão são da folha. CINCO regras NÃO existem lá e
 * terão de nascer no dia em que isto se implementar, com entrada no catálogo de
 * `IDENTIDADE-VISUAL.md` e prova no `check-identidade`:
 *   1. `details[open] > summary.trio-item` — o estado aberto da caixinha (a folha só conhece
 *      `[aria-expanded="true"]`, e um `summary` não o recebe: quem o abre é o `details`);
 *   2. `.painel-ato` — o agrupador que faz a caixinha ocupar a faixa inteira do `.trio`;
 *   3. `.campos-do-ato` — a fila dos campos do ato (a porta tem uma cópia no `<style>` embutido);
 *   4. `.acoes-do-ato` — a fila das acções de começar (idem);
 *   5. `.estado-do-ato` — a linha que diz o que falta para se poder criar.
 */

const OPCOES_ACERVO = [
  { id: 'A', n: 'A', t: 'Painel com a caixinha, acções dentro', m: '2 toques · ESCOLHIDA',
    d: 'o contexto do ato é uma caixinha da faixa inteira — a mesma peça do «Turma» —, e abri-la '
      + 'mostra os campos e as acções de começar. A lista nunca é empurrada para baixo' },
  { id: 'B', n: 'B', t: 'Painel com a caixinha, acções fora', m: '1 toque',
    d: 'as acções de começar ficam fora do painel e sempre visíveis — a caixinha guarda só os '
      + 'campos. Criar é um toque; o custo é uma fila fixa de altura em toda a visita' },
  { id: 'C', n: 'C', t: 'O contexto é o primeiro cartão', m: '2 toques · 0 peça nova',
    d: 'o contexto do ato é um cartão como os outros, no topo da lista, com o «?» a abrir os '
      + 'campos. Zero peça nova na folha; o risco é ler-se como um registo que não existe' },
];

/* As fichas da escola de teste, com o que a listagem diz de cada uma. Os dados são os da
 * `batata` em produção (três anamneses, duas de professor diferente) — uma proposta com dados
 * inventados mede uma tela que ninguém vai ver. */
const FICHAS_DA_ANAMNESE = [
  { nome: 'Aluna A', id: 'anamnese-20261023-1117', selo: 'vinculada', classe: 'vinculada',
    dono: 'vinculada à turma Balé Nível 1',
    turma: 'Balé Nível 1', quem: 'Cafe No Bule', quando: '23/10/2026', acoes: ['ajustar'] },
  { nome: 'Aluna B', id: 'anamnese-20261023-1142', selo: 'vinculada', classe: 'vinculada',
    dono: 'vinculada à turma Balé Nível 3',
    turma: 'Balé Nível 3', quem: 'Meia Cortada', quando: '23/10/2026', acoes: ['ajustar'] },
  { nome: 'Aluna C', id: 'anamnese-20261023-1205', selo: 'nova', classe: 'livre',
    dono: 'aluna nova — sem turma',
    turma: 'sem turma', quem: 'Manga Curta', quando: '23/10/2026', acoes: ['editar', 'apagar'] },
];

/* OS CAMPOS DO ATO — os cinco da porta, na mesma ordem e com o mesmo rótulo. Os três selects
 * nascem com as opções que a porta recebe de `/api/bastidores/dados`; aqui estão as da `batata`.
 * A «turma observada» entra só no plano de ensino (onde se escolhe) e no PO (onde se lê). */
function camposDoAto({ comAluna = true, comTurma = false } = {}) {
  return `
      <span class="campo"><label for="ato-professor">professor</label>
        <select id="ato-professor"><option value="">— escolher —</option>
          <option selected>Cafe No Bule</option><option>Manga Curta</option>
          <option>Meia Cortada</option></select></span>
      <span class="campo"><label for="ato-ciclo">ciclo</label>
        <input type="text" id="ato-ciclo" value="01"></span>
      ${comTurma ? '<span class="campo"><label>turma observada</label>'
        + '<span class="trio-v-turma">Balé Nível 1</span></span>' : ''}
      ${comAluna ? '<span class="campo"><label for="ato-aluna">aluna</label>'
        + '<select id="ato-aluna"><option value="">— nenhuma —</option>'
        + '<option selected>Aluna C — nova</option></select></span>' : ''}
      <span class="campo campo-senha"><label for="ato-senha">senha do professor</label>
        <input type="password" id="ato-senha" value="••••••"><span class="ok">confere</span></span>`;
}

/*
 * AS ACÇÕES DE COMEÇAR — com a REGRA DA PORTA, que existe e é uma só.
 *
 * A regra está em três funções de `porta/index.html`, e não foi inventada aqui:
 *   · `voltarAoPortal()` — sem preenchimento guardado, mostra «Começar» e esconde a retomada;
 *     com preenchimento, faz o contrário;
 *   · `mostrarRetomada()` — põe «Continuar de onde parei» + «Começar de novo» e faz
 *     `$('comecar').style.display = 'none'`. O comentário da porta diz porquê: «um botão
 *     desabilitado é ruído, um escondido não é nada»;
 *   · `$('recomecar')` — limpa a memória e volta ao portal, e é isso que faz «Nova» reaparecer.
 *
 * Os três estados, então: sem memória → **Nova** · com memória → **Continuar + Começar de novo**
 * (e Nova desaparece) · «Começar de novo» → limpa → **Nova** outra vez. «Ver a ficha em branco»
 * fica sempre, porque não depende de haver o que retomar.
 *
 * E a memória é POR FONTE E POR CONTEXTO — `porta-<fonte>-<escola>-<professor>-<ciclo>-1`
 * (`chaveDaMemoria`). Não inclui a aluna. Trocar de professor troca o estado dos botões, e é isso
 * que a bancada reproduz. */
function acoesDeComecar({ comEstado = true } = {}) {
  return `
      <div class="acoes-do-ato">
        <button class="acao" type="button" data-acao="nova">Nova anamnese</button>
        <button class="acao secundario pequena" type="button" data-acao="continuar" hidden>
          Continuar de onde parei</button>
        <button class="acao secundario pequena" type="button" data-acao="recomecar" hidden>
          Começar de novo</button>
      </div>${comEstado ? '\n      <p class="estado-do-ato" data-estado hidden></p>' : ''}`;
}

/* «VER A FICHA EM BRANCO» FICA FORA DO PAINEL, e sempre à vista.
 *
 * O pedido foi explícito: «ver a ficha em branco ele tá sempre ali, acompanhando». A primeira
 * versão desta proposta pôs-no dentro do painel, com as outras acções — e o teste mostrou o que
 * isso queria dizer: em A, com o painel fechado, NADA estava à vista. Não é o que o professor
 * pediu. A ficha em branco não depende do contexto nem da senha: ela abre uma folha vazia e
 * imprime-se. Por isso é a única acção que fica fora, e está lá em todos os estados. */
function ligacaoDaFichaEmBranco({ fora = false } = {}) {
  return '<p class="ficha-em-branco' + (fora ? ' ficha-fora' : '') + '">'
    + '<a class="acao secundario pequena" href="#ficha-em-branco">Ver a ficha em branco</a></p>';
}

/* A CAIXINHA QUE ABRE O PAINEL — a peça do «Turma», na faixa inteira.
 *
 * É a MESMA peça: `trio-item` com `trio-k` (o rótulo), `trio-v` (o valor) e `trio-q` (o «?» que
 * diz que há mais dentro). O que muda é a LARGURA: `.painel-ato` faz o `details` ocupar
 * `1 / -1` do `.trio`, em vez de um terço. Nada de peça nova para o botão — só onde ele se senta.
 *
 * O `trio-v` diz o CONTEXTO INTEIRO numa linha, e quando falta alguma coisa diz o que falta. É o
 * papel que hoje é o `title` do botão da porta, e um `title` não se lê no telemóvel. */
function caixinhaDoAto() {
  return `
    <div class="trio trio-do-ato">
      <details class="painel-ato" id="painel-ato">
        <summary class="trio-item" aria-label="abrir o contexto do ato">
          <span class="trio-k">Contexto do ato</span>
          <span class="trio-v" data-resumo>Cafe No Bule · ciclo 01 · Aluna C — nova</span>
          <span class="trio-q" aria-hidden="true">?</span>
        </summary>
        <div class="corpo-do-ato">
          <div class="campos-do-ato">${camposDoAto()}</div>
          ${acoesDeComecar()}
        </div>
      </details>
    </div>`;
}

/* Um cartão do acervo, com o padrão da listagem e as acções na linha do nome. */
function cartaoDoAcervo(f) {
  return `
    <li class="trio-plano" data-nome="${f.nome}">
      <div class="trio-linha">
        <span class="trio-nome"><b><a class="nome-do-registo"
          href="api/ficha-preenchida.${f.id}?formato=html" target="_blank" rel="noopener"
          >${f.nome}</a></b> <span class="selo ${f.classe}">${f.selo}</span></span>
        <span class="trio-acoes">${f.acoes.map((a, i) => '<button type="button" class="acao '
          + 'pequena' + (i ? ' secundario' : '') + '">' + a + '</button>').join('')}</span>
      </div>
      <div class="trio-dono">${f.dono}</div>
      <div class="trio">
        ${caixaDoAcervo('Turma', f.turma)}
        ${caixaDoAcervo('Quem fez', f.quem)}
        ${caixaDoAcervo('Quando', f.quando)}
      </div>
      <div class="dica-do-link">o nome abre a ficha em <b>.html</b>, pronta a imprimir</div>
    </li>`;
}

/* A caixa do cartão — a MESMA marcação que `motor/nucleo/lista-html.js` emite, na MESMA ordem:
 * rótulo, valor, e por fim o «?». Copiada da produção de propósito: uma bancada com marcação
 * parecida mas não igual mede uma tela que não existe. */
function caixaDoAcervo(rotulo, valor) {
  return '<button type="button" class="trio-item" data-balao="' + rotulo.toLowerCase()
    + '" aria-expanded="false" aria-label="ver ' + rotulo.toLowerCase() + ' deste registo">'
    + '<span class="trio-k">' + rotulo + '</span>'
    + '<span class="trio-v">' + valor + '</span>'
    + '<span class="trio-q" aria-hidden="true">?</span></button>';
}

/* O CSS que a proposta acrescenta. As cinco primeiras regras são as que terão de nascer na folha;
 * as últimas são só da bancada (a troca de opção). */
const CSS_ACERVO = `
/* ============================================================================
   AS CINCO PEÇAS QUE A FOLHA NÃO TEM. A primeira é a que o pedido de 25/10/2026
   tornou necessária: a caixinha do «Turma» a servir de botão que abre um painel.
   ========================================================================== */

/* 1. O ESTADO ABERTO DA CAIXINHA. A folha conhece \`[aria-expanded="true"]\`; um \`summary\`
      não o recebe — quem o abre é o \`details\`. Sem esta regra, abrir o painel não muda
      nada no botão, e o professor não vê que ele está aberto. */
details[open] > summary.trio-item { background: var(--fundo-citacao); border-color: var(--borda-forte); }
details[open] > summary.trio-item .trio-q { background: var(--marca); color: var(--superficie); }
summary.trio-item { list-style: none; cursor: pointer; }
summary.trio-item::-webkit-details-marker { display: none; }
/* o contorno de foco tem de ser o da caixinha, e o do summary não vem de graça */
summary.trio-item:focus-visible { outline: 2px solid var(--marca); outline-offset: 1px; }

/* 2. A FAIXA INTEIRA. O \`.trio\` é uma grelha de três colunas; o painel ocupa as três. */
.painel-ato { grid-column: 1 / -1; min-width: 0; }
.painel-ato .corpo-do-ato { padding: .6rem .1rem 0; }

/* 3. OS CAMPOS DO ATO. A porta tem esta fila no \`<style>\` embutido dela; é a mesma forma. */
.campos-do-ato { display: flex; gap: .5rem .9rem; align-items: flex-end; flex-wrap: wrap; }
.campos-do-ato .campo { display: grid; grid-template-columns: auto auto; gap: 2px 4px; }
.campos-do-ato .campo > label {
  grid-column: 1 / -1; font: 600 11px/1.4 var(--ui);
  letter-spacing: .06em; text-transform: uppercase; color: var(--texto-suave);
}
.campos-do-ato input[type="text"] { width: 4.5rem; }
.campos-do-ato select { max-width: 12rem; }
.campos-do-ato .campo-senha input { width: 9rem; }
.campos-do-ato .ok { font-size: 11px; color: var(--ok); align-self: center; }
.campos-do-ato .trio-v-turma { font: 600 14px/1.8 var(--serif); color: var(--marca-texto); }

/* 4. AS ACÇÕES DE COMEÇAR — uma fila, e os secundários pequenos: medido, com \`.acao\` em todas
      elas pedem 97px e DUAS filas a 390px; pequenas, 29px e uma. */
.acoes-do-ato { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: .7rem; }

/* 4.1 A FICHA EM BRANCO — fora do painel, sempre à vista. */
.ficha-em-branco { margin: .5rem 0 0; }
html[data-opcao="C"] .ficha-fora { display: none; }

/* 5. O QUE FALTA PARA SE PODER CRIAR — a informação que hoje é só um \`title\`. */
.estado-do-ato {
  margin: .45rem 0 0; font-size: 12.5px; line-height: 1.45; color: var(--texto-suave);
}
.estado-do-ato[data-falta="sim"] { color: var(--alerta); }

/* ---- as acções da linha ---- */
.trio-acoes .acao { white-space: nowrap; }
.nome-do-registo {
  color: inherit; text-decoration: none; display: inline-block; padding: .35rem 0;
  border-bottom: 1px dotted var(--borda);
}
.nome-do-registo:hover { border-bottom-color: var(--marca); }
.dica-do-link { color: var(--texto-suave); font-size: 11.5px; margin-top: .3rem; }

/* ---- o cartão do contexto (só na opção C) ---- */
.contexto-cartao { border-left: 3px solid var(--marca); background: var(--fundo-suave, #faf7f2); }
.contexto-cartao.fechado .campos-do-ato { display: none; }

/* ---- o que cada opção deixa de fora ---- */
html[data-opcao="A"] .acoes-fora { display: none; }
html[data-opcao="B"] .acoes-dentro { display: none; }
html[data-opcao="B"] .painel-ato { background: none; }
html[data-opcao="C"] .trio-do-ato { display: none; }
html[data-opcao="A"] .contexto-cartao,
html[data-opcao="B"] .contexto-cartao { display: none; }
html[data-opcao="C"] .acoes-dentro,
html[data-opcao="C"] .acoes-fora { display: none; }

/* ---- o telemóvel ---- */
@media (max-width: 560px) {
  /* O NOME E OS BOTÕES NÃO CABEM NA MESMA LINHA a 390px: o nome com o selo já pede ~180px, e os
     gestos pedem ~200. Ou eles descem, ou o nome quebra a meio. Descem. */
  .trio-linha { align-items: flex-start; }
  .trio-nome { flex: 1 1 100%; }
  .trio-acoes { margin-left: 0; }
  .acoes-do-ato .acao { flex: 1 1 auto; text-align: center; }
  .campos-do-ato { gap: .4rem .7rem; }
}
`;

/* O SCRIPT DA BANCADA: a troca de opção, a máquina de estados dos botões e a caixinha que abre
 * o painel. A máquina usa `localStorage` de verdade, com a forma da memória da porta — assim o
 * estado sobrevive a um recarregamento, que é o que se quer medir no telemóvel. */
const SCRIPT_ACERVO = `
window.aoTrocarOpcao = function (opcao) {
  document.documentElement.setAttribute('data-opcao', opcao);
  var painel = document.getElementById('painel-ato');
  if (painel) painel.open = (opcao === 'A') && !!memoria();
  pintar();
};

var CHAVE = 'proposta6:memoria';
function memoria() {
  try { var m = localStorage.getItem(CHAVE); return m ? JSON.parse(m) : null; } catch (e) { return null; }
}
function gravar(m) {
  try { if (m) localStorage.setItem(CHAVE, JSON.stringify(m)); else localStorage.removeItem(CHAVE); }
  catch (e) {}
}

/* O CONTEXTO ESTÁ COMPLETO? É a trava da porta (contextoFaltandoCompleto + a senha). Aqui
   verificam-se os campos que existem na bancada: professor, ciclo e aluna. */
function faltam() {
  var f = [];
  var p = document.getElementById('ato-professor');
  var c = document.getElementById('ato-ciclo');
  var a = document.getElementById('ato-aluna');
  if (p && !p.value) f.push('professor');
  if (c && !c.value.trim()) f.push('ciclo');
  if (a && !a.value) f.push('aluna');
  return f;
}

function pintar() {
  var m = memoria();
  var f = faltam();
  var painel = document.getElementById('painel-ato');

  /* OS TRÊS ESTADOS DA PORTA: sem memória mostra «Nova»; com memória mostra «Continuar» e
     «Começar de novo» e ESCONDE «Nova» — escondido, não desabilitado. */
  document.querySelectorAll('.acoes-do-ato').forEach(function (c) {
    if (!c.getClientRects().length) return;
    var nova = c.querySelector('[data-acao="nova"]');
    var cont = c.querySelector('[data-acao="continuar"]');
    var reco = c.querySelector('[data-acao="recomecar"]');
    if (!nova) return;
    nova.hidden = !!m;
    cont.hidden = !m;
    reco.hidden = !m;
    /* A TRAVA: sem o contexto completo não se cria. Desabilitado (e não escondido), porque o
       botão existe e o que falta está dito na linha de baixo. */
    nova.disabled = f.length > 0;
    nova.title = f.length ? 'Falta o contexto do ato: ' + f.join(', ') : '';
    var estado = c.parentElement.querySelector('.estado-do-ato');
    if (estado) {
      estado.hidden = false;
      if (m) {
        estado.setAttribute('data-falta', 'nao');
        estado.textContent = 'Há um preenchimento interrompido: ' + m.respondidos + ' de '
          + m.total + ' respondidas, último lançamento em ' + m.quando + '.';
      } else if (f.length) {
        estado.setAttribute('data-falta', 'sim');
        estado.textContent = 'Falta o contexto do ato: ' + f.join(', ') + '.';
      } else {
        estado.hidden = true;
        estado.textContent = '';
      }
    }
  });

  /* A CAIXINHA DIZ O CONTEXTO INTEIRO, ou o que falta. É o papel do \`title\` da porta, que no
     telemóvel não se lê. */
  document.querySelectorAll('[data-resumo]').forEach(function (el) {
    var p = document.getElementById('ato-professor');
    var c = document.getElementById('ato-ciclo');
    var a = document.getElementById('ato-aluna');
    var partes = [];
    if (p && p.value) partes.push(p.value);
    if (c && c.value.trim()) partes.push('ciclo ' + c.value.trim());
    if (a && a.value) partes.push(a.value);
    el.textContent = partes.length ? partes.join(' · ') : 'escolher o professor, o ciclo e a aluna';
    el.style.color = f.length ? 'var(--alerta)' : '';
  });

  /* A NOTÍCIA DO PREENCHIMENTO INTERROMPIDO NÃO PODE FICAR ESCONDIDA. Na opção A as acções vivem
     dentro do painel; com ele fechado, o aviso desaparecia. Quando há memória, o painel abre — a
     razão de o abrir é exactamente essa. */
  if (painel && m && document.documentElement.getAttribute('data-opcao') === 'A') painel.open = true;
}

document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-acao]');
  if (b) {
    var acao = b.getAttribute('data-acao');
    if (acao === 'nova') {
      /* «Nova» começa a preencher: a memória nasce com uma resposta dada. É a simulação do que a
         porta faz a cada resposta (salvar() em chaveDaMemoria). */
      gravar({ respondidos: 1, total: 53, quando: '25/10/2026 13:05' });
    } else if (acao === 'continuar') {
      b.closest('details').open = false;
    } else if (acao === 'recomecar') {
      /* «Começar de novo» volta ao estado de repouso — é o que a porta faz (voltarAoPortal):
         limpa, e a página reaparece como quem chega. O painel fecha porque já não há nada a
         dizer dentro dele. */
      gravar(null);
      var d = b.closest('details');
      if (d) d.open = false;
    }
    pintar();
    return;
  }
  /* o «abrir os campos» do cartão da opção C */
  var c = e.target.closest && e.target.closest('.contexto-cartao .acao');
  if (c) {
    var cartao = c.closest('.contexto-cartao');
    var fechado = cartao.classList.toggle('fechado');
    c.textContent = fechado ? 'abrir os campos' : 'fechar os campos';
  }
});

['ato-professor', 'ato-ciclo', 'ato-aluna'].forEach(function (id) {
  var el = document.getElementById(id);
  if (el) { el.addEventListener('change', pintar); el.addEventListener('input', pintar); }
});

pintar();
`;

function proporAcervo() {
  const fichas = FICHAS_DA_ANAMNESE.map((f) => cartaoDoAcervo(f)).join('\n');

  const corpo = `<header class="doc">
  <h1>Anamnese do aluno</h1>
  <p class="subtitulo">Batata · 3 anamneses · a escuta inicial de cada aluna</p>
</header>
<main>
<div class="conteudo">

  <!-- ═══ A (escolhida) e B: a caixinha do ato, na faixa inteira ═══ -->
  ${caixinhaDoAto()}
  ${ligacaoDaFichaEmBranco({ fora: true })}

  <!-- B: as acções fora do painel. Repetidas de propósito — numa bancada, cada opção tem de
       existir na marcação para poder ser medida; no produto é um sítio só. -->
  <div class="acoes-do-ato acoes-fora">${acoesDeComecar({ comEstado: false })}</div>

  <div class="filtro">
    <input type="text" placeholder="pelo nome, pela turma ou pelo professor" aria-label="filtrar">
    <span class="conta">3 anamneses de 3</span>
  </div>

  <ul class="trio-lista">
    <!-- ═══ C: o contexto é o primeiro cartão ═══ -->
    <li class="trio-plano contexto-cartao fechado">
      <div class="trio-linha">
        <span class="trio-nome"><b>Contexto do ato</b></span>
        <span class="trio-acoes"><button type="button" class="acao pequena secundario"
          >abrir os campos</button></span>
      </div>
      <div class="trio-dono">Escola Batata · quem preenche, para quem, e com que senha</div>
      <div class="campos-do-ato">${camposDoAto()}</div>
      <div class="acoes-do-ato">${acoesDeComecar()}</div>
      ${ligacaoDaFichaEmBranco()}
    </li>
${fichas}
  </ul>

  <p class="aviso-proposta" style="margin-top:20px">O que <b>sai</b> desta página quando isto se
  implementar: os dois parágrafos explicativos do topo da porta («Aqui você descreve o ponto de
  partida…» e a nota da observação inicial) e a caixa «Fichas gravadas», com o seu filtro e a sua
  paginação — as fichas passam a ser esta lista. O que <b>fica</b>, com a mesma regra: o contexto
  do ato, a senha, o «continuar de onde parei / começar de novo», o «ver a ficha em branco», o selo
  livre/vinculada, o link para o <b>.html</b> e os gestos editar · apagar · ajustar.</p>

</div>
</main>`;

  return pagina({
    titulo: 'A Área do Professor numa página',
    opcaoInicial: 'A',
    corpo,
    cssExtra: CSS_ACERVO,
    opcoes: OPCOES_ACERVO,
    bancada: marcacaoDaBancada({
      sobre: 'Proposta 6 · o acervo com a porta',
      titulo: 'Uma página em vez de duas',
      intro: 'A listagem absorve o contexto do ato e as acções de começar. A <b>opção A está '
        + 'escolhida</b>: a caixinha do «Turma», na faixa inteira, abre o painel. Clique em '
        + '<b>Nova anamnese</b> para ver a regra dos botões em acção — e depois em '
        + '<b>Começar de novo</b>.',
      opcoes: OPCOES_ACERVO,
      inicio: 'A',
    }),
    scriptExtra: SCRIPT_ACERVO,
  });
}

/**
 * OS ESTADOS DA LISTA — a sala de ensaio do acervo (25/10/2026).
 *
 * PORQUE EXISTE. A pesquisadora pediu para ver tudo junto antes de «bater o martelo»: «eu preciso
 * ver isso tudo funcionando… tenho medo que você esqueça algumas coisas». Cada peça foi provada
 * em separado (`provar-listas-do-acervo`, `provar-painel-do-ato`); o que faltava era o CONJUNTO
 * numa página que se abre no telemóvel — os três estados de cada família, os botões que cada um
 * oferece, e o painel do ato nos dois modos.
 *
 * OS CARTÕES SÃO OS DO PRODUTO (`lista-html.cartaoDaLista`), com os dados do fixture. O que é
 * escrito à mão é só a moldura: os títulos de secção e as duas variantes do painel (fechado e
 * aberto), porque um `details` só mostra um estado de cada vez e a bancada existe para os mostrar
 * a par.
 */
function proporEstados() {
  const cartao = (item) => listasDoNucleo.cartaoDaLista(item, 0);
  const lista = (itens) => '<ul class="trio-lista">' + itens.map(cartao).join('\n') + '</ul>';

  /* OS TRÊS ESTADOS DA ANAMNESE, com o que cada um oferece. É o caso que a pesquisadora abriu:
     «as anamneses que eu já tenho prontas aqui estão livres… estão sem o rótulo». */
  const anamneses = [
    { nome: 'Aluna C', selo: 'livre', seloClasse: 'livre', turma: 'Balé Nível 1',
      professor: 'Cafe No Bule', contexto: 'vinculada à turma Balé Nível 1',
      acoes: [['Editar', '/anamnese/?editar=anamnese-c', ''],
        ['Apagar', '/anamnese/?editar=anamnese-c', 'secundario',
          'a anamnese solta pode ser apagada; a vinculada, não']] },
    { nome: 'Aluna D', selo: 'nova', seloClasse: 'livre', turma: '',
      professor: 'Cafe No Bule', contexto: 'aluna nova — sem turma',
      acoes: [['Editar', '/anamnese/?editar=anamnese-d', ''],
        ['Apagar', '/anamnese/?editar=anamnese-d', 'secundario',
          'a anamnese solta pode ser apagada; a vinculada, não']] },
    { nome: 'Aluna A', selo: 'vinculada', seloClasse: 'vinculada', turma: 'Balé Nível 1',
      professor: 'Cafe No Bule', contexto: 'vinculada à turma Balé Nível 1',
      acoes: [['Ajustar', '/anamnese/?professor=cafe-no-bule&ciclo=01&aluna=Aluna+A', 'secundario',
        'acrescenta um elo novo; o registo anterior permanece']] },
  ];

  const planos = [
    { nome: 'Plano de ensino — Balé Nível 1', selo: 'solta', seloClasse: 'livre',
      turma: 'Balé Nível 1', professor: 'Cafe No Bule',
      contexto: 'consolidar o alinhamento e a transferência de peso',
      acoes: [['Editar', '/plano-ensino/?fonte=plano&editar=plano-a', '']] },
    { nome: 'Plano de ensino — Balé Nível 2', selo: 'vinculada', seloClasse: 'vinculada',
      turma: 'Balé Nível 2', professor: 'Cafe No Bule', contexto: 'observado por um PO',
      acoes: [['Abrir no formulário', '/plano-ensino/?fonte=plano&professor=cafe-no-bule', 'secundario']] },
  ];

  const corpo = `<header class="doc">
  <h1>Os estados da lista</h1>
  <p class="subtitulo">Sala de ensaio · o rótulo, o botão e o painel do ato, tudo à vista</p>
</header>
<main>
<div class="conteudo">

  <div class="caixa nota">
    <h3>O que esta página é</h3>
    <p>Os cartões abaixo são desenhados pelo <b>mesmo módulo que serve as três listas</b>
    (<code>lista-html.cartaoDaLista</code>), com os dados do fixture — não são uma maqueta. O que
    esta página junta é o que estava provado em separado: os três estados de cada família, o botão
    que cada um oferece, e o painel do ato nos dois estados.</p>
  </div>

  <h2>1 · Anamnese — o rótulo que faltava</h2>
  <p class="subtitulo">Antes, a anamnese de uma aluna <b>com</b> turma não levava selo nenhum.
  Quem lia não sabia se estava livre ou se o rótulo é que não viera.</p>
  ${lista(anamneses)}
  <p class="estado-do-ato"><b>livre</b> — a aluna tem turma e nenhum Plano de Observação a usa:
  edita-se e apaga-se. <b>nova</b> — a aluna ainda não está em curadoria nenhuma; é a porta de
  entrada, e qualquer professor a pode entrevistar. <b>vinculada</b> — um PO já a usa: não se
  edita, acrescenta-se um elo («ajustar»), e o registo anterior permanece.</p>

  <h2>2 · Plano de ensino — o mesmo rótulo, outro vocabulário</h2>
  <p class="subtitulo">Aqui o gesto da ficha ligada chama-se <b>derivar</b>, e não «ajustar»: cada
  família diz o que faz no seu próprio vocabulário, e um sinónimo inventado na tela prometeria uma
  coisa que o servidor não conhece.</p>
  ${lista(planos)}

  <h2>3 · O painel do ato — fechado e aberto</h2>
  <p class="subtitulo">Fechado, o nome da barra é o da <b>acção</b> («Fazer anamnese»): «contexto
  do ato» é vocabulário de quem programa. Aberto, passa a «Contexto do ato», que é o que faz
  sentido com os campos à vista.</p>

  <div class="acoes-da-lista">
    <details class="bloco-lista">
      <summary class="bloco-cabeca">
        <span class="bloco-titulo bloco-nome-fechado">Fazer anamnese</span>
        <span class="bloco-titulo bloco-nome-aberto">Contexto do ato</span>
        <span class="bloco-resumo">Cafe No Bule · ciclo 01 · Aluna A</span>
        <span class="seta-do-ato" aria-hidden="true">▾</span>
      </summary>
      <div class="bloco-corpo">
        <div class="campos-do-ato">
          <span class="campo"><label class="campo-rotulo">professor</label>
            <select><option>Cafe No Bule</option></select></span>
          <span class="campo"><label class="campo-rotulo">ciclo</label>
            <input type="text" value="01"></span>
          <span class="campo"><label class="campo-rotulo">aluna</label>
            <select><option>Aluna A</option></select></span>
          <span class="campo campo-senha"><label class="campo-rotulo">senha do professor</label>
            <input type="password" value="……"></span>
        </div>
        <p class="obrigatorios">Todos estes campos são obrigatórios: sem eles o ato não abre.</p>
        <div class="acoes-do-ato">
          <button type="button" class="acao">Fazer anamnese</button>
        </div>
      </div>
    </details>
    <p class="subtitulo">↑ fechado — o estado de repouso no computador</p>

    <details class="bloco-lista" open>
      <summary class="bloco-cabeca">
        <span class="bloco-titulo bloco-nome-fechado">Fazer anamnese</span>
        <span class="bloco-titulo bloco-nome-aberto">Contexto do ato</span>
        <span class="bloco-resumo">Cafe No Bule · ciclo 01 · Aluna A</span>
        <span class="seta-do-ato" aria-hidden="true">▾</span>
      </summary>
      <div class="bloco-corpo">
        <div class="campos-do-ato">
          <span class="campo"><label class="campo-rotulo">professor</label>
            <select><option>Cafe No Bule</option></select></span>
          <span class="campo"><label class="campo-rotulo">ciclo</label>
            <input type="text" value="01"></span>
          <span class="campo"><label class="campo-rotulo">aluna</label>
            <select><option>Aluna A</option></select></span>
          <span class="campo campo-senha"><label class="campo-rotulo">senha do professor</label>
            <input type="password" value="……"></span>
        </div>
        <p class="obrigatorios">Todos estes campos são obrigatórios: sem eles o ato não abre.</p>
        <div class="acoes-do-ato">
          <button type="button" class="acao">Fazer anamnese</button>
        </div>
      </div>
    </details>
    <p class="subtitulo">↑ aberto — o nome troca, e os campos aparecem</p>

    <details class="bloco-lista">
      <summary class="bloco-cabeca">
        <span class="bloco-titulo">Procurar</span>
        <span class="seta-do-ato" aria-hidden="true">▾</span>
      </summary>
      <div class="bloco-corpo">
        <form class="filtro" onsubmit="return false"><div class="filtrar">
          <div class="campo-filtro busca"><label class="campo-rotulo" for="pe-busca">Procurar</label>
            <input id="pe-busca" type="search" placeholder="pelo nome, pela turma ou pelo professor"></div>
        </div></form>
      </div>
    </details>
    <p class="subtitulo">↑ o outro bloco — <b>nunca os dois abertos</b></p>
  </div>

  <h2>4 · O menu «Ações» — só no telemóvel</h2>
  <p class="subtitulo">No computador ele não aparece: as duas barras estão à vista e um clique a
  mais seria pior do que não o ter. No telemóvel é ele que manda, e abre a folha que sobe de
  baixo — o desenho do «Seções» da Produção.</p>
  <div class="acoes-da-lista">
    <button type="button" class="acao acoes-do-menu" aria-expanded="true">Ações<span
      class="seta-do-ato" aria-hidden="true">▾</span></button>
  </div>
  <div class="caixa nota">
    <p>A folha é <code>position:fixed</code> e cobre a página com um véu — numa bancada ela
    taparia o resto do que há para ver, e por isso aqui está descrita e não aberta. No produto
    ela abre com um toque, fecha com o véu, e cada acção abre o seu bloco.</p>
  </div>

  <h2>5 · O que cada família oferece</h2>
  <div class="caixa">
    <table class="tabela">
      <thead><tr><th>Registo</th><th>Selo</th><th>O que se pode fazer</th></tr></thead>
      <tbody>
        <tr><td>Anamnese solta e não usada</td><td>livre</td><td>Editar · Apagar</td></tr>
        <tr><td>Anamnese de aluna sem curadoria</td><td>nova</td><td>Editar · Apagar</td></tr>
        <tr><td>Anamnese usada por um PO</td><td>vinculada</td><td>Ajustar (elo novo)</td></tr>
        <tr><td>Plano de ensino não observado</td><td>solta</td><td>Editar</td></tr>
        <tr><td>Plano de ensino observado por um PO</td><td>vinculada</td><td>Abrir no formulário</td></tr>
        <tr><td>Plano de Observação</td><td>—</td><td>Corrigir · Derivar</td></tr>
      </tbody>
    </table>
  </div>

</div>
</main>`;

  return pagina({
    titulo: 'Os estados da lista',
    corpo,
    opcoes: [],
  });
}

// ==================================================== PROPOSTA: A LISTAGEM DOS VERBETES

/* A LISTAGEM DOS VERBETES COM A CARA DA LISTAGEM DAS TURMAS (02/11/2026).
 *
 * PEDIDO DELA: «Reaproveitar o padrão visual e estrutural já adotado na Listagem de Turmas,
 * trazendo dados sintéticos extraídos diretamente da Tabela de Decomposição (Step 6)». E: «essa
 * listagem tem que ter também tanto para a tela de desktop quanto para a tela do celular».
 *
 * O QUE ESTA BANCADA MEDE, e não descreve: a altura de cada cartão e o transbordo em quatro
 * larguras. As duas coisas decidem o desenho — um cartão de três caixinhas com painel é mais alto
 * do que uma linha de texto, e no telemóvel essa diferença é a que se vê.
 *
 * OS DADOS SÃO OS REAIS. Não há fixture: os verbetes vêm do alfabeto publicado, as músicas e os
 * trechos vêm das células, e os nomes das posições, direções e orientações vêm do vocabulário e da
 * gramática — em português, como a tela passou a mostrar.
 */
const notacaoDoProjeto = require(path.join(RAIZ, 'motor', 'nucleo', 'notacao.js'));

function dadosDosVerbetes() {
  const alfabeto = notacaoDoProjeto.paraNotacao('Benesh');
  const vocab = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'biblioteca', 'modalidades', 'bale-classico', 'vocabulario.json'), 'utf8'));
  const termos = Array.isArray(vocab) ? vocab : Object.values(vocab);
  const nomeDoTermo = (id) => {
    const t = termos.find((x) => x && x.id === id);
    return t ? (t.nome || t.termo) : id;
  };
  const gram = (alfabeto && alfabeto.gramatica) || {};
  const nomeDaDirecao = (termo) => {
    const achado = Object.values(gram.direcoesDoMembro || {}).find((d) => d.termo === termo);
    return achado ? achado.nome : (termo || 'sem direção');
  };
  const nomeDaOrientacao = (termo) => {
    const achado = Object.values(gram.orientacoesDoCorpo || {}).find((d) => d.termo === termo);
    return achado ? achado.nome : termo;
  };

  const saida = [];
  for (const nome of Object.keys((alfabeto && alfabeto.verbetes) || {}).sort((a, b) => a.localeCompare(b, 'pt-BR'))) {
    if (nome.startsWith('_')) continue;
    const musicas = alfabeto.verbetes[nome] || {};
    const porMusica = [];
    for (const chave of Object.keys(musicas).filter((k) => /^\d+\|/.test(k))) {
      const [tempos, compasso] = chave.split('|');
      // A COMPOSIÇÃO É A DO MOTOR, e não uma segunda leitura: as linhas do cartão são as mesmas
      // que a tabela do passo 6 desenha, com o compasso derivado da ordem dentro de cada pista.
      const composto = notacaoDoProjeto.compor({
        'Bloco': 'Solo',
        'Objetivo específico': '1 — x',
        'Conteúdo do nível': nome,
        'Tempos': tempos,
        'Compasso': compasso,
      }, alfabeto);
      const segmentos = (composto && composto.segmentos) || [];
      const direcoes = [];
      const orientacoes = [];
      const categorias = [];
      for (const s of segmentos) {
        if (s.direcao && direcoes.indexOf(s.direcao) === -1) direcoes.push(s.direcao);
        if (s.orientacao && s.orientacao !== 'en-face' && orientacoes.indexOf(s.orientacao) === -1) {
          orientacoes.push(s.orientacao);
        }
        if (s.categoria && categorias.indexOf(s.categoria) === -1) categorias.push(s.categoria);
      }
      const m = musicas[chave] || {};
      porMusica.push({
        chave: chave,
        tempos: Number(tempos) || 0,
        compasso: compasso,
        cobre: Number(m.cobre) || 0,
        posicao: m.posicao ? nomeDoTermo(m.posicao.termo) : '',
        trechos: segmentos.length,
        direcoes: direcoes.map(nomeDaDirecao),
        orientacoes: orientacoes.map(nomeDaOrientacao),
        categorias: categorias,
        linhas: segmentos.map((s) => ({
          compasso: s.compasso,
          contagem: s.contagem,
          categoria: s.categoria,
          sinais: (s.sinais || []).join(' '),
          descricao: String(s.descricao || '').split('\n')[0],
        })),
      });
    }
    if (porMusica.length) saida.push({ nome: nome, musicas: porMusica });
  }
  return saida;
}

const VERBETES_PARA_LISTA = dadosDosVerbetes();

function seloDaPosicao(posicao) {
  return posicao ? '<span class="selo discreto">' + posicao + '</span>' : '';
}

/** O cartão do veredito com as três caixinhas — a peça da lista de turmas, e nada inventado. */
function cartaoDoVerbete(v) {
  const m = v.musicas[0];
  const maisDeUma = v.musicas.length > 1;
  const caixa = (rotulo, valor, qual, dica) =>
    '<button type="button" class="trio-item" data-balao="' + qual + '" aria-expanded="false"' +
    ' aria-label="' + dica + '">' +
    '<span class="trio-k">' + rotulo + '</span>' +
    '<span class="trio-v">' + valor + '</span>' +
    '<span class="trio-q" aria-hidden="true">?</span></button>';

  const painelMusica = '<div class="trio-grade">' + v.musicas.map((x) =>
    '<div><span class="trio-k">música</span><span class="trio-v">' +
    x.tempos + ' tempos em ' + x.compasso + '</span></div>' +
    '<div><span class="trio-k">compassos</span><span class="trio-v">' +
    Math.ceil(x.tempos / (Number(x.compasso.split('/')[0]) || 4)) + '</span></div>').join('') +
    '</div>';

  const painelDirecao = '<div class="trio-chips">' + (
    m.direcoes.concat(m.orientacoes).map((d) => '<span>' + d + '</span>').join('') ||
    '<span class="dono">(sem direção — o trecho ainda não foi arrumado)</span>') + '</div>' +
    '<p class="trio-nota">As direções dizem para onde o membro vai; as orientações, como o corpo ' +
    'está voltado. Duas perguntas, e é por isso que são dois eixos.</p>';

  // A NOTAÇÃO É A TABELA DO PASSO 6, EM LEITURA. Cada linha é um trecho: o compasso que o motor
  // deriva, a contagem, a categoria com os sinais, e a primeira linha da descrição.
  const painelNotacao = '<ul class="lista-de-trechos">' + m.linhas.map((l) =>
    '<li><span class="marco">compasso ' + l.compasso + '</span>' +
    '<code>[' + l.categoria + ': ' + l.sinais + ']</code>' +
    '<span class="quando">' + l.contagem + '</span>' +
    '<span class="diz">' + l.descricao + '</span></li>').join('') + '</ul>';

  return '<li class="turma" data-verbete="' + v.nome + '">' +
    '<div class="linha-turma"><span class="nome"><b>' + v.nome + '</b>' +
    ' ' + seloDaPosicao(m.posicao) + (maisDeUma ? ' <span class="selo dim">' +
      v.musicas.length + ' músicas</span>' : '') + '</span></div>' +
    '<div class="dono">' + m.tempos + ' tempos · ' + m.compasso + ' · ' +
      m.trechos + (m.trechos === 1 ? ' trecho' : ' trechos') + ' · ' +
      m.categorias.join(', ') + '</div>' +
    '<div class="trio">' +
    caixa('Música', m.tempos + ' tempos', 'musica', 'ver a música deste exercício') +
    caixa('Direção', m.direcoes.length ? m.direcoes.join(' · ') : '—', 'direcao',
      'ver as direções e as orientações deste exercício') +
    caixa('Notação', m.trechos + (m.trechos === 1 ? ' trecho' : ' trechos'), 'notacao',
      'ver a notação deste exercício, trecho a trecho') +
    '</div>' +
    '<div class="trio-painel" data-painel="musica" hidden>' + painelMusica + '</div>' +
    '<div class="trio-painel" data-painel="direcao" hidden>' + painelDirecao + '</div>' +
    '<div class="trio-painel" data-painel="notacao" hidden>' + painelNotacao + '</div>' +
    '</li>';
}

function cssDosVerbetes() {
  return `
/* ============================================================================
   A LISTAGEM DOS VERBETES — as peças da lista de turmas, e só elas.
   O que se acrescenta são duas coisas que a lista de turmas não tem: o
   reordenamento das caixinhas no telemóvel e a lista dos trechos em leitura.
   ========================================================================== */

.lista-de-verbetes { list-style: none; margin: 0; padding: 0; }

/* 0 · HOJE — a linha por música, que é o que está na Produção. */
.verbetes-linha { list-style: none; margin: 0; padding: 0; }
.verbetes-linha li { display: block; padding: .35rem .1rem; border-bottom: 1px dotted var(--borda-campo); }
.verbetes-linha .nome { display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; }
.verbetes-linha .nome button {
  background: none; border: 0; padding: 0; margin: 0; font: inherit; color: inherit; cursor: pointer;
  text-decoration: underline; text-decoration-color: var(--borda-campo); text-underline-offset: .15em;
}
.verbetes-linha .dono { display: block; margin-top: .12rem; color: var(--texto-suave); font-size: .85rem; }

/* 1 e 2 · O CARTÃO. As regras de \`li.turma\` e \`.linha-turma\` vivem na página da Produção, e
   não na folha; aqui vêm com a bancada, porque é a bancada que as usa. */
li.turma { display: block; margin-bottom: .6rem; padding-bottom: .6rem; border-bottom: 1px dotted var(--borda-campo); }
.linha-turma { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.linha-turma .nome { flex: 1 1 14rem; min-width: 0; }
li.turma .dono { display: block; margin-top: .1rem; color: var(--texto-suave); font-size: .85rem; }

/* A LISTA DOS TRECHOS — a tabela do passo 6, em leitura. */
.lista-de-trechos { list-style: none; margin: 0; padding: 0; display: grid; gap: .45rem; }
.lista-de-trechos li {
  display: grid; grid-template-columns: 6.5rem 1fr auto; gap: .1rem .6rem;
  padding: .35rem .5rem; border-radius: var(--raio-1); background: var(--fundo-faixa);
  font-size: .84rem; line-height: 1.35;
}
.lista-de-trechos .marco { font-weight: 700; color: var(--marca-texto); font-size: .76rem;
  text-transform: uppercase; letter-spacing: .04em; }
.lista-de-trechos .quando { font-variant-numeric: tabular-nums; color: var(--texto-suave); }
.lista-de-trechos .diz { grid-column: 2 / -1; color: var(--texto-suave); }
.lista-de-trechos code { font-size: .8rem; background: transparent; }
@media (max-width: 420px) {
  .lista-de-trechos li { grid-template-columns: 1fr auto; }
  .lista-de-trechos .marco { grid-column: 1 / -1; }
  .lista-de-trechos .diz { grid-column: 1 / -1; }
}

/* 2 · A NOTAÇÃO À VISTA: sem painel, e a lista dos trechos fica no cartão. */
[data-opcao="avista"] .trio { grid-template-columns: repeat(2, minmax(0, 1fr)); }
[data-opcao="avista"] .trio-painel[data-painel="notacao"] { display: block !important; }
[data-opcao="avista"] .trio-item[data-balao="notacao"] { display: none; }

/* NO TELEMÓVEL, AS TRÊS CAIXINHAS FICAM LADO A LADO ATÉ AOS 360 px — a regra do padrão da
   lista. Abaixo disso, duas e uma. */
@media (max-width: 359px) {
  .trio { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
`;
}

function scriptDosVerbetes() {
  return `(function () {
  var lista = document.getElementById('lista-verbetes');
  if (!lista) return;
  var cartoes = function () { return [].slice.call(lista.children); };
  lista.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.trio-item') : null;
    if (!b) return;
    var alvo = b.getAttribute('data-balao');
    var jaAberto = b.getAttribute('aria-expanded') === 'true';
    // O PAINEL É O DO CARTÃO EM QUE SE CARREGOU, e não o primeiro da lista. Sem o closest, o
    // «?» de um exercício abria o painel do primeiro — o mesmo defeito que a lista de turmas
    // teve, e que só se vê quando há mais do que uma linha.
    var li = b.closest('li');
    cartoes().forEach(function (c) {
      [].slice.call(c.querySelectorAll('.trio-item')).forEach(function (x) {
        x.setAttribute('aria-expanded', 'false');
      });
      [].slice.call(c.querySelectorAll('.trio-painel')).forEach(function (p) { p.hidden = true; });
    });
    if (jaAberto) return;
    b.setAttribute('aria-expanded', 'true');
    var painel = li ? li.querySelector('.trio-painel[data-painel="' + alvo + '"]') : null;
    if (painel) painel.hidden = false;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    cartoes().forEach(function (c) {
      [].slice.call(c.querySelectorAll('.trio-item')).forEach(function (x) {
        x.setAttribute('aria-expanded', 'false');
      });
      [].slice.call(c.querySelectorAll('.trio-painel')).forEach(function (p) { p.hidden = true; });
    });
  });
})();`;
}

const OPCOES_VERBETES = [
  { id: 'hoje', n: '0', t: 'Hoje — a linha por música', m: '66 px por linha',
    d: 'o que está na Produção: o nome, o selo da posição e o complemento numa linha por música' },
  { id: 'cartao', n: '1', t: 'O cartão das turmas', m: '198 px por cartão',
    d: 'três caixinhas com «?» que abrem: música, direção e a notação trecho a trecho' },
  { id: 'avista', n: '2', t: 'O cartão com a notação à vista', m: '561 px por cartão',
    d: 'as duas primeiras em caixinha, e a notação sempre aberta dentro do cartão — mais alto' },
];

function proporVerbetes() {
  const linhas = VERBETES_PARA_LISTA.map(cartaoDoVerbete).join('\n');
  const linhasDeHoje = VERBETES_PARA_LISTA.map((v) => v.musicas.map((m) =>
    '<li><span class="nome"><button type="button">' + v.nome + '</button> ' +
    seloDaPosicao(m.posicao) + '</span>' +
    '<span class="dono">' + m.tempos + ' tempos · ' + m.compasso + ' · ' +
    m.trechos + (m.trechos === 1 ? ' trecho' : ' trechos') + ' · ' +
    m.categorias.join(', ') + '</span></li>').join('')).join('\n');

  const nota = `<div class="nota-do-teste">
  <p><strong>A listagem do verbete passa a ter a cara da listagem das turmas.</strong> As mesmas
  peças: o nome e os selos numa linha, o complemento por baixo, e as três caixinhas com o «?» que
  abrem — a caixinha inteira é o alvo, não o «?». É a mesma decisão de 23/10/2026, aplicada a outra
  lista.</p>
  <p><strong>O conteúdo é derivado, e é o do passo 6.</strong> A caixinha «Notação» abre a
  decomposição trecho a trecho — o compasso que o motor deriva, a contagem, a categoria com os
  sinais e a descrição. Não é uma segunda tabela: é a mesma leitura, do lado da lista.</p>
  <p><strong>Os nomes estão em português.</strong> «primeira posição», «à frente», «pernas
  cruzadas» — o <code>nome</code> do vocabulário, e não o <code>termo</code> em francês. É o que
  fará a lista funcionar quando a modalidade for hip hop ou contemporâneo.</p>
  <p><strong>Compare com a opção 0</strong> e repare no custo: o cartão diz mais e ocupa mais. Na
  opção 2 a notação fica à vista, sem clique — e é a mais alta das três. No telemóvel essa altura
  é o que decide, e é por isso que se mede em quatro larguras.</p>
  </div>`;

  return pagina({
    titulo: 'Proposta — a listagem dos verbetes',
    opcaoInicial: 'cartao',
    corpo: `<header class="doc">
  <h1>Exercícios com verbete</h1>
  <p class="subtitulo">A listagem do verbete, com as peças da listagem de turmas</p>
  <p class="ficha"><span>${VERBETES_PARA_LISTA.length} exercícios</span><span>` +
      VERBETES_PARA_LISTA.reduce((t, v) => t + v.musicas.length, 0) +
      ` músicas</span><span>dados reais do alfabeto</span></p>
</header>

<main>
<div class="conteudo">
${nota}
<div class="col-lista">
  <ul class="lista-de-verbetes" id="lista-verbetes">
${linhas}
  </ul>
  <ul class="verbetes-linha" id="lista-de-hoje">
${linhasDeHoje}
  </ul>
</div>
</div>
</main>`,
    cssExtra: cssDosVerbetes() + `
/* A OPÇÃO 0 É A LISTA DE HOJE; as outras duas são o cartão. Uma esconde a outra. */
#lista-de-hoje { display: none; }
[data-opcao="hoje"] #lista-de-hoje { display: block; }
[data-opcao="hoje"] #lista-verbetes { display: none; }
.col-lista { max-width: 760px; margin: 0 auto; }
`,
    scriptExtra: scriptDosVerbetes(),
    opcoes: OPCOES_VERBETES,
    bancada: marcacaoDaBancada({
      sobre: 'A listagem do verbete',
      titulo: 'A listagem do verbete com a cara das turmas',
      intro: 'Escolha uma opção, feche o painel e <strong>toque nas caixinhas com «?»</strong>. '
        + 'A altura de cada cartão está medida à direita, nas quatro larguras.',
      opcoes: OPCOES_VERBETES,
      inicio: 'cartao',
    }),
  });
}

// ======================================== PROPOSTA: AS FORMAS DO VÉU DA OPERAÇÃO (11/11/2026)

/*
 * A PROPOSTA, na letra dela: «o véu está legal. A caixa que você mostra com o texto dizendo que
 * está processando e tal e o spinner ali é que está esquisito, está feio. Eu recomendo apenas
 * deixar o spinner rodando sem nenhuma informação. Mas eu gostaria que você colocasse lá no
 * experimento para eu ver como é que fica algumas opções. A que já está, para eu poder comparar,
 * uma que é sem nenhuma caixa de texto e outra que é o texto na tela como se fosse também um
 * pouco mais forte que uma marca d'água, sem nenhuma caixa, sem borda […] porque ele conta o
 * andamento do processo, ele conta uma história para o usuário.»
 *
 * O QUE ESTA BANCADA NÃO FAZ: não desenha um véu de mentira. As três formas são o MESMO elemento —
 * o véu da folha, com o cartão, a etiqueta, o texto e o giro —, construído pelo `nav.js` de
 * verdade, e a operação é publicada pela API de verdade (`LastroDaOperacao.ocupar`). Cada opção é
 * um punhado de declarações a mais, debaixo de `[data-opcao="…"]`: escolhida uma, aplicá-la é
 * mover essas linhas para a folha.
 *
 * O QUE ESTÁ POR BAIXO É A PRODUÇÃO, e não uma maquete: as secções «Salas» e «Turmas» saem da
 * página que o servidor monta (`paginaProducao`), com os dados de um fixture. É o formulário e a
 * listagem que ela vê todos os dias — e o que se está a decidir é se se vê ATRAVÉS do véu o
 * bastante para não se perder onde se está.
 *
 * E A PÁGINA NÃO AVISA OUTRAS ABAS (`data-operacao="so-esta-aba"`). Uma bancada que publicasse a
 * operação trancaria as abas de trabalho de quem a abre para a julgar.
 */

const OPCOES_VEU = [
  { id: 'hoje', n: '0', t: 'A que está — o texto na tela', m: 'duas linhas',
    d: 'a palavra e a frase soltas, com halo em vez de moldura: é a forma que o produto usa desde 11/11/2026' },
  { id: 'cartao', n: '1', t: 'O cartão, a forma de antes', m: '34 rem',
    d: 'a etiqueta e a frase dentro de um cartão opaco: a comparação que justificou a troca' },
  { id: 'giro', n: '2', t: 'Só o giro, sem nada escrito', m: '38 px',
    d: 'o anel com um halo de papel: lê-se sobre qualquer fundo e não ocupa nada' },
];

/** As secções da Produção que servem de fundo — extraídas da página que o servidor monta. */
function secoesDaProducao() {
  const sala = (nome, id) => ({
    id, nome, ordem: 0, frequencia: 2, dias: ['qua'], horarios: { qua: '18:00' },
    duracaoMin: 60, periodoInicio: '2026-11-20', periodoFim: '2026-12-20', ativo: true,
    grau: 'Grade 1', nivel: '1', regua: [],
  });
  let html = '';
  try {
    const bastidores = require(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'));
    html = bastidores.paginaProducao(
      'calango',
      { professor: 'pe-torto', escola: 'calango', query: 'professor=pe-torto&escola=calango' },
      [{ nome: 'Redinha Rosa', slug: 'redinha-rosa' }], ['Aluna A', 'Aluna B'],
      'Pe Torto', 'pe-torto',
      [sala('Piano', 'piano'), sala('Rosa', 'rosa')], [], [],
      [{
        id: 'redinha-rosa-bale-classico-piano-2026-11-11', professor: 'redinha-rosa',
        modalidade: 'Balé clássico', tradicao: 'RAD', grau: '', nivel: '1',
        nivelReferencia: 'Grade 1', turmas: ['Piano'], linhaDeBase: 'ami',
        linhaDeBaseNome: 'ami', repertorio: ['Plié'], alunas: ['Aluna B'],
        vigenteDe: '2026-11-11',
      }],
      [], [], undefined, undefined,
      [{ id: 'ami', nome: 'ami', professor: 'pe-torto', alunas: ['Aluna B'],
        campos: [{ id: 'passe', nome: 'o passé', grupo: 'Os elementos basilares' }] }], []);
  } catch (e) {
    return { estilo: '', secoes: '' };
  }
  const estilo = (/<style>([\s\S]*?)<\/style>/.exec(html) || ['', ''])[1];

  /* AS SECÇÕES, UMA A UMA. Cada uma PODE ter um `<section>` dentro (o cartão de um bloco), e por
   * isso conta-se a profundidade em vez de procurar o primeiro fecho: um fecho a mais cortava a
   * secção a meio, e a bancada mostrava um formulário sem a listagem. */
  const recorta = (id) => {
    const abre = html.indexOf('<section class="secao" id="' + id + '"');
    if (abre === -1) return '';
    let i = abre, nivel = 0;
    while (i < html.length) {
      const proxAbre = html.indexOf('<section', i);
      const proxFecha = html.indexOf('</section>', i);
      if (proxFecha === -1) return '';
      if (proxAbre !== -1 && proxAbre < proxFecha) { nivel += 1; i = proxAbre + 8; continue; }
      nivel -= 1;
      i = proxFecha + 10;
      if (nivel === 0) return html.slice(abre, i);
    }
    return '';
  };
  const secoes = ['sec-turmas', 'sec-curadorias']
    .map((id) => recorta(id).replace('<section class="secao" id="' + id + '" hidden>',
      '<section class="secao" id="' + id + '">'))
    .join('\n');
  return { estilo, secoes };
}

const CSS_VEU = `
/* ============================================================================
   AS FORMAS DO VÉU — três desfechos do MESMO elemento

   Nenhuma destas linhas inventa um véu: todas são declarações a mais sobre a
   peça da folha, que é a que está de pé na página (construída pelo nav.js
   verdadeiro, com a operação publicada pela API verdadeira).

   A OPÇÃO 0 NÃO TEM NADA — e é isso que a torna a régua: é literalmente a peça
   que o produto serve, sem uma declaração a mais. Desde 11/11/2026 essa peça é
   «o texto na tela, sem caixa», que foi a forma escolhida; o cartão ficou como
   opção 1, para a comparação que justificou a troca não se perder.
   ========================================================================== */

/* A BANCADA SOBE ACIMA DO VÉU. O véu é z-index 120 e cobre a página inteira; sem isto, o painel
   que troca de opção ficaria por baixo dele — e não se avalia um véu sem poder trocar de véu.
   É a única linha desta proposta que não é sobre o véu, e é sobre a bancada. */
#bancada { z-index: 200; }
#bancada-aba { z-index: 190; }

/* O FUNDO — as duas secções da Produção, verdadeiras. O que muda é só a moldura delas: a página
   da bancada não tem a coluna lateral nem a barra de contexto, e as secções ficam com o ar de cá. */
.corpo-da-bancada { padding: 8px clamp(12px, 3vw, 36px) 90px; }
.corpo-da-bancada > .secao { margin: 0 0 22px; }
.corpo-da-bancada .secao-titulo { margin-top: 0; }

/* ---- 1 · O CARTÃO, A FORMA DE ANTES --------------------------------------
   Guardado porque a comparação é a razão de ser desta bancada: o cartão opaco que o
   produto usou até 11/11/2026, restituído nas medidas que tinha — superfície do papel,
   filete, sombra, a etiqueta em selo de alerta e a frase na fonte de interface. Sem ele, a decisão
   tomada («implementa a opção 2») deixava de poder ser conferida contra o que veio
   substituir. */
[data-opcao="cartao"] .veu-cartao {
  max-width: min(34rem, 92vw);
  padding: var(--esp-5) var(--esp-5) var(--esp-4);
  background: var(--superficie);
  border: 1px solid var(--borda);
  border-radius: var(--raio-2);
  box-shadow: 0 8px 30px rgb(0 0 0 / .12);
}
[data-opcao="cartao"] .veu-cartao::before {
  width: 22px; height: 22px;
  border-width: 3px;
  border-color: var(--borda);
  border-top-color: var(--marca-texto);
  box-shadow: none;
}
[data-opcao="cartao"] .veu-etiqueta {
  padding: var(--esp-1) var(--esp-2);
  font-size: 11px; letter-spacing: .1em;
  background: var(--alerta-fundo);
  border: 1px solid var(--alerta); border-radius: var(--raio-1);
  color: var(--alerta);
  text-shadow: none;
}
[data-opcao="cartao"] .veu-texto {
  font: 400 .95rem/1.5 var(--ui);
  text-shadow: none;
}
[data-opcao="cartao"] .veu-nota { text-shadow: none; }

/* ---- 2 · SÓ O GIRO, SEM NADA ESCRITO -------------------------------------
   Sem cartão, sem etiqueta, sem frase. O anel cresce de 30 para 38 px e o halo alarga:
   sem ele, um anel de 3 px sobre uma listagem cheia de filetes desaparece — e é o halo
   que faz o giro ler-se sobre QUALQUER fundo, sem desenhar uma caixa. */
[data-opcao="giro"] .veu-cartao::before {
  width: 38px; height: 38px; border-width: 3px;
  border-color: color-mix(in srgb, var(--borda) 45%, transparent);
  border-top-color: var(--marca);
  box-shadow: 0 0 0 12px color-mix(in srgb, var(--fundo) 60%, transparent),
              0 0 26px 6px color-mix(in srgb, var(--fundo) 72%, transparent);
}
/* O TEXTO NÃO DESAPARECE PARA QUEM NÃO VÊ — sai da TELA, não da árvore. Com
   display:none, o leitor de ecrã perdia também o nome da operação, e ficava um
   giro mudo para quem ouve a página. A receita é a do «só para leitor» que a
   Produção já usa. */
[data-opcao="giro"] .veu-etiqueta,
[data-opcao="giro"] .veu-texto,
[data-opcao="giro"] .veu-nota {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
}

/* A NOTA DA PÁGINA — o que se está a comparar, com os olhos. */
.nota-do-veu {
  max-width: 60rem; margin: 0 0 24px; padding: 14px 18px;
  border: 1px solid var(--borda); border-left: 3px solid var(--marca);
  border-radius: var(--raio-1); background: var(--fundo-faixa);
  font-size: .92rem; line-height: 1.55; color: var(--texto);
}
.nota-do-veu h2 { margin: 0 0 6px; font-size: 1.02rem; }
.nota-do-veu p { margin: 0 0 6px; }
.nota-do-veu p:last-child { margin-bottom: 0; }
.nota-do-veu .fina { font-size: .85rem; color: var(--texto-suave); }

/* O INTERRUPTOR DA BANCADA. O véu tranca o que está por baixo — é o ofício dele —, e por isso a
   Produção que serve de fundo não se pode usar enquanto ele está de pé. Para se ver as DUAS coisas
   (com véu e sem véu) o painel ganha este botão: tira e volta a pôr. É a peça secundária do
   rodapé da bancada, e não uma peça nova do produto. */
.veu-interruptor {
  flex: 0 0 auto; cursor: pointer; min-height: 46px;
  background: var(--fundo); color: var(--marca-texto, #6b1f2e);
  border: 1px solid var(--borda); border-radius: 10px; padding: 10px 16px;
  font: 700 14px/1.2 var(--ui, system-ui);
}
.veu-interruptor:hover { border-color: var(--marca, #6b1f2e); }
.veu-interruptor[aria-pressed="true"] { background: var(--fundo-faixa, #f4f0e8); }
`;

const SCRIPT_VEU = `(function () {
  /* A OPERAÇÃO É PUBLICADA PELA API VERDADEIRA, e volta a ser publicada de vez em quando: cada
     publicação vale dois minutos (é a rede de segurança do módulo), e uma bancada que se fica a
     olhar não pode perder o véu a meio. */
  var FRASE = 'a derivar a Turma «ami» e a reencadear o plano de ensino e o plano de observação…';
  var ETIQUETA = 'Derivação';
  var alarme = null;
  var dePe = false;

  /* A NOTA DA OUTRA ABA NÃO SE APLICA AQUI. O véu do produto tem uma segunda linha — «a operação
     começou noutra aba desta escola» — que nesta página seria FALSA: a operação é desta aba, e é
     a própria bancada que a publica. Uma nota que mente sobre o que se está a ver é pior do que
     nota nenhuma, e ainda ia parar a quem ouve a página. */
  function calar() {
    var n = document.querySelector('#veu .veu-nota');
    if (n) n.remove();
  }

  /* A BANCADA NÃO SE TRANCA A SI MESMA — e este é o defeito que ela encontrou em 11/11/2026: «está
     sempre carregando infinitamente, eu não consigo ir para a opção um nem para a dois».
     O véu do produto põe \`inert\` em TODOS os filhos do \`body\`, e é assim que ele impede o
     professor de agir a meio de uma operação. Só que a bancada que compara as formas do véu é
     exactamente o que fica POR BAIXO dele: trancado o painel, os botões das opções não respondem
     ao rato nem ao teclado, e a página fica a girar sem se poder escolher nada.
     O que se liberta é o PAINEL. A Produção por baixo continua trancada — é ela que se está a
     julgar —, e o interruptor abaixo é que a devolve. */
  function desafogar() {
    ['bancada', 'bancada-aba'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.inert = false;
    });
  }

  function pintar() {
    var b = document.getElementById('veu-interruptor');
    if (!b) return;
    b.textContent = dePe ? 'Tirar o véu' : 'Pôr o véu';
    b.setAttribute('aria-pressed', String(dePe));
  }

  function publicar() {
    calar();
    dePe = true;
    if (window.LastroDaOperacao) window.LastroDaOperacao.ocupar(FRASE, ETIQUETA);
    desafogar();
    setTimeout(desafogar, 0);
    pintar();
  }

  function tirar() {
    dePe = false;
    if (window.LastroDaOperacao) window.LastroDaOperacao.liberar();
    desafogar();
    setTimeout(desafogar, 0);
    pintar();
  }

  function armar() {
    /* O INTERRUPTOR. Sem ele, a página por baixo do véu fica \`inert\` e não se pode conferir o que
       se está a esconder — comparar exige poder tirar e voltar a pôr. */
    var rodape = document.querySelector('#bancada .bancada-rodape');
    if (rodape && !document.getElementById('veu-interruptor')) {
      var b = document.createElement('button');
      b.type = 'button';
      b.id = 'veu-interruptor';
      b.className = 'veu-interruptor';
      b.addEventListener('click', function () { if (dePe) tirar(); else publicar(); });
      rodape.insertBefore(b, rodape.firstChild);
    }
    if (alarme) clearInterval(alarme);
    publicar();
    /* Renova enquanto se olha — mas NÃO com a aba escondida: uma bancada esquecida em segundo plano
       não fica a publicar uma operação que já ninguém está a ver. */
    alarme = setInterval(function () { if (!document.hidden && dePe) publicar(); }, 45000);
  }

  /* A BANCADA AVISA QUANDO TROCA DE OPÇÃO, e a frase é a mesma nas três: o que muda é o DESENHO,
     não o facto. Repetir a publicação serve para o véu não ter expirado enquanto se olha. */
  window.aoTrocarOpcao = function () { if (dePe) publicar(); };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', armar);
  } else {
    armar();
  }
})();`;

function proporVeu() {
  const { estilo, secoes } = secoesDaProducao();

  const corpo = `<header class="doc">
  <h1>A operação em curso</h1>
  <p class="subtitulo">Três formas do mesmo véu, sobre a Produção de verdade</p>
</header>
<main class="corpo-da-bancada">
  <div class="nota-do-veu">
    <h2>O que está a ser comparado</h2>
    <p>O véu de cima é <strong>o do produto</strong>: a peça da folha, construída pelo
    <code>nav.js</code> de verdade, com a operação publicada pela API de verdade. O que muda entre
    as três opções são <strong>umas linhas de declaração</strong> — escolhida uma, aplicá-la é
    movê-las para a folha.</p>
    <p>Por baixo está a <strong>Produção verdadeira</strong> — as secções «Salas» e «Turmas», com
    os dados de um fixture. Repare em duas coisas: <strong>reconhece-se onde se está?</strong> (é o
    formulário e a listagem de sempre) e <strong>percebe-se que algo corre?</strong></p>
    <p class="fina">A bancada está <strong>acima</strong> do véu (que é <code>z-index: 120</code>)
    — sem isso não se podia trocar de opção com o véu de pé. O painel <strong>não</strong> se
    tranca; a Produção por baixo sim, e é o <strong>Tirar o véu</strong> que a devolve. Escape
    fecha o painel; as teclas <strong>0</strong>, <strong>1</strong> e <strong>2</strong> trocam.</p>
  </div>
  ${secoes}
</main>`;

  return pagina({
    titulo: 'Proposta — as formas do véu da operação',
    opcaoInicial: 'hoje',
    /* A PÁGINA NÃO AVISA OUTRAS ABAS: `data-operacao="so-esta-aba"` põe o módulo do nav.js em modo
       privado. Uma bancada que publicasse a operação trancaria as abas de trabalho de quem a abre
       para a julgar. O atributo tem de estar na MARCAÇÃO porque o nav.js corre antes do
       `scriptExtra` — uma linha de JavaScript chegaria tarde. */
    atributosDoHtml: 'data-operacao="so-esta-aba"',
    corpo,
    cssExtra: estilo + CSS_VEU,
    scriptExtra: SCRIPT_VEU,
    opcoes: OPCOES_VEU,
    bancada: marcacaoDaBancada({
      sobre: 'Proposta · o véu da operação',
      titulo: 'As formas do véu',
      intro: 'A página por baixo é a Produção verdadeira. Escolha uma opção e feche este painel: '
        + 'o que se compara é <strong>reconhecer onde se está</strong> e <strong>saber que algo '
        + 'corre</strong>, com o menor peso possível na tela.',
      opcoes: OPCOES_VEU,
      inicio: 'hoje',
    }),
  });
}

// ==================================================================================== escrever

const arquivos = {
  'index.html': indice(),
  'proposta-titulo.html': proporTitulo(),
  'proposta-paginacao.html': proporPaginacao(),
  'proposta-navegacao.html': proporNavegacao(),
  'proposta-listagem.html': proporListagem(),
  'proposta-padrao-da-lista.html': proporPadraoDaLista(),
  'proposta-acervo.html': proporAcervo(),
  'proposta-estados.html': proporEstados(),
  'proposta-veu.html': proporVeu(),
  'proposta-verbetes.html': proporVerbetes(),
};

for (const [nome, texto] of Object.entries(arquivos)) {
  fs.writeFileSync(path.join(SAIDA, nome), texto, 'utf8');
  console.log(nome + ' — ' + Math.round(texto.length / 1024) + ' kB');
}
console.log('\nCSS do projeto embutido: ' + Math.round(CSS.length / 1024) + ' kB (tools/templates/ciclo.css)');
console.log('Sem dependências externas: as páginas abrem de `file://` e do Worker.');
