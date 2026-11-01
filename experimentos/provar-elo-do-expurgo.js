'use strict';

/*
 * provar-elo-do-expurgo.js — o ELO do expurgo regista o desfecho do KV, sempre.
 *
 * O DEFEITO, medido no expurgo da escola `batata` a 01/11/2026. O elo 6 de
 * `escola/batata/indice.json` ficou **sem** o bloco `kv`, enquanto os elos 2 a 5 o têm
 * (`ok:true, restantes:0`). A rota lia o desfecho por `relatorio.cloudflare.kv` — e
 * quando `excluirEscola` LANÇA (é o que acontece quando a enumeração do KV estoura a
 * cota diária), o `catch` grava `{ erro, morada }` e `cloudflare.kv` nunca existe:
 *
 *     const kvDoExpurgo = relatorio.cloudflare && relatorio.cloudflare.kv;  // undefined
 *     kv: kvDoExpurgo ? { … } : null                                        // → null
 *
 * O elo ficava sem `kv`, e `pendenciaDoKv` — que só reconhece `kv.pendente === true` —
 * respondia «nada pendente». A escola saía do ar e do repositório, as chaves podiam ter
 * ficado, e a retomada (`POST /api/expurgar-kv`) ficava **cega**: é do elo que ela lê o
 * namespace. A contradição era visível no próprio relatório: `kvFalhou` também saía
 * `false`, e a rota respondia `ok: true` sobre chaves que ninguém tinha tocado.
 *
 * O QUE ESTA PROVA MEDE. A derivação pura (`desfechoDoKvParaOElo`) e o elo que dela sai
 * (`comElo`), sem rede e sem tocar em token nenhum — o expurgo é irreversível, e uma
 * prova que o ensaiasse a sério apagaria a escola de ensaio. O CONTROL E NEGATIVO é o
 * `?:` de antes: com ele, o mesmo caso devolve um elo sem `kv`, e a retomada não o vê.
 *
 *   uso: node experimentos/provar-elo-do-expurgo.js
 */

const { desfechoDoKvParaOElo } = require('../motor/servidor/raiz.js');
const { comElo } = require('../motor/servidor/repo-escola.js');

const MORADA = { kvNamespaceId: 'ns-de-teste', worker: 'barra', legivel: true, arquivo: 'wrangler.barra.jsonc' };
const NADA = { ok: true, nadaPendente: true };

/** O `?:` que estava na rota, para o controle negativo — não é código de produção. */
function desfechoComoEra({ cloudflare, morada, slug }) {
  const kvDoExpurgo = cloudflare && cloudflare.kv;
  return kvDoExpurgo ? {
    ok: kvDoExpurgo.ok === true,
    apagadas: kvDoExpurgo.apagadas,
    restantes: kvDoExpurgo.restantes,
    namespaceId: (morada.kvNamespaceId || null),
    prefixos: ['barra/', 'bastidores/barra/'],
  } : null;
}

/** O elo que o `apagarEscolaDoRepo` grava — pelo `comElo` de verdade. */
function eloDe(kv) {
  const texto = comElo('', {
    slug: 'barra', professor: 'leticia', ciclo: '01',
    arquivos: ['wrangler.barra.jsonc'], motivo: 'prova', quando: '2026-11-01T00:00:00.000Z',
    kv,
  });
  return JSON.parse(texto).expurgo.pop();
}

/**
 * O que a retomada (`pendenciaDoKv` → `POST /api/expurgar-kv`) enxerga num elo. É a
 * MESMA pergunta que a rota faz: procura, do fim para o começo, um `kv.pendente === true`.
 */
function oQueARetomadaVe(elo) {
  if (elo && elo.kv && elo.kv.pendente === true) {
    return { namespaceId: elo.kv.namespaceId || null, prefixos: elo.kv.prefixos || null, erro: elo.kv.erro || null };
  }
  return NADA;
}

let falhas = 0;
function conferir(nome, condicao, detalhe) {
  console.log((condicao ? '  ok   ' : '  FALHA') + '  ' + nome + (condicao ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!condicao) falhas += 1;
}

console.log('O DESFECHO QUE VAI PARA O ELO (desfechoDoKvParaOElo)');

const limpo = desfechoDoKvParaOElo({
  cloudflare: { kv: { ok: true, apagadas: 7, restantes: 0 } }, morada: MORADA, slug: 'barra',
});
conferir('KV limpo → ok:true com apagadas e restantes',
  limpo && limpo.ok === true && limpo.apagadas === 7 && limpo.restantes === 0, limpo);
conferir('…e nomeia o namespace e os prefixos da escola',
  limpo.namespaceId === 'ns-de-teste' && limpo.prefixos.join(',') === 'barra/,bastidores/barra/', limpo);

const falhou = desfechoDoKvParaOElo({
  cloudflare: { kv: { ok: false, erro: 'kv.list: 429 — cota diária esgotada' } }, morada: MORADA, slug: 'barra',
});
conferir('KV falhou com desfecho → ok:false', falhou.ok === false, falhou);
conferir('…e o porquê viaja com o elo (não se adivinha depois)',
  /cota diária esgotada/.test(falhou.erro || ''), falhou.erro);

const explodiu = desfechoDoKvParaOElo({
  cloudflare: { erro: 'kv.list: 429 — cota diária esgotada', morada: MORADA }, morada: MORADA, slug: 'barra',
});
conferir('Cloudflare lançou, mas a escola declara namespace → NÃO devolve null', explodiu !== null, explodiu);
conferir('…e diz ok:false com o namespace que a retomada precisa',
  explodiu.ok === false && explodiu.namespaceId === 'ns-de-teste', explodiu);
conferir('…e explica que falhou antes de dizer o das chaves',
  /falhou antes de dizer o das chaves/.test(explodiu.erro || ''), explodiu.erro);

const semNamespace = desfechoDoKvParaOElo({
  cloudflare: { erro: 'qualquer coisa' }, morada: { kvNamespaceId: null }, slug: 'barra',
});
conferir('escola SEM namespace declarado → null (não se inventa pendência)', semNamespace === null, semNamespace);

console.log('');
console.log('O ELO GRAVADO, E O QUE A RETOMADA VÊ');

const eloLimpo = eloDe(limpo);
conferir('KV limpo → o elo guarda ok:true, apagadas e restantes',
  eloLimpo.kv && eloLimpo.kv.ok === true && eloLimpo.kv.apagadas === 7 && eloLimpo.kv.restantes === 0, eloLimpo.kv);
conferir('KV limpo → o elo NÃO fica pendente', !eloLimpo.kv.pendente, eloLimpo.kv);
conferir('KV limpo → a retomada não tem nada a fazer', oQueARetomadaVe(eloLimpo).nadaPendente === true,
  oQueARetomadaVe(eloLimpo));

const eloExplodiu = eloDe(explodiu);
conferir('Cloudflare lançou → o elo tem bloco `kv` (era o que faltava)',
  Boolean(eloExplodiu.kv), eloExplodiu);
conferir('…marcado `pendente: true`', eloExplodiu.kv && eloExplodiu.kv.pendente === true, eloExplodiu.kv);
conferir('…com o namespace, que é o que a retomada lê',
  eloExplodiu.kv.namespaceId === 'ns-de-teste', eloExplodiu.kv);
conferir('…com os DOIS prefixos da escola',
  eloExplodiu.kv.prefixos.join(',') === 'barra/,bastidores/barra/', eloExplodiu.kv.prefixos);
conferir('…e com o motivo preservado no elo',
  /falhou antes de dizer o das chaves/.test(eloExplodiu.kv.erro || ''), eloExplodiu.kv.erro);
conferir('e a retomada ENXERGA a pendência, com o namespace na mão',
  oQueARetomadaVe(eloExplodiu).namespaceId === 'ns-de-teste', oQueARetomadaVe(eloExplodiu));

console.log('');
console.log('O CONTROLE NEGATIVO — o `?:` que estava na rota');

const comODeAntes = desfechoComoEra({ cloudflare: { erro: 'kv.list: 429' }, morada: MORADA, slug: 'barra' });
conferir('o código de antes devolvia null no mesmo caso', comODeAntes === null, comODeAntes);
const eloDeAntes = eloDe(comODeAntes);
conferir('…e o elo ficava SEM bloco `kv`', !eloDeAntes.kv, eloDeAntes);
conferir('…e a retomada dizia «nada pendente» sobre chaves que ninguém conferiu',
  oQueARetomadaVe(eloDeAntes).nadaPendente === true, oQueARetomadaVe(eloDeAntes));
conferir('é esta a assinatura do elo 6 da `batata` (01/11/2026): `apagado` cheio, `kv` ausente',
  Array.isArray(eloDeAntes.apagado) && eloDeAntes.apagado.length === 1 && !('kv' in eloDeAntes),
  { apagado: eloDeAntes.apagado, temKv: 'kv' in eloDeAntes });

console.log('');
console.log(falhas === 0 ? 'TODAS AS PROVAS PASSARAM' : falhas + ' PROVA(S) FALHARAM');
process.exit(falhas === 0 ? 0 : 1);
