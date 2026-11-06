#!/usr/bin/env node
'use strict';

/**
 * provar-escrita-do-acto.js — a rota que grava o acto responde SEMPRE JSON, e falha a dizer porquê.
 *
 * OS DOIS DEFEITOS, medidos a 05/11/2026 na consola da Produção, no «Concluir e enviar para a
 * turma»:
 *
 *   1. **`/api/revalidacao` deu 404, e a consola disse `Unexpected token '<'`.** O aviso da
 *      cascata pedia um caminho ABSOLUTO que só existe debaixo dos prefixos da porta
 *      (`/anamnese/api/…`). Na raiz, o pedido caía no serviço de assets e voltava a página do
 *      site em HTML — e o `r.json()` do cliente estourava a ler marcação como JSON. O aviso
 *      nunca chegou a aparecer.
 *   2. **`/api/bastidores/linha-de-base/enviar` deu 500 com uma página em HTML.** Uma excepção
 *      dentro do store subia até ao runtime, e o corpo era a página de erro — outra vez HTML onde
 *      o cliente espera JSON, e outra vez «Unexpected token '<'». O erro verdadeiro ficava
 *      escondido atrás do erro de leitura.
 *
 * O QUE ESTA PROVA MEDE, e a alternativa a cada asserção:
 *
 *   A. O STORE NÃO ESTOURA. Um `fetchImpl` que falha, um GitHub que recusa a escrita, um corpo
 *      ilegível: `concluir` e `apagar` devolvem `{ok:false, erro}` com a razão. Sem isso, a
 *      moldura JSON do servidor teria de adivinhar o que aconteceu.
 *   B. A MOLDURA. `bastidores.fetch` responde JSON em `/api/**` mesmo quando a rota estoura — e
 *      leva a mensagem verdadeira, não «erro interno». É a rede de segurança, e a prova
 *      estraga uma rota de propósito para a ver funcionar.
 *   C. A ROTA CERTA. `/api/bastidores/revalidacao` existe, responde, e devolve `pendentes` e
 *      `ordem`; a página pede ESSE caminho e não o antigo.
 *   D. O CAMINHO DA TELA. O «Concluir» continua a gravar o acto no repositório e a esvaziar o
 *      rascunho do KV — e um rascunho que só existe como acto não é copiado para o KV.
 *
 * SEM REDE: um GitHub em memória, e o KV é um Map.
 *
 *   node experimentos/provar-escrita-do-acto.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const repo = require(path.join(RAIZ, 'motor/servidor/linhas-de-base-repo.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/** O GitHub em memória — o menor que serve as três chamadas do store. */
function githubDeBolso({ recusarEscrita = false } = {}) {
  const arquivos = new Map();
  const b64 = (t) => Buffer.from(String(t), 'utf8').toString('base64');
  const fetchFalso = async (url, opcoes) => {
    const u = new URL(String(url));
    const metodo = (opcoes && opcoes.method) || 'GET';
    if (u.pathname.indexOf('/git/trees/') !== -1) {
      return new Response(JSON.stringify({
        sha: 'arvore',
        tree: [...arquivos.keys()].map((p) => ({ path: p, type: 'blob', sha: 's' })),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const m = /\/contents\/(.+)$/.exec(u.pathname);
    if (!m) return new Response('nao', { status: 404 });
    const caminho = decodeURIComponent(m[1]);
    if (metodo === 'GET') {
      if (!arquivos.has(caminho)) return new Response('nao', { status: 404 });
      return new Response(JSON.stringify({ sha: 'sha', content: b64(arquivos.get(caminho)) }),
        { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (metodo === 'PUT') {
      if (recusarEscrita) {
        return new Response(JSON.stringify({ message: 'Resource not accessible by integration' }),
          { status: 403, headers: { 'content-type': 'application/json' } });
      }
      arquivos.set(caminho, Buffer.from(JSON.parse(opcoes.body).content, 'base64').toString('utf8'));
      return new Response(JSON.stringify({ commit: { sha: 'c1' } }),
        { status: 201, headers: { 'content-type': 'application/json' } });
    }
    return new Response('nao', { status: 405 });
  };
  return { fetchFalso, arquivos };
}

const linha = () => ({
  id: 'teste', nome: 'teste', professor: 'rabo-gramde',
  alunas: ['Aluna A', 'Aluna B'], turma: 'Balé Nível 1 — Teste 1',
  campos: [{ id: 'formato-anatomico-dos-joelhos', nome: 'Formato', grupo: 'Técnica' }],
});

(async () => {
  console.log('\nA. O store não estoura: devolve a razão, em vez de subir a excepção');

  console.log('\n  — a rede cai');
  {
    const s = repo.criarStore({ token: 't', escola: 'calango', fetchImpl: async () => { throw new Error('rede caiu'); } });
    const r = await s.concluir(linha(), {});
    provar('`concluir` devolve `ok: false` em vez de estourar', r && r.ok === false, r);
    provar('…e a mensagem diz o que falhou, em português',
      /chamada ao GitHub falhou/.test(r.erro || '') && /rede caiu/.test(r.erro || ''), r.erro);
    const a = await s.apagar('teste', {});
    provar('`apagar` faz o mesmo', a && a.ok === false && /GitHub/.test(a.erro || ''), a);
  }

  console.log('\n  — o GitHub recusa a escrita');
  {
    const gh = githubDeBolso({ recusarEscrita: true });
    const s = repo.criarStore({ token: 't', escola: 'calango', fetchImpl: gh.fetchFalso });
    const r = await s.concluir(linha(), {});
    provar('a recusa volta como erro, com o motivo do GitHub',
      r.ok === false && /recusou a escrita/.test(r.erro) && /403/.test(r.erro), r.erro);
    provar('…e o motivo do corpo não se perde («not accessible by integration»)',
      /not accessible/i.test(r.erro), r.erro);
  }

  console.log('\n  — o caminho feliz continua a gravar');
  {
    const gh = githubDeBolso();
    const s = repo.criarStore({ token: 't', escola: 'calango', fetchImpl: gh.fetchFalso });
    const r = await s.concluir(linha(), { quando: '2026-11-05T22:00:00.000Z' });
    provar('grava o ficheiro do acto', r.ok === true && gh.arquivos.size === 1, r);
    provar('…e devolve o caminho, para a tela poder dizê-lo',
      r.caminho === 'escola/calango/linhas-de-base/teste--20261105-2200.json', r.caminho);
  }

  console.log('\nB. A moldura: `/api/**` responde JSON mesmo quando a rota estoura');
  {
    const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
    provar('o `fetch` exportado é a moldura, e o corpo está separado',
      typeof bastidores.fetch === 'function' && typeof bastidores.fetchSemRede === 'function',
      Object.keys(bastidores));
    /* A PROVA DA REDE: um `env` que EXPLODE ao ser lido. Não se inventa uma rota nova no servidor
     * — estraga-se o ambiente de uma que existe, que é a forma do defeito real (um binding que
     * falta, um valor corrompido), e o que se mede é a moldura a apanhar.
     *
     * A PRIMEIRA TENTATIVA desta prova usava um KV cujo `get` estourava — e passou a medir o
     * contrário do que queria: `lerLista` já apanha o erro e devolve lista vazia, a rota respondia
     * 200, e a asserção do corpo falhava. O `Proxy` deixa o erro subir de onde ele sobe na vida. */
    const env = new Proxy({}, {
      get() { throw new Error('o ambiente estourou de propósito'); },
    });
    const pedido = new Request('https://calango.tmenegaz77.workers.dev/api/bastidores/turmas', { method: 'GET' });
    const resposta = await bastidores.fetch(pedido, env);
    const tipo = resposta.headers.get('content-type') || '';
    const texto = await resposta.text();
    provar('a resposta é JSON, e não uma página', /application\/json/.test(tipo), tipo);
    provar('…e não começa por `<!DOCTYPE` — que é o que fazia o cliente estourar',
      texto.indexOf('<!DOCTYPE') === -1 && texto.indexOf('{') === 0, texto.slice(0, 80));
    let corpo = null;
    try { corpo = JSON.parse(texto); } catch (erro) { corpo = null; }
    provar('o corpo é legível e diz o motivo', corpo && corpo.ok === false && Boolean(corpo.erro), corpo);
  }

  console.log('\nC. A rota da cascata: existe onde a página a pede');
  {
    const fs = require('fs');
    const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8');
    provar('a rota `/api/bastidores/revalidacao` está declarada',
      /path === '\/api\/bastidores\/revalidacao'/.test(fonte));
    provar('…e devolve `ordem` e `pendentes`, que é o que o aviso lê',
      /pendentes: \[\.\.\.r\.pendentes\.entries\(\)\]/.test(fonte));
    /* O DEFEITO ERA O CAMINHO. A página da Produção vive em `/bastidores/producao`; um pedido
     * absoluto `/api/revalidacao` não é servido na raiz — só debaixo dos prefixos da porta. */
    provar('a página pede o caminho que existe, e não o antigo',
      /fetch\("\/api\/bastidores\/revalidacao"\)/.test(fonte)
        && /'  fetch\("\/api\/revalidacao"\)' \+/.test(fonte) === false,
      'a linha do cliente ainda aponta para a raiz');
  }

  console.log('\nD. O caminho da tela: o acto vai para o ficheiro, e o KV fica limpo');
  {
    /* A ROTA INTEIRA, com um KV e um GitHub em memória — a mesma forma do `producao.fetch`. */
    const gh = githubDeBolso();
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, opcoes) => {
      if (new URL(String(url)).hostname === 'api.github.com') return gh.fetchFalso(url, opcoes);
      return realFetch(url, opcoes);
    };
    const dados = new Map();
    dados.set('bastidores/calango/linhas-de-base', JSON.stringify([{
      id: 'teste', nome: 'teste', professor: 'rabo-gramde', alunas: ['Aluna A', 'Aluna B'],
      campos: [{ id: 'formato-anatomico-dos-joelhos', nome: 'Formato', grupo: 'Técnica' }],
      atualizada_em: '2026-11-05T23:50:00.000Z',
    }]));
    dados.set('bastidores/calango/turmas', JSON.stringify([{ id: 't1', nome: 'Balé Nível 1 — Teste 1', ativo: true }]));
    const kv = {
      async get(k) { return dados.has(k) ? dados.get(k) : null; },
      async put(k, v) { dados.set(k, String(v)); },
      async delete(k) { dados.delete(k); },
      async list(o) {
        const p = (o && o.prefix) || '';
        return { keys: [...dados.keys()].filter((x) => x.startsWith(p)).map((name) => ({ name })), list_complete: true };
      },
    };
    const env = {
      ESCOLA_SLUG: 'calango', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', SENHA_PROFESSOR: 'p',
      PADD_KV: kv, GITHUB_TOKEN: 't',
      ASSETS: { async fetch() { return new Response('nao', { status: 404 }); } },
    };
    const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));
    const r = await producao.fetch(new Request(
      'https://calango.tmenegaz77.workers.dev/api/bastidores/linha-de-base/enviar',
      { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'teste', turma: 'Balé Nível 1 — Teste 1', senhaDirecao: 's' }) },
    ), env);
    const corpo = await r.json().catch(() => null);
    globalThis.fetch = realFetch;

    provar('o «Concluir e enviar» responde 200 em JSON', r.status === 200 && corpo && corpo.ok === true,
      { status: r.status, corpo });
    provar('…e diz que gravou no REPOSITÓRIO', corpo.gravado === 'repositorio', corpo.gravado);
    provar('…com a versão e o caminho do ficheiro',
      Boolean(corpo.versao) && /^escola\/calango\/linhas-de-base\/teste--/.test(corpo.caminho || ''),
      [corpo.versao, corpo.caminho]);
    provar('o ficheiro existe com o acto lá dentro', gh.arquivos.size === 1, [...gh.arquivos.keys()]);
    provar('…e o RASCUNHO sai do KV (uma cópia só, a do acto)',
      dados.get('bastidores/calango/linhas-de-base') === '[]',
      dados.get('bastidores/calango/linhas-de-base'));
    /* CONTROLE: o KV não pode ficar com uma cópia do acto — seria a segunda resposta para a mesma
     * pergunta, e a do KV é a que fica para trás. */
    const noKv = JSON.parse(dados.get('bastidores/calango/linhas-de-base') || '[]');
    provar('CONTROLE NEGATIVO: nenhum acto foi copiado para o KV', noKv.length === 0, noKv);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: a escrita do acto falha a dizer porquê, e `/api/**` responde sempre JSON.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('\nERRO na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
