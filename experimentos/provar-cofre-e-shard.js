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

let RAIZ_DO_CODIGO = RAIZ;
if (NEGATIVO) {
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'cofre-head-'));
  /* `modelo/` vai junto porque o `raiz.js` de HEAD lê o esquema do ciclo ao carregar: sem ele, o
   * `require` falhava e a secção C media «não carregou» em vez de «não há cofre». */
  execSync('git archive HEAD motor tools modelo | tar -x -C ' + destino, { cwd: RAIZ, stdio: 'pipe' });
  RAIZ_DO_CODIGO = destino;
  console.log('CONTROLE NEGATIVO — o código de HEAD, antes da chave derivada e do cofre\n');
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

  console.log('\n' + (ko === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + ok + '/' + (ok + ko)
    + ' asserção(ões)' + (ko ? ', ' + ko + ' falha(s)' : '') + '.');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('a prova rebentou: ' + (erro && erro.stack || erro));
  process.exit(2);
});
