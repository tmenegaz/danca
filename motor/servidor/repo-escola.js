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
 * A METADE LOCAL (o seu computador) NÃO É ALCANÇÁVEL daqui, e desde 19/10/2026 o relatório
 * já não manda mexer nela: `SENHA_<SLUG>` em `tools/.senhas-locais` e `<slug>` em
 * `tools/.escolas-teste` deixaram de ser escritos quando a criação de escola passou a ser do
 * Worker — `criar-escola.sh` e `provisionar-escola.js` não tocam em nenhum dos dois. Pedir
 * para tirar uma linha que não existe é ruído com aparência de tarefa.
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
// A REGRA DO ACERVO é do acervo (20/10/2026): o expurgo pergunta onde ficam os envelopes, e a
// resposta tem de ser a mesma que a do escritor — duas cópias da regra divergem no dia em que
// a pasta mudar.
const acervoEnvelopes = require('./acervo-envelopes.js');

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

/**
 * OS CABEÇALHOS DE UMA ESCRITA — e o `User-Agent` NÃO É DECORAÇÃO (22/10/2026).
 *
 * MEDIDO, contra a API real: `GET /contents/escola/batata/indice.json` responde **200** com
 * `User-Agent` e **403** sem ele. O GitHub recusa por regra administrativa toda requisição sem
 * `User-Agent`, e o runtime dos Workers **não** o preenche sozinho (o `undici` do Node preenche,
 * e é por isso que as provas locais passavam: elas mediam um ambiente mais permissivo do que o de
 * produção).
 *
 * Foi assim que a edição do nome do professor principal falhou no ar: `escreverNoInventario`
 * montava os cabeçalhos à mão, com `Authorization` e `Accept`, e sem o `User-Agent` que
 * `cabecalhos()` já tinha. A leitura do inventário morria em 403 antes de qualquer escrita, e a
 * mensagem dizia só «HTTP 403» — sem o motivo, que é o que teria apontado o defeito na hora.
 *
 * UMA função, e todos os pedidos de escrita passam por ela: a lista de cabeçalhos existe num lugar
 * só, e um cabeçalho novo não precisa de ser lembrado em cinco.
 */
function cabecalhosDeEscrita(token) {
  return Object.assign(cabecalhos(token), { 'Content-Type': 'application/json' });
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

/**
 * O ACERVO da escola: os ENVELOPES em `escola/<slug>/envelopes/` (20/10/2026).
 *
 * Anamneses, planos de ensino e planos de observação passaram a viver no repositório — são
 * registro da escola, não da sessão de quem os preencheu —, e por isso o expurgo tem de os
 * levar consigo: uma escola que sai do ar e do registro deixando os registros das alunas no
 * repositório não foi expurgada. O caminho da fase 1 (`escola/<slug>/anamneses/`) continua a
 * ser reconhecido: há escolas anteriores a esta mudança, e o expurgo não pode deixar de ver o
 * que elas têm. O `indice.json` da escola NÃO entra aqui: é o elo do expurgo, e sobrevive de
 * propósito.
 */
function ehAcervoDaEscola(caminho, slug) {
  return acervoEnvelopes.ehAcervoDaEscola(caminho, slug);
}

/** O nome antigo, mantido para as provas e para quem ainda o procura. */
const ehAnamneseDaEscola = ehAcervoDaEscola;

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
    // O acervo da escola (os envelopes) sai com ela. Antes de `professores/` porque não é do
    // professor: a anamnese é da escola, e o mesmo professor pode ter outra escola viva.
    if (ehAcervoDaEscola(caminho, slug)) {
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
 * A LISTA DE PROFESSORES PELO ÍNDICE (20/10/2026). Mesma regra da lista de escolas: o índice
 * responde com uma leitura do KV, e a varredura fica como recurso. O NOME continua a vir do
 * inventário da escola — o índice copiou-o de lá, e é isso que impede as duas leituras de
 * discordarem sobre como se chama a pessoa.
 */
async function listarProfessoresPeloIndice({ token, dono, repo, ref, fetchImpl, kv, reconstruir }) {
  if (token && kv) {
    try {
      const { lerComCache } = require('./indice-acervo.js');
      const r = await lerComCache({
        token, dono, repo, ref, fetchImpl, kv, reconstruir: reconstruir === true, comApelido: false,
      });
      if (r.ok && r.indice && Array.isArray(r.indice.professores)) {
        return {
          ok: true,
          doIndice: true,
          doCache: r.doCache,
          custo: r.custo,
          // O professor cujas escolas foram TODAS expurgadas já não é escolhível — a mesma regra
          // das escolas vivas, um nível acima. Um professor vivo numa escola viva continua.
          professores: r.indice.professores
            .filter((p) => p.escolas.some((slug) => {
              const daEscola = r.indice.escolas.find((e) => e.slug === slug);
              return daEscola && !daEscola.expurgada;
            }))
            .map((p) => ({ slug: p.slug, nome: p.nome, escolas: p.escolas })),
        };
      }
    } catch (erro) {
      // segue para a varredura
    }
  }
  const professores = await listarProfessores({ token, dono, repo, ref, fetchImpl });
  return { ok: true, doIndice: false, doCache: false, custo: null, professores };
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

/**
 * O PERFIL DO PROFESSOR — E O EXPURGO NÃO LHE TOCA (03/11/2026).
 *
 * A DECISÃO DELA, e não é uma preferência de arrumação: «o fim de um vínculo contratual ou o
 * expurgo físico de uma escola apaga os dados operacionais daquela escola, mas NÃO extingue e
 * nem corrompe as habilidades do professor». A competência de quem ensina não é dado do tenant —
 * é da pessoa —, e uma escola que fecha não pode levar consigo o que a pessoa sabe.
 *
 * POR QUE UMA FUNÇÃO, SE JÁ FUNCIONAVA. Medido: `professores/<slug>/perfil.json` já caía em
 * `materialPreservado` (não casa `ehArquivoDaEscola`, que exige `ciclos/ciclo-NN-<escola>`), e por
 * isso já sobrevivia. Mas sobrevivia **por não se parecer com nada do que se apaga** — e uma
 * garantia que depende de o caminho não casar com um padrão alheio é uma garantia que a próxima
 * mudança de padrão revoga sem avisar. Passa a haver uma regra com nome, uma guarda no expurgo e
 * uma prova que a prende.
 */
const EH_PERFIL_DO_PROFESSOR = /^professores\/[^/]+\/perfil\.json$/;

/** Se o caminho é o perfil de um professor — o que o expurgo preserva por decisão, não por acaso. */
function ehPerfilDoProfessor(caminho) {
  return EH_PERFIL_DO_PROFESSOR.test(String(caminho || ''));
}

/**
 * A GUARDA DO EXPURGO: recusa ANTES de apagar se a lista levar um perfil.
 *
 * NENHUMA REGRA DE CAMINHO LEVA UM PERFIL HOJE — a de `ehArquivoDaEscola` exige
 * `ciclos/ciclo-NN-<escola>`, e um `professores/<slug>/perfil.json` não casa. A guarda existe
 * porque isso é uma coincidência entre dois padrões, e não um contrato: no dia em que o padrão
 * alargar, a lista passa a levar perfis **sem que ninguém tenha decidido isso**.
 *
 * E o expurgo é a operação mais destrutiva do sistema, sem desfazer. Um erro que impede uma
 * limpeza custa uma retomada; uma limpeza que leva a competência de uma pessoa custa a pessoa.
 *
 * Devolve a mesma lista quando está limpa — quem chama não tem de saber que houve uma guarda.
 */
function semPerfisNaLista(apagados) {
  const lista = Array.isArray(apagados) ? apagados : [];
  const perfis = lista.filter((c) => ehPerfilDoProfessor(c));
  if (perfis.length) {
    throw new Error('o expurgo ia apagar o perfil de um professor ('
      + perfis.join(', ') + ') — a habilitação é da pessoa, não da escola; nada foi apagado');
  }
  return lista;
}

/** O material do professor que o expurgo NÃO toca — para o relatório dizer o que ficou.
 * Aqui entram os SCHEMAS do ciclo (o modelo) e `cadernos/`, `relatorios/`, `campo/`.
 *
 * O NOME DIZ «do professor», e é isso que ele devolve: TUDO o que é dele. Inclusive o material
 * de OUTRAS escolas do mesmo professor — que não é «preservado por esta regra», é de outro
 * dono. Quem relata precisa da distinção; ela está em `classificarPreservados`. */
function materialPreservado(caminhos, professor) {
  if (!professor) return [];
  const prefixo = 'professores/' + professor + '/';
  return caminhos.filter((c) => c.startsWith(prefixo) && !SO_MANIFESTO_BASE.test(c)).sort();
}

/** Os schemas do ciclo — o MOLDE de que nasce toda escola nova (`modelo/ciclos/`). */
const EH_SCHEMA_DO_CICLO = /^professores\/[^/]+\/ciclos\/ciclo-[0-9]{2}(-[a-z0-9]+)*-schema\.json$/;

/**
 * SEPARA o que sobrou em três naturezas, porque somá-las num número só mente.
 *
 * Medido em 19/10/2026, ao expurgar a `fita`: o relatório disse «Preservado(s): 19 arquivo(s) —
 * os schemas do modelo, caderno, relatório de campo e acompanhamento não se apagam por tabela».
 * Os 19 eram **5 schemas** e **14 arquivos da `valse`** — outra escola, viva, do mesmo
 * professor. Não havia caderno, relatório nem acompanhamento nenhum. O número estava certo e a
 * frase, errada: quem lesse concluiria que o expurgo tinha deixado lixo da `fita`.
 *
 * As três naturezas:
 *   · `modelo`           — os schemas do ciclo. Não pertencem a escola nenhuma: são o molde.
 *   · `doProfessor`      — cadernos, relatórios, campo, acompanhamentos: do professor, não da escola.
 *   · `deOutrasEscolas`  — o pacote e o manifesto de outra escola do mesmo professor. Nada a ver
 *                          com este expurgo, e é o que precisa de ser DITO para não assustar.
 */
function classificarPreservados(caminhos, professor, slug) {
  const lista = materialPreservado(caminhos, professor);
  const outras = escolasDosCaminhos(caminhos || []).filter((e) => e.slug !== slug);
  const modelo = [];
  const doProfessor = [];
  const deOutrasEscolas = [];
  for (const c of lista) {
    if (EH_SCHEMA_DO_CICLO.test(c)) { modelo.push(c); continue; }
    if (slug && outras.some((e) => ehArquivoDaEscola(c, e.slug, e.ciclo))) { deOutrasEscolas.push(c); continue; }
    // Um caminho da PRÓPRIA escola que não entrou em `apagados` não é material preservado: é
    // resto de um expurgo que falhou. Fica de fora das três listas para não inflar nenhuma.
    if (slug && ehArquivoDaEscola(c, slug)) continue;
    doProfessor.push(c);
  }
  return {
    modelo,
    doProfessor,
    deOutrasEscolas,
    outrasEscolas: outras.map((e) => e.slug),
  };
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

/**
 * A LISTA DE ESCOLAS PELO ÍNDICE — e a varredura só como recurso (20/10/2026, fase 4).
 *
 * `listarEscolas` custa uma leitura da árvore do repositório POR CHAMADA, e é chamada a cada
 * abertura da página da raiz. O índice responde o mesmo com UMA leitura do cache (o KV) — e,
 * quando o cache está frio, com a construção que já traz tudo o que a página precisa.
 *
 * O RECURSO EXISTE E NÃO É TEATRO: sem token, com o índice de uma versão que este código não
 * conhece, ou com a construção a falhar, a varredura devolve o mesmo que sempre devolveu. Um
 * índice que só funciona quando funciona não é um índice — é um novo ponto de falha.
 *
 * `doIndice` diz de onde veio, para a prova poder medir «zero árvores» em vez de acreditar.
 */
async function listarEscolasPeloIndice({ token, dono, repo, ref, fetchImpl, kv, reconstruir }) {
  if (token && kv) {
    try {
      const { lerComCache } = require('./indice-acervo.js');
      const r = await lerComCache({
        token, dono, repo, ref, fetchImpl, kv, reconstruir: reconstruir === true, comApelido: false,
      });
      if (r.ok && r.indice && Array.isArray(r.indice.escolas)) {
        return {
          ok: true,
          doIndice: true,
          doCache: r.doCache,
          custo: r.custo,
          // A LISTA DA RAIZ É DE ESCOLAS VIVAS. O índice guarda também a expurgada — é o elo que o
          // expurgo preserva, e ele não se apaga. Mas o botão «Apagar escola» não oferece o que já
          // não existe: quem filtra é o consumidor, porque o índice é memória e a lista é escolha.
          escolas: r.indice.escolas.filter((e) => !e.expurgada).map((e) => ({
            slug: e.slug,
            professor: e.professor,
            ciclo: e.ciclos.length ? String(e.ciclos[0]).split('/')[1] : null,
            arquivos: [],
            total: e.contagens.registros + e.contagens.aulas,
            expurgada: e.expurgada,
          })),
        };
      }
    } catch (erro) {
      // segue para a varredura
    }
  }
  const escolas = await listarEscolas({ token, dono, repo, ref, fetchImpl });
  return { ok: true, doIndice: false, doCache: false, custo: null, escolas };
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
function comElo(indiceTexto, { slug, professor, ciclo, arquivos, motivo, quando, kv }) {
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
  const elo = {
    em: quando || new Date().toISOString(),
    motivo: motivo || 'expurgada pela raiz',
    apagado: arquivos,
  };
  // O QUE FICOU NO KV — e não é relato: é a PENDÊNCIA. A limpeza das chaves começa por
  // ENUMERAR, e a enumeração tem cota diária própria; quando ela falta, o expurgo tira a
  // escola do ar e do repositório e não consegue apagar o dado. Sem esta anotação, a
  // pendência morre com a escola (o `wrangler.<slug>.jsonc`, que dizia onde vive o KV, foi
  // apagado no mesmo commit) — foi o que aconteceu com a `calango` em 19/10/2026. Com ela,
  // a limpeza pode ser RETOMADA depois: a rota `/api/expurgar-kv` lê daqui o namespace e os
  // prefixos e não precisa mais de saber que a escola existiu.
  if (kv) {
    elo.kv = {
      ok: kv.ok === true,
      apagadas: kv.apagadas === undefined ? null : kv.apagadas,
      restantes: kv.restantes === undefined ? null : kv.restantes,
      namespaceId: kv.namespaceId || null,
      prefixos: kv.prefixos || null,
      em: elo.em,
    };
    /* O PORQUÊ VAI COM O ELO (01/11/2026). Antes, `ok:false` chegava sozinho e a pendência
     * dizia «não deu» sem dizer por quê — a próxima sessão tinha de adivinhar entre cota,
     * permissão e rede. A retomada (`/api/expurgar-kv`) já existe; o que faltava era o
     * motivo ao lado dela. */
    if (kv.erro) elo.kv.erro = String(kv.erro);
    if (kv.ok !== true) elo.kv.pendente = true;
  }
  indice.expurgo.push(elo);
  return JSON.stringify(indice, null, 2) + '\n';
}

/**
 * Expurga a escola DO REPOSITÓRIO num ÚNICO commit: apaga os arquivos dela e registra o elo
 * no índice. Devolve `{ ok, escola, apagados, elo, commit, url }`.
 *
 * `confirmacao` repete o slug: é a trava de quem clica no botão — o expurgo não aceita um
 * slug de parâmetro sozinho, porque ele é irreversível do lado de quem usa.
 *
 * A CORRIDA PERDIDA NÃO É UM ERRO AQUI TAMBÉM (04/11/2026). Era: o expurgo montava a árvore e
 * o commit sobre a `main` que tinha lido, e era o ÚNICO escrito em lote sem repetição — o
 * `apagarProfessorDoRepo` ao lado já tinha as três tentativas. Perder a corrida lançava, e o
 * expurgo chegava a este ponto com a metade do Cloudflare JÁ FEITA (subdomínio, Worker e
 * chaves apagados): a escola saía do ar e ficava no repositório, num estado que só se resolvia
 * à mão. O laço é o mesmo dos outros: a corrida refaz o caminho inteiro — base nova, árvore
 * nova, commit novo —, e o que sobe na última tentativa já viu o `main` de agora.
 */
async function apagarEscolaDoRepo(opcoes) {
  let ultimo = null;
  for (let intento = 1; intento <= 3; intento += 1) {
    const r = await apagarEscolaDoRepoUmaVez(opcoes);
    if (r.ok) return Object.assign(r, { intentos: intento });
    ultimo = r.motivo || r.erro;
    if (!r.corrida) return Object.assign(r, { intentos: intento });
    await ESPERA_DO_INTENTO(intento);
  }
  return { ok: false, erro: ultimo, expurgoNoRepositorio: 'não entrou depois de 3 tentativas' };
}

async function apagarEscolaDoRepoUmaVez({ token, dono, repo, ref, slug, confirmacao, motivo, quando, kv, fetchImpl }) {
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
  // A GUARDA DO PERFIL, aplicada à lista que vai ser apagada — ver `semPerfisNaLista`.
  semPerfisNaLista(apagados);
  const classificados = classificarPreservados(caminhos, escola.professor, slug);
  const semApagados = (lista) => lista.filter((c) => !apagados.includes(c));
  const preservadosPorTipo = {
    modelo: semApagados(classificados.modelo),
    doProfessor: semApagados(classificados.doProfessor),
    deOutrasEscolas: semApagados(classificados.deOutrasEscolas),
    outrasEscolas: classificados.outrasEscolas,
  };
  const preservados = preservadosPorTipo.modelo
    .concat(preservadosPorTipo.doProfessor, preservadosPorTipo.deOutrasEscolas)
    .filter((c) => !c.startsWith('professores/' + escola.professor + '/ciclos/ciclo-' + escola.ciclo + '-' + slug))
    .sort();
  // O PERFIL DO PROFESSOR, nomeado no relatório: quem lê o commit do expurgo tem de ver que ele
  // sobreviveu E porquê — uma preservação que ninguém anuncia é indistinguível de um esquecimento.
  const perfisPreservados = preservados.filter((c) => ehPerfilDoProfessor(c));

  const caminhoIndice = 'escola/' + slug + '/indice.json';
  const indiceAtual = await lerArquivo({ token, dono, repo, ref, caminho: caminhoIndice, fetchImpl });
  const indiceNovo = comElo(indiceAtual, {
    slug,
    professor: escola.professor,
    ciclo: escola.ciclo,
    arquivos: apagados,
    motivo,
    quando,
    kv,
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
    // 409 aqui é a `base_tree` que deixou de valer: alguém escreveu no `main` no meio.
    if (novaArvore.status === 409 || novaArvore.status === 422) {
      return { ok: false, corrida: true, motivo: 'árvore do expurgo: HTTP ' + novaArvore.status };
    }
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
    ...(perfisPreservados.length
      ? ['O PERFIL DO PROFESSOR FICA, e é decisão (03/11/2026): a habilitação é da PESSOA, não do',
        'tenant. Uma escola que fecha não leva consigo o que a pessoa sabe ensinar —',
        perfisPreservados.join(', ') + '.']
      : []),
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
    // `force: false` explícito: o `main` só avança se este commit DESCENDE dele. É esta
    // recusa que transforma uma escrita concorrente em corrida, e não em sobrescrita.
    body: JSON.stringify({ sha: novoCommit.corpo.sha, force: false }),
  });
  if (!avancou.ok) {
    // 422 aqui é «not a fast forward»: o `main` andou enquanto montávamos o commit. Nada foi
    // publicado — os blobs e o commit não ficaram pendurados em nada, e a árvore é refeita do
    // zero sobre a base nova.
    if (avancou.status === 422 || avancou.status === 409) {
      return { ok: false, corrida: true, motivo: 'referência do expurgo: HTTP ' + avancou.status };
    }
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
    preservadosPorTipo,
    // Os perfis que o expurgo deixou intactos — a lista que a decisão de 03/11/2026 obriga a
    // mostrar. Vazia quando o professor ainda não tem perfil, e isso também é verdade.
    perfisPreservados,
    elo: caminhoIndice,
    commit: novoCommit.corpo.sha,
    url: novoCommit.corpo.html_url || null,
    indiceExistia: Boolean(indiceAtual),
  };
}

/**
 * A PENDÊNCIA DO KV que o expurgo deixou, lida do elo — `null` se não há nenhuma.
 *
 * É a memória que faltava: o expurgo pode terminar a metade do Cloudflare e não a do KV, e
 * a escola, depois dele, já não existe em lugar nenhum de onde se possa deduzir o namespace.
 * O elo guarda-o. Devolve `{ namespaceId, prefixos, em, motivo }` do expurgo mais recente que
 * ficou pendente — ou `null`.
 */
async function pendenciaDoKv({ token, dono, repo, ref, slug, fetchImpl }) {
  const texto = await lerArquivo({
    token, dono, repo, ref, caminho: 'escola/' + slug + '/indice.json', fetchImpl,
  });
  if (!texto) return null;
  let indice = null;
  try { indice = JSON.parse(texto); } catch { return null; }
  const elos = (indice && indice.expurgo) || [];
  for (let i = elos.length - 1; i >= 0; i--) {
    const kv = elos[i] && elos[i].kv;
    if (kv && kv.pendente === true) {
      return {
        namespaceId: kv.namespaceId || null,
        prefixos: kv.prefixos || null,
        em: kv.em || elos[i].em || null,
        motivo: elos[i].motivo || null,
      };
    }
  }
  return null;
}

/**
 * Marca no elo que a pendência do KV foi resolvida (ou não). Reescreve SÓ o último elo
 * pendente — o passado não se reescreve: o elo do expurgo continua a dizer o que aconteceu,
 * e ganha a linha do que veio depois.
 */
function comResolucaoDoKv(indiceTexto, { quando, resultado }) {
  let indice = null;
  try { indice = indiceTexto ? JSON.parse(indiceTexto) : null; } catch { indice = null; }
  if (!indice || !Array.isArray(indice.expurgo)) return indiceTexto;
  for (let i = indice.expurgo.length - 1; i >= 0; i--) {
    const elo = indice.expurgo[i];
    if (!elo || !elo.kv || elo.kv.pendente !== true) continue;
    elo.kv.retomada = {
      em: quando || new Date().toISOString(),
      ok: resultado && resultado.ok === true,
      apagadas: resultado && resultado.apagadas !== undefined ? resultado.apagadas : null,
      restantes: resultado && resultado.restantes !== undefined ? resultado.restantes : null,
    };
    if (resultado && resultado.ok === true) delete elo.kv.pendente;
    break;
  }
  return JSON.stringify(indice, null, 2) + '\n';
}

/**
 * Grava o índice da escola de volta (só ele), num commit próprio. É da RETOMADA da limpeza
 * do KV: o elo do expurgo ganha a linha do que veio depois — o passado não se reescreve.
 * Devolve `{ ok, commit }` ou lança.
 */
async function atualizarIndiceDaEscola({ token, dono, repo, ref, slug, conteudo, fetchImpl }) {
  const f = fetchImpl || fetch;
  const caminho = 'escola/' + slug + '/indice.json';
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho;
  // O MESMO DEFEITO VIVIA AQUI (22/10/2026): cabeçalhos montados à mão, sem `User-Agent`. Este
  // caminho é o da RETOMADA da limpeza do KV — a rota que existe exactamente para o dia em que a
  // enumeração falhou. Um 403 aqui deixaria a pendência sem como ser resolvida.
  const cabecalhos = cabecalhosDeEscrita(token);
  const atual = await f(url + '?ref=' + encodeURIComponent(ref), { headers: cabecalhos });
  let sha = null;
  if (atual.ok) {
    const dados = await atual.json().catch(() => null);
    sha = (dados && dados.sha) || null;
  }
  const bytes = new TextEncoder().encode(String(conteudo));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  const res = await f(url, {
    method: 'PUT',
    headers: cabecalhos,
    body: JSON.stringify({
      message: 'chore(escola): a limpeza do KV de ' + slug + ' foi retomada e concluída',
      content: btoa(binario),
      branch: ref,
      ...(sha ? { sha } : {}),
    }),
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error('o GitHub recusou gravar ' + caminho + ': ' + ((dados && dados.message) || ('HTTP ' + res.status)));
  }
  return { ok: true, commit: dados.commit && dados.commit.sha };
}

/**
 * O VÍNCULO PROFESSOR↔ESCOLA, NO INVENTÁRIO (22/10/2026).
 *
 * Quem cadastra um professor na Produção grava o vínculo no KV — e o KV não é fonte do acervo
 * (o acervo lê o repositório, uma leitura só, sem `list()`). Sem uma linha no repositório, um
 * professor criado dentro da escola não aparecia ligado a ela em lugar nenhum: o painel só o
 * conhecia quando ele já tinha ciclo, e aí o vínculo vinha do caminho do ciclo, não do cadastro.
 *
 * O inventário já é o documento que DECLARA a escola (o responsável, o ciclo, os arquivos), e a
 * escrita é ACRESCENTAR — quem já está na lista não é reescrito. É a mesma regra do elo do
 * expurgo: a proveniência acrescenta.
 */
function comProfessor(indiceTexto, { escola, professor, nome, quando }) {
  let indice = null;
  try { indice = indiceTexto ? JSON.parse(indiceTexto) : null; } catch { indice = null; }
  if (!indice || typeof indice !== 'object') {
    throw new Error('o inventário da escola não é um objeto JSON legível — não se inventa um');
  }
  const slug = String(professor || '').trim();
  if (!slug) throw new Error('sem o identificador do professor');
  const lista = Array.isArray(indice.professores) ? indice.professores : [];
  if (lista.some((p) => p && p.slug === slug)) return { texto: null, jaExistia: true, quantidade: lista.length };
  // O responsável já está no singular (`professor`) e não se repete na lista.
  const doResponsavel = indice.professor && indice.professor.slug === slug;
  if (doResponsavel) return { texto: null, jaExistia: true, quantidade: lista.length };
  lista.push({ slug, nome: nome || null, desde: quando || new Date().toISOString() });
  indice.escola = indice.escola || escola;
  indice.professores = lista;
  return { texto: JSON.stringify(indice, null, 2) + '\n', jaExistia: false, quantidade: lista.length };
}

/**
 * Grava o vínculo no inventário, num commit próprio. Idempotente: se o professor já está lá,
 * devolve `{ok, jaExistia: true}` sem escrever nada.
 */
/**
 * A CORRIDA PERDIDA NÃO É UM ERRO (22/10/2026) — é uma tentativa a mais.
 *
 * Medido: o professor `meia-cortada` foi cadastrado às 09:38; o `garantirEstruturaDoProfessor`
 * escreveu os cinco schemas (cinco commits), o `reancorar` e o `regerar-indices` dispararam — e o
 * vínculo no inventário, que lê o `sha` do arquivo e grava por cima dele, chegou com um `sha` que
 * já não era o do `main`. O GitHub recusa (409), o cadastro devolve 502, e o professor fica com a
 * pasta criada e sem a escola declarada — invisível no painel como professor de escola nenhuma.
 *
 * Um `409` (ou um `422`, o `sha` que não veio) numa escrita `contents` quer dizer uma coisa só:
 * alguém escreveu no meio. A resposta certa não é desistir — é **reler e refazer**. O laço é
 * curto de propósito (três tentativas, espera crescente), e a última falha continua a ser um
 * erro dito, com o motivo do GitHub.
 */
const ESPERA_DO_INTENTO = (intento) => new Promise((s) => setTimeout(s, intento * 350));

/**
 * O RECADO QUE O GITHUB DEU, quando deu algum — « — <message>». Lido sem consumir o que o
 * chamador precisa: estas funções só o usam em caminhos onde a resposta já não serve.
 */
async function recadoDaResposta(resposta) {
  try {
    const corpo = await resposta.json();
    const msg = corpo && (corpo.message || corpo.error);
    if (msg) return ' — ' + String(msg);
  } catch (e) { /* sem corpo: fica só o número */ }
  return '';
}
const CORRIDA_PERDIDA = new Set([409, 422]);

/**
 * O LAÇO ÚNICO de escrita no inventário de uma escola, com a releitura da corrida perdida.
 *
 * `transformar(texto)` devolve `{texto, jaExistia}` — ou lança, quando não há o que fazer (uma
 * escola sem inventário, por exemplo). Duas escritas usam-no: declarar um professor e gravar o
 * NOME dele. Duplicar o laço seria ter duas versões da mesma espera, e a segunda envelheceria
 * primeiro.
 */
async function escreverNoInventario({ token, dono, repo, ref, escola, transformar, mensagem, fetchImpl }) {
  const f = fetchImpl || fetch;
  const caminho = 'escola/' + escola + '/indice.json';
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho;
  const cab = cabecalhosDeEscrita(token);

  let ultimo = null;
  for (let intento = 1; intento <= 3; intento += 1) {
    // UMA leitura por tentativa, e o `sha` vem DELA: é o que a gravação tem de declarar, e
    // reler é o que torna a segunda tentativa possível quando a primeira perde a corrida.
    const base = await f(url + '?ref=' + encodeURIComponent(ref), { headers: cab });
    if (base.status === 404) {
      throw new Error('a escola ' + escola + ' não tem inventário (' + caminho + ') — sem ele não há onde escrever');
    }
    if (!base.ok) {
      // O MOTIVO VEM DO GITHUB, e não só o número (22/10/2026). O erro que gerou esta correção
      // dizia «HTTP 403» e nada mais; a resposta do GitHub diz «Request forbidden by
      // administrative rules», que aponta o defeito na hora. Um número sozinho obriga a adivinhar.
      ultimo = 'HTTP ' + base.status + (await recadoDaResposta(base));
      if (!CORRIDA_PERDIDA.has(base.status)) throw new Error('não li ' + caminho + ': ' + ultimo);
      await ESPERA_DO_INTENTO(intento);
      continue;
    }

    const dados = await base.json().catch(() => null);
    if (!dados) { ultimo = 'o JSON de ' + caminho + ' não abriu'; await ESPERA_DO_INTENTO(intento); continue; }
    const sha = dados.sha || null;
    const { texto, jaExistia } = transformar(decodificarBase64(dados.content || ''));
    if (jaExistia) return { ok: true, jaExistia: true, commit: null, intentos: intento };

    const bytes = new TextEncoder().encode(texto);
    let binario = '';
    for (const b of bytes) binario += String.fromCharCode(b);
    const res = await f(url, {
      method: 'PUT',
      headers: cab,
      body: JSON.stringify({
        message: mensagem,
        content: btoa(binario),
        branch: ref,
        ...(sha ? { sha } : {}),
      }),
    });
    const corpo = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, jaExistia: false, commit: corpo.commit && corpo.commit.sha, intentos: intento };

    ultimo = 'HTTP ' + res.status + ((corpo && corpo.message) ? ' — ' + corpo.message : '');
    if (!CORRIDA_PERDIDA.has(res.status)) {
      throw new Error('o GitHub recusou gravar em ' + caminho + ': ' + ultimo);
    }
    await ESPERA_DO_INTENTO(intento);
  }
  throw new Error('a escrita em ' + caminho + ' não entrou depois de 3 tentativas — o repositório '
    + 'está a receber escritas em cima das nossas: ' + ultimo);
}

async function registrarProfessorNaEscola({ token, dono, repo, ref, slug, professor, nome, quando, fetchImpl }) {
  return escreverNoInventario({
    token, dono, repo, ref, escola: slug, fetchImpl,
    mensagem: 'feat(escola): a escola ' + slug + ' declara o professor ' + professor,
    transformar: (texto) => comProfessor(texto, { escola: slug, professor, nome, quando }),
  });
}

/**
 * O NOME DO PROFESSOR VAI PARA O REPOSITÓRIO (22/10/2026) — é o que torna o «nome real» uma
 * coisa que o painel consegue mostrar.
 *
 * A Produção guarda o nome em dois lugares: no KV (`bastidores/<escola>/dono`, a sobreposição de
 * exibição que aquela escola lê) e, agora, no inventário. O KV não é fonte do acervo — o painel
 * lê o repositório, uma requisição só —, e era por isso que, ao editar o nome, a página da escola
 * mudava e a lista de professores continuava a mostrar o nome antigo. O inventário é a fonte.
 *
 * ELE ESCREVE NOS DOIS LUGARES ONDE O NOME PODE ESTAR: no responsável (`professor.nome`) e na
 * linha do vínculo (`professores[]`). Se o professor não estiver declarado em nenhum dos dois, a
 * linha entra — um professor com nome conhecido é melhor do que um vínculo implícito.
 */
function comNomeDoProfessor(indiceTexto, { escola, professor, nome, quando }) {
  let indice = null;
  try { indice = indiceTexto ? JSON.parse(indiceTexto) : null; } catch { indice = null; }
  if (!indice || typeof indice !== 'object') {
    throw new Error('o inventário da escola não é um objeto JSON legível — não se inventa um');
  }
  const slug = String(professor || '').trim();
  const limpo = String(nome || '').trim();
  if (!slug) throw new Error('sem o identificador do professor');
  if (!limpo) throw new Error('sem o nome a gravar');

  let mudou = false;
  let declarado = false;
  if (indice.professor && indice.professor.slug === slug) {
    declarado = true;
    if (indice.professor.nome !== limpo) { indice.professor.nome = limpo; mudou = true; }
  }
  const lista = Array.isArray(indice.professores) ? indice.professores : [];
  for (const p of lista) {
    if (!p || p.slug !== slug) continue;
    declarado = true;
    if (p.nome !== limpo) { p.nome = limpo; mudou = true; }
  }
  // QUEM NÃO ESTAVA DECLARADO ENTRA. Um professor com nome conhecido é melhor do que um vínculo
  // implícito: sem a linha, o painel teria de adivinhar quem ele é a partir dos ciclos.
  if (!declarado) {
    lista.push({ slug, nome: limpo, desde: quando || new Date().toISOString() });
    indice.professores = lista;
    mudou = true;
  }
  if (!mudou) return { texto: null, jaExistia: true };
  indice.escola = indice.escola || escola;
  return { texto: JSON.stringify(indice, null, 2) + '\n', jaExistia: false };
}

async function registrarNomeDoProfessor({ token, dono, repo, ref, escola, professor, nome, quando, fetchImpl }) {
  return escreverNoInventario({
    token, dono, repo, ref, escola, fetchImpl,
    mensagem: 'feat(escola): o professor ' + professor + ' passa a chamar-se «' + nome + '»',
    transformar: (texto) => comNomeDoProfessor(texto, { escola, professor, nome, quando }),
  });
}

/**
 * APAGAR UM PROFESSOR DO REPOSITÓRIO (22/10/2026) — só quando ele é LIVRE.
 *
 * O cadastro cria a pasta, os cinco schemas e o vínculo no inventário. Enquanto o professor não
 * tem trabalho, apagá-lo no KV deixava o repositório a guardar o esquema de quem já não existe:
 * a pasta `professores/<slug>/` continuava a ser um professor na lista do painel — que nasce da
 * pasta, de propósito — e a escola declarava no inventário uma pessoa que já não está lá.
 *
 * A GUARDA É DO REPOSITÓRIO, e não só do KV. `professorVinculadoA` responde pelo que está nos
 * planos de ensino; aqui responde-se pelo que está no disco, que é a prova mais forte: se a
 * pasta tem qualquer arquivo que NÃO seja um dos cinco schemas, houve trabalho ali (PO, plano,
 * aula, captura, pacote, `.conf`, `.fipp`) — e trabalho é proveniência. Aí não se apaga: diz-se
 * o que está lá. Só a estrutura sem uso é que sai.
 *
 * Sai tudo num commit só: os arquivos com `sha: null` sobre a `base_tree`, e o inventário da
 * escola reescrito sem a linha do vínculo. Um professor que não existe não deixa elo de expurgo
 * próprio — não é uma escola; o que fica é o histórico do Git.
 */
const SO_ESTRUTURA = /^professores\/[^/]+\/ciclos\/ciclo-[0-9]{2,}-(schema|po-schema|plano-schema|aula-schema|captura-schema)\.json$/;

function arquivosDeTrabalho(caminhos, professor) {
  const pasta = 'professores/' + professor + '/';
  return caminhos
    .filter((c) => c.indexOf(pasta) === 0)
    .filter((c) => !SO_ESTRUTURA.test(c))
    .sort();
}

/**
 * APAGAR É UMA ESCRITA COMO AS OUTRAS — e também pode perder a corrida. Aqui a corrida aparece
 * na última chamada: o `PATCH` da referência recusa um commit que não descende do `main` actual
 * (422, «not a fast forward»). Como o commit é montado a partir de uma `base_tree` lida antes,
 * a resposta certa é refazer o caminho inteiro — base nova, árvore nova, commit novo.
 */
async function apagarProfessorDoRepo({ token, dono, repo, ref, escola, professor, fetchImpl }) {
  let ultimo = null;
  for (let intento = 1; intento <= 3; intento += 1) {
    const r = await apagarProfessorDoRepoUmaVez({ token, dono, repo, ref, escola, professor, fetchImpl });
    if (r.ok || r.trabalho) return Object.assign(r, { intentos: intento });
    ultimo = r.motivo;
    if (!r.corrida) throw new Error(ultimo);
    await ESPERA_DO_INTENTO(intento);
  }
  throw new Error(ultimo || 'não consegui apagar o professor');
}

async function apagarProfessorDoRepoUmaVez({ token, dono, repo, ref, escola, professor, fetchImpl }) {
  const f = fetchImpl || fetch;
  const slug = String(professor || '').trim();
  if (!slug) throw new Error('sem o identificador do professor');
  const caminhos = await arvoreDeCaminhos({ token, dono, repo, ref, fetchImpl: f });
  const daPasta = caminhos.filter((c) => c.indexOf('professores/' + slug + '/') === 0);
  const trabalho = arquivosDeTrabalho(caminhos, slug);
  if (trabalho.length) {
    return {
      ok: false,
      apagados: [],
      trabalho,
      erro: 'a pasta do professor tem ' + trabalho.length + ' arquivo(s) de trabalho — '
        + 'proveniência não se apaga. Ficam: ' + trabalho.slice(0, 3).join(', ')
        + (trabalho.length > 3 ? '…' : ''),
    };
  }
  if (!daPasta.length) return { ok: true, apagados: [], jaNaoExistia: true, commit: null };

  const { commitSha, treeSha } = await baseDoGit({ token, dono, repo, ref, fetchImpl: f });
  const raizApi = 'https://api.github.com/repos/' + dono + '/' + repo;

  const tree = daPasta.map((path) => ({ path, mode: '100644', type: 'blob', sha: null }));

  // O INVENTÁRIO perde a linha do vínculo — e continua a declarar o responsável.
  const caminhoIndice = 'escola/' + escola + '/indice.json';
  const indiceAtual = await lerArquivo({ token, dono, repo, ref, caminho: caminhoIndice, fetchImpl: f });
  if (indiceAtual !== null) {
    const semOProfessor = comProfessorRemovido(indiceAtual, { professor: slug });
    if (semOProfessor !== null) {
      tree.push({ path: caminhoIndice, mode: '100644', type: 'blob', content: semOProfessor });
    }
  }

  const novaArvore = await pedir(f, raizApi + '/git/trees', token, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos(token)),
    body: JSON.stringify({ base_tree: treeSha, tree }),
  });
  if (!novaArvore.ok) {
    // 409 aqui é a `base_tree` que já não vale: alguém escreveu no `main` desde que a lemos.
    return { ok: false, corrida: novaArvore.status === 409, motivo: 'não montei a árvore da exclusão: HTTP ' + novaArvore.status };
  }

  const mensagem = [
    'chore(estrutura): apagar o professor ' + slug,
    '',
    'O professor não tinha trabalho nenhum — só a estrutura que o cadastro cria (os cinco',
    'schemas do ciclo) — e a escola já não o tem na lista. Sai a pasta inteira (' + daPasta.length
      + ' arquivo(s)) e sai a linha',
    'dele do inventário da escola: um professor que existe no repositório sem existir na escola',
    'é o mesmo fantasma que se está a eliminar, ao contrário.',
    '',
    'A ESCOLHA É DECLARADA: se houvesse um PO, um plano, uma aula, um pacote ou uma âncora na',
    'pasta, nada seria apagado — a proveniência acrescenta, não se apaga.',
    '',
    'Refs: professores/' + slug + '/, escola/' + escola + '/indice.json',
    'Regras: P-03, P-04, P-17',
    'Auditoria: apagados por ' + daPasta.length + ' arquivo(s), sem arquivo de trabalho na pasta',
  ].join('\n');

  const novoCommit = await pedir(f, raizApi + '/git/commits', token, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos(token)),
    body: JSON.stringify({ message: mensagem, tree: novaArvore.corpo.sha, parents: [commitSha] }),
  });
  if (!novoCommit.ok) {
    return { ok: false, corrida: novoCommit.status === 409, motivo: 'não criei o commit da exclusão: HTTP ' + novoCommit.status };
  }
  const sha = novoCommit.corpo && novoCommit.corpo.sha;
  const atualizar = await pedir(f, raizApi + '/git/refs/heads/' + ref, token, {
    method: 'PATCH',
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos(token)),
    body: JSON.stringify({ sha, force: false }),
  });
  if (!atualizar.ok) {
    // 422 aqui é «not a fast forward»: o `main` andou enquanto montávamos o commit.
    return {
      ok: false,
      corrida: atualizar.status === 422 || atualizar.status === 409,
      motivo: 'não avancei ' + ref + ' para o commit da exclusão: HTTP ' + atualizar.status,
    };
  }

  return { ok: true, apagados: daPasta, jaNaoExistia: false, commit: sha };
}

/**
 * O INVENTÁRIO SEM A LINHA DE UM PROFESSOR. Devolve `null` quando não havia o que tirar — o
 * inventário não se reescreve para dizer o mesmo.
 */
function comProfessorRemovido(indiceTexto, { professor }) {
  let indice = null;
  try { indice = indiceTexto ? JSON.parse(indiceTexto) : null; } catch { indice = null; }
  if (!indice || typeof indice !== 'object') return null;
  const lista = Array.isArray(indice.professores) ? indice.professores : [];
  const restantes = lista.filter((p) => !(p && p.slug === professor));
  if (restantes.length === lista.length) return null;
  if (restantes.length) indice.professores = restantes;
  else delete indice.professores;
  return JSON.stringify(indice, null, 2) + '\n';
}

/**
 * OS CICLOS DE UMA VARIANTE, em ordem crescente — lidos dos caminhos, não de um cadastro.
 *
 * NÃO HÁ REGISTO DE CICLOS no repositório (nem tabela, nem campo): um ciclo existe porque tem
 * ficheiros em `professores/<prof>/ciclos/ciclo-NN-<variante>…`. Contá-los pelos ficheiros é o
 * que mantém a regra alinhada com a realidade — um cadastro à parte divergiria no dia em que um
 * ficheiro fosse apagado à mão, e a guarda do `parentHash` passaria a proteger um ciclo que já
 * não existe.
 *
 * O PADRÃO É MAIS APERTADO DO QUE O DA ESCOLA, E A RAZÃO É MEDIDA. `ehArquivoDaEscola` aceita
 * traço depois do slug, porque para o expurgo da ESCOLA o que interessa é a família. Aqui não
 * serve: a variante `breu` casaria `ciclo-01-breu-bale-nivel-1-teste-3.md` — o ficheiro de
 * OUTRA variante —, e a exclusão apagaria o ciclo de um vizinho. Os seguidores legítimos são
 * três e só três: fim, ponto/barra (`.md`, `.conf`, `.fipp`, `/pacote/…`) e `-aula-NN` (a âncora
 * e a fonte da aula). Qualquer outro traço é o nome de outra coisa.
 */
function ciclosDaVariante(caminhos, professor, variante) {
  const pasta = 'professores/' + professor + '/ciclos/';
  const re = new RegExp('^' + pasta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    + 'ciclo-([0-9]{2})-' + String(variante).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    + '(?=$|[/.]|-aula-[0-9]{2}[./]|-aula-[0-9]{2}$)');
  const vistos = new Set();
  for (const c of (Array.isArray(caminhos) ? caminhos : [])) {
    const m = re.exec(c);
    if (m) vistos.add(m[1]);
  }
  return [...vistos].sort();
}

/**
 * APAGAR UM CICLO — o pacote gerado inteiro, e só ele (04/11/2026).
 *
 * O QUE É «UM CICLO», na definição da pesquisadora: «o ciclo não é apenas um arquivo isolado,
 * mas sim o pacote completo e integrado gerado a partir da conclusão do plano de observação» —
 * o menu, os planos, a área do professor, as aulas, os formulários, as fichas de captura, o PDF,
 * as referências e as listagens. É tudo o que está em `ciclo-NN-<variante>`: as fontes
 * derivadas, o `.conf`, o pacote e as âncoras.
 *
 * O QUE FICA: as FONTES DE ORIGEM. A anamnese é do sujeito e não do ciclo (decisão de
 * 04/11/2026), e o plano de ensino é uma declaração do professor — nenhum dos dois é «gerado».
 * Apagá-los junto seria confundir o produto com o que lhe deu origem.
 *
 * E O PLANO DE ENSINO FICA **LIVRE**, sem se lhe tocar: o vínculo PO ↔ PE é DERIVADO (o PO
 * declara o plano no nó `plano-de-ensino`; `poDoPlano` responde varrendo os POs). Apagados os
 * POs do ciclo, não há quem declare o plano, e ele volta a estar disponível — que é exactamente
 * o modelo da curadoria, invocado por ela: apagar o vínculo liberta o que estava preso, e não
 * reescreve o que ficou. Um campo «livre: sim» no plano seria uma SEGUNDA declaração do mesmo
 * facto, e a primeira gravação de um PO novo deixaria as duas a divergir.
 *
 * A GUARDA — SÓ O ÚLTIMO CICLO DA SEQUÊNCIA. O `parentHash` de um ciclo é o `hash` da âncora do
 * ANTERIOR (`tools/hash-ciclo.sh`, §4). Apagar o ciclo 01 quando existem 02 e 03 deixa o
 * `parentHash` do 02 a apontar para um hash que já não existe em sítio nenhum: a cadeia fica
 * partida, e nenhuma regeneração a remenda — o `--check` do 03 passaria a falhar para sempre, e
 * o elo perdido não se reconstitui (P-03). Apagar o ÚLTIMO não parte nada: o ciclo anterior
 * volta a ser o topo. A guarda é a mesma nos dois sentidos e não se contorna por parâmetro.
 */
async function apagarCicloDoRepo({ token, dono, repo, ref, escola, professor, variante, ciclo, fetchImpl, soOProduto }) {
  let ultimo = null;
  for (let intento = 1; intento <= 3; intento += 1) {
    const r = await apagarCicloDoRepoUmaVez({ token, dono, repo, ref, escola, professor, variante, ciclo, fetchImpl, soOProduto });
    if (r.ok) return Object.assign(r, { intentos: intento });
    ultimo = r.motivo || r.erro;
    if (!r.corrida) return Object.assign(r, { intentos: intento });
    await ESPERA_DO_INTENTO(intento);
  }
  return { ok: false, erro: ultimo, apagadoNoRepositorio: 'não entrou depois de 3 tentativas' };
}

/**
 * O `soOProduto` — QUEM É O DONO DOS ENVELOPES (05/11/2026).
 *
 * Esta rotina nasceu para a Produção, e ali ela apaga o ciclo INTEIRO: o produto gerado E os POs
 * do ciclo. Quando a mesma cascata passou a ser chamada pela listagem da Área do Professor, havia
 * dois escritores para o mesmo dado — o acervo (`porta.apagarEnvelope`, que também mantém o
 * `.indice.json`) e esta função, com a sua própria cópia da lógica do índice. Duas cópias divergem
 * no dia em que uma mudar, e o sintoma seria um envelope que existe no ficheiro e não no índice.
 *
 * Com `soOProduto`, esta função leva só o que é DERIVADO — o pacote, o `.conf` da variante e as
 * âncoras `.fipp` —, e os envelopes saem pelo acervo, que é quem sabe onde eles moram. A guarda do
 * último fica, e fica aqui, porque ela é sobre a CADEIA de âncoras, não sobre os envelopes.
 */
async function apagarCicloDoRepoUmaVez({ token, dono, repo, ref, escola, professor, variante, ciclo, fetchImpl, soOProduto }) {
  const f = fetchImpl || fetch;
  const slugProfessor = String(professor || '').trim();
  const var_ = String(variante || '').trim();
  const nn = String(ciclo || '').padStart(2, '0');
  if (!slugProfessor || !var_) throw new Error('informe o professor e a variante');
  if (!/^[0-9]{2}$/.test(nn)) throw new Error('o ciclo tem de ser dois dígitos');

  const caminhos = await arvoreDeCaminhos({ token, dono, repo, ref, fetchImpl: f });
  const ciclos = ciclosDaVariante(caminhos, slugProfessor, var_);
  if (ciclos.indexOf(nn) === -1) {
    return { ok: false, jaNaoExistia: true, erro: 'o ciclo ' + nn + ' de ' + var_ + ' não existe' };
  }

  /* A GUARDA, E O QUE ELA DIZ QUANDO RECUSA. Uma recusa sem nome do que a impede obriga a
   * adivinhar; o elo seguinte é a informação que resolve. */
  const posteriores = ciclos.filter((c) => c > nn);
  if (posteriores.length) {
    return {
      ok: false,
      guarda: 'ultimo',
      posteriores,
      erro: 'o ciclo ' + nn + ' não é o último da sequência — existem ' + posteriores.join(', ')
        + '. O parentHash de ' + posteriores[0] + ' aponta para a âncora deste, e apagá-lo '
        + 'partiria a cadeia sem remédio. Apague de trás para a frente: '
        + posteriores.slice().reverse().join(', ') + ' e depois ' + nn + '.',
    };
  }

  const daVariante = caminhos.filter((c) => ehArquivoDaEscola(c, var_, nn)
    && c.indexOf('professores/' + slugProfessor + '/ciclos/') === 0);
  if (!daVariante.length) {
    return { ok: false, jaNaoExistia: true, erro: 'o ciclo ' + nn + ' não tem ficheiros' };
  }

  /* O MANIFESTO BASE (`ciclos/ciclo-NN.conf`) é do PROFESSOR e serve todas as escolas dele
   * naquele ciclo: sai só quando não sobra variante nenhuma. A regra é a mesma de
   * `SO_MANIFESTO_BASE` no expurgo da escola, e a razão também: levar o manifesto de uma escola
   * que fica seria apagar a configuração de outra. */
  const outrasVariantes = ciclosDaVariante(
    caminhos.filter((c) => c.indexOf('ciclo-' + nn + '.' + 'conf') === -1),
    slugProfessor,
    var_.replace(/\..*$/, ''));
  const outrasDoCiclo = caminhos.some((c) => new RegExp('^professores/' + slugProfessor
    + '/ciclos/ciclo-' + nn + '-').test(c) && !ehArquivoDaEscola(c, var_, nn));
  const manifestoBase = 'professores/' + slugProfessor + '/ciclos/ciclo-' + nn + '.conf';
  const apagados = daVariante.slice();
  if (!outrasDoCiclo && caminhos.indexOf(manifestoBase) !== -1) apagados.push(manifestoBase);

  /* OS ENVELOPES DO CICLO — só os POs. A anamnese é do sujeito e o plano é a declaração que deu
   * origem ao ciclo; nenhum dos dois é produto dele. O filtro é pelo CONTEXTO do envelope
   * (escola + professor + ciclo), e não pelo nome: um `po-…json` sem contexto não se apaga às
   * cegas, porque não se pode provar de quem é. */
  const envelopesDoCiclo = [];
  let indiceDoAcervo = null;
  const caminhoIndice = 'escola/' + escola + '/envelopes/.indice.json';
  if (!soOProduto && escola && caminhos.indexOf(caminhoIndice) !== -1) {
    const lido = await lerArquivo({ token, dono, repo, ref, caminho: caminhoIndice, fetchImpl: f });
    let indice = null;
    try { indice = lido ? JSON.parse(lido) : null; } catch (erro) { indice = null; }
    const nomes = (indice && Array.isArray(indice.envelopes)) ? indice.envelopes
      : ((indice && Array.isArray(indice.nomes)) ? indice.nomes : []);
    for (const nome of nomes) {
      if (!/^po-.*\.json$/.test(String(nome))) continue;
      const caminho = 'escola/' + escola + '/envelopes/' + nome;
      if (caminhos.indexOf(caminho) === -1) continue;
      const texto = await lerArquivo({ token, dono, repo, ref, caminho, fetchImpl: f });
      let env = null;
      try { env = texto ? JSON.parse(texto) : null; } catch (erro) { env = null; }
      const ctx = (env && env.contexto) || {};
      const doCiclo = String(ctx.ciclo || '') === nn
        && String(ctx.professor || '') === slugProfessor
        && (!ctx.variante || String(ctx.variante) === var_);
      if (doCiclo) envelopesDoCiclo.push({ nome: String(nome), caminho });
    }
    if (envelopesDoCiclo.length) {
      const saida = JSON.parse(JSON.stringify(indice));
      const tirar = new Set(envelopesDoCiclo.map((e) => e.nome));
      if (Array.isArray(saida.envelopes)) saida.envelopes = saida.envelopes.filter((n) => !tirar.has(String(n)));
      if (Array.isArray(saida.nomes)) saida.nomes = saida.nomes.filter((n) => !tirar.has(String(n)));
      indiceDoAcervo = JSON.stringify(saida, null, 2) + '\n';
    }
  }

  const { commitSha, treeSha } = await baseDoGit({ token, dono, repo, ref, fetchImpl: f });
  const raizApi = 'https://api.github.com/repos/' + dono + '/' + repo;
  const tree = apagados.map((path) => ({ path, mode: '100644', type: 'blob', sha: null }));
  for (const e of envelopesDoCiclo) tree.push({ path: e.caminho, mode: '100644', type: 'blob', sha: null });
  if (indiceDoAcervo) tree.push({ path: caminhoIndice, mode: '100644', type: 'blob', content: indiceDoAcervo });

  const novaArvore = await pedir(f, raizApi + '/git/trees', token, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos(token)),
    body: JSON.stringify({ base_tree: treeSha, tree }),
  });
  if (!novaArvore.ok) {
    return { ok: false, corrida: novaArvore.status === 409, motivo: 'não montei a árvore do ciclo: HTTP ' + novaArvore.status };
  }

  const mensagem = [
    'chore(estrutura): apagar o ciclo ' + nn + ' de ' + var_,
    '',
    'O ciclo gerado sai inteiro: as fontes derivadas, o .conf da variante, o pacote, as âncoras',
    (soOProduto
      ? 'e — pelo acervo, não por aqui — os POs do ciclo. É o «pacote completo e integrado» na'
      : 'e os POs do ciclo (' + envelopesDoCiclo.length + ' envelope(s)). É o «pacote completo e integrado» na'),
    'definição dela — menu, planos, aulas, formulários, fichas, PDF, referências e listagens.',
    '',
    'O QUE FICA, E PORQUÊ: a anamnese é do SUJEITO e não do ciclo (04/11/2026), e o plano de',
    'ensino é a declaração que deu origem ao ciclo — nenhum dos dois é produto dele. O plano',
    'fica LIVRE sem se lhe tocar: o vínculo PO ↔ PE é derivado, e apagados os POs não há quem o',
    'declare. É o modelo da curadoria: apagar o vínculo liberta o que estava preso.',
    '',
    'A GUARDA: só o último ciclo da sequência. O parentHash do seguinte aponta para a âncora',
    'deste, e apagá-lo partiria a cadeia sem remédio (P-03). Aqui não havia posteriores.',
    '',
    'Refs: professores/' + slugProfessor + '/ciclos/ciclo-' + nn + '-' + var_ + '*, escola/' + escola + '/envelopes/',
    'Regras: P-03, P-04, P-17',
    'Auditoria: apagados ' + (apagados.length + envelopesDoCiclo.length) + ' arquivo(s); 3 tentativas; '
      + 'fontes de origem preservadas',
  ].join('\n');

  const novoCommit = await pedir(f, raizApi + '/git/commits', token, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos(token)),
    body: JSON.stringify({ message: mensagem, tree: novaArvore.corpo.sha, parents: [commitSha] }),
  });
  if (!novoCommit.ok) {
    return { ok: false, corrida: novoCommit.status === 409, motivo: 'não criei o commit do ciclo: HTTP ' + novoCommit.status };
  }
  const sha = novoCommit.corpo && novoCommit.corpo.sha;
  const atualizar = await pedir(f, raizApi + '/git/refs/heads/' + ref, token, {
    method: 'PATCH',
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos(token)),
    body: JSON.stringify({ sha, force: false }),
  });
  if (!atualizar.ok) {
    return {
      ok: false,
      corrida: atualizar.status === 422 || atualizar.status === 409,
      motivo: 'não avancei ' + ref + ' para o commit do ciclo: HTTP ' + atualizar.status,
    };
  }
  return {
    ok: true,
    commit: sha,
    apagados,
    envelopes: envelopesDoCiclo.map((e) => e.nome),
    planoLibertado: true,
    variantesRestantes: outrasDoCiclo,
  };
}

module.exports = {
  ciclosDaVariante,
  apagarCicloDoRepo,
  registrarNomeDoProfessor,
  comNomeDoProfessor,
  apagarProfessorDoRepo,
  arquivosDeTrabalho,
  comProfessorRemovido,
  comProfessor,
  registrarProfessorNaEscola,
  listarEscolas,
  listarEscolasPeloIndice,
  listarProfessoresPeloIndice,
  atualizarIndiceDaEscola,
  pendenciaDoKv,
  comResolucaoDoKv,
  listarProfessores,
  apagarEscolaDoRepo,
  escolaDosCaminhos,
  escolasDosCaminhos,
  professoresDosCaminhos,
  ehArquivoDaEscola,
  ehAcervoDaEscola,
  ehPerfilDoProfessor,
  semPerfisNaLista,
  ehAnamneseDaEscola,
  manifestoBaseDoCiclo,
  materialPreservado,
  classificarPreservados,
  comElo,
  arvoreDeCaminhos,
  lerArquivo,
  NAO_ESCOLAS,
};
