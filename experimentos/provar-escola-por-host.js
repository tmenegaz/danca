#!/usr/bin/env node
'use strict';

/*
 * provar-escola-por-host.js — a escola resolve-se pelo DADO, e a trava não se perdeu.
 *
 * O QUE MUDOU (13/11/2026). A escola de um pedido vinha da `vars` `ESCOLA_SLUG` do
 * `wrangler.<escola>.jsonc`. Passou a vir de um mapa em KV (`escolas/por-host`), lido com cache
 * de isolate — ver `motor/servidor/mapa-de-escolas.js` e `motor/servidor/producao.js`.
 *
 * É a mudança que solta a identidade do deploy, e é a primeira metade do shard. Ela tem de fazer
 * quatro coisas ao mesmo tempo, e é isso que esta prova mede:
 *
 *   1. RESOLVER pelo host — exacto (`calango.tmenegaz77.workers.dev`) e por etiqueta
 *      (`calango.padd.com.br`), esta última só quando a etiqueta é uma escola REGISTADA;
 *   2. NÃO CUSTAR uma leitura por pedido — o mapa fica na isolate. E não mentir sobre isso: o
 *      contador de leituras ao KV tem de mostrar 1 na primeira e 0 na segunda;
 *   3. NÃO DEIXAR UMA ESCOLA NOVA INVISÍVEL — se o host não está no mapa em cache, ele RELÊ antes
 *      de dizer «não sei quem és». Sem isso, uma escola acabada de criar apareceria com a página
 *      de configuração incorrecta durante até um TTL;
 *   4. NÃO PERDER A TRAVA. O mapa e a `vars` a dizerem escolas diferentes é um deploy trocado, e
 *      o resultado tem de ser um erro VISÍVEL — a mesma razão pela qual a trava antiga existia.
 *
 * E, porque a `vars` sai, o que ela provava tem de ser provado por outra coisa: o `escola.json` do
 * pacote. A secção 5 mede esse caso — `name` certo com `assets.directory` de outra escola —, que é
 * o deploy trocado que a comparação de subdomínio apanhava e que agora só o CONTEÚDO sabe dizer.
 *
 *   node experimentos/provar-escola-por-host.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const mapaDeEscolas = require(path.join(RAIZ, 'motor/servidor/mapa-de-escolas.js'));
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));

let ok = 0;
let ko = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
  else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
};

/** O KV de mentira, com as leituras CONTADAS — o cache só se prova contando. */
function criarKv(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  const lidos = [];
  return {
    dados,
    lidos,
    async get(chave) { lidos.push(chave); return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); },
    async delete(chave) { dados.delete(chave); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })),
        list_complete: true };
    },
    /** As leituras do MAPA — o resto do KV (os cadastros) não interessa a esta secção. */
    leiturasDoMapa() { return lidos.filter((c) => c === mapaDeEscolas.CHAVE).length; },
  };
}

/** Um ASSETS de mentira: só o `/escola.json` e o `/nav.json` interessam. */
function criarAssets(escolaDoPacote) {
  return {
    async fetch(req) {
      const u = new URL(String(req && req.url ? req.url : req), 'https://assets.local');
      if (u.pathname === '/escola.json') {
        if (!escolaDoPacote) return new Response('nao', { status: 404 });
        return new Response(JSON.stringify({ escola: escolaDoPacote }), { status: 200,
          headers: { 'content-type': 'application/json' } });
      }
      if (u.pathname === '/' || u.pathname === '/index.html') {
        return new Response('<!doctype html><html><head><title>escola</title></head><body>ok</body></html>',
          { status: 200, headers: { 'content-type': 'text/html;charset=utf-8' } });
      }
      if (u.pathname === '/nav.json') {
        return new Response(JSON.stringify({ versao: 2, coluna: [] }), { status: 200,
          headers: { 'content-type': 'application/json' } });
      }
      return new Response('nao', { status: 404 });
    },
  };
}

function ambiente(kv, { varEscola, pacote } = {}) {
  const env = {
    PADD_KV: kv,
    ESCOLA_HABILITADA: 'sim',
    PROFESSOR_NOME: 'Tiago',
    GITHUB_TOKEN: null,
    ASSETS: criarAssets(pacote),
  };
  if (varEscola !== undefined) env.ESCOLA_SLUG = varEscola;
  return env;
}

const comMapa = (entradas) => ({ [mapaDeEscolas.CHAVE]: JSON.stringify(entradas) });

async function saude(env, host) {
  const r = await producao.fetch(new Request('https://' + host + '/api/saude'), env);
  return { status: r.status, corpo: await r.json() };
}

(async () => {
  /* ── 1. RESOLVER PELO HOST ─────────────────────────────────────────────────────────────── */
  console.log('\n1 · a escola sai do host, e o mapa é a autoridade');
  {
    const kv = criarKv(comMapa({ 'calango.tmenegaz77.workers.dev': 'calango' }));
    mapaDeEscolas.esquecer(kv);
    const env = ambiente(kv, { pacote: 'calango' });

    /* ESTE É O PRIMEIRO PEDIDO DO PROCESSO, e é ele que mede o estado de ARRANQUE — o único em
     * que o cache do pacote ainda não tem resposta nenhuma. Foi aqui que a primeira redação
     * falhou: o cache começava em `null`, que é «não há ficheiro», e a conferência do pacote
     * ficava desligada em silêncio sem nunca ler. As secções seguintes não apanhavam, porque
     * chamavam `esquecerPacote()` e punham o cache num estado que já não é o de arranque. */
    const exato = await saude(env, 'calango.tmenegaz77.workers.dev');
    provar('host exacto → calango, e a origem é o mapa',
      exato.status === 200 && exato.corpo.slug === 'calango' && exato.corpo.origem === 'mapa',
      exato.corpo);
    provar('e no primeiro pedido do processo o pacote JÁ é lido (o cache não nasce a dizer «não há»)',
      exato.corpo.escola_do_pacote === 'calango', exato.corpo.escola_do_pacote);

    /* O DOMÍNIO PRÓPRIO. A etiqueta vale porque `calango` é uma escola REGISTADA — e é isso que
     * faz `padd.com.br` funcionar sem uma entrada por domínio. */
    const porRotulo = await saude(env, 'calango.padd.com.br');
    provar('etiqueta registada e domínio novo → calango, por rótulo',
      porRotulo.status === 200 && porRotulo.corpo.slug === 'calango' && porRotulo.corpo.por === 'rotulo',
      porRotulo.corpo);

    /* E o que NÃO pode acontecer: um host qualquer ser adoptado por uma escola. */
    const estranho = await saude(env, 'www.padd.com.br');
    provar('host que não é de nenhuma escola → recusa (não se inventa a escola)',
      estranho.status === 500 && estranho.corpo.slug === null && estranho.corpo.origem === 'nada',
      estranho.corpo);
  }

  /* ── 2. O CACHE ────────────────────────────────────────────────────────────────────────── */
  console.log('\n2 · o mapa fica na isolate: uma leitura, não uma por pedido');
  {
    const kv = criarKv(comMapa({ 'calango.tmenegaz77.workers.dev': 'calango' }));
    mapaDeEscolas.esquecer(kv);
    const env = ambiente(kv, { pacote: 'calango' });
    producao.esquecerPacote();

    await saude(env, 'calango.tmenegaz77.workers.dev');
    const depoisDaPrimeira = kv.leiturasDoMapa();
    provar('a primeira resolveu lendo o mapa UMA vez', depoisDaPrimeira === 1, depoisDaPrimeira);

    for (let i = 0; i < 5; i += 1) await saude(env, 'calango.tmenegaz77.workers.dev');
    provar('mais cinco pedidos não leram o mapa nenhuma vez (' + kv.leiturasDoMapa() + ' no total)',
      kv.leiturasDoMapa() === depoisDaPrimeira, kv.leiturasDoMapa());

    /* UM ISOLATE NOVO (outro binding de KV) paga outra leitura — e é isso que se quer: o cache é
     * por isolate, não um valor global que ficaria velho sem ninguém saber. */
    const outro = criarKv(comMapa({ 'calango.tmenegaz77.workers.dev': 'calango' }));
    await saude(ambiente(outro, { pacote: 'calango' }), 'calango.tmenegaz77.workers.dev');
    provar('outra isolate paga a sua própria leitura', outro.leiturasDoMapa() === 1, outro.leiturasDoMapa());
  }

  /* ── 3. A ESCOLA NOVA APARECE SEM ESPERAR O TTL ────────────────────────────────────────── */
  console.log('\n3 · uma escola acabada de criar resolve no primeiro pedido');
  {
    /* O mapa em cache tem a `batata` e NÃO tem a `calango`. Depois a `calango` é criada. */
    const kv = criarKv(comMapa({ 'batata.tmenegaz77.workers.dev': 'batata' }));
    mapaDeEscolas.esquecer(kv);
    const env = ambiente(kv, { pacote: 'calango' });

    await saude(env, 'batata.tmenegaz77.workers.dev'); // aquece o mapa sem a calango
    const antes = await saude(env, 'calango.tmenegaz77.workers.dev');
    provar('antes de existir, o host da calango é recusado (e não servido por engano)',
      antes.status === 500, antes.corpo);

    /* A ESCOLA É CRIADA POR OUTRO PROCESSO — e escreve-se no KV SEM tocar no cache deste, que é
     * o que acontece de verdade: `registar` invalida o cache da SUA isolate, e a isolate que está
     * a servir o pedido é outra. É por isso que a falta tem de reler, e é isso que se mede aqui:
     * com um `registar` local o cache seria limpo e a releitura nunca seria exercida. */
    await kv.put(mapaDeEscolas.CHAVE,
      JSON.stringify({ 'batata.tmenegaz77.workers.dev': 'batata',
        'calango.tmenegaz77.workers.dev': 'calango' }));
    const depois = await saude(env, 'calango.tmenegaz77.workers.dev');
    provar('criada a escola noutra isolate, o pedido seguinte já a resolve (a falta RELÊ)',
      depois.status === 200 && depois.corpo.slug === 'calango', depois.corpo);
  }

  /* ── 4. A TRAVA NÃO SE PERDEU ──────────────────────────────────────────────────────────── */
  console.log('\n4 · mapa e `vars` em desacordo é erro visível — a trava mudou de lugar');
  {
    const kv = criarKv(comMapa({ 'calango.tmenegaz77.workers.dev': 'calango' }));
    mapaDeEscolas.esquecer(kv);
    /* O deploy trocado de antes: o Worker é o da calango, e a var ficou a dizer `batata`. */
    const env = ambiente(kv, { varEscola: 'batata', pacote: null });
    const r = await saude(env, 'calango.tmenegaz77.workers.dev');
    provar('a saúde responde 500', r.status === 500, r.status);
    provar('e o erro NOMEIA as duas escolas',
      /calango/.test(String(r.corpo.erro)) && /batata/.test(String(r.corpo.erro)), r.corpo.erro);

    const pagina = await producao.fetch(new Request('https://calango.tmenegaz77.workers.dev/'), env);
    const html = await pagina.text();
    provar('e a página diz o mesmo, em vez de servir a escola errada',
      pagina.status === 500 && /escolas diferentes/.test(html), pagina.status);

    /* O caminho de ANTES continua a valer quando o mapa não tem o host: é ele que permite
     * migrar escola a escola sem um momento em que ninguém saiba de quem é o Worker. */
    const kvSemMapa = criarKv({});
    mapaDeEscolas.esquecer(kvSemMapa);
    const daVar = await saude(ambiente(kvSemMapa, { varEscola: 'calango', pacote: 'calango' }),
      'calango.tmenegaz77.workers.dev');
    provar('sem entrada no mapa, a `vars` ainda serve (origem "vars")',
      daVar.status === 200 && daVar.corpo.origem === 'vars' && daVar.corpo.slug === 'calango',
      daVar.corpo);

    /* E a comparação de subdomínio, que era a trava antiga, continua viva NESTE caminho. */
    const trocada = await saude(ambiente(kvSemMapa, { varEscola: 'batata', pacote: null }),
      'calango.tmenegaz77.workers.dev');
    provar('e no caminho da `vars` o subdomínio continua a ser conferido',
      trocada.status === 500, trocada.corpo);
  }

  /* ── 5. O CONTEÚDO É A ÚLTIMA TESTEMUNHA ───────────────────────────────────────────────── */
  console.log('\n5 · o pacote publicado tem de ser o da escola que o host reivindica');
  {
    const kv = criarKv(comMapa({ 'calango.tmenegaz77.workers.dev': 'calango' }));
    mapaDeEscolas.esquecer(kv);
    producao.esquecerPacote();

    /* `name` certo, `assets.directory` de outra escola: o host resolve calango, o conteúdo é
     * batata. Sem a `vars`, nada mais apanha isto. */
    const env = ambiente(kv, { pacote: 'batata' });
    const saudeErrada = await saude(env, 'calango.tmenegaz77.workers.dev');
    provar('o `/api/saude` mostra a divergência',
      saudeErrada.corpo.escola_do_pacote === 'batata' && saudeErrada.corpo.slug === 'calango',
      saudeErrada.corpo);

    const pagina = await producao.fetch(new Request('https://calango.tmenegaz77.workers.dev/'), env);
    const html = await pagina.text();
    provar('e a página RECUSA servir, dizendo as duas escolas',
      pagina.status === 500 && /mapa de escolas diz/.test(html) && /pacote publicado aqui/.test(html),
      pagina.status);

    /* O caminho honesto: o pacote é o da escola. */
    producao.esquecerPacote();
    const certo = await producao.fetch(new Request('https://calango.tmenegaz77.workers.dev/'),
      ambiente(kv, { pacote: 'calango' }));
    provar('com o pacote certo, a página é servida', certo.status === 200, certo.status);

    /* E um pacote SEM `escola.json` (montado antes desta versão) não derruba nada: a conferência
     * é uma testemunha, e a ausência dela não é prova de erro. */
    producao.esquecerPacote();
    const semFicheiro = await producao.fetch(new Request('https://calango.tmenegaz77.workers.dev/'),
      ambiente(kv, { pacote: null }));
    provar('sem `escola.json`, serve na mesma (a ausência não é culpa)', semFicheiro.status === 200,
      semFicheiro.status);
  }

  /* ── 6. CONTROLO NEGATIVO ──────────────────────────────────────────────────────────────── */
  console.log('\n6 · controlo negativo: sem o mapa, nada disto estaria a ser medido');
  {
    const kv = criarKv({});
    mapaDeEscolas.esquecer(kv);
    const env = ambiente(kv, { pacote: 'calango' });
    const r = await saude(env, 'calango.tmenegaz77.workers.dev');
    provar('sem mapa e sem `vars`, a escola não é inventada', r.status === 500 && r.corpo.slug === null,
      r.corpo);
    /* Se a resolução por rótulo aceitasse QUALQUER etiqueta, este host viraria escola. */
    const qualquer = await saude(ambiente(kv, { pacote: null }), 'qualquer-um.padd.com.br');
    provar('e um host arbitrário não vira escola', qualquer.status === 500, qualquer.corpo);
  }

  console.log('\n' + (ko ? 'FALHOU' : 'TUDO CERTO') + ' — ' + ok + ' asserção(ões)' +
    (ko ? ', ' + ko + ' falha(s)' : '') + '.');
  process.exit(ko ? 1 : 0);
})().catch((erro) => { console.error(erro); process.exit(1); });
