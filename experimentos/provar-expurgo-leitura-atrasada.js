#!/usr/bin/env node
'use strict';

/**
 * provar-expurgo-leitura-atrasada.js — o expurgo não pode acusar «sobraram N chaves» quando o
 * que sobrou é só a listagem do KV a chegar atrasada (19/10/2026).
 *
 * **O que aconteceu.** Ao expurgar a escola `fita`, a página «Sistema Lastro» respondeu:
 *
 *     KV: 16 de 16 chave(s) apagada(s), em 2 prefixo(s).
 *        fita/            → 8 de 8 · sobraram 0
 *        bastidores/fita/ → 8 de 8 · sobraram 1
 *     ATENÇÃO: sobraram 1 chave(s) no sistema — este expurgo NÃO está completo.
 *        o namespace ainda tem 0 chave(s) (tinha 16) — se alguma não for de outra escola, ela ficou.
 *
 * As duas últimas linhas se contradizem: o namespace inteiro estava vazio, e 8 + 8 = 16 — não
 * havia chave nenhuma para sobrar. A causa é a consistência eventual do KV: um `DELETE` pode
 * demorar até ~60 s para desaparecer de um `list`. A reconferência por prefixo corria
 * milissegundos depois do último DELETE e lia o estado anterior.
 *
 * **A correção, e o que esta prova fixa:**
 *
 *   1. quando a reconferência ainda vê chave, ela é repetida UMA vez depois de uma pausa;
 *   2. o NAMESPACE é a autoridade: a listagem sem prefixo, feita por último, diz o estado final.
 *      Namespace vazio ⇒ `restantes = 0` por prova, e `ok` verdadeiro;
 *   3. o número que a listagem viu não se perde: fica em `restantesNaListagem`, e o relatório
 *      marca `leituraAtrasada` — para a página poder dizer «foi atraso», e não «falhou»;
 *   4. uma chave que SOBRA de verdade (a que o `DELETE` recusa) continua a reprovar o expurgo:
 *      a correção não pode virar um jeito de esconder falha;
 *   5. chave de OUTRA escola no namespace compartilhado não é atraso nem falha desta escola.
 *
 * O `fetch` é falso: esta prova não toca na Cloudflare, e por isso corre em qualquer máquina —
 * a `provar-expurgo-kv.js` precisa de `CLOUDFLARE_API_TOKEN` e não roda sem ele.
 *
 *   uso: node experimentos/provar-expurgo-leitura-atrasada.js
 */

const fs = require('fs');
const path = require('path');
const { apagarChavesDeEscola } = require('../motor/servidor/expurgar-escola.js');

let falhas = 0;
function ok(titulo, condicao, detalhe) {
  if (condicao) {
    console.log('  ok     ' + titulo);
  } else {
    falhas++;
    console.log('  FALHA  ' + titulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  }
}
function igual(titulo, obtido, esperado) {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  ok(titulo + (a === b ? '' : '  (obtido ' + a + ', esperado ' + b + ')'), a === b, { obtido, esperado });
}

const fetchOriginal = global.fetch;

/**
 * Um KV falso com CONSISTÊNCIA EVENTUAL: `chaves` é o estado real; `visiveis` é o que a
 * listagem devolve. `atraso` = quantas listagens por prefixo ainda mostram a chave apagada.
 * `recusaApagar` = chaves cujo DELETE falha (o caso em que sobra de verdade).
 */
function criarKv({ chaves = [], atraso = 0, recusaApagar = [] } = {}) {
  const estado = {
    chaves: new Set(chaves),
    // nome → quantas listagens AINDA o mostram. O contador é por chave, e não global: um atraso
    // global faria a primeira relistagem «curar» a segunda, que é um artefacto do falso e não
    // do KV.
    fantasmas: new Map(),
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

    if (metodo === 'DELETE' && iValores !== -1) {
      const nome = decodeURIComponent(partes[iValores + 1]);
      estado.deletes++;
      if (recusaApagar.includes(nome)) {
        return { ok: false, status: 403, json: async () => ({ success: false, errors: [{ message: 'recusado' }] }) };
      }
      estado.chaves.delete(nome);
      // A listagem passa a mentir por um tempo: é o que o KV real faz.
      if (atraso > 0) estado.fantasmas.set(nome, atraso);
      return responder({ success: true, result: null });
    }

    if (metodo === 'GET' && iChaves !== -1) {
      estado.listagens++;
      const prefixo = u.searchParams.get('prefix') || '';
      const vivas = [...estado.chaves].filter((c) => c.startsWith(prefixo));
      // O fantasma só aparece na listagem POR PREFIXO — é a que atrasa na vida real; a do
      // namespace inteiro (prefixo vazio) é a que a correção usa como autoridade.
      const fantasmas = [];
      if (prefixo !== '') {
        for (const [nome, restantes] of [...estado.fantasmas]) {
          if (!nome.startsWith(prefixo) || restantes <= 0) continue;
          fantasmas.push(nome);
          if (restantes - 1 <= 0) estado.fantasmas.delete(nome);
          else estado.fantasmas.set(nome, restantes - 1);
        }
      }
      return responder({
        success: true,
        result: [...vivas, ...fantasmas].map((name) => ({ name })),
        result_info: { count: vivas.length + fantasmas.length, list_complete: true },
      });
    }

    return { ok: false, status: 404, json: async () => ({ success: false, errors: [{ message: 'rota' }] }) };
  };

  return estado;
}

const NS = 'ns-de-ensaio';
const CHAVES = [
  'fita/a', 'fita/b', 'fita/c', 'fita/d', 'fita/e', 'fita/f', 'fita/g', 'fita/h',
  'bastidores/fita/turmas', 'bastidores/fita/alunas', 'bastidores/fita/curadorias',
  'bastidores/fita/professores', 'bastidores/fita/turma-conteudos', 'bastidores/fita/vocabulario',
  'bastidores/fita/rubricas', 'bastidores/fita/aparencia',
];

(async () => {
  console.log('EXPURGO — a listagem atrasada não é chave esquecida\n');

  // ── 1. O caso real: tudo apagado, mas a listagem por prefixo ainda vê ──────
  console.log('1. O caso da `fita`: 8 de 8 apagadas, e a reconferência ainda via 1');
  const kv1 = criarKv({ chaves: CHAVES, atraso: 2 });
  const r1 = await apagarChavesDeEscola({ token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita' });
  igual('16 apagadas de 16', [r1.apagadas, r1.total], [16, 16]);
  igual('dois prefixos', r1.porPrefixo.length, 2);
  ok('a reconferência foi repetida nos prefixos que ainda viam chave',
    r1.porPrefixo.every((p) => p.relisted === true), r1.porPrefixo.map((p) => p.relisted));
  igual('restantes = 0 (o namespace é a autoridade)', r1.restantes, 0);
  igual('ok = true', r1.ok, true);
  igual('marcado como leitura atrasada', r1.leituraAtrasada, true);
  ok('…e o número que a listagem viu não se perdeu',
    typeof r1.restantesNaListagem === 'number', r1.restantesNaListagem);
  igual('o namespace ficou vazio', [r1.namespace.antes, r1.namespace.depois], [16, 0]);
  igual('nenhuma chave ficou', kv1.chaves.size, 0);

  // ── 2. Uma chave que SOBRA de verdade continua a reprovar ─────────────────
  console.log('\n2. DELETE recusado: sobra de verdade, e o expurgo REPROVA');
  const kv2 = criarKv({ chaves: CHAVES, atraso: 0, recusaApagar: ['bastidores/fita/turmas'] });
  const r2 = await apagarChavesDeEscola({ token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita' });
  igual('15 apagadas de 16', [r2.apagadas, r2.total], [15, 16]);
  igual('restantes = 1', r2.restantes, 1);
  igual('ok = false', r2.ok, false);
  igual('NÃO é leitura atrasada', r2.leituraAtrasada, false);
  ok('o prefixo que sobrou diz qual chave ficou',
    r2.porPrefixo.some((p) => p.restantes === 1 && p.sobrou[0] === 'bastidores/fita/turmas'),
    r2.porPrefixo);
  ok('a chave está mesmo lá', kv2.chaves.has('bastidores/fita/turmas'));

  // ── 3. Chave de OUTRA escola no namespace compartilhado ───────────────────
  console.log('\n3. Outra escola no mesmo namespace: não é falha desta');
  const alheia = ['valse/x', 'bastidores/valse/turmas'];
  const r3 = await apagarChavesDeEscola({
    token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita',
    prefixos: ['fita/', 'bastidores/fita/'],
  });
  const kv3 = criarKv({ chaves: CHAVES.concat(alheia), atraso: 1 });
  const r3b = await apagarChavesDeEscola({ token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita' });
  igual('(com as alheias) restantes = 0 sob os prefixos da escola', r3b.restantes, 0);
  igual('…e ok = true', r3b.ok, true);
  igual('o namespace ainda tem 2 chaves (as da outra escola)', r3b.namespace.depois, 2);
  ok('a chave da outra escola continua lá', kv3.chaves.has('bastidores/valse/turmas'));
  void r3;

  // ── 4. Sem atraso nenhum, o caminho normal não muda ───────────────────────
  console.log('\n4. Sem atraso, o relatório é o de sempre');
  const kv4 = criarKv({ chaves: CHAVES, atraso: 0 });
  const r4 = await apagarChavesDeEscola({ token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita' });
  igual('restantes = 0', r4.restantes, 0);
  igual('ok = true', r4.ok, true);
  igual('leituraAtrasada = false', r4.leituraAtrasada, false);
  ok('nenhuma reconferência extra', r4.porPrefixo.every((p) => p.relisted === false));
  igual('o KV ficou vazio', kv4.chaves.size, 0);

  // ── 5. O namespace ilegível NÃO vira «está tudo bem» ──────────────────────
  console.log('\n5. Se o namespace não puder ser lido, a listagem volta a mandar');
  global.fetch = async (url, opt) => {
    const u = new URL(url);
    if (u.pathname.indexOf('/keys') !== -1) {
      const prefixo = u.searchParams.get('prefix') || '';
      if (prefixo === '') {
        return { ok: false, status: 500, json: async () => ({ success: false, errors: [{ message: 'sem leitura' }] }) };
      }
      // A listagem por prefixo continua a ver a chave que o DELETE recusou.
      return {
        ok: true, status: 200,
        json: async () => ({
          success: true,
          result: (opt && opt.method === 'DELETE' ? [] : [{ name: prefixo + 'x' }]),
          result_info: { list_complete: true },
        }),
      };
    }
    return { ok: true, status: 200, json: async () => ({ success: true }) };
  };
  const r5 = await apagarChavesDeEscola({ token: 'x', accountId: 'c', namespaceId: NS, slug: 'fita' });
  igual('ok = false (não se finge sucesso)', r5.ok, false);
  ok('restantes > 0 — a listagem não é descartada quando o namespace falha', r5.restantes > 0, r5.restantes);
  igual('leituraAtrasada = false', r5.leituraAtrasada, false);
  igual('o namespace diz que não listou', r5.namespace.listou, false);

  // ── 6. A página sabe dizer «foi atraso» — e não pede o que não existe ─────
  // O motor marcar `leituraAtrasada` não serve de nada se a página continuar a mostrar a
  // contradição («sobraram 1» + «o namespace tem 0»). E o relatório pediu, no expurgo da
  // `fita`, que se tirassem linhas de dois arquivos locais que já não as tinham: `criar-
  // escola.sh` e `provisionar-escola.js` não escrevem em nenhum dos dois, e nenhum dos dois
  // tinha linha ativa. Instrução que manda tirar o que não está é ruído com aparência de
  // tarefa — e o Worker não pode saber se está lá, porque os arquivos não são dele.
  console.log('\n6. A página diz «foi atraso», e não manda tirar o que não existe');
  const raiz = path.join(__dirname, '..');
  const pagina = fs.readFileSync(path.join(raiz, 'raiz', 'index.html'), 'utf8');
  const servidor = fs.readFileSync(path.join(raiz, 'motor', 'servidor', 'raiz.js'), 'utf8');
  ok('a página lê o `leituraAtrasada` do relatório', pagina.includes('kv.leituraAtrasada'));
  ok('…e explica a diferença entre as duas listagens',
    pagina.includes('listagem do KV a chegar atrasada'));
  ok('a página não manda mais tirar linhas dos arquivos locais',
    !pagina.includes('tire estas linhas'));
  ok('o servidor não produz mais essa lista', !/linhasLocais/.test(servidor));

  global.fetch = fetchOriginal;
  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — 0 falha(s).');
})();
