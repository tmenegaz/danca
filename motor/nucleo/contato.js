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
 *
 * ── O QUE MUDOU A 18/11/2026, SEGUNDA PASSAGEM ────────────────────────────────────────────────
 *
 * «Faltou colocar nesse formulário de entrar em contato o nome da pessoa e da escola. Tem que saber
 * o nome da pessoa e o nome da escola, então obrigatoriamente tem que saber os nomes, o e-mail e o
 * telefone e mensagem para poder enviar.»
 *
 * Os cinco campos passaram a ser OBRIGATÓRIOS, e a regra de antes — «a mensagem e um dos dois
 * contactos» — caiu: quem responde a um pedido tem de saber a quem, de que escola, e por onde. Um
 * pedido anónimo não é um pedido; é um recado que não se pode devolver.
 *
 * E O PEDIDO PASSOU A IR POR E-MAIL, do servidor (ver `comporAviso`). Antes ele abria o programa de
 * correio de quem escrevia e ficava à espera que a pessoa enviasse; ela disse que não é isso que
 * quer — «o formulário é para enviar direto, não vai abrir nada, ele vai enviar».
 */

const { normalizarEmail, normalizarTelefone, normalizarNome } = require('./cadastro-da-escola.js');

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
 * A REGRA DO CONTACTO: **os cinco campos são obrigatórios** — nome, escola, e-mail, telefone e
 * mensagem. Não é zelo de formulário: sem o nome não há a quem responder, sem a escola não se sabe
 * de onde vem o pedido, e sem um canal não há como responder. O que ela pediu, na letra: «tem que
 * saber o nome da pessoa e o nome da escola, então obrigatoriamente tem que saber os nomes, o
 * e-mail e o telefone e mensagem para poder enviar».
 *
 * A VALIDAÇÃO É A DA CASA (`cadastro-da-escola`), e não uma segunda cópia: o e-mail de quem nos
 * procura é o mesmo dado que o e-mail da escola, e duas regras para o mesmo dado divergem no dia em
 * que uma delas muda.
 */
function lerEntrada({ nome, escola, email, telefone, mensagem, quando } = {}) {
  const texto = String(mensagem == null ? '' : mensagem).trim().replace(/[ \t]+/g, ' ');
  if (!texto) return { ok: false, erro: 'escreva a sua mensagem' };
  if (texto.length > MAXIMO_DA_MENSAGEM) {
    return { ok: false, erro: 'a mensagem é longa de mais (máximo ' + MAXIMO_DA_MENSAGEM + ' caracteres)' };
  }

  const n = normalizarNome(nome, { de: 'nome' });
  if (!n.ok) return { ok: false, erro: n.erro };

  const e = normalizarNome(escola, { de: 'nome da escola' });
  if (!e.ok) return { ok: false, erro: e.erro };

  const mail = normalizarEmail(email, { de: 'e-mail' });
  if (!mail.ok) return { ok: false, erro: mail.erro };

  const fone = normalizarTelefone(telefone, { de: 'telefone' });
  if (!fone.ok) return { ok: false, erro: fone.erro };

  return {
    ok: true,
    entrada: {
      /* O CARIMBO É A IDENTIDADE. Dois pedidos da mesma pessoa no mesmo dia são dois pedidos, e
       * uma chave derivada do e-mail os confundiria. O ISO completo cabe na chave e ordena-se
       * sozinho — e é ele que a lista mostra, no fuso da instalação. */
      quando: String(quando || new Date().toISOString()),
      nome: n.valor,
      escola: e.valor,
      email: mail.valor,
      telefone: fone.valor,
      mensagem: texto,
      lido: false,
      /* O DESFECHO DO AVISO POR E-MAIL VAI JUNTO, e é escrito por quem envia. `null` quer dizer
       * «ainda não se sabe» — e não «não foi enviado»: são coisas diferentes, e o painel di-lo
       * assim. Um pedido que chegou ao painel e não saiu por e-mail não é um pedido perdido. */
      aviso: null,
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

/**
 * O AVISO POR E-MAIL — o pedido que sai do servidor, e não da máquina de quem escreve.
 *
 * «O formulário é para enviar direto, não vai abrir nada, ele vai enviar, igual a gente fez a
 * solução quando a secretaria cadastra um novo aluno e escolhe o professor. O e-mail vai direto.»
 *
 * É a MESMA estrada da matrícula da aluna: `correio.enviar` (Resend), do Worker. O programa de
 * correio de quem escreve deixa de entrar no caminho — e deixa de haver o caso em que a pessoa
 * fecha a janela sem enviar e o pedido morre ali.
 *
 * O DESTINO É UM SÓ, e é o da casa: quem responde aos pedidos é a proprietária, e não a escola onde
 * o rodapé estava quando a pessoa clicou. Um pedido feito em `breu.padd.com.br` é dela, não da
 * escola — e é por isso que o aviso não vai para o e-mail da escola.
 *
 * A MENSAGEM DIZ O QUE É PRECISO PARA RESPONDER, e nada mais: quem escreveu, de onde, por onde se
 * responde, e o que escreveu. Sem marketing, sem link de rastreio.
 */
const DESTINO_DO_PEDIDO = 'lastro@padd.com.br';

function comporAviso(entrada, { para } = {}) {
  const e = entrada || {};
  const nome = String(e.nome || '').trim() || '(sem nome)';
  const escola = String(e.escola || '').trim() || '(sem escola)';
  const mensagem = String(e.mensagem || '').trim();

  const linhas = [];
  linhas.push('Pedido de contacto pelo site do Sistema Lastro.');
  linhas.push('');
  linhas.push('Nome:     ' + nome);
  linhas.push('Escola:   ' + escola);
  linhas.push('E-mail:   ' + (e.email || '(não informado)'));
  linhas.push('WhatsApp: ' + (e.telefone || '(não informado)'));
  linhas.push('Quando:   ' + (e.quando || ''));
  linhas.push('');
  linhas.push('Mensagem:');
  linhas.push('');
  linhas.push(mensagem);
  linhas.push('');
  /* O `reply-to` não é um campo do Resend que este sistema use; responder ao e-mail chega ao
   * endereço da casa — e por isso o endereço de quem escreveu vai escrito no corpo, em cima. */
  linhas.push('Para responder, escreva a ' + (e.email || '(sem e-mail)') + '.');
  const texto = linhas.join('\n');

  const escapar = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const html = [
    '<div style="font-family:Georgia,serif;color:#2b2b2b;line-height:1.55;max-width:34rem">',
    '<p style="margin:0 0 16px">Pedido de contacto pelo site do Sistema Lastro.</p>',
    '<table style="border-collapse:collapse;margin:0 0 16px;font-size:15px">',
    '<tr><td style="padding:2px 12px 2px 0;color:#5a5a5a">Nome</td><td><strong>' + escapar(nome) + '</strong></td></tr>',
    '<tr><td style="padding:2px 12px 2px 0;color:#5a5a5a">Escola</td><td>' + escapar(escola) + '</td></tr>',
    '<tr><td style="padding:2px 12px 2px 0;color:#5a5a5a">E-mail</td><td>' + escapar(e.email || '—') + '</td></tr>',
    '<tr><td style="padding:2px 12px 2px 0;color:#5a5a5a">WhatsApp</td><td>' + escapar(e.telefone || '—') + '</td></tr>',
    '<tr><td style="padding:2px 12px 2px 0;color:#5a5a5a">Quando</td><td>' + escapar(e.quando || '—') + '</td></tr>',
    '</table>',
    '<p style="margin:0 0 8px;color:#5a5a5a">Mensagem</p>',
    '<p style="margin:0 0 16px;white-space:pre-wrap">' + escapar(mensagem) + '</p>',
    '<p style="margin:0;color:#5a5a5a">Para responder, escreva a ' + escapar(e.email || '(sem e-mail)') + '.</p>',
    '</div>',
  ].join('');

  return {
    para: (Array.isArray(para) && para.length ? para : [DESTINO_DO_PEDIDO]),
    assunto: 'Fale conosco — ' + nome + ' (' + escola + ')',
    texto,
    html,
  };
}

/**
 * GRAVA O DESFECHO DO AVISO NO PEDIDO — e é pelo carimbo, pela mesma razão que `marcarLido`.
 *
 * PORQUE É QUE ISTO EXISTE: o pedido fica na caixa de entrada mesmo quando o e-mail não sai (sem
 * `RESEND_API_KEY`, provedor fora do ar). Sem o desfecho, o painel mostraria os dois casos iguais —
 * e ela não saberia, ao ver um pedido antigo, se ele chegou à caixa de correio dela ou só ali.
 */
function marcarAviso(lista, quando, aviso) {
  const alvo = String(quando || '').trim();
  if (!alvo) return Array.isArray(lista) ? lista.slice() : [];
  return (Array.isArray(lista) ? lista : []).map((e) => (e && e.quando === alvo
    ? Object.assign({}, e, { aviso: aviso || null })
    : e));
}

module.exports = {
  CHAVE,
  DESTINO_DO_PEDIDO,
  MAXIMO_NA_LISTA,
  MAXIMO_DA_MENSAGEM,
  lerEntrada,
  acrescentar,
  lerLista,
  marcarLido,
  marcarAviso,
  quantosPorLer,
  comporAviso,
};
