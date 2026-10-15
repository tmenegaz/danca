'use strict';

/**
 * repo-escola.js — as escolas VISTAS DO REPOSITÓRIO: listar e expurgar.
 *
 * POR QUE A LISTA SAI DAQUI, e não da API do Cloudflare. O expurgo precisa responder «que
 * escolas eu tenho?» — e a resposta tem de ser uma só. O repositório já é o registro: cada
 * escola deixa `wrangler.<slug>.jsonc` (criado pelo `criar-escola.sh`, versionado pelo
 * workflow) e os seus arquivos em `professores/<professor>/ciclos/ciclo-NN-<slug>*`. A
 * raiz `danca` TAMBÉM tem um `wrangler.danca.jsonc` — e não é escola; por isso ela sai.
 *
 * É a MESMA regra do expurgo local (`escola/expurgar.js`), que apaga exatamente estes
 * caminhos. Duas definições de «escola» divergiriam com o tempo; esta é a do repositório.
 *
 * O QUE AQUI NÃO SE FAZ: apagar no Cloudflare. Isso é `expurgar-escola.js` (subdomínio,
 * script, chaves do KV), e as duas metades são independentes de propósito — uma falha de
 * rede numa não pode deixar a outra pela metade sem que o relatório diga qual foi qual.
 *
 * A METADE LOCAL (o seu computador) NÃO É ALCANÇÁVEL daqui: `SENHA_<SLUG>` em
 * `tools/.senhas-locais` e `<slug>` em `tools/.escolas-teste` são arquivos locais, fora do
 * Git. Quem expurga diz o que fazer com eles em vez de fingir que os limpou.
 *
 * Toda a escrita é UMA operação do Git — um tree com as remoções e o acréscimo do elo, um
 * commit, um avanço de referência. Não se apaga arquivo a arquivo: seriam cinquenta commits
 * para expurgar uma escola, e o repositório guardaria cinquenta estados intermediários de
 * uma coisa só.
 */

const ACEITE = 'application/vnd.github+json';
const API_VERSAO = '2022-11-28';

/** A raiz NÃO é escola: ela tem `wrangler.danca.jsonc` e serve a porta de entrada. */
const NAO_ESCOLAS = new Set(['danca']);

function cabecalhos(token) {
  return {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'User-Agent': 'danca-raiz',
  };
}

async function pedir(f, url, token, opcoes) {
  const res = await f(url, Object.assign({ headers: cabecalhos(token) }, opcoes || {}));
  let corpo = null;
  try { corpo = await res.json(); } catch { corpo = null; }
  return { ok: res.ok, status: res.status, corpo };
}

/**
 * O caminho de um arquivo é DESTA escola? Casa `ciclo-NN-<slug>` seguido de fim, barra,
 * ponto ou traço — e só isso. Sem a âncora, um `ciclo-01-barra-dados.json` de outra escola
 * chamada `barra-dados` casaria; com ela, o pacote (`/`), a fonte (`-`) e a âncora (`.`)
 * entram, e mais nada.
 */
function ehArquivoDaEscola(caminho, slug, ciclo) {
  const nn = ciclo ? String(ciclo).padStart(2, '0') : '[0-9]{2}';
  const re = new RegExp('^professores/[^/]+/ciclos/ciclo-' + nn + '-' + slug + '(?=$|[/.-])');
  return re.test(caminho);
}

/** O `wrangler.<worker>.jsonc` deste slug — o arquivo que marca a escola. */
function ehConfigDaEscola(caminho, slug) {
  return caminho === 'wrangler.' + slug + '.jsonc';
}

/** Monta UMA escola a partir dos caminhos da árvore. `professor` e `ciclo` saem dos próprios
 * caminhos do ciclo (não do índice), porque é deles que o expurgo precisa: o índice pode
 * não existir — a escola `maria` não tem — e o expurgo não pode depender disso.
 */
function escolaDosCaminhos(slug, caminhos) {
  const arquivos = [];
  let professor = null;
  let ciclo = null;
  for (const caminho of caminhos) {
    if (ehConfigDaEscola(caminho, slug)) {
      arquivos.push(caminho);
      continue;
    }
    const m = /^professores\/([^/]+)\/ciclos\/ciclo-([0-9]{2})-/.exec(caminho);
    if (m && ehArquivoDaEscola(caminho, slug, m[2])) {
      arquivos.push(caminho);
      professor = professor || m[1];
      ciclo = ciclo || m[2];
    }
  }
  return {
    slug,
    professor,
    ciclo,
    arquivos: arquivos.sort(),
    total: arquivos.length,
  };
}

/** Todas as escolas numa lista de caminhos — a mesma regra de `listarEscolas`, sem a rede. */
function escolasDosCaminhos(caminhos) {
  const slugs = [];
  for (const caminho of caminhos) {
    const m = /^wrangler\.([a-z0-9-]+)\.jsonc$/.exec(caminho);
    if (!m) continue;
    const slug = m[1];
    if (NAO_ESCOLAS.has(slug) || slugs.includes(slug)) continue;
    slugs.push(slug);
  }
  return slugs.sort().map((slug) => escolaDosCaminhos(slug, caminhos));
}

/**
 * O ARCABOUÇO do ciclo do professor: `ciclos/ciclo-NN.conf` e `ciclos/ciclo-NN-*-schema.json`.
 * Ele NÃO é da escola — é do ciclo —, mas carrega o nome dela dentro (`NOME="Ciclo 01 — Barra"`
 * no manifesto BASE), e um órfão desses contamina a próxima escola do mesmo professor com o
 * nome da anterior. Por isso sai junto — e só nestas duas condições: é do ciclo expurgado, e o
 * professor ficou SEM OUTRA ESCOLA. Com outra escola viva, o arcabouço é dela também.
 *
 * O que NÃO entra: `cadernos/`, `relatorios/`, `campo/`. O nome de um arquivo de ciclo diz a
 * que ele pertence; o de um caderno não diz, e pode ser memória de campo. Isso se RELATA, não
 * se apaga por tabela.
 */
const SO_ARCABOUCO = /^professores\/([^/]+)\/ciclos\/ciclo-([0-9]{2})(?:\.conf|(?:-[a-z0-9]+)*-schema\.json)$/;

function arcaboucoDoCiclo(caminhos, professor, ciclo) {
  if (!professor || !ciclo) return [];
  return caminhos.filter((c) => {
    const m = SO_ARCABOUCO.exec(c);
    return Boolean(m) && m[1] === professor && m[2] === ciclo;
  }).sort();
}

/** O material do professor que o expurgo NÃO toca — para o relatório dizer o que ficou. */
function materialPreservado(caminhos, professor) {
  if (!professor) return [];
  const prefixo = 'professores/' + professor + '/';
  return caminhos.filter((c) => c.startsWith(prefixo) && !SO_ARCABOUCO.test(c)).sort();
}

/** A árvore do repositório, recursiva — numa chamada. Só os `blob` interessam. */
async function arvoreDeCaminhos({ token, dono, repo, ref, fetchImpl }) {
  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/git/trees/' + ref + '?recursive=1';
  const r = await pedir(f, url, token);
  if (!r.ok) throw new Error('não li a árvore do repositório: HTTP ' + r.status);
  const tree = (r.corpo && r.corpo.tree) || [];
  return tree.filter((t) => t.type === 'blob').map((t) => t.path);
}

/** As escolas que o repositório declara, em ordem de slug. A raiz sai. */
async function listarEscolas({ token, dono, repo, ref, fetchImpl }) {
  const caminhos = await arvoreDeCaminhos({ token, dono, repo, ref, fetchImpl });
  return escolasDosCaminhos(caminhos);
}

/** O commit e a árvore de que se parte (o expurgo cria UM commit novo a partir dele). */
async function baseDoGit({ token, dono, repo, ref, fetchImpl }) {
  const f = fetchImpl || fetch;
  const raizApi = 'https://api.github.com/repos/' + dono + '/' + repo;
  const r = await pedir(f, raizApi + '/git/ref/heads/' + ref, token);
  if (!r.ok) throw new Error('não li a referência ' + ref + ': HTTP ' + r.status);
  const commitSha = r.corpo && r.corpo.object && r.corpo.object.sha;
  if (!commitSha) throw new Error('a referência ' + ref + ' não devolveu commit');
  const c = await pedir(f, raizApi + '/git/commits/' + commitSha, token);
  if (!c.ok) throw new Error('não li o commit ' + commitSha + ': HTTP ' + c.status);
  const treeSha = c.corpo && c.corpo.tree && c.corpo.tree.sha;
  if (!treeSha) throw new Error('o commit ' + commitSha + ' não devolveu árvore');
  return { commitSha, treeSha };
}

/** Lê um arquivo do repositório (texto) — `null` em 404. */
async function lerArquivo({ token, dono, repo, ref, caminho, fetchImpl }) {
  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho +
    '?ref=' + encodeURIComponent(ref);
  const r = await pedir(f, url, token);
  if (!r.ok) return null;
  const base64 = (r.corpo && r.corpo.content) || '';
  const limpo = base64.replace(/\s/g, '');
  try {
    return Buffer.from(limpo, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

/**
 * O ELO do expurgo. O índice da escola NÃO é apagado — ele sobrevive de propósito
 * (`escola/expurgar.js` diz o mesmo): é ele que registra que a escola existiu e que foi
 * expurgada. Um arquivo ganha a entrada nova, ele não é reescrito — a proveniência
 * acrescenta. Criado se não existir (a `maria` não tem índice).
 */
function comElo(indiceTexto, { slug, professor, ciclo, arquivos, motivo, quando }) {
  let indice = null;
  try { indice = indiceTexto ? JSON.parse(indiceTexto) : null; } catch { indice = null; }
  if (!indice || typeof indice !== 'object') {
    indice = {
      escola: slug,
      professor: { slug: professor || null },
      ciclo: ciclo || null,
      senha: { chave: 'SENHA_' + slug.toUpperCase().replace(/[^A-Z0-9]/g, '_'), arquivo: 'tools/.senhas-locais' },
      arquivos: [],
    };
  }
  indice.expurgo = indice.expurgo || [];
  indice.expurgo.push({
    em: quando || new Date().toISOString(),
    motivo: motivo || 'expurgada pela raiz',
    apagado: arquivos,
  });
  return JSON.stringify(indice, null, 2) + '\n';
}

/**
 * Expurga a escola DO REPOSITÓRIO num ÚNICO commit: apaga os arquivos dela e registra o elo
 * no índice. Devolve `{ ok, escola, apagados, elo, commit, url }`.
 *
 * `confirmacao` repete o slug: é a trava de quem clica no botão — o expurgo não aceita um
 * slug de parâmetro sozinho, porque ele é irreversível do lado de quem usa.
 */
async function apagarEscolaDoRepo({ token, dono, repo, ref, slug, confirmacao, motivo, quando, fetchImpl }) {
  const f = fetchImpl || fetch;
  if (!slug) throw new Error('informe a escola');
  if (String(confirmacao) !== slug) {
    throw new Error('a confirmação não é o slug da escola — nada foi apagado');
  }

  const caminhos = await arvoreDeCaminhos({ token, dono, repo, ref, fetchImpl });
  const escola = escolaDosCaminhos(slug, caminhos);
  const { commitSha, treeSha } = await baseDoGit({ token, dono, repo, ref, fetchImpl });

  // O arcabouço do ciclo sai junto SÓ quando o professor ficou sem outra escola: com outra
  // viva, ele é dela também. `arquivos` é o que o commit apaga; os demais campos são relato.
  const outras = escolasDosCaminhos(caminhos).filter((e) => e.slug !== slug && e.professor === escola.professor);
  const arcabouco = outras.length === 0 ? arcaboucoDoCiclo(caminhos, escola.professor, escola.ciclo) : [];
  const apagados = escola.arquivos.concat(arcabouco);
  const preservados = materialPreservado(caminhos, escola.professor)
    .filter((c) => !apagados.includes(c) && !c.startsWith('professores/' + escola.professor + '/ciclos/ciclo-' + escola.ciclo + '-' + slug));

  const caminhoIndice = 'escola/' + slug + '/indice.json';
  const indiceAtual = await lerArquivo({ token, dono, repo, ref, caminho: caminhoIndice, fetchImpl });
  const indiceNovo = comElo(indiceAtual, {
    slug,
    professor: escola.professor,
    ciclo: escola.ciclo,
    arquivos: apagados,
    motivo,
    quando,
  });

  const raizApi = 'https://api.github.com/repos/' + dono + '/' + repo;
  // As remoções são `sha: null` sobre a `base_tree` — a forma do Git de dizer «este caminho
  // não existe no estado novo». O índice entra como conteúdo novo (ele CONTINUA existindo).
  const tree = apagados.map((path) => ({ path, mode: '100644', type: 'blob', sha: null }));
  tree.push({
    path: caminhoIndice,
    mode: '100644',
    type: 'blob',
    content: indiceNovo,
  });

  const novaArvore = await pedir(f, raizApi + '/git/trees', token, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos(token)),
    body: JSON.stringify({ base_tree: treeSha, tree }),
  });
  if (!novaArvore.ok) {
    throw new Error('não montei a árvore do expurgo: HTTP ' + novaArvore.status + ' ' +
      JSON.stringify((novaArvore.corpo && novaArvore.corpo.message) || ''));
  }

  const mensagem = [
    'chore(estrutura): expurgar a escola ' + slug,
    '',
    'Apaga o que o repositório guardava dela: o `wrangler.' + slug + '.jsonc`, o pacote e as fontes',
    'de `professores/' + (escola.professor || '<professor>') + '/ciclos/ciclo-' + (escola.ciclo || 'NN') + '-' + slug + '*` —',
    apagados.length + ' arquivo(s) ao todo' + (arcabouco.length
      ? ', incluindo o arcabouço do ciclo do professor: ele ficou sem'
      : '. O arcabouço do ciclo do professor fica, porque ele ainda tem outra escola.'),
    ...(arcabouco.length
      ? ['nenhuma outra escola e o manifesto BASE carregava o nome desta dentro.']
      : []),
    '',
    'O índice da escola sobrevive de propósito: a proveniência acrescenta, não apaga a memória de',
    'que a escola existiu.',
    '',
    'Refs: escola/' + slug + '/indice.json, wrangler.' + slug + '.jsonc',
    'Regras: P-03, P-04, P-17',
    'Auditoria: ' + (motivo || 'expurgada pela raiz'),
  ].join('\n');

  const novoCommit = await pedir(f, raizApi + '/git/commits', token, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos(token)),
    body: JSON.stringify({ message: mensagem, tree: novaArvore.corpo.sha, parents: [commitSha] }),
  });
  if (!novoCommit.ok) {
    throw new Error('não criei o commit do expurgo: HTTP ' + novoCommit.status);
  }

  const avancou = await pedir(f, raizApi + '/git/refs/heads/' + ref, token, {
    method: 'PATCH',
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos(token)),
    body: JSON.stringify({ sha: novoCommit.corpo.sha }),
  });
  if (!avancou.ok) {
    throw new Error('não avancei ' + ref + ' para o commit do expurgo: HTTP ' + avancou.status);
  }

  return {
    ok: true,
    escola: slug,
    professor: escola.professor,
    ciclo: escola.ciclo,
    apagados,
    totalApagado: apagados.length,
    arcaboucoDoCiclo: arcabouco,
    professorTemOutraEscola: outras.map((e) => e.slug),
    preservados,
    elo: caminhoIndice,
    commit: novoCommit.corpo.sha,
    url: novoCommit.corpo.html_url || null,
    indiceExistia: Boolean(indiceAtual),
  };
}

module.exports = {
  listarEscolas,
  apagarEscolaDoRepo,
  escolaDosCaminhos,
  escolasDosCaminhos,
  ehArquivoDaEscola,
  arcaboucoDoCiclo,
  materialPreservado,
  comElo,
  arvoreDeCaminhos,
  lerArquivo,
  NAO_ESCOLAS,
};
