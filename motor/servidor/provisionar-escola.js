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

// O KV de TESTE (`ciclos-escolas-plano-b`) — não o `ciclos-escolas` de produção. O
// mock da Produção (cadastro de professor) grava aqui, isolado dos dados reais. Quando
// a Produção real nascer, este módulo passa a usar o namespace de produção, com prefixo.
const KV_NAMESPACE_ID = '159c74e195544ef2998d41b7b620220b';
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

/** O módulo ESM da escola «zero» — agora com o MOCK da Produção (Bastidores). */
function scriptDaEscola(escola, nome) {
  // O worker fonte usa SÓ aspas simples (sem backticks, sem `${`, sem `\u`, sem `\n`),
  // para este template literal de fora não interpretar nada além de NOME.
  return `// escola ${escola} — Worker «zero» (mock da Produção, gerado por provisionar-escola.js)
const NOME = ${JSON.stringify(nome)};
const ESCOLA = ${JSON.stringify(escola)};

function desabilitada() {
  return new Response(
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Escola desabilitada</title>' +
    '<style>body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;max-width:34rem;margin:4rem auto;padding:0 1.25rem;}h1{font-size:1.5rem;}p{color:#6b5b4a;}</style></head><body>' +
    '<h1>Escola desabilitada</h1>' +
    '<p>Esta escola está desabilitada para resolver problemas diversos.</p>' +
    '</body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html;charset=utf-8' } }
  );
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function professores(kv) {
  try {
    const t = await kv.get('professores:' + ESCOLA);
    return t ? JSON.parse(t) : [];
  } catch (e) { return []; }
}

function pagina(nome, profs) {
  const habilitado = profs.length > 0;
  const po = habilitado
    ? '<a class="item" href="/plano-observacao/">Plano de Observação</a>'
    : '<span class="item" title="cadastre um professor nos Bastidores para habilitar">Plano de Observação</span>';
  const anam = habilitado
    ? '<a class="item" href="/anamnese/">Anamnese do aluno</a>'
    : '<span class="item" title="cadastre um professor nos Bastidores para habilitar">Anamnese do aluno</span>';
  const aviso = habilitado
    ? '<p class="aviso ok">A Área do Professor está <b>habilitada</b> (' + profs.length + ' professor(es) cadastrado(s)).</p>'
    : '<p class="aviso">A Área do Professor está <b>desabilitada</b> — cadastre um professor nos Bastidores (Produção) para liberar o Plano de Observação e a Anamnese.</p>';
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Nós, Por Exemplo · ' + esc(nome) + '</title>' +
    '<style>' +
    'body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;margin:0;}' +
    '.topo{border-bottom:1px solid #c9a24b;padding:.9rem 1.25rem;background:#fdfaf2;}' +
    '.nav{max-width:60rem;margin:0 auto;padding:.6rem 1.25rem;display:flex;gap:1.4rem;flex-wrap:wrap;font-size:.95rem;}' +
    '.nav a{color:#6b2f2f;font-weight:700;text-decoration:none;}' +
    '.nav details summary{font-weight:700;color:#6b2f2f;cursor:pointer;}' +
    '.nav .sub{display:flex;flex-direction:column;padding-left:.8rem;margin-top:.2rem;}' +
    '.nav .sub .item{color:#6b2f2f;text-decoration:none;padding:.1rem 0;}' +
    '.nav .sub .item[title]{color:#a08a5c;text-decoration:line-through;cursor:not-allowed;}' +
    '.corpo{max-width:60rem;margin:0 auto;padding:1.5rem 1.25rem;}' +
    '.corpo p{color:#6b5b4a;max-width:40rem;}' +
    '.aviso{border:1px solid #c9a24b;background:#fdf6e3;border-radius:6px;padding:.8rem 1rem;max-width:40rem;color:#6b2f2f;}' +
    '.aviso.ok{background:#eef7ee;border-color:#4f8a4f;color:#2f5d2f;}' +
    '</style></head><body>' +
    '<div class="topo"><div class="nav">' +
    '<a href="/">Nós, Por Exemplo</a>' +
    '<details class="grupo" open><summary>Área do Professor</summary><div class="sub">' + po + anam + '</div></details>' +
    '<details class="grupo"><summary>Bastidores</summary><div class="sub">' +
    '<a class="item" href="/bastidores">Produção</a>' +
    '</div></details>' +
    '</div></div>' +
    '<div class="corpo">' +
    '<h1>Nós, Por Exemplo</h1>' +
    '<p>Esta é a escola <b>' + esc(nome) + '</b>. Cadastre um professor nos Bastidores para liberar o Plano de Observação e a Anamnese.</p>' +
    aviso +
    '</div></body></html>';
}

function paginaBastidores(nome, profs) {
  const itens = profs.length
    ? profs.map(function(p){ return '<li>' + esc(p.nome) + '</li>'; }).join('')
    : '<li>(nenhum professor cadastrado)</li>';
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Bastidores · Produção · ' + esc(nome) + '</title>' +
    '<style>' +
    'body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;margin:0;}' +
    '.topo{border-bottom:1px solid #c9a24b;padding:.9rem 1.25rem;background:#fdfaf2;}' +
    '.topo a{color:#6b2f2f;font-weight:700;text-decoration:none;margin-right:1.2rem;}' +
    '.corpo{max-width:40rem;margin:0 auto;padding:1.5rem 1.25rem;}' +
    '.corpo h1{color:#6b2f2f;}' +
    '.corpo p{color:#6b5b4a;}' +
    'form{border:1px solid #c9a24b;background:#fdf6e3;border-radius:6px;padding:1rem;margin:1rem 0;}' +
    'form label{display:block;margin:.5rem 0 .2rem;font-size:.9rem;color:#6b2f2f;}' +
    'form input{width:100%;box-sizing:border-box;padding:.45rem .6rem;font:1rem/1.4 system-ui,sans-serif;border:1px solid #c9a24b;border-radius:4px;}' +
    'button{display:inline-block;margin-top:.9rem;padding:.6rem 1.1rem;background:#6b2f2f;color:#fff;border:none;border-radius:6px;font:600 .95rem/1.2 system-ui,sans-serif;cursor:pointer;}' +
    '.res{margin-top:1rem;padding:.7rem .9rem;border-radius:6px;display:none;}' +
    '.res.ok{display:block;background:#eef7ee;border:1px solid #4f8a4f;color:#2f5d2f;}' +
    '.res.erro{display:block;background:#fdeaea;border:1px solid #b25555;color:#7a2f2f;}' +
    'ul{list-style:none;padding:0;}' +
    'ul li{padding:.3rem 0;border-bottom:1px dotted #c9a24b;color:#3a2b1f;}' +
    '</style></head><body>' +
    '<div class="topo"><a href="/">← Nós, Por Exemplo</a><span>Bastidores · Produção</span></div>' +
    '<div class="corpo">' +
    '<h1>Produção — mock (andaime)</h1>' +
    '<p>Cadastre um professor para habilitar a Área do Professor. Este é um <b>mock</b>: a Produção real ainda não existe.</p>' +
    '<form id="form-prof">' +
    '<label for="pnome">Nome do professor</label>' +
    '<input id="pnome" name="nome" autocomplete="off" placeholder="ex.: Tiago">' +
    '<label for="psenha">Senha do professor</label>' +
    '<input id="psenha" name="senha" type="password" autocomplete="new-password">' +
    '<button type="submit">Cadastrar professor</button>' +
    '</form>' +
    '<div class="res" id="res"></div>' +
    '<h2>Professores cadastrados</h2>' +
    '<ul>' + itens + '</ul>' +
    '</div>' +
    '<script>' +
    'document.getElementById("form-prof").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  var res = document.getElementById("res");' +
    '  res.className = "res"; res.textContent = "cadastrando...";' +
    '  fetch("bastidores/api/professor", {' +
    '    method: "POST",' +
    '    headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify({nome: document.getElementById("pnome").value, senha: document.getElementById("psenha").value})' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) { location.reload(); }' +
    '    else { res.className = "res erro"; res.textContent = "Erro: " + (d.erro || "desconhecido"); }' +
    '  }).catch(function(err){ res.className = "res erro"; res.textContent = "Erro: " + err.message; });' +
    '});' +
    '</script>' +
    '</body></html>';
}

function placeholderMotor(rota) {
  const titulo = rota === '/anamnese/' ? 'Anamnese do aluno' : 'Plano de Observação';
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + titulo + '</title>' +
    '<style>body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;max-width:34rem;margin:4rem auto;padding:0 1.25rem;}h1{color:#6b2f2f;}a{color:#6b2f2f;}</style></head><body>' +
    '<h1>' + titulo + '</h1>' +
    '<p>A Área do Professor foi <b>liberada</b> — mas o motor completo (porta + geração) ainda não foi migrado para esta escola. É o próximo passo, fora deste mock.</p>' +
    '<p><a href="/bastidores">← Voltar aos Bastidores</a></p>' +
    '</body></html>';
}

export default {
  async fetch(request, env) {
    if (env.ESCOLA_HABILITADA !== 'sim') return desabilitada();
    const url = new URL(request.url);
    const kv = env.PADD_KV;
    const profs = await professores(kv);
    const path = url.pathname;

    if (path === '/' || path === '/index.html') {
      return new Response(pagina(NOME, profs), { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
    }
    if (path === '/bastidores') {
      return new Response(paginaBastidores(NOME, profs), { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
    }
    if (path === '/bastidores/api/professor' && request.method === 'POST') {
      let corpo;
      try { corpo = await request.json(); } catch (e) { corpo = {}; }
      const pn = String(corpo.nome || '').trim();
      const ps = String(corpo.senha || '');
      if (!pn || !ps) {
        return new Response(JSON.stringify({ ok: false, erro: 'informe o nome e a senha do professor' }), { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
      }
      const lista = await professores(kv);
      lista.push({ nome: pn, senha: ps });
      await kv.put('professores:' + ESCOLA, JSON.stringify(lista));
      return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
    }
    if (path === '/plano-observacao/' || path === '/anamnese/') {
      if (profs.length === 0) return desabilitada();
      return new Response(placeholderMotor(path), { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
    }
    return new Response('não encontrado', { status: 404 });
  }
};
`;
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

/** Reenvia o módulo da escola JÁ existente (o mock atualizado), sem tocar senha nem subdomínio. */
async function atualizarEscola({ escola, nome, token, accountId }) {
  await subirModulo(token, accountId, escola, scriptDaEscola(escola, nome));
  return { escola, nome, url: 'https://' + escola + '.' + SUBDOMINIO + '.workers.dev' };
}

module.exports = { criarEscola, atualizarEscola, slugificar, scriptDaEscola, subirModulo };
