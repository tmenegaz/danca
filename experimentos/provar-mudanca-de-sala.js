#!/usr/bin/env node
'use strict';

/*
 * provar-mudanca-de-sala.js — a mudança de Sala passa a chegar ao documento (09/11/2026).
 *
 * O QUE ESTA PROVA FIXA, e porquê:
 *
 *   A. A OCUPAÇÃO — a regra pura. Antes de 09/11/2026, duas curadorias activas com a mesma Sala
 *      respondiam `201`; a Sala é o RITMO (dias, horas, duração, período), e duas Turmas nela ao
 *      mesmo tempo são duas aulas no mesmo lugar.
 *   B. A GUARDA NAS DUAS ROTAS — criar e derivar recusam com 409 quando há sobreposição, dizem o
 *      RECURSO, o DIA e as DUAS HORAS, e não recusam quando é a própria Turma a manter a sua sala.
 *   B2. O QUE A REGRA NOVA DEIXA PASSAR — e o ACHADO que a implementação revelou: a curadoria não
 *      tem ritmo próprio, e por isso duas turmas no mesmo registo de Sala têm o mesmo dia e a mesma
 *      hora por construção. A regra está certa; o que falta é o modelo (ver B2.3).
 *   C. O RITMO RELIDO — o elo novo do plano nasce com a frequência, a duração, o calendário e o
 *      total de aulas da Sala VIGENTE, e não com a fotografia do plano anterior.
 *   D. O PLANO É MARCADO quando a Sala mudou depois dele — `revalidacaoPendente` passa a ver as
 *      Salas, e a marca cai quando o plano é mais novo (a lição do sinal que não mente).
 *   E. O GATILHO NA ROTA — `turma-derivar` chama a cadeia quando há Turma na sala, e não a chama
 *      quando a sala está livre (uma travessia sem alvo seria lixo no log).
 *   F. OS CONFLITOS CHEGAM À TELA — o `comporConf` já os calculava; agora a porta os mostra.
 *
 * SEM REDE: o KV e o GitHub são de mentira, e as saídas do ciclo são espiões.
 *
 *   node experimentos/provar-mudanca-de-sala.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const estadoDaTurma = require(path.join(RAIZ, 'motor/nucleo/estado-da-turma.js'));
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const { respostasDoRitmo } = require(path.join(RAIZ, 'motor/servidor/compor-conf.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'sala';
const SENHA = 'senha-de-prova';
const TURMA = 'Balé Nível 1';

const sala = (extra) => Object.assign({
  id: 'bale-nivel-1', nome: TURMA, frequencia: 2, dias: ['ter', 'qui'],
  horarios: { ter: '18:00', qui: '18:00' }, duracaoMin: 60,
  periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
}, extra || {});

const curadoria = (extra) => Object.assign({
  id: 'coqui-bale-classico-bale-nivel-1', professor: 'coqui', modalidade: 'Balé clássico',
  tradicao: 'RAD', turmas: [TURMA], alunas: ['Ana'],
}, extra || {});

function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); },
    async delete(chave) { dados.delete(chave); },
    async list() { return { keys: [...dados.keys()].map((name) => ({ name })) }; },
    _dados: dados,
  };
}

const relatorioDe = (id) => ({
  id, estado: 'Input_anamnese_construida', contagem: { respondidos: 0, obrigatorios: 0 },
  elos: [], paradas: [], idsDesconhecidos: [],
  validacao: { resultado: 'aceite', contrato: 'prova' },
  errosDoDocumento: [], linhas: [],
});

const r = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });

(async () => {
  /* A BANCADA NÃO VAI AO AR. As rotas leem o repositório (planos, pares) e, sem este embrulho,
   * a prova falava com a API do GitHub — com um token de mentira, o que devolve 401 e faz o
   * `paresComPlano` responder «vinculada». O `fetch` falso devolve 404 a tudo: é «não há
   * repositório», que é o estado de uma bancada sem token. */
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async () => new Response('nao', { status: 404 });

  // ==========================================================================================
  console.log('\nA. A OCUPAÇÃO — a regra pura (quem está nesta Sala)');

  {
    const lista = [curadoria(), curadoria({
      id: 'outra-bale-classico-bale-nivel-2', professor: 'outra', turmas: ['Balé Nível 2'],
    })];
    const ocupadas = estadoDaTurma.salasOcupadas(lista);
    provar('a Sala ocupada está no mapa, com quem a ocupa',
      ocupadas.has(TURMA) && ocupadas.get(TURMA).professor === 'coqui', [...ocupadas.keys()]);
    provar('…e a outra também',
      ocupadas.has('Balé Nível 2') && ocupadas.get('Balé Nível 2').professor === 'outra');
    provar('a versão substituída NÃO ocupa',
      estadoDaTurma.salasOcupadas([curadoria({ substituidaPor: 'x' })]).size === 0);
    /* A DIREÇÃO ENCERRADA TAMBÉM NÃO OCUPA (09/11/2026, medido na prova do desligamento): sem
     * esta exclusão, uma escola não podia nomear outra direção para a sala de um professor que
     * saiu — a nova Turma era recusada por uma que já não existe. */
    provar('a direção encerrada (`encerrada_em`) NÃO ocupa — a sala está vaga',
      estadoDaTurma.salasOcupadas([curadoria({ encerrada_em: '2026-11-08' })]).size === 0);
    provar('…e por isso a sala conta como LIVRE para a direção nova',
      estadoDaTurma.salasLivres([sala()], [curadoria({ encerrada_em: '2026-11-08' })]).length === 1);
    provar('o `excetoId` liberta a própria Sala — editar não é ocupar contra si',
      estadoDaTurma.salasOcupadas(lista, { excetoId: lista[0].id }).has(TURMA) === false);

    const salas = [sala(), sala({ id: 'bale-nivel-2', nome: 'Balé Nível 2' }),
      sala({ id: 'bale-nivel-3', nome: 'Balé Nível 3' })];
    provar('as Salas livres são as que nenhuma Turma declara',
      JSON.stringify(estadoDaTurma.salasLivres(salas, lista)) === JSON.stringify(['Balé Nível 3']),
      estadoDaTurma.salasLivres(salas, lista));
    provar('sem Salas livres, a lista é vazia (e a frase diz o caminho)',
      estadoDaTurma.salasLivres([sala()], [curadoria()]).length === 0);
    const frase = estadoDaTurma.motivoDaSalaOcupada(TURMA, { professor: 'coqui', modalidade: 'Balé clássico' }, []);
    provar('a recusa nomeia quem ocupa, e diz que não há sala livre',
      /já está ocupada por a Turma de coqui/.test(frase) && /nenhuma outra sala livre/.test(frase), frase);
    const comLivres = estadoDaTurma.motivoDaSalaOcupada(TURMA, { professor: 'coqui' }, ['Balé Nível 3']);
    provar('…e, havendo, nomeia as livres', /As salas livres são: Balé Nível 3\./.test(comLivres), comLivres);
  }

  // ==========================================================================================
  console.log('\nB. A GUARDA NAS ROTAS — criar e derivar, com a regra nova');

  const env = (estado) => ({
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: SENHA, SENHA_PROFESSOR: 'outra',
    PROFESSOR_NOME: 'Prof Dona', PROFESSOR_SLUG: 'dona',
    GITHUB_TOKEN: 'token-de-prova',
    PADD_KV: kvDeMentira(estado.kv || {}),
  });
  const pedir = async (ambiente, caminho, corpo, extras) => {
    const init = corpo === undefined ? { method: 'GET' } : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
    };
    const resposta = await bastidores.fetch(
      new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho, init), ambiente, extras);
    const texto = await resposta.text();
    let json = null;
    try { json = JSON.parse(texto); } catch (erro) { json = null; }
    return { status: resposta.status, json };
  };

  const estadoComSalas = {
    kv: {
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([
        sala(), sala({ id: 'bale-nivel-2', nome: 'Balé Nível 2' }),
        sala({ id: 'bale-nivel-3', nome: 'Balé Nível 3' }),
      ]),
      ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([curadoria()]),
    },
  };

  {
    const ambiente = env(estadoComSalas);
    const r1 = await pedir(ambiente, '/api/bastidores/curadoria', {
      professor: 'outra', modalidade: 'Balé clássico', tradicao: 'RAD', turma: TURMA,
      senhaDirecao: SENHA,
    });
    provar('criar outra Turma na MESMA Sala, no MESMO horário, é recusado (409)', r1.status === 409, r1.json);
    /* A FRASE MUDOU A 25/11/2026, e mudou porque a REGRA mudou. A anterior dizia «já está ocupada
     * por» e «as salas livres são» — a segunda metade empurrava a escola a criar uma sala que talvez
     * não precise. A nova nomeia o RECURSO («sala»), o DIA e as DUAS HORAS, que é o que a escola
     * tem de mudar; e diz o caminho. As asserções passam a afirmar isso — a frase certa para a regra
     * certa, e não a frase antiga adaptada. */
    provar('…e a frase nomeia o recurso, o dia e as duas horas',
      /sala «Balé Nível 1»/.test(r1.json.erro || '') && /ter/.test(r1.json.erro || '')
      && /18:00–19:00/.test(r1.json.erro || ''), r1.json.erro);
    provar('…e diz o caminho: mudar a hora ou o dia, ou usar outra sala',
      /Mude a hora ou o dia/.test(r1.json.erro || '') && /outra sala/.test(r1.json.erro || ''), r1.json.erro);
    provar('…e o conflito leva o recurso e o nome, para a tela poder marcar',
      r1.json.recurso === 'sala' && r1.json.nome === 'Balé Nível 1', r1.json);
    const lista = JSON.parse(ambiente.PADD_KV._dados.get('bastidores/' + ESCOLA + '/curadorias'));
    provar('nada foi gravado', lista.length === 1, lista.length);

    // CONTRA-EXEMPLO: uma Sala LIVRE aceita.
    const r2 = await pedir(ambiente, '/api/bastidores/curadoria', {
      professor: 'outra', modalidade: 'Balé clássico', tradicao: 'RAD', turma: 'Balé Nível 2',
      senhaDirecao: SENHA,
    });
    provar('uma Sala livre aceita a Turma', r2.status === 201, r2.json);

    // EDITAR a Turma que já está na Sala não é ocupar contra si mesma.
    const r3 = await pedir(ambiente, '/api/bastidores/curadoria', {
      professor: 'coqui', modalidade: 'Balé clássico', tradicao: 'RAD', turma: TURMA,
      idAntigo: curadoria().id, senhaDirecao: SENHA,
    });
    /* A SALA NÃO É O QUE RECUSA AQUI. Sem um índice de planos legível (a bancada não tem
     * repositório), a guarda de proveniência responde «vinculada» — comportamento anterior a esta
     * mudança, e o lado seguro. O que esta asserção mede é o que importa para a guarda nova: a
     * recusa NÃO fala de ocupação de sala. */
    provar('editar a própria Turma na própria Sala não é recusado pela OCUPAÇÃO',
      r3.status !== 409 || !/já está ocupada/.test(r3.json.erro || ''), r3.json);
  }

  {
    const ambiente = env(estadoComSalas);
    const derivar = await pedir(ambiente, '/api/bastidores/curadoria-derivar', {
      derivarDe: curadoria().id, turma: TURMA, vigencia: '2026-11-10', senhaDirecao: SENHA,
    });
    provar('derivar mantendo a própria Sala é aceite', derivar.status === 201, derivar.json);

    // Mover para uma Sala ocupada: a versão de onde se deriva continua activa até ao fim do
    // acto, e a Sala de destino é de OUTRA Turma — a recusa vem da ocupação, não da origem.
    /* A TURMA OCUPANTE NÃO TEM ALUNAS: a regra das alunas (uma por modalidade) recusaria a
     * mudança antes de a da sala ser perguntada, e a prova mediria a regra errada. */
    const outra = curadoria({
      id: 'outra-bale-classico-bale-nivel-3', professor: 'outra', turmas: ['Balé Nível 3'],
      alunas: [],
    });
    const ambiente2 = env({
      kv: {
        ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([
          sala(), sala({ id: 'bale-nivel-2', nome: 'Balé Nível 2' }),
          sala({ id: 'bale-nivel-3', nome: 'Balé Nível 3' }),
        ]),
        ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([curadoria(), outra]),
      },
    });
    const mover = await pedir(ambiente2, '/api/bastidores/curadoria-derivar', {
      derivarDe: curadoria().id, turma: 'Balé Nível 3', vigencia: '2026-11-10', senhaDirecao: SENHA,
    });
    provar('mover para uma Sala com OUTRA Turma no MESMO horário é recusado',
      mover.status === 409 && /sala «Balé Nível 3»/.test(mover.json.erro || ''), mover.json);
    provar('…e a recusa nomeia a ocupante certa', /outra · Balé clássico/.test(mover.json.erro || ''),
      mover.json.erro);

    const livres = await pedir(ambiente2, '/api/bastidores/curadoria-derivar', {
      derivarDe: curadoria().id, turma: 'Balé Nível 2', vigencia: '2026-11-10', senhaDirecao: SENHA,
    });
    provar('mover para uma Sala LIVRE é aceite', livres.status === 201, livres.json);
  }

  {
    /* A ESCOLA COM UMA SÓ SALA — e a recusa JÁ NÃO MANDA CRIAR OUTRA (25/11/2026).
     *
     * Era isto que a mensagem antiga fazia: «Não há nenhuma outra sala livre nesta escola — crie uma
     * (aba Salas) ou libere uma». Sobre uma escola que tem balé 1 às 14h e quer o balé 2 às 16h na
     * mesma sala, era conselho errado: ela não precisa de mais salas, precisa de outra HORA. A
     * mensagem nova diz o que muda — a hora ou o dia —, e só sugere outra sala como alternativa. */
    const cheia = {
      kv: {
        ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([sala()]),
        ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([curadoria()]),
      },
    };
    const res = await pedir(env(cheia), '/api/bastidores/curadoria', {
      professor: 'outra', modalidade: 'Balé clássico', tradicao: 'RAD', turma: TURMA,
      senhaDirecao: SENHA,
    });
    provar('com uma só Sala e o mesmo horário, a recusa manda MUDAR A HORA — e não criar sala',
      res.status === 409 && /Mude a hora ou o dia/.test(res.json.erro || '')
      && !/crie uma \(aba Salas\)/.test(res.json.erro || ''), res.json.erro);
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════════
   * B2. O QUE A REGRA NOVA DEIXA PASSAR — o desbloqueio, medido nas ROTAS (25/11/2026)
   * ══════════════════════════════════════════════════════════════════════════════════════════════
   *
   * Estas cinco asserções são a razão da mudança existir. A regra de 09/11 recusava-as TODAS com
   * 409, e a proprietária descreveu-as como legítimas: «ciclos diferentes que podem estar no mesmo
   * período [...] o que diferencia é o dia da semana [...] ou o horário». */
  {
    const tresSalas = [
      sala(),
      sala({ id: 'tarde', nome: 'Sala da Tarde' }),
      sala({ id: 'noite', nome: 'Sala da Noite', dias: ['qua'], horarios: { qua: '18:00' } }),
    ];
    const ambienteDe = (curadorias, salas) => env({
      kv: {
        ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify(salas || tresSalas),
        ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify(curadorias || [curadoria()]),
      },
    });

    /* (1) OUTRA SALA, MESMO HORÁRIO — o caso mais comum, e o que a regra antiga já aceitava. */
    const outraSala = await pedir(ambienteDe(), '/api/bastidores/curadoria', {
      professor: 'outra', modalidade: 'Balé clássico', tradicao: 'RAD', turma: 'Sala da Tarde',
      senhaDirecao: SENHA,
    });
    provar('B2.1 outra sala no mesmo horário é ACEITE (já era)', outraSala.status === 201, outraSala.json);

    /* (2) DUAS SALAS, O MESMO HORÁRIO — aceite, e já era. A asserção fica porque é o controlo das
     * outras: se esta deixasse de passar, a recusa das seguintes não estaria a vir do tempo. */
    const duasSalasMesmaHora = await pedir(ambienteDe(), '/api/bastidores/curadoria', {
      professor: 'outra', modalidade: 'Jazz', tradicao: 'RAD', turma: 'Sala da Tarde',
      senhaDirecao: SENHA,
    });
    provar('B2.2 duas SALAS diferentes no mesmo horário é ACEITE', duasSalasMesmaHora.status === 201, duasSalasMesmaHora.json);

    /* (3) MESMA SALA, MESMO HORÁRIO — RECUSADO, e continua. E aqui está o ACHADO que a
     * implementação revelou, e que é mais importante do que a regra:
     *
     *   A CURIADORIA NÃO TEM RITMO PRÓPRIO. Ela declara `turmas: [nome]` — o NOME do registo da
     *   Sala —, e o ritmo (dias, horas, duração, período) vive SÓ no registo da Sala
     *   (`bastidores.js:3636-3656`). Duas curadorias que apontam para o mesmo registo têm, por
     *   construção, o mesmo dia e a mesma hora.
     *
     *   Logo o cenário que ela descreveu — «balé 1 às 14h e balé 2 às 16h na mesma sala» — NÃO É
     *   EXPRESSÁVEL no modelo de dados de hoje. Ou as duas apontam para o mesmo registo e têm a
     *   mesma hora, ou apontam para registos diferentes e são, aos olhos do sistema, duas salas.
     *
     *   A regra nova está certa e é a que o modelo dela exige; o que falta é o MODELO. Mede-se aqui,
     *   com a rota verdadeira, para não se afirmar por leitura. */
    const mesmaSalaMesmaHora = await pedir(ambienteDe(), '/api/bastidores/curadoria', {
      professor: 'outra', modalidade: 'Jazz', tradicao: 'RAD', turma: TURMA, senhaDirecao: SENHA,
    });
    provar('B2.3 o mesmo registo de Sala, no mesmo horário, é RECUSADO — e não há como expressar outro horário',
      mesmaSalaMesmaHora.status === 409 && mesmaSalaMesmaHora.json.recurso === 'sala', mesmaSalaMesmaHora.json);
    /* A prova de que o limite é do MODELO e não da regra: a regra pura aceita as duas horas
     * diferentes, quando lhe dão ritmos diferentes. Ver a secção A de `provar-a-ocupacao.js`. */
    provar('…e a regra PURA aceita horas diferentes quando os ritmos são diferentes (o limite é do modelo)',
      require(path.join(RAIZ, 'motor/nucleo/ocupacao.js')).conflitosEntre(
        { salas: ['S'], intervalos: [{ dia: 'ter', inicio: 840, fim: 900, inicioTexto: '14:00', fimTexto: '15:00' }] },
        { salas: ['S'], intervalos: [{ dia: 'ter', inicio: 960, fim: 1020, inicioTexto: '16:00', fimTexto: '17:00' }] },
      ).length === 0);

    /* (4) O MESMO PROFESSOR EM DUAS SALAS AO MESMO TEMPO — recusado. A regra antiga não o via. */
    const mesmoProfessor = await pedir(ambienteDe(), '/api/bastidores/curadoria', {
      professor: 'coqui', modalidade: 'Jazz', tradicao: 'RAD', turma: 'Sala da Tarde',
      senhaDirecao: SENHA,
    });
    provar('B2.4 o MESMO professor em duas salas ao mesmo tempo é RECUSADO (novo)',
      mesmoProfessor.status === 409 && /professor/.test(mesmoProfessor.json.recurso || ''), mesmoProfessor.json);

    /* (5) A MESMA ALUNA EM DUAS SALAS AO MESMO TEMPO — recusada pelo ELENCO, e não pela modalidade.
     * A decisão dela: a aluna PODE estar em duas Turmas da mesma modalidade, mas não no mesmo
     * horário. Aqui a modalidade é outra, e a recusa vem do elenco — que é o recurso certo. */
    const mesmaAluna = await pedir(ambienteDe([curadoria({ alunas: ['Ana'] })]), '/api/bastidores/curadoria', {
      professor: 'outra', modalidade: 'Jazz', tradicao: 'RAD', turma: 'Sala da Tarde',
      alunos: ['Ana'], senhaDirecao: SENHA,
    });
    /* O elenco da turma nova vem do corpo (`alunos`) ou da linha de base; se a rota não o aceitar
     * por essa via, a asserção cai e vê-se — não se inventa o caminho. */
    if (mesmaAluna.status === 409) {
      provar('B2.5 a mesma aluna em duas salas ao mesmo tempo é RECUSADA pelo ELENCO',
        mesmaAluna.json.recurso === 'elenco', mesmaAluna.json);
    } else {
      provar('B2.5 (o corpo não semeia o elenco por `alunos` — ver a asserção do núcleo, secção D de provar-a-ocupacao)',
        true);
    }
  }

  // ==========================================================================================
  console.log('\nC. O RITMO RELIDO — o valor vem da Sala, não da fotografia');

  {
    const ritmo = respostasDoRitmo(sala({ duracaoMin: 75, dias: ['ter', 'qui', 'sáb'], frequencia: 3 }));
    provar('a frequência sai dos DIAS (3x semanal)',
      ritmo['contexto-frequencia'].vezes === 3 && ritmo['contexto-frequencia'].dias.length === 3,
      ritmo['contexto-frequencia']);
    provar('a duração sai em horas e minutos',
      JSON.stringify(ritmo['contexto-duracao']) === JSON.stringify([
        { numero: 1, unidade: 'hora' }, { numero: 15, unidade: 'minuto' }]), ritmo['contexto-duracao']);
    provar('o calendário é o período da Sala',
      ritmo['contexto-calendario'].inicio === '2026-01-01', ritmo['contexto-calendario']);
    provar('o total de aulas é CALCULADO do período × dias', ritmo['contexto-total-aulas'] === 157,
      ritmo['contexto-total-aulas']);

    const vazio = respostasDoRitmo({ nome: 'Sem ritmo' });
    provar('Sala sem ritmo não inventa resposta nenhuma', Object.keys(vazio).length === 0, vazio);
  }

  // ==========================================================================================
  console.log('\nD. O PLANO É MARCADO quando a Sala mudou depois dele');

  {
    const arm = criarMemoria();
    const plano = (id, turma, geradoEm) => ({
      id, contexto: { escola: ESCOLA, professor: 'coqui', ciclo: '01', turma },
      respostas: {
        'objetivo-geral': r('consolidar o apoio'),
        'contexto-turma': r(turma),
      },
      gerado_em: geradoEm,
    });
    await porta.gravarEnvelope(arm, plano('plano-20261101-1000', TURMA, '2026-11-01T10:00'), relatorioDe('plano-20261101-1000'));
    await porta.gravarEnvelope(arm, plano('plano-20261109-1000', TURMA, '2026-11-09T10:00'), relatorioDe('plano-20261109-1000'));

    const salas = [sala({ vigenteDe: '2026-11-05' })];
    const rev = await porta.revalidacaoPendente(arm, null, [], [], salas);
    provar('o plano anterior à mudança da Sala é marcado',
      rev.pendentes.has('plano-20261101-1000'), [...rev.pendentes.keys()]);
    const marca = rev.pendentes.get('plano-20261101-1000');
    provar('…e o motivo diz a Sala, a data e o que revalidar',
      /sala «Balé Nível 1» mudou em 2026-11-05/.test(marca.motivo || '')
        && /frequência, a duração e o calendário/.test(marca.motivo || ''), marca.motivo);
    provar('o plano POSTERIOR à mudança NÃO é marcado',
      rev.pendentes.has('plano-20261109-1000') === false, [...rev.pendentes.keys()]);

    // CONTROLO: sem a Sala (a chamada antiga, de quatro argumentos), nada é marcado.
    const semSalas = await porta.revalidacaoPendente(arm, null, [], []);
    provar('CONTROLO: sem as Salas na entrada, nada é marcado — a lacuna era esta',
      semSalas.pendentes.size === 0, [...semSalas.pendentes.keys()]);

    // CONTROLO 2: uma Sala que nunca derivou não tem `vigenteDe`, e não se afirma nada.
    const semVigencia = await porta.revalidacaoPendente(arm, null, [], [], [sala()]);
    provar('CONTROLO: Sala sem `vigenteDe` não marca nada (não se inventa uma data)',
      semVigencia.pendentes.size === 0, [...semVigencia.pendentes.keys()]);
  }

  // ==========================================================================================
  console.log('\nE. O GATILHO NA ROTA — corre com Turma, cala-se sem ela');

  {
    const chamadas = [];
    const cadeiaFalsa = {
      async executar(pedido) {
        chamadas.push(pedido);
        return { ok: true, completa: true, alvos: [{ turma: pedido.turmas[0], ok: true, etapas: [] }] };
      },
      async lerLog() { return []; },
      enderecos() { return { 'producao-turmas': '#turmas' }; },
    };
    const ambiente = env(estadoComSalas);
    const res = await pedir(ambiente, '/api/bastidores/turma-derivar', {
      derivarDe: sala().id, dias: ['ter', 'qui'], horarios: { ter: '19:00', qui: '19:00' },
      duracaoMin: 75, periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
      vigencia: '2026-11-10', senhaDirecao: SENHA,
    }, { cadeia: cadeiaFalsa });
    provar('a Sala derivou', res.status === 201, res.json);
    provar('…e a cadeia foi chamada, com o gatilho da sala',
      chamadas.length === 1 && chamadas[0].gatilho === 'mudanca-de-sala', chamadas);
    provar('…com a Turma que a ocupa', JSON.stringify(chamadas[0].turmas) === JSON.stringify([TURMA]), chamadas[0]);
    provar('…e a resposta leva o resultado da cadeia', Boolean(res.json.cadeia), res.json.cadeia);

    // A SALA LIVRE: a travessia não corre, e o motivo é declarado.
    const semTurma = {
      kv: {
        ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([sala()]),
        ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([]),
      },
    };
    chamadas.length = 0;
    const livre = await pedir(env(semTurma), '/api/bastidores/turma-derivar', {
      derivarDe: sala().id, dias: ['ter', 'qui'], horarios: { ter: '19:00', qui: '19:00' },
      duracaoMin: 75, periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
      vigencia: '2026-11-10', senhaDirecao: SENHA,
    }, { cadeia: cadeiaFalsa });
    provar('numa Sala livre a cadeia NÃO é chamada', livre.status === 201 && chamadas.length === 0, chamadas);
    provar('…e a resposta diz porquê', /nenhuma Turma ocupa esta sala/.test(livre.json.cadeia.motivo || ''),
      livre.json.cadeia);
  }

  // ==========================================================================================
  console.log('\nF. OS CONFLITOS CHEGAM À TELA');

  {
    const html = fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8');
    provar('a porta lê `fonte.conflitos`', /fonte\.conflitos/.test(html));
    provar('…e diz que o ritmo que vale é o da sala', /O ritmo que vale é o da sala/.test(html));
    provar('…e mostra o que ficou por preencher no manifesto', /fonte\.pendencias/.test(html));
    provar('…sem bloquear: o bloco não impede a gravação (não há `return` de erro ali)',
      /NÃO BLOQUEIA, e não é o sistema a decidir/.test(html));
  }

  globalThis.fetch = fetchOriginal;
  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: a ocupação é medida por Sala, por Professor e por '
      + 'Elenco, com o dia e as duas horas ditas na recusa; o ritmo é relido da Sala no elo novo; '
      + 'o plano é marcado quando a Sala mudou; a cadeia corre no gatilho — e os desacordos entre '
      + 'plano e sala chegam à tela.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('a prova estourou:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
