'use strict';

/**
 * lista-html.js — AS PÁGINAS DE LISTA, geradas na montagem (23/10/2026).
 *
 * PORQUE ISTO EXISTE. O menu deixou de enumerar documentos: passou a ter destinos (Ciclos,
 * Aulas, Planejamento, Área do Professor), e cada destino leva a uma página que lista o que
 * existe. Sem estas páginas, o menu novo não teria para onde apontar.
 *
 * PORQUE É UM MÓDULO DO NÚCLEO, E NÃO UM PEDAÇO DO `montar-publicacao.js`. Duas razões, e as
 * duas são de manutenção:
 *
 *   · a página é feita de PEÇAS do sistema (`.caixa`, `.selo`, `.acao`, `.trio`), e quem confere
 *     que elas existem é o `check-identidade`. Ele precisa de gerar a página para a medir — e não
 *     pode chamar `montar-publicacao.js`, que lê o disco inteiro e escreve em `publicacao/`;
 *   · o módulo não tem `fs`. Recebe os dados já lidos, e devolve uma string. É o que permite
 *     medi-lo com uma amostra pequena, como se faz com a ficha e com as páginas de estado.
 *
 * O QUE ELE **NÃO** FAZ. Não lê o disco, não decide o que existe (isso é da montagem), e não
 * desenha a barra (isso é do `nav.js`, que recebe o `nav` já pronto). A fronteira é a mesma do
 * resto do núcleo: quem sabe o que existe é quem tem `fs`; quem sabe desenhar é este.
 */

const esc = (t) => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * AS TRÊS CAIXINHAS DE UM PLANO — as mesmas da lista de turmas, com a matéria desta lista.
 *
 * `Turma · Professor · Cadeia`, e não `Ritmo · Régua · Conteúdos` (decidido em 23/10/2026). O
 * ritmo e a régua continuam a um toque, no cartão da turma, na Produção — aqui o que se quer
 * saber antes de abrir o plano é de quem ele é e em que ponto está.
 *
 * Cada caixa é um `<button class="trio-item">`: a CAIXA INTEIRA é o alvo, e o «?» é desenho
 * (`aria-hidden`). É a peça de `tools/templates/ciclo.css`, a mesma que a Produção usa.
 */
function trioDePlano(p, id) {
  const itens = [
    ['Turma', p.turmaCurta || p.turma, 'turma',
      `<p class="trio-nota">Turma do plano: <b>${esc(p.turma)}</b>.</p>`
      + `<p class="trio-nota">Modalidade e tradição são decididas na curadoria, com o professor.</p>`],
    ['Professor', p.professor || '—', 'professor',
      `<div class="trio-grade"><div><span class="trio-k">Professor curado</span>`
      + `<span class="trio-v">${esc(p.professor || '—')}</span></div>`
      + `<div><span class="trio-k">Turma</span><span class="trio-v">${esc(p.turma)}</span></div></div>`
      + `<p class="trio-nota">É a curadoria que liga professor e turma. Sem ela, este plano não existe.</p>`],
    ['Cadeia', p.po || '—', 'cadeia',
      `<div class="trio-grade">`
      + `<div><span class="trio-k">Ancorada em</span><span class="trio-v">${esc(p.ancorada || '—')}</span></div>`
      + `<div><span class="trio-k">Estado do PO</span><span class="trio-v">${esc(p.po || '—')}</span></div>`
      + `<div><span class="trio-k">Aulas previstas</span><span class="trio-v">${esc(p.aulas || '—')}</span></div>`
      + `<div><span class="trio-k">Elo</span><span class="trio-v">${esc((p.hash || '').slice(0, 12) || '—')}</span></div>`
      + `</div><p class="trio-nota">A cadeia acrescenta, não edita: um ajuste é um elo novo.</p>`],
  ];
  const caixas = itens.map(([rotulo, valor, qual, painel]) =>
    `        <button type="button" class="trio-item" data-balao="${qual}" aria-expanded="false"`
    + ` aria-controls="p-${qual}-${id}" aria-label="ver ${esc(rotulo.toLowerCase())} deste plano">`
    + `<span class="trio-k">${esc(rotulo)}</span>`
    + `<span class="trio-v">${esc(valor)}</span>`
    + `<span class="trio-q" aria-hidden="true">?</span></button>`).join('\n');
  const paineis = itens.map(([, , qual, painel]) =>
    `      <div class="trio-painel" data-painel="${qual}" id="p-${qual}-${id}" hidden>${painel}</div>`)
    .join('\n');
  return `      <div class="trio">\n${caixas}\n      </div>\n${paineis}`;
}

/**
 * UM CARTÃO DE PLANO — a linha do nome, o complemento, as ações e as três caixas.
 *
 * A linha de complemento diz o CICLO e o VOLUME, e não a turma nem o professor: esses dois estão
 * nas caixas, e repeti-los seria a mesma informação em dois sítios — e a primeira a envelhecer
 * seria a de baixo.
 */
function cartaoDoPlano(p, indice) {
  const id = String(indice + 1);
  const busca = [p.nome, p.turma, p.professor].join(' ').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const selo = p.po ? `<span class="selo ${p.poClasse || 'alerta'}">${esc(p.po)}</span>` : '';
  const acoes = [
    p.hrefPlano ? `<a class="acao pequena" href="${esc(p.hrefPlano)}">Abrir o plano</a>` : '',
    p.hrefReferencias ? `<a class="acao secundario pequena" href="${esc(p.hrefReferencias)}">Referências</a>` : '',
    p.hrefPdf ? `<a class="acao secundario pequena" href="${esc(p.hrefPdf)}">PDF do ciclo</a>` : '',
  ].filter(Boolean).join('');
  const complemento = [
    p.ciclo ? 'Ciclo ' + esc(p.ciclo) : '',
    p.aulas ? esc(p.aulas) + ' aulas previstas' : '',
  ].filter(Boolean).join(' · ');

  return `  <li class="trio-plano" data-busca="${esc(busca)}" data-prof="${esc(p.professor || '')}"`
    + ` data-turma="${esc(p.turma || '')}">
    <div class="trio-linha">
      <span class="trio-nome"><b>${esc(p.nome)}</b> ${selo}</span>
      <span class="trio-acoes">${acoes}</span>
    </div>
    ${complemento ? `<div class="trio-dono">${complemento}</div>` : ''}
${trioDePlano(p, id)}
  </li>`;
}

/** O filtro — todo no cliente, sobre a marcação já montada: nem rede, nem KV, nem cota do ar. */
function filtro(planos) {
  const professores = [...new Set(planos.map((p) => p.professor).filter(Boolean))].sort();
  const turmas = [...new Set(planos.map((p) => p.turma).filter(Boolean))].sort();
  const opcoes = (lista) => lista.map((v) => `<option>${esc(v)}</option>`).join('');
  return `<form class="filtro" onsubmit="return false">
  <div class="caixa filtrar">
    <div class="campo-filtro busca">
      <label class="campo-rotulo" for="f-busca">Procurar</label>
      <input id="f-busca" type="search" placeholder="plano, turma ou professor">
    </div>
    <div class="campo-filtro">
      <label class="campo-rotulo" for="f-prof">Professor</label>
      <select id="f-prof"><option value="">todos</option>${opcoes(professores)}</select>
    </div>
    <div class="campo-filtro">
      <label class="campo-rotulo" for="f-turma">Turma</label>
      <select id="f-turma"><option value="">todas</option>${opcoes(turmas)}</select>
    </div>
    <p class="filtro-conta" id="f-conta">${planos.length} ${planos.length === 1 ? 'plano' : 'planos'}</p>
  </div>
</form>`;
}

/**
 * A PÁGINA. `nav` entra pronto (o desenho é do `nav.js`); o resto é dado.
 *
 * Nenhum `<style>` aqui: a folha do sistema vem em `/assets/style.css`, e uma página que
 * redeclare o desenho das peças é exactamente o que a checagem «Forma» reprova.
 */
function paginaDeLista({ titulo, subtitulo, nav, planos = [], itens = null, vazio, aviso }) {
  const semNada = `<p class="aviso">${esc(vazio || 'Ainda não há nada para listar nesta escola.')}</p>`;
  // DUAS FORMAS DE LISTA, e a diferença é só o que se lista: planos (com as três caixas e o
  // filtro por professor e por turma) ou documentos de uma turma (referências, aulas, glossário),
  // que já vêm como marcação pronta. O FILTRO É DOS PLANOS: numa lista de referências ele não
  // teria por onde filtrar além da turma, e um filtro que só tem uma opção é ruído.
  const lista = itens
    ? (itens.length
      ? '<ul class="trio-lista">\n' + itens.map((i) => (typeof i === 'string' ? i : cartaoDeDocumento(i))).join('\n') + '\n</ul>'
      : semNada)
    : (planos.length
      ? filtro(planos) + '\n<ul class="trio-lista">\n' + planos.map(cartaoDoPlano).join('\n') + '\n</ul>'
      : semNada);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · Sistema Lastro</title>
<link rel="stylesheet" href="/assets/style.css">
<script>/* Anti-flash: aplica o modo ANTES de a página pintar. */
try{if(!document.documentElement.hasAttribute('data-modo-fonte')&&localStorage.getItem('ciclo-modo')==='noturna')document.documentElement.setAttribute('data-modo','noturna');}catch(e){}</script>
</head>
<body id="top">

${nav}
<div class="veu" aria-hidden="true"></div>

<header class="doc">
  <h1>${esc(titulo)}</h1>
  ${subtitulo ? `<p class="subtitulo">${esc(subtitulo)}</p>` : ''}
</header>

<main>
<div class="conteudo">
${aviso ? `<div class="aviso">${aviso}</div>` : ''}
${lista}
</div>
</main>

<a class="topo" href="#top" title="Voltar ao topo">&#8593;</a>

<script src="/assets/nav.js"></script>
<script>${SCRIPT_DA_LISTA}</script>

</body>
</html>
`;
}

/**
 * O FILTRO E AS CAIXAS, no cliente.
 *
 * Delegado no documento e ligado UMA vez: a página é estática (não há troca de opção aqui), mas
 * a delegação é a mesma disciplina das bancadas — e evita o defeito que lá apareceu, de ouvinte a
 * empilhar-se sobre ouvinte e a caixa a abrir e fechar no mesmo toque.
 */
const SCRIPT_DA_LISTA = `(function () {
  var busca = document.getElementById('f-busca');
  var prof = document.getElementById('f-prof');
  var turma = document.getElementById('f-turma');
  var conta = document.getElementById('f-conta');
  var itens = [].slice.call(document.querySelectorAll('li.trio-plano'));
  if (!busca || !conta) return;

  function aplicar() {
    var q = (busca.value || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
    var n = 0;
    itens.forEach(function (l) {
      var ok = (!q || l.getAttribute('data-busca').indexOf(q) !== -1)
        && (!prof.value || l.getAttribute('data-prof') === prof.value)
        && (!turma.value || l.getAttribute('data-turma') === turma.value);
      l.hidden = !ok;
      if (ok) n++;
    });
    conta.textContent = n + (n === 1 ? ' plano' : ' planos') + ' de ' + itens.length;
  }
  [busca, prof, turma].forEach(function (c) {
    c.addEventListener('input', aplicar);
    c.addEventListener('change', aplicar);
  });
  aplicar();

  /* UMA CAIXA ABERTA POR CARTÃO; fecha com o mesmo toque, com Escape ou tocando fora. */
  function fechar(outro) {
    [].slice.call(document.querySelectorAll('.trio-item[aria-expanded="true"]')).forEach(function (b) {
      if (b === outro) return;
      b.setAttribute('aria-expanded', 'false');
      var p = b.closest('li.trio-plano').querySelector('.trio-painel:not([hidden])');
      if (p) p.hidden = true;
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.trio-item');
    if (!b) { if (!e.target.closest('.trio-painel') && !e.target.closest('.filtro')) fechar(null); return; }
    var abrir = b.getAttribute('aria-expanded') !== 'true';
    fechar(b);
    var painel = b.closest('li.trio-plano').querySelector('[data-painel="' + b.getAttribute('data-balao') + '"]');
    if (painel) painel.hidden = !abrir;
    b.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(null); });
})();`;

/**
 * UM CARTÃO DE DOCUMENTO — para as listas que não são de planos (referências, aulas, glossário,
 * notação). Ele é MAIS SIMPLES de propósito: o que essas listas têm para dizer é o nome, a que
 * turma pertence, e as ações que levam ao documento. Três caixas num cartão de referências
 * seriam três caixas a repetir «é da turma Balé Nível 1».
 *
 * `acoes` é uma lista de `[rótulo, href, classe]` — e a classe é `''` para a ação principal.
 * Nenhum link é inventado aqui: quem não tem documento não recebe ação.
 */
function cartaoDeDocumento({ nome, turma, complemento, acoes }) {
  const busca = [nome, turma, complemento].filter(Boolean).join(' ').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const botoes = (acoes || []).filter(([, href]) => href)
    .map(([rotulo, href, classe]) =>
      `<a class="acao ${classe || ''} pequena" href="${esc(href)}">${esc(rotulo)}</a>`).join('');
  const dono = [turma, complemento].filter(Boolean).join(' · ');
  return `  <li class="trio-plano" data-busca="${esc(busca)}" data-turma="${esc(turma || '')}">
    <div class="trio-linha">
      <span class="trio-nome"><b>${esc(nome)}</b></span>
      <span class="trio-acoes">${botoes}</span>
    </div>
    ${dono ? `<div class="trio-dono">${dono}</div>` : ''}
  </li>`;
}

module.exports = {
  paginaDeLista, cartaoDoPlano, cartaoDeDocumento, trioDePlano, filtro, SCRIPT_DA_LISTA,
};
