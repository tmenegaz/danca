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
const comercialDoNucleo = require('../nucleo/comercial.js');
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
/* A ESCOLA VEM DO DADO (13/11/2026) — o mapa `escolas/por-host` em KV, com cache de isolate.
 * Ver `mapa-de-escolas.js`: é o que deixa de prender a identidade da escola ao deploy. */
const mapaDeEscolas = require('./mapa-de-escolas.js');
/* UMA CHAVE POR ESCOLA, DERIVADA DE UMA MESTRA (15/11/2026) — num shard há um `env` para N
 * escolas, e a `SENHA_CRIPTO` deixou de poder viver lá com um valor por Worker. */
const chaveMestra = require('../nucleo/chave-mestra.js');
const aulasDadas = require('./aulas-dadas.js');
/* O RODAPÉ «FALE CONOSCO» TAMBÉM ESCREVE AQUI (18/11/2026). O pedido é o mesmo formulário em todas
 * as telas, e quem o serve neste Worker é o mesmo módulo que a raiz serve — não uma cópia. A caixa
 * de entrada é a MESMA chave de KV (os dois Workers partilham o namespace), e é por isso que o que
 * se escreve no site de uma escola aparece no painel dela sem sincronização nenhuma. */
const contatoDoSite = require('./contato-do-site.js');
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

/**
 * O PREFIXO DA PORTA DENTRO DA ÁRVORE (14/11/2026).
 *
 * A porta (`anamnese`, `plano-ensino`, `plano-observacao`) lê o seu conteúdo de
 * `plano-observacao/…` — um prefixo RELATIVO À RAIZ DO ASSETS. Fora do shard, essa raiz é a
 * escola; dentro dele, a raiz é `publicacao/` e a escola está uma pasta abaixo. Este é o único
 * sítio que sabe compor os dois, e é por isso que ele existe em vez de a concatenação aparecer
 * quatro vezes nos ramos abaixo.
 */
function prefixoDosAssetsDaPorta(env) {
  const raiz = prefixoDaArvore(env);
  return (raiz ? raiz.slice(1) + '/' : '') + PREFIXO_ASSETS;
}

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
/* A CACHE DO MENU, POR ESCOLA (14/11/2026): `Map` de prefixo → menu, com `false` a marcar
 * «não há ficheiro» — a mesma convenção de antes, agora com uma entrada por escola. */
const MENU_EM_CACHE = new Map();
/**
 * QUE ESCOLA É O PACOTE PUBLICADO NESTE WORKER (13/11/2026).
 *
 * Sem a `vars` `ESCOLA_SLUG`, a escola resolve-se pelo HOST — e nada confere se o conteúdo servido
 * aqui é o dessa escola. É o deploy trocado de antes, com outra cara: `name` certo no wrangler e
 * `assets.directory` de outra escola. O `escola.json` na raiz do pacote (escrito por
 * `tools/montar-publicacao.js`) é a resposta a «que conteúdo é este?».
 *
 * Lê-se UMA vez por isolate: está no ASSETS (não é rede, e desde 13/11/2026 nem gasta invocação
 * do Worker), e o pacote só muda num deploy — e um deploy reinicia os isolates.
 *
 * Devolve `null` quando o ficheiro não existe, e isso NÃO é erro: um pacote montado antes desta
 * versão não o tem, e recusar servir por causa disso trocaria uma falha silenciosa por uma queda
 * certa. Quem decide o que fazer com um `null` é quem chama.
 */
/**
 * A ÁRVORE DO PACOTE: UMA ESCOLA NA RAIZ, OU N ESCOLAS SOB `/<escola>/` (14/11/2026).
 *
 * POR QUE ISTO EXISTE. Até hoje um Worker servia UMA escola, e o `assets.directory` era
 * `publicacao/<escola>` — a raiz do ASSETS era a raiz do site. O shard (N escolas num Worker,
 * `PLANO-SHARD.md`) inverte isso: o `assets.directory` passa a ser `publicacao/`, e a raiz do
 * site passa a ser uma SUBÁRVORE. Sem uma noção explícita de prefixo, cada sítio que lê do
 * ASSETS (`escola.json`, `nav.json`, o próprio ficheiro pedido) teria a sua própria ideia de
 * onde a escola começa — e a primeira a divergir seria a que ninguém está a olhar.
 *
 * A DECLARAÇÃO É UMA `var`, e não uma inferência. Poder-se-ia adivinhar («não há `/escola.json`
 * na raiz, logo é shard»), e seria adivinhação: um pacote de escola única montado sem esse
 * ficheiro passaria a ser lido como shard. A `var` diz o que é, e a config é o sítio onde isso
 * se lê. O valor por omissão é o de hoje — um Worker, uma escola —, e é por isso que nenhuma
 * das três escolas vivas muda de comportamento com este código.
 */
/* A REGRA MUDOU DE CASA (22/11/2026): mora em `motor/nucleo/arvore-de-assets.js`, para os
 * Bastidores a poderem ler sem fechar o ciclo de `require` que existe entre este módulo e
 * aquele. Continua a ser UMA definição, e continua a ser esta a porta por onde a produção entra. */
const { prefixoDaArvore } = require('../nucleo/arvore-de-assets.js');

/**
 * `/assets/…` É PARTILHADO, E NÃO SE REESCREVE (14/11/2026).
 *
 * A regra vive aqui, e não só no `run_worker_first` do shard, porque são duas coisas diferentes:
 * a config evita a INVOCAÇÃO (é dinheiro — 100.000 por dia no plano gratuito), e esta função
 * evita a REESCRITA ERRADA caso o pedido chegue ao Worker na mesma (config trocada, um `HEAD`,
 * um caminho que a negativa não cobre). Uma correção que depende só da config é uma correção que
 * se desfaz com uma edição de config.
 */
function ehAssetPartilhado(path) {
  return path === '/assets' || path.indexOf('/assets/') === 0;
}

/** `/aulas/` → `/calango/aulas/`; `/` → `/calango/`. Fora do shard, o caminho fica como está. */
function caminhoNaArvore(env, path) {
  const prefixo = prefixoDaArvore(env);
  if (!prefixo) return path;
  return prefixo + (path === '/' ? '/' : path);
}

/**
 * O ENDEREÇO COM A ESCOLA COLADA — `/breu/rosa/plano` → `/rosa/plano` (20/11/2026).
 *
 * Devolve o caminho corrigido, ou `null` quando não há nada a corrigir. Três guardas, e cada
 * uma fecha um caso que não pode ser tocado:
 *
 *   · só o PRIMEIRO segmento é candidato, e tem de ser o nome DESTA escola — `/rosa/plano` fica
 *     quieto, e `/outra-escola/...` também (não é nosso, e adivinhar seria pior que o 404);
 *   · o caminho tem de ter mais de um segmento — `/<escola>` sozinho não é um endereço do pacote;
 *   · e o chamador só a invoca depois de o ASSETS dizer 404, porque a pergunta que ela responde
 *     é «o que faço com um endereço que não existe», e não «o que faço com este endereço».
 *
 * A barra final é preservada: `/breu/aulas/` → `/aulas/`, e não `/aulas` — são dois pedidos
 * diferentes para o ASSETS, e trocá-los mudaria o que a pessoa recebe.
 */
function caminhoSemAEscola(path, escola) {
  const nome = String(escola || '').trim();
  if (!nome) return null;
  const fatias = String(path || '').split('/').filter(Boolean);
  if (fatias.length < 2 || fatias[0] !== nome) return null;
  return '/' + fatias.slice(1).join('/') + (String(path).endsWith('/') ? '/' : '');
}

/* SEM VALOR INICIAL, DE PROPÓSITO: `undefined` é «ainda não lido» e `null` é «não há ficheiro».
 * Começar em `null` (como esteve na primeira redação) fazia a primeira leitura devolver «não há
 * ficheiro» sem ler nada — a conferência ficava desligada em silêncio, e o `/api/saude` dizia
 * `escola_do_pacote: null` numa escola que tinha o ficheiro no ar. Medido a 13/11/2026. */
/* POR ESCOLA, E NÃO UMA SÓ (14/11/2026). Num Worker de uma escola, «o pacote» era um. No shard,
 * o MESMO isolate serve N escolas, e uma cache de valor único responderia pela primeira a todas
 * as outras — o `escola_do_pacote` de `calango` a aparecer no `/api/saude` da `batata` é
 * exactamente o defeito que a conferência de identidade existe para apanhar, e seria ela a
 * produzi-lo. A chave é o prefixo (vazio fora do shard), e há um valor por chave. */
const PACOTE_EM_CACHE = new Map();
async function identidadeDoPacote(env) {
  const chave = prefixoDaArvore(env);
  if (PACOTE_EM_CACHE.has(chave)) return PACOTE_EM_CACHE.get(chave);
  if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') return null;
  try {
    const res = await env.ASSETS.fetch(new URL(chave + '/escola.json', 'https://assets.local'));
    if (!res.ok) { PACOTE_EM_CACHE.set(chave, null); return null; }
    const corpo = await res.json();
    const slug = String((corpo && (corpo.escola || corpo.slug)) || '').trim();
    PACOTE_EM_CACHE.set(chave, slug || null);
    return PACOTE_EM_CACHE.get(chave);
  } catch (erro) {
    /* NÃO se guarda uma falha: uma leitura que estourou não prova que o ficheiro não existe, e
     * guardá-la deixaria o isolate inteiro sem a conferência até morrer. */
    return null;
  }
}

/** Esquece o pacote lido — só as provas precisam disto (o isolate real morre no deploy). */
function esquecerPacote() { PACOTE_EM_CACHE.clear(); }

async function menuDaEscola(env) {
  /* UMA CACHE POR ESCOLA (14/11/2026) — a mesma razão do `identidadeDoPacote`: no shard um
   * isolate serve N escolas, e um menu único desenharia a barra da `batata` em todas as páginas
   * da `calango`. */
  const chave = prefixoDaArvore(env);
  if (MENU_EM_CACHE.has(chave)) return MENU_EM_CACHE.get(chave) || null;
  if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') return null;
  try {
    const res = await env.ASSETS.fetch(new URL(chave + '/nav.json', 'https://assets.local'));
    if (!res.ok) { MENU_EM_CACHE.set(chave, false); return null; }
    MENU_EM_CACHE.set(chave, await res.json());
    return MENU_EM_CACHE.get(chave);
  } catch (erro) {
    MENU_EM_CACHE.set(chave, false);
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
  /* O CAMINHO PASSA PELA ÁRVORE (14/11/2026). O `ciclos.json` de que este índice depende vive na
   * raiz do pacote da escola — fora do shard é `/ciclos.json`, dentro dele é
   * `/<escola>/ciclos.json`. Sem o prefixo, o índice das aulas dadas leria o ficheiro da escola
   * errada (ou nenhum) e as aulas apareceriam como não declaradas. */
  const raizDaArvore = prefixoDaArvore(env);
  const lerAsset = async (rel) => {
    if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') return null;
    try {
      const res = await env.ASSETS.fetch(new URL(raizDaArvore + '/'
        + String(rel || '').replace(/^\/+/, ''), 'https://assets.local'));
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
  /* O PREFIXO É O DA PORTA, E NÃO A PASTA NUA (20/11/2026).
   *
   * Estava escrito `'plano-observacao/'`, e no shard o ficheiro vive em
   * `breu/plano-observacao/…`. As quatro leituras davam 404, a função desistia em silêncio
   * (`return null`), e a consequência era total: em TODA a escola servida por um shard, a
   * cadeia automática respondia «não está montada neste Worker» — a troca de sala, a troca de
   * professor, a saída de elenco, o fecho do pacote. A porta, essa, sempre soube o prefixo
   * (`prefixoDosAssetsDaPorta`) e por isso gravava; o que não havia era quem fechasse.
   *
   * Medido em 20/11/2026 com um pedido a `/api/bastidores/cadeia-pacote` na `breu`: «a cadeia
   * automática não está montada neste Worker (sem token ou sem os conteúdos da porta)». O token
   * estava lá — o que faltava era o caminho. */
  const prefixo = prefixoDosAssetsDaPorta(env);
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
        /* O AUTOR E A ORIGEM METODOLÓGICA, como na ponte das rotas (22/11/2026) — os dois sítios
         * compõem o mesmo mapa, e um deles a menos é uma secção mais pobre conforme o caminho. */
        const autor = String((o && o.professorNome) || '').trim();
        const metodo = String((o && o.metodo) || '').trim();
        if (aluna && carimbo) {
          mapa[aluna] = { carimbo, vinculada: Boolean(o.vinculada), metodo: metodo || null,
            autor: autor || null };
        }
      }
    } catch (erro) { /* a §6 declara a lacuna */ }
    return mapa;
  };
  const concluirPO = criarConcluirPO({
    armazenamento, porta: portaNucleo, escreverPO, escreverCiclo, disparar, geracao,
    fontesDoCicloProntas,
    linhaDeBaseDaTurma, anamnesesDaTurma, conteudoPO,
  });

  /* A RÉGUA E A TRADIÇÃO DE HOJE, PARA A DERIVAÇÃO RELER (20/11/2026) — ver `criarCadeia`.
   *
   * AS DUAS USAM AS MESMAS FUNÇÕES QUE A PÁGINA E A VALIDAÇÃO DO BOTÃO USAM, e é isso que as
   * torna fiáveis: a régua é `bastidores.rubricaDaTurma` (a MESMA que o cartão da Sala mostra), e a
   * tradição é o perfil do professor lido pelo mesmo `lerPerfil` da rota das habilitações. Uma
   * segunda leitura da mesma coisa divergiria da primeira no dia em que o catálogo mudasse.
   *
   * `null` QUANDO NÃO SE SABE, e o `derivarPlano` trata-o como «não mexas»: um KV sem a lista das
   * rubricas, ou um perfil que não responde, deixam o elo anterior como está. */
  const reguaDaSala = async (turma) => {
    try {
      const nome = String(turma || '').trim();
      if (!nome) return null;
      const listaDeRubricas = await lerLista('rubricas');
      const listaDeProfs = await lerLista('professores');
      let registoDoDono = null;
      try {
        const bruto = kv ? await kv.get('bastidores/' + escola + '/dono') : null;
        registoDoDono = bruto ? JSON.parse(bruto) : null;
      } catch (erro) { registoDoDono = null; }
      const donoSlug = bastidores.slugDoDono(env);
      const reguasDosProfs = bastidores.rubricasDosProfessores(
        listaDeProfs, registoDoDono, donoSlug);
      const sala = (await lerTurmas(escola)).find((t) => t && !t.substituidaPor
        && String(t.nome || '') === nome) || null;
      if (!sala) return null;
      const niveis = bastidores.rubricaDaTurma(sala, listaDeRubricas, reguasDosProfs);
      return Array.isArray(niveis) && niveis.length ? niveis : null;
    } catch (erro) { return null; }
  };
  const tradicaoDoProfessor = async (slug, modalidade) => {
    try {
      const alvo = String(slug || '').trim();
      if (!alvo) return null;
      const { lerPerfil } = require('./perfil-professor.js');
      const r = await lerPerfil({ f: fetchImpl, token: (env && env.GITHUB_TOKEN) || null,
        dono: 'tmenegaz', repo: 'danca', ref: 'main', slug: alvo });
      const perfil = r && r.ok ? r.perfil : null;
      if (!perfil || !perfil.tradicoes) return null;
      const chave = require('../nucleo/perfil-do-professor.js').idDaModalidade(modalidade);
      /* A CHAVE TEM DE EXISTIR: o perfil distingue «não ensina nenhuma tradição» (`[]`) de «ainda
       * não foi perguntado» (a chave ausente). Só a primeira é uma declaração — e mesmo essa não
       * reescreve o método de um plano já escrito, porque apagar pedagogia do papel é decisão de
       * quem ensina, não de uma leitura. Devolver `null` deixa o elo como está. */
      if (!chave || !Object.prototype.hasOwnProperty.call(perfil.tradicoes, chave)) return null;
      const lista = Array.isArray(perfil.tradicoes[chave]) ? perfil.tradicoes[chave] : [];
      if (!lista.length) return null;
      const rotulo = require('./catalogo-seed.js').rotuloDaTradicao || ((x) => x);
      return lista.map((t) => rotulo(t) || t);
    } catch (erro) { return null; }
  };

  return criarCadeia({
    armazenamento, porta: portaNucleo, conteudo, conteudoPlano, conteudoPO, esquema,
    carimbar: () => carimbarAgora((env && env.FUSO) || FUSO_PADRAO),
    escreverPlano, escreverPO, escreverCiclo, disparar, geracao, concluirPO,
    lerCuradorias, lerTurmas, lerLinhasDeBase, linhaDeBaseDaTurma, lerProfessores,
    reguaDaSala, tradicaoDoProfessor,
    kv, escola,
    orcamento: (fetchImpl && fetchImpl.subpedidos) || null,
    urlDaPorta: bastidores.urlDaPorta,
  });
}

/**
 * O REGISTO DO DONO, LIDO DO KV DA ESCOLA — `{nome, slug, hash, sal}`.
 *
 * A chave `bastidores/<escola>/dono` já existia (guardava o nome, e o expurgo já a apaga). Ela passa
 * a guardar também o SLUG — sem ele o dono desaparece das listas, porque `slugDoDono` devolve vazio
 * e o código que monta a lista descarta quem não tem identificador — e o HASH da senha da direção,
 * que é o que deixa de haver um valor só para N escolas.
 *
 * Devolve `{}` quando não há registo. Não lança: uma escola sem sobreposição é o caso normal de uma
 * escola criada antes desta versão, e ela tem o `env` como reserva.
 */
async function identidadeDoDonoDoKv(env, escola) {
  try {
    const bruto = await env.PADD_KV.get('bastidores/' + escola + '/dono');
    if (!bruto) return {};
    const o = JSON.parse(bruto);
    if (!o || typeof o !== 'object') return {};
    return {
      nome: String(o.nome || '').trim(),
      slug: String(o.slug || '').trim(),
      hash: String(o.hash || '').trim(),
      sal: String(o.sal || '').trim(),
      escola: String(o.escola || '').trim(),
    };
  } catch (erro) {
    return {};
  }
}

/**
 * A IDENTIDADE DA ESCOLA NO `env` DO PEDIDO — a sobreposição, numa função só (15/11/2026).
 *
 * Estava embutida no `fetch`; saiu porque uma sobreposição que ninguém pode chamar de fora só se
 * mede pela página, e a página é a pior bancada que há para isto: o que se quer afirmar é «esta
 * escola recebe ESTA chave e ESTE dono», e isso é uma pergunta sobre valores, não sobre pixels.
 *
 * Devolve o MESMO `env` quando não há nada a sobrepor — não faz uma cópia por fazer, e o chamador
 * continua a distinguir os dois casos se precisar.
 */
async function comIdentidadeDaEscola(env, escola) {
  if (!env || !env.PADD_KV || !escola) return env;
  const doKv = await identidadeDoDonoDoKv(env, escola);
  const chave = await chaveMestra.chaveDaEscola(env, escola);
  const sobreposto = {};
  if (doKv.nome) sobreposto.PROFESSOR_NOME = doKv.nome;
  if (doKv.slug) sobreposto.PROFESSOR_SLUG = doKv.slug;
  /* O NOME DA ESCOLA, para a página de «a criar» (24/11/2026). Sem ele a página só tinha o slug,
   * e o slug é o endereço, não o nome. */
  if (doKv.escola) sobreposto.ESCOLA_NOME = doKv.escola;
  if (doKv.hash) { sobreposto.SENHA_DIRECAO_HASH = doKv.hash; sobreposto.SENHA_DIRECAO_SAL = doKv.sal || ''; }
  if (chave) sobreposto.SENHA_CRIPTO = chave;
  if (!Object.keys(sobreposto).length) return env;
  return Object.assign({}, env, sobreposto);
}

/**
 * O ESTADO COMERCIAL, DO KV DA ESCOLA (25/11/2026).
 *
 * A chave é a mesma que a raiz escreve (`bastidores/<escola>/comercial`, ver `raiz.js`): uma
 * chave, dois leitores, e é isso que impede a lista das vivas de dizer «ativa» sobre uma escola
 * que o endereço recusa.
 *
 * A LEITURA SAIU DAQUI (16/11/2026). Ela mora em `../nucleo/comercial.js`, e não por arrumação:
 * a rota da senha do professor vive em `bastidores.js`, que este ficheiro já carrega — pedir-lhe
 * o estado comercial daqui seria um `require` circular, e o caminho que se escolheu sem pensar
 * foi não pedir. O resultado foi a tela do professor com um veredicto que nunca podia acontecer.
 * Um facto que dois sítios perguntam mora onde os dois o alcançam.
 */
const comercialDaEscola = comercialDoNucleo.comercialDaEscola;
/**
 * ESTE PEDIDO ESCREVE? — a pergunta que separa «ler» de «editar» (25/11/2026).
 *
 * A REGRA É `GET` LÊ TUDO O RESTO ESCREVE, com as excepções declaradas: as rotas que são `POST`
 * por natureza e não escrevem nada — a porta da direção, a senha do professor, o bilhete do ato.
 * Sem elas, uma escola suspensa fechava também a ENTRADA de quem já trabalha nela, e ninguém
 * conseguiria chegar às páginas para ler o que está feito. «Só leitura» que não deixa entrar não
 * é leitura nenhuma.
 *
 * A PORTA DA DIREÇÃO FALTAVA, e o sintoma foi medido a 16/11/2026: com a escola desabilitada, a
 * professora abria a escola, escrevia a senha em Bastidores e recebia «senha não reconhecida» —
 * sobre uma senha certa. O `validar-producao` não escreve nada (emite um token assinado, sem
 * estado); recusá-lo fechava a única porta que dá acesso a TUDO o que é «só ler». Ela própria o
 * tinha dito: «só tem acesso a ler as coisas que já foram desenvolvidas». Não se lê o que não se
 * consegue abrir.
 */
const POSTS_QUE_SO_LEEM = new Set([
  '/api/bastidores/validar-producao',
  '/api/bastidores/validar-senha',
  '/api/bastidores/ato',
  /* A FICHA DO PROFESSOR É `POST` PORQUE DEVOLVE DADO PESSOAL, E NÃO PORQUE ESCREVE (16/11/2026).
   * O verbo foi escolhido para o CPF e o telefone não viajarem num endereço; a operação é uma
   * leitura, e uma escola suspensa tem de a poder fazer — «só tem acesso a ler as coisas que já
   * foram desenvolvidas». É o mesmo caso do `validar-senha`: `POST` por natureza, leitura no
   * efeito. Sem esta linha, a aba do cadastro abria vazia numa escola suspensa, e a pessoa
   * concluía que a ficha se perdera. */
  '/api/bastidores/ficha-do-professor',
]);

function ehEscrita(request, path) {
  const metodo = String((request && request.method) || 'GET').toUpperCase();
  if (metodo === 'GET' || metodo === 'HEAD' || metodo === 'OPTIONS') return false;
  if (metodo === 'POST' && POSTS_QUE_SO_LEEM.has(path)) return false;
  return true;
}

async function fetch(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // O subdomínio do pedido — a identidade de rede do Worker. Numa escola é
  // `<escola>.tmenegaz77.workers.dev`; na raiz é `danca.tmenegaz77.workers.dev`.
  const subdominio = mapaDeEscolas.subdominioDe(url.hostname);

  /* A ESCOLA VEM DO DADO, E NÃO DO DEPLOY (13/11/2026).
   *
   * Aqui esteve a trava que exigia `ESCOLA_SLUG` nas `vars` do wrangler e a comparava com o
   * subdomínio. Ela fazia o seu trabalho — apanhava o deploy trocado —, e ao mesmo tempo
   * prendia a identidade ao deploy: mudar um slug era reeditar e reimplantar, e cada escola
   * exigia o seu próprio Worker com o seu próprio nome escrito na configuração.
   *
   * A escola passa a resolver-se por um mapa em KV (`escolas/por-host`, ver
   * `mapa-de-escolas.js`), com cache de isolate. A trava NÃO se perdeu: mudou de lugar.
   *   · mapa e `vars` a dizerem escolas diferentes → erro visível (`conflito`);
   *   · sem entrada no mapa, vale a `vars` — e aí a comparação com o subdomínio continua, como
   *     antes (`origem: 'vars'`);
   *   · sem mapa e sem `vars` → não se serve nada.
   */
  const resolucao = await mapaDeEscolas.resolver(env, url.hostname);
  const escolaResolvida = resolucao.escola;
  if (escolaResolvida && escolaResolvida !== env.ESCOLA_SLUG) {
    /* A CÓPIA, E NÃO A MUTAÇÃO. O `env` do Worker é partilhado pela invocação inteira; escrever
     * nele deixaria o valor resolvido para o pedido seguinte se o runtime o reutilizasse. A cópia
     * mantém o mesmo binding de KV (é a mesma referência) e o mesmo ASSETS, e todo o motor
     * continua a ler `env.ESCOLA_SLUG` sem saber que a origem mudou. */
    env = Object.assign({}, env, { ESCOLA_SLUG: escolaResolvida });
  }

  /* A IDENTIDADE DA ESCOLA, RESOLVIDA DO KV PARA O `env` DO PEDIDO (15/11/2026).
   *
   * O shard serve N escolas com UM `env`. Três coisas que a escola lia do `env` — e que são DELA,
   * não do Worker — passam a ser resolvidas aqui, a partir do KV daquela escola, e postas na cópia
   * que o pedido inteiro já usa. É o mesmo sítio e o mesmo mecanismo do `ESCOLA_SLUG` acima, e é
   * de propósito: um segundo sítio de injecção divergiria do primeiro.
   *
   *   · `SENHA_CRIPTO` — a chave da escola, DERIVADA da mestra (`chave-mestra.js`). Sem isto a
   *     anamnese responde «falta a SENHA_CRIPTO», que é o defeito que a pesquisadora viu na tela.
   *     Numa escola de antes não há mestra: `chaveDaEscola` devolve o segredo antigo, e nada muda.
   *   · `PROFESSOR_NOME` / `PROFESSOR_SLUG` — o dono. O nome já vinha do KV (`nomeDoDono`), mas o
   *     SLUG não, e era por isso que a `calango` deixou de mostrar «Pe Torto» na lista de
   *     professores: sem slug, o dono é descartado. Com ele resolvido aqui, as doze leituras de
   *     `slugDoDono(env)` continuam a funcionar sem uma linha mudar.
   *
   * A ORDEM É A REGRA: o KV manda, o `env` é reserva. Um Worker de escola (um `env` por escola)
   * continua a funcionar como sempre; um shard passa a ter a identidade certa por pedido. */
  env = await comIdentidadeDaEscola(env, escolaResolvida);

  /* A IDENTIDADE DO CONTEÚDO — o que substitui a comparação que se perdeu.
   *
   * Sem a `vars`, o mapa diz a escola pelo HOST — mas ninguém confere se o pacote publicado neste
   * Worker é o DESSA escola. É exactamente o deploy trocado de antes (a config de uma escola no
   * Worker de outra), e ele continua a poder acontecer: `name` certo, `assets.directory` errado.
   *
   * O `escola.json` do pacote (`montar-publicacao.js` escreve-o) é a resposta a «que conteúdo é
   * este?». Divergir dele é erro visível. Ausente, não se afirma nada — é o caso de um pacote
   * montado antes desta versão, e recusar servir por isso seria trocar uma falha silenciosa por
   * uma queda certa. */
  const escolaDoPacote = await identidadeDoPacote(env);

  const identidadeOk = Boolean(escolaResolvida)
    && !resolucao.conflito
    /* A comparação com o subdomínio SÓ vale no caminho da `vars`: é ali que ela é a única
     * evidência que existe. Com o mapa, um domínio próprio (`ballet.exemplo.com.br`) resolve
     * legitimamente por uma etiqueta que não é o slug. */
    && (resolucao.origem !== 'vars' || subdominio === resolucao.esperada);

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
      /* DE ONDE VEU A ESCOLA (13/11/2026). Sem isto, um diagnóstico de «por que esta escola está
       * a servir outra coisa?» começa por adivinhar se o problema é o mapa, a var ou o pacote.
       * `origem: 'mapa'` é o regime novo; `'vars'` é o de antes, e continua válido. */
      origem: resolucao.origem,
      por: resolucao.por,
      escola_do_pacote: escolaDoPacote,
      habilitada: env.ESCOLA_HABILITADA !== 'nao',
      erro: identidadeOk
        ? null
        : (resolucao.conflito
          ? 'o mapa de escolas diz «' + String(escolaResolvida) + '» e a vars diz «'
            + String(resolucao.esperada) + '» — config × mapa trocados'
          : (resolucao.origem === 'nada'
            ? 'este host não está no mapa de escolas, e não há ESCOLA_SLUG — nenhuma escola reivindica este Worker'
            : 'ESCOLA_SLUG divergente do subdomínio — config × Worker trocados')),
    };
    return new Response(JSON.stringify(corpo), {
      status: identidadeOk ? 200 : 500,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
    });
  }

  // A trava, de fato: sem identidade, NADA serve — erro visível, não freio.
  /* O «FALE CONOSCO» NÃO É CONTEÚDO DA ESCOLA, e por isso vem ANTES das travas dela (18/11/2026).
   *
   * O rodapé com o canal para a casa está em TODAS as telas de TODAS as escolas, e o pedido que ele
   * manda não é sobre a escola: é alguém a tentar falar com quem fez o sistema. Prender esta rota
   * atrás do estado comercial ou do freio daria o pior desfecho possível — a escola suspensa fica
   * sem forma de pedir ajuda sobre a própria suspensão, e a pessoa que clica no rodapé recebe 402
   * ou 503 sem entender porquê.
   *
   * O QUE ISSO NÃO ABRE: nada da escola. A rota não lê um único ficheiro do pacote, não conhece o
   * `ESCOLA_SLUG` e não devolve nada do acervo — escreve numa chave de KV do pedido e manda um
   * e-mail para a casa. É a mesma coisa que a raiz faz, com o mesmo módulo. */
  if (path === '/api/contato') {
    return await contatoDoSite.responderContato(request, env);
  }

  /* O PACOTE DIZ OUTRA ESCOLA — e nenhuma das outras travas apanha isto, porque o host e a var
   * podem estar certos e o `assets.directory` errado. Só o conteúdo sabe que conteúdo é, e é por
   * isso que ele é conferido. */
  if (identidadeOk && escolaDoPacote && escolaDoPacote !== escolaResolvida) {
    return respostaEstado('Configuração incorreta do Worker',
      '<p>O mapa de escolas diz que este host é da escola <code>' + esc(escolaResolvida) +
      '</code>, e o pacote publicado aqui é o da escola <code>' + esc(escolaDoPacote) +
      '</code>.</p>' +
      '<p>Provável causa: <code>assets.directory</code> de outra escola no ' +
      '<code>wrangler</code> deste Worker. Reimplante com a config da escola certa.</p>' +
      '<p>Diagnóstico: <code>curl &lt;origin&gt;/api/saude</code></p>', 500);
  }

  /* UM HOST QUE NENHUMA ESCOLA RECLAMA NÃO É UM WORKER MAL CONFIGURADO (16/11/2026).
   *
   * «Quando eu acesso a página breu.padd.com.br aparece uma mensagem, configuração incorreta do
   * worker. [...] se não existe a escola não era nem para existir essa mensagem.»
   *
   * E tem razão, pela razão mais simples: quem chega a um endereço que não corresponde a escola
   * nenhuma não tem nada a consertar. A página de diagnóstico era para quem PODE consertar — e
   * quem pode é quem lê o `curl /api/saude`, não quem digita o endereço no navegador.
   *
   * A ROTA QUE SOBRA É O CASO NORMAL, e não a excepção. Um expurgo apaga o Worker e não as rotas
   * de todas as metades; uma criação que falhou a meio deixa o DNS e a rota no sítio. Enquanto a
   * rota existir, o pedido chega aqui — e a resposta certa é a de um endereço que não existe:
   * **404**, sem diagnóstico nenhum. A informação completa continua em `/api/saude`, que é onde
   * quem procura já sabe procurar.
   *
   * O QUE **NÃO** MUDA: as outras duas razões de `!identidadeOk` continuam a ser configuração
   * errada de um Worker que serve uma escola — a `vars` a dizer uma coisa e o mapa outra, ou o
   * subdomínio a não bater com o `ESCOLA_SLUG`. Aí há mesmo o que consertar, e a página diz o quê. */
  if (!identidadeOk && resolucao.origem === 'nada') {
    return new Response('não encontrado', {
      status: 404,
      headers: { 'Content-Type': 'text/plain;charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  if (!identidadeOk) {
    return respostaEstado('Configuração incorreta do Worker',
      (resolucao.conflito
        ? '<p>O mapa de escolas e a <code>vars</code> deste Worker dizem escolas diferentes.</p>' +
          '<p>Mapa: <code>' + esc(escolaResolvida) + '</code> · ESCOLA_SLUG: <code>' +
          esc(resolucao.esperada) + '</code></p>'
        : '<p>A ponte de ESCOLA está rodando num Worker cujo subdomínio não bate com o ' +
          '<code>ESCOLA_SLUG</code>.</p>' +
          '<p>Subdomínio: <code>' + esc(subdominio) + '</code> · ESCOLA_SLUG: <code>' +
          esc(env.ESCOLA_SLUG || '(ausente)') + '</code></p>') +
      (escolaDoPacote && escolaResolvida && escolaDoPacote !== escolaResolvida
        ? '<p>E o pacote publicado aqui é o da escola <code>' + esc(escolaDoPacote) +
          '</code> — o <code>assets.directory</code> desta config é de outra escola.</p>'
        : '') +
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

  /* 0.0-bis O ESTADO COMERCIAL DA ESCOLA (25/11/2026).
   *
   * O QUE ELA DECIDIU, e é a regra que se segue: «Bateu na minha conta, eu verifico e aí libero o
   * acesso. […] Depois que eu libero, aí sim é que a pessoa vai ter acesso total à página e poder
   * começar a usar.» E, do outro lado: «Se eu desabilitar, sai do ar a escola imediatamente e só
   * tem acesso a ler as coisas que já foram desenvolvidas […] mas fica impossível criar qualquer
   * outro documento, fazer qualquer edição.»
   *
   * DOIS ESTADOS QUE NÃO SÃO `ativa`, e duas coisas diferentes:
   *
   *   · `aguardando` — a escola existe e ainda ninguém conciliou o pagamento. NÃO HÁ O QUE LER:
   *     ninguém trabalhou ali ainda. O endereço responde a página de espera, com o prazo.
   *   · `suspensa` — a escola trabalhou e o pagamento parou. O QUE ESTÁ FEITO CONTINUA A LER-SE (é
   *     a decisão dela, e é a certa: cortar a leitura de um relatório já escrito seria apagar
   *     trabalho, não cobrar). O que fica impossível é ESCREVER.
   *
   * A AUSÊNCIA DE REGISTO É `ativa` — ver `lerComercial` no `raiz.js`. É o que mantém as escolas
   * de antes a funcionar, e um estado novo não se impõe ao passado.
   *
   * A PÁGINA DE «A CRIAR» VEM ANTES DISTO. Uma escola que acabou de nascer não tem pacote, e o
   * que ela deve mostrar é «estou a ser criada» — não «aguardo pagamento», que seria verdade e
   * fora de tempo. Por isso o estado comercial só age quando há pacote publicado. */
  if (path !== '/api/saude') {
    let comercial = null;
    try { comercial = await comercialDaEscola(env); } catch (erro) { comercial = null; }
    if (comercial && comercial.estado === 'aguardando' && escolaDoPacote) {
      return respostaEstado('Escola a aguardar liberação',
        '<p>Esta escola foi criada e está a aguardar a conciliação do pagamento.</p>' +
        '<p>A liberação é feita à mão e acontece em <strong>até 24 horas</strong> a contar do ' +
        'pagamento. Assim que estiver liberada, este mesmo endereço abre a escola.</p>' +
        '<p class="nota">Escola: <code>' + esc(env.ESCOLA_SLUG) + '</code></p>', 503);
    }
    if (comercial && comercial.estado === 'suspensa' && ehEscrita(request, path)) {
      /* A RECUSA É UM 402, e não um 403: não é «não tens permissão», é «o acesso está suspenso» —
       * e a diferença importa a quem lê o erro. O corpo é JSON quando o pedido é de uma rota de
       * dados (a página mostra a mensagem), e texto quando é uma navegação. */
      /* A FRASE VEM DO NÚCLEO, e não daqui: a rota da senha do professor diz a MESMA, e duas
       * cópias de uma frase são duas frases à espera de divergir. */
      const mensagem = comercialDoNucleo.MENSAGEM_DA_SUSPENSAO;
      if (path.startsWith('/api/')) {
        return new Response(JSON.stringify({ ok: false, erro: mensagem, suspensa: true }), {
          status: 402, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
        });
      }
      return respostaEstado('Acesso suspenso', '<p>' + esc(mensagem) + '</p>', 402);
    }
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
  /* A CADEIA SÓ SE MONTA ONDE É USADA (09/11/2026): nos gestos que a percorrem, nas rotas que a
   * disparam, e na leitura do log. Em qualquer outro pedido dos Bastidores ela é `null`, e o custo
   * é zero.
   *
   * A LISTA MUDOU DE CASA (20/11/2026), e a mudança é o conserto de dois defeitos gémeos. Ela vivia
   * AQUI — longe das rotas que a usam —, e por duas vezes uma rota nova ficou fora: a
   * `turma-professor` (19/11) e a `impacto-da-inclusao` (20/11). As duas chamavam uma cadeia que a
   * ponte nunca montava, e a segunda respondeu ao vivo «não consegui ler o plano de ensino» sobre
   * uma Turma que o tinha — uma frase que mandava procurar o problema no acervo.
   *
   * Nenhuma bancada via isto: as provas INJETAM a cadeia, e a montagem é a única coisa que só
   * existe no Worker. Por isso a lista passou a ser uma constante do ficheiro onde as rotas estão
   * (`ROTAS_QUE_PRECISAM_DA_CADEIA`, em `bastidores.js`), e há uma prova que a compara com o uso no
   * código. Uma lista em dois sítios é uma lista que diverge. */
  let cadeia = null;
  let fetchDoPedido = null;
  if (path.startsWith('/api/bastidores')) {
    const gestos = bastidores.ROTAS_QUE_PRECISAM_DA_CADEIA;
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
        '<p class="acoes"><a href="/bastidores/estudio">Ir aos Bastidores → cadastrar o professor</a></p>',
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
    /* O MEIO-TERMO DA ANAMNESE — CONTEXTO PARCIAL E SEM SUJEITO (15/11/2026).
     *
     * A guarda acima desvia o endereço VAZIO. Faltava o caso que ela viu: `?professor=…&escola=…`
     * — o professor declarado, a aluna ausente —, que passava por ter «contexto» e servia o
     * formulário. A porta exige o ato INTEIRO (escola, professor, ALUNA) e devolvia a pessoa à
     * lista pelo JavaScript, de modo que o formulário aparecia e fugia. As palavras dela: «ele
     * está levando para dentro de uma anamnese sem seleção de professor e sem seleção de aluna.
     * […] essa rota tem que ser uma rota bloqueada».
     *
     * O `302` passa a ser dado AQUI, antes de a página existir. Assim não há pisca, e o pedido
     * não chega a montar o formulário.
     *
     * O QUE NÃO SE DESVIA, e são as três coisas que ficariam fechadas se a condição fosse mais
     * larga:
     *   · o contexto VAZIO segue a regra de cima (ele já era desviado, e continua);
     *   · os atalhos que trazem o contexto do ENVELOPE — `editar`, `ajustar`, `novo`, `ato` —,
     *     que chegam sem `aluna` porque a aluna viaja dentro do registo;
     *   · o plano e o PO, que não têm aluna nenhuma no contexto (a regra é só da anamnese). */
    const ehPaginaDaAnamnese = rel === '/' || rel === '/index.html'
      ? (path === PREFIXO_ANAMNESE || path.startsWith(PREFIXO_ANAMNESE + '/'))
      : false;
    const temAluna = (url.searchParams.get('aluna') || '').trim() !== '';
    const atalhoDoRegisto = ['editar', 'ajustar', 'novo', 'ato']
      .some((chave) => (url.searchParams.get(chave) || '').trim() !== '');
    const semSujeito = ehPaginaDaAnamnese && !temAluna && !atalhoDoRegisto;
    if (ehAPaginaDaPorta && (!temContexto || semSujeito)) {
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
    return comAparencia(await portaFetch(alvo, env, { prefixo: prefixoDosAssetsDaPorta(env) }),
      await aparenciaDoEnv(env),
      { teste: numeroDoTeste(env.ESCOLA_SLUG), menu,
        pedido: listasDoAcervo.listaDaPorta(path) || path });
  }

  // 2. O lançamento do pacote (o `lancamento.html` POSTa em /api/receber), na
  //    raiz. A rota vive nas rotas agnósticas (nucleo/lancamento.js).
  if (path === '/api/receber') {
    return portaFetch(request, env, { prefixo: prefixoDosAssetsDaPorta(env) });
  }

  // 2.1 A LEITURA do `-dados.json` em claro (`/api/dados`), também na raiz. O navegador não
  //     conhece a chave de cifra: ele manda a senha da pessoa e o Worker decifra com o segredo
  //     `SENHA_CRIPTO`, que fica só aqui. Ver `motor/servidor/ler-dados.js`.
  if (path === '/api/dados') {
    return portaFetch(request, env, { prefixo: prefixoDosAssetsDaPorta(env) });
  }

  // 2.2 O RESGATE do que ficou no KV (06/11/2026) — `POST /api/lancamentos/consolidar`. É um
  //     ACTO, não um serviço: lê o armazenamento antigo, decifra com a `SENHA_CRIPTO`, grava a
  //     FONTE e dispara a geração. A rota existe nas rotas agnósticas, mas este ramo é a lista
  //     de caminhos que a produção entrega ao motor — sem ele, o `fetch` do Worker devolvia o
  //     404 dos assets, e o resgate existia no código e não no ar. A lista é explícita de
  //     propósito (o resto é o pacote), e por isso um caminho novo tem de ser declarado aqui.
  if (path === '/api/lancamentos/consolidar') {
    return portaFetch(request, env, { prefixo: prefixoDosAssetsDaPorta(env) });
  }

  // 3. O resto → o pacote. O asset-first do Cloudflare já serviu o estático que
  //    existe; este ramo cobre o `run_worker_first` (default) devolvendo o
  //    mesmo 404 que o Worker antigo devolvia.
  if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    /* A TRAVESSIA DA ÁRVORE (14/11/2026). `/aulas/` não existe no ASSETS de um shard — o que
     * existe é `/calango/aulas/`. O caminho é reescrito AQUI, e não no `_redirects` nem numa
     * regra de zona: é o único sítio que sabe QUAL é a escola (acabou de a resolver), e uma
     * regra estática teria de saber o mesmo sem a saber.
     *
     * A BARRA DO NAVEGADOR NÃO MUDA. Quem pediu `/aulas/` recebe o conteúdo de
     * `/calango/aulas/`, e os links relativos que lá estão (e os absolutos, que a montagem
     * escreve sem a escola) continuam a ser pedidos como `/aulas/…` — ou seja, voltam a passar
     * por aqui e são reescritos outra vez. É essa a propriedade que faz o shard ser invisível
     * para o conteúdo já publicado.
     *
     * O QUE NÃO SE REESCREVE: `/assets/…`. É a cópia partilhada (`publicacao/assets/`), igual em
     * todas as escolas (medido a 14/11/2026: `style.css` e `nav.js` byte a byte iguais), e é a
     * razão de ela ser partilhada — o `run_worker_first` do shard manda-a direto ao ASSETS, sem
     * invocar o Worker. Se este ramo a apanhasse, a negativa não serviria de nada. */
    const caminhoNoAsset = ehAssetPartilhado(path) ? path : caminhoNaArvore(env, path);
    const pedidoAoAsset = caminhoNoAsset === path ? request
      : new Request(new URL(caminhoNoAsset + url.search, request.url), request);
    /* A ESCOLA QUE AINDA NÃO TEM PACOTE (24/11/2026) — a tela que a pesquisadora mandou repor.
     *
     * No regime de um Worker por escola, o Worker «zero» servia sozinho a página «implantação em
     * andamento» (`scriptDaEscola` em `provisionar-escola.js`): o endereço existia antes de o
     * conteúdo existir, e quem chegasse cedo lia o que estava a acontecer. As palavras dela: «a
     * gente dava satisfação do que estava acontecendo e agora não tem mais».
     *
     * No shard essa página deixou de ter onde viver. O domínio da escola passa a responder assim
     * que o mapa é escrito (`provisionarDentroDoShard`), mas o pacote só entra na árvore partilhada
     * no deploy seguinte — e nesse intervalo o pedido caía aqui, no ASSETS, que devolvia o 404 do
     * Cloudflare. Era essa a «tela preta dizendo que não deu certo».
     *
     * O QUE NÃO SE CONFUNDE: o 404 de uma página de conteúdo — uma aula que não existe, um link
     * velho — continua a ser um 404. Só a RAIZ da escola é um estado de espera, porque a raiz
     * existe em qualquer pacote montado (`montar-publicacao.js` sempre escreve `index.html`).
     * O texto e o `200` são os do placeholder original, de propósito: é a mesma página, no mesmo
     * ponto do processo, e duas redacções para o mesmo instante divergiriam. */
    const respostaDoAsset = await env.ASSETS.fetch(pedidoAoAsset);
    /* O ENDEREÇO COM A ESCOLA COLADA — um 302 onde hoje há um 404 vazio (20/11/2026).
     *
     * O QUE ACONTECEU. Ela abriu o ciclo e a aula, e recebeu «404 not found»; o console dizia
     * `https://breu.padd.com.br/breu/rosa/plano`. O endereço certo é `/rosa/plano` — tudo o que
     * ela reportou como quebrado responde 200 ali, medido. O prefixo a mais é uma cicatriz do
     * regime antigo, em que tudo era servido em `danca.padd.com.br/<escola>/<variante>/…`, e um
     * marcador guardado desde então nunca mais abre.
     *
     * O QUE NÃO SE FAZ: explicar. O ASSETS devolve um 404 com `content-length: 0` — uma página
     * em branco, que se lê como «o sistema caiu». Quem tem o link errado não tem como saber que
     * o link é que está errado.
     *
     * O QUE SE FAZ: tirar o prefixo e repetir o pedido, uma vez. A guarda é o 404 — um caminho
     * que exista nunca é redireccionado, e é isso que impede esta correcção de mexer no que já
     * responde. A decisão do caminho vive em `caminhoSemAEscola`, e a prova mede essa função. */
    if (respostaDoAsset.status === 404) {
      const semPrefixo = caminhoSemAEscola(path, escolaResolvida);
      if (semPrefixo) {
        return new Response(null, {
          status: 302,
          headers: { Location: semPrefixo + url.search, 'Cache-Control': 'no-store, max-age=0' },
        });
      }
    }
    if (respostaDoAsset.status === 404 && escolaResolvida && (path === '/' || path === '/index.html')) {
      /* A ESPERA DIZ-SE, E RESOLVE-SE SOZINHA (16/11/2026). «Enquanto não carrega, não tem nenhuma
       * mensagem dizendo que é para aguardar, a tela fica preta.» A página já existia; o que lhe
       * faltava era voltar a perguntar — ver o `recarregar` em `estado-html.js` — e o `no-store`,
       * sem o qual o navegador guardava esta resposta e continuava a mostrá-la com a escola já no
       * ar. Cinco segundos: o tempo de um deploy terminar, e não o de alguém desistir. */
      return respostaEstado('Sistema Lastro',
        '<p>Esta é a escola <b>' + esc(env.ESCOLA_NOME || escolaResolvida) + '</b>. O motor completo '
        + '(Bastidores, anamnese, plano de ensino e plano de observação) está sendo implantado.</p>'
        + '<p>Aguarde — esta página recarrega sozinha a cada 5 segundos, e a escola aparece aqui '
        + 'assim que a implantação terminar.</p>', 200, { recarregar: 5 });
    }
    // O PACOTE também veste a escola: o índice, as aulas, o guia — todos são documentos que
    // se leem, e ler no escuro é uma decisão da casa, não de quem abriu o link.
    return comAparencia(respostaDoAsset, await aparenciaDoEnv(env),
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
  /* O ESTADO COMERCIAL E A FRONTEIRA «ler × escrever» (25/11/2026), exportadas porque são a REGRA
   * que a prova mede sem um Worker à frente: um estado errado aqui abre ou fecha a escola inteira. */
  comercialDaEscola, ehEscrita, POSTS_QUE_SO_LEEM,
  /* A ÁRVORE, exportada para a prova (14/11/2026). A bancada do shard mede `caminhoNaArvore` e
   * `ehAssetPartilhado` directamente — são elas que decidem se `/aulas/` vira `/calango/aulas/`
   * e se `/assets/style.css` fica quieto, e uma prova que as reconstruísse mediria a prova. */
  prefixoDaArvore, caminhoNaArvore, ehAssetPartilhado, prefixoDosAssetsDaPorta,
  /* O ENDEREÇO COM A ESCOLA COLADA (20/11/2026) — exportado para a prova medir a decisão do
   * caminho, e não o `fetch` inteiro: é ela que decide se há 302 ou 404. */
  caminhoSemAEscola,
  /* A MONTAGEM DA CADEIA, exportada para a prova (09/11/2026). A prova mede a MESMA função que
   * a ponte usa — reconstruí-la na bancada mediria a bancada, não a ligação. */
  montarCadeia,
  /* A IDENTIDADE DO PACOTE E O ESQUECIMENTO DO CACHE — para as provas poderem exercer os dois
   * lados sem esperar que um isolate morra (13/11/2026). */
  identidadeDoPacote,
  esquecerPacote,
  /* A SOBREPOSIÇÃO DA IDENTIDADE, exportada para a prova (15/11/2026): é ela que dá à escola do
   * shard a chave derivada e o dono que estão no KV, e uma prova que a reconstruísse mediria a
   * prova. */
  comIdentidadeDaEscola,
  __armazenamento: (env) => criarArmazenamento(env),
};
