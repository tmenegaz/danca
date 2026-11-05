'use strict';

/**
 * corpo-seed.js — O CORPO QUE A ANAMNESE RECOLHE, dentro do bundle do Worker (05/11/2026).
 *
 * PORQUE É PRECISO UM MÓDULO PARA ISTO. A Produção passou a ter uma secção onde o professor
 * escolhe quais aspectos do corpo formam a linha de base do trabalho dele. Para a desenhar, a
 * tela precisa de saber **que campos existem** — o nome de cada um, o bloco a que pertence e as
 * opções da régua —, e o Worker não tem `fs`: o que ele não tiver no bundle, não lê.
 *
 * O CAMINHO É O MESMO DO `catalogo-seed.js`, e pelo mesmo motivo: `require` de JSON é resolvido
 * pelo esbuild no empacotamento, e o ficheiro passa a fazer parte do Worker. O que NÃO se faz é
 * copiar o conteúdo para dentro de um `.js` — seria uma segunda lista de campos, e duas listas
 * do mesmo campo divergem no primeiro campo novo (é a regra que este repositório já pagou caro
 * para aprender, e a razão pela qual o `vocabulario.json` também não tem cópia).
 *
 * FONTE ÚNICA: `porta/conteudo/anamnese.json`. É o ficheiro que a porta de cada ciclo serve ao
 * formulário da anamnese, e o que os pacotes copiam. Uma anamnese nova (um bloco, um campo)
 * chega cá pelo deploy, sem uma linha a mudar — e é isso que se quer.
 *
 * O QUE ESTE MÓDULO **NÃO** FAZ: decidir o que é o corpo. Esse recorte (dimensão `tecnica` ou
 * `funcional`, com a musicalidade de fora) é do núcleo — `motor/nucleo/linha-de-base.js`,
 * `camposDisponiveis`. Aqui só se entrega o conteúdo cru; a regra fica num sítio só, e é o
 * sítio onde ela é testável.
 */

const conteudo = require('../../porta/conteudo/anamnese.json');

module.exports = { conteudo };
