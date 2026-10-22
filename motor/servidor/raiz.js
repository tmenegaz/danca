'use strict';

/**
 * raiz.js — o Worker RAIZ do sistema (`danca.tmenegaz77.workers.dev`).
 *
 * É a porta de entrada do sistema, NÃO uma escola: serve a apresentação «Sistema Lastro» + o
 * botão «Criar nova escola», e NADA mais. Todo acesso é atrás de senha — a `SENHA_RAIZ`
 * (secret do Worker, vinda de `tools/.senhas-locais` na hora do deploy), porque criar uma
 * escola é privilégio da pesquisadora. Aqui não há «Área do Professor»: isso é do pacote
 * de cada escola, não da raiz.
 *
 * O «Criar nova escola» chama `provisionar-escola.js`, que cria o Worker e o subdomínio
 * da escola no Cloudflare e devolve o URL. A raiz só decide; não cria conteúdo pedagógico.
 */

const { criarEscola, dispararCriacao, slugificar, desfazerPlaceholder } = require('./provisionar-escola.js');
const { excluirEscola, apagarChavesDeEscola, prefixosDaEscola } = require('./expurgar-escola.js');
const {
  listarEscolas, listarEscolasPeloIndice, listarProfessores, listarProfessoresPeloIndice,
  apagarEscolaDoRepo, lerArquivo,
  pendenciaDoKv, comResolucaoDoKv, atualizarIndiceDaEscola,
} = require('./repo-escola.js');
const painel = require('./painel-html.js');

const ACCOUNT_ID = '2628f36f9f72bd539b417dcb173d1f12';
const DONO = 'tmenegaz';
const REPO = 'danca';
const REF = 'main';

// O prazo de expurgo: quanto tempo uma escola desabilitada tem antes de ser apagada.
// TESTE = 3 minutos (o §17.5); a produção vai a 3 meses — esta constante é o único
// ponto a trocar. Enquanto for andaime, a data de desabilitação (`desde`) é escrita à
// mão pela pesquisadora no fixture; na Produção, o próprio servidor a grava ao desligar.
const PRAZO_EXPURGO_MS = 3 * 60 * 1000;

/** O freio da raiz: sem a senha, nada se vê (nem a página, nem a rota de criar). */
function autorizado(request, env) {
  const senha = env && env.SENHA_RAIZ;
  if (!senha) return false;
  const esperado = 'Basic ' + btoa('tmenegaz:' + senha);
  return request.headers.get('Authorization') === esperado;
}

/**
 * Lê o ANDAIME `escolas-habilitadas.json` do ASSETS da raiz (`raiz/`). É o que o §17.5
 * chama de fixture: `{ escola: { habilitada, desde?, pagante?, kv? } }`. A pesquisadora o
 * edita à mão e reimplanta a raiz para testar. Sem ASSETS (ou arquivo ilegível), devolve
 * `{}` — o hook não inventa escola a expurgar.
 */
async function lerEscolasHabilitadas(env) {
  if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') return {};
  try {
    const req = new Request(new URL('/escolas-habilitadas.json', 'https://danca.internal'));
    const res = await env.ASSETS.fetch(req);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

/** Resposta JSON curta — a raiz responde em JSON a tudo que é rota. */
function responderJson(objeto, status) {
  return new Response(JSON.stringify(objeto), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
  });
}

/**
 * AS ESCOLAS DO SISTEMA — lidas do ÍNDICE VERSIONADO, numa requisição.
 *
 * O acervo inteiro (`lerComCache`) custa uma árvore + um `contents/` por escola: doze requisições
 * para desenhar uma lista. Medido nesta página, era isso que a fazia «demorar a carregar».
 *
 * `indices/acervo.json` é DERIVADO e versionado, e o `regerar-indices.yml` refaz e commita a cada
 * push que toque as fontes (expurgo, cadastro de professor, plano, PO, âncora). Ele já traz, por
 * escola, `criada_em`, `expurgada` e `expurgada_em`. Uma requisição, e o dado é o mesmo que a
 * derivação produz — não uma segunda opinião.
 */
async function acervoDoIndice({ token }) {
  const texto = await lerArquivo({
    token, dono: DONO, repo: REPO, ref: REF, caminho: 'indices/acervo.json',
  });
  if (!texto) throw new Error('indices/acervo.json não existe no repositório');
  let acervo;
  try { acervo = JSON.parse(texto); } catch { throw new Error('indices/acervo.json não é JSON válido'); }
  if (!acervo || !Array.isArray(acervo.escolas)) {
    throw new Error('o índice do acervo não trouxe a lista de escolas');
  }
  return acervo;
}

/** As escolas, já normalizadas para a tela — o recorte do acervo que as listas usam. */
async function escolasDoIndice({ token }) {
  const acervo = await acervoDoIndice({ token });
  return acervo.escolas.map((e) => ({
    slug: e.slug,
    nome: e.nome || e.slug,
    professor: e.professor || null,
    // TODOS os professores que o elo do expurgo prova — não só o que ficou gravado no
    // inventário. Numa escola apagada, os ciclos já não existem: é o elo que testemunha.
    professores: Array.isArray(e.professores) ? e.professores : [],
    criada_em: e.criada_em || null,
    expurgada_em: e.expurgada_em || null,
    expurgada: e.expurgada === true,
    expurgos: e.expurgos || 0,
  }));
}

/**
 * O ELO DE UMA ESCOLA — uma leitura, e só quando alguém abre o registo.
 *
 * O slug é validado ANTES de virar caminho: ele entra numa URL e num `contents/` do GitHub, e um
 * slug com `/` ou `..` leria outro arquivo. A forma vem da mesma regra dos slugs de escola em
 * todo o repositório (`[a-z0-9-]`), e o roteador já a aplica — esta é a segunda barreira.
 */
async function eloDaEscola({ token, slug }) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(String(slug || ''))) return null;
  const texto = await lerArquivo({
    token, dono: DONO, repo: REPO, ref: REF, caminho: 'escola/' + slug + '/indice.json',
  });
  if (!texto) return null;
  try { return JSON.parse(texto); } catch { return null; }
}

/** A página de recusa quando falta o `GITHUB_TOKEN` — dita, não disfarçada de lista vazia. */
function paginaSemToken() {
  return painel.pagina({
    titulo: 'Painel',
    subtitulo: 'A gestão do sistema.',
    atual: 'painel',
    corpo: '<div class="caixa falta">' +
      '<h2>O painel não consegue ler o repositório</h2>' +
      '<p>Falta o <code>GITHUB_TOKEN</code> no Worker da raiz. Sem ele não há índice do acervo — ' +
      'e uma lista vazia aqui diria «nenhuma escola apagada», que seria falso.</p>' +
      '</div>',
  });
}

/**
 * O QUE UM PEDIDO DE «CRIAR ESCOLA» PRECISA TER — e por que isto é uma FUNÇÃO.
 *
 * Aqui havia uma linha só:
 *
 *     if (!nome || !senhaAdmin || !professorNome || !senhaProfessor) → 400
 *
 * Ela estava ERRADA, e a dona do produto levou o erro em 15/10/2026. O formulário oferece DOIS
 * caminhos para o professor — criar um NOVO (nome + sobrenome) ou REUTILIZAR um que já tem
 * pasta —, e a linha exigia o nome nos DOIS. Escolher o professor que já existe e deixar o nome
 * em branco (como o próprio formulário manda, e como ele desabilita o campo) devolvia:
 *
 *     informe o nome da escola, a senha do administrador, o nome e a senha do professor
 *
 * …uma mensagem que **contradizia o formulário** e não dizia QUAL campo faltava: ela recitava os
 * quatro, e quem tinha preenchido três não sabia qual era o quarto. Agora a validação é POR
 * CAMINHO e nomeia o campo que falta, um por vez.
 *
 * A UNICIDADE DO SLUG NÃO MORA AQUI: ela precisa do repositório (`listarProfessores`) para saber
 * o que já existe. Esta função é só a FORMA do pedido — sem I/O, e por isso provável sozinha.
 */
function validarCriacaoEscola(corpo) {
  const p = corpo || {};
  const campos = {
    nome: String(p.nome || '').trim(),
    senhaAdmin: String(p.senhaAdmin || p['senha-admin'] || ''),
    professorNome: String(p.professorNome || p['professor-nome'] || '').trim(),
    professorSobrenome: String(p.professorSobrenome || p['professor-sobrenome'] || '').trim(),
    professorExistente: String(p.professorExistente || p['professor-existente'] || '').trim(),
    senhaProfessor: String(p.senhaProfessor || p['senha-professor'] || ''),
  };

  // O que vale nos DOIS caminhos.
  if (!campos.nome) return { ok: false, status: 400, erro: 'informe o nome da escola' };
  if (!campos.senhaAdmin) {
    return { ok: false, status: 400, erro: 'informe a senha do administrador (a direção da escola)' };
  }
  if (!campos.senhaProfessor) return { ok: false, status: 400, erro: 'informe a senha do professor' };

  // O REÚSO TEM PRECEDÊNCIA: se veio um professor escolhido da lista, é ele. O nome em branco
  // é o certo aqui, não um campo esquecido — e exigir o nome deste lado era o defeito.
  if (campos.professorExistente) return { ok: true, modo: 'existente', campos };
  if (!campos.professorNome) {
    return { ok: false, status: 400, erro: 'informe o nome do professor — ou escolha um professor que já existe' };
  }
  return { ok: true, modo: 'novo', campos };
}

/**
 * `tiago-menegaz` → `Tiago Menegaz`. O nome de exibição quando o sistema NÃO tem o nome dele.
 *
 * `listarProfessores` colhe o nome do `indice.json` das escolas do professor — e um professor
 * que ainda não tem escola nenhuma (o diretório-modelo `tiago`) não tem índice: vem `nome: null`.
 * No reúso, cair para `''` era GRAVE, por dois motivos que só aparecem quando acontecem:
 *
 *   1. `criarEscola` só grava o secret `PROFESSOR_NOME` **quando o nome vem preenchido**. Sem
 *      esse secret, o slug do dono é `slugificar('')` = `''` — a escola nasce **sem dono capaz
 *      de entrar**, e o portão da Produção não reconhece ninguém;
 *   2. o workflow `criar-escola.yml` declara `professor-nome` e `responsavel` como
 *      `required: true` — vazios, o disparo volta 422 e o motor completo não sobe.
 *
 * O nome que volta do slug é o mesmo que o gerou (o slug SAI do nome), e para `tiago` dá
 * exatamente `Tiago`. Não é invenção: é a volta de uma ida.
 */
function tituloDoSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

/**
 * Lê JSON COM COMENTÁRIOS — os `wrangler.<escola>.jsonc` são jsonc, e `JSON.parse` recusa
 * `//`. O corte respeita as strings: `"https://…"` continua inteiro. Devolve `null` se,
 * mesmo limpo, o texto não for JSON — quem chama trata como «não sei ler» e não inventa.
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

/**
 * O nome do script/subdomínio e o KV desta escola, lidos do PRÓPRIO `wrangler.<slug>.jsonc`.
 * É por isso que a raiz não precisa de uma tabela à parte: o arquivo que identifica a escola
 * diz também onde ela vive no Cloudflare e qual namespace limpar. Sem o arquivo (ou ilegível),
 * devolve `null` — e o expurgo cai no slug e não limpa KV nenhum, em vez de chutar um namespace
 * compartilhado (o KV é de todas as escolas; apagar o errado apaga o alheio).
 */
async function moradaDaEscola({ token, slug, fetchImpl }) {
  const caminho = 'wrangler.' + slug + '.jsonc';
  const texto = await lerArquivo({ token, dono: DONO, repo: REPO, ref: REF, caminho, fetchImpl });
  if (!texto) return null;
  const cfg = lerJsonc(texto);
  if (!cfg) return { worker: slug, kvNamespaceId: null, arquivo: caminho, legivel: false };
  const kv = (cfg.kv_namespaces && cfg.kv_namespaces[0]) || null;
  return {
    worker: cfg.name || slug,
    kvNamespaceId: kv && kv.id ? kv.id : null,
    arquivo: caminho,
    legivel: true,
  };
}

/**
 * O EXPURGO (§17.5): percorre o andaime e apaga cada escola que esteja desabilitada com o
 * prazo vencido. A ordem de verificação é a norma: (1) desabilitada? (2) não está a pagar?
 * (3) o `desde` existe? (4) o prazo venceu? — só então apaga. Devolve o relatório completo
 * (`expurgadas`/`puladas`/`semToken`), para o Cron logar e a rota manual responder.
 */
async function expurgar(env) {
  const token = env && env.CLOUDFLARE_API_TOKEN;
  const escolas = await lerEscolasHabilitadas(env);
  const agora = Date.now();
  const relatorio = {
    agora: new Date(agora).toISOString(),
    expurgadas: [],
    puladas: [],
    semToken: !token,
  };
  if (!token) return relatorio;

  for (const [slug, reg] of Object.entries(escolas || {})) {
    if (!reg || reg.habilitada !== false) continue;
    if (reg.pagante === true) {
      relatorio.puladas.push({ slug, motivo: 'escola pagante — não se apaga' });
      continue;
    }
    const desde = reg.desde ? new Date(reg.desde).getTime() : NaN;
    if (!Number.isFinite(desde)) {
      relatorio.puladas.push({ slug, motivo: 'desde ausente ou inválido' });
      continue;
    }
    if (agora - desde < PRAZO_EXPURGO_MS) {
      relatorio.puladas.push({ slug, motivo: 'prazo ainda não vencido', restanteMs: PRAZO_EXPURGO_MS - (agora - desde) });
      continue;
    }
    relatorio.expurgadas.push(await excluirEscola({ token, accountId: ACCOUNT_ID, slug, worker: reg.worker, kv: reg.kv }));
  }
  return relatorio;
}

/** O handler do Cron Trigger: apaga sem ninguém clicar, e loga o relatório. */
async function scheduled(event, env, ctx) {
  const relatorio = await expurgar(env);
  console.log('[expurgo] ' + JSON.stringify(relatorio));
}

async function fetch(request, env) {
  const url = new URL(request.url);

  // A SAÚDE da raiz: identifica o Worker sem autenticação — o que revela é
  // público (o subdomínio já diz que é a raiz). Serve para conferir, com um
  // `curl`, que a ponte certa está no Worker `danca` depois de um deploy. Se a
  // ponte de escola (producao.js) tiver sido implantada na raiz por engano, é
  // o `/api/saude` DELA que responde — e a divergência aparece na hora.
  if (url.pathname === '/api/saude') {
    return new Response(JSON.stringify({ ok: true, tipo: 'raiz' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
    });
  }

  if (!autorizado(request, env)) {
    return new Response('autenticação necessária', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="danca", charset="UTF-8"',
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });
  }

  // ── O PAINEL (22/10/2026) ─────────────────────────────────────────────────────────────────
  //
  // A raiz `danca` É o painel. Não há página-índice de secções e não há botão «Painel»: a
  // dona do produto contou os cliques — botão → índice de secções → «Abrir» → lista. A lista
  // vem na própria página `/`, abaixo dos dois botões que já existiam, e o menu tem a
  // logomarca e «Escolas apagadas».
  //
  // OS DADOS SÃO DO ÍNDICE VERSIONADO, numa requisição (`escolasDoIndice`). O registo é a
  // leitura do elo daquela escola — outro arquivo, outra requisição. Nada se gera por visita.
  //
  // AS ROTAS ANTIGAS CONTINUAM A RESPONDER (301). `/painel` esteve no ar por algumas horas e o
  // registo de uma escola é um endereço que se guarda e se cita — um link morto num documento
  // de proveniência é pior do que uma página a mais.
  const mApagadas = /^\/painel\/escolas-apagadas\/([a-z0-9-]+)$/.exec(url.pathname);
  if (mApagadas) {
    return new Response(null, {
      status: 301,
      headers: { Location: '/escolas-apagadas/' + mApagadas[1] },
    });
  }
  if (url.pathname === '/painel' || url.pathname === '/painel/escolas-apagadas') {
    return new Response(null, {
      status: 301,
      headers: { Location: url.pathname === '/painel' ? '/' : '/escolas-apagadas' },
    });
  }

  // A LISTA DOS PROFESSORES — a terceira, e a que atende «um professor, várias escolas».
  if (url.pathname === '/professores') {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return painel.resposta(painel.paginaSemToken(), 500);
    try {
      // UMA leitura do acervo, e dele saem as duas partes: a lista de professores (que o índice
      // deriva das escolas e dos ciclos) e as escolas, para saber quais estão vivas.
      const acervo = await acervoDoIndice({ token });
      return painel.resposta(painel.paginaDosProfessores({
        professores: acervo.professores || [],
        escolas: acervo.escolas || [],
      }));
    } catch (err) {
      return painel.resposta(painel.paginaSemToken(
        'não foi possível ler o índice: ' + ((err && err.message) || String(err))), 500);
    }
  }

  // AS DUAS LISTAS — «só as apagadas» e «só as vivas». A mesma leitura (uma requisição), o
  // mesmo recorte; quem filtra é a apresentação, porque o índice é a memória inteira e a lista é
  // escolha.
  if (url.pathname === '/escolas-apagadas' || url.pathname === '/escolas-vivas') {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return painel.resposta(painel.paginaSemToken(), 500);
    const apagadas = url.pathname === '/escolas-apagadas';
    try {
      const escolas = await escolasDoIndice({ token });
      return painel.resposta(apagadas
        ? painel.paginaDasApagadas({ escolas })
        : painel.paginaDasVivas({ escolas }));
    } catch (err) {
      return painel.resposta(painel.paginaSemToken(
        'não foi possível ler o índice: ' + ((err && err.message) || String(err))), 500);
    }
  }

  const mRegistro = /^\/escolas-apagadas\/([a-z0-9-]+)$/.exec(url.pathname);
  if (mRegistro) {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return painel.resposta(painel.paginaSemToken(), 500);
    const slug = mRegistro[1];
    try {
      const indice = await eloDaEscola({ token, slug });
      // SEM ELO, SEM REGISTO. Uma página de «registo» para uma escola que nunca existiu é pior
      // do que um 404 — e o 404 custa UMA requisição, não a construção do acervo inteiro.
      if (!indice) return painel.resposta(painel.paginaDasApagadas({ escolas: [] }), 404);
      return painel.resposta(painel.paginaDoRegistro({ slug, indice }));
    } catch (err) {
      return painel.resposta(painel.paginaSemToken(
        'não foi possível ler o registo de ' + slug + ': ' + ((err && err.message) || String(err))), 500);
    }
  }

  // O gatilho MANUAL do expurgo — a mesma função do Cron, mas chamável agora, atrás da
  // senha. Serve para testar sem esperar o Cron e para auditar: o que o Cron apagaria é
  // exatamente o que esta rota devolve.
  if (url.pathname === '/api/expurgar' && request.method === 'POST') {
    if (!env || !env.CLOUDFLARE_API_TOKEN) {
      return new Response(JSON.stringify({ ok: false, erro: 'CLOUDFLARE_API_TOKEN ausente no Worker' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    }
    try {
      const relatorio = await expurgar(env);
      return new Response(JSON.stringify({ ok: true, ...relatorio }), {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, erro: (err && err.message) || String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    }
  }

  // OS PROFESSORES que já existem — o que impede duas pessoas de caírem na mesma pasta.
  // A lista sai do repositório (os diretórios `professores/<slug>/`), porque é lá que o nome
  // vira identidade: `professores/<slug>/` guarda o pacote, os cadernos e as âncoras, e é o
  // diretório que o PO e o plano usam. Duas pessoas com o mesmo slug — ou dois nomes que
  // produzem o mesmo slug — passam a ser uma só no registro.
  if (url.pathname === '/api/professores' && request.method === 'GET') {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return responderJson({ ok: false, erro: 'GITHUB_TOKEN ausente no Worker' }, 500);
    try {
      // PELO ÍNDICE — a lista de professores era a varredura mais cara da raiz: a árvore inteira
      // mais uma leitura do inventário de cada escola do professor, a cada abertura da página.
      const r = await listarProfessoresPeloIndice({
        token, dono: DONO, repo: REPO, ref: REF,
        kv: env && env.PADD_KV,
        reconstruir: url.searchParams.get('reconstruir') === '1',
      });
      return responderJson({
        ok: true,
        fonte: r.doIndice ? (r.doCache ? 'indice-cache' : 'indice') : 'arvore',
        custo: r.custo,
        professores: r.professores,
      });
    } catch (err) {
      return responderJson({ ok: false, erro: (err && err.message) || String(err) }, 500);
    }
  }

  // A LISTA de escolas — what the «Apagar escola» button shows before anything is deleted.
  // Sai do repositório (os `wrangler.<slug>.jsonc`), que é o mesmo registro que o expurgo
  // edita: uma só definição de «escola», a que sobrevive ao expurgo como elo no índice.
  //
  // PELO ÍNDICE, E SÓ PELA ÁRVORE SE ELE NÃO HOUVER (20/10/2026). A página da raiz pede esta
  // lista a cada abertura; a varredura custava uma leitura da árvore do repositório por pedido.
  // O índice responde com uma leitura do KV — e é derivado, portanto perdê-lo custa uma
  // reconstrução, não um dado.
  if (url.pathname === '/api/escolas' && request.method === 'GET') {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return responderJson({ ok: false, erro: 'GITHUB_TOKEN ausente no Worker' }, 500);
    try {
      const r = await listarEscolasPeloIndice({
        token, dono: DONO, repo: REPO, ref: REF,
        kv: env && env.PADD_KV,
        reconstruir: url.searchParams.get('reconstruir') === '1',
      });
      return responderJson({
        ok: true,
        fonte: r.doIndice ? (r.doCache ? 'indice-cache' : 'indice') : 'arvore',
        custo: r.custo,
        escolas: r.escolas.map((e) => ({
          slug: e.slug,
          professor: e.professor,
          ciclo: e.ciclo,
          total: e.total,
          url: 'https://' + e.slug + '.tmenegaz77.workers.dev/',
        })),
      });
    } catch (err) {
      return responderJson({ ok: false, erro: (err && err.message) || String(err) }, 500);
    }
  }

  // O EXPURGO À MÃO — o que o botão «Apagar escola» chama. Não passa pelo andaime
  // (`escolas-habilitadas.json` + prazo): aquilo é a varredura agendada, que apaga sozinha
  // depois de um prazo de carência. Aqui a pesquisadora escolheu a escola na lista e
  // confirmou — não há prazo a esperar.
  //
  // A ORDEM importa: o Cloudflare PRIMEIRO. Ao contrário, a escola ficaria no ar servindo um
  // pacote que o repositório já não tem. Depois o repositório, que é onde o expurgo deixa o
  // elo — a prova de que a escola existiu. As duas metades são independentes: a falha de uma
  // vai no relatório da sua etapa e não impede a outra.
  if (url.pathname === '/api/apagar-escola' && request.method === 'POST') {
    let corpo;
    try { corpo = await request.json(); } catch { corpo = null; }
    const slug = String((corpo && corpo.escola) || '').trim();
    const confirmacao = String((corpo && corpo.confirmacao) || '').trim();
    const motivo = String((corpo && corpo.motivo) || '').trim() || 'expurgada pela raiz';
    if (!slug) return responderJson({ ok: false, erro: 'informe a escola' }, 400);
    if (confirmacao !== slug) {
      return responderJson({ ok: false, erro: 'a confirmação não é o slug da escola — nada foi apagado' }, 400);
    }

    const cfToken = env && env.CLOUDFLARE_API_TOKEN;
    const ghToken = env && env.GITHUB_TOKEN;
    const relatorio = { escola: slug, motivo, cloudflare: null, repositorio: null };

    // 1. SEM OS DOIS TOKENS NÃO SE COMEÇA. Meio expurgo é pior que nenhum: é a escola fora do
    // ar com o dado dela no sistema.
    const faltando = [];
    if (!cfToken) faltando.push('CLOUDFLARE_API_TOKEN');
    if (!ghToken) faltando.push('GITHUB_TOKEN');
    if (faltando.length) {
      relatorio.cloudflare = cfToken ? null : { erro: 'CLOUDFLARE_API_TOKEN ausente no Worker' };
      relatorio.repositorio = ghToken ? null : { erro: 'GITHUB_TOKEN ausente no Worker' };
      return responderJson(Object.assign(relatorio, { ok: false, faltando, noRepositorio: false, noCloudflare: false }), 500);
    }

    // 2. ONDE A ESCOLA VIVE, antes de apagar qualquer coisa. O `wrangler.<slug>.jsonc` diz o
    // nome do script e o namespace do KV; sem ele não se limpa o KV — e apagar o Worker
    // deixando o dado é o pior dos mundos. Não se começa o que não se termina. (Se o config
    // não existir mesmo, a escola não está no registro e não há o que expurgar.)
    let morada = null;
    try {
      morada = await moradaDaEscola({ token: ghToken, slug });
    } catch (err) {
      return responderJson(Object.assign(relatorio, {
        ok: false,
        erro: 'não consegui ler wrangler.' + slug + '.jsonc: ' + ((err && err.message) || String(err)) + ' — nada foi apagado',
        noRepositorio: false,
        noCloudflare: false,
      }), 500);
    }
    if (!morada) {
      return responderJson(Object.assign(relatorio, {
        ok: false,
        erro: 'não há wrangler.' + slug + '.jsonc no repositório — não sei onde esta escola vive: nada foi apagado',
        noRepositorio: false,
        noCloudflare: false,
      }), 500);
    }
    if (!morada.legivel) {
      return responderJson(Object.assign(relatorio, {
        ok: false,
        erro: 'não consegui entender wrangler.' + slug + '.jsonc — não sei onde esta escola vive: nada foi apagado',
        morada,
        noRepositorio: false,
        noCloudflare: false,
      }), 500);
    }

    // 3. O CLOUDFLARE PRIMEIRO. Ao contrário, a escola ficaria no ar servindo um pacote que o
    // repositório já não tem. O KV é limpo pelos prefixos da ESCOLA (`<slug>/` e
    // `bastidores/<slug>/`) — a regra mora em `prefixosDaEscola`, para o Cron do andaime e
    // esta rota limparem a mesma coisa. `namespaceId: null` (config lido, sem bloco de KV) é
    // «não havia o que limpar»; ausência de namespace seria «não sei onde vive», e aí já não
    // se teria chegado aqui.
    try {
      relatorio.cloudflare = await excluirEscola({
        token: cfToken,
        accountId: ACCOUNT_ID,
        slug,
        worker: morada.worker || slug,
        kv: {
          namespaceId: morada.kvNamespaceId || null,
          prefixos: prefixosDaEscola(slug),
        },
      });
      relatorio.cloudflare.morada = morada;
    } catch (err) {
      relatorio.cloudflare = { erro: (err && err.message) || String(err), morada };
    }

    // 4. O REPOSITÓRIO. O desfecho do KV vai JUNTO: se a limpeza das chaves não se completou,
    // a pendência fica gravada no elo do expurgo — e é de lá que a retomada a lê, quando a
    // escola já não existe em lugar nenhum (`wrangler.<slug>.jsonc` sai neste mesmo commit).
    const kvDoExpurgo = relatorio.cloudflare && relatorio.cloudflare.kv;
    try {
      relatorio.repositorio = await apagarEscolaDoRepo({
        token: ghToken, dono: DONO, repo: REPO, ref: REF, slug, confirmacao, motivo,
        kv: kvDoExpurgo ? {
          ok: kvDoExpurgo.ok === true,
          apagadas: kvDoExpurgo.apagadas,
          restantes: kvDoExpurgo.restantes,
          namespaceId: (morada.kvNamespaceId || null),
          prefixos: prefixosDaEscola(slug),
        } : null,
      });
    } catch (err) {
      relatorio.repositorio = { erro: (err && err.message) || String(err) };
    }

    const noRepositorio = Boolean(relatorio.repositorio && relatorio.repositorio.ok);
    const noCloudflare = Boolean(
      relatorio.cloudflare && relatorio.cloudflare.script && relatorio.cloudflare.script.ok
    );
    // O KV entra na CONTA: uma escola que sai do ar e do registro, mas deixa o dado dela no
    // sistema, NÃO foi expurgada — e a manchete da página não pode dizer que foi. Sem isto,
    // o relatório dava verde e a linha do KV, em vermelho, logo abaixo: a contradição que o
    // dono do produto acabou de encontrar.
    const kvFalhou = Boolean(relatorio.cloudflare && relatorio.cloudflare.kv && relatorio.cloudflare.kv.ok === false);
    const ok = noRepositorio && !kvFalhou;
    return responderJson(
      Object.assign(relatorio, { ok, noRepositorio, noCloudflare, kvFalhou }),
      ok ? 200 : 500
    );
  }

  // ---------------------------------------------------------------------------
  // A RETOMADA DA LIMPEZA DO KV. O expurgo tem duas metades — o Cloudflare (subdomínio,
  // Worker, chaves) e o repositório — e elas podem separar-se: em 19/10/2026 a cota diária
  // do `kv.list` acabou a meio, e a escola `calango` saiu do ar e do registro deixando o
  // dado no KV. Sem esta rota, a pendência era irrecuperável: a escola já não existe em
  // lugar nenhum de onde se possa deduzir o namespace (o `wrangler.<slug>.jsonc` foi
  // apagado no mesmo commit). Com ela, a limpeza é retomada a partir do ELO — o índice da
  // escola, que o expurgo preserva de propósito, guarda o namespace, os prefixos e o
  // instante em que a metade do KV falhou.
  // ---------------------------------------------------------------------------
  if (url.pathname === '/api/expurgar-kv' && request.method === 'POST') {
    let corpo;
    try { corpo = await request.json(); } catch { corpo = null; }
    const slug = String((corpo && corpo.escola) || '').trim();
    const confirmacao = String((corpo && corpo.confirmacao) || '').trim();
    if (!slug) return responderJson({ ok: false, erro: 'informe a escola' }, 400);
    if (confirmacao !== slug) {
      return responderJson({ ok: false, erro: 'a confirmação não é o slug da escola — nada foi apagado' }, 400);
    }
    const cfToken = env && env.CLOUDFLARE_API_TOKEN;
    const ghToken = env && env.GITHUB_TOKEN;
    if (!cfToken || !ghToken) {
      return responderJson({ ok: false, erro: 'faltam tokens no Worker (CLOUDFLARE_API_TOKEN e GITHUB_TOKEN)' }, 500);
    }

    let pendencia = null;
    try {
      pendencia = await pendenciaDoKv({ token: ghToken, dono: DONO, repo: REPO, ref: REF, slug });
    } catch (err) {
      return responderJson({ ok: false, erro: 'não consegui ler o índice da escola: ' + ((err && err.message) || String(err)) }, 500);
    }
    if (!pendencia) {
      return responderJson({ ok: true, escola: slug, nadaPendente: true,
        nota: 'não há expurgo pendente no KV para esta escola' });
    }
    if (!pendencia.namespaceId) {
      return responderJson({ ok: false, escola: slug, erro: 'o elo do expurgo não guardou o namespace do KV — não sei onde limpar' }, 500);
    }

    let kv = null;
    try {
      kv = await apagarChavesDeEscola({
        token: cfToken,
        accountId: ACCOUNT_ID,
        namespaceId: pendencia.namespaceId,
        prefixos: pendencia.prefixos || prefixosDaEscola(slug),
        prefixo: null,
        slug,
      });
    } catch (err) {
      kv = { ok: false, erro: (err && err.message) || String(err) };
    }

    // Resolvido: o elo ganha a linha da retomada (o passado não se reescreve). Ainda não
    // resolvido: a pendência FICA, e a próxima tentativa parte do mesmo lugar.
    let registro = null;
    if (kv && kv.ok === true) {
      try {
        const indiceAtual = await lerArquivo({ token: ghToken, dono: DONO, repo: REPO, ref: REF, caminho: 'escola/' + slug + '/indice.json' });
        const novo = comResolucaoDoKv(indiceAtual, { resultado: kv });
        registro = await atualizarIndiceDaEscola({
          token: ghToken, dono: DONO, repo: REPO, ref: REF, slug, conteudo: novo,
        });
      } catch (err) {
        registro = { ok: false, erro: (err && err.message) || String(err) };
      }
    }

    const ok = Boolean(kv && kv.ok === true);
    return responderJson(Object.assign({ escola: slug, pendencia, kv, registro }, { ok }), ok ? 200 : 500);
  }

  if (url.pathname === '/api/criar-escola' && request.method === 'POST') {
    const token = env && env.CLOUDFLARE_API_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ ok: false, erro: 'CLOUDFLARE_API_TOKEN ausente no Worker' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    }
    try {
      const corpo = await request.json();
      // O professor criado na página é SEMPRE o dono da escola (a direção). A marcação
      // «é o dono?» saiu do formulário: quem cria é a pesquisadora, e o professor inicial
      // é a pessoa de contato da escola — o nome pode ser ajustado nos Bastidores.
      const professorEhDono = true;
      const valido = validarCriacaoEscola(corpo);
      if (!valido.ok) return responderJson({ ok: false, erro: valido.erro }, valido.status);
      const { nome, senhaAdmin, professorNome, professorSobrenome, professorExistente, senhaProfessor } = valido.campos;

      // O SLUG DO PROFESSOR É A PASTA `professores/<slug>/` — e essa pasta é do SISTEMA, não
      // da escola: guarda o pacote, os cadernos, os relatórios e as âncoras. Duas pessoas com
      // o mesmo slug viram UMA no registro (o PO de uma cairia na pasta da outra). Por isso a
      // unicidade é conferida contra os diretórios que existem, e o desempate é o SOBRENOME.
      //
      // Duas saídas, e só duas:
      //   1. REUTILIZAR um professor que já existe (`professorExistente`) — a pasta fica;
      //   2. CRIAR com nome + sobrenome — a pasta nasce como `nome-sobrenome`.
      const existentes = await listarProfessores({ token: env && env.GITHUB_TOKEN, dono: DONO, repo: REPO, ref: REF });
      let professor = null;
      let nomeDeExibicao = professorNome;
      if (professorExistente) {
        const achado = existentes.find((p) => p.slug === professorExistente);
        if (!achado) {
          return new Response(JSON.stringify({ ok: false, erro: 'o professor "' + professorExistente + '" não existe — recarregue a lista' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
          });
        }
        professor = achado.slug;
        // O nome de um professor que JÁ EXISTE vem do sistema — e quando ele ainda não tem
        // escola nenhuma (o diretório-modelo `tiago`), o índice não existe e sobra o slug.
        // NUNCA vazio: é este nome que vira o secret `PROFESSOR_NOME` e o `responsavel`.
        nomeDeExibicao = achado.nome || tituloDoSlug(achado.slug);
      } else {
        // O sobrenome (ou apelido) é exigido: sem ele, dois homônimos produzem o mesmo slug.
        if (!professorSobrenome) {
          return new Response(JSON.stringify({
            ok: false,
            erro: 'informe o sobrenome (ou um apelido) do professor — o nome vira a pasta `professores/<nome>/` e não pode repetir. Se for a mesma pessoa de um professor que já existe, use «usar este professor».',
            professoresExistentes: existentes.map((p) => p.slug),
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
          });
        }
        professor = slugificar(professorNome + ' ' + professorSobrenome);
        if (!professor) {
          return new Response(JSON.stringify({ ok: false, erro: 'o nome do professor não produz um slug válido' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
          });
        }
        const colisao = existentes.find((p) => p.slug === professor);
        if (colisao) {
          return new Response(JSON.stringify({
            ok: false,
            erro: 'já existe o professor "' + (colisao.nome || colisao.slug) + '" na pasta `professores/' + professor + '/`. Se for OUTRA pessoa, informe um sobrenome ou apelido diferente; se for a mesma, use «usar este professor».',
            colisao: colisao.slug,
          }), {
            status: 409,
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
          });
        }
        nomeDeExibicao = professorNome + ' ' + professorSobrenome;
      }

      // O RESÍDUO DE UM EXPURGO ANTERIOR (19/10/2026). Uma escola que foi expurgada com a
      // metade do KV por terminar deixa chaves debaixo do MESMO slug. Criar a escola outra
      // vez com esse nome daria uma escola nova a ler o dado antigo — as anamneses e o plano
      // de ontem apareceriam na estante de hoje, e o teste mediria ficção. Nada aqui adivinha:
      // o elo do expurgo diz que ficou pendente, e a escola não nasce até isso se resolver.
      // A saída é a retomada (`POST /api/expurgar-kv`) — ou outro nome de escola.
      const slugPedido = slugificar(nome);
      if (slugPedido) {
        // Falha ao LER o índice não trava a criação: a trava é contra um resíduo CONHECIDO, e
        // um erro de rede no GitHub não pode impedir uma escola de nascer. A guarda é do
        // dado, não do acaso.
        let pendente = null;
        try {
          pendente = await pendenciaDoKv({
            token: env && env.GITHUB_TOKEN, dono: DONO, repo: REPO, ref: REF, slug: slugPedido,
          });
        } catch (err) { pendente = null; }
        if (pendente) {
          return new Response(JSON.stringify({
            ok: false,
            erro: 'a escola "' + slugPedido + '" já existiu, e o expurgo dela deixou chaves no KV ' +
              (pendente.em ? '(desde ' + pendente.em + ')' : '') + '. Criar outra com o mesmo ' +
              'nome faria a escola nova ler o dado antigo. Termine o expurgo' +
              ' (POST /api/expurgar-kv com a escola "' + slugPedido + '") — a limpeza volta a ' +
              'tentar quando a cota diária da enumeração do KV renovar — ou crie a escola com ' +
              'outro nome.',
            pendenciaKv: pendente,
            escola: slugPedido,
          }), {
            status: 409,
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
          });
        }
      }

      const escola = await criarEscola({
        nome,
        senhaAdmin,
        token,
        accountId: ACCOUNT_ID,
        githubToken: env && env.GITHUB_TOKEN,
        professorNome: nomeDeExibicao,
        // A PASTA vai declarada, não derivada do nome (17/10/2026): é ela que o motor usa em
        // `professores/<slug>/…`. Com o nome de exibição só, um «Tiago» curto produzia o slug
        // `tiago` e o PO ia para uma pasta fantasma.
        professorSlug: professor,
        senhaProfessor,
        professorEhDono,
      });
      // O motor completo nasce no workflow `criar-escola.yml` — a página só cria a escola
      // «zero» + segredos; o scaffold + o deploy do motor vêm do Actions. Sem GITHUB_TOKEN
      // na raiz, a escola nasce «zero» (sem o motor), e o campo `disparo` declara isso.
      const disparo = env && env.GITHUB_TOKEN
        ? await dispararCriacao({
            token: env.GITHUB_TOKEN,
            dono: 'tmenegaz',
            repo: 'danca',
            ref: 'main',
            inputs: {
              professor,
              // O NOME DE EXIBIÇÃO, não o primeiro nome. É ele que o scaffolder grava no
              // `indice.json` (`professor.nome`), e é DO ÍNDICE que a lista de professores da
              // página tira o nome que mostra. Com o primeiro nome só, dois homônimos
              // apareceriam os dois como «Tiago» — exatamente o que o sobrenome veio separar.
              'professor-nome': nomeDeExibicao,
              escola: escola.escola,
              'escola-nome': nome,
              responsavel: nomeDeExibicao,
              ciclo: '01',
              frequencia: '2x/semana',
              dias: '2@19:00,4@19:00',
              duracao: '60',
              'data-inicio': '',
            },
          })
        : { ok: false, erro: 'GITHUB_TOKEN ausente na raiz' };

      // O DISPARO FALHOU ⇒ NÃO HÁ ESCOLA. Sem o workflow não há scaffold nem motor: o que
      // ficou no ar é o placeholder, a responder 200 no subdomínio de uma escola que não
      // existe. Antes disto, a resposta era 201 «escola criada» com um aviso em letra
      // pequena — e o órfão ficava. O rollback desfaz e a resposta passa a ser um ERRO,
      // porque não se criou nada.
      if (!disparo.ok) {
        const desfeito = await desfazerPlaceholder({
          token,
          accountId: ACCOUNT_ID,
          escola: escola.escola,
          nome,
        });
        return responderJson({
          ok: false,
          erro: 'o deploy do motor completo não foi disparado (' + (disparo.erro || ('HTTP ' + disparo.status)) + ') — nada foi criado',
          desfeito,
        }, 502);
      }

      return new Response(JSON.stringify({ ok: true, ...escola, disparo }), {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    } catch (err) {
      const status = (err && err.etapa === 'existe') ? 409 : (err && err.etapa === 'slug') ? 400 : 500;

      // O ROLLBACK NÃO SE REPETE AQUI. `criarEscola` já desfez o que ela própria criou e
      // deixou o resultado em `err.desfeito` — chamar outra vez seria perguntar duas vezes a
      // mesma coisa e responder «não existia» sobre um Worker que ESTE pedido acabou de apagar
      // (a segunda leitura recebe 404). Um 409 e um 400 nunca chegam aqui com `desfeito`: no
      // primeiro o Worker é uma escola a sério; no segundo não há slug.
      const desfeito = (err && err.desfeito) || null;

      return new Response(JSON.stringify(Object.assign(
        { ok: false, erro: (err && err.etapa ? err.etapa + ': ' : '') + (err && err.message) },
        desfeito ? { desfeito } : {}
      )), {
        status,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    }
  }

  // O resto → o ASSETS (a apresentação «Sistema Lastro» em raiz/index.html e o assets/).
  // O `run_worker_first` fez o Worker rodar antes do estático; aqui ele devolve o
  // estático que existe — e só cai no 404 quando não há. O freio de senha já foi
  // aplicado no topo: nada do ASSETS é servido sem autorização.
  if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    // A PÁGINA `/` É O PAINEL (22/10/2026). Ela continua a ser a apresentação versionada — com
    // as ações na coluna da esquerda —, e o bloco «Escolas do sistema» entra por um marcador que
    // `tools/gerar-raiz.sh` preserva (ele regera só o corpo de `.conteudo`, e o marcador está
    // fora dele).
    //
    // O BLOCO É ESTÁTICO DESDE 22/10/2026, e por isso esta página DEIXOU DE LER O REPOSITÓRIO.
    // Ele explica o que cada lista mostra e leva a ela; as listas vivem nas suas páginas, e os
    // atalhos na coluna das ações. Duas consequências: `/` abre sempre — mesmo com o índice
    // ilegível ou sem `GITHUB_TOKEN`, que é o que a página que cria escolas precisa; e não há
    // espera de rede nenhuma para servir a entrada do sistema.
    //
    // O ÍNDICE entra depois do bloco porque lê os títulos do HTML já montado.
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const respostaDoAsset = await env.ASSETS.fetch(request);
      const tipo = respostaDoAsset.headers.get('Content-Type') || '';
      if (!respostaDoAsset.ok || !/text\/html/.test(tipo)) return respostaDoAsset;
      const html = await respostaDoAsset.text();
      if (html.indexOf(painel.MARCADOR) === -1) return respostaDoAsset;

      const comBloco = html.replace(painel.MARCADOR, painel.blocoDeEscolas());
      const comIndice = comBloco.replace(painel.MARCADOR_INDICE, painel.indiceDaPagina(comBloco));
      return new Response(comIndice, {
        status: 200,
        headers: {
          'Content-Type': 'text/html;charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }
    return env.ASSETS.fetch(request);
  }
  return new Response('não encontrado', { status: 404 });
}

// `moradaDaEscola` sai para fora porque é a pergunta «onde esta escola vive?» — a que o
// expurgo faz ANTES de apagar qualquer coisa, e a única que pode ser respondida sem apagar
// nada. Exportada, ela é provável no runtime real (o defeito que ela sofreu — `Buffer` num
// runtime que não o tem — passou por todos os testes em Node sem ser visto).
module.exports = { fetch, scheduled, expurgar, moradaDaEscola, validarCriacaoEscola, tituloDoSlug };
