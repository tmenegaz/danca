'use strict';

/**
 * contato.js — QUEM QUER FALAR CONOSCO, E O QUE QUER DIZER (18/11/2026).
 *
 * O PEDIDO, na letra: «quando a pessoa coloca o e-mail dela aqui e o telefone, o que que acontece?
 * Tá salvando isso aonde? […] Eu preciso ter um lugar lá [no painel] para poder acessar quem me
 * procurou, né? Quem quer falar comigo. E o que que a pessoa quer falar comigo e qual foi a
 * mensagem. Isso precisa existir.»
 *
 * ANTES NÃO EXISTIA, e não era um esquecimento pequeno: o «Fale conosco» compunha a mensagem e
 * entregava-a ao correio ou ao WhatsApp de quem escrevia. Quem abrisse o programa de correio e
 * fechasse sem enviar não chegava a ninguém, e não havia rasto nenhum — nem de quem tentou. O que
 * ela pediu é o mínimo de um formulário de contacto: **o registo do pedido**, do lado de cá.
 *
 * O QUE ESTE MÓDULO É, E O QUE NÃO É. É a REGRA — validar, carimbar, guardar na lista, ler a
 * lista — e é puro: não fala com o KV, não fala com a rede, não sabe o que é um `Request`. Quem
 * guarda é a ponte (`raiz.js`), que lhe entrega o que já leu. É a mesma divisão do resto do motor,
 * e é o que faz esta regra poder ser medida sem um Worker à frente.
 *
 * O QUE NÃO SE GUARDA: a senha, o consentimento implícito, o IP. Nada disso serve para responder a
 * quem escreveu, e um formulário de contacto não é sítio para recolher o que não se usa.
 *
 * E O QUE SE GUARDA PARA SEMPRE? Nada. A lista tem um tecto (`MAXIMO_NA_LISTA`), e o que sai do
 * tecto sai pelo fim: um pedido de contacto de há dois anos não é proveniência — é uma caixa de
 * entrada, e uma caixa de entrada que cresce sem fim acaba por ser um arquivo de dados pessoais
 * que ninguém lê e que ninguém sabe que tem.
 */

const { normalizarEmail, normalizarTelefone } = require('./cadastro-da-escola.js');

/* A CHAVE É UMA SÓ, e não uma por contacto (18/11/2026).
 *
 * A alternativa era uma chave por pedido (`contatos/<carimbo>.json`) e o `kv.list` para os ler —
 * e o `list` é o que já estourou a cota diária desta casa duas vezes (`PLANO-SHARD.md`,
 * `expurgar-escola.js`). Uma caixa de entrada lida a cada abertura do painel não é sítio para
 * gastar a cota de enumeração: é uma leitura de uma chave, que é o que esta lista é.
 *
 * O PREÇO, declarado: duas submissões no mesmo instante disputam a mesma chave, e a segunda pode
 * escrever por cima da primeira (ler-modificar-gravar). É o MESMO preço que o índice dos envelopes
 * já paga, e a janela é de milissegundos num formulário que uma pessoa preenche à mão. Preferiu-se
 * a cota ao risco teórico de uma corrida que, a acontecer, perde um pedido — e não corrompe nada. */
const CHAVE = 'contatos/entradas';

/* O TECTO DA LISTA. Guardar «para sempre» seria transformar um formulário de contacto num arquivo
 * de dados pessoais com data de validade nenhuma. Duzentos pedidos são muitos meses de um site
 * institucional, e o mais antigo sai quando entra o de duzentos e um. */
const MAXIMO_NA_LISTA = 200;

/** O comprimento máximo de uma mensagem — acima disto não é uma mensagem, é um anexo. */
const MAXIMO_DA_MENSAGEM = 2000;

/**
 * A ENTRADA, validada e carimbada.
 *
 * A REGRA DO CONTACTO: a mensagem é obrigatória, e **um** dos dois — e-mail ou telefone — também.
 * Sem a mensagem não há o que responder; sem um contacto não há a quem. Ter os dois é o caso bom,
 * e não é exigência: quem só tem telefone escreve e deixa o e-mail em branco.
 *
 * A VALIDAÇÃO É A DA CASA (`cadastro-da-escola`), e não uma segunda cópia: o e-mail de quem nos
 * procura é o mesmo dado que o e-mail da escola, e duas regras para o mesmo dado divergem no dia em
 * que uma delas muda.
 */
function lerEntrada({ email, telefone, mensagem, quando } = {}) {
  const texto = String(mensagem == null ? '' : mensagem).trim().replace(/[ \t]+/g, ' ');
  if (!texto) return { ok: false, erro: 'escreva a sua mensagem' };
  if (texto.length > MAXIMO_DA_MENSAGEM) {
    return { ok: false, erro: 'a mensagem é longa de mais (máximo ' + MAXIMO_DA_MENSAGEM + ' caracteres)' };
  }

  let mail = '';
  const brutoEmail = String(email == null ? '' : email).trim();
  if (brutoEmail) {
    const n = normalizarEmail(brutoEmail, { de: 'e-mail' });
    if (!n.ok) return { ok: false, erro: n.erro };
    mail = n.valor;
  }

  let fone = '';
  const brutoFone = String(telefone == null ? '' : telefone).trim();
  if (brutoFone) {
    const n = normalizarTelefone(brutoFone, { de: 'telefone' });
    if (!n.ok) return { ok: false, erro: n.erro };
    fone = n.valor;
  }

  if (!mail && !fone) {
    return { ok: false, erro: 'deixe um e-mail ou um telefone — sem um dos dois não há como responder' };
  }

  return {
    ok: true,
    entrada: {
      /* O CARIMBO É A IDENTIDADE. Dois pedidos da mesma pessoa no mesmo dia são dois pedidos, e
       * uma chave derivada do e-mail os confundiria. O ISO completo cabe na chave e ordena-se
       * sozinho — e é ele que a lista mostra, no fuso da instalação. */
      quando: String(quando || new Date().toISOString()),
      email: mail || null,
      telefone: fone || null,
      mensagem: texto,
      lido: false,
    },
  };
}

/**
 * ACRESCENTA À LISTA — o mais novo à frente, e o tecto respeitado.
 *
 * Devolve uma lista NOVA: quem chama não perde a que tinha se a escrita falhar. A ordem é a da
 * caixa de entrada (o de agora primeiro), e não a do arquivo.
 */
function acrescentar(lista, entrada) {
  const antes = Array.isArray(lista) ? lista.filter((e) => e && e.quando && e.mensagem) : [];
  return [entrada].concat(antes).slice(0, MAXIMO_NA_LISTA);
}

/** A leitura tolerante do que veio do KV — um valor estragado é uma caixa vazia, não uma excepção. */
function lerLista(bruto) {
  if (!bruto) return [];
  try {
    const dados = typeof bruto === 'string' ? JSON.parse(bruto) : bruto;
    return Array.isArray(dados) ? dados.filter((e) => e && e.quando && e.mensagem) : [];
  } catch (erro) {
    return [];
  }
}

/**
 * MARCA UM PEDIDO COMO LIDO — e a marca é do CARIMBO, não da posição.
 *
 * A posição muda quando entra um pedido novo, e uma marca por índice passaria a apontar para o
 * vizinho — o defeito clássico de uma lista que se lê por ordem. O carimbo (`quando`) nasce único
 * na prática, e é o que a página tem à mão.
 */
function marcarLido(lista, quando) {
  const alvo = String(quando || '').trim();
  if (!alvo) return Array.isArray(lista) ? lista.slice() : [];
  return (Array.isArray(lista) ? lista : []).map((e) => (e && e.quando === alvo
    ? Object.assign({}, e, { lido: true })
    : e));
}

/** Quantos ainda não foram lidos — o número do selo no botão do painel. */
function quantosPorLer(lista) {
  return (Array.isArray(lista) ? lista : []).filter((e) => e && !e.lido).length;
}

module.exports = {
  CHAVE,
  MAXIMO_NA_LISTA,
  MAXIMO_DA_MENSAGEM,
  lerEntrada,
  acrescentar,
  lerLista,
  marcarLido,
  quantosPorLer,
};
