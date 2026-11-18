#!/usr/bin/env node
'use strict';

/**
 * provar-matriz-metodologica.js — o item 50 da anamnese e os desdobramentos da matriz de origem
 * (18/11/2026).
 *
 * O PEDIDO, na letra, em duas passagens do mesmo dia:
 *
 *   1. «Tem mais uma opção ali que tem que existir, que é a metodologia cubana […] tem
 *      desdobramentos para o ciclo, para a aula e para o formulário da aula.»
 *   2. «Você incluiu a cubana, mas você manteve unificado francesa e tchequete. São coisas
 *      diferentes, são metodologias diferentes, tradições diferentes de dança. Então você tem que
 *      separar. […] Vai passar a ter RAD, francesa, Vaganova, cubana e tchequete e escola livre. É
 *      assim que tem que ficar aqui. E tem desdobramentos também.»
 *
 * O QUE ESTA PROVA MEDE, e por que cada coisa:
 *
 *   A. A LISTA — as SEIS opções, na ordem que ela fixou, nos três sítios que a formam: o **mapa**
 *      (`ARQUITETURA-ANAMNESE.md` §3.3 e §5.3), a **fonte do formulário**
 *      (`porta/conteudo/anamnese.json`, que também é o que o bundle do Worker lê) e as **cópias
 *      versionadas** dos pacotes. E mede o defeito que ela viu: a barra que colava duas escolas.
 *   B. A CADEIA REAL — `porta.anamneses()` → `rotas.anamnesesDaTurma()` → documentos. **É a parte
 *      que a prova anterior não media**: ela injectava o mapa à mão, e por isso não viu que o
 *      campo tinha ido para `planos()` (a lista dos PLANOS) em vez de `anamneses()` — a §6 dizia
 *      «não declarada» para toda a gente, sempre, e tudo passava. Aqui o caminho é o do produto.
 *   C. A AULA — a §6 (proveniência consolidada) imprime a origem declarada de cada aluna, para
 *      CADA uma das seis opções.
 *   D. A FOLHA E O DADO — a folha de captura imprime-a, e o `-dados.json` leva-a por aluna (é ele
 *      que o formulário electrónico lê).
 *   E. O FORMULÁRIO DA AULA — a linha da origem, extraída do template de verdade.
 *   F. O LEGADO — o que já está gravado com a palavra antiga («Francesa/Cecchetti») não se
 *      reescreve (P-03) e não se perde: chega aos documentos como foi declarado, e no formulário
 *      volta para o campo aberto em vez de acender um rádio que já não existe.
 *
 * OS ENVELOPES SÃO OS REAIS da escola viva (`escola/breu/envelopes`), com a resposta do item 50
 * acrescentada EM MEMÓRIA: nenhuma prova escreve em ficheiro que seja fonte. O PO e o plano vêm do
 * fixture de teste (`teste/breu.json`), porque os envelopes reais da `breu` foram apagados quando
 * ela desfez o ciclo — e uma prova que aponta para um ficheiro que já não existe explode em vez de
 * medir.
 *
 *   node experimentos/provar-matriz-metodologica.js
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
/* A LISTA DELA, na ordem dela (18/11/2026). «Vai passar a ter RAD, francesa, Vaganova, cubana e
 * tchequete e escola livre. É assim que tem que ficar aqui.» */
const ESPERADA = ['RAD', 'Francesa', 'Vaganova', 'Cubana', 'Cecchetti', 'Escola livre'];

/** O campo do item 50 num conteúdo de anamnese. */
function campoDoConteudo(conteudo) {
  for (const bloco of (conteudo && conteudo.blocos) || []) {
    for (const c of bloco.campos || []) if (c && c.id === ID) return c;
  }
  for (const m of (conteudo && conteudo.modulosCondicionais) || []) {
    for (const c of m.campos || []) if (c && c.id === ID) return c;
  }
  return null;
}

const lido = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));

/** Um envelope real da escola viva, com o item 50 respondido como ela o responderia. */
function comAResposta(nome, valor) {
  const e = lido(path.join('escola/breu/envelopes', nome));
  e.respostas = e.respostas || {};
  if (valor === undefined) delete e.respostas[ID];
  else e.respostas[ID] = { valor, origem: 'perguntado', respondente: 'professor' };
  return e;
}

/**
 * O ARMAZENAMENTO DA ESCOLA VIVA, a ler o índice e os envelopes do disco.
 *
 * `envelope/` é o prefixo do KV e `envelopes/` é a pasta do repositório — a tradução é esta e mais
 * nada. É o que permite correr `porta.anamneses()` como o produto o corre, em vez de lhe entregar
 * um mapa já resolvido (que é precisamente o que escondia o defeito).
 */
function armazenamentoDaEscola() {
  return {
    async ler(chave) {
      const f = path.join(RAIZ, 'escola/breu', String(chave).replace(/^envelope\//, 'envelopes/'));
      return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
    },
    async gravar() { /* a prova não escreve no acervo */ },
    async listar() { return []; },
  };
}

/**
 * Um índice de mentira com os resumos que o produto grava na ESCRITA da anamnese — é ali que o
 * `metodo` nasce, com o envelope ainda em claro na mão de quem grava.
 */
function indiceCom(resumos) {
  const nomes = Object.keys(resumos);
  return {
    versao: porta.VERSAO_DO_RESUMO,
    nomes,
    resumos,
  };
}

function armazenamentoDe(resumos) {
  const indice = JSON.stringify(indiceCom(resumos));
  return {
    async ler(chave) { return String(chave) === 'envelope/.indice.json' ? indice : null; },
    async gravar() {},
    async listar() { return []; },
  };
}

/** O PO e o plano de teste, como envelopes — ver o cabeçalho: os reais foram apagados. */
const FIXTURE = lido('teste/breu.json');
function envelopeDe(fonte) {
  const f = (FIXTURE[fonte] || [])[0] || {};
  const respostas = {};
  for (const [k, v] of Object.entries(f.respostas || {})) respostas[k] = { valor: v };
  if (f.turma && !respostas['contexto-turma']) respostas['contexto-turma'] = { valor: f.turma };
  if (f.sujeitos && !respostas.sujeitos) respostas.sujeitos = { valor: f.sujeitos };
  return {
    id: fonte + '-de-teste', documento: fonte,
    contexto: { escola: 'breu', professor: 'demi-plie', ciclo: '01' },
    respostas,
  };
}

(async () => {
  console.log('\nA · a lista: seis opções, na ordem dela, no mapa e no formulário');

  const conteudo = lido('porta/conteudo/anamnese.json');
  const campo = campoDoConteudo(conteudo);
  provar('o item 50 existe na fonte do formulário', Boolean(campo), Boolean(campo));
  const opcoes = (campo && campo.opcoes) || [];
  provar('as SEIS opções, na ordem que ela fixou',
    JSON.stringify(opcoes) === JSON.stringify(ESPERADA), opcoes);
  /* O DEFEITO QUE ELA VIU, medido na forma mais direta: a barra que colava duas escolas. */
  provar('nenhuma opção tem barra — a Francesa e a Cecchetti não são uma só',
    opcoes.every((o) => !String(o).includes('/')), opcoes.filter((o) => String(o).includes('/')));
  provar('…e as duas estão lá, cada uma com o seu nome',
    opcoes.indexOf('Francesa') !== -1 && opcoes.indexOf('Cecchetti') !== -1, opcoes);
  provar('«Escola livre» continua a última — não é uma escola, é o «sem método formal»',
    opcoes[opcoes.length - 1] === 'Escola livre', opcoes[opcoes.length - 1]);

  /* AS CÓPIAS DOS PACOTES SÃO DESCOBERTAS, e não nomeadas: a lista de escolas muda (a `breu-rosa`
   * foi apagada hoje), e uma prova que fixa o caminho de uma escola que deixou de existir explode
   * em vez de medir. */
  const raizProfessores = path.join(RAIZ, 'professores');
  const copias = [];
  const andar = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) andar(p);
      else if (e.name === 'anamnese.json' && p.includes('plano-observacao')) copias.push(p);
    }
  };
  if (fs.existsSync(raizProfessores)) andar(raizProfessores);
  provar('há pelo menos uma cópia versionada num pacote', copias.length > 0, copias.length);
  for (const copia of copias) {
    const c = campoDoConteudo(JSON.parse(fs.readFileSync(copia, 'utf8')));
    const rel = path.relative(RAIZ, copia);
    provar('a cópia do pacote diz a mesma lista: ' + rel,
      Boolean(c) && JSON.stringify(c.opcoes) === JSON.stringify(ESPERADA), c && c.opcoes);
  }

  const mapa = fs.readFileSync(path.join(RAIZ, 'ARQUITETURA-ANAMNESE.md'), 'utf8');
  const linhaDoMapa = (mapa.match(/^\| \*\*Matriz metodológica de origem\*\* \| (.+?) \|$/m) || [])[1] || '';
  provar('o MAPA (§3.3) declara as seis, na mesma ordem',
    ESPERADA.every((o) => linhaDoMapa.indexOf(o) !== -1)
    && !/Francesa\/Cecchetti/.test(linhaDoMapa), linhaDoMapa);
  provar('…e a regra da §5.3 nomeia as cinco escolas',
    /### 5\.3 O método de origem: RAD, Francesa, Vaganova, Cubana, Cecchetti/.test(mapa));

  console.log('\nB · a cadeia real: a estante entrega o método, e é ela que o documento lê');

  /* A ESCOLA VIVA. O índice real já traz `metodo` para as duas anamneses que o declararam — é o
   * que o Worker grava na escrita. O que se mede é que `porta.anamneses()` o ENTREGA. */
  const reais = await porta.anamneses(armazenamentoDaEscola(), null, ['Aluna A', 'Aluna B']);
  provar('a estante devolve as anamneses da escola', reais.length >= 2, reais.length);
  const comMetodo = reais.filter((o) => o.metodo);
  provar('…e cada uma traz `metodo` quando o declarou',
    comMetodo.length >= 2, reais.map((o) => [o.valor, o.metodo]));
  provar('…com a palavra por extenso, não um objeto nem um índice',
    comMetodo.every((o) => typeof o.metodo === 'string' && o.metodo.length > 1),
    comMetodo.map((o) => o.metodo));

  /* A PONTE. `rotas.anamnesesDaTurma` é uma closure dentro do escritor de rotas; o que se pode
   * medir sem montar o Worker inteiro é que ela lê o campo que a estante entrega. E mede-se no
   * texto do módulo, declarado como tal — não é o mesmo que uma asserção de comportamento. */
  const rotasFonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/rotas.js'), 'utf8');
  provar('a ponte lê `metodo` da linha da estante (é o campo que `anamneses` entrega)',
    /const metodo = String\(\(o && o\.metodo\) \|\| ''\)\.trim\(\)/.test(rotasFonte)
    && /metodo: metodo \|\| null/.test(rotasFonte));

  provar('a versão do resumo é a 6 (a que traz modalidade e método de origem)',
    porta.VERSAO_DO_RESUMO === 6, porta.VERSAO_DO_RESUMO);

  /* CADA UMA DAS SEIS, na função que o índice usa na escrita. */
  for (const opcao of ESPERADA) {
    const r = porta.resumoDoEnvelope(comAResposta('anamnese-20261116-2201.json', opcao),
      'anamnese-20261116-2201.json');
    provar('o resumo guarda «' + opcao + '» intacto', r.metodo === opcao, r.metodo);
  }

  const semResposta = porta.resumoDoEnvelope(
    comAResposta('anamnese-20261117-1407.json', undefined), 'x.json');
  provar('sem a resposta, o índice diz `null` — «não se sabe», e não «nenhuma»',
    semResposta.metodo === null, semResposta.metodo);
  provar('…e uma resposta em lista (o formato de duas marcas) não rebenta',
    porta.resumoDoEnvelope(comAResposta('anamnese-20261117-1407.json', ['Cubana', 'RAD']), 'x.json')
      .metodo === 'Cubana RAD');

  /* O QUE O PRODUTO VÊ, para cada opção: o mapa `{aluna: {carimbo, vinculada, metodo}}` que
   * `rotas.anamnesesDaTurma` monta a partir desta mesma leitura. */
  for (const opcao of ESPERADA) {
    const resumos = {
      /* O RESUMO TEM DE ESTAR COMPLETO para o índice valer: `id`, `fonte` e `gerado_em` são os
       * campos que `CAMPOS_DO_RESUMO` exige, e um resumo a quem falte um deles é «de outra
       * definição» — o índice descarta-o e reconstrói, e a prova mediria a reconstrução. */
      'anamnese-1.json': { id: 'anamnese-1', fonte: 'anamnese', gerado_em: '2026-11-18T12:00',
        escola: 'breu', professor: 'demi-plie', ciclo: null,
        aluna: 'Aluna A', metodo: opcao },
    };
    const lista = await porta.anamneses(armazenamentoDe(resumos), null, ['Aluna A']);
    const doMapa = {};
    for (const o of lista) {
      const metodo = String((o && o.metodo) || '').trim();
      if (o.valor && o.carimbo) doMapa[o.valor] = { carimbo: o.carimbo, metodo: metodo || null };
    }
    provar('pela cadeia, «' + opcao + '» chega a `{aluna: {metodo}}`',
      (doMapa['Aluna A'] || {}).metodo === opcao, doMapa);
  }

  console.log('\nC · a aula: a §6 diz de que escola vem o corpo de cada aluna');

  const PO = envelopeDe('po');
  const PLANO = envelopeDe('plano');
  const CONTEXTO = { escola: 'breu', professor: 'demi-plie', ciclo: '01',
    turma: 'Balé Nível 1', aulas: ['01'] };
  const CALIBRACAO = { totalAulas: 5, duracaoMin: 60, volumeMin: 80, volumeMax: 100 };
  const ALUNA = 'Aluna A';

  for (const opcao of ESPERADA) {
    const aula = ciclo.derivarAula01({
      plano: PLANO, po: PO, contexto: CONTEXTO, calibracao: CALIBRACAO,
      anamneses: { [ALUNA]: { carimbo: 'anamnese-1', vinculada: false, metodo: opcao } },
    });
    provar('a Aula 01 imprime «' + opcao + '»',
      aula.indexOf('origem metodológica declarada: <strong>' + opcao + '</strong>') !== -1,
      (aula.match(/origem metodológica[^<]*<?[^<]*/g) || []).slice(0, 2));
  }

  const semOrigem = ciclo.derivarAula01({
    plano: PLANO, po: PO, contexto: CONTEXTO, calibracao: CALIBRACAO,
    anamneses: { [ALUNA]: { carimbo: 'x', vinculada: false } },
  });
  provar('…e sem declaração diz «não declarada», em vez de inventar uma escola',
    semOrigem.indexOf('origem metodológica não declarada') !== -1,
    (semOrigem.match(/origem metodológica[^<]*/g) || []).slice(0, 2));

  console.log('\nD · o formulário da aula: a folha e o dado que o formulário lê');

  const captura = ciclo.derivarCaptura({
    po: PO, plano: PLANO, contexto: CONTEXTO,
    anamneses: { [ALUNA]: { carimbo: 'x', vinculada: false, metodo: 'Cecchetti' } },
  });
  provar('a folha de captura imprime a origem por aluna',
    captura.indexOf('**Origem metodológica (anamnese):**') !== -1
    && captura.indexOf(ALUNA + ' — Cecchetti') !== -1,
    (captura.match(/\*\*Origem metodológica[^\n]*/) || [])[0]);
  const capturaSem = ciclo.derivarCaptura({
    po: PO, plano: PLANO, contexto: CONTEXTO,
    anamneses: { [ALUNA]: { carimbo: 'x', vinculada: false } },
  });
  provar('…e quem não declarou sai «não declarada» na folha',
    new RegExp(ALUNA + ' — não declarada').test(capturaSem),
    (capturaSem.match(/\*\*Origem metodológica[^\n]*/) || [])[0]);

  /* `derivarDados` devolve o TEXTO do `-dados.json` (é o que o escritor grava), e não o objeto —
   * a prova lê-o como o ficheiro será lido. */
  const dados = JSON.parse(ciclo.derivarDados({ po: PO, contexto: CONTEXTO, linhaDeBase: null,
    anteriores: null, anamneses: { [ALUNA]: { carimbo: 'x', vinculada: false, metodo: 'Francesa' } } }));
  const slug = Object.keys(dados.origem || {})[0];
  provar('o `-dados.json` leva a origem por chave de aluna',
    slug !== undefined && dados.origem[slug] === 'Francesa', dados.origem);
  provar('…e a chave é a do elenco (é ela que o formulário tem na mão)',
    (dados.elenco || []).indexOf(slug) !== -1, { slug, elenco: dados.elenco });

  const dadosSem = JSON.parse(ciclo.derivarDados({ po: PO, contexto: CONTEXTO, linhaDeBase: null,
    anteriores: null, anamneses: {} }));
  provar('sem declaração, o mapa sai VAZIO — e não com uma chave a `null`',
    Object.keys(dadosSem.origem || {}).length === 0, dadosSem.origem);

  console.log('\nE · o formulário electrónico mostra a mesma origem — e diz quem não declarou');

  {
    /* A FUNÇÃO É EXTRAÍDA DO TEMPLATE, e não copiada para aqui: uma cópia na prova mediria a
     * cópia, e a do formulário podia divergir sem ninguém dar por isso. O `esc` é o mínimo que ela
     * usa — o do formulário troca os cinco caracteres de marcação, e é isso que se injecta. */
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

    const dadosDoFormulario = {
      apelidos: { aluna_a: 'Aluna A', aluna_b: 'Aluna B' },
      elenco: ['aluna_a', 'aluna_b'],
      origem: { aluna_a: 'Cecchetti' },
      aulas: {},
    };
    const linha = linhaDaOrigem(dadosDoFormulario, { id: '01' }, '01');
    provar('a linha nomeia quem declarou, com a palavra do item 50',
      /Aluna A — Cecchetti/.test(linha), linha);
    provar('…e diz «não declarada» de quem não declarou — não «Escola livre»',
      /Aluna B — não declarada/.test(linha) && !/Escola livre/.test(linha), linha);

    const semNada = linhaDaOrigem({ apelidos: {}, elenco: [], origem: {}, aulas: {} }, { id: '01' }, '01');
    provar('sem elenco, a linha não aparece (uma turma vazia não tem de quem falar)',
      semNada === '', semNada);

    /* A CHAMADA TAMBÉM SE MEDE: uma função certa que ninguém chama não mostra nada a ninguém. */
    provar('…e a vista da captura CHAMA a linha',
      /\$\{linhaDaOrigem\(dados, m, id\)\}/.test(tpl));
  }

  console.log('\nF · o que já está gravado não se reescreve, e não se perde');

  {
    /* A ANAMNESE DA ALUNA A FOI RESPONDIDA QUANDO A LISTA AINDA COLava as duas escolas. O valor é
     * um facto do passado: a P-03 proíbe reescrevê-lo, e o sistema não pode adivinhar qual das duas
     * ela quis. O que se mede é que (a) ele não é um valor oferecido hoje — logo ninguém o pode
     * marcar por engano —, e (b) a cadeia o transporta intacto, sem o estragar. */
    const legado = (reais.find((o) => o.metodo && o.metodo.includes('/')) || {}).metodo;
    provar('há um valor antigo gravado com a barra (o registo de antes)', Boolean(legado), legado);
    provar('…e ele já não é uma opção oferecida', opcoes.indexOf(legado) === -1, opcoes);
    const aula = ciclo.derivarAula01({
      plano: PLANO, po: PO, contexto: CONTEXTO, calibracao: CALIBRACAO,
      anamneses: { [ALUNA]: { carimbo: 'x', vinculada: false, metodo: legado } },
    });
    provar('…e chega ao documento como foi declarado, sem ser cortado nem corrigido',
      aula.indexOf('origem metodológica declarada: <strong>' + legado + '</strong>') !== -1,
      (aula.match(/origem metodológica[^<]*<?[^<]*/g) || []).slice(0, 2));

    /* A PORTA PÕE-O NO CAMPO ABERTO. `abertoAtual` devolve o valor quando ele não está na lista, e
     * é isso que impede o formulário de acender um rádio errado — ou de o esconder. */
    const portaHtml = fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8');
    provar('o formulário devolve ao campo aberto o que não está na lista',
      /conhecidos\.includes\(atual\) \? '' : atual/.test(portaHtml));
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
