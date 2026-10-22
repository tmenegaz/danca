'use strict';

/**
 * painel-html.js — o PAINEL OPERACIONAL do sistema, servido pela raiz (`danca`).
 *
 * O QUE ELE É. A raiz deixou de ser só a apresentação: ela é o lugar de onde a pesquisadora
 * administra o sistema. A primeira secção é **Escolas apagadas** — o registro do que foi
 * expurgado, com a data de criação, a de saída e o elo que o expurgo deixou. As próximas
 * (escolas criadas, professores, pagamentos) entram no mesmo desenho, e o menu cresce no
 * `ITENS_DO_PAINEL` de `tools/templates/nav-html.js` — uma linha por secção, e ela aparece em
 * todas as páginas do painel ao mesmo tempo.
 *
 * POR QUE O PAINEL NÃO FICA NO `raiz/index.html`. Aquele arquivo é a apresentação, e o corpo
 * dele é REGERADO por `tools/gerar-raiz.sh` a partir de `biblioteca/apresentacao.md`. Uma lista
 * que muda a cada expurgo não pode viver num arquivo gerado de um texto fixo: a próxima
 * geração apagava-a. Aqui ela é montada do ÍNDICE (`indices/acervo.json` e o elo de cada
 * escola), que é o que já existe e o que já é versionado.
 *
 * DE ONDE VÊM OS DADOS, e por que do ÍNDICE. `motor/nucleo/indices.js` deriva o acervo das
 * fontes do repositório; a raiz lê esse índice (`indice-acervo.js`), e cada escola já traz
 * `criada_em`, `expurgada` e `expurgada_em`. O DETALHE (o que foi apagado, o motivo, o KV) vive
 * no elo `escola/<slug>/indice.json`, e só se lê quando alguém abre o registro — uma leitura por
 * consulta, em vez de N numa lista.
 *
 * IDENTIDADE. Nada aqui inventa peça: a página usa a folha do sistema (`/assets/style.css`, a
 * mesma das escolas e da raiz), a barra GERADA por `nav-html.js`, e as peças do catálogo —
 * `header.doc` com `h1`/`.subtitulo`, `.caixa`, `.ficha`, `.selo`, a `<table>` da folha (a mesma
 * que o pandoc usa nos documentos) e `a.acao`. `tools/check-identidade.js` mede esta página
 * junto com as outras superfícies que emitem marcação (checagem 8).
 */

const { navSistema } = require('../../tools/templates/nav-html.js');

const TELAS = {
  painel: 'painel',
  apagadas: 'escolas-apagadas',
  registro: 'escolas-apagadas',
};

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
 * O índice guarda instantes ISO com microssegundos (`2026-10-19T18:18:57.289485+00:00`), e o
 * que a lista responde é «que dia». A conversão é por expressão regular, e não por `Date`: o
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
 * O CASCO. Uma barra GERADA (a mesma das escolas, com o grupo do painel), o cabeçalho do
 * documento e o corpo. `data-layout="painel"` é o atributo que a folha lê para usar a largura
 * de trabalho em vez da coluna de leitura — é o mesmo recurso das páginas dos Bastidores.
 */
function pagina({ titulo, subtitulo, atual, corpo }) {
  return '<!doctype html><html lang="pt-BR" data-paleta="verde">' +
    '<head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + esc(titulo) + ' · Painel · Sistema Lastro</title>' +
    '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">' +
    '<link rel="stylesheet" href="/assets/style.css">' +
    '</head><body id="top" data-layout="painel" data-tela="' + esc(atual) + '">' +
    navSistema({ atual, painel: true }) +
    '<header class="doc"><h1>' + esc(titulo) + '</h1>' +
    (subtitulo ? '<p class="subtitulo">' + esc(subtitulo) + '</p>' : '') +
    '</header>' +
    '<main><div class="conteudo">' + corpo + '</div></main>' +
    '<a class="topo" href="#top" title="Voltar ao topo">&#8593;</a>' +
    '<script src="/assets/nav.js"></script>' +
    '</body></html>';
}

/** Resposta HTML com o `no-store` do painel: um registo de expurgo não se serve de cache. */
function resposta(html, status) {
  return new Response(html, {
    status: status || 200,
    headers: {
      'Content-Type': 'text/html;charset=utf-8',
      // O PAINEL É A VERDADE DO REPOSITÓRIO AGORA. Servir uma lista de ontem a quem acabou de
      // expurgar é o mesmo defeito do cache de índice com TTL — e aqui o custo de não ter cache
      // é uma leitura, não um dado errado.
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * A PÁGINA INICIAL DO PAINEL — o índice das secções.
 *
 * Ela é o lugar do crescimento: cada item do menu vira um `.caixa` com o título, o estado e o
 * caminho. Hoje há um; no dia em que houver cinco, esta lista continua a ser escrita à mão aqui
 * — e é de propósito: a ordem e o resumo de uma secção são uma decisão editorial, não um dado.
 */
function paginaDoPainel({ secoes }) {
  const blocos = (secoes || []).map((s) => {
    return '<div class="caixa">' +
      '<h2>' + esc(s.titulo) + '</h2>' +
      '<p>' + esc(s.resumo) + '</p>' +
      '<div class="ficha"><span>' + esc(s.contagem) + '</span></div>' +
      '<p><a class="acao secundario" href="' + esc(s.href) + '">Abrir</a></p>' +
      '</div>';
  }).join('');
  return pagina({
    titulo: 'Painel',
    subtitulo: 'A gestão do sistema — o que existe, o que existiu, e o registo de cada coisa.',
    atual: TELAS.painel,
    corpo: blocos,
  });
}

/**
 * A LISTA DAS ESCOLAS APAGADAS.
 *
 * `escolas` são as entradas do acervo com `expurgada: true` — cada uma já traz `criada_em`,
 * `expurgada_em`, o professor e a contagem de ciclos. A tabela é a peça da folha (a mesma que
 * os documentos gerados usam para as tabelas do pandoc): quatro colunas de facto e uma de ação.
 *
 * A ORDEM é a da saída mais recente primeiro. Quem abre este painel quer saber o que acabou de
 * sair; o histórico antigo desce. `expurgada_em` ausente (uma escola cujo elo é anterior ao
 * campo) vai para o fim, e mostra o traço.
 */
function paginaDasApagadas({ escolas }) {
  const lista = (escolas || []).slice().sort((a, b) => {
    const da = String(a.expurgada_em || '');
    const db = String(b.expurgada_em || '');
    if (da === db) return String(a.slug).localeCompare(String(b.slug));
    if (!da) return 1;
    if (!db) return -1;
    return db.localeCompare(da);
  });

  if (!lista.length) {
    return pagina({
      titulo: 'Escolas apagadas',
      subtitulo: 'O registo do que foi expurgado — a proveniência de uma escola que existiu.',
      atual: TELAS.apagadas,
      corpo: '<div class="caixa nota">' +
        '<h2>Nenhuma escola apagada</h2>' +
        '<p>Toda escola criada tem um elo em <code>escola/&lt;slug&gt;/indice.json</code>, e é ele ' +
        'que aparece aqui depois do expurgo. Uma lista vazia quer dizer que nenhuma foi apagada — ' +
        'não que o registo não exista.</p>' +
        '</div>',
    });
  }

  const linhas = lista.map((e) => {
    const nome = e.nome && e.nome !== e.slug ? e.nome + ' (' + e.slug + ')' : e.slug;
    return '<tr>' +
      '<td><strong>' + esc(nome) + '</strong></td>' +
      '<td>' + esc(e.professor || '—') + '</td>' +
      '<td>' + esc(diaOuTraco(e.criada_em)) + '</td>' +
      '<td>' + esc(diaOuTraco(e.expurgada_em)) + '</td>' +
      '<td><a href="/painel/escolas-apagadas/' + encodeURIComponent(e.slug) + '">Abrir o registo</a></td>' +
      '</tr>';
  }).join('');

  return pagina({
    titulo: 'Escolas apagadas',
    subtitulo: 'O registo do que foi expurgado — a proveniência de uma escola que existiu.',
    atual: TELAS.apagadas,
    corpo: '<table>' +
      '<thead><tr>' +
      '<th>Escola</th><th>Professor</th><th>Criada</th><th>Apagada</th><th>Registo</th>' +
      '</tr></thead>' +
      '<tbody>' + linhas + '</tbody>' +
      '</table>' +
      '<p>O registo de cada escola não é um relatório à parte: é o elo que o expurgo grava no ' +
      'próprio índice, e ele não se apaga — a proveniência acrescenta.</p>',
  });
}

/**
 * O REGISTO DE UMA ESCOLA — a página que faltava.
 *
 * ATÉ 22/10/2026 o elo do expurgo só existia dentro do processo: ficava em
 * `escola/<slug>/indice.json`, versionado, e nenhuma página o mostrava. Quem quisesse saber o
 * que tinha sido apagado abria o JSON no repositório. Isto dá-lhe um destino.
 *
 * O QUE A PÁGINA MOSTRA, e por que cada coisa: a IDENTIDADE (nome, pasta, professor) porque é
 * o que liga a memória à pasta que já não existe; as DATAS, porque é o «de quando a quando» que
 * responde «esta escola existiu»; o MOTIVO tal como foi declarado; os ELOS, um por expurgo —
 * não só o último, porque uma escola pode ter sido apagada, recriada e apagada outra vez, e a
 * sequência É a proveniência; e, por fim, os ARQUIVOS que saíram do repositório e o que ficou no
 * KV — o que o expurgo conseguiu e o que deixou pendente.
 */
function paginaDoRegistro({ slug, indice }) {
  const elos = (indice && Array.isArray(indice.expurgo)) ? indice.expurgo : [];
  const eloDe = (e) => {
    const arquivos = Array.isArray(e.apagado) ? e.apagado : [];
    const kv = e.kv && typeof e.kv === 'object' ? e.kv : null;
    const linhasDeArquivo = arquivos.map((c) => '<tr><td><code>' + esc(c) + '</code></td></tr>').join('');
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
          '<tbody>' + linhasDeArquivo + '</tbody></table>'
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
    atual: TELAS.registro,
    corpo: identidade +
      (elos.length
        ? elos.map(eloDe).join('')
        : '<div class="caixa nota"><h2>Sem elos</h2><p>O índice da escola existe, mas não há ' +
          'nenhum elo de expurgo nele — a escola não foi apagada por este caminho.</p></div>') +
      '<p><a class="acao secundario" href="/painel/escolas-apagadas">Voltar à lista</a></p>',
  });
}

module.exports = {
  esc, dia, diaOuTraco, quando, pagina, resposta,
  paginaDoPainel, paginaDasApagadas, paginaDoRegistro,
};
