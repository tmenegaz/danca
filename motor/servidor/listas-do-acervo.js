'use strict';

/**
 * listas-do-acervo.js — AS TRÊS LISTAS DA ÁREA DO PROFESSOR, servidas pela ponte (24/10/2026).
 *
 * PORQUE NÃO SÃO MONTADAS NO DEPLOY. Elas listavam **turmas** — uma linha por turma, e as três
 * páginas iguais. Mas o que a listagem tem de dizer é «a anamnese de quem, feita por quem,
 * quando», e isso não está no disco: está no ACERVO, no KV da escola, e muda a cada ato
 * registado. Uma página montada no deploy mostrava o acervo do dia do deploy, e não o de hoje.
 *
 * A PONTE JÁ SERVE A PORTA e os Bastidores por esta razão, e é o mesmo lugar: quem tem o KV e o
 * índice de envelopes é ela. O desenho da lista é o MESMO dos outros cinco — `lista-html.js` —,
 * porque a listagem é o padrão de todas; o que muda é de onde vêm os dados.
 *
 * O QUE ESTA LISTA **NÃO** INVENTA. Sem `gerado_em` no resumo do índice, a data aparece como
 * «—»; sem turma na curadoria, a caixa diz «sem turma». Uma listagem que preenche as lacunas com
 * uma suposição é pior do que uma que as mostra: a suposição parece um facto.
 */

const listas = require('../nucleo/lista-html.js');
const porta = require('../nucleo/porta.js');
const nav = require('../nucleo/nav.js');
const linhaDeBase = require('../nucleo/linha-de-base.js');
const desligamento = require('../nucleo/desligamento.js');
const { criarArmazenamento } = require('./cloudflare.js');

const esc = (t) => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** `2026-10-20T14:32` → `20/10/2026`. A data que se lê numa listagem é o DIA. */
function dia(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}

/**
 * O nome de quem fez — o do slug quando não há o nome escrito no formulário.
 *
 * «O NOME» E «O SLUG» NÃO SÃO A MESMA COISA, e o campo `professorNome` do resumo trazia os dois
 * (12/11/2026). Ele é `contexto-professor` do envelope, e há planos antigos que guardaram ali o
 * **slug** (`pe-torto`) em vez do nome — a listagem mostrava «Quem fez: pe-torto», que é o código
 * a falar em público. A regra passa a ser: quando o valor é o próprio slug, ele não é nome
 * nenhum, e capitaliza-se como sempre (`Pe Torto`); quando é outra coisa, é o nome que o professor
 * escreveu e não se lhe toca.
 */
function nomeDoProfessor(registo) {
  const slug = String(registo.professor || '').trim();
  const nome = String(registo.professorNome || '').trim();
  if (nome && nome !== slug) return nome;
  if (!slug) return nome;
  return slug.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

/** A turma de cada aluna, lida das curadorias vigentes. `Map<apelido, nomeDaTurma>`. */
function turmaDaAluna(curadorias) {
  const mapa = new Map();
  const vigentes = (Array.isArray(curadorias) ? curadorias : []).filter((c) => c && !c.substituidaPor);
  for (const c of vigentes) {
    const nomes = (Array.isArray(c.turmas) ? c.turmas : [c.turma]).map((x) => String(x || '').trim()).filter(Boolean);
    for (const nome of nomes) {
      for (const a of (Array.isArray(c.alunas) ? c.alunas : [])) {
        if (!mapa.has(a)) mapa.set(a, nome);
      }
    }
  }
  return mapa;
}

/**
 * A TURMA DE CADA ALUNA, COM A LINHA DE BASE À FRENTE (05/11/2026).
 *
 * A LISTAGEM DIZIA «NOVA» E «SEM TURMA» A DUAS ALUNAS QUE TINHAM TUDO FEITO. A pesquisadora, a
 * 05/11/2026: «essa aluna A e aluna B, ambas eu já fiz a linha de base delas e já as coloquei na
 * turma. Então isso precisa ser ajustado também. E ela já não é mais nova, porque eu já fiz a
 * linha de base dela.»
 *
 * A tela não estava a mentir sobre o dado: estava a perguntar à fonte errada. O elenco de uma
 * turma passou a ser declarado pelo PASSO 5 da linha de base (5/11), e a curadoria ficou com a
 * atribuição (que professor, que turma). Em `calango` — medido por API, não por ecrã — a
 * curadoria está vazia e há uma linha de base enviada com as duas alunas: donde, «sem turma» para
 * as duas.
 *
 * A LINHA DE BASE VENCE, E A CURADORIA FICA DE RECURSO. A ordem não é preferência de gosto: a
 * linha de base é o registo do ACTO que mandou aquelas alunas para aquela turma, com data; a
 * curadoria, quando declara alunas, declara a mesma coisa por outra via. Duas fontes do mesmo
 * facto divergem na primeira correcção, e a que fica para trás é a que a tela mostra.
 */
function turmasDasAlunas(curadorias, linhasDeBase) {
  const mapa = turmaDaAluna(curadorias);
  for (const [apelido, f] of linhaDeBase.filiacaoDasAlunas(linhasDeBase, curadorias)) {
    if (f.turma) mapa.set(apelido, f.turma);
  }
  return mapa;
}

/**
 * As três famílias, cada uma com o seu título, o seu vazio e a sua caixa de «quando».
 *
 * A ORDEM DAS CAIXAS É A MESMA EM TODAS — de quem · quem fez · quando —, e é isso que faz a
 * identidade da listagem. O que muda é o RÓTULO e o que vai dentro do painel.
 */
const FAMILIAS = {
  anamnese: {
    titulo: 'Anamnese do aluno',
    subtitulo: 'A escuta inicial de cada aluna, antes do primeiro registro',
    padrao: /^anamnese-.*\.json$/,
    vazio: 'Ainda não há anamnese nesta escola. Ela nasce na Área do Professor, com o professor '
      + 'que a faz e a aluna que a responde.',
    singular: 'anamnese', plural: 'anamneses',
    // A PORTA DE CADA FONTE — é lá que o formulário vive. Ver `acaoDaPagina` e `acoesDaLinha`.
    porta: '/anamnese/',
    /* «FAZER», E NÃO «NOVA» (25/10/2026). «Esse nome de nova anamnese não é legal. Eu acho que
     * tem que ser fazer anamnese. É um nome mais claro do que se trata.» O rótulo serve dois
     * sítios — o item do menu e o botão do painel —, e diz o que a pessoa vai FAZER, não o
     * estado do documento. Os outros dois seguem a mesma forma. */
    acaoDeCriar: 'Fazer anamnese',
  },
  'plano-de-ensino': {
    titulo: 'Plano de ensino',
    subtitulo: 'O plano da turma, elicitado com o professor',
    padrao: /^plano-.*\.json$/,
    vazio: 'Ainda não há plano de ensino nesta escola. Ele nasce quando o professor preenche o '
      + 'plano de uma turma curada.',
    singular: 'plano', plural: 'planos',
    porta: '/plano-ensino/',
    acaoDeCriar: 'Fazer plano de ensino',
    fonte: 'plano',
  },
  'plano-de-observacao': {
    titulo: 'Plano de Observação',
    subtitulo: 'O que se vai observar na turma, e com que régua',
    padrao: /^po-.*\.json$/,
    vazio: 'Ainda não há Plano de Observação nesta escola. Ele nasce quando o professor decide o '
      + 'que vai observar numa turma.',
    singular: 'plano', plural: 'planos',
    porta: '/plano-observacao/',
    acaoDeCriar: 'Fazer Plano de Observação',
    fonte: 'po',
  },
};

/*
 * A PORTA DO FORMULÁRIO, A PARTIR DA LISTA (25/10/2026).
 *
 * O DEFEITO QUE ISTO CORRIGE, e que foi meu. Quando as três listas passaram a ser servidas pelo
 * acervo (24/10/2026), cada linha ficou com `acoes: []` — e ninguém notou, porque uma lista que
 * se lê bem parece uma lista que funciona. Só que as listas anteriores (montadas no deploy) eram
 * `uma linha por TURMA`, e a linha levava `?professor=<slug>&ciclo=NN` para a porta: era por ali
 * que se abria o formulário, se editava e se derivava. Ao trocar a linha de turma por linha de
 * REGISTO, o destino do formulário desapareceu com ela. Resultado medido em produção: as três
 * páginas da Área do Professor com **zero** `class="acao"`, e a única coisa que se podia fazer
 * era ler. A Área do Professor ficou sem porta.
 *
 * O QUE OS PARÂMETROS SÃO — lidos de `porta/index.html`, não inventados:
 *   · `professor` (slug) e `ciclo` — semeiam a barra de contexto;
 *   · `aluna` — semeia o sujeito da anamnese (a lista da porta filtra-o pela curadoria, e um
 *     apelido fora dela é simplesmente ignorado: degrada, não mente);
 *   · `fonte=plano|po` — diz à MESMA página qual dos dois formulários abrir;
 *   · `editar=<carimbo>` — abre a edição do registo. **É lido só em `fonte === 'plano'`**
 *     (`porta/index.html`, «O ATALHO DE EDIÇÃO»), e por isso só o plano de ensino o recebe.
 */
/* ------------------------------------------------------------------ a ficha para LER
 *
 * LER NÃO É EDITAR (27/10/2026). A pesquisadora: «eu clicava em nome da aluna e eu ia até a
 * anamnese da aluna no formato de ficha preenchida, inclusive se eu quisesse imprimir isso. […]
 * editar é um lugar de atenção, né? […] Eu preciso ter essa possibilidade.»
 *
 * O QUE SE PERDEU. As três fichas continuam a SER SERVIDAS — medido no ar, a anamnese responde
 * 200 com a folha inteira —, mas o layout novo da listagem não trouxe o link: a linha passou a
 * oferecer só «Editar»/«Ajustar»/«Apagar». O documento existia e não havia como lá chegar a partir
 * do sítio onde se procura por ele.
 *
 * A ROTA DE CADA FONTE NÃO SE INVENTA AQUI. É a mesma que a estante da porta usa para o mesmo
 * gesto (`porta/index.html`, `linkDaFicha`): `ficha-preenchida` para a anamnese,
 * `plano-preenchido` para o plano, `po-preenchido` para o PO. A porta serve as três sob o seu
 * prefixo, e é por isso que o endereço começa por `familia.porta`.
 *
 * O `formato=html` É O PONTO: o endereço sem ele devolve MARKDOWN, que o navegador mostra como
 * texto corrido. A folha é o que se lê e se imprime.
 */
const ROTA_DA_FICHA = {
  anamnese: 'api/ficha-preenchida.',
  'plano-de-ensino': 'api/plano-preenchido.',
  'plano-de-observacao': 'api/po-preenchido.',
};

/**
 * O ENDEREÇO DA FICHA DE UM REGISTO, ou `null` quando a família não tem folha.
 *
 * Devolve `null` em vez de um endereço aproximado: um link que abre JSON é pior do que não ter
 * link, porque promete um documento e entrega um despejo de dados.
 */
function fichaDeLeitura(chave, registo) {
  const f = FAMILIAS[chave];
  const rota = ROTA_DA_FICHA[chave];
  if (!f || !rota || !registo || !registo.id) return null;
  return f.porta + rota + encodeURIComponent(registo.id) + '?formato=html';
}

function consulta(params) {
  const q = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params || {})) {
    const v = String(valor == null ? '' : valor).trim();
    if (v) q.set(chave, v);
  }
  const s = q.toString();
  return s ? '?' + s : '';
}

/** O botão do topo da página — a acção de CRIAR, que é a que faltava por inteiro. */
function acaoDaPagina(chave) {
  const f = FAMILIAS[chave];
  /* `ficha` é o endereço que GERA a folha em branco. Ele viaja aqui (e não dentro do painel)
   * porque passou a ser uma das três acções do menu: no telemóvel o painel só existe depois de
   * se escolher «criar», e a ficha tem de estar acessível sem esse passo. */
  return {
    rotulo: f.acaoDeCriar,
    href: f.porta + consulta({ fonte: f.fonte }),
    ficha: f.porta + 'api/ficha?formato=html',
  };
}

/**
 * As acções de UMA linha. O que se promete é o que a porta cumpre:
 *   · plano de ensino ainda livre (`solta`) — a edição abre no registo;
 *   · plano de ensino já vinculado, PO, e anamnese vinculada — o registo JÁ EXISTE e o passado
 *     não se reescreve: o gesto é ACRESCENTAR UM ELO (`ajuste_de`), e é a isso que o botão diz
 *     «Ajustar»;
 *   · anamnese solta — edita-se em sítio e apaga-se.
 *
 * «AJUSTAR», E NÃO «ABRIR NO FORMULÁRIO» (26/10/2026). O rótulo antigo dizia o mecanismo (a
 * página que abre) e não o que acontece ao registo; pior, levava à porta sem nada do registo
 * dentro — a pessoa chegava a um formulário em branco com o contexto, e não ao registo que
 * tinha acabado de escolher. Passou a levar o CARIMBO (`ajustar=<id>`), e a porta carrega-o.
 */
/* A ROTA DE CADA FAMÍLIA para apagar — as duas que têm o gesto são as duas que têm registo
 * solto. O PO não entra: é o topo da cadeia e não se apaga (P-10).
 *
 * COM O PREFIXO DA PORTA, e não relativa (03/11/2026). As rotas de escrita vivem no roteador da
 * PORTA, que a ponte serve debaixo de `/anamnese`, `/plano-ensino` e `/plano-observacao`. Uma rota
 * relativa resolvida a partir de `/area-do-professor/plano-de-ensino/` dava
 * `/area-do-professor/plano-ensino/api/…` — 404, medido. O caminho é absoluto e diz de que porta
 * é, que é o mesmo que `porta/index.html` faz com o seu `api/…` relativo. */
const ROTA_DE_APAGAR = {
  anamnese: '/anamnese/api/anamnese-vinculo/',
  'plano-de-ensino': '/plano-ensino/api/plano-vinculo/',
  /* O PO FALTAVA AQUI, e era o único dos três (04/11/2026). A pesquisadora: «o botão ou a opção de
   * deletar o plano de observação não está aparecendo». Não aparecia porque não existia: nem rota,
   * nem estado, nem botão. As três peças entram juntas — uma sem as outras é um botão que mente. */
  'plano-de-observacao': '/plano-observacao/api/po-vinculo/',
};

function acoesDaLinha(chave, registo, estado) {
  const f = FAMILIAS[chave];
  /* O LINK DE EDIÇÃO LEVA O CONTEXTO (26/10/2026). Levava só `?editar=<carimbo>`, e por isso a
   * página abria com a barra vazia — e a trava, que confere o contexto, devolvia a pessoa à lista
   * («ele vai até a página e volta imediatamente»). O envelope tem o contexto, mas o atalho só o
   * carrega DEPOIS de a página achar que pode entrar; levá-lo no endereço resolve a ordem em vez
   * de a contornar. */
  const comEdicao = (base) => ({
    fonte: f.fonte, editar: base.id,
    professor: base.professor, ciclo: base.ciclo,
    aluna: chave === 'anamnese' ? base.aluna : '',
  });
  /* O PLANO SOLTO EDITA-SE **E APAGA-SE** (03/11/2026).
   *
   * O DEFEITO, medido na listagem publicada: o plano livre mostrava «Editar» e mais nada. O
   * «Apagar» existia na estante antiga da porta (`acoesDoPlano`) e não foi trazido quando a
   * listagem passou a ser a página da Área do Professor — ficou a regra sem o gesto, e a
   * pesquisadora reparou: «na listagem atual de Planos de Ensino o sistema exibe corretamente o
   * botão de editar para planos soltos. No entanto, o botão de apagar sumiu».
   *
   * A REGRA, e é a mesma das duas famílias: enquanto o registo está SOLTO — não vinculado a
   * nenhum Plano de Observação e não derivado — o professor tem liberdade operacional sobre ele.
   * Depois de vinculado, o gesto deixa de existir na tela (a linha passa a oferecer «Ajustar»,
   * que acrescenta um elo), e o servidor recusa o `DELETE` de qualquer maneira com 409 —
   * `rotas.js`, 7.2. A tela mostra o que a regra permite; quem decide continua a ser o servidor.
   *
   * E O BOTÃO, E NÃO UM LINK: apagar não tem página de destino. O gesto acontece na lista — pede
   * a senha, pede confirmação, chama a rota e a linha sai. */
  if (chave === 'plano-de-ensino' && estado && estado.estado === 'solta') {
    return [
      ['Editar', f.porta + consulta(comEdicao(registo)), ''],
      { rotulo: 'Apagar', apagar: registo.id, rota: ROTA_DE_APAGAR[chave],
        nome: 'o plano de ensino ' + registo.id,
        dica: 'apaga de vez — e só é possível porque ele não está ligado a nenhum Plano de '
          + 'Observação nem foi derivado' },
    ];
  }
  /* A ANAMNESE TINHA O MESMO DEFEITO DO PLANO, e a pesquisadora viu-o: «as anamneses que eu já
   * tenho prontas estão livres… então eu preciso que tenha esse indicativo para o professor saber
   * do que se trata, se ele pode editar ou se ele precisa derivar. E o botão de editar e de
   * derivar tem que estar aqui também».
   *
   * A REGRA É A DO SERVIDOR, não uma nova: a anamnese SOLTA edita-se (é o mesmo carimbo) e
   * apaga-se; a VINCULADA não se toca — acrescenta-se um elo (`POST /api/anamnese-ajuste`), e é
   * esse o gesto que a porta chama «ajustar». O nome difere do «derivar» do plano e do PO de
   * propósito: cada família diz o que faz no seu próprio vocabulário, e inventar um sinónimo
   * aqui faria a tela prometer uma coisa que o servidor não conhece. */
  if (chave === 'anamnese') {
    if (estado && estado.vinculada) {
      /* «AJUSTAR» DEIXOU DE EXISTIR NA ANAMNESE (04/11/2026) — é «NOVO REGISTO».
       *
       * A REGRA DE DOMÍNIO, dela: «Se a anamnese é o retrato clínico/físico do corpo do sujeito
       * num determinado momento, ela é historicamente datada. Se a aluna evoluiu, ou se sofreu
       * uma alteração física, isso NÃO é um ajuste ou edição secreta do passado: é um NOVO ESTADO
       * FÍSICO NO TEMPO.»
       *
       * A diferença não é de nome, é de dado. O «Ajustar» gravava um elo com `ajuste_de` — o
       * registo anterior passava a SUBSTITUÍDO, e a estante mostrava um só. Um novo retrato
       * físico, porém, não substitui o anterior: os dois aconteceram, em datas diferentes, e é a
       * série que diz se o corpo mudou. Por isso o gesto novo NÃO leva `ajuste_de` e nasce com o
       * seu próprio carimbo.
       *
       * O CARIMBO VAI NO ENDEREÇO (`novo=<id>`), e não é enfeite: é o que faz o formulário abrir
       * PREENCHIDO com o retrato anterior (o «duplicar» que ela pediu — «poupa o tempo do
       * professor, permitindo que ele altere apenas o que mudou no corpo»). */
      return [['Novo registo', f.porta + consulta({ fonte: f.fonte, novo: registo.id,
        professor: registo.professor, aluna: registo.aluna }), 'secundario',
        'abre um retrato novo, datado de hoje, com os dados do anterior já preenchidos — o '
          + 'registo de ' + registo.id + ' não é tocado']];
    }
    /* «APAGAR» ERA UM LINK PARA O FORMULÁRIO (03/11/2026). Ele e o «Editar» apontavam para o
     * MESMO endereço — dois botões, um destino, e o segundo a prometer uma coisa que não fazia
     * (abria a edição). Agora é botão, chama a rota 9 (`/api/anamnese-vinculo/:id`) e apaga: a
     * anamnese solta pode ser apagada, e a vinculada oferece «Ajustar» (o outro ramo acima). */
    return [
      ['Editar', f.porta + consulta(comEdicao(registo)), ''],
      { rotulo: 'Apagar', apagar: registo.id, rota: ROTA_DE_APAGAR[chave],
        nome: 'a anamnese ' + registo.id + (registo.aluna ? ' de ' + registo.aluna : ''),
        dica: 'apaga de vez — e só é possível porque ela não está ligada a nenhum Plano de '
          + 'Observação' },
    ];
  }
  /* O PLANO VINCULADO E O PO — «ajustar», com o carimbo.
   *
   * O PO leva também o `plano` que observa: é dele que sai a TURMA OBSERVADA que o cabeçalho
   * mostra. Sem esse carimbo a leitura da turma ficava em «—», e a pessoa via um plano de
   * observação sem saber de que turma era.
   *
   * O plano de ensino leva o próprio carimbo; a turma vem do envelope, que a porta carrega
   * inteiro — e é isso que faz o campo chegar preenchido com a turma que se vai ajustar. */
  const doPlano = chave === 'plano-de-observacao' && Array.isArray(registo.plano) && registo.plano.length
    ? registo.plano[0] : '';
  const contexto = consulta({
    fonte: f.fonte,
    ajustar: registo.id,
    professor: registo.professor,
    ciclo: registo.ciclo,
    plano: doPlano,
    aluna: chave === 'anamnese' ? registo.aluna : '',
  });
  /* O PO, QUE NÃO TINHA O GESTO (04/11/2026). A linha do Plano de Observação oferecia «Ajustar» e
   * mais nada — e o pedido foi explícito: «inspecionar o componente do Plano de Observação e
   * disponibilizar a ação de exclusão».
   *
   * A REGRA É A DAS OUTRAS DUAS FAMÍLIAS: solto apaga-se; DERIVADO (tem sucessor, `ajuste_de`)
   * não se apaga — acrescenta-se um elo. E há uma assimetria que é do domínio, não da tela: nada
   * referencia um PO (o ciclo gerado guarda a sua própria cópia), por isso não há aqui a trava
   * «está vinculado» que o plano de ensino tem.
   *
   * O «Ajustar» continua, e primeiro: é o gesto que se usa no dia a dia. O «Apagar» é o que se
   * usa quando o registo foi criado por engano. */
  if (chave === 'plano-de-observacao') {
    const acoes = [['Ajustar', f.porta + contexto, 'secundario',
      'abre o registo para acrescentar um elo — o anterior permanece']];
    if (!(estado && estado.derivado)) {
      acoes.push({ rotulo: 'Apagar', apagar: registo.id, rota: ROTA_DE_APAGAR[chave],
        nome: 'o plano de observação ' + registo.id,
        dica: 'apaga de vez — e só é possível porque ele não foi derivado: o ciclo já gerado '
          + 'guarda a sua própria cópia, e não é tocado' });
    }
    return acoes;
  }
  return [['Ajustar', f.porta + contexto, 'secundario',
    'abre o registo para acrescentar um elo — o anterior permanece']];
}


/**
 * A LISTA A QUE UMA PÁGINA DA PORTA PERTENCE — para o menu saber onde se está (26/10/2026).
 *
 * O DEFEITO. Dentro do formulário — a criar, a editar ou a ajustar — o item do menu deixava de
 * estar aceso. «Se eu toco no menu de novo, eu não tenho mais a referência básica de onde eu
 * estava.» E a razão é de facto: o menu marca o item pelo CAMINHO servido (`ehAtivo`), e a porta
 * é servida em /anamnese/, /plano-ensino/ e /plano-observacao/ — caminhos que não são os das
 * listas (/area-do-professor/anamnese/). O menu olhava para a porta, não reconhecia nada, e
 * apagava a única marca que responde a «onde estou».
 *
 * A RELAÇÃO É DECLARADA AQUI porque é aqui que ela existe: FAMILIAS já diz, para cada família, a
 * porta (`porta`) e a chave que compõe o caminho da lista. Uma segunda tabela noutro ficheiro
 * divergiria no dia em que uma família mudasse de porta.
 *
 * Entrar mais fundo num sítio não é sair dele: quem está a ajustar uma anamnese continua na
 * Anamnese do aluno. É isso que o menu volta a dizer.
 */
function listaDaPorta(caminho) {
  const p = String(caminho || '');
  for (const chave of Object.keys(FAMILIAS)) {
    const porta = FAMILIAS[chave].porta;
    if (!porta) continue;
    if (p === porta || p === porta.replace(/\/$/, '') || p.startsWith(porta)) {
      return '/area-do-professor/' + chave + '/';
    }
  }
  return null;
}

/* ============================================================================================
 * O PAINEL DO ATO — o contexto que estava na porta, dentro da listagem (25/10/2026)
 * ============================================================================================
 *
 * O QUE ELE SUBSTITUI. A porta (`/anamnese/`, `/plano-ensino/`, `/plano-observacao/`) é uma
 * segunda página com o cabeçalho do ato, dois parágrafos de texto de desenvolvimento e — embaixo
 * — a estante «Fichas gravadas», que lista o mesmo que a listagem já lista. Criar exigia sair da
 * lista; o mesmo registo aparecia em dois lugares com duas gramáticas de botão.
 *
 * A DECISÃO (25/10/2026): o contexto vira um PAINEL dentro da listagem, e a caixinha que o abre é
 * a peça do «Turma» — `summary.trio-item`, na faixa inteira, com uma SETA em vez do «?» (para
 * baixo fechada, para cima aberta: ela não explica um valor, abre um formulário).
 *
 * A REGRA DOS BOTÕES JÁ EXISTIA, e é a da porta — não foi inventada aqui:
 *   · sem preenchimento guardado  → «Nova anamnese»
 *   · com preenchimento guardado  → «Continuar de onde parei» + «Começar de novo», e «Nova»
 *     ESCONDIDO (a porta diz porquê: «um botão desabilitado é ruído, um escondido não é nada»)
 *   · «Começar de novo»           → limpa a memória → «Nova» volta
 *   · «Ver a ficha em branco»     → sempre, fora do painel: não depende do contexto nem da senha
 *
 * A MEMÓRIA É A DA PORTA, com a mesma chave — `porta-<fonte>-<escola>-<professor>-<ciclo>-1`
 * (`chaveDaMemoria`, em `porta/index.html`). Não inclui a aluna. Ler a MESMA chave é o que faz o
 * painel dizer a verdade: se o professor começou a preencher na porta, o painel sabe-o.
 */

/** A chave do depósito local — cópia exacta de `chaveDaMemoria()` da porta. */
function chaveDaMemoria(fonte, escola, professor, ciclo) {
  const partes = ['porta', fonte || ''];
  for (const v of [escola, professor, ciclo]) {
    const t = String(v == null ? '' : v).trim();
    if (t) partes.push(t);
  }
  return partes.join('-') + '-1';
}

/**
 * O painel de UMA família, com os campos que ela pede.
 *
 * As diferenças entre as três não são de desenho: são de QUEM EXISTE no ato.
 *   · anamnese — professor, ciclo, ALUNA e senha (a escrita da anamnese é do professor);
 *   · plano de ensino — professor, ciclo, TURMA (escolhe-se) e senha (a estante exige-a para
 *     editar e derivar — `ajustarSenhaDoPlano`, na porta);
 *   · PO — professor, ciclo, TURMA (leitura, vem do plano) e **senha NENHUMA**.
 *
 * A SENHA NO PO NÃO EXISTE, e está escrito na porta: «NÃO há senha a digitar nessa tela… Na
 * anamnese, sempre visível; no PO, nunca» (`ajustarSenhaDoPlano`). O PO não tem escrita
 * protegida por senha — o que ele tem é a correcção e a derivação, que partem da estante, e a
 * estante do PO não pede senha. Eu tinha posto o campo nos três, e estava errado.
 * A escola não é campo: é inscrição, e o Worker de cada escola resolve-a por `ESCOLA_SLUG`.
 */
function painelDoAto(chave, escola) {
  const f = FAMILIAS[chave];
  const ehAnamnese = chave === 'anamnese';
  const ehPlano = chave === 'plano-de-ensino';
  const ehPo = chave === 'plano-de-observacao';
  /* SEM `details` E SEM CAIXINHA (25/10/2026, terceira leitura). O cabeçalho — o título, o resumo
   * e a seta — é agora o do BLOCO que contém este painel (`details.bloco-lista`, em
   * `lista-html.js`). Dois botões para abrir a mesma coisa dentro do mesmo container eram o
   * segundo clique que o pedido recusa; e o resumo continua, no sítio onde se lê. */
  return `
    <div class="campos-do-ato">
      <span class="campo"><label class="campo-rotulo" for="ato-professor">professor</label>
        <select id="ato-professor" data-ato="professor"><option value="">— escolher —</option></select></span>
      <!-- O CICLO NÃO SE PEDE NA ANAMNESE (05/11/2026). A anamnese é do SUJEITO e é
           atemporal: ela é uma fotografia do corpo, e o corpo não tem número de ciclo. O campo
           existia aqui desde que este painel nasceu, e custava caro em três sítios: (1) pedia um
           número que não quer dizer nada; (2) entrava na lista dos campos obrigatórios, e o
           «Fazer anamnese» ficava travado à espera dele; (3) ia no BILHETE do ato — e a porta,
           que não pede ciclo na anamnese, comparava «r.ato.ciclo» com um campo vazio, não
           casava, e devolvia a pessoa à lista. Era esse o «abre e fecha de imediato».
           No PLANO DE ENSINO o campo FICA: ali o ciclo NASCE, e é a posição na cadeia de
           proveniência que o documento ancora. -->

      <!-- O CICLO DO PO NÃO SE ESCREVE (06/11/2026). Ela foi direta: «o plano de observação ainda
           está com o campo ciclo livre. Eu posso digitar qualquer ciclo ali.» A regra que ela
           pediu duas vezes vale também AQUI, e este era o sítio que faltava: o ciclo do Plano de
           Observação é o do PLANO DE ENSINO OBSERVADO, e um número digitado à mão ao lado do
           plano podia dizer «20» e observar o plano do 01.
           A PEÇA É A DA LEITURA, a mesma da «turma observada» ao lado — o sistema a declarar um
           valor que não se escolhe, e não um campo. O input fica oculto porque é ele que o resto
           do painel lê (a chave da memória, o endereço, o resumo): uma regra, um leitor. Ele é
           preenchido com o ciclo do plano escolhido, e não com o que alguém escreve. O PLANO VEM
           ANTES DO CICLO porque é dele que o ciclo vem — a ordem da causalidade. -->
      ${ehAnamnese || ehPo ? '' : `<span class="campo"><label class="campo-rotulo" for="ato-ciclo">ciclo</label>
        <input type="text" id="ato-ciclo" data-ato="ciclo" value="" inputmode="numeric"></span>`}
      ${ehAnamnese ? `<span class="campo"><label class="campo-rotulo" for="ato-aluna">aluna</label>
        <select id="ato-aluna" data-ato="aluna"><option value="">— nenhuma —</option></select></span>` : ''}
      ${ehPlano ? `<span class="campo"><label class="campo-rotulo" for="ato-turma">turma</label>
        <select id="ato-turma" data-ato="turma"><option value="">— escolher —</option></select></span>` : ''}
      ${chave === 'plano-de-observacao' ? `<span class="campo"><label class="campo-rotulo" for="ato-plano">plano de ensino observado</label>
        <select id="ato-plano" data-ato="plano"><option value="">— escolher —</option></select></span>
      <span class="campo"><span class="campo-rotulo">ciclo</span>
        <span class="leitura" data-ciclo-leitura>—</span>
        <input type="hidden" id="ato-ciclo" data-ato="ciclo" value=""></span>
      <span class="campo"><span class="campo-rotulo">turma observada</span>
        <span class="leitura" data-turma-leitura>—</span></span>` : ''}
      ${chave === 'plano-de-observacao' ? '' : `<span class="campo campo-senha"><label class="campo-rotulo" for="ato-senha">senha do professor</label>
        <input type="password" id="ato-senha" data-ato="senha" autocomplete="off">
        <span class="selo ok" data-senha-status hidden>confere</span></span>`}
    </div>
    <p class="obrigatorios">Todos estes campos são obrigatórios: sem eles o ato não abre.</p>
    <div class="acoes-do-ato">
      <button class="acao" type="button" data-acao="nova" disabled>${f.acaoDeCriar}</button>
      <button class="acao secundario pequena" type="button" data-acao="continuar" hidden>
        Continuar de onde parei</button>
      <button class="acao secundario pequena" type="button" data-acao="recomecar" hidden>
        Começar de novo</button>
    </div>
    <p class="estado-do-ato" data-estado hidden></p>`;
  /* A FICHA SAIU DAQUI (25/10/2026). Ela era um link à vista ao lado do painel; com o menu
   * «Ações» passou a ser uma das três acções, e um segundo sítio para a mesma folha seria a
   * duplicação que se está a evitar. O endereço vem em `acaoDaPagina` (`ficha`). */
}

/**
 * O JavaScript do painel — o que o põe a funcionar.
 *
 * PORQUE É UM SCRIPT SEPARADO, e não uma linha no `SCRIPT_DA_LISTA`: a lista é desenhada para oito
 * páginas, e sete delas não têm painel nenhum. `paginaDeLista` só o emite quando recebe o painel.
 *
 * O QUE ELE NÃO FAZ: não valida a senha duas vezes, não inventa o recorte das alunas e não
 * decide a regra da curadoria. Pergunta ao servidor as três coisas que a porta pergunta, nos
 * mesmos endpoints — `/api/bastidores/professores`, `/api/bastidores/alunas`,
 * `/api/bastidores/curadoria-professor` — e usa `/api/bastidores/validar-senha` para a senha.
 * Uma regra, um lugar.
 */
function scriptDoPainel(chave, escola) {
  const f = FAMILIAS[chave];
  const ehAnamnese = chave === 'anamnese';
  const ehPlano = chave === 'plano-de-ensino';
  const dados = eschave(JSON.stringify({
    fonte: chave === 'plano-de-ensino' ? 'plano' : (chave === 'plano-de-observacao' ? 'po' : 'anamnese'),
    porta: f.porta, escola: escola || '', ehAnamnese, ehPlano, criar: f.acaoDeCriar,
    /* O PO NAO TEM CAMPO DE SENHA — e uma trava que exige `SENHA === 'ok'` num painel sem o
     * campo bloquearia para sempre. A senha so trava onde ela existe. */
    temSenha: chave !== 'plano-de-observacao',
    /* O PO OBSERVA UM PLANO. A regra («o Plano de Observacao observa uma aula que tem plano»)
     * vivia so na mensagem da lista vazia: quem entrava pelo painel nao a encontrava em lugar
     * nenhum, e o botao ficava habilitado sobre um ato impossivel. Aqui a regra passa a ter
     * porta: o plano escolhe-se, e sem plano nao ha o que observar. */
    ehPo: chave === 'plano-de-observacao',
  }));
  return `<script>(function () {
  var CFG = ${dados};
  /* O PAINEL VIROU O BLOCO DO ATO (25/10/2026, terceira leitura): o que era um elemento
   * dobrável com caixinha é agora o corpo de um 'bloco-lista', e o cabeçalho — título, resumo e
   * seta — é o do bloco. O guarda é o mesmo (sem o bloco, não há painel a pôr a funcionar), e o que
   * procura o «painel» passa a procurar o bloco. */
  var painel = document.getElementById('bloco-ato');

  /* ---------------------------------------------------------------- APAGAR (03/11/2026)
   *
   * O GESTO VIVE NA LISTA, E NÃO NO PAINEL — por isso este bloco vem ANTES da guarda: o botão
   * está no cartão, e o cartão existe mesmo quando o bloco do ato não existe. Sem isto, o
   * «Apagar» que a listagem voltou a oferecer seria um botão morto.
   *
   * A SENHA, e porquê. É escrita, e a escrita neste sistema pede a senha do professor (a porta
   * diz o mesmo: «a exclusão exige a senha»). O campo está no painel, no alto da página; se ela
   * ainda não conferiu, o gesto não acontece — aponta-se o campo e diz-se porquê, em vez de
   * abrir uma caixa a pedir o segredo fora do sítio onde ele se digita.
   *
   * QUEM DECIDE É O SERVIDOR. A tela só mostra o botão a quem a regra permite (o registo solto);
   * se o estado mudar entre a pintura e o clique, a rota responde 409 — e a mensagem dela é a que
   * se mostra, porque é a verdade.
   */
  function senhaConferida() {
    if (!CFG.temSenha) return true;
    var status = document.querySelector('[data-senha-status]');
    return !!(status && !status.hidden);
  }
  function dizerNoPainel(texto) {
    var estado = document.querySelector('[data-estado]');
    if (!estado) return;
    estado.hidden = false;
    estado.setAttribute('data-falta', 'sim');
    estado.textContent = texto;
  }
  function apontarSenha() {
    var campoDaSenha = document.querySelector('[data-ato="senha"]');
    if (!campoDaSenha) return;
    var bloco = document.getElementById('bloco-ato');
    if (bloco && bloco.tagName === 'DETAILS') bloco.open = true;
    try { campoDaSenha.focus(); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-apagar]');
    if (!b) return;
    var id = b.getAttribute('data-apagar');
    var rota = b.getAttribute('data-apagar-rota') || '';
    var nome = b.getAttribute('data-apagar-nome') || ('o registo ' + id);
    if (!id || !rota) return;
    if (!senhaConferida()) {
      dizerNoPainel('A exclusão exige a senha do professor — digite-a no painel, no alto da '
        + 'página, e o «Apagar» passa a funcionar.');
      apontarSenha();
      return;
    }
    /* A CONFIRMAÇÃO DIZ O SUJEITO E O QUE ACONTECE. «Apagar?» sozinho não faz ninguém parar:
     * um gesto que não se desfaz tem de nomear o que desaparece. */
    if (!window.confirm('Apagar ' + nome + '?\\n\\nÉ definitivo — e só é possível porque ele não '
      + 'está vinculado a nenhum Plano de Observação nem foi derivado.')) return;
    b.disabled = true;
    /* A LINHA FICA TRANCADA ENQUANTO A ROTA NÃO RESPONDE (05/11/2026).
     *
     * O DEFEITO: «o item continua visível e interativo na listagem enquanto o processo roda. Isso
     * permite que o usuário abra, leia ou tente ajustar um documento que está sendo destruído.»
     * A Action do GitHub corre em segundo plano, e a exclusão não é instantânea: entre o clique e
     * a resposta há segundos em que a linha já está condenada e ainda obedece.
     *
     * A TRAVA É EM TRÊS CAMADAS, e as três são precisas: o ATRIBUTO «data-apagando» (o estado,
     * que a folha desenha com véu, fio e spinner), o «inert» (tira a linha do ponteiro, do
     * teclado e do leitor de ecrã — «pointer-events» sozinho deixa o Tab entrar) e o
     * «aria-busy» (diz ao leitor de ecrã que a linha está a mudar). Só sai quando a resposta
     * chega, e só no caso de falha — no sucesso a página recarrega e a linha desaparece.
     */
    var linha = b.closest ? (b.closest('.trio-plano') || b.closest('li') || b.parentNode) : b.parentNode;
    function trancar(trancada) {
      if (!linha || !linha.setAttribute) return;
      if (trancada) {
        linha.setAttribute('data-apagando', 'sim');
        linha.setAttribute('aria-busy', 'true');
        try { linha.setAttribute('inert', ''); } catch (e) {}
      } else {
        linha.removeAttribute('data-apagando');
        linha.removeAttribute('aria-busy');
        try { linha.removeAttribute('inert'); } catch (e) {}
      }
    }
    trancar(true);
    fetch(rota + encodeURIComponent(id), { method: 'DELETE' })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) {
        return { ok: r.ok, status: r.status, dados: d };
      }); })
      .then(function (r) {
        /* 404 = já não existe; era esse o objetivo. 409 (vinculado ou derivado) continua a ser
         * recusa, e aí a linha FICA — com o motivo escrito, e não com um botão que voltou ao
         * normal sem explicação. */
        if (!r.ok && r.status !== 404) throw new Error((r.dados && r.dados.erro) || ('HTTP ' + r.status));
        /* A LISTA É DO SERVIDOR. Apagar a linha do DOM sem repintar deixaria a contagem, os
         * filtros e a paginação a falar de um registo que já não existe; recarregar é a única
         * resposta que não mente — e o contexto do ato sobrevive, porque está no localStorage. */
        /* O RECADO ATRAVESSA O RECARREGAMENTO (05/11/2026), e é o que faltava para o gesto não
         * parecer mentira: apagar o vigente de uma cadeia faz o elo de TRÁS voltar a ser o
         * vigente, e a linha da lista reaparece com outro carimbo. Sem uma palavra, isso lê-se
         * como «não apagou» — foi assim que a pesquisadora o descreveu. O «sessionStorage» é o
         * único canal que sobrevive a um recarregamento e não suja o endereço. */
        var feito = (r.dados && r.dados.ciclo) || {};
        var partes = ['Apaguei ' + nome + '.'];
        if (feito.apagado) {
          partes.push('O ciclo ' + (feito.ciclo || '') + ' gerado saiu com ele — o pacote, as '
            + 'aulas, o lançamento, a captura e os PDF — e o menu deixa de o listar.');
        } else if (feito.motivo) {
          partes.push('O ciclo gerado NÃO foi apagado: ' + feito.motivo + '.');
        }
        if (r.dados && r.dados.anteriorVigente) {
          partes.push('O elo anterior (' + r.dados.anteriorVigente + ') volta a ser o vigente: é a '
            + 'proveniência — o passado não se reescreve. Apague-o também se quiser limpar a cadeia.');
        }
        try { window.sessionStorage.setItem('aviso-do-apagar', partes.join(' ')); } catch (e) {}
        window.location.reload();
      })
      .catch(function (erro) {
        /* A FALHA DESTRANCA, e a linha volta a responder com o motivo escrito ao lado. Uma linha
         * que ficasse trancada depois de um 409 seria um registo que existe e não se pode abrir. */
        trancar(false);
        b.disabled = false;
        dizerNoPainel('Não apaguei ' + nome + ': ' + erro.message);
      });
  });

  if (!painel) return;

  function $(seletor) { return document.querySelector(seletor); }
  function campo(nome) { var e = $('[data-ato="' + nome + '"]'); return e || null; }
  function valor(nome) { var e = campo(nome); return e ? String(e.value || '').trim() : ''; }

  /* A CHAVE DA MEMÓRIA É A DA PORTA — cópia exacta de chaveDaMemoria() em porta/index.html.
   * Lê-la do mesmo sítio é o que faz este painel dizer a verdade: o que o professor começou a
   * preencher na porta aparece aqui como «continuar», e não como «nada».
   *
   * A ALUNA ENTRA NA CHAVE, E NA ANAMNESE SÓ (26/10/2026). Sem ela, o depósito de uma aluna era
   * restaurado ao abrir o ato de outra — e as respostas de uma iam para o documento da outra.
   * Aqui a aluna é a do painel; na porta é a do seletor (ou a do endereço). As duas cópias têm de
   * concordar, senão «continuar de onde parei» deixa de encontrar o que existe. */
  function chaveDaMemoria() {
    var partes = ['porta', CFG.fonte];
    var nomes = ['escola', 'professor', 'ciclo'];
    if (CFG.ehAnamnese) nomes.push('aluna');
    nomes.forEach(function (c) {
      var v = c === 'escola' ? CFG.escola : valor(c);
      if (v) partes.push(v);
    });
    return partes.join('-') + '-1';
  }
  /* O CONTEXTO ESCOLHIDO TEM DE SOBREVIVER AO RECARREGAMENTO (25/10/2026).
   *
   * O DEFEITO, medido: o professor escolhia professor, ciclo e aluna no painel; a página
   * recarregava (ou ele voltava noutro dia) e o painel nascia VAZIO. Pior do que o trabalho de
   * escolher outra vez: a chave da memória da porta (porta-<fonte>-<escola>-<professor>-<ciclo>-1)
   * inclui o professor e o ciclo, por isso sem eles o painel PROCURAVA A CHAVE ERRADA — e o
   * «continuar de onde parei» nunca aparecia, que é a razão de ele existir.
   *
   * A porta não tem este problema porque o contexto lhe chega pelo endereço (?professor=…).
   * Aqui o contexto é escolhido DENTRO da página, e por isso tem de ser guardado. A chave é por
   * escola e por fonte: trocar de anamnese para plano não herda a aluna do outro ato.
   *
   * A SENHA NÃO SE GUARDA. Ela é segredo, e o que se está a guardar é a escolha de quem e do quê. */
  function chaveDoContexto() {
    return 'ato-' + (CFG.escola || 'escola') + '-' + CFG.fonte + '-1';
  }
  function lerContexto() {
    try { var b = localStorage.getItem(chaveDoContexto()); return b ? JSON.parse(b) : null; }
    catch (e) { return null; }
  }
  function gravarContexto() {
    try {
      localStorage.setItem(chaveDoContexto(), JSON.stringify({
        professor: valor('professor'), ciclo: valor('ciclo'),
        aluna: valor('aluna'), turma: valor('turma'), plano: valor('plano'),
      }));
    } catch (e) {}
  }
  function restaurarContexto() {
    var c = lerContexto();
    if (!c) return;
    ['ciclo', 'aluna'].forEach(function (nome) {
      var e = campo(nome);
      if (e && c[nome] && nome === 'ciclo') e.value = c[nome];
    });
    /* 'professor', 'aluna' e 'turma' são 'select's: o valor só pode ser posto DEPOIS de as
     * opções chegarem do servidor — é o que 'encher' faz, e é lá que o escolhido é marcado. */
    ATOS.professor = c.professor || '';
    ATOS.aluna = c.aluna || '';
    ATOS.turma = c.turma || '';
    ATOS.plano = c.plano || '';
  }

  function memoria() {
    try { var b = localStorage.getItem(chaveDaMemoria()); return b ? JSON.parse(b) : null; }
    catch (e) { return null; }
  }
  /* «HÁ O QUE CONTINUAR» É UMA RESPOSTA DA PESSOA, E NÃO UM DEPÓSITO (26/10/2026).
   *
   * A porta grava o depósito também quando apenas semeia o contexto e a curadoria — essas
   * respostas viajam marcadas em SUGERIDAS. Contar o depósito inteiro dava «Continuar de onde
   * parei» a quem só abriu o formulário, e a regra que a pesquisadora ditou é a contrária: «só
   * vai aparecer… se de fato existir o que continuar. Se não tiver nada, não tem por quê».
   *
   * A MESMA CONTA ESTÁ NA PORTA (respostaPropria), e tem de estar: é ela que decide se a
   * retomada dispensa a senha. Duas contas diferentes dariam um botão que leva a uma página que
   * recusa. */
  function haOQueContinuar(m) {
    if (!m) return false;
    var sugeridas = {};
    (Array.isArray(m.sugeridas) ? m.sugeridas : []).forEach(function (id) { sugeridas[id] = true; });
    var pares = Array.isArray(m.respostas) ? m.respostas : [];
    for (var i = 0; i < pares.length; i += 1) {
      var par = pares[i];
      if (Array.isArray(par) && !sugeridas[par[0]]) return true;
    }
    return false;
  }
  function limparMemoria() {
    try { localStorage.removeItem(chaveDaMemoria()); } catch (e) {}
  }

  var PROFESSORES = [];
  var CURADORIA_CARREGADA = false;
  var CURADORIAS = [];
  /* A SENHA TEM TRES ESTADOS, e nao dois: vazia (nada a dizer), ERRADA (tem de dizer porque) e
   * certa. Um booleano colapsava os dois primeiros e deixava o professor com o botao desabilitado
   * sem uma palavra de explicacao — o mesmo defeito que a porta evita com o «x senha nao
   * reconhecida» (sinalDeSenha). Medido em producao: com a senha errada, o estado ficava VAZIO. */
  var SENHA = '';
  /* O que foi escolhido antes de esta página carregar — e que os 'select' só podem receber
   * depois de as opções chegarem. */
  var ATOS = { professor: '', aluna: '', turma: '', plano: '' };

  function faltam() {
    var falta = [];
    if (!valor('professor')) falta.push('professor');
    /* O CICLO SÓ É OBRIGATÓRIO ONDE ELE EXISTE. Na anamnese o campo não está na página — exigir
     * um campo que não se vê é a pior das travas: o botão nunca habilita e não há nada a
     * preencher que o desabilite. */
    if (!CFG.ehAnamnese && !CFG.ehPo && !valor('ciclo')) falta.push('ciclo');
    /* O CICLO DO PO VEM DO PLANO (06/11/2026), e por isso não é uma exigência à parte: só falta
     * quando o plano escolhido o não declara — e aí o que falta é dito pelo NOME (o estado tem um
     * recado próprio), porque não há campo nenhum onde o escrever. */
    if (CFG.ehPo && valor('plano') && !valor('ciclo')) falta.push('o ciclo do plano escolhido');
    if (CFG.ehAnamnese && !valor('aluna')) falta.push('aluna');
    if (CFG.ehPlano && !valor('turma')) falta.push('turma');
    /* O PO NAO PEDE TURMA: pede o PLANO. A turma observada e a do plano escolhido, e por isso
     * e leitura — nao se escolhe duas vezes a mesma coisa. */
    if (CFG.ehPo && !valor('plano')) falta.push('plano de ensino');
    return falta;
  }
  function semCuradoria() {
    return !CFG.ehAnamnese && CURADORIA_CARREGADA && CURADORIAS.length === 0;
  }

  function pintar() {
    var mem = haOQueContinuar(memoria()) ? memoria() : null;
    var falta = faltam();
    /* A SENHA SÓ TRAVA ONDE ELA EXISTE. No PO o campo não está na página (a porta diz «no PO,
     * nunca»), e 'valor('senha')' devolveria '' — a trava nunca sairia. */
    var travaSenha = CFG.temSenha && SENHA !== 'ok';
    var trava = semCuradoria() || falta.length > 0 || travaSenha;

    var nova = $('[data-acao="nova"]');
    var continuar = $('[data-acao="continuar"]');
    var recomecar = $('[data-acao="recomecar"]');
    /* OS TRÊS ESTADOS DA PORTA. «Nova» desaparece quando há o que continuar — escondido, não
     * desabilitado. E volta quando «Começar de novo» limpa a memória. */
    if (nova) {
      nova.hidden = !!mem;
      nova.disabled = trava;
      nova.title = semCuradoria() ? 'A direção ainda não atribuiu curadoria a este professor'
        : (falta.length ? 'Falta o contexto do ato: ' + falta.join(', ') : '');
    }
    if (continuar) continuar.hidden = !mem;
    if (recomecar) recomecar.hidden = !mem;

    /* O ESTADO DIZ O QUE FALTA — na porta isto é só o title do botão, e um title não se lê no
     * telemóvel. */
    var estado = $('[data-estado]');
    /* O RECADO DO «APAGAR», lido uma vez e apagado: ele vem de um recarregamento, e um recado que
     * fica para sempre é um recado que mente na visita seguinte. */
    var avisoDoApagar = null;
    try {
      avisoDoApagar = window.sessionStorage.getItem('aviso-do-apagar');
      window.sessionStorage.removeItem('aviso-do-apagar');
    } catch (e) { avisoDoApagar = null; }
    if (estado && avisoDoApagar) {
      estado.hidden = false;
      estado.setAttribute('data-falta', 'nao');
      estado.textContent = avisoDoApagar;
    } else if (estado) {
      if (mem) {
        estado.hidden = false;
        estado.setAttribute('data-falta', 'nao');
        estado.textContent = 'Há um preenchimento interrompido: ' + (mem.respondidos || 0) + ' de '
          + (mem.total || '?') + ' respondidas'
          + (mem.quando ? ', último lançamento em ' + String(mem.quando).slice(0, 10) : '') + '.';
      } else if (semCuradoria()) {
        estado.hidden = false;
        estado.setAttribute('data-falta', 'sim');
        estado.textContent = 'A direção ainda não atribuiu curadoria a este professor — sem '
          + 'curadoria não há turma, e sem turma não há o que planejar.';
      } else if (CFG.ehPo && PLANOS.length === 0 && valor('professor')) {
        /* A REGRA DO PO, DITA. «O Plano de Observacao observa uma aula que tem plano» — e uma
         * regra que so se le numa lista vazia nao chega a quem esta a tentar criar. */
        estado.hidden = false;
        estado.setAttribute('data-falta', 'sim');
        estado.textContent = 'Este professor ainda não tem plano de ensino nesta escola. O Plano '
          + 'de Observação observa uma aula que tem plano — faça primeiro o plano de ensino.';
      } else if (CFG.ehPo && valor('plano') && !valor('ciclo')) {
        /* O PLANO ESCOLHIDO NÃO DECLARA CICLO — e o Plano de Observação herda-o dele. Sem esta
         * linha, o botão ficava travado sobre «falta o ciclo» e não havia onde o escrever: um beco
         * sem saída com o nome do beco. O recado diz o que corrigir, e onde. */
        estado.hidden = false;
        estado.setAttribute('data-falta', 'sim');
        estado.textContent = 'O plano de ensino escolhido não declara ciclo — e é dele que este '
          + 'Plano de Observação o herda. Abra o plano de ensino e confira o ciclo antes de observar.';
      } else if (falta.length) {
        estado.hidden = false;
        estado.setAttribute('data-falta', 'sim');
        estado.textContent = 'Falta o contexto do ato: ' + falta.join(', ') + '.';
      } else if (CFG.temSenha && SENHA === 'desligado') {
        /* O PROFESSOR SAIU — e a senha dele está CERTA (15/11/2026). O servidor recusa por outra
         * razão, e é essa razão que a tela tem de dizer: o desligamento encerrou a direção
         * pedagógica dele, e retomá-la é cadastrá-lo outra vez. Dizer «senha não reconhecida»
         * aqui seria mandá-lo conferir o que está correto. */
        estado.hidden = false;
        estado.setAttribute('data-falta', 'sim');
        estado.textContent = 'Este professor desligou-se da escola: ele já não abre atos novos. '
          + 'Os documentos que assinou continuam a valer. Se ele voltou, cadastre-o outra vez.';
      } else if (CFG.temSenha && SENHA === 'suspensa') {
        /* A ESCOLA ESTÁ SUSPENSA — e a senha está CERTA. O estado comercial vive no KV da
         * escola, e o servidor recusa a escrita com 402 enquanto deixa ler tudo o que existe.
         * O texto é o do servidor, para os dois lados dizerem a mesma coisa. */
        estado.hidden = false;
        estado.setAttribute('data-falta', 'sim');
        estado.textContent = 'O acesso desta escola está suspenso: é possível ler o que já foi '
          + 'criado, mas não criar nem editar. Fale com o Sistema Lastro para regularizar.';
      } else if (CFG.temSenha && SENHA === 'errada') {
        /* O CONTEXTO ESTA INTEIRO E A SENHA NAO CONFERE — e e isso que tem de ser dito. Sem esta
         * linha o botao ficava desabilitado sem motivo aparente, e o professor tentava outra vez
         * sem saber o que corrigir. O texto e o da porta: senha nao reconhecida. */
        estado.hidden = false;
        estado.setAttribute('data-falta', 'sim');
        estado.textContent = 'A senha do professor não foi reconhecida.';
      } else {
        estado.hidden = true;
        estado.textContent = '';
      }
    }
    var status = $('[data-senha-status]');
    if (status) status.hidden = !(CFG.temSenha && SENHA === 'ok');

    /* A CAIXINHA DIZ O CONTEXTO INTEIRO, ou o que falta. É o papel do title na porta. */
    var resumo = $('[data-resumo]');
    if (resumo) {
      var p = valor('professor');
      var nome = p;
      for (var i = 0; i < PROFESSORES.length; i += 1) {
        if (PROFESSORES[i].slug === p) { nome = PROFESSORES[i].nome; break; }
      }
      var partes = [];
      if (nome) partes.push(nome);
      if (valor('ciclo')) partes.push('ciclo ' + valor('ciclo'));
      if (CFG.ehAnamnese && valor('aluna')) partes.push(valor('aluna'));
      if (CFG.ehPlano && valor('turma')) partes.push(valor('turma'));
      /* No PO o resumo diz a TURMA, e não o carimbo do plano: o carimbo é um endereço, e o
       * professor pensa em turmas. Quando o plano ainda não trouxe a turma, diz o que falta. */
      if (CFG.ehPo) {
        var t = $('[data-turma-leitura]');
        var nomeDaTurma = t ? String(t.textContent || '').trim() : '';
        if (nomeDaTurma && nomeDaTurma !== '\u2014') partes.push(nomeDaTurma);
      }
      /* A BARRA FECHADA TAMBÉM AVISA (26/10/2026). Fechado, o resumo do contexto não se vê — e é
       * isso que se quer. Mas «há um preenchimento interrompido» é a única frase que precisa de
       * aparecer sem um clique: é ela que diz que o trabalho de antes está à espera. Por isso ela
       * entra no texto do resumo, e o CSS mostra o resumo mesmo fechado nesse caso. */
      resumo.textContent = mem
        ? 'há um preenchimento interrompido — ' + (mem.respondidos || 0) + ' de '
          + (mem.total || '?') + ' respondidas'
        : (partes.length ? partes.join(' · ')
          : 'escolher o professor, o ciclo' + (CFG.ehAnamnese ? ' e a aluna' : ''));
      resumo.style.color = (falta.length || semCuradoria()) ? 'var(--alerta)' : '';
      painel.classList.toggle('falta', falta.length > 0 || semCuradoria());
    }

    /* COM PREENCHIMENTO INTERROMPIDO, A BARRA DIZ QUE HÁ — E NÃO ABRE NADA (26/10/2026).
     *
     * Era o 'abrirBloco' do ato, para a notícia não ficar escondida. A pesquisadora viu o efeito e
     * recusou-o: «quando eu entro em anamnese, o bloco contexto do ato não pode estar expandido…
     * tem que estar fechado, igual o procurar». Ela tem razão, e a razão é de desenho: um painel
     * que se abre sozinho ao entrar é a página a decidir por quem chegou, e o pedido é o
     * contrário — a tela limpa, e o painel só quando se pede.
     *
     * A NOTÍCIA NÃO SE PERDE: a barra fechada passa a dizer «há um preenchimento interrompido»
     * no lugar do resumo do contexto (o atributo "data-pendente", no CSS). É informação no sítio onde
     * ela é lida sem um clique, e não um painel aberto por decreto. */
    painel.setAttribute('data-pendente', mem ? 'sim' : 'nao');
  }

  function encher(select, itens, rotulo, escolhido) {
    if (!select) return;
    var primeiro = select.firstElementChild;
    while (select.options.length > 1) select.remove(1);
    itens.forEach(function (it) {
      var o = document.createElement('option');
      o.value = it.valor;
      o.textContent = it.rotulo;
      if (it.valor === escolhido) o.selected = true;
      select.appendChild(o);
    });
    void primeiro;
  }

  function pedir(url, opcoes) {
    return fetch(url, opcoes).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        return { ok: r.ok && d.ok !== false, dados: d };
      });
    }).catch(function () { return { ok: false, dados: {} }; });
  }

  function carregarProfessores() {
    return pedir('/api/bastidores/professores').then(function (r) {
      PROFESSORES = (r.dados && r.dados.professores) || [];
      encher(campo('professor'), PROFESSORES.map(function (p) {
        return { valor: p.slug, rotulo: p.nome };
      }), 'nome', valor('professor') || ATOS.professor);
    });
  }

  function carregarAlunas() {
    if (!CFG.ehAnamnese) return Promise.resolve();
    var slug = valor('professor');
    var url = '/api/bastidores/alunas' + (slug ? '?professor=' + encodeURIComponent(slug) : '');
    return pedir(url).then(function (r) {
      var lista = (r.dados && r.dados.alunas) || [];
      var atuais = [];
      var sel = campo('aluna');
      if (sel) { for (var i = 0; i < sel.options.length; i += 1) atuais.push(sel.value); }
      encher(sel, lista.map(function (a) { return { valor: a, rotulo: a }; }), null,
        valor('aluna') || ATOS.aluna || (atuais.length ? atuais[0] : ''));
    });
  }

  /* AS TURMAS DO FILTRO SÃO AS DO PROFESSOR — E A AUSÊNCIA NÃO É PERMISSÃO (27/10/2026).
   *
   * O DEFEITO, relatado pela pesquisadora e medido na bancada: «quando eu vou fazer o plano de
   * ensino e escolho o professor, a turma não está funcionando o filtro». Esta lista oferecia
   * TODAS as turmas da escola — com o professor escolhido, sem professor, e antes de a curadoria
   * chegar. As três turmas da escola de teste apareciam para qualquer um.
   *
   * É a MESMA regra que a porta já aplica no cabeçalho do ato (listaDeTurmasDoProfessor), e é
   * a que a pesquisadora ditou: «o professor é o caminho da verdade… não vai existir aqui nesse
   * filtro turma, possibilidade de escolher uma turma se não tiver o nome do professor». Ela
   * dizia «nesse filtro turma» — e era literalmente neste.
   *
   * Os quatro estados são os mesmos, e cada um tem resposta:
   *   1. sem professor ............ nenhuma turma, e o campo desabilitado;
   *   2. curadoria a caminho ...... nenhuma turma, e o campo desabilitado;
   *   3. curadoria sem turma ...... nenhuma turma, com o motivo escrito;
   *   4. com turmas ............... só as dele, e a escolha anterior que deixou de valer sai.
   *
   * O CRUZAMENTO É PELO NOME, como na porta: opcoesDeTurmas publica valor: t.nome e a
   * curadoria guarda o nome em turmas — é o mesmo vocabulário dos dois lados. */
  function turmasDaCuradoria() {
    var vistas = {};
    for (var i = 0; i < CURADORIAS.length; i += 1) {
      var lista = CURADORIAS[i] && CURADORIAS[i].turmas;
      for (var j = 0; lista && j < lista.length; j += 1) {
        if (lista[j]) vistas[String(lista[j])] = true;
      }
    }
    return vistas;
  }

  function carregarTurmas() {
    if (!CFG.ehPlano) return Promise.resolve();
    var sel = campo('turma');
    var slug = valor('professor');
    /* A ESCOLHA QUE JÁ NÃO É DO PROFESSOR SAI. Trocar de professor deixa no campo a turma do
     * anterior, e uma escolha que deixou de valer não se guarda — a mesma regra da porta. */
    function limparPorque(motivo) {
      if (sel) {
        sel.value = '';
        sel.disabled = true;
        sel.title = motivo;
      }
      encher(sel, [], null, '');
      ATOS.turma = '';
      return Promise.resolve();
    }
    if (!slug) {
      return limparPorque('Escolha primeiro o professor: as turmas são as que a direção atribuiu '
        + 'a ele.');
    }
    if (!CURADORIA_CARREGADA) {
      return limparPorque('A carregar a curadoria deste professor…');
    }
    var autorizadas = turmasDaCuradoria();
    if (!autorizadas || !Object.keys(autorizadas).length) {
      return limparPorque('A direção ainda não atribuiu nenhuma turma a este professor — é a '
        + 'curadoria que autoriza o plano de ensino.');
    }
    return pedir('/api/bastidores/turmas').then(function (r) {
      var lista = (r.dados && (r.dados.turmas || r.dados.lista)) || [];
      var doProfessor = lista.map(function (t) {
        var nome = typeof t === 'string' ? t : (t.nome || t.turma || '');
        return nome;
      }).filter(function (nome) { return nome && autorizadas[String(nome)]; });
      var escolhida = valor('turma') || ATOS.turma;
      if (escolhida && doProfessor.indexOf(String(escolhida)) === -1) {
        if (sel) sel.value = '';
        ATOS.turma = '';
        escolhida = '';
      }
      if (sel) {
        sel.disabled = false;
        sel.title = '';
      }
      encher(sel, doProfessor.map(function (nome) {
        return { valor: nome, rotulo: nome };
      }), null, escolhida);
    });
  }

  /* O PO ESCOLHE O PLANO — e a turma vem dele.
   *
   * A ESTANTE É RECORTADA PELO PROFESSOR ('?professor='), e o recorte é do SERVIDOR: foi assim
   * que se fechou o defeito de o PO de um professor oferecer o plano de outro. Sem professor
   * escolhido não se pede nada — a estante da escola inteira é exactamente o que não se quer.
   *
   * A TURMA OBSERVADA É O PLANO QUE A DIZ. Escolher o plano e voltar a escolher a turma seria
   * pedir duas vezes a mesma coisa, e abrir a porta a duas respostas diferentes. */
  var PLANOS = [];
  function carregarPlanos() {
    var slug = valor('professor');
    if (!CFG.ehPo || !slug) {
      PLANOS = [];
      encher(campo('plano'), [], null, '');
      pintarDoPlano();
      return Promise.resolve();
    }
    /* A ESTANTE VIVE SOB O PREFIXO DA PORTA, e não na raiz. O roteador das rotas só é
     * alcançado em '/anamnese/…', '/plano-ensino/…' e '/plano-observacao/…' ('producao.js',
     * ramo 1): pedir '/api/planos' na raiz dá 404, o select ficava vazio e o botão travado —
     * para sempre, porque a trava do PO é «falta o plano». Medido em produção: na raiz 404,
     * sob o prefixo 200 com a estante recortada. As rotas dos Bastidores são a excepção: essas
     * vivem mesmo na raiz. */
    return pedir(CFG.porta + 'api/planos?professor=' + encodeURIComponent(slug)).then(function (r) {
      PLANOS = (r.dados && (r.dados.opcoes || r.dados.planos)) || [];
      /* SÓ O VIGENTE SE OFERECE (07/11/2026). O plano original e o seu ajuste apareciam os dois,
       * com o mesmo nome — escolher entre eles era escolher entre a mesma coisa e a mais velha.
       * A estante marca cada plano substituído ('anterior'); aqui esconde-se o substituído, com
       * uma excepção declarada: o que ESTE documento já aponta tem de continuar na lista, senão
       * o campo aparece sem marcação e a gravação seguinte perde a referência em silêncio. Ele
       * fica, dito por extenso, para não se confundir com o vigente. */
      var atual = String(valor('plano') || ATOS.plano || '').trim();
      encher(campo('plano'), PLANOS.filter(function (p) {
        return !p.anterior || String(p.carimbo || p.valor) === atual;
      }).map(function (p) {
        var turma = p.turma ? ' · ' + p.turma : '';
        var nome = p.rotulo || p.carimbo;
        if (p.anterior && String(p.carimbo || p.valor) === atual) nome += ' (versão anterior)';
        return { valor: p.carimbo || p.valor, rotulo: nome + turma };
      }), null, atual);
      pintarDoPlano();
    });
  }

  /* O QUE O PLANO ESCOLHIDO DIZ — a TURMA e o CICLO (06/11/2026).
   *
   * Os dois vêm do mesmo sítio e pela mesma razão: escolher o plano é escolher a aula que se
   * observa, e a aula já está dentro de um ciclo e de uma turma. Pedir qualquer um dos dois ao
   * lado do plano era pedir duas vezes a mesma coisa e abrir a porta a duas respostas diferentes
   * — e a que a tela aceitasse era a que não estava ancorada em nada.
   *
   * O CICLO PASSOU A SER UMA LEITURA AQUI (06/11/2026), e não um campo. O input continua a
   * existir, oculto, porque é ele que a chave da memória, o endereço e o resumo leem — mas quem o
   * escreve é esta função, com o ciclo do plano. Sem plano escolhido não há nem turma nem ciclo a
   * mostrar, e o «—» é a verdade: um valor que ainda não existe não informa.
   *
   * O CICLO DE UM PLANO ANTIGO PODE FALTAR — e então o painel DIZ que falta, em vez de deixar o
   * botão travado sobre um campo que ninguém tem para onde preencher. */
  function pintarDoPlano() {
    var escolhido = valor('plano');
    var achado = null;
    for (var i = 0; i < PLANOS.length; i += 1) {
      if (String(PLANOS[i].carimbo || PLANOS[i].valor) === escolhido) { achado = PLANOS[i]; break; }
    }
    var alvo = $('[data-turma-leitura]');
    if (alvo) alvo.textContent = (achado && achado.turma) || '\u2014';
    var ciclo = achado ? String(achado.ciclo == null ? '' : achado.ciclo).trim() : '';
    var entrada = campo('ciclo');
    /* O CAMPO NÃO EXISTE EM TODAS AS FAMÍLIAS: na anamnese ele não se pede, e no plano de ensino
     * ele é um campo a sério, que se escreve — aqui só se pinta onde ele é leitura. */
    if (entrada && CFG.ehPo) entrada.value = ciclo;
    var mostra = $('[data-ciclo-leitura]');
    if (mostra) mostra.textContent = ciclo || '\u2014';
  }

  function carregarCuradoria() {
    var slug = valor('professor');
    if (!slug || CFG.ehAnamnese) { CURADORIAS = []; CURADORIA_CARREGADA = CFG.ehAnamnese; return Promise.resolve(); }
    return pedir('/api/bastidores/curadoria-professor?professor=' + encodeURIComponent(slug))
      .then(function (r) {
        CURADORIAS = (r.dados && Array.isArray(r.dados.curadorias)) ? r.dados.curadorias : [];
        CURADORIA_CARREGADA = true;
      });
  }

  /* A SENHA É VALIDADA NO SERVIDOR, como na porta. Aqui só se guarda o veredicto. */
  var tempoDeSenha = null;
  var pedidoDeSenha = 0;
  function validarSenha() {
    var senha = valor('senha');
    var professor = valor('professor');
    if (!senha || !professor) { SENHA = ''; pintar(); return; }
    /* A CORRIDA: cada tecla dispara um pedido depois de 450ms, e dois pedidos em voo podem
     * responder fora de ordem — o antigo a chegar por ultimo diria «certa» sobre a senha errada.
     * O contador descarta a resposta que ja nao e a ultima pedida. */
    pedidoDeSenha += 1;
    var meu = pedidoDeSenha;
    pedir('/api/bastidores/validar-senha', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: senha, professor: professor }),
    }).then(function (r) {
      if (meu !== pedidoDeSenha) return;
      /* TRÊS VEREDICTOS, E NÃO DOIS (15/11/2026). «a senha está errada» e «o professor saiu da
       * escola» são factos diferentes, e o segundo chegou quando uma senha CERTA passou a ser
       * recusada — o desligado já não abre atos novos. Colapsá-los no mesmo estado diria à pessoa
       * que ela digitou mal o que digitou bem. */
      /* QUATRO VEREDICTOS, E NÃO TRÊS (16/11/2026). O quarto é a escola suspensa — e ele nasceu
       * do mesmo defeito que a porta dos Bastidores tinha: com a escola desabilitada, o servidor
       * recusa por ESTADO, e a tela dizia «a senha não foi reconhecida» sobre uma senha certa.
       * A pessoa ia conferir a senha, que estava boa, em vez de falar com quem suspendeu.
       *
       * A ordem importa: 'desligado' e 'suspensa' são factos do servidor sobre a PESSOA e a
       * ESCOLA; 'errada' é o que sobra quando nenhum deles se aplica — a única hipótese em que a
       * senha é mesmo o problema.
       *
       * E ESTE COMENTÁRIO NÃO USA CRASES, porque vive dentro de um template literal: uma crase
       * aqui fecha a string que contém o script, exactamente como a aspa do seletor de ontem
       * fechava um seletor. A casa já pagou duas vezes pelo mesmo erro — uma string que atravessa
       * duas linguagens tem de ser escrita na linguagem em que está. */
      SENHA = r.ok ? 'ok'
        : ((r.dados && r.dados.desligado) ? 'desligado'
          : ((r.dados && r.dados.suspensa) ? 'suspensa' : 'errada'));
      pintar();
    });
  }

  /* O DESTINO — os mesmos parâmetros que a linha do cartão usa, e que a porta lê. */
  function endereco() {
    var q = [];
    if (valor('professor')) q.push('professor=' + encodeURIComponent(valor('professor')));
    /* O CICLO NÃO VAI NO ENDEREÇO DA ANAMNESE. Ele não é do ato, e um parâmetro a mais é um
     * valor a mais para a porta interpretar (e a mais para o bilhete ter de casar). */
    if (!CFG.ehAnamnese && valor('ciclo')) q.push('ciclo=' + encodeURIComponent(valor('ciclo')));
    if (CFG.ehAnamnese && valor('aluna')) q.push('aluna=' + encodeURIComponent(valor('aluna')));
    if (CFG.fonte !== 'anamnese') q.push('fonte=' + CFG.fonte);
    /* O PLANO VAI NO ENDEREÇO. Sem ele a porta escolhe o PRIMEIRO da estante — e o professor
     * escolheu este. Duas escolhas para o mesmo ato e a da tela perdia. */
    if (CFG.ehPo && valor('plano')) q.push('plano=' + encodeURIComponent(valor('plano')));
    /* 'abrir=1' — O SALTO DIRETO AO FORMULÁRIO. A página da porta era uma paragem: cabeçalho,
     * textos de desenvolvimento, uma listagem de fichas e só então o formulário. Tudo isso
     * passou a morar na lista (o painel que aqui está), e quem vem daqui já decidiu o que quer.
     * A porta lê o parâmetro e entra no nó 1 — o gancho 'autoAbrir' já existia lá, à espera. */
    q.push('abrir=1');
    return CFG.porta + (q.length ? '?' + q.join('&') : '');
  }

  /* O BILHETE DO ATO. A senha autoriza o ATO e não viaja no endereço — mas o professor acabou
   * de a digitar AQUI, e a porta voltava a pedi-la. O servidor emite um bilhete de uso único,
   * ligado a este ato, que a porta troca por autorização; é o que faz «criar» aterrar no
   * formulário em vez de na página intermédia.
   *
   * SÓ SE PEDE ONDE HÁ SENHA E ELA CONFERIU. No PO não há senha nenhuma (a porta é explícita
   * nisso) e não há nada a transportar. Se o bilhete falhar — sem KV, rede fora —, navega-se
   * sem ele: a porta pede a senha, que é o comportamento de antes, e não um beco sem saída. */
  function irAoFormulario() {
    var destino = endereco();
    if (!CFG.temSenha || SENHA !== 'ok') { window.location.href = destino; return; }
    pedir('/api/bastidores/ato', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senha: valor('senha'), professor: valor('professor'), fonte: CFG.fonte,
        /* O BILHETE LEVA O QUE O ATO TEM. Na anamnese não há ciclo — e mandá-lo (mesmo vazio)
         * fazia a porta comparar um campo que ela própria esconde. O bilhete descreve o ato; um
         * acto sem ciclo não declara ciclo. */
        ciclo: CFG.ehAnamnese ? '' : valor('ciclo'),
        aluna: valor('aluna'), plano: valor('plano'),
      }),
    }).then(function (r) {
      var d = r.dados || {};
      if (r.ok && d.ato) destino += '&ato=' + encodeURIComponent(d.ato);
      window.location.href = destino;
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-acao]');
    if (!b || !b.closest('#bloco-ato')) return;
    var acao = b.getAttribute('data-acao');
    if (acao === 'nova' || acao === 'continuar') {
      b.disabled = true;
      irAoFormulario();
    } else if (acao === 'recomecar') {
      /* «Começar de novo» limpa e o painel FICA ABERTO. Fechá-lo esconderia justamente o botão
       * que volta — e o pedido é literal: «desaparece o continuar, desaparece o começar de novo, e
       * fica só o nova anamnese». O professor está a olhar para ali; o estado novo aparece ali. */
      limparMemoria();
      pintar();
    }
  });

  ['professor', 'ciclo', 'aluna', 'turma', 'plano'].forEach(function (nome) {
    var e = campo(nome);
    if (!e) return;
    e.addEventListener('change', function () {
      /* O QUE O PLANO DIZ PINTA-SE ANTES DE 'pintar()' (06/11/2026). O ciclo deixou de ser um
       * campo e passou a ser escrito por 'pintarDoPlano()' — e o estado do botão («falta o
       * plano», «falta o ciclo do plano») lê esse valor. Pintar depois de avaliar seria a tela a
       * decidir sobre um valor que ainda não tinha sido escrito: um quadro de atraso. */
      if (nome === 'plano') pintarDoPlano();
      pintar();
      gravarContexto();
      if (nome === 'professor') {
        carregarAlunas().then(pintar);
        /* A TURMA DO FILTRO DEPENDE DA CURADORIA DO PROFESSOR: recarrega-se DEPOIS dela, e não
         * em paralelo — correr as duas ao mesmo tempo leria a curadoria do professor anterior. */
        carregarCuradoria().then(carregarTurmas).then(pintar);
        /* Trocar de professor troca a estante, e a escolha anterior deixa de valer: o plano de
         * um professor não é observável pelo outro. */
        var sel = campo('plano');
        if (sel) sel.value = '';
        carregarPlanos().then(pintar);
      }
    });
    e.addEventListener('input', function () { gravarContexto(); pintar(); });
  });
  var senhaEl = campo('senha');
  if (senhaEl) {
    /* sem campo não há nada a validar: o PO entra com 'SENHA = ''' e a trava não olha para ela */
    senhaEl.addEventListener('input', function () {
      clearTimeout(tempoDeSenha);
      tempoDeSenha = setTimeout(validarSenha, 450);
    });
  }

  /* A ORDEM IMPORTA: os professores primeiro (é o que dá nome ao resumo), a curadoria e as
   * alunas depois (dependem do professor escolhido), e o pinta no fim de cada uma. */
  /* O MENU «AÇÕES» FICA ABERTO NO COMPUTADOR. No telemóvel ele é a única porta para o
   * contexto, a ficha e o filtro; no computador não faz sentido — a tela tem espaço, e um
   * clique a mais para ver o que estava à vista seria pior do que não o ter.
   *
   * A JANELA PODE MUDAR DE LARGURA (girar o telemóvel, encolher a janela do computador), e
   * a regra é reavaliada. Ao ENCOLHER não se fecha o que o professor abriu — só se abre ao
   * crescer, porque fechar por baixo de quem está a usar é o defeito que se evita. */
  /* O MENU «AÇÕES» — A FOLHA QUE SOBE, COMO O «SEÇÕES» DA PRODUÇÃO (25/10/2026, terceira).
   *
   * O desenho é o da Produção, e não um parente dele: botão em pílula à DIREITA da página, e —
   * ao abrir — uma folha que sobe de baixo com véu por trás. A pesquisadora foi literal: «ele
   * não tá abrindo um menu igual o menu de opções… o botão de ações tá do lado esquerdo. Ele tem
   * que ficar lá do lado direito, porque ele é igual ao opções».
   *
   * OS DOIS BLOCOS SÃO EXCLUSIVOS. «Ou eu tenho o procurar ou eu tenho a nova anamnese.» Nunca
   * os dois — nem no telemóvel (escolher uma acção do menu fecha a outra) nem no computador
   * (abrir um bloco fecha o outro). É uma regra só, e vive em 'abrirBloco'.
   *
   * COLAPSAR É FECHAR. O 'summary' de cada bloco é o botão: fechado, o bloco desaparece e fica
   * só a listagem com o «Ações» à direita — que é o estado de repouso pedido, «a tela limpa».
   */
  var botaoAcoes = document.getElementById('botao-acoes');
  var menuDeAcoes = document.getElementById('menu-de-acoes');
  var veuDoMenu = document.getElementById('veu-acoes');
  var blocoDoAto = document.getElementById('bloco-ato');
  var blocoDoFiltro = document.getElementById('bloco-filtro');
  /* A LARGURA, NUM SÍTIO SÓ, e declarada ANTES de quem a usa: o 'matchMedia' é a mesma condição
   * do CSS (560px), e ter duas cópias dela — uma no desenho, outra no script — é o género de
   * divergência que só aparece no dia em que uma muda. E 'pintar()' já pode chamar 'abrirBloco'
   * durante o arranque (quando há preenchimento interrompido): uma variável ainda vazia ali seria
   * uma excepção a meio da página. */
  var largo = window.matchMedia('(min-width: 561px)');

  /* ABRIR UM É FECHAR O OUTRO, e é a única porta: quem quer abrir chama isto, e não mexe no
   * 'open' à mão. Duas portas para a mesma regra divergiriam no dia em que uma mudasse — e o
   * sintoma seria os dois blocos à vista, que é exactamente o que não pode acontecer. */
  function abrirBloco(nome) {
    var alvo = nome === 'ato' ? blocoDoAto : (nome === 'filtro' ? blocoDoFiltro : null);
    var outro = nome === 'ato' ? blocoDoFiltro : blocoDoAto;
    /* NO TELEMÓVEL O BLOCO SÓ EXISTE DEPOIS DE ESCOLHIDO. Ele nasce escondido (o atributo 'hidden'), e é o
     * menu que o traz: «esse espaço contexto do ato e o procurar só vai ser acionado, aparecer
     * para o usuário, quando clicar em ações». Sem isto os dois 'summary' ficavam à vista — dois
     * acordeões por cima de um botão «Ações» que já faz esse trabalho. */
    if (outro) {
      outro.open = false;
      if (ehTelefone()) outro.hidden = true;
    }
    if (alvo) {
      alvo.hidden = false;
      alvo.open = true;
    }
    fecharMenu();
  }
  /* A LARGURA, NUM SÍTIO SÓ. 'matchMedia' é a mesma condição do CSS ('560px'), e ter duas cópias
   * dela — uma no desenho, outra no script — é o género de divergência que só aparece no dia em
   * que uma muda. */
  function ehTelefone() { return !largo.matches; }

  function fecharMenu() {
    if (menuDeAcoes) menuDeAcoes.hidden = true;
    if (veuDoMenu) veuDoMenu.hidden = true;
    if (botaoAcoes) botaoAcoes.setAttribute('aria-expanded', 'false');
  }
  function abrirMenu() {
    if (menuDeAcoes) menuDeAcoes.hidden = false;
    if (veuDoMenu) veuDoMenu.hidden = false;
    if (botaoAcoes) botaoAcoes.setAttribute('aria-expanded', 'true');
  }

  if (botaoAcoes && menuDeAcoes) {
    botaoAcoes.addEventListener('click', function () {
      if (menuDeAcoes.hidden) abrirMenu(); else fecharMenu();
    });
    menuDeAcoes.addEventListener('click', function (e) {
      var alvo = e.target.closest && e.target.closest('[data-abrir]');
      if (!alvo) return;
      var nome = alvo.getAttribute('data-abrir');
      /* «Gerar ficha» é um link: abre noutra aba. O menu fecha-se porque já cumpriu. */
      if (nome === 'ficha') { fecharMenu(); return; }
      e.preventDefault();
      abrirBloco(nome);
    });
    /* O véu e o clique fora fecham — os dois gestos que se esperam de uma folha. */
    if (veuDoMenu) veuDoMenu.addEventListener('click', fecharMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuDeAcoes && !menuDeAcoes.hidden) fecharMenu();
    });
  }

  /* COLAPSAR, NO TELEMÓVEL, É DESAPARECER. O 'summary' é o botão de colapsar («eu clico em
   * colapsar e ele desaparece da tela»), e no telemóvel fechar não deixa uma barra fechada por
   * cima da listagem: o bloco volta para dentro do menu e sai da tela. No computador fica a barra,
   * porque é ela que se volta a clicar para abrir o outro.
   *
   * E ABRIR UM FECHA O OUTRO — a exclusividade, no evento 'toggle', que corre DEPOIS de o estado
   * mudar. Se o utilizador estiver a FECHAR, não se abre nada. */
  [blocoDoAto, blocoDoFiltro].forEach(function (bloco) {
    if (!bloco) return;
    bloco.addEventListener('toggle', function () {
      if (!bloco.open) {
        if (ehTelefone()) bloco.hidden = true;
        return;
      }
      var outro = bloco === blocoDoAto ? blocoDoFiltro : blocoDoAto;
      if (outro) {
        outro.open = false;
        if (ehTelefone()) outro.hidden = true;
      }
    });
  });

  /* A LARGURA MANDA — e o estado de repouso é diferente nos dois modos.
   *
   * NO COMPUTADOR OS DOIS BLOCOS FICAM À VISTA, E FECHADOS. «Eu tô na tela grande… ao invés de
   * aparecer o contexto do ato expandido, ele vai aparecer também colapsado, igual tá o
   * procurar.» Duas barras, quem quer criar abre a sua, quem quer procurar abre a outra — e nunca
   * as duas abertas. O NOME DA BARRA FECHADA É O DA ACÇÃO («Fazer anamnese»), e não o nome
   * técnico: «contexto do ato… isso é um nome técnico que nós temos aqui enquanto estamos
   * programando». Aberta, ela passa a «Contexto do ato», que é o que faz sentido quando se está a
   * preencher os campos. A troca é do CSS (.bloco-nome-fechado / .bloco-nome-aberto).
   *
   * NO TELEMÓVEL NENHUM DOS DOIS EXISTE até ser escolhido: a tela é da listagem, e o «Ações» é a
   * porta. Abrir por conta própria qualquer um deles seria o estado que ele descreveu como
   * errado — «não faz sentido ter esses dois acordeões se eu já tenho o botão ações».
   *
   * A EXCEPÇÃO É O PREENCHIMENTO INTERROMPIDO (26/10/2026). «Quando eu tiver lá no formulário e
   * voltar para continuar mais tarde… no modo celular, o fazer anamnese, que tem o botão
   * continuar de onde parei, ele precisa estar expandido e não colapsado. Aí o próprio usuário
   * escolhe se quer colapsar. Mas enquanto tiver os dados preenchidos para continuar depois, ele
   * vai abrir expandido sempre. Se tiver vazio, aí fica colapsado, mantém a regra que a gente
   * tem agora.»
   *
   * É a diferença entre uma página em repouso e uma página com trabalho por acabar: quem volta
   * dias depois não tem de descobrir, no menu «Ações», que existe um preenchimento à espera — ele
   * está à vista, com o botão «Continuar de onde parei» dentro. O bloco continua a fechar-se, e a
   * escolha de quem o fechou vale: não se reabre por baixo.
   */
  var jaDecidiuOPreenchimento = false;
  function abrirSeHaOQueContinuar() {
    if (jaDecidiuOPreenchimento) return;
    if (!blocoDoAto || !ehTelefone()) return;
    /* O CONTEXTO TEM DE ESTAR RESTAURADO: a chave do depósito leva a escola, o professor e o
     * ciclo, e sem eles apontaria para uma chave que não existe. É por isso que esta função é
     * chamada no fim das cargas — e uma primeira vez logo a seguir, para o caso de o contexto vir
     * restaurado e o professor já estar na barra. */
    if (!haOQueContinuar(memoria())) return;
    jaDecidiuOPreenchimento = true;
    blocoDoAto.hidden = false;
    blocoDoAto.open = true;
    fecharMenu();
  }

  function ajustarAoModo() {
    if (largo.matches) {
      if (blocoDoAto) { blocoDoAto.hidden = false; blocoDoAto.open = false; }
      if (blocoDoFiltro) { blocoDoFiltro.hidden = false; blocoDoFiltro.open = false; }
      fecharMenu();
    } else {
      if (blocoDoAto) { blocoDoAto.open = false; blocoDoAto.hidden = true; }
      if (blocoDoFiltro) { blocoDoFiltro.open = false; blocoDoFiltro.hidden = true; }
      fecharMenu();
    }
  }
  ajustarAoModo();
  if (largo.addEventListener) largo.addEventListener('change', ajustarAoModo);
  else if (largo.addListener) largo.addListener(ajustarAoModo);

  restaurarContexto();
  carregarProfessores().then(function () { pintar(); return carregarCuradoria(); })
    .then(function () { return carregarAlunas(); })
    .then(function () { return carregarTurmas(); })
    .then(function () { return carregarPlanos(); })
    .then(function () { pintar(); abrirSeHaOQueContinuar(); });
  pintar();
  /* A PRIMEIRA TENTATIVA, JÁ A SEGUIR. Quando o contexto vem restaurado e o professor já está na
     barra — o caso normal de quem voltou à lista —, o depósito encontra-se sem esperar pelas
     quatro cargas. Sem professor escolhido a chave não fecha, nada abre, e a flag continua por
     pôr: a decisão passa para o fim da cadeia. */
  abrirSeHaOQueContinuar();
})();</script>`;
}

/** O escape de uma string para dentro de um literal de JavaScript num `<script>`. */
function eschave(texto) {
  return String(texto).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/**
 * AS LINHAS DE UMA FAMÍLIA, como o cartão da listagem as quer.
 *
 * Cada família tem o seu «de quem», e nenhuma delas o inventa:
 *   · anamnese — a ALUNA é o registo, e a turma vem da curadoria que a matriculou. Sem curadoria,
 *     «sem turma» e o selo «nova», que é derivado (deixa de o ser no dia em que entrar numa);
 *   · plano de ensino — a TURMA está no próprio registo (`turmaDoEnvelope`);
 *   · PO — a turma vem do plano de ensino que ele observa.
 */
/**
 * AS LINHAS DE UMA FAMÍLIA.
 *
 * OS DERIVADOS VÃO NUM OBJECTO, e não em mais posições (04/11/2026). A assinatura já tinha sete
 * parâmetros posicionais; acrescentar o oitavo (`revalidar`) seria mais um `undefined` a passar
 * despercebido — e foi exactamente esse o defeito que apareceu: a função usava `revalidar` e o
 * chamador não o passava, e a lista caía em `ReferenceError` na primeira linha com PO. Com um
 * objecto nomeado, quem acrescenta um derivado novo acrescenta-o num sítio onde o nome o diz, e
 * quem esquece um vê `undefined` no sítio certo em vez de rebentar no meio.
 */
/**
 * O ESTADO DE CADA PO, numa passagem (04/11/2026).
 *
 * A regra é a do núcleo (`porta.estadoDoPo`) e NÃO se repete aqui: o que esta função faz é
 * aplicá-la à lista já lida, para não varrer o acervo uma vez por registo. Duas derivações da
 * mesma regra divergiriam, e a que ficasse para trás seria a do ecrã — o mesmo motivo escrito na
 * escolha dos `estados` do plano.
 *
 * O que se procura é o SUCESSOR: um PO cujo `ajuste_de` aponta para este. Não há aqui a trava
 * «está vinculado» do plano, porque nada referencia um PO — o ciclo gerado guarda a sua cópia.
 */
async function estadosDosPos(armazenamento, resumos) {
  const sucessores = new Map();
  for (const { nome, resumo } of resumos) {
    const pai = String(resumo.ajuste_de || '');
    if (!pai) continue;
    if (!sucessores.has(pai)) sucessores.set(pai, []);
    sucessores.get(pai).push(resumo.id || nome.replace(/\.json$/, ''));
  }
  const autorDe = new Map();
  for (const { nome, resumo } of resumos) {
    autorDe.set(resumo.id || nome.replace(/\.json$/, ''),
      String(resumo.professor || '').trim() || null);
  }
  const estados = {};
  for (const { nome, resumo } of resumos) {
    const carimbo = resumo.id || nome.replace(/\.json$/, '');
    const substituido_por = sucessores.get(carimbo) || [];
    /* O ELO QUE TROCOU DE MÃOS — a regra é a do núcleo (`porta.estadosDosPlanos`) e não se
     * repete: um elo e o seu `ajuste_de` são o mesmo documento, e autores diferentes são um nome
     * trocado no caminho. */
    const autor = String(resumo.professor || '').trim() || null;
    const autorDoAnterior = resumo.ajuste_de ? (autorDe.get(String(resumo.ajuste_de)) || null) : null;
    const trocou = Boolean(resumo.ajuste_de && autorDoAnterior && autor && autorDoAnterior !== autor);
    /* SEM `estado`, DE PROPÓSITO (04/11/2026). O `linhasDe` usa `estado.estado` para o SELO da
     * linha — e um PO nunca teve selo de estado: ele ganhou «gerado» quando gerou o ciclo, e nada
     * mais. Emitir `solta` aqui punha uma etiqueta nova em todas as linhas do PO sem ninguém a ter
     * pedido, e a `provar-listas-do-acervo` reprovou («sem registo de geração, a linha do PO não
     * leva selo»). O que esta lista precisa de saber é só uma coisa: tem sucessor ou não.
     *
     * O AUTOR ENTRA (12/11/2026) porque é ele que a linha mostra em «Quem fez» e é com ele que se
     * decide o «sem turma». A TURMA não entra: o PO não a declara no resumo — ele herda-a do plano
     * que observa, e quem a resolve é o `linhasDe`, que já tem o mapa. */
    estados[carimbo] = {
      carimbo,
      professor: autor,
      ajuste_de: resumo.ajuste_de || null,
      substituido_por,
      derivado: substituido_por.length > 0,
      ...(trocou ? { reatribuido: true, autorDoAnterior } : {}),
    };
  }
  return estados;
}

function linhasDe(familia, registos, estados, turmasDaAluna, turmaDoPlano, derivados, filiacao, memoriaDaAluna, direcao) {
  const { gerados, historico, revalidar } = derivados || {};
  /* AS VERSÕES QUE A LINHA GUARDOU (03/11/2026). A estante mostra o documento vigente; o que ele
   * substituiu continua no acervo, com a cadeia inteira. Dizer quantas são é o mínimo: uma linha
   * que aparece sozinha onde havia três, sem uma palavra, faz concluir que o sistema apagou o
   * trabalho — e não apagou nada. */
  const versoesAnteriores = (id) => {
    const ids = (historico && historico.get(id)) || [];
    if (!ids.length) return '';
    return ids.length + (ids.length === 1 ? ' versão anterior guardada' : ' versões anteriores guardadas');
  };
  return registos.map((r) => {
    const estado = estados[r.id] || {};
    const quem = nomeDoProfessor(r);
    const quando = dia(r.gerado_em);
    const anteriores = versoesAnteriores(r.id);
    if (familia === 'anamnese') {
      const turma = turmasDaAluna.get(r.aluna) || '';
      /* A LINHA DE BASE A QUE A ALUNA PERTENCE (05/11/2026). A etiqueta que a pesquisadora pediu
       * por palavras próprias: «vou acrescentar também a etiqueta dizendo qual é o nome da linha
       * de base que ela pertence, essa aluna, na anamnese». Ela é lida das linhas de base da
       * escola — a fonte do acto —, e não de um campo escrito na anamnese: o vínculo é derivado,
       * e um vínculo declarado em dois sítios diverge no primeiro dia em que um deles mudar. */
      const pertence = filiacao ? (filiacao.get(r.aluna) || null) : null;
      const temLinhaDeBase = !!(pertence && pertence.linhas.length);
      const nomeDaLinha = pertence ? pertence.nome : '';
      const quantas = pertence ? pertence.linhas.length : 0;
      /* O ESTADO DA PESSOA, QUE NÃO É O ESTADO DO DOCUMENTO (08/11/2026). O selo desta linha
       * respondia a duas perguntas ao mesmo tempo — «posso mexer no registo?» (o documento) e
       * «quem é esta aluna hoje?» (a pessoa) —, e por isso as duas mentiam juntas para quem saiu:
       * o documento continua travado (um PO a declarou) e a linha dizia «aluna nova», que é o
       * contrário de travada. Ver `desligamento.estadoDaAluna` para a derivação e para a razão de
       * ela não ser uma marca. */
      const desligada = desligamento.estadoDaAluna({
        aluna: r.aluna,
        linhas: (memoriaDaAluna && memoriaDaAluna.linhas) || [],
        curadorias: (memoriaDaAluna && memoriaDaAluna.curadorias) || [],
        observada: Boolean(estado.vinculada),
      });
      return {
        nome: r.aluna || 'Anamnese sem sujeito',
        /* O NOME É O LINK (27/10/2026). É o gesto que a pesquisadora descreveu: passar o mouse
         * sobre a aluna e ir para a ficha dela — sem passar pelo «Editar», que é «um lugar de
         * atenção». A ficha é a mesma folha que se imprime. */
        ler: fichaDeLeitura('anamnese', r),
        /* O SELO NUNCA FICA VAZIO (25/10/2026). «As anamneses que eu já tenho prontas aqui estão
         * livres, né? Não estão vinculadas, estão sem o rótulo indicando se ela é livre ou não.»
         * Estavam mesmo: a expressão anterior devolvia `''` sempre que a aluna TINHA turma e a
         * anamnese não estava vinculada — que é o caso mais comum de todos. Um rótulo que só
         * aparece em dois dos três estados é um rótulo que mente por omissão: quem lê não sabe se
         * a ficha está livre ou se o selo é que não veio.
         *
         * Os três estados, e o que cada um quer dizer para quem vai mexer:
         *   · vinculada — um Plano de Observação já a usa; não se edita, acrescenta-se um elo;
         *   · nova      — a aluna ainda não está em curadoria nenhuma NEM tem linha de base; é a
         *                 porta de entrada;
         *   · livre     — a aluna já tem turma ou linha de base, e nenhum PO a usa; edita-se e
         *                 apaga-se.
         *
         * «NOVA» PRECISOU DE UMA SEGUNDA CONDIÇÃO (05/11/2026). Ela era `!turma`, e a turma vinha
         * só da curadoria — numa escola sem curadorias, TODA a gente era «nova» para sempre,
         * inclusive quem já tinha linha de base feita e enviada. «Ela já não é mais nova, porque
         * eu já fiz a linha de base dela» é a regra, e é ela que a condição passou a dizer.
         *
         * «DESLIGADA» É O QUARTO ESTADO (08/11/2026), e vem primeiro porque é o único que não se
         * lê do presente: quem saiu não está em elenco nenhum e continua a ter história. O selo
         * `legado` — o do traço ponteado, que já existe na folha — diz «é memória, não é o
         * presente», que é exactamente o que a palavra precisa de dizer. Ver
         * `desligamento.estadoDaAluna`. */
        selo: desligada.desligada ? 'desligada'
          : estado.vinculada ? 'vinculada'
            : ((r.aluna && !turma && !temLinhaDeBase) ? 'nova' : 'livre'),
        /* A CLASSE É A COR, e a cor não distingue «nova» de «livre» de propósito: as duas dizem
         * a mesma coisa a quem vai mexer no registo — pode-se editar. O que distingue é o TEXTO,
         * que é onde está o que a pessoa precisa de saber. Inventar um estado de selo novo na
         * folha («nova») para uma diferença que não muda o gesto seria desenho a mais.
         *
         * A DESLIGADA É A EXCEPÇÃO, e por isso usa a classe `legado`: o que ela diz é diferente
         * do que «livre» diz — não é «podes mexer», é «isto é memória». */
        seloClasse: desligada.desligada ? 'legado' : (estado.vinculada ? 'vinculada' : 'livre'),
        turma: turma,
        professor: quem,
        contexto: desligada.desligada
          ? 'desligada — já não está em nenhum elenco'
            + (desligada.sala ? ' · esteve na turma «' + desligada.sala + '»' : '')
          : turma && temLinhaDeBase
            ? 'turma ' + turma + ' · linha de base «' + nomeDaLinha + '»'
            : turma
              ? 'vinculada à turma ' + turma
              : temLinhaDeBase
                ? 'linha de base «' + nomeDaLinha + '» — ainda sem turma'
                : 'aluna nova — sem turma e sem linha de base',
        acoes: acoesDaLinha('anamnese', r, estado),
        ...(anteriores ? { fatos: [anteriores] } : {}),
        caixas: [
          { rotulo: 'Turma', valor: turma || 'sem turma',
            painel: listaDePares([
              ['Turma', turma || 'sem turma'],
              ['Linha de base', temLinhaDeBase
                ? (nomeDaLinha || '—') + (quantas > 1 ? ' (e ' + (quantas - 1) + ' anterior(es))' : '')
                : 'nenhuma'],
              ['Estado', desligada.desligada
                ? (estado.vinculada
                  ? 'desligada — o registro é proveniência (um PO já a declarou)'
                  : 'desligada — fora de todos os elencos')
                : (estado.vinculada ? 'vinculada — um PO já a usa' : (estado.legado ? 'legado' : 'solta'))]],
              turma
                ? 'A turma vem da linha de base enviada (Corpo → passo 5); sem ela, da curadoria.'
                : (temLinhaDeBase
                  ? 'A linha de base existe e ainda não foi enviada para uma turma — é o passo 5 '
                    + 'que declara o elenco.'
                  : 'Aluna nova pode ser entrevistada por qualquer professor. O selo é derivado: '
                    + 'no dia em que tiver linha de base, deixa de o ser.')) },
          { rotulo: 'Quem fez', valor: quem || '—',
            painel: listaDePares([['Professor', quem || '—'], ['Ciclo', r.ciclo || '—']]) },
          { rotulo: 'Quando', valor: quando || '—',
            painel: listaDePares([['Registada em', quando || '—'],
              ['Ajustes', estado.ajuste_de ? 'é um ajuste de ' + estado.ajuste_de : 'nenhum']],
              'A data vem do carimbo do registo: é a hora em que ele foi gravado.') },
        ],
      };
    }
    /* A TURMA DO PO VEM DO PLANO DE ENSINO QUE ELE OBSERVA (24/10/2026). O registo do PO não a
     * tem: ele referencia o plano, e é o plano que diz de que turma é. Sem esta resolução a caixa
     * «Turma» saía «—» — e um PO sem turma na listagem parece um PO solto, que é exactamente o
     * que ele não é. Medido em produção: era o único «—» que sobrava. */
    const doPlano = familia === 'plano-de-observacao'
      ? ((r.plano || []).map((id) => (turmaDoPlano || new Map()).get(id)).filter(Boolean)[0] || '')
      : '';
    const turmaDeclarada = r.turma || doPlano || '';
    /* O DOCUMENTO QUE PERDEU A TURMA (12/11/2026).
     *
     * A pesquisadora trocou o professor da Turma, e a cadeia tomou o plano do Pé Torto e o PO do
     * Pé Torto e gravou-os com o nome da Redinha Rosa. A autoria não se reescreve — o que se diz
     * é o que aconteceu: aquele documento é de quem o escreveu, e a turma que ele nomeia passou a
     * ser dirigida por outro. Fica `sem turma`, e onde a linha dizia a turma fica um traço: «se
     * não tem turma, você vai mudar a etiqueta e fazer valer o fato».
     *
     * A regra é UMA, no núcleo (`porta.perdeuATurma`), e o plano já a traz derivada em
     * `estado.semTurma` — `porta.estadosDosPlanos` recebe as curadorias e compara ali. O PO é
     * resolvido aqui porque só aqui a turma dele existe: ele herda-a do plano que observa. */
    const perdeu = familia === 'plano-de-ensino'
      ? (estado.semTurma ? { turma: turmaDeclarada, dono: estado.turmaDe || '' } : null)
      : porta.perdeuATurma({ turma: turmaDeclarada, professor: r.professor }, direcao);
    const turma = perdeu ? '' : turmaDeclarada;
    /* O ELO QUE TROCOU DE MÃOS (12/11/2026). Ele existe, e a linha diz o que ele é: um documento
     * que foi gravado com o nome de um professor sobre o texto de outro. Não é um selo de estado
     * — os estados são do documento; este é um aviso sobre a AUTORIA, e por isso usa a peça do
     * aviso (`.selo.alerta`, o «!»), com a frase no `title` e no `aria-label`. */
    const trocado = Boolean(estado.reatribuido);
    /* O PO QUE JÁ GEROU O CICLO DIZ-SE (26/10/2026). «Eu nao tenho aqui uma etiqueta dizendo que
     * gerou o ciclo, que gerou os documentos... e dizer qual foi o ciclo que gerou. Eu acho que
     * essa e uma informacao preciosa pro professor.»
     *
     * O REGISTO DA GERACAO JA EXISTE — e o que a tela do PO consulta enquanto o GitHub trabalha
     * (geracao.js, chave por escola e turma). Ele nunca chegou a listagem, e por isso a linha do
     * PO era a unica das tres sem etiqueta nenhuma: o plano de ensino diz «vinculada», a anamnese
     * diz «livre», e o PO — o documento que fecha o ciclo — nao dizia nada.
     *
     * O QUE SE LE E O QUE ESTA GRAVADO: o ciclo, quantos documentos derivaram e quando. Nao e
     * promessa nem deducao: sem registo, nao ha selo. */
    const gerado = (familia === 'plano-de-observacao' && gerados) ? gerados.get(r.id) : null;
    /* O SINAL DE REVALIDAÇÃO VEM PRIMEIRO, e é o único facto que PEDE uma acção (04/11/2026). Os
     * outros dizem o que o documento é; este diz o que é preciso fazer — e um aviso enterrado no
     * fim de uma lista de factos não se lê. */
    const precisaRever = (revalidar && revalidar.get(r.id)) || null;
    const fatos = (precisaRever
      ? ['precisa de revisão — ' + precisaRever.motivo]
      : []).concat(gerado
      ? [
        'ciclo ' + (gerado.ciclo || r.ciclo || '—'),
        (gerado.documentos ? gerado.documentos.length : 0) + ' documento(s) gerados',
        gerado.em ? 'em ' + dia(gerado.em) : '',
      ].filter(Boolean)
      : []).concat(anteriores ? [anteriores] : []);
    return {
      nome: (familia === 'plano-de-ensino' ? 'Plano de ensino — ' : 'Plano de Observação — ')
        + (perdeu ? 'sem turma' : (turma || 'turma não declarada')),
      /* A MESMA PORTA PARA LER, nas três famílias (27/10/2026). O PO passou a ter folha hoje —
       * até aqui não tinha nenhuma, e a estante abria o JSON. */
      ler: fichaDeLeitura(familia, r),
      /* O SELO DIZ O QUE EXIGE GESTO, e a precedência é essa: um documento que precisa de revisão
       * não é «vinculada» nem «gerado» para quem o vai abrir — é «rever». A CLASSE não é uma cor
       * nova na folha: usa a do aviso que já existe (`discreto`), porque a cor do catálogo é
       * limitada e um estado de selo novo seria desenho a mais para a mesma ideia. O TEXTO é o
       * que distingue, e é lá que está o que a pessoa precisa de saber.
       *
       * «SEM TURMA» VEM ANTES DE TUDO (12/11/2026) — e não depois do «rever»: ele não é um estado
       * da cadeia, é a situação do documento, e é o que a pesquisadora precisa de ver primeiro. A
       * classe é `legado`, a que já diz «isto é memória, não é o presente»; a palavra é a que ela
       * usa no mesmo caso — «sem turma». */
      /* `SEM TURMA` VEM ANTES DA CADEIA (12/11/2026). Ele dizia «derivada» quando um sucessor
       * existia — e o sucessor pode ser justamente o elo que trocou o nome (ver `reatribuido`),
       * ou um elo legítimo de um documento que depois perdeu a turma. Nos dois casos o facto que
       * o professor precisa de ler primeiro é este: o documento já não tem turma. E foi ela que o
       * disse, na letra: «se não tem turma, você vai mudar a etiqueta e fazer valer o fato». */
      selo: perdeu ? 'sem turma'
        : precisaRever ? 'rever' : (estado.estado || (gerado ? 'gerado' : '')),
      seloClasse: perdeu ? 'legado'
        : precisaRever ? 'discreto'
          : estado.estado === 'vinculada' ? 'vinculada'
            : estado.estado === 'legado' ? 'discreto'
              : gerado ? 'vigente' : 'livre',
      /* A MARCA DA AUTORIA TROCADA, ao lado do nome — a mesma peça do «!» que ela pediu para o
       * cabeçalho e para a revisão do recorte. */
      marca: trocado
        ? { texto: '!', titulo: 'gravado com o nome de ' + (quem || '—')
          + ', mas derivado de um documento de '
          + (nomeDoProfessor({ professor: estado.autorDoAnterior }) || '—')
          + ' — a autoria não se reescreve, e a cadeia já não faz isto' }
        : null,
      fatos: fatos,
      turma: turma,
      professor: quem,
      contexto: familia === 'plano-de-ensino'
        ? String(r.objetivo || '').slice(0, 120)
        : (r.plano && r.plano.length ? 'observa o plano de ensino de ' + r.plano.join(', ') : ''),
      acoes: acoesDaLinha(familia, r, estado),
      caixas: [
        { rotulo: 'Turma', valor: turma || '—',
          painel: listaDePares([
            ['Turma', turma || '—'], ['Ciclo', r.ciclo || '—'],
            ...(familia === 'plano-de-observacao'
              ? [['Sujeitos', (r.sujeitos || []).join(', ') || 'a turma inteira']] : []),
            ...(perdeu ? [['Quem dirige hoje', nomeDoProfessor({ professor: perdeu.dono }) || '—']] : []),
            ...(gerado ? [['Ciclo gerado', String(gerado.ciclo || r.ciclo || '—')
              + (gerado.documentos && gerado.documentos.length
                ? ' · ' + gerado.documentos.map((d) => (d && d.nome) || d).join(', ') : '')]] : [])],
            perdeu
              ? 'Este documento declara a turma «' + turmaDeclarada + '», e ela é hoje dirigida por '
                + 'outro professor. A autoria não se reescreve: o documento continua a ser de '
                + 'quem o escreveu, e fica sem turma. Para o reaproveitar, o autor faz o vínculo à '
                + 'mão, noutra turma.'
              : '') },
        { rotulo: 'Quem fez', valor: quem || '—',
          painel: listaDePares([['Professor', quem || '—']],
            perdeu
              ? 'É o professor que ESCREVEU o documento — a autoria é um facto, e a cadeia não a '
                + 'reescreve quando a turma muda de mãos.'
              : 'É o professor da turma: o plano e a observação são dele sobre a turma dele.') },
        { rotulo: 'Quando', valor: quando || '—',
          painel: listaDePares([
            ['Registado em', quando || '—'],
            ...(familia === 'plano-de-ensino'
              ? [['Expira', 'não declarada — vale enquanto o ciclo correr']]
              : [['Plano de ensino', (r.plano || []).join(', ') || '—']])],
            familia === 'plano-de-ensino'
              ? 'O plano não expira por data própria: ele acompanha o período do ciclo, e o '
                + 'período está no plano do ciclo.'
              : 'O período observado é o do plano de ensino que este PO referencia.') },
      ],
    };
  });
}

/** Os pares rótulo/valor de um painel — a mesma grelha em todas as listas. */
function listaDePares(pares, nota) {
  return listas.painelDoCartao(pares, nota);
}

/**
 * A PÁGINA de uma das três listas — ou `null` quando o caminho não é de nenhuma delas.
 *
 * Recebe o que a ponte já tem: o `env` (com o KV), o menu da escola e o caminho pedido. Devolve
 * o HTML pronto a servir, com a barra já desenhada — a mesma barra de todas as páginas, porque
 * quem a desenha é o mesmo módulo.
 */
async function pagina(caminho, { env, menu, escola, curadorias, linhasDeBase, linhasRascunho }) {
  const chave = Object.keys(FAMILIAS).find((k) => caminho === '/area-do-professor/' + k + '/'
    || caminho === '/area-do-professor/' + k);
  if (!chave) return null;
  const familia = FAMILIAS[chave];
  if (!env || !env.PADD_KV) return null;
  // O MESMO armazenamento da porta (estático → KV), e não uma segunda leitura do KV: uma lista
  // que lesse por um caminho diferente do da porta mostraria registos que a porta não encontra.
  const armazenamento = criarArmazenamento(env);

  /* AS TRÊS ENTRADAS LÊEM-SE AO MESMO TEMPO (13/11/2026).
   *
   * O índice dos envelopes (repositório), as curadorias (KV) e as linhas de base (repositório,
   * índice + um ficheiro por linha) não dependem uns dos outros, e a página precisa dos três.
   * Eram três esperas em fila — e a do índice dos envelopes só começava DEPOIS de as linhas de
   * base acabarem, porque quem as pedia era a ponte e ele já chegava resolvido. Medido a
   * 13/11/2026 com 300 ms de latência por viagem: 938 ms para desenhar a lista, em vez dos
   * ~600 ms que a mesma página custa quando as três correm juntas.
   *
   * `curadorias` e `linhasDeBase` podem chegar como VALOR (as bancadas antigas passam assim) ou
   * como PROMESSA (a ponte passou a passar assim): `await` trata os dois casos, e a ordem do
   * `Promise.all` é a das fontes, não a de chegada. */
  const [resumos, curadoriasV, linhasV] = await Promise.all([
    porta.resumosDeEnvelopes(armazenamento, familia.padrao),
    curadorias,
    linhasDeBase,
  ]);
  /* Daqui para baixo os nomes são os de antes — a página não sabe (nem precisa de saber) que
   * chegaram em paralelo. São parâmetros locais: reatribuí-los não toca em quem chamou. */
  curadorias = curadoriasV;
  linhasDeBase = linhasV;
  /* O ESTADO é derivado, e vem de quem o deriva — não é recalculado aqui. Duas derivações da
   * mesma regra divergiriam, e a que ficasse para trás seria a do ecrã. */
  /* O PO PASSOU A TER ESTADO (04/11/2026). Ele era `{}` aqui — e por isso a linha não sabia se o
   * registo tinha sucessor, e o «Apagar» não tinha como existir sem prometer o que o servidor
   * recusaria. O estado é derivado no núcleo (`porta.estadoDoPo`), um por registo. */
  /* O ELENCO VAI JUNTO (08/11/2026) — e é ele que faz a etiqueta dizer a verdade. A anamnese de
   * uma aluna que entrou no elenco DEPOIS de o PO ser gravado aparecia «livre», com «editar» e
   * «apagar» à mão, quando ela já está a ser observada. `porta.vinculos` deriva o vínculo do
   * elenco da turma que o PO observa, e esta página já recebe as duas fontes do facto
   * (`curadorias` e `linhasDeBase`) — não há aqui leitura nova, só a que a página já fazia. */
  const estados = chave === 'anamnese'
    ? await porta.estadosDasAnamneses(armazenamento, { linhas: linhasDeBase, curadorias })
    : chave === 'plano-de-ensino' ? await porta.estadosDosPlanos(armazenamento, { curadorias })
      : chave === 'plano-de-observacao'
        ? await estadosDosPos(armazenamento, resumos) : {};
  /* QUEM DIRIGE CADA TURMA HOJE (12/11/2026) — a única leitura nova desta página, e é das
   * curadorias que ela já recebe. É ela que diz se o plano ou o PO ainda tem turma. */
  const direcao = porta.direcaoDasTurmas(curadorias);

  const todosOsRegistos = resumos
    .map(({ nome, resumo }) => Object.assign({}, resumo, { id: resumo.id || nome.replace(/\.json$/, '') }))
    .sort((a, b) => String(b.gerado_em || b.id).localeCompare(String(a.gerado_em || a.id)));

  /* UMA LINHA POR DOCUMENTO, E NÃO POR ENVELOPE (03/11/2026). Depois de três ajustes do PO, a
   * listagem mostrava três linhas com o mesmo nome — o mecanismo de proveniência a aparecer onde
   * não deve. A regra é do núcleo (`porta.vigentesDaFamilia`), e não desta página: a porta e esta
   * lista têm de dizer o mesmo sobre o que está vigente. O que fica de fora NÃO se perde — os
   * envelopes continuam no acervo, com a cadeia inteira, e a linha diz quantas versões guardou. */
  const FAMILIA_DA_LISTA = {
    anamnese: 'anamnese',
    'plano-de-ensino': 'plano',
    'plano-de-observacao': 'po',
  };
  const vigentes = porta.vigentesDaFamilia(todosOsRegistos, FAMILIA_DA_LISTA[chave]);
  const registos = vigentes.vigentes;
  const historico = vigentes.historico;

  /* O QUE PRECISA DE REVALIDAÇÃO (04/11/2026) — e a lista DIZ, em vez de deixar descobrir.
   *
   * A pesquisadora: «o sistema deve sinalizar de forma evidente que o Plano de Ensino e o Plano
   * de Observação precisam de ser revisados/ajustados após a inserção de uma nova anamnese
   * vinculada ao ciclo». O sinal é DERIVADO (`porta.revalidacaoPendente`): a anamnese de um
   * sujeito é mais recente do que o documento? Não há campo a limpar, e o selo cai sozinho na
   * primeira gravação.
   *
   * Só se calcula para as duas famílias que ele marca — a anamnese não se revalida a si mesma, e
   * o custo é uma leitura por PO, que é a mesma que a linha já faria. */
  let revalidar = null;
  if (chave === 'plano-de-ensino' || chave === 'plano-de-observacao') {
    try {
      /* AS LINHAS DE BASE ENTRAM NA CASCATA (05/11/2026). O primeiro passo é o recorte do corpo,
       * e sem ele a lista mostraria o plano a pedir revisão sem dizer que o recorte que ele fixou
       * já não corresponde ao retrato. A leitura é do KV da Produção, e uma só por página. */
      /* AS DUAS LISTAS JÁ ESTÃO NA MÃO (13/11/2026). Esta cascata lia do KV as duas chaves que a
       * própria chamada já tinha lido — `curadorias` chega como argumento do `pagina()`, e os
       * rascunhos da linha de base chegam em `linhasRascunho`, lidos uma vez pela ponte para os
       * dois consumidores. Eram duas leituras por página do plano de ensino e do PO, e nenhuma
       * trazia informação nova.
       *
       * O RECURSO FICA: quem chamar `pagina()` sem esses valores (as bancadas antigas) continua a
       * lê-los do KV, e o comportamento é o de antes. O que muda é o caminho da produção. */
      const chaveDe = (sufixo) => 'bastidores/' + String(env.ESCOLA_SLUG || escola || '').trim() + '/' + sufixo;
      const lerDoKv = async (sufixo) => {
        try {
          const bruto = await env.PADD_KV.get(chaveDe(sufixo));
          const lista = bruto ? JSON.parse(bruto) : [];
          return Array.isArray(lista) ? lista : [];
        } catch (erro) { return []; }
      };
      const [linhasDaEscola, curadoriasDaEscola] = await Promise.all([
        linhasRascunho !== undefined
          ? Promise.resolve(linhasRascunho).then((l) => (Array.isArray(l) ? l.filter((x) => x && x.id) : []))
          : lerDoKv('linhas-de-base'),
        curadorias !== undefined ? Promise.resolve(curadorias) : lerDoKv('curadorias'),
      ]);
      const r = await porta.revalidacaoPendente(armazenamento, null, linhasDaEscola, curadoriasDaEscola);
      revalidar = r && r.pendentes ? r.pendentes : null;
    } catch (erro) {
      /* Sem o sinal, a lista fica como estava — e não se inventa um estado. Um selo «precisa de
       * revisão» que aparecesse por falha de leitura seria pior do que a sua ausência. */
      revalidar = null;
    }
  }

  /* O MAPA plano → turma. O PO referencia o plano de ensino, e a turma do PO é a do plano. Sai do
   * MESMO índice que já foi lido — não é uma segunda leitura. */
  let turmaDoPlano = null;
  if (chave === 'plano-de-observacao') {
    turmaDoPlano = new Map();
    for (const { resumo } of await porta.resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/)) {
      if (resumo && resumo.id && resumo.turma) turmaDoPlano.set(resumo.id, resumo.turma);
    }
  }

  /* O QUE CADA PO JA GEROU — uma leitura por registo, e nao uma enumeracao.
   *
   * A chave do registo de geracao e `bastidores/<escola>/geracao/<variante>`, e a `variante` e a
   * escola mais a TURMA — a mesma que a linha ja resolveu para o plano que o PO observa. Por
   * isso o mapa se constroi DEPOIS de `turmaDoPlano`: e dele que sai a turma.
   *
   * E `get`, e nunca `list`: a cota diaria da escola ja foi gasta uma vez por uma pagina que
   * enumerava, e a regra que ficou e a de nao voltar a po-la no caminho de uma pagina. */
  let gerados = null;
  if (chave === 'plano-de-observacao' && env.PADD_KV) {
    gerados = new Map();
    const { criarGeracao, chaveDoRegistro } = require('./geracao.js');
    const registro = criarGeracao({ kv: env.PADD_KV, escola: env.ESCOLA_SLUG });
    /* UMA LEITURA POR REGISTO, TODAS AO MESMO TEMPO (13/11/2026). Eram dezanove `get` no KV em
     * fila, um por PO — cada um à espera do anterior. São chaves independentes, e o mapa final
     * é o mesmo; a diferença é a espera, que era a soma. */
    const turmas = registos.map((r) => r.turma
      || (turmaDoPlano ? ((r.plano || []).map((id) => turmaDoPlano.get(id)).filter(Boolean)[0] || '') : ''));
    /* UMA LEITURA POR CHAVE, E NÃO UMA POR REGISTO (13/11/2026). Dois PO da mesma turma pedem o
     * MESMO registo de geração — a chave é `bastidores/<escola>/geracao/<variante>`, e a variante
     * é escola + turma (o professor e o ciclo NÃO entram nela). Ler duas vezes a mesma chave é uma
     * leitura a mais, e com três PO de uma turma eram três.
     *
     * A CHAVE VEM DO MÓDULO QUE A GRAVA (`chaveDoRegistro`), e não de uma segunda derivação aqui:
     * deduplicar pelo contexto seria deduplicar pela coisa errada — dois registos com professores
     * diferentes partilham a chave, e a conta daria dois mesmo havendo um. */
    const contextos = registos.map((r, i) => {
      const turma = turmas[i];
      if (!turma) return null;
      /* A ESCOLA VAI NO CONTEXTO. A variante do registo e `escola-turma` (`varianteDoContexto`),
       * e o `escola` que ele le e o do CONTEXTO, nao o do modulo: sem esta chave a variante saia
       * `-bale-nivel-2-teste-2` e o registo nunca era encontrado. */
      return { escola: env.ESCOLA_SLUG, professor: r.professor || '', ciclo: r.ciclo || '', turma };
    });
    const chaves = contextos.map((c) => (c ? chaveDoRegistro(env.ESCOLA_SLUG, c) : null));
    const porChave = new Map();
    await Promise.all([...new Set(chaves.filter(Boolean))]
      .map((chave) => registro.lerRegistroPorChave(chave)
        .then((valor) => porChave.set(chave, valor))
        .catch(() => porChave.set(chave, null))));
    const lidos = chaves.map((chave) => (chave ? porChave.get(chave) || null : null));
    registos.forEach((r, i) => { if (lidos[i]) gerados.set(r.id, lidos[i]); });
  }

  /* A LINHA DE BASE ENTRA NA LISTA DA ANAMNESE (05/11/2026). É a fonte do elenco desde o passo 5,
   * e é dela que saem a turma e a etiqueta «linha de base «…»» de cada aluna. Sem ela — quando
   * quem chama não a passa, como nas bancadas antigas —, a turma continua a vir só da curadoria, e
   * é esse o comportamento de antes: a lista não inventa o que não conseguiu ler. */
  const filiacao = linhaDeBase.filiacaoDasAlunas(chave === 'anamnese' ? linhasDeBase : [], curadorias);
  /* A LEITURA QUE A DERIVAÇÃO DA DESLIGADA PRECISA (08/11/2026): as linhas vigentes e a lista de
   * curadorias — com as substituídas, que são a memória de quem já esteve numa Turma. É a mesma
   * leitura que a página já fez; não há aqui uma chamada nova. */
  const memoriaDaAluna = chave === 'anamnese'
    ? { linhas: Array.isArray(linhasDeBase) ? linhasDeBase : [], curadorias }
    : null;
  const linhas = linhasDe(chave, registos, estados, turmasDasAlunas(curadorias, linhasDeBase),
    turmaDoPlano, { gerados, historico, revalidar }, filiacao, memoriaDaAluna, direcao);
  const titulo = familia.titulo;
  const pedido = caminho.endsWith('/') ? caminho : caminho + '/';

  return {
    titulo,
    html: listas.paginaDeLista({
      titulo,
      subtitulo: escola ? escola + ' · ' + (linhas.length === 1
        ? '1 ' + familia.singular : linhas.length + ' ' + familia.plural) : familia.subtitulo,
      nav: nav.desenhar(menu, pedido, { titulo }) || '',
      itens: linhas,
      vazio: familia.vazio,
      campos: ['busca', 'turma'],
      singular: familia.singular,
      plural: familia.plural,
      dica: 'pelo nome, pela turma ou pelo professor',
      /* O PAINEL DO ATO SUBSTITUI O BOTÃO DO TOPO (25/10/2026). O `acao` continua a existir em
       * `paginaDeLista` — as outras cinco listas usam-no —, mas esta página não o passa: criar
       * agora tem contexto. Um botão «Nova anamnese» no topo, ao lado de um painel que também
       * cria, seriam duas portas para o mesmo ato, e a segunda a não levar o contexto. */
      painel: painelDoAto(chave, escola),
      /* O RÓTULO DE CRIAR É O DA FONTE («Criar anamnese», «Novo plano de ensino»…), e o
       * endereço da ficha vem do mesmo lugar. Sem `acao`: o botão do topo não existe nesta
       * página — quem cria é o menu, com o contexto. */
      criar: familia.acaoDeCriar,
      ficha: familia.porta + 'api/ficha?formato=html',
      script: scriptDoPainel(chave, escola),
    }),
  };
}

/* `painelDoAto` SAI TAMBÉM, e não é conveniência de teste (05/11/2026).
 *
 * O painel é a única superfície onde os campos do ato são decididos, e ele é PURO: recebe a chave
 * da família e a escola, e devolve marcação. Devolvê-lo permite provar, sem navegador, que a
 * anamnese não desenha o campo «ciclo» e que o plano de ensino continua a desenhá-lo — que é
 * exactamente o par que a correcção de 05/11 tinha de garantir. Um `regex` sobre o ficheiro
 * provaria a condição; isto prova o RESULTADO dela. */
module.exports = {
  pagina, FAMILIAS, listaDaPorta, turmaDaAluna, turmasDasAlunas, nomeDoProfessor, dia, acoesDaLinha,
  painelDoAto,
  /* O SCRIPT DO PAINEL, EXPORTADO PELO MESMO MOTIVO QUE O `painelDoAto` (16/11/2026): ele é puro
   * — recebe a chave da família e a escola e devolve marcação — e é a única superfície onde o
   * formulário da porta decide o que mostrar. Devolvê-lo permite COMPILÁ-LO na bancada, sem
   * navegador, e é isso que impede que um erro de sintaxe dentro dele chegue ao ar sem aviso: foi
   * o que aconteceu ao botão «Habilitar» do painel, no mesmo dia. */
  scriptDoPainel,
};
