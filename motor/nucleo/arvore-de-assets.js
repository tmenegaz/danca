'use strict';

/**
 * ONDE A ÁRVORE DE ASSETS COMEÇA — a escola a que pertence o pedido.
 *
 * PORQUE ESTE FICHEIRO EXISTE (22/11/2026). A regra nasceu em `motor/servidor/producao.js`, e viveu
 * lá bem enquanto só a produção a lia. Quando os Bastidores passaram a precisar dela — o painel lê
 * o `ciclos.json` do pacote — o `require('./producao.js')` de dentro de `bastidores.js` fechava o
 * ciclo que já existe entre os dois módulos (`producao.js` requer `bastidores.js` na primeira
 * linha), e no Worker empacotado a função chegava `undefined`: o painel pedia o caminho SEM o
 * prefixo da escola, recebia 404, e anunciava «o pacote não está no ar» sobre um ficheiro que está.
 * Não se viu em Node, onde o `require` tardio resolve; viu-se ao vivo, na `breu`.
 *
 * A LIÇÃO É A MESMA DE SEMPRE, e por isso a regra muda de casa em vez de ganhar uma cópia: uma
 * convenção de caminho, um sítio só. `producao.js` reexporta daqui, e quem já a importava de lá
 * continua a funcionar.
 */

/**
 * `PACOTE_PARTILHADO=sim` + `ESCOLA_SLUG=breu` → `/breu`; fora do shard, `''`.
 *
 * A DECLARAÇÃO É UMA `var`, e não uma inferência («não há `/escola.json` na raiz, logo é shard»):
 * um pacote de escola única montado sem esse ficheiro passaria a ser lido como shard. A `var` diz
 * o que é, e a config é o sítio onde isso se lê.
 */
function prefixoDaArvore(env) {
  if (!env || env.PACOTE_PARTILHADO !== 'sim') return '';
  const escola = String(env.ESCOLA_SLUG || '').trim();
  return escola ? '/' + escola : '';
}

module.exports = { prefixoDaArvore };
