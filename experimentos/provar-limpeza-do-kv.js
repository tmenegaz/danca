#!/usr/bin/env node
'use strict';

/**
 * provar-limpeza-do-kv.js — «Terminar a limpeza do KV» responde «nada pendente» só quando não há nada.
 *
 * O QUE ACONTECEU (22/11/2026). A `calango` foi expurgada pela página e o elo do expurgo dizia
 * `{ok: true, apagadas: 0, restantes: 0, namespaceId: null}`. Seis chaves continuavam no KV — o
 * cadastro das alunas, as curadorias, as turmas, as rubricas, a linha de base e o dono. O botão
 * «Terminar a limpeza do KV» respondia **«nada pendente»**: não havia `kv.pendente`, e a retomada
 * só procurava esse sinal.
 *
 * A CAUSA ERAM DUAS CAMADAS. (1) `apagarChavesDeEscola` devolve `ok: true` quando
 * `namespaceId === null` — «a escola não declara namespace, não há o que limpar» —, e nas escolas de
 * SHARD esse `null` era FALSO: elas escrevem, no namespace do shard, com prefixo próprio. O elo
 * dizia «limpo» sem ter olhado. (2) `pendenciaDoKv` só reconhecia `kv.pendente === true`, portanto
 * esse elo — o único que importava — era invisível.
 *
 * O que se mede, e cada asserção corresponde a um elo REAL:
 *
 *   A. o elo da `calango` (namespace nulo, `ok: true`) é PENDENTE — e diz porque;
 *   B. o elo que falhou a apagar (`pendente: true, erro`) continua pendente, e o `porque` é o erro;
 *   C. o elo já retomado (`kv.retomada`) não é pendente — o passado não se acusa duas vezes;
 *   D. a `breu`, cujo último expurgo também tem namespace nulo mas que foi RECRIADA depois, não é
 *      pendente — as 23 chaves dela são as dela;
 *   E. fechar a pendência grava `retomada`, o `namespaceId` com que se limpou e `ok`, e a leitura
 *      seguinte devolve `null`;
 *   F. a pergunta é UMA: `eloPedeLimpezaDoKv` é o predicado que anuncia e o que fecha. Um segundo
 *      predicado seria a forma de os dois divergirem outra vez.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` extrai `motor/` desse commit. Lá o elo da `calango` é dado
 * como «nada pendente» — é o defeito, medido.
 *
 *   node experimentos/provar-limpeza-do-kv.js
 *   node experimentos/provar-limpeza-do-kv.js --contra=de95569a
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const raiz = path.resolve(__dirname, '..');

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 240)));
}

/** O `indice.json` de uma escola, como o GitHub o devolve: base64 dentro de um JSON. */
function indiceServido(indice) {
  const texto = JSON.stringify(indice, null, 2);
  return async (url) => {
    if (String(url).indexOf('/contents/escola/') === -1) return { ok: false, status: 404, json: async () => null };
    return {
      ok: true, status: 200,
      json: async () => ({ content: Buffer.from(texto, 'utf8').toString('base64'), encoding: 'base64' }),
    };
  };
}

/* OS ELOS SÃO OS DO REPOSITÓRIO, copiados na forma (e não os ficheiros: a `calango` e a `batata`
 * já não existem como escola viva, e o elo é o que ficou). A forma de cada um está no
 * `escola/<slug>/indice.json` do dia do expurgo, e é ela que a regra tem de ler. */
const ELO_CALANGO = {
  em: '2026-11-16T12:44:00.000Z', motivo: 'fim do ciclo de testes',
  kv: { ok: true, apagadas: 0, restantes: 0, namespaceId: null },
};
const ELO_FALHOU = {
  em: '2026-11-16T12:44:00.000Z', motivo: 'teste',
  kv: { ok: false, pendente: true, erro: 'HTTP 429 — cota diária', namespaceId: 'abc123' },
};
const ELO_RETOMADO = {
  em: '2026-11-16T12:44:00.000Z',
  kv: {
    ok: true, restantes: 0, namespaceId: null,
    retomada: { em: '2026-11-20T10:00:00.000Z', ok: true, apagadas: 6, restantes: 0 },
  },
};
const ELO_BREU = {
  em: '2026-11-16T12:44:00.000Z', motivo: 'expurgo antes de recriar',
  kv: { ok: true, apagadas: 0, restantes: 0, namespaceId: null },
};
const INDICE_BREU = {
  expurgo: [ELO_BREU],
  recriacao: [{ em: '2026-11-17T09:00:00.000Z' }],
};

(async () => {
  const contra = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
  let base = raiz;
  if (contra) {
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'kv-' + contra.slice(0, 7) + '-'));
    // `porta/` e `biblioteca/` vão junto: o `repo-escola` alcança os envelopes e o catálogo por
    // caminho relativo, e sem eles o `require` estoura antes de a regra ser medida.
    execSync('git archive ' + contra + ' motor modelo porta biblioteca tools | tar -x -C ' + destino,
      { cwd: raiz, stdio: 'pipe' });
    base = destino;
  }
  const repo = require(path.join(base, 'motor/servidor/repo-escola.js'));
  const ler = (indice) => repo.pendenciaDoKv({
    token: 'x', dono: 'tmenegaz', repo: 'danca', ref: 'main', slug: 'escola', fetchImpl: indiceServido(indice),
  });

  console.log('\nA. O elo que dizia «limpo» sem ter olhado');
  const p1 = await ler({ expurgo: [ELO_CALANGO] });
  provar('o elo da `calango` é PENDENTE (o botão dizia «nada pendente»)',
    !!p1, p1);
  provar('…e o `porque` diz que o elo nunca chegou a olhar',
    !!p1 && /nunca chegou a olhar/.test(p1.porque || ''), p1 && p1.porque);

  console.log('\nB. O elo que falhou a apagar continua pendente — e diz o erro');
  const p2 = await ler({ expurgo: [ELO_FALHOU] });
  provar('o elo com `pendente: true` é pendente', !!p2, p2);
  provar('…e o `porque` é o erro que a limpeza deu', !!p2 && /429/.test(p2.porque || ''), p2 && p2.porque);

  console.log('\nC. O elo já retomado não se acusa duas vezes');
  provar('com `kv.retomada`, não há pendência', (await ler({ expurgo: [ELO_RETOMADO] })) === null, null);

  console.log('\nD. A recriação encerra a pendência — a `breu` tem 23 chaves, e são dela');
  provar('expurgo com namespace nulo + recriação posterior → nada pendente',
    (await ler(INDICE_BREU)) === null, null);
  provar('…e SEM a recriação o mesmo elo é pendente (a fronteira é a data)',
    !!(await ler({ expurgo: [ELO_BREU] })), null);

  console.log('\nE. Fechar a pendência grava onde se limpou — e a leitura seguinte cala-se');
  const fechado = repo.comResolucaoDoKv(JSON.stringify({ expurgo: [JSON.parse(JSON.stringify(ELO_CALANGO))] }),
    { quando: '2026-11-22T18:00:00.000Z', resultado: { ok: true, apagadas: 6, restantes: 0, namespaceId: 'ns-do-shard' } });
  const eloDepois = JSON.parse(fechado).expurgo[0];
  provar('o elo ganha a linha do que veio depois, com `em`, `ok` e `apagadas`',
    !!eloDepois.kv.retomada && eloDepois.kv.retomada.ok === true
      && eloDepois.kv.retomada.apagadas === 6 && eloDepois.kv.retomada.em === '2026-11-22T18:00:00.000Z',
    eloDepois.kv.retomada);
  provar('…e o `namespaceId` com que se limpou fica no elo (era `null`, agora sabe-se)',
    eloDepois.kv.namespaceId === 'ns-do-shard', eloDepois.kv.namespaceId);
  provar('…e `ok: true` passa a ser dito', eloDepois.kv.ok === true, eloDepois.kv.ok);
  provar('…e o elo ORIGINAL não é reescrito: o expurgo de 16/11 fica como estava',
    eloDepois.em === ELO_CALANGO.em && eloDepois.motivo === ELO_CALANGO.motivo,
    [eloDepois.em, eloDepois.motivo]);
  provar('…e a leitura seguinte devolve `null` — o botão deixa de acusar',
    (await ler(JSON.parse(fechado))) === null, null);

  console.log('\nF. Uma pergunta, dois chamadores');
  provar('`eloPedeLimpezaDoKv` é exportado (o anúncio e o fecho perguntam o mesmo)',
    typeof repo.eloPedeLimpezaDoKv === 'function', typeof repo.eloPedeLimpezaDoKv);
  if (typeof repo.eloPedeLimpezaDoKv === 'function') {
    provar('o predicado: nulo é pendente, retomado não é, e sem `kv` não há o que limpar',
      repo.eloPedeLimpezaDoKv(ELO_CALANGO) === true
        && repo.eloPedeLimpezaDoKv(ELO_RETOMADO) === false
        && repo.eloPedeLimpezaDoKv({}) === false
        && repo.eloPedeLimpezaDoKv(null) === false, null);
  }

  if (base !== raiz) fs.rmSync(base, { recursive: true, force: true });

  console.log('');
  if (falhas) {
    console.log((contra ? 'CONTROLE: ' : '') + 'FALHARAM ' + falhas + ' de ' + total + ' asserções.');
    process.exit(1);
  }
  console.log((contra ? 'CONTROLE CONFORME — ' : 'TUDO CERTO — ') + total + ' asserções: a pendência do '
    + 'KV existe quando o elo nunca olhou, quando a limpeza falhou e enquanto não houver recriação; '
    + 'anunciar e fechar fazem a MESMA pergunta.');
})();
