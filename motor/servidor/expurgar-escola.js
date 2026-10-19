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

/**
 * A RELISTAGEM DO KV PODE ATRASAR — e atrasou. Em 19/10/2026, ao expurgar a escola `fita`, o
 * relatório disse `bastidores/fita/ → 8 de 8 · sobraram 1`, e a listagem do NAMESPACE, feita
 * milissegundos depois, dizia `0`. O KV da Cloudflare é eventualmente consistente: um DELETE
 * pode demorar até ~60 s para desaparecer de um `list`. Sem uma segunda leitura, a página
 * anunciava «sobraram 1 chave — este expurgo NÃO está completo» sobre um namespace vazio.
 *
 * Esperar aqui é barato (só acontece quando algo PARECE ter sobrado) e é o que separa «ficou
 * uma chave» de «a listagem ainda não sabia».
 */
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

/**
 * A LISTA NÃO É O DADO — e em 19/10/2026 ela mentiu para os DOIS lados, na mesma escola.
 *
 * Medido, na escola `calando-teste-1`, com as três chaves na mão:
 *
 *   · FALSO ALARME. A chave `calando-teste-1/envelope/anamnese-…json` continuou a aparecer
 *     no `list` depois de apagada — e a leitura direta dela respondia **404**. A listagem
 *     do KV é um ÍNDICE, e o índice reconstrói-se devagar: uma chave apagada pode continuar
 *     a ser listada por minutos. O relatório dizia «sobraram 1 chave — NÃO está completo»
 *     sobre um namespace que já não a tinha.
 *   · CHAVE QUE FICOU. Duas chaves de `bastidores/…` (`curadorias`, `rubricas`) existiam e
 *     NÃO entraram na listagem feita no início do expurgo — por isso nunca foram apagadas,
 *     e a relistagem logo depois também não as viu. O relatório disse «7 de 7 · sobraram 0»
 *     com os dados da escola ainda no KV. Este é o lado GRAVE: dado que fica.
 *
 * A correção tem de resolver os dois, e por isso não é «esperar mais»: é trocar a FONTE DA
 * VERDADE. Para uma chave, a autoridade é a LEITURA dela (`GET /values/<chave>`), que é
 * forte — 404 é prova de que não está lá, 200 é prova de que está. A listagem passa a ser
 * o que ela é: uma pista para saber o que tentar apagar.
 */

/** A leitura direta de uma chave. `existe` é a única resposta de que o relatório depende. */
async function lerValorSeguro({ token, accountId, namespaceId, chave }) {
  const caminho = '/accounts/' + accountId + '/storage/kv/namespaces/' + namespaceId +
    '/values/' + encodeURIComponent(chave);
  const res = await fetch('https://api.cloudflare.com/client/v4' + caminho, {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  if (res.status === 404) return { existe: false, status: 404 };
  if (res.ok) return { existe: true, status: res.status };
  // Um 500 (ou rede) não prova nem uma coisa nem outra: não se conta como «ficou», e o
  // relatório diz que não deu para conferir — «não sei» nunca se disfarça de «acabou».
  return { existe: null, status: res.status };
}

/**
 * Quantas vezes se tenta apagar, e quanto se espera entre as tentativas.
 *
 * A chave que não foi listada na primeira vez é o caso que importa: a listagem inicial
 * omitiu duas chaves, e sem uma segunda passagem elas nunca seriam apagadas. Três passagens
 * com espera crescente (~2 s + 4 s) cobrem a janela em que o índice se actualiza, e o custo
 * é baixo: cada passagem só faz trabalho se ainda houver chave para apagar.
 */
const PASSAGENS_DA_LIMPEZA = 3;
const esperaDaPassagem = (n) => 2000 * Math.pow(2, n - 1);

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
async function apagarChavesDeEscola({ token, accountId, namespaceId, prefixo, prefixos, slug, pausa }) {
  // A pausa é injetável para a prova correr sem dormir 2+4 s por prefixo. Em produção é o
  // `setTimeout`; nos ensaios, uma função vazia.
  const dormir = typeof pausa === 'function' ? pausa : esperar;
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
  let restantesNaListagem = 0;

  // O TOTAL DO NAMESPACE, antes e depois. `restantes` conta só o que sobrou SOB OS PREFIXOS
  // OLHADOS — uma chave com prefixo fora da lista (ou sem prefixo nenhum, como os antigos
  // `envelope/*`) não apareceria, e o relatório diria «nada sobrou» com o dado no lugar.
  // Medido no namespace da Maria: 6 chaves, relatório dizendo `3 de 3` e `restantes: 0`, e
  // as 3 `envelope/*` continuando lá.
  const antesDoNamespace = await listarChavesSeguro({ token, accountId, namespaceId, prefixo: '' });

  // AS CHAVES QUE JÁ SE TENTOU, POR PREFIXO. Serve para (a) não repetir o DELETE da mesma
  // chave em passagens seguintes e (b) contar `total` como o CONJUNTO visto, e não a soma de
  // listagens que se sobrepõem.
  const vistas = new Map(lista.map((p) => [p, new Set()]));
  const queFicaram = [];

  for (const p of lista) {
    let apagadasAqui = 0;
    let recusadas = 0;
    let listou = false;
    let erroDeListagem = null;

    // AS PASSAGENS. A primeira é o expurgo normal; as seguintes existem porque a listagem
    // OMITE chaves que existem — foi assim que duas chaves de `bastidores/` sobreviveram a
    // um expurgo que se declarou completo. Só se continua se a passagem anterior apagou algo.
    for (let passagem = 1; passagem <= PASSAGENS_DA_LIMPEZA; passagem++) {
      const listagem = await listarChavesSeguro({ token, accountId, namespaceId, prefixo: p });
      if (!listagem.ok) {
        falhasDeListagem += 1;
        erroDeListagem = listagem.erro;
        break;
      }
      listou = true;
      const novas = listagem.chaves.filter((c) => !vistas.get(p).has(c));
      if (passagem > 1 && novas.length === 0) break;
      for (const chave of listagem.chaves) {
        // A chave já tentada não se repete: um 404 na segunda tentativa não é «apagada»,
        // é a mesma chave de antes. Contá-la duas vezes inflaria o relatório.
        if (vistas.get(p).has(chave)) continue;
        vistas.get(p).add(chave);
        const caminho = '/accounts/' + accountId + '/storage/kv/namespaces/' + namespaceId +
          '/values/' + encodeURIComponent(chave);
        const r = await api(token, 'DELETE', caminho);
        if (r.ok || r.status === 404) apagadasAqui += 1; // 404 = já não estava lá
        else recusadas += 1;
      }
      // Espera antes da passagem seguinte: o índice do KV leva segundos a reflectir o que
      // acabou de ser apagado, e uma listagem imediata repetiria a mesma foto.
      if (passagem < PASSAGENS_DA_LIMPEZA) await dormir(esperaDaPassagem(passagem));
    }

    // A VERIFICAÇÃO É POR LEITURA, NÃO POR LISTAGEM. Ver `lerValorSeguro`.
    const restou = [];
    let semConferir = 0;
    const indiceObsoleto = [];
    const ultimaListagem = await listarChavesSeguro({ token, accountId, namespaceId, prefixo: p });
    if (ultimaListagem.ok) {
      for (const chave of ultimaListagem.chaves) {
        const leitura = await lerValorSeguro({ token, accountId, namespaceId, chave });
        if (leitura.existe === true) restou.push(chave);
        else if (leitura.existe === null) semConferir += 1;
        else indiceObsoleto.push(chave);
      }
    } else {
      falhasDeListagem += 1;
      erroDeListagem = ultimaListagem.erro;
      // Sem listagem não há como conferir por leitura — e «não sei» não vira «acabou».
      for (const chave of vistas.get(p)) {
        const leitura = await lerValorSeguro({ token, accountId, namespaceId, chave });
        if (leitura.existe === true) restou.push(chave);
        else if (leitura.existe === null) semConferir += 1;
      }
    }

    const totalDoPrefixo = vistas.get(p).size;
    apagadas += apagadasAqui;
    total += totalDoPrefixo;
    restantesNaListagem += ultimaListagem.ok ? ultimaListagem.chaves.length : 0;
    for (const c of restou) queFicaram.push(c);
    porPrefixo.push({
      prefixo: p,
      listou,
      total: totalDoPrefixo,
      apagadas: apagadasAqui,
      recusadas,
      // `relisted` era «a listagem mostrou chave depois do DELETE». Hoje isso pode ser só o
      // índice atrasado — quem responde se sobrou é `restantes`.
      relisted: indiceObsoleto.length > 0,
      restantes: restou.length,
      semConferir,
      sobrou: restou.slice(0, 5),
      // O índice mostra o que já não existe. Não é dado, é índice: fica no relatório para a
      // página poder dizê-lo, e NÃO entra na conta de `restantes`.
      indiceObsoleto: indiceObsoleto.slice(0, 5),
      indiceObsoletoTotal: indiceObsoleto.length,
      erro: erroDeListagem || undefined,
    });
  }

  const depoisDoNamespace = await listarChavesSeguro({ token, accountId, namespaceId, prefixo: '' });

  // O NAMESPACE É RELATO — a autoridade é a LEITURA de cada chave que sobrou. A versão
  // anterior deduzia «acabou» de uma listagem vazia do namespace, e uma listagem vazia não é
  // prova de nada: o índice do KV atrasa nos dois sentidos (ver `lerValorSeguro`). `restantes`
  // passa a ser o número de chaves que RESPONDEM ao GET — o único que se pode afirmar.
  const namespaceListou = antesDoNamespace.ok && depoisDoNamespace.ok;
  const restantes = queFicaram.length;
  const semConferir = porPrefixo.reduce((n, x) => n + (x.semConferir || 0), 0);
  const restantesNoIndice = porPrefixo.reduce((n, x) => n + (x.indiceObsoletoTotal || 0), 0);
  // Um expurgo só está completo quando NENHUMA chave responde E nada ficou por conferir.
  const ok = falhasDeListagem === 0 && restantes === 0 && semConferir === 0;

  return {
    ok,
    porPrefixo,
    apagadas,
    total,
    restantes,
    // As chaves que ainda respondem ao GET. É esta lista que a página deve mostrar — são os
    // dados que ficaram, com nome e tudo.
    ficaram: queFicaram.slice(0, 10),
    semConferir,
    // «O índice da listagem ainda mostra N chave(s) que já respondem 404.» Não é dado que
    // ficou: é o índice atrasado. Separá-los é o que impede o alarme falso de hoje — e o
    // silêncio de ontem.
    leituraAtrasada: restantes === 0 && (restantesNoIndice > 0 || restantesNaListagem > 0),
    restantesNoIndice,
    restantesNaListagem,
    falhasDeListagem,
    // O namespace é COMPARTILHADO: sobrar chave nele não é, por si, falha — pode ser de outra
    // escola. Por isso estes números são RELATO, não trava. Mas ficam no relatório, porque
    // uma escola que sai do ar deixando chave para trás é exatamente o que não pode passar
    // em branco.
    namespace: {
      listou: namespaceListou,
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
