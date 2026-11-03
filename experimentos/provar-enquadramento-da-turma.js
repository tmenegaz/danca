#!/usr/bin/env node
'use strict';

/**
 * provar-enquadramento-da-turma.js — A TURMA É O RITMO, A CURADORIA É O ENSINO (03/11/2026).
 *
 * A DECISÃO DELA, e ela REVÊ uma do mesmo dia: o nível, a modalidade, a tradição e o professor
 * tinham sido postos na TURMA (entrega de 03/11, manhã). À tarde ela reviu: «a turma deixa de ser
 * carregada com definições rígidas de nível pedagógico»; o cadastro dela fica «estritamente no que
 * lhe é inerente (dias, horários e rotina)», e o enquadramento passa a ser da **curadoria**, para
 * a escola poder «transitar turmas entre modalidades e níveis» sem destruir a estrutura
 * operacional.
 *
 * AS TRÊS LEITURAS QUE FICARIAM AMBÍGUAS, e é o que esta prova fixa:
 *
 *   1. **Qual é o enquadramento de uma turma?** A curadoria que a referencia. Sem nenhuma, não há
 *      — e não se inventa.
 *   2. **Qual é o nível efetivo?** O da curadoria; sem ele, o texto antigo que ficou na turma, com
 *      a origem dita. **A memória não se apaga** (P-03/P-04).
 *   3. **Que turmas ficaram sem quem as ensine?** Lidas pelo enquadramento. Era por
 *      `t.modalidade`/`t.professor` — campos que o cadastro novo já não tem — e passaria a
 *      responder «nenhuma» em silêncio: o pior modo de falha, e a razão de existir o núcleo
 *      `motor/nucleo/enquadramento.js`.
 *
 * O QUE SE MEDE, e em que camada:
 *
 *   §A o núcleo — as três leituras, sem IO.
 *   §B a turma NÃO guarda o enquadramento: a rota grava o registo e mede-se o que ficou escrito.
 *   §C a memória — a turma antiga que tem `nivelReferencia` conserva-o ao ser editada, e o nível
 *      efetivo mostra-o dizendo de onde veio.
 *   §D a curadoria — o nível grava-se, o rótulo é COMPOSTO pela tradição, e a derivação herda-o.
 *   §E a tela — os campos saíram de um formulário e entraram no outro.
 *
 *   node experimentos/provar-enquadramento-da-turma.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const enq = require(path.join(RAIZ, 'motor/nucleo/enquadramento.js'));
const niveis = require(path.join(RAIZ, 'motor/nucleo/niveis.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

function criarKv(inicial) {
  const mapa = new Map(Object.entries(inicial || {}));
  return {
    mapa,
    async get(k) { return mapa.has(k) ? mapa.get(k) : null; },
    async put(k, v) { mapa.set(k, String(v)); },
    async delete(k) { mapa.delete(k); },
    async list() { return { keys: [...mapa.keys()].map((name) => ({ name })) }; },
  };
}

const lerJson = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));

// =====================================================================================
// A. O NÚCLEO — as três leituras
// =====================================================================================
function oNucleo() {
  console.log('\nA. O NÚCLEO — qual é o enquadramento, qual é o nível, e quem ficou sem ensinar');

  const turmas = [
    { id: 'bale-1', nome: 'Balé Nível 1', nivelReferencia: 'Grade 3' },
    { id: 'jazz-1', nome: 'Jazz 1' },
    { id: 'antiga', nome: 'Turma sem curadoria', nivelReferencia: 'Vaganova 4' },
  ];
  const curs = [
    { id: 'c-bale', professor: 'braco', modalidade: 'bale-classico', tradicao: 'RAD',
      turmas: ['Balé Nível 1'], grau: '', nivel: '3', nivelReferencia: 'Grade 3' },
    { id: 'c-jazz', professor: 'braco', modalidade: 'jazz', tradicao: 'Vaganova',
      turmas: ['Jazz 1'], grau: 'Intermediário', nivel: '2', nivelReferencia: 'Intermediário 2' },
  ];

  // 1) QUAL É O ENQUADRAMENTO
  const eBale = enq.enquadramentoDaTurma(turmas[0], curs);
  checar('a turma encontra a curadoria que a enquadra, pelo NOME',
    eBale.curadoria && eBale.curadoria.id === 'c-bale', eBale.curadoria && eBale.curadoria.id);
  checar('…e o enquadramento diz a modalidade, a tradição e o professor',
    eBale.modalidade === 'bale-classico' && eBale.tradicao === 'RAD' && eBale.professor === 'braco',
    eBale);
  checar('…com a origem declarada (`curadoria`)', eBale.de === 'curadoria', eBale.de);
  const eAntiga = enq.enquadramentoDaTurma(turmas[2], curs);
  checar('uma turma sem curadoria NÃO inventa enquadramento',
    eAntiga.curadoria === null && eAntiga.modalidade === '', eAntiga);

  /* A CURADORIA SUBSTITUÍDA NÃO ENQUADRA — mas é o recurso quando é a única que existe. O
   * enquadramento de hoje é o da que vale; e dizer «não há» quando só há uma substituída seria
   * perder a informação por causa de uma derivação. */
  const comSubstituida = [
    { id: 'velha', professor: 'braco', modalidade: 'jazz', turmas: ['Jazz 1'], substituidaPor: 'nova' },
    { id: 'nova', professor: 'braco', modalidade: 'jazz', turmas: ['Jazz 1'], grau: 'Avançado', nivel: '1' },
  ];
  checar('com duas versões, a VIGENTE é a que enquadra',
    enq.curadoriaDaTurma(comSubstituida, 'Jazz 1').id === 'nova',
    enq.curadoriaDaTurma(comSubstituida, 'Jazz 1').id);
  checar('…e, havendo só a substituída, ela é a resposta (não se perde a informação)',
    enq.curadoriaDaTurma([comSubstituida[0]], 'Jazz 1').id === 'velha');

  // 2) QUAL É O NÍVEL EFETIVO
  const nivelBale = enq.nivelEfetivo(turmas[0], curs[0]);
  checar('o nível efetivo é o da CURADORIA, quando ela o declara',
    nivelBale.rotulo === 'Grade 3' && nivelBale.de === 'curadoria', nivelBale);
  const nivelJazz = enq.nivelEfetivo(turmas[1], curs[1]);
  checar('…e o rótulo é o composto pela tradição («Intermediário 2»)',
    nivelJazz.rotulo === 'Intermediário 2', nivelJazz);
  const nivelAntigo = enq.nivelEfetivo(turmas[2], null);
  checar('sem curadoria, o nível cai no que a TURMA guardou — com a origem dita',
    nivelAntigo.rotulo === 'Vaganova 4' && nivelAntigo.de === 'turma', nivelAntigo);
  checar('sem curadoria e sem memória, não há nível — e a origem diz isso',
    enq.nivelEfetivo({ id: 'x', nome: 'x' }, null).de === 'nenhum');
  /* O CONTROL NEGATIVO DA ORDEM: a curadoria vence a memória. Se fosse o contrário, a escola
   * mudava o nível na curadoria e continuava a ver o velho. */
  checar('a curadoria VENCE a memória da turma (e não o contrário)',
    enq.nivelEfetivo({ nivelReferencia: 'Grade 1' },
      { grau: '', nivel: '5', nivelReferencia: 'Grade 5' }).rotulo === 'Grade 5');

  // 3) QUEM FICOU SEM QUEM ENSINE
  const perfil = { slug: 'braco', modalidades: ['bale-classico'] };
  const semQuem = enq.turmasSemHabilitacao(turmas, curs, perfil, { professor: 'braco' });
  checar('só a turma da modalidade perdida é apontada — e é uma só',
    semQuem.length === 1 && semQuem[0].nome === 'Jazz 1', semQuem);
  checar('…e o motivo nomeia a modalidade em português',
    /Jazz/.test(semQuem[0].motivo), semQuem[0].motivo);
  checar('a turma SEM curadoria não é descontinuada (não há o que comparar)',
    semQuem.every((t) => t.nome !== 'Turma sem curadoria'), semQuem);
  checar('e um professor SEM perfil não descontinua turma nenhuma',
    enq.turmasSemHabilitacao(turmas, curs, null, { professor: 'braco' }).length === 0);

  /* O DEFEITO QUE O MÓDULO EXISTE PARA NÃO TER. Antes, a leitura era `t.modalidade` e
   * `t.professor` — campos que o cadastro novo já não tem. Um `undefined` numa comparação não dá
   * erro: dá `false`, e a marca deixa de acender. Mede-se a diferença. */
  const semCamposNaTurma = enq.turmasSemHabilitacao(
    turmas.map((t) => ({ id: t.id, nome: t.nome })), curs, perfil, { professor: 'braco' });
  checar('a leitura pelo ENQUADRAMENTO acha a turma mesmo sem os campos nela',
    semCamposNaTurma.length === 1 && semCamposNaTurma[0].nome === 'Jazz 1', semCamposNaTurma);
  checar('…e a leitura ANTIGA (pelos campos da turma) não acharia nada — é o controlo negativo',
    turmas.map((t) => ({ id: t.id, nome: t.nome })).filter((t) => t.modalidade === 'jazz').length === 0);

  // O RESUMO DA LISTAGEM
  const resumo = enq.resumoDoEnquadramento(turmas[0], curs);
  checar('o resumo da turma diz quem ensina o quê, em que nível',
    resumo.texto === 'bale-classico · RAD · Grade 3', resumo.texto);
  checar('uma turma sem curadoria diz «sem curadoria atribuída» — e não um vazio',
    enq.resumoDoEnquadramento({ id: 'x', nome: 'x' }, curs).texto === 'sem curadoria atribuída',
    enq.resumoDoEnquadramento({ id: 'x', nome: 'x' }, curs).texto);
  /* E, quando ela guarda um nível antigo, diz AS DUAS COISAS: que não há ensino atribuído e que
   * nível ficou. Mostrar só o nível esconderia a ausência; mostrar só a ausência esconderia o
   * nível — e um nível que veio da memória é um nível que ninguém reviu desde a mudança de casa. */
  const semCuradoriaComMemoria = enq.resumoDoEnquadramento(turmas[2], curs).texto;
  checar('…e, guardando um nível antigo, di-lo ao lado — com a origem',
    /^sem curadoria atribuída · Vaganova 4 \(da turma\)$/.test(semCuradoriaComMemoria),
    semCuradoriaComMemoria);
}

// =====================================================================================
// B. A TURMA NÃO GUARDA O ENQUADRAMENTO
// =====================================================================================
async function aTurma() {
  console.log('\nB. A TURMA — o cadastro grava o ritmo, e só o ritmo');

  const kv = criarKv({ 'bastidores/breu/turmas': JSON.stringify([]) });
  const env = { ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't', PADD_KV: kv };
  const r = await bastidores.fetch(new Request('https://breu.tmenegaz77.workers.dev/api/bastidores/turma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senhaDirecao: 'x',
      nome: 'Balé Nível 1',
      // O CORPO AINDA MANDA O ENQUADRAMENTO, e o servidor tem de o IGNORAR — é o caso de uma
      // página antiga aberta num separador, ou de um pedido feito à mão.
      modalidade: 'bale-classico', professor: 'braco', grau: 'Básico', nivel: '3',
      programaReferencia: 'RAD', nivelReferencia: 'Grade 3',
      dias: ['ter', 'qui'], horarios: { ter: '19:00', qui: '19:00' },
      duracaoMin: 60, periodoInicio: '2027-02-01', periodoFim: '2027-04-30',
    }),
  }), env);
  const d = await r.json();
  checar('a turma grava', r.status === 201, { status: r.status, d });
  const gravada = JSON.parse(kv.mapa.get('bastidores/breu/turmas'))[0] || {};
  checar('…e o registo NÃO tem modalidade nem professor',
    gravada.modalidade === undefined && gravada.professor === undefined,
    { modalidade: gravada.modalidade, professor: gravada.professor });
  checar('…nem grau, nem nível, nem o rótulo composto',
    gravada.grau === undefined && gravada.nivel === undefined && gravada.nivelReferencia === undefined,
    { grau: gravada.grau, nivel: gravada.nivel, nivelReferencia: gravada.nivelReferencia });
  checar('…nem a tradição', gravada.programaReferencia === undefined, gravada.programaReferencia);
  checar('e o RITMO ficou lá — é o que a turma é',
    gravada.dias.join(',') === 'ter,qui' && gravada.duracaoMin === 60
      && gravada.periodoInicio === '2027-02-01', gravada);
}

// =====================================================================================
// C. A MEMÓRIA NÃO SE APAGA
// =====================================================================================
async function aMemoria() {
  console.log('\nC. A MEMÓRIA — a turma antiga conserva o que declarou, e o nível efetivo di-lo');

  const antiga = {
    id: 'bale-nivel-1', nome: 'Balé Nível 1', ordem: 1,
    programaReferencia: 'RAD', nivelReferencia: 'Grade 3',
    dias: ['ter'], horarios: { ter: '19:00' }, frequencia: 1, duracaoMin: 60,
    periodoInicio: '2027-02-01', periodoFim: '2027-04-30', ativo: true,
  };
  const kv = criarKv({ 'bastidores/breu/turmas': JSON.stringify([antiga]) });
  const env = { ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't', PADD_KV: kv };

  /* A TURMA É DERIVADA, e não editada — de propósito. Aqui é o caso que importa mais: uma turma
   * que já tem plano de ensino só se DERIVA (a regra de proveniência), e é esse caminho que tem
   * de conservar o que ela guardava. O `turma-editar` usa a MESMA lista de campos, portanto a
   * mesma garantia; a prova mede a que o passado obriga. */
  const r = await bastidores.fetch(new Request('https://breu.tmenegaz77.workers.dev/api/bastidores/turma-derivar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senhaDirecao: 'x', derivarDe: 'bale-nivel-1', vigencia: '2027-03-01',
      dias: ['ter'], horarios: { ter: '20:00' }, duracaoMin: 60,
      periodoInicio: '2027-02-01', periodoFim: '2027-04-30',
    }),
  }), env);
  const d = await r.json();
  checar('a turma antiga deriva', r.status === 201 || r.status === 200, { status: r.status, d });
  const todas = JSON.parse(kv.mapa.get('bastidores/breu/turmas'));
  checar('…e a lista fica com o elo novo e o antigo (o passado não se apaga)',
    todas.length === 2 && todas.some((t) => t.substitui === 'bale-nivel-1'), todas.length);
  const depois = todas.find((t) => t.substitui === 'bale-nivel-1') || {};
  checar('…a hora mudou', depois.horarios && depois.horarios.ter === '20:00', depois.horarios);
  checar('…e o `nivelReferencia` que ela guardava NÃO foi apagado', depois.nivelReferencia === 'Grade 3',
    depois.nivelReferencia);
  checar('…nem a tradição antiga', depois.programaReferencia === 'RAD', depois.programaReferencia);

  const efetivo = enq.nivelEfetivo(depois, null);
  checar('o nível efetivo dela vem da MEMÓRIA, e a origem é dita',
    efetivo.rotulo === 'Grade 3' && efetivo.de === 'turma', efetivo);
}

// =====================================================================================
// D. A CURADORIA — o nível grava-se aqui, e o rótulo é composto
// =====================================================================================
async function aCuradoria() {
  console.log('\nD. A CURADORIA — o nível da relação, composto pela tradição');

  const kv = criarKv({
    'bastidores/breu/turmas': JSON.stringify([{
      id: 'bale-nivel-1', nome: 'Balé Nível 1', ordem: 1,
      dias: ['ter'], horarios: { ter: '19:00' }, frequencia: 1, duracaoMin: 60,
      periodoInicio: '2027-02-01', periodoFim: '2027-04-30', ativo: true,
    }]),
    'bastidores/breu/alunas': JSON.stringify(['Vavá']),
    'bastidores/breu/professores': JSON.stringify([{ nome: 'Braço em Quinta' }]),
  });
  const env = { ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't', PADD_KV: kv };
  const BASE = 'https://breu.tmenegaz77.workers.dev';

  const gravarCuradoria = async (corpo) => {
    const r = await bastidores.fetch(new Request(BASE + '/api/bastidores/curadoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ senhaDirecao: 'x', alunas: ['Vavá'], turmas: ['Balé Nível 1'] }, corpo)),
    }), env);
    return { status: r.status, d: await r.json() };
  };

  // RAD: numera em fila → «Grade 3»
  const rad = await gravarCuradoria({
    professor: 'Braço em Quinta', modalidade: 'Bale clássico', tradicao: 'RAD', nivel: '3',
  });
  checar('a curadoria grava o nível', rad.status === 201, { status: rad.status, d: rad.d });
  const c1 = (rad.d.curadoria) || {};
  checar('…e o rótulo é COMPOSTO pela tradição — «Grade 3»', c1.nivelReferencia === 'Grade 3', c1);
  checar('…com o grau vazio, porque a RAD não usa graus', c1.grau === '', c1.grau);

  // Uma tradição por graus: «Intermediário 2»
  const porGrau = niveis.normalizarNivel(lerJson('biblioteca/modalidades/bale-classico/tradicoes.json'),
    { programaReferencia: 'Vaganova', grau: 'Intermediário', nivel: '2' });
  checar('numa tradição por graus, o rótulo compõe grau + nível',
    porGrau.nivelReferencia === 'Intermediário 2', porGrau.nivelReferencia);

  // O nível efetivo da turma passa a vir da curadoria — o mesmo caminho da listagem
  const kvCurs = await (async () => JSON.parse(kv.mapa.get('bastidores/breu/curadorias') || '[]'))();
  const efetivo = enq.resumoDoEnquadramento(
    JSON.parse(kv.mapa.get('bastidores/breu/turmas'))[0], kvCurs);
  checar('a listagem da turma passa a mostrar o nível da CURADORIA',
    efetivo.nivel.de === 'curadoria' && efetivo.nivel.rotulo === 'Grade 3', efetivo.nivel);
  checar('…e o resumo diz a modalidade, a tradição e o nível, nessa ordem',
    /clássico/i.test(efetivo.texto) && efetivo.texto.indexOf('RAD') !== -1
      && efetivo.texto.indexOf('Grade 3') !== -1, efetivo.texto);
}

// =====================================================================================
// E. A TELA — saiu de um formulário, entrou no outro
// =====================================================================================
function aTela() {
  console.log('\nE. A TELA — o enquadramento mudou de formulário');

  const html = bastidores.paginaProducao('x', { professor: 'x', ciclo: '01', query: '' },
    [], [], '', '', [], [], [], [], [], []);
  const formTurma = (html.match(/<form id="form-turma">[\s\S]*?<\/form>/) || [''])[0];
  const formCuradoria = (html.match(/<form id="form-curadoria">[\s\S]*?<\/form>/) || [''])[0];

  checar('o formulário da TURMA foi encontrado', formTurma.length > 200);
  checar('…e o da CURADORIA também', formCuradoria.length > 200);

  const doEnquadramento = ['tprograma', 'tmodalidade', 'tprofessor', 'tgrau', 'tnivel', 'esc-niveis'];
  checar('o formulário da TURMA não traz nenhum campo do enquadramento',
    doEnquadramento.filter((x) => formTurma.includes(x)), []);
  checar('…mas traz o RITMO: os dias e a duração',
    formTurma.includes('id="tdias"') && formTurma.includes('id="tduracao"'));

  checar('o formulário da CURADORIA traz o grau e o nível',
    formCuradoria.includes('id="cugrau"') && formCuradoria.includes('id="cunivel"'));
  checar('…e continua a trazer o professor, a modalidade e a tradição',
    ['cuprofessor', 'cumodalidade', 'cutradicao'].every((x) => formCuradoria.includes('id="' + x + '"')));

  /* O `#cugrau` É REPOVIDO PELA TRADIÇÃO, e o dado vai para o cliente. Sem isto, a curadoria de
   * RAD ficaria com um grau «Básico» que aquela tradição não tem. */
  checar('o grau é repovoado pela tradição escolhida',
    html.includes('function pintarGraus') && html.includes('NIVEIS_POR_TRADICAO'));
  checar('…e o `pintarGraus` recebe os ids por parâmetro (serve os dois formulários)',
    /function pintarGraus\(manter, idTrad, idGrau, idNivel\)/.test(html));

  // O SCRIPT DA PÁGINA TEM DE COMPILAR: a mudança mexeu em strings que compõem JS.
  const i = html.indexOf('<script>') + 8;
  const j = html.indexOf('</script>', i);
  const script = html.slice(i, j);
  let compila = true;
  try { new Function(script); } catch (e) { compila = false; }
  checar('o script da página compila', compila);
}

oNucleo();
aTela();
aTurma()
  .then(aMemoria)
  .then(aCuradoria)
  .then(() => {
    console.log('');
    if (falhas) { console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).'); process.exit(1); }
    console.log('TUDO CERTO — a turma é o ritmo, a curadoria é o ensino, e a memória não se apaga.');
  })
  .catch((erro) => {
    console.error('erro na prova:', erro);
    process.exit(1);
  });
