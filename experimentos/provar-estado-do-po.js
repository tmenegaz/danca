#!/usr/bin/env node
'use strict';

/**
 * provar-estado-do-po.js — o estado do PO mede o que pode medir, e não julga a resposta.
 *
 * O QUE ELA RELATOU (15/11/2026), em duas voltas. Primeiro: «eu só tenho um ciclo, que é o ciclo 01,
 * e a etiqueta dele diz que o PO está aguardando. Então eu não sei qual dos dois está errado, o PO
 * ou se é o ciclo.» Depois, quando lhe propus marcar «sim» na caixa que faltava: «Não, não pode ir
 * lá marcar sim como mutuamente exclusivo. O professor escolheu marcar não, então tem que ser
 * considerado o que o professor marcou. […] É a marcação do professor que vale. […] A regra do que é
 * opcional é opcional e está valendo também.»
 *
 * O DEFEITO, na origem. `estadoDoPO` exigia as SEIS folhas do checklist em `true`. Duas coisas se
 * confundiam nessa conta:
 *
 *   1. um «não» — que é uma RESPOSTA, um achado declarado («os critérios não são mutuamente
 *      exclusivos») — era lido como pergunta por responder;
 *   2. as seis folhas são OPCIONAIS no conteúdo (`obrigatorio: false`), e um campo opcional estava
 *      a governar o estado.
 *
 * O que a correcção faz: o estado responde à única pergunta que pode responder sem julgar o
 * conteúdo — **as perguntas obrigatórias têm resposta?** A qualidade da resposta é de quem
 * respondeu, e o registo guarda-a como está.
 *
 * O QUE SE MEDE, e por que não basta ler o código:
 *
 *   A. A REGRA, nos dois sentidos. Um «não» num campo opcional não move o estado; um obrigatório em
 *      branco move. As duas metades, porque uma só não distingue «acerta» de «diz sempre o mesmo».
 *   B. AS FRONTEIRAS DO «SEM RESPOSTA». Vazio, só espaços e a lacuna `[Preencher: …]` contam como
 *      sem resposta (é o próprio documento a declará-la); «não», «teste» e uma lista com um item
 *      contam como resposta. Nada aqui olha para a qualidade do texto.
 *   C. O DOCUMENTO — o checklist imprime o que ele marcou, e o «não» fica escrito como achado.
 *   D. OS DADOS DO REPOSITÓRIO. Em todos os POs que existem hoje, o estado declarado é o que a
 *      regra calcula a partir do envelope deles — e as folhas marcadas «não» continuam marcadas.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` extrai o `motor/` de `HEAD` e corre as MESMAS provas. Em
 * `HEAD` a regra é a antiga: o «não» derruba o estado, e a secção A reprova. Se passasse, a bancada
 * não estaria a provar nada.
 *
 *   node experimentos/provar-estado-do-po.js
 *   node experimentos/provar-estado-do-po.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.includes('--controle-negativo');

let MOTOR = path.join(RAIZ, 'motor');
if (NEGATIVO) {
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'estado-do-po-'));
  execSync('git archive HEAD motor biblioteca tools teste modelo porta | tar -x -C ' + destino,
    { cwd: RAIZ, stdio: 'pipe' });
  MOTOR = path.join(destino, 'motor');
  console.log('CONTROLE NEGATIVO — o motor de HEAD (antes de a regra do estado mudar)\n');
}

const derivar = require(path.join(MOTOR, 'nucleo/derivar-po.js'));

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const CONTEUDO_PO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta/po/conteudo/po.json'), 'utf8'));

/* OS OBRIGATÓRIOS VÊM DO CONTEÚDO. No código de ANTES esta função não existe — e a bancada não
 * rebenta por isso: sem ela, a lista é vazia e cada asserção reprova pelo seu próprio nome. */
function obrigatorios() {
  if (typeof derivar.obrigatoriosDoPO !== 'function') return [];
  return derivar.obrigatoriosDoPO(CONTEUDO_PO);
}

/**
 * O ESTADO, MEDIDO PELA DERIVAÇÃO — e não pela função isolada.
 *
 * `estadoDoPO` é interna: em `HEAD` não é exportada, e um controle negativo que reprovasse por
 * «a função não existe» estaria a medir a exportação, não a regra. `derivarPO` existe nas duas
 * versões e é o caminho que o worker usa, por isso é ele que a bancada chama. A lista de
 * obrigatórias é passada nas duas — em `HEAD` é simplesmente ignorada, e é isso que a torna o
 * controlo certo: o mesmo pedido, a regra de ontem e a de hoje.
 */
function estado(envelope, lista) {
  try {
    const r = derivar.derivarPO(envelope, null, {
      rotulos: derivar.rotulosDoChecklist(CONTEUDO_PO),
      derivados: derivar.derivadosDoChecklist(CONTEUDO_PO),
      obrigatorios: lista || [],
      linhaDeBase: null,
    });
    return r && r.estado;
  } catch (e) { return 'ERRO: ' + e.message; }
}

/* AS SEIS FOLHAS DO CHECKLIST — opcionais no conteúdo, e é isso que a prova fixa. */
const FOLHAS = ['checklist-fenomeno-definido', 'checklist-fronteiras-claras',
  'checklist-norma-estabelecida', 'checklist-criterios-exclusivos',
  'checklist-justificativa-fundada', 'checklist-recorte-viavel'];

/* UM ENVELOPE COMPLETO, com as catorze obrigatórias respondidas e as seis folhas marcadas «sim» —
 * o ponto de partida de todos os casos abaixo. */
function envelopeCompleto() {
  const respostas = {};
  for (const id of obrigatorios()) respostas[id] = 'resposta de ' + id;
  respostas['contexto-turma'] = 'Teste 2';
  for (const id of FOLHAS) {
    respostas[id] = { valor: 'sim', origem: 'perguntado', respondente: 'professor', nota: null };
  }
  return { id: 'po-de-prova', fonte: 'po', gerado_em: '2026-11-15T12:00',
    contexto: { escola: 'batata', professor: 'docente', ciclo: '01', turma: 'Teste 2' }, respostas };
}

// =====================================================================================
// A. A REGRA, NOS DOIS SENTIDOS
// =====================================================================================
function aRegra() {
  console.log('\nA. A REGRA — um «não» opcional não move o estado; um obrigatório em branco move');
  const lista = obrigatorios();
  checar('o conteúdo declara catorze perguntas obrigatórias (as mesmas do formulário)',
    lista.length === 14, lista.length);

  const completo = envelopeCompleto();
  checar('tudo respondido ⇒ Input_PO_Validado', estado(completo, lista) === 'Input_PO_Validado',
    estado(completo, lista));

  /* O CASO DELA, ao pé da letra: o professor marcou «não» em «Critérios mutuamente exclusivos» —
   * que é OPCIONAL — e o PO continua completo. */
  const comNao = envelopeCompleto();
  comNao.respostas['checklist-criterios-exclusivos'] = { valor: 'não', origem: 'perguntado',
    respondente: 'professor', nota: null };
  checar('o «não» que ela marcou não derruba o estado',
    estado(comNao, lista) === 'Input_PO_Validado', estado(comNao, lista));

  // E o mesmo vale para as outras cinco folhas: são opcionais, e o estado não se lê delas.
  const todasNao = envelopeCompleto();
  for (const id of FOLHAS) {
    todasNao.respostas[id] = { valor: 'não', origem: 'perguntado',
      respondente: 'professor', nota: null };
  }
  checar('com as SEIS folhas em «não» o estado também não muda',
    estado(todasNao, lista) === 'Input_PO_Validado', estado(todasNao, lista));

  // A CONTRAPROVA: um obrigatório em branco é que é pendência — é isso, e só isso, que o estado mede.
  const semFenomeno = envelopeCompleto();
  delete semFenomeno.respostas['fenomeno'];
  checar('uma pergunta OBRIGATÓRIA sem resposta ⇒ Input_PO_Aguardando',
    estado(semFenomeno, lista) === 'Input_PO_Aguardando', estado(semFenomeno, lista));

  checar('sem lista de obrigatórias não se afirma pendência nenhuma',
    estado(envelopeCompleto(), null) === 'Input_PO_Validado', estado(envelopeCompleto(), null));

  // A LISTA É DO CONTEÚDO — e as seis folhas do checklist não estão nela.
  const doChecklist = lista.filter((id) => /^checklist-/.test(id));
  checar('nenhuma folha do checklist entra nas obrigatórias', doChecklist.length === 0, doChecklist);
}

// =====================================================================================
// B. AS FRONTEIRAS DO «SEM RESPOSTA»
// =====================================================================================
function asFronteiras() {
  console.log('\nB. AS FRONTEIRAS — o que conta como resposta, sem julgar o texto');
  const lista = obrigatorios();
  const casos = [
    ['texto vazio', '', 'Input_PO_Aguardando'],
    ['só espaços', '   \n ', 'Input_PO_Aguardando'],
    ['a lacuna declarada', '[Preencher: o padrão de referência]', 'Input_PO_Aguardando'],
    // A VONTADE DO PROFESSOR, tal como ela a descreveu: «se tem que escrever um texto esperado que
    // faça sentido e ele resolveu escrever só teste, sei lá. É a vontade do professor.»
    ['a palavra «teste»', 'teste', 'Input_PO_Validado'],
    ['«não» escrito à mão', 'não', 'Input_PO_Validado'],
    ['uma lista com um item', ['um item'], 'Input_PO_Validado'],
    ['uma lista vazia', [], 'Input_PO_Aguardando'],
    ['um valor estruturado com conteúdo', { min: 3, unidade: 'vezes' }, 'Input_PO_Validado'],
  ];
  for (const [rotulo, valor, esperado] of casos) {
    const e = envelopeCompleto();
    e.respostas['fenomeno'] = valor;
    const obtido = estado(e, lista);
    checar(rotulo + ' ⇒ ' + esperado.replace('Input_PO_', ''), obtido === esperado,
      { obtido, esperado });
  }
}

// =====================================================================================
// C. O DOCUMENTO — o checklist imprime o que ele marcou, e não pede nada
// =====================================================================================
function oDocumento() {
  console.log('\nC. O DOCUMENTO — o «não» fica escrito como achado, e o estado não se lê dele');
  if (typeof derivar.derivarPO !== 'function') {
    checar('derivarPO existe', false);
    return;
  }
  const envelope = envelopeCompleto();
  envelope.respostas['checklist-criterios-exclusivos'] = { valor: 'não', origem: 'perguntado',
    respondente: 'professor', nota: null };
  let r = null;
  try {
    r = derivar.derivarPO(envelope, null, {
      rotulos: derivar.rotulosDoChecklist(CONTEUDO_PO),
      derivados: derivar.derivadosDoChecklist(CONTEUDO_PO),
      obrigatorios: obrigatorios(),
      linhaDeBase: null,
    });
  } catch (e) { r = { estado: 'ERRO: ' + e.message, markdown: '' }; }
  checar('o documento declara o estado calculado pela regra nova',
    r.estado === 'Input_PO_Validado' && /^state: Input_PO_Validado$/m.test(r.markdown), r.estado);
  checar('…e o critério que o professor marcou «não» continua impresso como não satisfeito',
    /### criteriaMutuallyExclusive\n\n- \[ \] /.test(r.markdown),
    (r.markdown.match(/### criteriaMutuallyExclusive[\s\S]{0,80}/) || [''])[0]);
  checar('…e as folhas que ele marcou «sim» continuam impressas como satisfeitas',
    /### phenomenonOperationallyDefined\n\n- \[x\] /.test(r.markdown),
    (r.markdown.match(/### phenomenonOperationallyDefined[\s\S]{0,80}/) || [''])[0]);
}

// =====================================================================================
// D. OS DADOS DO REPOSITÓRIO
// =====================================================================================
function osDadosDoRepositorio() {
  console.log('\nD. OS POs QUE EXISTEM HOJE — o estado declarado é o que a regra calcula');
  const lista = obrigatorios();
  const fontes = execSync('git ls-files "professores/*/ciclos/*-po.md"',
    { cwd: RAIZ, encoding: 'utf8' }).split('\n').filter(Boolean);
  checar('há POs no repositório para medir', fontes.length > 0, fontes.length);
  for (const rel of fontes) {
    const nome = rel.split('/').slice(-1)[0];
    const texto = fs.readFileSync(path.join(RAIZ, rel), 'utf8');
    const carimbo = (/^envelope:[ \t]*(.*)$/m.exec(texto) || [])[1] || '';
    const declarado = (/^state:[ \t]*(.*)$/m.exec(texto) || [])[1] || '';
    const achado = carimbo
      ? execSync(`git ls-files "escola/*/envelopes/${carimbo}.json"`,
        { cwd: RAIZ, encoding: 'utf8' }).split('\n').filter(Boolean)[0]
      : null;
    if (!achado) {
      checar(nome + ': o envelope da fonte existe', false, carimbo);
      continue;
    }
    const envelope = JSON.parse(fs.readFileSync(path.join(RAIZ, achado), 'utf8'));
    checar(nome + ': o `state:` declarado é o que a regra calcula',
      declarado === estado(envelope, lista), { declarado, calculado: estado(envelope, lista) });
    /* O ACHADO NÃO DESAPARECE. O critério que o professor marcou «não» continua impresso como não
     * satisfeito — a correcção era sobre o estado, e não sobre o que fica escrito. */
    const caixasAbertas = (texto.match(/^-[ \t]*\[ \][ \t]*(.+)$/gm) || []).length;
    const marcadosNao = Object.entries(envelope.respostas || {})
      .filter(([id]) => /^checklist-/.test(id))
      .filter(([, r]) => String((r && typeof r === 'object' && 'valor' in r) ? r.valor : r)
        .trim().toLowerCase() === 'não').length;
    checar(nome + ': os critérios que ele marcou «não» continuam à vista como achado',
      caixasAbertas >= marcadosNao, { caixasAbertas, marcadosNao });
  }
}

(async () => {
  aRegra();
  asFronteiras();
  oDocumento();
  osDadosDoRepositorio();

  console.log('\n' + (falhas ? '✗ ' + falhas + ' de ' + total + ' reprovaram' : '✓ ' + total + ' de ' + total));
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.error('provar-estado-do-po rebentou:', e && e.stack ? e.stack : e);
  process.exit(1);
});
