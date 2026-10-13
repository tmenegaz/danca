'use strict';

/**
 * catalogo-seed.js — a ponte entre o catálogo de conteúdo (biblioteca/modalidades/) e o
 * andaime temporário do cadastro (o KV por escola).
 *
 * O CONTEÚDO NÃO VIVE MAIS AQUI. A base canónica foi movida para a biblioteca:
 *
 *   biblioteca/modalidades/bale-classico/vocabulario.json   ← os termos
 *   biblioteca/modalidades/bale-classico/progressao.json    ← as turmas + a relação inicial
 *   biblioteca/modalidades/bale-classico/tradicoes.json     ← as diferenças de nomenclatura
 *
 * Este módulo apenas LÊ esses arquivos (via `require` de JSON — o esbuild do Worker os embute,
 * sem `fs`/`path`, que não existem no Worker) e devolve na forma que `bastidores.js` espera.
 * É um andaime: quando a escola passar a DECLARAR o que usa (no `ESCOLA.conf`), este módulo e o
 * botão «Carregar catálogo inicial» saem. O `id` é derivado do nome (slug), como sempre.
 */

const vocabulario = require('../../biblioteca/modalidades/bale-classico/vocabulario.json');
const progressao = require('../../biblioteca/modalidades/bale-classico/progressao.json');
const tradicoes = require('../../biblioteca/modalidades/bale-classico/tradicoes.json');

/** O slug de um nome (a MESMA derivação de provisionar-escola.js e de bastidores.js). */
function slugificar(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** Os termos, na forma que `bastidores.js` consome (`normalizarTermo`). */
const TERMOS = vocabulario.map((t) => ({
  termo: t.termo,
  categoria: t.categoria,
  tradicao: t.tradicao,
  alternativos: t.alternativos || [],
  descricao: t.descricao || '',
  fonte: t.fonte || '',
  observacoes: t.observacoes || '',
}));

/** As turmas, na forma que `bastidores.js` consome (`normalizarTurma`). */
const TURMAS = (progressao.turmas || []).map((t) => ({
  nome: t.nome,
  ordem: t.ordem,
  programaReferencia: t.programaReferencia || '',
  nivelReferencia: t.nivelReferencia || '',
  descricao: t.descricao || '',
  ativo: t.ativo !== false,
}));

/** A relação inicial turma↔termo, resolvida para `{turma, termo}` (nomes, como o seed espera). */
const RELACOES = (progressao.relacoes || []).map((r) => {
  const turma = TURMAS.find((t) => slugificar(t.nome) === r.turma);
  const termo = TERMOS.find((t) => slugificar(t.termo) === r.termo);
  return {
    turma: turma ? turma.nome : r.turma,
    termo: termo ? termo.termo : r.termo,
  };
}).filter((r) => r.turma && r.termo);

const CATEGORIAS = tradicoes.categorias || {};
const TRADICOES = tradicoes.tradicoes || [];

module.exports = { TURMAS, TERMOS, RELACOES, CATEGORIAS, TRADICOES };
