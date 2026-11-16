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
    const selo = e.expurgada
      ? '<span class="selo discreto">apagada</span>'
      : (aNascer
        ? '<span class="selo discreto">a nascer</span>'
        : (estadoComercial === 'suspensa'
        ? '<span class="selo alerta">suspensa</span>'
        : (estadoComercial === 'aguardando'
          ? '<span class="selo discreto">a aguardar conciliação</span>'
          : '<span class="selo ok">ativa</span>')));

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
       * dela. */
      const desabilitadaEm = e.comercial && e.comercial.desabilitadaEm;
      const carencia = e.comercial && e.comercial.carenciaAte;
      const carenciaTexto = !desabilitadaEm
        ? ''
        : (carencia && Date.parse(carencia) > Date.now()
          ? '<br><span class="selo discreto">em carência até ' + esc(quando(carencia)) + '</span>'
          : '<br><span class="selo ok">pode apagar</span>');
      celulas.push('<td>' + esc(quando(desabilitadaEm)) + carenciaTexto + '</td>');
      const podeHabilitar = estadoComercial !== 'ativa';
      const podeDesabilitar = estadoComercial === 'ativa';
      celulas.push('<td class="acoes-da-lista">' +
        '<button class="acao pequena" type="button" data-comercial="ativa" data-escola="' +
        esc(e.slug) + '"' + (podeHabilitar ? '' : ' disabled') + '>Habilitar</button>' +
        '<button class="acao pequena secundario" type="button" data-comercial="suspensa" ' +
        'data-escola="' + esc(e.slug) + '"' + (podeDesabilitar ? '' : ' disabled') +
        '>Desabilitar</button>' +
        '</td>');
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
  if (recorte === 'vivas') {
    colunas.push('<th>Plano</th>', '<th>Habilitada</th>', '<th>Desabilitada</th>', '<th>Acesso</th>');
  }
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
      (apagadas ? '' : blocoDoCofre() + SCRIPT_DO_COFRE + SCRIPT_DO_ACESSO) +
      '<p><a class="acao secundario" href="/">Voltar ao painel</a></p>',
  });
}

/** O atalho que as rotas usam — e que a prova exercita sem passar pelo Worker. */
function paginaDasApagadas({ escolas, ordem, professores }) {
  return paginaDeLista({ recorte: 'apagadas', escolas, ordem, professores });
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
  'if(!botoes.length)return;' +
  'function recado(t,erro){' +
  '  var cx=document.getElementById("acesso-recado");' +
  '  if(!cx){cx=document.createElement("p");cx.id="acesso-recado";cx.className="aviso";' +
  '    var t=document.querySelector("table");if(t&&t.parentNode)t.parentNode.insertBefore(cx,t.nextSibling);' +
  '    else document.body.appendChild(cx);}' +
  '  cx.textContent=t||"";cx.className=erro?"aviso alerta":"aviso";}' +
  'for(var i=0;i<botoes.length;i++)(function(b){' +
  '  b.addEventListener("click",function(){' +
  '    var escola=b.getAttribute("data-escola"),estado=b.getAttribute("data-comercial");' +
  '    if(!escola||!estado)return;' +
  '    var irmaos=document.querySelectorAll("[data-escola=\""+escola+"\"]");' +
  '    for(var j=0;j<irmaos.length;j++)irmaos[j].disabled=true;' +
  '    recado((estado==="ativa"?"a habilitar ":"a desabilitar ")+escola+"…",false);' +
  '    fetch("/api/escola/comercial",{method:"POST",headers:{"Content-Type":"application/json"},' +
  '      body:JSON.stringify({escola:escola,estado:estado}),cache:"no-store"})' +
  '    .then(function(r){return r.json().catch(function(){return {};});})' +
  '    .then(function(d){' +
  '      if(d&&d.ok){location.reload();return;}' +
  '      for(var k=0;k<irmaos.length;k++)irmaos[k].disabled=false;' +
  '      recado((d&&d.erro)||"não foi possível mudar o acesso",true);})' +
  '    .catch(function(){for(var k=0;k<irmaos.length;k++)irmaos[k].disabled=false;' +
  '      recado("falha de rede — nada foi alterado",true);});' +
  '  });' +
  '})(botoes[i]);' +
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
function paginaFinanceira({ pix, descontos, escolas }) {
  const chave = (pix && pix.chave) || '';
  const titular = (pix && pix.titular) || '';
  const lista = Array.isArray(descontos) ? descontos : [];
  const vivas = Array.isArray(escolas) ? escolas : [];

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

  return pagina({
    titulo: 'Financeiro',
    subtitulo: 'A chave que recebe os pagamentos, e os descontos concedidos. A conciliação é ' +
      'manual: o pagamento entra nesta conta e é conferido à mão.',
    atual: 'financeiro',
    corpo: blocoDaChave + blocoDoDesconto + tabela +
      SCRIPT_DO_FINANCEIRO +
      '<p><a class="acao secundario" href="/">Voltar ao painel</a></p>',
  });
}

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
  '})();</script>';

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
  paginaFinanceira, SCRIPT_DO_FINANCEIRO,
};
