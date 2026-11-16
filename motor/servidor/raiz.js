'use strict';

/**
 * raiz.js — o Worker RAIZ do sistema (`danca.padd.com.br`; o `danca.tmenegaz77.workers.dev`
 * continua a responder, mas é endereço técnico e não se mostra a ninguém).
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
/* O CADASTRO DA ESCOLA E DO PROFESSOR PRINCIPAL (25/11/2026) — as regras, e as chaves do KV em que
 * os dados pessoais ficam. Fora do índice versionado, por decisão declarada: a verificação 7 do
 * `check-indices` proíbe `email` e `telefone` nos índices do acervo, e o CPF e o CNPJ não têm
 * melhor sorte — o repositório é público para quem tem o token.
 *
 * A METADE DO SERVIDOR (gravar/ler) está aqui em baixo, no `gravarCadastro`: ela precisa do KV, e
 * o núcleo não sabe o que é um KV. */
const cadastroDaEscola = require('../nucleo/cadastro-da-escola.js');
const correio = require('./correio.js');
/* A COMPOSIÇÃO COMERCIAL (25/11/2026) — os planos, a capacidade e a conta, de uma fonte só
 * (`biblioteca/comercial/planos.json`). Nenhum preço se escreve em código. */
const comercial = require('../nucleo/comercial.js');
/* O diagnóstico do endereço próprio (`/api/dominio`) — o mesmo módulo que o provisionamento usa
 * para criar o registo e a rota. É de propósito: o diagnóstico não pode ter uma segunda opinião
 * sobre o que é «ter endereço». */
const dominioDaEscola = require('./dominio-da-escola.js');
const { excluirEscola, apagarChavesDeEscola, prefixosDaEscola } = require('./expurgar-escola.js');
const {
  listarEscolas, listarEscolasPeloIndice, listarProfessores, listarProfessoresPeloIndice,
  apagarEscolaDoRepo, lerArquivo, auditarProvenienciaDaEscola,
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

/**
 * OS SCRIPTS DE CONFRANÇA — de quem pode ser uma rota que a casa criou (15/11/2026).
 *
 * O `env.SHARD_SCRIPT` é a declaração de que este sistema serve escolas por um shard. Vazio (o
 * regime de um Worker por escola), a lista fica só com o script da própria escola — como era.
 *
 * A lista é DECLARADA no `env` e nunca vem do pedido: é a diferença entre «esta rota é desta casa»
 * e «apaga a rota que o visitante disser». É a mesma disciplina da marca do registo DNS.
 */
function scriptsDeConfianca(env) {
  const shard = String((env && env.SHARD_SCRIPT) || '').trim();
  return shard ? [shard] : [];
}

/**
 * A COMPARAÇÃO DE DOIS SEGREDOS, sem devolver o tempo ao atacante (15/11/2026).
 *
 * Um `a === b` sai no primeiro byte diferente, e a diferença de tempo — nanossegundos, mas real —
 * diz a quem mede quantos caracteres já acertou. Aqui percorre-se sempre o comprimento todo, e o
 * resultado acumula-se sem curto-circuito.
 *
 * O comprimento diferente responde `false` DEPOIS de percorrer o mais curto: o tempo já não
 * distingue onde a diferença está, e só diz que os comprimentos não batem (que é informação que um
 * atacante tem de qualquer forma, ao tentar).
 */
function mesmoSegredo(a, b) {
  const x = String(a == null ? '' : a);
  const y = String(b == null ? '' : b);
  const n = Math.max(x.length, y.length);
  let diferente = x.length === y.length ? 0 : 1;
  for (let i = 0; i < n; i += 1) {
    diferente |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  }
  return diferente === 0;
}

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
  const escolas = acervo.escolas.map((e) => ({
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
  // A LISTA E OS NOMES SAEM DA MESMA LEITURA. Quem chama usa as duas coisas: a tabela mostra a
  // PESSOA (nome) e ordena por ela; o slug continua a ser a identidade.
  return [escolas, acervo.professores || []];
}

/**
 * A LISTA DE ESCOLAS **COM** O ESTADO COMERCIAL (25/11/2026).
 *
 * A tabela das vivas passou a ter uma coluna que não vem do índice: o estado comercial vive no KV,
 * por escola (`bastidores/<escola>/comercial`). Ler os dois numa função só evita o defeito clássico
 * desta casa — duas leituras, duas opiniões sobre o mesmo instante — e mantém a lista com UMA
 * chamada ao repositório, como antes.
 *
 * A LEITURA DO KV É POR ESCOLA, e são poucas: um `get` por linha da tabela. Não se enumera o
 * namespace (ao contrário da criação, onde a varredura é precisa), porque a lista já sabe os slugs
 * e enumerar traria as chaves de todas as escolas para responder sobre as que estão à vista.
 */
async function escolasDoIndiceComComercial({ token, kv }) {
  const [escolas, professores] = await escolasDoIndice({ token });
  /* OS DESCONTOS SÃO LIDOS UMA VEZ, e não uma por escola (25/11/2026). Estão numa chave só
   * (`financeiro/descontos`), precisamente para isto: a lista das vivas abre muitas vezes, e uma
   * leitura por linha seria uma leitura por escola em cada abertura — a mesma família de erro que
   * esgotou a cota diária do KV em 18/10/2026. */
  const descontos = await lerDescontos(kv);
  const porEscola = new Map();
  for (const d of descontos) porEscola.set(d.escola, d);
  const comEstado = [];
  for (const e of escolas) {
    const comercial = await lerComercial(kv, e.slug);
    comEstado.push(Object.assign({}, e, {
      comercial: {
        estado: comercial.estado,
        plano: comercial.plano || null,
        planoNome: comercial.planoNome || null,
        valor: comercial.valor || null,
        atualizadoEm: comercial.atualizadoEm || null,
        /* AS DUAS DATAS QUE A LISTA MOSTRA (25/11/2026), e a carência que sai delas. A conta é
         * feita AQUI, uma vez, e não na página: o HTML não sabe que meses têm 28 dias, e uma
         * segunda regra de contagem dentro do desenho divergiria da primeira. */
        habilitadaEm: comercial.habilitadaEm || null,
        desabilitadaEm: comercial.desabilitadaEm || null,
        carenciaAte: carenciaAte(comercial.desabilitadaEm),
        desconto: porEscola.get(e.slug) || null,
      },
    }));
  }
  return [comEstado, professores];
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
/**
 * O DESFECHO DO KV QUE VAI PARA O ELO — e o ramo que faltava (01/11/2026).
 *
 * O DEFEITO, medido no expurgo da `batata` a 01/11/2026. O elo 6 de
 * `escola/batata/indice.json` ficou **sem** o bloco `kv`, enquanto os elos 2 a 5 o têm
 * (`ok:true, restantes:0`). A rota lia o desfecho por
 * `relatorio.cloudflare.kv` — e quando `excluirEscola` LANÇA (é o que acontece quando a
 * enumeração do KV estoura a cota diária), o `catch` grava `{ erro, morada }` e o `kv`
 * nunca existe. `kvDoExpurgo` ficava `undefined`, o elo recebia `kv: null`, e
 * `pendenciaDoKv` — que só reconhece `kv.pendente === true` — respondia «nada pendente».
 *
 * O efeito é o pior dos mundos: a escola sai do ar e do repositório, as chaves podem ter
 * ficado, e **a retomada (`POST /api/expurgar-kv`) fica cega** — porque é do elo que ela lê
 * o namespace. O comentário que está no passo 4 dizia exactamente isto, e o `?:` de uma
 * linha anulava-o em silêncio.
 *
 * A REGRA: quando a escola DECLARA namespace (`morada.kvNamespaceId`), o elo regista o
 * desfecho do KV **sempre** — mesmo que a metade Cloudflare tenha explodido antes de o
 * saber. Quando não declara, não há o que limpar, e não se inventa pendência.
 *
 * Devolve `null` (escola sem KV declarado) ou o bloco `kv` do elo. `ok:false` faz
 * `comElo` marcar `pendente: true` e a retomada a encontrar.
 */
function desfechoDoKvParaOElo({ cloudflare, morada, slug }) {
  const namespaceId = (morada && morada.kvNamespaceId) || null;
  const prefixos = prefixosDaEscola(slug);
  const kv = cloudflare && cloudflare.kv;
  if (kv) {
    const bloco = {
      ok: kv.ok === true,
      apagadas: kv.apagadas,
      restantes: kv.restantes,
      namespaceId,
      prefixos,
    };
    // O PORQUÊ viaja com o elo. Sem ele, a pendência diz «não deu» e deixa a próxima sessão
    // a adivinhar se foi cota, permissão ou rede.
    if (kv.erro) bloco.erro = String(kv.erro);
    return bloco;
  }
  if (!namespaceId) return null;
  const doExpurgo = cloudflare && cloudflare.erro;
  return {
    ok: false,
    apagadas: null,
    restantes: null,
    namespaceId,
    prefixos,
    erro: doExpurgo
      ? 'a metade Cloudflare falhou antes de dizer o das chaves: ' + doExpurgo
      : 'a limpeza do KV não devolveu desfecho — não se sabe o que ficou nas chaves',
  };
}

async function moradaDaEscola({ token, slug, fetchImpl }) {
  const caminho = 'wrangler.' + slug + '.jsonc';
  const texto = await lerArquivo({ token, dono: DONO, repo: REPO, ref: REF, caminho, fetchImpl });
  /* A ESCOLA DE UM SHARD NÃO TEM CONFIG PRÓPRIA (15/11/2026) — e é o ÍNDICE que diz isso.
   *
   * Num shard, `wrangler.<escola>.jsonc` não existe: seria ela que faria o `deploy-escolas` subir
   * mais um Worker. A morada da escola passa a estar em `escola/<slug>/indice.json`, no campo
   * `shard` que o `criar-escola.sh --shard` grava.
   *
   * Porque é que isto importa ao EXPURGO: a rota de uma escola de shard aponta ao script do shard.
   * Sem esta leitura, o expurgo procuraria um script com o nome da escola, não encontraria — e
   * deixaria a rota no ar, com a escola a responder num endereço que já devia estar morto.
   *
   * O `worker` devolvido é o do SHARD, e é de propósito: o `excluirEscola` trata um `worker`
   * diferente do `slug` como «não apagues este script, ele não é uma escola». */
  if (!texto) {
    const doIndice = await lerArquivo({
      token, dono: DONO, repo: REPO, ref: REF, caminho: 'escola/' + slug + '/indice.json', fetchImpl,
    });
    let shard = '';
    try { shard = String((JSON.parse(doIndice) || {}).shard || '').trim(); } catch (erro) { shard = ''; }
    if (!shard) return null;
    return { worker: shard, shard, kvNamespaceId: null, arquivo: 'escola/' + slug + '/indice.json', legivel: true };
  }
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
    /* O SHARD E O MAPA VÃO JUNTO (15/11/2026). O `scripts` diz de quem é uma rota que não tem o
     * nome da escola — num shard a rota aponta ao `lastro-teste`, e sem isto a limpeza não a
     * apagava; o `mapaKv` tira a escola do mapa, que é a lista que diz quais existem. */
    relatorio.expurgadas.push(await excluirEscola({
      token, accountId: ACCOUNT_ID, slug, worker: reg.worker, kv: reg.kv,
      scripts: scriptsDeConfianca(env), mapaKv: env && env.PADD_KV,
    }));
  }
  return relatorio;
}

/** O handler do Cron Trigger: apaga sem ninguém clicar, e loga o relatório. */
async function scheduled(event, env, ctx) {
  const relatorio = await expurgar(env);
  console.log('[expurgo] ' + JSON.stringify(relatorio));
}

/**
 * A CRIAÇÃO DA ESCOLA — UMA VEZ, PARA AS DUAS PORTAS (25/11/2026).
 *
 * O bloco estava dentro do `fetch`, atrás do portão da `SENHA_RAIZ`. Com a página pública
 * (`lastro.padd.com.br`) a criar a MESMA escola, ele passou a ter dois chamadores — e duas cópias
 * de um percurso de duzentas linhas que cria Worker, escreve no KV, dispara o workflow e desfaz
 * tudo quando o disparo falha divergiriam na primeira correcção. Uma função, duas portas.
 *
 * O QUE MUDA ENTRE AS PORTAS VAI EM `opcoes`, e nada mais:
 *   · `origem` — `'painel'` (a página do proprietário) ou `'publico'` (a página aberta). Vai para
 *     o registo da escola: quem criou é um facto que a proveniência guarda, e um dia se pergunta.
 *   · `exigirCadastro` — a página pública RECOLHE o CNPJ, o e-mail e o telefone da escola; a do
 *     proprietário continua a criar escolas de teste sem eles. O que é obrigatório numa porta não
 *     é obrigatório na outra, e isso é declarado aqui, num sítio só.
 */
async function responderCriacao(request, env, opcoes) {
  const origem = (opcoes && opcoes.origem) || 'painel';
  const exigirCadastro = Boolean(opcoes && opcoes.exigirCadastro);
  const responderJson = (objeto, status) => new Response(JSON.stringify(objeto), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
  });
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

    /* O CADASTRO — CNPJ, e-mails, telefones e a HABILIDADE (25/11/2026). A regra é uma
     * (`motor/nucleo/cadastro-da-escola.js`) e as portas são duas; o que muda é `exigirCadastro`.
     *
     * A LISTA DE MODALIDADES VEM DO CATÁLOGO, e não de uma cópia: `perfil-do-professor.js` lê
     * `biblioteca/modalidades/modalidades.json`, que é o mesmo ficheiro que a tela dos Bastidores
     * mostra. Um id que não esteja ali é recusado AGORA — um perfil com uma modalidade que o
     * catálogo não conhece só dá erro meses depois, na primeira turma que a pedir.
     *
     * OS DADOS PESSOAIS NÃO ENTRAM NO ÍNDICE VERSIONADO: a verificação 7 do `check-indices.js`
     * proíbe `email`, `telefone` e afins nos índices do acervo. Vão para o KV, e é o `gravarCadastro`
     * abaixo que o faz — numa chave do TENANT para a escola e numa chave da PESSOA para o professor. */
    const catalogo = require('../nucleo/perfil-do-professor.js');
    const cadastroValidado = cadastroDaEscola.validarCadastro(corpo, {
      modalidadesValidas: (catalogo.LISTA_DE_MODALIDADES || []).map((m) => m && m.id).filter(Boolean),
      exigirDadosDaEscola: exigirCadastro,
    });
    if (!cadastroValidado.ok) {
      return responderJson({ ok: false, erro: cadastroValidado.erro, erros: cadastroValidado.erros }, 400);
    }
    const cadastro = cadastroValidado.cadastro;

    /* O PLANO E A CAPACIDADE (25/11/2026) — validados contra o catálogo, e não confiados.
     *
     * É a mesma disciplina do cadastro: a página propõe, o servidor decide. Um plano fora do
     * catálogo é recusado AGORA — e o `dispensarPagamento` só vale na porta do proprietário
     * (`origem === 'painel'`), porque obrigá-la a pagar a si mesma em cada ensaio fecharia a porta
     * a quem mais usa o sistema. */
    const escolhaComercial = comercial.validarEscolha(corpo, { podeDispensar: origem === 'painel' });
    if (!escolhaComercial.ok) {
      return responderJson({ ok: false, erro: escolhaComercial.erro }, 400);
    }
    const escolha = escolhaComercial.escolha;

    /* A IDENTIDADE ÚNICA — o CNPJ é uma escola, o CPF é um professor (25/11/2026).
     *
     * A recusa vem ANTES de se criar qualquer coisa, e diz o caminho de saída: para o professor, a
     * saída é boa («use o professor que já existe»); para a escola, é o nome. Recusar depois de
     * criar deixaria um Worker no ar sobre uma escola que não devia existir. */
    if (cadastro.cnpj) {
      const jaTem = await cnpjJaUsado(env, cadastro.cnpj);
      if (jaTem) {
        return responderJson({
          ok: false,
          erro: 'o CNPJ ' + cadastro.cnpj + ' já é da escola «' + jaTem + '» — um CNPJ é uma '
            + 'escola. Se é um ensaio, use outro nome; se é a mesma escola, ela já existe.',
          escolaExistente: jaTem,
        }, 409);
      }
    }
    if (cadastro.cpf) {
      const jaTem = await cpfJaUsado(env, cadastro.cpf);
      if (jaTem) {
        return responderJson({
          ok: false,
          erro: 'o CPF ' + cadastro.cpf + ' já é do professor «' + jaTem + '» — um CPF é um '
            + 'professor, e a pasta dele já existe. Escolha «um professor que já existe» na '
            + 'etapa do professor.',
          professorExistente: jaTem,
        }, 409);
      }
    }

    // O SLUG DO PROFESSOR É A PASTA `professores/<slug>/` — e essa pasta é do SISTEMA, não
    // da escola: guarda o pacote, os cadernos, os relatórios e as âncoras. Duas pessoas com
    // o mesmo slug viram UMA no registro (o PO de uma cairia na pasta da outra). Por isso a
    // unicidade é conferida contra os diretórios que existem, e o desempate é o SOBRENOME.
    //
    // Duas saídas, e só duas:
    //   1. REUTILIZAR um professor que já existe (`professorExistente`) — a pasta fica;
    //   2. CRIAR com nome + sobrenome — a pasta nasce como `nome-sobrenome`.
    /* A MESMA LISTA QUE O FORMULÁRIO MOSTRA (24/11/2026).
     *
     * Era a varredura (`listarProfessores`), e a varredura tira as `escolas` do CONFIG — num
     * shard, de nada. Consequência: reutilizar um professor que existe dava `nome: null` e o
     * `nomeDeExibicao` caía em `tituloDoSlug`, que perde o acento («Demi Plie» em vez de
     * «Demi Plié»). O nome errado ia para o elo, para o secret `PROFESSOR_NOME` e para o
     * `responsavel` da escola — e o elo é proveniência, não se corrige depois.
     *
     * Passa a ser a lista do ÍNDICE, a mesma que serve `/api/professores`: uma pergunta, uma
     * resposta. Quando o índice não responde, a varredura responde — e aí degrada-se para o
     * slug, como antes. */
    const existentes = await listarProfessoresPeloIndice({
      token: env && env.GITHUB_TOKEN, dono: DONO, repo: REPO, ref: REF,
      kv: env && env.PADD_KV,
    }).then((r) => r.professores).catch(() => listarProfessores({ token: env && env.GITHUB_TOKEN, dono: DONO, repo: REPO, ref: REF }));
    let professor = null;
    let nomeDeExibicao = professorNome;
    if (professorExistente) {
      /* SÓ SE REUTILIZA O QUE TEM PASTA. Um professor que sobrevive apenas na memória de uma
       * escola expurgada é oferecido pelo índice, mas não tem diretório nenhum onde a escola
       * nova possa nascer ao lado dele — e o servidor diria «não existe» a seguir. */
      const achado = existentes.find((p) => p.slug === professorExistente && p.pasta !== false);
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
      /* A ZONA DO ENDEREÇO PRÓPRIO (13/11/2026). Sem a `var`, o módulo usa o `padd.com.br`
       * desta casa — e a `var` existe para o dia em que houver mais do que uma zona. */
      zona: env && env.ZONA_ESCOLAS,
      /* O SHARD E O KV (15/11/2026). Com `SHARD_SCRIPT` no `env`, a escola nasce DENTRO do
       * shard — sem Worker próprio, com a identidade no KV dela e a rota a apontar ao script do
       * shard. Sem ele, o caminho é o de sempre (um Worker por escola), e nada muda para as
       * escolas que já existem. É a `vars` que decide, e ela é declarada no `wrangler.danca.jsonc`. */
      shardScript: String((env && env.SHARD_SCRIPT) || '').trim() || null,
      kv: env && env.PADD_KV,
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
            /* O SHARD VAI NO DISPARO. O workflow sobe o motor completo — e num shard o motor é
             * UM, o do shard. Sem este campo ele procuraria `wrangler.<escola>.jsonc` e subiria
             * mais um Worker, que é exactamente o que o shard existe para não haver. */
            shard: String((env && env.SHARD_SCRIPT) || '').trim(),
            /* A HABILIDADE QUE ELE DECLAROU NO CADASTRO (25/11/2026). Até aqui era um valor fixo
             * (`bale-classico`), porque quem criava era só a proprietária e ela é professora de
             * balé clássico. Com a página pública, quem declara é QUEM ENTRA — a decisão dela:
             * «agora ele é que vai determinar nesse cadastro». Vazio quando o professor já existe:
             * nesse caso o perfil dele já está escrito, e o scaffolder não lhe toca. */
            modalidade: cadastro.modalidade || '',
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

    /* O CADASTRO E A MENSAGEM, DEPOIS DE A ESCOLA EXISTIR (25/11/2026).
     *
     * A ORDEM É DELIBERADA: primeiro cria-se (e desfaz-se, se o disparo falhar), depois guarda-se o
     * cadastro, e só no fim se manda o correio. Invertida, um e-mail de boas-vindas poderia sair
     * para uma escola que o rollback desfez — e a pessoa procuraria um endereço que nunca existiu.
     *
     * NENHUMA DAS DUAS FAZ FALHAR A CRIAÇÃO. A escola está no ar; o que faltar viaja na resposta,
     * ao lado do sucesso, para a tela o poder dizer sem mentir sobre o que aconteceu. */
    const cadastroGravado = await gravarCadastro({
      env, escola: escola.escola, professor, cadastro, origem,
    });

    /* O ESTADO COMERCIAL, ESCRITO NO MESMO MOMENTO (25/11/2026).
     *
     * A escola nasce a `aguardando` — é o que a frase dela descreve: «Bateu na minha conta, eu
     * verifico e aí libero o acesso». A única excepção é o ensaio do proprietário, que já se
     * declara conciliado (`dispensarPagamento`) e nasce `ativa`: obrigá-la a habilitar à mão cada
     * escola de teste que ela cria seria transformar uma decisão comercial num obstáculo de
     * ensaio.
     *
     * NÃO FAZ FALHAR A CRIAÇÃO, e é a mesma regra do cadastro e do correio: a escola já está no
     * ar. O que faltar viaja na resposta, ao lado do sucesso. */
    const estadoComercial = escolha.pagamento === 'dispensado-pelo-proprietario' ? 'ativa' : 'aguardando';
    const comercialGravado = await gravarComercial(env && env.PADD_KV, escola.escola, {
      estado: estadoComercial,
      plano: escolha.plano,
      planoNome: escolha.planoNome,
      valorCentavos: escolha.valorCentavos,
      valor: escolha.valor,
      periodicidade: escolha.periodicidade,
      capacidade: escolha.capacidade,
      extensoes: escolha.extensoes,
      pagamento: escolha.pagamento,
      origem,
      criadoEm: new Date().toISOString(),
    }, origem);
    const correioEnviado = await mandarBoasVindas({
      env,
      escola: escola.escola,
      cadastro,
      url: escola.url,
      dominio: escola.dominio,
    });

    return responderJson(Object.assign({}, escola, {
      ok: true,
      disparo,
      cadastro: cadastroGravado,
      correio: correioEnviado,
      /* O ESTADO COMERCIAL VAI NA RESPOSTA, e com o valor: a tela que acabou de criar a escola
       * tem de dizer «aguardando conciliação, até 24 horas» — e não «escola criada» a seco, que
       * faria a pessoa tentar entrar num endereço que responde «a aguardar liberação». */
      comercial: comercialGravado.ok
        ? { estado: comercialGravado.comercial.estado, plano: escolha.plano,
            planoNome: escolha.planoNome, valor: escolha.valor }
        : { estado: null, erro: comercialGravado.erro },
      // A PORTA POR ONDE A ESCOLA NASCEU. É um facto da proveniência: um dia se pergunta «esta
      // escola entrou pelo consultor ou pela página dela?», e só o registo do momento o sabe.
      origem,
    }), 201);
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

/**
 * ONDE O CADASTRO FICA, E POR QUE NESTAS DUAS CHAVES (25/11/2026).
 *
 * A ESCOLA — `bastidores/<escola>/cadastro`. É o cofre do TENANT, e é de propósito: o expurgo
 * apaga `<escola>/` e `bastidores/<escola>/` (ver `prefixosDaEscola`), portanto o CNPJ, o e-mail e
 * o telefone da escola saem quando a escola sai. Um cadastro com dados pessoais que sobrevivesse
 * ao expurgo do cliente seria um resíduo — o pior tipo, porque ninguém o procura.
 *
 * O PROFESSOR — `professores/<slug>/contato`. É o contrário, e pela mesma razão que a habilitação
 * está em `professores/<slug>/perfil.json` (decisão de 03/11/2026): a pessoa é do SISTEMA, não do
 * tenant. Se o CPF e o telefone do professor morassem no cofre da escola, o fecho de uma escola
 * apagaria o contato da pessoa — e ela ficaria sem forma de ser encontrada para a próxima.
 *
 * NÃO SE SOBRESCREVE O QUE JÁ EXISTE PARA O PROFESSOR. Um professor que cria a SEGUNDA escola não
 * reescreve o próprio contato com o que veio digitado de novo (o reúso nem traz CPF); completar-se
 * o que falta é o que se faz, e nunca substituir o que lá está — a mesma regra do `perfil.json`.
 *
 * NADA AQUI FAZ FALHAR A CRIAÇÃO. A escola já existe quando isto corre; um erro de KV que subisse
 * faria a página responder «não foi possível criar» sobre uma escola que está no ar.
 */
async function gravarCadastro({ env, escola, professor, cadastro, origem }) {
  const kv = env && env.PADD_KV;
  const resultado = { escola: null, professor: null, erros: [] };
  if (!kv || typeof kv.put !== 'function') {
    resultado.erros.push('sem KV: o cadastro não foi guardado');
    return resultado;
  }
  const quando = new Date().toISOString();

  try {
    const chave = 'bastidores/' + escola + '/cadastro';
    const anterior = await kv.get(chave);
    let registo = {};
    try { registo = anterior ? JSON.parse(anterior) : {}; } catch (erro) { registo = {}; }
    const novo = Object.assign({}, registo, {
      escolaNome: cadastro.escolaNome || registo.escolaNome || null,
      cnpj: cadastro.cnpj || registo.cnpj || null,
      email: cadastro.escolaEmail || registo.email || null,
      telefone: cadastro.escolaTelefone || registo.telefone || null,
      origem: registo.origem || origem || null,
      criadoEm: registo.criadoEm || quando,
      atualizadoEm: quando,
    });
    await kv.put(chave, JSON.stringify(novo));
    resultado.escola = chave;
  } catch (erro) {
    resultado.erros.push('cadastro da escola: ' + ((erro && erro.message) || String(erro)));
  }

  if (professor && cadastro.professorEmail) {
    try {
      const chave = 'professores/' + professor + '/contato';
      const anterior = await kv.get(chave);
      let registo = {};
      try { registo = anterior ? JSON.parse(anterior) : {}; } catch (erro) { registo = {}; }
      const novo = Object.assign({}, registo, {
        nomeCompleto: cadastro.professorNomeCompleto || registo.nomeCompleto || null,
        cpf: cadastro.cpf || registo.cpf || null,
        email: cadastro.professorEmail || registo.email || null,
        telefone: cadastro.professorTelefone || registo.telefone || null,
        atualizadoEm: quando,
      });
      if (!novo.criadoEm) novo.criadoEm = quando;
      await kv.put(chave, JSON.stringify(novo));
      resultado.professor = chave;
    } catch (erro) {
      resultado.erros.push('contato do professor: ' + ((erro && erro.message) || String(erro)));
    }
  }
  return resultado;
}

/**
 * O ESTADO COMERCIAL DA ESCOLA — onde ele vive, e o que ele decide (25/11/2026).
 *
 * A DECISÃO DELA, e é a regra inteira: «a conciliação bancária é feita por mim, é feita
 * manualmente. […] Bateu na minha conta, eu verifico e aí libero o acesso. E o tempo para fazer
 * isso é de até 24 horas. Depois que eu libero, aí sim é que a pessoa vai ter acesso total […]
 * Se eu desabilitar, sai do ar a escola imediatamente e só tem acesso a ler as coisas que já
 * foram desenvolvidas […] mas fica impossível criar qualquer outro documento.»
 *
 * OS TRÊS ESTADOS, e o que cada um faz — a tradução exacta daquelas três frases:
 *
 *   `aguardando` — a escola nasceu e espera a conciliação. Ninguém entra: o endereço responde a
 *                  página de espera. É o estado de TODA escola criada por aqui, e é o que torna
 *                  «paguei» diferente de «liberaram».
 *   `ativa`      — liberada. Tudo funciona, como sempre funcionou.
 *   `suspensa`   — suspensa por falta de pagamento. As páginas abrem (o que já foi criado
 *                  continua a ler-se), e tudo o que ESCREVE é recusado.
 *
 * ONDE VIVE: `bastidores/<escola>/comercial`, no KV da casa. É o cofre do TENANT — o expurgo
 * apaga-o com o resto, e uma escola que já não existe não guarda estado comercial nenhum. A
 * alternativa (o andaime `escolas-habilitadas.json`) foi DESCARTADA: é um ficheiro versionado que
 * ela edita à mão, e um estado que muda por clique não se edita à mão sem se esquecer de o fazer.
 *
 * A AUSÊNCIA DE REGISTO É `ativa`. É a decisão conservadora, e a única que não parte o que existe:
 * as escolas de antes desta versão não têm registo, e tratá-las como «aguardando» fechava-as todas
 * no dia do deploy. Um estado novo não se impõe ao passado — acrescenta-se.
 */
const ESTADOS_COMERCIAL = ['aguardando', 'ativa', 'suspensa'];

/** Quantos meses uma escola desabilitada espera antes de poder ser apagada. */
const MESES_DE_CARENCIA = 3;

/**
 * A CARÊNCIA CONTA DA DESABILITAÇÃO, e não da criação (25/11/2026).
 *
 * «O apagar aquela escola só vai poder contar se do tempo em que ela foi desabilitada […] a partir
 * dessa data conta três meses e ela vai estar disponível lá no botão de apagar escola.»
 *
 * O `desde` do andaime (§17.5) era escrito à mão; este é o mesmo prazo a contar de um facto que o
 * sistema registou sozinho — `desabilitadaEm`, gravado no instante em que ela é suspensa. A
 * diferença importa: uma data escrita à mão envelhece mal, e a pergunta «há quanto tempo esta
 * escola não paga?» passa a ter uma resposta que não depende de ninguém se lembrar.
 */
/**
 * Quando é que uma escola desabilitada passa a poder ser apagada — `null` se nunca foi.
 *
 * TRÊS MESES É UM MÊS DO CALENDÁRIO, e não 91 dias. A diferença aparece no exemplo dela: uma
 * escola desabilitada a 12/01/2027 tem de ficar apagável a 12/04/2027, e 91 dias dariam 13/04 —
 * um dia a mais, todos os anos, com um em cada quatro a errar por dois. `setUTCMonth` faz a conta
 * que se faz à mão, e o prazo passa a ser o que ela disse.
 *
 * O DIA 31 TEM UMA RESPOSTA SÓ, e o JavaScript já a dá: 31/01 + um mês é 03/03 (o dia que não
 * existe transborda para o mês seguinte). É o comportamento certo para um prazo — nunca encurta a
 * carência, que seria negar o prazo que se prometeu.
 */
function carenciaAte(desabilitadaEm) {
  const inicio = new Date(String(desabilitadaEm || ''));
  if (!Number.isFinite(inicio.getTime())) return null;
  const fim = new Date(inicio.getTime());
  fim.setUTCMonth(fim.getUTCMonth() + MESES_DE_CARENCIA);
  return fim.toISOString();
}

/* =====================================================================================
 * O FINANCEIRO — a chave que recebe, e quem paga menos (25/11/2026).
 *
 * «Vamos criar aqui o botão da onde eu coloco a minha chave Pix […] é onde eu faço as minhas
 * configurações financeiras […] e também um lugar onde eu possa colocar desconto. […] para qual
 * escola eu tô concedendo desconto e quanto […] e também mostra quando eu concedi o desconto.»
 *
 * DUAS CHAVES, e o número delas é a decisão:
 *
 *   · `financeiro/pix` — UMA. Há um dono e uma conta. Guardar a chave por escola seria inventar
 *     dezenas de contas que não existem.
 *   · `financeiro/descontos` — UMA, com a lista dentro. O contrário (uma chave por desconto)
 *     obrigaria a enumerar o KV para desenhar a listagem, e a enumeração é o que estoura a cota
 *     diária — a lição de 18/10/2026, escrita no `AGENTS.md`. Uma leitura responde a «que
 *     descontos estão concedidos?», e nenhuma listagem acontece.
 *
 * A CHAVE DO PIX MUDOU DE CASA. Era só o segredo `PIX_CHAVE` do Worker; agora ela pede um ecrã
 * para a trocar, e um segredo não se muda por um ecrã. O segredo passa a ser o VALOR INICIAL: o
 * KV manda quando tem valor, o `env` responde quando o KV está vazio. Assim o que já está
 * configurado não se perde, e o ecrã não precisa de ser preenchido outra vez para a página
 * continuar a funcionar.
 * ===================================================================================== */

function chavePixNoKv() { return 'financeiro/pix'; }
function chaveDosDescontos() { return 'financeiro/descontos'; }

/** `[Preencher: …]` é lacuna, não valor — e uma lacuna nunca chega à tela como dado. */
function semLacuna(valor) {
  const t = String(valor == null ? '' : valor).trim();
  if (!t || /^\[Preencher/i.test(t)) return null;
  return t;
}

/** O PIX que a página mostra: o do KV quando existe, o do segredo quando ainda não há. */
async function lerPix(kv, env) {
  const doAmbiente = {
    chave: semLacuna(env && env.PIX_CHAVE),
    titular: semLacuna(env && env.PIX_TITULAR),
  };
  if (!kv || typeof kv.get !== 'function') return doAmbiente;
  try {
    const texto = await kv.get(chavePixNoKv());
    if (!texto) return doAmbiente;
    const guardado = JSON.parse(texto);
    /* O REGISTO DO KV É A VERDADE INTEIRA, e não campo a campo (25/11/2026).
     *
     * A primeira versão fazia `semLacuna(guardado.titular) || doAmbiente.titular` — e quem
     * apagasse o titular no ecrã via reaparecer o do segredo. Num ecrã de pagamento isso é uma
     * atribuição errada: uma chave NOVA com o nome de quem recebia a ANTIGA. Se há registo, é ele
     * que vale; um campo em branco no registo é uma resposta («não tem titular declarado»), não
     * uma ausência que se preenche com outra coisa. */
    return {
      chave: semLacuna(guardado.chave) || null,
      titular: semLacuna(guardado.titular) || null,
      atualizadoEm: guardado.atualizadoEm || null,
    };
  } catch {
    return doAmbiente;
  }
}

/** Grava a chave Pix. O que ela escreve passa a ser o que a página mostra. */
async function gravarPix(kv, { chave, titular }, quem) {
  if (!kv || typeof kv.put !== 'function') return { ok: false, erro: 'sem KV nesta ligação' };
  const limpa = semLacuna(chave);
  if (!limpa) return { ok: false, erro: 'informe a chave Pix que vai receber os pagamentos' };
  const registo = {
    chave: limpa,
    titular: semLacuna(titular),
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: quem || null,
  };
  try {
    await kv.put(chavePixNoKv(), JSON.stringify(registo));
    return { ok: true, pix: registo };
  } catch (erro) {
    return { ok: false, erro: (erro && erro.message) || String(erro) };
  }
}

/**
 * Os descontos concedidos, do mais recente para o mais antigo.
 *
 * `escola` é o slug; `valorCentavos` é o desconto mensal. O registo guarda também `motivo`, porque
 * um valor sem razão é o que ninguém consegue rever seis meses depois — e a revisão é o ponto:
 * quem concede um desconto vai querer saber porquê.
 */
async function lerDescontos(kv) {
  if (!kv || typeof kv.get !== 'function') return [];
  try {
    const texto = await kv.get(chaveDosDescontos());
    if (!texto) return [];
    const guardado = JSON.parse(texto);
    const lista = Array.isArray(guardado.lista) ? guardado.lista : [];
    return lista.slice().sort((a, b) => String(b.em || '').localeCompare(String(a.em || '')));
  } catch {
    return [];
  }
}

/** Concede (ou substitui) o desconto de uma escola. */
async function concederDesconto(kv, { escola, valorCentavos, motivo }, quem) {
  if (!kv || typeof kv.get !== 'function' || typeof kv.put !== 'function') {
    return { ok: false, erro: 'sem KV nesta ligação' };
  }
  const slug = String(escola || '').trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return { ok: false, erro: 'escolha a escola do desconto' };
  const centavos = Math.round(Number(valorCentavos));
  if (!Number.isFinite(centavos) || centavos <= 0) {
    return { ok: false, erro: 'o desconto tem de ser um valor maior do que zero' };
  }
  const lista = await lerDescontos(kv);
  /* UM DESCONTO POR ESCOLA, e o novo substitui o anterior. Dois descontos sobrepostos na mesma
   * escola não têm uma soma que signifique alguma coisa — e duas linhas na listagem para a mesma
   * escola obrigariam quem lê a decidir qual é a que vale. */
  const semEsta = lista.filter((d) => d.escola !== slug);
  const registo = {
    id: slug + '-' + Date.now(),
    escola: slug,
    valorCentavos: centavos,
    valor: comercial.reais(centavos),
    motivo: String(motivo || '').trim() || null,
    em: new Date().toISOString(),
    por: quem || null,
  };
  semEsta.unshift(registo);
  try {
    await kv.put(chaveDosDescontos(), JSON.stringify({ lista: semEsta.slice(0, 500) }));
    return { ok: true, desconto: registo, lista: semEsta };
  } catch (erro) {
    return { ok: false, erro: (erro && erro.message) || String(erro) };
  }
}

/** Retira o desconto de uma escola. Apagar um benefício é um facto, e fica dito na listagem. */
async function retirarDesconto(kv, escola) {
  if (!kv || typeof kv.get !== 'function' || typeof kv.put !== 'function') {
    return { ok: false, erro: 'sem KV nesta ligação' };
  }
  const slug = String(escola || '').trim();
  const lista = await lerDescontos(kv);
  const ficam = lista.filter((d) => d.escola !== slug);
  if (ficam.length === lista.length) return { ok: false, erro: 'essa escola não tem desconto' };
  try {
    await kv.put(chaveDosDescontos(), JSON.stringify({ lista: ficam }));
    return { ok: true, lista: ficam };
  } catch (erro) {
    return { ok: false, erro: (erro && erro.message) || String(erro) };
  }
}


function chaveComercial(escola) {
  return 'bastidores/' + String(escola || '').trim() + '/comercial';
}

/** Lê o estado comercial. Sem registo (ou ilegível) → `ativa`, e o motivo é dito no campo. */
async function lerComercial(kv, escola) {
  const vazio = { estado: 'ativa', motivo: 'sem registo comercial', plano: null, valor: null };
  if (!kv || typeof kv.get !== 'function' || !escola) return vazio;
  try {
    const texto = await kv.get(chaveComercial(escola));
    if (!texto) return vazio;
    const registo = JSON.parse(texto);
    const estado = ESTADOS_COMERCIAL.indexOf(String(registo.estado || '')) !== -1
      ? String(registo.estado) : 'ativa';
    return Object.assign({}, registo, { estado, motivo: null });
  } catch (erro) {
    return vazio;
  }
}

/** Grava o estado comercial. O elo anterior NÃO se reescreve: os pagamentos acumulam. */
async function gravarComercial(kv, escola, mudanca, quem) {
  if (!kv || typeof kv.put !== 'function') return { ok: false, erro: 'sem KV' };
  const anterior = await lerComercial(kv, escola);
  const agora = new Date().toISOString();
  const registo = Object.assign({}, anterior, mudanca, {
    estado: mudanca.estado || anterior.estado,
    atualizadoEm: agora,
    atualizadoPor: quem || null,
  });
  delete registo.motivo;
  /* A DATA DE CADA MUDANÇA DE ESTADO, guardada como facto próprio (25/11/2026).
   *
   * O histórico já tinha o «quando» de cada elo, mas ler a última transição de lá a cada linha de
   * uma tabela é varrer uma lista para responder a uma pergunta que tem uma resposta só. Dois
   * campos dizem-na diretamente:
   *
   *   · `habilitadaEm` — quando o acesso foi ABERTO pela última vez;
   *   · `desabilitadaEm` — quando foi FECHADO pela última vez. É daqui que conta a carência de
   *     três meses até a escola poder ser apagada.
   *
   * E eles NÃO se apagam um ao outro: uma escola que é suspensa hoje e habilitada amanhã tem as
   * duas datas verdadeiras, e a pergunta «já esteve suspensa?» continua a ter resposta. Só o campo
   * do estado que MUDOU é reescrito — carimbar os dois em cada mudança faria de cada um a data da
   * última coisa que aconteceu, que é o que o `atualizadoEm` já diz. */
  const estadoNovo = registo.estado;
  if (estadoNovo !== anterior.estado) {
    if (estadoNovo === 'ativa') registo.habilitadaEm = agora;
    if (estadoNovo === 'suspensa') registo.desabilitadaEm = agora;
  }
  // A PRIMEIRA VEZ numa escola nova: ela nasce `aguardando` e isso não é uma habilitação nem uma
  // suspensão. Só quando alguém ABRE o acesso é que existe uma data de abertura.
  if (estadoNovo === 'ativa' && !registo.habilitadaEm) registo.habilitadaEm = agora;
  /* O HISTÓRICO É A MEMÓRIA DO QUE ACONTECEU, e não o estado de agora. Cada mudança deixa um elo
   * — quem, quando, de que para quê, e por quanto. É a mesma disciplina da proveniência: um estado
   * que se sobrescreve não responde à pergunta «esta escola já esteve suspensa?». */
  const elo = {
    em: agora,
    para: registo.estado,
    por: quem || null,
    valor: mudanca.valorCentavos !== undefined ? mudanca.valorCentavos : null,
    nota: mudanca.nota || null,
  };
  const historico = Array.isArray(anterior.historico) ? anterior.historico.slice() : [];
  historico.push(elo);
  registo.historico = historico.slice(-60);
  if (!registo.criadoEm && mudanca.criadoEm) registo.criadoEm = mudanca.criadoEm;
  try {
    await kv.put(chaveComercial(escola), JSON.stringify(registo));
    return { ok: true, comercial: registo };
  } catch (erro) {
    return { ok: false, erro: (erro && erro.message) || String(erro) };
  }
}

/**
 * A IDENTIDADE ÚNICA DAS ENTIDADES — pelo CNPJ e pelo CPF (25/11/2026).
 *
 * «Agora que a gente tem mais informações a respeito […] a gente pode controlar melhor essa coisa
 * de n professores e n escolas e o relacionamento entre eles. Então, a gente tem CNPJ e a gente
 * tem CPF. Isso melhora muito a identidade e a criação da identificação única dessas entidades.»
 *
 * A REGRA É UMA, e o número é a chave: **um CNPJ é uma escola; um CPF é um professor.** Não é uma
 * proibição burocrática — é o que impede duas coisas que já aconteceram neste sistema: duas pastas
 * `professores/<slug>/` para a mesma pessoa (o CPF teria dito que era a mesma), e duas escolas com
 * o mesmo CNPJ, que no mundo real são a mesma escola com dois nomes.
 *
 * O QUE ACONTECE QUANDO BATE: RECUSA, com o caminho de saída dito. Para o professor, a saída é
 * BOA — «use o professor que já existe», que é o que o formulário já oferece. Para a escola, a
 * saída é o nome: duas escolas do mesmo CNPJ no protótipo são um ensaio, e o ensaio cria-se com
 * outro nome (é o que ela já faz com `calango`/`batata`/`breu`).
 *
 * A VARREDURA É DO ÍNDICE, e não de uma lista nova: `escolasDoIndice` já lê o acervo inteiro. O
 * CPF não está no índice (é dado pessoal, e a verificação 7 proíbe-o lá) — a conferência do CPF é
 * feita sobre o CONTATO no KV, e por isso ela só vê os professores desta casa.
 */
/**
 * QUEM JÁ TEM ESTE NÚMERO — a varredura, uma só, para os dois documentos.
 *
 * `prefixo` + `sufixo` dizem ONDE procurar (`bastidores/<escola>/cadastro` para o CNPJ,
 * `professores/<slug>/contato` para o CPF), e `campo` diz o que comparar. Uma função para os dois
 * porque a pergunta é a mesma — «este número já é de alguém?» —, e duas cópias divergiriam na
 * primeira vez que uma delas esquecesse o `soDigitos`.
 *
 * O `kv.list` é a enumeração do namespace: custa uma chamada por página de 1000 chaves, e é o
 * preço de uma criação de escola — não de uma abertura de página. Não há índice de números, e
 * criá-lo seria uma terceira cópia do dado (o cadastro já lá está) que se esqueceria de atualizar
 * no dia em que um cadastro fosse corrigido.
 */
async function quemTemEsteNumero(env, { prefixo, sufixo, campo, valor, ignorar }) {
  const alvo = cadastroDaEscola.soDigitos(valor);
  const kv = env && env.PADD_KV;
  if (!alvo || !kv || typeof kv.list !== 'function') return null;
  const re = new RegExp('^' + prefixo + '\\/([a-z0-9-]+)\\/' + sufixo + '$');
  try {
    const lista = await kv.list({ prefix: prefixo + '/' });
    for (const chave of ((lista && lista.keys) || [])) {
      const nome = String((chave && chave.name) || '');
      const m = re.exec(nome);
      if (!m) continue;
      const slug = m[1];
      if (ignorar && slug === ignorar) continue;
      const texto = await kv.get(nome);
      if (!texto) continue;
      let registo = null;
      try { registo = JSON.parse(texto); } catch (erro) { continue; }
      if (registo && cadastroDaEscola.soDigitos(registo[campo]) === alvo) return slug;
    }
  } catch (erro) { return null; }
  return null;
}

/** A escola que já tem este CNPJ — ou `null`. */
function cnpjJaUsado(env, cnpj, ignorar) {
  return quemTemEsteNumero(env, {
    prefixo: 'bastidores', sufixo: 'cadastro', campo: 'cnpj', valor: cnpj, ignorar,
  });
}

/** O professor que já tem este CPF — ou `null`. */
function cpfJaUsado(env, cpf, ignorar) {
  return quemTemEsteNumero(env, {
    prefixo: 'professores', sufixo: 'contato', campo: 'cpf', valor: cpf, ignorar,
  });
}

/** O cadastro da escola, do KV. Devolve `null` quando não há (escola de antes desta versão). */
async function lerCadastroDaEscola(env, escola) {
  const kv = env && env.PADD_KV;
  if (!kv || typeof kv.get !== 'function' || !escola) return null;
  try {
    const texto = await kv.get('bastidores/' + escola + '/cadastro');
    return texto ? JSON.parse(texto) : null;
  } catch (erro) { return null; }
}

/**
 * A MENSAGEM DE BOAS-VINDAS, DEPOIS DE A ESCOLA EXISTIR (25/11/2026).
 *
 * «Sempre que for criado uma escola, tem que disparar um e-mail para o professor e para o e-mail
 * da escola. Mesmo que seja o mesmo e-mail cadastrado, aí dispara um só» — o `destinatarios` do
 * núcleo é quem deduplica, e é o mesmo que a composição usa.
 *
 * DEVOLVE O DESFECHO, e nunca lança: a escola está criada, e um erro de correio não pode
 * desfazer isso nem dizer que não foi criada. Sem `RESEND_API_KEY`, a mensagem é composta e
 * GUARDADA na caixa de saída do tenant, e o desfecho diz `enviado: false` com o motivo — para a
 * tela poder dizê-lo, e para não se perder o que se ia dizer a quem esperava a chave.
 */
async function mandarBoasVindas({ env, escola, cadastro, url, dominio }) {
  const mensagem = correio.comporMensagem({ cadastro, escola, url, dominio });
  if (!mensagem.para.length) {
    return { enviado: false, motivo: 'não há e-mail a quem enviar — o cadastro não trouxe nenhum' };
  }
  const desfecho = await correio.enviar({
    mensagem,
    chave: env && env.RESEND_API_KEY,
    de: env && env.CORREIO_DE,
  });
  /* A CAIXA DE SAÍDA GUARDA O QUE NÃO SAIU, e só isso. Guardar também o que saiu seria manter uma
   * segunda cópia do e-mail de quem recebeu — dado pessoal a mais — sem ninguém que a leia. */
  let caixa = null;
  if (!desfecho.enviado) {
    caixa = await correio.guardarNaCaixaDeSaida({ kv: env && env.PADD_KV, escola, mensagem, desfecho });
  }
  return Object.assign({ assunto: mensagem.assunto, endereco: mensagem.endereco }, desfecho,
    caixa ? { caixa } : {});
}

/**
 * COMO A PÁGINA SE APRESENTA — e a resposta é do ENDEREÇO por onde se entra (25/11/2026).
 *
 * A decisão dela: «a página danca.padd.com.br ela é só minha, só do proprietário do sistema […]
 * Essa página pública […] vai se chamar lastro.padd.com.br. E e aí ele acessa, ele tem essa mesma
 * página de apresentação […] só que o único botão que existe para ela é o de criar nova escola.»
 *
 * O QUE CONTA COMO O LADO DO PROPRIETÁRIO, e são dois endereços e não um:
 *
 *   · o `HOST_DONO` (por omissão `danca.padd.com.br`), que é a porta que ela usa;
 *   · qualquer `*.workers.dev` — o endereço TÉCNICO deste mesmo Worker. Ele responde no
 *     `danca.tmenegaz77.workers.dev` desde sempre e continuou a servi-la atrás da `SENHA_RAIZ`;
 *     passá-lo ao lado público seria fechá-la fora pela porta que ela usou até ontem. Não é uma
 *     porta a mais para ninguém: é a mesma, e a senha continua a ser pedida.
 *
 * TODO O RESTO É PÚBLICO — e é a direção conservadora certa. Um host desconhecido apontado a este
 * Worker recebe a apresentação e o formulário; não recebe o painel. O erro do outro lado (tratar
 * um endereço dela como público) custa-lhe um deploy; o erro deste lado (tratar um endereço
 * público como dela) custa a lista de escolas e o botão de apagar.
 *
 * A `var` `HOST_PUBLICO` NÃO ENTRA NESTA CONTA de propósito: ela é o endereço que se MOSTRA e
 * anuncia, não o critério. Um critério que dependesse de duas `var` errava em silêncio quando uma
 * delas fosse esquecida no deploy — e o silêncio, aqui, é o painel exposto.
 */
function hostDaRequisicao(request) {
  try {
    return String(new URL(request.url).hostname || '').trim().toLowerCase();
  } catch (erro) {
    return '';
  }
}

function hostDoProprietario(env) {
  const declarado = String((env && env.HOST_DONO) || '').trim().toLowerCase();
  return declarado || 'danca.padd.com.br';
}

function ehPaginaPublica(request, env) {
  const host = hostDaRequisicao(request);
  if (!host) return false;                    // sem host legível, não se inventa um modo
  if (host === hostDoProprietario(env)) return false;
  if (/\.workers\.dev$/.test(host)) return false;
  return true;
}

/** O nome de exibição do botão, para a página saber o que dizer sem perguntar duas vezes. */
function urlDaPaginaPublica(env) {
  const host = String((env && env.HOST_PUBLICO) || '').trim() || 'lastro.padd.com.br';
  return 'https://' + host;
}

/**
 * O QUE A PÁGINA PRECISA DE SABER — e o que ela NÃO precisa (25/11/2026).
 *
 * A LISTA DE HABILIDADES vem do catálogo, uma vez, para as duas portas. Sem ela a página teria uma
 * segunda cópia das modalidades — e a segunda cópia é a que fica velha quando o catálogo cresce.
 *
 * O QUE O MODO PÚBLICO **NÃO** DIZ: nada sobre escolas. Nem a lista, nem quantas são, nem os
 * nomes. A rota responde sem senha, e o que responde sem senha não pode conter o cadastro de
 * ninguém. É a mesma razão pela qual `/api/escolas` é recusada naquele endereço.
 */
async function respostaDaPagina(env, modo) {
  const habilidades = (require('../nucleo/perfil-do-professor.js').LISTA_DE_MODALIDADES || [])
    .map((m) => ({ id: m && m.id, nome: m && m.nome, temConteudo: Boolean(m && m.temConteudo) }))
    .filter((m) => m.id);
  /* A COMPOSIÇÃO COMERCIAL VAI NA MESMA RESPOSTA (25/11/2026), e pela mesma razão que as
   * habilidades: a página desenha os cartões, mas NENHUM preço está escrito nela. O exibido, o
   * calculado e o cobrado saem do mesmo JSON — é o que a frente L8 do planejamento pede, e é o que
   * impede um cartão a dizer R$ 69,90 sobre uma tabela que já diz outra coisa. */
  const catalogo = comercial.catalogoDaPagina();
  /* A CHAVE PIX VEM DE DOIS SÍTIOS, e a ordem entre eles é a regra (25/11/2026). Ela passou a ter
   * um ecrã onde é escrita — e um segredo do Worker não se muda por um ecrã. Então o ecrã grava no
   * KV, e o segredo passa a ser o VALOR INICIAL: o KV manda quando tem valor, o `env` responde
   * quando o KV está vazio. O que já está configurado não se perde, e o ecrã não precisa de ser
   * preenchido outra vez para a página continuar a cobrar.
   *
   * SEM CHAVE NENHUMA, A PÁGINA DIZ QUE NÃO ESTÁ CONFIGURADA em vez de mostrar uma de exemplo —
   * dinheiro enviado para o lado errado é o pior defeito possível num ecrã de pagamento. */
  const pix = await lerPix(env && env.PADD_KV, env);
  return new Response(JSON.stringify({
    ok: true,
    modo,
    publica: urlDaPaginaPublica(env),
    habilidades,
    planos: catalogo,
    pix: {
      chave: pix.chave || null,
      titular: pix.titular || null,
      conciliacao: 'manual',
      prazo: 'até 24 horas',
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/**
 * TIRA DO HTML O QUE É SÓ DO PAINEL — e tira, não esconde (25/11/2026).
 *
 * A DECISÃO DELA, com a dúvida incluída: «na página lastro.padd.com.br remova o botão apagar
 * escola, […] ver só as apagadas não existe, ver só as vivas não existe e professores também não
 * existe. […] apenas oculta nesse domínio. Acho que já resolve. Não sei se dá para remover, não sei
 * de que maneira você fez.»
 *
 * DÁ PARA REMOVER, e passa a ser assim. A primeira versão escondia com
 * `[data-pagina="publica"] [data-dono] { display:none }` — o que funciona e é mais barato, mas
 * depende de a folha chegar, e uma folha em cache no navegador de quem já cá esteve mostra os
 * botões outra vez. Remover o elemento não depende de folha nenhuma: o que não vem no HTML não se
 * vê, e não se clica.
 *
 * A FOLHA GUARDA A REGRA ASSIM MESMO. Não é redundância inútil: é a segunda barreira, e é a que
 * vale enquanto o servidor antigo estiver no ar (o HTML já trazido e o CSS novo, ou o contrário).
 *
 * ISTO NÃO É PROTEÇÃO, e nunca foi: quem protege é a lista de caminhos do modo público, que
 * responde 404 a tudo o que não seja a apresentação e o criar. Um botão ausente é uma promessa que
 * não se faz, não uma porta que se fecha.
 *
 * O PARSER É MÍNIMO E ASSUME O QUE O FICHEIRO É: elementos com `data-dono` que NÃO estão uns dentro
 * dos outros (o marcador é do bloco, não da folha), e sem tags vazias do mesmo nome pelo meio. A
 * prova mede os dois lados — que saíram no público, e que ficaram no painel.
 */
const TAGS_VAZIAS = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'track', 'wbr']);

function removerDoPainel(html) {
  const texto = String(html || '');
  let saida = '';
  let i = 0;
  const abertura = /<([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*\sdata-dono\b[^>]*>/g;
  while (i < texto.length) {
    abertura.lastIndex = i;
    const m = abertura.exec(texto);
    if (!m) { saida += texto.slice(i); break; }
    saida += texto.slice(i, m.index);
    const tag = m[1].toLowerCase();
    if (TAGS_VAZIAS.has(tag) || /\/>$/.test(m[0])) { i = m.index + m[0].length; continue; }
    // Procura o fecho desta tag, contando as aberturas e os fechos do MESMO nome.
    const re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi');
    re.lastIndex = m.index + m[0].length;
    let profundidade = 1;
    let fim = texto.length;
    let achado;
    while ((achado = re.exec(texto)) !== null) {
      if (achado[1] === '/') {
        profundidade -= 1;
        if (profundidade === 0) { fim = achado.index + achado[0].length; break; }
      } else if (!/\/>$/.test(achado[0])) {
        profundidade += 1;
      }
    }
    i = fim;
  }
  return saida;
}

/**
 * SERVE A PÁGINA — a mesma nos dois endereços, com uma marca que diz qual é (25/11/2026).
 *
 * A APRESENTAÇÃO É UMA SÓ, e é isso que ela pediu: «ele tem essa mesma página de apresentação, o
 * que é o sistema Lastro, a logomarca, o título, a troca de cor, enfim, é exatamente como essa
 * daqui, só que o único botão que existe para ela é o de criar nova escola». Duas páginas seriam
 * duas apresentações do mesmo sistema, e a segunda ficaria para trás na primeira alteração.
 *
 * O QUE MUDA É A MARCA `<html data-pagina="…">` — E O NOME DELA NÃO É `data-modo`, e é de
 * propósito: `data-modo` já é a APARÊNCIA da casa (`clara`/`noturna`, com o `[data-modo="noturna"]`
 * da folha e o anti-flash que a escreve antes de pintar). Reusá-lo faria o botão do tema APAGAR a
 * marca da página ao primeiro clique, e a página pública passaria a mostrar o painel por causa de
 * uma troca de cor. Dois factos, dois atributos.
 *
 * A folha esconde, no modo público, as peças que só o painel tem (`[data-dono]`: «Apagar escola»,
 * «Professores», as listas, o reaproveitamento de professor). E o painel NÃO É INJETADO no modo
 * público — o bloco «Escolas do sistema» nem chega a ser composto, porque não há razão para o
 * compor e para o esconder a seguir.
 *
 * A MARCA É POSTA AQUI, e não no arquivo: o arquivo é regerado por `tools/gerar-raiz.sh` a partir
 * de `biblioteca/apresentacao.md`, e uma marca escrita lá dentro desapareceria na geração seguinte.
 */
/**
 * A MARCA DA PÁGINA, numa função — para a prova poder servir a página COMO O SERVIDOR A SERVE.
 *
 * Estava embutida no `servirAPagina`, e a prova que executava a página pública tinha de a repetir
 * de memória: escrevia o HTML do arquivo num `jsdom` sem a marca, e media o comportamento do
 * PAINEL a chamar-lhe «público». Uma prova que replica a transformação do servidor mede a
 * réplica — a marca passa a ser posta pela mesma linha que a põe em produção.
 */
function marcarPagina(html, publico) {
  return String(html || '').replace(/<html(\s[^>]*)?>/i, (achado, atributos) => {
    const limpos = String(atributos || '').replace(/\sdata-pagina="[^"]*"/i, '');
    return '<html' + limpos + ' data-pagina="' + (publico ? 'publica' : 'painel') + '">';
  });
}

async function servirAPagina(request, env, { modo }) {
  const publico = modo === 'publico';
  if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
    return new Response('não encontrado', { status: 404 });
  }
  const respostaDoAsset = await env.ASSETS.fetch(request);
  const tipo = respostaDoAsset.headers.get('Content-Type') || '';
  if (!respostaDoAsset.ok || !/text\/html/.test(tipo)) return respostaDoAsset;
  let html = await respostaDoAsset.text();

  html = marcarPagina(html, publico);

  /* NO MODO PÚBLICO O PAINEL NÃO É COMPOSTO. O bloco das escolas e o índice desta página são do
   * painel: compô-los para os esconder seria trabalho a fingir, e uma peça escondida é uma peça
   * que um dia alguém mostra sem querer. O marcador é o mesmo que o `gerar-raiz.sh` preserva. */
  if (!publico && html.indexOf(painel.MARCADOR) !== -1) {
    html = html.replace(painel.MARCADOR, painel.blocoDeEscolas());
    html = html.replace(painel.MARCADOR_INDICE, painel.indiceDaPagina(html));
  } else if (publico) {
    html = html.replace(painel.MARCADOR, '');
    html = html.replace(painel.MARCADOR_INDICE, '');
  }
  /* O QUE É DO PAINEL SAI DO HTML — ver `removerDoPainel`. Feito DEPOIS do painel, para o público
   * não compor blocos que ia deitar fora. */
  if (publico) html = removerDoPainel(html);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html;charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
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

  /* ── A PÁGINA PÚBLICA (25/11/2026) ──────────────────────────────────────────────────────────
   *
   * O MESMO Worker serve os dois endereços, e o que os separa é o HOST — ver `ehPaginaPublica`.
   * Aqui, no público, só passa o que é público: a apresentação, os assets, a criação de escola e a
   * saúde. TUDO O RESTO É RECUSADO, e a recusa é a mesma para todos os caminhos que não existem —
   * um 404 e não um 401 —, porque um 401 sobre `/api/apagar-escola` diria a quem tentasse que ali
   * há uma porta, e qual é.
   *
   * ISTO É A REGRA, E NÃO O ESCONDERIJO. A página pública não desenha os botões do painel (é o
   * `data-modo` que a folha esconde), mas esconder não é proteger: quem escrever o pedido à mão não
   * passa por aqui. As duas metades existem, e esta é a que vale.
   *
   * O QUE O PÚBLICO PODE FAZER A MAIS DO QUE VER: criar escola — e só com o cadastro completo, que
   * é o que a página dele recolhe (`exigirCadastro`). */
  if (ehPaginaPublica(request, env)) {
    const publicoPermitido = url.pathname === '/'
      || url.pathname === '/index.html'
      || url.pathname.startsWith('/assets/')
      || (url.pathname === '/api/criar-escola' && request.method === 'POST')
      || url.pathname === '/api/pagina';
    if (!publicoPermitido) {
      return new Response('não encontrado', {
        status: 404,
        headers: { 'Content-Type': 'text/plain;charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    if (url.pathname === '/api/pagina') {
      return await respostaDaPagina(env, 'publico');
    }
    if (url.pathname === '/api/criar-escola' && request.method === 'POST') {
      return responderCriacao(request, env, { origem: 'publico', exigirCadastro: true });
    }
    return servirAPagina(request, env, { modo: 'publico' });
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
  // logomarca.
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
        // A ORDEM VEM DA URL, e a página valida-a contra a lista do que conhece. Um `?ordem=`
        // desconhecido cai na ordem padrão em vez de dar 400: a URL é um pedido de arrumação,
        // não um contrato.
        ordem: url.searchParams.get('ordem'),
      }));
    } catch (err) {
      return painel.resposta(painel.paginaSemToken(
        'não foi possível ler o índice: ' + ((err && err.message) || String(err))), 500);
    }
  }

  // AS DUAS LISTAS — «só as apagadas» e «só as vivas». A mesma leitura (uma requisição), o
  // mesmo recorte; quem filtra é a apresentação, porque o índice é a memória inteira e a lista é
  // escolha.
  /* O COFRE — a chave mestra, atrás da senha (15/11/2026).
   *
   * PORQUE É `POST`: a chave é a coisa mais sensível que este sistema tem — abre as anamneses de
   * todas as escolas. Um `GET /api/cofre?senha=…` deixaria a senha no histórico do navegador, nos
   * logs do Cloudflare e em qualquer `Referer`. No corpo, e com `Cache-Control: no-store`, a chave
   * existe uma vez, na resposta a um pedido que não se repete sozinho.
   *
   * A SENHA É A DA RAIZ (`SENHA_RAIZ`), e não um segredo novo: é a mesma pessoa que cria e expurga
   * escolas, e uma segunda senha para o mesmo privilégio seria mais uma coisa a perder.
   *
   * A COMPARAÇÃO É EM TEMPO CONSTANTE. Não porque um `===` de 20 caracteres seja atacável na
   * prática a 100.000 pedidos/dia, mas porque a diferença de custo é nenhuma e o hábito é o que
   * impede o próximo sítio de comparar segredos com `===` e achar que está bem.
   *
   * SEM MESTRA CONFIGURADA, DIZ-SE ISSO — e não se inventa uma chave. Um cofre que devolvesse uma
   * chave derivada do nada daria às escolas chaves que ninguém consegue reproduzir.
   */
  if (url.pathname === '/api/cofre' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const senha = String((corpo && corpo.senha) || '');
    const esperada = String((env && env.SENHA_RAIZ) || '');
    if (!esperada) {
      return new Response(JSON.stringify({ ok: false, erro: 'a raiz não tem senha configurada' }), {
        status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    if (!senha || !mesmoSegredo(senha, esperada)) {
      /* A MESMA RESPOSTA para senha errada e senha vazia: distinguir as duas diria a quem tenta que
       * existe uma senha que quase acertou. */
      return new Response(JSON.stringify({ ok: false, erro: 'senha da raiz não reconhecida' }), {
        status: 401, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    const mestra = String((env && env.SENHA_MESTRA) || '').trim();
    if (!mestra) {
      return new Response(JSON.stringify({
        ok: false,
        erro: 'este Worker não tem a chave mestra (SENHA_MESTRA) — configure-a antes de a querer ver',
      }), {
        status: 503, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    return new Response(JSON.stringify({
      ok: true, chave: mestra,
      /* A IMPRESSÃO DIGITAL vai junto: é o que se pode comparar num relatório sem mostrar a chave. */
      impressao: mestra.slice(0, 8),
      /* E O QUE ELA ABRE, dito na resposta — a tela não é o único consumidor desta rota. */
      abre: 'todas as escolas: a chave de cada uma é derivada desta',
    }), {
      status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  if (url.pathname === '/escolas-apagadas' || url.pathname === '/escolas-vivas') {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return painel.resposta(painel.paginaSemToken(), 500);
    const apagadas = url.pathname === '/escolas-apagadas';
    try {
      // UMA leitura serve às duas coisas: a lista de escolas e o mapa slug→nome que ela usa para
      // mostrar a PESSOA em vez da pasta. `escolasDoIndice` já lê o acervo inteiro — pedir os
      // professores à parte seria uma segunda requisição para um dado que veio junto.
      /* AS VIVAS LEVAM O ESTADO COMERCIAL; AS APAGADAS, NÃO (25/11/2026). Uma escola expurgada
       * não tem estado comercial — o `bastidores/<escola>/comercial` foi-se com ela, e a linha de
       * uma escola que já não existe não tem nada a habilitar. */
      if (apagadas) {
        const [escolas, professores] = await escolasDoIndice({ token });
        const ordem = url.searchParams.get('ordem');
        return painel.resposta(painel.paginaDasApagadas({ escolas, ordem, professores }));
      }
      const [escolas, professores] = await escolasDoIndiceComComercial({ token, kv: env && env.PADD_KV });
      const ordem = url.searchParams.get('ordem');
      return painel.resposta(painel.paginaDasVivas({ escolas, ordem, professores }));
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
  // O DIAGNÓSTICO DO ENDEREÇO PRÓPRIO (14/11/2026) — «a próxima escola vai nascer com
  // `<escola>.padd.com.br`?», respondido ANTES de a criar. É leitura pura (dois pedidos à
  // Cloudflare, sem escrita), e existe porque o endereço falha em silêncio: o provisionamento não
  // lança por causa dele, e a resposta só diz «PENDENTE» depois de a escola existir. Sem isto,
  // descobrir que o token perdeu o `Zone → DNS → Edit` custa uma escola criada com o endereço
  // errado — foi o que aconteceu à `breu` em 13/11/2026.
  if (url.pathname === '/api/dominio' && request.method === 'GET') {
    try {
      const relatorio = await dominioDaEscola.diagnosticar({
        token: env && env.CLOUDFLARE_API_TOKEN,
        zona: env && env.ZONA_ESCOLAS,
      });
      return responderJson(relatorio, relatorio.ok ? 200 : 503);
    } catch (err) {
      return responderJson({ ok: false, erro: (err && err.message) || String(err) }, 500);
    }
  }

  /* A PÁGINA — o que ela precisa de saber para se desenhar, e nada mais (25/11/2026).
   *
   * Existe nos DOIS endereços, e de propósito: a mesma página corre nos dois, e a lista de
   * habilidades tem de lá estar nos dois. O que muda é o `modo` — e o modo do público vai na
   * resposta da rota pública (que responde sem senha, e por isso NÃO diz nada sobre escolas).
   * Aqui, do lado do painel, ela pode dizer tudo o que a página do painel usa. */
  /**
   * A HABILITAÇÃO, POR ESCOLA — o botão das «vivas» (25/11/2026).
   *
   * «Basta que eu acesse no meu ambiente […] o botão, a página das escolas vivas. E ali eu
   * habilito […] e também vai ter o botão de desabilitar.» É exactamente isso: uma rota, dois
   * sentidos, e a decisão sempre dela.
   *
   * A SENHA É A DA RAIZ, e não um segredo novo: quem chega aqui já passou pelo portão do Worker
   * `danca`, e este pedido vem da mesma sessão. É a mesma pessoa que cria e que expurga.
   *
   * O QUE GRAVA É UM ELO, e não uma sobrescrita (`gravarComercial`): o histórico diz quando a
   * escola esteve suspensa e por quanto foi habilitada. Uma escola desabilitada continua a
   * responder às leituras e recusa as escritas — a regra vive em `producao.js`, e o porquê está
   * lá escrito.
   */
  if (url.pathname === '/api/escola/comercial' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    /* SEM SEGUNDA SENHA, e é decisão: quem chega aqui já passou pelo portão da raiz — este
     * caminho não está na lista do público, e o `autorizado` correu no topo do `fetch`. O Cofre
     * pede a senha outra vez porque o que ele mostra é a chave de TODAS as escolas; habilitar uma
     * escola é uma decisão, não um segredo. Uma segunda pergunta por clique tornar-se-ia um
     * clique a mais que se aprende a dar sem ler. */
    const slug = String(corpo.escola || '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      return responderJson({ ok: false, erro: 'informe a escola' }, 400);
    }
    const estado = String(corpo.estado || '').trim();
    if (ESTADOS_COMERCIAL.indexOf(estado) === -1) {
      return responderJson({ ok: false, erro: 'estado inválido: use ' + ESTADOS_COMERCIAL.join(', ') }, 400);
    }
    if (!(env && env.PADD_KV)) {
      return responderJson({ ok: false, erro: 'PADD_KV ausente na raiz — sem ele não há estado comercial' }, 500);
    }
    const gravado = await gravarComercial(env.PADD_KV, slug, {
      estado,
      nota: String(corpo.nota || '').trim() || null,
      // O VALOR, quando ela o declara ao habilitar. É o que fica no elo: «habilitada em tal dia,
      // por R$ 99,90». Sem ele o elo diz que houve pagamento e não quanto — e a conta do mês
      // seguinte não se fecha.
      valorCentavos: Number.isFinite(Number(corpo.valorCentavos)) ? Number(corpo.valorCentavos) : undefined,
      valor: typeof corpo.valor === 'string' ? corpo.valor : undefined,
    }, 'proprietario');
    if (!gravado.ok) return responderJson({ ok: false, erro: gravado.erro }, 500);
    return new Response(JSON.stringify({
      ok: true,
      escola: slug,
      estado: gravado.comercial.estado,
      comercial: gravado.comercial,
    }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' } });
  }

  /* =====================================================================================
   * O FINANCEIRO — o ecrã onde ela põe a chave e concede descontos (25/11/2026).
   *
   * AS TRÊS ROTAS SÓ EXISTEM NO PAINEL. Elas não estão na lista do público, e a lista é uma
   * permissão: o que não está lá responde 404 em `lastro.padd.com.br`. Uma chave Pix publicada
   * numa página aberta é a conta dela à vista; um desconto publicado é a negociação de um cliente
   * à vista de outro.
   * ===================================================================================== */
  if (url.pathname === '/financeiro' && request.method === 'GET') {
    const token = env && env.GITHUB_TOKEN;
    try {
      // AS ESCOLAS VIVAS, pelas mesmas fontes que a lista das vivas usa (`escolasDoIndice` é lido
      // uma vez e serve à tabela e ao `<select>` do desconto) — é o que impede o formulário de
      // oferecer uma escola que já não existe.
      const [escolas, professores] = token
        ? await escolasDoIndice({ token })
        : [[], []];
      void professores;
      const pix = await lerPix(env && env.PADD_KV, env);
      const descontos = await lerDescontos(env && env.PADD_KV);
      const vivas = (escolas || []).filter((e) => !e.expurgada);
      return painel.resposta(painel.paginaFinanceira({ pix, descontos, escolas: vivas }));
    } catch (err) {
      return painel.resposta(painel.paginaSemToken(
        'não foi possível abrir o financeiro: ' + ((err && err.message) || String(err))), 500);
    }
  }

  if (url.pathname === '/api/financeiro/pix' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const gravado = await gravarPix(env && env.PADD_KV, {
      chave: corpo.chave,
      titular: corpo.titular,
    }, 'proprietario');
    if (!gravado.ok) return responderJson({ ok: false, erro: gravado.erro }, 400);
    return responderJson({ ok: true, pix: gravado.pix });
  }

  if (url.pathname === '/api/financeiro/desconto' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    /* O VALOR CHEGA EM REAIS (`69,90`) OU EM CÊNTIMOS. A página escreve reais porque é o que se
     * digita; o `centavos` do motor comercial é a única forma segura de somar. A conversão passa
     * pelo mesmo `centavos()` que a tabela de preços usa — duas conversões divergiriam no dia em
     * que uma delas arredondasse de outra maneira. */
    const valorCentavos = corpo.valorCentavos !== undefined
      ? Number(corpo.valorCentavos)
      : comercial.centavos(String(corpo.valor == null ? '' : corpo.valor).replace(',', '.'));
    const feito = await concederDesconto(env && env.PADD_KV, {
      escola: corpo.escola,
      valorCentavos,
      motivo: corpo.motivo,
    }, 'proprietario');
    if (!feito.ok) return responderJson({ ok: false, erro: feito.erro }, 400);
    return responderJson({ ok: true, desconto: feito.desconto, lista: feito.lista });
  }

  if (url.pathname === '/api/financeiro/desconto' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const feito = await retirarDesconto(env && env.PADD_KV, corpo.escola);
    if (!feito.ok) return responderJson({ ok: false, erro: feito.erro }, 400);
    return responderJson({ ok: true, lista: feito.lista });
  }

  if (url.pathname === '/api/pagina' && request.method === 'GET') {
    return await respostaDaPagina(env, 'painel');
  }

  if (url.pathname === '/api/escolas' && request.method === 'GET') {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return responderJson({ ok: false, erro: 'GITHUB_TOKEN ausente no Worker' }, 500);
    try {
      const r = await listarEscolasPeloIndice({
        token, dono: DONO, repo: REPO, ref: REF,
        kv: env && env.PADD_KV,
        reconstruir: url.searchParams.get('reconstruir') === '1',
      });
      /* O ESTADO COMERCIAL VAI NESTA LISTA (25/11/2026), e não numa segunda chamada: o cartão do
       * «Apagar escola» passou a dizer se a escola pode ser apagada ou está em carência, e essa
       * resposta sai das mesmas duas datas que a lista das vivas mostra. Pedi-la à parte seria uma
       * segunda leitura do mesmo KV para desenhar a mesma linha.
       *
       * A LEITURA É POR ESCOLA, e é o preço de o estado morar no cofre de cada uma. Não é
       * enumeração: são as escolas do índice, e a lista já as tem na mão. */
      const escolasComComercial = [];
      for (const e of r.escolas) {
        const c = await lerComercial(env && env.PADD_KV, e.slug);
        escolasComComercial.push({ e, c });
      }
      return responderJson({
        ok: true,
        fonte: r.doIndice ? (r.doCache ? 'indice-cache' : 'indice') : 'arvore',
        custo: r.custo,
        escolas: escolasComComercial.map(({ e, c }) => ({
          slug: e.slug,
          professor: e.professor,
          ciclo: e.ciclo,
          total: e.total,
          estadoComercial: c.estado,
          desabilitadaEm: c.desabilitadaEm || null,
          carenciaAte: carenciaAte(c.desabilitadaEm),
          /* O ENDEREÇO É O PRÓPRIO, E NÃO O `workers.dev` (14/11/2026). O técnico era o que
           * aparecia no cartão de apagar e nos textos da página. Uma escola tem UM endereço —
           * o que o sistema criou para ela —, e é ele que se mostra. */
          url: 'https://' + dominioDaEscola.hostname(e.slug, env && env.ZONA_ESCOLAS) + '/',
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
    // FORÇAR EXIGE DECLARAR. O mesmo contrato do `escola/expurgar.js`: quem manda apagar sobre
    // uma proveniência quebrada diz por quê, e a razão entra no elo. Não é um interruptor.
    const forcar = corpo && corpo.forcar === true;
    const motivoDoForcar = String((corpo && corpo.motivoDoForcar) || '').trim();
    const relatorio = { escola: slug, motivo, proveniencia: null, cloudflare: null, repositorio: null };

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

    /* 0. A PROVENIÊNCIA, ANTES DE QUALQUER APAGAMENTO (07/11/2026).
     *
     * ESTA É A PRIMEIRA COISA QUE ACONTECE — antes do Cloudflare, antes do repositório. O
     * expurgo leva as âncoras (`.fipp`), e uma âncora que já não conferia com as fontes não se
     * recupera depois de apagada: perde-se a prova de que o ciclo existiu, e o registro passa a
     * dizer «expurgada» sobre uma cadeia que já estava partida. Falhando a auditoria, NADA é
     * apagado — nem o Worker. Corrigir vem primeiro.
     *
     * O `forcar` existe porque uma guarda que nunca se pode contrariar torna o expurgo
     * impossível no estado em que ele mais é preciso (o de uma escola cujo registro se perdeu).
     * Mas ele não é um interruptor: exige `motivoDoForcar`, e o motivo e os bloqueios vão para
     * o elo. O `escola/expurgar.js` local tem o mesmo contrato, com os mesmos nomes.
     */
    try {
      const auditoria = await auditarProvenienciaDaEscola({
        token: ghToken, dono: DONO, repo: REPO, ref: REF, slug,
        /* A LISTA DE SCRIPTS DE CONFIANÇA VAI JUNTO (15/11/2026): é ela que distingue «uma escola»
         * de «o shard que serve várias» — a mesma que o `excluirEscola` usa para não apagar o
         * script do shard. A pergunta é a mesma, e a resposta não pode sair de dois sítios. */
        shards: scriptsDeConfianca(env),
      });
      relatorio.proveniencia = {
        auditada: auditoria.ok,
        em: new Date().toISOString(),
        ancoras: auditoria.ancoras.map((a) => ({ caminho: a.caminho, id: a.id, hash: a.hash, tipo: a.tipo })),
        fontes: auditoria.fontes.length,
        impressao: auditoria.impressao,
        resumo: auditoria.resumo,
        fases: auditoria.fases,
      };
      if (!auditoria.ok) {
        relatorio.proveniencia.problemas = auditoria.problemas;
        if (!forcar) {
          return responderJson(Object.assign(relatorio, {
            ok: false,
            erro: 'a proveniência da escola «' + slug + '» não está em ordem — nada foi apagado. '
              + 'Corrige primeiro (reancorar, regerar os índices) e volta a tentar.',
            noRepositorio: false,
            noCloudflare: false,
          }), 409);
        }
        if (!motivoDoForcar) {
          return responderJson(Object.assign(relatorio, {
            ok: false,
            erro: 'forçar o expurgo exige declarar o motivo (`motivoDoForcar`) — nada foi apagado.',
            noRepositorio: false,
            noCloudflare: false,
          }), 400);
        }
        relatorio.proveniencia.forcada = motivoDoForcar;
      }
    } catch (err) {
      // NÃO SE APAGA O QUE NÃO SE CONSEGUIU AUDITAR. Uma falha de rede aqui é indistinguível de
      // «a proveniência está partida» do ponto de vista de quem vai apagar — e o custo de parar
      // é uma nova tentativa, enquanto o de avançar é irreversível.
      return responderJson(Object.assign(relatorio, {
        ok: false,
        erro: 'não consegui auditar a proveniência: ' + ((err && err.message) || String(err)) + ' — nada foi apagado',
        noRepositorio: false,
        noCloudflare: false,
      }), 500);
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
        scripts: scriptsDeConfianca(env),
        mapaKv: env && env.PADD_KV,
      });
      relatorio.cloudflare.morada = morada;
    } catch (err) {
      relatorio.cloudflare = { erro: (err && err.message) || String(err), morada };
    }

    // 4. O REPOSITÓRIO. O desfecho do KV vai JUNTO: se a limpeza das chaves não se completou,
    // a pendência fica gravada no elo do expurgo — e é de lá que a retomada a lê, quando a
    // escola já não existe em lugar nenhum (`wrangler.<slug>.jsonc` sai neste mesmo commit).
    //
    // O DESFECHO SAI DE `desfechoDoKvParaOElo`, e não de um `?:` sobre `cloudflare.kv`
    // (01/11/2026): o `?:` devolvia `null` quando a metade Cloudflare LANÇAVA, e o elo ficava
    // sem bloco `kv` — indistinguível de «não havia o que limpar». Ver a função.
    const desfechoKv = desfechoDoKvParaOElo({ cloudflare: relatorio.cloudflare, morada, slug });
    try {
      relatorio.repositorio = await apagarEscolaDoRepo({
        token: ghToken, dono: DONO, repo: REPO, ref: REF, slug, confirmacao, motivo,
        kv: desfechoKv,
        // A PROVENIÊNCIA VAI PARA O ELO. É o que sobra das âncoras depois de apagadas: o que
        // existia, com que hashes, e a impressão do conjunto — ver `comElo`.
        proveniencia: relatorio.proveniencia,
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
    //
    // E a conta passa a ser a do DESFECHO (01/11/2026), não a de `cloudflare.kv`: com a
    // metade Cloudflare lançada, `cloudflare.kv` é `undefined`, `kvFalhou` era `false` e a
    // rota respondia `ok: true` sobre chaves que ninguém tinha tocado.
    const kvFalhou = Boolean(desfechoKv && desfechoKv.ok === false);
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
    return responderCriacao(request, env, { origem: 'painel', exigirCadastro: false });
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
      // O MESMO `servirAPagina` DO MODO PÚBLICO, com a marca do painel — uma função, duas portas.
      return servirAPagina(request, env, { modo: 'dono' });
    }
    return env.ASSETS.fetch(request);
  }
  return new Response('não encontrado', { status: 404 });
}

// `moradaDaEscola` sai para fora porque é a pergunta «onde esta escola vive?» — a que o
// expurgo faz ANTES de apagar qualquer coisa, e a única que pode ser respondida sem apagar
// nada. Exportada, ela é provável no runtime real (o defeito que ela sofreu — `Buffer` num
// runtime que não o tem — passou por todos os testes em Node sem ser visto).
module.exports = {
  fetch, scheduled, expurgar, moradaDaEscola, validarCriacaoEscola, tituloDoSlug,
  desfechoDoKvParaOElo,
  // AS DUAS PORTAS E O QUE AS SEPARA (25/11/2026). Exportadas porque são a REGRA que a prova tem
  // de medir sem um Worker à frente: «este pedido é do público ou do proprietário?» decide o que
  // se serve e o que se recusa, e uma regra que só se testa em produção descobre-se em produção.
  responderCriacao, gravarCadastro, mandarBoasVindas, ehPaginaPublica, servirAPagina,
  removerDoPainel, marcarPagina, lerComercial, gravarComercial, chaveComercial, ESTADOS_COMERCIAL,
  hostDoProprietario, urlDaPaginaPublica,
  /* O FINANCEIRO E A CARÊNCIA (25/11/2026). Exportados pela mesma razão dos de cima: a conta dos
   * três meses e a regra «o KV manda, o segredo responde» são regras, e uma regra que só se mede
   * em produção descobre-se em produção — com o dinheiro de alguém no meio. */
  lerPix, gravarPix, lerDescontos, concederDesconto, retirarDesconto,
  carenciaAte, MESES_DE_CARENCIA,
};
