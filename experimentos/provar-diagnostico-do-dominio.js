#!/usr/bin/env node
'use strict';

/*
 * provar-diagnostico-do-dominio.js — «a próxima escola vai nascer com endereço?», respondido
 * antes de a criar.
 *
 * O QUE ESTÁ EM JOGO. O endereço próprio de uma escola falha em SILÊNCIO: o provisionamento não
 * lança por causa dele (uma escola sem endereço é uma pendência, não um fracasso), e a resposta só
 * diz «PENDENTE» depois de a escola existir. Foi assim que a `breu` nasceu sem `breu.padd.com.br`
 * em 13/11/2026 — com o token a ler a zona, a gerir rotas e a receber 403 no DNS. Descobrir isso
 * custou uma escola criada com o endereço errado.
 *
 * `diagnosticar` faz as duas leituras que decidem (registos DNS e rotas da zona) e responde antes
 * do gesto. Esta prova cobre o que ele CONCLUI, com um Cloudflare de mentira: os quatro estados de
 * permissão, o que entra na lista do que «já tem endereço», e o que NÃO entra.
 *
 * O CONTROLO NEGATIVO, e é o ponto da prova: um registo `A` que não seja `192.0.2.1` proxyado não
 * pode contar como endereço de escola. Se contar, o diagnóstico diz «está tudo bem» sobre um
 * endereço que aponta para outra coisa — o pior alívio possível.
 *
 *   node experimentos/provar-diagnostico-do-dominio.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const dominio = require(path.join(RAIZ, 'motor/servidor/dominio-da-escola.js'));

let ok = 0;
let ko = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
  else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
};

const ZONA = 'padd.com.br';
const ZID = 'zona-1';

/** Um Cloudflare de mentira: responde ao que o diagnóstico pergunta, e conta os pedidos. */
function falso({ dns = 200, rotas = 200, registos = [], padroes = [], zona = 200 } = {}) {
  const pedidos = [];
  const fetchImpl = async (url, init) => {
    pedidos.push({ url, metodo: (init && init.method) || 'GET' });
    const json = (status, corpo) => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => corpo,
    });
    const erro403 = { success: false, errors: [{ code: 10000, message: 'Authentication error' }] };
    if (url.indexOf('/zones?name=') !== -1) {
      if (zona === 403) return json(403, erro403);
      return json(zona, { success: true, result: zona === 200 ? [{ id: ZID, name: ZONA }] : [] });
    }
    if (url.indexOf('/dns_records') !== -1) {
      if (dns === 403) return json(403, erro403);
      return json(200, { success: true, result: registos });
    }
    if (url.indexOf('/workers/routes') !== -1) {
      if (rotas === 403) return json(403, erro403);
      return json(200, { success: true, result: padroes });
    }
    return json(404, { success: false, errors: [{ code: 7003, message: 'no route' }] });
  };
  return { fetchImpl, pedidos };
}

const registo = (escola, extra) => Object.assign({
  id: 'r-' + escola, type: 'A', name: escola + '.' + ZONA,
  content: dominio.IP_DO_REGISTO, proxied: true,
}, extra || {});

(async () => {
  /* ── 1. TUDO EM ORDEM ───────────────────────────────────────────────────────────────────── */
  {
    dominio.esquecerZona();
    const f = falso({
      registos: [registo('calango'), registo('breu')],
      padroes: [
        { pattern: 'calango.' + ZONA + '/*', script: 'calango' },
        { pattern: 'breu.' + ZONA + '/*', script: 'breu' },
      ],
    });
    const r = await dominio.diagnosticar({ token: 't', zona: ZONA, fetchImpl: f.fetchImpl });
    provar('com DNS e rotas, o veredicto é «ok»', r.ok === true && r.pode_dns && r.pode_rotas, r);
    provar('as escolas com endereço são as do registo, por ordem', String(r.com_registo) === 'breu,calango', r.com_registo);
    provar('as rotas trazem o script que servem', r.com_rota.length === 2 && r.com_rota[0].script === 'breu', r.com_rota);
    provar('e a resposta diz, por extenso, que a próxima nasce com endereço',
      /nasce com «<escola>\.padd\.com\.br»/.test(r.proxima_escola), r.proxima_escola);
    provar('são TRÊS pedidos: zona, DNS e rotas — nenhum a mais',
      f.pedidos.length === 3 && f.pedidos.every((p) => p.metodo === 'GET'),
      f.pedidos.map((p) => p.metodo + ' ' + p.url.split('?')[0].split('/client/v4')[1]));
  }

  /* ── 2. O CASO QUE ACONTECEU: DNS 403, ROTAS OK ──────────────────────────────────────────── */
  {
    dominio.esquecerZona();
    const f = falso({
      dns: 403,
      padroes: [{ pattern: 'calango.' + ZONA + '/*', script: 'calango' }],
    });
    const r = await dominio.diagnosticar({ token: 't', zona: ZONA, fetchImpl: f.fetchImpl });
    provar('DNS 403 → NÃO está ok', r.ok === false && r.pode_dns === false, r);
    provar('e o veredicto diz que a próxima nasce SEM endereço',
      /SEM endereço próprio/.test(r.proxima_escola), r.proxima_escola);
    provar('a dica nomeia a permissão que falta («Zone → DNS → Edit»)',
      /Zone → DNS → Edit/.test(String(r.dica)), r.dica);
    provar('e o `erro` traz a mensagem da Cloudflare, não um «HTTP 403» mudo',
      /Authentication error/.test(String(r.erro)), r.erro);
    provar('CONTROLO NEGATIVO: com o DNS ilegível, não se afirma que nenhuma escola tem endereço',
      r.com_registo.length === 0 && r.com_rota.length === 1, r);
  }

  /* ── 3. AS ROTAS A FALTAR, COM O DNS BOM ─────────────────────────────────────────────────── */
  {
    dominio.esquecerZona();
    const f = falso({ rotas: 403, registos: [registo('calango')] });
    const r = await dominio.diagnosticar({ token: 't', zona: ZONA, fetchImpl: f.fetchImpl });
    provar('rotas 403 (DNS bom) → também NÃO está ok', r.ok === false && r.pode_rotas === false, r);
    provar('a dica muda para as rotas — não repete a do DNS',
      /Workers Routes/.test(String(r.dica)) && !/Zone → DNS/.test(String(r.dica)), r.dica);
    provar('a lista de escolas com endereço continua a sair, porque o DNS foi lido',
      String(r.com_registo) === 'calango', r.com_registo);
  }

  /* ── 4. O CONTROLO NEGATIVO DO QUE CONTA COMO «NOSSO» ────────────────────────────────────── */
  {
    dominio.esquecerZona();
    const f = falso({
      registos: [
        registo('calango'),
        registo('alheia', { content: '216.198.79.1' }),      // aponta para outro sítio
        registo('cinza', { proxied: false }),                 // não está atrás do proxy
        registo('cname', { type: 'CNAME', content: 'x.exemplo' }),
        registo('outra-zona', { name: 'calango.outra.com' }), // não é desta zona
        Object.assign(registo('pagina'), { id: 'r-p' }),      // o mesmo nome, mas o da raiz
        { id: 'r-apex', type: 'A', name: ZONA, content: '216.198.79.1', proxied: false },
      ],
      padroes: [
        { pattern: 'calango.' + ZONA + '/*', script: 'calango' },
        { pattern: 'sem-curinga.' + ZONA, script: 'x' },       // rota sem `/*` não serve a escola
        { pattern: 'outra.com/*', script: 'y' },
      ],
    });
    const r = await dominio.diagnosticar({ token: 't', zona: ZONA, fetchImpl: f.fetchImpl });
    provar('só o registo `A` + 192.0.2.1 + proxyado conta como endereço de escola',
      String(r.com_registo) === 'calango,pagina', r.com_registo);
    provar('um registo que aponta para outro sítio NÃO conta («alheia»)',
      r.com_registo.indexOf('alheia') === -1, r.com_registo);
    provar('um registo sem proxy NÃO conta («cinza»)', r.com_registo.indexOf('cinza') === -1, r.com_registo);
    provar('o apex da zona NÃO conta como escola', r.com_registo.indexOf('') === -1, r.com_registo);
    provar('só a rota com `/*` conta como rota de escola',
      r.com_rota.length === 1 && r.com_rota[0].escola === 'calango', r.com_rota);
  }

  /* ── 5. SEM ZONA E SEM TOKEN ─────────────────────────────────────────────────────────────── */
  {
    dominio.esquecerZona();
    const f = falso({ zona: 200 });
    f.fetchImpl = (async (url) => {
      f.pedidos.push({ url, metodo: 'GET' });
      return { ok: true, status: 200, json: async () => ({ success: true, result: [] }) };
    });
    const r = await dominio.diagnosticar({ token: 't', zona: ZONA, fetchImpl: f.fetchImpl });
    provar('zona inexistente → não lança, e diz que não está ok', r.ok === false && /não está nesta conta/.test(String(r.erro)), r);
  }
  {
    dominio.esquecerZona();
    const f = falso({});
    const r = await dominio.diagnosticar({ token: '', zona: ZONA, fetchImpl: f.fetchImpl });
    provar('sem token → responde, e não faz NENHUM pedido',
      r.ok === false && /sem CLOUDFLARE_API_TOKEN/.test(String(r.erro)) && f.pedidos.length === 0,
      { erro: r.erro, pedidos: f.pedidos.length });
  }

  console.log('\n' + (ko === 0
    ? 'TUDO CERTO — ' + ok + ' asserções.'
    : 'FALHOU — ' + ok + ' asserção(ões), ' + ko + ' falha(s).'));
  process.exit(ko === 0 ? 0 : 1);
})();
