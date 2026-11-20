#!/usr/bin/env node
'use strict';

/*
 * provar-cadeia-automatica.js — A TROCA E A SAÍDA PERCORREM A CADEIA SOZINHAS (09/11/2026).
 *
 * O QUE ESTA PROVA FIXA, e porquê:
 *
 *   A. O ÍNDICE — as quatro etapas na ordem da dependência, o estado derivado do que existe, e a
 *      porta do fluxo completo. Sem isto, «a cadeia correu» seria uma frase sem conteúdo.
 *   B. A TRAVESSIA INTEIRA — com plano e PO, o gesto deriva UM elo novo de plano e UM elo novo de
 *      PO (com `ajuste_de` a apontar os anteriores), escreve a fonte do plano e fecha o pacote.
 *      É o que a pesquisadora pediu: acabar com a via crucis passo a passo.
 *   C. O REGISTO INCOMPLETO — sem plano, a cadeia NÃO inventa: sincroniza os vínculos (é o que
 *      pode fazer), pára, e diz o que falta com o sítio onde se resolve.
 *   D. A IDEMPOTÊNCIA — repetir o gesto não empilha elos: o que já está em dia é `feita`.
 *   E. O LOG — cada execução fica registada com o gatilho, os alvos, o resultado e o que faltou.
 *   G. O ORÇAMENTO — a travessia não começa quando o pedido já gastou o teto.
 *   H. A TROCA DE DIREÇÃO — o elo novo nasce com o professor que passa a dirigir, e não inventa
 *      campos de contexto que o envelope não admite (a modalidade mora na curadoria).
 *   F. AS ROTAS — `elenco-mover` entrega os DOIS elencos à cadeia e devolve o resultado na
 *      resposta; e `GET /api/bastidores/cadeia` lê o log.
 *
 * SEM REDE: o armazenamento é memória, e as saídas do ciclo são espiões. A cadeia é o motor; os
 * escritores são de quem chama.
 *
 *   node experimentos/provar-cadeia-automatica.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const nucleoCadeia = require(path.join(RAIZ, 'motor/nucleo/cadeia.js'));
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const { criarCadeia } = require(path.join(RAIZ, 'motor/servidor/cadeia.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));

const ler = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta', p), 'utf8'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'prova';
const TURMA = 'Balé Nível 1 — Teste 3';
// O CARIMBO DO MOTOR: `YYYY-MM-DDTHH:MM`, sem segundos — é o formato do `gerado_em`.
const QUANDO = '2026-11-09T20:00';
const r = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });

function relatorioDe(id) {
  return {
    id, estado: 'Input_anamnese_construida',
    contagem: { respondidos: 0, obrigatorios: 0 },
    elos: [], paradas: [], idsDesconhecidos: [],
    validacao: { resultado: 'aceite', contrato: 'prova' },
    errosDoDocumento: [], linhas: [],
  };
}

function planoFixture(id, { ajusteDe, geradoEm, turma } = {}) {
  const envelope = {
    id,
    contexto: { escola: ESCOLA, professor: 'coqui', ciclo: '01', turma: turma || TURMA },
    respostas: {
      'objetivo-geral': r('consolidar o alinhamento e a transferência de peso'),
      'contexto-turma': r(turma || TURMA),
      'contexto-duracao': r([{ numero: 45, unidade: 'minuto' }]),
      'marcos-por-aula': r(['reconhecer o apoio', 'transferir o peso']),
      'estrutura-de-cada-aula': r([{ marco: 1, marcados: ['Barra', 'Centro'] }]),
      'aula-1-parametro': r([{ marco: 1, marcados: ['Battement tendu'] }]),
      'distribuicao-de-volume': r({ unidade: 'percentual', linhas: [
        { Bloco: 'Barra', 'Proporção alvo': '40%', Justificativa: 'Apoio.' },
        { Bloco: 'Centro', 'Proporção alvo': '30%', Justificativa: 'Deslocamento.' },
        { Bloco: 'Musicalidade', 'Proporção alvo': '10%', Justificativa: 'Pulso.' },
        { Bloco: 'Expressão', 'Proporção alvo': '20%', Justificativa: 'Braços.' },
      ] }),
      'aula-1-sequencia': r([{ Bloco: 'Barra', 'Objetivo específico': '1 — reconhecer o apoio',
        'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '4/4' }]),
      'condicoes-preliminares': r('Sala com barra.'),
      'criterio-de-extensao': r('Estender em duas aulas.'),
      referencias: r('RAD (2015).'),
      'musicas-videos': r('Faixa em 4/4.'),
      repertorio: r('Battement tendu'),
      proveniencia: r(['Plano derivado da metodologia RAD']),
      'contexto-metodologia': r('RAD'),
      'contexto-notacao': r('Benesh'),
      'contexto-escola': r(ESCOLA),
      'contexto-professor': r('coqui'),
    },
    gerado_em: geradoEm || '2026-11-03T22:00',
  };
  if (ajusteDe) envelope.ajuste_de = ajusteDe;
  return envelope;
}

function poFixture(id, { planoId, ajusteDe, geradoEm } = {}) {
  const envelope = {
    id,
    contexto: { escola: ESCOLA, professor: 'coqui', ciclo: '01', turma: TURMA },
    respostas: {
      'dimensoes-de-observacao': r(['Técnica — Barra']),
      'itens-por-dimensao': r([{ sujeito: 'Técnica — Barra', itens: 'saída do calcanhar no tendu' }]),
      sujeitos: r(['Aluna A']),
      'plano-de-ensino': r([planoId]),
      'linha-de-base': r([{ sujeito: 'Aluna A', traz: 'prática anterior', precisaDesenvolver: 'tendu' }]),
      question: r('O que se observa, aula a aula?'),
      horizonte: r('Ao fim do ano, o en dehors do quadril.'),
      fenomeno: r(['a rotação externa visível na 1ª posição']),
      'condicoes-de-contorno': r('Sala com barra e espelho.'),
      'referencia-ao-problema': r('o en dehors que sai do joelho'),
      'explicacao-do-recorte': r('a técnica nos cinco blocos'),
      'o-que-fica-de-fora': r('allegro e ponta'),
      'base-teorica': r('RAD (2015).'),
      limitacoes: r('depende do espelho'),
      professor: r('coqui'),
      escola: r(ESCOLA),
      'campo-escola': r(ESCOLA),
      'checklist-fenomeno-definido': r('sim'),
      'checklist-fronteiras-claras': r('sim'),
      'checklist-norma-estabelecida': r('sim'),
      'checklist-criterios-exclusivos': r('nao'),
      'checklist-justificativa-fundada': r('sim'),
      'checklist-recorte-viavel': r('sim'),
    },
    gerado_em: geradoEm || '2026-11-03T22:21',
  };
  if (ajusteDe) envelope.ajuste_de = ajusteDe;
  return envelope;
}

/** O KV de mentira — o contrato mínimo que a cadeia usa. */
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

const elenco = (extra) => Object.assign({
  id: 'elenco-a', nome: 'Elenco A', professor: 'coqui',
  alunas: ['Aluna A', 'Aluna B'], campos: [{ id: 'x', nome: 'X' }],
  carimbo: '20261107-1000', atualizada_em: '2026-11-07T10:00:00.000Z',
}, extra || {});

const curadoria = (extra) => Object.assign({
  id: 'coqui-bale-classico-teste-3', professor: 'coqui', modalidade: 'Balé clássico',
  tradicao: 'RAD', turmas: [TURMA], linhaDeBase: 'elenco-a', alunas: ['Aluna A'],
}, extra || {});

/** A cadeia, com escritores espiões. As curadorias vivem no KV e são lidas de lá. */
function montar({ linhas = [elenco()], curadorias = [curadoria()], temPlano = true, temPo = true,
  pendencias = null } = {}) {
  const kv = kvDeMentira({ ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify(curadorias) });
  const visto = { planos: [], pos: [], conclusoes: [], disparos: [] };
  const arm = criarMemoria();
  const cadeia = criarCadeia({
    armazenamento: arm, porta,
    conteudo: ler('conteudo/anamnese.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    carimbar: () => QUANDO,
    escreverPlano: async (envelope) => {
      visto.planos.push(envelope.id);
      return { ok: true, pendencias: pendencias || [] };
    },
    escreverPO: async () => ({ ok: true }),
    escreverCiclo: async () => ({ ok: true, documentos: [{}] }),
    disparar: async () => { visto.disparos.push(true); return { ok: true }; },
    geracao: null,
    concluirPO: async (envelope) => {
      visto.conclusoes.push(envelope && envelope.id);
      return { fonte: { ok: true }, ciclo: { ok: true }, disparo: { ok: true } };
    },
    lerCuradorias: async () => JSON.parse(kv._dados.get('bastidores/' + ESCOLA + '/curadorias')),
    lerTurmas: async () => [{ nome: TURMA }],
    lerLinhasDeBase: async () => linhas,
    linhaDeBaseDaTurma: async () => linhas[0] || null,
    kv, escola: ESCOLA,
    urlDaPorta: (base, contexto, extra) => base,
  });
  return { cadeia, arm, kv, visto, semPlano: !temPlano, semPo: !temPo };
}

async function semear(arm, { planoId = 'plano-20261103-2200', poId = 'po-20261103-2221',
  planoGerado = '2026-11-03T22:00', poGerado = '2026-11-03T22:21' } = {}) {
  await porta.gravarEnvelope(arm, planoFixture(planoId, { geradoEm: planoGerado }), relatorioDe(planoId));
  await porta.gravarEnvelope(arm, poFixture(poId, { planoId, geradoEm: poGerado }), relatorioDe(poId));
}

/** Todos os ids de uma família, no armazenamento. */
async function ids(arm, familia) {
  const nomes = await porta.nomesDeEnvelopes(arm, new RegExp('^' + familia + '-.*\\.json$'));
  return nomes.map((n) => n.replace(/\.json$/, ''));
}

(async () => {
  // ==========================================================================
  console.log('\nA. O ÍNDICE — as quatro etapas, na ordem da dependência');

  {
    const e = nucleoCadeia.etapas();
    provar('são quatro, e a ordem é vínculos → plano → PO → pacote',
      e.map((x) => x.chave).join(',') === 'vinculos,plano-de-ensino,plano-de-observacao,pacote',
      e.map((x) => x.chave));
    provar('cada etapa declara onde se resolve (`onde`)',
      e.every((x) => Boolean(x.onde && x.rotulo)));

    provar('as alunas comparam-se por CONJUNTO, não por ordem',
      nucleoCadeia.mesmasAlunas(['A', 'B'], ['B', 'A']) === true);
    provar('…e uma diferença é uma diferença',
      nucleoCadeia.mesmasAlunas(['A', 'B'], ['A']) === false);

    const completo = nucleoCadeia.indice({
      elenco: { id: 'e', nome: 'Elenco', alunas: ['A', 'B'] },
      curadoria: { id: 'c', turma: TURMA, alunas: ['A'] },
      turma: TURMA,
      plano: { id: 'plano-1', gerado_em: '2026-11-01' },
      po: { id: 'po-1', gerado_em: '2026-11-01' },
      quando: QUANDO, pacoteEmDia: false,
    });
    provar('com elenco, Turma, plano e PO o fluxo é COMPLETO', completo.completa === true);
    provar('…e o índice diz que os vínculos estão pendentes',
      completo.etapas[0].estado === 'pendente' && /saiu|entrou/.test(completo.etapas[0].falta),
      completo.etapas[0]);
    provar('…e que os dois planos são anteriores à mudança',
      completo.etapas[1].estado === 'pendente' && completo.etapas[2].estado === 'pendente',
      completo.etapas.map((x) => x.estado));

    const incompleto = nucleoCadeia.indice({
      elenco: { id: 'e', nome: 'Elenco', alunas: ['A'] },
      curadoria: { id: 'c', turma: TURMA, alunas: ['A'] },
      turma: TURMA, plano: null, po: null, quando: QUANDO,
    });
    provar('sem plano o fluxo NÃO é completo', incompleto.completa === false);
    provar('…e a etapa do plano é `bloqueada`, com a frase do que fazer',
      incompleto.etapas[1].estado === 'bloqueada' && /ainda não tem plano/.test(incompleto.etapas[1].falta),
      incompleto.etapas[1]);

    const emDia = nucleoCadeia.indice({
      elenco: { id: 'e', alunas: ['A'] }, curadoria: { id: 'c', turma: TURMA, alunas: ['A'] },
      turma: TURMA,
      plano: { id: 'plano-2', gerado_em: '2026-11-09T21:00' },
      po: { id: 'po-2', gerado_em: '2026-11-09T21:01' },
      quando: QUANDO, pacoteEmDia: true,
    });
    provar('documentos posteriores ao gatilho são `feita`',
      emDia.etapas.every((x) => x.estado === 'feita'), emDia.etapas);
    provar('e o resumo fica `ok`', nucleoCadeia.resumo(emDia.etapas).ok === true);

    const resumo = nucleoCadeia.resumo(incompleto.etapas);
    provar('o resumo aponta a PRÓXIMA etapa em falta', resumo.proxima && resumo.proxima.chave === 'plano-de-ensino',
      resumo.proxima && resumo.proxima.chave);
    provar('o rótulo do gatilho é o que a tela lê',
      nucleoCadeia.rotuloDoGatilho('troca-de-aluna') === 'troca de aluna entre elencos');
  }

  // ==========================================================================
  console.log('\nB. A TRAVESSIA INTEIRA — plano e PO ganham elo novo, e o pacote fecha');

  {
    const { cadeia, arm, kv, visto } = montar();
    await semear(arm);
    const antesPlanos = (await ids(arm, 'plano')).length;
    const antesPos = (await ids(arm, 'po')).length;

    const r1 = await cadeia.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
      motivo: 'Aluna B entrou no elenco',
    });

    const depoisPlanos = await ids(arm, 'plano');
    const depoisPos = await ids(arm, 'po');
    provar('a cadeia respondeu `ok`', r1.ok === true, r1.erro);
    provar('UM elo novo de plano', depoisPlanos.length === antesPlanos + 1,
      { antes: antesPlanos, depois: depoisPlanos });
    provar('…e a fonte do plano foi escrita', visto.planos.length === 1, visto.planos);
    provar('UM elo novo de PO', depoisPos.length === antesPos + 1,
      { antes: antesPos, depois: depoisPos });
    provar('…e a conclusão do PO correu com o elo novo',
      visto.conclusoes.length === 1 && depoisPos.indexOf(visto.conclusoes[0]) !== -1,
      { conclusoes: visto.conclusoes, depoisPos });

    const novoPlano = await porta.lerEnvelope(arm, depoisPlanos.find((x) => x !== 'plano-20261103-2200'));
    provar('o elo novo do plano aponta o anterior (`ajuste_de`) — a proveniência acrescenta',
      novoPlano && novoPlano.ajuste_de === 'plano-20261103-2200', novoPlano && novoPlano.ajuste_de);
    const novoPo = await porta.lerEnvelope(arm, depoisPos.find((x) => x !== 'po-20261103-2221'));
    provar('o elo novo do PO aponta o anterior', novoPo && novoPo.ajuste_de === 'po-20261103-2221',
      novoPo && novoPo.ajuste_de);
    const referencia = novoPo && novoPo.respostas['plano-de-ensino'];
    const refId = referencia && referencia.valor !== undefined ? referencia.valor : referencia;
    provar('…e observa o plano VIGENTE, não o substituído',
      String(refId) === String(novoPlano && novoPlano.id), { ref: refId, plano: novoPlano && novoPlano.id });

    const turma = JSON.parse(kv._dados.get('bastidores/' + ESCOLA + '/curadorias'))[0];
    provar('a Turma passou a declarar o corpo do elenco',
      JSON.stringify(turma.alunas) === JSON.stringify(['Aluna A', 'Aluna B']), turma.alunas);
    provar('…e o resto do registo dela ficou intacto',
      turma.professor === 'coqui' && turma.modalidade === 'Balé clássico', turma);
    provar('todas as etapas ficaram `feita`',
      r1.alvos[0].etapas.every((x) => x.estado === 'feita'), r1.alvos[0].etapas);
  }

  // ==========================================================================
  console.log('\nC. O REGISTO INCOMPLETO — avança até onde pode, e diz o que falta');

  {
    const { cadeia, kv, visto } = montar({ temPlano: false });
    // Sem plano: o armazenamento fica vazio.
    const r1 = await cadeia.executar({
      gatilho: 'saida-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
    });
    provar('a cadeia NÃO responde `ok`', r1.ok === false);
    provar('os vínculos, que só dependem do elenco, foram feitos',
      JSON.parse(kv._dados.get('bastidores/' + ESCOLA + '/curadorias'))[0].alunas.length === 2);
    provar('nenhum plano foi derivado', visto.planos.length === 0, visto.planos);
    provar('nenhum PO foi concluído', visto.conclusoes.length === 0, visto.conclusoes);
    const etapa = r1.alvos[0].etapas.find((x) => x.chave === 'plano-de-ensino');
    provar('a etapa do plano é `bloqueada`, e a frase diz o caminho',
      etapa && etapa.estado === 'bloqueada' && /ainda não tem plano/.test(etapa.falta), etapa);
    provar('o erro global diz onde a cadeia parou', /plano-de-ensino/.test(String(r1.erro)), r1.erro);
  }

  // ==========================================================================
  console.log('\nD. A IDEMPOTÊNCIA — repetir não empilha elos');

  {
    const { cadeia, arm } = montar();
    await semear(arm);
    await cadeia.executar({ gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO });
    const depoisDeUm = { planos: (await ids(arm, 'plano')).length, pos: (await ids(arm, 'po')).length };
    const r2 = await cadeia.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
    });
    const depoisDeDois = { planos: (await ids(arm, 'plano')).length, pos: (await ids(arm, 'po')).length };
    provar('o segundo gesto não cria plano', depoisDeDois.planos === depoisDeUm.planos,
      { um: depoisDeUm, dois: depoisDeDois });
    provar('…nem PO', depoisDeDois.pos === depoisDeUm.pos, { um: depoisDeUm, dois: depoisDeDois });
    provar('…e a cadeia diz que está em dia', r2.ok === true, r2.erro);
  }

  // ==========================================================================
  console.log('\nE. O LOG — o que a cadeia fez, quando, e onde parou');

  {
    const { cadeia } = montar();
    const r1 = await cadeia.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
      motivo: 'Aluna B entrou',
    });
    provar('o log aceitou a entrada', r1.log && r1.log.ok === true, r1.log);
    const log = await cadeia.lerLog();
    provar('há uma entrada no log', log.length === 1, log.length);
    provar('…com o gatilho', log[0].gatilho === 'troca-de-aluna');
    provar('…com o rótulo legível', log[0].rotulo === 'troca de aluna entre elencos');
    provar('…com os alvos e o estado de cada etapa',
      Array.isArray(log[0].alvos) && log[0].alvos[0].etapas.length === 4, log[0].alvos);
    provar('…e com o resultado global', typeof log[0].ok === 'boolean');
  }

  // ==========================================================================
  console.log('\nF. AS ROTAS — o gesto entrega os dois elencos, e o log lê-se');

  {
    const senha = 'senha-de-prova';
    const elencoA = elenco();
    const elencoB = elenco({ id: 'elenco-b', nome: 'Elenco B', alunas: ['Aluna C'] });
    const caminhoDe = (l) => 'escola/' + ESCOLA + '/linhas-de-base/' + l.id + '--' + l.carimbo + '.json';
    const arquivos = () => ({
      [caminhoDe(elencoA)]: JSON.stringify(elencoA, null, 2) + '\n',
      [caminhoDe(elencoB)]: JSON.stringify(elencoB, null, 2) + '\n',
      ['escola/' + ESCOLA + '/linhas-de-base/.indice.json']: JSON.stringify({
        versao: 1,
        versoes: Object.fromEntries([elencoA, elencoB].map((l) => [l.id + '--' + l.carimbo + '.json', {
          id: l.id, carimbo: l.carimbo, arquivo: caminhoDe(l), nome: l.nome,
          professor: l.professor, turma: null, atualizada_em: l.atualizada_em,
          enviada_em: l.atualizada_em, aspectos: (l.campos || []).map((c) => c.id),
          alunas: l.alunas.length,
        }])),
      }, null, 2) + '\n',
    });
    // O GitHub em memória — o contrato que a rota usa (a árvore, o `contents` GET/PUT).
    const ficheiros = new Map(Object.entries(arquivos()));
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
        return json({ commit: { sha: 'c' + escritas.length } }, 201);
      }
      return new Response('nao', { status: 405 });
    };

    const env = {
      ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim',
      SENHA_ADMIN: senha, SENHA_PROFESSOR: 'outra',
      PROFESSOR_NOME: 'Professora Dona', PROFESSOR_SLUG: 'dona',
      GITHUB_TOKEN: 'token-de-prova', PADD_KV: kvDeMentira({}),
    };
    const chamadas = [];
    const cadeiaDeProva = {
      async executar(pedido) {
        chamadas.push(pedido);
        return {
          ok: false, completa: false, erro: 'sem plano de ensino na prova',
          alvos: [{ turma: TURMA, ok: false, erro: 'sem plano de ensino na prova', etapas: [
            { chave: 'vinculos', estado: 'feita' },
            { chave: 'plano-de-ensino', estado: 'bloqueada', falta: 'a Turma ainda não tem plano' },
            { chave: 'plano-de-observacao', estado: 'bloqueada' },
            { chave: 'pacote', estado: 'bloqueada' },
          ] }],
        };
      },
      async lerLog() { return [{ em: QUANDO, gatilho: 'troca-de-aluna', ok: false }]; },
      enderecos() {
        return {
          'producao-turmas': '#turmas', 'producao-elencos': '#corpo',
          'porta-plano': '/plano-ensino/', 'porta-po': '/plano-observacao/',
          'geracao': '/plano-observacao/',
        };
      },
    };

    const pedir = async (caminho, corpo, extras) => {
      const init = corpo === undefined ? { method: 'GET' } : {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
      };
      const resposta = await bastidores.fetch(
        new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho, init), env, extras);
      const texto = await resposta.text();
      let corpoJson = null;
      try { corpoJson = JSON.parse(texto); } catch (erro) { corpoJson = null; }
      return { status: resposta.status, json: corpoJson, texto };
    };

    const original = globalThis.fetch;
    let troca;
    try {
      globalThis.fetch = fetchFalso;
      troca = await pedir('/api/bastidores/elenco-mover', {
        aluna: 'Aluna A', de: 'elenco-a', para: 'elenco-b', senhaDirecao: senha,
      }, { cadeia: cadeiaDeProva });
    } finally { globalThis.fetch = original; }

    provar('a transferência responde 200', troca.status === 200, { status: troca.status, corpo: troca.texto.slice(0, 300) });
    provar('…e a CADEIA vai na resposta', troca.json && Boolean(troca.json.cadeia), troca.json && troca.json.cadeia);
    provar('…com o resultado global e o que falta', troca.json && troca.json.cadeia.ok === false
      && Array.isArray(troca.json.cadeia.faltam) && troca.json.cadeia.faltam.length > 0,
      troca.json && troca.json.cadeia);
    provar('…e cada falta traz o rótulo e o ENDEREÇO',
      troca.json && troca.json.cadeia.faltam.every((f) => Boolean(f.rotulo && f.href)),
      troca.json && troca.json.cadeia.faltam);
    provar('o gesto entregou os DOIS elencos à cadeia',
      chamadas.length === 1 && JSON.stringify(chamadas[0].elencos) === JSON.stringify(['elenco-a', 'elenco-b']),
      chamadas);
    provar('…e o gatilho é o da troca', chamadas[0] && chamadas[0].gatilho === 'troca-de-aluna', chamadas[0]);

    // O LOG, pela rota verdadeira.
    const leitura = await pedir('/api/bastidores/cadeia', undefined, { cadeia: cadeiaDeProva });
    provar('GET /api/bastidores/cadeia responde 200', leitura.status === 200, leitura.status);
    provar('…e devolve o log', leitura.json && leitura.json.ok === true
      && Array.isArray(leitura.json.log) && leitura.json.log.length === 1, leitura.json);

    // SEM a cadeia montada, a rota diz que não correu — e não finge log vazio.
    const semCadeia = await pedir('/api/bastidores/cadeia', undefined, {});
    provar('sem a cadeia montada, a rota DIZ que ela não correu',
      semCadeia.json && semCadeia.json.ok === false && /não está montada/.test(semCadeia.json.motivo || ''),
      semCadeia.json);
  }

  // ==========================================================================
  console.log('\nH. A TROCA DE PROFESSOR — a cadeia pára, e diz de quem é o documento');

  {
    const { cadeia, arm } = montar({
      curadorias: [curadoria({ professor: 'novo-prof', modalidade: 'Balé contemporâneo' })],
    });
    await semear(arm);
    const antes = await ids(arm, 'plano');
    const r1 = await cadeia.executar({
      gatilho: 'troca-de-direcao', turmas: [TURMA], quando: QUANDO,
      motivo: 'a direção da turma passou a novo-prof',
    });
    const depois = await ids(arm, 'plano');
    provar('a travessia correu pela turma', r1.alvos.length === 1 && r1.alvos[0].turma === TURMA, r1.alvos);
    /* A AUTORIA NÃO SE DERIVA (12/11/2026). Até aqui esta prova exigia o contrário — «o elo novo diz
     * o professor que passou a dirigir» —, e era esse o defeito. O elo novo era o plano do professor
     * anterior com o nome do novo por cima. */
    provar('…e NÃO derivou elo nenhum (o plano é de outro professor)',
      depois.length === antes.length, { antes, depois });
    const etapa = (r1.alvos[0].etapas || []).find((e) => e.chave === 'plano-de-ensino') || {};
    provar('…e a etapa do plano fica BLOQUEADA',
      etapa.estado === 'bloqueada', etapa);
    provar('…com a razão dita, e sem prometer derivação',
      /autoria não se reescreve/.test(String(etapa.falta || '')), etapa.falta);
    const envelope = await porta.lerEnvelope(arm, antes[0]);
    provar('…e o plano antigo continua a dizer o professor que o escreveu',
      envelope && envelope.contexto.professor === 'coqui', envelope && envelope.contexto);
    provar('…e não inventa um campo de contexto fora dos cinco do envelope',
      envelope && envelope.contexto.modalidade === undefined, envelope && envelope.contexto);
    provar('…sem perder o ciclo nem a escola',
      envelope && envelope.contexto.ciclo === '01' && envelope.contexto.escola === ESCOLA,
      envelope && envelope.contexto);
  }

  // ==========================================================================
  console.log('\nI. A MONTAGEM NA PONTE — os conteúdos da porta e o contador do pedido');

  {
    const servidor = (p) => new Response(fs.readFileSync(path.join(RAIZ, 'porta', p)),
      { status: 200, headers: { 'content-type': 'application/json' } });
    const envComAssets = {
      ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', GITHUB_TOKEN: 'token-de-prova',
      PADD_KV: kvDeMentira({}),
      ASSETS: {
        async fetch(pedido) {
          // O `carregarEstatico` passa uma `URL` (tem `pathname`), e não uma `Request`.
          const bruto = pedido && pedido.pathname ? pedido.pathname : String(pedido);
          const caminho = new URL(bruto, 'https://assets.local').pathname
            .replace(/^\/plano-observacao\//, '');
          try { return servidor(caminho); } catch (erro) { return new Response('nao', { status: 404 }); }
        },
      },
    };
    const cadeia = await producao.montarCadeia(envComAssets, ESCOLA);
    provar('com os conteúdos da porta, a cadeia monta-se', Boolean(cadeia && typeof cadeia.executar === 'function'),
      cadeia && Object.keys(cadeia));
    provar('…e sabe ler o log', Boolean(cadeia && typeof cadeia.lerLog === 'function'));

    const semAssets = await producao.montarCadeia({ ESCOLA_SLUG: ESCOLA, PADD_KV: kvDeMentira({}) }, ESCOLA);
    provar('sem os conteúdos, a montagem devolve `null` — e a rota continua', semAssets === null, semAssets);
  }

  // ==========================================================================
  console.log('\nG. O ORÇAMENTO — a travessia não começa o que não cabe');

  {
    const kv = kvDeMentira({ ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([curadoria()]) });
    const orcamento = { limite: 50, usados: 45, restantes: 5, coube: () => false, motivo: () => 'sem folga' };
    const cadeia = criarCadeia({
      armazenamento: criarMemoria(), porta,
      conteudo: ler('conteudo/anamnese.json'), conteudoPlano: ler('plano/conteudo/plano.json'),
      conteudoPO: ler('po/conteudo/po.json'), esquema: ler('envelope/elicitacao-schema.json'),
      carimbar: () => QUANDO, escreverPlano: async () => ({ ok: true }),
      escreverPO: async () => ({ ok: true }), escreverCiclo: async () => ({ ok: true }),
      disparar: async () => ({ ok: true }), geracao: null,
      concluirPO: async () => { throw new Error('não devia correr'); },
      lerCuradorias: async () => [curadoria()], lerTurmas: async () => [], lerLinhasDeBase: async () => [elenco()],
      linhaDeBaseDaTurma: async () => elenco(), kv, escola: ESCOLA, urlDaPorta: (b) => b,
      orcamento,
    });
    const r1 = await cadeia.executar({ gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO });
    provar('com o orçamento no fim, a cadeia NÃO corre', r1.ok === false && r1.orcamento === true, r1);
    provar('…e diz porquê, com os números', /45 de 50/.test(String(r1.erro)), r1.erro);
    provar('…e a Turma NÃO foi tocada', JSON.parse(kv._dados.get('bastidores/' + ESCOLA + '/curadorias'))[0]
      .alunas.length === 1);
    const log = await cadeia.lerLog();
    provar('…e a recusa fica no log', log.length === 1 && log[0].orcamento === true, log);
  }

  /* ==========================================================================
   * I. O AVISO QUE NÃO CHEGAVA A NINGUÉM (20/11/2026)
   *
   * A Sala `Rosa` passou a 110 minutos. A cadeia derivou o plano, o PO e o `.conf`, o
   * `comporConf` declarou a pendência certa — «a escola não declara VOLUME_MIN_110 nem
   * VOLUME_MAX_110 — o gerador recusa a aula de 110 min» — e ela ficou no relatório do
   * escrevedor. A cadeia respondeu `ok: true`, as quatro etapas disseram «feita», o professor
   * leu «está em dia», e o `gerar-ciclo` morreu dois minutos depois. O site ficou no pacote
   * antigo.
   *
   * O que se mede: a pendência SOBE ao topo da resposta do gesto, com uma frase que se lê.
   * ========================================================================== */
  console.log('\nI. A PENDÊNCIA DO MANIFESTO SOBE AO GESTO');

  {
    const pendencia = 'a escola não declara VOLUME_MIN_110 nem VOLUME_MAX_110 — o gerador recusa '
      + 'a aula de 110 min sem a faixa da Regra 9';
    const { cadeia, arm } = montar({ pendencias: [pendencia] });
    await semear(arm, { planoGerado: '2026-11-01T10:00', poGerado: '2026-11-01T11:00' });
    const r = await cadeia.executar({ gatilho: 'mudanca-de-sala', turmas: [TURMA], quando: QUANDO });

    provar('a pendência sobe ao topo da resposta, e não fica no relatório do escrevedor',
      Array.isArray(r.avisos) && r.avisos.length === 1, r.avisos);
    provar('…e diz o que vai acontecer, em vez de esperar pelo CI',
      /vai recusar esta aula/.test(String((r.avisos || [])[0])), (r.avisos || [])[0]);
    provar('…e nomeia a chave que falta',
      /VOLUME_MIN_110/.test(String((r.avisos || [])[0] || '')), (r.avisos || [])[0]);
    /* E O CONTRÁRIO: sem pendência, nenhum aviso é inventado. */
    const limpo = montar({});
    await semear(limpo.arm, { planoGerado: '2026-11-01T10:00', poGerado: '2026-11-01T11:00' });
    const r2 = await limpo.cadeia.executar({
      gatilho: 'mudanca-de-sala', turmas: [TURMA], quando: QUANDO });
    provar('CONTROLE NEGATIVO: sem pendência, a resposta não leva aviso nenhum',
      r2.avisos === undefined, r2.avisos);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: a cadeia percorre vínculos → plano → PO → pacote, '
      + 'pára no que falta e diz onde, não empilha elos repetidos e deixa o rasto no log.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('a prova estourou:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
