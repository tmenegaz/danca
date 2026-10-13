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

const { criarEscola, dispararCriacao } = require('./provisionar-escola.js');
const { excluirEscola } = require('./expurgar-escola.js');

const ACCOUNT_ID = '2628f36f9f72bd539b417dcb173d1f12';

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
      const professor = String(corpo.professor || '').trim();
      const professorNome = String(corpo.professorNome || corpo['professor-nome'] || '').trim();
      const responsavel = String(corpo.responsavel || professorNome).trim();
      const ciclo = String(corpo.ciclo || '01').trim();
      const frequencia = String(corpo.frequencia || '2x/semana').trim();
      const dias = String(corpo.dias || '2@19:00,4@19:00').trim();
      const duracao = String(corpo.duracao || '60').trim();
      const dataInicio = String(corpo.dataInicio || corpo['data-inicio'] || '').trim();
      if (!nome || !senhaAdmin || !professor || !professorNome || !dataInicio) {
        return new Response(JSON.stringify({ ok: false, erro: 'informe o nome, a senha, o professor e a data de início' }), {
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
              responsavel,
              ciclo,
              frequencia,
              dias,
              duracao,
              'data-inicio': dataInicio,
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
