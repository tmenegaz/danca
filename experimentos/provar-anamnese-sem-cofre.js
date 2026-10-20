'use strict';

/*
 * provar-anamnese-sem-cofre.js — a anamnese tem UM lugar, e ele não é o KV.
 *
 * O QUE MUDOU (20/10/2026). A anamnese era gravada DUAS vezes: o envelope no acervo do
 * repositório (`escola/<escola>/envelopes/<carimbo>.json`, cifrado no servidor) e uma segunda
 * cópia cifrada no cofre do KV (`<escola>/<professor>/<ciclo>/anamnese/<carimbo>`), pela rota
 * `POST /api/anamnese`. Dois sítios para o mesmo documento davam dois resultados a conciliar
 * na tela, duas contas de cota a pagar, e — quando só uma das gravações passava — o pior dos
 * dois mundos: «gravado» e «no repositório» eram coisas diferentes.
 *
 * O cofre saiu. O que esta prova fixa:
 *
 *   A. O SERVIDOR NÃO GRAVA DUAS VEZES. Uma anamnese elicita, vai para o acervo, e o KV não
 *      recebe ESCRITA NENHUMA (o contador do KV em memória fica em zero). É esta a asserção
 *      central: se o cofre voltar por qualquer caminho, ela cai.
 *   B. AS ROTAS DO COFRE NÃO EXISTEM. `POST/GET /api/anamnese` e `GET /api/anamnese/:carimbo`
 *      respondem 404 — não há segunda estrada para o mesmo dado.
 *   C. A TELA NÃO PEDE A CÓPIA. O `<script>` real de `porta/index.html` não faz `fetch` para
 *      `api/anamnese` e não carrega o `lib-cifra.js` (a cifra passou a ser do servidor).
 *
 * SEM REDE: um GitHub falso em memória (só a árvore e as escritas) e um KV em memória que
 * conta as escritas.
 *
 *   node experimentos/provar-anamnese-sem-cofre.js
 */

const fs = require('fs');
const path = require('path');

const acervo = require('../motor/servidor/acervo-envelopes.js');
const { criarMemoria } = require('../motor/nucleo/armazenamento.js');
const { criarRotas } = require('../motor/servidor/rotas.js');

const RAIZ = path.join(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(PORTA, p), 'utf8'));

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'calango';
const CARIMBO = '2026-10-19T18:42';

/** O GitHub em memória: só o que o acervo precisa para gravar (árvore + contents). */
function githubDeBolso() {
  const arquivos = new Map();
  const escritos = [];
  const fetchFalso = async (url, opcoes) => {
    const metodo = (opcoes && opcoes.method) || 'GET';
    if (String(url).indexOf('/git/trees/') !== -1) {
      return new Response(JSON.stringify({
        sha: 'arvore', tree: [...arquivos.keys()].map((p) => ({ path: p, type: 'blob', sha: 'sha' })),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const m = /\/contents\/(.+?)(\?|$)/.exec(String(url));
    const caminho = m ? decodeURIComponent(m[1]) : '';
    if (metodo === 'GET') {
      if (!arquivos.has(caminho)) return new Response('not found', { status: 404 });
      return new Response(JSON.stringify({
        sha: 'sha', content: Buffer.from(arquivos.get(caminho), 'utf8').toString('base64'),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    escritos.push(caminho);
    // O corpo é `{message, content}` com o conteúdo em base64 — o arquivo é o CONTEÚDO.
    let enviado = null;
    try { enviado = JSON.parse((opcoes && opcoes.body) || '{}'); } catch { enviado = null; }
    arquivos.set(caminho, enviado && enviado.content
      ? Buffer.from(enviado.content, 'base64').toString('utf8')
      : '');
    return new Response(JSON.stringify({ content: { sha: 'sha' }, commit: { sha: 'commit' } }), {
      status: 201, headers: { 'content-type': 'application/json' },
    });
  };
  return { fetchFalso, escritos, arquivos };
}

/** O KV em memória que CONTA as escritas — é o contador do cofre. */
function kvQueConta() {
  const base = criarMemoria();
  const escritas = [];
  return {
    escritas,
    ler: (c) => base.ler(c),
    existe: (c) => base.existe(c),
    listar: (p) => base.listar(p),
    apagar: (c) => base.apagar(c),
    guardar: (chave, texto, mensagem) => {
      escritas.push(chave);
      return base.guardar(chave, texto, mensagem);
    },
    mutar: (chave, mutacao, mensagem) => {
      escritas.push(chave);
      return base.mutar ? base.mutar(chave, mutacao, mensagem) : null;
    },
  };
}

async function pedir(rotas, metodo, caminho, corpo) {
  const pedido = new Request('http://local' + caminho, {
    method: metodo,
    headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const resposta = await rotas.responder(pedido);
  const texto = await resposta.text();
  let dados = null;
  try { dados = JSON.parse(texto); } catch { dados = texto; }
  return { status: resposta.status, dados };
}

async function principal() {
  const gh = githubDeBolso();
  const kv = kvQueConta();
  const armazenamento = acervo.combinar(acervo.criarAcervoDeEnvelopes({
    token: 'token-de-prova', escola: ESCOLA, senhaCripto: 'senha-de-prova',
    fetchImpl: gh.fetchFalso, legado: kv,
  }), kv);

  const rotas = criarRotas({
    armazenamento,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    escolaDoWorker: ESCOLA,
    agora: () => CARIMBO,
  });

  // ------------------------------------------------------------------ A
  console.log('\nA. a anamnese vai para o acervo, e o KV não recebe escrita nenhuma');
  {
    const r = await pedir(rotas, 'POST', '/api/elicitar', {
      fonte: 'anamnese',
      respostas: {
        apelido: { valor: 'Ana María', origem: 'declarado' },
        'perfil-de-entrada': { valor: 'iniciante', origem: 'declarado' },
      },
      contexto: { professor: 'sapo-bailarino', ciclo: '01', aluna: 'Ana María' },
    });
    checar('a anamnese foi gravada', r.dados && r.dados.gravado === true, r.dados && r.dados.erroDaGravacao);
    checar('o destino é o acervo da escola',
      Boolean(r.dados && r.dados.git && r.dados.git.ok)
        && /^escola\/calango\/envelopes\/anamnese-20261019-1842\.json$/.test(r.dados.git.caminho || ''),
      r.dados && r.dados.git);
    checar('o KV NÃO recebeu nenhuma escrita (o cofre não voltou)',
      kv.escritas.length === 0, kv.escritas);
    checar('o arquivo existe no repositório', gh.arquivos.has(
      'escola/calango/envelopes/anamnese-20261019-1842.json'));
    const cru = gh.arquivos.get('escola/calango/envelopes/anamnese-20261019-1842.json') || '';
    // O APELIDO É METADADO e vai em claro de propósito (é o que a lista lê); o que não pode
    // ler-se é a RESPOSTA.
    checar('e está CIFRADO (a resposta da aluna não se lê no arquivo)',
      cru.indexOf('_cifrado') !== -1 && cru.indexOf('iniciante') === -1, cru.slice(0, 300));
    checar('o índice do acervo foi escrito no repositório, não no KV',
      gh.escritos.indexOf('escola/calango/envelopes/.indice.json') !== -1 && kv.escritas.length === 0,
      gh.escritos);
  }

  // ------------------------------------------------------------------ B
  console.log('\nB. as rotas do cofre deixaram de existir');
  {
    const involucro = { algoritmo: 'AES-GCM', iteracoes: 100000, endereco: 'conteudo/anamnese.json', texto: 'AAAA' };
    const post = await pedir(rotas, 'POST', '/api/anamnese', {
      contexto: { professor: 'sapo-bailarino', ciclo: '01', carimbo: 'anamnese-20261019-1842' },
      _cifrado: involucro,
    });
    checar('POST /api/anamnese responde 404', post.status === 404, post.status);
    const lista = await pedir(rotas, 'GET',
      '/api/anamnese?escola=calango&professor=sapo-bailarino&ciclo=01');
    checar('GET /api/anamnese responde 404', lista.status === 404, lista.status);
    const um = await pedir(rotas, 'GET',
      '/api/anamnese/anamnese-20261019-1842?escola=calango&professor=sapo-bailarino&ciclo=01');
    checar('GET /api/anamnese/:carimbo responde 404', um.status === 404, um.status);
    checar('e nenhuma delas escreveu no KV', kv.escritas.length === 0, kv.escritas);
  }

  // ------------------------------------------------------------------ C
  console.log('\nC. a tela não pede a segunda cópia');
  {
    const html = fs.readFileSync(path.join(PORTA, 'index.html'), 'utf8');
    checar('o cliente não faz `fetch` para `api/anamnese`',
      !/fetch\(\s*['"`]api\/anamnese['"`]/.test(html));
    checar('o cliente não carrega o `lib-cifra.js` (quem cifra é o servidor)',
      !/src="\/assets\/lib-cifra\.js"/.test(html));
    checar('e a mensagem de gravação mostra o caminho do repositório',
      html.indexOf('gravada no acervo da escola') !== -1
        && html.indexOf('github.com/tmenegaz/danca/blob/main/') !== -1);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
