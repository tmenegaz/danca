'use strict';

/* ---------------------------------------------------------------------- os dois ambientes
 *
 * A PÁGINA TAMBÉM PRECISA DESTA REGRA (20/11/2026). O formulário do lançamento decidia o eixo de
 * cada bloco com uma SEGUNDA cópia da regra — comparava o rótulo inteiro («Técnica — Barra») com
 * as dimensões do PO, e por isso os blocos escritos com o prefixo caíam FORA dos três eixos e
 * apareciam ao fim do formulário com um aviso. Uma cópia a divergir da outra é exactamente o que
 * este módulo existe para impedir; o remédio é ele ser servido à página, e não reescrito lá.
 *
 * O EMBRULHO É FECHADO, e tem de ser: em browser um `<script src>` clássico põe as declarações de
 * topo no escopo global, e `semAcento` colidia com a função de mesmo nome que a página já tem
 * («Identifier 'semAcento' has already been declared»). Nada sai daqui a não ser o objeto — em
 * Node `module.exports`, no browser o global `Eixos`. O padrão é o do `tools/lib-vistas.js`.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Eixos = fabrica();
}(typeof self !== 'undefined' ? self : this, () => {

/**
 * OS TRÊS EIXOS DO QUE SE OBSERVA EM DANÇA — a declaração ÚNICA do lado do código.
 *
 * **Corpo · Técnica · Poiesis.** A taxonomia deixou de ser candidata: a pesquisadora decidiu-a, e
 * decidiu-a por escrito («o guia não pode chamar tudo de técnica»; «musicalidade e expressão
 * pertencem estritamente ao eixo da poiesis e jamais devem ser rotulados ou agrupados sob o eixo
 * técnico»). O que era um mapa provisório dentro de `derivar-ciclo.js` passa a ser isto, e passa a
 * ser lido por quem quer que precise de decidir a que eixo pertence um bloco.
 *
 * POR QUE UM MÓDULO. Havia DUAS cópias da mesma regra — uma no gerador (`derivar-ciclo.js`) e
 * outra no montador da publicação (`tools/montar-publicacao.js`) —, e a segunda tinha o mapa
 * escrito à mão outra vez. Duas cópias de uma taxonomia divergem ao primeiro bloco novo, e o
 * sintoma seria o pior possível: a mesma dimensão no eixo técnico na aula e na poiesis no cartão.
 * Com uma terceira cópia a caminho (o Plano de Observação), a união passou a ser o trabalho.
 *
 * O QUE **NÃO** ESTÁ AQUI, de propósito: os rótulos gravados nos envelopes. Um PO antigo tem
 * «Técnica — Musicalidade» escrito pelo sistema, e o dado não se reescreve (P-03). O que esta
 * declaração corrige é a LEITURA: `blocoDaDimensao` tira o prefixo e `eixoDoBloco` diz o eixo
 * verdadeiro — de modo que o mesmo par serve para o que está gravado e para o que se gravar.
 *
 * Fronteira: puro. Sem `fs`, `path`, `http` nem `process`.
 */

/**
 * A ORDEM É A DE LEITURA, e é canónica: o corpo primeiro (é o que se vê), a técnica depois (é o
 * que se trabalha) e a poiesis ao fim (é o que a dança faz com as duas). Mudar a ordem muda a
 * ordem dos blocos de todos os documentos — é decisão de método, não de arrumação.
 */
const EIXOS = [
  { id: 'corpo', rotulo: 'Corpo', cobre: 'O que o corpo de cada aluna mostra: força, flexibilidade, alinhamento e restrições.' },
  { id: 'tecnica', rotulo: 'Técnica', cobre: 'O que se trabalha nos lugares da sala: barra e centro.' },
  { id: 'poiesis', rotulo: 'Poiesis', cobre: 'O que a dança faz: musicalidade e expressão.' },
];

/**
 * OS BLOCOS QUE NÃO SÃO LUGARES DA SALA. Musicalidade e Expressão chamavam-se «Técnica —» porque
 * o rótulo era concatenado com um eixo fixo; o conteúdo deles («resposta ao pulso na marcação»,
 * «olhar acompanha o braço») é poiésis, e o rótulo era uma afirmação falsa sobre o que se mede.
 */
const BLOCOS_DA_POIESIS = ['musicalidade', 'expressao'];

/** Sem acento, minúsculo — a forma de comparar rótulos que vêm de sítios diferentes. */
const semAcento = (t) => String(t == null ? '' : t)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

/**
 * O BLOCO de uma dimensão: o que vem depois do separador («Técnica — Barra» → «Barra»).
 *
 * Tolera três formas, e as três existem no repositório: com eixo e travessão («Técnica — Barra»,
 * o que os POs gravados têm), só o bloco («Barra», o que passa a gravar-se), e o nome do próprio
 * eixo («Corpo»), que é bloco e eixo ao mesmo tempo e não se parte em duas.
 */
function blocoDaDimensao(rotulo) {
  const partes = String(rotulo == null ? '' : rotulo)
    .split(/\s+[—–-]\s+/).map((p) => p.trim()).filter(Boolean);
  return partes.length > 1 ? partes[partes.length - 1] : (partes[0] || '');
}

/** O EIXO de um bloco. O corpo não se confunde com a técnica: é eixo próprio. */
function eixoDoBloco(bloco) {
  const chave = semAcento(bloco);
  if (chave === 'corpo' || chave === 'corpo ') return 'corpo';
  return BLOCOS_DA_POIESIS.indexOf(chave) !== -1 ? 'poiesis' : 'tecnica';
}

/** O RÓTULO de um eixo a partir do id — «poiesis» → «Poiesis». Desconhecido devolve `''`. */
function rotuloDoEixo(id) {
  const achado = EIXOS.find((e) => e.id === semAcento(id));
  return achado ? achado.rotulo : '';
}


  return { EIXOS, BLOCOS_DA_POIESIS, semAcento, blocoDaDimensao, eixoDoBloco, rotuloDoEixo };
}));
