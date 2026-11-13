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
const { criarArmazenamento, carregarEstatico, passosDeGeracao } = require('./cloudflare.js');
// A CADEIA AUTOMÁTICA (09/11/2026) — a travessia que a troca/saída de aluna e a troca de
// direção de turma passam a fazer sozinhas. Monta-se só nas rotas que a pedem: carregar os
// conteúdos da porta em toda a página seria pagar quatro leituras por um gesto que não houve.
const { criarCadeia } = require('./cadeia.js');
const { criarConcluirPO } = require('./concluir-po.js');
const portaNucleo = require('../nucleo/porta.js');
// O CARIMBO É O DO MOTOR (09/11/2026): `YYYY-MM-DDTHH:MM`, no fuso da escola. O `toISOString()`
// devolve segundos e milissegundos, e o esquema do envelope recusa — o carimbo é o NOME do
// documento, e um nome com `:` e `.` não casa no padrão de id.
const { carimbarAgora } = require('../nucleo/elicitar.js');
const FUSO_PADRAO = 'America/Sao_Paulo';
const { contarSubpedidos, LIMITE_PADRAO } = require('./subpedidos.js');
// O `fontesDoCicloProntas` — a guarda que só deixa disparar com as fontes escritas.
const { fontesDoCicloProntas } = require('./geracao.js');
// AS TRÊS LISTAS DO ACERVO (24/10/2026) — a anamnese, o plano de ensino e o PO listam REGISTOS,
// e os registos vivem no KV. Ver o bloco 0.2 do `fetch`.
const listasDoAcervo = require('./listas-do-acervo.js');
const aulasDadas = require('./aulas-dadas.js');
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
      texto.indexOf('/scripts/teste-preenchimento.js') === -1) {
    texto = texto.replace(/<\/body>/i,
      '<script src="/scripts/teste-preenchimento.js"></script></body>');
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
      texto.indexOf('/scripts/geracao.js') === -1) {
    texto = texto.replace(/<\/body>/i, '<script src="/scripts/geracao.js"></script></body>');
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
  /* A MOLDURA, E NÃO SÓ A BARRA (05/11/2026). Era `aplicar`, que SUBSTITUI uma `<nav>` que já
   * exista — e a porta não tem uma: ela traz o marcador `<!-- NAV -->`. Medido ao vivo:
   * `/anamnese/` servida com o marcador cru, sem barra e sem coluna, enquanto a listagem ao lado
   * tinha as duas. `enquadrar` cobre as três formas (barra existente, marcador, documento sem
   * moldura) e é idempotente, que é o que permite correr em TODA resposta sem risco.
   *
   * EXCEPTO NA FOLHA, E ISSO CUSTOU UMA REGRESSÃO (05/11/2026). «Toda resposta» passou a incluir a
   * ficha da anamnese — e a pesquisadora viu-a «toda quebrada»: a barra e a coluna entraram no topo
   * do documento de impressão, em mark-up cru, sem um único estilo. Não é um defeito de desenho: é
   * de CSS. A moldura veste-se com `/assets/style.css`, e a folha NÃO a carrega — ela é servida
   * sozinha e declara os seus próprios tokens, de propósito, para sair certa no papel. Inserir-lhe
   * um `<nav>` é vestir uma peça de outra folha.
   *
   * A MARCA DE QUEM É FOLHA É `data-tela="ficha"` — a mesma nas TRÊS (`paginaDaFicha`,
   * `paginaDoPlano`, `paginaDoPO`, todas pelo `folha()` do `ficha-html.js`). Por isso o plano de
   * ensino e o plano de observação estavam quebrados do mesmo modo, mesmo sem ninguém os ter aberto
   * ainda. Quem acrescentar uma folha nova diz que é folha, e não recebe moldura.
   *
   * O `data-modo`/`data-paleta` CONTINUAM a entrar: é a identidade da escola, e ela é declarada
   * inline — não depende da folha de estilos. */
  const ehFolha = /data-tela="ficha"/.test(texto);
  if (menu && !ehFolha) {
    const comMoldura = navModulo.enquadrar(texto, menu, (extras && extras.pedido) || '/');
    if (comMoldura) texto = comMoldura;
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

/**
 * O ÍNDICE DAS AULAS DADAS, montado por pedido.
 *
 * Ele lê o REPOSITÓRIO (a fonte de cada ciclo, escrita no acto do lançamento) e o `ciclos.json`
 * do pacote (que DECLARA o prazo de cada aula). O leitor de asset é o `ASSETS` do Worker — não é
 * rede —, e a token é a mesma que o acervo já usa.
 */
function indiceDeAulas(env) {
  const lerAsset = async (rel) => {
    if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') return null;
    try {
      const res = await env.ASSETS.fetch(new URL('/' + String(rel || '').replace(/^\/+/, ''),
        'https://assets.local'));
      return res.ok ? await res.text() : null;
    } catch (erro) {
      return null;
    }
  };
  return aulasDadas.criarIndiceDeAulas({ token: (env && env.GITHUB_TOKEN) || null, lerAsset });
}

/** A aparência da escola, com o KV e o slug à mão. Sem KV (o servidor de desenvolvimento),
 *  o padrão é `clara` + a família padrão — a ausência de dado não inventa uma aparência. */
async function aparenciaDoEnv(env) {
  const kv = env && env.PADD_KV;
  const escola = String((env && env.ESCOLA_SLUG) || '');
  if (!kv || !escola) return { modo: 'clara', paleta: 'bordo' };
  return aparenciaDaEscola(kv, escola);
}

/**
 * A CADEIA, MONTADA PARA UM PEDIDO (09/11/2026).
 *
 * Ela precisa de peças que a página dos Bastidores não tem: os CONTEÚDOS da porta (o plano e o
 * PO, para o `elicitar` derivar), o armazenamento do acervo, os escritores do repositório e o
 * disparador. Tudo isso já existe neste Worker — o que faltava era a ponte.
 *
 * O ORÇAMENTO É PRÓPRIO E DECLARADO. A cadeia escreve no repositório (envelopes, fontes, um
 * dispatch), e sem contador repetiria o defeito de 08/11/2026: o teto de subpedidos estoura a
 * meio e a invocação é abortada sem erro. O contador é o `fetch` da rede embrulhado — o mesmo
 * desenho do `montarPorta` —, e os escritores perguntam-lhe antes de começar.
 *
 * Devolve `null` quando o Worker não tem o que a cadeia precisa (sem token, sem os conteúdos):
 * a rota dos Bastidores continua a funcionar, e a resposta diz que a travessia não correu —
 * em vez de a rota falhar por causa de uma automação acessória.
 */
async function montarCadeia(env, escola, fetchImpl) {
  const prefixo = 'plano-observacao/';
  let conteudoTexto, esquemaTexto, poTexto, planoTexto;
  try {
    [conteudoTexto, esquemaTexto, poTexto, planoTexto] = await Promise.all([
      carregarEstatico(env, 'conteudo/anamnese.json', prefixo),
      carregarEstatico(env, 'envelope/elicitacao-schema.json', prefixo),
      carregarEstatico(env, 'po/conteudo/po.json', prefixo),
      carregarEstatico(env, 'plano/conteudo/plano.json', prefixo),
    ]);
  } catch (erro) {
    return null;
  }
  if (!conteudoTexto || !esquemaTexto || !poTexto || !planoTexto) return null;
  let conteudo, esquema, conteudoPO, conteudoPlano;
  try {
    conteudo = JSON.parse(conteudoTexto);
    esquema = JSON.parse(esquemaTexto);
    conteudoPO = JSON.parse(poTexto);
    conteudoPlano = JSON.parse(planoTexto);
  } catch (erro) {
    return null;
  }

  // O CONTADOR É O DO PEDIDO, quando a ponte o passou (09/11/2026): a transferência que
  // dispara a cadeia gasta do MESMO teto, e é isso que evita a invocação a morrer a meio —
  // o defeito de 08/11/2026. Sem contador partilhado, um é criado aqui.
  if (!fetchImpl) {
    const rede = (url, init) => {
      if (typeof globalThis.fetch !== 'function') throw new Error('sem `fetch` de rede neste runtime');
      return globalThis.fetch(url, init);
    };
    fetchImpl = contarSubpedidos(rede, (env && env.SUBPEDIDOS) || LIMITE_PADRAO);
  }
  const { disparar, escreverPO, escreverPlano, escreverCiclo, geracao } = passosDeGeracao(env, fetchImpl);
  const armazenamento = criarArmazenamento(env, fetchImpl);
  const kv = (env && env.PADD_KV) || null;

  // OS LEITORES DOS CADASTROS — os mesmos que a página usa (chaves `bastidores/<escola>/…`).
  const lerLista = async (chave) => {
    if (!kv) return [];
    try {
      const bruto = await kv.get('bastidores/' + escola + '/' + chave);
      const lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (erro) { return []; }
  };
  const lerCuradorias = (slug) => lerLista('curadorias');
  const lerTurmas = (slug) => lerLista('turmas');
  /* O CADASTRO DOS PROFESSORES (10/11/2026) — a cadeia precisa dele para escrever NOME no
   * documento derivado, e não slug. É a mesma lista que a página lê. */
  const lerProfessores = (slug) => lerLista('professores');
  const lerLinhasDeBase = async () => {
    // A LEITURA É A MESMA DA PÁGINA: repositório primeiro (é onde os actos vivem), KV por cima
    // (o rascunho) — e a função que faz isso é a dos Bastidores, não uma segunda. A variante
    // `linhasDeBaseDaEscola` é a que constrói o store do repositório a partir do `env`.
    try { return await bastidores.linhasDeBaseDaEscola(env, escola); } catch (erro) { return lerLista('linhas-de-base'); }
  };
  const linhaDeBaseDaTurma = async (turma) => {
    try {
      const linhas = await lerLinhasDeBase();
      const curs = await lerCuradorias(escola);
      const escolhido = portaNucleo.elencoEscolhidoPelaTurma(curs, String(turma || '').trim(), '', linhas);
      if (escolhido) return portaNucleo.linhaDeBaseDoElenco(linhas, escolhido.id);
      return portaNucleo.linhaDeBaseDaTurma(linhas, String(turma || '').trim());
    } catch (erro) { return null; }
  };
  const anamnesesDaTurma = async () => {
    const mapa = {};
    try {
      for (const o of await portaNucleo.anamneses(armazenamento, null, null)) {
        const aluna = String((o && o.valor) || '').trim();
        const carimbo = String((o && o.carimbo) || '').trim();
        if (aluna && carimbo) mapa[aluna] = { carimbo, vinculada: Boolean(o.vinculada) };
      }
    } catch (erro) { /* a §6 declara a lacuna */ }
    return mapa;
  };
  const concluirPO = criarConcluirPO({
    armazenamento, porta: portaNucleo, escreverPO, escreverCiclo, disparar, geracao,
    fontesDoCicloProntas,
    linhaDeBaseDaTurma, anamnesesDaTurma, conteudoPO,
  });

  return criarCadeia({
    armazenamento, porta: portaNucleo, conteudo, conteudoPlano, conteudoPO, esquema,
    carimbar: () => carimbarAgora((env && env.FUSO) || FUSO_PADRAO),
    escreverPlano, escreverPO, escreverCiclo, disparar, geracao, concluirPO,
    lerCuradorias, lerTurmas, lerLinhasDeBase, linhaDeBaseDaTurma, lerProfessores,
    kv, escola,
    orcamento: (fetchImpl && fetchImpl.subpedidos) || null,
    urlDaPorta: bastidores.urlDaPorta,
  });
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
  /* OS SCRIPTS QUE O MOTOR GERA NÃO MORAM NO `/assets/` (13/11/2026).
   *
   * O `run_worker_first` desta escola passou a mandar as duas pastas de assets (a de cada pacote e
   * a dos prefixos da porta) direto para o ASSETS — é o que faz o CSS, o `nav.js` e o favicon
   * serem servidos sem invocar o Worker, e
   * portanto sem gastar pedido (o plano gratuito conta invocações, e o ASSETS é «grátis e
   * ilimitado»). Esses dois scripts são a exceção: são GERADOS aqui, não existem no disco, e com
   * aquela regra davam 404. Mudaram para `/scripts/`, que nenhuma regra declara como asset. */
  if (path === '/scripts/teste-preenchimento.js') {
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
  if (path === '/scripts/geracao.js') {
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
  /* A CADEIA SÓ SE MONTA ONDE É USADA (09/11/2026): os quatro gestos que mudam o corpo ou a
   * direção de uma turma, e a leitura do log. Em qualquer outro pedido dos Bastidores ela é
   * `null`, e o custo é zero. */
  let cadeia = null;
  let fetchDoPedido = null;
  if (path.startsWith('/api/bastidores')) {
    const gestos = [
      '/api/bastidores/elenco-mover',
      '/api/bastidores/linha-de-base',
      '/api/bastidores/curadoria',
      '/api/bastidores/curadoria-derivar',
      // A MUDANÇA DE SALA (09/11/2026) — as duas rotas que mudam o RITMO de uma Sala. A cadeia
      // relê o ritmo no plano, deriva o PO e fecha o pacote; sem o gatilho, o documento impresso
      // continuava a declarar o horário antigo (ver `motor/servidor/cadeia.js`).
      '/api/bastidores/turma-editar',
      '/api/bastidores/turma-derivar',
      // O FECHO DO PACOTE NUMA INVOCAÇÃO PRÓPRIA (10/11/2026) — é ele que dá à geração os 50
      // subpedidos inteiros, quando o gesto que a pediu já gastou a maior parte do teto. Sem a
      // montagem aqui, a rota responderia «a cadeia não está montada» e o professor voltava à
      // via crucis que este caminho existe para acabar.
      '/api/bastidores/cadeia-pacote',
    ];
    const pede = (request.method === 'GET' && path === '/api/bastidores/cadeia')
      || (request.method === 'POST' && gestos.indexOf(path) !== -1);
    if (pede) {
      /* UM CONTADOR PARA O PEDIDO INTEIRO. A rota que dispara o gesto lê e escreve no
       * repositório; a cadeia, no mesmo pedido, lê e escreve outra vez. Contadores separados
       * faziam cada um julgar-se dentro do teto enquanto o conjunto já o tinha passado — a
       * lição de 08/11/2026. O `fetchDoPedido` é o mesmo para os dois. */
      fetchDoPedido = contarSubpedidos((url, init) => {
        if (typeof globalThis.fetch !== 'function') {
          throw new Error('sem `fetch` de rede neste runtime');
        }
        return globalThis.fetch(url, init);
      }, (env && env.SUBPEDIDOS) || LIMITE_PADRAO);
      cadeia = await montarCadeia(env, env.ESCOLA_SLUG, fetchDoPedido).catch(() => null);
    }
  }
  const bast = await bastidores.fetch(request, env, { cadeia, fetchImpl: fetchDoPedido });
  if (bast) {
    return comAparencia(bast, await aparenciaDoEnv(env),
      { teste: numeroDoTeste(env.ESCOLA_SLUG), menu, pedido: path });
  }

  /* 0.15 AS AULAS DADAS (06/11/2026) — a lista que faltava, e o índice que ela e o formulário
   * partilham.
   *
   * «Esse formulário para essa aula não tem que estar mais disponível, porque eu já fiz isso. Mas
   * ao mesmo tempo eu preciso de um lugar similar ao que eu tenho com aulas — a página aulas,
   * aonde eu listo as aulas dadas e posso abrir e ver como é que foi preenchido.»
   *
   * É SERVIDA, e não montada, pela razão de sempre: o que se lista muda a cada lançamento, e uma
   * página montada no deploy mostraria a escola do dia do deploy. O desenho é o das outras oito
   * listas (`lista-html.js`); a leitura é a da FONTE no repositório — a mesma que a geração lê —,
   * e não a do pacote publicado, que só muda dois a três minutos depois.
   */
  if (path === '/area-do-professor/aulas-dadas' || path.startsWith('/area-do-professor/aulas-dadas/')) {
    const pagina = await aulasDadas.pagina({
      escola: env.ESCOLA_SLUG,
      menu,
      pedido: '/area-do-professor/aulas-dadas/',
      indice: indiceDeAulas(env),
    });
    if (pagina) {
      const resposta = new Response(pagina.html, {
        status: 200,
        headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store, max-age=0' },
      });
      return comAparencia(resposta, await aparenciaDoEnv(env),
        { teste: numeroDoTeste(env.ESCOLA_SLUG), menu, pedido: '/area-do-professor/aulas-dadas/' });
    }
  }

  /* 0.16 O QUE JÁ FOI LANÇADO — `POST /api/lancadas` (06/11/2026).
   *
   * O FORMULÁRIO NÃO PODE OFERECER-SE PARA UMA AULA JÁ DADA, e o pacote não lhe pode responder
   * nessa janela: ele só muda quando a geração corre. A fonte muda no acto. Esta rota é a fonte,
   * reduzida ao mínimo — que aula, e o carimbo —, sem uma linha de conteúdo e sem senha: os
   * números das aulas lançadas já estão no `ciclos.json` do pacote, e o que se observou em cada
   * uma não vem por aqui.
   *
   * `ok:false` quando a leitura não deu: quem pergunta NÃO conclui «não há nada» de uma falha —
   * um formulário que desaparece porque o repositório não respondeu seria pior do que um a mais. */
  if (path === '/api/lancadas') {
    const corpo = await request.json().catch(() => null);
    const escola = env.ESCOLA_SLUG;
    const variante = String((corpo && corpo.variante) || '').trim();
    const ciclo = String((corpo && corpo.ciclo) || '').trim();
    try {
      const mapa = await indiceDeAulas(env).lancadas(escola, { variante, ciclo });
      if (!mapa) {
        return new Response(JSON.stringify({
          ok: false, erro: 'não consegui ler o índice de aulas desta escola',
        }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
      }
      return new Response(JSON.stringify({ ok: true, aulas: mapa }), {
        status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
      });
    } catch (erro) {
      return new Response(JSON.stringify({ ok: false, erro: (erro && erro.message) || String(erro) }), {
        status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    }
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
    /* OS RASCUNHOS DA LINHA DE BASE: UMA LEITURA PARA DOIS LEITORES (13/11/2026).
     *
     * A lista precisa deles fundidos com os actos (para dar a turma e a etiqueta de cada aluna), e
     * a cascata de revalidação precisa deles CRUS (é deles que sai o recorte do corpo). Eram duas
     * leituras da mesma chave na mesma chamada — a segunda não acrescentava nada. A promessa é
     * criada aqui, uma vez, e entregue aos dois. */
    const rascunhos = bastidores.rascunhosDeLinhasDeBase(env.PADD_KV, env.ESCOLA_SLUG);
    const doAcervo = await listasDoAcervo.pagina(path, {
      env,
      menu,
      escola: env.ESCOLA_SLUG,
      /* AS DUAS LEITURAS SEGUEM COMO PROMESSAS, E NÃO RESOLVIDAS (13/11/2026).
       *
       * As curadorias (KV) e as linhas de base (repositório) não dependem uma da outra, e a
       * página ainda vai ler o índice dos envelopes. Esperar aqui por elas — como se fazia —
       * punha as três leituras em fila: o índice dos envelopes só começava depois de a última
       * linha de base chegar. Medido a 13/11/2026: 938 ms para desenhar a lista, com 300 ms de
       * latência por viagem ao GitHub. A página sabe esperar promessas (`Promise.all` no topo do
       * `pagina`), e é isso que faz as três viagens começarem no mesmo instante.
       *
       * AS LINHAS DE BASE VÊM DO MESMO LEITOR QUE A PRODUÇÃO USA (05/11/2026): a listagem da
       * anamnese deriva delas a turma e a etiqueta de cada aluna, e uma segunda leitura da mesma
       * chave — com a sua própria forma de a interpretar — divergiria no dia em que uma das duas
       * mudasse. O sintoma seria a lista a dizer «sem turma» sobre uma turma que a Produção mostra
       * preenchida — exactamente o defeito que a leitura única corrige. */
      curadorias: bastidores.curadorias(env.PADD_KV, env.ESCOLA_SLUG),
      linhasDeBase: bastidores.linhasDeBaseDaEscola(env, env.ESCOLA_SLUG, { rascunhos }),
      linhasRascunho: rascunhos,
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
    /* A ROTA NUA DA PORTA NÃO SERVE A PORTA (26/10/2026).
     *
     * O DEFEITO, medido na tela pela pesquisadora: «eu consigo acessar a rota sem passar pela área
     * do professor… por um breve momento, e em seguida eu sou direcionado para a área do
     * professor». A porta (`/anamnese/`, `/plano-ensino/`, `/plano-observacao/`) exige o contexto
     * do ato — professor, ciclo e, na anamnese, a aluna —, e sem ele o próprio JavaScript dela
     * chama `voltarParaALista()` no arranque. Ou seja: a página era SERVIDA para logo se
     * descartar. O que a pessoa via era a pálida de um formulário que nunca ia abrir.
     *
     * A DECISÃO: o endereço sem contexto nenhum não é a porta — é a lista, e é para lá que ele
     * vai, no SERVIDOR, antes de qualquer byte de formulário. Um `302` não é uma página: não há
     * nada para piscar. E o endereço continua a existir para quem tem contexto (as listas da Área
     * do Professor montam o link do ato com `?professor=…&ciclo=…&abrir=1`, e o «Editar»/«Ajustar»
     * levam o carimbo em vez do contexto, que vem do envelope) — a prova mede os dois lados.
     *
     * O QUE **NÃO** SE REDIRECIONA: só a PÁGINA (`/` e `/index.html` debaixo do prefixo). Os
     * `api/…` e `assets/…` da porta continuam a passar — eles não são a rota do formulário, e um
     * `ficha` sem `?professor=` é uma chamada legítima da página já aberta.
     *
     * O QUE CONTA COMO CONTEXTO: qualquer um dos parâmetros que a porta sabe ler para semear o ato.
     * A lista é a de `porta/index.html` (ver `consulta()` em `listas-do-acervo.js`), e é uma lista
     * de PERMISSÃO — na dúvida, deixa passar. Servir a porta a mais é o que já acontecia; servir
     * a menos quebraria o ato. */
    /* O `novo` FALTAVA (05/11/2026), e é o terceiro da mesma família: `editar` abre um registo
     * para escrita em sítio, `ajustar` abre-o para derivar, e `novo` abre-o para duplicar — os
     * três carregam o CARIMBO, e o contexto vem do envelope. Sem ele aqui, o endereço
     * `?novo=<carimbo>` sozinho era um 302 para a lista: o «Novo registo» voltava ao ponto de
     * partida no SERVIDOR, antes de qualquer byte de formulário. A lista de hoje leva também
     * `professor` e `aluna` — e é por isso que o defeito não apareceu por aí —, mas um link que
     * leve só o carimbo tem de funcionar como os outros dois. */
    const PARAMS_DO_ATO = ['professor', 'ciclo', 'aluna', 'plano', 'editar', 'ajustar', 'novo', 'ato'];
    const ehAPaginaDaPorta = rel === '/' || rel === '/index.html';
    const temContexto = PARAMS_DO_ATO.some((chave) => (url.searchParams.get(chave) || '').trim());
    if (ehAPaginaDaPorta && !temContexto) {
      const lista = listasDoAcervo.listaDaPorta(path);
      if (lista) {
        return new Response(null, {
          status: 302,
          headers: { Location: lista, 'Cache-Control': 'no-store, max-age=0' },
        });
      }
    }
    const alvo = new Request(new URL(rel + url.search, request.url), request);
    /* O MENU MARCA A LISTA A QUE A PORTA PERTENCE (26/10/2026).
     *
     * O `pedido` é o caminho servido, e o menu marca o item por ele (`ehAtivo`). Aqui o caminho é
     * `/anamnese/` — que não é nenhum item do menu, porque o item é a LISTA
     * (`/area-do-professor/anamnese/`). O resultado era o menu a apagar a única marca que responde
     * a «onde estou» precisamente quando se está mais fundo: a criar, a editar ou a ajustar.
     *
     * A tradução é do módulo que já sabe a relação (`FAMILIAS` tem a porta e a chave de cada
     * família) — não uma segunda tabela. E o caminho da lista é o que se passa ao menu; o
     * caminho verdadeiro continua a ser o que se serve. */
    return comAparencia(await portaFetch(alvo, env, { prefixo: PREFIXO_ASSETS }),
      await aparenciaDoEnv(env),
      { teste: numeroDoTeste(env.ESCOLA_SLUG), menu,
        pedido: listasDoAcervo.listaDaPorta(path) || path });
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

  // 2.2 O RESGATE do que ficou no KV (06/11/2026) — `POST /api/lancamentos/consolidar`. É um
  //     ACTO, não um serviço: lê o armazenamento antigo, decifra com a `SENHA_CRIPTO`, grava a
  //     FONTE e dispara a geração. A rota existe nas rotas agnósticas, mas este ramo é a lista
  //     de caminhos que a produção entrega ao motor — sem ele, o `fetch` do Worker devolvia o
  //     404 dos assets, e o resgate existia no código e não no ar. A lista é explícita de
  //     propósito (o resto é o pacote), e por isso um caminho novo tem de ser declarado aqui.
  if (path === '/api/lancamentos/consolidar') {
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
  /* A MONTAGEM DA CADEIA, exportada para a prova (09/11/2026). A prova mede a MESMA função que
   * a ponte usa — reconstruí-la na bancada mediria a bancada, não a ligação. */
  montarCadeia,
  __armazenamento: (env) => criarArmazenamento(env),
};
