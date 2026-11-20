'use strict';

/**
 * provar-os-fluxos-da-derivacao.js — A VERIFICAÇÃO DA VERDADE SOBRE OS FLUXOS (19/11/2026).
 *
 * O PEDIDO, nas palavras dela:
 *
 *   «Eu preciso que você faça uma verificação da verdade. […] tem situações que eu acho que já não
 *    correspondem mais à verdade dos fluxos que desenhamos lá na arquitetura geral. […] Se eu mudar
 *    um professor de sala, preciso que dispare o processo todo […] Em turma, eu não tenho mais um
 *    vínculo com professor. Eu tenho uma relação direta com a sala. É a sala que é associada a um
 *    professor.»
 *
 * O QUE ESTA PROVA MEDE — e cada alínea é uma afirmação que vai para o documento:
 *
 *   A. O GESTO «MUDAR O PROFESSOR DE UMA SALA» (`POST /api/bastidores/turma-professor`).
 *      · a SALA passa a declarar o professor novo, e a TURMA guarda a cópia antiga como MEMÓRIA;
 *      · a resposta traz `cadeia` e `trocou`, e a travessia CORRE (T2, implementado a 19/11/2026);
 *        um gesto que reconfirma o mesmo par não finge travessia, e quando ela pára num facto a
 *        resposta leva a frase desse facto (`parouPor`);
 *      · a lista que autoriza o plano passa a mostrar a turma a quem a dá — a direção de hoje lê-se
 *        da SALA (T1, implementado a 19/11/2026), e não da cópia.
 *   B. O QUE A CADEIA DIZ NOS DOIS ESTADOS. Com a cópia velha na Turma (o estado real depois de A),
 *      o plano é dado por `feita` — silêncio. Com a cópia nova (o estado que a derivação da Turma
 *      produz), o plano é `bloqueada` — a cadeia fala, e diz que a autoria não se reescreve.
 *   C. A MATRIZ DE GATILHOS, lida do código-fonte. Quais rotas chamam `rodarCadeia` — e, portanto,
 *      quais gestos percorrem a cadeia hoje. Mede-se o FONTE, e diz-se isso: é a lista dos sítios,
 *      não uma execução de cada um. E mede-se a SEGUNDA lista: a ponte (`producao.js`) só monta a
 *      cadeia para as rotas que declara, e uma rota fora dela chama uma cadeia `null`.
 *   D. O EXPURGO. A lista declarada do expurgo cobre todas as chaves que o código escreve — a
 *      conferência é contra o código, e não contra a memória (é o que ela pediu: «precisa ser
 *      verificado no expurgo para não ficar para trás»).
 *   E. A TROCA DE MODALIDADE BLOQUEIA (T3, 19/11/2026). «A minha turma é iniciante; se eu botar
 *      algo complexo aqui já não está legal.» A modalidade não é etiqueta: é o instrumento — a
 *      régua vem com o par. A guarda compara a modalidade que o DOCUMENTO declara
 *      (`contexto.modalidade`, escrito pela porta a partir da Sala) com a que a SALA declara hoje;
 *      o vazio não é erro, e a mesma modalidade dos dois lados não dispara nada.
 *
 * OS DOIS CONTROLADORES NEGATIVOS, e são dois porque são duas correcções de dias diferentes:
 *   · contra o `motor/servidor/bastidores.js` de antes do T2, **15 de 64** reprovam (a resposta sem
 *     `cadeia`, a travessia que não corre, o gatilho que não muda, a rota fora da matriz);
 *   · contra o `motor/nucleo/cadeia.js` do `HEAD` (antes do T3), **5 de 65** reprovam (a etapa que
 *     não bloqueia e as quatro frases que ela devia dizer).
 * Se um negativo passar, a prova não está a medir nada.
 *
 *   node experimentos/provar-os-fluxos-da-derivacao.js
 */

const path = require('path');
const fs = require('fs');

const raiz = path.resolve(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
const nucleoCadeia = require(path.join(raiz, 'motor/nucleo/cadeia.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'breu';
const RAIZ = 'bastidores/' + ESCOLA;

/** Um KV de mentira, e só com o que estas rotas leem. */
function criarKV(inicial) {
  const memoria = new Map(Object.entries(inicial || {}));
  return {
    memoria,
    async get(k) { return memoria.has(k) ? memoria.get(k) : null; },
    async put(k, v) { memoria.set(k, String(v)); },
    async delete(k) { memoria.delete(k); },
    async list({ prefix } = {}) {
      const nomes = [...memoria.keys()].filter((k) => !prefix || k.indexOf(prefix) === 0);
      return { keys: nomes.map((name) => ({ name })), list_complete: true };
    },
  };
}

const SALA = {
  id: 'rosa', nome: 'Rosa', professor: 'pe-torto', modalidade: 'Balé clássico',
  /* A FORMA DO CADASTRO: `dias` são NOMES, e a hora de cada um vive em `horarios` (16/10/2026) —
   * o `normalizarTurma` descarta o par {dia, hora} em silêncio, e a sala fica sem ritmo. */
  dias: ['segunda', 'quarta'], horarios: { segunda: '18:00', quarta: '18:00' },
  duracaoMin: 60, periodoInicio: '2026-11-02', periodoFim: '2026-12-20', ordem: 1,
};
const REGUA = { nome: 'Padrão', niveis: ['Ótimo', 'Bom', 'Regular', 'Insuficiente'] };
const PROFESSORES = [
  { nome: 'Pé Torto', slug: 'pe-torto', rubrica: REGUA },
  { nome: 'Redinha Rosa', slug: 'redinha-rosa', rubrica: REGUA },
];
/* A TURMA (a curadoria) — com o professor COPIADO da Sala no dia em que foi gravada. */
const TURMA = {
  id: 'pe-torto-bale-classico-rosa', professor: 'pe-torto', modalidade: 'Balé clássico',
  tradicao: 'francesa', grau: '1', nivel: 'Nível 1', nivelReferencia: 'Nível 1',
  turmas: ['Rosa'], linhaDeBase: 'elenco-1', linhaDeBaseNome: 'Nível 1 — mobilidade e pés',
  alunas: ['aluno-a', 'aluno-b'],
};
const ELENCO = { id: 'elenco-1', nome: 'Nível 1 — mobilidade e pés', alunas: ['Aluno A', 'Aluno B'] };

function ambiente(kv) {
  return {
    ESCOLA_SLUG: ESCOLA, SENHA_ADMIN: 'segredo', GITHUB_TOKEN: 'token-de-prova', PADD_KV: kv,
  };
}

async function pedir(env, caminho, corpo) {
  const pedido = new Request('https://breu.workers.dev' + caminho, corpo
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) }
    : {});
  const resposta = await bastidores.fetch(pedido, env);
  let dados = null;
  try { dados = await resposta.json(); } catch { dados = null; }
  return { status: resposta.status, dados };
}

async function principal() {
  /* =========================================================================================== */
  console.log('\nA. Mudar o professor de uma SALA — e a Turma, que continua a dizer o antigo');

  const kv = criarKV({
    [RAIZ + '/turmas']: JSON.stringify([SALA]),
    [RAIZ + '/curadorias']: JSON.stringify([TURMA]),
    [RAIZ + '/professores']: JSON.stringify(PROFESSORES),
    [RAIZ + '/linhas-de-base']: JSON.stringify([ELENCO]),
  });
  const env = ambiente(kv);

  const antesDaSala = JSON.parse(await kv.get(RAIZ + '/turmas'))[0];
  const antesDaTurma = JSON.parse(await kv.get(RAIZ + '/curadorias'))[0];
  provar('o ponto de partida: Sala e Turma dizem o MESMO professor',
    antesDaSala.professor === 'pe-torto' && antesDaTurma.professor === 'pe-torto',
    { sala: antesDaSala.professor, turma: antesDaTurma.professor });

  /* O GESTO DELA: «eu preciso que um professor mude de sala […] eu faço isso em salas». */
  const par = await pedir(env, '/api/bastidores/turma-professor', {
    token: '', senhaDirecao: 'segredo', turma: 'Rosa',
    professor: 'redinha-rosa', modalidade: 'Balé clássico', concluir: true,
  });
  provar('o gesto de Salas é aceite', par.dados && par.dados.ok === true,
    { status: par.status, dados: par.dados && (par.dados.erro || par.dados.ok) });

  const salaDepois = JSON.parse(await kv.get(RAIZ + '/turmas'))[0];
  const turmaDepois = JSON.parse(await kv.get(RAIZ + '/curadorias'))[0];
  provar('…e a SALA passa a declarar o professor novo',
    salaDepois.professor === 'redinha-rosa', salaDepois.professor);
  /* A CÓPIA FICA, E É DE PROPÓSITO (T1, 19/11/2026): ela é a memória do dia em que o elo foi
   * escrito, e é dela que se lê uma turma anterior a a Sala declarar o par. O que mudou é que ela
   * deixou de ser a AUTORIDADE — a direção de hoje vem da Sala, e é o que as asserções seguintes
   * medem. */
  provar('…e a TURMA guarda a cópia antiga como MEMÓRIA — já não como autoridade',
    turmaDepois.professor === 'pe-torto', turmaDepois.professor);

  /* O FLUXO PASSOU A SER DISPARADO (T2, 19/11/2026) — «se eu mudar um professor de sala, preciso
   * que dispare o processo todo». A resposta traz `cadeia`, que é o contrato das outras cinco
   * rotas que a chamam. Nesta bancada a cadeia não está montada (`extras.cadeia` ausente), por
   * isso ela diz que não correu — e dizê-lo é o comportamento certo: a rota não inventa uma
   * travessia que não existe. A chamada a sério mede-se a seguir, com uma cadeia espiã. */
  provar('…e o gesto PASSA a trazer o estado da cadeia na resposta (T2)',
    par.dados && par.dados.cadeia !== undefined, par.dados && Object.keys(par.dados));
  provar('…e diz que a troca foi de professor',
    par.dados && par.dados.trocou && par.dados.trocou.professor === true
      && par.dados.trocou.modalidade === false, par.dados && par.dados.trocou);

  /* A CHAMADA A SÉRIO — com uma cadeia espiã, que é o único modo de medir «disparou» sem correr
   * a travessia inteira (escritores, envelopes, geração). O que se mede é o PEDIDO: o gatilho, a
   * turma, e o motivo com os dois nomes. */
  const pedidos = [];
  const espia = {
    enderecos: () => ({}),
    enderecoDaEtapa: () => null,
    executar: async (pedido) => {
      pedidos.push(pedido);
      return { ok: true, completa: true, alvos: [] };
    },
  };
  const kv2 = criarKV({
    [RAIZ + '/turmas']: JSON.stringify([Object.assign({}, SALA, { professor: 'pe-torto' })]),
    [RAIZ + '/curadorias']: JSON.stringify([TURMA]),
    [RAIZ + '/professores']: JSON.stringify(PROFESSORES),
    [RAIZ + '/linhas-de-base']: JSON.stringify([ELENCO]),
  });
  const env2 = ambiente(kv2);
  const chamar2 = async (corpo) => {
    const r = await bastidores.fetch(new Request('https://breu.workers.dev/api/bastidores/turma-professor', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
    }), env2, { cadeia: espia });
    let d = null; try { d = await r.json(); } catch { d = null; }
    return { status: r.status, dados: d };
  };

  const comCadeia = await chamar2({
    senhaDirecao: 'segredo', turma: 'Rosa', professor: 'redinha-rosa',
    modalidade: 'Balé clássico', concluir: true,
  });
  provar('com a cadeia montada, o gesto corre-a de facto', pedidos.length === 1,
    { status: comCadeia.status, pedidos: pedidos.length });
  provar('…com o gatilho «troca-de-direcao» — é a troca de quem dirige',
    pedidos[0] && pedidos[0].gatilho === 'troca-de-direcao', pedidos[0] && pedidos[0].gatilho);
  provar('…e com a turma da sala no pedido', pedidos[0] && (pedidos[0].turmas || []).join(',') === 'Rosa',
    pedidos[0] && pedidos[0].turmas);
  provar('…e o motivo nomeia os dois professores — é o que a tela lê',
    /pe-torto/.test(String(pedidos[0] && pedidos[0].motivo))
      && /redinha-rosa/.test(String(pedidos[0] && pedidos[0].motivo)),
    pedidos[0] && pedidos[0].motivo);

  /* O QUE A TELA RECEBE QUANDO A CADEIA PÁRA NUM FACTO. A resposta é a única coisa que sobrevive
   * à recarga que segue a gravação — e o `parouPor` é a frase do facto (a etapa `bloqueada`), que
   * antes não chegava ao canto. O resumo dizia «falta o plano de ensino» a quem acabou de mudar o
   * professor, e isso lê-se como avaria. */
  const travada = {
    enderecos: () => ({}), enderecoDaEtapa: () => null,
    executar: async () => ({ ok: false, completa: true, alvos: [{
      turma: 'Rosa', ok: false, erro: null,
      etapas: [
        { chave: 'vinculos', estado: 'feita' },
        { chave: 'plano-de-ensino', estado: 'bloqueada', falta: 'o plano é de «Pé Torto», e a '
          + 'autoria não se reescreve: este professor escreve o dele.' },
        { chave: 'plano-de-observacao', estado: 'bloqueada', falta: 'depende do plano' },
        { chave: 'pacote', estado: 'pendente', falta: 'os documentos são os de antes' },
      ],
    }] }),
  };
  const kv3 = criarKV({
    [RAIZ + '/turmas']: JSON.stringify([SALA]),
    [RAIZ + '/curadorias']: JSON.stringify([TURMA]),
    [RAIZ + '/professores']: JSON.stringify(PROFESSORES),
    [RAIZ + '/linhas-de-base']: JSON.stringify([ELENCO]),
  });
  const comTravada = await bastidores.fetch(new Request(
    'https://breu.workers.dev/api/bastidores/turma-professor', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: 'segredo', turma: 'Rosa', professor: 'redinha-rosa',
        modalidade: 'Balé clássico', concluir: true }),
    }), ambiente(kv3), { cadeia: travada }).then((r) => r.json());
  provar('quando a cadeia pára num facto, a resposta traz a frase desse facto (`parouPor`)',
    Boolean(comTravada.cadeia && comTravada.cadeia.parouPor)
      && /autoria não se reescreve/.test(String(comTravada.cadeia.parouPor)),
    comTravada.cadeia && comTravada.cadeia.parouPor);
  provar('…e nomeia a turma, para a frase não ficar sem dono',
    /Turma «Rosa»/.test(String(comTravada.cadeia && comTravada.cadeia.parouPor)),
    comTravada.cadeia && comTravada.cadeia.parouPor);
  provar('…e o resumo continua a dizer o que ficou gravado',
    /ficou gravado/i.test(String(comTravada.cadeia && comTravada.cadeia.recado)),
    comTravada.cadeia && comTravada.cadeia.recado);

  /* E NÃO SE PERCORRE NADA QUANDO NADA MUDOU. A regra é a do `turma-derivar`: uma travessia sem
   * mudança escreve uma entrada no log e não faz nada, e isso lê-se como «trabalho». */
  const antes = pedidos.length;
  const semMudanca = await chamar2({
    senhaDirecao: 'segredo', turma: 'Rosa', professor: 'redinha-rosa',
    modalidade: 'Balé clássico', concluir: true,
  });
  provar('…e gravar o MESMO par não percorre a cadeia', pedidos.length === antes,
    { pedidos: pedidos.length, antes });
  provar('…e a resposta di-lo, em vez de fingir uma travessia',
    semMudanca.dados && semMudanca.dados.cadeia
      && semMudanca.dados.cadeia.executada === false, semMudanca.dados && semMudanca.dados.cadeia);

  /* E A TROCA DE MODALIDADE TAMBÉM DISPARA — é o mesmo par, e é o mesmo acto da escola. O que a
   * cadeia FAZ com ela é o T3, e está declarado por decidir. */
  const soModalidade = await chamar2({
    senhaDirecao: 'segredo', turma: 'Rosa', professor: 'redinha-rosa',
    modalidade: 'Dança moderna', concluir: true,
  });
  provar('trocar só a modalidade também percorre a cadeia', pedidos.length === antes + 1,
    { pedidos: pedidos.length, antes });
  provar('…e a resposta diz que foi a modalidade, e não o professor',
    soModalidade.dados && soModalidade.dados.trocou
      && soModalidade.dados.trocou.professor === false
      && soModalidade.dados.trocou.modalidade === true,
    soModalidade.dados && soModalidade.dados.trocou);

  /* A CONSEQUÊNCIA PRÁCTICA, e é a que ela sente: a lista que autoriza o plano é filtrada pelo
   * professor da TURMA. Quem passou a dar a sala não a vê; quem já não a dá continua a vê-la. */
  const doNovo = await pedir(env, '/api/bastidores/curadoria-professor?professor=redinha-rosa');
  const doAntigo = await pedir(env, '/api/bastidores/curadoria-professor?professor=pe-torto');
  /* T1 (19/11/2026): ESTAS DUAS ASSERÇÕES ERAM O CONTRÁRIO, e eram a medida do defeito. Elas
   * diziam «o professor novo NÃO vê a turma que passou a dar» e «o antigo continua a vê-la» — o
   * retrato do dia em que a cópia da curadoria mandava. Com a Sala a mandar, o retrato inverte-se,
   * e a inversão é a correcção. */
  provar('…e o professor NOVO vê a turma que passou a dar — a lista lê a SALA',
    Array.isArray(doNovo.dados && doNovo.dados.curadorias) && doNovo.dados.curadorias.length === 1,
    doNovo.dados && (doNovo.dados.curadorias || []).length);
  provar('…e o professor ANTIGO deixa de a ver — já não é ele que a dá',
    Array.isArray(doAntigo.dados && doAntigo.dados.curadorias)
      && doAntigo.dados.curadorias.length === 0,
    doAntigo.dados && (doAntigo.dados.curadorias || []).length);

  /* =========================================================================================== */
  console.log('\nA2. O CAMINHO QUE ELA USA EM SALAS — «Derivar», e o gatilho a dizer o que mudou');

  /* O CAMINHO REAL. Uma sala com Turma activa NÃO se edita no lugar (409 — `turma-editar`), e é
   * isso que torna o «Derivar» o gesto dela: a escola corrige quem dá a sala, e o que fica gravado
   * é um elo novo. Esta secção mede o que a rota diz à cadeia — e é aqui que estava um defeito que
   * nenhuma outra bancada via: o gatilho era SEMPRE `mudanca-de-sala` (o rótulo do RITMO), mesmo
   * quando o que mudou foi quem a dá. O log da cadeia lê-se por esse rótulo. */
  {
    const envD = ambiente(criarKV({
      [RAIZ + '/turmas']: JSON.stringify([SALA]),
      [RAIZ + '/curadorias']: JSON.stringify([TURMA]),
      [RAIZ + '/professores']: JSON.stringify(PROFESSORES),
      [RAIZ + '/linhas-de-base']: JSON.stringify([ELENCO]),
    }));
    const pedidosD = [];
    const espiaD = {
      enderecos: () => ({}), enderecoDaEtapa: () => null,
      executar: async (pedido) => { pedidosD.push(pedido); return { ok: true, completa: true, alvos: [] }; },
    };
    const derivarD = async (corpo) => {
      const r = await bastidores.fetch(new Request('https://breu.workers.dev/api/bastidores/turma-derivar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
      }), envD, { cadeia: espiaD });
      let d = null; try { d = await r.json(); } catch { d = null; }
      return { status: r.status, dados: d };
    };

    /* A edição no lugar é RECUSADA quando a sala tem Turma — é a regra de 03/11/2026, e é o que
     * faz do «Derivar» o caminho. Fica medido para a narrativa não inventar um caminho. */
    const editar = await bastidores.fetch(new Request('https://breu.workers.dev/api/bastidores/turma-editar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: 'segredo', id: 'rosa', nome: 'Rosa', professor: 'redinha-rosa' }),
    }), envD);
    provar('a sala com Turma NÃO se edita no lugar — 409, e é por isso que o caminho é derivar',
      editar.status === 409, editar.status);

    /* O RITMO VAI INTEIRO NO CORPO: a derivação exige a sala completa, e um campo em falta é uma
     * recusa. `duracaoMin` é o que muda. */
    const soRitmo = await derivarD({
      senhaDirecao: 'segredo', derivarDe: 'rosa', professor: 'pe-torto',
      modalidade: 'Balé clássico', duracaoMin: 75,
      /* A FORMA DO CADASTRO: `dias` são NOMES, e a hora de cada um vive em `horarios` (16/10/2026) —
   * o `normalizarTurma` descarta o par {dia, hora} em silêncio, e a sala fica sem ritmo. */
  dias: ['segunda', 'quarta'], horarios: { segunda: '18:00', quarta: '18:00' },
      periodoInicio: '2026-11-02', periodoFim: '2026-12-20',
    });
    provar('derivar mudando só o RITMO corre a cadeia', pedidosD.length === 1,
      { status: soRitmo.status, erro: soRitmo.dados && soRitmo.dados.erro, pedidos: pedidosD.length });
    provar('…e o gatilho diz «mudanca-de-sala» — é o ritmo que mudou',
      pedidosD[0] && pedidosD[0].gatilho === 'mudanca-de-sala', pedidosD[0] && pedidosD[0].gatilho);

    /* Agora a troca de professor, no elo que a derivação anterior deixou vigente. */
    const vigente = JSON.parse(await envD.PADD_KV.get(RAIZ + '/turmas'))
      .filter((t) => t && !t.substituidaPor)[0];
    const troca = await derivarD({
      senhaDirecao: 'segredo', derivarDe: vigente.id, professor: 'redinha-rosa',
      modalidade: 'Balé clássico', duracaoMin: 75,
      /* A FORMA DO CADASTRO: `dias` são NOMES, e a hora de cada um vive em `horarios` (16/10/2026) —
   * o `normalizarTurma` descarta o par {dia, hora} em silêncio, e a sala fica sem ritmo. */
  dias: ['segunda', 'quarta'], horarios: { segunda: '18:00', quarta: '18:00' },
      periodoInicio: '2026-11-02', periodoFim: '2026-12-20',
    });
    provar('derivar mudando o PROFESSOR corre a cadeia', pedidosD.length === 2,
      { status: troca.status, erro: troca.dados && troca.dados.erro, pedidos: pedidosD.length });
    provar('…e o gatilho passa a dizer «troca-de-direcao» — o rótulo deixou de mentir',
      pedidosD[1] && pedidosD[1].gatilho === 'troca-de-direcao', pedidosD[1] && pedidosD[1].gatilho);
    provar('…e a sala derivada diz o professor novo, com o elo anterior marcado',
      (() => {
        const todas = JSON.parse(envD.PADD_KV.memoria.get(RAIZ + '/turmas'));
        const nova = todas.filter((t) => t && !t.substituidaPor)[0];
        const velha = todas.filter((t) => t && t.substituidaPor === nova.id)[0];
        return nova.professor === 'redinha-rosa' && Boolean(velha) && velha.professor === 'pe-torto';
      })(), null);
  }

  /* =========================================================================================== */
  console.log('\nB. O que a cadeia diz — e a diferença é entre «silêncio» e «a cadeia fala»');

  /* O ESTADO REAL, depois do gesto de A: a Turma diz o antigo, e o plano diz o antigo. Para a
   * cadeia, não há nada a fazer — o documento concorda com a Turma. */
  const estadoReal = {
    quando: '2026-11-19T18:00:00.000Z',
    ciclo: '01',
    turma: 'Rosa',
    curadoria: turmaDepois,
    elenco: ELENCO,
    plano: {
      id: 'plano-20261110-1304', gerado_em: '2026-11-10T13:04:00.000Z',
      contexto: { escola: ESCOLA, professor: 'pe-torto', turma: 'Rosa', ciclo: '01' },
    },
    po: {
      id: 'po-20261110-1400', gerado_em: '2026-11-10T14:00:00.000Z',
      contexto: { escola: ESCOLA, professor: 'pe-torto', turma: 'Rosa', ciclo: '01' },
    },
  };
  /* SEM `sala` NO ESTADO, a cadeia cai na cópia — e é este o CONTROLADOR da correcção: mostra o
   * que acontecia antes de a Sala ser a fonte. Com `sala`, o mesmo estado é apanhado. */
  const indiceReal = nucleoCadeia.indice(estadoReal);
  const etapaDoPlano = (indiceReal.etapas || []).find((p) => p.chave === 'plano-de-ensino') || {};
  /* A GUARDA QUE EXISTE PARA APANHAR A TROCA DE PROFESSOR NÃO A APANHA. `professorMudou` compara o
   * `contexto.professor` do plano com o da CURADORIA; o gesto de Salas escreveu na SALA. As duas
   * cópias divergiram, e a comparação dá «é o mesmo professor». O que sobra é a data — o plano é de
   * 10/11 e a mudança é de 19/11 —, e é por ela, e não pelo professor, que a etapa fica pendente. */
  provar('com a cópia velha na Turma, a troca de professor NÃO é apanhada: a etapa não fica `bloqueada`',
    etapaDoPlano.estado !== 'bloqueada', etapaDoPlano);
  provar('…e o motivo que sobra é a DATA, e não a direcção — a frase fala de «anterior à mudança»',
    /anterior à mudança/i.test(String(etapaDoPlano.falta || '')), String(etapaDoPlano.falta || '').slice(0, 110));
  /* E O NOME DA BANDEIRA ENGANA: `completa` quer dizer «as quatro peças existem», não «está tudo em
   * dia». Um estado com etapas pendentes vem com `completa: true`. Fica medido para o documento. */
  provar('…e `completa` é «as quatro peças existem», e não «está tudo em dia»',
    indiceReal.completa === true
      && (indiceReal.etapas || []).some((p) => p.estado !== 'feita'),
    { completa: indiceReal.completa,
      estados: (indiceReal.etapas || []).map((p) => p.estado) });

  /* O ESTADO QUE A DERIVAÇÃO DA TURMA PRODUZ: a cópia da Turma passa a ser a nova, e o plano
   * continua a nomear o antigo. Aí a cadeia fala — e diz que a autoria não se reescreve. */
  /* O ESTADO COM A SALA — é o que a produção passa a montar (T1): a direção de hoje vem do
   * registo da Sala, e a cópia da curadoria fica como memória. */
  const estadoComSala = Object.assign({}, estadoReal, {
    sala: Object.assign({}, salaDepois, {}),
  });
  const indiceComSala = nucleoCadeia.indice(estadoComSala);
  const planoComSala = (indiceComSala.etapas || []).find((p) => p.chave === 'plano-de-ensino') || {};
  provar('com a SALA no estado, a cadeia APANHA a troca de professor — a guarda passa a ter dentes',
    planoComSala.estado === 'bloqueada', planoComSala);
  provar('…e a frase nomeia os dois professores, e diz que a autoria não se reescreve',
    /a autoria não se reescreve/i.test(String(planoComSala.falta || '')),
    String(planoComSala.falta || '').slice(0, 130));

  const estadoDerivado = Object.assign({}, estadoReal, {
    curadoria: Object.assign({}, turmaDepois, { professor: 'redinha-rosa' }),
  });
  const indiceDerivado = nucleoCadeia.indice(estadoDerivado);
  const planoDerivado = (indiceDerivado.etapas || []).find((p) => p.chave === 'plano-de-ensino') || {};
  provar('com a cópia nova na Turma, a cadeia dá o plano por BLOQUEADA — a autoria não se reescreve',
    planoDerivado.estado === 'bloqueada', planoDerivado);
  provar('…e a frase diz que o plano é de outro professor, e que quem dirige hoje escreve o dele',
    /autoria não se reescreve/i.test(String(planoDerivado.falta || ''))
      || /escreve o plano dele/i.test(String(planoDerivado.falta || '')),
    String(planoDerivado.falta || '').slice(0, 120));

  /* =========================================================================================== */
  console.log('\nC. A matriz de gatilhos, lida do código — e o que ela diz hoje');

  /* MEDE-SE O FONTE, e diz-se. É a lista dos SÍTIOS que chamam a cadeia: uma execução de cada gesto
   * numa bancada é o passo seguinte (as tarefas), e não o que esta secção afirma. */
  const fonte = fs.readFileSync(path.join(raiz, 'motor/servidor/bastidores.js'), 'utf8').split('\n');
  const rotas = [];
  fonte.forEach((linha, i) => {
    const m = linha.match(/^\s*if \(path === '([^']+)'/);
    if (m) rotas.push({ linha: i + 1, caminho: m[1] });
  });
  const disparam = [];
  for (let k = 0; k < rotas.length; k++) {
    const fim = k + 1 < rotas.length ? rotas[k + 1].linha - 1 : fonte.length;
    const corpo = fonte.slice(rotas[k].linha - 1, fim).join('\n');
    if (corpo.indexOf('rodarCadeia(') !== -1) disparam.push(rotas[k].caminho);
  }
  console.log('        disparam a cadeia: ' + disparam.join(' · '));

  /* As cinco que disparam hoje, nomeadas uma a uma — a asserção falha se uma desaparecer. */
  for (const caminho of [
    '/api/bastidores/turma-editar',
    '/api/bastidores/turma-derivar',
    '/api/bastidores/linha-de-base',
    '/api/bastidores/elenco-mover',
    '/api/bastidores/curadoria-derivar',
    /* T2, 19/11/2026 — o gesto que ela nomeou primeiro. */
    '/api/bastidores/turma-professor',
  ]) {
    provar('dispara a cadeia: ' + caminho, disparam.indexOf(caminho) !== -1, disparam);
  }

  /* E A PONTE MONTA A CADEIA PARA TODAS ELAS (T2, 19/11/2026).
   *
   * O DEFEITO QUE ISTO APANHA, e ele esteve a ponto de entrar: `motor/servidor/producao.js` tem
   * uma lista de GESTOS — as rotas para as quais vale a pena construir a cadeia. Uma rota que
   * chame `rodarCadeia` sem estar nessa lista chama uma cadeia `null`, e a resposta é «a cadeia
   * automática não está montada neste Worker». A bancada não via isto: ela injeta a cadeia de
   * fora, e a ponte não entra no caminho. Duas listas, o mesmo facto — a mesma família de erro do
   * `matriculas` no expurgo, e a mesma cura: comparar código com código. */
  const ponte = fs.readFileSync(path.join(raiz, 'motor/servidor/producao.js'), 'utf8');
  for (const caminho of disparam) {
    if (caminho === '/api/bastidores/cadeia-pacote') continue;
    provar('a ponte monta a cadeia para ' + caminho,
      ponte.indexOf("'" + caminho + "'") !== -1, null);
  }

  /* E as que NÃO disparam, e deviam — é a lista das tarefas. Nomeadas uma a uma para que o
   * documento e a prova não possam divergir em silêncio. */
  const deviam = {
    '/api/bastidores/curadoria': 'gravar a Turma sem plano (elenco, nível, grau, sala)',
    '/api/bastidores/turma-conteudos': 'os conteúdos da Turma',
    '/api/bastidores/turma-conteudo': 'um conteúdo da Turma, um a um',
    '/api/bastidores/verbete': 'o Estilo — o exercício com verbete',
    '/api/bastidores/termo': 'o Dicionário — o exercício que a Turma usa',
  };
  for (const caminho of Object.keys(deviam)) {
    const existe = rotas.some((r) => r.caminho === caminho);
    provar('a rota existe: ' + caminho, existe, null);
    provar('…e NÃO dispara hoje: ' + deviam[caminho], disparam.indexOf(caminho) === -1, disparam);
  }

  /* =========================================================================================== */
  console.log('\nD. O expurgo não deixa nada para trás — a lista declarada cobre o que o código escreve');

  /* A LISTA DO EXPURGO É O PLANO B do dia em que o `kv.list` não responde. Nesse dia, o que não
   * estiver nela FICA — e ficar significa uma escola expurgada a dizer quem estudava nela. A
   * conferência é contra o CÓDIGO: as chaves que os Bastidores escrevem. */
  const { chavesFixasDaEscola } = require(path.join(raiz, 'motor/servidor/expurgar-escola.js'));
  const escritas = new Set();
  for (const ficheiro of ['motor/servidor/bastidores.js', 'motor/servidor/cadeia.js']) {
    const texto = fs.readFileSync(path.join(raiz, ficheiro), 'utf8');
    for (const m of texto.matchAll(/RAIZ \+ '\/' \+ escola \+ '\/([a-z0-9-]+)'/g)) escritas.add(m[1]);
  }
  const declaradas = new Set(chavesFixasDaEscola(ESCOLA)
    .map((k) => k.split('/').pop()));
  const fora = [...escritas].filter((k) => !declaradas.has(k)).sort();
  provar('toda a chave que os Bastidores escrevem está na lista do expurgo',
    fora.length === 0, { escritas: [...escritas].sort(), fora });
  /* E AS DUAS QUE FALTAVAM, nomeadas: a asserção acima falha se uma delas sair, e esta diz qual. */
  for (const chave of ['matriculas', 'cadeia']) {
    provar('…incluindo `' + chave + '`, que faltava até 19/11/2026',
      declaradas.has(chave) && escritas.has(chave), { escrita: escritas.has(chave), declarada: declaradas.has(chave) });
  }

  /* =========================================================================================== */
  console.log('\nE. A troca de MODALIDADE bloqueia — o instrumento não se converte (T3, 19/11/2026)');

  /* «A minha turma é iniciante; se eu botar algo complexo aqui já não está legal.» A modalidade não
   * é etiqueta: é o corpo de referência com que se mede — a régua vem com o par
   * (`conferirOParDaSala`), os níveis são outros, e as anamneses são por modalidade. Ela decidiu:
   * **bloqueia**, como a autoria. O plano escrito sob o clássico não se converte em plano da
   * moderna — quem o escreve é o professor.
   *
   * A guarda compara a modalidade que o DOCUMENTO declara (`contexto.modalidade`, escrito pela
   * porta a partir da Sala) com a que a SALA declara hoje. */
  const salaDaModalidade = (modalidade) => Object.assign({}, salaDepois, { modalidade });
  const comModalidade = (declarada) => {
    const ctx = (doc) => Object.assign({}, doc.contexto, declarada ? { modalidade: declarada } : {});
    return {
      quando: '2026-11-19T18:00:00.000Z', ciclo: '01', turma: 'Rosa',
      sala: salaDaModalidade('Dança moderna'),
      curadoria: Object.assign({}, turmaDepois, { professor: 'redinha-rosa', modalidade: 'Balé clássico' }),
      elenco: ELENCO,
      plano: { id: 'plano-20261110-1304', gerado_em: '2026-11-10T13:04:00.000Z',
        contexto: ctx({ escola: ESCOLA, professor: 'redinha-rosa', turma: 'Rosa', ciclo: '01' }) },
      po: { id: 'po-20261110-1400', gerado_em: '2026-11-10T14:00:00.000Z',
        contexto: ctx({ escola: ESCOLA, professor: 'redinha-rosa', turma: 'Rosa', ciclo: '01' }) },
    };
  };
  const etapa = (indice, chave) => (indice.etapas || []).find((p) => p.chave === chave) || {};

  const trocou = nucleoCadeia.indice(comModalidade('Balé clássico'));
  const planoDaTroca = etapa(trocou, 'plano-de-ensino');
  provar('a modalidade mudou e o plano declara a antiga: a etapa fica BLOQUEADA',
    planoDaTroca.estado === 'bloqueada', planoDaTroca);
  provar('…e a frase nomeia as duas modalidades — a que o documento declara e a que vale hoje',
    /Balé clássico/.test(String(planoDaTroca.falta || ''))
      && /Dança moderna/.test(String(planoDaTroca.falta || '')),
    String(planoDaTroca.falta || '').slice(0, 150));
  provar('…e diz que NÃO é a mesma escala — a régua vem com o par, e os níveis são outros',
    /régua vem com o par/i.test(String(planoDaTroca.falta || ''))
      && /níveis são outros/i.test(String(planoDaTroca.falta || '')),
    String(planoDaTroca.falta || '').slice(0, 150));
  provar('…e diz o que fazer: quem dirige escreve o dele, sob a modalidade que vale hoje',
    /escreve o dele/.test(String(planoDaTroca.falta || ''))
      && /modalidade que vale hoje/i.test(String(planoDaTroca.falta || '')),
    String(planoDaTroca.falta || '').slice(0, 150));
  provar('…e o PO também fica BLOQUEADA — ele mede contra os níveis da régua do par',
    etapa(trocou, 'plano-de-observacao').estado === 'bloqueada',
    etapa(trocou, 'plano-de-observacao'));

  /* O VAZIO NÃO CONTA, e é a convenção de sempre: o elo anterior a esta data não declara a
   * modalidade, e não declarar não é estar errado. Sem isto, a correcção transformaria todo o
   * acervo antigo em «bloqueado» no dia em que entrasse. */
  const antigo = nucleoCadeia.indice(comModalidade(''));
  provar('um elo que não declara modalidade NÃO é bloqueado — o vazio não é erro',
    etapa(antigo, 'plano-de-ensino').estado !== 'bloqueada', etapa(antigo, 'plano-de-ensino'));

  /* E O CONTRÁRIO, para a guarda não ser um «bloqueia tudo»: com a mesma modalidade dos dois
   * lados, o que sobra é a data — e é `pendente`, que a cadeia sabe fazer. */
  const planoIgual = etapa(nucleoCadeia.indice(comModalidade('Dança moderna')), 'plano-de-ensino');
  provar('com a mesma modalidade de parte a parte, a guarda não dispara',
    planoIgual.estado === 'pendente' && !/modalidade/i.test(String(planoIgual.falta || '')),
    planoIgual);

  /* E A ROTA JÁ DIZ QUE FOI A MODALIDADE, e não o professor — é o que a tela lê para escolher a
   * frase. (O que a cadeia FAZ com a troca mede-se acima, no núcleo: aqui a travessia é contada,
   * não executada.) */
  provar('…e o gesto da Sala nomeia a modalidade como o que mudou, e não o professor',
    Boolean(soModalidade.dados && soModalidade.dados.trocou
      && soModalidade.dados.trocou.modalidade === true
      && soModalidade.dados.trocou.professor === false),
    soModalidade.dados && soModalidade.dados.trocou);

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * T7 — O RITMO DA SALA MANDA, E NÃO ESPERA PELA DATA (20/11/2026)
   *
   * O QUE ACONTECEU, com os números dela. A Sala `Rosa` foi derivada mudando o horário (14:30), a
   * duração (45 → 60 min) e o fim do período (05/02 → 08/01). A Sala derivou e persistiu; o plano
   * e o PO, não. O log da cadeia diz, com todas as letras:
   *
   *   mudanca-de-sala · plano-de-ensino feita (plano-20261119-2144) · pacote falta
   *
   * — e o documento gerado saiu a dizer «45 minutos» sobre uma Sala de 60.
   *
   * A causa: o plano é de `2026-11-19T21:44`, a vigência da Sala é a DATA `2026-11-19`, e a
   * comparação de strings dá o carimbo por mais novo (o prefixo bate, a string maior ganha). A
   * mudança foi às 23:34 do mesmo dia — duas horas depois do plano, e a data não sabe disso.
   *
   * O que se mede aqui é a guarda NOVA: o ritmo declarado pelo documento contra o que a Sala
   * declara hoje. E mede-se também o que ela NÃO pode fazer — acusar quando os dois coincidem.
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('');
  {
    /* O CASO DELA, com os dois lados como estavam de verdade. */
    const planoDe45 = {
      id: 'plano-20261119-2144', gerado_em: '2026-11-19T21:44',
      contexto: { escola: ESCOLA, professor: 'pe-torto', turma: 'Rosa', ciclo: '01',
        modalidade: 'Balé clássico' },
      respostas: {
        'contexto-frequencia': { vezes: 3, por: 'semanal', dias: ['seg', 'qua', 'sex'] },
        'contexto-duracao': [{ numero: 45, unidade: 'minuto' }],
        'contexto-calendario': { inicio: '2026-12-14', fim: '2027-02-05' },
        'contexto-total-aulas': 24,
        'objetivo-geral': 'o mesmo texto de sempre',
      },
    };
    const ritmoNovo = {
      'contexto-frequencia': { vezes: 3, por: 'semanal', dias: ['seg', 'qua', 'sex'] },
      'contexto-duracao': [{ numero: 1, unidade: 'hora' }],
      'contexto-calendario': { inicio: '2026-12-14', fim: '2027-01-08' },
      'contexto-total-aulas': 12,
    };
    const base = {
      quando: '2026-11-19', ciclo: '01', turma: 'Rosa',
      sala: { nome: 'Rosa', professor: 'pe-torto', modalidade: 'Balé clássico',
        dias: ['seg', 'qua', 'sex'], horarios: { seg: '14:30', qua: '14:30', sex: '14:30' },
        frequencia: 3, duracaoMin: 60, periodoInicio: '2026-12-14', periodoFim: '2027-01-08' },
      curadoria: TURMA, elenco: ELENCO,
      po: { id: 'po-20261119-2144', gerado_em: '2026-11-19T21:44',
        contexto: { escola: ESCOLA, professor: 'pe-torto', turma: 'Rosa', ciclo: '01',
          modalidade: 'Balé clássico' },
        respostas: {} },
    };

    const comRitmo = nucleoCadeia.indice(Object.assign({}, base, {
      plano: planoDe45, ritmo: ritmoNovo,
    }));
    const etapaDoRitmo = etapa(comRitmo, 'plano-de-ensino');
    provar('T7 · o plano declara 45 min e a Sala declara 60: a etapa fica PENDENTE (deriva)',
      etapaDoRitmo.estado === 'pendente', etapaDoRitmo.estado);
    provar('T7 · …e a frase diz o ritmo de hoje em português, para o professor reconhecê-lo',
      /60 minutos/.test(String(etapaDoRitmo.falta || ''))
        && /3× por semana/.test(String(etapaDoRitmo.falta || ''))
        && /2027-01-08/.test(String(etapaDoRitmo.falta || '')),
      String(etapaDoRitmo.falta || '').slice(0, 180));

    /* A MESMA DATA, O MESMO DIA — e é isso que a data sozinha não conseguia distinguir: o plano
     * de 21:44 é anterior à mudança das 23:34, e `'2026-11-19T21:44' >= '2026-11-19'` dizia que
     * não. Aqui o `quando` é o mesmo, e o que muda é o ritmo: a guarda apanha-o. */
    provar('T7 · a data não decide: com o MESMO `quando`, é o ritmo que faz a etapa derivar',
      nucleoCadeia.indice(Object.assign({}, base, { plano: planoDe45 }))
        .etapas.find((p) => p.chave === 'plano-de-ensino').estado === 'feita',
      'sem ritmo no estado, a data antiga dava a etapa por feita');

    /* E O CONTRÁRIO, para não ser um «deriva sempre»: o mesmo ritmo dos dois lados não acusa. */
    const planoDe60 = Object.assign({}, planoDe45, { respostas: Object.assign({},
      planoDe45.respostas, ritmoNovo) });
    provar('T7 · CONTROLE NEGATIVO: com o mesmo ritmo de parte a parte, a guarda não dispara',
      nucleoCadeia.indice(Object.assign({}, base, { plano: planoDe60, ritmo: ritmoNovo }))
        .etapas.find((p) => p.chave === 'plano-de-ensino').estado === 'feita');

    /* A DURAÇÃO É COMPARADA EM MINUTOS: 1 hora e 60 minutos são o mesmo ritmo, e uma comparação
     * de texto acusaria uma mudança que não houve. */
    const planoEmMinutos = Object.assign({}, planoDe45, {
      respostas: Object.assign({}, planoDe45.respostas, ritmoNovo,
        { 'contexto-duracao': [{ numero: 60, unidade: 'minuto' }] }),
    });
    provar('T7 · 1 hora e 60 minutos são o MESMO ritmo — a comparação é em minutos, não em texto',
      nucleoCadeia.indice(Object.assign({}, base, { plano: planoEmMinutos, ritmo: ritmoNovo }))
        .etapas.find((p) => p.chave === 'plano-de-ensino').estado === 'feita');

    /* OS DIAS FORA DE ORDEM também são o mesmo ritmo: o professor não muda de horário por a lista
     * ter sido gravada noutra ordem. */
    const foraDeOrdem = Object.assign({}, planoDe45, {
      respostas: Object.assign({}, planoDe45.respostas, ritmoNovo,
        { 'contexto-frequencia': { vezes: 3, por: 'semanal', dias: ['sex', 'seg', 'qua'] } }),
    });
    provar('T7 · os dias fora de ordem são o mesmo ritmo — compara-se o conjunto, não a lista',
      nucleoCadeia.indice(Object.assign({}, base, { plano: foraDeOrdem, ritmo: ritmoNovo }))
        .etapas.find((p) => p.chave === 'plano-de-ensino').estado === 'feita');

    /* O VAZIO NÃO CONTA, pela convenção de sempre: um elo de antes de um campo existir não declara
     * esse campo. Sem isto, a correcção punha todo o acervo antigo a derivar no dia em que entrasse. */
    const semRitmoGravado = Object.assign({}, planoDe45, { respostas: {} });
    provar('T7 · um elo que não declara ritmo nenhum não é acusado — o vazio não é erro',
      nucleoCadeia.indice(Object.assign({}, base, { plano: semRitmoGravado, ritmo: ritmoNovo }))
        .etapas.find((p) => p.chave === 'plano-de-ensino').estado === 'feita');

    /* E O PO SEGUE A MESMA SORTE: ele observa um plano que declara o ritmo antigo, e a etapa
     * desce para pendente — o PO novo nasce do plano novo. */
    const poDe45 = Object.assign({}, base.po, { respostas: planoDe45.respostas });
    const comPo = nucleoCadeia.indice(Object.assign({}, base, {
      plano: planoDe45, po: poDe45, ritmo: ritmoNovo,
    }));
    provar('T7 · …e o PO desce com ele: o plano mudou, a observação do plano muda',
      etapa(comPo, 'plano-de-observacao').estado === 'pendente',
      etapa(comPo, 'plano-de-observacao').estado);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: mudar o par de uma Sala percorre a cadeia pelos dois '
      + 'caminhos que existem (a rota do par e a derivação), e o gatilho diz o que mudou — ritmo ou '
      + 'direção; a direção de hoje lê-se da Sala (T1), a lista que autoriza o plano mostra a turma '
      + 'a quem a dá, e a cadeia apanha a troca com a frase da autoria; quando a travessia pára num '
      + 'facto, a resposta leva a frase desse facto (`parouPor`); a ponte monta a cadeia para as '
      + 'rotas que a disparam, e a lista do expurgo cobre todas as chaves que o código escreve. '
      + 'E a troca de MODALIDADE bloqueia (T3): a guarda compara a modalidade que o documento '
      + 'declara com a que a Sala declara hoje, o vazio não é erro, e a frase diz que a régua vem '
      + 'com o par.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((e) => {
  console.error('a prova interrompeu-se: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
