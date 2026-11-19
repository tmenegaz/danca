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

/**
 * A MODALIDADE QUE ESTE CATÁLOGO SEMEIA — dita UMA vez, e derivada do catálogo (04/11/2026).
 *
 * Os quatro `require` abaixo têm o `bale-classico` no CAMINHO, e isso é correcto: o `require` é
 * literal porque o empacotador precisa de o seguir em tempo de build. O que estava errado era o
 * resto do sistema ter de saber o mesmo nome — `bastidores.js` tinha seis literais iguais, e
 * duplicava a suposição em vez de a perguntar. Este módulo passa a reexportá-la, e quem precisa
 * dela pergunta-lhe.
 */
const { MODALIDADE_PADRAO: MODALIDADE } = require('../nucleo/perfil-do-professor.js');

const vocabulario = require('../../biblioteca/modalidades/bale-classico/vocabulario.json');
const progressao = require('../../biblioteca/modalidades/bale-classico/progressao.json');
const tradicoes = require('../../biblioteca/modalidades/bale-classico/tradicoes.json');
// O DICIONÁRIO DO QUE ACONTECE (28/10/2026) — bloco de notação → frase em português. Vem por
// `require` como os outros, para o esbuild o embutir: no Worker não há `fs`. Ele NÃO alimenta
// documento nenhum; é a versão de partida da frase que o editor de célula preenche.
const descricoes = require('../../biblioteca/modalidades/bale-classico/descricoes.json');

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

/**
 * OS TERMOS, COM `id` (28/10/2026). O `id` é o que liga um termo ao resto — ao verbete da notação,
 * à posição de um exercício, à relação turma↔conteúdo —, e ele vinha a ser derivado do nome em
 * cada sítio. Passa a vir do dado, que é onde ele está escrito.
 *
 * O `membro` é a marca que desempata «première position»: de pés, de pernas ou de braços. Sem ela a
 * posição não se distingue da homónima de outro membro.
 *
 * E ESTA É A ÚNICA LISTA DE TERMOS. O ficheiro que o esbuild embute aqui é o mesmo que o gerador lê
 * do disco quando compõe um documento — a cópia por escola no KV deixou de existir em 28/10/2026.
 * Um termo novo chega ao Worker no deploy que o commit do cadastro dispara.
 *
 * O TERMO ATRAVESSA INTEIRO — E NÃO CAMPO A CAMPO (19/11/2026). Aqui estava um mapa com dez nomes
 * escritos à mão, e um mapa de nomes é a SEGUNDA LISTA do mesmo dado: o dia em que o vocabulário
 * ganhou `complexidade`, ela ficou no ficheiro e não chegou à tela. A pesquisadora classificou o
 * plié, a gravação foi aceite, o commit foi feito — e o campo continuou vazio, porque o bundle
 * nunca o teve. O sintoma lia-se como «não grava», e a causa era esta linha: `Object.assign` do
 * dado primeiro, e só depois os valores por omissão dos campos que os têm.
 *
 * O QUE NÃO ATRAVESSA, e é a única excepção: `escola`. Ela existe no vocabulário (5 termos de
 * `breu`, `calango` e `batata`), e `termos()` conta com ela para não mostrar o termo de uma escola
 * na outra — mas hoje não a recebe, e por isso a composição a trata como catálogo. Honrá-la agora
 * mudaria o que se vê nas escolas de imediato, e um dos termos de escola que existem (o «Plié» da
 * `breu`) está com a definição do «Tandu». Fica declarado como pendência no ESTADO-ATUAL: primeiro
 * corrige-se o dado, depois liga-se o filtro.
 */
const TERMOS = vocabulario.map((t) => {
  const copia = Object.assign({}, t, {
    id: t.id,
    membro: t.membro || '',
    alternativos: t.alternativos || [],
    descricao: t.descricao || '',
    fonte: t.fonte || '',
    observacoes: t.observacoes || '',
    estado: t.estado || 'documentado',
  });
  delete copia.escola;
  return copia;
});

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
const ROTULOS = tradicoes.rotulos || {};

/**
 * O RÓTULO DE UMA TRADIÇÃO — o que a TELA mostra, e não o que o dado guarda (02/11/2026).
 *
 * ELA MUDOU DUAS VEZES NO MESMO DIA, e a segunda é a que vale. Primeiro pediu «padronizar todos
 * os valores exibidos para caixa alta»; depois corrigiu: «Padronizar todas as opções para Title
 * Case, alinhando com a grafia de Escola livre e Cecchetti, mantendo apenas siglas em caixa
 * alta». `RAD` é sigla e fica; `Francesa`, `Vaganova`, `Cubana` e `Compartilhada` levam inicial
 * maiúscula.
 *
 * O MAPA ESTÁ NO DADO (`tradicoes.json` → `rotulos`), e não numa regra de maiúsculas aqui. Uma
 * regra automática não sabe que `RAD` é sigla e `Vaganova` é nome próprio — e o dia em que alguém
 * acrescentar «Cecchetti» à lista de tradições é o dia em que a regra erra. Com o mapa, a mesma
 * fonte serve as quatro telas, e o rótulo de uma tradição nova declara-se onde ela se declara.
 *
 * O QUE NÃO SE FAZ é subir o rótulo ao DADO dos termos: `vocabulario.json` grava `francesa` em
 * 4 termos, e `diferencasDeNomenclatura` tem uma COLUNA por chave (`RAD`, `francesa`, `Vaganova`)
 * — passar o dado a `Francesa` deixaria essas colunas sem ninguém, em silêncio. A chave fica, e o
 * rótulo é derivação.
 *
 * Sem entrada no mapa, devolve-se o valor como veio: é o caso dos métodos livres (`Cecchetti`,
 * `Escola livre`), que não são tradições do ficheiro e já se escrevem como se querem ver.
 */
function rotuloDaTradicao(t) {
  const bruto = String(t == null ? '' : t).trim();
  if (!bruto) return '';
  if (Object.prototype.hasOwnProperty.call(ROTULOS, bruto)) return ROTULOS[bruto];
  const chave = Object.keys(ROTULOS).find((k) => k.toLowerCase() === bruto.toLowerCase());
  return chave ? ROTULOS[chave] : bruto;
}
/** As frases do dicionário, por bloco de notação: `{"[Pé: 1ª → +]": "extensão à frente…"}`. */
const DESCRICOES = descricoes.descricoes || {};

module.exports = {
  MODALIDADE,
  TURMAS, TERMOS, RELACOES, CATEGORIAS, TRADICOES, ROTULOS, DESCRICOES, rotuloDaTradicao,
  // A FORMA DO NÍVEL, por tradição (03/11/2026). Vai inteira porque quem a lê — o formulário da
  // turma e o `normalizarNivel` — precisam da mesma: `tipo`, `graus` e o `rotulo` do nível.
  TRADICOES_JSON: tradicoes,
};
