#!/usr/bin/env node
'use strict';

/*
 * provar-fecho-do-pacote.js — A GERAÇÃO CORRE NUMA INVOCAÇÃO PRÓPRIA (10/11/2026).
 *
 * O QUE ESTA PROVA FIXA, e porquê:
 *
 *   A. A FRASE. Quando o teto de subpedidos corta a cadeia entre o PO e o pacote, o professor lia
 *      «Nada do ciclo foi escrito — repita o «Guardar»». Metade era falsa: os vínculos e os dois
 *      elos JÁ estavam gravados. A frase passa a dizer o que fechou e o que falta, a partir do
 *      estado real — e a lista `fecharam` viaja na resposta para a tela poder dizê-lo.
 *   B. O FECHO NUMA INVOCAÇÃO PRÓPRIA. `fecharPacotes` corre SÓ a etapa 4: não deriva plano nem
 *      PO (derivá-los outra vez empilharia elos gémeos), e chama a mesma `concluirPacote` do
 *      «Guardar». O teto do Cloudflare é por invocação: duas invocações, dois tetos.
 *   C. O ENDEREÇO DENTRO DO DOCUMENTO. O link «abrir» levava `/plano-observacao/` sem alvo, e a
 *      trava da porta devolvia o professor à listagem. Passa a levar `?ajustar=<carimbo>` e
 *      `?plano=<plano>` — os dois parâmetros que a porta já sabia ler.
 *   D. O `pacoteEmDia` DEIXOU DE SER UMA DEDUÇÃO. «O PO é posterior ao gatilho» não é «os
 *      documentos foram gerados»: era essa a dedução que fazia uma segunda tentativa dizer «a
 *      cadeia fechou» sem nada ter gerado. O registo da geração é o facto.
 *   E. A ROTA. `POST /api/bastidores/cadeia-pacote` responde no MESMO formato do gesto.
 *
 * CONTROLO NEGATIVO, onde ele é preciso: sem registo da geração, a leitura antiga (dedução) tem
 * de continuar a valer — senão esta correção apagava o estado de todas as escolas antigas.
 *
 * SEM REDE: o armazenamento é memória, os escritores são espiões, e a geração é um registo falso.
 *
 *   node experimentos/provar-fecho-do-pacote.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const { criarCadeia } = require(path.join(RAIZ, 'motor/servidor/cadeia.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const { contarSubpedidos } = require(path.join(RAIZ, 'motor/servidor/subpedidos.js'));

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
const QUANDO = '2026-11-10T13:00';
const PLANO = 'plano-20261103-2200';
const PO = 'po-20261103-2221';
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

function planoFixture(id, { geradoEm } = {}) {
  return {
    id,
    contexto: { escola: ESCOLA, professor: 'coqui', ciclo: '01', turma: TURMA },
    respostas: {
      'objetivo-geral': r('consolidar o alinhamento e a transferência de peso'),
      'contexto-turma': r(TURMA),
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
    },
    gerado_em: geradoEm || '2026-11-03T22:00',
  };
}

function poFixture(id, { planoId, geradoEm } = {}) {
  return {
    id,
    contexto: { escola: ESCOLA, professor: 'coqui', ciclo: '01', turma: TURMA },
    respostas: {
      'plano-de-ensino': r(planoId || PLANO),
      'sujeitos-da-observacao': r(['Aluna A', 'Aluna B']),
      'frequencia-de-registro': r('semanal'),
      'duracao-da-observacao': r([{ numero: 90, unidade: 'dia' }]),
      'recorte-do-que-se-observa': r('o apoio e a transferência de peso'),
      'condicao-de-registro': r('em vídeo, com o celular na barra'),
      'o-que-conta-como-evidencia': r('a aluna que corrige sem ser nomeada'),
      'criterio-de-parada': r('três aulas seguidas de registo'),
      'calendario-de-observacao': r('novembro a dezembro'),
      'volume-de-observacao': r('duas aulas por semana'),
      referencias: r('RAD (2015).'),
    },
    gerado_em: geradoEm || '2026-11-03T22:21',
  };
}

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

const elenco = (extra) => Object.assign({
  id: 'elenco-a', nome: 'Elenco A', professor: 'coqui',
  alunas: ['Aluna A', 'Aluna B'], campos: [{ id: 'x', nome: 'X' }],
  carimbo: '20261110-1300', atualizada_em: '2026-11-10T13:00:00.000Z',
}, extra || {});

/* A TURMA DO CASO: o elenco passou a declarar a Aluna B, e a curadoria ainda declara só a A —
 * é o estado que a migração do elenco dentro da Turma produz. */
const curadoria = (extra) => Object.assign({
  id: 'coqui-bale-classico-teste-3', professor: 'coqui', modalidade: 'Balé clássico',
  tradicao: 'RAD', turmas: [TURMA], linhaDeBase: 'elenco-a', alunas: ['Aluna A'],
}, extra || {});

/** A cadeia, com um teto de subpedidos controlável e um registo de geração opcional. */
function montar({ linhas = [elenco()], curadorias = [curadoria()], registoDaGeracao = null,
  coube = true, writerFalhou = false, semDisparo = false, commitFalhou = false } = {}) {
  const kv = kvDeMentira({ ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify(curadorias) });
  const visto = { planos: [], pos: [], conclusoes: [], gerou: 0 };
  const arm = criarMemoria();
  /* O ORÇAMENTO, no mesmo desenho do runtime: um `fetch` embrulhado, e `coube()` a responder. O
   * `fetch` falso conta as chamadas, para se medir que a recusa custa ZERO quando não cabe. */
  const rede = async (url) => { visto.gerou += 1; return { ok: true, json: async () => ({}) }; };
  const orcamento = contarSubpedidos(rede, 50);
  /* O TETO DO CASO: com `coube: false` o pedido já gastou 30 dos 50 — passa a porta da cadeia
   * (que exige 40% de folga) e não passa a da geração, que é exactamente o estado medido a
   * 10/11/2026: 33 gastos, 18 precisos, 50 de teto. */
  const semeadura = { usados: coube ? 0 : 30 };
  orcamento.subpedidos.usados = semeadura.usados;
  const cadeia = criarCadeia({
    armazenamento: arm, porta,
    conteudo: ler('conteudo/anamnese.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    carimbar: () => QUANDO,
    escreverPlano: async (envelope) => { visto.planos.push(envelope.id); return { ok: true }; },
    escreverPO: async () => ({ ok: true }),
    escreverCiclo: async () => ({ ok: true, documentos: [{}] }),
    disparar: async () => ({ ok: true }),
    geracao: registoDaGeracao
      ? { lerRegistro: async () => registoDaGeracao }
      : null,
    concluirPO: async (envelope) => {
      visto.conclusoes.push(envelope && envelope.id);
      /* A RECUSA PELO TETO, com a FRASE VERDADEIRA do `subpedidos.js` — é ela que a tela lê, e é
       * dela que a prova depende para o `porOrcamento` reconhecer o caso. */
      if (!coube) {
        return {
          fonte: { ok: false, motivo: 'orcamento' },
          ciclo: { ok: false, motivo: 'orcamento', erro: orcamento.subpedidos.motivo(18) },
          disparo: null,
        };
      }
      /* A FORMA REAL DO RELATÓRIO (10/11/2026) — e é ela que faltava aqui.
       *
       * O `escrever-ciclo.js` devolve `{conf, escritas, puladas, elos, docs, schema}` e NÃO tem
       * `ok` no topo: só o ganha a `false` quando uma escrita reprova. Este stub dizia
       * `{ok: true}`, mais generoso do que o escritor, e por isso a prova passava sobre um
       * defeito que estava no ar: a cadeia julgava com `Boolean(saida.ciclo.ok)`, lia
       * `undefined`, e escrevia «a geração não partiu» sobre uma geração que tinha corrido. */
      /* O CONTRAPONTO: o escritor REPROVA — e é aqui que ele põe `ok: false` no relatório. */
      if (writerFalhou) {
        return {
          fonte: { ok: true },
          ciclo: { ok: false, erro: 'não criei o commit: HTTP 500', escritas: [{ caminho: 'x', ok: false }] },
          disparo: { ok: false, naoDisparado: true, motivo: 'as fontes do ciclo não ficaram prontas',
            erro: 'não criei o commit: HTTP 500' },
        };
      }
      /* O COMMIT DAS FONTES REPROVADO — o motivo vive em `commit.erro` e em cada `escrita.erro`,
       * e NÃO num `relatorio.erro` no topo. É a forma real. */
      if (commitFalhou) {
        return {
          fonte: { ok: true },
          ciclo: { conf: { ok: true }, docs: { ok: true }, ok: false,
            commit: { ok: false, erro: 'não criei o commit: HTTP 409' },
            escritas: [{ caminho: 'x', ok: false, erro: 'não criei o commit: HTTP 409' }] },
          disparo: { ok: false, naoDisparado: true,
            motivo: 'as fontes do ciclo não ficaram prontas',
            erro: 'não criei o commit: HTTP 409' },
        };
      }
      /* SEM DISPARO: `disparar` é `null` (Worker sem `GITHUB_TOKEN`), e o `concluirPO` real nunca
       * escreve `saida.disparo`. O stub imita-o não devolvendo o campo. */
      if (semDisparo) {
        return {
          fonte: { ok: true },
          ciclo: { conf: { ok: true }, docs: { ok: true }, schema: { ok: true },
            escritas: [{ caminho: 'x', ok: true }], elos: [], puladas: [] },
        };
      }
      return {
        fonte: { ok: true },
        ciclo: { conf: { ok: true }, docs: { ok: true }, schema: { ok: true },
          escritas: [{ caminho: 'x', ok: true }], elos: [], puladas: [] },
        disparo: { status: 204, ok: true, erro: null },
      };
    },
    lerCuradorias: async () => JSON.parse(kv._dados.get('bastidores/' + ESCOLA + '/curadorias')),
    lerTurmas: async () => [{ nome: TURMA }],
    lerLinhasDeBase: async () => linhas,
    linhaDeBaseDaTurma: async () => linhas[0] || null,
    kv, escola: ESCOLA,
    /* A FUNÇÃO VERDADEIRA dos Bastidores: é o endereço real que a prova mede. */
    urlDaPorta: bastidores.urlDaPorta,
    orcamento: orcamento.subpedidos,
  });
  return { cadeia, arm, kv, visto, orcamento };
}

async function semear(arm) {
  await porta.gravarEnvelope(arm, planoFixture(PLANO), relatorioDe(PLANO));
  await porta.gravarEnvelope(arm, poFixture(PO, { planoId: PLANO }), relatorioDe(PO));
}

async function ids(arm, familia) {
  const nomes = await porta.nomesDeEnvelopes(arm, new RegExp('^' + familia + '-.*\\.json$'));
  return nomes.map((n) => n.replace(/\.json$/, ''));
}

/* O CONTEXTO DO PEDIDO, como o `fetch` dos Bastidores o monta. E o `ciclo` NÃO está na query:
 * a página da Produção não a traz, e é esse o caso real que fazia a porta devolver o professor à
 * listagem. O ciclo tem de vir do DOCUMENTO. */
const CONTEXTO = {
  professor: 'coqui', escola: ESCOLA, ciclo: '',
  query: 'professor=coqui&escola=' + ESCOLA,
};

(async () => {
  // ==========================================================================
  console.log('\nA. A FRASE — o que fechou fica dito, e o que falta também');

  let estouro = null;
  {
    const { cadeia, arm } = montar({ coube: false });
    await semear(arm);
    const bruto = await cadeia.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
      motivo: 'a aluna «Aluna B» passou a ser do elenco',
    });
    /* O ESTADO SAI EM BRUTO da cadeia; é o `montarEstadoDaCadeia` dos Bastidores que o põe em
     * palavras — e é o que a rota devolve. Aqui chamamos o `rodarCadeia` da rota pela ponte. */
    provar('a cadeia avançou as três primeiras etapas e parou na quarta',
      bruto.alvos[0].etapas.map((e) => e.estado).join(',') === 'feita,feita,feita,pendente',
      bruto.alvos[0].etapas.map((e) => e.estado));
    provar('…e o erro que ela carrega nomeia o teto de subpedidos',
      /subpedidos/.test(String(bruto.erro || '')), bruto.erro);
    estouro = bruto;
  }

  {
    /* A PROVA DA FRASE: a mesma `montarEstadoDaCadeia` que a rota usa. Ela não é exportada —
     * chega-se a ela pela rota verdadeira (`elenco-mover`), e é o que a secção E faz. Aqui
     * afirma-se o essencial sem rede: o `falta` da etapa 4 é a frase do orçamento. */
    const etapa = estouro.alvos[0].etapas.find((e) => e.chave === 'pacote');
    provar('a etapa 4 diz PORQUE não fechou, e não um `undefined`',
      Boolean(etapa && etapa.falta) && /subpedidos/.test(etapa.falta), etapa);
    provar('…e a frase NÃO manda repetir o gesto como se nada tivesse sido gravado',
      !/Nada do ciclo foi escrito/.test(String(etapa.falta || '')),
      etapa && etapa.falta);
    provar('…e diz que o que veio antes está gravado',
      /o que veio antes dele está gravado/.test(String(etapa.falta || '')), etapa && etapa.falta);
  }

  // ==========================================================================
  console.log('\nB. O FECHO — só a etapa 4, e sem elos gémeos');

  {
    const { cadeia, arm, visto } = montar();
    await semear(arm);
    const planosAntes = await ids(arm, 'plano');
    const posAntes = await ids(arm, 'po');
    const conclusoesAntes = visto.conclusoes.length;

    const feito = await cadeia.fecharPacotes({ turmas: [TURMA], motivo: 'prova' });

    provar('o fecho responde `ok`', feito.ok === true, feito.erro);
    provar('…e NÃO derivou elo de plano', (await ids(arm, 'plano')).length === planosAntes.length,
      { antes: planosAntes, depois: await ids(arm, 'plano') });
    provar('…nem elo de PO', (await ids(arm, 'po')).length === posAntes.length,
      { antes: posAntes, depois: await ids(arm, 'po') });
    provar('…e correu a conclusão do pacote UMA vez',
      visto.conclusoes.length === conclusoesAntes + 1, visto.conclusoes);
    provar('…sobre o PO que o plano vigente observa', visto.conclusoes.slice(-1)[0] === PO,
      visto.conclusoes);
    const etapa4 = feito.alvos[0].etapas.find((e) => e.chave === 'pacote');
    provar('…e as quatro etapas ficam `feita`',
      feito.alvos[0].etapas.every((e) => e.estado === 'feita'), feito.alvos[0].etapas);
    provar('…com o id do PO na etapa 3 (é ele que faz o link entrar no documento)',
      feito.alvos[0].etapas[2].id === PO, feito.alvos[0].etapas[2]);
  }

  {
    /* A RECUSA HONESTA: sem plano, o fecho não inventa nada — diz o que falta. */
    const { cadeia, arm } = montar();
    void arm;
    const semNada = await cadeia.fecharPacotes({ turmas: [TURMA] });
    provar('sem plano nem PO o fecho NÃO corre e diz porquê',
      semNada.ok === false && /plano de ensino/.test(String(semNada.erro || '')), semNada.erro);
    const etapa4 = semNada.alvos[0].etapas.find((e) => e.chave === 'pacote');
    provar('…e a etapa 4 fica `bloqueada`, e não `pendente`',
      etapa4.estado === 'bloqueada', etapa4);
  }

  {
    /* A TURMA QUE NÃO EXISTE não é um fecho silencioso. */
    const { cadeia } = montar();
    const alheia = await cadeia.fecharPacotes({ turmas: ['Turma Que Não Existe'] });
    provar('uma turma sem curadoria devolve erro, e não um `ok` vazio',
      alheia.ok === false && /nenhuma Turma/.test(String(alheia.erro || '')), alheia.erro);
  }

  // ==========================================================================
  console.log('\nC. O ENDEREÇO — dentro do documento, e não na porta');

  {
    const { cadeia } = montar();
    const href = (chave, etapa) => cadeia.enderecoDaEtapa(CONTEXTO, chave, etapa);

    provar('os vínculos levam à aba das Turmas da Produção',
      href('vinculos', {}) === '#turmas', href('vinculos', {}));

    /* O CICLO VAI NA ETAPA, como o `montarEstadoDaCadeia` o põe: é o documento que o declara. */
    const planoPendente = href('plano-de-ensino', { id: 'plano-20261101-0900', ciclo: '01' });
    provar('o plano pendente abre o documento, em modo de ajuste',
      /\/plano-ensino\/\?/.test(planoPendente) && /fonte=plano/.test(planoPendente)
        && /ajustar=plano-20261101-0900/.test(planoPendente), planoPendente);
    provar('…e leva o contexto (escola, professor)',
      /professor=coqui/.test(planoPendente) && /escola=prova/.test(planoPendente), planoPendente);
    /* O CICLO NÃO ESTÁ NO PEDIDO — vem do documento. Sem ele a porta não abre
     * (`contextoFaltando`), e é essa a «titubeada» que a pesquisadora descreveu: a página chega
     * e volta para a listagem. */
    provar('…e o CICLO, que o pedido não trazia, vem do documento',
      /ciclo=01/.test(planoPendente), planoPendente);

    const planoBloqueado = href('plano-de-ensino', { ciclo: '01' });
    provar('sem plano, o endereço NÃO pede «ajustar» um documento que não existe',
      !/ajustar=/.test(planoBloqueado) && /fonte=plano/.test(planoBloqueado), planoBloqueado);

    const poPendente = href('plano-de-observacao', { id: PO, plano: PLANO, ciclo: '01' });
    provar('o PO pendente abre o documento E diz que plano observa',
      /ajustar=po-20261103-2221/.test(poPendente) && /plano=plano-20261103-2200/.test(poPendente),
      poPendente);
    provar('…e é a página do PO, e não outra',
      poPendente.indexOf('/plano-observacao/?') === 0, poPendente);

    /* A ETAPA DA GERAÇÃO NÃO ABRE UM DOCUMENTO — EXECUTA-SE (10/11/2026).
     *
     * Aqui esteve: «a geração leva ao PO com o plano escolhido — e SEM `ajustar=`». A segunda
     * metade estava certa e continua a ser a razão desta: abrir o PO com `ajustar=` para «só
     * gerar» deriva um elo GÉMEO de um documento em dia. A primeira metade é que não servia —
     * sem `ajustar=`, a porta não tem documento para carregar e devolve o professor à LISTAGEM.
     * Era o «volta para a listagem» que a pesquisadora relatou.
     *
     * O que falta nesta etapa não é um documento: é uma geração. Ela tem rota própria
     * (`/api/bastidores/cadeia-pacote`) e vive nos Bastidores; o endereço passou a ser a secção
     * das Turmas, e a ligação carrega `data-fechar` com a turma — o clique corre o fecho ali
     * mesmo, com o véu de pé. */
    const pacote = href('pacote', { id: PO, plano: PLANO, ciclo: '01' });
    provar('a etapa da geração leva à secção onde ela corre, e não a um documento',
      pacote === '#turmas', pacote);
    provar('…porque abrir o PO com `ajustar=` para «só gerar» derivaria um elo gémeo',
      !/ajustar=/.test(pacote), pacote);
  }

  // ==========================================================================
  console.log('\nD. O `pacoteEmDia` — o registo da geração é o facto');

  {
    /* O CASO QUE MENTIA: o PO é POSTERIOR ao gatilho (a dedução antiga diria «em dia»), mas o
     * registo da geração é ANTERIOR a ele — logo, os documentos não foram gerados. */
    const registo = { em: '2026-11-03T22:30:00.000Z', documentos: [{ id: 'aula-01' }] };
    const { cadeia, arm } = montar({ registoDaGeracao: registo });
    await semear(arm);
    const res = await cadeia.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
    });
    /* O PO derivado tem `gerado_em` = QUANDO, posterior ao registo — a etapa 4 TEM de estar
     * pendente, e a geração tem de ter corrido. */
    const etapa4 = res.alvos[0].etapas.find((e) => e.chave === 'pacote');
    provar('com o registo anterior ao PO, a geração CORRE (não se deduz «em dia»)',
      etapa4.estado === 'feita', etapa4);
    void arm;
  }

  {
    /* E O CONTRÁRIO: registo POSTERIOR ao PO e com documentos derivados ⇒ o pacote está em dia,
     * e a cadeia não gera outra vez. */
    const registo = { em: '2026-11-09T20:30:00.000Z', documentos: [{ id: 'aula-01' }] };
    const { cadeia, arm, visto } = montar({ registoDaGeracao: registo });
    await semear(arm);
    /* O gatilho é NOVE de novembro; o plano e o PO gravados são de TRÊS de novembro, pelo que as
     * etapas 2 e 3 derivam. O registo é de nove, posterior aos elos novos de QUANDO? Não: os elos
     * novos nascem com `gerado_em = QUANDO` (10/11), posteriores ao registo (09/11) — logo a
     * geração tem de voltar a correr. É o CONTROL0 NEGATIVO desta secção: o registo ser antigo
     * não pode ser confundido com «em dia». */
    const res = await cadeia.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
    });
    provar('o registo ANTERIOR aos elos novos não os dá por gerados',
      res.alvos[0].etapas.find((e) => e.chave === 'pacote').estado === 'feita'
        && visto.conclusoes.length === 1, { conclusoes: visto.conclusoes });
  }

  {
    /* SEM registo nenhum, a dedução antiga continua a valer — o controlo negativo que impede
     * esta correção de apagar o estado das escolas que não têm a chave no KV. */
    const { cadeia, arm, visto } = montar();
    await semear(arm);
    const res = await cadeia.executar({
      gatilho: 'troca-de-aliena', elencos: ['elenco-a'], quando: QUANDO,
    });
    provar('sem registo da geração, a leitura antiga mantém-se (o pacote corre)',
      res.alvos[0].etapas.find((e) => e.chave === 'pacote').estado === 'feita'
        && visto.conclusoes.length === 1, { conclusoes: visto.conclusoes });
  }

  // ==========================================================================
  console.log('\nE. A ROTA — `cadeia-pacote` responde no formato do gesto');

  {
    const { cadeia, arm, kv } = montar();
    await semear(arm);
    const env = {
      ESCOLA_SLUG: ESCOLA, PADD_KV: kv, FUSO: 'America/Sao_Paulo',
      SENHA_DIRECAO: 'x',
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

    const feito = await pedir('/api/bastidores/cadeia-pacote', { turmas: [TURMA] }, { cadeia });
    provar('a rota responde 200', feito.status === 200, { status: feito.status, corpo: feito.texto.slice(0, 300) });
    provar('…e devolve o estado da cadeia no MESMO formato do gesto',
      feito.json && feito.json.cadeia && feito.json.cadeia.executada === true
        && Array.isArray(feito.json.cadeia.faltam) && Array.isArray(feito.json.cadeia.fecharam),
      feito.json && feito.json.cadeia);
    provar('…com a frase do resultado',
      /a cadeia fechou/.test(String((feito.json.cadeia || {}).recado || '')),
      feito.json && feito.json.cadeia.recado);

    const semTurma = await pedir('/api/bastidores/cadeia-pacote', {}, { cadeia });
    provar('sem turma a rota recusa com 400, e não gera nada de ninguém',
      semTurma.status === 400 && semTurma.json && semTurma.json.ok === false, semTurma.json);

    const semCadeia = await pedir('/api/bastidores/cadeia-pacote', { turmas: [TURMA] }, {});
    provar('sem a cadeia montada a rota DIZ que não está montada',
      semCadeia.json && semCadeia.json.ok === false
        && /não está montada/.test(String(semCadeia.json.motivo || '')), semCadeia.json);
  }

  // ==========================================================================
  console.log('\nF. A FRASE, PELA ROTA — o que fechou e o que falta');

  {
    /* O GESTO COM O TETO ESGOTADO: a rota dos Bastidores tem de dizer o que ficou gravado. */
    const { cadeia, arm, kv } = montar({ coube: false });
    await semear(arm);
    const env = { ESCOLA_SLUG: ESCOLA, PADD_KV: kv, FUSO: 'America/Sao_Paulo' };
    const resposta = await bastidores.fetch(
      new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev/api/bastidores/cadeia-pacote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turmas: [TURMA] }),
      }), env, { cadeia });
    const corpo = await resposta.json();
    provar('o fecho que estoura no teto responde 200 (o acto não é derrubado)',
      resposta.status === 200, resposta.status);
    provar('…e a frase diz QUAL etapa ficou por fazer, com o motivo',
      /Documentos gerados/.test(String((corpo.cadeia || {}).recado || ''))
        && /subpedidos/.test(String((corpo.cadeia || {}).recado || '')),
      corpo.cadeia && corpo.cadeia.recado);
    provar('…e a lista do que já fechou vai na resposta',
      Array.isArray((corpo.cadeia || {}).fecharam) && corpo.cadeia.fecharam.length === 3,
      corpo.cadeia && corpo.cadeia.fecharam);
    provar('…e `porOrcamento` é verdadeiro, para a tela saber que pode tentar de novo',
      corpo.cadeia && corpo.cadeia.porOrcamento === true, corpo.cadeia && corpo.cadeia.porOrcamento);
    const falta = ((corpo.cadeia || {}).faltam || [])[0] || {};
    /* O FIM A FIM DO «TITUBEIO». A etapa que falta aqui é o PACOTE, e ela não se abre: executa-se
     * na secção das Turmas. O que se mede é que o endereço existe, é o sítio certo, e nomeia a
     * turma — é com esse nome que a página corre o fecho. */
    provar('…e o «abrir» da etapa que falta leva à secção onde a geração corre',
      String(falta.href || '') === '#turmas', falta.href);
    provar('…e nomeia a TURMA, que é o que a página precisa para correr o fecho',
      falta.chave === 'pacote' && falta.turma === TURMA, { chave: falta.chave, turma: falta.turma });
  }

  // ==========================================================================
  console.log('\nG. DUAS TURMAS — a etapa só fecha se fechar em todas');

  {
    /* A MIGRAÇÃO PODE TOCAR MAIS DE UMA TURMA. A segunda não tem plano: a etapa 4 dela fica
     * bloqueada. A frase do conjunto NÃO pode dizer «falta nada» por a primeira ter fechado. */
    const TURMA_B = 'Jazz Nível 2 — Teste';
    const { cadeia, arm, kv } = montar({
      curadorias: [
        curadoria(),
        curadoria({ id: 'coqui-jazz-teste', turmas: [TURMA_B], linhaDeBase: 'elenco-b' }),
      ],
    });
    await semear(arm);
    const env = { ESCOLA_SLUG: ESCOLA, PADD_KV: kv, FUSO: 'America/Sao_Paulo' };
    const resposta = await bastidores.fetch(
      new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev/api/bastidores/cadeia-pacote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turmas: [TURMA, TURMA_B] }),
      }), env, { cadeia });
    const corpo = await resposta.json();
    const c = corpo.cadeia || {};
    provar('com duas turmas, a resposta traz as duas', (c.alvos || []).length === 2,
      (c.alvos || []).map((a) => a.turma));
    provar('…e a etapa que só uma fechou NÃO entra na lista do que fechou',
      Array.isArray(c.fecharam) && c.fecharam.length === 1, c.fecharam);
    provar('…nem a frase diz «falta nada»',
      !/falta nada|Falta nada/i.test(String(c.recado || '')) && /Falta /.test(String(c.recado || '')),
      c.recado);
    provar('…e a turma sem plano é nomeada com o que lhe falta',
      new RegExp(TURMA_B).test(String(c.recado || ''))
        && /plano de ensino/.test(String(c.recado || '')), c.recado);
  }

  // ==========================================================================
  console.log('\nH. O RELATÓRIO DO ESCRITOR NÃO TEM `ok` NO TOPO — E O SUCESSO NÃO É FALHA');

  {
    /* O DEFEITO MEDIDO A 10/11/2026, no ar. A derivação da Turma gravou as fontes e DISPAROU o
     * workflow (run 42934034454), e a rota respondeu «a geração não partiu». `Boolean(undefined)`
     * é `false`: o sucesso era lido como falha em todas as gerações — e com ele, `porOrcamento`
     * ficava falso e a continuação automática não partia.
     *
     * A prova abaixo usa o relatório na forma EXATA do escritor. */
    const caso = montar({ coube: true });
    await semear(caso.arm);
    const r = await caso.cadeia.fecharPacotes({ turmas: [TURMA], motivo: 'prova' });
    provar('com o relatório real do escritor, o fecho diz que fechou', r.ok === true, r.erro);
    const etapas = ((r.alvos || [])[0] || {}).etapas || [];
    provar('…e a etapa do pacote fica FEITA',
      (etapas.find((e) => e.chave === 'pacote') || {}).estado === 'feita', etapas);
    provar('…e o `ciclo` do relatório não é dado por reprovado',
      etapas.every((e) => e.estado === 'feita'), etapas.map((e) => [e.chave, e.estado]));

    // O CONTRAPONTO: quando o escritor REPROVA (põe `ok: false`), a etapa tem de voltar a pendente.
    const reprovado = montar({ coube: true, writerFalhou: true });
    await semear(reprovado.arm);
    const r2 = await reprovado.cadeia.fecharPacotes({ turmas: [TURMA], motivo: 'prova' });
    provar('quando o escritor reprova, o fecho NÃO diz que fechou', r2.ok === false, r2.erro);
    provar('…e a etapa volta a pendente, com o motivo do escritor',
      /não criei o commit/.test(String(r2.erro || '')), r2.erro);

    /* O VEREDITO FALSO NUNCA SAI SEM MOTIVO (10/11/2026). Um `ok:false` com `erro:null` lê-se
     * como «a geração não partiu» — verdadeiro e inútil. Este caso é o do Worker SEM token: o
     * `disparar` é `null`, `saida.disparo` nunca é escrito, e antes disto a resposta não dizia
     * nada. */
    {
      const semToken = montar({ coube: true, semDisparo: true });
      await semear(semToken.arm);
      const r3 = await semToken.cadeia.fecharPacotes({ turmas: [TURMA], motivo: 'prova' });
      provar('sem disparo possível, o veredito é falso', r3.ok === false, r3.ok);
      provar('…e o motivo NOMEIA a falta (não um silêncio com ar de resposta)',
        /GITHUB_TOKEN/.test(String(r3.erro || '')), r3.erro);
    }

    /* O COMMIT DAS FONTES QUE FALHA: o escritor põe o motivo em `commit.erro`/`escrita.erro`, e
     * não num `relatorio.erro`. Também tem de ser dito. */
    {
      const commitFalhou = montar({ coube: true, commitFalhou: true });
      await semear(commitFalhou.arm);
      const r4 = await commitFalhou.cadeia.fecharPacotes({ turmas: [TURMA], motivo: 'prova' });
      provar('com o commit das fontes reprovado, o veredito é falso', r4.ok === false, r4.ok);
      provar('…e o motivo do commit chega à frase',
        /não criei o commit/.test(String(r4.erro || '')), r4.erro);
    }

    /* AS DUAS FRASES DO MESMO FACTO (10/11/2026). O Cloudflare diz «Too many subrequests by
     * single Worker invocation»; a nossa diz «…subpedidos…». A pergunta «isto é orçamento?» tem
     * um dono só, e é ele que decide se a tela pode tentar de novo. */
    const { ehOrcamento } = require(path.join(RAIZ, 'motor/servidor/subpedidos.js'));
    provar('a frase do Cloudflare é reconhecida como orçamento',
      ehOrcamento('Too many subrequests by single Worker invocation. To configure this limit, …'));
    provar('…e a nossa também',
      ehOrcamento('esta invocação do Worker já gastou 33 dos 50 subpedidos permitidos'));
    provar('…e uma falta que NÃO é de orçamento não é confundida',
      !ehOrcamento('a Turma «Piano» ainda não tem plano de ensino'));
  }

  // ==========================================================================
  console.log('');
  if (falhas) {
    console.log('FALHARAM ' + falhas + ' de ' + provas + ' asserções.');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + provas + ' asserções: a geração corre numa invocação própria, '
    + 'a frase diz o que já ficou gravado, o «abrir» entra no documento e o pacote em dia deixou '
    + 'de ser uma dedução.');
})();
