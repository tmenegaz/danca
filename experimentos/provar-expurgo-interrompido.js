#!/usr/bin/env node
'use strict';

/*
 * provar-expurgo-interrompido.js — o expurgo que ficou a meio pode ser COMPLETADO (26/11/2026).
 *
 * O QUE ELA RELATOU, e é o defeito inteiro:
 *
 *   «Não consigo excluir novamente a escola breu aqui pela tela.» — e a frase que a tela dava:
 *   «Não há cadastro comercial desta escola — e sem cadastro não há como saber que ela está
 *   suspensa.»
 *
 * A CAUSA, medida na árvore e no KV da `breu`. O expurgo tem duas metades e a ordem é Cloudflare →
 * repositório. A primeira correu inteira — a rota saiu (o DNS não resolve), o mapa do shard perdeu
 * a entrada, e as chaves de `bastidores/breu/` foram apagadas, **o comercial entre elas**. A
 * segunda não escreveu o commit, e os 83 ficheiros da escola ficaram no repositório.
 *
 * A regra do expurgo lê `bastidores/<escola>/comercial` para saber se a escola está suspensa e se a
 * carência venceu. O expurgo apagou a evidência que a sua própria guarda exige, **antes** do passo
 * que falhou. A partir daí a escola é impossível de apagar: a evidência já não existe, e nenhuma
 * tentativa a pode recriar.
 *
 * O QUE ESTA PROVA MEDE, e são duas metades que se falham de maneiras opostas:
 *
 *   A. O RECONHECIMENTO — a assinatura são TRÊS factos, e cada um tem de ser preciso: a escola
 *      declara `shard`, o prefixo `bastidores/<escola>/` está vazio, e a escola não está no mapa.
 *      Falhando um, a resposta volta a ser a da regra.
 *   B. A RECUSA CONTINUA — uma escola sem registo comercial que NÃO esteja neste estado continua a
 *      não poder ser apagada. Sem esta metade, a correcção seria «desligar a guarda», e a carência
 *      — o prazo que se promete a quem paga — deixaria de valer para qualquer escola sem registo.
 *
 * OS CONTROLES NEGATIVOS, e são o que dá valor ao resto:
 *   · uma escola COM registro e fora da carência continua a ser recusada (a retomada não é um
 *     atalho para saltar o prazo);
 *   · uma escola no mapa é VIVA, mesmo com o KV vazio (é o mapa que diz quem existe num shard);
 *   · uma escola de Worker próprio nunca entra aqui (a limpeza do KV usa o namespace da morada, e
 *     o comercial dela no KV do painel não é tocado por essa limpeza — logo o estado não ocorre);
 *   · uma listagem do KV que falha NÃO é «zero chaves» (o §13: não se inventa um zero).
 *
 * SEM REDE: o único I/O é o elo da escola, servido por um `lerArquivo` de mentira que responde só
 * ao caminho que interessa. O KV é de bolso.
 *
 *   node experimentos/provar-expurgo-interrompido.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

let provas = 0;
let falhas = 0;
const provar = (titulo, condicao, detalhe) => {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
};

/** Um KV de bolso — com `list` de verdade, porque é dela que sai o segundo facto. */
function kvDeBolso(pares, opcoes) {
  const dados = new Map(Object.entries(pares || {}));
  const falharLista = Boolean(opcoes && opcoes.falharLista);
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix } = {}) {
      if (falharLista) throw new Error('a listagem não veio');
      const p = String(prefix || '');
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(p)).map((name) => ({ name })),
        list_complete: true,
      };
    },
    bruto: dados,
  };
}

/*
 * O ELO SERVIDO SEM REDE. O `expurgoInterrompido` lê `escola/<slug>/indice.json` do repositório, e
 * o que ele procura lá é UMA coisa: `shard`. Um duplo que respondesse a tudo seria mais permissivo
 * do que o sistema — responde exactamente a esse caminho, e 404 ao resto, como o GitHub.
 */
function comEloDeMentira(elos) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    const m = /\/contents\/(escola\/[^?]+)\?/.exec(u);
    const caminho = m ? decodeURIComponent(m[1]) : null;
    if (caminho && Object.prototype.hasOwnProperty.call(elos, caminho)) {
      const texto = JSON.stringify(elos[caminho]);
      const base64 = Buffer.from(texto, 'utf8').toString('base64');
      return new Response(JSON.stringify({ content: base64, sha: 'x', encoding: 'base64' }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };
  return () => { globalThis.fetch = original; };
}

/* A AUTENTICAÇÃO DA RAIZ — a mesma forma do `provar-expurgo-raiz`: `Basic` sobre a senha do
 * `SENHA_RAIZ` do env, porque é assim que o painel se autentica. */
const AUTORIZACAO = { Authorization: 'Basic ' + Buffer.from('tmenegaz:segredo').toString('base64') };

const MINUTO = 60 * 1000;
const AGORA = Date.parse('2026-11-26T21:00:00.000Z');
const iso = (ms) => new Date(ms).toISOString();

(async () => {
  const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));

  console.log('A. O RECONHECIMENTO — três factos medidos, e nenhum deles uma suposição');
  {
    /* O ESTADO MEDIDO NA `breu`, reconstruído com os valores que a sonda leu: elo com `shard`,
       prefixo `bastidores/breu/` vazio, e o mapa sem a entrada. */
    const elos = { 'escola/breu/indice.json': { escola: 'breu', shard: 'lastro-teste', worker: 'lastro-teste' } };
    const restaurar = comEloDeMentira(elos);
    try {
      const kv = kvDeBolso({ 'escolas/por-host': JSON.stringify({ 'clablun.padd.com.br': 'clablun' }) });
      const r = await raiz.expurgoInterrompido({ kv, token: 'gh', slug: 'breu' });
      provar('o estado da breu é reconhecido como expurgo interrompido', r.interrompido === true, r);
      provar('…e o motivo nomeia o prefixo vazio', /bastidores\/breu\//.test(String(r.motivo || '')), r.motivo);
      provar('…e nomeia o shard de onde ela saiu', /lastro-teste/.test(String(r.motivo || '')), r.motivo);
      provar('…e diz que a carência já foi cumprida (não está a saltá-la)',
        /carência já foi cumprida/.test(String(r.motivo || '')), r.motivo);

      /* FACTOS, UM A UM. Cada um destes, sozinho, tem de DERRUBAR a conclusão — é o que separa
         «medi três coisas» de «concluí uma». */
      const aindaTemChaves = kvDeBolso({
        'bastidores/breu/alunas': '[]',
        'escolas/por-host': JSON.stringify({}),
      });
      const comChaves = await raiz.expurgoInterrompido({ kv: aindaTemChaves, token: 'gh', slug: 'breu' });
      provar('com UMA chave no KV, não é interrompido', comChaves.interrompido === false, comChaves);
      provar('…e diz quantas chaves ainda lá estão', /1 chave/.test(String(comChaves.porque || '')), comChaves.porque);

      const noMapa = kvDeBolso({
        'escolas/por-host': JSON.stringify({ 'breu.padd.com.br': 'breu' }),
      });
      const viva = await raiz.expurgoInterrompido({ kv: noMapa, token: 'gh', slug: 'breu' });
      provar('no mapa do shard, a escola é VIVA — mesmo com o KV vazio', viva.interrompido === false, viva);
      provar('…e a razão é o endereço que ela ainda tem', /mapa do shard/.test(String(viva.porque || '')), viva.porque);

      /* A ESCOLA DE WORKER PRÓPRIO. O comercial dela vive no KV do painel, e a limpeza do expurgo
         corre contra o namespace da MORADA — que para ela é outro. O estado não ocorre, e a função
         tem de o dizer: sem `shard`, não há retomada nenhuma. */
      delete elos['escola/breu/indice.json'];
      elos['escola/sozinha/indice.json'] = { escola: 'sozinha', worker: 'sozinha' };
      const sozinha = await raiz.expurgoInterrompido({
        kv: kvDeBolso({ 'escolas/por-host': '{}' }), token: 'gh', slug: 'sozinha',
      });
      provar('escola de Worker próprio: não é de shard, e não entra na retomada',
        sozinha.interrompido === false, sozinha);
      provar('…e a razão diz isso mesmo', /não é de um shard/.test(String(sozinha.porque || '')), sozinha.porque);

      /* A LISTAGEM QUE FALHA NÃO É «ZERO CHAVES» (§13 do plano). Recusar aqui é a diferença entre
         «não há dado» e «não consegui ver se há». */
      const cega = kvDeBolso({ 'escolas/por-host': '{}' }, { falharLista: true });
      elos['escola/breu/indice.json'] = { escola: 'breu', shard: 'lastro-teste' };
      const semLista = await raiz.expurgoInterrompido({ kv: cega, token: 'gh', slug: 'breu' });
      provar('listagem falhada NÃO é «zero chaves» — não se conclui sem medir',
        semLista.interrompido === false, semLista);
      provar('…e o motivo é a leitura, não a ausência de dado',
        /listar as chaves/.test(String(semLista.porque || '')), semLista.porque);

      /* SEM ELECA NENHUM (o elo não veio): não se afirma shard, logo não há retomada. */
      const semElo = await raiz.expurgoInterrompido({
        kv: kvDeBolso({ 'escolas/por-host': '{}' }), token: 'gh', slug: 'inexistente',
      });
      provar('sem elo legível, não há retomada (não se inventa um shard)',
        semElo.interrompido === false, semElo);
    } finally { restaurar(); }
  }

  // ==========================================================================
  console.log('\nB. A DECISÃO — a retomada entra pela regra, e a regra não foi tocada');
  {
    const elos = { 'escola/breu/indice.json': { escola: 'breu', shard: 'lastro-teste' } };
    const restaurar = comEloDeMentira(elos);
    try {
      /* O CASO DELA: sem comercial, KV vazio, fora do mapa → pode. */
      const kv = kvDeBolso({ 'escolas/por-host': '{}' });
      const v = await raiz.podeExpurgar({
        env: { PADD_KV: kv, GITHUB_TOKEN: 'gh' }, slug: 'breu', agora: AGORA,
      });
      provar('a breu, no estado em que ficou, PODE ser apagada', v.pode === true, v);
      provar('…e o veredicto diz que é uma retomada', v.interrompido === true, v);
      provar('…e o estado do expurgo é «interrompido»', v.estadoDoExpurgo === 'interrompido', v);
      provar('…e NÃO inventa «suspensa» (não há registo que o diga)', v.estado === null, v);

      /* O CONTROLO NEGATIVO que importa: a MESMA escola, com o KV ainda cheio, volta a ser recusada
         pelo motivo de sempre. É isto que impede a correcção de ser «a guarda já não vale». */
      const comChaves = kvDeBolso({
        'escolas/por-host': '{}',
        'bastidores/breu/alunas': '[]',
      });
      const v2 = await raiz.podeExpurgar({
        env: { PADD_KV: comChaves, GITHUB_TOKEN: 'gh' }, slug: 'breu', agora: AGORA,
      });
      provar('com o KV cheio, a mesma escola NÃO pode ser apagada', v2.pode === false, v2);
      provar('…e o motivo é o da regra, palavra por palavra',
        /Não há cadastro comercial desta escola/.test(String(v2.motivo || '')), v2.motivo);
      provar('…e a recusa diz PORQUE a retomada não valeu', /1 chave/.test(String(v2.porque || '')), v2.porque);

      /* A CARÊNCIA CONTINUA A VALER. Uma escola com registo e prazo a correr é recusada, e a
         retomada nem é tentada — não há `semCadastro` que a justifique. */
      /* A CARÊNCIA DE TESTE É **1 MINUTO** (`CARENCIA_DE_TESTE_MINUTOS`). Os casos ficam longe
         da fronteira de propósito: 20 segundos está dentro, 400 dias está fora. Um caso em cima
         do limite mediria o `<` da comparação, e não a regra. */
      const emCarencia = kvDeBolso({
        'escolas/por-host': JSON.stringify({ 'breu.padd.com.br': 'breu' }),
        'bastidores/breu/comercial': JSON.stringify({
          /* 20 SEGUNDOS DE UMA CARÊNCIA DE **1 MINUTO** (`CARENCIA_DE_TESTE_MINUTOS`): dentro do
           * prazo, e longe da fronteira — um caso em cima do limite mediria o `<` da comparação. */
          estado: 'suspensa', desabilitadaEm: iso(AGORA - 20 * 1000), criadoEm: iso(AGORA - 90 * MINUTO),
        }),
        'expurgo/regime-de-teste-desde': iso(AGORA - 60 * MINUTO),
      });
      const v3 = await raiz.podeExpurgar({
        env: { PADD_KV: emCarencia, GITHUB_TOKEN: 'gh' }, slug: 'breu', agora: AGORA,
      });
      provar('em carência, a escola NÃO é apagada — a retomada não salta o prazo', v3.pode === false, v3);
      provar('…e o motivo fala do prazo, não de cadastro', /carência/.test(String(v3.motivo || '')), v3.motivo);
      provar('…e nem tenta a retomada (não há ausência de registo a justificar)',
        v3.interrompido === false, v3);

      /* UMA MUTAÇÃO QUE NÃO MUDA NADA, e é preciso dizê-lo. Tirar a condição
       * `!veredicto.semCadastro` de `podeExpurgar` NÃO faz cair asserção nenhuma — e não é uma
       * lacuna da prova: se há registo comercial, a chave `bastidores/<slug>/comercial` existe, logo
       * a listagem do prefixo devolve pelo menos uma chave, logo `expurgoInterrompido` responde
       * `false` de qualquer maneira. A condição é o ATALHO (poupa três subpedidos a uma escola que
       * não precisa deles); a garantia é o facto medido, e o facto cai com a mutação M2 da bateria
       * deste trabalho — «listagem falhada conta como zero chaves» derruba duas asserções.
       *
       * Fica escrito para o próximo que tentar mutar aqui e concluir que a guarda não está provada. */

      /* A ESCOLA HABILITADA continua intocável, com uma frase que se lê. */
      const ativa = kvDeBolso({
        'escolas/por-host': JSON.stringify({ 'breu.padd.com.br': 'breu' }),
        'bastidores/breu/comercial': JSON.stringify({ estado: 'ativa', criadoEm: iso(AGORA - 90 * MINUTO) }),
      });
      const v4 = await raiz.podeExpurgar({
        env: { PADD_KV: ativa, GITHUB_TOKEN: 'gh' }, slug: 'breu', agora: AGORA,
      });
      provar('a escola habilitada continua a não poder ser apagada', v4.pode === false, v4);
      provar('…e a frase nomeia a habilitação', /habilitada/.test(String(v4.motivo || '')), v4.motivo);

      /* SEM TOKEN NÃO HÁ RETOMADA — e a resposta é a de antes. É o modo «Worker sem GITHUB_TOKEN»,
         onde não se poderia apagar nada de qualquer maneira. */
      const v5 = await raiz.podeExpurgar({
        env: { PADD_KV: kvDeBolso({ 'escolas/por-host': '{}' }) }, slug: 'breu', agora: AGORA,
      });
      provar('sem GITHUB_TOKEN, a resposta volta a ser a da regra', v5.pode === false, v5);
    } finally { restaurar(); }
  }

  // ==========================================================================
  console.log('\nC. A REGRA NÃO FOI TOCADA — o mesmo veredicto, para os mesmos registos');
  {
    /* Se a correcção tivesse mexido no `estadoDoExpurgo`, esta secção seria a que o diria: os
       quatro casos da regra, sem KV e sem rede, continuam a dar exactamente o que davam. */
    const R = raiz.estadoDoExpurgo;
    const sem = R(null, { agora: AGORA });
    provar('sem registo: recusa, e a frase é a que ela leu',
      sem.pode === false && /Não há cadastro comercial/.test(String(sem.motivo)), sem);
    const suspensaVelha = R({ estado: 'suspensa', desabilitadaEm: iso(AGORA - 400 * 24 * 60 * MINUTO) },
      { agora: AGORA });
    provar('suspensa com carência vencida: pode, e é a regra que o diz', suspensaVelha.pode === true, suspensaVelha);
    const suspensaNova = R({ estado: 'suspensa', desabilitadaEm: iso(AGORA - 20 * 1000) }, { agora: AGORA });
    provar('suspensa dentro da carência: recusa', suspensaNova.pode === false, suspensaNova);
    provar('a assinatura do veredicto é a mesma de sempre (pode/estado/motivo)',
      ['pode', 'estado', 'motivo'].every((k) => Object.prototype.hasOwnProperty.call(sem, k)), Object.keys(sem));
  }

  // ==========================================================================
  console.log('\nD. A ROTA — o 409 deixou de ser o fim da linha');
  {
    /* A rota é chamada de verdade, com o `env` da raiz. O que se mede é o que o `/api/apagar-escola`
       responde NA GUARDA: sem os dois tokens, a resposta é 500 «faltam tokens» — o que só acontece
       DEPOIS de a guarda passar. Antes da correcção, aqui vinha 409 e a frase do cadastro. */
    const elos = { 'escola/breu/indice.json': { escola: 'breu', shard: 'lastro-teste' } };
    const restaurar = comEloDeMentira(elos);
    try {
      const chamar = async (env) => {
        const req = new Request('https://danca.padd.com.br/api/apagar-escola', {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, AUTORIZACAO),
          body: JSON.stringify({ escola: 'breu', confirmacao: 'breu' }),
        });
        const res = await raiz.fetch(req, env);
        let corpo = null;
        try { corpo = await res.json(); } catch { corpo = null; }
        return { status: res.status, corpo };
      };

      const kv = kvDeBolso({ 'escolas/por-host': '{}' });
      const r = await chamar({ PADD_KV: kv, SENHA_RAIZ: 'segredo', GITHUB_TOKEN: 'gh' });
      provar('a rota NÃO responde 409 «não há cadastro comercial»', r.status !== 409, r);
      /* A GUARDA PASSOU — a resposta seguinte é a de um `env` sem o token do Cloudflare, e não a
       * recusa da carência. É a asserção que discrimina: antes da correcção, aqui vinha o 409. */
      provar('…e a guarda foi passada — o que falta é o token, e ele é nomeado',
        Boolean(r.corpo && Array.isArray(r.corpo.faltando) && r.corpo.faltando.includes('CLOUDFLARE_API_TOKEN')),
        r.corpo);

      /* O CONTRAPONTO: a mesma rota, com o KV ainda cheio, continua a recusar com 409 — e é o
         mesmo caminho de código que a lista e a varredura usam. */
      const cheio = kvDeBolso({ 'escolas/por-host': '{}', 'bastidores/breu/alunas': '[]' });
      const r2 = await chamar({ PADD_KV: cheio, SENHA_RAIZ: 'segredo', GITHUB_TOKEN: 'gh' });
      provar('com o KV cheio, a rota recusa com 409', r2.status === 409, r2);
      provar('…e o corpo diz `expurgavel: false`', r2.corpo && r2.corpo.expurgavel === false, r2.corpo);
      provar('…e a frase é a do cadastro ausente',
        /Não há cadastro comercial/.test(String((r2.corpo && r2.corpo.erro) || '')), r2.corpo);
    } finally { restaurar(); }
  }

  // ==========================================================================
  console.log('');
  if (falhas) {
    console.log('FALHARAM ' + falhas + ' de ' + provas + ' asserções.');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + provas + ' asserções: o expurgo que ficou a meio reconhece-se por três '
    + 'factos medidos, completa-se pela mesma rota, e a carência continua a valer para todas as outras.');
})();
