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

/** A página da raiz: «Nós, Por Exemplo» + o botão/formulário de criar escola. */
function paginaDaRaiz() {
  return (
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Projeto Ciclo — raiz</title>' +
    '<style>' +
    'body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;margin:0;}' +
    '.topo{border-bottom:1px solid #c9a24b;padding:.9rem 1.25rem;background:#fdfaf2;}' +
    '.topo h1{margin:0;font-size:1.4rem;color:#6b2f2f;}' +
    '.corpo{max-width:40rem;margin:0 auto;padding:1.5rem 1.25rem;}' +
    '.corpo p{color:#6b5b4a;}' +
    '.acao{display:inline-block;margin-top:.5rem;padding:.6rem 1.1rem;background:#6b2f2f;color:#fff;' +
    'border:none;border-radius:6px;font:600 .95rem/1.2 system-ui,sans-serif;cursor:pointer;}' +
    '.form{border:1px solid #c9a24b;background:#fdf6e3;border-radius:6px;padding:1rem;margin-top:1rem;display:none;}' +
    '.form.aberto{display:block;}' +
    '.form label{display:block;margin:.5rem 0 .2rem;font-size:.9rem;color:#6b2f2f;}' +
    '.form input{width:100%;box-sizing:border-box;padding:.45rem .6rem;font:1rem/1.4 system-ui,sans-serif;' +
    'border:1px solid #c9a24b;border-radius:4px;}' +
    '.res{margin-top:1rem;padding:.7rem .9rem;border-radius:6px;display:none;}' +
    '.res.ok{display:block;background:#eef7ee;border:1px solid #4f8a4f;color:#2f5d2f;}' +
    '.res.erro{display:block;background:#fdeaea;border:1px solid #b25555;color:#7a2f2f;}' +
    '</style></head><body>' +
    '<div class="topo"><h1>Projeto Ciclo — raiz</h1></div>' +
    '<div class="corpo">' +
    '<h1>Nós, Por Exemplo</h1>' +
    '<p>Esta é a raiz do sistema — não é uma escola. Daqui você cria uma escola nova. Cada escola ' +
    'nasce no estado «zero»: a página «Nós, Por Exemplo» + a «Área do Professor» (Plano de Observação e ' +
    'Anamnese) desabilitada, até o administrador cadastrar um professor nos Bastidores.</p>' +
    '<button class="acao" id="btn-criar" type="button">Criar nova escola</button>' +
    '<form class="form" id="form-criar">' +
    '<label for="nome">Nome da escola</label>' +
    '<input id="nome" name="nome" autocomplete="off" placeholder="ex.: Maria">' +
    '<label for="senha">Senha do administrador</label>' +
    '<input id="senha" name="senha" type="password" autocomplete="new-password">' +
    '<button class="acao" type="submit" style="margin-top:.9rem;">Criar</button>' +
    '</form>' +
    '<div class="res" id="res"></div>' +
    '</div>' +
    '<script>' +
    'var btn=document.getElementById("btn-criar"), form=document.getElementById("form-criar");' +
    'btn.addEventListener("click",function(){form.classList.toggle("aberto");});' +
    'form.addEventListener("submit",function(e){' +
    '  e.preventDefault();' +
    '  var res=document.getElementById("res");' +
    '  res.className="res"; res.textContent="criando...";' +
    '  fetch("api/criar-escola",{' +
    '    method:"POST",' +
    '    headers:{"Content-Type":"application/json"},' +
    '    body:JSON.stringify({nome:document.getElementById("nome").value,' +
    '      senhaAdmin:document.getElementById("senha").value})' +
    '  }).then(function(r){return r.json();}).then(function(d){' +
    '    if(d.ok){' +
    '      res.className="res ok";' +
    '      res.innerHTML="Escola criada: <a href=\\""+d.url+"\\">"+d.url+"</a>";' +
    '    }else{' +
    '      res.className="res erro"; res.textContent="Erro: "+(d.erro||"desconhecido");' +
    '    }' +
    '  }).catch(function(err){' +
    '    res.className="res erro"; res.textContent="Erro: "+err.message;' +
    '  });' +
    '});' +
    '</script>' +
    '</body></html>'
  );
}

/** O freio da raiz: sem a senha, nada se vê (nem a página, nem a rota de criar). */
function autorizado(request, env) {
  const senha = env && env.SENHA_RAIZ;
  if (!senha) return false;
  const esperado = 'Basic ' + btoa('admin:' + senha);
  return request.headers.get('Authorization') === esperado;
}

async function fetch(request, env) {
  if (!autorizado(request, env)) {
    return new Response('autenticação necessária', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="danca", charset="UTF-8"',
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });
  }

  const url = new URL(request.url);

  if (url.pathname === '/' || url.pathname === '/index.html') {
    return new Response(paginaDaRaiz(), {
      status: 200,
      headers: { 'Content-Type': 'text/html;charset=utf-8' },
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

  return new Response('não encontrado', { status: 404 });
}

module.exports = { fetch };
