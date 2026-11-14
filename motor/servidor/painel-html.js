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
function dia(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) return null;
  return m[3] + '/' + m[2] + '/' + m[1];
}

/** O dia, ou o traço que diz «não há» — nunca uma célula vazia, que se lê como defeito. */
function diaOuTraco(iso) {
  return dia(iso) || '—';
}

/** O carimbo com data e hora, para o registo do expurgo (onde a hora é a prova). */
function quando(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(iso || ''));
  if (!m) return diaOuTraco(iso);
  return m[3] + '/' + m[2] + '/' + m[1] + ' às ' + m[4] + ':' + m[5];
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
function thOrdenavel(rotulo, chave, atual, base) {
  if (atual === chave) {
    return '<th aria-sort="ascending">' + esc(rotulo) + '</th>';
  }
  const alvo = base + (chave === base ? '' : '?ordem=' + encodeURIComponent(chave));
  return '<th aria-sort="none"><a href="' + esc(alvo) + '" title="Ordenar por ' + esc(rotulo.toLowerCase()) +
    '">' + esc(rotulo) + '</a></th>';
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
    const selo = e.expurgada
      ? '<span class="selo discreto">apagada</span>'
      : '<span class="selo ok">viva</span>';

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
    celulas.push('<td>' + selo + '</td>');
    if (recorte !== 'vivas') {
      celulas.push('<td>' + (e.expurgada
        ? '<a href="/escolas-apagadas/' + encodeURIComponent(e.slug) + '">Abrir o registo</a>'
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
  colunas.push('<th>Estado</th>');
  if (recorte !== 'vivas') colunas.push('<th>Registo</th>');

  return '<table>' +
    '<thead><tr>' + colunas.join('') + '</tr></thead>' +
    '<tbody>' + lista.map(linha).join('') + '</tbody>' +
    '</table>' +
    '<p class="aviso">A coluna «' + (recorte === 'apagadas' ? 'Professores' : 'Professor') +
    '» ordena quando se clica no título. A ordem em vigor é a de cima; a data continua a ser a ' +
    'ordem natural desta lista.</p>';
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
function tabelaDeProfessores(professores, escolas, ordem) {
  const criterio = ordemPedida(ordem, ['nome', 'escolas'], 'nome');
  const vivas = new Set((escolas || []).filter((e) => !e.expurgada).map((e) => e.slug));
  const ativasDe = (p) => (p && p.escolas ? p.escolas : []).filter((s) => vivas.has(s));
  const lista = (professores || []).slice().sort((a, b) => {
    // ORDENAR PELAS ESCOLAS VIVAS (22/10/2026) — pedido da dona do produto: «que daí eu consigo
    // ordenar pelas mesmas escolas». É o que agrupa os professores que partilham escola, e o
    // desempate é o nome, para a ordem não depender de como o índice veio.
    if (criterio === 'escolas') {
      const ea = ativasDe(a).join(', ').toLowerCase();
      const eb = ativasDe(b).join(', ').toLowerCase();
      if (ea !== eb) return ea < eb ? -1 : 1;
    }
    const na = nomeDoProfessor(a).toLowerCase();
    const nb = nomeDoProfessor(b).toLowerCase();
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
    const ativas = ativasDe(p);
    const escolasCelula = ativas.length
      ? listaDeLigacoes(ativas, { rotulo: (s) => s })
      : '<span class="selo discreto">sem escola viva</span>';
    /*
     * A COLUNA QUE FALTAVA (22/10/2026): «aqui, nessa janela de professores, eu preciso de uma
     * coluna anterior que é o nome do professor. Eu preciso saber o nome real do professor.»
     *
     * O nome vem do inventário da escola que declarou a pessoa — `professores[].nome` ou o
     * `professor.nome` do responsável. A AUSÊNCIA É DITA, não disfarçada: quando o repositório
     * não guarda o nome (professor antigo, de uma escola cujo KV já foi expurgado), a célula
     * mostra um traço com o motivo no `title`, e não o slug, que já está na coluna ao lado. Pôr
     * o slug aqui fingiria um nome que ninguém registou.
     */
    const nome = String(p.nome || '').trim();
    const nomeCelula = nome
      ? '<strong>' + esc(nome) + '</strong>'
      : '<span class="selo discreto" title="o repositório não guarda o nome deste professor: ' +
        'a escola que o cadastrou já não existe, ou ele nasceu antes de o nome se gravar. ' +
        'Editar o nome de um professor principal grava-o; um secundário ganha-o ao ser declarado ' +
        'pela escola.">sem nome registado</span>';
    return '<tr>' +
      '<td>' + nomeCelula + '</td>' +
      '<td><code>' + esc(p.slug) + '</code></td>' +
      '<td>' + escolasCelula + '</td>' +
      '</tr>';
  }).join('');

  return '<table>' +
    '<thead><tr>' +
    thOrdenavel('Nome', 'nome', criterio, '/professores') +
    '<th>Pasta</th>' +
    thOrdenavel('Escolas vivas', 'escolas', criterio, '/professores') +
    '</tr></thead>' +
    '<tbody>' + linhas + '</tbody>' +
    '</table>' +
    '<p class="aviso">A <strong>pasta</strong> é o identificador do professor — aparece nos caminhos ' +
    'do repositório e nos documentos, e não muda quando o nome muda. Quem ordena são os títulos ' +
    '«Nome» e «Escolas vivas»: a segunda junta quem partilha escola.</p>';
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
function paginaDeLista({ recorte, escolas, ordem, professores }) {
  const apagadas = recorte === 'apagadas';
  return pagina({
    titulo: apagadas ? 'Escolas apagadas' : 'Escolas vivas',
    subtitulo: apagadas
      ? 'O registo do que foi expurgado — a proveniência de uma escola que existiu.'
      : 'As escolas que existem agora. O nome leva ao site de cada uma.',
    atual: apagadas ? 'escolas-apagadas' : 'escolas-vivas',
    corpo: tabelaDeEscolas(escolas, recorte, ordem, professores) +
      '<p><a class="acao secundario" href="/">Voltar ao painel</a></p>',
  });
}

/** O atalho que as rotas usam — e que a prova exercita sem passar pelo Worker. */
function paginaDasApagadas({ escolas, ordem, professores }) {
  return paginaDeLista({ recorte: 'apagadas', escolas, ordem, professores });
}

function paginaDasVivas({ escolas, ordem, professores }) {
  return paginaDeLista({ recorte: 'vivas', escolas, ordem, professores });
}

/**
 * A PÁGINA DOS PROFESSORES — a terceira lista, e a que atende a regra «um professor, várias
 * escolas».
 *
 * Ela lê `acervo.professores` (que o índice deriva das escolas e dos ciclos) e `acervo.escolas`
 * (para saber quais estão vivas). Uma requisição, a mesma do resto do painel.
 */
function paginaDosProfessores({ professores, escolas, ordem }) {
  return pagina({
    titulo: 'Professores',
    subtitulo: 'Quem trabalha hoje, e as escolas vivas de cada um. Um professor pode estar em ' +
      'mais de uma.',
    atual: 'professores',
    corpo: tabelaDeProfessores(professores, escolas, ordem) +
      '<p><a class="acao secundario" href="/">Voltar ao painel</a></p>',
  });
}

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

module.exports = {
  esc, dia, diaOuTraco, quando,
  MARCADOR, MARCADOR_INDICE, tabelaDeEscolas, tabelaDeProfessores, blocoDeEscolas,
  indiceDaPagina, urlDaEscola, listaDeLigacoes, nomeDoProfessor,
  pagina, resposta, paginaDasApagadas, paginaDasVivas, paginaDosProfessores, paginaDoRegistro, paginaSemToken,
};
