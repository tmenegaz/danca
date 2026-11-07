#!/usr/bin/env node
'use strict';

/**
 * provar-corpo-da-linha-de-base.js — o que a turma mostra no corpo chega ao plano e à Aula 01?
 *
 * O DEFEITO QUE ORIGINOU ESTA PROVA (06/11/2026). A pesquisadora gerou o PO do ciclo 01 e leu os
 * dois documentos:
 *
 *   «Estou aqui no item que se chama aspecto físico, aí tem um preencher: “Carregue a sugestão a
 *    partir da anamnese da turma…” Por que que você colocou essa mensagem aqui?»
 *
 *   «Aí quando eu clico no link que vou para a aula um, corpo, aí eu tenho aqui “aspecto físico, o
 *    que a turma mostra”, e “o que se observa: [Preencher]”. Você não trouxe de onde deveria
 *    trazer. […] Os aspectos escolhidos foram a primeira posição de braço, a estabilidade
 *    vestibular e deslocamento, a resistência de MMSS e a sustentação ativa de MMII […] Esses são
 *    os elementos que estão escolhidos e não aparecem lá na aula um.»
 *
 * E eram DUAS faltas, não uma:
 *
 *   1. a LÍNGUA — o documento imprimia instruções de formulário («carregue a sugestão…») e
 *      raciocínio de arquitectura («aqui fica o ponteiro — a tabela vive num lugar só»). Nada
 *      disso é para quem lê o documento;
 *   2. a LIGAÇÃO — o dado existia (o recorte do passo 4 e a leitura do passo 3, no acto da
 *      turma), e o derivador não o lia. A cadeia é linha de base → turma → plano → PO → aula, e
 *      o motor só andava até ao plano: o eixo do Corpo do guia dependia de um campo do plano
 *      (`aspecto-fisico`) que se preenche à mão no formulário.
 *
 * O QUE ESTA PROVA GUARDA, e são quatro coisas:
 *
 *   A. a linha de base da turma transporta o que a turma mostra em cada aspecto — e SÓ os aspectos
 *      do recorte (a classificação tem quarenta e nove linhas, e o documento imprime as escolhidas);
 *   B. o PLANO trata o corpo macro: os nomes dos aspectos escolhidos e o link, em língua de
 *      professor — e quando o campo do plano está preenchido é ele que manda;
 *   C. a AULA traz o detalhe, linha a linha, com o que a turma mostra em cada aspecto;
 *   D. os dois documentos dizem o MESMO conjunto de aspectos — é o que impede a divergência que
 *      esta prova existe para fechar.
 *
 *   node experimentos/provar-corpo-da-linha-de-base.js
 */

const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const { linhaDeBaseDaTurma } = require(path.join(RAIZ, 'motor/nucleo/linha-de-base.js'));
const { derivarPlano } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));
const { derivarAula01 } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
const { derivarPO } = require(path.join(RAIZ, 'motor/nucleo/derivar-po.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

/* A TURMA, o CICLO e o que o passo 3 leu — três aspectos escolhidos, um deles sem leitura (a
 * anamnese não o respondeu) e um deles fora do recorte, para se ver o filtro a funcionar. */
const TURMA = 'Balé Nível 1 — Teste 1';

const LINHA = {
  id: 'teste',
  nome: 'teste',
  turma: TURMA,
  enviada_em: '2026-11-06T02:02:43.820Z',
  carimbo: '20261106-0202',
  alunas: ['Aluna A', 'Aluna B'],
  campos: [
    { id: 'a-bracos', nome: '1ª posição — braços', grupo: 'as cinco posições' },
    { id: 'a-forca', nome: 'Sustentação ativa de MMII (força de adágio)', grupo: 'Equilíbrio e força' },
    { id: 'a-prazo', nome: 'Resistência de MMSS (port de bras prolongado)', grupo: 'Equilíbrio e força' },
  ],
  leitura: {
    em: '2026-11-06T02:01:35.440Z',
    classificacao: {
      atencao: [
        { id: 'a-prazo', nome: 'Resistência de MMSS (port de bras prolongado)', grupo: 'Equilíbrio e força',
          texto: '1 de 2 em «Sustenta sem elevar escápulas» · 1 de 2 em «Fadiga rápida com queda»',
          quantas: 2, temAbaixoDoMelhor: true },
        { id: 'a-bracos', nome: '1ª posição — braços', grupo: 'as cinco posições',
          texto: '1 de 2 em «Bom» (com a barra como apoio) · 1 de 2 em «precisa desenvolver»',
          quantas: 2, temAbaixoDoMelhor: true },
        /* FORA DO RECORTE — existe na classificação e não pode viajar. */
        { id: 'fora-1', nome: '5ª posição — pés', grupo: 'as cinco posições',
          texto: '2 de 2 em «razoável»', quantas: 2, temAbaixoDoMelhor: true },
      ],
      excelencia: [
        { id: 'a-bracos', nome: '1ª posição — braços', grupo: 'as cinco posições',
          texto: '1 de 2 em «Bom» (com a barra como apoio) · 1 de 2 em «precisa desenvolver»',
          quantas: 2, temAbaixoDoMelhor: false },
      ],
      musicalidade: [],
      comuns: [
        { id: 'a-forca', nome: 'Sustentação ativa de MMII (força de adágio)', grupo: 'Equilíbrio e força',
          texto: '2 de 2 em «Sustenta a perna a 90°+ sem apoio»', quantas: 2, temAbaixoDoMelhor: false },
      ],
      semRegisto: [],
    },
  },
};

const PLANO = {
  id: 'plano-da-prova',
  contexto: { escola: 'prova', professor: 'prova', ciclo: '01', turma: TURMA },
  respostas: {
    'contexto-turma': { valor: TURMA },
    'marcos-por-aula': { valor: ['reconhecer o apoio'] },
    'estrutura-de-cada-aula': { valor: [{ marco: 1, marcados: ['Barra'] }] },
  },
};

const PO = {
  id: 'po-da-prova',
  contexto: { escola: 'prova', professor: 'prova', ciclo: '01' },
  respostas: {
    'plano-de-ensino': { valor: PLANO.id },
    sujeitos: { valor: ['Aluna A', 'Aluna B'] },
    'dimensoes-de-observacao': { valor: ['Barra'] },
  },
};

const CONTEXTO = { professor: 'prova', ciclo: '01', escola: 'prova', escolaNome: 'Prova' };

/** A secção `## Aspecto físico` do plano, do título até ao `##` seguinte. */
function secaoDoPlano(md, titulo) {
  const linhas = String(md).split('\n');
  const i = linhas.findIndex((l) => new RegExp('^## ' + titulo).test(l));
  if (i === -1) return null;
  const j = linhas.findIndex((l, k) => k > i && /^## /.test(l));
  return linhas.slice(i, j === -1 ? undefined : j).join('\n');
}

/** A tabela de um eixo do guia (a secção `## 5. Guia de observação`). */
function tabelaDoEixo(md, eixo) {
  const linhas = String(md).split('\n');
  const inicio = linhas.findIndex((l) => /^## 5\. Guia de observação/.test(l));
  const fim = linhas.findIndex((l, i) => i > inicio && /^## /.test(l));
  const corpo = linhas.slice(inicio, fim === -1 ? undefined : fim);
  const i = corpo.findIndex((l) => new RegExp('^###\\s+' + eixo + '\\s*$').test(l));
  if (i === -1) return null;
  const j = corpo.findIndex((l, k) => k > i && /^###\s/.test(l));
  return corpo.slice(i, j === -1 ? undefined : j);
}

const linhasDaTabela = (tabela) => (tabela || [])
  .filter((l) => /^\|/.test(l) && !/^\|:?--/.test(l))
  .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
  .slice(1);

(async () => {
  // -------------------------------------------------------------------------------------------
  bloco('A. A LINHA DE BASE DA TURMA TRANSPORTA O QUE A TURMA MOSTRA — e só o recorte');
  {
    const lb = linhaDeBaseDaTurma([LINHA], TURMA);
    /* `|| []` e `|| {}`: contra um núcleo que ainda não transporta a leitura, esta secção tem de
     * REPROVAR (dizendo o que falta) e não estourar — um `TypeError` não é uma contraprova. */
    const mostra = (lb && lb.mostra) || [];
    provar('a linha de base da turma é encontrada pela turma do plano',
      Boolean(lb) && lb.turma === TURMA, lb && lb.turma);
    provar('o recorte traz os três aspectos escolhidos no passo 4',
      ((lb && lb.recorte) || []).length === 3, lb && lb.recorte.map((c) => c.nome));
    provar('…e a leitura do passo 3 vem junto, um por aspecto', mostra.length === 3,
      mostra.map((m) => m.id));
    provar('o texto de cada um é o que o passo 3 escreveu, e não uma conta nova',
      ((mostra.find((m) => m.id === 'a-forca') || {}).texto)
        === '2 de 2 em «Sustenta a perna a 90°+ sem apoio»',
      mostra.map((m) => [m.id, m.texto]));
    /* A ASSERÇÃO NEGATIVA, e é a que impede o documento de despejar a anamnese inteira: a
     * classificação tem dezenas de aspectos, e o plano imprime os que o professor escolheu ver. */
    provar('um aspecto classificado FORA do recorte não atravessa',
      !mostra.some((m) => m.id === 'fora-1'), mostra.map((m) => m.id));
    provar('o ponto de atenção do passo 3 é preservado',
      (mostra.find((m) => m.id === 'a-prazo') || {}).atencao === true
      && (mostra.find((m) => m.id === 'a-forca') || {}).atencao === false,
      mostra.map((m) => [m.id, m.atencao]));

    /* Uma linha de base SEM leitura (o passo 3 nunca correu) não pode derrubar a derivação. */
    const semLeitura = Object.assign({}, LINHA, { leitura: undefined });
    const lbSemLeitura = linhaDeBaseDaTurma([semLeitura], TURMA) || {};
    provar('sem leitura do passo 3, o recorte continua e a mostra fica vazia',
      (lbSemLeitura.recorte || []).length === 3 && (lbSemLeitura.mostra || []).length === 0,
      lbSemLeitura.mostra);
    provar('e uma turma sem linha de base nenhuma devolve `null`, em vez de inventar',
      linhaDeBaseDaTurma([LINHA], 'outra turma') === null);
  }

  // -------------------------------------------------------------------------------------------
  /* A SECÇÃO SAIU DO PLANO A 07/11/2026 — o bloco passou de «o plano diz» para «o plano não diz,
   * e o corpo continua inteiro onde sempre esteve». Um bloco de prova que se apaga não guarda
   * nada; este passa a guardar a AUSÊNCIA e o controlo positivo dela (a secção C, logo abaixo,
   * mede a Aula 01 com as mesmas três linhas). */
  bloco('B. O PLANO JÁ NÃO FALA DO CORPO — e não é por esquecimento');
  {
    const lb = linhaDeBaseDaTurma([LINHA], TURMA);
    const comLb = derivarPlano(PLANO, { linhaDeBase: lb }).markdown;
    provar('a secção «Aspecto físico» JÁ NÃO EXISTE no plano',
      secaoDoPlano(comLb, 'Aspecto físico') === null);
    provar('…nem com a linha de base presente, que era o que a alimentava',
      !/3 aspectos do corpo em observação/.test(comLb), comLb.slice(0, 200));
    provar('…nem nomeia os aspectos do recorte',
      !/1ª posição — braços/.test(comLb) && !/Sustentação ativa de MMII/.test(comLb));
    /* O QUE SAIU NÃO DEIXOU SAUDADE EM FORMA DE LIXO: nem instrução de formulário, nem raciocínio
     * de arquitectura — as duas frases que ela leu e recusou num documento. */
    provar('NÃO imprime a instrução de formulário («carregue a sugestão…»)',
      !/carregue a sugestão/i.test(comLb));
    provar('…nem o raciocínio de arquitectura («a tabela vive num lugar só»)',
      !/a tabela vive num lugar só/i.test(comLb));
    /* UM ENVELOPE ANTIGO, COM O CAMPO PREENCHIDO, TAMBÉM NÃO O FAZ VOLTAR: a resposta continua
     * guardada (a proveniência acrescenta, não apaga), mas o documento já não a imprime. É o
     * mesmo tratamento de `estruturaDeCadaAula` — o campo fica no schema, como leitura do passado. */
    const comCampo = JSON.parse(JSON.stringify(PLANO));
    comCampo.respostas['aspecto-fisico'] = { valor: [
      { Aspecto: 'Alongamento de isquiotibiais', 'Como está a turma': '2 de 2 em «encurtado»' },
    ] };
    provar('um plano antigo com o campo preenchido também já não imprime a secção',
      secaoDoPlano(derivarPlano(comCampo, { linhaDeBase: lb }).markdown, 'Aspecto físico') === null);
    provar('…mas o envelope antigo não é reescrito: a resposta continua lá',
      Array.isArray(comCampo.respostas['aspecto-fisico'].valor)
      && comCampo.respostas['aspecto-fisico'].valor.length === 1);
    /* SEM a linha de base, o plano é o MESMO documento — não abre uma lacuna para um campo que
     * já não tem. A lacuna do corpo vive na Aula 01, e a secção C mede-a. */
    const semLb = derivarPlano(PLANO).markdown;
    provar('sem linha de base, o plano não abre lacuna nenhuma por causa do corpo',
      secaoDoPlano(semLb, 'Aspecto físico') === null && !/\[A decidir:.*corpo/i.test(semLb));
  }

  // -------------------------------------------------------------------------------------------
  bloco('C. A AULA — o detalhe, linha a linha, com o que a turma mostra');
  {
    const lb = linhaDeBaseDaTurma([LINHA], TURMA);
    const aula = derivarAula01({ plano: PLANO, po: PO, contexto: CONTEXTO, linhaDeBase: lb });
    const corpo = tabelaDoEixo(aula, 'Corpo');
    provar('o eixo do Corpo existe no guia', Boolean(corpo));
    const linhas = linhasDaTabela(corpo);
    provar('tem uma linha por aspecto do recorte, e o cabeçalho da tabela',
      linhas.length === 3, linhas);
    /* A ORDEM: a da linha de base dentro de cada metade, e os pontos de atenção primeiro — a
     * mesma que a sugestão da tela produz. `sort` estável: `a-bracos` e `a-prazo` são atenção e
     * ficam na ordem do recorte; `a-forca` está no melhor nível e desce. */
    provar('a primeira coluna é o nome do aspecto, na ordem do recorte',
      linhas.map((l) => l[0]).join(' | ')
        === '1ª posição — braços | Resistência de MMSS (port de bras prolongado) | '
        + 'Sustentação ativa de MMII (força de adágio)',
      linhas.map((l) => l[0]));
    provar('os pontos de atenção vêm PRIMEIRO — é a ordem da sugestão da tela',
      /ponto de atenção/.test(linhas[0][1]) && /ponto de atenção/.test(linhas[1][1])
      && !/ponto de atenção/.test(linhas[2][1]), linhas.map((l) => l[1]));
    provar('o que a turma mostra em cada aspecto é o texto do passo 3',
      /1 de 2 em «Bom»/.test(linhas[0][1])
      && /1 de 2 em «Fadiga rápida com queda»/.test(linhas[1][1])
      && /2 de 2 em «Sustenta a perna a 90°\+ sem apoio»/.test(linhas[2][1]),
      linhas.map((l) => l[1]));
    /* O QUE NÃO TINHA LEITURA NÃO FICA EM BRANCO NEM INVENTA: diz-se. */
    provar('o aspecto sem leitura diz que não há registo — não fica vazio',
      linhas.every((l) => String(l[1] || '').trim() !== ''), linhas.map((l) => l[1]));
    provar('NÃO imprime a instrução de formulário',
      !/carregue a sugestão/i.test(aula), (corpo || []).join('\n'));

    /* SEM a linha de base, a lacuna — e é a de professor. */
    const semLb = tabelaDoEixo(
      derivarAula01({ plano: PLANO, po: PO, contexto: CONTEXTO }), 'Corpo');
    const linhasSem = linhasDaTabela(semLb);
    provar('sem linha de base, a aula declara a lacuna e o caminho de volta',
      linhasSem.length === 1 && /\[A decidir:/.test(linhasSem[0][1]), linhasSem);
    provar('…sem instrução de formulário', !/carregue a sugestão/i.test(semLb.join('\n')), semLb);

    /* O CAMPO DO PLANO VOLTA A MANDAR QUANDO EXISTE. */
    const comCampo = JSON.parse(JSON.stringify(PLANO));
    comCampo.respostas['aspecto-fisico'] = { valor: [
      { Aspecto: 'Alongamento de isquiotibiais', 'Como está a turma': '2 de 2 em «encurtado»' },
    ] };
    const comCampoLb = linhasDaTabela(tabelaDoEixo(
      derivarAula01({ plano: comCampo, po: PO, contexto: CONTEXTO, linhaDeBase: lb }), 'Corpo'));
    provar('com o campo preenchido no plano, a aula usa-o — e não o recorte',
      comCampoLb.length === 1 && comCampoLb[0][0] === 'Alongamento de isquiotibiais', comCampoLb);
  }

  // -------------------------------------------------------------------------------------------
  /* O BLOCO D MEDIA A CONCORDÂNCIA ENTRE DOIS DOCUMENTOS QUE IMPRIMIAM O MESMO. Com a secção do
   * plano fora (07/11/2026), não há dois — há um, e o que se mede passa a ser a fonte ÚNICA: a
   * Aula 01 diz exatamente o recorte do elenco, sem acrescentar nem perder. É a mesma pergunta de
   * antes («algum deles inventa um aspecto?»), feita agora a quem ficou. */
  bloco('D. A FONTE ÚNICA — a Aula 01 diz o recorte do elenco, e nada mais');
  {
    const lb = linhaDeBaseDaTurma([LINHA], TURMA);
    const linhasNaAula = linhasDaTabela(tabelaDoEixo(
      derivarAula01({ plano: PLANO, po: PO, contexto: CONTEXTO, linhaDeBase: lb }), 'Corpo'));
    const nomesNaAula = linhasNaAula.map((l) => l[0]);
    provar('o conjunto de aspectos da aula é o do recorte do elenco',
      nomesNaAula.slice().sort().join(' | ')
        === lb.recorte.map((c) => c.nome).sort().join(' | '),
      { nomesNaAula, recorte: lb.recorte.map((c) => c.nome) });
    provar('…e não inventa um aspecto que não esteja no recorte',
      nomesNaAula.every((n) => lb.recorte.some((c) => c.nome === n)), nomesNaAula);
    provar('…nem perde nenhum dos que o elenco escolheu',
      lb.recorte.every((c) => nomesNaAula.includes(c.nome)), nomesNaAula);
  }

  // -------------------------------------------------------------------------------------------
  bloco('E. O PO NÃO MUDOU — o recorte já lá estava, e continua');
  {
    const lb = linhaDeBaseDaTurma([LINHA], TURMA);
    const po = derivarPO(PO, PLANO, { linhaDeBase: lb }).markdown;
    provar('a secção «Linha de base» do PO continua a imprimir o recorte agrupado',
      /## Linha de base/.test(po) && /1ª posição — braços/.test(po)
      && /Equilíbrio e força/.test(po), po.slice(po.indexOf('## Linha de base'), 400));
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: o recorte do passo 4 e a leitura do passo 3 '
    + 'atravessam a linha de base da turma até à Aula 01, que é a fonte ÚNICA do corpo desde '
    + '07/11/2026 — o plano deixou de o repetir, e um envelope antigo com o campo preenchido '
    + 'também já não faz voltar a secção; a aula diz exatamente o recorte, sem inventar nem '
    + 'perder um aspecto; e sem linha de base a lacuna declara-se sem instruções de formulário.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
