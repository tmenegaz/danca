#!/usr/bin/env node
'use strict';

/**
 * provar-cabecalhos-do-github.js — o `User-Agent` que o GitHub exige, e a mensagem que o dizia mal.
 *
 * O DEFEITO, medido a 05/11/2026. A pesquisadora premiu «Concluir e enviar para a turma» e recebeu:
 *
 *     «não consegui gravar a linha de base no repositório: leitura do sha: HTTP 403.»
 *
 * Durante uma tarde se concluiu que «o `/contents/` funciona e a árvore é que é recusada», e se
 * construiu um índice de versões para deixar de depender da árvore. A conclusão era **errada**: o
 * GitHub recusa com 403 toda a requisição sem cabeçalho `User-Agent` («Request forbidden by
 * administrative rules»), e o `fetch` do runtime dos Workers não o põe sozinho. O módulo da linha
 * de base nasceu com a lista de cabeçalhos montada à mão e sem esse campo — todas as chamadas
 * falhavam, leitura e escrita, árvore e `contents`. Medido com o mesmo token:
 *
 *     GET /repos/tmenegaz/danca/git/trees/main?recursive=1   com User-Agent → 200
 *     GET /repos/tmenegaz/danca/git/trees/main?recursive=1   sem User-Agent → 403
 *
 * E o número não vinha com a frase, porque as mensagens liam `Response.texto` — uma propriedade que
 * não existe; o método é `.text()`, e ninguém o chamava. Um 403 sem a frase do GitHub custou uma
 * tarde de diagnóstico no lugar errado.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. A LISTA ÚNICA. `cabecalhosDe` traz `User-Agent`, `Accept` e a versão da API; põe o
 *      `Authorization` quando há token e não o inventa quando não há.
 *   B. A FRASE. `detalheDe` extrai a `message` de uma resposta — de uma `Response` a sério (com
 *      `.text()`, que é o que o runtime devolve), de um stub com `texto`, e de um corpo JSON.
 *   C. A SONDA. `sondar` devolve status **e frase** de cada chamada — o que faltou no diagnóstico
 *      por dedução.
 *   D. O STORE CONTRA UM GITHUB QUE EXIGE O CABEÇALHO. O envio grava; e o CONTROLE NEGATIVO,
 *      com os cabeçalhos despidos do `User-Agent`, falha **com a frase do GitHub** — não com um
 *      número.
 *   E. A CONTRAPROVA DO GUARDA. `tools/check-github-headers.js` é corrido sobre ficheiros
 *      fabricados: reprova o defeito antigo e aprova a correção. Um guarda que nunca se viu a
 *      reprovar não guarda nada.
 *
 * SEM REDE: um GitHub em memória que recusa sem `User-Agent`, como o verdadeiro.
 *
 *   node experimentos/provar-cabecalhos-do-github.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const api = require(path.join(RAIZ, 'motor/servidor/github-api.js'));
const repo = require(path.join(RAIZ, 'motor/servidor/linhas-de-base-repo.js'));
const { auditar } = require(path.join(RAIZ, 'tools/check-github-headers.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const FRASE = 'Request forbidden by administrative rules. Please make sure your request has a User-Agent header';

/**
 * O GitHub em memória. A regra que interessa é a de 05/11/2026: sem `User-Agent`, 403 com a frase
 * verdadeira. O `contents` (GET/PUT) e o `git/trees` são os mesmos do outro banco de provas.
 */
function githubDeBolso({ exigirAgente = true } = {}) {
  const arquivos = new Map();
  const vistos = [];
  let commits = 0;
  const b64 = (t) => Buffer.from(String(t), 'utf8').toString('base64');
  const fetchFalso = async (url, opcoes) => {
    const u = new URL(String(url));
    const metodo = (opcoes && opcoes.method) || 'GET';
    const cabecalhos = (opcoes && opcoes.headers) || {};
    vistos.push({ caminho: u.pathname, metodo, cabecalhos });
    if (exigirAgente && !cabecalhos['User-Agent']) {
      return new Response(JSON.stringify({ message: FRASE }),
        { status: 403, headers: { 'content-type': 'application/json' } });
    }
    if (u.pathname.indexOf('/git/trees/') !== -1) {
      return new Response(JSON.stringify({
        sha: 'arvore',
        tree: [...arquivos.keys()].map((p) => ({ path: p, type: 'blob', sha: 'sha' })),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const m = /\/contents\/(.+)$/.exec(u.pathname);
    if (!m) return new Response('nao', { status: 404 });
    const caminho = decodeURIComponent(m[1]);
    if (metodo === 'GET') {
      if (!arquivos.has(caminho)) return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
      return new Response(JSON.stringify({
        sha: 'sha-' + caminho, content: b64(arquivos.get(caminho)),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
      const existia = arquivos.has(caminho);
      if (existia && !corpo.sha) {
        return new Response(JSON.stringify({ message: 'sha obrigatório' }), { status: 422 });
      }
      arquivos.set(caminho, Buffer.from(String(corpo.content), 'base64').toString('utf8'));
      commits += 1;
      return new Response(JSON.stringify({ commit: { sha: 'c' + commits } }),
        { status: existia ? 200 : 201, headers: { 'content-type': 'application/json' } });
    }
    return new Response('nao', { status: 405 });
  };
  return { fetchFalso, arquivos, vistos, commits: () => commits };
}

/** Um store como o da Produção, com os cabeçalhos que `github-api` dá. */
function store(fetchFalso, { despir } = {}) {
  const despido = despir
    ? async (url, opcoes) => {
      const o = Object.assign({}, opcoes, { headers: Object.assign({}, opcoes && opcoes.headers) });
      delete o.headers['User-Agent'];
      return fetchFalso(url, o);
    }
    : fetchFalso;
  return repo.criarStore({
    token: 'token-de-prova', escola: 'calango', ref: 'main', fetchImpl: despido,
  });
}

const linha = () => ({
  id: 'teste', nome: 'teste', professor: 'raiz', alunas: ['Aluna A', 'Aluna B'],
  campos: [{ id: 'formato-anatomico-dos-joelhos', nome: 'Formato', grupo: 'Técnica' }],
  turma: 'Balé Nível 1 — Teste 1',
});

(async () => {
  console.log('\nA. A lista única: um sítio só, com o campo que faltava');
  {
    const h = api.cabecalhosDe('token-de-prova');
    provar('`cabecalhosDe` traz `User-Agent`', Boolean(h['User-Agent']), h);
    provar('…e o nome é o da casa (`danca-worker`)', h['User-Agent'] === 'danca-worker', h['User-Agent']);
    provar('…e o `Accept` da API', h.Accept === 'application/vnd.github+json', h.Accept);
    provar('…e a versão da API declarada', h['X-GitHub-Api-Version'] === '2022-11-28', h['X-GitHub-Api-Version']);
    provar('…e o `Authorization` quando há token',
      h.Authorization === 'Bearer ' + ['token', 'de', 'prova'].join('-'), h.Authorization);
    provar('sem token não se inventa `Authorization`', !api.cabecalhosDe('').Authorization);
    provar('o `User-Agent` não depende do token — vai sempre', Boolean(api.cabecalhosDe('')['User-Agent']));
    provar('o `Content-Type` só entra quando se pede (é o que o acervo dos envelopes usa)',
      !h['Content-Type'] && api.cabecalhosDe('t', { conteudo: true })['Content-Type'] === 'application/json');
    provar('o agente pode ser nomeado por módulo (os antigos distinguem-se nos registos)',
      api.cabecalhosDe('t', { agente: 'danca-verbete' })['User-Agent'] === 'danca-verbete');
    provar('a base da API é uma só, e não um endereço escrito em cada módulo',
      api.RAIZ === 'https://api.github.com', api.RAIZ);
  }

  console.log('\nB. A frase: um 403 sem motivo é um 403 que engana');
  {
    const verdadeira = new Response(JSON.stringify({ message: FRASE }),
      { status: 403, headers: { 'content-type': 'application/json' } });
    const d = await api.detalheDe(verdadeira);
    provar('lê o motivo de uma `Response` a sério (o `.text()` que ninguém chamava)',
      d.indexOf('403') !== -1 && d.indexOf('User-Agent') !== -1, d);
    /* O DEFEITO EXACTO: `Response` tem `.text()`, não `.texto`. Ler `.texto` dava `undefined`, e a
     * mensagem saía «HTTP 403» — sem a frase, sem a pista, sem nada. Uma `Response` só se lê uma
     * vez (o corpo é consumido), e é por isso que aqui se constrói outra. */
    const outra = new Response(JSON.stringify({ message: FRASE }), { status: 403 });
    provar('…e não se apoia numa propriedade `texto` que a `Response` não tem',
      (await api.detalheDe(outra)).indexOf(FRASE.slice(0, 40)) !== -1,
      await api.detalheDe({ status: 403, texto: 'x' }));
    provar('lê também o `texto` dos stubs das provas (a outra forma em uso no repositório)',
      (await api.detalheDe({ status: 500, texto: 'quebrou no meio' })) === 'HTTP 500 — quebrou no meio',
      await api.detalheDe({ status: 500, texto: 'quebrou no meio' }));
    provar('e o corpo JSON com `message`, que é a forma do GitHub',
      (await api.detalheDe({ status: 409, json: async () => ({ message: 'sha mismatch' }) }))
        === 'HTTP 409 — sha mismatch');
    provar('sem corpo, fica o número — não se inventa motivo',
      (await api.detalheDe({ status: 502 })) === 'HTTP 502');
  }

  console.log('\nC. A sonda: onde está o defeito, sem tocar na página');
  {
    const gh = githubDeBolso();
    const sonda = await api.sondar({
      token: 'token-de-prova', dono: 'tmenegaz', repo: 'danca', ref: 'main',
      escola: 'calango', fetchImpl: gh.fetchFalso,
      caminhos: ['escola/calango/linhas-de-base/.indice.json'],
    });
    provar('sonda o repositório, a árvore e um caminho concreto',
      sonda.provas.length === 3, sonda.provas.map((p) => p.nome));
    provar('…e todas passam, porque leva o `User-Agent`',
      sonda.provas.every((p) => p.ok || p.status === 404), sonda.provas.map((p) => p.status));
    provar('a árvore responde 200 — o que desmente a leitura antiga',
      sonda.provas[1].status === 200, sonda.provas[1]);

    /* CONTROLE NEGATIVO: a mesma sonda sem o cabeçalho. É o retrato do que se vivia. */
    const semAgente = await api.sondar({
      token: 'token-de-prova', dono: 'tmenegaz', repo: 'danca', ref: 'main',
      fetchImpl: async (url, o) => {
        const h = Object.assign({}, o.headers); delete h['User-Agent'];
        return gh.fetchFalso(url, Object.assign({}, o, { headers: h }));
      },
      caminhos: ['escola/calango/linhas-de-base/.indice.json'],
    });
    provar('sem o cabeçalho, TUDO é 403 — a árvore e o `contents` por igual',
      semAgente.provas.every((p) => p.status === 403), semAgente.provas.map((p) => p.status));
    provar('…e a sonda diz porquê, em vez de deixar adivinhar',
      semAgente.provas.every((p) => /User-Agent/.test(p.detalhe)), semAgente.provas[0].detalhe);
  }

  console.log('\nD. O store contra um GitHub que exige o cabeçalho');
  {
    const gh = githubDeBolso();
    const s = store(gh.fetchFalso);
    const acto = await s.concluir(linha(), { quando: '2026-11-05T22:00:00.000Z' });
    provar('o envio grava', acto.ok === true, acto);
    provar('…e nenhuma chamada saiu sem `User-Agent`',
      gh.vistos.length > 0 && gh.vistos.every((v) => Boolean(v.cabecalhos['User-Agent'])),
      gh.vistos.filter((v) => !v.cabecalhos['User-Agent']).map((v) => v.caminho));
    provar('…e nenhuma saiu sem `Authorization`',
      gh.vistos.every((v) => Boolean(v.cabecalhos.Authorization)),
      gh.vistos.filter((v) => !v.cabecalhos.Authorization).map((v) => v.caminho));
    provar('a leitura devolve a versão gravada', (await s.vigente('teste')) !== null);

    /* O CONTROLE NEGATIVO, e é o que teria evitado a tarde perdida: sem o cabeçalho, a escrita
     * falha — mas falha DIZENDO a frase do GitHub. */
    const despido = store(githubDeBolso({}).fetchFalso, { despir: true });
    const falha = await despido.concluir(linha(), { quando: '2026-11-05T22:00:00.000Z' });
    provar('sem o cabeçalho, o envio falha em vez de fingir', falha.ok === false, falha);
    provar('…e a mensagem traz a FRASE do GitHub, e não só o número',
      /User-Agent/.test(falha.erro || ''), falha.erro);

    /* A ÁRVORE, com o cabeçalho, responde: é o que prova que o índice em ficheiro fica por CUSTO
     * e não por uma recusa que existisse. */
    const gh2 = githubDeBolso();
    const s2 = store(gh2.fetchFalso);
    await s2.concluir(linha(), { quando: '2026-11-05T22:00:00.000Z' });
    gh2.arquivos.delete(repo.caminhoDaChave('calango', '.indice.json'));
    const semIndice = repo.criarStore({
      token: 'token-de-prova', escola: 'calango', ref: 'main', fetchImpl: gh2.fetchFalso,
    });
    const lido = await semIndice.lista();
    provar('sem índice, a árvore reconstrói a lista (fonte `arvore`)', lido.fonte === 'arvore', lido);
    provar('…com a versão dentro', lido.versoes.size === 1, [...lido.versoes.keys()]);
  }

  console.log('\nE. A contraprova do guarda: ele reprova mesmo?');
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-cabecalhos-'));
    const escrever = (nome, texto) => fs.writeFileSync(path.join(tmp, nome), texto);
    /* a lista comum, para a auditoria poder carregá-la */
    escrever('github-api.js', fs.readFileSync(path.join(RAIZ, 'motor/servidor/github-api.js'), 'utf8'));

    /* (1) O DEFEITO ANTIGO: cabeçalhos montados à mão, com Authorization e sem User-Agent. */
    escrever('ma-educado.js', [
      "'use strict';",
      "const BASE = 'https://api.github.com/repos/o/r';",
      'async function pedir(url, token) {',
      "  return fetch(BASE + url, { headers: { 'Authorization': 'Bearer ' + token } });",
      '}',
      'module.exports = { pedir };',
      '',
    ].join('\n'));
    const reprovado = auditar(tmp);
    provar('o defeito de 05/11/2026 é APANHADO',
      reprovado.erros.some((e) => /ma-educado\.js/.test(e)), reprovado.erros);
    provar('…e a mensagem diz o que falta (`User-Agent`)',
      reprovado.erros.some((e) => /User-Agent/.test(e)), reprovado.erros);

    /* (2) A CORREÇÃO: o mesmo pedido com o cabeçalho. O ficheiro com o defeito SAI da pasta —
     * senão a prova estaria a medir a correção com o erro ainda lá dentro. */
    fs.unlinkSync(path.join(tmp, 'ma-educado.js'));
    escrever('bem-educado.js', [
      "'use strict';",
      "const BASE = 'https://api.github.com/repos/o/r';",
      'async function pedir(url, token) {',
      "  return fetch(BASE + url, { headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': 'danca-worker' } });",
      '}',
      'module.exports = { pedir };',
      '',
    ].join('\n'));
    const aprovado = auditar(tmp);
    provar('a correção passa', aprovado.erros.length === 0, aprovado.erros);

    /* (3) O GITHUB-API TAMBÉM É AUDITADO: sem o campo na lista, o guarda reprova a própria casa. */
    escrever('github-api.js', fs.readFileSync(path.join(RAIZ, 'motor/servidor/github-api.js'), 'utf8')
      .replace("'User-Agent': agente || AGENTE,", ''));
    const semCampo = auditar(tmp);
    provar('sem o campo na lista comum, a auditoria reprova',
      semCampo.erros.some((e) => /github-api\.js/.test(e)), semCampo.erros);

    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log('\nF. A casa inteira: nenhum módulo pode voltar a montar os cabeçalhos à mão');
  {
    const r = auditar(path.join(RAIZ, 'motor/servidor'));
    provar('a auditoria de `motor/servidor` passa', r.erros.length === 0, r.erros);
    provar('…e os dois stores da linha de base e dos envelopes usam a lista única',
      r.ok.filter((l) => /lista única/.test(l)).length === 2, r.ok);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o `User-Agent` que o GitHub exige é um só, a recusa diz a frase, e o guarda reprova o defeito antigo.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('\nERRO na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
