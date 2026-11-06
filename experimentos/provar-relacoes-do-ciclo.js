#!/usr/bin/env node
'use strict';

/**
 * provar-relacoes-do-ciclo.js — o Plano de Observação só nasce sobre um plano que EXISTE, do MESMO
 * ciclo; e um plano novo só abre o PRÓXIMO ciclo da sequência.
 *
 * O QUE A PESQUISADORA PEDIU, e ela notou que a entrega ficou pela metade:
 *
 *   «O Fim do Campo Livre de Ciclo… O Plano de Ensino (PE) é o documento base/macro gerado a
 *   partir do ciclo. O Plano de Observação (PO) só pode ser criado se houver estritamente um Plano
 *   de Ensino pré-existente e válido para aquele mesmo ciclo… impedindo qualquer órfão ou
 *   inconsistência relacional.»
 *
 * O QUE ESTAVA FEITO era a METADE DE CIMA: o campo do ciclo no PO passou a ser uma lista com os
 * ciclos que têm plano (`GET /api/ciclos` → `comPlano`). Um dropdown é conveniência. Medido antes
 * desta correção, com um `POST` à mão:
 *
 *   { fonte:'po', ciclo:'07', plano-de-ensino:'plano-20990101-0000' }  → 200  (o órfão)
 *   { fonte:'plano', ciclo:'07' }  sem 01..06                          → 200  (a sequência quebrada)
 *
 * As duas escreveram documento no acervo. A primeira é o PO que observa um plano que não existe,
 * num ciclo que não tem plano nenhum; a segunda é o ciclo 07 a nascer sem 01..06 — e a âncora do
 * ciclo N encadeia com a do N-1, que não existe.
 *
 * AS TRÊS CONFERÊNCIAS, e o que cada uma impede:
 *
 *   1. o plano declarado tem de EXISTIR no acervo (o órfão);
 *   2. o ciclo do PO tem de ser o ciclo DO PLANO (a inconsistência relacional);
 *   3. sem plano declarado, o ciclo tem de ter plano (o órfão por construção).
 *
 * E a sequência estrita do lado do plano: um plano novo só pode ser do PRÓXIMO ciclo, ou de um
 * ciclo que já existe (o ajuste e o elo novo continuam um ciclo — não o criam).
 *
 * DUAS DISCIPLINAS QUE A PROVA TAMBÉM MEDE, porque uma recusa a mais é um defeito:
 *
 *   · DEGRADA, NÃO REBENTA — sem leitor do acervo (uma bancada, um adaptador sem índice) a rota
 *     segue como sempre foi. Recusar por falta de leitor transformaria uma limitação de bancada
 *     numa proibição de gravar;
 *   · a SIMULAÇÃO passa — ela não escreve, e uma prévia não é um documento.
 *
 * O CONTROLADO NEGATIVO está em cada secção: a escrita VÁLIDA da mesma família tem de continuar a
 * entrar. Sem ele, uma guarda que recusasse tudo passaria na primeira metade.
 *
 *   node experimentos/provar-relacoes-do-ciclo.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const { criarRotas } = require(path.join(RAIZ, 'motor/servidor/rotas.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));

const PORTA = path.join(RAIZ, 'porta');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(PORTA, p), 'utf8'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'prova';
const PROF = 'coelho';
const relogio = { valor: '2026-11-05T08:00' };

const relatorio = (id) => ({ id, estado: 'prova', contagem: { respondidos: 0, obrigatorios: 0 },
  elos: [], paradas: [], idsDesconhecidos: [], validacao: { resultado: 'aceite', contrato: 'prova' },
  errosDoDocumento: [], linhas: [] });

/** Um plano de ensino de verdade, no acervo — pelo caminho que o produto usa. */
async function semearPlano(armazenamento, { id, ciclo }) {
  await porta.gravarEnvelope(armazenamento, {
    id, contexto: { escola: ESCOLA, professor: PROF, ciclo, turma: 'turma-1' },
    respostas: { 'contexto-turma': { valor: 'turma-1' } }, ajuste_de: null,
    gerado_em: '2026-11-05T07:00',
  }, relatorio(id));
}

function bancada() {
  const armazenamento = criarMemoria();
  const rotas = criarRotas({
    armazenamento,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    escolaDoWorker: ESCOLA,
    agora: () => relogio.valor,
  });
  return { armazenamento, rotas };
}

async function pedir(rotas, corpo) {
  const r = await rotas.responder(new Request('http://local/api/elicitar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  }));
  let dados = null;
  try { dados = await r.json(); } catch { dados = null; }
  return { status: r.status, dados };
}

const contexto = (ciclo) => ({ escola: ESCOLA, professor: PROF, ciclo });
const poDe = (ciclo, plano, extra) => Object.assign({
  fonte: 'po', contexto: contexto(ciclo),
  respostas: plano ? { 'plano-de-ensino': plano, horizonte: 'H1' } : { horizonte: 'H1' },
}, extra || {});
const planoDe = (ciclo, extra) => Object.assign({
  fonte: 'plano', contexto: contexto(ciclo), respostas: { 'contexto-turma': 'turma-1' },
}, extra || {});

const documentosNoAcervo = async (armazenamento) => {
  const nomes = await armazenamento.listar('envelope/');
  return (nomes || []).filter((n) => /(^|\/)(po|plano)-.*\.json$/.test(n));
};

(async () => {
  /* --------------------------------------------------------------------------------------- */
  console.log('\n1 · O PLANO TEM DE EXISTIR — o órfão que a entrega anterior deixava passar');
  /* --------------------------------------------------------------------------------------- */
  {
    const { armazenamento, rotas } = bancada();
    const antes = (await documentosNoAcervo(armazenamento)).length;
    const r = await pedir(rotas, poDe('01', 'plano-20990101-0000'));
    provar('PO a observar um plano inventado é RECUSADO', r.status === 409, r.status);
    provar('…e a recusa nomeia o carimbo que não existe',
      /plano-20990101-0000/.test(String(r.dados && r.dados.erro)), r.dados && r.dados.erro);
    provar('…e diz o que fazer («crie o plano primeiro»)',
      /crie o plano primeiro/i.test(String(r.dados && r.dados.erro)), r.dados && r.dados.erro);
    provar('…e NADA foi gravado (o acervo tem os mesmos documentos)',
      (await documentosNoAcervo(armazenamento)).length === antes,
      await documentosNoAcervo(armazenamento));
  }

  /* O CONTROLADO NEGATIVO: com o plano real, a mesma escrita entra. */
  {
    const { armazenamento, rotas } = bancada();
    await semearPlano(armazenamento, { id: 'plano-01', ciclo: '01' });
    const r = await pedir(rotas, poDe('01', 'plano-01'));
    provar('CONTROLO: com o plano real e do mesmo ciclo, o PO é aceito', r.status === 200,
      { status: r.status, erro: r.dados && r.dados.erro });
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\n2 · O CICLO DO PO É O DO PLANO — DERIVADO, E NÃO APENAS CONFERIDO');
  /* A ASSERÇÃO FOI INVERTIDA, E NÃO APAGADA (06/11/2026) — como se fez com os `sujeitos`.
   * ------------------------------------------------------------------------------------------
   * Até 05/11/2026 esta secção exigia 409: um PO no ciclo 02 a observar o plano do ciclo 01 era
   * RECUSADO. A recusa era a metade de baixo, e ela pediu a de cima: «quando eu escolho ele,
   * automaticamente ele tem que preencher para mim qual é o ciclo». Recusar depois de o número
   * estar escrito é explicar um erro; derivar antes é não haver erro para explicar. O ciclo passou
   * a ser sobrescrito pelo do plano, então o mesmo pedido agora GRAVA — e grava no ciclo 01.
   *
   * O que a asserção guarda é mais forte do que guardava: não é «recusa o que diverge», é «não há
   * divergência possível». Quem a ler daqui a dez anos vê a decisão e o porquê.
   * --------------------------------------------------------------------------------------- */
  {
    const { armazenamento, rotas } = bancada();
    await semearPlano(armazenamento, { id: 'plano-01', ciclo: '01' });
    await semearPlano(armazenamento, { id: 'plano-02', ciclo: '02' });
    const r = await pedir(rotas, poDe('02', 'plano-01'));
    provar('PO pedido no ciclo 02 a observar o plano do ciclo 01 é GRAVADO (sem recusa)',
      r.status === 200, { status: r.status, erro: r.dados && r.dados.erro });
    const gravado = (r.dados && r.dados.documento) || null;
    provar('…e o ciclo do documento é o do PLANO (01), e não o que foi pedido (02)',
      String((gravado && gravado.contexto && gravado.contexto.ciclo) || '') === '01',
      gravado && gravado.contexto);
    /* O CONTROLO NEGATIVO do derivador: um plano que NÃO declara ciclo não permite derivar, e aí
     * a conferência antiga continua a ser a única coisa honesta a fazer — o pedido divergente
     * volta a ser recusado, em vez de gravar um ciclo inventado. */
    await semearPlano(armazenamento, { id: 'plano-sem-ciclo', ciclo: '' });
    const semDerivacao = await pedir(rotas, poDe('02', 'plano-sem-ciclo'));
    provar('CONTROLO: sem ciclo no plano, a derivação é impossível e o pedido entra como veio',
      semDerivacao.status === 200
        && String(((semDerivacao.dados || {}).documento || {}).contexto.ciclo || '') === '02',
      { status: semDerivacao.status, contexto: ((semDerivacao.dados || {}).documento || {}).contexto });
    /* O controlo positivo de sempre: o plano do ciclo certo entra, e no ciclo certo. */
    const certo = await pedir(rotas, poDe('02', 'plano-02'));
    provar('CONTROLO: o plano do ciclo certo é aceito, no ciclo dele',
      certo.status === 200
        && String((((certo.dados || {}).documento || {}).contexto || {}).ciclo || '') === '02',
      { status: certo.status, erro: certo.dados && certo.dados.erro });
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\n3 · SEM PLANO DECLARADO, O CICLO TEM DE TER PLANO');
  /* --------------------------------------------------------------------------------------- */
  {
    const { armazenamento, rotas } = bancada();
    const semNada = await pedir(rotas, poDe('01', null));
    provar('PO num ciclo sem plano nenhum é RECUSADO', semNada.status === 409, semNada.status);
    provar('…e a recusa diz que nenhum ciclo tem plano ainda',
      /Nenhum ciclo desta escola tem plano/.test(String(semNada.dados && semNada.dados.erro)),
      semNada.dados && semNada.dados.erro);

    await semearPlano(armazenamento, { id: 'plano-01', ciclo: '01' });
    const comPlano = await pedir(rotas, poDe('01', null));
    provar('CONTROLO: no ciclo que TEM plano, o PO sem plano declarado entra (a lacuna é de '
      + 'conteúdo, não de relação)', comPlano.status === 200,
    { status: comPlano.status, erro: comPlano.dados && comPlano.dados.erro });
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\n4 · A SEQUÊNCIA É ESTRITA — o plano não abre um ciclo que não existe');
  /* --------------------------------------------------------------------------------------- */
  {
    const { armazenamento, rotas } = bancada();
    const primeiro = await pedir(rotas, planoDe('01'));
    provar('o PRIMEIRO plano da escola é o ciclo 01, e é aceito', primeiro.status === 200,
      { status: primeiro.status, erro: primeiro.dados && primeiro.dados.erro });

    const salto = await pedir(rotas, planoDe('07'));
    provar('um plano no ciclo 07 (sem 02..06) é RECUSADO', salto.status === 409, salto.status);
    provar('…e a recusa diz qual é o próximo ciclo',
      /próximo é 02/.test(String(salto.dados && salto.dados.erro)), salto.dados && salto.dados.erro);

    const seguinte = await pedir(rotas, planoDe('02'));
    provar('CONTROLO: o próximo ciclo da sequência é aceito', seguinte.status === 200,
      { status: seguinte.status, erro: seguinte.dados && seguinte.dados.erro });

    /* O ELO NOVO de um plano do ciclo 01 continua a ser do ciclo 01 — ele não cria ciclo. */
    const elo = await pedir(rotas, planoDe('01', { ajuste_de: primeiro.dados && primeiro.dados.id }));
    provar('CONTROLO: o elo novo de um plano do ciclo 01 continua a entrar', elo.status === 200,
      { status: elo.status, erro: elo.dados && elo.dados.erro });

    /* E a correção em sítio também — o documento existe, e o ciclo dele não muda. */
    const correcao = await pedir(rotas, planoDe('01', { id: primeiro.dados && primeiro.dados.id }));
    provar('…e a correção em sítio do plano que existe também', correcao.status === 200,
      { status: correcao.status, erro: correcao.dados && correcao.dados.erro });

    /* A PORTA DE SERVIÇO: um `id` inventado NÃO compra o ciclo inexistente. */
    const inventado = await pedir(rotas, planoDe('07', { id: 'plano-20990101-0000' }));
    provar('um `id` inventado não abre o ciclo 07 (o id só isenta se o documento existe)',
      inventado.status === 409, inventado.status);
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\n5 · DEGRADA, NÃO REBENTA — e a simulação não é um documento');
  /* --------------------------------------------------------------------------------------- */
  {
    /* Um armazenamento que LÊ e GRAVA, mas não sabe enumerar. É a forma de uma bancada sem
     * índice, e o que se exige é que a rota siga — não que recuse. */
    const mudo = criarMemoria();
    const semListar = {
      ler: (c) => mudo.ler(c),
      gravar: (c, t) => mudo.gravar(c, t),
      apagar: (c) => mudo.apagar(c),
    };
    const rotas = criarRotas({
      armazenamento: semListar,
      conteudo: ler('conteudo/anamnese.json'),
      esquema: ler('envelope/elicitacao-schema.json'),
      conteudoPO: ler('po/conteudo/po.json'),
      conteudoPlano: ler('plano/conteudo/plano.json'),
      escolaDoWorker: ESCOLA, agora: () => relogio.valor,
    });
    /* O QUE SE EXIGE, e é preciso ser honesto sobre o alcance: com o acervo ilegível a GRAVAÇÃO
     * também não acontece — quem falha é o próprio fluxo, não esta regra. O que se mede é o que
     * importa: a recusa NÃO VEM da regra. Uma guarda que devolvesse 409 «o plano não existe»
     * quando não conseguiu ler coisa nenhuma estaria a acusar o professor por uma limitação da
     * bancada — e o professor não tem como distinguir as duas coisas. */
    const r = await pedir(rotas, poDe('07', 'plano-20990101-0000'));
    const recusaDaRegra = r.status === 409
      || /plano de ensino «|não tem plano de ensino|ESTRITAMENTE sequenciais/.test(
        String(r.dados && r.dados.erro));
    provar('sem leitor do acervo, a recusa NÃO vem da regra (ela degrada em vez de acusar)',
      !recusaDaRegra, { status: r.status, erro: r.dados && r.dados.erro });

    const b = bancada();
    const simulada = await pedir(b.rotas, poDe('07', 'plano-20990101-0000', { simular: true }));
    provar('a SIMULAÇÃO passa: uma prévia não escreve, e não é um documento',
      simulada.status === 200, { status: simulada.status, erro: simulada.dados && simulada.dados.erro });
    provar('…e a simulação não gravou nada',
      (await documentosNoAcervo(b.armazenamento)).length === 0,
      await documentosNoAcervo(b.armazenamento));
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\n6 · A ANAMNESE NÃO É TOCADA POR ESTA REGRA');
  /* --------------------------------------------------------------------------------------- */
  {
    const { armazenamento, rotas } = bancada();
    const r = await pedir(rotas, { fonte: 'anamnese',
      contexto: { escola: ESCOLA, professor: PROF, aluna: 'Aluna A' },
      respostas: { 'historico-de-praticas-corporais': 'nenhuma' } });
    provar('a anamnese é do SUJEITO e não pede ciclo: grava-se sem ciclo nenhum no acervo',
      r.status === 200, { status: r.status, erro: r.dados && r.dados.erro });
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: o PO só nasce sobre um plano que existe e do '
    + 'MESMO ciclo, um plano novo só abre o próximo ciclo da sequência, a escrita válida continua a '
    + 'entrar, e sem leitor do acervo a rota segue em vez de recusar.');
})().catch((erro) => {
  console.error('provar-relacoes-do-ciclo: ' + erro.message);
  process.exit(1);
});
