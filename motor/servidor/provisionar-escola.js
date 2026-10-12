'use strict';

/**
 * provisionar-escola.js — cria uma escola NOVA no Cloudflare, por dentro do Worker raiz.
 *
 * O «Criar nova escola» da página `danca` não roda o `tools/criar-escola.sh` (aquele é
 * o CLI de scaffolding LOCAL, que monta professor + ciclo + pacote no repositório). Aqui
 * nasce só a ESCOLA — o Worker e o domínio —, no estado «zero»: a página «Nós, Por
 * Exemplo» + o menu com a «Área do Professor» (PO e anamnese) DESABILITADA e o
 * «Bastidores». O professor é cadastrado DEPOIS, nos Bastidores (a habilitação da Área
 * do Professor), e só então a escola ganha o motor completo (porta + geração).
 *
 * Tudo aqui é Cloudflare REST API:
 *   1. PUT /accounts/{acct}/workers/scripts/{escola}  — o script (módulo ESM);
 *   2. POST …/scripts/{escola}/subdomain              — liga <escola>.tmenegaz77.workers.dev;
 *   3. PUT …/scripts/{escola}/secrets                 — a SENHA_ADMIN (nunca em claro no repo).
 *
 * O script da escola é um módulo ESM MINÚSCULO e autossuficiente (sem bundle, sem ASSETS):
 * a página «Nós, Por Exemplo» e o menu vivem como uma string HTML dentro dele. Quando a
 * escola for habilitada e ganhar o motor completo, o deploy passa a ser o normal
 * (`wrangler deploy` sobre o wrangler.<escola>.jsonc), não este módulo.
 */

const KV_NAMESPACE_ID = '2ee331c7a5bc446ca86c8f2cb039ec16';
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

/** O módulo ESM da escola «zero». A identidade entra como literal (JSON, para não vazar). */
function scriptDaEscola(escola, nome) {
  const escolaLit = JSON.stringify(escola);
  const nomeLit = JSON.stringify(nome);
  return (
    '// escola ' + escola + ' — Worker «zero» (gerado por provisionar-escola.js)\n' +
    'const ESCOLA = ' + escolaLit + ';\n' +
    'const NOME = ' + nomeLit + ';\n' +
    'const PAGINA = `' + paginaDaEscola() + '`;\n' +
    '\n' +
    'function desabilitada() {\n' +
    '  return new Response(' +
    "    '<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\">' +\n" +
    "    '<title>Escola desabilitada</title>' +\n" +
    "    '<style>body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;' +\n" +
    "    'max-width:34rem;margin:4rem auto;padding:0 1.25rem;}h1{font-size:1.5rem;}' +\n" +
    "    'p{color:#6b5b4a;}</style></head><body>' +\n" +
    "    '<h1>Escola desabilitada</h1>' +\n" +
    "    '<p>Esta escola está desabilitada para resolver problemas diversos.</p>' +\n" +
    "    '</body></html>',\n" +
    "    { status: 503, headers: { 'Content-Type': 'text/html;charset=utf-8' } }\n" +
    '  );\n' +
    '}\n' +
    '\n' +
    'export default {\n' +
    '  async fetch(request, env) {\n' +
    "    if (env.ESCOLA_HABILITADA !== 'sim') return desabilitada();\n" +
    '    const url = new URL(request.url);\n' +
    "    if (url.pathname === '/' || url.pathname === '/index.html') {\n" +
    "      return new Response(PAGINA, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });\n" +
    '    }\n' +
    "    return new Response('nao encontrado', { status: 404 });\n" +
    '  },\n' +
    '};\n'
  );
}

/** A página «Nós, Por Exemplo» do estado zero — compacta, com o menu e o aviso de habilitação. */
function paginaDaEscola() {
  return (
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Nós, Por Exemplo · ${NOME}</title>' +
    '<style>' +
    'body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;margin:0;}' +
    '.topo{border-bottom:1px solid #c9a24b;padding:.9rem 1.25rem;background:#fdfaf2;}' +
    '.topo h1{margin:0;font-size:1.4rem;color:#6b2f2f;}' +
    '.nav{max-width:60rem;margin:0 auto;padding:.6rem 1.25rem;display:flex;gap:1.4rem;flex-wrap:wrap;font-size:.95rem;}' +
    '.nav .grupo{position:relative;}' +
    '.nav summary{font-weight:700;color:#6b2f2f;cursor:pointer;}' +
    '.nav .sub{display:flex;flex-direction:column;padding-left:.8rem;margin-top:.2rem;}' +
    '.nav .sub .item{color:#a08a5c;text-decoration:line-through;cursor:not-allowed;}' +
    '.corpo{max-width:60rem;margin:0 auto;padding:1.5rem 1.25rem;}' +
    '.corpo p{color:#6b5b4a;max-width:40rem;}' +
    '.aviso{border:1px solid #c9a24b;background:#fdf6e3;border-radius:6px;padding:.8rem 1rem;max-width:40rem;color:#6b2f2f;}' +
    '</style></head><body>' +
    '<div class="topo"><div class="nav">' +
    '<a href="/" style="color:#6b2f2f;font-weight:700;">Nós, Por Exemplo</a>' +
    '<details class="grupo" open><summary>Área do Professor</summary><div class="sub">' +
    '<span class="item" title="cadastre um professor nos Bastidores para habilitar">Plano de Observação</span>' +
    '<span class="item" title="cadastre um professor nos Bastidores para habilitar">Anamnese do aluno</span>' +
    '</div></details>' +
    '<details class="grupo"><summary>Bastidores</summary><div class="sub">' +
    '<span class="item" title="a Produção ainda não existe — é plano">Produção</span>' +
    '</div></details>' +
    '</div></div>' +
    '<div class="corpo">' +
    '<h1>Nós, Por Exemplo</h1>' +
    '<p>Esta escola (<b>${NOME}</b>) nasceu agora, no estado «zero»: a <b>Área do Professor</b> ainda está ' +
    'desabilitada. Cadastre um professor nos <b>Bastidores</b> para liberar o Plano de Observação e a Anamnese.</p>' +
    '<p class="aviso">A <b>Área do Professor</b> habilita quando o administrador cadastrar pelo menos um professor ' +
    'e criar a senha dele — nos Bastidores, na Produção.</p>' +
    '</div></body></html>'
  );
}

/** Um erro de Cloudflare, com o texto curto para o log e para a resposta. */
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

/** Cria a escola no Cloudflare. Devolve `{ escola, nome, url }`. */
async function criarEscola({ nome, senhaAdmin, token, accountId }) {
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

  return { escola, nome, url: 'https://' + escola + '.' + SUBDOMINIO + '.workers.dev' };
}

/** Upload do MÓDULO (multipart) — o PUT JSON anterior cria o script; este sobe o código. */
async function subirModulo(token, accountId, escola, codigo) {
  const meta = JSON.stringify({
    main_module: 'worker.js',
    compatibility_date: '2025-02-04',
    bindings: [
      { type: 'plain_text', name: 'ESCOLA_HABILITADA', text: 'sim' },
      { type: 'kv_namespace', name: 'PADD_KV', namespace_id: KV_NAMESPACE_ID },
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

module.exports = { criarEscola, slugificar };
