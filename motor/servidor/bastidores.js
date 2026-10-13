'use strict';

/**
 * bastidores.js — os Bastidores da escola, como GRUPO de menu com DOIS itens
 * (IDEIA-PAINEL-ESCOLA.md §2): o «Estúdio de Dança» (a cena, partilhada entre a direção e o
 * professor) e a «Produção» (o gabinete, SÓ da direção — senha própria). O Estúdio primeiro,
 * a Produção depois.
 *
 * A «Área do Professor» (anamnese, plano de ensino e PO) abre depois que um PROFESSOR existe —
 * criado pela página `danca` (secret `PROFESSOR_NOME`/`SENHA_PROFESSOR`) ou cadastrado na
 * Produção. A senha do professor é validada pela anamnese; as ALUNAS (apelidos estáveis, P-12)
 * alimentam o seletor da anamnese.
 *
 * O dado vive no KV da própria escola, isolado por namespace sob chaves prefixadas pelo slug
 * da escola — a MESMA política do cofre, para uma escola nunca ler o dado da outra. A senha do
 * professor NUNCA fica em claro no KV: guarda-se só o sal e o HASH (SHA-256 com sal). O secret
 * `SENHA_PROFESSOR` (o professor criado pela página) é comparado direto, como os demais segredos
 * do Worker.
 *
 * Chaves:
 *   bastidores/<escola>/professores  → [ { nome, sal, hash } ]
 *   bastidores/<escola>/alunas       → [ "apelido", ... ]
 */

const RAIZ = 'bastidores';

function json(status, corpo) {
  return new Response(JSON.stringify(corpo, null, 2) + '\n', {
    status,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
  });
}

function html(corpo) {
  return new Response(corpo, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** O slug da escola, vindo do Worker (uma escola por Worker). */
function escolaDe(env, url) {
  const doEnv = env && String(env.ESCOLA_SLUG || '').trim();
  if (doEnv) return doEnv;
  return String((url && url.searchParams.get('escola')) || '').trim();
}

/** Um sal aleatório (16 bytes) em hex — para nunca guardar a senha em claro. */
function gerarSal() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

/** HASH da senha com o sal — SHA-256(sal + senha), em hex. */
async function hashSenha(senha, sal) {
  const bytes = new TextEncoder().encode(String(sal || '') + senha);
  const digesto = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  let s = '';
  for (const b of new Uint8Array(digesto)) s += b.toString(16).padStart(2, '0');
  return s;
}

/**
 * Existe ao menos um professor? É o que habilita a Área do Professor. A fonte é dupla:
 * o secret `PROFESSOR_NOME` (o professor criado pela página `danca`, que persiste no deploy
 * do motor) OU a lista no KV (professores adicionais cadastrados nos Bastidores).
 */
async function temProfessor(env) {
  if (env && String(env.PROFESSOR_NOME || '').trim()) return true;
  const kv = env && env.PADD_KV;
  if (!kv) return false;
  const escola = escolaDe(env, null);
  if (!escola) return false;
  const profs = await professores(kv, escola);
  return profs.length > 0;
}

async function lerLista(kv, chave) {
  try {
    const t = await kv.get(chave);
    const v = t ? JSON.parse(t) : [];
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

async function professores(kv, escola) {
  return lerLista(kv, RAIZ + '/' + escola + '/professores');
}
async function alunas(kv, escola) {
  return lerLista(kv, RAIZ + '/' + escola + '/alunas');
}

/** O nome do professor DONO, com a sobreposição editável no KV. O dono vive como SECRET
 *  (PROFESSOR_NOME) e o nome ajustado nos Bastidores fica no KV — o KV vence, para o nome
 *  poder ser corrigido sem tocar no segredo do Worker (a senha continua a do segredo). */
async function nomeDoDono(env, kv, escola) {
  try {
    const t = await kv.get(RAIZ + '/' + escola + '/dono');
    if (t) {
      const o = JSON.parse(t);
      const n = String((o && o.nome) || '').trim();
      if (n) return n;
    }
  } catch (e) { /* sem sobreposição — usa o secret */ }
  return String((env && env.PROFESSOR_NOME) || '').trim();
}

/** A senha da DIREÇÃO (Produção) é a senha do administrador OU a do professor dono. */
function senhaDaDirecaoOk(env, senha) {
  if (!senha) return false;
  if (env && env.SENHA_ADMIN && senha === env.SENHA_ADMIN) return true;
  if (env && env.SENHA_PROFESSOR && senha === env.SENHA_PROFESSOR) return true;
  return false;
}

function paginaHub(escola) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Bastidores · ' + esc(escola) + '</title>' +
    '<style>' +
    'body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;margin:0;}' +
    '.topo{border-bottom:1px solid #c9a24b;padding:.9rem 1.25rem;background:#fdfaf2;}' +
    '.topo a{color:#6b2f2f;font-weight:700;text-decoration:none;margin-right:1.2rem;}' +
    '.corpo{max-width:44rem;margin:0 auto;padding:1.5rem 1.25rem;}' +
    '.corpo h1{color:#6b2f2f;}' +
    '.corpo p{color:#6b5b4a;}' +
    '.itens{display:flex;flex-direction:column;gap:1rem;margin-top:1.4rem;}' +
    '.item{border:1px solid #c9a24b;background:#fdf6e3;border-radius:6px;padding:1rem 1.1rem;text-decoration:none;}' +
    '.item h2{margin:0 0 .3rem;color:#6b2f2f;font-size:1.15rem;}' +
    '.item p{margin:0;color:#6b5b4a;}' +
    '</style></head><body>' +
    '<div class="topo"><a href="/">← Nós, Por Exemplo</a><span>Bastidores</span></div>' +
    '<div class="corpo">' +
    '<h1>Bastidores</h1>' +
    '<p>O ambiente da direção da escola: a cena e o gabinete, separados.</p>' +
    '<div class="itens">' +
    '<a class="item" href="/bastidores/estudio"><h2>Estúdio de Dança</h2>' +
    '<p>A cena — o que o professor e a direção partilham.</p></a>' +
    '<a class="item" href="/bastidores/producao"><h2>Produção</h2>' +
    '<p>O gabinete — só da direção, com senha própria.</p></a>' +
    '</div></div></body></html>';
}

function paginaEstudio(escola) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Bastidores · Estúdio de Dança · ' + esc(escola) + '</title>' +
    '<style>' +
    'body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;margin:0;}' +
    '.topo{border-bottom:1px solid #c9a24b;padding:.9rem 1.25rem;background:#fdfaf2;}' +
    '.topo a{color:#6b2f2f;font-weight:700;text-decoration:none;margin-right:1.2rem;}' +
    '.corpo{max-width:44rem;margin:0 auto;padding:1.5rem 1.25rem;}' +
    '.corpo h1{color:#6b2f2f;}' +
    '.corpo p{color:#6b5b4a;}' +
    '.corpo a{color:#6b2f2f;font-weight:700;}' +
    '</style></head><body>' +
    '<div class="topo"><a href="/bastidores">← Bastidores</a><span>Estúdio de Dança</span></div>' +
    '<div class="corpo">' +
    '<h1>Estúdio de Dança</h1>' +
    '<p>Esta é a cena — a vista que a direção e o professor partilham. O que a cena produz sobe para cá.</p>' +
    '<p><a href="/anamnese/">Abrir a Área do Professor</a> (anamnese, plano de ensino e plano de observação).</p>' +
    '</div></body></html>';
}

function paginaProducao(escola, profs, aluns, dono) {
  // O professor criado pela página `danca` vive como SEGREDO (PROFESSOR_NOME, com o nome
  // ajustável no KV) e é o «dono» da escola; os professores ADICIONAIS cadastrados aqui
  // vivem no KV. O dono entra primeiro e recebe «Editar» (não «Excluir»): ele é o contato
  // da escola, e o segredo do Worker é outra fronteira. A lista não duplica.
  const donoNome = String(dono || '').trim();
  const linhasProfs = [];
  if (donoNome) {
    linhasProfs.push('<li>' + esc(donoNome) + ' <span class="dono">(dono — criado na página)</span>'
      + ' <button class="editar" data-tipo="dono" data-alvo="' + esc(donoNome) + '" title="Editar o nome do dono">Editar</button></li>');
  }
  for (const p of profs) {
    if (!p || !p.nome) continue;
    if (p.nome === donoNome) continue; // o dono já entrou, sem duplicar
    linhasProfs.push('<li>' + esc(p.nome)
      + ' <button class="apagar" data-tipo="professor" data-alvo="' + esc(p.nome) + '" title="Excluir professor">Excluir</button></li>');
  }
  const itensProfs = linhasProfs.length
    ? linhasProfs.join('')
    : '<li>(nenhum professor cadastrado)</li>';
  const itensAlunas = aluns.length
    ? aluns.map((a) => '<li>' + esc(a)
        + ' <button class="apagar" data-tipo="aluna" data-alvo="' + esc(a) + '" title="Excluir aluna">Excluir</button></li>').join('')
    : '<li>(nenhuma aluna cadastrada)</li>';

  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Bastidores · Produção · ' + esc(escola) + '</title>' +
    '<style>' +
    'body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;margin:0;}' +
    '.topo{border-bottom:1px solid #c9a24b;padding:.9rem 1.25rem;background:#fdfaf2;}' +
    '.topo a{color:#6b2f2f;font-weight:700;text-decoration:none;margin-right:1.2rem;}' +
    '.corpo{max-width:44rem;margin:0 auto;padding:1.5rem 1.25rem;}' +
    '.corpo h1{color:#6b2f2f;}' +
    '.corpo h2{color:#6b2f2f;margin-top:1.6rem;}' +
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
    'ul li .dono{color:#8a7a5a;font-size:.85rem;}' +
    'button.apagar{margin-left:.7rem;padding:.15rem .55rem;background:#b25555;color:#fff;' +
    'border:none;border-radius:4px;font:600 .75rem/1.4 system-ui,sans-serif;cursor:pointer;}' +
    'button.apagar:hover{background:#8f3f3f;}' +
    'button.editar{margin-left:.7rem;padding:.15rem .55rem;background:#6b2f2f;color:#fff;' +
    'border:none;border-radius:4px;font:600 .75rem/1.4 system-ui,sans-serif;cursor:pointer;}' +
    '[hidden]{display:none!important;}' +
    '#gate{border:1px solid #c9a24b;background:#fdf6e3;border-radius:6px;padding:1rem;margin:1rem 0;}' +
    '</style></head><body>' +
    '<div class="topo"><a href="/bastidores">← Bastidores</a><span>Bastidores · Produção</span></div>' +
    '<div class="corpo">' +
    '<h1>Produção</h1>' +
    '<p>O gabinete da direção — só a direção entra. Cadastre professores e alunas, e ajuste o nome do dono.</p>' +
    '<div id="gate">' +
    '<form id="form-senha">' +
    '<label for="dsenha">Senha da direção</label>' +
    '<input id="dsenha" type="password" autocomplete="current-password" autofocus>' +
    '<button type="submit">Entrar</button>' +
    '</form>' +
    '<div class="res" id="res-gate"></div>' +
    '</div>' +
    '<div id="conteudo" hidden>' +
    '<h2>Cadastrar professor</h2>' +
    '<form id="form-prof">' +
    '<label for="pnome">Nome do professor</label>' +
    '<input id="pnome" name="nome" autocomplete="off" placeholder="ex.: Tiago">' +
    '<label for="psenha">Senha do professor</label>' +
    '<input id="psenha" name="senha" type="password" autocomplete="new-password">' +
    '<button type="submit">Cadastrar professor</button>' +
    '</form>' +
    '<h2>Cadastrar aluna</h2>' +
    '<form id="form-aluna">' +
    '<label for="anome">Apelido da aluna (estável, P-12)</label>' +
    '<input id="anome" name="apelido" autocomplete="off" placeholder="ex.: Vavá">' +
    '<button type="submit">Cadastrar aluna</button>' +
    '</form>' +
    '<div class="res" id="res"></div>' +
    '<h2>Professores cadastrados</h2><ul>' + itensProfs + '</ul>' +
    '<h2>Alunas cadastradas</h2><ul>' + itensAlunas + '</ul>' +
    '</div>' +
    '</div>' +
    '<script>' +
    'var SENHA_DIRECAO = "";' +
    'function entrar(senha) {' +
    '  var g = document.getElementById("res-gate");' +
    '  g.className = "res"; g.textContent = "verificando...";' +
    '  fetch("/api/bastidores/validar-producao", {' +
    '    method: "POST", headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify({senha: senha})' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) {' +
    '      SENHA_DIRECAO = senha;' +
    '      document.getElementById("gate").hidden = true;' +
    '      document.getElementById("conteudo").hidden = false;' +
    '    } else { g.className = "res erro"; g.textContent = "Senha não reconhecida."; }' +
    '  }).catch(function(err){ g.className = "res erro"; g.textContent = "Erro: " + err.message; });' +
    '}' +
    'document.getElementById("form-senha").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  entrar(document.getElementById("dsenha").value);' +
    '});' +
    'function postar(id, corpo) {' +
    '  corpo.senhaDirecao = SENHA_DIRECAO;' +
    '  var res = document.getElementById("res");' +
    '  res.className = "res"; res.textContent = "cadastrando...";' +
    '  return fetch(id === "form-prof" ? "/api/bastidores/professor" : "/api/bastidores/aluna", {' +
    '    method: "POST",' +
    '    headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify(corpo)' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) { location.reload(); }' +
    '    else { res.className = "res erro"; res.textContent = "Erro: " + (d.erro || "desconhecido"); }' +
    '  }).catch(function(err){ res.className = "res erro"; res.textContent = "Erro: " + err.message; });' +
    '}' +
    'document.getElementById("form-prof").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  postar("form-prof", {nome: document.getElementById("pnome").value, senha: document.getElementById("psenha").value});' +
    '});' +
    'document.getElementById("form-aluna").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  postar("form-aluna", {apelido: document.getElementById("anome").value});' +
    '});' +
    'document.addEventListener("click", function(e){' +
    '  var ed = e.target.closest("button.editar");' +
    '  if (ed) {' +
    '    var atual = ed.getAttribute("data-alvo");' +
    '    var nome = prompt("Novo nome do dono da escola:", atual);' +
    '    if (!nome || !nome.trim() || nome.trim() === atual) return;' +
    '    fetch("/api/bastidores/dono", {' +
    '      method: "POST", headers: {"Content-Type": "application/json"},' +
    '      body: JSON.stringify({nome: nome.trim(), senhaDirecao: SENHA_DIRECAO})' +
    '    }).then(function(r){ return r.json(); }).then(function(d){' +
    '      if (d.ok) { location.reload(); } else { alert("Erro: " + (d.erro || "desconhecido")); }' +
    '    }).catch(function(err){ alert("Erro: " + err.message); });' +
    '    return;' +
    '  }' +
    '  var b = e.target.closest("button.apagar"); if (!b) return;' +
    '  var alvo = b.getAttribute("data-alvo");' +
    '  var tipo = b.getAttribute("data-tipo");' +
    '  if (!confirm("Excluir " + alvo + "?")) return;' +
    '  var corpo = tipo === "aluna" ? {apelido: alvo} : {nome: alvo};' +
    '  corpo.senhaDirecao = SENHA_DIRECAO;' +
    '  fetch("/api/bastidores/" + tipo, {' +
    '    method: "DELETE",' +
    '    headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify(corpo)' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) { location.reload(); }' +
    '    else { alert("Erro: " + (d.erro || "desconhecido")); }' +
    '  }).catch(function(err){ alert("Erro: " + err.message); });' +
    '});' +
    '</script>' +
    '</body></html>';
}

/**
 * O handler dos Bastidores. Devolve `null` quando o caminho não é dos
 * Bastidores (a ponte de produção segue para o resto).
 */
async function fetch(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const ehBastidores = path === '/bastidores'
    || path === '/bastidores/estudio'
    || path === '/bastidores/producao'
    || path.startsWith('/api/bastidores');
  if (!ehBastidores) return null;

  const escola = escolaDe(env, url);
  if (!escola) return json(400, { ok: false, erro: 'escola ausente (ESCOLA_SLUG ou ?escola=)' });

  const kv = env && env.PADD_KV;
  if (!kv) return json(500, { ok: false, erro: 'PADD_KV ausente nos Bastidores' });

  // O grupo «Bastidores» — os DOIS itens: Estúdio (a cena) e Produção (o gabinete).
  if (path === '/bastidores') {
    return html(paginaHub(escola));
  }
  if (path === '/bastidores/estudio') {
    return html(paginaEstudio(escola));
  }
  if (path === '/bastidores/producao') {
    const [profs, aluns] = await Promise.all([professores(kv, escola), alunas(kv, escola)]);
    const dono = await nomeDoDono(env, kv, escola);
    return html(paginaProducao(escola, profs, aluns, dono));
  }

  // GET /api/bastidores/alunas — a lista para o seletor da anamnese.
  if (path === '/api/bastidores/alunas') {
    return json(200, { ok: true, escola, alunas: await alunas(kv, escola) });
  }

  // GET /api/bastidores/professores — só os NOMES (a senha nunca sai). O dono vem
  // primeiro (o nome editável no KV vence o secret), sem duplicar com os adicionais.
  if (path === '/api/bastidores/professores') {
    const profs = await professores(kv, escola);
    const dono = await nomeDoDono(env, kv, escola);
    const nomes = [];
    if (dono) nomes.push(dono);
    for (const p of profs) {
      if (p && p.nome && nomes.indexOf(p.nome) === -1) nomes.push(p.nome);
    }
    return json(200, { ok: true, escola, professores: nomes });
  }

  // POST /api/bastidores/professor — cadastrar professor (nome + senha).
  if (path === '/api/bastidores/professor' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const nome = String(corpo.nome || '').trim();
    const senha = String(corpo.senha || '');
    if (!nome || !senha) return json(400, { ok: false, erro: 'informe o nome e a senha do professor' });
    const lista = await professores(kv, escola);
    if (lista.some((p) => p.nome === nome)) return json(409, { ok: false, erro: 'já existe um professor com este nome' });
    const sal = gerarSal();
    const hash = await hashSenha(senha, sal);
    lista.push({ nome, sal, hash });
    await kv.put(RAIZ + '/' + escola + '/professores', JSON.stringify(lista));
    return json(201, { ok: true, professor: nome });
  }

  // POST /api/bastidores/aluna — cadastrar aluna (apelido estável).
  if (path === '/api/bastidores/aluna' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const apelido = String(corpo.apelido || '').trim();
    if (!apelido) return json(400, { ok: false, erro: 'informe o apelido da aluna' });
    const lista = await alunas(kv, escola);
    if (lista.indexOf(apelido) !== -1) return json(409, { ok: false, erro: 'já existe uma aluna com este apelido' });
    lista.push(apelido);
    await kv.put(RAIZ + '/' + escola + '/alunas', JSON.stringify(lista));
    return json(201, { ok: true, aluna: apelido });
  }

  // DELETE /api/bastidores/aluna — excluir aluna (apelido estável).
  if (path === '/api/bastidores/aluna' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const apelido = String(corpo.apelido || '').trim();
    if (!apelido) return json(400, { ok: false, erro: 'informe o apelido da aluna' });
    const lista = await alunas(kv, escola);
    const idx = lista.indexOf(apelido);
    if (idx === -1) return json(404, { ok: false, erro: 'aluna não encontrada' });
    lista.splice(idx, 1);
    await kv.put(RAIZ + '/' + escola + '/alunas', JSON.stringify(lista));
    return json(200, { ok: true, aluna: apelido, removida: true });
  }

  // DELETE /api/bastidores/professor — excluir professor cadastrado no KV.
  // O professor DONO (criado pela página `danca`) vive no SECRET PROFESSOR_NOME, não no
  // KV — este endpoint só remove os professores ADICIONAIS do KV. O dono não é tocado por
  // aqui (o segredo do Worker é outra fronteira, gerida pela página/Cloudflare).
  if (path === '/api/bastidores/professor' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const nome = String(corpo.nome || '').trim();
    if (!nome) return json(400, { ok: false, erro: 'informe o nome do professor' });
    // O dono pode ter o nome ajustado no KV — protege-se pelo nome RESOLVIDO, não só o secret.
    const donoNome = await nomeDoDono(env, kv, escola);
    if (donoNome && nome === donoNome) {
      return json(409, {
        ok: false,
        erro: 'este é o professor dono da escola (criado na página) — ajuste o nome, não o exclua',
      });
    }
    const lista = await professores(kv, escola);
    const idx = lista.findIndex((p) => p && p.nome === nome);
    if (idx === -1) return json(404, { ok: false, erro: 'professor não encontrado' });
    lista.splice(idx, 1);
    await kv.put(RAIZ + '/' + escola + '/professores', JSON.stringify(lista));
    return json(200, { ok: true, professor: nome, removido: true });
  }

  // POST /api/bastidores/dono — ajustar o NOME do professor dono (o criado na página).
  // O dono vive como SECRET (PROFESSOR_NOME/SENHA_PROFESSOR); o nome ajustado fica no KV
  // como SOBREPOSIÇÃO de exibição (`bastidores/<escola>/dono`). A SENHA do dono NÃO muda
  // por aqui (continua a do secret) — só o nome, que pode ter sido provisório.
  if (path === '/api/bastidores/dono' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const nome = String(corpo.nome || '').trim();
    if (!nome) return json(400, { ok: false, erro: 'informe o nome do dono da escola' });
    if (!String((env && env.PROFESSOR_NOME) || '').trim()) {
      return json(409, { ok: false, erro: 'não há professor dono (criado na página) para ajustar' });
    }
    await kv.put(RAIZ + '/' + escola + '/dono', JSON.stringify({ nome }));
    return json(200, { ok: true, dono: nome });
  }

  // POST /api/bastidores/validar-senha — a anamnese valida a senha do professor.
  // Fonte dupla: o secret `SENHA_PROFESSOR` (o professor criado pela página) OU a lista no KV.
  if (path === '/api/bastidores/validar-senha' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const senha = String(corpo.senha || '');
    if (!senha) return json(400, { ok: false, erro: 'informe a senha' });

    // O professor criado pela página vive no secret SENHA_PROFESSOR. O nome devolvido é o
    // RESOLVIDO (o KV vence o secret), para bater com a lista do seletor.
    if (env && env.SENHA_PROFESSOR && senha === env.SENHA_PROFESSOR) {
      const nome = await nomeDoDono(env, kv, escola);
      return json(200, { ok: true, professor: (nome || 'professor') });
    }

    const profs = await professores(kv, escola);
    let achou = null;
    for (const p of profs) {
      if (p.hash) {
        if ((await hashSenha(senha, p.sal)) === p.hash) { achou = p; break; }
      } else if (p.senha === senha) {
        // legado (pré-hash): aceita uma vez, para não quebrar escolas antigas.
        achou = p; break;
      }
    }
    return json(200, achou ? { ok: true, professor: achou.nome } : { ok: false, erro: 'senha não reconhecida' });
  }

  // POST /api/bastidores/validar-producao — a porta da Produção (só a direção).
  if (path === '/api/bastidores/validar-producao' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const senha = String(corpo.senha || '');
    if (!senha) return json(400, { ok: false, erro: 'informe a senha da direção' });
    // O professor criado na página é SEMPRE o dono (a marcação saiu): a senha da direção é
    // a do administrador OU a do professor dono.
    const okDirecao = senhaDaDirecaoOk(env, senha);
    return json(200, okDirecao
      ? { ok: true, direcao: true }
      : { ok: false, erro: 'senha da direção não reconhecida' });
  }

  return json(404, { ok: false, erro: 'não encontrado' });
}

module.exports = { fetch, temProfessor };
