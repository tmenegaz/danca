'use strict';

/**
 * painel-html.js — o PAINEL do sistema, servido pela raiz (`danca`).
 *
 * O QUE ELE É, DEPOIS DO RETRABALHO DE 22/10/2026. A dona do produto contou os cliques:
 *
 *   o botão «Painel» → uma página-índice de secções → um «Abrir» → a lista.
 *
 * Três cliques para chegar ao que ela pediu. Não é isso. A página `danca` **é** o painel: ela
 * continua a ter «Apagar escola» e «Criar nova escola», e a lista de escolas vem logo abaixo, na
 * mesma página. O menu tem a logomarca e mais nada: nem «Sistema Lastro», nem «Área do
 * Professor», nem «Bastidores», que são de uma ESCOLA e não da raiz. Levar quem administra o
 * sistema para um menu de escola é entrar noutra estrutura. (E desde 14/11/2026 também não tem
 * «Escolas apagadas»: a navegação do painel vive nos botões da coluna esquerda da própria
 * página — ver `ITENS_DO_PAINEL` em `tools/templates/nav-html.js`.)
 *
 * DE ONDE VÊM OS DADOS — E POR QUE ISSO RESOLVE A LENTIDÃO. A primeira versão pedia o acervo ao
 * GitHub (`lerComCache`): uma árvore + um `contents/` por escola, doze requisições para desenhar
 * uma lista, a cada visita. Agora lê o **índice versionado** (`indices/acervo.json`) — UMA
 * requisição, o mesmo arquivo que o `regerar-indices.yml` mantém em dia a cada push. E o registo
 * de uma escola é a leitura do elo dela (`escola/<slug>/indice.json`): outro arquivo, outra
 * requisição.
 *
 * O registo não se «gera»: está no repositório desde o expurgo. O que demorava era o índice
 * inteiro construído só para validar um slug.
 *
 * IDENTIDADE. Nenhuma peça nova: a barra é a GERADA (`nav-html.js` → `navDoPainel`), e a página
 * usa a folha do sistema — `header.doc` + `h1`/`.subtitulo`, `.caixa`, `.ficha`, `<table>` (a
 * mesma dos documentos gerados), `.selo` e `a.acao`. `tools/check-identidade.js` mede estas
 * páginas junto com as outras superfícies que emitem marcação (checagem 8).
 */

const { navDoPainel } = require('../../tools/templates/nav-html.js');
/* O endereço das escolas tem UM compositor, e é o mesmo que cria o registo DNS. */
const dominio = require('./dominio-da-escola.js');
/* O RELÓGIO DA CASA (16/11/2026) — uma linha, e todas as datas desta página passam por ela. */
const fuso = require('../nucleo/fuso.js');
/* A CLÁUSULA DE QUITAÇÃO vem do núcleo, e não se escreve outra vez nesta página: é o núcleo que
 * decide o que é um mês quitado, e a frase que o explica é dele. */
const mensalidades = require('../nucleo/mensalidades.js');
/* A PAGINAÇÃO É A PEÇA DA CASA (23/10/2026) — a mesma das listas da Produção e das páginas de
 * lista. Não se escreve uma segunda: o rodapé, o `hidden` e o `data-por-pagina` são o acordo, e um
 * segundo acordo é uma segunda coisa para corrigir. */
const paginacao = require('../nucleo/paginacao.js');
/* O CONSULTOR (25/11/2026) — a regra do cadastro é do núcleo, e a página só a apresenta. As
 * colunas «Documento», «Equipamento» e «Estado» são formatações dele, e não desta página: a mesma
 * frase tem de sair igual na área dele (F2) e na lista daqui. */
const consultores = require('../nucleo/consultores.js');
/* O BOTÃO «COPIAR», NÚMERO UM (25/11/2026) — ver `motor/nucleo/copiar.js`.
 *
 * O RECONHECEDOR DO LINK já não é necessário nesta página (25/11/2026): ela deixou de mostrar o
 * «Pagar no banco» na coluna da cobrança — «não precisa disso». O link vive onde a escola paga
 * (o «Pagar» e o mês a mês), e essas duas páginas leem-no pelo módulo `cobrancas.js`.
 *
 * O `cobrancas.js` VOLTA AQUI A 25/11/2026, e por outro motivo: esta página passou a LER O VALOR do
 * código colado (`valorDaCobranca`) para dizer se ele cobre a mora do mês. É a mesma função que o
 * mês a mês usa para decidir se a cobrança serve — uma regra, um sítio, como a do link. */
const cobrancasDoNucleo = require('../nucleo/cobrancas.js');
const { SCRIPT_DO_COPIAR } = require('../nucleo/copiar.js');
/* O AVISO DO GESTO (26/11/2026) — a pilha no canto, e a função que a emite. Vive no casco do
 * painel e não em cada página: todas as páginas do dono precisam de dizer «não deu», e uma que
 * a esquecesse seria a próxima a falhar em silêncio. */
const { PILHA: PILHA_DE_AVISOS, SCRIPT_DO_AVISO } = require('../nucleo/aviso.js');

/**
 * OS MINUTOS DE UM PERÍODO DE ENSAIO (17/11/2026) — um número, num sítio só.
 *
 * «O tempo deve ser de 10 minutos para cada mês.»
 *
 * MORA AQUI, e não na rota, porque é AQUI que ele vira texto: o botão do painel diz «10 minutos por
 * mês», e a rota usa o mesmo valor quando o pedido não o traz. Duas cópias do número divergem no dia
 * em que ela disser «agora quinze» — e a divergência aparece como um botão a prometer o que a rota
 * não faz.
 *
 * DEZ E NÃO TRÊS. Três minutos chegam para ver um mês nascer e são curtos de mais para o que ela
 * quer: pagar dois seguidos e chegar a uma listagem com vários. Dez dão para informar o pagamento
 * com calma e ainda ver o mês seguinte abrir.
 */
const ENSAIO_PADRAO_MINUTOS = 10;

function esc(valor) {
  return String(valor == null ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * UMA DATA DE CALENDÁRIO, sem fuso e sem hora.
 *
 * O índice guarda instantes ISO com microssegundos (`2026-10-19T18:18:57.289485+00:00`), e o que
 * a lista responde é «que dia». A conversão é por expressão regular, e não por `Date`: o
 * `Date.parse` de um ISO com seis casas decimais não é garantido em todos os motores, e um
 * `Invalid Date` aqui sairia como «NaN/NaN/NaN» na cara de quem lê. O dia é o do carimbo, como
 * ele foi gravado — não se converte fuso de um registo de calendário.
 */
function dia(iso, opcoes) {
  /* A DATA É A LOCAL, E NÃO A DO TEXTO ISO (16/11/2026). Aqui cortavam-se os dígitos do ISO —
   * `2026-11-16T12:25Z` dava «16/11/2026» e, pior, um carimbo das 23:30 de Passo Fundo (02:30Z do
   * dia seguinte) dava o DIA seguinte. O `Z` não é decoração: é a diferença entre o dia que ela
   * viveu e o dia que o servidor viveu. Ver `motor/nucleo/fuso.js`. */
  const p = fuso.partesLocais(iso, opcoes && opcoes.fuso);
  return p ? p.dia + '/' + p.mes + '/' + p.ano : null;
}

/** O dia, ou o traço que diz «não há» — nunca uma célula vazia, que se lê como defeito. */
function diaOuTraco(iso) {
  return dia(iso) || '—';
}

/**
 * O carimbo com data e hora, para o registo do expurgo (onde a hora é a prova).
 *
 * A HORA É A DELA, E É ESSA A CORREÇÃO (16/11/2026). Aqui cortavam-se os dígitos do ISO e escrevia-se
 * «16/11/2026 às 12:25» sobre um instante que era 12:25 **UTC** — as 09:25 em Passo Fundo. Ela leu
 * «a escola foi habilitada ao meio-dia e 25» às 09:59 e concluiu, com razão, que o relógio estava
 * errado. Não estava: estava a mentir o rótulo.
 */
function quando(iso, opcoes) {
  return fuso.quandoLocal(iso, opcoes && opcoes.fuso);
}

/**
 * O endereço PÚBLICO de uma escola — o que se mostra a quem lê, e o mesmo que o `/api/escolas`
 * devolve.
 *
 * O `workers.dev` SAIU DAQUI (14/11/2026). Era o endereço técnico, o que a Cloudflare dá de
 * graça a todo o Worker — e aparecia na lista, no registo e no cartão de apagar. A pesquisadora
 * foi directa: *«o link está me levando para o `workers.dev` e não para o domínio correto, que
 * agora tem `.padd.com.br`; não precisa mais mostrar em lugar nenhum esse caminho»*. E tem
 * razão: há UM endereço da escola, e é o que o sistema criou para ela.
 *
 * A COMPOSIÇÃO NÃO É ESCRITA AQUI. `dominio.hostname` é a mesma função que cria o registo DNS e
 * a rota (`motor/servidor/dominio-da-escola.js`), e é por isso que a ligação e o registo não
 * podem divergir: uma segunda composição (`slug + '.' + zona`) divergiria no dia em que a zona
 * mudasse de sítio.
 */
function urlDaEscola(slug) {
  return 'https://' + dominio.hostname(slug) + '/';
}

/**
 * O NOME de um professor para a tela. O índice guarda `nome` quando o elo da escola o declarou
 * (`professor: { slug, nome }`) e `null` quando só existe o slug — as escolas antigas nasceram
 * antes de o elo guardar o nome. `null` não é «sem nome»: é «o nome não foi registado», e a tela
 * diz isso mostrando o slug, que é a identidade verdadeira.
 */
function nomeDoProfessor(p) {
  return String((p && p.nome) || (p && p.slug) || '');
}

/**
 * OS PROFESSORES DE UMA ESCOLA, em ligações separadas por vírgula.
 *
 * É a coluna que a dona do produto descreveu: «a gente colocar links para essas escolas separados
 * por vírgula». Aqui é o inverso — as ESCOLAS de um professor —, mas a forma é a mesma, e por
 * isso é a mesma função que faz os dois lados.
 *
 * `slugDoProfessor` não é passado como opção porque a lista já vem pronta do índice: quem monta
 * os `slugs` é quem sabe de onde eles vêm (`escola.professores` ou `professor.escolas`).
 */
function listaDeLigacoes(slugs, opcoes) {
  const o = opcoes || {};
  const itens = (slugs || []).map((slug) => {
    const rotulo = o.rotulo ? o.rotulo(slug) : slug;
    return '<a href="' + esc(o.href ? o.href(slug) : urlDaEscola(slug)) + '">' + esc(rotulo) + '</a>';
  });
  if (!itens.length) return o.vazio || '—';
  return itens.join(', ');
}

/**
 * A LISTA — a tabela das escolas, num dos três recortes.
 *
 *   'todas'    — as vivas e as apagadas (usada pelo bloco informativo da raiz);
 *   'apagadas' — só as que saíram, com a data da saída, os professores que passaram por ela e o
 *                link para o registo;
 *   'vivas'    — só as que existem: nome, professor, criação e estado.
 *
 * É UMA função para as três porque a ordem e o desenho da linha são os mesmos — o que muda é
 * que colunas fazem sentido. Duas cópias divergiriam no dia em que uma ganhasse uma coluna.
 *
 * O NOME É O LINK (22/10/2026). Numa escola viva, o nome leva ao site dela — é o gesto que
 * qualquer pessoa tenta primeiro, e poupa a viagem pelo repositório para achar o subdomínio.
 * Numa escola apagada não há site: o nome fica texto, e o destino é o registo.
 */
/**
 * O CABEÇALHO QUE ORDENA (22/10/2026).
 *
 * A ordenação é uma LIGAÇÃO, e não um botão com script: a página é gerada no servidor, uma
 * leitura só, e um `?ordem=` é o mesmo mecanismo que já traz a lista — sem estado no navegador e
 * sem uma segunda implementação da ordenação em JavaScript. Quem ordena é a mesma função que
 * desenha a tabela.
 *
 * `aria-sort` diz ao leitor de ecrã qual é a ordem em vigor. E o cabeçalho da coluna em vigor
 * NÃO é ligação: repetir a mesma ordem seria um clique que não faz nada.
 */
function thOrdenavel(rotulo, chave, atual, base, dica) {
  if (atual === chave) {
    return '<th aria-sort="ascending">' + esc(rotulo) + '</th>';
  }
  const alvo = base + (chave === base ? '' : '?ordem=' + encodeURIComponent(chave));
  /* O `dica` EXISTE PARA AS COLUNAS CUJO TÍTULO NÃO É O QUE SE ORDENA (23/11/2026). A coluna
   * «Ações» — um botão por escola — ordena pelas ESCOLAS: o título diz o gesto, a ordem diz o
   * facto, e «ordenar por ações» não quer dizer nada. Ele é o `title` INTEIRO, e não um sufixo:
   * um sufixo colado a «Ordenar por » deu «Ordenar por pelas escolas», que é o defeito a dizer o
   * que é. Quem não o passa fica com o título, que é o caso de todas as outras colunas. */
  return '<th aria-sort="none"><a href="' + esc(alvo) + '" title="' +
    esc(dica || ('Ordenar por ' + rotulo.toLowerCase())) + '">' + esc(rotulo) + '</a></th>';
}

/**
 * OS PROFESSORES DE UMA ESCOLA, como texto — para a coluna e para a ordenação.
 *
 * Numa APAGADA são todos os que o elo prova (`professores[]`); numa VIVA, o responsável e os que
 * a escola declara. A mesma forma nos dois casos, porque a coluna é a mesma.
 */
function professoresDaEscola(e) {
  if (!e) return [];
  if (Array.isArray(e.professores) && e.professores.length) return e.professores.map(String);
  return e.professor ? [String(e.professor)] : [];
}

/** A ordem pedida, se for uma das que a página conhece — e a padrão quando não é. */
function ordemPedida(pedida, conhecidas, padrao) {
  const p = String(pedida || '').trim();
  return conhecidas.indexOf(p) !== -1 ? p : padrao;
}

function tabelaDeEscolas(escolas, modo, ordem, professores) {
  const recorte = modo || 'todas';
  // O NOME, QUANDO O ÍNDICE O SABE (22/10/2026). A coluna mostrava o SLUG — a pasta —, e a dona
  // do produto leu isso como «só me deram os slugs». O mapa é construído uma vez, do acervo de
  // professores que a rota já leu: nenhuma requisição a mais. Quando o nome não está registado em
  // nenhum inventário, cai no slug — que é o que se sabe, e é melhor do que um traço numa coluna
  // que identifica a pessoa.
  const nomes = new Map();
  for (const p of (professores || [])) {
    if (p && p.slug && p.nome) nomes.set(String(p.slug), String(p.nome));
  }
  const comoNome = (slug) => nomes.get(String(slug)) || String(slug);
  // A ordem por professor é a mesma nas duas listas; a padrão continua a ser a data, que é o que
  // a lista responde primeiro («o que saiu por último», «o que nasceu por último»).
  const criterio = ordemPedida(ordem, ['professor'], 'data');
  const lista = (escolas || []).slice()
    .filter((e) => (recorte === 'apagadas' ? e.expurgada : recorte === 'vivas' ? !e.expurgada : true))
    // AS VIVAS PRIMEIRO, e depois as apagadas da saída mais recente para a mais antiga.
    //
    // Não é decoração: o `expurgada_em` de uma escola RECRIADA é a data do expurgo ANTERIOR — o
    // elo não se reescreve —, e ordenar só por ele punha uma escola viva no meio do histórico,
    // como se tivesse saído. Medido com a `batata` (expurgada em 21/10, recriada em 22/10): ela
    // aparecia entre as apagadas, com a data do expurgo antigo na coluna «Apagada».
    .sort((a, b) => {
      if (a.expurgada !== b.expurgada) return a.expurgada ? 1 : -1;
      // ORDENAR POR PROFESSOR (22/10/2026) — pedido da dona do produto: «nas apagadas, uma
      // ordenação por professor; nas vivas, também». A ordem é a da PESSOA, e depois a data,
      // porque duas escolas do mesmo professor não têm outra precedência natural.
      if (criterio === 'professor') {
        const pa = professoresDaEscola(a).map(comoNome).join(', ').toLowerCase();
        const pb = professoresDaEscola(b).map(comoNome).join(', ').toLowerCase();
        if (pa !== pb) return pa < pb ? -1 : 1;
      }
      const da = String((a.expurgada ? a.expurgada_em : a.criada_em) || '');
      const db = String((b.expurgada ? b.expurgada_em : b.criada_em) || '');
      if (da === db) return String(a.slug).localeCompare(String(b.slug));
      if (!da) return 1;
      if (!db) return -1;
      return db.localeCompare(da);
    });

  if (!lista.length) {
    const oQue = recorte === 'vivas' ? 'escola viva' : recorte === 'apagadas' ? 'escola apagada' : 'escola';
    return '<div class="caixa nota">' +
      '<h2>Nenhuma ' + oQue + '</h2>' +
      '<p>Toda escola criada deixa um elo em <code>escola/&lt;slug&gt;/indice.json</code>, e é de ' +
      'lá que esta lista sai — uma lista vazia quer dizer que nenhuma existe, não que a leitura ' +
      'falhou.</p>' +
      '</div>';
  }

  const linha = (e) => {
    const nome = e.nome && e.nome !== e.slug ? e.nome + ' (' + e.slug + ')' : e.slug;
    const rotulo = e.expurgada
      ? '<strong>' + esc(nome) + '</strong>'
      : '<a href="' + esc(urlDaEscola(e.slug)) + '"><strong>' + esc(nome) + '</strong></a>';
    /* O SELO DIZ O QUE A ESCOLA ESTÁ A FAZER, e não só que existe (25/11/2026).
     *
     * «Viva» deixou de ser uma resposta suficiente: uma escola pode existir e estar a aguardar
     * conciliação, ou suspensa por falta de pagamento. Três estados, três palavras, e a mesma
     * coluna — quem lê a lista quer saber se aquela escola abre, não se o Worker responde. */
    const estadoComercial = (e.comercial && e.comercial.estado) || 'ativa';
    /* «A NASCER» — o estado da escola que já existe e o índice ainda não sabe (16/11/2026).
     *
     * Não é um estado comercial (não é `aguardando`, que é a conciliação): é a janela entre o
     * momento em que a raiz cria a escola e o momento em que o CI commita o scaffold e o acervo a
     * reconhece. Ela pediu que a escola apareça «independente de por onde for criada» — e a
     * resposta honesta é aparecer JÁ, com o que se sabe: o nome, o professor, e que o resto vem. */
    const aNascer = e.aNascer === true;
    /* HÁ QUANTO TEMPO — e é isto que separa «está a nascer» de «travou» (16/11/2026).
     *
     * Medido hoje: um disparo ficou na fila do Actions e a escola ficou «a nascer» por tempo
     * indefinido, sem uma única pista no ecrã. Com o tempo à vista e o link do run, a pergunta
     * «travou?» passa a ter resposta sem se abrir o GitHub por tentativa. O limite de 15 minutos
     * não é uma medida de saúde do CI: é o ponto em que «demora» deixa de ser uma explicação
     * razoável para uma criação que, quando corre, leva dois ou três. */
    const minutosANascer = aNascer && e.criada_em
      ? Math.max(0, Math.floor((Date.now() - Date.parse(e.criada_em)) / 60000))
      : null;
    const demorada = minutosANascer !== null && minutosANascer >= 15;
    const run = (e.disparoRun && e.disparoRun.url)
      ? '<br><a href="' + esc(e.disparoRun.url) + '" target="_blank" rel="noopener">ver o run do GitHub</a>'
      : '';
    const procedencia = aNascer
      ? (minutosANascer === null
        ? '<br><span class="selo discreto">a nascer</span>'
        : (demorada
          ? '<br><span class="selo alerta">a nascer há ' + minutosANascer + ' min — a fila do '
            + 'GitHub não pegou o pedido</span>' + run
          : '<br><span class="selo discreto">a nascer há ' + (minutosANascer === 0
            ? 'menos de 1 min' : minutosANascer + ' min') + '</span>' + run))
      : '';
    /* O ESTADO QUE A LISTA MOSTRA É O EFECTIVO (25/11/2026) — «o que esta escola pode fazer», e não
     * «o que está gravado». As duas coisas divergem numa consultoria cujo mês terminou: o registo
     * continua `ativa` (é o que faz o congelamento não iniciar a carência) e o efectivo é
     * `expirada`. Mostrar o gravado seria dizer «ativa» de uma escola que só lê. */
    const efetivo = String(e.estadoEfetivo || e.estadoComercial || estadoComercial || 'ativa');
    const selo = e.expurgada
      ? '<span class="selo discreto">apagada</span>'
      : (aNascer
        ? procedencia
        : (efetivo === 'suspensa'
        ? '<span class="selo alerta">suspensa</span>'
        : (efetivo === 'expirada'
          ? '<span class="selo alerta">demonstração terminada</span>'
        : (efetivo === 'aguardando'
          ? '<span class="selo discreto">a aguardar conciliação</span>'
          : '<span class="selo ok">ativa</span>'))));
    /* A CONSULTORIA, NA MESMA CÉLULA (25/11/2026) — o prazo e o botão que o faz começar.
     *
     * NÃO É UMA COLUNA NOVA: a tabela já rola, e uma coluna que só tem conteúdo em algumas linhas
     * lê-se como avaria. O que se precisa de saber é «quantos dias faltam» e «entregar / prorrogar»,
     * e é isso que fica ao lado do estado — o mesmo sítio onde ela já lê se a escola abre. */
    const consultoria = (e.consultoria && typeof e.consultoria === 'object') ? e.consultoria : null;
    const ehConsultoria = String(e.plano || '') === 'consultoria' || Boolean(consultoria);
    const daConsultoria = (e.expurgada || !ehConsultoria) ? '' : (() => {
      /* «CONSULTORIA POR <NOME>» — o controlo de quem trouxe a escola (§6.2). Fica ANTES do prazo,
       * porque é a primeira pergunta que se faz a uma escola em demonstração, e o nome sozinho não
       * diz nada: quem atendeu é o que liga a escola a alguém. */
      const quemTrouxe = (e.consultor && e.consultor.nome)
        ? '<br><span class="sub">consultoria por ' + esc(e.consultor.nome)
          + (e.consultor.praca ? ' · ' + esc(e.consultor.praca) : '') + '</span>'
        : '';
      const prazo = consultoria && consultoria.terminaEm
        ? '<br><span class="sub">termina em ' + esc(fuso.quandoLocal(consultoria.terminaEm))
          + (Array.isArray(consultoria.prorrogacoes) && consultoria.prorrogacoes.length
            ? ' (prorrogada ' + consultoria.prorrogacoes.length + '×)' : '') + '</span>'
        : '<br><span class="sub">ambiente montado, ainda não entregue — o mês começa na entrega</span>';
      const aulas = Number(e.tetoDeAulas) > 0
        ? '<br><span class="sub">aulas processadas: ' + esc(String(Number(e.aulasDaConsultoria) || 0))
          + ' de ' + esc(String(e.tetoDeAulas)) + '</span>'
        : '';
      /* UMA ENTREGA, UM BOTÃO QUE SE APAGA. Entregue, o botão deixa de existir — porque entregar de
       * novo não reinicia o mês, e um botão que recusa é pior do que um botão que não está lá. No
       * lugar dele fica a prorrogação, que é o acto declarado para «mais um mês». */
      const botao = (consultoria && consultoria.entregueEm)
        ? '<button class="acao pequena secundario" type="button" data-consultoria="prorrogar" '
          + 'data-escola="' + esc(e.slug) + '" '
          + 'title="acrescentar um mês ao prazo, contado do fim que já estava marcado">'
          + 'Prorrogar 1 mês</button>'
        : '<button class="acao pequena" type="button" data-consultoria="entregar" '
          + 'data-escola="' + esc(e.slug) + '" '
          + 'title="começar o mês da demonstração — o prazo conta de agora, e não se reinicia">'
          + 'Entregar à escola</button>';
      return quemTrouxe + prazo + aulas + '<br>' + botao;
    })();

    const celulas = ['<td>' + rotulo + '</td>'];
    // O PROFESSOR, um ou vários, e NÃO É LIGAÇÃO DE SITE: uma pessoa não tem subdomínio. O nome
    // é o que se sabe dela — o slug quando o elo não registou o nome —, e nesta coluna é texto.
    // (A primeira versão ligava-o ao endereço técnico do Worker, que não existe para um
    // professor: ele não é uma escola, e a ligação morria num 404.)
    if (recorte === 'apagadas') {
      const quem = professoresDaEscola(e).map(comoNome).join(', ');
      celulas.push('<td>' + (quem ? esc(quem) : '—') + '</td>');
    } else {
      celulas.push('<td>' + esc(e.professor ? comoNome(e.professor) : '—') + '</td>');
    }
    celulas.push('<td>' + esc(diaOuTraco(e.criada_em)) + '</td>');
    // A DATA DA SAÍDA SÓ EXISTE PARA QUEM SAIU. Numa escola viva, `expurgada_em` é o expurgo
    // ANTERIOR (ela foi recriada), e escrevê-lo aqui dizia que ela estava apagada — a data certa
    // para uma viva é o traço. O histórico completo fica no registo, que é onde ele pertence.
    if (recorte !== 'vivas') {
      celulas.push('<td>' + esc(e.expurgada ? diaOuTraco(e.expurgada_em) : '—') + '</td>');
    }
    if (recorte === 'vivas') {
      /* O PLANO E A HABILITAÇÃO, na mesma linha (25/11/2026). Ela pediu «o botão de habilitar» e
       * «o botão de desabilitar» na linha de cada escola — e é aqui que eles vivem. O botão que
       * NÃO se aplica fica desligado em vez de desaparecer: uma linha que muda de forma conforme
       * o estado obriga a procurar onde se clica. */
      const plano = e.comercial && e.comercial.planoNome
        ? esc(e.comercial.planoNome) + (e.comercial.valor ? ' · ' + esc(e.comercial.valor) : '')
        : '—';
      celulas.push('<td>' + plano + '</td>');
      /* AS DUAS DATAS, E A CARÊNCIA QUE SAI DELAS (25/11/2026).
       *
       * «a coluna que é quando for habilitada tem que indicar a data e a hora que isso aconteceu
       * para poder calcular o tempo do apagar escola. O apagar aquela escola só vai poder contar
       * se do tempo em que ela foi desabilitada […] a partir dessa data conta três meses.»
       *
       * AS COLUNAS SÃO DUAS E NÃO UMA porque são dois factos: a última vez que o acesso abriu e a
       * última vez que fechou. Uma coluna só, com «a data do que aconteceu por último», obrigaria
       * a adivinhar qual dos dois ela está a ver — e é dessa adivinhação que sai a decisão de
       * apagar uma escola.
       *
       * A HORA VAI JUNTO (`quando`, e não `diaOuTraco`). O prazo é contado em meses, e um dia a
       * menos não muda nada; mas a hora é o que distingue «desabilitei hoje de manhã» de «já
       * estava desabilitada quando abri o sistema», e essa diferença é a que se pergunta. */
      celulas.push('<td>' + esc(quando(e.comercial && e.comercial.habilitadaEm)) + '</td>');
      /* A CARÊNCIA DIZ-SE NA MESMA CÉLULA DA DATA, e é a resposta à pergunta que a data levanta:
       * «já pode apagar?». Ela escolheu esta forma — «todas aparecem, e a linha diz «pode apagar»
       * ou «em carência até DD/MM/AAAA»» — em vez de esconder a escola da lista: a lista é a
       * ferramenta com que ela limpa escolas de teste, e uma lista que esconde a escola que se
       * quer apagar é uma lista que não serve. O semáforo é a informação; o botão continua a ser
       * dela.
       *
       * O SEMÁFORO VEM DO SERVIDOR, E NÃO DA DATA (16/11/2026). «Eu desabilitei a escola Duo,
       * deixei o tempo correr e ela ficou apta para ser apagada. Só que eu fui lá e habilitei a
       * escola novamente e ela continua com a etiqueta dizendo que pode apagar.» Aqui a conta era
       * feita sobre `desabilitadaEm` — um FACTO que não se apaga quando a escola volta a ser
       * habilitada —, e por isso a etiqueta sobrevivia à habilitação. A resposta a «pode apagar?»
       * é uma só, `estadoDoExpurgo`, e chega resolvida em `comercial.expurgavel`/`restanteMs`
       * (`comercialDaLista`, na raiz): esta célula limita-se a escrevê-la. */
      const desabilitadaEm = e.comercial && e.comercial.desabilitadaEm;
      const carencia = e.comercial && e.comercial.carenciaAte;
      const expurgavel = Boolean(e.comercial && e.comercial.expurgavel === true);
      const emCarencia = Boolean(e.comercial && Number(e.comercial.restanteMs) > 0);
      const carenciaTexto = expurgavel
        ? '<br><span class="selo ok">pode apagar</span>'
        : (emCarencia && carencia
          ? '<br><span class="selo discreto">em carência até ' + esc(quando(carencia)) + '</span>'
          : '');
      celulas.push('<td>' + esc(quando(desabilitadaEm)) + carenciaTexto + '</td>');
      /* «DESABILITAR» DEIXOU DE SER SÓ DA ESCOLA ATIVA (16/11/2026).
       *
       * Era `=== 'ativa'`, e fazia sentido enquanto o único uso era «parou de pagar». Com a regra
       * do expurgo — só se apaga a escola suspensa com a carência vencida —, uma escola a
       * AGUARDAR CONCILIAÇÃO ficou sem caminho nenhum para ser apagada: nunca pagou, não pode ser
       * suspensa, e o expurgo não a aceita (nem deve: a conciliação é de até 24 horas, e apagar
       * uma escola que está prestes a ser paga seria o pior desfecho possível de um clique).
       *
       * O caminho passa a ser o mesmo de todas: desabilitar (é a decisão dela, e é a mesma palavra
       * que ela usa), cumprir a carência, e então apagar. E a HISTÓRIA não se perde: o elo do
       * estado guarda «de aguardando para suspensa», com data.
       *
       * O botão que não se aplica continua a ficar DESLIGADO em vez de desaparecer: uma linha que
       * muda de forma conforme o estado obriga a procurar onde se clica. */
      const podeHabilitar = estadoComercial !== 'ativa';
      const podeDesabilitar = estadoComercial !== 'suspensa';
      /* OS DOIS BOTÕES EMPILHADOS (16/11/2026). «Vamos deixar na coluna acesso os dois botões […]
       * sempre um abaixo do outro na vertical […] e arruma o espaço entre eles, porque as margens
       * estão ficando acavaladas.» O vão e a largura da coluna são da peça `.acoes-da-linha`
       * (`ciclo.css`): aqui só se diz o que é. A célula não leva classe — quem desenha é a peça, e
       * um `<td>` com `display:flex` deixaria de ser célula. */
      celulas.push('<td><div class="acoes-da-linha">' +
        '<button class="acao pequena" type="button" data-comercial="ativa" data-escola="' +
        esc(e.slug) + '"' + (podeHabilitar ? '' : ' disabled') + '>Habilitar</button>' +
        '<button class="acao pequena secundario" type="button" data-comercial="suspensa" ' +
        'data-escola="' + esc(e.slug) + '"' + (podeDesabilitar ? '' : ' disabled') +
        '>Desabilitar</button>' +
        '</div></td>');
    }
    celulas.push('<td>' + selo + daConsultoria + '</td>');
    if (recorte !== 'vivas') {
      celulas.push('<td>' + (e.expurgada
        ? '<a href="/escolas-apagadas/' + encodeURIComponent(e.slug) + '">Abrir o registo</a>'
        : '—') + '</td>');
      /* RECRIAR (16/11/2026). «Eu vou clicar então em recriar, e aí eu recrio a escola e vou mandar
       * a chave Pix para ele fazer o pagamento. Aí a escola vai estar lá nas escolas vivas,
       * aguardando para ser habilitada.»
       *
       * O BOTÃO SÓ EXISTE ONDE HÁ O QUE RECRIAR: uma linha que não está expurgada não tem elo
       * com que a recriar, e a rota recusaria. O `data-plano-anterior` leva o plano da encarnação
       * anterior para a confirmação o pré-seleccionar — é o mesmo plano, quase sempre.
       *
       * O GESTO NÃO É UMA ORDEM IRREVERSÍVEL, e por isso não copia a cerimónia do apagar: abre uma
       * confirmação com o plano e as senhas (as senhas não estão na proveniência, e uma escola sem
       * senha não abre para ninguém). */
      celulas.push('<td>' + (e.expurgada
        ? '<button class="acao pequena" type="button" data-recriar="' + esc(e.slug) + '"' +
          (e.planoAnterior && e.planoAnterior.id
            ? ' data-plano-anterior="' + esc(e.planoAnterior.id) + '"' : '') +
          '>Recriar</button>'
        : '—') + '</td>');
    }
    return '<tr>' + celulas.join('') + '</tr>';
  };

  // AS COLUNAS SEGUEM A LINHA, e a regra é «cada coluna responde a uma pergunta que esta lista
  // faz». Numa apagada, «Professor» (o do inventário) e «Professores» (os do elo) seriam duas
  // colunas a disputar o mesmo espaço com dados sobrepostos — fica só a segunda, que é a
  // completa. O CABEÇALHO da coluna dos professores ordena (`?ordem=professor`).
  const base = recorte === 'apagadas' ? '/escolas-apagadas' : '/escolas-vivas';
  const colunas = ['<th>Escola</th>',
    thOrdenavel(recorte === 'apagadas' ? 'Professores' : 'Professor', 'professor', criterio, base),
    '<th>Criada</th>'];
  if (recorte !== 'vivas') colunas.push('<th>Apagada</th>');
  if (recorte === 'vivas') {
    /* AS DUAS COLUNAS DIZEM DE QUE RELÓGIO SÃO (16/11/2026). A hora é a local — a dela —, e o
     * `title` é para quem lê de outro fuso e precisa de saber qual: um número de horas sem sujeito
     * é o que fez «12:25» parecer avaria. */
    const relogio = fuso.ROTULO_DO_FUSO + ' (' + fuso.etiquetaDoFuso(new Date()) + ')';
    colunas.push('<th>Plano</th>',
      '<th title="' + esc(relogio) + '">Habilitada</th>',
      '<th title="' + esc(relogio) + '">Desabilitada</th>',
      '<th>Acesso</th>');
  }
  colunas.push('<th>Estado</th>');
  /* A COLUNA CHAMA-SE «AÇÕES», NO PLURAL (23/11/2026). Ela nomeava-se «Recriar» — o rótulo do
   * único botão que tinha —, e o nome de uma acção não é o nome de uma coluna: hoje há um botão,
   * amanhã há dois, e o cabeçalho teria de mudar outra vez. O plural é o padrão da casa (o «Ações»
   * da Área do Professor, o da tabela da música do exercício), e é o que ela pediu por palavras:
   * «a última coluna tem que se chamar ação. Ações, né? […] é ações no plural». */
  if (recorte !== 'vivas') colunas.push('<th>Registo</th>', '<th>Ações</th>');

  /* A LISTA É PAGINADA — a regra da casa, e não uma tabela que cresce. Com treze escolas a
   * tabela ainda cabe; com as que ela criar em dois anos, não. A `.paginas` é a MESMA peça das
   * listas da Produção e do mês a mês do Financeiro, com o mesmo «por página» (10/20/50/100) na
   * barra de cima. */
  const id = recorte === 'apagadas' ? 'pa-lista-apagadas' : 'pa-lista-vivas';
  return tabelaPaginada(id,
    '<table>' +
    '<thead><tr>' + colunas.join('') + '</tr></thead>' +
    '<tbody>' + lista.map(linha).join('') + '</tbody>' +
    '</table>' +
    '<p class="aviso">A coluna «' + (recorte === 'apagadas' ? 'Professores' : 'Professor') +
    '» ordena quando se clica no título. A ordem em vigor é a de cima; a data continua a ser a ' +
    'ordem natural desta lista.</p>', 'Escolas por página');
}

/**
 * A BARRA «POR PÁGINA» — a peça da casa, e não uma nova (19/11/2026).
 *
 * A regra da paginação diz onde vive o selector de quantos por página: na barra de filtros
 * (`.caixa.filtrar` + `.campo-filtro`), acima da lista, e não no rodapé — o rodapé é navegação. É
 * o que o Financeiro já faz desde 16/11/2026, e é a mesma marcação que o `paginacao.js` reconhece
 * pelo `data-tamanho-de`: o selector declara DE QUE painel manda, e a peça do núcleo trata do
 * resto. Nenhuma classe nasce aqui, e nenhum script também.
 */
function barraDeTamanho(id, rotulo) {
  return '<div class="caixa filtrar">' +
    '<div class="campo-filtro">' +
    '<label class="campo-rotulo" for="' + id + '-por-pagina">' + esc(rotulo) + '</label>' +
    '<select id="' + id + '-por-pagina" data-tamanho-de="' + id + '">' +
    [10, 20, 50, 100].map((n) => '<option value="' + n + '"'
      + (n === 10 ? ' selected' : '') + '>' + n + '</option>').join('') +
    '</select></div></div>';
}

/**
 * UMA TABELA PAGINADA — o embrulho, que é o contrato da `.paginas`.
 *
 * O `data-paginar` vai no DIV que embrulha a tabela, e o rodapé é FILHO dele: o script procura o
 * `[data-paginar]`, depois a lista (`[data-linhas]`, o `tbody` ou o `ul`) e o `.paginas` dentro
 * dele. Um rodapé fora do embrulho não seria encontrado — e a lista ficaria a mostrar tudo com um
 * rodapé inerte ao lado, que é o pior dos dois estados.
 */
function tabelaPaginada(id, tabela, rotulo) {
  return barraDeTamanho(id, rotulo) +
    '<div data-paginar data-por-pagina="10" id="' + id + '">' +
    tabela +
    paginacao.marcacao() +
    '</div>';
}

/**
 * A TABELA DOS PROFESSORES — nome, e as escolas VIVAS onde ele trabalha.
 *
 * A REGRA QUE A LISTA TEM DE ATENDER: um professor pode estar em mais de uma escola. Por isso a
 * segunda coluna é uma LISTA de ligações, e não um valor — e é uma lista separada por vírgula
 * porque a escala real não justifica mais: um professor com vinte escolas seria um caso, não a
 * regra, e uma coluna de vinte ligações ainda se lê.
 *
 * AS ESCOLAS APAGADAS NÃO ENTRAM AQUI, de propósito: a pergunta desta lista é «onde esta pessoa
 * trabalha hoje». O histórico dela está do outro lado — na lista das apagadas, que mostra quem
 * passou por cada escola que já não existe.
 *
 * QUEM NÃO TEM ESCOLA VIVA APARECE ASSIM MESMO, com o traço e um selo. Esconder seria pior: o
 * professor existe, trabalha (ou trabalhou), e uma lista chamada «Professores» que omitisse
 * metade deles mentiria sobre o que tem.
 */
function tabelaDeProfessores(professores, escolas, ordem, contatos) {
  const criterio = ordemPedida(ordem, ['nome', 'escolas'], 'nome');
  /* A ESCOLA INTEIRA, e não só o slug (23/11/2026). «Aí o botão vai ser o nome da escola e aí se
   * clicar nele, vai para a escola.» O slug é a identidade da máquina; o nome é o que se lê. O
   * mapa é construído uma vez, do acervo que a rota já leu — nenhuma requisição a mais. */
  const porSlug = new Map((escolas || []).filter((e) => !e.expurgada).map((e) => [e.slug, e]));
  const vivasDe = (p) => (p && p.escolas ? p.escolas : [])
    .map((s) => porSlug.get(s)).filter(Boolean);
  const rotulosDe = (p) => vivasDe(p).map((e) => String(e.nome || e.slug)).sort();
  /* A FICHA DA PESSOA (`professores/<slug>/contato`) — o que a criação da escola e o Estúdio
   * gravam. Chega pronta da rota; aqui só se escolhe o que mostrar. */
  const fichaDe = (slug) => (contatos && contatos[slug]) || null;
  /* O NOME: o do índice (o que a escola declarou) e, quando ele não existe, o da ficha (o que a
   * própria pessoa escreveu). Sem os dois, a célula diz que não há — nunca o slug fingido de nome. */
  const nomeDe = (p) => String(p.nome || '').trim()
    || String((fichaDe(p.slug) || {}).nomeCompleto || '').trim();
  const lista = (professores || []).slice().sort((a, b) => {
    // ORDENAR PELAS ESCOLAS VIVAS (22/10/2026) — pedido da dona do produto: «que daí eu consigo
    // ordenar pelas mesmas escolas». É o que agrupa os professores que partilham escola, e o
    // desempate é o nome, para a ordem não depender de como o índice veio.
    //
    // A CHAVE É O QUE ESTÁ ESCRITO NA CÉLULA (23/11/2026): agora são os NOMES das escolas, e não
    // os slugs, porque é o nome que o botão diz. Ordenar por uma coisa e mostrar outra faria a
    // coluna parecer desarrumada.
    if (criterio === 'escolas') {
      const ea = rotulosDe(a).join(', ').toLowerCase();
      const eb = rotulosDe(b).join(', ').toLowerCase();
      if (ea !== eb) return ea < eb ? -1 : 1;
    }
    const na = (nomeDe(a) || nomeDoProfessor(a)).toLowerCase();
    const nb = (nomeDe(b) || nomeDoProfessor(b)).toLowerCase();
    return na < nb ? -1 : na > nb ? 1 : 0;
  });

  if (!lista.length) {
    return '<div class="caixa nota">' +
      '<h2>Nenhum professor</h2>' +
      '<p>Um professor entra no acervo pela pasta <code>professores/&lt;slug&gt;/</code> e pelos ' +
      'ciclos que declara. Uma lista vazia quer dizer que nenhum existe.</p>' +
      '</div>';
  }

  const linhas = lista.map((p) => {
    const minhas = vivasDe(p);
    /* ── A COLUNA «AÇÕES» (23/11/2026) ─────────────────────────────────────────────────────
     *
     * Palavras dela: «Aqui chama escolas vivas, a gente vai chamar aqui de ações. […] onde está
     * escrito sem escola viva, que é só uma etiqueta, vai virar um botão de ação. Sem escola viva
     * é uma etiqueta, mas se tiver escola viva, aí o botão leva até a escola viva. Aí o botão vai
     * ser o nome da escola e aí se clicar nele, vai para a escola.»
     *
     * AS DUAS METADES DA FRASE, porque a diferença é a regra inteira: **sem** escola não há gesto
     * nenhum a fazer, e por isso o que fica é a etiqueta; **com** escola há um destino, e o que
     * fica é um botão com o NOME dela. Um botão que dissesse «sem escola viva» seria um botão para
     * nenhum sítio — e uma etiqueta com o nome da escola esconderia que ele se clica.
     *
     * A MARCA DO RESPONSÁVEL vai no `title`, e não numa coluna nova: ele quer saber de quem cobrar
     * ou contra quem acionar («se eles são professores principais, professores titulares donos da
     * escola»), e `e.professor` é exactamente essa resposta no índice. É facto, não adjetivo.
     */
    const acoesCelula = minhas.length
      ? '<div class="acoes-da-linha">' + minhas.map((e) => {
        const nome = String(e.nome || e.slug);
        const responsavel = p.slug && String(e.professor || '') === String(p.slug);
        return '<a class="acao secundario" href="' + esc(urlDaEscola(e.slug)) + '"' +
          (responsavel ? ' title="' + esc(nome + ' — professor responsável por esta escola') + '"' : '') +
          '>' + esc(nome) + '</a>';
      }).join('') + '</div>'
      : '<span class="selo discreto">sem escola viva</span>';
    /*
     * A COLUNA QUE FALTAVA (22/10/2026): «aqui, nessa janela de professores, eu preciso de uma
     * coluna anterior que é o nome do professor. Eu preciso saber o nome real do professor.»
     *
     * O nome vem do inventário da escola que declarou a pessoa — `professores[].nome` ou o
     * `professor.nome` do responsável —, e, quando ele não existe, da ficha da pessoa (23/11/2026:
     * é a mesma pessoa, e ela escreveu o nome dela no cadastro). A AUSÊNCIA É DITA, não
     * disfarçada: quando nenhum dos dois sítios guarda o nome (professor antigo, de uma escola
     * cujo KV já foi expurgado), a célula mostra um traço com o motivo no `title`, e não o slug,
     * que já está na coluna ao lado. Pôr o slug aqui fingiria um nome que ninguém registou.
     */
    const nome = nomeDe(p);
    const nomeCelula = nome
      ? '<strong>' + esc(nome) + '</strong>'
      : '<span class="selo discreto" title="o repositório não guarda o nome deste professor: ' +
        'a escola que o cadastrou já não existe, ou ele nasceu antes de o nome se gravar. ' +
        'Editar o nome de um professor principal grava-o; um secundário ganha-o ao ser declarado ' +
        'pela escola.">sem nome registado</span>';
    const ficha = fichaDe(p.slug) || {};
    const documento = documentoDoProfessor(ficha);
    return '<tr>' +
      '<td>' + nomeCelula + '</td>' +
      '<td><code>' + esc(p.slug) + '</code></td>' +
      '<td>' + (documento ? documento.tipo + ' ' + esc(documento.valor) : '—') + '</td>' +
      '<td>' + (comoFalar(ficha.email, ficha.telefone) || '—') + '</td>' +
      '<td>' + acoesCelula + '</td>' +
      '</tr>';
  }).join('');

  /* PAGINADA PELA MESMA PEÇA (19/11/2026). «Um professor pode estar em mais de uma escola» — a
   * lista é a das PESSOAS, e ela cresce com a operação, não com o catálogo. O rodapé e o «por
   * página» são os da casa, iguais aos das escolas e do Financeiro. */
  return tabelaPaginada('pa-lista-professores',
    '<table>' +
    '<thead><tr>' +
    thOrdenavel('Nome', 'nome', criterio, '/professores') +
    '<th>Pasta</th>' +
    '<th>Documento</th>' +
    '<th>Contacto</th>' +
    thOrdenavel('Ações', 'escolas', criterio, '/professores', 'Ordenar pelas escolas') +
    '</tr></thead>' +
    '<tbody>' + linhas + '</tbody>' +
    '</table>' +
    '<p class="aviso">A <strong>pasta</strong> é o identificador do professor — aparece nos caminhos ' +
    'do repositório e nos documentos, e não muda quando o nome muda. O <strong>documento</strong> e ' +
    'o <strong>contacto</strong> são os do cadastro do professor: vêm de onde ele foi escrito — a ' +
    'criação da escola ou o Estúdio —, e podem ser um CPF ou um CNPJ, conforme o que a pessoa tem. ' +
    'Em <strong>Ações</strong>, cada botão é uma escola viva dele e leva ao site dela; o tooltip diz ' +
    'quem é o <em>responsável</em>. «—» é ausência de dado, e não um zero.</p>',
    'Professores por página');
}

/**
 * O BLOCO QUE ENTRA NA PÁGINA DA RAIZ — agora INFORMATIVO, e estático.
 *
 * HISTÓRICO, porque a mudança importa. Ontem este bloco tinha a lista das escolas a crescer, e
 * dois botões («ver só as vivas», «ver só as apagadas»). Hoje ele é TEXTO: diz o que cada lista
 * mostra e leva a ela. As listas vivem nas suas próprias páginas, e os atalhos vivem na coluna
 * das ações — que é o lugar onde se clica, não o meio de um capítulo de apresentação.
 *
 * Duas consequências, e as duas são boas:
 *
 *   · a página `/` deixou de ler o índice — não há dado nenhum a buscar para responder, logo ela
 *     não depende do `GITHUB_TOKEN` nem da API do GitHub. Abre sempre, mesmo com o índice
 *     ilegível, e é a página que cria escolas;
 *   · o texto pode ser lido e revisto como texto. Uma lista que muda sozinha não se revisa.
 *
 * O `id` do título é a âncora do índice da página: é por ele que «Escolas do sistema» aparece no
 * «Nesta página».
 */
const MARCADOR = '<div id="escolas-do-sistema"></div>';
const MARCADOR_INDICE = '<div id="indice-da-pagina"></div>';

function blocoDeEscolas() {
  // A TABELA É A EXPLICAÇÃO. Três linhas, e cada uma responde «o que mostra» e «onde está» —
  // em vez de um parágrafo que obriga a procurar o link no meio da prosa.
  return '<h2 id="escolas-do-sistema">Escolas do sistema</h2>' +
    '<p>As escolas e os professores são listas separadas, e cada uma responde a uma pergunta ' +
    'diferente. Duas regras explicam por que são separadas:</p>' +
    '<ul>' +
    '<li><strong>uma escola tem os seus professores</strong> — quem dá aula ali;</li>' +
    '<li><strong>um professor pode estar em mais de uma escola</strong> — a mesma pessoa dá aula ' +
    'em lugares diferentes, e a pasta dela é uma só.</li>' +
    '</ul>' +
    '<table>' +
    '<thead><tr><th>Lista</th><th>O que mostra</th><th>Onde</th></tr></thead>' +
    '<tbody>' +
    '<tr><td><strong>Escolas vivas</strong></td>' +
    '<td>As escolas que existem agora: o nome (que leva ao site), o professor responsável, a ' +
    'data de criação e o estado.</td>' +
    '<td><a href="/escolas-vivas">Ver as escolas vivas</a></td></tr>' +
    '<tr><td><strong>Escolas apagadas</strong></td>' +
    '<td>As que foram expurgadas: quando nasceram, quando saíram, os professores que passaram ' +
    'por elas, e o registo do expurgo — o que saiu do repositório e o que ficou no KV.</td>' +
    '<td><a href="/escolas-apagadas">Ver as escolas apagadas</a></td></tr>' +
    '<tr><td><strong>Professores</strong></td>' +
    '<td>Quem trabalha hoje, e as escolas vivas de cada um — pode haver mais de uma.</td>' +
    '<td><a href="/professores">Ver os professores</a></td></tr>' +
    '</tbody>' +
    '</table>' +
    '<p>A escola apagada continua a lembrar quem passou por ela: o professor não se apaga, e o ' +
    'elo do expurgo guarda os nomes de quem tinha fontes ali.</p>';
}

/**
 * O ÍNDICE DESTA PÁGINA — o «Nesta página», montado a partir dos títulos REAIS.
 *
 * POR QUE NO SERVIDOR, e não no `gerar-raiz.sh`. Duas razões, e as duas são de facto: o corpo da
 * raiz é regerado de `biblioteca/apresentacao.md` e não sabe nada do bloco de escolas; e um índice
 * escrito à mão no casco apodreceria no dia em que o texto ganhasse um capítulo. Lendo os
 * `<h2>`/`<h3>` do HTML já montado, o índice é sempre o da página que está a ser servida.
 *
 * O TRECHO É O `main`, e não a página: os `<h2>` dos modais («Criar nova escola», «Apagar escola»)
 * ficam de fora — são diálogos, não capítulos.
 *
 * A FORMA É A DO PACOTE: `nav.toc-local` com `p.toc-titulo` e uma lista, que é o que o
 * `assets/nav.js` procura para criar a dobra em tela estreita. Um `<ul>` com os h2 e, aninhados,
 * os h3 de cada um.
 */
function indiceDaPagina(html) {
  const ini = html.indexOf('<div class="conteudo"');
  const fim = html.indexOf('</main>', ini === -1 ? 0 : ini);
  if (ini === -1 || fim === -1) return '';
  const trecho = html.slice(ini, fim);

  const titulos = [];
  for (const m of trecho.matchAll(/<h([23])(?:\s+id="([^"]+)")?[^>]*>([\s\S]*?)<\/h\1>/g)) {
    if (!m[2]) continue;
    // O texto do título, sem as tags que o pandoc põe lá dentro (links de âncora, ênfase).
    const texto = m[3].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!texto) continue;
    titulos.push({ nivel: Number(m[1]), id: m[2], texto });
  }
  if (!titulos.length) return '';

  // A montagem é uma pilha de dois níveis, e não uma árvore: os h2 são os capítulos e os h3 são
  // os passos de cada um. Um h3 sem h2 antes não tem onde ser pendurado, e é ignorado.
  const itens = [];
  let temH2 = false;
  let sublistaAberta = false;
  for (const t of titulos) {
    if (t.nivel === 2) {
      if (temH2) itens.push((sublistaAberta ? '</ul>' : '') + '</li>');
      itens.push('<li><a href="#' + t.id + '">' + esc(t.texto) + '</a>');
      temH2 = true;
      sublistaAberta = false;
    } else {
      if (!temH2) continue;
      if (!sublistaAberta) { itens.push('<ul>'); sublistaAberta = true; }
      itens.push('<li><a href="#' + t.id + '">' + esc(t.texto) + '</a></li>');
    }
  }
  if (temH2) itens.push((sublistaAberta ? '</ul>' : '') + '</li>');

  return '<nav class="toc-local" aria-label="Índice desta página">' +
    '<p class="toc-titulo">Nesta página</p>' +
    '<ul>' + itens.join('') + '</ul>' +
    '</nav>';
}

/** O CASCO das páginas que são do Worker (a lista filtrada e o registo). */
function pagina({ titulo, subtitulo, atual, corpo }) {
  return '<!doctype html><html lang="pt-BR" data-paleta="verde">' +
    '<head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + esc(titulo) + ' · Sistema Lastro</title>' +
    '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">' +
    '<link rel="stylesheet" href="/assets/style.css">' +
    '</head><body id="top" data-layout="painel" data-tela="' + esc(atual) + '">' +
    navDoPainel({ atual }) +
    '<header class="doc"><h1>' + esc(titulo) + '</h1>' +
    (subtitulo ? '<p class="subtitulo">' + esc(subtitulo) + '</p>' : '') +
    '</header>' +
    '<main><div class="conteudo">' + corpo + '</div></main>' +
    '<a class="topo" href="#top" title="Voltar ao topo">&#8593;</a>' +
    /* A PAGINAÇÃO VEM NO CASCO, E NÃO NA PÁGINA QUE A USA (19/11/2026).
     *
     * A regra da casa é a `.paginas` do `motor/nucleo/paginacao.js`: `data-paginar` +
     * `data-por-pagina`, o rodapé que nasce `hidden` (com uma página só não aparece, e sem
     * JavaScript a lista mostra tudo), e o selector «por página» que declara de quem é
     * (`data-tamanho-de`). Ela era carregada só pela página do Financeiro — e por isso as tabelas
     * das escolas, dos professores e dos contatos cresciam sem paginação nenhuma: os contatos
     * guardam 200 pedidos numa tabela só.
     *
     * Fica no CASCO porque é o comportamento de TODAS as listas deste painel, e uma página que o
     * esquecesse seria a próxima a crescer sem rodapé. UMA vez por documento: carregá-lo também no
     * corpo (como o Financeiro fazia) registaria os ouvintes duas vezes, e um clique no «›»
     * adiantaria duas páginas. */
    '<script>' + paginacao.script + '</script>' +
    /* A PILHA DOS AVISOS E A FUNÇÃO QUE OS EMITE (26/11/2026). Ficam no CASCO pela mesma razão da
     * paginação: é o comportamento de todas as páginas deste painel, e uma que os esquecesse
     * falharia em silêncio — que é exactamente o defeito que os trouxe para aqui. */
    PILHA_DE_AVISOS +
    '<script>' + SCRIPT_DO_AVISO + '</script>' +
    '<script src="/assets/nav.js"></script>' +
    '</body></html>';
}

/** Resposta HTML do painel. Sem cache: a lista é a verdade do repositório agora. */
function resposta(html, status) {
  return new Response(html, {
    status: status || 200,
    headers: {
      'Content-Type': 'text/html;charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * AS DUAS LISTAS FILTRADAS — «Ver só as apagadas» e «Ver só as vivas».
 *
 * São a mesma página com outro recorte, e é por isso que são uma função: o que muda é o título,
 * o que a tabela mostra e o que o parágrafo diz. Duas funções quase iguais divergiriam no dia em
 * que uma ganhasse uma coluna — e a regra do catálogo é que peça repetida é peça que vai
 * divergir.
 */
function paginaDeLista({ recorte, escolas, ordem, professores, catalogo }) {
  const apagadas = recorte === 'apagadas';
  return pagina({
    titulo: apagadas ? 'Escolas apagadas' : 'Escolas vivas',
    subtitulo: apagadas
      ? 'O registo do que foi expurgado — a proveniência de uma escola que existiu.'
      : 'As escolas que existem agora. O nome leva ao site de cada uma.',
    atual: apagadas ? 'escolas-apagadas' : 'escolas-vivas',
    /* AS APAGADAS GANHARAM UM GESTO, E É O CONTRÁRIO DO QUE ESTA LISTA FAZIA (16/11/2026). Até
     * aqui ela era só o registo do que saiu — a memória. Com a recriação, ela passa a ser também
     * onde o professor que pagou outra vez volta a ter escola. A confirmação e o script só existem
     * nesta lista: nas vivas não há nada a recriar. */
    corpo: tabelaDeEscolas(escolas, recorte, ordem, professores) +
      (apagadas
        ? modalDoConvite() + SCRIPT_DO_CONVITE_DO_PAINEL
        : blocoDoCofre() + SCRIPT_DO_COFRE + SCRIPT_DO_ACESSO) +
      '<p><a class="acao secundario" href="/">Voltar ao painel</a></p>',
  });
}

/**
 * A PÁGINA DO CONVITE — onde a ESCOLA escolhe o plano, cria as senhas e copia o Pix (16/11/2026).
 *
 * PORQUE É QUE ISTO DEIXOU DE SER UM MODAL DO PAINEL. «Esse modal que você abre para mim, ele vai
 * virar uma página.» A razão é de quem usa: quem escolhe o plano e cria a senha é o **professor**,
 * não a proprietária — e ele não tem a senha da raiz. Um modal dentro do painel obrigava-a a
 * recolher as senhas dele por telefone e a digitá-las por ele. A página é dele, chega por e-mail,
 * num link com token, e a senha nunca passa por terceiros.
 *
 * A PÁGINA NÃO CARREGA O MENU DO PAINEL, e é de propósito: `navDoPainel` desenha os destinos do
 * dono (as listas, o financeiro). Aqui há uma coisa só para fazer, e um menu ao lado dela seria
 * uma porta que responde 401 a quem clicou.
 *
 * O `estado` decide o que se vê: com um convite válido, o formulário; sem ele, a frase do motivo e
 * mais nada. As duas formas saem da MESMA função — a página inválida não é um erro do servidor, é
 * uma resposta, e uma resposta tem de ser tão legível como a outra.
 */
function paginaDoConvite({ escola, nome, token, catalogo, pix, estado, retrato, identidade }) {
  const nomeDaEscola = String(nome || escola || '');
  /* O `data-centavos` VAI JUNTO DO `data-preco` (16/11/2026). O texto é o que se lê; os cêntimos
   * são o que se soma. Somar `R$ 69,90` a partir de uma cadeia é a conta que dá 69,90000000000001
   * — e a mensalidade mostra-se com dois décimos. */
  const planos = ((catalogo && catalogo.assinaturas) || []).map((p) =>
    '<option value="' + esc(p.id) + '" data-preco="' + esc(p.precoTexto || '') + '"'
    + ' data-centavos="' + Math.round(Number(p.preco) * 100) + '"'
    /* A CAPACIDADE INCLUÍDA VAI EM NÚMERO, e não só em texto (16/11/2026): é ela que o aviso da
     * perda soma aos lotes para saber quantos cabem. O `data-inclui` diz o mesmo em palavras, para
     * a linha do valor; uma segunda conta da capacidade no cliente divergiria da do servidor. */
    + ' data-professores="' + (Number(p.professores) || 0) + '"'
    + ' data-alunos="' + (Number(p.alunos) || 0) + '"'
    /* O QUE O DEGRAU JÁ INCLUI, ao lado do nome: «+20 aulas» não diz vinte a mais do que quê, e a
     * pergunta é a primeira que quem contrata faz. A 17/11/2026 passou a ser a FRANQUIA — «inclui
     * 300 aulas» —, e não professores e alunas: são eles que já não são a unidade.
     *
     * `data-professores`/`data-alunos` FICAM, e é de propósito: não se mostram a ninguém, e são o
     * que a confirmação de perda de dados compara com o retrato da escola (quantos documentos dela
     * cabem no degrau novo). Sem eles a pergunta «vão perder-se 12 professores, confirma?» deixava
     * de ser feita — e ela pediu-a por palavras próprias. */
    + ' data-inclui="' + esc('inclui ' + (Number(p.aulas) || 0) + ' aulas por mês') + '">'
    + esc(p.nome) + ' — ' + esc(p.precoTexto || '') + '</option>').join('');
  const moeda = String((catalogo && catalogo.moeda_simbolo) || 'R$');
  const emReais = (v) => moeda + ' ' + (Math.round(Number(v) * 100) / 100).toFixed(2).replace('.', ',');

  /* AS «EXTENSÕES» DO PLANO SÃO A CAPACIDADE (16/11/2026), e a correção é de vocabulário antes de
   * ser de código: «se vão ser mais três professores ou mais cinco professores e cada um tem um
   * preço, se são mais 10 alunos ou mais 30 alunos». É a tabela `lotes` do catálogo — a mesma que a
   * criação pelo formulário público já oferece —, e é ela que muda o valor da mensalidade. O que
   * aqui esteve eram as extensões «Turma pronta — configuração / conteúdo», que são outra coisa
   * (o que se entrega na arranque), que ninguém pediu e que não são desta conversa.
   *
   * OS LOTES SÃO RENDERIZADOS NO SERVIDOR, e não montados pelo script: são dado do catálogo, e o
   * que a página faz com eles é somar o preço que vem escrito em cada linha. */
  /* OS PACOTES DE AULAS, E NÃO OS LOTES DE GENTE (17/11/2026). Esta página é por onde nasce uma
   * escola nova — «só me garante que tá funcionando no motor que a gente cria uma escola nova e faz
   * funcionar» —, e o que ela oferecia era o eixo antigo: mais três professores, mais trinta
   * alunas. Uma escola criada por aqui nascia a comprar um eixo que já não existe, e o contrato
   * saía com lotes que a página do painel já não sabia mostrar.
   *
   * O QUE ENTRA: os pacotes do catálogo (`pacotesDeAulas`), com as aulas e o preço de cada um. */
  const linhasDePacote = ((catalogo && Array.isArray(catalogo.pacotesDeAulas))
    ? catalogo.pacotesDeAulas : [])
    .map((pk) => '<label class="escolha">'
      + '<input type="checkbox" data-pacote data-pacote-id="' + esc(pk.id) + '"'
      + ' data-aulas="' + pk.aulas + '"'
      + ' data-centavos="' + Math.round(Number(pk.preco) * 100) + '">'
      + '<span>+' + pk.aulas + ' aulas — ' + emReais(pk.preco) + '/mês</span>'
      + '</label>').join('');
  const temLotes = Boolean(linhasDePacote);
  const temPix = Boolean(pix && pix.chave);
  /* SÓ HÁ PERGUNTA A FAZER SE HOUVER O QUE PERDER: um convite a uma escola sem documentos não
   * mostra caixa nenhuma — a mesma regra que a rota aplica para não recusar. */
  const temRetrato = Boolean(retrato && Number(retrato.documentos) > 0);

  const corpo = estado && estado.ok === false
    ? '<div class="caixa falta"><h2>Este convite não está válido</h2>' +
      '<p>' + esc(estado.motivo) + '</p></div>'
    /* A PROMESSA SÓ SE FAZ QUANDO É VERDADE (23/11/2026). A frase «os dados de identificação dela
     * ficaram guardados» esteve aqui desde 16/11 — e era FALSA: o expurgo apagava o cadastro, e
     * nada o restituía na recriação. Duas correcções depois, é verdade para toda a escola expurgada
     * a partir de hoje; para as anteriores não há dados nenhuns para guardar, e a página diz isso em
     * vez de prometer o que não tem. */
    : '<div class="caixa nota">' +
      '<h2>A escola «' + esc(nomeDaEscola) + '»</h2>' +
      (identidade
        ? '<p>Os dados de identificação dela — ' +
          (identidade.cnpj ? 'o nome, o CNPJ e os contactos' : 'o nome e os contactos') +
          ' — ficaram guardados, e voltam com a escola.' +
          (identidade.cnpj ? '' : ' O CNPJ não está entre eles: a escola não o tinha declarado.') +
          ' Falta o cadastro do acesso e o pagamento: escolha o plano, crie as senhas, e pague por ' +
          'Pix.</p>'
        : '<p>Não há dados de identificação desta escola guardados: o expurgo dela é anterior a ' +
          '23/11/2026, e nessa altura o cadastro ia com ele. Falta o cadastro do acesso e o ' +
          'pagamento: escolha o plano, crie as senhas, e pague por Pix. Se precisar dos dados ' +
          'fiscais, eles têm de ser recolhidos de novo.</p>') +
      '<p><strong>São senhas novas.</strong> A senha antiga não é necessária — e não é pedida. ' +
      'Se ninguém se lembra dela, é esta que passa a valer.</p>' +
      '</div>' +

      '<h2>1. O plano</h2>' +
      '<label class="campo-rotulo" for="convite-plano">plano da escola</label>' +
      '<select id="convite-plano">' + planos + '</select>' +
      '<p class="nota" id="convite-valor"></p>' +
      (temLotes
        ? '<fieldset class="escolhas" id="convite-capacidade" data-moeda="' + esc(moeda) + '">' +
          '<legend>Pacotes de aulas (na mensalidade)</legend>' +
          linhasDePacote + '</fieldset>'
        : '') +

      /* A PERDA, PERGUNTADA (16/11/2026). «Avisa que dados serão perdidos e pergunta se quer mesmo
       * esse; sim, então restaura com a capacidade do que está sendo contratado; não, então a
       * pessoa escolhe outro plano.»
       *
       * A CONTAGEM VAI NO `data-retrato` e é do SERVIDOR — lida do convite, no instante em que ele
       * foi emitido. O script só compara: capacidade do plano contra o que a escola tinha. Uma
       * contagem feita aqui diria outro número, e a pessoa responderia a uma pergunta que não é a
       * que o servidor vai fazer.
       *
       * É `hidden` porque a maioria das recriações não perde nada: a pergunta só existe quando há
       * o que perder. */
      (temRetrato
        ? '<div class="caixa falta" id="convite-perda" data-retrato="' + esc(JSON.stringify(retrato))
          + '" hidden>' +
          '<h2>Este plano não cobre o que a escola tinha</h2>' +
          '<p id="convite-perda-texto"></p>' +
          '<p><strong>A escolha do que fica é pela ordem do tempo</strong>: ficam os registos mais ' +
          'recentes. Os mais antigos não voltam.</p>' +
          '<p class="par-botoes">' +
          '<button class="acao" type="button" id="convite-perda-sim">Sim, quero este plano</button>' +
          '<button class="acao secundario" type="button" id="convite-perda-nao">' +
          'Não, vou escolher outro</button>' +
          '</p></div>'
        : '') +

      '<h2>2. As senhas</h2>' +
      '<label class="campo-rotulo" for="convite-senha-escola">senha da escola (a direção)</label>' +
      '<input id="convite-senha-escola" type="password" autocomplete="new-password">' +
      '<label class="campo-rotulo" for="convite-senha-professor">senha do professor ' +
      '(em branco = a mesma da escola)</label>' +
      '<input id="convite-senha-professor" type="password" autocomplete="new-password">' +

      '<h2>3. O pagamento, por Pix</h2>' +
      (temPix
        ? '<p id="convite-pix-instrucoes">Pague por Pix para <strong>'
          + esc(pix.titular || 'o Sistema Lastro') + '</strong>.</p>' +
          '<label class="campo-rotulo" for="convite-pix-chave">Chave Pix (copia e cola)</label>' +
          '<input id="convite-pix-chave" readonly value="' + esc(pix.chave) + '">'
        : '<p class="aviso">A chave Pix ainda não está configurada neste sistema. Não faça ' +
          'nenhum pagamento antes de falar com a administração do Sistema Lastro.</p>') +
      '<p class="aviso"><strong>Ao fazer o Pix, escreva o nome da escola</strong> — «'
        + esc(nomeDaEscola) + '» — na descrição (ou no campo de mensagem) da transferência. ' +
        'A conciliação é feita à mão, e é por esse nome que o pagamento é ligado à escola certa.</p>' +
      '<p class="aviso"><b>Como funciona.</b> O pagamento vai direto para a conta do Sistema ' +
      'Lastro, e a conciliação é feita à mão. Assim que ela for confirmada — <b>em até 24 horas</b> ' +
      '—, o acesso é liberado, e a escola volta a aparecer para o professor no endereço de sempre.' +
      '</p>' +

      '<p class="res" id="convite-recado" role="status"></p>' +
      '<p class="par-botoes"><button class="acao grande" type="button" id="convite-enviar">' +
      'Criar o acesso</button></p>';

  return '<!doctype html><html lang="pt-BR" data-paleta="verde">' +
    '<head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex">' +
    '<title>Recriar a escola «' + esc(nomeDaEscola) + '» · Sistema Lastro</title>' +
    '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">' +
    '<link rel="stylesheet" href="/assets/style.css">' +
    '</head><body id="top" data-layout="documento" data-tela="convite">' +
    '<header class="doc"><h1>Recriar a escola «' + esc(nomeDaEscola) + '»</h1>' +
    '<p class="subtitulo">Escolher o plano, criar as senhas e pagar por Pix.</p></header>' +
    '<main><div class="conteudo">' + corpo + '</div></main>' +
    (estado && estado.ok === false ? '' : SCRIPT_DO_CONVITE.replace(/__TOKEN__/g, esc(token || ''))) +
    '</body></html>';
}

/**
 * O JAVASCRIPT DA PÁGINA DO CONVITE — o plano, os dois campos, e o pedido.
 *
 * O VALOR É LIDO DO `data-preco` DA OPÇÃO, e não calculado aqui: a conta é do servidor (o mesmo
 * `comercial.calcular` que a criação usa), e a página limita-se a mostrar o preço que o catálogo
 * traz. Um total calculado no browser seria uma segunda conta a divergir da que cobra.
 *
 * O TOKEN VAI NA URL DO PEDIDO, e não no corpo: é ele que identifica o convite, e a rota pública
 * confere-o antes de olhar para o resto. O `__TOKEN__` é substituído no servidor.
 */
const SCRIPT_DO_CONVITE = '<script>(function(){' +
  'var plano=document.getElementById("convite-plano"),valor=document.getElementById("convite-valor"),' +
  'se=document.getElementById("convite-senha-escola"),sp=document.getElementById("convite-senha-professor"),' +
  'recado=document.getElementById("convite-recado"),enviar=document.getElementById("convite-enviar"),' +
  /* O ID `convite-capacidade` FICA, e o nome é o único que não mudou: o que ele carrega agora são os
   * pacotes de aulas. Renomeá-lo obrigaria a mexer nos dois lados sem ganho — e o `data-moeda` que
   * dele se lê continua a ser o símbolo do catálogo.
   */
  'lotes=document.getElementById("convite-capacidade");' +
  'if(!plano||!enviar)return;' +
  'var moeda=(lotes&&lotes.getAttribute("data-moeda"))||"R$";' +
  'var perda=document.getElementById("convite-perda");' +
  'var retrato=null;try{retrato=JSON.parse((perda&&perda.getAttribute("data-retrato"))||"null");}catch(e){retrato=null;}' +
  /* A PERDA CONFIRMADA, E SÓ DELA SE MANDA O PEDIDO (16/11/2026). `perdeu` nasce falso a cada troca
   * de plano: uma confirmação dada para um plano não vale para o seguinte — quem aceitou perder
   * 30 alunas no Básico não aceitou o mesmo no Intermediário sem voltar a ser perguntado. */
  'var perdeu=false;' +
  /* A CAPACIDADE CONTRATADA, para a pergunta de perda de dados (17/11/2026). Ela é SÓ o que o plano
   * inclui: os pacotes de aulas não acrescentam professores nem alunas, logo não mudam esta conta.
   *
   * A pergunta que ela serve continua a fazer sentido — «vão perder-se 12 professores, confirma?» —,
   * e o número que a responde é o do degrau, não o de um lote. O que saiu foi a soma dos lotes
   * marcados, que já não são marcáveis. */
  'function capacidade(){' +
  '  var o=plano.options[plano.selectedIndex];' +
  '  return {professores:Number((o&&o.getAttribute("data-professores"))||0),' +
  '    alunos:Number((o&&o.getAttribute("data-alunos"))||0)};}' +
  'function quantos(lista){return Array.isArray(lista)?lista.length:0;}' +
  'function oQueSePerde(){' +
  '  if(!retrato)return null;' +
  '  var c=capacidade();' +
  '  var saemP=Math.max(0,quantos(retrato.professores)-c.professores);' +
  '  var saemA=Math.max(0,quantos(retrato.alunos)-c.alunos);' +
  '  if(!saemP&&!saemA)return null;' +
  '  return {professores:saemP,alunos:saemA,capacidade:c};}' +
  'function esconderPerda(){if(perda)perda.hidden=true;}' +
  'function mostrarPerda(){' +
  '  if(!perda)return false;' +
  '  var q=oQueSePerde();if(!q){esconderPerda();return false;}' +
  '  var partes=[];' +
  '  if(q.professores)partes.push(q.professores+(q.professores===1?" professor":" professores"));' +
  '  if(q.alunos)partes.push(q.alunos+(q.alunos===1?" aluna":" alunas"));' +
  '  var txt=document.getElementById("convite-perda-texto");' +
  '  if(txt)txt.textContent="Este plano inclui "+q.capacidade.professores' +
  '    +(q.capacidade.professores===1?" professor":" professores")+" e "+q.capacidade.alunos' +
  '    +(q.capacidade.alunos===1?" aluna":" alunas")+". O retrato desta escola tem "' +
  '    +quantos(retrato.professores)+(quantos(retrato.professores)===1?" professor":" professores")' +
  '    +" e "+quantos(retrato.alunos)+(quantos(retrato.alunos)===1?" aluna":" alunas")' +
  '    +": vão perder-se "+partes.join(" e ")+".";' +
  '  perda.hidden=false;' +
  '  return true;}' +
  'function esquecerPerda(){perdeu=false;esconderPerda();}' +
  'if(perda){' +
  /* «SIM» AUTORIZA, e deixa recado: a confirmação não desaparece sem rasto — quem carregou no «sim»
   * tem de poder ver que foi entendida. */
  '  var sim=document.getElementById("convite-perda-sim");' +
  '  if(sim)sim.addEventListener("click",function(){perdeu=true;' +
  '    dizer("Confirmado: este plano fica com os registos mais recentes, e os mais antigos não " +' +
  '      "voltam.",false);esconderPerda();});' +
  /* «NÃO» NÃO ENVIA NADA — volta à escolha do plano, que é o que ela pediu: «a pessoa escolhe
   * outro plano». Leva o foco ao seletor e diz o que fazer. */
  '  var nao=document.getElementById("convite-perda-nao");' +
  '  if(nao)nao.addEventListener("click",function(){perdeu=false;esconderPerda();' +
  '    dizer("Escolha outro plano, ou mais adicionais, e eu volto a conferir.",false);' +
  '    if(plano)plano.focus();});}' +
  'function dizer(t,erro){if(!recado)return;recado.textContent=t||"";recado.className="res"+(erro?" erro":"");}' +
  'function reais(c){return moeda+" "+(Math.round(c)/100).toFixed(2).replace(".",",");}' +
  /* A ESCOLHA DOS LOTES — as caixas que o SERVIDOR renderizou (16/11/2026). A página não sabe
   * quais são: lê as que estão. Cada uma diz o eixo, a quantidade e o preço em cêntimos, e é isso
   * que a soma usa. */
  /* AS CAIXAS SÃO AS DOS PACOTES DE AULAS (17/11/2026) — `[data-pacote]`, com o id do catálogo.
   * A função devolve os IDS marcados, que é o que o servidor espera (`comercial.calcular({pacotes})`):
   * a quantidade de aulas de cada pacote está no catálogo, e mandá-la daqui seria um segundo sítio
   * onde ela pode divergir. */
  'function caixas(){return document.querySelectorAll("[data-pacote]");}' +
  'function doPacotes(){var r=[],todas=caixas();' +
  'for(var i=0;i<todas.length;i++){if(todas[i].checked)r.push(todas[i].getAttribute("data-pacote-id"));}' +
  'return r;}' +
  /* O TOTAL É UMA PRÉVIA, e não a conta que cobra: a que cobra é a do servidor (`comercial.calcular`,
   * a mesma da criação). Aqui soma-se o que está escrito nas linhas do catálogo só para a pessoa ver
   * de onde vem o valor antes de pagar — e um total que não se explica é o que a faz desistir no Pix. */
  'function conta(){' +
  '  var o=plano.options[plano.selectedIndex];if(!o)return null;' +
  '  var base=Number(o.getAttribute("data-centavos")||0),partes=[],extra=0,todas=caixas();' +
  '  for(var i=0;i<todas.length;i++){var c=todas[i];if(!c.checked)continue;' +
  '    var v=Number(c.getAttribute("data-centavos")||0);extra+=v;' +
  '    partes.push("+"+c.getAttribute("data-aulas")+" aulas ("+reais(v)+")");}' +
  '  var inclui=o.getAttribute("data-inclui")||"";' +
  '  return {total:reais(base+extra),' +
  '    texto:o.textContent.split(" — ")[0]+": "+reais(base)+(inclui?" ("+inclui+")":"")' +
  '      +(partes.length?" · "+partes.join(" · "):"")' +
  '      +"  →  "+reais(base+extra)+" por mês"};}' +
  'function mostrarValor(){if(!valor)return;var c=conta();' +
  'valor.textContent=c?("Primeira mensalidade — "+c.texto):"";}' +
  'plano.addEventListener("change",function(){mostrarValor();esquecerPerda();});' +
  'for(var i=0;i<caixas().length;i++)caixas()[i].addEventListener("change",function(){' +
  '  mostrarValor();esquecerPerda();});' +
  'mostrarValor();' +
  'enviar.addEventListener("click",function(){' +
  'if(!se||!se.value){dizer("escreva a senha da escola",true);if(se)se.focus();return;}' +
  /* A PERGUNTA VEM ANTES DO PEDIDO, e não como recusa depois: quem não respondeu vê a caixa, e o
   * formulário não sai. O servidor recusa na mesma (409) — esta é a cortesia, aquela é a regra. */
  'if(!perdeu&&mostrarPerda()){dizer("confirme em baixo se aceita perder os registos mais antigos",true);return;}' +
  'dizer("a criar o acesso…");enviar.disabled=true;' +
  /* O PEDIDO VAI PARA A RAIZ DO SÍTIO, e não para o lado da página (16/11/2026). Aqui esteve
   * `fetch("api/recriar/…")`, relativo: dentro de `/recriar/<token>` isso resolve para
   * `/recriar/api/recriar/<token>` — 404, e a página dizia «não foi possível concluir o cadastro»
   * sobre um pedido que nunca chegou à rota. Um caminho que começa e termina no mesmo sítio não se
   * escreve pela metade. */
  'fetch("/api/recriar/__TOKEN__",{method:"POST",headers:{"Content-Type":"application/json"},' +
  'body:JSON.stringify({plano:plano.value,pacotes:doPacotes(),' +
  'lotesProfessores:[],lotesAlunos:[],senhaAdmin:se.value,senhaProfessor:sp?sp.value:"",' +
  'perderDados:perdeu===true})})' +
  '.then(function(r){return r.json().catch(function(){return {};});})' +
  '.then(function(d){' +
  'if(d&&d.ok){' +
  'dizer("Pronto. A escola «"+(d.nome||d.escola)+"» está a ser criada, e o acesso abre quando a ' +
  'conciliação do Pix for confirmada (até 24 horas). Guarde esta página: o endereço da escola é " + ' +
  '(d.url||"o mesmo de sempre")+".");' +
  'enviar.disabled=true;' +
  'if(se)se.value="";if(sp)sp.value="";return;}' +
  'enviar.disabled=false;dizer((d&&d.erro)||"não foi possível concluir o cadastro",true);})' +
  '.catch(function(){enviar.disabled=false;dizer("falha de rede — nada foi alterado",true);});});' +
  '})();</script>';

/**
 * A CONFIRMAÇÃO DO CONVITE — e o que ela NÃO pergunta mais (16/11/2026).
 *
 * «Esse modal que você abre para mim, ele vai virar uma página.» A versão anterior deste modal pedia
 * o plano e as duas senhas AQUI, no painel. Isso obrigava a proprietária a recolher a senha do
 * professor por telefone e a digitá-la por ele — e uma senha que passa por uma terceira pessoa
 * deixou de ser um segredo no instante em que foi dita.
 *
 * O modal passou a ser o que ele deve ser: uma CONFIRMAÇÃO do envio. Diz para quem vai o e-mail (os
 * contactos do cadastro), o que a escola vai fazer lá, e o prazo do link. O plano, as senhas e o Pix
 * vivem na página do convite, do outro lado do link, na mão de quem paga.
 *
 * SEM E-MAIL NO CADASTRO, O LINK AINDA APARECE — e é copiável. A recriação não pode depender de um
 * campo que o cadastro pode não ter (o expurgo leva o KV de uma escola de Worker próprio): ela
 * manda-o por WhatsApp, e a escola faz o mesmo.
 */
function modalDoConvite() {
  return '<div class="modal" id="recriar-modal" hidden>' +
    '<div class="modal-fundo" data-recriar-fechar></div>' +
    '<div class="modal-caixa" role="dialog" aria-modal="true" aria-labelledby="recriar-titulo">' +
    '<div class="modal-cab"><h2 id="recriar-titulo">Convidar a escola a voltar</h2>' +
    '<button class="modal-x" type="button" data-recriar-fechar aria-label="Fechar">&times;</button></div>' +
    '<p>Vou mandar um e-mail à escola e ao professor com um link. Lá <strong>ele</strong> escolhe o ' +
    'plano, cria as senhas e copia a chave Pix para pagar — a senha antiga não é necessária.</p>' +
    '<p class="nota" id="recriar-destinos"></p>' +
    '<p class="res" id="recriar-recado" role="status"></p>' +
    '<div class="modal-acoes">' +
    '<button class="acao" type="button" id="recriar-confirmar">Enviar o convite</button>' +
    '<button class="acao secundario" type="button" data-recriar-fechar>Fechar</button>' +
    '</div></div></div>';
}

/**
 * O JAVASCRIPT DO CONVITE — o clique, o pedido, e o que se diz a seguir.
 *
 * A LISTA NÃO SE RECARREGA: o convite não muda a lista — a escola só muda de lado quando o
 * professor submeter a página. Recarregar aqui faria a linha desaparecer sem nada ter acontecido, e
 * ela concluiria que a escola foi recriada.
 *
 * O LINK VOLTA NA RESPOSTA e é mostrado quando o e-mail não saiu — é o que permite mandá-lo à mão.
 * Quando o e-mail saiu, o link fica na resposta do servidor e não se despeja na tela: quem tem o
 * e-mail tem o convite.
 */
const SCRIPT_DO_CONVITE_DO_PAINEL = '<script>(function(){' +
  'var modal=document.getElementById("recriar-modal");if(!modal)return;' +
  'var destinos=document.getElementById("recriar-destinos"),recado=document.getElementById("recriar-recado"),' +
  'confirmar=document.getElementById("recriar-confirmar"),alvo=null;' +
  'function dizer(t,erro){if(!recado)return;recado.textContent=t||"";recado.className="res"+(erro?" erro":"");}' +
  'function abrir(slug){alvo=slug;dizer("");if(destinos)destinos.textContent="";' +
  'modal.hidden=false;if(confirmar){confirmar.disabled=false;confirmar.textContent="Enviar o convite";}}' +
  'function fechar(){modal.hidden=true;alvo=null;}' +
  'Array.prototype.forEach.call(document.querySelectorAll("[data-recriar]"),function(b){' +
  'b.addEventListener("click",function(){abrir(b.getAttribute("data-recriar"));});});' +
  'Array.prototype.forEach.call(modal.querySelectorAll("[data-recriar-fechar]"),function(b){' +
  'b.addEventListener("click",fechar);});' +
  'document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!modal.hidden)fechar();});' +
  'confirmar.addEventListener("click",function(){' +
  'if(!alvo)return;' +
  'dizer("a enviar o convite…");confirmar.disabled=true;' +
  'fetch("api/recriar-convite",{method:"POST",headers:{"Content-Type":"application/json"},' +
  'body:JSON.stringify({escola:alvo})})' +
  '.then(function(r){return r.json().catch(function(){return {};});})' +
  '.then(function(d){confirmar.disabled=false;' +
  'if(!d||!d.ok){dizer((d&&d.erro)||"não foi possível enviar o convite",true);return;}' +
  'var para=(d.para||[]).join(", ");' +
  'var saiu=(d.correio&&d.correio.enviado);' +
  'var detalhe=(d.correio&&(d.correio.detalhe||d.correio.motivo))||"";' +
  'if(saiu){dizer("Convite enviado para "+para+". Vale até "+d.expiraEmTexto+".");}' +
  'else{dizer("O e-mail NÃO saiu ("+detalhe+"). Mande este link à escola: "+d.link,true);}' +
  'if(destinos)destinos.textContent="Escola: "+(d.nome||alvo)+" · contactos: "+(para||"nenhum no cadastro");' +
  'confirmar.textContent="Enviar outra vez";})' +
  '.catch(function(){confirmar.disabled=false;dizer("falha de rede — nada foi enviado",true);});});' +
  '})();</script>';

/** O atalho que as rotas usam — e que a prova exercita sem passar pelo Worker. */
function paginaDasApagadas({ escolas, ordem, professores, catalogo }) {
  return paginaDeLista({ recorte: 'apagadas', escolas, ordem, professores, catalogo });
}

/**
 * O JAVASCRIPT DO COFRE — o que pede a chave ao Worker e a mostra.
 *
 * A CHAVE VIAJA NO CORPO DA RESPOSTA, e não no endereço: um `GET /api/cofre?senha=…` deixaria a
 * senha no histórico do navegador e nos logs. A resposta diz `no-store` (ver `raiz.js`), e o campo
 * é `readonly` — não é para editar, é para ler e copiar.
 *
 * A SENHA NÃO FICA GUARDADA. Some do campo quando o painel fecha, e não vai para `localStorage`:
 * o painel da raiz já está atrás de uma autenticação básica, e a segunda pergunta existe para o
 * caso de a sessão ficar aberta num ecrã partilhado.
 */
const SCRIPT_DO_COFRE = '<script>(function(){' +
  'var abrir=document.getElementById("cofre-abrir"),painel=document.getElementById("cofre-painel"),' +
  'senha=document.getElementById("cofre-senha"),recado=document.getElementById("cofre-recado"),' +
  'saida=document.getElementById("cofre-saida"),chave=document.getElementById("cofre-chave"),' +
  'confirmar=document.getElementById("cofre-confirmar"),fechar=document.getElementById("cofre-fechar"),' +
  'copiar=document.getElementById("cofre-copiar");' +
  'if(!abrir||!painel)return;' +
  'function dizer(t,erro){if(!recado)return;recado.textContent=t||"";recado.className=erro?"erro":"";}' +
  'abrir.addEventListener("click",function(){painel.hidden=false;if(senha)senha.focus();});' +
  'fechar.addEventListener("click",function(){painel.hidden=true;if(saida)saida.hidden=true;' +
  'if(senha)senha.value="";if(chave)chave.value="";dizer("");});' +
  'confirmar.addEventListener("click",function(){' +
  'var s=senha?senha.value:"";if(!s){dizer("escreva a senha da raiz",true);return;}' +
  'dizer("a abrir…");confirmar.disabled=true;' +
  'fetch("/api/cofre",{method:"POST",headers:{"Content-Type":"application/json"},' +
  'body:JSON.stringify({senha:s}),cache:"no-store"})' +
  '.then(function(r){return r.json().catch(function(){return {};});})' +
  '.then(function(d){confirmar.disabled=false;' +
  'if(d&&d.ok&&d.chave){chave.value=d.chave;saida.hidden=false;dizer("");}' +
  'else{dizer((d&&d.erro)||"não foi possível abrir",true);}})' +
  '.catch(function(){confirmar.disabled=false;dizer("falha de rede",true);});});' +
  'if(copiar)copiar.addEventListener("click",function(){if(!chave)return;' +
  'chave.select();try{document.execCommand("copy");dizer("copiada");}catch(e){dizer("selecione e copie",true);}});' +
  '})();</script>';

/**
 * O JAVASCRIPT DA HABILITAÇÃO — os dois botões da linha (25/11/2026).
 *
 * PORQUE É QUE ELE RECARREGA A PÁGINA em vez de mudar a linha à mão. A linha tem três coisas que
 * dependem do estado — o selo, o plano e qual dos dois botões está ligado —, e repô-las por
 * JavaScript seria uma SEGUNDA cópia da regra que a constrói no servidor. A primeira correcção
 * (um estado novo, um selo novo) deixaria as duas a divergir, e o sintoma seria uma lista a dizer
 * «ativa» sobre uma escola suspensa.
 *
 * O CUSTO É UMA LEITURA DO ÍNDICE, e é o preço certo para um clique que acontece poucas vezes por
 * mês. O que NÃO se faz é recarregar sem dizer nada: o botão fica desligado enquanto o pedido
 * corre, e a linha diz o que está a acontecer.
 */
const SCRIPT_DO_ACESSO = '<script>(function(){' +
  'var botoes=document.querySelectorAll("[data-comercial]");' +
  /* SEM SAÍDA ANTECIPADA (25/11/2026). Aqui esteve `if(!botoes.length)return;`, e ele deixou de ser
   * seguro no dia em que este script passou a ligar DUAS famílias de botões: uma lista sem botões de
   * acesso mas com o «Entregar à escola» sairia do script antes de os ligar, e o botão ficaria
   * inerte sem nada dizer. O laço abaixo já trata uma lista vazia — a saída só servia para o caso que
   * agora existe. */
  /* O RECADO, SEM SOMBRA. Aqui esteve `function recado(t,erro){ … var t=document.querySelector(…) }`
   * — e o `var t` de dentro apagava o parâmetro: a mensagem que se lia era o `toString` de um
   * `<table>`. Um nome que já significa uma coisa não pode significar outra três linhas abaixo. */
  'function recado(texto,erro){' +
  '  var cx=document.getElementById("acesso-recado");' +
  '  if(!cx){cx=document.createElement("p");cx.id="acesso-recado";cx.className="aviso";' +
  '    var tabela=document.querySelector("table");' +
  '    if(tabela&&tabela.parentNode)tabela.parentNode.insertBefore(cx,tabela.nextSibling);' +
  '    else document.body.appendChild(cx);}' +
  '  cx.textContent=texto||"";cx.className=erro?"aviso alerta":"aviso";}' +
  /* OS BOTÕES DA MESMA LINHA, SEM SELETOR DE ATRIBUTO — e o motivo é o defeito que esteve aqui.
   *
   * A versão anterior montava `querySelectorAll("[data-escola=\"" + escola + "\"]")` dentro de uma
   * string JS escrita entre plicas: o `\"` produz uma aspa LITERAL, que fecha o seletor a meio, e o
   * resultado publicado foi `querySelectorAll("[data-escola=""+escola+""]")`. Isso não é um seletor
   * inválido — é um ERRO DE SINTAXE, e um erro de sintaxe num `<script>` não estraga a linha que o
   * usa: estraga o ficheiro inteiro. **O botão «Habilitar» não fazia nada porque nunca teve
   * `addEventListener` nenhum**, e a página não dizia porquê.
   *
   * Um seletor construído por concatenação é uma string a atravessar três linguagens (JS, HTML, CSS)
   * e a ser escapada em duas. Filtrar por `getAttribute` não atravessa nenhuma. */
  'function daLinha(escola){' +
  '  var todos=document.querySelectorAll("[data-escola]"),achados=[];' +
  '  for(var i=0;i<todos.length;i++){' +
  '    if(todos[i].getAttribute("data-escola")===escola)achados.push(todos[i]);}' +
  '  return achados;}' +
  'function ligar(irmaos,estado){for(var k=0;k<irmaos.length;k++)irmaos[k].disabled=estado;}' +
  'for(var i=0;i<botoes.length;i++)(function(b){' +
  '  b.addEventListener("click",function(){' +
  '    var escola=b.getAttribute("data-escola"),estado=b.getAttribute("data-comercial");' +
  '    if(!escola||!estado)return;' +
  '    var irmaos=daLinha(escola);' +
  '    ligar(irmaos,true);' +
  '    recado((estado==="ativa"?"a habilitar ":"a desabilitar ")+escola+"…",false);' +
  '    fetch("/api/escola/comercial",{method:"POST",headers:{"Content-Type":"application/json"},' +
  '      body:JSON.stringify({escola:escola,estado:estado}),cache:"no-store"})' +
  '    .then(function(r){return r.json().catch(function(){return {};});})' +
  '    .then(function(d){' +
  '      if(d&&d.ok){location.reload();return;}' +
  '      ligar(irmaos,false);' +
  '      recado((d&&d.erro)||"não foi possível mudar o acesso",true);})' +
  '    .catch(function(){ligar(irmaos,false);' +
  '      recado("falha de rede — nada foi alterado",true);});' +
  '  });' +
  '})(botoes[i]);' +
  /* A ENTREGA E A PRORROGAÇÃO DA CONSULTORIA (25/11/2026) — o mesmo desenho do `[data-comercial]`,
   * e pela mesma razão: filtrar por `getAttribute` e nunca por um selector construído, que é uma
   * string a atravessar três linguagens. A recusa aparece no mesmo `recado`, ao lado da tabela: um
   * ecrã de dinheiro com dois sítios de mensagem é um ecrã onde uma delas se perde. */
  '(function(){' +
  '  var daCota=document.querySelectorAll("[data-consultoria]");' +
  '  if(!daCota.length)return;' +
  '  for(var m=0;m<daCota.length;m++)(function(b){' +
  '    b.addEventListener("click",function(){' +
  '      var escola=b.getAttribute("data-escola"),acao=b.getAttribute("data-consultoria");' +
  '      if(!escola||!acao)return;' +
  '      var irmaos=daLinha(escola);' +
  '      ligar(irmaos,true);' +
  '      recado((acao==="entregar"?"a entregar ":"a prorrogar ")+escola+"…",false);' +
  '      fetch("/api/escola/consultoria",{method:"POST",headers:{"Content-Type":"application/json"},' +
  '        body:JSON.stringify({escola:escola,acao:acao}),cache:"no-store"})' +
  '      .then(function(r){return r.json().catch(function(){return {};});})' +
  '      .then(function(d){' +
  '        if(d&&d.ok){location.reload();return;}' +
  '        ligar(irmaos,false);' +
  '        recado((d&&d.erro)||"não foi possível mudar o período",true);})' +
  '      .catch(function(){ligar(irmaos,false);' +
  '        recado("falha de rede — nada foi alterado",true);});' +
  '    });' +
  '  })(daCota[m]);' +
  '})();' +
  '})();</script>';

function paginaDasVivas({ escolas, ordem, professores }) {
  return paginaDeLista({ recorte: 'vivas', escolas, ordem, professores });
}

/**
 * O COFRE — a chave mestra, atrás da senha da raiz (15/11/2026).
 *
 * O QUE ELA PEDIU, na letra: «na página que é minha, que é a página danca.padd.com.br, você vai criar
 * um espaço dentro de ver só as vivas que vai ter um botão cofre, que eu vou entrar pela minha senha
 * […] e vou poder ver a chave mestra». E o motivo é bom: a mestra é a chave de TODAS as escolas, e
 * sem um sítio onde se leia o valor dela não há como conferir que é a mesma que está nos Workers.
 *
 * PORQUE É QUE ISTO É UM BOTÃO E NÃO UM BLOCO NA PÁGINA. A chave não vai no HTML: só aparece depois
 * de um `POST` com a senha, e a resposta não é guardada nem em cache nem no histórico. Uma chave
 * escrita no HTML de uma lista seria uma chave entregue a quem abrisse a página — e a lista é a
 * página que ela abre mais vezes.
 *
 * O AVISO É PARTE DA PEÇA, e não decoração. Quem tem esta chave abre as anamneses de todas as
 * escolas. Quem a vê tem de saber isso no instante em que a vê — e o aviso diz também o que fazer
 * se ela escapar: trocá-la invalida o que está cifrado com as chaves antigas, e isso é uma decisão
 * com data, não um botão.
 */
function blocoDoCofre() {
  /* AS PEÇAS SÃO AS DA FOLHA, e a primeira versão desta função inventou duas (`cabecalho-lista`,
   * `corpo-lista`) que não existem — a checagem 8 reprovou, e tinha razão: um bloco da lista não
   * se desenha com `header`/`div` próprios, desenha-se com `details.bloco-lista` >
   * `summary.bloco-cabeca` > `div.bloco-corpo`, que é o que o resto das páginas usa.
   *
   * NASCER FECHADO É O COMPORTAMENTO CERTO: a lista das vivas é uma lista, e o cofre é uma porta
   * ao lado dela. Um bloco aberto a mostrar a chave de todas as escolas seria a primeira coisa que
   * se vê numa página que se abre muitas vezes. */
  return '<details class="bloco-lista" id="cofre">' +
    '<summary class="bloco-cabeca">' +
    '<span class="bloco-titulo">Cofre das escolas vivas — a chave mestra</span>' +
    '<span class="seta-do-ato" aria-hidden="true">\u25be</span>' +
    '</summary>' +
    '<div class="bloco-corpo">' +
    '<p>A chave de cada escola é <code>HMAC(chave mestra, &laquo;lastro/escola/&lt;escola&gt;&raquo;)</code>. ' +
    'Ela não está guardada em sítio nenhum: é calculada a partir desta, quando é precisa. ' +
    'Por isso, quem tem esta chave tem <strong>todas</strong> as escolas.</p>' +
    '<p class="acoes-do-ato"><button class="acao" id="cofre-abrir" type="button">Ver a chave mestra</button></p>' +
    '<div id="cofre-painel" hidden>' +
    '<label class="campo-rotulo" for="cofre-senha">senha da raiz</label>' +
    '<input id="cofre-senha" type="password" autocomplete="current-password">' +
    '<p class="acoes-do-ato">' +
    '<button class="acao" id="cofre-confirmar" type="button">Abrir</button>' +
    '<button class="acao secundario" id="cofre-fechar" type="button">Fechar</button>' +
    '</p>' +
    '<p id="cofre-recado" role="status"></p>' +
    '<div id="cofre-saida" hidden>' +
    '<label class="campo-rotulo" for="cofre-chave">chave mestra</label>' +
    '<input id="cofre-chave" type="text" readonly>' +
    '<p class="acoes-do-ato">' +
    '<button class="acao secundario" id="cofre-copiar" type="button">Copiar</button>' +
    '</p>' +
    '<p class="aviso"><strong>Isto abre todas as escolas.</strong> A chave de cada escola é ' +
    'derivada desta — quem a tiver lê as anamneses de todas. Trate-a como a chave do sistema, ' +
    'não como a de uma escola. Se ela escapar, trocá-la invalida tudo o que está cifrado com as ' +
    'chaves antigas: é uma decisão com data, e não um botão.</p></div>' +
    '</div></details>';
}

/**
 * A PÁGINA DOS PROFESSORES — a terceira lista, e a que atende a regra «um professor, várias
 * escolas».
 *
 * Ela lê `acervo.professores` (que o índice deriva das escolas e dos ciclos) e `acervo.escolas`
 * (para saber quais estão vivas). Uma requisição, a mesma do resto do painel.
 */
function paginaDosProfessores({ professores, escolas, ordem, contatos }) {
  return pagina({
    titulo: 'Professores',
    subtitulo: 'Quem trabalha hoje, o cadastro de cada um e as escolas vivas onde dá aula. Um ' +
      'professor pode estar em mais de uma.',
    atual: 'professores',
    corpo: tabelaDeProfessores(professores, escolas, ordem, contatos) +
      '<p><a class="acao secundario" href="/">Voltar ao painel</a></p>',
  });
}

/**
 * O NÚMERO QUE O `wa.me` ACEITA — em dígitos, com o país (18/11/2026).
 *
 * A PRIMEIRA VERSÃO TIRAVA UM «55» DO INÍCIO, e isso estragava um número verdadeiro: o DDD 55 é de
 * Santa Maria e da região, e `(55) 99999-0000` virava `55999990000` — um número que não existe.
 * A conta certa pergunta pelo COMPRIMENTO, não pelo prefixo: o número nacional brasileiro tem 10
 * ou 11 dígitos (DDD + 8 ou 9); o internacional tem 12 ou 13 e já começa por 55. Só o segundo
 * dispensa o prefixo.
 */
function numeroDoWhatsapp(telefone) {
  const digitos = String(telefone || '').replace(/\D/g, '');
  if (!digitos) return '';
  if ((digitos.length === 12 || digitos.length === 13) && digitos.indexOf('55') === 0) return digitos;
  return '55' + digitos;
}

/**
 * «COMO FALAR» — as DUAS formas de contactar alguém, e só duas (18/11/2026).
 *
 * Era uma função de dentro do Financeiro. Passou a ser do módulo a 23/11/2026, quando a página dos
 * Professores passou a mostrar o contacto: duas cópias da mesma célula divergiriam na primeira vez
 * que uma delas ganhasse uma terceira forma — e a terceira forma é sempre a que ninguém pediu.
 *
 * `mailto:` e `wa.me`, e não uma terceira. `—` é a ausência, nunca um número deduzido.
 */
function comoFalar(email, telefone) {
  return [email
    ? '<a href="mailto:' + esc(email) + '">' + esc(email) + '</a>' : '',
  telefone
    ? '<a href="https://wa.me/' + esc(numeroDoWhatsapp(telefone))
      + '" target="_blank" rel="noopener">' + esc(telefone) + '</a>' : ''
  ].filter(Boolean).join('<br>');
}

/** O traço quando não há dado — a ausência dita, e não um vazio que se lê como zero. */
function semDado(v) {
  return (v === null || v === undefined || String(v).trim() === '') ? '—' : esc(v);
}

/**
 * O DOCUMENTO DE UMA PESSOA — CPF ou CNPJ, e o rótulo é o que ele é (23/11/2026).
 *
 * Palavras dela: «O CNPJ ou CPF que o professor tenha, né, também vai estar lá. Professor pode ter
 * CNPJ ou CPF, tá? Não necessariamente só CPF.»
 *
 * POR ISSO A PERGUNTA É AO COMPRIMENTO, e não ao nome do campo: catorze dígitos são um CNPJ, onze
 * são um CPF, e o rótulo sai do número, não do sítio onde ele foi parar. Um `cpf` com catorze
 * dígitos — que é o que sai de um campo que aceita os dois — não é um CPF.
 *
 * A FORMATAÇÃO É DE LEITURA, e não de dado: o valor guardado são dígitos (é assim que a unicidade
 * os compara), e aqui põem-se os pontos e o traço porque é um número que alguém vai ler para o
 * escrever noutro sítio. Um número com forma inesperada lê-se como está — nunca se corrige.
 */
function documentoDoProfessor(contato) {
  const c = contato || {};
  const digitos = (v) => String(v || '').replace(/\D/g, '');
  const cnpj = digitos(c.cnpj);
  const cpf = digitos(c.cpf);
  const porDigitos = (d) => (d.length === 14 ? 'cnpj' : d.length === 11 ? 'cpf' : null);
  const bruto = cnpj || cpf || String(c.cnpj || c.cpf || '').trim();
  if (!bruto) return null;
  const tipo = porDigitos(cnpj) || porDigitos(cpf);
  if (tipo === 'cnpj') {
    return { tipo: 'CNPJ', valor: cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') };
  }
  if (tipo === 'cpf') {
    return { tipo: 'CPF', valor: cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') };
  }
  return { tipo: 'documento', valor: bruto };
}

/**
 * A PÁGINA DOS CONTACTOS — quem procurou o sistema, e o que queria (18/11/2026).
 *
 * O PEDIDO, na letra: «eu preciso ter um lugar lá no painel para poder acessar quem me procurou,
 * né? Quem quer falar comigo. E o que que a pessoa quer falar comigo e qual foi a mensagem.»
 *
 * A ORDEM É A DA CAIXA DE ENTRADA: o de agora primeiro. É a única ordem que responde à pergunta
 * que traz alguém a esta página — «chegou alguma coisa?» —, e o tecto da lista (duzentos) é o que
 * impede que um dia ela seja um arquivo.
 *
 * NENHUMA PEÇA NOVA: `table`, `selo`, `caixa`, `acao` — as da folha. A mensagem vai numa célula
 * própria, com `overflow-wrap`, porque uma mensagem longa sem espaços alargaria a tabela e
 * empurraria as outras colunas para fora do ecrã (o mesmo defeito que a faixa do ato já pagou).
 */
function paginaDosContatos({ contatos } = {}) {
  const lista = Array.isArray(contatos) ? contatos : [];
  const porLer = lista.filter((e) => e && !e.lido).length;

  /* CADA LINHA DIZ TRÊS COISAS, e a terceira é a que ela perguntou (18/11/2026):
   *
   *   «essa mensagem que está sendo enviada para falar comigo, esse contato aqui, chega a passar
   *   pelo e-mail ou não? É uma mensagem interna direta do servidor que chega para mim, nem gasta
   *   recursos do e-mail. É isso mesmo?»
   *
   * Não é: desde que o formulário passou a enviar sozinho, cada pedido gasta UM e-mail (Resend).
   * O registo na lista é interno e não gasta nada — mas o aviso sai pelo correio. Por isso a
   * coluna «Aviso» existe: ela mostra, pedido a pedido, se o e-mail saiu, se não saiu (e porquê no
   * `title`), ou se não se sabe. Sem ela, os dois casos ficavam iguais na tela.
   *
   * AS COLUNAS «NOME» E «ESCOLA» são o que faltava para se saber a quem se responde: «tem que
   * saber o nome da pessoa e o nome da escola». */
  const avisoDe = (e) => {
    if (!e || !e.aviso) return '<span class="selo discreto" title="pedido anterior ao envio automático">sem aviso</span>';
    if (e.aviso.enviado) return '<span class="selo ok">enviado</span>';
    return '<span class="selo alerta" title="' + esc(e.aviso.motivo || 'motivo não declarado') + '">não saiu</span>';
  };

  /* A LISTA DOS PEDIDOS É PAGINADA (19/11/2026) — e é a que mais precisava: o registo guarda os
   * ÚLTIMOS 200 pedidos, e 200 linhas numa tabela só não se leem. A peça é a da casa (`.paginas` +
   * «por página»), a mesma das escolas e dos professores.
   *
   * O `data-paginar` embrulha a TABELA — e o script acha as linhas pelo `tbody`, como já faz no
   * mês a mês do Financeiro. */
  const corpo = lista.length
    ? tabelaPaginada('pa-lista-contatos', '<table>' +
      '<thead><tr><th>Quando</th><th>Nome</th><th>Escola</th><th>Como falar</th><th>Mensagem</th>' +
      '<th>Aviso</th><th>Estado</th></tr></thead>' +
      '<tbody>' + lista.map((e) => {
        const quem = [
          e.email ? '<a href="mailto:' + esc(e.email) + '">' + esc(e.email) + '</a>' : '',
          e.telefone
            ? '<a href="https://wa.me/' + esc(numeroDoWhatsapp(e.telefone))
              + '" target="_blank" rel="noopener">' + esc(e.telefone) + '</a>'
            : '',
        ].filter(Boolean).join('<br>');
        return '<tr>' +
          '<td>' + esc(quando(e.quando) || diaOuTraco(e.quando)) + '</td>' +
          /* OS PEDIDOS ANTERIORES A 18/11/2026 NÃO TÊM NOME NEM ESCOLA — o formulário não os
           * pedia. `diaOuTraco` é a convenção da casa para «não há dado»: um traço, nunca uma
           * frase a inventar. */
          '<td>' + (e.nome ? esc(e.nome) : diaOuTraco(e.nome)) + '</td>' +
          '<td>' + (e.escola ? esc(e.escola) : diaOuTraco(e.escola)) + '</td>' +
          '<td>' + quem + '</td>' +
          '<td style="overflow-wrap:anywhere">' + esc(e.mensagem) + '</td>' +
          '<td>' + avisoDe(e) + '</td>' +
          '<td>' + (e.lido
            ? '<span class="selo discreto">lido</span>'
            : '<span class="selo alerta">novo</span>') +
            (e.lido ? '' : '<br><button class="acao secundario pequena" data-lido="' + esc(e.quando) +
              '" type="button">Marcar como lido</button>') +
          '</td>' +
          '</tr>';
      }).join('') + '</tbody></table>' +
      /* O `.aviso` e o script do «lido» ficam DENTRO do embrulho: são do bloco, como o parágrafo
       * das escolas. Só as LINHAS é que paginam — o embrulho não esconde o que não é linha. */
      '<p class="aviso">Cada linha é um pedido feito no «Fale conosco» do site. O pedido é gravado ' +
      'aqui <strong>e</strong> o aviso é enviado por e-mail para lastro@padd.com.br — a coluna ' +
      '«Aviso» diz se ele saiu. Um pedido com «não saiu» está nesta lista e não na sua caixa de ' +
      'correio: é a esta página que se volta. A lista guarda os últimos 200 pedidos.</p>' +
      '<script>' +
      'document.addEventListener("click", function (e) {' +
      '  var b = e.target.closest && e.target.closest("[data-lido]");' +
      '  if (!b) return;' +
      '  b.disabled = true;' +
      '  fetch("/api/contatos/lido", { method: "POST", headers: { "Content-Type": "application/json" },' +
      '    body: JSON.stringify({ quando: b.getAttribute("data-lido") }) })' +
      '    .then(function (r) { return r.json(); })' +
      '    .then(function (d) { if (d && d.ok) location.reload(); else b.disabled = false; })' +
      '    .catch(function () { b.disabled = false; });' +
      '});' +
      '</script>', 'Pedidos por página')
    : '<div class="caixa nota">' +
      '<h2>Ninguém procurou ainda</h2>' +
      '<p>Quando alguém escrever pelo «Fale conosco» do site, o pedido aparece aqui — com o nome, ' +
      'a escola, o e-mail e o telefone de quem escreveu, e a mensagem.</p>' +
      '</div>';

  return pagina({
    titulo: 'Contatos',
    subtitulo: porLer
      ? porLer + (porLer === 1 ? ' pedido por ler' : ' pedidos por ler') +
        ' — quem procurou o sistema, e o que queria.'
      : 'Quem procurou o sistema pelo site, e o que queria.',
    atual: 'contatos',
    corpo: corpo + '<p><a class="acao secundario" href="/">Voltar ao painel</a></p>',
  });
}

/**
 * A PÁGINA DOS CONSULTORES — quem atende as escolas, e quem pode abrir uma (25/11/2026).
 *
 * O PEDIDO, na letra: «vou adicionar lá em danca.padd.com.br um botão que leva até o cadastro e a
 * listagem de consultores. Nesse cadastro de consultor, eu vou pôr o nome, o CPF e o CNPJ, os
 * equipamentos que ele precisa ter, carro e habilitação e computador próprio, um notebook próprio.
 * E aí um botão de ativar ou desativar e um status para saber se ele está ativo ou não.»
 *
 * PORQUE É QUE O «ACTIVO» É UMA COLUNA COM UM BOTÃO, E NÃO UMA CAIXA NO FORMULÁRIO. O cadastro é um
 * dado; o acesso é uma decisão, e são gestos separados — «um cadastro é um dado; o acesso é uma
 * decisão» é a frase do plano, e ela decide o desenho. Um consultor nasce **inactivo**, e activá-lo
 * é um clique com data e autor, que fica no histórico. Se nascesse activo, um cadastro feito à
 * pressa abriria a porta que o link dele abre.
 *
 * A PRAÇA NÃO É DECORAÇÃO. É dela que o token dirá «em que praça é esta escola» (F3), e é o número
 * que responde «em quantas regiões há gente» quando houver meta. Por isso ela é coluna, e não uma
 * nota escondida.
 *
 * O EQUIPAMENTO É DECLARADO, E A FRASE DIZ «(não)». Não há como o sistema verificar se ele tem
 * carro — o que ele guarda é a declaração, com data. Escrever só os que ele tem faria a linha de
 * quem não tem nada parecer igual à de quem tem tudo; o «(não)» é o que a torna legível.
 *
 * NENHUMA PEÇA NOVA: `caixa`, `campo-rotulo`, `input`, `escolhas`/`escolha`, `acao`, `selo`,
 * `table`. O mesmo formulário que a casa já desenha no Financeiro — e o `check-identidade` reprova
 * qualquer classe que não seja da folha.
 */
function paginaDosConsultores({ consultores: lista, catalogo, livros, moeda } = {}) {
  const todos = Array.isArray(lista) ? lista : [];
  const r = consultores.resumo(todos);

  /* ── O RESUMO, EM QUATRO NÚMEROS ───────────────────────────────────────────────────────────
   *
   * Quatro, e não dez: «quem pode abrir link agora» (activos), «quem está cadastrado e não atende»
   * (inactivos), «em quantas regiões há gente» (praças) e «quantos têm o equipamento todo». O
   * último é o que evita a surpresa: um consultor sem carro numa praça sem transporte é uma visita
   * que não acontece, e é melhor sabê-lo na lista do que no dia combinado. */
  const resumoEmCaixa = '<div class="caixa" id="consultores-resumo">' +
    '<h2>Quem atende hoje</h2>' +
    '<p><strong>' + r.activos + '</strong> ' + (r.activos === 1 ? 'activo' : 'activos') +
    ' · <strong>' + r.inativos + '</strong> ' + (r.inativos === 1 ? 'inactivo' : 'inactivos') +
    ' · <strong>' + r.pracas + '</strong> ' + (r.pracas === 1 ? 'praça' : 'praças') +
    ' · <strong>' + r.comEquipamentoCompleto + '</strong> com o equipamento todo declarado</p>' +
    '<p class="aviso">Só um consultor <strong>activo</strong> pode gerar o link de uma escola. ' +
    'Desactivar fecha a área dele e os links que ele já espalhou — sem ter de os correr atrás.</p>' +
    '</div>';

  /* ── O ENDEREÇO DELE, QUE SÓ SE MOSTRA UMA VEZ ───────────────────────────────────────────────
   *
   * «ACTIVAR» É O GESTO QUE ABRE A PORTA, e a porta é um endereço com um token. O KV guarda o
   * hash — não o token —, e por isso este endereço só pode ser mostrado no instante em que nasce:
   * no fim de «Activar», ou no fim de «Novo endereço». Depois disso o sistema não o sabe, e é de
   * propósito (é a mesma disciplina do convite: quem lê o KV não reconstrói o link).
   *
   * A CAIXA DIZ ISSO, e diz o que fazer: copiar agora e mandar-lhe por WhatsApp. Sem esta frase, o
   * gesto de activar parecia não ter produzido nada — e o consultor ficava à espera de um endereço
   * que ela julgava ter enviado.
   *
   * O `data-copiar` é o da folha, com a rotina de `nucleo/copiar.js` carregada nesta página: um
   * botão de copiar sem ouvinte foi exactamente o defeito de 25/11/2026. */
  const caixaDoAcesso = '<div class="caixa" id="consultores-acesso" hidden>' +
    '<h2>O endereço deste consultor</h2>' +
    '<p><input id="consultores-acesso-campo" type="text" readonly></p>' +
    '<p><button class="acao" type="button" data-copiar="consultores-acesso-campo">Copiar o endereço</button></p>' +
    '<p class="aviso">Este endereço aparece <strong>uma vez só</strong> — o sistema guarda o resumo ' +
    'dele, e não ele. Copie agora e mande-o ao consultor. Se se perder, «Novo endereço» na linha ' +
    'dele gera outro, e o anterior deixa de valer.</p>' +
    '</div>';

  /* ── O CADASTRO ─────────────────────────────────────────────────────────────────────────── */
  const campo = (id, rotulo, tipo, dica) => '<p><label class="campo-rotulo" for="' + id + '">'
    + esc(rotulo) + '</label><input id="' + id + '" type="' + tipo + '"'
    + (dica ? ' placeholder="' + esc(dica) + '"' : '') + ' autocomplete="off"></p>';

  const caixasDeEquipamento = '<fieldset class="escolhas"><legend class="campo-rotulo">' +
    'O equipamento que ele declara ter</legend>' +
    consultores.EQUIPAMENTOS.map((e) => '<label class="escolha"><input type="checkbox" ' +
      'data-consultor-equipamento="' + e.id + '"><span>' + esc(e.rotulo) + '</span></label>').join('') +
    '</fieldset>';

  const formulario = '<div class="caixa" id="consultores-cadastro">' +
    '<h2>Cadastrar um consultor</h2>' +
    '<p>O cadastro nasce <strong>inactivo</strong>. Activar é o gesto seguinte, na lista — e é ele ' +
    'que abre a porta de o consultor poder gerar links.</p>' +
    campo('consultor-nome', 'Nome', 'text', 'como ele se apresenta à escola') +
    campo('consultor-praca', 'Praça', 'text', 'a região onde ele atende') +
    campo('consultor-cpf', 'CPF', 'text', '000.000.000-00') +
    campo('consultor-cnpj', 'CNPJ (se factura como empresa)', 'text', '00.000.000/0000-00') +
    campo('consultor-email', 'E-mail', 'email', 'é por aqui que se fala com ele') +
    campo('consultor-telefone', 'Telefone', 'tel', '(00) 00000-0000') +
    caixasDeEquipamento +
    '<p class="aviso">Um dos dois documentos é obrigatório — o CPF, ou o CNPJ se ele factura como ' +
    'empresa. Os dois podem vir juntos: quem dá aula e faz consultoria como MEI tem os dois.</p>' +
    '<p><button class="acao" id="consultor-cadastrar" type="button">Cadastrar o consultor</button></p>' +
    '<p id="consultor-recado" role="status" class="aviso" hidden></p>' +
    '</div>';

  /* ── A LISTA ────────────────────────────────────────────────────────────────────────────── */
  const botaoDeEstado = (registo) => {
    const activo = consultores.estaAtivo(registo);
    return '<button class="acao pequena secundario" type="button" data-consultor-estado="'
      + esc(registo.id) + '" data-para="' + (activo ? 'inativo' : 'ativo') + '">'
      + (activo ? 'Desactivar' : 'Activar') + '</button>'
      /* O «NOVO ENDEREÇO» SÓ EXISTE PARA QUEM ESTÁ ACTIVO — um consultor inactivo não tem porta,
       * e um botão que responde «active-o primeiro» é um botão a explicar-se. É o gesto de quem
       * perdeu o link: troca a fechadura, e o endereço anterior deixa de valer. */
      + (activo
        ? '<br><button class="acao pequena secundario" type="button" data-novo-acesso="'
          + esc(registo.id) + '">Novo endereço</button>'
        : '');
  };

  const selo = (registo) => (consultores.estaAtivo(registo)
    ? '<span class="selo ok">activo</span>'
    : '<span class="selo discreto">inactivo</span>');

  /* A ÚLTIMA MUDANÇA VIRE DO HISTÓRICO, e não de uma coluna guardada à parte: o histórico é a
   * fonte, e uma segunda coluna com a mesma data divergiria dela no dia em que um elo falhasse. */
  const desde = (registo) => {
    const hist = Array.isArray(registo.historico) ? registo.historico : [];
    const ultimo = hist.length ? hist[hist.length - 1] : null;
    if (!ultimo || !ultimo.em) return diaOuTraco(registo.criadoEm);
    return diaOuTraco(ultimo.em) + ' · ' + esc(String(ultimo.o || ''));
  };

  /* ── O LIVRO DE CADA UM (25/11/2026 — F4) ────────────────────────────────────────────────────
   *
   * A CÉLULA DIZ TRÊS COISAS, e nenhuma delas é decorativa: quanto é devido (derivado das visitas
   * que deram escola), quanto já entrou, e o que falta. Quando o livro não se leu, ela DIZ ISSO — em
   * vez de mostrar «R$ 0,00», que é a pior resposta possível sobre dinheiro.
   *
   * O BOTÃO SÓ APARECE QUANDO HÁ O QUE RECEBER. Um botão que abre uma caixa para dizer «não deves
   * nada» é um clique a mais para a mesma informação. */
  const dinheiro = (c) => String(moeda || 'R$') + ' ' + (Math.round(Number(c) || 0) / 100)
    .toFixed(2).replace('.', ',');

  const celulaDoLivro = (registo) => {
    const l = livros && livros[registo.id];
    if (!l) return '<span class="selo discreto">—</span>';
    if (!l.ok) {
      return '<span class="selo alerta">não consegui ler</span>'
        + '<br><span class="aviso">' + esc(String(l.erro || 'o livro não respondeu')) + '</span>';
    }
    const r = l.resumo || {};
    if (!r.taxaCentavos) return '<span class="selo alerta">taxa não declarada</span>';
    const partes = ['<strong>' + dinheiro(r.saldoCentavos > 0 ? r.saldoCentavos : 0) + '</strong> em falta'];
    if (r.recebidoCentavos > 0) {
      partes.push('recebido ' + dinheiro(r.recebidoCentavos));
    }
    if (r.saldoCentavos < 0) {
      /* UM SALDO NEGATIVO MOSTRA-SE. Escondê-lo atrás de um zero deixaria um engano de valor
       * invisível — e é a única forma de ele ser corrigido. */
      partes.push('<span class="selo alerta">a mais ' + dinheiro(-r.saldoCentavos) + '</span>');
    }
    if (r.saldoCentavos > 0) {
      /* O CAMPO DO VALOR, NA PRÓPRIA CÉLULA (26/11/2026) — o mesmo padrão do «Marcar pago» do
       * financeiro, e pela mesma razão que ele existe lá: um `window.prompt` devolve `null` sem
       * lançar nada quando o browser o suprime, e o código fazia `return` — o gesto morria em
       * silêncio. Um campo `text` com `inputmode="decimal"` aceita a vírgula em qualquer teclado; o
       * `type="number"` recusa-a em parte deles e transforma um valor válido em vazio sem avisar. */
      const idDoCampo = 'receber-valor-' + esc(registo.id);
      partes.push('<input id="' + idDoCampo + '" type="text" inputmode="decimal"'
        + ' data-receber-valor="' + esc(registo.id) + '"'
        + ' aria-label="valor recebido, em reais"'
        + ' value="' + esc(dinheiro(r.saldoCentavos).replace(/^[^0-9]*/, '')) + '">');
      partes.push('<button class="acao pequena" type="button" data-receber="' + esc(registo.id)
        + '" data-devido="' + Math.round(r.saldoCentavos) + '">Marcar recebido</button>');
    }
    return partes.join('<br>')
      + (r.quantidadeDevida
        ? '<br><span class="aviso">' + r.quantidadeDevida
          + (r.quantidadeDevida === 1 ? ' consultoria deu escola' : ' consultorias deram escola') + '</span>'
        : '');
  };

  const listaEmTabela = todos.length
    ? tabelaPaginada('pa-lista-consultores', '<table>' +
      '<thead><tr><th>Nome</th><th>Praça</th><th>Documento</th><th>Equipamento</th>' +
      '<th>Como falar</th><th>Estado</th><th>O que deve</th><th>Desde</th><th></th></tr></thead>' +
      '<tbody>' + todos.slice().reverse().map((c) => '<tr>' +
        '<td>' + esc(consultores.nomeDoConsultor(c)) + '</td>' +
        '<td>' + esc(String(c.praca || '—')) + '</td>' +
        '<td>' + esc(consultores.documentoEmTexto(c)) + '</td>' +
        '<td>' + esc(consultores.equipamentoEmTexto(c)) + '</td>' +
        '<td>' + (comoFalar(c.email, c.telefone) || '—') + '</td>' +
        '<td>' + selo(c) + '</td>' +
        '<td>' + celulaDoLivro(c) + '</td>' +
        '<td>' + desde(c) + '</td>' +
        '<td>' + botaoDeEstado(c) + '</td>' +
        '</tr>').join('') + '</tbody></table>' +
      /* os equipamentos foram declarados; a data da declaração é a mesma do cadastro, e dizê-la
       * aqui evita a pergunta «isto foi verificado quando?» — não foi verificado, foi declarado. */
      '<p class="aviso">O equipamento é <strong>declarado</strong> por ele, com a data do cadastro. ' +
      'O sistema não o verifica — guarda a declaração, que é o que se pode auditar.</p>', 'Consultores por página')
    : '<div class="caixa nota">' +
      '<h2>Nenhum consultor cadastrado</h2>' +
      '<p>Quando houver um, ele aparece aqui com a praça, o documento, o equipamento que declarou e ' +
      'o estado. É daqui que se activa — e é o «activo» que o deixa gerar o link de uma escola.</p>' +
      '</div>';

  /* ── O JAVASCRIPT ─────────────────────────────────────────────────────────────────────────
   *
   * CADASTRAR NÃO RECARREGA, MUDAR DE ESTADO RECARREGA. A diferença é a mesma do Financeiro e
   * pela mesma razão: um cadastro que falha tem de mostrar a frase do servidor ao lado do
   * formulário (e o formulário fica preenchido, para ela corrigir o campo e não o refazer todo); um
   * estado que muda altera a linha inteira — selo, data e botão —, e refazê-la no cliente seria uma
   * segunda composição da mesma regra. */
  const script = '<script>' + SCRIPT_DO_COPIAR + '</script>' +
    '<script>(function(){' +
    /* O ENDEREÇO É GUARDADO ENTRE O `fetch` E O `reload`, e o `sessionStorage` é o único sítio que
     * sobrevive aos dois. A alternativa era não recarregar: a linha ficaria a dizer «Activar» com o
     * consultor já activo — e a lista passaria a mentir sobre o estado, que é pior do que uma caixa
     * que precisa de um sítio para o valor. Ao abrir, a página lê-o, mostra-o e apaga-o. */
    'function mostrarAcesso(url){' +
    'try{sessionStorage.setItem("consultor-acesso",url||"");}catch(e){}' +
    'var cx=document.getElementById("consultores-acesso"),campo=document.getElementById("consultores-acesso-campo");' +
    'if(!cx||!campo)return;campo.value=url||"";cx.hidden=false;' +
    'try{cx.scrollIntoView({block:"start"});}catch(e){}}' +
    'try{var guardado=sessionStorage.getItem("consultor-acesso");' +
    'if(guardado){mostrarAcesso(guardado);sessionStorage.removeItem("consultor-acesso");}}catch(e){}' +
    'function recado(t,erro){var cx=document.getElementById("consultor-recado");if(!cx)return;' +
    'cx.hidden=!t;cx.textContent=t||"";cx.className=erro?"aviso alerta":"aviso";}' +
    'function valor(id){var e=document.getElementById(id);return e?e.value:"";}' +
    'var criar=document.getElementById("consultor-cadastrar");' +
    'if(criar)criar.addEventListener("click",function(){' +
    '  var eq={};var caixas=document.querySelectorAll("[data-consultor-equipamento]");' +
    '  for(var i=0;i<caixas.length;i++)eq[caixas[i].getAttribute("data-consultor-equipamento")]=!!caixas[i].checked;' +
    '  criar.disabled=true;recado("a cadastrar…",false);' +
    '  fetch("/api/consultores",{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",' +
    '    body:JSON.stringify({nome:valor("consultor-nome"),praca:valor("consultor-praca"),' +
    '      cpf:valor("consultor-cpf"),cnpj:valor("consultor-cnpj"),email:valor("consultor-email"),' +
    '      telefone:valor("consultor-telefone"),equipamento:eq})})' +
    '  .then(function(r){return r.json().catch(function(){return {};});})' +
    '  .then(function(d){criar.disabled=false;' +
    '    if(d&&d.ok){location.reload();return;}' +
    '    recado((d&&d.erro)||"não foi possível cadastrar",true);})' +
    '  .catch(function(){criar.disabled=false;recado("falha de rede — nada foi gravado",true);});' +
    '});' +
    'var mudar=document.querySelectorAll("[data-consultor-estado]");' +
    'for(var j=0;j<mudar.length;j++)(function(b){' +
    '  b.addEventListener("click",function(){' +
    '    var para=b.getAttribute("data-para");if(!para)return;b.disabled=true;' +
    '    fetch("/api/consultores/estado",{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",' +
    '      body:JSON.stringify({id:b.getAttribute("data-consultor-estado"),ativo:para==="ativo"})})' +
    '    .then(function(r){return r.json().catch(function(){return {};});})' +
    '    .then(function(d){' +
    '      if(d&&d.ok){' +
    /* O ENDEREÇO NOVO VEM NA RESPOSTA DO «ACTIVAR», e é a única vez que existe. Recarregar a página
     * a seguir perdia-o — e a página recarregada diria «activo» sem dar a ninguém a chave. Por isso
     * o caso do endereço mostra primeiro, e recarrega depois: a caixa fica visível com o valor, e o
     * `location.reload()` guarda-o no `sessionStorage`? Não — recarregar apagava-o do ecrã.
     * A solução é não recarregar quando há endereço: a linha muda no sítio, e a caixa diz o resto. */
    '        if(d.acesso&&d.acesso.url){mostrarAcesso(d.acesso.url);location.reload();return;}' +
    '        location.reload();return;}' +
    '      b.disabled=false;' +
    '      recado((d&&d.erro)||"não foi possível mudar o estado",true);})' +
    '    .catch(function(){b.disabled=false;recado("falha de rede — nada foi alterado",true);});' +
    '  });' +
    '})(mudar[j]);' +
    'var novos=document.querySelectorAll("[data-novo-acesso]");' +
    'for(var k=0;k<novos.length;k++)(function(b){' +
    '  b.addEventListener("click",function(){' +
    '    b.disabled=true;' +
    '    fetch("/api/consultores/acesso",{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",' +
    '      body:JSON.stringify({id:b.getAttribute("data-novo-acesso")})})' +
    '    .then(function(r){return r.json().catch(function(){return {};});})' +
    '    .then(function(d){b.disabled=false;' +
    '      if(d&&d.ok&&d.acesso&&d.acesso.url){mostrarAcesso(d.acesso.url);return;}' +
    '      recado((d&&d.erro)||"não foi possível gerar o endereço",true);})' +
    '    .catch(function(){b.disabled=false;recado("falha de rede — nada foi alterado",true);});' +
    '  });' +
    '})(novos[k]);' +
    /* O «MARCAR RECEBIDO» — um `prompt` com o valor devido já preenchido, e não um campo novo na
     * tabela: a tabela tem nove colunas, e um campo em cada linha seria um formulário inteiro
     * montado para um clique. O valor vem do `data-devido` (em centavos) e é mostrado em reais —
     * quem lê «10,00» no ecrã não deve ter de escrever «1000».
     *
     * A CONVERSÃO PARA CENTAVOS É FEITA AQUI, e não no servidor a partir do texto: `R$ 1.234,56`
     * passado como cadeia é a conta que dá 1234.5600000000002. O servidor aceita os dois, mas o
     * caminho normal manda o inteiro. */
    /* O «MARCAR RECEBIDO», SEM PROMPT E COM O AVISO AO LADO DO GESTO (26/11/2026).
     *
     * Duas correcções, e as duas vêm do mesmo lugar — o gesto falhava em silêncio:
     *
     *   1. o `window.prompt` foi trocado por um CAMPO NA PRÓPRIA CÉLULA. Um prompt suprimido pelo
     *      browser devolve `null` sem lançar nada, e o código fazia `return` — nada acontecia e nada
     *      dizia porquê;
     *   2. a mensagem passou a sair na PILHA DE AVISOS (`window.avisar`, do casco), no canto do
     *      ecrã. O `recado` desta página escreve no formulário de cadastro, no TOPO — e um erro no
     *      botão da tabela aparecia a 600 px de distância de onde a pessoa olhava.
     *
     * O CAMINHO DE ÊXITO RELÊ A PÁGINA, como todos os gestos deste painel que mudam uma linha. */
    /* O «MARCAR RECEBIDO», SEM PROMPT E COM O AVISO AO LADO DO GESTO (26/11/2026).
     *
     * Duas correcções, e as duas vêm do mesmo lugar — o gesto falhava em silêncio:
     *
     *   1. o `window.prompt` foi trocado por um CAMPO NA PRÓPRIA CÉLULA. Um prompt suprimido pelo
     *      browser devolve `null` sem lançar nada, e o código fazia `return` — nada acontecia e nada
     *      dizia porquê;
     *   2. a mensagem passou a sair na PILHA DE AVISOS (`window.avisar`, do casco), no canto do
     *      ecrã. O `recado` desta página escreve no formulário de cadastro, no TOPO — e um erro no
     *      botão da tabela aparecia a 600 px de distância de onde a pessoa olhava.
     *
     * O CAMINHO DE ÊXITO RELÊ A PÁGINA, como todos os gestos deste painel que mudam uma linha. */
    'var receber=document.querySelectorAll("[data-receber]");' +
    'for(var r=0;r<receber.length;r++)(function(b){' +
    '  b.addEventListener("click",function(){' +
    '    var id=b.getAttribute("data-receber")||"";' +
    '    var campo=document.querySelector("[data-receber-valor=\\"" + id + "\\"]");' +
    '    var escrito=campo?String(campo.value||"").trim():"";' +
    '    var centavos=Math.round(Number(escrito.replace(/\\./g,"").replace(",","."))*100);' +
    '    if(!isFinite(centavos)||centavos<=0){' +
    '      if(window.avisar)window.avisar("atencao","escreva o valor recebido, em reais — por exemplo 10,00");' +
    '      if(campo)campo.focus();' +
    '      return;}' +
    '    b.disabled=true;if(campo)campo.disabled=true;' +
    '    fetch("/api/consultores/receber",{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",' +
    '      body:JSON.stringify({id:id,centavos:centavos})})' +
    '    .then(function(x){return x.json().catch(function(){return {};});})' +
    '    .then(function(d){' +
    '      if(d&&d.ok){location.reload();return;}' +
    '      b.disabled=false;if(campo)campo.disabled=false;' +
    '      if(window.avisar)window.avisar("erro",(d&&d.erro)||"não foi possível marcar o recebimento");})' +
    '    .catch(function(){b.disabled=false;if(campo)campo.disabled=false;' +
    '      if(window.avisar)window.avisar("erro","falha de rede — nada foi alterado");});' +
    '  });' +
    '})(receber[r]);' +
    '})();</script>';

  return pagina({
    titulo: 'Consultores',
    subtitulo: 'Quem atende as escolas em consultoria, em que praça, e quem pode gerar o link de ' +
      'uma escola nova. Só um consultor activo abre essa porta.',
    atual: 'consultores',
    corpo: resumoEmCaixa + caixaDoAcesso + formulario + '<h2 id="a-lista">Consultores cadastrados</h2>' +
      listaEmTabela + script +
      '<p><a class="acao secundario" href="/">Voltar ao painel</a></p>',
  });
}

/**
 * O FINANCEIRO — a chave que recebe, e quem paga menos (25/11/2026).
 *
 * O QUE ELA PEDIU, na letra: «vamos criar aqui o botão da onde eu coloco a minha chave Pix, tá?
 * Vamos criar aqui na parte, eu não sei que nome semântico a gente daria para isso, é onde eu faço
 * as minhas configurações financeiras […] e também um lugar onde eu possa colocar desconto. Então
 * vai ser no mesmo lugar.»
 *
 * O NOME. «Financeiro» — uma palavra, sem adjetivo. «Configurações financeiras» promete um ecrã de
 * preferências; o que existe aqui é dinheiro a entrar e dinheiro a não entrar, e o nome diz isso.
 * «Pagamentos» seria meia verdade: não há pagamento nenhum a ser processado, há uma chave para
 * onde se paga e descontos que se concedem.
 *
 * AS DUAS COISAS SÃO UMA PÁGINA PORQUE SÃO A MESMA PERGUNTA — «quanto entra?» — vista de dois
 * lados: o preço cheio, que é a chave para onde ele vai; e o preço com desconto, que é quanto
 * deixa de entrar e porquê. Separadas, a segunda página nunca seria aberta no dia em que se olha o
 * extrato, que é exactamente o dia em que ela importa.
 *
 * NENHUMA PEÇA NOVA. Tudo aqui é `caixa`, `campo-rotulo`, `input`, `select`, `acao` e `table` —
 * as peças da folha. Um ecrã do painel que inventasse uma grelha própria seria o segundo desenho
 * do mesmo formulário nesta casa, e a folha é uma.
 */
function paginaFinanceira({ pix, descontos, escolas, extrato, catalogo, dados }) {
  const chave = (pix && pix.chave) || '';
  const titular = (pix && pix.titular) || '';
  const lista = Array.isArray(descontos) ? descontos : [];
  const vivas = Array.isArray(escolas) ? escolas : [];
  const contas = Array.isArray(extrato) ? extrato : [];
  const cat = catalogo || null;
  const fichas = Array.isArray(dados) ? dados : [];

  const blocoDaChave = '<div class="caixa" id="financeiro-pix">' +
    '<h2>A chave que recebe os pagamentos</h2>' +
    /* O ESTADO DO CAMPO É A RESPOSTA, e não uma frase à parte: com chave, o campo mostra-a e o
     * texto diz de onde ela veio; sem chave, a página diz que não há — e diz o comando, porque um
     * ecrã vazio sem instrução é um ecrã que se fecha. */
    '<p>' + (chave
      ? 'É esta a chave que o formulário de criar escola mostra a quem vai pagar. Enquanto for esta, ' +
        'o dinheiro cai na conta que ela identifica.'
      : 'Ainda não há chave configurada. <strong>O formulário de criar escola diz isso a quem vai ' +
        'pagar</strong>, em vez de mostrar uma chave de exemplo — dinheiro enviado para o lado ' +
        'errado é o pior defeito possível num ecrã de pagamento.') + '</p>' +
    '<p><label class="campo-rotulo" for="pix-chave">Chave Pix (CPF, CNPJ, e-mail, telefone ou aleatória)</label>' +
    '<input id="pix-chave" autocomplete="off" value="' + esc(chave) + '" placeholder="ex.: 000.000.000-00"></p>' +
    '<p><label class="campo-rotulo" for="pix-titular">Titular (como aparece no banco)</label>' +
    '<input id="pix-titular" autocomplete="off" value="' + esc(titular) + '" placeholder="ex.: Thiago Menegaz"></p>' +
    /* O TITULAR PODE FICAR EM BRANCO, e isso não é um campo esquecido: uma chave de CPF/CNPJ já
     * identifica o dono na app de quem paga, e o nome que o banco exige por extenso não se inventa
     * a partir de um nome de tratamento. Em branco, a página escreve «para o Sistema Lastro». */
    '<p><button class="acao" id="pix-gravar" type="button">Guardar a chave</button></p>' +
    '<p class="aviso" id="pix-recado" hidden></p>' +
    (pix && pix.atualizadoEm
      ? '<p class="aviso">Última alteração: ' + esc(quando(pix.atualizadoEm)) + '.</p>'
      : '') +
    '</div>';

  const opcoes = vivas.map((e) => '<option value="' + esc(e.slug) + '">' +
    esc(e.nome && e.nome !== e.slug ? e.nome + ' (' + e.slug + ')' : e.slug) + '</option>').join('');

  const blocoDoDesconto = '<div class="caixa" id="financeiro-desconto">' +
    '<h2>Conceder um desconto</h2>' +
    '<p>O desconto é mensal, e vale a partir do momento em que é concedido. Um desconto por escola: ' +
    'conceder outro substitui o anterior — dois descontos sobrepostos na mesma escola não têm uma ' +
    'soma que signifique alguma coisa.</p>' +
    (vivas.length
      ? '<p><label class="campo-rotulo" for="desconto-escola">Para qual escola</label>' +
        '<select id="desconto-escola">' + opcoes + '</select></p>'
      : '<p class="aviso alerta">Nenhuma escola viva para receber desconto. Uma lista vazia quer ' +
        'dizer que nenhuma existe, não que a leitura falhou.</p>') +
    '<p><label class="campo-rotulo" for="desconto-valor">Quanto, por mês (em reais)</label>' +
    '<input id="desconto-valor" autocomplete="off" inputmode="decimal" placeholder="ex.: 20,00"></p>' +
    '<p><label class="campo-rotulo" for="desconto-motivo">Por quê (fica no registo)</label>' +
    '<input id="desconto-motivo" autocomplete="off" placeholder="ex.: escola em início de atividade"></p>' +
    '<p><button class="acao" id="desconto-gravar" type="button"' +
    (vivas.length ? '' : ' disabled') + '>Conceder o desconto</button></p>' +
    '<p class="aviso" id="desconto-recado" hidden></p>' +
    '</div>';

  const tabela = lista.length
    ? '<table><thead><tr><th>Escola</th><th>Desconto</th><th>Quando</th><th>Por quê</th>' +
      '<th>Retirar</th></tr></thead><tbody>' +
      lista.map((d) => '<tr><td><strong>' + esc(d.escola) + '</strong></td>' +
        '<td>R$ ' + esc(d.valor || '') + '</td>' +
        '<td>' + esc(quando(d.em)) + '</td>' +
        '<td>' + (d.motivo ? esc(d.motivo) : '—') + '</td>' +
        '<td><button class="acao pequena secundario" type="button" data-retirar-desconto="' +
        esc(d.escola) + '">Retirar</button></td></tr>').join('') +
      '</tbody></table>'
    : '<div class="caixa nota"><h2>Nenhum desconto concedido</h2>' +
      '<p>Um desconto concedido aparece aqui com a data, o valor e a razão — e é essa linha que ' +
      'responde, seis meses depois, à pergunta «porque é que esta escola paga menos?».</p></div>';

  /* ── AS MENSALIDADES, MÊS A MÊS (16/11/2026) ────────────────────────────────────────────
   *
   * «Eu preciso ter também uma forma de acompanhar mês a mês o pagamento de cada escola, como se
   * fosse um extrato, e com um botão que indica se foi pago. […] E tem que ser possível eu mexer
   * aqui no financeiro e mudar o plano da escola, e também mudar a capacidade extra.»
   *
   * UM CARTÃO POR ESCOLA, e não uma tabela única com todas: o extrato de uma escola é uma
   * sequência, e a sequência de outra ao lado não ajuda a lê-la. O que se procura aqui é «esta
   * escola está em dia?» — e essa pergunta é sobre uma escola de cada vez.
   *
   * O CONTRATO FICA NA MESMA CAIXA DO EXTRATO, e é a decisão de desenho que importa: mudar o
   * plano é a resposta a «esta escola está a pagar o quê?», que é a mesma pergunta do extrato. Em
   * dois ecrãs, o segundo nunca seria aberto no dia em que se olha a conta. */
  /** `6990` → `69,90`. A formatação é a da casa: vírgula decimal, sem milhares. */
  const emReais = (centavos) => ((Math.round(Number(centavos) || 0)) / 100).toFixed(2).replace('.', ',');
  /* O PLANO EM VIGOR VEM SELECCIONADO, e os lotes também — quando o registo os guardou. É a
   * diferença entre «mudar o contrato» e «escrever o contrato de novo sem saber o que lá está»:
   * um `select` que abre no primeiro plano faz dela a autora de um downgrade que não pediu. */
  /* O PLANO, O PREÇO E A FRANQUIA NA MESMA LINHA (25/11/2026).
   *
   * «Quando eu faço a escolha do plano, tem um select aqui que coloca a opção básico, intermediário
   * e avançado. Junto com o texto da listagem, eu tenho o preço […] Coloca junto também a franquia
   * de cada um deles que está sendo contratada. Pode colocar um traço e a franquia para cada um.»
   *
   * A franquia vem do catálogo (`catalogoDaPagina` já traz `aulas` por assinatura), e não de um
   * número escrito aqui: um valor copiado para o ecrã é um valor que diverge do que o servidor
   * cobra no dia em que a tabela mudar. É a mesma razão pela qual o preço também não se escreve. */
  const opcoesDoPlano = (atual) => ((cat && cat.assinaturas) || []).map((p) =>
    '<option value="' + esc(p.id) + '" data-centavos="' + Math.round(Number(p.preco) * 100) + '"'
    + (p.id === atual ? ' selected' : '') + '>'
    + esc(p.nome) + ' — ' + esc(p.precoTexto || '')
    + (Number(p.aulas) > 0 ? ' — ' + p.aulas + ' aulas/mês' : '') + '</option>').join('');
  /* AS CAIXAS DOS LOTES DE GENTE FORAM RETIRADAS A 17/11/2026 — e com elas a função que as
   * desenhava. Um gerador de marcação que já não tem chamador é código morto que parece vivo: o
   * próximo que ler o ficheiro acha que os lotes ainda se vendem. Os contratos antigos guardam os
   * seus (é história); o que se deixou de ter é onde os comprar. */

  /* OS PACOTES DE AULAS (17/11/2026) — as caixas da franquia, com a marca `data-contrato-pacote`.
   * A lista vem do catálogo (`catalogoDeAulas.pacotesDeAulas`), e não de uma tabela escrita aqui:
   * um preço repetido no ecrã é um preço que diverge do que o servidor cobra. */
  const caixasDePacote = (escolhidos) => {
    const lista = (Array.isArray(escolhidos) ? escolhidos : []).map((p) =>
      (p && typeof p === 'object' ? String(p.id || '') : String(p || '')));
    const doCatalogo = (cat && Array.isArray(cat.pacotesDeAulas)) ? cat.pacotesDeAulas : [];
    return doCatalogo.map((pk) => '<label class="escolha"><input type="checkbox" data-contrato-pacote '
      + 'data-pacote="' + esc(pk.id) + '"' + (lista.indexOf(String(pk.id)) !== -1 ? ' checked' : '') + '>'
      + '<span>+' + pk.aulas + ' aulas — R$ ' + String(pk.preco).replace('.', ',') + '/mês</span></label>')
      .join('');
  };

  /* A MEMÓRIA DO CONTRATO, E A DATA EM QUE ELE FOI FEITO (25/11/2026).
   *
   * «Ela não tem nesse momento a indicação no espaço de pacote de aula na mensalidade, ela não tem a
   * indicação de qual pacote ela contratou. E no plano avançado ainda está registrado aqui que foi
   * esse que ela contratou. Então deixa uma memória aqui. […] E coloca aqui também uma auditoria,
   * uma linha acima do botão gravar o contrato que indica a data em que foi feita a contratação do
   * contrato.»
   *
   * A MEMÓRIA JÁ ESTAVA NOS CAMPOS — o `select` abre no plano em vigor e as caixas abrem marcadas
   * com os pacotes comprados. O que faltava era a FRASE: campos pré-preenchidos não dizem se a
   * escola contratou «nenhum extra» ou se o registo se perdeu, e a diferença é a que faz alguém
   * regravar um contrato para ter a certeza. Esta linha diz o que está em vigor por extenso, e
   * diz quando — que é a auditoria que ela pediu, na mesma linha em que se lê o quê.
   *
   * A DATA VEM DO REGISTO, e não do ecrã: `contratadoEm` é carimbada quando um contrato NOVO é
   * gravado (`gravarComercial`, opção `contratoNovo`). Nos registos anteriores a hoje o campo não
   * existe, e a reserva é o `criadoEm` — o instante em que a escola nasceu já com este plano, que
   * é a mesma data, dita pela fonte que a tem. Sem nenhuma das duas, a frase diz que não há data em
   * vez de inventar uma. */
  const nomeDoPacote = (id) => {
    const achado = ((cat && cat.pacotesDeAulas) || [])
      .find((x) => String(x.id) === String(id));
    return achado ? achado.nome + ' (+' + achado.aulas + ' aulas)' : String(id);
  };
  /* A ASSINATURA DE UM CONTRATO — `plano|ids ordenados`. É a comparação de «mudou alguma coisa?»,
   * e tem de ser a MESMA do servidor e do cliente: duas regras dariam um botão que liga sobre uma
   * mudança que o servidor não vê (ou o contrário), e nos dois casos o `contratadoEm` andava sem
   * que nada tivesse mudado. A lista de pacotes é ordenada porque a ordem das caixas não é uma
   * escolha da escola. Ver também `raiz.js`, `/api/financeiro/contrato`. */
  const assinaturaDoContrato = (plano, pacotes) => {
    const ids = (Array.isArray(pacotes) ? pacotes : [])
      .map((p) => (p && typeof p === 'object' ? String(p.id || '') : String(p || '')))
      .filter(Boolean).sort();
    return String(plano || '') + '|' + ids.join(',');
  };
  const linhaDoContratoEmVigor = (c) => {
    const desde = c.contratadoEm || c.criadoEm || c.habilitadaEm || null;
    const aulas = c.franquia && Number(c.franquia.franquia) > 0
      ? Number(c.franquia.franquia) : null;
    const ids = (Array.isArray(c.pacotes) ? c.pacotes : [])
      .map((p) => (p && typeof p === 'object' ? String(p.id || '') : String(p || '')))
      .filter(Boolean);
    const extra = ids.length
      ? 'com ' + ids.map(nomeDoPacote).join(' e ')
      : 'sem pacote de aulas extra';
    return '<p class="sub" data-contrato-em-vigor>' +
      '<strong>Contrato em vigor ' + (desde ? 'desde ' + esc(quando(desde)) : 'sem data registada')
      + ':</strong> ' + esc(c.planoNome || '—')
      + (aulas ? ' (' + aulas + ' aulas/mês)' : '') + ', ' + esc(extra) + '. ' +
      'Gravar um contrato novo actualiza esta data.</p>';
  };

  const cartaoDaConta = (c) => {
    const meses = Array.isArray(c.meses) ? c.meses : [];
    /* A ESCOLA ESTÁ HABILITADA? (16/11/2026). «Você vai colocar aqui mais uma coluna que é para
     * saber se a escola está habilitada ou não. Ela tem uma relação direta com as escolas vivas: se
     * eu desabilitar lá, aqui no financeiro tem que mostrar que está desabilitado.»
     *
     * O ESTADO É O MESMO — `bastidores/<escola>/comercial`, lido pela mesma `lerComercial` que a
     * lista das vivas usa. Uma segunda fonte para «está habilitada?» seria uma segunda resposta à
     * mesma pergunta, e a que sobra é sempre a que se lê primeiro.
     *
     * A coluna repete-se em cada linha, e não só na primeira: a linha é lida sozinha («o mês de
     * outubro está pago, e a escola estava habilitada»), e uma célula em branco nas linhas de baixo
     * obrigaria a subir o olho para saber de que escola se trata. */
    /* O ESTADO DO ENSAIO, lido uma vez (17/11/2026). A página recebe `ensaio` no extrato — o mesmo
     * objecto que o núcleo usa para comprimir o relógio —, e é dele que sai o rótulo do botão. Não
     * se lê a chave outra vez aqui: duas leituras do mesmo estado dão duas respostas no dia em que
     * uma delas falhar. */
    const emEnsaio = Boolean(c.ensaio) && Number(c.ensaio.minutosPorPeriodo) > 0;
    /* A ESCOLA EXPURGADA TAMBÉM ESTÁ AQUI, E NÃO SE COBRA (23/11/2026, à tarde).
     *
     * «A parte financeira não pode expurgar, ela fica para histórico. E aí a gente diz numa linha
     * seguinte que essa escola foi expurgada.»
     *
     * O que fica é o registo: os meses, os valores, quem pagou e quando. O que sai são as ACÇÕES —
     * não se informa um pagamento de uma escola que já não existe, não se muda o contrato dela, não
     * se liga um ensaio. Um botão que grava sobre um registo comercial inexistente criaria um
     * contrato novo para uma escola morta. */
    const expurgada = c.expurgada === true;
    const seloDaEscola = expurgada
      ? '<span class="selo discreto">expurgada</span>'
      : (c.estadoComercial === 'ativa'
        ? '<span class="selo ok">habilitada</span>'
        : (c.estadoComercial === 'suspensa'
          ? '<span class="selo falha">desabilitada</span>'
          : '<span class="selo discreto">a aguardar</span>'));
    /* A COLUNA «COBRANÇA» — O PIX QUE ELA COLA, POR MÊS (25/11/2026).
     *
     * «Eu preciso de uma outra coluna, que é onde eu vou colar o QR code ou a chave Pix. […] eu colo
     * o conteúdo que essa área Pix cobrança do meu banco me entrega. […] quando eu colo no chat do
     * WhatsApp, ele preserva a estrutura toda que essa ferramenta me entrega. Então eu quero algo
     * assim.»
     *
     * PORQUE UM `<textarea>` E NÃO UM `<input>`: o documento do Pix tem quebras de linha, e um campo
     * de uma linha ou as come ou obriga a rolar de lado. O `<textarea>` é a peça da folha que já
     * guarda um texto com a sua forma (`#dicfrase`, `#vb-frase`) — e é a mesma que a página da
     * escola usa para mostrar o que foi colado, para o que ela vê ser o que ela colou.
     *
     * O BOTÃO NASCE DESLIGADO E ACENDE COM A EDIÇÃO, como o do contrato: um botão sempre pronto
     * convida a carregar por rotina, e cada carregamento é uma escrita no KV. A assinatura é o
     * texto que a linha abriu, escrita no próprio botão — e não uma cópia numa variável do script,
     * que se perde quando o painel é dobrado e redesenhado.
     *
     * A ESCOLA EXPURGADA NÃO TEM COLUNA: o registo comercial dela já não existe, e a rota recusa
     * gravar sobre uma escola desconhecida. Mostrar o campo seria oferecer um gesto que falha.
     *
     * O MÊS PAGO NÃO SE REESCREVE (25/11/2026). «Quando eu clicar em pagar, está pago […] a coluna
     * da cobrança pix […] fica desabilitado.» O documento fica À VISTA — é o registo do que foi
     * entregue, e o passado não se apaga —, mas o campo não aceita edição e o botão de gravar
     * desaparece: uma cobrança nova sobre um mês pago seria uma segunda cobrança do mesmo mês, e o
     * ecrã estaria a convidar a ela. O `readonly` deixa copiar; o `disabled` no botão tira o gesto.
     *
     * O MÊS ATRASADO DIZ QUANTO É PRECISO COLAR (25/11/2026) — é o aviso no sítio onde ela cola, e
     * é a resposta prática ao «impedir que a pessoa pague o valor menor». O valor que o código
     * colado pede é LIDO do próprio documento (`cobrancas.valorDaCobranca`), e a linha diz se ele
     * cobre o devido hoje. Quem cola vê o erro antes de o enviar. */
    const celulaDaCobranca = (m) => {
      if (expurgada) return '<td><span class="sub">—</span></td>';
      const guardada = (c.cobrancas && c.cobrancas[m.mes]) ? String(c.cobrancas[m.mes].texto || '') : '';
      const id = 'cob-' + esc(c.escola) + '-' + esc(m.mes);
      const pago = m.status === 'pago';
      /* SEM O BOTÃO «PAGAR NO BANCO» AQUI (25/11/2026) — é decisão dela, e é a desta coluna.
       *
       * «Não precisa do botão pagar no banco na tabela que você mostra no danca.padd.com.br
       * financeiro na coluna cobrança. Não precisa disso.»
       *
       * E a razão é de quem usa o ecrã: a coluna do financeiro é onde ELA COLA o documento do banco
       * e o guarda — o acto de pagar não é dela, é da escola. O link continua onde faz sentido, e
       * ela aprovou-o lá: no «Pagar» da escola e no «mês a mês», que é onde quem paga entra.
       *
       * O QUE FICA: o campo com o documento e o botão que o copia. Um botão a mais nesta célula
       * era um caminho a abrir a cobrança para fora de um ecrã de administração. */
      /* A DECISÃO VEM PRONTA DO NÚCLEO (25/11/2026). Ela era tomada aqui, juntando à mão o valor do
       * mês, a data da emissão e o vencimento — e foi essa montagem manual que pôs o relógio REAL
       * de um lado e o relógio do ENSAIO do outro. A cobrança que ela acabara de colar num mês de
       * ensaio vencido era acusada de «emitida antes do vencimento», com o vencimento em 23/06/2027
       * e a emissão em 25/11/2026: as duas datas verdadeiras, em calendários diferentes.
       *
       * Agora quem responde é `mensalidades.situacaoDaEscola` — o mesmo sítio que diz «atrasado» e
       * calcula a mora —, e esta página só mostra o que ele decidiu. Uma regra num sítio, três
       * páginas; era o que faltava para a regra não ter três versões. */
      const conferencia = m.cobranca || null;
      /* A FRASE DO VALOR, só quando há o que dizer: no mês a vencer não se acrescenta ruído; no mês
       * atrasado, o número que o código pede e o que é devido hoje; e um código sem valor fixo é
       * dito — «é um link» ou «não traz o valor» — porque é isso que explica não haver como
       * conferir. */
      let notaDoValor = '';
      if (conferencia && conferencia.valorCentavos != null && m.venceu && !pago) {
        notaDoValor = '<p class="sub">O código colado pede R$ '
          + esc(cobrancasDoNucleo.reaisDe(conferencia.valorCentavos)) + '; o devido hoje é R$ '
          + esc(cobrancasDoNucleo.reaisDe(conferencia.devidoCentavos)) + '.</p>';
      } else if (conferencia && conferencia.valorCentavos == null && m.venceu && !pago
        && conferencia.estado === 'sem-valor') {
        notaDoValor = '<p class="sub">Este código não tem valor fixo legível — não há como conferir '
          + 'se cobre a mora (R$ ' + esc(cobrancasDoNucleo.reaisDe(conferencia.devidoCentavos))
          + ' hoje).</p>';
      }
      return '<td>' +
        '<textarea id="' + id + '" rows="2"'
        + (pago ? ' readonly aria-readonly="true"' : '')
        + ' placeholder="cole aqui o Pix que o banco gerou para este mês">'
        + esc(guardada) + '</textarea>' +
        (pago
          ? '<p class="sub">Mês pago — a cobrança fica como registo.</p>'
          : '<p class="par-associar">' +
            '<button class="acao pequena secundario" type="button" disabled'
            + ' data-cobranca-gravar="' + esc(c.escola) + '" data-mes="' + esc(m.mes) + '"'
            + ' data-cobranca-assinatura="' + esc(guardada) + '"'
            + ' title="gravar a cobrança deste mês">Gravar</button>' +
            (guardada
              ? '<button class="acao pequena secundario" type="button"'
                + ' data-copiar="' + id + '" title="copiar o Pix deste mês">Copiar</button>'
              : '') +
            '</p>') +
        notaDoValor +
        '<p class="aviso" data-cobranca-recado="' + esc(c.escola) + '-' + esc(m.mes) + '" hidden></p>' +
        '</td>';
    };

    /* A CÉLULA «SITUAÇÃO» — O ESTADO E O GESTO NO MESMO SÍTIO (25/11/2026).
     *
     * «Apagou o botão que confirma se a escola pagou ou não a mensalidade, que é o resultado da
     * conciliação. Precisa voltar com esse botão. […] acrescenta uma coluna que é da situação, do
     * status do pagamento da escola, que tem esse botão.»
     *
     * O BOTÃO NÃO TINHA DESAPARECIDO DO CÓDIGO — e é isso que torna o diagnóstico interessante: ele
     * estava numa coluna própria, «Pago / ação», à direita de «Situação», e a coluna da cobrança
     * (larga, com `<textarea>`) empurrou a tabela para lá do ecrã. Uma coluna que só se vê rolando
     * de lado é uma coluna que não existe para quem olha. As duas diziam a mesma coisa — «como está
     * este mês» — e passam a ser UMA: o selo, a data quando há, e o botão quando não há.
     *
     * É TAMBÉM UMA COLUNA A MENOS: sete colunas numa tabela que rola é o que faz a ação sair do
     * campo de visão. */
    const celulaDaSituacao = (m) => {
      if (m.status === 'pago') {
        return '<td><span class="selo ok">pago</span>'
          + (m.emTexto ? ' <span class="dono">' + esc(m.emTexto) + '</span>' : '')
          + (m.planoNome ? '<br><span class="sub">' + esc(m.planoNome) + '</span>' : '')
          + '</td>';
      }
      /* O SELO NÃO É O MESMO NOS DOIS CASOS DE ABERTO (25/11/2026). Um mês que nunca foi tocado
       * está «atrasado» ou «a vencer»; um mês em que entrou PARTE do valor está «parcial», e o selo
       * diz quanto falta — senão a linha pareceria igual à de um mês sem pagamento nenhum, e a
       * pessoa repetiria o pagamento inteiro. */
      const ehParcial = m.status === 'parcial';
      const selo = ehParcial
        ? '<span class="selo alerta">parcial</span>'
        : (m.venceu
          ? '<span class="selo falha">atrasado</span>'
          : '<span class="selo discreto">a vencer</span>');
      const entrou = ehParcial
        ? '<br><span class="sub">entrou ' + reaisDeCentavos(m.recebidoCentavos || 0)
          + ' · faltam ' + reaisDeCentavos(m.faltaCentavos || 0) + '</span>'
        : '';
      /* OS ENCARGOS AO LADO DO ESTADO, e não numa coluna nova: uma coluna a mais numa tabela que já
       * rola é o que faz o valor que interessa sair do ecrã. O mês em atraso diz quanto a mais, e
       * diz a NORMA — a escola que pergunta «de onde vem isto?» tem a resposta na mesma célula. */
      const mora = (m.encargos && m.encargos.encargosCentavos > 0)
        ? '<br><span class="sub">+' + reaisDeCentavos(m.encargos.encargosCentavos)
          + ' de mora (' + m.encargos.diasDeAtraso + ' dia(s): multa '
          + reaisDeCentavos(m.encargos.multaCentavos) + ' + juros '
          + reaisDeCentavos(m.encargos.jurosCentavos) + ')</span>'
        : '';
      /* O CAMPO DO VALOR RECEBIDO, e é ele que impede o pagamento a menos (25/11/2026).
       *
       * «É a pessoa que vai pagar o valor menor. Ela vai ter que pagar o valor maior. […] eu ainda
       * não sei uma solução para isso.» A solução é o número não ser escolha de quem paga: o campo
       * vem PREENCHIDO com o que se deve hoje — mensalidade mais mora — e o gesto normal é não lhe
       * tocar. Quem toca está a dizer quanto entrou de facto, e o servidor compara (a comparação é
       * dele, nunca desta página): abaixo do devido, o mês fica `parcial` e continua em aberto.
       *
       * ELE NÃO É UM `prompt()`: a janelinha do navegador foi substituída por campos de verdade em
       * 22/10/2026, e um campo dentro da linha é o mesmo ato sem sair da tabela.
       *
       * `inputmode="decimal"` porque o número tem vírgula; o `type` é `text` e não `number` porque
       * o campo numérico do browser recusa a vírgula em parte dos teclados e transforma um valor
       * válido num valor vazio em silêncio. */
      const idDoCampo = 'pagar-valor-' + esc(c.escola) + '-' + esc(m.mes);
      /* O VALOR QUE O BOTÃO PROPÕE É O `aPagar` DA LINHA (25/11/2026) — saldo + mora + o excedente
       * de aulas do mês anterior. Ele deixou de ser recalculado aqui: uma segunda soma do mesmo
       * valor divergiria da linha no dia em que uma das duas ganhasse um termo, e essa linha é
       * exactamente a que a pessoa está a ler ao lado do botão. */
      const devido = Number(m.aPagarCentavos) || (m.encargos && m.encargos.totalCentavos)
        || m.faltaCentavos || m.valorCentavos || 0;
      const campo = expurgada
        ? ''
        : '<br><input id="' + idDoCampo + '" type="text" inputmode="decimal"'
          + ' data-pagar-valor="' + esc(c.escola) + '" data-mes="' + esc(m.mes) + '"'
          + ' aria-label="valor recebido neste mês, em reais"'
          + ' value="' + esc(emReais(devido)) + '">';
      /* O EXCEDENTE DE AULAS DO MÊS ANTERIOR, NA LINHA DO MÊS EM QUE É COBRADO (25/11/2026).
       *
       * Ele entra na conta (`m.aPagarCentavos`), e por isso tem de estar À VISTA na linha em que
       * entra — senão a linha diz um total que não fecha com os números que mostra ao lado. É a
       * mesma razão de a mora estar aqui e não numa coluna própria. */
      const doExcedente = (m.excedente && m.excedente.aulas > 0)
        ? '<br><span class="sub">+' + esc(String(m.excedente.aulas)) + ' aula(s) excedente(s) de '
          + esc(String(m.excedente.competencia)) + ' a R$ '
          + esc((m.excedente.precoDaAulaCentavos / 100).toFixed(2).replace('.', ','))
          + ' = R$ ' + esc((m.excedente.centavos / 100).toFixed(2).replace('.', ',')) + '</span>'
        : '';
      const botao = expurgada
        ? ''
        : '<button class="acao pequena" type="button" data-pagar="' + esc(c.escola) + '"'
          + ' data-mes="' + esc(m.mes) + '"'
          + ' title="confirmar que o valor do campo entrou neste mês">Marcar pago</button>';
      return '<td>' + selo + entrou + mora + doExcedente + campo + botao + '</td>';
    };

    const linhas = meses.map((m) => '<tr data-mes="' + esc(m.mes) + '">' +
      '<td><strong>' + esc(m.nome || m.mes) + '</strong></td>' +
      '<td>' + seloDaEscola + '</td>' +
      '<td>' + esc(m.vencimento || '—') + '</td>' +
      '<td>' + (m.valorPagoCentavos != null
        ? 'R$ ' + emReais(m.valorPagoCentavos)
        : (m.valorCentavos ? 'R$ ' + emReais(m.valorCentavos) : '—')) + '</td>' +
      celulaDaSituacao(m) +
      celulaDaCobranca(m) +
      '</tr>').join('');

    const corpoDaTabela = linhas
      ? '<div class="rolagem-caixa"><table><thead><tr><th>Mês</th>' +
        /* A COLUNA CHAMAVA-SE «ESCOLA» E NÃO MOSTRAVA ESCOLA NENHUMA (26/11/2026). Ela guarda o
         * `estadoComercial` — «habilitada», «desabilitada», «a aguardar» —, e um cabeçalho que
         * promete o nome e entrega o estado é o que faz uma linha deixar de dizer de quem é: quem
         * concilia lê «Escola: habilitada» e não fica a saber de que escola se trata. Cada cartão já
         * é UMA escola, e o nome dela está no resumo, à vista; o que a coluna diz é outra coisa, e
         * passa a dizê-la pelo nome. «Habilitação» e não «Estado» porque «Situação», na coluna ao
         * lado, já é o do pagamento — duas colunas a dizer «estado» seria a confusão a mudar de
         * sítio. */
        '<th>Habilitação</th>' +
        '<th>Vencimento</th><th>Valor</th><th>Situação</th>' +
        /* A COLUNA DA COBRANÇA FICA NO FIM, e continua a ser outro assunto: o «pago» é a
         * conciliação (o dinheiro entrou) e a cobrança é a entrega do documento (o dinheiro ainda
         * não entrou). Encostá-las faria confundir uma com a outra. */
        (expurgada ? '' : '<th>Cobrança (Pix)</th>') +
        '</tr></thead><tbody>' + linhas + '</tbody></table></div>'
      : (expurgada
        ? ''
        : '<p class="aviso">Ainda não há mensalidade a cobrar desta escola — a contagem começa ' +
          'quando ela é criada. Uma lista vazia quer dizer isso, e não que a leitura falhou.</p>');

    /* O QUE SAIU DAQUI A 17/11/2026 (17/11/2026): a frase «+3 professor(es) (R$ 50,00) e +30
     * aluna(s) (R$ 50,00)», o piso, o teto e o «gente». Ela foi directa: «Ah, entendi. Então quer
     * dizer que todo esse que já não se vende mais vai sair quando eu expurgar a escola» — e tem
     * razão. Um adicional de gente ao lado de uma franquia de aulas é a promessa de um eixo que já
     * não se vende, e um número que se mostra é um número que se pode exigir. O contrato continua
     * a GUARDAR os lotes de quem os comprou (é história, e a história não se apaga); o que deixou
     * de haver é o lugar onde eles se apresentam como se ainda fossem oferta.
     *
     * O `capacidade` também sai do ecrã — mas não do registo: ele é a referência interna do tamanho
     * da escola, e a controladoria lê-o em `situacaoDaEscola`. */

    /* O BLOCO DOBRÁVEL (16/11/2026). «A gente vai empilhar […] tem que poder colapsar.» Com uma
     * escola a página é uma página; com vinte, o extrato de cada uma aberto é uma parede. O
     * `<details>` é a peça que a casa já usa para dobrar, e o resumo fica à vista com o que basta
     * para reconhecer a escola: o nome, o plano e a situação. */
    /* A LINHA SEGUINTE — é assim que ela pediu, e é literal: «a gente diz numa linha seguinte que
     * essa escola foi expurgada». Fica DEPOIS do nome e do plano, no corpo do cartão, para quem
     * abre o extrato dela meses depois não ter de deduzir de um selo o que aconteceu. */
    const linhaDoExpurgo = expurgada
      ? '<p class="aviso"><strong>Escola expurgada'
        + (c.expurgadaEm ? ' em ' + esc(quando(c.expurgadaEm)) : '')
        + '.</strong> O histórico de pagamentos fica — é a receita que existiu. Saíram do sistema '
        + 'o contrato, as senhas, as alunas e os documentos, e por isso não há aqui o que cobrar '
        + 'nem o que alterar.</p>'
      : '';
    return '<details class="acordeao" open data-conta="' + esc(c.escola) + '">' +
      '<summary><strong>' + esc(c.nome || c.escola) + '</strong> '
      + '<span class="dono">(' + esc(c.escola) + ')</span> '
      + '<span class="selo discreto">' + esc(c.planoNome || '—') + '</span> '
      + (expurgada
        ? '<span class="selo discreto">expurgada</span>'
        : '<span class="selo ' + (c.situacao === 'em-aberto' ? 'falha' : (c.situacao === 'em-dia' ? 'ok' : 'discreto'))
          + '">' + esc(c.situacao === 'em-aberto' ? 'em aberto' : (c.situacao === 'em-dia' ? 'pago' : 'a aguardar'))
          + '</span>') + '</summary>' +
      linhaDoExpurgo +
      /* A FRASE DA COBRANÇA NÃO SE DIZ A UMA ESCOLA EXPURGADA (23/11/2026, à tarde): ela fala de
       * vencimento e de mês em aberto, e de uma escola que já não existe isso não é informação —
       * é ruído com aparência de conta. Quem lê o extrato dela quer o histórico, e o histórico
       * está na tabela. */
      (expurgada ? '' : '<p>' + esc(c.frase || '')
      /* O AVISO DO ENSAIO TAMBÉM NO PAINEL (17/11/2026). Os meses que aqui aparecem passam a ser os
       * que a escola vê — e em 17/11 de 2026 «dezembro» não existe. Sem esta linha, quem concilia
       * veria meses futuros a mais e não saberia de onde vêm; com ela, sabe que são de ensaio e
       * que o que se paga ali não é cobrança. */
      + (emEnsaio
        ? ' <span class="selo discreto">em ensaio: ' + esc(String(c.ensaio.minutosPorPeriodo))
          + ' min por período</span>' : '')
      + '</p>') +
      '<div class="ficha">' +
      '<span>Plano: <strong>' + esc(c.planoNome || '—') + '</strong></span>' +
      '<span>Mensalidade: <strong>' + (c.valorCentavos ? 'R$ ' + emReais(c.valorCentavos) : '—') + '</strong></span>' +
      /* A FRANQUIA DE AULAS — O PRIMEIRO NÚMERO DA FICHA (17/11/2026). O eixo comercial passou a
       * ser a aula (§ADITIVO §1), e é ele que se lê antes de tudo: quanto a escola tem e quanto
       * usou. Quando a contagem do mês não existe, o `Consumo` NÃO se mostra — dizer «0 de 100»
       * sobre uma contagem que não se fez seria afirmar que a escola não trabalhou. */
      '<span>Franquia: <strong>' + (c.franquia && c.franquia.franquia
        ? c.franquia.franquia + ' aulas/mês' : '—') + '</strong></span>' +
      (c.franquia && c.franquia.usadas != null && c.franquia.franquia
        ? '<span>Consumo do mês: <strong>' + esc(String(c.franquia.usadas)) + ' de '
          + esc(String(c.franquia.franquia)) + '</strong>'
          + (c.franquia.excedente > 0
            ? ' <span class="selo falha">' + esc(String(c.franquia.excedente)) + ' excedente(s)</span>'
            : (c.franquia.estado === 'perto' ? ' <span class="selo discreto">a chegar ao fim</span>' : ''))
          + '</span>'
        : '') +
      /* O EXCEDENTE EM REAIS, DISCRIMINADO (25/11/2026) — é a linha que ela pediu para poder
       * discriminar ao cliente: quantas aulas, por quanto, e quanto dá. E diz onde é cobrado, porque
       * o número sozinho não diz quando. O contador (`c.contadorDoMes`) é quem o calcula; aqui só se
       * mostra. Sem contagem não há linha — a mesma disciplina de sempre. */
      (c.contadorDoMes && c.contadorDoMes.excedenteAulas > 0
        ? '<span>Excedente de aulas: <strong>'
          + esc(c.contadorDoMes.excedenteAulas + ' × R$ '
            + (c.contadorDoMes.precoDaAulaCentavos / 100).toFixed(2).replace('.', ',')) + ' = R$ '
          + esc((c.contadorDoMes.excedenteCentavos / 100).toFixed(2).replace('.', ','))
          + '</strong> <span class="sub">(cobrado no mês seguinte, além da mensalidade)</span></span>'
        : '') +
      /* AS REFERÊNCIAS DE GENTE SAÍRAM (17/11/2026) — «Isso não existe mais, esse tipo de
       * referência não existe mais.» O cartão dizia «Referência de tamanho» e «Além da
       * referência»; com a unidade comercial na aula, nenhum dos dois é uma promessa, e um número
       * de gente ao lado de um preço lê-se como se fosse parte dele. Fica o que se cobra: o plano,
       * a mensalidade, a franquia, o consumo e o vencimento. */
      /* O TOTAL EM MORA, quando há dívida (25/11/2026) — «a gente vai adotar a mesma política de
       * multa e juros que tem em conta de água, conta de luz». Aparece só quando há o que cobrar: um
       * «R$ 0,00 de mora» em toda a escola em dia é ruído que esconde o caso que importa. */
      (c.totalEmMoraCentavos > 0
        ? '<span>Em mora: <strong>' + reaisDeCentavos(c.totalEmMoraCentavos) + '</strong>'
          + ' <span class="sub">(mensalidades ' + reaisDeCentavos(c.totalEmMoraCentavos - c.encargosEmMoraCentavos)
          + ' + encargos ' + reaisDeCentavos(c.encargosEmMoraCentavos) + ')</span></span>'
        : '') +
      (c.proximoVencimento
        ? '<span>Próximo vencimento: <strong>' + esc(c.proximoVencimento) + '</strong>'
          + (c.diasParaVencer != null
            ? ' (' + (c.diasParaVencer >= 0
              ? 'em ' + c.diasParaVencer + ' dia(s)'
              : 'venceu há ' + Math.abs(c.diasParaVencer) + ' dia(s)') + ')'
            : '') + '</span>'
        : '') +
      '</div>' +
      corpoDaTabela +
      /* A CLÁUSULA DE QUITAÇÃO TAMBÉM AQUI (25/11/2026). Ela está na página da escola, que é quem
       * paga; e está também neste ecrã porque quem concilia é quem decide o que fazer com um valor
       * abaixo do devido. Uma regra que só um dos dois lados conhece produz a conversa em que
       * ninguém está a falar do mesmo número. A frase é a MESMA — vem do núcleo, e não se reescreve
       * aqui. Numa escola expurgada ela sai, como todo o resto que fala de dinheiro a receber. */
      (expurgada ? '' : '<p class="aviso">' + esc(mensalidades.CLAUSULA_DE_QUITACAO) + '</p>') +
      /* AS ACÇÕES DE COBRANÇA NÃO EXISTEM NUMA ESCOLA EXPURGADA (23/11/2026, à tarde):
       * informar pagamento, ligar o ensaio e mudar o contrato gravam sobre o registo
       * comercial, e uma escola expurgada perdeu-o no expurgo. O botão gravaria um contrato
       * novo para uma escola que já não existe — e o extrato dela passaria a ter meses a
       * cobrar sobre um pagamento que ninguém vai fazer. */
      (expurgada ? '' :
        /* INFORMAR UM PAGAMENTO — O CAMPO QUE FALTAVA (17/11/2026).
         *
         * «Pedi para parar porque você não colocou a conciliação no financeiro do
         * danca.padd.com.br. Por isso não consegui informar o pagamento.»
         *
         * O BOTÃO DE CADA LINHA só existe para um mês QUE JÁ ESTÁ no extrato. Quando o mês que a
         * escola está a pagar ainda não nasceu do lado de quem concilia — um pagamento adiantado, ou
         * um mês que o relógio de ensaio abriu — não havia linha, logo não havia botão, e não havia
         * caminho nenhum. Este campo é o caminho: escolhe-se o mês, e ele é registado com o valor e o
         * plano do contrato em vigor — a mesma conta do servidor, não uma segunda.
         *
         * ELE NÃO SUBSTITUI O BOTÃO DA LINHA: os dois chamam a mesma rota. O botão da linha é o
         * gesto rápido do caso comum; o campo é a saída quando o mês não está à vista.
         *
         * O `type="month"` é o campo nativo, e o seu valor é `AAAA-MM` — exactamente a competência
         * que o livro guarda. Um campo de texto livre obrigaria a validar o formato à mão, e o
         * formato é a única coisa que este campo tem de acertar.
         *
         * O NOME DA ESCOLA ENTROU NO RÓTULO (26/11/2026). «Eu vou ter N escolas […] nesse botão
         * marcar como pago, me parece que eu tô marcando como pago um lote todas. E eu não sei dizer
         * aqui por meio desse bloco qual é a escola que eu tô marcando como pago. Eu sei apenas
         * dizer o mês e marcar como pago, mas a escola não.»
         *
         * O diagnóstico dela está certo, e a causa é de composição: este bloco usa a MESMA peça da
         * barra de filtros da página (`.caixa.filtrar`), fica no FUNDO do cartão — depois da tabela
         * e da cláusula — e com dez cartões abertos o resumo com o nome já saiu do ecrã. Um controle
         * que se parece com o da página inteira e não diz de quem é lê-se como se fosse de todas.
         *
         * O RÓTULO NOMEIA A ESCOLA, e é o sítio certo: é ele que já está colado ao campo e ao botão,
         * e é ele que o leitor de ecrã anuncia ao chegar ao mês. O nome não se repete no botão —
         * dois nomes no mesmo gesto não o tornam mais claro, tornam-no mais longo. */
        '<div class="caixa filtrar">' +
        '<div class="campo-filtro">' +
        '<label class="campo-rotulo" for="pagar-mes-' + esc(c.escola) + '">Informar um pagamento de ' +
        '<strong>' + esc(c.nome || c.escola) + '</strong> — mês</label>' +
        '<input id="pagar-mes-' + esc(c.escola) + '" type="month" data-pagamento-mes="' +
        esc(c.escola) + '" value="' + esc(c.mesDeHoje || '') + '">' +
        '</div>' +
        '<button type="button" class="acao" data-pagamento-gravar="' + esc(c.escola) + '">' +
        'Marcar como pago</button>' +
        '</div>' +
        '<p class="aviso" data-pagamento-recado="' + esc(c.escola) + '" hidden></p>' +
        /* O ENSAIO — LIGAR E DESLIGAR AQUI, E NÃO NA PÁGINA DA ESCOLA (17/11/2026).
         *
         * «O botão de ativar ou desativar o ensaio deve ficar no danca.padd.com.br/financeiro e o
         * tempo deve ser de 10 minutos para cada mês. Eu ativo e desativo.»
         *
         * O CONTROL É DE QUEM CONCILIA. Ele nasceu do outro lado, na página da escola, e o argumento
         * era a saída de emergência — que cai quando a saída passa a ser um botão aqui. O que fica a
         * valer é o contrário: um ensaio que a escola desliga não é um ensaio que a operação
         * controla. A página da escola continua a DIZER que está em ensaio; deixa de o poder mudar.
         *
         * UM BOTÃO SÓ, QUE MUDA DE RÓTULO, e não dois: dois botões em que um está sempre inerte
         * obrigam a ler os dois para saber em que estado se está. O rótulo diz o tempo (dez minutos)
         * porque é isso que a pessoa precisa de saber antes de carregar. */
        '<div class="caixa filtrar">' +
        '<p class="campo-filtro"><span class="campo-rotulo">Relógio de ensaio</span>' +
        '<span class="sub">' + (emEnsaio
          ? 'ligado — cada período vale ' + esc(String(c.ensaio.minutosPorPeriodo)) + ' min, '
            + 'e os meses que aqui aparecem são de ensaio'
          : 'desligado — a cobrança é mensal') + '</span></p>' +
        '<button type="button" class="acao ' + (emEnsaio ? 'secundario' : '') + '" ' +
        (emEnsaio ? 'data-ensaio-desligar' : 'data-ensaio-ligar') + '="' + esc(c.escola) + '">' +
        (emEnsaio ? 'Desligar o ensaio'
          : 'Ligar o ensaio — ' + ENSAIO_PADRAO_MINUTOS + ' minutos por mês') + '</button>' +
        '</div>' +
        '<p class="aviso" data-ensaio-recado="' + esc(c.escola) + '" hidden></p>' +
        /* O CONTRATO — upgrade, downgrade ou o mesmo plano com outra capacidade. As três coisas que
         * ela pediu: «eu posso fazer upgrade ou downgrade, e posso fazer a mesma coisa na capacidade,
         * upgrade ou downgrade ou nenhuma capacidade extra». */
        '<details class="acordeao"><summary>Mudar o plano ou a franquia</summary>' +
        '<div class="col-form" data-contrato="' + esc(c.escola) + '">' +
        '<p><label class="campo-rotulo" for="plano-' + esc(c.escola) + '">Plano</label>' +
        '<select id="plano-' + esc(c.escola) + '" data-contrato-plano>' + opcoesDoPlano(c.plano)
        + '</select></p>' +
        /* OS PACOTES DE AULAS — o eixo comercial de hoje (§ADITIVO §5). Cada um soma à franquia do
         * plano e entra na mesma mensalidade, porque a extensão é recorrente e «somar-se à franquia
         * do plano em cada renovação mensal». O rótulo diz as aulas e o preço; a regra que fixou os
         * preços (a aula da extensão custa mais do que a do plano de cima) está no `planos.json`. */
        '<fieldset class="escolhas"><legend class="campo-rotulo">Pacotes de aulas (na ' +
        'mensalidade)</legend>' + caixasDePacote(c.pacotes) + '</fieldset>' +
        /* OS LOTES DE GENTE SAÍRAM DO FORMULÁRIO (17/11/2026). «Aquele adicional antigo por lote
         * legado que já não se vende mais, a gente também vai tirar.» Eles ficaram aqui uma tarde —
         * o tempo de um contrato antigo poder ser reproduzido —, e ela decidiu: sai. Um campo que já
         * não se vende, num formulário de contrato, é um convite a vendê-lo outra vez.
         *
         * O QUE ACONTECE A UM CONTRATO ANTIGO: os `lotesProfessores`/`lotesAlunos` que ele guarda
         * continuam no registo (a história não se apaga), e deixam de ser reenviados quando o
         * contrato é gravado — porque o formulário já não os tem. É a consequência declarada de os
         * retirar, e a única escola com eles é de teste. */
        /* O QUE ESTÁ EM VIGOR, E DESDE QUANDO — imediatamente acima do botão, que é onde ela pediu
         * («uma linha acima do botão gravar o contrato»). Ver `linhaDoContratoEmVigor`. */
        linhaDoContratoEmVigor(c) +
        /* O BOTÃO NASCE DESLIGADO (25/11/2026). «O botão gravar o contrato, deixa ele habilitado
         * apenas se o plano vigente for editado. […] Aí quando mudar de plano ou mudar de pacote de
         * aula, aí sim habilita o botão gravar o contrato.»
         *
         * A ASSINATURA DO ESTADO INICIAL VAI NO PRÓPRIO BOTÃO (`data-contrato-assinatura`), e é a
         * única forma de a comparação ser entre o que a página abriu e o que a pessoa escolheu: um
         * `disabled` sem a memória do que estava lá desligava o botão para sempre, e o gesto de
         * «voltar ao que estava» deixava-o ligado — a pessoa gravava um contrato igual ao anterior
         * e a data da auditoria andava sem que nada tivesse mudado.
         *
         * O SERVIDOR GARANTE O MESMO (ver a rota `/api/financeiro/contrato`): um pedido sem
         * alteração não move o `contratadoEm`. A tela evita e o servidor garante — é a doutrina da
         * casa, e é o que impede um `POST` escrito à mão de reescrever a data. */
        '<p><button class="acao" type="button" data-contrato-gravar="' + esc(c.escola) + '"' +
        ' data-contrato-assinatura="' + esc(assinaturaDoContrato(c.plano, c.pacotes)) + '" disabled>' +
        'Gravar o contrato</button></p>' +
        '<p class="aviso" data-contrato-recado hidden></p>' +
        '<p class="sub">O mês em curso não muda por isto: o extrato guarda o que foi cobrado em cada ' +
        'mês, e o plano novo vale a partir da próxima mensalidade.</p>')
      + '</details>';
  };

  /* AS CONTAS, EMPILHADAS E PAGINADAS (16/11/2026). «A gente vai ter o Breu e depois o Calango e
   * depois a batata […] Tem que poder colapsar. E coloca uma paginação que exibe no máximo 10 por
   * página e que eu possa classificar em quantidades que eu quero exibir por página, 10, 20, 50 e
   * 100.»
   *
   * A PAGINAÇÃO É A DA CASA, e não uma nova: `motor/nucleo/paginacao.js` é a peça que a Produção
   * inventou e as páginas de lista já consomem — o `data-paginar`, o `data-por-pagina`, o rodapé
   * `.paginas` que nasce `hidden` (com uma página só ele não aparece, e sem JavaScript a lista
   * mostra tudo). A única coisa nova aqui é o SELECTOR de quantas por página: a peça lê o
   * `data-por-pagina`, portanto mudá-lo e chamar `paginar()` é tudo o que é preciso. */
  const blocos = contas.map((c) => '<li>' + cartaoDaConta(c) + '</li>').join('');
  const blocoDasContas = '<h2>Mensalidades, escola por escola</h2>' +
    (contas.length
      ? /* A BARRA DE CONTROLO usa as peças da casa e não inventa nenhuma: `.caixa.filtrar` é a
         * barra de campos em fileira que a Produção já usa, e `.campo-filtro` é o par rótulo+campo
         * dentro dela. O botão de dobrar alinha-se com os campos porque a barra já alinha ao fundo. */
        '<div class="caixa filtrar">' +
        '<div class="campo-filtro">' +
        '<label class="campo-rotulo" for="fi-por-pagina">Escolas por página</label>' +
        '<select id="fi-por-pagina" data-tamanho-de="fi-contas">' +
        [10, 20, 50, 100].map((n) => '<option value="' + n + '"'
          + (n === 10 ? ' selected' : '') + '>' + n + '</option>').join('') +
        '</select></div>' +
        '<button type="button" class="acao secundario" id="fi-dobrar">Recolher todas</button>' +
        '</div>' +
        '<div data-paginar data-por-pagina="10" id="fi-contas">' +
        '<ul class="trio-lista">' + blocos + '</ul>' +
        paginacao.marcacao() +
        '</div>'
      : '<div class="caixa nota"><h2>Nenhuma escola viva para cobrar</h2>' +
        '<p>Uma escola aparece aqui assim que existir. Uma lista vazia quer dizer que nenhuma ' +
        'existe, não que a leitura falhou.</p></div>');

  /* OS DADOS DA ESCOLA — a lista que responde «com quem falo, e com que CNPJ» (23/11/2026).
   *
   * O QUE ELA PEDIU: «eu preciso de uma lista dos nomes da escola, do professor da escola, uma
   * tabela que mostra o nome da escola, o professor da escola, o telefone da escola […] e ali eu
   * consigo então entrar em contato com a escola, saber qual é o CNPJ dela e me mexer atrás dela.»
   *
   * A LISTA TEM AS VIVAS **E** AS EXPURGADAS, e isso não é descuido: o caso que a levou a pedir
   * esta aba é o de uma escola que deve há muito tempo e foi expurgada — depois do expurgo é que se
   * precisa do CNPJ. Por isso a coluna «Situação» existe, e por isso a coluna «Origem» existe: ela
   * diz se o dado é do cadastro de agora ou do registo que o expurgo guardou antes de apagar.
   *
   * E DIZ QUANDO NÃO HÁ NADA. As escolas expurgadas antes de hoje perderam o cadastro para sempre
   * (o expurgo apagava `bastidores/<slug>/cadastro`, e o cadastro nunca esteve no Git — o
   * `check-indices` proíbe e-mail e telefone nos índices do acervo). Uma célula com um traço é a
   * verdade; um número deduzido do slug seria uma mentira com aparência de dado.
   *
   * «COMO FALAR» usa as MESMAS duas formas da página dos Contactos — `mailto:` e `wa.me` —, e não
   * uma terceira: quem já sabe clicar num telefone naquele ecrã sabe clicar neste. A função passou
   * a viver fora daqui a 23/11/2026, quando a página dos Professores passou a usá-la: uma regra,
   * um sítio (`comoFalar`, no módulo). */

  /* ── O PROFESSOR É UMA LIGAÇÃO, E O DOCUMENTO DELE NÃO MORA AQUI (23/11/2026) ────────────
   *
   * Palavras dela: «Você colocou o professor com o CNPJ ou CPF dele logo abaixo, né? Você vai mudar
   * isso. Aqui você vai colocar o professor apenas como sendo um link que leva lá para o espaço de
   * professores em dança.padd.com.br/professores.»
   *
   * E A RAZÃO É DE ARRUMAÇÃO, não de gosto: esta aba responde «quem é a escola, e como falo com
   * ela». O documento da PESSOA respondia a uma segunda pergunta na mesma célula, e a segunda
   * pergunta tem casa própria — a lista dos professores, onde o cadastro dele está inteiro. Um dado
   * em dois sítios é um dado que vai discordar de si mesmo no dia em que só um for corrigido.
   *
   * O NOME VEM ANTES DO SLUG: quando o cadastro não tem o nome, mostra-se o slug, que é a
   * identidade verdadeira — e não um traço, que esconderia que há uma pessoa ali. */
  const linhaDaFicha = (f) => '<tr>' +
    '<td><strong>' + esc(f.nome || f.escola) + '</strong>' +
      (f.nome && f.escola && f.nome !== f.escola
        ? ' <span class="dono">(' + esc(f.escola) + ')</span>' : '<br><span class="dono">' +
        esc(f.escola) + '</span>') + '</td>' +
    '<td>' + (f.professor
      ? '<a href="/professores">' + esc(f.professorNome || f.professor) + '</a>'
      : '—') + '</td>' +
    '<td>' + semDado(f.cnpj) + '</td>' +
    '<td>' + (comoFalar(f.email, f.telefone) || '—') + '</td>' +
    '<td>' + (comoFalar(f.professorEmail, f.professorTelefone) || '—') + '</td>' +
    '<td>' + (f.expurgada
      ? '<span class="selo discreto">expurgada</span>'
        + (f.expurgadaEm ? '<br><span class="dono">' + esc(quando(f.expurgadaEm)) + '</span>' : '')
      : '<span class="selo ok">viva</span>') + '</td>' +
    '<td>' + (f.fonte === 'vivo'
      ? '<span class="selo discreto">cadastro</span>'
      : (f.fonte === 'herdado'
        ? '<span class="selo discreto" title="repôs-se o cadastro que o expurgo guardou'
          + (f.herdadoDe && f.herdadoDe.em ? ', de ' + esc(quando(f.herdadoDe.em)) : '')
          + '">herdado do expurgo</span>'
        : (f.fonte === 'expurgo'
          ? '<span class="selo discreto">guardado no expurgo</span>'
          : '<span class="selo alerta">sem cadastro</span>'))) + '</td>' +
    '</tr>';

  const semDados = fichas.filter((f) => f.fonte === 'nenhum');
  const blocoDosDados = '<h2>Os dados da escola</h2>' +
    '<p>O nome, o CNPJ e os contactos de cada escola — os dela e os do professor responsável. ' +
    'A lista tem as vivas <strong>e as expurgadas</strong>: é depois de uma escola sair que o CNPJ ' +
    'dela faz falta, para cobrar ou para acionar quem deve. O <strong>professor</strong> é uma ' +
    'ligação: o cadastro dele — documento e contactos — está na página dos professores.</p>' +
    (fichas.length
      ? tabelaPaginada('pa-lista-dados', '<table>' +
        '<thead><tr><th>Escola</th><th>Professor</th><th>CNPJ</th><th>Contacto da escola</th>' +
        '<th>Contacto do professor</th><th>Situação</th><th>Origem</th></tr></thead>' +
        '<tbody>' + fichas.map(linhaDaFicha).join('') + '</tbody></table>' +
        '<p class="aviso">«Origem» diz de onde vem o que está escrito: <strong>cadastro</strong> é o ' +
        'que a escola declarou; <strong>herdado do expurgo</strong> é o cadastro que a recriação ' +
        'repôs a partir do registo guardado — os mesmos dados, que a escola não voltou a declarar; ' +
        '<strong>guardado no expurgo</strong> é o registo de uma escola que já não existe. ' +
        '«—» é ausência de dado, e não um zero.</p>' +
        (semDados.length
          ? '<p class="aviso">' + semDados.length + ' escola(s) sem cadastro nenhum: ' +
            semDados.map((f) => esc(f.escola)).join(', ') +
            '. São expurgos anteriores a 23/11/2026 — o cadastro delas foi apagado com o expurgo e ' +
            'nunca esteve no repositório (o índice do acervo não guarda e-mail nem telefone). ' +
            'Não há como os recuperar; daqui em diante, o registo fica.</p>'
          : ''), 'Escolas por página')
      : '<div class="caixa nota"><h2>Nenhuma escola cadastrada</h2>' +
        '<p>Uma escola aparece aqui assim que existir. Uma lista vazia quer dizer que nenhuma ' +
        'existe, não que a leitura falhou.</p></div>');

  /* TRÊS ABAS, CADA ASSUNTO NA SUA (16/11/2026).
   *
   * «Aqui também você vai organizar em abas […] considera um desconto, é aba. A parte da mensalidade
   * e escola por escola, aqui você vai colocar também isto em abas […] Essa chave de receber o
   * pagamento você também vai colocar numa aba. Então cada um desses vai viver em uma aba.»
   *
   * A ORDEM É A DO TRABALHO: primeiro as mensalidades (é o que se abre todos os meses, e é a
   * pergunta «quem está em dia?»), depois a chave — que se configura raramente —, e por último os
   * descontos, que são a excepção. A aba que abre é a primeira, e é a que ela vai querer ver.
   *
   * A TIRA É A MESMA PEÇA dos Professores, da Audição e de «A escola» — `.abas`/`.aba`, na folha.
   * O motor é desta página (`SCRIPT_DAS_ABAS`), e o contrato com a folha são as marcas:
   * `role="tab"`, `aria-selected` e o painel `hidden`. */
  /* A QUARTA ABA ENTRA NO FIM, E NÃO NO PRINCÍPIO (23/11/2026): ela é consulta, e não trabalho
   * do dia. Quem abre o Financeiro vem ver «quem está em dia?» — a ordem das outras três é essa, e
   * uma tabela de contactos à frente delas empurraria o trabalho para o segundo clique. */
  const abas = [['mensalidades', 'Mensalidades'], ['chave', 'A chave Pix'],
    ['descontos', 'Os descontos'], ['dados', 'Os dados da escola']];
  const tira = '<nav class="abas" role="tablist" aria-label="Financeiro — seções" id="fi-abas">' +
    abas.map(([n, titulo], i) => '<button type="button" class="aba" role="tab" id="fi-aba-' + n + '" ' +
      'data-aba="' + n + '" aria-controls="fi-painel-' + n + '" ' +
      'aria-selected="' + (i === 0 ? 'true' : 'false') + '" tabindex="' + (i === 0 ? '0' : '-1') + '">' +
      esc(titulo) + '</button>').join('') +
    '</nav>';
  const painel = (n, corpo, primeiro) => '<div class="aba-painel" id="fi-painel-' + n + '" ' +
    'role="tabpanel" aria-labelledby="fi-aba-' + n + '" tabindex="0"' + (primeiro ? '' : ' hidden') + '>' +
    corpo + '</div>';

  return pagina({
    titulo: 'Financeiro',
    subtitulo: 'A chave que recebe os pagamentos, as mensalidades de cada escola e os descontos ' +
      'concedidos. A conciliação é manual: o pagamento entra nesta conta e é conferido à mão.',
    atual: 'financeiro',
    corpo: tira +
      painel('mensalidades', blocoDasContas, true) +
      painel('chave', blocoDaChave, false) +
      painel('descontos', blocoDoDesconto + tabela, false) +
      painel('dados', blocoDosDados, false) +
      SCRIPT_DAS_ABAS + SCRIPT_DAS_CONTAS +
      SCRIPT_DO_FINANCEIRO +
      '<p><a class="acao secundario" href="/">Voltar ao painel</a></p>',
  });
}

/**
 * O MOTOR DAS ABAS DO PAINEL — o mesmo contrato da Produção, em duas dúzias de linhas.
 *
 * O `motorDeAbas` da Produção (em `bastidores.js`) tem a folha do telemóvel, o teclado e o
 * `pode(n)`; aqui não há nada disso — o painel é uma página de trabalho no computador, com três
 * abas que abrem sempre. Copiar aquele motor inteiro seria trazer três funcionalidades que esta
 * página não usa; escrever um segundo motor com outras marcas seria o defeito que a peça na folha
 * existe para impedir. O que é comum — e é o que importa — são as MARCAS, e são as mesmas:
 * `aria-selected` na aba, `hidden` no painel.
 */
/**
 * O SELECTOR DE QUANTAS POR PÁGINA, E O «RECOLHER TODAS» (16/11/2026).
 *
 * Nenhum dos dois precisa do servidor: a paginação lê `data-por-pagina` do painel, e as dobras são
 * `<details>` no DOM. Mudar os dois por `fetch` faria a página recarregar para esconder texto que já
 * está ali — e é o oposto do que ela pediu ao dizer «tem que poder colapsar».
 *
 * O BOTÃO DIZ O QUE FAZ, e não onde está: «Recolher todas» / «Expandir todas» segue o estado do que
 * está à vista, e não o da última vez. Um botão que não muda de rótulo obriga a clicar para saber.
 */
const SCRIPT_DAS_CONTAS = '<script>(function(){' +
  /* O SELECTOR JÁ NÃO VIVE AQUI (17/11/2026). Ele esteve neste script desde 16/11 — e enquanto
   * foi o único, era só feio. Quando o «mês a mês» da escola passou a precisar do mesmo selector,
   * passou a ser a segunda cópia do mesmo comportamento, e a segunda cópia é sempre a que ninguém
   * se lembra de corrigir: a peça do núcleo já lê `data-tamanho-de` e trata do `change`. O select
   * declara de QUEM é (`data-tamanho-de="fi-contas"`) e não precisa de mais nada.
   *
   * A prova apanhou isto: apagar a peça deixava esta página a funcionar na mesma. Uma página que
   * passa por duas razões não prova nenhuma delas. */
  'var painel=document.getElementById("fi-contas");' +
  'var botao=document.getElementById("fi-dobrar");' +
  'function dobras(){return painel?painel.querySelectorAll("details"):[];}' +
  'function todasAbertas(){' +
  '  var d=dobras();for(var i=0;i<d.length;i++){if(!d[i].open)return false;}return d.length>0;' +
  '}' +
  'function rotular(){if(botao)botao.textContent=todasAbertas()?"Recolher todas":"Expandir todas";}' +
  'if(botao){' +
  '  botao.addEventListener("click",function(){' +
  '    var abrir=!todasAbertas(),d=dobras();' +
  '    for(var i=0;i<d.length;i++)d[i].open=abrir;' +
  '    rotular();' +
  '  });' +
  '  painel.addEventListener("toggle",rotular,true);' +
  '  rotular();' +
  '}' +
  '})();</script>';

const SCRIPT_DAS_ABAS = '<script>(function(){' +
  'var tira=document.getElementById("fi-abas");if(!tira)return;' +
  'var abas=tira.querySelectorAll("[data-aba]");' +
  'function abrir(nome){' +
  '  for(var i=0;i<abas.length;i++){' +
  '    var b=abas[i],k=b.getAttribute("data-aba"),eu=k===nome;' +
  '    b.setAttribute("aria-selected",eu?"true":"false");' +
  '    b.setAttribute("tabindex",eu?"0":"-1");' +
  '    var p=document.getElementById("fi-painel-"+k);' +
  '    if(p)p.hidden=!eu;}' +
  '}' +
  'tira.addEventListener("click",function(e){' +
  '  var b=e.target.closest?e.target.closest("[data-aba]"):null;' +
  '  if(!b||!tira.contains(b))return;abrir(b.getAttribute("data-aba"));' +
  '});' +
  /* O TECLADO — `role="tablist"` promete-o. Sem isto, quem usa leitor de ecrã confia numa promessa
   * que não existe; é a mesma regra da Produção. */
  'tira.addEventListener("keydown",function(e){' +
  '  var i=-1;for(var k=0;k<abas.length;k++){if(abas[k]===document.activeElement)i=k;}' +
  '  if(i<0)return;' +
  '  var n=i;' +
  '  if(e.key==="ArrowRight")n=(i+1)%abas.length;' +
  '  else if(e.key==="ArrowLeft")n=(i-1+abas.length)%abas.length;' +
  '  else if(e.key==="Home")n=0;' +
  '  else if(e.key==="End")n=abas.length-1;' +
  '  else return;' +
  '  e.preventDefault();abrir(abas[n].getAttribute("data-aba"));abas[n].focus();' +
  '});' +
  '})();</script>';

/**
 * O JAVASCRIPT DO FINANCEIRO.
 *
 * SEM RECARREGAR A PÁGINA ao guardar a chave: o resultado é o estado do próprio campo, e um
 * `location.reload()` depois de gravar faria a pessoa perder o sítio onde estava para lhe mostrar
 * o que ela acabou de escrever. A listagem do desconto, essa, recarrega — porque o que muda é uma
 * tabela, e uma tabela refeita no cliente seria uma segunda composição da mesma linha.
 */
const SCRIPT_DO_FINANCEIRO = '<script>(function(){' +
  'function recado(id,t,erro){var cx=document.getElementById(id);if(!cx)return;' +
  'cx.hidden=!t;cx.textContent=t||"";cx.className=erro?"aviso alerta":"aviso";}' +
  'function valor(id){var e=document.getElementById(id);return e?e.value:"";}' +
  'var gravar=document.getElementById("pix-gravar");' +
  'if(gravar)gravar.addEventListener("click",function(){' +
  '  gravar.disabled=true;recado("pix-recado","a guardar…",false);' +
  '  fetch("/api/financeiro/pix",{method:"POST",headers:{"Content-Type":"application/json"},' +
  '    body:JSON.stringify({chave:valor("pix-chave"),titular:valor("pix-titular")}),cache:"no-store"})' +
  '  .then(function(r){return r.json().catch(function(){return {};});})' +
  '  .then(function(d){gravar.disabled=false;' +
  '    if(d&&d.ok){recado("pix-recado","Chave guardada. É esta que o formulário de criar escola mostra.",false);return;}' +
  '    recado("pix-recado",(d&&d.erro)||"não foi possível guardar a chave",true);})' +
  '  .catch(function(){gravar.disabled=false;recado("pix-recado","falha de rede — nada foi alterado",true);});' +
  '});' +
  'var conceder=document.getElementById("desconto-gravar");' +
  'if(conceder)conceder.addEventListener("click",function(){' +
  '  conceder.disabled=true;recado("desconto-recado","a conceder…",false);' +
  '  fetch("/api/financeiro/desconto",{method:"POST",headers:{"Content-Type":"application/json"},' +
  '    body:JSON.stringify({escola:valor("desconto-escola"),valor:valor("desconto-valor"),' +
  '      motivo:valor("desconto-motivo")}),cache:"no-store"})' +
  '  .then(function(r){return r.json().catch(function(){return {};});})' +
  '  .then(function(d){if(d&&d.ok){location.reload();return;}conceder.disabled=false;' +
  '    recado("desconto-recado",(d&&d.erro)||"não foi possível conceder o desconto",true);})' +
  '  .catch(function(){conceder.disabled=false;recado("desconto-recado","falha de rede — nada foi alterado",true);});' +
  '});' +
  'var retirar=document.querySelectorAll("[data-retirar-desconto]");' +
  'for(var i=0;i<retirar.length;i++)(function(b){' +
  '  b.addEventListener("click",function(){' +
  '    var escola=b.getAttribute("data-retirar-desconto");if(!escola)return;' +
  '    b.disabled=true;' +
  '    fetch("/api/financeiro/desconto",{method:"DELETE",headers:{"Content-Type":"application/json"},' +
  '      body:JSON.stringify({escola:escola}),cache:"no-store"})' +
  '    .then(function(r){return r.json().catch(function(){return {};});})' +
  '    .then(function(d){if(d&&d.ok){location.reload();return;}b.disabled=false;' +
  '      recado("desconto-recado",(d&&d.erro)||"não foi possível retirar",true);})' +
  '    .catch(function(){b.disabled=false;recado("desconto-recado","falha de rede — nada foi alterado",true);});' +
  '  });' +
  '})(retirar[i]);' +
  /* ── MARCAR UM MÊS COMO PAGO (16/11/2026) ──────────────────────────────────────────────
   *
   * «Tem um botão que indica se foi pago. Quando eu clicar ali que foi pago aquele mês, então vai
   * ter ali também a data do pagamento.» O botão NÃO pergunta nada: o gesto é a confirmação, e uma
   * caixa de «tem a certeza?» a mais num ecrã que se usa todos os meses é ruído. O que ele faz é
   * desligar-se enquanto o pedido corre e, quando volta, RECARREGAR — porque a linha muda de
   * estado, de data e de valor, e repô-la à mão seria uma segunda cópia da regra que a desenha.
   *
   * «NÃO PAGO» NÃO EXISTE, e ela foi directa: «não tem como eu clicar e dizer não pago, isso não
   * existe». Desfazer um pagamento é correcção de contabilidade, e não um botão ao lado do que
   * paga — um par de botões iguais em que um mente é pior do que um caminho só. */
  /* O CAMPO DO VALOR É LIDO AQUI, E SÓ AQUI (25/11/2026). A linha tem um campo com o que se deve
   * hoje, e é o que ele diz que viaja — não o devido, que é conta do servidor. O que a página faz
   * com o número é TRANSMITI-LO: quem compara é a rota, com o devido calculado do outro lado. Uma
   * comparação aqui seria uma segunda regra, e a que ficava a valer era a que ninguém confere. */
  /* ── O PARSER DO DINHEIRO, e ele tem uma armadilha que custou uma prova vermelha ────────
   *
   * Esta função viaja como TEXTO dentro de uma string de JavaScript, e por isso uma barra
   * invertida aqui não é o que parece: `'\d'` numa string de aspas simples é `d`, não o dígito.
   * A primeira versão escrevia `/\d/` e chegava ao browser como `/[^d.,]/g` — que apaga tudo o que
   * não seja a letra `d`, a vírgula ou o ponto, e transforma «173,81» em «,81». O campo parecia
   * certo, o botão não fazia nada, e nenhum teste de topo o via porque o texto emitido é válido.
   * Daí `\\d` no fonte: são as duas barras que o browser precisa de receber.
   *
   * A REGRA, e são só três casos: o ÚLTIMO separador é o decimal quando tem uma ou duas casas
   * depois dele («173,8», «1.734,81»); com três casas é separador de milhares («1.734»); e um
   * campo que fica vazio de dígitos devolve `null` — «não se entende», que é uma resposta melhor
   * do que um zero inventado. */
  'function centavosDe(txt){' +
  '  var t=String(txt==null?"":txt).replace(/[^\\d.,]/g,"");' +
  '  if(!/\\d/.test(t))return null;' +
  '  var corte=Math.max(t.lastIndexOf(","),t.lastIndexOf("."));' +
  '  if(corte>=0&&t.slice(corte+1).replace(/[.,]/g,"").length>2){corte=-1;}' +
  '  var inteiro=(corte>=0?t.slice(0,corte):t).replace(/[.,]/g,"");' +
  '  var fracao=corte>=0?t.slice(corte+1).replace(/[.,]/g,""):"";' +
  '  while(fracao.length<2){fracao+="0";}' +
  '  return parseInt(inteiro||"0",10)*100+parseInt(fracao.slice(0,2)||"0",10);' +
  '}' +
  'var pagar=document.querySelectorAll("[data-pagar]");' +
  'for(var j=0;j<pagar.length;j++)(function(b){' +
  '  b.addEventListener("click",function(){' +
  '    var escola=b.getAttribute("data-pagar"),mes=b.getAttribute("data-mes");' +
  '    if(!escola||!mes)return;' +
  '    var linha=b.parentNode;' +
  '    var campo=linha?linha.querySelector("[data-pagar-valor]"):null;' +
  '    var corpo={escola:escola,mes:mes};' +
  '    if(campo){' +
  '      var centavos=centavosDe(campo.value);' +
  '      if(centavos===null){alert("o valor recebido não se entende — escreva, por exemplo, 69,90");return;}' +
  '      if(centavos<=0){alert("um pagamento de R$ 0,00 não fecha um mês — deixe o mês em aberto");return;}' +
  '      corpo.recebidoCentavos=centavos;' +
  '    }' +
  '    b.disabled=true;b.textContent="a registar…";' +
  '    fetch("/api/financeiro/mensalidade",{method:"POST",headers:{"Content-Type":"application/json"},' +
  '      body:JSON.stringify(corpo),cache:"no-store"})' +
  '    .then(function(r){return r.json().catch(function(){return {};});})' +
  '    .then(function(d){' +
  '      if(d&&d.ok){' +
  /* O MÊS QUE FICOU A MEIO DIZ-SE ANTES DE RECARREGAR. Recarregar em silêncio deixaria a linha com
   * outro selo e a pessoa a perguntar-se se o clique pegou; e um valor abaixo do devido é
   * exactamente o caso em que ela precisa de saber que ainda falta. */
  '        if(d.parcial){alert("Registado. Faltam R$ "+((d.faltaCentavos||0)/100).toFixed(2).replace(".",",")' +
  '          +" — o mês continua em aberto.");}' +
  '        location.reload();return;}' +
  '      b.disabled=false;b.textContent="Marcar pago";' +
  '      alert((d&&d.erro)||"não foi possível registar o pagamento");})' +
  '    .catch(function(){b.disabled=false;b.textContent="Marcar pago";' +
  '      alert("falha de rede — nada foi alterado");});' +
  '  });' +
  '})(pagar[j]);' +
  /* ── INFORMAR UM PAGAMENTO PELO MÊS (17/11/2026) ─────────────────────────────────────────
   *
   * O caminho para o mês que ainda não tem linha. A rota é a MESMA do botão de cada linha — uma
   * segunda rota para o mesmo acto seria uma segunda conta do mesmo pagamento.
   *
   * O MÊS VEM DO CAMPO, e vai como está: o servidor valida-o (`AAAA-MM` que exista no calendário) e
   * recusa com a razão. Não se valida aqui uma segunda vez — um cliente que valida o que o servidor
   * valida é um sítio a mais para as duas regras divergirem.
   *
   * O RECADO É DA ESCOLA, e não da página: com dez escolas abertas, um aviso único mentiria sobre
   * qual delas mudou. */
  'var informar=document.querySelectorAll("[data-pagamento-gravar]");' +
  'for(var q=0;q<informar.length;q++)(function(b){' +
  '  b.addEventListener("click",function(){' +
  '    var escola=b.getAttribute("data-pagamento-gravar");if(!escola)return;' +
  '    var campo=document.querySelector(\'[data-pagamento-mes="\'+escola+\'"]\');' +
  '    var recado=document.querySelector(\'[data-pagamento-recado="\'+escola+\'"]\');' +
  '    function dizer(txt,erro){if(!recado)return;recado.hidden=!txt;recado.textContent=txt||"";' +
  '      recado.className=erro?"aviso alerta":"aviso";}' +
  '    var mes=campo?String(campo.value||"").trim():"";' +
  '    if(!/^[0-9]{4}-[0-9]{2}$/.test(mes)){dizer("escolha o mês a que o pagamento se refere",true);return;}' +
  '    b.disabled=true;dizer("a registar…",false);' +
  '    fetch("/api/financeiro/mensalidade",{method:"POST",headers:{"Content-Type":"application/json"},' +
  '      body:JSON.stringify({escola:escola,mes:mes}),cache:"no-store"})' +
  '    .then(function(r){return r.json().catch(function(){return {};});})' +
  '    .then(function(d){b.disabled=false;' +
  '      if(d&&d.ok){location.reload();return;}' +
  '      dizer((d&&d.erro)||"não foi possível registar o pagamento",true);})' +
  '    .catch(function(){b.disabled=false;' +
  '      dizer("falha de rede — nada foi alterado",true);});' +
  '  });' +
  '})(informar[q]);' +
  /* ── O ENSAIO, LIGADO E DESLIGADO DAQUI (17/11/2026) ────────────────────────────────────
   *
   * Um botão, dois sentidos, e a rota é uma só (`/api/financeiro/ensaio`): ligar manda os minutos,
   * desligar manda zero. Dois caminhos para o mesmo estado divergem no dia em que um deles muda.
   *
   * O RECADO É DA ESCOLA, como o do pagamento: com dez cartões abertos, um aviso único mentiria
   * sobre qual delas mudou. E a página RECARREGA ao conseguir — porque o que muda não é só o rótulo
   * do botão: o extrato inteiro ganha (ou perde) meses, e repô-lo à mão seria uma segunda cópia da
   * regra que o desenha. */
  'var ligarEnsaio=document.querySelectorAll("[data-ensaio-ligar],[data-ensaio-desligar]");' +
  'for(var w=0;w<ligarEnsaio.length;w++)(function(b){' +
  '  b.addEventListener("click",function(){' +
  '    var desligar=b.hasAttribute("data-ensaio-desligar");' +
  '    var escola=b.getAttribute(desligar?"data-ensaio-desligar":"data-ensaio-ligar");if(!escola)return;' +
  '    var recado=document.querySelector(\'[data-ensaio-recado="\'+escola+\'"]\');' +
  '    function dizer(txt,erro){if(!recado)return;recado.hidden=!txt;recado.textContent=txt||"";' +
  '      recado.className=erro?"aviso alerta":"aviso";}' +
  '    var rotulo=b.textContent;' +
  '    b.disabled=true;b.textContent=(desligar?"a desligar…":"a ligar…");dizer("",false);' +
  '    fetch("/api/financeiro/ensaio",{method:"POST",headers:{"Content-Type":"application/json"},' +
  '      body:JSON.stringify({escola:escola,minutosPorPeriodo:desligar?0:10}),cache:"no-store"})' +
  '    .then(function(r){return r.json().catch(function(){return {};});})' +
  '    .then(function(d){if(d&&d.ok){location.reload();return;}' +
  '      b.disabled=false;b.textContent=rotulo;' +
  '      dizer((d&&d.erro)||"não foi possível mudar o ensaio",true);})' +
  '    .catch(function(){b.disabled=false;b.textContent=rotulo;' +
  '      dizer("falha de rede — nada foi alterado",true);});' +
  '  });' +
  '})(ligarEnsaio[w]);' +
  /* ── O CONTRATO: PLANO E CAPACIDADE (16/11/2026) ───────────────────────────────────────
   *
   * A MESMA CONTA DO SERVIDOR, e não uma segunda: o plano vem do `select`, os lotes das caixas, e
   * é o `POST` que valida contra o catálogo. A página não calcula preço nenhum — o valor que
   * aparece no extrato é o que o servidor gravar. */
  /* O BOTÃO SÓ ACENDE COM MUDANÇA (25/11/2026). «Deixa ele habilitado apenas se o plano vigente for
   * editado […] Aí quando mudar de plano ou mudar de pacote de aula, aí sim habilita o botão.»
   *
   * A ASSINATURA É A MESMA REGRA DO SERVIDOR (`assinaturaDoContrato` em `painel-html.js` e a
   * comparação em `/api/financeiro/contrato`): `plano|ids ordenados`. Compara-se o que está agora
   * com o que a página ABRIU — e é por isso que a inicial vem escrita no botão. Um botão que ficasse
   * ligado depois de a pessoa voltar atrás gravava um contrato igual ao anterior, e a data da
   * auditoria andava sem que nada tivesse mudado.
   *
   * O `change` é ouvido na CAIXA (delegação), e não em cada campo: a caixa é uma por escola, e uma
   * caixa que ganhe um campo novo amanhã não precisa de mais um `addEventListener`. */
  'var assinarContrato=function(plano,pacotes){' +
  '  var ids=[];for(var i=0;i<pacotes.length;i++){if(pacotes[i])ids.push(pacotes[i]);}' +
  '  ids.sort();return String(plano||"")+"|"+ids.join(",");};' +
  'var estadoDoContrato=function(caixa){' +
  '  var s=caixa.querySelector("[data-contrato-plano]");' +
  '  var cs=caixa.querySelectorAll("[data-contrato-pacote]"),ids=[];' +
  '  for(var i=0;i<cs.length;i++){if(cs[i].checked)ids.push(cs[i].getAttribute("data-pacote"));}' +
  '  return assinarContrato(s?s.value:"",ids);};' +
  'var caixasDoContrato=document.querySelectorAll("[data-contrato]");' +
  'for(var q=0;q<caixasDoContrato.length;q++)(function(caixa){' +
  '  var botao=caixa.querySelector("[data-contrato-gravar]");if(!botao)return;' +
  '  var inicial=botao.getAttribute("data-contrato-assinatura")||"";' +
  '  var acertar=function(){botao.disabled=(estadoDoContrato(caixa)===inicial);};' +
  '  caixa.addEventListener("change",acertar);' +
  '  acertar();' +
  '})(caixasDoContrato[q]);' +
  'var gravarContrato=document.querySelectorAll("[data-contrato-gravar]");' +
  'for(var k=0;k<gravarContrato.length;k++)(function(b){' +
  '  b.addEventListener("click",function(){' +
  '    var escola=b.getAttribute("data-contrato-gravar");if(!escola)return;' +
  '    var caixa=b.closest("[data-contrato]")||document;' +
  '    var sel=caixa.querySelector("[data-contrato-plano]");' +
  /* OS LOTES DE GENTE SAÍRAM DO PEDIDO (17/11/2026). O formulário já não os desenha, logo este
   * script não tinha o que ler — e um `querySelectorAll` que devolve vazio é a forma mais fácil de
   * limpar, em silêncio, os lotes de um contrato antigo. Vão sempre vazios, e é a decisão. */
  /* OS PACOTES DE AULAS (17/11/2026) — o eixo comercial de hoje. Vão como a LISTA de ids marcados,
   * que é o que o servidor espera (`comercial.calcular({pacotes})`); a quantidade por pacote não se
   * manda porque o catálogo já a diz, e um número que viaja a mais é um número que pode divergir. */
  '    var pacotes=[],marcados=caixa.querySelectorAll("[data-contrato-pacote]");' +
  '    for(var n=0;n<marcados.length;n++){if(marcados[n].checked)pacotes.push(marcados[n].getAttribute("data-pacote"));}' +
  '    var recado=caixa.querySelector("[data-contrato-recado]");' +
  '    function dizer(txt,erro){if(!recado)return;recado.hidden=!txt;recado.textContent=txt||"";' +
  '      recado.className=erro?"aviso alerta":"aviso";}' +
  '    b.disabled=true;dizer("a gravar…",false);' +
  '    fetch("/api/financeiro/contrato",{method:"POST",headers:{"Content-Type":"application/json"},' +
  '      body:JSON.stringify({escola:escola,plano:sel?sel.value:"",' +
  '        lotesProfessores:[],lotesAlunos:[],pacotes:pacotes}),cache:"no-store"})' +
  '    .then(function(r){return r.json().catch(function(){return {};});})' +
  '    .then(function(d){b.disabled=false;' +
  /* RECARREGA, COMO O PAGAMENTO (17/11/2026). Antes dizia «Recarregue para ver o extrato» — e ela
   * recarregava e via o extrato IGUAL, porque o mês em curso não muda por desenho. Um recado que
   * manda fazer uma coisa que não muda nada lê-se como «não funcionou». Agora a página repinta-se
   * sozinha: o valor no topo do cartão muda, e é isso que mostra que ficou gravado. */
  '      if(d&&d.ok){location.reload();return;}' +
  '      dizer((d&&d.erro)||"não foi possível gravar o contrato",true);})' +
  '    .catch(function(){b.disabled=false;dizer("falha de rede — nada foi alterado",true);});' +
  '  });' +
  '})(gravarContrato[k]);' +
  /* ── A COBRANÇA PIX DE CADA MÊS (25/11/2026) ────────────────────────────────────────────
   *
   * «Eu preciso de uma outra coluna, que é onde eu vou colar o QR code ou a chave Pix. […] eu colo o
   * conteúdo que essa área Pix cobrança do meu banco me entrega.»
   *
   * O BOTÃO ACENDE COM A EDIÇÃO, e a assinatura inicial está escrita nele. É a mesma regra do
   * contrato, e pela mesma razão: um botão sempre pronto convida a carregar por rotina, e cada
   * carregamento é uma escrita de KV sobre um texto que não mudou.
   *
   * NÃO RECARREGA A PÁGINA. As outras ações do painel recarregam porque mudam o extrato (um
   * pagamento, um plano); esta muda UMA célula, e um recarregamento por cada mês colado seria uma
   * leitura de cada escola do índice — e a lista perderia a posição e o que estava escrito nos
   * outros meses. O que se faz é acertar a assinatura no botão e dizer «gravado» na própria linha.
   * É o mesmo cuidado que a página da escola teve com o seu próprio estado. */
  'var caixasDeCobranca=document.querySelectorAll("[data-cobranca-gravar]");' +
  'for(var cb=0;cb<caixasDeCobranca.length;cb++)(function(b){' +
  '  var escola=b.getAttribute("data-cobranca-gravar"),mes=b.getAttribute("data-mes");' +
  '  var campo=document.getElementById("cob-"+escola+"-"+mes);' +
  '  var recado=document.querySelector(\'[data-cobranca-recado="\'+escola+\'-\'+mes+\'"]\');' +
  '  function dizer(txt,erro){if(!recado)return;recado.hidden=!txt;recado.textContent=txt||"";' +
  '    recado.className=erro?"aviso alerta":"aviso";}' +
  '  if(!campo)return;' +
  '  campo.addEventListener("input",function(){' +
  '    b.disabled=(String(campo.value||"").trim()===String(b.getAttribute("data-cobranca-assinatura")||"").trim());' +
  '    dizer("",false);});' +
  '  b.addEventListener("click",function(){' +
  '    var texto=String(campo.value||"");' +
  '    b.disabled=true;dizer("a gravar…",false);' +
  '    fetch("/api/financeiro/cobranca",{method:"POST",headers:{"Content-Type":"application/json"},' +
  '      body:JSON.stringify({escola:escola,mes:mes,texto:texto}),cache:"no-store"})' +
  '    .then(function(r){return r.json().catch(function(){return {};});})' +
  '    .then(function(d){' +
  '      if(d&&d.ok){' +
  '        b.setAttribute("data-cobranca-assinatura",String(campo.value||"").trim());' +
  '        dizer(d.mudou?(d.apagada?"cobrança apagada":"cobrança gravada"):"nada mudou",false);' +
  '        return;' +
  '      }' +
  '      b.disabled=false;' +
  '      dizer((d&&d.erro)||"não foi possível gravar a cobrança",true);})' +
  '    .catch(function(){b.disabled=false;dizer("falha de rede — nada foi alterado",true);});' +
  '  });' +
  '})(caixasDeCobranca[cb]);' +
  '})();' +
  /* O «COPIAR» DESTA PÁGINA (25/11/2026). Ele era a peça que faltava: a coluna da cobrança emitia
   * o `[data-copiar]` e não havia ouvinte nenhum nesta página — «o copiar que tem também nesse
   * botão também não funciona. Precisa consertar, porque tem que funcionar o copiar». A rotina é a
   * do módulo, a mesma do nicho «Pagar» da escola e do mês a mês. */
  SCRIPT_DO_COPIAR +
  '</script>';

/**
 * O REGISTO DE UMA ESCOLA — o destino que o elo do expurgo não tinha.
 *
 * ATÉ 22/10/2026 o elo só existia dentro do processo: ficava em `escola/<slug>/indice.json`,
 * versionado, e nenhuma página o mostrava. Esta página lê ESSE arquivo — uma requisição — e mais
 * nada: ela não reconstrói o acervo, e é por isso que abre em vez de gerar.
 *
 * O QUE MOSTRA, e por que cada coisa: a IDENTIDADE (nome, pasta, professor), porque é o que liga
 * a memória à pasta que já não existe; as DATAS, porque é o «de quando a quando» que responde
 * «esta escola existiu»; e um bloco POR ELO — não só o último, porque uma escola pode ter sido
 * apagada, recriada e apagada outra vez, e a sequência É a proveniência. Cada elo diz o motivo,
 * os arquivos que saíram do repositório e o que ficou no KV.
 */
function paginaDoRegistro({ slug, indice }) {
  const elos = (indice && Array.isArray(indice.expurgo)) ? indice.expurgo : [];
  const eloDe = (e) => {
    const arquivos = Array.isArray(e.apagado) ? e.apagado : [];
    const kv = e.kv && typeof e.kv === 'object' ? e.kv : null;
    const linhas = arquivos.map((c) => '<tr><td><code>' + esc(c) + '</code></td></tr>').join('');
    const blocoKv = kv
      ? '<div class="caixa nota">' +
        '<h3>O que ficou no KV</h3>' +
        '<div class="ficha">' +
        '<span>' + (kv.ok === true ? 'limpeza completa' : 'limpeza pendente') + '</span>' +
        '<span>' + esc(String(kv.apagadas == null ? '—' : kv.apagadas)) + ' chave(s) apagada(s)</span>' +
        '<span>' + esc(String(kv.restantes == null ? '—' : kv.restantes)) + ' restante(s)</span>' +
        '</div>' +
        (kv.ok === true
          ? ''
          : '<p><strong>Há chaves por apagar.</strong> O expurgo tira a escola do ar e do ' +
            'repositório primeiro; a limpeza do KV é uma segunda metade, e a pendência vive ' +
            'neste elo justamente para poder ser retomada — foi o caso da <code>calango</code> em ' +
            '19/10/2026.</p>') +
        (Array.isArray(kv.prefixos) && kv.prefixos.length
          ? '<p>Prefixos: ' + kv.prefixos.map((p) => '<code>' + esc(p) + '</code>').join(', ') + '</p>'
          : '') +
        '</div>'
      : '';
    return '<div class="caixa">' +
      '<h2>Expurgo de ' + esc(quando(e.em)) + '</h2>' +
      '<div class="ficha">' +
      '<span>' + esc(e.motivo || 'motivo não declarado') + '</span>' +
      '<span>' + arquivos.length + ' arquivo(s) apagado(s)</span>' +
      '</div>' +
      (arquivos.length
        ? '<table><thead><tr><th>Caminho apagado do repositório</th></tr></thead>' +
          '<tbody>' + linhas + '</tbody></table>'
        : '<p>O elo não declara os caminhos — registo anterior ao inventário.</p>') +
      blocoKv +
      '</div>';
  };

  const identidade = '<div class="caixa">' +
    '<h2>Identidade</h2>' +
    '<div class="ficha">' +
    '<span>' + esc((indice && indice.escola) || slug) + '</span>' +
    '<span>pasta ' + esc(slug) + '</span>' +
    '<span>' + esc((indice && indice.professor && indice.professor.nome) || '—') + '</span>' +
    '<span>ciclo ' + esc((indice && indice.ciclo) || '—') + '</span>' +
    '</div>' +
    '<table><thead><tr><th>Existiu de</th><th>Até</th><th>Elos de expurgo</th></tr></thead><tbody><tr>' +
    '<td>' + esc(diaOuTraco(indice && indice.criado_em)) + '</td>' +
    '<td>' + esc(diaOuTraco(elos.length ? elos[elos.length - 1].em : null)) + '</td>' +
    '<td>' + elos.length + '</td>' +
    '</tr></tbody></table>' +
    (indice && Array.isArray(indice.recriacao) && indice.recriacao.length
      ? '<p><strong>Esta escola foi recriada ' + indice.recriacao.length + ' vez(es).</strong> ' +
        'A sequência completa está abaixo, do elo mais antigo ao mais recente — o expurgo não ' +
        'reescreve o que já passou.</p>'
      : '') +
    '</div>';

  return pagina({
    titulo: 'Escola apagada · ' + slug,
    subtitulo: 'O registo do expurgo, como ele ficou no índice da escola.',
    atual: 'escolas-apagadas',
    corpo: identidade +
      (elos.length
        ? elos.map(eloDe).join('')
        : '<div class="caixa nota"><h2>Sem elos</h2><p>O índice da escola existe, mas não há ' +
          'nenhum elo de expurgo nele — a escola não foi apagada por este caminho.</p></div>') +
      '<p><a class="acao secundario" href="/escolas-apagadas">Voltar à lista</a></p>',
  });
}

/**
 * A página de recusa — quando falta o `GITHUB_TOKEN` ou a leitura falha. DITA o motivo, em vez de
 * mostrar uma lista vazia, que se leria como «nenhuma escola» e seria falso.
 */
function paginaSemToken(motivo) {
  return pagina({
    titulo: 'Escolas do sistema',
    subtitulo: 'A gestão do sistema.',
    atual: '',
    corpo: '<div class="caixa falta">' +
      '<h2>Não consigo ler o repositório</h2>' +
      '<p>' + esc(motivo || 'Falta o <code>GITHUB_TOKEN</code> no Worker da raiz.') +
      ' Sem o índice não há lista — e uma lista vazia aqui diria «nenhuma escola», que seria ' +
      'falso.</p>' +
      '<p><a class="acao secundario" href="/">Tentar outra vez</a></p>' +
      '</div>',
  });
}

/**
 * A ÁREA DO CONSULTOR — `lastro.padd.com.br/consultor/<token>` (25/11/2026 — F2).
 *
 * O QUE ELA DIZ, nas palavras dela: «O consultor vai gerar esse link para N escolas que ele
 * consultar e fizer a implementação.» A página é o lugar onde ele gera. Tem três coisas e mais
 * nada — quem ele é, quantas visitas deu, e o botão que abre uma: um menu ao lado de um homem que
 * veio trabalhar seria três portas que não abrem.
 *
 * O QUE ELA **NÃO** MOSTRA: nenhuma escola do sistema, nenhum movimento, nenhum valor de ninguém.
 * Ele vê as visitas que ele próprio marcou, e só. É o que o plano declara — «ele não vê a lista de
 * escolas, o financeiro, nem o movimento de ninguém» —, e é a razão de esta página ser servida
 * pelo endereço público: ela não tem o painel atrás.
 *
 * O ENDEREÇO DO LINK APARECE UMA VEZ. O KV guarda o hash, e não o token: o servidor não consegue
 * mostrar outra vez o que não guarda. Por isso a caixa diz «aparece uma vez só» e tem um «Copiar»,
 * e um link perdido resolve-se com «Novo link» na linha da visita — que é um token novo para a
 * mesma visita, e não uma visita nova.
 *
 * SEM MENU, e pela mesma razão da página do convite: `navDoPainel` desenha os destinos do dono, e
 * um menu que leva a páginas que respondem 401 é pior do que não ter menu.
 */
function paginaDoConsultor({ consultor, token, visitas: lista, agora, suspenso, erro } = {}) {
  const quem = consultor || {};
  const nome = String(quem.nome || 'consultor');
  const praca = String(quem.praca || '').trim();

  /* O CASCO É DO CONVITE — `data-layout="documento"`, sem barra de painel. Duas páginas públicas
   * com o mesmo desenho, e não duas folhas. */
  const casco = (corpo, titulo) => '<!doctype html><html lang="pt-BR" data-paleta="verde">' +
    '<head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    /* NÃO SE INDEXA. É uma página de trabalho com um segredo no endereço — e um link que aparece
     * num motor de busca é um link que se gasta. */
    '<meta name="robots" content="noindex">' +
    '<title>' + esc(titulo) + ' · Sistema Lastro</title>' +
    '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">' +
    '<link rel="stylesheet" href="/assets/style.css">' +
    '</head><body id="top" data-layout="documento" data-tela="consultor">' +
    '<header class="doc"><h1>' + esc(titulo) + '</h1>' +
    '<p class="subtitulo">' + (praca ? esc('Consultoria · ' + praca) : 'Consultoria') + '</p></header>' +
    '<main><div class="conteudo">' + corpo + '</div></main>' +
    '</body></html>';

  /* ── NÃO CONSEGUI LER ─────────────────────────────────────────────────────────────────────────
   *
   * A TERCEIRA RESPOSTA, e a que não pode ser confundida com a primeira. Um KV que não responde não
   * é «este consultor não existe»: a página diz que não leu, e não mostra nada. A alternativa —
   * desenhar a área com zero visitas — diria a um consultor com trinta visitas que ele não tem
   * nenhuma, e era a mentira mais cara que esta página podia contar.
   */
  if (erro) {
    return casco('<div class="caixa falta">' +
      '<h2>Não consigo ler o registo agora</h2>' +
      '<p>' + esc(String(erro)) + '</p>' +
      '<p>Nada foi mostrado para não o fazer decidir sobre um registo que não foi lido. ' +
      'Tente outra vez dentro de um minuto.</p>' +
      '<p><a class="acao secundario" href="">Tentar outra vez</a></p>' +
      '</div>', 'Área do consultor');
  }

  /* ── O ACESSO SUSPENSO ────────────────────────────────────────────────────────────────────────
   *
   * DESACTIVAR FECHA A ÁREA DELE, e ela sabe-o porque foi ela que o decidiu. O que ele lê não é
   * «não encontrado»: é a frase que lhe diz a quem falar. Uma porta que se fecha em silêncio faz o
   * consultor pensar que o sistema se partiu, e ele liga-lhe a dizer isso.
   *
   * O QUE ELE **NÃO** VÊ AQUI: as visitas. Um acesso suspenso é um acesso suspenso — a lista fica
   * do lado de dentro da porta. */
  if (suspenso) {
    return casco('<div class="caixa falta">' +
      '<h2>O seu acesso está suspenso</h2>' +
      '<p>O acesso de <strong>' + esc(nome) + '</strong> à área de consultoria está inactivo. ' +
      'As visitas que já marcou continuam registadas — nada se perdeu —, mas não é possível gerar ' +
      'links novos enquanto o acesso estiver assim.</p>' +
      '<p>Escreva para a administração do Sistema Lastro e peça a reactivação. Ao reactivar, ' +
      'recebe um endereço novo: este deixa de valer.</p>' +
      '<p><a class="acao secundario" href="mailto:lastro@padd.com.br">Escrever para a administração</a></p>' +
      '</div>', 'Área do consultor');
  }

  const todas = Array.isArray(lista) ? lista : [];
  const r = consultores.resumoDasVisitas(todas, agora);

  const resumo = '<div class="caixa" id="consultor-resumo">' +
    '<h2>O que já foi feito</h2>' +
    '<p><strong>' + r.abertas + '</strong> ' + (r.abertas === 1 ? 'link aberto' : 'links abertos') +
    ' · <strong>' + r.criadas + '</strong> ' + (r.criadas === 1 ? 'escola nasceu' : 'escolas nasceram') +
    ' · <strong>' + r.expiradas + '</strong> ' + (r.expiradas === 1 ? 'expirado' : 'expirados') +
    '</p>' +
    /* O NÚMERO QUE ELE TEM DE VER. Um link expirado é uma visita que ele fez e que não vai contar —
     * e se ele não vir esse número aqui, descobre-o no dia em que a escola não aparece. */
    (r.expiradas
      ? '<p class="aviso">' + (r.expiradas === 1 ? 'Um link expirou' : r.expiradas + ' links expiraram')
        + ' sem a escola ter aberto. Um link vale ' + consultores.DIAS_DO_LINK + ' dias; na linha da '
        + 'visita, «Novo link» gera outro.</p>'
      : '') +
    '</div>';

  /* ── A VISITA NOVA ──────────────────────────────────────────────────────────────────────────── */
  const campo = (id, rotulo, tipo, dica) => '<p><label class="campo-rotulo" for="' + id + '">'
    + esc(rotulo) + '</label><input id="' + id + '" type="' + tipo + '"'
    + (dica ? ' placeholder="' + esc(dica) + '"' : '') + ' autocomplete="off"></p>';

  const formulario = '<div class="caixa" id="consultor-nova">' +
    '<h2>Uma visita nova</h2>' +
    '<p>Escreva o nome da escola como a conhece — é por ele que reconhece a visita nesta lista. ' +
    'O nome definitivo é o que a escola escrever ao abrir o link.</p>' +
    campo('consultor-escola', 'Escola', 'text', 'como a escola se chama') +
    campo('consultor-cidade', 'Cidade (opcional)', 'text', 'onde ela fica') +
    campo('consultor-data', 'Dia previsto (opcional)', 'date', '') +
    '<p><button class="acao" id="consultor-gerar" type="button">Gerar o link</button></p>' +
    '<p id="consultor-recado" role="status" class="aviso" hidden></p>' +
    '</div>';

  /* ── O LINK, QUE APARECE UMA VEZ ───────────────────────────────────────────────────────────── */
  const caixaDoLink = '<div class="caixa" id="consultor-link-caixa" hidden>' +
    '<h2>O link desta visita</h2>' +
    '<p><input id="consultor-link" type="text" readonly></p>' +
    '<p><button class="acao" type="button" data-copiar="consultor-link">Copiar o link</button></p>' +
    '<p class="aviso" id="consultor-link-aviso">Este endereço aparece <strong>uma vez só</strong>: ' +
    'o sistema guarda o resumo do link, e não o link. Copie-o agora e mande-o a quem decide na ' +
    'escola — se o perder, «Novo link» na linha da visita gera outro.</p>' +
    '</div>';

  /* ── A LISTA ────────────────────────────────────────────────────────────────────────────────── */
  const selo = (v) => {
    const estado = consultores.estadoDaVisita(v, agora);
    if (estado === 'criada') return '<span class="selo ok">escola criada</span>';
    if (estado === 'expirada') return '<span class="selo alerta">expirado</span>';
    return '<span class="selo discreto">aberto</span>';
  };

  const dia = (iso) => {
    if (!iso) return '—';
    const t = Date.parse(iso.length === 10 ? iso + 'T12:00:00.000Z' : iso);
    if (!Number.isFinite(t)) return '—';
    return new Date(t).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  const acao = (v) => (v.usadaEm
    ? '—'
    : '<button class="acao pequena secundario" type="button" data-novo-link="' + esc(v.id) + '">Novo link</button>');

  const listaEmTabela = todas.length
    ? '<h2 id="as-visitas">As visitas</h2>' +
      tabelaPaginada('pa-visitas-do-consultor', '<table>' +
        '<thead><tr><th>Escola</th><th>Cidade</th><th>Prevista</th><th>O link vale até</th>' +
        '<th>Estado</th><th></th></tr></thead>' +
        '<tbody>' + todas.slice().reverse().map((v) => '<tr>' +
          '<td>' + esc(v.escolaNome || '—') + '</td>' +
          '<td>' + esc(v.cidade || '—') + '</td>' +
          '<td>' + esc(dia(v.previstaPara)) + '</td>' +
          '<td>' + esc(dia(v.expiraEm)) + '</td>' +
          '<td>' + selo(v) + '</td>' +
          '<td>' + acao(v) + '</td>' +
          '</tr>').join('') + '</tbody></table>' +
        /* O QUE O LINK FAZ, dito a quem o vai mandar — e não a quem o recebe. Ele precisa de saber
         * isto para o explicar ao telefone, e a frase é a mesma do plano: um link, uma escola. */
        '<p class="aviso">Cada link abre <strong>uma</strong> criação de escola, no plano de ' +
        'consultoria, já atribuída a você. Ele vale ' + consultores.DIAS_DO_LINK + ' dias e gasta-se ' +
        'na primeira vez que a escola o usar. Quem escolhe o nome definitivo da escola é ela; o ' +
        'plano não se escolhe — é o da consultoria.</p>', 'Visitas por página')
    : '<div class="caixa nota">' +
      '<h2>Nenhuma visita ainda</h2>' +
      '<p>Gere o primeiro link em «Uma visita nova». Cada link é de uma escola, e leva o seu nome: ' +
      'é assim que se sabe quem trouxe cada escola que nascer.</p>' +
      '</div>';

  /* ── O JAVASCRIPT ─────────────────────────────────────────────────────────────────────────────
   *
   * O LINK É MOSTRADO NO CLIENTE, e não numa página nova: o token só existe na resposta, e um
   * recarregamento perdia-o. É a mesma razão por que a caixa diz «uma vez só».
   *
   * A ROTINA DE COPIAR É A DA CASA (`data-copiar` → `nucleo/copiar.js`), e não uma cópia local:
   * foi exactamente uma rotina que existia numa página e não nas outras que produziu o «o copiar
   * não funciona» de 25/11/2026. */
  const script = '<script>' + SCRIPT_DO_COPIAR + '</script>' +
    '<script>(function(){' +
    'function recado(t,erro){var cx=document.getElementById("consultor-recado");if(!cx)return;' +
    'cx.hidden=!t;cx.textContent=t||"";cx.className=erro?"aviso alerta":"aviso";}' +
    'function valor(id){var e=document.getElementById(id);return e?e.value:"";}' +
    'function mostrarLink(url){' +
    'var cx=document.getElementById("consultor-link-caixa"),campo=document.getElementById("consultor-link");' +
    'if(!cx||!campo)return;campo.value=url||"";cx.hidden=false;' +
    'try{cx.scrollIntoView({block:"start"});}catch(e){}' +
    'if(campo.select){try{campo.focus();campo.select();}catch(e){}}' +
    '}' +
    'var gerar=document.getElementById("consultor-gerar");' +
    'if(gerar)gerar.addEventListener("click",function(){' +
    '  gerar.disabled=true;recado("a gerar o link…",false);' +
    '  fetch("/api/consultor/__TOKEN__/visita",{method:"POST",headers:{"Content-Type":"application/json"},' +
    '    cache:"no-store",body:JSON.stringify({escolaNome:valor("consultor-escola"),' +
    '      cidade:valor("consultor-cidade"),previstaPara:valor("consultor-data")})})' +
    '  .then(function(r){return r.json().catch(function(){return {};});})' +
    '  .then(function(d){gerar.disabled=false;' +
    '    if(d&&d.ok){recado("",false);mostrarLink(d.link);return;}' +
    '    recado((d&&d.erro)||"não foi possível gerar o link",true);})' +
    '  .catch(function(){gerar.disabled=false;recado("falha de rede — nada foi gravado",true);});' +
    '});' +
    'var novos=document.querySelectorAll("[data-novo-link]");' +
    'for(var i=0;i<novos.length;i++)(function(b){' +
    '  b.addEventListener("click",function(){' +
    '    var id=b.getAttribute("data-novo-link");if(!id)return;b.disabled=true;' +
    '    fetch("/api/consultor/__TOKEN__/visita/"+encodeURIComponent(id)+"/link",{method:"POST",' +
    '      headers:{"Content-Type":"application/json"},cache:"no-store",body:"{}"})' +
    '    .then(function(r){return r.json().catch(function(){return {};});})' +
    '    .then(function(d){b.disabled=false;' +
    '      if(d&&d.ok){mostrarLink(d.link);return;}' +
    '      recado((d&&d.erro)||"não foi possível gerar outro link",true);})' +
    '    .catch(function(){b.disabled=false;recado("falha de rede — nada foi alterado",true);});' +
    '  });' +
    '})(novos[i]);' +
    '})();</script>';

  /* O TOKEN ENTRA NO ENDEREÇO DO PEDIDO, e não no corpo: é ele que identifica o consultor, e a
   * rota pública confere-o antes de olhar para o resto — a mesma disciplina do convite. */
  return casco(resumo + formulario + caixaDoLink + listaEmTabela
    + script.replace(/__TOKEN__/g, esc(token || '')), 'Consultoria · ' + nome);
}

/**
 * A PÁGINA DO LINK — `/visita/<token>`, a porta por onde a escola nasce (25/11/2026 — F3).
 *
 * QUEM A ABRE É A ESCOLA, num link que o consultor lhe mandou por WhatsApp. Ela não tem senha
 * nenhuma, e não deve ter: o que autentica é o token, como no convite de recriação. O que ela vê é
 * o mínimo para criar a escola — o nome (já preenchido com o que o consultor escreveu), o cadastro
 * fiscal, as duas senhas —, e **uma frase que diz o que está a ser contratado**.
 *
 * O PLANO NÃO SE ESCOLHE, E ISSO É DITO. O plano é o da consultoria, com os sete limites, e um mês a
 * contar de hoje. A página declara-o em vez de esconder: uma escola que descobrisse os limites
 * depois de os bater não teria sabido o que aceitou. Quem quiser um plano pago fala com o consultor
 * — e essa frase está aqui, porque é aqui que a pergunta nasce.
 *
 * O QUE ELA NÃO MOSTRA: nenhuma outra escola, nenhum valor de ninguém, nenhum movimento. E o nome do
 * consultor aparece uma vez, no fim, na frase em que a escola agradece a quem a atendeu.
 */
function paginaDaVisita({ situacao, consultor, escolaNome, token, catalogo } = {}) {
  const s = situacao || { ok: false };
  const nomeDaEscola = String((s && s.escolaNome) || escolaNome || '');
  const quem = consultor || (s && s.consultor) || {};
  const nomeDoConsultor = String(quem.nome || '');

  const casco = (corpo, titulo) => '<!doctype html><html lang="pt-BR" data-paleta="verde">' +
    '<head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    /* NÃO SE INDEXA: é uma página com um segredo no endereço, e um link num motor de busca é um
     * link que se gasta. */
    '<meta name="robots" content="noindex">' +
    '<title>' + esc(titulo) + ' · Sistema Lastro</title>' +
    '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">' +
    '<link rel="stylesheet" href="/assets/style.css">' +
    '</head><body id="top" data-layout="documento" data-tela="visita">' +
    '<header class="doc"><h1>' + esc(titulo) + '</h1>' +
    '<p class="subtitulo">Sistema Lastro · a memória da aula dada</p></header>' +
    '<main><div class="conteudo">' + corpo + '</div></main>' +
    '</body></html>';

  /* ── A RECUSA ────────────────────────────────────────────────────────────────────────────────
   *
   * Quatro casos, quatro frases — e nenhuma delas é «erro». A frase diz sempre a saída: pedir outro
   * link ao consultor, esperar um minuto, escrever para a administração. Quem chegou aqui passou por
   * uma consultoria de três horas; uma recusa sem saída manda desistir uma pessoa que já investiu.
   *
   * A ÚNICA EXCEPÇÃO É O LINK INVÁLIDO, e a frase dele também é curta de propósito: distinguir
   * «não existe» de «existe e não é seu» só ajudaria a quem está a adivinhar tokens. */
  if (!s.ok) {
    const titulo = s.suspenso ? 'Esta demonstração está suspensa' : 'Este link não abre nenhuma escola';
    return casco('<div class="caixa ' + (s.suspenso ? 'nota' : 'falta') + '">' +
      '<h2>' + esc(titulo) + '</h2>' +
      '<p>' + esc(s.motivo || 'o link não abre nenhuma escola.') + '</p>' +
      (s.suspenso
        ? '<p><a class="acao secundario" href="mailto:lastro@padd.com.br">Escrever para a administração</a></p>'
        : '') +
      '<p class="aviso">Se você recebeu este endereço de um consultor do Sistema Lastro, fale com '
      + 'ele: é ele que gera o link, e é ele que o pode gerar outra vez.</p>' +
      '</div>', titulo);
  }

  /* ── O QUE SE ESTÁ A CONTRATAR ───────────────────────────────────────────────────────────────
   *
   * OS SETE LIMITES VÊM DO CATÁLOGO, e não de uma cópia: é o mesmo `planos.json` que o motor aplica
   * nas recusas. Uma página que dissesse «cinco alunas» a partir de um número escrito à mão passaria
   * a mentir no dia em que o catálogo mudasse — e a mentira só apareceria na recusa. */
  const c = (catalogo && catalogo.consultoria) || {};
  const lim = c.limites || {};
  const numero = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  const item = (rotulo, v, singular, plural) => (numero(v) === null ? ''
    : '<li><strong>' + numero(v) + '</strong> ' + esc(numero(v) === 1 ? singular : plural) + '</li>');
  const itens = item('professores', lim.professores, 'professor', 'professores') +
    item('alunas', lim.alunas, 'aluna', 'alunas') +
    item('ciclos', lim.ciclos, 'ciclo', 'ciclos') +
    item('modalidades', lim.modalidades, 'modalidade', 'modalidades') +
    item('aulas', lim.aulas, 'aula', 'aulas') +
    item('salas', lim.salas, 'sala', 'salas') +
    item('turmas', lim.turmas, 'turma', 'turmas');
  /* UMA LISTA VAZIA NÃO SE DESENHA — e não é detalhe. Se o catálogo não chegasse, os sete limites
   * desapareciam e a página prometia «dentro do mês a escola pode ter:» seguido de nada. A escola
   * criava a escola sem saber o que aceitou, e o defeito só apareceria na primeira recusa do motor.
   * Por isso a ausência DIZ-SE. */
  const limites = itens
    ? '<ul>' + itens + '</ul>'
    : '<p class="aviso">Os limites desta demonstração não chegaram até aqui — não crie a escola '
      + 'antes de falar com o consultor: ele diz-lhe exactamente o que o mês inclui.</p>';

  const campo = (id, rotulo, tipo, dica, valor) => '<label class="campo-rotulo" for="' + id + '">'
    + esc(rotulo) + '</label><input id="' + id + '" type="' + tipo + '"'
    + (dica ? ' placeholder="' + esc(dica) + '"' : '')
    + (valor ? ' value="' + esc(valor) + '"' : '')
    + ' autocomplete="' + (tipo === 'password' ? 'new-password' : 'off') + '">';

  /* AS MODALIDADES VÊM DO CATÁLOGO, como na página pública — a mesma lista que os Bastidores
   * mostram. É a habilidade do professor, e é ela que decide o que a escola pode ensinar. */
  const modalidades = ((catalogo && catalogo.modalidades) || [])
    .map((m) => '<option value="' + esc(m.id) + '">' + esc(m.nome) + '</option>').join('');

  const corpo = '<div class="caixa nota">' +
    '<h2>A escola «' + esc(nomeDaEscola || 'a sua escola') + '»</h2>' +
    (nomeDoConsultor
      ? '<p>A consultoria com <strong>' + esc(nomeDoConsultor) + '</strong> termina aqui: este é o '
        + 'ambiente que fica para a sua escola, já com o nome dela.</p>'
      : '<p>Este é o ambiente que fica para a sua escola.</p>') +
    '<p><strong>O plano é o da consultoria</strong>, e começa hoje: <strong>um mês</strong> de uso, '
    + 'uma vez, sem renovação automática. Dentro do mês, a escola pode ter:</p>' +
    limites +
    '<p class="aviso">No fim do mês, o ambiente <strong>fica em leitura</strong> — nada se perde, e '
    + 'nada se apaga: a escola consulta o que registou, e não registra mais. Para continuar a usar, '
    + 'contrate um plano com o seu consultor. É ele que apresenta os planos, as franquias e as '
    + 'extensões.</p>' +
    '</div>' +

    '<h2>1. A escola</h2>' +
    campo('visita-escola', 'nome da escola', 'text', 'como ela se chama', nomeDaEscola) +
    campo('visita-cnpj', 'CNPJ da escola', 'text', '00.000.000/0000-00', '') +
    campo('visita-escola-email', 'e-mail da escola', 'email', 'para onde se fala com ela', '') +
    campo('visita-escola-telefone', 'telefone da escola', 'tel', '(00) 00000-0000', '') +

    '<h2>2. O professor responsável</h2>' +
    '<p class="aviso">É ele que abre a Área do Professor, e é ele o titular da escola. O sobrenome é '
    + 'obrigatório: é ele que separa dois professores do mesmo nome.</p>' +
    campo('visita-professor-nome', 'nome do professor', 'text', 'como ele assina', '') +
    campo('visita-professor-sobrenome', 'sobrenome', 'text', '', '') +
    campo('visita-professor-cpf', 'CPF do professor', 'text', '000.000.000-00', '') +
    /* O E-MAIL E O TELEFONE DO PROFESSOR SÃO OBRIGATÓRIOS, e não são decoração: o cadastro da
     * pessoa vive em `professores/<slug>/contato`, e é por eles que se encontra quem dá a aula
     * quando a escola liga. O servidor recusa sem eles — e a página não os pedia, o que fazia da
     * criação uma porta que não abria (25/11/2026). */
    campo('visita-professor-email', 'e-mail do professor', 'email', 'o dele, não o da escola', '') +
    campo('visita-professor-telefone', 'telefone do professor', 'tel', '(00) 00000-0000', '') +
    '<label class="campo-rotulo" for="visita-professor-modalidade">habilidade (o que ele ensina)</label>' +
    '<select id="visita-professor-modalidade">' + modalidades + '</select>' +

    '<h2>3. As senhas</h2>' +
    campo('visita-senha-escola', 'senha da escola (a direção)', 'password', '', '') +
    campo('visita-senha-professor', 'senha do professor (em branco = a mesma da escola)', 'password', '', '') +
    '<p class="aviso"><strong>Guarde a senha da escola.</strong> Ela abre os Bastidores — o lugar '
    + 'onde o professor planeja a aula. A senha do professor abre a Área do Professor.</p>' +

    '<p class="res" id="visita-recado" role="status"></p>' +
    '<p class="par-botoes"><button class="acao grande" type="button" id="visita-criar">' +
    'Criar a escola</button></p>' +
    '<p class="aviso">Ao criar, você concorda que os registos desta escola ficam no Sistema Lastro, '
    + 'na forma do contrato de demonstração. Nada é publicado: o ambiente é da sua escola.</p>' +
    '<p class="aviso">Depois de criar, o ambiente leva alguns minutos a ficar pronto — o Sistema '
    + 'Lastro monta a escola inteira. Você recebe o endereço nesta página e por e-mail.</p>';

  /* ── O JAVASCRIPT ────────────────────────────────────────────────────────────────────────────
   *
   * O TOKEN VAI NO ENDEREÇO DO PEDIDO, e não no corpo: é ele que identifica o link, e a rota
   * confere-o antes de olhar para o resto. O `__TOKEN__` é substituído no servidor.
   *
   * OS CAMPOS VAZIOS SÃO VALIDADOS AQUI ANTES DO PEDIDO, e só os que o servidor recusaria de
   * qualquer forma: um pedido que volta com «informe o CNPJ» depois de trinta segundos de espera é
   * pior do que uma frase ao lado do campo.
   */
  const script = '<script>(function(){' +
    'function v(id){var e=document.getElementById(id);return e?String(e.value||"").trim():"";}' +
    /* O RECADO TEM DE SE VER — e não se via (25/11/2026). A classe era `res alerta`, e o `.res` da
     * folha é `display:none` até ganhar um dos três estados: `.ok`, `.erro`, `.aviso`. `alerta` não
     * existe. Resultado: o servidor respondia com a frase certa, o browser escrevia-a no parágrafo,
     * e o parágrafo continuava invisível — «cliquei em criar escola e não aconteceu nada». É a
     * mesma família do «copiar» que só ouvia numa página: o que existe e não se vê não existe.
     *
     * A forma passa a ser a da casa (`dizer` do convite): `res` e, no erro, `res erro`. */
    'function recado(t,erro){var cx=document.getElementById("visita-recado");if(!cx)return;' +
    'cx.textContent=t||"";cx.className="res"+(erro?" erro":"");}' +
    'var b=document.getElementById("visita-criar");if(!b)return;' +
    'b.addEventListener("click",function(){' +
    '  var senha=v("visita-senha-escola");' +
    '  if(!senha){recado("escreva a senha da escola — é ela que abre o acesso",true);return;}' +
    '  if(!v("visita-escola")){recado("escreva o nome da escola",true);return;}' +
    '  if(!v("visita-professor-nome")||!v("visita-professor-sobrenome")){' +
    '    recado("escreva o nome e o sobrenome do professor",true);return;}' +
    '  var email=v("visita-escola-email");' +
    '  if(!email||email.indexOf("@")<1){recado("informe o e-mail da escola",true);return;}' +
    /* O CAMPO DIZ «em branco = a mesma da escola», e agora cumpre-o. Antes mandava vazio e o
     * servidor recusava com «informe a senha do professor» — a página prometia uma coisa e fazia
     * outra, e quem preenchesse tudo como ela manda não conseguia criar. */
    '  var senhaP=v("visita-senha-professor")||senha;' +
    '  b.disabled=true;recado("a criar a escola…",false);' +
    '  fetch("/api/visita/__TOKEN__",{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",' +
    '    body:JSON.stringify({' +
    /* AS CHAVES SÃO AS QUE O SERVIDOR LÊ — `escolaEmail`, `escolaTelefone`, `professorEmail`,
     * `professorTelefone` —, e não os nomes que a tela mostra. A primeira versão mandava `email` e
     * `telefone`, que o `cadastro-da-escola` não conhece, e a resposta era «informe o e-mail da
     * escola» para quem o tinha escrito. O contrato entre a página e o servidor é medido em
     * `provar-a-escola-do-consultor` §G, que lê o corpo desta função e o passa aos validadores. */
    '      nome:v("visita-escola"),cnpj:v("visita-cnpj"),' +
    '      escolaEmail:email,escolaTelefone:v("visita-escola-telefone"),' +
    '      professorNome:v("visita-professor-nome"),professorSobrenome:v("visita-professor-sobrenome"),' +
    '      professorNomeCompleto:(v("visita-professor-nome")+" "+v("visita-professor-sobrenome")).trim(),' +
    '      cpf:v("visita-professor-cpf"),' +
    '      professorEmail:v("visita-professor-email"),professorTelefone:v("visita-professor-telefone"),' +
    '      modalidade:v("visita-professor-modalidade"),' +
    '      senhaAdmin:senha,senhaProfessor:senhaP})})' +
    '  .then(function(r){return r.json().catch(function(){return {};});})' +
    '  .then(function(d){' +
    '    if(d&&d.ok){' +
    '      var cx=document.querySelector(".conteudo");' +
    '      if(cx){cx.innerHTML="";}' +
    '      recado("",false);' +
    /* A PÁGINA DEIXA DE OFERECER O FORMULÁRIO NO INSTANTE EM QUE A ESCOLA EXISTE. Um botão que se
     * pode carregar outra vez sobre um link já gasto só produziria uma recusa — e a recusa certa
     * aqui é dizer que deu. */
    '      var caixa=document.createElement("div");caixa.className="caixa nota";' +
    '      var h=document.createElement("h2");h.textContent="A escola foi criada";' +
    '      var p1=document.createElement("p");' +
    '      p1.textContent="Ela fica no ar em instantes, em "+(d.url||"o endereço de sempre")+".";' +
    '      var p2=document.createElement("p");' +
    '      p2.textContent="Guarde a senha da escola: é ela que abre os Bastidores. "' +
    '        +"Nada foi publicado, e esta página não volta a mostrar-se.";' +
    '      caixa.appendChild(h);caixa.appendChild(p1);caixa.appendChild(p2);' +
    '      if(cx)cx.appendChild(caixa);' +
    '      return;' +
    '    }' +
    '    b.disabled=false;' +
    '    recado((d&&d.erro)||"não foi possível criar a escola",true);' +
    '  })' +
    '  .catch(function(){b.disabled=false;recado("falha de rede — nada foi criado",true);});' +
    '});' +
    '})();</script>';

  return casco(corpo + script.replace(/__TOKEN__/g, esc(token || '')),
    'A escola «' + (nomeDaEscola || 'a sua escola') + '»');
}

module.exports = {
  esc, dia, diaOuTraco, quando,
  MARCADOR, MARCADOR_INDICE, tabelaDeEscolas, tabelaDeProfessores, blocoDeEscolas,
  indiceDaPagina, urlDaEscola, listaDeLigacoes, nomeDoProfessor,
  pagina, resposta, paginaDasApagadas, paginaDasVivas, paginaDosProfessores, paginaDoRegistro, paginaSemToken,
  paginaDosContatos,
  paginaDosConsultores,
  paginaDoConsultor,
  paginaDaVisita,
  paginaDoConvite,
  paginaFinanceira, SCRIPT_DO_FINANCEIRO, ENSAIO_PADRAO_MINUTOS,
  /* O MONITORAMENTO (17/11/2026) — a página, e as peças que a prova mede à parte. */
  paginaDoMonitoramento, barraDaCota, seloDoNivel, blocoDasAulas, blocoDaMigracaoDasEscolas,
};

/* ══════════════════════════════════════════════════════════════════════════════════════════════
 * O MONITORAMENTO — O CONSUMO, A RECEITA E O EFEITO DE MUDAR DE PLANO (17/11/2026)
 *
 * O PEDIDO, e as três coisas que ele pediu juntas:
 *
 *   «eu quero saber cada processo quando ele ocorre, o quanto ele gastou, quanto falta para o teto,
 *   qual é a capacidade total, tanto no GitHub com o workflow, o CICD, quanto no Cloudflare com
 *   ocupação de espaços e os workers e o KV, quanto no Resend […] Eu também preciso que nesse
 *   painel de monitoramento eu tenha a receita, quanto é faturado […] e preciso também fazer uma
 *   comparação de quando eu migrar […] qual é o impacto na minha receita.»
 *
 * E a razão, que é o que decide o desenho: «para não ser pega de surpresa e poder se programar […]
 * para tomar medidas antes que seja tarde demais.» Um painel que só mostra o número bonito não
 * serve: o que serve é o número certo, com o que não foi medido dito ao lado, e a distância até o
 * teto em percentagem — que é a única forma de «antes que seja tarde» ter um sinal.
 *
 * TRÊS ABAS, e é a forma adoptada (16/11/2026): «O consumo» · «A receita» · «A migração». A ordem
 * é a das perguntas: quanto gastei, quanto entrou, o que muda se eu crescer.
 * ══════════════════════════════════════════════════════════════════════════════════════════════ */

/** O dinheiro, em centavos → «R$ 239,00». Uma função, e não uma conta em cada sítio. */
const reaisDeCentavos = (c) => 'R$ ' + ((Math.round(Number(c) || 0)) / 100).toFixed(2).replace('.', ',');
const usd = (v) => 'US$ ' + (Math.round(Number(v) * 100) / 100).toFixed(2).replace('.', ',');
/* UM PREÇO UNITÁRIO NÃO TEM DOIS DECIMAIS. `$0,006` por minuto, arredondado a cêntimos, aparece
 * como `$0,01` — um erro de 67% num número que a página usa para explicar a conta. Este formatador
 * mostra os decimais que o valor precisar, até quatro, e nunca mente por arredondamento. */
const usdFino = (v) => {
  const n = Number(v) || 0;
  let casas = 2;
  while (casas < 4 && Math.abs(Math.round(n * Math.pow(10, casas)) - n * Math.pow(10, casas)) > 0.0001) casas += 1;
  return 'US$ ' + n.toFixed(casas).replace('.', ',');
};
const pct = (f) => (Math.round((Number(f) || 0) * 1000) / 10).toFixed(1).replace('.', ',') + '%';
/* O NÚMERO DA CASA: milhar separado por espaço fino inseparável, e a vírgula decimal. «2850» lê-se
 * mal e «2.85×» lê-se como outra coisa; «2 850» e «2,85×» é o que ela escreve e o que o documento
 * do custo usa. O espaço é `\u202f` (fino, não separável) para não partir entre o milhar e a
 * centena. */
const numero = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const inteiro = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  return (n < 0 ? '−' : '') + inteiro;
};
const decimal = (v, casas) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const c = Number.isInteger(casas) ? casas : 2;
  return n.toFixed(c).replace('.', ',');
};

/**
 * A BARRA DE UMA COTA — a distância até o teto, e o estado dela.
 *
 * PORQUE É UM `<progress>` E NÃO UM `<div>` COM UMA LARGURA. Duas razões, e as duas são regra:
 *
 *   1. **Nada de `style=""` na marcação** (regra 5 das instruções de identidade). Uma barra feita
 *      de `<div>` precisa da largura no atributo, e a largura é cálculo — que mora no motor, não na
 *      marcação. O `<progress>` leva o número em `value`/`max` e o desenho na folha.
 *   2. **O `<progress>` já é o que ele diz ser.** Um leitor de ecrã anuncia-o como barra de
 *      progresso, com o valor; um `<div>` com `role="img"` obriga a inventar um `aria-label` que
 *      repita o número — e um `aria-label` que repete o visível é o primeiro a divergir dele.
 *
 * O `data-nivel` é o que pinta: `folga`, `atencao` (80%) e `agora` (95%) — a mesma régua em todas
 * as cotas da casa. A peça chama-se `.cota` na folha, e não `.barra`: esse nome já é a barra fixa
 * da porta.
 */
function barraDaCota({ fraccao, nivel, rotulo, doQue }) {
  const f = Math.max(0, Math.min(1, Number(fraccao) || 0));
  const valor = Math.round(f * 1000);
  return '<progress class="cota" data-nivel="' + esc(nivel) + '" value="' + valor +
    '" max="1000">' + pct(f) + '</progress>' +
    '<p class="sub" data-cota-rotulo>' + esc(rotulo || '') + ': ' + pct(f) +
    ' ' + esc(doQue || 'do incluído') + '</p>';
}

/** O selo do nível, com a palavra que ela lê. */
function seloDoNivel(fraccao) {
  const f = Number(fraccao) || 0;
  if (f >= 0.95) return '<span class="selo falha">no limite</span>';
  if (f >= 0.8) return '<span class="selo alerta">atenção</span>';
  return '<span class="selo ok">folga</span>';
}

/**
 * O BLOCO DO GITHUB — «cada processo quando ele ocorre, o quanto ele gastou».
 *
 * A tabela é por WORKFLOW, e não por run: um run isolado não é uma decisão, e vinte runs do mesmo
 * fluxo são. A coluna «última» é a que responde ao «quando ele ocorre» — e o custo dessa última
 * ocorrência vai ao lado, porque é o número que se multiplica quando se pensa em mudar a cadência.
 */
function blocoDoGithub(g) {
  if (!g) return '';
  const c = g.cotas;
  /* A MARCA DE QUEM JÁ NÃO CORRE. A tabela agrega o MÊS, e o mês inclui fluxos que foram fundidos
   * ou apagados: a 17/11/2026 o «Regerar os índices» (768 min) e o «Reancorar a cadeia» (342 min)
   * já não existiam e continuavam no topo, a somar mais do que qualquer fluxo vivo. Quem olha para
   * ali para decidir dinheiro lê «isto gasta 768 min por mês», e é falso. A marca não adivinha:
   * diz o que se sabe — não houve execuções nas últimas 24 horas. */
  const linhas = (g.fluxos || []).map((f) => '<tr>' +
    '<td><strong>' + esc(f.workflow) + '</strong>' +
    (f.activoUltimas24h === false
      ? '<br><span class="sub">sem execuções nas últimas 24 h</span>'
      : '') + '</td>' +
    '<td>' + f.runs + '</td>' +
    '<td>' + f.minutos + ' min</td>' +
    '<td>' + Math.round((f.minutos / (f.runs || 1)) * 10) / 10 + ' min</td>' +
    '<td>' + (f.ultimaEm ? esc(quando(f.ultimaEm)) : '—') + '</td>' +
    '<td>' + f.ultimoMinutos + ' min</td>' +
    '</tr>').join('');

  const fat = g.fatura;
  const daFactura = g.fonteDoGasto === 'factura' && fat;
  const ciclo = g.ciclo || {};
  const nivel = g.fraccao >= 0.95 ? 'agora' : (g.fraccao >= 0.8 ? 'atencao' : 'folga');

  /* ── QUATRO NÚMEROS, E NENHUM DELES É O QUE SE PAGA ───────────────────────────────────────────
   *
   * A FATURA DO GITHUB NÃO TEM UM NÚMERO, TEM QUATRO, e confundi-los custa dinheiro em sustos: o
   * bruto ($11,60) parece uma dívida e não é; o líquido ($0,00) é o que sai da conta e não diz se
   * está perto do limite; o crédito que resta ($0,40) é o que decide; a projecção ($8,47) é o que
   * permite agir hoje. A ordem em que aparecem é essa — do que assusta ao que decide. */
  const dinheiro = (v) => usd(Number(v) || 0);

  /* ── A METADE DO CICLO EM QUE O REPOSITÓRIO ESTÁ ─────────────────────────────────────────────
   *
   * A POLÍTICA DECLARADA (17/11/2026): em desenvolvimento, quando o crédito do mês aperta, o
   * repositório passa a público — os minutos de Actions em repositório público são gratuitos e
   * ilimitados — e no dia 1.º de cada mês volta a privado.
   *
   * O PERIGO DESTA POLÍTICA É O ESQUECIMENTO, e é de um tipo específico: não é esquecer de o tornar
   * público (isso dói no bolso e nota-se), é esquecer de o tornar PRIVADO no dia 1.º — e isso não
   * dói em lado nenhum: fica público sem ninguém dar por isso. Uma política que depende de memória
   * tem de ter um lembrete no sítio onde ela olha, e é este. */
  const publico = g.repositorioPublico === true;
  const avisoDeCiclo = (g.repositorioPublico === true
    ? '<p class="aviso"><strong>O repositório está público.</strong> Os minutos de Actions em ' +
      'repositório público são <strong>gratuitos e ilimitados</strong> — é por isso que esta metade ' +
      'do ciclo não custa nada. <strong>No dia 1.º ele volta a privado</strong>, e é essa a metade ' +
      'que se esquece: enquanto estiver público, o código está aberto a quem o procurar.</p>'
    : (g.repositorioPublico === false
      ? '<p class="sub">Repositório <strong>privado</strong>: os minutos contam para o incluído. ' +
        'Quando o crédito estiver a cinco dias do fim, a política é torná-lo público até ao dia 1.º ' +
        'e voltar a privado no dia 1.º.</p>'
      : '')) +
    (publico
      ? '<p class="sub">As linhas de dinheiro abaixo são o <strong>registo da fatura</strong> — o ' +
        'que foi apurado enquanto o repositório era privado. A <strong>cobrança é ' +
        dinheiro(g.cobravelUsd) + '</strong>.</p>'
      : '');

  return '<div class="caixa" id="monitor-github">' +
    '<h2>GitHub — o CI/CD</h2>' +
    avisoDeCiclo +
    '<p>A franquia do plano <strong>' + esc(c.plano) + '</strong> é de <strong>' + dinheiro(c.computeIncluidoUsd) +
    ' por mês</strong> — o que dá ' + g.incluido + ' minutos a ' + usdFino(c.precoMinutoUsd) + '. Ela não aparece ' +
    'na fatura como um tecto: aparece como um <strong>desconto igual ao valor usado</strong>. Por isso ' +
    'um mês em que o valor usado é igual ao desconto paga <strong>zero</strong>.</p>' +
    (daFactura
      ? '<div class="ficha">' +
        '<span>Usado no mês: <strong>' + fat.minutos + ' min</strong></span>' +
        '<span>Vale <strong>' + dinheiro(fat.brutoUsd) + '</strong></span>' +
        '<span>Desconto da franquia: <strong>− ' + dinheiro(fat.descontoUsd) + '</strong></span>' +
        '<span>A pagar: <strong>' + dinheiro(fat.liquidoUsd) + '</strong></span>' +
        (ciclo.diasDecorridos ? '<span>dia <strong>' + ciclo.diasDecorridos + '</strong> de ' + ciclo.diasNoMes + '</span>' : '') +
        '</div>' +
        /* O CRÉDITO QUE RESTA É O NÚMERO QUE DECIDE, e vem antes de tudo o resto. */
        '<p>' + seloDoNivel(g.fraccao) + ' <strong>' + dinheiro(fat.creditoRestanteUsd) + ' de crédito</strong> ' +
        'ainda por usar, dos ' + dinheiro(fat.creditoUsd) + ' do mês' +
        (ciclo.diasAteAcabarCredito != null
          ? (ciclo.diasAteAcabarCredito <= 0
            ? ' — <strong>já se esgotou</strong>, e é daqui para a frente que se paga.'
            : ' — a este ritmo de ' + dinheiro(ciclo.ritmoUsdDia) + ' por dia, <strong>esgota-se em ' +
              String(ciclo.diasAteAcabarCredito).replace('.', ',') + ' dia' +
              (ciclo.diasAteAcabarCredito === 1 ? '' : 's') + '</strong>.')
          : '') +
        '</p>' +
        barraDaCota({ fraccao: g.fraccao, nivel, rotulo: 'Franquia do mês', doQue: 'dos ' + g.incluido + ' min' }) +
        '<p class="sub">Estes números são os <strong>da fatura</strong> (API de facturação do ' +
        'GitHub, ciclo de ' + esc(String(g.janela || '').slice(8, 10)) + ' até hoje), não uma conta ' +
        'feita por mim. A tabela abaixo é o <strong>histórico do mês</strong> e atribui o gasto a ' +
        'cada processo: um fluxo fundido noutro conserva ali o nome antigo e os minutos que gastou ' +
        'enquanto existia — o que decide não é o topo da tabela, é o total acima. E a coluna corre ' +
        (g.desvioDaRegra != null
          ? '<strong>' + (g.desvioDaRegra >= 0 ? '+' : '') + Math.round(g.desvioDaRegra * 100) + '%</strong> '
          : '') + 'em relação a ela — serve para saber de quem é o gasto, não para medir o consumo.</p>'
      : '<div class="ficha">' +
        '<span>Pela regra: <strong>' + g.minutos + ' min</strong></span>' +
        '<span>de <strong>' + g.incluido + ' min</strong></span>' +
        '</div>' +
        barraDaCota({ fraccao: g.fraccao, nivel, rotulo: 'Franquia do mês', doQue: 'dos ' + g.incluido + ' min' }) +
        '<p class="aviso"><strong>A fatura não pôde ser lida, e por isso este número é a REGRA, ' +
        'não o consumo.</strong> ' + esc(g.facturacaoIndisponivel || 'motivo não declarado') + '. ' +
        (g.pedePermissao
          ? 'Para o painel ler o consumo verdadeiro, o token do GitHub precisa da permissão de conta ' +
            '<strong>Plan → Read-only</strong> (é o que o próprio GitHub pede: <code>' + esc(g.pedePermissao) +
            '</code>). Em GitHub → Settings → Developer settings → Personal access tokens → o token → ' +
            'Account permissions → Plan: Read-only.'
          : '') +
        '</p>') +
    /* A PROJECÇÃO — a frase que permite decidir hoje em vez de no fim do mês. Em DÓLARES, e com o
     * líquido, porque é o líquido que sai da conta: um mês de $20,47 brutos com $12 de franquia
     * custa $8,47, e dizer «vinte» seria assustar sem informar. */
    /* AS DUAS PERGUNTAS, EM DUAS FRASES. «Este mês ainda cabe?» responde-se com o run rate — o que
     * já saiu mais o que vai sair ao ritmo de agora. «Preciso de contratar?» responde-se com o mês
     * inteiro ao ritmo de agora, que é o único número sem herança nenhuma do mês caro. Confundi-las
     * é o que faz alguém pagar um plano por causa de um mês que já passou. */
    (daFactura && ciclo.projeccao
      ? '<p><strong>Este mês fecha em ' + ciclo.projeccao + ' min</strong> — os ' + ciclo.gastos +
        ' já gastos mais ' + String(ciclo.ritmoDia).replace('.', ',') + ' min/dia × ' +
        ciclo.diasRestantes + ' dias que faltam. Descontada a franquia, ' +
        (ciclo.liquidoPrevistoUsd > 0
          ? '<strong>' + dinheiro(ciclo.liquidoPrevistoUsd) + ' a pagar</strong>.'
          : 'não sobra nada a pagar.') +
        ' <span class="sub">(ritmo medido sobre a ' + esc(ciclo.janelaDoRitmo) + '.)</span></p>' +
        '<p><strong>Um mês inteiro a este ritmo seriam ' + ciclo.mesInteiroAoRitmo + ' min</strong> — ' +
        (ciclo.proximoMesUsd > 0
          ? dinheiro(ciclo.proximoMesUsd) + ' a pagar. É este o número que responde a «preciso de ' +
            'contratar?»: o outro carrega os dias caros deste mês, este não.'
          : 'dentro da franquia, <strong>sem nada a pagar</strong>. É este o número que responde a ' +
            '«preciso de contratar?» — e a resposta é não.') + '</p>'
      : '') +
    (linhas
      ? '<div class="rolagem-caixa"><table><thead><tr><th>Processo</th><th>Vezes</th>' +
        '<th>Gasto</th><th>Por vez</th><th>Última vez</th><th>Nessa vez</th></tr></thead><tbody>' +
        linhas + '</tbody></table></div>'
      : '<p class="aviso">Nenhum run na janela. Uma tabela vazia quer dizer isso — não que a ' +
        'leitura falhou.</p>') +
    (g.estimados
      ? '<p class="sub"><strong>' + g.medidos + ' de ' + g.runs + ' execuções</strong> tiveram os jobs ' +
        'medidos um a um. As outras ' + g.estimados + ' levam a <strong>média do próprio fluxo</strong> — e as ' +
        'de um fluxo que ainda não foi medido nenhuma vez levam 1 minuto. Cada abertura do painel mede mais 12.</p>'
      : '') +
    /* A PROVA DE QUE UM CAMPO DA API NÃO SERVE — uma linha, e só quando ele contradiz a fatura. O
     * `billable` de `/runs/{id}/timing` respondeu zero enquanto a fatura contava 1.933 minutos.
     * Fica dito para ninguém voltar a tentar medir por ali. */
    (g.conferencia && g.conferencia.atesta === false && daFactura
      ? '<p class="sub">O campo <code>billable</code> da API de execuções <strong>não serve para ' +
        'medir</strong>: na execução mais recente medida (' + esc(g.conferencia.workflow) + ', ' +
        g.conferencia.jobs + ' job' + (g.conferencia.jobs === 1 ? '' : 's') + ' de ' +
        g.conferencia.segundos + ' s) diz <strong>0 min facturáveis</strong>, enquanto a fatura do ' +
        'mesmo mês conta ' + g.gastos + ' min. Fica registado como o que é: uma leitura inutilizável.</p>'
      : '') +
    '<p class="sub">Fonte das cotas: ' + esc(c.fonte) + ' — lido em ' + esc(c.lidoEm) + '.</p>' +
    '</div>';
}

/** O BLOCO DO CLOUDFLARE — a ocupação, e o que não se mede. */
/**
 * AS AULAS — a cota que decide, e a conta a um dólar de referência *(25/11/2026)*.
 *
 * «A gente tem um monitoramento aqui e ele diz para a gente quando é que a gente precisa tomar
 * alguma medida antes que ela aconteça.» As cotas que já estavam aqui são todas do FORNECEDOR —
 * minutos, e-mails, chaves. Esta é a da CASA: **quantas aulas o parque vendeu**, contra as **1.000
 * aulas/mês** que o plano gratuito paga (2.000 min ÷ 2,0 min por aula, medidos).
 *
 * PORQUE É QUE A FRANQUIA VENDIDA E NÃO O CONSUMO: o contador de aulas do mês ainda não existe
 * (`PLANO-CONTADOR-DE-AULAS.md`), e a franquia é o TECTO do que pode ser lançado — o pior caso. Um
 * alarme construído sobre o pior caso avisa cedo, que é o que ela pediu; quando o contador existir,
 * passa-se-lhe o número medido e o bloco não muda. O bloco diz qual dos dois está a usar.
 *
 * A CONTA A R$ 6 É DECLARADA COMO REFERÊNCIA, e não é a cotação: ela fixou «até R$ 6 o dólar é onde
 * eu posso suportar». Ao lado fica a conta à taxa do dia, que é o que se paga — e as duas dizem o
 * câmbio que usaram, porque um número em reais sem a taxa ao lado é um número que ninguém confere.
 */
function blocoDasAulas(a) {
  if (!a) return '';
  const temAulas = a.aulasVendidas != null;
  const detalhe = (r) => {
    if (!r) return '<span class="sub">sem câmbio declarado, a conta não é feita</span>';
    return '<strong>R$ ' + decimal(r.custoCentavos / 100, 2) + '/mês</strong>'
      + (r.margem != null
        ? ' <span class="sub">— margem ' + pct(r.margem) + ' sobre a franquia vendida</span>'
        : '');
  };
  return '<div class="caixa" id="monitor-aulas">' +
    '<h2>As aulas — a cota que decide</h2>' +
    '<p>As cotas acima são do fornecedor. Esta é a da casa: o plano gratuito do GitHub paga '
    + '<strong>' + numero(a.aulasQueEsgotamGratuito) + ' aulas por mês</strong>, a '
    + decimal(a.minutosPorAula, 1)
    + ' minutos cada (medido a ' + esc(dia(a.minutosPorAulaMedidoEm)) + ').</p>' +
    /* A BARRA SÓ APARECE QUANDO HÁ O QUE MEDIR. Sem aulas vendidas, a página diz que não sabe —
     * e não desenha um zero que se lê como «parque vazio». */
    (temAulas
      ? barraDaCota({
        fraccao: Math.min(1, a.fraccao), nivel: seloDoNivel(a.fraccao).includes('falha') ? 'agora'
          : (seloDoNivel(a.fraccao).includes('alerta') ? 'atencao' : 'folga'),
        rotulo: numero(a.aulasVendidas) + ' aulas vendidas (franquia dos contratos)',
        doQue: 'das ' + numero(a.aulasQueEsgotamGratuito) + ' que o plano gratuito paga',
      })
      : '<p class="sub">Ainda sem aulas vendidas registadas: o consumo em aulas não é calculado.</p>') +
    (temAulas && a.fraccao > 1
      ? '<p class="sub">A franquia vendida é <strong>' + decimal(a.fraccao, 2)
        + '×</strong> o que o plano gratuito paga.</p>'
      : '') +
    '<div class="rolagem-caixa"><table><thead><tr><th>Custo, a um dólar de…</th><th>Por mês</th>'
    + '</tr></thead><tbody>' +
    (a.hoje
      ? '<tr><td><strong>R$ ' + decimal(a.hoje.cambio, 2) + '</strong> — o câmbio '
        + 'declarado, que é o que se paga</td><td>' + detalhe(a.hoje) + '</td></tr>'
      : '') +
    (a.naReferencia
      ? '<tr><td><strong>R$ ' + decimal(a.naReferencia.cambio, 2) + '</strong> — '
        + 'a referência de segurança que ela fixou</td><td>' + detalhe(a.naReferencia) + '</td></tr>'
      : '') +
    '</tbody></table></div>' +
    '<p class="sub">' + esc(a.frase || '') + '</p>' +
    /* O QUE A CONTA NÃO INCLUI, dito ao lado: o CI da operação da casa não é aulas de escola, e
     * somado a isto aparece na fatura sem estar nesta barra. */
    '<p class="sub">Esta conta é só das aulas vendidas. O CI do desenvolvimento corre na mesma '
    + 'cota e não entra aqui — a fatura soma os dois.</p>' +
    '</div>';
}

/**
 * AS OPERAÇÕES DO CLOUDFLARE — a metade que passou a ser medida a 25/11/2026.
 *
 * DUAS PERGUNTAS, DUAS RESPOSTAS, e por isso duas colunas. «Como está agora?» é o número de hoje;
 * «quanto é que isto já apertou?» é o PICO da janela, e é o pico que manda na barra e no alerta —
 * a cota é diária e volta a zero, de modo que hoje às 0,5 % não diz nada sobre o risco, e o dia em
 * que se escreveram 234 chaves diz tudo. A barra mostra o pico; a ficha mostra hoje.
 *
 * A BARRA É A MESMA PEÇA das outras cotas (`barraDaCota`) e o selo é o mesmo (`seloDoNivel`): nada
 * aqui inventa uma forma nova para o mesmo conceito.
 */
function blocoDasOperacoes(operacoes) {
  if (!operacoes || !operacoes.ok) return '';
  const ops = Array.isArray(operacoes.porOperacao) ? operacoes.porOperacao : [];
  if (!ops.length) return '';
  const janela = operacoes.janela || {};
  /* SEM CLASSE NOVA. A marcação é a mesma das outras cotas — um `<p>` com o nome e o selo, a
   * `barraDaCota` (a peça da folha) e um `<p class="sub">` com o número —, e nada aqui inventa uma
   * forma para o mesmo conceito. A regra da identidade vale também para o que parece só arrumação:
   * uma `div` com nome próprio é uma peça, e uma peça nasce na folha. */
  const barras = ops.map((o) => '<p><strong>' + esc(o.rotulo) + '</strong> ' +
    seloDoNivel(o.fraccaoPico || 0) + '</p>' +
    barraDaCota({
      fraccao: o.fraccaoPico || 0,
      nivel: (o.fraccaoPico || 0) >= 0.95 ? 'agora' : ((o.fraccaoPico || 0) >= 0.8 ? 'atencao' : 'folga'),
      rotulo: 'O dia mais cheio da janela',
      doQue: 'da cota de ' + numero(o.cota) + ' por dia',
    }) +
    '<p class="sub">Pico: <strong>' + numero(o.pico) + '</strong>'
      + (o.diaDoPico ? ' em ' + esc(quando(o.diaDoPico + 'T12:00:00Z').slice(0, 10)) : '')
      + ' · hoje: <strong>' + (o.hoje == null ? '—' : numero(o.hoje)) + '</strong>'
      + (o.hoje == null ? '' : ' (' + pct(o.fraccaoHoje) + ')') + '</p>').join('');

  const linhasDias = (operacoes.dias || []).map((d) => '<tr>' +
    '<td>' + esc(quando(d.dia + 'T12:00:00Z').slice(0, 10)) + '</td>' +
    '<td>' + numero(d.pedidos) + '</td>' +
    '<td>' + numero(d.leituras) + '</td>' +
    '<td>' + numero(d.escritas) + '</td>' +
    '<td>' + numero(d.listas) + '</td>' +
    '<td>' + numero(d.apagamentos) + '</td>' +
    '</tr>').join('');

  const scripts = (operacoes.porScript || []).map((s) => '<li>' + esc(s.script) + ' — <strong>' +
    numero(s.pedidos) + '</strong> pedido(s)</li>').join('');

  return '<h3>O que se faz num dia</h3>' +
    '<p>Medido no Cloudflare, dia a dia, para os últimos ' + (janela.dias || 7) + ' dias (' +
    esc(janela.desde || '') + ' a ' + esc(janela.ate || '') + '). A cota é <strong>diária</strong> e '
    + 'volta a zero à meia-noite UTC — por isso a barra mostra o <strong>dia mais cheio</strong> da '
    + 'janela, e não o de hoje.</p>' +
    barras +
    (linhasDias
      ? '<div class="rolagem-caixa"><table><thead><tr><th>Dia</th><th>Pedidos</th>' +
        '<th>Leituras</th><th>Escritas</th><th>Listagens</th><th>Apagamentos</th>' +
        '</tr></thead><tbody>' + linhasDias + '</tbody></table></div>'
      : '') +
    (scripts ? '<p class="sub">Por Worker: </p><ul>' + scripts + '</ul>' : '') +
    (operacoes.truncado
      ? '<div class="aviso"><p><strong>O número está cortado.</strong> A leitura chegou ao tecto de '
        + '1 000 grupos e o que está acima é um <em>mínimo</em>, não o total.</p></div>'
      : '') +
    '<p class="sub">Estes números vêm dos conjuntos <strong>com amostragem adaptativa</strong> do '
    + 'Cloudflare: em volume baixo são exactos, em volume alto são extrapolações dele. Não são uma '
    + 'segunda conta nossa — são o número do fornecedor.</p>';
}

function blocoDoCloudflare(cf) {
  if (!cf) return '';
  const c = cf.cotas;
  const linhas = (cf.porEscola || []).map((e) => '<tr>' +
    '<td>' + esc(e.escola) + '</td>' +
    '<td>' + e.chaves + '</td>' +
    '<td>' + (e.bytes ? (e.bytes / 1024).toFixed(1).replace('.', ',') + ' KB' : '—') + '</td>' +
    '</tr>').join('');
  const naoMedido = (cf.naoMedido || []).map((n) => '<li>' + esc(n.o) + ' — cota <strong>' +
    Number(n.cota).toLocaleString('pt-BR') + '</strong> por dia</li>').join('');

  return '<div class="caixa" id="monitor-cloudflare">' +
    '<h2>Cloudflare — os Workers e o KV</h2>' +
    '<p>O plano <strong>' + esc(c.plano) + '</strong> dá ' + Number(c.pedidosDia).toLocaleString('pt-BR') +
    ' pedidos, ' + Number(c.escritasKvDia).toLocaleString('pt-BR') + ' escritas e ' +
    Number(c.leiturasKvDia).toLocaleString('pt-BR') + ' leituras de KV por dia, e ' +
    c.armazenamentoKvGb + ' GB de armazenamento. O pago não é por uso: ' + usd(c.planoPagoUsd) +
    ' por conta, por mês.</p>' +
    '<div class="ficha">' +
    '<span>Escolas no sistema: <strong>' + cf.escolas + '</strong></span>' +
    '<span>Chaves no KV: <strong>' + cf.chaves + '</strong></span>' +
    '<span>Ocupado: <strong>' + (cf.bytes ? (cf.bytes / 1024 / 1024).toFixed(2).replace('.', ',') + ' MB' : 'tamanho não medido') + '</strong></span>' +
    '</div>' +
    /* O ARMAZENAMENTO É MEDIDO DESDE O INÍCIO, e é o que menos aperta: 1 GB é muito para fichas de
     * 15 KB. A barra existe para o número não ser uma surpresa no dia em que crescer. */
    barraDaCota({ fraccao: cf.fraccaoArmazenamento, nivel: 'folga', rotulo: 'Armazenamento do KV' }) +
    '<p>' + pct(cf.fraccaoArmazenamento) + ' do armazenamento de ' + c.armazenamentoKvGb + ' GB</p>' +
    (linhas
      ? '<div class="rolagem-caixa"><table><thead><tr><th>Escola</th><th>Chaves</th><th>Tamanho</th>' +
        '</tr></thead><tbody>' + linhas + '</tbody></table></div>'
      : '') +
    blocoDasOperacoes(cf.operacoes) +
    /* O QUE NÃO SE MEDE, DITO — e quando nada falta, este aviso não existe. Era ele que dizia «o
     * Worker não tem a permissão de analítica», e tinha-a. */
    (naoMedido
      ? '<div class="aviso"><p><strong>O que este painel não mede</strong>, e porquê:</p>' +
        '<ul>' + naoMedido + '</ul>' +
        '<p>' + esc(cf.motivoNaoMedido) + '</p></div>'
      : '') +
    '<p class="sub">Fonte das cotas: ' + esc(c.fonte) + ' — lido em ' + esc(c.lidoEm) + '.</p>' +
    '</div>';
}

/** O BLOCO DO RESEND — as duas cotas, e a que aperta primeiro. */
function blocoDoCorreio(co) {
  if (!co) return '';
  const c = co.cotas;
  const aperta = co.manda === 'dia';
  return '<div class="caixa" id="monitor-resend">' +
    '<h2>Resend — os e-mails</h2>' +
    '<p>O plano <strong>' + esc(co.plano) + '</strong> dá <strong>' + co.total + ' e-mails por mês</strong>' +
    (co.limiteDia ? ' <strong>e ' + co.limiteDia + ' por dia</strong>' : '') + '. As duas cotas contam' +
    (co.limiteDia ? ' — e no plano gratuito a diária chega primeiro' : '') + '.</p>' +
    '<div class="ficha">' +
    '<span>Enviados no mês: <strong>' + co.enviados + '</strong></span>' +
    '<span>restam <strong>' + co.restantes + '</strong></span>' +
    '<span>Hoje: <strong>' + co.enviadosHoje + '</strong>' + (co.limiteDia ? ' de ' + co.limiteDia : '') + '</span>' +
    '<span>Falhados: <strong>' + co.falhados + '</strong></span>' +
    '</div>' +
    barraDaCota({ fraccao: co.fraccao, nivel: co.fraccao >= 0.95 ? 'agora' : (co.fraccao >= 0.8 ? 'atencao' : 'folga'), rotulo: 'Resend no mês' }) +
    '<p>Mês: ' + seloDoNivel(co.fraccao) + ' ' + pct(co.fraccao) +
    (co.limiteDia ? ' · Dia: ' + seloDoNivel(co.fraccaoDia) + ' ' + pct(co.fraccaoDia) : '') + '</p>' +
    /* A FRASE QUE ANTECIPA O PROBLEMA: qual das duas cotas manda. Sem ela, um dia de lote esgota a
     * diária e o painel continuaria a dizer «96% de folga no mês». */
    (aperta
      ? '<p class="aviso alerta">Quem aperta primeiro é a cota <strong>diária</strong>: ' +
        co.enviadosHoje + ' de ' + co.limiteDia + ' hoje. Um lote de e-mails de expurgo passa disto ' +
        'numa tarde, mesmo com o mês quase vazio.</p>'
      : '') +
    '<p class="sub">O número é o que o SISTEMA pediu ao provedor, uma chamada por mensagem — não é ' +
    'a fatura. Bounces e repetições contam no Resend e só aparecem lá. Fonte: ' + esc(c.fonte) +
    ' — lido em ' + esc(c.lidoEm) + '.</p>' +
    '</div>';
}

/** A ABA DA RECEITA — o que entra, o que foi recebido, o que está em aberto. */
/**
 * A INADIMPLÊNCIA — quem deve, há quantos meses, e o que fazer (17/11/2026).
 *
 * A REGRA DELA, e a escada tem três degraus: «não pagou um mês, fica inadimplente […] não pagou
 * três meses, tá inadimplente, aí eu posso expurgar a escola. […] eu vou entrar em contato com a
 * escola, ver o que que aconteceu, tentar resolver e não perder o cliente.»
 *
 * A TABELA É PARA TRABALHAR, e não para olhar: uma linha por escola que DEVE, o mais antigo
 * primeiro, com o telefone de contacto ao lado. Uma lista com as escolas em dia misturada faria
 * procurar o que interessa no meio do que não interessa.
 *
 * E A DECISÃO NÃO SE AUTOMATIZA. O ecrã diz em que degrau está cada escola; quem desabilita, quem
 * telefona e quem expurga é ela — «sou eu. Eu que faço isso. […] é uma estratégia minha para
 * negociação.»
 */
function blocoDaInadimplencia(i) {
  if (!i) return '';
  const devedoras = Array.isArray(i.devedoras) ? i.devedoras : [];
  const reais = (c) => 'R$ ' + ((Math.round(Number(c) || 0)) / 100).toFixed(2).replace('.', ',');
  const selo = (classe) => (classe === 'para-expurgar'
    ? '<span class="selo falha">3 meses ou mais — pode expurgar</span>'
    : '<span class="selo alerta">1 a 2 meses — contactar</span>');
  const linhas = devedoras.map((d) => '<tr>' +
    '<td><strong>' + esc(d.nome || d.escola) + '</strong>'
    + (d.planoNome ? '<br><span class="sub">' + esc(d.planoNome) + '</span>' : '') + '</td>' +
    '<td>' + esc(String(d.mesesVencidos)) + '</td>' +
    '<td>' + (d.desde ? esc(d.desde) : '—') + '</td>' +
    '<td>' + esc(reais(d.dividaCentavos)) + '</td>' +
    '<td>' + selo(d.classe) + '</td>' +
    '</tr>').join('');
  const tabela = devedoras.length
    ? '<div class="rolagem-caixa"><table><thead><tr><th>Escola</th><th>Meses em atraso</th>' +
      '<th>Devendo desde</th><th>Dívida</th><th>Degrau</th></tr></thead><tbody>' + linhas +
      '</tbody></table></div>'
    : '<p class="sub">Nenhuma escola com mensalidade vencida por pagar. Uma tabela vazia quer ' +
      'dizer isso, e não que a leitura falhou.</p>';
  return '<div class="caixa" id="monitor-inadimplencia">' +
    '<h2>A inadimplência</h2>' +
    '<p>Quem tem mensalidade vencida e não paga. O mês em curso que ainda não venceu não conta ' +
    'como atraso — cobrá-lo seria contar o futuro.</p>' +
    '<p><strong>' + esc(String(i.emDia)) + '</strong> em dia · <strong>'
    + esc(String(i.inadimplentes)) + '</strong> com um ou dois meses · <strong>'
    + esc(String(i.paraExpurgar)) + '</strong> com ' + esc(String(i.limiar))
    + ' ou mais, já na saída da escada. Dívida total: <strong>' + esc(reais(i.dividaTotalCentavos))
    + '</strong>.</p>' +
    tabela +
    '<p class="sub">A escada é a dela: um ou dois meses é a janela da conversa — contactar, ' +
    'perceber o que aconteceu, tentar resolver sem perder o cliente. Aos três meses o sistema ' +
    'diz que o prazo chegou; desabilitar e expurgar continuam a ser decisões dela, no painel da ' +
    'escola e na lista das vivas.</p>' +
    '</div>';
}

/**
 * AS ESCOLAS A MIGRAR — o ponto de viragem do PLANO COMERCIAL, e a chamada para o consultor
 * *(25/11/2026)*.
 *
 * O QUE ELA PEDIU: «É ali que você vai me dizer quando vale a pena então migrar. É o ponto de
 * migração da escola. E aí que eu vou pedir para o consultor entrar em contacto e aí ele ganha uma
 * grana e presta essa consultoria e mantém a escola viva.»
 *
 * E ESTA NÃO É A «MIGRAÇÃO» DA OUTRA ABA. Aquela é a dela — o plano do GitHub, do Cloudflare, do
 * Resend, que sobe quando a cota aperta e que só gasta. Esta é a da ESCOLA — o degrau comercial que
 * sobe quando a escola cresce e que **rende**: no ponto de viragem ela paga o mesmo e leva mais
 * aulas. Duas palavras iguais para duas coisas opostas; a diferença é dita no topo do bloco, porque
 * uma aba chamada «migração» ao lado de um bloco chamado «migração» é a receita para se ler o
 * número errado.
 *
 * A FRASE QUE O CONSULTOR LEVA está em cada linha, e é concreta: quantas aulas a escola paga e não
 * recebe. Não é «considere subir de plano» — é «paga o mesmo que o Intermediário e recebe 130 aulas
 * a menos».
 */
function blocoDaMigracaoDasEscolas(m) {
  if (!m) return '';
  const pontos = (m.pontos || []).map((p) => '<tr><td>' + esc(p.deNome) + ' → <strong>'
    + esc(p.paraNome) + '</strong></td><td>' + numero(p.viragem) + ' aulas/mês</td><td>'
    + reaisDeCentavos(Math.round(p.pagaNoPonto * 100)) + '</td><td>'
    + numero(p.aulasQueRecebe) + '</td><td>' + numero(p.aulasQuePagaSemReceber) + '</td></tr>').join('');

  const celulaDaLinha = (e) => {
    const dinheiro = e.nivel === 'migrar'
      ? '<span class="selo falha">migrar</span>'
      : (e.nivel === 'janela' ? '<span class="selo alerta">a chegar</span>'
        : '<span class="selo ok">folga</span>');
    /* O QUE ELA PAGA A MAIS, e é a frase da conversa. `aulasQuePagaSemReceber` só existe acima do
     * ponto; na janela o que se mostra é quanto falta. */
    /* O DINHEIRO MEDE A PERDA; AS AULAS DESCREVEM A DISTÂNCIA (25/11/2026, e a prova obrigou a
     * separá-los). No ponto a economia ainda é zero — ela paga exactamente o preço do plano de
     * cima —, mas o plano de cima dá mais aulas; acima do ponto começa a pagar a mais, e é esse o
     * valor que a consultoria leva. Uma frase só com as aulas diria «paga 90 aulas a menos» a quem
     * está a 230 de 320: verdade e inútil. */
    const razao = e.nivel === 'migrar'
      ? (e.economiaCentavos > 0
        ? '<strong>' + reaisDeCentavos(e.economiaCentavos) + '/mês</strong> a mais pelo mesmo plano '
          + 'de cima <span class="sub">(e ' + numero(e.aulasQuePagaSemReceber) + ' aulas a menos que '
          + numero(e.aulasQueRecebe) + ')</span>'
        : 'no ponto: paga o mesmo que o ' + esc(e.paraNome) + ', que dá <strong>'
          + numero(e.aulasQueRecebe) + ' aulas</strong> em vez de ' + numero(e.numero))
      : (e.nivel === 'janela' ? 'falta ' + numero(e.falta) + ' aula(s) para o ponto'
        : 'dentro da franquia do plano');
    return '<tr><td><strong>' + esc(e.nome) + '</strong></td>' +
      '<td>' + esc(e.planoNome) + ' <span class="sub">→ ' + esc(e.paraNome) + '</span></td>' +
      '<td>' + numero(e.numero) + '<span class="sub"> / ' + numero(e.viragem) + '</span></td>' +
      '<td>' + razao + '</td>' +
      '<td>' + dinheiro + '</td></tr>';
  };

  /* A LISTA SÓ APARECE QUANDO HÁ O QUE FAZER. Uma tabela com vinte escolas em «folga» esconde as
   * duas que importam — e a pergunta desta caixa é «quem é que eu mando o consultor contactar». */
  const aMigrar = (m.migrar || []);
  const aChegar = (m.janela || []);
  const comQueFalar = aMigrar.concat(aChegar);
  const tabela = comQueFalar.length
    ? '<div class="rolagem-caixa"><table><thead><tr><th>Escola</th><th>Plano</th>'
      + '<th>Aulas / ponto</th><th>O que está a acontecer</th><th>Ação</th></tr></thead><tbody>'
      + comQueFalar.map(celulaDaLinha).join('') + '</tbody></table></div>'
    : '<p class="sub">Nenhuma escola está perto do ponto de viragem do seu plano — não há '
      + 'consultoria a marcar por este motivo.</p>';

  /* AS ESCOLAS NO TOPO DA ESCADA. O Avançado não tem degrau acima, e calá-las deixaria a maior
   * escola sem resposta: a conversa dela é outra, e é dita. */
  const topo = (m.semDegrau || []).length
    ? '<p class="sub">No topo da escada (sem degrau acima, a conversa é à mão): '
      + m.semDegrau.map((e) => esc(e.nome) + ' (' + numero(e.franquia) + ' aulas)').join(' · ')
      + '.</p>'
    : '';

  /* O QUE O NÚMERO É, e o que ainda não é. O contador de aulas do mês não existe: o número que
   * decide é o CONTRATADO, que é o tecto — uma escola que comprou pacotes até passar do ponto já
   * está a pagar a mais, mesmo sem se contar uma aula. Quando o contador existir, a mesma tabela
   * passa a ler o USADO, e o bloco não muda. */
  const semContador = (m.escolas || []).some((e) => e.fonteDoNumero === 'contratadas')
    ? '<p class="sub">O número é o da franquia <strong>contratada</strong> (plano + pacotes). O '
      + 'contador de aulas do mês ainda não existe — quando existir, esta tabela passa a ler o que '
      + 'a escola <strong>usa</strong>, e é essa a leitura que fecha a conta.</p>'
    : '';

  return '<div class="caixa" id="monitor-migrar-escolas">' +
    '<h2>A migração das escolas — quando vale a pena subir de plano</h2>' +
    '<p>Isto <strong>não</strong> é a migração da outra aba: aquela é a dos fornecedores (GitHub, '
    + 'Cloudflare, Resend) e só gasta. Esta é a das escolas, e <strong>rende</strong> — no ponto de '
    + 'viragem a escola paga o mesmo e leva mais aulas, e é aqui que se manda o consultor '
    + 'contactar.</p>' +
    '<div class="rolagem-caixa"><table><thead><tr><th>Degrau</th><th>Ponto de viragem</th>'
    + '<th>A escola paga</th><th>Leva</th><th>Deixa de receber</th></tr></thead><tbody>' + pontos
    + '</tbody></table></div>' +
    '<p><strong>' + esc(m.frase || '') + '</strong></p>' +
    tabela + topo + semContador +
    '</div>';
}

function blocoDaReceita(r, cambio) {
  if (!r) return '';
  const meses = [
    ['Por mês (MRR)', reaisDeCentavos(r.mrrCentavos)],
    ['Por ano (12 × MRR)', reaisDeCentavos(r.anualCentavos)],
    ['Contratos em vigor', reaisDeCentavos(r.brutoCentavos)],
    ['Descontos concedidos', reaisDeCentavos(r.descontosCentavos)],
    ['Recebido no mês', reaisDeCentavos(r.recebidoNoMesCentavos)],
    ['Em aberto (vencido)', reaisDeCentavos(r.emAbertoCentavos)],
  ];
  /* ── A MESMA RECEITA, LIDA EM AULAS (17/11/2026) ────────────────────────────────────────────
   *
   * A unidade comercial passou a ser a AULA (§ADITIVO §1), e esta é a tabela que responde à
   * pergunta nova: quantas aulas estão vendidas, a quanto sai cada uma, e quantas foram usadas.
   *
   * A REGRA DA SOMA INTEIRA. O consumo só aparece quando TODOS os contratos têm contagem
   * (`contratosComContagem === contratosComFranquia`). Somar os que têm daria um número que parece
   * o do parque e é parte dele — e o §L9c já pagou uma vez por apresentar uma amostra como se
   * fosse o total. Enquanto não houver contador de aulas, a linha «Aulas usadas» diz que ainda não
   * há contagem, em vez de dizer zero. */
  const a = r.aulas || null;
  const contagemInteira = a && a.contratosComFranquia > 0
    && a.contratosComContagem === a.contratosComFranquia;
  const tabelaDeAulas = a && a.franquiaTotal > 0
    ? '<div class="rolagem-caixa"><table><thead><tr><th>Aulas</th><th>Valor</th></tr></thead><tbody>' +
      '<tr><td><strong>Franquia vendida (aulas/mês)</strong></td><td>' + esc(String(a.franquiaTotal)) + '</td></tr>' +
      '<tr><td><strong>Preço por aula contratada</strong></td><td>' +
        (a.precoContratadoCentavos != null ? reaisDeCentavos(a.precoContratadoCentavos) : '—') + '</td></tr>' +
      '<tr><td><strong>Aulas usadas no mês</strong></td><td>' +
        (contagemInteira
          ? esc(String(a.usadas)) + ' de ' + esc(String(a.franquiaTotal))
            + (a.precoUsadoCentavos != null
              ? ' <span class="sub">(R$ ' + (a.precoUsadoCentavos / 100).toFixed(2).replace('.', ',')
                + ' por aula usada)</span>' : '')
          : '<span class="sub">ainda sem contagem de aulas — o contador está planejado</span>') + '</td></tr>' +
      '</tbody></table></div>'
    : '';
  return '<div class="caixa" id="monitor-receita">' +
    '<h2>A receita</h2>' +
    '<p>Do mesmo livro que o Financeiro lê: a soma dos contratos em vigor, menos os descontos ' +
    'concedidos. Uma segunda conta da receita daria um segundo número, e o que ficasse a valer ' +
    'seria o que ela lesse primeiro.</p>' +
    '<div class="rolagem-caixa"><table><thead><tr><th>O que</th><th>Valor</th></tr></thead><tbody>' +
    meses.map(([a2, b]) => '<tr><td><strong>' + esc(a2) + '</strong></td><td>' + esc(b) + '</td></tr>').join('') +
    '</tbody></table></div>' +
    /* O EIXO NOVO, NA MESMA CAIXA: é a mesma receita, e separá-la faria procurar duas vezes. */
    (tabelaDeAulas
      ? '<h3>Em aulas — a unidade que se vende desde 17/11/2026</h3>' + tabelaDeAulas
      : '') +
    '<p class="sub">Escolas com contrato: ' + r.escolas + '. Os descontos são mensais e um por ' +
    'escola — o mais recente é o que vale.</p>' +
    (cambio ? '<p class="sub">Câmbio usado no comparador: US$ 1 = R$ ' +
      String(cambio).replace('.', ',') + '</p>' : '') +
    '</div>';
}

/**
 * O BOTÃO DE MIGRAR DE UM PLANO — e a verdade sobre ele.
 *
 * «Todos esses planos aqui têm que ter o botão para migrar, para aqueles que for possível.» A
 * coluna existe em todas as linhas, e o que muda é o conteúdo: onde há caminho por API, há um
 * formulário que o percorre; onde não há, está a razão e o sítio onde a mudança se faz à mão.
 *
 * Um botão que promete o que não faz é pior do que não ter botão — quem carrega fica a achar que
 * mudou de plano e só descobre o contrário no mês seguinte, na fatura.
 */
function celulaDeMigracao(c, visibilidade) {
  const mg = c.migrar || {};
  if (!mg.possivel) {
    return '<span class="sub">' + esc(mg.motivo || 'sem caminho por API') + '</span>' +
      (mg.ligacao ? '<br><a class="sub" href="' + esc(mg.ligacao) + '">abrir o sítio da mudança</a>' : '');
  }
  /* O ÚNICO DEGRAU ACCIONÁVEL: a visibilidade do repositório (a rotação do §L9e). */
  if (mg.accao === 'visibilidade') {
    const agoraPublico = visibilidade && visibilidade.publico === true;
    const agoraPrivado = visibilidade && visibilidade.publico === false;
    const paraPublico = !agoraPublico;
    const estado = agoraPublico ? 'público' : (agoraPrivado ? 'privado' : 'não lido');
    return '<span class="sub">está <strong>' + estado + '</strong></span>' +
      /* A DOBRA É A CONFIRMAÇÃO. Abrir o repositório não se desfaz — quem já clonou, tem —, e por
       * isso a acção está atrás de um passo: um clique para abrir, outro para fazer. */
      '<details class="acordeao"><summary>' + (paraPublico ? 'Tornar público' : 'Tornar privado') +
      '</summary>' +
      '<form method="post" action="/monitoramento/visibilidade">' +
      '<input type="hidden" name="publico" value="' + (paraPublico ? 'sim' : 'nao') + '">' +
      '<input type="hidden" name="confirmado" value="sim">' +
      '<p><button class="acao ' + (paraPublico ? 'perigo' : '') + ' pequena" type="submit">' +
      (paraPublico ? 'Confirmar: tornar público' : 'Confirmar: tornar privado') + '</button></p>' +
      '<p class="sub">' + (paraPublico
        ? 'Em público os minutos de Actions não são cobrados. O código fica legível e clonável por '
          + 'qualquer pessoa, e isso não se desfaz.'
        : 'Em privado os minutos voltam a contar para o incluído. É o estado normal do dia 1.º.') +
      '</p></form></details>';
  }
  return '<span class="sub">sem caminho por API</span>';
}

/** A ABA DA MIGRAÇÃO — o custo de cada degrau, o que ele come da receita, e o botão que o muda. */
function blocoDaMigracao(m, visibilidade, recado) {
  if (!m) return '';
  const linhas = (m.cenarios || []).map((c) => '<tr>' +
    '<td><strong>' + esc(c.nome) + '</strong><br><span class="dono">' + esc(c.quando) + '</span></td>' +
    '<td>' + usd(c.usdMes) + '/mês</td>' +
    '<td>' + (c.delta > 0 ? '+' : '') + usd(c.delta) + '</td>' +
    '<td>' + (c.fraccaoDaReceita == null ? '—' : pct(c.fraccaoDaReceita)) + '</td>' +
    '<td>' + celulaDeMigracao(c, visibilidade) + '</td>' +
    '</tr>').join('');
  const aviso = recado
    ? (recado.ok
      /* A PALAVRA É DO ECRÃ, NÃO DO URL. `mudou=publico` chega sem acento porque um URL não é um
       * sítio para português; quem escreve «público» é esta linha. Apanhado pela própria asserção,
       * que lia «está agora publico». */
      ? '<p class="aviso" id="mo-recado">Feito: o repositório está agora <strong>' +
        (recado.mudou === 'publico' ? 'público' : esc(recado.mudou)) +
        '</strong>. O painel já lê o estado novo.</p>'
      /* O MOTIVO VEM EM MINÚSCULA DO SERVIDOR — é uma frase dentro de outra, e a maiúscula é daqui.
       * Um «Não foi feito. o token não pode…» é o tipo de detalhe que faz duvidar do resto. */
      : '<p class="aviso" id="mo-recado"><strong>Não foi feito.</strong> ' +
        esc(String(recado.falhou || '').replace(/^./, (c) => c.toUpperCase())) +
        '. Nada mudou no repositório.</p>')
    : '';
  return '<div class="caixa" id="monitor-migracao">' +
    '<h2>Se eu mudar de plano</h2>' + aviso +
    '<p>' + esc(m.frase) + '</p>' +
    '<div class="rolagem-caixa"><table><thead><tr><th>Plano</th><th>Custo</th>' +
    '<th>Diferença</th><th>Da receita</th><th>Migrar</th></tr></thead><tbody>' + linhas +
    '</tbody></table></div>' +
    '<p class="sub">Só o <strong>GitHub Free</strong> se muda por aqui: a migração dele é a ' +
    'visibilidade do repositório, e é a rotação do §L9e. Os outros planos são subscrições de ' +
    'pagamento, e nenhum dos três fornecedores expõe essa alteração na API — a coluna diz onde se ' +
    'faz à mão, em vez de oferecer um botão que não cumpre.</p>' +
    '<p class="sub">A coluna «da receita» é a que decide: o mesmo ' + usd(5) + ' sobre uma receita ' +
    'pequena pesa mais do que sobre uma grande. O custo é em dólar e a receita em real, e o câmbio ' +
    'usado está na aba da receita.</p>' +
    '<p class="sub">Todos os degraus somados: ' + usd(m.custoTotalSeTodosUsd) + '/mês. Estes ' +
    'preços foram lidos nas páginas dos fornecedores em ' + esc(LIDO_EM_DO_MONITOR) +
    ' — um número de cota sem data envelhece sem avisar.</p>' +
    '</div>';
}

const LIDO_EM_DO_MONITOR = (() => {
  const m = require('../nucleo/monitoramento.js');
  return m.LIDO_EM;
})();

/**
 * A PÁGINA DO MONITORAMENTO.
 *
 * As três abas, e o resumo no topo: o PIOR dos indicadores, e não a média. Uma cota a 95% e duas a
 * 10% é uma cota a 95% — e é essa que decide se há tempo.
 */
function paginaDoMonitoramento({ retrato, cambio, visibilidade, recado, aba }) {
  const r = retrato || {};
  const nivel = r.nivel || 'folga';
  const cabecalho = '<div class="caixa" id="monitor-resumo">' +
    '<h2>Como está hoje</h2>' +
    '<p>' + (nivel === 'agora'
      ? '<strong>Há uma cota no limite.</strong> É o momento de agir: a conta abaixo diz qual, e a ' +
        'aba da migração diz quanto custa resolver.'
      : (nivel === 'atencao'
        ? '<strong>Há uma cota a passar dos 80%.</strong> Ainda não dói; a decisão custa menos agora ' +
          'do que depois.'
        : '<strong>Folga em todas as cotas medidas.</strong> Nada a fazer — e o número que importa ' +
          'ver crescer é o das aulas lançadas no mês, não o das fichas.')) + '</p>' +
    '<div class="ficha">' +
    '<span>Pior indicador: <strong>' + pct(r.piorFraccao) + '</strong></span>' +
    '<span>Aulas: <strong>' + ((r.aulas && r.aulas.aulasVendidas) != null
      ? (numero(r.aulas.aulasVendidas) + ' de ' + numero(r.aulas.aulasQueEsgotamGratuito))
      : 'sem contagem')
      + '</strong></span>' +
    '<span>GitHub: <strong>' + ((r.github && r.github.minutos) || 0) + ' de ' + ((r.github && r.github.total) || 0) + ' min</strong></span>' +
    '<span>Resend: <strong>' + ((r.correio && r.correio.enviados) || 0) + ' de ' + ((r.correio && r.correio.total) || 0) + '</strong></span>' +
    '<span>Receita: <strong>' + reaisDeCentavos((r.receita && r.receita.mrrCentavos) || 0) + '/mês</strong></span>' +
    '</div>' +
    (r.agora ? '<p class="sub">Lido em ' + esc(quando(r.agora)) + '.' +
      /* A IDADE DA JANELA, DITA (25/11/2026). A lista de execuções do mês passou a ficar em cache
       * dois minutos — é o que faz a segunda abertura ser instantânea em vez de onze pedidos. Mas
       * um número sem a sua idade engana: quem abre o painel tem de saber se está a ver o mês de
       * agora ou o de dois minutos atrás. Quando a janela vem fresca, não se diz nada — dizer
       * «agora» em cada abertura é ruído. */
      (r.janelaDaCache && r.janelaLidaEm
        ? ' As execuções do mês são as de ' + esc(quando(r.janelaLidaEm)) + ' — relidas a cada dois minutos.'
        : '') + '</p>' : '') +
    '</div>';

  const abas = [['consumo', 'O consumo'], ['receita', 'A receita'], ['migracao', 'A migração']];
  const tira = '<nav class="abas" role="tablist" aria-label="Monitoramento — seções" id="mo-abas">' +
    abas.map(([n, titulo]) => '<button type="button" class="aba" role="tab" id="mo-aba-' + n + '" ' +
      'data-aba="' + n + '" aria-controls="mo-painel-' + n + '" ' +
      'aria-selected="' + (n === (aba || 'consumo') ? 'true' : 'false') + '" ' +
      'tabindex="' + (n === (aba || 'consumo') ? '0' : '-1') + '">' +
      esc(titulo) + '</button>').join('') +
    '</nav>';
  const painel = (n, corpo, primeiro) => '<div class="aba-painel" id="mo-painel-' + n + '" ' +
    'role="tabpanel" aria-labelledby="mo-aba-' + n + '" tabindex="0"' + (primeiro ? '' : ' hidden') + '>' +
    corpo + '</div>';

  return pagina({
    titulo: 'Monitoramento',
    subtitulo: 'Quanto o sistema gasta, quanto falta até o teto de cada fornecedor, e o que isso '
      + 'faz à receita. O que não é medido está dito — um painel que mente é pior do que não o ter.',
    atual: 'monitoramento',
    corpo: cabecalho + tira +
      /* AS AULAS VÊM PRIMEIRO na aba do consumo (25/11/2026): é a única cota cujo gasto é o
       * produto — as outras três são do fornecedor e sobem com o que a casa faz; esta sobe com o que
       * a escola usa. Ordenar por «o que decide» e não por «o que já existia» é a razão da ordem. */
      painel('consumo', blocoDasAulas(r.aulas) + blocoDoGithub(r.github) +
        blocoDoCloudflare(r.cloudflare) + blocoDoCorreio(r.correio),
      (aba || 'consumo') === 'consumo') +
            /* A INADIMPLÊNCIA FICA NA ABA DA RECEITA, e não numa quarta (17/11/2026): é a mesma
       * pergunta do dinheiro — «quanto entra» e «quem não pagou» lêem-se juntas, e uma aba a mais
       * para uma tabela que se abre no mesmo gesto é um clique a mais todos os meses. Entra
       * DEPOIS da receita e ANTES da migração: a receita diz o tamanho, a inadimplência diz quem
       * está fora dele. */
      /* A MIGRAÇÃO DAS ESCOLAS FICA NA ABA DA RECEITA (25/11/2026), e não na «migração»: aquela é
       * dos fornecedores e gasta; esta é das escolas e rende. Vem DEPOIS da inadimplência porque a
       * ordem é a do dinheiro — a receita diz o tamanho, a inadimplência diz quem está fora dele, e
       * esta diz quem devia estar a pagar mais e não está. */
      painel('receita', blocoDaReceita(r.receita, cambio)
        + blocoDaInadimplencia(r.inadimplencia)
        + blocoDaMigracaoDasEscolas(r.migracaoDasEscolas), aba === 'receita') +
      painel('migracao', blocoDaMigracao(r.migracao, visibilidade, recado), aba === 'migracao') +
      SCRIPT_DAS_ABAS_DO_MONITOR +
      '<p><a class="acao secundario" href="/">Voltar ao painel</a></p>',
  });
}

/**
 * O motor das abas desta página. É o mesmo contrato das outras (`aria-selected` na aba, `hidden` no
 * painel, setas do teclado) com os prefixos `mo-`: a peça é a da folha, o motor é de cada página.
 */
const SCRIPT_DAS_ABAS_DO_MONITOR = '<script>(function(){' +
  'var tira=document.getElementById("mo-abas");if(!tira)return;' +
  'var abas=tira.querySelectorAll("[data-aba]");' +
  'function abrir(nome){' +
  '  for(var i=0;i<abas.length;i++){' +
  '    var b=abas[i],k=b.getAttribute("data-aba"),eu=k===nome;' +
  '    b.setAttribute("aria-selected",eu?"true":"false");' +
  '    b.setAttribute("tabindex",eu?"0":"-1");' +
  '    var p=document.getElementById("mo-painel-"+k);' +
  '    if(p)p.hidden=!eu;}' +
  '}' +
  'tira.addEventListener("click",function(e){' +
  '  var b=e.target.closest?e.target.closest("[data-aba]"):null;' +
  '  if(!b||!tira.contains(b))return;abrir(b.getAttribute("data-aba"));' +
  '});' +
  'tira.addEventListener("keydown",function(e){' +
  '  var i=-1;for(var k=0;k<abas.length;k++){if(abas[k]===document.activeElement)i=k;}' +
  '  if(i<0)return;' +
  '  var n=i;' +
  '  if(e.key==="ArrowRight")n=(i+1)%abas.length;' +
  '  else if(e.key==="ArrowLeft")n=(i-1+abas.length)%abas.length;' +
  '  else if(e.key==="Home")n=0;' +
  '  else if(e.key==="End")n=abas.length-1;' +
  '  else return;' +
  '  e.preventDefault();abrir(abas[n].getAttribute("data-aba"));abas[n].focus();' +
  '});' +
  '})();</script>';
