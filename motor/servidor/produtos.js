'use strict';

/**
 * produtos.js — a PONTE entre o catálogo e os produtos (dicionário e syllabus).
 *
 * O QUE É DA PONTE E O QUE É DO NÚCLEO. O núcleo (`motor/nucleo/produtos/`) recebe o dado já lido
 * e devolve o documento: é puro, é determinístico e é o mesmo no Worker e na bancada. Aqui fica o
 * que é de cada sítio: os rótulos do catálogo (as categorias e a tradição), a leitura do
 * repositório para o caminho do Worker, e nada mais.
 *
 * AS ADIÇÕES DA ESCOLA ENTRAM POR PARÂMETRO, E SÓ QUANDO PEDIDAS. O produto que se vende é o do
 * catálogo: `incluirAdicoes` existe para o dia em que a escola quiser a edição dela — e é o
 * manifesto que diz quantos termos vieram de cada camada. Uma leitura que juntasse as duas sem
 * dizer estaria a vender a edição de uma escola como se fosse o catálogo.
 */

const CATALOGO = require('./catalogo-seed.js');
const { lerModalidade, lerProgressao } = require('./verbete.js');
const moduloDicionario = require('../nucleo/produtos/dicionario.js');
const moduloSyllabus = require('../nucleo/produtos/syllabus.js');
const comum = require('../nucleo/produtos/comum.js');

/**
 * A ORDEM DAS CATEGORIAS NUM PRODUTO. É a do dia de aula — solo, barra, centro —, e não a
 * alfabética: quem abre o dicionário procura primeiro o que se faz de pé. As categorias que
 * existirem e não estiverem aqui entram no fim, na ordem do ficheiro.
 */
const ORDEM_DAS_CATEGORIAS = ['passo', 'posicao', 'direcao', 'ligacao', 'salto', 'giro'];

/** O que os dois produtos recebem do catálogo: os rótulos, que são a única coisa que não é dado. */
function rotulosDoCatalogo() {
  return {
    rotulosDeCategoria: CATALOGO.CATEGORIAS,
    ordemDeCategoria: ORDEM_DAS_CATEGORIAS,
    rotuloDaTradicao: CATALOGO.rotuloDaTradicao,
  };
}

function gerarDicionario(entrada) {
  return moduloDicionario.gerar(Object.assign({}, rotulosDoCatalogo(), entrada));
}

function gerarSyllabus(entrada) {
  return moduloSyllabus.gerar(Object.assign({}, rotulosDoCatalogo(), entrada));
}

/**
 * A LEITURA DO CATÁLOGO NO REPOSITÓRIO — para o caminho do Worker (e para o CLI, que também pode
 * querer o que está no `main` e não o que está no disco).
 *
 * DUAS LEITURAS, E É O MÍNIMO: o alfabeto (que traz o vocabulário na mesma passagem, em
 * `lerModalidade`) e a progressão. Não há uma terceira, e não há cópia em KV.
 */
async function lerDoCatalogo({ f, token, dono, repo, ref, modalidade }) {
  const lido = await lerModalidade({ f, token, dono, repo, ref, modalidade });
  if (!lido.ok) return lido;
  const progressao = await lerProgressao({ f, token, dono, repo, ref, modalidade });
  if (!progressao.ok) return progressao;
  return {
    ok: true,
    modalidade,
    alfabeto: lido.dados,
    vocabulario: lido.vocabulario,
    progressao: progressao.dados,
    versaoDoAlfabeto: lido.dados && lido.dados.versao,
  };
}

/**
 * O CATÁLOGO POSTO NA FORMA DE UM PRODUTO — a separação pelo dono de cada termo (02/11/2026).
 *
 * `escola` vazia dá o produto do CATÁLOGO: só os termos sem dono, e as edições das escolas
 * contadas em `deOutras` (para o manifesto poder dizer quantas ficaram de fora, em vez de as
 * perder em silêncio). `escola: '<slug>'` dá a edição daquela escola: o catálogo mais os termos
 * dela, com a dela a vencer — a mesma `compor` que a tela usa.
 */
function prepararCatalogo(vocabulario, escola) {
  const alvo = String(escola || '').trim();
  const separado = comum.separarPorEscola(vocabulario, alvo);
  return {
    vocabulario: separado.catalogo,
    adicoes: separado.adicoes,
    incluirAdicoes: !!alvo,
    escola: alvo || null,
    deOutrasEscolas: separado.deOutras.length,
  };
}

/**
 * Gera um produto a partir do repositório. `tipo` é `dicionario` ou `syllabus`.
 *
 * O `f` é o `fetch` do sítio onde isto corre — no Worker, o de sempre; na bancada, o do teste. É a
 * mesma injecção que `lerModalidade` já usa, e é o que permite medir sem rede.
 */
async function gerarDoRepo({ tipo, f, token, dono, repo, ref, modalidade, opcoes }) {
  const lido = await lerDoCatalogo({ f, token, dono, repo, ref, modalidade });
  if (!lido.ok) return lido;
  const preparado = prepararCatalogo(lido.vocabulario, opcoes && opcoes.escola);
  const base = Object.assign({
    modalidade: lido.modalidade,
    vocabulario: preparado.vocabulario,
    adicoes: preparado.adicoes,
    incluirAdicoes: preparado.incluirAdicoes,
    escola: preparado.escola,
    alfabeto: lido.alfabeto,
    progressao: lido.progressao,
  }, opcoes || {});
  if (tipo === 'dicionario') return gerarDicionario(base);
  if (tipo === 'syllabus') return gerarSyllabus(base);
  return {
    ok: false,
    erro: 'produto desconhecido: «' + String(tipo || '') + '» (use `dicionario` ou `syllabus`)',
  };
}

module.exports = {
  ORDEM_DAS_CATEGORIAS,
  prepararCatalogo,
  rotulosDoCatalogo,
  gerarDicionario,
  gerarSyllabus,
  lerDoCatalogo,
  gerarDoRepo,
};
