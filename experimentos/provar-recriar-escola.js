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

  console.log('\nB. As recusas — cinco, cada uma com o seu motivo, e nada tocado');
  {
    /* A ROTA, e não a função: o que a página vê é o status e a frase. */
    const pedir = async (env, corpo) => {
      const res = await raiz.fetch(new Request('https://danca.padd.com.br/api/recriar-escola', {
        method: 'POST',
        headers: { Authorization: AUTORIZACAO, 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      }), env);
      return { status: res.status, corpo: await res.json().catch(() => ({})) };
    };

    const semElo = githubFalso({ elo: null });
    globalThis.fetch = semElo.fetch;
    try {
      const r = await pedir(envCom(kvCom({})), { escola: 'outra', plano: PLANO });
      conferir('sem elo: 404, e diz que para uma escola nova há o «Criar nova escola»',
        r.status === 404 && /Criar nova escola/.test(r.corpo.erro || ''), r);
    } finally { delete globalThis.fetch; }

    const nuncaApagada = JSON.parse(JSON.stringify(ELO));
    delete nuncaApagada.expurgo;
    const gh = githubFalso({ elo: nuncaApagada });
    globalThis.fetch = gh.fetch;
    try {
      const r = await pedir(envCom(kvCom({})), { escola: 'duo', plano: PLANO });
      conferir('nunca apagada: 409, e diz que ela está na lista das vivas',
        r.status === 409 && /lista das vivas/.test(r.corpo.erro || ''), r);
    } finally { delete globalThis.fetch; }

    const jaRecriada = JSON.parse(JSON.stringify(ELO));
    jaRecriada.recriacao = [{ em: '2026-11-16T15:00:00.000Z', motivo: 'recriada pela página' }];
    const gh2 = githubFalso({ elo: jaRecriada });
    globalThis.fetch = gh2.fetch;
    try {
      const r = await pedir(envCom(kvCom({})), { escola: 'duo', plano: PLANO });
      conferir('já recriada depois do expurgo: 409, e diz que recriar outra vez criaria uma segunda',
        r.status === 409 && /já foi recriada/.test(r.corpo.erro || ''), r);
      conferir('…e não dispara nada', gh2.disparos.length === 0, gh2.disparos.length);
    } finally { delete globalThis.fetch; }

    /* A JANELA ABERTA: o elo ainda diz «apagada» (o CI não correu), mas o registo comercial já
     * foi escrito pela recriação anterior. Um segundo clique criaria dois `criar-escola` sobre a
     * mesma escola. */
    const gh3 = githubFalso();
    globalThis.fetch = gh3.fetch;
    try {
      const kv = kvCom({
        'bastidores/duo/comercial': JSON.stringify({
          estado: 'aguardando', atualizadoEm: '2026-11-16T14:10:00.000Z', criadoEm: '2026-11-16T14:10:00.000Z',
          plano: PLANO,
        }),
      });
      const r = await pedir(envCom(kv), { escola: 'duo', plano: PLANO, senhaAdmin: 'x' });
      conferir('recriação já em curso: 409, e diz para esperar o índice',
        r.status === 409 && /já está em curso/.test(r.corpo.erro || ''), r);
      conferir('…e não dispara nada', gh3.disparos.length === 0, gh3.disparos.length);
    } finally { delete globalThis.fetch; }

    /* SEM SENHA NENHUMA: nem no pedido, nem no cofre. Uma escola no ar que não abre para ninguém
     * seria pior do que não a recriar. */
    const gh4 = githubFalso();
    globalThis.fetch = gh4.fetch;
    try {
      const r = await pedir(envCom(kvCom({})), { escola: 'duo', plano: PLANO });
      conferir('sem senha no pedido nem no cofre: 400, e diz que uma escola sem senha não abre',
        r.status === 400 && /não abre para ninguém/.test(r.corpo.erro || ''), r);
      conferir('…e não dispara nada', gh4.disparos.length === 0, gh4.disparos.length);
    } finally { delete globalThis.fetch; }

    /* A PORTA PÚBLICA NÃO TEM ESTE GESTO. O endereço aberto só cria escola (e com o cadastro
     * completo); recriar é da proprietária. A regra é do HOST, e não do botão escondido — quem
     * escrever o pedido à mão no endereço público bate aqui. */
    const ghPub = githubFalso();
    globalThis.fetch = ghPub.fetch;
    try {
      const res = await raiz.fetch(new Request('https://lastro.padd.com.br/api/recriar-escola', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escola: 'duo', plano: PLANO, senhaAdmin: 'x' }),
      }), envCom(kvCom({})));
      conferir('no endereço PÚBLICO a recriação responde 404 — e sem autenticação nenhuma',
        res.status === 404, res.status);
      conferir('…e nada é disparado', ghPub.disparos.length === 0, ghPub.disparos.length);
    } finally { delete globalThis.fetch; }

    const semTokens = githubFalso();
    globalThis.fetch = semTokens.fetch;
    try {
      const r = await pedir(envCom(kvCom({}), { GITHUB_TOKEN: '' }), { escola: 'duo', plano: PLANO });
      conferir('sem GITHUB_TOKEN: 500, e nomeia o que falta',
        r.status === 500 && /GITHUB_TOKEN/.test(r.corpo.erro || ''), r);
    } finally { delete globalThis.fetch; }
  }

  console.log('\nC. A recriação: o elo manda, a senha do cofre é herdada, o registo nasce limpo');
  {
    /* O COFRE DA VIDA ANTERIOR — o que uma escola de shard conserva. O hash é de uma senha que
     * «Fernando» já usava; é ela que tem de continuar a valer quando o pedido vem sem senha. */
    const senhaAntiga = 'a-senha-do-fernando';
    const registo = await senha.registoDeSenha(senhaAntiga);
    const kv = kvCom({
      'bastidores/duo/dono': JSON.stringify({
        nome: 'Fernando Franciose', slug: 'fernando-franciose', escola: 'Duo',
        hash: registo.hash, sal: registo.sal,
        professor_hash: registo.hash, professor_sal: registo.sal,
      }),
      /* O REGISTO COMERCIAL DA VIDA ANTERIOR, com o que NÃO pode ser herdado: a suspensão que
       * levou ao expurgo. É esta data que a coluna «Desabilitada» mostraria na escola recriada. */
      'bastidores/duo/comercial': JSON.stringify({
        estado: 'suspensa', plano: 'intermediario', planoNome: 'Intermediário', valor: '99,90',
        desabilitadaEm: '2026-11-15T22:51:00.000Z', habilitadaEm: '2026-08-01T10:30:00.000Z',
        criadoEm: '2026-08-01T10:00:00.000Z', historico: [{ em: '2026-08-01T10:00:00.000Z', para: 'ativa' }],
      }),
      'escolas/por-host': JSON.stringify({}),
    });
    const gh = githubFalso();
    const cf = cloudflareFalso();
    const fetchGithub = gh.fetch;
    /* O `fetch` global serve os dois — o GitHub e o Cloudflare —, e é por isso que ele decide
     * pelo endereço: é a mesma coisa que um `fetch` real faria. */
    globalThis.fetch = async (url, init) => (String(url).indexOf('api.github.com') !== -1
      ? fetchGithub(url, init) : cf.fetch(url, init));
    let resultado;
    try {
      resultado = await raiz.recriarEscola({
        env: envCom(kv), escola: 'duo', plano: '', senhaAdmin: '', senhaProfessor: '',
      });
    } finally { delete globalThis.fetch; }

    conferir('a recriação completa', resultado.ok === true, resultado);
    conferir('…com o mesmo slug — não é outra escola ao lado',
      resultado.escola === 'duo', resultado.escola);
    conferir('…e o nome vem do cadastro/do slug, e reproduz o slug',
      resultado.nome === 'Duo', resultado.nome);

    const disparo = gh.disparos[0] || {};
    const entradas = disparo.inputs || {};
    conferir('o disparo do motor correu', gh.disparos.length === 1, gh.disparos.length);
    conferir('…com o professor do ELO (slug e nome)',
      entradas.professor === 'fernando-franciose' && entradas['professor-nome'] === 'Fernando Franciose', entradas);
    conferir('…com o ciclo do elo', entradas.ciclo === '01', entradas.ciclo);
    conferir('…com o shard do elo — o motor que se sobe é o do shard',
      entradas.shard === 'lastro-teste', entradas.shard);
    conferir('…e sem modalidade: o professor já existe, e o perfil dele não foi apagado',
      entradas.modalidade === '', entradas.modalidade);

    const dono = JSON.parse(kv.dados.get('bastidores/duo/dono') || '{}');
    conferir('a senha NÃO se perdeu: o cofre guarda o MESMO hash (em branco = manter)',
      dono.hash === registo.hash && dono.sal === registo.sal, Object.keys(dono));
    conferir('…e a senha antiga continua a conferir (é o professor que volta a entrar)',
      await senha.confere(senhaAntiga, dono), null);
    conferir('…e nenhuma senha em claro ficou no registo',
      !JSON.stringify(dono).includes(senhaAntiga), Object.keys(dono));

    const mapa = JSON.parse(kv.dados.get('escolas/por-host') || '{}');
    conferir('a escola volta ao MAPA, com o endereço próprio e o técnico',
      mapa['duo.padd.com.br'] === 'duo' && mapa['duo.tmenegaz77.workers.dev'] === 'duo', mapa);
    conferir('a ROTA aponta ao shard', cf.rotas.some((r) => /^duo\./.test(r.pattern) && r.script === 'lastro-teste'),
      cf.rotas);

    const comercialDepois = JSON.parse(kv.dados.get('bastidores/duo/comercial') || '{}');
    conferir('o estado comercial nasce «aguardando» — é a conciliação que abre o acesso',
      comercialDepois.estado === 'aguardando', comercialDepois.estado);
    conferir('…e a suspensão da vida anterior NÃO foi herdada',
      !comercialDepois.desabilitadaEm && !comercialDepois.habilitadaEm,
      { desabilitadaEm: comercialDepois.desabilitadaEm, habilitadaEm: comercialDepois.habilitadaEm });
    conferir('…nem o histórico dela', Array.isArray(comercialDepois.historico)
      && comercialDepois.historico.every((e) => e.para !== 'ativa'), comercialDepois.historico);
    conferir('…e o professor vai no registo, para a linha «a nascer» o mostrar',
      comercialDepois.professor === 'fernando-franciose', comercialDepois.professor);
    conferir('…com a origem declarada, para se saber que esta encarnação veio de uma recriação',
      comercialDepois.origem === 'recriacao' && Boolean(comercialDepois.recriadaDe), {
        origem: comercialDepois.origem, recriadaDe: comercialDepois.recriadaDe,
      });
    conferir('…e o plano veio do pedido (vazio = o da vida anterior, que era `intermediario`)',
      comercialDepois.plano === 'intermediario', comercialDepois.plano);
    conferir('a resposta traz o valor a pagar — é o que a chave Pix vai pedir',
      Boolean(resultado.aPagar && resultado.aPagar.valor), resultado.aPagar);
    /* O CORREIO, e a resposta diz a VERDADE sobre ele. Esta escola não tem cadastro no KV de
     * prova (o da vida anterior pode ter ido com o expurgo), e por isso não há a quem escrever:
     * `enviado: false` com o motivo, em vez de «enviado». É a disciplina declarada do módulo — um
     * sistema que diz «enviado» sem ter enviado gasta a confiança no dia em que se procura. */
    conferir('sem cadastro no KV, o desfecho do correio é dito e não fingido',
      resultado.correio && resultado.correio.enviado === false
        && /não há e-mail a quem enviar/.test(String(resultado.correio.motivo)), resultado.correio);
  }

  console.log('\nC2. O correio: os destinatários do KV, e o envio de verdade (com a API falsa)');
  {
    /* O QUE O KV GUARDA NÃO TEM OS NOMES QUE A MENSAGEM LÊ — `email` (da escola) no registo e o
     * contato do professor noutra chave. É esta costura que faz o e-mail chegar a alguém. */
    const registo = await senha.registoDeSenha('senha-que-ja-existia');
    const kv = kvCom({
      'bastidores/duo/dono': JSON.stringify({
        nome: 'Fernando Franciose', slug: 'fernando-franciose', escola: 'Duo',
        hash: registo.hash, sal: registo.sal,
      }),
      'bastidores/duo/cadastro': JSON.stringify({
        escolaNome: 'Duo', email: 'escola@exemplo.test', cnpj: null, origem: 'painel',
        criadoEm: '2026-11-16T12:00:00.000Z',
      }),
      'professores/fernando-franciose/contato': JSON.stringify({
        nomeCompleto: 'Fernando Franciose', email: 'professor@exemplo.test',
      }),
      'escolas/por-host': JSON.stringify({}),
    });
    const gh = githubFalso();
    const cf = cloudflareFalso();
    const fetchGithub = gh.fetch;
    const cartas = [];
    globalThis.fetch = async (url, init) => {
      const u = String(url);
      if (u.indexOf('api.resend.com') !== -1) {
        cartas.push(JSON.parse((init && init.body) || '{}'));
        return { ok: true, status: 200, json: async () => ({ id: 'carta-1' }) };
      }
      return u.indexOf('api.github.com') !== -1 ? fetchGithub(url, init) : cf.fetch(url, init);
    };
    let r;
    try {
      r = await raiz.recriarEscola({
        env: envCom(kv, { RESEND_API_KEY: 're-de-mentira' }),
        escola: 'duo', plano: PLANO, senhaAdmin: '', senhaProfessor: '',
      });
    } finally { delete globalThis.fetch; }

    conferir('a recriação manda uma carta, e uma só', cartas.length === 1, cartas.length);
    const carta = cartas[0] || {};
    conferir('…para o e-mail da escola E o do professor, cada um uma vez',
      Array.isArray(carta.to) && carta.to.length === 2
        && carta.to.indexOf('escola@exemplo.test') !== -1
        && carta.to.indexOf('professor@exemplo.test') !== -1, carta.to);
    conferir('…com o assunto a dizer o nome da escola',
      /Duo/.test(String(carta.subject || '')), carta.subject);
    conferir('…e o endereço dela no corpo, que é o que a pessoa vai usar',
      /https:\/\/duo\./.test(String(carta.text || '')), (carta.text || '').slice(0, 120));
    conferir('…sem a senha em claro (a senha não se manda por e-mail)',
      !String(carta.text || '').includes('senha-que-ja-existia')
        && /não a repetimos por e-mail/.test(String(carta.text || '')), null);
    conferir('…e a resposta diz que foi enviado', r.correio && r.correio.enviado === true, r.correio);

    /* SEM CHAVE, NÃO SE DIZ «ENVIADO» — e a frase diz o que fazer (a dica do `wrangler secret
     * put`). É a mesma regra do `SENHA_CRIPTO` em falta: a mensagem é composta, guardada, e o
     * desfecho é dito. */
    const correioMod = require(path.join(RAIZ, 'motor/servidor/correio.js'));
    const semChave = await correioMod.enviar({
      mensagem: { para: ['alguem@exemplo.test'], assunto: 'a', html: '<p>h</p>', texto: 't' }, chave: '',
    });
    conferir('sem RESEND_API_KEY, o envio diz «sem chave» e não finge ter saído',
      semChave.enviado === false && /RESEND_API_KEY/.test(String(semChave.motivo))
        && /wrangler secret put/.test(String(semChave.dica)), semChave);
  }

  console.log('\nD. As duas listas: a que está a ser recriada muda de lado');
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

  console.log('\nE. A derivação: a recriada não pode ficar «expurgada» nem «fechada»');
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

  console.log('\nF. A página: a coluna, o botão e a confirmação');
  {
    const { JSDOM, VirtualConsole } = require('jsdom');
    const catalogo = comercial.catalogoDaPagina();
    const html = painel.paginaDasApagadas({
      escolas: [{
        slug: 'duo', nome: 'Duo', professor: 'fernando-franciose', professores: ['fernando-franciose'],
        criada_em: '2026-11-16T12:25:10.000Z', expurgada_em: '2026-11-16T13:56:53.000Z',
        expurgada: true, expurgos: 1, planoAnterior: { id: PLANO, nome: 'Básico', valor: '69,90' },
      }, {
        slug: 'breu', nome: 'Breu', professores: [], criada_em: '2026-11-01T10:00:00.000Z',
        expurgada_em: '2026-11-15T10:00:00.000Z', expurgada: true, expurgos: 1, planoAnterior: null,
      }],
      professores: [],
      catalogo,
    });
    conferir('a coluna «Recriar» existe, e é a última', /<th>Recriar<\/th><\/tr><\/thead>/.test(html),
      (/<th>[^<]*<\/th>/g.exec(html) || [])[0]);
    conferir('…e há um botão por escola apagada', (html.match(/data-recriar="/g) || []).length === 2,
      (html.match(/data-recriar="/g) || []).length);
    conferir('…com o plano anterior da linha, para a confirmação o pré-seleccionar',
      html.indexOf('data-plano-anterior="' + PLANO + '"') !== -1, null);
    conferir('a confirmação é uma janela (`.modal`) com o plano do CATÁLOGO',
      /id="recriar-modal"/.test(html) && /<select id="recriar-plano">/.test(html)
        && (html.match(/<option value="/g) || []).length === catalogo.assinaturas.length, null);
    conferir('…e com as duas senhas, ditas como opcionais («em branco = manter»)',
      /id="recriar-senha-admin"/.test(html) && /id="recriar-senha-professor"/.test(html)
        && /em branco = manter/.test(html), null);

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
            status: 201, ok: true,
            json: () => Promise.resolve({
              ok: true, escola: 'duo', comercial: { estado: 'aguardando', planoNome: 'Básico' },
              aPagar: { valor: '69,90' }, correio: { enviado: true },
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
    const modal = d.getElementById('recriar-modal');
    conferir('o clique abre a confirmação', Boolean(modal) && modal.hidden === false, null);
    conferir('…com o plano anterior já escolhido', d.getElementById('recriar-plano').value === PLANO,
      d.getElementById('recriar-plano').value);

    d.getElementById('recriar-senha-admin').value = '';
    d.getElementById('recriar-senha-professor').value = 'nova-do-professor';
    d.getElementById('recriar-confirmar').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    conferir('o pedido vai para `/api/recriar-escola`', pedidos.length === 1
      && /api\/recriar-escola/.test(pedidos[0].url), pedidos.map((p) => p.url));
    conferir('…com a escola, o plano e as duas senhas do formulário',
      pedidos[0].corpo.escola === 'duo' && pedidos[0].corpo.plano === PLANO
        && pedidos[0].corpo.senhaAdmin === '' && pedidos[0].corpo.senhaProfessor === 'nova-do-professor',
      pedidos[0].corpo);
    conferir('o recado diz o que aconteceu E o que fazer a seguir (a chave Pix, e habilitar)',
      /recriada/.test(d.getElementById('recriar-recado').textContent)
        && /aguardar conciliação/.test(d.getElementById('recriar-recado').textContent)
        && /Pix/.test(d.getElementById('recriar-recado').textContent),
      d.getElementById('recriar-recado').textContent);
    conferir('…e o recado diz também o que aconteceu ao e-mail',
      /e-mail com o endereço foi enviado/.test(d.getElementById('recriar-recado').textContent),
      d.getElementById('recriar-recado').textContent);
    conferir('…e os scripts da página não lançam', erros.length === 0, erros.slice(0, 1));
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
