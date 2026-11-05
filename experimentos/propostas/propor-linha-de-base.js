#!/usr/bin/env node
'use strict';

/**
 * propor-linha-de-base.js — A PROPOSTA DA LISTAGEM DA LINHA DE BASE (05/11/2026).
 *
 * PORQUE EXISTE. A pesquisadora, duas vezes no mesmo dia: «você não seguiu o padrão visual […] as
 * listagens são iguais»; e depois, com o exemplo à frente: «olhe lá na anamnese, a aluna A. Nós
 * temos o nome, tem uma etiqueta, aí tem dois botões e aí tem três blocos que eu expando ou
 * colapso. […] me mostra lá no experimento a proposta da listagem […] que daí eu já vejo como é
 * que ela fica no celular e como é que fica no caso da tela de desktop.»
 *
 * O QUE ELE NÃO FAZ, E É O PONTO. Não redesenha a listagem: LÊ o cartão que a Produção emite. A
 * página dos Bastidores é montada pelo próprio servidor, carregada em jsdom com um `fetch` de
 * mentira, e a lista é o `innerHTML` de `#lb-lista` DEPOIS de `pintarLinhas()` correr. Uma
 * proposta que redescrevesse o desenho à mão poderia aprovar-se a si mesma: mostraria bonito e a
 * produção continuaria de outra forma. Aqui, o que se mostra é o que saiu.
 *
 * AS DUAS LARGURAS SÃO IFRAMES, e não duas `<div>` de larguras diferentes dentro da mesma página.
 * As regras de telemóvel do `ciclo.css` são `@media (max-width)`, que respondem à JANELA e não ao
 * contentor: numa `<div>` de 390px dentro de um ecrã de 1280px, as regras de telemóvel não
 * disparavam e a proposta mentiria sobre o telemóvel — que é precisamente o que ela vai ver.
 *
 *   node experimentos/propostas/propor-linha-de-base.js
 *   (o resultado é servido em /propostas/ pelo deploy das escolas)
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
const SAIDA = __dirname;

const CSS_DA_FOLHA = fs.readFileSync(path.join(RAIZ, 'tools', 'templates', 'ciclo.css'), 'utf8');

/** A página da Produção, montada pelo servidor — a mesma que as provas usam. */
function paginaDaProducao() {
  const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
  const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
  return bastidores.paginaProducao('calango', { nome: 'Calango', modalidade: 'bale-classico' },
    [], ['Ana', 'Bia', 'Carla', 'Dora'], 'Dono', 'dono', [], [], {}, [], [], [], usos,
    { modo: 'clara', paleta: 'bordo' }, '');
}

/** O `<style>` da própria página — é ele que veste `.lista` e o cartão no gabinete. */
function estiloDaPagina(pagina) {
  const achado = /<style>([\s\S]*?)<\/style>/.exec(pagina);
  return achado ? achado[1] : '';
}

/**
 * O HANDLER DO PAINEL, TIRADO DA PÁGINA (05/11/2026).
 *
 * As caixas do cartão abrem com o `document.addEventListener("click")` que a Produção já tem —
 * e uma proposta em que elas NÃO abrem não mostra metade do que se está a decidir (foi a
 * primeira versão: quatro caixas de 48px e nenhuma que abrisse, porque o `<script>` da página não
 * estava no documento). Copiar o handler à mão seria a segunda declaração da mesma regra.
 *
 * Extrai-se do TEXTO RENDERIZADO, entre dois marcadores estáveis, e injeta-se. Se a página mudar
 * o handler, a proposta muda com ela — e se ele desaparecer, a proposta perde o clique e diz-se
 * no console, em vez de fingir que abre.
 */
function scriptDoPainel(pagina) {
  const inicio = pagina.indexOf('function fecharPaineis');
  const fim = pagina.indexOf('if (e.key === "Escape") fecharPaineis(null); });');
  if (inicio === -1 || fim === -1) return '';
  return pagina.slice(inicio, fim + 'if (e.key === "Escape") fecharPaineis(null); });'.length);
}

/**
 * AS LINHAS DE BASE DA PROPOSTA — três, e cada uma num estado diferente do percurso.
 *
 * Não são linhas inventadas para o desenho parecer completo: são os três estados que a lista tem
 * de saber mostrar. Uma proposta que só mostrasse a linha pronta esconderia exactamente os dois
 * casos em que o professor precisa de saber o que fazer.
 */
const LINHAS = [
  {
    id: 'nivel-1-mobilidade-e-pes', nome: 'Nível 1 — mobilidade e pés',
    professor: 'rabo-gramde', turma: 'Balé Nível 1',
    enviada_em: '2026-11-05T10:00:00Z',
    atualizada_em: '2026-11-05T10:00:00Z',
    alunas: ['Ana', 'Bia', 'Carla'],
    campos: [
      { id: 'formato-anatomico-dos-joelhos', nome: 'Formato anatômico dos joelhos' },
      { id: 'arquitetura-do-arco-plantar', nome: 'Arquitetura do arco plantar' },
      { id: 'flexibilidade-dos-isquiotibiais', nome: 'Flexibilidade dos isquiotibiais' },
      { id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal' },
    ],
  },
  {
    id: 'nivel-1-allegro', nome: 'Nível 1 — allegro e impulsão',
    professor: 'rabo-gramde', turma: '',
    atualizada_em: '2026-11-05T11:00:00Z',
    alunas: ['Ana', 'Dora'],
    campos: [
      { id: 'impulsao-e-absorcao-allegro', nome: 'Impulsão e absorção (allegro)' },
      { id: 'mobilidade-de-quadril-pelve', nome: 'Mobilidade de quadril e pelve' },
    ],
  },
  {
    id: 'teste', nome: 'teste',
    professor: 'rabo-gramde', turma: '',
    atualizada_em: '2026-11-05T12:00:00Z',
    alunas: [],
    campos: [],
  },
];

/** A lista como a Produção a desenha — em jsdom, com o `fetch` de mentira. */
async function listaDaProducao(pagina) {
  let JSDOM, VirtualConsole;
  ({ JSDOM, VirtualConsole } = require('jsdom'));
  const vc = new VirtualConsole();
  vc.on('jsdomError', () => {});
  vc.on('error', () => {});
  const dom = new JSDOM(pagina.replace(/<script src="[^"]*"><\/script>/g, ''), {
    runScripts: 'dangerously', url: 'https://calango.workers.dev/bastidores/producao',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.confirm = () => true;
      w.alert = () => {};
      w.fetch = () => Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve({ ok: true, linhas: [], divergentes: [], campos: [], grupos: [], alunas: [] }),
        text: () => Promise.resolve(''),
      });
    },
  });
  const win = dom.window;
  await new Promise((r) => win.setTimeout(r, 200));
  win.LINHAS_DE_BASE = LINHAS;
  win.pintarLinhas();
  const html = win.document.getElementById('lb-lista').innerHTML;
  dom.window.close();
  return html;
}

/**
 * A FOLHA DA PROPOSTA — uma página inteira, com a folha da casa e o bloco de estilos da Produção.
 *
 * O QUE ENTRA E O QUE NÃO ENTRA. Entra o `ciclo.css` (as peças) e o `<style>` da própria página
 * (o que veste `.lista` no gabinete). Não entra a barra de navegação: ela não faz parte da
 * pergunta — a pergunta é a listagem —, e uma barra a ocupar 60px numa janela de 390px tiraria
 * espaço ao que se está a avaliar.
 */
function documentoDaLista(lista, { largura, rotulo, nota, estilo, script }) {
  return [
    '<!doctype html>',
    '<html lang="pt-BR" data-modo="clara" data-paleta="bordo" data-modo-fonte="escola">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + rotulo + '</title>',
    '<style>' + CSS_DA_FOLHA + '</style>',
    '<style>' + estilo + '</style>',
    '<style>',
    '  body { margin: 0; background: var(--cream, #fbf8f3); }',
    '  .palco { padding: 1rem; max-width: ' + largura + 'px; }',
    '  .palco > h2 { font: 700 .95rem/1.3 var(--ui, system-ui); color: var(--texto-suave, #5a5348);',
    '    margin: 0 0 .75rem; }',
    '  .palco > p { font: .85rem/1.5 var(--ui, system-ui); color: var(--texto-suave, #5a5348);',
    '    margin: 0 0 1rem; }',
    '</style>',
    '</head>',
    '<body>',
    '<div class="palco">',
    '<h2>' + rotulo + '</h2>',
    '<p>' + nota + '</p>',
    /* SEM `.col-lista` (05/11/2026). Na Produção essa coluna é METADE da grade, ao lado do
     * formulário; aqui não há formulário, e mantê-la deixava três caixas de 110px numa janela de
     * 1240px — a proposta diria que o desenho é apertado quando o que estava apertado era o palco.
     * A comparação que interessa é com a LISTA DA ANAMNESE, que ocupa a página inteira. */
    '<div class="lista-palco">',
    '<h3>Linhas de base</h3>',
    '<div class="rolagem"><ul class="lb-cartoes" id="lb-lista">' + lista + '</ul></div>',
    '</div>',
    script ? '<script>' + script + '</script>' : '',
    '</div>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/** A PÁGINA QUE SE ABRE — as duas larguras lado a lado, cada uma na sua janela. */
function paginaDaProposta() {
  const lado = (ficheiro, classe, rotulo, largura, nota) => [
    '<figure class="postura ' + classe + '">',
    '<figcaption><b>' + rotulo + '</b><span>' + largura + '</span></figcaption>',
    '<p>' + nota + '</p>',
    '<div class="moldura"><iframe src="' + ficheiro + '" title="' + rotulo + '"></iframe></div>',
    '</figure>',
  ].join('\n');
  return [
    '<!doctype html>',
    '<html lang="pt-BR" data-modo="clara" data-paleta="bordo">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Proposta — a listagem da linha de base</title>',
    '<style>' + CSS_DA_FOLHA + '</style>',
    '<style>',
    '  body { margin: 0; background: var(--cream, #fbf8f3); color: var(--tinta, #1f1c1a); }',
    '  main { max-width: 1560px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }',
    '  h1 { font: 700 1.5rem/1.25 var(--serif, Georgia, serif); color: var(--burgundy, #6b1f2e);',
    '    margin: 0 0 .4rem; }',
    '  .abre { font: .95rem/1.6 var(--serif, Georgia, serif); color: var(--texto-suave, #5a5348);',
    '    max-width: 70ch; margin: 0 0 1.75rem; }',
    '  .posturas { display: flex; flex-wrap: wrap; gap: 2rem; align-items: flex-start; }',
    '  .postura { margin: 0; flex: 0 0 auto; }',
    '  .postura figcaption { display: flex; align-items: baseline; gap: .5rem;',
    '    font: 700 .95rem/1.3 var(--ui, system-ui); color: var(--burgundy, #6b1f2e); }',
    '  .postura figcaption span { font-weight: 400; color: var(--texto-suave, #5a5348); }',
    '  .postura > p { font: .85rem/1.5 var(--ui, system-ui); color: var(--texto-suave, #5a5348);',
    '    max-width: 44ch; margin: .25rem 0 .75rem; }',
    /* A MOLDURA É O PALCO DA PROPOSTA — e é a única coisa desenhada aqui. Uma janela com medida
       fixa é o que faz o `@media` responder ao que se está a ver; sem ela, as duas colunas
       mostrariam o mesmo. Não é peça do sistema, e por isso vive no `<style>` desta página. */
    '  .moldura { border: 1px solid var(--gold-borda, #a08a58); border-radius: 10px;',
    '    overflow: hidden; background: #fff; box-shadow: 0 8px 24px rgba(31,28,26,.10); }',
    '  .moldura iframe { display: block; border: 0; background: #fff; }',
    '  .postura.celular .moldura { width: 390px; }',
    '  .postura.celular iframe { width: 390px; height: 840px; }',
    '  .postura.desktop .moldura { width: 1240px; max-width: 100%; }',
    '  .postura.desktop iframe { width: 1240px; height: 840px; }',
    '  @media (max-width: 820px) {',
    '    .postura.desktop { display: none; }',
    '    .postura.celular .moldura, .postura.celular iframe { width: 100%; max-width: 390px; }',
    '  }',
    '</style>',
    '</head>',
    '<body>',
    '<main>',
    '<h1>Proposta — a listagem da linha de base</h1>',
    '<p class="abre">A lista deixou de ser uma linha de texto e passou a ser o <b>cartão da '
    + 'casa</b>, o mesmo da Anamnese, do Plano de ensino e do Verbete: o nome em negrito com o '
    + 'selo ao lado, os botões à direita, uma linha de factos abaixo do nome, e três caixas que '
    + 'abrem o detalhe. O que se vê aqui é o que a Produção emite — a página foi montada pelo '
    + 'servidor, e a lista foi lida do DOM depois de desenhada.</p>',
    '<div class="posturas">',
    lado('proposta-linha-de-base-celular.html', 'celular', 'Celular', '390 × 840',
      'Os três blocos caem numa fila; o nome e os botões continuam na mesma linha, e a linha de '
      + 'factos desce. Abaixo de 360px as caixas passam a uma coluna.'),
    lado('proposta-linha-de-base-desktop.html', 'desktop', 'Desktop', '1240 × 840',
      'As três caixas ficam em três colunas. O nome ocupa o que sobra da linha, e os botões '
      + 'encostam à direita — a mesma regra do cartão da turma.'),
    '</div>',
    '</main>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

(async () => {
  const pagina = paginaDaProducao();
  const estilo = estiloDaPagina(pagina);
  const lista = await listaDaProducao(pagina);
  const script = scriptDoPainel(pagina);
  if (!script) console.error('propor-linha-de-base: o handler do painel não foi encontrado na '
    + 'página — as caixas não vão abrir na proposta.');

  fs.writeFileSync(path.join(SAIDA, 'proposta-linha-de-base-celular.html'),
    documentoDaLista(lista, {
      largura: 390,
      rotulo: 'Celular — 390 px',
      nota: 'A mesma lista na largura de um telefone. Toque numa caixa para abrir o detalhe.',
      estilo, script,
    }));
  fs.writeFileSync(path.join(SAIDA, 'proposta-linha-de-base-desktop.html'),
    documentoDaLista(lista, {
      largura: 1240,
      rotulo: 'Desktop — 1240 px',
      nota: 'A mesma lista numa janela de computador. Clique numa caixa para abrir o detalhe.',
      estilo, script,
    }));
  fs.writeFileSync(path.join(SAIDA, 'proposta-linha-de-base.html'), paginaDaProposta());

  console.log('propor-linha-de-base: 3 páginas escritas em experimentos/propostas/');
  console.log('  proposta-linha-de-base.html            (as duas larguras)');
  console.log('  proposta-linha-de-base-celular.html    (390 px)');
  console.log('  proposta-linha-de-base-desktop.html    (1240 px)');
})().catch((erro) => {
  console.error('propor-linha-de-base: ' + erro.message);
  process.exit(1);
});
