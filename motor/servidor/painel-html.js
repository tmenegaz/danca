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

/**
 * A LISTA — a tabela das escolas. É a MESMA nas três superfícies (a página da raiz, a lista
 * filtrada e o registo, que volta a ela), e é por isso que é uma função e não marcação repetida:
 * duas cópias divergem no dia em que uma ganhar uma coluna.
 *
 * A ORDEM põe o que saiu por último no topo. Quem abre o painel quer saber o que acabou de
 * acontecer; o histórico desce. Uma escola viva (sem `expurgada_em`) desce ao fim — ela não
 * «saiu», logo não tem data de saída.
 */
function tabelaDeEscolas(escolas) {
  const lista = (escolas || []).slice().sort((a, b) => {
    const da = String(a.expurgada_em || '');
    const db = String(b.expurgada_em || '');
    if (da === db) return String(a.slug).localeCompare(String(b.slug));
    if (!da) return 1;
    if (!db) return -1;
    return db.localeCompare(da);
  });

  if (!lista.length) {
    return '<div class="caixa nota">' +
      '<h2>Nenhuma escola</h2>' +
      '<p>Não há escola nenhuma no sistema. Toda escola criada deixa um elo em ' +
      '<code>escola/&lt;slug&gt;/indice.json</code>, e é de lá que esta lista sai — uma lista ' +
      'vazia quer dizer que nenhuma existe, não que a leitura falhou.</p>' +
      '</div>';
  }

  const linhas = lista.map((e) => {
    const nome = e.nome && e.nome !== e.slug ? e.nome + ' (' + e.slug + ')' : e.slug;
    // O SELO É O ESTADO DO DADO, e é a peça que a folha já desenha: `ok` é a escola viva,
    // `discreto` a que saiu. Não se inventa cor nem forma.
    const selo = e.expurgada
      ? '<span class="selo discreto">apagada</span>'
      : '<span class="selo ok">viva</span>';
    // O REGISTO SÓ EXISTE PARA QUEM SAIU. Uma escola viva não tem elo de expurgo — e um link
    // que levasse a uma página vazia seria pior do que não haver link.
    const registo = e.expurgada
      ? '<a href="/escolas-apagadas/' + encodeURIComponent(e.slug) + '">Abrir o registo</a>'
      : '—';
    return '<tr>' +
      '<td><strong>' + esc(nome) + '</strong></td>' +
      '<td>' + esc(e.professor || '—') + '</td>' +
      '<td>' + esc(diaOuTraco(e.criada_em)) + '</td>' +
      '<td>' + esc(diaOuTraco(e.expurgada_em)) + '</td>' +
      '<td>' + selo + '</td>' +
      '<td>' + registo + '</td>' +
      '</tr>';
  }).join('');

  return '<table>' +
    '<thead><tr>' +
    '<th>Escola</th><th>Professor</th><th>Criada</th><th>Apagada</th><th>Estado</th><th>Registo</th>' +
    '</tr></thead>' +
    '<tbody>' + linhas + '</tbody>' +
    '</table>';
}

/**
 * O BLOCO QUE ENTRA NA PÁGINA DA RAIZ. A `danca` é a apresentação — um arquivo versionado,
 * regerado por `tools/gerar-raiz.sh` —, e a lista não pode viver dentro dele: a próxima geração
 * apagava-a. Ela entra por um marcador (`<div id="escolas-do-sistema"></div>`), que o Worker
 * substitui. O `id` não é `class` de propósito: não é uma peça, é um lugar.
 */
const MARCADOR = '<div id="escolas-do-sistema"></div>';

function blocoDeEscolas(escolas) {
  const apagadas = (escolas || []).filter((e) => e.expurgada);
  return '<h2>Escolas do sistema</h2>' +
    '<p>As que existem e as que existiram. Uma escola apagada continua aqui: o expurgo tira-a do ' +
    'ar e do repositório, e deixa o elo — a memória de que ela existiu.</p>' +
    tabelaDeEscolas(escolas) +
    '<p><a class="acao secundario" href="/escolas-apagadas">Ver só as apagadas (' +
    apagadas.length + ')</a></p>';
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

/** A LISTA FILTRADA — o destino do item do menu. */
function paginaDasApagadas({ escolas }) {
  const apagadas = (escolas || []).filter((e) => e.expurgada);
  return pagina({
    titulo: 'Escolas apagadas',
    subtitulo: 'O registo do que foi expurgado — a proveniência de uma escola que existiu.',
    atual: 'escolas-apagadas',
    corpo: tabelaDeEscolas(apagadas) +
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
  MARCADOR, tabelaDeEscolas, blocoDeEscolas,
  pagina, resposta, paginaDasApagadas, paginaDoRegistro, paginaSemToken,
};
