#!/usr/bin/env node
'use strict';

/*
 * conferir-expurgo.js — O QUE AINDA EXISTE DE UMA ESCOLA, depois de ela ser expurgada.
 *
 * PORQUE EXISTE (22/11/2026). A pergunta dela, antes de expurgar o `breu` e recomeçar os testes:
 * «Eu preciso saber também se o expurgo está correto, já está validado, já atende sumir com todas
 * as escolas, com tudo, enfim, tem que sumir com tudo. […] Preciso saber se o que a gente tinha de
 * escolas antigas que estavam atrapalhando os testes de mesa não vão nascer de novo. Então o
 * expurgo está feito?»
 *
 * Não havia como responder sem ler JSON à mão. O expurgo SABE dizer o que apagou (o relatório da
 * página, e o elo em `escola/<slug>/indice.json`), mas ninguém sabe dizer, do lado do
 * repositório, o que SOBROU — nem separar o que sobrou por acidente do que sobra por decisão.
 *
 * O QUE ELE FAZ, e não faz. Só LÊ: nada é apagado, nada é escrito, nada vai à rede. Ele usa as
 * MESMAS funções que o expurgo usa para decidir o que é de uma escola (`escolaDosCaminhos`, em
 * `motor/servidor/repo-escola.js`) — uma segunda lista de regras divergiria da primeira ao
 * primeiro caso, e a que ficasse para trás seria a que confere.
 *
 * A METADE QUE ELE NÃO ALCANÇA É DITA COM TODAS AS LETRAS: o Worker, o subdomínio, a rota e as
 * chaves do KV vivem no Cloudflare, e só quem tem o token os lê. O relatório da página é a
 * autoridade lá; aqui a conferência é a do REPOSITÓRIO, que é a metade que impede a criação com o
 * mesmo nome de colidir.
 *
 *   node escola/conferir-expurgo.js <slug>
 */

const fs = require('fs');
const path = require('path');

/* A RAIZ É A DO REPOSITÓRIO, e pode apontar-se a outra (`--raiz=<dir>`). Não é conveniência: é o
 * que torna esta conferência PROVÁVEL. Uma prova que medisse o repositório de verdade mediria o dia
 * em que foi escrita — e no dia em que ela expurgasse o `breu` a asserção «breu está viva» caía,
 * sem nada se ter partido. Com a raiz apontável, a prova monta duas árvores sintéticas (uma viva,
 * uma expurgada) e mede a CLASSIFICAÇÃO, que é a lógica que interessa. */
const RAIZ_DO_REPO = path.resolve(__dirname, '..');
const argumentoDe = (nome) => {
  const achado = process.argv.slice(2).find((a) => a.indexOf('--' + nome + '=') === 0);
  return achado ? achado.split('=').slice(1).join('=') : '';
};
const RAIZ = path.resolve(argumentoDe('raiz') || RAIZ_DO_REPO);
const repo = require(path.join(RAIZ_DO_REPO, 'motor/servidor/repo-escola.js'));

const slug = String(process.argv.slice(2).find((a) => a.indexOf('--') !== 0) || '').trim();
if (!slug) {
  console.error('uso: node escola/conferir-expurgo.js <slug> [--raiz=<dir>]');
  process.exit(2);
}

/* A ÁRVORE, lida do disco com a FORMA do repositório — caminhos relativos, sem `./`. As mesmas
 * pastas que o `git ls-files` daria, e as únicas que o expurgo vê: `node_modules`, `.git`,
 * `publicacao/` (montada, não versionada) e `experimentos/` (demonstrativo, fora do pacote e dos
 * hashes) ficam de fora — o expurgo também não as toca. */
function caminhosDoDisco() {
  const saida = [];
  const andar = (relativo) => {
    const absoluto = relativo ? path.join(RAIZ, relativo) : RAIZ;
    let entradas;
    try { entradas = fs.readdirSync(absoluto, { withFileTypes: true }); } catch { return; }
    for (const e of entradas) {
      if (!relativo && ['.git', 'node_modules', 'publicacao', 'experimentos'].indexOf(e.name) !== -1) continue;
      if (relativo && e.name === 'node_modules') continue;
      const rel = relativo ? relativo + '/' + e.name : e.name;
      if (e.isDirectory()) andar(rel); else saida.push(rel);
    }
  };
  andar('');
  return saida;
}

/* O ELO — e ele é memória, não dado da escola. `expurgo[]` e `recriacao[]` são as duas listas que
 * dizem o que aconteceu a este nome: a última expurgação e a última recriação, e qual veio depois.
 * `recriacao` posterior a `expurgo` quer dizer ESCOLA VIVA com o mesmo nome — e é o que faz o
 * `escola/expurgar.js` recusar limpar o que uma recriação acabou de criar. */
function lerElo(arquivo) {
  if (!fs.existsSync(arquivo)) return null;
  try { return JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch { return null; }
}

const quando = (lista) => (Array.isArray(lista) ? lista : [])
  .map((e) => Date.parse((e && e.em) || ''))
  .filter((t) => Number.isFinite(t))
  .sort((a, b) => b - a)[0];

const dataDe = (t) => (t === undefined ? null : new Date(t).toISOString().slice(0, 16).replace('T', ' '));

const caminhos = caminhosDoDisco();
const daEscola = repo.escolaDosCaminhos(slug, caminhos);
const elo = lerElo(path.join(RAIZ, 'escola', slug, 'indice.json'));
const ultimoExpurgo = quando(elo && elo.expurgo);
const ultimaRecriacao = quando(elo && elo.recriacao);

console.log('\nCONFERIR O EXPURGO — «' + slug + '»');
console.log('Só leitura: nada é apagado, nada é escrito, nada vai à rede.\n');

/* ------------------------------------------------------------------------------------------ */
console.log('1. O ELO (a memória do nome — e ele NÃO se apaga)');
/* ------------------------------------------------------------------------------------------ */
if (!elo) {
  console.log('   não há escola/' + slug + '/indice.json — este nome nunca foi criado, ou o elo foi');
  console.log('   apagado à mão (o que o expurgo não faz).');
} else {
  console.log('   escola/' + slug + '/indice.json · ' + (elo.expurgo || []).length + ' expurgação(ões) · '
    + (elo.recriacao || []).length + ' recriação(ões)');
  console.log('   último expurgo:    ' + (dataDe(ultimoExpurgo) || '(nenhum)'));
  console.log('   última recriação:  ' + (dataDe(ultimaRecriacao) || '(nenhuma)'));
  const viva = ultimoExpurgo !== undefined && (ultimaRecriacao === undefined || ultimaRecriacao < ultimoExpurgo);
  console.log('   → o elo diz: ' + (viva
    ? 'EXPURGADA (o último acto é o expurgo)'
    : 'VIVA ou recriada depois do último expurgo'));
}

/* ------------------------------------------------------------------------------------------ */
console.log('\n2. O REPOSITÓRIO — o que o expurgo ainda apagaria');
/* ------------------------------------------------------------------------------------------ */
console.log('   arquivos desta escola na árvore: ' + daEscola.total
  + (daEscola.professor ? '  (professor ' + daEscola.professor + ', ciclo ' + daEscola.ciclo + ')' : ''));
if (daEscola.total) {
  const porFamilia = {};
  for (const c of daEscola.arquivos) {
    const familia = /^wrangler\./.test(c) ? 'wrangler (o Worker)'
      : c.indexOf('escola/' + slug + '/envelopes/') === 0 ? 'escola/<slug>/envelopes (o acervo)'
        : c.indexOf('escola/' + slug + '/linhas-de-base/') === 0 ? 'escola/<slug>/linhas-de-base (os elencos)'
          : /^professores\//.test(c) ? 'professores/*/ciclos (o pacote e as fontes)'
            : 'outro';
    porFamilia[familia] = (porFamilia[familia] || 0) + 1;
  }
  for (const [familia, n] of Object.entries(porFamilia).sort()) {
    console.log('      ' + String(n).padStart(4) + '  ' + familia);
  }
}

/* ------------------------------------------------------------------------------------------ */
console.log('\n3. O QUE SOBRA DE PROPÓSITO — e porquê');
/* ------------------------------------------------------------------------------------------ */
/* A lista é DERIVADA do que existe, e não escrita à mão: para cada caminho que ainda cita o slug
 * e que o expurgo NÃO apagaria, a razão é uma das três abaixo — e o que não couber em nenhuma é
 * resíduo de verdade, que se diz como tal. */
const restos = caminhos.filter((c) => c.indexOf(slug) !== -1 && daEscola.arquivos.indexOf(c) === -1);
const PADROES = [
  { nome: 'o elo do expurgo', porque: 'a proveniência acrescenta: o que existiu fica dito',
    testa: (c) => c === 'escola/' + slug + '/indice.json' },
  { nome: 'a fixture de teste', porque: 'os dados sintéticos entram pela PALAVRA do nome da escola — '
    + 'não são dado de nenhuma escola, são o que preenche os formulários da próxima',
    testa: (c) => c === 'teste/' + slug + '.json' },
  { nome: 'a demonstração em experimentos/', porque: 'não entra em pacote, hash nem publicação',
    testa: (c) => c.indexOf('experimentos/') === 0 },
  { nome: 'o índice derivado', porque: 'é saída: o `gerar-indices.js` o refaz, e apaga o que já não '
    + 'produz (`orfaosNoDisco`) quando o expurgo corre pela página — o workflow dos derivados '
    + 'corre no mesmo push',
    testa: (c) => c.indexOf('indices/') === 0 },
];
const porNome = new Map();
const residuos = [];
for (const c of restos) {
  const padrao = PADROES.find((p) => p.testa(c));
  if (!padrao) { residuos.push(c); continue; }
  if (!porNome.has(padrao.nome)) porNome.set(padrao.nome, { porque: padrao.porque, lista: [] });
  porNome.get(padrao.nome).lista.push(c);
}
if (!porNome.size) console.log('   nada.');
for (const [nome, { porque, lista }] of porNome) {
  console.log('   ' + nome + ' — ' + lista.length + ' arquivo(s)');
  console.log('      porque fica: ' + porque);
  for (const c of lista.slice(0, 4)) console.log('      · ' + c);
  if (lista.length > 4) console.log('      · … e ' + (lista.length - 4) + ' outro(s)');
}
if (residuos.length) {
  console.log('\n   RESÍDUO — ' + residuos.length + ' caminho(s) que citam «' + slug + '» e que o expurgo');
  console.log('   NÃO apaga, e que não têm razão declarada para ficar:');
  for (const c of residuos) console.log('      ✗ ' + c);
} else {
  console.log('\n   nenhum resíduo sem razão declarada.');
}

/* ------------------------------------------------------------------------------------------ */
console.log('\n4. A CRIAÇÃO COM O MESMO NOME');
/* ------------------------------------------------------------------------------------------ */
/* A pergunta que ela fez: «vou criar outra escola com o mesmo nome […] não vão nascer de novo?».
 *
 * A REGRA É LIDA DO `criar-escola.sh`, e não reinventada: ele recusa quando existe a VARIANTE
 * (`ciclo-<ciclo>-<escola>.conf`), o PACOTE da escola (`ciclo-<ciclo>-<escola>/`) ou o WRANGLER
 * (`wrangler.<worker>.jsonc`). A base do ciclo (`ciclo-<ciclo>.conf`) e os schemas REAPROVEITAM-SE
 * — são o molde partilhado, e recusar por eles impediria a segunda escola do mesmo professor.
 *
 * UMA SEGUNDA LISTA, À PARTE: os pacotes das TURMAS (`ciclo-<ciclo>-<escola>-<turma>`). Não são
 * colisão da escola — são colisão do par escola+turma —, e por isso não abortam a criação da
 * escola: abortam a criação daquela turma. Nomeá-los aqui é o que evita a surpresa de a criação
 * passar e a geração da turma falhar a seguir. */
const colisoesDaEscola = [];
const colisoesDaTurma = [];
const ciclosDe = (p) => {
  const dir = path.join(RAIZ, 'professores', p, 'ciclos');
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
};
let professoresDoRepo = [];
try {
  professoresDoRepo = fs.readdirSync(path.join(RAIZ, 'professores'), { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name);
} catch { professoresDoRepo = []; }
if (fs.existsSync(path.join(RAIZ, 'wrangler.' + slug + '.jsonc'))) {
  colisoesDaEscola.push('wrangler.' + slug + '.jsonc');
}
for (const p of professoresDoRepo) {
  for (const n of ciclosDe(p)) {
    const varianteDaEscola = new RegExp('^ciclo-[0-9]{2}-' + slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\.conf)?$');
    if (varianteDaEscola.test(n)) { colisoesDaEscola.push('professores/' + p + '/ciclos/' + n); continue; }
    if (new RegExp('^ciclo-[0-9]{2}-' + slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-').test(n)) {
      colisoesDaTurma.push('professores/' + p + '/ciclos/' + n);
    }
  }
}
if (!colisoesDaEscola.length) {
  console.log('   livre: não há config, variante nem pacote com o nome da ESCOLA — o `criar-escola.sh`');
  console.log('   não vai recusar por colisão.');
} else {
  console.log('   o `criar-escola.sh` RECUSA criar «' + slug + '» enquanto estes existirem:');
  for (const b of colisoesDaEscola.slice(0, 8)) console.log('      · ' + b);
  if (colisoesDaEscola.length > 8) console.log('      · … e ' + (colisoesDaEscola.length - 8) + ' outro(s)');
  console.log('   → é uma recusa ALTA: a criação falha e diz porquê, não nasce uma escola a meio.');
}
if (colisoesDaTurma.length) {
  /* A TURMA SAI DA PASTA DO PACOTE, e de mais nada: `ciclo-<ciclo>-<escola>/` é a variante zero
   * (sem turma), e `ciclo-<ciclo>-<escola>-<turma>/` é a pasta de uma turma — o nome dela é o
   * resto, inteiro. Deduzi-la dos FICHEIROS dava `rosa-captura`, `rosa-po`, `rosa-plano`: o
   * sufixo do tipo de documento entraria no nome da turma, e a lista saía a mentir com nove
   * nomes onde há um. */
  const turmas = new Set();
  for (const c of colisoesDaTurma) {
    const m = new RegExp('^professores/[^/]+/ciclos/ciclo-[0-9]{2}-' + slug + '-(.+)$').exec(c);
    if (!m) continue;
    const resto = m[1];
    if (/\./.test(resto)) continue;              // um ficheiro, não a pasta da turma
    turmas.add(resto);
  }
  console.log('   e há pacote(s) de TURMA com este nome — '
    + ([...turmas].sort().join(', ') || '(nenhum: só há ficheiros soltos, que a geração reescreve)')
    + '.');
  console.log('   Criar a escola passa; criar a MESMA turma é que recusa (o pacote dela é');
  console.log('   `ciclo-<ciclo>-' + slug + '-<turma>`). Escolha outro nome de turma, ou expurgue também');
  console.log('   estes — o expurgo da escola os leva consigo, e é isso que o ponto 2 mede.');
}

/* ------------------------------------------------------------------------------------------ */
console.log('\n5. O QUE ESTA CONFERÊNCIA NÃO ALCANÇA — e quem alcança');
/* ------------------------------------------------------------------------------------------ */
console.log('   · O Worker, o subdomínio, a rota e as CHAVES DO KV vivem no Cloudflare. Só quem tem');
console.log('     o token os lê — por isso a autoridade lá é o relatório da página, que confere por');
console.log('     LEITURA de cada chave (`kv.restantes` / `kv.ficaram`), e não pela listagem.');
console.log('   · Se a limpeza do KV não se completou, a página diz «este expurgo NÃO está completo»');
console.log('     e oferece «Terminar a limpeza do KV» — a pendência fica gravada no elo.');
console.log('   · É o KV que uma escola nova com o mesmo nome HERDA: o prefixo é o nome. Se o');
console.log('     relatório da página disse que sobrou chave, resolva a pendência ANTES de criar;');
console.log('     nada no repositório impede a criação por causa disso.');
console.log('');
