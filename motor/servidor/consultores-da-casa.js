'use strict';

/**
 * consultores-da-casa.js — O REGISTO DE CONSULTORES, LIDO E ESCRITO NO KV (25/11/2026).
 *
 * O QUE ELE É, E O QUE ELE NÃO É. A regra — validar, acrescentar, mudar de estado — está em
 * `motor/nucleo/consultores.js`, que é puro. Aqui está só o que precisa do KV: ler a lista,
 * gravar a lista, e dizer quando não há KV. É a mesma divisão do `contato-do-site.js`, e pela
 * mesma razão: uma regra em dois sítios responde duas coisas.
 *
 * PORQUE É UM MÓDULO E NÃO QUATRO LINHAS DENTRO DA ROTA. As três rotas do painel (a lista, a
 * criação e o estado) leem e escrevem a MESMA chave, e a leitura tem uma regra que não pode ser
 * copiada: **um KV que não responde não é uma lista vazia**. Se a leitura falhar e a rota disser
 * «não há consultores», ela mente — e o gesto seguinte (criar) grava por cima de uma lista que
 * existia. É a mesma família do `lerLista(kv, chave, estrito)` que o `bastidores.js` já usa para as
 * câmaras e as turmas.
 *
 * O QUE ELE **NÃO** FAZ: não manda e-mail, não gera token, não fala com o GitHub. Um consultor
 * registado não tem acesso a nada — o acesso dele nasce em F2, e é outro ficheiro.
 */

const consultores = require('../nucleo/consultores.js');
const segredo = require('../nucleo/segredo.js');

const SEM_KV = {
  ok: false,
  erro: 'esta instalação não tem KV — o registo de consultores não pode ser lido nem gravado',
};

/** O KV existe e sabe gravar? A pergunta é feita uma vez, e a resposta é a mesma em todas as rotas. */
function temKv(env) {
  const kv = env && env.PADD_KV;
  return Boolean(kv && typeof kv.get === 'function' && typeof kv.put === 'function');
}

/**
 * LÊ A LISTA. Devolve `{ ok, lista, erro }`.
 *
 * `ok: false` quando o KV não existe ou quando a leitura estourou — e **nunca** com uma lista
 * vazia a fingir de resposta: a diferença entre «não há consultores» e «não consegui ler» é a
 * diferença entre uma decisão e um acidente, e quem escreve a seguir precisa de a saber.
 *
 * A chave que não existe (KV vazio) é `ok: true, lista: []` — isso não é uma falha, é o começo.
 */
async function ler(env) {
  if (!temKv(env)) return Object.assign({}, SEM_KV, { lista: [] });
  let bruto;
  try {
    bruto = await env.PADD_KV.get(consultores.CHAVE);
  } catch (erro) {
    return {
      ok: false,
      lista: [],
      erro: 'não foi possível ler o registo de consultores: ' + ((erro && erro.message) || String(erro)),
    };
  }
  return { ok: true, lista: consultores.lerLista(bruto), vazio: !bruto };
}

/** Grava a lista inteira. Devolve `{ ok, erro }` — e não engole a falha. */
async function gravar(env, lista) {
  if (!temKv(env)) return SEM_KV;
  try {
    await env.PADD_KV.put(consultores.CHAVE, JSON.stringify(Array.isArray(lista) ? lista : []));
    return { ok: true };
  } catch (erro) {
    return {
      ok: false,
      erro: 'não foi possível gravar o registo de consultores: ' + ((erro && erro.message) || String(erro)),
    };
  }
}

/**
 * CRIA UM CONSULTOR — valida, confere o documento repetido, e grava.
 *
 * A ORDEM É A DA CASA: valida primeiro (nada se grava sobre um corpo inválido), confere o
 * documento contra a lista LIDA (e não contra uma lista de memória), e só então escreve. Se a
 * gravação falhar, a resposta diz que não foi gravado — o registo devolvido não deve ser mostrado
 * como existente.
 */
async function criar(env, pedido, quando) {
  const validado = consultores.validarCadastro(pedido);
  if (!validado.ok) return { ok: false, erro: validado.erro, erros: validado.erros, status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const acrescentado = consultores.acrescentar(lido.lista, validado.cadastro, quando);
  if (!acrescentado.ok) return { ok: false, erro: acrescentado.erro, status: 409 };
  const gravado = await gravar(env, acrescentado.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  return {
    ok: true,
    registo: acrescentado.registo,
    /* O QUE SAI DA LISTA DIZ-SE. Um tecto que apaga em silêncio é uma mentira por omissão — e o
     * painel tem de o poder dizer a quem acabou de cadastrar o duzentos e um. */
    retirados: acrescentado.retirados,
    lista: acrescentado.lista,
  };
}

/** Activa ou desactiva. Devolve `{ ok, mudou, registo, lista }`. */
async function mudarEstado(env, { id, ativo, motivo } = {}, quando) {
  const alvo = String(id || '').trim();
  if (!alvo) return { ok: false, erro: 'falta o id do consultor', status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const mudado = consultores.mudarEstado(lido.lista, alvo, ativo, quando, motivo);
  if (!mudado.ok) return { ok: false, erro: mudado.erro, status: 404 };
  /* MUDAR PARA O MESMO ESTADO NÃO GRAVA: um clique duplo não deve encher o histórico de elos que
   * não mudaram nada. E não gravar é a resposta certa, não uma falha. */
  if (!mudado.mudou) return { ok: true, mudou: false, registo: mudado.registo, lista: lido.lista };

  /* ACTIVAR EMITE UM ENDEREÇO NOVO (25/11/2026 — F2). É o gesto que abre a porta, e a porta é uma
   * só: o endereço que ele tinha antes de ser desactivado deixa de valer, porque a fechadura é
   * trocada. Reabrir com a mesma chave seria reabrir a porta que se fechou, com uma chave que pode
   * estar num WhatsApp antigo que ninguém apagou.
   *
   * O TOKEN SÓ EXISTE AQUI, nesta resposta: o KV guarda o hash. É a única vez em que é possível
   * mostrá-lo — e é por isso que a página do painel o mostra num bloco que diz «aparece uma vez só»
   * e tem um «Copiar». */
  let lista = mudado.lista;
  let token = null;
  let registo = mudado.registo;
  if (registo.ativo) {
    token = segredo.novoToken();
    const hash = await segredo.hashDoToken(consultores.AMBITO_DO_ACESSO, token);
    const dado = consultores.darAcesso(lista, alvo, hash, quando);
    if (!dado.ok) return { ok: false, erro: dado.erro, status: dado.status || 400 };
    lista = dado.lista;
    registo = dado.registo;
  }

  const gravado = await gravar(env, lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  return { ok: true, mudou: true, registo, lista, token };
}

/* ══════════════════════════════════════════════════════════════════════════════════════════════
 * F2 — O ENDEREÇO DELE, E AS VISITAS (25/11/2026)
 *
 * A REGRA ESTÁ NO NÚCLEO. Aqui está o que precisa do KV e do `crypto`: gerar o token, derivar o
 * hash, ler e gravar o livro de visitas. Nenhuma decisão sobre «pode ou não pode» é tomada aqui —
 * `consultores.darAcesso` e `consultores.reemitirLink` é que a tomam, e esta camada limita-se a
 * dizer o que aconteceu ao KV.
 * ══════════════════════════════════════════════════════════════════════════════════════════════ */

/**
 * O CONSULTOR QUE ESTE TOKEN DE ACESSO ABRE. Devolve `{ ok, consultor }` — e `consultor: null`
 * quando o token não é de ninguém.
 *
 * A LEITURA É A MESMA LISTA. Não há índice `hash → id`: seriam uma segunda chave e uma segunda
 * escrita por cada emissão, e a lista é uma leitura só — duzentos registos, que é o tecto dela.
 */
async function porToken(env, token) {
  const bruto = String(token || '').trim();
  if (!bruto) return { ok: true, consultor: null };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, consultor: null };
  const hash = await segredo.hashDoToken(consultores.AMBITO_DO_ACESSO, bruto);
  return { ok: true, consultor: consultores.porAcesso(lido.lista, hash), lista: lido.lista };
}

/**
 * EMITE UM ENDEREÇO NOVO PARA UM CONSULTOR ACTIVO — o «Novo endereço» do painel.
 *
 * Não é o mesmo gesto do «Activar»: aquele abre a porta e este troca a fechadura. Os dois emitem, e
 * por isso os dois passam por `darAcesso` e pelo mesmo elo no histórico — mas este exige que ele já
 * esteja activo, e recusa quando não está.
 */
async function novoAcesso(env, { id } = {}, quando) {
  const alvo = String(id || '').trim();
  if (!alvo) return { ok: false, erro: 'falta o id do consultor', status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const token = segredo.novoToken();
  const hash = await segredo.hashDoToken(consultores.AMBITO_DO_ACESSO, token);
  const dado = consultores.darAcesso(lido.lista, alvo, hash, quando);
  if (!dado.ok) return { ok: false, erro: dado.erro, status: dado.inativo ? 409 : (dado.status || 400) };
  const gravado = await gravar(env, dado.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  return { ok: true, token, registo: dado.registo, lista: dado.lista };
}

/** LÊ O LIVRO DE VISITAS de um consultor. `ok: false` quando o KV não responde — nunca `[]` a fingir. */
async function lerVisitas(env, id) {
  if (!temKv(env)) return Object.assign({}, SEM_KV, { visitas: [] });
  const chave = consultores.chaveDasVisitas(id);
  if (!chave) return { ok: false, erro: 'falta o id do consultor', visitas: [] };
  let bruto;
  try {
    bruto = await env.PADD_KV.get(chave);
  } catch (erro) {
    return {
      ok: false,
      visitas: [],
      erro: 'não foi possível ler as visitas deste consultor: ' + ((erro && erro.message) || String(erro)),
    };
  }
  return { ok: true, visitas: consultores.lerVisitas(bruto), vazio: !bruto };
}

async function gravarVisitas(env, id, visitas) {
  if (!temKv(env)) return SEM_KV;
  const chave = consultores.chaveDasVisitas(id);
  if (!chave) return { ok: false, erro: 'falta o id do consultor' };
  try {
    await env.PADD_KV.put(chave, JSON.stringify(Array.isArray(visitas) ? visitas : []));
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: 'não foi possível gravar as visitas: ' + ((erro && erro.message) || String(erro)) };
  }
}

/**
 * CRIA UMA VISITA E DEVOLVE O TOKEN EM CLARO — a única vez que ele existe.
 *
 * A ORDEM É A DA CASA: valida, confere o estado do consultor, gera, guarda, e só então devolve. Se a
 * gravação falhar, o token não é devolvido — um link que abre uma visita que não existe é pior do
 * que um erro, porque ele manda-o à escola.
 */
async function criarVisita(env, id, pedido, quando) {
  const alvo = String(id || '').trim();
  if (!alvo) return { ok: false, erro: 'falta o id do consultor', status: 400 };
  const validado = consultores.validarVisita(pedido);
  if (!validado.ok) return { ok: false, erro: validado.erro, erros: validado.erros, status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const quem = consultores.porId(lido.lista, alvo);
  if (!quem) return { ok: false, erro: 'não há consultor com este id', status: 404 };
  /* A SEGUNDA BARREIRA. A primeira é a página não desenhar o formulário; esta é a que vale, porque
   * quem escrever o pedido à mão não passa pela página. */
  if (!consultores.estaAtivo(quem)) {
    return { ok: false, inativo: true, erro: 'o seu acesso está inactivo — fale com a administração do Sistema Lastro', status: 403 };
  }
  const visitas = await lerVisitas(env, alvo);
  if (!visitas.ok) return { ok: false, erro: visitas.erro, status: 503 };
  const token = segredo.novoToken();
  const hash = await segredo.hashDoToken(consultores.AMBITO_DO_LINK, token);
  const acrescentado = consultores.acrescentarVisita(visitas.visitas, validado.visita, hash, quando);
  if (!acrescentado.ok) return { ok: false, erro: acrescentado.erro, cheio: acrescentado.cheio, status: 409 };
  const gravado = await gravarVisitas(env, alvo, acrescentado.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  return { ok: true, token, visita: acrescentado.visita, lista: acrescentado.lista };
}

/** REEMITE O LINK DE UMA VISITA — o token novo, em claro, uma vez. */
async function reemitirLink(env, id, visitaId, quando) {
  const alvo = String(id || '').trim();
  if (!alvo) return { ok: false, erro: 'falta o id do consultor', status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const quem = consultores.porId(lido.lista, alvo);
  if (!quem) return { ok: false, erro: 'não há consultor com este id', status: 404 };
  if (!consultores.estaAtivo(quem)) {
    return { ok: false, inativo: true, erro: 'o seu acesso está inactivo — fale com a administração do Sistema Lastro', status: 403 };
  }
  const visitas = await lerVisitas(env, alvo);
  if (!visitas.ok) return { ok: false, erro: visitas.erro, status: 503 };
  const token = segredo.novoToken();
  const hash = await segredo.hashDoToken(consultores.AMBITO_DO_LINK, token);
  const reemitido = consultores.reemitirLink(visitas.visitas, visitaId, hash, quando);
  if (!reemitido.ok) return { ok: false, erro: reemitido.erro, gasto: reemitido.gasto, status: reemitido.gasto ? 409 : 404 };
  const gravado = await gravarVisitas(env, alvo, reemitido.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  return { ok: true, token, visita: reemitido.visita, lista: reemitido.lista };
}

module.exports = {
  temKv,
  ler,
  gravar,
  criar,
  mudarEstado,
  /* F2 — o endereço dele e as visitas */
  porToken,
  novoAcesso,
  lerVisitas,
  gravarVisitas,
  criarVisita,
  reemitirLink,
};
