'use strict';

/**
 * adaptadores/cloudflare.js — o armazenamento sobre o WORKER (ASSETS + KV).
 *
 * Implementa o contrato de `../nucleo/armazenamento.js` com os bindings do
 * Cloudflare:
 *   - `env.ASSETS`  — o conteúdo ESTÁTICO (po.json, anamnese.json, esquema),
 *                     lido por `fetch`. Read-only.
 *   - `env.PADD_KV` — os envelopes (o dado dinâmico), lido/escrito por
 *                     `get`/`put`/`list`.
 *
 * A divisão espelha o `workers/receber.js`: o ASSETS serve o que não muda, o KV
 * guarda o que a elicitação produz. O adaptador NÃO sabe o que é um PO nem uma
 * anamnese — só lê de um lado e escreve no outro, sob chaves. O que ele ACRESCENTA
 * sobre o KV compartilhado é o ISOLAMENTO: as famílias que não carregam a escola na
 * própria chave (o envelope e o registro de custo) ganham o slug da escola na frente —
 * uma escola nunca lê o dado da outra.
 *
 * Uso (dentro de um Worker, ou num teste com `env` falso):
 *   const { criarCloudflare } = require('./adaptadores/cloudflare.js');
 *   const armazem = criarCloudflare(env);
 *   await armazem.guardar('maria/tiago/01/anamnese/x', texto);
 */

function criarCloudflare(env) {
  const kv = env && env.PADD_KV;
  const assets = env && env.ASSETS;
  // O KV é COMPARTILHADO entre escolas (o mesmo namespace). O cofre, o lançamento e os
  // Bastidores já carregam a escola na PRÓPRIA chave (primeiro segmento). O ENVELOPE
  // (`envelope/<id>.json`) e o REGISTRO DE CUSTO (`ia-registro/...`) NÃO carregam: são
  // chaves agnósticas de escola. Para uma escola nunca ler o dado da outra (a Barra lendo
  // os envelopes da Maria), o adaptador namespaça SÓ estas duas famílias: a chave FÍSICA
  // no KV ganha o slug da escola na frente; a chave LÓGICA (a que o núcleo vê) continua a
  // mesma. Sem `ESCOLA_SLUG` (a raiz `danca`, que não é escola), nada muda.
  const escola = String((env && env.ESCOLA_SLUG) || '').trim();
  const escolar = (chave) => {
    if (!escola) return chave;
    if (chave.startsWith('envelope/')) return escola + '/' + chave;
    if (chave.startsWith('ia-registro/')) return escola + '/' + chave;
    return chave;
  };
  const desescolar = (chave) => {
    if (!escola) return chave;
    if (chave.startsWith(escola + '/envelope/')) return chave.slice(escola.length + 1);
    if (chave.startsWith(escola + '/ia-registro/')) return chave.slice(escola.length + 1);
    return chave;
  };

  // ── O REGISTRO DE CHAVES DA ESCOLA (19/10/2026) ──────────────────────────────
  //
  // O KV é COMPARTILHADO e a única forma de saber o que uma escola lá tem é ENUMERAR as
  // chaves — e a enumeração (`kv.list`) tem cota diária própria no plano gratuito. Quando
  // ela estoura, o Worker da escola fica sem as três listas (a estante de planos, os
  // sujeitos, os estados) e o EXPURGO fica sem os nomes das chaves: apaga o Worker e o
  // repositório e deixa o dado no KV, sem saber o que apagar. Aconteceu com a `calango`.
  //
  // A leitura (`get`) não tem essa cota. Então a escola passa a manter um REGISTRO — uma
  // chave só, com os nomes de tudo o que escreveu —, e são dois os consumidores:
  //   · a `listar()` desta camada, que cai nele quando a enumeração falha;
  //   · o expurgo (`motor/servidor/expurgar-escola.js`), que apaga por nome.
  //
  // O registro é um SUPLEMENTO, nunca a autoridade: enquanto a enumeração responde, é ela
  // que manda (o registro pode estar uma escrita atrás, perdida por uma escrita concorrente
  // noutro isolate). Ele custa uma escrita por chave NOVA — o `Set` em memória evita a
  // escrita repetida nas gravações seguintes do mesmo isolate.
  const REGISTRO_DE_CHAVES = escola ? 'bastidores/' + escola + '/.chaves.json' : null;
  const CACHE_DO_REGISTRO = new WeakMap(); // binding KV → Map(escola → Set de chaves)

  function cacheDaEscola() {
    if (!kv || typeof kv !== 'object') return null;
    if (!CACHE_DO_REGISTRO.has(kv)) CACHE_DO_REGISTRO.set(kv, new Map());
    const porEscola = CACHE_DO_REGISTRO.get(kv);
    if (!porEscola.has(escola)) porEscola.set(escola, null); // null = ainda não carregado
    return porEscola;
  }

  /** O conjunto de chaves registadas. Lança se não conseguir ler — quem chama decide. */
  async function carregarRegistro() {
    const porEscola = cacheDaEscola();
    if (!porEscola) return new Set();
    const guardado = porEscola.get(escola);
    if (guardado instanceof Set) return guardado;
    const texto = await kv.get(REGISTRO_DE_CHAVES);
    const chaves = new Set();
    if (texto) {
      try {
        const dados = JSON.parse(String(texto));
        for (const c of (Array.isArray(dados) ? dados : (dados && dados.chaves) || [])) {
          if (typeof c === 'string' && c) chaves.add(c);
        }
      } catch (erro) { /* registo ilegível: reconstruído pela próxima enumeração */ }
    }
    porEscola.set(escola, chaves);
    return chaves;
  }

  async function gravarRegistro(chaves) {
    if (!REGISTRO_DE_CHAVES || typeof kv.put !== 'function') return;
    const corpo = { escola, chaves: Array.from(chaves).sort() };
    await kv.put(REGISTRO_DE_CHAVES, JSON.stringify(corpo, null, 2) + '\n');
  }

  /** Anota a chave FÍSICA no registo. Uma escrita por chave nova, por isolate. */
  async function registrarChave(fisica) {
    if (!REGISTRO_DE_CHAVES || typeof kv.put !== 'function') return;
    try {
      const chaves = await carregarRegistro();
      if (chaves.has(fisica)) return;
      chaves.add(fisica);
      await gravarRegistro(chaves);
    } catch (erro) {
      // O registo é um suplemento: falhar a anotá-lo não pode falhar a gravação do dado.
    }
  }

  /** Anota VÁRIAS chaves de uma vez — o que a enumeração encontrou. Uma escrita só. */
  async function registrarVarias(fisicas) {
    if (!REGISTRO_DE_CHAVES || typeof kv.put !== 'function' || !fisicas.length) return;
    try {
      const chaves = await carregarRegistro();
      let mudou = false;
      for (const f of fisicas) {
        if (!chaves.has(f)) { chaves.add(f); mudou = true; }
      }
      if (mudou) await gravarRegistro(chaves);
    } catch (erro) { /* suplemento: falhar aqui não pode falhar a leitura */ }
  }

  async function esquecerChave(fisica) {
    if (!REGISTRO_DE_CHAVES || typeof kv.put !== 'function') return;
    try {
      const chaves = await carregarRegistro();
      if (!chaves.has(fisica)) return;
      chaves.delete(fisica);
      await gravarRegistro(chaves);
    } catch (erro) { /* idem */ }
  }

  return {
    async ler(chave) {
      // Estático primeiro: o conteúdo vive no ASSETS. Se o ASSETS não existir
      // (ou a chave não for estática), cai no KV — o envelope.
      if (assets && typeof assets.fetch === 'function') {
        const res = await assets.fetch(new URL(chave, 'https://assets.local'));
        if (res.ok) return await res.text();
      }
      if (kv && typeof kv.get === 'function') {
        return await kv.get(escolar(chave));
      }
      return null;
    },
    async guardar(chave, valor) {
      if (!kv || typeof kv.put !== 'function') {
        throw new Error('PADD_KV ausente: não há onde guardar ' + chave);
      }
      await kv.put(escolar(chave), String(valor));
      await registrarChave(escolar(chave));
    },
    async anexar(chave, linha) {
      if (!kv || typeof kv.put !== 'function' || typeof kv.get !== 'function') {
        throw new Error('PADD_KV ausente: não há onde anexar a ' + chave);
      }
      // O KV não tem append: ler-modificar-escrever. A chave guarda o JSONL
      // inteiro, e o anexo é a concatenação. A ressalva de consistência (~60 s
      // no pior caso entre POPs; <100 ms na mesma origem, medido) vale aqui.
      const alvo = escolar(chave);
      const atual = (await kv.get(alvo)) || '';
      await kv.put(alvo, atual + String(linha));
      await registrarChave(alvo);
    },
    async listar(prefixo) {
      if (!kv || typeof kv.list !== 'function') return [];
      const fisico = escolar(prefixo);
      const nomes = [];
      let cursor;
      try {
        for (let volta = 0; volta < 10; volta++) {
          const pagina = await kv.list({ prefix: fisico, cursor });
          for (const k of (pagina && pagina.keys) || []) nomes.push(desescolar(String(k.name)));
          if (!pagina || pagina.list_complete || !pagina.cursor) break;
          cursor = pagina.cursor;
        }
      } catch (erro) {
        // A ENUMERAÇÃO FALHOU — e a causa, medida, é a cota diária do `kv.list` no plano
        // gratuito. A lista vem do REGISTRO da escola, que se lê com `get` (sem cota).
        // Sem registo (escola anterior a esta mudança, ou registo perdido), a falha SOBE:
        // uma lista vazia por falha de leitura é indistinguível de «não há nada gravado».
        const chaves = await carregarRegistro();
        if (!chaves.size) throw erro;
        return Array.from(chaves)
          .filter((c) => c.startsWith(fisico))
          .map(desescolar)
          .sort();
      }
      // A ENUMERAÇÃO DEU CERTO: é ela a autoridade, e o que ela viu entra no registo. É assim
      // que uma escola anterior a esta mudança ganha o registo que ainda não tinha — a
      // próxima vez que a cota faltar, os nomes já lá estão.
      await registrarVarias(nomes.map(escolar));
      return nomes.sort();
    },
    async existe(chave) {
      if (!kv || typeof kv.get !== 'function') return false;
      return (await kv.get(escolar(chave))) !== null;
    },
    async apagar(chave) {
      if (!kv || typeof kv.delete !== 'function') return false;
      await kv.delete(escolar(chave));
      await esquecerChave(escolar(chave));
      return true;
    },
  };
}

module.exports = { criarCloudflare };
