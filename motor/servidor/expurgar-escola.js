'use strict';

/**
 * expurgar-escola.js — o INVERSO do provisionar-escola.js: apaga uma escola do Cloudflare.
 *
 * O hook de expurgo (IDEIA-PAINEL-ESCOLA.md §17.5) apaga a escola quando ela está
 * desabilitada e o prazo passou — «deixa de existir e libera espaço». A ordem é a da
 * criação, invertida: desliga o subdomínio, apaga o script do Worker e (se a escola
 * declarar) as chaves do KV com o prefixo dela.
 *
 * O namespace KV é COMPARTILHADO entre escolas — por isso a limpeza de chaves é por
 * PREFIXO, e por todos os prefixos da escola (`prefixosDaEscola`), nunca do namespace
 * inteiro (outras escolas vivem nele).
 *
 * Fronteira: só Cloudflare REST API via `fetch` (Web Standard) — corre no Worker e no
 * Node. O token chega por parâmetro, nunca é lido daqui de dentro.
 */

// O sufixo dos subdomínios de escola (o mesmo de provisionar-escola.js).
const SUBDOMINIO = 'tmenegaz77';

/** Uma chamada Cloudflare REST simples (DELETE, sem corpo). Devolve `{ ok, status, dados }`. */
async function api(token, metodo, caminho) {
  const res = await fetch('https://api.cloudflare.com/client/v4' + caminho, {
    method: metodo,
    headers: { 'Authorization': 'Bearer ' + token },
  });
  const dados = await res.json().catch(() => ({}));
  return { ok: res.ok && dados.success === true, status: res.status, dados };
}

/**
 * OS PREFIXOS DE UMA ESCOLA — e são DOIS, não um.
 *
 * Medido na conta, na escola `barra`: o dado dela vive sob `barra/` (o envelope e a
 * anamnese) **e** sob `bastidores/barra/` (alunas, curadorias, professores, turmas,
 * turma-conteudos, vocabulario). São 11 chaves; quem limpa só `barra/` deixa as 6 do
 * cadastro de alunas para trás — ou seja, apaga a escola e guarda as alunas.
 *
 * A lista mora AQUI, e não no chamador, para que o Cron do andaime e a rota da página
 * limpem a mesma coisa. Duas definições divergiriam, e a que ficasse para trás seria a
 * que apaga menos.
 */
function prefixosDaEscola(slug) {
  return [slug + '/', 'bastidores/' + slug + '/'];
}

/**
 * Lista os NOMES das chaves do KV com um prefixo — PAGINANDO.
 *
 * Devolve `{ ok, status, chaves, erro }`. O `ok` existe porque a versão anterior devolvia
 * `[]` tanto para «não há nada» quanto para «a API recusou» — e o expurgo, sem saber a
 * diferença, relatava `0 de 0 chave(s)`, que se lê como sucesso. Foi assim que o KV da
 * Maria sobreviveu ao próprio expurgo sem que o relatório dissesse nada.
 *
 * A paginação também protege contra o mesmo silêncio por outro caminho: a API devolve no
 * máximo 1 000 chaves por chamada, e uma escola com muitos lançamentos passaria disso —
 * o que não fosse listado não seria apagado.
 */
async function listarChavesSeguro({ token, accountId, namespaceId, prefixo }) {
  const chaves = [];
  let cursor = null;
  let status = 0;
  for (;;) {
    const url = 'https://api.cloudflare.com/client/v4/accounts/' + accountId +
      '/storage/kv/namespaces/' + namespaceId + '/keys?limit=1000&prefix=' + encodeURIComponent(prefixo) +
      (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
    const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
    status = res.status;
    const dados = await res.json().catch(() => ({}));
    if (!res.ok || dados.success !== true) {
      const recado = (dados.errors && dados.errors[0] && dados.errors[0].message) || ('HTTP ' + res.status);
      return { ok: false, status, chaves: [], erro: recado };
    }
    for (const k of dados.result || []) {
      const nome = k && k.name ? k.name : (typeof k === 'string' ? k : null);
      if (nome) chaves.push(nome);
    }
    const info = dados.result_info || {};
    cursor = info.cursor && info.list_complete !== true ? info.cursor : null;
    if (!cursor) break;
  }
  return { ok: true, status, chaves, erro: null };
}

/** A forma antiga, só os nomes. Mantida para quem só quer ler (e para os testes). */
async function listarChaves({ token, accountId, namespaceId, prefixo }) {
  return (await listarChavesSeguro({ token, accountId, namespaceId, prefixo })).chaves;
}

/**
 * Apaga as chaves da escola — por TODOS os prefixos dela — e RECONFERE.
 *
 * A reconferência é o ponto: depois de apagar, lista de novo. Sem ela, «não consegui» e
 * «não havia» voltam a parecer a mesma coisa, que é o defeito que esta função existe para
 * não repetir. `restantes` é o número que fecha a conta; `ok` só é verdadeiro se todos os
 * prefixos foram listados e nada sobrou.
 *
 * Aceita `prefixos` (lista) ou `prefixo` (um só, compatibilidade com o andaime do §17.5).
 * Sem nenhum dos dois, usa os prefixos padrão da escola — porque o silêncio, aqui, apaga
 * menos do que devia.
 */
async function apagarChavesDeEscola({ token, accountId, namespaceId, prefixo, prefixos, slug }) {
  // `null` e `undefined` NÃO são a mesma coisa aqui: `null` é «o config diz que esta escola
  // não tem namespace» — não havia o que limpar, e isso é sucesso. `undefined`/vazio é «não
  // sei onde ela vive» — e aí não se finge que deu certo.
  if (namespaceId === null) {
    return {
      ok: true,
      nota: 'a escola não declara namespace de KV — não havia o que limpar',
      porPrefixo: [],
      apagadas: 0,
      total: 0,
      restantes: 0,
      falhasDeListagem: 0,
    };
  }
  if (namespaceId === undefined || namespaceId === '') {
    return {
      ok: false,
      erro: 'não sei onde vive o KV desta escola — nenhuma chave foi limpa',
      porPrefixo: [],
      apagadas: 0,
      total: 0,
      restantes: null,
    };
  }
  // PREFIXO VAZIO É RECUSADO. Ele casaria com TODAS as chaves do namespace — e o namespace
  // dos ciclos é COMPARTILHADO: apagar por prefixo vazio apaga o dado das outras escolas.
  // Era o que ia acontecer aqui: um `prefixo: ''` não combinado caiu no prefixo padrão (a
  // string vazia é falsy) e, pior, o relatório não deixava isso visível. Recusar é melhor do
  // que escolher por quem chamou.
  if (prefixo === '' || (Array.isArray(prefixos) && prefixos.length === 0)) {
    return {
      ok: false,
      erro: 'prefixo vazio apagaria o namespace inteiro — diga os prefixos da escola',
      porPrefixo: [],
      apagadas: 0,
      total: 0,
      restantes: null,
    };
  }
  const lista = (prefixos && prefixos.length ? prefixos : null)
    || (prefixo ? [prefixo] : null)
    || (slug ? prefixosDaEscola(slug) : null);
  if (!lista || !lista.length) {
    return { ok: false, erro: 'sem prefixos: não sei o que apagar', porPrefixo: [], apagadas: 0, total: 0, restantes: null };
  }

  const porPrefixo = [];
  let apagadas = 0;
  let total = 0;
  let falhasDeListagem = 0;
  let restantes = 0;

  // O TOTAL DO NAMESPACE, antes e depois. `restantes` conta só o que sobrou SOB OS PREFIXOS
  // OLHADOS — uma chave com prefixo fora da lista (ou sem prefixo nenhum, como os antigos
  // `envelope/*`) não apareceria, e o relatório diria «nada sobrou» com o dado no lugar.
  // Medido no namespace da Maria: 6 chaves, relatório dizendo `3 de 3` e `restantes: 0`, e
  // as 3 `envelope/*` continuando lá.
  const antesDoNamespace = await listarChavesSeguro({ token, accountId, namespaceId, prefixo: '' });

  for (const p of lista) {
    const antes = await listarChavesSeguro({ token, accountId, namespaceId, prefixo: p });
    if (!antes.ok) {
      falhasDeListagem += 1;
      porPrefixo.push({ prefixo: p, listou: false, erro: antes.erro, total: null, apagadas: 0, restantes: null });
      continue;
    }
    let apagadasAqui = 0;
    let recusadas = 0;
    for (const chave of antes.chaves) {
      const caminho = '/accounts/' + accountId + '/storage/kv/namespaces/' + namespaceId +
        '/values/' + encodeURIComponent(chave);
      const r = await api(token, 'DELETE', caminho);
      if (r.ok) apagadasAqui += 1;
      else recusadas += 1;
    }
    const depois = await listarChavesSeguro({ token, accountId, namespaceId, prefixo: p });
    const sobraram = depois.ok ? depois.chaves.length : null;
    apagadas += apagadasAqui;
    total += antes.chaves.length;
    restantes += sobraram || 0;
    porPrefixo.push({
      prefixo: p,
      listou: true,
      total: antes.chaves.length,
      apagadas: apagadasAqui,
      recusadas,
      restantes: sobraram,
      sobrou: depois.ok ? depois.chaves.slice(0, 5) : null,
    });
  }

  const depoisDoNamespace = await listarChavesSeguro({ token, accountId, namespaceId, prefixo: '' });

  return {
    ok: falhasDeListagem === 0 && restantes === 0,
    porPrefixo,
    apagadas,
    total,
    restantes,
    falhasDeListagem,
    // O namespace é COMPARTILHADO: sobrar chave nele não é, por si, falha — pode ser de outra
    // escola. Por isso estes números são RELATO, não trava. Mas ficam no relatório, porque
    // uma escola que sai do ar deixando chave para trás é exatamente o que não pode passar
    // em branco.
    namespace: {
      listou: antesDoNamespace.ok && depoisDoNamespace.ok,
      antes: antesDoNamespace.ok ? antesDoNamespace.chaves.length : null,
      depois: depoisDoNamespace.ok ? depoisDoNamespace.chaves.length : null,
    },
  };
}

/**
 * Apaga a escola do Cloudflare: o subdomínio, o script do Worker e as chaves do KV sob
 * TODOS os prefixos dela (ver `prefixosDaEscola`). Devolve um relatório por etapa — o
 * hook usa para registrar o que foi apagado.
 *
 * `kv` é `{ namespaceId, prefixos? }`. Sem `prefixos`, valem os da escola — o padrão é o
 * certo, porque o silêncio aqui apaga menos do que devia. **Sem `namespaceId`, o KV NÃO é
 * tocado e o relatório diz isso**: a versão anterior só limpava quando o chamador passava
 * `namespaceId` E `prefixo`, e quem não passava recebia de volta o mesmo `kv: null` de
 * «não havia nada» — a diferença entre «não limpei» e «não havia» não aparecia em lugar
 * nenhum.
 *
 * `slug` é o identificador da escola (a chave do andaime e o prefixo do KV); `worker` é
 * o NOME do script/subdomínio no Cloudflare. Quando o `--worker` do criar-escola.sh
 * diverge do slug, é `worker` que manda no Cloudflare — o slug continua sendo quem
 * nomeia o KV e o relatório. Sem `worker`, cai no slug (o caso comum).
 */
async function excluirEscola({ token, accountId, slug, worker, kv }) {
  const alvo = worker || slug;
  const base = '/accounts/' + accountId + '/workers/scripts/' + alvo;
  const resultado = { slug, worker: alvo, subdominio: null, script: null, kv: null };

  resultado.subdominio = await api(token, 'DELETE', base + '/subdomain');
  resultado.script = await api(token, 'DELETE', base);
  if (kv) {
    resultado.kv = await apagarChavesDeEscola({
      token,
      accountId,
      namespaceId: kv.namespaceId,
      prefixos: kv.prefixos,
      prefixo: kv.prefixo,
      slug,
    });
  }

  return resultado;
}

module.exports = {
  excluirEscola,
  apagarChavesDeEscola,
  listarChaves,
  listarChavesSeguro,
  prefixosDaEscola,
  SUBDOMINIO,
};
