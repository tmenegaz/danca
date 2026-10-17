#!/usr/bin/env node
'use strict';

/**
 * provar-derivacao-da-turma.js — a prova do «editar turma» como DERIVAÇÃO (16/10/2026).
 *
 * A turma não se edita: **deriva**. Quando a escola corrige a hora, a duração ou os dias de
 * uma turma, o que fica gravado é um registo NOVO, com o mesmo nome e uma data de vigência; o
 * anterior desce para o histórico com `substituidaPor`. É o mesmo invariante do plano vinculado
 * a um PO: a proveniência acrescenta, não edita.
 *
 * O que esta prova trava — e por que cada um destes casos é um defeito real:
 *
 *   1. o cadastro recusa um NOME repetido — mas só contra uma turma VIGENTE. Recusar contra a
 *      substituída impediria a própria derivação (as duas partilham o nome de propósito: é o
 *      nome que a curadoria guarda e que o plano referencia);
 *   2. a vigente aparece na lista, a substituída NÃO — se as duas aparecessem, o professor
 *      escolheria no cabeçalho do plano um ritmo que já não vale;
 *   3. a substituída continua guardada, com o elo (`substituidaPor` + `substituidaEm`) — é o
 *      passado, e o passado não se reescreve;
 *   4. o ID da derivada leva a vigência (`teste-2026-11-01`) e não colide com o da anterior,
 *      que continua a ser `teste`;
 *   5. o que a escola NÃO está a ajustar sobrevive — a ligação à rubrica e os vínculos
 *      turma↔termo. Perder a régua por ter corrigido uma hora seria perder trabalho;
 *   6. a data de vigência é obrigatória: sem ela não há elo, e o ajuste viraria reescrita;
 *   7. uma turma já substituída não se deriva outra vez — dois elos a apontar para o mesmo
 *      passado deixariam a cadeia ambígua;
 *   8. excluir uma turma exclui a LINHA CERTA. Depois da derivação há duas com o mesmo nome, e
 *      o `DELETE` que procurava pelo nome apagava a do passado em vez da que a escola quer
 *      tirar — este é o caso que mais dói, porque é silencioso.
 *
 *   uso: node experimentos/provar-derivacao-da-turma.js
 */

const bastidores = require('../motor/servidor/bastidores.js');

const BASE = 'https://barra.tmenegaz77.workers.dev';
const SENHA_DA_DIRECAO = 'senha-da-direcao';

function criarKv() {
  const dados = new Map();
  return {
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); },
    async delete(chave) { dados.delete(chave); },
    async list({ prefix = '' } = {}) {
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })),
        list_complete: true,
      };
    },
  };
}

function ambiente() {
  return {
    ESCOLA_SLUG: 'barra',
    ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: SENHA_DA_DIRECAO,
    PROFESSOR_NOME: 'Leticia',
    PADD_KV: criarKv(),
  };
}

async function pedir(env, caminho, init) {
  const resposta = await bastidores.fetch(new Request(BASE + caminho, init), env);
  if (!resposta) throw new Error('os Bastidores não trataram ' + caminho);
  return resposta;
}

const json = (env, caminho, metodo, corpo) => pedir(env, caminho, {
  method: metodo,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(Object.assign({ senhaDirecao: SENHA_DA_DIRECAO }, corpo)),
});

async function principal() {
  const casos = [];
  const conferir = (nome, obtido, esperado) => {
    casos.push({ nome, ok: JSON.stringify(obtido) === JSON.stringify(esperado), obtido, esperado });
  };
  const env = ambiente();
  const listaCrua = async () =>
    JSON.parse(await env.PADD_KV.get('bastidores/barra/turmas') || '[]');
  const listaViva = async () =>
    (await (await pedir(env, '/api/bastidores/turmas')).json()).turmas;

  // --- 1. o cadastro e o ritmo obrigatório ---------------------------------
  const novo = (corpo) => json(env, '/api/bastidores/turma', 'POST', Object.assign({
    frequencia: 2, dias: ['ter', 'qui'], horarios: { ter: '09:00', qui: '09:00' },
    duracaoMin: 60, periodoInicio: '2026-10-16', periodoFim: '2026-12-18',
  }, corpo));
  conferir('a turma é cadastrada', (await novo({ nome: 'Teste' })).status, 201);
  conferir('o nome repetido numa turma VIGENTE é recusado',
    (await novo({ nome: 'Teste' })).status, 409);
  conferir('uma turma sem ritmo é recusada', (await json(env, '/api/bastidores/turma', 'POST', {
    nome: 'Sem Ritmo', frequencia: 2 })).status, 400);

  // --- 2. a derivação ------------------------------------------------------
  const derivar = (corpo) => json(env, '/api/bastidores/turma-derivar', 'POST', corpo);
  conferir('derivar sem data de vigência é recusado',
    (await derivar({ derivarDe: 'teste', frequencia: 3 })).status, 400);
  conferir('derivar uma turma que não existe é 404',
    (await derivar({ derivarDe: 'nao-existe', vigencia: '2026-11-01' })).status, 404);

  // A escola corrige a hora e a frequência a partir de 01/11.
  const d1 = await derivar({
    derivarDe: 'teste', vigencia: '2026-11-01',
    frequencia: 3, dias: ['ter', 'qua', 'qui'],
    horarios: { ter: '11:00', qua: '11:00', qui: '11:00' },
    duracaoMin: 55, periodoInicio: '2026-10-16', periodoFim: '2026-12-18',
  });
  conferir('a derivação é aceita', d1.status, 201);
  const corpo1 = await d1.json();
  conferir('…e o id leva a vigência', corpo1.id, 'teste-2026-11-01');
  conferir('…e diz de onde deriva', corpo1.substitui, 'teste');
  conferir('…e o NOME não muda (é o que a curadoria e o plano referenciam)',
    corpo1.turma, 'Teste');

  // --- 3. o que fica guardado ---------------------------------------------
  const crua = await listaCrua();
  conferir('as duas versões ficam guardadas', crua.length, 2);
  const anterior = crua.find((t) => t.id === 'teste');
  const vigente = crua.find((t) => t.id === 'teste-2026-11-01');
  conferir('a anterior diz quem a substituiu', anterior.substituidaPor, 'teste-2026-11-01');
  conferir('…e a partir de quando', anterior.substituidaEm, '2026-11-01');
  conferir('…e o ritmo dela NÃO foi reescrito', anterior.frequencia, 2);
  conferir('…nem as horas de antes', anterior.horarios, { ter: '09:00', qui: '09:00' });
  conferir('a vigente tem o ritmo novo', vigente.frequencia, 3);
  conferir('…e as horas novas', vigente.horarios, { ter: '11:00', qua: '11:00', qui: '11:00' });
  conferir('…e sabe de onde veio', vigente.substitui, 'teste');
  conferir('…e a data de vigência', vigente.vigenteDe, '2026-11-01');
  conferir('…e não nasce marcada como substituída', !!vigente.substituidaPor, false);

  // --- 4. a lista viva mostra só a vigente --------------------------------
  const vivas = await listaViva();
  conferir('a lista da Produção e do plano traz só a vigente', vivas.map((t) => t.id),
    ['teste-2026-11-01']);
  conferir('…e o nome continua a ser o mesmo', vivas[0].nome, 'Teste');

  // --- 5. o que não se está a ajustar sobrevive ---------------------------
  // A régua e os conteúdos são ligados ANTES do ajuste, como a escola faria.
  await json(env, '/api/bastidores/rubrica', 'POST', { nome: 'Régua X', niveis: ['Ótimo', 'Bom'] });
  conferir('a régua liga-se à turma vigente', (await json(env, '/api/bastidores/turma-rubrica',
    'POST', { turma: 'teste-2026-11-01', rubricaId: 'regua-x' })).status, 200);

  const d2 = await derivar({ derivarDe: 'teste-2026-11-01', vigencia: '2026-12-01',
    frequencia: 2, dias: ['sex'], horarios: { sex: '15:00' }, duracaoMin: 75,
    periodoInicio: '2026-10-16', periodoFim: '2026-12-18' });
  conferir('uma segunda derivação é aceita', d2.status, 201);
  const corpo2 = await d2.json();
  conferir('…e o id continua a não colidir', corpo2.id, 'teste-2026-12-01');
  const crua2 = await listaCrua();
  conferir('…e a régua vai com a turma para a versão nova',
    crua2.find((t) => t.id === 'teste-2026-12-01').rubricaId, 'regua-x');
  conferir('…e a cadeia tem três elos', crua2.length, 3);
  conferir('…e a lista viva tem um só', (await listaViva()).map((t) => t.id), ['teste-2026-12-01']);

  // --- 6. uma turma já substituída não se deriva outra vez ----------------
  conferir('derivar uma turma já substituída é 404',
    (await derivar({ derivarDe: 'teste', vigencia: '2026-12-15', frequencia: 2 })).status, 404);

  // --- 7. o nome repetido contra a vigente continua a ser recusado --------
  conferir('o nome da turma vigente não se pode cadastrar de novo',
    (await novo({ nome: 'Teste' })).status, 409);
  conferir('…mas o de uma substituída, sim (é o que a torna o mesmo nome)',
    (await novo({ nome: 'Outra' })).status, 201);

  // --- 8. excluir acerta a LINHA CERTA ------------------------------------
  // 'Teste' (a original) e a vigente 'teste-2026-12-01' partilham o nome. Excluir pelo id da
  // vigente tem de levar a VIGENTE — não a do passado, que é o que a busca por nome fazia.
  const del = await json(env, '/api/bastidores/turma', 'DELETE', { id: 'teste-2026-12-01' });
  conferir('excluir pelo id é aceito', del.status, 200);
  conferir('…e remove a versão pedida', (await del.json()).turma, 'teste-2026-12-01');
  const depois = await listaCrua();
  conferir('…e a do PASSADO continua lá', depois.some((t) => t.id === 'teste'), true);
  conferir('…e a vigente desapareceu', depois.some((t) => t.id === 'teste-2026-12-01'), false);
  conferir('…e a outra turma não foi tocada', depois.some((t) => t.id === 'outra'), true);

  // --- 9. LIVRE edita-se; VINCULADA deriva-se (16/10/2026) -----------------
  // A regra é a do plano de ensino: uma turma sem plano é cadastro e corrige-se no lugar;
  // uma turma com plano é linha de base e deriva. A ligação é pelo NOME, no envelope.
  const editar = (corpo) => json(env, '/api/bastidores/turma-editar', 'POST', corpo);
  conferir('uma turma livre é editável', (await editar({
    id: 'outra', nome: 'Outra', frequencia: 1, dias: ['sab'], horarios: { sab: '10:00' },
    duracaoMin: 50, periodoInicio: '2026-10-16', periodoFim: '2026-12-18',
  })).status, 200);

  // O plano de ensino declara a TURMA em `contexto-turma`; é essa a ligação.
  const envelope = { id: 'plano-20261016-1800',
    respostas: { 'contexto-turma': { valor: 'Outra' } } };
  // A chave física dos envelopes é NAMESPACED pela escola (`<escola>/envelope/…`): é assim
  // que o adaptador impede uma escola de ler os planos de outra. Gravar sem o prefixo faria
  // esta prova passar com um código que, em produção, nunca encontraria plano nenhum.
  conferir('o envelope do plano fica na chave da escola',
    /^barra\//.test('barra/envelope/plano-20261016-1800.json'), true);
  await env.PADD_KV.put('barra/envelope/plano-20261016-1800.json', JSON.stringify(envelope));

  const recusada = await editar({ id: 'outra', nome: 'Outra', frequencia: 2, dias: ['sab'],
    horarios: { sab: '10:00' }, duracaoMin: 50, periodoInicio: '2026-10-16', periodoFim: '2026-12-18' });
  conferir('uma turma COM plano de ensino recusa a edição', recusada.status, 409);
  conferir('…e o erro diz para derivar', /derive/i.test((await recusada.json()).erro), true);

  // E a derivação continua a valer para ela.
  conferir('…e a mesma turma aceita derivar',
    (await derivar({ derivarDe: 'outra', vigencia: '2026-11-15',
      frequencia: 2, dias: ['sab'], horarios: { sab: '10:00' }, duracaoMin: 50,
      periodoInicio: '2026-10-16', periodoFim: '2026-12-18' })).status, 201);

  // --- 10. o nome muda numa turma livre, e os vínculos vão atrás ----------
  // O id é o slug do nome; mudar o nome muda o id, e os vínculos turma↔termo são guardados
  // PELO ID. Sem a migração, os conteúdos ficariam órfãos no id antigo.
  await json(env, '/api/bastidores/termo', 'POST', { termo: 'Tendu' });
  conferir('a turma a renomear é criada',
    (await novo({ nome: 'Balé Nível 1' })).status, 201);
  const nova = await editar({ id: 'bale-nivel-1', nome: 'Balé Iniciante',
    frequencia: 2, dias: ['seg'], horarios: { seg: '08:00' }, duracaoMin: 60,
    periodoInicio: '2026-10-16', periodoFim: '2026-12-18' });
  conferir('editar uma turma livre aceita um nome novo', nova.status, 200);
  conferir('…e o id acompanha o nome', (await nova.json()).turma, 'bale-iniciante');
  const crua3 = await listaCrua();
  conferir('…e o registo antigo já não existe', crua3.some((t) => t.id === 'bale-nivel-1'), false);
  conferir('…e a turma nova está lá com o nome novo',
    crua3.filter((t) => t.id === 'bale-iniciante').map((t) => t.nome), ['Balé Iniciante']);

  // --- 11. o cartão diz o estado, e o botão diz o que vai fazer ----------
  const pagina = await (await pedir(env, '/bastidores/producao')).text();
  conferir('o cartão da turma livre diz «livre»', pagina.includes('>livre<'), true);
  conferir('…e oferece «Editar»', pagina.includes('data-modo="editar"'), true);
  conferir('o cartão da turma com plano diz «vinculada»', pagina.includes('>vinculada<'), true);
  conferir('…e oferece «Derivar»', pagina.includes('data-modo="derivar"'), true);
  conferir('…e o botão «Ajustar» antigo desapareceu',
    pagina.includes('data-turma-ajustar') && !/>Ajustar</.test(pagina), true);

  // --- 12. A CURADORIA: uma turma por vez, e o par livre × vinculada -------
  // A curadoria autoriza o professor a fazer o plano de UMA turma. Duas turmas na mesma
  // curadoria diriam que as alunas de uma são as da outra — e não são.
  const curadoria = (corpo) => json(env, '/api/bastidores/curadoria', 'POST', corpo);
  // As turmas têm de existir E ter ritmo: a curadoria recusa atribuir uma turma sem ele.
  conferir('a turma A é criada', (await novo({ nome: 'Turma A' })).status, 201);
  conferir('a turma B é criada', (await novo({ nome: 'Turma B' })).status, 201);
  const duasTurmas = await curadoria({ professor: 'Leticia', modalidade: 'Balé Clássico',
    turmas: ['Turma A', 'Turma B'] });
  conferir('a curadoria recusa DUAS turmas', duasTurmas.status, 400);
  conferir('…e o erro explica por quê', /UMA turma/.test((await duasTurmas.json()).erro), true);

  // O professor é guardado como SLUG — é o que o plano leva em `contexto.professor`.
  const criada = await curadoria({ professor: 'Leticia', modalidade: 'Balé Clássico',
    tradicao: 'RAD', turmas: ['Turma A'], alunas: ['Ana'], repertorio: ['Tendu'] });
  conferir('uma curadoria com UMA turma é aceita', criada.status, 201);
  const corpoCuradoria = await criada.json();
  conferir('…e a turma fica como lista de um (o formato que o plano lê)',
    corpoCuradoria.curadoria.turmas, ['Turma A']);
  conferir('…e o professor é guardado como slug', corpoCuradoria.curadoria.professor, 'leticia');
  const idCuradoria = corpoCuradoria.curadoria.id;
  conferir('…e o id nasce do trio professor × modalidade × TURMA (16/10/2026)',
    idCuradoria, 'leticia-bale-classico-turma-a');

  // Livre: edita-se no lugar (mesmo id, valores novos).
  const editada = await curadoria({ professor: 'Leticia', modalidade: 'Balé Clássico',
    tradicao: 'Vaganova', turmas: ['Turma A'], alunas: ['Ana', 'Bia'], repertorio: ['Tendu'] });
  conferir('uma curadoria LIVRE é editável', editada.status, 201);
  conferir('…e o id não muda', (await editada.json()).curadoria.id, idCuradoria);
  const listaCrua4 = JSON.parse(await env.PADD_KV.get('bastidores/barra/curadorias') || '[]');
  conferir('…e continua a ser UM registo', listaCrua4.length, 1);
  conferir('…com o valor novo', listaCrua4[0].alunas, ['Ana', 'Bia']);

  // Nasce o plano de ensino dela: par (professor, turma) no envelope.
  await env.PADD_KV.put('barra/envelope/plano-20261016-1900.json', JSON.stringify({
    id: 'plano-20261016-1900',
    contexto: { escola: 'barra', professor: 'leticia', ciclo: '01', turma: 'Turma A' },
    respostas: { 'contexto-turma': { valor: 'Turma A' } },
  }));
  const recusaCuradoria = await curadoria({ professor: 'Leticia', modalidade: 'Balé Clássico',
    tradicao: 'RAD', turmas: ['Turma A'], alunas: ['Ana'] });
  conferir('uma curadoria VINCULADA recusa a edição', recusaCuradoria.status, 409);
  conferir('…e o erro diz para derivar', /derive/i.test((await recusaCuradoria.json()).erro), true);

  // E deriva.
  const der = await json(env, '/api/bastidores/curadoria-derivar', 'POST', {
    derivarDe: idCuradoria, vigencia: '2026-11-20',
    tradicao: 'RAD', turmas: ['Turma A'], alunas: ['Ana'], repertorio: ['Tendu'],
  });
  conferir('…e a curadoria vinculada aceita derivar', der.status, 201);
  const derivada = (await der.json()).curadoria;
  conferir('…com id que leva a vigência', derivada.id, idCuradoria + '-2026-11-20');
  conferir('…e o par professor × modalidade preservado',
    [derivada.professor, derivada.modalidade], ['leticia', 'Balé Clássico']);
  conferir('…e sabe de onde veio', derivada.substitui, idCuradoria);

  const cruaCuradorias = JSON.parse(await env.PADD_KV.get('bastidores/barra/curadorias') || '[]');
  conferir('as duas versões ficam guardadas', cruaCuradorias.length, 2);
  conferir('…e a anterior diz quem a substituiu',
    (cruaCuradorias.find((c) => c.id === idCuradoria) || {}).substituidaPor, derivada.id);
  const vivasCuradoria = (await (await pedir(env, '/api/bastidores/curadorias')).json()).curadorias;
  conferir('a lista da operação traz só a vigente', vivasCuradoria.map((c) => c.id), [derivada.id]);
  const doProfessor = (await (await pedir(env, '/api/bastidores/curadoria-professor?professor=leticia')).json()).curadorias;
  conferir('…e é ela que autoriza o professor', doProfessor.map((c) => c.id), [derivada.id]);
  conferir('derivar sem data de vigência é recusado',
    (await json(env, '/api/bastidores/curadoria-derivar', 'POST', { derivarDe: derivada.id })).status, 400);

  // A página: o selinho e o botão certo.
  const pagina2 = await (await pedir(env, '/bastidores/producao')).text();
  conferir('a curadoria vinculada diz «vinculada»', pagina2.includes('>vinculada<'), true);
  conferir('…e oferece «Derivar» na curadoria',
    pagina2.includes('data-curadoria-ajustar'), true);
  conferir('…e a turma da curadoria é um `select`',
    pagina2.includes('<select id="cuturma">'), true);

  // --- 12b. O BUG REPORTADO (16/10/2026): N turmas do mesmo professor ----------
  // O id era `professor + modalidade` SEM a turma. Atribuir a mesma modalidade do mesmo
  // professor a uma segunda turma caía no mesmo id: o `upsert` substituía a curadoria
  // anterior, e a primeira turma desaparecia — em silêncio.
  const outraTurma = await curadoria({ professor: 'Miguel', modalidade: 'Jazz',
    tradicao: 'Jazz', turmas: ['Turma A'], alunas: ['Gabi'], repertorio: [] });
  conferir('a 1ª turma do professor é atribuída', outraTurma.status, 201);
  const idUm = (await outraTurma.json()).curadoria.id;
  const segunda = await curadoria({ professor: 'Miguel', modalidade: 'Jazz',
    tradicao: 'Jazz', turmas: ['Turma B'], alunas: ['Nina'], repertorio: [] });
  conferir('a 2ª turma do MESMO professor e modalidade é aceita', segunda.status, 201);
  const idDois = (await segunda.json()).curadoria.id;
  conferir('…e é uma curadoria DIFERENTE (o id leva a turma)', idUm !== idDois, true);
  conferir('…e o id diz qual turma', [idUm, idDois],
    ['miguel-jazz-turma-a', 'miguel-jazz-turma-b']);
  const cruasMiguel = JSON.parse(await env.PADD_KV.get('bastidores/barra/curadorias') || '[]')
    .filter((c) => c.professor === 'miguel');
  conferir('as DUAS ficam guardadas (a 1ª não foi substituída)', cruasMiguel.length, 2);
  conferir('…e cada uma com a sua turma',
    cruasMiguel.map((c) => turmasDa(c)[0]).sort(), ['Turma A', 'Turma B']);
  conferir('…e a 2ª não substituiu a 1ª', cruasMiguel.some((c) => c.substituidaPor), false);
  const vivasMiguel = (await (await pedir(env, '/api/bastidores/curadorias')).json())
    .curadorias.filter((c) => c.professor === 'miguel');
  conferir('…e as duas aparecem na lista da operação', vivasMiguel.length, 2);

  // O ID ANTIGO (sem turma) continua a resolver: a curadoria gravada antes de 16/10/2026 é
  // editada onde está, e não duplicada ao lado.
  const antesDoVelho = JSON.parse(await env.PADD_KV.get('bastidores/barra/curadorias') || '[]');
  await env.PADD_KV.put('bastidores/barra/curadorias', JSON.stringify(antesDoVelho.concat([
    { id: 'velho-bale-classico', professor: 'velho', modalidade: 'Balé clássico',
      tradicao: 'RAD', turmas: ['Turma A'], alunas: [], repertorio: [] },
  ])));
  const reedita = await curadoria({ professor: 'Velho', modalidade: 'Balé clássico',
    tradicao: 'Vaganova', turmas: ['Turma A'], alunas: [], repertorio: [] });
  conferir('a curadoria de id ANTIGO é editada, não duplicada', reedita.status, 201);
  const cruasVelho = JSON.parse(await env.PADD_KV.get('bastidores/barra/curadorias') || '[]')
    .filter((c) => c.professor === 'velho');
  conferir('…e continua a ser UM registo', cruasVelho.length, 1);
  conferir('…com o id antigo preservado', cruasVelho[0].id, 'velho-bale-classico');
  conferir('…e o valor novo', cruasVelho[0].tradicao, 'Vaganova');

  // Mudar a TURMA de uma curadoria livre: o id acompanha o trio, e NÃO fica um órfão.
  const mudaTurma = await curadoria({ professor: 'Velho', modalidade: 'Balé clássico',
    tradicao: 'Vaganova', turmas: ['Turma B'], alunas: [], repertorio: [], idAntigo: 'velho-bale-classico' });
  conferir('mudar a turma de uma curadoria livre é aceite', mudaTurma.status, 201);
  conferir('…e o id passa a dizer a turma nova',
    (await mudaTurma.json()).curadoria.id, 'velho-bale-classico-turma-b');
  const cruasVelho2 = JSON.parse(await env.PADD_KV.get('bastidores/barra/curadorias') || '[]')
    .filter((c) => c.professor === 'velho');
  conferir('…e NÃO sobra um órfão no id antigo', cruasVelho2.length, 1);
  conferir('…e o registo está no id novo', cruasVelho2[0].id, 'velho-bale-classico-turma-b');
  conferir('…com a turma nova', turmasDa(cruasVelho2[0])[0], 'Turma B');

  // --- 12c. A ALUNA NÃO SE REPETE NA MESMA MODALIDADE --------------------
  const repetida = await curadoria({ professor: 'Miguel', modalidade: 'Jazz',
    tradicao: 'Jazz', turmas: ['Turma B'], alunas: ['Gabi'], repertorio: [] });
  conferir('a aluna de outra turma da MESMA modalidade é recusada', repetida.status, 409);
  const erroRepetida = await repetida.json();
  conferir('…e o erro diz ONDE ela está', /Gabi \(em Turma A\)/.test(erroRepetida.erro), true);
  conferir('…e diz qual é a regra', /UMA turma por modalidade/.test(erroRepetida.erro), true);
  const noutraModalidade = await curadoria({ professor: 'Miguel', modalidade: 'Balé clássico',
    tradicao: 'RAD', turmas: ['Turma B'], alunas: ['Gabi'], repertorio: [] });
  conferir('a MESMA aluna noutra MODALIDADE é aceita', noutraModalidade.status, 201);
  const mesmoPar = await curadoria({ professor: 'Miguel', modalidade: 'Jazz',
    tradicao: 'Jazz', turmas: ['Turma B'], alunas: ['Nina'], repertorio: ['Plié'] });
  conferir('…e editar a própria curadoria com as alunas DELA é aceite (não competem consigo)',
    mesmoPar.status, 201);
  conferir('…e a Gabi continua só na Turma A — do JAZZ',
    (await (await pedir(env, '/api/bastidores/curadorias')).json()).curadorias
      .filter((c) => c.professor === 'miguel' && c.modalidade === 'Jazz'
        && (c.alunas || []).indexOf('Gabi') !== -1)
      .map((c) => turmasDa(c)[0]), ['Turma A']);

  // --- 12d. O FILTRO das alunas na PÁGINA --------------------------------
  // A página tira `ALUNAS_TODAS` do cadastro de alunas da escola — e a prova não criou nenhuma.
  for (const a of ['Gabi', 'Nina', 'Ana']) {
    await json(env, '/api/bastidores/aluna', 'POST', { apelido: a });
  }
  const paginaFiltro = await (await pedir(env, '/bastidores/producao')).text();
  const filtro = exercitarFiltroAlunas(paginaFiltro);
  // O ESTADO neste ponto: Jazz/Turma A → Gabi; Jazz/Turma B → Nina; Balé clássico/Turma B →
  // Gabi. Logo: no Jazz, Gabi e Nina estão ocupadas e só a Ana sobra; no Balé, a Gabi está
  // ocupada e a Nina (que é do Jazz) volta a poder ser escolhida — é a prova de que a regra é
  // POR MODALIDADE, e não uma lista global de quem já está em alguma turma.
  conferir('o filtro da página arranca com todas as alunas oferecidas', filtro.inicial.length >= 3, true);
  conferir('escolher a modalidade da Gabi tira-a da lista',
    filtro.comJazz.indexOf('Gabi'), -1);
  conferir('…e tira também quem está noutra turma dela', filtro.comJazz.indexOf('Nina'), -1);
  conferir('…e deixa a que está livre', filtro.comJazz.indexOf('Ana') !== -1, true);
  conferir('noutra modalidade a Nina volta à lista (a regra é por modalidade)',
    filtro.comBale.indexOf('Nina') !== -1, true);
  conferir('…e a Gabi continua fora dele (está no Balé de outra turma)',
    filtro.comBale.indexOf('Gabi'), -1);
  conferir('a ficha de uma aluna que passa a estar ocupada SAI do formulário',
    filtro.fichaSaiu, true);
  conferir('…e a página diz onde ela está', /Turma A/.test(filtro.aviso), true);

  // --- 13. o «Editar»/«Derivar» da curadoria, no SCRIPT SERVIDO ----------
  // O markup já está conferido acima; aqui corre-se o script da página e chamam-se as funções.
  // O que se trava: o par professor × modalidade fica TRAVADO nos dois modos (é ele que
  // identifica a curadoria — o id nasce dele), a data só aparece no «Derivar», e as fichas de
  // alunas e repertório são preenchidas com o que está gravado.
  const cen = exercitarCuradoria(pagina2, derivada.id);
  conferir('o script da página exercita as curadorias', cen.ok, true);
  conferir('«Editar» põe o modo e esconde a data', [cen.editar.modo, cen.editar.vigenciaOculta],
    ['editar', true]);
  conferir('…e o botão passa a «Gravar curadoria»', cen.editar.botao, 'Gravar curadoria');
  conferir('…e trava o par que identifica a curadoria',
    [cen.editar.professorTravado, cen.editar.modalidadeTravada], [true, true]);
  conferir('…e preenche o que está gravado',
    [cen.editar.professor, cen.editar.modalidade, cen.editar.turma, cen.editar.tradicao],
    ['leticia', 'Balé Clássico', 'Turma A', 'RAD']);
  conferir('…e as alunas e o repertório voltam como fichas',
    [cen.editar.alunas, cen.editar.repertorio], [['Ana'], ['Tendu']]);
  conferir('«Derivar» põe o modo e MOSTRA a data', [cen.derivar.modo, cen.derivar.vigenciaOculta],
    ['derivar', false]);
  conferir('…e o botão passa a «Gravar ajuste»', cen.derivar.botao, 'Gravar ajuste');
  conferir('…e a data nasce com hoje (o caso normal: corrigir agora)',
    /^\d{4}-\d{2}-\d{2}$/.test(cen.derivar.vigencia), true);

  // --- 14. a hora só se habilita para o dia escolhido (a página) ---------
  // Este bloco roda o SCRIPT SERVIDO num DOM de mentira, com as sete pílulas e os sete campos
  // de hora. O que se trava: o campo nasce desabilitado, habilitar é consequência de marcar o
  // dia, e desmarcar LIMPA — o horário não fica escrito ao lado de uma pílula apagada.
  const cenario = exercitarHoras(pagina);
  conferir('as sete horas nascem desabilitadas', cenario.iniciais.every((d) => d), true);
  conferir('marcar a terça habilita SÓ a hora da terça',
    cenario.aposMarcarTer.filter((d) => !d).length, 1);
  conferir('…e é a da terça, não outra', cenario.aposMarcarTer[1], false);
  cenario.escrever(1, '09:30');
  conferir('a hora escrita entra no mapa do formulário',
    cenario.horarios()[1], 'ter 09:30');
  cenario.desmarcar(1);
  conferir('desmarcar a terça volta a desabilitar a hora', cenario.final()[1], true);
  conferir('…e LIMPA o que estava escrito', cenario.valores()[1], '');
  conferir('…e o mapa deixa de a ter', 'ter' in cenario.horarios(), false);

  // --- relatório ----------------------------------------------------------
  let falhas = 0;
  for (const c of casos) {
    if (c.ok) {
      console.log('ok     ' + c.nome);
    } else {
      falhas += 1;
      console.log('FALHA  ' + c.nome +
        '\n         obtido:   ' + JSON.stringify(c.obtido) +
        '\n         esperado: ' + JSON.stringify(c.esperado));
    }
  }
  console.log('\nprovar-derivacao-da-turma: ' + (casos.length - falhas) + ' de ' + casos.length +
    ' passaram');
  return falhas ? 1 : 0;
}


/**
 * Roda o script servido com as sete pílulas dos dias e os sete campos de hora, e devolve o
 * estado em cada passo. O DOM é de mentira: só o que `sincronizarHoras` e `horariosDoDia` usam.
 */
function turmasDa(c) { return (c && c.turmas && c.turmas.length) ? c.turmas : []; }

function exercitarHoras(html) {
  const fs = require('fs');
  const vm = require('vm');
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).filter((c) => c.includes('sincronizarHoras')).join('\n') ||
    fs.readFileSync(__filename, 'utf8'); // (não usado: o script vem da página servida)
  const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  const dias = DIAS.map((d) => ({ name: 'dia', value: d, checked: false }));
  const horas = DIAS.map((d) => ({ value: '', disabled: false, getAttribute: (k) => (k === 'data-dia' ? d : null) }));
  const elementos = new Map();
  const doId = (id) => {
    if (!elementos.has(id)) {
      elementos.set(id, { id, value: '', hidden: false, readOnly: false, textContent: '', innerHTML: '',
        scrollIntoView() {}, focus() {}, setAttribute() {}, getAttribute() { return null; },
        closest() { return null; }, addEventListener() {}, querySelector() { return null; },
        querySelectorAll() { return []; } });
    }
    return elementos.get(id);
  };
  const ouvintes = {};
  const documento = {
    getElementById: doId,
    addEventListener(tipo, fn) { (ouvintes[tipo] = ouvintes[tipo] || []).push(fn); },
    querySelectorAll(sel) {
      if (sel === '.hora-do-dia') return horas;
      if (sel === 'input[name="dia"]') return dias;
      return [];
    },
    querySelector(sel) {
      const m = sel.match(/\[value="([^"]+)"\]/);
      if (sel.includes('name="dia"')) return m ? dias.find((d) => d.value === m[1]) || null : null;
      return null;
    },
    createElement: () => ({ setAttribute() {}, getAttribute() { return null; }, appendChild() {}, style: {} }),
  };
  const ctx = { document: documento, window: { addEventListener() {} }, location: { reload() {}, hash: '' },
    console: { log() {}, error() {}, warn() {} }, alert() {}, setTimeout, clearTimeout,
    fetch: () => Promise.resolve({ json: () => Promise.resolve({ ok: true }) }),
    JSON, Date, Math, String, Number, Array, Object, encodeURIComponent, decodeURIComponent };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);

  const disparar = (alvo) => (ouvintes.change || []).forEach((fn) => fn({ target: alvo }));
  return {
    iniciais: horas.map((h) => h.disabled),
    aposMarcarTer: (() => { dias[1].checked = true; disparar(dias[1]); return horas.map((h) => h.disabled); })(),
    escrever: (i, v) => { horas[i].value = v; },
    desmarcar: (i) => { dias[i].checked = false; disparar(dias[i]); },
    final: () => horas.map((h) => h.disabled),
    valores: () => horas.map((h) => h.value),
    // O mapa que o formulário envia, na forma legível: { ter: '09:30' }.
    horarios: () => {
      const mapa = vm.runInContext('horariosDoDia()', ctx);
      const saida = {};
      for (const k of Object.keys(mapa)) saida[DIAS.indexOf(k)] = k + ' ' + mapa[k];
      return saida;
    },
  };
}


/**
 * Corre o script servido num DOM de mentira e exercita o `ajustarCuradoria` nos dois modos,
 * devolvendo o que ficou em cada campo. É a única forma de provar o comportamento sem um
 * navegador — e é o que apanharia um id trocado no `getElementById`.
 */
function exercitarCuradoria(html, id) {
  const vm = require('vm');
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
  const elementos = new Map();
  const fichas = {}; // id do escolhedor → array de fichas
  const doId = (idEl) => {
    if (!elementos.has(idEl)) {
      elementos.set(idEl, {
        id: idEl, value: '', hidden: false, disabled: false, readOnly: false,
        textContent: '', innerHTML: '', ouvintes: {},
        addEventListener(tipo, fn) { (this.ouvintes[tipo] = this.ouvintes[tipo] || []).push(fn); },
        setAttribute() {}, getAttribute() { return null; }, focus() {},
        scrollIntoView() {}, closest() { return null; },
        appendChild() {}, querySelector() { return null; },
        querySelectorAll(sel) {
          if (sel === '.escolhido') return fichas[this.id] || [];
          return [];
        },
      });
    }
    return elementos.get(idEl);
  };
  // Os escolhedores das fichas: `fichasDe` lê `.ficha[data-valor]`; `adicionarFicha` cria.
  const criarEscolhedor = (idEl) => {
    fichas[idEl] = [];
    const el = doId(idEl);
    el.querySelector = (sel) => {
      if (sel === '.escolhidos') return { appendChild: (f) => { fichas[idEl].push(f); } };
      if (sel === '.escolhidos .vazio') return { hidden: false };
      return null;
    };
    el.querySelectorAll = (sel) => (sel === '.escolhido' ? fichas[idEl] : []);
    return el;
  };
  criarEscolhedor('esc-alunas');
  criarEscolhedor('esc-repertorio');
  const documento = {
    getElementById: doId,
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    createElement: () => ({
      className: '', textContent: '', type: '', title: '', parentElement: { removeChild() {} },
      setAttribute(k, v) { this['_' + k] = v; if (k === 'data-valor') this._valor = v; },
      getAttribute(k) { return this['_' + k]; }, appendChild() {},
    }),
  };
  const ctx = { document: documento, window: { addEventListener() {} },
    location: { reload() {}, hash: '' }, console: { log() {}, error() {}, warn() {} },
    alert() {}, setTimeout, clearTimeout,
    fetch: () => Promise.resolve({ json: () => Promise.resolve({ ok: true }) }),
    JSON, Date, Math, String, Number, Array, Object, encodeURIComponent, decodeURIComponent };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);

  const ler = (modo) => {
    ctx.ajustarCuradoria(id, modo);
    return {
      modo: doId('cumodo').value,
      vigenciaOculta: doId('cu-vigencia-campo').hidden,
      botao: doId('cu-enviar').textContent,
      professorTravado: doId('cuprofessor').disabled,
      modalidadeTravada: doId('cumodalidade').disabled,
      professor: doId('cuprofessor').value,
      modalidade: doId('cumodalidade').value,
      turma: doId('cuturma').value,
      tradicao: doId('cutradicao').value,
      vigencia: doId('cuvigencia').value,
      alunas: (fichas['esc-alunas'] || []).map((f) => f._valor),
      repertorio: (fichas['esc-repertorio'] || []).map((f) => f._valor),
    };
  };
  return { ok: typeof ctx.ajustarCuradoria === 'function', editar: ler('editar'), derivar: ler('derivar') };
}


/**
 * Corre o script servido num DOM de mentira e exercita o `refiltrarAlunas`: o menu de alunas
 * tem de perder quem já está noutra turma da modalidade escolhida, e uma ficha que passou a
 * estar ocupada tem de SAIR (é o caso de trocar a modalidade depois de a escolher).
 */
function exercitarFiltroAlunas(html) {
  const vm = require('vm');
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
  const elementos = new Map();
  const fichas = [];
  let aviso = '';
  const doId = (id) => {
    if (!elementos.has(id)) {
      elementos.set(id, {
        id, value: '', hidden: false, disabled: false, textContent: '', className: '',
        addEventListener() {}, setAttribute() {}, getAttribute() { return null; },
        focus() {}, scrollIntoView() {}, closest() { return null; }, appendChild() {},
        querySelector() { return null; }, querySelectorAll() { return []; },
      });
    }
    return elementos.get(id);
  };
  // O menu das alunas, com `<option>`s de verdade (o filtro reconstrói-o).
  // `options` é o array do `<select>`: a opção 0 é o «— escolher —», e o resto são as alunas.
  // Um array só — com dois, os índices do `remove` saíam desalinhados e o filtro parecia não
  // filtrar (a prova estaria a medir o shim, não o código).
  const options = [{ value: '' }];
  const sel = { options,
    remove(i) { options.splice(i, 1); },
    appendChild(o) { options.push(o); } };
  const esc = doId('esc-alunas');
  esc.querySelector = (s) => {
    if (s === 'select.opcoes') return sel;
    if (s === '.escolhidos') return { appendChild: (f) => fichas.push(f) };
    if (s === '.escolhidos .vazio') return { hidden: false };
    return null;
  };
  esc.querySelectorAll = (s) => (s === '.escolhido' ? fichas.slice() : []);
  const documento = {
    getElementById: doId, addEventListener() {}, querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement: () => ({ className: '', textContent: '', value: '', type: '', title: '',
      parentElement: { removeChild(f) { const i = fichas.indexOf(f); if (i !== -1) fichas.splice(i, 1); } },
      setAttribute(k, v) { this['_' + k] = v; if (k === 'data-valor') this._valor = v; },
      getAttribute(k) { return this['_' + k]; }, appendChild() {} }),
  };
  const ctx = { document: documento, window: { addEventListener() {} },
    location: { reload() {}, hash: '' }, console: { log() {}, error() {}, warn() {} },
    alert() {}, setTimeout, clearTimeout,
    fetch: () => Promise.resolve({ json: () => Promise.resolve({ ok: true }) }),
    JSON, Date, Math, String, Number, Array, Object, encodeURIComponent, decodeURIComponent };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const valorDoMenu = () => options.map((o) => o.value).filter(Boolean);
  const inicial = valorDoMenu();
  const escolher = (modalidade) => { doId('cumodalidade').value = modalidade; ctx.refiltrarAlunas(); };
  escolher('Jazz');
  const comJazz = valorDoMenu();
  escolher('Balé clássico');
  const comBale = valorDoMenu();
  // Uma ficha da Gabi, e depois troca para Jazz (onde ela já está).
  fichas.push({ getAttribute: (k) => (k === 'data-valor' ? 'Gabi' : null),
    parentElement: { removeChild(f) { const i = fichas.indexOf(f); if (i !== -1) fichas.splice(i, 1); } } });
  escolher('Jazz');
  const fichaSaiu = fichas.every((f) => f.getAttribute('data-valor') !== 'Gabi');
  aviso = doId('res').textContent || '';
  return { inicial, comJazz, comBale, fichaSaiu, aviso };
}

if (require.main === module) {
  principal()
    .then((codigo) => { process.exitCode = codigo; })
    .catch((e) => { console.error('erro: ' + e.message); console.error(e.stack); process.exitCode = 1; });
}
