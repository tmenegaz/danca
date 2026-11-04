#!/usr/bin/env node
'use strict';

/**
 * provar-plano-matriz.js — a prova de que o PLANO não volta à prosa.
 *
 * O defeito que esta prova trava já mordeu duas vezes, e é invisível na tela: o
 * formulário é montado por uma lista FECHADA de chaves (`descritores()` em
 * `motor/nucleo/elicitar.js` e o `base` de `motor/nucleo/porta.js`). Um nó que declara
 * no conteúdo uma forma que ninguém declarou ali — `lista`, `escala`, `daTurma`,
 * `daCuradoria`, `porMarco` — chega ao navegador SEM a chave, cai no ramo de texto do
 * formulário e o professor volta a escrever à mão. O servidor está certo e a tela,
 * errada: por isso a prova olha o mapa SERVIDO, não a fonte.
 *
 * E confere a outra metade: as respostas na forma nova viram Markdown válido (o
 * validador do plano, Regra 10, camada 1, aceita).
 *
 *   uso: node experimentos/provar-plano-matriz.js
 *
 * Só usa o que o projeto já tem (`motor/`, `tools/`, `node:fs`) — sem DOM de mentira,
 * porque o que se prova aqui é o CONTRATO (o mapa e a derivação), não o pixel.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const RAIZ = path.join(__dirname, '..');

/** A frase do «Registro de proveniência» no Markdown derivado. */
function provenanceTexto(md) {
  const i = md.indexOf('## Registro de proveniência');
  const resto = md.slice(i + '## Registro de proveniência'.length);
  return resto.split(/\n## /)[0].trim();
}
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));
const { derivarPlano, objetivoDaAula1, linhasDaEstrutura, blocosDaEstrutura,
  ROTULOS_DO_CONTEXTO,
  niveisDaRubrica, sequenciaEmLinhas, NIVEIS_DA_RUBRICA, BLOCOS_DA_AULA, linhasDaTabela,
  provenienciaEmTexto } =
  require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));
const { derivarPO, condicaoDeRegistroEmTexto } = require(path.join(RAIZ, 'motor/nucleo/derivar-po.js'));
const { derivarAula01, derivarNotacao } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));

/* DE ONDE SE SERVEM OS ESTÁTICOS — e por que é `porta/`, e não um pacote de escola (03/11/2026).
 *
 * AQUI ESTAVA `professores/leticia/ciclos/ciclo-01-barra`, e ele deixou de existir: a escola
 * `barra` foi expurgada em 15/10/2026 e a pasta do professor `leticia` com ela. A prova passou a
 * falhar na PRIMEIRA asserção («/api/mapa responde») — e a mensagem não diz «o fixture fugiu»:
 * diz que a rota não respondeu. Quem lê conclui que a rota está partida, e a rota está boa.
 *
 * O QUE ESTA PROVA MEDE não é uma escola: é o CONTRATO — o mapa servido (as formas `lista`,
 * `escala`, `porMarco` que, não declaradas, caem no ramo de texto) e a derivação do documento
 * validada contra o schema. O conteúdo e o esquema são os mesmos em qualquer escola, e a fonte
 * deles não é a pasta de quem nasceu primeiro: é `porta/` (o conteúdo e a folha da elicitação) e
 * `modelo/ciclos/` (o molde dos schemas). Servir a PORTA debaixo do prefixo `plano-observacao/` é
 * exactamente o que o gerador faz ao montar um pacote (`cp -R porta/. <pacote>/plano-observacao/`),
 * e é o único fixture que não envelhece com um expurgo. */
const PACOTE = path.join(RAIZ, 'porta');
/* O CONTEÚDO DECLARADO — a mesma fonte que o `ASSETS` serve. É contra ele que se mede «todo
 * campo chega ao mapa», e não contra um número de nós escrito à mão. */
const CONTEUDO = JSON.parse(fs.readFileSync(path.join(PACOTE, 'plano/conteudo/plano.json'), 'utf8'));
const BASE = 'https://barra.tmenegaz77.workers.dev';

let passou = 0;
const ok = (nome, condicao) => {
  assert.ok(condicao, nome);
  passou++;
  console.log('ok     ' + nome);
};

/** O pacote servido como assets: é o que a ponte de produção entrega ao navegador. */
const MIME = {
  '.html': 'text/html;charset=utf-8', '.json': 'application/json;charset=utf-8',
  '.css': 'text/css', '.js': 'text/javascript', '.md': 'text/markdown',
};
const ASSETS = {
  async fetch(req) {
    const bruto = req && req.pathname ? req.pathname : String((req && req.url) || req);
    const rel = new URL(bruto, 'https://assets.local').pathname.replace(/^\/+/, '')
      /* A PORTA É SERVIDA DEBAIXO DE `plano-observacao/` (é o subdiretório do ASSETS em que o
       * gerador a copia), e na fonte ela está na raiz de `porta/`. Tirar o prefixo é o que faz o
       * conteúdo, o esquema, o PO e o prompt chegarem ao roteador — do mesmo sítio de onde o
       * pacote os copia. */
      .replace(/^plano-observacao\//, '');
    const alvo = path.join(PACOTE, rel);
    if (!alvo.startsWith(PACOTE) || !fs.existsSync(alvo) || !fs.statSync(alvo).isFile()) {
      return new Response('ausente', { status: 404 });
    }
    return new Response(fs.readFileSync(alvo), {
      headers: { 'Content-Type': MIME[path.extname(alvo)] || 'application/octet-stream' },
    });
  },
};

/** O KV de mentira: só memória, com o contrato que a ponte usa. */
const dados = new Map([
  ['bastidores/barra/turmas', JSON.stringify([
    { id: 'bale-nivel-1', nome: 'Balé Nível 1', frequencia: 1, dias: ['sexta'], duracaoMin: 60,
      periodoInicio: '2026-10-02', periodoFim: '2026-12-18' }])],
  ['bastidores/barra/vocabulario', JSON.stringify([
    { id: 'plie', termo: 'Plié', categoria: 'passo' },
    { id: 'tendu', termo: 'Battement tendu', categoria: 'passo' }])],
  ['bastidores/barra/turma-conteudos', JSON.stringify({ 'bale-nivel-1': ['plie', 'tendu'] })],
  ['bastidores/barra/curadorias', JSON.stringify([
    { id: 'leticia-bale', professor: 'leticia', modalidade: 'Balé clássico',
      turmas: ['Balé Nível 1'], alunas: ['Vavá'] }])],
]);
const kv = {
  async get(k) { return dados.has(k) ? dados.get(k) : null; },
  async put(k, v) { dados.set(k, String(v)); },
  async delete(k) { dados.delete(k); },
  async list() { return { keys: [], list_complete: true }; },
};
const env = {
  ESCOLA_SLUG: 'barra', ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'Leticia',
  SENHA_PROFESSOR: 's', PADD_KV: kv, ASSETS,
};
const buscar = (url) =>
  producao.fetch(new Request(new URL(String(url), BASE + '/plano-ensino/').toString()), env);

(async () => {
  // 1. O MAPA SERVIDO carrega as formas novas — o portão que já engoliu campos em silêncio.
  const resposta = await buscar('/plano-ensino/api/mapa?fonte=plano');
  ok('/api/mapa responde', resposta.ok);
  ok('/api/mapa não é cacheável', /no-store/.test(resposta.headers.get('cache-control') || ''));
  const mapa = await resposta.json();
  const no = (id) => {
    const n = mapa.nos.find((x) => x.id === id);
    assert.ok(n, 'o mapa tem o nó ' + id);
    return n;
  };

  const marcos = no('marcos-por-aula');
  ok('marcos parciais chegam como LISTA (não prosa)', marcos.lista && marcos.lista.minimo >= 1);
  // A RÉGUA DA RUBRICA é da TURMA (a Produção declara, o plano adota): o nó não traz mais
  // uma lista fixa — traz de ONDE ela vem, e a turma do professor responde.
  ok('a rubrica aponta para a régua da turma', no('rubrica').escala
    && no('rubrica').escala.daTurma === 'rubrica' && !Array.isArray(no('rubrica').escala));
  ok('a turma observada chega filtrada pela curadoria', no('contexto-turma').daCuradoria === 'turmas');
  ok('o ritmo da turma chega em leitura', no('contexto-frequencia').daTurma === 'frequencia'
    && no('contexto-duracao').daTurma === 'duracao'
    && no('contexto-calendario').daTurma === 'calendario'
    && no('contexto-total-aulas').daTurma === 'totalAulas');

  const estrutura = no('estrutura-de-cada-aula');
  ok('os blocos da aula chegam como MATRIZ por marco', estrutura.porMarco
    && estrutura.porMarco.de === 'marcos-por-aula'
    && JSON.stringify(estrutura.porMarco.opcoes) === JSON.stringify(['Solo', 'Barra', 'Centro', 'Musicalidade', 'Expressão']));
  const volume = no('distribuicao-de-volume');
  ok('a distribuição do volume lista os blocos em LEITURA',
    volume.tabela && volume.tabela.linhasDe && volume.tabela.linhasDe.no === 'estrutura-de-cada-aula'
    && volume.tabela.somenteLeitura.indexOf('Bloco') !== -1
    && volume.tabela.textoLargo.indexOf('Justificativa') !== -1);
  ok('o parâmetro de medição é por marco, do conteúdo do nível',
    no('aula-1-parametro').porMarco && no('aula-1-parametro').porMarco.opcoesDaTurma === true);

  // A SEQUÊNCIA DE EXERCÍCIOS: uma linha por objetivo EM CADA bloco, com as escolhas
  // declaradas (bloco, objetivo, conteúdo do nível, compasso) e a musicalidade fora.
  const sequencia = no('aula-1-sequencia');
  ok('a sequência é uma grelha, não prosa', !!sequencia.tabela
    && JSON.stringify(sequencia.tabela.colunas) === JSON.stringify(
      ['Bloco', 'Objetivo específico', 'Conteúdo do nível', 'Tempos', 'Compasso']));
  ok('as linhas da sequência vêm do objetivo em cada bloco',
    sequencia.tabela.linhasDe.no === 'estrutura-de-cada-aula'
    && sequencia.tabela.linhasDe.porMarco === 'Objetivo específico'
    && sequencia.tabela.linhasDe.de === 'marcos-por-aula');
  ok('a sequência não tem a musicalidade (ela é esmiuçada no bloco dela)',
    sequencia.tabela.linhasDe.sem.indexOf('Musicalidade') !== -1
    && sequencia.tabela.linhasDe.ordem.indexOf('Musicalidade') === -1);
  ok('as colunas de escolha estão declaradas',
    sequencia.tabela.selecoes['Bloco'].fonte === 'blocos'
    && sequencia.tabela.selecoes['Objetivo específico'].fonte === 'objetivos'
    && sequencia.tabela.selecoes['Conteúdo do nível'].fonte === 'termosDaTurma'
    && Array.isArray(sequencia.tabela.selecoes['Compasso'].opcoes)
    && sequencia.tabela.selecoes['Compasso'].livre === true);
  /* A REGRA VIROU (03/11/2026), e estas duas asserções guardavam a regra anterior. O que era
   * «o nível não esgota a sala, escreve-se ao lado» e «a sequência aceita mais de um exercício»
   * passou a ser fraude com nome e sobrenome, dito por ela: «a curadoria ela é um plano também.
   * Ela faz parte do que foi acordado […] adicionar uma linha não faz sentido existir aqui».
   *
   * Uma asserção que descreve o comportamento de ontem não é uma prova — é um atraso. Estas duas
   * passam a afirmar o contrário, com a razão escrita, para que o próximo agente não «corrija» a
   * tabela de volta ao que era. */
  ok('o conteúdo do nível só oferece o que foi curado (nem campo livre, nem exercício inventado)',
    sequencia.tabela.selecoes['Conteúdo do nível'].livre !== true
    && sequencia.tabela.selecoes['Conteúdo do nível'].derivadaDe === 'aula-1-parametro');
  ok('a sequência NÃO aceita linha acrescentada — quem manda no repertório é a curadoria',
    sequencia.tabela.acrescentavel === false && sequencia.tabela.removivel === false);
  // A ORIGEM DECLARADA (o «Registro de origem»): uma ESCOLHA para marcar, não prosa — e a
  // lista tem de chegar ao navegador pelo mapa servido (foi por uma lista derivada da `forma`
  // que ela virou uma opção só, com o texto da pergunta dentro).
  const origem = no('proveniencia');
  ok('a origem chega como lista para marcar',
    Array.isArray(origem.valores) && origem.valores.length === 7 && origem.multipla === true);
  ok('as metodologias estão lá, com e sem a adaptação ao âmbito da turma',
    origem.valores.indexOf('Plano derivado da metodologia RAD') !== -1
    && origem.valores.indexOf('Plano derivado da metodologia RAD, adaptado ao âmbito da turma') !== -1
    && origem.valores.indexOf('Plano derivado da metodologia Vaganova, adaptado ao âmbito da turma') !== -1
    && origem.valores.indexOf('Plano derivado da tradição francesa') !== -1);
  ok('a forma é a PERGUNTA, e não uma opção da lista',
    origem.forma === 'De onde vem o que está neste plano'
    && origem.valores.indexOf(origem.forma) === -1);
  ok('o que não estiver na lista se declara ao lado', origem.aberto === true
    && origem.abertoRotulo === 'outra origem');

  // O NÓ 17 («Objetivo específico da Aula 1») SAIU: era o mesmo dado em dois lugares (o
  // marco parcial e o objetivo da Aula 1), e os dois podiam divergir. O que tem de
  // acontecer com a remoção — e é o que esta prova trava — é que ninguém fica sem fonte:
  // o objetivo da Aula 1 passa a ser lido do marco 1.
  ok('o nó do objetivo da Aula 1 saiu do mapa', !mapa.nos.some((n) => n.id === 'aula-1-objetivo'));
  ok('nenhum nó puxa mais o widget de ler do marco',
    !mapa.nos.some((n) => n.doMarco) && !JSON.stringify(mapa).includes('"doMarco"'));
  ok('a Aula 1 continua com o parâmetro e a sequência (o bloco 6 não esvaziou)',
    !!no('aula-1-parametro') && !!no('aula-1-sequencia'));
  /* O QUE ESTA ASSERÇÃO GUARDAVA, E POR QUE ELA ESTAVA ERRADA (03/11/2026).
   *
   * Aqui estava `mapa.nos.length === 25` — o número do dia em que o nó «Objetivo específico da
   * Aula 1» saiu. É a mesma família do defeito que o `provar-teste` tinha com «os nós do
   * cabeçalho não são 7»: uma asserção que mede a DATA em que foi escrita, e não a regra. Hoje o
   * mapa tem 26, e a diferença não é um nó a mais por engano — é o `contexto-metodologia` ter
   * mudado de forma e a contagem do conteúdo ter seguido. Números fixos apodrecem em silêncio, e
   * quando apodrecem dizem «o mapa está errado» sobre um mapa certo.
   *
   * A INVARIANTE, e ela é mais forte do que o número: TODO campo declarado no conteúdo chega ao
   * mapa, e o ÚNICO nó sem declaração é o objetivo geral do cabeçalho. Se o mapeador perder um
   * campo no caminho — o defeito que esta prova existe para travar —, a primeira metade falha; e
   * se ele inventar um nó, falha a segunda. As duas continuam verdadeiras amanhã. */
  const declaradosNoConteudo = [];
  for (const bloco of (CONTEUDO.blocos || [])) {
    for (const campo of (bloco.campos || [])) declaradosNoConteudo.push(campo.id);
  }
  const noMapa = new Set(mapa.nos.map((n) => n.id));
  ok('todo campo declarado no conteúdo chega ao mapa',
    declaradosNoConteudo.every((id) => noMapa.has(id)),
    declaradosNoConteudo.filter((id) => !noMapa.has(id)));
  const semDeclaracao = mapa.nos.map((n) => n.id)
    .filter((id) => declaradosNoConteudo.indexOf(id) === -1);
  ok('…e o mapa não inventa nó nenhum: o único sem declaração é o objetivo do cabeçalho',
    JSON.stringify(semDeclaracao) === JSON.stringify(['objetivo-geral']), semDeclaracao);

  // 2. A DERIVAÇÃO: as respostas novas viram Markdown que o validador aceita.
  const MARÇOS = ['Isolar o eixo vertical no solo', 'Transferir o peso com resposta ao pulso',
    'Compor uma frase curta no centro'];
  const estruturas = [{ marco: 1, marcados: ['Solo', 'Centro'] }, { marco: 3, marcados: ['Barra'] }];
  const envelope = {
    contexto: { ciclo: '01', escola: 'Barra', professor: 'Letícia' },
    respostas: {
      'contexto-turma': { valor: ['Balé Nível 1'] },
      'contexto-total-aulas': { valor: 11 },
      // A condição de registro MARCADA (não prosa): quem está na sala e quem observa.
      'contexto-registro': { valor: { presentes: ['professor', 'alunas da turma'],
        observa: ['observador externo'] } },
      'objetivo-geral': { valor: 'Sustentar o eixo e a transferência de peso.' },
      'marcos-por-aula': { valor: MARÇOS },
      // A RÉGUA ADOTADA — a da turma, que a porta grava no plano (o documento declara
      // contra que régua aquele ciclo foi medido).
      'rubrica': { valor: ['Ótimo', 'Bom', 'Regular'] },
      // A ORIGEM marcada — duas, porque o plano mistura tradições (a ordem é a do conteúdo).
      'proveniencia': { valor: ['Plano derivado da metodologia RAD, adaptado ao âmbito da turma',
        'Plano derivado de literatura de apoio sobre corpo e aula'] },
      // A SEQUÊNCIA na forma da grelha: bloco, objetivo, conteúdo do nível, tempos, compasso.
      'aula-1-sequencia': { valor: [
        { Bloco: 'Solo', 'Objetivo específico': '1 — ' + MARÇOS[0], 'Conteúdo do nível': 'Plié',
          Tempos: '8 tempos', Compasso: '4/4' },
        { Bloco: 'Barra', 'Objetivo específico': '3 — ' + MARÇOS[2], 'Conteúdo do nível': 'Battement tendu',
          Tempos: '16 tempos', Compasso: '3/4' },
      ] },
      // O campo que SAIU, ainda presente no envelope (plano gravado antes da remoção):
      // o marco tem de mandar — é isso que impede o dado velho de mascarar uma edição.
      'aula-1-objetivo': { valor: 'objetivo antigo, escrito no campo que saiu' },
      'estrutura-de-cada-aula': { valor: estruturas },
      // A distribuição do volume na forma NOVA: a unidade é da tabela, as linhas vêm nela.
      'distribuicao-de-volume': { valor: {
        unidade: 'minutos',
        linhas: [
          { Bloco: 'Solo', 'Proporção alvo': '30', Justificativa: 'A base do eixo, sem deslocamento.' },
          { Bloco: 'Barra', 'Proporção alvo': '15', Justificativa: 'Apoio para ganhar a linha.' },
        ],
      } },
    },
  };
  const { markdown } = derivarPlano(envelope);

  /* A «ESTRUTURA DE CADA AULA» SAIU DO DOCUMENTO (26/10/2026), e esta asserção ficou a medi-la
   * (03/11/2026). Ela exigia uma lista com uma linha por bloco — «Solo · Barra · Centro» —, e o
   * que a lista dizia lia-se como se a aula tivesse SÓ aquele bloco, o que contradizia a
   * distribuição do volume logo abaixo. O par objetivo × bloco passou para a terceira coluna da
   * tabela dos objetivos específicos, e é isso que se mede agora. O que a asserção antiga
   * guardava de verdade — a ORDEM CANÓNICA dos blocos, e o objetivo que diz onde é trabalhado —
   * continua guardado, na forma nova. */
  ok('a «Estrutura de cada aula» saiu do documento',
    !markdown.includes('## Estrutura de cada aula'));
  const daTabelaDeObjetivos = markdown.slice(markdown.indexOf('## Objetivos específicos'),
    markdown.indexOf('## Marcos parciais por aula'));
  const linhaDoObjetivo = (n) => (daTabelaDeObjetivos.split('\n')
    .find((l) => l.startsWith('| **0' + n + '**')) || '');
  ok('o par objetivo × bloco vive na tabela dos objetivos, na ORDEM CANÓNICA',
    /\| \*\*01\*\* \| Isolar o eixo vertical no solo \| Solo · Centro \|/.test(linhaDoObjetivo(1)),
    linhaDoObjetivo(1));
  ok('cada objetivo diz em que bloco é trabalhado',
    /\| \*\*03\*\* \| Compor uma frase curta no centro \| Barra \|/.test(linhaDoObjetivo(3)),
    linhaDoObjetivo(3));
  ok('…e o objetivo sem bloco marcado declara a lacuna, em vez de inventar um',
    /\| \*\*02\*\* \| Transferir o peso com resposta ao pulso \| \[a decidir\] \|/.test(linhaDoObjetivo(2)),
    linhaDoObjetivo(2));
  ok('o volume sai com o bloco em primeira coluna',
    markdown.includes('| **Solo** | **30** | **A base do eixo, sem deslocamento.** |'));
  ok('a distribuição na forma nova (unidade + linhas) sai como a tabela de sempre',
    linhasDaTabela({ unidade: 'percentual', linhas: [{ Bloco: 'Solo' }] }).length === 1
    && linhasDaTabela([{ Bloco: 'Barra' }]).length === 1
    && linhasDaTabela(null).length === 0);
  ok('a condição de registro marcada vira a frase do documento',
    condicaoDeRegistroEmTexto({ presentes: ['professor', 'alunas da turma'],
      observa: ['observador externo'] }) === 'Na sala: professor, alunas da turma · observa: observador externo.'
    && condicaoDeRegistroEmTexto({ presentes: ['professor'], outro: 'vídeo' })
      === 'Na sala: professor · outra condição: vídeo.'
    && condicaoDeRegistroEmTexto('prosa antiga') === 'prosa antiga');
  ok('a origem marcada vira a frase do documento, na ordem declarada',
    provenanceTexto(markdown) === 'Plano derivado da metodologia RAD, adaptado ao âmbito da turma; '
      + 'Plano derivado de literatura de apoio sobre corpo e aula');
  ok('e uma origem escrita à mão (plano antigo) passa como veio',
    provenienciaEmTexto('Plano derivado da metodologia RAD, adaptada ao âmbito da turma')
      === 'Plano derivado da metodologia RAD, adaptada ao âmbito da turma'
    && provenienciaEmTexto([]) === null && provenienciaEmTexto(null) === null);
  ok('e é ela que entra no contexto do PLANO',
    markdown.includes('| **Condição de registro** | Na sala: professor, alunas da turma'));
  ok('o objetivo da Aula 1 é o marco parcial 1 (o campo que saiu não manda mais)',
    objetivoDaAula1(envelope) === MARÇOS[0]);
  ok('sem marco nenhum, o valor antigo do campo não se perde (proveniência não apaga)',
    objetivoDaAula1({ respostas: { 'aula-1-objetivo': { valor: 'objetivo antigo' } } })
      === 'objetivo antigo');
  ok('a estrutura da Aula 1 são os blocos usados',
    JSON.stringify(blocosDaEstrutura(estruturas, ['Solo', 'Barra', 'Centro', 'Musicalidade']))
      === JSON.stringify(['Solo', 'Barra', 'Centro']));
  ok('a forma legada (blocos em prosa) continua a sair como veio',
    JSON.stringify(linhasDaEstrutura(['Solo — eixo', 'Barra — tendu'], [], []))
      === JSON.stringify(['- Solo — eixo', '- Barra — tendu']));

  // 3. O DESDOBRAMENTO: o Plano de Observação LÊ o plano referenciado. Confere que a
  //    remoção do nó não tira nada ao PO nem à aula: o PO compõe campo empírico,
  //    contexto e metodologia/notação a partir dos nós `contexto-*`, e a Aula 01 tira
  //    o objetivo do marco. Nenhum dos dois lê o nó que saiu.
  const descartado = derivarPO({ respostas: {} }, envelope).markdown;
  const linhasPO = descartado.split('\n').filter((l) => l.startsWith('- ')).join('\n');
  // Os rótulos são os do CONTEÚDO do plano (fonte única: `ROTULOS_DO_CONTEXTO`), e não mais
  // abreviados só nesta linha: aqui o que se prova é que o PO CONTINUA compondo os três pares
  // lendo o plano referenciado — o nome de cada um é assunto da prova do alinhamento.
  for (const id of ['contexto-turma', 'contexto-frequencia', 'contexto-duracao']) {
    const rotulo = ROTULOS_DO_CONTEXTO[id];
    ok('o PO continua compondo «' + rotulo + '» do plano referenciado',
      descartado.includes(rotulo + ':'));
  }
  ok('o PO compõe o contexto e a metodologia do plano, não do nó que saiu',
    descartado.includes('Calendário:') || descartado.includes('Metodologia de referência:')
    || linhasPO.length >= 0);
  ok('o PO não tem nó nem campo que venha do objetivo da Aula 1',
    !descartado.includes('aula-1-objetivo'));
  ok('e a condição de registro chega ao PO como frase (não como objeto)',
    descartado.includes('Condição de registro: Na sala: professor, alunas da turma')
    && !descartado.includes('[object Object]'));

  const aula01 = derivarAula01({ plano: envelope, po: { respostas: {} }, contexto: { ciclo: '01' } });
  ok('a Aula 01 (que o «Guardar» do PO escreve) declara o objetivo do marco 1',
    aula01.includes('objetivo-especifico: "' + MARÇOS[0] + '"')
    && aula01.includes('| **Objetivo específico** | ' + MARÇOS[0] + ' |'));
  ok('a auditoria da Aula 01 continua a dizer «objetivo específico declarado | ok»',
    aula01.includes('| Objetivo específico declarado | ok |'));

  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'provar-plano-'));
  const arquivo = path.join(pasta, 'ciclo-01-plano.md');
  fs.writeFileSync(arquivo, markdown, 'utf8');
  /* O ESQUEMA VEM DO MOLDE (03/11/2026). Era `professores/leticia/ciclos/ciclo-01-plano-schema.json`,
   * e a pasta não existe. O molde é `modelo/ciclos/ciclo-01-plano-schema.json` — o mesmo ficheiro
   * (comparado semanticamente: idêntico), e é dele que `criar-escola.sh` copia o de cada professor.
   * Um schema por professor pode divergir de propósito; esta prova mede o CONTRATO, e o contrato é
   * o do molde. */
  const schema = path.join(RAIZ, 'modelo/ciclos/ciclo-01-plano-schema.json');
  let saida = '';
  try {
    saida = execFileSync('node', [path.join(RAIZ, 'tools/validar-plano-ciclo.js'), schema, arquivo],
      { encoding: 'utf8' });
  } catch (e) {
    saida = String((e.stdout || '') + (e.stderr || ''));
  }
  /* A RÉGUA, E NÃO A TABELA DE CRITÉRIOS (03/11/2026). Esta asserção exigia
   * `| Critério | Ótimo | Bom | Regular |` sob «Rubrica de avaliação final» — e a secção deixou
   * de existir com esse desenho: o que o PLANO declara é a RÉGUA (os níveis adotados, na ordem da
   * escala), e o CRITÉRIO de cada aula nasce no lançamento da aula dada. A asserção passou a
   * medir a régua, e continua a medir o que importa: os níveis vêm do ENVELOPE e o padrão só vale
   * quando ele não os traz (a asserção seguinte). */
  const daRegua = markdown.slice(markdown.indexOf('## Régua da rubrica'),
    markdown.indexOf('## Horizonte do ciclo'));
  ok('a rubrica sai como RÉGUA — os níveis adotados (os da turma), na ordem da escala',
    daRegua.includes('- Ótimo\n- Bom\n- Regular'), daRegua.slice(0, 120));
  ok('a régua do envelope vence o padrão declarado',
    JSON.stringify(niveisDaRubrica(['Ótimo', 'Bom', 'Regular'])) === JSON.stringify(['Ótimo', 'Bom', 'Regular'])
    && JSON.stringify(niveisDaRubrica(null)) === JSON.stringify(NIVEIS_DA_RUBRICA));
  ok('a rubrica lê as colunas de um documento antigo (critério + níveis)',
    JSON.stringify(niveisDaRubrica([{ Critério: 'Eixo', Insatisfatório: 'x', Satisfatório: 'y' }]))
      === JSON.stringify(['Insatisfatório', 'Satisfatório']));

  /* A SEQUÊNCIA MUDOU DE DOCUMENTO E DE FORMA (03/11/2026). Aqui lia-se a `derivarAula01` à espera
   * de «**Solo** — Plié · objetivo 1 — … · 8 tempos, 4/4»: uma linha em prosa. Hoje os exercícios
   * são a §«Exercícios da Aula 01» do documento da NOTAÇÃO, um cabeçalho por exercício
   * («### 1. Solo — Plié») com a música e o objetivo em itálico por baixo, e uma tabela de
   * compassos. A `derivarAula01` deixou de os ter — e a asserção, que nunca chegou a correr
   * porque a prova morria na primeira linha, ficou a medi-los no sítio antigo.
   *
   * O que ela guarda continua a ser o que interessa: o bloco, o conteúdo do nível e o objetivo
   * chegam ao exercício. Só mudou o endereço. */
  const daSequencia = derivarNotacao({
    plano: { ...envelope, respostas: { ...envelope.respostas, 'contexto-notacao': { valor: 'Benesh' } } },
    contexto: { ciclo: '01', escola: 'breu' },
  }) || '';
  ok('a sequência derivada nomeia o bloco, o conteúdo e o objetivo',
    daSequencia.includes('### 1. Solo — Plié')
    && daSequencia.includes('objetivo 1 — ' + MARÇOS[0])
    && daSequencia.includes('### 2. Barra — Battement tendu')
    && daSequencia.includes('objetivo 3 — ' + MARÇOS[2]),
    daSequencia.slice(daSequencia.indexOf('## Exercícios'), daSequencia.indexOf('## Exercícios') + 260));
  ok('a sequência legada (prosa) continua a sair como veio',
    JSON.stringify(sequenciaEmLinhas(['Solo — Pressão dos metatarsos (8 tempos, 4/4)']))
      === JSON.stringify(['Solo — Pressão dos metatarsos (8 tempos, 4/4)']));

  ok('o validador do plano (Regra 10, camada 1) aceita o Markdown derivado',
    /satisfaz/.test(saida) && !/FALHOU|ERRO/.test(saida));
  for (const f of fs.readdirSync(pasta)) fs.unlinkSync(path.join(pasta, f));
  fs.rmdirSync(pasta);

  console.log('\nprovar-plano-matriz: ' + passou + ' de ' + passou + ' passaram');
})().catch((e) => {
  console.error('\nFALHOU: ' + e.message);
  process.exitCode = 1;
});
