/**
 * lib-cifra.js — a cifra do projeto, numa definição só (UMD: Node e navegador).
 *
 *   Node:       const Cifra = require('./lib-cifra.js');   await Cifra.cifrar(texto, senha)
 *   Navegador:  <script src=".../lib-cifra.js"></script>   await Cifra.decifrar(envelope, senha)
 *
 * POR QUE EXISTE. O PageCrypt (o `pagecrypt` que cifra os acompanhamentos) **não exporta
 * `decrypt`** — o que ele publica é `encryptHTML` e `generatePassword`, e o que ele produz é uma
 * PÁGINA que se autodecifra. Para o JSON de dados isso não serve: quem precisa do conteúdo é o
 * formulário (e o check-pacote), não um leitor humano. Então o ESQUEMA dele — que é simples e está
 * EMBUTIDO em cada página que ele gera — é implementado aqui, uma vez, para os três lugares:
 *
 *   · o gerador (Node)         — cifra o JSON de dados do ciclo para o pacote;
 *   · o check-pacote (Node)    — decifra a cópia do pacote e a compara com a fonte;
 *   · o formulário (navegador) — decifra o JSON para mostrar o que já foi lançado.
 *
 * O ESQUEMA (conferido no descriptografador embutido de um acompanhamento real):
 *
 *   chave    = PBKDF2(senha, salt, 2e6, SHA-256) → AES-GCM 256
 *   endereço = base64( [salt 32 bytes][iv 16 bytes][ciphertext + tag] )
 *
 * A compatibilidade NÃO é suposta: o teste abre um acompanhamento de verdade com esta lib.
 */

const ALGORITMO = 'PBKDF2-SHA256+AES-GCM';
// O mesmo número das páginas do PageCrypt deste repositório: nas páginas reais o atributo vem
// escrito `data-i="2e+6"` — dois milhões de iterações de PBKDF2.
const ITERACOES = 2e6;

const webcrypto = () => {
  if (globalThis.crypto && globalThis.crypto.subtle) return globalThis.crypto;
  // Node antigo (sem `globalThis.crypto`): o webcrypto do módulo nativo.
  return require('node:crypto').webcrypto;
};
const sutil = () => webcrypto().subtle;
const aleatorio = (n) => webcrypto().getRandomValues(new Uint8Array(n));

const textoParaBytes = (t) => new TextEncoder().encode(t);
const bytesParaTexto = (b) => new TextDecoder().decode(b);

const base64 = {
  de: (s) => (typeof Buffer !== 'undefined'
    ? Uint8Array.from(Buffer.from(s, 'base64'))
    : Uint8Array.from(atob(s), (c) => c.charCodeAt(0))),
  para: (u8) => (typeof Buffer !== 'undefined'
    ? Buffer.from(u8).toString('base64')
    : btoa(String.fromCharCode(...u8))),
};

const derivarChave = async (senha, salt, iteracoes) => {
  const s = sutil();
  const base = await s.importKey('raw', textoParaBytes(senha), 'PBKDF2', false, ['deriveKey']);
  return s.deriveKey({ name: 'PBKDF2', salt, iterations: iteracoes, hash: 'SHA-256' }, base,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
};

/** Cifra um texto e devolve o ENVELOPE (`{algoritmo, iteracoes, endereco}`). */
async function cifrar(texto, senha, opcoes = {}) {
  const s = sutil();
  const iteracoes = opcoes.iteracoes || ITERACOES;
  const salt = opcoes.salt || aleatorio(32);
  const iv = opcoes.iv || aleatorio(16);
  const chave = await derivarChave(senha, salt, iteracoes);
  const cifrado = new Uint8Array(
    await s.encrypt({ name: 'AES-GCM', iv }, chave, textoParaBytes(texto)));
  const junto = new Uint8Array(salt.length + iv.length + cifrado.length);
  junto.set(salt, 0);
  junto.set(iv, salt.length);
  junto.set(cifrado, salt.length + iv.length);
  return { algoritmo: ALGORITMO, iteracoes, endereco: base64.para(junto) };
}

/**
 * Decifra: aceita o ENVELOPE (`{endereco, iteracoes}`), o endereço cru em base64, ou — para abrir as
 * páginas do PageCrypt — o texto do `<pre data-i>` com as iterações por argumento.
 * Senha errada lança (o AES-GCM autentica e falha) — não devolve lixo.
 */
async function decifrar(cifrado, senha, iteracoes = 0) {
  const endereco = typeof cifrado === 'string' ? cifrado : (cifrado && cifrado.endereco);
  const n = iteracoes || (cifrado && cifrado.iteracoes) || ITERACOES;
  if (!endereco) throw new Error('cifra: sem endereço para decifrar');
  const junto = base64.de(endereco);
  const salt = junto.slice(0, 32);
  const iv = junto.slice(32, 48);
  const dados = junto.slice(48);
  const chave = await derivarChave(senha, salt, n);
  return bytesParaTexto(await sutil().decrypt({ name: 'AES-GCM', iv }, chave, dados));
}

// ------------------------------------------------- o mesmo esquema, em modo SÍNCRONO (Node)
// O check-pacote é um script síncrono do começo ao fim: virá-lo assíncrono por causa desta
// conferência seria trocar a estrutura dele por causa de uma linha. Então a lib oferece as duas
// formas — e um teste confere que a síncrona abre o que a assíncrona fechou, e o inverso, porque
// duas implementações que ninguém compara divergem. (O navegador só tem a assíncrona: WebCrypto.)
const nativo = () => require('node:crypto');

function cifrarSync(texto, senha, opcoes = {}) {
  const { pbkdf2Sync, randomBytes, createCipheriv } = nativo();
  const iteracoes = opcoes.iteracoes || ITERACOES;
  const salt = opcoes.salt || randomBytes(32);
  const iv = opcoes.iv || randomBytes(16);
  const chave = pbkdf2Sync(senha, salt, iteracoes, 32, 'sha256');
  const c = createCipheriv('aes-256-gcm', chave, iv);
  const cifrado = Buffer.concat([c.update(texto, 'utf8'), c.final(), c.getAuthTag()]);
  return {
    algoritmo: ALGORITMO,
    iteracoes,
    endereco: Buffer.concat([salt, iv, cifrado]).toString('base64'),
  };
}

function decifrarSync(cifrado, senha, iteracoes = 0) {
  const { pbkdf2Sync, createDecipheriv } = nativo();
  const endereco = typeof cifrado === 'string' ? cifrado : (cifrado && cifrado.endereco);
  const n = iteracoes || (cifrado && cifrado.iteracoes) || ITERACOES;
  if (!endereco) throw new Error('cifra: sem endereço para decifrar');
  const junto = Buffer.from(endereco, 'base64');
  const salt = junto.subarray(0, 32);
  const iv = junto.subarray(32, 48);
  const resto = junto.subarray(48);
  const dados = resto.subarray(0, resto.length - 16);
  const tag = resto.subarray(resto.length - 16);
  const chave = pbkdf2Sync(senha, salt, n, 32, 'sha256');
  const d = createDecipheriv('aes-256-gcm', chave, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(dados), d.final()]).toString('utf8');
}

// ---------------------------------------------------------------------- os dois ambientes
// Browser: define `Cifra` no global (a tag <script src> basta). Node: module.exports.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Cifra = fabrica();
}(typeof self !== 'undefined' ? self : this,
  () => ({ cifrar, decifrar, cifrarSync, decifrarSync, ITERACOES, ALGORITMO })));
