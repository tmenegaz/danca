#!/usr/bin/env node
'use strict';

/**
 * provar-contatos-do-site.js — o pedido do «Fale conosco» fica guardado, e ela vê-o no painel
 * (18/11/2026).
 *
 * O PEDIDO, na letra: «quando a pessoa coloca o e-mail dela aqui e o telefone, o que que acontece?
 * Tá salvando isso aonde? […] Eu preciso ter um lugar lá no painel para poder acessar quem me
 * procurou, né? Quem quer falar comigo. E o que que a pessoa quer falar comigo e qual foi a
 * mensagem. Isso precisa existir.»
 *
 * O QUE SE MEDE, e contra QUEM:
 *
 *   1. o `POST /api/contato` do endereço PÚBLICO grava — é de lá que o formulário é usado;
 *   2. a validação recusa o que não serve (sem mensagem, sem contacto, e-mail torto) e diz porquê
 *      — uma recusa muda parece um sistema avariado;
 *   3. a lista guarda o mais novo à FRENTE e respeita o tecto: uma caixa de entrada que cresce
 *      sem fim é um arquivo de dados pessoais que ninguém sabe que tem;
 *   4. `GET /contatos` no painel mostra quem, quando, a mensagem, e o selo «novo»;
 *   5. no endereço PÚBLICO, `/contatos` responde 404 — o painel não se abre a quem chega pelo site,
 *      e é o servidor que o diz (a marca `data-dono` é só a segunda barreira);
 *   6. «Marcar como lido» grava, e a marca é do CARIMBO: um índice passaria a apontar para o
 *      vizinho no dia em que entrasse um pedido novo.
 *
 * O QUE CORRE É O MOTOR (`motor/servidor/raiz.js`), com um KV de memória e um `Request` de
 * verdade. Nada toca no ar: não há rede, não há Cloudflare.
 *
 *   node experimentos/provar-contatos-do-site.js
 */

const path = require('path');

const raiz = path.resolve(__dirname, '..');
const motor = require(path.join(raiz, 'motor/servidor/raiz.js'));
const contato = require(path.join(raiz, 'motor/nucleo/contato.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

function criarKV(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list() { return { keys: [], list_complete: true }; },
  };
}

/* OS DOIS ENDEREÇOS DO MESMO WORKER. `lastro` é o público, `danca` é o painel — e a diferença
 * entre eles é o que a rota usa para decidir o que abre. */
const PUBLICO = 'https://lastro.padd.com.br';
const PAINEL = 'https://danca.padd.com.br';
/* A AUTENTICAÇÃO DO PAINEL é Basic Auth (`autorizado`). O segredo é do env, e é o dela. */
const SENHA_RAIZ = 'segredo-da-raiz';

function ambiente(kv) {
  return {
    PADD_KV: kv,
    SENHA_RAIZ,
    HOST_DONO: 'danca.padd.com.br',
    HOST_PUBLICO: 'lastro.padd.com.br',
    ESCOLA_HABILITADA: 'sim',
  };
}

/* O UTILIZADOR DO BASIC AUTH É O DA CASA (`autorizado`): `tmenegaz`. Um nome inventado aqui
 * daria 401 em todas as asserções do painel, e a prova diria «o painel não abre» sobre um
 * endereço que abre. */
function basic(senha) {
  return 'Basic ' + Buffer.from('tmenegaz:' + senha, 'utf8').toString('base64');
}

async function pedir(env, url, { metodo = 'GET', corpo, senhaDoPainel } = {}) {
  const opcoes = { method: metodo, headers: {} };
  if (corpo !== undefined) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(corpo);
  }
  if (senhaDoPainel) opcoes.headers.Authorization = basic(senhaDoPainel);
  const r = await motor.fetch(new Request(url, opcoes), env);
  const texto = await r.text();
  let dados = null;
  try { dados = JSON.parse(texto); } catch (e) { dados = null; }
  return { status: r.status, texto, dados };
}

const PEDIDO = {
  email: 'pessoa@exemplo.com.br',
  telefone: '(54) 99175-2662',
  mensagem: 'Gostaria de saber como criar uma escola para a minha companhia.',
};

(async () => {
  const kv = criarKV({});
  const env = ambiente(kv);

  console.log('\nA · o público grava o pedido, e a resposta diz que gravou');
  const r1 = await pedir(env, PUBLICO + '/api/contato', { metodo: 'POST', corpo: PEDIDO });
  provar('o POST público responde 201', r1.status === 201, r1.dados);
  provar('…e declara o pedido registado', r1.dados && r1.dados.registado === true, r1.dados);
  const guardado = contato.lerLista(kv.dados.get(contato.CHAVE));
  provar('…e o pedido está no KV, com quem e o quê',
    guardado.length === 1 && guardado[0].email === 'pessoa@exemplo.com.br'
    && /companhia/.test(guardado[0].mensagem), guardado[0] && guardado[0].mensagem);

  console.log('\nB · o que não serve é recusado, e a recusa diz porquê');
  const semMensagem = await pedir(env, PUBLICO + '/api/contato', {
    metodo: 'POST', corpo: { email: 'a@b.com.br', mensagem: '   ' },
  });
  provar('sem mensagem: 400', semMensagem.status === 400, semMensagem.dados);
  provar('…e a frase pede a mensagem', /mensagem/i.test(String(semMensagem.dados && semMensagem.dados.erro)),
    semMensagem.dados && semMensagem.dados.erro);

  const semContacto = await pedir(env, PUBLICO + '/api/contato', {
    metodo: 'POST', corpo: { mensagem: 'Olá, queria falar.' },
  });
  provar('sem e-mail nem telefone: 400', semContacto.status === 400, semContacto.dados);
  provar('…e a frase diz que sem um dos dois não há como responder',
    /e-mail|telefone/.test(String(semContacto.dados && semContacto.dados.erro)),
    semContacto.dados && semContacto.dados.erro);

  const emailTorto = await pedir(env, PUBLICO + '/api/contato', {
    metodo: 'POST', corpo: { email: 'nao-e-email', mensagem: 'Olá.' },
  });
  provar('e-mail sem forma de e-mail: 400', emailTorto.status === 400, emailTorto.dados);
  provar('…e a recusa é a mesma regra do cadastro da escola',
    /@/.test(String(emailTorto.dados && emailTorto.dados.erro)),
    emailTorto.dados && emailTorto.dados.erro);

  const soTelefone = await pedir(env, PUBLICO + '/api/contato', {
    metodo: 'POST', corpo: { telefone: '(54) 99999-0000', mensagem: 'Só telefone, por favor.' },
  });
  provar('só com telefone é aceite — o e-mail não é obrigatório',
    soTelefone.status === 201, soTelefone.dados);

  console.log('\nC · a caixa de entrada: o de agora primeiro, e com tecto');
  const lista = contato.lerLista(kv.dados.get(contato.CHAVE));
  provar('o pedido mais novo está à frente', /Só telefone/.test(lista[0].mensagem),
    lista.map((e) => e.mensagem.slice(0, 20)));
  provar('…e os recusados não entraram na lista', lista.length === 2, lista.length);

  {
    /* O TECTO, medido com a função pura: trezentos pedidos entram, e a lista fica com duzentos. */
    let grande = [];
    for (let i = 0; i < 300; i += 1) {
      const r = contato.lerEntrada({ email: 'a@b.com.br', mensagem: 'pedido ' + i, quando: '2026-11-18T12:00:' + String(i).padStart(2, '0') + '.000Z' });
      grande = contato.acrescentar(grande, r.entrada);
    }
    provar('a lista tem tecto (' + contato.MAXIMO_NA_LISTA + ')',
      grande.length === contato.MAXIMO_NA_LISTA, grande.length);
    provar('…e o que fica é o mais recente', /pedido 299/.test(grande[0].mensagem),
      grande[0].mensagem);
  }

  console.log('\nD · o painel mostra quem, quando e o quê');
  const vazio = await pedir(env, PAINEL + '/contatos', { senhaDoPainel: SENHA_RAIZ });
  provar('com a senha da raiz, a página abre (200)', vazio.status === 200, vazio.status);

  const pagina = await pedir(env, PAINEL + '/contatos', { senhaDoPainel: SENHA_RAIZ });
  provar('a página diz que há pedidos por ler',
    /2 pedidos por ler/.test(pagina.texto), (pagina.texto.match(/\d+ pedidos? por ler/) || [])[0]);
  provar('…e mostra o e-mail de quem escreveu', pagina.texto.indexOf('pessoa@exemplo.com.br') !== -1);
  provar('…e a mensagem', /companhia/.test(pagina.texto));
  provar('…e o selo «novo»', /class="selo alerta">novo</.test(pagina.texto));
  provar('…e um botão para marcar como lido', /data-lido="/.test(pagina.texto));

  console.log('\nE · o painel é do painel: sem senha, e no público, não se abre');
  const semSenha = await pedir(env, PAINEL + '/contatos');
  provar('sem a senha da raiz: 401', semSenha.status === 401, semSenha.status);
  const noPublico = await pedir(env, PUBLICO + '/contatos');
  provar('no endereço público /contatos responde 404 (não 401 — não se anuncia a porta)',
    noPublico.status === 404, noPublico.status);
  const pedidoNoPainel = await pedir(env, PAINEL + '/api/contato', {
    metodo: 'POST', corpo: { email: 'outro@exemplo.com.br', mensagem: 'Pelo painel também.' },
    senhaDoPainel: SENHA_RAIZ,
  });
  provar('o formulário também grava quando usado no painel',
    pedidoNoPainel.status === 201, pedidoNoPainel.dados);

  console.log('\nF · «Marcar como lido» grava, e a marca é do carimbo');
  const antes = contato.lerLista(kv.dados.get(contato.CHAVE));
  const alvo = antes.find((e) => e.email === 'pessoa@exemplo.com.br');
  const lido = await pedir(env, PAINEL + '/api/contatos/lido', {
    metodo: 'POST', corpo: { quando: alvo.quando }, senhaDoPainel: SENHA_RAIZ,
  });
  provar('o POST responde ok', lido.status === 200 && lido.dados && lido.dados.ok === true, lido.dados);
  const depois = contato.lerLista(kv.dados.get(contato.CHAVE));
  provar('…e o pedido marcado é o certo, pelo carimbo',
    depois.find((e) => e.quando === alvo.quando).lido === true, alvo.quando);
  provar('…e os outros ficaram como estavam',
    depois.filter((e) => e.lido === false).length === depois.length - 1,
    depois.map((e) => e.lido));
  const paginaDepois = await pedir(env, PAINEL + '/contatos', { senhaDoPainel: SENHA_RAIZ });
  provar('a página passa a dizer quantos faltam',
    /2 pedidos por ler/.test(paginaDepois.texto), (paginaDepois.texto.match(/\d+ pedidos? por ler/) || [])[0]);

  console.log('\nF2 · o link do WhatsApp do painel não estraga o número');
  {
    /* O DEFEITO, medido antes de existir: a primeira versão tirava um «55» do início dos dígitos
     * — e o DDD 55 existe (Santa Maria e a região). «(55) 99999-0000» virava um número que não
     * é de ninguém. A conta certa pergunta pelo COMPRIMENTO. */
    const kvF2 = criarKV({});
    const envF2 = ambiente(kvF2);
    const pares = [
      ['(54) 99175-2662', '5554991752662'],
      ['(55) 99999-0000', '5555999990000'],
      ['+55 54 99175-2662', '5554991752662'],
    ];
    for (const [escrito, esperado] of pares) {
      await pedir(envF2, PUBLICO + '/api/contato', {
        metodo: 'POST', corpo: { telefone: escrito, mensagem: 'numero ' + escrito },
      });
    }
    const paginaF2 = await pedir(envF2, PAINEL + '/contatos', { senhaDoPainel: SENHA_RAIZ });
    pares.forEach(([escrito, esperado]) => {
      provar(escrito + ' → wa.me/' + esperado,
        paginaF2.texto.indexOf('https://wa.me/' + esperado + '"') !== -1,
        (paginaF2.texto.match(/https:\/\/wa\.me\/\d+/g) || []));
    });
  }

  console.log('\nG · a lista vazia não mente');
  {
    const vazia = await pedir(ambiente(criarKV({})), PAINEL + '/contatos', { senhaDoPainel: SENHA_RAIZ });
    provar('sem pedidos, a página diz que ninguém procurou',
      /Ninguém procurou ainda/.test(vazia.texto));
  }

  console.log('');
  console.log(falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
