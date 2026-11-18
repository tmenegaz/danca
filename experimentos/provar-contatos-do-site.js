#!/usr/bin/env node
'use strict';

/**
 * provar-contatos-do-site.js — o pedido do «Fale conosco» é gravado, ENVIADO, e ela vê-o no painel
 * (18/11/2026, segunda passagem).
 *
 * O PEDIDO, na letra, são três frases que se mediram em separado:
 *
 *   1. «quando a pessoa coloca o e-mail dela aqui e o telefone, o que que acontece? Tá salvando isso
 *      aonde? […] Eu preciso ter um lugar lá no painel para poder acessar quem me procurou»;
 *   2. «o formulário é para enviar direto, não vai abrir nada, ele vai enviar» — o aviso por e-mail
 *      sai do servidor;
 *   3. «faltou colocar nesse formulário o nome da pessoa e da escola […] mais duas colunas nos
 *      contatos» e «um sininho […] sinalizando para mim que chegou uma mensagem».
 *
 * O QUE SE MEDE, e contra quem:
 *
 *   A. o `POST /api/contato` grava os CINCO campos, e o aviso por e-mail SAI — com o nome, a
 *      escola, o e-mail, o telefone e a mensagem no corpo;
 *   A2. o desfecho do aviso fica gravado NO PEDIDO, para o painel poder distinguir os dois casos;
 *   B. cada campo em falta é recusado com a sua própria frase;
 *   C. a lista guarda o mais novo à frente e respeita o tecto;
 *   D. `GET /contatos` mostra o nome, a escola, a mensagem, o aviso e o selo «novo»;
 *   E. o painel é do painel: sem senha, 401; no endereço público, 404;
 *   F. `GET /api/contatos/quantos` é o sininho, e conta o que a página mostra;
 *   G. O WORKER DA ESCOLA SERVE A MESMA ROTA, e grava na MESMA chave — é isso que faz «toda escola
 *      já nascer com isso» ser verdade, e não uma promessa.
 *
 * O QUE CORRE É O MOTOR (`motor/servidor/raiz.js` e `motor/servidor/producao.js`), com um KV de
 * memória e um `Request` de verdade. Nada toca no ar: a única coisa substituída é o `fetch` do
 * provedor de correio, e o que se mede é o corpo que ele receberia.
 *
 *   node experimentos/provar-contatos-do-site.js
 */

const path = require('path');

const raiz = path.resolve(__dirname, '..');
const motor = require(path.join(raiz, 'motor/servidor/raiz.js'));
const producao = require(path.join(raiz, 'motor/servidor/producao.js'));
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

/* OS DOIS ENDEREÇOS DO MESMO WORKER. `lastro` é o público, `danca` é o painel — e a diferença entre
 * eles é o que a rota usa para decidir o que abre. */
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
    /* O CORREIO. Sem token, `correio.enviar` compõe e NÃO envia — e a prova mediria o caminho do
     * erro. O token aqui é falso porque quem o recebe é o `fetch` substituído. */
    RESEND_API_KEY: 're_de_teste',
    CORREIO_DE: 'Sistema Lastro <lastro@padd.com.br>',
  };
}

/* O UTILIZADOR DO BASIC AUTH É O DA CASA (`autorizado`): `tmenegaz`. Um nome inventado aqui daria
 * 401 em todas as asserções do painel, e a prova diria «o painel não abre» sobre um endereço que
 * abre. */
function basic(senha) {
  return 'Basic ' + Buffer.from('tmenegaz:' + senha, 'utf8').toString('base64');
}

/**
 * O PROVEDOR, SUBSTITUÍDO — e RESTAURADO.
 *
 * `correio.enviar` chama o `fetch` global. Aqui ele é trocado por um que regista o corpo e responde
 * 200, e o original volta no `finally`. Sem isto, cada execução desta prova faria uma chamada real
 * ao Resend com um token falso — e a cota é escassa mesmo a falhar.
 */
async function comCorreio(acao) {
  const original = globalThis.fetch;
  const enviados = [];
  globalThis.fetch = async (url, opcoes) => {
    enviados.push({ url: String(url), corpo: JSON.parse(String((opcoes && opcoes.body) || '{}')) });
    return { ok: true, status: 200, json: async () => ({ id: 'de-teste' }) };
  };
  try {
    return await acao(enviados);
  } finally {
    globalThis.fetch = original;
  }
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
  nome: 'Ana Souza',
  escola: 'Studio Vila Nova',
  email: 'pessoa@exemplo.com.br',
  telefone: '(54) 99175-2662',
  mensagem: 'Gostaria de saber como criar uma escola para a minha companhia.',
};

(async () => {
  const kv = criarKV({});
  const env = ambiente(kv);

  console.log('\nA · o público grava o pedido, e o aviso por e-mail SAI');
  await comCorreio(async (enviados) => {
    const r1 = await pedir(env, PUBLICO + '/api/contato', { metodo: 'POST', corpo: PEDIDO });
    provar('o POST público responde 201', r1.status === 201, r1.dados);
    provar('…e declara o pedido registado', r1.dados && r1.dados.registado === true, r1.dados);
    provar('…e que o aviso por e-mail saiu', r1.dados && r1.dados.enviado === true, r1.dados);

    const guardado = contato.lerLista(kv.dados.get(contato.CHAVE));
    provar('o pedido está no KV com os CINCO campos',
      guardado.length === 1
      && guardado[0].nome === 'Ana Souza'
      && guardado[0].escola === 'Studio Vila Nova'
      && guardado[0].email === 'pessoa@exemplo.com.br'
      && /99175/.test(String(guardado[0].telefone))
      && /companhia/.test(guardado[0].mensagem),
      guardado[0]);

    /* O AVISO VAI PARA A CASA, e não para a escola onde o rodapé estava: o pedido é dela. */
    provar('um aviso, um e-mail', enviados.length === 1, enviados.length);
    const carta = enviados[0] || {};
    provar('…para o provedor do correio', /api\.resend\.com/.test(carta.url), carta.url);
    provar('…a lastro@padd.com.br', (carta.corpo.to || []).indexOf('lastro@padd.com.br') !== -1,
      carta.corpo.to);
    provar('…com o nome e a escola no assunto',
      /Ana Souza/.test(String(carta.corpo.subject)) && /Studio Vila Nova/.test(String(carta.corpo.subject)),
      carta.corpo.subject);
    provar('…e o corpo leva nome, escola, e-mail, telefone e mensagem',
      /Ana Souza/.test(String(carta.corpo.text))
      && /Studio Vila Nova/.test(String(carta.corpo.text))
      && /pessoa@exemplo\.com\.br/.test(String(carta.corpo.text))
      && /99175/.test(String(carta.corpo.text))
      && /companhia/.test(String(carta.corpo.text)),
      String(carta.corpo.text).slice(0, 160));
    provar('…e a versão HTML diz o mesmo (um e-mail, uma mensagem)',
      /Ana Souza/.test(String(carta.corpo.html)) && /companhia/.test(String(carta.corpo.html)));
  });

  console.log('\nA2 · o desfecho do aviso fica gravado no pedido');
  {
    /* SEM TOKEN, o aviso não sai — e o pedido tem de continuar na lista, com o motivo ao lado. É o
     * que separa «chegou-me à caixa de correio» de «está no painel e mais nada». */
    const kvSemToken = criarKV({});
    const semToken = await pedir(ambiente({ ...kvSemToken }) && Object.assign(ambiente(kvSemToken), { RESEND_API_KEY: '' }),
      PUBLICO + '/api/contato', { metodo: 'POST', corpo: PEDIDO });
    provar('sem RESEND_API_KEY, o POST responde 201 (o pedido ficou)',
      semToken.status === 201, semToken.dados);
    provar('…e diz que o aviso NÃO saiu', semToken.dados && semToken.dados.enviado === false, semToken.dados);
    provar('…e aponta o que falta, para quem instala corrigir',
      /RESEND_API_KEY/.test(String(semToken.dados && semToken.dados.dica)),
      semToken.dados && semToken.dados.dica);
    const lista = contato.lerLista(kvSemToken.dados.get(contato.CHAVE));
    provar('…e o pedido ficou gravado com o desfecho ao lado',
      lista.length === 1 && lista[0].aviso && lista[0].aviso.enviado === false
      && /RESEND_API_KEY/.test(String(lista[0].aviso.motivo)),
      lista[0] && lista[0].aviso);
  }

  console.log('\nB · o que não serve é recusado, e a recusa diz porquê');
  {
    const casos = [
      ['nome', { ...PEDIDO, nome: '  ' }, /nome/i],
      ['escola', { ...PEDIDO, escola: '' }, /escola/i],
      ['e-mail', { ...PEDIDO, email: 'nao-e-email' }, /@/],
      ['telefone', { ...PEDIDO, telefone: '123' }, /telefone/i],
      ['mensagem', { ...PEDIDO, mensagem: '   ' }, /mensagem/i],
    ];
    for (const [campo, corpo, esperado] of casos) {
      const r = await pedir(env, PUBLICO + '/api/contato', { metodo: 'POST', corpo });
      provar('sem ' + campo + ': 400', r.status === 400, r.dados);
      provar('…e a frase nomeia o campo', esperado.test(String(r.dados && r.dados.erro)),
        r.dados && r.dados.erro);
    }
    const restou = contato.lerLista(kv.dados.get(contato.CHAVE));
    provar('…e nenhum dos recusados entrou na lista', restou.length === 1, restou.length);
  }

  console.log('\nC · a caixa de entrada: o de agora primeiro, e com tecto');
  await comCorreio(async () => {
    const segundo = await pedir(env, PUBLICO + '/api/contato', {
      metodo: 'POST',
      corpo: { ...PEDIDO, nome: 'Bruno Lima', escola: 'Escola do Sul', mensagem: 'Segundo pedido.' },
    });
    provar('o segundo pedido é aceite', segundo.status === 201, segundo.dados);
  });
  {
    const lista = contato.lerLista(kv.dados.get(contato.CHAVE));
    provar('o pedido mais novo está à frente', /Segundo pedido/.test(lista[0].mensagem),
      lista.map((e) => e.mensagem.slice(0, 20)));
    provar('…e há dois na lista', lista.length === 2, lista.length);

    /* O TECTO, medido com a função pura: trezentos pedidos entram, e a lista fica com duzentos. */
    let grande = [];
    for (let i = 0; i < 300; i += 1) {
      const r = contato.lerEntrada({ ...PEDIDO, mensagem: 'pedido ' + i,
        quando: '2026-11-18T12:00:' + String(i % 60).padStart(2, '0') + '.000Z' });
      grande = contato.acrescentar(grande, r.entrada);
    }
    provar('a lista tem tecto (' + contato.MAXIMO_NA_LISTA + ')',
      grande.length === contato.MAXIMO_NA_LISTA, grande.length);
  }

  console.log('\nD · o painel mostra QUEM, de QUE ESCOLA, o quê — e o aviso');
  {
    const pagina = await pedir(env, PAINEL + '/contatos', { senhaDoPainel: SENHA_RAIZ });
    provar('com a senha da raiz, a página abre (200)', pagina.status === 200, pagina.status);
    provar('a página diz que há pedidos por ler',
      /2 pedidos por ler/.test(pagina.texto), (pagina.texto.match(/\d+ pedidos? por ler/) || [])[0]);
    /* AS DUAS COLUNAS NOVAS — «tem que colocar também aqui mais duas colunas nos contatos». */
    provar('…e tem a coluna do nome', /<th>Nome<\/th>/.test(pagina.texto));
    provar('…e a da escola', /<th>Escola<\/th>/.test(pagina.texto));
    provar('…e mostra o nome de quem escreveu', /Ana Souza/.test(pagina.texto));
    provar('…e a escola', /Studio Vila Nova/.test(pagina.texto));
    provar('…e o e-mail', pagina.texto.indexOf('pessoa@exemplo.com.br') !== -1);
    provar('…e a mensagem', /companhia/.test(pagina.texto));
    /* O AVISO POR E-MAIL, LINHA A LINHA — a pergunta dela: «chega a passar pelo e-mail ou não?» */
    provar('…e diz que o aviso por e-mail saiu', /class="selo ok">enviado</.test(pagina.texto));
    provar('…e o selo «novo»', /class="selo alerta">novo</.test(pagina.texto));
    provar('…e um botão para marcar como lido', /data-lido="/.test(pagina.texto));
  }

  console.log('\nE · o painel é do painel: sem senha, e no público, não se abre');
  {
    const semSenha = await pedir(env, PAINEL + '/contatos');
    provar('sem a senha da raiz: 401', semSenha.status === 401, semSenha.status);
    const noPublico = await pedir(env, PUBLICO + '/contatos');
    provar('no endereço público /contatos responde 404 (não 401 — não se anuncia a porta)',
      noPublico.status === 404, noPublico.status);
    const pedidoNoPainel = await comCorreio(async () => pedir(env, PAINEL + '/api/contato', {
      metodo: 'POST', corpo: { ...PEDIDO, mensagem: 'Pelo painel também.' }, senhaDoPainel: SENHA_RAIZ,
    }));
    provar('o formulário também grava quando usado no painel', pedidoNoPainel.status === 201,
      pedidoNoPainel.dados);
  }

  console.log('\nF · o sininho conta o que a página mostra');
  {
    const antes = await pedir(env, PAINEL + '/api/contatos/quantos', { senhaDoPainel: SENHA_RAIZ });
    /* `|| {}` E NÃO `antes.dados.porLer`: uma rota que não exista devolve texto, `dados` é nulo, e a
     * prova EXPLODIRIA na leitura — uma prova que rebenta não conta o que se perdeu, e o defeito
     * que ela existe para apanhar é precisamente «a rota não existe». */
    const ditoAntes = antes.dados || {};
    provar('a rota responde', antes.status === 200 && ditoAntes.ok === true, antes.dados);
    const lista = contato.lerLista(kv.dados.get(contato.CHAVE));
    provar('…e o número é o dos pedidos por ler',
      ditoAntes.porLer === contato.quantosPorLer(lista), { dito: ditoAntes.porLer, lista: lista.length });
    provar('…e há o que contar', ditoAntes.porLer === 3, ditoAntes.porLer);

    const alvo = lista.find((e) => e.email === 'pessoa@exemplo.com.br');
    const lido = await pedir(env, PAINEL + '/api/contatos/lido', {
      metodo: 'POST', corpo: { quando: alvo.quando }, senhaDoPainel: SENHA_RAIZ,
    });
    provar('«marcar como lido» responde ok',
      lido.status === 200 && lido.dados && lido.dados.ok === true, lido.dados);
    const depois = contato.lerLista(kv.dados.get(contato.CHAVE));
    provar('…e a marca é do CARIMBO: o pedido certo é o que ficou lido',
      depois.find((e) => e.quando === alvo.quando).lido === true, alvo.quando);
    provar('…e os outros ficaram como estavam',
      depois.filter((e) => e.lido === false).length === depois.length - 1,
      depois.map((e) => e.lido));

    const quantos = await pedir(env, PAINEL + '/api/contatos/quantos', { senhaDoPainel: SENHA_RAIZ });
    provar('o sininho desce quando um pedido é marcado',
      (quantos.dados || {}).porLer === 2, quantos.dados);
  }

  console.log('\nG · a escola serve a MESMA rota, e grava na MESMA chave');
  {
    /* «ISSO VAI PARA O MOTOR, PORQUE AÍ TODA A ESCOLA JÁ NASCE COM ISSO.» A promessa só é verdade
     * se o Worker da escola souber responder — senão o rodapé existia lá e o botão dava 404. */
    const kvDaEscola = criarKV({});
    const envDaEscola = {
      ESCOLA_SLUG: 'breu',
      ESCOLA_HABILITADA: 'sim',
      PADD_KV: kvDaEscola,
      RESEND_API_KEY: 're_de_teste',
      CORREIO_DE: 'Sistema Lastro <lastro@padd.com.br>',
      ASSETS: { fetch: async () => new Response('ausente', { status: 404 }) },
    };
    const r = await comCorreio(async (enviados) => {
      const resposta = await producao.fetch(new Request('https://breu.padd.com.br/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...PEDIDO, mensagem: 'Escrevi do site da escola.' }),
      }), envDaEscola);
      const corpo = await resposta.json().catch(() => null);
      return { status: resposta.status, dados: corpo, enviados };
    });
    provar('o Worker da escola responde 201', r.status === 201, r.dados);
    provar('…e declara o pedido registado', r.dados && r.dados.registado === true, r.dados);
    provar('…e manda o aviso por e-mail', r.dados && r.dados.enviado === true, r.dados);
    const carta = (r.enviados[0] || {}).corpo || {};
    provar('…para a casa, e não para a escola',
      (carta.to || []).indexOf('lastro@padd.com.br') !== -1, carta.to);
    const naEscola = contato.lerLista(kvDaEscola.dados.get(contato.CHAVE));
    provar('…e o pedido está na MESMA chave que o painel lê',
      naEscola.length === 1 && /site da escola/.test(naEscola[0].mensagem), naEscola.length);
    /* A rota responde antes das travas da escola — é isso que faz o canal existir também na escola
     * suspensa, que é justamente onde alguém precisa de falar com a casa. */
    const suspensa = await comCorreio(async () => producao.fetch(
      new Request('https://breu.padd.com.br/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(PEDIDO),
      }),
      Object.assign({}, envDaEscola, { ESCOLA_HABILITADA: 'nao', PADD_KV: criarKV({}) })));
    provar('com a escola desabilitada, o canal continua aberto',
      suspensa.status === 201, suspensa.status);
  }

  console.log('\nH · a lista vazia não mente');
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
