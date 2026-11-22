#!/usr/bin/env node
'use strict';

/**
 * provar-o-derivar-do-estilo.js — O ENDEREÇO ABRE O DERIVAR DAQUELE EXERCÍCIO (22/11/2026).
 *
 * O QUE ELA PEDIU, e é a outra metade de um botão que já existe no plano:
 *
 *   «quando clicar em derivar, vai direto para bastidores e em bastidores é direto no estilo e no
 *   estilo já aberto o derivar do que eu quero fazer o ajuste.»
 *
 * O BOTÃO está no diálogo que cria a aula (`derivar-plano-ciclo.js`), na coluna «Ações». O que ele
 * pede é `/bastidores/estudio?derivar=<exercício>&musica=<tempos|compasso>#estilo` — e é ESSE
 * ENDEREÇO que esta prova mede, na página dos Bastidores de verdade, num DOM.
 *
 * PORQUE UMA PROVA PRÓPRIA. A metade do plano (o botão, o que ele leva, o modal que fecha) está
 * medida na `provar-a-musica-do-modal`. Esta mede o outro lado do salto: sem ela, o «Derivar»
 * poderia apontar para um endereço que não abre nada — um botão que promete o que não faz, que é a
 * forma de defeito que a casa já pagou caro (o `?abrir=` do Pagar, o `data-abrir` do cartão).
 *
 * TRÊS COISAS, e a segunda é o controlo:
 *
 *   A. COM O PEDIDO — a secção do Estilo abre, o exercício é o pedido, a música é a pedida, o
 *      formulário está aberto, e o parâmetro SAI do endereço (senão reabria sozinho a cada gravação).
 *   B. SEM O PEDIDO — a mesma página sem `?derivar` não abre verbete nenhum: é isto que prova que
 *      é o parâmetro que abre, e não a página.
 *   C. COM UM EXERCÍCIO QUE NÃO TEM VERBETE — a página DIZ que ele não tem, em vez de não fazer
 *      nada; e não abre o formulário em cima de outro exercício.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` serve a página DAQUELE commit — o código que a produzia — e
 * mede o mesmo. A página dos Bastidores não é um artefacto versionado como o `plano.html`: ela é o
 * que o `bastidores.js` escreve, e por isso o controlo extrai o motor do commit e requer de lá.
 * Sem o leitor do parâmetro, a secção A falha — e é isso que mostra que é ela que o mede.
 *
 *   node experimentos/provar-o-derivar-do-estilo.js
 *   node experimentos/provar-o-derivar-do-estilo.js --contra=cbd1aa66
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const CONTRA = (process.argv.find((x) => x.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let RAIZ_DO_MOTOR = RAIZ;
let TEMPORARIO = null;
if (CONTRA) {
  TEMPORARIO = fs.mkdtempSync(path.join(os.tmpdir(), 'derivar-do-estilo-'));
  execSync('git archive ' + CONTRA + ' motor modelo biblioteca tools porta | tar -x -C ' + TEMPORARIO,
    { cwd: RAIZ, stdio: 'pipe' });
  RAIZ_DO_MOTOR = TEMPORARIO;
}
const verbete = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/verbete.js'));
const bastidores = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/bastidores.js'));

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + descricao); return; }
  falhas += 1;
  console.log('  FALHA ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 300)));
}

const P = (rel) => path.join(RAIZ, 'biblioteca', 'modalidades', 'bale-classico', rel);
const lerJson = (rel) => JSON.parse(fs.readFileSync(rel, 'utf8'));

/** O GitHub de mentira — o mesmo contrato do `provar-musica-do-verbete`: lê e honra o `sha`. */
function githubFalso(inicial) {
  const arquivos = new Map(Object.entries(inicial));
  return async (url, opcoes) => {
    const caminho = String(url).split('/contents/')[1].split('?')[0];
    const atual = arquivos.get(caminho);
    if (!atual) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify({
      sha: atual.sha,
      content: Buffer.from(atual.conteudo, 'utf8').toString('base64'),
    }), { status: 200 });
  };
}

function criarKv() {
  const dados = new Map();
  return {
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) { dados.set(c, v); },
    async delete(c) { dados.delete(c); },
    async list() { return { keys: [], list_complete: true }; },
  };
}

const BASE = 'https://breu.tmenegaz77.workers.dev';

/**
 * A PÁGINA DOS BASTIDORES NUM DOM, aberta num endereço arbitrário.
 *
 * O alfabeto é FIXTURE (um verbete de 8 tempos em 4/4, com quatro trechos que fecham os 8): o que
 * se mede é o MECANISMO do endereço, e ler o `Plié` editorial faria a prova depender de ele existir
 * com a música que hoje tem.
 */
async function abrirBastidores(endereco) {
  const ALFABETO = lerJson(P('notacao.json'));
  const dois = (n, marca) => ({
    contagem: n + '–' + (n + 1), categoria: 'Pé', sinais: ['1ª', '→', '+'], descricao: marca,
  });
  ALFABETO.verbetes = {
    'Battement tendu': {
      '8|4/4': {
        cobre: 8,
        posicao: null,
        celulas: {
          devant: [dois(1, 'ida'), dois(3, 'volta'), dois(5, 'ida outra vez'), dois(7, 'volta')],
        },
      },
    },
  };

  const repo = githubFalso({
    [verbete.caminhoDoAlfabeto('bale-classico')]: {
      sha: 'sha-a', conteudo: JSON.stringify(ALFABETO, null, 2) + '\n',
    },
    [verbete.caminhoDoVocabulario('bale-classico')]: {
      sha: 'sha-v', conteudo: fs.readFileSync(P('vocabulario.json'), 'utf8'),
    },
  });
  const env = {
    ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't',
    PADD_KV: criarKv(),
  };

  const fetchDeVerdade = globalThis.fetch;
  globalThis.fetch = repo;
  let html;
  try {
    const resposta = await bastidores.fetch(new Request(BASE + '/bastidores/estudio'), env);
    html = await resposta.text();
  } finally {
    globalThis.fetch = fetchDeVerdade;
  }

  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });

  const dom = new JSDOM(html, {
    url: BASE + endereco,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({
        matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {},
      });
      w.alert = () => {};
      w.confirm = () => true;
      w.scrollTo = () => {};
      w.fetch = async (u, i) => {
        const url = new URL(String(u), BASE + '/bastidores/estudio');
        if (url.pathname.indexOf('/api/') === 0) {
          const salvo = globalThis.fetch;
          globalThis.fetch = repo;
          try {
            const r = await bastidores.fetch(new Request(url.toString(), i), env);
            if (r) return r;
          } finally {
            globalThis.fetch = salvo;
          }
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        return new Response('', { status: 404 });
      };
    },
  });

  /* A LISTAGEM CHEGA POR `fetch`: espera-se que o exercício esteja no `<select>` do passo, que é o
   * sinal de que o alfabeto foi lido e o `editarVerbete` já não desistiria em silêncio. */
  const w = dom.window;
  const d = w.document;
  for (let i = 0; i < 80; i += 1) {
    const sel = d.getElementById('vbnome');
    if (sel && sel.options.length > 1) break;
    await new Promise((r) => w.setTimeout(r, 25));
  }
  await new Promise((r) => w.setTimeout(r, 80));

  return { dom, w, d, problemas, html };
}

/** O que a página mostra — lido do DOM, e não do código que o escreve. */
function estado(d) {
  const secao = d.getElementById('sec-verbetes');
  const nome = d.getElementById('vbnome');
  const tempos = d.getElementById('vbtempos');
  const compasso = d.getElementById('vbcompasso');
  const acao = d.getElementById('vbacao');
  const recado = d.querySelector('.res[data-res="verbetes"]');
  return {
    secaoVisivel: secao ? secao.hidden === false : null,
    exercicio: nome ? nome.value : null,
    tempos: tempos ? tempos.value : null,
    compasso: compasso ? compasso.value : null,
    acao: acao ? acao.value : null,
    recado: recado ? String(recado.textContent || '').trim() : '',
    busca: d.defaultView.location.search,
  };
}

(async () => {
  /* ═══════════ A · o endereço que o «Derivar» do plano pede ═══════════ */
  console.log('\nA · COM O PEDIDO — o Estilo abre no derivar daquele exercício');
  {
    const endereco = '/bastidores/estudio?derivar=Battement%20tendu&musica=8%7C4%2F4#estilo';
    const { dom, d } = await abrirBastidores(endereco);
    const e = estado(d);

    checar('a secção do Estilo está à vista (o `#estilo` do endereço foi honrado)',
      e.secaoVisivel === true, { secaoVisivel: e.secaoVisivel });
    checar('o exercício aberto é o que o endereço pediu', e.exercicio === 'Battement tendu', e.exercicio);
    checar('…e a música aberta é a que o endereço pediu (8 em 4/4)',
      e.tempos === '8' && e.compasso === '4/4', [e.tempos, e.compasso]);
    /* O `vbacao` é o que diz ao servidor que este gesto GRAVA em cima do que existe. Se ficasse
     * «criar», o «Derivar» do plano criava uma versão nova em vez de ajustar a que a turma lê. */
    checar('…no modo «atualizar» — derivar ajusta o que existe, e não cria outro',
      e.acao === 'atualizar', e.acao);
    /* O PARÂMETRO SAI. A página é repintada a cada operação; deixá-lo no endereço faria o
     * formulário reabrir no exercício de antes a cada gravação. O `#estilo` fica — é a posição. */
    checar('…e o pedido SAI do endereço, para não reabrir sozinho na próxima gravação',
      e.busca === '', e.busca);
    checar('…com o `#estilo` conservado (a posição não é um pedido)', d.defaultView.location.hash === '#estilo',
      d.defaultView.location.hash);
    dom.window.close();
  }

  /* ═══════════ B · o controlo: sem o parâmetro, nada abre ═══════════ */
  console.log('\nB · SEM O PEDIDO — a mesma página não abre verbete nenhum');
  {
    const { dom, d } = await abrirBastidores('/bastidores/estudio#estilo');
    const e = estado(d);
    checar('a secção do Estilo abre (o `#estilo` basta para a mostrar)', e.secaoVisivel === true);
    checar('…e NENHUM exercício está aberto — é o parâmetro que abre, não a página',
      !e.exercicio, e.exercicio);
    /* O COMPASSO TEM UM VALOR DE FÁBRICA («2/4»), e é por isso que ele não serve de prova: o que
     * distingue um formulário que abriu um verbete é o MODO. Sem exercício não há nada para
     * atualizar, e o `vbacao` não está em «atualizar». */
    checar('…e o formulário não está em modo «atualizar» (não abriu verbete nenhum)',
      e.acao !== 'atualizar' && !e.tempos, { acao: e.acao, tempos: e.tempos });
    dom.window.close();
  }

  /* ═══════════ C · um exercício que ainda não tem verbete ═══════════ */
  console.log('\nC · SEM VERBETE — a página diz que não há, em vez de não fazer nada');
  {
    const { dom, d } = await abrirBastidores(
      '/bastidores/estudio?derivar=Battement%20fondu&musica=8%7C2%2F4#estilo');
    const e = estado(d);
    checar('a secção do Estilo está à vista', e.secaoVisivel === true);
    checar('a página DIZ que aquele exercício não tem verbete — e manda ao Dicionário',
      /Battement fondu/.test(e.recado) && /Dicionário/.test(e.recado), e.recado);
    checar('…e NÃO abre o formulário em cima de outro exercício', !e.exercicio, e.exercicio);
    dom.window.close();
  }

  if (TEMPORARIO) fs.rmSync(TEMPORARIO, { recursive: true, force: true });
  console.log('');
  if (CONTRA) {
    console.log((falhas ? 'CONTROLE CONFORME — ' : 'CONTROLE SUSPEITO — ') + falhas + ' de ' + total
      + ' asserções falham com a página de ' + CONTRA + '.');
    process.exit(falhas ? 0 : 1);
  }
  if (falhas) { console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.'); process.exit(1); }
  console.log('TUDO CERTO — ' + total + ' asserções: o endereço que o «Derivar» do plano pede abre o '
    + 'Estilo no derivar daquele exercício, com a música dele e no modo «atualizar»; sem o pedido a '
    + 'página não abre verbete nenhum (é o parâmetro que abre); e um exercício sem verbete é DITO, '
    + 'com o sítio onde ele nasce, em vez de um botão que não faz nada.');
})();
