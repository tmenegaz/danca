#!/usr/bin/env node
'use strict';

/**
 * provar-o-financeiro-que-fica.js — a escola sai, a conta dela fica (23/11/2026, à tarde).
 *
 * O QUE ELA DISSE, e é a regra inteira: «O que não pode sair é a parte financeira. Tem que manter
 * que ela é uma escola que tem um histórico de pagamentos e de ações. […] A parte financeira não
 * pode expurgar, ela fica para histórico. E aí a gente diz numa linha seguinte que essa escola foi
 * expurgada.»
 *
 * E O QUE ELA VIU, e é o defeito: «Eu acessei o financeiro agora e ele não tem nada lá mais. E não
 * pode isso.»
 *
 * A REGRA ANTERIOR ERA O CONTRÁRIO — «quando você expurgar [a escola] essa vez, essa parte toda de
 * pagamento e financeiro […] tem que deixar de existir» (17/11/2026) — e a implementação chegou a
 * apagar as 7 linhas da `breu` do livro. A decisão de hoje desfaz isso, e a fronteira é precisa: o
 * que se apaga é o dado que SERVE a escola (contrato, senhas, alunas, documentos, endereço); o que
 * fica é a linha do livro — mês, valor, quando, por quem, em que plano.
 *
 * O QUE SE MEDE, e cada grupo é uma camada diferente:
 *
 *   A. A LINHA DO TEMPO SEM CONTRATO. Uma escola expurgada perde o registo comercial, e contar os
 *      meses a partir da adesão deixaria o extrato dela VAZIO — que é o que ela viu. Sem contrato,
 *      os meses são os que ela PAGOU, tirados do livro.
 *   B. A FRONTEIRA DO EXPURGO, no livro: `breu` e `breu-rosa` são escolas diferentes, e a igualdade
 *      do slug é o que as separa. Nada de prefixo na leitura.
 *   C. O EXTRATO. A expurgada COM histórico entra, e leva a marca e a data; a expurgada SEM
 *      histórico fica de fora (uma linha vazia com o nome de uma escola que já não existe é ruído);
 *      a viva continua a entrar sem marca.
 *   D. O CARTÃO. A conta dela diz que foi expurgada, com a data, e não oferece NENHUMA acção de
 *      cobrança — nem «Marcar pago», nem «Informar um pagamento», nem o ensaio, nem o contrato.
 *      Uma viva continua a ter as quatro.
 *   E. A FUNÇÃO QUE APAGAVA O LIVRO NÃO EXISTE MAIS. Um caminho de escrita sem chamador é código
 *      morto que parece vivo — e este apagava história.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` carrega o `motor/` daquele commit e corre as mesmas asserções.
 * Lá os meses sem contrato são zero (o extrato da expurgada fica vazio) e o cartão oferece as
 * acções de cobrança sobre uma escola morta.
 *
 *   node experimentos/provar-o-financeiro-que-fica.js
 *   node experimentos/provar-o-financeiro-que-fica.js --contra=838938c2
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const CONTRA = (process.argv.find((x) => x.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let RAIZ_DO_MOTOR = RAIZ;
let TEMPORARIO = null;
if (CONTRA) {
  TEMPORARIO = fs.mkdtempSync(path.join(os.tmpdir(), 'financeiro-'));
  execSync('git archive ' + CONTRA + ' motor modelo biblioteca tools porta | tar -x -C ' + TEMPORARIO,
    { cwd: RAIZ, stdio: 'pipe' });
  RAIZ_DO_MOTOR = TEMPORARIO;
}
const mensalidades = require(path.join(RAIZ_DO_MOTOR, 'motor/nucleo/mensalidades.js'));
const painel = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/painel-html.js'));
const raiz = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/raiz.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 330)));
}

/** O KV de bolso, com a forma que o livro, o comercial e o ensaio usam. */
function kvDeBolso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) { dados.set(c, String(v)); },
    async delete(c) { dados.delete(c); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
  };
}

const LIVRO = 'financeiro/mensalidades';
const linha = (escola, mes, valorCentavos) => ({
  escola, mes, status: 'pago', valorCentavos,
  plano: 'avancado', planoNome: 'Avançado', em: mes + '-17T19:47:31.649Z', por: 'proprietario',
});

/* O QUE A `breu` DEIXOU NO LIVRO, medido em produção antes de ela ser expurgada: sete meses pagos,
 * de 2026-11 a 2027-05. Valores de dois planos, porque houve um downgrade no meio — a história do
 * dinheiro é assim mesmo, e o extrato tem de a mostrar por inteiro. */
const HISTORICO = [
  linha('breu', '2026-11', 23990),
  linha('breu', '2026-12', 15990),
  linha('breu', '2027-01', 15990),
  linha('breu', '2027-02', 15990),
  linha('breu', '2027-03', 15990),
  linha('breu', '2027-04', 15990),
  linha('breu', '2027-05', 15990),
];
const AGORA = '2027-06-10T12:00:00.000Z';

const ESCOLA_EXPURGADA = {
  slug: 'breu', nome: 'Breu', professor: 'demi-plie', professores: ['demi-plie'],
  criada_em: '2026-11-17T00:41:45.598067+00:00',
  expurgada: true, expurgada_em: '2026-11-23T01:00:53.940Z', expurgos: 14,
};
const ESCOLA_VIVA = {
  slug: 'calango', nome: 'Calango', professor: 'demi-plie', professores: ['demi-plie'],
  criada_em: '2026-11-20T00:00:00.000Z', expurgada: false,
};
const ESCOLA_EXPURGADA_SEM_HISTORICO = {
  slug: 'duo', nome: 'Duo', professor: 'fernando-franciose', professores: ['fernando-franciose'],
  criada_em: '2026-11-16T12:25:10.000Z',
  expurgada: true, expurgada_em: '2026-11-16T13:56:53.000Z', expurgos: 1,
};

(async () => {
  console.log('A. A LINHA DO TEMPO SEM CONTRATO — os meses vêm do livro, não de uma adesão');
  const pagamentos = Object.fromEntries(HISTORICO.filter((l) => l.escola === 'breu').map((l) => [l.mes, l]));

  const semContrato = mensalidades.situacaoDaEscola({
    escola: 'breu', contrato: null, livro: HISTORICO, agora: AGORA,
  });
  provar('A1. uma escola sem contrato tem os SETE meses que pagou (era zero)',
    semContrato.meses.length === 7, semContrato.meses.map((m) => m.mes));
  provar('A1. …todos eles pagos, e nenhum em aberto',
    semContrato.meses.every((m) => m.status === 'pago') && semContrato.emAberto.length === 0,
    semContrato.emAberto);
  const maisRecente = semContrato.meses[0] || {};
  const maisAntigo = semContrato.meses[semContrato.meses.length - 1] || {};
  provar('A1. …do mais recente para o mais antigo, como se lê um extrato',
    maisRecente.mes === '2027-05' && maisAntigo.mes === '2026-11',
    semContrato.meses.map((m) => m.mes));
  provar('A1. …com o valor que foi PAGO em cada mês, e não o de um contrato que já não existe',
    maisAntigo.valorPagoCentavos === 23990 && maisRecente.valorPagoCentavos === 15990,
    [maisAntigo.valorPagoCentavos, maisRecente.valorPagoCentavos]);
  provar('A1. …e o plano de cada mês, como estava na altura',
    maisAntigo.planoNome === 'Avançado', maisAntigo.planoNome);
  provar('A1. sem contrato, não se inventa um valor a cobrar hoje',
    semContrato.valorCentavos === 0, semContrato.valorCentavos);
  provar('A1. sem contrato e sem livro, continua vazio — não se inventa história',
    mensalidades.situacaoDaEscola({ escola: 'breu', contrato: null, livro: [], agora: AGORA }).meses.length === 0);

  /* A ESCOLA VIVA NÃO MUDOU: com contrato, a linha do tempo continua a nascer da adesão e os meses
   * em aberto continuam a existir. É o controle que impede a correcção de transformar todo o
   * extrato do parque no livro. */
  const comContrato = mensalidades.situacaoDaEscola({
    escola: 'calango',
    contrato: { escola: 'calango', plano: 'basico', valorCentavos: 7990, criadoEm: '2026-11-20T00:00:00.000Z' },
    livro: [], agora: '2026-12-21T12:00:00.000Z',
  });
  provar('A2. a escola COM contrato continua a contar os meses desde a adesão (novembro e dezembro)',
    comContrato.meses.length === 2, comContrato.meses.map((m) => m.mes));
  provar('A2. …e a linha do contrato em vigor continua a sair',
    comContrato.valorCentavos === 7990, comContrato.valorCentavos);

  console.log('');
  console.log('B. A FRONTEIRA DO LIVRO — igualdade do slug, nunca prefixo');
  const vizinha = mensalidades.situacaoDaEscola({
    escola: 'breu-rosa', contrato: null,
    livro: HISTORICO.concat([linha('breu-rosa', '2026-11', 5000)]), agora: AGORA,
  });
  provar('B1. `breu-rosa` só vê os meses DELA (um), e não os sete da `breu`',
    vizinha.meses.length === 1 && (vizinha.meses[0] || {}).mes === '2026-11',
    vizinha.meses.map((m) => m.mes));
  provar('B1. …e o valor é o dela', (vizinha.meses[0] || {}).valorPagoCentavos === 5000,
    (vizinha.meses[0] || {}).valorPagoCentavos);

  console.log('');
  console.log('C. O EXTRATO — quem entra, com que marca, e quem fica de fora');
  const kv = kvDeBolso({
    [LIVRO]: JSON.stringify({ lista: HISTORICO.concat([linha('breu-rosa', '2026-11', 5000)]), atualizadoEm: 'x' }),
    'bastidores/calango/comercial': JSON.stringify({
      escola: 'calango', estado: 'ativa', plano: 'basico', valorCentavos: 7990,
      criadoEm: '2026-11-20T00:00:00.000Z',
    }),
  });
  const extrato = await raiz.extratoDasEscolas({
    env: { PADD_KV: kv },
    escolas: [ESCOLA_EXPURGADA, ESCOLA_VIVA, ESCOLA_EXPURGADA_SEM_HISTORICO],
    agora: AGORA,
  });
  const daBreu = extrato.find((e) => e.escola === 'breu');
  const doDuo = extrato.find((e) => e.escola === 'duo');
  const doCalango = extrato.find((e) => e.escola === 'calango');

  provar('C1. a expurgada COM histórico entra no extrato', Boolean(daBreu), extrato.map((e) => e.escola));
  provar('C1. …com a marca do expurgo e a data', daBreu && daBreu.expurgada === true
    && daBreu.expurgadaEm === '2026-11-23T01:00:53.940Z', daBreu && [daBreu.expurgada, daBreu.expurgadaEm]);
  provar('C1. …e com os sete meses que pagou, ainda que sem contrato',
    daBreu && daBreu.meses.length === 7, daBreu && daBreu.meses.length);
  provar('C1. …e sem contrato em vigor (não há o que cobrar)',
    daBreu && daBreu.temContrato === false && daBreu.valorCentavos === 0,
    daBreu && [daBreu.temContrato, daBreu.valorCentavos]);
  provar('C2. a expurgada SEM histórico fica de fora — não se mostra uma conta vazia de quem já não existe',
    doDuo === undefined, extrato.map((e) => e.escola));
  provar('C3. a viva continua a entrar, sem marca de expurgo',
    doCalango && doCalango.expurgada === false && doCalango.expurgadaEm === null,
    doCalango && [doCalango.expurgada, doCalango.expurgadaEm]);
  provar('C3. …e o contrato dela continua em vigor',
    doCalango && doCalango.temContrato === true && doCalango.valorCentavos === 7990,
    doCalango && [doCalango.temContrato, doCalango.valorCentavos]);

  console.log('');
  console.log('D. O CARTÃO — a linha do expurgo, e nenhuma acção de cobrança');
  const catalogo = require(path.join(RAIZ_DO_MOTOR, 'motor/nucleo/comercial.js')).catalogoDaPagina();
  const html = painel.paginaFinanceira({
    pix: { chave: '000.000.000-00', titular: 'Titular' }, descontos: [],
    escolas: [ESCOLA_VIVA], extrato, catalogo,
  });

  provar('D1. a página abre com as duas contas', /data-conta="breu"/.test(html) && /data-conta="calango"/.test(html));
  /* A DATA SAI NO FUSO DE QUEM LÊ — o expurgo foi às 01:00:53 UTC de 23/11, que em Passo Fundo
   * (UTC−3) ainda é 22/11 às 22:00. A asserção mede o FORMATO e a presença, não o dia: o dia é o
   * que o `quando()` já resolve, e repetir a conta aqui seria a segunda conta da mesma data. */
  provar('D1. …e a expurgada traz a linha do expurgo, com a data',
    /Escola expurgada em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/.test(html),
    (html.match(/Escola expurgada[^<]*/) || [null])[0]);
  provar('D1. …e diz que o histórico fica e o resto saiu',
    /O hist[óo]rico de pagamentos fica/.test(html), null);
  provar('D2. os sete meses dela estão à vista, com os valores pagos',
    (html.match(/2027-05|maio de 2027/g) || []).length > 0 && /239,90/.test(html), null);

  /* A SEPARAÇÃO DAS ACÇÕES: o cartão da expurgada não tem nenhum dos quatro ganchos, e o da viva
   * tem-nos todos. É o controle que impede a correcção de os tirar a TODAS. */
  const cartaoDe = (slug) => {
    const i = html.indexOf('data-conta="' + slug + '"');
    if (i === -1) return '';
    const j = html.indexOf('</details>', i);
    return html.slice(i, j);
  };
  const cartaoBreu = cartaoDe('breu');
  const cartaoCalango = cartaoDe('calango');
  const ganchos = ['data-pagar=', 'data-pagamento-gravar=', 'data-ensaio-ligar=', 'data-contrato-gravar='];
  provar('D3. o cartão da expurgada não tem NENHUMA acção de cobrança',
    ganchos.every((g) => cartaoBreu.indexOf(g) === -1),
    ganchos.filter((g) => cartaoBreu.indexOf(g) !== -1));
  provar('D3. …nem o botão «Marcar pago» de cada linha',
    !/data-pagar="/.test(cartaoBreu), null);
  provar('D4. o cartão da VIVA continua a ter as quatro — a correcção não tirou nada a quem existe',
    ganchos.every((g) => cartaoCalango.indexOf(g) !== -1),
    ganchos.filter((g) => cartaoCalango.indexOf(g) === -1));

  console.log('');
  console.log('E. A FUNÇÃO QUE APAGAVA O LIVRO NÃO EXISTE MAIS');
  provar('E1. `mensalidades.apagarEscolaDoLivro` saiu do núcleo',
    typeof mensalidades.apagarEscolaDoLivro === 'undefined', typeof mensalidades.apagarEscolaDoLivro);
  const fonteDaRaiz = fs.readFileSync(path.join(RAIZ_DO_MOTOR, 'motor/servidor/raiz.js'), 'utf8');
  provar('E2. e a raiz não chama nenhuma limpeza do livro no expurgo',
    !/apagarEscolaDoLivro\(/.test(fonteDaRaiz) && !/limparOLivroDaEscola\(/.test(fonteDaRaiz), null);

  if (TEMPORARIO) fs.rmSync(TEMPORARIO, { recursive: true, force: true });
  console.log('');
  if (CONTRA) {
    console.log((falhas ? 'CONTROLE CONFORME — ' : 'CONTROLE SUSPEITO — ') + falhas + ' de ' + total
      + ' asserções falham com o `motor/` de ' + CONTRA + '.');
    process.exit(falhas ? 0 : 1);
  }
  if (falhas) { console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.'); process.exit(1); }
  console.log('TUDO CERTO — ' + total + ' asserções: uma escola sem contrato tem os meses que PAGOU '
    + 'tirados do livro (e não uma linha do tempo vazia), o extrato mostra a expurgada com a marca e a '
    + 'data e esconde a que nunca pagou nada, o cartão dela diz que foi expurgada e não oferece '
    + 'cobrança nenhuma — e a escola viva continua com as quatro acções.');
})();
