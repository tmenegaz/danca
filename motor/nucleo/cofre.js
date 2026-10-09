'use strict';

/**
 * cofre.js — o cofre da anamnese (o depósito CIFRADO), portado de
 * `workers/receber.js` para o núcleo agnóstico.
 *
 * O envelope da anamnese é montado no MOTOR (`POST /api/elicitar`) e CIFRADO NO
 * NAVEGADOR, com a senha da escola: o que chega ao cofre é o invólucro
 * `_cifrado` ({ algoritmo, iteracoes, endereco }). O cofre NÃO tem a senha:
 * grava o invólucro como veio e devolve-o como veio. É o que torna a anamnese
 * legível por GET — o que sai é cifra, nunca resposta de aluna.
 *
 * O carimbo viaja FORA do `_cifrado`, no `contexto` (nasce no relógio do motor
 * e vive dentro do texto cifrado): a chave monta-se do `contexto`, não do
 * conteúdo cifrado.
 *
 * As chaves do cofre vivem no MESMO armazenamento dos envelopes, mas numa
 * família própria (a notação herdada de `workers/receber.js`):
 *
 *   <escola>/<professor>/<ciclo>/anamnese/<carimbo>
 *
 * O prefixo da escola vem primeiro para que o cofre de UMA escola se leia com
 * `listar(prefixo)` sem varrer as outras. O núcleo NÃO sabe se isso é KV, disco
 * ou memória — recebe o adaptador e devolve o que produz (o contrato de
 * `./armazenamento.js`).
 *
 * Uso:
 *   const { guardarAnamnese, lerAnamnese, listarAnamneses } = require('./cofre.js');
 *   await guardarAnamnese(armazenamento, contexto, _cifrado);
 *   const texto = await lerAnamnese(armazenamento, carimbo, contexto);
 */

/** O carimbo no formato do `id` das rotas de leitura do motor. */
const CARIMBO = /^[a-z0-9][a-z0-9-]*$/;

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

/** A raiz das duas famílias de chave (lancamento e anamnese). */
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

/** Devolve a chave do cofre para o contexto, ou `null` quando falta segmento. */
function chaveDaAnamnese(contexto) {
  const c = contexto || {};
  const escola = segmento(c.escola);
  const professor = segmento(c.professor);
  const ciclo = cicloDaChave(c.ciclo);
  const carimbo = segmento(c.carimbo);
  if (!escola || !professor || !ciclo || !carimbo || !CARIMBO.test(carimbo)) return null;
  return raizDaChave(escola, professor) + '/' + ciclo + '/anamnese/' + carimbo;
}

/** O segmento da rota chega escapado da URL; um `%` solto faz `decode` lançar. */
function semEscape(texto) {
  try { return decodeURIComponent(texto); } catch { return null; }
}

/**
 * O invólucro `_cifrado` tem de ter `algoritmo` e `endereco` — a mesma forma que
 * `tools/cifrar-dados.js` publica. Devolve a mensagem de erro, ou `null` se vale.
 */
function validarInvolucro(cifrado) {
  if (!cifrado || typeof cifrado !== 'object'
    || typeof cifrado.algoritmo !== 'string' || !cifrado.algoritmo
    || typeof cifrado.endereco !== 'string' || !cifrado.endereco) {
    return 'faltou o involucro `_cifrado` (o que sai do Cifra.cifrarSync: algoritmo, iteracoes e endereco)';
  }
  return null;
}

/**
 * Guarda a anamnese cifrada no cofre. Devolve `{ ok: true, chave, carimbo }`; o
 * erro é LANÇADO (o adaptador não esconde falha de infraestrutura atrás de
 * `null`) — quem chama decide a recusa.
 *
 * A duplicata é recusada: o carimbo do motor já é único por minuto, e a mesma
 * garantia do lançamento vale aqui (`existe` antes do `guardar`, sem transação).
 */
async function guardarAnamnese(armazenamento, contexto, cifrado) {
  const erroInvolucro = validarInvolucro(cifrado);
  if (erroInvolucro) throw new Error(erroInvolucro);

  const chave = chaveDaAnamnese(contexto);
  if (!chave) {
    throw new Error('contexto incompleto: precisa de escola, professor, ciclo e carimbo (sem barra, `.` ou `..`)');
  }

  if (await armazenamento.existe(chave)) {
    throw new Error('ja existe uma anamnese com este carimbo: ' + contexto.carimbo);
  }

  // O contexto fica EM CLARO de propósito: não é segredo (o apelido já é
  // publicado) e é ele que discrimina o registro. As respostas da aluna vivem
  // TODAS dentro do `_cifrado`.
  const guardado = {
    _cifrado: cifrado,
    contexto,
    _nota: 'O envelope da anamnese, CIFRADO no navegador com a senha da escola (tools/lib-cifra.js). O cofre guarda o involucro; quem decifra e o formulario, com a senha, no navegador.',
  };

  await armazenamento.guardar(chave, JSON.stringify(guardado, null, 2) + '\n');
  return { ok: true, chave, carimbo: contexto.carimbo };
}

/**
 * Lê a anamnese cifrada do cofre — VERBATIM, byte a byte, como foi guardada
 * (reserializar mudaria o que o cliente compara). Devolve `null` quando não há.
 */
async function lerAnamnese(armazenamento, carimbo, contexto) {
  const c = contexto || {};
  const chave = chaveDaAnamnese({
    escola: c.escola,
    professor: c.professor,
    ciclo: c.ciclo,
    carimbo,
  });
  if (!chave) return null;
  return armazenamento.ler(chave);
}

/**
 * Lista os carimbos da família. Devolve `{ pasta, anamneses }` — os nomes
 * relativos ao prefixo (carimbos, sem extensão: a chave do cofre não a tem).
 * Devolve `null` quando falta segmento no contexto.
 */
async function listarAnamneses(armazenamento, escola, professor, ciclo) {
  const e = segmento(escola);
  const p = segmento(professor);
  const c = cicloDaChave(ciclo);
  if (!e || !p || !c) return null;
  const prefixo = raizDaChave(e, p) + '/' + c + '/anamnese/';
  const nomes = await armazenamento.listar(prefixo);
  return {
    pasta: prefixo,
    anamneses: nomes.map((nome) => nome.slice(prefixo.length)).sort(),
  };
}

module.exports = {
  CARIMBO,
  prefixoDaEscola,
  raizDaChave,
  segmento,
  cicloDaChave,
  chaveDaAnamnese,
  semEscape,
  validarInvolucro,
  guardarAnamnese,
  lerAnamnese,
  listarAnamneses,
};
