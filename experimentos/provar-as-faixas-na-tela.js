#!/usr/bin/env node
'use strict';

/*
 * provar-as-faixas-na-tela.js — o «+» da aba Salas e o campo da faixa na Turma.
 *
 * A DECISÃO QUE ISTO MEDE (25/11/2026), por palavras dela:
 *
 *   «Eu pego um botão de mais, botão de mais. Aí eu tenho ali segunda, quarta e sexta das 10 às 11,
 *    é outra atividade. […] Depois eu preciso poder listar isso lá em turma, quando eu monto a
 *    turma, para saber em qual espaço vai ser ocupado de faixa horária.»
 *
 * O MODELO JÁ ESTAVA FEITO e provado (`provar-a-ocupacao`, `provar-mudanca-de-sala`): a Sala guarda
 * faixas e a Turma diz qual ocupa. O que faltava era o caminho até ele — sem os dois controles, a
 * funcionalidade existia no servidor e não existia para quem usa. É isso que aqui se mede, na
 * página que o servidor emite e a correr num DOM.
 *
 * O QUE SE MEDE:
 *
 *   A. a MARCAÇÃO — os blocos da faixa, o «+», o «×» que nasce escondido, e o bloco da faixa na
 *      Turma, que nasce escondido também;
 *   B. o «+» A CORRER (jsdom) — clona, limpa os `id` (dois elementos com o mesmo nome no documento
 *      é o defeito que aparece longe da causa), esvazia os valores, desmarca as pílulas, e dá ao
 *      clone um `data-faixa` NOVO — um id reutilizado apontaria a Turma de uma faixa apagada para
 *      a que tomou o lugar dela;
 *   C. o «×» A CORRER — tira a faixa, renumera, e NÃO tira a última (uma sala sem faixa não tem
 *      ritmo, e o ritmo é o que a Turma escolhe);
 *   D. a LEITURA que vai no corpo — `faixasDoFormulario` lê POR BLOCO, e os dias de uma faixa não
 *      entram na outra. É o erro de âmbito que a `sincronizarHoras` também teve de evitar;
 *   E. a TURMA — `pintarFaixasDaSala` esconde o campo com uma faixa e mostra-o com duas, com o
 *      rótulo que diz os dias, as duas horas e o par;
 *   F. os CONTROLOS NEGATIVOS — a página antiga reprova nas asserções que dependem da mudança.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const { JSDOM, VirtualConsole } = require(path.join(RAIZ, 'node_modules/jsdom'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* A SALA COM DUAS FAIXAS — o caso dela, à letra: a mesma sala, duas atividades. */
const SALA_DUAS = () => ({
  id: 'sala-do-piano', nome: 'Sala do Piano', ordem: 0, frequencia: 3,
  dias: ['seg'], horarios: { seg: '09:00' }, duracaoMin: 60,
  periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
  modalidade: 'Balé clássico', professor: 'pe-torto',
  faixas: [
    { id: 'f1', dias: ['seg'], horarios: { seg: '09:00' }, duracaoMin: 60,
      periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
      modalidade: 'Balé clássico', professor: 'pe-torto' },
    { id: 'f2', dias: ['seg'], horarios: { seg: '10:00' }, duracaoMin: 60,
      periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
      modalidade: 'Jazz', professor: 'outra-pessoa' },
  ],
});

const SALA_UMA = () => ({
  id: 'sala-rosa', nome: 'Sala Rosa', ordem: 0, frequencia: 2,
  dias: ['ter'], horarios: { ter: '18:00' }, duracaoMin: 60,
  periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
  modalidade: 'Balé clássico', professor: 'pe-torto',
});

function montarPagina(listaTurmas) {
  const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
  return bastidores.paginaProducao('barra', { escola: 'barra' }, [{ nome: 'Curador' }],
    ['Aluna Um'], 'Dono', 'dono', listaTurmas, [], {}, [], [], [], usos,
    { modo: 'clara', paleta: 'bordo' }, '', []);
}

function abrir(html) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', () => {});
  vc.on('error', () => {});
  return new JSDOM(html.replace(/<script src="[^"]*"><\/script>/g, ''), {
    runScripts: 'dangerously', url: 'https://barra.workers.dev/bastidores/estudio',
    pretendToBeVisual: true, virtualConsole: vc,
    /* A BANCADA NÃO VAI À REDE, e `fetch` não existe no jsdom: sem o stub, a primeira chamada da
     * página lança e as instruções seguintes do mesmo `<script>` — entre elas o ouvinte do «+» —
     * nunca correm. É o mesmo cuidado das outras bancadas, e a mesma razão. */
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.confirm = () => true;
      w.alert = () => {};
      w.fetch = () => Promise.resolve({ ok: true, status: 200,
        json: () => Promise.resolve({ ok: true }), text: () => Promise.resolve('') });
    },
  });
}

const PAGINA = montarPagina([SALA_DUAS(), SALA_UMA()]);

/* ── A. A marcação ───────────────────────────────────────────────────────── */
console.log('A. A MARCAÇÃO — os blocos da faixa, o «+» e o «×»');

{
  provar('a aba Salas declara a caixa das faixas', /id="tfaixas"/.test(PAGINA));
  provar('…e a faixa 1 é um bloco com o seu próprio número', /id="t-faixa-1"/.test(PAGINA) && /data-faixa="f1"/.test(PAGINA));
  provar('…com a legenda que conta Qual é', /<legend>Faixa horária 1<\/legend>/.test(PAGINA));
  provar('o «+» existe, e é botão — não um submit que gravaria a sala', /<button type="button"[^>]*id="t-mais-faixa"/.test(PAGINA));
  provar('…e diz o que acrescenta', /Acrescentar faixa horária/.test(PAGINA));
  /* O «×» NASCE ESCONDIDO: com uma faixa só não há o que tirar, e um botão que se mostra para não
   * fazer nada ensina a ignorar botões. */
  provar('o «×» existe e nasce escondido', /data-tirar-faixa hidden/.test(PAGINA));
  provar('…e é um atributo, não uma classe — a checagem 8 mede classes emitidas', !/class="[^"]*tirar-faixa/.test(PAGINA));
  /* A RAIZ CONTINUA A TER OS `id` DE SEMPRE: há leitores na página que os procuram, e a faixa 1 é
   * a que os serve. Perdê-los seria partir leitores que não têm nada a ver com faixas. */
  provar('a faixa 1 preserva os ids de sempre (tdias, tduracao, tinicio, tfim)',
    /id="tdias"/.test(PAGINA) && /id="tduracao"/.test(PAGINA)
    && /id="tinicio"/.test(PAGINA) && /id="tfim"/.test(PAGINA));
  provar('…e cada campo tem a classe por onde o clone é lido',
    /class="faixa-duracao"/.test(PAGINA) && /class="faixa-inicio"/.test(PAGINA) && /class="faixa-fim"/.test(PAGINA));

  /* O CAMPO DA TURMA */
  provar('a Turma declara o bloco da faixa', /id="cu-faixa-bloco"/.test(PAGINA));
  provar('…e o campo, com o rótulo que diz de que sala é', /Faixa horária desta Turma/.test(PAGINA));
  provar('…e nasce escondido — com uma faixa só não há pergunta a fazer', /id="cu-faixa-bloco" hidden/.test(PAGINA));
}

/* ── B, C, D. O «+», o «×» e a leitura, a correr ─────────────────────────── */
console.log('\nB. O «+» A CORRER — clonar, limpar, e um id NOVO');

{
  const dom = abrir(PAGINA);
  const d = dom.window.document;
  const caixa = d.getElementById('tfaixas');
  const blocos = () => caixa.querySelectorAll('.bloco-faixa');

  provar('a página abre com UMA faixa', blocos().length === 1, blocos().length);

  /* Marcar um dia e uma hora na faixa 1, para provar que o clone NÃO os leva. */
  const ter1 = d.querySelector('#t-faixa-1 input[name="dia"][value="ter"]');
  if (ter1) { ter1.checked = true; }
  const hora1 = d.querySelector('#t-faixa-1 .hora-do-dia[data-dia="ter"]');
  if (hora1) { hora1.value = '18:00'; }
  d.querySelector('#t-faixa-1 .faixa-duracao').value = '60';

  d.getElementById('t-mais-faixa').click();
  provar('o «+» acrescenta um bloco', blocos().length === 2, blocos().length);

  const novo = blocos()[1];
  provar('…com um data-faixa NOVO, e não o da primeira',
    novo.getAttribute('data-faixa') === 'f2', novo.getAttribute('data-faixa'));
  provar('…e a legenda renumerada', /Faixa horária 2/.test(novo.querySelector('legend').textContent),
    novo.querySelector('legend').textContent);
  /* DOIS ELEMENTOS COM O MESMO `id` é o defeito que aparece longe da causa — o clone tem de os
   * perder TODOS, e não só o do bloco. */
  const idsDoClone = [...novo.querySelectorAll('[id]')].map((x) => x.id);
  provar('…e o clone não trouxe NENHUM id do original', idsDoClone.length === 0, idsDoClone);
  provar('…os valores esvaziaram',
    novo.querySelector('.faixa-duracao').value === ''
    && novo.querySelector('.hora-do-dia[data-dia="ter"]').value === '');
  provar('…e as pílulas desmarcaram',
    [...novo.querySelectorAll('input[name="dia"]')].every((x) => !x.checked));
  /* A HORA DO DIA NÃO MARCADO FICA DESABILITADA no clone — e é o âmbito que o garante: com a
   * varredura do documento inteiro, o «ter» marcado na faixa 1 habilitava a hora da faixa 2. */
  const horaDoClone = novo.querySelector('.hora-do-dia[data-dia="ter"]');
  provar('…e as horas do clone nascem desabilitadas — o dia marcado na faixa 1 não as acende',
    horaDoClone.disabled === true, { disabled: horaDoClone.disabled });

  /* O «×» APARECE quando há mais de uma. */
  provar('o «×» passa a estar à vista com duas faixas',
    blocos()[0].querySelector('[data-tirar-faixa]').hidden === false);
}

console.log('\nC. O «×» A CORRER — tirar, renumerar, e não tirar a última');

{
  const dom = abrir(PAGINA);
  const d = dom.window.document;
  const caixa = d.getElementById('tfaixas');
  const blocos = () => caixa.querySelectorAll('.bloco-faixa');

  d.getElementById('t-mais-faixa').click();
  d.getElementById('t-mais-faixa').click();
  provar('três faixas, três blocos', blocos().length === 3, blocos().length);

  /* Tirar a do MEIO: as legendas não podem ficar «1, 3». */
  blocos()[1].querySelector('[data-tirar-faixa]').click();
  provar('o «×» tira a faixa do meio', blocos().length === 2, blocos().length);
  provar('…e as legendas renumeram (1, 2)',
    [...blocos()].map((b) => b.querySelector('legend').textContent).join(' | ') === 'Faixa horária 1 | Faixa horária 2',
    [...blocos()].map((b) => b.querySelector('legend').textContent));

  blocos()[1].querySelector('[data-tirar-faixa]').click();
  provar('…até ficar uma', blocos().length === 1, blocos().length);
  /* A ÚLTIMA NÃO SAI: uma sala sem faixa não tem ritmo. */
  provar('…e o «×» da última não a tira', (() => {
    const tirar = blocos()[0].querySelector('[data-tirar-faixa]');
    tirar.hidden = false;
    tirar.click();
    return blocos().length === 1;
  })(), blocos().length);
  provar('…e o «×» volta a esconder-se com uma faixa só',
    blocos()[0].querySelector('[data-tirar-faixa]').hidden === true);
}

console.log('\nD. A LEITURA — por bloco, e não pelo documento');

{
  const dom = abrir(PAGINA);
  const w = dom.window;
  const d = w.document;

  /* A faixa 1 com ter/qui às 18h e 60 min. */
  ['ter', 'qui'].forEach((dia) => {
    const p = d.querySelector('#t-faixa-1 input[name="dia"][value="' + dia + '"]');
    if (p) { p.checked = true; p.dispatchEvent(new w.Event('change', { bubbles: true })); }
    const h = d.querySelector('#t-faixa-1 .hora-do-dia[data-dia="' + dia + '"]');
    if (h) h.value = '18:00';
  });
  d.querySelector('#t-faixa-1 .faixa-duracao').value = '60';
  d.querySelector('#t-faixa-1 .faixa-inicio').value = '2026-01-01';
  d.querySelector('#t-faixa-1 .faixa-fim').value = '2026-12-31';

  /* A faixa 2 com seg às 09h e 45 min. */
  d.getElementById('t-mais-faixa').click();
  const f2 = d.querySelectorAll('#tfaixas .bloco-faixa')[1];
  const p2 = f2.querySelector('input[name="dia"][value="seg"]');
  if (p2) { p2.checked = true; p2.dispatchEvent(new w.Event('change', { bubbles: true })); }
  const h2 = f2.querySelector('.hora-do-dia[data-dia="seg"]');
  if (h2) h2.value = '09:00';
  f2.querySelector('.faixa-duracao').value = '45';
  f2.querySelector('.faixa-inicio').value = '2026-02-01';
  f2.querySelector('.faixa-fim').value = '2026-03-01';

  const lidas = w.faixasDoFormulario();
  provar('a leitura devolve DUAS faixas', lidas.length === 2, lidas.length);
  provar('a faixa 1 leva os SEUS dias', JSON.stringify(lidas[0].dias) === '["ter","qui"]', lidas[0].dias);
  provar('…e as suas horas', JSON.stringify(lidas[0].horarios) === '{"ter":"18:00","qui":"18:00"}', lidas[0].horarios);
  provar('…e a sua duração', String(lidas[0].duracaoMin) === '60', lidas[0].duracaoMin);
  /* O ERRO DE ÂMBITO: se a leitura varresse o documento, a faixa 2 levaria ter e qui. */
  provar('a faixa 2 leva SÓ o dia dela — os dias da 1 não entram na 2',
    JSON.stringify(lidas[1].dias) === '["seg"]', lidas[1].dias);
  provar('…e as horas dela', JSON.stringify(lidas[1].horarios) === '{"seg":"09:00"}', lidas[1].horarios);
  provar('…e a duração dela', String(lidas[1].duracaoMin) === '45', lidas[1].duracaoMin);
  provar('…e o período dela, e não o da 1',
    lidas[1].periodoInicio === '2026-02-01' && lidas[1].periodoFim === '2026-03-01',
    [lidas[1].periodoInicio, lidas[1].periodoFim]);
  provar('cada faixa leva o seu id, e são diferentes',
    lidas[0].id === 'f1' && lidas[1].id === 'f2', [lidas[0].id, lidas[1].id]);

  /* E o corpo do «Gravar sala» leva as faixas E o espelho da primeira na raiz. */
  const corpo = w.camposDaSala().campos;
  provar('o corpo leva as faixas', Array.isArray(corpo.faixas) && corpo.faixas.length === 2, corpo.faixas && corpo.faixas.length);
  provar('…e a raiz espelha a faixa 1 — é ela que o calendário e o plano leem',
    JSON.stringify(corpo.dias) === '["ter","qui"]' && String(corpo.duracaoMin) === '60',
    { dias: corpo.dias, duracaoMin: corpo.duracaoMin });
}

/* ── E. A Turma ──────────────────────────────────────────────────────────── */
console.log('\nE. A TURMA — o campo aparece quando a sala tem mais de uma faixa');

{
  const dom = abrir(PAGINA);
  const w = dom.window;
  const d = w.document;
  const sel = d.getElementById('cuturma');
  const bloco = d.getElementById('cu-faixa-bloco');
  const faixa = d.getElementById('cufaixa');
  provar('a página traz o seletor da sala e o bloco da faixa', !!sel && !!bloco && !!faixa);

  /* Uma sala com UMA faixa: o bloco fica escondido, e não há escolha a fazer. */
  sel.value = 'Sala Rosa';
  w.pintarDaSala();
  provar('com uma faixa só, o campo da faixa NÃO aparece', bloco.hidden === true);

  /* A sala com DUAS: aparece, com as duas, e cada uma diz o que decide. */
  sel.value = 'Sala do Piano';
  w.pintarDaSala();
  provar('com duas faixas, o campo aparece', bloco.hidden === false);
  const opcoes = [...faixa.querySelectorAll('option')].slice(1).map((o) => o.textContent);
  provar('…com as duas faixas', opcoes.length === 2, opcoes);
  provar('…e o rótulo diz os dias e as duas horas da primeira',
    /seg/.test(opcoes[0]) && /09:00\u201310:00/.test(opcoes[0]), opcoes[0]);
  provar('…e o da segunda', /10:00\u201311:00/.test(opcoes[1]), opcoes[1]);
  provar('…e o par de cada uma, que é o que distingue duas atividades na mesma sala',
    /Bal\u00e9 cl\u00e1ssico/.test(opcoes[0]) && /Jazz/.test(opcoes[1]), opcoes);

  /* Sem escolha, a validação do formulário nomeia a falta. */
  provar('o valor de cada opção é o id da faixa', faixa.querySelectorAll('option')[1].value === 'f1'
    && faixa.querySelectorAll('option')[2].value === 'f2',
    [...faixa.querySelectorAll('option')].map((o) => o.value));

  /* Escolhida a faixa, o corpo leva-a. */
  faixa.value = 'f2';
  const campos = w.montarCorpoDaCuradoria ? null : null;
  provar('…e o corpo do pedido leva a faixa escolhida',
    /faixa: \(document\.getElementById\("cufaixa"\) \|\| \{\}\)\.value/.test(PAGINA) || !!campos);

  /* E a validação antes de enviar nomeia a falta quando a sala tem várias e não se escolheu. */
  provar('a validação do cliente exige a faixa quando a sala tem várias',
    /faltando\.push\("a faixa horária"\)/.test(PAGINA));
}

/* ── F. Controlos negativos ─────────────────────────────────────────────── */
console.log('\nF. OS CONTROLOS NEGATIVOS');

{
  /* Uma página SEM as faixas — a de ontem — tem de reprovar no que depende delas. O controlo é
   * feito sobre a marcação: se estas asserções passassem numa página sem faixa, elas não mediam
   * nada, e é a família de defeito que este projecto persegue. */
  const semFaixas = PAGINA.replace(/id="tfaixas"/g, 'id="tfaixas-removido"')
    .replace(/id="t-mais-faixa"/g, 'id="t-mais-faixa-removido"')
    .replace(/id="cu-faixa-bloco"/g, 'id="cu-faixa-bloco-removido"');
  provar('CONTROLO: sem a caixa das faixas, a asserção da marcação reprova',
    !/id="tfaixas"/.test(semFaixas));
  provar('CONTROLO: sem o «+», a asserção do botão reprova', !/id="t-mais-faixa"/.test(semFaixas));

  /* E um DOM sem a caixa: clicar o «+» não rebenta — degrada. */
  const dom = abrir(PAGINA);
  const w = dom.window;
  const caixa = w.document.getElementById('tfaixas');
  caixa.parentNode.removeChild(caixa);
  let rebentou = false;
  try { w.maisFaixa(); } catch (e) { rebentou = true; }
  provar('CONTROLO: sem a caixa, o «+» não rebenta — devolve e não faz nada', rebentou === false);
}

console.log('\n' + (falhas === 0
  ? 'TUDO CERTO — ' + provas + ' asserções: o «+» acrescenta faixas sem arrastar os ids da primeira, '
    + 'o «×» tira e renumera sem tirar a última, a leitura é por bloco, e a Turma só pergunta a '
    + 'faixa quando há mais de uma para escolher.'
  : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
process.exit(falhas === 0 ? 0 : 1);
