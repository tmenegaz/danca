'use strict';

/**
 * chaves.js — como se monta o prefixo de uma família de chaves do KV.
 *
 * O QUE ESTE MÓDULO É. Nada mais do que a regra de construção do prefixo: a escola vira o
 * primeiro segmento (sem acentos nem maiúsculas), o professor vem a seguir, e o resto da
 * chave é acrescentado por quem tem o registo. É o que garante que uma mesma escola caia na
 * mesma família independentemente do runtime — a notação foi herdada de
 * `workers/receber.js` e vive aqui desde então.
 *
 * QUEM USA. O **lançamento** (`lancamento.js`), que grava a aula dada em
 * `<escola>/<professor>/<ciclo>-<carimbo>/<arquivo>`.
 *
 * DE ONDE VEIO (e por que o ficheiro se chama `chaves.js` e não `cofre.js`). Até 20/10/2026
 * este módulo chamava-se `cofre.js` e carregava também a ANAMNESE: `guardarAnamnese`,
 * `lerAnamnese`, `listarAnamneses` e `chaveDaAnamnese`, sob `<escola>/<professor>/<ciclo>/
 * anamnese/<carimbo>`. O cofre era uma SEGUNDA cópia da anamnese, no KV, depois de o
 * envelope já estar no acervo do repositório — o mesmo documento em dois sítios, com dois
 * resultados a conciliar e duas contas de cota a pagar. Ele saiu, e com ele saiu metade
 * deste ficheiro: o que resta é a regra de chave, que o lançamento continua a precisar.
 *
 * O núcleo NÃO sabe se isto é KV, disco ou memória — recebe o adaptador (o contrato de
 * `./armazenamento.js`) e devolve o que produz.
 */

/**
 * O primeiro segmento da chave: a escola, sem acentos nem maiúsculas — o MESMO
 * `prefixoDaEscola` de `workers/receber.js`, para que uma mesma escola caia na
 * mesma família independentemente do runtime.
 */
function prefixoDaEscola(escola) {
  return String(escola)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'escola';
}

/** A raiz da família de chaves da escola: `<escola>/<professor>`. */
function raizDaChave(escola, professor) {
  return prefixoDaEscola(escola) + '/' + professor;
}

/**
 * Um segmento de chave não pode ser vazio, `.`/`..` nem conter barra. `escola`,
 * `professor` e `ciclo` chegam do seletor do cliente — de fora do motor — e a
 * chave é montada por concatenação: sem esta checagem, um `professor` com
 * `../..` escreveria fora da família da escola.
 */
function segmento(valor) {
  const s = String(valor == null ? '' : valor).trim();
  return !s || s === '.' || s === '..' || /[\\/]/.test(s) ? null : s;
}

/** O ciclo entra na chave com dois dígitos, como o formulário de lançamento. */
function cicloDaChave(valor) {
  const s = segmento(valor);
  return s && s.padStart(2, '0');
}

module.exports = {
  prefixoDaEscola,
  raizDaChave,
  segmento,
  cicloDaChave,
};
