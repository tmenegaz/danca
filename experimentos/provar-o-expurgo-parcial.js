'use strict';

/*
 * provar-o-expurgo-parcial.js — a escola que sai devendo leva o contrato, e só o contrato (27/11/2026).
 *
 * O QUE ELA PEDIU, ao pé da letra:
 *
 *   «A gente precisa de um expurgo parcial para poder liberar espaço. Assim a gente ganha espaço e faz
 *   o registro. Mas essas informações que são importantes para fazer a cobrança […] o contrato, a
 *   dívida e os dados da escola não podem ser expurgados, nesse caso de inadimplência.»
 *
 * O DEFEITO QUE ISTO FECHA, e ele é um beco sem saída nos dois sentidos — medido a 27/11/2026:
 *
 *   · o expurgo apaga por prefixo, e `prefixosDaEscola` alcança `bastidores/<slug>/comercial`;
 *   · sem o contrato, `/api/financeiro/mensalidade` recusa com «escola desconhecida: não tem
 *     contrato» — a dívida fica IMPOSSÍVEL de registar pelo sistema;
 *   · e a recriação fica travada pela dívida (a regra de hoje), que já não tem como ser paga.
 *
 *   Ou seja: antes desta correcção, uma escola expurgada devendo ficava permanente e
 *   irrecuperavelmente bloqueada.
 *
 * O QUE ESTA PROVA MEDE, na ROTA VERDADEIRA (`POST /api/apagar-escola`) com o Cloudflare e o GitHub
 * falsos — e o KV do fake é O MESMO mapa que a aplicação lê, senão o teste mediria dois mundos:
 *
 *   A. COM DÍVIDA — o contrato sobrevive, o resto sai (o espaço é libertado), o relatório nomeia o
 *      que ficou, o elo diz que foi parcial, e o pagamento passa a ser registável. É o efeito útil
 *      inteiro, ponta a ponta.
 *   B. SEM DÍVIDA — o controlo, e é ele que impede o parcial de ser a regra: o contrato sai, como
 *      sempre saiu, e o elo não ganha o campo. Sem esta metade, uma prova verde diria apenas que a
 *      chave sobreviveu por acaso.
 *
 * O QUE NÃO SE MEDE AQUI: a auditoria de proveniência passa `forcar` (o repositório falso não tem
 * âncoras). Ela é ortogonal a esta decisão, e tem provas próprias.
 *
 *   node experimentos/provar-o-expurgo-parcial.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));

const AUTORIZACAO = 'Basic ' + Buffer.from('tmenegaz:segredo').toString('base64');
const iso = (ms) => new Date(ms).toISOString();

let n = 0;
let falhas = 0;
function conferir(rotulo, condicao, detalhe) {
  n += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/** Um KV de bolso — a MESMA forma que o do Worker, com o mapa à vista. */
function kvDeBolso(pares) {
  const dados = new Map(Object.entries(pares || {}));
  return {
    dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
  };
}

const ELO = {
  escola: 'breu', worker: 'breu', criado_em: '2026-06-10T12:00:00Z',
  professor: { slug: 'demi-plie', nome: 'Demi Plié' }, responsavel: 'Demi Plié', ciclo: '01',
  arquivos: [], expurgo: [{ em: '2026-08-01T00:00:00Z', motivo: 'anterior', apagado: [] }],
};
const CONFIG = { name: 'breu', kv_namespaces: [{ binding: 'PADD_KV', id: 'ns-1' }] };
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');

/**
 * O GitHub e o Cloudflare, falsos — e o KV do Cloudflare é o MESMO mapa do KV da aplicação. Não é
 * conveniência: é a fidelidade. Em produção, o namespace do Worker é onde a escola escreve, e é de
 * lá que a rota de pagamento lê `bastidores/<slug>/comercial`. Dois mapas aqui esconderiam
 * exactamente o defeito que esta prova existe para apanhar.
 */
function nuvemFalsa(mapaDoKv) {
  const estado = { pedidos: [], arvore: null };
  estado.fetch = async (url, init) => {
    const u = String(url);
    const m = (init && init.method) || 'GET';
    estado.pedidos.push({ m, u });
    const j = (o, st) => ({ ok: (st || 200) < 300, status: st || 200, json: async () => o, text: async () => JSON.stringify(o) });

    if (u.indexOf('api.github.com') !== -1) {
      if (/\/git\/ref\/heads\//.test(u)) return j({ object: { sha: 'c0' } });
      if (/\/git\/commits\/c0$/.test(u)) return j({ tree: { sha: 't0' } });
      if (/\/git\/trees\//.test(u)) {
        return j({ sha: 't0', truncated: false, tree: [
          { path: 'professores/demi-plie/ciclos/ciclo-01-breu.conf', type: 'blob' },
          { path: 'professores/demi-plie/ciclos/ciclo-01-breu/index.html', type: 'blob' },
          { path: 'escola/breu/indice.json', type: 'blob' },
        ] });
      }
      if (/\/git\/trees$/.test(u) && m === 'POST') {
        estado.arvore = JSON.parse((init && init.body) || '{}');
        return j({ sha: 't1' });
      }
      if (/\/git\/commits$/.test(u) && m === 'POST') return j({ sha: 'c1' });
      if (/\/git\/refs\/heads\//.test(u) && m === 'PATCH') return j({ object: { sha: 'c1' } });
      const mc = /\/contents\/([^?]+)/.exec(u);
      if (mc) {
        const caminho = decodeURIComponent(mc[1]);
        if (caminho === 'escola/breu/indice.json') return j({ content: b64(JSON.stringify(ELO)), encoding: 'base64' });
        if (caminho === 'wrangler.breu.jsonc') return j({ content: b64(JSON.stringify(CONFIG)), encoding: 'base64' });
        return j({ message: 'Not Found' }, 404);
      }
      return j({ message: 'não mapeado' }, 404);
    }

    if (u.indexOf('api.cloudflare.com') !== -1) {
      if (u.indexOf('/keys') !== -1) {
        const prefixo = new URL(u).searchParams.get('prefix') || '';
        return j({ success: true, result: [...mapaDoKv.keys()].filter((k) => k.startsWith(prefixo)).map((name) => ({ name })), result_info: { list_complete: true } });
      }
      if (u.indexOf('/values/') !== -1) {
        const chave = decodeURIComponent(u.split('/values/')[1]);
        if (m === 'DELETE') { mapaDoKv.delete(chave); return j({ success: true }); }
        if (!mapaDoKv.has(chave)) return { ok: false, status: 404, json: async () => ({}), text: async () => 'nf' };
        return { ok: true, status: 200, json: async () => ({}), text: async () => mapaDoKv.get(chave) };
      }
      if (/\/dns_records\?/.test(u)) return j({ success: true, result: [] });
      if (/\/workers\/routes$/.test(u)) return j({ success: true, result: [] });
      if (/\/zones\?/.test(u)) return j({ success: true, result: [{ id: 'z-1', name: 'padd.com.br' }] });
      return j({ success: true, result: null });
    }
    return j({}, 404);
  };
  return estado;
}

/** Um cenário completo: o KV da escola (com contrato e dado), o livro, e a nuvem falsa. */
function cenario({ comDivida }) {
  const agora = Date.now();
  const kv = kvDeBolso({
    'expurgo/regime-de-teste-desde': iso(agora - 60 * 60000),
    'bastidores/breu/comercial': JSON.stringify({
      estado: 'suspensa', desabilitadaEm: iso(agora - 6 * 60000),
      plano: 'basico', planoNome: 'Básico', valorCentavos: 6990,
      /* COM dívida: a adesão é de 90 dias atrás, e há meses vencidos. SEM dívida: a escola acabou
       * de ser criada, e o único mês é o que ainda não venceu. */
      criadoEm: comDivida ? iso(agora - 90 * 24 * 3600000) : iso(agora - 2000),
    }),
    'bastidores/breu/turmas': '[]',
    'bastidores/breu/alunos': '[]',
    'breu/envelope/anamnese-20261123-1055.json': '{"resumo":{"aluna":"Vavá"}}',
    'bastidores/outra-escola/comercial': '{"plano":"basico"}',
    'financeiro/mensalidades': JSON.stringify({
      lista: comDivida
        ? [{ escola: 'breu', mes: '2026-10', status: 'parcial', valorCentavos: 6990, recebidoCentavos: 3000, em: iso(agora - 50 * 24 * 3600000) }]
        : [],
      atualizadoEm: 'x',
    }),
  });
  const nuvem = nuvemFalsa(kv.dados);
  return { kv, nuvem, agora };
}

/** O expurgo, pela ROTA VERDADEIRA. `forcar` porque o repositório falso não tem âncoras. */
async function expurgar(ctx) {
  const original = globalThis.fetch;
  globalThis.fetch = ctx.nuvem.fetch;
  try {
    const res = await raiz.fetch(new Request('https://danca.padd.com.br/api/apagar-escola', {
      method: 'POST',
      headers: { Authorization: AUTORIZACAO, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        escola: 'breu', confirmacao: 'breu', motivo: 'prova', forcar: true, motivoDoForcar: 'prova',
      }),
    }), {
      SENHA_RAIZ: 'segredo', PADD_KV: ctx.kv, GITHUB_TOKEN: 'gh', CLOUDFLARE_API_TOKEN: 'cf', ASSETS: null,
    });
    return { status: res.status, corpo: await res.json().catch(() => ({})) };
  } finally { globalThis.fetch = original; }
}

/** O pagamento, pela rota verdadeira — é o que prova que a dívida ficou COBRÁVEL. */
async function pagar(ctx, mes) {
  const original = globalThis.fetch;
  globalThis.fetch = ctx.nuvem.fetch;
  try {
    const res = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/mensalidade', {
      method: 'POST',
      headers: { Authorization: AUTORIZACAO, 'Content-Type': 'application/json' },
      body: JSON.stringify({ escola: 'breu', mes }),
    }), { SENHA_RAIZ: 'segredo', PADD_KV: ctx.kv, GITHUB_TOKEN: 'gh', ASSETS: null });
    return { status: res.status, corpo: await res.json().catch(() => ({})) };
  } finally { globalThis.fetch = original; }
}

/** O elo que a rota escreveu no commit — lido da árvore que ela enviou ao Git. */
function eloDaArvore(nuvem) {
  const achado = (nuvem.arvore && nuvem.arvore.tree || [])
    .find((t) => /escola\/breu\/indice\.json/.test(t.path || ''));
  if (!achado || !achado.content) return null;
  try { return JSON.parse(achado.content); } catch (erro) { return null; }
}

(async () => {
  console.log('A. COM DÍVIDA — o contrato fica, o espaço é libertado, e a dívida continua cobrável');
  {
    const ctx = cenario({ comDivida: true });
    const r = await expurgar(ctx);

    conferir('A1. a rota aceita o expurgo (não é a escola que se recusa a sair)',
      r.status === 200 && r.corpo.ok === true, { status: r.status, ok: r.corpo.ok, erro: r.corpo.erro });
    conferir('A2. a dívida foi encontrada ANTES de apagar, e é dita no relatório',
      Boolean(r.corpo.parcial && r.corpo.parcial.divida && r.corpo.parcial.divida.tem),
      r.corpo.parcial && r.corpo.parcial.divida);
    conferir('A3. o CONTRATO sobrevive ao expurgo',
      ctx.kv.dados.has('bastidores/breu/comercial'));
    conferir('A4. o dado que ocupa espaço SAI — as turmas, as alunas e o envelope',
      !ctx.kv.dados.has('bastidores/breu/turmas')
        && !ctx.kv.dados.has('bastidores/breu/alunos')
        && !ctx.kv.dados.has('breu/envelope/anamnese-20261123-1055.json'),
      [...ctx.kv.dados.keys()]);
    conferir('A5. e o que é de OUTRA escola não é tocado',
      ctx.kv.dados.has('bastidores/outra-escola/comercial'));
    conferir('A6. o relatório do KV NOMEIA a chave preservada — e que ela existia',
      Boolean(r.corpo.cloudflare && r.corpo.cloudflare.kv
        && Array.isArray(r.corpo.cloudflare.kv.preservadas)
        && r.corpo.cloudflare.kv.preservadas.some((p) => p.chave === 'bastidores/breu/comercial' && p.existia === true)),
      r.corpo.cloudflare && r.corpo.cloudflare.kv && r.corpo.cloudflare.kv.preservadas);
    conferir('A7. e o expurgo declara-se COMPLETO — a preservada não conta como falha',
      Boolean(r.corpo.cloudflare && r.corpo.cloudflare.kv && r.corpo.cloudflare.kv.ok === true),
      r.corpo.cloudflare && r.corpo.cloudflare.kv && r.corpo.cloudflare.kv.ok);

    const elo = eloDaArvore(ctx.nuvem);
    const ultimo = elo && Array.isArray(elo.expurgo) ? elo.expurgo[elo.expurgo.length - 1] : null;
    conferir('A8. o ELO diz que foi parcial, e o que guardou — senão «guardou porque devia» e «falhou a meio» confundem-se',
      Boolean(ultimo && ultimo.parcial === true
        && Array.isArray(ultimo.preservado) && ultimo.preservado[0] === 'bastidores/breu/comercial'),
      ultimo && { parcial: ultimo.parcial, preservado: ultimo.preservado });

    /* O EFEITO QUE JUSTIFICA TUDO: o pagamento, pela rota verdadeira, sobre o KV onde o expurgo
     * acabou de correr. Sem o contrato, esta chamada respondia 400 «escola desconhecida». */
    const p = await pagar(ctx, '2026-10');
    conferir('A9. e o pagamento PASSA a ser registável — era o beco sem saída',
      p.status === 200 && p.corpo.ok === true, { status: p.status, erro: p.corpo.erro });
  }

  console.log('');
  console.log('B. SEM DÍVIDA — o controlo: o contrato sai, como sempre saiu');
  {
    const ctx = cenario({ comDivida: false });
    const r = await expurgar(ctx);

    conferir('B1. a rota aceita o expurgo', r.status === 200 && r.corpo.ok === true,
      { status: r.status, erro: r.corpo.erro });
    conferir('B2. não há dívida — e o relatório diz isso, em vez de presumir',
      Boolean(r.corpo.parcial && r.corpo.parcial.divida && r.corpo.parcial.divida.tem === false),
      r.corpo.parcial && r.corpo.parcial.divida);
    conferir('B3. o CONTRATO sai — a escola que saiu em dia não leva o contrato para trás',
      !ctx.kv.dados.has('bastidores/breu/comercial'), [...ctx.kv.dados.keys()]);
    conferir('B4. e a lista de preservadas é vazia',
      Boolean(r.corpo.parcial && Array.isArray(r.corpo.parcial.preservar)
        && r.corpo.parcial.preservar.length === 0),
      r.corpo.parcial && r.corpo.parcial.preservar);

    const elo = eloDaArvore(ctx.nuvem);
    const ultimo = elo && Array.isArray(elo.expurgo) ? elo.expurgo[elo.expurgo.length - 1] : null;
    conferir('B5. e o elo NÃO ganha o campo — um expurgo completo não sugere a ninguém que a escola devia',
      Boolean(ultimo) && ultimo.parcial === undefined && ultimo.preservado === undefined,
      ultimo && { parcial: ultimo.parcial, preservado: ultimo.preservado });
  }

  console.log('');
  console.log('C. A CHAVE QUE SE PEDE PARA GUARDAR E NUNCA EXISTIU');
  {
    /* Uma escola sem contrato gravado (nunca teve plano) e com um registo parcial no livro: há
     * dívida a registar, mas não há contrato a preservar. O expurgo não pode falhar por isso — e o
     * relatório diz `existia: false` em vez de fingir que guardou alguma coisa. */
    const agora = Date.now();
    const kv = kvDeBolso({
      'expurgo/regime-de-teste-desde': iso(agora - 60 * 60000),
      'bastidores/breu/comercial': JSON.stringify({ estado: 'suspensa', desabilitadaEm: iso(agora - 6 * 60000) }),
      'bastidores/breu/turmas': '[]',
      'financeiro/mensalidades': JSON.stringify({ lista: [
        { escola: 'breu', mes: '2026-10', status: 'parcial', valorCentavos: 6990, recebidoCentavos: 1000, em: iso(agora - 50 * 24 * 3600000) },
      ], atualizadoEm: 'x' }),
    });
    const ctx = { kv, nuvem: nuvemFalsa(kv.dados), agora };
    const r = await expurgar(ctx);
    conferir('C1. sem plano no contrato, não há o que preservar — e o expurgo não falha por isso',
      r.status === 200 && r.corpo.ok === true, { status: r.status, erro: r.corpo.erro });
    conferir('C2. as turmas saem, e o registo comercial sem plano também',
      !ctx.kv.dados.has('bastidores/breu/turmas') && !ctx.kv.dados.has('bastidores/breu/comercial'),
      [...ctx.kv.dados.keys()]);
  }

  console.log('');
  console.log(falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções: a escola que sai devendo leva só o contrato, o espaço é libertado, o elo diz que foi parcial e o pagamento volta a ser registável — e a que sai em dia continua a sair inteira.'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
