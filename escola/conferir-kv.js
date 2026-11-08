#!/usr/bin/env node
'use strict';

/**
 * conferir-kv.js — A ESCOLA NOVA NASCE NUM NAMESPACE QUE JÁ TEM HISTÓRIA. ESTA FERRAMENTA VÊ-A.
 *
 * O QUE MOTIVOU (07/11/2026). No §9 do Plano de Ensino da `batata` apareceram quatro exercícios
 * onde só dois tinham sido declarados, e a pergunta dela foi a certa: «como é que estes dois
 * foram parar à memória do KV da escola, se a gente expurgou a batata por completo?».
 *
 * A INVESTIGAÇÃO RESPONDEU OUTRA COISA — o resíduo era da própria escola de teste, escrito na
 * encarnação de hoje —, mas deixou à vista uma lacuna que não é desta vez e é real: **nada
 * confere o KV quando uma escola nasce**. O namespace é COMPARTILHADO por todas as escolas
 * (`kv_namespaces` do `wrangler.<escola>.jsonc` aponta sempre para o mesmo), e o expurgo já
 * falhou uma vez de forma declarada (19/10/2026, o elo sem metade do KV: a cota do `kv.list`
 * acabou a meio). Uma escola criada depois disso herda o que ficou — em silêncio, e com a
 * aparência de estar nova.
 *
 * O QUE ELA FAZ, E O QUE NÃO FAZ. **Lê e diz.** Não apaga nada, e é deliberado: uma criação de
 * escola pode ser uma RECRIAÇÃO por cima de uma escola viva (é o caso normal desta casa), e
 * apagar o KV no acto de criar destruiria o cadastro de quem está a trabalhar. Quem decide o
 * que fazer com o resíduo é a pessoa — com as chaves à frente e o expurgo da escola à mão.
 *
 * ELA NÃO FALHA O BUILD. Um aviso que trava a criação seria pior do que não existir: a
 * verificação passa a ser um obstáculo que se aprende a contornar. Sai sempre `0`; o que muda é
 * o que diz, e no GitHub a linha `::warning::` põe o recado à vista no resumo do workflow.
 *
 * COMO SE USA:
 *
 *   node escola/conferir-kv.js --escola batata
 *
 * Precisa de `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no ambiente (é o que o workflow
 * já tem para o `wrangler deploy`). Sem eles, diz que não conferiu — e «não conferi» nunca é
 * impresso como «está limpo».
 *
 * Vive ao lado do `escola/expurgar.js` de propósito: são o mesmo gesto em dois tempos — este
 * CONFERE, aquele LIMPA. Separados por ficheiro para que ninguém confunda um com o outro.
 *
 * A bancada é `experimentos/provar-kv-da-escola-criada.js`; ela substitui o `fetch` global para
 * medir sem rede e sem token.
 */

const fs = require('fs');
const path = require('path');

/* AS DUAS PEÇAS DO EXPURGO, e é o ponto: os prefixos e o listador são os MESMOS. Uma segunda
 * lista de prefixos divergiria da primeira ao primeiro nome novo — e a conferência diria «limpo»
 * sobre chaves que o expurgo iria apagar. */
const { listarChavesSeguro, prefixosDaEscola } = require('../motor/servidor/expurgar-escola.js');

const RAIZ = path.join(__dirname, '..');

/**
 * Lê um `.jsonc` (o do `wrangler.<escola>`) — `JSON.parse` recusa os comentários, e os
 * comentários destes ficheiros são a documentação de quem os lê. O corte respeita as strings:
 * `"https://…"` continua inteiro.
 *
 * É a MESMA função do `raiz.js` (que a tem local, e não exportada). Está repetida aqui com a
 * consciência disso: exportá-la de lá obrigaria a raiz a expor um detalhe seu, e uma cópia de
 * quinze linhas que se prova valer é menos risco do que um `module.exports` que existe só para
 * servir um CLI. A bancada mede as duas contra o mesmo ficheiro — se divergirem, reprova.
 */
function lerJsonc(texto) {
  let saida = '';
  let dentroDeString = false;
  let escapado = false;
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (dentroDeString) {
      saida += c;
      if (escapado) escapado = false;
      else if (c === '\\') escapado = true;
      else if (c === '"') dentroDeString = false;
      continue;
    }
    if (c === '"') { dentroDeString = true; saida += c; continue; }
    if (c === '/' && texto[i + 1] === '/') {
      while (i < texto.length && texto[i] !== '\n') i += 1;
      saida += '\n';
      continue;
    }
    if (c === '/' && texto[i + 1] === '*') {
      i += 2;
      while (i < texto.length && !(texto[i] === '*' && texto[i + 1] === '/')) i += 1;
      i += 1;
      continue;
    }
    saida += c;
  }
  try { return JSON.parse(saida); } catch { return null; }
}

/** A morada da escola: o namespace do KV, lido do ficheiro que a identifica. */
function namespaceDaEscola(slug, raiz = RAIZ) {
  const caminho = path.join(raiz, 'wrangler.' + String(slug || '').trim() + '.jsonc');
  if (!fs.existsSync(caminho)) {
    return { ok: false, erro: 'não há `' + path.basename(caminho) + '` — não sei onde vive o KV desta escola' };
  }
  const cfg = lerJsonc(fs.readFileSync(caminho, 'utf8'));
  if (!cfg) return { ok: false, erro: '`' + path.basename(caminho) + '` não é JSON legível' };
  const kv = (cfg.kv_namespaces && cfg.kv_namespaces[0]) || null;
  if (!kv || !kv.id) return { ok: false, erro: '`' + path.basename(caminho) + '` não declara namespace de KV' };
  return { ok: true, namespaceId: String(kv.id), arquivo: path.basename(caminho) };
}

/**
 * O QUE JÁ EXISTE NAQUELE SLUG — a pergunta inteira, e a resposta em dados.
 *
 * Devolve `{ conferido, chaves, porPrefixo, erro }`. `conferido: false` significa «não sei» —
 * e é o valor mais importante dos três: um token em falta, uma cota esgotada ou um namespace
 * ilegível NÃO são «está limpo». A confusão entre «não havia» e «não consegui» é o defeito que
 * o expurgo aprendeu a não repetir (ver `apagarChavesDeEscola`), e ela não se repete aqui.
 */
async function chavesDaEscola({ slug, token, accountId, namespaceId, raiz }) {
  const alvo = String(slug || '').trim();
  if (!alvo) return { conferido: false, chaves: [], porPrefixo: {}, erro: 'sem slug' };
  if (!token || !accountId) {
    return {
      conferido: false, chaves: [], porPrefixo: {},
      erro: 'faltam CLOUDFLARE_API_TOKEN e/ou CLOUDFLARE_ACCOUNT_ID — não conferi',
    };
  }
  let ns = namespaceId;
  if (!ns) {
    const morada = namespaceDaEscola(alvo, raiz);
    if (!morada.ok) return { conferido: false, chaves: [], porPrefixo: {}, erro: morada.erro };
    ns = morada.namespaceId;
  }
  const porPrefixo = {};
  const chaves = [];
  for (const prefixo of prefixosDaEscola(alvo)) {
    /* O `listarChavesSeguro` do expurgar-escola.js usa o `fetch` global — e é o mesmo que o
     * expurgo usa, o que é o ponto: se ele mudar de forma, as duas leituras mudam juntas. A
     * bancada substitui o global para medir sem rede. */
    const lista = await listarChavesSeguro({ token, accountId, namespaceId: ns, prefixo });
    if (!lista.ok) {
      return {
        conferido: false, chaves, porPrefixo,
        erro: 'não consegui listar «' + prefixo + '»: ' + (lista.erro || 'sem motivo'),
        namespaceId: ns,
      };
    }
    porPrefixo[prefixo] = lista.chaves.slice();
    for (const c of lista.chaves) if (chaves.indexOf(c) === -1) chaves.push(c);
  }
  return { conferido: true, chaves, porPrefixo, erro: null, namespaceId: ns };
}

/** O que se escreve no log. Separado do efeito para a bancada poder medir o TEXTO. */
function recado(resultado, slug) {
  const alvo = String(slug || '').trim();
  if (!resultado.conferido) {
    return {
      nivel: 'aviso',
      linhas: [
        '::warning::não conferi o KV da escola «' + alvo + '» — ' + resultado.erro,
        '  (a escola é criada de qualquer forma; o que falta é a conferência)',
      ],
    };
  }
  if (!resultado.chaves.length) {
    return {
      nivel: 'limpo',
      linhas: ['kv: «' + alvo + '» nasce num namespace sem chaves suas — conferido por listagem'],
    };
  }
  const linhas = [
    '::warning::o KV da escola «' + alvo + '» JÁ TEM ' + resultado.chaves.length +
      (resultado.chaves.length === 1 ? ' chave' : ' chaves') +
      ' — a escola nasce a herdar o que lá estava',
  ];
  // O VALOR NÃO SE IMPRIME. Uma chave dos Bastidores pode ter apelido de aluna, e o log de um
  // workflow é público para quem tem o repositório. O nome da chave basta para se decidir.
  for (const c of resultado.chaves) linhas.push('  ' + c);
  linhas.push('  Nada foi apagado. O expurgo da escola limpa-o:');
  linhas.push('  node escola/expurgar.js ' + alvo + '   (ou a página «Sistema Lastro»)');
  return { nivel: 'residuo', linhas };
}

async function principal(argv) {
  const args = argv.slice(2);
  const i = args.indexOf('--escola');
  const slug = i === -1 ? '' : String(args[i + 1] || '').trim();
  if (!slug) {
    console.error('uso: node escola/conferir-kv.js --escola <slug>');
    return 0;
  }
  const resultado = await chavesDaEscola({
    slug,
    token: process.env.CLOUDFLARE_API_TOKEN,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  });
  const saida = recado(resultado, slug);
  for (const l of saida.linhas) console.log(l);
  // AVISAR NÃO É FALHAR. Ver a nota do topo: um aviso que trava a criação aprende-se a
  // contornar, e aí a conferência deixa de existir.
  return 0;
}

module.exports = { lerJsonc, namespaceDaEscola, chavesDaEscola, recado, principal };

if (require.main === module) {
  principal(process.argv).then((codigo) => process.exit(codigo)).catch((e) => {
    console.error('::warning::a conferência do KV falhou: ' + (e && e.message ? e.message : e));
    process.exit(0);
  });
}
