'use strict';

/**
 * producao.js — a PONTE de PRODUÇÃO (o Worker de cada ESCOLA).
 *
 * O Worker de produção serve, na MESMA origem, três coisas:
 *   1. o pacote do ciclo (o ASSETS, asset-first);
 *   2. o lançamento da aula (POST /api/receber, na raiz — o `lancamento.html`);
 *   3. a PORTA de elicitação, sob `/plano-observacao/`.
 *
 * A porta é a MESMA do experimento — as rotas agnósticas de `rotas.js` —, mas
 * vive num SUBDIRETÓRIO do ASSETS (`plano-observacao/`): o conteúdo, o esquema,
 * o PO, o prompt, a identidade e os estáticos da porta ficam lá, e a ponte
 * `cloudflare.js` os lê com o prefixo. O PADD_KV é o MESMO (produção) — os
 * cadastros, o cartão da geração e o lançamento caem na mesma família de chaves (os
 * envelopes já não: eles vão para o acervo do repositório desde 20/10/2026).
 *
 * A fronteira: este módulo só DECIDE para onde vai o pedido (porta × lançamento
 * × pacote) e retira o prefixo da porta antes de despachar. Nenhuma lógica de
 * elicitação vive aqui.
 */

const { fetch: portaFetch } = require('./cloudflare.js');
const bastidores = require('./bastidores.js');
// A MARCA DO SISTEMA (agora um link para a raiz) e o preenchimento do slot vazio. Ver
// `comAparencia`.
const { MARCA, MARCA_NA_BARRA } = require('../../tools/templates/nav-html.js');
// A BARRA DE NAVEGAÇÃO — o MESMO desenho que a montagem da publicação usa (20/10/2026).
const navModulo = require('../nucleo/nav.js');
const { criarArmazenamento } = require('./cloudflare.js');
// AS TRÊS LISTAS DO ACERVO (24/10/2026) — a anamnese, o plano de ensino e o PO listam REGISTOS,
// e os registos vivem no KV. Ver o bloco 0.2 do `fetch`.
const listasDoAcervo = require('./listas-do-acervo.js');
const { respostaEstado, esc } = require('./estado-html.js');
const { temProfessor, aparenciaDaEscola, IDS_DAS_PALETAS, PALETA_PADRAO } = bastidores;
// AS ESCOLAS DE TESTE — os três JSON e o preenchidor. Ver `teste-fixtures.js` e
// `teste-cliente.js`. Só a escola cujo slug termina em `teste-1/2/3` recebe isto;
// as outras não veem nem o atributo, nem o script, nem a rota.
const { numeroDoTeste, fixtureDaEscola } = require('./teste-fixtures.js');
const { SCRIPT: SCRIPT_DO_TESTE } = require('./teste-cliente.js');
// O AVISO DA GERAÇÃO — o cartão que diz o que está a ser gerado, em que passo vai e
// como terminou. Entra em TODAS as escolas (não só nas de teste): a espera é de todas.
const { SCRIPT: SCRIPT_DA_GERACAO } = require('./geracao-cliente.js');

/** Uma resposta JSON curta — a ponte não tinha uma, e a rota de teste não pede mais. */
function jsonCurto(objeto, status) {
  return new Response(JSON.stringify(objeto), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/**
 * A APARÊNCIA DA ESCOLA, APLICADA NO SERVIDOR (18/10/2026) — a decisão C15 é «a preferência
 * é da escola».
 *
 * O tema nasceu como escolha do navegador (`localStorage`) e era provisório por declaração.
 * Com a preferência na escola, ele tem de chegar **antes** de a página pintar — senão a
 * pessoa vê a pele errada e ela troca à frente dos olhos. E tem de chegar a **todos**,
 * inclusive a quem abre o documento do ciclo sem senha nenhuma.
 *
 * A injeção é cirúrgica: só o atributo no `<html>`. Nada de reescrever o HTML, nada de
 * tocar em conteúdo — e se a página não for HTML, a resposta passa intacta. O
 * `data-modo-fonte="escola"` diz de quem é a decisão: é ele que faz o `assets/nav.js` não
 * aplicar por cima a memória de um navegador usado antes.
 *
 * O `content-length` sai porque o corpo mudou de tamanho; mantê-lo truncaria a página.
 * O `content-encoding` também: o corpo já foi lido e descomprimido pelo `text()`.
 *
 * DOIS EIXOS (18/10/2026): além do modo, a **família de cores**. A ponte passa a receber o
 * par `{modo, paleta}` e a repor os dois atributos — porque o pacote do ciclo e a porta são
 * servidos por aqui, e uma família que valesse só nos Bastidores não seria «da escola».
 */
async function comAparencia(resposta, aparencia, extras) {
  const menu = (extras && extras.menu) || null;
  const ap = aparencia || {};
  const teste = Number((extras && extras.teste) || 0);
  const modo = ap.modo === 'noturna' ? 'noturna' : 'clara';
  // A FAMÍLIA É SEMPRE PUBLICADA, mesmo quando é a padrão. `data-paleta` ausente significaria
  // «a padrão» — e uma página que não DIZ de que família é obriga toda a prova a tolerar duas
  // formas de dizer o mesmo. Escrito, o atributo é uma afirmação: «esta página é da Verde de
  // Ensaio». Só um id que a folha não conhece é que não se escreve: seria o pior dos dois
  // mundos — o atributo a jurar uma família e a folha a não a desenhar.
  //
  // A LISTA VEM DO MÓDULO, NÃO DAQUI (18/10/2026). Ela estava escrita à mão neste arquivo —
  // `['bordo', 'cortina']` — e quando a terceira família entrou, `verde` não passou: caiu no
  // padrão em TUDO o que a escola serve por esta ponte (o pacote do ciclo, o lançamento e a
  // porta), enquanto a Produção — que lê a lista verdadeira — pintava de verde. O sintoma que
  // o dono do produto viu: «a cor só tem efeito dentro dos bastidores». Duas listas da mesma
  // coisa é uma lista a menos; o valor agora é o mesmo que o seletor oferece.
  const pedida = String(ap.paleta || '');
  const paleta = IDS_DAS_PALETAS.indexOf(pedida) === -1 ? PALETA_PADRAO : pedida;
  if (!resposta) return resposta;
  const tipo = String(resposta.headers.get('content-type') || '').toLowerCase();
  if (tipo.indexOf('text/html') === -1) return resposta;
  let texto;
  try {
    texto = await resposta.text();
  } catch (e) {
    return resposta;
  }
  // Se a página já traz o atributo (servida antes desta versão, ou uma vista dos Bastidores),
  // ele é REPOSTO, não duplicado: duas ocorrências de `data-modo` deixariam a primeira valer.
  texto = texto.replace(/<html([^>]*)>/i, (tudo, attrs) => {
    const limpos = String(attrs)
      .replace(/\sdata-modo="[^"]*"/gi, '')
      .replace(/\sdata-paleta="[^"]*"/gi, '')
      .replace(/\sdata-modo-fonte="[^"]*"/gi, '')
      .replace(/\sdata-escola-teste="[^"]*"/gi, '');
    return '<html' + limpos + ' data-modo="' + modo + '" data-paleta="' + paleta +
      '" data-modo-fonte="escola"' +
      (teste ? ' data-escola-teste="' + teste + '"' : '') + '>';
  });

  // O PREENCHEDOR DAS ESCOLAS DE TESTE (19/10/2026). Ele só entra na PORTA
  // (`data-tela="porta"`) e só quando o slug casa. A página do pacote (índice,
  // aulas, guia) não tem formulário para preencher e não recebe o script.
  if (teste && texto.indexOf('data-tela="porta"') !== -1 &&
      texto.indexOf('/assets/teste-preenchimento.js') === -1) {
    texto = texto.replace(/<\/body>/i,
      '<script src="/assets/teste-preenchimento.js"></script></body>');
  }

  // O AVISO DA GERAÇÃO (19/10/2026) — só na PORTA, e em todas as escolas.
  //
  // Ele NÃO vive no `porta/index.html` porque a porta é COPIADA para dentro do pacote
  // de cada escola (`plano-observacao/`) e só se refaz numa geração: escrito lá dentro,
  // o aviso só chegaria às escolas depois da próxima geração — justamente a operação
  // que ele existe para acompanhar. Injeta-o quem serve, como já faz com o preenchidor
  // das escolas de teste. A página do pacote (índice, aulas, guia) não tem o que
  // acompanhar e não o recebe.
  if (texto.indexOf('data-tela="porta"') !== -1 &&
      texto.indexOf('/assets/geracao.js') === -1) {
    texto = texto.replace(/<\/body>/i, '<script src="/assets/geracao.js"></script></body>');
  }

  /*
   * A BARRA, DESENHADA AO SERVIR (20/10/2026).
   *
   * ESTA É A CORREÇÃO ESTRUTURAL. A barra era escrita em QUATRO sítios — a raiz, o pacote do
   * ciclo (`gerar_nav`), a porta (`gerar_nav_zero`, congelada na criação da escola) e os
   * Bastidores (`navSistema`) — e cada um era um retrato do dia em que aquela página nasceu.
   * Indo da raiz para a anamnese, a barra VOLTAVA à antiga: sem Ciclos, sem Aulas, sem
   * Planejamento e sem os Bastidores. «Corrigir os links» seria correr atrás de quatro
   * construções para sempre — e a quinta apareceria no dia seguinte.
   *
   * Agora há UM menu (o `nav.json` que a montagem publica) e UM desenho (`motor/nucleo/nav.js`),
   * e é aqui que se aplicam: em TODA página HTML que esta ponte serve — do ASSETS, da porta ou
   * dos Bastidores. As páginas já geradas que nunca serão regeradas passam a ter a barra de
   * hoje, que é a maioria delas.
   *
   * O `href` de cada item é ABSOLUTO (`/turma/plano.html`): é o que torna a mesma barra válida
   * dentro do pacote (onde `plano.html` seria relativo à turma) e na porta (onde seria relativo
   * à porta). A relativa é a razão de ter havido barras diferentes por página.
   */
  if (menu) {
    const comBarra = navModulo.aplicar(texto, menu, (extras && extras.pedido) || '/');
    if (comBarra) texto = comBarra;
  }

  // O SLOT DA MARCA, PREENCHIDO AO SERVIR (18/10/2026).
  //
  // A barra das páginas da porta é ESCrita no pacote na geração (o marcador `<!-- NAV -->`
  // do `porta/index.html`). Isso quer dizer que uma página gerada ANTES de a marca existir
  // nunca a recebe — e foi o que aconteceu: a marca aparecia no índice, no Estúdio e na
  // Produção, e não na anamnese, no plano de ensino nem no PO, que são a mesma barra com um
  // pacote mais velho. O sintoma é silencioso: um vão no canto esquerdo da barra.
  //
  // A PONTE É O LUGAR CERTO. Ela já existe para fazer a identidade da ESCOLA chegar a tudo
  // o que ela serve (o `data-paleta`/`data-modo` acima); a marca é a outra metade da mesma
  // frase — a identidade do SISTEMA. Preencher aqui faz com que um pacote velho, ou um
  // pacote de outra professora que ninguém vai regerar, fique certo sem ser tocado.
  //
  // É CIRÚRGICO E IDEMPOTENTE: só o slot VAZIO é preenchido, e uma página que já traz a
  // marca passa intacta (o `index.html` dos pacotes já a tem no arquivo; esta linha não a
  // duplica). Sem `<span class="marca">` — a raiz não tem essa barra — nada acontece.
  /*
   * O SLOT DA MARCA PASSA A SER O LINK, e não só o desenho (20/10/2026).
   *
   * A marca virou um `<a href="/">` em `nav-html.js`. Os pacotes gerados antes de hoje trazem
   * `<span class="marca">` — **nos dois estados**, e os dois têm de ser cobertos:
   *
   *   · VAZIO (`<span class="marca" aria-hidden="true"></span>`) — pacote sem a marca, que a
   *     ponte preenchia com o SVG dentro do mesmo `<span>`;
   *   · PREENCHIDO (`<span class="marca" …><svg …></svg></span>`) — pacote que já traz o desenho.
   *
   * Em nenhum dos dois o clique fazia nada. Uma correcção que só olhasse o vazio deixaria a
   * maioria dos pacotes a servir uma logo inerte, e o sintoma é invisível: o desenho está lá.
   *
   * O CONTEÚDO é preservado quando existe (regex não-gulosa: o SVG não tem `</span>` dentro), e
   * o mark-up do link vem da MESMA constante que o gerador do nav — uma segunda cópia na ponte
   * divergiria no dia em que o `<a>` mudasse. Os atributos do `<span>` velho NÃO são
   * transportados: `aria-hidden="true"` num `<a>` deixava-o sem nome acessível, que é
   * precisamente o que o `aria-label` do `<a>` evita.
   *
   * É IDEMPOTENTE: depois da substituição já não há `<span class="marca">` nenhum — o `<a>` que
   * o gerador escreve põe o desenho num `<span aria-hidden>` sem a classe.
   */
  texto = texto.replace(
    /<span class="marca"([^>]*)>([\s\S]*?)<\/span>/g,
    (tudo, attrs, dentro) => {
      const desenho = dentro && dentro.indexOf('<svg') !== -1 ? dentro : MARCA;
      return MARCA_NA_BARRA.trim().replace('<span aria-hidden="true">' + MARCA + '</span>',
        '<span aria-hidden="true">' + desenho + '</span>');
    });
  const cabecalhos = new Headers(resposta.headers);
  cabecalhos.delete('content-length');
  cabecalhos.delete('content-encoding');
  return new Response(texto, { status: resposta.status, statusText: resposta.statusText, headers: cabecalhos });
}

// A PORTA vive num SÓ subdiretório do ASSETS (`plano-observacao/`), mas é servida
// sob TRÊS caminhos de URL — cada fonte da elicitação tem a sua própria URL:
//   · `/anamnese/`         → a anamnese (fonte padrão);
//   · `/plano-ensino/`     → o plano de ensino (`?fonte=plano`);
//   · `/plano-observacao/` → o PO (`?fonte=po`).
// O plano de ensino deixou de entrar pelo PO: virou rota própria, no mesmo nível
// da anamnese e do PO no menu da Área do Professor.
// O prefixo do ASSETS é o mesmo nos três: a porta lê o conteúdo de
// `plano-observacao/` — o que muda é só o caminho que o professor digita.
const PREFIXO_PO = '/plano-observacao';
const PREFIXO_ANAMNESE = '/anamnese';
const PREFIXO_PLANO = '/plano-ensino';
const PREFIXO_ASSETS = 'plano-observacao/';

function caminhoDaPorta(path, prefixo) {
  return path === prefixo ? '/' : path.slice(prefixo.length);
}

/**
 * O MENU DA ESCOLA, lido do ASSETS — `nav.json` (20/10/2026).
 *
 * É o contrato entre a MONTAGEM (que lê o disco: os pacotes, as aulas, os documentos) e esta
 * ponte, que não tem `fs`. O cache vive no isolate e é seguro: o ficheiro só muda num deploy, e
 * um deploy reinicia os isolates. Ausente o ficheiro, devolve `null` e cada página fica com a
 * barra que já trazia — degradar é melhor do que servir uma barra inventada.
 */
let MENU_EM_CACHE = null;
async function menuDaEscola(env) {
  if (MENU_EM_CACHE !== null) return MENU_EM_CACHE || null;
  if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') return null;
  try {
    const res = await env.ASSETS.fetch(new URL('/nav.json', 'https://assets.local'));
    if (!res.ok) { MENU_EM_CACHE = false; return null; }
    MENU_EM_CACHE = await res.json();
    return MENU_EM_CACHE;
  } catch (erro) {
    MENU_EM_CACHE = false;
    return null;
  }
}

/** A aparência da escola, com o KV e o slug à mão. Sem KV (o servidor de desenvolvimento),
 *  o padrão é `clara` + a família padrão — a ausência de dado não inventa uma aparência. */
async function aparenciaDoEnv(env) {
  const kv = env && env.PADD_KV;
  const escola = String((env && env.ESCOLA_SLUG) || '');
  if (!kv || !escola) return { modo: 'clara', paleta: 'bordo' };
  return aparenciaDaEscola(kv, escola);
}

async function fetch(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // O subdomínio do pedido — a identidade de rede do Worker. Numa escola é
  // `<escola>.tmenegaz77.workers.dev`; na raiz é `danca.tmenegaz77.workers.dev`.
  const subdominio = (url.hostname || '').split('.')[0];

  // A TRAVA DE IDENTIDADE (não é o freio): esta ponte é de ESCOLA, e o
  // `ESCOLA_SLUG` (vars do wrangler) tem de estar declarado E bater com o
  // subdomínio. Antes, um deploy trocado — a config de uma escola num Worker de
  // outra, ou a ponte de escola na raiz `danca` — era SILENCIOSO: a página
  // «Escola desabilitada» aparecia sem dizer o que houve. Agora o erro é
  // visível e aponta a causa: config × Worker trocados.
  const identidadeOk = Boolean(env.ESCOLA_SLUG) && subdominio === env.ESCOLA_SLUG;

  // A SAÚDE (o «OK»): responde QUEM é este Worker e se a identidade bate — para
  // verificar um deploy com `curl`, não por visita à página. Responde também
  // quando a identidade está quebrada (status 500 + o campo `erro`), para que o
  // diagnóstico não dependa de adivinhar.
  if (path === '/api/saude') {
    const corpo = {
      ok: identidadeOk && env.ESCOLA_HABILITADA !== 'nao',
      tipo: 'escola',
      slug: env.ESCOLA_SLUG || null,
      subdominio,
      habilitada: env.ESCOLA_HABILITADA !== 'nao',
      erro: identidadeOk
        ? null
        : 'ESCOLA_SLUG ausente ou divergente do subdomínio — config × Worker trocados',
    };
    return new Response(JSON.stringify(corpo), {
      status: identidadeOk ? 200 : 500,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
    });
  }

  // A trava, de fato: sem identidade, NADA serve — erro visível, não freio.
  if (!identidadeOk) {
    return respostaEstado('Configuração incorreta do Worker',
      '<p>A ponte de ESCOLA está rodando num Worker cujo subdomínio não bate com o ' +
      '<code>ESCOLA_SLUG</code>.</p>' +
      '<p>Subdomínio: <code>' + esc(subdominio) + '</code> · ESCOLA_SLUG: <code>' +
      esc(env.ESCOLA_SLUG || '(ausente)') + '</code></p>' +
      '<p>Provável causa: <code>wrangler deploy</code> com a config de outra escola (ou da raiz) ' +
      'neste Worker. Reimplante com <code>wrangler deploy -c wrangler.&lt;escola&gt;.jsonc</code>.</p>' +
      '<p>Diagnóstico: <code>curl &lt;origin&gt;/api/saude</code></p>', 500);
  }

  // O MENU DA ESCOLA, uma vez por pedido (o isolate guarda-o entre pedidos: só muda em deploy).
  const menu = await menuDaEscola(env);

  // 0. O FREIO da escola: a flag de habilitação. Só `"nao"` DESLIGA a escola —
  //    nenhuma rota serve conteúdo, qualquer caminho devolve esta página. É o
  //    "desliga" para resolver problemas diversos sem derrubar o Worker: o
  //    domínio continua no ar, mas não abre nada. A ausência da flag não
  //    desliga (defesa em profundidade contra a raiz). A flag é uma `vars` do
  //    wrangler (não segredo): visível e auditável. A identidade já foi
  //    conferida acima — aqui é uma escola REAL, deliberadamente desligada.
  if (env.ESCOLA_HABILITADA === 'nao') {
    return respostaEstado('Escola desabilitada',
      '<p>Esta escola está desabilitada para resolver problemas diversos.</p>' +
      '<p>Escola: <code>' + esc(env.ESCOLA_SLUG) + '</code></p>', 503);
  }

  // 0.0 AS ESCOLAS DE TESTE (19/10/2026). A rota e o script existem em TODAS as
  //     escolas, mas só respondem quando o slug termina em `teste-1/2/3`. O fixture é
  //     LEITURA PURA: o navegador o busca e preenche campos; nada é enviado, nada é
  //     gravado no KV. Escola normal recebe 404 e o script não é injetado.
  if (path === '/api/teste') {
    const fixture = fixtureDaEscola(env.ESCOLA_SLUG);
    if (!fixture) return jsonCurto({ ok: false, erro: 'esta escola não é de teste' }, 404);
    return jsonCurto({ ok: true, teste: numeroDoTeste(env.ESCOLA_SLUG), escola: env.ESCOLA_SLUG, fixture: fixture });
  }
  if (path === '/assets/teste-preenchimento.js') {
    return new Response(SCRIPT_DO_TESTE, {
      status: 200,
      headers: {
        'Content-Type': 'text/javascript;charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
  // O `no-store` não é preciosismo: o aviso muda com o produto, e um script em cache
  // no navegador de quem já abriu a porta mostraria o cartão da versão anterior.
  if (path === '/assets/geracao.js') {
    return new Response(SCRIPT_DA_GERACAO, {
      status: 200,
      headers: {
        'Content-Type': 'text/javascript;charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  // 0.1 O MOCK dos Bastidores (andaime): `/bastidores` e `/api/bastidores/*`
  //     vivem FORA da porta — a lista de alunas e a senha do professor que a
  //     anamnese consulta. Sem Produção real, este andaime as entrega.
  //     E VESTE A ESCOLA como qualquer outra página: os Bastidores também levam a barra.
  const bast = await bastidores.fetch(request, env);
  if (bast) {
    return comAparencia(bast, await aparenciaDoEnv(env),
      { teste: numeroDoTeste(env.ESCOLA_SLUG), menu, pedido: path });
  }

  /* 0.2 AS TRÊS LISTAS DO ACERVO (24/10/2026) — servidas, não montadas.
   *
   * A anamnese, o plano de ensino e o Plano de Observação vivem no KV, e mudam a cada ato
   * registado. Uma página montada no deploy mostraria o acervo do dia do deploy: a anamnese que
   * o professor acabou de gravar não apareceria até ao deploy seguinte, e a lista mentiria por
   * omissão — que é o pior modo de mentir.
   *
   * Elas são servidas aqui, antes da porta e do ASSETS, e a página é a MESMA das outras cinco:
   * `lista-html.js`. Quem desenha a barra é o mesmo `nav.js`, e a aparência é a da escola — esta
   * rota passa pelo `comAparencia` como todas as outras.
   */
  if (path === '/area-do-professor/anamnese' || path.startsWith('/area-do-professor/anamnese/')
    || path === '/area-do-professor/plano-de-ensino' || path.startsWith('/area-do-professor/plano-de-ensino/')
    || path === '/area-do-professor/plano-de-observacao' || path.startsWith('/area-do-professor/plano-de-observacao/')) {
    const doAcervo = await listasDoAcervo.pagina(path, {
      env,
      menu,
      escola: env.ESCOLA_SLUG,
      curadorias: await bastidores.curadorias(env.PADD_KV, env.ESCOLA_SLUG),
    });
    if (doAcervo) {
      const resposta = new Response(doAcervo.html, {
        status: 200,
        headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store, max-age=0' },
      });
      return comAparencia(resposta, await aparenciaDoEnv(env),
        { teste: numeroDoTeste(env.ESCOLA_SLUG), menu, pedido: path });
    }
  }

  // 1. A porta de elicitação, sob os dois prefixos. Retira-se o prefixo do caminho
  //    (a rota vê `/`, `/api/…`, `/assets/…`) e a ponte lê o conteúdo do
  //    subdiretório do ASSETS.
  const prefixo =
    path === PREFIXO_PO || path.startsWith(PREFIXO_PO + '/') ? PREFIXO_PO
    : path === PREFIXO_ANAMNESE || path.startsWith(PREFIXO_ANAMNESE + '/') ? PREFIXO_ANAMNESE
    : path === PREFIXO_PLANO || path.startsWith(PREFIXO_PLANO + '/') ? PREFIXO_PLANO
    : null;
  if (prefixo) {
    // O FREIO da Área do Professor (a regra do «Produção»): enquanto não houver
    // PROFESSOR cadastrado nos Bastidores, a anamnese, o plano de ensino e o PO
    // NÃO abrem — o cadastro do professor é o que habilita a Área do Professor.
    // Os Bastidores (`/bastidores` e `/api/bastidores/*`) ficam FORA deste freio:
    // é por eles que o professor é cadastrado.
    if (!(await temProfessor(env))) {
      return respostaEstado('Área do Professor desabilitada',
        '<p>Esta escola ainda não tem um professor cadastrado — a Área do Professor ' +
        '(anamnese, plano de ensino e plano de observação) abre depois do cadastro.</p>' +
        '<p class="acoes"><a href="/bastidores/producao">Ir aos Bastidores → cadastrar o professor</a></p>',
        200);
    }
    const rel = caminhoDaPorta(path, prefixo);
    const alvo = new Request(new URL(rel + url.search, request.url), request);
    return comAparencia(await portaFetch(alvo, env, { prefixo: PREFIXO_ASSETS }),
      await aparenciaDoEnv(env),
      { teste: numeroDoTeste(env.ESCOLA_SLUG), menu, pedido: path });
  }

  // 2. O lançamento do pacote (o `lancamento.html` POSTa em /api/receber), na
  //    raiz. A rota vive nas rotas agnósticas (nucleo/lancamento.js).
  if (path === '/api/receber') {
    return portaFetch(request, env, { prefixo: PREFIXO_ASSETS });
  }

  // 2.1 A LEITURA do `-dados.json` em claro (`/api/dados`), também na raiz. O navegador não
  //     conhece a chave de cifra: ele manda a senha da pessoa e o Worker decifra com o segredo
  //     `SENHA_CRIPTO`, que fica só aqui. Ver `motor/servidor/ler-dados.js`.
  if (path === '/api/dados') {
    return portaFetch(request, env, { prefixo: PREFIXO_ASSETS });
  }

  // 3. O resto → o pacote. O asset-first do Cloudflare já serviu o estático que
  //    existe; este ramo cobre o `run_worker_first` (default) devolvendo o
  //    mesmo 404 que o Worker antigo devolvia.
  if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    // O PACOTE também veste a escola: o índice, as aulas, o guia — todos são documentos que
    // se leem, e ler no escuro é uma decisão da casa, não de quem abriu o link.
    return comAparencia(await env.ASSETS.fetch(request), await aparenciaDoEnv(env),
      { teste: numeroDoTeste(env.ESCOLA_SLUG), menu, pedido: path });
  }
  return new Response(JSON.stringify({ ok: false, erro: 'nao encontrado' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
  });
}

/* O ARMAZENAMENTO DA PONTE, exportado para a prova (24/10/2026). A prova das listas do acervo
 * semeia envelopes com o MESMO armazenamento que a ponte usa — e não com um KV de mentira com
 * outra forma. Sem isto, ela provaria o adaptador da prova, e não o da produção. */
module.exports = {
  fetch, comAparencia, aparenciaDoEnv, menuDaEscola,
  __armazenamento: (env) => criarArmazenamento(env),
};
