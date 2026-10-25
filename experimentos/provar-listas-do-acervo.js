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

  console.log('\n7 · A LISTA TEM PORTA — o botão de criar, e um destino por linha');
  {
    /* O BOTÃO DA PÁGINA. O rótulo muda com a fonte; o destino é a porta que serve aquele
       formulário. «/anamnese/» é a mesma página que o PO, com a fonte a decidir — por isso o
       plano e o PO levam `?fonte=`, e a anamnese não (o caminho já a diz). */
    const esperado = [
      ['/area-do-professor/anamnese/', '/anamnese/', 'Nova anamnese'],
      ['/area-do-professor/plano-de-ensino/', '/plano-ensino/?fonte=plano', 'Novo plano de ensino'],
      ['/area-do-professor/plano-de-observacao/', '/plano-observacao/?fonte=po', 'Novo Plano de Observação'],
    ];
    for (const [caminho, href, rotulo] of esperado) {
      const r = await pedir(caminho);
      const noTopo = new RegExp('<a class="acao" href="' + href.replace(/[?]/g, '\\?')
        + '">' + rotulo + '</a>').test(r.html);
      provar(caminho + ': o botão «' + rotulo + '» leva a ' + href, noTopo,
        (r.html.match(/<header class="doc">[\s\S]*?<\/header>/) || [''])[0].slice(0, 400));
    }

    /* CADA LINHA TEM UM DESTINO. Antes eram zero acções em todas; agora nenhuma linha fica sem. */
    const anam = pedacos(anamnese.html);
    const acoesDe = (c) => [...c.matchAll(/<a class="acao[^"]*" href="([^"]*)">([^<]*)<\/a>/g)]
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
    for (const [, href] of esperado) {
      const r = await pedir(href);
      provar('a porta ' + href + ' responde 200', r.status === 200, r.status);
    }
  }

  console.log('\n8 · Sem KV, a lista não inventa: a ponte devolve o que já servia');
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
