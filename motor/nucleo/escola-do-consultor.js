'use strict';

/**
 * escola-do-consultor.js — A ESCOLA QUE NASCE DE UM LINK (25/11/2026 — F3).
 *
 * PORQUE ISTO É UM MÓDULO E NÃO SEIS LINHAS DENTRO DA ROTA. A criação de escola é a função mais
 * longa e mais cara desta casa: valida, confere identidade única, resolve o slug, procura resíduo de
 * expurgo, cria, dispara o workflow, desfaz se o disparo falhar, grava o cadastro, grava o comercial
 * e manda o correio. Tudo isso é o MESMO nas três portas — painel, página pública e link do
 * consultor —, e duplicá-lo seria a segunda cópia da regra que mais defeitos já deu aqui.
 *
 * O QUE MUDA ENTRE AS PORTAS são três decisões, e são elas que vivem neste ficheiro:
 *
 *   1. **o plano** — no link do consultor é o da consultoria, e NÃO se escolhe;
 *   2. **o pagamento** — no link é dispensado, porque a porta foi autorizada pelo token, e não pela
 *      senha da administração. Sem isso o `validarEscolha` recusaria `consultoria`, e a recusa está
 *      certa: uma escola que pedisse `consultoria` na página pública estaria a pedir um mês grátis
 *      a si mesma;
 *   3. **o mês** — no link começa NA CRIAÇÃO, e não no «Entregar à escola».
 *
 * ESTE MÓDULO É PURO: recebe o corpo, a origem e o consultor, devolve o que a criação tem de fazer.
 * Não lê KV, não cria nada, não sabe o que é um Worker. É por isso que a prova consegue medir a
 * regra sem um Cloudflare à frente — e uma regra que só se mede em produção descobre-se em produção.
 */

const comercial = require('./comercial.js');
const fuso = require('./fuso.js');

/** A porta por onde uma escola nasce. São três, e a terceira é a do consultor. */
const PORTAS = ['painel', 'publico', 'consultor'];

/** O plano que o link do consultor abre — e é o único que ele abre. */
const PLANO_DO_LINK = 'consultoria';

/**
 * O QUE A CRIAÇÃO TEM DE FAZER, DADO O QUE CHEGOU.
 *
 * Devolve `{ ok, corpo, podeDispensar, periodo, atribuicao }`. Quando a porta é `'consultor'` e o
 * consultor não veio (um pedido forjado, ou um erro de programação), recusa-se — e não se degrada
 * para «cria como se fosse o painel»: uma escola em consultoria sem consultor atribuído é
 * exactamente o cliente que existe e não se sabe de onde veio.
 */
function prepararACriacao({ corpo, origem, consultor, agora } = {}) {
  const porta = String(origem || 'painel');
  const agoraIso = String(agora || new Date().toISOString());
  const corpoFinal = Object.assign({}, corpo || {});

  if (porta === 'consultor') {
    if (!consultor || !consultor.id) {
      return {
        ok: false,
        erro: 'a criação por um link de consultoria precisa de saber qual é o consultor — nada foi '
          + 'criado. Se você chegou aqui por um link, peça outro ao consultor.',
      };
    }
    /* O PLANO É SUBSTITUÍDO, e não «validado». Se o corpo trouxesse `basico`, recusar obrigaria a
     * escola a ver um erro por um campo que a página nem mostra; substituir diz a mesma coisa sem
     * uma frase a mais — a página declarou o plano, e o plano é esse. */
    corpoFinal.plano = PLANO_DO_LINK;
    return {
      ok: true,
      porta,
      corpo: corpoFinal,
      podeDispensar: true,
      periodo: {
        entregueEm: agoraIso,
        /* O `fimDeUmMes` é o MESMO que a rota de entrega usa. Um segundo cálculo aqui daria um
         * vencimento a outra hora no dia em que o fuso mudasse — e o defeito só apareceria nas
         * escolas criadas por link. */
        terminaEm: fuso.fimDeUmMes(agoraIso),
        convertidaEm: null,
        prorrogacoes: [],
      },
      atribuicao: {
        id: consultor.id,
        nome: consultor.nome || '',
        praca: consultor.praca || '',
        visitaId: consultor.visitaId || null,
        em: agoraIso,
      },
    };
  }

  /* AS OUTRAS DUAS PORTAS NÃO MUDAM NADA — e é importante que não mudem: a recusa do
   * `validarEscolha` a `consultoria` pela página pública continua palavra por palavra, e há
   * asserção para isso em duas provas diferentes. */
  return {
    ok: true,
    porta,
    corpo: corpoFinal,
    podeDispensar: porta === 'painel',
    periodo: null,
    atribuicao: null,
  };
}

/**
 * O QUE O REGISTO COMERCIAL RECEBE A MAIS por esta porta — e a forma está aqui para o painel e a
 * prova lerem a mesma.
 *
 * O `consultor` fica no registo COMERCIAL, e não no índice: o índice é versionado e o nome do
 * consultor é um dado de pessoa; e «quem trouxe esta escola?» é uma pergunta comercial, que se
 * responde ao lado do plano e do estado sem uma segunda leitura.
 */
function camposComerciais(preparado) {
  const p = preparado || {};
  const extra = {};
  if (p.periodo) extra.periodoDeConsultoria = p.periodo;
  if (p.atribuicao) extra.consultor = p.atribuicao;
  return extra;
}

/**
 * O ESTADO COMERCIAL DE UMA ESCOLA QUE NASCE.
 *
 * `aguardando` é o que a frase dela descreve: «Bateu na minha conta, eu verifico e aí libero o
 * acesso». A excepção é o pagamento dispensado — o ensaio da proprietária e o link do consultor —,
 * que nasce `ativa`: uma escola em consultoria que respondesse «a aguardar liberação» no dia em que
 * o consultor a apresentou seria um mês de demonstração a correr sem ninguém poder usá-lo.
 */
function estadoAoNascer(preparado) {
  const p = preparado || {};
  return p.podeDispensar && p.porta === 'consultor' ? 'ativa'
    : (p.podeDispensar ? 'ativa' : 'aguardando');
}

module.exports = {
  PORTAS,
  PLANO_DO_LINK,
  prepararACriacao,
  camposComerciais,
  estadoAoNascer,
  /* Reexportado para quem precisa da regra do catálogo sem carregar o `comercial` inteiro. */
  validarEscolha: comercial.validarEscolha,
};
