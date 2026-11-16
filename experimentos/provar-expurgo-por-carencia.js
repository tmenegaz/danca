#!/usr/bin/env node
'use strict';

/*
 * provar-expurgo-por-carencia.js — o expurgo automático pergunta ao SISTEMA, e não a um ficheiro
 * escrito à mão (16/11/2026).
 *
 * O QUE ELA PEDIU, e é a mudança inteira:
 *
 *   «Ajusta o expurgo automático para ler `desabilitadaEm` + 3 meses em vez de ler o índice antigo
 *   (`escolas-habilitadas.json`, 3 minutos). para fim de teste coloca `desabilitadaEm` + 5
 *   minutos. depois a gente muda para 3 meses quando for produção de verdade, com escolas de
 *   verdade.»
 *
 * O QUE HAVIA. A varredura (`expurgar`, no Cron de cinco em cinco minutos) percorria
 * `raiz/escolas-habilitadas.json` — um ficheiro versionado com `{ habilitada: false, desde: … }`
 * escrito À MÃO — e comparava com um prazo fixo de três minutos. Duas consequências, e as duas
 * medidas hoje: o ficheiro estava VAZIO (só a `_nota`), portanto a varredura não apagava escola
 * nenhuma em silêncio; e a data de onde o prazo contava era digitada por alguém, que é o oposto
 * de «a partir dessa data conta três meses» — a data dela é a do dia em que desabilitou.
 *
 * O QUE ESTA PROVA MEDE, com o KV de bolso e as duas metades que falam com o mundo injectadas
 * (Cloudflare e GitHub), porque uma prova que precisa de rede só corre em produção:
 *
 *   A. a lista de escolas vem do mapa do KV e do índice do acervo — e a ausência de um deles é
 *      DITA no relatório, não escondida;
 *   B. das escolas conhecidas, só a `suspensa` com carência vencida é apagada;
 *   C. a carência conta do `desabilitadaEm` (e o relatório diz quanto falta a quem ainda espera);
 *   D. proveniência quebrada POUPA a escola — a varredura automática não é mais permissiva do que
 *      o botão, e não tem `forcar`;
 *   E. a régua é a de teste (5 minutos) e a de produção (3 meses) continua a existir e a ser
 *      afirmada — medir só a que está ligada deixaria a outra a estrear-se a apagar escolas;
 *   F. o andaime saiu do repositório e do código: nada o lê, nada o cita como fonte.
 *
 *   node experimentos/provar-expurgo-por-carencia.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

const MINUTO = 60 * 1000;
const agora = Date.now();
const iso = (ms) => new Date(ms).toISOString();

/** Um KV de bolso — o mapa e os registos comerciais que o expurgo vai ler. */
function kvCom(pares) {
  const dados = new Map(Object.entries(pares));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list() { return { keys: [...dados.keys()].map((name) => ({ name })), list_complete: true }; },
    bruto: dados,
  };
}

/** O `env` da raiz: o KV e os dois tokens que a varredura exige. */
function envCom(kv) {
  return { PADD_KV: kv, CLOUDFLARE_API_TOKEN: 'cf-de-mentira', GITHUB_TOKEN: 'gh-de-mentira', SHARD_SCRIPT: 'lastro-teste' };
}

/**
 * AS DUAS METADES INJECTADAS. A do Cloudflare só ANOTA o que lhe pediram; a da proveniência
 * responde o que o cenário precisa. Nenhuma delas fala com a rede.
 */
function bancada({ proveniencia = () => ({ ok: true, problemas: [], ancoras: [], fontes: [] }) } = {}) {
  const pedidos = { excluir: [], auditar: [] };
  return {
    pedidos,
    deps: {
      auditar: async (o) => { pedidos.auditar.push(o.slug); return proveniencia(o.slug); },
      excluir: async (o) => { pedidos.excluir.push(o); return { slug: o.slug, worker: o.worker, ok: true }; },
    },
  };
}

(async () => {
  console.log('A. A lista de escolas vem do SISTEMA — e a falta de uma fonte é dita');

  const kv = kvCom({
    'escolas/por-host': JSON.stringify({
      'viva.padd.com.br': 'viva',
      'recente.padd.com.br': 'recente',
      'vencida.padd.com.br': 'vencida',
      'sem-data.padd.com.br': 'sem-data',
      'esperando.padd.com.br': 'esperando',
    }),
    'bastidores/viva/comercial': JSON.stringify({ estado: 'ativa', criadoEm: iso(agora - 90 * MINUTO) }),
    /* SUSPENSA HÁ 2 MINUTOS — a carência de teste (5) ainda está a correr. */
    'bastidores/recente/comercial': JSON.stringify({ estado: 'suspensa', desabilitadaEm: iso(agora - 2 * MINUTO) }),
    /* SUSPENSA HÁ 6 MINUTOS — passou a carência de teste. É a única que deve ser apagada. */
    'bastidores/vencida/comercial': JSON.stringify({ estado: 'suspensa', desabilitadaEm: iso(agora - 6 * MINUTO) }),
    /* SUSPENSA SEM DATA — o registo é de antes das datas; não se apaga por omissão. */
    'bastidores/sem-data/comercial': JSON.stringify({ estado: 'suspensa' }),
    /* A AGUARDAR PAGAMENTO — nunca trabalhou, e não tem o que se apague. */
    'bastidores/esperando/comercial': JSON.stringify({ estado: 'aguardando', criadoEm: iso(agora - 90 * MINUTO) }),
  });

  const conhecidas = await raiz.escolasConhecidas(envCom(kv));
  conferir('conhece as cinco escolas do mapa', conhecidas.slugs.length === 5, conhecidas.slugs);
  conferir('…e diz que leu o mapa', conhecidas.mapa === true, conhecidas);
  /* SEM `GITHUB_TOKEN` A LISTA FICA MAIS CURTA, e isso é uma espera, não um apagão. */
  const semGitHub = await raiz.escolasConhecidas({ PADD_KV: kv });
  conferir('sem GitHub a lista fica só com o mapa, e o relatório di-lo',
    semGitHub.indice === false && semGitHub.slugs.length === 5, semGitHub);

  /* O REGIME JÁ EXISTE NESTAS SECÇÕES. A guarda de 16/11/2026 poupa o que foi suspenso ANTES de a
   * réguade teste começar a valer (ver `CHAVE_DO_REGIME`), e numa bancada o regime começa no
   * primeiro `expurgar`. Declará-lo antes é o que torna as secções seguintes possíveis — e a
   * secção G mede a guarda em si. */
  kv.bruto.set('expurgo/regime-de-teste-desde', iso(agora - 60 * MINUTO));

  console.log('\nB. Só a suspensa com a carência vencida é apagada');
  {
    const b = bancada();
    const r = await raiz.expurgar(envCom(kv), b.deps);
    conferir('a régua com que mediu vai no relatório (5 minutos, regime de teste)',
      /5 minutos/.test(String(r.carencia)), r.carencia);
    conferir('apagou UMA escola, e é a vencida',
      r.expurgadas.length === 1 && r.expurgadas[0].slug === 'vencida',
      r.expurgadas.map((e) => e.slug));
    conferir('…e a ela pediu a proveniência antes',
      b.pedidos.auditar.length === 1 && b.pedidos.auditar[0] === 'vencida', b.pedidos.auditar);
    conferir('a viva não é tocada — nem aparece entre as poupadas',
      !r.puladas.some((p) => p.slug === 'viva'), r.puladas.map((p) => p.slug));
    conferir('a que ainda está em carência é poupada, e o relatório diz quanto falta',
      r.puladas.some((p) => p.slug === 'recente' && /carência/i.test(p.motivo)
        && p.restanteMs > 2 * MINUTO && p.restanteMs <= 3 * MINUTO),
      r.puladas.find((p) => p.slug === 'recente'));
    conferir('a suspensa sem data é poupada com o motivo dito',
      r.puladas.some((p) => p.slug === 'sem-data' && /data de desabilita/i.test(p.motivo)),
      r.puladas.find((p) => p.slug === 'sem-data'));
    conferir('a que aguarda pagamento não entra em conta nenhuma',
      !r.puladas.some((p) => p.slug === 'esperando'), r.puladas.map((p) => p.slug));
  }

  console.log('\nC. A carência conta do `desabilitadaEm`, e não de uma data escrita à mão');
  {
    /* O MESMO REGISTO, ENVELHECIDO: a mesma escola vencida, mas desabilitada há 1 minuto. Com a
     * régua de teste, 1 minuto ainda não é 5 — e a conta que o `desabilitadaEm` produz é a que
     * manda. É o controle negativo da secção B. */
    const kvJovem = kvCom({
      'expurgo/regime-de-teste-desde': iso(agora - 60 * MINUTO),
      'escolas/por-host': JSON.stringify({ 'vencida.padd.com.br': 'vencida' }),
      'bastidores/vencida/comercial': JSON.stringify({ estado: 'suspensa', desabilitadaEm: iso(agora - 1 * MINUTO) }),
    });
    const b = bancada();
    const r = await raiz.expurgar(envCom(kvJovem), b.deps);
    conferir('desabilitada há 1 minuto, NADA é apagado', r.expurgadas.length === 0, r.expurgadas);
    conferir('…e a poupança diz que faltam quatro minutos (5 − 1)',
      r.puladas.length === 1 && r.puladas[0].restanteMs > 3 * MINUTO && r.puladas[0].restanteMs <= 4 * MINUTO,
      r.puladas);
    conferir('…e diz até quando a carência vai', !!r.puladas[0] && r.puladas[0].carenciaAte
      === raiz.carenciaAte(iso(agora - 1 * MINUTO)), r.puladas[0]);
  }

  console.log('\nD. Proveniência quebrada POUPA a escola — e a varredura não tem `forcar`');
  {
    const b = bancada({
      proveniencia: () => ({ ok: false, problemas: [{ tipo: 'cobertura-quebrada', detalhe: 'âncora cita fonte que já não existe' }], ancoras: [], fontes: [] }),
    });
    const r = await raiz.expurgar(envCom(kv), b.deps);
    conferir('nada é apagado', r.expurgadas.length === 0, r.expurgadas);
    conferir('…e a razão é a proveniência, com o problema junto',
      r.puladas.some((p) => p.slug === 'vencida' && /proveniência não confere/.test(p.motivo)
        && Array.isArray(p.problemas) && p.problemas.length === 1),
      r.puladas.find((p) => p.slug === 'vencida'));
    conferir('…e não se pediu a exclusão a ninguém', b.pedidos.excluir.length === 0, b.pedidos.excluir);

    /* A AUDITORIA QUE EXPLODE (rede, permissão) também POUPA: parar custa cinco minutos, avançar
     * custa a escola. */
    const b2 = bancada({ proveniencia: () => { throw new Error('rede fora'); } });
    const r2 = await raiz.expurgar(envCom(kv), b2.deps);
    conferir('auditoria que explode também poupa, e o erro vai no relatório',
      r2.expurgadas.length === 0 && r2.puladas.some((p) => p.slug === 'vencida' && /rede fora/.test(p.erro)),
      r2.puladas.find((p) => p.slug === 'vencida'));
  }

  console.log('\nE. As duas réguas existem — a de teste está ligada, a de produção não se perdeu');
  {
    conferir('a régua ligada é a de TESTE, de 5 minutos',
      raiz.CARENCIA_DE_TESTE_MINUTOS === 5, raiz.CARENCIA_DE_TESTE_MINUTOS);
    const referencia = '2027-01-12T00:00:00.000Z';
    conferir('de teste: 12/01/2027 00:00 → 00:05',
      raiz.carenciaAte(referencia) === '2027-01-12T00:05:00.000Z', raiz.carenciaAte(referencia));
    conferir('de produção: 12/01/2027 + 3 meses = 12/04/2027 — o exemplo dela',
      raiz.carenciaAte(referencia, { minutos: null }) === '2027-04-12T00:00:00.000Z',
      raiz.carenciaAte(referencia, { minutos: null }));
    conferir('…e o texto diz qual delas está a valer',
      /5 minutos/.test(raiz.descricaoDaCarencia()) && /3 meses/.test(raiz.descricaoDaCarencia(null)),
      [raiz.descricaoDaCarencia(), raiz.descricaoDaCarencia(null)]);
    /* A PRODUÇÃO É UM `null` NUMA CONSTANTE, e não uma edição espalhada: a prova afirma que a
     * régua de meses volta quando o interruptor sai. */
    const comMeses = raiz.carenciaAte(referencia, { minutos: null });
    conferir('…e desligar o regime de teste devolve exactamente os meses',
      comMeses === '2027-04-12T00:00:00.000Z', comMeses);
  }

  console.log('\nG. O andaime saiu — do código e do repositório');
  {
    const andaime = path.join(RAIZ, 'raiz/escolas-habilitadas.json');
    conferir('o ficheiro já não existe', !fs.existsSync(andaime), andaime);
    const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/raiz.js'), 'utf8');
    conferir('…e o código não o lê: `lerEscolasHabilitadas` saiu',
      !/lerEscolasHabilitadas/.test(fonte), null);
    /* O NOME DA CONSTANTE ANTIGA PODE APARECER NUMA NOTA — o que não pode é ser LIDA. A prova
     * pergunta pela ligação, não pela palavra: um comentário que explica o que saiu é memória, e
     * apagá-lo seria perder a razão da mudança. */
    conferir('…nem há prazo fixo de três minutos a decidir sozinho',
      !/const PRAZO_EXPURGO_MS/.test(fonte) && !/agora - desde < PRAZO/.test(fonte), null);
    conferir('…e o expurgo pergunta o estado ao KV, escola a escola',
      /lerComercial\(kv, slug\)/.test(fonte), null);
  }

  console.log('\nF. Uma régua nova não se aplica ao passado');
  {
    /* O CASO DELA, e é concreto: a `breu` está suspensa desde hoje, e com cinco minutos de
     * carência a PRIMEIRA passagem do Cron depois do deploy apagava-a — sem ela ter pedido isso a
     * escola nenhuma. O pedido foi «coloca 5 minutos para fim de teste», não «apaga o que já
     * estava desligado». */
    const kvAntigo = kvCom({
      'escolas/por-host': JSON.stringify({ 'ja-estava.padd.com.br': 'ja-estava' }),
      'bastidores/ja-estava/comercial': JSON.stringify({ estado: 'suspensa', desabilitadaEm: iso(agora - 30 * MINUTO) }),
    });
    const b = bancada();
    const r = await raiz.expurgar(envCom(kvAntigo), b.deps);
    conferir('suspensa ANTES de o regime existir não é apagada', r.expurgadas.length === 0, r.expurgadas);
    conferir('…e o motivo diz que é preciso desabilitar outra vez',
      r.puladas.some((p) => p.slug === 'ja-estava' && /antes de este prazo existir/.test(p.motivo)), r.puladas);
    conferir('…e o regime ficou gravado, para as passagens seguintes',
      Boolean(kvAntigo.bruto.get('expurgo/regime-de-teste-desde')), kvAntigo.bruto.get('expurgo/regime-de-teste-desde'));

    /* E O GESTO DELA PASSA A CONTAR: desabilitada DEPOIS do regime, os cinco minutos contam. */
    const kvDepois = kvCom({
      'expurgo/regime-de-teste-desde': iso(agora - 30 * MINUTO),
      'escolas/por-host': JSON.stringify({ 'desligada-agora.padd.com.br': 'desligada-agora' }),
      'bastidores/desligada-agora/comercial': JSON.stringify({ estado: 'suspensa', desabilitadaEm: iso(agora - 6 * MINUTO) }),
    });
    const b2 = bancada();
    const r2 = await raiz.expurgar(envCom(kvDepois), b2.deps);
    conferir('desabilitada DEPOIS do regime, a carência conta e a escola é apagada',
      r2.expurgadas.length === 1 && r2.expurgadas[0].slug === 'desligada-agora', r2.expurgadas);
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
