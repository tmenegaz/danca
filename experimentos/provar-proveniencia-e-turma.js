#!/usr/bin/env node
'use strict';

/**
 * provar-proveniencia-e-turma.js — a turma no alto dos documentos, e a anamnese de cada aluna na
 * §6 «Proveniência consolidada».
 *
 * O PEDIDO DELA (06/11/2026), e são duas coisas:
 *
 *   «Aí em baixo a gente vai colocar proveniência. E aqui a proveniência a gente vai colocar uma
 *    lista para o professor escolher de qual aluna da turma ele quer olhar a proveniência. […]
 *    vai aparecer dois links para ele, um link de edição da anamnese da aluna e um outro link que
 *    é imprimir a anamnese da aluna.»
 *
 *   «Vamos acrescentar aqui no topo quando a gente abre o plano de ensino […] Vamos dizer qual é a
 *    turma do qual se aplica esse plano de ensino. […] para o professor não se perder, para ele
 *    saber do que se trata se ele ficar muito tempo aqui.»
 *
 * O QUE ESTA PROVA GUARDA, e são quatro coisas:
 *
 *   A. a turma no alto — do plano de ensino E da aula, uma linha de cabeçalho (`subtitle`), que é
 *      o que o pandoc põe debaixo do título no HTML e no bloco de título do PDF;
 *   B. a §6 lista uma linha por aluna do elenco, com os dois gestos;
 *   C. o gesto é o que o servidor aceita: «novo registo» quando a anamnese já está vinculada
 *      (04/11/2026 — o retrato é datado e não se reescreve), «editar» quando está solta;
 *   D. o CONTRATO DE EXTRAÇÃO continua a ler a §6 como TEXTO — é o modo de falha silencioso desta
 *      secção: `proveniencia` é `string` no schema, e um `###` ou uma tabela a mais mudá-lo-ia
 *      para objeto sem que a página perdesse nada.
 *
 *   node experimentos/provar-proveniencia-e-turma.js
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const { derivarPlano } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));
const { derivarAula01 } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

const TURMA = 'Balé Nível 1 — Teste 1';
const OUTRA = 'Balé Nível 2 — Quarta';

const PLANO = {
  id: 'plano-da-prova',
  contexto: { escola: 'prova', professor: 'prova', ciclo: '01', turma: TURMA },
  respostas: {
    'contexto-turma': { valor: TURMA },
    'marcos-por-aula': { valor: ['reconhecer o apoio'] },
    'estrutura-de-cada-aula': { valor: [{ marco: 1, marcados: ['Barra'] }] },
    'objetivo-geral': { valor: 'consolidar o alinhamento' },
  },
};

const PO = {
  id: 'po-da-prova',
  contexto: { escola: 'prova', professor: 'prova', ciclo: '01' },
  respostas: {
    'plano-de-ensino': { valor: PLANO.id },
    sujeitos: { valor: ['Aluna A', 'Aluna B', 'Aluna C'] },
    'dimensoes-de-observacao': { valor: ['Barra'] },
    question: { valor: 'o que se observa' },
  },
};

const CONTEXTO = { professor: 'prova', ciclo: '01', escola: 'prova', escolaNome: 'Prova' };

/** A linha do cabeçalho com a turma, ou `null`. */
function linhaDaTurma(md) {
  const m = /^subtitle: "(.*)"$/m.exec(String(md).split('\n---')[0] || '');
  return m ? m[1] : null;
}

/** A §6 de um documento, do título ao `##` seguinte. */
function secao6(md) {
  const linhas = String(md).split('\n');
  const i = linhas.findIndex((l) => /^## 6\. Prov/.test(l));
  if (i === -1) return null;
  const j = linhas.findIndex((l, k) => k > i && /^## /.test(l));
  return linhas.slice(i, j === -1 ? undefined : j).join('\n');
}

const aula = (extra) => derivarAula01(Object.assign(
  { plano: PLANO, po: PO, contexto: CONTEXTO }, extra || {}));

(async () => {
// ---------------------------------------------------------------------------------------------
console.log('A. A TURMA NO ALTO DO PLANO DE ENSINO');
{
  const md = derivarPlano(PLANO).markdown;
  const cabeca = md.split('\n---')[0];
  provar('o cabeçalho do plano diz a turma a que se aplica',
    linhaDaTurma(md) === 'Turma: ' + TURMA, linhaDaTurma(md));
  provar('…e di-lo DEPOIS do título, no front-matter (é o que o pandoc mostra debaixo dele)',
    /^title: .*\nsubtitle: "Turma: /m.test(cabeca), cabeca.split('\n').slice(0, 9));

  /* DUAS TURMAS SOMAM-SE. Um plano que vale para duas não é o plano de uma delas. */
  const duas = JSON.parse(JSON.stringify(PLANO));
  duas.respostas['contexto-turma'] = { valor: [TURMA, OUTRA] };
  provar('com duas turmas, o cabeçalho nomeia as duas',
    linhaDaTurma(derivarPlano(duas).markdown) === 'Turma: ' + TURMA + ' · ' + OUTRA,
    linhaDaTurma(derivarPlano(duas).markdown));

  /* A RESERVA: o `contexto.turma` do envelope, quando o campo não está preenchido. */
  const soContexto = JSON.parse(JSON.stringify(PLANO));
  delete soContexto.respostas['contexto-turma'];
  provar('sem o campo, a turma vem do contexto do envelope',
    linhaDaTurma(derivarPlano(soContexto).markdown) === 'Turma: ' + TURMA,
    linhaDaTurma(derivarPlano(soContexto).markdown));

  /* SEM TURMA NÃO SE INVENTA A LINHA — «Turma: —» prometeria um dado que não existe. */
  const semTurma = { id: 'x', contexto: { escola: 'prova', ciclo: '01' }, respostas: {} };
  provar('sem turma nenhuma, a linha não existe (em vez de sair vazia)',
    linhaDaTurma(derivarPlano(semTurma).markdown) === null,
    linhaDaTurma(derivarPlano(semTurma).markdown));

  /* O DADO CONTINUA NA TABELA DO CONTEXTO — a linha nova não o substitui. */
  provar('a turma continua na tabela do `## Contexto` (nada se perdeu)',
    /\*\*Turma observada\*\* \| Balé Nível 1 — Teste 1/.test(md));
}

// ---------------------------------------------------------------------------------------------
console.log('\nB. A TURMA NO ALTO DA AULA — e vem do PLANO, não do PO');
{
  provar('a aula diz a mesma turma', linhaDaTurma(aula()) === 'Turma: ' + TURMA,
    linhaDaTurma(aula()));
  /* A FONTE É O PLANO. Se o PO trouxesse outra turma, a do plano é que manda: é o plano de ensino
   * que declara a turma, e o PO herda-a. Duas fontes para o mesmo facto seriam duas respostas. */
  const poComOutra = JSON.parse(JSON.stringify(PO));
  poComOutra.respostas['contexto-turma'] = { valor: OUTRA };
  poComOutra.contexto.turma = OUTRA;
  provar('…e a lê do plano de ensino (o PO não a sobrepõe)',
    linhaDaTurma(aula({ po: poComOutra })) === 'Turma: ' + TURMA,
    linhaDaTurma(aula({ po: poComOutra })));
  const planoSemTurma = { id: 'y', contexto: {}, respostas: {} };
  provar('sem turma no plano, a aula não inventa a linha',
    linhaDaTurma(aula({ plano: planoSemTurma })) === null,
    linhaDaTurma(aula({ plano: planoSemTurma })));
}

// ---------------------------------------------------------------------------------------------
console.log('\nC. A §6 — UMA LINHA POR ALUNA, COM OS DOIS GESTOS');
{
  const anamneses = {
    'Aluna A': { carimbo: 'anamnese-20261105-2301', vinculada: true },
    'Aluna B': { carimbo: 'anamnese-20261105-2031', vinculada: false },
  };
  const s6 = secao6(aula({ anamneses }));

  provar('a secção continua a chamar-se «6. Proveniência consolidada»',
    /^## 6\. Proveniência consolidada$/m.test(s6), s6 && s6.split('\n')[0]);
  provar('e há UMA só (duas secções 6 seriam uma delas lida como prosseguimento da outra)',
    (aula({ anamneses }).match(/^## 6\. /gm) || []).length === 1);

  /* OS DOIS LINKS DE SEMPRE FICAM. */
  provar('os dois links de origem continuam lá (PO e plano de ensino)',
    /\[Plano de Observação\]\(\/plano-observacao\/api\/po-preenchido\./.test(s6)
    && /\[Plano de ensino\]\(\/plano-ensino\/api\/plano-preenchido\./.test(s6), s6);

  /* UMA LINHA POR ALUNA DO ELENCO — nem mais, nem menos. */
  const linhas = s6.split('\n').filter((l) => /^- \*\*Aluna /.test(l));
  provar('há uma linha por aluna do elenco, e são três',
    linhas.length === 3, linhas);
  provar('…na ordem em que o PO as declarou',
    linhas.map((l) => l.match(/^- \*\*(.+?)\*\*/)[1]).join('|') === 'Aluna A|Aluna B|Aluna C',
    linhas.map((l) => l.match(/^- \*\*(.+?)\*\*/)[1]));

  /* O GESTO É O QUE O SERVIDOR ACEITA. */
  const daA = linhas[0];
  const daB = linhas[1];
  provar('anamnese VINCULADA — a linha diz «novo registo» e leva o carimbo',
    /\[novo registo\]\(\/anamnese\/\?[^)]*novo=anamnese-20261105-2301/.test(daA), daA);
  provar('anamnese SOLTA — a linha diz «editar» e leva o carimbo',
    /\[editar\]\(\/anamnese\/\?[^)]*editar=anamnese-20261105-2031/.test(daB), daB);
  provar('…e o endereço leva a aluna, para a barra do formulário abrir preenchida',
    /aluna=Aluna%20A/.test(daA) && /aluna=Aluna%20B/.test(daB), [daA, daB]);
  provar('…e o professor, que é o contexto do ato',
    /professor=prova/.test(daA), daA);

  /* O LINK DE IMPRESSÃO É A FOLHA DA ESTANTE. */
  provar('o segundo link imprime a anamnese daquela aluna',
    /\[imprimir\]\(\/anamnese\/api\/ficha-preenchida\.anamnese-20261105-2301\?formato=html\)/
      .test(daA), daA);
  provar('…e é a MESMA rota que a Área do Professor usa para a folha',
    /\/anamnese\/api\/ficha-preenchida\./.test(daA));

  /* A ALUNA SEM ANAMNESE NÃO GANHA UM LINK QUE MENTE. */
  const daC = linhas[2];
  provar('aluna sem anamnese: diz-se, e oferece-se o gesto de a fazer',
    /sem anamnese registada/.test(daC) && /\[fazer a anamnese\]\(\/anamnese\/\?/.test(daC), daC);
  provar('…e NÃO lhe dá um «imprimir» (seria um 404 com aparência de dado)',
    !/ficha-preenchida/.test(daC) && !/novo=/.test(daC) && !/editar=/.test(daC), daC);

  /* A FRASE EXPLICA O GESTO — em língua de professor. */
  provar('a secção diz o que cada gesto faz, e porque um deles é «novo registo»',
    /a senha é pedida lá/.test(s6) && /novo registo/.test(s6) && /o retrato anterior fica/.test(s6),
    s6.split('\n').filter((l) => /senha/.test(l)));
  provar('…e não imprime nome de ficheiro nem de função',
    !/derivar-ciclo|\.js\b|envelope/.test(s6), s6);
}

// ---------------------------------------------------------------------------------------------
console.log('\nD. SEM O MAPA, A SECÇÃO DEGRADA (não parte)');
{
  /* `anamneses` é OPCIONAL: o derivador é puro e não lê o acervo. Sem ele, o que não se sabe
   * não se inventa — fica o gesto que não precisa de carimbo. */
  const s6 = secao6(aula());
  const linhas = s6.split('\n').filter((l) => /^- \*\*Aluna /.test(l));
  provar('as três alunas continuam listadas', linhas.length === 3, linhas);
  provar('…todas com o gesto de fazer, e nenhum carimbo inventado',
    linhas.every((l) => /fazer a anamnese/.test(l)) && !/editar=|novo=/.test(s6), linhas);
  provar('…e a secção não promete «imprimir» o que não sabe onde está',
    !/ficha-preenchida/.test(s6), s6);
}

// ---------------------------------------------------------------------------------------------
console.log('\nE. O CARIMBO É O VIGENTE — a regra que alimenta a §6');
{
  /* A regra vive em `porta.anamneses`, que é quem a lista da Área do Professor também usa. Aqui
   * mede-se a FONTE: dois retratos da mesma aluna, um PO que a declara, e o que sai é o carimbo
   * mais recente — marcado como vinculado. */
  const prefixo = porta.PREFIXO_ENVELOPES;
  const envelopes = {
    'anamnese-20261105-2031.json': {
      id: 'anamnese-20261105-2031', envelope: '1.2.0',
      contexto: { escola: 'prova', professor: 'prova', aluna: 'Aluna A' },
      respostas: {},
    },
    'anamnese-20261105-2301.json': {
      id: 'anamnese-20261105-2301', envelope: '1.2.0',
      contexto: { escola: 'prova', professor: 'prova', aluna: 'Aluna A' },
      respostas: {},
    },
    'anamnese-20261106-0900.json': {
      id: 'anamnese-20261106-0900', envelope: '1.2.0',
      contexto: { escola: 'prova', professor: 'prova', aluna: 'Aluna B' },
      respostas: {},
    },
    'po-20261106-1108.json': {
      id: 'po-20261106-1108', envelope: '1.2.0',
      contexto: { escola: 'prova', professor: 'prova', ciclo: '01' },
      respostas: { sujeitos: { valor: ['Aluna A'] } },
    },
  };
  const chaves = Object.keys(envelopes).map((n) => prefixo + n);
  const armazenamento = {
    async listar(p) { return chaves.filter((c) => c.indexOf(p) === 0); },
    async ler(c) {
      const nome = c.indexOf(prefixo) === 0 ? c.slice(prefixo.length) : c;
      return Object.prototype.hasOwnProperty.call(envelopes, nome) ? JSON.stringify(envelopes[nome]) : null;
    },
    async gravar() { return { ok: true }; },
  };
  const lista = await porta.anamneses(armazenamento);
  const deA = lista.find((o) => o.valor === 'Aluna A');
  const deB = lista.find((o) => o.valor === 'Aluna B');
  provar('da mesma aluna, o carimbo que vale é o MAIS RECENTE',
    Boolean(deA) && deA.carimbo === 'anamnese-20261105-2301', deA && deA.carimbo);
  provar('…e a que aparece num PO vem marcada como vinculada',
    Boolean(deA) && deA.vinculada === true, deA && deA.vinculada);
  provar('…e a que não aparece em PO nenhum vem solta',
    Boolean(deB) && deB.vinculada === false, deB && deB.vinculada);
}

// ---------------------------------------------------------------------------------------------
console.log('\nF. O CONTRATO DE EXTRAÇÃO CONTINUA A LER A §6 COMO TEXTO');
{
  /* O MODO DE FALHA SILENCIOSO DESTA SECÇÃO. `proveniencia` é `string` no schema da aula. Um `###`
   * a mais faria dele um objeto (`{subcampo: texto}`), e uma tabela a mais mudaria o texto — mas
   * NENHUMA das duas mudanças se vê na página. Quem as apanha é a validação, e é ela que aqui se
   * corre, com a ferramenta a sério. */
  const anamneses = {
    'Aluna A': { carimbo: 'anamnese-20261105-2301', vinculada: true },
    'Aluna B': { carimbo: 'anamnese-20261105-2031', vinculada: false },
  };
  const md = aula({ anamneses });
  const arquivo = path.join(os.tmpdir(), 'aula-proveniencia-' + process.pid + '.md');
  fs.writeFileSync(arquivo, md);
  let extraido = null;
  try {
    const r = spawnSync(process.execPath, [path.join(RAIZ, 'tools/validar-aula-ciclo.js'),
      path.join(RAIZ, 'modelo/ciclos/ciclo-01-aula-schema.json'), arquivo, '--json'],
    { encoding: 'utf8' });
    try { extraido = JSON.parse(r.stdout); } catch (erro) { extraido = null; }
  } finally {
    fs.rmSync(arquivo, { force: true });
  }
  const prov = extraido && extraido.proveniencia;
  provar('a §6 extrai-se como TEXTO (o tipo do schema), e não como objeto',
    typeof prov === 'string', typeof prov);
  provar('…e o texto extraído traz a lista das anamneses',
    typeof prov === 'string' && /Anamnese de cada aluna/.test(prov)
    && /Aluna A/.test(prov) && /Aluna C/.test(prov),
    typeof prov === 'string' ? prov.slice(0, 200) : prov);
}

// ---------------------------------------------------------------------------------------------
console.log('');
if (falhas) {
  console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
  process.exit(1);
}
console.log('TUDO CERTO — ' + total + ' asserções: o plano de ensino e a aula dizem a turma no '
  + 'cabeçalho, a §6 lista a anamnese de cada aluna com o gesto que o servidor aceita (editar ou '
  + 'novo registo) e o link da folha, a aluna sem anamnese diz-se em vez de prometer um 404, e a '
  + '§6 continua a extrair-se como texto.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
