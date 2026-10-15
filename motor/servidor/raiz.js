'use strict';

/**
 * raiz.js — o Worker RAIZ do sistema (`danca.tmenegaz77.workers.dev`).
 *
 * É a porta de entrada do sistema, NÃO uma escola: serve a página «Nós, Por Exemplo» + o
 * botão «Criar nova escola», e NADA mais. Todo acesso é atrás de senha — a `SENHA_RAIZ`
 * (secret do Worker, vinda de `tools/.senhas-locais` na hora do deploy), porque criar uma
 * escola é privilégio da pesquisadora. Aqui não há «Área do Professor»: isso é do pacote
 * de cada escola, não da raiz.
 *
 * O «Criar nova escola» chama `provisionar-escola.js`, que cria o Worker e o subdomínio
 * da escola no Cloudflare e devolve o URL. A raiz só decide; não cria conteúdo pedagógico.
 */

const { criarEscola, dispararCriacao, slugificar } = require('./provisionar-escola.js');
const { excluirEscola } = require('./expurgar-escola.js');
const { listarEscolas, apagarEscolaDoRepo, lerArquivo } = require('./repo-escola.js');

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
 * O que o expurgo NÃO ALCANÇA: `tools/.senhas-locais` e `tools/.escolas-teste` são arquivos
 * do seu computador, fora do Git — o Worker não os edita. Em vez de fingir que limpou, devolve
 * as linhas exatas a tirar. É a mesma fronteira do `escola/expurgar.js`, que roda local.
 */
function linhasLocais(slug) {
  const caixa = slug.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return {
    em: [
      { arquivo: 'tools/.senhas-locais', tirar: ['SENHA_' + caixa, 'LOGIN_' + caixa] },
      { arquivo: 'tools/.escolas-teste', tirar: [slug] },
    ],
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

  // A LISTA de escolas — what the «Apagar escola» button shows before anything is deleted.
  // Sai do repositório (os `wrangler.<slug>.jsonc`), que é o mesmo registro que o expurgo
  // edita: uma só definição de «escola», a que sobrevive ao expurgo como elo no índice.
  if (url.pathname === '/api/escolas' && request.method === 'GET') {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return responderJson({ ok: false, erro: 'GITHUB_TOKEN ausente no Worker' }, 500);
    try {
      const escolas = await listarEscolas({ token, dono: DONO, repo: REPO, ref: REF });
      return responderJson({
        ok: true,
        escolas: escolas.map((e) => ({
          slug: e.slug,
          professor: e.professor,
          ciclo: e.ciclo,
          total: e.total,
          url: 'https://' + e.slug + '.tmenegaz77.workers.dev/',
          local: linhasLocais(e.slug),
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
    const relatorio = { escola: slug, motivo, cloudflare: null, repositorio: null, local: linhasLocais(slug) };

    if (!cfToken) {
      relatorio.cloudflare = { erro: 'CLOUDFLARE_API_TOKEN ausente no Worker' };
    } else {
      try {
        const morada = await moradaDaEscola({ token: ghToken, slug });
        relatorio.cloudflare = await excluirEscola({
          token: cfToken,
          accountId: ACCOUNT_ID,
          slug,
          worker: morada && morada.worker ? morada.worker : slug,
          kv: morada && morada.kvNamespaceId
            ? { namespaceId: morada.kvNamespaceId, prefixo: slug + '/' }
            : null,
        });
        relatorio.cloudflare.morada = morada;
      } catch (err) {
        relatorio.cloudflare = { erro: (err && err.message) || String(err) };
      }
    }

    if (!ghToken) {
      relatorio.repositorio = { erro: 'GITHUB_TOKEN ausente no Worker' };
    } else {
      try {
        relatorio.repositorio = await apagarEscolaDoRepo({
          token: ghToken, dono: DONO, repo: REPO, ref: REF, slug, confirmacao, motivo,
        });
      } catch (err) {
        relatorio.repositorio = { erro: (err && err.message) || String(err) };
      }
    }

    const noRepositorio = Boolean(relatorio.repositorio && relatorio.repositorio.ok);
    const noCloudflare = Boolean(
      relatorio.cloudflare && relatorio.cloudflare.script && relatorio.cloudflare.script.ok
    );
    return responderJson(
      Object.assign(relatorio, { ok: noRepositorio, noRepositorio, noCloudflare }),
      noRepositorio ? 200 : 500
    );
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
      const nome = String(corpo.nome || '').trim();
      const senhaAdmin = String(corpo.senhaAdmin || '');
      const professorNome = String(corpo.professorNome || corpo['professor-nome'] || '').trim();
      const senhaProfessor = String(corpo.senhaProfessor || corpo['senha-professor'] || '');
      // O professor criado na página é SEMPRE o dono da escola (a direção). A marcação
      // «é o dono?» saiu do formulário: quem cria é a pesquisadora, e o professor inicial
      // é a pessoa de contato da escola — o nome pode ser ajustado nos Bastidores.
      const professorEhDono = true;
      if (!nome || !senhaAdmin || !professorNome || !senhaProfessor) {
        return new Response(JSON.stringify({ ok: false, erro: 'informe o nome da escola, a senha do administrador, o nome e a senha do professor' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
        });
      }
      // O slug do professor (a pasta) é derivado do nome — o professor não digita e não vê.
      const professor = slugificar(professorNome);
      if (!professor) {
        return new Response(JSON.stringify({ ok: false, erro: 'o nome do professor não produz um slug válido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
        });
      }
      const escola = await criarEscola({
        nome,
        senhaAdmin,
        token,
        accountId: ACCOUNT_ID,
        githubToken: env && env.GITHUB_TOKEN,
        professorNome,
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
              'professor-nome': professorNome,
              escola: escola.escola,
              'escola-nome': nome,
              responsavel: professorNome,
              ciclo: '01',
              frequencia: '2x/semana',
              dias: '2@19:00,4@19:00',
              duracao: '60',
              'data-inicio': '',
            },
          })
        : { ok: false, erro: 'GITHUB_TOKEN ausente na raiz' };
      return new Response(JSON.stringify({ ok: true, ...escola, disparo }), {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    } catch (err) {
      const status = (err && err.etapa === 'existe') ? 409 : (err && err.etapa === 'slug') ? 400 : 500;
      return new Response(JSON.stringify({ ok: false, erro: (err && err.etapa ? err.etapa + ': ' : '') + (err && err.message) }), {
        status,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    }
  }

  // O resto → o ASSETS (a página «Nós, Por Exemplo» em raiz/index.html e o assets/).
  // O `run_worker_first` fez o Worker rodar antes do estático; aqui ele devolve o
  // estático que existe — e só cai no 404 quando não há. O freio de senha já foi
  // aplicado no topo: nada do ASSETS é servido sem autorização.
  if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    return env.ASSETS.fetch(request);
  }
  return new Response('não encontrado', { status: 404 });
}

module.exports = { fetch, scheduled, expurgar };
