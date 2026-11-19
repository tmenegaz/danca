'use strict';

/**
 * provar-turma-sem-professor.js — A TURMA QUE NÃO APARECE NO PLANO (18/11/2026).
 *
 * A QUEIXA, na letra dela: «eu gero a turma e daí da turma eu consigo fazer o plano de ensino, mas
 * do jeito que tá agora eu não consigo fazer o plano de ensino. Ele não reconhece a turma, a turma
 * fica vazia. Eu tenho professor, ciclo e turma vazia, completamente desabilitado.»
 *
 * O QUE ESTAVA GRAVADO NO AR (breu, 18/11/2026), lido de `GET /api/bastidores/curadorias`:
 *
 *   {"id":"-rosa","professor":"","modalidade":"","turmas":["Rosa"],…}
 *
 * Um registo com o professor VAZIO. A Turma existia, a sala existia, o elenco existia — e o plano
 * não via nada, porque a lista de turmas do plano é filtrada por professor
 * (`GET /api/bastidores/curadoria-professor?professor=<slug>`). Um registo sem professor não é de
 * ninguém: não há erro, não há aviso, o select fica vazio e o «Começar» nunca acende.
 *
 * A CAUSA, e o id a denunciá-la: `idCuradoria('', '', 'Rosa')` dá `-rosa`. A rota passou a derivar
 * professor e modalidade da SALA (18/11/2026) e gravava o que a derivação desse — inclusive nada.
 * Uma derivação que devolve vazio não é um valor: é uma falta, e uma falta tem de ser dita.
 *
 * O QUE SE MEDE AQUI, contra o servidor de verdade e sem rede:
 *
 *   A. a sala ainda sem professor NÃO vira Turma — e a recusa diz qual é a sala e o que lhe falta;
 *   B. nada é escrito no KV quando a rota recusa (uma recusa que grava é pior do que não haver);
 *   C. com a sala completa, a Turma nasce com o par derivado — e o plano do professor VÊ a turma
 *      (a mesma lista que o `<select>` da porta lê, pela rota que ele chama);
 *   D. o id degenerado (`-rosa`) é reparado quando a Turma é corrigida — e o trio passa a dizer-se.
 *
 *   node experimentos/provar-turma-sem-professor.js
 */

const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

const BASE = 'https://escola-de-prova.tmenegaz77.workers.dev';
const SENHA = 'senha-da-direcao';
const ESCOLA = 'escola-de-prova';
const SALA = 'Rosa';
const PROFESSOR = 'demi-plie';

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

function criarKv() {
  const dados = new Map();
  return {
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) { dados.set(c, String(v)); },
    async delete(c) { dados.delete(c); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix))
        .map((name) => ({ name })), list_complete: true };
    },
  };
}

function ambiente() {
  return {
    ESCOLA_SLUG: ESCOLA,
    ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: SENHA,
    SENHA_PROFESSOR: 'senha-do-professor',
    PROFESSOR_SLUG: PROFESSOR,
    PROFESSOR_NOME: 'Demi Plie',
    PADD_KV: criarKv(),
  };
}

async function pedir(env, caminho, init) {
  const r = await bastidores.fetchSemRede(new Request(BASE + caminho, init), env);
  let corpo = null;
  try { corpo = await r.json(); } catch { corpo = null; }
  return { status: r.status, corpo };
}

const postar = (env, caminho, corpo) => pedir(env, caminho, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(Object.assign({ senhaDirecao: SENHA }, corpo)),
});

const RITMO = {
  dias: ['seg', 'qua', 'sex'], horarios: { seg: '18:00', qua: '18:00', sex: '18:00' },
  duracaoMin: 45, periodoInicio: '2027-03-03', periodoFim: '2027-06-30',
};

/** AS SALAS GRAVADAS — a chave que `turmas()` lê, aberta aqui para a bancada a poder conferir. */
async function salas(env) {
  const bruto = await env.PADD_KV.get('bastidores/' + ESCOLA + '/turmas');
  const lista = bruto ? JSON.parse(bruto) : [];
  return Array.isArray(lista) ? lista : [];
}

/** O QUE A PORTA LÊ PARA ENCHER O `<select>` DA TURMA — as duas metades, e a interseção. */
async function oQueOSelectDaTurmaVe(env, professor) {
  const doProfessor = await pedir(env, '/api/bastidores/curadoria-professor?professor=' + professor);
  const doCadastro = await pedir(env, '/api/bastidores/turmas');
  const atribuidas = new Set();
  for (const c of (doProfessor.corpo && doProfessor.corpo.curadorias) || []) {
    for (const t of (Array.isArray(c.turmas) ? c.turmas : [])) if (t) atribuidas.add(String(t));
  }
  const opcoes = (doCadastro.corpo && doCadastro.corpo.opcoes) || [];
  const lista = opcoes.filter((o) => atribuidas.has(String(o.valor)));
  return { atribuidas: [...atribuidas], opcoes: opcoes.map((o) => o.valor), lista };
}

(async () => {
  const env = ambiente();

  // -------------------------------------------------------------------------------------------
  bloco('1. A SALA NASCE COM A MODALIDADE E SEM PROFESSOR — o estado em que ela o encontrou');

  const sala = await postar(env, '/api/bastidores/turma',
    Object.assign({ nome: SALA, modalidade: 'Balé clássico' }, RITMO));
  provar('a sala é criada', sala.status === 201 || sala.status === 200,
    { status: sala.status, erro: sala.corpo && sala.corpo.erro });
  const gravada = (await salas(env)).find((t) => t.nome === SALA);
  provar('e ela diz a modalidade', !!(gravada && gravada.modalidade === 'Balé clássico'),
    gravada && gravada.modalidade);
  provar('e ainda NÃO diz quem a dá — é o professor que o passo 2 grava', !!(gravada && !gravada.professor),
    gravada && gravada.professor);

  // -------------------------------------------------------------------------------------------
  bloco('\n2. A TURMA NÃO NASCE SEM QUEM A DIRIJA');

  const semPar = await postar(env, '/api/bastidores/curadoria', { turmas: [SALA] });
  provar('atribuir a sala sem professor é RECUSADO', semPar.status === 400,
    { status: semPar.status, erro: semPar.corpo && semPar.corpo.erro });
  provar('a recusa nomeia a falta que trava o plano', Array.isArray(semPar.corpo && semPar.corpo.falta)
    && semPar.corpo.falta.indexOf('professor') !== -1, semPar.corpo && semPar.corpo.falta);
  provar('e nomeia a SALA — quem lê sabe onde completar',
    !!String((semPar.corpo && semPar.corpo.erro) || '').includes(SALA)
      && !!String((semPar.corpo && semPar.corpo.erro) || '').includes('Editar'),
    semPar.corpo && semPar.corpo.erro);
  const escritas = await bastidores.curadorias(env.PADD_KV, ESCOLA);
  provar('e não gravou NADA — uma recusa que grava é pior do que não haver guarda',
    escritas.length === 0, escritas);

  // -------------------------------------------------------------------------------------------
  bloco('\n3. COM A SALA COMPLETA, A TURMA NASCE COM O PAR — E O PLANO VÊ-A');

  // O passo 2 do formulário da Sala: a régua do professor, que leva o professor para a sala.
  const regua = await postar(env, '/api/bastidores/rubrica', {
    nome: 'Padrão da casa',
    niveis: ['Satisfatório', 'Em desenvolvimento', 'Não se aplica'],
    professor: PROFESSOR,
    // O formulário manda o ID da sala em foco (`turmaEmFoco`), e não o nome.
    turma: gravada.id,
  });
  provar('a régua do passo 2 é gravada', regua.status === 201 || regua.status === 200,
    { status: regua.status, erro: regua.corpo && regua.corpo.erro });
  const comProfessor = (await salas(env)).find((t) => t.nome === SALA);
  provar('e é ela que põe o professor na SALA', !!(comProfessor && comProfessor.professor === PROFESSOR),
    comProfessor && comProfessor.professor);

  const antes = await oQueOSelectDaTurmaVe(env, PROFESSOR);
  provar('o select do plano ainda está VAZIO — não há Turma nenhuma', antes.lista.length === 0, antes);

  const turma = await postar(env, '/api/bastidores/curadoria', { turmas: [SALA] });
  provar('atribuir a sala passa a ser aceito', turma.status === 201 || turma.status === 200,
    { status: turma.status, erro: turma.corpo && turma.corpo.erro });
  provar('e o professor é DERIVADO da sala — não veio no corpo',
    !!(turma.corpo && turma.corpo.curadoria && turma.corpo.curadoria.professor === PROFESSOR),
    turma.corpo && turma.corpo.curadoria && turma.corpo.curadoria.professor);
  provar('e a modalidade também',
    !!(turma.corpo && turma.corpo.curadoria
      && turma.corpo.curadoria.modalidade === 'Balé clássico'),
    turma.corpo && turma.corpo.curadoria && turma.corpo.curadoria.modalidade);

  const depois = await oQueOSelectDaTurmaVe(env, PROFESSOR);
  provar('e agora o select do plano VÊ a turma — as duas metades do `<select>` concordam',
    depois.lista.length === 1 && depois.lista[0].valor === SALA, depois);
  const deOutro = await oQueOSelectDaTurmaVe(env, 'outro-professor');
  provar('e continua a não vê-la um professor que não é o dela', deOutro.lista.length === 0, deOutro);

  // -------------------------------------------------------------------------------------------
  bloco('\n4. O ID DEGENERADO — `-rosa` era o que o defeito deixava escrito');

  /* ESTA SECÇÃO CORRE NESSA ESCOLA OUTRA VEZ, e do zero. É deliberado: o defeito que se mede é o
   * de um registo SOZINHO, tal como está no ar da `breu` — e medi-lo ao lado da Turma já corrigida
   * misturaria duas coisas (a reparação do id e a unicidade do trio), que é o que a secção 3 já
   * guarda. Aqui há uma sala completa e um registo degenerado, e mais nada. */
  const env2 = ambiente();
  const sala2 = await postar(env2, '/api/bastidores/turma',
    Object.assign({ nome: SALA, modalidade: 'Balé clássico' }, RITMO));
  provar('a segunda escola de prova também tem a sala', sala2.status === 201 || sala2.status === 200,
    { status: sala2.status, erro: sala2.corpo && sala2.corpo.erro });
  const gravada2 = (await salas(env2)).find((t) => t.nome === SALA);
  const regua2 = await postar(env2, '/api/bastidores/rubrica', {
    nome: 'Padrão da casa', niveis: ['Satisfatório', 'Em duas'], professor: PROFESSOR,
    turma: gravada2.id,
  });
  provar('e a sala dela já diz quem a dá', regua2.status === 201 || regua2.status === 200,
    { status: regua2.status, erro: regua2.corpo && regua2.corpo.erro });

  /* O REGISTO ANTIGO, GRAVADO À MÃO: é o que está no ar da `breu`. O id `-rosa` nasce da conta das
   * duas coisas vazias (`slugificar('') + '-' + slugificar('Rosa')`), e é o id que o defeito
   * escrevia — a mesma conta que `idCuradoria` faz, com os seus dois primeiros termos em falta. */
  await env2.PADD_KV.put('bastidores/' + ESCOLA + '/curadorias', JSON.stringify([{
    id: '-rosa', professor: '', modalidade: '', tradicao: '', grau: '', nivel: '',
    nivelReferencia: '', turmas: [SALA], linhaDeBase: '', linhaDeBaseNome: '',
    repertorio: [], alunas: [],
  }]));
  const quebrada = await oQueOSelectDaTurmaVe(env2, PROFESSOR);
  provar('com o registo do defeito, o select do plano fica vazio — é o que ela viu',
    quebrada.lista.length === 0, quebrada);

  const corrigida = await postar(env2, '/api/bastidores/curadoria', {
    idAntigo: '-rosa', turmas: [SALA],
  });
  provar('corrigir a Turma passa a ser possível', corrigida.status === 201 || corrigida.status === 200,
    { status: corrigida.status, erro: corrigida.corpo && corrigida.corpo.erro });
  const finais = await bastidores.curadorias(env2.PADD_KV, ESCOLA);
  provar('e o id degenerado não fica escrito', !finais.some((c) => c.id === '-rosa'),
    finais.map((c) => c.id));
  provar('e passa a dizer o trio — professor, modalidade e sala',
    finais.some((c) => c.id === PROFESSOR + '-bale-classico-' + SALA.toLowerCase()),
    finais.map((c) => c.id));
  provar('e não há dois registos para a mesma sala', finais.length === 1,
    finais.map((c) => c.id));

  const recuperada = await oQueOSelectDaTurmaVe(env2, PROFESSOR);
  provar('e o plano do professor volta a ver a turma', recuperada.lista.length === 1, recuperada);

  // -------------------------------------------------------------------------------------------
  console.log('\n' + (falhas ? 'FALHAS: ' + falhas + ' de ' + total : 'tudo certo: ' + total + '/' + total));
  process.exit(falhas ? 1 : 0);
})();
