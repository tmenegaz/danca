#!/usr/bin/env node
'use strict';

/*
 * provar-o-ciclo-das-faixas.js — o CAMINHO INTEIRO: o que a tela envia e o que a rota grava.
 *
 * O DEFEITO QUE ISTO NASCEU PARA MEDIR (25/11/2026), relatado por ela:
 *
 *   «Eu cliquei em derivar e acrescentei mais uma carga horária aqui, cliquei no sinal de mais para
 *    acrescentar a faixa horária e não deu certo, não persistiu.»
 *
 * As duas provas que já existiam mediam metades: `provar-as-faixas-na-tela` exercita o DOM e
 * `provar-mudanca-de-sala` exercita a rota com um corpo ESCRITO À MÃO. Nenhuma das duas mede o que
 * o formulário REALMENTE envia depois de abrir uma sala existente, clicar no «+» e preencher a
 * faixa nova — que é o gesto que falhou. É essa costura que aqui se mede, e é a costura que o
 * defeito atravessou.
 *
 * O QUE SE MEDE:
 *
 *   A. abrir em «Derivar» uma sala com DUAS faixas repõe as duas no formulário — e se as repusesse
 *      como uma só, a segunda perdia-se ao gravar;
 *   B. o «+» acrescenta uma faixa e o corpo que sai daí leva as três, com os dias e as horas de
 *      cada uma — sem os dias de uma a entrarem na outra;
 *   C. esse corpo, entregue à rota verdadeira, fica GRAVADO com as três;
 *   D. os controlos negativos.
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

const ESCOLA = 'barra';
const SENHA = 'prova';

/* A SALA QUE JÁ EXISTE COM DUAS FAIXAS — é sobre ela que se clica «Derivar». */
const SALA_DUAS = () => ({
  id: 'sala-do-piano', nome: 'Sala do Piano', ordem: 0, frequencia: 2, ativo: true,
  dias: ['seg'], horarios: { seg: '09:00' }, duracaoMin: 60,
  periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
  modalidade: 'Balé clássico', professor: 'pe-torto',
  faixas: [
    { id: 'f1', dias: ['seg'], horarios: { seg: '09:00' }, duracaoMin: 60,
      periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
      modalidade: 'Balé clássico', professor: 'pe-torto' },
    { id: 'f2', dias: ['seg'], horarios: { seg: '10:00' }, duracaoMin: 60,
      periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
      modalidade: 'Balé clássico', professor: 'pe-torto' },
  ],
});

function montarPagina(listaTurmas) {
  const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
  return bastidores.paginaProducao(ESCOLA, { escola: ESCOLA }, [{ nome: 'Curador' }],
    ['Aluna Um'], 'Dono', 'dono', listaTurmas, [], {}, [], [], [], usos,
    { modo: 'clara', paleta: 'bordo' }, '', []);
}

function abrir(html) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', () => {});
  vc.on('error', () => {});
  return new JSDOM(html.replace(/<script src="[^"]*"><\/script>/g, ''), {
    runScripts: 'dangerously', url: 'https://' + ESCOLA + '.workers.dev/bastidores/estudio',
    pretendToBeVisual: true, virtualConsole: vc,
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

async function principal() {
/* ── A. Abrir em «Derivar» repõe as faixas que lá estão ─────────────────── */
console.log('A. ABRIR EM «DERIVAR» — as duas faixas da sala voltam ao formulário');

const PAGINA = montarPagina([SALA_DUAS()]);

{
  const dom = abrir(PAGINA);
  const w = dom.window;
  const d = w.document;
  const blocos = () => d.querySelectorAll('#tfaixas .bloco-faixa');

  provar('a página nasce com uma faixa (é o cadastro de uma sala nova)', blocos().length === 1, blocos().length);

  /* O MESMO GESTO DELA: «Editar»/«Derivar» na sala que já tem duas faixas. */
  const botao = d.querySelector('[data-turma-ajustar]');
  provar('o cartão da sala oferece o «Derivar»', !!botao);
  if (botao) {
    botao.setAttribute('data-derivar', 'sim');
    botao.click();
  }

  provar('ao abrir a sala, o formulário repõe as DUAS faixas', blocos().length === 2, blocos().length);
  const lidas = w.faixasDoFormulario();
  provar('…e a primeira leva o ritmo da faixa 1 (seg 09:00)',
    JSON.stringify(lidas[0] && lidas[0].dias) === '["seg"]'
    && JSON.stringify(lidas[0] && lidas[0].horarios) === '{"seg":"09:00"}',
    lidas[0]);
  provar('…e a segunda leva o dela (seg 10:00), e NÃO o da primeira',
    JSON.stringify(lidas[1] && lidas[1].dias) === '["seg"]'
    && JSON.stringify(lidas[1] && lidas[1].horarios) === '{"seg":"10:00"}',
    lidas[1]);
  provar('…e cada uma conserva o seu id, para a Turma não perder a referência',
    lidas[0] && lidas[0].id === 'f1' && lidas[1] && lidas[1].id === 'f2',
    [lidas[0] && lidas[0].id, lidas[1] && lidas[1].id]);
}

/* ── B. O «+» depois de abrir, e o corpo que sai ────────────────────────── */
console.log('\nB. O «+» DEPOIS DE ABRIR — a terceira faixa, e os dias de cada uma');

let corpoDaTela = null;
{
  const dom = abrir(PAGINA);
  const w = dom.window;
  const d = w.document;

  const botao = d.querySelector('[data-turma-ajustar]');
  if (botao) { botao.setAttribute('data-derivar', 'sim'); botao.click(); }

  d.getElementById('t-mais-faixa').click();
  const blocos = d.querySelectorAll('#tfaixas .bloco-faixa');
  provar('o «+» dá a terceira faixa', blocos.length === 3, blocos.length);

  /* A faixa nova: quarta às 14h, 90 minutos. Um dia e uma hora DIFERENTES dos das outras, para o
   * erro de âmbito aparecer se existir. */
  const nova = blocos[2];
  const p = nova.querySelector('input[name="dia"][value="qua"]');
  if (p) { p.checked = true; p.dispatchEvent(new w.Event('change', { bubbles: true })); }
  const h = nova.querySelector('.hora-do-dia[data-dia="qua"]');
  if (h) h.value = '14:00';
  nova.querySelector('.faixa-duracao').value = '90';

  corpoDaTela = w.camposDaSala().campos;
  provar('o corpo que a tela envia leva TRÊS faixas',
    Array.isArray(corpoDaTela.faixas) && corpoDaTela.faixas.length === 3,
    corpoDaTela.faixas && corpoDaTela.faixas.length);
  provar('…a primeira com seg 09:00',
    JSON.stringify(corpoDaTela.faixas[0].horarios) === '{"seg":"09:00"}', corpoDaTela.faixas[0]);
  provar('…a segunda com seg 10:00, e sem o dia da terceira',
    JSON.stringify(corpoDaTela.faixas[1].horarios) === '{"seg":"10:00"}', corpoDaTela.faixas[1]);
  provar('…e a terceira com qua 14:00 e 90 minutos',
    JSON.stringify(corpoDaTela.faixas[2].horarios) === '{"qua":"14:00"}'
    && String(corpoDaTela.faixas[2].duracaoMin) === '90', corpoDaTela.faixas[2]);
  provar('…e a terceira tem um id próprio, que não é o de nenhuma das outras',
    corpoDaTela.faixas[2].id && corpoDaTela.faixas[2].id !== corpoDaTela.faixas[0].id
    && corpoDaTela.faixas[2].id !== corpoDaTela.faixas[1].id, corpoDaTela.faixas[2].id);
}

/* ── C. O corpo da tela, na rota verdadeira ─────────────────────────────── */
console.log('\nC. O CORPO DA TELA NA ROTA VERDADEIRA — grava as três?');

{
  const kv = new Map();
  kv.set('bastidores/' + ESCOLA + '/turmas', JSON.stringify([SALA_DUAS()]));
  kv.set('bastidores/' + ESCOLA + '/curadorias', JSON.stringify([]));
  /* O PAR DA SALA É CONFERIDO CONTRA OS PROFESSORES DA ESCOLA — a rota recusa um slug que não seja
   * de lá, e sem isto a prova media a recusa em vez da gravação. */
  /* A RÉGUA VIVE DENTRO DO REGISTO DO PROFESSOR (`rubrica: {nome, niveis}`), e não numa lista à
   * parte — ver `rubricaDeUmProfessor`. A rota exige-a, e sem ela a sala cairia na régua padrão e o
   * documento sairia medido contra uma escala que não é a de quem dá a aula. A prova não está a
   * medir isto: está a satisfazê-lo para poder medir as faixas. */
  kv.set('bastidores/' + ESCOLA + '/professores', JSON.stringify([
    { nome: 'Pe Torto', slug: 'pe-torto', modalidades: { 'bale-classico': ['RAD'] },
      rubrica: { nome: 'Régua do Pe', niveis: [{ nome: 'Iniciante' }, { nome: 'Avançado' }] } },
  ]));
  const store = {
    async get(c) { return kv.has(c) ? kv.get(c) : null; },
    async put(c, v) { kv.set(c, String(v)); },
    async delete(c) { kv.delete(c); },
    async list() { return { keys: [...kv.keys()].map((name) => ({ name })) }; },
  };
  const env = {
    PADD_KV: store, ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: SENHA, SENHA_PROFESSOR: 'outra',
    PROFESSOR_NOME: 'Dono', PROFESSOR_SLUG: 'dono', GITHUB_TOKEN: 'token-de-prova',
  };

  const pedido = Object.assign({}, corpoDaTela, {
    derivarDe: 'sala-do-piano', senhaDirecao: SENHA, motivo: 'acrescentar a faixa da tarde',
    modalidade: 'Balé clássico', professor: 'pe-torto',
  });
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('{}', { status: 404 });
  let resposta;
  try {
    resposta = await bastidores.fetch(new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev/api/bastidores/turma-derivar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pedido),
    }), env);
  } finally {
    globalThis.fetch = original;
  }
  const corpo = await resposta.json();

  provar('a derivação da sala é ACEITE', resposta.status === 201, { status: resposta.status, corpo });

  const gravadas = JSON.parse(kv.get('bastidores/' + ESCOLA + '/turmas'));
  const vigente = gravadas.find((t) => t && !t.substituidaPor && t.nome === 'Sala do Piano')
    || gravadas[gravadas.length - 1];
  provar('…e a sala gravada tem TRÊS faixas',
    Array.isArray(vigente.faixas) && vigente.faixas.length === 3,
    vigente.faixas && vigente.faixas.length);
  provar('…com os dias e as horas de cada uma, intactos',
    JSON.stringify((vigente.faixas[0] || {}).horarios) === '{"seg":"09:00"}'
    && JSON.stringify((vigente.faixas[1] || {}).horarios) === '{"seg":"10:00"}'
    && JSON.stringify((vigente.faixas[2] || {}).horarios) === '{"qua":"14:00"}',
    vigente.faixas && vigente.faixas.map((f) => f.horarios));
  provar('…e a raiz espelha a faixa 1, para o calendário e o plano continuarem a ler o ritmo',
    JSON.stringify(vigente.horarios) === '{"seg":"09:00"}' && String(vigente.duracaoMin) === '60',
    { horarios: vigente.horarios, duracaoMin: vigente.duracaoMin });
}

/* ── E. O PAR (modalidade, professor) POR FAIXA ─────────────────────────── */
console.log('\nE. O PAR POR FAIXA — docentes diferentes, ou o mesmo nas duas');

{
  /* A frase dela: «faz o «Associar» perguntar o par por faixa pois precisa de docentes diferentes
   * por faixa podendo até ser o mesmo». */
  const dom = abrir(PAGINA);
  const w = dom.window;
  const d = w.document;

  const botao = d.querySelector('[data-turma-ajustar]');
  if (botao) { botao.setAttribute('data-derivar', 'sim'); botao.click(); }
  w.atualizarTurmaEmFoco();

  const bloco = d.getElementById('vinc-outras-faixas');
  provar('com duas faixas, o passo «Associar» abre o bloco das outras', bloco && bloco.hidden === false,
    bloco && bloco.hidden);
  const linhas = d.querySelectorAll('[data-faixa-par]');
  provar('…com UMA linha — a faixa 2; a faixa 1 é o bloco de cima', linhas.length === 1, linhas.length);
  provar('…e a linha diz qual faixa é, com o ritmo dela',
    /Faixa 2/.test(linhas[0].textContent) && /seg/.test(linhas[0].textContent)
    && /10:00/.test(linhas[0].textContent), linhas[0].textContent);
  provar('…e traz modalidade e professor próprios',
    !!linhas[0].querySelector('[data-faixa-modalidade]')
    && !!linhas[0].querySelector('[data-faixa-professor]'));

  /* O corpo leva o par de cada faixa: a 1 do bloco de cima, a 2 da linha. */
  const selM = d.getElementById('vinc-modalidade');
  const selP = d.getElementById('vinc-professor');
  selM.innerHTML = '<option value="Balé clássico">Balé clássico</option>' +
    '<option value="Jazz">Jazz</option>';
  selM.value = 'Balé clássico';
  selP.innerHTML = '<option value="pe-torto">Pe Torto</option>';
  selP.value = 'pe-torto';
  /* A modalidade da faixa 2 é Jazz, e o professor dela é outra-pessoa. */
  const linha = linhas[0];
  const m2 = linha.querySelector('[data-faixa-modalidade]');
  m2.value = 'Jazz';
  const p2 = linha.querySelector('[data-faixa-professor]');
  p2.innerHTML = '<option value="outra-pessoa">Outra Pessoa</option>';
  p2.value = 'outra-pessoa';

  const corpo = w.camposDaSala().campos;
  provar('a leitura do ritmo ainda não traz o par — quem o põe é a composição do «Gravar sala»',
    Array.isArray(corpo.faixas) && corpo.faixas.length === 2 && corpo.faixas[1].professor === undefined,
    corpo.faixas[1]);

  /* E A COMPOSIÇÃO, exercitada à parte — é ela que junta o par ao ritmo. */
  const compostas = w.faixasComOPar(corpo.faixas, 'Balé clássico', 'pe-torto');
  provar('a composição põe na faixa 1 o par do bloco de cima',
    compostas[0].modalidade === 'Balé clássico' && compostas[0].professor === 'pe-torto', compostas[0]);
  provar('…e na faixa 2 o par da linha dela — docentes diferentes',
    compostas[1].modalidade === 'Jazz' && compostas[1].professor === 'outra-pessoa', compostas[1]);
  /* O MESMO DOCENTE NAS DUAS — a segunda metade da frase dela. */
  m2.value = '';
  p2.innerHTML = '<option value="">—</option>';
  const iguais = w.faixasComOPar(corpo.faixas, 'Balé clássico', 'pe-torto');
  provar('uma faixa sem par escolhido fica SEM par no corpo — o servidor herda o da raiz',
    iguais[1].professor === '' && iguais[1].modalidade === '', iguais[1]);
}

/* ── F. O PAR POR FAIXA NA ROTA ─────────────────────────────────────────── */
console.log('\nF. O PAR POR FAIXA NA ROTA — conferido um a um, e gravado');

{
  const kv = new Map();
  kv.set('bastidores/' + ESCOLA + '/turmas', JSON.stringify([SALA_DUAS()]));
  kv.set('bastidores/' + ESCOLA + '/curadorias', JSON.stringify([]));
  kv.set('bastidores/' + ESCOLA + '/professores', JSON.stringify([
    { nome: 'Pe Torto', slug: 'pe-torto', modalidades: { 'bale-classico': ['RAD'] },
      rubrica: { nome: 'Régua do Pe', niveis: [{ nome: 'Iniciante' }, { nome: 'Avançado' }] } },
    { nome: 'Outra Pessoa', slug: 'outra-pessoa', modalidades: { 'jazz': ['Jazz'] },
      rubrica: { nome: 'Régua da Outra', niveis: [{ nome: 'Iniciante' }, { nome: 'Avançado' }] } },
  ]));
  const store = {
    async get(c) { return kv.has(c) ? kv.get(c) : null; },
    async put(c, v) { kv.set(c, String(v)); },
    async delete(c) { kv.delete(c); },
    async list() { return { keys: [...kv.keys()].map((name) => ({ name })) }; },
  };
  const env = {
    PADD_KV: store, ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: SENHA, SENHA_PROFESSOR: 'outra',
    PROFESSOR_NOME: 'Dono', PROFESSOR_SLUG: 'dono', GITHUB_TOKEN: 'token-de-prova',
  };
  const pedir = async (caminho, corpo) => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response('{}', { status: 404 });
    try {
      const r = await bastidores.fetch(new Request(
        'https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
        }), env);
      return { status: r.status, json: await r.json().catch(() => null) };
    } finally { globalThis.fetch = original; }
  };

  const faixasComPar = [
    { id: 'f1', dias: ['seg'], horarios: { seg: '09:00' }, duracaoMin: 60,
      periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
      modalidade: 'Balé clássico', professor: 'pe-torto' },
    { id: 'f2', dias: ['seg'], horarios: { seg: '10:00' }, duracaoMin: 60,
      periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
      modalidade: 'Jazz', professor: 'outra-pessoa' },
  ];
  const r = await pedir('/api/bastidores/turma-professor', {
    turma: 'sala-do-piano', senhaDirecao: SENHA, concluir: true,
    modalidade: 'Balé clássico', professor: 'pe-torto', faixas: faixasComPar,
  });
  provar('a gravação do par por faixa é ACEITE', r.status === 200, { status: r.status, json: r.json });

  const gravadas = JSON.parse(kv.get('bastidores/' + ESCOLA + '/turmas'));
  const sala = gravadas.find((t) => t && t.nome === 'Sala do Piano');
  provar('…e cada faixa fica com o SEU professor',
    (sala.faixas[0] || {}).professor === 'pe-torto'
    && (sala.faixas[1] || {}).professor === 'outra-pessoa',
    (sala.faixas || []).map((f) => f.professor));
  provar('…e com a sua modalidade',
    (sala.faixas[0] || {}).modalidade === 'Balé clássico'
    && (sala.faixas[1] || {}).modalidade === 'Jazz',
    (sala.faixas || []).map((f) => f.modalidade));
  /* A RAIZ CONTINUA A SER O ESPELHO DA FAIXA 1, e isso é o que mantém as salas de uma faixa só a
   * funcionar sem saber que as outras existem. */
  provar('…e a raiz da sala continua a ser o par da faixa 1',
    sala.professor === 'pe-torto' && sala.modalidade === 'Balé clássico',
    { professor: sala.professor, modalidade: sala.modalidade });

  /* O MESMO DOCENTE NAS DUAS — a segunda metade da frase dela: «podendo até ser o mesmo». */
  const iguais = faixasComPar.map((f) => Object.assign({}, f, { modalidade: 'Balé clássico', professor: 'pe-torto' }));
  const r2 = await pedir('/api/bastidores/turma-professor', {
    turma: 'sala-do-piano', senhaDirecao: SENHA, concluir: true,
    modalidade: 'Balé clássico', professor: 'pe-torto', faixas: iguais,
  });
  provar('o MESMO professor nas duas faixas também é aceite', r2.status === 200, r2.status);

  /* E UMA FAIXA COM UM PROFESSOR QUE A ESCOLA NÃO TEM RECUSA A GRAVAÇÃO INTEIRA. */
  const comIntruso = faixasComPar.map((f, i) => (i === 1
    ? Object.assign({}, f, { modalidade: 'Jazz', professor: 'nao-existe' }) : f));
  const r3 = await pedir('/api/bastidores/turma-professor', {
    turma: 'sala-do-piano', senhaDirecao: SENHA, concluir: true,
    modalidade: 'Balé clássico', professor: 'pe-torto', faixas: comIntruso,
  });
  provar('…e um professor que a escola não tem recusa a gravação inteira', r3.status === 400, r3.status);
  provar('…e a recusa diz QUAL faixa falhou', /Na faixa 2/.test(String((r3.json || {}).erro || '')),
    (r3.json || {}).erro);
}

/* ── D. Controlos negativos ─────────────────────────────────────────────── */
console.log('\nD. OS CONTROLOS NEGATIVOS');

{
  provar('CONTROLO: a página de ontem não tinha `data-turma-ajustar` ligado a faixas',
    /data-turma-ajustar/.test(PAGINA));
  /* Sem o `faixasDoFormulario`, o corpo da tela traria só a raiz — e a segunda faixa perdia-se. */
  provar('CONTROLO: o corpo traz `faixas`, e não só a raiz — é isso que impede a perda',
    Array.isArray(corpoDaTela.faixas) && corpoDaTela.faixas.length > 1);
}

console.log('\n' + (falhas === 0
  ? 'TUDO CERTO — ' + provas + ' asserções: abrir em «Derivar» repõe as faixas que lá estão, o «+» '
    + 'acrescenta a nova sem misturar os dias, e o corpo que a tela envia é gravado pela rota com '
    + 'as faixas todas.'
  : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
process.exit(falhas === 0 ? 0 : 1);

}

principal().catch((e) => { console.error(e); process.exit(1); });
