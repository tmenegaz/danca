'use strict';

/**
 * dominio-da-escola.js — o endereço próprio de cada escola, criado por dentro do sistema.
 *
 * O PROBLEMA, dito como a pesquisadora o disse (13/11/2026): «toda vez eu tenho que ir lá [no
 * Cloudflare] e falar qual é a zona e criar o processo. Eu acho que isso não é legal de fazer toda
 * vez. Pode ser feito diferente?». Podia — e ficou.
 *
 * O QUE É PRECISO, POR ESCOLA, E O QUE CADA UM FAZ:
 *
 *   1. **um registo DNS** — `A`, nome `<escola>`, conteúdo `192.0.2.1`, **proxyado** (nuvem
 *      laranja). O endereço não é um servidor: é o endereço de documentação da RFC 5737, e está
 *      ali por um motivo só — a Cloudflare **exige um registo proxyado** para aceitar uma rota.
 *      Quem responde é o Worker, que a rota intercepta antes de qualquer origem.
 *   2. **uma rota** — `<escola>.padd.com.br/*` apontada ao script do Worker daquela escola.
 *
 * POR QUE ROTA EXPLÍCITA, E NÃO UM CURINGA. Um registo DNS curinga respeita os subdomínios que já
 * existem (os exatos têm precedência, é a documentação). Mas uma ROTA `*.padd.com.br/*`
 * intercepta **todos** os subdomínios da zona que não tenham rota mais específica — e o
 * `padd.com.br` é usado para outras coisas, de teste e de brincadeira. Uma rota curinga
 * transformaria «vou testar isto» num «quebrei aquilo». Fica a regra: **domínio partilhado, rota
 * explícita**. Com a criação automática, o clique que a rota explícita exigia desapareceu — que era
 * exactamente a queixa dela.
 *
 * O QUE A ROTA AINDA NÃO É. Hoje cada escola é **um Worker**, e a rota aponta ao script dela. No
 * shard (`PLANO-SHARD.md`), o `script` passa a ser o do shard e a rota continua por escola — a
 * função já recebe o nome do script por parâmetro por isso: quem sabe qual é o Worker é quem chama.
 *
 * A MARCA DE PROPRIEDADE. O registo DNS fica com o `192.0.2.1` e proxyado, e é isso que autoriza
 * este módulo a APAGÁ-LO: uma rotina de limpeza que apagasse qualquer `<escola>.padd.com.br`
 * poderia destruir um subdomínio que a pesquisadora usa para outra coisa. A trava é o conteúdo do
 * registo, não o nome — a mesma disciplina do `prefixosDaEscola` no expurgo.
 */

/** O IP de documentação (RFC 5737, TEST-NET-1). Não é servidor nenhum: ver o cabeçalho. */
const IP_DO_REGISTO = '192.0.2.1';

/** A zona das escolas. Configurável por `env.ZONA_ESCOLAS` — o nome é o padrão desta casa. */
const ZONA_PADRAO = 'padd.com.br';

/** O id da zona, por isolate: a zona não muda, e uma leitura por isolate chega. */
const ZONA_EM_CACHE = new Map();

const BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Uma chamada à API do Cloudflare, com o erro já legível. Nunca devolve corpo bruto.
 *
 * O `fetchImpl` é injetável, como no `repo-escola.js`: é o que deixa a prova correr sem rede e,
 * mais importante, medir o que este módulo DECIDE (criar, recusar, apagar) em vez de medir o
 * Cloudflare.
 */
async function api(token, metodo, caminho, corpo, fetchImpl) {
  const buscar = fetchImpl || fetch;
  const res = await buscar(BASE + caminho, {
    method: metodo,
    headers: Object.assign(
      { Authorization: 'Bearer ' + token },
      corpo === undefined ? {} : { 'Content-Type': 'application/json' },
    ),
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  let dados = {};
  try { dados = await res.json(); } catch (erro) { dados = {}; }
  const erros = (dados && dados.errors) || [];
  return {
    ok: res.ok && dados.success === true,
    status: res.status,
    resultado: dados.result,
    /* A MENSAGEM DA CLOUDFLARE É A QUE EXPLICA (permissão em falta, zona errada, nome repetido) —
     * trocá-la por «HTTP 403» obrigaria a adivinhar qual das três foi. */
    erro: erros.length ? erros.map((e) => (e.code ? e.code + ': ' : '') + e.message).join(' · ')
      : (res.ok ? null : 'HTTP ' + res.status),
  };
}

/** O id da zona, por nome. Lança se não houver — sem zona não há domínio, e calar isso é pior. */
async function zonaId({ token, zona, fetchImpl }) {
  const nome = String(zona || ZONA_PADRAO).trim().toLowerCase();
  const guardada = ZONA_EM_CACHE.get(nome);
  if (guardada) return guardada;
  const r = await api(token, 'GET', '/zones?name=' + encodeURIComponent(nome), undefined, fetchImpl);
  if (!r.ok) {
    throw new Error('não achei a zona «' + nome + '»: ' + (r.erro || 'erro desconhecido') +
      (r.status === 403 ? ' — o token precisa de Zone:Read' : ''));
  }
  const encontrada = (r.resultado || [])[0];
  if (!encontrada) throw new Error('a zona «' + nome + '» não está nesta conta');
  ZONA_EM_CACHE.set(nome, encontrada.id);
  return encontrada.id;
}

/** O hostname de uma escola. É a única função que o compõe — duas composições divergiriam. */
function hostname(escola, zona) {
  return String(escola || '').trim().toLowerCase() + '.' +
    String(zona || ZONA_PADRAO).trim().toLowerCase();
}

/** O padrão da rota. Leva o `/*` obrigatoriamente: sem ele só a raiz casaria. */
function padraoDaRota(escola, zona) {
  return hostname(escola, zona) + '/*';
}

/**
 * O REGISTO DNS — idempotente.
 *
 * Olha primeiro o que lá está, e decide:
 *   · não existe → cria (A, 192.0.2.1, proxyado);
 *   · existe e já é o nosso (A + 192.0.2.1 + proxyado) → não toca;
 *   · existe com outro conteúdo → **não toca, e diz porquê**. Um `<escola>.padd.com.br` que já
 *     aponta para outra coisa é de outra pessoa; sobrescrevê-lo seria o pior gesto possível nesta
 *     casa — apagar o que não é nosso para plantar o que é.
 */
async function garantirRegistoDns({ token, escola, zona, fetchImpl }) {
  const nome = hostname(escola, zona);
  const zid = await zonaId({ token, zona, fetchImpl });
  const lista = await api(token, 'GET',
    '/zones/' + zid + '/dns_records?name=' + encodeURIComponent(nome) + '&per_page=100',
    undefined, fetchImpl);
  if (!lista.ok) {
    /* A PERMISSÃO FALTA JÁ NA LEITURA. O token desta casa não tem `Zone → DNS` (medido a
     * 13/11/2026: `dns_records → 403`, com as rotas a funcionar), e a dica tem de aparecer também
     * por aqui — senão o erro sai sem dizer o que fazer, e o socorro é às cegas no painel. */
    return {
      ok: false, host: nome, estado: 'sem-permissao', erro: lista.erro,
      dica: lista.status === 403
        ? 'O CLOUDFLARE_API_TOKEN não tem «Zone → DNS → Edit». Acrescente essa permissão ao token ' +
          '(o mesmo que a raiz já usa) — as rotas já funcionam com ele.'
        : null,
    };
  }
  const existentes = (lista.resultado || []).filter((r) => r.name === nome);
  const nosso = existentes.find((r) => r.type === 'A' && String(r.content) === IP_DO_REGISTO
    && r.proxied === true);
  if (nosso) return { ok: true, host: nome, estado: 'ja-existia', id: nosso.id };
  if (existentes.length) {
    return {
      ok: false, host: nome, estado: 'ocupado',
      erro: 'já existe um registo «' + nome + '» (' + existentes[0].type + ' → ' +
        String(existentes[0].content) + ') que não é deste sistema — não sobrescrevo. ' +
        'Apague-o à mão no Cloudflare se esse endereço deve ser da escola.',
      registo: { tipo: existentes[0].type, conteudo: existentes[0].content },
    };
  }
  const criado = await api(token, 'POST', '/zones/' + zid + '/dns_records', {
    type: 'A', name: nome, content: IP_DO_REGISTO, proxied: true,
    comment: 'Sistema Lastro — escola ' + escola + ' (criado pelo painel)',
  }, fetchImpl);
  if (!criado.ok) {
    return {
      ok: false, host: nome, estado: 'falhou', erro: criado.erro,
      /* A PERMISSÃO É O CASO PROVÁVEL, e o token desta casa não a tem por omissão (medido a
       * 13/11/2026: `dns_records → 403`, com as rotas a funcionar). Dizer o que falta poupa a
       * caça. */
      dica: criado.status === 403
        ? 'O CLOUDFLARE_API_TOKEN não tem «Zone → DNS → Edit». Acrescente essa permissão ao token ' +
          '(o mesmo que a raiz já usa) — as rotas já funcionam com ele.'
        : null,
    };
  }
  return { ok: true, host: nome, estado: 'criado', id: criado.resultado && criado.resultado.id };
}

/**
 * A ROTA — idempotente, e pela mesma disciplina.
 *
 * Uma rota que já aponta para OUTRO script é um conflito que se DIZ, e não se corrige por cima:
 * pode ser a rota da escola no shard antigo, ou a de outra coisa qualquer. Quem decide é a pessoa.
 */
async function garantirRota({ token, escola, script, zona, fetchImpl }) {
  const padrao = padraoDaRota(escola, zona);
  const zid = await zonaId({ token, zona, fetchImpl });
  const lista = await api(token, 'GET', '/zones/' + zid + '/workers/routes', undefined, fetchImpl);
  if (!lista.ok) {
    return { ok: false, padrao, estado: 'sem-permissao', erro: lista.erro };
  }
  const existentes = (lista.resultado || []).filter((r) => r.pattern === padrao);
  const nossa = existentes.find((r) => r.script === script);
  if (nossa) return { ok: true, padrao, estado: 'ja-existia', id: nossa.id, script };
  if (existentes.length) {
    return {
      ok: false, padrao, estado: 'ocupado',
      erro: 'a rota «' + padrao + '» já aponta ao script «' + String(existentes[0].script) +
        '», e não a «' + script + '» — não a substituo por conta própria.',
      script: existentes[0].script,
    };
  }
  const criada = await api(token, 'POST', '/zones/' + zid + '/workers/routes', {
    pattern: padrao, script,
  }, fetchImpl);
  if (!criada.ok) return { ok: false, padrao, estado: 'falhou', erro: criada.erro, script };
  return { ok: true, padrao, estado: 'criada', id: criada.resultado && criada.resultado.id, script };
}

/**
 * LIGA O DOMÍNIO — as duas coisas, e o resultado DAS DUAS.
 *
 * Não lança: uma escola que não conseguiu o domínio não pode deixar de existir por isso. O que
 * falhou vai no resultado, com a dica, e quem chama decide o que dizer a quem está a criar.
 *
 * A ORDEM É A CERTA: primeiro o registo (sem ele a rota não é aceite), depois a rota. Se o registo
 * falhar, a rota não é tentada — criá-la apontada a um host que não resolve daria um endereço que
 * responde 1016 e ninguém saberia por quê.
 */
async function ligarDominio({ token, escola, script, zona, fetchImpl }) {
  const alvo = String(script || escola || '').trim();
  if (!token) return { ok: false, erro: 'sem CLOUDFLARE_API_TOKEN', pendente: true };
  if (!escola || !alvo) return { ok: false, erro: 'sem escola ou sem script' };

  let dns;
  try {
    dns = await garantirRegistoDns({ token, escola, zona, fetchImpl });
  } catch (erro) {
    dns = { ok: false, estado: 'falhou', erro: erro && erro.message ? erro.message : String(erro) };
  }
  if (!dns.ok) {
    return {
      ok: false, host: hostname(escola, zona), dns, rota: null, pendente: true,
      erro: 'o registo DNS não ficou feito: ' + (dns.erro || 'erro desconhecido'),
      dica: dns.dica || null,
    };
  }

  let rota;
  try {
    rota = await garantirRota({ token, escola, script: alvo, zona, fetchImpl });
  } catch (erro) {
    rota = { ok: false, estado: 'falhou', erro: erro && erro.message ? erro.message : String(erro) };
  }
  const ok = Boolean(rota.ok);
  return {
    ok,
    host: hostname(escola, zona),
    url: 'https://' + hostname(escola, zona),
    dns,
    rota,
    pendente: !ok,
    erro: ok ? null : ('a rota não ficou feita: ' + (rota.erro || 'erro desconhecido')),
  };
}

/**
 * DESLIGA O DOMÍNIO — para o expurgo e para o desfazer de um provisionamento que morreu.
 *
 * SÓ APAGA O QUE É NOSSO, e o «nosso» está provado em dois sítios:
 *   · o registo DNS tem de ser `A` + `192.0.2.1` + proxyado — a marca que `garantirRegistoDns`
 *     deixa. Um subdomínio com outro conteúdo é de outra pessoa, e fica;
 *   · a rota tem de apontar ao script desta escola. Uma rota com outro script é de outra coisa.
 *
 * Não lança: um expurgo que falha a limpar o domínio não pode ficar a meio. O que não se apagou
 * vai no resultado, e o expurgo já sabe dizer «não está completo».
 */
async function desligarDominio({ token, escola, script, zona, fetchImpl }) {
  const alvo = String(script || escola || '').trim();
  const resultado = { host: hostname(escola, zona), dns: null, rota: null };
  if (!token || !escola) {
    resultado.erro = !token ? 'sem CLOUDFLARE_API_TOKEN' : 'sem escola';
    return resultado;
  }
  let zid;
  try {
    zid = await zonaId({ token, zona, fetchImpl });
  } catch (erro) {
    resultado.erro = erro && erro.message ? erro.message : String(erro);
    return resultado;
  }

  /* AS DUAS LEITURAS VÃO AO MESMO TEMPO: são independentes, e o expurgo já é demorado. */
  const [listaDns, listaRotas] = await Promise.all([
    api(token, 'GET', '/zones/' + zid + '/dns_records?name=' + encodeURIComponent(resultado.host) + '&per_page=100',
      undefined, fetchImpl),
    api(token, 'GET', '/zones/' + zid + '/workers/routes', undefined, fetchImpl),
  ]);

  if (!listaDns.ok) {
    resultado.dns = { apagados: 0, erro: listaDns.erro };
  } else {
    const nosso = (listaDns.resultado || []).filter((r) => r.name === resultado.host
      && r.type === 'A' && String(r.content) === IP_DO_REGISTO && r.proxied === true);
    const alheio = (listaDns.resultado || []).filter((r) => r.name === resultado.host && !nosso.includes(r));
    let apagados = 0;
    for (const r of nosso) {
      const d = await api(token, 'DELETE', '/zones/' + zid + '/dns_records/' + r.id, undefined, fetchImpl);
      if (d.ok) apagados += 1;
    }
    resultado.dns = { apagados, ...(alheio.length ? { mantidos: alheio.length } : {}) };
  }

  if (!listaRotas.ok) {
    resultado.rota = { apagadas: 0, erro: listaRotas.erro };
  } else {
    const padrao = padraoDaRota(escola, zona);
    const nossa = (listaRotas.resultado || []).filter((r) => r.pattern === padrao && r.script === alvo);
    let apagadas = 0;
    for (const r of nossa) {
      const d = await api(token, 'DELETE', '/zones/' + zid + '/workers/routes/' + r.id, undefined, fetchImpl);
      if (d.ok) apagadas += 1;
    }
    resultado.rota = { apagadas };
  }

  return resultado;
}

/** Esquece a zona guardada — só as provas precisam disto (no Worker a zona não muda). */
function esquecerZona() { ZONA_EM_CACHE.clear(); }

module.exports = {
  IP_DO_REGISTO,
  ZONA_PADRAO,
  hostname,
  padraoDaRota,
  zonaId,
  garantirRegistoDns,
  garantirRota,
  ligarDominio,
  desligarDominio,
  esquecerZona,
};
