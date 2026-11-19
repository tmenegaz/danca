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
 *      · a resposta ainda NÃO traz `cadeia`: o fluxo não é disparado (é o T2 do plano);
 *      · a lista que autoriza o plano passa a mostrar a turma a quem a dá — a direção de hoje lê-se
 *        da SALA (T1, implementado a 19/11/2026), e não da cópia.
 *   B. O QUE A CADEIA DIZ NOS DOIS ESTADOS. Com a cópia velha na Turma (o estado real depois de A),
 *      o plano é dado por `feita` — silêncio. Com a cópia nova (o estado que a derivação da Turma
 *      produz), o plano é `bloqueada` — a cadeia fala, e diz que a autoria não se reescreve.
 *   C. A MATRIZ DE GATILHOS, lida do código-fonte. Quais rotas chamam `rodarCadeia` — e, portanto,
 *      quais gestos percorrem a cadeia hoje. Mede-se o FONTE, e diz-se isso: é a lista dos sítios,
 *      não uma execução de cada um.
 *   D. O EXPURGO. A lista declarada do expurgo cobre todas as chaves que o código escreve — a
 *      conferência é contra o código, e não contra a memória (é o que ela pediu: «precisa ser
 *      verificado no expurgo para não ficar para trás»).
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
  dias: [{ dia: 'segunda', hora: '18:00' }, { dia: 'quarta', hora: '18:00' }],
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

  /* O FLUXO NÃO É DISPARADO. A resposta é o sítio onde o gesto diria o que fez à cadeia — é o
   * contrato que as cinco rotas que a chamam cumprem (`cadeia: {...}`). */
  provar('…e o gesto NÃO dispara a cadeia: a resposta não traz `cadeia`',
    par.dados && par.dados.cadeia === undefined, par.dados && Object.keys(par.dados));

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
  ]) {
    provar('dispara a cadeia: ' + caminho, disparam.indexOf(caminho) !== -1, disparam);
  }

  /* E as que NÃO disparam, e deviam — é a lista das tarefas. Nomeadas uma a uma para que o
   * documento e a prova não possam divergir em silêncio. */
  const deviam = {
    '/api/bastidores/turma-professor': 'mudar o professor (ou a modalidade) de uma sala',
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

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o gesto de mudar o professor de uma sala grava a Sala, '
      + 'guarda a cópia na Turma como memória e ainda NÃO dispara a cadeia; a direção de hoje lê-se '
      + 'da Sala — a lista que autoriza o plano mostra a turma a quem a dá, e a cadeia apanha a '
      + 'troca com a frase da autoria; a lista do expurgo cobre todas as chaves que o código escreve. '
      + 'As cinco rotas que disparam a cadeia e as seis que deviam e não disparam estão nomeadas.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((e) => {
  console.error('a prova interrompeu-se: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
