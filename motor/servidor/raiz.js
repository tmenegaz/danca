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

const { criarEscola } = require('./provisionar-escola.js');

const ACCOUNT_ID = '2628f36f9f72bd539b417dcb173d1f12';

/** O freio da raiz: sem a senha, nada se vê (nem a página, nem a rota de criar). */
function autorizado(request, env) {
  const senha = env && env.SENHA_RAIZ;
  if (!senha) return false;
  const esperado = 'Basic ' + btoa('tmenegaz:' + senha);
  return request.headers.get('Authorization') === esperado;
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
      if (!nome || !senhaAdmin) {
        return new Response(JSON.stringify({ ok: false, erro: 'informe o nome da escola e a senha do administrador' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
        });
      }
      const escola = await criarEscola({ nome, senhaAdmin, token, accountId: ACCOUNT_ID });
      return new Response(JSON.stringify({ ok: true, ...escola }), {
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

module.exports = { fetch };
