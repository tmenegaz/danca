#!/usr/bin/env node
'use strict';

/*
 * provar-dominio-da-escola.js — a escola nasce com endereço próprio, e limpá-la leva o endereço.
 *
 * O QUE FOI MEDIDO, E O QUE ESTA PROVA FIXA (13/11/2026).
 *
 * A pesquisadora: «toda vez eu tenho que ir lá [no Cloudflare] e falar qual é a zona e criar o
 * processo. Eu acho que isso não é legal de fazer toda vez.» E a prova do problema estava à vista
 * na conta: `diagleve.padd.com.br` e `duo.padd.com.br` continuavam a existir para escolas já
 * expurgadas. Duas pontas do mesmo defeito — o endereço não nascia sozinho, e não morria sozinho.
 *
 * A regra, em duas frases: **criar uma escola cria o registo DNS e a rota**; **apagar a escola
 * apaga os dois** — e em nenhum dos dois sentidos se toca no que não é do sistema.
 *
 * O QUE MEDE:
 *
 *   1. o DNS: cria quando não existe; NÃO toca quando já é o nosso; **RECUSA** quando o nome está
 *      ocupado por outra coisa (um `<escola>.padd.com.br` que aponta para outro sítio é de outra
 *      pessoa, e sobrescrevê-lo seria o pior gesto possível);
 *   2. a rota: as mesmas três respostas, e o padrão com `/*` — sem ele só a raiz casaria;
 *   3. a ORDEM: sem registo DNS a rota não é tentada (uma rota para um host que não resolve só dá
 *      1016 a quem abre, e ninguém descobre por quê);
 *   4. a LIMPEZA: apaga o registo com a MARCA (A → 192.0.2.1, proxyado) e a rota que aponta ao
 *      script desta escola — e **mantém** um registo alheio com o mesmo nome;
 *   5. o 403 do DNS (o token desta casa não tem `Zone:DNS:Edit`, medido: `dns_records → 403` com
 *      as rotas a funcionar) não derruba a criação da escola: ela nasce, e a pendência é DITA com
 *      o que fazer;
 *   6. CONTROLO NEGATIVO: sem a marca do registo, a limpeza não apaga nada.
 *
 * SEM REDE: o `fetch` é substituído por um Cloudflare de mentira que guarda o que lhe mandam. A
 * ponta a ponta (secção 6) passa pelo `raiz.fetch` de verdade, com esse mesmo `fetch` falso.
 *
 *   node experimentos/provar-dominio-da-escola.js
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
const ZID = 'zona-de-prova';
const HOST = 'batata.' + ZONA;

/**
 * O Cloudflare de mentira. `estado.dns` e `estado.rotas` são as listas; `negarDns` simula o 403
 * que o token desta casa dá hoje.
 */
function cfFalso({ negarDns = false } = {}) {
  const estado = { dns: [], rotas: [], scripts: new Set() };
  let seq = 0;
  const novoId = () => 'id-' + (++seq);
  const json = (corpo, status) => new Response(JSON.stringify(corpo), {
    status: status || 200, headers: { 'content-type': 'application/json' },
  });
  const respostaOk = (resultado, status) => json({ success: true, errors: [], result: resultado }, status);
  const respostaErro = (status, code, message) => json({ success: false, errors: [{ code, message }], result: null }, status);

  const fetchFalso = async (url, init) => {
    const u = String(url && url.url ? url.url : url);
    const metodo = String((init && init.method) || 'GET').toUpperCase();
    /* O `subirModulo` manda `FormData` (multipart), não JSON — um `JSON.parse` cego estourava e
     * o erro aparecia como «Unexpected token 'o'» na criação da escola. Lê-se só o que é JSON. */
    const tipo = String((init && init.headers && (init.headers['Content-Type'] || init.headers['content-type'])) || '');
    const corpo = init && init.body && /json/i.test(tipo) ? JSON.parse(init.body) : null;
    const semBase = u.replace('https://api.cloudflare.com/client/v4', '');
    const caminho = semBase.split('?')[0];
    const query = new URLSearchParams((semBase.split('?')[1] || ''));

    if (caminho === '/zones') {
      if (query.get('name') !== ZONA) return respostaOk([]);
      return respostaOk([{ id: ZID, name: ZONA, status: 'active' }]);
    }
    if (caminho === '/zones/' + ZID + '/dns_records' && metodo === 'GET') {
      if (negarDns) return respostaErro(403, 9109, 'Unauthorized to access zone resource');
      const nome = query.get('name');
      return respostaOk(estado.dns.filter((r) => !nome || r.name === nome));
    }
    if (caminho === '/zones/' + ZID + '/dns_records' && metodo === 'POST') {
      if (negarDns) return respostaErro(403, 9109, 'Unauthorized to access zone resource');
      if (estado.dns.some((r) => r.name === corpo.name)) {
        return respostaErro(400, 81057, 'The record already exists.');
      }
      const registro = Object.assign({ id: novoId() }, corpo);
      estado.dns.push(registro);
      return respostaOk(registro);
    }
    if (/^\/zones\/[^/]+\/dns_records\/[^/]+$/.test(caminho) && metodo === 'DELETE') {
      const id = caminho.split('/').pop();
      estado.dns = estado.dns.filter((r) => r.id !== id);
      return respostaOk({ id });
    }
    if (caminho === '/zones/' + ZID + '/workers/routes' && metodo === 'GET') {
      return respostaOk(estado.rotas);
    }
    if (caminho === '/zones/' + ZID + '/workers/routes' && metodo === 'POST') {
      if (estado.rotas.some((r) => r.pattern === corpo.pattern)) {
        return respostaErro(400, 10020, 'A route with this pattern already exists.');
      }
      const rota = Object.assign({ id: novoId() }, corpo);
      estado.rotas.push(rota);
      return respostaOk(rota);
    }
    if (/^\/zones\/[^/]+\/workers\/routes\/[^/]+$/.test(caminho) && metodo === 'DELETE') {
      const id = caminho.split('/').pop();
      estado.rotas = estado.rotas.filter((r) => r.id !== id);
      return respostaOk({ id });
    }
    /* A ESCOLA NÃO EXISTE AINDA — é o que o `criarEscola` pergunta primeiro (`GET` no script). Um
     * `200` aqui faria a criação responder 409 «já existe», e a secção 6 mediria a recusa em vez
     * da criação. Um script criado fica registado, e a segunda criação do mesmo nome é recusada —
     * que é metade do que a secção 6 verifica. */
    if (/^\/accounts\/[^/]+\/workers\/scripts\/[^/]+$/.test(caminho) && metodo === 'GET') {
      const nome = caminho.split('/').pop();
      if (!estado.scripts.has(nome)) return respostaErro(404, 10007, 'This Worker does not exist.');
      return respostaOk({ id: nome });
    }
    if (/^\/accounts\/[^/]+\/workers\/scripts\/[^/]+$/.test(caminho) && metodo === 'PUT') {
      const nome = caminho.split('/').pop();
      estado.scripts.add(nome);
      return respostaOk({ id: nome });
    }
    /* O resto (secrets, subdomínio, dispatches) responde OK: é o que a ponte de criação precisa
     * para chegar ao fim, e o que se mede aqui é o domínio. */
    return respostaOk({});
  };
  return { estado, fetch: fetchFalso };
}

(async () => {
  dominio.esquecerZona();

  /* ── 1. O DNS ─────────────────────────────────────────────────────────────────────────── */
  console.log('\n1 · o registo DNS: cria, não toca no que já é nosso, e RECUSA o que é alheio');
  {
    const cf = cfFalso();
    const criado = await dominio.garantirRegistoDns({ token: 't', escola: 'batata', zona: ZONA, fetchImpl: cf.fetch });
    provar('não existindo, cria', criado.ok === true && criado.estado === 'criado', criado);
    const registro = cf.estado.dns[0];
    provar('é um `A` para o IP de documentação, PROXYADO (a rota exige-o)',
      registro.type === 'A' && registro.content === '192.0.2.1' && registro.proxied === true, registro);
    provar('com o nome da escola na zona', registro.name === HOST, registro.name);

    const outra = await dominio.garantirRegistoDns({ token: 't', escola: 'batata', zona: ZONA, fetchImpl: cf.fetch });
    provar('a segunda vez não cria nem duplica: diz «já existia»',
      outra.ok === true && outra.estado === 'ja-existia' && cf.estado.dns.length === 1, [outra, cf.estado.dns.length]);

    /* OCUPADO POR OUTRA COISA — o caso que não pode ser silencioso. */
    const cf2 = cfFalso();
    cf2.estado.dns.push({ id: 'alheio', type: 'A', name: HOST, content: '203.0.113.9', proxied: true });
    const ocupado = await dominio.garantirRegistoDns({ token: 't', escola: 'batata', zona: ZONA, fetchImpl: cf2.fetch });
    provar('um registo com OUTRO conteúdo é recusado, não sobrescrito',
      ocupado.ok === false && ocupado.estado === 'ocupado', ocupado);
    provar('e o registo alheio fica intacto', cf2.estado.dns[0].content === '203.0.113.9', cf2.estado.dns[0]);
    provar('e a mensagem diz onde resolver (à mão, se for mesmo da escola)',
      /à mão no Cloudflare/.test(String(ocupado.erro)), ocupado.erro);

    const cfNega = cfFalso({ negarDns: true });
    const negado = await dominio.garantirRegistoDns({ token: 't', escola: 'batata', zona: ZONA, fetchImpl: cfNega.fetch });
    provar('o 403 é dito como é, sem inventar', negado.ok === false && negado.estado === 'sem-permissao', negado);
  }

  /* ── 2. A ROTA ────────────────────────────────────────────────────────────────────────── */
  console.log('\n2 · a rota: o padrão leva `/*`, aponta ao script da escola, e não substitui a de outro');
  {
    const cf = cfFalso();
    const criada = await dominio.garantirRota({ token: 't', escola: 'batata', script: 'batata', zona: ZONA, fetchImpl: cf.fetch });
    provar('cria a rota com o padrão completo', criada.ok === true && criada.padrao === HOST + '/*', criada);
    provar('e aponta ao script da escola', cf.estado.rotas[0].script === 'batata', cf.estado.rotas[0]);

    const outra = await dominio.garantirRota({ token: 't', escola: 'batata', script: 'batata', zona: ZONA, fetchImpl: cf.fetch });
    provar('a segunda vez diz «já existia»', outra.estado === 'ja-existia' && cf.estado.rotas.length === 1);

    const cf2 = cfFalso();
    cf2.estado.rotas.push({ id: 'r-alheia', pattern: HOST + '/*', script: 'outro-script' });
    const ocupada = await dominio.garantirRota({ token: 't', escola: 'batata', script: 'batata', zona: ZONA, fetchImpl: cf2.fetch });
    provar('uma rota que aponta a OUTRO script é recusada, não substituída',
      ocupada.ok === false && ocupada.estado === 'ocupado', ocupada);
    provar('e o script alheio continua onde estava', cf2.estado.rotas[0].script === 'outro-script');

    /* NO SHARD, o script é o do shard e a escola é a da rota — a função já recebe os dois. */
    const cf3 = cfFalso();
    const shard = await dominio.garantirRota({ token: 't', escola: 'batata', script: 'lastro-teste', zona: ZONA, fetchImpl: cf3.fetch });
    provar('escola e script podem ser diferentes (o caso do shard)',
      shard.ok === true && cf3.estado.rotas[0].pattern === HOST + '/*'
        && cf3.estado.rotas[0].script === 'lastro-teste', cf3.estado.rotas[0]);
  }

  /* ── 3. A ORDEM ───────────────────────────────────────────────────────────────────────── */
  console.log('\n3 · sem registo DNS, a rota NÃO é tentada');
  {
    const cf = cfFalso({ negarDns: true });
    const r = await dominio.ligarDominio({ token: 't', escola: 'batata', script: 'batata', zona: ZONA, fetchImpl: cf.fetch });
    provar('o resultado é pendente, e diz o que faltou',
      r.ok === false && r.pendente === true && /registo DNS/.test(String(r.erro)), r.erro);
    provar('e a dica nomeia a permissão que falta',
      /Zone → DNS → Edit/.test(String(r.dica)), r.dica);
    provar('nenhuma rota foi criada (não se aponta a um host que não resolve)',
      cf.estado.rotas.length === 0, cf.estado.rotas);
  }

  /* ── 4. A LIMPEZA ─────────────────────────────────────────────────────────────────────── */
  console.log('\n4 · o expurgo leva o endereço — e só o que é do sistema');
  {
    const cf = cfFalso();
    await dominio.ligarDominio({ token: 't', escola: 'batata', script: 'batata', zona: ZONA, fetchImpl: cf.fetch });
    provar('antes de limpar, há um registo e uma rota',
      cf.estado.dns.length === 1 && cf.estado.rotas.length === 1);

    const r = await dominio.desligarDominio({ token: 't', escola: 'batata', script: 'batata', zona: ZONA, fetchImpl: cf.fetch });
    provar('o registo é apagado', r.dns && r.dns.apagados === 1, r.dns);
    provar('e a rota também', r.rota && r.rota.apagadas === 1, r.rota);
    provar('a zona fica limpa', cf.estado.dns.length === 0 && cf.estado.rotas.length === 0, cf.estado);

    /* O SUBDOMÍNIO DE OUTRA PESSOA, com o mesmo nome. */
    const cf2 = cfFalso();
    cf2.estado.dns.push({ id: 'alheio', type: 'A', name: HOST, content: '203.0.113.9', proxied: true });
    cf2.estado.rotas.push({ id: 'r-alheia', pattern: HOST + '/*', script: 'outro-script' });
    const r2 = await dominio.desligarDominio({ token: 't', escola: 'batata', script: 'batata', zona: ZONA, fetchImpl: cf2.fetch });
    provar('um registo DNS alheio com o mesmo nome é MANTIDO',
      r2.dns.apagados === 0 && cf2.estado.dns.length === 1, r2.dns);
    provar('e a rota de outro script também',
      r2.rota.apagadas === 0 && cf2.estado.rotas.length === 1, r2.rota);
  }

  /* ── 5. CONTROLO NEGATIVO ─────────────────────────────────────────────────────────────── */
  console.log('\n5 · controlo negativo: sem a marca do sistema, nada é apagado');
  {
    /* O MESMO tipo, o MESMO nome, e conteúdo diferente: é a marca (192.0.2.1 + proxyado) que
     * autoriza a limpeza. Sem ela, o expurgo apagaria o subdomínio de outra pessoa. */
    const cf = cfFalso();
    cf.estado.dns.push({ id: 'x1', type: 'A', name: HOST, content: '203.0.113.9', proxied: true });
    const r = await dominio.desligarDominio({ token: 't', escola: 'batata', script: 'batata', zona: ZONA, fetchImpl: cf.fetch });
    provar('conteúdo diferente → não apaga', r.dns.apagados === 0, r.dns);

    const cf2 = cfFalso();
    cf2.estado.dns.push({ id: 'x2', type: 'A', name: HOST, content: '192.0.2.1', proxied: false });
    const r2 = await dominio.desligarDominio({ token: 't', escola: 'batata', script: 'batata', zona: ZONA, fetchImpl: cf2.fetch });
    provar('DNS-only (não proxyado) → também não apaga', r2.dns.apagados === 0, r2.dns);
    void r;
  }

  /* ── 6. A PONTA A PONTA: criar a escola pelo handler real ─────────────────────────────── */
  console.log('\n6 · pelo handler real: a escola nasce com endereço, e nasce mesmo quando o DNS falha');
  {
    const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
    const provisionar = require(path.join(RAIZ, 'motor/servidor/provisionar-escola.js'));
    const SENHA_RAIZ = 'senha-da-raiz-de-prova';
    const fetchReal = globalThis.fetch;

    /** Roda a criação com um Cloudflare de mentira, e devolve o corpo da resposta. */
    async function criarCom(cf) {
      globalThis.fetch = async (url, init) => {
        const u = String(url && url.url ? url.url : url);
        if (!/api\.cloudflare\.com/.test(u)) return new Response('{}', { status: 200 });
        return cf.fetch(url, init);
      };
      try {
        const r = await raiz.fetch(new Request('https://danca.tmenegaz77.workers.dev/api/criar-escola', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + Buffer.from('tmenegaz:' + SENHA_RAIZ).toString('base64'),
          },
          body: JSON.stringify({
            nome: 'Batata da Tarde',
            senhaAdmin: 'admin-1',
            professorNome: 'Tiago',
            professorSobrenome: 'Menegaz',
            senhaProfessor: 'prof-1',
          }),
        }), { SENHA_RAIZ, CLOUDFLARE_API_TOKEN: 't', GITHUB_TOKEN: 'g' });
        return { status: r.status, corpo: await r.json() };
      } finally {
        globalThis.fetch = fetchReal;
      }
    }

    dominio.esquecerZona();
    const bom = cfFalso();
    const feito = await criarCom(bom);
    provar('a escola é criada (201)', feito.status === 201, [feito.status, feito.corpo]);
    provar('e o endereço próprio vem no resultado, OK',
      feito.corpo.dominio && feito.corpo.dominio.ok === true
        && feito.corpo.dominio.host === 'batata-da-tarde.' + ZONA,
      feito.corpo.dominio);
    provar('com o registo DNS criado', bom.estado.dns.length === 1, bom.estado.dns);
    provar('e a rota apontada ao Worker da escola',
      bom.estado.rotas.length === 1 && bom.estado.rotas[0].script === 'batata-da-tarde',
      bom.estado.rotas);

    /* O DIA EM QUE FALTA A PERMISSÃO. A escola tem de nascer na mesma. */
    dominio.esquecerZona();
    const semPermissao = cfFalso({ negarDns: true });
    const nascida = await criarCom(semPermissao);
    provar('sem permissão de DNS, a escola AINDA é criada (não se troca uma pendência por um fracasso)',
      nascida.status === 201, [nascida.status, nascida.corpo && nascida.corpo.erro]);
    provar('e o resultado diz que o endereço ficou PENDENTE',
      nascida.corpo.dominio && nascida.corpo.dominio.ok === false
        && nascida.corpo.dominio.pendente === true, nascida.corpo.dominio);
    provar('com a dica da permissão, para não haver caça ao erro',
      /Zone → DNS → Edit/.test(String(nascida.corpo.dominio.dica)), nascida.corpo.dominio.dica);
    provar('e nenhuma rota ficou apontada a um host que não resolve',
      semPermissao.estado.rotas.length === 0, semPermissao.estado.rotas);

    /* E NÃO SE OFERECE UM ENDEREÇO QUE NÃO É O DA ESCOLA (14/11/2026).
     *
     * Aqui esteve «o endereço `workers.dev` continua a ser devolvido», e a asserção era verdadeira
     * — o `workers.dev` existe e serve. Deixou de ser o que se quer: o endereço da escola é
     * `<escola>.padd.com.br`, e a pesquisadora foi directa («não precisa mais mostrar em lugar
     * nenhum esse caminho»). Sem o domínio próprio, `url` vem NULO e a PENDÊNCIA é que fala —
     * mostrar o `workers.dev` seria dar um endereço que ninguém vai usar nem citar. */
    provar('sem domínio próprio, a resposta NÃO inventa um endereço (`url` nulo)',
      nascida.corpo.url === null, nascida.corpo.url);
    provar('…e `dominio` continua lá, com o que faltou', Boolean(nascida.corpo.dominio), nascida.corpo.dominio);
    provar('…e nenhum campo da resposta diz `workers.dev`',
      !/workers\.dev/.test(JSON.stringify(nascida.corpo)), JSON.stringify(nascida.corpo).slice(0, 160));
    void provisionar;
  }

  console.log('\n' + (ko ? 'FALHOU' : 'TUDO CERTO') + ' — ' + ok + ' asserção(ões)' +
    (ko ? ', ' + ko + ' falha(s)' : '') + '.');
  process.exit(ko ? 1 : 0);
})().catch((erro) => { console.error(erro); process.exit(1); });
