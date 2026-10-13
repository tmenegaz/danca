'use strict';

/**
 * provisionar-escola.js — cria uma escola NOVA no Cloudflare, por dentro do Worker raiz.
 *
 * O «Criar nova escola» da página `danca` cria a escola «zero» no Cloudflare — o Worker
 * (um módulo ESM mínimo, só para a escola existir e guardar os segredos), o subdomínio e
 * os SEGREDOS — e então DISPARA o workflow `criar-escola.yml`, que roda o
 * `tools/criar-escola.sh` (o scaffolding: professor + ciclo + pacote-zero) e sobe o
 * MOTOR COMPLETO (porta + Bastidores + geração) com `wrangler deploy`. Os segredos
 * persistem: o `wrangler deploy` troca o CÓDIGO, não os segredos.
 *
 * Depois que o motor está no ar, o professor é cadastrado nos Bastidores — e é esse
 * cadastro que HABILITA a «Área do Professor» (anamnese, plano de ensino e PO).
 *
 * Tudo aqui é Cloudflare REST API + um dispatch do GitHub Actions:
 *   1. PUT /accounts/{acct}/workers/scripts/{escola}  — o script (módulo ESM «zero»);
 *   2. POST …/scripts/{escola}/subdomain              — liga <escola>.tmenegaz77.workers.dev;
 *   3. PUT …/scripts/{escola}/secrets                 — a SENHA_ADMIN (nunca em claro no repo);
 *   4. PUT …/scripts/{escola}/secrets                 — a SENHA_CRIPTO, gerada AQUI (nunca em
 *      claro no repo nem no computador da pesquisadora: é o segredo que cifra o `-dados.json`);
 *   5. PUT …/scripts/{escola}/secrets                 — o GITHUB_TOKEN (o PAT que o motor usa
 *      para escrever o PO e disparar a geração), copiado do ambiente da raiz;
 *   6. POST …/actions/workflows/criar-escola.yml/dispatches — o deploy do motor completo.
 */

// O Worker «zero» é só a página de «implantação em andamento» — não usa KV. O KV de
// produção (com as chaves prefixadas por escola) entra quando o motor completo sobe,
// pelo `wrangler.<escola>.jsonc` gerado no `tools/criar-escola.sh`.
const SUBDOMINIO = 'tmenegaz77';

/** O slug da escola, derivado do nome que o professor digitou (o subdomínio). */
function slugificar(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')          // tira acento
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')              // espaços e símbolos viram hífen
    .replace(/^-+|-+$/g, '')                  // sem hífen nas pontas
    .replace(/-{2,}/g, '-');
}

/** O módulo ESM da escola «zero» — a página de «implantação em andamento». */
function scriptDaEscola(escola, nome) {
  // O worker fonte usa SÓ aspas simples (sem backticks, sem `${`, sem `\u`, sem `\n`),
  // para este template literal de fora não interpretar nada além de NOME.
  return `// escola ${escola} — Worker «zero» (implantação em andamento, gerado por provisionar-escola.js)
const NOME = ${JSON.stringify(nome)};

function pagina() {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Nós, Por Exemplo · ' + NOME + '</title>' +
    '<style>body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;max-width:34rem;margin:4rem auto;padding:0 1.25rem;}h1{font-size:1.5rem;}p{color:#6b5b4a;}a{color:#6b2f2f;font-weight:700;}</style></head><body>' +
    '<h1>Nós, Por Exemplo</h1>' +
    '<p>Esta é a escola <b>' + NOME + '</b>. O motor completo (Bastidores, anamnese, plano de ensino e plano de observação) está sendo implantado — recarregue em instantes.</p>' +
    '</body></html>';
}

export default {
  async fetch(request, env) {
    if (env.ESCOLA_HABILITADA === 'nao') {
      return new Response('<h1>Escola desabilitada</h1>', { status: 503, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
    }
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(pagina(), { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
    }
    return new Response('implantação em andamento', { status: 200, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
  }
};
`;
}
class ErroDeProvisionamento extends Error {
  constructor(etapa, mensagem) {
    super(mensagem);
    this.etapa = etapa;
  }
}

async function api(etapa, token, metodo, caminho, corpo) {
  const res = await fetch('https://api.cloudflare.com/client/v4' + caminho, {
    method: metodo,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok || dados.success !== true) {
    const msg = (dados.errors && dados.errors[0] && dados.errors[0].message) || ('HTTP ' + res.status);
    throw new ErroDeProvisionamento(etapa, msg);
  }
  return dados;
}

/** A escola já existe? A proveniência acrescenta, não edita — não se sobrescreve. */
async function escolaExiste(token, accountId, escola) {
  const res = await fetch('https://api.cloudflare.com/client/v4/accounts/' + accountId + '/workers/scripts/' + escola, {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token },
  });
  return res.ok;
}

/** Gera uma senha forte (48 hex = 24 bytes) com o CSPRNG do Worker — não o `Math.random`. */
function senhaAleatoria() {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

/** Cria a escola no Cloudflare. Devolve `{ escola, nome, url, senhaCripto }`. */
async function criarEscola({ nome, senhaAdmin, token, accountId, githubToken }) {
  const escola = slugificar(nome);
  if (!escola) throw new ErroDeProvisionamento('slug', 'o nome da escola não produz um slug válido');

  if (await escolaExiste(token, accountId, escola)) {
    throw new ErroDeProvisionamento('existe', 'a escola "' + escola + '" já existe — não se sobrescreve (a proveniência acrescenta, não edita)');
  }

  const base = '/accounts/' + accountId + '/workers';

  // 1. o script da escola (módulo ESM) + o freio ESCOLA_HABILITADA e o KV.
  await subirModulo(token, accountId, escola, scriptDaEscola(escola, nome));

  // 2. liga o subdomínio workers.dev.
  await api('subdominio', token, 'POST', base + '/scripts/' + escola + '/subdomain', { enabled: true });

  // 3. a senha do administrador da escola (nunca em claro no repo; só no Worker).
  await api('senha', token, 'PUT', base + '/scripts/' + escola + '/secrets', {
    name: 'SENHA_ADMIN',
    text: senhaAdmin,
    type: 'secret_text',
  });

  // 4. a senha de CRIPTOGRAFIA (a que cifra o `-dados.json` e os acompanhamentos), gerada aqui e
  //    devolvida UMA vez — só o Worker a guarda. O caminho (a): a senha nasce no Cloudflare.
  const senhaCripto = senhaAleatoria();
  await api('senha-cripto', token, 'PUT', base + '/scripts/' + escola + '/secrets', {
    name: 'SENHA_CRIPTO',
    text: senhaCripto,
    type: 'secret_text',
  });

  // 5. o GITHUB_TOKEN (PAT) — o segredo que o motor da escola usa para escrever o PO e disparar
  //    a geração. Vem do ambiente da RAIZ (a raiz tem o PAT) e é copiado para a escola; nunca
  //    toca o repositório nem este código.
  if (githubToken) {
    await api('github-token', token, 'PUT', base + '/scripts/' + escola + '/secrets', {
      name: 'GITHUB_TOKEN',
      text: githubToken,
      type: 'secret_text',
    });
  }

  return { escola, nome, url: 'https://' + escola + '.' + SUBDOMINIO + '.workers.dev', senhaCripto };
}

/**
 * Dispara o workflow `criar-escola.yml` — o que monta o scaffold (professor + ciclo +
 * pacote-zero) e sobe o motor completo, substituindo o Worker «zero» criado acima (os
 * segredos persistem). É o mesmo padrão de `disparar.js`, mas com os inputs do ciclo.
 */
async function dispararCriacao({ token, dono, repo, ref, inputs }) {
  if (!token) throw new Error('disparo sem token: injete GITHUB_TOKEN na raiz');
  const url = 'https://api.github.com/repos/' + dono + '/' + repo +
    '/actions/workflows/criar-escola.yml/dispatches';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'danca-worker',
    },
    body: JSON.stringify({ ref: ref || 'main', inputs }),
  });
  return { status: res.status, ok: res.status >= 200 && res.status < 300 };
}

/** Upload do MÓDULO (multipart) — o PUT JSON anterior cria o script; este sobe o código. */
async function subirModulo(token, accountId, escola, codigo) {
  const meta = JSON.stringify({
    main_module: 'worker.js',
    compatibility_date: '2025-02-04',
    bindings: [
      { type: 'plain_text', name: 'ESCOLA_HABILITADA', text: 'sim' },
    ],
  });
  const corpo = new FormData();
  corpo.append('metadata', new Blob([meta], { type: 'application/json' }), 'metadata');
  corpo.append('worker.js', new Blob([codigo], { type: 'application/javascript+module' }), 'worker.js');

  const res = await fetch('https://api.cloudflare.com/client/v4/accounts/' + accountId + '/workers/scripts/' + escola, {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token },
    body: corpo,
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok || dados.success !== true) {
    const msg = (dados.errors && dados.errors[0] && dados.errors[0].message) || ('HTTP ' + res.status);
    throw new ErroDeProvisionamento('modulo', msg);
  }
  return dados;
}

/** Reenvia o módulo da escola JÁ existente (o mock atualizado), sem tocar senha nem subdomínio. */
async function atualizarEscola({ escola, nome, token, accountId }) {
  await subirModulo(token, accountId, escola, scriptDaEscola(escola, nome));
  return { escola, nome, url: 'https://' + escola + '.' + SUBDOMINIO + '.workers.dev' };
}

module.exports = { criarEscola, dispararCriacao, atualizarEscola, slugificar, scriptDaEscola, subirModulo };
