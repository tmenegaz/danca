'use strict';

/**
 * teste-fixtures.js — os três conjuntos de dados das ESCOLAS DE TESTE.
 *
 * A regra é do NOME da escola, e ela é de SUFIXO: o slug termina em `teste-1`,
 * `teste-2` ou `teste-3`. `Plie teste 1` vira `plie-teste-1` e é escola de teste 1;
 * `testemunho` e `teste 4` não são.
 *
 * O motivo de o JSON morar em `teste/` e ser `require`-ado aqui — e não em
 * `experimentos/` — é o mesmo do `catalogo-seed.js`: o esbuild do Worker empacota o
 * JSON no bundle. `experimentos/` é demonstrativo e não entra em pacotes, hashes ou
 * publicação (AGENTS.md). Aqui o dado PRECISA chegar ao Worker de verdade.
 *
 * Nada aqui escreve, autentica ou consulta o KV. É leitura pura de um arquivo que já
 * está no código — e só a escola cujo slug casa recebe o fixture.
 */

const FIXTURES = {
  1: require('../../teste/escola-teste-1.json'),
  2: require('../../teste/escola-teste-2.json'),
  3: require('../../teste/escola-teste-3.json'),
};

/**
 * O número do teste, ou 0 quando o slug não é de escola de teste.
 *
 * O sufixo é o que decide. A regex aceita o hífen obrigatório do slug e o `0` opcional
 * (`teste-01`), mas NÃO aceita um número maior que 3 — a convenção combinada é 1, 2, 3.
 */
function numeroDoTeste(slug) {
  const texto = String(slug || '').trim().toLowerCase();
  if (!texto) return 0;
  const m = texto.match(/(?:^|-)(?:teste|testes)-?0?([1-3])$/);
  return m ? Number(m[1]) : 0;
}

/** O fixture daquela escola, ou `null` quando ela não é de teste. */
function fixtureDaEscola(slug) {
  const n = numeroDoTeste(slug);
  return n ? FIXTURES[n] : null;
}

/** Os três conjuntos, para ferramentas de prova e para o painel. */
function todosOsFixtures() {
  return { 1: FIXTURES[1], 2: FIXTURES[2], 3: FIXTURES[3] };
}

module.exports = { numeroDoTeste, fixtureDaEscola, todosOsFixtures, FIXTURES };
