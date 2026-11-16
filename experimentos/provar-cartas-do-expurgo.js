#!/usr/bin/env node
'use strict';

/*
 * provar-cartas-do-expurgo.js — quando uma escola é expurgada, saem DUAS cartas (16/11/2026).
 *
 * O QUE ELA PEDIU, ao pé da letra: «quando eu expurgar uma escola, tem que disparar um e-mail para
 * mim no lastro@padd.com.br e outro para o professor e para a escola, que são os e-mails
 * cadastrados, do professor principal e da escola. Também avisando que a escola foi removida
 * completamente do sistema, que ela foi expurgada do sistema. E que, no caso da escola e do
 * professor, reforce o convite de que ele é bem-vindo para retornar ao uso do sistema quando
 * quiser e seja gentil.»
 *
 * O QUE ESTA PROVA MEDE, e por que é preciso medir:
 *
 *   A. AS DUAS CARTAS, E PARA QUEM. A da escola+professor vai para os DOIS endereços do cadastro,
 *      e é UMA só quando são o mesmo (a dedução é do núcleo, e é a mesma da criação). A da
 *      administração vai para o endereço do proprietário.
 *   B. O QUE ELAS DIZEM. Que a remoção é completa, quando aconteceu, quantos arquivos saíram, e —
 *      na da escola — o convite de volta, em tom de despedida. Sem promessa de prazo (não há), e
 *      SEM LINK (um link de recriação é um segredo que vale uma vez; mandá-lo a uma caixa que
 *      talvez já não seja de quem decide seria oferecer a escola a quem abrisse o e-mail).
 *   C. O QUE NÃO SAI. Sem endereço no cadastro, a carta da escola não sai — e o desfecho DIZ isso
 *      («não havia e-mail»), em vez de fingir que saiu. Sem a chave do provedor, a mensagem fica na
 *      caixa de saída e o desfecho diz porquê. Um sistema que diz «enviado» sem ter enviado gasta a
 *      confiança no dia em que alguém procura a mensagem e não a encontra.
 *
 *   node experimentos/provar-cartas-do-expurgo.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));

let ok = 0;
let ko = 0;
function conferir(titulo, condicao, dado) {
  if (condicao) { ok += 1; console.log('  ok    ' + titulo); return; }
  ko += 1;
  console.log('  FALHA ' + titulo + (dado === undefined ? '' : '  → ' + JSON.stringify(dado)));
}

/** Um KV de mentira, com o get/put que a caixa de saída usa. */
function kvCom(dados) {
  const mapa = new Map(Object.entries(dados || {}));
  return {
    dados: mapa,
    async get(k) { return mapa.has(k) ? mapa.get(k) : null; },
    async put(k, v) { mapa.set(k, String(v)); },
    async delete(k) { mapa.delete(k); },
  };
}

/** O provedor de correio, falso: apanha as cartas e devolve o id como o Resend faria. */
function correioFalso({ falhar = false } = {}) {
  const cartas = [];
  const fetch = async (url, init) => {
    cartas.push(JSON.parse((init && init.body) || '{}'));
    if (falhar) {
      return {
        ok: false, status: 422,
        json: async () => ({ message: 'domínio não verificado' }),
        text: async () => JSON.stringify({ message: 'domínio não verificado' }),
      };
    }
    return { ok: true, status: 200, json: async () => ({ id: 'c-' + cartas.length }), text: async () => '' };
  };
  return { cartas, fetch };
}

(async () => {
  const QUANDO = '2026-11-16T15:44:22.236Z';

  console.log('\nA. As duas cartas, e para quem');
  {
    const cf = correioFalso();
    globalThis.fetch = cf.fetch;
    let r;
    try {
      r = await raiz.avisarDoExpurgo({
        env: { RESEND_API_KEY: 're-de-mentira', PADD_KV: kvCom({}) },
        escola: 'duo',
        nome: 'Duo',
        quando: QUANDO,
        professor: 'Fernando Franciose',
        contactos: ['escola@exemplo.test', 'professor@exemplo.test'],
        apagados: 16,
        kv: { ok: true },
        proveniencia: { impressao: '76eb88068ca477e1ebd9d4d434816419' },
        motivo: 'expurgada pela página «Sistema Lastro»',
      });
    } finally { delete globalThis.fetch; }

    conferir('saem DUAS cartas — uma para a escola e o professor, outra para a administração',
      cf.cartas.length === 2, cf.cartas.map((c) => c.subject));
    const daEscola = cf.cartas.find((c) => c.to.indexOf('escola@exemplo.test') !== -1);
    const doProprietario = cf.cartas.find((c) => c.to.length === 1 && c.to[0] === 'lastro@padd.com.br');
    conferir('…a da escola vai para os DOIS endereços do cadastro',
      Boolean(daEscola) && daEscola.to.length === 2
        && daEscola.to.indexOf('professor@exemplo.test') !== -1, daEscola && daEscola.to);
    conferir('…e a da administração vai para o endereço do proprietário',
      Boolean(doProprietario), cf.cartas.map((c) => c.to));
    conferir('…e o relatório diz o desfecho das duas',
      r.paraAEscola && r.paraAEscola.enviado === true
        && r.aoProprietario && r.aoProprietario.enviado === true, r);
  }

  console.log('\nB. O que as cartas dizem');
  {
    const cf = correioFalso();
    globalThis.fetch = cf.fetch;
    try {
      await raiz.avisarDoExpurgo({
        env: { RESEND_API_KEY: 're-de-mentira', PADD_KV: kvCom({}) },
        escola: 'duo', nome: 'Duo', quando: QUANDO,
        professor: 'Fernando Franciose',
        contactos: ['escola@exemplo.test', 'professor@exemplo.test'],
        apagados: 16, kv: { ok: true },
        proveniencia: { impressao: '76eb88068ca477e1ebd9d4d434816419' },
        motivo: 'expurgada pela página «Sistema Lastro»',
      });
    } finally { delete globalThis.fetch; }

    const daEscola = cf.cartas.find((c) => c.to.indexOf('escola@exemplo.test') !== -1) || {};
    const doProprietario = cf.cartas.find((c) => c.to[0] === 'lastro@padd.com.br') || {};
    const texto = String(daEscola.text || '');

    conferir('a da escola diz que a remoção é COMPLETA',
      /removida do Sistema Lastro/.test(texto) && /A remoção é completa/.test(texto), texto.slice(0, 200));
    conferir('…diz QUANDO, no fuso de quem lê',
      /16\/11\/2026 às \d\d:\d\d/.test(texto), texto.split('\n')[2]);
    conferir('…diz QUANTOS arquivos saíram', /16 arquivos/.test(texto), null);
    conferir('…e nomeia a escola, para quem a recebe saber qual fechou',
      /«Duo»/.test(texto), null);
    conferir('…e convida a voltar, em tom de despedida — a porta continua aberta',
      /porta continua aberta/i.test(texto) && /lastro@padd\.com\.br/.test(texto)
        && /escreva para/.test(texto), texto.slice(-600));
    conferir('…e agradece o tempo, sem falar em prazo (não há prazo para voltar)',
      /prazer|Obrigado/i.test(texto) && !/dias para voltar/i.test(texto), null);
    /* SEM LINK: o convite de recriação é um segredo de uso único. */
    conferir('…e NÃO leva link de recriação — o convite é pedido, não oferecido na caixa',
      !/\/recriar\//.test(texto) && !/\?token=/.test(texto), null);

    const doDono = String(doProprietario.text || '');
    conferir('a da administração tem o assunto fixo, com a escola dentro',
      String(doProprietario.subject) === 'A escola «Duo» foi expurgada do Sistema Lastro',
      doProprietario.subject);
    conferir('…e o corpo diz o quê, quando, quanto e o motivo',
      /16\/11\/2026/.test(doDono) && /16 removidos/.test(doDono) && /Motivo:/.test(doDono), doDono);
    conferir('…e o desfecho do KV, que é a metade que pode falhar em silêncio',
      /KV:\s+limpo/.test(doDono), doDono.split('\n').slice(4, 11).join(' | '));
    conferir('…e lembra que a memória fica, e que «Recriar» a traz de volta',
      /proveniência/i.test(doDono) && /Recriar/.test(doDono), null);
  }

  console.log('\nC. O que não sai — e o desfecho que o diz');
  {
    /* 1. SEM ENDEREÇO. Uma escola sem cadastro de e-mail não recebe nada — e o relatório diz o
     * motivo, em vez de dar a carta por enviada. */
    const cf = correioFalso();
    globalThis.fetch = cf.fetch;
    let semContato;
    try {
      semContato = await raiz.avisarDoExpurgo({
        env: { RESEND_API_KEY: 're-de-mentira', PADD_KV: kvCom({}) },
        escola: 'velha', nome: 'Velha', quando: QUANDO, professor: null,
        contactos: [], apagados: 3, kv: { ok: true }, proveniencia: null,
        motivo: 'expurgada pela raiz',
      });
    } finally { delete globalThis.fetch; }
    conferir('sem e-mail no cadastro, a carta da escola NÃO sai',
      cf.cartas.length === 1, cf.cartas.map((c) => c.to));
    conferir('…e o desfecho diz porquê, em vez de dar a carta por enviada',
      semContato.paraAEscola.enviado === false
        && /não tinha e-mail/i.test(String(semContato.paraAEscola.motivo)), semContato.paraAEscola);
    conferir('…mas a da administração sai de qualquer maneira',
      semContato.aoProprietario.enviado === true, semContato.aoProprietario);

    /* 2. SEM A CHAVE DO PROVEDOR. A mensagem fica na caixa de saída do tenant, e o desfecho diz
     * que não saiu. É a mesma regra das boas-vindas: nada diz «enviado» sem ter saído. */
    const semChave = kvCom({});
    const cf2 = correioFalso();
    let desfecho;
    globalThis.fetch = cf2.fetch;
    try {
      desfecho = await raiz.avisarDoExpurgo({
        env: { PADD_KV: semChave }, escola: 'duo', nome: 'Duo', quando: QUANDO,
        professor: 'Fernando Franciose', contactos: ['escola@exemplo.test'],
        apagados: 1, kv: { ok: true }, proveniencia: null, motivo: 'x',
      });
    } finally { delete globalThis.fetch; }
    conferir('sem RESEND_API_KEY, nada é dado por enviado',
      desfecho.paraAEscola.enviado === false && desfecho.aoProprietario.enviado === false, desfecho);
    conferir('…o provedor nem é chamado', cf2.cartas.length === 0, cf2.cartas.length);
    const guardadas = [...semChave.dados.keys()].filter((k) => k.indexOf('caixa') !== -1
      || k.indexOf('correio') !== -1);
    conferir('…e as duas mensagens ficam na caixa de saída, para não se perder o que se ia dizer',
      guardadas.length === 2, [...semChave.dados.keys()]);

    /* 3. O PROVEDOR RECUSA. O motivo do provedor viaja no desfecho — é o que se lê quando uma
     * carta não chegou e a chave existe. */
    const cf3 = correioFalso({ falhar: true });
    globalThis.fetch = cf3.fetch;
    let recusa;
    try {
      recusa = await raiz.avisarDoExpurgo({
        env: { RESEND_API_KEY: 're-de-mentira', PADD_KV: kvCom({}) },
        escola: 'duo', nome: 'Duo', quando: QUANDO, professor: null,
        contactos: ['escola@exemplo.test'], apagados: 1, kv: { ok: true },
        proveniencia: null, motivo: 'x',
      });
    } finally { delete globalThis.fetch; }
    conferir('quando o provedor recusa, o desfecho diz que não saiu',
      recusa.paraAEscola.enviado === false, recusa.paraAEscola);
    conferir('…e traz o motivo do provedor, que é o que se lê para corrigir',
      /domínio não verificado|422/i.test(JSON.stringify(recusa.paraAEscola)), recusa.paraAEscola);
  }

  console.log('\nD. Uma carta por envio, e a caixa de saída não perde nenhuma');
  {
    /* O professor e a escola com o MESMO endereço — o caso comum de uma escola pequena. A dedução
     * é do núcleo (`destinatarios`), a mesma que a boas-vindas usa: uma carta, não duas iguais. */
    const cf = correioFalso();
    globalThis.fetch = cf.fetch;
    let r;
    try {
      r = await raiz.avisarDoExpurgo({
        env: { RESEND_API_KEY: 're-de-mentira', PADD_KV: kvCom({}) },
        escola: 'duo', nome: 'Duo', quando: QUANDO, professor: 'Fernando Franciose',
        contactos: ['mesma@exemplo.test'],
        apagados: 2, kv: { ok: true }, proveniencia: null, motivo: 'x',
      });
    } finally { delete globalThis.fetch; }
    const daEscola = cf.cartas.find((c) => c.to[0] === 'mesma@exemplo.test');
    /* `destinatarios` DEDUPLICA; o que aqui se passa à mão é a lista JÁ deduplicada (é o que a rota
     * faz com `cadastroDaEscola.destinatarios`). O que se mede é que a carta não vai duas vezes. */
    conferir('a lista deduplicada não produz uma segunda carta',
      Boolean(daEscola) && cf.cartas.filter((c) => c.to[0] === 'mesma@exemplo.test').length === 1,
      cf.cartas.map((c) => c.to));
    conferir('…e o relatório diz para quem foi', r.paraAEscola.para.length === 1, r.paraAEscola.para);
  }

  console.log('');
  console.log(ko === 0
    ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
