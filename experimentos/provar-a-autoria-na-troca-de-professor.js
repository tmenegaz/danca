#!/usr/bin/env node
'use strict';

/*
 * provar-a-autoria-na-troca-de-professor.js — O DOCUMENTO NÃO MUDA DE AUTOR (12/11/2026).
 *
 * O RELATO DELA, e é o defeito que esta prova fecha:
 *
 *   «eu tenho para o professor atual, o professor pé torto, eu tenho o plano de ensino e plano de
 *   observação. E aí eu troquei para a professora Redinha Rosa […] o plano de ensino, ele diz
 *   assim, vinculada. E aí ele trocou o nome do plano de ensino atual para quem fez sendo a
 *   Redinha Rosa e isso não é verdade.»
 *
 * E o ESTADO QUE ELA QUER VER no lugar disso, dito por ela: «se não tem turma, você vai mudar a
 * etiqueta e fazer valer o fato, ele está sem turma. Aí você coloca um traço ali porque ele não
 * tem turma.»
 *
 * O QUE SE MEDE AQUI — e é o que ela LÊ na tela, não o que o motor pensa:
 *
 *   A. A LISTAGEM DO PLANO DE ENSINO. O plano do Pé Torto continua na lista, com o selo
 *      `sem turma`, a turma em «—», e «Quem fez: Pe Torto». O nome da linha diz «sem turma» —
 *      porque a turma que ele nomeia já não é dele.
 *   B. A LISTAGEM DO PLANO DE OBSERVAÇÃO. A mesma regra, e pela mesma razão: o PO herda a turma
 *      do plano que observa, e o autor é quem o assinou.
 *   C. A CONDIÇÃO QUE FAZ O SELO SAIR. Quando quem dirige a turma tem o plano DELA, não há nada
 *      a dizer: o selo volta a ser o da cadeia. Um selo que fica para sempre é pior do que não
 *      haver selo.
 *   D. A PORTA — o «!» no professor (jsdom). Ela pediu-o pelo nome: «no cabeçalho fazer plano de
 *      ensino tem que ficar marcado uma exclamação no professor […] Só vai sair essa exclamação
 *      quando ela já tiver plano.» E a turma tem de ficar ESCOLHÍVEL para quem a dirige hoje —
 *      sem isso o «!» mandava fazer uma coisa que a própria lista impedia.
 *
 * O CONTROLADOR NEGATIVO. Com `--contra=<ref>` a prova corre contra o código de antes e TEM de
 * reprovar: lá o plano do Pé Torto aparecia «livre» com a turma «Piano» ao lado, e o «!» não
 * existia. Se o negativo passar, a prova não está a medir nada.
 *
 *   node experimentos/provar-a-autoria-na-troca-de-professor.js
 *   node experimentos/provar-a-autoria-na-troca-de-professor.js --contra=7b92544a
 *
 * O `--contra` pede o commit ANTERIOR à correcção, e não `HEAD`: o `HEAD` anda, e depois de a
 * correcção entrar ele passa a ser o código novo — um negativo contra `HEAD` passa a medir nada.
 * Medido a 12/11/2026: `--contra=HEAD` deu 2 falhas (as duas do servidor), e
 * `--contra=7b92544a` — o pacote imediatamente antes — dá as **15** que o defeito vale.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const REF = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let DESTINO = RAIZ;
if (REF) {
  DESTINO = fs.mkdtempSync(path.join(os.tmpdir(), 'autoria-'));
  execSync('git archive ' + REF + ' motor modelo porta biblioteca tools teste | tar -x -C '
    + JSON.stringify(DESTINO), { cwd: RAIZ, stdio: 'pipe' });
  fs.symlinkSync(path.join(RAIZ, 'node_modules'), path.join(DESTINO, 'node_modules'), 'dir');
  console.log('CONTROLE NEGATIVO contra ' + REF + '\n');
}

const porta = require(path.join(DESTINO, 'motor/nucleo/porta.js'));
const producao = require(path.join(DESTINO, 'motor/servidor/producao.js'));
const lib = require(path.join(RAIZ, 'experimentos/lib-pacote.js'));

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
const ha = (txt, pedaco) => String(txt || '').indexOf(pedaco) !== -1;

/* ------------------------------------------------------------------------------------------ */
/* O PALCO — a escola do caso dela, em memória: duas curadorias (a do Pé Torto substituída pela da
 * Redinha), e o plano e o PO que o Pé Torto escreveu para a turma Piano. */

const PLANO = 'plano-20261112-0837-2';
const PO = 'po-20261112-0837-2';
const TURMA = 'Piano';
const ANTIGO = 'pe-torto';
const NOME_ANTIGO = 'Pe Torto';
const NOVO = 'redinha-rosa';

function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) { dados.set(c, String(v)); },
    async delete(c) { dados.delete(c); },
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

const relatorio = (id) => ({
  id, estado: 'Input_anamnese_construida', contagem: { respondidos: 0, obrigatorios: 0 },
  elos: [], paradas: [], idsDesconhecidos: [],
  validacao: { resultado: 'aceite', contrato: 'prova' }, errosDoDocumento: [], linhas: [],
});
const R = (v) => ({ valor: v });

function curadorias({ comPlanoDela } = {}) {
  const lista = [
    { id: ANTIGO + '-bale-classico-piano-2026-11-12', vigenteDe: '2026-11-12',
      professor: ANTIGO, modalidade: 'bale-classico', tradicao: 'rad', turmas: [TURMA],
      alunas: ['Aluna A'] },
  ];
  if (comPlanoDela === undefined) {
    lista.push({ id: NOVO + '-bale-classico-piano-2026-11-12', vigenteDe: '2026-11-12',
      professor: NOVO, modalidade: 'bale-classico', tradicao: 'rad', turmas: [TURMA],
      alunas: ['Aluna A'], substitui: lista[0].id });
    lista[0].substituidaPor = lista[1].id;
  }
  return lista;
}

function planoDoPeTorto() {
  return {
    id: PLANO,
    contexto: { escola: 'x', professor: ANTIGO, ciclo: '01', turma: TURMA },
    respostas: {
      'objetivo-geral': R('consolidar o alinhamento e a transferência de peso'),
      'contexto-turma': R(TURMA),
      /* O ENVELOPE DO AR GUARDA O SLUG AQUI (medido: `contexto-professor` = `pe-torto` no
       * `plano-20261112-0837-2`). O fixture copia-o, para a prova medir o que a tela faz com um
       * slug — que é capitalizá-lo para ler, e nunca gravá-lo assim. */
      'contexto-professor': R(ANTIGO),
      repertorio: R(['Battement tendu']),
    },
    gerado_em: '2026-11-12T08:37',
  };
}

function planoDaRedinha(id) {
  const e = planoDoPeTorto();
  e.id = id || 'plano-20261112-0900';
  e.contexto = Object.assign({}, e.contexto, { professor: NOVO });
  e.respostas = Object.assign({}, e.respostas, { 'contexto-professor': R('Redinha Rosa') });
  e.gerado_em = '2026-11-12T09:00';
  return e;
}

function poDoPeTorto() {
  return {
    id: PO,
    contexto: { escola: 'x', professor: ANTIGO, ciclo: '01', turma: TURMA },
    respostas: {
      professor: R(NOME_ANTIGO),
      'plano-de-ensino': R([PLANO]),
      sujeitos: R(['Aluna A']),
    },
    gerado_em: '2026-11-12T08:37',
  };
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

/** A publicação servida pelos assets — a mesma que a ponte encontra em produção. */
function assets(dir) {
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      let p = path.join(dir, url.pathname);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(p), {
        status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream' },
      });
    },
  };
}

/** O `env` de uma escola servível — a publicação viva que os assets usam. */
function ambiente(publicacao, escola, kv) {
  return {
    ESCOLA_SLUG: escola, ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: 's', SENHA_PROFESSOR: 'p', PROFESSOR_NOME: NOME_ANTIGO,
    PADD_KV: kv, ASSETS: assets(publicacao.dir),
  };
}

async function semear(env, extra) {
  const arm = producao.__armazenamento(env);
  await porta.gravarEnvelope(arm, planoDoPeTorto(), relatorio(PLANO));
  await porta.gravarEnvelope(arm, poDoPeTorto(), relatorio(PO));
  const dela = extra && extra.planoDela;
  if (dela) await porta.gravarEnvelope(arm, dela, relatorio(dela.id));
  return arm;
}

/** A linha de um registo na listagem — o `<li>` inteiro, e só ele. */
function cartao(html) {
  const i = html.indexOf('<li class="trio-plano"');
  if (i === -1) return '';
  return html.slice(i, html.indexOf('</li>', i));
}

/** O valor de uma das três caixas (o `trio-v` do botão daquela caixa). */
function valorDaCaixa(c, qual) {
  const m = new RegExp('data-balao="' + qual + '"[^>]*>.*?trio-k">[^<]*</span>'
    + '<span class="trio-v">([^<]*)<', 's').exec(c);
  return m ? m[1] : null;
}

function nomeDaLinha(c) {
  const m = /<span class="trio-nome">[\s\S]*?<b>([\s\S]*?)<\/b>/.exec(c);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : null;
}

/* ------------------------------------------------------------------------------------------ */

(async () => {
  const publicacao = lib.publicacaoDeUmaEscolaComCiclo();
  if (!publicacao) {
    console.error('provar-a-autoria-na-troca-de-professor: nenhuma publicação viva — NÃO FEITO.');
    process.exit(2);
  }
  const ESCOLA = publicacao.escola;

  const inicial = {};
  inicial['bastidores/' + ESCOLA + '/curadorias'] = JSON.stringify(curadorias());
  inicial['bastidores/' + ESCOLA + '/professores'] = JSON.stringify([
    { slug: ANTIGO, nome: NOME_ANTIGO }, { slug: NOVO, nome: 'Redinha Rosa' }]);
  const kv = kvDeMentira(inicial);
  const env = ambiente(publicacao, ESCOLA, kv);
  await semear(env);

  const pedir = async (caminho) => {
    const r = await producao.fetch(
      new Request('https://' + ESCOLA + '.workers.dev' + caminho), env);
    return { status: r.status, html: await r.text() };
  };

  // ==========================================================================================
  console.log('A. A LISTAGEM DO PLANO DE ENSINO — «sem turma», e um traço onde ela estava');

  {
    const r = await pedir('/area-do-professor/plano-de-ensino/');
    provar('a lista responde 200', r.status === 200, r.status);
    const c = cartao(r.html);
    provar('o plano do Pé Torto continua na lista (ele existe, e é dele)', Boolean(c), c.slice(0, 120));
    provar('…com o selo `sem turma`', ha(c, '<span class="selo legado">sem turma</span>'),
      (c.match(/<span class="selo[^>]*>[^<]*<\/span>/) || [])[0]);
    provar('…e o nome da linha diz «sem turma», e não o nome da turma',
      /^Plano de ensino — sem turma$/.test(String(nomeDaLinha(c))), nomeDaLinha(c));
    provar('…e a caixa «Turma» fica com um TRAÇO', valorDaCaixa(c, 'turma') === '—',
      valorDaCaixa(c, 'turma'));
    provar('…e «Quem fez» continua a ser quem o escreveu, e não quem dirige hoje',
      valorDaCaixa(c, 'quem-fez') === NOME_ANTIGO, valorDaCaixa(c, 'quem-fez'));
    provar('…e o painel diz quem dirige hoje a Turma, para a pessoa saber a quem perguntar',
      ha(c, 'Quem dirige hoje') && /Redinha Rosa/.test(c),
      (c.match(/Quem dirige hoje[\s\S]{0,160}/) || [])[0]);
    provar('…e o selo NÃO diz «livre» — o documento não está livre, está sem turma',
      !/<span class="selo solta"[^>]*>livre<\/span>/.test(c),
      (c.match(/class="selo[^"]*"/g) || []));
  }

  // ==========================================================================================
  console.log('\nB. A LISTAGEM DO PLANO DE OBSERVAÇÃO — a mesma regra, e pelo mesmo motivo');

  {
    const r = await pedir('/area-do-professor/plano-de-observacao/');
    provar('a lista responde 200', r.status === 200, r.status);
    const c = cartao(r.html);
    provar('o PO que o Pé Torto escreveu continua na lista', Boolean(c), c.slice(0, 120));
    provar('…com o selo `sem turma`', ha(c, '<span class="selo legado">sem turma</span>'),
      (c.match(/<span class="selo[^>]*>[^<]*<\/span>/) || [])[0]);
    provar('…a caixa «Turma» com o traço', valorDaCaixa(c, 'turma') === '—', valorDaCaixa(c, 'turma'));
    provar('…e «Quem fez» com o autor', valorDaCaixa(c, 'quem-fez') === NOME_ANTIGO,
      valorDaCaixa(c, 'quem-fez'));
  }

  // ==========================================================================================
  console.log('\nC. O SELO SAI QUANDO QUEM DIRIGE JÁ TEM O PLANO DELA');

  {
    const arm = producao.__armazenamento(env);
    const dela = planoDaRedinha();
    await porta.gravarEnvelope(arm, dela, relatorio(dela.id));
    const estados = await porta.estadosDosPlanos(arm, {
      curadorias: JSON.parse(kv._dados.get('bastidores/' + ESCOLA + '/curadorias')),
    });
    provar('o plano do Pé Torto continua «sem turma» (a verdade não se desfaz)',
      (estados[PLANO] || {}).semTurma === true, estados[PLANO]);
    provar('…e o plano da Redinha tem turma', (estados[dela.id] || {}).semTurma === undefined,
      estados[dela.id]);
    const r = await pedir('/area-do-professor/plano-de-ensino/');
    const cartoes = r.html.split('<li class="trio-plano"').slice(1);
    provar('as duas linhas aparecem — a dele e a dela', cartoes.length === 2, cartoes.length);
    provar('…só a dele leva «sem turma»',
      cartoes.filter((c) => ha(c, '>sem turma<')).length === 1,
      cartoes.map((c) => (c.match(/trio-nome[\s\S]{0,200}/) || [])[0]));
    provar('…e a dela não tem selo de estado nenhum — é um plano livre',
      cartoes.some((c) => /Plano de ensino — Piano/.test(String(nomeDaLinha(c)))), 
      cartoes.map(nomeDaLinha));
    // Limpa, para o passo seguinte medir o mundo como ela o descreveu.
    await porta.apagarEnvelope(arm, dela.id);
  }

  // ==========================================================================================
  console.log('\nD. A PORTA — o «!» no professor, e a turma escolhível');

  {
    let JSDOM = null;
    let VirtualConsole = null;
    try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { JSDOM = null; }
    if (!JSDOM) {
      console.log('  —   a porta: NÃO MEDIDO (jsdom ausente)');
    } else {
      /* QUEM ABRE A PORTA É A PROFESSORA NOVA — a Redinha Rosa. É ela que a curadoria declara
       * hoje, e é o caso da pesquisadora: a turma é dela, e o plano que existe é do Pé Torto. */
      const resultado = await abrirAPorta(publicacao, ESCOLA, kv, NOVO);
      const quem = resultado.ler;
      if (process.env.DUMP) fs.writeFileSync('/tmp/porta.html', resultado.html);
      console.log('  ' + (resultado.erros.length ? resultado.erros.slice(0, 2).join(' | ')
        : 'sem erro de script'));
      provar('o professor da URL é o que a barra mostra', quem.professor === NOVO, quem.professor);
      provar('a turma foi semeada da curadoria (é a única dela)', quem.turma === TURMA, quem.turma);
      provar('…e ela está ESCOLHÍVEL — o plano do outro professor não a bloqueia',
        quem.opcoesDaturma.filter((o) => o.valor === TURMA && !o.desabilitada).length === 1,
        quem.opcoesDaturma);
      provar('…e a lista NÃO diz «já tem plano»: o plano que lá está é de outro professor',
        !quem.opcoesDaturma.some((o) => o.valor === TURMA && /já tem plano/.test(o.texto)),
        quem.opcoesDaturma);
      provar('o «!» está no campo do professor', Boolean(quem.marca), quem.campoDoProfessor);
      provar('…diz de quem é o plano, pelo NOME', quem.marca && /Pe Torto/.test(quem.marca.title),
        quem.marca && quem.marca.title);
      provar('…e diz que a marca sai quando o plano dela existir',
        quem.marca && /escreve o plano dele/.test(quem.marca.title),
        quem.marca && quem.marca.title);
      provar('…e é legível para quem ouve a página (tem `aria-label`)',
        quem.marca && Boolean(quem.marca.aria), quem.marca && quem.marca.aria);
      provar('…e o «!» é um `!` — a peça do catálogo, não uma pílula nova',
        quem.marca && quem.marca.texto.trim() === '!', quem.marca && quem.marca.texto);

      /* O OUTRO LADO: quando ela tem o plano dela, o «!» sai. */
      const arm = producao.__armazenamento(env);
      const dela = planoDaRedinha('plano-20261112-1000');
      await porta.gravarEnvelope(arm, dela, relatorio(dela.id));
      const segunda = await abrirAPorta(publicacao, ESCOLA, kv, NOVO);
      provar('com o plano dela, a marca sai', !segunda.ler.marca,
        segunda.ler.marca && segunda.ler.marca.title);
      provar('…e a turma passa a estar marcada com o plano dela (que passa a bloqueá-la)',
        segunda.ler.opcoesDaturma.some((o) => o.valor === TURMA && /já tem plano/.test(o.texto)),
        segunda.ler.opcoesDaturma);
      await porta.apagarEnvelope(arm, dela.id);
    }
  }

  // ==========================================================================================
  console.log('\nE. O ELO QUE JÁ LÁ ESTÁ COM O NOME TROCADO — a lista admite-o, e não o aceita');

  {
    /* UM PALCO NOVO, e é o estado do AR a 12/11/2026: a cadeia derivou `plano-20261112-1450` com o
     * nome da Redinha Rosa sobre o texto do Pé Torto. A regra nova impede os próximos; este já
     * existe, e o que se mede é que a lista não o apresenta como verdade. */
    const inicialE = {};
    inicialE['bastidores/' + ESCOLA + '/curadorias'] = JSON.stringify(curadorias());
    inicialE['bastidores/' + ESCOLA + '/professores'] = JSON.stringify([
      { slug: ANTIGO, nome: NOME_ANTIGO }, { slug: NOVO, nome: 'Redinha Rosa' }]);
    const kvE = kvDeMentira(inicialE);
    const envE = ambiente(publicacao, ESCOLA, kvE);
    const armE = producao.__armazenamento(envE);
    await porta.gravarEnvelope(armE, planoDoPeTorto(), relatorio(PLANO));
    const trocado = planoDaRedinha('plano-20261112-1450');
    trocado.ajuste_de = PLANO;
    await porta.gravarEnvelope(armE, trocado, relatorio(trocado.id));

    const estados = await porta.estadosDosPlanos(armE, {
      curadorias: JSON.parse(kvE._dados.get('bastidores/' + ESCOLA + '/curadorias')),
    });
    const doTrocado = estados[trocado.id] || {};
    provar('o elo é reconhecido como reatribuído', doTrocado.reatribuido === true, doTrocado);
    provar('…e a lista sabe quem escreveu, e não só quem assina',
      doTrocado.professor === NOVO && doTrocado.autorDoAnterior === ANTIGO, doTrocado);

    const r = await (async () => {
      const resp = await producao.fetch(
        new Request('https://' + ESCOLA + '.workers.dev/area-do-professor/plano-de-ensino/'), envE);
      return { status: resp.status, html: await resp.text() };
    })();
    const linha = r.html.split('<li class="trio-plano"').slice(1)
      .filter((c) => ha(c, trocado.id))[0] || '';
    provar('a linha do elo trocado leva a MARCA do aviso', ha(linha, 'class="selo alerta"'), linha.slice(0, 200));
    provar('…e a marca diz quem assinou e quem escreveu',
      ha(linha, 'Redinha Rosa') && ha(linha, NOME_ANTIGO),
      (linha.match(/title="[^"]*autoria[^"]*"/) || [])[0]);
    provar('…e ela é legível para quem ouve a página',
      /role="img"[^>]*aria-label="[^"]*autoria[^"]*"/.test(linha),
      (linha.match(/aria-label="[^"]*"/) || [])[0]);
    provar('o plano do Pé Torto, esse, fica «sem turma» — é ele que estava na turma',
      (estados[PLANO] || {}).semTurma === true, estados[PLANO]);
    provar('…mesmo tendo um sucessor, porque o sucessor dele é o elo trocado',
      (estados[PLANO] || {}).substituido_por.indexOf(trocado.id) !== -1, estados[PLANO]);
    /* AS DUAS LINHAS FICAM À VISTA — é o que ela pediu em letra: «continua existindo na listagem o
     * plano de ensino que pertence ao pé torto». Um sucessor que trocou de mãos não esconde o
     * documento verdadeiro; esconder seria aceitar a substituição que ele não pode fazer. */
    const linhas = r.html.split('<li class="trio-plano"').slice(1);
    provar('as DUAS linhas ficam na listagem — a do Pé Torto e a do elo trocado',
      linhas.length === 2, linhas.map((c) => (c.match(/trio-nome[\s\S]{0,180}/) || [])[0]));
    provar('…e a do Pé Torto diz «sem turma», com o traço',
      linhas.some((c) => ha(c, trocado.id) === false && ha(c, '>sem turma<')
        && valorDaCaixa(c, 'turma') === '—'),
      linhas.map((c) => ({ id: (c.match(/plano-\d{8}-\d{4}(-\d)?/) || [])[0],
        selo: (c.match(/class="selo [^"]*">[^<]*/) || [])[0] })));

    /* NA PORTA: o elo trocado não conta como «o plano desta professora». A turma fica livre para
     * ela escrever o dela, e o «!» tem de aparecer — é o único plano que lá está. */
    let JSDOMe = null;
    try { ({ JSDOM: JSDOMe } = require('jsdom')); } catch (e) { JSDOMe = null; }
    if (!JSDOMe) {
      console.log('  —   a porta do elo trocado: NÃO MEDIDO (jsdom ausente)');
    } else {
      const naPorta = await abrirAPorta(publicacao, ESCOLA, kvE, NOVO);
      provar('a turma continua ESCOLHÍVEL — o elo trocado não a ocupa',
        naPorta.ler.opcoesDaturma.filter((o) => o.valor === TURMA && !o.desabilitada).length === 1,
        naPorta.ler.opcoesDaturma);
      provar('…e a lista não diz «já tem plano»',
        !naPorta.ler.opcoesDaturma.some((o) => o.valor === TURMA && /já tem plano/.test(o.texto)),
        naPorta.ler.opcoesDaturma);
      provar('…e o «!» aparece, a dizer quem escreveu',
        Boolean(naPorta.ler.marca) && ha(naPorta.ler.marca.title, NOME_ANTIGO),
        naPorta.ler.marca && naPorta.ler.marca.title);
    }
  }

  console.log('\n' + (falhas ? 'FALHARAM ' + falhas + ' de ' + n : 'TUDO CERTO — ' + n
    + ' asserções: o documento que fica sem turma diz «sem turma» e mostra um traço, a autoria não '
    + 'se reescreve, e o «!» no professor chama quem tem de escrever o plano.'));
  if (falhas && !REF) process.exit(1);
  if (!falhas && REF) {
    console.log('\nO CONTROLADOR NEGATIVO PASSOU — a prova não mede o que diz medir.');
    process.exit(1);
  }
})();

/**
 * Abre a porta do PLANO DE ENSINO em jsdom, com o servidor de rotas a sério.
 *
 * O `?professor=` do endereço é a identidade do ato, e o `fonte=plano` escolhe o formulário. O
 * resto — a estante, os estados, a curadoria — vem das rotas, que leem o KV da bancada.
 */
async function abrirAPorta(publicacao, escola, kv, professor) {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const { criarRotas } = require(path.join(DESTINO, 'motor/servidor/rotas.js'));
  const lerJSON = (p) => JSON.parse(fs.readFileSync(path.join(DESTINO, 'porta', p), 'utf8'));

  /* O MESMO ARMAZENAMENTO DA LISTAGEM — o do `env`, e não uma cópia. A cópia foi a primeira
   * tentativa, e media o nada: o KV da bancada é que tem os envelopes, e o contrato de leitura
   * não é o mesmo do `criarMemoria`. Uma cópia a divergir do original é sempre a cópia que
   * fica para trás. */
  const armazenamento = producao.__armazenamento(ambiente(publicacao, escola, kv));

  const rotas = criarRotas({
    armazenamento,
    conteudo: lerJSON('conteudo/anamnese.json'),
    esquema: lerJSON('envelope/elicitacao-schema.json'),
    conteudoPO: lerJSON('po/conteudo/po.json'),
    conteudoPlano: lerJSON('plano/conteudo/plano.json'),
    fuso: 'America/Sao_Paulo',
    escolaDoWorker: escola,
    lerCuradorias: async () => JSON.parse(kv._dados.get('bastidores/' + escola + '/curadorias') || '[]'),
    lerTurmas: async () => [{ nome: TURMA, frequencia: 2, dias: ['qua', 'sex'], duracaoMin: 60 }],
    geracao: null,
  });

  const cadastro = {
    '/api/bastidores/turmas': {
      ok: true,
      turmas: [{ nome: TURMA, ativo: true, frequencia: 2, duracaoMin: 60 }],
      opcoes: [{ valor: TURMA, rotulo: TURMA }],
    },
    '/api/bastidores/termos': { ok: true, termos: [], opcoes: [] },
    '/api/bastidores/turma-conteudos': { ok: true, relacoes: {} },
    '/api/bastidores/professores': {
      ok: true,
      professores: [
        { apelido: NOME_ANTIGO, slug: ANTIGO, nome: NOME_ANTIGO },
        { apelido: 'Redinha Rosa', slug: NOVO, nome: 'Redinha Rosa' },
      ],
    },
    '/api/bastidores/curadoria-professor': {
      ok: true,
      // As curadorias VIGENTES do professor — a forma que `atualizarCuradoria` lê (`dados.curadorias`).
      curadorias: JSON.parse(kv._dados.get('bastidores/' + escola + '/curadorias') || '[]')
        .filter((c) => c && !c.substituidaPor && c.professor === (professor || ANTIGO)),
      vinculos: [], modalidade: 'bale-classico', tradicao: 'rad',
      turmas: [TURMA], alunas: [], linhaDeBase: null,
    },
    '/api/bastidores/alunas': { ok: true, alunas: [], novas: [] },
  };

  const servidor = http.createServer(async (pedido, resposta) => {
    const caminho = decodeURIComponent(new URL(pedido.url, 'http://x').pathname);
    if (cadastro[caminho]) {
      resposta.writeHead(200, { 'Content-Type': 'application/json' });
      return resposta.end(JSON.stringify(cadastro[caminho]));
    }
    if (caminho === '/' || caminho === '/index.html') {
      resposta.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
      return resposta.end(fs.readFileSync(path.join(DESTINO, 'porta/index.html')));
    }
    if (caminho.startsWith('/assets/')) {
      const arquivo = path.join(DESTINO, 'porta', caminho);
      if (fs.existsSync(arquivo)) {
        resposta.writeHead(200, {
          'Content-Type': caminho.endsWith('.css') ? 'text/css' : 'text/javascript',
        });
        return resposta.end(fs.readFileSync(arquivo));
      }
      resposta.writeHead(404);
      return resposta.end('');
    }
    const r = await rotas.responder(new Request('http://local' + pedido.url, { method: pedido.method }));
    const corpo = await r.text();
    resposta.writeHead(r.status, {
      'Content-Type': r.headers.get('content-type') || 'application/json',
    });
    return resposta.end(corpo);
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  const base = 'http://127.0.0.1:' + servidor.address().port + '/';

  const virtual = new VirtualConsole();
  const erros = [];
  virtual.on('jsdomError', (e) => {
    if (/Not implemented/.test(e.message)) return;
    if (/Could not load (link|script): "[^"]*\/assets\//.test(e.message)) return;
    erros.push(e.message);
  });
  const endereco = base + '?fonte=plano&escola=' + encodeURIComponent(escola)
    + '&professor=' + encodeURIComponent(professor || ANTIGO) + '&ciclo=01';
  const dom = await JSDOM.fromURL(endereco, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: virtual,
    beforeParse(janela) {
      janela.fetch = (u, o) => fetch(new URL(u, janela.location.href).href, o);
      janela.CSS = { escape: (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c) };
    },
  });
  await new Promise((ok) => setTimeout(ok, 2200));
  const doc = dom.window.document;
  /* A LEITURA ACONTECE ANTES DE FECHAR. O `jsdom` esvazia o documento no `close()`, e ler depois
   * disso dá `null` — foi assim que a primeira versão desta prova mediu o nada. O que sai daqui é
   * um retrato: os valores que as asserções perguntam, e o HTML da página. */
  const seletorDaTurma = doc.getElementById('ctx-turma');
  const marca = doc.querySelector('#ctx-professor-campo .selo.alerta'
    + '[data-marca="professor-sem-plano"]');
  const retrato = {
    professor: (doc.getElementById('ctx-professor') || {}).value || '',
    professorTravado: Boolean(doc.getElementById('ctx-professor')
      && doc.getElementById('ctx-professor').disabled),
    campoDoProfessor: (doc.getElementById('ctx-professor-campo') || {}).innerHTML || '',
    turma: seletorDaTurma ? String(seletorDaTurma.value || '') : '',
    opcoesDaturma: seletorDaTurma
      ? [...seletorDaTurma.options].map((o) => ({ valor: o.value, texto: o.textContent,
        desabilitada: Boolean(o.disabled) }))
      : [],
    marca: marca ? { title: marca.getAttribute('title'),
      aria: marca.getAttribute('aria-label'), texto: marca.textContent } : null,
  };
  const html = doc.documentElement.outerHTML;
  dom.window.close();
  servidor.close();
  return { ler: retrato, html, erros };
}
