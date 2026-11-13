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
 *   6. POST /zones/{zona}/dns_records                   — o registo A de <escola>.padd.com.br;
 *   7. POST /zones/{zona}/workers/routes                — a rota <escola>.padd.com.br/* ao script;
 *   8. POST …/actions/workflows/criar-escola.yml/dispatches — o deploy do motor completo.
 *
 * OS PASSOS 6 E 7 NÃO DERRUBAM A CRIAÇÃO (13/11/2026). Sem eles a escola existe e não tem
 * endereço próprio; com eles a falhar, ela nasce na mesma e o resultado diz o que ficou pendente
 * e o que fazer. A alternativa — abortar a escola porque falta uma permissão no token — trocaria
 * um endereço em falta por uma escola que não nasce, e a segunda é pior.
 */

// O Worker «zero» é só a página de «implantação em andamento» — não usa KV. O KV de
// produção (com as chaves prefixadas por escola) entra quando o motor completo sobe,
// pelo `wrangler.<escola>.jsonc` gerado no `tools/criar-escola.sh`.
const SUBDOMINIO = 'tmenegaz77';

// A FOLHA das páginas de estado é a MESMA do sistema. O Worker «zero» é gerado como
// texto e não pode dar `require` em produção, então o CSS entra embutido aqui — uma
// vez, da fonte que o validador confere.
const { CSS: CSS_ESTADO } = require('./estado-html.js');
// O desfazer REUSA a remoção do expurgo (`subdomínio` → `script`, nessa ordem). Uma segunda
// definição de «como se apaga um Worker» divergiria da primeira, e a que ficasse para trás
// seria a que deixa o subdomínio ligado a um script que já não existe.
const { excluirEscola } = require('./expurgar-escola.js');
/* O ENDEREÇO PRÓPRIO DA ESCOLA (13/11/2026) — o registo DNS e a rota de `<escola>.padd.com.br`,
 * criados por dentro do sistema. A pesquisadora: «toda vez eu tenho que ir lá e falar qual é a
 * zona... isso não é legal de fazer toda vez». Ver `dominio-da-escola.js`. */
const dominioDaEscola = require('./dominio-da-escola.js');

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

/**
 * O MARCADOR DO PLACEHOLDER — a primeira linha do módulo «zero».
 *
 * Existe para ser RECONHECIDO depois: é a única evidência, do lado do Cloudflare, de que um
 * Worker é o andaime de uma escola que ainda não nasceu. Sem ele, um Worker de 592 bytes e uma
 * escola de verdade são indistinguíveis por fora — e foi essa indistinção que deixou a `valsa`
 * no ar durante horas a dizer «recarregue em instantes» a uma escola que nunca existiu.
 */
function linhaDoPlaceholder(escola) {
  return '// escola ' + escola + ' — Worker «zero» (implantação em andamento, gerado por provisionar-escola.js)';
}

/** O prelúdio que o esbuild põe em TODO bundle do motor. O placeholder, escrito à mão, não o tem. */
const PRELUDIO_DO_MOTOR = 'var __create = Object.create;';

/**
 * Este código é o Worker «zero» DESTA escola?
 *
 * A pergunta é a de um ROLLBACK, e por isso ela é assimétrica: na dúvida, a resposta é «NÃO».
 * Um falso positivo apaga uma escola viva; um falso negativo deixa um órfão de 592 bytes, que
 * alguém apaga à mão. Os dois erros não custam o mesmo.
 *
 * Três condições, e todas podem falhar para o lado seguro:
 *   1. a linha do placeholder, COM o slug — a marca de outra escola não serve;
 *   2. o prelúdio do motor NÃO pode estar lá. Se estiver, é um bundle: nunca se apaga, mesmo
 *      que a marca apareça (um `require` futuro pode arrastar este ficheiro para dentro do
 *      motor, e a marca viajaria com ele);
 *   3. quando o nome de exibição é conhecido, ele tem de estar no módulo.
 */
function ehPlaceholder(codigo, { escola, nome } = {}) {
  const texto = String(codigo || '');
  if (!texto || !escola) return false;
  if (!texto.includes(linhaDoPlaceholder(escola))) return false;
  if (texto.includes(PRELUDIO_DO_MOTOR)) return false;
  if (nome && !texto.includes('const NOME = ' + JSON.stringify(nome) + ';')) return false;
  return true;
}

/** O módulo ESM da escola «zero» — a página de «implantação em andamento». */
function scriptDaEscola(escola, nome) {
  // O worker fonte usa SÓ aspas simples (sem backticks, sem `${`, sem `\u`, sem `\n`),
  // para este template literal de fora não interpretar nada além de NOME e CSS.
  return `${linhaDoPlaceholder(escola)}
const NOME = ${JSON.stringify(nome)};
const CSS = ${JSON.stringify(CSS_ESTADO)};

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pagina(titulo, corpo) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Sistema Lastro · ' + esc(titulo) + '</title>' +
    '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">' +
    '<style>' + CSS + '</style></head><body><main>' +
    '<h1>' + esc(titulo) + '</h1>' + corpo + '</main></body></html>';
}

function paginaInicial() {
  return pagina('Sistema Lastro',
    '<p>Esta é a escola <b>' + esc(NOME) + '</b>. O motor completo (Bastidores, anamnese, ' +
    'plano de ensino e plano de observação) está sendo implantado — recarregue em instantes.</p>');
}

export default {
  async fetch(request, env) {
    if (env.ESCOLA_HABILITADA === 'nao') {
      return new Response(
        pagina('Escola desabilitada',
          '<p>Esta escola está desabilitada para resolver problemas diversos.</p>'),
        { status: 503, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
    }
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(paginaInicial(), { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
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

/** Cria a escola no Cloudflare. Devolve `{ escola, nome, url }` — e NÃO a chave. */
async function criarEscola(opcoes) {
  const escola = slugificar(opcoes.nome);
  if (!escola) throw new ErroDeProvisionamento('slug', 'o nome da escola não produz um slug válido');

  if (await escolaExiste(opcoes.token, opcoes.accountId, escola)) {
    throw new ErroDeProvisionamento('existe', 'a escola "' + escola + '" já existe — não se sobrescreve (a proveniência acrescenta, não edita)');
  }

  // O ROLLBACK MORA AQUI, e não em quem chama — porque quem cria é quem tem de desfazer.
  //
  // A partir da linha seguinte existe um Worker no Cloudflare e NADA no Git. Se o
  // provisionamento morre a meio (um segredo recusado, a rede, o tempo), sem isto o
  // placeholder fica no ar a responder 200 no subdomínio de uma escola que não existe — foi
  // a `valsa`, por cinco segundos de diferença entre a criação e a morte do workflow.
  //
  // `desfazerPlaceholder` é que decide se apaga: ele LÊ o que está no ar e só toca no
  // placeholder DESTA escola. Aqui não se decide nada — só se garante que alguém pergunta.
  // O resultado vai no erro (`err.desfeito`) para quem responde poder dizê-lo.
  try {
    return await provisionarEscolaZero(opcoes, escola);
  } catch (err) {
    err.desfeito = await desfazerPlaceholder({
      token: opcoes.token,
      accountId: opcoes.accountId,
      escola,
      nome: opcoes.nome,
    });
    throw err;
  }
}

/** Os passos 1–6 do provisionamento. Separado para o `criarEscola` poder desfazê-los num só lugar. */
async function provisionarEscolaZero({ nome, senhaAdmin, token, accountId, githubToken, professorNome, professorSlug, senhaProfessor, professorEhDono, zona }, escola) {
  const base = '/accounts/' + accountId + '/workers';

  // 1. o script da escola (módulo ESM) + o freio ESCOLA_HABILITADA.
  await subirModulo(token, accountId, escola, scriptDaEscola(escola, nome));

  // 2. liga o subdomínio workers.dev.
  await api('subdominio', token, 'POST', base + '/scripts/' + escola + '/subdomain', { enabled: true });

  // 2.1 O ENDEREÇO PRÓPRIO — o registo DNS e a rota de `<escola>.padd.com.br` (13/11/2026).
  //
  //     AQUI, E NÃO DEPOIS DO DISPARO, de propósito: o Worker «zero» existe desde o passo 1, e
  //     portanto o endereço próprio já responde «implantação em andamento» em vez de dar 1016
  //     («origin DNS error»). Quem cria a escola e abre o endereço no mesmo minuto vê a página
  //     certa, e não um erro de DNS que parece o sistema estar quebrado.
  //
  //     NÃO LANÇA: o resultado (com o que faltou e a dica) viaja na resposta. Uma escola sem
  //     endereço próprio é uma pendência; uma escola que não nasce é um fracasso.
  /* A ZONA VEM DE QUEM CHAMA, e não de `process.env`: no runtime do Worker não há `process`.
   * O `raiz.js` passa `env.ZONA_ESCOLAS`; sem ela, o módulo usa o `padd.com.br` desta casa. */
  const dominio = await dominioDaEscola.ligarDominio({
    token,
    escola,
    script: escola,
    zona: zona || undefined,
  });

  // 3. a senha do administrador da escola (a direção — nunca em claro no repo; só no Worker).
  await api('senha', token, 'PUT', base + '/scripts/' + escola + '/secrets', {
    name: 'SENHA_ADMIN',
    text: senhaAdmin,
    type: 'secret_text',
  });

  // 4. a senha de CRIPTOGRAFIA (a que cifra o `-dados.json` e os acompanhamentos), gerada aqui e
  //    que NUNCA sai daqui. O caminho (a): a senha nasce no Cloudflare e morre no Cloudflare —
  //    não vai ao repositório, não vai ao GitHub e (desde 15/10/2026) NÃO é exibida a ninguém.
  //
  //    O QUE MUDOU, E POR QUÊ. Até 15/10 ela era devolvida na resposta e a página mandava
  //    guardá-la num arquivo local. O dono do produto apontou o absurdo: *«pra mim, como usuário,
  //    isso já deveria ser automático»*. Ele está certo — quem gera a chave também a USA (é este
  //    mesmo Worker que cifra o `-dados.json` do pacote, no «Guardar» do PO), então não há por que
  //    ela passar pela mão de alguém. Quem precisa ABRIR é o navegador, e para isso o Worker
  //    decifra sob autenticação (`ler-dados.js`), sem nunca revelar a chave.
  //
  //    CONSEQUÊNCIA DECLARADA: o segredo do Cloudflare é WRITE-ONLY — não há como lê-lo de volta,
  //    nem pelo painel nem pela API. Sem a exibição, a chave torna-se IRRECUPERÁVEL por qualquer
  //    pessoa. Isso é deliberado (é o que a torna interna), e o seu custo está registrado no
  //    REGISTRO.md: as ferramentas LOCAIS que precisam da chave (o `gerar-acompanhamento.sh`, que
  //    cifra a página de cada aluna com o pagecrypt) passam a depender de a cifra migrar para o
  //    Worker. Quando o dono do produto precisar da chave para uma dessas, ela se REGENERA (o que
  //    invalida o que estava cifrado com a antiga) ou a operação migra para cá.
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

  // 6. o professor (nome + senha) que a página coleta: vira secret do Worker (persiste no
  //    deploy do motor) e é o que HABILITA a «Área do Professor». Nunca em claro no repo.
  if (professorNome && senhaProfessor) {
    await api('professor-nome', token, 'PUT', base + '/scripts/' + escola + '/secrets', {
      name: 'PROFESSOR_NOME',
      text: professorNome,
      type: 'secret_text',
    });
    // O SLUG DA PASTA, DECLARADO — não derivado (17/10/2026).
    //
    // O motor monta `professores/<professor>/…` com o slug, e até aqui o slug saía do NOME DE
    // EXIBIÇÃO (`slugificar(PROFESSOR_NOME)`). Isso ata duas coisas que não são a mesma: a
    // etiqueta e a pasta. Quem cria a pasta é o workflow (`--professor`), e o nome de exibição é
    // texto livre. Com «Tiago Menegaz» os dois coincidiam por sorte; com «Tiago» — o nome curto
    // que alguém digita — o slug virava `tiago` e a pasta é `tiago-menegaz`. O PO seria escrito
    // em `professores/tiago/`, uma pasta fantasma, e a âncora do ciclo nunca o veria.
    //
    // A identidade passa a ser DECLARADA aqui, e o motor prefere-a ao nome. Um Worker antigo,
    // sem este secret, continua a derivar do nome — é o que mantém as escolas já criadas a
    // funcionar sem migração.
    if (professorSlug) {
      await api('professor-slug', token, 'PUT', base + '/scripts/' + escola + '/secrets', {
        name: 'PROFESSOR_SLUG',
        text: professorSlug,
        type: 'secret_text',
      });
    }
    await api('professor-senha', token, 'PUT', base + '/scripts/' + escola + '/secrets', {
      name: 'SENHA_PROFESSOR',
      text: senhaProfessor,
      type: 'secret_text',
    });
    // «O professor é o dono da escola» — agora SEMPRE sim: quem cria a escola pela página é a
    // pesquisadora, e o professor inicial é a pessoa de contato (a direção). A marcação saiu
    // do formulário; este secret só fica para o que ainda o lê por compatibilidade.
    await api('professor-eh-dono', token, 'PUT', base + '/scripts/' + escola + '/secrets', {
      name: 'PROFESSOR_EH_DONO',
      text: 'sim',
      type: 'secret_text',
    });
  }

  return {
    escola,
    nome,
    url: 'https://' + escola + '.' + SUBDOMINIO + '.workers.dev',
    /* O ENDEREÇO PRÓPRIO VAI JUNTO, e com `ok` próprio: quem mostra a escola criada tem de poder
     * dizer as duas coisas — «está no ar neste endereço» e «o endereço próprio ficou pendente,
     * falta isto». Esconder a pendência seria pior do que não a ter. */
    dominio,
    urlPropria: dominio && dominio.ok ? dominio.url : null,
  };
}

/**
 * LÊ o código que está no ar num Worker. `{ existe, codigo, status }` — nunca lança.
 *
 * A resposta da API é multipart/form-data (o módulo vem num `Blob`), e o que interessa é o
 * texto: o marcador do placeholder vive dentro dele. Devolve-se o corpo cru de propósito —
 * extrair o módulo do multipart exigiria um parser que o runtime do Worker não tem, e a
 * comparação por `includes` não precisa dele.
 */
async function lerCodigoDoWorker({ token, accountId, escola }) {
  try {
    const res = await fetch(
      'https://api.cloudflare.com/client/v4/accounts/' + accountId + '/workers/scripts/' + escola,
      { method: 'GET', headers: { 'Authorization': 'Bearer ' + token } }
    );
    if (res.status === 404) return { existe: false, codigo: '', status: 404 };
    if (!res.ok) return { existe: true, codigo: '', status: res.status, erro: 'HTTP ' + res.status };
    return { existe: true, codigo: await res.text(), status: res.status };
  } catch (err) {
    return { existe: true, codigo: '', status: 0, erro: (err && err.message) || String(err) };
  }
}

/**
 * DESFAZ o Worker «zero» — o rollback de uma escola que não chegou a nascer.
 *
 * Porque existe: `criarEscola` cria o Worker ANTES de existir qualquer artefacto no Git, e o
 * motor completo nasce depois, no workflow. Se o workflow falha (ou se o disparo falha, ou se
 * o próprio provisionamento morre a meio), o Worker «zero» fica no ar **para sempre** — a
 * responder 200 no subdomínio de uma escola que não existe, com uma página que manda
 * «recarregue em instantes». Foi o caso da `valsa` (17/10/2026): criada às 09:36:04Z, o
 * workflow morto às 09:36:09Z, e 592 bytes de mentira no ar até alguém reparar.
 *
 * A REGRA É A EVIDÊNCIA, NÃO A INTENÇÃO: apaga-se apenas se o que está no ar ainda for o
 * placeholder DESTA escola. Uma escola a sério — mesmo que o deploy tenha sido o último passo
 * a falhar — nunca é tocada. Na dúvida (não consegui ler o código, a resposta não é
 * conclusiva), NÃO se apaga: um órfão de 592 bytes vê-se e apaga-se à mão; uma escola apagada
 * por engano não se recupera.
 *
 * Não lança: devolve `{ removido, motivo, ... }`. Quem chama está a tratar um erro — um
 * segundo erro aqui apagaria a causa do primeiro.
 */
async function desfazerPlaceholder({ token, accountId, escola, nome }) {
  if (!escola) return { removido: false, motivo: 'sem-escola' };
  if (!token) return { removido: false, motivo: 'sem-token' };

  const leitura = await lerCodigoDoWorker({ token, accountId, escola });
  if (!leitura.existe) return { removido: false, motivo: 'nao-existe' };
  if (leitura.erro || !leitura.codigo) {
    return { removido: false, motivo: 'nao-confirmado', erro: leitura.erro || 'corpo vazio' };
  }
  if (!ehPlaceholder(leitura.codigo, { escola, nome })) {
    return { removido: false, motivo: 'nao-e-placeholder' };
  }

  // Sem KV: o Worker «zero» não tem binding de KV nem escreve nada — o namespace só é ligado
  // no deploy do motor. Nunca houve chave desta escola para limpar.
  //
  // O ENDEREÇO PRÓPRIO TAMBÉM SE DESFAZ (13/11/2026), e antes do script: a rota aponta a um script
  // que está prestes a deixar de existir, e uma rota órfã só dá erro a quem abrir o endereço. O
  // `desligarDominio` só apaga o que tem a nossa marca (ver o módulo), portanto um subdomínio
  // alheio com o mesmo nome fica onde está.
  const dominio = await dominioDaEscola.desligarDominio({ token, escola, script: escola })
    .catch(() => null);
  const resultado = await excluirEscola({ token, accountId, slug: escola, worker: escola });
  if (dominio) resultado.dominio = dominio;
  const removido = Boolean(resultado && resultado.script && resultado.script.ok);
  return {
    removido,
    motivo: removido ? 'removido' : 'remocao-recusada',
    resultado,
  };
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

module.exports = {
  criarEscola,
  dispararCriacao,
  atualizarEscola,
  slugificar,
  scriptDaEscola,
  subirModulo,
  // O rollback do órfão: reconhecer o placeholder e desfazê-lo.
  desfazerPlaceholder,
  ehPlaceholder,
  lerCodigoDoWorker,
  linhaDoPlaceholder,
};
