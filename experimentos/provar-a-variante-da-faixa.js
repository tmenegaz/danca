#!/usr/bin/env node
'use strict';

/*
 * provar-a-variante-da-faixa.js — duas Turmas da MESMA sala escrevem ficheiros DIFERENTES.
 *
 * O DEFEITO QUE ISTO MEDE (25/11/2026), e é o último da série das faixas horárias. A Sala passou a
 * declarar N aulas por dia, cada faixa com o seu par (modalidade, professor). A pesquisadora pôs a
 * Sala do Piano com Balé clássico na faixa 1 e Dança contemporânea na faixa 2, com o MESMO
 * professor — que é o caso que a regra dela permite («ou professor ou modalidade, diferentes»).
 *
 * As duas Turmas nasceram certas:
 *
 *   demi-plie-bale-classico-piano        (201)
 *   demi-plie-danca-contemporanea-piano  (201)
 *
 * E as duas escreviam o MESMO ficheiro, porque a variante era `<escola>-<sala>` e a pasta é do
 * professor:
 *
 *   ciclo-01-breu-piano-plano.md     ← as duas
 *
 * A segunda deriva por cima da primeira, e a primeira desaparece. Medido com a rota verdadeira.
 *
 * A REGRA QUE FECHA: a variante passa a `<escola>-<sala>-<modalidade>` **quando a sala declara mais
 * de uma faixa**. O critério é a SALA e não a existência de colisão — uma variante que mudasse no
 * dia em que uma segunda Turma aparecesse renomearia o ficheiro de uma Turma que já tinha
 * documentos.
 *
 * O QUE SE MEDE:
 *
 *   A. `varianteDaTurma` — as quatro combinações, e a equivalência com o que existe hoje;
 *   B. os três caminhos (`.conf`, `-plano.md`, `-po.md`) diferem entre as duas Turmas;
 *   C. a variante sobrevive ao ENVELOPE (é metadado do acto, não uma pergunta);
 *   D. a chave do registo de geração não colide;
 *   E. a prova do expurgo — a variante nova continua a ser reconhecida como DESTA escola;
 *   F. os controlos negativos;
 *   G. o ESCRITOR de verdade — os dois `-plano.md` que saem para o repositório.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const { varianteDoContexto, varianteDaTurma, caminhoDoPO } =
  require(path.join(RAIZ, 'motor/servidor/escrever-po.js'));
const { caminhoDoPlano, caminhoDoConf } = require(path.join(RAIZ, 'motor/servidor/escrever-plano.js'));
const { chaveDoRegistro } = require(path.join(RAIZ, 'motor/servidor/geracao.js'));
const { ehArquivoDaEscola } = require(path.join(RAIZ, 'motor/servidor/repo-escola.js'));
const elicitar = require(path.join(RAIZ, 'motor/nucleo/elicitar.js'));

const ler = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta', p), 'utf8'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* AS DUAS FAIXAS DELA, à letra: mesma sala, mesmo professor, modalidades diferentes. */
const FAIXAS = [
  { id: 'f1', dias: ['seg', 'qua', 'sex'], horarios: { seg: '16:00', qua: '16:00', sex: '16:00' },
    duracaoMin: 55, modalidade: 'Balé clássico', professor: 'demi-plie' },
  { id: 'f2', dias: ['seg', 'qua'], horarios: { seg: '17:00', qua: '17:00' },
    duracaoMin: 70, modalidade: 'Dança contemporânea', professor: 'demi-plie' },
];
const ESCOLA = 'breu';
const SALA = 'Piano';
const VARIANTE_F1 = 'breu-piano-bale-classico';
const VARIANTE_F2 = 'breu-piano-danca-contemporanea';

/* ── A. A regra ────────────────────────────────────────────────────────────── */
console.log('\nA. A REGRA — quando a modalidade entra na variante');

{
  provar('uma sala de UMA faixa não muda — é o que mantém os ficheiros de hoje com o nome de hoje',
    varianteDaTurma({ escola: ESCOLA, turma: SALA, faixas: [FAIXAS[0]], modalidade: 'Balé clássico' })
      === 'breu-piano');
  provar('uma sala ANTIGA (sem o campo `faixas`) também não muda',
    varianteDaTurma({ escola: ESCOLA, turma: SALA, faixas: undefined, modalidade: 'Balé clássico' })
      === 'breu-piano');
  provar('uma sala com DUAS faixas leva a modalidade',
    varianteDaTurma({ escola: ESCOLA, turma: SALA, faixas: FAIXAS, modalidade: 'Balé clássico' })
      === VARIANTE_F1);
  provar('…e as duas faixas dão variantes DISTINTAS',
    varianteDaTurma({ escola: ESCOLA, turma: SALA, faixas: FAIXAS, modalidade: 'Balé clássico' })
      !== varianteDaTurma({ escola: ESCOLA, turma: SALA, faixas: FAIXAS, modalidade: 'Dança contemporânea' }));
  provar('a modalidade é escagarada — acentos e espaços não entram num nome de ficheiro',
    varianteDaTurma({ escola: ESCOLA, turma: SALA, faixas: FAIXAS, modalidade: 'Dança Contemporânea' })
      === VARIANTE_F2, { obtido: varianteDaTurma({ escola: ESCOLA, turma: SALA, faixas: FAIXAS, modalidade: 'Dança Contemporânea' }) });
  provar('sem modalidade, a variante fica na sala — não se inventa um sufixo vazio',
    varianteDaTurma({ escola: ESCOLA, turma: SALA, faixas: FAIXAS, modalidade: '' })
      === 'breu-piano');

  /* A EQUIVALÊNCIA: `varianteDoContexto` continua a dar o que dava. É ela que serve todo o acervo
   * que já existe, e é ela que os envelopes antigos atravessam sem mudar um byte. */
  provar('`varianteDoContexto` de um contexto de hoje não mudou',
    varianteDoContexto({ escola: ESCOLA, turma: SALA }) === 'breu-piano');
  provar('…nem o de um contexto sem turma (o modelo anterior)',
    varianteDoContexto({ escola: ESCOLA }) === 'breu');
  provar('…e uma variante DECLARADA ganha — é o caminho do lançamento da aula',
    varianteDoContexto({ escola: ESCOLA, turma: SALA, variante: VARIANTE_F2 }) === VARIANTE_F2);
}

/* ── B. Os três caminhos ──────────────────────────────────────────────────── */
console.log('\nB. OS TRÊS CAMINHOS — o `.conf`, o plano, o PO e a âncora');

{
  const ctx = (variante) => ({
    escola: ESCOLA, professor: 'demi-plie', ciclo: '01', turma: SALA, variante,
  });
  const um = ctx(VARIANTE_F1);
  const dois = ctx(VARIANTE_F2);

  const c1 = caminhoDoConf(um);
  const c2 = caminhoDoConf(dois);
  const p1 = caminhoDoPlano(um);
  const p2 = caminhoDoPlano(dois);
  const o1 = caminhoDoPO(um);
  const o2 = caminhoDoPO(dois);

  provar('o `.conf` das duas Turmas não é o mesmo', c1 !== c2, { c1, c2 });
  provar('…nem o plano', p1 !== p2, { p1, p2 });
  provar('…nem o PO', o1 !== o2, { o1, o2 });
  provar('o `.conf` da faixa 1 é o nome que se espera',
    c1 === 'professores/demi-plie/ciclos/ciclo-01-' + VARIANTE_F1 + '.conf', c1);
  provar('…e o da faixa 2 também',
    c2 === 'professores/demi-plie/ciclos/ciclo-01-' + VARIANTE_F2 + '.conf', c2);

  /* E a âncora `.fipp` acompanha: ela é `ciclo-NN-<variante>.fipp`, e o `hash-ciclo.sh` recebe a
   * variante por argumento. O que se afirma aqui é que ela é DISTINTA — o `hash-ciclo.sh` não é
   * chamado nesta prova, porque é do disco e o seu contrato é o argumento. */
  const a1 = path.posix.basename(c1, '.conf') + '.fipp';
  const a2 = path.posix.basename(c2, '.conf') + '.fipp';
  provar('a âncora `.fipp` também não colide', a1 !== a2, { a1, a2 });
}

/* ── C. A variante no envelope ────────────────────────────────────────────── */
console.log('\nC. O ENVELOPE — a variante é metadado do acto, e não se perde ao normalizar');

{
  const d = elicitar.elicitar(ler('plano/conteudo/plano.json'), {}, {
    esquema: ler('envelope/elicitacao-schema.json'),
    contexto: { escola: ESCOLA, turma: SALA, modalidade: 'Dança contemporânea', variante: VARIANTE_F2 },
  });
  const ctx = (d.documento && d.documento.contexto) || {};
  provar('a `variante` sobrevive ao envelope', ctx.variante === VARIANTE_F2, ctx);
  provar('…ao lado da modalidade, que também é metadado', ctx.modalidade === 'Dança contemporânea');
  provar('…e não vira pergunta: não há resposta para ela',
    !Object.prototype.hasOwnProperty.call(d.documento.respostas || {}, 'variante'));

  /* E um envelope ANTIGO, sem `variante`, compõe como sempre compôs: é o que garante que nenhum
   * documento de hoje muda de nome. */
  const antigo = elicitar.elicitar(ler('plano/conteudo/plano.json'), {}, {
    esquema: ler('envelope/elicitacao-schema.json'),
    contexto: { escola: ESCOLA, turma: SALA },
  });
  const ctxAntigo = (antigo.documento && antigo.documento.contexto) || {};
  provar('um envelope sem a variante continua a compor `<escola>-<sala>`',
    varianteDoContexto(ctxAntigo) === 'breu-piano', ctxAntigo);
}

/* ── D. A chave do registo de geração ─────────────────────────────────────── */
console.log('\nD. O REGISTO DA GERAÇÃO — a chave não colide');

{
  const k1 = chaveDoRegistro(ESCOLA, { escola: ESCOLA, professor: 'demi-plie', ciclo: '01', turma: SALA, variante: VARIANTE_F1 });
  const k2 = chaveDoRegistro(ESCOLA, { escola: ESCOLA, professor: 'demi-plie', ciclo: '01', turma: SALA, variante: VARIANTE_F2 });
  provar('as duas Turmas gravam o estado da geração em chaves distintas', k1 !== k2, { k1, k2 });
  provar('…e a chave da faixa 1 é a esperada',
    k1 === 'bastidores/breu/geracao/' + VARIANTE_F1, k1);
}

/* ── E. O expurgo continua a reconhecer a escola ──────────────────────────── */
console.log('\nE. A REGRA DA PROVENIÊNCIA — o expurgo leva a variante nova consigo');

{
  /* A decisão dela: «quando eu expurgar e criar a nova escola quero que funcione dentro da regra da
   * proveniência». O expurgo reconhece os ficheiros pelo PREFIXO `<escola>` e por uma fronteira
   * (`-`, `.`, `/` ou fim) — e a variante nova tem `-` logo depois do slug. */
  const caminhos = [
    caminhoDoConf({ escola: ESCOLA, professor: 'demi-plie', ciclo: '01', turma: SALA, variante: VARIANTE_F1 }),
    caminhoDoPlano({ escola: ESCOLA, professor: 'demi-plie', ciclo: '01', turma: SALA, variante: VARIANTE_F1 }),
    caminhoDoPO({ escola: ESCOLA, professor: 'demi-plie', ciclo: '01', turma: SALA, variante: VARIANTE_F1 }),
    'professores/demi-plie/ciclos/ciclo-01-' + VARIANTE_F1 + '.fipp',
    'professores/demi-plie/ciclos/ciclo-01-' + VARIANTE_F1 + '-dados-20261125.json',
  ];
  for (const c of caminhos) {
    provar('o expurgo reconhece ' + c.split('/').pop(), ehArquivoDaEscola(c, ESCOLA, '01'), c);
  }
  provar('…e NÃO reconhece o de outra escola — o controlo que impede o expurgo de levar demais',
    !ehArquivoDaEscola('professores/demi-plie/ciclos/ciclo-01-outra-piano-bale-classico.conf', ESCOLA, '01'));

  /* O pacote mora numa PASTA: `ciclo-NN-<variante>/`. A fronteira de barra cobre-a, e é isso que
   * faz o pacote sair com a escola. */
  provar('…e o pacote (a pasta) também',
    ehArquivoDaEscola('professores/demi-plie/ciclos/ciclo-01-' + VARIANTE_F1 + '/index.html', ESCOLA, '01'));
}

/* ── F. Controlos negativos ───────────────────────────────────────────────── */
console.log('\nF. OS CONTROLOS NEGATIVOS');

{
  /* O CONTROLO TEM DE MORDER, e o primeiro que escrevi não mordia: comparava uma chamada consigo
   * própria. O defeito real são DOIS contextos que diferem no que a Turma distingue — a modalidade
   * — e que dão o MESMO caminho quando a variante não é declarada. */
  const doisContextosSemVariante = [
    { escola: ESCOLA, professor: 'demi-plie', ciclo: '01', turma: SALA, modalidade: 'Balé clássico' },
    { escola: ESCOLA, professor: 'demi-plie', ciclo: '01', turma: SALA, modalidade: 'Dança contemporânea' },
  ];
  provar('CONTROLO: sem a variante declarada, as duas modalidades escrevem o MESMO plano',
    caminhoDoPlano(doisContextosSemVariante[0]) === caminhoDoPlano(doisContextosSemVariante[1]),
    doisContextosSemVariante.map(caminhoDoPlano));

  /* E o inverso: com a variante, deixam de colidir. Os dois juntos são a prova. */
  provar('…e com ela, deixam de colidir',
    caminhoDoPlano(Object.assign({}, doisContextosSemVariante[0], { variante: VARIANTE_F1 }))
      !== caminhoDoPlano(Object.assign({}, doisContextosSemVariante[1], { variante: VARIANTE_F2 })));

  /* Uma sala de UMA faixa não ganha sufixo, mesmo com modalidade: é o que protege o acervo. */
  provar('CONTROLO: uma faixa só, com modalidade, continua `breu-piano`',
    varianteDaTurma({ escola: ESCOLA, turma: SALA, faixas: [FAIXAS[0]], modalidade: 'Balé clássico' })
      === 'breu-piano');
}

/* ------------------------------------------------------------------------------------------ */

/* G. O ESCRITOR DE VERDADE — as duas Turmas gravam em ficheiros distintos, e isto é o que se lê
 *    no repositório.
 *
 * As secções acima medem as FUNÇÕES que compõem nomes. Esta mede o ACTO: o escritor do plano, com o
 * `fetch` trocado por um que regista os caminhos `PUT`. É a única forma de afirmar «a segunda não
 * passa por cima da primeira» sem olhar para um nome composto à mão. */

console.log('\nG. O ESCRITOR DE VERDADE — os dois `-plano.md` que saem para o repositório');

(async () => {
  const { criarEscritorDePlano } = require(path.join(RAIZ, 'motor/servidor/escrever-plano.js'));

  const escritasDe = async (variante) => {
    const escritas = [];
    const f = async (url, opcoes) => {
      const metodo = (opcoes && opcoes.method) || 'GET';
      const caminho = decodeURIComponent(String(url).split('/contents/')[1] || '')
        .split('?')[0];
      if (metodo !== 'GET') escritas.push(caminho);
      if (metodo === 'GET') return new Response('{}', { status: 404 });
      return new Response(JSON.stringify({ content: { sha: 'x' }, commit: { sha: 'y' } }), { status: 200 });
    };
    const escritor = criarEscritorDePlano({
      token: 'prova', dono: 'tmenegaz', repo: 'danca', fetchImpl: f,
      lerTurmas: async () => [], lerCuradorias: async () => [],
    });
    await escritor({
      id: 'plano-prova',
      contexto: { escola: ESCOLA, professor: 'demi-plie', ciclo: '01', turma: SALA, variante },
      respostas: {}, gerado_em: '2026-11-25T22:00',
    }, 'prova', {});
    return escritas;
  };

  const daFaixa1 = await escritasDe(VARIANTE_F1);
  const daFaixa2 = await escritasDe(VARIANTE_F2);

  const plano1 = daFaixa1.filter((c) => /-plano\.md$/.test(c));
  const plano2 = daFaixa2.filter((c) => /-plano\.md$/.test(c));
  provar('o escritor da faixa 1 grava um `-plano.md`', plano1.length === 1, daFaixa1);
  provar('…e o da faixa 2 grava OUTRO', plano2.length === 1, daFaixa2);
  provar('os dois caminhos são diferentes — a segunda não passa por cima da primeira',
    plano1[0] !== plano2[0], { plano1: plano1[0], plano2: plano2[0] });
  provar('…e cada um leva a sua modalidade no nome',
    new RegExp(VARIANTE_F1 + '-plano\\.md$').test(plano1[0])
      && new RegExp(VARIANTE_F2 + '-plano\\.md$').test(plano2[0]),
    { plano1: plano1[0], plano2: plano2[0] });

  /* O CONTROLO NEGATIVO: sem a variante, os dois escritores gravam no MESMO sítio. É o defeito que
   * a pesquisadora ia encontrar ao gerar o segundo ciclo. */
  const sem1 = (await escritasDe(null)).filter((c) => /-plano\.md$/.test(c));
  const sem2 = (await escritasDe('')).filter((c) => /-plano\.md$/.test(c));
  provar('CONTROLO: sem variante, os dois gravam no MESMO `-plano.md`', sem1[0] === sem2[0], { sem1, sem2 });

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: duas Turmas da mesma sala, com modalidades diferentes, '
      + 'escrevem ficheiros diferentes; uma sala de uma faixa não muda nada do que existe; o envelope '
      + 'carrega a variante; e o expurgo continua a reconhecer a escola pelo prefixo.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})();
