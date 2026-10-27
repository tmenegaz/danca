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
const { criarArmazenamento } = require('./cloudflare.js');

const esc = (t) => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** `2026-10-20T14:32` → `20/10/2026`. A data que se lê numa listagem é o DIA. */
function dia(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}

/** O nome de quem fez — o do slug quando não há o nome escrito no formulário. */
function nomeDoProfessor(registo) {
  const nome = String(registo.professorNome || '').trim();
  if (nome) return nome;
  const slug = String(registo.professor || '').trim();
  if (!slug) return '';
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
  if (chave === 'plano-de-ensino' && estado && estado.estado === 'solta') {
    return [['Editar', f.porta + consulta(comEdicao(registo)), '']];
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
      /* O CARIMBO VAI NO ENDEREÇO (26/10/2026). Sem ele a porta abria um formulário vazio com o
       * contexto: quem clicava «Ajustar» não via o registo que ia ajustar, e a barra não tinha
       * como dizer o que se estava a fazer. Com `ajustar=<id>`, a porta carrega o envelope e
       * marca o gesto (`DERIVANDO`), que é o `ajuste_de` do elo novo. */
      return [['Ajustar', f.porta + consulta({ fonte: f.fonte, ajustar: registo.id,
        professor: registo.professor, ciclo: registo.ciclo, aluna: registo.aluna }), 'secundario',
        'acrescenta um elo novo; o registo anterior permanece']];
    }
    return [
      ['Editar', f.porta + consulta(comEdicao(registo)), ''],
      ['Apagar', f.porta + consulta(comEdicao(registo)), 'secundario',
        'a anamnese solta pode ser apagada; a vinculada, não'],
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
  /* SEM `details` E SEM CAIXINHA (25/10/2026, terceira leitura). O cabeçalho — o título, o resumo
   * e a seta — é agora o do BLOCO que contém este painel (`details.bloco-lista`, em
   * `lista-html.js`). Dois botões para abrir a mesma coisa dentro do mesmo container eram o
   * segundo clique que o pedido recusa; e o resumo continua, no sítio onde se lê. */
  return `
    <div class="campos-do-ato">
      <span class="campo"><label class="campo-rotulo" for="ato-professor">professor</label>
        <select id="ato-professor" data-ato="professor"><option value="">— escolher —</option></select></span>
      <span class="campo"><label class="campo-rotulo" for="ato-ciclo">ciclo</label>
        <input type="text" id="ato-ciclo" data-ato="ciclo" value="" inputmode="numeric"></span>
      ${ehAnamnese ? `<span class="campo"><label class="campo-rotulo" for="ato-aluna">aluna</label>
        <select id="ato-aluna" data-ato="aluna"><option value="">— nenhuma —</option></select></span>` : ''}
      ${ehPlano ? `<span class="campo"><label class="campo-rotulo" for="ato-turma">turma</label>
        <select id="ato-turma" data-ato="turma"><option value="">— escolher —</option></select></span>` : ''}
      ${chave === 'plano-de-observacao' ? `<span class="campo"><label class="campo-rotulo" for="ato-plano">plano de ensino observado</label>
        <select id="ato-plano" data-ato="plano"><option value="">— escolher —</option></select></span>
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
    if (!valor('ciclo')) falta.push('ciclo');
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
    if (estado) {
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
      } else if (falta.length) {
        estado.hidden = false;
        estado.setAttribute('data-falta', 'sim');
        estado.textContent = 'Falta o contexto do ato: ' + falta.join(', ') + '.';
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

  function carregarTurmas() {
    if (!CFG.ehPlano) return Promise.resolve();
    return pedir('/api/bastidores/turmas').then(function (r) {
      var lista = (r.dados && (r.dados.turmas || r.dados.lista)) || [];
      encher(campo('turma'), lista.map(function (t) {
        var nome = typeof t === 'string' ? t : (t.nome || t.turma || '');
        return { valor: nome, rotulo: nome };
      }).filter(function (t) { return t.valor; }), null, valor('turma') || ATOS.turma);
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
      pintarLeituraDaTurma();
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
      encher(campo('plano'), PLANOS.map(function (p) {
        var turma = p.turma ? ' · ' + p.turma : '';
        return { valor: p.carimbo || p.valor, rotulo: (p.rotulo || p.carimbo) + turma };
      }), null, valor('plano') || ATOS.plano);
      pintarLeituraDaTurma();
    });
  }

  /* A LEITURA DIZ A TURMA DO PLANO ESCOLHIDO — e é o único lugar onde ela aparece, porque é o
   * plano que a decide. Sem plano escolhido não há turma a mostrar, e o «—» é a verdade. */
  function pintarLeituraDaTurma() {
    var alvo = $('[data-turma-leitura]');
    if (!alvo) return;
    var escolhido = valor('plano');
    var turma = '';
    for (var i = 0; i < PLANOS.length; i += 1) {
      if (String(PLANOS[i].carimbo || PLANOS[i].valor) === escolhido) { turma = PLANOS[i].turma || ''; break; }
    }
    alvo.textContent = turma || '—';
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
      SENHA = r.ok ? 'ok' : 'errada';
      pintar();
    });
  }

  /* O DESTINO — os mesmos parâmetros que a linha do cartão usa, e que a porta lê. */
  function endereco() {
    var q = [];
    if (valor('professor')) q.push('professor=' + encodeURIComponent(valor('professor')));
    if (valor('ciclo')) q.push('ciclo=' + encodeURIComponent(valor('ciclo')));
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
        ciclo: valor('ciclo'), aluna: valor('aluna'), plano: valor('plano'),
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
      pintar();
      gravarContexto();
      if (nome === 'professor') {
        carregarAlunas().then(pintar);
        carregarCuradoria().then(pintar);
        /* Trocar de professor troca a estante, e a escolha anterior deixa de valer: o plano de
         * um professor não é observável pelo outro. */
        var sel = campo('plano');
        if (sel) sel.value = '';
        carregarPlanos().then(pintar);
      }
      if (nome === 'plano') pintarLeituraDaTurma();
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
function linhasDe(familia, registos, estados, turmasDaAluna, turmaDoPlano, gerados) {
  return registos.map((r) => {
    const estado = estados[r.id] || {};
    const quem = nomeDoProfessor(r);
    const quando = dia(r.gerado_em);
    if (familia === 'anamnese') {
      const turma = turmasDaAluna.get(r.aluna) || '';
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
         *   · nova      — a aluna ainda não está em curadoria nenhuma; é a porta de entrada;
         *   · livre     — a aluna tem turma e nenhum PO a usa; edita-se e apaga-se. */
        selo: estado.vinculada ? 'vinculada' : (r.aluna && !turma ? 'nova' : 'livre'),
        /* A CLASSE É A COR, e a cor não distingue «nova» de «livre» de propósito: as duas dizem
         * a mesma coisa a quem vai mexer no registo — pode-se editar. O que distingue é o TEXTO,
         * que é onde está o que a pessoa precisa de saber. Inventar um estado de selo novo na
         * folha («nova») para uma diferença que não muda o gesto seria desenho a mais. */
        seloClasse: estado.vinculada ? 'vinculada' : 'livre',
        turma: turma,
        professor: quem,
        contexto: turma ? 'vinculada à turma ' + turma : 'aluna nova — sem turma',
        acoes: acoesDaLinha('anamnese', r, estado),
        caixas: [
          { rotulo: 'Turma', valor: turma || 'sem turma',
            painel: listaDePares([
              ['Turma', turma || 'sem turma'],
              ['Estado', estado.vinculada ? 'vinculada — um PO já a usa' : (estado.legado ? 'legado' : 'solta')]],
              turma
                ? 'A turma vem da curadoria, que é quem matricula a aluna.'
                : 'Aluna nova pode ser entrevistada por qualquer professor. O selo é derivado: '
                  + 'no dia em que entrar numa curadoria, deixa de o ser.') },
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
    const turma = r.turma || doPlano || '';
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
    const fatos = gerado
      ? [
        'ciclo ' + (gerado.ciclo || r.ciclo || '—'),
        (gerado.documentos ? gerado.documentos.length : 0) + ' documento(s) gerados',
        gerado.em ? 'em ' + dia(gerado.em) : '',
      ].filter(Boolean)
      : [];
    return {
      nome: (familia === 'plano-de-ensino' ? 'Plano de ensino — ' : 'Plano de Observação — ')
        + (turma || 'turma não declarada'),
      /* A MESMA PORTA PARA LER, nas três famílias (27/10/2026). O PO passou a ter folha hoje —
       * até aqui não tinha nenhuma, e a estante abria o JSON. */
      ler: fichaDeLeitura(familia, r),
      selo: estado.estado || (gerado ? 'gerado' : ''),
      seloClasse: estado.estado === 'vinculada' ? 'vinculada'
        : estado.estado === 'legado' ? 'discreto'
          : gerado ? 'vigente' : 'livre',
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
            ...(gerado ? [['Ciclo gerado', String(gerado.ciclo || r.ciclo || '—')
              + (gerado.documentos && gerado.documentos.length
                ? ' · ' + gerado.documentos.map((d) => (d && d.nome) || d).join(', ') : '')]] : [])]) },
        { rotulo: 'Quem fez', valor: quem || '—',
          painel: listaDePares([['Professor', quem || '—']],
            'É o professor da turma: o plano e a observação são dele sobre a turma dele.') },
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
async function pagina(caminho, { env, menu, escola, curadorias }) {
  const chave = Object.keys(FAMILIAS).find((k) => caminho === '/area-do-professor/' + k + '/'
    || caminho === '/area-do-professor/' + k);
  if (!chave) return null;
  const familia = FAMILIAS[chave];
  if (!env || !env.PADD_KV) return null;
  // O MESMO armazenamento da porta (estático → KV), e não uma segunda leitura do KV: uma lista
  // que lesse por um caminho diferente do da porta mostraria registos que a porta não encontra.
  const armazenamento = criarArmazenamento(env);

  const resumos = await porta.resumosDeEnvelopes(armazenamento, familia.padrao);
  /* O ESTADO é derivado, e vem de quem o deriva — não é recalculado aqui. Duas derivações da
   * mesma regra divergiriam, e a que ficasse para trás seria a do ecrã. */
  const estados = chave === 'anamnese'
    ? await porta.estadosDasAnamneses(armazenamento)
    : chave === 'plano-de-ensino' ? await porta.estadosDosPlanos(armazenamento) : {};

  const registos = resumos
    .map(({ nome, resumo }) => Object.assign({}, resumo, { id: resumo.id || nome.replace(/\.json$/, '') }))
    .sort((a, b) => String(b.gerado_em || b.id).localeCompare(String(a.gerado_em || a.id)));

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
    const { criarGeracao } = require('./geracao.js');
    const registro = criarGeracao({ kv: env.PADD_KV, escola: env.ESCOLA_SLUG });
    for (const r of registos) {
      const turma = r.turma
        || (turmaDoPlano ? ((r.plano || []).map((id) => turmaDoPlano.get(id)).filter(Boolean)[0] || '') : '');
      if (!turma) continue;
      /* A ESCOLA VAI NO CONTEXTO. A variante do registo e `escola-turma` (`varianteDoContexto`),
       * e o `escola` que ele le e o do CONTEXTO, nao o do modulo: sem esta chave a variante saia
       * `-bale-nivel-2-teste-2` e o registo nunca era encontrado. */
      const g = await registro.lerRegistro({
        escola: env.ESCOLA_SLUG, professor: r.professor || '', ciclo: r.ciclo || '', turma,
      });
      if (g) gerados.set(r.id, g);
    }
  }

  const linhas = linhasDe(chave, registos, estados, turmaDaAluna(curadorias), turmaDoPlano, gerados);
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

module.exports = { pagina, FAMILIAS, listaDaPorta, turmaDaAluna, nomeDoProfessor, dia };
