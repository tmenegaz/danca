#!/usr/bin/env node
'use strict';

/*
 * provar-arvore-do-shard.js — a aritmética do shard, sem rede e sem Cloudflare.
 *
 * O QUE ESTE FICHEIRO MEDE, E POR QUE BASTA. O shard inteiro depende de DUAS decisões sobre
 * caminhos: qual é o prefixo da escola (`''` num Worker de uma escola, `/<escola>` num shard) e
 * o que NÃO se reescreve (`/assets/…`, que é a cópia partilhada). Se as duas estiverem certas,
 * `/aulas/` serve o conteúdo da escola certa e o CSS não gasta invocação; se uma estiver errada,
 * o resultado é 404 numa escola e conteúdo de outra na seguinte — e as duas falham em silêncio.
 *
 * Não substitui a `provar-bateria-do-shard`, que corre contra o ar. Substitui-a para efeitos de
 * DEPURAÇÃO: quando a bateria falha num caminho, esta diz em três segundos qual das duas
 * decisões está errada, sem tocar em produção nem gastar invocação.
 *
 * O CONTROLE NEGATIVO, e é o ponto: fora do shard, NADA é reescrito. Um `PACOTE_PARTILHADO`
 * ausente não pode mudar o comportamento das três escolas que já existem — se mudasse, este
 * código teria mudado três sites no dia em que foi escrito.
 *
 *   node experimentos/provar-arvore-do-shard.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));

let ok = 0;
let ko = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
  else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
};

const escolaUnica = (slug) => ({ ESCOLA_SLUG: slug });
const shard = (slug) => ({ ESCOLA_SLUG: slug, PACOTE_PARTILHADO: 'sim' });

(async () => {
  /* ── 1. O PREFIXO ─────────────────────────────────────────────────────────────────────────── */
  provar('sem `PACOTE_PARTILHADO`, o prefixo é vazio (o Worker de uma escola não muda)',
    producao.prefixoDaArvore(escolaUnica('calango')) === '',
    producao.prefixoDaArvore(escolaUnica('calango')));
  provar('com ele, o prefixo é `/<escola>`',
    producao.prefixoDaArvore(shard('calango')) === '/calango',
    producao.prefixoDaArvore(shard('calango')));
  provar('sem escola resolvida, não há prefixo — e portanto não se serve uma subárvore ao calhas',
    producao.prefixoDaArvore({ PACOTE_PARTILHADO: 'sim' }) === '',
    producao.prefixoDaArvore({ PACOTE_PARTILHADO: 'sim' }));
  provar('sem env nenhum, não explode', producao.prefixoDaArvore(null) === '', producao.prefixoDaArvore(null));

  /* ── 2. A REESCRITA ───────────────────────────────────────────────────────────────────────── */
  const casos = [
    ['/', '/calango/'],
    ['/aulas/', '/calango/aulas/'],
    ['/ciclos/planos/', '/calango/ciclos/planos/'],
    ['/piano/assets/lib-vistas.js', '/calango/piano/assets/lib-vistas.js'],
    ['/rosa/ciclo-01-calango-rosa.pdf', '/calango/rosa/ciclo-01-calango-rosa.pdf'],
    ['/plano-observacao/', '/calango/plano-observacao/'],
  ];
  for (const [pedido, esperado] of casos) {
    provar('`' + pedido + '` → `' + esperado + '`',
      producao.caminhoNaArvore(shard('calango'), pedido) === esperado,
      producao.caminhoNaArvore(shard('calango'), pedido));
  }
  provar('CONTROLE NEGATIVO: fora do shard, nenhum caminho muda',
    casos.every(([pedido]) => producao.caminhoNaArvore(escolaUnica('calango'), pedido) === pedido),
    casos.map(([p]) => [p, producao.caminhoNaArvore(escolaUnica('calango'), p)]));

  /* ── 3. O QUE NÃO SE REESCREVE ────────────────────────────────────────────────────────────── */
  provar('`/assets/style.css` é partilhado', producao.ehAssetPartilhado('/assets/style.css') === true);
  provar('`/assets` (sem barra) também', producao.ehAssetPartilhado('/assets') === true);
  provar('`/assets/` (a pasta) também', producao.ehAssetPartilhado('/assets/') === true);
  provar('CONTROLE NEGATIVO: `/piano/assets/x.js` NÃO é partilhado — é da turma, e reescreve-se',
    producao.ehAssetPartilhado('/piano/assets/x.js') === false);
  provar('CONTROLE NEGATIVO: `/assets10/x` não é confundido com `/assets/x`',
    producao.ehAssetPartilhado('/assets10/x') === false);

  /* ── 4. O PREFIXO DA PORTA ────────────────────────────────────────────────────────────────── */
  provar('a porta lê `plano-observacao/` na raiz, fora do shard',
    producao.prefixoDosAssetsDaPorta(escolaUnica('calango')) === 'plano-observacao/',
    producao.prefixoDosAssetsDaPorta(escolaUnica('calango')));
  provar('e `calango/plano-observacao/` dentro dele',
    producao.prefixoDosAssetsDaPorta(shard('calango')) === 'calango/plano-observacao/',
    producao.prefixoDosAssetsDaPorta(shard('calango')));

  /* ── 5. A CACHE É POR ESCOLA ──────────────────────────────────────────────────────────────── */
  /* O defeito que isto impede: um isolate a servir N escolas com uma cache de valor único
   * responderia pelo `escola_do_pacote` da PRIMEIRA a todas as outras. */
  producao.esquecerPacote();
  const semAssets = await producao.identidadeDoPacote(shard('calango'));
  provar('sem ASSETS, a identidade é nula e não inventa escola', semAssets === null, semAssets);
  provar('…e esquecer a cache não lança', typeof producao.esquecerPacote === 'function');

  console.log('\n' + (ko === 0 ? 'TUDO CERTO — ' + ok + ' asserções.'
    : 'FALHOU — ' + ok + ' asserção(ões), ' + ko + ' falha(s).'));
  process.exit(ko === 0 ? 0 : 1);
})();
