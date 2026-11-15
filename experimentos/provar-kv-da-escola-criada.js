#!/usr/bin/env node
'use strict';

/**
 * provar-kv-da-escola-criada.js — a conferência do KV no acto de criar a escola.
 *
 * O QUE MOTIVOU (07/11/2026). No §9 do Plano de Ensino da `batata` apareceram quatro exercícios
 * onde só dois tinham sido declarados, e a pergunta dela foi a certa: «como é que estes dois
 * foram parar à memória do KV da escola, se a gente expurgou a batata por completo?».
 *
 * A INVESTIGAÇÃO RESPONDEU OUTRA COISA — o resíduo era da encarnação de hoje, escrita depois de
 * a escola nascer às 19:25 —, e deixou à vista uma lacuna que não é desta vez: **nada conferia o
 * KV quando uma escola nasce**. O namespace é compartilhado por todas as escolas, e o expurgo já
 * falhou de forma declarada (o elo de 19/10/2026, o único dos oito sem metade do KV).
 *
 * O QUE ESTA PROVA MEDE, e por que é que cada asserção existe:
 *
 *   A. A MORADA. O namespace sai do `wrangler.<escola>.jsonc`, que é jsonc (tem comentários) e
 *      declara `"https://…"` no meio deles. Um leitor que confundisse o `//` de um URL com o
 *      início de um comentário devolveria `null` — e «não sei ler» tem de ser distinguível de
 *      «não tem namespace».
 *
 *   B. A CONFERÊNCIA. Lista os DOIS prefixos da escola (`<slug>/` e `bastidores/<slug>/`) — os
 *      mesmos que o expurgo usa, importados do mesmo sítio: uma segunda lista divergiria da
 *      primeira e a conferência diria «limpo» sobre chaves que o expurgo iria apagar.
 *
 *   C. O QUE NÃO PODE ACONTECER. **Não apaga nada** — medido contando os métodos que saem; e
 *      **«não conferi» nunca sai como «está limpo»** — o caso do token em falta e o da listagem
 *      recusada. É a mesma confusão que o expurgo aprendeu a não repetir («não havia» ≠ «não
 *      consegui»), e aqui ela seria pior: uma escola nasceria a herdar dado com um «limpo» no
 *      log.
 *
 * A bancada não toca na rede nem no KV: substitui o `fetch` global por um de mentira, e o token
 * é inventado. Nada aqui lê ou escreve o namespace de verdade.
 *
 *   uso: node experimentos/provar-kv-da-escola-criada.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const kv = require(path.join(RAIZ, 'escola', 'conferir-kv.js'));
const { prefixosDaEscola } = require(path.join(RAIZ, 'motor/servidor', 'expurgar-escola.js'));
const raizJs = require(path.join(RAIZ, 'motor/servidor', 'raiz.js'));

let total = 0;
let falhas = 0;
function checar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + rotulo); return; }
  falhas += 1;
  console.log('  ✗ ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/** Um `fetch` de mentira: diz o que lhe mandarem por prefixo, e conta os métodos que saem. */
function servicoFalso({ porPrefixo = {}, falhar = null } = {}) {
  const pedidos = [];
  const f = async (url, opcoes) => {
    const metodo = (opcoes && opcoes.method) || 'GET';
    pedidos.push({ metodo, url: String(url) });
    if (falhar) {
      return {
        ok: false, status: falhar.status || 403,
        json: async () => ({ success: false, errors: [{ message: falhar.mensagem || 'recusado' }] }),
      };
    }
    const m = String(url).match(/[?&]prefix=([^&]*)/);
    const prefixo = m ? decodeURIComponent(m[1]) : '';
    const chaves = (porPrefixo[prefixo] || []).map((name) => ({ name }));
    return {
      ok: true, status: 200,
      json: async () => ({ success: true, result: chaves, result_info: { list_complete: true } }),
    };
  };
  return { f, pedidos };
}

const TOKEN = 'token-de-prova';
const CONTA = 'conta-de-prova';

(async () => {
  // ==========================================================================================
  console.log('\nA. A MORADA — o namespace sai do ficheiro que identifica a escola');

  /* O FICHEIRO É DE MENTIRA, E A LIÇÃO É REAL (15/11/2026).
   *
   * Esta secção lia o `wrangler.batata.jsonc` do repositório — «o ficheiro REAL, o da batata».
   * Enquanto a `batata` existiu, funcionou; no dia em que ela foi expurgada, a prova passou a
   * rebentar com `ENOENT` e deixou de medir. Uma prova que depende de uma escola viva morre com
   * ela, e morre a ESTOURAR — que não diz qual asserção falhou.
   *
   * O que se quer medir não é o ficheiro da batata: é a REGRA — que o leitor não confunde o `//`
   * de um URL com um comentário, e que o namespace sai do `PADD_KV`. Isso cabe numa árvore
   * temporária com as mesmas armadilhas (o URL com `//` dentro de uma string). */
  const fs = require('fs');
  const os = require('os');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kv-da-escola-'));
  fs.writeFileSync(path.join(temp, 'wrangler.exemplo.jsonc'),
    '// o cabeçalho de sempre\n'
    + '{\n'
    + '  "name": "exemplo",\n'
    + '  "$schema": "https://unpkg.com/wrangler/config-schema.json",\n'
    + '  "main": "workers/principal.js",\n'
    + '  "assets": { "directory": "publicacao/exemplo", "binding": "ASSETS" },\n'
    + '  "kv_namespaces": [ { "binding": "PADD_KV", "id": "2ee331c7a5bc446ca86c8f2cb039ec16" } ]\n'
    + '}\n', 'utf8');

  const morada = kv.namespaceDaEscola('exemplo', temp);
  checar('lê o `wrangler.<escola>.jsonc` e acha o namespace', morada.ok === true, morada);
  checar('…e o id é o do ficheiro, lido do `kv_namespaces`',
    morada.ok && morada.namespaceId === '2ee331c7a5bc446ca86c8f2cb039ec16', morada.namespaceId);
  const viaConferir = kv.lerJsonc(fs.readFileSync(path.join(temp, 'wrangler.exemplo.jsonc'), 'utf8'));
  checar('…e o leitor de jsonc não confunde o `//` de um URL com um comentário',
    viaConferir && viaConferir.main === 'workers/principal.js'
    && viaConferir.assets && viaConferir.assets.directory === 'publicacao/exemplo',
    viaConferir && { main: viaConferir.main, assets: viaConferir.assets });

  const semFicheiro = kv.namespaceDaEscola('escola-que-nao-existe', temp);
  checar('sem o `wrangler.<escola>.jsonc`, diz que não sabe — não inventa um namespace',
    semFicheiro.ok === false && /não há/.test(semFicheiro.erro), semFicheiro);

  /* A ESCOLA DE SHARD (15/11/2026): sem config dela, o namespace vem do config do SHARD — o KV é
   * partilhado, e o que separa as escolas são os prefixos. Sem isto, a criação dentro do shard
   * avisava «não sei onde vive o KV» a cada vez. */
  fs.mkdirSync(path.join(temp, 'escola', 'nova'), { recursive: true });
  fs.writeFileSync(path.join(temp, 'escola', 'nova', 'indice.json'),
    JSON.stringify({ escola: 'nova', shard: 'shard-a' }), 'utf8');
  fs.writeFileSync(path.join(temp, 'wrangler.shard-a.jsonc'),
    '{\n  "name": "shard-a",\n  "kv_namespaces": [ { "binding": "PADD_KV", "id": "ns-do-shard" } ]\n}\n', 'utf8');
  const daShard = kv.namespaceDaEscola('nova', temp);
  checar('a escola de SHARD acha o namespace no config do shard, e diz que foi por lá',
    daShard.ok === true && daShard.namespaceId === 'ns-do-shard' && daShard.viaShard === 'shard-a', daShard);

  // ==========================================================================================
  console.log('\nB. A CONFERÊNCIA — os dois prefixos da escola, e o que lá está');

  const residuo = servicoFalso({
    porPrefixo: {
      'bastidores/batata/': ['bastidores/batata/turmas', 'bastidores/batata/curadorias'],
      'batata/': ['batata/envelope/plano-01.json'],
    },
  });
  const guardado = globalThis.fetch;
  globalThis.fetch = residuo.f;
  let comResiduo;
  try {
    comResiduo = await kv.chavesDaEscola({
      slug: 'batata', token: TOKEN, accountId: CONTA, raiz: RAIZ,
    });
  } finally {
    globalThis.fetch = guardado;
  }
  checar('a conferência correu', comResiduo.conferido === true, comResiduo);
  checar('…e achou as três chaves, dos DOIS prefixos',
    JSON.stringify(comResiduo.chaves.sort()) === JSON.stringify([
      'bastidores/batata/curadorias', 'bastidores/batata/turmas', 'batata/envelope/plano-01.json',
    ].sort()), comResiduo.chaves);
  checar('…e os prefixos são EXACTAMENTE os do expurgo (importados, não copiados)',
    JSON.stringify(Object.keys(comResiduo.porPrefixo).sort())
    === JSON.stringify(prefixosDaEscola('batata').slice().sort()),
    { daConferencia: Object.keys(comResiduo.porPrefixo), doExpurgo: prefixosDaEscola('batata') });

  /* A LISTAGEM FOI UMA POR PREFIXO — e o expurgo também começa assim. Um segundo `list` por
   * prefixo seria uma leitura a mais na cota, que é o recurso escasso desta casa. */
  checar('…e custou uma listagem por prefixo, como o expurgo',
    residuo.pedidos.length === prefixosDaEscola('batata').length,
    residuo.pedidos.map((p) => p.metodo));

  // ==========================================================================================
  console.log('\nC. O QUE NÃO PODE ACONTECER — não apaga, e «não conferi» não vira «limpo»');

  /* A ASSERÇÃO QUE DÁ SENTIDO À FERRAMENTA. Criar uma escola pode ser recriar por cima de uma
   * escola viva; apagar o KV nesse acto destruiria o cadastro de quem está a trabalhar. */
  checar('nenhum pedido de escrita saiu — a ferramenta só lê',
    residuo.pedidos.every((p) => p.metodo === 'GET'), residuo.pedidos.map((p) => p.metodo));

  /* SEM TOKEN, NÃO SE CONFERIU. É o ramo mais perigoso dos três: um `conferido: true` com
   * `chaves: []` sairia no log como «nasce limpa» — sobre um namespace que ninguém olhou. */
  const semToken = await kv.chavesDaEscola({ slug: 'batata', token: null, accountId: CONTA, raiz: RAIZ });
  checar('sem token, NÃO se conferiu — e diz porquê', semToken.conferido === false
    && /CLOUDFLARE_API_TOKEN/.test(semToken.erro), semToken);
  checar('…e o recado é de AVISO, não de «limpo»', kv.recado(semToken, 'batata').nivel === 'aviso',
    kv.recado(semToken, 'batata'));

  /* A LISTAGEM RECUSADA — a cota esgotada, o token sem permissão. É exactamente o que aconteceu
   * a 19/10/2026 e deixou uma escola com dado no KV sem ninguém saber. */
  const recusado = servicoFalso({ falhar: { status: 429, mensagem: 'rate limited' } });
  globalThis.fetch = recusado.f;
  let semListagem;
  try {
    semListagem = await kv.chavesDaEscola({ slug: 'batata', token: TOKEN, accountId: CONTA, raiz: RAIZ });
  } finally {
    globalThis.fetch = guardado;
  }
  checar('listagem recusada não é «limpo» — é «não consegui»',
    semListagem.conferido === false && /rate limited/.test(semListagem.erro), semListagem);
  checar('…e o recado também não promete limpeza',
    kv.recado(semListagem, 'batata').nivel === 'aviso', kv.recado(semListagem, 'batata'));

  // ==========================================================================================
  console.log('\nD. O RECADO — o que se lê no log do workflow');

  const semNada = await (async () => {
    const vazio = servicoFalso({ porPrefixo: {} });
    globalThis.fetch = vazio.f;
    try {
      return await kv.chavesDaEscola({ slug: 'batata', token: TOKEN, accountId: CONTA, raiz: RAIZ });
    } finally {
      globalThis.fetch = guardado;
    }
  })();
  const recadoLimpo = kv.recado(semNada, 'batata');
  checar('o namespace vazio diz «conferido por listagem» — e não só «sem chaves»',
    recadoLimpo.nivel === 'limpo' && /conferido por listagem/.test(recadoLimpo.linhas.join(' ')),
    recadoLimpo.linhas);

  const recadoResiduo = kv.recado(comResiduo, 'batata');
  /* AS CHAVES APARECEM UMA A UMA, e a linha é o NOME delas — nada mais. Contar «linhas
   * indentadas» contaria também a linha do comando do expurgo; o que se procura é o nome. */
  const nomeadas = comResiduo.chaves.filter((c) => recadoResiduo.linhas.indexOf('  ' + c) !== -1);
  checar('com resíduo, o recado é de aviso e nomeia cada chave',
    recadoResiduo.nivel === 'residuo' && nomeadas.length === comResiduo.chaves.length,
    { nomeadas, linhas: recadoResiduo.linhas });
  checar('…e diz que NADA foi apagado', /Nada foi apagado/.test(recadoResiduo.linhas.join(' ')),
    recadoResiduo.linhas);
  /* O VALOR NÃO SE IMPRIME. Uma chave dos Bastidores pode ter apelido de aluna, e o log de um
   * workflow lê-se com o repositório à frente. */
  checar('…e não imprime valor nenhum, só o nome da chave',
    recadoResiduo.linhas.every((l) => l.indexOf('{') === -1 && l.indexOf('[') === -1),
    recadoResiduo.linhas);
  checar('…e manda ao gesto irmão, que é quem limpa',
    /escola\/expurgar\.js/.test(recadoResiduo.linhas.join(' ')), recadoResiduo.linhas);

  // ==========================================================================================
  console.log('\nE. O WORKFLOW — a conferência corre na criação, e não trava a criação');

  const fs2 = require('fs');
  const fluxo = fs2.readFileSync(path.join(RAIZ, '.github/workflows/criar-escola.yml'), 'utf8');
  checar('o passo «Conferir o KV» existe', /name: Conferir o KV da escola/.test(fluxo), null);
  checar('…corre o verificador com o slug da escola',
    /conferir-kv\.js --escola "\$\{\{ inputs\.escola \}\}"/.test(fluxo), null);
  /* `continue-on-error` é o que faz disto um AVISO. Sem ele, um token com falta de permissão
   * abortava a criação da escola — e a conferência passaria a ser um obstáculo. */
  checar('…e não trava a criação (`continue-on-error`)',
    /- name: Conferir o KV da escola\n\s+shell: bash\n\s+continue-on-error: true/.test(fluxo), null);
  /* A ORDEM IMPORTA: o aviso tem de aparecer ANTES de o motor subir, senão a escola já está no
   * ar quando alguém lê o log. */
  const posConferir = fluxo.indexOf('name: Conferir o KV da escola');
  const posDeploy = fluxo.indexOf('name: Subir o motor completo no Cloudflare');
  checar('…e corre ANTES do deploy do motor', posConferir !== -1 && posDeploy !== -1
    && posConferir < posDeploy, { posConferir, posDeploy });

  console.log('\n' + (falhas === 0 ? 'PASSOU' : 'FALHOU') + ' — ' + (total - falhas) + ' de ' + total + ' asserções');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('erro na prova:', e.message);
  console.error(e.stack);
  process.exit(1);
});
