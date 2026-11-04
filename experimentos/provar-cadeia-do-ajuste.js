#!/usr/bin/env node
'use strict';

/*
 * provar-cadeia-do-ajuste.js — ajustar o plano de ensino arrasta o PO, e o PO passa a observar o
 * plano que vale (04/11/2026).
 *
 * O QUE ACONTECEU. A pesquisadora corrigiu a proporção do bloco Expressão no plano de ensino. O
 * «Guardar» fez o que a proveniência manda — criou um elo novo, porque o plano está vinculado a um
 * PO —, e o resultado, do lado dela, foi:
 *
 *   · um plano de ensino «livre» na estante (o novo, que nenhum PO referenciava);
 *   · o PO a observar o plano de ANTES (`po-20261104-1733` → `plano-de-ensino:
 *     plano-20261103-2200`, medido no envelope real);
 *   · e a aula, a ler a proporção antiga.
 *
 * Duas cadeias paralelas, sem nada entre elas — o sistema a dizer a verdade sobre cada elo e a
 * mentir sobre o conjunto.
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   A. A CADEIA DO PLANO — o `ajuste_de` liga os elos, e o VIGENTE é o topo (o que ninguém
 *      substituiu). Sem gravar nada: tudo é derivado.
 *   B. O PO DO PLANO — acha o PO que observa qualquer elo da cadeia, e prefere o que não foi
 *      substituído. É o que o ajuste em cadeia tem de derivar.
 *   C. A REFERÊNCIA SEGUE O TOPO — um PO gravado a declarar um plano substituído passa a apontar o
 *      vigente, e o ajuste é DITO na resposta (`planoRetargetado`).
 *   D. O AJUSTE ARRASTA O PO — gravar o ajuste de um plano vinculado cria o elo do PO, com
 *      `ajuste_de` a apontar o anterior e a referência nova; e o caminho normal corre (o `-po.md`,
 *      o ciclo e o disparo).
 *   E. SEM PO, NADA SE INVENTA — um plano livre que é ajustado dá o elo do plano e nenhum PO: criar
 *      uma linha de base que ninguém declarou seria inventar observação.
 *   F. O ENCADEAMENTO NÃO SE MULTIPLICA — repetir o ajuste (plano v3) deriva UM elo de PO, não um
 *      por cada elo antigo; e o vigente de cada família é sempre um.
 *
 * SEM REDE: o armazenamento é memória, e as três saídas do ciclo (`escreverPO`, `escreverCiclo`,
 * `disparar`) são espiões que registam o que lhes chega.
 *
 *   node experimentos/provar-cadeia-do-ajuste.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const { criarRotas } = require(path.join(RAIZ, 'motor/servidor/rotas.js'));

const ler = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta', p), 'utf8'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

// ------------------------------------------------------------------ fixtures

/** O relatório mínimo que o `gravarEnvelope` exige. */
function relatorioDe(id) {
  return {
    id, estado: 'Input_anamnese_construida',
    contagem: { respondidos: 0, obrigatorios: 0 },
    elos: [], paradas: [], idsDesconhecidos: [],
    validacao: { resultado: 'aceite', contrato: 'prova' },
    errosDoDocumento: [], linhas: [],
  };
}

const r = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });

function plano(id, { ajusteDe, geradoEm, expressao } = {}) {
  const linhas = [
    { Bloco: 'Barra', 'Proporção alvo': '30%', Justificativa: 'Apoio.' },
    { Bloco: 'Centro', 'Proporção alvo': '30%', Justificativa: 'Deslocamento.' },
    { Bloco: 'Musicalidade', 'Proporção alvo': '10%', Justificativa: 'Pulso.' },
    { Bloco: 'Expressão', Justificativa: 'Braços' },
  ];
  if (expressao) linhas[3]['Proporção alvo'] = expressao;
  const envelope = {
    id,
    contexto: { escola: 'prova', professor: 'coqui', ciclo: '01', turma: 'Balé Nível 1 — Teste 3' },
    respostas: {
      'objetivo-geral': r('consolidar o alinhamento e a transferência de peso'),
      'contexto-turma': r('Balé Nível 1 — Teste 3'),
      'contexto-duracao': r([{ numero: 45, unidade: 'minuto' }]),
      'marcos-por-aula': r(['reconhecer o apoio', 'transferir o peso']),
      'estrutura-de-cada-aula': r([{ marco: 1, marcados: ['Barra', 'Centro', 'Musicalidade', 'Expressão'] }]),
      'aula-1-parametro': r([{ marco: 1, marcados: ['Battement tendu'] }]),
      'distribuicao-de-volume': r({ unidade: 'percentual', linhas }),
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
      'contexto-escola': r('prova'),
      'contexto-professor': r('coqui'),
    },
    gerado_em: geradoEm || '2026-11-03T22:00',
  };
  if (ajusteDe) envelope.ajuste_de = ajusteDe;
  return envelope;
}

function po(id, { planoId, ajusteDe, geradoEm } = {}) {
  const envelope = {
    id,
    contexto: { escola: 'prova', professor: 'coqui', ciclo: '01', turma: 'Balé Nível 1 — Teste 3' },
    respostas: {
      'dimensoes-de-observacao': r(['Técnica — Barra', 'Técnica — Expressão']),
      'itens-por-dimensao': r([
        { sujeito: 'Técnica — Barra', itens: 'saída do calcanhar no tendu' },
        { sujeito: 'Técnica — Expressão', itens: 'olhar acompanha o braço' },
      ]),
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
      escola: r('prova'),
      'campo-escola': r('prova'),
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

/** As rotas, com as três saídas espiadas. */
function rotasCom(armazenamento) {
  const visto = { po: [], ciclo: [], disparo: [] };
  const rotas = criarRotas({
    armazenamento,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    fuso: 'America/Sao_Paulo',
    escolaDoWorker: 'prova',
    agora: () => '2026-11-04T18:00',
    escreverPlano: async () => ({ ok: true }),
    escreverPO: async (envelope) => { visto.po.push(envelope.id); return { ok: true }; },
    escreverCiclo: async ({ po }) => { visto.ciclo.push(po && po.id); return { ok: true, documentos: [{}] }; },
    disparar: async () => { visto.disparo.push(true); return { ok: true }; },
  });
  const pedir = async (caminho, corpo) => {
    const r = await rotas.responder(new Request('http://local' + caminho, corpo
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) }
      : {}));
    return { status: r.status, dados: await r.json().catch(() => null) };
  };
  return { pedir, visto };
}

/** Todos os ids de uma família, lidos do armazenamento (ordem crescente). */
async function ids(armazenamento, familia) {
  const nomes = await porta.nomesDeEnvelopes(armazenamento, new RegExp('^' + familia + '-.*\\.json$'));
  return nomes.map((n) => n.replace(/\.json$/, '')).sort();
}

(async () => {
  // ---------------------------------------------------------------- A e B
  console.log('\nA. A CADEIA DO PLANO — o `ajuste_de` liga os elos, o VIGENTE é o topo');
  {
    const arm = criarMemoria();
    await porta.gravarEnvelope(arm, plano('plano-20261103-2200'), relatorioDe('plano-20261103-2200'));
    await porta.gravarEnvelope(arm, plano('plano-20261104-1732', { ajusteDe: 'plano-20261103-2200', geradoEm: '2026-11-04T17:32', expressao: '30%' }), relatorioDe('plano-20261104-1732'));

    const cadeia = await porta.planosDaCadeia(arm, 'plano-20261103-2200');
    provar('a cadeia do plano antigo tem os dois elos',
      cadeia.sort().join(',') === 'plano-20261103-2200,plano-20261104-1732', cadeia);
    provar('o VIGENTE do plano antigo é o novo', await porta.planoVigenteDaCadeia(arm, 'plano-20261103-2200') === 'plano-20261104-1732');
    provar('e o vigente do novo é ele mesmo', await porta.planoVigenteDaCadeia(arm, 'plano-20261104-1732') === 'plano-20261104-1732');

    console.log('\nB. O PO DO PLANO — por qualquer elo da cadeia, e o que não foi substituído');
    await porta.gravarEnvelope(arm, po('po-20261103-2221', { planoId: 'plano-20261103-2200' }), relatorioDe('po-20261103-2221'));
    provar('o PO do plano antigo é encontrado', await porta.poDoPlano(arm, 'plano-20261103-2200') === 'po-20261103-2221');
    provar('…e o do plano novo é o MESMO (a cadeia é uma só)',
      await porta.poDoPlano(arm, 'plano-20261104-1732') === 'po-20261103-2221');

    await porta.gravarEnvelope(arm, po('po-20261104-1733', { planoId: 'plano-20261104-1732', ajusteDe: 'po-20261103-2221', geradoEm: '2026-11-04T17:33' }), relatorioDe('po-20261104-1733'));
    provar('com um elo de PO, o vigente é o novo', await porta.poDoPlano(arm, 'plano-20261104-1732') === 'po-20261104-1733');
    provar('…e o antigo não é mais o vigente', await porta.poDoPlano(arm, 'plano-20261103-2200') === 'po-20261104-1733');
  }

  // ---------------------------------------------------------------- C
  console.log('\nC. A REFERÊNCIA SEGUE O TOPO — e o ajuste é DITO');
  {
    const arm = criarMemoria();
    await porta.gravarEnvelope(arm, plano('plano-20261103-2200'), relatorioDe('plano-20261103-2200'));
    await porta.gravarEnvelope(arm, plano('plano-20261104-1732', { ajusteDe: 'plano-20261103-2200', geradoEm: '2026-11-04T17:32' }), relatorioDe('plano-20261104-1732'));
    await porta.gravarEnvelope(arm, po('po-20261103-2221', { planoId: 'plano-20261103-2200' }), relatorioDe('po-20261103-2221'));

    const dados = { conteudo: ler('conteudo/anamnese.json'), conteudoPO: ler('po/conteudo/po.json'), conteudoPlano: ler('plano/conteudo/plano.json'), esquema: ler('envelope/elicitacao-schema.json'), agora: () => '2026-11-04T18:00' };
    const antigo = await porta.lerEnvelope(arm, 'po-20261103-2221');
    const elo = await porta.elicitar(arm, {
      respostas: antigo.respostas, contexto: antigo.contexto, fonte: 'po',
      ajuste_de: 'po-20261103-2221',
    }, dados);

    provar('o elo do PO foi gravado', elo && elo.gravado === true, elo && elo.erroDaGravacao);
    const gravado = await porta.lerEnvelope(arm, elo.id);
    const ref = gravado.respostas['plano-de-ensino'];
    const refId = ref && ref.valor !== undefined ? ref.valor : ref;
    provar('…e observa o plano VIGENTE, não o substituído',
      String(refId) === 'plano-20261104-1732', refId);
    provar('a correção da referência vai declarada na resposta',
      elo.planoRetargetado && elo.planoRetargetado.de === 'plano-20261103-2200'
      && elo.planoRetargetado.para === 'plano-20261104-1732', elo.planoRetargetado);
    provar('o elo aponta o PO anterior (a proveniência acrescenta, não edita)',
      gravado.ajuste_de === 'po-20261103-2221', gravado.ajuste_de);

    // CONTROLO NEGATIVO: um PO cujo plano declarado JÁ É o topo — nada se troca, nada se declara.
    const poNoTopo = po('po-20261104-1740', { planoId: 'plano-20261104-1732', geradoEm: '2026-11-04T17:40' });
    await porta.gravarEnvelope(arm, poNoTopo, relatorioDe('po-20261104-1740'));
    const semElo = await porta.elicitar(arm, {
      respostas: poNoTopo.respostas, contexto: poNoTopo.contexto, fonte: 'po',
      id: 'po-20261104-1740',
    }, dados);
    provar('com o plano já no topo, não há retarget a declarar',
      !semElo.planoRetargetado, semElo.planoRetargetado);
    const guardado = await porta.lerEnvelope(arm, 'po-20261104-1740');
    const refGuardada = guardado.respostas['plano-de-ensino'];
    provar('e a referência fica como estava',
      String(refGuardada.valor !== undefined ? refGuardada.valor : refGuardada) === 'plano-20261104-1732');
  }

  // ---------------------------------------------------------------- D
  console.log('\nD. O AJUSTE ARRASTA O PO — e o caminho até ao ciclo corre');
  {
    const arm = criarMemoria();
    await porta.gravarEnvelope(arm, plano('plano-20261103-2200'), relatorioDe('plano-20261103-2200'));
    await porta.gravarEnvelope(arm, po('po-20261103-2221', { planoId: 'plano-20261103-2200' }), relatorioDe('po-20261103-2221'));
    const { pedir, visto } = rotasCom(arm);

    // O «Guardar» do plano vinculado: manda o `id`, e o motor deriva o elo.
    const resposta = await pedir('/api/elicitar', {
      fonte: 'plano',
      id: 'plano-20261103-2200',
      contexto: { escola: 'prova', professor: 'coqui', ciclo: '01', turma: 'Balé Nível 1 — Teste 3' },
      respostas: { 'distribuicao-de-volume': r({
        unidade: 'percentual',
        linhas: [
          { Bloco: 'Barra', 'Proporção alvo': '30%', Justificativa: 'Apoio.' },
          { Bloco: 'Centro', 'Proporção alvo': '30%', Justificativa: 'Deslocamento.' },
          { Bloco: 'Musicalidade', 'Proporção alvo': '10%', Justificativa: 'Pulso.' },
          { Bloco: 'Expressão', 'Proporção alvo': '30%', Justificativa: 'Braços' },
        ],
      }) },
    });
    provar('o plano foi gravado', resposta.status === 200 && resposta.dados.gravado === true,
      resposta.dados && resposta.dados.erroDaGravacao);

    const novoPlano = resposta.dados.id;
    provar('…como ELO NOVO (o plano estava vinculado)', novoPlano !== 'plano-20261103-2200', novoPlano);

    const cadeia = resposta.dados.cadeia || {};
    provar('a resposta diz que o plano foi ajustado',
      cadeia.plano && cadeia.plano.de === 'plano-20261103-2200' && cadeia.plano.para === novoPlano, cadeia.plano);
    provar('…e que o PO acompanhou, num elo novo',
      cadeia.po && cadeia.po.de === 'po-20261103-2221' && cadeia.po.para, cadeia.po);

    const pos = await ids(arm, 'po');
    provar('existem DOIS POs no acervo (o anterior de pé, o novo)', pos.length === 2, pos);
    const novoPo = await porta.lerEnvelope(arm, cadeia.po.para);
    const ref = novoPo.respostas['plano-de-ensino'];
    const refId = ref && ref.valor !== undefined ? ref.valor : ref;
    provar('o PO novo observa o PLANO NOVO', String(refId) === novoPlano, { refId, novoPlano });
    provar('…e aponta o anterior como elo', novoPo.ajuste_de === 'po-20261103-2221', novoPo.ajuste_de);

    provar('o `-po.md` foi escrito com o PO novo', visto.po.indexOf(cadeia.po.para) !== -1, visto.po);
    provar('o ciclo foi derivado do PO novo', visto.ciclo.indexOf(cadeia.po.para) !== -1, visto.ciclo);
    provar('e a geração foi disparada', visto.disparo.length === 1, visto.disparo);

    const estadoDoNovo = (await porta.estadosDosPlanos(arm))[novoPlano] || {};
    provar('na estante, o plano novo fica VINCULADO (o elo do PO o referencia)',
      estadoDoNovo.vinculada === true, estadoDoNovo);

    /* A PONTA FINAL: A AULA LÊ A PROPORÇÃO NOVA. É a queixa de origem — o professor gravou os
     * 30% do Expressão no plano, e a aula continuava a dizer «preencher». Aqui mede-se o caminho
     * inteiro: o plano ajustado + o PO que o acompanhou → a §3 da Aula 01. */
    const { derivarAula01 } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
    const planoNovo = await porta.lerEnvelope(arm, novoPlano);
    const poNovo = await porta.lerEnvelope(arm, cadeia.po.para);
    const aula = derivarAula01({
      plano: planoNovo, po: poNovo,
      contexto: { ciclo: '01', escola: 'prova', escolaNome: 'Prova' },
      calibracao: { duracaoMinutos: 45, volumeMin: 80, volumeMax: 100 },
    });
    const linhaDoExpressao = aula.split('\n').find((l) => /^\| Expressão \|/.test(l)) || '';
    provar('a Aula 01 lê a proporção nova: Expressão com 30% e os seus tempos',
      /\| Expressão \| 27 \| 30% \|/.test(linhaDoExpressao), linhaDoExpressao);

    // F: o segundo ajuste não multiplica elos
    console.log('\nF. REPETIR O AJUSTE NÃO MULTIPLICA ELOS');
    const segundo = await pedir('/api/elicitar', {
      fonte: 'plano',
      id: novoPlano,
      contexto: { escola: 'prova', professor: 'coqui', ciclo: '01', turma: 'Balé Nível 1 — Teste 3' },
      respostas: { 'objetivo-geral': r('consolidar o alinhamento — corrigido') },
    });
    provar('o segundo ajuste grava', segundo.dados && segundo.dados.gravado === true,
      segundo.dados && segundo.dados.erroDaGravacao);
    const pos2 = await ids(arm, 'po');
    provar('e nasce UM elo de PO (três no total: o primário e os dois elos)', pos2.length === 3, pos2);
    const planos2 = await ids(arm, 'plano');
    provar('e um elo de plano (três planos)', planos2.length === 3, planos2);
    provar('o vigente do PO é o último', await porta.poDoPlano(arm, novoPlano) === segundo.dados.cadeia.po.para,
      { achado: await porta.poDoPlano(arm, novoPlano), esperado: segundo.dados.cadeia.po.para });
  }

  // ---------------------------------------------------------------- E
  console.log('\nE. SEM PO, NADA SE INVENTA');
  {
    const arm = criarMemoria();
    await porta.gravarEnvelope(arm, plano('plano-20261105-0900'), relatorioDe('plano-20261105-0900'));
    const { pedir, visto } = rotasCom(arm);
    const resposta = await pedir('/api/elicitar', {
      fonte: 'plano',
      id: 'plano-20261105-0900',
      contexto: { escola: 'prova', professor: 'coqui', ciclo: '01', turma: 'Balé Nível 1 — Teste 3' },
      respostas: { 'objetivo-geral': r('outro objetivo') },
    });
    provar('o plano livre é editado em sítio (não deriva)', resposta.dados.id === 'plano-20261105-0900',
      resposta.dados.id);
    provar('e nenhum PO nasce de um plano que ninguém observa',
      (await ids(arm, 'po')).length === 0, await ids(arm, 'po'));
    provar('nem o caminho do PO é percorrido', visto.po.length === 0, visto.po);

    // O plano livre AJUSTADO com `ajuste_de` explícito: elo de plano, e continua sem PO.
    const ajustado = await pedir('/api/elicitar', {
      fonte: 'plano',
      ajuste_de: 'plano-20261105-0900',
      contexto: { escola: 'prova', professor: 'coqui', ciclo: '01', turma: 'Balé Nível 1 — Teste 3' },
      respostas: { 'objetivo-geral': r('outro objetivo, versão 2') },
    });
    provar('o ajuste explícito de um plano sem PO grava', ajustado.dados.gravado === true);
    provar('…e continua a não inventar observação',
      (await ids(arm, 'po')).length === 0 && !ajustado.dados.cadeia, ajustado.dados.cadeia);
  }

  console.log('\n' + (falhas
    ? 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'
    : 'TUDO CERTO — ' + provas + ' asserções: ajustar o plano de ensino arrasta o PO num elo novo, '
      + 'o PO passa a observar o plano vigente, o caminho até ao ciclo corre — e um plano sem '
      + 'observação continua a não ter PO.'));
  process.exit(falhas ? 1 : 0);
})().catch((erro) => {
  console.error('erro na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
