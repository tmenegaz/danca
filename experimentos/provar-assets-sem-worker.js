#!/usr/bin/env node
'use strict';

/*
 * provar-assets-sem-worker.js — o CSS, o JS e o favicon não gastam pedido do dia.
 *
 * O QUE FOI MEDIDO (13/11/2026). Os dois Workers desta conta declaravam
 * `"run_worker_first": true` — e o `true` é literal: TODA requisição invocava o Worker, incluindo
 * o `style.css`, o `nav.js` e o favicon, que o Worker só devolvia ao ASSETS no fim. As páginas
 * publicadas referenciam 3 sub-recursos cada, e portanto cada página vista custava **4 invocações
 * em vez de 1**. O plano gratuito dá 100.000 requisições por dia para a CONTA inteira; os pedidos
 * a assets estáticos são «grátis e ilimitados» quando é o ASSETS que os serve.
 *
 * Medido com `wrangler dev` e uma linha de log no início do `fetch` da ponte, para contar
 * INVOCAÇÕES e não apenas respostas (as seis requisições devolvem 200 nos dois casos):
 *
 *   configuração              /assets/style.css  /piano/assets/nav.js  /plano-observacao/assets/markdown.js
 *   "run_worker_first": true        1 invocação        1 invocação        1 invocação
 *   a lista de hoje                 0                  0                  0
 *
 *   e o HTML (`/`, `/aulas/`) continua a invocar o Worker nos dois casos — é ele que injeta
 *   `data-modo`/`data-paleta` e o freio da escola. Medido: `/` e `/aulas/` saem com
 *   `data-modo="clara" data-paleta="bordo"`; `/api/saude` e `/scripts/geracao.js` também invocam.
 *
 * O QUE ESTA PROVA FIXA (sem rede, sem navegador, sem `wrangler dev`):
 *
 *   1. nenhum `wrangler*.jsonc` volta a declarar `run_worker_first: true`, e o template de
 *      `tools/criar-escola.sh` — que é de onde sai a config de cada escola nova — também não;
 *   2. o MODELO do roteamento que a Cloudflare documenta (negativas têm precedência; `*` casa em
 *      profundidade) classifica cada caminho real como deve: HTML e `/api/` no Worker, assets no
 *      ASSETS;
 *   3. os dois scripts que o MOTOR gera não moram debaixo de `/assets/` — com `!/assets/*` eles
 *      seriam 404, e nenhuma página os poderia carregar;
 *   4. CONTROLO NEGATIVO: com `true`, o mesmo modelo manda TUDO para o Worker. Se a prova
 *      passasse também nesse caso, não estaria a medir nada.
 *
 *   node experimentos/provar-assets-sem-worker.js
 */

const os = require('node:os');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
let ok = 0;
let ko = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
  else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
};

/** Lê um `.jsonc` (JSON com comentários de linha) como objeto. */
function lerJsonc(arquivo) {
  const texto = fs.readFileSync(arquivo, 'utf8')
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');
  return JSON.parse(texto);
}

/* ── O MODELO DO ROTEAMENTO ────────────────────────────────────────────────────────────────
 *
 * A regra, citada da documentação da Cloudflare: «Negative patterns have precedence over
 * non-negative patterns. The Worker will run first when a non-negative pattern matches and none
 * of the negative pattern matches.» E `*` casa em profundidade — `/*` casa `/` e `/a/b/c`
 * (o `wrangler` recusa `"/"` ao lado de `"/*"` dizendo que é redundante, e é ele que o garante).
 */
function casa(padrao, caminho) {
  const corpo = padrao.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + corpo + '$').test(caminho);
}

/** Devolve `'worker'` ou `'asset'` para um caminho, segundo a configuração declarada. */
function quemServe(regra, caminho) {
  if (regra === true) return 'worker';
  const negativos = regra.filter((p) => p.startsWith('!')).map((p) => p.slice(1));
  if (negativos.some((p) => casa(p, caminho))) return 'asset';
  if (regra.some((p) => !p.startsWith('!') && casa(p, caminho))) return 'worker';
  return 'asset';
}

/* ── 1. A CONFIGURAÇÃO ──────────────────────────────────────────────────────────────────── */
console.log('\n1 · a configuração não volta a mandar tudo para o Worker');
{
  const arquivos = fs.readdirSync(RAIZ).filter((n) => /^wrangler\..*\.jsonc$/.test(n)).sort();
  provar('há configurações de Worker para conferir (' + arquivos.length + ')', arquivos.length >= 2, arquivos);
  for (const nome of arquivos) {
    const cfg = lerJsonc(path.join(RAIZ, nome));
    const regra = cfg.assets && cfg.assets.run_worker_first;
    /* UMA CONFIG É DE ESCOLA QUANDO OS ASSETS DELA ESTÃO EM `publicacao/` (13/11/2026) — e não
     * quando declara `ESCOLA_SLUG`: a `vars` deixou de ser o que diz a escola (passou a ser o mapa
     * em KV, ver `mapa-de-escolas.js`), e uma prova que dependesse dela passaria a depender da
     * configuração de um dia. A pasta dos assets é o que o Worker SERVE, e é isso que a regra
     * negativa dos assets de cada pacote tem de cobrir. */
    const dir = String((cfg.assets && cfg.assets.directory) || '').replace(/\\/g, '/');
    const escola = dir.startsWith('publicacao/');
    provar(nome + ': `run_worker_first` é uma lista, e não `true`', Array.isArray(regra), regra);
    provar(nome + ': a lista manda `/assets/*` para o ASSETS',
      Array.isArray(regra) && regra.includes('!/assets/*'), regra);
    if (escola) {
      provar(nome + ': a lista manda os assets de cada pacote (`*​/assets/*`) para o ASSETS',
        Array.isArray(regra) && regra.includes('!/*/assets/*'), regra);
      provar(nome + ': tem uma regra positiva que mantém o HTML no Worker',
        Array.isArray(regra) && regra.some((p) => !p.startsWith('!') && casa(p, '/aulas/')), regra);
    }
  }
  /* O TEMPLATE é a config de toda escola NOVA: corrigir os dois `.jsonc` e deixar o gerador
   * intacto seria corrigir hoje e estragar amanhã, em silêncio. */
  const gerador = fs.readFileSync(path.join(RAIZ, 'tools/criar-escola.sh'), 'utf8');
  provar('o template de `criar-escola.sh` declara a mesma lista',
    /"run_worker_first":\s*\[/.test(gerador) && gerador.includes('"!/assets/*"'));
  provar('o template de `criar-escola.sh` não voltou a `"run_worker_first": true`',
    !/"run_worker_first":\s*true/.test(gerador));
}

/* ── 2. O MODELO, APLICADO AOS CAMINHOS REAIS ───────────────────────────────────────────── */
console.log('\n2 · o roteamento classifica cada caminho como deve');
{
  /* A CONFIGURAÇÃO DE UMA ESCOLA NÃO ESTÁ NO REPOSITÓRIO — é o `criar-escola.sh` que a escreve
   * (`wrangler.<escola>.jsonc`), e ela nasce no acto que cria a escola. A prova lia a da `calango`,
   * que o expurgo levou, e rebentava no `readFileSync`.
   *
   * A configuração que se lê passa a ser a do TEMPLATE, e lê-se com o MESMO `lerJsonc` desta prova
   * — depois de o heredoc passar por um ficheiro temporário com `$ESCOLA` trocado. As outras duas
   * saídas foram descartadas: não há nenhuma escola versionada (os dois `wrangler.*.jsonc` do
   * repositório são a raiz e o teste), e escrever a configuração à mão aqui mediria a invenção.
   *
   * O que se mede continua a ser o mesmo: os CAMINHOS reais contra a REGRA. E a regra é a do
   * template — a que toda a escola nova recebe. */
  const geradorDoTemplate = fs.readFileSync(path.join(RAIZ, 'tools/criar-escola.sh'), 'utf8');
  const blocoDoTemplate = /cat > "\$WRANGLER" <<[A-Z]+\n([\s\S]*?)\n[A-Z]+\n/.exec(geradorDoTemplate);
  if (!blocoDoTemplate) {
    console.error('provar-assets-sem-worker: não encontrei o heredoc do `wrangler` em criar-escola.sh — NÃO FEITO.');
    process.exit(1);
  }
  const tmp = path.join(os.tmpdir(), 'wrangler-da-prova.jsonc');
  /* AS VARIÁVEIS DO HEREDOC SÃO TROCADAS POR VALORES DE PROVA. Só o `$ESCOLA` não bastava: o
   * `$schema` (`node_modules/wrangler/…`) e o `$WORKER` são variáveis que o `criar-escola.sh`
   * expande ao escrever o ficheiro, e no heredoc cru ficam com o `$` à frente — que não é JSON. O
   * `$schema` é o caso traiçoeiro: parece uma palavra, e é uma variável. */
  fs.writeFileSync(tmp, blocoDoTemplate[1]
    .replace(/\\(?=\$)/g, '')                                            // o `\$` do heredoc
    .replace(/\$\{ESCOLA(_NOME)?\}/g, 'piano')
    .replace(/\$ESCOLA(_NOME)?/g, 'piano')
    .replace(/\$WORKER/g, 'piano')
    .replace(/\$PROFESSOR/g, 'demi-plie')
    .replace(/\$CICLO/g, '01')
    .replace(/\$schema/g, 'schema'), 'utf8');
  const cfg = lerJsonc(tmp);
  fs.unlinkSync(tmp);
  const regra = cfg.assets.run_worker_first;
  const escola = cfg.assets.directory;

  const devemIrParaOAsset = [
    '/assets/style.css', '/assets/nav.js', '/assets/favicon.svg',
    '/piano/assets/nav.js', '/piano/assets/lib-vistas.js',
    '/plano-observacao/assets/markdown.js',
    '/piano/aula-01.pdf',
  ];
  for (const c of devemIrParaOAsset) {
    provar('ASSETS: ' + c, quemServe(regra, c) === 'asset', quemServe(regra, c));
  }

  /* O HTML TEM DE FICAR NO WORKER: é ele que injeta `data-modo`/`data-paleta` e o freio da
   * escola. Um HTML servido pelo ASSETS sairia sem os dois — a escola mudava de pele sem aviso. */
  const devemIrParaOWorker = [
    '/', '/aulas/', '/ciclos/planos/', '/piano/aula-01.html', '/sistema.html',
    '/api/saude', '/api/bastidores/alunas', '/api/receber',
    '/area-do-professor/anamnese', '/area-do-professor/plano-de-observacao',
    '/plano-observacao/', '/anamnese/', '/bastidores/estudio',
    '/scripts/geracao.js', '/scripts/teste-preenchimento.js',
  ];
  for (const c of devemIrParaOWorker) {
    provar('WORKER: ' + c, quemServe(regra, c) === 'worker', quemServe(regra, c));
  }

  /* TODO `.css`/`.js`/`.svg`/`.pdf` PUBLICADO TEM DE ESTAR COBERTO POR UMA NEGATIVA. Se um
   * ficar de fora, não quebra — passa a gastar invocação sem ninguém notar, que é o defeito que
   * esta mudança existe para corrigir. */
  /* A PASTA VARRIDA PASSOU A SER A QUE EXISTE (20/11/2026). Era `publicacao/<escola do wrangler>`
   * — a `calango`, cujo `.jsonc` e cuja pasta o expurgo levou. A `breu` está publicada e é uma
   * árvore real, com `assets/`, `ciclos/` e `aulas/`: é por ela que se mede o que se quer medir —
   * que TODO ficheiro publicado com extensão de asset caia numa negativa da regra. */
  const raizPublicada = fs.existsSync(path.join(RAIZ, 'publicacao', 'breu'))
    ? path.join(RAIZ, 'publicacao', 'breu') : null;
  if (!raizPublicada) {
    console.error('provar-assets-sem-worker: não há publicação no disco — NÃO FEITO.');
    process.exit(1);
  }
  const publicados = [];
  (function varrer(dir, base) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = base + '/' + e.name;
      if (e.isDirectory()) varrer(path.join(dir, e.name), rel);
      else if (/\.(css|js|svg|pdf)$/i.test(e.name)) publicados.push(rel);
    }
  }(raizPublicada, ''));
  const escaparam = publicados.filter((c) => quemServe(regra, c) !== 'asset');
  provar('os ' + publicados.length + ' assets publicados são servidos pelo ASSETS', escaparam.length === 0,
    escaparam.slice(0, 5));
}

/* ── 3. OS SCRIPTS QUE O MOTOR GERA ─────────────────────────────────────────────────────── */
console.log('\n3 · os scripts gerados pelo motor vivem fora de `/assets/`');
{
  const ponte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/producao.js'), 'utf8');
  provar('a ponte serve `/scripts/geracao.js`', ponte.includes("path === '/scripts/geracao.js'"));
  provar('a ponte serve `/scripts/teste-preenchimento.js`',
    ponte.includes("path === '/scripts/teste-preenchimento.js'"));
  /* A ARMADILHA. Um script gerado debaixo de `/assets/` devolve 404 desde que a negativa existe:
   * ele não está no disco, e o ASSETS responde pelo que tem. A asserção é sobre o CÓDIGO e não
   * sobre o comportamento porque é aqui que o erro nasce. */
  const geradosEmAssets = /path === '\/assets\/(geracao|teste-preenchimento)\.js'/.test(ponte);
  provar('nenhum script gerado ficou debaixo de `/assets/`', !geradosEmAssets);
  provar('a injeção na página aponta para `/scripts/`',
    ponte.includes('/scripts/geracao.js') && ponte.includes('/scripts/teste-preenchimento.js'));
  /* OS BASTIDORES JÁ NÃO INJETAM NADA (19/11/2026) — «pode remover de lá, não vamos mais usar».
   * A asserção mudou de sinal de propósito: antes media que ele injetava; agora mede que não. O
   * script continua a ser servido (a porta usa-o), e é isso que as duas linhas de cima guardam. */
  const bastidores = fs.readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8');
  /* «NÃO INJETAM» MEDE-SE NA TAG, E NÃO NO TEXTO (20/11/2026).
   *
   * A asserção era `!bastidores.includes('/scripts/teste-preenchimento.js')`, e passou a reprovar a
   * página certa: o caminho CONTINUA a aparecer no ficheiro — dentro do comentário que explica que
   * ele é servido e injetado nas páginas da PORTA, e que a versão dos Bastidores deixou de existir.
   * Um `includes` sobre o fonte inteiro não distingue código de comentário, e por isso media a
   * documentação.
   *
   * O que a regra diz é que os Bastidores não o INJETAM: isso é uma tag `<script src>`. É ela que
   * se procura. */
  provar('os Bastidores já não injetam `/scripts/teste-preenchimento.js` numa tag `<script>`',
    !/<script[^>]+src=["'][^"']*teste-preenchimento/.test(bastidores));
}

/* ── 4. CONTROLO NEGATIVO ───────────────────────────────────────────────────────────────── */
console.log('\n4 · controlo negativo: com `true`, tudo invoca o Worker');
{
  const caminhos = ['/assets/style.css', '/piano/assets/nav.js', '/', '/aulas/', '/api/saude'];
  const todos = caminhos.every((c) => quemServe(true, c) === 'worker');
  provar('o modelo distingue as duas configurações (senão não media nada)', todos,
    caminhos.map((c) => [c, quemServe(true, c)]));
}

console.log('\n' + (ko ? 'FALHOU' : 'TUDO CERTO') + ' — ' + ok + ' asserção(ões)' +
  (ko ? ', ' + ko + ' falha(s)' : '') + '.');
process.exit(ko ? 1 : 0);
