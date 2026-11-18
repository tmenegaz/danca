#!/usr/bin/env node
'use strict';

/**
 * provar-cubana-na-anamnese.js — a metodologia cubana entra no item 50, e chega aos documentos
 * (18/11/2026).
 *
 * O PEDIDO, na letra: «no item 50, matriz metodológica de origem, tanto no mapa quanto no
 * formulário, tem assim, RAD, Vaganova, Francesa/Cecchetti e Escola livre. Tem mais uma opção ali
 * que tem que existir, que é a metodologia cubana […] quando gravar a anamnese com esse espaço
 * novo para o aluno marcar, se ele marcar a metodologia cubana, ela tem que aparecer lá nos
 * documentos que são gerados depois que é feito o plano de observação completo […] tem
 * desdobramentos para o ciclo, para a aula e para o formulário da aula.»
 *
 * O QUE ESTA PROVA MEDE, e por que cada coisa:
 *
 *   A. A LISTA — a opção existe nos três sítios que a formam: o **mapa** (`ARQUITETURA-ANAMNESE.md`
 *      §3.3), a **fonte do formulário** (`porta/conteudo/anamnese.json`, que também é o que o
 *      bundle do Worker lê) e as **duas cópias versionadas** dos pacotes. E existe no lugar certo:
 *      antes de «Escola livre», que é o que se declara quando não há método.
 *   B. O ENVELOPE — a resposta é aceite como qualquer outra e o **índice** passa a levar a
 *      palavra (`metodo`), sem abrir envelope nenhum. É esse campo que torna os desdobramentos
 *      possíveis com UMA leitura.
 *   C. A AULA — a §6 (proveniência consolidada) imprime a origem declarada de cada aluna.
 *   D. O FORMULÁRIO DA AULA — a folha de captura imprime-a, e o `-dados.json` leva-a por aluna
 *      (é ele que o formulário electrónico lê).
 *   E. A AUSÊNCIA — quem não declara sai «não declarada», e não uma escola inventada. É a
 *      diferença entre «não sei» e «é escola livre», e é o que a P-06 proíbe de confundir.
 *
 * OS ENVELOPES SÃO OS REAIS da escola viva (`escola/breu/envelopes`), com a resposta do item 50
 * acrescentada EM MEMÓRIA: nenhuma prova escreve em ficheiro que seja fonte.
 *
 *   node experimentos/provar-cubana-na-anamnese.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const ciclo = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ID = 'matriz-metodologica-de-origem';

/** O campo do item 50 num conteúdo de anamnese. */
function campoDoConteudo(conteudo) {
  for (const bloco of conteudo.blocos || []) {
    for (const c of bloco.campos || []) if (c && c.id === ID) return c;
  }
  for (const m of conteudo.modulosCondicionais || []) {
    for (const c of m.campos || []) if (c && c.id === ID) return c;
  }
  return null;
}

const lido = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));

/** Um envelope real, com o item 50 respondido como ela o responderia. */
function comAResposta(nome, valor) {
  const e = JSON.parse(fs.readFileSync(path.join(RAIZ, 'escola/breu/envelopes', nome), 'utf8'));
  e.respostas = e.respostas || {};
  if (valor === undefined) delete e.respostas[ID];
  else e.respostas[ID] = { valor, origem: 'perguntado', respondente: 'professor' };
  return e;
}

(async () => {
  console.log('\nA · a lista: mapa, formulário e as cópias dos pacotes');

  const conteudo = lido('porta/conteudo/anamnese.json');
  const campo = campoDoConteudo(conteudo);
  provar('o item 50 existe na fonte do formulário', Boolean(campo), Boolean(campo));
  const opcoes = (campo && campo.opcoes) || [];
  provar('…e a Cubana é uma das opções', opcoes.indexOf('Cubana') !== -1, opcoes);
  provar('…depois das escolas nomeadas e ANTES de «Escola livre» (que é o «sem método»)',
    opcoes.indexOf('Cubana') > opcoes.indexOf('Vaganova')
    && opcoes.indexOf('Cubana') > opcoes.indexOf('Francesa/Cecchetti')
    && opcoes.indexOf('Cubana') < opcoes.indexOf('Escola livre'), opcoes);
  provar('…e nenhuma das opções antigas se perdeu',
    ['RAD', 'Vaganova', 'Francesa/Cecchetti', 'Escola livre'].every((o) => opcoes.indexOf(o) !== -1),
    opcoes);

  for (const copia of [
    'professores/demi-plie/ciclos/ciclo-01-breu/plano-observacao/conteudo/anamnese.json',
    'professores/demi-plie/ciclos/ciclo-01-breu-rosa/plano-observacao/conteudo/anamnese.json',
  ]) {
    const c = campoDoConteudo(lido(copia));
    provar('a cópia do pacote tem a Cubana: ' + copia.split('/').slice(-4).join('/'),
      Boolean(c) && (c.opcoes || []).indexOf('Cubana') !== -1, c && c.opcoes);
  }

  const mapa = fs.readFileSync(path.join(RAIZ, 'ARQUITETURA-ANAMNESE.md'), 'utf8');
  const linhaDoMapa = (mapa.match(/^\| \*\*Matriz metodológica de origem\*\* \| (.+?) \|$/m) || [])[1] || '';
  provar('o MAPA (§3.3) declara a Cubana', /Cubana/.test(linhaDoMapa), linhaDoMapa);
  provar('…e a regra da §5.3 nomeia-a', /### 5\.3 O método de origem: RAD, Vaganova, Cubana/.test(mapa));

  console.log('\nB · o envelope: a palavra fica, e o índice passa a levá-la');

  const comCubana = comAResposta('anamnese-20261116-2201.json', 'Cubana');
  const resumo = porta.resumoDoEnvelope(comCubana, 'anamnese-20261116-2201.json');
  provar('o resumo do envelope leva a matriz de origem', resumo.metodo === 'Cubana', resumo.metodo);
  provar('…e o resumo continua a dizer de quem é a anamnese',
    resumo.aluna === 'Aluna A', resumo.aluna);
  provar('a versão do resumo subiu — o índice antigo refaz-se sozinho',
    porta.VERSAO_DO_RESUMO === 6, porta.VERSAO_DO_RESUMO);

  const semResposta = comAResposta('anamnese-20261117-1407.json', undefined);
  const resumoSem = porta.resumoDoEnvelope(semResposta, 'anamnese-20261117-1407.json');
  provar('sem a resposta, o índice diz `null` — «não se sabe», e não «nenhuma»',
    resumoSem.metodo === null, resumoSem.metodo);
  provar('…e a mesma anamnese com uma lista (o formato de duas marcas) não rebenta',
    porta.resumoDoEnvelope(comAResposta('anamnese-20261117-1407.json', ['Cubana', 'RAD']),
      'x.json').metodo === 'Cubana RAD',
    porta.resumoDoEnvelope(comAResposta('anamnese-20261117-1407.json', ['Cubana', 'RAD']),
      'x.json').metodo);

  console.log('\nC · a aula: a §6 diz de que escola vem o corpo de cada aluna');

  const PLANO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'escola/breu/envelopes/plano-20261116-2227.json'), 'utf8'));
  const PO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'escola/breu/envelopes/po-20261116-2230.json'), 'utf8'));
  const CONTEXTO = { escola: 'breu', professor: 'demi-plie', ciclo: '01',
    turma: (PO.contexto && PO.contexto.turma) || 'Balé Nível 1', aulas: ['01'] };
  const CALIBRACAO = { totalAulas: 5, duracaoMin: 60, volumeMin: 80, volumeMax: 100 };

  const aluna = String((PO.respostas && PO.respostas.sujeitos && (PO.respostas.sujeitos.valor || [])[0])
    || 'Aluna A');
  const anamneses = {};
  anamneses[aluna] = { carimbo: 'anamnese-20261116-2201', vinculada: false, metodo: 'Cubana' };

  const aula = ciclo.derivarAula01({
    plano: PLANO, po: PO, contexto: CONTEXTO, calibracao: CALIBRACAO, anamneses,
  });
  provar('a Aula 01 imprime a origem declarada',
    aula.indexOf('origem metodológica declarada: <strong>Cubana</strong>') !== -1,
    (aula.match(/origem metodológica[^<]*<?[^<]*/g) || []).slice(0, 2));

  const semOrigem = ciclo.derivarAula01({
    plano: PLANO, po: PO, contexto: CONTEXTO, calibracao: CALIBRACAO,
    anamneses: { [aluna]: { carimbo: 'x', vinculada: false } },
  });
  provar('…e sem declaração diz «não declarada», em vez de inventar uma escola',
    semOrigem.indexOf('origem metodológica não declarada') !== -1,
    (semOrigem.match(/origem metodológica[^<]*/g) || []).slice(0, 2));

  console.log('\nD · o formulário da aula: a folha e o dado que o formulário lê');

  const captura = ciclo.derivarCaptura({
    po: PO, plano: PLANO, contexto: CONTEXTO, anamneses,
  });
  provar('a folha de captura imprime a origem por aluna',
    captura.indexOf('**Origem metodológica (anamnese):**') !== -1
    && captura.indexOf(aluna + ' — Cubana') !== -1,
    (captura.match(/\*\*Origem metodológica[^\n]*/) || [])[0]);
  const capturaSem = ciclo.derivarCaptura({ po: PO, plano: PLANO, contexto: CONTEXTO, anamneses: {} });
  provar('…e quem não declarou sai «não declarada» na folha',
    new RegExp(aluna + ' — não declarada').test(capturaSem),
    (capturaSem.match(/\*\*Origem metodológica[^\n]*/) || [])[0]);

  /* `derivarDados` devolve o TEXTO do `-dados.json` (é o que o escritor grava), e não o objeto —
   * a prova lê-o como o ficheiro será lido. */
  const dados = JSON.parse(ciclo.derivarDados({ po: PO, contexto: CONTEXTO, linhaDeBase: null, anteriores: null, anamneses }));
  const slug = Object.keys(dados.origem || {})[0];
  provar('o `-dados.json` leva a origem por chave de aluna',
    slug !== undefined && dados.origem[slug] === 'Cubana', dados.origem);
  provar('…e a chave é a do elenco (é ela que o formulário tem na mão)',
    (dados.elenco || []).indexOf(slug) !== -1, { slug, elenco: dados.elenco });

  const dadosSem = JSON.parse(ciclo.derivarDados({ po: PO, contexto: CONTEXTO, linhaDeBase: null, anteriores: null, anamneses: {} }));
  provar('sem declaração, o mapa sai VAZIO — e não com uma chave a `null`',
    Object.keys(dadosSem.origem || {}).length === 0, dadosSem.origem);

  console.log('\nE · o formulário electrónico mostra a mesma origem — e diz quem não declarou');

  {
    /* A FUNÇÃO É EXTRAÍDA DO TEMPLATE, e não copiada para aqui: uma cópia na prova mediria a
     * cópia, e a do formulário podia divergir sem ninguém dar por isso. O `esc` é o mínimo que
     * ela usa — o do formulário troca os cinco caracteres de marcação, e é isso que se injecta. */
    const tpl = fs.readFileSync(path.join(RAIZ, 'tools/templates/lancamento.html'), 'utf8');
    const inicio = tpl.indexOf('function linhaDaOrigem(');
    provar('o formulário tem a linha da origem', inicio !== -1);
    let i = tpl.indexOf('{', inicio);
    let nivel = 0;
    let fim = -1;
    for (let k = i; k < tpl.length; k += 1) {
      if (tpl[k] === '{') nivel += 1;
      else if (tpl[k] === '}') { nivel -= 1; if (nivel === 0) { fim = k + 1; break; } }
    }
    provar('…e a função fecha (o recorte encontrou o corpo inteiro)', fim > i);
    const fonte = tpl.slice(inicio, fim);
    const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const linhaDaOrigem = new Function('esc', fonte + '\nreturn linhaDaOrigem;')(esc);

    const dados = {
      apelidos: { aluna_a: 'Aluna A', aluna_b: 'Aluna B' },
      elenco: ['aluna_a', 'aluna_b'],
      origem: { aluna_a: 'Cubana' },
      aulas: {},
    };
    const linha = linhaDaOrigem(dados, { id: '01' }, '01');
    provar('a linha nomeia quem declarou, com a palavra do item 50',
      /Aluna A — Cubana/.test(linha), linha);
    provar('…e diz «não declarada» de quem não declarou — não «Escola livre»',
      /Aluna B — não declarada/.test(linha) && !/Escola livre/.test(linha), linha);

    const semNada = linhaDaOrigem({ apelidos: {}, elenco: [], origem: {}, aulas: {} }, { id: '01' }, '01');
    provar('sem elenco, a linha não aparece (uma turma vazia não tem de quem falar)',
      semNada === '', semNada);

    /* A CHAMADA TAMBÉM SE MEDE: uma função certa que ninguém chama não mostra nada a ninguém. */
    provar('…e a vista da captura CHAMA a linha',
      /\$\{linhaDaOrigem\(dados, m, id\)\}/.test(tpl));
  }

  console.log('');
  console.log(falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
