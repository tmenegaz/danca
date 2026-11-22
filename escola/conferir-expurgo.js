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
 * O QUE ELE FAZ, e não faz. Só LÊ: nada é apagado, nada é escrito — e uma única coisa vai à rede,
 * a listagem do KV, e só quando há token no ambiente (secção 5). Ele usa as
 * MESMAS funções que o expurgo usa para decidir o que é de uma escola (`escolaDosCaminhos`, em
 * `motor/servidor/repo-escola.js`) — uma segunda lista de regras divergiria da primeira ao
 * primeiro caso, e a que ficasse para trás seria a que confere.
 *
 * AS DUAS METADES, E O QUE CADA UMA RESPONDE (22/11/2026). O repositório lê-se daqui. O KV, o
 * Worker, o subdomínio e a rota vivem no Cloudflare e só se leem com token — e a chave que ela deu
 * para os medir não autentica (`HTTP 401`, `Authentication error`), por isso a ausência de token
 * tem de ser DITA e não confundida com «está limpo». Com `CLOUDFLARE_API_TOKEN` e
 * `CLOUDFLARE_ACCOUNT_ID` no ambiente, este comando consulta o KV pelo MESMO leitor que o
 * `escola/conferir-kv.js` usa (`chavesDaEscola`) e responde a pergunta que importa antes de criar a
 * escola de novo: **o nome novo herda chaves do nome velho?**
 *
 *   node escola/conferir-expurgo.js <slug> [--raiz=<dir>] [--kv-de=<arquivo>]
 *
 * `--kv-de=<arquivo>` lê uma leitura do KV já gravada em JSON (a forma que `chavesDaEscola`
 * devolve). Existe pela mesma razão que o `--raiz`: torna PROVÁVEL a secção do KV sem rede e sem
 * token. Nada mais o usa.
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
console.log('Só leitura: nada é apagado, nada é escrito. À rede, só a listagem do KV — e só com token.\n');

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
 * UMA SEGUNDA LISTA, À PARTE: os pacotes das TURMAS (`ciclo-<ciclo>-<escola>-<turma>`). NÃO SÃO
 * COLISÃO — e a primeira redação disto estava ERRADA (corrigida a 22/11/2026, no mesmo dia).
 *
 * Ela leu «escolha outro nome de turma» e respondeu o que tinha de responder: «não pode ser assim.
 * não tem-se controle sobre as turmas que uma escola quer adotar.» Tem razão, e a afirmação era
 * minha, não do código. Medido: o `criar-escola.sh` recusa pela VARIANTE, pelo PACOTE da escola e
 * pelo WRANGLER — um `ciclo-<ciclo>-<escola>-<turma>/` não está em nenhuma das três; o `gerar-ciclo`
 * escreve por cima (`mkdir -p`, e nunca pergunta se a pasta existe); e a ÚNICA recusa por nome de
 * turma é a de duas salas VIVAS com o mesmo nome dentro da MESMA escola (`turmaVigentePorNome`,
 * `POST /turma`) — que não é uma restrição ao nome, é «esta sala já existe, abra-a em Editar».
 *
 * O que estes caminhos são, então: **artefactos da escola**. Carregam o slug no caminho, o
 * `escolaDosCaminhos` apanha-os (é o que a secção 2 conta), e o expurgo leva-os consigo. Se algum
 * sobreviver a um expurgo incompleto, a geração seguinte escreve por cima — o nome da turma
 * continua a ser escolha de quem a cria. */
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
  /* NÃO É UMA RECUSA, E NÃO SE PEDE OUTRO NOME. O nome da turma é escolha de quem a cria, e o
   * sistema não a limita: estes caminhos são artefactos da ESCOLA (têm o slug no caminho, e o
   * ponto 2 conta-os), o expurgo leva-os, e a geração escreve por cima sem perguntar. Dizer
   * «escolha outro nome» era transferir para a pessoa um problema que não existe. */
  console.log('   e há ' + turmas.size + ' pacote(s) de TURMA no caminho da escola — '
    + ([...turmas].sort().join(', ') || '(nenhum)') + '.');
  console.log('   Isto NÃO trava o nome de nenhuma turma: o pacote da turma é SAÍDA da geração, o');
  console.log('   expurgo da escola leva-o consigo (é o ponto 2), e a geração escreve por cima. A');
  console.log('   única recusa por nome de turma é outra: duas salas VIVAS com o mesmo nome na');
  console.log('   mesma escola — e essa é uma sala que já existe, para abrir e corrigir.');
}

/* ------------------------------------------------------------------------------------------ */
/* 5. O KV — a metade que o repositório não vê, e a única que a escola nova HERDA.
 *
 * «É o KV que uma escola nova com o mesmo nome herda: o prefixo é o nome» — e isso é uma frase
 * sobre dados que ninguém viu. Aqui ela passa a ser uma LEITURA, com a disciplina de sempre: sem
 * leitura não se diz «limpo», diz-se «não medi» e porquê. */
/* ------------------------------------------------------------------------------------------ */
const { chavesDaEscola } = require(path.join(__dirname, 'conferir-kv.js'));

(async () => {
  console.log('\n5. O KV — o que uma escola nova com o mesmo nome HERDA');
  const gravada = argumentoDe('kv-de');
  let leitura;
  if (gravada) {
    try {
      leitura = JSON.parse(fs.readFileSync(gravada, 'utf8'));
    } catch (erro) {
      leitura = { conferido: false, chaves: [], erro: 'não li ' + gravada + ': ' + erro.message };
    }
  } else {
    leitura = await chavesDaEscola({
      slug,
      token: process.env.CLOUDFLARE_API_TOKEN,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      raiz: RAIZ,
    });
  }
  if (!leitura || !leitura.conferido) {
    /* O SILÊNCIO VIRA RESPOSTA, e essa foi a lição de 21/11: «não havia» e «não consegui» não são
     * a mesma coisa, e a segunda nunca se imprime como a primeira. */
    console.log('   NÃO MEDI o KV: ' + ((leitura && leitura.erro) || 'sem motivo declarado'));
    console.log('   → e «não medi» não é «está limpo». A autoridade desta metade é o relatório da');
    console.log('     página «Sistema Lastro», que confere por LEITURA de cada chave');
    console.log('     (`kv.restantes` / `kv.ficaram`) e oferece «Terminar a limpeza do KV».');
  } else if (!leitura.chaves.length) {
    console.log('   nenhuma chave com o prefixo «' + slug + '/» nem «bastidores/' + slug + '/»');
    console.log('   → conferido por LISTAGEM, e o prefixo é o nome: criar a escola de novo não herda');
    console.log('     nada de uma encarnação anterior.');
  } else {
    console.log('   ATENÇÃO: ' + leitura.chaves.length
      + (leitura.chaves.length === 1 ? ' chave' : ' chaves') + ' com o prefixo da escola:');
    for (const c of leitura.chaves.slice(0, 12)) console.log('      · ' + c);
    if (leitura.chaves.length > 12) console.log('      · … e ' + (leitura.chaves.length - 12) + ' outra(s)');
    console.log('   → o VALOR não se imprime (uma chave dos Bastidores pode ter apelido de aluna).');
    console.log('     Como o prefixo do KV é o nome, criar a escola de novo HERDA isto. Resolva');
    console.log('     ANTES: «Terminar a limpeza do KV» na página, ou `node escola/expurgar.js ' + slug + '`.');
  }

  /* ---------------------------------------------------------------------------------------- */
  console.log('\n6. O QUE CONTINUA FORA DO ALCANCE — e quem alcança');
  /* ---------------------------------------------------------------------------------------- */
  console.log('   · O Worker, o subdomínio e a rota. Nenhum leitor daqui os vê, e é a página — que os');
  console.log('     criou e os desliga — que responde por eles.');
  console.log('   · Se a limpeza do KV não se completou, a página diz «este expurgo NÃO está completo»');
  console.log('     e oferece «Terminar a limpeza do KV» — a pendência fica gravada no elo.');
  console.log('   · Nada daqui IMPEDE a criação da escola: esta conferência informa. Quem decide é');
  console.log('     quem cria.');
  console.log('');
})();
