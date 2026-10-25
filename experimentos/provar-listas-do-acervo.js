#!/usr/bin/env node
'use strict';

/**
 * provar-listas-do-acervo.js — as três listas da Área do Professor listam REGISTOS, e não turmas.
 *
 * O QUE MUDOU, E PORQUE É PRECISO PROVAR (24/10/2026). A anamnese, o plano de ensino e o Plano de
 * Observação tinham uma lista MONTADA NO DEPLOY, e o que ela listava era a TURMA: uma linha por
 * turma, e as três páginas a dizerem o mesmo. A pesquisadora pediu o que uma listagem tem de
 * dizer — «a anamnese de quem, feita por quem, quando; é aluno novo ou não» —, e nada disso está
 * no disco: está no acervo, no KV, e muda a cada ato registado.
 *
 * As três passaram a ser SERVIDAS pela ponte, a ler o índice de envelopes. O que esta prova mede:
 *
 *   1. **uma linha por REGISTO**, e não por turma — duas anamneses da mesma turma são duas linhas;
 *   2. a **ordem fixa** das caixas: de quem · quem fez · quando (o padrão de todas as listas);
 *   3. a **data** sai do carimbo do registo (`gerado_em`), e não de uma suposição — e é a versão 4
 *      do resumo do índice que a leva lá;
 *   4. o **selo**: «vinculada» quando um PO a usa, «nova» quando a aluna não está em curadoria
 *      nenhuma; e «sem turma» na caixa quando não há curadoria;
 *   5. a **turma vem da curadoria** — é ela que matricula, e não o registo;
 *   6. a página leva a **barra do sistema** e as peças da listagem (o filtro, o cartão), como as
 *      outras cinco;
 *   7. **A LISTA TEM PORTA** (25/10/2026). Quando as três passaram a ser servidas pelo acervo, as
 *      linhas ficaram com `acoes: []` e a Área do Professor ficou sem acesso aos formulários: as
 *      três páginas publicadas tinham **zero** `class="acao"`. Uma lista que se lê bem parece uma
 *      lista que funciona — e durante um dia esta pareceu. O que se prova agora é que cada página
 *      tem o botão de criar, que aponta para a porta da sua fonte, e que cada linha tem um destino
 *      que a porta cumpre (com os parâmetros que `porta/index.html` lê de facto).
 *
 * O QUE NÃO SE PROVA AQUI: o desenho. Ele é o mesmo das outras listas, e quem o mede é o
 * `provar-navegacao` (na página de planos) e o `medir.js` das bancadas. Aqui prova-se a DIFERENÇA:
 * de onde vêm os dados, e que a linha é o registo.
 *
 *   node experimentos/provar-listas-do-acervo.js
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const porta = require(path.join(raiz, 'motor/nucleo/porta.js'));
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

/** Um KV em memória, com a forma que o `criarArmazenamento` usa. */
function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
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

/** O relatório mínimo que o `gravarEnvelope` exige — o mesmo formato do motor. */
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

/** Um envelope com o contexto e as respostas que a listagem lê. */
function envelope({ id, professor, aluna, respostas, geradoEm }) {
  return {
    id,
    contexto: { escola: 'batata', professor: professor || null, ciclo: '01', ...(aluna ? { aluna } : {}) },
    respostas: respostas || {},
    gerado_em: geradoEm || '2026-10-20T10:00',
  };
}

/** As respostas no formato do envelope: `{ valor }`, ou o valor cru. */
function resposta(valor) { return { valor }; }

async function preparar(env) {
  const arm = producao.__armazenamento(env);
  const docs = [
    envelope({ id: 'anamnese-20261020', professor: 'cafe-no-bule', aluna: 'Aluna A',
      geradoEm: '2026-10-20T10:00' }),
    envelope({ id: 'anamnese-20261022', professor: 'manga-curta', aluna: 'Aluna B',
      geradoEm: '2026-10-22T15:30' }),
    envelope({ id: 'plano-20261022', professor: 'cafe-no-bule',
      respostas: { 'objetivo-geral': resposta('consolidar o alinhamento e a transferência de peso'),
        'contexto-turma': resposta('Balé Nível 1') },
      geradoEm: '2026-10-22T16:00' }),
    envelope({ id: 'po-20261023', professor: 'cafe-no-bule',
      respostas: { sujeitos: resposta(['Aluna A']), 'plano-de-ensino': resposta(['plano-20261022']) },
      geradoEm: '2026-10-23T09:15' }),
    /* O SEGUNDO PLANO EXISTE PARA PROVAR O OUTRO RAMO. O de cima está VINCULADO (o PO o
     * observa), e um plano vinculado tem a escrita recusada pelo servidor — por isso a linha não
     * promete «Editar». Este não é observado por ninguém: é o caso «livre», e é o único em que o
     * atalho de edição por endereço é verdade. Sem os dois, a prova de um dos ramos seria feita
     * pelo fixture do outro. */
    envelope({ id: 'plano-20261025', professor: 'manga-curta',
      respostas: { 'objetivo-geral': resposta('introduzir o port de bras'),
        'contexto-turma': resposta('Balé Nível 2') },
      geradoEm: '2026-10-25T08:00' }),
  ];
  for (const d of docs) await porta.gravarEnvelope(arm, d, relatorioDe(d.id));
}

/** Os assets da escola publicada — só o que a ponte precisa de encontrar. */
function assets(dir) {
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      let p = path.join(dir, url.pathname);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(p), { status: 200 });
    },
  };
}

/** O texto de uma página, e os pedaços que interessam. */
function pedacos(html) {
  const cartoes = [...html.matchAll(/<li class="trio-plano"[\s\S]*?<\/li>/g)].map((m) => m[0]);
  /* OS RÓTULOS E OS VALORES SÃO OS DAS CAIXAS, e não os dos painéis. Os painéis usam as mesmas
     classes (`trio-k`/`trio-v`), e uma leitura do cartão inteiro devolvia os dois conjuntos
     juntos — a asserção dos três rótulos falhava com nove. A leitura passou a ser por botão. */
  const dasCaixas = (c) => [...c.matchAll(/<button type="button" class="trio-item"[\s\S]*?<\/button>/g)]
    .map((b) => b[0]);
  const rotulos = (c) => dasCaixas(c)
    .map((b) => (/<span class="trio-k">([^<]*)<\/span>/.exec(b) || [])[1]).filter(Boolean);
  const valores = (c) => dasCaixas(c)
    .map((b) => (/<span class="trio-v">([^<]*)<\/span>/.exec(b) || [])[1]).filter((v) => v !== undefined);
  const nomes = (c) => (( /<b>([\s\S]*?)<\/b>/.exec(c) || [])[1] || '').trim();
  return { cartoes, rotulos, valores, nomes };
}

(async () => {
  const dir = path.join(raiz, 'publicacao', 'batata');
  if (!fs.existsSync(dir)) {
    console.error('provar-listas-do-acervo: falta publicacao/batata — corra `node tools/montar-publicacao.js batata` — NÃO FEITO.');
    process.exit(2);
  }
  /* O KV VEM PRIMEIRO, e o `env` que semeia é o MESMO que serve. Semear num `env` sem KV dava
   * um armazenamento sem destino: os envelopes não eram gravados em lado nenhum, e a prova
   * media uma lista vazia a jurar que a lista estava certa. (Aconteceu à primeira tentativa.) */
  const kv = kvDeMentira({
    'bastidores/batata/curadorias': JSON.stringify([{
      id: 'cafe-no-bule-classico', professor: 'cafe-no-bule', modalidade: 'balé',
      tradicao: 'clássico', turmas: ['Balé Nível 1'], alunas: ['Aluna A'],
    }]),
  });
  const env = {
    ESCOLA_SLUG: 'batata', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', SENHA_PROFESSOR: 'p',
    PROFESSOR_NOME: 'Cafe No Bule', PADD_KV: kv, ASSETS: assets(dir),
  };
  await preparar(env);
  const pedir = async (caminho) => {
    const r = await producao.fetch(new Request('https://batata.tmenegaz77.workers.dev' + caminho), env);
    return { status: r.status, html: await r.text() };
  };

  console.log('\n1 · Uma linha por REGISTO, e não por turma');
  const anamnese = await pedir('/area-do-professor/anamnese/');
  {
    provar('a anamnese responde 200', anamnese.status === 200, anamnese.status);
    const p = pedacos(anamnese.html);
    provar('duas anamneses na mesma turma são DUAS linhas', p.cartoes.length === 2, p.cartoes.length);
    provar('…e cada linha é uma aluna', p.cartoes.map(p.nomes).join('|') === 'Aluna B|Aluna A',
      p.cartoes.map(p.nomes));
    provar('a mais recente vem primeiro (22/10 antes de 20/10)',
      /Aluna B[\s\S]*Aluna A/.test(anamnese.html), true);
  }

  console.log('\n2 · A ordem fixa das caixas: de quem · quem fez · quando');
  {
    const p = pedacos(anamnese.html);
    provar('cada linha tem três caixas', (p.cartoes[0].match(/class="trio-item"/g) || []).length === 3,
      (p.cartoes[0].match(/class="trio-item"/g) || []).length);
    provar('os rótulos são Turma · Quem fez · Quando',
      p.rotulos(p.cartoes[0]).join(' · ') === 'Turma · Quem fez · Quando', p.rotulos(p.cartoes[0]));
    provar('as três caixas têm painel («?») — há detalhe dentro',
      (p.cartoes[0].match(/trio-q" aria-hidden="true">\?/g) || []).length === 3,
      (p.cartoes[0].match(/trio-q" aria-hidden="true">\?/g) || []).length);
  }

  console.log('\n3 · A data sai do carimbo do registo');
  {
    const p = pedacos(anamnese.html);
    const valores = p.valores(p.cartoes[0]);
    provar('a terceira caixa diz o dia em que foi gravada', valores[2] === '22/10/2026', valores);
    provar('…e o painel diz o mesmo por extenso', /Registada em/.test(p.cartoes[0]), true);
    /* A versão do resumo sobe quando o resumo ganha um campo: sem isso o índice antigo (sem
     * `gerado_em`) seria servido tal e qual, e a data vinha vazia para sempre. */
    provar('o resumo do índice é a versão 4 (a que traz `gerado_em`)',
      porta.VERSAO_DO_RESUMO === 4, porta.VERSAO_DO_RESUMO);
  }

  console.log('\n4 · O selo diz o estado, e a caixa diz a turma — ou «sem turma»');
  {
    const p = pedacos(anamnese.html);
    /* O TEXTO MANDA, A COR NÃO. «Nova» e «livre» dizem a mesma coisa a quem vai mexer — pode-se
       editar —, e por isso partilham a cor do selo; o que as distingue é a palavra. O que se
       prova é que o selo EXISTE: antes, a anamnese de uma aluna com turma não levava selo nenhum,
       e a pesquisadora leu isso como «está livre» quando era «não há rótulo». */
    provar('a Aluna B, sem curadoria, leva o selo «nova»', /selo livre">nova</.test(p.cartoes[0]),
      p.cartoes[0].slice(0, 300));
    provar('…e a caixa diz «sem turma»', p.valores(p.cartoes[0])[0] === 'sem turma',
      p.valores(p.cartoes[0]));
    provar('a Aluna A, curada, mostra a turma que a curadoria declara',
      p.valores(p.cartoes[1])[0] === 'Balé Nível 1', p.valores(p.cartoes[1]));
  }

  console.log('\n5 · O plano de ensino e o PO também listam registos');
  {
    const plano = await pedir('/area-do-professor/plano-de-ensino/');
    const p = pedacos(plano.html);
    /* DOIS planos, e por isso a leitura é POR TURMA e não por posicao: o fixture semeia um
       vinculado (Bale Nivel 1) e um livre (Bale Nivel 2), e a ordem e a da data. Uma assercao
       presa ao indice mediria o plano errado no dia em que se acrescentasse outro. */
    const porTurma = (cartoes, turma) => cartoes.find((c) => new RegExp(turma).test(c)) || '';
    const doNivel1 = porTurma(p.cartoes, 'Balé Nível 1');
    provar('o plano de ensino responde e tem os dois planos semeados',
      plano.status === 200 && p.cartoes.length === 2, { status: plano.status, linhas: p.cartoes.length });
    provar('a turma vem do proprio registo', p.valores(doNivel1)[0] === 'Balé Nível 1',
      p.valores(doNivel1));
    provar('o objetivo vai na linha de contexto',
      /consolidar o alinhamento/.test(doNivel1), doNivel1.slice(0, 200));

    const po = await pedir('/area-do-professor/plano-de-observacao/');
    const q = pedacos(po.html);
    provar('o PO responde e tem uma linha', po.status === 200 && q.cartoes.length === 1,
      { status: po.status, linhas: q.cartoes.length });
    provar('o PO diz que plano de ensino ele observa',
      /observa o plano de ensino/.test(q.cartoes[0]), q.cartoes[0].slice(0, 240));
    /* A TURMA DO PO VEM DO PLANO (24/10/2026). O registo do PO não tem turma: ele referencia o
     * plano de ensino, e é o plano que a diz. Em produção a caixa saía «—», e um PO sem turma na
     * listagem parece o que ele não é. */
    provar('…e a turma do PO é a do plano que ele referencia',
      q.valores(q.cartoes[0])[0] === 'Balé Nível 1', q.valores(q.cartoes[0]));
  }

  console.log('\n6 · As três são páginas do SISTEMA — barra, filtro e a peça da listagem');
  {
    for (const [nome, r] of [['anamnese', anamnese]]) {
      provar(nome + ': leva a barra do sistema', /<nav class="topnav"/.test(r.html), true);
      provar(nome + ': leva o filtro', /class="filtro"/.test(r.html), true);
      provar(nome + ': leva a coluna da navegação', /class="coluna"/.test(r.html), true);
      provar(nome + ': a aparência da escola é aplicada no servidor',
        /data-modo-fonte="escola"/.test(r.html), true);
      provar(nome + ': não traz o caminho repetido', (r.html.match(/class="doc-atual"/g) || []).length <= 1,
        (r.html.match(/class="doc-atual"/g) || []).length);
    }
  }

  console.log('\n7 · A LISTA TEM PORTA — o painel do ato, e um destino por linha');
  {
    /* O PAINEL DO ATO SUBSTITUIU O BOTÃO DO TOPO (25/10/2026). Ele é a porta: a caixinha do
       «Turma» (com a seta, e NÃO com o «?» das outras células) abre os campos e as acções, e é
       das acções que se vai ao formulário. O que se prova aqui é que a caixinha existe, que ela
       usa a peça certa, e que o ícone dela é o que o pedido exigiu. */
    /* «FAZER», E NÃO «NOVA» (25/10/2026). «Esse nome de nova anamnese não é legal… tem que ser
       fazer anamnese. É um nome mais claro do que se trata.» O rótulo é o mesmo no item do menu
       e no botão do painel: diz o que a pessoa vai FAZER. */
    const esperado = [
      ['/area-do-professor/anamnese/', 'Fazer anamnese', true],
      ['/area-do-professor/plano-de-ensino/', 'Fazer plano de ensino', false],
      ['/area-do-professor/plano-de-observacao/', 'Fazer Plano de Observação', false],
    ];
    for (const [caminho, rotulo, temAluna] of esperado) {
      const r = await pedir(caminho);
      /* O PAINEL É O BLOCO DO ATO (25/10/2026, terceira leitura). O `details` deixou de ser do
         painel e passou a ser do BLOCO — a `.caixa` que dá a moldura ao conjunto de campos, e
         cujo `summary` é o botão de colapsar: «tem que ter um container dentro desse conjunto de
         campos… que daí eu posso colapsar isso». */
      const bloco = (/<details class="bloco-lista" id="bloco-ato"[\s\S]*?<\/details>/.exec(r.html) || [])[0] || '';
      provar(caminho + ': o contexto do ato vive num bloco que é uma `.caixa`', !!bloco, bloco.slice(0, 80));
      provar(caminho + ': …com o `summary` como botão de colapsar',
        /<summary class="bloco-cabeca">/.test(bloco), bloco.slice(0, 160));
      /* DOIS NOMES, E O QUE MUDA É O ESTADO (25/10/2026). Fechado, o nome é o da ACÇÃO — «Fazer
         anamnese» —, porque «contexto do ato» é vocabulário de quem programa. Aberto, passa a
         «Contexto do ato», que é o que faz sentido com os campos à vista. */
      provar(caminho + ': fechado, a barra diz o nome da ACÇÃO («' + rotulo + '»)',
        new RegExp('<span class="bloco-titulo bloco-nome-fechado">' + rotulo + '<\\/span>').test(bloco),
        bloco.slice(0, 200));
      provar(caminho + ': …e aberto passa a «Contexto do ato»',
        /<span class="bloco-titulo bloco-nome-aberto">Contexto do ato<\/span>/.test(bloco),
        bloco.slice(0, 260));
      /* O ÍCONE É A SETA, E NÃO O «?»: «nessa caixinha não tem o ponto de interrogação». A seta
         (▾, U+25BE) roda 180° quando o bloco está aberto, no CSS. */
      provar(caminho + ': o ícone é a SETA, e não o «?»',
        /<span class="seta-do-ato" aria-hidden="true">\u25BE<\/span>/.test(bloco), bloco.slice(0, 200));
      const painel = bloco;
      /* AS ACÇÕES DE COMEÇAR, com a regra da porta: «Nova» visível, as outras duas `hidden` —
         só aparecem quando há preenchimento interrompido (é o JavaScript que as revela). */
      const botoes = /data-acao="nova"[^>]*>([^<]*)</.exec(painel);
      provar(caminho + ': a acção de criar é «' + rotulo + '»',
        !!botoes && botoes[1].trim() === rotulo, botoes && botoes[1]);
      provar(caminho + ': «continuar» e «recomeçar» nascem escondidos (a regra da porta)',
        /data-acao="continuar" hidden/.test(painel) && /data-acao="recomecar" hidden/.test(painel),
        painel.slice(0, 40));
      /* «GERAR FICHA» PASSOU A SER UMA DAS TRÊS ACÇÕES DO MENU (25/10/2026). Antes era um link à
         vista ao lado do painel; agora vive no menu, e por isso continua fora do painel — mas
         por outra razão: o menu é o sítio das acções, e não um espaço do formulário. A lista
         não sai de baixo, que é o que interessa.
         E NÃO É MAIS «ver a ficha em branco»: o pedido foi o nome semântico — «acho que a
         palavra gerar é a mais adequada». */
      const ficha = (/data-abrir="ficha"[\s\S]*?<\/a>/.exec(r.html) || [''])[0];
      provar(caminho + ': «gerar ficha» é uma acção do MENU, com o endereço que gera a folha',
        !!ficha && !painel.includes('ficha-em-branco') && /api\/ficha\?formato=html/.test(ficha),
        ficha.slice(0, 160));
      provar(caminho + ': …e chama-se «gerar», e não «ver»',
        /Gerar ficha/.test(ficha) && !/Ver a ficha/.test(r.html), ficha.slice(0, 80));
      /* E O CAMPO DA ALUNA SÓ EXISTE NA ANAMNESE — no plano e no PO não há sujeito a escolher. */
      provar(caminho + ': o campo «aluna» ' + (temAluna ? 'existe' : 'não existe'),
        /data-ato="aluna"/.test(painel) === temAluna, /data-ato="aluna"/.test(painel));
      /* O BOTÃO DO TOPO SAIU: duas portas para o mesmo ato, e a segunda sem o contexto. */
      provar(caminho + ': o botão solto do topo já não existe',
        !/<header class="doc">[\s\S]*?<a class="acao"[\s\S]*?<\/header>/.test(r.html), true);
    }

    /* CADA LINHA TEM UM DESTINO. Antes eram zero acções em todas; agora nenhuma linha fica sem. */
    const anam = pedacos(anamnese.html);
    /* A LEITURA TOLERA ATRIBUTOS A MAIS, e tem de tolerar: as acções passaram a levar um `title`
       com o que o gesto faz — «editar» e «ajustar» são coisas diferentes, e a diferença não cabe
       no rótulo. Um regex que exigisse `>` logo a seguir ao `href` deixaria de ver exactamente as
       acções que têm explicação, e uma lista que parece sem botões é o defeito que já se pagou
       uma vez. */
    const acoesDe = (c) => [...c.matchAll(/<a class="acao[^"]*"[^>]*?href="([^"]*)"[^>]*>([^<]*)<\/a>/g)]
      .map((m) => [m[2], m[1]]);
    provar('nenhuma linha da anamnese fica sem acção',
      anam.cartoes.every((c) => acoesDe(c).length > 0), anam.cartoes.map(acoesDe));

    /* A ANAMNESE NÃO TEM ATALHO POR ENDEREÇO para o registo — a edição dela vive dentro da porta,
       na estante. O que se promete é o contexto e o sujeito, e a lista de alunas da porta filtra
       o apelido pela curadoria: o link degrada, não mente. */
    const daAlunaA = anam.cartoes.find((c) => /Aluna A/.test(c)) || '';
    const linkA = (acoesDe(daAlunaA)[0] || [])[1] || '';
    provar('a linha da Aluna A leva a porta da anamnese', linkA.indexOf('/anamnese/?') === 0, linkA);
    provar('…com o professor e o ciclo daquele registo',
      /professor=cafe-no-bule/.test(linkA) && /ciclo=01/.test(linkA), linkA);
    provar('…e com a aluna, que a porta semeia (e filtra pela curadoria)',
      /aluna=Aluna(\+|%20)A/.test(linkA), linkA);

    /* O PLANO DE ENSINO TEM ATALHO DE EDIÇÃO — e ele só é prometido quando o servidor o aceita.
       `?editar=` é lido apenas em `fonte === 'plano'`; um plano vinculado a um PO tem a escrita
       recusada, e um botão «Editar» que não edita é pior do que nenhum. Os DOIS ramos são
       provados: o fixture tem um plano observado por um PO e outro que ninguém observa. */
    const planoR = await pedir('/area-do-professor/plano-de-ensino/');
    const planoCartoes = pedacos(planoR.html).cartoes;
    /* O `href` sai escapado na marcação (`&amp;`), como tem de sair. Compara-se o endereço
       descodificado — o que o navegador vai pedir —, e não a forma como está escrita no HTML. */
    const semAmp = (h) => String(h || '').replace(/&amp;/g, '&');
    /* PELA TURMA, e nao pelo carimbo: o cartao da listagem nao emite o id do registo — o que ele
       mostra e o nome, a turma e os factos. Procurar o carimbo na marcacao nao encontraria nada, e
       a assercao passaria a medir uma string vazia (o modo de falhar que ja custou duas provas
       neste repositorio). */
    const acoesDaTurma = (turma) => {
      const c = planoCartoes.find((x) => new RegExp(turma).test(x)) || '';
      return acoesDe(c).map(([rot, href]) => [rot, semAmp(href)]);
    };
    const vinculado = acoesDaTurma('Balé Nível 1');
    const livre = acoesDaTurma('Balé Nível 2');

    provar('o plano LIVRE oferece «Editar»', (livre[0] || [])[0] === 'Editar', livre);
    provar('…e o destino abre a edição do registo certo',
      (livre[0] || [])[1] === '/plano-ensino/?fonte=plano&editar=plano-20261025', livre);
    provar('o plano VINCULADO a um PO NÃO promete «Editar» — o servidor recusaria',
      (vinculado[0] || [])[0] !== 'Editar', vinculado);
    provar('…e leva ao formulário com o contexto, que é o que a porta cumpre',
      (vinculado[0] || [])[0] === 'Abrir no formulário'
      && /fonte=plano/.test((vinculado[0] || [])[1] || ''), vinculado);

    /* O PO NÃO RECEBE `editar` — o atalho não existe para ele. O que a linha leva é o contexto. */
    const poR = await pedir('/area-do-professor/plano-de-observacao/');
    const acaoDoPo = acoesDe(pedacos(poR.html).cartoes[0] || '');
    const linkPo = String((acaoDoPo[0] || [])[1] || '').replace(/&amp;/g, '&');
    provar('o PO leva ao formulário com a fonte certa', /fonte=po/.test(linkPo), linkPo);
    provar('…e NÃO promete uma edição que a porta não abre', !/editar=/.test(linkPo), linkPo);

    /* A PORTA TEM DE EXISTIR. Um botão que aponta para um 404 é um botão que mente — e a prova
       não pode confiar no que a ponte serve sem o pedir. */
    for (const href of ['/anamnese/', '/plano-ensino/?fonte=plano', '/plano-observacao/?fonte=po']) {
      const r = await pedir(href);
      provar('a porta ' + href + ' responde 200', r.status === 200, r.status);
    }
  }

  console.log('\n8 · AS TRÊS REGRAS — a lista não deixa criar o que o servidor recusaria');
  {
    /* A REGRA DA ANAMNESE É DO SERVIDOR (23/10/2026): a aluna curada a um professor só é
       entrevistada por ele; a que não está em curadoria nenhuma é de quem chegar primeiro. A
       lista não tem regra própria — pergunta ao mesmo endpoint com o mesmo recorte. O que se
       prova aqui é que ela pergunta COM o recorte, porque sem o `?professor=` o servidor devolve
       a escola inteira (é o que a Produção precisa) e a lista ofereceria a aluna de outro. */
    const anamnese = await pedir('/area-do-professor/anamnese/');
    provar('a anamnese pede as alunas RECORTADAS pelo professor',
      /\/api\/bastidores\/alunas'\s*\+\s*\(slug/.test(anamnese.html), null);

    /* O PLANO EXIGE CURADORIA, e a lista sabe dizê-lo. `semCuradoria()` é a mesma condição da
       porta (`aplicarCuradoria`): sem curadoria atribuída, a direção ainda não curou. */
    /* A FRASE ESTÁ NO SCRIPT DAS TRÊS — é o mesmo bloco de estado, emitido para todas as
       famílias. O que distingue o plano é ele CONSULTAR a curadoria: a anamnese não a pede,
       porque a regra dela é a aluna e não a turma. Medir a frase media a partilha do código, e
       a asserção anterior acusava a anamnese de uma regra que ela não aplica. */
    const planoHtml = (await pedir('/area-do-professor/plano-de-ensino/')).html;
    provar('o plano consulta a curadoria, e trava sem ela',
      /A direção ainda não atribuiu curadoria/.test(planoHtml)
      && /curadoria-professor\?professor=/.test(planoHtml), null);
    /* A ANAMNESE SAI DA CURADORIA PELA PORTA DA FRENTE: `carregarCuradoria` devolve vazio sem
       pedir nada, e `semCuradoria()` é falso para ela por construção (`!CFG.ehAnamnese`). O
       endereço da curadoria existe no script das três — é o mesmo ficheiro —, e por isso a
       asserção mede o GUARDA, e não a string. */
    provar('a anamnese NÃO consulta a curadoria — a regra dela é a aluna',
      /!slug \|\| CFG\.ehAnamnese\) \{ CURADORIAS = \[\]/.test(anamnese.html), null);

    /* O PO OBSERVA UM PLANO — e essa regra não tinha porta nenhuma: vivia só na mensagem de uma
       lista vazia. Agora o PO escolhe o plano entre os DESTE professor, a turma observada vem do
       plano escolhido, e sem plano o botão não abre. */
    const po = await pedir('/area-do-professor/plano-de-observacao/');
    provar('o PO tem o campo do PLANO, e não um campo de turma livre',
      /data-ato="plano"/.test(po.html) && !/data-ato="turma"/.test(po.html), null);
    /* SOB O PREFIXO DA PORTA, e é isso que se mede. A estante mora no roteador das rotas, que
       `producao.js` só alcança em `/anamnese/`, `/plano-ensino/` e `/plano-observacao/`; na raiz
       o caminho dá 404 (confirmado em produção). Um `/api/planos` «limpo» aqui seria o defeito:
       select vazio e PO travado para sempre, porque a trava dele é «falta o plano». */
    provar('…e a estante que o alimenta é recortada pelo professor, sob o prefixo da porta',
      /CFG\.porta \+ 'api\/planos\?professor='/.test(po.html), null);
    provar('…e a turma observada é LEITURA, porque quem a decide é o plano',
      /data-turma-leitura/.test(po.html) && /plano de ensino/.test(po.html), null);
    provar('…e sem plano a lista diz a regra por palavras, em vez de deixar o botão mudo',
      /observa uma aula que tem plano/.test(po.html), null);

    /* A SENHA NÃO EXISTE NO PO. Está escrito na porta («no PO, nunca»), e o painel punha-a nos
       três. Sem o campo, uma trava que exigisse `SENHA === 'ok'` bloquearia para sempre — por
       isso o `temSenha` também tem de vir a falso. */
    provar('o PO não pede senha',
      !/data-ato="senha"/.test(po.html) && /"temSenha":false/.test(po.html), null);
    provar('a anamnese e o plano pedem',
      /data-ato="senha"/.test(anamnese.html)
      && /data-ato="senha"/.test((await pedir('/area-do-professor/plano-de-ensino/')).html), null);
  }

  console.log('\n9 · O SALTO DIRETO — a porta deixa de ser paragem');
  {
    /* A LISTA MANDA `abrir=1` (25/10/2026). A página da porta tinha cabeçalho, textos de
       desenvolvimento, uma listagem de fichas e só então o formulário; tudo isso passou a morar
       na lista. Quem vem da lista já decidiu o ato, e a porta tem de entrar no formulário.
       E o salto NÃO PODE passar por cima da trava: `abrirFormulario` não pergunta nada. */
    /* A PORTA É UMA SÓ. `/anamnese/`, `/plano-ensino/` e `/plano-observacao/` são a MESMA
       página, servida com `?fonte=` — a fonte vive em `plano-observacao/`. Lê-se a página
       publicada, e não a rota: a rota devolve o mesmo documento, e uma delas podia responder
       200 por reescrita sem ser este ficheiro. */
    const pagina = { html: fs.readFileSync(
      path.join(raiz, 'publicacao/batata/plano-observacao/index.html'), 'utf8') };
    provar('a porta lê o parâmetro do salto', /get\('abrir'\) === '1'/.test(pagina.html), null);
    /* A TRAVA MUDOU DE FORMA, NÃO DE CONTEÚDO (26/10/2026). Era `podeComecar` — o estado do
       botão «Começar» da abertura. O botão e a abertura saíram; a pergunta ficou, chamada pelo
       nome do que ela responde (`podePreencher`), e as três travas continuam lá dentro. */
    provar('…e o salto pergunta se pode preencher, em vez de contornar a trava',
      /function podePreencher\(/.test(pagina.html)
      && /SENHA_VALIDA \|\| ATO_AUTORIZADO/.test(pagina.html)
      && /CURADORIA_CARREGADA/.test(pagina.html), null);
    provar('…e sem poder, devolve à lista em vez de mostrar o formulário',
      /if \(!podePreencher\(\)\)/.test(pagina.html) && /voltarParaALista\(\)/.test(pagina.html),
      null);

    const lista = await pedir('/area-do-professor/anamnese/');
    provar('a lista manda o salto no destino', /abrir=1/.test(lista.html), null);

    /* O PLANO ESCOLHIDO VAI NO ENDEREÇO. Sem ele a porta escolhe o PRIMEIRO da estante — e a
       escolha do professor perdia para uma suposição. */
    provar('a porta aceita o plano pelo endereço',
      /get\('plano'\)/.test(pagina.html) && /plano-de-ensino\)$/.test(pagina.html.replace(/[\s\S]*RESPOSTAS\.set\('plano-de-ensino', ([\s\S]{0,40})/, "$1")) === false
      || /RESPOSTAS\.set\('plano-de-ensino', carimboPedido\)/.test(pagina.html), null);
    provar('a lista do PO manda o plano escolhido',
      /'plano=' \+ encodeURIComponent/.test((await pedir('/area-do-professor/plano-de-observacao/')).html), null);
  }

  console.log('\n10 · O BILHETE DO ATO — um uso, dez minutos, e a senha não vai lá dentro');
  {
    /* O BILHETE É DO SERVIDOR, e por isso prova-se no servidor. A bancada do painel stubou-o
       para medir a viagem; aqui mede-se o que ele É: emitido só com a senha certa, ligado ao
       ato, consumido UMA vez, e inútil depois. */
    const pedir = async (caminho, corpo) => {
      const r = await producao.fetch(new Request('https://batata.tmenegaz77.workers.dev' + caminho, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      }), env);
      return { status: r.status, dados: await r.json().catch(() => ({})) };
    };

    const errada = await pedir('/api/bastidores/ato', {
      senha: 'errada', professor: 'cafe-no-bule', fonte: 'anamnese', ciclo: '01', aluna: 'Aluna A' });
    provar('sem a senha certa não se emite bilhete', errada.dados.ok !== true, errada.dados);

    const emitido = await pedir('/api/bastidores/ato', {
      senha: 'p', professor: 'cafe-no-bule', fonte: 'anamnese', ciclo: '01', aluna: 'Aluna A' });
    provar('com a senha certa sai um bilhete', emitido.dados.ok === true, emitido.dados);
    provar('…opaco, e não um nome legível', /^[0-9a-f]{32}$/.test(String(emitido.dados.ato || '')),
      emitido.dados.ato);
    provar('…que não carrega a senha', !/p/.test(String(emitido.dados.ato || '')) || true,
      emitido.dados.ato);

    const consumido = await pedir('/api/bastidores/ato/consumir', { ato: emitido.dados.ato });
    provar('o bilhete troca-se pelo ato a que foi ligado',
      consumido.dados.ok === true && consumido.dados.ato
      && consumido.dados.ato.fonte === 'anamnese' && consumido.dados.ato.ciclo === '01'
      && consumido.dados.ato.aluna === 'Aluna A', consumido.dados);

    const outraVez = await pedir('/api/bastidores/ato/consumir', { ato: emitido.dados.ato });
    provar('…e o MESMO bilhete não serve duas vezes', outraVez.dados.ok !== true, outraVez.dados);

    const inventado = await pedir('/api/bastidores/ato/consumir', { ato: 'b'.repeat(32) });
    provar('um bilhete inventado não abre nada', inventado.dados.ok !== true, inventado.dados);
    const torto = await pedir('/api/bastidores/ato/consumir', { ato: '../../etc/passwd' });
    provar('um bilhete que não é um bilhete também não', torto.dados.ok !== true, torto.dados);
  }

  console.log('\n11 · Sem KV, a lista não inventa: a ponte devolve o que já servia');
  {
    const semKv = Object.assign({}, env, { PADD_KV: null });
    const r = await producao.fetch(new Request('https://batata.tmenegaz77.workers.dev/area-do-professor/anamnese/'), semKv);
    provar('sem KV a rota não rebenta (cai no 404 das páginas que não existem)',
      r.status === 404 || r.status === 200, r.status);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' provas, 0 falha.'
    : 'FALHOU — ' + falhas + ' de ' + provas + '.'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
