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

// O decodificador do projeto — TextDecoder/atob, que EXISTEM no runtime dos Workers.
// `Buffer` não: ver a nota de `lerArquivo`.
const { decodificarBase64 } = require('./escrever-plano.js');

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
 * OS PROFESSORES que o repositório tem — os diretórios `professores/<slug>/`.
 *
 * POR QUE A UNICIDADE DO PROFESSOR OLHA AQUI. O nome do professor vira **diretório**
 * (`professores/<slug>/`), e esse diretório é do SISTEMA, não da escola: é ele que guarda o
 * pacote, os cadernos, os relatórios e as âncoras `.fipp`. Duas pessoas com o mesmo nome —
 * ou dois nomes que produzem o mesmo slug — caem na MESMA pasta, e aí o registro não as
 * distingue mais. Por isso a pergunta de unicidade é feita sobre os diretórios que existem,
 * e não sobre uma lista por escola.
 *
 * É a mesma leitura da árvore que a lista de escolas usa: uma chamada, sem consulta extra.
 */
function professoresDosCaminhos(caminhos) {
  const slugs = [];
  for (const caminho of caminhos) {
    const m = /^professores\/([^/]+)\//.exec(caminho);
    if (m && !slugs.includes(m[1])) slugs.push(m[1]);
  }
  return slugs.sort();
}

/**
 * A lista de professores com o NOME de exibição e as escolas de cada um. O nome sai do
 * índice das escolas do professor (`escola/<slug>/indice.json`, `professor.nome`) — é o
 * único lugar em que o repositório guarda o nome legível, porque o diretório guarda o slug.
 * Sem índice (ou sem `nome`), devolve `nome: null`: a lista serve para ESCOLHER, e um nome
 * ausente não impede escolher pelo slug.
 */
async function listarProfessores({ token, dono, repo, ref, fetchImpl }) {
  const caminhos = await arvoreDeCaminhos({ token, dono, repo, ref, fetchImpl });
  const slugs = professoresDosCaminhos(caminhos);
  const escolas = escolasDosCaminhos(caminhos);
  const lista = [];
  for (const slug of slugs) {
    const minhas = escolas.filter((e) => e.professor === slug);
    let nome = null;
    for (const e of minhas) {
      const texto = await lerArquivo({ token, dono, repo, ref, caminho: 'escola/' + e.slug + '/indice.json', fetchImpl });
      if (!texto) continue;
      try {
        const j = JSON.parse(texto);
        nome = (j.professor && j.professor.nome) || j.responsavel || null;
      } catch { nome = null; }
      if (nome) break;
    }
    lista.push({ slug, nome, escolas: minhas.map((e) => e.slug) });
  }
  return lista;
}

/**
 * O MANIFESTO BASE do ciclo do professor — `ciclos/ciclo-NN.conf`. É a única coisa do
 * arcabouço do ciclo que o expurgo toca.
 *
 * **OS SCHEMAS NÃO ENTRAM AQUI — nunca.** Eles são o MOLDE de que nasce toda escola nova:
 * `tools/criar-escola.sh` copia `modelo/ciclos/ciclo-01-*-schema.json` (o `MODELO="modelo/01"`)
 * e RECUSA criar escola quando eles não existem:
 *
 *     erro: ciclo-modelo sem schema: modelo/ciclos/ciclo-01-schema.json
 *
 * A primeira versão desta função apagava os schemas junto com o manifesto, «porque o
 * arquivo carrega o nome da escola dentro». O nome está no `ciclo-NN.conf`, não nos
 * schemas — e o preço foi real: em 15/10/2026 o dono do produto expurgou a barra e a
 * maria, o repositório ficou sem professor nenhum, e **a escola `ponta` não pôde nascer**
 * (o run #3 do `criar-escola.yml` morreu no passo do scaffold). Medido, não suposto.
 *
 * FOI ESSE EPISÓDIO QUE TIROU O MOLDE DE `professores/` (mesmo dia): ele vivia em
 * `professores/tiago/ciclos/`, com nome de pessoa, e por isso aparecia como professor em
 * toda lista — e podia ser apagado como «pasta de um professor que não existe mais». Hoje
 * ele mora em `modelo/`, onde nada o confunde com gente, e `professores/` tem só pessoas.
 * A proteção abaixo continua valendo: os schemas de um PROFESSOR também não se apagam.
 *
 * O manifesto base SAI, e é certo que saia: ele é GERADO pelo scaffolder (um `heredoc`) e
 * carrega o nome da escola morta (`NOME="Ciclo 01 — Maria"`). Deixá-lo faria a próxima
 * escola do mesmo professor no mesmo ciclo ser recusada — «a escola/ciclo já existe» —, e o
 * dono do produto quer justamente poder começar de novo.
 */
const SO_MANIFESTO_BASE = /^professores\/([^/]+)\/ciclos\/ciclo-([0-9]{2})\.conf$/;

function manifestoBaseDoCiclo(caminhos, professor, ciclo) {
  if (!professor || !ciclo) return [];
  return caminhos.filter((c) => {
    const m = SO_MANIFESTO_BASE.exec(c);
    return Boolean(m) && m[1] === professor && m[2] === ciclo;
  }).sort();
}

/** O material do professor que o expurgo NÃO toca — para o relatório dizer o que ficou.
 * Aqui entram os SCHEMAS do ciclo (o modelo) e `cadernos/`, `relatorios/`, `campo/`. */
function materialPreservado(caminhos, professor) {
  if (!professor) return [];
  const prefixo = 'professores/' + professor + '/';
  return caminhos.filter((c) => c.startsWith(prefixo) && !SO_MANIFESTO_BASE.test(c)).sort();
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

/**
 * Lê um arquivo do repositório (texto). **404 devolve `null`** — ausente é ausente. Qualquer
 * outro fracasso LANÇA, e é o ponto desta função.
 *
 * A primeira versão decodificava com `Buffer`, que **não existe no runtime dos Workers** (é
 * global do Node). O `try/catch` em volta transformava o `ReferenceError` em `null` — e
 * «não consegui ler» ficou idêntico a «não existe»: o expurgo não achava o namespace do KV
 * (a escola saía do ar e o dado das alunas ficava) e reescrevia o índice da escola a partir
 * do zero, perdendo `worker`, `criado_em` e `responsavel`. Medido na barra. É o mesmo defeito
 * que `escrever-plano.js` documenta em letras grandes: «Base64 em UTF-8 SEM `Buffer` (ausente
 * no Workers runtime)». Ele está certo; eu é que reescrevi o que já estava resolvido.
 *
 * Agora a decodificação usa o `decodificarBase64` do projeto (TextDecoder/atob), e uma falha
 * sobe em vez de virar silêncio.
 */
async function lerArquivo({ token, dono, repo, ref, caminho, fetchImpl }) {
  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho +
    '?ref=' + encodeURIComponent(ref);
  const r = await pedir(f, url, token);
  if (r.status === 404) return null;
  if (!r.ok) {
    const recado = (r.corpo && r.corpo.message) || ('HTTP ' + r.status);
    throw new Error('não li ' + caminho + ': ' + recado);
  }
  const base64 = (r.corpo && r.corpo.content) || '';
  if (!base64) return '';
  return decodificarBase64(base64);
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

  // O manifesto base do ciclo sai junto SÓ quando o professor ficou sem outra escola NAQUELE
  // ciclo: com outra viva, o manifesto é dela também. OS SCHEMAS NÃO SAEM — são o modelo de
  // que nasce toda escola nova (ver `SO_MANIFESTO_BASE`). `apagados` é o que o commit apaga;
  // os demais campos são relato.
  const outras = escolasDosCaminhos(caminhos)
    .filter((e) => e.slug !== slug && e.professor === escola.professor && e.ciclo === escola.ciclo);
  const manifesto = outras.length === 0
    ? manifestoBaseDoCiclo(caminhos, escola.professor, escola.ciclo)
    : [];
  const apagados = escola.arquivos.concat(manifesto);
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
    apagados.length + ' arquivo(s) ao todo' + (manifesto.length
      ? ', incluindo o manifesto base do ciclo: o professor'
      : '. O manifesto base do ciclo fica, porque o professor ainda tem'),
    ...(manifesto.length
      ? ['ficou sem outra escola naquele ciclo e o manifesto carregava o nome desta dentro.']
      : ['outra escola nele.']),
    '',
    'OS SCHEMAS DO CICLO NÃO SÃO APAGADOS: eles são o molde de que nasce toda escola nova',
    '(`tools/criar-escola.sh` copia `modelo/ciclos/ciclo-01-*-schema.json` e recusa criar sem',
    'eles). Em 15/10/2026 uma versão anterior os apagou, e a escola `ponta` não pôde nascer.',
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
    manifestoBaseDoCiclo: manifesto,
    professorTemOutraEscolaNoCiclo: outras.map((e) => e.slug),
    preservados,
    elo: caminhoIndice,
    commit: novoCommit.corpo.sha,
    url: novoCommit.corpo.html_url || null,
    indiceExistia: Boolean(indiceAtual),
  };
}

module.exports = {
  listarEscolas,
  listarProfessores,
  apagarEscolaDoRepo,
  escolaDosCaminhos,
  escolasDosCaminhos,
  professoresDosCaminhos,
  ehArquivoDaEscola,
  manifestoBaseDoCiclo,
  materialPreservado,
  comElo,
  arvoreDeCaminhos,
  lerArquivo,
  NAO_ESCOLAS,
};
