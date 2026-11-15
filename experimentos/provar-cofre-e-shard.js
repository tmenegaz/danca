#!/usr/bin/env node
'use strict';

/**
 * provar-cofre-e-shard.js — a chave mestra, o expurgo que a conhece, e o cofre que a mostra
 * (15/11/2026).
 *
 * O QUE ELA RELATOU, e o que cada metade desta prova responde:
 *
 *   1. «Não foi possível gravar: anamnese no repositório: falta a SENHA_CRIPTO» — o shard serve N
 *      escolas com UM `env`, e a chave morava lá com um valor por Worker. A secção A mede que a
 *      chave passa a ser DERIVADA, que é a mesma para a mesma escola, diferente entre escolas, e
 *      que uma escola de antes continua a usar o segredo dela (a reserva que impede a correção de
 *      quebrar o que já existe).
 *
 *   2. «o que eu entendi é que antes de eu expurgar, você precisa fazer com que o expurgo conheça
 *      a chave nova» — num shard a rota de uma escola aponta ao script do SHARD, e a limpeza só
 *      apagava rotas que apontassem ao script do nome dela. A secção B mede as duas metades: a rota
 *      do shard É apagada, e uma rota de OUTRO script NÃO é tocada (a disciplina de sempre).
 *
 *   3. «eu vou digitar essa minha senha e vou poder ver a chave mestra» — a secção C mede o cofre
 *      pelo lado que importa: senha errada não a dá, senha certa dá, e a resposta não é cacheável.
 *
 * O CONTROLE NEGATIVO É O DE SEMPRE: as mesmas asserções contra o código de `HEAD`, onde não há
 * derivação nem cofre. Se passassem lá, a prova estaria a medir-se a si mesma.
 *
 * SEM REDE: um `fetch` falso serve o Cloudflare (DNS, rotas) e conta o que lhe pedem.
 *
 *   node experimentos/provar-cofre-e-shard.js
 *   node experimentos/provar-cofre-e-shard.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.includes('--controle-negativo');

/**
 * CONTRA QUE CÓDIGO SE CORRE O CONTROLE — e a resposta não pode ser `HEAD`.
 *
 * A primeira versão usava `HEAD`, e funcionou exactamente uma vez: no dia em que o trabalho foi
 * cometido, `HEAD` passou a ser o código novo, e o controle passou a comparar a prova com ela
 * mesma — 33 de 35, a aprovar tudo o que devia reprovar. Um controle que envelhece ao ser
 * cometido não é um controle.
 *
 * A âncora passa a ser o commit que ADICIONOU `motor/nucleo/chave-mestra.js`: o pai dele é o
 * código imediatamente antes de a chave derivada existir, e esse ponto não se move nunca. `--contra
 * <ref>` sobrepõe-no, para quando se quiser medir contra outra coisa.
 */
function referenciaDoControle() {
  const i = process.argv.indexOf('--contra');
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  try {
    const adicionou = execSync('git log --diff-filter=A --format=%H -- motor/nucleo/chave-mestra.js',
      { cwd: RAIZ, stdio: 'pipe' }).toString().trim().split('\n').filter(Boolean).pop();
    if (adicionou) return adicionou + '~1';
  } catch (erro) { /* sem git ou sem o ficheiro: cai-se em HEAD */ }
  return 'HEAD';
}

let RAIZ_DO_CODIGO = RAIZ;
if (NEGATIVO) {
  const referencia = referenciaDoControle();
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'cofre-antes-'));
  /* `modelo/` vai junto porque o `raiz.js` lê o esquema do ciclo ao carregar: sem ele, o `require`
   * falhava e a secção C media «não carregou» em vez de «não há cofre». */
  execSync('git archive ' + referencia + ' motor tools modelo | tar -x -C ' + destino, { cwd: RAIZ, stdio: 'pipe' });
  RAIZ_DO_CODIGO = destino;
  console.log('CONTROLE NEGATIVO — o código de ' + referencia + ', antes da chave derivada e do cofre\n');
}

let ok = 0;
let ko = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

/**
 * O `require` que serve às duas corridas. Em HEAD um dos módulos ainda não existe — e o controle
 * negativo tem de mostrar «não existe» como FALHA, não rebentar com um `MODULE_NOT_FOUND`, que não
 * mede nada.
 */
const carregar = (rel) => {
  try {
    return require(path.join(RAIZ_DO_CODIGO, rel));
  } catch (erro) {
    if (NEGATIVO) return null;
    throw erro;
  }
};

/** Uma secção que rebenta conta como uma FALHA da secção — e as asserções anteriores ficam de pé. */
const secao = async (rotulo, fn) => {
  console.log('\n' + rotulo);
  try {
    await fn();
  } catch (erro) {
    provar('a secção correu de ponta a ponta', false, String((erro && erro.message) || erro));
  }
};

/* ---------------------------------------------------------------- o Cloudflare falso */

/**
 * A API do Cloudflare, em memória, com o mínimo que as duas peças usam: a ZONA (para o registo DNS
 * e para as rotas) e as ROTAS em si. `fetchFalso` conta os pedidos e responde o que a Cloudflare
 * responderia — assim a prova mede o EFEITO (que rota sobrou), e não o texto do código.
 */
function cloudflareFalso({ rotas = [] } = {}) {
  const estado = { rotas: rotas.map((r) => Object.assign({}, r)), pedidos: [] };
  const json = (o, status) => ({
    ok: (status || 200) < 300,
    status: status || 200,
    json: async () => o,
    text: async () => JSON.stringify(o),
  });
  const f = async (url, init) => {
    const u = String(url);
    const metodo = (init && init.method) || 'GET';
    estado.pedidos.push({ metodo, url: u });
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
    const mRota = /\/workers\/routes\/([^/?]+)$/.exec(u);
    if (mRota && metodo === 'DELETE') {
      estado.rotas = estado.rotas.filter((r) => r.id !== mRota[1]);
      return json({ success: true, result: { id: mRota[1] } });
    }
    return json({ success: true, result: null });
  };
  return { fetch: f, estado };
}

/* ---------------------------------------------------------------- A. A chave derivada */

(async () => {
  await secao('A. A chave da escola, derivada de uma mestra', async () => {
  const chaveMestra = carregar('motor/nucleo/chave-mestra.js');
  if (!chaveMestra) {
    provar('existe motor/nucleo/chave-mestra.js — a chave derivada de uma mestra', false, 'não existe');
    return;
  }
  {
    const a = await chaveMestra.derivar('mestra-da-casa', 'calango');
    const b = await chaveMestra.derivar('mestra-da-casa', 'calango');
    const c = await chaveMestra.derivar('mestra-da-casa', 'batata');
    const d = await chaveMestra.derivar('outra-mestra', 'calango');
    provar('a mesma mestra e a mesma escola dão SEMPRE a mesma chave', a === b, a);
    provar('…e é uma chave com a forma da antiga (64 hex), para o Cifra não notar', /^[0-9a-f]{64}$/.test(a), a);
    provar('…mas duas escolas NUNCA partilham chave', a !== c, { calango: a.slice(0, 12), batata: c.slice(0, 12) });
    provar('…e trocar a mestra muda a chave (é o que torna uma fuga uma decisão)', a !== d, null);
    provar('sem escola, RECUSA — uma chave de string vazia seria a chave de todas', await (async () => {
      try { await chaveMestra.derivar('mestra', ''); return false; } catch (erro) { return /escola/.test(erro.message); }
    })(), null);
  }

  {
    /* A RESERVA: uma escola de antes não tem mestra e continua a abrir o que cifrou com o segredo
     * dela. Sem esta metade, a correção quebrava todas as escolas existentes no dia do deploy. */
    const semMestra = await chaveMestra.chaveDaEscola({ SENHA_CRIPTO: 'chave-antiga-da-escola' }, 'calango');
    provar('escola SEM mestra continua a usar a SENHA_CRIPTO do Worker', semMestra === 'chave-antiga-da-escola', semMestra);
    const comMestra = await chaveMestra.chaveDaEscola(
      { SENHA_MESTRA: 'mestra', SENHA_CRIPTO: 'chave-antiga-da-escola' }, 'calango');
    provar('…e com mestra, a derivada GANHA — o segredo antigo deixa de ser usado', comMestra !== 'chave-antiga-da-escola',
      comMestra && comMestra.slice(0, 12));
    const nada = await chaveMestra.chaveDaEscola({}, 'calango');
    provar('sem mestra e sem segredo, não há chave (e o acervo diz que falta, em vez de cifrar com nada)', nada === null, nada);
    /* A IMPRESSÃO É O PREFIXO — de propósito: é o que se reconhece ao bater o olho, e é o que
     * deixa de ser segredo. O que importa medir é que ela é CURTA: uma impressão que devolvesse a
     * chave toda não seria uma impressão, seria a chave com outro nome. */
    const marca = chaveMestra.impressao(comMestra);
    provar('a impressão digital tem 8 caracteres — e é o prefixo, não a chave',
      marca.length === 8 && comMestra.startsWith(marca) && comMestra.length > 8,
      { marca, chaveTem: comMestra.length });
  }

  });

  /* ---------------------------------------------------------------- B. O expurgo */

  await secao('B. O expurgo conhece o shard', async () => {
  {
    const dominio = carregar('motor/servidor/dominio-da-escola.js');
    const rotas = [
      { id: 'r1', pattern: 'calango.padd.com.br/*', script: 'lastro-teste' },
      { id: 'r2', pattern: 'batata.padd.com.br/*', script: 'lastro-teste' },
      { id: 'r3', pattern: 'outra.padd.com.br/*', script: 'script-de-outra-pessoa' },
    ];
    const cf = cloudflareFalso({ rotas });
    const r = await dominio.desligarDominio({
      token: 't', escola: 'calango', script: 'calango', scripts: ['lastro-teste'], fetchImpl: cf.fetch,
    });
    const padroes = cf.estado.rotas.map((x) => x.pattern).sort();
    provar('a rota de uma escola servida pelo SHARD é apagada', padroes.indexOf('calango.padd.com.br/*') === -1,
      { padroes, resultado: r.rota });
    provar('…e a rota da OUTRA escola do mesmo shard NÃO é tocada', padroes.indexOf('batata.padd.com.br/*') !== -1, padroes);
    provar('…e uma rota de script alheio também não', padroes.indexOf('outra.padd.com.br/*') !== -1, padroes);
    provar('o resultado diz quantas apagou', r.rota && r.rota.apagadas === 1, r.rota);
  }

  {
    /* O CONTROLE NEGATIVO DESTA SECÇÃO, e é o que dá sentido à anterior: sem a lista de scripts de
     * confiança (a forma antiga), a rota do shard NÃO é apagada — é o defeito. */
    const dominio = carregar('motor/servidor/dominio-da-escola.js');
    const cf = cloudflareFalso({ rotas: [{ id: 'r1', pattern: 'calango.padd.com.br/*', script: 'lastro-teste' }] });
    const r = await dominio.desligarDominio({ token: 't', escola: 'calango', script: 'calango', fetchImpl: cf.fetch });
    provar('CONTROLE NEGATIVO: sem a lista de scripts, a rota do shard sobrevive',
      cf.estado.rotas.length === 1 && r.rota.apagadas === 0, { rotas: cf.estado.rotas, r: r.rota });
  }

  {
    /* O `excluirEscola` — a peça que o expurgo dela usa. Mede-se o que ELE decide: não apagar um
       script que é o shard, e tirar a escola do mapa. */
    const expurgo = carregar('motor/servidor/expurgar-escola.js');
    const kv = {
      dados: new Map([['escolas/por-host', JSON.stringify({
        'calango.padd.com.br': 'calango',
        'calango.tmenegaz77.workers.dev': 'calango',
        'batata.padd.com.br': 'batata',
      })]]),
      async get(k) { return this.dados.has(k) ? this.dados.get(k) : null; },
      async put(k, v) { this.dados.set(k, String(v)); },
      async delete(k) { this.dados.delete(k); },
      async list() { return { keys: [...this.dados.keys()].map((name) => ({ name })), list_complete: true }; },
    };
    const cf = cloudflareFalso({ rotas: [
      { id: 'r1', pattern: 'calango.padd.com.br/*', script: 'lastro-teste' },
      { id: 'r2', pattern: 'batata.padd.com.br/*', script: 'lastro-teste' },
    ] });
    globalThis.fetch = cf.fetch;
    let r;
    try {
      r = await expurgo.excluirEscola({
        token: 't', accountId: 'conta', slug: 'calango', worker: 'lastro-teste',
        scripts: ['lastro-teste'], mapaKv: kv,
      });
    } finally {
      delete globalThis.fetch;
    }
    provar('o expurgo NÃO pede para apagar o script do shard',
      !cf.estado.pedidos.some((p) => p.metodo === 'DELETE' && /\/scripts\/lastro-teste$/.test(p.url)),
      cf.estado.pedidos.filter((p) => p.metodo === 'DELETE').map((p) => p.url));
    provar('…e diz que o pulou, em vez de fingir que apagou', r.script && r.script.pulado, r.script);
    provar('…a rota dele sai (o endereço não fica a responder por uma escola morta)',
      !cf.estado.rotas.some((x) => /^calango\./.test(x.pattern)), cf.estado.rotas);
    provar('…a rota da outra escola do shard fica', cf.estado.rotas.some((x) => /^batata\./.test(x.pattern)), cf.estado.rotas);
    const mapa = JSON.parse(await kv.get('escolas/por-host'));
    provar('…e a escola sai do MAPA, pelas DUAS entradas que ela tinha',
      !Object.values(mapa).includes('calango'), mapa);
    provar('…sem tocar na outra escola do mapa', mapa['batata.padd.com.br'] === 'batata', mapa);
  }

  });

  /* ---------------------------------------------------------------- B2. A sobreposição */

  /* A PEÇA QUE FAZ A ESCOLA SER ELA MESMA DENTRO DO SHARD. Um `env` por Worker era a premissa; o
   * shard serve N escolas com o MESMO `env`, e por isso a chave e o dono passam a ser resolvidos do
   * KV daquela escola, por pedido. É aqui que se mede que a resolução é por escola, e não uma
   * média — com duas escolas no mesmo KV a responder coisas diferentes. */
  await secao('B2. A chave e o dono, resolvidos do KV por escola', async () => {
    const producao = carregar('motor/servidor/producao.js');
    if (!producao || typeof producao.comIdentidadeDaEscola !== 'function') {
      provar('existe `comIdentidadeDaEscola` — a sobreposição por escola', false, 'não existe');
      return;
    }
    const senha = carregar('motor/nucleo/senha.js');
    const registo = await senha.registoDeSenha('senha-da-direcao-da-calango');
    const kv = {
      dados: new Map([
        ['bastidores/calango/dono', JSON.stringify({ nome: 'Pe Torto', slug: 'pe-torto', hash: registo.hash, sal: registo.sal })],
        ['bastidores/batata/dono', JSON.stringify({ nome: 'Redinha Rosa', slug: 'redinha-rosa', hash: 'h2', sal: 's2' })],
      ]),
      async get(k) { return this.dados.has(k) ? this.dados.get(k) : null; },
    };
    const base = { PADD_KV: kv, SENHA_MESTRA: 'a-mestra', PROFESSOR_NOME: 'nome-do-worker' };

    const ca = await producao.comIdentidadeDaEscola(base, 'calango');
    const ba = await producao.comIdentidadeDaEscola(base, 'batata');
    provar('o dono do KV ganha do `env` do Worker', ca.PROFESSOR_NOME === 'Pe Torto', ca.PROFESSOR_NOME);
    provar('…e o SLUG passa a existir — era a metade que faltava e que fazia o dono desaparecer',
      ca.PROFESSOR_SLUG === 'pe-torto', ca.PROFESSOR_SLUG);
    provar('…a senha da direção vem com hash e sal, para o login da escola conferir',
      ca.SENHA_DIRECAO_HASH === registo.hash && ca.SENHA_DIRECAO_SAL === registo.sal, null);
    provar('…e a chave de cifra é a derivada da mestra, não a do Worker',
      ca.SENHA_CRIPTO && ca.SENHA_CRIPTO !== base.SENHA_CRIPTO && /^[0-9a-f]{64}$/.test(ca.SENHA_CRIPTO),
      ca.SENHA_CRIPTO && ca.SENHA_CRIPTO.slice(0, 12));
    provar('a OUTRA escola do mesmo KV recebe outra chave e outro dono',
      ba.SENHA_CRIPTO !== ca.SENHA_CRIPTO && ba.PROFESSOR_NOME === 'Redinha Rosa', ba.PROFESSOR_NOME);

    const semRegisto = await producao.comIdentidadeDaEscola(base, 'breu');
    provar('escola sem registo de dono não ganha nome nem slug inventados',
      !semRegisto.PROFESSOR_SLUG, semRegisto.PROFESSOR_SLUG);

    const semKv = await producao.comIdentidadeDaEscola({ SENHA_CRIPTO: 'antiga' }, 'calango');
    provar('sem KV (o Worker de uma escola só), o `env` fica como está — nada muda para trás',
      semKv.SENHA_CRIPTO === 'antiga' && !semKv.PROFESSOR_SLUG, semKv.SENHA_CRIPTO);

    /* A SENHA DA DIREÇÃO, exercitada pelo caminho real: o hash do KV tem de abrir, e a senha do
     * Worker tem de deixar de abrir — senão a sobreposição não estaria a valer. */
    const bastidores = carregar('motor/servidor/bastidores.js');
    if (bastidores && typeof bastidores.senhaDaDirecaoOk === 'function') {
      const sobreposto = Object.assign({}, ca, { SENHA_ADMIN: 'senha-do-worker', SENHA_PROFESSOR: 'senha-do-worker' });
      provar('a senha da ESCOLA abre a direção', await bastidores.senhaDaDirecaoOk(sobreposto, 'senha-da-direcao-da-calango'), null);
      provar('…e a senha do Worker deixa de abrir (a reserva só vale quando o KV cala)',
        !(await bastidores.senhaDaDirecaoOk(sobreposto, 'senha-do-worker')), null);
    }
  });

  /* ---------------------------------------------------------------- B3. O nascimento */

  /* A ESCOLA QUE NASCE DENTRO DO SHARD. Substitui «criar um Worker, três segredos e um
   * subdomínio» por «escrever um registo e apontar uma rota». Como não há Worker para conferir
   * depois, o que ele ESCREVE é a única coisa que se pode medir — e é o que se mede. */
  await secao('B3. A escola que nasce dentro do shard', async () => {
    const prov = carregar('motor/servidor/provisionar-escola.js');
    if (!prov || typeof prov.provisionarDentroDoShard !== 'function') {
      provar('existe `provisionarDentroDoShard` — a criação sem Worker', false, 'não existe');
      return;
    }
    const kv = {
      dados: new Map(),
      async get(k) { return this.dados.has(k) ? this.dados.get(k) : null; },
      async put(k, v) { this.dados.set(k, String(v)); },
      async delete(k) { this.dados.delete(k); },
      async list() { return { keys: [...this.dados.keys()].map((name) => ({ name })), list_complete: true }; },
    };
    const cf = cloudflareFalso({ rotas: [] });
    globalThis.fetch = cf.fetch;
    let r;
    try {
      r = await prov.provisionarDentroDoShard({
        nome: 'Escola Nova', escola: 'escola-nova', senhaAdmin: 'senha-da-direcao',
        professorNome: 'Pe Torto', professorSlug: '', token: 't', accountId: 'conta',
        shardScript: 'lastro-teste', kv,
      });
    } finally {
      delete globalThis.fetch;
    }

    provar('NÃO cria um script em nome da escola — quem a serve é o shard',
      !cf.estado.pedidos.some((p) => p.metodo === 'PUT' && /\/workers\/scripts\/escola-nova$/.test(p.url)),
      cf.estado.pedidos.filter((p) => p.metodo === 'PUT').map((p) => p.url));

    const dono = JSON.parse(kv.dados.get('bastidores/escola-nova/dono') || '{}');
    provar('escreve o registo do DONO, com nome e slug derivado', dono.nome === 'Pe Torto' && dono.slug === 'pe-torto', dono);
    provar('…com hash e sal da senha, e SEM a senha em claro',
      Boolean(dono.hash) && Boolean(dono.sal) && !JSON.stringify(dono).includes('senha-da-direcao'), Object.keys(dono));
    const senha = carregar('motor/nucleo/senha.js');
    provar('…e o hash confere com a senha dada (é a mesma regra dos professores adicionais)',
      await senha.confere('senha-da-direcao', dono), null);

    const mapa = JSON.parse(kv.dados.get('escolas/por-host') || '{}');
    provar('o MAPA ganha as duas formas do endereço — o domínio e o workers.dev',
      mapa['escola-nova.padd.com.br'] === 'escola-nova' && mapa['escola-nova.tmenegaz77.workers.dev'] === 'escola-nova',
      mapa);
    provar('a ROTA aponta ao script do SHARD, e não a um script com o nome da escola',
      cf.estado.rotas.some((x) => /^escola-nova\./.test(x.pattern) && x.script === 'lastro-teste'),
      cf.estado.rotas);
    provar('a resposta diz em que shard a escola ficou', r.shard === 'lastro-teste', r);
    provar('sem KV, é ERRO declarado — e não uma escola que nasce e ninguém sabe dela',
      await (async () => {
        try { await prov.provisionarDentroDoShard({ nome: 'X', escola: 'x', shardScript: 'lastro-teste' }); return false; }
        catch (erro) { return /KV/.test(String(erro && erro.message)); }
      })(), null);
  });

  /* ---------------------------------------------------------------- C. O cofre */

  await secao('C. O cofre — a chave mestra atrás da senha da raiz', async () => {
  {
    const raiz = carregar('motor/servidor/raiz.js');
    const env = { SENHA_RAIZ: 'senha-da-raiz', SENHA_MESTRA: 'a-chave-mestra-do-sistema' };
    /* O COFRE ESTÁ ATRÁS DO FREIO DA RAIZ, e é assim que se quer: a página já está protegida por
     * Basic, e o cofre exige ainda a senha no corpo. Duas fechaduras para a mesma porta, porque o
     * que está atrás dela abre todas as escolas. O pedido leva o cabeçalho que o navegador põe
     * sozinho. */
    const CABECALHO = { Authorization: 'Basic ' + Buffer.from('tmenegaz:' + env.SENHA_RAIZ).toString('base64') };
    const pedir = async (corpo) => {
      const res = await raiz.fetch(new Request('https://danca.padd.com.br/api/cofre', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, CABECALHO),
        body: JSON.stringify(corpo),
      }), env);
      return { status: res.status, cache: res.headers.get('Cache-Control'), corpo: await res.json().catch(() => null) };
    };

    /* O CONTROLE NEGATIVO DO FREIO: sem o cabeçalho, o cofre nem chega a ser perguntado. */
    const semFreio = await raiz.fetch(new Request('https://danca.padd.com.br/api/cofre', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: 'senha-da-raiz' }),
    }), env);
    provar('CONTROLE NEGATIVO: sem o freio da raiz, nem a senha certa abre o cofre', semFreio.status === 401, semFreio.status);

    const errada = await pedir({ senha: 'nao-e-esta' });
    provar('senha errada responde 401 e NÃO devolve a chave',
      errada.status === 401 && !(errada.corpo && errada.corpo.chave), errada);
    provar('…e a resposta não é cacheável', /no-store/.test(String(errada.cache)), errada.cache);
    const vazia = await pedir({});
    provar('senha vazia dá a MESMA resposta que a errada (não se diz que existe uma quase certa)',
      vazia.status === errada.status && (vazia.corpo || {}).erro === (errada.corpo || {}).erro, vazia.corpo);

    const certa = await pedir({ senha: 'senha-da-raiz' });
    const corpoCerto = certa.corpo || {};
    provar('a senha certa devolve a chave mestra', certa.status === 200 && corpoCerto.chave === env.SENHA_MESTRA, certa.corpo);
    provar('…com a impressão digital, para se conferir sem a mostrar', corpoCerto.impressao === 'a-chave-', corpoCerto.impressao);
    provar('…e diz o que ela abre', /todas as escolas/.test(String(corpoCerto.abre)), corpoCerto.abre);
    provar('…e essa resposta também não é cacheável', /no-store/.test(String(certa.cache)), certa.cache);

    /* SEM MESTRA: diz-se, e não se inventa. */
    const semMestra = await (async () => {
      const res = await raiz.fetch(new Request('https://danca.padd.com.br/api/cofre', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, CABECALHO),
        body: JSON.stringify({ senha: 'senha-da-raiz' }),
      }), { SENHA_RAIZ: 'senha-da-raiz' });
      return { status: res.status, corpo: await res.json().catch(() => null) };
    })();
    provar('sem `SENHA_MESTRA`, o cofre diz que falta — e não devolve chave nenhuma',
      semMestra.status === 503 && !(semMestra.corpo && semMestra.corpo.chave), semMestra);

    /* A PÁGINA: o botão existe nas vivas, e não nas apagadas. */
    const painel = carregar('motor/servidor/painel-html.js');
    const vivas = painel.paginaDasVivas({ escolas: [{ slug: 'calango', nome: 'Calango' }], professores: [] });
    provar('a lista das vivas tem o botão do cofre', /cofre-abrir/.test(vivas), null);
    provar('…e o aviso de que a chave abre todas as escolas', /Isto abre todas as escolas/.test(vivas), null);
    provar('…e a chave NÃO vem escrita no HTML (só depois do pedido)', !/chave mestra<\/label><input id="cofre-chave" type="text" readonly value="/.test(vivas), null);
    provar('a lista das apagadas NÃO tem o cofre', !/cofre-abrir/.test(painel.paginaDasApagadas({ escolas: [], professores: [] })), null);
  }
  });

  /* ---------------------------------------------------------------- D. A publicação */

  /* A ÁRVORE PARTILHADA É O OUTRO LADO DO SHARD, e é o lado que apaga coisas. Num shard o
   * `assets.directory` é `publicacao/`: o `wrangler deploy` substitui a versão INTEIRA, portanto
   * montar uma escola e subir apaga as páginas das outras. Estas asserções medem a guarda. */
  await secao('D. A publicação de um shard monta-o inteiro, ou não monta', async () => {
    const montagem = carregar('tools/montar-publicacao.js');
    if (!montagem || typeof montagem.escolasDoShard !== 'function') {
      provar('existe `escolasDoShard` — a lista que decide o que um shard sobe', false, 'não existe');
      return;
    }
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'shard-escolas-'));
    const escrever = (slug, obj) => {
      fs.mkdirSync(path.join(temp, 'escola', slug), { recursive: true });
      fs.writeFileSync(path.join(temp, 'escola', slug, 'indice.json'), JSON.stringify(obj), 'utf8');
    };
    escrever('uma', { escola: 'Uma', shard: 'shard-a' });
    escrever('outra', { escola: 'Outra', shard: 'shard-a' });
    escrever('sozinha', { escola: 'Sozinha', worker: 'sozinha' });
    escrever('do-b', { escola: 'Do B', shard: 'shard-b' });

    const doA = montagem.escolasDoShard('shard-a', temp);
    provar('as escolas de um shard são as que o DECLARAM no índice', doA.join(',') === 'outra,uma', doA);
    provar('…e uma escola de Worker próprio não entra', doA.indexOf('sozinha') === -1, doA);
    provar('…nem a de outro shard', doA.indexOf('do-b') === -1, doA);
    provar('um shard que ninguém declara dá lista VAZIA (é a condição que a guarda recusa)',
      montagem.escolasDoShard('shard-que-nao-existe', temp).length === 0, null);

    /* A GUARDA, exercitada pela linha de comando — e é ela que impede o pior: montar zero
     * escolas e subir o shard, que é N escolas a responder 404. */
    const r = require('child_process').spawnSync(process.execPath,
      [path.join(RAIZ_DO_CODIGO, 'tools/montar-publicacao.js'), '--shard', 'shard-que-nao-existe',
        '--raiz', temp], { cwd: RAIZ, encoding: 'utf8' });
    provar('`--shard` de um shard sem escolas SAI COM ERRO, e não monta nada',
      r.status === 1 && /apagaria a árvore de todas/.test(String(r.stderr)), { status: r.status, err: String(r.stderr).split('\n')[0] });

    /* O helper que os três workflows usam para a mesma pergunta. */
    const linha = require('child_process').spawnSync('bash',
      ['-c', 'source tools/lib-shard.sh; printf "%s|%s" "$(shard_da_escola calango)" "$(shard_da_escola nao-existe)"'],
      { cwd: RAIZ, encoding: 'utf8' });
    provar('`shard_da_escola` responde o shard de quem o declara, e cala-se para os outros',
      linha.stdout === 'lastro-teste|', JSON.stringify(linha.stdout));

    /* OS TRÊS CAMINHOS DE PUBLICAÇÃO PERGUNTAM A MESMA COISA. Sem isto, a escola de shard gera
     * documentos e o site não os mostra — que é o defeito silencioso desta mudança. */
    const lerFluxo = (rel) => fs.readFileSync(path.join(RAIZ_DO_CODIGO, '.github/workflows', rel), 'utf8');
    /* O `criar-escola.yml` sabe o shard pelo INPUT (é quem cria que o diz), e por isso não
     * consulta o índice; os outros dois descobrem-no pela escola, e perguntam a `lib-shard.sh`.
     * São duas respostas certas para a mesma pergunta, e a asserção é a de cada um. */
    const caminhos = [
      ['criar-escola.yml', /alvo="wrangler\.\$\{\{ inputs\.shard \}\}\.jsonc"/],
      ['deploy-escolas.yml', /lib-shard\.sh/],
      ['gerar-ciclo.yml', /lib-shard\.sh/],
    ];
    for (const [fluxo, alvo] of caminhos) {
      const texto = (() => { try { return lerFluxo(fluxo); } catch (erro) { return ''; } })();
      provar(fluxo + ' monta o shard inteiro (`--shard`) em vez de uma escola', /montar-publicacao\.js --shard/.test(texto), null);
      provar(fluxo + ' …e sobe a config do SHARD, não a de uma escola', alvo.test(texto), null);
    }
  });

  console.log('\n' + (ko === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + ok + '/' + (ok + ko)
    + ' asserção(ões)' + (ko ? ', ' + ko + ' falha(s)' : '') + '.');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('a prova rebentou: ' + (erro && erro.stack || erro));
  process.exit(2);
});
