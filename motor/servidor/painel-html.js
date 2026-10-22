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
 * mesma página. O menu tem a logomarca e «Escolas apagadas» — e mais nada: nem «Sistema Lastro»,
 * nem «Área do Professor», nem «Bastidores», que são de uma ESCOLA e não da raiz. Levar quem
 * administra o sistema para um menu de escola é entrar noutra estrutura.
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

/** O endereço de uma escola viva — o mesmo que o `/api/escolas` devolve. */
function urlDaEscola(slug) {
  return 'https://' + String(slug || '') + '.tmenegaz77.workers.dev/';
}

/**
 * A LISTA — a tabela das escolas, num dos três recortes.
 *
 *   'todas'    — as vivas e as apagadas, com o registo de cada uma (a página `/`);
 *   'apagadas' — só as que saíram, com a data da saída e o link para o registo;
 *   'vivas'    — só as que existem: nome, professor, criação e estado.
 *
 * É UMA função para as três porque a ordem e o desenho da linha são os mesmos — o que muda é
 * que colunas fazem sentido. Duas cópias divergiriam no dia em que uma ganhasse uma coluna.
 *
 * O NOME É O LINK (22/10/2026). Numa escola viva, o nome leva ao site dela — é o gesto que
 * qualquer pessoa tenta primeiro, e poupa a viagem pelo repositório para achar o subdomínio.
 * Numa escola apagada não há site: o nome fica texto, e o destino é o registo.
 */
function tabelaDeEscolas(escolas, modo) {
  const recorte = modo || 'todas';
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
    const celulas = [
      '<td>' + rotulo + '</td>',
      '<td>' + esc(e.professor || '—') + '</td>',
      '<td>' + esc(diaOuTraco(e.criada_em)) + '</td>',
    ];
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

  const colunas = ['Escola', 'Professor', 'Criada']
    .concat(recorte !== 'vivas' ? ['Apagada'] : [])
    .concat(['Estado'])
    .concat(recorte !== 'vivas' ? ['Registo'] : []);

  return '<table>' +
    '<thead><tr>' + colunas.map((c) => '<th>' + c + '</th>').join('') + '</tr></thead>' +
    '<tbody>' + lista.map(linha).join('') + '</tbody>' +
    '</table>';
}

/**
 * O BLOCO QUE ENTRA NA PÁGINA DA RAIZ. A `danca` é a apresentação — um arquivo versionado,
 * regerado por `tools/gerar-raiz.sh` —, e a lista não pode viver dentro dele: a próxima geração
 * apagava-a. Ela entra por um marcador, que o Worker substitui em tempo de resposta.
 *
 * O `id` do título é a âncora do ÍNDICE da página (ver `indiceDaPagina`): é por ela que «Escolas
 * do sistema» aparece no «Nesta página», ao lado dos capítulos da apresentação — e por isso o
 * índice tem de ser montado DEPOIS desta substituição.
 */
const MARCADOR = '<div id="escolas-do-sistema"></div>';
const MARCADOR_INDICE = '<div id="indice-da-pagina"></div>';

function blocoDeEscolas(escolas) {
  return '<h2 id="escolas-do-sistema">Escolas do sistema</h2>' +
    '<p>As que existem e as que existiram. Uma escola apagada continua aqui: o expurgo tira-a do ' +
    'ar e do repositório, e deixa o elo — a memória de que ela existiu.</p>' +
    tabelaDeEscolas(escolas, 'todas') +
    '<p><a class="acao secundario" href="/escolas-vivas">Ver só as vivas</a> ' +
    '<a class="acao secundario" href="/escolas-apagadas">Ver só as apagadas</a></p>';
}

/**
 * O ÍNDICE DESTA PÁGINA — o «Nesta página», montado a partir dos títulos REAIS.
 *
 * POR QUE NO SERVIDOR, e não no `gerar-raiz.sh`. Duas razões, e as duas são de facto: o corpo da
 * raiz é regerado de `biblioteca/apresentacao.md` e não sabe nada da lista de escolas — que só
 * existe depois de injetada; e um índice escrito à mão no casco apodreceria no dia em que o texto
 * ganhasse um capítulo novo. Lendo os `<h2>`/`<h3>` do HTML já montado, o índice é sempre o da
 * página que está a ser servida.
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

  // A montagem é uma pilha de dois níveis, e não uma árvore: os h2 são os capítulos e os h3
  // são os passos de cada um. Um h3 sem h2 antes não tem onde ser pendurado, e é ignorado.
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
function paginaDeLista({ recorte, escolas }) {
  const apagadas = recorte === 'apagadas';
  return pagina({
    titulo: apagadas ? 'Escolas apagadas' : 'Escolas vivas',
    subtitulo: apagadas
      ? 'O registo do que foi expurgado — a proveniência de uma escola que existiu.'
      : 'As escolas que existem agora. O nome leva ao site de cada uma.',
    atual: apagadas ? 'escolas-apagadas' : 'escolas-vivas',
    corpo: tabelaDeEscolas(escolas, recorte) +
      '<p><a class="acao secundario" href="/">Voltar ao painel</a></p>',
  });
}

/** O atalho que as rotas usam — e que a prova exercita sem passar pelo Worker. */
function paginaDasApagadas({ escolas }) {
  return paginaDeLista({ recorte: 'apagadas', escolas });
}

function paginaDasVivas({ escolas }) {
  return paginaDeLista({ recorte: 'vivas', escolas });
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
  MARCADOR, MARCADOR_INDICE, tabelaDeEscolas, blocoDeEscolas, indiceDaPagina, urlDaEscola,
  pagina, resposta, paginaDasApagadas, paginaDasVivas, paginaDoRegistro, paginaSemToken,
};
