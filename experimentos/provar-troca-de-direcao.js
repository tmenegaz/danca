#!/usr/bin/env node
'use strict';

/*
 * provar-troca-de-direcao.js — TROCAR O PROFESSOR É UM AJUSTE DA MESMA TURMA; MUDAR DE SALA
 * NÃO É (10/11/2026).
 *
 * O QUE MOTIVOU. A pesquisadora abriu «derivar» numa Turma da sala Rosa, trocou o PROFESSOR
 * (Pé Torto → Redinha Rosa) e gravou. O que ficou gravado foi uma Turma na sala PIANO: a Rosa
 * perdeu a direção, e a Piano nasceu sem plano de ensino, sem PO e sem documentos. A cadeia
 * respondeu, com verdade, «A Turma «Piano» ainda não tem plano de ensino. O primeiro nasce na
 * porta». Lido por quem acabara de trocar um professor, isso diz «criei outra escola».
 *
 * O QUE SE MEDIU NO AR, antes de tocar no código (KV da escola `calango`, 10/11/2026):
 *
 *   - quatro travessias `troca-de-direcao` no log da cadeia — duas em «Rosa» e duas em «Piano»;
 *     a última, `Piano → redinha-rosa`, é a que a pesquisadora leu;
 *   - a lista de curadorias com DOIS registos no mesmo `id` (`pe-torto-bale-classico-rosa`), e
 *     um `substituidaPor` a apontar para `pe-torto-bale-classico-piano-2026-11-10`, que não
 *     existe em lado nenhum.
 *
 * As duas coisas nascem da mesma porta: a derivação aceitava mudar a SALA, e a rota de edição
 * renomeava o `id` para o trio novo sem conferir se ele já era de outro nem arrastar quem
 * apontava para o antigo.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. TROCAR O PROFESSOR É UM AJUSTE. Mesma sala, professor novo → 201, o elo novo nasce com o
 *      professor novo e o MESMO nome de sala, e o anterior desce ao histórico a apontar para ele.
 *      É o gesto que a pesquisadora queria, e ele nunca esteve fechado — estava era escondido
 *      atrás do arrasto da sala.
 *   B. MUDAR DE SALA NÃO É UM AJUSTE — quando a sala de origem já tem plano. 409, com a frase
 *      que diz o que se perde, e NADA é gravado: a Turma de origem continua a ser a vigente.
 *      A troca continua a valer enquanto a Turma for LIVRE (é o caso que a prova da derivação da
 *      turma já cobria, e que aqui se guarda como controle).
 *   C. A SALA QUE JÁ NÃO EXISTE NÃO PRENDE A TURMA: apagada do cadastro, mudar de sala é a única
 *      saída, e a derivação aceita-a.
 *   D. O ID NUNCA SE REPETE. Editar uma Turma livre mudando-lhe a sala renomeia o registo; se o
 *      id do trio de destino já é de outro elo, a resposta é 409 e a lista fica intacta.
 *   E. O PONTEIRO ACOMPANHA A RENOMEAÇÃO. Quando a renomeação acontece, quem apontava para o id
 *      antigo (`substituidaPor`, `substitui`) passa a apontar para o novo — nenhum ponteiro
 *      morto, que é o que fazia o `topoDoElo` chamar «vigente» a um elo já substituído.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): corre as MESMAS provas contra o `motor/` de
 * `REF_NEGATIVO` (por omissão `HEAD`), num diretório à parte. O código de antes aceita a mudança
 * de sala, duplica o id e deixa o ponteiro morto — se passasse, a prova não provava nada.
 *
 * SEM REDE: o KV é de memória e o repositório não é consultado (o `GITHUB_TOKEN` vai vazio).
 *
 *   node experimentos/provar-troca-de-direcao.js
 *   REF_NEGATIVO=HEAD node experimentos/provar-troca-de-direcao.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ESCOLA = 'prova';
const DONO = 'pe-torto';
const OUTRO = 'redinha-rosa';
const SALA = 'Rosa';
const SALA_LIVRE = 'Piano';
const VIGENTE = 'pe-torto-bale-classico-rosa-2026-11-10';

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/** Um KV de mentira com a forma do verdadeiro (get/put/delete/list). */
function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    _dados: dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, v); return { ok: true }; },
    async delete(k) { dados.delete(k); },
    async list() { return { keys: [...dados.keys()].map((name) => ({ name })), list_complete: true }; },
  };
}

const sala = (extra) => Object.assign({
  id: 'rosa', nome: SALA, ordem: -1, frequencia: 3,
  dias: ['ter', 'qui', 'sáb'], horarios: { ter: '19:00', qui: '19:00', 'sáb': '19:00' },
  duracaoMin: 60, periodoInicio: '2026-11-20', periodoFim: '2026-12-20', ativo: true,
}, extra || {});

const salaPiano = (extra) => sala(Object.assign({ id: 'piano', nome: SALA_LIVRE, ordem: -2 }, extra || {}));

const curadoria = (extra) => Object.assign({
  id: 'pe-torto-bale-classico-rosa', professor: DONO, modalidade: 'Balé clássico',
  tradicao: 'RAD', grau: '', nivel: '1', nivelReferencia: 'Grade 1',
  turmas: [SALA], linhaDeBase: null, linhaDeBaseNome: null, repertorio: [], alunas: [],
}, extra || {});

/** O envelope que dá à sala um plano de ensino — é ele que faz a Turma deixar de ser livre. */
function envelopeDoPlano(id, turma, professor) {
  return {
    id, gerado_em: '2026-11-09T23:41:00.000Z',
    contexto: { escola: ESCOLA, professor, ciclo: '01', turma },
    respostas: {
      'contexto-turma': { valor: turma },
      'contexto-professor': { valor: professor },
    },
  };
}

/** A ponte dos Bastidores com o KV semeado. O repositório não é consultado. */
function bastidoresDe(motor, semente) {
  const b = require(path.join(motor, 'servidor/bastidores.js'));
  const kv = kvDeMentira(semente);
  const env = {
    ESCOLA_SLUG: ESCOLA, PADD_KV: kv, FUSO: 'America/Sao_Paulo',
    SENHA_ADMIN: 'prova', GITHUB_TOKEN: '',
  };
  const pedir = async (caminho, corpo) => {
    const resposta = await b.fetch(new Request(
      'https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) }),
    env);
    const texto = await resposta.text();
    let json = null;
    try { json = JSON.parse(texto); } catch (erro) { json = null; }
    return { status: resposta.status, json };
  };
  const ler = async (chave) => JSON.parse((await kv.get('bastidores/' + ESCOLA + '/' + chave)) || '[]');
  return { pedir, ler };
}

/** A INVARIANTE DA LISTA: ids distintos, e nenhum ponteiro para o vazio. */
function invariantes(lista) {
  const ids = lista.map((c) => c && c.id);
  const repetidos = [...new Set(ids.filter((i, k) => ids.indexOf(i) !== k))];
  const mortos = lista
    .filter((c) => c && ((c.substituidaPor && ids.indexOf(c.substituidaPor) === -1)
      || (c.substitui && ids.indexOf(c.substitui) === -1)))
    .map((c) => c.id);
  return { repetidos, mortos };
}

function sementeComPlano() {
  return {
    ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([
      curadoria({ substituidaPor: VIGENTE, substituidaEm: '2026-11-10' }),
      curadoria({ id: VIGENTE, vigenteDe: '2026-11-10', substitui: 'pe-torto-bale-classico-rosa' }),
    ]),
    ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([sala(), salaPiano()]),
    [ESCOLA + '/envelope/plano-20261109-2341.json']: JSON.stringify(
      envelopeDoPlano('plano-20261109-2341', SALA, DONO)),
  };
}

/* ------------------------------------------------------------------------------------------
 * A. TROCAR O PROFESSOR — o gesto que a pesquisadora queria
 * ---------------------------------------------------------------------------------------- */

async function provarATrocaDeProfessor(motor) {
  console.log('\nA. TROCAR O PROFESSOR É UM AJUSTE DA MESMA TURMA');

  const { pedir, ler } = bastidoresDe(motor, sementeComPlano());
  const r = await pedir('/api/bastidores/curadoria-derivar', {
    senhaDirecao: 'prova', derivarDe: VIGENTE, vigencia: '2026-11-10',
    professor: OUTRO, modalidade: 'Balé clássico', turmas: [SALA],
  });
  provar('a troca de professor é aceita', r.status === 201, r);
  const nova = (r.json || {}).curadoria || {};
  provar('…e o elo novo declara o professor novo', nova.professor === OUTRO, nova.professor);
  provar('…e a Turma continua na MESMA sala', JSON.stringify(nova.turmas) === JSON.stringify([SALA]),
    nova.turmas);
  provar('…e continua a saber de onde veio', nova.substitui === VIGENTE, nova.substitui);

  const lista = await ler('curadorias');
  const vigentes = lista.filter((c) => c && !c.substituidaPor);
  provar('…e sobra UMA direção vigente', vigentes.length === 1, vigentes.map((c) => c.id));
  provar('…e o anterior desce ao histórico a apontar para o elo novo',
    (lista.find((c) => c && c.id === VIGENTE) || {}).substituidaPor === nova.id,
    (lista.find((c) => c && c.id === VIGENTE) || {}).substituidaPor);
  const inv = invariantes(lista);
  provar('…e a lista fica sem ids repetidos nem ponteiros mortos',
    inv.repetidos.length === 0 && inv.mortos.length === 0, inv);
}

/* ------------------------------------------------------------------------------------------
 * B. MUDAR DE SALA — agora é um gesto legítimo
 * ---------------------------------------------------------------------------------------- */

async function provarAMudancaDeSala(motor) {
  console.log('\nB. TROCAR PROFESSOR E SALA AO MESMO TEMPO É UM GESTO LEGÍTIMO');

  /* A TRAVA QUE AQUI ESTAVA FOI REMOVIDA A 10/11/2026, e a prova mudou com ela.
   *
   * A recusa tratava o sintoma: mudar de sala arrastava a Turma e a cadeia parava em «ainda não
   * tem plano de ensino», porque o plano é procurado pelo NOME da sala. A causa era o plano não
   * seguir a Turma — e é isso que passou a haver (`planoDaTurmaOuDaOrigem`). Uma escola pode
   * mudar a direção, a sala e o elenco no mesmo dia; proibir o gesto não é responder-lhe. */
  const { pedir, ler } = bastidoresDe(motor, sementeComPlano());
  const r = await pedir('/api/bastidores/curadoria-derivar', {
    senhaDirecao: 'prova', derivarDe: VIGENTE, vigencia: '2026-11-10',
    professor: OUTRO, modalidade: 'Balé clássico', turmas: [SALA_LIVRE],
  });
  provar('trocar professor E sala no mesmo gesto é aceite', r.status === 201, r);
  const nova = (r.json || {}).curadoria || {};
  provar('…e a Turma nasce na sala de destino',
    JSON.stringify(nova.turmas) === JSON.stringify([SALA_LIVRE]), nova.turmas);
  provar('…e com o professor novo', nova.professor === OUTRO, nova.professor);
  provar('…e sabe de onde veio (é isso que faz o plano segui-la)',
    nova.substitui === VIGENTE, nova.substitui);
  provar('…e a resposta diz que mudou de sala, com as duas',
    JSON.stringify((r.json || {}).mudouDeSala) === JSON.stringify({ de: SALA, para: SALA_LIVRE }),
    (r.json || {}).mudouDeSala);

  const lista = await ler('curadorias');
  provar('…e a origem desce ao histórico a apontar para o elo novo',
    (lista.find((c) => c && c.id === VIGENTE) || {}).substituidaPor === nova.id,
    lista.find((c) => c && c.id === VIGENTE));
  provar('…e sobra UMA direção vigente', lista.filter((c) => c && !c.substituidaPor).length === 1,
    lista.map((c) => c.id));
  const inv = invariantes(lista);
  provar('…sem ids repetidos nem ponteiros mortos',
    inv.repetidos.length === 0 && inv.mortos.length === 0, inv);

  /* O QUE NÃO MUDOU: sem mudança de sala, o gesto é o de sempre. */
  {
    const outro = bastidoresDe(motor, sementeComPlano());
    const r2 = await outro.pedir('/api/bastidores/curadoria-derivar', {
      senhaDirecao: 'prova', derivarDe: VIGENTE, vigencia: '2026-11-10',
      professor: OUTRO, modalidade: 'Balé clássico', turmas: [SALA],
    });
    provar('sem mudar de sala, a troca de professor continua a ser um ajuste', r2.status === 201, r2);
    provar('…e a resposta não fala de mudança de sala',
      (r2.json || {}).mudouDeSala === null, (r2.json || {}).mudouDeSala);
  }
}

/* ------------------------------------------------------------------------------------------
 * C. A IDENTIDADE — o id não se repete, o ponteiro não morre
 * ---------------------------------------------------------------------------------------- */

async function provarAIdentidade(motor) {
  console.log('\nC. O ID NÃO SE REPETE, E O PONTEIRO ACOMPANHA A RENOMEAÇÃO');

  // O CENÁRIO QUE PRODUZIU O DANO: editar uma Turma livre e mudar-lhe a sala.
  {
    const { pedir, ler } = bastidoresDe(motor, {
      ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([
        curadoria({ id: 'pe-torto-bale-classico-rosa', substituidaPor: VIGENTE, substituidaEm: '2026-11-10' }),
        curadoria({ id: VIGENTE, vigenteDe: '2026-11-10', substitui: 'pe-torto-bale-classico-rosa' }),
      ]),
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([sala(), salaPiano()]),
    });

    const paraPiano = await pedir('/api/bastidores/curadoria', {
      senhaDirecao: 'prova', idAntigo: VIGENTE, professor: DONO, modalidade: 'Balé clássico',
      tradicao: 'RAD', turmas: [SALA_LIVRE], linhaDeBase: '',
    });
    provar('editar a sala de uma Turma livre é aceite', paraPiano.status === 201, paraPiano);
    const idPiano = ((paraPiano.json || {}).curadoria || {}).id;
    provar('…e o id acompanha o trio', idPiano === 'pe-torto-bale-classico-piano', idPiano);

    let lista = await ler('curadorias');
    provar('…e o elo que apontava para o id ANTIGO passa a apontar para o novo',
      (lista.find((c) => c && c.id === 'pe-torto-bale-classico-rosa') || {}).substituidaPor === idPiano,
      lista.find((c) => c && c.id === 'pe-torto-bale-classico-rosa'));
    let inv = invariantes(lista);
    provar('…sem ponteiros mortos', inv.mortos.length === 0, inv);

    /* A VOLTA — e é AQUI que o dano nascia: voltar à sala de origem pousava no id que já era
     * do elo antigo, e a lista ficava com dois registos no mesmo id. */
    const volta = await pedir('/api/bastidores/curadoria', {
      senhaDirecao: 'prova', idAntigo: idPiano, professor: DONO, modalidade: 'Balé clássico',
      tradicao: 'RAD', turmas: [SALA], linhaDeBase: '',
    });
    provar('voltar à sala de origem é RECUSADO (o id já é de outro elo)', volta.status === 409, volta);
    provar('…e a recusa nomeia a identidade tomada',
      String((volta.json || {}).id || '') === 'pe-torto-bale-classico-rosa', volta.json);
    provar('…e diz quem a ocupa', /já é de outra Turma/i.test(String((volta.json || {}).erro || '')),
      (volta.json || {}).erro);

    lista = await ler('curadorias');
    inv = invariantes(lista);
    provar('…e a lista fica sem ids repetidos', inv.repetidos.length === 0, inv.repetidos);
    provar('…e sem ponteiros mortos', inv.mortos.length === 0, inv.mortos);
    provar('…e sem perder o elo que lá estava', lista.length === 2, lista.length);
  }

  // A LISTA JÁ DANIFICADA: dois registos no mesmo id. Derivar tem de marcar O CERTO — foi aqui
  // que, no ar, o elo substituído passou a ser o duplicado e o verdadeiro ficou vigente a par do
  // novo, dando duas direções para a mesma sala.
  {
    const { pedir, ler } = bastidoresDe(motor, {
      // A FORMA EXACTA DO AR: o duplicado vem PRIMEIRO e já está marcado; o elo verdadeiro é o
      // vigente e vem depois. Quem procura pelo id acerta no duplicado — e marcava-o.
      ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([
        curadoria({ substituidaPor: 'pe-torto-bale-classico-piano-2026-11-10', substituidaEm: '2026-11-10' }),
        curadoria({ id: VIGENTE, vigenteDe: '2026-11-10', substitui: 'pe-torto-bale-classico-rosa' }),
      ]),
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([sala(), salaPiano()]),
      [ESCOLA + '/envelope/plano-20261109-2341.json']: JSON.stringify(
        envelopeDoPlano('plano-20261109-2341', SALA, DONO)),
    });
    const r = await pedir('/api/bastidores/curadoria-derivar', {
      senhaDirecao: 'prova', derivarDe: VIGENTE, vigencia: '2026-11-10',
      professor: OUTRO, modalidade: 'Balé clássico', turmas: [SALA],
    });
    provar('derivar numa lista já danificada é aceite', r.status === 201, r);
    const lista = await ler('curadorias');
    const nova = ((r.json || {}).curadoria || {}).id;
    const vigentesDaSala = lista.filter((c) => c && !c.substituidaPor
      && (c.turmas || []).indexOf(SALA) !== -1);
    provar('…e a sala fica com UMA só direção vigente (não duas)',
      vigentesDaSala.length === 1, vigentesDaSala.map((c) => c.id));
    provar('…e o elo marcado como substituído é o VIGENTE que se derivou', Boolean(nova)
      && (lista[1] || {}).substituidaPor === nova, { nova, um: lista[1] && lista[1].substituidaPor });
    provar('…e o duplicado não é tocado (o seu ponteiro antigo fica como estava)',
      (lista[0] || {}).substituidaPor === 'pe-torto-bale-classico-piano-2026-11-10',
      lista[0] && lista[0].substituidaPor);
  }

  // A RENOMEAÇÃO QUE ACONTECE arrasta os DOIS sentidos da cadeia.
  {
    const { pedir, ler } = bastidoresDe(motor, {
      ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([
        curadoria({ id: 'pe-torto-bale-classico-rosa', substituidaPor: 'pe-torto-bale-classico-rosa-2026-11-09', substituidaEm: '2026-11-09' }),
        curadoria({ id: 'pe-torto-bale-classico-rosa-2026-11-09', vigenteDe: '2026-11-09', substituidaPor: VIGENTE, substituidaEm: '2026-11-10', substitui: 'pe-torto-bale-classico-rosa' }),
        curadoria({ id: VIGENTE, vigenteDe: '2026-11-10', substitui: 'pe-torto-bale-classico-rosa-2026-11-09' }),
      ]),
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([sala(), salaPiano()]),
    });
    const r = await pedir('/api/bastidores/curadoria', {
      senhaDirecao: 'prova', idAntigo: VIGENTE, professor: DONO, modalidade: 'Balé clássico',
      tradicao: 'RAD', turmas: [SALA_LIVRE], linhaDeBase: '',
    });
    provar('a renomeação de uma cadeia de três elos é aceite', r.status === 201, r);
    const lista = await ler('curadorias');
    const inv = invariantes(lista);
    provar('…e os três elos continuam ligados (nenhum ponteiro morto)',
      inv.mortos.length === 0, inv.mortos);
    provar('…e o elo do meio aponta para o id NOVO',
      (lista.find((c) => c && c.id === 'pe-torto-bale-classico-rosa-2026-11-09') || {}).substituidaPor
        === 'pe-torto-bale-classico-piano',
      lista.find((c) => c && c.id === 'pe-torto-bale-classico-rosa-2026-11-09'));
  }
}

/* ------------------------------------------------------------------------------------------
 * D. A PÁGINA — o campo da sala trava, e continua a mostrar onde a Turma está
 * ---------------------------------------------------------------------------------------- */

async function provarAPagina(motor) {
  console.log('\nD. A PÁGINA OFERECE A SALA NA DERIVAÇÃO, E TEM VÉU');

  const b = require(path.join(motor, 'servidor/bastidores.js'));
  const kv = kvDeMentira(sementeComPlano());
  const env = {
    ESCOLA_SLUG: ESCOLA, PADD_KV: kv, FUSO: 'America/Sao_Paulo',
    SENHA_ADMIN: 'prova', GITHUB_TOKEN: '',
  };
  const resposta = await b.fetch(new Request(
    'https://' + ESCOLA + '.tmenegaz77.workers.dev/bastidores/producao'), env);
  const pagina = resposta ? await resposta.text() : '';

  provar('a página da Produção responde', Boolean(pagina) && pagina.length > 1000, pagina.length);
  provar('…e a sala continua a ser um `select` visível (quem ajusta tem de ler onde a Turma está)',
    pagina.indexOf('<select id="cuturma">') !== -1);
  provar('…e a sala NÃO é travada na derivação (mudar tudo ao mesmo tempo é legítimo)',
    pagina.indexOf('getElementById("cuturma").disabled = derivar') === -1);
  /* O VÉU — a peça que ela pediu: «continuo podendo clicar aí para onde eu quiser […] o usuário
   * fica sem nenhum feedback». Ele existia na porta e não existia aqui, onde ela trabalha. */
  provar('…e a página tem o véu da operação (a mesma peça da folha)',
    pagina.indexOf('<div class="veu" id="veu"') !== -1);
  provar('…e o véu fica de pé enquanto o gesto corre, e diz o passo',
    pagina.indexOf('function ocupar(texto)') !== -1
      && pagina.indexOf('function liberar()') !== -1
      && pagina.indexOf('textoDoPasso(ep)') !== -1);
  provar('…e a ligação do pacote executa o fecho em vez de abrir um documento vazio',
    pagina.indexOf('function fecharDoEndereco(turma)') !== -1
      && pagina.indexOf('data-fechar') !== -1);
}

/* ------------------------------------------------------------------------------------------
 * O CONTROLE NEGATIVO — o motor de antes tem de REPROVAR
 * ---------------------------------------------------------------------------------------- */

function prepararNegativo() {
  const ref = process.env.REF_NEGATIVO || 'HEAD';
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'troca-negativo-'));
  const pastas = ['motor', 'modelo', 'porta', 'biblioteca', 'tools', 'teste'];
  execSync('git archive ' + ref + ' ' + pastas.join(' ') + ' | tar -x -C ' + JSON.stringify(destino),
    { cwd: RAIZ, stdio: 'pipe' });
  // Os `node_modules` não vão no `git archive`, e o motor precisa deles para arrancar.
  const origem = path.join(RAIZ, 'node_modules');
  if (fs.existsSync(origem)) fs.symlinkSync(origem, path.join(destino, 'node_modules'), 'dir');
  return destino;
}

/* ------------------------------------------------------------------------------------------ */

(async () => {
  let motor = path.join(RAIZ, 'motor');
  if (process.argv.indexOf('--controle-negativo') !== -1) {
    motor = path.join(prepararNegativo(), 'motor');
    console.log('CONTROLE NEGATIVO contra ' + (process.env.REF_NEGATIVO || 'HEAD') + ' → ' + motor);
  }

  await provarATrocaDeProfessor(motor);
  await provarAMudancaDeSala(motor);
  await provarAIdentidade(motor);
  await provarAPagina(motor);

  const negativo = process.argv.indexOf('--controle-negativo') !== -1;
  console.log('\n' + (negativo ? 'CONTROLE NEGATIVO: ' : '') + provas + ' asserções, ' + falhas
    + ' falha(s).');
  if (negativo) {
    // No controle negativo, falhar É o resultado certo.
    if (falhas === 0) {
      console.log('A PROVA NÃO PROVA NADA: o motor de antes passou tudo.');
      process.exit(1);
    }
    console.log('Como esperado: o motor de antes reprova ' + falhas + ' de ' + provas + '.');
    process.exit(0);
  }
  if (falhas) process.exit(1);
  console.log('TUDO CERTO — trocar o professor (e a sala, e tudo) é um ajuste da mesma Turma, '
    + 'a identidade nunca se repete e a página tem véu.');
})();
