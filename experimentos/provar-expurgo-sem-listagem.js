'use strict';

/*
 * provar-expurgo-sem-listagem.js — o expurgo não fica cego quando a enumeração do KV falha.
 *
 * O que aconteceu (19/10/2026, escola `calango`). O expurgo fez a metade do Cloudflare
 * (subdomínio fora, Worker apagado) e a do repositório (57 arquivos, um commit). A do KV não:
 *
 *     KV: 0 de 0 chave(s) apagada(s), em 2 prefixo(s).
 *     calango/ → NÃO CONSEGUI LISTAR (your account has reached the free usage limit…)
 *     bastidores/calango/ → NÃO CONSEGUI LISTAR (…)
 *
 * A limpeza das chaves começa por ENUMERAR — `kv.list` —, e a enumeração tem cota diária
 * própria no plano gratuito: estourada, ela LANÇA. O relatório foi honesto («NÃO CONSEGUI
 * LISTAR»), mas a escola já não existia em lugar nenhum de onde se pudesse retomar: o
 * `wrangler.<slug>.jsonc`, que dizia o namespace, foi apagado no mesmo commit. O dado ficou
 * no KV sem nome e sem nota.
 *
 * Duas correções, e esta prova fixa as duas:
 *   1. O REGISTRO — o Worker da escola anota as chaves que escreve numa chave só, lida por
 *      `get` (sem cota). O expurgo apaga por NOME a partir dele, e a conferência continua a
 *      ser por LEITURA, que é a autoridade.
 *   2. A PENDÊNCIA — o desfecho do KV vai para o elo do índice da escola, com o namespace e
 *      os prefixos. A retomada lê de lá e não precisa de saber que a escola existiu.
 *
 * Sem rede: o `fetch` é substituído por um Cloudflare falso que RECUSA `/keys` (a cota) e
 * serve `/values/` (a leitura e o DELETE).
 *
 *   node experimentos/provar-expurgo-sem-listagem.js
 */

const fs = require('fs');
const path = require('path');

const {
  apagarChavesDeEscola, lerRegistroDeChaves, prefixosDaEscola, CHAVE_DO_REGISTRO,
} = require('../motor/servidor/expurgar-escola.js');
const {
  comElo, pendenciaDoKv, comResolucaoDoKv,
} = require('../motor/servidor/repo-escola.js');

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

/** A mensagem que a API dá quando a cota diária da enumeração acabou — a real, medida. */
const COTA = 'your account has reached the free usage limit for this operation for today';

/**
 * Um Cloudflare falso, com o KV em memória. `enumeracao` diz se o `/keys` responde ou
 * recusa — é o interruptor da cota.
 */
function nuvemFalsa(chavesIniciais) {
  const kv = new Map(Object.entries(chavesIniciais || {}));
  const estado = { enumeracao: true, pedidos: [], listagens: 0 };
  estado.fetch = async (url, opcoes) => {
    const u = new URL(url);
    const metodo = (opcoes && opcoes.method) || 'GET';
    estado.pedidos.push({ metodo, caminho: u.pathname });
    const json = (corpo, status) => new Response(JSON.stringify(corpo), {
      status: status || 200, headers: { 'content-type': 'application/json' },
    });

    if (u.pathname.endsWith('/keys')) {
      estado.listagens += 1;
      if (!estado.enumeracao) {
        return json({ success: false, errors: [{ message: COTA }] }, 400);
      }
      const prefixo = u.searchParams.get('prefix') || '';
      const nomes = [...kv.keys()].filter((k) => k.startsWith(prefixo)).sort();
      return json({ success: true, result: nomes.map((name) => ({ name })), result_info: { list_complete: true } });
    }
    if (u.pathname.indexOf('/values/') !== -1) {
      const chave = decodeURIComponent(u.pathname.split('/values/')[1]);
      if (metodo === 'DELETE') {
        kv.delete(chave);
        return json({ success: true });
      }
      if (!kv.has(chave)) return new Response('not found', { status: 404 });
      return new Response(kv.get(chave), { status: 200 });
    }
    if (u.pathname.indexOf('/workers/scripts/') !== -1) return json({ success: true });
    return json({ success: true });
  };
  estado.kv = kv;
  return estado;
}

const SEM_DORMIR = async () => {};

const ESCOLA = 'calango';
const NAMESPACE = '2ee331c7a5bc446ca86c8f2cb039ec16';

/** As chaves que a escola tinha, com o formato real: o envelope namespaced e o bastidores. */
function chavesDaEscola() {
  const chaves = {};
  for (const id of ['anamnese-20261019-1842', 'anamnese-20261019-1843', 'plano-20261019-1901',
    'po-20261019-1910', 'anamnese-20261019-1842-dados.cifrado']) {
    chaves[ESCOLA + '/envelope/' + id + '.json'] = '{"id":"' + id + '"}';
  }
  chaves[ESCOLA + '/ia-registro/custo'] = 'linha\n';
  for (const nome of ['turmas', 'rubricas', 'curadorias', 'alunos', 'vocabulario', 'turma-conteudos']) {
    chaves['bastidores/' + ESCOLA + '/' + nome] = '[]';
  }
  chaves['outra-escola/envelope/x.json'] = '{}';
  chaves['bastidores/outra-escola/turmas'] = '[]';
  return chaves;
}

async function comFetch(estado, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = estado.fetch;
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
}

async function main() {
  console.log('\n1. O registro da escola é lido por GET, e não pela enumeração');
  {
    const estado = nuvemFalsa(chavesDaEscola());
    estado.kv.set(CHAVE_DO_REGISTRO(ESCOLA), JSON.stringify({
      escola: ESCOLA,
      chaves: Object.keys(chavesDaEscola()).filter((k) =>
        k.startsWith(ESCOLA + '/') || k.startsWith('bastidores/' + ESCOLA + '/')),
    }));
    estado.enumeracao = false; // a cota já acabou
    const registro = await comFetch(estado, () => lerRegistroDeChaves({
      token: 'x', accountId: 'a', namespaceId: NAMESPACE, slug: ESCOLA,
    }));
    checar('o registro existe', registro.existe === true, registro);
    checar('e traz os nomes das chaves da escola', registro.chaves.length === 12, registro.chaves.length);
    checar('a leitura usou só GET de `/values/`', estado.listagens === 0, estado.listagens);
  }

  console.log('\n2. Com a enumeração estourada, o expurgo apaga por NOME — e confere por LEITURA');
  {
    const estado = nuvemFalsa(chavesDaEscola());
    const todas = Object.keys(chavesDaEscola());
    estado.kv.set(CHAVE_DO_REGISTRO(ESCOLA), JSON.stringify({
      escola: ESCOLA,
      chaves: todas.filter((k) => k.startsWith(ESCOLA + '/') || k.startsWith('bastidores/' + ESCOLA + '/')),
    }));
    estado.enumeracao = false;

    const kv = await comFetch(estado, () => apagarChavesDeEscola({
      token: 'x', accountId: 'a', namespaceId: NAMESPACE, slug: ESCOLA, pausa: SEM_DORMIR,
    }));

    // 12 chaves de dado + o PRÓPRIO registro + as 4 chaves FIXAS que o fixture não tem
    // (`professores`, `alunas`, `dono`, `aparencia`): desde 20/10/2026 o expurgo tenta também os
    // nomes que existem por construção, e não só os que o registro conhece. Apagar um nome que
    // não existe é uma resposta 404 do KV, não um erro — e a alternativa era deixar cadastro
    // para trás quando a enumeração morresse.
    checar('apagou as 12 chaves da escola, o registro e as fixas/ponteiro que faltavam',
      kv.apagadas >= 13 && kv.apagadas === kv.total,
      { apagadas: kv.apagadas, total: kv.total });
    checar('não sobrou nenhuma a responder', kv.restantes === 0, { restantes: kv.restantes, ficaram: kv.ficaram });
    checar('os nomes vieram do REGISTRO (dito no relatório)',
      kv.porPrefixo.every((p) => p.deRegistro === true && p.listou === false), kv.porPrefixo);
    checar('o relatório NÃO finge que enumerou', kv.falhasDeListagem > 0, kv.falhasDeListagem);
    checar('e por isso `ok` é falso — não se pode afirmar que não havia mais nada', kv.ok === false, kv.ok);
    checar('o registro aparece no relatório', kv.registro && kv.registro.existe === true, kv.registro);

    const sobrouDaEscola = [...estado.kv.keys()].filter((k) =>
      k.startsWith(ESCOLA + '/') || k.startsWith('bastidores/' + ESCOLA + '/'));
    checar('no KV falso não restou chave da escola (nem o registro)',
      sobrouDaEscola.length === 0, sobrouDaEscola);
    checar('o dado das OUTRAS escolas não foi tocado',
      estado.kv.has('outra-escola/envelope/x.json') && estado.kv.has('bastidores/outra-escola/turmas'),
      [...estado.kv.keys()]);
  }

  console.log('\n3. Sem registro E sem enumeração, o expurgo não inventa: diz que não conseguiu');
  {
    const estado = nuvemFalsa(chavesDaEscola());
    estado.enumeracao = false; // sem registro nenhum
    const kv = await comFetch(estado, () => apagarChavesDeEscola({
      token: 'x', accountId: 'a', namespaceId: NAMESPACE, slug: ESCOLA, pausa: SEM_DORMIR,
    }));
    // SEM registro, o expurgo passou a conhecer as chaves FIXAS: as 6 que o fixture tem são
    // apagadas por NOME (é esse o ganho), e o resto não existe. O que continua a não acontecer é
    // o expurgo dizer «completo» sem ter certeza — ele relata a pendência da enumeração.
    // 6 do fixture + as 3 fixas que ele não tem (professores, donas, aparencia…): o expurgo
    // tenta os nomes declarados, e apagar um que não existe é um 404 do KV — não um erro.
    // 9 fixas + o ponteiro da geração (que é tentado mesmo sem existir).
    checar('o expurgo apaga as chaves FIXAS que conhece, mesmo sem registro',
      kv.apagadas === 10, kv.apagadas);
    // O LIMITE, DITO: as chaves FIXAS saem por nome; as que têm nome DINÂMICO (um envelope por
    // registo, o registo de custo) não há como saber sem enumerar. Ficam — e é por isso que a
    // resposta é `ok: false`, com o caminho de volta (`POST /api/expurgar-kv`).
    const sobrou = [...estado.kv.keys()].filter((k) =>
      k.startsWith(ESCOLA + '/') || k.startsWith('bastidores/' + ESCOLA + '/'));
    // `bastidores/calango/alunos` sobrevive porque o fixture usa um nome que a escola NÃO
    // escreve (o real é `alunas`) — e é a demonstração exacta da regra: a lista de chaves fixas
    // cobre o que a escola grava, não o que alguém inventar.
    checar('as chaves FIXAS saem; ficam as de nome DINÂMICO e as que a lista não declara',
      sobrou.every((k) => /envelope\/|ia-registro\/|\/alunos$/.test(k)), sobrou);
    checar('mas continua a dizer que não conseguiu ENUMERAR (não finge limpeza completa)',
      kv.ok === false, { ok: kv.ok, restantes: kv.restantes });
    checar('`ok` é falso', kv.ok === false, kv.ok);
    checar('a falha de listagem está no relatório', kv.falhasDeListagem > 0, kv.falhasDeListagem);
    checar('o registro é declarado ausente', kv.registro && kv.registro.existe === false, kv.registro);
    checar('a escola continua no KV (nada se apagou às cegas)',
      [...estado.kv.keys()].some((k) => k.startsWith(ESCOLA + '/')), [...estado.kv.keys()].length);
  }

  console.log('\n4. A pendência vai para o elo do expurgo — com namespace e prefixos');
  const indiceComPendencia = (() => {
    const base = { escola: ESCOLA, worker: ESCOLA, arquivos: [] };
    return comElo(JSON.stringify(base), {
      slug: ESCOLA,
      professor: 'sapo-bailarino',
      ciclo: '01',
      arquivos: ['wrangler.calango.jsonc'],
      motivo: 'teste',
      quando: '2026-10-19T19:13:00.000Z',
      kv: {
        ok: false, apagadas: 0, restantes: null,
        namespaceId: NAMESPACE, prefixos: prefixosDaEscola(ESCOLA),
      },
    });
  })();
  {
    const indice = JSON.parse(indiceComPendencia);
    const elo = indice.expurgo[indice.expurgo.length - 1];
    checar('o elo guarda o namespace', elo.kv && elo.kv.namespaceId === NAMESPACE, elo.kv);
    checar('o elo guarda os prefixos da escola', JSON.stringify(elo.kv.prefixos) === JSON.stringify(prefixosDaEscola(ESCOLA)), elo.kv.prefixos);
    checar('o elo marca a pendência', elo.kv.pendente === true, elo.kv);
    checar('o elo continua a registar o que foi apagado', elo.apagado.length === 1, elo.apagado);
  }

  console.log('\n5. A retomada lê a pendência do índice — a escola já não precisa de existir');
  {
    const original = globalThis.fetch;
    globalThis.fetch = async (url) => {
      const u = new URL(url);
      if (u.pathname.indexOf('/contents/escola/' + ESCOLA + '/indice.json') !== -1) {
        return new Response(JSON.stringify({
          sha: 'abc',
          content: Buffer.from(indiceComPendencia, 'utf8').toString('base64'),
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('{}', { status: 404 });
    };
    let pendencia = null;
    try {
      pendencia = await pendenciaDoKv({ token: 'x', dono: 'd', repo: 'r', ref: 'main', slug: ESCOLA });
    } finally {
      globalThis.fetch = original;
    }
    checar('a pendência é encontrada no elo', Boolean(pendencia), pendencia);
    checar('com o namespace de que a limpeza precisa', pendencia && pendencia.namespaceId === NAMESPACE, pendencia);
    checar('e os prefixos', pendencia && JSON.stringify(pendencia.prefixos) === JSON.stringify(prefixosDaEscola(ESCOLA)), pendencia && pendencia.prefixos);
  }

  console.log('\n6. Resolvida a pendência, o elo ganha a linha da retomada — e deixa de estar pendente');
  {
    const depois = JSON.parse(comResolucaoDoKv(indiceComPendencia, {
      quando: '2026-10-20T00:05:00.000Z',
      resultado: { ok: true, apagadas: 12, restantes: 0 },
    }));
    const elo = depois.expurgo[depois.expurgo.length - 1];
    checar('a retomada ficou registada', elo.kv.retomada && elo.kv.retomada.ok === true, elo.kv.retomada);
    checar('com o que ela apagou', elo.kv.retomada.apagadas === 12, elo.kv.retomada);
    checar('a marca de pendente saiu', elo.kv.pendente === undefined, elo.kv);
    checar('o elo do expurgo NÃO foi reescrito (o apagado continua lá)', elo.apagado.length === 1, elo.apagado);

    // E uma retomada que também falha mantém a pendência: «não sei» não vira «acabou».
    const ainda = JSON.parse(comResolucaoDoKv(indiceComPendencia, {
      quando: '2026-10-20T00:05:00.000Z',
      resultado: { ok: false, apagadas: 0, restantes: 12 },
    }));
    const elo2 = ainda.expurgo[ainda.expurgo.length - 1];
    checar('uma retomada que falha mantém a pendência', elo2.kv.pendente === true, elo2.kv);
  }

  console.log('\n7. A página sabe dizer de onde vieram os nomes, e oferece a retomada');
  {
    const html = fs.readFileSync(path.join(__dirname, '..', 'raiz', 'index.html'), 'utf8');
    checar('a página conhece o caso `deRegistro`', /p\.deRegistro/.test(html));
    checar('a página tem o botão da retomada', /api\/expurgar-kv/.test(html));
    checar('e diz quando a cota renova', /00:00 UTC/.test(html));
    // A ESCOLA NÃO NASCE SOBRE RESÍDUO. A trava mora na rota; a página tem de a saber mostrar.
    const raiz = fs.readFileSync(path.join(__dirname, '..', 'motor', 'servidor', 'raiz.js'), 'utf8');
    checar('a criação de escola recusa um slug com pendência de KV',
      /pendenciaDoKv\(\{[\s\S]{0,200}slug: slugPedido/.test(raiz) && /status: 409/.test(raiz));
    checar('a página mostra o botão da retomada quando a criação é recusada',
      /pendenciaKv/.test(html));
  }

  console.log('\n8. O adaptador do Cloudflare escreve o registro e cai nele quando a cota acaba');
  {
    const { criarCloudflare } = require('../motor/adaptadores/cloudflare.js');
    const mapa = new Map();
    const kvFalso = {
      async get(k) { return mapa.has(k) ? mapa.get(k) : null; },
      async put(k, v) { mapa.set(k, v); },
      async delete(k) { return mapa.delete(k); },
      async list() { throw new Error(COTA); }, // a cota, desde o início
    };
    const armazem = criarCloudflare({ PADD_KV: kvFalso, ESCOLA_SLUG: ESCOLA });

    await armazem.guardar('envelope/po-20261019-1910.json', '{"id":"po"}');
    await armazem.guardar('bastidores/calango/turmas', '[]');
    checar('o registro foi escrito', mapa.has(CHAVE_DO_REGISTRO(ESCOLA)), [...mapa.keys()]);
    const registo = JSON.parse(mapa.get(CHAVE_DO_REGISTRO(ESCOLA)));
    checar('com a chave do envelope namespaced', registo.chaves.indexOf(ESCOLA + '/envelope/po-20261019-1910.json') !== -1, registo.chaves);
    checar('e a do bastidores', registo.chaves.indexOf('bastidores/calango/turmas') !== -1, registo.chaves);

    // A cota acabou: a listagem passa a vir do registro, em vez de derrubar a tela.
    const envelopes = await armazem.listar('envelope/');
    checar('`listar` devolve o envelope pelo registro', envelopes.length === 1 && envelopes[0] === 'envelope/po-20261019-1910.json', envelopes);
    const bastidores = await armazem.listar('bastidores/calango/');
    checar('e as chaves de bastidores também', bastidores.indexOf('bastidores/calango/turmas') !== -1, bastidores);

    // Sem registro e sem enumeração, a falha SOBE — lista vazia seria mentira.
    const outro = criarCloudflare({
      PADD_KV: { async get() { return null; }, async put() {}, async delete() { return false; }, async list() { throw new Error(COTA); } },
      ESCOLA_SLUG: 'breu',
    });
    let subiu = false;
    try { await outro.listar('envelope/'); } catch (erro) { subiu = true; }
    checar('sem registro, `listar` lança em vez de devolver vazio', subiu);

    // Apagar tira a chave do registro: o expurgo não é atrapalhado por um índice mentiroso.
    await armazem.apagar('envelope/po-20261019-1910.json');
    const depois = JSON.parse(mapa.get(CHAVE_DO_REGISTRO(ESCOLA)));
    checar('a chave apagada sai do registro',
      depois.chaves.indexOf(ESCOLA + '/envelope/po-20261019-1910.json') === -1, depois.chaves);
  }

  console.log('\n5. As chaves FIXAS da escola: o cadastro não fica para trás sem enumeração');
  {
    // Medido no código em 20/10/2026: os cadastros dos Bastidores gravam DIRECTAMENTE no KV
    // (`kv.put`), fora do adaptador — e portanto fora do registro de chaves. Com a enumeração
    // viva não se notava; com ela morta, o expurgo apagava o cofre, deixava os cadastros e
    // relatava pendência. A lista declarada fecha isso.
    const { chavesFixasDaEscola, CHAVES_FIXAS_DA_ESCOLA } = require('../motor/servidor/expurgar-escola.js');
    checar('a lista declara as nove chaves que a escola grava por construção',
      CHAVES_FIXAS_DA_ESCOLA.length === 9, CHAVES_FIXAS_DA_ESCOLA);
    checar('e compõe os nomes com o prefixo dos Bastidores',
      chavesFixasDaEscola('calango').every((k) => k.indexOf('bastidores/calango/') === 0)
        && chavesFixasDaEscola('calango').indexOf('bastidores/calango/turmas') !== -1);
    checar('sem slug não há chaves (não se apaga o namespace inteiro por omissão)',
      chavesFixasDaEscola('').length === 0);

    // A FAMÍLIA DA GERAÇÃO: o ponteiro (nome fixo) e a variante que ele aponta.
    const ghost = nuvemFalsa({
      'bastidores/calango/geracao/.ultimo': 'bastidores/calango/geracao/calango-bale-1',
      'bastidores/calango/geracao/calango-bale-1': '{"em":"2026-10-19T10:00:00Z"}',
    });
    ghost.enumeracao = false;
    const kvG = await comFetch(ghost, () => apagarChavesDeEscola({
      token: 'x', accountId: 'a', namespaceId: NAMESPACE, slug: 'calango', pausa: SEM_DORMIR,
    }));
    checar('o ponteiro da geração é apagado, e a variante que ele aponta também',
      !ghost.kv.has('bastidores/calango/geracao/.ultimo')
        && !ghost.kv.has('bastidores/calango/geracao/calango-bale-1'), [...ghost.kv.keys()]);
    checar('e as duas entram na conta do relatório', kvG.apagadas >= 2, kvG.apagadas);

    // E o efeito: sem registro, o cadastro AINDA sai.
    const estado = nuvemFalsa({
      'bastidores/calango/turmas': '[]',
      'bastidores/calango/professores': '[]',
      'bastidores/calango/aparencia': '{}',
    });
    estado.enumeracao = false;
    const kv = await comFetch(estado, () => apagarChavesDeEscola({
      token: 'x', accountId: 'a', namespaceId: NAMESPACE, slug: 'calango', pausa: SEM_DORMIR,
    }));
    checar('o cadastro é apagado por NOME, com a enumeração recusada e sem registro',
      !estado.kv.has('bastidores/calango/turmas')
        && !estado.kv.has('bastidores/calango/professores')
        && !estado.kv.has('bastidores/calango/aparencia'), [...estado.kv.keys()]);
    // 9 = as nove fixas declaradas (as 3 que existem + as 6 que não existem, das quais o KV
    // devolve 404 — não é erro). O que importa é não dizer «0 de 0», que se lê como «nada havia».
    checar('e o relatório diz o que apagou (não «0 de 0»)',
      kv.apagadas === CHAVES_FIXAS_DA_ESCOLA.length + 1, kv.apagadas);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
