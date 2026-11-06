#!/usr/bin/env node
'use strict';

/**
 * provar-etiqueta-da-aluna.js — a listagem da anamnese diz a TURMA e a LINHA DE BASE da aluna.
 *
 * O DEFEITO (05/11/2026), nas palavras da pesquisadora: «essa aluna A e aluna B, ambas eu já fiz
 * a linha de base delas e já as coloquei na turma. Então precisa ser ajustado também. E ela já não
 * é mais nova, porque eu já fiz a linha de base dela.»
 *
 * O ECRÃ DIZIA: selo «nova» e «aluna nova — sem turma» para as duas. E dizia a verdade sobre o
 * DADO QUE LIA: `turmaDaAluna` perguntava a turma à CURADORIA, e a curadoria do `calango` está
 * VAZIA. O elenco de uma turma, desde o passo 5 da linha de base, é declarado pela linha de base —
 * «estas alunas, com este recorte, foram para esta turma neste dia» —, e a curadoria ficou com a
 * atribuição (que professor, que turma). Duas fontes, e a listagem lia a que já não é a dona.
 *
 * O QUE ESTA PROVA MEDE, e por que cada asserção é necessária:
 *
 *   A. A DERIVAÇÃO (`filiacaoDasAlunas`). A linha de base MAIS RECENTE dá o nome; a mais recente
 *      já ENVIADA dá a turma. Um rascunho conta para «tem linha de base» — a aluna deixa de ser
 *      «nova» quando a linha existe — mas não dá turma: quem a dá é o passo 5.
 *   B. A TURMA (prioridade). A linha de base vence a curadoria; sem linha de base, a curadoria
 *      responde. Um controle negativo em cada sentido, senão a prova passaria com uma delas
 *      simplesmente ignorada.
 *   C. A PÁGINA. Os três estados da etiqueta, renderizados: turma + linha de base; só linha de
 *      base (rascunho); e nenhuma das duas (a aluna nova de verdade). O selo acompanha.
 *
 * SEM REDE, SEM NAVEGADOR e SEM KV A SÉRIO: um KV em memória, e a página é a de
 * `listas-do-acervo.js`, chamada como a ponte a chama.
 *
 *   node experimentos/provar-etiqueta-da-aluna.js
 */

const path = require('path');

const raiz = path.resolve(__dirname, '..');
const porta = require(path.join(raiz, 'motor/nucleo/porta.js'));
const linhaDeBase = require(path.join(raiz, 'motor/nucleo/linha-de-base.js'));
const producao = require(path.join(raiz, 'motor/servidor/producao.js'));
const listasDoAcervo = require(path.join(raiz, 'motor/servidor/listas-do-acervo.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'calango';

/** Um KV em memória, com a forma que o `criarArmazenamento` usa. */
function kvDeMentira() {
  const dados = new Map();
  return {
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); },
    async delete(chave) { dados.delete(chave); },
    async list(op) {
      const prefixo = (op && op.prefix) || '';
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefixo)).map((name) => ({ name })),
        list_complete: true,
      };
    },
    _dados: dados,
  };
}

/** O relatório mínimo que o `gravarEnvelope` exige. */
function relatorioDe(id) {
  return {
    id,
    estado: 'Input_anamnese_construida',
    contagem: { respondidos: 0, obrigatorios: 0 },
    elos: [],
    paradas: [],
    idsDesconhecidos: [],
    validacao: { resultado: 'aceite', contrato: 'prova' },
    errosDoDocumento: [],
    linhas: [],
  };
}

/*
 * AS LINHAS DE BASE DO CASO REAL. `teste` é a que existe em produção (enviada a 05/11/2026 para
 * «Balé Nível 1 — Teste 1»); `rascunho` é uma linha de base SEM envio, e existe para separar as
 * duas coisas que a etiqueta tem de distinguir: ter linha de base, e estar numa turma.
 */
const DA_PRODUCAO = [
  {
    id: 'teste', nome: 'teste', professor: 'tiago-menegaz',
    turma: 'Balé Nível 1 — Teste 1', enviada_em: '2026-11-05T23:55:43.186Z',
    alunas: ['Aluna A', 'Aluna B'], campos: [{ id: 'formato-anatomico-dos-joelhos' }],
  },
  {
    id: 'rascunho-de-novembro', nome: 'rascunho de novembro', professor: 'tiago-menegaz',
    alunas: ['Aluna C'], campos: [],
  },
];

/** A página da anamnese, com as três alunas semeadas e as linhas de base dadas. */
async function paginaDasAnamnese(linhasDeBase_) {
  const kv = kvDeMentira();
  const env = { ESCOLA_SLUG: ESCOLA, PADD_KV: kv };
  const arm = producao.__armazenamento(env);
  for (const [id, aluna, em] of [
    ['anamnese-20261105a', 'Aluna A', '2026-11-05T10:00'],
    ['anamnese-20261105b', 'Aluna B', '2026-11-05T11:00'],
    ['anamnese-20261105c', 'Aluna C', '2026-11-05T12:00'],
  ]) {
    const doc = {
      id,
      contexto: { escola: ESCOLA, professor: 'tiago-menegaz', ciclo: '01', aluna },
      respostas: {},
      gerado_em: em,
    };
    await porta.gravarEnvelope(arm, doc, relatorioDe(id));
  }
  const pagina = await listasDoAcervo.pagina('/area-do-professor/anamnese/', {
    env, menu: null, escola: ESCOLA, curadorias: [], linhasDeBase: linhasDeBase_,
  });
  const cartoes = (pagina.html.match(/<li class="trio-plano"[\s\S]*?<\/li>/g) || []);
  const porNome = new Map();
  for (const c of cartoes) {
    const nome = (((/<b>([\s\S]*?)<\/b>/.exec(c) || [])[1]) || '').replace(/<[^>]+>/g, '').trim();
    const selo = (/<span class="selo [^"]*">([^<]*)<\/span>/.exec(c) || [])[1] || '';
    const contexto = (/<div class="trio-dono">([^<]*)<\/div>/.exec(c) || [])[1] || '';
    const turma = (/<span class="trio-k">Turma<\/span><span class="trio-v">([^<]*)<\/span>/.exec(c) || [])[1] || '';
    const daLinha = (/<span class="trio-k">Linha de base<\/span><span class="trio-v">([^<]*)<\/span>/.exec(c) || [])[1] || '';
    porNome.set(nome, { selo, contexto, turma, daLinha, html: c });
  }
  return porNome;
}

(async () => {
  console.log('\nA · A derivação: a linha de base mais recente dá o nome, a enviada dá a turma');
  {
    const f = linhaDeBase.filiacaoDasAlunas(DA_PRODUCAO);
    provar('a Aluna A pertence a «teste», e a turma é a do envio',
      f.has('Aluna A') && f.get('Aluna A').nome === 'teste'
        && f.get('Aluna A').turma === 'Balé Nível 1 — Teste 1', f.get('Aluna A'));
    provar('a data do envio é lida — o vínculo é um facto datado',
      f.get('Aluna A').em === '2026-11-05T23:55:43.186Z', f.get('Aluna A').em);
    provar('a Aluna C tem linha de base e NÃO tem turma — o rascunho não declara elenco',
      f.has('Aluna C') && f.get('Aluna C').nome === 'rascunho de novembro'
        && f.get('Aluna C').turma === '', f.get('Aluna C'));
    provar('quem não está em linha de base nenhuma não aparece',
      !f.has('Aluna D') && !f.has(''), [...f.keys()]);
    provar('`alunasComLinhaDeBase` devolve exactamente quem tem',
      linhaDeBase.alunasComLinhaDeBase(DA_PRODUCAO).sort().join('|') === 'Aluna A|Aluna B|Aluna C',
      linhaDeBase.alunasComLinhaDeBase(DA_PRODUCAO));

    /* O RASCUNHO É MAIS RECENTE DO QUE O ENVIO. O nome tem de ser o dele, e a turma a do envio:
     * misturar os dois faria a etiqueta dizer «linha de base «rascunho» — turma Balé Nível 1». */
    const misturadas = [
      { id: 'envio', nome: 'a que foi enviada', turma: 'Turma X', enviada_em: '2026-11-01T10:00', alunas: ['Aluna E'], campos: [{ id: 'x' }] },
      { id: 'rasc', nome: 'a mais recente', atualizada_em: '2026-11-04T10:00', alunas: ['Aluna E'], campos: [] },
    ];
    const g = linhaDeBase.filiacaoDasAlunas(misturadas);
    provar('CONTROLE: com um rascunho mais recente, o NOME é o dele e a TURMA é a do envio',
      g.get('Aluna E').nome === 'a mais recente' && g.get('Aluna E').turma === 'Turma X',
      g.get('Aluna E'));
    provar('e as duas linhas ficam registadas, da mais recente para a mais antiga',
      g.get('Aluna E').linhas.map((l) => l.id).join('|') === 'rasc|envio',
      g.get('Aluna E').linhas.map((l) => l.id));
    provar('CONTROLE NEGATIVO: sem linhas, a filiação é vazia — não inventa ninguém',
      linhaDeBase.filiacaoDasAlunas([]).size === 0
        && linhaDeBase.filiacaoDasAlunas(undefined).size === 0);
  }

  console.log('\nB · A página: a turma, a etiqueta da linha de base, e o selo');
  {
    const daProducao = await paginaDasAnamnese(DA_PRODUCAO);

    const a = daProducao.get('Aluna A') || {};
    provar('a Aluna A (linha de base enviada) diz a turma E a linha de base',
      a.contexto === 'turma Balé Nível 1 — Teste 1 · linha de base «teste»', a.contexto);
    provar('…a caixa «Turma» mostra a turma, e não «sem turma»',
      a.turma === 'Balé Nível 1 — Teste 1', a.turma);
    provar('…e o painel diz de que linha de base ela é',
      a.daLinha === 'teste', a.daLinha);
    /* O SELO É O QUE ELA LEU ERRADO. «nova» quer dizer «ainda não entrevistada» — e uma aluna com
     * linha de base já foi entrevistada, lida e enviada. */
    provar('…e o selo NÃO é «nova»: ela já tem linha de base', a.selo === 'livre', a.selo);

    const c = daProducao.get('Aluna C') || {};
    provar('a Aluna C (só rascunho) diz a linha de base e que ainda não tem turma',
      c.contexto === 'linha de base «rascunho de novembro» — ainda sem turma', c.contexto);
    provar('…a caixa diz «sem turma», e o painel nomeia a linha de base',
      c.turma === 'sem turma' && c.daLinha === 'rascunho de novembro', [c.turma, c.daLinha]);
    provar('…e também não é «nova»: ter linha de base basta para deixar de o ser',
      c.selo === 'livre', c.selo);

    /* O CONTROLE DA ALUNA NOVA, e ele é o que impede a correcção de apagar o estado: sem turma e
     * sem linha de base, «nova» tem de continuar a aparecer — é o aviso de quem falta entrevistar. */
    const semNada = await paginaDasAnamnese([]);
    const a2 = semNada.get('Aluna A') || {};
    provar('CONTROLE: sem linha de base e sem curadoria, a aluna é «nova» outra vez',
      a2.selo === 'nova' && a2.contexto === 'aluna nova — sem turma e sem linha de base',
      [a2.selo, a2.contexto]);
    provar('…e a caixa diz «nenhuma» linha de base, em vez de inventar uma',
      a2.daLinha === 'nenhuma', a2.daLinha);
    provar('CONTROLE: a mesma página, com linhas de base, muda as três linhas',
      [...semNada.values()].every((x) => x.selo === 'nova')
        && [...daProducao.values()].every((x) => x.selo === 'livre'),
      { sem: [...semNada.values()].map((x) => x.selo), com: [...daProducao.values()].map((x) => x.selo) });
  }

  console.log('\nC · A curadoria continua a valer quando não há linha de base (recurso declarado)');
  {
    const mapa = listasDoAcervo.turmasDasAlunas(
      [{ professor: 'p', turmas: ['Turma da Curadoria'], alunas: ['Aluna F'] }], []);
    provar('sem linha de base, a turma vem da curadoria', mapa.get('Aluna F') === 'Turma da Curadoria',
      mapa.get('Aluna F'));
    const mapa2 = listasDoAcervo.turmasDasAlunas(
      [{ professor: 'p', turmas: ['Turma da Curadoria'], alunas: ['Aluna F'] }],
      [{ id: 'lb', nome: 'lb', turma: 'Turma da Linha de Base', enviada_em: '2026-11-05T00:00', alunas: ['Aluna F'], campos: [{ id: 'x' }] }]);
    provar('com as duas, a linha de base vence — é o registo do acto', mapa2.get('Aluna F') === 'Turma da Linha de Base',
      mapa2.get('Aluna F'));
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('\nERRO na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
