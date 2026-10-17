#!/usr/bin/env node
'use strict';

/**
 * provar-rollback-do-orfao.js — a escola que não nasceu não deixa Worker no ar (17/10/2026).
 *
 * O QUE ACONTECEU. O «Criar nova escola» da página `danca` cria o Worker «zero» no Cloudflare
 * (Worker + subdomínio + segredos) e SÓ DEPOIS dispara o `criar-escola.yml`, que monta o
 * scaffold e sobe o motor completo por cima. Entre um passo e o outro a escola existe no
 * Cloudflare e não existe em lugar nenhum: sem pasta em `escola/`, sem `wrangler.<escola>.jsonc`,
 * sem nada no Git. Quando o workflow falha, nada desfazia o Worker.
 *
 * Foi a `valsa`: criada às 09:36:04Z, o workflow morto às 09:36:09Z — cinco segundos depois —, e
 * 592 bytes de «recarregue em instantes» no ar a responder 200 no subdomínio de uma escola que
 * nunca existiu, até alguém reparar horas mais tarde.
 *
 * A REGRA QUE ESTA PROVA TRAVA. O rollback apaga pela EVIDÊNCIA, não pela intenção: lê o código
 * que está no ar e só apaga se ainda for o placeholder DESTA escola. Os dois erros não custam o
 * mesmo — um órfão de 592 bytes vê-se e apaga-se à mão; uma escola apagada por engano não se
 * recupera. Por isso todos os casos de dúvida terminam em «NÃO apaga»:
 *
 *   1. `ehPlaceholder` reconhece o placeholder e recusa tudo o resto (incluindo um bundle que
 *      porventura traga a marca — um `require` futuro pode arrastá-la para dentro do motor);
 *   2. `desfazerPlaceholder` só apaga o que reconheceu, e NUNCA lança (quem o chama já está a
 *      tratar um erro);
 *   3. a rota `/api/criar-escola` desfaz quando o disparo falha (502, não 201 «criada»);
 *   4. e desfaz também quando o provisionamento morre a meio;
 *   5. e NÃO desfaz quando a escola já existe (409) — aí o Worker é uma escola a sério.
 *
 *   uso: node experimentos/provar-rollback-do-orfao.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const P = require(path.join(RAIZ, 'motor/servidor/provisionar-escola.js'));
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));

let falhas = 0;
const conferir = (nome, ok, detalhe) => {
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

const PLACEHOLDER = P.scriptDaEscola('valsa', 'Valsa');
// O que o motor de verdade devolve: um bundle do esbuild, com o prelúdio e sem a marca.
const MOTOR = 'var __create = Object.create;\nvar __defProp = Object.defineProperty;\n/* …423 KB… */\n';

// ---------------------------------------------------------------------------
// 1. O RECONHECIMENTO — e a assimetria dos dois erros
// ---------------------------------------------------------------------------
console.log('\n1. ehPlaceholder — reconhecer, e recusar na dúvida');
conferir('o placeholder gerado é reconhecido', P.ehPlaceholder(PLACEHOLDER, { escola: 'valsa' }) === true);
conferir('com o nome de exibição também', P.ehPlaceholder(PLACEHOLDER, { escola: 'valsa', nome: 'Valsa' }) === true);
conferir('nome de exibição DIFERENTE → não apaga (o caso que apagaria a escola errada)',
  P.ehPlaceholder(PLACEHOLDER, { escola: 'valsa', nome: 'Valse' }) === false);
conferir('slug de OUTRA escola → não apaga', P.ehPlaceholder(PLACEHOLDER, { escola: 'valse' }) === false);
conferir('um bundle do motor → não apaga', P.ehPlaceholder(MOTOR, { escola: 'valsa' }) === false);
conferir('um bundle que trouxesse a marca → não apaga (o prelúdio manda)',
  P.ehPlaceholder(MOTOR + PLACEHOLDER, { escola: 'valsa', nome: 'Valsa' }) === false);
conferir('vazio → não apaga', P.ehPlaceholder('', { escola: 'valsa' }) === false);
conferir('nulo → não apaga', P.ehPlaceholder(null, { escola: 'valsa' }) === false);
conferir('sem slug → não apaga', P.ehPlaceholder(PLACEHOLDER, {}) === false);
conferir('o placeholder NÃO traz o prelúdio do motor',
  PLACEHOLDER.includes('var __create = Object.create;') === false);
conferir('a marca carrega o slug (não é uma marca genérica)',
  P.linhaDoPlaceholder('alfa') !== P.linhaDoPlaceholder('beta'));

// ---------------------------------------------------------------------------
// 2. O DESFAZER com um Cloudflare falso
// ---------------------------------------------------------------------------
console.log('\n2. desfazerPlaceholder — apagar só o que reconheceu');

function cloudflareFalso({ codigo = PLACEHOLDER, leitura = 200, leituraLanca = false, deleteFalha = null } = {}) {
  const chamadas = [];
  const fetchFalso = async (url, opts = {}) => {
    const metodo = (opts.method || 'GET').toUpperCase();
    chamadas.push(metodo + ' ' + String(url).replace('https://api.cloudflare.com/client/v4', ''));
    const ehScript = /\/workers\/scripts\/[^/]+$/.test(String(url));
    const ehSubdominio = /\/workers\/scripts\/[^/]+\/subdomain$/.test(String(url));
    if (metodo === 'GET' && ehScript) {
      if (leituraLanca) throw new Error('rede caiu');
      if (leitura === 404) return new Response('nao encontrado', { status: 404 });
      if (leitura !== 200) return new Response('erro', { status: leitura });
      return new Response(codigo, { status: 200 });
    }
    if (metodo === 'DELETE') {
      if (deleteFalha && (ehSubdominio ? deleteFalha === 'subdominio' : deleteFalha === 'script')) {
        return new Response(JSON.stringify({ success: false, errors: [{ message: 'recusado' }] }), { status: 403 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };
  return { fetchFalso, chamadas };
}

const comFetchFalso = async (falso, fn) => {
  const original = globalThis.fetch;
  globalThis.fetch = falso.fetchFalso;
  try { return await fn(); } finally { globalThis.fetch = original; }
};

const TOKEN = 'token-de-teste';
const CONTA = 'conta-de-teste';

(async () => {
  {
    const falso = cloudflareFalso({ leitura: 404 });
    const r = await comFetchFalso(falso, () => P.desfazerPlaceholder({ token: TOKEN, accountId: CONTA, escola: 'valsa' }));
    conferir('Worker inexistente → nao-existe, sem DELETE',
      r.removido === false && r.motivo === 'nao-existe' && !falso.chamadas.some((c) => c.startsWith('DELETE')), r);
  }
  {
    const falso = cloudflareFalso({ codigo: PLACEHOLDER });
    const r = await comFetchFalso(falso, () => P.desfazerPlaceholder({ token: TOKEN, accountId: CONTA, escola: 'valsa', nome: 'Valsa' }));
    const deletes = falso.chamadas.filter((c) => c.startsWith('DELETE'));
    conferir('placeholder → removido, com DOIS DELETE', r.removido === true && r.motivo === 'removido' && deletes.length === 2, { r, deletes });
    conferir('o subdomínio sai ANTES do script (a ordem do expurgo)',
      deletes[0].endsWith('/subdomain') && !deletes[1].endsWith('/subdomain'), deletes);
  }
  {
    const falso = cloudflareFalso({ codigo: MOTOR });
    const r = await comFetchFalso(falso, () => P.desfazerPlaceholder({ token: TOKEN, accountId: CONTA, escola: 'valsa' }));
    conferir('escola a sério → não-e-placeholder, sem DELETE',
      r.removido === false && r.motivo === 'nao-e-placeholder' && !falso.chamadas.some((c) => c.startsWith('DELETE')), r);
  }
  {
    const falso = cloudflareFalso({ leitura: 500 });
    const r = await comFetchFalso(falso, () => P.desfazerPlaceholder({ token: TOKEN, accountId: CONTA, escola: 'valsa' }));
    conferir('leitura falhou (500) → nao-confirmado, sem DELETE',
      r.removido === false && r.motivo === 'nao-confirmado' && !falso.chamadas.some((c) => c.startsWith('DELETE')), r);
  }
  {
    const falso = cloudflareFalso({ leituraLanca: true });
    const r = await comFetchFalso(falso, () => P.desfazerPlaceholder({ token: TOKEN, accountId: CONTA, escola: 'valsa' }));
    conferir('a rede caiu na leitura → nao-confirmado, sem DELETE',
      r.removido === false && r.motivo === 'nao-confirmado' && !falso.chamadas.some((c) => c.startsWith('DELETE')), r);
  }
  {
    const falso = cloudflareFalso({ deleteFalha: 'script' });
    const r = await comFetchFalso(falso, () => P.desfazerPlaceholder({ token: TOKEN, accountId: CONTA, escola: 'valsa' }));
    conferir('a remoção foi recusada → remocao-recusada, sem lançar',
      r.removido === false && r.motivo === 'remocao-recusada', r);
  }
  {
    const falso = cloudflareFalso({});
    const r = await comFetchFalso(falso, () => P.desfazerPlaceholder({ token: '', accountId: CONTA, escola: 'valsa' }));
    conferir('sem token → sem-token e nenhuma chamada',
      r.motivo === 'sem-token' && falso.chamadas.length === 0, { r, chamadas: falso.chamadas });
  }

  // -------------------------------------------------------------------------
  // 3. O PROVISIONAMENTO QUE MORRE A MEIO
  // -------------------------------------------------------------------------
  console.log('\n3. criarEscola a meio — o Worker que subiu é desfeito');

  {
    // O 3.º passo (a senha) é recusado; o módulo já subiu.
    const chamadas = [];
    let leituras = 0;
    const falso = async (url, opts = {}) => {
      const metodo = (opts.method || 'GET').toUpperCase();
      chamadas.push(metodo + ' ' + String(url).replace('https://api.cloudflare.com/client/v4', ''));
      if (/\/secrets$/.test(String(url))) {
        return new Response(JSON.stringify({ success: false, errors: [{ message: 'segredo recusado' }] }), { status: 400 });
      }
      if (metodo === 'GET' && /\/workers\/scripts\/[^/]+$/.test(String(url))) {
        // 1.ª leitura: a sonda «já existe?» — a escola ainda não existe (404).
        // Seguintes: o rollback a ler o que ficou no ar (o placeholder).
        leituras += 1;
        return leituras === 1 ? new Response('', { status: 404 }) : new Response(PLACEHOLDER, { status: 200 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };
    let erro = null;
    const r = await comFetchFalso({ fetchFalso: falso }, async () => {
      try {
        await P.criarEscola({ nome: 'Valsa', senhaAdmin: 'x', token: TOKEN, accountId: CONTA });
      } catch (e) { erro = e; }
      return null;
    });
    const deletes = chamadas.filter((c) => c.startsWith('DELETE'));
    conferir('o erro sobe (o chamador não fica a pensar que criou)',
      Boolean(erro) && erro.etapa === 'senha', erro && erro.etapa);
    conferir('o Worker que tinha subido foi desfeito', deletes.length === 2, deletes);
    void r;
  }
  {
    // A escola já existe: 409 na porta, e NADA se apaga.
    const chamadas = [];
    const falso = async (url, opts = {}) => {
      const metodo = (opts.method || 'GET').toUpperCase();
      chamadas.push(metodo + ' ' + String(url).replace('https://api.cloudflare.com/client/v4', ''));
      if (metodo === 'GET' && /\/workers\/scripts\/[^/]+$/.test(String(url))) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };
    let erro = null;
    await comFetchFalso({ fetchFalso: falso }, async () => {
      try {
        await P.criarEscola({ nome: 'Fita', senhaAdmin: 'x', token: TOKEN, accountId: CONTA });
      } catch (e) { erro = e; }
    });
    conferir('escola que já existe → erro «existe» e nenhum DELETE',
      Boolean(erro) && erro.etapa === 'existe' && !chamadas.some((c) => c.startsWith('DELETE')), { etapa: erro && erro.etapa, chamadas });
  }

  // -------------------------------------------------------------------------
  // 4. A ROTA — onde a decisão aparece ao utilizador
  // -------------------------------------------------------------------------
  console.log('\n4. /api/criar-escola — o disparo que falha não deixa órfão');

  const SENHA = 'senha-da-raiz';
  const autorizacao = 'Basic ' + Buffer.from('tmenegaz:' + SENHA).toString('base64');

  // Um GitHub falso: a árvore vem vazia (nenhum professor), e o disparo responde o que se pedir.
  function githubFalso({ disparo = 204 } = {}) {
    return async (url) => {
      const u = String(url);
      if (u.includes('/git/trees/')) {
        return new Response(JSON.stringify({ tree: [{ type: 'tree', path: 'professores' }] }), { status: 200 });
      }
      if (u.includes('/dispatches')) return new Response(null, { status: disparo });
      return new Response('', { status: 204 });
    };
  }

  // Um Cloudflare falso que se lembra do que foi criado — e devolve o código que estiver lá.
  function cloudflareQueGuarda(estado) {
    return async (url, opts = {}) => {
      const u = String(url);
      const metodo = (opts.method || 'GET').toUpperCase();
      if (metodo === 'PUT' && /\/workers\/scripts\/[^/]+$/.test(u)) {
        estado.codigo = PLACEHOLDER;
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      if (metodo === 'GET' && /\/workers\/scripts\/[^/]+$/.test(u)) {
        if (!estado.codigo) return new Response('', { status: 404 });
        return new Response(estado.codigo, { status: 200 });
      }
      if (metodo === 'DELETE') {
        estado.codigo = null;
        estado.apagado = (estado.apagado || 0) + 1;
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };
  }

  const pedido = () => new Request('https://danca.test/api/criar-escola', {
    method: 'POST',
    headers: { Authorization: autorizacao, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Valsa', senhaAdmin: 'a', professorNome: 'Tiago', professorSobrenome: 'Menegaz', senhaProfessor: 'b',
    }),
  });

  {
    const estado = { codigo: null, apagado: 0 };
    const cf = cloudflareQueGuarda(estado);
    const gh = githubFalso({ disparo: 403 });
    const original = globalThis.fetch;
    globalThis.fetch = async (url, opts) => (String(url).includes('api.github.com') ? gh(url, opts) : cf(url, opts));
    let res, corpo;
    try {
      res = await raiz.fetch(pedido(), { SENHA_RAIZ: SENHA, CLOUDFLARE_API_TOKEN: 'cf', GITHUB_TOKEN: 'gh' });
      corpo = await res.json();
    } finally { globalThis.fetch = original; }
    conferir('disparo recusado → 502 (não 201 «escola criada»)', res.status === 502, res.status);
    conferir('…e ok:false, com o motivo do disparo', corpo.ok === false && /403/.test(corpo.erro || ''), corpo);
    conferir('…e o Worker foi desfeito', corpo.desfeito && corpo.desfeito.removido === true, corpo.desfeito);
    conferir('…e não sobrou código no Cloudflare', estado.codigo === null, estado.codigo);
  }
  {
    const estado = { codigo: null, apagado: 0 };
    const cf = cloudflareQueGuarda(estado);
    const gh = githubFalso({ disparo: 204 });
    const original = globalThis.fetch;
    globalThis.fetch = async (url, opts) => (String(url).includes('api.github.com') ? gh(url, opts) : cf(url, opts));
    let res, corpo;
    try {
      res = await raiz.fetch(pedido(), { SENHA_RAIZ: SENHA, CLOUDFLARE_API_TOKEN: 'cf', GITHUB_TOKEN: 'gh' });
      corpo = await res.json();
    } finally { globalThis.fetch = original; }
    conferir('disparo aceite → 201 e o Worker fica (é a escola a nascer)',
      res.status === 201 && corpo.ok === true && estado.apagado === 0, { status: res.status, apagado: estado.apagado });
  }
  {
    // Sem GITHUB_TOKEN na raiz não há como completar a escola: nada deve ficar no ar.
    const estado = { codigo: null, apagado: 0 };
    const cf = cloudflareQueGuarda(estado);
    const original = globalThis.fetch;
    globalThis.fetch = cf;
    let res, corpo;
    try {
      res = await raiz.fetch(pedido(), { SENHA_RAIZ: SENHA, CLOUDFLARE_API_TOKEN: 'cf' });
      corpo = await res.json();
    } finally { globalThis.fetch = original; }
    conferir('sem GITHUB_TOKEN → 502 e nada fica no ar',
      res.status === 502 && corpo.ok === false && estado.codigo === null, { status: res.status, corpo, codigo: estado.codigo });
  }
  {
    // O provisionamento morre a meio (o segredo é recusado): a rota desfaz e responde 500.
    const estado = { codigo: null, apagado: 0 };
    const base = cloudflareQueGuarda(estado);
    const cf = async (url, opts = {}) => {
      if (String(url).endsWith('/secrets')) return new Response(JSON.stringify({ success: false, errors: [{ message: 'recusado' }] }), { status: 400 });
      return base(url, opts);
    };
    const gh = githubFalso({ disparo: 204 });
    const original = globalThis.fetch;
    globalThis.fetch = async (url, opts) => (String(url).includes('api.github.com') ? gh(url, opts) : cf(url, opts));
    let res, corpo;
    try {
      res = await raiz.fetch(pedido(), { SENHA_RAIZ: SENHA, CLOUDFLARE_API_TOKEN: 'cf', GITHUB_TOKEN: 'gh' });
      corpo = await res.json();
    } finally { globalThis.fetch = original; }
    conferir('provisionamento a meio → 500 e nada fica no ar',
      res.status === 500 && corpo.ok === false && estado.codigo === null, { status: res.status, corpo, codigo: estado.codigo });
    conferir('…e a resposta diz que desfez', corpo.desfeito && corpo.desfeito.removido === true, corpo.desfeito);
  }
  {
    // A escola JÁ EXISTE (409): o Worker é uma escola a sério e não se toca.
    const estado = { codigo: MOTOR, apagado: 0 };
    const cf = cloudflareQueGuarda(estado);
    // O `escolaExiste` faz GET e, havendo código, a criação aborta com «existe».
    const original = globalThis.fetch;
    globalThis.fetch = cf;
    let res;
    try {
      res = await raiz.fetch(pedido(), { SENHA_RAIZ: SENHA, CLOUDFLARE_API_TOKEN: 'cf', GITHUB_TOKEN: 'gh' });
    } finally { globalThis.fetch = original; }
    conferir('escola que já existe → 409 e o Worker no ar NÃO é apagado',
      res.status === 409 && estado.apagado === 0 && estado.codigo === MOTOR, { status: res.status, apagado: estado.apagado });
  }

  // ---------------------------------------------------------------------------
  console.log('');
  if (falhas) {
    console.log(falhas + ' FALHA(S)');
    process.exit(1);
  }
  console.log('TODAS AS PROVAS PASSARAM');
})();
