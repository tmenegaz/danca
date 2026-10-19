'use strict';

/**
 * teste-fixtures.js — os três conjuntos de dados das ESCOLAS DE TESTE.
 *
 * A regra é do NOME da escola, e ela é uma PALAVRA: `Calango`, `Batata` ou `Breu`.
 * Qualquer nome que contenha uma delas é escola de teste — `Batata`, `escola-batata`,
 * `Batata da Tarde` —, e a palavra diz qual dos três conjuntos carregar:
 *
 *     Calango → 1        Batata → 2        Breu → 3
 *
 * Antes (19/10/2026, mesmo dia) a regra era `teste 1/2/3` no fim do nome. Trocada por
 * uma razão prática: quem testa escreve o nome da escola à mão, muitas vezes no celular,
 * e «calando teste 1» é longo, repete-se a cada ensaio e erra-se fácil. Uma palavra só
 * resolve o mesmo problema de identificação com um terço da digitação.
 *
 * A ORDEM DA PALAVRA NO NOME NÃO CONTA, e a primeira que aparece é a que vale: um nome
 * com duas (`batata-do-breu`) é o teste 2 — o caso não existe no uso, e a regra precisa
 * de uma resposta determinística para não depender de sorte.
 *
 * O motivo de o JSON morar em `teste/` e ser `require`-ado aqui — e não em
 * `experimentos/` — é o mesmo do `catalogo-seed.js`: o esbuild do Worker empacota o
 * JSON no bundle. `experimentos/` é demonstrativo e não entra em pacotes, hashes ou
 * publicação (AGENTS.md). Aqui o dado PRECISA chegar ao Worker de verdade.
 *
 * Nada aqui escreve, autentica ou consulta o KV. É leitura pura de um arquivo que já
 * está no código — e só a escola cujo nome casa recebe o fixture.
 */

const FIXTURES = {
  1: require('../../teste/calango.json'),
  2: require('../../teste/batata.json'),
  3: require('../../teste/breu.json'),
};

/** As três palavras, na ordem em que são procuradas — a primeira que casa decide. */
const PALAVRAS_DO_TESTE = [
  { palavra: 'calango', teste: 1 },
  { palavra: 'batata', teste: 2 },
  { palavra: 'breu', teste: 3 },
];

/** O número do teste, ou 0 quando o nome não traz nenhuma das três palavras. */
function numeroDoTeste(slug) {
  const texto = String(slug || '').trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!texto) return 0;
  // Token a token, na ordem do nome: `batata-da-tarde` é 2, `nao-e-breu-nem-batata` é 3.
  const palavras = texto.split(/[^a-z0-9]+/).filter(Boolean);
  for (const parte of palavras) {
    const achado = PALAVRAS_DO_TESTE.find((p) => p.palavra === parte);
    if (achado) return achado.teste;
  }
  return 0;
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

module.exports = { numeroDoTeste, fixtureDaEscola, todosOsFixtures, FIXTURES, PALAVRAS_DO_TESTE };
