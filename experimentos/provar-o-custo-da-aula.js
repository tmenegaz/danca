#!/usr/bin/env node
'use strict';

/**
 * provar-o-custo-da-aula.js — QUANTOS DISPAROS UMA AULA PROVOCA (19/11/2026).
 *
 * A PERGUNTA, e ela é de dinheiro. A auditoria dos workflows (`PLANEJAMENTO-LASTRO.md` §L9f,
 * 17/11/2026) fixou que **uma aula custa um minuto facturado** — e é essa unidade que a franquia
 * comercial usa (100 / 300 / 800 aulas por mês). O §L9f mediu, na linha «lançar uma aula», **uma**
 * execução: o `Fechar os derivados`, 14 s, 1 min.
 *
 * Mas o `POST /api/receber` tem um `depois` que pede a geração — está escrito e comentado em
 * `motor/servidor/rotas.js` (06/11/2026): «o `depois` pede a geração — porque o pacote publicado só
 * muda quando ela corre». Se esse disparo acontece **em cada lançamento**, a aula custa **três**
 * minutos e não um: 1 do `derivados` + 2 do `Gerar o ciclo`.
 *
 * **A diferença é de um factor de 3 na capacidade** — 1 478 aulas/mês passariam a ~493 — e é isso
 * que justifica esta prova existir. Não se decide por leitura de código: conta-se o disparo.
 *
 * O QUE SE MEDE:
 *
 *   §A o lançamento que corre pede a geração — **uma** vez, com o contexto do acto (escola,
 *      professor, ciclo, variante);
 *   §B o CONTRAFACTUAL, para a asserção não passar por acidente: sem `lancamentoSeguro` o `depois`
 *      não existe, e sem `disparar` não há disparo nenhum. É a diferença entre «não dispara» e
 *      «a bancada não estava a medir o disparo»;
 *   §C o número do §L9f, escrito e datado, para a correcção poder ser lida contra o que estava dito.
 *
 * O que esta prova NÃO mede: os minutos. Mede **disparos** — e a multiplicação pelos minutos de cada
 * workflow (medidos na API, `CUSTO-DOS-FLUXOS.md` §2) é aritmética.
 *
 *   node experimentos/provar-o-custo-da-aula.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const { criarRotas } = require(path.join(RAIZ, 'motor/servidor/rotas.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const PORTA = path.join(RAIZ, 'porta');
const ler = (rel) => JSON.parse(require('fs').readFileSync(path.join(PORTA, rel), 'utf8'));
const ESCOLA = 'breu';

/** A bancada mínima: as rotas com a porta do lançamento aberta e o disparo ESPIADO. */
function bancada({ comLancamento = true, comDisparador = true } = {}) {
  const disparos = [];
  const rotas = criarRotas({
    armazenamento: criarMemoria(),
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    escolaDoWorker: ESCOLA,
    ...(comLancamento ? { lancamentoSeguro: { autorizar: async () => true, cifrar: null } } : {}),
    ...(comDisparador ? { disparar: async (c) => { disparos.push(c); return { ok: true }; } } : {}),
  });
  return { rotas, disparos };
}

const LANCADO = {
  senha: 'aceita-pela-bancada',
  ciclo: '01',
  arquivos: [
    {
      nome: 'ciclo-01-breu-rosa-dados-2026-11-19T2030.json',
      texto: JSON.stringify({
        escola: ESCOLA, professor: 'demi-plie', aulas: [{ n: '01', presente: true }],
      }),
    },
    { nome: 'ciclos.json', texto: JSON.stringify({ ciclos: [{ id: '01', escola: ESCOLA }] }) },
  ],
};

async function lancar(rotas, corpo) {
  const resposta = await rotas.responder(new Request('http://local/api/receber', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo || LANCADO),
  }));
  const texto = await resposta.text();
  let dados = null;
  try { dados = JSON.parse(texto); } catch { dados = texto; }
  return { status: resposta.status, dados };
}

async function principal() {
  /* =========================================================================================== */
  console.log('\nA. Um lançamento que corre — quantas gerações pede');

  const a = bancada();
  const r = await lancar(a.rotas);
  provar('o lançamento responde ok', Boolean(r.dados) && r.dados.ok === true,
    r.dados && (r.dados.erro || r.status));

  /* O NÚMERO QUE VALE DINHEIRO. Um lançamento, um disparo. Se for 0, a aula custa 1 min (o §L9f
   * está certo); se for 1, custa 3 (o §L9f está desactualizado desde 06/11/2026, quando o disparo
   * entrou). Não há terceira resposta possível. */
  provar('o lançamento pede a geração UMA vez', a.disparos.length === 1, a.disparos.length);
  const ctx = a.disparos[0] || {};
  provar('…com o contexto do ato — a escola', ctx.escola === ESCOLA, ctx.escola);
  provar('…o professor', Boolean(ctx.professor), ctx.professor);
  provar('…o ciclo', String(ctx.ciclo || '') === '01', ctx.ciclo);
  provar('…e a variante da Turma, para a geração saber que pacote é', Boolean(ctx.variante),
    ctx.variante);

  /* =========================================================================================== */
  console.log('\nB. Os dois contra-factuais — senão a asserção passa por acidente');

  /* SEM `disparar` no adaptador: o Worker devolve o que aconteceu e diz que nenhum disparo foi
   * feito (`saida.disparo` fica por escrever). É o caso de um Worker sem `GITHUB_TOKEN`. */
  const semToken = bancada({ comDisparador: false });
  const r2 = await lancar(semToken.rotas);
  provar('sem disparador, o lançamento continua a valer — a gravação não depende dele',
    Boolean(r2.dados) && r2.dados.ok === true, r2.dados && (r2.dados.erro || r2.status));
  provar('…e nenhum disparo é contado — o espião não inventa',
    semToken.disparos.length === 0, semToken.disparos.length);

  /* SEM a porta do lançamento: o `depois` não existe, e é a prova de que é ele que dispara (e não
   * outro sítio qualquer da rota). */
  const semPorta = bancada({ comLancamento: false });
  const r3 = await lancar(semPorta.rotas);
  provar('sem `lancamentoSeguro`, o pedido não é aceite — e nada é disparado',
    semPorta.disparos.length === 0, { status: r3.status, disparos: semPorta.disparos.length });

  /* =========================================================================================== */
  console.log('\nC. A conta, com os minutos medidos — e o que ela corrige');

  /* Os minutos por workflow são os MEDIDOS na API (`CUSTO-DOS-FLUXOS.md` §2): um job, arredondado
   * ao minuto. O que esta prova junta é a única parte que faltava: quantas execuções o gesto pede. */
  const MIN_DERIVADOS = 1;
  const MIN_GERAR = 2;
  const porAula = a.disparos.length * MIN_GERAR + MIN_DERIVADOS;
  provar('uma aula custa 3 minutos facturados: 1 do `derivados` + 2 do `Gerar o ciclo`',
    porAula === 3, porAula);

  /* A CAPACIDADE, pela fórmula do §L9f (`(2 000 − engenharia) ÷ minutos por aula`), com a única
   * constante que muda: 522 min de engenharia, e a aula a 3 min em vez de 1. */
  const capacidade = Math.floor((2000 - 522) / porAula);
  provar('a capacidade cai de 1 478 para 492 aulas/mês — um factor de 3', capacidade === 492, capacidade);
  provar('…e a franquia do Avançado (800 aulas) deixa de caber sozinha na cota gratuita',
    800 * porAula > (2000 - 522), 800 * porAula);

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: um lançamento de aula pede UMA geração, com o contexto '
      + 'do ato; sem disparador ou sem a porta do lançamento o disparo não acontece (e é isso que '
      + 'mostra que é ali que ele nasce); e a aula custa 3 minutos facturados, não 1 — o que reduz a '
      + 'capacidade da cota gratuita de 1 478 para 492 aulas/mês.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
