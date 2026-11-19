'use strict';

/**
 * provar-regua-do-professor.js — A RÉGUA É DELE (19/11/2026).
 *
 * O PEDIDO, na letra dela:
 *
 *   «O step dois deixa de existir em salas. Todo o step dois, ele passa a ir para professores. […]
 *    Vai ter que criar mais uma aba ali […] do lado da aba cadastro de professor e antes da aba
 *    habilitações. […] Apenas vai aparecer o nome do professor, a tradição que ele ensina, o nome
 *    que tem que colocar a rubrica […] os níveis, o acrescentar nível e o remover este nível.»
 *
 *   «Na sala, o associar passa a ser associar o professor pela modalidade e o professor. E aí que é
 *    assim que a sala sabe qual é a rubrica, pela associação ao professor.»
 *
 * O QUE SE MEDE AQUI, e porquê:
 *
 *   A. A RÉGUA GRAVA NO REGISTO DA PESSOA — e não numa lista da escola com um dono ao lado. O
 *      principal é o caso que se parte primeiro: ele não está na lista `professores`, vive em
 *      `bastidores/<escola>/dono`, e escrever a régua dele no sítio errado criaria um segundo dono.
 *   B. A ABA EXISTE, ENTRE O CADASTRO E AS HABILITAÇÕES, e tem as peças que ela nomeou: o nome (em
 *      foco), a tradição (leitura), o nome da régua (campo), os níveis, o «Acrescentar» e o «✕».
 *   C. AS SALAS FICAM COM DOIS PASSOS, e o «Associar» pergunta QUEM dá a sala — a régua vem com ele.
 *   D. A RÉGUA QUE A SALA APLICA passa a ser a do professor, lida pelo MESMO resolvedor que o
 *      plano, a porta e o cartão usam (`reguaDaSala`). É a asserção que impede o desfecho silencioso:
 *      uma sala concluída por um professor sem régua mediria contra a escala padrão da escola, e
 *      ninguém saberia — a régua padrão também tem níveis.
 *   E. O «AVANÇAR» DO CADASTRO LEVA AO PASSO 2, e o «CANCELAR» aparece em edição nas duas abas.
 *
 *   node experimentos/provar-regua-do-professor.js
 */

const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
/* A RÉGUA PADRÃO, do núcleo — a mesma que o servidor usa quando nenhum professor a dá. Lida da
 * fonte e não escrita à mão: uma lista copiada para a prova deixa de medir no dia em que a fonte
 * mudar, e passaria a afirmar o que já não é verdade. */
const { NIVEIS_DA_RUBRICA } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));

const BASE = 'https://escola-de-prova.tmenegaz77.workers.dev';
const SENHA = 'senha-da-direcao';
const ESCOLA = 'escola-de-prova';
const DONO = 'demi-plie';
const OUTRO = 'redinha-rosa';
const SALA = 'Rosa';

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
    PROFESSOR_SLUG: DONO,
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
  dias: ['seg', 'qua'], horarios: { seg: '18:00', qua: '18:00' },
  duracaoMin: 45, periodoInicio: '2027-03-03', periodoFim: '2027-06-30',
};

async function salas(env) {
  const bruto = await env.PADD_KV.get('bastidores/' + ESCOLA + '/turmas');
  const lista = bruto ? JSON.parse(bruto) : [];
  return Array.isArray(lista) ? lista : [];
}

(async () => {
  const env = ambiente();

  // -------------------------------------------------------------------------------------------
  bloco('A. A RÉGUA GRAVA NO REGISTO DA PESSOA — e o principal não é excepção');

  // O principal existe antes de qualquer rota: numa escola criada pela página é ele que dá aula.
  await env.PADD_KV.put('bastidores/' + ESCOLA + '/dono',
    JSON.stringify({ nome: 'Demi Plie', slug: DONO, professor_hash: 'h', professor_sal: 's' }));
  await env.PADD_KV.put('bastidores/' + ESCOLA + '/professores',
    JSON.stringify([{ nome: 'Redinha Rosa', slug: OUTRO, sal: 'a', hash: 'b' }]));

  const semNome = await postar(env, '/api/bastidores/rubrica-do-professor',
    { professor: DONO, niveis: ['Ótimo'] });
  provar('sem nome da régua é recusado, e a frase diz o que falta', semNome.status === 400,
    { status: semNome.status, erro: semNome.corpo && semNome.corpo.erro });
  const semNiveis = await postar(env, '/api/bastidores/rubrica-do-professor',
    { professor: DONO, nome: 'Padrão' });
  provar('sem níveis é recusado — a régua vazia mediria contra nada', semNiveis.status === 400,
    { status: semNiveis.status, erro: semNiveis.corpo && semNiveis.corpo.erro });
  const fantasma = await postar(env, '/api/bastidores/rubrica-do-professor',
    { professor: 'ninguem-desta-escola', nome: 'X', niveis: ['A'] });
  provar('um professor que não é desta escola é recusado (404), e o slug é nomeado',
    fantasma.status === 404 && /ninguem-desta-escola/.test(String(fantasma.corpo && fantasma.corpo.erro)),
    { status: fantasma.status, erro: fantasma.corpo && fantasma.corpo.erro });

  const doDono = await postar(env, '/api/bastidores/rubrica-do-professor', {
    professor: DONO, nome: 'Padrão da casa', niveis: ['Satisfatório', 'Em desenvolvimento', 'Não se aplica'],
  });
  provar('a régua do principal é gravada', doDono.status === 200 && doDono.corpo.ok,
    { status: doDono.status, erro: doDono.corpo && doDono.corpo.erro });
  const registoDoDono = JSON.parse(await env.PADD_KV.get('bastidores/' + ESCOLA + '/dono'));
  provar('…e vai para o registo DELE (`dono`), e não para a lista de professores',
    !!(registoDoDono.rubrica && registoDoDono.rubrica.nome === 'Padrão da casa'),
    registoDoDono.rubrica);
  provar('…sem lhe apagar o que já lá estava (a senha continua onde estava)',
    registoDoDono.professor_hash === 'h' && registoDoDono.professor_sal === 's', registoDoDono);
  const listaProfs = JSON.parse(await env.PADD_KV.get('bastidores/' + ESCOLA + '/professores'));
  provar('…e a lista de professores não ganhou um segundo dono', listaProfs.length === 1,
    listaProfs.map((p) => p.slug));

  const doOutro = await postar(env, '/api/bastidores/rubrica-do-professor', {
    professor: OUTRO, nome: 'Régua da Redinha', niveis: ['Ótimo', 'Bom', 'Regular'],
  });
  provar('a régua de um professor cadastrado é gravada', doOutro.status === 200,
    { status: doOutro.status, erro: doOutro.corpo && doOutro.corpo.erro });

  // -------------------------------------------------------------------------------------------
  bloco('\nB. A ABA EXISTE, E É O PASSO 2 DO CADASTRO');

  const pagina = bastidores.paginaProducao(ESCOLA, {}, [], [], 'Demi Plie', DONO,
    [], [], {}, [], [], [], { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, null, [], new Set(),
    { ok: true, contrato: { plano: 'avancado', capacidade: {} } });

  /* TRÊS ABAS E DOIS PASSOS (19/11/2026) — «vão ter só três abas, cadastro do professor,
   * habilitações e desligamento e vão ter dois steps, o cadastro e a rubrica». A régua esteve aqui
   * como quarta aba por poucas horas; a correcção é dela, e é de leitura: aba é o que se abre em
   * qualquer ordem, passo é o que tem ordem — e a régua só existe depois de a pessoa existir. */
  const abas = (pagina.match(/id="pf-aba-([a-z]+)"/g) || []).map((x) => x.replace(/^.*pf-aba-|"$/g, ''));
  provar('as abas do professor são três: cadastro, habilitações e desligamento',
    JSON.stringify(abas) === JSON.stringify(['cadastro', 'habilitacoes', 'desligamento']), abas);
  const passosProf = (pagina.match(/data-passo-prof="([a-z]+)"/g) || [])
    .map((x) => x.replace(/^.*data-passo-prof="|"$/g, ''));
  provar('…e o cadastro tem dois passos: cadastro e rubrica',
    JSON.stringify(passosProf) === JSON.stringify(['cadastro', 'rubrica']), passosProf);
  provar('o painel da régua existe, dentro do cadastro', /id="passo-prof-rubrica"/.test(pagina), null);
  provar('…e o do cadastro também', /id="passo-prof-cadastro"/.test(pagina), null);
  /* A TIRA FICA FORA DA ABA, ACIMA DELA — COMO NA AUDIÇÃO (19/11/2026).
   *
   * «Em professores, você colocou os steps dentro de cadastro. Ele é acima do cadastro, ele é fora
   * do cadastro.» A referência é a Audição, onde a faixa dos passos é a PRIMEIRA linha do corpo:
   * irmã do `.col-form`, antes das abas. O que esta asserção afirma, então, é o contrário do que
   * afirmava antes — e mede a ordem real: a tira antes da abertura do painel do cadastro, e essa
   * antes das habilitações. */
  const iPasso = pagina.indexOf('id="pf-passos"');
  const iPainelCad = pagina.indexOf('id="pf-painel-cadastro"');
  const iPainelHab = pagina.indexOf('id="pf-painel-habilitacoes"');
  provar('a tira fica ACIMA da aba do cadastro — fora dela, como na Audição',
    iPasso < iPainelCad && iPainelCad < iPainelHab, { iPasso, iPainelCad, iPainelHab });
  provar('…e continua a ser uma faixa (o embrulho que recolhe com o corpo)',
    /class="turmas-faixa" id="pf-faixa"/.test(pagina), null);
  /* A FAIXA É IRMÃ DO `.col-form` — é isso que a põe acima das abas e não dentro de uma delas. */
  const iFaixa = pagina.indexOf('id="pf-faixa"');
  const iColForm = pagina.indexOf('id="professores-miolo"');
  provar('…e vem imediatamente antes da coluna que tem as abas',
    iFaixa < iColForm && iColForm - iFaixa < 600, { iFaixa, iColForm });

  provar('o nome do professor em foco é mostrado (e não um select de nomes)',
    /id="rubr-prof-nome"/.test(pagina) && !/id="rubr-professor"/.test(pagina), null);
  provar('a tradição que ele ensina é LEITURA', /id="rubr-tradicao"/.test(pagina), null);
  provar('o nome da régua é um CAMPO para escrever', /<input id="rubr-nome"/.test(pagina), null);
  provar('os níveis têm o editor', /id="rubr-niveis"/.test(pagina), null);
  provar('…com o «Acrescentar nível»', /id="rubr-add"[^>]*>Acrescentar nível</.test(pagina), null);
  provar('…e cada nível com o «Remover» (o ✕ que já existe na peça)',
    /tirar-regua/.test(pagina), null);
  provar('o fim do passo diz «Gravar cadastrar professor»',
    /id="rubr-gravar"[^>]*>Gravar cadastrar professor</.test(pagina), null);
  provar('…e tem o seu «Cancelar»', /id="rubr-cancelar"/.test(pagina), null);
  provar('o passo 1 do cadastro diz «Avançar» — e não «Cadastrar professor»',
    /id="prof-enviar"[^>]*>Avançar</.test(pagina), null);
  provar('…e tem o «Cancelar» ao lado', /id="prof-cancelar"/.test(pagina), null);

  // -------------------------------------------------------------------------------------------
  bloco('\nC. AS SALAS FICAM COM DOIS PASSOS, E O ASSOCIAR PERGUNTA QUEM DÁ A SALA');

  const passos = (pagina.match(/data-passo="[a-z]+"/g) || [])
    .map((s) => s.replace(/^data-passo="|"$/g, ''));
  provar('as salas têm dois passos: sala e associar',
    JSON.stringify(passos) === JSON.stringify(['turma', 'vincular']), passos);
  provar('o painel da régua saiu das salas', !/id="passo-rubrica"/.test(pagina), null);
  provar('…e com ele o editor da régua e o select de rubricas',
    !/id="form-rubrica"/.test(pagina) && !/id="vinc-rubrica"/.test(pagina), null);
  provar('o passo 2 pergunta o professor', /<select id="vinc-professor"/.test(pagina), null);
  provar('…e mostra a tradição e a régua dele em leitura',
    /id="vinc-tradicao"/.test(pagina) && /id="vinc-regua"/.test(pagina), null);
  provar('o gesto que conclui continua a ser «Gravar sala»',
    /id="vinc-gravar"[^>]*>Gravar sala</.test(pagina), null);

  // -------------------------------------------------------------------------------------------
  bloco('\nD. A RÉGUA QUE A SALA APLICA É A DO PROFESSOR — a mesma que o plano lê');

  /* O PASSO 1 JÁ NÃO MANDA MODALIDADE (19/11/2026) — «essa modalidade da sala não existe mais aqui.
   * E o associar […] aqui é que vem a modalidade da sala». A sala nasce com o RITMO e mais nada; o
   * par (modalidade, professor) entra no passo 2, no mesmo acto. */
  const sala = await postar(env, '/api/bastidores/turma', Object.assign({ nome: SALA }, RITMO));
  provar('a sala é criada só com o ritmo — sem modalidade no passo 1', sala.status === 201 || sala.status === 200,
    { status: sala.status, erro: sala.corpo && sala.corpo.erro });
  const gravada = (await salas(env)).find((t) => t.nome === SALA);
  provar('…e nasce SEM modalidade, SEM professor e SEM vínculo de rubrica (o passo 2 traz os três)',
    !gravada.professor && !gravada.rubricaId && !gravada.modalidade,
    { professor: gravada.professor, rubricaId: gravada.rubricaId, modalidade: gravada.modalidade });

  const antes = await pedir(env, '/api/bastidores/turmas');
  const antesSala = (antes.corpo.turmas || []).find((t) => t.nome === SALA);
  provar('antes de o professor ser associado, a régua é o padrão da escola',
    Array.isArray(antesSala.rubrica) && antesSala.rubrica[0] === NIVEIS_DA_RUBRICA[0],
    antesSala.rubrica);

  /* SEM MODALIDADE O PASSO 2 NÃO CONCLUI — e a recusa é a primeira das duas escolhas, não a
   * segunda: é a modalidade que diz quem a pode dar. */
  const semModalidade = await postar(env, '/api/bastidores/turma-professor', {
    turma: gravada.id, professor: OUTRO, concluir: true,
  });
  provar('sem modalidade a sala não conclui (400)', semModalidade.status === 400,
    { status: semModalidade.status, erro: semModalidade.corpo && semModalidade.corpo.erro });
  provar('…e a falta nomeada é a modalidade', JSON.stringify(semModalidade.corpo.falta) === JSON.stringify(['modalidade']),
    semModalidade.corpo && semModalidade.corpo.falta);

  const associada = await postar(env, '/api/bastidores/turma-professor', {
    turma: gravada.id, modalidade: 'Balé clássico', professor: OUTRO, concluir: true,
  });
  provar('«Gravar sala» associa a modalidade e o professor', associada.status === 200 && associada.corpo.ok,
    { status: associada.status, erro: associada.corpo && associada.corpo.erro });
  const depois = await pedir(env, '/api/bastidores/turmas');
  const depoisSala = (depois.corpo.turmas || []).find((t) => t.nome === SALA);
  provar('…e a régua da sala passa a ser a DELE, com os níveis dele',
    JSON.stringify(depoisSala.rubrica) === JSON.stringify(['Ótimo', 'Bom', 'Regular']),
    depoisSala.rubrica);
  const gravada2 = (await salas(env)).find((t) => t.nome === SALA);
  provar('…e a sala passa a declarar quem a dá', gravada2.professor === OUTRO, gravada2.professor);
  provar('…e que modalidade aí acontece — o par grava-se numa escrita só',
    gravada2.modalidade === 'Balé clássico', gravada2.modalidade);

  /* A SALA SEM RÉGUA NÃO CONCLUI — e a recusa diz o caminho. É a guarda que impede o desfecho
   * silencioso: sem ela, a sala cairia na régua padrão e o documento sairia medido contra uma
   * escala que não é a de quem dá a aula. */
  const outro = await postar(env, '/api/bastidores/turma', Object.assign({ nome: 'Estúdio' }, RITMO));
  provar('uma segunda sala é criada', outro.status === 201 || outro.status === 200,
    { status: outro.status, erro: outro.corpo && outro.corpo.erro });
  const semRegua = (await salas(env)).find((t) => t.nome === 'Estúdio');
  await env.PADD_KV.put('bastidores/' + ESCOLA + '/professores',
    JSON.stringify([{ nome: 'Redinha Rosa', slug: OUTRO, sal: 'a', hash: 'b' },
      { nome: 'Sem Régua', slug: 'sem-regua', sal: 'c', hash: 'd' }]));
  const recusada = await postar(env, '/api/bastidores/turma-professor', {
    turma: semRegua.id, modalidade: 'Balé clássico', professor: 'sem-regua', concluir: true,
  });
  provar('um professor sem régua não conclui a sala (400)', recusada.status === 400,
    { status: recusada.status, erro: recusada.corpo && recusada.corpo.erro });
  provar('…e a frase diz o NOME dele e onde se compõe',
    /Sem Régua/.test(String(recusada.corpo.erro)) && /passo «Rubrica»/.test(String(recusada.corpo.erro)),
    recusada.corpo && recusada.corpo.erro);
  const semProfessor = await postar(env, '/api/bastidores/turma-professor',
    { turma: semRegua.id, modalidade: 'Balé clássico' });
  provar('e sem professor a sala também não conclui', semProfessor.status === 400,
    { status: semProfessor.status, erro: semProfessor.corpo && semProfessor.corpo.erro });

  // -------------------------------------------------------------------------------------------
  console.log('\n' + (falhas ? 'FALHAS: ' + falhas + ' de ' + total : 'tudo certo: ' + total + '/' + total));
  process.exit(falhas ? 1 : 0);
})();
