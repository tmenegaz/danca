#!/usr/bin/env node
'use strict';

/**
 * provar-expurgo-leitura-atrasada.js — o expurgo não mente, e não deixa dado atrás.
 *
 * A LISTA DO KV É UM ÍNDICE, E O ÍNDICE ATRASA NOS DOIS SENTIDOS. Em 19/10/2026, ao expurgar
 * a escola `calando-teste-1`, o relatório errou para os dois lados na mesma operação:
 *
 *   · FALSO ALARME — «calando-teste-1/ → 8 de 8 · sobraram 1» e «ATENÇÃO: sobraram 1 chave».
 *     A chave ainda aparecia no `list`, e a LEITURA dela respondia **404**: tinha sido
 *     apagada. O expurgo estava completo e o relatório disse que não.
 *   · CHAVE QUE FICOU — duas chaves de `bastidores/calando-teste-1/` (`curadorias`,
 *     `rubricas`) existiam e não entraram na listagem inicial: nunca foram apagadas, e a
 *     relistagem também não as viu. O relatório disse «7 de 7 · sobraram 0» com os dados da
 *     escola ainda no KV — e só uma consulta à mão, minutos depois, as encontrou.
 *
 * A correção não é «esperar mais»: é trocar a fonte da verdade. Para uma chave, quem manda é
 * a LEITURA (`GET /values/<chave>`): 404 é prova de que não está, 200 é prova de que está.
 * A listagem passa a ser uma pista — e o laço de apagar ganha PASSAGENS, porque a chave que a
 * primeira listagem omitiu só aparece na segunda.
 *
 * A prova usa um KV falso com as três manhas do de verdade:
 *   · `atraso`   — a chave apagada continua a ser listada N vezes (o falso alarme);
 *   · `ocultas`  — a chave que EXISTE e a listagem omite N vezes (a chave que fica);
 *   · `recusaApagar` — o DELETE que a API recusa (a sobra de verdade).
 *
 *   node experimentos/provar-expurgo-leitura-atrasada.js
 */

const fs = require('node:fs');
const path = require('node:path');

const {
  apagarChavesDeEscola, excluirEscola, prefixosDaEscola,
} = require('../motor/servidor/expurgar-escola.js');

let n = 0;
let falhas = 0;

function ok(titulo, condicao, detalhe) {
  n += 1;
  if (condicao) { console.log(`  ✓ ${titulo}`); return; }
  falhas += 1;
  console.log(`  ✗ ${titulo}${detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)}`);
}

function igual(titulo, obtido, esperado) {
  ok(titulo + ' (' + JSON.stringify(obtido) + ')',
    JSON.stringify(obtido) === JSON.stringify(esperado),
    { obtido, esperado });
}

/**
 * O KV falso. `chaves` é o estado REAL (é ele que o `GET /values` responde); a listagem é o
 * índice — e é aí que entram as duas manhas.
 */
function criarKv({ chaves = [], atraso = 0, recusaApagar = [], ocultas = [] } = {}) {
  const estado = {
    chaves: new Set(chaves),
    // nome → quantas listagens AINDA o mostram (o índice atrasado depois do DELETE).
    fantasmas: new Map(),
    // nome → quantas listagens ainda o ESCONDEM (o índice que não viu a chave nascer).
    escondidas: new Map(ocultas.map((c) => [c.nome, c.listagens])),
    listagens: 0,
    deletes: 0,
  };
  const responder = (corpo) => ({ ok: true, status: 200, json: async () => corpo });

  global.fetch = async (url, opt) => {
    const u = new URL(url);
    const metodo = (opt && opt.method) || 'GET';
    const partes = u.pathname.split('/');
    const iValores = partes.indexOf('values');
    const iChaves = partes.indexOf('keys');
    const nomeDaChave = () => decodeURIComponent(partes.slice(iValores + 1).join('/'));

    // A LEITURA — a autoridade. Responde pelo estado real, e nunca pelo índice.
    if (metodo === 'GET' && iValores !== -1) {
      if (!estado.chaves.has(nomeDaChave())) {
        return { ok: false, status: 404, json: async () => ({ success: false }) };
      }
      return { ok: true, status: 200, text: async () => 'valor', json: async () => ({ success: true }) };
    }

    if (metodo === 'DELETE' && iValores !== -1) {
      const nome = nomeDaChave();
      estado.deletes++;
      if (recusaApagar.includes(nome)) {
        return { ok: false, status: 403, json: async () => ({ success: false, errors: [{ message: 'recusado' }] }) };
      }
      estado.chaves.delete(nome);
      if (atraso > 0) estado.fantasmas.set(nome, atraso);
      return responder({ success: true, result: null });
    }

    if (metodo === 'GET' && iChaves !== -1) {
      estado.listagens++;
      const prefixo = u.searchParams.get('prefix') || '';
      const filtro = (c) => c.startsWith(prefixo);

      // As escondidas: existem, casam com o prefixo, e esta listagem não as mostra.
      const visiveis = [...estado.chaves].filter(filtro).filter((nome) => {
        const resta = estado.escondidas.get(nome);
        if (!resta) return true;
        if (resta - 1 <= 0) estado.escondidas.delete(nome);
        else estado.escondidas.set(nome, resta - 1);
        return false;
      });

      // Os fantasmas: já não existem, e o índice ainda os mostra.
      const fantasmas = [];
      for (const [nome, resta] of [...estado.fantasmas]) {
        if (!filtro(nome) || resta <= 0) continue;
        fantasmas.push(nome);
        if (resta - 1 <= 0) estado.fantasmas.delete(nome);
        else estado.fantasmas.set(nome, resta - 1);
      }

      const nomes = [...visiveis, ...fantasmas];
      return responder({
        success: true,
        result: nomes.map((name) => ({ name })),
        result_info: { count: nomes.length, list_complete: true },
      });
    }

    return { ok: false, status: 404, json: async () => ({ success: false, errors: [{ message: 'rota' }] }) };
  };

  return estado;
}

const fetchOriginal = global.fetch;
// A prova não dorme os 2+4 s entre passagens: o que se mede é a lógica, não o relógio.
const SEM_PAUSA = () => {};
const NS = 'ns-de-ensaio';
const CHAVES = [
  'fita/a', 'fita/b', 'fita/c', 'fita/d', 'fita/e', 'fita/f', 'fita/g', 'fita/h',
  'bastidores/fita/turmas', 'bastidores/fita/alunas', 'bastidores/fita/curadorias',
  'bastidores/fita/professores', 'bastidores/fita/turma-conteudos', 'bastidores/fita/vocabulario',
  'bastidores/fita/rubricas', 'bastidores/fita/aparencia',
];

(async () => {
  console.log('EXPURGO — a listagem não é o dado\n');

  // ── 1. O caso da `calando`: tudo apagado, e o índice ainda mostra uma ─────
  console.log('1. O falso alarme: 16 de 16 apagadas, e a listagem ainda vê 1 (leitura = 404)');
  const kv1 = criarKv({ chaves: CHAVES, atraso: 3 });
  const r1 = await apagarChavesDeEscola({
    token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita', pausa: SEM_PAUSA,
  });
  igual('16 apagadas de 16', [r1.apagadas, r1.total], [16, 16]);
  igual('restantes = 0 — a LEITURA é a autoridade', r1.restantes, 0);
  igual('ok = true — o expurgo está completo', r1.ok, true);
  igual('marcado como leitura atrasada', r1.leituraAtrasada, true);
  ok('…e o índice obsoleto fica contado, para a página poder dizer o que é',
    r1.restantesNoIndice > 0, r1.restantesNoIndice);
  ok('…e não há chave nenhuma na lista de «ficaram»', r1.ficaram.length === 0);
  igual('o KV ficou vazio', kv1.chaves.size, 0);
  ok('o relatório não manda procurar dado onde há índice',
    r1.porPrefixo.every((p) => p.restantes === 0), r1.porPrefixo.map((p) => p.restantes));

  // ── 2. A chave que a listagem NÃO viu: a segunda passagem acha e apaga ────
  console.log('\n2. A chave que ficou: a 1ª listagem a omite, e a 2ª passagem a apaga');
  const kv2 = criarKv({
    chaves: CHAVES, atraso: 0,
    // As duas chaves reais que sobreviveram em 19/10/2026.
    ocultas: [
      { nome: 'bastidores/fita/curadorias', listagens: 1 },
      { nome: 'bastidores/fita/rubricas', listagens: 1 },
    ],
  });
  const r2 = await apagarChavesDeEscola({
    token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita', pausa: SEM_PAUSA,
  });
  igual('16 apagadas de 16 — inclusive as que a 1ª listagem escondeu',
    [r2.apagadas, r2.total], [16, 16]);
  igual('restantes = 0', r2.restantes, 0);
  igual('ok = true', r2.ok, true);
  ok('as duas chaves escondidas foram mesmo apagadas',
    !kv2.chaves.has('bastidores/fita/curadorias') && !kv2.chaves.has('bastidores/fita/rubricas'),
    [...kv2.chaves]);
  ok('foram precisas mais listagens do que uma — é a passagem que as encontrou',
    kv2.listagens > 4, kv2.listagens);

  // ── 3. Uma chave que SOBRA de verdade continua a reprovar ─────────────────
  console.log('\n3. DELETE recusado: sobra de verdade, e o expurgo REPROVA');
  const kv3 = criarKv({ chaves: CHAVES, atraso: 0, recusaApagar: ['bastidores/fita/turmas'] });
  const r3 = await apagarChavesDeEscola({
    token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita', pausa: SEM_PAUSA,
  });
  igual('15 apagadas de 16', [r3.apagadas, r3.total], [15, 16]);
  igual('restantes = 1', r3.restantes, 1);
  igual('ok = false', r3.ok, false);
  igual('NÃO é leitura atrasada', r3.leituraAtrasada, false);
  igual('a chave que ficou é nomeada', r3.ficaram, ['bastidores/fita/turmas']);
  ok('o prefixo que sobrou diz qual chave ficou',
    r3.porPrefixo.some((p) => p.restantes === 1 && p.sobrou[0] === 'bastidores/fita/turmas'),
    r3.porPrefixo);
  ok('a chave está mesmo lá', kv3.chaves.has('bastidores/fita/turmas'));

  // ── 4. Chave de OUTRA escola no mesmo namespace ───────────────────────────
  console.log('\n4. Outra escola no mesmo namespace: não é falha desta');
  const alheia = ['valse/x', 'bastidores/valse/turmas'];
  const kv4 = criarKv({ chaves: CHAVES.concat(alheia), atraso: 1 });
  const r4 = await apagarChavesDeEscola({
    token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita', pausa: SEM_PAUSA,
  });
  igual('restantes = 0 sob os prefixos da escola', r4.restantes, 0);
  igual('…e ok = true', r4.ok, true);
  ok('a chave da outra escola continua lá', kv4.chaves.has('bastidores/valse/turmas'));
  ok('…e as duas aparecem no relato do namespace',
    r4.namespace.antes === 18, r4.namespace);

  // ── 5. Sem atraso nem omissão, o caminho normal não muda ───────────────────
  console.log('\n5. Sem atraso, o relatório é o de sempre');
  const kv5 = criarKv({ chaves: CHAVES, atraso: 0 });
  const r5 = await apagarChavesDeEscola({
    token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita', pausa: SEM_PAUSA,
  });
  igual('restantes = 0', r5.restantes, 0);
  igual('ok = true', r5.ok, true);
  igual('leituraAtrasada = false', r5.leituraAtrasada, false);
  ok('nenhum índice obsoleto', r5.restantesNoIndice === 0, r5.restantesNoIndice);
  ok('as passagens extra não fizeram trabalho extra: 8 listagens (4 por prefixo)',
    kv5.listagens === 8, kv5.listagens);
  igual('o KV ficou vazio', kv5.chaves.size, 0);

  // ── 6. «Não sei» nunca vira «acabou» ──────────────────────────────────────
  console.log('\n6. Se a leitura não puder ser feita, o expurgo NÃO se declara completo');
  global.fetch = async (url, opt) => {
    const u = new URL(url);
    const metodo = (opt && opt.method) || 'GET';
    const partes = u.pathname.split('/');
    if (metodo === 'GET' && partes.indexOf('keys') !== -1) {
      return {
        ok: true, status: 200,
        json: async () => ({ success: true, result: [{ name: 'fita/x' }], result_info: { list_complete: true } }),
      };
    }
    if (metodo === 'GET' && partes.indexOf('values') !== -1) {
      return { ok: false, status: 500, json: async () => ({ success: false }) }; // não sei
    }
    return { ok: true, status: 200, json: async () => ({ success: true }) };
  };
  const r6 = await apagarChavesDeEscola({
    token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita', pausa: SEM_PAUSA,
  });
  igual('ok = false — não se finge sucesso', r6.ok, false);
  igual('restantes = 0 (nada provou que ficou)', r6.restantes, 0);
  ok('…mas `semConferir` diz que houve chave sem resposta', r6.semConferir > 0, r6.semConferir);

  // ── 7. O namespace de uma escola não declarada ────────────────────────────
  console.log('\n7. Sem namespace declarado, não se inventa um');
  criarKv({ chaves: CHAVES, atraso: 0 });
  const r7 = await apagarChavesDeEscola({
    token: 'x', accountId: 'c', namespaceId: null, slug: 'fita', pausa: SEM_PAUSA,
  });
  igual('ok = true — não havia o que limpar', r7.ok, true);
  igual('…e o relatório diz por quê', /não declara namespace/.test(r7.nota || ''), true);
  const r7b = await apagarChavesDeEscola({ token: 'x', accountId: 'c', slug: 'fita', pausa: SEM_PAUSA });
  igual('sem `namespaceId`, é falha declarada (não «não havia»)', r7b.ok, false);

  // ── 8. A página: diz «foi índice», e mostra o que ficou ───────────────────
  console.log('\n8. A página distingue índice atrasado de dado que ficou');
  const raiz = path.join(__dirname, '..');
  const pagina = fs.readFileSync(path.join(raiz, 'raiz', 'index.html'), 'utf8');
  const servidor = fs.readFileSync(path.join(raiz, 'motor', 'servidor', 'raiz.js'), 'utf8');
  ok('a página lê o `leituraAtrasada` do relatório', pagina.includes('leituraAtrasada'));
  ok('a página sabe nomear as chaves que ficaram', /ficaram/.test(pagina));
  ok('a página não manda tirar linhas dos arquivos locais', !pagina.includes('tire estas linhas'));
  ok('o servidor não produz mais essa lista', !/linhasLocais/.test(servidor));

  // ── 9. O contrato da exclusão total continua o de antes ───────────────────
  console.log('\n9. A ordem da exclusão (subdomínio → script → KV) não mudou');
  ok('os dois prefixos da escola são `slug/` e `bastidores/slug/`',
    JSON.stringify(prefixosDaEscola('fita')) === JSON.stringify(['fita/', 'bastidores/fita/']));
  const chamadas = [];
  global.fetch = async (url, opt) => {
    const u = new URL(url);
    const metodo = (opt && opt.method) || 'GET';
    chamadas.push(metodo + ' ' + u.pathname.replace('/client/v4/accounts/c', ''));
    if (metodo === 'GET' && u.pathname.indexOf('/keys') !== -1) {
      return { ok: true, status: 200, json: async () => ({ success: true, result: [], result_info: { list_complete: true } }) };
    }
    return { ok: true, status: 200, json: async () => ({ success: true }) };
  };
  const r9 = await excluirEscola({
    token: 'x', accountId: 'c', slug: 'fita', worker: 'fita',
    kv: { namespaceId: NS, prefixos: prefixosDaEscola('fita') },
  });
  /* A ORDEM É RELATIVA, E NÃO ABSOLUTA (22/11/2026).
   *
   * Esta secção fixava `chamadas[0]` e `chamadas[1]` — e ficou vermelha no dia em que a limpeza do
   * ENDEREÇO próprio entrou (`desligarDominio`, 13/11/2026): ela corre antes, e a primeira chamada
   * passou a ser um `GET /client/v4/zones`. A ordem que a prova quer dizer nunca foi «o índice 0
   * da lista» — é «o subdomínio sai antes do script, e o script antes do KV». Medir posição
   * absoluta numa lista que ganha passos é medir o dia em que a prova foi escrita. */
  const iSub = chamadas.findIndex((c) => /^DELETE \/workers\/scripts\/fita\/subdomain$/.test(c));
  const iScript = chamadas.findIndex((c) => /^DELETE \/workers\/scripts\/fita$/.test(c));
  const iKv = chamadas.findIndex((c) => /\/storage\/kv\/namespaces\//.test(c));
  ok('o subdomínio é removido antes do script', iSub !== -1 && iScript !== -1 && iSub < iScript,
    { iSub, iScript, chamadas });
  ok('…e o KV é limpo depois dos dois',
    iSub !== -1 && iScript !== -1 && iKv !== -1 && iKv > iScript, { iSub, iScript, iKv });
  ok('a limpeza do ENDEREÇO próprio vem antes de tudo o que apaga — ela é a que desliga o tráfego',
    chamadas.findIndex((c) => /^GET \/client\/v4\/zones/.test(c) || /^DELETE .*\/zones\//.test(c))
      < iSub, chamadas.slice(0, 3));
  igual('o relatório traz as três etapas', [!!r9.subdominio, !!r9.script, !!r9.kv], [true, true, true]);

  global.fetch = fetchOriginal;
  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' asserção(ões) de ' + n + '.');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções, 0 falha(s).');
})();
