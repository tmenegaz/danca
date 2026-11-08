#!/usr/bin/env node
'use strict';

/**
 * provar-transferencia-e-desligamento.js — as duas portas do fluxo da escola (08/11/2026).
 *
 * O QUE ESTA PROVA MEDE, e porque é que cada asserção existe.
 *
 * **A. A ALUNA MUDA DE ELENCO — num só acto.** Até hoje eram dois: reabrir o elenco A, desmarcar e
 * concluir; reabrir o B, marcar e concluir. A metade feita não avisava, e a aluna ficava fora de
 * todos os elencos — o único caminho deste sistema por onde uma aluna podia **desaparecer sem erro
 * nenhum**. A prova mede as duas versões, o que cada uma DIZ (`transferida`/`recebida`), o que cai
 * (a `leitura`, que descrevia outros corpos) e o que fica (`lida`, que é proveniência).
 *
 * **B. O PROFESSOR DEIXA A ESCOLA — e a Turma não pára.** O `DELETE` recusava em cascata: curadoria
 * → curadoria com plano não se apaga → **um professor que deu aula nunca podia sair**. A prova mede
 * o desligamento: o registo marcado, a curadoria **encerrada com data** (não apagada), a turma
 * **marcada** `descontinuada` com o motivo escrito — e o enquadramento a dizer «a direção foi
 * encerrada», em vez de mostrar o professor que saiu como se ainda estivesse lá.
 *
 * **C. AS ROTAS, no entrypoint verdadeiro.** As duas regras puras não bastam: o que a pessoa usa é a
 * rota. A prova chama `bastidores.fetch` com um KV em memória, um GitHub em memória e a senha da
 * direção, e mede o que fica gravado: o **destino escreve primeiro** (se a origem falhar, ela está
 * nos dois — nunca em nenhum), o desligamento em três escritas, o dono recusado, o desligado fora
 * das listas de escolha, o recadastro do mesmo identificador a **reactivar**, e o `DELETE` a dizer
 * que o registo é proveniência.
 *
 *   node experimentos/provar-transferencia-e-desligamento.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const transferencia = require(path.join(RAIZ, 'motor/nucleo/transferencia.js'));
const desligamento = require(path.join(RAIZ, 'motor/nucleo/desligamento.js'));
const enquadramento = require(path.join(RAIZ, 'motor/nucleo/enquadramento.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'calango';
const QUANDO = '2026-11-08T15:00:00.000Z';

/** Uma linha de base CONCLUÍDA — com recorte, que é o que a transferência exige. */
function linha(extra) {
  return Object.assign({
    id: 'elenco-a',
    nome: 'Nível 1 — mobilidade e pés',
    professor: 'pe-torto',
    alunas: ['Aluna A', 'Aluna B', 'Aluna C'],
    campos: [{ id: 'formato-anatomico-dos-joelhos', nome: 'Formato', grupo: 'Técnica' }],
    atualizada_em: '2026-11-07T10:00:00.000Z',
    carimbo: '20261107-1000',
    chave: 'elenco-a--20261107-1000.json',
    enviada_em: '2026-11-07T10:00:00.000Z',
  }, extra || {});
}

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

/**
 * O GitHub em memória — o mesmo desenho de `provar-linha-de-base-no-repo.js`: `contents` GET/PUT e
 * `git/trees`. Um PUT a um ficheiro existente exige `sha` (é o 409 da vida real), e a ordem das
 * escritas fica registada em `escritas` — é ela que prova que o DESTINO entra primeiro.
 */
function githubDeBolso(arquivos) {
  const ficheiros = new Map(Object.entries(arquivos || {}));
  const escritas = [];
  const b64 = (t) => Buffer.from(String(t), 'utf8').toString('base64');
  const json = (o, status) => new Response(JSON.stringify(o),
    { status: status || 200, headers: { 'content-type': 'application/json' } });
  const fetchFalso = async (url, opcoes) => {
    const u = new URL(String(url));
    const metodo = (opcoes && opcoes.method) || 'GET';
    if (u.pathname.indexOf('/git/trees/') !== -1) {
      return json({ sha: 'arvore', tree: [...ficheiros.keys()].map((p) => ({ path: p, type: 'blob', sha: 's' })) });
    }
    const m = /\/contents\/(.+)$/.exec(u.pathname);
    if (!m) return new Response('nao', { status: 404 });
    const caminho = decodeURIComponent(m[1]);
    if (metodo === 'GET') {
      if (!ficheiros.has(caminho)) return new Response('nao', { status: 404 });
      return json({ sha: 'sha-' + caminho, content: b64(ficheiros.get(caminho)) });
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
      const texto = Buffer.from(String(corpo.content), 'base64').toString('utf8');
      escritas.push({ caminho, mensagem: corpo.message || '', texto });
      ficheiros.set(caminho, texto);
      return json({ commit: { sha: 'c' + escritas.length } }, ficheiros.size ? 201 : 201);
    }
    return new Response('nao', { status: 405 });
  };
  return { fetchFalso, escritas, ficheiros };
}

(async () => {
  const fetchOriginal = globalThis.fetch;

  // ==========================================================================================
  console.log('\nA. A ALUNA MUDA DE ELENCO — o núcleo');

  {
    const origem = linha();
    const destino = linha({
      id: 'elenco-b', nome: 'Nível 1 — allegro', alunas: ['Aluna D'],
      campos: [{ id: 'impulsao-e-absorcao-allegro', nome: 'Impulsão', grupo: 'Técnica' }],
      lida: { 'Aluna D': '2026-11-06T09:00:00.000Z' },
    });
    const r = transferencia.moverAluna({
      origem, destino, aluna: 'Aluna B', quando: QUANDO, motivo: 'mudou de horário',
    });
    provar('o acto é aceite', r.ok === true, r.erros);
    provar('a origem fica SEM ela, e com as outras duas',
      JSON.stringify(r.origem.alunas) === JSON.stringify(['Aluna A', 'Aluna C']), r.origem.alunas);
    provar('o destino fica COM ela, ao lado de quem já estava',
      JSON.stringify(r.destino.alunas) === JSON.stringify(['Aluna D', 'Aluna B']), r.destino.alunas);
    provar('a origem DIZ para onde foi — aluna, elenco, data e motivo',
      r.origem.transferida && r.origem.transferida.aluna === 'Aluna B'
        && r.origem.transferida.para === 'elenco-b' && r.origem.transferida.em === QUANDO
        && r.origem.transferida.motivo === 'mudou de horário', r.origem.transferida);
    provar('o destino DIZ de onde veio',
      r.destino.recebida && r.destino.recebida.de === 'elenco-a'
        && r.destino.recebida.aluna === 'Aluna B', r.destino.recebida);
    provar('a leitura cai nos DOIS — ela descrevia outros corpos',
      r.origem.leitura === undefined && r.destino.leitura === undefined);
    provar('a proveniência (`lida`) FICA — quem leu, leu',
      r.destino.lida && r.destino.lida['Aluna D'] === '2026-11-06T09:00:00.000Z', r.destino.lida);
    provar('as marcas da versão anterior NÃO passam (o `concluir` repõe as suas)',
      r.origem.chave === undefined && r.origem.carimbo === undefined
        && r.origem.anterior === undefined, { chave: r.origem.chave, carimbo: r.origem.carimbo });
    provar('o recorte dos dois fica intacto',
      r.origem.campos.length === 1 && r.destino.campos[0].id === 'impulsao-e-absorcao-allegro');
    provar('as linhas de ENTRADA não são mutadas (o núcleo devolve cópias)',
      origem.alunas.length === 3 && destino.alunas.length === 1, { o: origem.alunas, d: destino.alunas });
  }

  {
    const origem = linha();
    const destino = linha({ id: 'elenco-b', alunas: ['Aluna D'] });
    const casos = [
      ['aluna fora da origem', { aluna: 'Aluna Z' }, /não está no elenco/],
      ['mesma origem e destino', { destino: linha({ id: 'elenco-a' }) }, /o mesmo elenco/],
      ['elenco de origem rascunho', { origem: linha({ campos: [] }) }, /ainda é um rascunho/],
      ['elenco apagado', { destino: linha({ id: 'elenco-b', apagada_em: QUANDO }) }, /foi apagado/],
      ['sem motivo não é recusa (é opcional)', { motivo: '' }, null],
    ];
    for (const [rotulo, extra, esperado] of casos) {
      const r = transferencia.moverAluna(Object.assign({
        origem, destino, aluna: 'Aluna B', quando: QUANDO,
      }, extra));
      if (esperado) provar('recusa: ' + rotulo, r.ok === false && esperado.test(r.erros.join(' ')), r.erros);
      else provar('aceita: ' + rotulo, r.ok === true, r.erros);
    }
    const jaLa = transferencia.moverAluna({ origem: linha({ alunas: ['Aluna A', 'Aluna B'] }),
      destino: linha({ id: 'elenco-b', alunas: ['Aluna B'] }), aluna: 'Aluna B', quando: QUANDO });
    provar('recusa: a aluna já está no destino', jaLa.ok === false && /já está no elenco/.test(jaLa.erros.join(' ')), jaLa.erros);
  }

  // ==========================================================================================
  console.log('\nB. O PROFESSOR DEIXA A ESCOLA — o núcleo');

  const PE_TORTO = { nome: 'Pe Torto', slug: 'pe-torto' };
  const OUTRA = { nome: 'Outra Professora', slug: 'outra-professora' };
  const curadoriasBase = () => ([
    { id: 'pe-torto-bale-sala-rosa', professor: 'pe-torto', modalidade: 'bale-classico',
      tradicao: 'RAD', turmas: ['Sala Rosa'], alunas: ['Aluna A'] },
    { id: 'pe-torto-bale-sala-azul', professor: 'Pe Torto', modalidade: 'bale-classico',
      tradicao: 'RAD', turmas: ['Sala Azul'], alunas: ['Aluna B'] },
    { id: 'pe-torto-bale-sala-verde', professor: 'pe-torto', modalidade: 'bale-classico',
      tradicao: 'RAD', turmas: ['Sala Verde'], alunas: [], substituidaPor: 'pe-torto-bale-sala-verde-2026-10-01' },
    { id: 'outra-bale-sala-rosa', professor: 'outra-professora', modalidade: 'bale-classico',
      tradicao: 'RAD', turmas: ['Sala Coral'], alunas: ['Aluna D'] },
  ]);
  const turmasBase = () => ([
    { nome: 'Sala Rosa', dias: ['2'], duracaoMin: 60, periodoInicio: '2026-08-01', periodoFim: '2026-12-01' },
    { nome: 'Sala Azul', dias: ['4'], duracaoMin: 60, periodoInicio: '2026-08-01', periodoFim: '2026-12-01' },
    { nome: 'Sala Verde', dias: ['6'], duracaoMin: 60, periodoInicio: '2026-08-01', periodoFim: '2026-12-01' },
    { nome: 'Sala Coral', dias: ['3'], duracaoMin: 60, periodoInicio: '2026-08-01', periodoFim: '2026-12-01' },
  ]);

  {
    const r = desligamento.desligarProfessor({
      professor: PE_TORTO, professores: [PE_TORTO, OUTRA],
      curadorias: curadoriasBase(), turmas: turmasBase(),
      quando: QUANDO, motivo: 'fim do contrato', por: 'Direção',
    });
    provar('o desligamento é aceite', r.ok === true, r.erros);
    provar('o registo diz QUANDO, PORQUÊ e POR QUEM',
      r.professor.desligado_em === QUANDO && r.professor.desligado_motivo === 'fim do contrato'
        && r.professor.desligado_por === 'Direção', r.professor);
    const porId = new Map(r.curadorias.map((c) => [c.id, c]));
    provar('as DUAS curadorias vigentes dele ficam encerradas com data e motivo',
      porId.get('pe-torto-bale-sala-rosa').encerrada_em === QUANDO
        && porId.get('pe-torto-bale-sala-azul').encerrada_em === QUANDO
        && porId.get('pe-torto-bale-sala-azul').encerrada_motivo === 'fim do contrato',
      porId.get('pe-torto-bale-sala-azul'));
    provar('…e são encerradas pelo NOME ou pelo slug (as duas formas do registo)',
      r.encerradas.length === 2, r.encerradas);
    provar('a curadoria JÁ SUBSTITUÍDA não se encerra outra vez (é passado)',
      porId.get('pe-torto-bale-sala-verde').encerrada_em === undefined,
      porId.get('pe-torto-bale-sala-verde'));
    provar('a curadoria de OUTRA pessoa não é tocada',
      porId.get('outra-bale-sala-rosa').encerrada_em === undefined);
    const turmaDe = (nome) => r.turmas.find((t) => t.nome === nome);
    provar('as turmas que ficaram sem ele são MARCADAS, não apagadas',
      Boolean(turmaDe('Sala Rosa').descontinuada) && Boolean(turmaDe('Sala Azul').descontinuada));
    provar('…e a marca diz porquê (quem saiu, quando, e o que a direção decide)',
      /Pe Torto/.test(turmaDe('Sala Rosa').descontinuada.motivo)
        && /2026-11-08/.test(turmaDe('Sala Rosa').descontinuada.motivo)
        && /direção/i.test(turmaDe('Sala Rosa').descontinuada.motivo),
      turmaDe('Sala Rosa').descontinuada);
    provar('a turma da OUTRA professora não é marcada',
      turmaDe('Sala Coral').descontinuada === undefined);
    provar('o relatório diz quais ficaram sem professor',
      r.turmasSemProfessor.length === 2
        && r.turmasSemProfessor.every((t) => t.modalidade === 'bale-classico'),
      r.turmasSemProfessor);
  }

  {
    const semMotivo = desligamento.desligarProfessor({
      professor: PE_TORTO, professores: [PE_TORTO], curadorias: [], turmas: [], quando: QUANDO, motivo: '  ',
    });
    provar('recusa: o motivo é obrigatório (é a memória da escola)',
      semMotivo.ok === false && /motivo/.test(semMotivo.erros.join(' ')), semMotivo.erros);
    const jaSaiu = desligamento.desligarProfessor({
      professor: Object.assign({}, PE_TORTO, { desligado_em: '2026-10-01T00:00:00.000Z' }),
      professores: [PE_TORTO], curadorias: [], turmas: [], quando: QUANDO, motivo: 'x',
    });
    provar('recusa: já desligado',
      jaSaiu.ok === false && /já foi desligado/.test(jaSaiu.erros.join(' ')), jaSaiu.erros);
    provar('acha o professor pelo nome E pelo slug, e não inventa quem não existe',
      desligamento.acharProfessor([PE_TORTO], 'Pe Torto') === PE_TORTO
        && desligamento.acharProfessor([PE_TORTO], 'pe-torto') === PE_TORTO
        && desligamento.acharProfessor([PE_TORTO], 'ninguem') === null);
    provar('a recusa do dono diz a razão (a âncora da escola)',
      /âncora/.test(desligamento.motivoDaRecusaDoDono('Dona')));
  }

  {
    const r = desligamento.desligarProfessor({
      professor: PE_TORTO, professores: [PE_TORTO], curadorias: curadoriasBase(), turmas: turmasBase(),
      quando: QUANDO, motivo: 'fim do contrato',
    });
    const enq = enquadramento.enquadramentoDaTurma({ nome: 'Sala Rosa' }, r.curadorias);
    provar('depois do desligamento, a turma NÃO tem direção activa',
      enq.curadoria === null, enq);
    provar('…mas o enquadramento diz de QUEM era, e que foi encerrada',
      enq.de === 'encerrada' && enq.professor === 'pe-torto' && Boolean(enq.encerrada), enq.de);
    const resumo = enquadramento.resumoDoEnquadramento({ nome: 'Sala Rosa' }, r.curadorias);
    provar('o resumo diz «sem professor — a direção … foi encerrada em …»',
      /sem professor/.test(resumo.texto) && /encerrada em/.test(resumo.texto)
        && resumo.temCuradoria === false, resumo.texto);
    /* E A NOVA DIREÇÃO VOLTA A ENQUADRAR — a marca não é perpétua. */
    const comSucessora = r.curadorias.concat([{
      id: 'outra-bale-sala-rosa-2026-11-09', professor: 'outra-professora',
      modalidade: 'bale-classico', tradicao: 'RAD', turmas: ['Sala Rosa'], alunas: [],
    }]);
    const enq2 = enquadramento.enquadramentoDaTurma({ nome: 'Sala Rosa' }, comSucessora);
    provar('uma direção nova volta a enquadrar a turma',
      enq2.de === 'curadoria' && enq2.professor === 'outra-professora', enq2);
  }

  // ==========================================================================================
  console.log('\nC. AS ROTAS — no entrypoint verdadeiro');

  const senha = 'senha-de-prova';
  const prepEnv = (estado) => ({
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: senha, SENHA_PROFESSOR: 'outra',
    PROFESSOR_NOME: 'Professora Dona', PROFESSOR_SLUG: 'dona',
    GITHUB_TOKEN: 'token-de-prova',
    PADD_KV: kvDeMentira(estado.kv || {}),
  });
  const pedir = async (env, caminho, corpo, metodo) => {
    const verbo = metodo || (corpo === undefined ? 'GET' : 'POST');
    const init = corpo === undefined ? { method: verbo } : {
      method: verbo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
    };
    const r = await bastidores.fetch(
      new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho, init), env);
    const texto = await r.text();
    let json = null;
    try { json = JSON.parse(texto); } catch (erro) { json = null; }
    return { status: r.status, json, texto };
  };

  const elencoA = linha();
  const elencoB = linha({
    id: 'elenco-b', nome: 'Nível 1 — allegro', alunas: ['Aluna D'],
    carimbo: '20261107-1100', chave: 'elenco-b--20261107-1100.json',
  });
  const caminhoDe = (l) => 'escola/' + ESCOLA + '/linhas-de-base/' + l.id + '--' + l.carimbo + '.json';
  /* O ÍNDICE DAS VERSÕES ENTRA SEMEADO, e não é detalhe da bancada: em produção ele nasce com a
   * primeira linha concluída e é a fonte de `vigentes()`. Sem ele a leitura cai na ÁRVORE — um
   * recurso para o dia em que o índice falta —, e a bancada mediria esse recurso em vez do caminho
   * normal. (Foi o que aconteceu à primeira tentativa: a segunda versão não achava `anterior`,
   * porque o índice criado pela primeira escrita só conhecia um dos elencos.) */
  const indiceDoElenco = () => ({
    versao: 1,
    versoes: Object.fromEntries([elencoA, elencoB].map((l) => [l.id + '--' + l.carimbo + '.json', {
      id: l.id, carimbo: l.carimbo, arquivo: caminhoDe(l), nome: l.nome,
      professor: l.professor, turma: null, atualizada_em: l.atualizada_em,
      enviada_em: l.enviada_em, aspectos: (l.campos || []).map((c) => c.id),
      alunas: l.alunas.length,
    }])),
  });
  const arquivosDoRepo = () => {
    const a = Object.assign({}, elencoA);
    const b = Object.assign({}, elencoB);
    return {
      [caminhoDe(elencoA)]: JSON.stringify(a, null, 2) + '\n',
      [caminhoDe(elencoB)]: JSON.stringify(b, null, 2) + '\n',
      ['escola/' + ESCOLA + '/linhas-de-base/.indice.json']: JSON.stringify(indiceDoElenco(), null, 2) + '\n',
    };
  };

  /* C1. A TRANSFERÊNCIA grava as duas versões, e o DESTINO primeiro. */
  {
    const gh = githubDeBolso(arquivosDoRepo());
    const env = prepEnv({});
    globalThis.fetch = gh.fetchFalso;
    let r;
    try {
      r = await pedir(env, '/api/bastidores/elenco-mover', {
        aluna: 'Aluna B', de: 'elenco-a', para: 'elenco-b',
        motivo: 'mudou de horário', senhaDirecao: senha,
      });
    } finally { globalThis.fetch = fetchOriginal; }
    provar('a transferência responde 200', r.status === 200, { status: r.status, corpo: r.texto.slice(0, 200) });
    provar('…e diz quem, de onde e para onde',
      r.json && r.json.aluna === 'Aluna B' && r.json.de === 'elenco-a' && r.json.para === 'elenco-b',
      r.json);
    const versoes = gh.escritas.filter((e) => e.caminho.indexOf('.indice.json') === -1);
    provar('duas versões escritas (uma por elenco)', versoes.length === 2, versoes.map((v) => v.caminho));
    provar('O DESTINO escreve PRIMEIRO — a ordem que nunca perde a aluna',
      versoes[0] && /elenco-b/.test(versoes[0].caminho), versoes.map((v) => v.caminho));
    const doDestino = JSON.parse(versoes[0].texto);
    const daOrigem = JSON.parse(versoes[1].texto);
    provar('a versão do destino tem a aluna, e diz de onde veio',
      doDestino.alunas.indexOf('Aluna B') !== -1 && doDestino.recebida
        && doDestino.recebida.de === 'elenco-a', doDestino.alunas);
    provar('a versão da origem perdeu a aluna, e diz para onde foi',
      daOrigem.alunas.indexOf('Aluna B') === -1 && daOrigem.transferida
        && daOrigem.transferida.para === 'elenco-b', daOrigem.alunas);
    provar('a segunda versão da origem ENCADEIA na primeira (`anterior`)',
      daOrigem.anterior === 'elenco-a--20261107-1000.json', daOrigem.anterior);
    /* O ÍNDICE É REESCRITO A CADA VERSÃO — uma por `concluir` —, e o que importa é que as DUAS
     * entram nele: é dele que `vigentes()` lê, e uma versão fora do índice é uma versão invisível. */
    const escritasDoIndice = gh.escritas.filter((e) => /\.indice\.json$/.test(e.caminho));
    provar('o índice é reescrito a cada versão, e as DUAS entram nele',
      escritasDoIndice.length === 2, escritasDoIndice.length);
    const indiceFinal = JSON.parse(escritasDoIndice[escritasDoIndice.length - 1].texto);
    const idsNoIndice = [...new Set(Object.values(indiceFinal.versoes || {}).map((v) => v.id))].sort();
    provar('…e o índice final conhece os dois elencos (a versão antiga fica — é append-only)',
      JSON.stringify(idsNoIndice) === JSON.stringify(['elenco-a', 'elenco-b']), idsNoIndice);
  }

  /* C2. Sem repositório não há transferência — e nada é tocado. */
  {
    const env = prepEnv({});
    delete env.GITHUB_TOKEN;
    const r = await pedir(env, '/api/bastidores/elenco-mover', {
      aluna: 'Aluna B', de: 'elenco-a', para: 'elenco-b', senhaDirecao: senha,
    });
    provar('sem repositório a rota recusa (409) e diz porquê',
      r.status === 409 && /repositório/.test(r.json && r.json.erro || ''), r.json);
    provar('…e não finge uma transferência: diz que nada foi tocado',
      /Nada foi tocado/.test(r.json && r.json.erro || ''), r.json);
  }

  /* C3. O DESLIGAMENTO — três escritas, e a turma fica marcada no KV. */
  {
    const kv = {
      ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([PE_TORTO]),
      ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify(curadoriasBase()),
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify(turmasBase()),
    };
    const env = prepEnv({ kv });
    const gh = githubDeBolso({});
    globalThis.fetch = gh.fetchFalso;
    let r;
    try {
      r = await pedir(env, '/api/bastidores/professor-desligar', {
        professor: 'pe-torto', motivo: 'fim do contrato', senhaDirecao: senha,
      });
    } finally { globalThis.fetch = fetchOriginal; }
    provar('o desligamento responde 200', r.status === 200, { status: r.status, corpo: r.texto.slice(0, 200) });
    const profs = JSON.parse(await env.PADD_KV.get('bastidores/' + ESCOLA + '/professores'));
    const curs = JSON.parse(await env.PADD_KV.get('bastidores/' + ESCOLA + '/curadorias'));
    const trms = JSON.parse(await env.PADD_KV.get('bastidores/' + ESCOLA + '/turmas'));
    provar('o professor fica DESLIGADO no KV, com data e motivo',
      profs[0].desligado_em === r.json.desligado_em && profs[0].desligado_motivo === 'fim do contrato',
      profs[0]);
    provar('a curadoria dele fica ENCERRADA (não apagada)',
      curs.find((c) => c.id === 'pe-torto-bale-sala-rosa').encerrada_em === r.json.desligado_em,
      curs.map((c) => [c.id, c.encerrada_em]));
    provar('a turma fica DESCONTINUADA, com o motivo escrito',
      Boolean(trms.find((t) => t.nome === 'Sala Rosa').descontinuada),
      trms.find((t) => t.nome === 'Sala Rosa'));
    provar('…e a turma da outra professora não é tocada',
      trms.find((t) => t.nome === 'Sala Coral').descontinuada === undefined);
    provar('o relatório diz o que a direção faz agora',
      /remanejar|recreativa|outro professor/.test(r.json.proximo || ''), r.json.proximo);
  }

  /* C4. O DONO NÃO SE DESLIGA. */
  {
    const env = prepEnv({ kv: { ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([PE_TORTO]) } });
    const r = await pedir(env, '/api/bastidores/professor-desligar', {
      professor: 'dona', motivo: 'x', senhaDirecao: senha,
    });
    provar('o responsável principal é recusado (409)', r.status === 409 && r.json && r.json.dono === true, r.json);
  }

  /* C5. Sem motivo, não se desliga. */
  {
    const kv = {
      ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([PE_TORTO]),
      ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([]),
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([]),
    };
    const r = await pedir(prepEnv({ kv }), '/api/bastidores/professor-desligar', {
      professor: 'pe-torto', motivo: '', senhaDirecao: senha,
    });
    provar('o motivo vazio é recusado (400)', r.status === 400 && /motivo/.test(r.json.erro || ''), r.json);
  }

  /* C6. O desligado não dirige turma nova. */
  {
    const desligado = Object.assign({}, PE_TORTO, {
      desligado_em: '2026-11-08T10:00:00.000Z', desligado_motivo: 'fim do contrato',
    });
    const env = prepEnv({
      kv: {
        ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([desligado, OUTRA]),
        ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([]),
        ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify(turmasBase()),
      },
    });
    const r = await pedir(env, '/api/bastidores/curadoria', {
      professor: 'pe-torto', modalidade: 'bale-classico', tradicao: 'RAD',
      turmas: ['Sala Rosa'], senhaDirecao: senha,
    });
    provar('a Turma não se atribui a quem saiu (409)', r.status === 409 && r.json.desligado === true, r.json);
    provar('…e a recusa diz que a direção dele foi encerrada',
      /encerrada/.test(r.json.erro || ''), r.json.erro);
  }

  /* C7. Uma direção nova LIMPA a marca da turma. */
  {
    const marcada = turmasBase().map((t) => (t.nome === 'Sala Rosa'
      ? Object.assign({}, t, { descontinuada: { em: '2026-11-08', motivo: 'ficou sem professor' } })
      : t));
    const env = prepEnv({
      kv: {
        ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([PE_TORTO, OUTRA]),
        ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([{
          id: 'pe-torto-bale-sala-rosa', professor: 'pe-torto', modalidade: 'bale-classico',
          tradicao: 'RAD', turmas: ['Sala Rosa'], alunas: [], encerrada_em: '2026-11-08T10:00:00.000Z',
        }]),
        ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify(marcada),
      },
    });
    const gh = githubDeBolso({});
    globalThis.fetch = gh.fetchFalso;
    let r;
    try {
      r = await pedir(env, '/api/bastidores/curadoria', {
        professor: 'outra-professora', modalidade: 'bale-classico', tradicao: 'RAD',
        turmas: ['Sala Rosa'], senhaDirecao: senha,
      });
    } finally { globalThis.fetch = fetchOriginal; }
    provar('a nova direção é criada (201)', r.status === 201, { status: r.status, corpo: r.texto.slice(0, 200) });
    const trms = JSON.parse(await env.PADD_KV.get('bastidores/' + ESCOLA + '/turmas'));
    provar('…e a turma deixa de estar descontinuada (a marca não é perpétua)',
      trms.find((t) => t.nome === 'Sala Rosa').descontinuada === undefined,
      trms.find((t) => t.nome === 'Sala Rosa'));
  }

  /* C8. O DELETE de um desligado não apaga o registo — diz que é proveniência. */
  {
    const desligado = Object.assign({}, PE_TORTO, {
      desligado_em: '2026-11-08T10:00:00.000Z', desligado_motivo: 'fim do contrato',
    });
    const env = prepEnv({ kv: { ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([desligado]) } });
    const r = await pedir(env, '/api/bastidores/professor', { nome: 'Pe Torto', senhaDirecao: senha }, 'DELETE');
    provar('o DELETE do desligado é recusado (409)', r.status === 409 && r.json.desligado === true, r.json);
    provar('…e a frase diz o que fazer (recadastrar reactiva)',
      /proveniência/.test(r.json.erro || '') && /reactiva/.test(r.json.erro || ''), r.json.erro);
  }

  /* C9. O recadastro do MESMO identificador REACTIVA (não colide consigo mesmo). */
  {
    const desligado = Object.assign({}, PE_TORTO, {
      desligado_em: '2026-11-08T10:00:00.000Z', desligado_motivo: 'fim do contrato',
    });
    const env = prepEnv({ kv: { ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([desligado]) } });
    /* O INVENTÁRIO DA ESCOLA É O SÍTIO ONDE O CADASTRO DECLARA O VÍNCULO (`registrarProfessorNaEscola`,
     * 22/10/2026). Sem ele a rota recusa — e com razão: o painel lê o repositório, e um vínculo que
     * só existisse no KV faria o professor aparecer «sem escola viva» no dia em que entrou. */
    const gh = githubDeBolso({
      ['escola/' + ESCOLA + '/indice.json']: JSON.stringify({
        escola: ESCOLA, worker: ESCOLA,
        professor: { slug: 'dona', nome: 'Professora Dona' },
        professores: [{ slug: 'pe-torto', nome: 'Pe Torto', desde: '2026-10-01' }],
      }, null, 2) + '\n',
    });
    globalThis.fetch = gh.fetchFalso;
    let r;
    try {
      r = await pedir(env, '/api/bastidores/professor', {
        nome: 'Pe Torto', sobrenome: '', senha: 'nova-senha-123', senhaDirecao: senha,
      });
    } finally { globalThis.fetch = fetchOriginal; }
    /* A rota exige nome+sobrenome? Se recusar por outra razão, a asserção diz qual — em vez de
     * passar por acidente. */
    provar('o recadastro do mesmo identificador é aceite (200, não 409)',
      r.status === 200 || r.status === 201, { status: r.status, corpo: r.texto.slice(0, 240) });
    if (r.status === 200 || r.status === 201) {
      const profs = JSON.parse(await env.PADD_KV.get('bastidores/' + ESCOLA + '/professores'));
      provar('…e o registo volta ACTIVO (sem `desligado_em`) e na mesma linha',
        profs.length === 1 && profs[0].desligado_em === undefined, profs);
      provar('…e a resposta diz que foi reactivação', r.json.reativado === true, r.json);
    }
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + (n - falhas) + ' de ' + n + ' asserções passaram');
    process.exit(1);
  }
  console.log('PASSOU — ' + n + ' de ' + n + ' asserções');
})();
