#!/usr/bin/env node
'use strict';

/**
 * provar-po-unico.js — o PO tem UM por plano de ensino, e o segundo é RECUSADO (22/10/2026).
 *
 * O QUE SE MEDIU. Em 22/10/2026 a escola `batata` ficou com DOIS Planos de Observação para o
 * mesmo plano de ensino e a mesma turma — `po-20261022-1039` e `po-20261022-1108` —, os dois com
 * `ajuste_de: null`, indistinguíveis na estante e no repositório. A causa não era um defeito de
 * gravação: era uma AUSÊNCIA. `porta.elicitar()` tinha a política «edita em sítio / deriva /
 * nasce novo» num bloco `if (fonte === 'plano')`, e o PO estava excluído de toda a reconciliação
 * (`fonte !== 'po'`). Cada «Guardar» do PO nascia com carimbo novo, sempre. E como o `-po.md` é
 * a única fonte que se ATUALIZA em sítio (`escrever-po.js`: «cria ou atualiza»), o segundo
 * apagava o primeiro, enquanto as fontes derivadas — que só se escrevem se faltarem — ficavam a
 * descrever o PO anterior.
 *
 * O QUE ESTA PROVA TRAVA.
 *
 *   1. o primeiro PO do plano é aceite (200);
 *   2. o segundo, sem `id` e sem `ajuste_de`, é RECUSADO com 409 — e a mensagem NOMEIA o
 *      carimbo existente e diz o que fazer com ele;
 *   3. a recusa não grava nada: o acervo continua com um PO só;
 *   4. `ajuste_de` é o caminho legítimo — nasce um elo NOVO, e o anterior fica;
 *   5. `id` CORRIGE o mesmo carimbo (não nasce outro);
 *   6. a regra é por PLANO, não por escola: outro plano de ensino pode ter o seu PO.
 *
 *   uso: node experimentos/provar-po-unico.js
 *
 * Roda o SERVIDOR de verdade (`motor/servidor/rotas.js`) sobre a memória do núcleo, com o
 * relógio injetado: sem rede, sem disco, determinístico.
 */

const fs = require('fs');
const path = require('path');

const { criarRotas } = require('../motor/servidor/rotas.js');
const { criarMemoria } = require('../motor/nucleo/armazenamento.js');

const RAIZ = path.join(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(PORTA, p), 'utf8'));

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

// ---------------------------------------------------------------- a bancada

const CONTEXTO = { escola: 'batata', professor: 'acucar-branco', ciclo: '01', turma: 'teste-2' };
const PLANO_A = 'plano-20261022-1036';
const PLANO_B = 'plano-20261022-1124';

function bancada() {
  const armazenamento = criarMemoria();
  const relogio = { valor: '2026-10-22T10:39' };
  const rotas = criarRotas({
    armazenamento,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    agora: () => relogio.valor,
  });
  return { armazenamento, rotas, relogio };
}

async function pedir(rotas, metodo, caminho, corpo) {
  const pedido = new Request('http://local' + caminho, {
    method: metodo,
    headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const resposta = await rotas.responder(pedido);
  const texto = await resposta.text();
  let dados = null;
  try { dados = JSON.parse(texto); } catch { dados = texto; }
  return { status: resposta.status, dados };
}

/** Um PO com o mínimo que a regra lê: a que plano se refere, e o horizonte (o que o distingue). */
const poDe = (plano, horizonte, extra) => Object.assign({
  fonte: 'po',
  contexto: CONTEXTO,
  respostas: { 'plano-de-ensino': plano, horizonte },
}, extra || {});

const guardar = (rotas, corpo) => pedir(rotas, 'POST', '/api/elicitar', corpo);

/** O valor de uma resposta, seja ela o registo `{valor,…}` ou o valor cru. */
const valorDe = (respostas, id) => {
  const r = (respostas || {})[id];
  return r && typeof r === 'object' && 'valor' in r ? r.valor : r;
};

/** O envelope GRAVADO — `armazenamento.ler` devolve o texto, não o objecto. */
async function envelopeDe(armazenamento, id) {
  const cru = await armazenamento.ler('envelope/' + id + '.json');
  if (!cru) return null;
  try { return typeof cru === 'string' ? JSON.parse(cru) : cru; } catch { return null; }
}

async function nomesDePO(armazenamento) {
  const nomes = await armazenamento.listar('envelope/');
  return (nomes || []).filter((x) => /(^|\/)po-.*\.json$/.test(x)).map((x) => x.split('/').pop());
}

// ------------------------------------------------------------------- a prova

async function principais() {
  // ── 1. o PRIMEIRO PO do plano é aceite ────────────────────────────────────
  {
    const { armazenamento, rotas } = bancada();
    const r = await guardar(rotas, poDe(PLANO_A, 'H1'));
    checar('o primeiro PO de um plano é aceite', r.status === 200, r.status);
    const pos = await nomesDePO(armazenamento);
    checar('…e nasce um envelope de PO', pos.length === 1, pos);

    // ── 2. o SEGUNDO, sem `id` e sem `ajuste_de`, é RECUSADO ───────────────
    const r2 = await guardar(rotas, poDe(PLANO_A, 'H2'));
    checar('o segundo PO do MESMO plano é recusado', r2.status === 409, r2.status);
    const carimbo = pos[0].replace(/\.json$/, '');
    checar('a mensagem NOMEIA o carimbo que já existe',
      String(r2.dados && r2.dados.erro).indexOf(carimbo) !== -1, r2.dados && r2.dados.erro);
    checar('…e diz o que fazer (corrigir / derivar)',
      /CORRIGIR/.test(String(r2.dados && r2.dados.erro)) && /DERIVAR/.test(String(r2.dados && r2.dados.erro)),
      r2.dados && r2.dados.erro);

    // ── 3. a recusa não gravou nada ────────────────────────────────────────
    const depois = await nomesDePO(armazenamento);
    checar('a recusa NÃO grava um segundo envelope', depois.length === 1, depois);
    const aindaH1 = await envelopeDe(armazenamento, carimbo);
    checar('…e o PO que já existia continua intacto (o horizonte é o dele)',
      valorDe((aindaH1 || {}).respostas, 'horizonte') === 'H1',
      (aindaH1 || {}).respostas);

    // ── 4. `ajuste_de` é o caminho legítimo ────────────────────────────────
    const r4 = await guardar(rotas, poDe(PLANO_A, 'H3', { ajuste_de: carimbo }));
    checar('derivar (`ajuste_de`) é aceite', r4.status === 200, { status: r4.status, dados: r4.dados });
    const pos4 = await nomesDePO(armazenamento);
    checar('…e nasce um elo NOVO, com o anterior de pé', pos4.length === 2, pos4);
    const derivado = pos4.map((x) => x.replace(/\.json$/, '')).find((x) => x !== carimbo);
    const envDerivado = await envelopeDe(armazenamento, derivado);
    checar('…e o elo aponta para o anterior',
      (envDerivado || {}).ajuste_de === carimbo, (envDerivado || {}).ajuste_de);

    // ── 5. `id` CORRIGE o mesmo carimbo ────────────────────────────────────
    const r5 = await guardar(rotas, poDe(PLANO_A, 'H4', { id: carimbo }));
    checar('corrigir (`id`) é aceite', r5.status === 200, { status: r5.status, dados: r5.dados });
    const pos5 = await nomesDePO(armazenamento);
    checar('…e NÃO nasce outro envelope', pos5.length === 2, pos5);
    const corrigido = await envelopeDe(armazenamento, carimbo);
    checar('…e o horizonte do mesmo carimbo mudou de facto',
      valorDe((corrigido || {}).respostas, 'horizonte') === 'H4',
      (corrigido || {}).respostas);
  }

  // ── 6. a regra é por PLANO, não por escola ───────────────────────────────
  {
    const { armazenamento, rotas } = bancada();
    await guardar(rotas, poDe(PLANO_A, 'H1'));
    const r = await guardar(rotas, poDe(PLANO_B, 'HB'));
    checar('outro plano de ensino pode ter o SEU PO', r.status === 200, {
      status: r.status, dados: r.dados,
    });
    checar('…e o acervo fica com os dois', (await nomesDePO(armazenamento)).length === 2,
      await nomesDePO(armazenamento));
  }

  // ── 7. sem plano declarado, a regra cai no ESCOPO ────────────────────────
  {
    const { armazenamento, rotas } = bancada();
    const semPlano = { fonte: 'po', contexto: CONTEXTO, respostas: { horizonte: 'H1' } };
    const r1 = await guardar(rotas, semPlano);
    checar('sem plano declarado, o primeiro PO é aceite', r1.status === 200, r1.status);
    const r2 = await guardar(rotas, Object.assign({}, semPlano, {
      respostas: { horizonte: 'H2' },
    }));
    checar('…e o segundo do mesmo escopo também é recusado', r2.status === 409, r2.status);
    checar('…sem gravar', (await nomesDePO(armazenamento)).length === 1,
      await nomesDePO(armazenamento));
  }
}

(async () => {
  console.log('PROVAR: um Plano de Observação por plano de ensino');
  await principais();
  if (falhas) {
    console.log('\n' + falhas + ' falha(s) em ' + n + ' asserção(ões).');
    process.exit(1);
  }
  console.log('\nTUDO CERTO — ' + n + ' asserções, 0 falha(s).');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
