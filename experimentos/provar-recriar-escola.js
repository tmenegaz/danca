#!/usr/bin/env node
'use strict';

/*
 * provar-recriar-escola.js — a escola apagada volta a nascer, da proveniência, e chega às vivas à
 * espera de conciliação (16/11/2026).
 *
 * O QUE ELA DESCREVEU, e é o ciclo comercial inteiro:
 *
 *   «A escola Duo agora está na lista de escolas apagadas, você vai colocar mais uma coluna, que é
 *   para a seguinte ação: Recriar. […] Por causa da proveniência, temos todos os dados que a gente
 *   precisa para criar a escola, a gente vai clicar, eu vou clicar então em recriar, e aí eu recrio
 *   a escola e vou mandar a chave Pix para ele fazer o pagamento. Aí a escola vai estar lá nas
 *   escolas vivas, aguardando para ser habilitada. Aí então, depois que eu fizer a conciliação
 *   bancária, eu vou lá e habilito a escola e aí já está tudo certo.»
 *
 * O QUE O ELO TEM, E O QUE ELE NÃO TEM. Tem o slug, o professor (slug e nome), o responsável, o
 * ciclo e o `shard` — a memória de que a escola existiu. NÃO tem as senhas: elas nunca estiveram no
 * repositório, e a proveniência guarda o facto, não a forma de entrar. É por isso que a confirmação
 * as pede — e que, quando o cofre ainda as tem (escola de shard, cujo KV o expurgo não apaga), em
 * branco significa «mantém a do professor».
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. A JANELA — a regra temporal que decide «esta apagada já está a ser recriada»;
 *   B. AS RECUSAS — sem elo, nunca apagada, já recriada, janela aberta, sem senha nenhuma: cinco
 *      recusas, cada uma com o seu motivo, e NADA tocado;
 *   C. A RECRIAÇÃO — com o Cloudflare e o GitHub falsos: o disparo leva o professor, o ciclo e o
 *      shard do elo; a senha do cofre é herdada quando não vem nova; o registo comercial nasce
 *      `aguardando` e LIMPO (sem a `desabilitadaEm` da encarnação anterior); a escola fica no mapa;
 *   D. AS DUAS LISTAS — a que está a ser recriada sai das apagadas e entra nas vivas como «a
 *      nascer»; a que não está, fica onde estava;
 *   E. A DERIVAÇÃO — a recriada não fica «expurgada» nem «fechada» no índice (o expurgo escreveu
 *      `estado.habilitada: false`, e o elo não se reescreve);
 *   F. A PÁGINA — em jsdom: a coluna, o botão, a confirmação com o plano e as duas senhas, o
 *      pedido com os valores certos, e o recado que diz o que fazer a seguir.
 *
 *   node experimentos/provar-recriar-escola.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const senha = require(path.join(RAIZ, 'motor/nucleo/senha.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

const AUTORIZACAO = 'Basic ' + Buffer.from('tmenegaz:senha-da-raiz').toString('base64');

/** Um KV de bolso, com as chaves à vista. */
function kvCom(pares) {
  const dados = new Map(Object.entries(pares || {}));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
    dados,
  };
}

/**
 * O ELO DE UMA ESCOLA APAGADA — o da `duo`, com a forma real: o expurgo no fim, e o professor no
 * topo (é dele que sai o responsável, quando não há elo de recriação).
 */
const ELO = {
  escola: 'duo',
  worker: 'duo',
  criado_em: '2026-11-16T12:25:10.980318+00:00',
  professor: { slug: 'fernando-franciose', nome: 'Fernando Franciose' },
  responsavel: 'Fernando Franciose',
  ciclo: '01',
  shard: 'lastro-teste',
  estado: { habilitada: false },
  arquivos: [],
  expurgo: [{
    em: '2026-11-16T13:56:53.907Z',
    motivo: 'expurgada pela página «Sistema Lastro»',
    apagado: ['professores/fernando-franciose/ciclos/ciclo-01-duo.conf'],
  }],
};

/** O GitHub falso: serve o elo e captura o disparo. */
function githubFalso({ elo = ELO, disparo = 204 } = {}) {
  const estado = { disparos: [], leituras: [] };
  estado.fetch = async (url, init) => {
    const u = String(url);
    const metodo = (init && init.method) || 'GET';
    const responde = (status, corpo) => ({
      ok: status >= 200 && status < 300, status,
      json: async () => corpo, text: async () => (typeof corpo === 'string' ? corpo : JSON.stringify(corpo)),
    });
    if (u.indexOf('/dispatches') !== -1 && metodo === 'POST') {
      estado.disparos.push(JSON.parse((init && init.body) || '{}'));
      return responde(disparo, {});
    }
    const m = /\/contents\/([^?]+)/.exec(u);
    if (m) {
      const caminho = decodeURIComponent(m[1]);
      estado.leituras.push(caminho);
      if (caminho === 'escola/' + String(elo === null ? 'x' : elo.escola) + '/indice.json') {
        return responde(200, {
          content: Buffer.from(JSON.stringify(elo), 'utf8').toString('base64'),
          encoding: 'base64',
        });
      }
      return responde(404, { message: 'Not Found' });
    }
    // A leitura de volta do run: sem resultado, e o disparo continua válido.
    return responde(200, { workflow_runs: [] });
  };
  return estado;
}

/** O Cloudflare falso — a zona, o DNS e as rotas que o `ligarDominio` do shard usa. */
function cloudflareFalso() {
  const estado = { rotas: [], pedidos: [] };
  const json = (o, status) => ({
    ok: (status || 200) < 300, status: status || 200,
    json: async () => o, text: async () => JSON.stringify(o),
  });
  estado.fetch = async (url, init) => {
    const u = String(url);
    const metodo = (init && init.method) || 'GET';
    estado.pedidos.push({ metodo, url: u });
    /* A ESCOLA NÃO EXISTE NO CLOUDFLARE — e é isto que `criarEscola` pergunta antes de criar
     * (`escolaExiste` lê o script com o nome da escola). Num shard nunca houve Worker com o nome
     * dela; responder 200 aqui diria «já existe» e a recriação morreria na primeira guarda. */
    if (/\/workers\/scripts\/[^/?]+$/.test(u) && metodo === 'GET') return json({ success: true }, 404);
    if (/\/zones\?name=/.test(u)) return json({ success: true, result: [{ id: 'zona-1', name: 'padd.com.br' }] });
    if (/\/dns_records\?name=/.test(u)) return json({ success: true, result: [] });
    if (/\/dns_records$/.test(u) && metodo === 'POST') return json({ success: true, result: { id: 'dns-novo' } });
    if (/\/workers\/routes$/.test(u) && metodo === 'GET') return json({ success: true, result: estado.rotas });
    if (/\/workers\/routes$/.test(u) && metodo === 'POST') {
      const corpo = JSON.parse((init && init.body) || '{}');
      const nova = { id: 'rota-' + (estado.rotas.length + 1), pattern: corpo.pattern, script: corpo.script };
      estado.rotas.push(nova);
      return json({ success: true, result: nova });
    }
    return json({ success: true, result: null });
  };
  return estado;
}

/** O `env` da raiz, com o KV e os dois tokens. */
function envCom(kv, extra) {
  return Object.assign({
    SENHA_RAIZ: 'senha-da-raiz',
    PADD_KV: kv,
    GITHUB_TOKEN: 'gh-de-mentira',
    CLOUDFLARE_API_TOKEN: 'cf-de-mentira',
    SHARD_SCRIPT: 'lastro-teste',
    ZONA_ESCOLAS: 'padd.com.br',
    /* A CHAVE DO PROVEDOR, no `env` da prova. Sem ela o `correio.enviar` devolve «sem
     * RESEND_API_KEY» SEM chamar o `fetch` — e uma prova que medisse «não saiu carta» concluiria
     * que a composição está partida, quando o que falta é a chave. */
    RESEND_API_KEY: 're-de-mentira',
    ASSETS: { fetch: async () => new Response('{}', { status: 404 }) },
  }, extra || {});
}

/** A escolha do plano que a confirmação manda — o primeiro do catálogo. */
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const PLANO = comercial.catalogoDaPagina().assinaturas[0].id;

(async () => {
  console.log('A. A janela: «esta apagada já está a ser recriada?»');
  {
    const apagada = '2026-11-16T13:56:53.907Z';
    conferir('o registo comercial escrito DEPOIS do expurgo é uma recriação a caminho',
      raiz.reconstruindo({
        comercial: { atualizadoEm: '2026-11-16T14:10:00.000Z' }, expurgada_em: apagada,
      }) === true, null);
    conferir('…e o escrito ANTES é a vida anterior, e não conta',
      raiz.reconstruindo({
        comercial: { atualizadoEm: '2026-11-16T12:00:00.000Z' }, expurgada_em: apagada,
      }) === false, null);
    conferir('sem registo comercial não há recriação a anunciar',
      raiz.reconstruindo({ comercial: null, expurgada_em: apagada }) === false, null);
    conferir('sem data de expurgo também não (não há com que comparar)',
      raiz.reconstruindo({ comercial: { atualizadoEm: apagada }, expurgada_em: null }) === false, null);
  }

  console.log('\nB. O convite: as recusas, e o token que só existe em hash');
  {
    const pedirConvite = async (env, escola) => {
      const res = await raiz.fetch(new Request('https://danca.padd.com.br/api/recriar-convite', {
        method: 'POST',
        headers: { Authorization: AUTORIZACAO, 'Content-Type': 'application/json' },
        body: JSON.stringify({ escola }),
      }), env);
      return { status: res.status, corpo: await res.json().catch(() => ({})) };
    };

    /* AS TRÊS RECUSAS, sem tocar em nada. A janela (`reconstruindo`) é a quarta, medida na
     * secção A; aqui mede-se o que a rota responde. */
    const semElo = githubFalso({ elo: null });
    globalThis.fetch = semElo.fetch;
    try {
      const r = await pedirConvite(envCom(kvCom({})), 'outra');
      conferir('sem elo: 404, e aponta o «Criar nova escola»',
        r.status === 404 && /Criar nova escola/.test(r.corpo.erro || ''), r);
    } finally { delete globalThis.fetch; }

    const semExpurgo = JSON.parse(JSON.stringify(ELO));
    delete semExpurgo.expurgo;
    const gh0 = githubFalso({ elo: semExpurgo });
    globalThis.fetch = gh0.fetch;
    try {
      const r = await pedirConvite(envCom(kvCom({})), 'duo');
      conferir('nunca apagada: 409, e diz que ela está nas vivas',
        r.status === 409 && /lista das vivas/.test(r.corpo.erro || ''), r);
    } finally { delete globalThis.fetch; }

    const ghEmCurso = githubFalso();
    globalThis.fetch = ghEmCurso.fetch;
    try {
      const kv = kvCom({
        'bastidores/duo/comercial': JSON.stringify({
          estado: 'aguardando', atualizadoEm: '2026-11-16T14:10:00.000Z', criadoEm: '2026-11-16T14:10:00.000Z',
          plano: PLANO,
        }),
      });
      const r = await pedirConvite(envCom(kv), 'duo');
      conferir('recriação já em curso: 409, e não manda outro convite',
        r.status === 409 && /já está em curso/.test(r.corpo.erro || ''), r);
    } finally { delete globalThis.fetch; }
  }

  console.log('\nC. O convite que sai: um e-mail, um link, e o KV sem o segredo');
  {
    const registo = await senha.registoDeSenha('senha-antiga');
    const kv = kvCom({
      'bastidores/duo/cadastro': JSON.stringify({
        escolaNome: 'Duo', email: 'escola@exemplo.test', criadoEm: '2026-11-16T12:00:00.000Z',
      }),
      'professores/fernando-franciose/contato': JSON.stringify({ email: 'professor@exemplo.test' }),
      /* O cofre da vida anterior: a senha dele já não importa — nesta versão quem a cria é a
       * escola —, mas a chave existir garante que o provisionamento não a apaga por acidente. */
      'bastidores/duo/dono': JSON.stringify({ hash: registo.hash, sal: registo.sal, slug: 'fernando-franciose' }),
    });
    const gh = githubFalso();
    const cartas = [];
    const fetchGithub = gh.fetch;
    globalThis.fetch = async (url, init) => {
      const u = String(url);
      if (u.indexOf('api.resend.com') !== -1) {
        cartas.push(JSON.parse((init && init.body) || '{}'));
        return { ok: true, status: 200, json: async () => ({ id: 'carta-1' }), text: async () => '' };
      }
      return fetchGithub(url, init);
    };
    let r;
    try {
      r = await raiz.criarConvite({ env: envCom(kv, { PIX_CHAVE: 'chave@pix.test' }), escola: 'duo' });
    } finally { delete globalThis.fetch; }

    conferir('o convite é emitido', r.ok === true, r);
    const token = String(r.link || '').split('/recriar/')[1] || '';
    conferir('…e o link é do endereço PÚBLICO, e leva o slug e 32 hex',
      /^https:\/\/lastro\.padd\.com\.br\/recriar\/duo-[a-f0-9]{32}$/.test(String(r.link || '')), r.link);
    conferir('…com um prazo dito em texto, na hora de quem lê', Boolean(r.expiraEmTexto), r.expiraEmTexto);

    const guardado = JSON.parse(kv.dados.get('bastidores/duo/convite') || '{}');
    conferir('o KV guarda o convite da escola', guardado.escola === 'duo', guardado);
    conferir('…e NUNCA o segredo em claro — só o SHA-256 dele',
      Boolean(guardado.hash) && String(guardado.hash).length === 64
        && JSON.stringify(guardado).indexOf(token.split('-')[1]) === -1, Object.keys(guardado));
    conferir('…com a data de expiração', Boolean(Date.parse(guardado.expiraEm || '')), guardado.expiraEm);

    conferir('saiu UMA carta, e uma só', cartas.length === 1, cartas.length);
    const carta = cartas[0] || {};
    conferir('…para o e-mail da escola E o do professor',
      Array.isArray(carta.to) && carta.to.indexOf('escola@exemplo.test') !== -1
        && carta.to.indexOf('professor@exemplo.test') !== -1, carta.to);
    conferir('…com o link do convite no corpo',
      String(carta.text || '').indexOf(r.link) !== -1, (carta.text || '').slice(0, 140));
    conferir('…e a instrução do Pix: escrever o nome da escola na descrição',
      /escreva o nome da escola/i.test(String(carta.text || '')), null);
    conferir('…sem prometer acesso imediato (a conciliação é manual)',
      /até 24 horas/i.test(String(carta.text || '')), null);

    /* O CONVITE VALE UMA VEZ E POR TEMPO LIMITADO — medido no núcleo, sem KV. */
    const nucleo = require(path.join(RAIZ, 'motor/nucleo/convite.js'));
    const segredo = 'a'.repeat(32);
    const bom = { escola: 'duo', hash: await nucleo.hashDoToken(segredo), expiraEm: nucleo.validadeDe() };
    conferir('um convite válido passa', (await nucleo.estadoDoConvite(bom, segredo)).ok === true, null);
    conferir('…e o mesmo token DEPOIS de usado não passa',
      (await nucleo.estadoDoConvite(Object.assign({}, bom, { usadoEm: new Date().toISOString() }), segredo)).ok === false, null);
    conferir('…e um token expirado também não',
      (await nucleo.estadoDoConvite(Object.assign({}, bom, { expiraEm: '2020-01-01T00:00:00Z' }), segredo)).ok === false, null);
    conferir('…e um token que não é o do convite também não',
      (await nucleo.estadoDoConvite(bom, 'b'.repeat(32))).ok === false, null);
  }

  console.log('\nD. O token como autenticação: a página pública abre, e só com ele');
  {
    const nucleo = require(path.join(RAIZ, 'motor/nucleo/convite.js'));
    const segredo = nucleo.novoToken();
    const token = 'duo-' + segredo;
    const kv = kvCom({
      'bastidores/duo/convite': JSON.stringify({
        escola: 'duo', nome: 'Duo', hash: await nucleo.hashDoToken(segredo),
        criadoEm: new Date().toISOString(), expiraEm: nucleo.validadeDe(),
      }),
    });
    const env = envCom(kv, { PIX_CHAVE: 'chave@pix.test', PIX_TITULAR: 'Sistema Lastro' });
    const abrir = async (tk) => {
      const res = await raiz.fetch(new Request('https://lastro.padd.com.br/recriar/' + tk), env);
      return { status: res.status, html: await res.text() };
    };

    const boa = await abrir(token);
    conferir('a página do convite abre no endereço PÚBLICO (sem a senha da raiz)', boa.status === 200, boa.status);
    conferir('…com o nome da escola', /Duo/.test(boa.html), null);
    conferir('…com os planos do catálogo', /id="convite-plano"/.test(boa.html)
      && (boa.html.match(/<option value="/g) || []).length > 1, null);
    conferir('…com os dois campos de senha', /convite-senha-escola/.test(boa.html)
      && /convite-senha-professor/.test(boa.html), null);
    conferir('…com a chave Pix copiável', /convite-pix-chave/.test(boa.html)
      && boa.html.indexOf('chave@pix.test') !== -1, null);
    conferir('…e com a instrução de escrever o nome da escola no Pix',
      /escreva o nome da escola/i.test(boa.html), null);

    /* AS EXTENSÕES DO PLANO (16/11/2026) — «Faltou dar a possibilidade de escolher entre as
     * extensões para o plano.» A caixa existe com o catálogo dentro, e é o script que mostra só as
     * do plano escolhido: quais são e em que planos entram NÃO se copia para a página. */
    conferir('…e com a caixa das extensões, alimentada pelo catálogo do servidor',
      /id="convite-extensoes"/.test(boa.html) && /data-extensoes="/.test(boa.html), null);
    const catalogoBruto = JSON.parse(
      (boa.html.match(/data-extensoes="([^"]*)"/)[1] || '')
        .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    conferir('…com TODAS as extensões do catálogo (o filtro é do plano, e é do script)',
      catalogoBruto.length === comercial.catalogoDaPagina().extensoes.length && catalogoBruto.length > 1,
      catalogoBruto.map((e) => e.id));
    conferir('…e cada uma diz em que planos entra', catalogoBruto.every((e) => Array.isArray(e.em) && e.em.length),
      null);
    /* O PEDIDO VAI PARA `/api/recriar/…` NA RAIZ DO SÍTIO. Aqui esteve um caminho relativo, que
     * dentro de `/recriar/<token>` resolvia para `/recriar/api/recriar/<token>` — 404, e a página
     * dizia «não foi possível concluir o cadastro» sobre um pedido que nunca chegou à rota. */
    conferir('…e o pedido vai para a raiz do sítio, e não para o lado da página',
      boa.html.indexOf('fetch("/api/recriar/') !== -1,
      (boa.html.match(/fetch\("[^"]*"/) || [])[0]);
    conferir('…levando as extensões escolhidas no corpo', /extensoes:extensoesEscolhidas\(\)/.test(boa.html), null);

    const errada = await abrir('duo-' + 'f'.repeat(32));
    conferir('com o token errado, 404 — e SEM formulário', errada.status === 404
      && !/convite-senha-escola/.test(errada.html), errada.status);
    const curto = await abrir('duo');
    conferir('com um endereço incompleto, 404 — e diz para copiar o link inteiro',
      curto.status === 404 && /link inteiro/.test(curto.html), curto.status);
  }

  console.log('\nE. O cadastro pela escola: cria, gasta o convite, avisa quem concilia');
  {
    const nucleo = require(path.join(RAIZ, 'motor/nucleo/convite.js'));
    const segredo = nucleo.novoToken();
    const token = 'duo-' + segredo;
    const registo = await senha.registoDeSenha('senha-antiga');
    const kv = kvCom({
      'bastidores/duo/convite': JSON.stringify({
        escola: 'duo', nome: 'Duo', hash: await nucleo.hashDoToken(segredo),
        criadoEm: new Date().toISOString(), expiraEm: nucleo.validadeDe(),
      }),
      'bastidores/duo/cadastro': JSON.stringify({ escolaNome: 'Duo', email: 'escola@exemplo.test' }),
      'professores/fernando-franciose/contato': JSON.stringify({ email: 'professor@exemplo.test' }),
      'bastidores/duo/dono': JSON.stringify({ hash: registo.hash, sal: registo.sal }),
      'escolas/por-host': JSON.stringify({}),
    });
    const gh = githubFalso();
    const cf = cloudflareFalso();
    const cartas = [];
    const fetchGithub = gh.fetch;
    globalThis.fetch = async (url, init) => {
      const u = String(url);
      if (u.indexOf('api.resend.com') !== -1) {
        cartas.push(JSON.parse((init && init.body) || '{}'));
        return { ok: true, status: 200, json: async () => ({ id: 'c-' + cartas.length }), text: async () => '' };
      }
      return u.indexOf('api.github.com') !== -1 ? fetchGithub(url, init) : cf.fetch(url, init);
    };
    const submeter = async (corpo) => {
      const res = await raiz.fetch(new Request('https://lastro.padd.com.br/api/recriar/' + token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      }), envCom(kv, { PIX_CHAVE: 'chave@pix.test' }));
      return { status: res.status, corpo: await res.json().catch(() => ({})) };
    };
    let r;
    try {
      const semSenha = await submeter({ plano: PLANO, senhaAdmin: '' });
      conferir('sem senha da escola: 400, e nada é criado',
        semSenha.status === 400 && /senha da escola/.test(semSenha.corpo.erro || ''), semSenha);
      conferir('…e nenhuma carta saiu com essa tentativa', cartas.length === 0, cartas.length);

      /* A ESCOLHA DA EXTENSÃO, e a recusa da que o plano não inclui — a regra é a do catálogo, e
       * a página não a pode contornar: o `POST` é público, e um corpo bem feito à mão vale tanto
       * como um clique. */
      const foraDoPlano = await submeter({
        plano: PLANO, extensoes: [comercial.catalogoDaPagina().extensoes[1].id], senhaAdmin: 'x',
      });
      conferir('uma extensão que o plano não inclui: 400, e o nome dela na recusa',
        foraDoPlano.status === 400
          && String(foraDoPlano.corpo.erro || '').indexOf(comercial.catalogoDaPagina().extensoes[1].id) !== -1,
        foraDoPlano);
      conferir('…e nada foi criado com essa tentativa', cartas.length === 0, cartas.length);

      r = await submeter({ plano: PLANO, senhaAdmin: 'nova-da-escola', senhaProfessor: 'nova-do-professor' });
    } finally { delete globalThis.fetch; }

    conferir('o cadastro pela escola completa', r.status === 201 && r.corpo.ok === true, r);
    conferir('…e a escola é a mesma do convite (não é outra ao lado)', r.corpo.escola === 'duo', r.corpo.escola);
    conferir('…com o horário do CLIQUE na resposta, escrito na hora de quem lê',
      Boolean(r.corpo.quando) && /às \d\d:\d\d/.test(String(r.corpo.quandoTexto || '')), r.corpo.quandoTexto);

    const conviteGasto = JSON.parse(kv.dados.get('bastidores/duo/convite') || '{}');
    conferir('o convite fica marcado como usado, com o instante',
      Boolean(conviteGasto.usadoEm), conviteGasto.usadoEm);
    const segunda = await raiz.fetch(new Request('https://lastro.padd.com.br/api/recriar/' + token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plano: PLANO, senhaAdmin: 'outra' }),
    }), envCom(kv, { PIX_CHAVE: 'chave@pix.test' })).then(async (res) => ({ status: res.status, corpo: await res.json() }));
    conferir('…e a segunda tentativa é recusada com 410 (o link vale uma vez)',
      segunda.status === 410, segunda.status);

    /* AS DUAS CARTAS: o aviso a quem concilia e a mensagem com o endereço. */
    const aviso = cartas.find((c) => /contratou o serviço/.test(String(c.subject || '')));
    conferir('saiu o aviso a quem concilia', Boolean(aviso), cartas.map((c) => c.subject));
    conferir('…com o assunto «A escola «Duo» contratou o serviço da Lastro»',
      String((aviso || {}).subject) === 'A escola «Duo» contratou o serviço da Lastro', (aviso || {}).subject);
    conferir('…para o endereço do proprietário', Array.isArray((aviso || {}).to)
      && aviso.to.length === 1 && aviso.to[0] === 'lastro@padd.com.br', (aviso || {}).to);
    conferir('…com o HORÁRIO DO CLIQUE e o nome da escola no corpo',
      String(aviso.text || '').indexOf(r.corpo.quandoTexto) !== -1
        && /Duo/.test(String(aviso.text || '')), (aviso || {}).text && aviso.text.slice(0, 200));
    conferir('…com o plano e o valor, que é o que se procura no extrato',
      new RegExp(comercial.catalogoDaPagina().assinaturas[0].nome).test(String(aviso.text || '')), null);
    const boasVindas = cartas.find((c) => /está criada no Sistema Lastro/.test(String(c.subject || '')));
    conferir('…e saiu a mensagem com o endereço da escola, para quem a vai usar',
      Boolean(boasVindas) && Array.isArray(boasVindas.to) && boasVindas.to.length === 2,
      cartas.map((c) => c.subject));

    const comercialDepois = JSON.parse(kv.dados.get('bastidores/duo/comercial') || '{}');
    conferir('a escola nasce «aguardando» — é a conciliação que abre o acesso',
      comercialDepois.estado === 'aguardando', comercialDepois.estado);
    conferir('…com a origem declarada como convite', comercialDepois.origem === 'convite', comercialDepois.origem);
    /* SEM ESCOLHA, O REGISTO LEVA O QUE O PLANO INCLUI — é a regra do `validarEscolha`, e é ela que
     * mantém de pé a criação pelo formulário público e as recriações de antes desta mudança. */
    conferir('…e com as extensões do plano, quando a página não manda nenhuma',
      JSON.stringify(comercialDepois.extensoes)
        === JSON.stringify(comercial.extensoesDoPlano(PLANO).map((e) => e.id)),
      comercialDepois.extensoes);
  }

  console.log('\nF. As duas listas: a que está a ser recriada muda de lado');
  {
    const agora = Date.now();
    const apagadaEm = new Date(agora - 60 * 60000).toISOString();
    const escritoEm = new Date(agora - 5 * 60000).toISOString();
    const conhecidas = [
      { slug: 'duo', expurgada: true, expurgada_em: apagadaEm },
      { slug: 'breu', expurgada: true, expurgada_em: apagadaEm },
    ];
    const kv = kvCom({
      'escolas/por-host': JSON.stringify({
        'duo.padd.com.br': 'duo', 'duo.tmenegaz77.workers.dev': 'duo',
        'breu.padd.com.br': 'breu',
      }),
      /* A `duo` foi recriada há cinco minutos; a `breu` só tem o registo da vida anterior. */
      'bastidores/duo/comercial': JSON.stringify({
        estado: 'aguardando', atualizadoEm: escritoEm, criadoEm: escritoEm,
        plano: 'basico', professor: 'fernando-franciose',
      }),
      'bastidores/breu/comercial': JSON.stringify({
        estado: 'suspensa', atualizadoEm: new Date(agora - 90 * 60000).toISOString(),
        criadoEm: new Date(agora - 90 * 60000).toISOString(), plano: 'basico',
      }),
    });
    const aNascer = await raiz.escolasANascer({ kv, conhecidas });
    const slugs = aNascer.map((e) => e.slug);
    conferir('a RECRIADA entra nas vivas como «a nascer»', slugs.indexOf('duo') !== -1, slugs);
    conferir('…e a que continua apagada NÃO entra — o registo da vida anterior não ressuscita nada',
      slugs.indexOf('breu') === -1, slugs);
    conferir('…e a linha diz que está a nascer', aNascer.find((e) => e.slug === 'duo').aNascer === true, null);
  }

  console.log('\nG. A derivação: a recriada não pode ficar «expurgada» nem «fechada»');
  {
    /* O ÍNDICE É DERIVADO do repositório, e há DUAS coisas nele que o expurgo escreveu e o elo não
     * reescreve: `expurgada` (do facto de haver config/pacote) e `habilitada` (do `estado` do elo,
     * posto a `false` pelo expurgo). A primeira desfaz-se sozinha quando o CI recria o pacote; a
     * segunda não — e sem esta regra a escola recriada ficaria viva e dita fechada, para sempre. */
    const indices = require(path.join(RAIZ, 'motor/nucleo/indices.js'));
    const base = {
      agora: '2026-11-16T15:00',
      arvores: [
        'wrangler.duo.jsonc', 'escola/duo/indice.json',
        'professores/fernando-franciose/ciclos/ciclo-01-duo/index.html',
      ],
      envelopes: {}, ancoras: {},
    };
    const apagado = {
      escola: 'duo', ciclo: '01', professor: { slug: 'fernando-franciose', nome: 'Fernando Franciose' },
      shard: 'lastro-teste', estado: { habilitada: false },
      expurgo: [{ em: '2026-11-16T13:56:53.907Z', motivo: 'expurgado' }],
    };
    const recriado = JSON.parse(JSON.stringify(apagado));
    recriado.recriacao = [{ em: '2026-11-16T15:02:00.000Z', motivo: 'recriada pela página' }];

    const semRecriacao = indices.construir(Object.assign({}, base, { inventarios: { duo: apagado } }));
    const comRecriacao = indices.construir(Object.assign({}, base, { inventarios: { duo: recriado } }));
    const a = (r) => (r.acervo.escolas || []).find((e) => e.slug === 'duo') || {};
    conferir('com o pacote recriado, a escola deixa de estar expurgada',
      a(semRecriacao).expurgada === false, a(semRecriacao).expurgada);
    conferir('…e o `estado.habilitada: false` do expurgo NÃO a deixa fechada para sempre',
      a(semRecriacao).habilitada === false && a(comRecriacao).habilitada === true,
      { sem: a(semRecriacao).habilitada, com: a(comRecriacao).habilitada });
    conferir('…e uma escola expurgada continua proibida de estar habilitada',
      (() => {
        const aindaApagada = indices.construir(Object.assign({}, base, {
          arvores: ['escola/duo/indice.json'], inventarios: { duo: apagado },
        }));
        return a(aindaApagada).expurgada === true && a(aindaApagada).habilitada === false;
      })(), null);
  }


  console.log('\nH. A página do painel: a coluna, o botão e a confirmação do ENVIO');
  {
    const { JSDOM, VirtualConsole } = require('jsdom');
    const catalogo = comercial.catalogoDaPagina();
    const html = painel.paginaDasApagadas({
      escolas: [{
        slug: 'duo', nome: 'Duo', professor: 'fernando-franciose', professores: ['fernando-franciose'],
        criada_em: '2026-11-16T12:25:10.000Z', expurgada_em: '2026-11-16T13:56:53.000Z',
        expurgada: true, expurgos: 1, planoAnterior: { id: PLANO, nome: 'Básico', valor: '69,90' },
      }],
      professores: [],
      catalogo,
    });
    conferir('a coluna «Recriar» existe, e é a última', /<th>Recriar<\/th><\/tr><\/thead>/.test(html), null);
    conferir('…e há um botão por escola apagada', (html.match(/data-recriar="/g) || []).length === 1, null);
    conferir('a confirmação é uma janela (`.modal`) do ENVIO, e não do cadastro',
      /id="recriar-modal"/.test(html) && /Convidar a escola a voltar/.test(html), null);
    /* A SENHA NÃO SE ESCREVE MAIS AQUI. É o ponto do desenho: quem a cria é a escola, na página do
     * convite, e uma senha que passa pela mão da proprietária deixou de ser um segredo. */
    conferir('…e NÃO tem campos de senha — a senha é da escola, na página do link',
      !/recriar-senha-admin/.test(html) && !/recriar-senha-professor/.test(html), null);
    conferir('…nem a lista de planos: quem escolhe é a escola',
      !/id="recriar-plano"/.test(html), null);

    const vc = new VirtualConsole();
    const erros = [];
    vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
    const pedidos = [];
    const dom = new JSDOM(html, {
      runScripts: 'dangerously', url: 'https://danca.padd.com.br/escolas-apagadas',
      virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
        w.fetch = (u, init) => {
          pedidos.push({ url: String(u), corpo: JSON.parse((init && init.body) || '{}') });
          return Promise.resolve({
            status: 200, ok: true,
            json: () => Promise.resolve({
              ok: true, escola: 'duo', nome: 'Duo', para: ['escola@exemplo.test', 'professor@exemplo.test'],
              link: 'https://lastro.padd.com.br/recriar/duo-' + 'a'.repeat(32),
              expiraEmTexto: '23/11/2026 às 11:00', correio: { enviado: true },
            }),
          });
        };
      },
    });
    await new Promise((r) => setTimeout(r, 200));
    const d = dom.window.document;
    const botao = d.querySelector('[data-recriar="duo"]');
    conferir('o botão da linha existe e diz «Recriar»', Boolean(botao) && /Recriar/.test(botao.textContent), null);
    botao.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 50));
    conferir('o clique abre a confirmação', d.getElementById('recriar-modal').hidden === false, null);
    d.getElementById('recriar-confirmar').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    conferir('o pedido vai para `/api/recriar-convite`', pedidos.length === 1
      && /api\/recriar-convite/.test(pedidos[0].url), pedidos.map((p) => p.url));
    conferir('…e leva SÓ a escola — plano e senhas não passam por aqui',
      Object.keys(pedidos[0].corpo).join(',') === 'escola' && pedidos[0].corpo.escola === 'duo',
      pedidos[0].corpo);
    const texto = d.getElementById('recriar-recado').textContent;
    conferir('o recado diz para quem foi o convite, e até quando vale',
      /enviado para escola@exemplo\.test, professor@exemplo\.test/.test(texto)
        && /23\/11\/2026/.test(texto), texto);
    /* SEM E-MAIL, O LINK NÃO SE PERDE — é o que permite mandá-lo à mão. */
    const dom2 = new JSDOM(painel.paginaDasApagadas({
      escolas: [{ slug: 'duo', expurgada: true, expurgada_em: '2026-11-16T13:56:53Z',
        criada_em: '2026-11-16T12:00:00Z', professores: [], planoAnterior: null }],
      professores: [], catalogo,
    }), {
      runScripts: 'dangerously', url: 'https://danca.padd.com.br/escolas-apagadas', virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
        w.fetch = () => Promise.resolve({
          status: 200, ok: true,
          json: () => Promise.resolve({
            ok: true, escola: 'duo', nome: 'Duo', para: [],
            link: 'https://lastro.padd.com.br/recriar/duo-' + 'b'.repeat(32),
            expiraEmTexto: '23/11/2026 às 11:00',
            correio: { enviado: false, motivo: 'não há e-mail a quem enviar' },
          }),
        });
      },
    });
    await new Promise((r) => setTimeout(r, 200));
    const d2 = dom2.window.document;
    d2.querySelector('[data-recriar="duo"]').dispatchEvent(new dom2.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 40));
    d2.getElementById('recriar-confirmar').dispatchEvent(new dom2.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    const t2 = d2.getElementById('recriar-recado').textContent;
    conferir('sem e-mail no cadastro, o recado mostra o LINK para mandar à mão',
      /lastro\.padd\.com\.br\/recriar\/duo-b/.test(t2), t2);
    conferir('…e os scripts das duas páginas não lançam', erros.length === 0, erros.slice(0, 1));
    dom.window.close();
    dom2.window.close();
  }

  /* ── I. A PÁGINA DO CONVITE A CORRER (16/11/2026) ────────────────────────────────────────────
   *
   * O QUE ESTA SECÇÃO MEDE, e por que razão ela é de jsdom e não de expressão regular: os dois
   * defeitos que ela encontrou a 16/11 só aparecem QUANDO ALGUÉM CARREGA. O pedido relativo
   * (`fetch("api/recriar/…")`) resolvia para `/recriar/api/recriar/…` — 404 na cara de quem
   * preencheu tudo e clicou; e a escolha das extensões não existia. Uma prova que só lesse o HTML
   * diria «está lá o campo» sobre um pedido que nunca chegava à rota.
   */
  console.log('\nI. A página do convite a correr: o plano, as extensões e o pedido');
  {
    const { JSDOM, VirtualConsole } = require('jsdom');
    const nucleo = require(path.join(RAIZ, 'motor/nucleo/convite.js'));
    const segredo = nucleo.novoToken();
    const token = 'duo-' + segredo;
    const catalogo = comercial.catalogoDaPagina();
    const comDuas = catalogo.assinaturas.find(
      (a) => comercial.extensoesDoPlano(a.id).length > 1) || catalogo.assinaturas[catalogo.assinaturas.length - 1];
    const comUma = catalogo.assinaturas.find((a) => comercial.extensoesDoPlano(a.id).length === 1)
      || catalogo.assinaturas[0];
    const html = painel.paginaDoConvite({
      escola: 'duo', nome: 'Duo', token, catalogo,
      pix: { chave: 'chave@pix.test', titular: 'Sistema Lastro' },
      estado: { ok: true, expiraEm: nucleo.validadeDe() },
    });

    const vc = new VirtualConsole();
    const erros = [];
    vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
    const pedidos = [];
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'https://lastro.padd.com.br/recriar/' + token,
      virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
        w.fetch = (u, init) => {
          pedidos.push({ url: String(u), corpo: JSON.parse((init && init.body) || '{}') });
          return Promise.resolve({
            status: 201, ok: true,
            json: () => Promise.resolve({
              ok: true, escola: 'duo', nome: 'Duo', quando: new Date().toISOString(),
              quandoTexto: '16/11/2026 às 11:40', url: 'https://duo.padd.com.br',
            }),
          });
        };
      },
    });
    await new Promise((r) => setTimeout(r, 200));
    const d = dom.window.document;
    const trocarPlano = async (id) => {
      const sel = d.getElementById('convite-plano');
      sel.value = id;
      sel.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
    };

    const caixa = d.getElementById('convite-extensoes');
    conferir('a caixa das extensões existe na página', Boolean(caixa), null);

    await trocarPlano(comUma.id);
    conferir('um plano com UMA extensão não pede escolha — a caixa fecha-se',
      caixa.hidden === true, { plano: comUma.id, escondida: caixa.hidden });

    await trocarPlano(comDuas.id);
    const opcoes = d.querySelectorAll('input[name="convite-extensao"]');
    conferir('um plano com DUAS extensões mostra as duas, para escolher',
      caixa.hidden === false && opcoes.length === 2, { plano: comDuas.id, opcoes: opcoes.length });
    conferir('…com a primeira marcada, e cada uma com a sua descrição',
      opcoes[0].checked === true && (d.querySelectorAll('#convite-extensoes small') || []).length === 2,
      null);
    conferir('…e são exatamente as do plano, segundo o catálogo',
      Array.prototype.map.call(opcoes, (o) => o.value).join(',')
        === comercial.extensoesDoPlano(comDuas.id).map((e) => e.id).join(','),
      Array.prototype.map.call(opcoes, (o) => o.value));

    /* ESCOLHE-SE A SEGUNDA — e é ela que tem de chegar ao servidor, não a primeira. */
    opcoes[1].checked = true;
    opcoes[0].checked = false;
    d.getElementById('convite-senha-escola').value = 'nova-da-escola';
    d.getElementById('convite-enviar').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));

    conferir('o clique faz UM pedido, à raiz do sítio (era aqui que ele se perdia em 404)',
      pedidos.length === 1 && pedidos[0].url.indexOf('/api/recriar/' + token) === 0,
      pedidos.map((p) => p.url));
    conferir('…com o plano, a senha e a extensão ESCOLHIDA — e a segunda, não a primeira',
      pedidos[0].corpo.plano === comDuas.id
        && pedidos[0].corpo.senhaAdmin === 'nova-da-escola'
        && JSON.stringify(pedidos[0].corpo.extensoes)
          === JSON.stringify([comercial.extensoesDoPlano(comDuas.id)[1].id]),
      pedidos[0].corpo);
    conferir('…e a página diz o que aconteceu a seguir (a conciliação é manual)',
      /concilia/i.test(d.getElementById('convite-recado').textContent), null);
    conferir('…sem um erro de jsdom a estragar o resto do script', erros.length === 0, erros.slice(0, 1));
    dom.window.close();
  }

  console.log('');
  console.log(ko === 0
    ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
