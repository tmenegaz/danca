'use strict';

/**
 * cifrar-envelope.js — cifra o JSON de dados do ciclo DENTRO DO WORKER, no «Guardar» do PO.
 *
 * É a metade da cifra que, antes, só acontecia no `tools/cifrar-dados.js` (Node, local, com a
 * senha vinda de `tools/.senhas-locais`). Com a senha de criptografia morando no Worker (segredo
 * `SENHA_CRIPTO`), o Worker é quem produz a CÓPIA cifrada — e o gerador só a copia para o pacote,
 * sem nunca ver a senha. É o caminho (a): a senha nasce e vive no Cloudflare, não no computador da
 * pesquisadora nem num secret do GitHub.
 *
 * O ENVELOPE é EXATAMENTE o mesmo do `tools/cifrar-dados.js` (mesma forma, mesmo esquema, mesmo
 * `_nota`) — para o `check-pacote.js` e o formulário de lançamento não notarem diferença:
 *   · `_cifrado`    — {algoritmo, iteracoes, endereco}, que `tools/lib-cifra.js` lê de volta;
 *   · `lancamentos` — quantas aulas já têm dado (não é segredo; deixa o formulário abrir sem pedir
 *     a senha quando não há nada lançado);
 *   · `apelidos`    — o mapa apelido → nome de exibição, EM CLARO (P-12: nunca o nome completo);
 *   · `_nota`       — para quem abrir o arquivo sem saber o que ele é.
 *
 * A única diferença de implementação é o motor da cifra: o Worker usa o WebCrypto (`Cifra.cifrar`,
 * assíncrono), enquanto o CLI usa o Node (`Cifra.cifrarSync`). O resultado é idêntico.
 */

const Cifra = require('../../tools/lib-cifra.js');

/** A nota que identifica o envelope — a MESMA do `tools/cifrar-dados.js`, para não divergir. */
const NOTA = 'O JSON de dados do ciclo, CIFRADO com a senha da escola (a mesma dos acompanhamentos): '
  + 'o pacote e publico e ele traz o lancamento por aluna. Quem decifra e o formulario de '
  + 'lancamento, no navegador, com tools/lib-cifra.js. O campo "lancamentos" NAO e secreto: diz '
  + 'se ha o que mostrar, para o formulario nao pedir a senha a toa. O campo "apelidos" tambem '
  + 'sai em claro: sem ele um ciclo sem lancamento nenhum apareceria sem as alunas. Nao editar a mao.';

/**
 * Cifra o texto do `-dados.json` e devolve o envelope completo do pacote.
 * `senha` é a `SENHA_CRIPTO` da escola (o segredo do Worker), nunca um valor em claro no repo.
 */
async function cifrarEnvelopeDeDados(texto, senha) {
  if (!senha) throw new Error('cifrar-envelope: falta a senha (SENHA_CRIPTO)');
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch (e) {
    throw new Error('cifrar-envelope: o -dados.json não é JSON válido (' + e.message + ')');
  }
  const lancamentos = Object.keys((dados && dados.aulas) || {}).length;
  const _cifrado = await Cifra.cifrar(texto, senha);
  return {
    _cifrado,
    lancamentos,
    apelidos: (dados && dados.apelidos) || {},
    _nota: NOTA,
  };
}

module.exports = { cifrarEnvelopeDeDados };
