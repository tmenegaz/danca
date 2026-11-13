'use strict';

/**
 * mapa-de-escolas.js — QUE ESCOLA É ESTE PEDIDO, decidido pelos DADOS e não pelo deploy.
 *
 * O QUE MUDOU (13/11/2026). A escola de um pedido vinha da `vars` `ESCOLA_SLUG` do
 * `wrangler.<escola>.jsonc`. Isso amarra três coisas que a topologia de shard precisa de soltar:
 * o Worker ao nome da escola (um Worker por escola, para sempre), o **deploy** à identidade (mudar
 * um slug é reeditar e reimplantar), e o **código** ao dado (a lista de escolas vive em ficheiros
 * de configuração, não em algo que o Worker leia).
 *
 * Agora a escola resolve-se por um **mapa em KV** — `escolas/por-host`, um objeto
 * `{ "<hostname>": "<slug>" }` —, com cache de isolate. É a mesma forma que a casa já usa em dois
 * sítios (`MENU_EM_CACHE` na ponte, `CACHE_DO_REGISTRO` no adaptador): não é uma ideia nova.
 *
 * O QUE O CACHE CUSTA, DITO. Ele vive na ISOLATE. Um isolate novo paga **uma** leitura do mapa e
 * serve todas as escolas que ali caírem — no shard, um isolate serve N escolas e a leitura é uma
 * só, partilhada. No regime de hoje (um Worker por escola) é uma leitura por isolate, e não por
 * pedido: medido contra o orçamento, é ruído.
 *
 * A ESCOLA NÃO SE INVENTA. Se o host não está no mapa e não há `ESCOLA_SLUG`, o resultado é
 * «nada» — e a ponte responde com a página de configuração incorreta, como antes. Entrar em
 * serviço com uma escola adivinhada seria pior do que não servir: o dado iria para o sítio errado.
 *
 * E A ESCOLA NÃO SE CONTRADIZ. Quando o mapa diz uma escola e a `vars` diz outra, é um deploy
 * trocado — e o resultado é um erro VISÍVEL, com as duas à mostra. Foi para isso que a trava
 * antiga existiu («antes, um deploy trocado era SILENCIOSO»), e a rede de segurança mantém-se:
 * a `vars` passa a ser opcional, mas quando está lá é uma EXPECTATIVA que se confere.
 */

/** O mapa inteiro numa chave: N escolas, um objeto pequeno. Lido em todas as escolas, escrito
 *  quando uma nasce (raro). Não cresce como um registo — cresce como uma LISTA, e a lista de
 *  escolas é o que ela é. */
const CHAVE = 'escolas/por-host';

/** Quanto tempo o mapa fica na isolate. Curto de propósito: uma escola nova tem de aparecer sem
 *  se esperar por um isolate morrer. E, no caminho da falta, há uma releitura imediata — o TTL é
 *  só a economia do caso comum, não a correção do caso raro. */
const TTL = 60 * 1000;

/** binding KV → { mapa, em }. Pelo binding e não por módulo: duas escolas no mesmo processo (as
 *  bancadas) têm bindings diferentes e não podem partilhar o mapa de uma. */
const EM_CACHE = new WeakMap();

function normalizarHost(host) {
  return String(host || '').trim().toLowerCase().replace(/\.+$/, '');
}

/** O mapa como objeto simples — ou `null` se não houver, ou se o que houver não for um mapa. */
function comoMapa(bruto) {
  if (bruto === null || bruto === undefined || bruto === '') return null;
  let valor = bruto;
  if (typeof valor === 'string') {
    try { valor = JSON.parse(valor); } catch (erro) { return null; }
  }
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null;
  const limpo = {};
  for (const [casa, escola] of Object.entries(valor)) {
    const h = normalizarHost(casa);
    const e = String(escola || '').trim();
    if (h && e) limpo[h] = e;
  }
  return limpo;
}

/**
 * A leitura crua, sem cache. É a única chamada ao KV deste módulo, e é ela que os dois caminhos
 * (o normal e a releitura da falta) usam — uma segunda leitura escrita à parte divergiria.
 */
async function lerMapa(kv) {
  if (!kv || typeof kv.get !== 'function') return null;
  try {
    return comoMapa(await kv.get(CHAVE));
  } catch (erro) {
    return null;
  }
}

/** Esquece o que está guardado nesta isolate. Para as provas e para quem escreve o mapa. */
function esquecer(kv) {
  if (kv && typeof kv === 'object') EM_CACHE.delete(kv);
}

/** A leitura com cache. `forcar` ignora o TTL — é o que a falta usa. */
async function mapaEmCache(kv, forcar) {
  if (!kv || typeof kv !== 'object') return null;
  const guardado = EM_CACHE.get(kv);
  if (!forcar && guardado && Date.now() - guardado.em < TTL) return guardado.mapa;
  const mapa = await lerMapa(kv);
  /* A FALHA NÃO SE GUARDA: um KV ilegível devolveria `null`, e guardar esse `null` por um minuto
   * poria todas as escolas numa página de erro por causa de um erro passageiro. O `null` por
   * leitura falhada e o `null` por mapa ainda não escrito são indistinguíveis aqui — e é por isso
   * que a releitura da falta acontece de qualquer maneira. */
  if (mapa) EM_CACHE.set(kv, { mapa, em: Date.now() });
  return mapa;
}

/**
 * A ESCOLA DE UM HOST, a partir do mapa — ou `null`.
 *
 * DUAS FORMAS, e a segunda é a que faz o domínio próprio funcionar sem uma entrada por domínio:
 *
 *   1. o host EXATO (`calango.tmenegaz77.workers.dev`);
 *   2. o primeiro rótulo, se ele for uma escola REGISTADA (`calango.padd.com.br` → `calango`).
 *
 * A segunda não é adivinhação: o rótulo só vale se o nome já for uma escola do mapa — o conjunto
 * é fechado e está em KV. Um host qualquer (`www`, um IP, um domínio de terceiro) não casa com
 * nada, e a ponte diz que não sabe quem é.
 */
function doMapa(mapa, host) {
  if (!mapa) return null;
  const h = normalizarHost(host);
  if (!h) return null;
  if (mapa[h]) return { escola: mapa[h], por: 'host' };
  const rotulo = h.split('.')[0];
  if (!rotulo) return null;
  const conhecidas = new Set(Object.values(mapa));
  if (conhecidas.has(rotulo)) return { escola: rotulo, por: 'rotulo' };
  return null;
}

/** O subdomínio — a primeira etiqueta do host. É o que a trava antiga comparava. */
function subdominioDe(host) {
  return normalizarHost(host).split('.')[0] || '';
}

/**
 * RESOLVE A ESCOLA DE UM PEDIDO.
 *
 * Devolve `{ escola, origem, por, esperada, conflito }`:
 *
 *   · `origem` — `'mapa'` (o dado mandou), `'vars'` (não há entrada no mapa; vale a var, o caminho
 *     de antes), ou `'nada'` (ninguém sabe que escola é esta);
 *   · `esperada` — a `vars`, quando existe. É a expectativa que se confere;
 *   · `conflito` — `true` quando mapa e var dizem escolas diferentes. Quem chama RECUSA servir:
 *     servir a escola do mapa um bundle que se acha outra é o deploy trocado que a trava existe
 *     para apanhar.
 */
async function resolver(env, host) {
  const kv = env && env.PADD_KV;
  const esperada = String((env && env.ESCOLA_SLUG) || '').trim() || null;

  let achado = doMapa(await mapaEmCache(kv, false), host);
  /* A FALTA RELÊ, e sem esperar o TTL. Uma escola acabada de criar tem de resolver no primeiro
   * pedido; um mapa em cache que ainda não a tem devolveria «não sei quem és» e a pessoa veria a
   * página de configuração incorrecta numa escola que está certa. A releitura custa uma leitura
   * de KV — e só acontece quando o cache não bastou. */
  if (!achado && kv) achado = doMapa(await mapaEmCache(kv, true), host);

  if (achado) {
    return {
      escola: achado.escola,
      origem: 'mapa',
      por: achado.por,
      esperada,
      conflito: Boolean(esperada) && esperada !== achado.escola,
    };
  }
  if (esperada) {
    return { escola: esperada, origem: 'vars', por: null, esperada, conflito: false };
  }
  return { escola: null, origem: 'nada', por: null, esperada: null, conflito: false };
}

/**
 * REGISTA UMA ESCOLA — lê, junta, grava. É o que a criação de escola chama.
 *
 * O «ler-modificar-gravar» tem a janela que todo o KV desta casa tem (1 escrita por segundo por
 * chave; dois nascimentos simultâneos podem perder um). Não se esconde: a alternativa seria uma
 * chave por host (`escolas/host/<host>`), sem janela nenhuma mas com uma leitura por host em vez
 * de uma por isolate. Escolheu-se a leitura barata, porque criar escolas é raro e ler é o que
 * acontece sempre — e porque o mesmo `criar-escola` que perdeu uma entrada volta a escrevê-la se
 * for repetido.
 */
async function registar(kv, host, escola) {
  const h = normalizarHost(host);
  const e = String(escola || '').trim();
  if (!kv || typeof kv.put !== 'function') throw new Error('mapa de escolas: sem KV onde gravar');
  if (!h) throw new Error('mapa de escolas: host vazio');
  if (!e) throw new Error('mapa de escolas: escola vazia');
  const atual = (await lerMapa(kv)) || {};
  if (atual[h] === e) return { ok: true, inalterado: true, mapa: atual };
  const novo = Object.assign({}, atual, { [h]: e });
  await kv.put(CHAVE, JSON.stringify(novo));
  esquecer(kv);
  return { ok: true, inalterado: false, mapa: novo };
}

module.exports = {
  CHAVE,
  TTL,
  normalizarHost,
  subdominioDe,
  comoMapa,
  lerMapa,
  mapaEmCache,
  doMapa,
  resolver,
  registar,
  esquecer,
};
