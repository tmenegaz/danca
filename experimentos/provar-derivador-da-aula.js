#!/usr/bin/env node
'use strict';

/**
 * provar-derivador-da-aula.js — o derivador escreve a AULA QUE LHE PEDEM, e não sempre a primeira.
 *
 * PORQUE ESTA PROVA EXISTE. O derivador chamava-se `derivarAula01` e o nome era literal: escrevia
 * `aula: "01"`, «Plano para a Aula 01», lia `aula-1-sequencia` e `aula-1-parametro` escritos à
 * mão, e o «próximo passo» da §8 mandava sempre para a **Aula 02**. Enquanto só a Aula 01 existiu,
 * nada disso se notava. No dia em que o ciclo tiver a Aula 02, o documento dela sairia com o
 * número, o marco e as respostas da primeira — e na Aula 03 a §8 mandaria o professor **para
 * trás**, para um marco que já foi dado.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. A CHAVE DE CADA AULA: `aula-1-parametro` continua a ser a chave da Aula 01 — é o que
 *      garante que a aula publicada não mudou de fonte.
 *   B. A AULA 01 NÃO MUDOU: `derivarAula01` é o mesmo documento que `derivarAula({nn:'01'})`, e o
 *      documento declara o marco 1 e as chaves da 01.
 *   C. A AULA 02, COM DADOS PRÓPRIOS: o título, o objetivo, o parâmetro e a sequência vêm das
 *      chaves DELA; a §8 aponta para a Aula 03 e liga-a quando ela existe.
 *   D. A AULA SEM DADOS: declara as lacunas, NOMEIA a chave que falta, e **não herda** a sequência
 *      da Aula 01 — herdar atribuiria a esta aula o que foi respondido para outra.
 *   E. O ESCRITOR: um ciclo cujo `DOCS` declara a Aula 02 grava `-aula-02.md` e
 *      `-captura-aula-02.md`, com o número certo dentro. (E a regra do commit anterior continua:
 *      a aula já lançada não se reescreve.)
 *   F. O CONTROLO NEGATIVO: com o derivador a devolver o documento da Aula 01 para qualquer `nn` —
 *      que é o que ele fazia —, as secções C e E caem.
 *
 *   node experimentos/provar-derivador-da-aula.js
 */

const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const { derivarAula, derivarAula01, derivarCaptura } =
  require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
const { chaveDaAula, aulaSeguinte, numeroDaAula } =
  require(path.join(RAIZ, 'motor/nucleo/aulas-do-ciclo.js'));
const { criarEscritorDeCiclo } =
  require(path.join(RAIZ, 'motor/servidor/escrever-ciclo.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* ---------------------------------------------------------------------------------------- */
/* O PLANO E O PO, construídos aqui. Não se lê a escola: a prova mede o DERIVADOR, e um fixture
 * preso a uma escola morre no dia em que a escola é expurgada — foi o que aconteceu a duas provas
 * em 20/11/2026. Os nomes são inventados e os números são redondos, para a conta ser conferível. */
/* ---------------------------------------------------------------------------------------- */
const resp = (v) => ({ valor: v });
const MARCO_1 = 'reconhecer o apoio e alinhar o eixo vertical';
const MARCO_2 = 'transferir o peso entre os pés sem perder o alinhamento';
const MARCO_3 = 'sustentar a transferência com musicalidade e controle do movimento';

function planoDe({ marcos = [MARCO_1, MARCO_2, MARCO_3], sequencias = {}, parametros = {} } = {}) {
  return {
    id: 'plano-1', ciclo: '01', escola: 'x',
    contexto: { professor: 'p', ciclo: '01', escola: 'x', turma: 'sala rosa' },
    respostas: Object.assign({
      'contexto-turma': resp('sala rosa'),
      'objetivo-geral': resp('o ciclo'),
      'marcos-por-aula': resp(marcos),
      'estrutura-de-cada-aula': resp([{ marco: 1, marcados: ['Barra'] }]),
      'distribuicao-de-volume': resp([{ Bloco: 'Barra', Proporção: '100%' }]),
      'condicoes-preliminares': resp(['sala com barra']),
      'repertorio': resp(['Plié', 'Relevé', 'Battement tendu']),
      'referencias': resp('RAD (2015)'),
    }, sequencias, parametros),
  };
}

const PO = {
  id: 'po-1', ciclo: '01', escola: 'x',
  contexto: { professor: 'p', ciclo: '01', escola: 'x', turma: 'sala rosa' },
  respostas: {
    question: resp('a pergunta'),
    'o-que-fica-de-fora': resp('fica fora o allegro'),
    sujeitos: resp(['Aluna A']),
    'itens-por-dimensao': resp({ Barra: ['o apoio'] }),
  },
};

const CAL = { duracaoMinutos: 60, volumeMin: 30, volumeMax: 50 };
const CTX = { professor: 'p', ciclo: '01', escola: 'x', escolaNome: 'X' };

const linhaDaSequencia = (objetivo, exercicio) => ({
  Bloco: 'Barra', 'Objetivo específico': objetivo, 'Conteúdo do nível': exercicio,
  Tempos: '8', Compasso: '2/4',
});

/* ========================================================================================== */
console.log('\nA · A CHAVE DE CADA AULA — a da primeira continua a ser a que já está gravada');
/* ========================================================================================== */
{
  provar('`aula-1-parametro` é a chave da Aula 01 (não `aula-01-parametro`)',
    chaveDaAula('01', 'parametro') === 'aula-1-parametro', chaveDaAula('01', 'parametro'));
  provar('…e a da Aula 02 leva o número dela', chaveDaAula('02', 'sequencia') === 'aula-2-sequencia',
    chaveDaAula('02', 'sequencia'));
  provar('o número aceita as três formas que o repositório usa',
    ['2', '02', 'aula-2'].every((n) => numeroDaAula(n) === '02'),
    ['2', '02', 'aula-2'].map(numeroDaAula));
  provar('a aula seguinte é a de dois dígitos', aulaSeguinte('01') === '02' && aulaSeguinte('9') === '10',
    [aulaSeguinte('01'), aulaSeguinte('9')]);
}

/* ========================================================================================== */
console.log('\nB · A AULA 01 NÃO MUDOU — o alias e a derivação com `nn` dão o mesmo documento');
/* ========================================================================================== */
{
  const plano = planoDe({
    sequencias: { 'aula-1-sequencia': resp([linhaDaSequencia('1 — ' + MARCO_1, 'Plié')]) },
    parametros: { 'aula-1-parametro': resp([{ marco: 1, marcados: ['Plié', 'Relevé'] }]) },
  });
  const args = { plano, po: PO, contexto: Object.assign({}, CTX, { aulas: ['01'] }), calibracao: CAL };
  const peloAlias = derivarAula01(args);
  const porNumero = derivarAula(Object.assign({}, args, { nn: '01' }));

  provar('o alias `derivarAula01` e o `nn = 01` dão o MESMO texto', peloAlias === porNumero);
  provar('a Aula 01 declara `aula: "01"`', /^aula: "01"$/m.test(porNumero), porNumero.slice(0, 200));
  provar('…e o título diz «Plano para a Aula 01»',
    /^title: "Plano para a Aula 01/m.test(porNumero), /^title: .*/m.exec(porNumero));
  provar('…e o objetivo é o MARCO 1',
    /^objetivo-especifico: "reconhecer o apoio e alinhar o eixo vertical"$/m.test(porNumero),
    /^objetivo-especifico: .*/m.exec(porNumero));
  provar('…e o parâmetro sai da chave da Aula 01',
    /\*\*1\*\*.*Plié/.test(porNumero), /Parâmetro de medição.*/.exec(porNumero));
  provar('…e a §8 nomeia a Aula 02',
    /\*\*Marco da Aula 02\*\*/.test(porNumero), /Marco da Aula.*/.exec(porNumero));
}

/* ========================================================================================== */
console.log('\nC · A AULA 02 — com dados próprios, ela é dela e não da primeira');
/* ========================================================================================== */
{
  const plano = planoDe({
    sequencias: {
      'aula-1-sequencia': resp([linhaDaSequencia('1 — ' + MARCO_1, 'Battement tendu')]),
      'aula-2-sequencia': resp([linhaDaSequencia('2 — ' + MARCO_2, 'Relevé')]),
    },
    parametros: {
      'aula-1-parametro': resp([{ marco: 1, marcados: ['Battement tendu'] }]),
      'aula-2-parametro': resp([{ marco: 2, marcados: ['Plié', 'Relevé'] }]),
    },
  });
  const ctx = Object.assign({}, CTX, { aulas: ['01', '02', '03'] });
  const t = derivarAula({ nn: '02', plano, po: PO, contexto: ctx, calibracao: CAL });

  provar('o cabeçalho diz `aula: "02"`', /^aula: "02"$/m.test(t), /^aula: .*/m.exec(t));
  provar('o título diz «Plano para a Aula 02»', /^title: "Plano para a Aula 02/m.test(t),
    /^title: .*/m.exec(t));
  provar('o objetivo é o MARCO 2, e não o 1',
    /^objetivo-especifico: "transferir o peso entre os pés sem perder o alinhamento"$/m.test(t),
    /^objetivo-especifico: .*/m.exec(t));
  provar('o parâmetro vem da matriz DA AULA 02 — e não arrasta o marco 1',
    /\*\*2\*\*.*Plié · Relevé/.test(t) && !/\*\*1\*\* reconhecer/.test(t),
    /Parâmetro de medição.*/.exec(t));

  /* A SEQUÊNCIA: o documento da Aula 02 não pode listar os exercícios da Aula 01. A §5 é a vista
   * dos exercícios por eixo; o que se procura são os NOMES dos exercícios, que são o dado. */
  provar('a sequência da Aula 01 (o «Battement tendu») NÃO aparece na Aula 02',
    !/Battement tendu/.test(t), t.split('\n').filter((l) => /Battement tendu/.test(l)).slice(0, 2));
  provar('…e o exercício da Aula 02 («Relevé») aparece',
    /Relevé/.test(t), t.split('\n').filter((l) => /Relevé/.test(l)).slice(0, 2));

  provar('a §8 aponta para a Aula 03', /\*\*\[Marco da Aula 03\]\(aula-03\.html\)\*\*/.test(t),
    /Marco da Aula.*/.exec(t));
  provar('…com o marco 3 no link', /\[sustentar a transferência[^\]]*\]\(aula-03\.html\)/.test(t),
    t.split('\n').filter((l) => /aula-03/.test(l)).slice(0, 2));

  /* A FOLHA DA AULA 02 — é ela que vai para a sala. */
  const cap = derivarCaptura({ nn: '02', po: PO, plano, contexto: ctx });
  provar('a folha da Aula 02 diz `aula: "02"`', /^aula: "02"$/m.test(cap), /^aula: .*/m.exec(cap));
  provar('…e o título dela diz «Aula 02»', /^title: "Captura em aula — Aula 02/m.test(cap),
    /^title: .*/m.exec(cap));
}

/* ========================================================================================== */
console.log('\nD · A AULA SEM DADOS — declara a lacuna e nomeia a chave, sem herdar nada');
/* ========================================================================================== */
{
  /* Um plano de três marcos: a Aula 04 não tem marco, não tem sequência e não tem matriz. */
  const plano = planoDe({
    sequencias: { 'aula-1-sequencia': resp([linhaDaSequencia('1 — ' + MARCO_1, 'Battement tendu')]) },
    parametros: { 'aula-1-parametro': resp([{ marco: 1, marcados: ['Battement tendu'] }]) },
  });
  const t = derivarAula({ nn: '04', plano, po: PO, contexto: Object.assign({}, CTX, { aulas: ['01'] }),
    calibracao: CAL });

  provar('o objetivo declara a lacuna E diz de quem ela é',
    /objetivo-especifico: "\[Preencher: marco da Aula 04\]"/.test(t),
    /^objetivo-especifico: .*/m.exec(t));
  provar('o parâmetro NOMEIA a chave que falta — `aula-4-parametro`',
    /\[Preencher: parâmetro de medição da Aula 04 — o plano não respondeu «aula-4-parametro»\]/.test(t),
    /Parâmetro de medição.*/.exec(t));
  provar('…e NÃO herda a matriz da Aula 01', !/\*\*1\*\*.*Battement tendu/.test(t),
    /Parâmetro de medição.*/.exec(t));
  provar('…nem a sequência dela', !/Battement tendu/.test(t),
    t.split('\n').filter((l) => /Battement tendu/.test(l)).slice(0, 2));
  provar('a §8 conta os marcos que o plano TEM («apenas 3 marcos») e aponta a Aula 05',
    /apenas 3 marcos/.test(t) && /\*\*Marco da Aula 05\*\*/.test(t),
    /Marco da Aula.*/.exec(t));
  provar('…e não inventa um link para uma aula que o ciclo não declara',
    !/aula-05\.html/.test(t), t.split('\n').filter((l) => /aula-05/.test(l)).slice(0, 2));
}

/* ========================================================================================== */
console.log('\nE · O ESCRITOR — uma fonte por aula que o `DOCS` declara');
/* ========================================================================================== */

const CONF = [
  'CICLO="01"', 'ESCOLA="x"', 'NOME="Ciclo"', 'DURACOES="60"',
  'VOLUME_MIN="30"', 'VOLUME_MAX="50"',
  'DOCS="plano harmonizacao aula-01 captura-aula-01 aula-02 captura-aula-02 referencias"',
  'DIAS="segunda 18:00"',
].join('\n') + '\n';
const SCHEMA = JSON.stringify({ _declaracao: { porVariante: {} } }, null, 2);

function githubFalso(inicial) {
  const arquivos = Object.assign({}, inicial || {});
  const f = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const u = String(url);
    const corpo = init && init.body ? JSON.parse(init.body) : null;
    if (metodo === 'GET' && /\/contents\//.test(u)) {
      const caminho = decodeURIComponent(u.split('/contents/')[1].split('?')[0]);
      if (/\.conf$/.test(caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 's1', content: Buffer.from(CONF).toString('base64') }) };
      }
      if (/captura-schema\.json$/.test(caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 's2', content: Buffer.from(SCHEMA).toString('base64') }) };
      }
      if (Object.prototype.hasOwnProperty.call(arquivos, caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 'x' + caminho, content: Buffer.from(arquivos[caminho]).toString('base64') }) };
      }
      return { status: 404, ok: false, json: async () => ({}) };
    }
    if (metodo === 'GET' && /\/git\/ref\/heads\//.test(u)) return { status: 200, ok: true, json: async () => ({ object: { sha: 'c0' } }) };
    if (metodo === 'GET' && /\/git\/commits\//.test(u)) return { status: 200, ok: true, json: async () => ({ tree: { sha: 't0' } }) };
    if (metodo === 'POST' && /\/git\/blobs$/.test(u)) {
      const sha = 'b' + Math.random().toString(36).slice(2);
      arquivos.__blob = arquivos.__blob || {};
      arquivos.__blob[sha] = Buffer.from(String(corpo.content), 'base64').toString('utf8');
      return { status: 201, ok: true, json: async () => ({ sha }) };
    }
    if (metodo === 'POST' && /\/git\/trees$/.test(u)) {
      arquivos.__tree = {};
      for (const t of corpo.tree || []) {
        arquivos.__tree[t.path] = t.content !== undefined
          ? String(t.content) : (arquivos.__blob || {})[t.sha];
      }
      return { status: 201, ok: true, json: async () => ({ sha: 't1' }) };
    }
    if (metodo === 'POST' && /\/git\/commits$/.test(u)) return { status: 201, ok: true, json: async () => ({ sha: 'c1' }) };
    if (metodo === 'PATCH' && /\/git\/refs\/heads\//.test(u)) {
      Object.assign(arquivos, arquivos.__tree || {});
      delete arquivos.__tree; delete arquivos.__blob;
      return { status: 200, ok: true, json: async () => ({}) };
    }
    return { status: 200, ok: true, json: async () => ({}) };
  };
  return { fetch: f, arquivos };
}

const ECTX = { escola: 'x', professor: 'p', ciclo: '01', turma: 'sala-rosa', variante: 'x-sala-rosa' };
const BASE = 'professores/p/ciclos';
const PLANO_ESCRITOR = planoDe({
  sequencias: {
    'aula-1-sequencia': resp([linhaDaSequencia('1 — ' + MARCO_1, 'Battement tendu')]),
    'aula-2-sequencia': resp([linhaDaSequencia('2 — ' + MARCO_2, 'Relevé')]),
  },
  parametros: {
    'aula-1-parametro': resp([{ marco: 1, marcados: ['Battement tendu'] }]),
    'aula-2-parametro': resp([{ marco: 2, marcados: ['Relevé'] }]),
  },
});

(async () => {
  {
    const gh = githubFalso();
    const escrever = criarEscritorDeCiclo({
      token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: gh.fetch,
    });
    const r = await escrever({ plano: PLANO_ESCRITOR, po: PO, contexto: ECTX, calibracao: CAL });
    const escritos = (r.escritas || []).map((e) => e.caminho);

    provar('o escritor grava a `-aula-02.md`', escritos.indexOf(BASE + '/ciclo-01-x-sala-rosa-aula-02.md') !== -1, escritos);
    provar('…e a folha dela', escritos.indexOf(BASE + '/ciclo-01-x-sala-rosa-captura-aula-02.md') !== -1, escritos);
    const aula2 = gh.arquivos[BASE + '/ciclo-01-x-sala-rosa-aula-02.md'] || '';
    const cap2 = gh.arquivos[BASE + '/ciclo-01-x-sala-rosa-captura-aula-02.md'] || '';
    provar('…e o texto da Aula 02 é o da Aula 02', /^aula: "02"$/m.test(aula2), /^aula: .*/m.exec(aula2));
    provar('…e o da folha também', /^aula: "02"$/m.test(cap2), /^aula: .*/m.exec(cap2));
    const aula1 = gh.arquivos[BASE + '/ciclo-01-x-sala-rosa-aula-01.md'] || '';
    provar('…e a Aula 01 continua a ser a Aula 01', /^aula: "01"$/m.test(aula1) && /Battement tendu/.test(aula1),
      /^aula: .*/m.exec(aula1));
    provar('…sem a Aula 01 herdar o que é da 02', !/Relevé/.test(aula1.split('## 5.')[0]),
      aula1.split('\n').filter((l) => /Relevé/.test(l)).slice(0, 2));
  }

  /* A REGRA DO COMMIT ANTERIOR CONTINUA A VALER PARA A AULA 02 (21/11/2026). Uma prova que
   * deixasse isto passar diria que o derivador novo sabe escrever a Aula 02 — e não que ele sabe
   * NÃO a escrever depois de ela acontecer. */
  {
    const dados = JSON.stringify({
      ciclo: '01', escola: 'x', professor: 'p', criado_em: '2026-11-01', po: 'po-1',
      apelidos: { aluna_a: 'Aluna A' }, elenco: ['aluna_a'],
      aulas: { '02': { data: '2026-11-20', ultimo_lancamento: '2026-11-20T20:00', presentes: ['aluna_a'] } },
    }, null, 2) + '\n';
    const gh = githubFalso({
      [BASE + '/ciclo-01-x-sala-rosa-dados.json']: dados,
      [BASE + '/ciclo-01-x-sala-rosa-aula-02.md']: 'o plano que o professor levou para a Aula 02\n',
    });
    const escrever = criarEscritorDeCiclo({
      token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: gh.fetch,
    });
    const r = await escrever({ plano: PLANO_ESCRITOR, po: PO, contexto: ECTX, calibracao: CAL });
    provar('com a Aula 02 LANÇADA, o escritor não a reescreve',
      (r.escritas || []).every((e) => e.caminho !== BASE + '/ciclo-01-x-sala-rosa-aula-02.md'),
      (r.escritas || []).map((e) => e.caminho));
    provar('…e diz que ficou travada, nomeando a aula',
      (r.travadas || []).some((t) => t.aula === '02'),
      r.travadas);
    provar('…e a Aula 01, que não foi lançada, continua a ser escrita',
      (r.escritas || []).some((e) => e.caminho === BASE + '/ciclo-01-x-sala-rosa-aula-01.md'),
      (r.escritas || []).map((e) => e.caminho));
  }

  console.log('\n' + (total - falhas) + '/' + total + ' asserções'
    + (falhas ? ' — ' + falhas + ' FALHA(S)' : ' — verde'));
  process.exit(falhas ? 1 : 0);
})();
